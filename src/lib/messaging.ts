/**
 * Real user-to-user messaging + a shared consultant queue.
 *
 * A "direct" thread is a 1:1 conversation between user_id and peer_id — both see
 * it and messages.sender_id is whoever wrote each line.
 *
 * A "consultant" thread (kind='consultant') is a support request: user_id is the
 * requester and peer_id is NULL until an admin replies and *claims* it. Every
 * admin can see and answer unclaimed consultant requests; the first admin to
 * reply becomes the assigned peer so two admins don't answer the same person.
 *
 * Unread is tracked per user in `thread_reads` by the highest message id seen —
 * integer comparison, identical on Postgres and SQLite.
 */
import { q, q1, run } from "@/lib/db";
import { notify } from "@/lib/notify";

const CONSULTANT_NAME = "E-Access Consultant";
const CONSULTANT_COLOR = "#1B1F4E";

export type Counterpart = {
  id: number | null;
  full_name: string;
  role: string;
  avatar_color: string;
  avatar_url: string | null;
  verified: number;
};

export type InboxThread = Counterpart & {
  id: number;
  kind: string;
  counterpart_id: number | null;
  counterpart_name: string;
  counterpart_role: string;
  counterpart_color: string;
  counterpart_url: string | null;
  verified: number;
  listing_id: number | null;
  listing_title: string | null;
  last_body: string | null;
  last_at: string | null;
  last_id: number | null;
  unread: number;
};

export type ChatMessage = {
  id: number;
  thread_id: number;
  sender_id: number;
  body: string;
  created_at: string;
};

type ThreadRow = {
  id: number;
  user_id: number;
  peer_id: number | null;
  kind: string;
  listing_id: number | null;
  listing_title: string | null;
  last_body: string | null;
  last_at: string | null;
  last_id: number | null;
  unread: number | string;
};

type UserRow = { id: number; full_name: string; role: string; avatar_color: string; avatar_url: string | null; verified: number | string };

async function usersByIds(ids: number[]): Promise<Map<number, UserRow>> {
  const map = new Map<number, UserRow>();
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return map;
  const ph = uniq.map((_, i) => `$${i + 1}`).join(",");
  const rows = await q<UserRow>(
    `SELECT u.id, u.full_name, u.role, u.avatar_color, u.avatar_url,
        CASE WHEN u.role IN ('agent','admin')
             OR EXISTS (SELECT 1 FROM agents a WHERE a.user_id = u.id AND a.status = 'approved')
             THEN 1 ELSE 0 END AS verified
     FROM users u WHERE u.id IN (${ph})`,
    uniq
  );
  for (const r of rows) map.set(Number(r.id), r);
  return map;
}

/** For a thread, who is the "other side" from meId's perspective. */
function counterpartId(t: { user_id: number; peer_id: number | null; kind: string }, meId: number): { id: number | null; synthetic: boolean } {
  if (t.kind === "consultant") {
    // the requester always sees a single "E-Access Consultant" identity, whichever
    // admin actually answers; admins see the real requester.
    if (Number(t.user_id) === meId) return { id: null, synthetic: true };
    return { id: Number(t.user_id), synthetic: false };
  }
  return { id: Number(t.user_id) === meId ? (t.peer_id ? Number(t.peer_id) : null) : Number(t.user_id), synthetic: false };
}

function describe(id: number | null, synthetic: boolean, users: Map<number, UserRow>): Counterpart {
  if (synthetic || id === null) {
    return { id: null, full_name: CONSULTANT_NAME, role: "admin", avatar_color: CONSULTANT_COLOR, avatar_url: null, verified: 1 };
  }
  const u = users.get(id);
  if (!u) return { id, full_name: "E-Access member", role: "user", avatar_color: "#64748b", avatar_url: null, verified: 0 };
  return { id, full_name: u.full_name, role: u.role, avatar_color: u.avatar_color, avatar_url: u.avatar_url, verified: Number(u.verified) };
}

/** Direct 1:1 thread between two users — find or create. */
export async function getOrCreateThread(meId: number, peerId: number, listingId?: number | null): Promise<number> {
  if (!peerId || peerId === meId) throw new Error("invalid-peer");
  const existing = await q1<{ id: number }>(
    `SELECT id FROM threads
      WHERE kind = 'direct' AND ((user_id = $1 AND peer_id = $2) OR (user_id = $2 AND peer_id = $1))
      ORDER BY id ASC LIMIT 1`,
    [meId, peerId]
  );
  if (existing) {
    if (listingId) await run("UPDATE threads SET listing_id = COALESCE(listing_id, $1) WHERE id = $2", [listingId, Number(existing.id)]);
    return Number(existing.id);
  }
  const peer = await q1<{ full_name: string; role: string }>("SELECT full_name, role FROM users WHERE id = $1", [peerId]);
  const row = await q1<{ id: number }>(
    `INSERT INTO threads (user_id, peer_id, listing_id, kind, counterpart_name, counterpart_role)
     VALUES ($1,$2,$3,'direct',$4,$5) RETURNING id`,
    [meId, peerId, listingId ?? null, peer?.full_name ?? "E-Access member", peer?.role ?? "user"]
  );
  return Number(row!.id);
}

/** The user's shared consultant request thread — find or create (peer_id stays NULL until claimed). */
export async function getOrCreateConsultantThread(meId: number): Promise<number> {
  const existing = await q1<{ id: number }>(
    "SELECT id FROM threads WHERE kind = 'consultant' AND user_id = $1 ORDER BY id ASC LIMIT 1",
    [meId]
  );
  if (existing) return Number(existing.id);
  const row = await q1<{ id: number }>(
    `INSERT INTO threads (user_id, peer_id, kind, counterpart_name, counterpart_role)
     VALUES ($1, NULL, 'consultant', $2, 'admin') RETURNING id`,
    [meId, CONSULTANT_NAME]
  );
  // let every admin know a request came in
  await notifyAdmins(meId, "New consultant request", "A user asked to speak with a consultant.");
  return Number(row!.id);
}

async function adminIds(exclude?: number): Promise<number[]> {
  const rows = await q<{ id: number }>("SELECT id FROM users WHERE role = 'admin'");
  return rows.map((r) => Number(r.id)).filter((id) => id !== exclude);
}
async function notifyAdmins(exclude: number, title: string, body: string) {
  for (const id of await adminIds(exclude)) {
    await notify(id, "message", title, body, "/dashboard/messages");
  }
}

/** Inbox for a user; admins additionally see the shared consultant queue. */
export async function listInbox(meId: number, isAdmin: boolean): Promise<InboxThread[]> {
  const rows = await q<ThreadRow>(
    `SELECT t.id, t.user_id, t.peer_id, t.kind, t.listing_id,
        (SELECT l.title FROM listings l WHERE l.id = t.listing_id) AS listing_title,
        (SELECT m.body FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_body,
        (SELECT m.created_at FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_at,
        (SELECT MAX(m.id) FROM messages m WHERE m.thread_id = t.id) AS last_id,
        (SELECT COUNT(*) FROM messages m WHERE m.thread_id = t.id AND m.sender_id <> $1
           AND m.id > COALESCE((SELECT r.last_read_id FROM thread_reads r WHERE r.thread_id = t.id AND r.user_id = $1), 0)) AS unread
      FROM threads t
      WHERE ((t.user_id = $1 OR t.peer_id = $1) AND (t.peer_id IS NOT NULL OR t.kind = 'consultant'))
         OR ($2 = 1 AND t.kind = 'consultant')
      ORDER BY COALESCE((SELECT MAX(m.id) FROM messages m WHERE m.thread_id = t.id), 0) DESC, t.id DESC`,
    [meId, isAdmin ? 1 : 0]
  );

  const cps = rows.map((t) => counterpartId(t, meId));
  const users = await usersByIds(cps.map((c) => c.id).filter((x): x is number => x !== null));

  return rows.map((t, i) => {
    const c = describe(cps[i].id, cps[i].synthetic, users);
    return {
      id: Number(t.id),
      kind: t.kind,
      counterpart_id: c.id,
      counterpart_name: c.full_name,
      counterpart_role: c.role,
      counterpart_color: c.avatar_color,
      counterpart_url: c.avatar_url,
      verified: c.verified,
      // Counterpart fields (flat) for convenience
      full_name: c.full_name,
      role: c.role,
      avatar_color: c.avatar_color,
      avatar_url: c.avatar_url,
      listing_id: t.listing_id === null ? null : Number(t.listing_id),
      listing_title: t.listing_title,
      last_body: t.last_body,
      last_at: t.last_at,
      last_id: t.last_id === null ? null : Number(t.last_id),
      unread: Number(t.unread),
    };
  });
}

/** Whether the user may view/participate in the thread (admins may access consultant threads). */
export async function participantThread(threadId: number, meId: number, isAdmin: boolean) {
  return q1<{ id: number; user_id: number; peer_id: number | null; kind: string; listing_id: number | null }>(
    `SELECT id, user_id, peer_id, kind, listing_id FROM threads
      WHERE id = $1 AND (user_id = $2 OR peer_id = $2 OR ($3 = 1 AND kind = 'consultant'))`,
    [threadId, meId, isAdmin ? 1 : 0]
  );
}

export async function threadCounterpart(
  thread: { user_id: number; peer_id: number | null; kind: string },
  meId: number
): Promise<Counterpart> {
  const c = counterpartId(thread, meId);
  const users = c.id ? await usersByIds([c.id]) : new Map<number, UserRow>();
  return describe(c.id, c.synthetic, users);
}

export async function threadMessages(threadId: number): Promise<ChatMessage[]> {
  return q<ChatMessage>("SELECT * FROM messages WHERE thread_id = $1 ORDER BY id ASC", [threadId]);
}

export async function markRead(threadId: number, meId: number) {
  const top = await q1<{ m: number | null }>("SELECT MAX(id) AS m FROM messages WHERE thread_id = $1", [threadId]);
  const lastId = Number(top?.m ?? 0);
  await run(
    `INSERT INTO thread_reads (thread_id, user_id, last_read_id) VALUES ($1,$2,$3)
     ON CONFLICT (thread_id, user_id) DO UPDATE SET last_read_id = $3`,
    [threadId, meId, lastId]
  );
}

/** Post a message; handles consultant claiming and the right notifications. */
export async function postMessage(threadId: number, meId: number, meName: string, body: string, isAdmin: boolean): Promise<ChatMessage[]> {
  const thread = await participantThread(threadId, meId, isAdmin);
  if (!thread) throw new Error("not-a-participant");

  const requesterId = Number(thread.user_id);
  const isConsultant = thread.kind === "consultant";
  const senderIsRequester = requesterId === meId;

  // First admin to reply to an unclaimed consultant request claims it.
  if (isConsultant && !thread.peer_id && isAdmin && !senderIsRequester) {
    await run("UPDATE threads SET peer_id = $1 WHERE id = $2 AND peer_id IS NULL", [meId, threadId]);
    thread.peer_id = meId;
  }

  await run("INSERT INTO messages (thread_id, sender_id, body) VALUES ($1,$2,$3)", [threadId, meId, body]);
  await markRead(threadId, meId);

  const preview = body.length > 80 ? body.slice(0, 77) + "…" : body;
  if (isConsultant) {
    if (senderIsRequester) {
      if (thread.peer_id) await notify(Number(thread.peer_id), "message", `New message from ${meName}`, preview, "/dashboard/messages");
      else await notifyAdmins(meId, `New consultant message from ${meName}`, preview);
    } else {
      await notify(requesterId, "message", "New message from E-Access Consultant", preview, "/dashboard/messages");
    }
  } else {
    const peerId = requesterId === meId ? Number(thread.peer_id) : requesterId;
    if (peerId && peerId !== meId) await notify(peerId, "message", `New message from ${meName}`, preview, "/dashboard/messages");
  }
  return threadMessages(threadId);
}

/** Total unread for the sidebar badge (admins include the consultant queue). */
export async function totalUnread(meId: number, isAdmin: boolean): Promise<number> {
  const row = await q1<{ c: number | string }>(
    `SELECT COUNT(*) AS c FROM messages m
      JOIN threads t ON t.id = m.thread_id
      WHERE (((t.user_id = $1 OR t.peer_id = $1) AND (t.peer_id IS NOT NULL OR t.kind = 'consultant'))
             OR ($2 = 1 AND t.kind = 'consultant'))
        AND m.sender_id <> $1
        AND m.id > COALESCE((SELECT r.last_read_id FROM thread_reads r WHERE r.thread_id = t.id AND r.user_id = $1), 0)`,
    [meId, isAdmin ? 1 : 0]
  );
  return Number(row?.c ?? 0);
}

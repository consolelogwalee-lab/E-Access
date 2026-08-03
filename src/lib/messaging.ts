/**
 * Real user-to-user messaging.
 *
 * A thread is a single conversation between two real users: `user_id` (whoever
 * started it) and `peer_id` (the other person). Both see the same thread and the
 * same messages. `messages.sender_id` is the real id of whoever wrote each line.
 *
 * Unread is tracked per user in `thread_reads` by the highest message id that
 * user has seen — integer comparison, so it behaves identically on Postgres and
 * SQLite regardless of timestamp formatting.
 */
import { q, q1, run } from "@/lib/db";
import { notify } from "@/lib/notify";

export type InboxThread = {
  id: number;
  counterpart_id: number;
  counterpart_name: string;
  counterpart_role: string;
  counterpart_color: string;
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

/** Find the existing 1:1 thread between two users, or create it. Returns the thread id. */
export async function getOrCreateThread(
  meId: number,
  peerId: number,
  listingId?: number | null
): Promise<number> {
  if (!peerId || peerId === meId) throw new Error("invalid-peer");

  const existing = await q1<{ id: number }>(
    `SELECT id FROM threads
      WHERE (user_id = $1 AND peer_id = $2) OR (user_id = $2 AND peer_id = $1)
      ORDER BY id ASC LIMIT 1`,
    [meId, peerId]
  );
  if (existing) {
    if (listingId) {
      await run("UPDATE threads SET listing_id = COALESCE(listing_id, $1) WHERE id = $2", [
        listingId,
        Number(existing.id),
      ]);
    }
    return Number(existing.id);
  }

  const peer = await q1<{ full_name: string; role: string }>(
    "SELECT full_name, role FROM users WHERE id = $1",
    [peerId]
  );
  const row = await q1<{ id: number }>(
    `INSERT INTO threads (user_id, peer_id, listing_id, counterpart_name, counterpart_role)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [meId, peerId, listingId ?? null, peer?.full_name ?? "E-Access member", peer?.role ?? "user"]
  );
  return Number(row!.id);
}

/** Everyone the current user is in a conversation with, newest activity first. */
export async function listInbox(meId: number): Promise<InboxThread[]> {
  const rows = await q<InboxThread>(
    `SELECT
        t.id,
        u.id            AS counterpart_id,
        u.full_name     AS counterpart_name,
        u.role          AS counterpart_role,
        u.avatar_color  AS counterpart_color,
        CASE WHEN u.role IN ('agent','admin')
             OR EXISTS (SELECT 1 FROM agents a WHERE a.user_id = u.id AND a.status = 'approved')
             THEN 1 ELSE 0 END AS verified,
        t.listing_id,
        (SELECT l.title FROM listings l WHERE l.id = t.listing_id) AS listing_title,
        (SELECT m.body FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_body,
        (SELECT m.created_at FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last_at,
        (SELECT MAX(m.id) FROM messages m WHERE m.thread_id = t.id) AS last_id,
        (SELECT COUNT(*) FROM messages m
           WHERE m.thread_id = t.id AND m.sender_id <> $1
             AND m.id > COALESCE((SELECT r.last_read_id FROM thread_reads r
                                    WHERE r.thread_id = t.id AND r.user_id = $1), 0)) AS unread
      FROM threads t
      JOIN users u ON u.id = CASE WHEN t.user_id = $1 THEN t.peer_id ELSE t.user_id END
      WHERE (t.user_id = $1 OR t.peer_id = $1) AND t.peer_id IS NOT NULL
      ORDER BY COALESCE((SELECT MAX(m.id) FROM messages m WHERE m.thread_id = t.id), 0) DESC, t.id DESC`,
    [meId]
  );
  // COUNT() comes back as a string on Postgres — normalise numeric fields for the UI.
  return rows.map((r) => ({
    ...r,
    unread: Number(r.unread),
    verified: Number(r.verified),
    counterpart_id: Number(r.counterpart_id),
    last_id: r.last_id === null ? null : Number(r.last_id),
  }));
}

/** True if the user is one of the two participants in the thread. */
export async function participantThread(threadId: number, meId: number) {
  return q1<{ id: number; user_id: number; peer_id: number | null; listing_id: number | null }>(
    "SELECT id, user_id, peer_id, listing_id FROM threads WHERE id = $1 AND (user_id = $2 OR peer_id = $2)",
    [threadId, meId]
  );
}

export async function threadMessages(threadId: number): Promise<ChatMessage[]> {
  return q<ChatMessage>("SELECT * FROM messages WHERE thread_id = $1 ORDER BY id ASC", [threadId]);
}

/** Mark every message in the thread as read for this user. */
export async function markRead(threadId: number, meId: number) {
  const top = await q1<{ m: number | null }>("SELECT MAX(id) AS m FROM messages WHERE thread_id = $1", [
    threadId,
  ]);
  const lastId = Number(top?.m ?? 0);
  await run(
    `INSERT INTO thread_reads (thread_id, user_id, last_read_id) VALUES ($1,$2,$3)
     ON CONFLICT (thread_id, user_id) DO UPDATE SET last_read_id = $3`,
    [threadId, meId, lastId]
  );
}

/** Post a message from `meId` into a thread they belong to, and notify the other person. */
export async function postMessage(
  threadId: number,
  meId: number,
  meName: string,
  body: string
): Promise<ChatMessage[]> {
  const thread = await participantThread(threadId, meId);
  if (!thread) throw new Error("not-a-participant");

  await run("INSERT INTO messages (thread_id, sender_id, body) VALUES ($1,$2,$3)", [
    threadId,
    meId,
    body,
  ]);
  // sender has, by definition, read up to their own latest message
  await markRead(threadId, meId);

  const peerId = Number(thread.user_id) === meId ? Number(thread.peer_id) : Number(thread.user_id);
  if (peerId && peerId !== meId) {
    const preview = body.length > 80 ? body.slice(0, 77) + "…" : body;
    await notify(peerId, "message", `New message from ${meName}`, preview, "/dashboard/messages");
  }
  return threadMessages(threadId);
}

/** Total unread messages across all of a user's conversations (for the sidebar badge). */
export async function totalUnread(meId: number): Promise<number> {
  const row = await q1<{ c: number | string }>(
    `SELECT COUNT(*) AS c FROM messages m
      JOIN threads t ON t.id = m.thread_id
      WHERE (t.user_id = $1 OR t.peer_id = $1) AND t.peer_id IS NOT NULL
        AND m.sender_id <> $1
        AND m.id > COALESCE((SELECT r.last_read_id FROM thread_reads r
                               WHERE r.thread_id = t.id AND r.user_id = $1), 0)`,
    [meId]
  );
  return Number(row?.c ?? 0);
}

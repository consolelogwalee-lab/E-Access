import { NextResponse } from "next/server";
import { q1 } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { participantThread, threadMessages, markRead, postMessage } from "@/lib/messaging";

// Counterpart display info for the open conversation.
async function counterpart(threadUserId: number, threadPeerId: number | null, meId: number) {
  const otherId = threadUserId === meId ? threadPeerId : threadUserId;
  if (!otherId) return null;
  return q1<{
    id: number;
    full_name: string;
    role: string;
    avatar_color: string;
    verified: number;
  }>(
    `SELECT u.id, u.full_name, u.role, u.avatar_color,
        CASE WHEN u.role IN ('agent','admin')
             OR EXISTS (SELECT 1 FROM agents a WHERE a.user_id = u.id AND a.status = 'approved')
             THEN 1 ELSE 0 END AS verified
     FROM users u WHERE u.id = $1`,
    [otherId]
  );
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const thread = await participantThread(Number(id), user.id);
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const messages = await threadMessages(Number(id));
  await markRead(Number(id), user.id);
  const peer = await counterpart(Number(thread.user_id), thread.peer_id, user.id);
  const listing = thread.listing_id
    ? await q1<{ title: string }>("SELECT title FROM listings WHERE id = $1", [thread.listing_id])
    : null;

  return NextResponse.json({
    messages,
    meId: user.id,
    counterpart: peer,
    listing_title: listing?.title ?? null,
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const body = typeof b.body === "string" ? b.body.trim() : "";
  if (!body) return NextResponse.json({ error: "Empty message." }, { status: 400 });

  try {
    const messages = await postMessage(Number(id), user.id, user.full_name, body);
    return NextResponse.json({ ok: true, messages });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}

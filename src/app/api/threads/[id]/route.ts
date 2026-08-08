import { NextResponse } from "next/server";
import { q1 } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { participantThread, threadMessages, threadCounterpart, markRead, postMessage } from "@/lib/messaging";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const isAdmin = user.role === "admin";
  const thread = await participantThread(Number(id), user.id, isAdmin);
  if (!thread) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const messages = await threadMessages(Number(id));
  await markRead(Number(id), user.id);
  const peer = await threadCounterpart(thread, user.id);
  const listing = thread.listing_id
    ? await q1<{ title: string }>("SELECT title FROM listings WHERE id = $1", [thread.listing_id])
    : null;

  return NextResponse.json({
    messages,
    meId: user.id,
    counterpart: peer,
    kind: thread.kind,
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
    const messages = await postMessage(Number(id), user.id, user.full_name, body, user.role === "admin");
    return NextResponse.json({ ok: true, messages });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "";
    if (reason === "already-claimed")
      return NextResponse.json(
        { error: "Another team member is already handling this conversation." },
        { status: 409 }
      );
    if (reason === "not-a-participant")
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ error: "Could not send that message." }, { status: 500 });
  }
}

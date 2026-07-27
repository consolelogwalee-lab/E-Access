import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

async function ownThread(id: number) {
  const user = await currentUser();
  if (!user) return null;
  const thread = await q1("SELECT * FROM threads WHERE id = $1 AND user_id = $2", [id, user.id]);
  return thread ? { user, thread } : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const own = await ownThread(Number(id));
  if (!own) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const messages = await q("SELECT * FROM messages WHERE thread_id = $1 ORDER BY id ASC", [Number(id)]);
  return NextResponse.json({ thread: own.thread, messages, meId: own.user.id });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const own = await ownThread(Number(id));
  if (!own) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const b = await req.json();
  if (!b.body?.trim()) return NextResponse.json({ error: "Empty message." }, { status: 400 });
  await run("INSERT INTO messages (thread_id, sender_id, body) VALUES ($1,$2,$3)", [Number(id), own.user.id, String(b.body)]);
  const count = await q1<{ c: number | string }>(
    "SELECT COUNT(*) AS c FROM messages WHERE thread_id = $1 AND sender_id = 0", [Number(id)]
  );
  const reply = Number(count?.c ?? 0) === 0 || Math.random() < 0.6
    ? "Hello thanks for reaching out! I'll respond to you shortly as I'm not available at the moment"
    : null;
  if (reply) await run("INSERT INTO messages (thread_id, sender_id, body) VALUES ($1,0,$2)", [Number(id), reply]);
  const messages = await q("SELECT * FROM messages WHERE thread_id = $1 ORDER BY id ASC", [Number(id)]);
  return NextResponse.json({ ok: true, messages });
}

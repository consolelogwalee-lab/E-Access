import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const notifications = await q(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 50", [user.id]
  );
  const unread = await q1<{ c: number | string }>(
    "SELECT COUNT(*) AS c FROM notifications WHERE user_id = $1 AND read = 0", [user.id]
  );
  return NextResponse.json({ notifications, unread: Number(unread?.c ?? 0) });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b.id) await run("UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2", [Number(b.id), user.id]);
  else await run("UPDATE notifications SET read = 1 WHERE user_id = $1", [user.id]);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const searches = await q("SELECT * FROM saved_searches WHERE user_id = $1 ORDER BY id DESC", [user.id]);
  return NextResponse.json({ searches });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json();
  if (!b.name || !b.filters) return NextResponse.json({ error: "Name and filters required." }, { status: 400 });
  const count = await q1<{ c: number | string }>(
    "SELECT COUNT(*) AS c FROM saved_searches WHERE user_id = $1", [user.id]
  );
  if (Number(count?.c ?? 0) >= 10)
    return NextResponse.json({ error: "You can keep up to 10 saved searches. Delete one first." }, { status: 400 });
  await run(
    "INSERT INTO saved_searches (user_id, name, filters_json) VALUES ($1,$2,$3)",
    [user.id, String(b.name).slice(0, 80), JSON.stringify(b.filters)]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  await run("DELETE FROM saved_searches WHERE id = $1 AND user_id = $2", [id, user.id]);
  return NextResponse.json({ ok: true });
}

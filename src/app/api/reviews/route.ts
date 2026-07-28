import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const developerId = Number(url.searchParams.get("developerId"));
  if (!developerId) return NextResponse.json({ error: "developerId required." }, { status: 400 });
  const reviews = await q(
    `SELECT r.*, u.full_name AS reviewer_name, u.avatar_color
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.developer_id = $1 ORDER BY r.id DESC LIMIT 50`,
    [developerId]
  );
  const agg = await q1<{ avg: number | string | null; c: number | string }>(
    "SELECT AVG(rating) AS avg, COUNT(*) AS c FROM reviews WHERE developer_id = $1",
    [developerId]
  );
  return NextResponse.json({
    reviews,
    average: agg?.avg ? Number(agg.avg) : null,
    count: Number(agg?.c ?? 0),
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
  const b = await req.json();
  const developerId = Number(b.developerId);
  const rating = Number(b.rating);
  if (!developerId || !rating || rating < 1 || rating > 5)
    return NextResponse.json({ error: "A rating between 1 and 5 is required." }, { status: 400 });
  if (developerId === user.id)
    return NextResponse.json({ error: "You cannot review yourself." }, { status: 400 });
  const existing = await q1<{ id: number }>(
    "SELECT id FROM reviews WHERE developer_id = $1 AND user_id = $2",
    [developerId, user.id]
  );
  if (existing) {
    await run("UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3",
      [rating, b.comment ? String(b.comment).slice(0, 600) : null, existing.id]);
  } else {
    await run("INSERT INTO reviews (developer_id, user_id, rating, comment) VALUES ($1,$2,$3,$4)",
      [developerId, user.id, rating, b.comment ? String(b.comment).slice(0, 600) : null]);
  }
  return NextResponse.json({ ok: true });
}

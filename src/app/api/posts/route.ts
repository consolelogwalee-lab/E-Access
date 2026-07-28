import { NextResponse } from "next/server";
import { q, q1 } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const all = url.searchParams.get("all") === "1";
  const where: string[] = [];
  const params: unknown[] = [];
  if (!all) where.push("published = 1");
  if (category) {
    params.push(category);
    where.push(`category = $${params.length}`);
  }
  const posts = await q(
    `SELECT * FROM posts ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC, id DESC`,
    params
  );
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const b = await req.json();
  if (!b.title || !b.body) return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  const row = await q1<{ id: number }>(
    `INSERT INTO posts (title, category, body, video_url, cover_image, published, author_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      b.title, b.category ?? "news", b.body, b.videoUrl || null, b.coverImage || null,
      b.published === false ? 0 : 1, b.authorName || "E-Access Team",
    ]
  );
  return NextResponse.json({ ok: true, id: Number(row!.id) });
}

import { NextResponse } from "next/server";
import { q1, run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const post = await q1("SELECT * FROM posts WHERE id = $1", [Number(id)]);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { id } = await ctx.params;
  const b = await req.json();
  const post = await q1<{ id: number }>("SELECT id FROM posts WHERE id = $1", [Number(id)]);
  if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await run(
    `UPDATE posts SET title = $1, category = $2, body = $3, video_url = $4, cover_image = $5, published = $6 WHERE id = $7`,
    [b.title, b.category ?? "news", b.body, b.videoUrl || null, b.coverImage || null, b.published === false ? 0 : 1, Number(id)]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const { id } = await ctx.params;
  await run("DELETE FROM posts WHERE id = $1", [Number(id)]);
  return NextResponse.json({ ok: true });
}

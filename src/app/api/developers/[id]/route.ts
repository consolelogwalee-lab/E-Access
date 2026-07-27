import { NextResponse } from "next/server";
import { q, q1 } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const developer = await q1<{ id: number; full_name: string; avatar_color: string; created_at: string }>(
    "SELECT id, full_name, avatar_color, created_at FROM users WHERE id = $1", [Number(id)]
  );
  if (!developer) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const listings = await q(
    "SELECT * FROM listings WHERE owner_id = $1 AND status = 'active' ORDER BY verification_status = 'verified' DESC, created_at DESC LIMIT 60",
    [Number(id)]
  );
  const stats = await q1<{ total: number | string; verified: number | string }>(
    `SELECT COUNT(*) AS total, SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) AS verified
     FROM listings WHERE owner_id = $1 AND status = 'active'`, [Number(id)]
  );
  return NextResponse.json({ developer, listings, stats: { total: Number(stats?.total ?? 0), verified: Number(stats?.verified ?? 0) } });
}

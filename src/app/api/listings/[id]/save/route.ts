import { NextResponse } from "next/server";
import { q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const exists = await q1("SELECT 1 AS s FROM saved_listings WHERE user_id = $1 AND listing_id = $2", [user.id, Number(id)]);
  if (exists) {
    await run("DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2", [user.id, Number(id)]);
    await run("UPDATE listings SET saves = CASE WHEN saves > 0 THEN saves - 1 ELSE 0 END WHERE id = $1", [Number(id)]);
    return NextResponse.json({ ok: true, saved: false });
  }
  await run("INSERT INTO saved_listings (user_id, listing_id) VALUES ($1,$2)", [user.id, Number(id)]);
  await run("UPDATE listings SET saves = saves + 1 WHERE id = $1", [Number(id)]);
  return NextResponse.json({ ok: true, saved: true });
}

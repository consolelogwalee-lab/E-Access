import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  const listing = await q1<{ property_type: string; price: number }>("SELECT * FROM listings WHERE id = $1", [Number(id)]);
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await run("UPDATE listings SET views = views + 1 WHERE id = $1", [Number(id)]);
  const documents = await q("SELECT * FROM listing_documents WHERE listing_id = $1", [Number(id)]);
  const saved = user
    ? await q1("SELECT 1 AS s FROM saved_listings WHERE user_id = $1 AND listing_id = $2", [user.id, Number(id)])
    : null;
  const similar = await q(
    `SELECT * FROM listings WHERE id != $1 AND status='active' AND verification_status='verified'
     AND property_type = $2 ORDER BY ABS(price - $3) LIMIT 3`,
    [Number(id), listing.property_type, listing.price]
  );
  return NextResponse.json({ listing, documents, similar, saved: !!saved });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const listing = await q1<{ owner_id: number }>("SELECT owner_id FROM listings WHERE id = $1", [Number(id)]);
  if (!listing || Number(listing.owner_id) !== user.id)
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const b = await req.json();
  const fields: Record<string, string> = {
    title: "title", price: "price", description: "description", purpose: "purpose",
    locationArea: "location_area", locationCity: "location_city", estateName: "estate_name",
    bedrooms: "bedrooms", bathrooms: "bathrooms", toilets: "toilets", landSize: "land_size_sqm",
    status: "status",
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [k, col] of Object.entries(fields)) {
    if (k in b) { params.push(b[k]); sets.push(`${col} = $${params.length}`); }
  }
  if ("amenities" in b) { params.push(JSON.stringify(b.amenities)); sets.push(`amenities_json = $${params.length}`); }
  if (!sets.length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  params.push(Number(id));
  await run(`UPDATE listings SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

/** Notify owners of saved searches that match a newly added listing. */
async function alertSavedSearches(listing: {
  id: number; title: string; property_type: string; price: number;
  location_area: string; location_city: string; purpose: string; owner_id: number;
}) {
  try {
    const searches = await q<{ id: number; user_id: number; name: string; filters_json: string }>(
      "SELECT * FROM saved_searches"
    );
    for (const s of searches) {
      if (Number(s.user_id) === Number(listing.owner_id)) continue;
      let f: { purpose?: string; types?: string[]; minPrice?: number; maxPrice?: number; location?: string };
      try { f = JSON.parse(s.filters_json); } catch { continue; }
      if (f.purpose && f.purpose !== listing.purpose) continue;
      if (f.types?.length && !f.types.includes(listing.property_type)) continue;
      if (f.minPrice && listing.price < f.minPrice) continue;
      if (f.maxPrice && listing.price > f.maxPrice) continue;
      if (f.location) {
        const loc = f.location.toLowerCase();
        const hay = `${listing.location_area} ${listing.location_city}`.toLowerCase();
        if (!hay.includes(loc)) continue;
      }
      await notify(
        Number(s.user_id), "alert", `New match for "${s.name}"`,
        `${listing.title} just landed and matches your saved search.`,
        `/dashboard/property/${listing.id}`
      );
    }
  } catch { /* alerts are best-effort */ }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams;
  const user = await currentUser();

  const where: string[] = ["l.status = 'active'"];
  const params: unknown[] = [];
  const add = (clause: (n: number) => string, ...vals: unknown[]) => {
    const start = params.length + 1;
    where.push(clause(start));
    params.push(...vals);
  };

  if (p.get("ids")) {
    const ids = p.get("ids")!.split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0).slice(0, 12);
    if (!ids.length) return NextResponse.json({ listings: [], total: 0 });
    const start = params.length + 1;
    where.push(`l.id IN (${ids.map((_, i) => `$${start + i}`).join(",")})`);
    params.push(...ids);
  }
  if (p.get("purpose")) add((n) => `l.purpose = $${n}`, p.get("purpose"));
  const types = p.get("type")?.split(",").filter(Boolean) ?? [];
  if (types.length) {
    const start = params.length + 1;
    where.push(`l.property_type IN (${types.map((_, i) => `$${start + i}`).join(",")})`);
    params.push(...types);
  }
  if (p.get("minPrice")) add((n) => `l.price >= $${n}`, Number(p.get("minPrice")));
  if (p.get("maxPrice")) add((n) => `l.price <= $${n}`, Number(p.get("maxPrice")));
  if (p.get("verified") === "1") where.push("l.verification_status = 'verified'");
  if (p.get("minLandSize")) add((n) => `l.land_size_sqm >= $${n}`, Number(p.get("minLandSize")));
  if (p.get("location")) {
    const like = `%${p.get("location")}%`;
    add((n) => `(l.location_area LIKE $${n} OR l.location_city LIKE $${n + 1} OR l.estate_name LIKE $${n + 2})`, like, like, like);
  }
  if (p.get("search")) {
    const like = `%${p.get("search")}%`;
    add((n) => `(l.title LIKE $${n} OR l.location_area LIKE $${n + 1} OR l.location_city LIKE $${n + 2} OR l.estate_name LIKE $${n + 3})`, like, like, like, like);
  }
  if (p.get("featured") === "1") where.push("l.featured = 1");
  if (p.get("saved") === "1") {
    if (!user) return NextResponse.json({ listings: [], total: 0 });
    add((n) => `EXISTS (SELECT 1 FROM saved_listings sv WHERE sv.user_id = $${n} AND sv.listing_id = l.id)`, user.id);
  }
  if (p.get("mine") === "1") {
    if (!user) return NextResponse.json({ listings: [], total: 0 });
    where[0] = "1=1";
    add((n) => `l.owner_id = $${n}`, user.id);
  }

  const page = Math.max(1, Number(p.get("page") ?? 1));
  const perPage = Math.min(100, Number(p.get("perPage") ?? 12));
  const totalRow = await q1<{ c: number | string }>(
    `SELECT COUNT(*) AS c FROM listings l WHERE ${where.join(" AND ")}`, params
  );
  const total = Number(totalRow?.c ?? 0);

  const sort = p.get("sort") === "price_asc" ? "l.price ASC"
    : p.get("sort") === "price_desc" ? "l.price DESC"
    : "l.created_at DESC, l.id DESC";

  let savedSel = "NULL AS saved";
  if (user) {
    savedSel = `(SELECT 1 FROM saved_listings s WHERE s.user_id = $${params.length + 1} AND s.listing_id = l.id) AS saved`;
    params.push(user.id);
  }
  const limitN = params.length + 1;
  params.push(perPage, (page - 1) * perPage);

  const listings = await q(
    `SELECT l.*, ${savedSel} FROM listings l WHERE ${where.join(" AND ")}
     ORDER BY ${sort} LIMIT $${limitN} OFFSET $${limitN + 1}`,
    params
  );
  return NextResponse.json({ listings, total, page, perPage });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json();
  if (!b.title || !b.propertyType || !b.price || !b.locationArea)
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

  const row = await q1<{ id: number }>(
    `INSERT INTO listings (owner_id, title, purpose, property_type, price, location_area, location_city,
      estate_name, bedrooms, bathrooms, toilets, land_size_sqm, description, verification_status,
      inspection_available, status, image_seed, amenities_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
    [
      user.id, b.title, b.purpose ?? "sale", b.propertyType, Number(b.price),
      b.locationArea, b.locationCity ?? "", b.estateName ?? null,
      b.bedrooms ? Number(b.bedrooms) : null, b.bathrooms ? Number(b.bathrooms) : null,
      b.toilets ? Number(b.toilets) : null, b.landSize ? Number(b.landSize) : null,
      b.description ?? null, "under_review", 1, b.draft ? "draft" : "active",
      Math.floor(Math.random() * 12) + 1, JSON.stringify(b.amenities ?? []),
    ]
  );
  const id = Number(row!.id);
  for (const doc of b.documents ?? []) {
    await run(
      "INSERT INTO listing_documents (listing_id, doc_type, file_name, status) VALUES ($1,$2,$3,'under_review')",
      [id, doc.type, doc.fileName]
    );
  }
  if (!b.draft) {
    await alertSavedSearches({
      id, title: b.title, property_type: b.propertyType, price: Number(b.price),
      location_area: b.locationArea, location_city: b.locationCity ?? "",
      purpose: b.purpose ?? "sale", owner_id: user.id,
    });
  }
  return NextResponse.json({ ok: true, id });
}

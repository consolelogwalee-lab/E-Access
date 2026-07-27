import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const url = new URL(req.url);
  const forOwner = url.searchParams.get("owner") === "1";
  const listingId = url.searchParams.get("listingId");

  let sql = `SELECT i.*, l.title, l.location_area, l.location_city, l.image_seed, l.price,
      u.full_name AS requester_name
    FROM inspections i
    JOIN listings l ON l.id = i.listing_id
    JOIN users u ON u.id = i.requester_id `;
  const params: unknown[] = [user.id];
  sql += forOwner ? "WHERE l.owner_id = $1 " : "WHERE i.requester_id = $1 ";
  if (listingId) { params.push(Number(listingId)); sql += `AND i.listing_id = $${params.length} `; }
  sql += "ORDER BY i.date ASC, i.time ASC";
  return NextResponse.json({ inspections: await q(sql, params) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json();
  if (!b.listingId || !b.date || !b.time)
    return NextResponse.json({ error: "Pick a date and time for your inspection." }, { status: 400 });
  const row = await q1<{ id: number }>(
    "INSERT INTO inspections (listing_id, requester_id, mode, date, time, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
    [Number(b.listingId), user.id, b.mode ?? "physical", b.date, b.time, b.notes ?? null]
  );
  const owner = await q1<{ owner_id: number; title: string }>(
    "SELECT owner_id, title FROM listings WHERE id = $1", [Number(b.listingId)]
  );
  if (owner?.owner_id && Number(owner.owner_id) !== user.id) {
    await notify(Number(owner.owner_id), "inspection", "New inspection request",
      `${user.full_name} requested a ${b.mode ?? "physical"} inspection of "${owner.title}" on ${b.date} at ${b.time}`,
      "/dashboard/inspections");
  }
  return NextResponse.json({ ok: true, id: Number(row!.id) });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json();
  const insp = await q1<{ id: number; requester_id: number; owner_id: number }>(
    `SELECT i.id, i.requester_id, l.owner_id FROM inspections i JOIN listings l ON l.id = i.listing_id WHERE i.id = $1`,
    [Number(b.id)]
  );
  if (!insp || (Number(insp.requester_id) !== user.id && Number(insp.owner_id) !== user.id))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const allowed = ["confirmed", "cancelled", "completed", "rescheduled", "pending"];
  if (!allowed.includes(b.status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  if (b.date && b.time)
    await run("UPDATE inspections SET status = $1, date = $2, time = $3 WHERE id = $4", [b.status, b.date, b.time, insp.id]);
  else await run("UPDATE inspections SET status = $1 WHERE id = $2", [b.status, insp.id]);
  const other = Number(insp.requester_id) === user.id ? Number(insp.owner_id) : Number(insp.requester_id);
  if (other && other !== user.id) {
    await notify(other, "inspection", `Inspection ${b.status}`,
      `${user.full_name} marked an inspection as ${b.status}${b.date ? ` (${b.date} at ${b.time})` : ""}`,
      "/dashboard/inspections");
  }
  return NextResponse.json({ ok: true });
}

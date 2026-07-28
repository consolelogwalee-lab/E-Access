import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const plans = await q(
    `SELECT i.*, l.title AS listing_title, l.estate_name, l.location_area, l.location_city,
            l.property_type, l.image_seed
     FROM installments i JOIN listings l ON l.id = i.listing_id
     WHERE i.user_id = $1 ORDER BY i.id DESC`,
    [user.id]
  );
  const payments = await q(
    `SELECT p.* FROM installment_payments p
     JOIN installments i ON i.id = p.installment_id
     WHERE i.user_id = $1 ORDER BY p.id DESC`,
    [user.id]
  );
  return NextResponse.json({ plans, payments });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json();
  const listingId = Number(b.listingId);
  const total = Number(b.totalAmount);
  if (!listingId || !total || total <= 0)
    return NextResponse.json({ error: "Listing and a total amount are required." }, { status: 400 });
  const listing = await q1<{ id: number }>("SELECT id FROM listings WHERE id = $1", [listingId]);
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  const dup = await q1<{ id: number }>(
    "SELECT id FROM installments WHERE user_id = $1 AND listing_id = $2", [user.id, listingId]
  );
  if (dup) return NextResponse.json({ error: "You already track a plan for this property." }, { status: 400 });
  await run(
    "INSERT INTO installments (user_id, listing_id, total_amount, amount_paid, next_due_date, note) VALUES ($1,$2,$3,0,$4,$5)",
    [user.id, listingId, total, b.nextDueDate || null, b.note ? String(b.note).slice(0, 300) : null]
  );
  return NextResponse.json({ ok: true });
}

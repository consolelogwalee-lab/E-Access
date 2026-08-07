import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const inquiries = await q(
    `SELECT qi.id, qi.sender_id, qi.message, qi.status, qi.created_at,
       u.full_name AS sender_name, u.email AS sender_email,
       l.id AS listing_id, l.title AS listing_title, l.price, l.location_city,
       o.full_name AS owner_name
     FROM inquiries qi
     JOIN users u ON u.id = qi.sender_id
     JOIN listings l ON l.id = qi.listing_id
     LEFT JOIN users o ON o.id = l.owner_id
     ORDER BY qi.created_at DESC LIMIT 500`
  );
  const inspections = await q(
    `SELECT i.id, i.mode, i.date, i.time, i.status, i.created_at,
       u.full_name AS requester_name, u.email AS requester_email,
       l.id AS listing_id, l.title AS listing_title, l.location_city
     FROM inspections i
     JOIN users u ON u.id = i.requester_id
     JOIN listings l ON l.id = i.listing_id
     ORDER BY i.created_at DESC LIMIT 500`
  );
  return NextResponse.json({ inquiries, inspections });
}

// Admin decision on an inspection request (confirm / decline) — notifies the requester.
export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  const status = String(b.status ?? "");
  if (!id || !["confirmed", "cancelled"].includes(status))
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const insp = await q1<{ requester_id: number; listing_id: number }>(
    "SELECT requester_id, listing_id FROM inspections WHERE id = $1", [id]
  );
  if (!insp) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await run("UPDATE inspections SET status = $1 WHERE id = $2", [status, id]);

  const listing = await q1<{ title: string }>("SELECT title FROM listings WHERE id = $1", [Number(insp.listing_id)]);
  const title = listing?.title ?? "your inspection";
  if (status === "confirmed")
    await notify(Number(insp.requester_id), "inspection", "Inspection confirmed", `Your inspection for "${title}" has been confirmed.`, "/dashboard/inspections");
  else
    await notify(Number(insp.requester_id), "inspection", "Inspection declined", `Your inspection request for "${title}" couldn't be scheduled. Please pick another time.`, "/dashboard/inspections");

  return NextResponse.json({ ok: true });
}

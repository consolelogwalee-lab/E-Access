import { NextResponse } from "next/server";
import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const inquiries = await q(
    `SELECT qi.id, qi.message, qi.status, qi.created_at,
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

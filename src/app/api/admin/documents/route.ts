import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const documents = await q(
    `SELECT d.*, l.title AS listing_title, l.estate_name, l.verification_status, l.location_city,
       u.full_name AS owner_name
     FROM listing_documents d
     JOIN listings l ON l.id = d.listing_id
     LEFT JOIN users u ON u.id = l.owner_id
     WHERE d.status IN ('pending','under_review')
     ORDER BY d.uploaded_at ASC LIMIT 300`
  );
  return NextResponse.json({ documents });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const b = await req.json();
  if (!["approved", "under_review", "action_required", "pending"].includes(b.status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  const doc = await q1<{ listing_id: number }>("SELECT listing_id FROM listing_documents WHERE id = $1", [Number(b.id)]);
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await run("UPDATE listing_documents SET status = $1 WHERE id = $2", [b.status, Number(b.id)]);

  // Roll listing verification forward/backward based on document states
  const listingId = Number(doc.listing_id);
  const remaining = await q1<{ c: number | string }>(
    "SELECT COUNT(*) AS c FROM listing_documents WHERE listing_id = $1 AND status != 'approved'", [listingId]
  );
  if (b.status === "action_required") {
    await run("UPDATE listings SET verification_status = 'action_required', documents_approved = 0 WHERE id = $1", [listingId]);
  } else if (Number(remaining?.c ?? 0) === 0) {
    await run("UPDATE listings SET verification_status = 'verified', documents_approved = 1 WHERE id = $1", [listingId]);
  } else {
    await run("UPDATE listings SET verification_status = 'under_review' WHERE id = $1 AND verification_status != 'verified'", [listingId]);
  }
  return NextResponse.json({ ok: true });
}

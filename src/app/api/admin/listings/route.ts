import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  const filter = url.searchParams.get("filter"); // verification status
  const where: string[] = ["1=1"];
  const params: unknown[] = [];
  if (search) {
    const like = `%${search}%`;
    params.push(like, like, like);
    where.push(`(l.title LIKE $1 OR l.location_city LIKE $2 OR l.estate_name LIKE $3)`);
  }
  if (filter) {
    params.push(filter);
    where.push(`l.verification_status = $${params.length}`);
  }
  const listings = await q(
    `SELECT l.*, u.full_name AS owner_name, u.email AS owner_email
     FROM listings l LEFT JOIN users u ON u.id = l.owner_id
     WHERE ${where.join(" AND ")}
     ORDER BY l.created_at DESC, l.id DESC LIMIT 200`,
    params
  );
  return NextResponse.json({ listings });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const b = await req.json();
  const listing = await q1("SELECT id FROM listings WHERE id = $1", [Number(b.id)]);
  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (b.verificationStatus) {
    const allowed = ["verified", "under_review", "unverified", "action_required"];
    if (!allowed.includes(b.verificationStatus))
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    await run("UPDATE listings SET verification_status = $1, documents_approved = $2 WHERE id = $3",
      [b.verificationStatus, b.verificationStatus === "verified" ? 1 : 0, Number(b.id)]);
    if (b.verificationStatus === "verified")
      await run("UPDATE listing_documents SET status = 'approved' WHERE listing_id = $1", [Number(b.id)]);
  }
  if (typeof b.featured === "boolean")
    await run("UPDATE listings SET featured = $1 WHERE id = $2", [b.featured ? 1 : 0, Number(b.id)]);
  if (b.status) {
    const allowed = ["active", "draft", "sold", "archived"];
    if (!allowed.includes(b.status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    await run("UPDATE listings SET status = $1 WHERE id = $2", [b.status, Number(b.id)]);
  }
  return NextResponse.json({ ok: true });
}

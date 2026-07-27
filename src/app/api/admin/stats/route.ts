import { NextResponse } from "next/server";
import { q1, q } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const n = (r: { c: number | string } | null) => Number(r?.c ?? 0);

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const [users, listings, active, verified, underReview, inquiries, newInquiries, inspections, pendingInsp] =
    await Promise.all([
      q1<{ c: number }>("SELECT COUNT(*) AS c FROM users"),
      q1<{ c: number }>("SELECT COUNT(*) AS c FROM listings"),
      q1<{ c: number }>("SELECT COUNT(*) AS c FROM listings WHERE status = 'active'"),
      q1<{ c: number }>("SELECT COUNT(*) AS c FROM listings WHERE verification_status = 'verified'"),
      q1<{ c: number }>("SELECT COUNT(*) AS c FROM listings WHERE verification_status = 'under_review'"),
      q1<{ c: number }>("SELECT COUNT(*) AS c FROM inquiries"),
      q1<{ c: number }>("SELECT COUNT(*) AS c FROM inquiries WHERE status = 'new'"),
      q1<{ c: number }>("SELECT COUNT(*) AS c FROM inspections"),
      q1<{ c: number }>("SELECT COUNT(*) AS c FROM inspections WHERE status = 'pending'"),
    ]);
  const recentListings = await q(
    "SELECT id, title, verification_status, status, price, created_at FROM listings ORDER BY created_at DESC, id DESC LIMIT 6"
  );
  const recentUsers = await q(
    "SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC, id DESC LIMIT 6"
  );
  return NextResponse.json({
    stats: {
      users: n(users), listings: n(listings), active: n(active), verified: n(verified),
      underReview: n(underReview), inquiries: n(inquiries), newInquiries: n(newInquiries),
      inspections: n(inspections), pendingInspections: n(pendingInsp),
    },
    recentListings, recentUsers,
  });
}

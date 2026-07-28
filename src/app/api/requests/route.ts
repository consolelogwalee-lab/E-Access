import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser, requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function GET() {
  const admin = await requireAdmin();
  if (admin) {
    const requests = await q(
      `SELECT r.*, u.full_name, u.email FROM property_requests r JOIN users u ON u.id = r.user_id
       ORDER BY r.status = 'new' DESC, r.id DESC LIMIT 200`
    );
    return NextResponse.json({ requests });
  }
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const requests = await q("SELECT * FROM property_requests WHERE user_id = $1 ORDER BY id DESC", [user.id]);
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to request a property." }, { status: 401 });
  const b = await req.json();
  if (!b.propertyType || !b.locations)
    return NextResponse.json({ error: "Property type and preferred locations are required." }, { status: 400 });
  await run(
    `INSERT INTO property_requests (user_id, property_type, purpose, budget_min, budget_max, locations, details, whatsapp)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      user.id, b.propertyType, b.purpose === "rent" ? "rent" : "buy",
      b.budgetMin ? Number(b.budgetMin) : null, b.budgetMax ? Number(b.budgetMax) : null,
      String(b.locations).slice(0, 200), b.details ? String(b.details).slice(0, 600) : null,
      b.whatsapp ? String(b.whatsapp).slice(0, 30) : null,
    ]
  );
  await notify(user.id, "info", "Property request received",
    "Our team is on it. We will match you with verified options and reach out.", "/dashboard/request");
  const admins = await q<{ id: number }>("SELECT id FROM users WHERE role = 'admin'");
  for (const a of admins) {
    if (Number(a.id) === user.id) continue;
    await notify(Number(a.id), "info", "New property request",
      `${user.full_name} is looking for a ${b.propertyType} in ${b.locations}.`, "/admin/requests");
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const b = await req.json();
  const id = Number(b.id);
  const status = String(b.status);
  if (!id || !["in_progress", "matched", "closed"].includes(status))
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const r = await q1<{ id: number; user_id: number }>("SELECT * FROM property_requests WHERE id = $1", [id]);
  if (!r) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const note = b.note ? String(b.note).slice(0, 500) : null;
  await run("UPDATE property_requests SET status = $1, admin_note = $2 WHERE id = $3", [status, note, id]);
  await notify(
    Number(r.user_id),
    status === "matched" ? "success" : "info",
    status === "in_progress" ? "We are working on your property request"
      : status === "matched" ? "We found options for you"
      : "Your property request was closed",
    note ?? (status === "matched" ? "Check your messages, the team has matches to show you." : undefined),
    "/dashboard/request"
  );
  return NextResponse.json({ ok: true });
}

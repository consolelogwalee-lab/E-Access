import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser, requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notify";

/** Public list of approved agents; ?mine=1 returns the caller's application. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("mine") === "1") {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const application = await q1("SELECT * FROM agents WHERE user_id = $1", [user.id]);
    return NextResponse.json({ application });
  }
  if (url.searchParams.get("all") === "1") {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
    const agents = await q(
      `SELECT a.*, u.full_name, u.email, u.avatar_color FROM agents a JOIN users u ON u.id = a.user_id
       ORDER BY a.status = 'pending' DESC, a.id DESC`
    );
    return NextResponse.json({ agents });
  }
  const agents = await q(
    `SELECT a.id, a.user_id, a.agency_name, a.whatsapp, a.phone, a.bio, a.areas, a.created_at,
            u.full_name, u.avatar_color,
            (SELECT COUNT(*) FROM listings l WHERE l.owner_id = a.user_id AND l.status = 'active') AS listing_count,
            (SELECT AVG(r.rating) FROM reviews r WHERE r.developer_id = a.user_id) AS rating
     FROM agents a JOIN users u ON u.id = a.user_id
     WHERE a.status = 'approved' ORDER BY a.id DESC`
  );
  return NextResponse.json({ agents });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to apply." }, { status: 401 });
  const b = await req.json();
  if (!b.agencyName || !b.phone)
    return NextResponse.json({ error: "Agency or business name and phone number are required." }, { status: 400 });
  const existing = await q1<{ id: number; status: string }>("SELECT id, status FROM agents WHERE user_id = $1", [user.id]);
  if (existing) {
    await run(
      "UPDATE agents SET agency_name = $1, phone = $2, whatsapp = $3, bio = $4, areas = $5, rc_number = $6, status = CASE WHEN status = 'rejected' THEN 'pending' ELSE status END WHERE user_id = $7",
      [String(b.agencyName).slice(0, 120), String(b.phone).slice(0, 30), b.whatsapp ? String(b.whatsapp).slice(0, 30) : null,
       b.bio ? String(b.bio).slice(0, 500) : null, b.areas ? String(b.areas).slice(0, 200) : null,
       b.rcNumber ? String(b.rcNumber).slice(0, 40) : null, user.id]
    );
  } else {
    await run(
      "INSERT INTO agents (user_id, agency_name, phone, whatsapp, bio, areas, rc_number) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [user.id, String(b.agencyName).slice(0, 120), String(b.phone).slice(0, 30),
       b.whatsapp ? String(b.whatsapp).slice(0, 30) : null, b.bio ? String(b.bio).slice(0, 500) : null,
       b.areas ? String(b.areas).slice(0, 200) : null, b.rcNumber ? String(b.rcNumber).slice(0, 40) : null]
    );
  }
  const admins = await q<{ id: number }>("SELECT id FROM users WHERE role = 'admin'");
  for (const a of admins) {
    if (Number(a.id) === user.id) continue;
    await notify(Number(a.id), "info", "New agent application",
      `${user.full_name} (${b.agencyName}) applied to become a verified agent.`, "/admin/agents");
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const b = await req.json();
  const id = Number(b.id);
  const status = String(b.status);
  if (!id || !["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const agent = await q1<{ id: number; user_id: number; agency_name: string }>("SELECT * FROM agents WHERE id = $1", [id]);
  if (!agent) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await run("UPDATE agents SET status = $1 WHERE id = $2", [status, id]);
  await notify(
    Number(agent.user_id),
    status === "approved" ? "success" : "info",
    status === "approved" ? "You are now a verified E-Access agent" : "Update on your agent application",
    status === "approved"
      ? `${agent.agency_name} has been approved. Your profile now carries the Verified Agent badge and appears in the agent directory.`
      : "Your agent application was not approved this time. You can update your details and reapply.",
    "/dashboard/agent"
  );
  return NextResponse.json({ ok: true });
}

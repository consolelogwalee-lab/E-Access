import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { sendNotice } from "@/lib/email";

const FLOW: Record<string, string> = {
  in_review: "Review started by the verification team.",
  legal_review: "Documents forwarded to the legal team for title and registry checks.",
  action_required: "The team needs something from you before verification can continue.",
  approved: "Verification complete. Your property has been approved and stamped.",
  rejected: "Verification could not be completed for this property.",
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const requests = await q(
    `SELECT v.*, u.full_name AS owner_name, u.email AS owner_email,
       (SELECT COUNT(*) FROM validation_files f WHERE f.request_id = v.id AND f.kind = 'document') AS doc_count,
       (SELECT COUNT(*) FROM validation_files f WHERE f.request_id = v.id AND f.kind = 'photo') AS photo_count
     FROM validation_requests v JOIN users u ON u.id = v.user_id
     ORDER BY v.status IN ('submitted','in_review','legal_review') DESC, v.id DESC LIMIT 200`
  );
  return NextResponse.json({ requests });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const b = await req.json();
  const id = Number(b.id);
  const status = String(b.status);
  if (!id || !FLOW[status]) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const v = await q1<{ id: number; user_id: number; reference: string; status: string }>(
    "SELECT * FROM validation_requests WHERE id = $1", [id]
  );
  if (!v) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (["approved", "rejected"].includes(v.status))
    return NextResponse.json({ error: "This request is already resolved." }, { status: 400 });

  const note = b.note ? String(b.note).slice(0, 500) : null;
  if (status === "approved") {
    await run("UPDATE validation_requests SET status = $1, admin_note = $2, stamped_at = CURRENT_TIMESTAMP WHERE id = $3",
      [status, note, id]);
  } else {
    await run("UPDATE validation_requests SET status = $1, admin_note = $2 WHERE id = $3", [status, note, id]);
  }
  await run("INSERT INTO validation_events (request_id, status, note, actor) VALUES ($1,$2,$3,'team')",
    [id, status, note ?? FLOW[status]]);
  if (status === "approved") {
    const owner = await q1<{ email: string }>("SELECT email FROM users WHERE id = $1", [Number(v.user_id)]);
    if (owner?.email && !owner.email.endsWith("@eaccess.demo")) {
      await sendNotice(owner.email, `${v.reference} approved and stamped`,
        "Your property passed document, title and registry checks. Your Certificate of Verification is ready.",
        "View your certificate", `${new URL(req.url).origin}/dashboard/validate/${id}`);
    }
  }
  await notify(
    Number(v.user_id),
    status === "approved" ? "success" : "verification",
    status === "approved" ? `${v.reference} approved and stamped`
      : status === "action_required" ? `${v.reference} needs your attention`
      : status === "rejected" ? `Update on ${v.reference}`
      : `${v.reference} update`,
    note ?? FLOW[status],
    `/dashboard/validate/${id}`
  );
  return NextResponse.json({ ok: true });
}

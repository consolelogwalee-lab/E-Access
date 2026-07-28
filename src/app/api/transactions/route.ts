import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser, requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notify";

const STAGES = ["offer_accepted", "documents_shared", "inspection_done", "agreement_signed", "completed"] as const;

export async function GET() {
  const admin = await requireAdmin();
  if (admin) {
    const transactions = await q(
      `SELECT t.*, l.title AS listing_title, l.price, l.location_area, l.location_city,
              b.full_name AS buyer_name, b.email AS buyer_email,
              s.full_name AS seller_name
       FROM transactions t
       JOIN listings l ON l.id = t.listing_id
       JOIN users b ON b.id = t.buyer_id
       LEFT JOIN users s ON s.id = t.seller_id
       ORDER BY t.stage != 'completed' DESC, t.id DESC LIMIT 200`
    );
    return NextResponse.json({ transactions, admin: true });
  }
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const transactions = await q(
    `SELECT t.*, l.title AS listing_title, l.price, l.location_area, l.location_city, l.property_type, l.image_seed,
            s.full_name AS seller_name,
            a.agency_name, a.whatsapp AS seller_whatsapp, a.phone AS seller_phone
     FROM transactions t
     JOIN listings l ON l.id = t.listing_id
     LEFT JOIN users s ON s.id = t.seller_id
     LEFT JOIN agents a ON a.user_id = t.seller_id AND a.status = 'approved'
     WHERE t.buyer_id = $1 OR t.seller_id = $1
     ORDER BY t.id DESC`,
    [user.id]
  );
  return NextResponse.json({ transactions });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const b = await req.json();
  const id = Number(b.id);
  const stage = String(b.stage);
  if (!id || !STAGES.includes(stage as (typeof STAGES)[number]))
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const t = await q1<{ id: number; buyer_id: number; seller_id: number | null; listing_id: number }>(
    "SELECT * FROM transactions WHERE id = $1", [id]
  );
  if (!t) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const note = b.note ? String(b.note).slice(0, 400) : null;
  await run("UPDATE transactions SET stage = $1, note = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3", [stage, note, id]);
  const listing = await q1<{ title: string }>("SELECT title FROM listings WHERE id = $1", [t.listing_id]);
  const label: Record<string, string> = {
    documents_shared: "Documents have been shared for your transaction",
    inspection_done: "Inspection completed on your transaction",
    agreement_signed: "Agreement signed, almost there",
    completed: "Transaction completed, congratulations!",
    offer_accepted: "Transaction update",
  };
  for (const uid of [t.buyer_id, t.seller_id]) {
    if (!uid) continue;
    await notify(Number(uid), stage === "completed" ? "success" : "info",
      label[stage] ?? "Transaction update",
      note ?? `${listing?.title ?? "Your transaction"} moved to the next stage.`,
      "/dashboard/transactions");
  }
  return NextResponse.json({ ok: true });
}

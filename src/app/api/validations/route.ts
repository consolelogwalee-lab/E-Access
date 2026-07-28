import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const requests = await q(
    "SELECT * FROM validation_requests WHERE user_id = $1 ORDER BY id DESC",
    [user.id]
  );
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit a property for validation." }, { status: 401 });
  const b = await req.json();
  if (!b.propertyTitle || !b.propertyType || !b.address || !b.city || !b.state)
    return NextResponse.json({ error: "Property name, type, address, city and state are required." }, { status: 400 });
  const docs: { docType: string; fileName: string }[] = Array.isArray(b.documents) ? b.documents : [];
  if (!docs.length)
    return NextResponse.json({ error: "Attach at least one property document." }, { status: 400 });

  const reference = `VAL/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 90000) + 10000)}`;
  const row = await q1<{ id: number }>(
    `INSERT INTO validation_requests (user_id, reference, property_title, property_type, address, city, state, title_type, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [
      user.id, reference, String(b.propertyTitle).slice(0, 140), b.propertyType,
      String(b.address).slice(0, 240), String(b.city).slice(0, 80), String(b.state).slice(0, 80),
      b.titleType || null, b.notes ? String(b.notes).slice(0, 600) : null,
    ]
  );
  const id = Number(row!.id);
  for (const d of docs.slice(0, 12)) {
    await run("INSERT INTO validation_files (request_id, kind, doc_type, file_name) VALUES ($1,'document',$2,$3)",
      [id, String(d.docType ?? "Supporting Document").slice(0, 60), String(d.fileName).slice(0, 160)]);
  }
  for (const p of (Array.isArray(b.photos) ? b.photos : []).slice(0, 12)) {
    await run("INSERT INTO validation_files (request_id, kind, file_name) VALUES ($1,'photo',$2)",
      [id, String(p).slice(0, 160)]);
  }
  await run("INSERT INTO validation_events (request_id, status, note, actor) VALUES ($1,'submitted',$2,'you')",
    [id, "Request submitted with documents for review."]);
  await notify(user.id, "verification", "Validation request received",
    `Your request ${reference} is with the E-Access verification team. We will update you at every stage.`,
    `/dashboard/validate/${id}`);
  // alert all admins
  const admins = await q<{ id: number }>("SELECT id FROM users WHERE role = 'admin'");
  for (const a of admins) {
    if (Number(a.id) === user.id) continue;
    await notify(Number(a.id), "verification", "New validation request",
      `${user.full_name} submitted ${reference} for property validation.`, "/admin/validations");
  }
  return NextResponse.json({ ok: true, id, reference });
}

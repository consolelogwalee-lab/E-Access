import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const url = new URL(req.url);
  const listingId = url.searchParams.get("listingId");
  let sql = `SELECT qi.*, u.full_name AS sender_name, l.title AS listing_title
    FROM inquiries qi JOIN users u ON u.id = qi.sender_id JOIN listings l ON l.id = qi.listing_id
    WHERE l.owner_id = $1`;
  const params: unknown[] = [user.id];
  if (listingId) { params.push(Number(listingId)); sql += ` AND qi.listing_id = $${params.length}`; }
  sql += " ORDER BY qi.created_at DESC";
  return NextResponse.json({ inquiries: await q(sql, params) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json();
  if (!b.listingId || !b.message)
    return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  await run("INSERT INTO inquiries (listing_id, sender_id, message) VALUES ($1,$2,$3)",
    [Number(b.listingId), user.id, String(b.message)]);
  const owner = await q1<{ owner_id: number; title: string }>(
    "SELECT owner_id, title FROM listings WHERE id = $1", [Number(b.listingId)]
  );
  if (owner?.owner_id && Number(owner.owner_id) !== user.id) {
    await notify(Number(owner.owner_id), "inquiry", "New inquiry received",
      `${user.full_name} asked about "${owner.title}"`, "/dashboard/portfolio");
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json();
  const row = await q1(
    "SELECT qi.id FROM inquiries qi JOIN listings l ON l.id = qi.listing_id WHERE qi.id = $1 AND l.owner_id = $2",
    [Number(b.id), user.id]
  );
  if (!row) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  await run("UPDATE inquiries SET status = $1 WHERE id = $2", [b.status ?? "replied", Number(b.id)]);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { q, q1, run } from "@/lib/db";
import { currentUser, requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { sendNotice } from "@/lib/email";

export async function GET() {
  const admin = await requireAdmin();
  if (admin) {
    const offers = await q(
      `SELECT o.*, l.title AS listing_title, l.price AS asking_price, l.location_area, l.location_city,
              u.full_name AS buyer_name, u.email AS buyer_email
       FROM offers o JOIN listings l ON l.id = o.listing_id JOIN users u ON u.id = o.user_id
       ORDER BY o.status = 'pending' DESC, o.id DESC LIMIT 100`
    );
    return NextResponse.json({ offers });
  }
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const offers = await q(
    `SELECT o.*, l.title AS listing_title, l.price AS asking_price
     FROM offers o JOIN listings l ON l.id = o.listing_id
     WHERE o.user_id = $1 ORDER BY o.id DESC`,
    [user.id]
  );
  return NextResponse.json({ offers });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to make an offer." }, { status: 401 });
  const b = await req.json();
  const listingId = Number(b.listingId);
  const amount = Number(b.amount);
  if (!listingId || !amount || amount <= 0)
    return NextResponse.json({ error: "An offer amount is required." }, { status: 400 });
  const listing = await q1<{ id: number; title: string; owner_id: number | null }>(
    "SELECT id, title, owner_id FROM listings WHERE id = $1 AND status = 'active'", [listingId]
  );
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  const pending = await q1<{ id: number }>(
    "SELECT id FROM offers WHERE listing_id = $1 AND user_id = $2 AND status = 'pending'",
    [listingId, user.id]
  );
  if (pending) return NextResponse.json({ error: "You already have a pending offer on this property." }, { status: 400 });
  await run("INSERT INTO offers (listing_id, user_id, amount, message) VALUES ($1,$2,$3,$4)",
    [listingId, user.id, amount, b.message ? String(b.message).slice(0, 500) : null]);
  if (listing.owner_id) {
    await notify(Number(listing.owner_id), "info", "New offer received",
      `${user.full_name} made an offer on ${listing.title}.`, "/dashboard/portfolio");
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admin only." }, { status: 403 });
  const b = await req.json();
  const id = Number(b.id);
  const status = String(b.status);
  if (!id || !["accepted", "declined"].includes(status))
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const offer = await q1<{ id: number; user_id: number; listing_id: number; status: string }>(
    "SELECT * FROM offers WHERE id = $1", [id]
  );
  if (!offer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  if (offer.status !== "pending")
    return NextResponse.json({ error: "This offer was already resolved." }, { status: 400 });
  await run("UPDATE offers SET status = $1 WHERE id = $2", [status, id]);
  const listing = await q1<{ title: string; owner_id: number | null }>(
    "SELECT title, owner_id FROM listings WHERE id = $1", [offer.listing_id]
  );
  if (status === "accepted") {
    // Open a transaction linking the buyer with the seller/agent (no payments, just coordination)
    await run(
      "INSERT INTO transactions (listing_id, buyer_id, seller_id, offer_id) VALUES ($1,$2,$3,$4)",
      [offer.listing_id, offer.user_id, listing?.owner_id ?? null, offer.id]
    );
    if (listing?.owner_id) {
      await notify(Number(listing.owner_id), "success", "Offer accepted, transaction opened",
        `A transaction has been opened for ${listing.title}. Track its progress with the buyer.`, "/dashboard/transactions");
    }
  }
  if (status === "accepted") {
    const buyer = await q1<{ email: string }>("SELECT email FROM users WHERE id = $1", [Number(offer.user_id)]);
    if (buyer?.email && !buyer.email.endsWith("@eaccess.demo")) {
      await sendNotice(buyer.email, "Your offer was accepted",
        `Great news: your offer on ${listing?.title ?? "the property"} has been accepted. A transaction has been opened and the E-Access team will guide the next steps.`,
        "View your transaction", `${new URL(req.url).origin}/dashboard/transactions`);
    }
  }
  await notify(
    Number(offer.user_id),
    status === "accepted" ? "success" : "info",
    status === "accepted" ? "Your offer was accepted" : "Update on your offer",
    status === "accepted"
      ? `Great news: your offer on ${listing?.title ?? "the property"} was accepted. Our team will contact you on next steps.`
      : `Your offer on ${listing?.title ?? "the property"} was declined. You can make a new offer or explore similar properties.`,
    "/dashboard"
  );
  return NextResponse.json({ ok: true });
}

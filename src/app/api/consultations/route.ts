import { NextResponse } from "next/server";
import { q, q1, run, nowIso } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { getOrCreateConsultantThread, postMessage } from "@/lib/messaging";

const INTENTS = ["buy", "rent", "sell", "find", "invest", "question"] as const;
const INTENT_LABEL: Record<string, string> = {
  buy: "Buying a property",
  rent: "Renting a property",
  sell: "Selling a property",
  find: "Help finding a property",
  invest: "Property investment",
  question: "A property question",
};
const CONTACT_METHODS = ["chat", "callback", "appointment"];
const CONTACT_CHANNELS = ["whatsapp", "phone"];

function clean(v: unknown, max = 200): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s.length ? s : null;
}
function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/** Build the opening message the team sees, so nobody has to ask what this is about. */
function openingMessage(intent: string, f: Record<string, string | number | null>, listingTitle: string | null) {
  const lines: string[] = [INTENT_LABEL[intent] ?? "Consultation request"];
  if (listingTitle) lines.push(`Property: ${listingTitle}`);
  if (f.property_type) lines.push(`Type: ${f.property_type}`);
  if (f.locations) lines.push(`Location: ${f.locations}`);
  if (f.budget_min || f.budget_max) {
    const lo = f.budget_min ? `₦${Number(f.budget_min).toLocaleString()}` : "";
    const hi = f.budget_max ? `₦${Number(f.budget_max).toLocaleString()}` : "";
    lines.push(`Budget: ${[lo, hi].filter(Boolean).join(" – ")}`);
  }
  if (f.bedrooms) lines.push(`Bedrooms: ${f.bedrooms}`);
  if (f.timeline) lines.push(`Timeline: ${f.timeline}`);
  if (f.requirements) lines.push(`\n${f.requirements}`);
  return lines.join("\n");
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in to speak with a consultant." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const intent = String(b.intent ?? "");
  if (!INTENTS.includes(intent as (typeof INTENTS)[number]))
    return NextResponse.json({ error: "Tell us what you need help with." }, { status: 400 });

  const contactMethod = CONTACT_METHODS.includes(String(b.contactMethod)) ? String(b.contactMethod) : "chat";
  const contactChannel = CONTACT_CHANNELS.includes(String(b.contactChannel)) ? String(b.contactChannel) : null;
  const phone = clean(b.phone, 40);
  if (contactMethod === "callback" && !phone)
    return NextResponse.json({ error: "Add a number we can reach you on." }, { status: 400 });

  // Only accept a listing that actually exists; otherwise drop the context quietly.
  let listingId: number | null = num(b.listingId);
  let listingTitle: string | null = null;
  if (listingId) {
    const l = await q1<{ id: number; title: string }>("SELECT id, title FROM listings WHERE id = $1", [listingId]);
    if (l) listingTitle = l.title;
    else listingId = null;
  }

  const fields = {
    property_type: clean(b.propertyType, 40),
    locations: clean(b.locations, 200),
    budget_min: num(b.budgetMin),
    budget_max: num(b.budgetMax),
    bedrooms: num(b.bedrooms),
    timeline: clean(b.timeline, 60),
    requirements: clean(b.requirements, 1000),
  };

  // Reuse the existing consultant thread so the customer keeps one conversation.
  let threadId: number | null = null;
  try {
    threadId = await getOrCreateConsultantThread(user.id);
  } catch { /* the consultation is still worth recording without a thread */ }

  const now = nowIso();
  const row = await q1<{ id: number }>(
    `INSERT INTO consultations
      (user_id, thread_id, listing_id, intent, property_type, locations, budget_min, budget_max,
       bedrooms, timeline, requirements, contact_method, contact_channel, phone, callback_window,
       status, created_at, updated_at, last_activity_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'new',$16,$16,$16)
     RETURNING id`,
    [user.id, threadId, listingId, intent, fields.property_type, fields.locations,
     fields.budget_min, fields.budget_max, fields.bedrooms, fields.timeline, fields.requirements,
     contactMethod, contactChannel, phone, clean(b.callbackWindow, 60), now]
  );
  const id = Number(row!.id);

  // Open the conversation with the qualified summary, carrying the property as a card.
  if (threadId) {
    const payload = listingId ? JSON.stringify({ kind: "listing", id: listingId }) : null;
    try {
      await postMessage(threadId, user.id, user.full_name, openingMessage(intent, fields, listingTitle), false);
      if (payload) {
        await run("UPDATE messages SET payload_json = $1 WHERE id = (SELECT MAX(id) FROM messages WHERE thread_id = $2)",
          [payload, threadId]);
      }
    } catch { /* best effort: the consultation row is the source of truth */ }
  }

  const admins = await q<{ id: number }>("SELECT id FROM users WHERE role = 'admin'");
  for (const a of admins) {
    if (Number(a.id) === user.id) continue;
    // Points at Messages, where the conversation actually lives today. The admin
    // consultation queue lands in the next phase; this href moves with it.
    await notify(Number(a.id), "message", `New consultation: ${INTENT_LABEL[intent]}`,
      listingTitle ? `${user.full_name} about ${listingTitle}` : `${user.full_name} needs help.`,
      threadId ? `/dashboard/messages?thread=${threadId}` : "/dashboard/messages");
  }
  await notify(user.id, "success", "Consultation received",
    contactMethod === "callback"
      ? "A consultant will reach out on the number you gave us."
      : "A consultant will reply in your messages shortly.",
    threadId ? `/dashboard/messages?thread=${threadId}` : "/dashboard/messages");

  return NextResponse.json({ ok: true, id, threadId });
}

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const isAdmin = user.role === "admin";
  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  if (!isAdmin) {
    const mine = await q(
      "SELECT * FROM consultations WHERE user_id = $1 ORDER BY id DESC LIMIT 50", [user.id]
    );
    return NextResponse.json({ consultations: mine });
  }

  const rows = await q(
    `SELECT c.*, u.full_name AS user_name, u.email AS user_email, u.avatar_color,
            l.title AS listing_title, l.price AS listing_price, l.location_city,
            a.full_name AS assigned_name
       FROM consultations c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN listings l ON l.id = c.listing_id
       LEFT JOIN users a ON a.id = c.assigned_admin_id
      ${status && status !== "all" ? "WHERE c.status = $1" : ""}
      ORDER BY CASE WHEN c.status = 'new' THEN 0 ELSE 1 END, c.last_activity_at DESC, c.id DESC
      LIMIT 200`,
    status && status !== "all" ? [status] : []
  );
  return NextResponse.json({ consultations: rows });
}

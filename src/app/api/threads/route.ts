import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getOrCreateThread, listInbox, postMessage } from "@/lib/messaging";

// Inbox: direct chats, plus the shared consultant queue for admins.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ threads: await listInbox(user.id, user.role === "admin"), meId: user.id });
}

// Start (or reopen) a direct conversation. Body: { peerId, listingId?, body? }
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const peerId = Number(b.peerId);
  if (!peerId) return NextResponse.json({ error: "No recipient." }, { status: 400 });
  if (peerId === user.id) return NextResponse.json({ error: "You can't message yourself." }, { status: 400 });

  let id: number;
  try {
    id = await getOrCreateThread(user.id, peerId, b.listingId ? Number(b.listingId) : null);
  } catch {
    return NextResponse.json({ error: "Couldn't open that conversation." }, { status: 400 });
  }

  const body = typeof b.body === "string" ? b.body.trim() : "";
  if (body) await postMessage(id, user.id, user.full_name, body, user.role === "admin");

  return NextResponse.json({ ok: true, id });
}

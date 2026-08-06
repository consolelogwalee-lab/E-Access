import { NextResponse } from "next/server";
import { q1 } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getOrCreateThread } from "@/lib/messaging";

/**
 * "Speak to a Real Estate Consultant."
 * Guests are sent through login and come straight back here; signed-in users
 * land in a real conversation with the E-Access consultant.
 */
export async function GET(req: Request) {
  const base = new URL(req.url).origin;
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(`${base}/auth/login?next=${encodeURIComponent("/api/consultant/start")}`);
  }

  const consultant =
    (await q1<{ id: number }>("SELECT id FROM users WHERE email = 'console.log.walee@gmail.com'")) ??
    (await q1<{ id: number }>("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1"));

  if (!consultant || Number(consultant.id) === user.id) {
    // The consultant themselves (or no consultant configured): just open Messages.
    return NextResponse.redirect(`${base}/dashboard/messages`);
  }

  const threadId = await getOrCreateThread(user.id, Number(consultant.id), null);
  return NextResponse.redirect(`${base}/dashboard/messages?thread=${threadId}`);
}

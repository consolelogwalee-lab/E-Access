import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getOrCreateConsultantThread } from "@/lib/messaging";

/**
 * "Speak to a Real Estate Consultant."
 * Guests are sent through login and come straight back here; signed-in users
 * land in their shared consultant thread, which every admin can see and answer.
 */
export async function GET(req: Request) {
  const base = new URL(req.url).origin;
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(`${base}/auth/login?next=${encodeURIComponent("/api/consultant/start")}`);
  }

  // Admins don't file requests to themselves — send them to the queue in Messages.
  if (user.role === "admin") {
    return NextResponse.redirect(`${base}/dashboard/messages`);
  }

  const threadId = await getOrCreateConsultantThread(user.id);
  return NextResponse.redirect(`${base}/dashboard/messages?thread=${threadId}`);
}

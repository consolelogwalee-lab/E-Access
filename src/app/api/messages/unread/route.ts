import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { totalUnread } from "@/lib/messaging";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ unread: 0 });
  return NextResponse.json({ unread: await totalUnread(user.id) });
}

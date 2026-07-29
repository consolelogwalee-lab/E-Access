import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { signedUrl, storageEnabled } from "@/lib/storage";

/** Returns a short-lived signed URL for a private document.
 *  Owners can access files under their own prefix (u{id}/...); admins can access all. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!storageEnabled()) return NextResponse.json({ error: "File storage is not configured." }, { status: 503 });
  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";
  if (!path || path.includes("..")) return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  const isOwner = path.startsWith(`u${user.id}/`);
  if (!isOwner && user.role !== "admin")
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const signed = await signedUrl(path);
  if (!signed) return NextResponse.json({ error: "Could not open the file." }, { status: 502 });
  return NextResponse.redirect(signed);
}

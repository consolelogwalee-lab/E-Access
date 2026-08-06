import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const b = await req.json();

  if (b.fullName) {
    if (String(b.fullName).trim().length < 2)
      return NextResponse.json({ error: "Name is too short." }, { status: 400 });
    await run("UPDATE users SET full_name = $1 WHERE id = $2", [String(b.fullName).trim(), user.id]);
  }

  if (typeof b.avatarUrl === "string") {
    await run("UPDATE users SET avatar_url = $1 WHERE id = $2", [b.avatarUrl.trim() || null, user.id]);
  }

  if (b.newPassword) {
    if (String(b.newPassword).length < 8)
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    const row = await q1<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user.id]);
    if (!row || !bcrypt.compareSync(String(b.currentPassword ?? ""), row.password_hash))
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    await run("UPDATE users SET password_hash = $1 WHERE id = $2", [bcrypt.hashSync(String(b.newPassword), 10), user.id]);
  }

  return NextResponse.json({ ok: true });
}

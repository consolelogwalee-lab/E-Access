import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { q1, run } from "@/lib/db";
import { currentUser, destroySession } from "@/lib/auth";
import { deleteUserCascade } from "@/lib/users";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ user });
}

// Self-service account deletion.
export async function DELETE() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  // The last admin shouldn't be able to lock the platform out of admin access.
  if (user.role === "admin") {
    const others = await q1<{ c: number | string }>("SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND id <> $1", [user.id]);
    if (Number(others?.c ?? 0) === 0)
      return NextResponse.json({ error: "You're the only admin. Make someone else an admin before deleting your account." }, { status: 400 });
  }
  await deleteUserCascade(user.id);
  await destroySession();
  return NextResponse.json({ ok: true });
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

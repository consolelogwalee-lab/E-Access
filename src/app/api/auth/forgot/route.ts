import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { q1, run } from "@/lib/db";

export async function POST(req: Request) {
  const { email } = await req.json();
  const user = await q1<{ id: number }>("SELECT id FROM users WHERE email = $1", [String(email ?? "").toLowerCase()]);
  if (!user)
    return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
  const token = crypto.randomBytes(16).toString("hex");
  await run("UPDATE users SET reset_token = $1 WHERE id = $2", [token, user.id]);
  return NextResponse.json({ ok: true, simulatedResetLink: `/auth/reset?token=${token}` });
}

export async function PUT(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password || password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  const user = await q1<{ id: number }>("SELECT id FROM users WHERE reset_token = $1", [String(token)]);
  if (!user)
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  await run("UPDATE users SET password_hash = $1, reset_token = NULL WHERE id = $2", [bcrypt.hashSync(password, 10), user.id]);
  return NextResponse.json({ ok: true });
}

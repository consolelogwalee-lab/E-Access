import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { q1 } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  const user = await q1<{ id: number; password_hash: string; email_verified: number; preferences_json: string | null }>(
    "SELECT id, password_hash, email_verified, preferences_json FROM users WHERE email = $1",
    [String(email).toLowerCase()]
  );
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    emailVerified: !!Number(user.email_verified),
    hasPreferences: !!user.preferences_json,
  });
}

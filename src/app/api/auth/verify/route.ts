import { NextResponse } from "next/server";
import { q1, run } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { sendVerificationCode } from "@/lib/email";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { code } = await req.json();
  const row = await q1<{ verify_code: string | null }>("SELECT verify_code FROM users WHERE id = $1", [user.id]);
  if (!row?.verify_code || row.verify_code !== String(code).trim())
    return NextResponse.json({ error: "That code doesn't match. Try again." }, { status: 400 });
  await run("UPDATE users SET email_verified = 1, verify_code = NULL WHERE id = $1", [user.id]);
  return NextResponse.json({ ok: true });
}

export async function PUT() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await run("UPDATE users SET verify_code = $1 WHERE id = $2", [code, user.id]);
  const emailed = await sendVerificationCode(user.email, user.full_name, code);
  return NextResponse.json(emailed ? { ok: true, emailed: true } : { ok: true, simulatedEmailCode: code });
}

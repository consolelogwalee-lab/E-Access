import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { q1 } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { fullName, email, password } = await req.json();
  if (!fullName || !email || !password)
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const exists = await q1("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
  if (exists)
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = bcrypt.hashSync(password, 10);
  const colors = ["#0D06A7", "#5EA500", "#B45309", "#0E7490", "#7C3AED"];
  const row = await q1<{ id: number }>(
    "INSERT INTO users (full_name, email, password_hash, verify_code, avatar_color) VALUES ($1,$2,$3,$4,$5) RETURNING id",
    [fullName, email.toLowerCase(), hash, code, colors[Math.floor(Math.random() * colors.length)]]
  );
  await createSession(Number(row!.id));
  // Simulated email: return the code so the UI can display it (swap for a real provider in production)
  return NextResponse.json({ ok: true, simulatedEmailCode: code });
}

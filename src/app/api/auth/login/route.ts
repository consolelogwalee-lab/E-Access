import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { q1, run } from "@/lib/db";
import { createSession } from "@/lib/auth";

/** In-memory login throttle: max 8 failed attempts per email per 10 minutes per server instance. */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function throttled(key: string): boolean {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.first > WINDOW_MS) return false;
  return a.count >= MAX_ATTEMPTS;
}
function recordFailure(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || now - a.first > WINDOW_MS) attempts.set(key, { count: 1, first: now });
  else a.count += 1;
  if (attempts.size > 5000) attempts.clear();
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  const key = String(email).toLowerCase();
  if (throttled(key))
    return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  const user = await q1<{ id: number; password_hash: string; email_verified: number; preferences_json: string | null }>(
    "SELECT id, password_hash, email_verified, preferences_json FROM users WHERE email = $1",
    [String(email).toLowerCase()]
  );
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    recordFailure(key);
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  attempts.delete(key);
  await createSession(user.id);
  // opportunistic cleanup of expired sessions (expires_at stored as ISO text)
  run("DELETE FROM sessions WHERE expires_at < $1", [new Date().toISOString()]).catch(() => {});
  return NextResponse.json({
    ok: true,
    emailVerified: !!Number(user.email_verified),
    hasPreferences: !!user.preferences_json,
  });
}

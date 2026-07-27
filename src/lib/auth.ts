import { cookies } from "next/headers";
import crypto from "node:crypto";
import { q1, run, daysFromNowIso, nowIso } from "./db";

export type SessionUser = {
  id: number;
  full_name: string;
  email: string;
  email_verified: number;
  preferences_json: string | null;
  avatar_color: string;
  role: string;
};

const COOKIE = "eaccess_session";

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  await run("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2,$3)", [
    token, userId, daysFromNowIso(30),
  ]);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE token = $1", [token]);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return q1<SessionUser>(
    `SELECT u.id, u.full_name, u.email, u.email_verified, u.preferences_json, u.avatar_color, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > $2`,
    [token, nowIso()]
  );
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await currentUser();
  return user && user.role === "admin" ? user : null;
}

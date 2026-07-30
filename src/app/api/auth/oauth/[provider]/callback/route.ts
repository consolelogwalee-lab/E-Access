import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { q1 } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { exchangeProfile, isProvider } from "@/lib/oauth";

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const url = new URL(req.url);
  const origin = url.origin;
  const { provider } = await ctx.params;
  if (!isProvider(provider)) return NextResponse.redirect(`${origin}/auth?error=provider`);

  const jar = await cookies();
  const expected = jar.get("eaccess_oauth_state")?.value;
  jar.delete("eaccess_oauth_state");
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  if (!code || !state || !expected || state !== expected)
    return NextResponse.redirect(`${origin}/auth?error=oauth`);

  const profile = await exchangeProfile(provider, code, `${origin}/api/auth/oauth/${provider}/callback`);
  if (!profile?.email) return NextResponse.redirect(`${origin}/auth?error=email`);

  const email = profile.email.toLowerCase();
  let user = await q1<{ id: number; preferences_json: string | null }>(
    "SELECT id, preferences_json FROM users WHERE email = $1", [email]
  );
  if (!user) {
    const colors = ["#0D06A7", "#5EA500", "#B45309", "#0E7490", "#7C3AED"];
    const randomPw = bcrypt.hashSync(crypto.randomBytes(24).toString("hex"), 10);
    user = await q1<{ id: number; preferences_json: string | null }>(
      `INSERT INTO users (full_name, email, password_hash, email_verified, avatar_color, oauth_provider)
       VALUES ($1,$2,$3,1,$4,$5) RETURNING id, preferences_json`,
      [profile.name ?? email.split("@")[0], email, randomPw, colors[Math.floor(Math.random() * colors.length)], provider]
    );
  } else {
    // existing account signing in socially: mark the email verified (the provider vouches for it)
    await q1("UPDATE users SET email_verified = 1, oauth_provider = COALESCE(oauth_provider, $2) WHERE id = $1 RETURNING id", [user.id, provider]);
  }
  await createSession(Number(user!.id));
  return NextResponse.redirect(user!.preferences_json ? `${origin}/dashboard` : `${origin}/auth/preferences`);
}

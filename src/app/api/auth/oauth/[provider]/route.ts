import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { authRedirectUrl, isProvider } from "@/lib/oauth";

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const origin = new URL(req.url).origin;
  if (!isProvider(provider)) return NextResponse.redirect(`${origin}/auth?error=provider`);
  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;
  const url = authRedirectUrl(provider, redirectUri, state);
  if (!url) return NextResponse.redirect(`${origin}/auth?error=provider`);
  const jar = await cookies();
  jar.set("eaccess_oauth_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(url);
}

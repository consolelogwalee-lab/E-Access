import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Site lock.
 *
 * Controlled entirely by environment variables in Vercel, so locking and
 * unlocking never needs a code change:
 *
 *   SITE_LOCKED=1               Lock immediately.
 *   SITE_LOCK_AT=<ISO date>     Lock automatically from this moment onward.
 *   SITE_UNLOCK_KEY=<secret>    Visit /?unlock=<secret> once to bypass the lock
 *                               on your own browser for 30 days.
 *
 * When locked, every page, API route and asset returns a genuine 404 that is
 * byte-for-byte the Next.js "page could not be found" response, so the site is
 * indistinguishable from one that was never deployed.
 *
 * Remove SITE_LOCKED and SITE_LOCK_AT to bring the site back. Nothing is
 * deleted and no data is touched by any of this.
 */

const UNLOCK_COOKIE = "eaccess_open";
const UNLOCK_PARAM = "unlock";

function isLocked(): boolean {
  if (process.env.SITE_LOCKED === "1") return true;

  const at = process.env.SITE_LOCK_AT;
  if (!at) return false;

  const when = Date.parse(at);
  if (!Number.isFinite(when)) return false;

  return Date.now() >= when;
}

// The stock Next.js 404 body, reproduced so a locked site looks like any
// other address that simply does not exist.
const NOT_FOUND = `<!DOCTYPE html><html lang="en"><head><title>404: This page could not be found.</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div style="font-family:system-ui,&quot;Segoe UI&quot;,Roboto,Helvetica,Arial,sans-serif,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;;height:100vh;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center"><div><style>body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}</style><h1 class="next-error-h1" style="display:inline-block;margin:0 20px 0 0;padding:0 23px 0 0;font-size:24px;font-weight:500;vertical-align:top;line-height:49px">404</h1><div style="display:inline-block"><h2 style="font-size:14px;font-weight:400;line-height:49px;margin:0">This page could not be found.</h2></div></div></div></body></html>`;

function notFound() {
  return new NextResponse(NOT_FOUND, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, must-revalidate",
      "x-robots-tag": "noindex",
    },
  });
}

export function proxy(request: NextRequest) {
  if (!isLocked()) return NextResponse.next();

  const key = process.env.SITE_UNLOCK_KEY;

  if (key) {
    const url = request.nextUrl;

    // One-time unlock: /?unlock=KEY drops a cookie and cleans the URL.
    if (url.searchParams.get(UNLOCK_PARAM) === key) {
      const clean = new URL(url.toString());
      clean.searchParams.delete(UNLOCK_PARAM);

      const response = NextResponse.redirect(clean);
      response.cookies.set(UNLOCK_COOKIE, key, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    if (request.cookies.get(UNLOCK_COOKIE)?.value === key) {
      return NextResponse.next();
    }
  }

  return notFound();
}

export const config = {
  // Everything except the build assets, so pages, API routes and uploaded
  // media all go dark together.
  matcher: ["/((?!_next/static|_next/image).*)"],
};

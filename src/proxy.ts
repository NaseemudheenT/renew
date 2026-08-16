import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Must match SESSION_COOKIE in lib/auth/session.ts. */
const SESSION_COOKIE = "renew_session";

/**
 * Optimistic auth gate (Next 16 "proxy", formerly middleware). This only does a
 * cheap cookie-presence check to avoid a flash of protected UI — the real
 * authorization happens in the (app) server layout via the Firebase Admin SDK,
 * which can't run on the edge. Never trust this alone.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reminders/:path*",
    "/calendar/:path*",
    "/tasks/:path*",
    "/documents/:path*",
    "/payments/:path*",
    "/notifications/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/shared/constants/auth.constants";

// Gates the `(account)` route group by the mere PRESENCE of the refresh
// cookie — not signature/expiry verification, since proxy runs on the
// Edge and shouldn't call the API. This is a redirect-early optimization;
// the actual auth check happens per-request via the API + apiFetch's
// AUTH_SESSION_INVALID handling (see features/identity/context.md).
//
// Renamed from `middleware.ts`/`export function middleware` — Next.js 16
// deprecated that convention in favor of `proxy.ts`/`export function proxy`.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*"],
};

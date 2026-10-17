import { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
} from "./lib/cookies";

import { refreshResponseSchema } from "./lib/api-schemas";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  let access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  let refreshed: string | null = null;

  // Access token expired (cookie gone) but refresh token present: renew silently.
  if (!access && refresh) {
    try {
      const res = await fetch(`${process.env.API_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const parsed = refreshResponseSchema.safeParse(await res.json());
        if (parsed.success) {
          refreshed = parsed.data.access;
          access = refreshed;
          request.cookies.set(ACCESS_COOKIE, refreshed); // visible to Server Components this request
        }
      }
    } catch {
      /* fall through to login redirect */
    }
  }

    if (!access && !isPublic) {
      if (pathname.startsWith("/api/")) {
        const res = NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
        res.cookies.delete(REFRESH_COOKIE);
        return res;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      const res = NextResponse.redirect(url);
      res.cookies.delete(REFRESH_COOKIE);
      return res;
    }

  if (access && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({ request });
  if (refreshed) {
    response.cookies.set(ACCESS_COOKIE, refreshed, accessCookieOptions(refreshed));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
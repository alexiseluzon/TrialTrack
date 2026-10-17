import { jwtExpiry } from "./jwt";

export const ACCESS_COOKIE = "tt_access";
export const REFRESH_COOKIE = "tt_refresh";

const REFRESH_MAX_AGE = 60 * 60 * 24; // matches simplejwt's 1-day default
const isProd = () => process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "0";

const base = (secure: boolean) => ({
  httpOnly: true as const,
  secure,
  sameSite: "lax" as const,
  path: "/",
});

export function accessCookieOptions(token: string, now = Date.now(), secure = isProd()) {
  const exp = jwtExpiry(token);
  const ttl = exp ? Math.floor(exp - now / 1000) : 300;
  return { ...base(secure), maxAge: Math.max(ttl, 0) };
}

export function refreshCookieOptions(secure = isProd()) {
  return { ...base(secure), maxAge: REFRESH_MAX_AGE };
}
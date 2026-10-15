import "server-only";
import { cookies } from "next/headers";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "./cookies";

export async function setSession(access: string, refresh: string) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, access, accessCookieOptions(access));
  jar.set(REFRESH_COOKIE, refresh, refreshCookieOptions());
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}
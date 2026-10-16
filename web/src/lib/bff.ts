import "server-only";
import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "./session";

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function forwardToApi(
  path: string,
  init: { method?: "GET" | "POST"; body?: string } = {},
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  try {
    const res = await fetch(`${process.env.API_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body,
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "API unreachable" }, { status: 502 });
  }
}
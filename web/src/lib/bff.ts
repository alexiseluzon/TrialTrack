import "server-only";
import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "./session";

import type { ZodType } from "zod";

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function forwardToApi(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: string } = {},
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
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "API unreachable" }, { status: 502 });
  }
}

export const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });

export async function parseJson<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  const bad = (msg: string) => ({ response: NextResponse.json({ error: msg }, { status: 400 }) });
  const text = await request.text();
  if (!text || text.length > 5_000) return bad("Invalid request");
  try {
    const parsed = schema.safeParse(JSON.parse(text));
    return parsed.success ? { data: parsed.data } : bad("Invalid input");
  } catch {
    return bad("Invalid request");
  }
}
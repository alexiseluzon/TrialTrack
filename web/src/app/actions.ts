"use server";

import { loginSchema, type LoginInput } from "@/lib/schemas";
import { clearSession, setSession } from "@/lib/session";

import { tokenPairSchema } from "@/lib/api-schemas";

type Result = { ok: true } | { ok: false; error: string };

export async function loginAction(input: LoginInput): Promise<Result> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid username and password." };
  }

  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    return { ok: false, error: "Server unreachable. Try again shortly." };
  }

  if (res.status === 429) return { ok: false, error: "Too many attempts. Wait a minute." };
  if (res.status >= 500) return { ok: false, error: "API error. Try again shortly." };
  if (!res.ok) return { ok: false, error: "Invalid username or password." };

  let tokens;
  try {
    tokens = tokenPairSchema.parse(await res.json());
  } catch {
    return { ok: false, error: "API error. Try again shortly." };
  }

  await setSession(tokens.access, tokens.refresh);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await clearSession();
}
"use server";

import { tokenPairSchema } from "@/lib/api-schemas";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { clearSession, setSession } from "@/lib/session";

type Result = { ok: true } | { ok: false; error: string };

async function authenticate(username: string, password: string): Promise<Result> {
  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}/api/auth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
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

export async function loginAction(input: LoginInput): Promise<Result> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid username and password." };
  return authenticate(parsed.data.username, parsed.data.password);
}

export async function demoLoginAction(role: "member" | "admin"): Promise<Result> {
  // Credentials stay in server-only env vars; the client only picks a role.
  const demo =
    role === "member"
      ? { username: "demo", password: process.env.DEMO_MEMBER_PASSWORD }
      : role === "admin"
        ? { username: "demo_admin", password: process.env.DEMO_ADMIN_PASSWORD }
        : null;
  if (!demo?.password) return { ok: false, error: "Demo login is not available right now." };
  return authenticate(demo.username, demo.password);
}

export async function logoutAction(): Promise<void> {
  await clearSession();
}
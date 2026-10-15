import "server-only";
import { redirect } from "next/navigation";

import { getAccessToken } from "./session";

export async function apiGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  if (!token) redirect("/session/expired");

  let res: Response;
  try {
    res = await fetch(`${process.env.API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(45_000), // Render free tier cold start
    });
  } catch {
    throw new Error("API unreachable");
  }

  if (res.status === 401) redirect("/session/expired");
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return (await res.json()) as T;
}
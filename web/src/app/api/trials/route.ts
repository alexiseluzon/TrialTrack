import { NextRequest } from "next/server";

import { forbidden, forwardToApi, isSameOrigin, parseJson } from "@/lib/bff";
import { parseFilters, toSearchParams } from "@/lib/trial-params";
import { trialPayloadSchema } from "@/lib/trial-schema";

export async function GET(request: NextRequest) {
  // Re-built from allowlisted values only; nothing raw reaches Django.
  const qs = toSearchParams(parseFilters(request.nextUrl.searchParams));
  qs.set("page_size", "20");
  return forwardToApi(`/api/trials/?${qs.toString()}`);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbidden();
  const parsed = await parseJson(request, trialPayloadSchema);
  if ("response" in parsed) return parsed.response;
  return forwardToApi("/api/trials/", { method: "POST", body: JSON.stringify(parsed.data) });
}
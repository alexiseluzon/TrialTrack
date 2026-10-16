import { NextRequest } from "next/server";

import { forwardToApi } from "@/lib/bff";
import { parseFilters, toSearchParams } from "@/lib/trial-params";

export async function GET(request: NextRequest) {
  // Re-built from allowlisted values only; nothing raw reaches Django.
  const qs = toSearchParams(parseFilters(request.nextUrl.searchParams));
  qs.set("page_size", "20");
  return forwardToApi(`/api/trials/?${qs.toString()}`);
}
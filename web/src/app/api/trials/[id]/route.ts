import { NextRequest, NextResponse } from "next/server";

import { forbidden, forwardToApi, isSameOrigin, parseJson } from "@/lib/bff";
import { trialPayloadSchema } from "@/lib/trial-schema";

type Ctx = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });
const validId = (id: string) => /^\d{1,9}$/.test(id);

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isSameOrigin(request)) return forbidden();
  if (!validId(id)) return notFound();
  const parsed = await parseJson(request, trialPayloadSchema);
  if ("response" in parsed) return parsed.response;
  return forwardToApi(`/api/trials/${id}/`, { method: "PATCH", body: JSON.stringify(parsed.data) });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isSameOrigin(request)) return forbidden();
  if (!validId(id)) return notFound();
  return forwardToApi(`/api/trials/${id}/`, { method: "DELETE" });
}
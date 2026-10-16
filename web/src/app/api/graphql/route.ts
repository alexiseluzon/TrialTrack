import { NextRequest, NextResponse } from "next/server";

import { forwardToApi, isSameOrigin } from "@/lib/bff";

const MAX_BODY_CHARS = 10_000;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.text();
  if (!body || body.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  return forwardToApi("/graphql/", { method: "POST", body });
}
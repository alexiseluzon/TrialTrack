import { forwardToApi } from "@/lib/bff";

export async function GET() {
  return forwardToApi("/api/sponsors/?page_size=100");
}
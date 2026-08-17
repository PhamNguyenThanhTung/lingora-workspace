import { NextRequest } from "next/server";
import { proxyAiRequest, isSrsBody } from "@/lib/api/proxy";
import { errorEnvelope } from "@/lib/api/error";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json(errorEnvelope("INVALID_INPUT", "Request body must be valid JSON."), { status: 400 }); }
  if (!isSrsBody(body)) return Response.json(errorEnvelope("INVALID_INPUT", "At least one review item is required."), { status: 400 });
  return proxyAiRequest("srs", body);
}

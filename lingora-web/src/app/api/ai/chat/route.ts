import { NextRequest } from "next/server";
import { proxyAiRequest, isChatBody } from "@/lib/api/proxy";
import { errorEnvelope } from "@/lib/api/error";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json(errorEnvelope("INVALID_INPUT", "Request body must be valid JSON."), { status: 400 }); }
  if (!isChatBody(body)) return Response.json(errorEnvelope("INVALID_INPUT", "A hotel roleplay message is required."), { status: 400 });
  return proxyAiRequest("chat", body);
}

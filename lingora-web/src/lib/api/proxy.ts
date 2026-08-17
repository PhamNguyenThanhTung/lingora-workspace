import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorEnvelope, isErrorEnvelope } from "./error";
import { isChatRoleplayResponse, isSrsScheduleResponse } from "@/features/ai/contracts";

const TIMEOUT_MS = 8000;
const AI_PATHS = { srs: "/v1/srs/schedule", chat: "/v1/chat/roleplay" } as const;

export async function proxyAiRequest(kind: keyof typeof AI_PATHS, body: unknown) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(errorEnvelope("UNAUTHORIZED", "Please sign in to continue."), { status: 401 });

  const { data: { session } } = await supabase.auth.getSession();
  const baseUrl = process.env.AI_API_BASE_URL;
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    return NextResponse.json(errorEnvelope("CONFIGURATION_ERROR", "AI service is not configured."), { status: 500 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(new URL(AI_PATHS[kind], baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
      redirect: "error"
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(isErrorEnvelope(payload) ? payload : errorEnvelope("AI_ERROR", "The AI service could not complete this request."), { status: response.status });
    }
    const valid = kind === "srs" ? isSrsScheduleResponse(payload) : isChatRoleplayResponse(payload);
    if (!valid) return NextResponse.json(errorEnvelope("MALFORMED_RESPONSE", "The AI service returned an invalid response."), { status: 502 });
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const code = error instanceof DOMException && error.name === "AbortError" ? "AI_TIMEOUT" : "AI_UNAVAILABLE";
    return NextResponse.json(errorEnvelope(code, code === "AI_TIMEOUT" ? "The AI service took too long to respond." : "The AI service is temporarily unavailable."), { status: code === "AI_TIMEOUT" ? 504 : 503 });
  } finally {
    clearTimeout(timer);
  }
}

export function isSrsBody(value: unknown): value is { items: unknown[]; now?: string; client?: string } {
  if (!value || typeof value !== "object") return false;
  const body = value as { items?: unknown; now?: unknown; client?: unknown };
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) return false;
  if (body.now !== undefined && (typeof body.now !== "string" || body.now.length > 64 || Number.isNaN(Date.parse(body.now)))) return false;
  if (body.client !== undefined && (typeof body.client !== "string" || body.client.length > 50)) return false;
  return body.items.every((item) => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as { vocabulary_id?: unknown; ease_factor?: unknown; history?: unknown };
    if (typeof candidate.vocabulary_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate.vocabulary_id)) return false;
    if (candidate.ease_factor !== undefined && (typeof candidate.ease_factor !== "number" || !Number.isFinite(candidate.ease_factor) || candidate.ease_factor < 1 || candidate.ease_factor > 5)) return false;
    if (candidate.history !== undefined && (!Array.isArray(candidate.history) || candidate.history.length > 100)) return false;
    return !Array.isArray(candidate.history) || candidate.history.every((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const history = entry as { is_correct?: unknown; interval_days?: unknown; reviewed_at?: unknown };
      return typeof history.is_correct === "boolean" && typeof history.interval_days === "number" && Number.isFinite(history.interval_days) && history.interval_days >= 0 && history.interval_days <= 36500 && (history.reviewed_at === undefined || (typeof history.reviewed_at === "string" && history.reviewed_at.length <= 64 && !Number.isNaN(Date.parse(history.reviewed_at))));
    });
  });
}

export function isChatBody(value: unknown): value is { scenario_code: string; lang: "en"; user_message: string; history?: unknown[]; client?: string } {
  if (!value || typeof value !== "object") return false;
  const body = value as { scenario_code?: unknown; lang?: unknown; user_message?: unknown; history?: unknown; client?: unknown };
  if (body.scenario_code !== "hotel_booking" || body.lang !== "en" || typeof body.user_message !== "string" || body.user_message.trim().length === 0 || body.user_message.length > 500 || (body.client !== undefined && (typeof body.client !== "string" || body.client.length > 50))) return false;
  if (body.history !== undefined && (!Array.isArray(body.history) || body.history.length > 50)) return false;
  return !Array.isArray(body.history) || body.history.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const message = entry as { role?: unknown; content?: unknown };
    return (message.role === "user" || message.role === "ai") && typeof message.content === "string" && message.content.length <= 500;
  });
}

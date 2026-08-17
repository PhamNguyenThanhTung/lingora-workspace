export type ErrorEnvelope = {
  error: { code: string; message: string; detail: unknown | null };
};

export type ReviewHistoryItem = {
  is_correct: boolean;
  interval_days: number;
  reviewed_at?: string;
};

export type SrsScheduleRequest = {
  now?: string;
  items: Array<{
    vocabulary_id: string;
    ease_factor?: number;
    history?: ReviewHistoryItem[];
  }>;
  client?: string;
};

export type SrsScheduleResponse = {
  predictions: Array<{
    vocabulary_id: string;
    recall_probability: number;
    priority: "REVIEW_NOW" | "REVIEW_TODAY" | "REVIEW_LATER";
    recommended_interval_days: number;
  }>;
  model_version: string;
  scheduler_version: string;
  is_mock: boolean;
  latency_ms: number;
};

export type ChatRoleplayRequest = {
  scenario_code: string;
  lang: "en";
  history?: Array<{ role: "user" | "ai"; content: string }>;
  user_message: string;
  client?: string;
};

export type ChatRoleplayResponse = {
  ai_reply: string;
  model_version: string;
  is_mock: boolean;
  latency_ms: number;
};

export function isSrsScheduleResponse(value: unknown): value is SrsScheduleResponse {
  if (!value || typeof value !== "object") return false;
  const body = value as Partial<SrsScheduleResponse>;
  return Array.isArray(body.predictions) && body.predictions.length > 0 && body.predictions.every((item) => {
    if (!item || typeof item !== "object") return false;
    const prediction = item as Partial<SrsScheduleResponse["predictions"][number]>;
    return typeof prediction.vocabulary_id === "string" && typeof prediction.recall_probability === "number" &&
      prediction.recall_probability >= 0 && prediction.recall_probability <= 1 &&
      (prediction.priority === "REVIEW_NOW" || prediction.priority === "REVIEW_TODAY" || prediction.priority === "REVIEW_LATER") &&
      typeof prediction.recommended_interval_days === "number" && prediction.recommended_interval_days >= 0;
  }) && typeof body.model_version === "string" && body.model_version.length <= 100 &&
    typeof body.scheduler_version === "string" && body.scheduler_version.length <= 100 &&
    typeof body.is_mock === "boolean" && Number.isFinite(body.latency_ms) && (body.latency_ms ?? -1) >= 0;
}

export function isChatRoleplayResponse(value: unknown): value is ChatRoleplayResponse {
  if (!value || typeof value !== "object") return false;
  const body = value as Partial<ChatRoleplayResponse>;
  return typeof body.ai_reply === "string" && body.ai_reply.length <= 5000 &&
    typeof body.model_version === "string" && body.model_version.length <= 100 &&
    typeof body.is_mock === "boolean" && Number.isFinite(body.latency_ms) && (body.latency_ms ?? -1) >= 0;
}

export const FOUNDATION_SRS_REQUEST: SrsScheduleRequest = {
  now: "2026-08-17T12:00:00Z",
  items: [{
    vocabulary_id: "1069c152-a9f6-54e3-93d0-b488fc7e44e8",
    ease_factor: 2.5,
    history: [{ is_correct: true, interval_days: 1, reviewed_at: "2026-08-16T12:00:00Z" }]
  }],
  client: "web/1.0.0"
};

export const FOUNDATION_CHAT_REQUEST: ChatRoleplayRequest = {
  scenario_code: "hotel_booking",
  lang: "en",
  history: [{ role: "ai", content: "Welcome to Sunrise Hotel! How can I help you today?" }],
  user_message: "I want to book a room for two nights.",
  client: "web/1.0.0"
};

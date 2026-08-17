import { isChatRoleplayResponse, isSrsScheduleResponse, type ChatRoleplayRequest, type ChatRoleplayResponse, type SrsScheduleRequest, type SrsScheduleResponse } from "./contracts";
import { isErrorEnvelope, LingoraApiError } from "@/lib/api/error";

async function post<T>(path: string, body: unknown, isResponse: (value: unknown) => value is T): Promise<T> {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || isErrorEnvelope(payload)) {
    if (isErrorEnvelope(payload)) throw new LingoraApiError(response.status, payload);
    throw new LingoraApiError(response.status, { error: { code: "AI_ERROR", message: "The AI service returned an invalid response.", detail: null } });
  }
  if (!isResponse(payload)) throw new LingoraApiError(response.status, { error: { code: "MALFORMED_RESPONSE", message: "The AI service returned an invalid response.", detail: null } });
  return payload;
}

export class AiRepository {
  schedule(request: SrsScheduleRequest) { return post<SrsScheduleResponse>("/api/ai/srs", request, isSrsScheduleResponse); }
  roleplay(request: ChatRoleplayRequest) { return post<ChatRoleplayResponse>("/api/ai/chat", request, isChatRoleplayResponse); }
}

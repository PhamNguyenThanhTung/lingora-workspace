import { describe, expect, it, vi } from "vitest";
import { AiRepository } from "@/features/ai/ai.repository";
import { FOUNDATION_CHAT_REQUEST, FOUNDATION_SRS_REQUEST } from "@/features/ai/contracts";
import { LingoraApiError } from "@/lib/api/error";

describe("AiRepository", () => {
  it("returns a structurally valid SRS response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      predictions: [{ vocabulary_id: FOUNDATION_SRS_REQUEST.items[0].vocabulary_id, recall_probability: 0.72, priority: "REVIEW_TODAY", recommended_interval_days: 2 }],
      model_version: "mock-srs-v1", scheduler_version: "mock-rule-v1", is_mock: true, latency_ms: 10
    }), { status: 200 })));
    await expect(new AiRepository().schedule(FOUNDATION_SRS_REQUEST)).resolves.toMatchObject({ is_mock: true, latency_ms: 10 });
  });

  it("rejects malformed successful payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ is_mock: true }), { status: 200 })));
    await expect(new AiRepository().roleplay(FOUNDATION_CHAT_REQUEST)).rejects.toMatchObject({ envelope: { error: { code: "MALFORMED_RESPONSE" } } });
  });

  it("preserves canonical error codes", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: "MODEL_UNAVAILABLE", message: "Unavailable", detail: null } }), { status: 503 })));
    await expect(new AiRepository().roleplay(FOUNDATION_CHAT_REQUEST)).rejects.toBeInstanceOf(LingoraApiError);
  });
});

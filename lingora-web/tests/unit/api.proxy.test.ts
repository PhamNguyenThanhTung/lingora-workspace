import { beforeEach, describe, expect, it, vi } from "vitest";
import { FOUNDATION_CHAT_REQUEST, FOUNDATION_SRS_REQUEST } from "@/features/ai/contracts";

const getUser = vi.fn();
const getSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser, getSession } }))
}));

import { isChatBody, isSrsBody, proxyAiRequest } from "@/lib/api/proxy";

describe("AI proxy", () => {
  beforeEach(() => {
    process.env.AI_API_BASE_URL = "http://127.0.0.1:8000";
    getUser.mockResolvedValue({ data: { user: { id: "learner" } } });
    getSession.mockResolvedValue({ data: { session: { access_token: "server-only-jwt" } } });
  });

  it("bounds canonical request bodies", () => {
    expect(isSrsBody(FOUNDATION_SRS_REQUEST)).toBe(true);
    expect(isSrsBody({ items: [{ vocabulary_id: "not-a-uuid" }] })).toBe(false);
    expect(isChatBody(FOUNDATION_CHAT_REQUEST)).toBe(true);
    expect(isChatBody({ ...FOUNDATION_CHAT_REQUEST, user_message: "x".repeat(501) })).toBe(false);
    expect(isChatBody({ ...FOUNDATION_CHAT_REQUEST, history: Array.from({ length: 51 }, () => ({ role: "user", content: "x" })) })).toBe(false);
  });

  it("rejects signed-out requests before calling upstream", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await proxyAiRequest("srs", FOUNDATION_SRS_REQUEST);
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses only the fixed upstream path and server token", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ai_reply: "Hello", model_version: "mock-chat-v1", is_mock: true, latency_ms: 15 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await proxyAiRequest("chat", { ...FOUNDATION_CHAT_REQUEST, url: "https://attacker.invalid" });
    expect(response.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string | URL, RequestInit];
    expect(String(url)).toBe("http://127.0.0.1:8000/v1/chat/roleplay");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer server-only-jwt" });
  });

  it("maps timeout, connectivity, and malformed upstream responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new DOMException("aborted", "AbortError"); }));
    await expect(proxyAiRequest("srs", FOUNDATION_SRS_REQUEST).then((response) => response.json())).resolves.toMatchObject({ error: { code: "AI_TIMEOUT" } });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const malformed = await proxyAiRequest("srs", FOUNDATION_SRS_REQUEST);
    expect(malformed.status).toBe(502);
    await expect(malformed.json()).resolves.toMatchObject({ error: { code: "MALFORMED_RESPONSE" } });

    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network unavailable"); }));
    const unavailable = await proxyAiRequest("srs", FOUNDATION_SRS_REQUEST);
    expect(unavailable.status).toBe(503);
    await expect(unavailable.json()).resolves.toMatchObject({ error: { code: "AI_UNAVAILABLE" } });
  });

  it.each([
    [422, "LANG_NOT_SUPPORTED"],
    [503, "MODEL_UNAVAILABLE"]
  ])("preserves canonical upstream status %i and code %s", async (status, code) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code, message: "safe message", detail: null } }), { status })));
    const response = await proxyAiRequest("chat", FOUNDATION_CHAT_REQUEST);
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ error: { code } });
  });
});

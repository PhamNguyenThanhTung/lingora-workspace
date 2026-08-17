import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FoundationStatus } from "@/components/foundation/foundation-status";
import { vi as messages } from "@/i18n/messages/vi";

describe("FoundationStatus", () => {
  it("renders both valid mock results and latency", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const srs = String(input).endsWith("/srs");
      return new Response(JSON.stringify(srs ? {
        predictions: [{ vocabulary_id: "1069c152-a9f6-54e3-93d0-b488fc7e44e8", recall_probability: 0.72, priority: "REVIEW_TODAY", recommended_interval_days: 2 }],
        model_version: "mock-srs-v1", scheduler_version: "mock-rule-v1", is_mock: true, latency_ms: 10
      } : { ai_reply: "Please share your check-in date.", model_version: "mock-chat-v1", is_mock: true, latency_ms: 15 }), { status: 200 });
    }));
    render(createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { mutations: { retry: false } } }) }, createElement(FoundationStatus, { messages })));
    await userEvent.click(screen.getByRole("button", { name: messages.runChecks }));
    expect(await screen.findByText("72%")).toBeInTheDocument();
    expect(await screen.findByText("Please share your check-in date.")).toBeInTheDocument();
    expect(screen.getByText("10 ms")).toBeInTheDocument();
    expect(screen.getByText("15 ms")).toBeInTheDocument();
  });

  it("localizes timeout errors without exposing raw details", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: "AI_TIMEOUT", message: "raw upstream detail", detail: null } }), { status: 504 })));
    render(createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { mutations: { retry: false } } }) }, createElement(FoundationStatus, { messages })));
    await userEvent.click(screen.getByRole("button", { name: messages.runChecks }));
    expect((await screen.findAllByText(messages.timeoutError)).length).toBe(2);
    expect(screen.queryByText("raw upstream detail")).not.toBeInTheDocument();
  });
});

import type { ErrorEnvelope } from "@/features/ai/contracts";

export class LingoraApiError extends Error {
  constructor(public readonly status: number, public readonly envelope: ErrorEnvelope) {
    super(envelope.error.message);
    this.name = "LingoraApiError";
  }
}

export function errorEnvelope(code: string, message: string, detail: unknown = null): ErrorEnvelope {
  return { error: { code, message, detail } };
}

export function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (!value || typeof value !== "object" || !("error" in value)) return false;
  const error = (value as { error?: unknown }).error;
  return Boolean(error && typeof error === "object" && "code" in error && "message" in error);
}

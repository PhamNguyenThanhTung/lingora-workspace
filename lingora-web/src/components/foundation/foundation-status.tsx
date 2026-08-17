"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, FlaskConical } from "lucide-react";
import { AiRepository } from "@/features/ai/ai.repository";
import { FOUNDATION_CHAT_REQUEST, FOUNDATION_SRS_REQUEST } from "@/features/ai/contracts";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { Messages } from "@/i18n/config";
import { LingoraApiError } from "@/lib/api/error";

const repository = new AiRepository();

export function FoundationStatus({ messages }: { messages: Messages }) {
  const srs = useMutation({ mutationFn: () => repository.schedule(FOUNDATION_SRS_REQUEST) });
  const chat = useMutation({ mutationFn: () => repository.roleplay(FOUNDATION_CHAT_REQUEST) });
  const pending = srs.isPending || chat.isPending;
  const run = () => { srs.mutate(); chat.mutate(); };

  return <div className="space-y-6">
    <Button onClick={run} disabled={pending} className="w-full sm:w-auto"><FlaskConical aria-hidden="true" size={18} />{messages.runChecks}</Button>
    <div className="grid gap-4 lg:grid-cols-2" aria-live="polite" aria-busy={pending}>
      <StatusPanel title={messages.srs} pending={srs.isPending} error={srs.error} empty={!srs.data} labels={messages}>
        {srs.data ? <dl className="space-y-2 text-sm"><Row label={messages.mock} value={String(srs.data.is_mock)} /><Row label={messages.model} value={srs.data.model_version} /><Row label={messages.latency} value={`${srs.data.latency_ms} ms`} /><Row label={messages.probability} value={`${Math.round(srs.data.predictions[0].recall_probability * 100)}%`} /></dl> : null}
      </StatusPanel>
      <StatusPanel title={messages.roleplay} pending={chat.isPending} error={chat.error} empty={!chat.data} labels={messages}>
        {chat.data ? <dl className="space-y-2 text-sm"><Row label={messages.mock} value={String(chat.data.is_mock)} /><Row label={messages.model} value={chat.data.model_version} /><Row label={messages.latency} value={`${chat.data.latency_ms} ms`} /><Row label={messages.reply} value={chat.data.ai_reply} /></dl> : null}
      </StatusPanel>
    </div>
  </div>;
}

function StatusPanel({ title, pending, error, empty, labels, children }: { title: string; pending: boolean; error: Error | null; empty: boolean; labels: Messages; children: React.ReactNode }) {
  const state = pending ? labels.running : error ? labels.failed : empty ? labels.waiting : labels.success;
  return <section className="min-h-56 rounded-lg border border-slate-200 bg-slate-50 p-5"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-slate-950">{title}</h2><span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">{error ? <CircleAlert aria-hidden="true" className="text-red-700" size={18} /> : !empty && !pending ? <CheckCircle2 aria-hidden="true" className="text-emerald-700" size={18} /> : null}{state}</span></div>{error ? <Alert tone="error">{localizedError(error, labels)}</Alert> : children}</section>;
}

function localizedError(error: Error, messages: Messages) {
  if (!(error instanceof LingoraApiError)) return messages.genericAiError;
  const code = error.envelope.error.code;
  if (code === "UNAUTHORIZED") return messages.unauthorizedError;
  if (code === "AI_TIMEOUT") return messages.timeoutError;
  if (code === "AI_UNAVAILABLE" || code === "MODEL_UNAVAILABLE") return messages.unavailableError;
  if (code === "MALFORMED_RESPONSE") return messages.malformedError;
  return messages.genericAiError;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="grid gap-1 sm:grid-cols-[9rem_1fr]"><dt className="font-semibold text-slate-600">{label}</dt><dd className="break-words text-slate-950">{value}</dd></div>; }

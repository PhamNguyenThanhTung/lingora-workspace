# Slice 12 — offline PKCE handoff repair

Status: **PASS — offline helper repair, 2026-11-05**. Anti delivered after continuation of the same interrupted conversation `b8fe8184-8f9e-4d21-8de6-b6832579731c`; no valid partial code was discarded. Codex independently reviewed, fixed malformed calendar timestamp validation and removed unused test seams, then verified166 helper checks, two original-navigation/state/restart/privacy checks,41 registration/confirmation regressions and five effective negative controls. [Final evidence](slice-12-pkce-handoff-verification-20261105.md). This package only repairs the helper's demonstrated preflight gap. Slice 12 remains NOT ACCEPTED. Both earlier real attempts are complete/spent; this package authorizes no new registration, email, activation, provider/DB access, deployment or cleanup of existing data.

## Evidence and scope

Canonical failure: `plans/slice-12-instrumented-acceptance-20261104.md`. Registration to original-link navigation took about25minutes; actual callback returned `flow_state_expired`/422 with verifier cookie present. Existing helper checks email OTP TTL3600 but ignores the independent shorter PKCE lifetime. Upstream300seconds is not verified project configuration; no provider lifetime guarantee may be inferred.

Preserve original URL/query parameters, exact signup storage state, secret redaction, identity/recipient binding, durable one-shot markers, read-only checks, original email parser, complete snapshots and cleanup contracts. Do not redesign auth or replace PKCE with another flow. Do not run old live modes. New work does not rewrite historical evidence or renew any spent marker/budget.

## Implementation contract

One Anti worker, Gemini3.8FlashHigh / effortHigh, sequential ownership:

- `tmp/slice12-public-acceptance/helpers-testable.mjs`
- `tmp/slice12-public-acceptance/public-auth.mjs`
- `tmp/slice12-public-acceptance/test-offline.py`
- new synthetic test file in that helper directory only if it simplifies actual-runner regression checks
- `plans/evidence/slice-12-pkce-handoff/anti-delivery.md`

Codex owns this plan/canonical docs, independent review and final acceptance. Preserve all existing audit-viewer/owner worktree changes; no additional worker. No .env, Downloads/.eml, private state/baseline/credentials or live service inspection. Read only code and named sanitized plans. No package installation, production source/test/config/schema changes, commit/push or deployment.

1. Add a small testable fail-closed PKCE handoff policy, separate from the email OTP TTL: **at most180seconds from the durable registrationAttemptedAt timestamp**, exclusive deadline (`elapsed >=180000` denies). This is a deliberately conservative local operational window, not the project's verified provider TTL and not proof a provider flow is valid. Unknown effective provider lifetime remains a limitation for future public preflight. Missing/malformed registrationAttemptedAt, nonfinite now, or a future registration start denies; do not use a later success/message time or clock-skew allowance to extend the window. Keep existing OTP checks as a separate condition.
2. Enforce the policy in the actual confirmation guard and recheck with the current clock immediately before each navigation effect, after asynchronous pre-navigation DB/browser setup. The test hook and real `page.goto(rawUrl)` must use the same last-moment check. If the window expires during setup, deny without navigation. Preserve conservative spent-marker behavior if navigation was already marked; never reset/re-register/resend. Keep implementation minimal; no new runner framework.
3. Synthetic tests must import/invoke the actual JS guard and actual runner (existing injectable seams), not duplicate logic. Cover fresh allowed; exact deadline; just-before/after;25minutes with OTP still valid; missing/invalid/future registration time; nonfinite clock; recent email/success timestamp cannot renew old start; expiry during DB and browser setup; zero navigation on denial; spent/restart paths cannot send/navigate twice. Keep all existing useful parser, URL-preservation, state, redaction and snapshot cases. Failures and evidence must remain sanitized.
4. Run offline suite and syntax checks with synthetic-only environment. Report files changed, each criterion, exact command/exit/test totals, raw PASS/FAIL and limitations. Do not claim Slice 12 accepted or that public flow is fixed. Codex will review actual diff, meaningful boundary tests and negative controls, then run relevant regressions.

## Later public acceptance boundary

After local PASS, prepare a fresh execution preflight with inbox/handoff ready before registration and effective lifetime uncertainty stated. Any new real registration/activation needs a separately explicit bounded authorization; no automatic attempt follows this offline task. No Slice 13.

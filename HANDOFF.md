# Lingora — Agent Handoff Brief

> Updated whenever a task moves to `DONE` or `BLOCKED`. Keep only current state — not a history log.
> Read this after `docs/QUICK-REF.md` when starting a new session or resuming after a task gap.

---

## Current state

- Last completed task: `requirements-system-analysis-documentation-recovery` — DONE. Created authoritative
  [`docs/06-system-analysis.md`](docs/06-system-analysis.md) (problem statement, 6 capabilities, stakeholder/actor
  catalog, boundaries, 8 Use Cases, sequence flows, assumptions/constraints, audit findings register) and
  [`docs/07-data-dictionary.md`](docs/07-data-dictionary.md) (implementation-grounded ERD with 17 models, 24 FKs,
  attribute constraints, private storage buckets, schema mismatch table). Updated [`docs/05-traceability-matrix.md`](docs/05-traceability-matrix.md)
  and reading order in [`docs/project-1/README.md`](docs/project-1/README.md).
  Evidence: `RSA-T-001` .. `RSA-T-009` (all 9 checks PASS).
- Previous implementation milestones:
  - `M1.6W` Web learner foundation DONE (Next.js 15, SSR Auth, Route Handler proxy to AI, 19/19 Vitest unit tests, Playwright e2e).
  - `M1.5` JWT verifier amendment DONE (Supabase JWKS / ES256 & HS256 compatibility, 37/37 Pytest PASS).
  - `M1.4` Seed & RLS test harness DONE (34/34 tests PASS).
  - `M1.3` Auth + RLS + Storage (two-bucket) + `record_review` DONE.
  - `M1.2` Prisma + Supabase schema DONE (17 models, 3 migrations).
- Last approved scope decision: `ADR-009 — M1.5 JWT verifier amendment: Supabase JWKS / ES256 compatibility`.
- Next active milestone: **Milestone M2 (Web Core Lesson Flow & Exercise Engine)**.
- Public staging snapshot: `staging/lingora-workspace-public/` — pre-reset; regeneration pending.

---

## Pending decisions / open questions

- `ADR-006` scope remains **approved and documented, not implemented**: enum `GRAMMAR`, listening option `4a`
  (word-level audio), `dailyGoalMin` UI. Payload shapes for `GRAMMAR` and `LISTENING` belong to the M2 implementation task.
- Reminder options `6a` (PWA/service worker notification) and `6b` (Web Push + `push_subscriptions` + scheduler,
  VAPID, a sender outside `lingora-web`) are **DEFERRED, not rejected**. Re-entry needs a new plan and a new ADR;
  it does not require reversing `ADR-008`.
- Option `6d` (in-app reminder) is approved for later feature milestone (M2+).
- `staging/lingora-workspace-public/` must be regenerated under its own approved task before any public
  publication — it now contradicts the canonical docs on platform.
- `.codex/` and `.agents/` cleanup deferred; safe checkpoint is commit `d0e4276`.

---

## Do NOT do next

- Do not implement M2 feature code without an approved `plans/current-task.md` for Milestone M2.
- Do not modify database schema, migrations, RLS, or RPC without an approved plan and ADR.
- Do not reintroduce Android, Gradle/AGP, Retrofit, Room, or APK into active codebase.
- Do not add a service worker, web app manifest, PWA install flow, push code, or scheduler — `6a`/`6b` are deferred.
- Do not touch `lingora-ai/api/` runtime without an approved task; current verifier supports both ES256 and HS256.
- Do not place secrets in code, logs, screenshots, fixtures, or commits.
- Do not amend or rebase historical commits, and do not rewrite Git history or force-push.

---

## Suggested next step

Draft `plans/current-task.md` for **`m2-web-core-lesson-flow`** (Milestone M2):
- Implement Course/Lesson navigation and lesson player in `lingora-web/`.
- Implement interactive exercise engine supporting `MCQ`, `FILL_BLANK`, `REORDER` (plus `GRAMMAR` and `LISTENING` per ADR-006).
- Implement lesson progress scoring (0–100%) and atomic completion update to `UserProgress`.
- Verify responsive layouts and accessibility.

---

## Context not in code

- The platform switch was a human decision made on 2026-08-17 with the assignment-title risk raised and
  knowingly accepted (risk `R12` in `docs/00-master-plan.md`, recorded in `ADR-008`).
- Learner AI calls go through Next.js Route Handler proxy (`/api/ai/srs`, `/api/ai/chat`) rather than browser-to-FastAPI directly.
- Storage two-bucket split (`lingora-avatars` / `lingora-media`) is strictly enforced at database/storage level.
- AI Server is stateless by design; it never reads/writes Supabase directly.
- `MOCK_MODE=true` is supported for mock inference during development.

# Lingora — Agent Handoff Brief

> Updated whenever a task moves to `DONE` or `BLOCKED`. Keep only current state — not a history log.
> Read this after `docs/QUICK-REF.md` when starting a new session or resuming after a task gap.

---

## Current state

- Last completed task: `m1.7-web-platform-reset` — DONE. The Project 1 learner platform was reset from native
  Android to **Web** under `ADR-008` (2026-08-17). Canonical docs (`docs/00`–`docs/05`, `docs/QUICK-REF.md`,
  `docs/README.md`, `DESIGN.md`, `README.md`, `ENVIRONMENT.md`) now describe a Next.js 15 App Router learner
  client at `lingora-web/`; the 61 tracked files under `lingora-android/` were deleted with Git history preserved.
  Evidence: `M1.7-T-001` .. `M1.7-T-009` (27/27 M1.5 pytests PASS, 34/34 M1.4 seed/RLS harness PASS,
  `git diff 585ca6c` empty under `lingora-ai/` and `lingora-admin/prisma/`).
- Last approved scope decision: `ADR-008 — Project 1 learner platform reset from native Android to Web`,
  APPROVED 2026-08-17.
- Last commit: `253fbf1` — refactor(platform): reset project 1 learner client from android to web (m1.7,
  adr-008). The previous commit `585ca6c` is the recovery point for the deleted Android code.
- Milestone: M1.5 is the last DONE implementation milestone. M1.6 Android is **SUPERSEDED**.
  Next: `M1.6W` (Web learner foundation) — **plan required, not yet written**.
- Public staging snapshot: `staging/lingora-workspace-public/` — now **pre-reset**; it still describes Android.

---

## Pending decisions / open questions

- `M1.6W` is specified only as a **preview** inside `plans/archive/2026-08-17-m1.7-web-platform-reset-DONE.md`
  (§`M1.6W` specification preview). That preview is **not** an authorization. A new `plans/current-task.md` at
  `APPROVED` is required before any file under `lingora-web/` is created.
- `ADR-006` scope remains **approved and documented, not implemented**: enum `GRAMMAR`, listening option `4a`
  (word-level audio), `dailyGoalMin` UI. Its reminder mechanism was amended by `ADR-008` from the Android
  `SharedPreferences`/`WorkManager` approach to option `6d` (in-app reminder). Payload shapes for `GRAMMAR` and
  `LISTENING` are still deliberately deferred to the implementation task.
- Reminder options `6a` (PWA/service worker notification) and `6b` (Web Push + `push_subscriptions` + scheduler,
  VAPID, a sender outside `lingora-web`) are **DEFERRED, not rejected**. Re-entry needs a new plan and a new ADR;
  it does not require reversing `ADR-008`.
- `staging/lingora-workspace-public/` must be regenerated under its own approved task before any public
  publication — it now contradicts the canonical docs on platform.
- `.codex/` and `.agents/` cleanup deferred; safe checkpoint is commit `d0e4276`.

---

## Do NOT do next

- Do not create anything under `lingora-web/` yet. No `package.json`, no `next.config`, no dependency install,
  no route, no component. `M1.6W` must be planned and approved first.
- Do not implement the ADR-006 feature slices yet. Still blocked: `lingora-admin/prisma/schema.prisma`, the
  `ALTER TYPE "ExerciseType" ADD VALUE` migration, and any file under `lingora-web/`, `lingora-ai/`, or
  `lingora-admin/src/`.
- Do not reintroduce Android, Gradle/AGP, Retrofit/OkHttp/Gson, Room, Android lifecycle, `SharedPreferences`,
  any hand-rolled token store, `POST_NOTIFICATIONS`, APK, `minSdk`/`targetSdk`, Fragment/ViewBinding/XML layout,
  or `androidx.work` anywhere in the docs or code.
- Do not add a service worker, web app manifest, PWA install flow, notification permission prompt, push code, or
  scheduler — `6a`/`6b` are deferred, and `6d` itself is a later feature milestone, not part of `M1.6W`.
- Do not freeze the `GRAMMAR` or `LISTENING` payload shape in canonical docs — `ADR-006` §12.4 leaves it to the
  implementation task and its acceptance tests.
- Do not restore `MATCHING` or `WRITING`, and do not implement sentence-level listening audio (option `4b`).
- Do not touch `lingora-ai/`, `lingora-admin/prisma/`, Supabase SQL/RLS/RPC/Storage, or `docs/03-api-contract.md`
  endpoint/field/status/error semantics — all four are frozen by `ADR-008` and verified byte-identical at
  `585ca6c` (except `docs/03` prose and the `"client": "web/1.0.0"` example strings).
- Do not touch `.gitignore`, `.codex/`, `.agents/` without a dedicated cleanup task approved first.
- Do not amend or rebase commits `d0e4276`, `46130d5`, or `585ca6c`, and do not rewrite Git history or force-push.

---

## Suggested next step

Write `plans/current-task.md` for `M1.6W — Web learner foundation` and submit it for approval. Keep it narrowly
scoped to proving the Web learner foundation can **authenticate and call the two protected M1.5 mock endpoints**:
Next.js 15 App Router scaffold, `@supabase/ssr` httpOnly-cookie session with middleware route protection, a typed
API client plus the AI Route Handler proxy (8-second `P1-FR-005` timeout, `docs/03` error-envelope mapping),
`POST /v1/srs/schedule` and `POST /v1/chat/roleplay` connectivity, login/register plus one authenticated status
route, i18n `vi`/`en` with `vi` fallback, and the responsive/accessibility baseline. Use evidence IDs
`M1.6W-T-001..n` — the `M1.6-T-*` IDs are taken and now marked `SUPERSEDED`.

Explicitly out of `M1.6W`: any feature screen, any course/lesson/vocabulary/profile repository, the `6d` reminder,
any DB/FastAPI/API-contract change, and any PWA/push/scheduler work.

Three traps to carry into that plan:
- The enum migration for `GRAMMAR`/`LISTENING` must not seed data using the new value in the same transaction
  that adds it — PostgreSQL forbids it and Prisma wraps each migration in one transaction, so it must be split
  into two migrations or `prisma migrate deploy` fails.
- `P1-FR-015` must be described as an in-app reminder presented *within the chosen window*, never at an exact
  time, and never as delivered while the application is closed.
- `lingora-web/` receives only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. It must never hold
  `SUPABASE_SERVICE_ROLE_KEY`, never import Prisma, and never open a direct database TCP connection.

Separately: a human still reviews `staging/lingora-workspace-public/`, which is now pre-reset and must be
regenerated under its own approved task before any public publication. Create public Git history only under a
new, separately approved task.

---

## Context not in code

- The platform switch was a human decision made on 2026-08-17 with the assignment-title risk raised and
  knowingly accepted (risk `R12` in `docs/00-master-plan.md`, recorded in `ADR-008`). It is not a naming change.
- No Android feature screen ever existed — only Login, Register, and `FoundationStatusFragment` — which is why
  the reset cost almost nothing. Roughly 95% of realized investment (schema, migrations, seed, RLS/RPC, FastAPI,
  the `/v1/` contract, all ML/NLP scope) is platform-neutral and was kept unchanged.
- Learner AI calls go through a Next.js Route Handler proxy rather than browser-to-FastAPI directly, so the DONE
  M1.5 runtime needs no CORS or code change and its 27 tests stay valid.
- Storage two-bucket split (`lingora-avatars` / `lingora-media`) was forced by live T-008 HTTP evidence: a
  5,242,881-byte avatar returned HTTP 200 on the single-bucket implementation. See:
  - `logs/decision-log.md` → `ADR-005 Amendment — SEC-D8 PA2 two-bucket size enforcement`
  - `logs/decision-log.md` → `ADR-005 Implementation Addendum — SEC-D8 PA2 bucket boundary realization`
  - `plans/approved/2026-08-14-m1.3-t-008-two-bucket-size-enforcement-APPROVED.md`
- AI Server is stateless by design; it never reads/writes Supabase directly.
- `MOCK_MODE=true` is mandatory — every Web screen must work on mock before real AI is connected.

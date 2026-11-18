# Sprint 6 remaining work queue

Implementation and gates are in the [S6-10.2 repair plan](../plans/2026-11-15-sprint-6-delivery.md#s6-102--writing-srs-repair-and-final-acceptance).

Codex owns each slice and its focused checks. Preserve the current uncommitted Sprint 6 work throughout the repair.

- [x] **S6-08a.1 — Finish Japanese fixture and gating** — Fixed the practice contract; isolated fixture language/framework/course and catalogue records; checked mutation-service reading does not unlock; asserted completion's attempt/revision pin; exercised detail GET JSON for locked/PLANNED/missing IDs; verified all six publication IDs survive rerun. Focused PostgreSQL suite passes 4/4; final Sol review PASS on 2026-11-17.
- [x] **S6-08a.2 — Japanese production E2E** — Production Chromium E2E passed: locked URL, learner-visible Hiragana, pinned writing session/attempt, writing-alone no completion/unlock/reward, core completion unlocks readable Katakana. `npm run test:e2e:writing` (build + 2 E2Es).
- [x] **S6-08b.1 — Chinese fixture and gating** — PostgreSQL integration passed 1/1: six published stages + planned lesson, pinyin/tone projection, stroke provenance/version, validated HTTPS audio block, no-eligible course, locked/missing API behavior, core completion unlock, fixture rerun identity. `npm run test:integration:chinese`.
- [x] **S6-08b.2 — Chinese production E2E** — Production build + Chromium writing harness passed 3/3. Verified local HTTPS WAV playback, pinyin/Hanzi content, writing flow/pins, no writing-only rewards or unlock, core unlock, and layout at 360/390px. `npm run test:e2e:writing`.
- [x] **S6-09.1 — WRITING SRS ADR proposal** — Wrote `plans/2026-11-17-s6-09-writing-srs-decision-proposal.md`; Product Owner approved the four-rating WRITING-only scheduler, vocabulary-card identity and interaction/reward/rollout rules on 2026-11-17; recorded as ADR-045.
- [x] **S6-09.2 — WRITING SRS implementation** — WRITING FSRS, four explicit ratings and idempotent scheduling/XP are implemented. Focused tests passed on 2026-11-18. Integrated review corrections are tracked under S6-10.2.
- [x] **S6-10.1 — Fresh and staged-upgrade migration verification** — Fresh deployment passes in disposable integration DBs. Upgrade harness seeded from accepted baseline `4bbdc23`, compared all 37 legacy tables/columns and grants, and verified RLS/FORCE RLS and no direct writing-table grants. Reproducible harness: `plans/evidence/sprint-6/s6-10/upgrade-check.mjs`.
- [x] **S6-10.2 — WRITING SRS follow-up and focused acceptance** — Codex re-review caught stale legacy queue order and stale successful POST replay state. Fixed and verified in an isolated worktree: SRS PostgreSQL 32/32, ReviewView 13/13, route/scheduler 9/9, feature 96/96, component suite, typecheck, production build, Prisma schema validation, and writing Chromium 4/4. The full cross-project integration/E2E matrix was not rerun for this follow-up.

## Sol 6.2 High review corrections

- [x] **S6-10.2a — Published eligibility.** Use the enrolled card's published vocabulary snapshot and validate every pinned template. Cover catalogue-only and unpublished data, archive provenance, invalid pins and hidden answers. Run the SRS PostgreSQL gate.
- [x] **S6-10.2b — Independent initialization.** After 10.2a, initialize eligible WRITING state once even when MEANING is future. Verify independent due selection and context scope. Run the SRS PostgreSQL gate.
- [x] **S6-10.2c — Attempt identity.** Share the strict request schema across route and service, send the ordinal in the body, and keep `sessionId` in the URL. Validate new attempts against the published character pin and receipt prefix. Cover simultaneous two-tab writes on separate connections, active same-card cross-skill rejection, overlapping sessions, and repeated glyphs. Run the route, ReviewView, and SRS PostgreSQL gates.
- [x] **S6-10.2d — Rollout continuity.** After 10.2c, reconcile disabled WRITING slots and let the learner finish MEANING with saved WRITING state and receipts intact. Run the ReviewView and SRS PostgreSQL gates.
- [x] **S6-10.2e — Canvas limits and retry.** After 10.2c–d, enforce the three capture limits, allow editing after definitive 400, and retry ambiguous failures with the original payload. Run the route and ReviewView gates.
- [x] **S6-10.2f — Enabled production Chromium.** After 10.2a–e, submit through the real attempt API, exercise lost-response retry, verify the complete pre-reveal JSON and both ordinal receipts, reveal glyphs and feedback, rate, and verify one operation and XP event. `npm run test:e2e:writing` passed 4/4.

## Checkpoints

- [x] S6-08a.1 focused PostgreSQL suite passes and has runner/evidence before 08a.2.
- [x] S6-08b.1 focused PostgreSQL suite passes and has runner/evidence before 08b.2.
- [x] S6-08b.1 focused PostgreSQL suite passes before 08b.2.
- [x] WRITING SRS ADR approved before implementing S6-09.2; never infer rating from writing score.
- [x] Rerun focused follow-up migration/schema validation, typecheck, feature/component, SRS, build and Chromium gates on the isolated Sprint 6 worktree. Record exact results above.
- [x] Close the S6-10.2 repair after the Codex follow-up review and focused gates pass; the full cross-project integration/E2E matrix remains outside this follow-up run.

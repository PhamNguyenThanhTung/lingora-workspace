# Slice 10 verification — Learner Lesson / Progress Foundation

Status: **APPROVED DESIGN; MIGRATION APPLIED AND VERIFIED DEV; LOCAL ACCEPTANCE PASS; PUBLIC ACCEPTANCE PENDING.** Slice10 acceptance remains pending.

Baseline: `f71fdf70f06a9c9e00f5ea81dfa6b675b85dbda2` (Slice 0–9 accepted). [Planning/decision spec](2026-11-01-slice-10-learner-lesson-progress.md). Date: 2026-11-01 (Asia/Saigon).

## Verified blocker

The schema has revision-pinned `LessonAttempt`, graded `LessonResponse`, and first `LessonCompletion` per context/lesson. It has no separate ungraded consumption-completion model. The requested explicit completion action cannot truthfully finalize these rows while answer submission/grading is excluded.

- `schema.prisma:536–565`: attempt pins context, lesson and revision; positive core count, started timestamp and all completion summary fields.
- Live `lesson_attempts_n_core_check`: N > 0.
- Live `lesson_attempts_completion_shape_check`: completed timestamp requires K, units, response count, operation UUID, local date and timezone; these remain null while open.
- Live `lesson_attempts_completion_bounds_check`: response count = N + K, bounded K and contribution units. These checks constrain summary values; they do not themselves prove that genuine graded responses occurred. The service must derive truthful values from actual responses.
- Live `trg_lesson_completion_parent_attempt` requires a completed first attempt, and `trg_lesson_completion_timestamp` requires the same completed timestamp. An open attempt cannot supply a completion fact.
- Canonical UC-06 and physical design §F require all N first responses and K retries, server grading/recomputed summaries and atomic finalization. The zero-core/content-only lifecycle is explicitly outside the current model. Fabricating metrics, correctness, response rows or a completed DTO is not a supported implementation.

[Scoped DEV schema evidence](evidence/slice-10/progress-schema-read-only.json) records actual check/trigger definitions. The parent queried only lesson attempt/response/completion schema metadata inside a RepeatableRead transaction with `SET TRANSACTION READ ONLY`; private connection values were never printed. No data/fixture writes or legacy closure tooling.

## Other confirmed boundaries

- Verified ACTIVE LEARNER → own ACTIVE LearningContext → active Course → same-Course Unit/valid framework → AVAILABLE Lesson → exact `Lesson.activeRevisionId` matching lesson, status PUBLISHED.
- Exact child relations pin `LessonExercise.itemRevisionId` and vocabulary `displaySnapshot`; latest draft/current vocabulary is not learner display authority. Grading secrets/staff DTOs must not enter the future learner projection.
- Availability does not mean unlocked: canonical sequential access uses Unit/Lesson order, prior completion and working Level. Exact earlier-review/null-working-Level policy must be completed after the progress decision; neither all Course lessons nor a guessed Level equality predicate is currently authorized.
- Attempts are revision-scoped; first completion is unique(contextId, lessonId), with immutable first-attempt provenance. A valid X completion survives replacement Y; an open X attempt must not silently become Y. Source has no generic percentage/current-step progress fields.

## Approved model and migration

Owner explicitly approved LessonConsumption and canonical graded gates on 2026-11-01, including shared parent locks, final FK/cardinality/rollback/Prisma checks, promotion and DEV apply. Reading is separate from grading: Chưa đọc → Đang đọc → Đã đọc; per-context exact revision; stale409; X preserved/Y separate; no unlock, Level/SRS/scoring or graded evidence changes.

- [Approved design](2026-11-01-slice-10-consumption-design.md) and [final executable spec](2026-11-01-slice-10-learner-lesson-progress.md).
- [Official migration](../lingora-admin/prisma/product/migrations/20261101000000_lesson_consumption/migration.sql), active shared Prisma model, [guarded rollback](migrations/slice-10-consumption.rollback.sql).
- [Disposable PostgreSQL17.11 validation](evidence/slice-10/migration-local-check.json): PASS up, UNIQUE(context,revision), distinct context/revision cardinality, composite revision+Lesson FK, missing-context FK, all three parent RESTRICT deletes, positive version/finite/chronological timestamp checks, consumption-only context freeze, anon/authenticated denial, nonempty down refusal and empty down restoring exact prior guard. Prisma SQL-generated columns/FKs/indexes match; UNIQUE constraint vs equivalent Prisma UNIQUE INDEX is intentional.
- [Read-only DEV precheck](evidence/slice-10/migration-precheck.json): existing guard unchanged, five applied ledger entries, PostgreSQL17.11, table absent.
- Explicit `npm run db:product:migrate`: exit0, only `20261101000000_lesson_consumption` applied. [Read-only DEV catalog](evidence/slice-10/migration-dev-verified.json): six entries, previous five unchanged, columns/FKs/indexes exact, RLS enabled+forced/no policies/table client grants denied, extended guard exact, zero backfill/rows, graded constraints/triggers unchanged. Prisma validate/generate exit0.
- Ephemeral PostgreSQL cluster stopped and owned data removed; tooling installed only under ignored `tmp/slice10/pg-runtime`, no product dependency. No live learner/content fixture writes yet.

## Work performed and pending gates

| Item | State |
| --- | --- |
| Discovery / independent Sol High planning | Complete; original graded schema gap resolved by approved separate model |
| Independent Sol High design review | Complete; parent-lock contention finding fixed with FOR SHARE parents |
| Migration final safety checks / promotion / DEV apply / catalog | PASS |
| Anti initial implementation/tests | Delivered; [handoff](evidence/slice-10/anti-handoff.md) |
| Independent implementation review / Codex fixes | Sol High REQUEST_CHANGES; all six findings fixed directly, ten RED→GREEN regressions; [resolution](evidence/slice-10/codex-review-fixes.md) |
| Local acceptance / mutations | PASS: feature509, component/page145, real-service PostgreSQL integration7, root typecheck/build/client scan;12 semantic variants KILLED and restored byte-exact; [mutations](evidence/slice-10/mutations.json) |
| Source commit/deploy exact READY / public acceptance / cleanup | Pending |
| Unrelated workspace files | Preserved |

No Slice11. No feature PASS/ACCEPTED or source commit/push yet.

## Local gates

Root `npm run test:feature`:509/509, no failures/skips. `npm run test:components`:145/145 on the completed sequential run. The first component invocation overlapped the build and failed two existing staff draft assertions; the unchanged staff source/tests passed in the sequential rerun. No old Slice was reopened or assertions weakened. Root `npm run typecheck` and `npm run build`:exit0. Client scan:40 local files,0 secret/private import matches. PostgreSQL production-service integration:7/7 with owned cluster removed. Post-mutation affected route/regression suite:38/38 PASS. No full gate rerun solely for documentation.

Public writes remain gated on the exact pushed commit READY on learner and staff. No public feature fixture has been created yet. Approved schema migration is the only DEV write so far.

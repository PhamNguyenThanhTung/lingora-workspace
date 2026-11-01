# Slice 11 — Practice Attempt / Grading / Lesson Completion

Status: **FINAL EXECUTABLE SPEC — D1–D3 explicitly approved; implementation authorized**. Historical FAIL checkpoint is resolved by the user's three answers on 2026-11-01; this is not an acceptance PASS. Baseline `b86ddc652310c37373c4ce921e38e39cba4c3562`; Slice 0–10 accepted. No Slice 12.

## Ownership and workflow

Codex owns source/schema inspection, final executable spec, independent review, direct fixes and acceptance. One Sol 6.1 High planning pass precedes one coupled Anti implementation/test package. Anti has no permission to read real `.env`, access providers/DEV, apply migrations, deploy or commit/push. Codex owns those acceptance operations after local gates.

The senior pass is complete: [senior-plan.md](evidence/slice-11/senior-plan.md). Its self-reported inability to attest model routing is limited to that worker's own visibility: the parent CLI header confirms `model: gpt-6.1-sol`, `reasoning effort: high`, `sandbox: read-only`, successful exit 0. No fallback was used. Root subsequently performed the scoped DEV read-only inspection; the worker did not access DEV.

Preserve unrelated edits to `AGENTS.md`, `lingora-admin/prisma/product/README.md` and the two untracked `plans/2026-10-28-database-*` files. Preserve the accepted LessonConsumption state machine and shared parent locks.

## Verified persistence

Single schema owner: `lingora-admin/prisma/product/schema.prisma`. Scoped DEV read-only catalog evidence: [schema-read-only.json](evidence/slice-11/schema-read-only.json). Six applied migrations; no DB writes performed. Relevant catalog checks inspected: 35 constraints, 17 indexes and 11 trigger bindings across attempts/responses/completions/receipts/SRS cards. These counts describe this scoped inspection, not a database-wide audit.

| Physical identity | Contract |
|---|---|
| `app.lesson_attempts` / `LessonAttempt` | Context derives learner. Pins logical Lesson and exact LessonRevision through composite FK. `completed_at IS NULL` means open; non-null means completed. Positive `n_core`; all completion summary/day fields null when open and populated together when completed. Multiple attempts allowed; no unique learner/Lesson/revision restriction. |
| `app.lesson_responses` / `LessonResponse` | Append-only input/grade events. Composite FKs pin attempt and exercise to the same revision. Unique `(attempt,exercise,ordinal)`, `(attempt,operation_key)` and `(attempt,queue_position)`; ordinals 1/2 only; JSON object input and nonblank input hash. Correct first contributes 2 half-units; correct retry 1; incorrect 0. |
| `app.lesson_completions` / `LessonCompletion` | One immutable first completion per context/logical Lesson. Composite FK requires same attempt/context/Lesson. First attempt must already be completed; completion timestamp equals that attempt's completed timestamp. Replacement does not rewrite this fact. |
| `app_private.command_receipts` / `CommandReceipt` | Existing actor/command/operation-key uniqueness, input hash, target ID and allowlisted safe result support command retries. Immutable; no new idempotency framework/table. |
| `app_private.item_grading_secrets` | One private secret per exact ItemRevision. Generic learner prompt queries exclude it; only the authorized server response grader may read the pinned secret. |

Relevant FKs use RESTRICT/NO ACTION. Completed attempts cannot be deleted; responses/completions/receipts cannot be updated or deleted. Public cleanup must retain exact allowlisted graded fixture history and its FK ancestors when deletion is prohibited; never bypass guards.

## Locked existing domain rules

Sources: `docs/02-requirements.md` ADR-036 addendum, `docs/use-case-specifications.md` UC-06/ADR-044, `docs/design/physical/README.md` learner evidence and section F; actual accepted Slice 6 authoring and Slice 10 learner source override historical payload/model examples.

- Start pins current AVAILABLE/PUBLISHED `Lesson.activeRevisionId` and exact `LessonExercise.itemRevisionId`. PRACTICE origin only, no assessment blueprint references, no arbitrary child/latest revision resolution. Count actual required core memberships; `N >= 1`, no content-only fabricated completion.
- Process all first responses in exercise order, then first-wrong exercises in their original response order, exactly one retry each regardless of retry correctness. Missing responses or missing required retries reject finalize; they do not silently score zero.
- For `K` first-wrong items, final response count is `N + K`. Integer contribution units give exact performance `contributionUnits / (2 * (N + K))`; no correctness threshold gates completion. Preserve exact numerator/denominator; UI rounding is presentation only.
- Finalize atomically recomputes evidence, completes attempt, inserts first completion without overwriting existing provenance, records DB-authoritative local day/timezone and command retry result, and performs approved core-vocabulary enrollment D2. No SRS review UI/rescheduling runtime, assessment runtime, readiness engine or Level-up progression is added.
- Deliberate redo creates a new attempt. First logical completion remains unchanged; latest completed attempt ordered by `completed_at DESC,id DESC` supplies primary performance.
- Existing Slice 10 sequential Lesson gate already reads `LessonCompletion`. Wire this fact to that gate; do not write working Level, add a threshold, reset history on republish, or treat consumption as completion.
- Consumption remains independent, including separate X/Y reading state. Accepted response events are immutable even before finalization; learner may edit the current unsubmitted input and then supply a distinct required retry, never edit an accepted response row.

## Grading contracts and approved decisions

| Type | Accepted authored shape | Runtime comparison |
|---|---|---|
| MCQ | Public options with stable IDs; private single `correctOptionId` | Validate exactly one existing option ID, compare ID exactly. No multiple select or display-text comparison. |
| LISTENING | Same option contract plus safe public HTTPS audio reference; private optional transcript | Same deterministic choice comparison. No speech recognition, transcription or audio upload. Transcript never enters learner DTO. |
| REORDER | Public tokens with stable IDs (duplicate text permitted); private `correctOrder` of those IDs | Submitted array must be an exact complete permutation of token IDs; compare position by position. Reject missing/repeated/foreign IDs. |
| FILL_BLANK | Private `acceptedAnswers: string[]`, `caseSensitive: boolean` | Exact accepted-answer comparison using approved D1. |
| GRAMMAR | Public sourceSentence/targetPattern; same private accepted-answer shape | Same bounded deterministic text comparison D1; no grammar engine, fuzzy matching or AI. |

**D1 — APPROVED:** accepted authoring alone did not define runtime normalization; the user explicitly approved this new grading contract. Vocabulary NFC and historical GEC NFKC policies remain separate.

Normalize both response and accepted answers with Unicode NFC, trim both ends, then JavaScript `toLowerCase()` only when `caseSensitive=false`; preserve punctuation, accents and internal whitespace; exact equality against any accepted answer. Required tests cover composed/decomposed Unicode, both case modes, outer/internal whitespace, punctuation, multiple authored alternatives and rejected malformed/blank input.

**D2 — APPROVED:** include canonical core vocabulary enrollment atomically with finalization: new card stage 1, due after one day; existing card entirely unchanged (including source, stage, due date and row version). No review session, rescheduling or streak UI. Retain truthful DB-derived qualifying day/timezone required by the completion shape. No fabricated date or unauthorized migration. Source link and attempt must be from the exact pinned revision and owned learner; optional vocabulary is not enrolled here.

**D3 — APPROVED:** every new stale response and every uncommitted stale finalization, including redo when logical completion already exists, returns `409 PUBLICATION_CHANGED`; exact authorized committed-operation replay remains available after current account/context/ownership/access checks but before comparing today's active pointer. Never repin X to Y. Read-only owner access may show retained X evidence with an explicit stale indicator while the logical Lesson remains accessible; it must not authorize a new X write. A new start uses current Y. Same start UUID plus same original scope is a committed-operation replay, not a new attempt; safe DTO must show its original pin and stale status.

All three decisions were explicitly approved by the user through the corresponding question replies. No repeat discovery or new planning pass is needed. Implementation and acceptance proceed under this final spec.

## Confirmed source integration defect

`lingora-admin/src/server/lessons/snapshot.ts:41` rejects `c.attempts > 0` even when `allowFrozenPredecessor` is true. `lessons/index.ts:1886` uses this check before appending a new successor. An attempt on published X would therefore prevent supported authoring of Y. The eventual package must allow retained attempts when copying an eligible frozen predecessor, keep in-place editable-content rejection, and prove save/submit/publish Y preserves X attempt/child pins. This is an authorized narrow Slice 11 integration fix, not permission to reopen unrelated staff authoring.

## API and serialization boundaries

Use existing scoped routes under `/api/learner/contexts/[contextId]/lessons/[lessonId]`:

- `POST /attempts`: strict `{attemptId, expectedPublishedRevisionId}`. The UUID attempt PK supplies request identity: same ID plus same owned immutable scope replays, conflicting scope fails safely, deliberately new ID creates another attempt. No START receipt command is available in the existing command CHECK; do not invent one or require a migration. No server-side GET/render/prefetch creation.
- `GET /attempts/[attemptId]`: owner-only, no-store, safe pinned prompt/queue/accepted-event/result DTO; current access and D3 history rules apply. Never return another learner's attempt, arbitrary DB row, private config or hash.
- `POST /attempts/[attemptId]/responses`: strict `{operationKey, lessonExerciseId, input}`. Choice `{optionId}`, text `{text}`, or order `{tokenIds}` determined from the pinned type. The server derives ItemRevision, ordinal and queue position. Reject unknown learner/score/correct/grade/time/kind/revision fields, foreign members and assessment members.
- `POST /attempts/[attemptId]/finalize`: strict `{operationKey}`. Recompute entire persisted queue and units, reject incomplete/inconsistent history. Existing `COMPLETE_LESSON` receipt plus completion operation key dedupe atomically; same key/different immutable command input conflicts. Already finalized attempts do not accept new response edits or a different finalization operation.

Operation replay checks ownership, fresh ACTIVE LEARNER/context/access, immutable target/input and D3's publication policy. Same response operation returns the previously recorded safe result without advancing the queue. Use a stable canonical payload hash for operation equality, separate from grading normalization; do not log inputs, keys or secrets.

DTOs allowlist IDs, safe prompts, own accepted inputs/events, server correctness and contributions, next queue member, completion state and exact score numerator/denominator. Before completion the aggregate completed score is null. Practice feedback is immediate fixed safe formative text/correctness. Do not return raw `gradingData`, `feedbackData`, transcript, accepted-answer lists, internal rationale or full secret rows even after submission. Preserve separate public prompt validation and server-only grader secret reads. Inspect actual serialized JSON, HTML and JS, not just TS types.

## Concurrency and integration acceptance

At READ COMMITTED, mutations follow `Account FOR NO KEY UPDATE → Course FOR SHARE → Context FOR SHARE → Lesson FOR SHARE → Attempt FOR UPDATE`, then re-read fresh account/context/framework/course/Lesson/gate. Course alone does not serialize the actual staff publisher; its Lesson lock does. Never upgrade shared parents after locking Attempt or globally serialize independent learners. DB clock follows locks. Start insertion/UUID conflict is handled without exposing other owners. Same-attempt submissions/finalization serialize, reconcile a canonical result, and roll back all linked writes on failure.

Production integration coverage must exercise actual lifecycle services and Prisma transactions with the relevant existing CHECK/FK/unique/immutable guards on owned disposable loopback PostgreSQL. Do not claim generated Prisma SQL alone or handwritten imitation mutations prove production behavior. Adapt the fixture to author children before publication; the accepted S10 fixture alone is insufficient for graded guards. No real environment fallback.

Required behavior: all five happy/malformed graders; D1 boundaries; exact competing newer/draft child keys; assessment/foreign child attacks; disabled/wrong-role/cross-owner reads/writes; deterministic operation/input conflicts; queue ordering and N+K; zero-core/incomplete rejection; concurrent response/finalize and double-start retries; failure rollback; finalized event immutability; publisher-first versus finalizer-first; authorized replay after Y; preserved logical completion/next-Lesson gate with independent X/Y reading; successor authoring with X already attempted. Actual production page callbacks must reach real routes and graders, including pending, input preservation, failure retry, session/disabled state and Next refresh. No noop callbacks or loader mocks that ignore safe projections.

Semantic mutations A–I target answer-secret leak, latest child resolution, owner bypass, ASSESSMENT acceptance, client-controlled grading, finalized edit, broken submit/finalize callbacks, consumption-as-completion, and wrong-publication grading. Require meaningful test failures, restore original bytes in finally, and run the affected restored checks. No hash manifest or weakened assertions.

## Dispatch and acceptance ownership

DAG: approved spec → one coupled Anti implementation/test pass → independent Sol 6.1 High review → Codex direct fixes and local acceptance → exact-commit deploy → public DEV acceptance and read-only reconciliation/cleanup. No mandatory Anti correction round.

One Anti stream owns learner server/API/player/tests/package scripts and the narrow staff successor-copy guard fix plus its focused regressions. It may extract the existing learner access/locking helpers for truthful shared scope enforcement rather than duplicate them; preserve existing S10 behavior and tests. Prefer a separate Practice UI component so the existing player does not become an oversized mixed state machine. No schema edits unless an actual gap is presented separately for approval. Extend existing page and real callbacks; do not redesign accepted reading flow. Anti evidence is under `plans/evidence/slice-11/anti/`; full logs under ignored `tmp/slice11/`. Root exclusively owns spec/current-task/roadmap/verification and public operator scripts/evidence. Preserve all unrelated changes.

Anti tests may provision only owned loopback PostgreSQL and temporary local tooling, never read real `.env` or default to a remote DB. Tests must fail clearly without required owned DB configuration, not silently pass/skip integration. It must deliver actual test execution evidence; a handwritten fake finalizer/SQL clone is insufficient. Do not weaken/remove existing tests, suppress type errors, add production test bypasses or mock fallbacks. If an actual constraint makes the approved spec impossible, stop and report it rather than change schema.

Gates: feature + production component/page + real production-service PostgreSQL integration; A–I semantic mutations with byte-exact restore; typecheck/build; actual serialized DTO/API/client secret and answer-key scans; affected Slice 10 regressions. Then push source, verify exact learner commit READY before public writes, execute real five-type Practice/start/respond/finalize/retry/X–Y/failure recovery, reconcile DB read-only and retain only exact history allowlist, Teacher DISABLED, sessions/browser closed, unexpected residue 0. Record PASS only after every required gate.

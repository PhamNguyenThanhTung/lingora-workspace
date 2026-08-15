# Task

canonical-docs-full-scope-alignment - Align docs/00, 02, 04, 05 With Approved ADR-006

## Status

DONE

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Parent Milestone

Documentation / scope alignment. Prerequisite for the four ADR-006 implementation slices in
weeks 5, 7, and 9. No product behavior, schema, migration, RLS, dependency, or source code change.

## Immutable References

- `ADR-006 — ADR-004 amendment: full assignment-scope restoration by absorption`, `logs/decision-log.md`
- Approved amendment snapshot: `plans/approved/2026-08-15-adr-004-amendment-full-scope-APPROVED.md`
- Evidence base: `plans/gap-analysis-de-bai-vs-master-plan.md`
- Human decision 2026-08-15: full 12-week schedule, **no feature cuts** — the contingency-cut lists
  in `docs/00` are not activated
- Git baseline: commit `46130d5`

## Objective

`ADR-006` approved all four assignment-scope items (`GRAMMAR`, `dailyGoalMin` scheduling UI,
local reminder `3a`, word-level listening `4a`). Four canonical documents currently state in writing
that these items are **out of scope**. Until they are updated, any implementation makes the project
self-contradict in the exact documents a reviewer greps first.

This task updates only the contradicting statements in `docs/00`, `docs/02`, `docs/04`, and `docs/05`
so canonical documentation matches the approved scope. It adds no code and no new entity.

## Files Expected To Change

- `docs/00-master-plan.md` - remove `LISTENING` from the contingency-cut list
- `docs/02-requirements.md` - replace four exclusion bullets; add four `P1-FR` rows
- `docs/04-data-model.md` - replace three data-boundary bullets; update the legacy-block note
- `docs/05-traceability-matrix.md` - replace four Scope Gap Review resolution rows
- `plans/current-task.md` - lifecycle updates
- `logs/test-log.md` - verification evidence after implementation
- `logs/development-log.md` - completed-work record after implementation
- `HANDOFF.md` - update only when the task reaches DONE or BLOCKED

## Explicitly Out Of Scope

- Editing `lingora-admin/prisma/schema.prisma`
- Creating the `ALTER TYPE "ExerciseType" ADD VALUE` migration
- Adding the `androidx.work:work-runtime` dependency
- Any RLS, policy, grant, RPC, Storage, or database change
- Any file under `lingora-android/`, `lingora-ai/`, or `lingora-admin/src/`
- Freezing the `GRAMMAR` or `LISTENING` payload shape - deferred to the implementation task and its
  acceptance tests per `ADR-006` / §12.4
- Introducing any new entity, table, or column - `ADR-006` adds zero
- Restoring `MATCHING` or `WRITING`; they stay superseded
- Touching `docs/01-architecture.md` or `docs/03-api-contract.md` - no contradiction found there
- Reactivating any contingency-cut list in `docs/00`
- Modifying the parallel session's files: `AGENTS.md`, `logs/development-log.md` prior entries,
  `logs/test-log.md` prior entries, `HANDOFF.md` prior content, `plans/archive/*`, `staging/*`
- Any commit, tag, branch, or push

## Exact Edits — `docs/00-master-plan.md`

**E-00-1 · line 107.** The contingency-cut list ranks `LISTENING` as the 4th feature to drop if the
project falls behind. `ADR-006` makes word-level listening (`4a`) required scope, so the two conflict.

- Current: `4. Bài tập `LISTENING`, `MATCHING` (giữ MCQ + Fill-blank)`
- New: keep `MATCHING` in the cut list, remove `LISTENING`, and note that `LISTENING` is required
  scope under `ADR-006` and is not eligible for cutting.

No other line in `docs/00` is touched. The contingency lists at `docs/00:81-82` and `docs/00:103`
remain in the document as conditional plans; they are **not** activated and their `if` wording stays.

## Exact Edits — `docs/02-requirements.md`

**E-02-1 · line 218 (Grammar exclusion).** Currently: *"Grammar curriculum is not part of the current
Project 1 scope… does not own grammar lessons, grammar progress, or a separate Grammar schema."*
Replace with wording that admits `GRAMMAR` as an `ExerciseType` value while keeping every structural
exclusion intact: no `GrammarLesson`, no `UserGrammarProgress`, no separate Grammar schema, progress
still lesson-level `UserProgress`. The optional NLP-owned P2 `grammatical_acceptability_score` stays
unchanged and API-only.

**E-02-2 · line 219 (Listening exclusion).** Currently vocabulary audio *"is not a scored `LISTENING`
exercise… remains deferred/P2"*. Replace with: word-level scored `LISTENING` is approved per
`ADR-006` option `4a`; audio reuses the existing approved `vocabulary/{vocabularyId}/{filename}`
Storage path; sentence-level listening audio (option `4b`) remains **rejected** and would require a
SEC-D8 amendment.

**E-02-3 · line 221 (Notification/Reminder exclusion).** Currently *"Notification/Reminder remains
deferred with no canonical priority."* Replace with: an Android-local reminder is approved per
`ADR-006` option `3a`, derived from `dailyGoalMin` and `lastQualifyingActivityDate`, with reminder
time stored client-side. Keep explicit: **no** backend delivery, **no** device token, **no** FCM,
**no** notification-preference or reminder-schedule entity. State the two honest limitations -
per-device setting lost on reinstall, and no exact-time guarantee under doze/OEM battery restrictions.

**E-02-4 · line 216 (Exercise scope).** Currently *"MCQ and FILL_BLANK remain Must. `REORDER` is the
approved third exercise."* Extend the approved set to five: `MCQ`, `FILL_BLANK`, `REORDER`,
`GRAMMAR`, `LISTENING`. The REORDER invariant sentence is preserved verbatim. `MATCHING` and
`WRITING` remain superseded.

**E-02-5 · `P1-FR-003` line 229.** Extend the requirement to cover `GRAMMAR` and `LISTENING`
submissions alongside the existing three types, keeping the existing acceptance criteria and the
"Quiz label implies no Attempt persistence" clause intact.

**E-02-6 · new requirement rows.** Append four Must rows after `P1-FR-011`, continuing the existing
ID sequence without renumbering anything:

| New ID | Requirement | Acceptance criteria (summary) |
|---|---|---|
| `P1-FR-012` | Learner can complete `GRAMMAR` exercises within an existing lesson | Payload validates; correct/incorrect shown with a rule explanation; progress updates once per submission; no separate grammar entity or grammar-progress record is created |
| `P1-FR-013` | Learner can complete word-level `LISTENING` exercises | Audio for the referenced vocabulary plays; answer graded; unavailable audio yields a recoverable error state, not a crash; payload references `vocabularyId` and never a free-form URL |
| `P1-FR-014` | Learner can view and set a daily study goal | `dailyGoalMin` is readable and writable from the profile screen; a negative value is rejected by existing server validation; the value is scoped to the authenticated learner |
| `P1-FR-015` | Learner can enable a local daily study reminder | Reminder fires within the chosen window when the day has no qualifying activity; `POST_NOTIFICATIONS` denial is handled without a crash; no server-side delivery, device token, or reminder entity exists |

`P1-FR-014` acceptance criteria must state that no schema, grant, or policy change is required
because the M1.3 write path already exists (`202608140002/migration.sql:316`, `:430`, `:36-38`).
`P1-FR-015` acceptance criteria must state "reminds within the chosen window", never an exact time.

## Exact Edits — `docs/04-data-model.md`

**E-04-1 · line 433 (blocked-entity list).** Currently blocks, among others, *"Grammar curriculum,
Grammar progress, … notification preference, device-token, or reminder-schedule entity"*. The
entity-level block must **stay** — `ADR-006` adds zero entities. Rewrite so it is explicit that
`GRAMMAR` and `LISTENING` are enum values on the existing `Exercise` table, not entities, and that
the reminder is client-local, so every listed entity remains unapproved. Search/favorite,
pronunciation-score, separate mastery, standalone flashcard, Quiz, and QuizAttempt stay blocked
unchanged.

**E-04-2 · line 434 (audioUrl clause).** Currently: *"`Vocabulary.audioUrl` … does not imply a
scored `LISTENING` exercise or add `LISTENING` to `ExerciseType`."* Replace with: `LISTENING` is
added to `ExerciseType` by `ADR-006` option `4a`; a `LISTENING` payload references `vocabularyId` so
that read authorization stays with the existing `lingora_vocabulary_audio_select` policy; no new
Storage path, bucket, or policy is introduced.

**E-04-3 · line 436 (`nextReviewAt`).** Currently: *"It is not a notification/reminder delivery record
and does not authorize notification schema."* Keep both statements — they remain true under `3a` —
and add that the approved reminder reads `dailyGoalMin` and `lastQualifyingActivityDate` on-device
and still authorizes no notification schema.

**E-04-4 · line 437 (Grammar outside data model).** Replace with: grammar content is an `Exercise`
row with `type = 'GRAMMAR'` and a JSONB payload; no grammar table or grammar-progress column exists;
the NLP P2 `grammatical_acceptability_score` remains API-only and unpersisted.

**E-04-5 · line 16 (legacy-block note).** Currently: *"The canonical exercise set is only `MCQ`,
`FILL_BLANK`, and `REORDER`. Vocabulary audio playback remains part of Project 1, but it does not
restore a scored `LISTENING` exercise type."* Update the canonical set to the five approved values
and state that `LISTENING` is restored at word level by `ADR-006`, while `MATCHING` and `WRITING`
remain superseded and the legacy sentence-level `LISTENING` example at `docs/04:347` stays superseded
(that is option `4b`, rejected).

**Not edited:** the legacy `schema.prisma` block at `docs/04:31` and the legacy payload examples at
`docs/04:343-349`. They are explicitly marked preserved legacy source; the note at line 16 is the
approved mechanism for correcting them.

## Exact Edits — `docs/05-traceability-matrix.md`

Update four rows in the `Scope Gap Review approved resolutions` table (lines 65-69). Each row keeps
its `Concern` cell and gets a rewritten `Canonical resolution` and `Traceability effect`:

| Row | New resolution | New traceability effect |
|---|---|---|
| `Grammar` (line 65) | `GRAMMAR` is an approved `ExerciseType` per `ADR-006`; no P1 grammar curriculum, schema, or progress entity | Maps to new `P1-FR-012`; `NLP-FR-005` unchanged |
| `Listening` (line 66) | Word-level scored `LISTENING` approved per `ADR-006` option `4a`; sentence-level `4b` rejected | Maps to new `P1-FR-013`; legacy sentence-level examples stay superseded |
| `Notification/Reminder` (line 69) | Android-local reminder approved per option `3a`; no backend delivery, token, or entity | Maps to new `P1-FR-015`; no API or data mapping created |
| `SRS` (line 68) | Add that the daily study goal (`dailyGoalMin`) is now a mapped requirement | Maps to new `P1-FR-014`; `record_review` scope unchanged |

The `Vocabulary` and `Quiz` rows are **not** edited — `ADR-006` changes neither.

**E-05-5 · closing sentence (line 71).** Currently: *"These resolutions clarify existing scope and do
not authorize application implementation or change the API contract/database schema."* Must be
amended, because it is now false in one respect: `ADR-006` **does** authorize a schema change (the
enum migration). New wording: the resolutions do not by themselves authorize implementation; the
`ExerciseType` enum addition is authorized by `ADR-006` and requires its own approved task; the API
contract is unchanged.

**E-05-6 · requirement coverage.** If the matrix has a per-`P1-FR` coverage section, add rows for
`P1-FR-012` … `P1-FR-015` with evidence pointers matching the new requirements. Verify during
implementation; do not invent a section that does not exist.

## Review

- **Architecture:** no change. Three repository boundaries and their ownership are untouched; no
  component gains a responsibility. `docs/01-architecture.md` needs no edit because `docs/01:121`
  already anticipates adding an enum value plus a Fragment.
- **Requirements:** four new Must rows extend the existing `P1-FR` sequence without renumbering.
  Every structural exclusion that `ADR-006` did not overturn is preserved verbatim - a deliberate
  constraint, since the value of these documents is that they say no to things.
- **Security:** zero security surface change. No new learner-writable field (SEC-D3 intact), no
  change to trusted write paths or `record_review` (SEC-D5 intact), no new Storage path, bucket, or
  policy (SEC-D8 intact). Documentation-only.
- **Data model:** the entity-level block list stays in force. `ADR-006` adds zero tables and zero
  columns; the edits make clear that `GRAMMAR`/`LISTENING` are enum values on existing `Exercise`.
- **Traceability:** closing sentence at `docs/05:71` is corrected because it would otherwise remain
  false once the enum migration is authorized.
- **Scope:** documentation only. No schema, migration, RLS, dependency, or source file is touched.
- **Concurrency:** the parallel session's files are untouched; `plans/current-task.md` was archived
  to `plans/archive/2026-08-15-public-snapshot-staging-DONE.md` before being replaced, per
  `AGENTS.md` §Documentation lifecycle.

## Test Plan

1. `git diff --stat` shows changes confined to `docs/00-master-plan.md`, `docs/02-requirements.md`,
   `docs/04-data-model.md`, `docs/05-traceability-matrix.md`, `plans/current-task.md`, `logs/*`,
   `HANDOFF.md`. Record the exact output.
2. `git diff --stat lingora-admin/ lingora-android/ lingora-ai/ docs/01-architecture.md
   docs/03-api-contract.md` must be **empty**. Record the empty result and exit code.
3. `git diff --check` exits `0` (no whitespace errors) on all edited files.
4. Grep the four edited docs for each stale exclusion phrase; each must return zero matches:
   `Grammar curriculum is not part`, `not a scored .LISTENING. exercise`,
   `Notification/Reminder remains deferred`, `does not imply a scored .LISTENING.`,
   `Grammar curriculum is outside`.
5. Grep confirms every preserved block is still present: `QuizAttempt`, `device-token`,
   `reminder-schedule`, `standalone flashcard`, `pronunciation`, `MATCHING`, `WRITING`,
   `grammatical_acceptability_score`. Report counts.
6. Grep `docs/00-master-plan.md` confirms `LISTENING` no longer appears in the line-107 cut list, and
   that the `Phương án rút gọn` / `Nếu bị chậm` conditional wording at `:81` and `:103` is unchanged.
7. Grep confirms `P1-FR-012`, `P1-FR-013`, `P1-FR-014`, `P1-FR-015` each appear in **both**
   `docs/02-requirements.md` and `docs/05-traceability-matrix.md`, and that `P1-FR-001` … `P1-FR-011`
   are unrenumbered and still present.
8. Confirm zero occurrences of any new entity/table/column name across the diff - specifically
   `GrammarLesson`, `UserGrammarProgress`, `QuizAttempt` as an approved entity, `reminderTime`,
   `deviceToken`, `notificationPreference`.
9. Confirm `enum ExerciseType` in `lingora-admin/prisma/schema.prisma` still reads
   `{ MCQ FILL_BLANK REORDER }` - this task must not change it. Record the observed line.
10. Confirm no payload JSON schema was frozen: grep the diff for `payloadVersion` and verify any
    occurrence is descriptive prose, not a normative contract.
11. Confirm `plans/archive/2026-08-15-public-snapshot-staging-DONE.md` is byte-identical to the
    previous `plans/current-task.md` content via `cmp`, proving nothing was lost when the active plan
    was replaced.
12. Record every command, exit code, output excerpt, `git diff --stat`, and verdict in
    `logs/test-log.md` using the mandatory evidence format. Verdicts come from observed output only.
13. Run a post-implementation quality review before marking DONE. No commit is authorized.

## Approval

Status: APPROVED
Approved by: Pham Nguyen Thanh Tung
Date: 2026-08-15

Approved scope: documentation alignment only, exactly the edits enumerated in the `Exact Edits`
sections. Still forbidden by this approval: `schema.prisma`, the `ALTER TYPE` migration, the
`androidx.work` dependency, and any file under `lingora-android/`, `lingora-ai/`, or
`lingora-admin/src/`.

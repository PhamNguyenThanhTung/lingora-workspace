# Slice 6 verification — PASS / ACCEPTED

Accepted 2026-10-31. Baseline `d1c5034`; final commit/push outcome is reported in the Codex delivery. Spec: [implementation contract](2026-10-30-slice-6-exercises-vocabulary-media.md). Review/fixes: [review](slice-6-review.md). Anti initial delivery: [delivery](slice-6-delivery.md).

## Domain and shipped behavior

- Real `LessonExercise → ItemIdentity(PRACTICE) → ItemRevision` model; private `ItemGradingSecret`. MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR use strict bounded schemaVersion1 payloads and type-specific validation. No invented table/type/physical fields.
- Global VocabularyConcept unique(languageId,normalizedForm,senseKey), with server-derived Course target language and revision-owned LessonVocabularyLink/displaySnapshot. Create/reuse, exact scoped lookup, existing attach, membership position/core edit and detach are supported. Global concepts are never edited/deleted by this editor.
- Existing Teacher detail/draft endpoints and real `/my-lessons/[lessonId]` page extended; new read-only vocabulary-options route. Exact ACTIVE TEACHER/current assignment gates, Account/Lesson/assignment/item locks, aggregate CAS, highest revision/current episode checks and opaque ownership404 preserved.
- All child changes stage in the form; each explicit Save atomically inserts a new DRAFT LessonRevision and fresh child revisions/secrets/memberships. Retained ItemIdentity and VocabularyConcept IDs are shared, stored vocabulary snapshots are copied exactly. Old rows and activeRevisionId remain unchanged. Unsupported payloads/media/assessment/orphan/foreign-parent/snapshot structures are read-only and cannot be dropped through an empty-array save.
- Media tables exist, but DEV has no MediaAsset/Binding rows or `lingora-media` bucket and no safe upload runtime. Uploads/managed assets/buckets/playback are deferred. LISTENING stores a validated normalized public HTTPS reference in promptData; no media fetch, embed or storage write. The live reference came from the [MDN audio example](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/audio); playback/remote availability is not claimed.

## Independent review and fixes

Senior Sol High inspected source and reproduced persistence/fixture/race and answer-loss findings, then hit provider usage limit before its final artifact. Codex independently reproduced them (initial19 backend failures and4 browser failures), fixed them directly and owns this final PASS. No additional Anti correction/reviewer cycle.

Fixes include complete shared predecessor validation and real relation counts; vocabulary race/rollback; canonical UUID compatibility; REORDER permutation preservation and explicit order control; punctuation-safe single-line answer lists; editable membership position/core; exact DTO/reload/auth/retry behavior; query limits, safe unsupported display and modal focus. A late temporary-key collision between distinct vocabulary tuples containing underscores was fixed using an unambiguous tuple key; the old code fails its focused regression and restored code passes.

An inherited Course test raced a delayed initial focus, appending the second locale into the first input under load. Failure evidence was preserved; the test now waits for actual initial focus before typing. No Course runtime/assertion removal. Live visual inspection also found an unreadable narrow Vocabulary position input; one size/padding fix was visually verified and component/type/build checks rerun.

## Final local checks

All commands from `lingora-admin`, exit0:

| Check | Result |
|---|---|
| `npm run test:feature` | **386/386**, 0 failed/skipped |
| `npm run test:components` | **106/106**, 0 failed/skipped |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| Semantic mutation A–G | **7/7 KILLED**, baseline0 → mutant1 → restored0, byte-exact restoration |
| Old vocabulary tuple-key regression | old code fails assertion; restored code passes, byte-exact |

A ownership bypass, B transaction ACTIVE bypass, C MCQ cross-field payload validation, D omitted successor membership copy, E foreign Lesson source substitution, F wrong production Save endpoint with staged children, G foreign Vocabulary language bypass. Failures are assertions, not syntax/module errors. Final A–G rerun followed the last backend fix. The UI-only size fix was also followed by a focused F control. Build has the two inherited generated-Prisma Turbopack tracing warnings; no dependency changes or audit reopening.

## Live owned DEV proof

Origin `http://127.0.0.1:3012`, production build, exact existing Slice5 DEV set `S5-DEV-20261030143359`. Admin used its existing UI session only to enable/disable that Teacher. Separate Playwright context used the owned Teacher's normal SDK Auth session in RAM; no Admin cookie extraction, password reset, stored token/storageState or new account.

- A/C/media: real page created MCQ + LISTENING + one global Vocabulary; revision4 Save/reload/API/SQL confirmed persistence. Invalid localhost/http media reference rejected without staging false-success. Valid HTTPS reference persisted with **0 observed media fetches**. Initial7s automation response wait expired while Save completed normally; readback identified the committed revision without repeating the write, and the harness used30s thereafter.
- B/D: edited prompt/answer/position; duplicate position409 retained staged data, created no revision and showed no success. Corrected position then200/revision5/reload. Vocabulary position/core changes persisted.
- E: deep SQL comparison confirmed original revisions1–3 and **all revision4 rows** (revision/item identity/item revision/secret/exercise/global concept/link) unchanged after successors. A stale revision4 tab got409 STALE_LESSON, kept typed input and created no revision; explicit latest-content reload replaced child state/token together. Revision6 detached Vocabulary while its global concept and old links remained.
- C reuse: exact language-scoped live lookup found the same concept; reattachment in revision7 preserved its ID, global count stayed1, position/core persisted. Final positive-flow page reload observed0 page exceptions.
- F: safe TeacherB substitute is the **actual production-handler integration** for list/detail/lookup/full child PATCH, current and guessed tokens, plus disabled status; empty/404/403 and zero persistence effects. No second mailbox/account created.
- Lifecycle/cleanup: Admin UI disabled the fixture again; same owned Teacher session GET/PATCH returned403 ACCOUNT_INACTIVE with no new revision; editor denied. Course remains inactive; assignment preserved; activeRevisionId null; Lesson.rowVersion10. SDK signed out locally, owned browser/context and temporary Admin tab closed; helper exit0. Local TTY restored before closing its stdin.

## Retention and residue

Owner-authorized reusable set retained; immutable history/FK/trigger guards remained intact. **Unexpected residue = 0**, not total fixture residue0. Canonical data received no writes. Exact old base fixture IDs remain in the spec/Slice5 verification; complete new retained IDs are in local `live-retained-inventory.json`.

| Retained resource | Final count |
|---|---:|
| Course / Unit / Lesson / assignment / assignment history | 1 each |
| Teacher Account / Auth identity / provisioning request | 1 each |
| LessonRevision | 7 (original3 + new4) |
| ItemIdentity | 2 |
| ItemRevision / private grading secret / LessonExercise | 8 each |
| Global VocabularyConcept | 1 |
| LessonVocabularyLink | 3 (revision4,5,7; revision6 detached) |
| MediaAsset / MediaBinding | 0 |
| Immutable lifecycle audits | 7 |

Global touched-table counts agree with the owned inventory and the zero-child preflight. Final Teacher DISABLED, Course inactive. No schema/migration/reset, storage provisioning, review/approve/publish/learner/grading/SRS work or Slice7.

## Evidence and Git scope

External directory: `/home/tung/.codex/task-logs/slice-6-content/`.
Primary files: `final-feature.log`, `post-live-components.log`, `final-typecheck.log`, `final-build.log`, `mutations.json`, per-control baseline/mutant/restored logs; `codex-feature-red.log`, `codex-components-red.log`, `live-baseline.json`, `live-revision4-snapshot.json`, `live-isolation-proof.json`, `live-vocabulary-reuse-proof.json`, `live-disabled-proof.json`, `live-retained-inventory.json`.
Screenshots: `live-created.png`, `live-conflict-retained.png`, `live-edit-retry.png`, `live-stale-retained.png`, `live-revision6-detach.png`, `live-final-authoring.png`. Raw logs/screenshots/session artifacts are not committed.

Only Slice6 source/tests/test scripts/spec/delivery/review/verification/current-task/roadmap are eligible. Unrelated AGENTS.md, product README and both database plans stay outside the commit. Final diff/allowlist check PASS:20 scoped files. Actual private-environment/credential scan PASS for staged content and24 client JavaScript bundles, no leaks; see external secret-scan.json. Final review: **PASS — SLICE 6 ACCEPTED**.

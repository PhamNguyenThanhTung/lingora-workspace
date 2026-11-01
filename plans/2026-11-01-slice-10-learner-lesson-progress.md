# Slice 10 — Learner Lesson / Progress Foundation

Status: **APPROVED CONTRACT — official migration applied/verified DEV; implementation/review/fixes/local and public acceptance PASS; SLICE 10 ACCEPTED.**

Planning baseline: `f71fdf70f06a9c9e00f5ea81dfa6b675b85dbda2` (also inspected HEAD). This is source inspection and an implementation decision record, not live DB verification or acceptance evidence. No implementation, tests, migrations, deployment or fixture writes were performed by this planning run.

## Approved executable implementation contract — 2026-11-01

Owner approved separate `LessonConsumption`, canonical graded gates, corrected shared parent locks, migration promotion and DEV apply. The final SQL/Prisma/FK/cardinality/down checks PASS on disposable PostgreSQL 17.11; the additive official migration is `lingora-admin/prisma/product/migrations/20261101000000_lesson_consumption/migration.sql`. DEV catalog evidence must PASS before learner implementation uses it. The earlier discovery below is historical; this section and the approved consumption design supersede its blocked/no-apply conclusions.

### Fixed interfaces and access

- Pages: `/home` links each actionable context to `/learn/[contextId]`; catalogue links `/learn/[contextId]/[lessonId]`. Explicit player button **Mở nội dung** sends `start`; loading/prefetch/GET alone never writes. After acknowledged start, show content and **Hoàn thành đọc nội dung**; refresh of started/completed detail preserves state. No silent POST useEffect that prefetch can trigger.
- APIs: `GET /api/learner/contexts/[contextId]/lessons`, `GET /api/learner/contexts/[contextId]/lessons/[lessonId]`, `GET|POST /api/learner/contexts/[contextId]/lessons/[lessonId]/consumption`.
- Use actual production loaders in pages and routes. Strict UUID selectors, reject unsupported query/body fields; no learner/course/level input accepted. POST JSON only `{action:"start"|"complete",expectedPublishedRevisionId:UUID}`. Expected ID is only stale precondition; actual pointer supplies persisted revision. Same-origin check, existing auth-refresh/private-no-store behavior on success/errors.
- Reuse verified provider/confirmed/fresh ACTIVE LEARNER. Every read/mutation must enforce owned ACTIVE context, active same-language Course, Unit.courseId, Course/Level framework consistency, AVAILABLE Lesson and exact same-Lesson PUBLISHED `activeRevisionId`. 401 unauthenticated;403 inactive/wrong role/paused;404 inaccessible ID/no publication (no ownership/content disclosure);409 inconsistent scope/publication changed/locked/start absent;503 safe transient failure. Use clear safe messages and reload/retry.
- Null working Level is200 non-actionable state; no inferred assignment/write. Earlier Levels are reviewable. At working Level, already graded-completed Lessons or Lessons with all preceding currently eligible required Lessons officially completed are open. Sort by Level.position, Unit.position, Lesson.position +stable IDs. Optional preceding Lessons do not block. Future Levels hidden. Locked current Lessons expose safe title/order only, no content/children/actions. **Only `LessonCompletion` is official gate evidence; consumption never unlocks.**
- Catalogue DTO: owned context/course/working-Level labels, ordered safe Units/Lessons, exact current revision ID/title, lock and reading state. No private/staff metadata. Detail: same context/course/unit, exact revision safe title/contentBlocks/topicIds/skillIds/purposeTags; exact ordered PRACTICE LessonExercise→ItemRevision(id,itemId) safe type/schemaVersion/promptData; vocabulary displaySnapshot. Never load gradingSecret/assessment contribution/latest child. Select safe fields explicitly, don't spread raw rows. Safe read-only rendering for five types, no HTML injection, no answer submission. HTTPS LISTENING audio validates accepted URL contract and handles load failure without crashing. No import of staff modules into client bundles.
- Reading DTO: contextId,lessonId,lessonRevisionId,state NOT_STARTED|IN_PROGRESS|COMPLETED, nullable id/startedAt/completedAt/updatedAt and string rowVersion as applicable. UI labels Chưa đọc/Đang đọc/Đã đọc. Reading acknowledgement explicitly does not complete exercises or unlock curriculum.

### Fixed state and transaction behavior

Follow approved consumption design for exact state table/lock order. Use READ COMMITTED interactive transaction, account FOR NO KEY UPDATE, Course FOR SHARE → Context FOR SHARE → Lesson FOR SHARE; re-read authoritative scope after all locks. Only specific consumption row exclusive. Compare publication before any write **or idempotent return**. Insert with ON CONFLICT DO NOTHING then lock/re-read if needed. DB `clock_timestamp()` once after locks and row lock; explicit started/created/updated timestamps. Complete never fabricates start. First start version1; complete increments once; duplicate start/complete never changes timestamps/version. BigInt serializes safely. Use short bounded transactions, safe retryable transient errors, no raw DB/secret errors.

X→Y retains X row verbatim; Y starts absent then separate row. Old-X request always409 PUBLICATION_CHANGED even after successful X completion; no retargeting. Withdrawal/inactive/pause prevent new writes. Context identity guard must prevent consumption-only reassignment, including first-start race. Graded tables, SRS/performance/activity, selected/working Level, content/children remain unchanged.

### DAG / ownership / delivery

1. **Codex (complete first):** official schema/migration and disposable up/down/parity test → DEV apply → read-only catalog evidence/client generation → final spec.
2. **One Anti stream:** `lingora-web` lesson server/API/pages/UI/navigation/styles/tests/package test scripts. Read-only use of schema/design/staff content contract. No schema/migration/AGENTS/README/current-task/roadmap edits, no existing test weakening, no grading, no Slice11. Minimal existing auth/context changes only when needed and keep regressions. No live DB, `.env`/secrets/provider writes/deploy/git push. May use owned local disposable PostgreSQL explicitly; tests needing DB accept an explicit loopback-only test URL and fail/skip clearly when missing, never default to real env. No recursive agents.
3. **Independent Sol High review + Codex direct fixes:** inspect actual source/tests/integration. Parent owns mutation controls, local final gates, deployment, public fixtures/acceptance/cleanup and docs/commits.

Anti required tests: server success/denial matrix, strict mutation validation, exact X vs newer draft/child snapshots, own state, idempotency, absent complete409, stale before no-op, Y separate, reading-not-grade/unlock; actual Next page invocation→actual view→real callback endpoint→DTO reconciliation, failures/pending/retry/session403/401/stale/reload and audio error; mandatory mutation-compatible tests A–G plus grading-gate/context-identity guard. Use real selected rows/IDs not mocks ignoring query predicates. Local DB integration test for simultaneous starts/completions, shared independent-learner parent locks vs publisher, completion waiting behind start uses database post-lock timestamp, first consumption vs context reassignment. Test fixtures owned and removed; do not fabricate graded evidence in DEV.

Anti runs relevant feature/components, learner typecheck/build and returns changed paths, exact commands/exit codes and `plans/evidence/slice-10/anti-handoff.md`. Production test scripts include new tests. Codex then root feature/components/typecheck/build, real semantic mutations A–G + reading-gate/context guard, client secret scan, byte-exact restoration. No full local rerun solely doc-only changes. No final PASS until exact Ready public acceptance and cleanup.

### Public acceptance ownership

Codex verifies exact pushed commit Ready on learner (and staff for shared schema), then uses labeled disposable DEV learner(s)/contexts and owned noncanonical content created through supported staff workflow. Real public login→context→catalogue→detail→start→reload→read-complete→reload. Prove unpublished/direct/mismatched/disabled denials, X publication with newer draft isolation, exact exercises/vocabulary, Y republish with separate reading state, stale failure/reload retry and duplicate idempotency. DB evidence queries read-only for identity/state/timestamps/pointers/history; compare protected graded/SRS/activity/level data before/after. Cleanup consumption→contexts/learners when deletable; retain explicitly listed immutable content history at inactive/disabled baseline, unexpected residue0. Logout and close all agent sessions/browser; no password/token/storageState/traces in files. User-owned browser tabs stay untouched. No Slice11.


## Historical discovery and original blocker (resolved by approved new model)

## Goal and boundary

Provide an authenticated learner's permitted published catalogue and immutable lesson content, persisted start/progress, and truthful completion. The supplied task excludes answer submission, exercise grading, scores, Placement, Level-up, SRS and Slice 11, and explicitly forbids automatic migration or fabricated persistence.

Preserve the existing dirty `AGENTS.md`, `lingora-admin/prisma/product/README.md`, and the two untracked October 28 plans. Only this spec belongs to the planning workstream.

## Blocking finding: read-only consumption cannot complete the existing model

There is no separate generic progress/status table. The existing evidence models are `LearningContext`, `LessonAttempt`, `LessonResponse` and `LessonCompletion` (`lingora-admin/prisma/product/schema.prisma:502–607`). The schema can represent an open attempt with an exact published revision, actual positive core count, and `startedAt`; it cannot represent an ungraded content-consumption completion under the current contract.

| Source | Contract and implication |
| --- | --- |
| `schema.prisma:536–565` | `LessonAttempt` requires context, lesson, exact revision and `nCore`; completion summary fields are nullable only while open. No progress percentage/current step/last-open field exists. |
| Baseline migration `20261027000000_product_baseline/migration.sql:1161–1168` | `n_core > 0`; `completion_shape_check` requires either all completion fields null or completed timestamp plus K, units, response count, operation key, local date and timezone. |
| Finalize migration `20261027010000_product_finalize/migration.sql:52–69` | Completed bounds require `0 <= K <= N`, `response_count = N + K`, and `2*(N-K) <= contribution_units <= 2*N-K`. Thus even the smallest completed attempt requires actual response-derived metrics; zero responses cannot truthfully describe completion. |
| `schema.prisma:568–607`; baseline migration `:1740–1758` | Responses store answer input, correctness and contribution units. `LessonCompletion.firstAttemptId` is required and its composite FK pins the same context/lesson; the parent-attempt trigger requires that attempt already completed. UNIQUE(contextId,lessonId) makes the first completion a lesson fact. |
| Correction migration `20261027020000_product_correction/migration.sql:879–898` | Completion timestamp must equal its completed first attempt timestamp. Directly inserting a completion for an open attempt is not a supported escape hatch. |
| `docs/use-case-specifications.md:170–182`; `docs/design/physical/README.md:96–98,136,187–193` | UC-06 requires all N first responses and exactly K retries; the server grades, recomputes summaries, then finalizes. Completion has no accuracy threshold, but requires valid processed responses. The explicit N>=1 policy says a special content-only lifecycle is outside MVP. |

Do not manufacture `nCore`, `responseCount`, `kFirstWrong`, `contributionUnits`, correctness, `LessonResponse` rows or completion side effects from reading a lesson. In particular, using a mathematically valid worst-case K/units tuple would falsely claim responses that did not occur. A read-only exercise renderer does not provide the required events. Do not label an open attempt as completed in a DTO or localStorage.

The initial decision options were:

1. Add a separately specified persisted consumption-progress/completion contract through a new approved migration, with an explicit policy for its relationship to existing graded lesson completion and progression. Do not silently weaken existing attempt constraints.
2. Expand this slice to the existing answer/grade/finalize contract (including its coupled transaction side effects), requiring revised scope and acceptance criteria.
3. Reduce Slice 10 to published content plus any truthful open-attempt foundation, explicitly defer completion and revise acceptance. This cannot receive the supplied full Slice 10 acceptance.

Owner selected option 1 on 2026-11-01: design separate consumption/progress and present the migration for review, without applying it. The resulting [review design](2026-11-01-slice-10-consumption-design.md), [SQL up draft](../lingora-admin/prisma/product/migrations/20261101000000_lesson_consumption/migration.sql), [guarded rollback draft](migrations/slice-10-consumption.rollback.sql) and [Prisma fragment](../lingora-admin/prisma/product/schema.prisma) are outside the active migration/schema inputs. This is authorization to design, not to apply or implement. Parent supplied scoped live DEV read-only evidence at `plans/evidence/slice-10/progress-schema-read-only.json`: the positive core count, completion shape/bounds including `response_count=N+K`, completed first-attempt requirement, and matching timestamp trigger are present; no additional lesson/progress table was found beyond the schema models. This planner did not perform that query. The evidence was obtained without DB writes or test runs.

## Verified identity, content and scope contracts

### Authentication and context ownership

`lingora-web/src/server/auth/index.ts` already verifies the provider user with `getUser`, confirmed email, fresh account, ACTIVE status and LEARNER role. Reuse this boundary for every future read and mutation; Teacher/Admin identities receive no learner privilege. Preserve private/no-store and refresh cookie/header handling.

`lingora-web/src/server/context/loader.ts` reads contexts using only `where: { learnerId: verified.user.id }`, validates Course language and Level framework joins, and returns legitimate empty `contexts: []`. `LearningContext` is the learner-to-course association, not a separate Enrollment model: UNIQUE(learnerId,languageId), required Course, ACTIVE/PAUSED status, nullable selected/working Level. There is no current-context pointer. Do not select an arbitrary first context, trust a client learner ID, or create a context for an empty learner.

The verified outer content query boundary is:

```text
verified ACTIVE LEARNER
→ owned LearningContext with status ACTIVE
→ context.courseId, Course.isActive=true, consistent language/framework joins
→ Unit.courseId=context.courseId, Unit.level.frameworkId=Course.frameworkId
→ Lesson.unitId=Unit.id, availability=AVAILABLE
→ exact Lesson.activeRevisionId and matching LessonRevision.lessonId
→ LessonRevision.status=PUBLISHED
```

An optional context identifier must be validated against that authenticated owner's contexts; it is never authority. Revalidate this boundary on direct detail and all future progress operations. PAUSED contexts/inactive Courses must not enable learning merely because Slice 9 displays their metadata.

**Level access is not settled by FK presence.** `docs/design/physical/README.md:175–177` describes sequential access using configured Unit/Lesson order, prior core completion and working Level, and distinguishes available from unlocked. `docs/02-requirements.md:50–52` preserves earlier review and completed history. The accepted learner code currently only displays nullable Levels; it has no lesson unlock resolver. Neither `Unit.levelId = workingLevelId` alone nor all lessons in an owned Course is an established access predicate. Once the completion decision is resolved, finalize the exact review/unlock/null-working-Level predicate from the canonical policy before dispatch; do not add Level-up behavior or infer a gate solely from schema.

Ordering fields are real: Level.position within framework, Unit.position within (Course,Level), Lesson.position within Unit; exercises and vocabulary use their membership position. Use these hierarchy fields, with stable ID tie breakers where needed.

### Exact publication and child content

The actual publication pointer is **`Lesson.activeRevisionId`**, not a `publishedRevisionId` field. Its composite relation targets `LessonRevision(id,lessonId)` (`schema.prisma:176–195`). Resolve it directly, never latest revision/revisionNo/status search. `lingora-admin/src/server/lessons/workflow.ts:1321–1359` publishes a target revision and atomically changes this pointer; publication does not change Lesson availability. A pointer alone therefore does not grant access. Draft Y must not affect published X.

Use only the exact resolved revision's `title`, `contentBlocks` and metadata. Child paths are:

- `LessonRevision.exercises` → each `LessonExercise.itemRevisionId` plus `itemId` → exact composite `ItemRevision(id,itemId)` → safe `type`/`promptData`/schema version. Membership is revision-scoped. Never resolve `ItemIdentity.revisions` by latest. Exclude authored ASSESSMENT contributions from a practice lesson DTO.
- `LessonRevision.vocabularyLinks` → `LessonVocabularyLink.displaySnapshot` ordered by position. Render that snapshot; the linked current `VocabularyConcept` is not display authority.
- Existing supported LISTENING media is `ItemRevision.promptData.audioUrl`, validated by `lingora-admin/src/server/lessons/content.ts:66–100,246–275` as a public HTTPS reference without credentials/query/fragment/custom port. Browser `<audio>` with usable load failure UI is sufficient. No server fetch/proxy or upload subsystem.

`schema.prisma:485–500` additionally models exact revision/item `MediaBinding`s, but `lessons/snapshot.ts:38–59` rejects those children in the currently supported publication package. Do not claim arbitrary MediaAsset playback is already supported. Preserve the accepted supported package boundary.

Do not reuse staff review DTOs/includes: `lessons/snapshot.ts` and `lessons/workflow.ts:790–806` intentionally read grading secrets for staff. The learner safe projection must omit `ItemGradingSecret`, `gradingData`, `feedbackData`, answer keys, assessment contributions, private audit/receipt fields and unnecessary staff metadata.

### Progress identity, republish and stale mutation

The model is hybrid: `LessonAttempt` pins `lessonRevisionId` plus `lessonId`; `LessonCompletion` is UNIQUE(contextId,lessonId) and keeps the first completed attempt's provenance. Publishing Y must not rewrite attempts from X or insert another first completion. Valid X completion survives replacement; a learner without completion follows current Y (`docs/design/physical/README.md:96–98,191`; requirements `:52`). It is incorrect to make completion reset per revision or to claim an old attempt belongs to Y.

The reference finalization contract requires a shared Course lock and recheck that the pinned revision remains the active AVAILABLE revision before new completion/performance side effects. A replacement that wins leaves X open; a fresh attempt follows Y. An identical committed retry checks authorization then its receipt before the now-stale pointer check. This is a specified future runtime contract, not implemented learner behavior at this baseline. The remediation migration `20261027030000_product_remediation/migration.sql:470–522` already enforces same Course, AVAILABLE, active pointer and PUBLISHED revision on attempt insertion. It does not implement the entire finalization service.

There are no database NOT_STARTED/IN_PROGRESS/COMPLETED enum/status fields here. A future UI may derive labels from absence of evidence, open attempts and first completion, with history kept distinct from current active revision. No invented percentages, timestamps or revision migration.

## Workstream and gates after an explicit decision

Dependency DAG: **completion contract decision + scoped live constraint evidence → exact learning access predicate → revised executable spec → Anti implementation/tests → independent Codex review/direct fixes → local gates → exact-commit learner deployment/public acceptance.** No implementation worker is ready for dispatch under this blocked spec.

One implementation stream is sufficient because safe DTOs, access decisions, mutation semantics and production UI are coupled. Candidate ownership is `lingora-web/src/server/lessons/`, explicit learner lesson/progress routes, `/learn` catalogue and `/learn/[lessonId]` pages linked from existing `/home`, and corresponding feature/page tests. These paths are proposed conventions, not files created here. Keep shared auth/context changes minimal; no migration without the selected separate approval.

The revised spec must retain the task's real acceptance gates: exact pointer and child snapshot isolation under newer drafts; context/role/ACTIVE checks; unavailable direct access rejection; hierarchy ordering; empty context; reload persistence; idempotency and cross-owner rejection; republish/stale behavior; actual production callback/endpoint/UI reconciliation; meaningful failure/recovery. Run mandatory mutations A–G and restore changed source byte-exact, then relevant tests/typecheck/build and secret scan. Public verification must use the exact Ready commit, owned fixtures, read-only DB evidence and documented residue handling. Do not run acceptance or claim PASS while mandatory completion remains excluded or fabricated.

Historical initial planning verdict (before approved LessonConsumption): source supports an immutable published-content resolver and potentially truthful open attempts. **Full requested Slice 10 is blocked by the absent ungraded completion capability and incompatible current scope.** No Slice 11 work is authorized.

Final disposition: **SLICE 10 ACCEPTED**. [Verification](slice-10-verification.md) and [public evidence](evidence/slice-10/public-acceptance.md). No Slice11.

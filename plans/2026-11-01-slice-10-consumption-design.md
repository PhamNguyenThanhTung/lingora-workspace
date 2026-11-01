# Slice 10 — Separate lesson consumption design

**APPROVED by owner 2026-11-01. Official migration promoted/applied and catalog verified DEV. Slice10 local/public acceptance PASS; accepted.**

The owner explicitly accepted the canonical graded gate consequence and authorized DEV apply and the implementation workflow. Historical proposal/approval-boundary wording below records the design review stage; the final executable contract in `2026-11-01-slice-10-learner-lesson-progress.md` governs execution.

User direction: “Thiết kế progress/consumption riêng; trình migration để review, chưa apply”. This proposal supersedes the assumption that Slice 10 must write graded completion, without changing any existing graded contract. Baseline source inspection is recorded in `2026-11-01-slice-10-learner-lesson-progress.md`; do not repeat earlier discovery or reopen accepted slices.

Current artifacts:

- [Official additive SQL migration](../lingora-admin/prisma/product/migrations/20261101000000_lesson_consumption/migration.sql).
- [Guarded operator rollback](migrations/slice-10-consumption.rollback.sql), tested only on owned disposable PostgreSQL.
- Active model/relations in `lingora-admin/prisma/product/schema.prisma`; shared client regenerated.
- [Disposable PostgreSQL 17.11 checks](evidence/slice-10/migration-local-check.json) PASS: FK/RESTRICT, uniqueness, timestamps/version, context identity guard, anon/authenticated denial, nonempty rollback refusal, empty rollback and Prisma/SQL parity.
- [DEV catalog verification](evidence/slice-10/migration-dev-verified.json) PASS: six applied ledger entries; five prior entries preserved; exact columns/FKs/indexes/RLS/guard; zero reading rows/backfill; graded constraints/triggers unchanged.

## Review summary

| Review item | Proposed contract |
| --- | --- |
| New storage | One `LessonConsumption` per context + exact revision; no backfill |
| User action | Acknowledge reading only; no graded completion or official unlock |
| Republish | X history retained; Y begins with no consumption row |
| Stale request |409 before any write/no-op; never retarget X to Y |
| Context identity | First consumption also freezes context learner/Course/language |
| Rollback | App rollback first; table drop allowed only when verified empty under lock |
| Approval | Owner approved model, canonical access consequence, shared locking, promotion, DEV apply and full Slice10 workflow |

## Meaning and storage

Add `app.lesson_consumptions` / Prisma `LessonConsumption`: one reading record per **owned LearningContext + exact published LessonRevision**. Store UUID identity, `contextId`, `lessonId`, `lessonRevisionId`, required `startedAt`, nullable `completedAt`, created/updated timestamps and positive `rowVersion`. There are no answers, score, percentage, exercise counters, current step, heartbeat, last-seen revision, arbitrary JSON or operation-receipt table.

| Persisted shape | Derived DTO state | UI wording |
| --- | --- | --- |
| No row for current context/revision | NOT_STARTED | Chưa đọc |
| Row, `completedAt=null` | IN_PROGRESS | Đang đọc |
| Row, `completedAt!=null` | COMPLETED | Đã đọc |

The action label is **“Hoàn thành đọc nội dung”**. Explain adjacent to the action that it records reading and does not complete exercises or unlock further curriculum. Do not present this as “Đã hoàn thành bài học”, official course progress, mastery or qualifying activity.

UNIQUE(contextId,lessonRevisionId) provides one durable state per revision. Required FK to context and Lesson plus composite FK `(lessonRevisionId,lessonId) → LessonRevision(id,lessonId)` prevent cross-Lesson revision references. Use RESTRICT deletes and NO ACTION updates. Add context-leading uniqueness and revision/Lesson child indexes. Timestamps are finite and chronologically consistent; version >0. Obtain one `clock_timestamp()` value from the database after authorization/locks and explicitly use it for the changed timestamp fields; do not accept client dates. Do not use transaction-start `now()` for a completion that may have waited behind another transaction creating the start row. Explicitly supply `updatedAt` so Prisma’s `@updatedAt` application clock does not override the shared database timestamp. The approved runtime must explicitly update timestamps/version; CHECKs do not implement state transitions. These are conventional same-row/FK constraints, consistent with [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html).

No backfill occurs. Existing graded completions do not fabricate reading rows; reading does not create or alter `LessonAttempt`, `LessonResponse`, `LessonCompletion`, performance, SRS, streak/qualifying day, assessment results, curriculum generation, Level or context start/working-Level fields. Core exercise counts and the existing graded finalizer remain unchanged.

## Reading access versus official progression — approved

Recommend **retain canonical graded unlocking for both lesson consumption and practice entry**. A reading row never opens a later Lesson or Level. The approved exact policy is:

1. Require fresh authenticated ACTIVE LEARNER, an owned ACTIVE context, active Course, consistent Course language/framework and Unit Level framework. No client identity is trusted; an explicit context URL selects only among owned contexts.
2. Require Lesson AVAILABLE and its exact `activeRevisionId` to resolve to a PUBLISHED revision of that same Lesson. Omit unpublished/withdrawn/inactive content from the learner catalogue and reject its direct URL.
3. If `workingLevelId` is null, return a valid non-actionable context state with a clear “Chưa có trình độ học hiện tại” message. No context write, inferred default, entry-level assignment or selection flow is added. This can require a separately authorized context-setup feature for those learners.
4. For a valid working Level, published AVAILABLE lessons at lower-position Levels are available for review, as allowed by canonical earlier-level review. At the working Level, a Lesson is open if already officially completed, or every preceding currently eligible required Lesson in that Level has an existing `LessonCompletion` for this context. Preceding means `(Unit.position, Lesson.position)`; all Course/Level relations are checked. Optional lessons do not block successors. Future Levels are inaccessible. No special reading preview bypass is introduced.
5. Catalogue shows earlier/current Levels in hierarchy order. Current-Level published lessons still locked by step 4 may show safe title and a “Cần hoàn thành bài học trước” lock; they expose no body, child content or mutation action. No titles/content from future Levels need be returned in this minimal slice. Direct locked access fails with an explicit safe locked response. An official prior completion remains lesson-level across republish; it can permit reopening the current publication while that publication's reading state starts separately.

This is a concrete proposed interpretation of `docs/design/physical/README.md:175–177` and UC-04/UC-06, not an existing implemented access resolver. It does not impose a universal Level-up threshold or advance Levels. Preserve current publication ordering fields and safe DTOs from the earlier spec.

**Approved consequence:** a learner with no graded completions can read the first unlocked working-Level Lesson and mark it read, but cannot open the next sequential locked Lesson through that reading action. Consumption is not an independent curriculum progression mechanism.

## Read and mutation contracts

Suggested explicit endpoint: `/api/learner/contexts/[contextId]/lessons/[lessonId]/consumption`; use a GET (or server loader) for state and POST for actions. Strict POST body: `{ action: "start" | "complete", expectedPublishedRevisionId: UUID }`. Reject unknown fields including learner ID, status, timestamps, percentages and client rowVersion. The expected revision is a stale-page precondition, not a requested revision or authorization. The server always resolves the current Lesson publication pointer; it never opens a supplied historical revision.

The production detail page reads safe published content, then explicitly invokes `start` when the player is opened; GET/render alone remains read-only. Completion requires an existing started row. Return a safe DTO containing actual publication identity, state, server timestamps and string rowVersion; reconcile UI only from the successful response. Session/permission/retry/stale errors preserve usable content where still authorized, show no false success, and provide reload/retry. Preserve existing private/no-store and auth refresh headers. Enforce same-origin mutation requests alongside existing cookie/session protections.

| Current state | Action | Result while publication precondition holds |
| --- | --- | --- |
| Absent | start | Insert once, IN_PROGRESS, version 1 |
| Absent | complete | 409 CONSUMPTION_NOT_STARTED; no implicit fabricated start |
| IN_PROGRESS | start | 200 current row; unchanged timestamps/version |
| IN_PROGRESS | complete | Set completedAt/updatedAt once, increment version once |
| COMPLETED | either | 200 current row; unchanged first start/completion/version |

There is no reset or delete endpoint, no redo-reading history and no method to repin a row. Database CHECKs cannot enforce old-versus-new monotonicity; the trusted server mutation service owns it, following the repository's Backend-First policy. A privileged DB operator remains able to alter data; RLS does not promise protection from that operator.

## Publication changes, locking and races

After X→Y publication, the normal catalogue/detail always reads Y. Its consumption state is absent until Y starts; X's completed provenance remains unchanged. No row is copied, reset, migrated or relabeled as Y. Historical X state can be verified through owned DB evidence; this slice does not add a learner historical-content player. Publication withdrawal blocks new reading mutations without deleting existing history.

Actual `publishLesson` (`lingora-admin/src/server/lessons/workflow.ts:1219–1283`) locks Admin account → Lesson FOR UPDATE → review/revision. Its code does **not** lock Course. Parent-supplied trigger definitions show reads of Course state in the Lesson guard, without an indirect Course write/row lock. Do not claim that historical proposed Course-lock publication design is already runtime behavior.

Proposed consumption transaction at READ COMMITTED:

1. Verify provider identity; lock/recheck authenticated Account FOR NO KEY UPDATE, using the accepted account-lock pattern.
2. Resolve candidate owned-context/Course/Lesson identities without treating them as final authority. Lock Course FOR SHARE → LearningContext FOR SHARE → target Lesson FOR SHARE. Re-read ownership, ACTIVE flags, Course/language/framework, Unit/Level/access predicate and publication after locks; a changed relationship fails closed. These compatible shared parent locks permit different learners to proceed concurrently while conflicting with relevant updates; lock only the specific consumption row exclusively when changing it. This adds no writes to the parent rows. Preserve this order in future context/consumption services; do not acquire Course after Lesson.
3. Compare expected publication to server-resolved active PUBLISHED revision before any state write or idempotent return. Mismatch returns 409 PUBLICATION_CHANGED, no writes, reload required. Thus a retry of committed X completion after Y publishes returns conflict rather than retargeting Y; X remains committed. No receipt table is necessary for these desired-state commands.
4. Read/create or lock the `(contextId,activeRevisionId)` consumption row and apply the table above. Use unique conflict-safe insertion or re-read; recheck its context/Lesson/revision identity. Keep first completed provenance immutable in the service. Commit before reporting success.

The **Lesson FOR SHARE** lock conflicts with publication/availability writers while remaining compatible with other consumption readers. If consumption commits first, its X event is valid and later publish preserves X; if publication commits first, X requests conflict. Source confirms Course CRUD (`server/courses/index.ts:681–685`) and Unit CRUD (`server/units/index.ts:645–649`) take the Course lock first. The proposed Course lock stabilizes those direct state/configuration/Unit changes; it is not a substitute for the Lesson publication lock. Lesson ordering/required changes currently lock only their own Lesson (`server/lessons/index.ts:888–901,972–980`), so do not promise a global immutable curriculum snapshot or that every curriculum writer shares Course locking. Evaluate official access from current server data on every request; a concurrent change to another Lesson can affect later requests, without consumption ever persisting an unlock. This proposal adds no unrelated staff-lock retrofit. Context lock plus the amended identity guard prevent a context rewrite racing first consumption. Row locks block conflicting updates until transaction end, as described in [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html). Keep transactions short; on deadlock/serialization failure, return a safe retryable response and revalidate all conditions on retry.

## Context history protection and security

The current `guard_learning_context_immutable_identity` checks only LessonAttempt/AssessmentAttempt. Without amendment, consumption-only history could be transferred to another learner/Course/language by rewriting its context. Draft SQL extends that **existing** guard with one `EXISTS(app.lesson_consumptions WHERE context_id=OLD.id)`; no new trigger or generic business workflow is added. Do not snapshot redundant owner/Course/language tuples or add unique keys to several existing parents. Published Lesson identity already freezes by its revision history; no additional Lesson/Unit identity trigger is needed for the new table. Final acceptance must cover consumption-only context reassignment and a concurrent first-start versus context-change race, not merely histories that also contain graded attempts.

Accepted server Prisma currently uses the configured BYPASSRLS connection; all learner ownership/access checks therefore remain mandatory in server code. Draft SQL enables and forces RLS **only on the new table**, creates no policy, and revokes all new-table privileges from PUBLIC/anon/authenticated. No global/schema/default privilege changes or legacy role retrofit. No browser database access. FORCE does not constrain BYPASSRLS: this is a direct-client denial boundary, not database per-learner isolation for the current server connection. See [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html). A future non-bypass runtime or additional context writer needs a separate review of grants, policies and identity-guard visibility; it must not silently acquire filtered visibility that weakens the guard.

Query safe published projections only: exact exercise ItemRevision prompt data, vocabulary displaySnapshot and supported HTTPS audio. Never include grading secrets or assessment contributions in a learner DTO. Table FK integrity does not establish Course ownership, current publication or unlock permission; the server validates all three.

## Migration, rollout and cleanup

The proposal creates one table and indexes, table-local restrictions, and amends one existing guard function. It does not modify a historical migration or loosen any current graded CHECK/FK. No data backfill. Before converting this draft to a new active migration, compare the current guard/roles/schema to the supplied scoped evidence and review drift; do not overwrite an independently changed guard. Keep the accepted migration ledger/history intact: add a new migration only, with no database reset, historical replay or restoration of retired closure migrations. The SQL intentionally fails if the table already exists rather than silently adopting an unknown definition.

Owner approval was received 2026-11-01. Codex validated the proposal against an owned disposable PostgreSQL17.11, promoted the active model/new migration and applied it explicitly on DEV. Catalog evidence confirms the additive result and unchanged existing graded constraints/triggers. Shared client generation passed. No migration command was added to build hooks. Anti implementation follows the final executable spec.

Rollback the application first and stop/drain consumption writers. Drop the new table only if it is empty and removal is explicitly approved; the rollback locks the table before checking and sets transaction-local `row_security=off` so a non-bypass role fails instead of mistaking RLS-hidden rows for emptiness; restore the prior guard without its new EXISTS in the same transaction before dropping. If any real reading history exists, retain table and amended guard until a separately reviewed retention/export/removal decision. Never CASCADE. FK cleanup order for owned disposable fixtures is consumption rows → temporary context/learner/content only after checking other retained history; default RESTRICT prevents accidental parent removal. Existing graded/history fixture policies still apply. No routine learner delete/reset API is proposed.

## Required feature acceptance — pending implementation

- Schema: exact uniqueness/FKs/timestamp/version checks, direct anon/authenticated table denial, no backfill and no changed graded constraints. Verify approved deployment role works with table-local RLS; do not assert FORCE protects against BYPASSRLS.
- Access: own ACTIVE context and account, no staff privilege, wrong owner/Course/Level/locked/unpublished/direct-ID rejection, correct hierarchy, nullable working-Level empty state, no implicit context writes. Existing auth/context regressions remain green if shared helpers change.
- Persistence: actual page → GET detail → start callback → exact endpoint → safe DTO → UI state; reload remains IN_PROGRESS/COMPLETED for the same revision; absent complete rejected; double start/complete and retries preserve one row, original timestamps and monotone version.
- Races: different learners can simultaneously hold shared Course/Context/Lesson parent locks for consumption, while publication/CRUD/context reassignment waits until those conflicting locks release; simultaneous starts; a completion transaction begun earlier but waiting behind a later start must use the post-lock database clock; concurrent completions; start retry after completion; publication X→Y before and after completion lock; stale X retry after committed X completion then Y; withdrawal; disable/pause; consumption-only identity rewrite and first-start/reassignment race. Check no partial mutation and deterministic recover/reload.
- Identity: X completion retained and distinct Y state absent, Y start new, no historical rebind; learner A never reads/writes B; context/Course/language identity cannot change once consumption exists. History has no learner content-access bypass.
- Consumption-not-grading: compare protected graded attempt/response/completion, SRS/activity, context Level/start and official gate data before/after real reading start/completion; no writes or official unlock. Later sequential lesson remains locked without required graded evidence. Existing graded completion does not fabricate consumption.
- User task mutations A–G still apply: exact pointer, context ownership, consumption ownership (adapt C from generic progress), ACTIVE, unavailable guard, actual production callback, exact child snapshot. Add mutations replacing official gate evidence with consumption and removing consumption-only context guard; both must be killed. Restore mutated files byte-exact.
- Render/page checks cover catalogue/locked/empty/detail, exercise/vocabulary/audio failure, pending action, safe completion success, failure/retry/session expiry/forbidden and stale reload. Typecheck/build, client secret scan, exact Ready learner commit, owned public fixtures, live persisted evidence and residue handling remain required later.

Dispatch dependency: **approved model/access/migration → verified DEV schema → final executable spec → Anti implementation/testing → independent Codex review/fixes and acceptance**. No Slice10 PASS or Slice11 work.

## Static review disposition

Independent GPT-6.1 Sol High CLI review returned one P2 finding: exclusive parent locks would serialize unrelated learners within a Course. Codex changed the proposal to shared Course/Context/Lesson parent locks, retained per-actor and consumption-row serialization, and added the required later concurrency proof. [Original review and resolution](evidence/slice-10/consumption-design-review.md). No second independent design review was run. Subsequent approved SQL/Prisma validation and apply are recorded above.

Codex design verdict: **APPROVED; MIGRATION APPLIED/VERIFIED DEV**. Application implementation, local gates and exact Ready public acceptance PASS; see `slice-10-verification.md`.

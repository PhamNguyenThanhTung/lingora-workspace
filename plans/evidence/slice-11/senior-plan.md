**SLICE 11: FAIL — product decisions remain unresolved; do not dispatch Anti yet.**

No blocking schema gap was established. The existing model supports graded Practice attempts without a migration. No files changed, tests ran, delegation occurred, or real environment/provider/database access occurred. HEAD is `b86ddc6`; the four unrelated workspace changes remain intact. Exact model/effort routing could not be independently attested within this turn.

**Confirmed physical and product contracts**

| Concern | Actual contract |
|---|---|
| Attempt identity | `app.lesson_attempts`: context, logical Lesson, exact LessonRevision, server timestamps and N. Learner ownership derives through LearningContext. No status column: `completedAt IS NULL` means open. |
| Cardinality | Multiple attempts per context/Lesson/revision are permitted. There is no unique “one open attempt” constraint. Redo creates another attempt. |
| Response identity | `app.lesson_responses`: exact attempt/revision and LessonExercise/revision composite FKs. The exercise pins its exact ItemRevision. |
| Response uniqueness | Unique `(attemptId, exerciseId, ordinal)`, `(attemptId, operationKey)` and `(attemptId, queuePosition)`. Ordinal is 1 or 2. |
| Completion | `app.lesson_completions`: unique `(contextId, lessonId)`, retaining the first completed attempt through a composite FK. Replacement and redo preserve this fact. |
| Result storage | Practice has no separate Result table. Completed performance lives in LessonAttempt summaries plus immutable LessonResponses. |
| Deletion/history | These relations use RESTRICT/NO ACTION. Responses reject UPDATE and DELETE even while their attempt remains open. Completions reject UPDATE/DELETE. Completed attempts reject deletion and changes to finalized facts. |

Sources: [active schema:561](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/schema.prisma:561), [response guards:1813](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027000000_product_baseline/migration.sql:1813), [completion immutability:565](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027010000_product_finalize/migration.sql:565), [completed-attempt guard:568](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027020000_product_correction/migration.sql:568).

The queue and scoring are already determined:

- N is the exact revision’s **core** Practice membership; N must be positive.
- Process first responses in exercise order. First-wrong exercises join the queue’s end in their original response order, each receiving exactly one retry.
- Contribution units are integer half-units: first correct **2**, first wrong **0**, retry correct **1**, retry wrong **0**.
- After N first responses and K required retries, performance is `contributionUnits / (2 × (N + K))`.
- Completion requires valid processing and successful persistence, regardless of score. Missing responses prevent finalization.
- Latest completed performance is primary, ordered `completedAt DESC, id DESC`. No 80% threshold or best-score completion rule.
- Submitted responses are immutable events. Users may edit an unsent local input; a committed answer cannot become a mutable draft.

Sources: [ADR-036:377](/home/tung/workspace/school/project1/lingora-workspace/logs/decision-log.md:377), [physical contract:96](/home/tung/workspace/school/project1/lingora-workspace/docs/design/physical/README.md:96), [queue/finalization:189](/home/tung/workspace/school/project1/lingora-workspace/docs/design/physical/README.md:189).

**Decisions required before implementation**

1. **FILL_BLANK/GRAMMAR normalization is unspecified.**

   Authoring stores trimmed accepted answers and requires `caseSensitive`. It does not define learner-input trimming, Unicode normalization, whitespace collapsing, punctuation handling, or the exact case-insensitive comparison algorithm. Vocabulary normalization is a separate contract and cannot be reused as grading authority.

   Evidence: [FILL_BLANK:188](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/server/lessons/content.ts:188), [GRAMMAR:300](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/server/lessons/content.ts:300), [accepted authoring scope:48](/home/tung/workspace/school/project1/lingora-workspace/plans/2026-10-30-slice-6-exercises-vocabulary-media.md:48).

   Minimal proposal for explicit approval: compare both strings after `trim()`; use exact comparison when case-sensitive and `toLowerCase()` comparison otherwise; preserve Unicode code-point distinctions, internal whitespace, punctuation and accents. No fuzzy matching. **This proposal is not an existing accepted rule.**

2. **Completion side-effect scope needs reconciliation.**

   Canonical completion automatically enrolls core vocabulary, preserving existing cards; the physical finalizer also records qualifying local date/timezone and commits enrollment atomically. The new task excludes SRS scheduling and streak. New-card enrollment necessarily initializes a due date, so Anti must not decide whether that exclusion also defers enrollment.

   Evidence: [requirements:32](/home/tung/workspace/school/project1/lingora-workspace/docs/02-requirements.md:32), [UC-06:175](/home/tung/workspace/school/project1/lingora-workspace/docs/use-case-specifications.md:175), [atomic finalizer:191](/home/tung/workspace/school/project1/lingora-workspace/docs/design/physical/README.md:191).

   Minimal decision: either include canonical core enrollment only—without review sessions, rescheduling or streak UI—or explicitly defer enrollment for Slice11. Regardless, existing completion CHECKs require truthful qualifying date/timezone fields; omitting them requires a migration and is not authorized.

3. **The remaining stale-attempt boundary needs an explicit choice.**

   Already determined: a stale X attempt cannot create a **new first completion** after Y wins publication; retain X open and its responses, with no completed performance/completion side effects. An authorized identical retry of an already committed finalization must replay before checking today’s pointer.

   Not expressly determined: new response writes after replacement, and finalizing an unfinished X **redo when logical completion already exists**. Canonical wording specifically scopes its active-revision restriction to a new first completion.

   Evidence: [physical contract:96](/home/tung/workspace/school/project1/lingora-workspace/docs/design/physical/README.md:96), [finalization race:191](/home/tung/workspace/school/project1/lingora-workspace/docs/design/physical/README.md:191).

   Minimal proposal for approval: reject every new stale response and every uncommitted stale finalization, including redo, with `409 PUBLICATION_CHANGED`; preserve authorized committed-operation replay. Never repin X to Y.

**Five grader contracts**

| Type | Determined semantics |
|---|---|
| MCQ | Single existing opaque option ID, compared with private `correctOptionId`. |
| LISTENING | Same option-ID grading as MCQ. Audio is presentation; transcript remains private. |
| REORDER | Exact ordered permutation of token IDs against private `correctOrder`; repeated display text is allowed. |
| FILL_BLANK | Membership in private accepted-answer list; normalization decision above blocks completion. |
| GRAMMAR | Same accepted-answer mechanism, using source sentence/target pattern as public prompts; no grammar engine. Same normalization blocker. |

Sources: [authoring schemas:146](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/server/lessons/content.ts:146), [permutation validation:360](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/server/lessons/content.ts:360).

Immediate server-derived Practice correctness is canonical. Return fixed safe formative feedback; do not serialize private explanation/transcript/accepted answers merely because grading occurred.

**Concrete integration finding to include in the eventual package**

Successor authoring currently rejects a predecessor with attempts: `unsupportedChildren()` returns true whenever `_count.attempts > 0`, including when copying a frozen PUBLISHED predecessor. Thus starting Slice11 attempts can prevent supported creation of Y from X.

Evidence: [snapshot.ts:41](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/server/lessons/snapshot.ts:41), [successor-save call:1886](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/server/lessons/index.ts:1886).

Minimal implementation repair: allow retained attempts when copying an eligible frozen predecessor into a new revision; retain rejection for in-place editable content. Preserve every predecessor row and pin. Add real save→submit→publish regression coverage with X already attempted.

**Implementation boundaries once decisions are recorded**

Use **one coupled Anti package**, sequential DAG:

`approved decisions → DTO/grader + lifecycle → routes/player + successor repair → source/component/DB/browser evidence → Codex independent acceptance`

Ownership: learner lesson server modules, scoped learner routes, existing player, focused tests/package scripts, and the narrow staff successor-copy fix. No schema/migration, unrelated files or Slice12.

Existing safe projections already whitelist public prompt fields and exclude grading secrets: [publicExercise:21](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/server/lessons/content.ts:21), [detail query:99](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/server/lessons/service.ts:99). Keep private grader reads server-only and separate from generic content reads. Enforce PRACTICE through `ItemIdentity.origin`, not a client kind.

For start idempotency, the existing attempt UUID PK can serve as a client-generated operation identity: replay the same UUID only after ownership and immutable-input checks; a deliberate new UUID creates another attempt. This is an implementation proposal, avoiding a new START receipt enum or migration. Responses use existing operation key/hash. Finalization can use `COMPLETE_LESSON` receipts and the attempt’s completion key, atomically.

Lock against **actual runtime behavior**: the publisher locks Lesson before review/revision; it does not lock Course. Preserve the accepted S10 order:

`Account NO KEY UPDATE → Course SHARE → Context SHARE → Lesson SHARE → Attempt UPDATE`

Re-read authorization, access and publication after locks at READ COMMITTED. Course SHARE alone cannot serialize publication; Lesson SHARE is essential. Do not upgrade shared parent locks after acquiring Attempt. Finalization must verify the entire persisted queue, recompute summaries, and atomically write its approved side effects and receipt.

Sources: [publisher:1261](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/server/lessons/workflow.ts:1261), [accepted S10 locking:79](/home/tung/workspace/school/project1/lingora-workspace/plans/2026-11-01-slice-10-consumption-design.md:79).

Existing progression already reads `LessonCompletion`; writing genuine completion will unlock eligible successors through that resolver. Do not advance working Level or add an unlock engine. Consumption remains independent. [Resolver:43](/home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/server/lessons/service.ts:43).

Required acceptance must cover actual production callbacks/routes, five graders, ownership/purpose attacks, response ordering/replays, double starts/finalizes, concurrent response/finalize races, publisher-first/finalizer-first outcomes, committed replay after Y, rollback of partial finalization, successor authoring, and S10 regressions. Use an owned local PostgreSQL with the actual relevant applied guards; the current S10 fixture inserts children after publication and cannot establish full graded-guard fidelity unchanged.

Run semantic mutations A–I against real source, require meaningful kills and byte-exact restoration. Then feature/component/integration gates, typecheck/build, serialized DTO/client scans, and exact-commit public browser plus read-only DB evidence.

Public cleanup must **allowlist immutable graded history and its FK ancestors**. Response-bearing attempts and completed evidence cannot be routinely deleted. Restore owned staff/content availability, remove sessions and close owned browser contexts; never disable guards to obtain residue zero.

**Next step:** record the three decisions above, then root can finish the executable implementation spec. No migration proposal is warranted from the findings established here.
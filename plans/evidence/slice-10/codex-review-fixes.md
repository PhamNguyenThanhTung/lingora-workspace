# Codex review and direct fixes

Independent GPT-6.1 Sol High CLI review: [REQUEST_CHANGES with six findings](implementation-review.md), against Anti's initial source before Codex fixes. Exact model/effort were routed through `codex exec --ephemeral --sandbox read-only -m gpt-6.1-sol -c model_reasoning_effort=high`. No second specialist review is claimed.

Codex also added ten regressions and ran them against the handoff: **0/10 PASS, 10/10 FAIL**. All ten then passed after direct fixes; original23 route cases remained green.

1. One owned-context/access/hierarchy resolver now serves catalogue, detail, reading GET and mutations. It checks Course/language/framework/Unit/publication/Level consistently, including null working Level. Only eligible published required predecessors participate in canonical LessonCompletion gating.
2. Mutation locks Account, shared Course→Context→Lesson, then re-reads all authoritative context/Course scope/status. Candidate Course identity changes fail closed. No production mock/lock/clock fallback remains.
3. Start uses explicit post-lock database timestamps for started/created/updated, conflict-safe SQL insert and locked re-read. Completion gets the DB clock after its row lock; duplicate returns never change provenance/version. Publication precondition precedes all writes/no-ops.
4. Learner queries select safe fields; exact child identity checks and per-type public JSON projections exclude private/unknown fields. Vocabulary remains its exact displaySnapshot. Public HTTPS audio contract is checked without server fetch.
5. Player state remounts by context/Lesson/revision/server reading version. The browser harness now models Next refresh preserving the document and component state. New stale→reload→Y-start test passes; Y never inherits X reading state. Pending/network/session/disabled failures and real retry are exercised. Duplicate radio IDs across exercises fixed.
6. The initial handwritten SQL concurrency imitation was replaced by a separate explicit integration gate invoking the production Prisma mutation service. It requires an owned, loopback-only disposable DB and never loads real env. Ordinary feature tests do not silently substitute or skip DB integration.

**Production service PostgreSQL17.11 integration:7/7 PASS**, no skips: simultaneous starts/completes/idempotency, two independent learners holding shared parent locks while publisher conflicts, earlier-begun completion behind later start, completion clock after competing row lock, consumption-only identity freeze with first-start contention, context reassignment winning before locks, completed-X stale retry/Y independence. The isolated database uses Prisma-generated parent mappings plus the exact approved consumption SQL and identity trigger; it is not a replay/claim about every historical graded trigger. Full DEV catalog verification is separate. Cluster data removed after run.

Feature regressions also cover competing latest Lesson/ItemRevision/Vocabulary data, safe query projections, explicit completed-X stale no-op conflict, fresh transactional ACTIVE guard, earlier-Level review and optional predecessors. No graded implementation or Slice11 was added.

Final local mutation/gate and public results are recorded separately; this review artifact alone is not feature acceptance.

**Verdict: REQUEST_CHANGES — one actionable design finding.**

The proposal creates separate reading history per owned context and exact published revision. It preserves graded completion, retains earlier revision history, and performs no backfill. The model is appropriately small.

1. **P2 — Parent locks unnecessarily serialize unrelated learners.**
   [Design, line 83](/home/tung/workspace/school/project1/lingora-workspace/plans/2026-11-01-slice-10-consumption-design.md:83) requires Course `FOR NO KEY UPDATE`, then Context and Lesson `FOR UPDATE`, although consumption only reads these rows.

   Two learners starting different lessons in the same Course must therefore execute serially. If the first transaction waits on a downstream lock, it also holds up unrelated consumption requests throughout that Course.

   **Fix:** use row-level `FOR SHARE` on Course → Context → Lesson, preserving the order and all post-lock rechecks. Keep the accepted Account lock, unique conflict-safe insertion, and exclusive locking of the specific consumption row being changed. Shared parent locks remain mutually compatible while conflicting with publisher/CRUD updates and context reassignment. This follows [PostgreSQL’s row-lock compatibility rules](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS).

   Add a later concurrency acceptance case demonstrating that different learners’ consumption transactions can hold these parent locks concurrently, while publication and context reassignment still wait.

**Other review conclusions**

- **Ownership and revision identity:** the composite revision/Lesson FK, context-leading uniqueness, server ownership checks, and existing identity-guard extension fit the proposed boundary. Course ownership remains a mandatory server check.
- **Republish and idempotency:** checking publication before either writes or idempotent returns correctly prevents stale X requests from targeting Y. Retaining X without overwriting official `LessonCompletion` is sound.
- **SQL/Prisma alignment:** fields, nullability, defaults, FK actions, uniqueness and indexes align statically. Derived states and service-owned monotonic transitions are consistent with Backend-First validation.
- **Timestamps/version:** the post-lock database clock and explicit `updatedAt` assignment address the identified waiting-transaction problem. Implementation must supply that timestamp for all changed fields and preserve timestamps/version on no-ops.
- **Security:** the design correctly acknowledges that FORCE RLS does not constrain the current BYPASSRLS server role. Direct-client denial and mandatory server authorization are accurately distinguished; no broader auth/RLS retrofit is required here.
- **Context protection and rollback:** extending the existing guard covers consumption-only history. The rollback’s ACCESS EXCLUSIVE lock before checking emptiness, `row_security=off`, transactional guard restoration and RESTRICT drop address the identified history-loss risks.
- **Actual publication locking:** the design accurately describes Admin → Lesson → review/revision, without claiming an implemented Course lock or globally frozen curriculum snapshot.

**Remaining product decision**

The user must explicitly accept the consequence at [design line 56](/home/tung/workspace/school/project1/lingora-workspace/plans/2026-11-01-slice-10-consumption-design.md:56): marking reading complete does **not** unlock the next sequential lesson or Level. Alternatively, select and specify a separate reading-sequence policy before implementation.

**Scope and limitations:** reviewed the four named artifacts against baseline `f71fdf7`, relevant schema/source, and supplied read-only metadata. This was static review only: no tests, SQL/Prisma execution, credentials, database access, edits, deployment or commits. The drafts are neither execution-validated nor approved/applied. Whole Slice 10 remains unaccepted.
## Codex resolution — 2026-11-01

The P2 finding is resolved in the draft design: Course → Context → Lesson use FOR SHARE, with the same post-lock checks, per-actor lock, unique conflict-safe insertion and exclusive lock only on the consumption row being updated. Proposed concurrency acceptance now explicitly covers different learners holding parent locks concurrently, and publication/context writers waiting. No SQL/runtime execution or additional independent re-review occurred.

Parent also verified finite/chronological timestamp constraints, post-lock clock_timestamp with explicit updatedAt, and rollback fail-closed emptiness under ACCESS EXCLUSIVE + row_security=off. Draft artifacts contained no known private env values in the scoped static scan.

Final Codex verdict: READY FOR USER REVIEW; model/access/migration approval remains pending. SQL/Prisma validation, apply, implementation and whole Slice 10 acceptance remain unperformed.

Routing note: the initial collaboration reviewer remained pending_init and was interrupted before execution. The actual independent pass used codex exec with model gpt-6.1-sol, reasoning effort high, read-only sandbox, approval never and ephemeral session. The output above is that actual pass; no substitute-model or duplicate review is claimed.

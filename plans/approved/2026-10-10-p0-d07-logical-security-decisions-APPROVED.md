# P0-D07 Logical Product and Security Decision Record

**Status:** APPROVED — documentation-only task
**Approval evidence:** The user explicitly approved the seven decision packages in the 2026-10-10 task message and directed Codex to record P0-D07 as resolved at the logical product/security target level, state physical/live-database questions as deferred, and reassess Diagram Readiness. This authorization does not approve physical schema or implementation.

## Scope

Record the approved logical decisions in a new ADR, mark P0-D07 `RESOLVED — LOGICAL PRODUCT/SECURITY TARGET ONLY`, align current-facing authority notes and use-case clauses, assess diagram readiness, and set the next permitted task to **Full CURRENT + TARGET Modeling Review** if no business-level blocker remains.

The seven approved decision packages are:

1. **Role and identity:** `auth.uid()` is the trusted subject. Role and account status are server-controlled; client-supplied role/user IDs are untrusted. Authorization runs at trusted server boundaries and appropriate RLS. Disabled accounts are denied from the next request even with an unexpired session/token. Ambiguous legacy roles require deliberate review and migration; no blanket mapping to the three business roles.
2. **Assignment and authorship:** One MVP assignment covers one Lesson/content package and related exercise/assessment items, with one responsible Teacher at a time. Admin defines requirements, scope, checklist and assignment but does not author content. Teacher authors/edits only assigned content. Reassignment preserves attribution/history. Use only a minimal optimistic version/concurrency check; no collaboration/project-management subsystem.
3. **Content lifecycle:** Keep assignment and content lifecycles separate. Logical content states are Draft → In Review → Changes Requested / Approved → Published → Archived/Withdrawn. Teacher edits only Draft or Changes Requested. Approved/Published content is immutable in place; published changes use a new revision and repeat review/approval. Switch the active version atomically only after successful publication; on failure the existing version remains active. Do not hard-delete content referenced by learner progress. MVP publication unit is Lesson/revision. Unit/Course visibility derives from curriculum blueprint/eligibility; no all-Unit publication transaction.
4. **Assessment and answer secrecy:** Placement, Level-up and Reassessment are distinct purposes sharing security invariants. Grading is server-authoritative; generic content reads never return answer keys. An invalid/unsubmitted attempt creates no completed Result. Cross-session resume is not required in MVP. Retrying the same submission is idempotent; an intentional new attempt creates new result/evidence. Placement/Level-up/Reassessment expose no per-item correctness during an attempt and after submission expose only required aggregate result/pass/recommendation, never keys or per-item solutions. Ordinary lesson practice may provide learning feedback under its separate flow.
5. **SRS:** Retain already-approved Policy B; do not switch to SM-2/FSRS. Client submits card identity and valid self-rating only; trusted server/RPC computes stage, interval and due date. Client interval/probability is never authoritative. Retry of the same review operation is idempotent; an intentional re-review is a new operation. Pausing a LearningContext does not pause global SRS. A recorded legitimate SRS review continues to qualify for streak under the controlling ADR.
6. **Audit:** Minimum events cover account provision/disable/enable/role change; assignment/reassignment; submit/request changes/approve/publish/archive/withdraw/replacement; assessment configuration changes; and denied sensitive privileged actions. Events carry actor, action, target/version, server timestamp, outcome, and reason when policy requires it. Security audit is logically append-only and separate from workflow/content history. Admin can read security audit in MVP. Never log passwords, tokens, or answer secrets. Retention/anonymization duration is deferred to NFR/implementation design and does not block P0-D07.
7. **Database reconciliation:** Neither Prisma nor an individual migration is product authority. Before implementation/migration, perform a read-only live database inspection against Prisma, migration history, role distribution, grants, RLS/policies and RPCs. Never rewrite historical migrations. After logical approval, create a forward-migration strategy. Preserve IDs, progress, attribution and history; do not auto-convert ambiguous role data.

## Permitted files/actions

- Add ADR-035 to `logs/decision-log.md`.
- Update the P0 decision queue in `plans/master-implementation-and-report-plan.md`.
- Align authority/status wording in `docs/QUICK-REF.md`, `docs/README.md`, `docs/01-architecture.md`, `docs/02-requirements.md`, `docs/04-data-model.md`, `docs/05-traceability-matrix.md`, and `docs/use-case-specifications.md`.
- Update `plans/current-task.md`, `HANDOFF.md`, task indexes as needed, and append observed documentation-task evidence to `logs/development-log.md` and `logs/test-log.md`.
- State Diagram Readiness and nominate the next task; do not begin that next task here.

## Explicit exclusions and deferred questions

- No source/runtime, API, schema, Prisma, SQL migration, seed, live database, generated artifact, or diagram-file changes.
- No physical table/column/enum/claim/policy/RPC selection and no migration authorization.
- Do not modify prior ADRs or historical artifacts; ADR-035 only supersedes conflicting statements within its logical product/security scope.
- Do not authorize implementation. Resolve deployment/current-state facts in **Full CURRENT + TARGET Modeling Review** before any diagram relying on them or implementation planning.
- Any newly discovered business-level conflict outside the seven approved packages must remain open and be reported; do not decide it in this task.

## Dependencies and acceptance

- Authority: `AGENTS.md`, `docs/README.md`, `docs/QUICK-REF.md`, `HANDOFF.md`, the current P0 queue, ADR-030–034, current use cases and requirements, and the user's 2026-10-10 approval message.
- P0-D07 is resolved only if ADR-035 records the approved logical policies, the queue and current authority pointers agree, and all remaining open questions are clearly physical/live-database or separately scoped.
- Diagram readiness must distinguish business-policy readiness from unverified physical/current deployment facts. If no business blocker remains, the next task is exactly **Full CURRENT + TARGET Modeling Review**; no implementation may precede it.
- Verification: static authority assertions over the changed records, archive/snapshot integrity checks, `git diff --check`, and final Git status/diff review. Runtime tests are N/A because behavior/code is untouched.


# Physical Data & Runtime Design + Database Rebuild Plan

**Status:** APPROVED
**Date:** 2026-10-11
**Scope authorization:** Direct PO request authorizes inspection and documentation of a proposed physical/runtime design and future database rebuild plan. This approves doing the design task only; it does not approve the resulting design or implementation.
**Request:** `plans/approved/2026-10-11-physical-data-runtime-design-REQUEST.txt`
**Baseline:** `plans/approved/2026-10-11-physical-data-runtime-design-BASELINE.json`
**Design classification:** PROPOSED PHYSICAL DESIGN — NOT IMPLEMENTED.

## PLAN

**Goal:** Map approved DOM-01/DATA-03 and ADR-030–036 to a reviewable physical schema, auth/RLS/runtime boundary, transaction/idempotency plan, physical ERD, and conditional clean-rebuild recommendation.
**Authority:** Latest PO instructions → ADR-036 → compatible ADR-030–035 → active requirements → active UCs → traceability → approved logical modeling → proposed physical design. CURRENT artifacts are legacy evidence only. PO now permits proposing clean rebuild despite prior forward-migration preference; destructive execution remains prohibited.
**Dependencies:** Approved modeling verdict; inspected Prisma/three ordered migrations/auth/environment/storage/seed/security scripts. Live metadata only when valid credentials are available. Missing credentials gives LIVE DB UNVERIFIED and does not block design.
**Permitted writes:** `docs/design/physical/` (four cohesive Markdown documents, physical-erd.puml and rendered SVG/PNG, verification/review evidence and a local documentation verifier); `plans/current-task.md`, new matching approved/request/baseline/archive records and plan indexes; task-pointer paragraph in `docs/QUICK-REF.md`, new proposed-design index in `docs/README.md`, `HANDOFF.md`; append-only development/test/decision logs. Technical choices recorded as PROPOSED, never ACCEPTED.
**Excluded writes/actions:** Application code, dependencies, Prisma, migrations, RLS SQL, seed scripts, approved logical diagrams/rendered artifacts, historical approval/archive records; no live mutation/upload/deploy, no stage/commit. Do not run old security/seed tests because they create/delete data. Preserve baseline files outside the allowlist and the existing Git index.

## Work sequence

- [ ] Audit repository implementation and configuration with source/file references; probe conventional credential availability without exposing values; metadata-only read-only DB transaction if configured.
- [ ] Compare normal physical choices: Unit table vs embedded groups, response events vs summarized outcomes, immutable item revisions vs copied snapshots, forward migration vs clean rebuild. Select technical proposals without changing product semantics.
- [ ] Write physical catalog with types/nullability/PK/FK/delete rules/checks/uniques/ownership/provenance, logical mapping, auth and security matrix, query/index rationale, transaction/idempotency/concurrency boundaries, Prisma mapping, preservation/rebuild and future acceptance tests.
- [ ] Create independent physical ERD; render SVG/PNG and inspect legibility. Do not alter DATA-03.
- [ ] Independent read-only design review after first pass; resolve local design defects and record review findings/fixes. No Antigravity invocation tool is available in this session; Codex performs the documentation first pass and a separate reviewer supplies independence.
- [ ] Run link/catalog/source/role/purpose/invariant scans, diagram render checks, baseline/scope checks and `git diff --check`; record observed evidence and final verdict.
- [ ] Update task/pointers/logs and preserve DONE archive. STOP at PHYSICAL DESIGN READY FOR REVIEW if all checks pass; next task FINAL PHYSICAL DESIGN REVIEW. No implementation plan/subtasks are approved here.

## REVIEW / APPROVE

This is a bounded documentation deliverable under the explicit user authorization. Architectural choices remain proposals for the next review. The required future rebuild steps are an execution outline, not an implementation plan or permission to execute. The supplied 71-section request defines acceptance and constraints in detail, so no additional scope confirmation is needed. No product contradiction has been identified at entry. Preserve historical ADRs; latest PO authorization supersedes ADR-035's forward-only preference only for proposing a rebuild and subject to preservation/rollback preconditions.

## Verification and acceptance

1. Every proposed table appears in catalog, schema detail and physical ERD; every FK endpoint exists, optionality and delete behavior are deliberate; logical derived concepts stay derived.
2. Three roles, ACTIVE/DISABLED accounts, ACTIVE/PAUSED contexts; configured assessments, no active Reassessment, no A1/question-count/100% platform invariant; exact N/K and SRS Policy B preserved; no AI runtime.
3. Link checks and physical render syntax/freshness/hashes; manually inspect the final physical diagram(s). Independent review covers integrity/security/history/query patterns/idempotency/transactions/overengineering.
4. Verify all baseline files outside permitted scope unchanged, canonical modeling hashes unchanged, HEAD/index unchanged, log prefixes preserved. Run `git diff --check`, attach diffstat and new-file line counts.
5. Current design verdict must be PHYSICAL DESIGN READY FOR REVIEW, NEEDS PHYSICAL CORRECTION, NEEDS PO DECISION or BLOCKED. Never PHYSICAL DESIGN APPROVED. Live DB and preservation unknowns clearly labeled, execution preconditions remain explicit.

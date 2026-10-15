# Task: Record Approved P0-D04 Domain Decision

## Status

`DONE` — documentation/control files only
- `TASK = p0-d04-domain-decision-record`
- `PLAN STATUS = DIRECT USER AUTHORIZATION (2026-10-08)`
- `HUMAN APPROVAL = USER REQUEST ACCEPTING P0-D04 WITH THREE CLARIFICATIONS`
- `REVIEW = PASS (2026-10-08; authority and scope reconciliation)`
- `VERIFICATION = PASS (2026-10-08; static assertions and git diff --check)`
- `APPROVED SNAPSHOT = NOT REQUIRED; direct bounded documentation-only user authorization recorded here`
- `PRODUCT IMPLEMENTATION = NOT AUTHORIZED`
- `DECISION STATUS = ACCEPTED FOR DOMAIN SCOPE; P0-D03 AND OTHER DECISIONS REMAIN OPEN`
- `COMMIT = NOT CREATED`

## Objective

Record the user-approved P0-D04 shared-curriculum domain decision and its three MVP clarifications in the existing authority chain. Keep current implementation/physical schema state distinct from accepted domain policy.

## Approved Scope

- Update only `plans/current-task.md`, `logs/decision-log.md`, `plans/master-implementation-and-report-plan.md`, `docs/QUICK-REF.md`, `docs/README.md`, `docs/01-architecture.md`, `docs/04-data-model.md`, `HANDOFF.md`, `logs/development-log.md`, and `logs/test-log.md` as required to record and index the decision and task evidence.
- Record that each user has at most one `LearningContext` per learned `Language` in MVP; this does not decide all context persistence/ownership details assigned to P0-D03.
- Record one shared/core `Course` per learnable `Language` in MVP as a business convention, not a permanent schema invariant; allow a future independent syllabus to justify an additional Course.
- Record `LearningPlan` as a deterministic domain concept/result, with persistence deferred unless editing, exact resume, or audit-history requirements arise.
- Preserve the other accepted P0-D04 proposal terms exactly within their stated scope.
- Do not start P0-D03 or authorize product, schema, migration, seed, API, frontend, test, or application implementation.
- Preserve all pre-existing working-tree changes and historical design/decision evidence.

## Acceptance Criteria

1. `logs/decision-log.md` records P0-D04 as accepted and cites the user instruction as approval evidence.
2. The existing P0 queue, authority index, quick reference, architecture/data-model pointers, task pointer, and handoff agree on the decision status and scope.
3. Conflicts with earlier logical design are named without rewriting historical D3/D4 specifications or implying physical schema changes.
4. P0-D03 remains open and no product implementation is authorized.
5. `git diff --check` and static authority/status checks are recorded; application tests are N/A.

## Verification Plan

- Inspect the final diff and touched-file list; verify prohibited product/schema paths are untouched by this task.
- Run `git diff --check`.
- Search the entry and decision files for stale P0-D04 `OPEN` / unresolved claims and confirm P0-D03 remains open.
- Record observed documentation-only verification in the existing logs; no new file is required.

## Completion

Completed 2026-10-08. ADR-030 records the accepted P0-D04 domain decision; the P0 queue, quick reference, authority index, architecture/data-model authority notes, and handoff point to it. P0-D03 remains open; no product implementation or schema work was authorized. Verification and evidence are recorded in `logs/test-log.md` and `logs/development-log.md`.

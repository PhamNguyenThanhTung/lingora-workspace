# Task: Record Approved P0-D05 Placement and Starting-Point Policy

## Status

`DONE` — product/domain decision and control documentation only
- `TASK = p0-d05-placement-starting-point-policy`
- `PLAN STATUS = DIRECT USER AUTHORIZATION (2026-10-08)`
- `HUMAN APPROVAL = USER REQUEST ACCEPTING P0-D05 WITH TWENTY-THREE CLARIFICATIONS`
- `REVIEW = PASS (2026-10-08; scope and authority reconciliation)`
- `VERIFICATION = PASS (2026-10-08; static authority checks, archive hash, git diff --check)`
- `APPROVED SNAPSHOT = NOT REQUIRED; direct bounded documentation-only authorization recorded here`
- `DECISION STATUS = ACCEPTED FOR MVP PRODUCT/DOMAIN SCOPE ONLY`
- `PRODUCT IMPLEMENTATION = NOT AUTHORIZED`
- `P0-D06 = NOT STARTED`
- `COMMIT = NOT CREATED`

## Objective

Record the user's explicit acceptance of the P0-D05 Placement / Starting-Point Policy and reconcile the existing authority chain without modifying implementation or physical database state.

## Approved Scope

- Preserve the completed P0-D03 task record byte-for-byte at `plans/archive/2026-10-08-p0-d03-domain-decision-record-DONE.md`; use this file as the single current-task pointer.
- Record P0-D05 in `logs/decision-log.md` as an accepted product/domain decision, with the user instruction as approval evidence.
- Update existing decision backlog, Quick Reference, documentation authority index, Handoff, and required evidence logs to identify ADR-032 as the controlling MVP Placement policy.
- Keep the accepted policy limited to onboarding/diagnostic recommendation, three entry paths, framework-aware recommended starting level, distinct provenance for self-report/default/assessment, context-scoped evidence, immutable completed results, configurable assessment parameters, and no default permanent lock or lifetime quota.
- Mark D3 stage-adaptive diagnostic as deferred for MVP Placement; retain the D3 document and prior Mapping A approval as historical evidence and record their limited supersession scope in the authority index/ADR.
- Keep English configuration values unselected pending review. Do not begin P0-D06.
- Do not modify Prisma, migrations, seed, application code, frontend, API, or tests. Do not authorize product implementation.

## Acceptance Criteria

1. ADR-032 records P0-D05 as accepted only for the user's stated MVP domain scope.
2. The P0 queue, Quick Reference, documentation authority index, current task pointer, and Handoff agree that P0-D05 is resolved at product/domain level and implementation is not authorized.
3. Conflicting placement statements in the UC, D3, old placement specification, and roadmap are classified by their supersession/deferment scope; historical approvals and files remain intact.
4. English assessment configuration remains explicitly unselected; P0-D06 and P0-D07 retain their separate responsibilities.
5. No product, API, database, seed, frontend, or test implementation changes are made; P0-D06 is not started.

## Verification Plan

- Inspect final scoped diff and touched-file list; ensure prohibited product/schema paths are unchanged by this task.
- Verify ADR-032, P0-D05 `RESOLVED`, status of English configuration candidates, P0-D06/P0-D07 open status, implementation-not-authorized status, and authority pointers.
- Confirm the archived P0-D03 task is byte-identical to its pre-update task-pointer contents.
- Run `git diff --check` and record scoped diff-stat evidence.
- Application tests are N/A because this is a documentation/control-only task.

## Completion

Completed 2026-10-08. ADR-032 accepts P0-D05 for MVP product/domain policy only. The authority index, decision queue, Quick Reference, current task pointer, and Handoff identify ADR-032 as controlling. D3 stage-adaptive Placement is deferred for MVP; old English configuration values remain unselected, with Mapping A approval preserved as English-specific historical evidence. P0-D06 was not started. Product implementation and physical schema work remain unauthorized.

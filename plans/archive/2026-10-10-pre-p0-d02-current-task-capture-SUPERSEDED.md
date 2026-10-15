# Task: Record Approved P0-D06 Lesson Completion, Retry, Progression and Activity Policy

## Status

`DONE` — product/domain decision and authority reconciliation only
- `TASK = p0-d06-lesson-completion-progression-qualifying-activity`
- `PLAN STATUS = DIRECT USER AUTHORIZATION (2026-10-08)`
- `HUMAN APPROVAL = USER REQUEST ACCEPTING P0-D06 WITH SEVENTEEN CLARIFICATIONS`
- `REVIEW = PASS (2026-10-08; bounded domain scope and source reconciliation)`
- `VERIFICATION = PASS (2026-10-08; authority assertions, archive preservation, git diff --check)`
- `APPROVED SNAPSHOT = NOT REQUIRED; direct bounded documentation-only authorization recorded here`
- `DECISION STATUS = ACCEPTED FOR MVP PRODUCT/DOMAIN SCOPE ONLY`
- `PRODUCT IMPLEMENTATION = NOT AUTHORIZED`
- `P0-D07 = NOT STARTED`
- `COMMIT = NOT CREATED`

## Objective

Record the user's explicit acceptance of P0-D06 as a product/domain decision, reconcile the controlling authority pointers, preserve historical source records, and keep physical implementation decisions outside this scope.

## Approved scope

- Preserve the completed P0-D05 task record at `plans/archive/2026-10-08-p0-d05-placement-starting-point-policy-DONE.md`.
- Record the accepted D06 rules in ADR-033 in `logs/decision-log.md`.
- Update the existing P0 decision queue, Quick Reference, documentation authority index, current task pointer, Handoff, and evidence logs.
- Classify conflicting historical behavior within the exact scope superseded or deferred by ADR-033; retain original use-case, D3, M2.2, and English Jump/placement records unchanged.
- Keep physical score/performance representation, attempts, `Profile.dailyGoalMin`, database realization, runtime/display behavior, and other P0-D07 matters outside this decision unless ADR-033 explicitly records a domain distinction.
- Do not begin P0-D07. Do not modify Prisma, SQL migrations, seed, application code, frontend, API, or tests. Do not authorize product implementation.

## Acceptance criteria

1. ADR-033 records the user's stated D06 decisions and identifies their MVP domain-only scope.
2. The P0 queue, Quick Reference, documentation authority index, current task pointer, and Handoff agree that D06 is resolved and implementation is not authorized.
3. Conflicting completion, retry, progression, assessment, and streak rules are marked superseded/deferred only within D06 scope; source history remains intact.
4. English configuration values remain unselected unless explicitly approved; P0-D07 remains open and not started.
5. No product, API, database, seed, frontend, or test implementation changes are made.

## Verification plan

- Verify ADR-033 decision clauses, P0-D06 queue status, P0-D07 open status, and implementation-not-authorized pointers.
- Verify the archived P0-D05 task is byte-identical to the pre-update current-task pointer.
- Run static authority assertions and `git diff --check`; capture scoped `git diff --stat` and the archive line count.
- Application tests are N/A because this is a documentation/control-only task.

## Completion

Completed 2026-10-08. P0-D06 is accepted for its recorded MVP product/domain policy only. P0-D07 remains open and was not started. Product implementation and physical schema changes remain unauthorized.

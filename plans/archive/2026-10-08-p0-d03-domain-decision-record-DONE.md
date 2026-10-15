# Task: Record Approved P0-D03 Learner-State Ownership Decision

## Status

`DONE` — domain decision and control documentation only
- `TASK = p0-d03-domain-decision-record`
- `PLAN STATUS = DIRECT USER AUTHORIZATION (2026-10-08)`
- `HUMAN APPROVAL = USER REQUEST ACCEPTING P0-D03 DOMAIN DECISION WITH FOURTEEN CLARIFICATIONS`
- `REVIEW = PASS (2026-10-08; authority/scope reconciliation)`
- `VERIFICATION = PASS (2026-10-08; static authority checks, boundary check, archive hash, git diff --check)`
- `APPROVED SNAPSHOT = NOT REQUIRED; direct bounded documentation-only authorization recorded here`
- `DECISION STATUS = ACCEPTED FOR DOMAIN SCOPE ONLY`
- `PRODUCT IMPLEMENTATION = NOT AUTHORIZED`
- `COMMIT = NOT CREATED`

## Objective

Record the user's explicit acceptance of the P0-D03 independent learner-context and learner-state ownership proposal. Reconcile only the existing authority chain; preserve physical repository/database state and historical design evidence.

## Approved Scope

- Preserve the completed P0-D04 task record byte-for-byte at `plans/archive/2026-10-08-p0-d04-domain-decision-record-DONE.md` and use this file as the single current-task pointer.
- Record P0-D03 in `logs/decision-log.md` as an accepted domain decision, including the user's clarifications and explicit implementation boundary.
- Update the existing P0 backlog, Quick Reference, documentation authority index, architecture/data-model authority notes, Handoff, and evidence logs as required.
- State that `LearningContext` is keyed by `(User, learned Language)`, at most one per pair and at most two `ACTIVE` contexts in MVP; lifecycle is `ACTIVE`/`PAUSED`, without `COMPLETED` absent a later requirement.
- Record account-global versus context-owned state, evidence-derived proficiency, logical progress ownership without requiring a physical context FK, context-scoped assessment evidence, global SRS/streak, deterministic non-persisted-by-default `LearningPlan`, no MVP `Enrollment`, and simple context study preferences.
- Keep physical schema, role/FK target, placement behavior, progression behavior, and remaining database conflicts outside this decision.
- Do not modify Prisma, migrations, seed, application code, frontend, API, or tests. Do not begin P0-D05.

## Acceptance Criteria

1. `logs/decision-log.md` records P0-D03 as accepted for the explicitly approved domain scope and cites the user's instruction as approval evidence.
2. The P0 queue, Quick Reference, authority index, architecture/data-model notes, task pointer, and Handoff agree that P0-D03 is resolved at domain level only.
3. D3/M2.1 are indexed as superseded only where their ownership/persisted-`SkillProfile` assumptions conflict; their non-conflicting assessment and domain distinctions remain intact.
4. P0-D05, P0-D06, P0-D07, role-model questions, and physical schema/runtime verification remain open as applicable.
5. No product implementation or schema change is authorized.

## Verification Plan

- Inspect the final diff and touched-file list; ensure prohibited product/schema paths are untouched by this task.
- Run `git diff --check` and capture the scoped diff-stat evidence.
- Run static authority checks for ADR-031, P0-D03 `RESOLVED`, implementation-not-authorized status, and retained open P0-D05..D07.
- Confirm the archived P0-D04 task is byte-identical to its pre-update task-pointer contents.
- Application tests are N/A because this is a documentation/control-only task.

## Completion

Completed 2026-10-08. ADR-031 records P0-D03 as accepted for domain ownership only. The P0 queue, Quick Reference, authority index, architecture/data-model authority notes, current-task pointer, and Handoff agree on its scope. P0-D05 through P0-D07 remain unresolved; no product implementation or physical-schema work was authorized. Evidence is recorded in `logs/test-log.md` and `logs/development-log.md`.

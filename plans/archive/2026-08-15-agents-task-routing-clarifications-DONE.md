# Task

agents-task-routing-clarifications - Targeted AGENTS.md Workflow Improvements

## Status

DONE

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Parent Milestone

Infrastructure / Documentation - agent workflow clarification only.

## Immutable References

- Human-requested scope: conversation 2026-08-15
- Review finding: the proposed clarifications do not contradict the gated workflow.
- Previous active task preserved at
  `plans/archive/2026-08-15-public-snapshot-staging-REVIEW.md` for later continuation.

## Objective

Make four concise routing and reading clarifications in `AGENTS.md` without changing any other
workflow rule or modifying canonical project documentation.

## Files Expected To Change

- `AGENTS.md` - implementation, only after explicit human approval
- `plans/current-task.md` - task lifecycle only

The one-time preservation of the previous active task in `plans/archive/` is explicitly authorized
by the human before this task was created.

## Approved Scope For Review

1. Add a concise `## Task routing` section mapping:
   - Planning / milestone / priority to `docs/QUICK-REF.md` plus the relevant
     `docs/00-master-plan.md` section.
   - Architecture / stack / repository boundary to `docs/01-architecture.md`.
   - Requirements / scope to `docs/02-requirements.md`.
   - API work to `docs/03-api-contract.md`.
   - Database / RLS / migration work to `docs/04-data-model.md`.
   - Traceability to `docs/05-traceability-matrix.md`.
   - UI/UX to `DESIGN.md`.
   - Current-task or continuation work to `plans/current-task.md` and `HANDOFF.md` when applicable.
   - Documentation-only work to `plans/current-task.md` and `docs/QUICK-REF.md`, followed only by
     the affected canonical source.
2. Clarify that `HANDOFF.md` is read at the start of a new agent session or when resuming after a
   task gap, and is not reread unnecessarily during the same uninterrupted task/session.
3. Clarify that canonical documents are not read merely to reconfirm information already available
   in `docs/QUICK-REF.md`; read the canonical source only when the task requires its detail.
4. Fix the `docs/00-master-plan.md` routing wording so sections 0.4-0.5 are included when the listed
   conditions explicitly require them, rather than implying that only sections 0.1-0.3 may be read.

## Explicitly Out Of Scope

- Changing any other workflow rule in `AGENTS.md`
- Modifying `HANDOFF.md`, `docs/QUICK-REF.md`, canonical documents, logs, source code, migrations,
  database state, dependencies, or Git history
- Implementing before explicit human approval
- Committing or pushing

## Review

- Gated workflow: no contradiction. The changes affect document-selection efficiency only and do
  not alter PLAN, REVIEW, APPROVE, IMPLEMENT, TEST, LOG, or COMMIT gates.
- Source of truth: no authority changes. Canonical documents remain authoritative when their detail
  is required; `docs/QUICK-REF.md` remains the default concise project snapshot.
- Scope: implementation is limited to `AGENTS.md`; no canonical content or product behavior changes.
- Risk: wording must remain concise and must not weaken mandatory reads for the active task or
  applicable handoff state.

## Test Plan

1. Verify `git diff -- AGENTS.md` contains only the four approved clarification areas.
2. Verify the `## Task routing` section contains all nine requested mappings.
3. Verify HANDOFF wording includes both required read conditions and the no-unnecessary-reread rule.
4. Verify QUICK-REF wording prevents redundant canonical reads while retaining task-driven detail reads.
5. Verify master-plan wording correctly permits sections 0.1-0.5 according to the listed conditions.
6. Verify no files outside `AGENTS.md` and lifecycle-only `plans/current-task.md` change during
   implementation; preserve all unrelated pre-existing worktree changes.
7. Documentation-only evidence after implementation: record `git diff --stat` and relevant line checks.

## Approval

Status: APPROVED
  Approved by: Pham Nguyen Thanh Tung
  Date: 2026-08-15

## Review Re-entry

- Date: 2026-08-15
- category: `scope-ambiguity`
- Gap: The approved task requires the repository's TEST and LOG gates before `DONE`, but explicitly
  excludes `logs/test-log.md`, `logs/development-log.md`, and `HANDOFF.md`. The observed documentation
  checks pass, but recording evidence and closing the task would require files outside
  `Files Expected To Change`.
- Proposed amendment: allow lifecycle-only updates to `logs/test-log.md`, `logs/development-log.md`,
  `HANDOFF.md`, and `plans/current-task.md`; do not change `AGENTS.md` beyond the already approved diff.
  - Amendment decision: APPROVED by Pham Nguyen Thanh Tung on 2026-08-15.

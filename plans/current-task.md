# Task

docs-workflow — Quick-Ref + Agent Scope Workflow

## Status

DONE

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Parent Milestone

Infrastructure / Documentation — does not belong to a feature milestone (M1.x–M5). Approved as a standalone workflow-improvement task.

## Immutable References

- Baseline checkpoint: `d0e4276` (M1.3 DONE commit)
- Implementation plan: approved 2026-08-14 (human approval received in conversation)

## Objective

Create `docs/QUICK-REF.md` and update the "Source of truth" section of `AGENTS.md` so that agents read a concise 5 KB snapshot by default instead of the full 35 KB `00-master-plan.md`, reducing input-token cost per task by an estimated ~30 KB without losing correctness guarantees.

## Files Expected To Change

- `docs/QUICK-REF.md` — NEW
- `AGENTS.md` — MODIFY, Source of truth section only
- `plans/current-task.md` — lifecycle updates

No other file is authorized. Canonical docs `00`–`05`, logs, `.gitignore`, `.codex/`, `.agents/`, and all code are out of scope.

## Explicitly Out Of Scope

- Editing any canonical doc (`docs/00`–`docs/05`)
- Touching logs, `.gitignore`, `.codex/`, `.agents/`, code, migrations, dependencies
- Committing — user decides when to commit

## Test Plan

1. `docs/QUICK-REF.md` exists and is ≤ 250 lines.
2. Every fact in QUICK-REF is consistent with the canonical source cited.
3. Every pointer (`docs/XX-*.md`) resolves to a real file in the repo.
4. `AGENTS.md` diff shows only the "Source of truth" section changed; all other bytes are identical.
5. No canonical doc, log, or code file is modified (`git diff --name-only` check).

## Approval

Status: APPROVED
Approved by: Human product owner
Date: 2026-08-14

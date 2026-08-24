# Task

agent-workflow-hardening - 6 Agent Workflow Improvements

## Status

DONE

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Parent Milestone

Infrastructure / Documentation - standalone workflow-improvement task.

## Immutable References

- Approved plan: conversation 2026-08-14, 4 review rounds
- Baseline: commit `46130d5` (docs: add quick project reference for agents)

## Objective

Harden AGENTS.md with 6 structural improvements: Stop Rules checklist, LINGORA-DEBT comment
convention, .agents/.codex hierarchy rule, HANDOFF.md session handoff, REVIEW escalation rule
with category tags, and evidence-backed PASS requirement. Create HANDOFF.md at repo root.

## Files Expected To Change

- `AGENTS.md` - MODIFY, 7 sections
- `HANDOFF.md` - NEW at repo root
- `plans/current-task.md` - lifecycle

No canonical docs (docs/00-05), logs, code, migrations, .gitignore, .codex/, or .agents/ modified.

## Explicitly Out Of Scope

- Editing any canonical doc, log, code, migration, dependency
- Committing - user decides

## Test Plan

1. `AGENTS.md` diff: exactly 7 sections changed, no other lines modified.
2. `HANDOFF.md` exists at repo root, <= 60 lines.
3. All file pointers in `HANDOFF.md` resolve to real files.
4. `git status` shows exactly 3 files changed.
5. Evidence: `git diff --stat` attached (docs-only -> N/A verdict with stat output).

## Approval

Status: APPROVED
Approved by: Human product owner
Date: 2026-08-14

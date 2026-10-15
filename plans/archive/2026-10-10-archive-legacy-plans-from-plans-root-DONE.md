# Current Task — Archive Legacy Plan Files from Plans Root

**Status:** DONE
**Approval:** User explicit instruction (2026-10-10) authorizes bounded documentation-only task: execute Step 1 of documentation cleanup (move 9 stale/superseded plan files from `plans/` root to `plans/archive/` and document specific rationales for each). AGENTS.md permits direct authorization of documentation-only tasks by explicit user instruction. Zero application source, API, Prisma, migration, seed, RLS/RPC or DB data changes.
**Prior task:** Clean Rebuild of Lingora Diagram Artifacts is DONE (`plans/archive/2026-10-10-clean-rebuild-diagram-artifacts-DONE.md`).

## Scope and permitted files/actions

1. Move 9 stale/superseded plan files from `plans/` root to `plans/archive/`:
   - `plans/m2-2-behavior-uc-activity-state-plan.md` -> `plans/archive/2026-09-22-m2-2-behavior-uc-activity-state-plan-HISTORICAL.md`
   - `plans/m2-3-sequence-api-service-boundary-plan.md` -> `plans/archive/2026-09-23-m2-3-sequence-api-service-boundary-plan-HISTORICAL.md`
   - `plans/m2-4-architecture-security-plan.md` -> `plans/archive/2026-09-23-m2-4-architecture-security-plan-HISTORICAL.md`
   - `plans/m2-5-design-validation-plan.md` -> `plans/archive/2026-09-26-m2-5-design-validation-plan-HISTORICAL.md`
   - `plans/m2-6-design-handoff-plan.md` -> `plans/archive/2026-09-26-m2-6-design-handoff-plan-HISTORICAL.md`
   - `plans/phase-0-fix-plan.md` -> `plans/archive/2026-09-20-phase-0-fix-plan-HISTORICAL.md`
   - `plans/phase-0-presentation-fix-plan.md` -> `plans/archive/2026-09-20-phase-0-presentation-fix-plan-HISTORICAL.md`
   - `plans/phase-0-tai-lieu-requirements-fix-plan.md` -> `plans/archive/2026-09-20-phase-0-tai-lieu-requirements-fix-plan-HISTORICAL.md`
   - `plans/phase-0-user-research-analysis-and-requirements-writing-plan.md` -> `plans/archive/2026-08-23-phase-0-user-research-analysis-and-requirements-writing-plan-HISTORICAL.md`
2. Update `plans/archive/README.md` to document the newly archived historical plans.
3. Verify `plans/` root contains only `current-task.md` and `master-implementation-and-report-plan.md`.
4. Verify `git diff --check` passes cleanly.
5. Update `logs/development-log.md`, `logs/test-log.md`, and `HANDOFF.md`.

## Out of scope

No application source, API, dependency manifest, Prisma, migration, seed, RLS/RPC or DB data changes; no deletion of history (all 9 files preserved in `plans/archive/`).

## Work and acceptance

- [x] Move 9 files to `plans/archive/` with canonical historical names.
- [x] Update `plans/archive/README.md`.
- [x] Verify `plans/` directory layout.
- [x] Verify `git diff --check` clean.
- [x] Record development log and test log entries.
- [x] Update `HANDOFF.md` and set `current-task.md` to `DONE`.

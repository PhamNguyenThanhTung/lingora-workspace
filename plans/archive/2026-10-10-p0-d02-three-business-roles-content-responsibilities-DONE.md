# Current Task — Resolve P0-D02 Business Role and UC Identity Documentation

**Status:** DONE
**Approval:** Explicit user instruction in the attached task request dated 2026-10-10 authorizes this bounded documentation-only work. It does not authorize product implementation or resolve P0-D07.
**Scope:** Reconcile approved three-role product semantics, role permissions, content assignment/review workflow, and current-vs-historical UC identity across the active documentation. Preserve historical records and all unrelated working-tree changes.

## Permitted files and actions

- Update `README.md`, `docs/use-case-specifications.md`, `docs/02-requirements.md`, `docs/05-traceability-matrix.md`, `docs/README.md`, `docs/QUICK-REF.md`, `docs/01-architecture.md`, `docs/04-data-model.md`, `docs/plantuml/uc-general.puml`, `docs/plantuml/uc-authoring.puml`, `docs/plantuml/uc-admin.puml`, `docs/plantuml/uc-learner.puml`, `logs/decision-log.md`, `plans/master-implementation-and-report-plan.md`, `HANDOFF.md`, and this task pointer.
- Append required evidence to `logs/test-log.md` and `logs/development-log.md`.
- Render/validate the edited active PlantUML sources and perform documentation consistency checks.
- Preserve historical approved records, pre-existing working-tree changes, generated artifacts unless the validation workflow refreshes an already tracked image, and all source/schema/migration files.

## Out of scope

- Do not change application code, API, database schema, migration, RLS, tests, or generated data model.
- Do not resolve P0-D07 or decide physical role mapping, publication state/versioning, grading answer secrecy, assessment persistence, SRS trust boundary, revision implementation, or audit implementation.
- Do not delete/archive any candidate files, broadly rename UC identifiers, commit, or alter Git history.
- Do not approve any proposed product behavior beyond the explicit user decisions in the attached task.

## Dependencies and controlling sources

- Repository entry sources: `docs/QUICK-REF.md`, `HANDOFF.md`, `docs/README.md`.
- User-provided approved baseline: three business roles and the bounded Admin/Teacher/Learner permissions in the attached request.
- Existing decision records ADR-030 through ADR-033; P0 queue in `plans/master-implementation-and-report-plan.md` §19.1.
- Preserve P0-D07 as unresolved for physical implementation questions.

## Acceptance criteria

1. ADR-034 records the user-authorized P0-D02 resolution and an explicit permission matrix.
2. Current requirements, use cases, traceability authority, quick reference, handoff, and active decision queue agree on three business roles and workflow boundaries.
3. Historical 15-UC and role-matrix records remain intact; current 14-UC catalog is clearly identified and has a non-ambiguous crosswalk.
4. Active use-case diagrams show actor permissions accurately and do not model authentication UC as an included prerequisite.
5. Audited conflicts concerning Admin authoring, Teacher assignment boundary, self-approval/direct publication, UC-02 placement lock/default, UC-06 optional review completion, UC-08 streak, and reused UC IDs are corrected or clearly left outside this bounded decision with authority stated.
6. P0-D07 remains open and is not represented as decided or implemented.
7. No source, schema, or migration files are changed; unrelated existing Git changes are preserved.
8. Run relevant document/diagram checks and record exact observed results in the required logs.

## Verification

- Inspect `git status`/diff and verify only permitted task paths are additionally modified.
- Search active docs for legacy role/workflow statements and ambiguous UC identity references.
- Run repository documentation validators if present; render all changed active PlantUML diagrams.
- Inspect final diff and confirm no source/schema/migration paths were changed by this task.

## Completion gate

Set status to `TESTING` after edits, then `DONE` after verification and logs. Do not commit because the shared checkout contains overlapping pre-existing changes that cannot be safely separated from these canonical documents without staging unrelated work.

## Completion record — 2026-10-10

- P0-D02 is resolved for business/domain documentation by ADR-034; P0-D07 remains open.
- Documentation and PlantUML checks passed. Existing web typecheck/unit failures are recorded as pre-existing checkout blockers; source files were not changed.
- Required decision/development/test logs were updated. Four current diagram PNGs were rendered from their active PlantUML sources.
- No commit was created because overlapping pre-existing worktree changes could not be safely isolated.

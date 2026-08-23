# Active Task

`align-uc-scope-and-report-status`

## Status

DONE

## Objective

Make UC-01 through UC-10 official, fully in-scope system features in active documentation and synchronize the four requested Markdown reports. Remove active-scope wording that frames UC-09 or UC-10 as proposed-only, deferred, or not implemented.

## Approved Decisions

1. All ten Use Cases (`UC-01`..`UC-10`) are official, fully in-scope system features.
2. Active documentation must not use `[PROPOSED]`, `PROPOSED / NOT IMPLEMENTED`, or `Approved target; not implemented` to qualify UC-09/UC-10.
3. `UC-09` and `UC-10` are active/in-scope functional requirements in the four requested reports.
4. This task changes documentation status framing only; it does not implement runtime, schema, API, RLS, or scoring/badge behavior.

## Files Expected To Change

- `plans/current-task.md`
- `docs/QUICK-REF.md`
- `docs/02-requirements.md`
- `docs/04-data-model.md`
- `docs/05-traceability-matrix.md`
- `docs/06-system-analysis.md`
- `docs/07-data-dictionary.md`
- `docs/plantuml/activity-achievements.puml`
- `docs/plantuml/sequence-placement-test.puml`
- `docs/report/lingora-requirements-and-use-cases.md`
- `docs/report/lingora-project-1-lecturer-format.md`
- `docs/report/lingora-project-1-requirements-report.md`
- `docs/report/lingora-project-1-five-chapter-report.md`
- `docs/report/evidence-register.md`
- `logs/test-log.md`
- `logs/development-log.md`
- `HANDOFF.md`

## Test Plan

1. Scan active docs/report and PlantUML sources for forbidden UC-09/UC-10 proposed-only labels.
2. Verify UC-09/UC-10 status tables in all four requested reports show active/in-scope.
3. Run `git diff --check`.

## Approval

- Status: **APPROVED by user on 2026-08-23**
- Approval message: "u can do this i approve and fix report too another Agent fix 2 and 4 u need to fix 1 3"

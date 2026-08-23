# Approved Task Snapshot

## Task

`complete-plantuml-coverage-and-integrate-reports`

## Status

APPROVED

## Approval

- Approved by: User
- Approved on: 2026-08-23
- Explicit instruction: remove the external `AI Service` actor; model GEC/T5-small as an internal Lingora processing component; place `Learner` and `Admin` outside the system boundary; use solid actor associations without arrowheads; complete the missing PlantUML DFD/Activity/Sequence coverage; show 17 physical baseline models with `ChatSession`/`ChatMessage` marked legacy/deprecated; separate UC-09 and UC-10 entities under `PROPOSED / NOT IMPLEMENTED`; synchronize Markdown reports; preserve the six original interview records; rename current `UC-11` references to `UC-10`.

## Objective

Complete and synchronize the documentation-only PlantUML/report task. The approved Use Case catalog is contiguous `UC-01`..`UC-10`; UC-09 placement and UC-10 private achievements remain proposed and not implemented. GEC is an internal processing capability within the Lingora system boundary, even when deployed through the repository's internal Route Handler/FastAPI components.

## Approved Boundaries

- Documentation and diagrams only.
- No runtime, API contract behavior, database schema, migration, RLS, RPC, dependency, or model-artifact changes.
- Historical files under `plans/approved/` and `plans/archive/` are not rewritten; this snapshot records the superseding current terminology.
- Interview evidence remains six original coded interviews plus three supplementary records, with frequencies kept separate.

## Files Expected To Change

- `plans/current-task.md`
- current canonical documentation needed for actor/boundary and UC numbering consistency
- `docs/plantuml/*.puml` needed for the approved diagram catalog
- current Markdown reports under `docs/report/`
- `logs/decision-log.md`
- `logs/test-log.md`
- `logs/development-log.md`
- `HANDOFF.md`

## Test Plan

1. Compile every PlantUML source with exit code 0.
2. Verify the current diagram/report catalog uses `UC-01`..`UC-10` and contains no current `UC-11` reference.
3. Verify Use Case diagrams have only external actors `Learner` and `Admin`, both outside the boundary, with non-arrow associations.
4. Verify the ERD contains exactly 17 physical baseline models, identifies 15 active plus 2 legacy/deprecated, and excludes proposed entities from that count.
5. Verify all requested DFD, Activity, and Sequence sources exist and report catalogs match them.
6. Verify reports retain the six original interviews and do not merge the three supplementary records into original frequencies.

# Active Task

`complete-plantuml-coverage-and-integrate-reports`

## Status

DONE

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Objective

Complete the approved PlantUML and Markdown-report documentation set. Use a contiguous `UC-01`..`UC-10` catalog, with UC-09 Placement and UC-10 Private Achievements marked `PROPOSED / NOT IMPLEMENTED`. Treat GEC/T5-small as an internal Lingora processing component rather than an external actor. Preserve the 17-model reporting baseline and the observed interview evidence.

This task is documentation-only. It must not alter runtime, API behavior, schema, migrations, RLS, RPC, dependencies or model artifacts.

## Approved Decisions

1. The only external Use Case actors are `Learner` and `Admin`.
2. Both actors remain outside the rectangular Lingora system boundary.
3. Actor-to-Use-Case associations use solid lines without arrowheads.
4. GEC/T5-small is internal Lingora processing. FastAPI/Route Handler may appear as internal implementation components in DFD/Sequence/architecture documentation.
5. The current Use Case catalog is `UC-01`..`UC-10`; private achievements use `UC-10`.
6. UC-09 and UC-10 remain proposed and are not implementation evidence.
7. The ERD reports 17 physical models: 15 active business-flow models plus 2 legacy/deprecated models (`ChatSession`, `ChatMessage`). Proposed UC-09/UC-10 entities are excluded.
8. Six original interview records and three supplementary records remain separate evidence groups; their frequencies are not combined.
9. Historical approved/archive plan snapshots and historical log evidence are immutable.

## Files Expected To Change

- `plans/current-task.md`
- `plans/approved/2026-08-23-complete-plantuml-coverage-and-integrate-reports-APPROVED.md`
- `docs/QUICK-REF.md`
- `docs/01-architecture.md`
- `docs/02-requirements.md`
- `docs/03-api-contract.md`
- `docs/04-data-model.md`
- `docs/06-system-analysis.md`
- `docs/07-data-dictionary.md`
- `docs/plantuml/*.puml`
- `docs/report/*.md`
- `logs/decision-log.md`
- `logs/test-log.md`
- `logs/development-log.md`
- `HANDOFF.md`

## Deliverables

- Use Case overview, Learner and Admin diagrams with corrected actors/boundary/associations.
- Activity diagrams for auth/session, lesson/exercise, admin content, SRS, GEC, progress/reminder, placement and achievements.
- Sequence diagrams for auth, SRS, GEC, placement and achievements with corrected UC labels.
- Context DFD, Level 0 DFD and detailed Lesson/Exercise, SRS and GEC DFDs.
- ERD with 15 active + 2 legacy/deprecated physical models and a separate proposed region.
- Synchronized canonical documentation, Markdown reports and evidence register.

## Test Plan

1. Compile every `.puml` source and require exit code 0.
2. Verify current documentation contains `UC-01`..`UC-10` and no obsolete achievement code.
3. Verify Use Case diagrams contain no external AI actor and no arrowed actor associations.
4. Verify the ERD contains exactly 17 physical baseline entities and 2 proposed entities outside the count.
5. Verify all requested DFD/Activity/Sequence sources exist and all 22 diagram filenames appear in Markdown report catalogs.
6. Verify six original interviews remain documented, the three supplementary records remain separate, and outdated missing-interview wording is absent.
7. Render representative diagrams for visual review and run `git diff --check`.
8. Perform a final five-axis documentation review before commit.

## Approval

- Status: **APPROVED by user on 2026-08-23**
- Implementation began after the explicit approval to remove the AI actor, internalize GEC, complete PlantUML/report coverage, preserve interview evidence and use `UC-10` for private achievements.

## Test Evidence

- PlantUML compile: 22/22 PASS.
- Static numbering/actor/ERD/catalog/interview audit: PASS.
- PNG render and visual inspection: PASS.
- Detailed evidence: `logs/test-log.md` entries `PLANTUML-COV-001`..`PLANTUML-COV-009`.

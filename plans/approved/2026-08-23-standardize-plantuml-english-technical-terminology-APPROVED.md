# Active Task

`standardize-plantuml-english-technical-terminology`

## Status

IMPLEMENTING

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Objective

Standardize PlantUML technical terminology across all 22 `.puml` files in `docs/plantuml/` according to user requirements:
1. Actors: Standard English technical names (`Learner`, `Admin`).
2. Use Case names, system boundary, and technical entities: Standard English terms (`UC-01 Authenticate & Manage Session`, `UC-02 Browse & Learn Lessons`, etc.).
3. Activity diagrams: Keep clear, natural Vietnamese action/step descriptions for readable flow presentation.
4. Sequence diagrams: Keep clear Vietnamese message text on arrows while using English technical names for lifelines/participants.
5. Compile and verify 22/22 PlantUML sources with zero errors.

## Approved Decisions

1. The only external Use Case actors are `Learner` and `Admin` (labeled in English).
2. Use Case titles and system boundary names use standard English technical terms (`UC-01 Authenticate & Manage Session`, `UC-02 Browse & Learn Lessons`, etc.).
3. Action descriptions inside Activity diagrams remain in Vietnamese for presentation readability.
4. Message arrows in Sequence diagrams remain in Vietnamese describing the exact interaction steps.
5. All 22 PlantUML diagrams must compile cleanly (`exit code 0`).
6. Zero changes to runtime code, database schema, Prisma, migrations, or API contracts.

## Files Expected To Change

- `plans/current-task.md`
- `docs/plantuml/*.puml` (all 22 files)
- `logs/test-log.md`
- `logs/development-log.md`
- `HANDOFF.md`

## Deliverables

- 22 updated and validated PlantUML `.puml` files in `docs/plantuml/`.
- Test evidence recording compilation (22/22 PASS) and visual PNG renders in `logs/test-log.md`.
- Updated development log and handoff brief.

## Test Plan

1. Compile all 22 `.puml` files with `plantuml.jar -checkonly` (expect exit code 0).
2. Render all 22 `.puml` files with `plantuml.jar -tpng` to `D:/btl/tmp/plantuml-render`.
3. Verify actor labels are English (`Learner`, `Admin`), UC titles are English, and activity/sequence flow steps maintain clear Vietnamese descriptions.
4. Run `git diff --check` to verify no whitespace errors.

## Approval

- Status: **APPROVED by user on 2026-08-23**
- Approval message: "ok"
- Approved Scope: Standardize 22 PlantUML files with English actors (`Learner`, `Admin`), English Use Case names, English system boundary and lifelines, clean UC-06 without model branding, while keeping natural Vietnamese action steps in activity diagrams and Vietnamese messages on sequence arrows.

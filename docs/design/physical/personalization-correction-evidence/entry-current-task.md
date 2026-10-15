# REPORT FUNCTIONAL USE CASE VIEWS + PO SRS CLARIFICATION

**Status:** IMPLEMENTING — documentation and logical modeling only.  
**Started:** 2026-10-12 (Asia/Saigon).  
**Approval:** Direct bounded user request preserved at `plans/approved/2026-10-12-report-functional-usecase-views-REQUEST.txt`; approved scope and pre-edit hash baseline are `plans/approved/2026-10-12-report-functional-usecase-views-APPROVED.md` and `-BASELINE.json`.

## PLAN / REVIEW / APPROVE

- Create eight report-oriented functional Use Case groups. The Admin group may render as VIEW-RUC-08A and VIEW-RUC-08B per the allowed readability split; the report labels are `VIEW-RUC-01`–`VIEW-RUC-08`; these are diagram identities only, not canonical UCs. Preserve actor-oriented views and canonical UC-01–UC-14 without renumbering or adding canonical entries.
- Apply the supplied PO clarification: due/overdue scheduling and selection are internal; learners answer system-selected questions and never browse/preview due lists. SRS can be integrated in ordinary learning/practice or offered as an optional dedicated session. Exclude dynamic SRS from scored immutable Placement/Level-up Assessment Versions. Retain Policy B, enrollment, card identity, persistence, idempotency, and reinforcement rules.
- Direct user instruction approves this bounded documentation-only scope. This does not approve implementation or physical design. Do not change app, Prisma, SQL/migrations, DB, seed, deployment, or physical design package; do not stage/commit or rewrite history.

## Permitted files/actions

- New `docs/modeling/report-usecases/` report index, eight `.puml` sources, their SVG/PNG renders, and render evidence limited to this package.
- Relevant edits to `docs/02-requirements.md`, `docs/use-case-specifications.md`, `docs/05-traceability-matrix.md`, `logs/decision-log.md`, logical modeling `UC-02`, `ACT-03`, `ACT-06`, `SEQ-06`, `SEQ-08` sources and corresponding render/manifest records only when needed, `docs/modeling/current-target/README.md`, and `docs/presentation/usecase-activity-presentation.md`.
- Task lifecycle/log pointers: `plans/current-task.md`, `plans/approved/`, `plans/archive/`, `HANDOFF.md`, `docs/QUICK-REF.md`, `logs/test-log.md`, `logs/development-log.md`.
- Preserve all other existing and concurrent dirty paths exactly; no broad renderer run if it rewrites unrelated artifacts.

## Acceptance criteria

1. Eight functional report views and mapping table match canonical terminology and roles. Explicitly identify these as report views; canonical UC catalog remains 14 entries (13 active and deferred UC-03), unchanged in identity and numbering.
2. Auth, context/starting choices, lessons, SRS, Placement/Level-up, progress/history, Teacher authoring, and Admin governance/account support are represented without scope expansion. Teacher cannot approve/publish/self-assign; Admin does not author actual content.
3. SRS learner-visible/internal/session behavior, due/overdue persistence, optional Add to Review, Policy B, once-only reinforcement, and exclusion from scored immutable assessments are explicit in authority docs and affected logical diagrams. Reassessment remains deferred.
4. Existing SRS sequence no longer sends due-card lists to learner; activity uses internal due selection followed by learner answer and system schedule update. Lesson flow describes eligible SRS questions without changing core score/completion denominator.
5. One detailed ~10-minute Vietnamese speaking script reflects the new diagrams and PO policy. Downstream physical-design sync note is recorded without touching physical files.
6. Eight new views render to SVG and PNG with zero PlantUML errors; check each PNG/SVG for valid structure and manually inspect rendered images for legibility/style. `git diff --check` passes; relevant links resolve; outputs and observed commands are logged.

## Review notes

- `VIEW-RUC-*` identities belong only to `docs/modeling/report-usecases/`; they are not UC catalog entries.
- `due_at` remains internal scheduling state and persisted by the later physical design; learner-facing due-list browsing is not an MVP capability.
- Physical design must consume the revised SRS interaction semantics in a separately owned task. Do not edit that package here.

## Progress

- [x] Read request and entry sources; inspected current SRS/assessment/role authority and workspace state.
- [x] Preserve exact request, approval snapshot, and baseline before implementation.
- [ ] Update controlling requirements/specification/traceability and record ADR-041.
- [ ] Correct relevant logical diagrams without changing canonical identities.
- [ ] Create report functional views, mappings, renders, and detailed script.
- [ ] Render/manual review, link/ID/semantics checks, diff check; append observed logs.
- [ ] Archive this completed task and update current handoff/quick reference; no commit.
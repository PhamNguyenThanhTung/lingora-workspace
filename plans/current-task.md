# D3 Assessment & Learning Engine Design

## Status

`DONE` (APPROVED → IMPLEMENTED → TESTED → LOGGED; commit pending explicit request)

## Objective

Design the complete logical flow `Assessment → Skill Profile → Learning → Mastery/Knowledge Gap → Readiness → Recommendation/Remediation` from the D1/D2 COMPLETE baseline. Design documentation only; no runtime, application code, schema, migration, scoring, recommendation, remediation, or UI implementation. Do not claim Design Freeze.

## Category Tag

`category: scope-ambiguity`

## Canonical Constraints

- Core diagnostic dimensions: Vocabulary, Grammar, Reading, Listening. Writing/Speaking remain optional extensions.
- Canonical proficiency: CEFR A1–C2; MVP A1–B2.
- Entry: self-reported level OR diagnostic assessment; self-reported level is never verified proficiency.
- Keep LearningProgress, Proficiency, Mastery, and LevelReadiness distinct.
- Transition outputs: `ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`.
- Remediation targets concepts; no whole-learner downgrade or mechanical replay of a completed lesson.
- Recommendation remains Level 3 and explainable from proficiency, Skill Profile, goal, learning history, error history, and mastery/gaps.
- Assessment purpose (`DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`) stays separate from delivery mode (`PLACEMENT`, `JUMP`, `STANDARD`). Preserve D2 field naming `assessmentType` for purpose and `deliveryMode` for execution mode; do not introduce a competing enum. `AssessmentResult` is the persisted result; do not create an `AssessmentSession` entity.
- Preserve D2 decisions and clearly report compatibility. If a required change falls outside this plan, stop and return the plan to REVIEW.

## Required Design Deliverable

Create `docs/phase-1-d3-assessment-learning-engine-design.md` with sections A–Q exactly covering:

A. D3 Assessment Architecture; B. Diagnostic Blueprint; C. AssessmentResult; D. SkillProfile; E. Mastery/KnowledgeGap; F. LevelReadiness; G. Remediation; H. Recommendation; I. State Machines; J. Language-specific Assessment; K. Traceability; L. Diagrams Updated; M. FROZEN/PROPOSED/PENDING; N. Open Design Decisions; O. Compatibility Impact on D2; P. Design Risks; Q. Final Status.

The final status must be exactly `READY FOR D4 CONTENT/CURRICULUM DESIGN` or `NOT READY`. Do not label the design frozen.

## D3 Design Requirements

1. Model assessment purpose and delivery mode as independent axes; preserve immutable, versioned and attributable `AssessmentResult` evidence including learner, target language, timestamps, assessment/config versions, responses, skill outputs, and purpose-specific starting-point or readiness evidence.
2. Specify entry flow from language selection through self-report or diagnostic evidence to Skill Profile and curriculum starting point. Keep self-reported, assessed, verified, and curriculum-starting-point concepts distinct.
3. Describe the stage-adaptive blueprint and abstract routing inputs/state/transitions/outputs. Cover four skills, difficulty bands, routing/targeted stages, conceptual stopping conditions, item metadata/concept links, and language configuration. The ~25–30 item and ≤15 minute values remain `PROPOSED / PENDING VALIDATION`; do not choose exact distributions, scores, thresholds, or stopping rules.
4. Define four-dimension SkillProfile level/status, provenance, source result and update time. Anchor Level remains `PENDING`; no authoritative flat score or weighted average.
5. Define ConceptMastery lifecycle `NOVICE → DEVELOPING → MASTERED`, keyed by LearnerProfile and Concept. Define typed concept-level error evidence and KnowledgeGap lifecycle, severity/state, evidence/provenance, resolution and archive semantics without numerical thresholds.
6. Define typed LevelReadiness evidence (progress, mastery, gaps, assessment-result references, evidence version and evaluation time) and the three decision outputs. Do not use completion as certification or readiness; do not hard-code a threshold or single score.
7. Specify remediation selection and re-assessment flow with fresh context/vocabulary/exercises, concept focus, and no whole-level downgrade or forced replay.
8. Specify Recommendation input/output contract, explanation/rationale, provenance, generation time, and rule/model version; no algorithm.
9. Keep common assessment engine separate from language config, item bank, and rubric. Include English and Chinese configuration room; Chinese HSK mapping/version remains open.
10. Preserve all ten D3 quality invariants and all listed open decisions, including exact item count/distribution, scoring, adaptive/stopping/mastery/readiness/remediation thresholds, Anchor aggregation, CEFR→Unit mapping, and detailed HSK mapping/version. Existing separately approved Mapping A for English A1 must be identified as a D2 compatibility decision and must not be generalized into a new D3 scoring policy.

## Files Expected To Change

- `docs/phase-1-d3-assessment-learning-engine-design.md` (new comprehensive D3 spec).
- `docs/01-architecture.md` (concise D3 architecture cross-reference and semantic alignment only).
- `docs/05-traceability-matrix.md` (research/evidence → decision → requirement → UC → domain → D3 rule rows, including required evidence links).
- `docs/plantuml/assessment-lifecycle-d3.puml` (purpose/mode/result lifecycle and entry/post-learning distinction).
- `docs/plantuml/diagnostic-flow-d3.puml` (entry and stage-adaptive flow).
- `docs/plantuml/learning-progression-d3.puml` (progress/mastery/readiness separation and no automatic level transition).
- `docs/plantuml/mastery-knowledge-gap-d3.puml` (exercise/error signal/gap/remediation/re-assessment lifecycle).
- `docs/plantuml/level-readiness-d3.puml` (three-state readiness machine).
- `docs/plantuml/recommendation-remediation-d3.puml` (explainable recommendation and concept remediation relationship).
- `plans/current-task.md` (this plan and status log; prior DONE plan snapshot archived without edits).
- `logs/test-log.md`, `logs/development-log.md`, `logs/decision-log.md` (after approved work and verification).
- `docs/QUICK-REF.md`, `HANDOFF.md` (only after task reaches DONE; concise D3 status and D4 next step).

No other files are in scope. Do not modify existing D2 diagrams/documents beyond the listed concise architecture/traceability cross-references. Stop if compatibility requires an unlisted change.

## Review Checklist

- Compare D3 statements against D2 sections on assessment, progression, Jump, remedial governance, entity dictionary, relationship matrix, and approved Mapping A.
- Confirm requirement/use-case labels and evidence identifiers against the canonical requirement and traceability docs; do not invent evidence or change the 15-UC catalog.
- Ensure the new D3 diagrams agree with prose, show distinct purposes and delivery modes, and contain no `Completed B1 → B2 automatically` transition.
- Ensure every open numerical or mapping decision is explicitly pending/configurable and no recommendation/remediation algorithm is introduced.

## Test Plan (run after approval)

1. Run `py scratch/verify_consistency_guards.py`; record actual exit code and output. Extend only if the approved scope includes corresponding documentation consistency guards; do not modify application tests.
2. Run `git diff --check`.
3. Run focused documentation/diagram scans: all six D3 `.puml` files have balanced `@startuml`/`@enduml`; required purpose and delivery-mode enums are distinct; all ten invariants are present; forbidden hard-coded D3 thresholds/formulas are absent; all six diagrams have matching prose; no whole-level downgrade or automatic completion-to-advance edge is present.
4. Record exact commands, environment, commit SHA, relevant output and PASS/FAIL in `logs/test-log.md`. If a specified checker cannot run, record the observed failure and do not claim PASS.

## Negative Invariants

- Zero runtime or UI implementation; zero Prisma/Supabase schema or migration changes.
- Zero scoring, recommendation, or remediation algorithm implementation.
- No `AssessmentSession` ghost entity.
- No self-report promoted to verified proficiency.
- No content completion used as certification or automatic level advancement.
- No numerical thresholds or aggregation policies beyond explicitly approved D2 Mapping A; unresolved values remain pending/configurable.
- No whole-level downgrade and no forced replay of completed lessons.
- No claim of Design Freeze.

## Approval (human only)

- [x] D3 design-only scope approved / revise: APPROVED 2026-09-24 via human directive ("APPROVED. Proceed with D3 ... exactly according to the submitted plan and constraints.")
- [x] Files Expected To Change approved / revise: APPROVED as listed (no additions)
- [x] Approved by: human (chat directive)                 Date: 2026-09-24
- [x] Confirm D2 compatibility exception for existing English A1 Mapping A: CONFIRMED — Mapping A stays a D2 curriculum placement rule; not generalized into D3 scoring policy

## Status Log

- 2026-09-24: D3 plan drafted from user-provided requirements and D1/D2 baseline. Status REVIEW. No D3 design implementation performed. Await explicit human approval before editing design artifacts.
- 2026-09-24: Human APPROVED via directive (design-only, preserve D2 FROZEN/PROPOSED/PENDING, no runtime/migration/algorithm, no Design Freeze). Status IMPLEMENTING. Implementation restricted to Files Expected To Change.
- 2026-09-24: IMPLEMENTED D3 design-only per Files Expected To Change (new D3 A–Q spec, 6 puml, concise 01 §3.4 + 05 §6 cross-refs). No out-of-scope file touched; pre-existing workspace modifications preserved. Status TESTING.
- 2026-09-24: TESTED `T-D3-DESIGN-001` PASS (18/18 guards; `git diff --check` 0; D3 focused scan OVERALL PASS; runtime scope empty). LOGGED test-log, development-log, ADR-016. Status DONE. Commit pending explicit user request (per git discipline).

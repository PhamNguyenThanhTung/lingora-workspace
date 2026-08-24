# Approved Task Snapshot

## Task

generate-19-slide-lingora-requirements-presentation

## Status

APPROVED

## Approval

- Requested by: Pham Nguyen Thanh Tung
- Human action: user explicitly replied `approve`
- Approval date: 2026-08-23
- Boundary: create the Vietnamese 19-slide requirements-analysis PPTX, perform template fidelity/render/source-note QA, and update lifecycle logs and handoff. No product/runtime implementation.

## Deliverable

`docs/report/Lingora-Project-1-Requirements-Presentation.pptx`

Visual source: `D:\TimHieuPaper_Nhom16.pptx` (read-only; do not overwrite).

## Locked Scope And Evidence Rules

- Two active tracks: Software Engineering and ML/Deep Learning with T5-small GEC.
- Active baseline: `UC-01`–`UC-08`.
- `UC-09` Placement Test and `UC-11` Private Badges are `PROPOSED / NOT IMPLEMENTED`.
- ERD wording: 17 physical baseline models = 15 active business-flow models + 2 legacy/deprecated chat models awaiting formal cleanup.
- T5-small owns `corrected_text`; derived diff/classification/explanation are not model-owned claims.
- SRS remains deterministic; do not call it SM-2/FSRS without audit evidence.
- Interview evidence is qualitative only: `6/6`, `5/6`, `4/6`, with small-sample caveat.
- Exclude unsupported `N=30`, survey percentages, Q7–Q24 claims, Figma/advisor validation, `<2.5s`, `99.9%`, and similar metrics.
- Slide 18 must summarize current status and verification only; no roadmap or future-expansion list.

## Slide Sequence

1. Cover
2. Agenda
3. Problem statement
4. Solution and two-track boundary
5. Stakeholders and trust boundaries
6. Elicitation methodology
7. Interview findings
8. Neutral benchmark references
9. Pain-point to requirement mapping
10. Use Case scope
11. Functional requirements
12. Non-functional guardrails
13. User Story and Acceptance Criteria
14. Use Case modeling
15. Activity modeling
16. ERD and data boundary
17. Validation and traceability
18. Verified current status
19. Q&A

## Implementation And QA Constraints

- Use `@oai/artifact-tool` ES modules and bundled workspace runtime paths.
- Inspect every source slide; create and validate a complete `template-frame-map.json`.
- Preserve the source master/layout/slide hierarchy, university logo, purple/yellow header and gray footer motif.
- Add `[Sources]` blocks to speaker notes for non-trivial claims/assets.
- Render and inspect all 19 slides; fix clipping, overlap, wrapping and unresolved placeholders.
- Run template-fidelity checks, evidence/scope audit, `git diff --check`, and record observed results in `logs/test-log.md` and `logs/development-log.md`; update `HANDOFF.md` when complete.

## Files Expected To Change

- `plans/current-task.md`
- `plans/approved/2026-08-23-generate-19-slide-lingora-requirements-presentation-APPROVED.md`
- `docs/report/Lingora-Project-1-Requirements-Presentation.pptx`
- `logs/test-log.md`
- `logs/development-log.md`
- `HANDOFF.md`

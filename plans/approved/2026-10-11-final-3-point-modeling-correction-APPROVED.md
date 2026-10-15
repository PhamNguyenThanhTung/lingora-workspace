# Final 3-Point Modeling Correction — Documentation Plan

**Status:** APPROVED
**Date:** 2026-10-11
**Approval evidence:** Explicit user request in the attached `FINAL 3-POINT MODELING CORRECTION`; it authorizes this bounded documentation/modeling correction and, if all three points match authority, final `MODELING APPROVED` / `READY FOR PHYSICAL DESIGN` verdict. It excludes application code, Prisma, migration, database, and physical design.
**Request snapshot:** `plans/approved/2026-10-11-final-3-point-modeling-correction-REQUEST.txt`
**Pre-change baseline:** `plans/approved/2026-10-11-final-3-point-modeling-correction-BASELINE.json`

**Goal:** Verify and correct only (1) assignment responsibility lifecycle, (2) configurable Level-up readiness/pass criteria, and (3) unavailable versus progression-locked curriculum semantics across active canonical documents/diagrams.
**Authority:** PO request → ADR-036 → compatible ADR-030–035 → active requirements → active UC catalog → traceability → diagrams. ADR-033 sets a course-defined curriculum gate with no universal percentage; historical English 100% is only an eligible configuration. ADR-036 excludes unpublished/unavailable future material and withdrawn incomplete content from eligible progress. PO request resolves that a published active required lesson remains denominator-eligible when only normal progression-locked. ADR-034/035 say reassignment changes the single current Teacher while retaining attribution/history; no Assignment terminal state is approved.
**Tech:** Existing PlantUML renderer, Python static verifier, manual image inspection.

## PLAN / REVIEW / APPROVE

`STA-02` already has one responsibility state and a self-transition for reassignment; it has no CLOSED state. `ACT-04`, UC-05, and ADR-033 already make curriculum readiness and assessment pass configuration-driven; no platform 100% Level-up invariant was found. The active progress wording/UI currently conflates locked/coming-soon availability with progression lock in curriculum views and UC/requirements wording; clarify those distinctions. No new product decision or traceability row is required; traceability is inspected and left unchanged if already consistent. Prior completed review/archive evidence remains immutable; only its current report/result/pointers may be updated by this authorization.

## Permitted files/actions

- Task metadata/evidence: `plans/current-task.md`, new matching approved/request/baseline/DONE files and the two plan indexes; `docs/modeling/current-target/evidence/final-three-point-correction.md`.
- Diagram sources, only where ambiguous: `src/ACT-01-learner-onboarding.puml`, `src/ACT-09-revision-replacement.puml`; update just these two SVG/PNG outputs, their render-manifest rows, and their two visual-review records.
- Active docs if drift is present: `docs/02-requirements.md`, `docs/use-case-specifications.md`, `docs/modeling/current-target/final-review.md`, `docs/modeling/current-target/README.md`, `docs/README.md`, `docs/QUICK-REF.md`, `HANDOFF.md`.
- `docs/modeling/current-target/verify.py` and `verification-output.txt`; append-only `logs/test-log.md` and `logs/development-log.md`.
- Read-only decision log, traceability, previous approval/archive evidence and all findings/status before corrections.

## Exclusions

No other diagrams, no change to STA-02/ACT-04 if the baseline review confirms they already match, no broad audit/restyling, no unrelated use case or assessment behavior, no traceability churn without a found conflict, no ADR edit, no code/Prisma/migration/database/physical design, no staging or commit. Preserve unrelated dirty workspace and index exactly. Stop with `NEEDS PO DECISION` if the stated correction conflicts with an approved ADR.

## Verification / acceptance

1. Confirm the three assertions from the request against ADRs, source and revised final-review report. Search active TARGET state declarations/transitions for a `CLOSED` terminal state (a prohibition comment is not a state). Search configured Level-up rules for a hard-coded 100% threshold/equivalent; allow unrelated score percentages and the explicit non-invariant historical/configuration references.
2. Check curriculum wording in ACT-01/04/09 and UC-04/UC-05 plus active requirements: unpublished/unavailable and withdrawn-incomplete items are excluded; published active required lessons remain eligible even if progression-locked. Update only truly ambiguous/incorrect files.
3. Render only changed diagram source(s) using the installed PlantUML jar; check exit0 for SVG and PNG, output freshness, and inspect the final PNGs individually. No shared style changes are planned.
4. Run canonical `py -3.13 docs/modeling/current-target/verify.py`, the three targeted semantic/search checks, manual changed-file review, and `git diff --check`. Update the canonical verifier so it directly asserts these three semantics. Record exact commands/output in test log; append work/evidence/verdict in development log. For documentation-only scope, no application runtime tests apply.
5. Update current task to DONE, preserve an immutable archive and current pointers. Final verdict may be exactly `MODELING APPROVED` and `READY FOR PHYSICAL DESIGN` only if all three checks pass. Then stop; physical work needs its own task/authorization.

## REVIEW / APPROVE

Reviewed controlling authority and actual active artifacts. ADR-033 explicitly assigns a course-defined curriculum gate and says no universal percentage; its historical English 100% value is not a platform invariant. ADR-036 says only future unpublished/unavailable and withdrawn incomplete content are excluded from eligible denominator; the user request explicitly resolves the interpretation of normal progression lock. ADR-034/035 define one current responsible Teacher and retained attribution/history. `STA-02` already has no closed/terminal state. No authority conflict remains within these three points. The direct user request approves this bounded documentation-only plan. This approved snapshot is immutable.

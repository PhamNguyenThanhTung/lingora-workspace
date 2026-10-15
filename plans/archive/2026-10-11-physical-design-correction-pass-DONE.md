# PHYSICAL DESIGN CORRECTION PASS — CLOSE F01–F12

**Status:** DONE — bounded proposed-physical-design documentation correction and independent closure recheck complete; terminal state is **PHYSICAL CORRECTION COMPLETE — READY FOR FINAL RECHECK**.
**Date:** 2026-10-11
**Approval evidence:** direct user instruction in [exact request](../approved/2026-10-11-physical-design-correction-pass-REQUEST.txt); immutable scope snapshot [here](../approved/2026-10-11-physical-design-correction-pass-APPROVED.md); initial workspace baseline [here](../approved/2026-10-11-physical-design-correction-pass-BASELINE.json).
**Prior task:** Final Physical Data & Runtime Design Review is DONE; this is the separately recorded correction task it required.

## PLAN / REVIEW / APPROVE

- Close exactly F01–F12 from `docs/design/physical/final-review.md`, P1 before P2, without changing approved product semantics or adding a subsystem.
- Controlling order: latest PO decisions; ADR-036; compatible ADR-030–035; active requirements; active UCs; traceability; approved logical modeling; exact final-review findings; proposed physical design.
- Direct bounded documentation-only authorization satisfies APPROVE under `AGENTS.md`. The technical choices remain proposed until a separate final physical review. An unexpected product-semantic dependency returns the affected finding to REVIEW / NEEDS PO DECISION.
- Approved snapshot and request are immutable. Baseline records initial HEAD, index, full status and existing file hashes before task files were written.
- **Plan amendment (2026-10-11):** F10 follows approved ACT-01, which selects the lowest-position level with content; a configured higher default cannot override a lower eligible published AVAILABLE level. The immutable snapshot's configured-default-first wording was a technical interpretation and is superseded for execution by this controlling source. F12 adds a coverage-tag validation scenario for allowed and rejected tags. Both remain within the approved F01–F12 correction scope and add no product decision; the snapshot remains unchanged.
- Permitted changes: `docs/design/physical/` design/security/rebuild/acceptance/verifier/report/evidence/render artifacts; this task pointer; task approval/request/baseline/archive indexes; `HANDOFF.md`, `docs/QUICK-REF.md`, `docs/README.md`; append-only test/development/decision logs. No approved logical modeling changes.
- Explicitly out of scope: app source, production Prisma, migration/SQL, DB access or mutation, seed, deployment, implementation planning, stage and commit.

## Finding matrix

Use the immutable detailed matrix in `plans/approved/2026-10-11-physical-design-correction-pass-APPROVED.md`. It records for each F01–F12: priority, exact problem, controlling authority, affected artifacts, planned correction and verification.

## Acceptance and verification

- Teacher assigned-work submit has a real narrow execution path, while unassigned/stale requests and Teacher approval/publication are denied.
- First learner context can be created without an existing row, supports Placement/self-report/default, unique learner/language and max-two ACTIVE race enforcement.
- Audit can attribute a verified Auth UUID without an application account; assignment scope/reviews pin generation; draft membership removal is narrow; media retirement/reference race is serialized.
- Curriculum ownership/history is stable; stale open lesson attempts cannot create first completion after replacement; SRS is unique by card/session; default entry requires available content; blueprint scope/version and finite topic/skill/purpose tags are immutable/provenance-safe.
- Preserve the 34-table count, conditional CLEAN REBUILD recommendation and LIVE DB UNVERIFIED state. No implementation or physical approval claim.
- Capability matrix names actor, trusted-server check, scope, DB/RLS dependency and transaction for all request-listed commands.
- Add scenario fixtures/actions/expected invariants; these are future tests and must be marked NOT EXECUTED.
- Diagnose/update the four stale verifier checks against current task baseline and authority; do not remove valid semantic checks to force PASS.
- Render/check/visually inspect affected ERD views; verify links, table count, FK/unique consistency, no legacy roles/Reassessment/AI/A1/universal 100%/fixed item count, verifier, diff check/stat and line counts.
- Conduct an independent read-only F01–F12 closure review, report each finding CLOSED or STILL OPEN, and stop at READY FOR FINAL RECHECK only if all are CLOSED.
- Record observed results in `logs/test-log.md` (documentation-only N/A where applicable), work in `logs/development-log.md`, proposed technical choices in `logs/decision-log.md`, and completion handoff. Preserve baseline HEAD/index and unrelated workspace edits.

## Progress

- [x] Entry sources and complete user request read; source hierarchy and F01–F12 details checked.
- [x] Workspace/index baseline captured; approval request copied and immutable scope snapshot saved before physical correction.
- [x] Apply proposed physical corrections P1 then P2; keep table count at 34.
- [x] Add acceptance/capability matrices and update current verifier; explain four superseded checks.
- [x] Render/inspect all four ERD views; the current correction verifier passes, all 93 local links resolve, and the 34-table/command/scenario/baseline checks pass.
- [x] Obtain independent read-only F01–F12 closure results; the second recheck marks all twelve CLOSED, including F10/F12.
- [x] Append test/development/decision logs; update archive/task/handoff/source pointers; preserve task baseline, HEAD and original index.

## TEST / LOG / FINAL STATE

- **Observed:** current physical correction verifier exit 0; 34 proposed tables retained; 93 local links; F01–F12 semantic checks and sixteen future scenarios; independent reviewer reports all twelve CLOSED; all 189 approved-modeling files unchanged; HEAD and original Git index unchanged. Full current output: `docs/design/physical/verification-output.txt`.
- **Observed:** PlantUML syntax check, PNG/SVG render, render integrity/hash/parse checks and visual inspection pass. `git diff --check` exit 0. Diff output and line counts are captured under `docs/design/physical/correction-pass-evidence/`.
- **Logs:** T-PDC-001 in `logs/test-log.md`; correction work in `logs/development-log.md`; ADR-039 records proposed physical corrections without accepting them in `logs/decision-log.md`.
- **Archive:** `plans/archive/2026-10-11-physical-design-correction-pass-DONE.md`.
- **Commit:** NOT CREATED; no staging or changes to HEAD/original index.

## Stop condition

If a finding requires a product decision not already authorized by the controlling sources, preserve that gap, set the finding to NEEDS PO DECISION, stop dependent work and return this task to REVIEW. On all twelve independent CLOSED results, mark this task DONE and stop at **PHYSICAL CORRECTION COMPLETE — READY FOR FINAL RECHECK**. Do not begin an implementation master plan, schema/code work, DB rebuild or deployment.

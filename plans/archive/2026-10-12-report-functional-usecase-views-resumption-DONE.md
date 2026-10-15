# REPORT FUNCTIONAL USE CASE VIEWS — RESUMPTION

**Status:** DONE — documentation/modeling only.
**Started:** 2026-10-12 (Asia/Saigon).
**Approval:** Direct resumption instruction preserved in [REQUEST](../approved/2026-10-12-report-functional-usecase-views-resumption-REQUEST.txt); approved scope and current pre-edit hashes are in [APPROVED](../approved/2026-10-12-report-functional-usecase-views-resumption-APPROVED.md) and [BASELINE](../approved/2026-10-12-report-functional-usecase-views-resumption-BASELINE.json). The narrow manual-review correction is captured in [AMENDMENT-01](../approved/2026-10-12-report-functional-usecase-views-resumption-AMENDMENT-01.md). The earlier interrupted task remains preserved in [the predecessor capture](2026-10-12-report-functional-usecase-views-PARTIAL-CAPTURE.md).

## PLAN / REVIEW / APPROVE

- Resume the user-authorized report-oriented UC documentation task because the user could not see the diagrams. The files and renders already exist; surface them, complete the remaining visual/text synchronization, and close the bounded task.
- ADR-041 controls the PO SRS interaction clarification. ADR-042 is current for the already-added Study Focus choices in VIEW-RUC-02/03. Canonical UC-01–UC-14 remain unchanged; report view IDs are not UC IDs.
- This direct instruction approves bounded documentation/modeling only. Do not change the physical-design package, app/code, Prisma, SQL/migrations, database, seed, deployment, or unrelated concurrent work. Do not stage or commit.

## Permitted files/actions

- `docs/modeling/report-usecases/`: translate the VIEW-RUC-01 staff-provisioning note and add the required scoring/completion note to VIEW-RUC-03; rerender only those two PNG/SVG pairs and update only their manifest records; use other report sources/renders unchanged.
- `docs/presentation/usecase-activity-presentation.md`: add the already-approved Study Focus behavior shown in VIEW-RUC-02/03 to the detailed speaking script.
- Task lifecycle and evidence only: this file, its approved request/snapshot/baseline, matching archive/index entries, `HANDOFF.md`, `docs/QUICK-REF.md`, `logs/test-log.md`, and `logs/development-log.md`.
- No changes to physical design, application/runtime, database, or canonical model sources unless an explicit verification gap blocks safe completion; if so, stop and report it.

## Acceptance criteria

1. Keep eight functional groups/nine report views and all current source/SVG/PNG files. Confirm the separate report ID namespace, canonical catalog count of 14, deferred UC-03 reminder, and inactive Reassessment.
2. All nine report PlantUML sources pass `-checkonly`; render the edited VIEW-RUC-01/03 sources and update their hashes. Verify every output against the report manifest and inspect the diagram images.
3. SRS due selection remains internal; learners do not browse/preview due lists; due/overdue cards persist; ordinary practice can include selected review questions; scored immutable Placement/Level-up versions never receive dynamic SRS items.
4. The report script includes the current Study Focus behavior alongside core lesson/SRS separation and retains its detailed ten-minute speaking schedule.
5. Teacher/Admin boundaries stay accurate; local links and line-count/whitespace checks pass. Record exact observed verification and note runtime tests as N/A.
6. Archive this plan, set the active pointer to DONE, update current handoff/quick reference, preserve physical design as proposed and the next approval recheck as a separate task. No stage/commit.

## Completion

- [x] Read current task pointer, quick reference, handoff, documentation authority, task archive, report diagram manifest, and current shared report-view changes.
- [x] Preserve the direct continuation request, approved scope, and inspected baseline.
- [x] Apply amendment 01, rerender VIEW-RUC-01/03; synchronize the script with Study Focus in the current diagrams.
- [x] Verify all nine report views, render hashes/structure, mapping/links, SRS policy, roles, canonical IDs, and manually inspect all nine images.
- [x] Append observed test/development logs and repeat `git diff --check` after lifecycle updates.
- [x] Archive this task and update current handoff/quick reference; no commit.

### Verification and result

- Nine report PlantUML sources passed syntax checking. Eight functional groups map to nine report diagrams; all 18 PNG/SVG outputs match manifest hashes and validate structurally. Local links resolve.
- Static checks confirmed the canonical UC-01–UC-14 catalog is unchanged, UC-03 remains deferred, Reassessment is inactive, SRS due-card selection stays internal, Placement/Level-up remain immutable, and Teacher/Admin responsibilities match the approved boundaries.
- Opened all nine PNGs and checked the final VIEW-RUC-01/03 renders after rerendering; notes are readable and unclipped. The detailed ten-minute script includes the current Study Focus and SRS behavior.
- `git diff --check` passed after lifecycle updates. Documentation/modeling verification only; runtime/database tests are N/A. Full observed commands and output are in [T-RUC-RESUME-001](../../logs/test-log.md).
- Physical design remains PROPOSED / NOT IMPLEMENTED; LIVE DB UNVERIFIED. No app, Prisma, SQL/migration, database, seed, deployment, stage, or commit work was performed.

**Commit:** NOT CREATED — no staging or commit was authorized; concurrent work and the existing Git index were preserved.

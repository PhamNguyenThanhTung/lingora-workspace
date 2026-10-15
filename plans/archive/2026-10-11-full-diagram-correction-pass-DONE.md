# Full Diagram Correction Pass — Documentation Plan

**Status:** DONE
**Date:** 2026-10-11
**Approval evidence:** Explicit user request FULL DIAGRAM CORRECTION PASS, sections 0–42, directly authorizes bounded documentation corrections and parallel workers. This approval does not authorize product changes, physical contracts, runtime implementation, or final modeling approval.
**Approved snapshot:** `plans/approved/2026-10-11-full-diagram-correction-pass-APPROVED.md`
**Request:** `plans/approved/2026-10-11-full-diagram-correction-pass-REQUEST.txt`

**Goal:** Audit and correct all 36 canonical PlantUML sources for approved semantics, diagram type, Vietnamese report presentation and visual usability; stop for a separate Final Modeling Review.
**Architecture:** Keep stable source filenames and VIEW-UC identities. Store classification/authority in comments and manifest, with clean report titles. Distinguish UML business concepts from logical persistence, leaving physical representation deferred.
**Tech Stack:** PlantUML, existing local Java/Python renderer and document verification.

## PLAN / REVIEW / APPROVE

The request is documentation-only approval under AGENTS.md. ADR-036 supersedes ADR-030–035 only within its stated scope; active requirements, UC and traceability are subordinate. No new product ambiguity is resolved by a diagram. Prior final-review records remain immutable historical evidence. This new pass supersedes the operational readiness pointer only.

## Permitted files / ownership

- Worker A: `docs/modeling/current-target/src/UC-*.puml`, `SYS-*.puml`, `SEC-*.puml`, `DEP-*.puml`.
- Worker B: `docs/modeling/current-target/src/ACT-*.puml`, `STA-*.puml`.
- Worker C: `docs/modeling/current-target/src/SEQ-*.puml`.
- Coordinator: `DOM-*.puml`, `DATA-*.puml`, shared style, renderer/verifier/manifest/outputs, README/review and correction evidence under `docs/modeling/current-target/`.
- Task metadata: current-task, new approved/request/baseline/archive records and indexes; HANDOFF, docs/QUICK-REF, docs/README and affected traceability pointer; append-only test/development logs.
- Read-only inspection of controlling ADRs, requirements/UC, architecture/data references and repository evidence; independent read-only reviewer.

## Exclusions and stop conditions

No app code, API contract, Prisma, SQL, migrations, live DB operation, product decision, infrastructure addition, historical approved/archive overwrite, staging or commit. On unresolved authority conflict stop dependent correction and report NEEDS PO DECISION. On completion stop; next task is separate FINAL MODELING REVIEW.

## Execution / verification checklist

- [x] Capture workspace/index baseline and preserve request/approval before correction.
- [x] Audit all 36 sources against controlling sources; document findings per diagram.
- [x] Normalize white/black/gray style, Vietnamese titles, short business labels; remove rendered metadata, notes and technical noise.
- [x] Correct supporting Login includes without catalog mutation; swimlanes, N/K lesson flow, recurring SRS, availability/history, lifelines/fragments and minimal state models.
- [x] Rebuild DOM-01 as UML concepts and DATA-03 as distinct logical relations; manually compare them.
- [x] Render all sources with `py -3.13 docs/modeling/current-target/render.py`; require 36 sources, 36 SVG, 36 PNG, zero errors and current hashes.
- [x] Inspect every final PNG manually and iterate layouts; record per-image evidence.
- [x] Run inventory/link/duplicate/legacy-role/AI-runtime/Reassessment/four-rating/fixed-count/A1-Unit1-80%-invariant scans; verify 11-concern cross-diagram matrix and scope/index preservation.
- [x] Independent read-only review, fix substantive findings, then rerender/reverify affected results.
- [x] Run `git diff --check`, `git diff --stat` and line-count checks; append observed environment/commands/output/verdict to required logs.
- [x] Update report grouping, A–N correction report, task/archive/handoff and current pointers; readiness only READY FOR FINAL MODELING REVIEW / NEEDS MORE DIAGRAM CORRECTION / NEEDS PO DECISION / BLOCKED.

## Acceptance

All 36 sources audited and rendered; main report views clean and readable; CURRENT claims remain repository-only; no active Reassessment; protected Overview UCs include presentation-only Login; domain differs materially from ERD; all approved ADR rules retained; 11-concern consistency matrix, visual evidence and required logs complete. No final approval or downstream implementation.

## Completion evidence / stop

- Final global renderer exit0:36 sources,36 SVG,36 PNG,0 failures; fresh manifest hashes.
- Static verifier exit0;36 visual rows match final PNG hashes;177 local links, semantic scans, scope/index/HEAD and append-only historical logs pass. Final completion-state output: `docs/modeling/current-target/verification-output.txt`.
- All36 final images inspected; independent ACT-06 finding fixed and closed. Eleven-concern matrix and A–N report complete in `docs/modeling/current-target/review.md`.
- Required logs: T-DCP-001 / DCP-001. `git diff --check` exit0; observed whole-worktree stat and new-file line counts retained as evidence. No new architecture/product decision; decision log unchanged.
- Readiness: **READY FOR FINAL MODELING REVIEW**. Final modeling approval was not granted.
- Commit: NOT CREATED; no staging. Dirty baseline worktree/index and HEAD preserved.
- STOP. Next separate task: **FINAL MODELING REVIEW** by Product Owner/Codex, with its own recorded scope/authorization. No follow-on work is active.
- Completion archive: `plans/archive/2026-10-11-full-diagram-correction-pass-DONE.md`.

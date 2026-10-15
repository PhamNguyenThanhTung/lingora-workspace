# Report Functional Use Case Views — Resumption Approval

**Date:** 2026-10-12 (Asia/Saigon)  
**Status:** Approved bounded documentation/modeling continuation.  
**Approval evidence:** Direct user instruction is preserved in [REQUEST](2026-10-12-report-functional-usecase-views-resumption-REQUEST.txt). The user asked to continue because the new UC diagrams were not visible. The earlier task record remains preserved as a partial capture; this approval does not rewrite that history.

## Goal

Make the report-oriented functional Use Case set visible and complete the remaining bounded synchronization and verification from the interrupted task, while preserving the canonical UC catalog and leaving physical design untouched.

## Reviewed authority and constraints

- The active behavioral authority is `docs/use-case-specifications.md` and its current UC-01–UC-14 catalog. ADR-041 controls SRS interaction; ADR-042 adds the current Study Focus behavior in the existing context and supplementary-practice views.
- `docs/modeling/report-usecases/README.md` defines eight functional groups rendered as nine report diagrams; `VIEW-RUC-*` are diagram labels, not canonical use cases.
- The report task's original approval and partial capture remain historical evidence; this resumption is newly authorized by the direct user instruction above.
- No task approval authorizes application implementation, database work, or edits to the physical-design package.

## Scope and permitted files

- Preserve and verify the nine existing `docs/modeling/report-usecases/VIEW-RUC-*.puml` diagrams and their SVG/PNG outputs.
- Translate the remaining English staff-provisioning note in `VIEW-RUC-01-auth-profile.puml`; rerender and update only that diagram's SVG/PNG hashes in its render manifest.
- Synchronize `docs/presentation/usecase-activity-presentation.md` with the already-approved Study Focus options shown in VIEW-RUC-02/03; keep the detailed Vietnamese SRS narration and ten-minute structure.
- Update only necessary task lifecycle records: `plans/current-task.md`, this approved snapshot and request, the matching archive record, `plans/approved/README.md`, `plans/archive/README.md`, `HANDOFF.md`, `docs/QUICK-REF.md`, `logs/test-log.md`, and `logs/development-log.md`.
- Preserve all unrelated and concurrent workspace changes. Do not modify canonical physical-design sources, renders, verification, evidence, or reports.
- No code, Prisma, SQL/migrations, database, seed, deployment, stage, or commit.

## Acceptance and verification

1. The package retains eight functional groups and nine report diagram IDs; all nine source files and both render formats exist. These IDs do not create or renumber canonical UC IDs; catalog count remains 14, UC-03 reminder deferred, and Reassessment inactive.
2. PlantUML check-only succeeds for the nine report sources. Fresh render of the changed VIEW-RUC-01 source exits successfully; its SVG parses and PNG decodes. The render manifest hashes match every source/output pair.
3. Manual visual review confirms the nine report diagrams are legible and the staff-account note is Vietnamese. SRS remains system-selected with no learner due-list browsing and no dynamic SRS insertion into scored immutable Placement/Level-up versions. Teacher/Admin responsibilities remain intact.
4. The script describes the Study Focus capability reflected by VIEW-RUC-02/03 and continues to cover the PO SRS clarification and report views.
5. Local links resolve, edited task-owned text has no trailing whitespace, and `git diff --check` is clean. Observed commands, output, environment, HEAD, and a new-file line-count check are recorded. Runtime/product tests are N/A because this is documentation/modeling only.
6. The final task archive, current pointer, handoff, and quick reference state the resumption result without implying physical-design approval. No staging or commit.

## Review

The proposed scope follows the current ADR-041/042 behavior, preserves the current canonical catalog, and does not depend on or change physical schema/security design. The output files and accepted diagram set already exist; the remaining implementation is limited to the Vietnamese annotation and matching speaking-script synchronization, followed by targeted rendering and verification.

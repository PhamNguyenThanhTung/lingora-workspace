# Current Task — Archive Phase 0 and Legacy Report Artifacts to docs/archive/

**Status:** DONE
**Approval:** User explicit instruction (2026-10-10: "ok" to Step 2) authorizes bounded documentation-only task: organize stale Phase 0 documents (23 files) into `docs/archive/phase-0/` and legacy report drafts (4 files) into `docs/archive/historical-reports/`; create `docs/archive/README.md`; remove untracked temporary `docs/superpowers/` directory; update pointers in `docs/README.md`; and verify zero regressions. AGENTS.md permits direct authorization of documentation-only tasks by explicit user instruction. Zero application source, API, Prisma, migration, seed, RLS/RPC or DB data changes.
**Prior task:** Archive Stale Legacy Plans from Plans Root is DONE (`plans/archive/2026-10-10-archive-legacy-plans-from-plans-root-DONE.md`).

## Scope and permitted files/actions

1. Create directory structure:
   - `docs/archive/phase-0/`
   - `docs/archive/historical-reports/`
2. Move 23 Phase 0 documents from `docs/` root to `docs/archive/phase-0/`:
   - `docs/phase-0-corrective-implementation-report.md`
   - `docs/phase-0-final-independent-reverification-report.md`
   - `docs/phase-0-final-master-consolidation.md`
   - `docs/phase-0-final-product-owner-decision-sheet.md`
   - `docs/phase-0-final-reconciliation-log.md`
   - `docs/phase-0-final-requirements-audit.md`
   - `docs/phase-0-final-requirements-baseline-audit.md`
   - `docs/phase-0-final-user-research-and-requirements-audit.md`
   - `docs/phase-0-fix-plan-independent-review.md`
   - `docs/phase-0-independent-reverification-report.md`
   - `docs/phase-0-master-report-independent-review.md`
   - `docs/phase-0-master-report.md`
   - `docs/phase-0-mock-survey-report.md`
   - `docs/phase-0-presentation-artifacts-independent-audit.md`
   - `docs/phase-0-product-owner-approval-packet.md`
   - `docs/phase-0-product-owner-decision-sheet.md`
   - `docs/phase-0-requirements-gap-audit.md`
   - `docs/phase-0-role-content-workflow-review.md`
   - `docs/phase-0-roles-and-mvp-final.md`
   - `docs/phase-0-survey-requirements.md`
   - `docs/phase-0-synthetic-stakeholder-research.md`
   - `docs/phase-0-user-research-analysis-and-requirements-independent-review.md`
   - `docs/phase-0-user-research-analysis-and-requirements.md`
3. Move 4 historical report drafts/decks from `docs/` root to `docs/archive/historical-reports/`:
   - `docs/report-draft-analysis-design.md`
   - `docs/slide-deck-17-slides.md`
   - `docs/tai-lieu-phan-tich-yeu-cau.docx`
   - `docs/tai-lieu-phan-tich-yeu-cau.md`
4. Clean up untracked temporary `docs/superpowers/` directory.
5. Create `docs/archive/README.md` cataloging the archived collections and rationales.
6. Update reference in `docs/README.md` for `phase-0-roles-and-mvp-final.md`.
7. Verify `git diff --check`, unit tests, typecheck, and modeling checks.
8. Update logs, `HANDOFF.md`, and mark task `DONE`.

## Out of scope

No application source, API, dependency manifest, Prisma, migration, seed, RLS/RPC or DB data changes; no deletion of canonical documents (`01`–`08`, `use-case-specifications.md`, `QUICK-REF.md`, `README.md`, etc.).

## Work and acceptance

- [x] Create `docs/archive/phase-0/` and `docs/archive/historical-reports/`.
- [x] Move 23 Phase 0 files via `git mv`.
- [x] Move 4 historical report files via `git mv`.
- [x] Remove temporary untracked `docs/superpowers/`.
- [x] Author `docs/archive/README.md`.
- [x] Update pointer in `docs/README.md`.
- [x] Verify `git diff --check` and test suites PASS.
- [x] Record development log and test log entries.
- [x] Update `HANDOFF.md` and set `current-task.md` to `DONE`.

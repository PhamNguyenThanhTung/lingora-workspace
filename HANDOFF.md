# Lingora — Current handoff

**2026-10-16 · Stale design authority cleanup DONE — READY TO RESUME CLASS DIAGRAM.**

[Current task](plans/current-task.md) is the status pointer (stale-authority cleanup DONE; next task ready for authorization). The repository's design authority baseline is clean and disambiguated:
- **Clean design authority baseline**: All documents that could be mistaken for current product design have been audited and explicitly classified:
  - Obsolete Phase 2 master implementation plan (1,226 lines of outdated 6-role roadmap) archived to `plans/archive/2026-10-07-master-implementation-and-report-plan-SUPERSEDED.md` with explicit non-executable status banner.
  - Obsolete `docs/superpowers/` directory (`2026-10-11-drawio-native-render-parity.md` and spec) deleted.
  - Canonical and reference documents (`docs/00-master-plan.md`, `docs/01-architecture.md`, `docs/03-api-contract.md`, `docs/04-data-model.md`, `docs/06-system-analysis.md`, `docs/07-data-dictionary.md`, `docs/09-placement-and-jump-specification.md`, `docs/phase-1-*`) labeled with unambiguous top-level banners identifying historical/superseded sections (especially 6 roles superseded by ADR-034, AI GEC out of active scope per ADR-014, target physical schema PROPOSED/DEFERRED, Jump/Reassessment deferred by ADR-033/036).
  - Academic deliverables (`docs/project-1/`, `docs/report/`, `docs/presentation/`) isolated with directory READMEs identifying them as frozen academic snapshots, not current product design authority.
  - Decision log (`logs/decision-log.md`) reconciled with explicit superseded tags for ADR-014, ADR-019, ADR-020, ADR-026, ADR-027, and ADR-029.
  - Authority guard rule embedded in `AGENTS.md` and 5-tier source-of-truth chain formalized in `docs/README.md`.
- **Operating model & skill stack**: Fully tool-neutral and capability-based (DESIGN MODE vs IMPLEMENTATION MODE, proportional workflow gates, host-level skills Ponytail + Addy Osmani, no vendored superpowers framework, no departmental personas).
- **Design boundary: CLASS DIAGRAM IN PROGRESS (ready to resume).** Current product design is strictly governed by ADR-030–036/041/042, `docs/use-case-specifications.md` (14 canonical UCs), and `docs/modeling/current-target/` (8 canonical Activity diagrams). Exactly 3 business roles: `Admin`, `Teacher`, `Learner`.
- **Actual implementation**: Learner SSR auth/registration/logout and vi/en UI foundation only; no core learning flows, Admin app, or AI runtime. Prisma/migration/seed artifacts retain old incompatible role/data assumptions; live DB/deployment unverified.
- **Next permitted action**: User may authorize resuming Class Diagram review/completion. No follow-on task is active until recorded.
- **Verification**: Zero product code, Prisma schema, migration, or database changes. Clean `git diff --check`. Recorded in `T-STALE-AUTHORITY-001` in [test log](logs/test-log.md) and [development log](logs/development-log.md).

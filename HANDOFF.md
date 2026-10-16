# Lingora — Current handoff

**2026-10-16 · Portable skill stack finalized & vendored Superpowers removed DONE — READY TO CONTINUE CLASS DESIGN.**

[Current task](plans/current-task.md) is the status pointer (skill stack finalization DONE; next task ready for authorization). The development operating model in [AGENTS](AGENTS.md) is tool-neutral, lightweight, and capability-based:
- **Two operating modes**: DESIGN MODE (architecture/UML/ADR with light research delegation, no implementation worker ceremony) vs IMPLEMENTATION MODE (codebase-informed Implementation Spec in `plans/<slug>-spec.md`, safe work packages `WP-01`, `WP-02`...).
- **Proportional workflow gates & user authorization**:
  - Significant implementation: `inspect -> spec -> work packages -> implement & self-test -> review -> commit & report`.
  - Design/Modeling: `inspect -> analyze/design -> verify -> ADR/docs -> report`.
  - Small maintenance/Docs: `inspect -> fix -> test -> commit & report` (no artificial plan/approval gates for small fixes).
  - Explicit user authorization (e.g. *"Start implementing the homepage"*) directly authorizes spec drafting and implementation without a redundant second approval gate. Pauses only for genuine unresolved human decisions (ambiguity, destructive ops, material scope changes, source conflicts).
- **Capability-based roles**: User (product intent/scope), Coordinator/Planner (spec & work packaging), Executor (implementation, local tests & self-fix), Reviewer/Acceptance Authority (independent diff & acceptance verification). Supports both multi-agent and single-agent sequential execution. Permanent departmental personas (Frontend/Backend/PM) rejected; on-demand independent review personas permitted.
- **Host-level skill stack**: Generic engineering skills (TDD, systematic debugging, code review, Ponytail anti-overengineering) decoupled from the repository. All 14 vendored `obra/superpowers` skills, duplicated mirrors (`.codex/skills/`), and packaging manifests (`.agents/plugins/marketplace.json`, `.codex-plugin/plugin.json`) removed (104 files deleted). Global host skills used instead (Ponytail v5.2.0 installed globally in `~/.codex/skills/ponytail/`; `addyosmani/agent-skills` maintained at host level). Repository retains only `.agents/skills/pptx` as a specialized utility for canonical presentation decks in `docs/` and `.agents/references/`.

**Design boundary: CLASS DIAGRAM IN PROGRESS (unchanged).** Approved scoped ADR-030–036/041/042, current UC catalog and eight active Activity behaviors are the starting sources. Three roles only: Admin, Teacher, Learner.

**Actual implementation:** learner SSR authentication/registration/logout and vi/en UI foundation; no core learning flows, Admin app or AI runtime. Prisma/migration/seed artifacts retain old incompatible role/data assumptions; live DB/deployment unverified.

**Next permitted action:** user may authorize a separate Class Diagram review/completion task or an authorized design/implementation task. No product code or database schema was modified.

**Verification:** 104 files deleted cleanly; Ponytail global availability verified; AGENTS.md proportional gates & approval boundary verified; git diff clean. Recorded in T-SKILL-FINALIZE-001 in [test log](logs/test-log.md) and [development log](logs/development-log.md).

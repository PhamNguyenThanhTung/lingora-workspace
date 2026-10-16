# Lingora — Current handoff

**2026-10-16 · Tool-neutral workflow & skill stack audit DONE — READY TO CONTINUE CLASS DESIGN.**

[Current task](plans/current-task.md) is the status pointer (workflow audit DONE; next task ready for authorization). The development operating model in [AGENTS](AGENTS.md) is tool-neutral and capability-based:
- **Two operating modes**: DESIGN MODE (architecture/UML/ADR with light research delegation, no implementation worker ceremony) vs IMPLEMENTATION MODE (codebase-informed Implementation Spec in `plans/<slug>-spec.md`, work packages `WP-01`, `WP-02`...).
- **Capability-based roles**: User (product intent/scope), Coordinator/Planner (spec & work packaging), Executor (implementation, local tests & self-fix), Reviewer/Acceptance Authority (independent diff & acceptance verification). Supports both multi-agent and single-agent sequential execution.
- **Workflow discipline**: Lightweight `plans/current-task.md` pointer (no spec duplication); no artificial companion files (`*-REQUEST.txt`, `*-BASELINE.json`); worker self-fix separated from acceptance review; strictly one correction dispatch after Reviewer check, then STOP if blocking issues remain.
- **Skill stack**: Reusable engineering skills (TDD, systematic debugging, Ponytail anti-overengineering / code simplification) decoupled from vendor identities. Local skill mirrors (`.agents/skills/`, `.codex/skills/`) serve as runtime discovery adapters without hardcoding host dependencies.

**Design boundary: CLASS DIAGRAM IN PROGRESS (unchanged).** Approved scoped ADR-030–036/041/042, current UC catalog and eight active Activity behaviors are the starting sources. Three roles only: Admin, Teacher, Learner.

**Actual implementation:** learner SSR authentication/registration/logout and vi/en UI foundation; no core learning flows, Admin app or AI runtime. Prisma/migration/seed artifacts retain old incompatible role/data assumptions; live DB/deployment unverified.

**Next permitted action:** user may authorize a separate Class Diagram review/completion task or an authorized design/implementation task. No product code or database schema was modified.

**Verification:** smoke-test subagent invocation PASS, CLI availability inspected, skill discovery paths verified, git diff whitespace/stat exact. Recorded in T-TOOL-NEUTRAL-001 in [test log](logs/test-log.md) and [development log](logs/development-log.md).

# Lingora — Current handoff

**2026-10-16 · Workflow audit & simplification DONE — READY TO CONTINUE CLASS DESIGN.**

[Current task](plans/current-task.md) is the status pointer (workflow audit DONE; next task ready for authorization). The development operating model in [AGENTS](AGENTS.md) has been simplified and clarified:
- **Two operating modes**: DESIGN MODE (architecture/UML/ADR with light research delegation, no implementation worker ceremony) vs IMPLEMENTATION MODE (codebase-informed Implementation Spec in `plans/<slug>-spec.md`, work packages, parallel Antigravity execution).
- **Clear roles**: User interacts with Codex only; Codex is the brain/planner/orchestrator/acceptance authority; Antigravity workers own assigned work packages, run self-tests, and fix ordinary mechanical failures internally.
- **Workflow discipline**: Lightweight `plans/current-task.md` pointer (no spec duplication); no artificial companion files (`*-REQUEST.txt`, `*-BASELINE.json`); worker self-fix separated from final review; strictly one correction dispatch after Codex review, then STOP if blocking issues remain.
- **Orchestration status**: `Antigravity -> subagent` verified via native `invoke_subagent`. `Codex -> Antigravity` identified as CLI/handoff based (`agy` installed at `AppData\Local\agy\bin\agy.exe` but not in system PATH).

**Design boundary: CLASS DIAGRAM IN PROGRESS (unchanged).** Approved scoped ADR-030–036/041/042, current UC catalog and eight active Activity behaviors are the starting sources. Three roles only: Admin, Teacher, Learner.

**Actual implementation:** learner SSR authentication/registration/logout and vi/en UI foundation; no core learning flows, Admin app or AI runtime. Prisma/migration/seed artifacts retain old incompatible role/data assumptions; live DB/deployment unverified.

**Next permitted action:** user may authorize a separate Class Diagram review/completion task or an authorized design/implementation task. No product code or database schema was modified.

**Verification:** smoke-test subagent invocation PASS (`9db31188-4154-43fa-a852-ed8a263b71ad`), CLI availability inspected, git diff whitespace/stat exact. Recorded in T-WORKFLOW-AUDIT-001 in [test log](logs/test-log.md) and [development log](logs/development-log.md).

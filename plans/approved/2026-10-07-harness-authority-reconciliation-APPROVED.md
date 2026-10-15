# Harness Authority and Task-State Reconciliation — Approved Plan

**Approval:** The user explicitly authorized this documentation/control-only task on 2026-10-07. Scope is the requested authority, supersession, active-state, and unresolved-decision reconciliation.

**Goal:** Make the existing control structure sufficient for a fresh-context agent to identify repository state, controlling sources, the single task, and permitted actions.

**Permitted changes:** `AGENTS.md`; `docs/README.md`; `docs/QUICK-REF.md`; `docs/01-architecture.md`; `docs/04-data-model.md`; `ENVIRONMENT.md`; `HANDOFF.md`; `plans/current-task.md`; `plans/master-implementation-and-report-plan.md`; the archive/approved plan indexes as needed to explain preserved snapshots; and `logs/development-log.md` / `logs/test-log.md` for required evidence. Preserve the prior active task byte-for-byte in `plans/archive/` before replacing it.

**Constraints:** Do not change product or architecture decisions. Classify unresolved differences as `CONFLICT`/`OPEN` and place them in the existing master-plan P0 backlog. Do not modify application/AI source, Prisma, migrations, database state, packages, or generated diagrams. Do not rewrite existing approved plans or ADR history. Add no new Harness file.

**Acceptance:** Entry order and topic authority are explicit; CURRENT/TARGET/PROPOSED/HISTORICAL/SUPERSEDED/CONFLICT meanings are defined; current implementation evidence is distinguished from remote state; one task and its approval are recorded; Phase 2 has no implementation authority without its matching approved milestone plan; P0 conflicts have an existing owner; next permitted work is bounded decision planning only.

**Verification:** Review the diff and changed-file scope; run `git diff --check`; inspect authority, status, P0 IDs, and handoff references. Application tests are `N/A — no runtime behavior changes`.

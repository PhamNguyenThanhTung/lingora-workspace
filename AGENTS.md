# Lingora Agent Rules

This repository follows a gated development workflow. These rules apply to every coding agent and every subdirectory unless a more specific `AGENTS.md` adds stricter rules.

## Agent entry and source authority

At the start of every new task, read in this order:

1. `plans/current-task.md` — the single task-status pointer: current scope, approval, status, and permitted work; if its task is `DONE`, no follow-on task is active until a new one is recorded
2. `docs/QUICK-REF.md` — concise CURRENT/TARGET/CONFLICT snapshot and source pointers
3. `HANDOFF.md` — operational state, unresolved entry conditions, and next permitted action
4. `docs/README.md` — authority order and CURRENT/TARGET/PROPOSED/HISTORICAL/SUPERSEDED/CONFLICT classifications

The task-specific source selected by `docs/README.md` controls its topic. `AGENTS.md` controls agent workflow; it does not approve product behavior. A decision is approved only when the designated approval record says so. A task status alone, a design document, a test log, or a later edit does not approve a decision.

Do not reread canonical documents merely to reconfirm information already available in `docs/QUICK-REF.md`.
Read the canonical source only when the task actually requires its detail. During the same uninterrupted
task/session, do not reread `HANDOFF.md` unnecessarily after the initial session/gap read.

## Task routing

- Planning, milestones, or priority: `docs/QUICK-REF.md` plus the relevant `docs/00-master-plan.md` section.
- Architecture, stack, or repository boundary: `docs/01-architecture.md`.
- Requirements or scope: `docs/02-requirements.md`.
- API paths or contracts: `docs/03-api-contract.md`.
- Database, RLS, or migrations: `docs/04-data-model.md`.
- Requirement traceability or test mapping: `docs/05-traceability-matrix.md`.
- UI/UX: `DESIGN.md`.
- Current task or continuation: `plans/current-task.md` and `HANDOFF.md` when applicable.
- Documentation-only: `plans/current-task.md` and `docs/QUICK-REF.md`, then only the affected canonical source.

Read `docs/00-master-plan.md` only when the task involves:
- planning a new milestone or changing a priority tier (P0/P1/P2)
- verifying or referencing assumptions G1–G6 or principles §0.2
- the 12-week roadmap (§0.4) or the final delivery checklist (§0.5)

Read only when the task requires it:

| Task involves | Also read |
|---|---|
| API paths, request/response, error envelope | `docs/03-api-contract.md` |
| Database schema, RLS, RPC, migrations | `docs/04-data-model.md` |
| System architecture, tech stack, repo boundaries | `docs/01-architecture.md` |
| Report scope, Must/Nice deliverables | `docs/02-requirements.md` |
| UI/UX, screens, design tokens | `DESIGN.md` |
| Requirement traceability or test mapping | `docs/05-traceability-matrix.md` |

`docs/README.md` defines the source hierarchy. A document's location in `docs/` does not by itself make every statement current or approved. Where sources conflict, stop dependent work, preserve the conflict, and route it to the owner in the active decision backlog. Do not infer implementation requirements from historical or target design prose. `ke-hoach-chi-tiet/` has been removed; it is no longer in the repository.

## Mandatory workflow

Every feature, architecture, schema, API, security, or product-behavior task must pass through:

`PLAN → REVIEW → APPROVE → IMPLEMENT → TEST → LOG → COMMIT`

- `PLAN`: write or update `plans/current-task.md` with scope, permitted files/actions, dependencies, acceptance criteria, and verification.
- `REVIEW`: check the plan against controlling sources and the unresolved-decision queue.
- `APPROVE`: a human explicitly approves the plan; preserve an immutable snapshot under `plans/approved/` before implementation.
- `IMPLEMENT`: do only the approved work. The approved plan is not blanket authorization for dependent decisions.
- `TEST`: run the approved verification and record observed output.
- `LOG`: update required task and evidence logs.
- `COMMIT`: use a Conventional Commit after the required gates.

An explicit user instruction may authorize a bounded documentation-only task directly. Record that scope and the instruction as its approval evidence; it does not authorize product implementation or resolve dependent product decisions.

After implementation begins, use `IMPLEMENTING`, then `TESTING`, and finally `DONE`. Use `BLOCKED` only when work cannot safely continue.

## Stop rules

Pause implementation and return the task to `REVIEW` status immediately if any of the following is true. Do not patch around a Stop condition silently — report the gap and wait for resolution:

- A dependency, schema, API path, or architecture change is implied but not named in the plan.
- A semantic gap appears between an approved decision and implementation reality.

## AI Coding Agents & Responsibilities

Codex owns discovery, planning, review and acceptance. Antigravity / Gemini workers own approved implementation and test execution. Codex may perform directly authorized documentation, audit and repository-plumbing cleanup.

- **Codex**:
  - Discovery & Architecture
  - Specification & Planning
  - Review & Verification
  - Acceptance & Gatekeeping
- **Antigravity / Gemini workers**:
  - Implementation & Coding
  - Test Execution & Verification
  - Fix implementation issues according to plan and review

Delegate when the task benefits from it. Parallel workers require independent dependencies, explicit file ownership, safe shared state and clear contracts; there is no fixed worker count. The coordinator alone writes shared logs, current-task/HANDOFF and aggregate artifacts unless a safe merge owner is explicit. Read-only audit subagents may inspect independent areas.

Codex inspects the actual diff and reruns relevant checks before acceptance; a worker's `PASS` alone is insufficient. Across task and final review, allow one bounded correction dispatch, then review and verify again. If blocking findings remain, STOP dependent work, return the task to REVIEW and report; do not start another correction/model-escalation loop or accept it anyway.

These rules override generic skill defaults on worker roles, model routing, review rounds, commit timing and handoffs. Actual runtime tool schemas control arguments; do not change global settings to satisfy a skill example. Maintain reusable skills in `.agents/skills/`; `.codex/skills/` is its existing mirrored runtime discovery copy, not a second workflow authority.

## Agent Workflow & Methodology: Superpowers

The repository uses **Superpowers** ([https://github.com/obra/superpowers](https://github.com/obra/superpowers)) as the single canonical skill and workflow framework shared by both Codex and Antigravity. No competing or parallel workflow framework (such as Impeccable or legacy local skill trees) is maintained.

All agents follow Superpowers methodology:
- Disciplined planning, specification teasing, and design signoff before code changes.
- True test-driven development (TDD) and systematic debugging.
- Comprehensive verification before completion.
- Consistent code review and finish-the-branch procedures.

Skills are shared across `.agents/skills/` and `.codex/skills/`:
`brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `finishing-a-development-branch`, `subagent-driven-development`, `dispatching-parallel-agents`, `using-git-worktrees`, `using-superpowers`, `writing-skills`.

Configuration in `.agents/` and `.codex/` provides tool-specific plumbing for agent runtimes. It must not restate or override canonical rules. If any conflict arises, canonical documentation and this file win.

## Testing and logs

After implementation:

1. Run every test listed in the approved Test Plan.
2. Record results in `logs/test-log.md` using the mandatory evidence format:
   - **Environment:** OS, runtime version, commit SHA.
   - **Command:** exact shell command or script invoked.
   - **Output:** exit code and stdout/stderr excerpt (trim to relevant lines; redact secrets).
   - **Verdict:** `PASS` or `FAIL` — always from observed output, never inferred. For documentation-only tasks with no runnable command: verdict is `N/A — <reason>`; still attach at minimum `git diff --stat` output and a line-count check for new files. An agent must not record `PASS` based on reasoning alone.
3. Record completed work, problems, solution, tests, and commit in `logs/development-log.md`.
4. Record architecture or technical decisions in `logs/decision-log.md` using the ADR template.
5. Record trained/evaluated model versions only in `logs/model-registry.csv`; do not invent metrics outside the master plan.
6. Do not mark the task `DONE` while required tests fail or required logs are missing.

## Documentation lifecycle

- Active plan: `plans/current-task.md`.
- Approved plan snapshot: `plans/approved/`.
- Completed or superseded plan: `plans/archive/`.
- Update `HANDOFF.md` whenever a task moves to `DONE` or `BLOCKED`. Keep only the current handoff state — it is not a history log.
- Do not overwrite historical approved/archive records.
- Update canonical docs only when the approved task requires a durable project change.
- Keep filenames and identifiers stable once referenced by a report, test, migration, API, or model registry entry.

## Git discipline

- Inspect `git status` before editing and preserve unrelated user changes.
- Use Conventional Commits.
- Do not commit before the `TEST` and `LOG` gates are complete.
- Do not amend, reset, force-push, or rewrite history unless the user explicitly requests it.

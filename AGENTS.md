# Lingora Agent Rules

This repository follows a gated development workflow. These rules apply to every coding agent and every subdirectory unless a more specific `AGENTS.md` adds stricter rules.

## Source of truth

Always read before planning or changing anything:

1. `plans/current-task.md` — active task scope and status
2. `docs/QUICK-REF.md` — project snapshot: stack, milestones, API, DB, storage, constraints
3. `HANDOFF.md` — read at the start of a new agent session or when resuming after a task gap. Contains: current state, pending decisions, and what NOT to do next.

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

The canonical documents in `docs/` govern all new work immediately. `ke-hoach-chi-tiet/` has been removed; it is no longer in the repository.

## Mandatory workflow

Every feature or behavior-changing task must pass through:

`PLAN → REVIEW → APPROVE → IMPLEMENT → TEST → LOG → COMMIT`

- `PLAN`: write or update `plans/current-task.md`.
- `REVIEW`: inspect the plan against architecture, requirements, contracts, data model, risks, and scope.
- `APPROVE`: a human explicitly changes the task status to `APPROVED` and completes the Approval section.
- `IMPLEMENT`: make only the approved changes.
- `TEST`: run the approved test plan and record evidence.
- `LOG`: update the relevant files under `logs/`.
- `COMMIT`: commit only after tests and logs are complete.

Agents must never move a task from `DRAFT` or `REVIEW` to `APPROVED`. Explicit user approval is required. If `plans/current-task.md` is not `APPROVED`, do not implement feature code.

After implementation begins, use `IMPLEMENTING`, then `TESTING`, and finally `DONE`. Use `BLOCKED` only when work cannot safely continue.

If a task returns to `REVIEW` more than twice because of the same gap category, the agent must escalate: propose a formal scope amendment rather than continue patching individual decisions. Each REVIEW re-entry must include a `category:` tag in its `logs/decision-log.md` entry (one of: `runtime-boundary`, `rls-conflict`, `scope-ambiguity`, `missing-dependency`, `contract-gap`, `test-failure`). This makes the escalation threshold grep-verifiable rather than judgment-dependent.

## Stop rules

Pause implementation and return the task to `REVIEW` status immediately if any of the following is true. Do not patch around a Stop condition silently — report the gap, set `plans/current-task.md` status to `REVIEW`, and wait for human resolution.

- A file outside `Files Expected To Change` needs modification.
- A dependency, schema, API path, or architecture change is implied but not named in the approved task.
- A semantic gap appears between an approved decision and implementation reality (e.g. a contract assumption that does not hold in the live system).
- A security boundary, RLS policy, or trust model must be altered to make the approved change work.
- A test result contradicts a claim made in the approved plan.

## AI Coding Agents & Responsibilities

The project standardizes on two coding agents with distinct responsibilities:

- **Codex**:
  - Discovery & Architecture
  - Specification & Planning
  - Review & Verification
  - Acceptance & Gatekeeping
- **Antigravity**:
  - Implementation & Coding
  - Test Execution & Verification
  - Fix implementation issues according to plan and review

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

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

## Two operating modes

The repository distinguishes two modes to avoid forcing implementation overhead onto design tasks:

1. **DESIGN MODE**: Used while architecture, product modeling, requirements, or diagrams are being developed (Use Cases, Activity Diagrams, Class Diagrams, UX flow, ADRs).
   - Flow: User intent → Coordinator inspects canonical sources → analyzes/designs → optionally delegates bounded research or mechanical drawing drafting → Reviewer reviews → decisions recorded in ADR/docs → report to user.
   - Design tasks do NOT use work-package decomposition or implementation worker orchestration.

2. **IMPLEMENTATION MODE**: Starts only after the relevant design boundary has been approved (e.g. *"Start implementing the homepage"*).
   - Flow: User triggers implementation → Coordinator inspects actual codebase and approved design → challenges assumptions if codebase disagrees → writes Implementation Spec → splits into safe Work Packages → Executes via Executor(s) (concurrent when safe, or sequential) → Executor(s) implement, self-test, self-fix → Reviewer independently reviews and verifies → PASS (report to user) or one correction round → STOP and report to user if blocking issues remain.

## Mandatory workflow gates

Every feature, architecture, schema, API, security, or product-behavior task must pass through:

`PLAN → REVIEW → APPROVE → IMPLEMENT → TEST → LOG → COMMIT`

- `PLAN`: produce the Implementation Spec (`plans/<feature-slug>-spec.md`) informed by actual codebase inspection. Set `plans/current-task.md` as a lightweight pointer.
- `REVIEW`: check the plan against controlling sources and unresolved decisions.
- `APPROVE`: a human explicitly approves the plan; preserve an immutable snapshot under `plans/approved/<YYYY-MM-DD>-<feature-slug>-spec-APPROVED.md` before implementation. Ordinary tasks do not require artificial companion files (`*-REQUEST.txt`, `*-BASELINE.json`).
- `IMPLEMENT`: do only the approved work via work packages.
- `TEST`: run approved verification and record observed output.
- `LOG`: update required task and test evidence logs.
- `COMMIT`: use a Conventional Commit after the required gates.

An explicit user instruction may authorize a bounded documentation-only task directly. Record that scope and instruction as approval evidence; it does not authorize product implementation or resolve dependent product decisions.

Status progression: `PLAN` → `REVIEW` → `APPROVED` → `IMPLEMENTING` → `TESTING` → `DONE`. Use `BLOCKED` only when work cannot safely continue.

## Stop rules

Pause implementation and return the task to `REVIEW` status immediately if any of the following is true. Do not patch around a Stop condition silently — report the gap and wait for resolution:

- A dependency, schema, API path, or architecture change is implied but not named in the plan.
- A semantic gap appears between an approved decision and implementation reality.
- An unresolved product/design decision requires human judgment.

## Roles & Responsibilities

The user interacts primarily with the primary agent interface (Coordinator). The user does not manage low-level worker execution, subagent selection, model routing, reasoning levels, or task partitioning.

- **User**:
  - Owns product intent, major scope, human judgment, and authorization to begin major phases.
- **Coordinator / Planner**:
  - Repository discovery: inspects the actual codebase before finalizing plans.
  - Checks approved design against current implementation; challenges assumptions if codebase disagrees.
  - Creates the Implementation Spec with concrete acceptance criteria and dependencies.
  - Decomposes tasks into safe work packages and decides when concurrent execution is safe.
- **Executor**:
  - Owns complete assigned work package: `understand assignment → implement → test → diagnose failures → fix ordinary failures (worker self-fix) → return code + evidence`.
  - Allowed full autonomy within assigned scope: editing code, adding/updating tests, running lint/typecheck/tests, fixing ordinary mechanical errors, local refactoring.
  - May use internal subagents when supported by the host and useful, without Coordinator micromanagement.
  - Must NOT independently change product scope, rewrite architecture, alter unrelated modules, make destructive migrations, or silently expand features. Escalate these to Coordinator.
- **Reviewer / Acceptance Authority**:
  - Independent acceptance: does NOT trust worker `PASS` claims.
  - Inspects diffs, code quality, architecture alignment, deterministic test results, and cross-package integration.

### Host Flexibility & Execution Modes

The repository is host-neutral. A single agent may perform multiple roles if the host environment does not support multiple agents:
- **Multi-agent execution**: Coordinator partitions work and delegates to concurrent or sequential Executor agents, followed by Reviewer verification.
- **Single-agent execution**: A single agent sequentially plans, implements, self-tests, and verifies against acceptance criteria.
- **Invariant**: Correctness, safety, and evidence standards must NEVER depend on parallel-agent availability.

*(Optional personal host mapping: in the maintainer's personal setup, Codex acts as Coordinator/Reviewer, Antigravity as Executor, and internal Antigravity subagents as task helpers. This is a local host adapter choice, not a project requirement.)*

## Implementation Spec & current-task lifecycle

1. **One Implementation Spec per task**:
   - Stored in `plans/<feature-slug>-spec.md`.
   - Reuses existing planning conventions; do not maintain redundant `plan.md`, `spec.md`, `execution-plan.md`.
   - Content: Goal, Approved sources, Existing implementation, Scope, Out of scope, Expected behavior, Key technical decisions, Acceptance criteria, Dependencies, Work packages (`WP-01`, `WP-02`...), Parallelization, Integration order, Verification, Open blockers.
   - References canonical documents; does not duplicate large blocks of ADRs or designs.
2. **`plans/current-task.md` as lightweight pointer**:
   - Acts as a state pointer, not a full duplicate of the spec.
   - Records: Active task name, Implementation Spec link, Status, Active Work Packages, Next permitted action.
3. **Approval & Archive**:
   - Approved snapshot saved to `plans/approved/<YYYY-MM-DD>-<feature-slug>-spec-APPROVED.md`.
   - On completion, record completion in `plans/archive/<YYYY-MM-DD>-<feature-slug>-spec-DONE.md` and set `plans/current-task.md` to `DONE`.

## Work-package decomposition & Safe parallelism

The Coordinator decomposes work after inspecting the codebase.
- **Work Package contents**: goal, scope, owned files/areas where practical, dependencies, input contract, output contract, acceptance checks.
- **Delegation payload**: Coordinator provides work-package goal, relevant file paths, relevant canonical sources, constraints, acceptance checks, and contracts. Do not dump the entire repository documentation into worker prompts.
- **Safe parallelism criteria**:
  - Clear, stable API/data contracts between packages.
  - Disjoint file ownership (no two workers modifying the same file/component).
  - Independent dependencies and isolated tests.
- **Unsafe/Prohibited parallelism**: concurrent edits to same files, concurrent API design, undocumented shared state, conflicting migrations.
- **Worker count**: Determined by host capability. Exactly 1 worker (or sequential execution) is standard when parallelism offers no real benefit.

## Worker self-fix versus Final-review correction

Distinguish internal worker fixes from external review rounds:
1. **Worker self-fix**: During implementation, the Executor may perform as many ordinary mechanical corrections (syntax, lint, compiler, unit test failures) as needed to complete its package. This is NOT a review round.
2. **Reviewer independent review**: The Reviewer inspects the actual diff, code quality, architecture alignment, deterministic test results, and cross-package integration.
3. **Final-review correction**:
   - If defects remain after Reviewer acceptance review, Reviewer provides concrete findings.
   - Executor receives **ONE** bounded correction round.
   - Reviewer re-reviews.
   - If blocking issues still remain: **STOP**, do not fake `PASS`, and report remaining problems to the user. No indefinite review loops.

## Completion report format

When implementation succeeds, the user receives a compact summary:
- Feature status: `COMPLETE`
- Implemented items
- Work package results (e.g. WP-01 PASS, WP-02 PASS)
- Independent verification (typecheck PASS, unit tests PASS, integration PASS, acceptance criteria PASS)
- Key decisions made
- Remaining/deferred items (if any)
- Changed files and commit SHA

## Engineering Disciplines & Reusable Skills

The repository expects standard software engineering disciplines:
- Disciplined planning, TDD, systematic debugging, comprehensive verification before completion, code review.
- **Anti-overengineering bias (Ponytail / Code Simplification)**: YAGNI, standard/native platform solutions first, fewest necessary files, minimum correct diff, no speculative abstractions; understand before simplifying. Never cut validation, security, error handling, or approved requirements.
- Reusable skills (such as `addyosmani/agent-skills`, `Ponytail`, or `superpowers`) may be supplied by the host environment or global configuration.
- Local skill directories (`.agents/skills/`, `.codex/skills/`) serve as runtime discovery adapters for environments that inspect project roots. Canonical rules in `AGENTS.md` control project behavior and override any generic skill defaults (such as 5-round review loops, automatic model escalation, or rigid subagent pairing).

## Testing and logs discipline

After implementation:
1. Run tests listed in the approved Verification plan.
2. Record results in `logs/test-log.md` with mandatory evidence format (Environment, Command, Output, Verdict `PASS`/`FAIL` from observed output).
3. Record completed work, problems, solutions, and commit in `logs/development-log.md`.
4. Record architecture or product decisions in `logs/decision-log.md` ONLY when a genuine ADR is created/updated. Do not add empty decision log entries for routine code tasks.
5. Record trained/evaluated models ONLY in `logs/model-registry.csv`.
6. Do not mark the task `DONE` while required tests fail or required logs are missing.

## Documentation lifecycle

- Active plan: `plans/current-task.md` (pointer).
- Approved spec: `plans/approved/`.
- Completed or superseded spec: `plans/archive/`.
- Update `HANDOFF.md` whenever a task moves to `DONE` or `BLOCKED`. Keep only the current handoff state — it is not a history log.
- Do not overwrite historical approved/archive records.
- Update canonical docs only when the approved task requires a durable project change.
- Keep filenames and identifiers stable once referenced by a report, test, migration, API, or model registry entry.

## Git discipline

- Inspect `git status` before editing and preserve unrelated user changes.
- Use Conventional Commits.
- Do not commit before the `TEST` and `LOG` gates are complete.
- Do not amend, reset, force-push, or rewrite history unless the user explicitly requests it.

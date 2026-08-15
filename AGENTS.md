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

## Supporting Agent Skills

Project-local Agent Skills are advisory tools used only within the applicable phase. They never override this `AGENTS.md`, canonical documentation, an approved task, or a human approval gate. A skill cannot approve a task, change the mandatory workflow, broaden scope, or authorize implementation.

- `source-driven-development`: use during `PLAN`/`REVIEW` and for evidence-backed implementation.
- `security-and-hardening`: use during `REVIEW`/`IMPLEMENT`/`TEST` for security-sensitive work.
- `debugging-and-error-recovery`: use during `TEST` and diagnostic failure recovery.
- `code-review-and-quality`: use during `TEST` for post-implementation quality review and before `COMMIT`.

If skill guidance conflicts with the approved scope or Lingora rules, stop and follow the Lingora source of truth and approval process.

Configuration in `.agents/` and `.codex/` is tool-specific plumbing for individual agent runtimes. It must not restate or override the rules in this file. If a conflict exists between `.agents/` or `.codex/` configuration and `AGENTS.md`, this file wins.

## Change controls

Do not make any of the following changes without an approved task that names the change explicitly:

1. Change the system architecture or repository boundaries.
2. Add, remove, or upgrade a dependency without a recorded reason and impact review.
3. Change the database schema, migration history, RLS policy, trigger, or RPC.
4. Change an API path, request/response field, error envelope, or compatibility rule.
5. Change DKT-LSTM, HLR, Scheduler, Transformer, T5-small, tokenization, training, or evaluation architecture.
6. Move work between Must and Nice scope.
7. Delete or alter existing behavior merely to make code cleaner when the approved task does not require it.
8. Refactor unrelated code, rename unrelated files, or expand scope opportunistically.

When an approved task requires one of these changes, record the decision in `logs/decision-log.md` before or alongside implementation.

## Implementation rules

- Change only files listed in `Files Expected To Change`. If another file becomes necessary, return the task to `REVIEW` unless the change is purely generated output already covered by the plan.
- When a known limitation or approved technical debt is traceable to a specific line of code, insert a structured comment at that location: `// LINGORA-DEBT: <one-line description> — see <ADR-NNN> or <doc>§<section>`. Example: `// LINGORA-DEBT: size enforcement at RLS only, not bucket boundary — see ADR-005 §SEC-D8`. Use only when the limitation is recorded in an approved ADR or plan; do not add speculative debt comments.
- Preserve backward compatibility unless the approved acceptance criteria explicitly allow a breaking change.
- Do not place secrets in code, logs, screenshots, fixtures, or commits.
- Do not create feature code, migrations, endpoints, UI, training jobs, or dependencies during planning/framework tasks.
- Keep Project 1, ML, and NLP as three evaluation views of one product, not three unrelated products.
- Impeccable may guide frontend design work and `DESIGN.md`; it must not decide backend, database, API, ML, or NLP architecture.

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

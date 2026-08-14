# Lingora Agent Rules

This repository follows a gated development workflow. These rules apply to every coding agent and every subdirectory unless a more specific `AGENTS.md` adds stricter rules.

## Source of truth

Always read before planning or changing anything:

1. `plans/current-task.md` — active task scope and status
2. `docs/QUICK-REF.md` — project snapshot: stack, milestones, API, DB, storage, constraints

Read `docs/00-master-plan.md` sections 0.1–0.3 only when the task involves:
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

## Supporting Agent Skills

Project-local Agent Skills are advisory tools used only within the applicable phase. They never override this `AGENTS.md`, canonical documentation, an approved task, or a human approval gate. A skill cannot approve a task, change the mandatory workflow, broaden scope, or authorize implementation.

- `source-driven-development`: use during `PLAN`/`REVIEW` and for evidence-backed implementation.
- `security-and-hardening`: use during `REVIEW`/`IMPLEMENT`/`TEST` for security-sensitive work.
- `debugging-and-error-recovery`: use during `TEST` and diagnostic failure recovery.
- `code-review-and-quality`: use during `TEST` for post-implementation quality review and before `COMMIT`.

If skill guidance conflicts with the approved scope or Lingora rules, stop and follow the Lingora source of truth and approval process.

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
- Preserve backward compatibility unless the approved acceptance criteria explicitly allow a breaking change.
- Do not place secrets in code, logs, screenshots, fixtures, or commits.
- Do not create feature code, migrations, endpoints, UI, training jobs, or dependencies during planning/framework tasks.
- Keep Project 1, ML, and NLP as three evaluation views of one product, not three unrelated products.
- Impeccable may guide frontend design work and `DESIGN.md`; it must not decide backend, database, API, ML, or NLP architecture.

## Testing and logs

After implementation:

1. Run every test listed in the approved Test Plan.
2. Record results in `logs/test-log.md`, including environment and build/commit.
3. Record completed work, problems, solution, tests, and commit in `logs/development-log.md`.
4. Record architecture or technical decisions in `logs/decision-log.md` using the ADR template.
5. Record trained/evaluated model versions only in `logs/model-registry.csv`; do not invent metrics outside the master plan.
6. Do not mark the task `DONE` while required tests fail or required logs are missing.

## Documentation lifecycle

- Active plan: `plans/current-task.md`.
- Approved plan snapshot: `plans/approved/`.
- Completed or superseded plan: `plans/archive/`.
- Do not overwrite historical approved/archive records.
- Update canonical docs only when the approved task requires a durable project change.
- Keep filenames and identifiers stable once referenced by a report, test, migration, API, or model registry entry.

## Git discipline

- Inspect `git status` before editing and preserve unrelated user changes.
- Use Conventional Commits.
- Do not commit before the `TEST` and `LOG` gates are complete.
- Do not amend, reset, force-push, or rewrite history unless the user explicitly requests it.

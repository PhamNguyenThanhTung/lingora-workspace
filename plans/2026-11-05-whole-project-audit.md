# Whole-project maturity audit — 2026-11-05

## Objective and boundary

Determine what Lingora actually does today, whether a learner can complete a useful language-learning loop, and its maturity as a school project, usable MVP, and production service. Treat README, roadmap, prior ACCEPTED labels, and saved evidence as claims to check, not current runtime proof.

Read-only audit: no application/test/config changes, fixes, commits, pushes, deployments, remote mutations, registrations, emails, migrations, seed/reset, or cleanup of existing resources. The only repository writes are this plan and new audit report/evidence under `plans/evidence/whole-project-audit-20261105/`. Disposable loopback databases, test fixtures, generated build output, and owned local processes are allowed for verification after inspecting their commands. Do not read secrets into logs or print credentials/session cookies. Do not overwrite existing screenshots/evidence; redirect outputs or run affected checks in an isolated disposable copy that includes the dirty tree.

Baseline: `main`, HEAD `02acd2f79d99441fe19966be2512b453c5b7d1ca`. The starting tree contains tracked edits and untracked admin audit-viewer source/tests/plans; retain all of them. Audit the actual dirty tree, explicitly separating committed behavior from uncommitted behavior. Record Git status again at completion and account for audit-generated files.

## Scope and evidence rules

Inspect both Next.js workspaces, shared PostgreSQL/Prisma schema and migrations, seed/content readiness, auth/provider boundaries, runtime packaging, test harnesses, build/deploy configuration, and user-facing flows. Use docs only to establish intended scope and compare it against source/runtime. Assume a small class with concurrent learners, teachers, and admins; do not claim large-scale capacity without measurement.

For every capability, record one of: absent; schema only; source implemented; passes isolated runtime; passes real local integration; externally verified. Give source locations, exact commands/status, environment, and current result. Harnesses mocking Next navigation, auth, Prisma, or the provider must be labeled; successful browser rendering of a harness does not prove deployed Next + real provider + PostgreSQL integration. A schema model alone is not a working feature.

Trace these vertical flows:

- Learner registration → email confirmation/PKCE → session → account bootstrap → context/course/level selection and pause/resume.
- Learner catalogue → published lesson → reading/media/vocabulary → consumption persistence → practice answers → feedback → finalization/completion → reload/resume/progress.
- Admin language/framework/level/course/unit/lesson setup and teacher provisioning/assignment → Teacher draft/content/exercise authoring → submit → Admin review/reject/approve/publish → learner visibility.
- Assessment authoring versus learner assessment delivery/results; SRS cards versus usable review sessions; reporting/audit viewer versus complete report use cases. Verify route/service/UI reachability for each before calling it implemented.
- Roles/ownership, unpublished content and grading-secret boundaries, input validation, transaction/idempotency/concurrency behavior, stale/disabled sessions, failures/retries, and mobile/keyboard usability.

Assess learning usefulness separately from CRUD completeness: meaningful available curriculum, supported exercise/media types, feedback quality, durable progress, a repeatable next-learning/review loop, and clear limits in assessment/SRS/adaptivity/speaking. Missing planned features are maturity gaps, not security defects by default.

## DAG and ownership

| Package | Owner | Depends on | Read scope and delivery |
|---|---|---|---|
| P0 baseline/spec | Sol High planner + Luna coordinator | none | This plan; Git state; scripts/config; authorization and runtime safety checks. No worker dispatch by planner. |
| A learner product | Anti audit worker A | P0 | `lingora-web/src/**`, learner tests, relevant schema and docs; capability/learning-loop matrix and concrete findings in `learner.md`. |
| B staff/content/data | Anti audit worker B, or same Anti worker sequentially | P0 | `lingora-admin/src/**`, Prisma/migrations/seed, admin tests; author-to-published-content trace, schema-only gaps and findings in `staff-data.md`. |
| C runtime verification | One Anti runtime owner | P0; source/test preflight from A/B | Own all test/build/server processes and shared generated output; exact gate logs and browser evidence in `runtime/`, result summary in `runtime.md`. |
| D independent acceptance | New Sol High review pass; Luna final synthesis | A + B + C | Independently inspect material findings, code paths and current evidence; report maturity/verdict and remaining unknowns in `review.md` / `report.md`. |

A and B may read in parallel; they write only their own new evidence files. One worker can own A+B+C to avoid overhead. Runtime checks are sequential where ports, `.next`, generated Prisma clients, fixtures, or database state overlap. No worker edits source or recursively delegates. Runtime owner sends precise failures to the coordinator; no correction/fix round is authorized for this audit.

## Runtime verification contract

Before execution, inspect command bodies and harnesses for external calls, destructive DB setup, environment fallback and output paths. Replace inherited real provider/DB credentials with explicit synthetic loopback values where compatible. Never load `.env` into broad logs. If a test cannot be bounded to disposable owned resources, mark it not run and explain the evidence limit.

1. Record Node/npm versions, dependency availability, Git baseline and dirty paths. Inspect lockfile/scripts; avoid an install unless needed and it can preserve the tree.
2. Run `npm run db:product:validate`, `npm run typecheck`, and `npm run build` against explicit synthetic/loopback configuration. Record each workspace outcome independently. Build success proves packaging, not working provider/database access.
3. Run `npm run test:feature` and `npm run test:components`; inspect coverage fidelity, skipped tests, mock boundaries and route wiring. Preserve first failures and distinguish application failures from harness failures.
4. Run disposable DB commands individually: `npm run test:integration:lessons`, `npm run test:integration:practice`, `npm run test:integration:onboarding`, and `npm run test:integration:audit -w lingora-admin`. Verify `scripts/local-test-db.mjs` really supplies owned loopback URLs. The README claims a concurrent onboarding fixture race; run the default command as written. A supplementary sequential run may diagnose it but must not replace a failed default result.
5. After fresh builds, preflight and run `npm run test:e2e`, `npm run test:smoke:audit -w lingora-admin`, and `npm run test:browser:confirmation -w lingora-web` if their resources are safely local. The confirmation test uses a synthetic provider and intercepts its landing; report exactly that limit.
6. Inspect a real local production Next login/register and unauthenticated protected routes in a browser. Verify authenticated learner/staff UI through safe existing harnesses, and inspect PostgreSQL integration evidence separately. Prefer one joined local Next → API → PostgreSQL flow if existing harnesses support it without implementation. Otherwise explicitly report the missing joined proof. Capture useful desktop/mobile views, browser errors, and representative failure/retry behavior.
7. Inspect content availability from seed/source, or SELECT-only access to an already authorized data source if available. No live/public write tests, email confirmation attempts or provider modifications. Public deployment status is not required; external readiness remains unverified unless current permitted read-only evidence proves it.

Stop an individual check on a real blocker, retain its logs, and continue independent safe checks. Stop only owned local processes/databases. Do not repair failures or hide them behind a narrower command. No need to repeat passed checks unless a new concern changes their validity.

## Acceptance and report

- Both workspaces and their main flows have a source-backed capability matrix, with schema-only/planned features distinct from working runtime behavior.
- Every executed check has cwd, exact command, exit code, tested dirty-tree provenance, environment/mocking limits, and log path. Blocked/not-run checks have concrete reasons. No historical PASS is presented as a current rerun.
- Every actionable finding has a concrete trigger, observed/traceable wrong behavior, impact, source lines, evidence, and smallest suggested fix. Rank must-fix / should-fix / nice-to-have; deduplicate and cap at 20 material findings. No speculative scale/security findings or style-only complaints.
- Give a direct answer on whether this is a real language-learning application, what a learner can accomplish today, and the maturity of school delivery, usable MVP and production operation. Distinguish confirmed bugs, missing product capabilities, insufficient curriculum and missing proof. Test counts alone do not establish learning efficacy or production readiness.
- End with the highest-value next steps and explicit unchecked areas, including real provider registration/confirmation and public operation where unverified. Independent senior review checks material findings and the conclusion; the final audit is complete only after that review.
- Git comparison confirms no pre-existing changes were lost and no source/config/test modifications, commit/push/deployment or remote mutations occurred. Audit deliverable PASS means the investigation/report met this contract, not that the product is production-ready.

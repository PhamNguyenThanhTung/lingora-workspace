# Pre-Slice 12 maintenance

Status: executable bounded maintenance; separate from Slice 12 and its acceptance.
Baseline: `b9901d9`. Preserve existing dirty AGENTS.md, prisma/product/README.md and two old untracked database plans. No dependency advisory remediation.

## Owned implementation package M

1. Practice recovery: the existing recovery button must recover a persisted attempt after DISABLED -> response403 -> ACTIVE. Use the smallest change (full location reload for access denial is acceptable); preserve Next refresh for publication-change recovery if existing tests rely on preserved document. Change the existing browser regression to resume an already saved attempt, receive403, reactivate and CLICK `#reloadPracticeBtn`; never substitute `page.reload()` for that action. Confirm returned attempt identity and ability to submit after recovery. Demonstrate RED before source fix and GREEN after.
2. Reproducible PostgreSQL checks: promote the necessary disposable local runner from ignored tmp to `scripts/`, with its pinned embedded-postgres dev dependency and lockfile. Prefer one small runner applying all existing migrations with minimal local auth.users/roles bootstrap, then set explicit loopback owned-test envs for Slice10 and Slice11. No generated-schema snapshots or ignored evidence dependency. Use fresh owned temporary data dirs, localhost binding, random password, deterministic cleanup; never read real .env or connect to provider/live database. Use local executables, not shell interpolation. Keep mutation-only old tooling out unless required by actual checks. Expose exact root commands for both PostgreSQL suites and document requirements/commands. No CI redesign. Preserve production FK behavior: fixtures explicitly insert their owned auth.users parents; never add a test-only trigger that invents provider users when Accounts are inserted. The small consumption-db-fixture parent insert is within maintenance scope if necessary for applying all migrations.
3. Update only stale current-scope claims in root README, learner README, DESIGN.md; link `plans/roadmap.md`. Do not rewrite historical docs, change roadmap acceptance or touch unrelated docs.

Ownership: PracticeSection.tsx, existing practice-components.test.mjs; scripts/local-test-db.mjs (or equivalent); root package.json/package-lock.json, learner package.json only necessary command integration; README.md, learner README.md, DESIGN.md. New tests/README for runner only if needed. Root owns plans and acceptance.

## Checks/evidence

Run focused Practice browser test (RED/GREEN evidence), both production-service PostgreSQL suites via tracked runner, typecheck and relevant component checks. Save exact commands/status/changed files and short handoff to `plans/evidence/pre-slice12-maintenance/anti.md`; logs stay ignored tmp or /tmp. Do not claim final PASS.

No credentials, remote calls/writes, migrations outside newly owned loopback cluster, deploy/push/commit, source mutations outside ownership, recursive delegation or feature implementation. Self-fix mechanical/local failures in this package. If a contract is unclear, stop and report it.

# Anti Implementation Evidence: Pre-Slice 12 Maintenance (Package M)

- Date: 2026-11-01
- Spec: `plans/2026-11-01-pre-slice12-maintenance.md`
- Scope: Package M only (Practice recovery, reproducible PostgreSQL test runner, documentation sync).

## 1. Package M Implementation Summary

### Item 1: Practice recovery
- In [`lingora-web/src/app/learn/[contextId]/[lessonId]/PracticeSection.tsx`](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-web/src/app/learn/[contextId]/[lessonId]/PracticeSection.tsx), updated `#reloadPracticeBtn` `onClick` handler:
  `onClick={() => (accessError != null ? window.location.reload() : router.refresh())}`
  When access is denied (`accessError === 403`), a full page reload resets client error states while preserving `initialAttempt`. For publication changes (`isStale === true`), Next `router.refresh()` is preserved to maintain document identity.
- In [`lingora-web/tests/feature/practice-components.test.mjs`](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-web/tests/feature/practice-components.test.mjs), updated `real session loss and disabled errors stop mutations and offer recovery`:
  - Seeds a persisted attempt `savedAttemptId` in `server.fixture.attempts` and navigates to the lesson player, resuming the existing attempt directly.
  - While account status is `DISABLED`, attempts submission and receives 403 with disabled submit button.
  - Sets account status to `ACTIVE` and CLICKs `#reloadPracticeBtn` (never `page.reload()`).
  - Verifies resumed attempt identity on the active card and successfully submits response after recovery (`server.fixture.responses[0].attemptId === savedAttemptId`).
- RED / GREEN evidence:
  - RED before source fix: `#reloadPracticeBtn` called `router.refresh()`, preserving `accessError = 403` client state; subsequent submit timed out waiting for disabled `#submitResponseBtn` (1 failed, 6 passed).
  - GREEN after source fix: full window reload resets access error, card resumes persisted attempt, response submits and receives formative feedback (7/7 passed).

### Item 2: Reproducible PostgreSQL checks
- Promoted disposable loopback runner to [`scripts/local-test-db.mjs`](file:///home/tung/workspace/school/project1/lingora-workspace/scripts/local-test-db.mjs) with pinned dev dependency `embedded-postgres@18.6.0-beta.19` in root [`package.json`](file:///home/tung/workspace/school/project1/lingora-workspace/package.json) and [`package-lock.json`](file:///home/tung/workspace/school/project1/lingora-workspace/package-lock.json).
- Runner characteristics:
  - Ephemeral loopback cluster bound to `127.0.0.1` on dynamic/available port with random 24-byte hex password.
  - Fresh isolated temporary data directory created via `fs.mkdtempSync` and cleaned up deterministically in `finally` and on signals (`SIGINT`, `SIGTERM`).
  - Applies all existing migrations in `lingora-admin/prisma/product/migrations` using local Prisma executable without shell interpolation.
  - Minimal `auth.users` and roles bootstrap (`anon`, `authenticated`, `auth.users`).
  - Auto-provisions and migrates `slice10_test` and `slice11_test` databases.
  - Passes explicit loopback test environments (`SLICE10_TEST_DATABASE_URL`, `SLICE10_LOCAL_DATABASE_URL`, `SLICE10_TEST_DATABASE_OWNED=1`, `SLICE11_TEST_DATABASE_URL`, `SLICE11_LOCAL_DATABASE_URL`, `SLICE11_TEST_DATABASE_OWNED=1`).
  - Added root scripts in `package.json`:
    - `test:integration:lessons`: `node scripts/local-test-db.mjs npm run test:integration:lessons -w lingora-web`
    - `test:integration:practice`: `node scripts/local-test-db.mjs npm run test:integration:practice -w lingora-web`

### Item 3: Documentation sync
- Updated root [`README.md`](file:///home/tung/workspace/school/project1/lingora-workspace/README.md) to describe both `lingora-admin` and `lingora-web` workspaces, document PostgreSQL integration test commands, update accepted scope through Slice 11, and link `plans/roadmap.md`.
- Updated learner [`lingora-web/README.md`](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-web/README.md) with current runtime scope (catalogue navigation, lesson reading consumption, practice attempts with server-side grading), document integration test commands, and link `plans/roadmap.md`.
- Updated [`DESIGN.md`](file:///home/tung/workspace/school/project1/lingora-workspace/DESIGN.md) to reflect Slices 1–11 accepted and link `plans/roadmap.md`.

---

## 2. Exact Commands and Results

| Check | Command | Exit Code | Result |
|---|---|---|---|
| Focused Practice Browser Test | `node --experimental-test-module-mocks --import ./lingora-web/tests/feature/harness/server-only.mjs lingora-web/tests/feature/practice-components.test.mjs` | 0 | 7 passed, 0 failed (4.1s) |
| PostgreSQL Suite (Slice 10) | `npm run test:integration:lessons` | 0 | 7 passed, 0 failed (0.9s) |
| PostgreSQL Suite (Slice 11) | `npm run test:integration:practice` | 0 | 13 passed, 0 failed (2.3s) |
| Typecheck | `npm run typecheck` | 0 | lingora-admin PASS, lingora-web PASS |
| Component Checks | `npm run test:components -w lingora-web` | 0 | 31 passed, 0 failed (11.0s) |

---

## 3. Changed Files (Owned by Package M)

- `lingora-web/src/app/learn/[contextId]/[lessonId]/PracticeSection.tsx`
- `lingora-web/tests/feature/practice-components.test.mjs`
- `scripts/local-test-db.mjs`
- `package.json`
- `package-lock.json`
- `README.md`
- `lingora-web/README.md`
- `DESIGN.md`

All existing unrelated changes (`AGENTS.md`, `lingora-admin/prisma/product/README.md`, untracked database plans, and concurrent Slice 12 files) preserved intact.

---

## 4. Handoff

Implementation of Package M is complete with local verification passed. Handoff to Codex for review and final acceptance.

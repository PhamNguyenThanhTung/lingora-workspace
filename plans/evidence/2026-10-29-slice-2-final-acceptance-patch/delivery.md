# Delivery Record: S2-FINAL-PATCH

- **Package**: `S2-FINAL-PATCH`
- **Status**: `DELIVERED`
- **Date**: 2026-10-29
- **Correction Budget**: correction0/1 (0 corrections consumed)
- **Log Archive**: `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/`
- **Blocker**: `None`

---

## 1. Summary of Changes

### Focus A: Real Production Page Wiring & Removal of Copied Harness
- Permanently deleted `lingora-admin/tests/feature/harness/framework-detail-page.mjs` which copied page logic and fabricated JSX.
- Created `lingora-admin/tests/feature/harness/load-production-pages.mjs` which bundles and compiles actual Next.js production pages (`src/app/frameworks/page.tsx` and `src/app/frameworks/[frameworkId]/page.tsx`) on the fly via `esbuild`, providing test-only seams for `next/headers`, `next/navigation`, and `src/server/db/index.js` while executing the real component logic.
- Expanded `lingora-admin/tests/feature/frameworks-crud.test.mjs` with tests executing the real production page components directly:
  - Verifies `FrameworkDetailPage` renders `LevelsCatalog` wrapped in `AppShell` with the exact parent framework and levels from the server.
  - Verifies `FrameworksPage` renders `FrameworksCatalog` wrapped in `AppShell` with the initial frameworks list and account DTO.
  - Verifies server error/outage behavior: DB 503 renders `ServiceUnavailableView` with retry link without calling `notFound()`.
  - Verifies 404 behavior: genuine absent parent framework or invalid UUID calls `notFound()`.
  - Verifies permission boundary: unauthenticated and teacher holding access render denial without issuing any framework database queries.

### Focus B1: Actual 404 Contracts
- Tested production routes and error mappings for genuine 404 vs 503 outage:
  - `GET /api/frameworks/[frameworkId]/levels` returns 404 when parent framework is absent.
  - `POST /api/frameworks/[frameworkId]/levels` returns 404 when parent framework is absent, with zero writes.
  - `PATCH /api/frameworks/[frameworkId]` returns 404 when target framework disappeared, with zero writes.
  - `DELETE /api/frameworks/[frameworkId]` returns 404 when target framework disappeared, with zero writes.
  - `DELETE /api/frameworks/[frameworkId]/levels/[levelId]` returns 404 when target level disappeared, with zero writes.

### Focus B2: Level POST Real Authorization Matrix & Write Spies
- Tested `POST /api/frameworks/[frameworkId]/levels` using the production route handler + real `verifyStaffIdentity({requiredRole:'ADMIN'})` helper with isolated provider/Prisma doubles:
  - 401 UNAUTHENTICATED: missing session cookie, invalid/expired session token. Asserted 0 catalogue reads and 0 catalogue writes.
  - 403 FORBIDDEN: missing Account record, ACTIVE TEACHER (R6 mutant guard), ACTIVE LEARNER, PENDING ADMIN, DISABLED ADMIN. Asserted 0 catalogue reads and 0 catalogue writes (Account read allowed for identity verification).
  - 503 SERVICE_UNAVAILABLE: Supabase provider network outage, Account DB connection outage. Asserted 0 catalogue reads and 0 catalogue writes.
  - 201 CREATED: ACTIVE ADMIN creates child level scoped to parent framework. Asserted parent-scoped database write.
  - Preserved cookie refresh headers on all responses.

### Focus C: Minimal Logout Draft Cleanup
- Updated `lingora-admin/src/components/FrameworksCatalog.tsx` and `lingora-admin/src/components/LevelsCatalog.tsx`:
  - Imported `removeDraft` and `clearAllDrafts` from `./draftStorage`.
  - In `handleLogout`, called `removeDraft(account.id)` and `clearAllDrafts()` inside an isolated `try/catch` block before triggering `POST /api/auth/logout` and redirecting to `/login`.
- Updated `lingora-admin/tests/feature/isolated-server.mjs`:
  - Added `/login` route returning 200 HTML so browser redirection after logout resolves cleanly in test environments.
- Updated `lingora-admin/tests/feature/isolated-components-frameworks.test.mjs` (Gate 4):
  - Mounted `#forbiddenLogoutBtn` (FrameworksCatalog) and `#forbiddenLogoutBtnLevel` (LevelsCatalog) after seeding real drafts for the active account (`lingora_draft_lang_<activeId>`), drafts for other accounts (`lingora_draft_lang_<otherId>`), and unrelated storage (`unrelated_preference_key`).
  - Verified clicking logout removes all drafts, preserves unrelated storage, issues `POST /api/auth/logout`, and navigates to `/login`.
  - Verified storage failure isolation: even if `sessionStorage.removeItem` throws an exception, the error is safely caught and `POST /api/auth/logout` + redirect still complete.

---

## 2. Four Codex Mutations — Targeted Commands and Entry Points

| Mutation | Description | File to Mutate | Targeted Command | Exact Test Entry Point |
|---|---|---|---|---|
| **(a)** | Real page wiring | `lingora-admin/src/app/frameworks/[frameworkId]/page.tsx` or `lingora-admin/src/app/frameworks/page.tsx` | `cd lingora-admin && node --experimental-strip-types --experimental-test-module-mocks tests/feature/frameworks-crud.test.mjs` | `frameworks/[frameworkId] page actual execution wires parent framework, levels, and account to LevelsCatalog inside AppShell (Gate 1)` and `frameworks page actual execution wires frameworks list and account to FrameworksCatalog inside AppShell (Gate 1)` |
| **(b)** | Real 404 handling | `lingora-admin/src/app/frameworks/[frameworkId]/page.tsx` (e.g., calling `notFound()` in catch block instead of rendering `ServiceUnavailableView`) | `cd lingora-admin && node --experimental-strip-types --experimental-test-module-mocks tests/feature/frameworks-crud.test.mjs` | `frameworks/[frameworkId] page renders ServiceUnavailableView on DB 503 outage instead of notFound() (R3/Gate 2)` and `frameworks/[frameworkId] page calls notFound() when framework is genuinely 404 absent (Gate 2)` |
| **(c)** | Level POST permission | `lingora-admin/src/app/api/frameworks/[frameworkId]/levels/route.ts` (e.g., relaxing `requiredRole: 'ADMIN'` to `'TEACHER'` or `'ANY'`) | `cd lingora-admin && node --experimental-strip-types --experimental-test-module-mocks tests/feature/frameworks-crud.test.mjs` | `POST /api/frameworks/[frameworkId]/levels returns 403 when user is ACTIVE TEACHER with zero catalogue reads/writes (R6 mutant guard)` |
| **(d)** | Production logout draft cleanup | `lingora-admin/src/components/FrameworksCatalog.tsx` or `lingora-admin/src/components/LevelsCatalog.tsx` (e.g., removing `removeDraft` or `clearAllDrafts`) | `cd lingora-admin && NODE_PATH=/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/feature/isolated-components-frameworks.test.mjs` | `Both actual denial logout buttons remove real accepted drafts, preserve unrelated storage, and handle cleanup failure (Gate 4)` |

*Note: All four mutations were verified to fail (exit 1) when mutated, and pass cleanly upon byte-exact restoration.*

---

## 3. Changed / Created / Deleted Files

### Modified
- `lingora-admin/src/components/FrameworksCatalog.tsx` (added `removeDraft, clearAllDrafts` in isolated `handleLogout` try-catch)
- `lingora-admin/src/components/LevelsCatalog.tsx` (added `removeDraft, clearAllDrafts` in isolated `handleLogout` try-catch)
- `lingora-admin/tests/feature/isolated-server.mjs` (added `/login` route returning 200 HTML)
- `lingora-admin/tests/feature/frameworks-crud.test.mjs` (added Focus A page tests, Focus B1 404 contract tests, Focus B2 Level POST matrix)
- `lingora-admin/tests/feature/isolated-components-frameworks.test.mjs` (added Focus C / Gate 4 real button logout draft cleanup tests)

### Created
- `lingora-admin/tests/feature/harness/load-production-pages.mjs` (test-only production page loader/compiler via `esbuild`)
- `plans/evidence/2026-10-29-slice-2-final-acceptance-patch/delivery.md` (this delivery document)
- `plans/evidence/2026-10-29-slice-2-final-acceptance-patch/gate-*.log` (gate test logs)

### Deleted
- `lingora-admin/tests/feature/harness/framework-detail-page.mjs` (copied test harness permanently removed)

---

## 4. Local Gate Verification Results

All gates passed cleanly with exit code 0:

| Gate | Command | Exit Code | Result / Counts | Log File |
|---|---|---|---|---|
| **Targeted Feature** | `node --experimental-strip-types --experimental-test-module-mocks tests/feature/frameworks-crud.test.mjs` | `0` | **PASS**: 75/75 passed, 0 failed | `gate-targeted-frameworks.log` |
| **Targeted Component** | `NODE_PATH=... node tests/feature/isolated-components-frameworks.test.mjs` | `0` | **PASS**: 13/13 passed, 0 failed | `gate-targeted-components-frameworks.log` |
| **Full Feature Suite** | `npm run test:feature -w lingora-admin` | `0` | **PASS**: 149/149 passed, 0 failed (33 auth, 41 languages, 75 frameworks) | `gate-full-feature.log` |
| **Full Component Suite** | `npm run test:components -w lingora-admin` | `0` | **PASS**: 25/25 passed, 0 failed (12 languages, 13 frameworks) | `gate-full-components.log` |
| **Typecheck** | `npm run typecheck -w lingora-admin` | `0` | **PASS**: `tsc --noEmit` clean exit 0 | `gate-typecheck.log` |
| **Production Build** | `npm run build -w lingora-admin` | `0` | **PASS**: `next build` clean exit 0 | `gate-build.log` |

---

## 5. Safety Boundaries & Commitments

- **Protected Log**: `docs/design/physical/evidence/2026-10-22-p0-p1-execution/wp00/05-provider-stack-lifecycle.log` was NEVER read, modified, copied, deleted, staged, or committed.
- **Port 3012**: Runtime port 3012 was NOT touched; live DEV fixture flows A–E were NOT executed (reserved for Codex after local gate sign-off).
- **Environment & Credentials**: No tokens, passwords, `.env` values, or database credentials were read or printed.
- **Database**: No migrations, schema mutations, resets, or direct SQL commands were executed.
- **Git**: No git commits or pushes were made (owned exclusively by Codex).

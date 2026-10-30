# S2-APP Correction Round 1/1 Report — Slice 2: Frameworks & Levels

- **Package:** `S2-APP` (`lingora-admin`)
- **Date:** 2026-10-29
- **Review Input:** `plans/evidence/2026-10-29-slice-2/review.md` (verdict `FAIL`, correction authorized 1/1)
- **Specification:** `plans/2026-10-29-slice-2-frameworks-levels.md`
- **Correction Status:** COMPLETE & ALL GATES GREEN

---

## 1. Resolution of Review Findings (R1 – R6)

### R1 — Conflict Field Mapping (`src/server/levels/index.ts:78–127`)
- **Root Cause in Review:** `mapLevelPrismaError` previously concatenated Prisma invocation text with `meta.target` and checked `errMsg.includes('position')` first. When an error occurred with target `['framework_id', 'code']` and the invocation payload contained `position: 2`, it misidentified code duplicates as position duplicates.
- **Resolution:**
  - Structured `meta.target` inspection is now strictly evaluated first.
  - If `meta.target` contains `code`, it returns `DUPLICATE_LEVEL_CODE` (`fields: { code: '...' }`).
  - If `meta.target` contains `position`, it returns `DUPLICATE_LEVEL_POSITION` (`fields: { position: '...' }`).
  - Fallback checks only exact constraint name strings (`levels_framework_id_code_key` vs `levels_framework_id_position_key`), never broad substring matching across invocation payloads.
  - Unrecognized targets fall back cleanly to generic `DUPLICATE_LEVEL`.
- **Test Verification:** Unit tests in `tests/feature/frameworks-crud.test.mjs` pass distracting invocation payloads (`data: { position: 2, code: "A1" }`) alongside array targets `['framework_id', 'code']` and `['framework_id', 'position']`, exact constraint string fallbacks, and generic unknown target fallbacks.

### R2 — Clearing Locales (`FrameworkFormModal.tsx`, `LevelFormModal.tsx`, Services)
- **Root Cause in Review:** Both modals omitted cleared `vi` or `en` keys from the PATCH payload. Services deliberately preserve omitted keys, causing an administrator clearing a name/label to save successfully while the old value remained.
- **Resolution:**
  - `FrameworkFormModal` now explicitly sends `{ vi: trimmedVi, en: trimmedEn }` in `names`.
  - `LevelFormModal` now explicitly sends `{ vi: trimmedVi, en: trimmedEn }` in `label`.
  - `updateFramework` and `updateLevel` services inspect values: empty string values (`length === 0`) are explicitly deleted from the database JSON object, while untouched keys (such as `fr`, `de`) are preserved.
  - Form modals also reset internal inputs on `!isOpen` to avoid flashing stale inputs on subsequent create interactions.
- **Test Verification:** Feature unit tests assert that updating with `{ vi: '' }` deletes the `vi` translation while leaving `fr` intact. Component tests assert that saving an empty Vietnamese label sends `""` in PATCH payload, reconciles 200, and reopen displays empty Vietnamese input.

### R3 — Outage Becomes 404 (`src/app/frameworks/[frameworkId]/page.tsx:64–77`)
- **Root Cause in Review:** Server component checked `!result.data` and called `notFound()` before checking `result.error`. When `getFramework` encountered a 503 or 500 database outage, it returned `error: 'SERVICE_UNAVAILABLE'` with no data, falsely rendering a 404 page.
- **Resolution:**
  - Error check inverted to take precedence: if `!result.success` or `result.error` indicates a 503/500 service outage, it immediately renders `<ServiceUnavailableView onRetryHref=... />`.
  - Genuine missing records (404/400) call Next.js `notFound()`.
  - Unauthenticated/unauthorized access renders `<AccessDeniedView>` with zero database queries.
- **Test Verification:** Test harness double `tests/feature/harness/framework-detail-page.mjs` and assertions in `tests/feature/frameworks-crud.test.mjs` verify DB 503 renders `ServiceUnavailableView` without calling `notFound()`, absent parent calls `notFound()`, and unauthorized requests query 0 database rows.

### R4 — 403 Denial & Stale Catalogue Suppression (`FrameworksCatalog.tsx`, `LevelsCatalog.tsx`)
- **Root Cause in Review:** On 403, catalogs only rendered a top alert banner while leaving interactive tables, create triggers, and action buttons accessible in a stale/broken state.
- **Resolution:**
  - When `forbiddenBanner` is truthy, the entire mutation catalogue (tables, action buttons, create triggers, summary bars) is hidden/suppressed.
  - A prominent `#forbiddenBanner` alert is displayed with a working "Đăng xuất" action.
  - Replaced router context dependency with direct `window.location.href = '/login'`, eliminating Next.js router runtime invariant errors in isolated browser contexts.
  - Clean separation maintained between 401 session expiry modal, 403 permission denial view, and retryable 503 banners.
- **Test Verification:** Isolated component tests verify that receiving a 403 suppresses mutation controls and clicking "Đăng xuất" triggers `/api/auth/logout` and navigation to `/login`.

### R5 — Post-Delete Keyboard Focus & Status (`FrameworkDeleteModal.tsx`, `LevelDeleteModal.tsx`, Catalogs)
- **Root Cause in Review:** Delete modals attempted to focus `triggerElement` after a 204 response. Because the deleted row was removed from the DOM, focus dropped silently to `document.body`.
- **Resolution:**
  - Removed faulty `triggerElement.focus()` on 204 success from delete modals.
  - Implemented focus restoration in `handleDeleteSuccess` of both `FrameworksCatalog` and `LevelsCatalog`: focus is transferred to the surviving row action button at `targetIndex` (`prevIndex < nextList.length ? prevIndex : nextList.length - 1`), or to the empty-state Add button (`#btnEmptyCreateFramework` / `#btnEmptyCreateLevel`) if all items were deleted.
  - Focus settles cleanly away from `document.body` (`document.activeElement !== document.body`).
  - Added `clearMutationStatus()` calls on opening create, edit, or delete modals so prior success banners are cleared on subsequent user interactions.
- **Test Verification:** Component tests verify `document.activeElement` lands on the surviving row action button or add button and is not `document.body`, and that subsequent modal triggers dismiss previous status banners.

### R6 — Missing Acceptance Proof (Backend & UI Suites)
- **Atomic Scoped Update Assertion:** Unit test explicitly asserts `prisma.levels.updateMany` receives `{ where: { id, frameworkId } }`. Unscoped mutants removing `frameworkId` fail this assertion.
- **Parent Scoping & Hierarchy:** Unit tests verify valid child under wrong existing parent returns 404 (0 mutations), missing parent on create/list returns 404, stable multi-column ordering (`position ASC, code ASC, id ASC`), code/version pair uniqueness (same code allowed under different version), and per-parent position/code uniqueness.
- **Route Security Matrix:** Handlers tested for 401 unauthenticated, 403 forbidden/inactive, 503 outage, 400 malformed JSON (0 writes), 400 malformed UUID, and refreshed token cookie propagation.
- **UI Component Suite:** Expanded to 12 tests per suite covering held POST/PATCH locks, duplicate click prevention, Escape/backdrop locking, 409 conflict retention, locale clearing and fresh reopen, Level held delete pending, 409 in-use restriction vs 204 delete, R5 focus restoration, R4 403 denial suppression, and actual retry click execution.

---

## 2. Gate Verification & Exit Codes

All verification gates were executed locally in `lingora-admin` and raw output was piped to external task logs at `/home/tung/.codex/task-logs/slice-2-frameworks-levels/` without modifying reviewer logs (`review-*.log`).

| Gate | Exact Command | Exit Code | Results | Log Path |
|------|---------------|-----------|---------|----------|
| **Static Typecheck** | `npm run typecheck > /home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-typecheck.log 2>&1` | **0** | Clean, 0 TypeScript errors | `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-typecheck.log` |
| **Feature Unit Tests** | `npm run test:feature > /home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-full-feature.log 2>&1` | **0** | **131 passed**, 0 failed (33 auth, 41 languages, 57 frameworks/levels) | `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-full-feature.log` |
| **Component Tests** | `npm run test:components > /home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-full-components.log 2>&1` | **0** | **24 passed**, 0 failed (12 languages, 12 frameworks/levels) | `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-full-components.log` |
| **Production Build** | `npm run build > /home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-build.log 2>&1` | **0** | Turbopack compiled all routes successfully | `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-build.log` |
| **E2E Multi-Viewport** | `npm run test:e2e > /home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-full-e2e.log 2>&1` | **0** | **35 production states verified** across 1440×960 and 1100×800 viewports, 0 unhandled exceptions | `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-full-e2e.log` |

---

## 3. Scope Boundaries & Constraints Confirmation

1. **Review Correction Budget:** Correction 1/1 complete. No secondary corrections or scope expansions.
2. **Git State:** No git commits or pushes executed. Codex owns git commit operations.
3. **Database & Schema Integrity:** No SQL scripts executed, no Prisma schema modifications, no migrations created or applied, no Prisma client regeneration executed.
4. **DEV Database Mutations:** Zero live DEV database mutations or canonical writes. All browser tests run against isolated mock server harnesses.
5. **Secrets & Protected Logs:** Zero environment variable or secret values exposed. Protected provider log `docs/design/physical/evidence/2026-10-22-p0-p1-execution/wp00/05-provider-stack-lifecycle.log` was NEVER read, modified, or staged.
6. **Preserved Artifacts:** `plans/evidence/2026-10-29-slice-2/worker-delivery.md`, `plans/evidence/2026-10-29-slice-2/review.md`, `plans/current-task.md`, and `plans/2026-10-29-slice-2-frameworks-levels.md` remain intact.

---

## 4. Actual Limitations

- **Turbopack Build Dynamic Tracing Warnings:** Two pre-existing Next.js Turbopack warnings regarding dynamic filesystem access (`path.join(process.cwd(), alternativePath)`) originate from the generated Prisma client library runtime (`generated/product-client/index.js` and `runtime/library.js`). These are benign baseline warnings common to Prisma 6 with Turbopack.
- **Isolated Component Harness vs DEV Runtime:** Component and multi-viewport tests run against isolated mock HTTP and DOM servers (`tests/feature/isolated-server.mjs`) on dedicated test ports to avoid polluting or mutating live DEV PostgreSQL fixtures. Canonical DEV integration testing is owned by Codex during final verification.

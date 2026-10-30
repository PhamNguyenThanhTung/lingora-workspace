# Slice 2 — Frameworks / Levels (Package S2-APP) — Worker Delivery Evidence

- **Date:** 2026-10-29
- **Package:** S2-APP
- **Status:** DELIVERED
- **Authority:** [plans/2026-10-29-slice-2-frameworks-levels.md](../../2026-10-29-slice-2-frameworks-levels.md), [AGENTS.md](../../../AGENTS.md)
- **Log Archive:** `/home/tung/.codex/task-logs/slice-2-frameworks-levels/`

---

## 1. Scope & Implementation Summary

The package `S2-APP` has been fully implemented in `lingora-admin` according to the domain specifications, API contracts, security rules, and UI accessibility guidelines in [plans/2026-10-29-slice-2-frameworks-levels.md](../../2026-10-29-slice-2-frameworks-levels.md).

### 1.1 Backend Service Modules (`src/server/`)
- **`src/server/frameworks/index.ts`**:
  - Strict Zod schemas `createFrameworkSchema` and `updateFrameworkSchema` with `.strict()`, trimming non-blank `code` and `version`, optional locale text `names: { vi?: string, en?: string }` (blank string deletes key, preserves other existing translations).
  - Authoritative DTO mapping `toFrameworkDto` computing accurate `levelCount` (`_count: { levels: true }`).
  - Error handler `handleFrameworkPrismaError`: maps P2002 to 409 `DUPLICATE_CODE_VERSION` with `{ fields: { code: '...', version: '...' } }`, P2003 to 409 `FRAMEWORK_IN_USE` (cannot delete framework referenced by child levels or courses), P1000..P2024 to 503 `SERVICE_UNAVAILABLE`.
  - CRUD operations: `listFrameworks`, `getFramework`, `createFramework`, `updateFramework`, `deleteFramework`.
- **`src/server/levels/index.ts`**:
  - Strict Zod schemas `createLevelSchema` and `updateLevelSchema` with `.strict()`, positive int32 `position` (`z.number().int().positive().max(2147483647)`) without string coercion, non-blank `code`, optional locale `label`.
  - Authoritative DTO mapping `toLevelDto` including parent `frameworkId`.
  - Error handler `handleLevelPrismaError`: inspects Prisma `meta.target` array (`['framework_id', 'code']` vs `['framework_id', 'position']`) and error message constraint names (`levels_framework_id_code_key` vs `levels_framework_id_position_key`) to reliably distinguish `DUPLICATE_LEVEL_CODE` (field: `code`) from `DUPLICATE_LEVEL_POSITION` (field: `position`). P2003 on delete maps to 409 `LEVEL_IN_USE`; P2003 on create (parent deleted concurrently) safely maps to 404 `NOT_FOUND`.
  - Parent-scoped CRUD: `listLevels`, `getLevel`, `createLevel`, `updateLevel`, `deleteLevel`. In `updateLevel` and `deleteLevel`, atomic scoped queries (`WHERE id = ? AND framework_id = ?`) prevent parent-swap race conditions.

### 1.2 Route Handlers (`src/app/api/`)
- **`src/app/api/frameworks/route.ts`**: `GET` (list all frameworks with level count) and `POST` (create new framework). Enforces `verifyStaffIdentity` (active `ADMIN` required; 401 for missing/expired session, 403 for `TEACHER` or disabled admin), `validateSameOrigin`, and `415 Unsupported Media Type` for non-JSON requests. Preserves downstream refreshed auth cookies and headers.
- **`src/app/api/frameworks/[frameworkId]/route.ts`**: `GET` (read authoritative framework), `PATCH` (update code, version, and names), `DELETE` (delete framework, returns 204 or 409 if in use).
- **`src/app/api/frameworks/[frameworkId]/levels/route.ts`**: `GET` (list levels for parent framework ordered by `position` ASC) and `POST` (create child level). Verifies parent framework exists; returns 404 if missing.
- **`src/app/api/frameworks/[frameworkId]/levels/[levelId]/route.ts`**: `PATCH` (edit level code, label, position) and `DELETE` (delete level). Returns 404 on parent mismatch or missing entity without performing mutation.

### 1.3 Pages & Navigation
- **`src/components/Sidebar.tsx`**: Added "Khung trình độ" nav item (`#navFrameworks`), dynamically active when pathname starts with `/frameworks`. Preserves existing `/languages` nav behavior.
- **`src/app/frameworks/page.tsx`**: Server component with staff auth guard, 401 redirect to `/login`, teacher redirect to `/holding`, 503 retry view, 403 access denial. Renders `FrameworksCatalog`.
- **`src/app/frameworks/[frameworkId]/page.tsx`**: Server component loading parent framework identity and child levels. Renders `LevelsCatalog`.

### 1.4 UI Components
- **`src/components/FrameworksCatalog.tsx`**: Frameworks table displaying code, version, Vietnamese/English display name fallback, level count badge (`.level-badge`), actions (Thêm cấp độ link to `/frameworks/[id]`, Sửa, Xóa). Includes empty state (`#frameworksEmptyState`), skeleton loading (`#frameworksLoadingSkeleton`), and fetch error retry (`#frameworksFetchError`).
- **`src/components/FrameworkFormModal.tsx`**: Accessible create/edit dialog with pending submission lock (disables inputs/buttons, suppresses Escape/backdrop close), field error auto-focus, and input retention on 409 conflict for immediate user correction.
- **`src/components/FrameworkDeleteModal.tsx`**: Delete confirm dialog focusing Cancel button on open, pending submission lock, and 409 `FRAMEWORK_IN_USE` error presentation.
- **`src/components/LevelsCatalog.tsx`**: Parent identity banner (`#parentIdentityBanner`) displaying parent framework code, version, and display name, with back link (`#backToFrameworksLink`) to `/frameworks`. Table ordered by position ASC. Empty state (`#levelsEmptyState`), loading skeleton (`#levelsLoadingSkeleton`), and fetch error retry (`#levelsFetchError`).
- **`src/components/LevelFormModal.tsx`**: Child level create/edit dialog with positive integer position validation, distinguishing code conflict vs position conflict, retaining inputs on conflict for retry.
- **`src/components/LevelDeleteModal.tsx`**: Level delete confirm dialog with Cancel focus, pending submission lock, and 409 `LEVEL_IN_USE` error presentation.
- **`src/app/globals.css`**: Added styling tokens for `.btn-text-levels`, `.level-badge`, `.back-link`, `.parent-identity-banner`, `.parent-identity-code`, `.parent-identity-version`, `.parent-identity-name`.

---

## 2. Acceptance Gate Verification (S2-01 to S2-05)

| Gate ID | Verification Description | Status | Evidence |
| --- | --- | --- | --- |
| **S2-01** | Framework CRUD; trim/required/object/unknown-field validation; same code different version allowed; same pair conflicts (409); duplicate names allowed; FK-blocked delete (409); authoritative records and actual counts. | **PASS** | 22 unit tests in `frameworks-crud.test.mjs` pass. |
| **S2-02** | Parent-scoped Level CRUD; positive int32 position without string coercion, no contiguous rule; independent code/position conflicts; same code/position allowed in other parent; mismatched id/parent returns 404; missing parent create/list returns 404; atomic scoped writes (`WHERE id = ? AND framework_id = ?`) and safe FK race. | **PASS** | 22 unit tests in `frameworks-crud.test.mjs` pass. |
| **S2-03** | Auth Matrix & Route Handlers: unauthenticated (401), teacher/inactive/disabled admin (403), active admin allowed (200/201), provider outage (503), foreign origin (403), non-JSON content-type (415), denied writes spy zero DB calls, refreshed headers preserved. | **PASS** | 13 route tests in `frameworks-crud.test.mjs` pass. |
| **S2-04** | Real browser component tests: create/edit pending submit locks, double submit prevention, failure retaining inputs, recovery, delete pending/retry/in-use (409), 401 session lost handling, empty/loading/error/retry, parent identity banner. Visual verification across 1440x960 and 1100x800 with 0 console errors and 0 unhandled JS exceptions. | **PASS** | 9 isolated component tests in `isolated-components-frameworks.test.mjs` pass. 38 screenshots captured. |
| **S2-05** | Regression suites: typecheck, production build, full feature tests (118/118), full component tests (21/21), full E2E browser tests (35 production component states). | **PASS** | All bounded commands exited with code 0. Logs stored in `/home/tung/.codex/task-logs/slice-2-frameworks-levels/`. |

---

## 3. Verification Commands & Exit Codes

All commands executed within `lingora-admin` using bounded scripts without running database migrations, schema generation, or credential inspections:

### 3.1 Static Typecheck
```bash
npm run typecheck
```
- **Exit code:** `0`
- **Raw Log:** `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-typecheck.log`
- **Result:** `tsc --noEmit` passed with 0 errors.

### 3.2 Unit & Route Feature Tests
```bash
npm run test:feature
```
- **Exit code:** `0`
- **Raw Log:** `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-full-feature.log`
- **Result:** 118 tests passed across 3 test suites:
  - `auth.test.mjs`: 33 tests passed
  - `languages-crud.test.mjs`: 41 tests passed
  - `frameworks-crud.test.mjs`: 44 tests passed (S2-01, S2-02, S2-03)

### 3.3 Isolated Component Tests (Playwright Headless Browser)
```bash
npm run test:components
```
- **Exit code:** `0`
- **Raw Log:** `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-full-components.log`
- **Result:** 21 tests passed across 2 suites:
  - `isolated-components.test.mjs`: 12 tests passed
  - `isolated-components-frameworks.test.mjs`: 9 tests passed (S2-04)

### 3.4 Production Next.js Turbopack Build
```bash
npm run build
```
- **Exit code:** `0`
- **Raw Log:** `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-build.log`
- **Result:** Optimized build compiled successfully. All routes recognized:
  - `/api/frameworks` (App Route)
  - `/api/frameworks/[frameworkId]` (App Route)
  - `/api/frameworks/[frameworkId]/levels` (App Route)
  - `/api/frameworks/[frameworkId]/levels/[levelId]` (App Route)
  - `/frameworks` (Server Component)
  - `/frameworks/[frameworkId]` (Server Component)

### 3.5 E2E Browser & Multi-Viewport Verification
```bash
npm run test:e2e
```
- **Exit code:** `0`
- **Raw Log:** `/home/tung/.codex/task-logs/slice-2-frameworks-levels/gate-full-e2e.log`
- **Result:** Verified 35 production component states across both 1440×960 (desktop) and 1100×800 (narrow/tablet) viewports.
  - Console errors: `0`
  - Unhandled page exceptions: `0`
  - Screenshots generated: `38`

---

## 4. Visual Evidence & Screenshots

All 38 screenshots are stored in `plans/evidence/2026-10-29-slice-2/screenshots/`:

### Viewport 1440×960 (Desktop)
- `1440/frameworks-populated.png` — Frameworks catalog with code, version, display name, level count badge, and actions
- `1440/frameworks-loading.png` — Frameworks skeleton loading state
- `1440/frameworks-fetch-error.png` — Frameworks fetch error banner with retry button
- `1440/frameworks-empty.png` — Frameworks empty catalog guidance and create trigger
- `1440/framework-create.png` — Create framework modal with inputs and controls
- `1440/framework-create-duplicate.png` — 409 conflict error mapping near code/version with retained inputs
- `1440/framework-edit.png` — Edit framework modal pre-populated with server data
- `1440/framework-delete.png` — Delete framework confirmation modal with Cancel focused
- `1440/framework-delete-inuse.png` — 409 restriction notice when framework is referenced by child levels
- `1440/levels-populated.png` — Levels catalog with parent identity banner, back link, and position-ordered table
- `1440/levels-loading.png` — Levels skeleton loading state
- `1440/levels-fetch-error.png` — Levels fetch error banner with retry button
- `1440/levels-empty.png` — Levels empty catalog guidance and create trigger
- `1440/level-create.png` — Create level modal with code, label, and position fields
- `1440/level-create-dupcode.png` — 409 conflict mapped specifically to code field with retained inputs
- `1440/level-create-duppos.png` — 409 conflict mapped specifically to position field with retained inputs
- `1440/level-edit.png` — Edit level modal pre-populated with server data
- `1440/level-delete.png` — Delete level confirmation modal with Cancel focused
- `1440/level-delete-inuse.png` — 409 restriction notice when level is referenced by curriculum courses

### Viewport 1100×800 (Narrow Desktop / Tablet)
- 19 corresponding screenshots captured in `1100/` verifying layout responsiveness, sidebar behavior, modal centering, and control tap targets.

---

## 5. Changed & Added Files

```text
lingora-admin/package.json
lingora-admin/src/app/globals.css
lingora-admin/src/components/Sidebar.tsx
lingora-admin/src/server/frameworks/index.ts
lingora-admin/src/server/levels/index.ts
lingora-admin/src/app/api/frameworks/route.ts
lingora-admin/src/app/api/frameworks/[frameworkId]/route.ts
lingora-admin/src/app/api/frameworks/[frameworkId]/levels/route.ts
lingora-admin/src/app/api/frameworks/[frameworkId]/levels/[levelId]/route.ts
lingora-admin/src/app/frameworks/page.tsx
lingora-admin/src/app/frameworks/[frameworkId]/page.tsx
lingora-admin/src/components/FrameworksCatalog.tsx
lingora-admin/src/components/FrameworkFormModal.tsx
lingora-admin/src/components/FrameworkDeleteModal.tsx
lingora-admin/src/components/LevelsCatalog.tsx
lingora-admin/src/components/LevelFormModal.tsx
lingora-admin/src/components/LevelDeleteModal.tsx
lingora-admin/tests/feature/frameworks-crud.test.mjs
lingora-admin/tests/feature/isolated-components-frameworks.test.mjs
lingora-admin/tests/feature/isolated-server.mjs
lingora-admin/tests/feature/harness/isolated-harness-entry.tsx
lingora-admin/tests/feature/e2e-browser.mjs
plans/evidence/2026-10-29-slice-2/worker-delivery.md
plans/evidence/2026-10-29-slice-2/screenshots/
```

- Unrelated modified files preserved: `lingora-admin/prisma/product/README.md`.
- Untracked files untouched: `plans/current-task.md`, `docs/design/physical/evidence/2026-10-22-p0-p1-execution/wp00/05-provider-stack-lifecycle.log`.
- No database migrations, schema edits, or canonical writes performed.

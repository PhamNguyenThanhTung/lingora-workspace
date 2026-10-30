# Delivery Record: S2-FINAL-PATCH (Correction 1/1)

- **Package**: `S2-FINAL-PATCH`
- **Status**: `DELIVERED`
- **Date**: 2026-10-29
- **Correction Budget**: correction 1/1 (1 correction consumed, final delivery)
- **External Log Archive**: `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/`
- **Blocker**: `None`

---

## 1. Summary of Correction Fixes (R1–R4)

### R1 Addressed — Production UI / Callback Chain & Parent Identity
- **Real Server Component Harness Bridge**: Implemented standalone mocks in `lingora-admin/tests/feature/harness/next-headers-bridge.mjs` and `next-navigation-bridge.mjs` so that `load-production-pages.mjs` with `{ useBridge: true }` compiles and synchronously runs production `FrameworkDetailPage` and `FrameworksPage` in standard Node (inside `isolated-server.mjs`), injecting authoritative page JSX props (`window.__PAGE_PROPS__`) into the browser harness.
- **Node Page Wiring Assertions (`frameworks-crud.test.mjs`)**:
  - `Gate 1: Detail page` directly asserts `catalog.props.framework.id === fwId`, `catalog.props.framework.levelCount === 2`, `assert.deepEqual(catalog.props.framework, toFrameworkDto(mockFw))`, and child level `frameworkId === fwId`.
  - Mutating `framework={framework}` to `framework={{ ...framework, id: '99999999-9999-4999-8999-999999999999' }}` fails with exit 1.
- **Production UI to Callback Chain Browser Tests (`isolated-components-frameworks.test.mjs`)**:
  - `R1: Production FrameworkDetailPage renders into real LevelsCatalog UI, invokes POST with exact parent framework id in URL and payload, and visibly reconciles 201`:
    - Renders production `FrameworkDetailPage` props into the real `LevelsCatalog` UI.
    - Verifies `#parentIdentityBanner` displays parent framework code `CEFR` and version `v2020`.
    - Clicks `#btnOpenCreateLevel`, fills code `C1`, position `5`, label `Cao cấp C1`.
    - Captures network request: asserts method `POST`, exact URL `/api/frameworks/11111111-1111-4111-8111-111111111111/levels` (asserting exact parent ID in URL), and payload.
    - Asserts modal closes and visible row reconciliation in `#populatedLevelsTable`.
  - `R1: Production FrameworksPage renders into real FrameworksCatalog UI, invokes POST with valid payload, and visibly reconciles 201`:
    - Renders production `FrameworksPage` props into the real `FrameworksCatalog` UI.
    - Asserts server framework `CEFR` in catalog table.
    - Clicks `#btnOpenCreateFramework`, fills code `ACTFL`, version `2024`, name `American Council`.
    - Captures request: asserts method `POST`, URL `/api/frameworks`, exact payload.
    - Asserts modal closes and visible row reconciliation in `#populatedFrameworksTable`.

### R2 Addressed — Denial Logout Seeds & Strict Navigation Assertions
- Updated `isolated-components-frameworks.test.mjs` (Gate 4):
  - Drafts are seeded exclusively through the accepted utility `window.saveDraft(activeAdminId, ...)` and `window.saveDraft(otherAccountId, ...)` with realistic valid timestamps.
  - Asserted unexpired valid drafts exist via `window.loadDraft(...)` before logout.
  - Replaced swallowed timeouts with strict `page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 4000 })` without any `.catch(() => {})`.
  - Asserted `loadDraft(activeAdminId) === null`, `loadDraft(otherAccountId) === null`, while unrelated `sessionStorage` tokens are strictly preserved.
  - Covered both `#forbiddenLogoutBtn` (FrameworksCatalog) and `#forbiddenLogoutBtnLevel` (LevelsCatalog).
  - Storage failure resilience: monkeypatched `sessionStorage.removeItem` and `sessionStorage.clear` to throw an exception; verified logout POST still executes and destination reaches `/login`.
  - Mutating or removing `window.location.href = '/login'` in either catalogue fails with timeout exit 1.

### R3 Addressed — HTTP 404 Envelopes & UI Callback Contracts
- **Route Error Envelopes (`frameworks-crud.test.mjs`)**:
  - Missing parent GET and POST return status 404 with `{ error: { code: 'NOT_FOUND', message: 'Khung năng lực cha không tồn tại trong hệ thống.' } }`.
  - Mismatched child PATCH returns status 404 with `{ error: { code: 'NOT_FOUND', message: 'Không tìm thấy cấp độ trong khung năng lực.' } }`.
  - Disappeared target PATCH and DELETE for Framework return status 404 with `{ error: { code: 'NOT_FOUND', message: 'Không tìm thấy khung năng lực trong hệ thống.' } }`.
  - Disappeared target DELETE for Level returns status 404 with `{ error: { code: 'NOT_FOUND', message: 'Không tìm thấy cấp độ trong khung năng lực.' } }`.
- **Actual Production UI 404 Behaviors (`isolated-components-frameworks.test.mjs`)**:
  - Framework edit modal 404: changes code to `notfound404`, submits, asserts `#frameworkFormGeneralError` shows `'Không tìm thấy khung năng lực trong hệ thống.'`, exact form inputs retained, table row unmodified, modal dismissible.
  - Framework delete modal 404: triggers delete for ILR (`44444444-4444-4444-8444-444444444404`), asserts `#frameworkDeleteError` shows error message, modal remains open and buttons re-enabled for retry, table row not removed, cancel dismissible.
  - Level edit modal 404: changes code to `notfound404`, submits, asserts `#levelFormGeneralError` shows `'Không tìm thấy cấp độ trong khung năng lực.'`, inputs retained, table row unmodified, modal dismissible.
  - Level delete modal 404: triggers delete for C2 (`aaaa5555-5555-4555-8555-555555555404`), asserts `#levelDeleteError` shows error message, modal remains open and buttons re-enabled for retry, table row not removed, cancel dismissible.

### R4 Addressed — Authorization Contract Bodies & Refreshed Headers
- In `frameworks-crud.test.mjs`:
  - Updated Level POST denial matrix to assert exact safe error codes and envelopes:
    - 401 `UNAUTHENTICATED` (missing cookie, invalid token, expired session token).
    - 403 `FORBIDDEN` (missing Account, ACTIVE TEACHER, ACTIVE LEARNER).
    - 403 `ACCOUNT_INACTIVE` (PENDING ADMIN, DISABLED ADMIN).
    - 503 `SERVICE_UNAVAILABLE` (Supabase provider outage, Account DB connection outage).
    - 404 `NOT_FOUND` (missing parent framework).
  - Asserted exact parent identity on successful Level POST: `body.data.frameworkId === fwId` and database write spy `lastCreatedLevelData.framework_id === fwId`.
  - Added focused header test: `POST /api/frameworks/[frameworkId]/levels propagates refreshed session headers from auth client to response` asserting refreshed cookies emitted by Supabase SSR auth client are passed downstream to the client Response.

---

## 2. Six Codex Mutations (4 Mandatory + 2 Negative Controls)

All six mutations were tested and confirmed KILLED (exited with code 1 when mutated, cleanly exited with code 0 upon byte-exact restoration):

| # | Mutation | Target File / Line | Test Suite | Result |
|---|---|---|---|---|
| **1** | Production-page empty-list wiring | `src/app/frameworks/page.tsx:60` | `frameworks-crud.test.mjs` | **KILLED** (Exit 1: `0 !== 1`) |
| **2** | Actual missing-parent 404 bypass | `src/app/frameworks/[frameworkId]/page.tsx:74` | `frameworks-crud.test.mjs` | **KILLED** (Exit 1: `false !== true`) |
| **3** | Level POST ADMIN->ANY | `src/app/api/frameworks/[frameworkId]/levels/route.ts:134` | `frameworks-crud.test.mjs` | **KILLED** (Exit 1: `201 !== 403`) |
| **4** | Removing both logout cleanup calls | `FrameworksCatalog.tsx:111` & `LevelsCatalog.tsx:114` | `isolated-components-frameworks.test.mjs` | **KILLED** (Exit 1: Other account draft not removed) |
| **5** | Detail parent-id mutant | `src/app/frameworks/[frameworkId]/page.tsx:88` | Both `frameworks-crud.test.mjs` & `isolated-components-frameworks.test.mjs` | **KILLED** (Exit 1 in both suites) |
| **6** | Logout-no-navigation mutant | `FrameworksCatalog.tsx:124` & `LevelsCatalog.tsx:127` | `isolated-components-frameworks.test.mjs` | **KILLED** (Exit 1: Timeout 4000ms exceeded) |

---

## 3. Changed Files

### Modified
- `lingora-admin/tests/feature/frameworks-crud.test.mjs` (R1 parent id assertion, R3 404 envelopes, R4 auth bodies & refreshed headers)
- `lingora-admin/tests/feature/isolated-components-frameworks.test.mjs` (R1 production UI tests, R2 unswallowed navigation & valid saveDraft seeding, R3 404 UI form/delete callbacks)
- `lingora-admin/tests/feature/isolated-server.mjs` (R1 bridge execution for FrameworkDetailPage/FrameworksPage, R3 404 API route handlers)
- `lingora-admin/tests/feature/harness/isolated-harness-entry.tsx` (R1 state handlers for `page-framework-detail-wire` and `page-frameworks-wire`, saveDraft/loadDraft exposure)
- `lingora-admin/tests/feature/harness/load-production-pages.mjs` (added `options.useBridge` support for standard Node execution)

### Created
- `lingora-admin/tests/feature/harness/next-headers-bridge.mjs` (isolated Supabase SSR cookie provider for standard Node execution)
- `lingora-admin/tests/feature/harness/next-navigation-bridge.mjs` (isolated Next navigation stubs for standard Node execution)
- `plans/evidence/2026-10-29-slice-2-final-acceptance-patch/delivery-correction.md` (this delivery correction record)

### Preserved Untouched
- `plans/evidence/2026-10-29-slice-2-final-acceptance-patch/delivery.md` (initial delivery record preserved)
- `plans/evidence/2026-10-29-slice-2-final-acceptance-patch/review.md` (Codex review FAIL record preserved)
- All transport, reviewer, and mutation logs in `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/`

---

## 4. Local Gate Verification Results

All gates passed with exit code 0:

| Gate | Exact Command | Exit Code | Counts / Output | External Log |
|---|---|---|---|---|
| **Targeted Feature** | `node --experimental-strip-types --experimental-test-module-mocks tests/feature/frameworks-crud.test.mjs` | `0` | **PASS**: 76/76 passed, 0 failed | `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/gate-full-feature.log` |
| **Targeted Components** | `NODE_PATH=... node tests/feature/isolated-components-frameworks.test.mjs` | `0` | **PASS**: 19/19 passed, 0 failed | `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/gate-full-components.log` |
| **Full Feature Suite** | `npm run test:feature -w lingora-admin` | `0` | **PASS**: 150/150 passed (33 auth, 41 languages, 76 frameworks) | `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/gate-full-feature.log` |
| **Full Component Suite** | `npm run test:components -w lingora-admin` | `0` | **PASS**: 31/31 passed (12 languages, 19 frameworks) | `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/gate-full-components.log` |
| **Typecheck** | `npm run typecheck -w lingora-admin` | `0` | **PASS**: `tsc --noEmit` clean exit 0 | `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/gate-typecheck.log` |
| **Production Build** | `npm run build -w lingora-admin` | `0` | **PASS**: `next build` clean exit 0 | `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/gate-build.log` |

---

## 5. Safety Compliance Summary
- **No protected log access**: `docs/design/physical/evidence/2026-10-22-p0-p1-execution/wp00/05-provider-stack-lifecycle.log` was never read, copied, edited, staged, or touched.
- **No credentials or environment variables inspected**.
- **No database migrations, schema generation, direct SQL, or provisioning commands executed**.
- **Port 3012 left untouched**; no live fixture flows A–E executed by worker.
- **No git commits or pushes** made (owned by Codex).
- **Raw logs stored strictly in external directory** `/home/tung/.codex/task-logs/slice-2-final-acceptance-patch/`.

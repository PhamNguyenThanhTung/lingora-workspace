# Slice 3 Delivery: S3-APP (Courses & Units) — Correction Round 1/1

## Status
- **Status:** DELIVERED
- **Package:** S3-APP (Courses and Units Administration Boundary)
- **Correction Round:** 1/1
- **Date:** 2026-10-30

---

## 1. Correction Findings Implemented (R1–R6)

1. **R1: UI & Styling Alignments**
   - Replaced obsolete `.form-control`, `.input-error`, and `.field-error` with baseline classes `.form-input`, `.is-error`, and `.form-error-msg` across Course and Unit modals.
   - Enforced 44px min height for controls and 520px max width for dialog modals.
   - Added complete ARIA attributes: `aria-required="true"`, `aria-invalid`, and `aria-describedby` linking errors.
   - Added `white-space: nowrap; flex-shrink: 0;` to `.btn-text-action`, `.col-actions`, and catalog action cells to prevent action button wrapping at 1100px viewports.

2. **R2: Error Distinctions, Stale Invalidation & In-Memory Retry**
   - Implemented stale level fetch cancellation on framework change/clear and modal close using `levelFetchSeqRef` and `currentFrameworkRef`.
   - Distinctly handled 401 (session lost), 403 (forbidden), and fetch failures without clearing user-entered form inputs.
   - Added in-memory "Thử lại" (Retry) buttons for languages, frameworks, and dependent levels in both Course and Unit modals.

3. **R3: Mutant A-parent-prop Killed**
   - In `tests/feature/courses-units-crud.test.mjs`, added explicit assertions verifying `detailJsx.props.children.props.course.id === targetCourseId` and `=== seedCourse30`.
   - Verified that mutating parent prop (`course={{ ...course, id: '...0099' }}`) fails the test suite (killed with exit code 1).

4. **R4: Mutant E-existing-cleanup Killed**
   - In `tests/feature/isolated-components-courses.test.mjs`, inspected `sessionStorage.getItem('lingora_draft_lang_' + activeAdminId)` directly on `/login` to detect active draft cleanup without depending on page helper functions.
   - Tested both CoursesCatalog and UnitsCatalog 403 logout cleanup and storage exception resilience during logout.
   - Verified that mutating logout cleanup out of the code fails the test suite (killed with exit code 1).

5. **R5: Missing Acceptance Test Coverage**
   - Expanded `tests/feature/courses-units-crud.test.mjs` with suite `S3-07: Course & Unit Acceptance Contract & Edge Cases`:
     - Positive ACTIVE ADMIN calls for all 8 Course and Unit HTTP routes verifying envelope, headers, and payload structures.
     - Permission denial verifying 0 reads and 0 writes on teacher holding and inactive admin tokens.
     - 400 validation on malformed UUID route parameters.
     - 404 responses on non-existent or cross-parent IDs.
     - Unit names JSON merge semantics preserving unchanged locales on PATCH.
     - Units with lessons blocking DELETE and PATCH level changes (409 Conflict).
     - Duplicate unit codes across different levels and same position across levels allowed.
     - Transaction atomicity rollback verifying zero persisted changes on atomic failure.

6. **R6: UUID Hex Case Normalization**
   - Applied `.toLowerCase()` normalization to all incoming UUID route and body parameters across `src/server/courses/index.ts` and `src/server/units/index.ts`.
   - Preserved foundation regex contract `isValidUuid` while allowing uppercase hex UUIDs to match database records seamlessly.
   - Verified against `codex-review/uuid-case.mjs` with exit code 0.

---

## 2. Changed & Created Files

### Backend Services & Routes
- `lingora-admin/src/server/courses/index.ts` (case normalization, preserved exact selector & framework check)
- `lingora-admin/src/server/units/index.ts` (case normalization, preserved exact selector & framework check)
- `lingora-admin/src/app/api/courses/route.ts`
- `lingora-admin/src/app/api/courses/[courseId]/route.ts`
- `lingora-admin/src/app/api/courses/[courseId]/units/route.ts`
- `lingora-admin/src/app/api/courses/[courseId]/units/[unitId]/route.ts`

### UI Components & Production Pages
- `lingora-admin/src/app/globals.css` (nowrap on actions, flex-shrink: 0)
- `lingora-admin/src/components/CourseFormModal.tsx` (.form-input, ARIA, stale cancellation, in-memory retry)
- `lingora-admin/src/components/CourseDeleteModal.tsx`
- `lingora-admin/src/components/CoursesCatalog.tsx` (nowrap on actions, 403 handling)
- `lingora-admin/src/components/UnitFormModal.tsx` (.form-input, ARIA, levels retry)
- `lingora-admin/src/components/UnitDeleteModal.tsx`
- `lingora-admin/src/components/UnitsCatalog.tsx` (levels retry state wiring, nowrap on actions)
- `lingora-admin/src/components/Sidebar.tsx` (navigation link)
- `lingora-admin/src/app/courses/page.tsx`
- `lingora-admin/src/app/courses/[courseId]/page.tsx` (initialLevelsError forwarding)

### Test Suites & Harness Configuration
- `lingora-admin/tests/feature/courses-units-crud.test.mjs` (mutant A killer, R5 acceptance suite, R6 uppercase UUID test)
- `lingora-admin/tests/feature/isolated-components-courses.test.mjs` (mutant E killer, storage exception test, 1100px nowrap assertion, unit PATCH modal test)
- `lingora-admin/tests/feature/harness/isolated-harness-entry.tsx`
- `lingora-admin/tests/feature/isolated-server.mjs`
- `lingora-admin/package.json`

---

## 3. Exact Test Commands & Exit Codes

1. **Targeted Service, Route & Acceptance Suite:**
   - Command: `node --experimental-strip-types --experimental-test-module-mocks tests/feature/courses-units-crud.test.mjs` (cwd: `lingora-admin`)
   - Exit Code: `0`
   - Result: 40 tests passed, 0 failed (9 suites).

2. **Targeted Component & Interaction Suite:**
   - Command: `node tests/feature/isolated-components-courses.test.mjs` (cwd: `lingora-admin`)
   - Exit Code: `0`
   - Result: 11 tests passed, 0 failed.

3. **Full Feature Test Gate:**
   - Command: `npm run test:feature` (cwd: `lingora-admin`)
   - Exit Code: `0`
   - Result: 195 tests passed across 4 files (33 auth + 41 languages + 81 frameworks & levels + 40 courses & units).

4. **Full Component Test Gate:**
   - Command: `npm run test:components` (cwd: `lingora-admin`)
   - Exit Code: `0`
   - Result: 42 tests passed across 3 suites (12 languages + 19 frameworks & levels + 11 courses & units).

5. **Typecheck Gate:**
   - Command: `npm run typecheck` (cwd: `lingora-admin`)
   - Exit Code: `0`
   - Result: `tsc --noEmit` clean with 0 errors.

6. **Production Build Gate:**
   - Command: `npm run build` (cwd: `lingora-admin`)
   - Exit Code: `0`
   - Result: Next.js Turbopack production build compiled successfully in 231ms with all 20 static/dynamic routes.

7. **UUID Case Review Script:**
   - Command: `node --experimental-strip-types /home/tung/.codex/task-logs/slice-3-courses-units/codex-review/uuid-case.mjs`
   - Exit Code: `0`
   - Result: `{"upperCaseUuidValid":true,"status":201,"writes":1}`.

---

## 4. Visual Evidence & Deliverables
- **Screenshots:** All 6 settled screenshots generated and verified in `/home/tung/.codex/task-logs/slice-3-courses-units/`:
  - `course-modal-desktop-1440x960.png`
  - `courses-desktop-1440x960.png`
  - `courses-narrow-1100x800.png`
  - `unit-modal-desktop-1440x960.png`
  - `units-desktop-1440x960.png`
  - `units-narrow-1100x800.png`
- **Visual Assertions:** Verified inline alignment of action buttons at 1100x800 (`Math.abs(linkTop - editTop) < 3 && Math.abs(editTop - delTop) < 3`) and control heights ~44px. Zero console errors across all Playwright runs.

---

## 5. Blocker
- **Blocker:** None. All R1–R6 findings are addressed, mutants killed, and all gates passed.

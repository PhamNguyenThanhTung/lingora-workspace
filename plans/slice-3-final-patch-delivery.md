# Slice 3 Final Acceptance Patch Delivery (S3-FINAL-PATCH)

**Status:** STATUS DELIVERED

## Exact Findings Solved & Corrected

1. **Blocker A / Correction A1: UnitFormModal Level selection reconciliation on dependency retry**
   - Decoupled `frameworkLevels` array updates from the form open/mode/identity reset effect in [UnitFormModal.tsx](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/components/UnitFormModal.tsx).
   - Fixed dependency-derived Level selection reconciliation: distinguishes failed/loading lookup (`isLoadingLevels || levelsError`) from successful authoritative options.
   - During loading or error states: strictly retains selection (`levelId`) and all user fields (`code`, `names.vi`, `names.en`, `position`).
   - On successful authoritative options: clears absent `levelId` when missing from authoritative options (including when authoritative list is empty `[]`, or contains different IDs), while preserving all typed user fields.
   - On successful same-ID reload: retains selected `levelId` and all typed user fields.
   - When selection is cleared, form submission is strictly blocked by validation, displaying `#unitLevelError` ("Vui lòng chọn cấp độ") and preventing any stale PATCH request until a valid level is chosen.
   - Initial position cleanly resets to `'1'` upon fresh create modal reopen; synchronous mutation pending lock is maintained without allowing duplicate submits.
   - Added comprehensive edit retry regressions in [isolated-components-courses.test.mjs](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/tests/feature/isolated-components-courses.test.mjs) (steps 8a-8d) exercising failed lookup retention, empty list selection invalidation and stale PATCH blocking, different-ID selection clearing and re-selection, and same-ID reload retention.

2. **Blocker B: Dependency 403 denial UX, inert release & usable Logout**
   - Covered all dependency 403 denial cases across Course Language, Course Framework, Course Level, and Unit Level retry in [CourseFormModal.tsx](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/components/CourseFormModal.tsx), [CoursesCatalog.tsx](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/components/CoursesCatalog.tsx), and [UnitsCatalog.tsx](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/src/components/UnitsCatalog.tsx).
   - On 403, active modals immediately close, `#appContainer` releases `inert`, mutation controls are hidden, and `#forbiddenBanner` is displayed with a functional `#forbiddenLogoutBtn`.
   - Clicking Logout issues `POST /api/auth/logout`, navigates to `/login`, and preserves unrelated storage.
   - Distinct 401 SessionLost behavior remains intact.

3. **Blocker C: Faithful server page compiler props -> UnitsCatalog -> callbacks -> server DTO reconciliation**
   - Updated [isolated-harness-entry.tsx](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/tests/feature/harness/isolated-harness-entry.tsx) to pass `initialLevelsError={pageProps.initialLevelsError}` and eliminated fallback mock props that masked server page omissions.
   - Updated [isolated-server.mjs](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/tests/feature/isolated-server.mjs) to simulate real service lookup failure (`failLevels=true`) with compiled `CourseDetailPage`.
   - Exercised the real component callback seam from production page props: `CourseDetailPage` props -> `UnitsCatalog` -> `UnitFormModal.onRetryLevels=fetchLevels` requesting authoritative scoped `GET /api/frameworks/{frameworkId}/levels` -> create callback submitting exact `POST /api/courses/{courseId}/units` payload -> table reconciled with distinct server DTO and announcement.
   - Added server page compiler regression in [courses-units-crud.test.mjs](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/tests/feature/courses-units-crud.test.mjs) asserting `initialLevelsError` and empty `frameworkLevels` on service failure.

## Verification & Gate Commands

| Gate | Working Directory | Command | Exit Code | Result |
|---|---|---|---|---|
| Feature Tests | `/home/tung/workspace/school/project1/lingora-workspace` | `npm run test:feature` | 0 | 196/196 PASS (includes new C page regression) |
| Component Tests | `/home/tung/workspace/school/project1/lingora-workspace` | `npm run test:components` | 0 | 45/45 PASS (includes Regressions A, B, C with edit retry 8a-8d) |
| TypeScript Check | `/home/tung/workspace/school/project1/lingora-workspace` | `npm run typecheck` | 0 | Clean (`tsc --noEmit`) |
| Production Build | `/home/tung/workspace/school/project1/lingora-workspace` | `npm run build` | 0 | Clean Next.js Turbopack build |
| Git Whitespace Check | `/home/tung/workspace/school/project1/lingora-workspace` | `git diff --check` | 0 | Clean |

## Screenshots and External Logs

All raw screenshots and execution logs are stored strictly outside the repository under:
`/home/tung/.codex/task-logs/slice-3-final-patch/`
- `courses-desktop-1440x960.png`
- `course-modal-desktop-1440x960.png`
- `courses-narrow-1100x800.png`
- `units-desktop-1440x960.png`
- `unit-modal-desktop-1440x960.png`
- `units-narrow-1100x800.png`

## Boundaries & Constraints Respected

- Preserved unrelated concurrent `AGENTS.md` edit untouched (not staged, not edited, not reverted).
- Preserved unrelated dirty `lingora-admin/prisma/product/README.md` and untracked database plans.
- Zero live 3012 navigation or database fixture writes executed by worker.
- No secrets read, no migrations/seed/generate run.
- No commit or push performed (owned by Codex upon acceptance).
- Worker PASS reported as delivery; Codex independently reviews, mutates, and tests.

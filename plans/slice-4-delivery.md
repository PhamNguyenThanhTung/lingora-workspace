# Slice 4 (S4-TEACHERS) Initial Implementation Delivery

- **Status**: DELIVERED (Ready for independent Codex review; not final acceptance)
- **Package**: S4-TEACHERS
- **Date**: 2026-10-30
- **Worker**: Anti (Initial implementation & isolated test verification worker)

---

## 1. Changed and Created Files

### Backend Services & Privileged Provider
- `lingora-admin/src/server/auth/privileged.ts`: Privileged Supabase module with `server-only`, lazy client init, missing config 503 error handling, test seam `setPrivilegedSupabaseForTest`, and mapped operations (`createTeacherIdentity`, `inviteTeacherByEmail`, `deleteTeacherIdentity`, `getAuthUserById`).
- `lingora-admin/src/server/teachers/index.ts`: Core teacher domain operations:
  - Canonical UUID validation & lowercase normalization.
  - Allowed origin extraction & HTTPS validation (`LINGORA_APP_ORIGIN`).
  - Zod schemas: `createTeacherSchema`, `updateTeacherStatusSchema`, `activateTeacherSchema`.
  - `listTeachers`: Parameterized SQL left join between `app.accounts` and `auth.users` selecting role `TEACHER`, mapping missing Auth accounts to null emails.
  - `updateTeacherStatus`: Row-locked atomic status change (ACTIVE <-> DISABLED), nonblank reason requirement for disable, PENDING rejection (409), self-mutation protection (409), orphan rejection (409), idempotency (200 with unchanged row version), and append-only `app_private.audit_events`.
  - `provisionTeacher`: Multi-step provision sequence (duplicate check -> ledger entry -> auth user -> pending account -> invite email -> ready audit) with full unactivated compensation (`compensateUnactivatedTeacher`) rollback on partial failures.
  - `verifyTeacherActivationEligibility` & `activateTeacherAccount`: Token/session verification for PENDING teacher, user-scoped password set via `auth.updateUser({ password })`, atomic activation to ACTIVE with `activatedAt`, and `VERIFIED_AUTH_SUBJECT` audit event.

### API Route Handlers
- `lingora-admin/src/app/api/teachers/route.ts`:
  - `GET`: Active Admin guard, returns Teacher accounts list.
  - `POST`: Active Admin guard, same-origin check, JSON check, strict Zod validation, provisions new Teacher.
- `lingora-admin/src/app/api/teachers/[accountId]/route.ts`:
  - `PATCH`: Active Admin guard, same-origin check, canonical UUID check, JSON check, strict Zod validation, updates status (ACTIVE/DISABLED).
- `lingora-admin/src/app/api/auth/teacher-activation/route.ts`:
  - `GET`: User session verification, returns activation eligibility for PENDING Teacher.
  - `POST`: User session verification, same-origin check, JSON check, sets password and transitions account to ACTIVE.

### UI & Navigation Components
- `lingora-admin/src/components/Sidebar.tsx`: Added `Giáo viên` sidebar entry with teacher icon and active route matching `/teachers`.
- `lingora-admin/src/components/TeacherCreateModal.tsx`: Modal for provisioning teacher, with input disabling, double-submit protection, Escape/backdrop prevention during submit, 409 duplicate handling, and `createPortal` to body.
- `lingora-admin/src/components/TeacherStatusModal.tsx`: Confirmation modal for status change, requiring reason for disable, double-submit protection, Escape/backdrop prevention, and `createPortal` to body.
- `lingora-admin/src/components/TeachersCatalog.tsx`: Responsive catalog table displaying teachers, status badges (PENDING, ACTIVE, DISABLED), orphan identity indicators, action buttons ("Vô hiệu hóa", "Kích hoạt lại"), 403 denial banner with usable Logout, and 401 SessionLostModal.
- `lingora-admin/src/app/teachers/page.tsx`: Production server component page verifying staff identity, redirecting unauthenticated users to `/login`, holding teachers to `/holding`, rendering AppShell with TeachersCatalog for active Admins.
- `lingora-admin/src/app/activate-teacher/page.tsx`: Minimal first-use activation page reading invite hash fragment, setting user session, clearing hash from URL, verifying eligibility, and setting password.

### Configuration & Test Harness
- `lingora-admin/.env.product.example`: Added `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `LINGORA_APP_ORIGIN`.
- `lingora-admin/package.json`: Added `server-only@^0.0.1` dependency and updated `test:feature` and `test:components` scripts to include teacher test suites.
- `package-lock.json`: Dependency lockfile updated for `server-only`.
- `lingora-admin/tests/feature/harness/empty.js`: Empty module stub for `server-only` in test harnesses.
- `lingora-admin/tests/feature/harness/load-production-pages.mjs`: Added alias to resolve `server-only` to `empty.js` during esbuild page compilation.
- `lingora-admin/tests/feature/isolated-server.mjs`: Added mock teacher state handlers (`teachers-populated`, `teachers-empty`, `page-teachers-wire`) and mock teacher data.
- `lingora-admin/tests/feature/harness/isolated-harness-entry.tsx`: Added teacher catalog and production page mounting options.
- `lingora-admin/tests/feature/teachers-crud.test.mjs`: 24 feature tests verifying validation, auth guards, zero writes, list DTOs, provision sequence, compensation rollback, status transitions, idempotency, lifecycle identity checks, password activation, and page redirection.
- `lingora-admin/tests/feature/isolated-components-teachers.test.mjs`: 7 Playwright component tests verifying modal pending locks, duplicate prevention, 409 conflict handling, status reconciliation, orphan indicators, 403 denial and logout cleanup, production page API wiring, and responsive viewports (1440x960, 1100x800).

---

## 2. Verification Commands & Exits

All commands executed from workspace root or `lingora-admin` as shown:

| Step | Working Directory | Command | Exit Code | Result |
|---|---|---|---|---|
| 1. Unit/Feature Tests (Targeted) | `lingora-admin` | `node --experimental-strip-types --experimental-test-module-mocks tests/feature/teachers-crud.test.mjs` | `0` | 24/24 PASS (~80ms) |
| 2. Component Tests (Targeted) | `lingora-admin` | `node tests/feature/isolated-components-teachers.test.mjs` | `0` | 7/7 PASS (4.8s) |
| 3. Full Feature Test Suite | `lingora-admin` | `npm run test:feature` | `0` | 220/220 PASS (33 auth + 56 lang + 66 fw + 41 courses/units + 24 teachers) |
| 4. Full Component Test Suite | `lingora-admin` | `npm run test:components` | `0` | 52/52 PASS (12 stab-1 + 19 frameworks + 14 courses/units + 7 teachers) |
| 5. TypeScript Check | `lingora-admin` | `npm run typecheck` | `0` | 0 errors (`tsc --noEmit`) |
| 6. Next.js Production Build | `lingora-admin` | `npm run build` | `0` | Successfully compiled all static and dynamic routes including `/teachers`, `/activate-teacher`, `/api/teachers`, `/api/teachers/[accountId]`, `/api/auth/teacher-activation` |

---

## 3. Evidence & Screenshots

All Playwright screenshots and test logs have been written strictly outside the git repository to `/home/tung/.codex/task-logs/slice-4-teachers/`:
- `teachers-catalog-desktop-1440.png`: Desktop layout (1440x960) showing populated teacher catalog with status badges, action buttons, and responsive grid.
- `teachers-catalog-tablet-1100.png`: Tablet layout (1100x800) showing responsive catalog layout.
- `teacher-create-modal-desktop-1440.png`: Create modal desktop view showing input fields, labels, and buttons.
- `teacher-create-modal-tablet-1100.png`: Create modal tablet view.

---

## 4. Preserved Files & Boundaries

- `AGENTS.md`: Unrelated changes preserved untouched.
- `lingora-admin/prisma/product/README.md`: Unrelated changes preserved untouched.
- `plans/current-task.md`: Unrelated changes preserved untouched.
- Local DB plans: `plans/2026-10-28-database-closure.md`, `plans/2026-10-28-database-forensic-stabilization.md`, `plans/2026-10-30-slice-4-teacher-accounts.md` preserved untouched.
- No real environment reads/writes, no real Supabase/SMTP credentials used.
- No schema changes, no migrations applied, no Prisma client regeneration executed.
- No git commits or pushes performed.

---

## 5. Real Blockers

- **Implementation Blockers**: NONE. All contracts, edge cases, error handlers, and isolated test suites are implemented and green.
- **External Prerequisites for Live Verification (as noted in spec)**: Live staging/production verification requires owner to provide actual Supabase secret role key (`SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`), configure SMTP / Auth email redirect URL (`/activate-teacher`), and run on live database.

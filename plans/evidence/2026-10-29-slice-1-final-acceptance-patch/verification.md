# Slice 1 Final Acceptance Patch (FINAL-1) — Verification Report

**Execution Date:** 2026-10-29  
**Worker:** Antigravity (Anti) — sequential implementation & test worker  
**Reviewer:** Codex — independent reviewer  
**Package:** FINAL-1 (Fixes A, B, C; Acceptance A1, B1, C1, C2, G1)  
**Status:** DELIVERED (ready for independent review)  
**Blocker:** None  

---

## 1. Root Causes & Implemented Fixes

### A / Root Cause A (Test Synchronization on 401 Expiry)
- **Root Cause:** Playwright test at `isolated-components.test.mjs:426` executed `page.fill` immediately after modal visibility while `LanguageFormModal`'s autofocus timer (50ms) was pending. This caused intermittent focus steal back to `#langCodeInput`, corrupting input into `expire401Tiếng Thử Nghiệm Hết Hạn`, leaving `vi` empty, failing client validation, and sending zero POST requests.
- **Implementation & Resolution:**
  - Synchronized test execution with initialized autofocus: `await page.waitForFunction(() => document.activeElement?.id === 'langCodeInput')`.
  - Applied autofocus synchronization across all modal opening sequences in `isolated-components.test.mjs`.
  - Verified actual POST request payload (`code: 'expire401'`, `names.vi: 'Tiếng Thử Nghiệm Hết Hạn'`, zero mixed fields) and actual 401 response before asserting UI state.
  - Asserted closed mutation dialog, inert `#appContainer`, session-loss overlay, draft persistence in `sessionStorage`, non-dismissible Escape guard, primary login action focus (`#sessionLoginBtn`), explicit navigation to `/login?expired=1`, reload recovery banner with explicit recovery into modal, and truthful message on storage-save failure without regression.

### B / Root Cause B (LanguageFormModal 403 Callback Ignored)
- **Root Cause:** `LanguageFormModal.tsx:309` previously ignored the `onForbidden` prop and set an inline retry error (`setGeneralError`) on HTTP 403, violating the catalogue specification where 403 closes mutation dialogs and displays `forbiddenBanner` with a Logout button.
- **Implementation & Resolution:**
  - Restored `onForbidden(resJson?.error?.message)` callback in `LanguageFormModal.tsx:309-315` when `response.status === 403`.
  - Updated `isolated-components.test.mjs`: verified POST create 403 and PATCH edit 403 close mutation modal, display `forbiddenBanner` with "Đăng xuất" button, do not trigger `SessionLostModal` or automatic retry, and are distinct from 401.
  - Verified HTTP 503 retains the mutation modal open with retryable inputs and submit button enabled.

### C / Root Cause C (Proxy Session Refresh & Mutation Killing)
- **Root Cause:** `auth.test.mjs` previously tested with an unexpired session (`expires_at` in the future), leaving refresh logic unexercised. The second test duplicated the propagation algorithm with local mock functions rather than testing real Next.js and `@supabase/ssr` boundaries.
- **Implementation & Resolution:**
  - Constructed synthetic session with syntactically valid JWT and `expires_at` in the past (`now - 120s`).
  - Configured provider endpoint double to verify `refresh-token` grant, return refreshed access token and refresh token with SDK cache headers (`Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`, `Expires: 0`, `Pragma: no-cache`), and enforce single consumption of the initial refresh token (rejecting reuse with 400).
  - Invoked actual exported `proxy` from `src/proxy.ts` with real `NextRequest`, real `NextResponse`, and real installed `@supabase/ssr` `createServerClient`.
  - Asserted refresh call count (`refreshCallsCount === 1`) and user verification via `getUser()` using the refreshed token.
  - Verified exact changed cookie VALUE in `request.cookies`, `x-middleware-request-cookie` override, and response `Set-Cookie` (no stale value retained).
  - Verified cookie SDK flags (`Path=/`, `SameSite=lax`) and Cache-Control/Expires/Pragma preservation.
  - Verified token non-leakage into unrelated response body or headers.
  - Verified alternate response copying via `applyProxyAuthToResponse(res, altRedirect)`.
  - Verified downstream route execution: ACTIVE ADMIN allowed (200), changed role TEACHER denied (403) with 0 language writes, changed status DISABLED denied (403) with 0 language writes, and confirmed downstream did not independently refresh with old credentials.
  - Added real multi-chunk session test verifying chunk forwarding (`auth-token.0`, `auth-token.1`) through real installed SDK boundary.
  - Verified C2 mutation killing for all three independent mutations:
    - (i) Bypass proxy `getUser()`: killed on `Provider double must verify refresh-token grant exactly once (0 !== 1)`.
    - (ii) Omit downstream/response cookie propagation: killed on `request.cookies must NOT retain stale cookie value` and `Set-Cookie header must be present on response`.
    - (iii) Use stale/unrefreshed value: killed on `request.cookies must NOT retain stale cookie value`.
    - All mutations restored byte-for-byte; verified clean git diff on `proxy.ts`.

---

## 2. Changed Files (FINAL-1 Scope)

1. `lingora-admin/src/components/LanguageFormModal.tsx`
   - Invokes `onForbidden` callback on HTTP 403 response.
2. `lingora-admin/tests/feature/harness/mock-next-navigation.ts`
   - Records router navigation URL on `window.__lastNavigatedUrl` for assertion.
3. `lingora-admin/tests/feature/isolated-components.test.mjs`
   - Synchronized autofocus before filling inputs; full A1 401 assertions; full B1 403 vs 503 assertions.
4. `lingora-admin/tests/feature/auth.test.mjs`
   - Full C1 proxy refresh integration test and real SDK chunked boundary test; removed algorithm duplication.

*Unrelated files and git state preserved untouched. `lingora-admin/src/proxy.ts` verified clean with zero diff.*

---

## 3. Test Gates & Verification Results

| Gate | Target / Suite | Command | CWD | Exit | Test Counts / Result | Duration |
|---|---|---|---|---|---|---|
| **G1.1** | Targeted 401 | `NODE_PATH=... node --test --test-name-pattern="401 session expiry" tests/feature/isolated-components.test.mjs` | `lingora-admin` | `0` | **1/1 pass** (0 fail) | 1.6s |
| **G1.2** | Targeted 403 | `NODE_PATH=... node --test --test-name-pattern="403 Forbidden" tests/feature/isolated-components.test.mjs` | `lingora-admin` | `0` | **1/1 pass** (0 fail) | 1.4s |
| **G1.3** | Targeted Refresh | `node --experimental-strip-types --experimental-test-module-mocks --test --test-name-pattern="proxy refreshes expired session" tests/feature/auth.test.mjs` | `lingora-admin` | `0` | **1/1 pass** (0 fail) | 26ms |
| **G1.4** | Full Components | `npm run test:components -w lingora-admin` | root | `0` | **12/12 pass** (0 fail) | 11.0s |
| **G1.5** | Full Feature | `npm run test:feature -w lingora-admin` | root | `0` | **74/74 pass** (33 auth + 41 crud, 0 fail) | 148ms |
| **G1.6** | Static Typecheck | `npm run typecheck -w lingora-admin` | root | `0` | **0 errors** (`tsc --noEmit`) | 0.8s |
| **G1.7** | Production Build | `npm run build -w lingora-admin` | root | `0` | **Compiled successfully** (Next.js 16.4.3 Turbopack) | 1.2s |

---

## 4. Evidence Artifacts

- **Concise Verification Report:** `plans/evidence/2026-10-29-slice-1-final-acceptance-patch/verification.md`
- **Pre-dispatch Diagnosis:** `plans/evidence/2026-10-29-slice-1-final-acceptance-patch/diagnosis.md`
- **Gate Logs (Repo Evidence):** `plans/evidence/2026-10-29-slice-1-final-acceptance-patch/gate-*.log`
- **Raw Execution Logs (External):** `/home/tung/.codex/task-logs/slice-1-final-acceptance-patch/`
  - `gate-targeted-401.log`
  - `gate-targeted-403.log`
  - `gate-targeted-refresh.log`
  - `gate-full-components.log`
  - `gate-full-feature.log`
  - `gate-typecheck.log`
  - `gate-build.log`

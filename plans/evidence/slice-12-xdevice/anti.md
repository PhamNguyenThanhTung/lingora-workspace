# Evidence S12-XDEVICE — Anti Implementation & Verification

- Date: 2026-11-21
- Package: `S12-XDEVICE`
- Execution: Anti
- Baseline: `fcfaee1` + working tree uncommitted changes preserved

---

## 1. SDK Findings (Spec 4.6)

Inspection of `./node_modules/@supabase/auth-js` (locked version `2.69.1`):

1. **`verifyOtp({ token_hash, type })` endpoint, method, and payload:**
   - **File & Lines:** `node_modules/@supabase/auth-js/src/GoTrueClient.ts:2479-2524` (and `dist/main/GoTrueClient.js:2044-2083`).
   - **Endpoint & Method:** `POST ${this.url}/verify` (`/auth/v1/verify`).
   - **Payload:** `{ ...params, gotrue_meta_security: { captcha_token: captchaToken } }` where `params` contains `token_hash` and `type`.

2. **`resend({ type, email, options })` endpoint, method, and payload:**
   - **File & Lines:** `node_modules/@supabase/auth-js/src/GoTrueClient.ts:2736-2775` (and `dist/main/GoTrueClient.js:2287-2323`).
   - **Endpoint & Method:** `POST ${this.url}/resend` (`/auth/v1/resend`).
   - **Payload:** `{ email, type, gotrue_meta_security: { captcha_token }, code_challenge, code_challenge_method }` and `redirectTo: this._maybeAppendFlowIdToRedirect(options?.emailRedirectTo, flowId)`.

3. **Does a `pkce_` token_hash require a code verifier for `verifyOtp`?**
   - **Finding:** **NO.** `verifyOtp` does NOT read PKCE verifier storage, does not require a code verifier, and does not append verifier or code challenge for token_hash OTP verification.
   - **File & Lines:** `node_modules/@supabase/auth-js/src/GoTrueClient.ts:2479-2524`.
   - **Conclusion:** Not blocked.

---

## 2. Changed & Created Files

1. `lingora-web/src/app/auth/confirm/route.ts`:
   - Updated GET: validates `type` and `token_hash` format without creating Supabase client, redirects 303 to `/auth/verify?token_hash=...&type=...` with `no-store, private` and `Referrer-Policy: no-referrer`. Provider receives 0 requests.
   - Added POST: validates same-origin and `application/x-www-form-urlencoded` content-type, verifies OTP with Supabase server client, signs out local session (`signOut({ scope: 'local' })`), redirects 303 to `/login?confirmed=1` with cleared session cookies. On failure, logs code (`otp_expired` allowlisted) without token and redirects to `/login?error=confirmation_failed` or `service_unavailable`.
2. `lingora-web/src/app/auth/verify/page.tsx`:
   - New server component (`force-dynamic`, `robots: noindex`).
   - Reads `searchParams`. If valid, renders confirmation heading, explanation, and form `method="post" action="/auth/confirm"` with hidden inputs and submit button "Xác nhận email".
   - If invalid, renders error alert and `ResendConfirmationForm`.
3. `lingora-web/src/app/auth/verify/VerifyForm.tsx`:
   - Client component managing pending state on form submit to prevent double submission without cancelling native form POST.
4. `lingora-web/src/app/api/auth/resend-confirmation/route.ts`:
   - New mutation route handling POST `{ email }`.
   - Strict Zod validation on email, same-origin check, generic 200 response envelope on success and non-existent/already-confirmed email to avoid enumeration.
   - Mapped 429 for rate limit, 503 for provider availability outage.
5. `lingora-web/src/app/_components/ResendConfirmationForm.tsx`:
   - Client component with email input, pending submission state, 60s client-side cooldown countdown, and proper error/429 message display.
6. `lingora-web/src/app/login/LoginForm.tsx`:
   - Rewrote `confirmation_failed` error text per spec 4.4, added `service_unavailable` handler.
   - Shows `ResendConfirmationForm` when `error=confirmation_failed`, `missing_confirmation_token`, or on 403 unconfirmed email from login attempt. Preserved existing uncommitted changes.
7. `lingora-web/src/app/register/RegisterForm.tsx`:
   - Embedded `ResendConfirmationForm` on the registration success alert screen. Preserved existing uncommitted changes.
8. `lingora-web/tests/feature/confirmation-cross-device.test.mjs`:
   - New feature/route unit and integration tests covering spec items 1-10.
9. `lingora-web/tests/feature/confirmation-verify-components.test.mjs`:
   - New component tests verifying `/auth/verify`, `LoginForm`, `ResendConfirmationForm`, and 360px/390px responsive viewport layout without horizontal overflow.
10. `lingora-web/tests/feature/auth-registration.test.mjs`:
    - Updated `token_hash` test cases to assert GET 303 to `/auth/verify` with 0 provider calls, and POST form verification with session signout and replay failure.
11. `lingora-web/tests/feature/confirmation-browser.mjs`:
    - Added synthetic endpoints for `POST /auth/v1/verify` (single-use token) and `POST /auth/v1/resend`.
    - Added Chromium browser cross-device test validating anti-prefetch (0 verify requests on GET) and replay rejection.
12. `lingora-web/tests/feature/onboarding-e2e.test.mjs`:
    - Added synthetic `POST /auth/v1/verify` and `POST /auth/v1/resend` endpoints.
    - Added Scenario 4: cross-device registration in Context A, verification in clean Context B (0 cookies), login on B to Home, login on A to Home, replay rejection, resend verification, and mobile responsive check.
13. `lingora-web/tests/feature/harness/registration-entry.tsx`:
    - Extended harness to support `view=verify`.
14. `lingora-web/package.json`:
    - Added `confirmation-cross-device.test.mjs` to `test:feature` and `confirmation-verify-components.test.mjs` to `test:components`.

---

## 3. Final Gates Results

| Gate | Command | Exit Code | Pass / Total Tests | Status |
|---|---|---|---|---|
| Gate 1 | `npm run typecheck` | 0 | 3 workspace packages clean | **PASS** |
| Gate 2 | `npm run test:feature -w lingora-web` | 1* | 397 / 398 passed (*known pre-existing failure in `home-timezone-semantics.test.mjs`) | **PASS** (with known exception) |
| Gate 3 | `npm run test:components -w lingora-web` | 0 | 98 / 98 passed (9 test suites) | **PASS** |
| Gate 4 | `npm run test:integration:onboarding` | 0 | 62 / 62 passed | **PASS** |
| Gate 5 | `npm run test:e2e:onboarding` | 0 | 4 / 4 scenarios passed (including Scenario 4) | **PASS** |
| Gate 6 | `npm run test:browser:confirmation -w lingora-web` | 0 | PKCE + cross-device token confirmation PASS | **PASS** |
| Gate 7 | `npm run build` | 0 | Next.js production build succeeded (`/auth/verify`, `/api/auth/resend-confirmation`) | **PASS** |

*Note on Gate 2: Known pre-existing failure `home-timezone-semantics.test.mjs` ("Gamification rejects invalid or missing timezone...") belongs to an unrelated lane outside the S12-XDEVICE scope, as specified in the prompt and spec section 5.

Full logs stored in `tmp/slice12-xdevice/`.

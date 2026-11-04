# Slice 12 callback diagnostics

Status: **DIAGNOSTICS DEPLOYED AND VERIFIED; historical real-activation failure unresolved. Slice12 NOT ACCEPTED.** Owner authorized Codex to inspect/test callback, cookie transport and runtime configuration, add safe diagnostics and fix a demonstrated defect. Direct Codex work; no Anti, no new public registration, no SMTP/provider change, no original confirmation URL reuse, no Slice13.

## Findings and bounded change

The previous attempt at137f246 reached provider303 → application callback303 with code → login200 with error and no confirmed=1. Provider confirmed the identity; saved verifier matched its S256 challenge. These observations do not prove the cookie reached the handler or establish an SDK/runtime cause. The owned identity/state were reconciled and removed; this package does not reopen that spent attempt.

Actual installed SSR0.12.7/auth-js behavior and application source were inspected. Real SDK tests of actual signup route → proxy → callback pass with both public env variables and production's server-only fallback variables. A production Next/Chromium loopback test also passes after restoring original signup storage state and following a synthetic provider303 redirect. Proxy refresh did not remove the verifier in these tests, so no speculative proxy/auth-flow change was made.

Read-only Vercel inspection: production has encrypted SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. Selective read confirmed the expected DEV origin and publishable key type; no values or credentials are recorded and no environment setting was changed. Presence/type do not establish every aspect of live provider behavior.

A demonstrated separate defect: client-initialization failure returned a redirect without private no-store headers. It now uses the standard auth response headers. The callback also emits `learner_confirmation_failed` only on client/SDK failures, with static phase, allowlisted error code (otherwise unknown), bounded numeric HTTP status (otherwise null), and verifier-cookie presence (or null). It never emits arbitrary error name/message/stack, request URL, code/token/hash, cookie value, inbox, user/subject ID or provider payload. Error result is typed unknown. Existing fixed redirects, upstream-error-first guard, single exchange/verification behavior and signup/email type restriction are preserved.

## Verification

- New diagnostic tests red before implementation:1PASS/4FAIL. The existing success path passed; missing-verifier/provider diagnostics and private no-store init-failure handling failed.
- `npm run test:feature -w lingora-web`: **202PASS/0FAIL**, exit0. Includes six new actual-route/SDK transport/diagnostic cases; existing provider-error precedence, redirects and auth boundaries remain green. Log `/tmp/lingora-s12-callback-feature.log`.
- Focused final six cases PASS, exit0: `/tmp/lingora-s12-callback-diagnostics-final.log`.
- Actual source mutation bypassed the code allowlist:5PASS/1FAIL, exit1; the unknown-code leakage test killed it. Source restored byte-exact, focused suite rerun PASS. Log `/tmp/lingora-s12-callback-diagnostic-mutation.log`.
- Learner typecheck PASS, exit0: `/tmp/lingora-s12-callback-typecheck.log`.
- Production build + real Chromium callback protocol test PASS with public env keys and again with the actual server-only fallback shape: `/tmp/lingora-s12-callback-browser.log`, `/tmp/lingora-s12-callback-browser-server-env.log`. Reusable command: `npm run test:browser:confirmation -w lingora-web`.

Browser test scope: actual Next proxy/signup/callback, real installed SDK, Secure/HttpOnly cookies and original storage-state restoration; synthetic provider bound to loopback, no external provider/DB/email. Missing verifier fails without token POST; successful callback makes one matching token POST, returns303/confirmed=1, persists session cookie and removes consumed verifier. A static browser landing intercept intentionally excludes normal login/bootstrap from this protocol test; it is not full public onboarding acceptance. Child servers/browser close in finally. Synthetic build replaces local .next output only.

The complete auth/cookie/provider-error diff and actual callers/tests were reviewed. No source cause for the historical live failure has been reproduced. This patch supplies missing diagnostics and fixes the proven cache-header defect; it is not an accepted public activation repair. A credential-free synthetic missing-verifier probe may verify the deployed diagnostic, without any fresh registration or usable code/link. Another real attempt remains a separate bounded acceptance step.

Official references checked alongside pinned local SDK source: [Supabase SSR client/proxy](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm), [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow). Installed source remains authoritative for the tested version.

## Deployment and credential-free verification

Source commit `c7b8e40f6004775a33bcf6c5e8df8bc688648c42` pushed; canonical Learner alias READY on deployment `dpl_6Tb8eqQcSjdqpgZ9nGfgVtmp8aXB`. Two credential-free synthetic callback requests used a deliberately invalid synthetic code and no cookie. Both HTTP/status/cache assertions passed. The first local result serializer incorrectly called fetch's numeric status as a function, so metadata saving failed; a second request with corrected serialization saved `/tmp/lingora-s12-callback-public-synthetic-probe.json`. Neither request used a real confirmation URL, registration, email, identity or session. This does not spend a real activation attempt.

Recorded successful probe at2026-11-04T14:01:55.301Z:303 to fixed same-origin `/login?error=confirmation_failed`, Cache-Control no-store/private, request ID `hkg1::hnd1::tdmvp-1793800915442-d200277bb34c`. Vercel runtime lookup scoped to that deployment/window and `learner_confirmation_failed` found the expected diagnostic: phase pkce_exchange, code pkce_code_verifier_not_found, verifierCookiePresent=false. Source behavior and local counter controls show this missing-verifier failure occurs before token POST. No complete runtime log/payload/credential was persisted in Git.

The synthetic diagnostic is proven live; it does not show that the earlier real failure was caused by a missing cookie. The previous identity/session/link were correctly removed and its one-attempt budget remains spent. Exact real callback cause cannot be recovered from the old generic outcome. A new instrumented real activation would require its own explicit bounded authorization and fresh original-email artifact; none has been created by this package. No SMTP/environment/provider mutation or Slice13 work. Current deliverable is the tested diagnostic and demonstrated no-store fix, not accepted public onboarding.

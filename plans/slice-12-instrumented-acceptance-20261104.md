# Slice 12 — instrumented public attempt, 04 November 2026

Status: **FAIL / STOP — Slice12 NOT ACCEPTED; Slice13 NOT STARTED.** Current human action NONE. This is the separately owner-authorized single instrumented attempt after callback diagnostics were deployed. Its one registration and one original-email navigation are spent. No resend, repeat navigation, third registration or downstream login substitute is authorized.

## Provenance and observed outcome

Tested source/deployment SHA `c279720558f61ca9b3a14d052cb7ac9d1a4b0b35` includes diagnostic source `c7b8e40`. Learner deployment `dpl_ESR7q7AQubVUQiLKjMFJd1eEy7TL` and Staff deployment `dpl_4nF33wvCHCC8syjNB2DUbWErvGke` were READY on the canonical aliases before registration. Earlier attempt/evidence at137f246 is preserved separately. No Antigravity call or production source change in this execution.

The owner-supplied original `.eml` was inspected offline. Recipient/run/date/type/origin/callback guards passed; the delivered URL and all original query parameters were used unchanged exactly once with original signup PKCE state. No URL/token/verifier/cookie values or recipient are recorded here. No link prefetch, preview or probe was used.

| Checkpoint | UTC, 2026-11-04 | Result |
| --- | --- | --- |
| Product registration POST | 14:14:06.924 | HTTP200; new unconfirmed Auth identity; no application Account/context/session |
| Delivered email Date | 14:14:11 | Correct signup message |
| Original URL navigation | 14:39:19.795 | Exactly one navigation, 1512.871 seconds after registration |
| Provider `/auth/v1/verify` | 14:39:20.893 | HTTP303 |
| Application `/auth/confirm` | 14:39:23.216 | HTTP303; code present, no incoming provider error |
| Login landing | 14:39:24.223 | HTTP200; error present, confirmed marker absent |

Scoped Vercel runtime lookup on the exact Learner deployment and attempt window found `learner_confirmation_failed`: **phase `pkce_exchange`, code `flow_state_expired`, status422, verifierCookiePresent=true**. This identifies the current attempt's SDK/provider failure. Cookie presence alone does not prove its value, but the observed failure is flow expiry. Complete provider logs, request URLs and payloads are excluded from durable evidence.

Independent read-only inspection before cleanup showed provider email confirmed=true but application Account/context/session counts0. The owned flow was created at14:14:09.526Z; its auth code was issued at14:39:20.814Z. Thus the flow was about25minutes old even though the authorization code had just been issued. Downstream normal login/bootstrap/context/Lesson/Practice/Pause/Resume were NOT RUN.

## Timing finding and limits

The earlier one-hour handoff deadline was incorrect as an activation-readiness guarantee: it used Email OTP TTL3600 only and omitted the separate PKCE flow lifetime. Codex owns this guidance error; it is not attributed to the owner or mailbox scanning. The helper's OTP-based age guard passed, but did not establish that the PKCE flow remained live.

[Supabase's documented error](https://supabase.com/docs/guides/auth/debugging/error-codes) identifies expired PKCE flow state. The inspected [upstream configuration](https://raw.githubusercontent.com/supabase/auth/master/internal/conf/configuration.go) defaults flow lifetime to300seconds. [Upstream expiry logic](https://raw.githubusercontent.com/supabase/auth/master/internal/models/flow_state.go) uses creation time for the signup case; its issuance-time exception applies to magic links. The project's effective flow-lifetime override and deployed provider version were not read, so five minutes is an upstream default, not a verified effective project setting. The live422 independently proves that this attempt's flow expired.

The first real attempt had a different uninstrumented callback failure. Its delay is consistent with this explanation, but this execution does not retroactively establish its exact SDK cause. No SMTP, provider/env configuration, dependency, schema or auth-flow redesign was made.

## Cleanup and independent reconciliation

Actual scoped cleanup **PASS**, followed by a separate root read-only repeatable-read transaction **PASS** at14:45:17.855Z:

- Owned Auth users/identities/sessions/flow_state/one_time_tokens/refresh_tokens all0; owned recipient absent.
- Owned application Account/context/card/review/receipt/audit rows0; no downstream journey state was created.
- All other Accounts, complete owned course/lesson rows and provider-flow baseline unchanged.
- All seven retained S11 groups preserved, including empty groups: consumptions0, attempts4, responses19, completions1, cards1, review operations0, receipts2.
- Private credential, original storage state and extracted URL scratch files absent; original Downloads email preserved. Unexpected residue0.

Sanitized local evidence is isolated under `tmp/slice12-instrumented-20261104T141228948Z/plans/evidence/slice-12-public-acceptance/`: `preflight-final.json`, `registration-checkpoint.json`, `public-auth.json`, `post-failure-readonly.json`, `callback-diagnostic.json`, `final-cleanup.json`, `independent-final-readonly.json`. Private baselines/provenance and raw logs are not committed. Existing feature202/202, typecheck/build and local browser proofs are recorded in the [diagnostic report](2026-11-04-slice-12-callback-diagnostics.md); they were not rerun for this evidence-only update and do not replace public acceptance.

## Stop state

Both separately authorized real attempts are complete: two registrations and two original-email navigations total, zero resends. No pending email request. Preserve this failure and cleanup evidence. Any future attempt needs separate authorization and a handoff ready before registration, bounded by PKCE lifetime as well as email TTL; the present OTP-only helper guard must not be treated as sufficient preflight. No additional attempt or source/config correction is included here. Slice12 remains NOT ACCEPTED.

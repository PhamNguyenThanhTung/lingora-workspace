# Slice 12 public acceptance — 2026-11-04

Status: **FAIL / STOP — Slice12 NOT ACCEPTED. Slice13 NOT STARTED.** The single fresh attempt authorized by the [execution spec](2026-11-04-slice-12-public-acceptance.md) is spent. No resend, second activation, substitute password login or speculative production-auth repair was performed.

## Tested source and helper result

Both canonical aliases were READY at `137f2467d2a2c51a1452da6835ee20dd35c4a97d`: Learner `dpl_2ffoSkfRRqfvLmr8Rgqh8EFjr597`, Staff `dpl_GtgyiXzCYHRTTwkqSCzCtqJBBWpL`. Application callback source remains `9b354c8`; `137f246` separately commits the reviewed helper package. The owner explicitly authorized Codex direct fixes without further Anti calls. Helper review PASS:145 offline tests,36 fresh application registration/login regressions; real source mutations for skipped empty scopes and email stdout leakage were killed and restored byte-exact in disposable copies. Pre-fix source failed13 added regressions. No app/config/schema/dependency change was made.

The helper now preserves the original confirmation URL/query, binds recipient/run/commit/TTL and original PKCE state, persists single-effect markers, queries the complete retained learner/context scope for all seven groups in preflight/journey/cleanup (including empty groups), rejects new rows, and keeps recipient binding private. Successful actual preflight and all seven read-only PostgreSQL snapshot queries passed; counts were0consumptions/4attempts/19responses/1completion/1card/0SRSreview operations/2receipts. Other Accounts, owned curriculum and provider-flow baselines were captured privately before signup.


After the public STOP and completed cleanup, root's final source read found a mechanical journey checkpoint typo: the runner referenced undefined `EVIDENCE_FILE` instead of its configured `evidenceFile`. This branch was not executed and did not cause the observed callback failure. Root fixed that single reference in separate helper commit `a795a4e9db36c400dba8c74f4ec0095f5b0c5bd6`. A new test executes the actual journey with disposable files and mocked DB/env/browser modules: a controlled failure before curriculum mutation/browser launch must still write the configured checkpoint and close DB. Pre-fix145PASS/1FAIL; final **146PASS/0FAIL**, all JS/Python syntax checks PASS. Logs `/tmp/lingora-s12-journey-checkpoint-red.log` and `/tmp/lingora-s12-final-helper-green.log`. No further public attempt or production-auth change was made. The tested live attempt remains at137f246; this later helper patch has offline evidence only.

## Exactly one fresh public attempt

All timestamps below are UTC; add7hours for Vietnam time.

| Checkpoint | Actual observation |
| --- | --- |
| Registration | One product-form POST at12:03:25, HTTP200, confirmation instructions displayed; one new unconfirmed identity and0Account/context/session. |
| Fresh email | Date12:03:29; original downloaded `.eml` parsed offline, exact recipient/run binding; direct expected HTTPS provider `/auth/v1/verify`, type signup, exact Learner `/auth/confirm` redirect, parameter names `token,type,redirect_to`. No displayed live URL, render, preview or prefetch. |
| Pre-navigation | Exact owned identity still unconfirmed; original applicable dedicated PKCE verifier present; message/attempt within3600-second TTL. Original URL used unchanged, once. |
| Provider verification |12:19:43.325: `/auth/v1/verify`303, no provider error. |
| Application callback |12:19:46.090: `/auth/confirm`303, code present, no incoming error/error_code. |
| Login outcome |12:19:47.332: `/login`200, error flag present, confirmed flag absent. Required `confirmed=1` assertion failed. |
| Immediate read-only state | Provider email confirmed=true; Account0/context0/session0; one owned PKCE flow remained. Original verifier hash matched that flow's S256 challenge. |

This fresh failure occurs **after successful provider verification**, unlike the historical otp_expired/no-code event. There is no demonstrated parameter loss, TTL expiry or verifier loss in this attempt. The failed boundary is application callback completion/runtime or code exchange; the exact underlying SDK/runtime error is unavailable because the callback returns a generic login error and Vercel returned no matching runtime logs. A matching saved verifier does not prove the cookie reached the handler. Do not invent a specific provider error or claim a demonstrated source defect.

Normal password login/bootstrap, DEFAULT/SELF_REPORT creation, first Lesson/Practice, Pause/Resume and public nonempty-history preservation are **NOT RUN**. Login is not a substitute for the failed callback. No accepted curriculum was enabled or public learning data manufactured. Local proofs remain separate from missing public acceptance.

## Cleanup and independent reconciliation

The actual scoped cleanup runner returned PASS and removed only the declared disposable identity, its mutable state and one owned PKCE flow. No immutable history existed for the new identity. No bootstrap audit was created. Password, signup storage state and private confirmation URL scratch files were removed; original user-owned Downloads emails were preserved. No SMTP/provider configuration changed.

Codex then ran an independent read-only transaction rather than trusting cleanup's PASS label: all six owned Auth groups0 (users, identities, sessions, flow_state, one_time_tokens, refresh_tokens); owned Account/context/cards/reviews/receipts0; audits0; other Account projections, complete owned Course/Lesson row-text snapshot, global provider-flow baseline and all seven retained S11 row-text groups exactly unchanged. Private scratch absence verified. **Unexpected residue0.**

Sanitized local evidence is under `plans/evidence/slice-12-public-acceptance/`: `public-auth.json`, `confirmation-post-failure-readonly.json`, `pkce-post-failure-readonly.json`, `final-cleanup.json`, `independent-final-readonly.json`. Helper review/checkpoint remain under `plans/evidence/slice-12/`. Private inputs and full logs are not committed.

Current human action: **NONE**. Stop this attempt. Any later callback investigation must retain this evidence and the spent-attempt boundary; no further registration/activation under this package. Historical verification remains unchanged. No Slice13 work.

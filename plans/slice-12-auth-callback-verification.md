# Slice 12 — auth callback investigation / verification

Status: **SLICE 12 NOT ACCEPTED**. Historical race repair remains PASS. No new activation or DEV data write has been performed during this investigation. Canonical acceptance: [Slice 12 spec](2026-11-01-slice-12-onboarding-context.md), [repair verification](slice-12-repair-verification.md), [bounded auth plan](2026-11-02-slice-12-auth-callback.md). Historical verification is retained; its “pre-consumed” shorthand does not establish the consuming actor or mechanism.

## Provenance and timeline

Investigation baseline HEAD `5b1214f140f97ef610d86a4141a71714a8314b6b`; application source `bd88903bbc6cd39c4c90fcaed154891f774b04fb`; historical bounded public attempt HEAD `2280fa56953f3c354000fa1b87e8a6668bb2eaf6`. Maintenance `bc4ecf1` remains separate. Unrelated existing workspace changes are preserved.

Read-only Vercel metadata independently confirms both canonical aliases READY at `5b1214f`: Learner `dpl_Eg2cS1RGfs3sbcnPBknAYc4a7mU8`; Staff `dpl_4sGVUPS4iMSReLkf4CJkbsWZbFzp`. READY is deployment provenance only.

Historical latest attempt (UTC, 2026-11-02):

| Time | Actual evidence | Limit |
| --- | --- | --- |
| 13:34:07.287 | Before-registration READ ONLY snapshot: identity absent | No activation yet |
| By 13:35:44.724 | Exactly one product registration POST200; snapshot identity unconfirmed, Account/context/session absent | Request receipt timestamp was not separately persisted |
| By 13:47:13.123 | Before-browser snapshot: identity confirmed, Account/session absent | Confirming request and exact timestamp not captured |
| Browser confirmation attempt afterwards | Provider `/auth/v1/verify`303 → `/auth/confirm`303 carrying `access_denied` / `otp_expired`, **no code** → `/login?error=missing_confirmation_token`200 | JSON mtime13:48:26Z is file-write time, not HTTP time |
| Scoped cleanup | Owned identity and remaining signup PKCE flow removed; read-only residue0 | Does not restore already-used credentials |

An earlier separate attempt recorded confirmation21.256seconds before agent navigation, no sign-in. User reported copying rather than clicking; delivered chat messages included actual hyperlink targets. These facts support investigation of other consumers, but neither prove a scanner nor identify a chat-preview request.

## Root cause classification

**Upstream verification rejection confirmed; initiating cause unresolved.** The failing provider request never yielded an authorization code, so this recorded failure occurs before app PKCE exchange. Confirmed identity alone does not prove which request consumed a token. Plain wall-clock expiration does not itself explain the earlier confirmation state transition, but expiry plus another confirmation mechanism remains possible.

Current read-only `/auth/v1/health`200 reports GoTrue `v2.197.0`; `/auth/v1/settings`200 shows email enabled, signup allowed, auto-confirm false. Matching [provider verify source](https://github.com/supabase/auth/blob/v2.197.0/internal/api/verify.go) returns `otp_expired` both when a token row cannot be found and when configured OTP age expires. Matching [User.Confirm](https://github.com/supabase/auth/blob/v2.197.0/internal/models/user.go) clears confirmation/one-time tokens. GET PKCE verification can confirm and issue a code without creating a session. Thus confirmed+sessions0 is compatible with another client opening the link without the signup verifier, but is insufficient attribution.

Auth audit table currently has0 rows, including all owned subjects. Vercel runtime-error query returned no errors; historical runtime-log query returned no entries. These are not complete provider/access logs and do not rule out earlier requests. Actual email OTP expiration, effective email template/link tracking settings and provider `/verify` request timeline remain missing. Owner has been asked for redacted metadata only: UTC time, method, status, request ID and TTL; never token/query/email/IP. No historical token or identity is recreated to investigate.

| Hypothesis | Current conclusion | Evidence needed |
| --- | --- | --- |
| True TTL expiry | Not proved/excluded | Effective OTP TTL, sent/verify timestamps |
| Prior consume by another request | Compatible with snapshots and provider implementation | Provider request timeline and token-state transition metadata |
| Email scanner/chat link preview | Plausible only | Attributable earlier verification request; template/tracking metadata |
| Multiple callbacks/exchanges | Not present in captured chain; earlier requests unknown | Provider/access logs over transition window |
| Redirect/auth configuration | Recorded failure reaches correct Learner callback; public settings verified | Effective template and redirect configuration; original nonsecret query fields |

## Source behavior and scoped repair

Confirmed application defect: GET callback ignores upstream `error`/`error_code` and replaces explicit provider failure with `missing_confirmation_token`. Independent anonymous public probe at14:20:29Z reproduced this on READY baseline: synthetic provider-error query303 → fixed login with missing-token error, private/no-store; ordinary missing-token query behaves identically. Neither probe contacts provider verification or creates an activation. Bounded repair maps presence of either parameter to existing generic `confirmation_failed`, before any cookie/client/provider operation, with fixed same-origin login destination and private/no-store headers. It must not echo descriptions/codes, retry verification or turn a consumed token into success. Anti implementation and independent review evidence are recorded below after delivery.

Security assessment: inspected proxy calls getUser only; registration/login do not automatically verify URL tokens. Existing callback consumes token_hash on GET regardless of prefetch headers; code GET exchanges immediately. An independent synthetic actual-route probe (no network) verified one prefetch-marked GET consumes once, replay calls provider again and fails closed. This is a pre-existing exposure, not remedied by error mapping. A callback patch cannot intercept a scanner contacting the email's direct Supabase URL first. [Supabase guidance](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching) describes OTP entry or an inert intermediate page with explicit confirmation. Such a durable mitigation requires paired effective email-template configuration; header filtering alone is insufficient. No speculative auth/template redesign has been applied.

Installed SDK and original signup cookies must remain authoritative for acceptance. Existing test helper reconstructs the provider URL from token/type/redirect; it can discard nonsecret provider parameters such as flow identifiers. Preserve actual nonsecret parameters privately if another bounded attempt opens; do not silently test a different URL or broaden into multi-flow redesign.

## Read-only reconciliation and public gate

Fresh independent REPEATABLE READ READ ONLY reconciliation at14:14:14Z passed for all3 previously owned Auth subjects: users/identities/sessions/flow_state/one_time_tokens/refresh_tokens0; Account/context/SRS0; bootstrap audits0. Full retained Course/Lesson rows and other Accounts match historical baseline exactly; global provider flow index matches baseline. Private acceptance credentials/token/storage files are absent. **Unexpected residue0**; no new cleanup mutation was needed.

Commands from repository root (scratch diagnostic scripts are ignored, not release artifacts): `node tmp/slice12-auth-investigation/read-provider.mjs`, `node tmp/slice12-auth-investigation/read-provider-details.mjs`, `node tmp/slice12-auth-investigation/reconcile-readonly.mjs` — all final exit0, read-only. Initial scratch diagnostics incorrectly called native Response.status as a function; corrected locally, not an application/provider failure. Synthetic probe command from Learner cwd: `node --experimental-strip-types --experimental-test-module-mocks --import ./tests/feature/harness/server-only.mjs ../tmp/slice12-auth-investigation/probe-prefetch-retry.mjs` — exit0 after correcting a scratch path. No production change or live retry was needed for either mechanical error.

New public registration/confirmation/login/context/Lesson/Practice: **NOT RUN**. No additional activation, resend or rate-limit workaround. Missing historical provider/config evidence and safe fresh-token preflight block public acceptance. Independent local or deployment PASS will not satisfy the remaining journey. Final Slice 12 verdict remains **NOT ACCEPTED** until all checkpoints and scoped cleanup/read-only residue0 are observed.

## Local verification and correction evidence

Anti initially delivered a17-line callback change and six targeted regressions. Independent Codex/Sol review found no production guard defect, but found a vacuous conflicting-PKCE test: without a verifier, SDK fails before fetch even when guard is bypassed. Codex's real mutation suppressed only the `code` case; all35 registration tests still passed. Baseline/restored suites passed and original production bytes were restored. The single authorized Anti correction round seeded an exchange-capable synthetic verifier, asserted exact preservation and zero provider calls, and instrumented cookie retrieval/read counters with a positive normal-path control. Codex reran the same mutant: **KILLED**, exactly the conflicting-PKCE case fails (`providerCalls1 !=0`); baseline/restored35/35 pass, original production bytes restored. Root independently reran final Learner features196/196. This is a test-fidelity finding and correction, not evidence of a production token-validation bypass. Final independent re-review follows below.

Initial fresh `npm run test:feature`:609/609 (Admin413 + Learner196). `npm run test:components`:168/168. Both typechecks and both production builds exit0. Built static client scan42 files: zero actual private credential, server import or learner answer-contract matches. Correction changes tests only; affected checks will rerun after delivery.

Fresh default `npm run test:integration:onboarding` initially failed33/34: both test files concurrently initialize shared `en` using Prisma upsert, producing P2002 in `createPracticeFixture` before the first context case. Both fixture sites are unchanged by this callback patch. No production race was reopened or changed. Exact same34 tests passed on a new owned all-migrations loopback database when test files run sequentially:

```sh
node scripts/local-test-db.mjs node --experimental-strip-types --experimental-test-module-mocks --import ./lingora-web/tests/feature/harness/server-only.mjs --test --test-concurrency=1 lingora-web/tests/feature/auth-bootstrap-postgres.test.mjs lingora-web/tests/feature/context-concurrency.test.mjs
```

This serializes file-level fixture setup only; actual bootstrap contenders, lock/writer schedules, Pause/Learning overlap and exact history/SRS preservation assertions still execute. Default-command fixture startup remains a pre-existing harness reliability risk; no infrastructure change or failing-test suppression is included. The earlier unrelated Lesson/Practice20 PostgreSQL results remain historical, not represented as fresh executions here.

## Final bounded release and independent verdict

The single correction round is complete. [Independent Sol final review](evidence/slice-12-auth-investigation/final-review.md) **PASS**, with the initial PKCE test-fidelity finding resolved. Codex inspected actual source/diff, SDK behavior, tests, before/after mutation logs, HTTP results and DB state; no worker label substitutes for this evidence. No further source/test correction was made or authorized.

Source/spec commit **`9b354c83965ed10484a2cf9235bd8a87ca5894c1`** pushed to origin/main. This commit is the tested application revision for the bounded fix; earlier `bd88903` remains historical feature source. Maintenance `bc4ecf1` is an existing separate ancestor commit and was neither merged, cherry-picked nor amended in this task. No schema/migration/dependency/fixture infrastructure change.

Both canonical aliases independently READY at `9b354c8`:

- Learner: `dpl_BCJdrepnwtP9LYwDV7vpBkjfqfUH` (`lingora-learner-aipt3ty9x-tungtin201205-8010s-projects.vercel.app`).
- Staff: `dpl_GWdNceUusTavbWPoNHpFxEDfNxeS` (`lingora-workspace-qiwcqeeyi-tungtin201205-8010s-projects.vercel.app`).

Anonymous canonical public probes at14:34:40–42Z: upstream `access_denied`/`otp_expired` query and empty `error_code` both303 → fixed login `confirmation_failed` → login200. Ordinary missing token still303 → `missing_confirmation_token` → login200. All callback responses private/no-store. These probes use **no activation credential** and prove only diagnostic repair, not successful confirmation. Final static scan42 local +23 public files has zero actual private-secret/server-import/learner-answer matches.

Final read-only DEV reconciliation at **2026-11-02 14:34:42.034Z** confirms all3 previously owned subjects absent across Auth users/identities/sessions/flows/one-time/refresh tokens and app Account/context/SRS; bootstrap audits0. Exact other-Account/full-runtime/provider-flow baselines unchanged; private acceptance password/token/storage files absent. No new live data writes, activation, PKCE or learning state to clean. **Unexpected residue = 0**.

Final relevant commands from repo root: `npm run test:feature` (609), `npm run test:components` (168), `npm run typecheck`, `npm run build` — exit0; after tests-only correction `npm run test:feature -w lingora-web` (196) and targeted registration suite (35) independently exit0. Actual mutation before/after correction and exact source restoration inspected as above. Owned PostgreSQL34 passes with the explicitly documented serial-file command; default command's fixture collision remains disclosed. Remaining raw sanitized logs/JSON are ignored under `tmp/slice12-auth-investigation/` and `plans/evidence/slice-12-auth-investigation/`; no credentials, storage state or generated raw reports are committed. Documentation follow-up does not change tested application source.

**FINAL VERDICT: SLICE 12 NOT ACCEPTED.** The bounded diagnostic fix is independently PASS and publicly verified. Token-loss root cause is classified as upstream verification rejection with unresolved initiating actor/expiry branch; effective TTL/template and historical provider request metadata are still missing. No new registration→valid confirmation/code callback→login→context→Lesson→Practice journey was attempted without that safe preflight. Historical registration200 and cleanup PASS remain valid; no happy-path callback or downstream public PASS is claimed. Supabase owner metadata and a safe one-attempt activation handoff are the next dependency, not Slice13. No resend, rate-limit bypass, service-role confirmation or SQL-fabricated learner data was used.

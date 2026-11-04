# Lingora takeover audit — 2026-11-04

Audit completed before documentation edits. No production source/configuration change, registration, activation, resend, cleanup or DEV database write. One Sol 6.1 High read-only planning pass inspected the repository independently. Findings below distinguish freshly observed state from retained acceptance evidence.

## ACTUAL STATE

Git: branch `main`; local HEAD, local `origin/main`, and live `git ls-remote origin refs/heads/main` all equal `95816ab18bb4d5bebc3d046244074ff34954fe0b`. Ahead/behind `0/0`; no staged changes; no open PR returned by GitHub search. Existing unrelated changes: modified `AGENTS.md`, `lingora-admin/prisma/product/README.md`; untracked `plans/2026-10-28-database-closure.md`, `plans/2026-10-28-database-forensic-stabilization.md`, `plans/2026-11-01-project-status.md`. Preserve all five.

Actual immediate-parent ancestry:

```text
b9901d9 → bc4ecf1 → bd88903 → 2280fa5 → 5b1214f → 9b354c8 → 95816ab
```

`bc4ecf1` is a distinct maintenance commit AND an ancestor of the feature, callback fix and HEAD. It is not an independent branch or excluded from the deployed tree. Original Slice 12 feature/repair source: `bd88903`; latest callback source/tests: `9b354c8`; `95816ab` changes documentation only. No uncommitted application source/test changes were present.

| Deployment, freshly read through Vercel | State / commit / canonical alias |
| --- | --- |
| Learner `dpl_13RotAz6cfUjGrn6AQPyRoaT8Hra` | READY / `95816ab` / `https://lingora-learner-dev.vercel.app` |
| Staff `dpl_61tGvNjvjcoHSBxLYsV5aFfNGZLS` | READY / `95816ab` / `https://lingora-workspace.vercel.app` |

Both GitHub Vercel commit statuses are `success`. READY is deployment provenance, not successful onboarding acceptance.

| Slice | Reconstructed status | Evidence inspected |
| --- | --- | --- |
| 1 — Admin auth/Languages | ACCEPTED, historical | Source/tests; `b140e08` Git tree's independent final review, gate verification and real CRUD/conflict/cleanup live flows |
| 2 — Frameworks/Levels | ACCEPTED, historical | Source/tests; `eabcbbc` tree's canonical-UUID live flows, real CEFR navigation/CRUD/conflict/cleanup |
| 3 — Courses/Units | ACCEPTED | `slice-3-final-patch-verification.md`, replacing the earlier failed patch reports |
| 4 — Teacher lifecycle | ACCEPTED | `slice-4-verification.md`, activation/disable/enable and audit retention |
| 5 — Assignment/drafts | ACCEPTED | `slice-5-verification.md`, real revisions and explicitly retained DEV set |
| 6 — Exercise/Vocabulary/Media foundation | ACCEPTED | `slice-6-verification.md`, revision isolation and retained inventory |
| 7 — Submit/review/publish | ACCEPTED | `slice-7-verification.md`, exact public revision/review/cleanup evidence |
| 8 — Assessment authoring | ACCEPTED | `slice-8-verification.md`, assembly-timeout correction and public retry/DB evidence |
| 9 — Learner auth/context | ACCEPTED | `slice-9-verification.md`, runtime packaging fix and public session/role/isolation evidence |
| 10 — Lesson consumption | ACCEPTED | `slice-10-verification.md`, retained public/DB/migration artifacts |
| 11 — Practice/grading/completion | ACCEPTED | `slice-11-verification.md`, public 24 checks and retained DB history freshly reconciled below |
| 12 — Onboarding/context lifecycle | Implemented; repair/callback fix verified; NOT ACCEPTED | Actual source/tests, repair and callback verification, raw gate/mutation logs and live metadata |
| 13 | Not started; no canonical Slice 13 spec found | `plans/`, roadmap and remaining-scope references do not define an approved numbered next slice |

Slices 1–11 are retained accepted work, not freshly rerun public journeys. Older Slice 1/2 artifacts were deliberately removed by `2e73b5c`; their Git-tree replacements were inspected without restoring files. No retained evidence establishes Slice 12's successful public journey.

## VERIFIED FACTS

- Callback `lingora-web/src/app/auth/confirm/route.ts` rejects presence of `error` or `error_code` before cookie retrieval, client construction, or provider consumption. It uses fixed same-origin login, generic `confirmation_failed` and private/no-store headers. Relevant tests invoke the real route/installed SDK; the conflicting-code case seeds an exchange-capable verifier and checks its exact preservation.
- Fresh targeted registration/auth/callback suite: **35/35**, exit 0, no skips. Command from `lingora-web`: `node --experimental-strip-types --experimental-test-module-mocks --import ./tests/feature/harness/server-only.mjs --test tests/feature/auth-registration.test.mjs`. Audit log: `/tmp/lingora-takeover-20261104-registration.log`.
- The historical failing chain is provider verification rejection → callback with `access_denied`/`otp_expired`, without code. The identity was already confirmed before recorded browser navigation. This failure precedes application PKCE exchange; it does not identify the confirming request or rule out a distinct PKCE issue in a future successful-code flow.
- Fresh public GET with no credentials returned 303 to `/login?error=missing_confirmation_token`, `Cache-Control: no-store, private`. Two synthetic provider-error GET probes were transport-unverified (TimeoutError/TypeError); no fresh public provider-error response is claimed. The successful provider-error public probes in the prior callback verification remain historical.
- Fresh read-only provider health/settings: GoTrue `v2.197.0`, email enabled, signup allowed, auto-confirm false. Public settings do not expose effective OTP TTL/template/redirect configuration.
- Owner screenshots supplied during audit show current Email OTP expiration **3600 seconds**, OTP length **8**, Staff Site URL, and explicit allowlisted Learner `/auth/confirm` plus two Teacher callbacks. This is owner-supplied current UI evidence, not independent management-API verification or proof of historical saved configuration. The email screenshot shows Preview, not template source/href. The log screenshot shows **2026-11-04**, not the historical failure window.
- Owner subsequently reported Source access prompts custom-SMTP setup; the screenshot shows the setup form with placeholder host/username/sender fields. This does not prove a saved active custom SMTP configuration. Source/tracking remain unavailable; no setup/config save was requested. Built-in delivery restrictions are documented in [Supabase SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp); changing delivery providers is outside this evidence-only audit.
- DEV queries explicitly used `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY`. At 2026-11-04 01:33:30Z the three historical Slice 12 subjects were absent from Auth users/identities/sessions/flow_state/one_time_tokens/refresh_tokens and app Account/context/SRS. Bootstrap audits 0; all other Account projections, full retained Course/Lesson runtime rows and provider-flow baseline equal the pre-registration evidence. Checked private acceptance files absent. Follow-up reads confirm owned consumption/attempt/completion/assessment/review-operation history 0.
- Retained Slice 11 baseline projections freshly match: four Accounts, two PAUSED contexts, four attempts, nineteen responses, one completion, one SRS card and two completion receipts. Scoped counts remain attempts4/completions1/consumptions0/cards1/review-operations0/sessions0. These are exact comparisons of the recorded projections, **not** new byte-exact full-history snapshots. No unexpected residue found in these checked scopes.
- Six completed DEV migrations match the repository inventory: product baseline/finalize/correction/remediation, database closure, lesson consumption. No migration was applied during this audit.

Verification provenance and rerun decision:

| Gate | Actual available evidence | Audit action |
| --- | --- | --- |
| Feature | Callback-era raw log totals609/609; post-correction Learner196/196 | Read raw logs/source provenance; reran affected registration35/35 only |
| Components | Raw callback-era logs168/168 | Historical; source unchanged, no rerun |
| Typechecks / builds | Raw callback-era logs and final review report success for both apps | Historical, not freshly executed; HEAD since callback fix changes docs only |
| PostgreSQL | Repair logs34 onboarding +7 reading +13 Practice; callback-era serial onboarding34/34 | Historical; DB logic/fixtures unchanged by callback fix; no disposable DB rerun needed for this audit |
| Default onboarding command | Callback-era default run33/34, P2002 at shared `en` fixture startup | Still unreliable: both files retain competing upserts and default script retains concurrent file execution |
| Mutation/negative controls | Six repair mutants fail intended assertions; callback PKCE mutant survived before test correction and fails after; baseline/restored runs pass | Inspected metadata AND raw failure assertions; no new source mutation during audit |
| Client-secret scans | Callback-era42 local +23 public files, zero actual private-secret/server-import/learner-answer matches | Historical; no bundle-affecting change since tested callback source; no fresh scan claimed |

Deterministic historical onboarding command (not the default command):

```sh
node scripts/local-test-db.mjs node --experimental-strip-types --experimental-test-module-mocks --import ./lingora-web/tests/feature/harness/server-only.mjs --test --test-concurrency=1 lingora-web/tests/feature/auth-bootstrap-postgres.test.mjs lingora-web/tests/feature/context-concurrency.test.mjs
```

## STALE / CONFLICTING CLAIMS

- `plans/current-task.md`, `plans/roadmap.md`, README's Slice 12 summary omit the latest callback fix or imply proven token consumption. Update only these canonical summaries after audit; preserve historical reports.
- “Maintenance stays separate” means a separate commit, not separate ancestry. All six requested commits are ancestors of HEAD.
- Old feature600/603 and two DEFAULT races describe the original failed task. Actual repaired locking source, 603/603 repair logs and six behavioral controls supersede them. Do not rewrite `slice-12-verification.md` to erase that failure.
- “54 PostgreSQL PASS” belongs to the repair run. It must not imply the later default onboarding command passed: that later command failed33/34; serial-file34/34 is a different invocation.
- Historical429 is real but not evidence of a current rate-limit blocker. The latest historical bounded registration returned200; current quota has not been verified by sending another email.
- `plans/2026-11-01-project-status.md` is an existing untracked historical snapshot of the original STOP, not the current canonical task. Leave it untouched.

## OPEN BLOCKERS

**Proved:** required public registration → valid provider confirmation → application callback → normal login/bootstrap → context → Lesson → Practice/lifecycle acceptance has not succeeded.

**Unproved:** expired-by-age versus prior token invalidation/consumption, confirming actor, scanner/chat-preview attribution, effective template/link rewriting and full historical redirect settings. Current screenshots narrow configuration uncertainty but do not resolve history.

**Hypotheses only:** another verification GET (scanner, preview or other client), actual age expiry, rewritten email link, dropped original nonsecret flow parameters in the old acceptance helper, or another confirmation mechanism. No auth redesign follows from any one hypothesis.

**Missing evidence:** template Source/href shape, SMTP/link tracking, saved current TTL confirmation and historical TTL if available; provider/API Gateway `/auth/v1/verify` metadata around **2026-11-02 20:35–20:49 UTC+7 / 13:35–13:49Z**, especially the unconfirmed→confirmed interval. No tokens/query strings/private email/IP/credentials should be shared.

Fresh DB Auth audit query for that window returned no rows. Vercel error-cluster query returned no errors, but the runtime-log API explicitly failed400 because the historical range exceeds plan retention. **Unavailable logs are not empty request logs.** Current tools contain no Supabase management connector; project-scoped app credentials/public settings cannot supply management configuration/access-log evidence. Owner has been shown where to retrieve redacted metadata. A missing historical log alone is not a reason to invent attribution; a future attempt still needs an adequate current safe preflight.

## RISKS / DEBT

- Shared `en` setup race is **test harness reliability debt**, not a demonstrated production defect or the current public acceptance blocker. Serial file startup preserves the actual within-test concurrency schedules. No harness change made merely to obtain green output.
- `tmp/slice12/public-auth.mjs` reconstructs the provider link from token/type/redirect and can discard original flow parameters. Do not reuse it unchanged for acceptance. This is an acceptance-helper limitation, not established cause of historical token loss.
- `tmp/slice12/public-journey.mjs` only starts Practice and snapshots three history tables. It cannot by itself prove grading completion or full SRS/response/receipt preservation. Use explicit checkpoints and complete reconciliation in the continuation spec.
- GET confirmation consumes valid credentials immediately; scanner exposure is a known provider-link risk. A durable alternative would require paired template/source design, outside an evidence-only audit. Supabase documents [prefetch and tracking limitations](https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching). Matching [v2.197.0 verify source](https://github.com/supabase/auth/blob/v2.197.0/internal/api/verify.go) uses `otp_expired` for both lookup failure and age expiry; the error alone cannot attribute this incident.

## NEXT ACTION

**C. `SLICE 12 NEEDS HUMAN/PROVIDER EVIDENCE`.** No additional production source fix is justified by present evidence. Finish the missing current configuration/safe-handoff preflight, record historical-log availability honestly, then use the [one-attempt continuation spec](2026-11-04-slice-12-public-acceptance.md). No new activation was executed. Slice 13 stays unopened. This audit updates docs only; no commit/push/deployment is part of its result.

Independent Sol 6.1 High final review of the five audit/spec/canonical-document changes: **PASS, no material findings**. Reviewer inspected actual documents/diff, callback/source/tests, helpers and raw historical gate/mutation evidence; no live operations or edits. Root local-link checks and `git diff --check` pass. This accepts the audit/documentation package only; **Slice 12 remains NOT ACCEPTED**. Anti was not dispatched because production implementation is not justified and public preflight remains incomplete.

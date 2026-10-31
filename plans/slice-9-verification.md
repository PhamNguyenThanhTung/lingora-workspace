# Slice 9 verification — Learner Auth / Learner Context Foundation

Status: **PASS — SLICE 9 ACCEPTED** on 2026-11-01 (Asia/Saigon). Local gates and actual public acceptance PASS.
Spec: [learner auth/context](2026-10-31-slice-9-learner-auth-context.md). Baseline `7daeae9`; Slice 0–8 remain accepted. No Slice 10.

## Contracts and implementation

- Separate `lingora-web` npm/Next.js app, with its own learner UI, routes, cookie namespace and trusted server backend. Single existing product schema/generated Prisma mapping; no migration or second schema owner.
- Existing email-confirmed ACTIVE LEARNER Account only. Supabase UUID must resolve matching Account; exact role/status read freshly on every protected request. No signup/provisioning UI, Teacher activation reuse or automatic Account repair.
- Provider settings read-only: email enabled, confirmation required. Provider signup being enabled does not supply the missing product Account lifecycle. DEV fixture setup uses a disposable owned Auth+Account after local gates.
- Password login `/login` → `/home`; logout → `/login`, fixed learner-origin paths. No provider callback/redirectTo introduced; Supabase redirect allowlist is not used or changed by this flow. Existing staff activation/local entries are preserved.
- Dedicated HttpOnly, Secure in production, SameSite=Lax, host-only cookies. Learner denial/logout uses provider `scope: local` and clears only its exact cookie namespace/chunks.
- 401 invalid/unrefreshable session; 403 missing Account/wrong role/inactive/unconfirmed email; 503 provider/DB outage. Refreshable access-token expiry uses the real SDK refresh transport.
- `LearningContext` is the real course association, unique per learner/language, with no current/default pointer or Enrollment table. API rejects selectors and queries only verified subject; explicit safe DTO maps owned contexts and parent/framework/level summaries.
- Empty `contexts: []` is successful200 and “Bạn chưa có lộ trình học.” Null levels, PAUSED contexts and inactive courses remain truthful summaries. Invalid owner/joined-parent/framework scope fails409. Preferences/placement/progress/runtime remain deferred.

## Anti handoff and Codex review/fixes

Anti delivered the app/workspace, auth/context/API/UI and initial tests. Its claimed PASS was not final acceptance. [Independent senior review](evidence/slice-9/review.md) requested four changes.

Codex fixed directly:

1. Global sign-out replaced with local scope; exact namespace cleanup preserves other cookies.
2. Provider `email_not_confirmed` maps403 with guidance; generic/phone confirmation cannot substitute for `email_confirmed_at`.
3. Context parent object IDs must match scalar FKs, in addition to language/framework/ownership validation.
4. Removed the harness's duplicate login/logout implementation. Controlled browser flow now invokes actual LoginPage/Form → actual login handler → cookie transport → actual HomePage/loader → rendered identity/context, then actual logout and next401. Actual page403/409/503/empty/invalid-session/retry branches are exercised.
5. Replaced vacuous transport checks with real SDK login/refresh, chunk/flags, downstream cookies and SDK Cache-Control/Expires/Pragma on success403/503/redirect responses. Removed manual cookie repair from logout proof.
6. Logout HTTP/network failure now retains usable home and exposes retry; retry pending uses React transition. Added enforced `server-only` DB boundary and sanitized DB logging.
7. Public acceptance exposed missing learner Production DATABASE_URL, then a separate Prisma `ENGINE_NOT_FOUND` packaging bug. Configured the existing DEV connection through authenticated CLI stdin as a Production Secret. Added category-only DB diagnostics and copied only generated schema/native engines into the learner runtime fallback directory, with explicit monorepo tracing. One schema owner; no dependency/schema change or migration.

Regression RED→GREEN evidence and exact commands are in `plans/evidence/slice-9/`. The original review remains historical REQUEST CHANGES; Codex owns the resolved final PASS verdict, including the public runtime fix.

## Local gates (Codex)

| Gate | Result |
| --- | --- |
| Root `npm run test:feature` | PASS471: staff412 + learner59, fail0, skipped0 |
| Root `npm run test:components` | PASS138: staff121 + learner17, fail0, skipped0 |
| Root `npm run typecheck` | PASS both apps |
| Root `npm run build` | PASS both apps |
| Clean owned workspace, no env/generated/dependencies copied; `npm ci --ignore-scripts --no-audit --no-fund`, then root build | PASS; client generated from existing schema, no migrations |
| A–F semantic mutations | All KILLED; every source restored byte-exact; restored root suites/build PASS |
| Local client scan | PASS38 JS/map/HTML files; secret/private-import matches0 |
| Server traces | Learner fallback schema/native engine traced for login/home/context; Prisma config/deepmerge absent from all three runtime traces |
| Runtime packaging regression | PASS4 asset/tracing checks +1 category-only diagnostics check; [clean learner install/build](evidence/slice-9/runtime-clean-build.json) from no env/generated/dependencies, copied assets present in actual NFT traces; owned workspace removed |
| Unrelated workspace changes | Preserved byte-exact and excluded from task commits |

Mutation details: [results](evidence/slice-9/mutations/results.json). A wrong-role guard, B ACTIVE guard, C foreign-owner serialization, D wrong real login destination, E empty-context denial, F staff admission. D/E fail through real page/browser behavior; F also exercises actual staff login denial. Actual staff catalogue/teachers/courses/review/assessment/Teacher handlers and `/my-lessons` reject the verified Learner subject in controlled integration.

Native audit returned3 high entries for one baseline Prisma CLI/config transitive advisory, critical0. [Triage](evidence/slice-9/dependency-triage.md) records why attacker-controlled cyclic graphs cannot reach this build-only config path, defers the proposed Prisma major upgrade and sets review2026-11-07. No dependency version upgrade or weakened audit threshold.

Build retains the existing generated-Prisma dynamic tracing warnings; builds complete and required runtime assets are traced. No missing-engine claim is deferred to public testing.

## Public deployment and recovery

- Initial implementation `6bd70a2ec7e80458cb8f4f2cedb1a8be818c9b53` and local evidence were pushed before live writes. Dedicated learner project `prj_qRvrlMQCydoDKw7FQHPmUV8sa1iz`, root `lingora-web`, Node24, outside-root source enabled. Existing staff project/configuration remains unchanged.
- Learner has Production SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and sensitive DATABASE_URL. No Supabase Admin/service secret is deployed to the learner app. The DB value travelled directly from the local server env to CLI stdin, never chat/argv/evidence. CLI logout succeeded; its isolated RAM credential directory and downloaded temporary CLI package were removed.
- Five owned attempts failed safely before the packaging fix: initially missing configuration, then actual account lookup503. Safe runtime log on diagnostic commit `9096c04e136a990fcd25bcddf527566de587cf23` identified `learner.account_lookup_failed { category: ENGINE_NOT_FOUND }`. Every attempt closed sessions/browser, deleted Account/Auth fixture and proved unchanged other accounts/residue0. [Recovery history](evidence/slice-9/public/recovery.json).
- Root cause: Turbopack bundles the shared custom-generated Prisma client; its generated directory fallback is `<app cwd>/generated/product-client`. Staff assets existed there in its own app, but learner assets did not. Local NFT inclusion of the original staff directory did not prove the learner runtime lookup would succeed. Fix `83aacbfc473199cc23fe158d77e484eb2af12bdc` copies only schema/native engines after the existing generator and traces the learner fallback assets explicitly. [Next.js tracing documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/output). No generated/private file was committed.
- Before the successful live retry: exact learner fix deployment `dpl_BTWu9THdeoWDQ3ewmHWoj3BTn2Hw` READY, stable alias independently resolved to that ID/SHA; staff deployment `dpl_5fRLtULza88LXM1k8jqGqtxqfjzQ` READY on the same commit. Stable [learner DEV](https://lingora-learner-dev.vercel.app/) and [staff DEV](https://lingora-workspace.vercel.app/).

## Public acceptance — PASS

Actual public LoginPage/form → real Supabase password authentication → dedicated cookie transport → actual HomePage/loader and context API. No injected session/token or storageState. [Sanitized acceptance/DB evidence](evidence/slice-9/public/acceptance.json), [empty home](evidence/slice-9/public/learner-empty-home.png), [disabled state](evidence/slice-9/public/learner-disabled.png).

| Proof | Result |
| --- | --- |
| Anonymous context / wrong password |401 /401 |
| Real confirmed ACTIVE Learner attempts actual staff UI login |403 FORBIDDEN; actual protected staff handlers also reject Learner in integration |
| Public learner login / destination |200; exact learner origin `/home` |
| Protected home/context identity | Owned fixture UUID/name, LEARNER ACTIVE, safe fields only; contexts[]200 and truthful empty state |
| Client-supplied other learner selector |400; identity is session-scoped |
| Same cookie after owned ACTIVE→DISABLED | Next context403 ACCOUNT_INACTIVE; denied home retains usable Logout |
| Controlled DISABLED→ACTIVE, same cookie retry | Context200 and actual home empty state recovered; real recoverable failure proof |
| Read-only repeatable-read DB comparison | Confirmed Auth UUID equals Account UUID; LEARNER ACTIVE, rowVersion3 after two transitions, contexts0; other Accounts unchanged |
| Actual UI logout / next context request |200 → learner `/login`; next401 |
| Cleanup | Owned Account → Auth deleted, context0; unexpected residue0; all browser contexts/process closed |

All21 public checks PASS on fix commit `83aacbf`. The successful fixture was `DEV_S9_1793467583806`, UUID `2cc9dd6d-5fa0-47ef-8d7c-b59ee583efde`; it has been deleted. All six attempted disposable fixtures were cleaned. Existing Teacher/canonical Account baselines remained unchanged. No retained fixture or allowlisted history is required.

Client secret scan PASS:38 local JS/map/HTML files +19 public HTML/JS files across both origins, and9 authenticated home/JS files checked in RAM; secret/private-import matches0. No public source maps were linked by the scanned pages; emitted local maps were included. Existing dependency triage remains explicit; no new dependency was added.

Initial local acceptance was retained while only env configuration changed. After actual source changes, affected diagnostics regression, final root feature471/components138/typecheck/build, clean learner install/build and bundle scan were rerun and PASS. Initial A–F mutations remain KILLED/restored; the runtime patch changes packaging/error diagnostics, not guard/context/navigation semantics.

Final docs/evidence commit is pushed after this public PASS; its exact learner/staff READY deployments are checked and reported in the delivery. No local or live acceptance rerun solely for documentation changes. Unrelated workspace edits remain outside every task commit. No Slice 10, signup, Lesson/progress/assessment runtime or schema migration.

`SLICE 9: PASS`
`SLICE 9 ACCEPTED`

# Slice 9 verification — Learner Auth / Learner Context Foundation

Status: **LOCAL ACCEPTANCE PASS; PUBLIC ACCEPTANCE BLOCKED ON REQUIRED DEV DATABASE_URL**. Overall Slice 9 is not accepted.
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

Regression RED→GREEN evidence and exact commands are in `plans/evidence/slice-9/`. The original review remains historical REQUEST CHANGES; Codex owns the resolved local verdict.

## Local gates (Codex)

| Gate | Result |
| --- | --- |
| Root `npm run test:feature` | PASS466: staff412 + learner54, fail0, skipped0 |
| Root `npm run test:components` | PASS138: staff121 + learner17, fail0, skipped0 |
| Root `npm run typecheck` | PASS both apps |
| Root `npm run build` | PASS both apps |
| Clean owned workspace, no env/generated/dependencies copied; `npm ci --ignore-scripts --no-audit --no-fund`, then root build | PASS; client generated from existing schema, no migrations |
| A–F semantic mutations | All KILLED; every source restored byte-exact; restored root suites/build PASS |
| Local client scan | PASS38 JS/map/HTML files; secret/private-import matches0 |
| Server traces | Shared Prisma native engine/schema present; Prisma config/deepmerge absent from inspected home/context runtime traces |
| Unrelated workspace changes | Preserved byte-exact and excluded from task commits |

Mutation details: [results](evidence/slice-9/mutations/results.json). A wrong-role guard, B ACTIVE guard, C foreign-owner serialization, D wrong real login destination, E empty-context denial, F staff admission. D/E fail through real page/browser behavior; F also exercises actual staff login denial. Actual staff catalogue/teachers/courses/review/assessment/Teacher handlers and `/my-lessons` reject the verified Learner subject in controlled integration.

Native audit returned3 high entries for one baseline Prisma CLI/config transitive advisory, critical0. [Triage](evidence/slice-9/dependency-triage.md) records why attacker-controlled cyclic graphs cannot reach this build-only config path, defers the proposed Prisma major upgrade and sets review2026-11-07. No dependency version upgrade or weakened audit threshold.

Build retains the existing generated-Prisma dynamic tracing warnings; builds complete and required runtime assets are traced. No missing-engine claim is deferred to public testing.

## Public stage

Implementation/source commit `6bd70a2ec7e80458cb8f4f2cedb1a8be818c9b53` pushed to origin/main after local gates.

- Learner project `prj_qRvrlMQCydoDKw7FQHPmUV8sa1iz`, root `lingora-web`, Node24, include outside-root source, region hnd1. Separate project in existing team; no staff configuration changes. Learner deployment protection opened for the requested public DEV login; application role/status guards remain enforced.
- Exact learner deployment `dpl_ACmThC2oCmSpK3tufeFz8gppQBqZ` READY, stable [learner DEV](https://lingora-learner-dev.vercel.app/). Staff exact same-commit deployment `dpl_Cmo6o67JBZMb3e8NVgFYV7i1KdLH` READY; staff login200 at unchanged stable URL.
- Public read-only learner login200, actual anonymous home→login redirect, context401/private-no-store PASS. Browser context closed. See [read-only proof](evidence/slice-9/public-read-only.json) and screenshot.
- Client scan PASS:38 local files +19 publicly fetched HTML/JS files across both stable origins, secret/private-import matches0. No public maps were linked by these HTML pages; local emitted JS/maps were scanned.
- Learner runtime has only SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY configured. No service/Admin key copied. Required Production DATABASE_URL is absent, confirmed by env metadata only; existing staff Secret cannot be read/copied by connector. Secure dashboard input requested, never credential in chat.

**Remaining blocker:** configure the same Supabase DEV DATABASE_URL as a Production Secret in learner project, then redeploy the same source and verify READY before owned fixture writes. Real public login/context, staff role denial, disable→restore retry, read-only fixture DB proof and cleanup are still pending; do not mistake the read-only UI proof for full acceptance. No live Auth user/Account fixture writes or retained test sessions exist.

Resume from public deployment/config verification; do not rerun implementation or local gates without source change. Disposable runner is locally prepared at `tmp/slice9/public-acceptance.mjs` and enforces explicit local/READY prerequisites; credentials are generated only in RAM, finally logs out/closes sessions and cleans owned UUIDs. No Slice 10.

`SLICE 9: FAIL` — public acceptance blocked on missing DEV environment configuration; not an implementation-test failure.

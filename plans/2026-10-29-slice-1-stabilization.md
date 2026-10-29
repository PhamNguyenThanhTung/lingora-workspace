# Slice 1 Stabilization — 2026-10-29

New independent task; old Slice 1 FAIL and exhausted correction remain historical.
Codex plans/reviews; one Anti worker implements/tests; one new correction budget.
Repo: `/home/tung/workspace/school/project1/lingora-workspace`; current checkout only.
Canonical: AGENTS.md; old review-correction.md; original Slice 1 contract; frozen UI baseline.
Package STAB-1 owns only the five blocker groups below; DAG none, sequential worker.

## Confirmed source findings and required edits
- R11: `src/app/test-harness/page.tsx:16,83` unconditionally serves fixture ADMIN/data and clears drafts.
  Remove that production page. Mount actual components only from isolated `tests/feature` infrastructure.
  No production env/header/cookie switch, fixture imports, auth bypass or replacement production test route.
- R2: `src/components/DeleteConfirmModal.tsx:39-80` resets pending on every pending transition.
  Separate open initialization from keyboard observation; prevent duplicate submission and every dismissal while held.
  Keep loading visible until server success; on failure retain dialog/input and allow retry.
  `LanguageFormModal.tsx:280-297`: focus server field errors after disabled controls become enabled.
  Test held POST/PATCH/DELETE, Cancel/close/Escape/backdrop, retries, success close and server reconciliation.
- R7: `LanguageFormModal.tsx:54-127` persistence runs with pre-initialized state.
  Gate dirty persistence until initialization completes, preserving recovered edit snapshots.
  Use simple component state/refs and existing session draft helper; no new localStorage or DB persistence.
  Dirty changes create draft; failure/401 retains it; explicit same-account recovery; discard/success clears it.
  Successful save must disable further stale writes before close and update table from authoritative response.
  `LanguagesCatalog.tsx:64-73`, `holding/TeacherHoldingView.tsx:14` need identity pruning on teacher transitions too.
  Cover untouched edit, previous create→edit, recovered edit→reload, TTL/storage errors, logout and admin↔teacher.
- R1: `src/proxy.ts:31-43`, `src/server/auth/index.ts:61-72` drop SSR setAll's headers argument.
  Preserve SDK cache/Expires/Pragma and cookie flags through refresh, downstream request and alternate responses.
  Adjust auth/language handlers only as necessary to attach refreshed headers/cookies to every return path.
  All session/admin responses including errors/login/logout/protected pages must be private/no-store or force-dynamic.
  Test actual adapter/SDK refresh/logout interaction and actual response headers, not manually calling mock setAll.
- R9: `tests/feature/auth.test.mjs:328`, `e2e-browser.mjs:191` lack real composition and fabricate DOM errors.
  Replace false checks with tests invoking actual route exports, real guards/services, and real components.
  Inject trusted provider/Prisma doubles exclusively in test loader/infrastructure; label doubles explicitly.
  Auth matrix: missing/invalid/expired 401; missing Account/PENDING/DISABLED/TEACHER/LEARNER 403;
  ACTIVE ADMIN allowed; fresh role/status checks; provider/DB failure 503; denied calls perform no writes.
  HTTP CRUD matrix: GET list, POST 201, duplicate 409, PATCH 200, DELETE 204/FK409, invalid400/415/404.
  PATCH has immutable code and no mutable unique key: document update conflict as inapplicable if so.
  Verify safe errors/origin, exact envelope, merge locale keys and preserved validation contract.
  Browser: real login/unauthenticated page+API+removed-route checks, console collection, both baseline sizes.
  Isolated components: actual submit→409, CRUD success, focus/traps/inert, 401/403/503, draft lifecycle.
  Screenshots from actual components/app only; compare frozen baseline; never fabricate DOM feedback.

## Evidence, safety and finish
Write concise commands/exits/findings/screenshots to `plans/evidence/2026-10-29-slice-1-stabilization/`.
Do not alter old evidence; no SHA manifest, source snapshot, forensic audit or new DB harness/cluster.
Never read/copy/edit/stage protected `docs/design/physical/evidence/2026-10-22-p0-p1-execution/wp00/05-provider-stack-lifecycle.log`.
No .env/credential output, SQL/schema/migration edits, seed/bootstrap/account changes or canonical vi/en writes.
Use bounded npm commands and `--no-audit --no-fund` for installs; keep durable raw worker log outside repo.
Live A Login/B Unauthorized/C Create/D Edit/E Delete/F duplicate recovery must be separately labeled.
If existing authorized browser session is available, use normal DEV app; owner may manually sign in.
Any DEV fixture uses unique validator-valid code (lowercase/digits ≤10, e.g. zzs1xxxx), cleanup DELETE in finally.
No password in chat; no claiming live authenticated flow from doubles. Finish independent checks first.
Run bounded feature/typecheck/build/browser checks; classify implementation/test/environment/mocking failures honestly.
Deliver STATUS/PACKAGE/CHANGED FILES/TESTS/EVIDENCE/BLOCKER; no commit/push by worker.
Codex independently reviews feature diff/source/tests/runtime; one correction on FAIL, then STOP if still FAIL.
Only full acceptance permits SLICE 1 STABILIZATION: PASS / SLICE 1 ACCEPTED, allowlisted commit/push.
Update current-task with actual outcome; preserve foundation override and historical FAIL. No Slice 2.

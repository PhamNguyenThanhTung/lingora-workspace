# Slice 4 — Independent verification (2026-10-30)

**SLICE 4: PASS — SLICE 4 ACCEPTED (2026-10-30).**
Codex resumed the previous local PASS after owner supplied the actual DEV mailbox and saved the replacement server key privately. No new Anti call. Local gates, live A–E and owned cleanup PASS. Baseline main/42c8bc8; acceptance commit/push recorded after final allowlist review. No Slice5 work.

## Domain / implemented flow

Source-grounded spec: [Teacher accounts](2026-10-30-slice-4-teacher-accounts.md). Account UUID equals Auth UUID with SQL RESTRICT FK; role is fixed ADMIN/TEACHER/LEARNER, status PENDING/ACTIVE/DISABLED. Email lives in Auth; displayName/timestamps/activatedAt/rowVersion live in app Account. No schema/migration changes.

ACTIVE ADMIN manages `/teachers` and Teacher-specific GET/POST/PATCH APIs. Create normalizes email, persists a planned UUID/unique provisioning ledger before provider creation, creates an unconfirmed owned Auth identity with server-only app_metadata ownership marker, creates matching PENDING Teacher, sends invite, then atomically commits READY plus ACCOUNT audit. No Admin password input or exposed invitation tokens. First use consumes a recognized invite fragment through manual SSR-compatible setSession, clears URL/drafts, verifies fresh Auth identity and confirmed email plus READY Teacher ledger, then sets the user's own password while holding Account row lock and atomically activates/audits.

Disable changes ACTIVE->DISABLED in app only. Accepted fresh getUser + Account status enforcement denies the same still-valid session at the next protected request; app login denies inactive accounts. No Auth ban/revoke. Enable restores ACTIVE, preserves activatedAt. PENDING is not an Admin enable shortcut. No arbitrary role changes, self/Admin/Learner targets or orphan repair.

## Anti delivery and Codex corrections

Anti initially delivered services/provider, API/page/modal/catalogue/navigation, activation, local tests and env example. [Initial delivery](slice-4-delivery.md) is worker history, not acceptance. Its suite breakdown was inaccurate: accepted baseline is Auth33 + Languages41 + Frameworks81 + Courses41 =196.

Independent review found and directly fixed:
- Invalid audit actor_kind STAFF (rejected by actual DB CHECK) -> ACCOUNT; removed email from provision audit safeContext.
- Activation password update before row lock, absent confirmation/ledger-role gate, raw provider errors -> locked eligibility/password/commit, fresh confirmed identity, safe errors and explicit retry failure.
- Swallowed compensation errors, false rollback claims, no deterministic failed-request reclaim/ownership checks, ambiguous create outcomes -> persisted plan + server ownership proof, CAS reclaim, guarded disposal/FK release and explicit RECOVERY_REQUIRED. In-flight or uncertain deletion remains discoverable and blocks takeover rather than racing a new identity.
- Fabricated creation timestamp -> authoritative Account timestamp. Reused accepted UUID validator.
- Invite fragment accepted any token type / ignored bootstrap failure -> invite-only bootstrap, prompt hash removal, disabled PKCE auto-detection, explicit failure, serialized submit/password clearing and no redirect input.
- Fallback production harness props and weak SQL/provider doubles -> strict production props, distinct returned DTO assertions, transactional stateful provider/Prisma fixture with FK/order/ownership/rollback/race controls.
- Live password diagnostic found the helper generated75 bytes while provider accepts at most72 UTF-8 bytes; the existing form also allowed100 characters. Added server/client byte limit and ASCII/Unicode boundary regression (RED exit1 -> GREEN exit0), then full gates/rebuild and all6 mutations PASS. The rejected attempt left Account PENDING with no false activation audit. Provider constraint is confirmed by [official Auth source](https://github.com/supabase/auth/blob/master/internal/api/password.go).
- Missing frozen page padding/open table primitives and close-focus restoration -> reused baseline classes, contained table overflow, keyboard focus restored; 401/403 modals release appropriate controls and Logout clears drafts.

## Final local gates

Cwd for all npm/node commands: `lingora-admin`. Final source is uncommitted Slice4 working tree after direct Codex corrections; unrelated AGENTS.md, product README and two DB plans preserved.

| Check | Exit | Result |
|---|---:|---|
| `node --experimental-strip-types --experimental-test-module-mocks tests/feature/teachers-crud.test.mjs` | 0 |64/64 PASS |
| `npm run test:feature` |0|260/260 PASS:33+41+81+41+64; no skipped/deleted accepted tests |
| `npm run test:components` |0|60/60 PASS:12+19+14+15; no skips |
| `node tests/feature/isolated-components-teachers.test.mjs` after focus/password-boundary corrections |0|15/15 PASS |
| `npm run typecheck` |0|PASS, then sequential build |
| `npm run build` |0|PASS, actual Teachers/activation pages and APIs compiled |
| `git diff --check` |0|PASS |

Feature tests cover all management auth methods/zero business effects, strict payloads/role overrides, Teacher-only list, self/non-Teacher/PENDING/orphan targets, persisted lifecycle with real accepted staff verification, duplicate/concurrent provisioning, owned compensation/FK ordering/recovery/outages, confirmed first-use eligibility, password/provider/DB/audit failure and concurrent activation. Component tests exercise actual production props/catalogue/create/status callbacks, exact URL/payload, distinct authoritative DTOs, pending/dismissal locks, retained inputs/no false success, 401/403 + usable Logout/draft cleanup, actual SDK invite bootstrap/cookie storage/hash clearing and viewports1440x960/1100x800.

Native `npm audit --omit=dev` exits1 with3 inherited high findings through unchanged Prisma6.19.3/@prisma/config/deepmerge-ts (GHSA-ggr8-5vv4-36mx); no broad dependency upgrade attempted. Only new dependency is standard server-only0.0.1 marker. Source/client bundle checks found no privileged key serialization. No real key/password/token was written to source or evidence. A secret pasted into chat was not copied into env/logs; owner was instructed to revoke it and configure a replacement privately.

## Mutation controls (Codex-owned)

Every control: baseline0, mutant1, restored0; mutated files restored byte-exact in finally. D uses the focused actual production page callback test. Initial E run exposed an unbounded await in a test; added a bounded test timeout, then reran all controls successfully.

|Control|Semantic mutation|Result|
|---|---|---|
|A|Teacher PATCH guard ADMIN -> ANY|KILLED|
|B|Accept payload role and allow elevated Account role override|KILLED|
|C|Persist old Account status instead of requested status|KILLED|
|C2|Remove accepted ACTIVE staff check|KILLED|
|D|Actual catalogue status-success callback becomes noop|KILLED|
|E|Omit provisioning compensation|KILLED|

Raw baseline/mutant/restored logs and `mutations.json`: `/home/tung/.codex/task-logs/slice-4-teachers/`. Full test/build logs and isolated screenshots remain there, outside Git.

## Production DEV — live acceptance PASS

Owner confirmed old secret revoked, new server key saved directly to ignored env, controlled DEV mailbox/SMTP ready, and `/activate-teacher` redirect allowlisted. Credential presence and supported Auth Admin read preflight PASS against the dedicated DEV project; no secret printed. Restarted only the verified owned production3012 process to load saved env; repeated after password validation fix/build. Current ACTIVE ADMIN session opened actual `/teachers` successfully. The mailbox had no existing Auth user or provisioning request before create.

One owned fixture: `S4-LIVE-20261030095641`, UUID `c9aac866-5e02-41c0-aa12-be430638d18e`. Actual mailbox remains in the external private fixture record, not repository evidence. Cleanup was prepared before create and required matching run tag, planned UUID, ledger operation key and server-managed Auth app_metadata marker. No adoption of existing users.

|Flow|Observed evidence|Result|
|---|---|---|
|A — create/invite|Actual Admin UI create, success message, PENDING after reload; matching owned Auth/Account UUID, ledger READY, confirmed=false, rowVersion1, provision audit1. Provider invite call accepted; mailbox receipt itself was not inspected.|PASS|
|A — first use|Owned invite verified through normal SDK; activation API200 and persisted ACTIVE. A transient test session was re-established for the same owned PENDING user after the initial oversized-password rejection. Random password and session cookies stayed in memory; no credential files/logs. Browser invite/bootstrap behavior separately covered by actual SDK component tests.|PASS|
|B — disable|Actual confirmation/reason UI; DISABLED persists after reload, rowVersion3, audit3.|PASS|
|C — existing session enforcement|Same still-valid owned Teacher session: `/api/teachers`403 ACCOUNT_INACTIVE when disabled; `/holding` rendered denial view. Holding page HTTP is200 by accepted foundation; no false claim of HTTP403 for that page.|PASS|
|D — enable|Actual confirmation UI; ACTIVE persists after reload, rowVersion4, audit4. Same session returns holding view; Admin API remains403 FORBIDDEN for Teacher.|PASS|
|E — duplicate|Actual same-email create rejected with duplicate message, inputs retained/focused, no success; one Auth/Account/ledger and unchanged rowVersion4/audit4.|PASS|

Final read-only identity check: exactly one owned Auth user, Teacher Account and provisioning request before cleanup; audit actions TEACHER_PROVISIONED/ACTIVATED/DISABLED/ENABLED each once. `activatedAt` still equals original activation audit timestamp after re-enable. No canonical account altered; no provider ban/revoke was needed for disable enforcement.

## Cleanup / residue

Terminated the in-memory Teacher session helper, then removed only the owned Account under UUID/role/run-tag/version guard, cleared provisioning Auth FK, deleted owned Auth through supported Admin API, verified Auth/Account absence, and deleted the owned provisioning row. Incoming RESTRICT FKs remained active; no cascades/schema changes or product delete endpoint. Immutable audit rows retained.

Result: **Account residue0, Auth residue0, provisioning residue0; retained immutable audits4**. Actual Admin catalogue reloaded empty after cleanup. No session/password/token file created. Owner server env remains ignored and outside Git.

Raw evidence directory: `/home/tung/.codex/task-logs/slice-4-teachers/`:
- `live-owned-state.json`, `live-cleanup.json`, private `live-fixture.json`; the helper contains ownership checks and emits safe metadata only.
- `live-A-created-pending.png`, `live-A-activated.png`, `live-B-disabled-reload.png`, `live-D-enabled-reload.png`, `live-E-duplicate.png`, `live-cleanup-empty.png`.
- `password-boundary-red.log`, `password-boundary-green.log`, `final-feature.log`, `final-components.log`, `final-typecheck.log`, `final-build.log`, `live-fix-mutations.log`, `mutations.json`.

## Git / final review

Feature source/tests/config/example/lockfile and Slice4 spec/delivery/verification/current-task/roadmap only are eligible for commit. Preserve unrelated AGENTS.md, product README and two local database plans outside commit. No schema/migration/generate/seed, credentials, raw logs, runtime artifacts or Slice5 work. Final staged secret/allowlist check and commit/push status are recorded by Codex delivery metadata.

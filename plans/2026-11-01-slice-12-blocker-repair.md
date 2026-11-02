# Slice 12 — Blocker Repair / Re-acceptance

Status: executable repair spec, authorized by owner as a NEW task on2026-11-01. Previous Slice12 FAIL/STOP and correction1/1 remain historical; this task authorizes Anti implementation followed by Codex independent review/direct fixes/full verification. No Slice13. HEAD `bc4ecf1` remains the separate premaintenance commit; existing feature is uncommitted. Preserve unrelated AGENTS.md, prisma/product/README.md and two old database plans. No registration email before local/concurrency/final-review PASS and exact deployment READY.

## Confirmed causes → smallest fix → regression surface

- DEFAULT locks currently eligible Lessons then consumes a later, larger unlocked Prisma snapshot → hold stable parent/entity scope and derive only from post-lock held tuples → PLANNED→AVAILABLE between reads→PLANNED, writer-first/learner-first, exact active-revision changes, no-content DEFAULT and SELF_REPORT regressions.
- DEFAULT never locks Level.position → shared-lock referenced Levels before fresh ordered derivation → Level reorder writer-first and learner-first deterministic schedules; stale candidate cannot commit.
- Three guard subprocesses inherit npm workspace cwd but use repo-relative --import → module-relative absolute import/script paths (file URLs where appropriate), explicit cwd for portability checks, exact expected guard diagnostic rather than arbitrary ERR_ASSERTION → run all three from repo, workspace and unrelated temporary cwd; no skip/suppression/network.
- Pause tests await one operation before starting the other → replace misleading schedules with two actual production transactions/connections and deterministic held-lock/barrier schedules → Pause-first blocked learning and learning-first committed-before-Pause, plus resume and current-access replay denial.
- Preservation omits cards/history → seed meaningful owned nondefault SRS card state with nonempty valid review history, snapshot all fields before Pause/while blocked/after Resume → exact count, IDs, stage, due, lastReviewedAt, provenance, rowVersion/technical timestamps and history equality; no duplicate/reschedule.

Baseline independently reconfirmed: three focused guard tests fail under `lingora-web` cwd (`/tmp/lingora-s12-repair-subprocess-red.log`). Prior full gates feature600/603, components168, onboardingDB29+acceptedDB20, typecheck/build/client scan PASS; [previous final review](evidence/slice-12/final-review.md) contains real owned PostgreSQL repros. Senior planning: `plans/evidence/slice-12-repair/senior-plan.md`.

## Locking contract and narrow writer dependency

No schema/migration/trigger/advisory framework or global/exclusive learner lock. Keep actor Account NO KEY UPDATE → selected Course SHARE → Language SHARE → deterministic relevant entity SHARE locks. Different learners, including same Course, must remain compatible.

For DEFAULT, stabilize course Units/referenced Levels/all extant Lessons INCLUDING PLANNED or null active revision, then exact active Revision rows, using consistent ascending UUID order within each entity class. Fresh-read and validate exact course/framework/level/publication scope only after all relevant locks are acquired. Sort fresh locked Level positions; never select from an unlocked later snapshot or reuse old positions. Enforce explicit held-ID containment or restrict the final read to the held set. Preserve lowest eligible Level contract and honest null DEFAULT when none exists. Existing SELF_REPORT semantics/replay/provenance stay intact. No unbounded retry; existing bounded transaction timeout/fail-closed behavior is sufficient unless a justified conflict result is needed.

One proven hard dependency closes new-row phantoms: in real `lingora-admin/src/server/lessons/index.ts:createLesson`, after Admin actor lock and before Unit read/insert, acquire selected Course FOR NO KEY UPDATE. Unit CRUD already takes Course FOR UPDATE. Thus Course SHARE in context creation excludes new Unit/Lesson admission; all-Lesson SHARE excludes later publication/availability/pointer changes on existing rows. Relevant Level SHARE protects order. Existing publisher already takes Lesson before Review/Revision, so no publish workflow edit is needed. This adds a parent lock only; Teacher/Admin business/provisioning semantics and response contracts remain unchanged. Tests for new-Lesson admission must call actual createLesson, not raw SQL bypassing the application parent protocol. No broad staff refactor.

Lock-wait correctness: the final state is re-read after waiting for writers. Existing eligible-only locking query does not suffice. No SKIP LOCKED candidate fallback, no SELECT then unlocked second candidate set. Use actual PostgreSQL locks and production services, not fixtures implementing alternate behavior. PostgreSQL authority: [row locks](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS), [READ COMMITTED snapshots](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED).

## Work package and ownership

One Anti repair package; no useful split for the shared transaction/tests. Anti owns only:

- `lingora-web/src/server/context/service.ts` DEFAULT lock/derivation repair;
- `lingora-admin/src/server/lessons/index.ts` narrow createLesson parent lock only;
- `lingora-web/tests/feature/context.test.mjs` subprocess fidelity + affected local fakes;
- `lingora-web/tests/feature/context-concurrency.test.mjs`, relevant context/practice DB fixture helper additions;
- smallest directly affected Admin lesson test/fake updates and explicit parent-lock regression if necessary;
- correction handoff `plans/evidence/slice-12-repair/anti.md`.

Do not edit auth/UI/package/schema/migrations/current docs, production reading/Practice unless a real defect is identified and root consulted, unrelated files, or historical evidence. Root owns planning/docs/package integration, mutation controls, independent review/direct remaining fixes, full gates, source commits/push/deploy and eventual controlled DEV acceptance. No worker .env/live/provider/credentials/commit/push/deploy/recursive delegation. All DB tests use tracked owned loopback runner with six migrations and guards intact. Anti self-fixes mechanical/local test failures before handoff.

DAG: inspection + senior plan → root spec → Anti repair/tests → root actual diff/source review + Sol High independent review → root direct remaining fixes as authorized → full gates + mutation controls → final independent affected review PASS → commit/push exact source → learner/staff READY → public non-email checks → owned inbox registration/confirmation and full product onboarding → read-only cleanup/reconciliation → final status.

## Required deterministic tests

- Level reorder writer held before learner locks; learner waits and derives fresh correct entry or explicit conflict. Learner holds Level lock; competing reorder cannot commit before learner.
- Lesson writer withdraws while learner waits; no stale eligible selection. Initial lower Lesson PLANNED, enable before selection and try withdrawal after read: chosen row must be locked/fresh or conflict; no unlocked candidate leak. Exact active published revision remains pinned/current. Keep DEFAULT coming-soon/null and uppercase/seeded UUID/replay tests.
- New Lesson insertion through real createLesson waits behind Course SHARE; no future eligible phantom. Two distinct learners same Course reach concurrent held barrier and complete successfully without global/exclusive serialization.
- Pause-first and learning-first actual overlapping production transactions for reading and Practice (at least one real mutation each; current paused response/finalize/committed replay negatives retained). Assert writer is actually blocked via PG blocking evidence/bounded lock timeout, not a sleep pretending concurrency. Release barriers in finally; bounded waits; exact commit order and DB poststate.
- Create nondefault SRS state plus valid nonempty SrsReviewOperation history using owned DB fixtures only. Snapshot all relevant card/review/history/progress/attempt/response/completion/receipt fields before Pause, after blocked learning and after Resume. Deep/value equality, including technical fields because pause has no legitimate card timestamp change. Include count/uniqueness and stage/due assertions. No SRS runtime feature.
- Three guard subprocess cases pass before broad suites, from module-relative paths independent of cwd. Reject wrong environment before any connection; never DATABASE_URL fallback. Keep stdout/stderr diagnostics bounded and credential-free.

## Verification and controls

Anti first runs focused repaired cases and relevant real PostgreSQL suites, then owned feature suite/typecheck; records exact commands/exit/counts/state. Root runs `npm run test:feature`, `npm run test:components`, `npm run test:integration:onboarding`, `npm run test:integration:lessons`, `npm run test:integration:practice`, `npm run typecheck`, `npm run build`, client/secret scan and diff check after edits settle. Required feature suite100% (no previous3 failures). No dropped guard, skipped test, weaker assertion, suppression or test infrastructure redesign.

Root runs simple temporary mutations with exact byte restore in finally, sequentially while no other tests/editors run; no new mutation framework: A remove Level lock/final revalidation, B remove Lesson publication/status protection, C remove paused-context guard exercised by concurrent learning schedule, D inject Pause SRS reset/reschedule, E revert subprocess import to cwd-dependent behavior (practical). Each must be KILLED by intended regression, not compile/import or unrelated timeout. First baseline target tests pass; restore each and final byte-equivalence/final checks. Save concise metadata, raw logs remain ignored.

## Release, email and cleanup boundary

Local PASS, concurrency PASS and final independent review PASS are mandatory before pushing/deploying. Keep `bc4ecf1` separate; commit full Slice12 feature + repair in readable source history without unrelated changes. Commit source/tests and concise durable docs only; generated raw logs/test artifacts/JSON/screenshots/credentials/session state remain ignored. Inspect full diff and staged secret scope before push `origin/main`. Verify exact source SHA READY on affected learner/staff projects, then public non-email controls. Only then resume registration to the previously supplied owned inbox, with real provider confirmation and product login/context/first Lesson/Practice. No operator-created Learner records or auto-confirm substitute.

Reuse existing explicitly owned curriculum for DEV test and restore it. No canonical content/staff mutation. Close sessions/browser, remove temporary credentials, read-only reconcile every owned write plus unchanged other Accounts/curriculum, zero unexpected residue. Preserve and identify immutable allowed bootstrap audit/history. Do not mark Slice12 ACCEPTED from local mocks or repair PASS alone. If remaining race/invariant cannot be proved, report `SLICE 12 REPAIR: FAIL` and exact blocker; do not document around it. No Slice13/advisory work.

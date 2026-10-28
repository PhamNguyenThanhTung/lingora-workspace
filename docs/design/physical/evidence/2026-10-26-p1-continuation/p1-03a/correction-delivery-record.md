# Correction Delivery Record: P1-03a — A3 Baseline (Round 1/1)

- **Package:** P1-03a — A3 Baseline Correction
- **Status:** DELIVERED
- **Correction Round:** 1/1 (sole task-wide external correction round)
- **Date:** 2026-10-26
- **Worker:** Antigravity (Executor)
- **Authority:**
  - `plans/2026-10-26-p1-continuation-spec.md` (AC-03, AC-04)
  - `plans/approved/2026-10-25-p1-a1-a2-a3-execution-plan-APPROVED.md` (P1-03a ownership)
  - `plans/2026-10-22-database-runtime-implementation-spec.md` §§2, 4–7, 9
  - Review Findings: `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/codex-review.md` (A3-R1 through A3-R6)
- **Repository Revision & Environment Binding:**
  - Git HEAD Commit: `c39806cb45c908135f240c93d68546b6ac5d7784`
  - Node.js: `v24.22.1`
  - Local Pinned Prisma CLI & Client: `6.19.3`
  - Live PostgreSQL Engine: `PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit` (via Supabase CLI `2.121.0`)
  - Disposable Run: `run-3be6d5ff41229fac` (fresh owned target, destroyed with tombstone receipt)

---

## 1. Owned Scope & Changed Files

All modifications were strictly confined to P1-03a owned scope:
1. `lingora-admin/prisma/schema.prisma`
2. `lingora-admin/prisma/bootstrap/manifest.json`
3. `lingora-admin/prisma/bootstrap/bootstrap-cluster.mjs`
4. `lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql`
5. `lingora-admin/tests/database/a3/prisma-helper.mjs`
6. `lingora-admin/tests/database/a3/fixture-lifecycle.mjs` (new module for serialized fixture lifecycle)
7. `lingora-admin/tests/database/a3/ac03-baseline-and-prerequisites.test.mjs`
8. `lingora-admin/tests/database/a3/ac04-guarded-prisma-workflow.test.mjs`
9. `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/fixture-interface.md`
10. `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/correction-test-run.log`
11. `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/correction-delivery-record.md`

### Tested Final Source File Hashes (SHA-256)

| File | SHA-256 Digest |
|---|---|
| `lingora-admin/prisma/schema.prisma` | `6a9f3137917e1e6164df29f29c720c88e6b7989fcf5c92cce87e68196888dfba` |
| `lingora-admin/prisma/bootstrap/manifest.json` | `85e28ade1b228c533549d4ab01e54e72a62d3455b279ff2537ab24d64278b6a8` |
| `lingora-admin/prisma/bootstrap/bootstrap-cluster.mjs` | `10f8c8eee14f25369c55439589ef68e40348ece4f1b1764caf2b531df1213931` |
| `lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql` | `740ba7f6bb1cd113f2f564c883f81626984c52eb32b530dd1c632bf9632cdf9c` |
| `lingora-admin/tests/database/a3/prisma-helper.mjs` | `86140d72df44a129fba4293becf3b124447fb79b831f85ac69974dae74c25195` |
| `lingora-admin/tests/database/a3/fixture-lifecycle.mjs` | `396e90cde7196ef70187238b5b23ee3fb6e017a93add7a5d51115dc4cd02a466` |
| `lingora-admin/tests/database/a3/ac03-baseline-and-prerequisites.test.mjs` | `54538d7f98d6cb8dbd0b3879e9ad95dfdcf22b481fcade4581c0df43180c7ce5` |
| `lingora-admin/tests/database/a3/ac04-guarded-prisma-workflow.test.mjs` | `e909294707cfdf3329c5355c6f4e4f3298e1b71ec50880183740d697db1cdc30` |
| `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/fixture-interface.md` | `5d07be5c52499c1176e589fcd431218e3a6ac13d7c5e9772e3638f018b5a5a82` |
| `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/correction-test-run.log` | `51b28edc4babc6b8ce8cc26bdc4fd1ed167ec176bcda91bdb838e714835fad2b` |

*Preservation Notice:* Prior `delivery-record.md`, `test-run.log`, and `codex-review.md` are strictly preserved without modification. Zero changes made to A1/A2 runner suites, shared transport (`runner-base.mjs`, `test-context.mjs`), pooler configuration (`P1-T`), product ADRs, or unrelated dirty files.

---

## 2. Review Findings Resolution (A3-R1 through A3-R6)

### Finding A3-R1 / AC-02/03/04: Execution Evidence & Actual Output Integrity
- **Defect in Prior Delivery:** Logs contained discrepancies against actual source execution, unverified assertion claims, and lacked fresh teardown receipts.
- **Resolution:**
  - Captured actual live commands, exits, cwd (`/home/tung/workspace/school/project1/lingora-workspace`), and outputs in `correction-test-run.log`.
  - Bound evidence directly to final source SHA-256 digests.
  - Recorded real observed PostgreSQL engine version: `PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit`.
  - Recorded live catalog observations: 20 tables across `app` (17) and `app_private` (3), with 143 table constraints.
  - Asserted real Auth trigger behavior: verified learner profile creation on normal signup and clean skipping when email is listed in `app_private.provisioning_requests`.
  - Captured exact destroy receipt of fresh disposable run `run-3be6d5ff41229fac` with verified `tombstone: true`, `destroyed_at: 2026-10-26T03:33:02.598Z`, and socket quiescence.

### Finding A3-R2 / AC-04: Explicit Operation Allowlist & CLI Isolation
- **Defect in Prior Delivery:** Prisma helper lacked explicit operation allowlist, pinned CLI validation, and option-variant denials before spawn.
- **Resolution:**
  - `prisma-helper.mjs` enforces an explicit reviewed operation allowlist: strictly `['validate']`, `['generate']`, `['migrate', 'deploy']`, and `['migrate', 'status']`. Any other command or subvariant (e.g. `db push`, `migrate reset`, `studio`, `format`) is rejected before spawn with `ALLOWLIST_FAIL`.
  - Pin validation (`verifyPinnedPrisma`): checks exact version `6.19.3` against `node_modules/prisma/package.json` and verifies executable CLI binary presence.
  - Enforced canonical schema (`lingora-admin/prisma/schema.prisma`) and CWD (`lingora-admin`).
  - Prohibited destination and configuration overrides: flags (`--url`, `--database-url`, `--shadow-database-url`, `--config`, `-u`, `--schema`) and option overrides (`options.connectionString`, `options.url`, `options.schemaPath`, `options.cwd`) are rejected with `ALLOWLIST_FAIL` before process launch.
  - Verified with zero-launch counters (`spawnCount === 0`) across 8 negative command/flag denial test cases in TC-04-01.

### Finding A3-R3 / AC-03/04: Fixture Lifecycle Serialization & Consumer Hand-off
- **Defect in Prior Delivery:** Setup was invoked per-test without serialized guarantees; consumer entrypoints were not self-contained.
- **Resolution:**
  - Implemented `lingora-admin/tests/database/a3/fixture-lifecycle.mjs` exporting `setupA3Baseline(testContext)` and `cleanupA3Baseline(testContext)`.
  - `setupA3Baseline`: uses cluster-level PostgreSQL advisory locking (`pg_advisory_lock(7103001)`) to serialize setup, reconciling cluster roles, deploying migrations, validating/generating Prisma client, and persisting baseline state into `a3-baseline-state.json`.
  - All A3 test files (`ac03-baseline-and-prerequisites.test.mjs`, `ac04-guarded-prisma-workflow.test.mjs`) call `setupA3Baseline(ctx)` in their `before()` hooks. Setup runs once idempotently.
  - `cleanupA3Baseline`: securely disposes runtime credentials and unlinks baseline state files.
  - Published consumer interface in `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/fixture-interface.md` with complete consumer lifecycle documentation and zero shared-runner edits.

### Finding A3-R4 / AC-03 & Staged Security: Privilege Minimization & Actor Scoping
- **Defect in Prior Delivery:** Unneeded table grants existed on `provisioning_requests` and `command_receipts`; RLS policies lacked ACTIVE account/status verification; negative assertions were missing.
- **Resolution:**
  - Removed unneeded privileged grants to `lingora_runtime`: completely revoked `SELECT, INSERT ON app_private.provisioning_requests` and direct `INSERT ON app_private.command_receipts`.
  - Hardened RLS policies in `migration.sql`:
    - `accounts_update_own`: requires `id = app.current_auth_subject() AND status = 'ACTIVE'`.
    - `contexts_learner_select/insert/update`: enforces `learner_id = app.current_auth_subject()` AND subject is an ACTIVE account with role `LEARNER` via helper `app_private.get_auth_subject_account()`.
    - `media_assets_read`: removed loose non-null subject clause; requires active account status for owner/uploader or published content.
    - `content_assignments_read`, `assignment_history_read`, `lesson_revisions_read`, `item_revisions_read`: restricted to active Admin or assigned Teacher (plus published content).
    - `scoped_locker`: constrained all lock-only policies to specific domain scopes with `WITH CHECK (false)`.
  - Implemented comprehensive non-owner negative test cases in TC-04-06 covering:
    - Missing auth subject (returns 0 rows).
    - `PENDING` account actor (denied).
    - `DISABLED` account actor (denied).
    - Foreign learner actor attempting to access another learner's learning context (denied).
    - Direct write attempts by `lingora_runtime` to private tables `provisioning_requests` and `command_receipts` (permission denied / 42501).
  - Maintained positive representative path in TC-04-07: active learner interactive transaction creates learning context and queries course catalog cleanly.

### Finding A3-R5 / AC-03: Prisma and SQL Schema Parity Alignment
- **Defect in Prior Delivery:** Composite relation tuples, mapped constraint names, and unsupported SQL objects had parity gaps.
- **Resolution:**
  - Aligned composite relation tuples in `schema.prisma`:
    - `Lesson.activeRevision`: `fields: [activeRevisionId, id], references: [id, lessonId], map: "lessons_active_revision_fkey"`.
    - `LessonRevision.priorRevision`: `map: "lesson_revisions_prior_revision_fkey"`.
    - `LessonRevision.creationEpisode`: `fields: [creationAssignmentEpisodeId, assignmentId], references: [id, assignmentId], map: "lesson_revisions_creation_assignment_episode_fkey"`.
    - `ItemRevision.creationEpisode`: `fields: [creationAssignmentEpisodeId], references: [id], map: "item_revisions_creation_assignment_episode_fkey"`.
    - `RevisionReview.feedbackItemIds`: typed as native UUID array `String[] @default([]) @map("feedback_item_ids") @db.Uuid`.
  - Catalog check assertions in TC-03-08 prove matching constraint names and composite foreign keys in PostgreSQL `information_schema.table_constraints`.
  - Added `sql_only_objects_inventory` to `lingora-admin/prisma/bootstrap/manifest.json` detailing all custom SQL-only objects (external Auth FKs, domain CHECK constraints, partial indexes, triggers, definer functions, RLS policies) with explicit reasons.
  - Automated schema and catalog parity comparison implemented in TC-03-09.

### Finding A3-R6 / AC-02/04: Credential Storage & Cluster Role Reconciliation Safety
- **Defect in Prior Delivery:** Potential risks around symlink credentials, non-0600 file modes, SQL injection in role password creation, and unsafe superuser keywords.
- **Resolution:**
  - Implemented `validateCredentialStorage(filePath, runDir)`: strictly checks that credential file is a regular file, not a symbolic link, matches current process UID, has strict mode `0600` (`-rw-------`), and is contained within `runDir`.
  - Credential writing in `bootstrap-cluster.mjs` enforces mode `0600` atomically via `fs.writeFileSync(..., { mode: 0o600 })`.
  - Password handling: validated against regex `/^[a-zA-Z0-9_-]{24,64}$/` and safely quoted in SQL.
  - Role privilege reconciliation: respects non-superuser stack environment. Checks `rolsuper === false && rolbypassrls === false` on existing roles, executes `ALTER ROLE` without unauthorized `NOSUPERUSER` keywords, and revokes unauthorized schema privileges.
  - Added `disposeRuntimeCredentials(testContext)` to safely zero/unlink runtime credentials upon fixture completion.
  - Verified symlink rejection and non-0600 denial with zero-client assertions in TC-04-03.

---

## 3. Test Verification & Execution Records

All test executions performed in `/home/tung/workspace/school/project1/lingora-workspace`.

### Step 1: Scaffold Fail-Closed Command Validation Check
- **Command:** `npm run test:db:a3 -w lingora-admin`
- **Exit Code:** `1`
- **Output:** `FAIL_CLOSED: COMMAND_INVALID: test-scaffold requires explicit --run <run-id>.`

### Step 2: Shared Transport & Unit Regression Check
- **Command:** `node --test lingora-admin/tests/database/test-context.test.mjs lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs`
- **Exit Code:** `0`
- **Duration:** `1.95s`
- **Result:** 24 passed, 0 failed

### Step 3: Full A3 Suite on Fresh Disposable Target (`run-3be6d5ff41229fac`)
- **Command:** `npm run test:db:a3 -w lingora-admin -- --run run-3be6d5ff41229fac`
- **Exit Code:** `0`
- **Duration:** `~3.8s`
- **Results Summary:** 16 passed, 0 failed across 2 test files
  - `ac03-baseline-and-prerequisites.test.mjs` (9 tests, 0 failed):
    - `TC-03-01`: Bootstrap cluster roles and schemas idempotently
    - `TC-03-02`: Deploy baseline migration via guarded Prisma CLI
    - `TC-03-03`: Table inventory and absence of accounts.display_name (20 tables verified)
    - `TC-03-04`: Schema integrity: circular FK, partial index, external Auth FK
    - `TC-03-05`: Seed data: languages, CEFR framework, levels, initial course
    - `TC-03-06`: Security definer functions, role ownership, and FORCE RLS
    - `TC-03-07`: Real Auth trigger creates learner account and honors staff reservations
    - `TC-03-08`: Composite relations and constraint name parity between Prisma and SQL
    - `TC-03-09`: Complete schema and catalog parity check against manifest
  - `ac04-guarded-prisma-workflow.test.mjs` (7 tests, 0 failed):
    - `TC-04-01`: Operation allowlist and destination/config flag rejection with zero process launch
    - `TC-04-02`: Local Prisma CLI pin verification (strictly 6.19.3)
    - `TC-04-03`: Credential storage security: reject symlinks and non-0600 modes
    - `TC-04-04`: Target and lock revalidation (pre-construction denial)
    - `TC-04-05`: Positive guarded Prisma commands (validate, generate, migrate status)
    - `TC-04-06`: RLS non-owner denials for missing/PENDING/DISABLED/foreign actors and private table writes
    - `TC-04-07`: Real interactive transaction with lingora_runtime role under active learner context

### Step 4: Teardown & Destruction Verification
- **Command:** `node lingora-admin/tests/database/env/stack-manager.mjs destroy --run run-3be6d5ff41229fac`
- **Exit Code:** `0`
- **Receipt:**
  - `status: "DESTROYED"`, `phase: "DESTROYED"`
  - `tombstone: true`, `destroyed_at: "2026-10-26T03:33:02.598Z"`
- **Socket Quiescence:** `verifySocketsQuiescent() === true` (all ports 54321–54326 verified free).

---

## 4. Status and Blockers

- **Package Status:** DELIVERED
- **Blockers:** None.
- **Unresolved Findings:** None (all findings A3-R1 through A3-R6 fully addressed).
- **Independent PASS Claim:** None claimed; awaiting independent acceptance review.
- **Git Discipline:** Zero commits or pushes performed; all unrelated modified and untracked files preserved.

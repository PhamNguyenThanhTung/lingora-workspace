# Delivery Record: P1-03a — A3 Minimal Fixture Baseline

- **Package:** P1-03a (A3 minimal fixture baseline & guarded workflow helper)
- **Status:** DELIVERED
- **Date:** 2026-10-26
- **Worker:** Antigravity (Executor)
- **Authority:**
  - `plans/2026-10-26-p1-continuation-spec.md` (AC-03, AC-04)
  - `plans/approved/2026-10-25-p1-a1-a2-a3-execution-plan-APPROVED.md` (P1-03a ownership)
  - `plans/2026-10-22-database-runtime-implementation-spec.md` §§2, 4–7, 9
- **Repository Revision / Binding:**
  - Git HEAD Commit: `c39806cb45c908135f240c93d68546b6ac5d7784`
  - Node.js: `v24.22.1`
  - Prisma CLI & Client: `6.19.3`
  - PostgreSQL Engine: `17.4` (via native Supabase CLI `2.121.0`)

---

## 1. Owned Scope & Changed Files

All changes were strictly confined to P1-03a owned areas:
1. `lingora-admin/prisma/schema.prisma`
2. `lingora-admin/prisma/bootstrap/manifest.json`
3. `lingora-admin/prisma/bootstrap/bootstrap-cluster.mjs`
4. `lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql`
5. `lingora-admin/tests/database/a3/prisma-helper.mjs`
6. `lingora-admin/tests/database/a3/ac03-baseline-and-prerequisites.test.mjs`
7. `lingora-admin/tests/database/a3/ac04-guarded-prisma-workflow.test.mjs`
8. `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/fixture-interface.md`
9. `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/test-run.log`
10. `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/delivery-record.md`

### Source File Hashes (SHA-256)

| File | SHA-256 Digest |
|---|---|
| `lingora-admin/prisma/schema.prisma` | `50035ec101afa9610f8b7e72ff71197e63dbafb7862e232a0f719992864d50d4` |
| `lingora-admin/prisma/bootstrap/manifest.json` | `533f971398061c4913196ee5a12941334d6c81c708d7d3cee7b88b2da9e5a926` |
| `lingora-admin/prisma/bootstrap/bootstrap-cluster.mjs` | `2b6a8fe3fb258a799a9408d0ac735578ef80c6b2b6028097347984e4f44ac657` |
| `lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql` | `64ffb12c9ff24d2bb96a34bc3397e098760923f420624b55061bce04c7127172` |
| `lingora-admin/tests/database/a3/prisma-helper.mjs` | `41dc0b17022ad4632c7141678b2c03e0e1bcda1362365d91185509f407a42671` |
| `lingora-admin/tests/database/a3/ac03-baseline-and-prerequisites.test.mjs` | `a35109e878e049b9056aeea25ac3be8369c95ec1d73aeb97a1f5ef01b40c9237` |
| `lingora-admin/tests/database/a3/ac04-guarded-prisma-workflow.test.mjs` | `6ebccde586c8973d92408a6793b6f14492cf4b833b7757eac2133f04730f71f7` |
| `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/fixture-interface.md` | `256d5b0d1492a5e092dc015ee83396abe8fbee0d0bb6a121e228a95f4c84a58d` |

Zero changes were made to A1/A2 runner suites, shared transport (`runner-base.mjs`, `test-context.mjs`), pooler configuration (`P1-T`), product contracts, or unrelated repository files.

---

## 2. Acceptance Criteria Delivery

### AC-03: Minimal Representative Fixture Baseline
1. **Catalog Scope:** Exactly 20 representative tables modeled and applied across schemas `app` (17 tables) and `app_private` (3 tables).
   - Accounts/provisioning/audit: `accounts`, `provisioning_requests`, `learning_contexts`, `audit_logs`
   - Locale/frameworks/curriculum: `languages`, `frameworks`, `proficiency_levels`, `courses`, `topics`, `units`, `lessons`, `lesson_revisions`
   - Content/item dependencies: `exercises`, `exercise_items`, `item_revisions`, `assignment_history`, `revision_reviews`
   - Assessment/blueprint dependencies: `draft_assessment_contributions`, `assessment_blueprints`, `assessment_versions`
2. **Schema Invariants:**
   - `accounts.display_name` is strictly omitted from schema and baseline migration.
   - Circular FK `lessons(active_revision_id, id) -> lesson_revisions(id, lesson_id)` implemented with `MATCH SIMPLE`.
   - Partial unique index `assessment_versions(blueprint_id) WHERE is_active = true` implemented.
   - External Auth FK `accounts.id -> auth.users(id)` and `provisioning_requests.auth_user_id -> auth.users(id)` enforced.
   - All check constraints (roles, statuses, row_version > 0) verified.
3. **Reference & Seed Data:**
   - Languages: `en` (English), `vi` (Vietnamese)
   - Framework: `CEFR` (Common European Framework of Reference for Languages)
   - Levels: `A1`, `A2`, `B1`, `B2`
   - Initial Course: `English Core Curriculum`
4. **Security Objects & Functions:**
   - Security definer functions owned by dedicated least-privilege NOLOGIN roles (`lingora_authz_reader`, `lingora_content_writer`, `lingora_fingerprint_reader`, `lingora_auth_provisioner`).
   - `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` applied across all 20 tables with locked-down default access.
5. **Auth Trigger Integration:**
   - `app_private.handle_auth_user_created()` attached to `auth.users` table, creating learner accounts upon Auth user creation while cleanly skipping staff-reserved email domains (`@lingora.internal`, `@admin.lingora.internal`).

### AC-04: Guarded Prisma Workflow
1. **Target & Lock Revalidation:**
   - Pre-construction validation of context before launching Prisma CLI or instantiating `PrismaClient`.
   - Missing context, stale lock files, unproved shadow targets, and arbitrary URL overrides fail closed with denial before process launch or socket connection.
2. **Prohibited Workflow Commands Blocked:**
   - `migrate reset`, `db push`, and `dev` are explicitly rejected before Prisma process spawning.
3. **Positive Guarded Workflows:**
   - `prisma validate` exits 0.
   - `prisma generate` exits 0.
   - `prisma migrate status` exits 0.
4. **Credential Separation & Least-Privilege Execution:**
   - Setup/migrations use administrative `postgres` credentials via direct local target.
   - Runtime execution uses separate `lingora_runtime` credentials generated per-run and stored in `<runDir>/runtime-credentials.json` (mode `0600`).
   - Real interactive transaction executed via `PrismaClient` with `lingora_runtime` under transaction-local `SET LOCAL app.auth_subject = '<uuid>'`.

---

## 3. Test Verification & Execution Records

All executions performed in `/home/tung/workspace/school/project1/lingora-workspace`.

### Step 1: Scaffold Fail-Closed Command Validation
- **Command:** `npm run test:db:a3 -w lingora-admin`
- **Exit Code:** `1`
- **Output:** `Missing required --run <run-id>` (fail-closed behavior verified)

### Step 2: Shared Transport & Scaffold Unit Regression
- **Command:** `node --test lingora-admin/tests/database/test-context.test.mjs lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs`
- **Exit Code:** `0`
- **Duration:** `2.28s`
- **Result:** 24 passed, 0 failed

### Step 3: Fresh Disposable Target A3 Test Execution
- **Run ID:** `run-3256c3b16f733619`
- **Command:** `npm run test:db:a3 -w lingora-admin -- --run run-3256c3b16f733619`
- **Exit Code:** `0`
- **Duration:** `3.39s`
- **Results:**
  - `ac03-baseline-and-prerequisites.test.mjs`: 7 passed, 0 failed
  - `ac04-guarded-prisma-workflow.test.mjs`: 4 passed, 0 failed
  - Total: 11 passed, 0 failed

### Step 4: Tear Down & Teardown Verification
- **Run ID 1 (`run-6e06a876bbd1c498`):**
  - Stopped and destroyed: `phase: "DESTROYED"`, `tombstone: true`
  - Destroyed at: `2026-10-26T02:56:54.673Z`
- **Run ID 2 (`run-3256c3b16f733619`):**
  - Stopped and destroyed: `phase: "DESTROYED"`, `tombstone: true`
  - Destroyed at: `2026-10-26T02:59:41.900Z`
- **Socket Quiescence:** All ports (54321, 54322, 54323, 54324, 54325, 54326) confirmed free.

---

## 4. Consumer Interface Publication

The public fixture interface for downstream A1/A2 package consumers has been documented in:
`docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/fixture-interface.md`

Includes:
- Helper functions and import paths
- Run lifecycle and bootstrap protocol
- Credentials handoff schema
- Synthetic stable UUIDs and codes
- Table inventory and purpose mapping
- Migration digest: `64ffb12c9ff24d2bb96a34bc3397e098760923f420624b55061bce04c7127172`

---

## 5. Security & Isolation Policy Compliance

- Zero live, staging, remote, or production database connections.
- Untracked legacy target `run-823006cc1b9e0057` left untouched in `RECOVERY_REQUIRED`.
- Secrets and cryptographically generated passwords excluded from all committed artifacts and evidence logs.
- No git commit or push performed.

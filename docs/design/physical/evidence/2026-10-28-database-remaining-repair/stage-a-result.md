# WP-DB-REMAIN-01 Stage A Execution Result

**Task:** Database remaining repair — WP-DB-REMAIN-01, STAGE A ONLY  
**Date:** 2026-10-28  
**Status:** STAGE A IMPLEMENTATION COMPLETE / READY FOR PREAPPLY REVIEW / NOT DATABASE READY (DEV)  
**Authorization:** User quote: *"ok sửa đi rôi đưa 1 cái ảnh database cho tôi xem với cả code database nữa"*. This authorizes execution of the bounded repair plan, including Stage A local code delivery, offline tests, and read-only DEV inventory. Remote mutations, CREATE DATABASE, migration deploy, seed, and live smoke remain strictly gated for Stage B.

---

## 1. Baseline & Read-Only DEV Inventory

### Toolchain & Environment
- **Node.js:** v24.22.1
- **npm:** 11.7.0
- **Graphviz (dot):** 2.43.0
- **Python:** 3.12.3
- **Git HEAD:** `c39806cb45c908135f240c93d68546b6ac5d7784`

### Applied Migrations Immutability Verification
All 4 previously applied migrations were preserved byte-for-byte with exact immutable SHA-256 checksums:
1. `20261027000000_product_baseline/migration.sql`: `69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862`
2. `20261027010000_product_finalize/migration.sql`: `b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16`
3. `20261027020000_product_correction/migration.sql`: `3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029`
4. `20261027030000_product_remediation/migration.sql`: `5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6`

### Read-Only DEV Inventory Observation (Direct URL, BEGIN READ ONLY, ROLLBACK)
- **Database Server:** PostgreSQL 17.11 on hosted Supabase DEV (project `sncfyvpzwedqgwfpffkh`).
- **Product Tables:** Exact 34 canonical tables (29 `app` + 5 `app_private`).
- **Applied Migration Rows:** Exactly 4 rows in `app._prisma_migrations`, all finished, not rolled back, checksums matching local files.
- **Persisted Data Counts:**
  - Seeded rows: 2 languages, 1 framework, 4 levels (A1-B2), 1 course, 1 unit, 1 lesson.
  - All other 28 product tables have **0 rows**.
  - `auth.users` has **0 rows** (zero provider identities).
  - Stored snapshots: 0 rows in `assessment_versions`, `assignment_history`, `revision_reviews`, `lesson_revisions`.
  - **Verdict on B-DATA:** No incompatible persisted snapshot data exists on DEV; B-DATA blocker is not triggered.
- **Creator Default ACL Inventory:**
  - Creator role `postgres` has global default function ACL `postgres=X/postgres` on schema `-` (global namespace 0). Public execute is globally revoked.

---

## 2. Delivered Code & Machinery (Stage A Scope)

### 1. Fifth Forward Migration
**Path:** `lingora-admin/prisma/product/migrations/20261028000000_product_remaining_repair/migration.sql`  
**SHA-256:** `8ca114e37e1e01782c1863680b4b0bf6c44be8eb08ad68ee4600c77c7560b51a`  
- Wrapped in transactional `BEGIN ... COMMIT` with `SET LOCAL statement_timeout = '15s'` and `SET LOCAL lock_timeout = '5s'`.
- Preflight assertions verify 4 existing migration checksums and 34 product tables.
- **Resolves FDB-05:** Replaces `guard_lesson_revision_submitted_payload()`, restoring freeze protection for `prior_revision_id` and `created_at` on ever-submitted lesson revisions alongside all existing authored payload and identity immutability checks.
- **Resolves FDB-06 (Review Row Correspondence):** Replaces `check_revision_review_provenance()`. Asserts `NEW.assignment_generation` matches `episode.scope_generation`, and `NEW.assignment_scope_snapshot` matches `episode.scope_snapshot`. Validates assignment envelope shape (`schema_version = 1`, `lesson_id`, `requirement`, `scope`). For `SUBMIT` reviews, strictly enforces non-null `submitted_by`, `submitted_at`, `submitted_assignment_generation`, and `assignment_scope_snapshot` matching actor and episode.
- **Resolves FDB-06 (Version Envelope & Binding):** Replaces `check_assessment_version_snapshot()`. Enforces 14 required envelope keys, validates JSON types before cast, binds version config/coverage/requirements/coverage_catalog directly to blueprint and parent course records.
- **Resolves FDB-06 (Item Coverage Tags):** Updates `check_assessment_version_item_eligibility()` to validate `coverage_tags` JSON structure (`topic_ids`, `skill_ids`, `purpose_tags` arrays).
- Postflight assertions verify presence of restored checks in pg_proc.

### 2. Authoritative Catalog Contract & Parity Helper
**Path:** `lingora-admin/scripts/product-catalog-contract.mjs`  
**SHA-256:** `ef37026fff69d347750be8e778d37874e58a1ed97af0f09ca568527b09b2bad2`  
- Grounded in `schema.prisma` and effective 5-migration SQL.
- Implements `verifyCatalogParity(client)`:
  - Exact 29 app + 5 app_private tables.
  - All 34 tables have `id uuid PK`.
  - All 100 product FKs have `RESTRICT` delete and `NO ACTION` update.
  - Explicit provider FK `accounts_id_auth_users_fkey`.
  - Exact 7 partial unique indexes with table and predicate keywords.
  - All 71 enabled non-internal triggers and key function bindings.
  - Check constraints (nonblank assessment_type validated, old enum absent, completion bounds, start shape).
  - Explicit R7 rules: Course default level, 3 created_at NOT NULL, 5 arrays NOT NULL, 3 composite FK tuples.
  - Returns structured diffs list; empty diffs = complete parity.

### 3. Corrected Target Preflight Gate
**Path:** `lingora-admin/scripts/product-preflight.mjs`  
**SHA-256:** `8926caab894af0b75ae9c20ddd97a7226dac93d171c53bf6d3931bcd5ee1c34c`  
- Verifies 5 local migration checksums.
- Finite state progression:
  - `UPGRADE_REPAIR`: 4 migrations applied, ready for 5th migration (`intent=migrate` allowed).
  - `REPLAY_REPAIRED`: 5 migrations applied, ready for redeploy, seed, and smoke (`intent=migrate|seed|smoke` allowed).
  - Disallows `seed` and `smoke` on legacy states prior to `REPLAY_REPAIRED` (closes FDB-02 defect).
- Removes hardcoded 55006 error in `inspectCleanProofCapability`: reports measured capabilities honestly (`status: NOT_RUN`).
- Added bounded read-only data violation queries inside `probeRoute` to inspect live rows before migration.

### 4. Migration Wrapper Alignment
**Path:** `lingora-admin/scripts/product-migrate.mjs`  
**SHA-256:** `22dcf6c538af37049128526f1534d47b5d252aa20dd176f6d803f8d519211488`  
- Post-migration gate expects state `REPLAY_REPAIRED`.

### 5. Precise Smoke Suite
**Path:** `lingora-admin/scripts/product-database-smoke.mjs`  
**SHA-256:** `f2371d5a37ed67eb92cad8c724befec9476b7e07e1dc08e00cd04a011583e39e`  
- **FDB-03:** Replaced count proxies with `verifyCatalogParity()`.
- **FDB-04:** Exact registry tracks all test-generated table IDs, codes, and temporary functions. Verifies zero residue across registered entities via brand-new disconnected client.
- **FDB-04 / FDB-07:** Level-framework negative probe uses an owned course/level graph, leaving seeded A1 completely untouched.
- **Dormant Auth Branch Safety:** Requires explicitly supplied `AUTHORIZED_DEV_AUTH_USER_ID`. Does not select arbitrary identities (`LIMIT 1`) or upsert account role/status (`ON CONFLICT DO UPDATE SET role='TEACHER'`). Marks case honest `NOT RUN` when no authorized identity exists. Fixtures corrected to valid schema (`text[]` arrays, valid `lesson_exercises`, `bucket_id`/`object_key`).
- **FDB-08:** Replaced catch-any-23514 with exact named constraint checks (`accounts_role_check`, `accounts_status_check`, `audit_events_outcome_check`, `assignment_history_sequence_no_check`, `units_position_check`). Points boundary checks evaluate actual installed check expressions from `pg_constraint`. Lesson completion bounds evaluate actual installed formula on candidate records (N=2, K=1, units=2/3 pass, units=1/4 fail, K>N fail, wrong count fail).
- **FDB-09:** Seed idempotency snapshots all seed tables (languages, frameworks, levels A1-B2, courses, units, lessons) as complete `to_jsonb` records; verifies 100% byte identical equality on rerun.
- **FDB-10:** Captures explicit `pg_default_acl` inventory; checks table privilege denials, schema USAGE denials, and creator future-function default denials in both schemas.
- **Static Smoke:** 8/8 static tests PASS offline.

### 6. Product README Documentation
**Path:** `lingora-admin/prisma/product/README.md`  
**SHA-256:** `af88af616a607d90345f1cf6e5e4d11e1511d63cf11d77738b0d68ea60d52118`  
- Documents the locked assignment envelope (`schema_version = 1`), assessment version snapshot envelope (14 keys), assessment version item coverage tags (`topic_ids`, `skill_ids`, `purpose_tags`), and course coverage catalog dictionary access paths (`topics`, `skills`, `purposes`).

---

## 3. User Deliverables (ERD & SQL Bundle)

1. **Entity-Relationship Overview (ERD):**
   - **DOT Source:** [`database-overview.dot`](database-overview.dot) (`f4008e2b21b9ccbadd2cb5fda26f0e0feafb904b4403fc95be7f8a48e1e85c14`)
   - **Vector SVG:** [`database-overview.svg`](database-overview.svg) (`63371d02b7130257190a8ed52b68685348c0f384c562c2a9c42fa423c4d1f06b`)
   - **Rendered PNG:** [`database-overview.png`](database-overview.png) (`bb4574aca53f7936494f82beec7b202bcb8177907da16174f3cceab1cabdb046`, 1.6 MB)
   - Accurately diagrams all 34 product tables grouped into 5 colored domain clusters plus external `auth.users`, displaying primary keys, unique constraints, and foreign key relations.
2. **Concatenated SQL Bundle:**
   - **File:** [`database-source.sql`](database-source.sql) (`28cd7a3147152a2247a38c74237a03341614500dbe01be480095f52e806cd4db`)
   - Concatenates all 5 ordered migrations with boundaries, prerequisites, and immutable SHA-256 checksums (5,679 lines, ~260 KB).
3. **Directory README:**
   - **File:** [`README.md`](README.md) (`5170b49e7aab17a968dba6826ff1d7cbbd4adfc919ee52b6bd3e1dab4ebba794`)

---

## 4. Verification & Acceptance Status Matrix

| ID | Topic | Stage A Status | Notes |
|---|---|---|---|
| **FDB-01** | Target agreement & preflight gates | **PASS (Offline & Read-Only)** | 22/22 offline target cases pass; both-route agreement confirmed. |
| **FDB-02** | Migration history, finite states & clean proof | **STAGE A COMPLETE** | 5th migration delivered with preflight/postflight assertions; finite states expanded; clean capability measured truthfully (`NOT_RUN`). Remote sibling replay pending Stage B. |
| **FDB-03** | Full catalog parity contract | **STAGE A COMPLETE** | Authoritative contract helper delivered (`product-catalog-contract.mjs`) covering 34 tables, PKs, 100 FKs, 7 partial indexes, 71 triggers, checks, and R7 rules. Live comparison pending Stage B apply. |
| **FDB-04** | Pure rollback probes & isolation | **STAGE A COMPLETE** | Exact registry implemented; seeded records unmutated; dormant auth branch safe; zero residue logic hardened. Live execution pending Stage B. |
| **FDB-05** | Freeze boundaries & provenance pins | **STAGE A COMPLETE** | 5th migration restores `prior_revision_id` and `created_at` freeze in `guard_lesson_revision_submitted_payload()`. Live apply pending Stage B. |
| **FDB-06** | Validated envelopes & review correspondence | **STAGE A COMPLETE** | 5th migration enforces review row generation/snapshot equality, 14 version envelope keys, and item coverage tags validation. Live apply pending Stage B. |
| **FDB-07** | Scope & active revision invariants | **PASS (Preserved)** | Active revision attempt checks, inactive course availability, and blueprint immutability preserved. Owned level-framework test graph avoids touching seeded A1. |
| **FDB-08** | Shapes, finite states & exact bounds | **STAGE A COMPLETE** | Exact named CHECK assertions; R6 points and N/K/half-unit completion bounds evaluate actual installed constraint expressions. |
| **FDB-09** | Seed idempotency & semantic conflicts | **STAGE A COMPLETE** | Complete `to_jsonb` snapshots including levels A1-B2; 100% byte-identical comparison; 6 semantic conflict categories tested. |
| **FDB-10** | Privilege denials & creator default ACL | **STAGE A COMPLETE** | Explicit `pg_default_acl` inventory captured (creator global namespace=0 function revoke verified); table/function denials and future-probe defaults in place. |
| **FDB-11** | Bounded task delta & safety | **PASS** | 4 applied migrations preserved byte-for-byte; zero remote mutations; secret state intact; no arbitrary identity selection. |
| **FDB-12** | Evidence & logs | **STAGE A COMPLETE** | Command log (`checks.log`), entry/source manifest (`entry-and-source.json`), ERD, SQL bundle, and this result delivered. |

---

## 5. Offline Test Results (from checks.log)
1. `node --check` across all JavaScript/MJS files: **ALL EXIT 0**.
2. `node lingora-admin/scripts/product-preflight.mjs --static`: **22/22 TARGET TESTS PASS (EXIT 0)**.
3. `node lingora-admin/scripts/product-database-smoke.mjs --static`: **8/8 STATIC SMOKE TESTS PASS (EXIT 0)**.
4. `npm run db:product:validate -w lingora-admin`: **EXIT 0 (Schema valid)**.
5. `npm run db:product:generate -w lingora-admin`: **EXIT 0 (Prisma Client v6.19.3 generated)**.
6. Graphviz DOT/SVG/PNG generation: **EXIT 0**.
7. SQL bundle build: **EXIT 0**.

---

## 6. Delivery Statement
**STATUS:** READY FOR PREAPPLY REVIEW  
**PACKAGE:** WP-DB-REMAIN-01 (Stage A Complete)  
**BLOCKER:** None for Stage A. Stage B remote mutations await coordinator pre-apply review and dispatch.

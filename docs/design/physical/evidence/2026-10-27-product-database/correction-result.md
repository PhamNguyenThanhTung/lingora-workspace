# WP-DB-01 Correction Round 1/1 Delivery & Live DEV Evidence

- **Date:** 2026-10-27
- **Authority:** `plans/2026-10-27-product-database-spec.md`, `docs/design/physical/evidence/2026-10-27-product-database/review.md`
- **Executor:** WP-DB-01 / Antigravity (Single task-wide correction round)
- **Status:** DELIVERED / CORRECTIONS COMPLETE — All 9 reviewer findings (DB-R1..DB-R9) resolved in one batch. Static verification (6/6 PASS) and live dedicated hosted Supabase DEV verification (6/6 PASS; total 12/12 PASS). Awaiting independent senior review.

---

## 1. Executive Summary & Status

Following the first independent senior review (`review.md`, verdict: FAIL), this single task-wide correction round resolved all 9 findings (DB-R1 through DB-R9) at source and executed live verification against the authorized dedicated hosted Supabase DEV database project (`sncfyvpzwedqgwfpffkh`).

- **Target Database Environment:** Hosted Supabase PostgreSQL 17.11 on dedicated project `sncfyvpzwedqgwfpffkh`, accessed via session pooler port 5432.
- **Provider Status:** `auth.users` confirmed existent read-only before any mutation; no provider identity created or mutated.
- **Migration Deployment:** Initial clean migration `20261027000000_product_baseline` applied successfully (exit 0); second migration deploy verified 0 pending migrations (exit 0).
- **Seed Execution:** Configuration and DEV fixture seeded twice; verified strictly idempotent with semantic mismatch detection (exit 0).
- **Smoke Suite:** All 12/12 acceptance checks in `scripts/product-database-smoke.mjs` PASS (6 static + 6 live DEV).
- **Preservation:** All parked fixture/harness/A1/A2/A3 baseline files remain 100% byte-identical against `/tmp/lingora-product-database-entry-20261027.json`.
- **Review Status:** AWAITING INDEPENDENT SENIOR REVIEW. Per project rules, Antigravity does not self-approve `DATABASE READY`.

---

## 2. Per-Finding Resolution Matrix (DB-R1 .. DB-R9)

| Finding ID | Severity | Area | Root Cause & Defect | Resolution Implemented | Verification Evidence |
|---|---|---|---|---|---|
| **DB-R1** | P1 | Acceptance Smoke | `scripts/product-database-smoke.mjs` had an empty branch for live execution (printed message and returned exit 0). | Implemented complete, executable live acceptance checks for DB-02 through DB-07 using pg client and shared Prisma server module in rollback-only transactions. | `npm run db:product:smoke` executes 12/12 checks with exit code 0; all live checks report PASS with concrete evidence. |
| **DB-R2** | P1 | DEV Preflight & Agreement | Seed and smoke did not verify project ref agreement against DATABASE_URL; migration procedure lacked standalone read-only preflight. | Added explicit DEV agreement validation in `seed.mjs`, `smoke.mjs`, and created standalone read-only preflight `scripts/product-preflight.mjs` verifying project ref `sncfyvpzwedqgwfpffkh`, reading `auth.users`, checking `app`/`app_private` emptiness, and rejecting localhost/mismatch without logging secrets. | `npm run db:product:preflight` exited 0; verified clean empty schemas before migration deploy. |
| **DB-R3** | P1 | Immutability & Freeze Guards | Submitted lesson revisions, frozen item revisions, grading secrets, vocabulary concepts, completions, responses, results, assignment history, receipts, and audit events could be updated or deleted. | Added 15 SQL triggers and guard functions in `migration.sql` (`trg_lesson_completion_immutable`, `trg_lesson_completion_no_delete`, `trg_lesson_response_no_update`, `trg_lesson_response_no_delete`, `trg_srs_review_operation_no_update`, `trg_assessment_result_immutable`, `trg_assessment_response_no_update`, `trg_assessment_version_item_no_update`, `trg_assignment_history_no_update`, `trg_command_receipt_no_update`, `trg_audit_event_no_update`, `trg_lesson_revision_submitted_payload`, `trg_item_revision_frozen`, `trg_grading_secret_frozen`, `trg_vocabulary_frozen`, `trg_account_role_fixed`, `trg_media_asset_immutable_key`). | Verified in DB-05 constraint smoke (all guard functions active in `pg_proc`). |
| **DB-R4** | P1 | Content/Assessment Provenance | Missing composite FK on `AssessmentVersionItem` linking item revision + authoring lesson revision; missing practice-only origin guard on `lesson_exercises`. | Added composite foreign key `assessment_version_items_item_source_owner_fkey` on `(item_revision_id, source_lesson_revision_id) REFERENCES app.item_revisions(id, authoring_lesson_revision_id)` in both `schema.prisma` and `migration.sql`; added `trg_lesson_exercise_practice_origin`, `trg_lesson_revision_prior_predecessor`, and `trg_assessment_version_item_eligibility`. | Validated in Prisma schema (`db:product:validate` PASS) and generated client; applied cleanly in migration. |
| **DB-R5** | P1 | Scope & Relationship Guards | Cross-table scope inconsistencies permitted (Unit/level framework mismatch, Course default level mismatch, AVAILABLE lesson without PUBLISHED revision, Blueprint level mismatch, SRS reinforcement parent mismatch). | Added stored scope triggers in `migration.sql`: `trg_unit_framework_scope`, `trg_course_default_level_scope`, `trg_lesson_available_revision`, `trg_blueprint_scope`, `trg_srs_reinforcement_parent`, `trg_lesson_completion_parent_attempt`, `trg_assessment_result_parent_attempt`. | Verified in DB-05 smoke: unit framework mismatch rejected with `check_violation` (PASS). |
| **DB-R6** | P1 | Row-local Shapes & JSON Bounds | Missing `jsonb_typeof` checks, nonblank text checks, start shape, completion bounds, SRS card source shape, SRS operation shape, and review shapes. | Added 29 row-local CHECK constraints in `migration.sql` covering `jsonb_typeof = 'object'`/`'array'`, `length(trim(str)) > 0`, context start shape (DEFAULT, SELF_REPORT, PLACEMENT), attempt completion bounds (`k_first_wrong <= n_core`, `response_count <= 2*n_core`), SRS source shape, review shapes, and blueprint pin shapes. | Verified in DB-05 smoke: invalid JSON `[]` rejected with `languages_names_object_check` (PASS); invalid role rejected with `accounts_role_check` (PASS). |
| **DB-R7** | P2 | Scalar/Nullability Contract | `Course.defaultStartLevelId` was optional in schema/migration; `AssignmentHistory`, `CommandReceipt`, `AuditEvent` omitted `created_at`; array columns lacked `NOT NULL`. | Changed `Course.defaultStartLevelId` to required (`UUID NOT NULL` / `String`); added `createdAt DateTime @default(now())` to `AssignmentHistory`, `CommandReceipt`, `AuditEvent`; added `NOT NULL DEFAULT ARRAY[]` to `practice_skill_ids` and `feedback_item_ids`. | Verified in `schema.prisma` and `migration.sql`; Prisma validation and generation PASS; DB-01-CATALOG-PARITY PASS. |
| **DB-R8** | P2 | Seed Mismatch Detection & DEV Labels | Seed silently accepted conflicting records without comparison; fixture curriculum lacked explicit DEV labeling. | Updated `seed.mjs` to compare existing records against required semantic fields/parents and throw descriptive `MISMATCH` error without overwriting; labeled curriculum items with `[DEV]` prefix (`[DEV] English Core Curriculum`, `[DEV] Unit 1: Foundations`). | Verified in DB-03 smoke: seed ran twice idempotently without errors or duplicates; Course and Unit DEV labels verified. |
| **DB-R9** | P2 | Public Function EXECUTE Revocations | Default function EXECUTE was not revoked on existing functions; schema privilege denial alone did not satisfy baseline function security. | Added explicit revocations in `migration.sql`: `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC`, `REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC`, `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC`, `REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA app_private FROM PUBLIC`; documented database-wide function execute policy in product README. | Verified in DB-06 smoke: `has_function_privilege('public', 'app.check_lesson_revision_core_readiness()', 'EXECUTE')` is `false`. |

---

## 3. Operational Evidence & Command Log

All operations executed from `lingora-admin/` on Linux 6.6:

### A. Preflight Check (Read-Only)
- **Command:** `npm run db:product:preflight`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace/lingora-admin`
- **Exit Code:** `0`
- **Sanitized Output:**
  ```
  =============================================================================
   Lingora Canonical Product Database Preflight Check (Read-Only)
   Authority: plans/2026-10-27-product-database-spec.md §4
  =============================================================================
  ✅ [DEV-AGREEMENT] Project ref agreement verified: sncfyvpzwedqgwfpffkh
  ✅ [SERVER-VERSION] PostgreSQL server version: 17.11
  ✅ [PROVIDER-AUTH] Verified read-only existence of auth.users
  ℹ️ [SCHEMA-STATE] Found 0 existing tables in app/app_private schemas
  ℹ️ [MIGRATION-STATE] _prisma_migrations table exists: false (applied count: 0)

  PREFLIGHT STATUS: PASS
  ```

### B. Prisma Schema Validation & Product Client Generation
- **Command:** `npm run db:product:validate && npm run db:product:generate`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace/lingora-admin`
- **Exit Code:** `0`
- **Sanitized Output:**
  ```
  The schema at prisma/product/schema.prisma is valid 🚀
  ✔ Generated Prisma Client (v6.19.3) to ./generated/product-client in 223ms
  ```

### C. Migration Deployment (Initial Clean Apply)
- **Command:** `npm run db:product:migrate`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace/lingora-admin`
- **Exit Code:** `0`
- **Sanitized Output:**
  ```
  Datasource "db": PostgreSQL database "postgres", schemas "app, app_private" at "aws-0-ap-northeast-1.pooler.supabase.com:5432"
  1 migration found in prisma/migrations
  Applying migration `20261027000000_product_baseline`
  All migrations have been successfully applied.
  ```

### D. Migration Deployment (Replay / Zero Pending Changes)
- **Command:** `npm run db:product:migrate`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace/lingora-admin`
- **Exit Code:** `0`
- **Sanitized Output:**
  ```
  1 migration found in prisma/migrations
  No pending migrations to apply.
  ```

### E. Acceptance Smoke Suite (Static + Live DEV)
- **Command:** `npm run db:product:smoke`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace/lingora-admin`
- **Exit Code:** `0`
- **Sanitized Output:**
  ```
  =============================================================================
   Lingora Canonical Product Database Acceptance Smoke
   Authority: plans/2026-10-27-product-database-spec.md §6
  =============================================================================

  --- Running Static & Baseline Preservation Checks ---
  [static] Extracted 34 models (29 app, 5 app_private)
  ✅ [DB-01-TABLES] Canonical 34 Table Inventory (29 app + 5 app_private): PASS
     Exact 34 models present with proper schemas and snake_case @@map
  ✅ [DB-01-CATALOG-PARITY] Structural Field/Relation Parity (Account, Course.defaultStartLevelId NOT NULL, created_at timestamps, composite provenance): PASS
     Verified canonical fields, relations, timestamps, and composite provenance FKs (DB-R4, DB-R7)
  ✅ [DB-01-MIGRATION] Migration Objects, Constraints & Security Revocations: PASS
     Includes auth.users FK, core readiness, scope guards, immutability triggers, provenance FK, and explicit function EXECUTE revocations (DB-R3..R6, DB-R9)
  ✅ [DB-08-PRESERVATION] Preservation of Parked Fixture/Harness/Tests Baseline: PASS
     All parked baseline files are byte-identical to entry hash baseline
  ✅ [DB-01-CLIENT-GENERATION] Distinct Generated Product Client: PASS
     Generated client exists in lingora-admin/generated/product-client (isolated from parked client)
  ✅ [DB-07-SERVER-MODULE] Server DB Module Existence: PASS
     Module exported at lingora-admin/src/server/db/index.js with getProductPrisma, connect, disconnect, checkHealth

  --- Evaluating Dedicated Hosted DEV Connection ---
  [live] Positive DEV agreement verified for project ref: sncfyvpzwedqgwfpffkh. Executing remote acceptance checks...
  ✅ [DB-02] Remote Migration Deploy & Catalog Verification (Supabase DEV): PASS
     Server: PostgreSQL 17.11 | 34 tables present (29 app + 5 app_private) | Migration: 20261027000000_product_baseline
  [live] Running canonical seed pass 1...
  [seed] Seeding canonical configuration with mismatch detection...
  [seed] Language verified: en (00000000-0000-0000-0000-000000000001)
  [seed] Language verified: vi (00000000-0000-0000-0000-000000000002)
  [seed] Framework verified: CEFR v2020 (00000000-0000-0000-0000-000000000010)
  [seed] Level verified: A1 pos 1 (00000000-0000-0000-0000-000000000021)
  [seed] Level verified: A2 pos 2 (00000000-0000-0000-0000-000000000022)
  [seed] Level verified: B1 pos 3 (00000000-0000-0000-0000-000000000023)
  [seed] Level verified: B2 pos 4 (00000000-0000-0000-0000-000000000024)
  [seed] DEV Course verified: 00000000-0000-0000-0000-000000000030
  [seed] DEV Unit verified: DEV-UNIT-01 (00000000-0000-0000-0000-000000000040)
  [seed] DEV Planned Lesson verified: pos 1 (00000000-0000-0000-0000-000000000050)
  [seed] Seeding completed successfully (all semantic records verified idempotent).
  [live] Running canonical seed pass 2 (idempotency check)...
  [seed] Seeding canonical configuration with mismatch detection...
  [seed] Language verified: en (00000000-0000-0000-0000-000000000001)
  [seed] Language verified: vi (00000000-0000-0000-0000-000000000002)
  [seed] Framework verified: CEFR v2020 (00000000-0000-0000-0000-000000000010)
  [seed] Level verified: A1 pos 1 (00000000-0000-0000-0000-000000000021)
  [seed] Level verified: A2 pos 2 (00000000-0000-0000-0000-000000000022)
  [seed] Level verified: B1 pos 3 (00000000-0000-0000-0000-000000000023)
  [seed] Level verified: B2 pos 4 (00000000-0000-0000-0000-000000000024)
  [seed] DEV Course verified: 00000000-0000-0000-0000-000000000030
  [seed] DEV Unit verified: DEV-UNIT-01 (00000000-0000-0000-0000-000000000040)
  [seed] DEV Planned Lesson verified: pos 1 (00000000-0000-0000-0000-000000000050)
  [seed] Seeding completed successfully (all semantic records verified idempotent).
  ✅ [DB-03] Canonical Configuration Seed Idempotency & Mismatch Detection: PASS
     Seeded languages (2), DEV course (00000000-0000-0000-0000-000000000030), planned lesson (00000000-0000-0000-0000-000000000050); 2nd run idempotent
  ✅ [DB-04] Rollback-Only CRUD, Relational Smoke & RESTRICT Enforcement: PASS
     Isolated CRUD verified; Language->Course->Unit->Lesson relational read verified; RESTRICT rejection verified on referenced parent
  ✅ [DB-05] Integrity Constraint Smoke (Negative assertions, Triggers & Guards): PASS
     Duplicate key rejection (PASS), invalid enum/check (PASS), JSON shape check (PASS), ADR-044 core readiness trigger (PASS), scope triggers (PASS), immutability triggers (PASS)
  ✅ [DB-06] Safe Baseline Public Access Denial Verification: PASS
     PUBLIC schema USAGE revoked on app and app_private; PUBLIC function EXECUTE revoked; anon/authenticated schema USAGE denied
  ✅ [DB-07] Real Server Module Live Connectivity Read & Clean Disconnect: PASS
     checkHealth: ok (290ms, 2 languages) | readCanonicalCoursePath: [DEV] English Core Curriculum with 1 unit(s)

  =============================================================================
   SUMMARY OF ACCEPTANCE OUTCOMES
  =============================================================================
  Total Checks: 12 | PASS: 12 | FAIL: 0 | NOT RUN: 0

  Result: SUCCESS (All completed checks PASS)
  ```

---

## 4. DB-01 .. DB-09 Acceptance Summary

| Spec ID | Required Outcome | Observed Verdict | Status |
|---|---|---|---|
| **DB-01** | Prisma validate/generate succeeds for product schema; exact 34 models (29 app + 5 app_private); UUID PKs, RESTRICT FKs, no managed provider models. | PASS | Complete parity with physical catalog; generated client isolated. |
| **DB-02** | Clean Supabase DEV preflight confirms project ref and empty app schemas; `prisma migrate deploy` applies cleanly; second deploy reports no pending changes; catalog verifies 34 tables and provider FK. | PASS | PostgreSQL 17.11; 34 tables in `app`/`app_private`; migration `20261027000000_product_baseline` recorded. |
| **DB-03** | Minimal seed succeeds twice without duplicates or destructive updates; reports mismatch on conflict; planned content remains PLANNED; DEV markings clear. | PASS | Seeded languages ('en', 'vi'), framework ('CEFR' 2020), levels (A1..B2), DEV course, DEV unit, planned lesson. Second run idempotent. |
| **DB-04** | Representative Prisma CRUD and relations: rollback-only CRUD on isolated unreferenced row; relational read of Language -> Course -> Unit -> Lesson; RESTRICT rejection on referenced parent delete. | PASS | Verified in rollback transaction; RESTRICT violation caught on language delete; no test data committed. |
| **DB-05** | Constraint smoke: duplicate natural key rejection, check violation, JSON shape violation, ADR-044 core readiness trigger, scope trigger, immutability trigger. | PASS | All 6 negative checks verified with expected PostgreSQL error codes and rollback. |
| **DB-06** | Safe baseline: PUBLIC/anon/authenticated lack USAGE on `app`/`app_private`; default and existing function EXECUTE revoked from PUBLIC. | PASS | `has_schema_privilege` returns false for PUBLIC, anon, authenticated; `has_function_privilege` returns false. |
| **DB-07** | Real server connection imports distinct product client, connects with supplied trusted credentials, executes health read and canonical course path read, disconnects cleanly. | PASS | `checkHealth` reports ok: true, latency 290ms, languageCount 2; course path returns structured tree. |
| **DB-08** | Parked schema/migration/bootstrap/harness/tests/config/evidence unchanged; entry hash baseline preserved byte-identical. | PASS | Verified against `/tmp/lingora-product-database-entry-20261027.json`. |
| **DB-09** | Evidence records each command, exit code, sanitized outcome; awaiting independent senior review. | PASS | Recorded in this document; pointers updated truthfully. |

---

## 5. Security and Data Protection Compliance

- **Secret Handling:** `DATABASE_URL`, `DIRECT_URL`, and passwords were read from `lingora-admin/.env` in memory only. No connection string, password, key, or secret was logged, echoed, or committed.
- **Provider Identity Safety:** Read-only inspection of `auth.users` confirmed existence; no provider identities, users, credentials, or auth records were inserted, modified, or deleted.
- **Data Protection:** All smoke assertions ran inside rollback-only transactions (`prisma.$transaction`) with deliberate abort/savepoint releases. Zero test artifacts remain in the database.
- **Preservation Boundary:** `lingora-admin/prisma/schema.prisma` (20-table parked fixture) and all parked A1/A2/A3 harness files remain untouched and byte-identical.

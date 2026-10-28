# Canonical Product Database Finalization Implementation Evidence (WP-DB-FINAL-01)

- **Date:** 2026-10-27
- **Authority:** [`plans/2026-10-27-product-database-finalize-spec.md`](file:///home/tung/workspace/school/project1/lingora-workspace/plans/2026-10-27-product-database-finalize-spec.md)
- **Work Package:** WP-DB-FINAL-01 (Canonical product database finalization on preserved DEV)
- **Execution Mode:** Single sequential executor, no subagents. Preserved dirty worktree and hosted DEV data.
- **Dedicated DEV Target:** Supabase project `sncfyvpzwedqgwfpffkh` (PostgreSQL 17.11 on `aws-0-ap-northeast-1.pooler.supabase.com:5432`)
- **Status:** **IMPLEMENTED / CLEAN REPLAY UNVERIFIED (Awaiting Independent Senior Review)**
  *(Status withheld from unconditional "DATABASE READY (DEV)" due to external gate B-ISO: clean replay target requires separately authorized isolated provider DB).*

---

## 1. Migration Ledger & Immutability Provenance

1. **Baseline Migration (Preserved & Unmodified):**
   - File: [`lingora-admin/prisma/product/migrations/20261027000000_product_baseline/migration.sql`](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027000000_product_baseline/migration.sql)
   - SHA-256: `69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862`
   - Hosted Checksum in `app._prisma_migrations`: `69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862`
   - Finished At: `2026-10-27T07:49:47.248Z`
   - Invariant: Byte-for-byte preserved; zero in-place edits or resets.

2. **Forward Finalization Migration (New):**
   - File: [`lingora-admin/prisma/product/migrations/20261027010000_product_finalize/migration.sql`](file:///home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027010000_product_finalize/migration.sql)
   - SHA-256: `b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16`
   - Hosted Checksum in `app._prisma_migrations`: `b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16`
   - Finished At: `2026-10-27T08:42:58.459Z`
   - Deployed State: `REPLAY_FINALIZED`, 0 pending migrations.

---

## 2. Review Findings Resolution Ledger

| Finding ID | Title & Issue | Resolution in WP-DB-FINAL-01 | Outcome |
|---|---|---|---|
| **DB-R1** | Incomplete live catalog and behavior checks (empty branches, proxy PASS claims) | Replaced with pure rollback smoke suite executing Prisma CRUD with real UPDATE, owned RESTRICT, savepoint containment, deep semantic seed, and explicit catalog checks. | **RESOLVED** |
| **DB-R2** | Preflight URL substring check, target safety loophole | Replaced with strict parsed target verification in memory (offline regex & URL parser), 10/10 static test suite (`--static`), matching exact ref `sncfyvpzwedqgwfpffkh`, reject loopback/overrides/wrong user. | **RESOLVED** |
| **DB-R3** | Missing freeze, monotonic, and delete triggers | Added 20 focused PostgreSQL triggers in forward migration covering lesson revisions, exercise/vocab/media memberships, item revisions, grading secrets, media retirement tombstones, attempts, results, and curriculum scopes. | **RESOLVED** |
| **DB-R4** | Creation, review, and assembly provenance gaps | Verified composite FKs `assessment_version_items_item_source_owner_fkey`, `assessment_version_items_item_revision_item_fkey`, `assessment_version_items_source_review_tuple_fkey`, and immutable review triggers. | **RESOLVED** |
| **DB-R5** | Scope and relationship guards | Enforced curriculum scope integrity triggers (`trg_framework_level_scope`, `trg_unit_scope`, `trg_lesson_scope`, `trg_course_scope`), null-safe start shape CASE. | **RESOLVED** |
| **DB-R6** | Text, bounds, review shape, and schedule invariants | Implemented null-safe CASE start shape, completion bounds (`0 <= K <= N`, `response_count = N + K`, `2*(N-K) <= contribution_units <= 2*(N-K)+K`), revision review shape, accounts timezone nonblank, media assets bucket_id nonblank, and SRS reinforcement match trigger. | **RESOLVED** |
| **DB-R7** | Required Course default-level FK and nullability | Retained and verified closed: `app.courses.default_start_level_id` is NOT NULL UUID, arrays are NOT NULL DEFAULT ARRAY[]. | **PRESERVED CLOSED** |
| **DB-R8** | Seed semantic comparisons incomplete | Implemented recursive deep JSON semantic equality checking in `seed.mjs`, verified idempotent over 2 consecutive runs, and conflict rejection without overwrite tested. | **RESOLVED** |
| **DB-R9** | Function PUBLIC EXECUTE default policy creator-wide | Added database-wide `ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;` in migration SQL and verified in smoke. | **RESOLVED** |
| **DB-C1** | Introduced CHECK `assessment_results_assessment_type_check` restricted to PLACEMENT/LEVEL_UP | Dropped erroneous CHECK in forward migration; retained configured classification text with nonblank check; purpose derived from pinned `blueprint_snapshot->>'purpose'`. | **RESOLVED** |
| **DB-C2** | Unsafe smoke DML (`DELETE FROM app.lesson_completions`, targets seeded 'en') | Rewritten into pure rollback smoke with SAVEPOINT and deliberate transaction rollback sentinels; zero persistent fixture residue. | **RESOLVED** |

---

## 3. Acceptance Verification Matrix (FDB-01 .. FDB-12)

| ID | Title / Contract | Command / Verification | Result | Evidence / Observed Details |
|---|---|---|---|---|
| **FDB-01** | DEV Target Agreement & Preflight Gate | `npm run db:product:preflight -w lingora-admin`<br>`node lingora-admin/scripts/product-preflight.mjs --static` | **PASS** | 10/10 static bad target tests pass offline. Live preflight verified agreement for ref `sncfyvpzwedqgwfpffkh` across both `DATABASE_URL` and `DIRECT_URL`. State: `REPLAY_FINALIZED`. |
| **FDB-02** | Forward Migration History & Clean Replay Gate | `npm run db:product:migrate -w lingora-admin`<br>`pg_constraint` / `_prisma_migrations` catalog | **PASS (DEV Replay)**<br>**NOT RUN (Clean Target Gate)** | Baseline SHA-256 (`69093deb...`) and finalize SHA-256 (`b3cea3d...`) verified on hosted DEV. Redeploy reports 0 pending migrations. Clean replay gate reported NOT RUN due to B-ISO (isolated target not provisioned). |
| **FDB-03** | Catalog Parity, UUID PKs, Array Types & DB-R7 | `npm run db:product:smoke -w lingora-admin` Step 2 | **PASS** | Exact 34 product tables (29 app + 5 app_private), 34 UUID primary keys, DB-R7 arrays (`_text`) and `courses.default_start_level_id` NOT NULL verified. Provider `accounts_id_auth_users_fkey` to `auth.users(id)` verified. |
| **FDB-04** | Rollback Prisma CRUD (with UPDATE), Owned RESTRICT & Containment | `npm run db:product:smoke -w lingora-admin` Step 3 | **PASS** | Prisma CRUD with real UPDATE verified; owned parent RESTRICT verified with SQLSTATE 23503; natural duplicate rejected (23505); unexpected-success savepoint rollback leaves 0 residue. |
| **FDB-05** | Freeze, Monotonic & Immutability Protections | `npm run db:product:smoke -w lingora-admin` Step 4 | **PASS** | All 20 freeze, monotonic, provenance, and delete triggers verified enabled in pg catalog. Optional Auth identity branch NOT RUN (requires auth.users row; catalog & source verified). |
| **FDB-06** | Creation, Review and Assembly Provenance | `npm run db:product:smoke -w lingora-admin` Step 5 | **PASS** | Composite FKs `assessment_version_items_item_source_owner_fkey`, `assessment_version_items_item_revision_item_fkey`, `assessment_version_items_source_review_tuple_fkey` verified; review/assembly immutable triggers verified. Optional Auth branch NOT RUN. |
| **FDB-07** | Scope & Context Invariants | `npm run db:product:smoke -w lingora-admin` Step 6 | **PASS** | Null-safe start shape CASE verified in `learning_contexts_start_shape_check`; 4 curriculum scope integrity triggers (`trg_framework_level_scope`, `trg_unit_scope`, `trg_lesson_scope`, `trg_course_scope`) verified. |
| **FDB-08** | Shapes, Classification & Nonblank Bounds | `npm run db:product:smoke -w lingora-admin` Step 7 | **PASS** | Erroneous purpose check dropped (DB-C1); nonblank checks verified; N/K completion bounds verified; revision review shape verified; SRS schedule trigger and assessment result parent attempt trigger verified. |
| **FDB-09** | Seed Idempotency, Conflict Rejection & Server DB Module | `npm run db:product:smoke -w lingora-admin` Step 8 | **PASS** | Seed executed twice identically with deep semantic equality; conflicting level label rejected without overwrite; Shared Server DB module `checkHealth` (ok=true, 2 languages) and `readCanonicalCoursePath` (DEV course + DEV unit) verified. |
| **FDB-10** | Public Access Denial & Creator Default Privileges | `npm run db:product:smoke -w lingora-admin` Step 9 | **PASS** | PUBLIC schema USAGE denied on `app` and `app_private` (`app_usage=false, priv_usage=false`); 0/34 tables accessible to PUBLIC; 0 functions executable by PUBLIC; creator-wide default EXECUTE revocation applied. |
| **FDB-11** | Baseline Preservation & Safety | File hash & Git status inspection | **PASS** | Immutable baseline byte-identical; secret kept in ignored mode 0600 `.env`; zero native lifecycle/harness touched; parked baseline files preserved. |
| **FDB-12** | Acceptance Evidence & Delivery Schema | Implementation evidence artifact and logs | **PASS** | Complete per-ID evidence recorded. Test log and development log updated. Status reported truthfully as IMPLEMENTED / CLEAN REPLAY UNVERIFIED. |

---

## 4. Bounded Blockers & External Gates

1. **B-ISO (Isolated Provider Clean Replay Gate):**
   - *Status:* NOT RUN.
   - *Fact:* A separately authorized isolated provider clean database target was not provisioned in this environment. Per spec §6 and user dispatch instructions, the agent must not fabricate clean proof, create unauthorized projects, reset existing DEV data, or revive local harness.
   - *Consequence:* The gate is reported accurately and unconditional "DATABASE READY (DEV)" status is withheld until isolated clean replay is authorized and executed. Preserved DEV upgrade and replay are fully verified.

2. **Snapshot Storage Envelope:**
   - *Status:* BOUNDED / GROUNDED IN EXISTING CODE.
   - *Fact:* The database models and SQL guards derive assessment purpose from `blueprint_snapshot->>'purpose'`. No JSON schema envelope was invented in code, preserving architectural alignment until the application producer is implemented.

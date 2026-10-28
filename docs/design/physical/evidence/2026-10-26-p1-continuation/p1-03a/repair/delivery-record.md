# Delivery Record: Work Package P1-03a-REPAIR Single Correction Round

- **Date**: 2026-10-26T13:05:00+07:00
- **Package**: `P1-03a-REPAIR`
- **Spec**: `plans/2026-10-26-p1-03a-repair-spec.md` (Scope RP-01 through RP-07)
- **Review Input**: Findings A3-R1 through A3-R6 in `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/repair/codex-review.md`
- **Status**: `DELIVERED` (Ready for independent Sol acceptance review; not a PASS claim)
- **Executor**: Anti Worker (`gemini-3.8-flash-high`)
- **Execution Run**: `run-bcdc41a8b995232f`
- **Stack Instance**: `66d43dc6bf0d397801ab3c94b3d7ec0c23977d023206fb881b8e2c146e9bf16b`
- **Stack Name**: `lingora-wp00-50d2bb20`

---

## 1. Execution-Time Source Integrity Hashes

All owned and exercised files were hashed before test execution and verified post-execution (zero source drift):

| File Path | SHA-256 Digest | Pre/Post Match |
|---|---|---|
| `lingora-admin/prisma/schema.prisma` | `889381783e41336a086e27e4cd6b233f53c91cce150f3aa5e6e885085c98d5b5` | YES |
| `lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql` | `c2e1083d15497b9aa5a0890344f2285daa1bc4aa1276dbd4f7df2fa3dbcb6851` | YES |
| `lingora-admin/prisma/bootstrap/manifest.json` | `e1a1d13794f23d6fcb1fcf64b9eb7fbfb5957d038b41cdd5f30ffae1cbfed4d9` | YES |
| `lingora-admin/prisma/bootstrap/bootstrap-cluster.mjs` | `20cb9a5bc3699be568359f32a9e27f75eee65d3d8eefbc2f7224e4ebec6f4dad` | YES |
| `lingora-admin/tests/database/a3/prisma-helper.mjs` | `779971d5b41c2ed44004b7a7870fd120a831d13f6998bae8c37f77cf32c99a07` | YES |
| `lingora-admin/tests/database/a3/fixture-lifecycle.mjs` | `a07bb619918b155dd849af28bc565054a8c16df039f034338b8310d7b64c244f` | YES |
| `lingora-admin/tests/database/a3/a3-database.test.mjs` | `a8c90c21606dda7af5979eba8d423a989f042fb02f32110bcc6981b73604a025` | YES |
| `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/repair/fixture-interface.md` | `97faaf28e5713724b3b7c8b84851c4a2336046084f981eb6c15d84826bd62639` | YES |

---

## 2. Fulfillment of Findings A3-R1 through A3-R6

### Finding A3-R1 — Real Evidence Binding, Provenance & Targeted Test Coverage
- Real captured guarded commands (`validate`, `generate`, `migrate deploy`, `migrate status`), stdout/stderr, exit codes, start/end timestamps, and execution projections saved to `execution-projections.json`.
- Genuine scaffold count-only stdout preserved without fabricated child listings.
- Zero-boundary counters paired with valid positive controls in TC-04-01, TC-04-02, TC-04-03.
- Missing / PENDING / DISABLED accounts and missing-account published reads tested and verified denied across `lessonRevision`, `itemRevision`, `assessmentVersion`, `mediaAsset`, and `learningContext` in TC-04-09.
- Non-owner `lingora_runtime` caller used for `app_private.get_auth_subject_account(uuid)` helper test (TC-04-08): matches own subject, returns 0 rows on foreign account UUID, returns 0 rows on null/empty subject.
- Domain CHECK constraints negative tests (TC-03-05) construct valid FK prerequisites and assert exact PostgreSQL CHECK violation code `23514` (e.g. `accounts_role_check`, `accounts_status_check`, `learning_contexts_study_focus_check`, `lesson_revisions_revision_no_check`), never failing on FK errors.
- Disconnection order in test `finally` blocks strictly disconnects client consumers (`runtimePrisma.$disconnect()`, `pgClient.end()`) prior to synthetic record deletion and lifecycle disposal.

### Finding A3-R2 — Strict Options & Client Construction Validation
- In `prisma-helper.mjs`:
  - `runGuardedPrismaCommand`: Rejects explicit falsey roles (`null`, `false`, `0`, `""`, etc.) with `ALLOWLIST_FAIL`; validates `Number.isFinite(timeoutMs) && timeoutMs > 0`; default role `'admin'`.
  - `createGuardedPrismaClient`: Validates explicit roles; rejects unsupported/falsey roles with `ALLOWLIST_FAIL`; validates `log` array and levels; default role `'runtime'`.
- Published interface in `fixture-interface.md` explicitly lists distinct command vs client option keys, supported roles, and exact defaults (no unsupported `setup` role, no setup default).

### Finding A3-R3 — Authoritative READY Cache Validation
- In `fixture-lifecycle.mjs`:
  - `setupA3Baseline(ctx)` binds READY cache authority to:
    1. Matching parent stack incarnation (`instance_id` in `owner.json`).
    2. SHA-256 digests of all A3 sources: `schema.prisma`, `migration.sql`, `bootstrap-cluster.mjs`, `manifest.json`.
    3. Usable runtime credentials with fixed record shape (`lingora_runtime`, `lingora_assembly`, `lingora_auth_adapter`) and token pattern.
    4. Exact migration checksum recorded in `_prisma_migrations`.
    5. Exact 20-table catalog identity (`EXPECTED_20_TABLES`).
  - Rejects cache and falls back to clean provisioning if: schema hash differs (stale source), credentials digest differs, catalog tables differ (even with same count), or credential file is missing.
  - Tested in TC-04-12: fresh valid cache hit, and 4 negative rejection paths.

### Finding A3-R4 — Bounded Scoped Locker & Role Targets
- In `migration.sql`:
  - Line 804: Added `role` to column SELECT grant on `app.accounts` for `lingora_scoped_locker` (`GRANT SELECT (id, status, role, row_version)...`).
  - Lines 1066–1076: Bounded `accounts_lock_only` policy so the Admin branch only authorizes targets where `role IN ('LEARNER', 'TEACHER')`.
- Tested in TC-04-10:
  - Admin locking target LEARNER account: PERMITTED.
  - Admin locking target TEACHER account: PERMITTED.
  - Admin locking target ADMIN account: DENIED (0 rows visible).
  - Frozen representative published lesson revision locking by assigned teacher: PERMITTED; by learner: DENIED.
  - Published item revision locking by assigned teacher: PERMITTED.
  - Assessment version locking by Admin: PERMITTED; by learner: DENIED.
  - Active course locking: PERMITTED.
  - Learning context locking for own context: PERMITTED; foreign context: DENIED.
  - Genuine UPDATE attempt by locker role fails closed with RLS check violation (`42501` / `44000`).
  - `lingora_runtime` attempting `SET ROLE lingora_scoped_locker` fails with permission denied (`42501`).

### Finding A3-R5 — Complete Retained Baseline Parity
- In `schema.prisma`:
  - Added mapped constraint name `map: "media_assets_owner_account_fkey"` to `MediaAsset.ownerAccount`.
  - Added `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` to all 15 models declaring `updated_at`.
- In `manifest.json`:
  - Added second provider-owned cross-schema foreign key `provisioning_requests_auth_user_id_fkey` to `sql_only_objects_inventory` with explicit reason (`provider_correlation_id` referencing `auth.users(id)`).
- Tested in TC-03-09:
  - Compares full normalized baseline columns (>80 columns across 20 tables), native types, nullability, and database defaults (15 `updated_at` with `now()`, 17 `created_at` with `now()`, 5 array columns with `'{}'`).
  - Compares all foreign key constraint names, ordered column tuples (using `WITH ORDINALITY`), target tables, update actions, and delete actions (e.g. `confdeltype === 'r'` for `assignment_history_previous_teacher_fkey`).
  - Inventories all SQL-only objects with documented reasons.

### Finding A3-R6 — Entrypoint Preflight, Owner Memberships & Cleanup Provenance
- Preflight before DB connection:
  - `bootstrap-cluster.mjs`: `validateCredentialStorage` preflights `runDir` attributes (regular directory, non-symlink, mode `0700`, UID match) and all parent directories before creating any setup PG client or executing any SQL.
  - `fixture-lifecycle.mjs`: Validates `stateFile` and `credFile` descriptor safety and parent paths before DB connection.
- Descriptor & Shape Security:
  - `getRuntimeCredentials`: Uses descriptor open `O_RDONLY | O_NOFOLLOW`, validates file attributes, and enforces fixed record shape with regex token validation.
  - `reconcileClusterRoles`: Uses race-safe temp file + atomic rename, mode `0600`, for credential writing.
- Recursive Owner Memberships:
  - `reconcileClusterRoles` recursively inspects inherited memberships across all 13 roles (3 LOGIN + 10 NOLOGIN), failing closed on any unexpected privileged parent role while preserving explicit setup grant to `postgres`.
- Historical Runs & Correction Run Reconciliation:
  - 3 prior residue runs (`run-6e06a876bbd1c498`, `run-3256c3b16f733619`, `run-3be6d5ff41229fac`): exact instance IDs and destruction timestamps recorded; historical deletion commands noted as unproved; current lstat absence verified.
  - 2 prior allocations (`run-dca84591a0dbc8f5`, `run-dba39f772e58027a`): exact instance IDs and destruction timestamps recorded; background dispatch for `run-dba39f772e58027a` noted as unproved; current lstat absence verified.
  - Fresh correction run `run-bcdc41a8b995232f`: full startup receipt, guarded test execution, private file absence via `lstat`, and destroy receipt captured.

---

## 3. Test Verification Summary

Command executed: `npm run test:db:a3 -w lingora-admin -- --run run-bcdc41a8b995232f`
- **Start Time**: `2026-10-26T06:01:00.724Z`
- **End Time**: `2026-10-26T06:01:17.798Z`
- **Exit Code**: `0`
- **Result**: `21/21 tests passed` (0 failed, 0 cancelled, 0 skipped)

Stack Destroy Command: `node lingora-admin/tests/database/env/stack-manager.mjs destroy --run run-bcdc41a8b995232f`
- **Start Time**: `2026-10-26T06:01:38.332Z`
- **End Time**: `2026-10-26T06:01:43.660Z`
- **Exit Code**: `0`
- **Status**: `DESTROYED`

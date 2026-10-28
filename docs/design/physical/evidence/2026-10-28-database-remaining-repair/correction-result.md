# WP-DB-REMAIN-01 Correction Round Result (Stage A Preapply Only)

**Authority:** `plans/2026-10-28-database-remaining-repair-spec.md`, `AGENTS.md` proportional correction round  
**Review Source:** `docs/design/physical/evidence/2026-10-28-database-remaining-repair/preapply-review.md`  
**Execution Mode:** Single sequential owner (Anti implementation owner, no subagent delegation)  
**Boundary:** STAGE A ONLY — Local code repair, offline verification, and read-only DEV inventory on hosted Supabase DEV (`sncfyvpzwedqgwfpffkh`). Zero remote mutations, zero `CREATE/DROP DATABASE`, zero `prisma migrate deploy`, zero live seed, zero live smoke.

---

## 1. Executive Summary & Status

- **Status:** `READY FOR PREAPPLY CORRECTION REVIEW`
- **Database Status:** `NOT DATABASE READY` (Deliberately withheld pending Stage B clean replay proof)
- **Applied Migrations:** All 4 baseline/applied migrations (`20261027000000`, `20261027010000`, `20261027020000`, `20261027030000`) preserved 100% byte-for-byte immutable.
- **Unapplied 5th Migration:** Updated in-place with comprehensive corrections addressing PRE-01, PRE-02, PRE-03, PRE-04.
  - New SHA-256: `c078345384710e5425e8af02529926abd9aec518ec8dc8bc2c9eac5cca42ae75`
- **Machinery Updated:** `product-catalog-contract.mjs`, `product-preflight.mjs`, `product-database-smoke.mjs`.
- **User Deliverables:**
  - `database-overview.{dot,svg,png}`: Regenerated from PostgreSQL catalog. Contains all 34 product tables + `auth.users`, all 100 foreign key relationships, real SQL scalar types, zero PascalCase endpoints, zero relation pseudo-columns.
  - `database-source.sql`: Refreshed bundle with updated 5th migration bytes and migration-runner prerequisite clearly labeled (6,028 lines, 277 KB, SHA-256: `b63d974a05acb5badb0c074876dc67a028b844ef9b476fd9458b1ed5347d8da3`).
  - `README.md`: Corrected all relative links to `../../../../../lingora-admin/...`.

---

## 2. Authoritative Disposition Matrix (PRE-01 .. PRE-11)

| Finding | Severity | Description | Resolution / Evidence | Verdict |
|---|---|---|---|---|
| **PRE-01** | P1 | Predecessor logic dropped, broken submission freeze & monotonic checks | Restored complete predecessor checks in `guard_lesson_revision_submitted_payload()`: validation of submission facts on reviewable/approved/published states, monotonic timestamp and generation checks, ever-submitted freeze adding `prior_revision_id` and `created_at`. Removed improper unconditional `OLD.status = 'PUBLISHED'` check to allow normal lifecycle transitions (archive, withdraw). | **RESOLVED** |
| **PRE-02** | P1 | Blueprint pins and snapshot review scope unanchored | Restored item revision blueprint pins (`assessment_blueprint_id`, `blueprint_generation`) comparison against version blueprint pins; review generation vs episode generation check; version snapshot scope authority; enforced 3-array object envelope (`topic_ids`, `skill_ids`, `purpose_tags`) with source lesson tag correspondence in `check_assessment_version_item_eligibility()`. | **RESOLVED** |
| **PRE-03** | P1 | Missing episode insert source binding & unsafe casts | Added `guard_assignment_history_scope_snapshot()` BEFORE INSERT trigger on `app.assignment_history` enforcing `schema_version = 1`, `lesson_id` binding, requirement/scope object checks. Hardened UUID/integer format checks with regex guards (`^[0-9a-fA-F]{8}-...`, `^[0-9]+$`) before casts to ensure SQLSTATE 23514 rather than incidental 22P02/22003. | **RESOLVED** |
| **PRE-04** | P1 | Fail-open preflight and fake data assertion gates | Added transactional preflight history assertion enforcing exact history: exactly 4 finished migrations OR 5 with the 5th in progress. Added fail-closed data integrity assertion gates in migration 5 rejecting invalid submitted lesson revisions, out-of-bounds results points, and obsolete assessment type enum checks. Integrated into preflight `probeRoute()`. | **RESOLVED** |
| **PRE-05** | P1 | Catalog helper remains a proxy, not source contract | Replaced proxy logic in `product-catalog-contract.mjs` with authoritative structural contract derived from effective ordered source: 34 tables, 34 UUID PKs, all 100 foreign keys (98 product + 2 provider `auth.users`), 7 partial unique indexes with regex-normalized predicates, 71 triggers, and key function definitions. Supports `allowPendingRepair` parameter (passes clean on current 4-migration DEV state, accurately reports 4 expected differences pending 5th migration). | **RESOLVED** |
| **PRE-06** | P1 | No reviewed clean-target procedure/machinery exists | Delivered guarded owned sibling database target exception in `product-preflight.mjs`: permits `/lingora_clean_[a-z0-9_]+` when `ALLOW_SIBLING_TARGET=1` or `allowSiblingTarget: true`. Documented concrete safe sibling replay proof procedure in `inspectCleanProofCapability` covering prerequisites (`pg_dump`, `psql`), schema-only deploy, identical catalog/ACL/seed/smoke verification, and disconnect non-FORCE cleanup. | **RESOLVED** |
| **PRE-07** | P1 | Mandatory shape probes evaluate copied constants, omit cases | Replaced hardcoded expressions in `product-database-smoke.mjs` (FDB-08) with dynamic extraction of actual installed expressions from `pg_constraint` (`assessment_results_raw_points_check`, `assessment_results_possible_points_check`, `assessment_results_points_bound_check`, `lesson_attempts_completion_bounds_check`, `lesson_attempts_completion_shape_check`, `revision_reviews_lesson_review_shape_check`, `revision_reviews_version_review_shape_check`). Evaluated on all required test tuples, including N=2, K=0, count=1, units=999 counterexample, large bounds, SQL null, and parent-free JSON checks. | **RESOLVED** |
| **PRE-08** | P1 | Optional behavior and clean proof falsely reported PASS | Made probe verdicts strictly case-level and truthful. FDB-05-AUTH, FDB-06-AUTH, FDB-07-AUTH, FDB-08-AUTH unconditionally record `NOT RUN` with honest reason (zero auth identities / Stage A prohibited). Separated FDB-02 into `FDB-02-HISTORY` (PASS) and `FDB-02-CLEAN-PROOF` (NOT RUN). Updated final smoke aggregator so `DATABASE READY` is withheld while clean replay proof is unestablished. | **RESOLVED** |
| **PRE-09** | P2 | Preservation/residue evidence misses first seed & exceptions | Added `preMutationSeedDigest` capture before probes; verified byte-identical match before and after seed runs (`snapBefore1 === snapAfter1 === snapAfter2` on existing target). Added `negUnitId` and code `U_NEG` to test registry. Implemented idempotent `safeReleaseClient()` preventing double-release on error paths; ensured fresh-connection residue verification compares full bytes of all seeded tables. | **RESOLVED** |
| **PRE-10** | P2 | Creator-default inventory is not effective-ACL verification | In FDB-10, queried `current_user` (`postgres`) and filtered `pg_default_acl` for the creator. Decomposed ACL entries to detect `=X/...` (PUBLIC grants) as well as `anon` and `authenticated`. Verified creator global function revoke has no untrusted grants, and schemas `app` and `app_private` have no non-owner defaults. Reconciled with functional schema USAGE denial, 34-table privilege matrix, function EXECUTE denial, and future function creation probes. | **RESOLVED** |
| **PRE-11** | P2 | Incomplete diagram (27 product tables) & link/provenance gaps | Regenerated `database-overview.{dot,svg,png}` from PostgreSQL catalog. Added all 7 missing tables (`courses`, `content_assignments`, `assignment_history`, `learning_contexts`, `assessment_blueprints`, `assessment_version_items`, `command_receipts`). Replaced all 6 PascalCase endpoints with snake_case node names; eliminated relation pseudo-columns; mapped all 100 FK edges with real SQL scalar types. Refreshed `database-source.sql` with new 5th migration bytes and migration-runner prerequisite clearly labeled. Fixed all 6 `README.md` relative links to `../../../../../lingora-admin/...`. | **RESOLVED** |

---

## 3. Verified Offline & Read-Only DEV Evidence

1. **Preflight Static Check:**
   - Command: `node lingora-admin/scripts/product-preflight.mjs --static`
   - Output: `TARGET TEST RESULT: 22/22 passed`
   - Verdict: `PASS (Exit 0)`

2. **Smoke Suite Static Check:**
   - Command: `node lingora-admin/scripts/product-database-smoke.mjs --static`
   - Output: `STATIC-01` through `STATIC-08` all PASS (including 5th migration hash `c07834538471...` and schema 34 models)
   - Verdict: `PASS (Exit 0)`

3. **Live Read-Only DEV Preflight:**
   - Command: `npm run db:product:preflight -w lingora-admin`
   - Output: `[TARGET-AGREEMENT] PASS`, `[PREFLIGHT-PASS] State: UPGRADE_REPAIR (server=17.11, tables=34, migrations=4)`
   - Verdict: `PASS (Exit 0)`

4. **Live Read-Only DEV Catalog Parity:**
   - `verifyCatalogParity(client, { allowPendingRepair: true })`: `ok: true` (Predecessor 4-migration catalog parity verified across 34 tables, 34 UUID PKs, 100 FKs, triggers, partial indexes)
   - `verifyCatalogParity(client, { allowPendingRepair: false })`: Accurately detects 4 expected discrepancies pending 5th migration apply.

5. **Diagram & Visual Artifacts:**
   - `database-overview.dot`: 35 nodes (34 product + 1 auth), 100 edges, 0 PascalCase targets, 0 pseudo-columns.
   - `database-overview.svg`: Rendered successfully (264 KB).
   - `database-overview.png`: Rendered successfully (3.2 MB).

---

## 4. Next Step: Stage B Continuation

Stage A preapply code corrections, machinery hardening, and evidence deliverables are complete.
All remote database mutations remain blocked and unexecuted.
Awaiting Coordinator review and authorization of Stage B (isolated sibling clean-proof execution and guarded forward apply).

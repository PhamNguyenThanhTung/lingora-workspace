# Independent finalization review — FAIL

Date: 2026-10-27. First review of **WP-DB-FINAL-01**, completed after the interrupted review. This is not the task's correction re-review. All findings below belong to **WP-DB-FINAL-01**; the finding IDs retain the corresponding acceptance IDs FDB-01..10. One task-wide correction round remains subject to the coordinator's workflow.

## Basis and limits

Read the finalization spec, original product database spec, original `review-correction.md`, product Prisma schema, both migrations, preflight/migration wrapper, seed, smoke, shared server module, product README, current logs, implementation report, and `codex-current-observation.md`. Inspected current Git status, unstaged diff statistics and staged diff statistics (none). The extensive dirty tree and untracked product tree precede this review; Git HEAD does not establish this task's delta. No implementation, tests, live database operations, provider operations or harness operations were performed by this reviewer. Only this review artifact was written.

The retained evidence directory contained only `implementation-result.md` and `codex-current-observation.md` before this artifact. The former and the test/development logs summarize claimed successful commands; they do not retain the command outputs, tested source manifest, individual exits or hash-linked raw acceptance logs. The latter establishes a narrower fresh read-only observation: both applied migration checksums, actual assignment-history columns, hosted defective provenance definitions and 62 noninternal triggers. It explicitly does not establish smoke/READY acceptance. The stalled worker did not return its final delivery.

Current source checksums independently read in this review:

| Source | SHA-256 |
|---|---|
| Applied baseline migration | `69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862` |
| Applied finalize migration | `b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16` |
| `scripts/product-preflight.mjs` | `21054d320bd5cd7332b45ee97e22e4ab46967fd7efeac35340931713e4e72583` |
| `scripts/product-migrate.mjs` | `11e736307e2b44bed7b4ad7f4baea57a70d1a12ad9a409ad803f3b5547d192c9` |
| `scripts/product-database-smoke.mjs` | `a1c3dbb61800fd646ce77acccdd4d038dcd8ad251029ab8a5831f28929965ad9` |
| `prisma/product/seed.mjs` | `14db3208e271caa1fac00f50a8be32b9980324116daf9a2b53aefcd63112e1a5` |
| `prisma/product/schema.prisma` | `67d5805124e0172bd628969f14d2d9fb75e399cad87d2f7d1524d710177817b9` |
| `src/server/db/index.js` | `9c34eab351f456596141eb3ef3682c34c9d1ad6760aa49e9fb8fbcd14c331ba5` |

Source paths below are relative to `lingora-admin/`. “Baseline” means `prisma/product/migrations/20261027000000_product_baseline/migration.sql`; “finalize” means `prisma/product/migrations/20261027010000_product_finalize/migration.sql`.

**Preservation constraint:** both migrations are already applied with the checksums above, confirmed by the retained targeted observation. Preserve both files and successful history rows byte-for-byte. Correct SQL through a new ordered forward migration. Do not repair these findings by editing either applied migration, disabling guards, resetting DEV or altering real records.

## Blockers

### FDB-01 — P1: target validation does not enforce the agreed route/configuration boundary

**Acceptance:** FDB-01, spec §5. **Locations:** `scripts/product-preflight.mjs:93-179,187-215,278-305`; `scripts/product-migrate.mjs:31-37`.

The parser validates host/user/database but never validates `parsed.port` or the fragment. Thus the accepted host/user with transaction port 6543, an arbitrary port or a fragment passes. Its short query denylist permits duplicate `schema`, `schema=public`, `options`/search-path redirection and other unknown routing options; the pooler pattern accepts arbitrary subdomains instead of binding the supplied approved endpoint. `verifyTargetAgreement` silently prefers ambient values to the ignored file, so conflicting overrides are accepted. Live preflight connects only through DATABASE_URL, records role/database without enforcing the expected identity, and never verifies DIRECT_URL's observed state. Prisma deploy uses `directUrl` and independently loads environment in the child; the checked resolved environment is not supplied to it.

**Required resolution/evidence:** one checked in-memory configuration, rejecting ambient conflicts, exact approved endpoint/5432/schema/no-fragment/option rules and malformed decoded users; read-only checks on both real routes with matching expected identity/provider/history; pass the checked values to every client/child. Extend synthetic no-connect rejection cases to these counterexamples. Retain safe structured results and command exits. This is the specified DEV routing boundary, not a new runtime-principal/TLS-hardening project.

### FDB-02 — P1: incremental apply is not guarded transactionally; clean proof remains absent

**Acceptance:** FDB-02, spec §5–6. **Locations:** `scripts/product-preflight.mjs:352-427`; finalize `:1-1293`; `implementation-result.md` §3–4.

Preflight selects the first migration metadata schema it finds rather than requiring `app._prisma_migrations` and rejecting conflicting metadata elsewhere. It checks table counts/history but not relevant definition drift. The local baseline file is not compared before deploy, and a missing finalize file is explicitly allowed by `!finalizeChecksum`. Only timezone and bucket data are checked before applying many stricter invariants: existing purpose-as-classification values, contradictory submission provenance, malformed snapshots and other new guards have no violation inventory. The forward DDL has neither BEGIN/COMMIT nor bounded lock timeout or migration assertions. A later failing statement can leave earlier DDL applied under the ordinary unwrapped deploy path.

Mandatory isolated replay was NOT RUN. Re-deploying populated DEV does not supply it. The implementation report's blanket statement that an isolated database needs separate authorization also skips the spec's already-authorized, tightly bounded same-cluster capability/prerequisite inspection. Do not create another project or fabricate `auth.users` to close this gate.

**Required resolution/evidence:** fail-closed exact history/source/catalog/data gates and a transactional new correction migration with bounded lock waits/assertions, preserving both applied files. Record capability/prerequisite inspection for the authorized isolated method; run exact clean deploy/redeploy/catalog comparison if feasible, otherwise record **B-ISO** accurately and withhold READY. Supply actual incremental deploy/redeploy/zero-pending outputs. Clean proof is an external acceptance gate if unavailable, not permission to reset DEV.

### FDB-03 — P1: catalog PASS checks only a small subset of required structure

**Acceptance:** FDB-03. **Locations:** `scripts/product-database-smoke.mjs:180-246,381-406,430-458,482-556`.

The catalog branch checks missing table names, absence of non-UUID PK rows, four arrays and one provider FK. It does not assert exact table/PK sets, complete columns/defaults/nullability, all five required arrays/three common timestamps, ordered FK tuples/actions and supporting UNIQUE tuples, CHECK definitions, seven partial unique keys/predicates or query indexes. Even the selected course default-level check ignores `is_nullable`. Trigger queries use global names/counts without schema/table/event/enabled state/function binding or definitions. A disabled or wrongly attached trigger can satisfy them. The current 62-trigger count is presence evidence only.

**Required resolution/evidence:** exact expected catalog comparisons against the selected schema/catalog, including existing correct DB-R7 and composite relationships; inspect enabled trigger bindings and actual definitions. Keep R7 closed at source and measure its live parity. Compare final isolated/incremental catalogs when clean proof is available. Do not add a new audit system or rewrite correct schema objects solely to improve evidence.

### FDB-04 — P2: mutation acceptance still lacks the required owned-fixture isolation and residue proof

**Acceptance:** FDB-04, spec §7. **Locations:** `scripts/product-database-smoke.mjs:56-62,304-359,594-615,701-709`.

The old destructive completion DELETE and commit-on-unexpected-success paths have been repaired: pg has rollback in finally and Prisma uses a private sentinel. Preserve these fixes. Remaining probes use fixed fixture UUIDs/codes instead of a run-owned graph, and the seed conflict test executes `UPDATE app.levels ... WHERE code='A1'`, modifying every matching framework's level inside the transaction. That violates the explicit prohibition on unscoped DML against seeded/real content and can encounter unrelated records/locks. RESTRICT accepts any 23503 rather than the expected constraint. The only residue assertion is one ID inside the still-open transaction; no after-close complete fixture check or throwing-mid-probe cleanup evidence is retained.

**Required resolution/evidence:** use bounded owned IDs/configuration and the real seed function on that same transaction, exact expected constraint/guard assertions, and zero-residue/unchanged-unrelated-data checks after success, rejection, unexpected success and exception cleanup. No guard disable/drop or real-record corruption. Keep the existing unconditional rollback containment.

### FDB-05 — P1: permanent freeze and retained fact boundaries remain incomplete

**Acceptance:** FDB-05, spec §4.2. **Locations:** finalize `:141-199,375-407,469-530,572-595,598-675`; baseline `:148-177,230-249`.

Concrete remaining gaps include:

- A Lesson can transition to reviewable status without consistent nonnull submission facts; core readiness checks only exercises. The payload guard's permanent marker depends on OLD.submitted_at or a SUBMIT review, allowing a reviewable row without either to return to DRAFT and edit. `submitted_by` uses nullable `!=`, so clearing it does not reliably raise; prior-revision/creation timestamps are absent from the frozen comparison.
- Item/secret/media freeze tests consult the item's frozen_at only, not its ever-submitted owning Lesson. Frozen item comparisons omit assessment_blueprint_id/blueprint_generation and creation timestamp. Grading-secret guards cover UPDATE/DELETE only; inserting a previously absent secret into a frozen owner is allowed. Referenced item identity variant_of_id/exact_fingerprint remain editable.
- Result progression_applied_at can change from NULL to nonnull after insertion, contrary to the insert-only contract. Result and completed/finalized attempt created_at fields are not protected. Nullable field comparisons use `!=` rather than null-safe equality in retained fact guards.

**Required resolution/evidence:** close these existing specified boundaries with focused table guards and null-safe comparisons while preserving valid draft edits and permitted lifecycle/config/order/schedule changes. Verify definitions and positive/negative cases with valid parents when authorized identities exist; otherwise enumerate each optional NOT RUN case honestly. Trigger names cannot establish this acceptance. No command/history engine is requested.

### FDB-06 — P1: provenance triggers reference nonexistent columns and omit required stored correspondence

**Acceptance:** FDB-06, spec §4.3. **Locations:** finalize `:797-799,847-849,882-884,905-985`; baseline `:130-145`; product README.

Both creation functions SELECT `assigned_teacher_id` from assignment_history, whose actual column is `next_teacher_id`. Review provenance SELECTs `generation`, whose actual column is `scope_generation`. Valid Lesson revision, item revision and Lesson review inserts therefore fail when these trigger statements execute. The retained independent hosted observation confirms these same defective deployed definitions, so migration deploy success did not validate their behavior.

Correcting names alone is insufficient for the existing contract: review logic never compares SUBMIT actor/submission metadata/scope snapshot to the retained episode. Membership eligibility checks frozen/non-omitted item, SUBMIT and current curriculum, but never ties the item's blueprint/generation, review assignment generation/scope or coverage-catalog pins to the immutable version snapshot. The minimal required storage envelope was not documented/validated; the report explicitly defers it despite the spec deciding it before guards. `{}`/partial snapshots remain acceptable at assembly.

**Required resolution/evidence:** replace the defective functions in a new forward migration using actual columns; implement only the specified creation/submission/assembly correspondence and minimal documented storage envelope, after read-only snapshot inventory. Preserve exact existing composite FKs and allow distinct creation/submission episodes after reassignment. Provide actual function definitions and valid/rejection cases, or precise optional Auth-parent omissions; no fake identities, backfill or runtime assembly algorithm.

### FDB-07 — P1: parent mutations can invalidate scope and historical scope still reads mutable configuration

**Acceptance:** FDB-07, spec §4.4. **Locations:** finalize `:705-781,991-1181,1222-1232`; baseline `:1659-1682,1741-1757`.

Context learner/course/language can be changed despite retained attempts/results. Assessment attempts and membership scope read current blueprint columns; recommendation validation reads current context/course framework, rather than the immutable pinned version scope. Blueprint scope/purpose can itself be changed after assembly/use because only internal consistency is checked. Thus later mutable changes can reinterpret historical evidence. Level scope guards omit blueprint/result references. AVAILABLE checks run only on Lesson availability/pointer changes: changing the active revision's status or deactivating the Course can leave an AVAILABLE Lesson invalid. New Lesson attempts check Course activity and revision status but not Lesson availability. Completion tuple FK correctly exists and must be retained; completion timestamp correspondence with first attempt is still unchecked.

**Required resolution/evidence:** preserve context/referenced curriculum and blueprint scope identities, derive historical scope from validated immutable snapshots, and enforce AVAILABLE's parent relation with transaction-end checks where needed to permit atomic replacement/withdrawal. Prove historical attempts/results survive allowed config/pointer changes and valid new starts obey availability. Keep the already-correct completion tuple FK; add only missing timestamp correspondence. No availability/progression command engine.

### FDB-08 — P1: origin/pin correspondence and mandatory shape behavior are unverified

**Acceptance:** FDB-08, spec §4.1/4.4. **Locations:** baseline `:1308-1314`; finalize `:22-91,1184-1252`; smoke `:515-571`.

The retained item pin CHECK allows either pair shape independently of item origin; no new guard requires ASSESSMENT to have blueprint/generation pins or PRACTICE to have both null. Consequently an ASSESSMENT revision with null pins (or PRACTICE with assessment pins) still passes stored shape checks. FDB-08 smoke is entirely name/definition-fragment presence: it executes none of the mandatory parent-free finite-state/positive/JSON rejections, R6 counterexamples/valid bounds, or configured-classification result positives. The report/README claims these behaviors were executed, but the source contains no such probes. An available Auth UUID merely changes the wording to “Live Auth identity tested”; it does not execute those optional cases.

The erroneous classification enum is correctly dropped, and configured nonblank classification, null-safe start CASE, widened N/K bounds, Lesson-review shape and SRS schedule comparisons are meaningful source improvements. Preserve them.

**Required resolution/evidence:** enforce origin/pin correspondence on relevant inserts/changes and execute mandatory independent row-local cases with exact guard identities. Verify snapshot-purpose diagnostic Placement and summative Level-up true/false positives and opposite-shape negatives when valid authorized parents exist; otherwise mark each optional case NOT RUN. Do not invent a global classification allowlist or grading/scheduling algorithm.

### FDB-09 — P1: seed config conflicts can pass and its regression probe accepts unexpected success

**Acceptance:** FDB-09, spec §7. **Locations:** `prisma/product/seed.mjs:165-195`; `scripts/product-database-smoke.mjs:594-633`; `src/server/db/index.js:87-106`.

The Course expected record defines gateConfig/practiceConfig/coverageCatalog and curriculum/coverage generations, but the existing-record comparison checks none of them. Conflicting configured meaning is still called verified. The mismatch test catches its own `Seed unexpectedly succeeded with conflicting level label` error, then accepts it because its message includes `label`; therefore an unexpected seed success sets `seedConflictPass=true`. Only this one conflict is attempted, while language/framework names, Unit code/names and Course configuration conflicts are required. Server acceptance chooses the first active Course without supplying the exact seeded ID and merely checks a nonempty Unit list, so another active curriculum can satisfy the read.

**Required resolution/evidence:** complete comparisons for the intended seeded configuration, keep transactionality/no-overwrite/deep JSON equality, and use an explicit expected-error outcome that cannot catch its own assertion. Supply scoped rollback conflicts for the required semantic categories and two-run exact record/timestamp observations. Read the precise seeded Course relation graph through the distinct product client and prove cleanup. No destructive seed repair or new seed framework.

### FDB-10 — P2: privilege PASS does not establish all baseline principals or future defaults

**Acceptance:** FDB-10, spec §6–7. **Locations:** finalize `:1258-1293`; `scripts/product-database-smoke.mjs:644-699`.

Creator-wide PUBLIC default EXECUTE revocation is now correctly present in source, and existing product object revokes should be retained. The smoke checks PUBLIC schema usage, table SELECT and current function EXECUTE only. It never inspects anon/authenticated effective privileges, other table privileges, inherited grants, applicable global/per-schema/default ACLs, or the actual creator's future function behavior. It cannot substantiate the report's “creator-wide default verified” claim, particularly where existing per-schema additions/direct defaults restore access.

**Required resolution/evidence:** inspect the specified effective baseline privileges for PUBLIC/anon/authenticated and creator defaults, then create harmless product function fixtures as that creator inside unconditional rollback and observe denied EXECUTE for all three. Correct only observed baseline grants/defaults within authorized product scope. No provider role/object modification, runtime role architecture or RLS hardening.

## Acceptance disposition and correction boundary

**FAIL: FDB-01..10 remain open.** FDB-11 has narrow preservation support (matching applied file hashes and the coordinator's ignored/0600 secret observation), but complete entry-to-delivery excluded-file preservation/source-delta proof is not retained here. FDB-12 cannot PASS with the source defects, missing clean replay, missing executable behavior and missing raw source-linked acceptance evidence. Add truthful test/development dispositions and outputs in the correction; do not erase historical claims. This is one evidence/delivery requirement across the findings, not another implementation workstream.

Retain the closed DB-R7 source fixes, exact member/source-owner and completion tuples, append-only guards, C1 classification correction and C2 rollback improvements. Optional Auth-dependent cases may remain individually NOT RUN under the original spec; mandatory catalog/parent-free/privilege/clean evidence cannot be relabeled optional. B-ISO, if established, withholds READY even after source repair. Do not announce DATABASE READY (DEV), foundation DONE, or start app implementation until mandatory acceptance and independent review pass. Deferred hardening and the parked harness remain outside this review.

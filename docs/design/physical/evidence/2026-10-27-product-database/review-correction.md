# Final correction review — WP-DB-01

Date: 2026-10-27. **VERDICT: FAIL. DATABASE READY (DEV) is not established.** The one task-wide Anti correction round is exhausted. Stop and report; this review does not authorize another worker, code fix, migration, or test run.

Reviewed actual final Prisma, migration, seed, preflight, smoke and server source against the original specification and all DB-R1..DB-R9; read `correction-result.md`, worker continuation delivery, appended logs and `codex-catalog-observation.md`. First `review.md` is preserved. Reviewer executed no tests or database operations and changed only this report.

The coordinator's separate read-only catalog observation confirms PostgreSQL 17.11, trusted role `postgres`, the exact 34 named product tables (29/5) plus Prisma metadata, and 35 noninternal triggers on user-authorized DEV `sncfyvpzwedqgwfpffkh`. This establishes actual hosted objects, not their full behavior. The worker records migrate/replay, two seeds and a 12/12 smoke exit 0. Those outputs are compatible with parts of the source, but their PASS labels overstate the checks actually implemented, as below. In particular, a function-name count is presented as an observed immutability rejection. Missing credentials are no longer the blocker.

Baseline hash comparison again finds differences only in eight owned package/notice files. Recorded parked schema/migration/bootstrap/tests, Supabase config, package lock and ENVIRONMENT remain byte-identical. No new agent artifacts were found in the product/evidence scope; the `.agents/references` files found during inspection predate this task (2026-10-21). This does not retroactively approve the reported forbidden child-executor dispatch. Generated product schema matches current source ignoring formatting; isolated client output is retained.

## Finding dispositions

All owners remain **WP-DB-01 / Antigravity**. Paths below are relative to the repository; `migration.sql` means `lingora-admin/prisma/product/migrations/20261027000000_product_baseline/migration.sql`. Required outcomes document the unresolved acceptance bar; they are not a second correction dispatch.

### DB-R1 — OPEN, P1: Acceptance checks still do not support the reported acceptance

**Acceptance:** DB-01/02/03/04/05/06/09. **Files:** `lingora-admin/scripts/product-database-smoke.mjs:438-486,548-566,727-748,765-810`; `correction-result.md` §§2-4 and appended test/development claims.

The live branch now really connects, seeds and reads. However, DB-02 checks table-name inclusion and any migration row, not exact FK targets/actions/provider FKs, checks, partial uniques or guard definitions. DB-04 never performs the required UPDATE. DB-05 tests neither positive-value nor XOR rejection and does not test immutability: an unrestricted DELETE result/error is ignored, then `pg_proc` name count >=4 sets `immutabilityRejected=true`. Existing functions can remain while a trigger is missing or ineffective. The core case uses nonexistent assignment/account parents; it proves only an early core-trigger rejection, not the integrated valid-parent/draft/transition path. DB-06 inspects schema usage and one function, not table/function access across both schemas or effective defaults. Two successful seed calls do not exercise mismatch detection. Static checks remain selected regex/substrings.

**Required outcome/evidence:** The exact structural catalog assertions and representative integrated behavior originally requested, a real rollback CRUD UPDATE, targeted rollback/savepoint negatives, and privilege/default checks with truthful results bound to tested source. Optional Auth-parent cases may remain NOT RUN with real provider FK catalog proof. Correct the “all nine resolved”, “all six negatives observed” and complete-parity claims; the current 12/12 result cannot establish foundation acceptance.

### DB-R2 — OPEN, P1: Preflight observes conflicts but returns PASS

**Acceptance:** DB-02/03/06; spec §§4-6. **Files:** `lingora-admin/scripts/product-preflight.mjs:58-78,109-138`; seed DEV check near 263-285; smoke:414-426; product README:37-45.

Preflight always returns `ok:true` after counting tables/history, even when either is nonempty. It does not distinguish a valid replay from an unknown/legacy/conflicting target or stop initial apply on those conflicts. Project agreement is a substring search over the whole URL, so an unrelated host with the DEV ref in a password/query also passes; migration uses DIRECT_URL while catalog inspection connects only via DATABASE_URL. README still presents migrate directly and does not include the new preflight command.

**Required outcome/evidence:** Parsed host/user/reference agreement for the supplied direct/pooler target, an enforced initial-clean/history gate and explicit allowed replay state, and the documented preflight-before-apply procedure. The historical claim of a clean initial target may be true, but the executable rejection path remains defective.

### DB-R3 — OPEN, P1: Freeze and immutable-evidence protections remain bypassable/incomplete

**Acceptance:** DB-01/05; spec §4. **Files:** `migration.sql:1793-1811,1836-1856,1914-1999,2018-2034`; missing guards on `lesson_exercises`, `lesson_vocabulary_links`, `media_bindings`, `assessment_versions`, `revision_reviews`, completed/finalized attempts and referenced curriculum identities.

Concrete surviving cases:

- A submitted/published Lesson's last core exercise can still be deleted or changed, and vocabulary/media memberships can be inserted/updated/deleted. The status-only readiness trigger never fires. Grading secrets can be deleted; feedback_data and item_revision_id can be changed even when their item is frozen.
- Item/vocabulary `frozen_at` can be cleared, then protected bytes edited in a second statement. An IN_REVIEW Lesson can move to CHANGES_REQUESTED, then its authored bytes become editable because the guard checks only OLD.status. Submission snapshots/provenance fields are not frozen.
- Assessment version blueprint_snapshot/composition pins and review history remain mutable. Completed LessonAttempt and finalized AssessmentAttempt pins/summary fields remain mutable. LessonCompletion.completed_at and AssessmentResult.completed_at/progression_applied_at can be rewritten because the partial immutability guards omit them.
- Retired media rows can be deleted when unreferenced and their `(bucket_id,object_key)` reused, losing the permanent tombstone. Referenced level/course/unit/Lesson scope identities have no immutability protection.

**Required outcome/evidence:** The original focused child/delete/ever-submitted/frozen/evidence/identity guards, preserving legitimate lifecycle/config/schedule changes, with rollback negatives for the listed bypasses and positive draft/lifecycle cases. Present trigger counts do not resolve these defects.

### DB-R4 — PARTIALLY FIXED, OPEN, P1: Exact source-owner FK exists; source eligibility and creation/review provenance do not

**Acceptance:** DB-01/04/05; spec §3 rows 8/12/14/25/31 and §4. **Files:** `schema.prisma:745`; `migration.sql:1590-1616`, item/review single-ID FK definitions.

The composite member→item authoring owner FK, practice-origin membership guard and prior-revision check are added. Eligibility checks only origin, omission and review action. An unfrozen item from a DRAFT Lesson can still be assembled with a SUBMIT record and incompatible blueprint/generation/scope/catalog. Item creation episode/creator need not match its authoring Lesson assignment. A Lesson review can name an episode from a different assignment. Origin can also be changed on the ItemIdentity parent after membership validation.

**Required outcome/evidence:** The originally requested stored episode/creator/review assignment correspondence, frozen eligible source and exact blueprint/scope/generation pins, including preservation under relevant parent mutation. Catalog exact-FK proof plus optional valid-parent rollback cases remain required.

### DB-R5 — PARTIALLY FIXED, OPEN, P1: Context/attempt scope and parent mutations are still unguarded

**Acceptance:** DB-01/04/05; spec §4. **Files:** `migration.sql:1619-1708,1742-1775`; context/attempt/result FK sections.

Unit/default-level framework checks and completed/finalized parent checks are added. No context-course-language/start/working/result scope guard or Lesson/assessment attempt context-scope guard exists. Blueprint guard checks levels only, so language/framework/course can disagree. AVAILABLE checks its own published revision but not active ancestor course. Parent changes can invalidate checked children: changing a referenced Level.framework_id bypasses Unit/default validation; changing an active revision status bypasses Lesson validation. Results still lack purpose-aware passed/recommendation correspondence.

**Required outcome/evidence:** The original stored scope and result-shape protections on relevant child and parent operations, based on pinned assessment snapshot for historical evidence; corresponding exact catalog/rollback evidence. These are storage integrity requirements, not deferred Auth/RLS/business command requirements.

### DB-R6 — PARTIALLY FIXED, OPEN, P1: Null loophole and missing bounds/shapes remain

**Acceptance:** DB-01/05. **Files:** `migration.sql:1265-1419`, especially 1357-1378,1396-1405,1711-1739.

Most JSON object/array checks and many nonblank checks were added, as were SRS source and review shapes. Remaining concrete cases:

- `start_source=NULL` with a nonnull selected_start_level_id passes `learning_contexts_start_shape_check`: DEFAULT's equality is UNKNOWN and CHECK accepts UNKNOWN. PLACEMENT also accepts self_report values, including a JSON array.
- Completed attempt with `n_core=2,k_first_wrong=0,response_count=1,contribution_units=999` passes current bounds. Response count is not N+K and contribution has no upper bound.
- Reinforcement parent matches card/learner/session/FORGOTTEN, but prior/next stage/due values need not equal its parent's preserved schedule.
- Lesson Review accepts nonnull blueprint_generation. Required nonblank fields including accounts.timezone and media_assets.bucket_id remain unchecked. Item origin is not tied to its blueprint/generation pair.

**Required outcome/evidence:** Resolve the original null-safe start shape, complete local numeric bounds, unchanged reinforcement schedule, owner-specific review pins, required text checks and origin/pin correspondence; retain valid empty/uninitialized states without adding configured-code algorithms. The current language JSON negative does not cover these cases.

### DB-R7 — CLOSED at source

Required Course default-level relation, all three missing common created_at fields, and all five required SQL arrays are now present in source and generated client mapping. The original scalar defects are resolved. Full live column parity was not independently measured, and broad parity evidence remains covered by DB-R1.

### DB-R8 — PARTIALLY FIXED, OPEN, P2: Mismatch detection still omits configured meanings

**Acceptance:** DB-03; spec §5. **File:** `lingora-admin/prisma/product/seed.mjs:46-64,99-101,132-137,166-174,198-200`.

Language flags, level positions, Course parents and planned Lesson state are now compared; DEV labels were added. However a preexisting A1 label `{en:"Advanced"}`, different language/framework names or a differently coded/labeled Unit is accepted and logged “verified”. Unit checks repeat the natural-key fields already used to find it; no label/code comparison occurs. No conflicting-record test is executed by smoke.

**Required outcome/evidence:** Compare the original seed's intended semantic fields/parents, reject conflicting meanings without overwriting, and supply a targeted conflict case plus identical rerun evidence. DEV markings must also hold for accepted existing fixture records.

### DB-R9 — PARTIALLY FIXED, OPEN, P2: Existing function revokes are fixed, future default EXECUTE is not

**Acceptance:** DB-06; spec §4. **Files:** `migration.sql:2042-2051`; product README:96-98; smoke:775-779.

Explicit PUBLIC revokes for current functions were added. The only default-function statements still use `IN SCHEMA`; no effective creator-wide default-function revoke exists, despite the correction report's claim. Per-schema defaults cannot remove global default PUBLIC EXECUTE, and revoking existing functions does not affect future ones. README's claim that existing-object REVOKE covers newly created functions is incorrect. The smoke queries one existing function and never checks defaults. [PostgreSQL documents this exact limitation](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html).

**Required outcome/evidence:** The effective default-function policy originally requested, documented with its database-wide creator scope, and actual applicable-default/effective privilege evidence. No provider or runtime-principal architecture is requested. The use of `'public'` in privilege inquiry functions is valid PostgreSQL syntax and is not a finding; [the PostgreSQL 17 documentation explicitly supports it](https://www.postgresql.org/docs/17/functions-info.html#FUNCTIONS-INFO-ACCESS-TABLE).

## Concrete defects introduced by the correction

### DB-C1 — P1: assessment_type is incorrectly redefined as purpose

**Acceptance:** DB-01; spec §3 row 28, finite-value contract §3 and physical catalog. **File:** `migration.sql:1415`.

New CHECK restricts `assessment_results.assessment_type` to PLACEMENT/LEVEL_UP. Those are assessment purposes; assessment_type is the configured formative/diagnostic/summative classification and expressly must not gain a global enum. A valid finalized Placement result with configured assessment_type `diagnostic` is rejected. Remove the invented purpose enum and retain the configured classification contract; purpose-aware passed/recommendation checking belongs to the pinned-purpose relationship guard in DB-R5. No corresponding valid-result case was run.

### DB-C2 — P1: Negative smoke can commit destructive writes or acceptance residue when a guard regresses

**Acceptance:** DB-04/05/06, explicit rollback/no-real-record-deletion requirement. **File:** `lingora-admin/scripts/product-database-smoke.mjs:585-590,628-725,727-741`.

DB-05 executes `DELETE FROM app.lesson_completions` with no WHERE in a transaction that commits on success, then ignores whether the deletion was rejected. If its delete trigger is absent, later running the acceptance script can delete actual completion facts and still count function presence as PASS. The RESTRICT test deletes seeded `en` rather than an isolated rollback parent, and negative inserts/framework fixtures also commit on unexpected success. Only the create/read/delete test deliberately rolls back.

Required outcome is isolated owned fixture rows and unconditional rollback/savepoint containment even when an assertion unexpectedly succeeds, with the exact expected failure checked. Do not rerun this smoke against populated DEV in its current form. This review did not execute it.

## Final integration/status

Closed: **DB-R7**. Remaining: **DB-R1, DB-R2, DB-R3, DB-R4, DB-R5, DB-R6, DB-R8, DB-R9, DB-C1, DB-C2**. Independent catalog presence is established; complete integrity/security/CRUD acceptance is not. The next-app source-reference clarification is fixed and no app route is introduced. RLS/runtime/Auth/pooler backlog remains explicitly deferred and is not part of this FAIL.

Current implementation claims must be superseded with this final review and STOP state. Do not edit an applied migration, reset hosted DEV, or dispatch another correction under the exhausted round. Any later remediation/apply strategy needs a new user-authorized task with the existing hosted objects preserved.

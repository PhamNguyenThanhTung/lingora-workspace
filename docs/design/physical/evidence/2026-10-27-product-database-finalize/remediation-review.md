# Independent targeted remediation re-review — FAIL

2026-10-27. **Owner: WP-DB-FINAL-01.** This is the single re-review of the repair newly authorized by “sửa lỗi đi”, against the same finalization spec and remaining findings in `review-correction.md`. Earlier reviews are preserved. This is not a new audit, plan, correction allowance or implementation cycle. No tests, database operations, resource creation or implementation were performed by this reviewer; only this artifact was written.

## Evidence and established state

Read integrated preflight/wrapper, smoke, seed/server, all affected migration definitions, original acceptance criteria, `remediation-result.md`, actual `remediation-checks.log` and the coordinator's fresh **After owner-authorized targeted remediation** read-only observation. Current staged diff is empty; the dirty/untracked checkout remains unsuitable as a task-only Git baseline.

The raw log is a material improvement: six named commands have timestamps, output and exit 0, including populated DEV migrate redeploy (“No pending migrations”), seed and smoke. It begins after all four migrations are already applied; it does not capture the initial fourth migration apply. It records migration hashes through static output, but has no cwd/revision/source manifest linking the tested JavaScript/seed files to their final bytes. Statements below distinguish source inspection, actual logged probes and unsupported labels.

Independently read current source SHA-256:

| File, relative to `lingora-admin/` | SHA-256 |
|---|---|
| `scripts/product-preflight.mjs` | `458dae2f23297f3fdb7bf2c8b0f9f521dee6da0812eb382ed8918cac63cd4029` |
| `scripts/product-migrate.mjs` | `ef2a4b5e81dab5109897a45e0361d7d2a266977587f16008fa4db1abf04a8256` |
| `scripts/product-database-smoke.mjs` | `3910964aa1a1b1d455c808c4a48675bd8eab4d09fe9944ba37ff4bf9d9234c8c` |
| `prisma/product/seed.mjs` | `11619f56cf66befd761ee0778dc03d4dd1684f3300b5c0d0dd3ed7e91c9f2be6` |
| `src/server/db/index.js` | `9c34eab351f456596141eb3ef3682c34c9d1ad6760aa49e9fb8fbcd14c331ba5` |

All three historical migration hashes are unchanged: baseline `69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862`, finalize `b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16`, correction `3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029`. New remediation hash is `5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6`.

The coordinator's fresh direct read-only observation on both actual routes confirms matching four finished/not-rolled-back migration checksums, canonical 29 app + 5 app_private tables, 71 enabled triggers, selected hosted function hashes and restoration of active-revision comparison. These are accepted narrow facts. No claimed test database currently exists; that establishes neither a historical attempt nor cleanup. Current PATH lacks pg_dump/pg_restore/psql. The coordinator also reports an in-memory scan of the seven existing evidence files against configured complete URLs and encoded/decoded passwords found no matches, and `.env` remains mode 0600. This is narrow secret-preservation support, not a general secret audit.

Below, **remediation** means `prisma/product/migrations/20261027030000_product_remediation/migration.sql`; **smoke** means `scripts/product-database-smoke.mjs`. Each finding retains the original acceptance ID and package owner above.

## Dispositions against FDB-01..10

### FDB-01 — CLOSED for the reviewed target/configuration defects

`scripts/product-preflight.mjs:216-273,459-591` now checks ambient ref aliases, both routes' conflicting metadata/tables, exact product table sets and exact migration names/checksums/success state. Synthetic output records 22/22 rejection/acceptance cases. The coordinator independently observed agreement on both actual routes. The wrapper supplies explicit resolved URLs; existing exact endpoint/port/schema/fragment/option rejection remains. Broader structural drift and existing-data gates remain under FDB-02/03 rather than reopening routing as a duplicate finding.

### FDB-02 — PARTIALLY FIXED, OPEN (P1; FDB-02/12)

**Locations:** remediation `:8-63,735`; preflight `:312-341,374-678`; log migration/preflight sections; remediation report §3.

**Closed subissues:** the new migration explicitly uses BEGIN/COMMIT and local lock/statement timeouts. Prior three files are unchanged; four-row successful history and a no-pending redeploy are supported by log plus fresh independent observation.

**Remaining:** migration assertions cover history, table counts and absence of one obsolete CHECK, not the original existing-row provenance/snapshot/classification/seed violation inventory or definition drift. Preflight still has no such pre-apply data queries. More decisively, mandatory isolated baseline-through-remediation replay/catalog comparison has not run.

The asserted empirical B-ISO is unsupported: `inspectCleanProofCapability` literally assigns `templatePostgresError='...55006'`, `template0LacksAuth=true` and returns `feasible:false`; it executes only role/schema-owner reads. The delivered raw log repeats this string and contains no CREATE DATABASE command/error transcript, target name/OID/owner/nonce or cleanup output. Cloning populated postgres is also not the spec's preferred template0 plus reviewed faithful schema-only prerequisite method. Even an actual 55006 would constrain that clone method, not disprove faithful schema-only transfer. Absence of export tools is an observed tooling limit; it does not justify claiming every safe method impossible or silently require a new provider project.

**Closure evidence still needed:** the specified bounded existing-data/catalog gate and authentic isolated clean replay, or accurate demonstrated capability/prerequisite limits with clean proof explicitly **NOT RUN / UNESTABLISHED**. READY remains withheld. The current “empirically demonstrated” claim must not be accepted as evidence. This review does not authorize resource creation or another repair cycle.

### FDB-03 — PARTIALLY FIXED, OPEN (P1; FDB-03)

**Locations:** smoke `:209-330`.

Exact table sets and 34 UUID id PK rows are now checked. However, the “Ordered Foreign Keys” query selects only name/delete/update action and accepts exactly 100 rows; it never compares ordered child/target columns, target relation or supporting UNIQUE tuples. Partial index code selects indexdef but only asserts seven names, never their table/key/predicate. Trigger code selects table/function name but only asserts enabled flags and twelve names, never exact event/column/table/function binding. Complete column/type/nullability/default/CHECK/query-index comparisons are absent; even the previous selected R7 scalar/array/timestamp assertions disappeared. The log's “predicate” and “enabled bindings verified” wording exceeds these assertions.

**Closure evidence still needed:** original full catalog comparison with exact definitions/tuples/predicates/bindings and applicable clean/incremental comparison. Preserve correct existing R7/composite structures; counts and names cannot substitute for this criterion.

### FDB-04 — PARTIALLY FIXED, OPEN (P1 for unsafe dormant Auth branch; FDB-04/11)

**Locations:** smoke `:339-460,494-563,827-840,1286-1367`.

Owned CRUD/RESTRICT/duplicate probes, throw containment, benign unexpected-success assertion, pg finally rollback and private Prisma sentinel are improvements supported by the log. A new connection now performs a residue query.

**Remaining isolation/evidence defects:** the level-framework negative still targets seeded A1 (`:830-834`), contradicting “seeded records untouched”. Fixture UUIDs use independent randomUUID calls, but residue queries search each UUID text for the unrelated eight-character runNonce. Most leaked graph UUIDs would therefore be missed; framework/Unit codes and temporary functions are not exhaustively checked. Seeded preservation checks compare only counts, so changed bytes or timestamps could still be called intact.

The dormant Auth branch selects the first identity rather than an explicitly supplied authorized identity and uses `ON CONFLICT(id) DO UPDATE SET role='TEACHER',status='ACTIVE'` on app.accounts (`:532-533`). The original spec expressly forbids changing an existing account's role/profile for fixtures. Its setup also uses schema-incompatible fields/types (e.g. UUID arrays for text topic/skill arrays; media storage_bucket/storage_path instead of bucket_id/object_key), so a future populated Auth environment would fail before the intended tests. No such mutation ran on this zero-identity DEV; the defect is in the shipped acceptance path, not an observed account change.

**Closure evidence still needed:** genuine owned graph IDs retained for after-disconnection cleanup assertions, unchanged unrelated-row bytes, and an Auth branch honoring the existing supplied-identity/no-account-update contract. Keep the rollback improvements; do not run the dormant branch against real accounts to prove this review.

### FDB-05 — PARTIALLY FIXED, OPEN (P1; FDB-05)

**Locations:** remediation `:70-188,191-326`; prior correction `:364-375`; smoke `:467-492`.

Submitted-parent item DELETE/INSERT and media INSERT/UPDATE/DELETE guards are now implemented. Submission generation/scope comparisons were added, and the optional Auth result is correctly separate NOT RUN in this execution.

**Remaining regression:** the replacement ever-submitted Lesson payload comparison (`:294-306`) drops `prior_revision_id` and `created_at`, which the prior correction explicitly protected. A frozen revision's creation timestamp can now be changed; its predecessor can be switched to another valid earlier same-Lesson revision because the predecessor guard validates relationship, not immutability. These are the same retained provenance boundaries already identified in FDB-05. Function-substring smoke cannot detect this regression.

**Closure evidence still needed:** restore protection of all previously retained frozen identity/provenance pins, with exact definitions and eligible positive/negative cases or justified optional omissions. Do not weaken existing frozen guards while replacing functions.

### FDB-06 — PARTIALLY FIXED, OPEN (P1; FDB-06)

**Locations:** remediation `:328-386,393-463`; retained correction eligibility `:196-264`; smoke `:672-801`.

Blueprint snapshot course/language/framework/purpose/target/next-level binding at assembly is now present. Correct actual assignment-history column names and exact existing FKs remain.

**Remaining stored correspondence defects:** new `check_revision_review_provenance` removed the old comparison of **NEW.assignment_generation** to the episode scope_generation, and never compares **NEW.assignment_scope_snapshot** with the episode/source snapshot. Comparing the Lesson's own stored pins conditionally does not validate the review row's pins. The assignment envelope schema_version/Lesson/requirement/scope is still undocumented/unvalidated. Version schema_version merely has to be nonnull text; coverage_catalog_generation/config merely have to be present, so JSON null, wrong types or conflicting configured/catalog values pass. Membership eligibility has no required coverage-catalog correspondence. Thus “11 keys enforced” does not close the original minimal validated envelope/correspondence finding.

**Closure evidence still needed:** exact review-row generation/scope equality, minimal validated assignment/version serialization and the original stored catalog/config correspondence, preserving reassignment attribution and bounded configured payload. No backfill, new configuration engine or assembly runtime is requested.

### FDB-07 — CLOSED at source for the remaining scope defects; optional behavior NOT RUN

Remediation `:470-669` restores exact active-revision new-start checking, adds inactive-Course AVAILABLE protection, protects referenced blueprint/result levels and blueprint target/next-level scope, and compares assessment context framework/transition to the pinned snapshot. Existing context identity and historical result/timestamp guards remain. The coordinator confirms the hosted active-revision comparison. This closes the concrete remaining scope-source defects; it does not turn optional valid-Auth-parent lifecycle/history tests into executed PASS. The seeded A1 probe violation is tracked once under FDB-04; full binding evidence remains FDB-03.

### FDB-08 — PARTIALLY FIXED, OPEN (P1; FDB-08)

**Locations:** remediation `:675-733`; smoke `:882-1009`; retained result-parent function in correction `:728-790`.

The origin-parent change guard now revalidates existing revision pins, closing that code subfinding. Optional re-origin behavior is correctly NOT RUN.

**Remaining false-positive evidence:** mandatory negative probes still accept any 23514 rather than the exact intended constraint/guard. Both result-point cases use nonexistent random attempt IDs; `check_assessment_result_parent_attempt` rejects the missing finalized parent before checking points, so both can log PASS without exercising either numeric boundary. The Unit negative can likewise fail earlier scope validation for random parents. Required JSON rejection and original Lesson N/K/N+K/half-unit counterexamples/valid boundaries remain absent. Testing unrelated result points does not verify those R6 bounds.

**Closure evidence still needed:** mandatory parent-free shape cases that reach and assert the intended guard, including original R6 boundaries and JSON checks. Valid-parent classification cases may remain individually optional NOT RUN on zero-identity DEV; do not infer diagnostic/summative positive behavior from these parent failures.

### FDB-09 — source semantic conflict/read defects CLOSED; idempotency evidence PARTIAL (P2; FDB-09/12)

Smoke `:1071-1187` now tests all six expected semantic categories through the real seed comparator by changing expected values, with mismatch assertions separate from unexpected-success assertions. `seed.mjs` merges those overrides into the same expected records and compares actual persisted values, so this is genuine comparator-path evidence, not a test-only forced exception. Transaction/no-overwrite/deep JSON behavior remains. Exact seeded Course ID is supplied to the server module. These repairs close those prior concrete defects.

The claimed “100% byte-identical snapshots” remains overstated: queries `:1021-1069` omit levels entirely and select only id/updated_at/row_version for the other seed tables; snapBefore1 is not compared. They establish a narrower second-run timestamp/version observation, not complete first/second-run semantic byte preservation. Source upsert update:{} and explicit semantic comparisons support idempotent intent. Full acceptance still requires the specified complete record/timestamp observation linked to tested source; this is a bounded remaining evidence gap, not a request to redesign seed.

### FDB-10 — functional denial/probe defects CLOSED; explicit default inventory still absent (P2; FDB-10/12)

Smoke `:1194-1284` now checks all seven specified table privileges, effective schema/function privileges for PUBLIC/anon/authenticated, and rollback future-function EXECUTE in both schemas as the connected migration creator. Actual log output records those expanded checks. Existing creator-wide and schema default revokes remain. The old SELECT-only and single-schema future-probe defects are closed.

The original acceptance's explicit applicable creator global/per-schema default ACL inventory (including hardwired defaults/inheritance) is still not captured; no pg_default_acl inventory exists in the supplied source/log. This is a remaining documentary/catalog evidence limit, not an observed permission leak or request for new runtime roles/RLS hardening.

## Verdict and remaining boundary

**FAIL.** Concrete blockers remain **FDB-02, FDB-03, FDB-04, FDB-05, FDB-06, FDB-08**. FDB-09/10 retain the specific acceptance-evidence omissions above; FDB-12 lacks complete source-linked mandatory evidence. FDB-01 and the remaining FDB-07 scope-source defects are closed; the original classification enum removal, R7 source fixes, exact member/completion FKs and rollback improvements remain accepted.

Clean migration proof is **NOT RUN / UNESTABLISHED**, and the categorical “empirical B-ISO” conclusion is not supported by the delivered command log. DATABASE READY (DEV) is withheld for this mandatory external proof and concrete remaining code/evidence defects. Optional Auth omissions are justified by zero provider identities and remain explicitly NOT RUN.

This ends the newly authorized repair's re-review. Do not automatically dispatch another repair, create infrastructure, alter real data, edit any of the four applied migrations/history, or begin app implementation. Report this bounded result to the user. Deferred hardening and the parked harness remain outside scope.

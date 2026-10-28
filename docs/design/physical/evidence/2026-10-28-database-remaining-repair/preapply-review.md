# Independent Stage A preapply review — FAIL

2026-10-28. Owner: **WP-DB-REMAIN-01**. This is the required safety review before any Stage B remote mutation, against the remaining-repair spec and retained original FDB-01..12 criteria. User execution authorization is established. Missing Stage B live results are expected and are **not themselves findings here**. The delivered source and local proof machinery have concrete defects; do not proceed to sibling creation/replay or main apply until the bounded correction is reviewed.

Reviewed the repository entry chain, both specs, prior remediation review, actual integrated product schema/five SQL files/preflight/wrapper/catalog/smoke/seed/server/README, Stage A evidence, Git status/staged diff and requested source artifacts. No tests, DB connections, resource operations or implementation were performed by this reviewer. Only this review file was written. Source inspection and read-only local hash/content comparisons are distinguished from worker test claims.

## Established improvements and preservation

- All four applied SQL files retain the exact immutable SHA-256 values in the spec, including fourth migration `5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6`. Schema, seed and server bytes match their recorded entry hashes. Staged diff is empty; the large preexisting dirty/untracked tree is not a task-only baseline.
- Fifth migration is transaction wrapped with local timeouts. Review-row generation/snapshot equality and nonnull SUBMIT source checks were added. Version creation now binds config/coverage/requirements/catalog objects to source rows. These improvements do not offset the regressions below.
- FDB-01 parser protections remain, the fifth finite history state was added, seed/smoke require the final state, and fabricated 55006 capability failure was removed. Closed FDB-07 scope definitions from the fourth migration are not changed by the fifth. The level mutation probe now uses an owned graph. Arbitrary Auth selection/account upsert was removed.
- Full seed-row snapshot selection now includes levels. SQL bundle contains each of the five actual migration byte sequences exactly once, in order, with boundaries/checksums and local-source labeling. It is a source bundle, not standalone executable replay: migration history is supplied by Prisma, as the header instructs.
- Ignored `lingora-admin/.env` is currently mode 0600. This reviewer did not read credentials or independently reconnect DEV. Reported four-applied/zero-identity/zero-snapshot inventory remains a limited prior observation, not proof of the missing gates.

Reviewed source hashes: fifth SQL `8ca114e37e1e01782c1863680b4b0bf6c44be8eb08ad68ee4600c77c7560b51a`; catalog helper `ef37026fff69d347750be8e778d37874e58a1ed97af0f09ca568527b09b2bad2`; preflight `8926caab894af0b75ae9c20ddd97a7226dac93d171c53bf6d3931bcd5ee1c34c`; wrapper `22dcf6c538af37049128526f1534d47b5d252aa20dd176f6d803f8d519211488`; smoke `f2371d5a37ed67eb92cad8c724befec9476b7e07e1dc08e00cd04a011583e39e`. Checks.log records offline syntax/parser/static/Prisma validation/generation exits 0; these do not exercise PostgreSQL guard behavior.

All locations below are relative to `lingora-admin/` unless explicitly identified as evidence. Every finding belongs to the one sequential package above.

## PRE-01 — P1: restoring two freeze pins removed existing submission protections

**Location:** fifth `migration.sql:69-128`, predecessor fourth `migration.sql:191-318`. **Acceptance:** FDB-05/06/07; remaining spec §§3–4, preserving existing guards.

The shortened replacement drops the predecessor's required submitted facts/episode teacher/generation/scope checks and the monotonic `submitted_at`, `submitted_by` and `approved_at` checks. For example, a previously submitted IN_REVIEW row can change its submission timestamp, submitter or approval timestamp without changing any compared field. An unsubmitted DRAFT can move to CHANGES_REQUESTED without the submitted facts/core requirement that the fourth function enforced (the separate core-readiness trigger covers IN_REVIEW/APPROVED/PUBLISHED only). Existing row-local CHECKs do not restore these protections. Conversely the new unconditional `OLD.status='PUBLISHED'` rejection forbids ARCHIVED/WITHDRAWN transitions even after the active pointer is safely replaced/withdrawn; retained demotion guard previously restricted only an active AVAILABLE revision.

**Required correction/evidence:** preserve the effective predecessor's complete submission/monotonic/identity logic, add predecessor/creation timestamp freeze without losing fields, and retain permitted lifecycle transitions. Review a field/event comparison against the predecessor; supply exact definition/binding evidence and eligible valid-parent tests or specifically named optional omissions.

## PRE-02 — P1: member replacement loses blueprint pins and does not implement pinned coverage correspondence

**Location:** fifth `migration.sql:440-526`, predecessor third `migration.sql:156-264`; product README coverage sections. **Acceptance:** FDB-06/07; remaining spec §4.2.

The new eligibility function no longer reads or compares item `assessment_blueprint_id`/`blueprint_generation` to version pins, drops the retained review generation comparison, and substitutes current blueprint scope for the immutable version snapshot. Thus an otherwise eligible frozen item from a different blueprint/generation in the same course can pass this guard. The promised coverage correspondence is absent: no source Lesson catalog generation/snapshot or version catalog comparison, no membership in pinned topic/skill/purpose dictionaries, and no match to source Lesson arrays. `coverage_tags` only conditionally checks that *present* keys are arrays; `{}`, missing keys, numeric/object array elements and invented/cross-course text tags pass. README explicitly allowing `{}` also weakens the required three-array envelope. No new guard binds submitted Lesson coverage to the source Course catalog/generation.

**Required correction/evidence:** retain all predecessor pin checks, use retained version scope/catalog authority, implement the bounded source/review/episode/catalog/tag contract in spec §4.2 and align documentation. Exact source/catalog verification plus matching/wrong blueprint/generation/catalog/tag controls where eligible; do not use current mutable config to invalidate historical facts.

## PRE-03 — P1: envelope validation occurs too late and casts malformed values before intended rejection

**Location:** fifth `migration.sql:197-217,331-353,385-402`; assignment-history effective INSERT behavior. **Acceptance:** FDB-06/08; remaining spec §§4.1–4.2.

Assignment envelope validation exists only when a review is inserted. `assignment_history` still accepts an arbitrary object and never binds requirement/scope/Lesson/generation to the assignment when the immutable episode is created. A later matching forged review/episode pair therefore does not establish the specified source snapshot. UUID strings are cast without format validation; `schema_version` and positive generations are cast to integer/bigint before checking integral representation/range. Fractional/oversized numbers or a string such as `lesson_id:'bad'` produce incidental 22P02/22003 instead of the intended named 23514 guard; JSON number type alone is insufficient. Boolean OR expressions do not safely isolate casts.

**Required correction/evidence:** validate and bind new assignment episodes at creation, preserve historical pinned authority, and validate UUID/integer/range representations before safe casts with intended diagnostics. Show wrong type/JSON null/missing/fraction/overflow/UUID cases and matching envelope controls, with exact SQLSTATE/guard rather than catch-any failure.

## PRE-04 — P1: main preapply data/definition gates are still absent

**Location:** `scripts/product-preflight.mjs:405-498,586-689`; fifth SQL `:18-62`; `scripts/product-migrate.mjs:18-45`. **Acceptance:** FDB-02/03/06/11; remaining spec §5.

Despite Stage A report/README claims, `probeRoute` only reads identity/table names/migration rows/capability metadata. It neither calls the catalog helper nor runs any row-violation/seed compatibility queries. A four-row checksum history plus 34 tables can reach UPGRADE_REPAIR with drifted definitions or incompatible stored envelopes. The fifth transaction repeats no data assertions. Its history loop permits any first four names that do not equal one of the four hardcoded strings, accepts extra history, and validates only a LIMIT 4 prefix rather than the exact four successful names plus Prisma's identifiable current fifth row. Postflight checks are substring tests.

**Required correction/evidence:** implement reviewed four-state expected-definition parity (only explicit predecessor definitions allowed), complete bounded invariant/seed data rejection, and repeat applicable assertions transactionally. Validate exact four successful IDs/checksums and only the expected in-progress fifth history row, rejecting extras/duplicates/failed/unknown rows. Evidence must demonstrate fail-closed drift/incompatible states and final five-state parity without mutating real data.

## PRE-05 — P1: catalog helper remains a proxy, not the required source contract

**Location:** `scripts/product-catalog-contract.mjs:137-376`. **Acceptance:** FDB-03/05/06/07/08; remaining spec §6.

Most required definitions are never represented or compared: complete columns/types/precision/nullability/defaults, ordered PK/UNIQUE tuples, ordered FK child/target tuples/deferrability/supporting UNIQUE, both provider FKs, CHECK expression/validation, query indexes, complete trigger events/UPDATE OF/timing/WHEN/schema/signature/flags, and actual effective function bodies. Selecting FK columns but ignoring them still accepts wrong targets with the same count/actions. Only 14 trigger names get table/unqualified-function comparisons. R7 checks neither expected row presence nor types; named composite FKs can have wrong tuples. Partial indexes compare a substring rather than ordered keys/full predicate/validity, and raw `indexdef` predicate matching is formatting sensitive (PostgreSQL commonly deparses bare Boolean `WHERE is_active`, not `is_active = true`). `allowPendingRepair` is unused; expected definitions/source hashes are not loaded. A changed body/CHECK can still return the advertised exhaustive PASS.

**Required correction/evidence:** a bounded complete expected structural contract derived from effective ordered source with justified normalization, reused by preflight and final comparisons. Exact object-level diffs must reject wrong column/FK/index/trigger/body definitions and compare clean versus incremental final structures. Do not merely add more counts/substrings.

## PRE-06 — P1: no reviewed clean-target procedure/machinery exists

**Location:** `scripts/product-preflight.mjs:158-162,314-338,539-546`; wrapper and product README operation sections. **Acceptance:** FDB-02/03/12; remaining spec §§5/8/11.

This finding is **not** that live proof has not run. The delivered interface still accepts only `/postgres`, asserts `current_database()='postgres'`, and exposes no exact owned-sibling identity exception or clean-proof target path. The wrapper only uses the main `.env` routes. There is no delivered reviewed export/prerequisite/restore/replay/cleanup procedure with name/OID/owner/nonce checks; capability output is merely NOT_RUN. Therefore Stage B cannot execute the required sibling proof using these guarded commands without bypassing the safeguards or writing an unreviewed procedure after this gate.

**Required correction/evidence:** deliver a concrete, minimal documented safe sibling procedure and any necessary exact-target support before remote mutation. Cover authentic schema-only prerequisites, zero-data checks, exact target identity, all-five deploy/redeploy, same catalog/ACL/seed/smoke comparison, disconnect and identity-checked non-FORCE cleanup. No custom exporter/framework or arbitrary-database parser relaxation. If an actual prerequisite is unavailable, report precise B-ISO; main apply remains gated after clean success.

## PRE-07 — P1: mandatory shape probes evaluate copied constants and omit required cases

**Location:** `scripts/product-database-smoke.mjs:689-781`; FDB-03 dependency. **Acceptance:** FDB-08; remaining spec §7.

The points code fetches CHECK names then executes literals such as `SELECT (-1 >= 0)`. Completion code requires three substrings in a fetched definition, then executes its own handwritten formula, including unconditional `(true) AS val_incomplete`. Neither evaluates the installed expression. Widened arithmetic, SQL UNKNOWN, N=0/negative K, the required N=2/K=0/count=1/units=999 counterexample, timezone/null/JSON handling, start/review shapes and mandatory parent-free JSON rejection/positive controls are absent. Existing installed definitions could be weakened while these probes still PASS. Comments and delivery claims that this is actual CHECK evaluation are false.

**Required correction/evidence:** evaluate trusted allowlisted **actual** installed expressions after their exact source contract has matched; supply all specified valid/invalid/NULL/large-bound cases and required JSON/start/review checks with named intended errors. Preserve the distinction between CHECK evaluation and actual valid-parent row DML. Keep finite/position controls valid and precise.

## PRE-08 — P1: optional behavior and required clean proof can be falsely reported PASS

**Location:** smoke `:235-242,430-453,507-514,591-598,790-797,1159-1166`; README acceptance claims. **Acceptance:** FDB-02/05/06/07/08/12.

FDB-05/06/07/08-AUTH now return PASS solely because the supplied UUID exists in `auth.users`; **no Auth-parented behavioral probes exist in this source**. The message “Authorized identity tested” consequently asserts tests never performed. Missing identity is also mislabeled “zero identities” when no identity count was queried. FDB-02 reports PASS based only on five history rows while capability is always NOT_RUN, then the final aggregator can print all executed probes PASS. Substring “catalog verified” checks cannot substitute for optional row behavior or complete source-definition coverage.

**Required correction/evidence:** case-level PASS only from the actual safe probe, otherwise explicit NOT RUN with its real reason; preserve each original optional omission separately. Separate history success from mandatory clean-proof acceptance so NOT_RUN cannot become FDB-02 PASS/overall acceptance. Correct README/result/log overclaims without rewriting old historical outcomes.

## PRE-09 — P2: preservation/residue evidence still misses first seed and exception paths

**Location:** smoke `:823-847,1067-1155`; test registry and negative position INSERT `:680-686`. **Acceptance:** FDB-04/09/11/12.

`snapBefore1` is still never compared. Only after-seed1 versus after-seed2 is tested, so changing preexisting bytes on the first run escapes. Final “seeded rows intact” is still six counts. No bytes are captured before mutation probes for comparison after disconnect. New-connection residue checking and pool/Prisma disconnect occur only on normal completion; an earlier setup/unexpected-error path skips them, and a later residue error can double-release the already released pg client. Registry omits the default-generated Unit ID/code on unexpected successful negative INSERT and is not an exhaustive touched-row registry. This is not evidence of an observed leak, but the required all-path verification machinery is incomplete.

**Required correction/evidence:** compare full preexisting records before probes/seed1 and after final disconnection, distinguish initial-clean insertion from existing-target preservation, and verify after1→after2. Put rollback/disconnect/fresh residue verification on exception/unexpected-success paths as well, track exact owned keys for every potentially successful write, and preserve errors without double-release. Supply harmless containment-failure evidence; do not disable real guards.

## PRE-10 — P2: creator-default inventory is not creator/effective-ACL verification

**Location:** smoke `:955-966,1049-1060`. **Acceptance:** FDB-10/12; remaining spec §9.

The inventory selects all roles but chooses the first namespace-zero function row without checking `current_user`. PUBLIC aclitem text uses an empty grantee (`=X/...`), so checking `startsWith('public=')` does not detect it. Per-schema additions, relevant table/sequence defaults, absent-row `acldefault` behavior and inherited role grants are not analyzed or retained in output. Functional current/future function denials remain useful; they do not establish the separately required inventory claim.

**Required correction/evidence:** inspect the actual creator/global/app/app_private defaults with ACL decomposition and applicable memberships/hardwired fallback, retain a concise nonsecret inventory and reconcile it with existing functional denials. Do not introduce roles/provider changes.

## PRE-11 — P2: requested diagram is incomplete and source/evidence provenance is overstated

**Location:** evidence `database-overview.dot:1-521`, `README.md:23-44`, `entry-and-source.json`, `checks.log`, `stage-a-result.md`; current Stage A log appendices. **Acceptance:** requested image/code deliverables; FDB-11/12, remaining spec §§2/9.

DOT has **28 labeled nodes including auth.users = 27 product tables**, not 34. Missing labeled product nodes: courses, content_assignments, assignment_history, learning_contexts, assessment_blueprints, assessment_version_items, command_receipts. Six PascalCase edge endpoints instead create implicit bare nodes; command_receipts is entirely absent. There are only 70 edges, and relation pseudo-fields such as `lessons.assignment` and `assessment_attempts.result` are shown as physical columns. Therefore rendered SVG/PNG cannot substantiate the claimed complete ERD. All six README links using `../../../../lingora-admin/...` resolve to nonexistent `docs/lingora-admin`; one additional parent traversal is required.

The manifest has only a dirty summary and owned entry hashes, no exact entry status/excluded-byte baseline or final tested-source/evidence hashes. Checks.log contains no actual read-only inventory query/output, nor source hashes/times around script runs. Stage A reports claim data gates/full parity/actual CHECK evaluation/schema-valid Auth fixtures that the source above contradicts. No unrelated edit is inferred from this evidence gap.

**Required correction/evidence:** regenerate the overview from all mapped models and real scalar/FK definitions, eliminate implicit model-name nodes/pseudo-columns, verify 34 product tables plus external provider and complete source FK mappings, and have the coordinator visually verify a readable overview. Repair links. Reconcile result/log claims with actual subresults; attach available trustworthy entry/excluded baseline (do not invent it retrospectively), record exact final tested paths/hashes and command/query identity/output, and explicitly disclose any unavailable earlier preservation evidence. Keep original applied SQL bytes in the refreshed bundle; update fifth bundle/checksums when corrected.

## Decision

**FAIL — PRE-01..PRE-11.** The current fifth migration is not safe to apply, and Stage B clean-proof operation is not yet concrete/reviewable. FDB-01 and existing FDB-07 closed scope definitions remain preserved at source; full final catalog/proof acceptance is deliberately pending. Use the already authorized **one task-wide bounded Anti correction round** for these findings; this review does not dispatch it or request new owner authorization. Re-review affected code/integration before any remote mutation, then require authentic Stage B evidence for final database acceptance. DATABASE remains NOT READY.

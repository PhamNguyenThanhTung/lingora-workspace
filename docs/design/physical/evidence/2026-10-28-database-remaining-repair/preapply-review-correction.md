# Independent preapply correction re-review — FAIL / STOP

2026-10-28. **WP-DB-REMAIN-01; single authorized correction round.** Reviewed affected integrated source and integration against the same remaining-repair spec, original FDB acceptance and `preapply-review.md` PRE-01..11. This is not a new audit or correction allowance. No tests, database connections, resource operations or implementation were performed by this reviewer; only this artifact was written.

**FAIL: PRE-02/03/04/05/06/07/09/10/11 remain open. Do not proceed to Stage B remote mutation or main apply.** Missing Stage B live results are expected; the blockers are incomplete/incorrect delivered machinery and source, not the absence of those future results. Worker “all resolved” assertions are superseded by this review.

## Reviewed state and accepted improvements

Reviewed actual fifth SQL, preflight/wrapper, catalog helper, smoke, unchanged schema/seed/server, README, correction-result, manifest, appended checks.log and useful final worker-log sections. Current source hashes match `entry-and-source.json.finalTestedSourceHashes`:

| Source | SHA-256 |
|---|---|
| Fifth migration | `c078345384710e5425e8af02529926abd9aec518ec8dc8bc2c9eac5cca42ae75` |
| Catalog helper | `1e54830c3b16b4f289c4faac3ed19bf42c85cf8bce06b3beca4f4ef38e963b95` |
| Preflight | `34eec790d8376c12c17050d619154adfd9ab7680b3a4d05b290fd67f65c52433` |
| Smoke | `6683d9392f89abf2d7f74cb1a096d926e70db43d93b4847087324b1525ada780` |

All four applied migration hashes remain exactly the original immutable values. Schema, seed, server and wrapper hashes match their earlier reviewed bytes. `.env` remains ignored/mode 0600; no credentials were read. Staged diff is empty; preexisting dirty/untracked work remains.

The appended log records syntax checks, 22/22 parser cases, static smoke checks and a read-only UPGRADE_REPAIR preflight exit 0. Those static checks do not execute the SQL or smoke DML below. The catalog helper's observed self-PASS is only evidence that its implemented assertions passed, not full source/catalog parity.

**PRE-01 CLOSED for the reported replacement regressions.** Fifth SQL `:205-343` restores predecessor submission facts/core checks and monotonic submission/approval fields, adds frozen predecessor/creation timestamp protection, and removes the unconditional PUBLISHED transition prohibition. The retained fourth-migration FDB-07 scope functions are not replaced. Complete catalog acceptance is still blocked under PRE-05.

**PRE-08 CLOSED for fabricated observed PASS.** Optional Auth results now remain NOT RUN, rather than passing when an identity exists. History and clean-proof results are separate; the aggregator withholds READY while proof is NOT RUN. This does not establish optional behaviors; the new grouped Stage A messages and hardcoded zero-identity statements are not actual per-case execution evidence.

**PRE-11 requested artifact corrections CLOSED.** Independent local source inspection confirms 35 labeled nodes (34 product + external auth), no implicit PascalCase nodes, complete real scalar column-name sets and no Prisma relation pseudo-columns. All 100 graph FK `(child table, ordered child columns, target table)` mappings match effective ordered SQL, with no missing/extra edge. SQL bundle contains each of five migration files byte-for-byte once in correct order with boundaries; its runner prerequisite is stated. Six code links now resolve. Coordinator reports rendered-image visual inspection with no clipping; this reviewer did not perform a visual-tool pass. Remaining PRE-11 evidence limitation is below.

## Remaining findings

Locations are relative to `lingora-admin/` unless identified as evidence. Owner of every finding is WP-DB-REMAIN-01.

### PRE-02 — OPEN, P1: retained blueprint pins restored, catalog correspondence still absent

**Locations:** fifth SQL `:704-873`, especially `:778-781,840-869`; submission guard `:228-245`. **Acceptance:** FDB-06/07; remaining spec §4.2 and original reassignment correspondence.

Item blueprint ID/generation, review generation, version snapshot scope and required string-array keys are restored. However, the function never reads source Lesson `coverage_catalog_generation`/`coverage_snapshot`, never compares them with version catalog pins, and never validates any tag against `blueprint_snapshot.coverage_catalog.{topics,skills,purposes}`. The three membership checks deliberately run only when the source array has positive length: with an empty source array, arbitrary invented tags pass. Even with nonempty arrays, a tag fabricated in both source and member passes because no finite pinned dictionary is consulted. No new submission guard binds Lesson coverage to scoped Course catalog/generation.

Integration also retains ambiguity relevant to the original distinct-creator/later-submitter case: submission selects an episode solely by assignment ID plus `scope_generation`. Reassignment preserves scope generation, so multiple immutable episodes with different Teachers can match and SELECT INTO picks an unspecified row. A valid later Teacher can be compared to the earlier Teacher. Review rows having an exact episode ID does not disambiguate this earlier submission guard.

**Unmet outcome/evidence:** exact source/review/episode/catalog correspondence; dimension membership and source-array membership including the empty-set negative; preserved valid reassignment attribution. Source/definition evidence and eligible matching/wrong-pin/tag cases remain required, with optional parent omissions identified honestly.

### PRE-03 — PARTIALLY FIXED, OPEN, P1: range checking still occurs after unsafe integer casts

**Locations:** fifth SQL `:135,422,566,584-600,650,665-666`. **Acceptance:** FDB-06/08; remaining spec §§4.1–4.2.

The new episode INSERT guard correctly binds Lesson/requirement/scope/generation to the assignment, and UUID format checks are improved. Numeric regexes do not impose integer/bigint range. For example, a JSON `schema_version:999999999999` matches the digit regex and reaches `::int`; an oversized positive blueprint/catalog generation reaches `::BIGINT`. They produce 22003 instead of the intended named 23514 guard. Schema-version checks also still combine regex and cast in the same Boolean expression, the pattern identified by the first review.

**Unmet outcome/evidence:** validate integral representation/range before casts; exact intended diagnostics for fractional/oversized/schema/null/type cases and valid controls. Regex presence is not closure evidence.

### PRE-04 — PARTIALLY FIXED, OPEN, P1: narrow data gates do not protect the new contracts

**Locations:** preflight `:504-536,723-734`; fifth SQL `:19-96`. **Acceptance:** FDB-02/03/06/11; remaining spec §5.

Preflight now calls the catalog helper and repeats two row queries in the migration. Those queries cover missing submission facts and result-point bounds; they do not check assignment/review envelope/generation/snapshot correspondence, version envelope/config/catalog consistency, member catalog pins, or semantic seed conflicts required before apply. Empty rows in a dated inventory do not implement the mandated fail-closed inspection/apply boundary. The predecessor-definition drift gate is still the incomplete PRE-05 helper. Transactional history now verifies the four exact successful names/checksums, but accepts any fifth row with the expected name, including an already finished row; it does not establish the specified current in-progress migration identity.

**Unmet outcome/evidence:** complete bounded nonsecret invariant/data/seed compatibility rejection plus applicable transaction assertions, exact approved predecessor definitions and allowed history state. No data repair/backfill is authorized.

### PRE-05 — OPEN, P1: full catalog comparison is still a collection of proxies

**Locations:** `scripts/product-catalog-contract.mjs:263-539`. **Acceptance:** FDB-03/05/06/07/08; remaining spec §6.

The helper adds nine ordered composite tuples and two provider tuples, but the other FKs still receive only a count/action check. Provider comparisons omit schema. `EXPECTED_PARTIAL_INDEXES.columns` is never compared (and the submission-key expected list omits `context_id`); predicates are permissive substring regexes, not whole normalized predicates/keys/validity. Trigger checks now allow **at least** a count and compare 14 names/table/unqualified functions; events, UPDATE OF, timing/WHEN/constraint flags/signatures and complete trigger sets remain absent. Five function bodies get substring checks, and pending-repair mode checks only one predecessor substring, rather than reviewed exact predecessor definitions.

Complete columns/types/precision/nullability/defaults, ordered UNIQUE/PK supporting tuples, CHECK expressions/validation and query indexes are still absent. R7 checks still do not assert expected row presence/types. The summary claiming function signatures/full structure is unsupported. For example, an unrelated FK can point to a different UUID relation or a named CHECK can be replaced by TRUE without being rejected by these assertions.

**Unmet outcome/evidence:** original complete source-derived structural contract, exact object-level differences, effective function bodies and trigger bindings, clean/incremental structural comparison. The logged helper PASS cannot close checks it does not perform.

### PRE-06 — OPEN, P1: generic sibling override is unsafe and clean replay still cannot use the commands

**Locations:** preflight `:169-171,337-343,504-527,602-608`; wrapper `:31-42`; product README operations. **Acceptance:** FDB-01/02/03/11/12; remaining spec §§5/8.

`ALLOW_SIBLING_TARGET=1` or `allowSiblingTarget:true` permits **any** matching database name, with no exact task-owned name/OID/owner/nonce identity record. This is the generic target relaxation explicitly prohibited by the spec. Yet `runPreflight` still rejects every live database except `postgres`; its unconditional queries against `app.lesson_revisions`/results and the results regclass also fail on a genuinely clean sibling before INITIAL_CLEAN can be reached. Wrapper URLs remain loaded from main `.env`; there is no complete reviewed owned-target route through deployment/seed/smoke.

The “procedure” is six descriptive string fields. It supplies no concrete authenticated schema-only prerequisite export/closure/review/restore, zero-data proof, exact target/absence checks, replay/redeploy and final comparison operations or safe cleanup checks. No actual owner/OID/nonce-bound operation exists. Reported missing pg_dump/psql is an observed prerequisite limit, not delivered functioning machinery or proof of universal impossibility.

**Unmet outcome/evidence:** the previously required concrete bounded procedure with exact identity-based target exception and clean-state support, or truthful B-ISO. Stage B cannot fill this gap by bypassing safeguards or adding unreviewed operations after this final correction gate.

### PRE-07 — PARTIALLY FIXED, OPEN, P1: new mandatory smoke paths cannot reach their asserted checks

**Locations:** smoke `:668-743,785-946`; effective baseline command_receipts definition `:578-590`. **Acceptance:** FDB-08; remaining spec §7.

Dynamic extraction of real CHECK expressions replaces copied constants, an improvement. The added command-receipt probes reference nonexistent `command_id` and `issued_at` columns (actual columns include `operation_key`, `actor_id`, `target_id`, `committed_at`). They fail with undefined-column errors, never the intended finite/JSON constraint; their purported positive control is also not a parent-free valid fixture. In the same `sp_fdb08_json` savepoint, the first caught DB error leaves the transaction aborted, so later positive/audit queries see 25P02 until the helper finally rolls back. The new assignment-history BEFORE INSERT guard rejects the sequence fixture's `{}` envelope before its named sequence CHECK, so that probe no longer reaches its intended constraint either.

The expression evaluator uses `IS TRUE`, collapsing SQL UNKNOWN into FALSE and asserting it as rejection, contrary to the explicit NULL distinction in the spec. Required start-source shape cases and `n_core=0` evaluation are still absent. Exact installed definition matching is not established because PRE-05 remains open.

**Unmet outcome/evidence:** schema-valid parent-free probes or actual CHECK evaluations, each negative/control in its own recoverable savepoint, exact intended diagnostics, all mandatory shape cases and explicit TRUE/FALSE/NULL observations. Static syntax/model-count checks do not exercise these errors.

### PRE-09 — PARTIALLY FIXED, OPEN, P1: exception cleanup has a new JavaScript scope error

**Locations:** smoke `:998-1027,1287-1370`, command-receipt registry `:706-710`. **Acceptance:** FDB-04/09/11/12.

Full first-run/second-run seed comparisons and normal-path byte verification are improved. Exception paths still skip pool/Prisma disconnect and fresh residue verification. Worse, `let pgClientReleased` is declared inside the try block, while its sibling catch references it: any error taking that catch throws `ReferenceError: pgClientReleased is not defined`, masks the original error and skips release. Moving the release flag late in the success path did not provide all-path cleanup. The new receipt fixture registers an operation UUID as though it were row `id`, while its INSERT leaves actual `id` default-generated. Initial-clean seed insertion is still treated as a preservation failure by unconditional before==after1 equality rather than the specified distinct initial target rule.

**Unmet outcome/evidence:** correctly scoped unconditional rollback/disconnect/residue checks on failure and unexpected success, exact actual row keys, preexisting-byte protection, and initial-versus-existing seed handling. No live smoke should be run merely to rediscover these source-visible defects.

### PRE-10 — PARTIALLY FIXED, OPEN, P2: inheritance/hardwired/global default inventory still missing

**Locations:** smoke `:1143-1183,1265-1278`. **Acceptance:** FDB-10/12; remaining spec §9.

Actual-creator filtering and empty PUBLIC grantee recognition are corrected. Global table/sequence defaults are selected but never evaluated; absent rows are not reconciled with `acldefault`, and applicable role memberships/inherited grants are never inspected or retained. Direct named-grantee checks alone do not establish the specified effective defaults inventory. Existing table/function/future-function functional denials remain valuable; no leak is asserted from this documentary gap.

**Unmet outcome/evidence:** concise applicable creator/global/per-schema/hardwired/membership inventory reconciled with functional observations, without provider/role changes.

### PRE-11 — ARTIFACTS FIXED; evidence preservation portion OPEN, P2

**Locations:** evidence `entry-and-source.json`, `correction-result.md`, appended checks.log and current status claims. **Acceptance:** FDB-11/12; remaining spec §§2/9.

Final changed-source hashes now exist and match actual bytes. Exact entry Git status/excluded-file byte baseline remains absent; the revised manifest replaces the earlier entry-hash set with a smaller preservation list without explaining the unavailable excluded baseline. Result/current notices declare all PRE findings resolved/full structural proof despite the defects above. This does not prove any unrelated file was changed; it means the required entry-to-delivery preservation assertion is unestablished beyond the specifically checked files.

**Unmet outcome/evidence:** truthful dispositions and preservation limits, linking any trustworthy original baseline that exists rather than retrospectively inventing one. Keep prior reviews/logs as history; identify unsupported all-resolved claims as superseded.

## Final boundary

**FAIL / STOP after correction 1/1.** PRE-01 and PRE-08 concrete false-PASS/regression defects are closed, and the requested ERD/source-link/bundle repairs are accepted as local artifacts. PRE-02/03/04/05/06/07/09/10/11 prevent preapply PASS. DATABASE remains NOT READY; the fifth migration remains unapplied. Do not start Stage B, automatically dispatch another correction round, create resources, alter real DEV data, or have the coordinator take over implementation. Report this bounded result and the available image/code artifacts to the owner. Future work requires the workflow's next explicit authorization; no new plan/audit is issued by this review.

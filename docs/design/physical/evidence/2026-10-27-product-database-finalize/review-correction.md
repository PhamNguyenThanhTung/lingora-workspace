# Final correction re-review — FAIL / STOP

2026-10-27. **WP-DB-FINAL-01; correction round 1/1 exhausted.** This completes the independent re-review against the original finalization spec and the initial `review.md`. Preserve that review. No implementation, tests or database/provider/harness operations were performed by this reviewer; only this artifact was written. No additional correction dispatch or Codex implementation takeover is authorized under this task's correction loop.

## Reviewed state and evidence

Read the integrated product schema, all three migrations, preflight, migration wrapper, smoke, seed, server module, product README, correction-result report, original acceptance criteria and first findings. Inspected current Git status/diff statistics, including staged state (empty). The existing dirty checkout and untracked product tree still prevent HEAD from identifying a task-only delta.

Local migration hashes independently read:

- Baseline: `69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862` — unchanged.
- Finalize: `b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16` — unchanged.
- Correction: `3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029`.

Current source hashes: preflight `61dfc0ad812765a29b5c319dbd7947e3d12c63fdf78db6f5033607cb25140044`; wrapper `4081f23d5ec5ec5fc8273469377fc4a342061b36615ff490ba7b7c60cf27e091`; smoke `34aee8e58ae6a0a004c31c3940bbdbdcd5bf2b74bad32973ddb6084daa64343f`; seed `283a0170d7bcb882aeb0787fea28f8b1be40d08d463f966d5e619b9d8387608b`; README `86378f3eee9e0b3367ff87b38efbdfd76cfdc683e4e972448b40b414056a32aa`; shared server module `9c34eab351f456596141eb3ef3682c34c9d1ad6760aa49e9fb8fbcd14c331ba5`.

The coordinator reports the Anti CLI completed with exit 0. The retained correction evidence is `correction-result.md`, containing summarized command snippets, not raw observed command logs/exits linked to a tested source manifest. No such raw log paths were supplied elsewhere. CLI exit 0 establishes worker completion, not acceptance. The report incorrectly states 33 app + 1 app_private; the canonical split remains 29 + 5. Its assertion that CREATE DATABASE from template0 succeeded has no database name/OID/owner/nonce, actual creation output, route proof or cleanup record. These are limitations of the supplied evidence, not independently observed data loss or leaked secrets.

Read the coordinator's subsequently appended **After correction round 1/1** section in `codex-current-observation.md`. Its observed read-only exit 0 confirms all three finished/not-rolled-back history checksums match local files, exact 29+5 table inventory plus metadata, 70 enabled triggers, all 100 product FKs with RESTRICT/NO ACTION, removal of the erroneous classification enum and corrected hosted provenance column references. These facts close those narrow subissues; they do not establish complete bindings/tuples/behavior or clean replay. Auth identity count is zero, so the optional valid-Auth-parent mutation omissions are justified. Capability metadata additionally establishes CREATEDB, ownership of postgres, USAGE on auth and SELECT on auth.users; it supplies no failed prerequisite-transfer/custom-route proof. No resources were created by that observation.

All source locations below are relative to `lingora-admin/`. “Correction” means `prisma/product/migrations/20261027020000_product_correction/migration.sql`. Every finding retains its original ID and **owner WP-DB-FINAL-01**. No new audit or hardening scope is introduced.

## Initial finding dispositions

### FDB-01 — PARTIALLY FIXED, OPEN (P1; acceptance FDB-01)

**Locations:** `scripts/product-preflight.mjs:115-160,213-250,429-558`; `scripts/product-migrate.mjs:32-43`.

Port, approved host, fragment, schema/duplicate/unknown query checks and conflicting ambient URL rejection are meaningful fixes. Both routes are now queried; the wrapper explicitly supplies resolved URLs. However, route agreement compares only version/user/database. DIRECT_URL's observed migration rows, product objects and conflicting tables are never compared or evaluated: history/state evaluation uses only `dbObs`, and the foreign-table rejection also ignores `directObs`. The exact route/history agreement required before mutation is therefore still missing. Metadata conflicts are rejected only in `public`, not any conflicting schema. Ambient project-ref conflict with the ignored file is not checked. The parser's 18 cases do not establish no-connect rejection of ambient conflicts or mismatched DIRECT_URL.

**Evidence required for closure:** actual matching provider/catalog/history checks on both configured routes and retained synthetic rejection results for the remaining specified configuration cases. Keep the parser improvements. No new credentials, endpoint experiments or runtime role work is requested.

### FDB-02 — PARTIALLY FIXED, OPEN (P1; acceptance FDB-02; B-ISO NOT ESTABLISHED)

**Locations:** correction `:8-28`; `scripts/product-preflight.mjs:289-320,353-366,429-592`; smoke `:170-207`; `correction-result.md` §3.

The two historical files are preserved; local hashes and exact three-row history checks are improved. The new migration still contains no explicit transaction boundary: its top-level `SET LOCAL lock_timeout='5s'` is not enclosed in BEGIN/COMMIT by the SQL or wrapper. No retained installed-deploy evidence establishes a surrounding transaction or effective timeout. The report's “single transactional batch” claim is unsupported. Its assertions check only presence of finished migration names, not relevant existing-data violations. Preflight has removed even the former timezone/bucket violation checks and performs no full stricter-invariant/snapshot/classification/seed inventory or definition-drift gate before apply.

Mandatory clean deploy/redeploy and catalog comparison remain NOT RUN. `inspectCleanProofCapability` reads rolcreatedb but its feasibility decision ignores it, inferring impossibility solely from being a non-superuser and not owning `auth`. Those facts do not establish whether a reviewed faithful schema-only prerequisite transfer into a task-owned database is available, nor whether the custom-database route is reachable. The inverse “feasible” branch also does not require CREATEDB. The report claims a successful database creation without any identifying or operational evidence. Thus **safe clean proof is unavailable/unverified in the supplied evidence; its impossibility is not technically confirmed**. Do not equate that distinction with authorization to create a new provider project or mock auth schema.

**Evidence required for closure:** bounded transactional apply/timeout proof and pre-apply violation/catalog gates; actual capability/route/prerequisite evidence for the authorized isolated method, then mandatory replay/catalog proof if feasible. If unavailable, record B-ISO with demonstrated limits and withhold READY. A second populated DEV deploy cannot close it. Preserve all already-applied migration bytes/history; this exhausted task must stop rather than edit them.

### FDB-03 — PARTIALLY FIXED, OPEN (P1; acceptance FDB-03)

**Locations:** smoke `:213-315`.

R7 selected nullability, fifth array and three common timestamps are now inspected. Full catalog acceptance remains a proxy: seven partial unique indexes are accepted by count without key/predicate checks; enabled triggers are accepted by `>=50` without exact table/event/column/function bindings. Complete column/default/type/nullability parity, ordered FK actions/tuples/supporting UNIQUEs, CHECK definitions and required query indexes are still absent. Missing non-UUID PKs is not the same as asserting the exact 34 UUID PK set. Neither report supplies a full catalog artifact. Preserve R7's closed source fixes; do not rebuild those structures to manufacture evidence.

**Evidence required:** the original exact catalog comparisons and actual definitions/bindings on the final source, plus isolated/incremental comparison when available. Counts and substring searches do not close the original finding.

### FDB-04 — PARTIALLY FIXED, OPEN (P2; acceptance FDB-04)

**Locations:** smoke `:328-444,609-617,742-819,935-956`.

Owned random RESTRICT fixtures, exact constraint assertion and a throwing-mid-probe rollback are improvements. The unexpected-success exercise still attempts an operation expected to fail (duplicate `en`), rather than a harmless successful owned operation proving an unexpected-success failure stays contained. Scope/seed tests continue updating actual seeded Lesson/language/framework/Unit/Course records inside rollback transactions. This retains the original prohibition on mutating seeded/real content, although unconditional rollback reduces persistence risk. “After-close complete fixture residue” is actually a query on the open pg connection for `languages.code LIKE 'smk_%'`; it covers neither all run-owned graph IDs/tables/function fixtures nor unrelated-row preservation, and can match foreign historical smoke rows.

**Evidence required:** scoped owned graph fixtures visible to the real seed function, benign unexpected success plus exception-path failure/cleanup proof, all owned IDs checked after disconnection, and unchanged unrelated content. Preserve pg finally rollback and the private Prisma sentinel.

### FDB-05 — PARTIALLY FIXED, OPEN (P1; acceptance FDB-05)

**Locations:** correction `:311-501,503-644`; prior finalize `:308-372,414-427`; baseline trigger binding `:1934-1937`; smoke `:458-500`.

Null-safe submission/fact timestamps, result insert-only progression, blueprint pins, grading-secret INSERT, and identity variant/fingerprint protection are improved. The retained item DELETE guard still checks only OLD.frozen_at, so an unfrozen item whose owning Lesson has been submitted lacks the required parent-based delete protection. The retained media-binding guard likewise checks the item's frozen_at but not its submitted owning Lesson, allowing bindings on that item to change after parent submission. Item revision INSERT has no submitted-parent freeze guard. The updated Lesson submission guard requires submitted_at/submitted_by but still does not require consistent submitted generation/scope metadata or validate those against the retained episode; a reviewable row can carry absent or fabricated pins.

The smoke retrieves five function definitions and checks text fragments; no exact complete trigger bindings or positive/negative lifecycle source proof closes these remaining boundaries. It selects an arbitrary first auth.users ID and changes its wording to “Live Auth mutations verified” if one exists, without executing any such mutation branch. With no supplied identity, optional mutations may remain NOT RUN, but they cannot be called behavior PASS.

**Evidence required:** the original submitted-parent INSERT/UPDATE/DELETE/media freeze and consistent submission boundaries, valid lifecycle/draft positives and exact definitions; optional cases individually NOT RUN when identity prerequisites are absent. This remains the same freeze finding, not a new lifecycle engine.

### FDB-06 — PARTIALLY FIXED, OPEN (P1; acceptance FDB-06)

**Locations:** correction `:35-152,196-304`; product README `:121-140`; smoke `:506-559`.

The nonexistent column references are fixed at source (`next_teacher_id`, `scope_generation`), and SUBMIT actor checking is added. The storage envelope is still incomplete: only six keys and scalar blueprint identity/generation are enforced. Schema version, catalog generation/config, explicit nullable target/next level shape and the assignment scope envelope required by §4.3 are absent or declared optional. Course/language/framework/purpose values are not bound to the blueprint's actual scope at assembly. A snapshot with matching blueprint ID/generation but fabricated course/language/framework or a different allowed purpose can be inserted and later drive historical attempt/result validation. Review and membership logic never compares assignment_scope_snapshot to the episode/source submission or checks coverage-catalog correspondence. Correct scalar FKs do not establish these JSON relationships.

**Evidence required:** the previously specified minimal validated storage/assignment envelope and stored scope/catalog/submission correspondence, preserving exact existing composite FKs and distinct creation/submission episodes. Empty `{}` rejection alone does not prove that envelope. No snapshot backfill or assembly runtime is requested.

### FDB-07 — PARTIALLY FIXED, OPEN (P1; acceptance FDB-07)

**Locations:** correction `:651-692,695-725,793-876`; retained finalize `:705-723`; baseline `:1659-1682`; smoke `:588-627`.

Context identity, pinned framework result checks, Course deactivation/revision demotion and completion timestamp checks are improvements. The replacement `check_lesson_attempt_scope` accidentally removes the earlier equality check between `NEW.lesson_revision_id` and `Lesson.active_revision_id`. It now accepts another PUBLISHED revision of the same Lesson (the composite FK establishes ownership, not activeness). AVAILABLE can still be set on a Lesson in an already-inactive Course: the Lesson guard checks its published pointer only, and the new Course guard fires only on an active-to-inactive update. Referenced level framework edits still omit blueprint/result references. Blueprint target/next level scope remains mutable after assembly, and attempt start checks only snapshot course/language, omitting the required framework/level/transition relationship.

The non-AVAILABLE negative uses entirely random absent parents; the spec explicitly disallows random-parent errors as scope proof. The second negative modifies the persisted seeded Lesson. Neither proves valid historical replacement/config behavior.

**Evidence required:** restore exact active-revision new-start protection and the original parent/pinned scope relationships, with valid graph cases and permitted atomic replacement/withdrawal/history positives. Preserve the new identity/result/timestamp fixes.

### FDB-08 — PARTIALLY FIXED, OPEN (P1; acceptance FDB-08)

**Locations:** correction `:903-929,509-515`; smoke `:639-713`.

Origin/pin validation now exists for item revision writes, but changing an unreferenced item identity's origin can invalidate its existing revisions: the identity guard only prevents origin changes when exercise/version membership exists, and does not revalidate revision pins. The reported origin/pin test inserts random absent item/episode/Lesson/creator parents and accepts **any** 23514. Alphabetical BEFORE trigger order can reject in creation provenance before the origin/pin guard, so this can PASS without exercising the intended invariant. The start case also uses a random learner. Mandatory parent-free finite-state/positive-value/JSON probes and R6 valid numeric boundaries still are not implemented. Classification enum removal and start/NK/SRS source improvements remain valid; diagnostic/summative result positives have not actually run and must stay optional NOT RUN when authorized parents are unavailable.

**Evidence required:** maintain origin/pin correspondence across relevant parent changes, exact intended guard assertions with valid prerequisites, mandatory independent shape probes, and truthful optional classifications. No global classification enum or grading/scheduling algorithm.

### FDB-09 — PARTIALLY FIXED, OPEN (P2; acceptance FDB-09)

**Locations:** `prisma/product/seed.mjs:184-198`; smoke `:727-845`; server module `:87-106`.

Course configuration/generation comparisons and the own-assertion mismatch false positive are fixed. Four conflict cases now require MISMATCH, and the server read checks expected returned IDs. However, A1 label and Unit-name conflicts required by the original acceptance are omitted; two successful seed calls are described as byte/timestamp-identical without before/after record/timestamp comparisons. Server lookup still calls findFirst over active Courses rather than requesting the exact seeded ID, so another legitimate active Course can cause failure. Conflict probes remain against seeded content (FDB-04).

**Evidence required:** original complete semantic conflict categories, exact record/timestamp idempotency observations and parameterized exact seeded Course lookup, with retained actual outputs. Preserve deep JSON equality, transactionality and no-overwrite semantics.

### FDB-10 — PARTIALLY FIXED, OPEN (P2; acceptance FDB-10)

**Locations:** correction `:934-941`; smoke `:862-932`.

Current-object revokes, creator global/per-schema revokes for all three principals and a rollback future-function probe are improvements. Effective table checks still cover SELECT only, not the full baseline denial; applicable global/per-schema/default ACL inventory is absent. The future function test covers app only, without testing app_private or retaining applicable-default evidence for that schema. These are the same omitted acceptance checks identified initially. No raw output/source manifest substantiates even the expanded probe's run.

**Evidence required:** all specified baseline effective privileges and applicable creator defaults across both schemas, actual rollback fixture observations and source-linked results. Do not expand into runtime principals, provider ACL changes or RLS hardening.

## Final disposition

**FAIL — FDB-01..10 remain partially open; FDB-12 evidence/acceptance is not achieved.** Baseline/finalize preservation and all three applied checksums are confirmed by local hashes plus the coordinator's fresh narrow observation; full excluded-file entry-to-delivery preservation remains unestablished by retained correction artifacts. All three applied migrations must remain immutable. DATABASE READY (DEV) is withheld both for concrete remaining defects and missing mandatory clean proof. The claimed B-ISO rationale is insufficient to call clean replay technically impossible.

The sole correction round is exhausted. **STOP this task.** Report remaining findings and missing evidence to the user; do not dispatch another correction, implement a workaround, edit applied history or start application implementation. Optional Auth cases remain optional NOT RUN under the original scope; deferred hardening and the parked harness remain outside this review.

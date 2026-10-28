# Independent review — WP-DB-01

Date: 2026-10-27. **VERDICT: FAIL.** First review; all findings below belong to the one permitted task-wide Antigravity correction round. Owner for every finding: **WP-DB-01 / Antigravity**.

Reviewed the original `plans/2026-10-27-product-database-spec.md`, selected physical column catalog and correction contracts, actual new Prisma/SQL/seed/server/smoke files, package scripts, current notices, worker delivery/evidence, Git state and the entry hash baseline. No tests, database connections, provider operations, or harness commands were executed by this reviewer. A read-only hash comparison found changes only in the eight baseline files owned for package/notice updates; the recorded fixture/schema/migration/bootstrap/tests, Supabase config, package lock and ENVIRONMENT remained identical. Git is still the preexisting dirty checkout, not a clean task-only diff.

The 34 table names and 29/5 schema split are present. The separate client output, provider FKs, RESTRICT/NO ACTION FK actions, principal composite response/attempt/member/review target UNIQUE keys, finite-state checks, partial uniques and requested query indexes are present. The server module imports the distinct product client and provides bounded catalog relation reads. These observations do not establish full field/integrity parity or successful SQL execution.

**External limitation:** No positively identified hosted DEV configuration was supplied. Migration/replay, seed execution/idempotency, catalog/constraint negatives, public-access checks and server connectivity remain **NOT RUN / EXTERNAL**. This alone is not an implementation defect and does not reactivate the parked harness. No DATABASE READY verdict is possible. The implementation defects below also prevent the stronger claim that static implementation is complete. Detailed RLS/runtime principals/Auth sessions/status authorization/pooler/provider workflows remain deferred exactly as in the final spec.

## Required findings

### DB-R1 — P1: The configured live acceptance branch contains no acceptance code

**Files/location:** `lingora-admin/scripts/product-database-smoke.mjs:288-341`, especially 339-340; summary at 365-367. Related claims: product README:57, implementation-result.md acceptance matrix and completion claims, current task/HANDOFF/top notices.

**Acceptance:** DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-09; spec §§5-6.

**Defect and concrete case:** With any nonlocal, non-placeholder DATABASE_URL, the script prints “Executing remote acceptance checks”, reaches a comment and returns. It imports neither pg nor the server module, makes no database call, records none of DB-02..07, and exits 0. Thus valid credentials do not unlock the promised checks. The static “Field-by-Field Parity” check covers only three fields, while migration checks are four substring searches and server verification is file existence; those outputs cannot support the broad implemented/parity claims.

**Required outcome/evidence:** Complete the single straightforward acceptance script, with explicit outcomes for every required remote criterion when configured: read-only target/provider/history preflight and exact catalog checks; repeatable seed verification; rollback-only Prisma create/read/update/delete plus seeded language→course→unit→Lesson reads and RESTRICT rejection; savepoint/rollback negatives for natural keys, finite/positive/JSON/XOR and core readiness; exact FK targets/actions and partial/guard checks; effective public schema/table/function denial; real shared server-module connection/read/disconnect. The optional existing-Auth branch may remain NOT RUN when no identity exists; never create one. Migration deploy/replay can remain explicit operations, with their observed results recorded truthfully. Missing configuration must keep dependent checks NOT RUN; configured-but-incomplete execution must never succeed silently. Update current claims and append observed correction evidence without fabricating live PASS or rewriting historical logs. Static/source assertions must describe their actual limited coverage.

### DB-R2 — P1: Seed accepts arbitrary targets and the migration procedure lacks its required read-only preflight

**Files/location:** `lingora-admin/prisma/product/seed.mjs:160-176`; smoke:291-294; `lingora-admin/prisma/product/README.md:37-45`; `lingora-admin/package.json:22`.

**Acceptance:** DB-02, DB-03, DB-06; spec §§2, 4-6.

**Defect and concrete case:** Seed checks only whether DATABASE_URL exists and contains “placeholder”. It will write fixture records with a production, unrelated, or local URL and absent/mismatched SUPABASE_DEV_PROJECT_REF. Smoke reads projectRef but never compares it. README goes directly from URL exports to migrate deploy; its prerequisite sentence supplies no executable read-only check for provider objects, exact DEV agreement, empty application namespaces and migration history. The FK near the end of migration is not a preflight: preceding DDL can already have been attempted against the wrong or incompatible target.

**Required outcome/evidence:** Add the small explicit DEV reference/connection agreement checks required by the spec before seed/smoke connect, covering the documented direct/pooler form actually supported and rejecting absent/mismatched/unknown targets without mutation. Provide an executable read-only preflight or exact safe read-only operational commands before migration, checking auth/provider prerequisites, identity and empty app namespaces/history; distinguish initial-clean apply from the expected no-pending second deploy. A wrapper is not required if the documented explicit procedure is complete. Do not infer DEV from “postgres”, port, local config, a nonlocal URL, or credentials alone; do not introduce a general environment/harness framework. Anti should record no-connect rejection cases without printing secrets; live preflight remains NOT RUN until actual authorized configuration exists.

### DB-R3 — P1: Immutable facts, submitted payloads and frozen children can still be changed or deleted

**Files/location:** product `migration.sql:1350-1376` (the sole trigger); relevant tables throughout schema/migration.

**Acceptance:** DB-01, DB-05; explicit spec §4 “guards for immutable facts and submitted/frozen payload/member/key bytes”, selected catalog §B.

**Defect and concrete case:** Apart from core readiness on a status write, there are no UPDATE/DELETE/freeze guards. After a revision reaches IN_REVIEW its title/content, item prompt/omission/fingerprint, grading secret and exercise/vocabulary/media members remain editable. Deleting or changing the last core membership leaves that submitted/published revision without core content because no status update fires. Unreferenced first-completion facts, responses, SRS operations, assessment membership/responses/results, assignment/review history, receipts and audits can be rewritten/deleted. A referenced row's non-key payload can also change despite RESTRICT FKs. Media object keys/tombstones and frozen vocabulary meanings are not retained by any guard.

**Required outcome/evidence:** Implement focused SQL guards for the catalog's immutable/append-only facts, submitted Lesson payload and children, item/key/fingerprint/omission freeze, immutable assessment snapshot/membership and finalized evidence, frozen vocabulary semantic identity, media immutable keys/retirement, fixed account role, and identity/scope fields that the selected catalog says freeze once referenced. Keep legitimate draft editing/removal and permitted lifecycle/schedule/config updates working; lifecycle columns must not be frozen with authored payload. This is structural storage protection, not implementation of runtime grading, scheduling or application commands. Add direct acceptance negatives and positive editable/lifecycle cases in the existing smoke path, with live execution honestly pending if credentials remain absent.

### DB-R4 — P1: Content and assessment source provenance is not fully linked or checked

**Files/location:** `lingora-admin/prisma/product/schema.prisma:278-289, 399-404, 741-746`; migration FK block around 801-855 and 978-993; sole trigger at 1350-1376.

**Acceptance:** DB-01, DB-04, DB-05; spec §3 rows 8, 12, 14, 25, 31 and §4.

**Defect and concrete case:** AssessmentVersionItem has the item/identity FK and source review tuple, but no `(item_revision_id,source_lesson_revision_id) → item_revisions(id,authoring_lesson_revision_id)` FK/guard. One member can therefore name an item authored in Lesson A and a valid submission tuple from Lesson B. No guards require ASSESSMENT origin, a frozen/nonomitted source, SUBMIT action, or matching blueprint/generation/scope/catalog. LessonExercise can contain an ASSESSMENT item. Item creation episode/creator need not match its authoring Lesson assignment, and a prior Lesson revision may be foreign, later, or cyclic. The supporting item/source-owner UNIQUE exists but is unused.

**Required outcome/evidence:** Add the missing exact composite item/source-owner mapping in Prisma and SQL, with matching reverse relations/explicit names, plus small stored-provenance guards for those cases. Enforce same-Lesson earlier predecessor; item origin and blueprint/generation contract; episode/creator ownership; practice-only Lesson membership; exact eligible assessment source/review/episode/blueprint pins; and review episode provenance to its Lesson assignment. Preserve the difference between original creation and later submission episode. Prepare catalog assertions and rollback negatives that demonstrate these failures. Auth-parent-dependent execution can use only a supplied existing DEV identity and otherwise remain optional NOT RUN; no new session/principal architecture is requested.

### DB-R5 — P1: Independently valid foreign keys still permit foreign curriculum and invalid published/completion relationships

**Files/location:** migration course/unit/context/blueprint/attempt/result FKs at 758-795, 888-926, 951-975, 996-1014; Lesson active pointer at 789; no corresponding relationship guard after 1350.

**Acceptance:** DB-01, DB-04, DB-05; spec §3 and §4 stored relationship/scope guard requirement.

**Defect and concrete case:** A Unit may select a level from another framework; a Course default may do the same. A context can combine language A, course B and a level/result from another scope. Blueprint language/framework/course/levels can disagree. Lesson/assessment attempts can pin content from a different context curriculum. AVAILABLE accepts a null active revision, or an own DRAFT revision in an inactive ancestor course; the composite pointer only checks own identity. A completion fact may cite an incomplete attempt, and a result may cite an unfinalized assessment attempt or have the wrong placement/level-up result shape. All these rows satisfy the current UUID FKs and checks.

**Required outcome/evidence:** Add focused stored relationship guards (or exact composite relationships where appropriate) for course/default/framework, Unit/course/level, context/course/language/start/working/result scope, blueprint/course/language/framework/levels, pinned attempt scope, own PUBLISHED active Lesson pointer with required AVAILABLE shape, and completion/result parent state/provenance and purpose shape. Guard relevant relationship mutations as well as inserts so a parent edit cannot invalidate retained evidence. Use the pinned assessment snapshot for historical attempt/result scope; do not repin to the current mutable blueprint. This does not request business command execution or the deferred Auth/status/RLS workflow. Extend catalog/rollback acceptance cases accordingly.

### DB-R6 — P1: Most required row-local shapes and bounds are absent

**Files/location:** migration `1060-1254` (complete row-check section).

**Acceptance:** DB-01, DB-05; spec §§2-4, selected physical column/type/check catalog.

**Defect and concrete cases:** The section contains no `jsonb_typeof` checks and no nonblank-string checks. For example `languages.names=[]`, `lesson_revisions.content_blocks={}`, private grading `grading_data=1`, raw response `input=[]` and `languages.code=' '` pass. Additional missing checks permit:

- A context with DEFAULT plus self_report/start_result, or no selected start but nonnull provenance/working level.
- A completed LessonAttempt with negative K/count/contribution, K above N, or inconsistent N+K count/half-unit bounds; the current check verifies nullness only.
- A CORE_COMPLETION SrsCard with both source links null, or OPTIONAL_CHOICE without its required source vocabulary link.
- SCHEDULE with a parent, REINFORCEMENT without one or with a qualifying day; no same-card/learner/session FORGOTTEN schedule-parent and unchanged-schedule relationship guard exists.
- Lesson Review without episode/generation/scope, version Review with assignment fields, or SUBMIT on an assessment version.
- Half-present item blueprint/generation pins and nonpositive nullable coverage/submitted/review generation pins.

**Required outcome/evidence:** Add every object/array check indicated by the selected column catalog (including nullable JSON fields when present), required text nonblank checks, and the enumerated start/completion/SRS/review/item-pin/generation shapes and numeric bounds. Use row CHECKs for row-local facts and a focused SRS parent guard for cross-row correspondence; no grading/scheduling algorithm or configured-code validation engine is required. Ensure nullable SQL CHECK expressions do not pass malformed rows via UNKNOWN. Demonstrate representative invalid cases plus valid uninitialized/default/self-report/placement and SRS/review shapes through the single direct smoke script.

### DB-R7 — P2: The scalar/nullability contract is incomplete

**Files/location:** `schema.prisma:141-143` and migration:71 (`courses.default_start_level_id`); `model AssignmentHistory` at 225, `CommandReceipt` at 868, `AuditEvent` at 885 and their CREATE TABLE blocks; migration array columns around 168-170, 241, 566.

**Acceptance:** DB-01; spec §§1-2 and selected catalog §B common columns/“? means nullable” convention.

**Defect and concrete case:** Course.defaultStartLevelId is optional in Prisma/SQL although the selected catalog lists `default_start_level_id FK levels` without `?`. AssignmentHistory, CommandReceipt and AuditEvent omit common `created_at` entirely. The SQL array columns `topic_ids`, `skill_ids`, `purpose_tags`, `practice_skill_ids` and `feedback_item_ids` accept NULL, despite required list mappings/catalog. Default empty arrays do not reject an explicit NULL write.

**Required outcome/evidence:** Align Prisma and migration with the required default-level relation and common creation timestamps, and enforce SQL NOT NULL for the required arrays while retaining valid empty arrays. Revalidate/generate the isolated product client and record a real column/type/nullability comparison, not model counts or three regex fields. No new provider model is needed.

### DB-R8 — P2: Seed silently accepts conflicting configured meanings

**Files/location:** `lingora-admin/prisma/product/seed.mjs:18-20,31-33,45-56,75-87,92-114,117-155`.

**Acceptance:** DB-03; explicit spec §5 seed mismatch requirement.

**Defect and concrete case:** Every upsert uses empty update, and existing Course is accepted by ID with no comparison. If `en` already has is_ui_locale=false, an A1 row has a different position/label, or the fixed course UUID belongs to another language/framework, seed prints “ready/exists” and completes. It preserves bytes but never reports the required semantic mismatch, and may create later fixtures under conflicting parents. Persisted course/unit labels also read as normal core curriculum; DEV-only intent exists only in comments.

**Required outcome/evidence:** Compare the required semantic fields/parents of existing keyed seed records and fail clearly on mismatch without overwriting them. Matching reruns must remain idempotent, with no duplicate/destructive updates. Mark fixture codes/labels clearly as DEV fixtures as required; keep Lesson PLANNED and avoid assessment defaults/provider identities. Prepare matching-rerun and conflicting-existing-record checks; record actual remote outcomes only when authorized DEV exists.

### DB-R9 — P2: PUBLIC function EXECUTE is not revoked by the supplied SQL

**Files/location:** product migration:1350-1370 (function creation), 1381-1405 (revocations).

**Acceptance:** DB-06; spec §4 baseline function/default EXECUTE revocation.

**Defect and concrete case:** The function is created before the default-privilege statements, and no `REVOKE ... ON ALL FUNCTIONS ... FROM PUBLIC` follows. Revoking anon/authenticated directly does not remove their inherited PUBLIC grant. Also `ALTER DEFAULT PRIVILEGES IN SCHEMA ... REVOKE ... ON FUNCTIONS FROM PUBLIC` cannot remove PostgreSQL's global default PUBLIC EXECUTE; that statement does not establish the promised future default. Schema usage denial currently limits reachability, so this is an explicit baseline privilege-contract gap, not a claim of an exposed answer endpoint. PostgreSQL documents both existing-object and per-schema/default limitations in [ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html).

**Required outcome/evidence:** Revoke PUBLIC access on existing app/app_private objects explicitly, including functions, and use an effective default-function EXECUTE policy for the migration creator, accounting for its database-wide scope in the product README. Do not change provider schemas/roles or add runtime principal architecture. Prepared live acceptance must inspect effective PUBLIC/anon/authenticated privileges and the applicable defaults, not merely search for REVOKE text.

## Nonblocking observations and correction boundary

The next-app outline is pending live DEV acceptance and defines no route or app implementation. Its “API Contracts: docs/03-api-contract.md” pointer should be qualified as legacy/read-only according to docs/README.md:97 before that later slice selects contracts, and “initialization” should not imply an approved new account-creation workflow. This is not a database acceptance blocker or authorization to implement routes now.

All DB-R1..DB-R9 are source-level findings in the first bounded review, not failures inferred from unavailable credentials. One Anti correction round should address the batch and refresh affected static evidence/current status. Required live checks may remain NOT RUN / EXTERNAL if configuration is still absent. Re-review must read the changed guards/relationships/acceptance code and integration against the original spec; do not add deferred RLS/Auth/runtime gates, run/recover the parked harness, or claim DATABASE READY without actual live evidence.

# Lingora — Physical Database & Runtime Implementation Spec

> **Historical reference notice (2026-10-28):** Retained as a historical technical contract reference (referenced by `lingora-admin/prisma/bootstrap/manifest.json` and ADR-044). Execution phases and workflow gates described herein are superseded by current policy ([AGENTS.md](../AGENTS.md)); implementation statuses reflect issue-time observations. This document grants no new work.

**Issued:** 2026-10-22 · **Author:** Codex · **Status:** SPEC ISSUED; IMPLEMENTATION / A1–A3 NOT STARTED.

The owner authorized this spec and FTR dispositions, not execution. No Antigravity/Gemini dispatch, PoC, application/schema/migration implementation, provider project creation or database connection belongs to this task. Future disposable execution needs a subsequent instruction naming that phase. Production/live inventory, import and cutover remain separately scoped.

## 1. Goal, authority and actual starting point

Build the accepted Lingora behavior using Next.js, Supabase PostgreSQL/Auth/Storage and Prisma, retaining the proposed 34-table design. Validate the risky platform contracts before broad implementation. Do not restore obsolete applications or derive new rules from their schema.

Sources: [ADR log](../logs/decision-log.md) (ADR-030–036, 041–044 within their scope), [requirements](../docs/02-requirements.md), [UC catalog](../docs/use-case-specifications.md), accepted [Class baseline](../docs/modeling/current-target/class-review-2026-10-16.md), current [physical catalog](../docs/design/physical/README.md), [security](../docs/design/physical/security-and-rls.md), [reconciliation](../docs/design/physical/database-reconciliation-2026-10-20.md), [final review](../docs/design/physical/final-technical-review-2026-10-22.md) and [FTR disposition](../docs/design/physical/ftr-disposition-2026-10-22.md). This spec supersedes inconsistent lock-order prose and the sequencing of the historical rebuild outline; it does not approve a live rebuild or override product ADRs.

Repository recheck at HEAD `c39806cb45c908135f240c93d68546b6ac5d7784`, **including existing dirty RDR corrections**, found:

- No current application package manifests, Prisma schema or executable SQL migrations. Web/Admin runtime and new-design security tests must be built; existing design validators are not DB tests.
- Git `84baa85` contains the removed 18-model/six-role Prisma schema and incompatible 17-table/two-role initial SQL plus later old Auth/RLS/Storage migrations. Preserve those Git objects/checksums as history; never run them as the 34-table baseline.
- Historical pinned versions are Prisma/client 6.19.3, Next.js 15.5.23, React 19.1.1, supabase-js 2.112.3 and SSR 0.12.4. Use Prisma 6.19.3 and SDK 2.112.3 as the feasibility baseline; no opportunistic major upgrade. Record actual PostgreSQL/Auth/pooler versions at A1–A3. Next/React security-supported patch selection is checked when restoring app scaffolds, with a dependency diff; it is not a product decision or reason to change stack.
- Existing uncommitted diagrams, reports and corrections are input, not worker output. [Entry evidence](../docs/design/physical/evidence/2026-10-22-implementation-spec/entry-state.json) captures their bytes. Live DB remains **UNVERIFIED**; no inference of an empty database.
- Six physical output hashes in the old manifest are stale; CR2-04 negative-fixture/helper coverage remains open. They do not block writing this spec but cannot be carried forward as verified evidence. P0 requires a dated current provenance snapshot; P2 requires actual DB tests independent of those helpers.

### Capability map and dependency direction

| Capability | Boundary | Depends on |
|---|---|---|
| C1 identity/security | Auth adapter, subject wrapper, roles/policies/lockers | Provider and connection feasibility |
| C2 migration/relational integrity | One Prisma history plus owned custom SQL | Disposable provider prerequisites |
| C3 assigned content/publication | Teacher source packages → system assembly → Admin lifecycle | C1 + C2 |
| C4 learner evidence | Context → pinned attempt → completion/SRS or aggregate assessment result | C1 + C2 + published C3 fixtures |
| C5 operational verification | Private media, race/recovery/restore, deployment boundaries | Each completed slice |

This is a map inside the requested single spec, not authorization for parallel execution now. AI, reminder features, N=0 completion, framework migration, new services/tables, legacy import and live cutover are out of scope.

## 2. Schema, migration and file ownership

**Single schema/migration owner: the Admin boundary.** Future paths below are targets, not existing files or links to executable code.

| Area / future path | Owner and contract |
|---|---|
| `lingora-admin/prisma/schema.prisma` | Schema owner models exactly the 34 catalog tables in `app` / `app_private`, explicit mappings, PKs, supported UNIQUE/indexes/relations and NO ACTION/RESTRICT actions. Exactly three fixed business roles. No managed `auth`/`storage` models or old role arrays/chat tables. |
| `lingora-admin/prisma/migrations/<new_timestamp>_<slice>/migration.sql` | Same owner integrates generated DDL and reviewed custom SQL into **one ordered Prisma migration history**. No separate Supabase migration runner creating the same objects. Security-only migrations are also in this history. |
| `lingora-admin/prisma/bootstrap/` | Explicit operator script for cluster roles/credentials and required provider privileges; no passwords committed. This is an environment prerequisite with versioned manifest, not a competing application schema history. Reconcile preexisting roles rather than silently replace provider roles. |
| `lingora-admin/src/server/db/` | Minimal server-only generated-client export, verified-subject interactive-transaction wrapper and named command adapters. Learner server imports an explicit server-only export from this boundary through npm workspace wiring; no import of Admin UI, browser bundle, generic repository layer or separate service. |
| `lingora-admin/src/server/auth/` | Trusted provider admin adapter and controlled bootstrap/recovery commands; isolated credentials. Learner callback uses a narrow server-only activation entry. |
| `lingora-admin/tests/database/` | Disposable fixtures, role/policy/catalog assertions and cross-connection race/failure tests. A1–A3 experiments can be initially isolated here with minimal manifests; no old cleanup script. |
| `lingora-web/src/server/` | Learner session verification, safe DTO/routes and commands through the shared server-only DB boundary. No client table access or independent schema/migration. |
| root package/lock files | One integration owner restores the two workspace boundaries and exact dependency pins; avoid installing unused historical UI packages. No placeholder AI workspace. |

Prisma owns representable structure and client types. **Custom migration SQL** owns CHECKs, partial uniqueness, unsupported/composite/provider FKs, Auth trigger, immutable/cross-row guards, roles/grants/policies, security-definer functions, safe views and advisory locks. Represent supported composite relations in Prisma too, using the same constraint names. A small ownership inventory records each constraint/function/policy, migration and representing Prisma field (or SQL-only reason); no object is created twice. `migrate dev --create-only` changes are reviewed before apply; subsequent generation must preserve SQL-owned objects. `db push`, `migrate reset`, blanket schema drops and fake historical baselines are forbidden against any live/unknown environment.

Migration dependency order: provider prerequisites + roles → schemas/catalog roots/accounts with nullable avatar → curriculum/assignments/history/Lesson roots with null active pointer → revisions/items/media → contexts/attempts/results/evidence → remaining composite/circular FKs → guards/functions/grants/RLS → Auth hookup after configuration/readiness. Create tables before circular FKs; use nullable staged inserts rather than disabling integrity. `lessons(active_revision_id,id)` uses **MATCH SIMPLE**, not MATCH FULL. Exact referenced tuples require nonpartial UNIQUE targets. Cross-table readiness/role/scope is a checked command/guard, not a cross-table CHECK.

Preserve stable UUIDs and `languages.code`; labels may change, codes cannot be renamed through generic config. No cascading identity changes or learner-history deletion. Freeze published/submitted bytes, creation/submission episodes and completed evidence. Draft association removal remains limited to the three already defined association types; no general DELETE capability.

Official basis: [Prisma custom migration features](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/unsupported-database-features). A3 must validate the exact generation/replay workflow, including SQL-owned objects and provider FKs, before this ownership scheme is accepted at runtime.

## 3. FTR-01 — lesson readiness contract

ADR-044 is accepted PO behavior: **`N >= 1`** for a published completable Lesson. Count core membership from the exact Lesson revision, not vocabulary, optional review or assessment contributions. Draft/save/preview may contain zero core exercises. **Submit, approve, publish and new learner start reject `N < 1`** with a finite readiness error and no transition/attempt/receipt success. Recheck all other key/media/scope readiness normally; N>=1 does not replace them.

Keep `lesson_attempts.n_core CHECK > 0`; snapshot the exact core membership/count when starting, pin the revision, and retain ADR-036 scoring with N+K denominator and half units 2/1/0. Finalization recomputes against the pin, never a mutable draft. Incomplete attempts have no completion/result. First completion rechecks active AVAILABLE revision under course lock; redo does not increase logical completion count or reset existing SRS. Class cardinality `0..*` still describes drafts correctly; no diagram/table/state change is necessary.

## 4. FTR-02 — selected Auth provisioning contract

### 4.1 Identity and correlation

Use the existing `provisioning_requests`, **skip-then-insert**, PENDING lifecycle and a trusted server adapter. No distributed transaction, mail queue or new table is introduced.

1. Verify current ACTIVE Admin for Teacher provisioning; ADMIN bootstrap is operator-only, not a generic Admin create-Admin endpoint. Normalize email consistently with provider behavior (trim/case normalization; no Gmail dot/plus rewriting). Reserve unique normalized email and operation key in a short DB transaction. Same key requires the same immutable email/role/requester; changed input conflicts. Different keys for one email converge to the existing operation only after authorization and matching intent, otherwise conflict.
2. Before any provider call, generate a server UUID and store its string in existing `provider_correlation_id`; freeze it with the operation input. It is both the **planned provider UUID and correlation identifier**. Keep FK `auth_user_id` null until provider existence is verified. No schema addition is necessary. Browser cannot select this UUID, role or marker.
3. After commit, call `auth.admin.createUser` with `id = provider_correlation_id`, reserved email, `email_confirm: false`, no initial password, and private `app_metadata.lingora_provisioning = {operation_key, correlation_id}`. This creates the marker with the identity. Here private means server-controlled provenance: app_metadata is not a secret and its visibility grants no authority. Role authority stays in the private request/accounts row, never client metadata or JWT metadata.
4. Verify via `getUserById(planned UUID)`: exact UUID, normalized email and both private marker fields must match. On lost response, perform this same lookup first. Definite not-found permits retry of the **same UUID/input**; timeout/unknown does not justify a new UUID. Duplicate/409 also leads to lookup. Email conflict with another UUID, wrong marker or preexisting Learner is **not adopted, linked or elevated**. Keep denied/retryable state with a sanitized finite error for technical resolution; never overwrite the conflicting identity.
5. In a new authorized transaction, recheck operation version and Admin status (or controlled bootstrap authority), bind `auth_user_id`, record IDENTITY_CREATED, then insert the fixed-role PENDING account and required audit and mark READY atomically. READY means identity + application account are bound and ready for activation, **not email delivered or account ACTIVE**. Existing matching account makes the bind idempotent; incompatible account fails closed. No provider call inside this transaction.

This selects capabilities present in [SDK admin attributes](https://github.com/supabase/supabase-js/blob/v2.112.3/packages/core/auth-js/src/lib/types.ts#L534) and [getUserById](https://supabase.com/docs/reference/javascript/auth-admin-getuserbyid). API support is source evidence only; A1 must prove the deployed Auth accepts the requested UUID and atomic marker.

### 4.2 Trigger, invitation, activation and recovery

The Auth INSERT trigger is deterministic: a private reserved staff email skips generic application-account insertion; other valid public signup creates only the safe LEARNER account. Trigger trusts neither caller user_metadata nor a client-selected GUC. Seed required locale/config and grant the trigger's exact reads/inserts before enabling it. A trigger error rolls back Auth creation; test this deliberately. A public-signup collision may leave an unbound provider identity; it never becomes staff and no missing account can enter protected domain operations.

After PENDING bind commits, the adapter calls **`inviteUserByEmail` for the already-created unconfirmed identity**, with allowlisted activation redirect and no authoritative metadata in `data`. Before delivery, read the planned UUID and private marker; verify the returned UUID again afterwards. The official [invite handler](https://github.com/supabase/auth/blob/master/internal/api/invite.go) has an existing-unconfirmed-user path; that source is not a guarantee of the project's deployed version/configuration. A1 must prove this path preserves UUID/marker and works with the configured email/confirmation settings. Do not fall back to invite-as-create or invent a second identity. `createUser` itself [does not send the invitation](https://supabase.com/docs/reference/javascript/auth-admin-createuser).

Activation callback uses an allowlisted redirect/token-verification flow and a fresh provider-verified subject, matching the bound operation/PENDING account. The trusted server activation path performs password setup with the user's verified Auth session and checks provider success before a separate DB PENDING→ACTIVE transaction. **Email confirmation alone, a browser `password_set` flag or user_metadata is insufficient.** The DB activation function is executable only by the isolated Auth adapter login, with independently checked bound subject; ordinary runtime cannot activate accounts. A crash after password setup but before DB activation leaves PENDING; retry through a verified session repeats the provider password-setup step before idempotent activation. No password/token/action link is persisted or logged. DISABLED never activates or re-enables through invite/recovery. Re-enabling remains the existing checked Admin operation.

Recovery reuses the same request and UUID, rechecks authority and retries only the unfinished boundary. No automatic deletion/recreation or release of email reservation on timeout. CREATED-but-unbound is recoverable by exact UUID+marker; bound-but-unsent stays PENDING and permits bounded resend. If invite was consumed but activation interrupted, verified password recovery/setup targets the same UUID and PENDING activation route; never create another account. Expired links use bounded resend/recovery. Mail may be delivered at least once: lost response does not prove non-delivery. Serialize DB state/version updates, but do not hold a DB lock during mail calls or promise exactly-once provider delivery. Initial retry budget: at most three transient API attempts per invocation with jitter/backoff; conflicts require lookup, permanent config/identity mismatch stops. A later explicit retry resumes the same operation.

The adapter owns the provider admin secret and narrowly privileged DB login; ordinary request runtime has neither. Provider result validation and the password-success fact are trusted backend responsibilities, not facts SQL can infer from Auth email. A1 must exercise this full boundary; no direct browser activation function is granted.

## 5. FTR-03 — roles, policies and function boundaries

Use non-owner `lingora_runtime` LOGIN/NOSUPERUSER/NOBYPASSRLS, a separate migration credential, a separate assembly login and an isolated Auth-adapter login. Function owners below are existing-design NOLOGIN/NOSUPERUSER/NOBYPASSRLS principals, distinct from table owner. Runtime has no membership or SET ROLE path into them. ENABLE + FORCE RLS applies to every application/private table; provider-managed tables use provider controls. Revoke default/PUBLIC function EXECUTE and unwanted schema/table/default grants; unexposed `app`/`app_private` does not replace grant/RLS enforcement.

| Principal | Allowed boundary | Explicit exclusion |
|---|---|---|
| runtime | Safe projected reads permitted by current actor; EXECUTE named actor commands | No generic private-table reads, evidence/payload mutation, DDL, role assumption or arbitrary SQL endpoint |
| authz_reader | Nonrecursive own-subject account id/role/status lookup under its own SELECT policy | No arbitrary-account API or mutation |
| scoped_locker | Narrow scoped parent/source row locks using the matrix below | No actual UPDATE/INSERT/DELETE, no grading columns |
| content_writer | Current assigned Teacher's unfrozen payload/keys, desired omission and allowed draft association removal | No lifecycle approval/publication or assembled membership mutation |
| transition_writer | Teacher submit and Admin checked lifecycle/config/status commands within their separate authorization branches | No Admin authored payload or learner evidence editing |
| learner_writer | Owned context/open attempt/evidence/SRS command writes and idempotency | No foreign rows, arbitrary schedule/score/result injection or completed-record rewrite |
| grader | Pinned grading inputs, internal finite outcomes and aggregate results for checked callers | No raw key/rubric/per-item assessment output to runtime/browser |
| fingerprint_reader | Six exact relation/column sets and published/exposed existence tests already defined in security §RDR-03 | No prompts, keys, accounts or writes; only publication owner can call checker |
| assembly_writer | System-only complete submitted-source validation, version/member INSERT and SYSTEM audit | No Teacher/Admin composition API, membership UPDATE/DELETE, raw keys or account mutation |
| auth_provisioner | Private reservation/bind/PENDING activation/trigger branches with independently verified authority | No ordinary runtime activate/bootstrap or adoption of public identity |
| audit_writer | Sanitized append of ACCOUNT / VERIFIED_AUTH_SUBJECT / SYSTEM events through checked paths | No client-chosen actor kind, token/answer-key log or UPDATE/DELETE |

All SECURITY DEFINER functions have empty search_path, fully qualified/static SQL, explicit caller EXECUTE and bounded outputs. Safe views use security-invoker behavior on the actual supported PostgreSQL version, or are replaced by checked DTO functions; a table-owner view must not bypass the caller's RLS. Policy helper ownership/calls cannot recurse through accounts or source membership. Function owners independently have their own required SELECT/UPDATE policies; a caller's grants do not propagate across definer changes. Service branches authenticate the dedicated **session login**, not a user-writable `is_system` flag. No browser anon/authenticated role has application-table or privileged function access.

### Lock-only policy matrix

For every row in this matrix: grant SELECT of only id, scope/authorization fields and the listed lock column; grant UPDATE of that column only. Install **SELECT USING(scope) and UPDATE USING(same scope)**, with **UPDATE WITH CHECK(false)** for a lock-only principal. Actual domain writes use a different writer/policy, not this role. The executor emits a static ordered row-lock query; it never increments the lock column merely to lock it. If a table has row_version, use that column; otherwise use id as the lock privilege column, with no allowed id update.

| Locked rows / owner | Minimum scope for both USING predicates | Lock column |
|---|---|---|
| accounts / learner_writer own-parent branch | Verified ACTIVE Learner and `id = subject`; policy branch also rejects any actual account write | row_version |
| accounts / scoped_locker | Own command actor; checked Admin target only LEARNER/TEACHER per UC-13; bind/activation uses Auth-adapter-specific scope | row_version |
| courses / scoped_locker | ACTIVE authorized actor and matched active course; FIRST_CONTEXT_CREATE uses learnable language/config **without needing a context row**; existing-context branch independently SELECTs owned context | row_version |
| languages/frameworks/levels/units / scoped_locker | Checked Admin configuration scope, affected course set already locked; no general catalog edit permission | id or row_version if defined |
| assessment_blueprints / scoped_locker or assembly_writer | Actor's assigned requirement/Admin governance scope, or dedicated assembly login + requested scope/generation | row_version |
| content_assignments / scoped_locker or assembly_writer | Current Teacher assignment or Admin governance; assembly exact contributing Lesson scope | row_version |
| lessons, lesson_revisions / scoped_locker or assembly_writer | Exact command source/target in locked course/assignment; **submitted/frozen/approved/published rows remain lockable** for the relevant review/publish/assembly command | row_version |
| item_identities, item_revisions, assessment_versions / scoped_locker or assembly_writer | Same exact relevant source/version/membership and course/blueprint scope; no editable-state-only predicate on frozen sources | row_version where defined, otherwise id |
| learning_contexts, lesson_attempts, assessment_attempts, srs_cards / learner_writer | Owned actor/context or own account-global SRS scope, matching command lifecycle | Existing row_version/id lock grant plus separate narrow **writer** WITH CHECK for genuine command updates; do not apply lock-only false to all writer operations |
| media_assets / scoped_locker | Authorized binding/avatar/reference command or dedicated retirement worker; READY/nonretired required when acquiring a reference | row_version if defined, otherwise id |

Lock-only account branch of learner_writer is isolated from its genuine context/attempt/card write policies; no permissive ALL policy may accidentally OR an unrestricted write into that table. Scoped helper dependencies get explicit narrow SELECT/policies (including owner context lookup, catalog matching, exact source SUBMIT/review/episode membership), not recursive or wildcard grants. A2 records the exact generated column/policy/function matrix and verifies every frozen/service branch. [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/15/sql-createpolicy.html) documents the SELECT and UPDATE USING requirements for locking reads and why WITH CHECK false can deny actual updates.

## 6. Single canonical transaction, lock and retry contract

### 6.1 Trusted subject and connection

The server verifies Auth with the provider, then a single Prisma interactive `$transaction` sets a parameterized `set_config('app.auth_subject', verified_uuid, true)`. No subject from request body/header/user_metadata; missing/malformed UUID denies. Every protected query/command uses that transaction client; helpers use `current_setting(..., true)` and fresh account status. No nested global-client call or session SET. This GUC is trusted server context, **not** protection against a stolen runtime DB credential.

Baseline isolation is **READ COMMITTED**. Provider/Storage/network calls stay outside transactions. Session pooling is the selected first runtime transport, custom runtime username/password with a separate direct/migration connection; transaction pooling is not silently enabled. Pin actual connection options in A2. Pool size/timeouts are bounded per process and recorded; PoC must fail cleanly on timeout and prove subject cleanup after commit/rollback/errors. See [Prisma transactions](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions), [SET LOCAL](https://www.postgresql.org/docs/15/sql-set.html) and [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres).

### 6.2 LOCK-01 — the only ordering authority

Every explicit row lock and implicit mutation lock follows this **total rank**; skip unused ranks, sort distinct UUIDs ascending within each table, and never acquire an earlier rank afterwards. Discover candidate IDs without locking, acquire the required scope in order, then recheck membership/generation under locks; changed scope aborts/retries with a newly discovered set. Do not acquire a newly discovered lower-rank row mid-command.

| Rank | Row family, table order inside rank |
|---|---|
| 10 | `accounts` — actor **and any distinct target** together, sorted UUID; recheck actor after all locks |
| 20 | `courses` — all affected courses, sorted UUID |
| 30 | Catalog configuration rows when mutated: `languages` → `frameworks` → `levels` → `units` |
| 40 | `assessment_blueprints` |
| 50 | `content_assignments` |
| 60 | `lessons` → `lesson_revisions` |
| 70 | `vocabulary_concepts` → `item_identities` → `item_revisions` → `assessment_versions` |
| 80 | `learning_contexts` |
| 90 | `lesson_attempts` → `assessment_attempts` |
| 100 | `srs_cards` — existing cards sorted UUID; new enrollment keys sorted `(learner_id,vocabulary_id)` |
| 110 | `media_assets` |
| 120 | Fingerprint transaction advisory locks, sorted `(hashtext(fingerprint), fingerprint)`; deduplicate exact fingerprints |
| 130 | `provisioning_requests`, terminal coordinator scope; never followed by curriculum locks |

Provisioning coordinator row locks have **terminal rank 130**, after any required account locks; that path never then locks curriculum rows. Receipts/reviews/history/responses/bindings/completions/results/audit are append or guarded child operations after their locked parents; do not introduce a pre-parent lock on a receipt or child. New rows that are not yet visible do not require a preexisting-row lock, but all referenced mutable domain parents follow the order. FK enforcement can take internal KEY SHARE locks: stable referenced keys never change; use **FOR NO KEY UPDATE** for existing mutable parent serialization to avoid gratuitous conflict with those FK checks. There is no key-changing/delete command requiring a later lock upgrade. A2 also tests FOR UPDATE/SHARE policy behavior; stronger locks, if ever needed, must be acquired upfront at the same rank, with a demonstrated reason. PostgreSQL [lock compatibility/order](https://www.postgresql.org/docs/15/explicit-locking.html) supports this choice; A4 must test actual SQL/trigger lock traces.

Vocabulary enrollment takes existing vocabulary locks at rank 70 **before** context/attempt/card locks; it never discovers and locks concepts after locking an attempt. A source/content command touching a blueprint must acquire it before assignment/source locks. Changes to catalog eligibility/gates/order lock all affected courses before catalog rows; discover/recheck the course set to handle concurrent course creation. Coarse course serialization is deliberately retained until A4 measures contention.

Examples are subsequences, not alternative rules:

- Start/finalize Lesson: accounts → course → Lesson/revision/pinned items and vocabulary if required → context → attempt → cards → assets if needed.
- Submit/approve/publish/assembly: accounts if an actor exists → course(s) → blueprint(s) → assignments → Lesson/source/item/version rows → assets → fingerprint advisory locks when publishing. System assembly skips actor accounts and uses its own service authority.
- SRS-only: account → cards, without requiring an ACTIVE context. Profile avatar bind: account → asset. Cleanup: asset only; no parent lock afterwards. Account status: actor/target accounts together sorted, rather than actor→target in request order.

Every publication direction acquires all relevant fingerprint locks **after domain/assets locks**, runs the fixed collision check in a fresh READ COMMITTED statement after waiting, and holds advisory locks through commit/rollback. No later domain row-lock discovery or provider call. Cross-course identical first publication must serialize; hash collisions cause extra serialization only. The checker never exposes raw prompt/key data.

### 6.3 Mutation and idempotency

Authorize fresh identity/status/role and target access **before receipt lookup**. Read committed actor+command+operation receipt before expected-version/state guards: same canonical input hash returns the committed safe result; changed input conflicts. Hash includes target kind/ID, expected version, semantic payload and sorted distinct feedback IDs. A new command locks its full scope in LOCK-01 order, rechecks authorization/receipt and readiness, performs writes + required success audit + receipt atomically. A unique-race loser rolls back and starts a fresh authorized receipt read; never continue in an aborted transaction. No success receipt/audit survives rollback.

Use existing domain keys for Lesson responses, assessment submission, SRS operations and assembly input hashes; do not create duplicate receipt mechanisms for them. Desired-state omission checks expected **parent** version before no-op, changes only its owned unfrozen draft contribution and bumps parent version once; submitted sources never reopen. All child edits/removal lock and version-check the parent. Version replacement clears the previous active marker and installs the new one in one transaction under the shared scope lock; validation failure preserves the old version. No temporarily committed zero/two active versions.

Retry the whole DB command at most three times for identified deadlock/serialization errors with jitter, preserving operation key and input; lock/statement timeout produces a safe retryable outcome, not an endless retry. Map actual Prisma/SQL error codes in A2/A4. Version/authorization/readiness conflicts are not automatically replayed with a newer version. Unknown commit outcome reconciles by receipt/domain key before any new mutation. No provider retry is hidden inside a retried DB transaction.

## 7. Stages, gates and work packages

All execution checkboxes below are **unchecked**. Writing this document does not start them. A work package has one file-area owner; schema/migration integration is always serialized even when other work is parallel.

### P0 — establish reproducible disposable baseline

- [ ] **WP-00 — provenance and environment contract.** Own dependency manifests/test harness setup, current-source evidence and environment allowlist. Hash the current 34-table catalog/security/ERD and matching actual outputs after source/parity checks; leave old review evidence unchanged and explicitly label stale historical hashes. Record dirty input baseline, exact versions and known CR2-04 gap. Bind a **new disposable** Supabase project/local full stack, a separate disposable shadow DB/project when needed, test mail sink/authorized test inbox and synthetic data only. Never load inherited `.env`/credentials or unknown project IDs. Setup/cleanup aborts on unallowlisted project identity; record exact ownership and disposal scope. No blanket cleanup of unrelated Auth/Storage objects.
- **Exit G0:** reproducible minimal harness, provider/schema prerequisites, secret-free environment identity/version manifest and future test commands exist. No fake application scaffold completeness. A plain Postgres mock alone cannot satisfy provider A1/A2.

### P1 — feasibility, before broad schema or feature implementation

These are small representative slices/fixtures, not the full 34-table implementation. A3 includes a representative baseline plus **one real incremental migration**; complete-schema replay remains a later gate.

| Work package | Dependency / ownership | Mandatory experiments and acceptance evidence |
|---|---|---|
| **WP-01 / A1 — Auth lifecycle** | G0; Auth adapter + minimal accounts/reservation/trigger fixtures; schema owner integrates fixture DDL | Full contract §4 with Admin bootstrap/Teacher path, public signup, exact server UUID/marker, existing unconfirmed invite, callback/password/ACTIVE. Inject lost response after provider create, local bind rollback, invite timeout, consumed/expired link, password success before DB failure; retry converges to one UUID/PENDING or ACTIVE row. Parallel duplicate requests and public signup race never elevate another identity. Confirm READY semantics, metadata spoof rejection, missing/PENDING/DISABLED domain denial, trigger failure rollback and no credentials in logs. Capture redacted API sequence, SQL states/counts, failure points and actual provider version/config; no assertion based only on mocks. |
| **WP-02 / A2 — Prisma/RLS/locks** | G0 + schema-owner-supplied minimal fixture; DB wrapper/security owner | Actual Prisma 6.19.3 custom runtime login via selected session pooler; FORCE RLS on representative public/private tables. Two subjects and concurrent pooled transactions prove own rows only; missing/malformed subject denies; commit/rollback/error/timeout never leaks subject to a reused connection. Query catalogs for login/owners/NOBYPASS flags, role memberships, grants, policy expressions and definer search_path/EXECUTE. Test row locks on own account, first/existing context course, frozen sources, blueprint/version and media; permitted SELECT + lock succeeds while genuine UPDATE by lock-only owner fails. Foreign source and service-flag spoof deny; dedicated assembly branch works without user subject; runtime cannot SET ROLE/read secrets/DDL/activate accounts. Test real writer updates separately so WITH CHECK false does not accidentally disable them. Record PID/transaction boundaries and observable two-connection blocking, not just returned SELECT data. |
| **WP-03 / A3 — migration feasibility** | G0; single schema/migration owner | Fresh disposable baseline replay with provider Auth/Storage prerequisites and external auth FK, composite FK/unique, nullable circular pointer, CHECK, partial unique, RLS, function/trigger/grant. Apply with Prisma migrate deploy; generate/validate client and run a real transaction. Then create one reviewed incremental Prisma + custom SQL migration on a separate disposable shadow workflow: add the catalog's nullable `accounts.display_name` to the minimal fixture via Prisma and add/update its SQL-owned immutable role/identity guard plus restricted grants. This is a representative fixture delta, not an extra product column. Apply to populated synthetic data and replay the **entire new chain** into a fresh disposable target. Compare columns/types/defaults/FKs/checks/indexes, function bodies/owners/grants/policies and retained IDs/data; unsupported objects remain present. Verify drift reports are understood, external provider tables were not generated/dropped and migration failure is surfaced without a falsely successful history. Capture exact commands/stdout/exit codes, SQL checksums, Prisma migration status and normalized catalog diffs. |

**Exit G1 = A1 PASS AND A2 PASS AND A3 PASS**, each independently reviewed against observable evidence from the intended connection/provider mode. Static PASS, API type checking, SQL parsing or a role-owner superuser session cannot satisfy G1. Failed provider UUID/invite semantics or unachievable restricted-role permissions stop the affected feasibility package and trigger a bounded contract revision; no email-only adoption, BYPASSRLS workaround or full design restart. Only a demonstrated architecture/product change is escalated separately to PO.

A1/A2 fixtures may be authored concurrently only in disjoint files and isolated projects/DBs; A3 owns shared migration integration. They do not concurrently edit one schema/migration or reuse conflicting role names in one cluster. All three must be rerun on the integrated minimal baseline before G1 is accepted.

### P2 — executable relational/security baseline

- [ ] **WP-04 — 34-table schema and migration slices.** Depends G1. Schema owner implements catalog structure in dependency order (§2), supported Prisma mapping plus custom constraints, immutable guards, partial unique active versions, exact target tuple FKs and stable code protections. Keep original historical chain untouched. Add bounded config seed (locale/language/framework/levels/course); fixture counts/gates are configuration, not platform constants. No production importer/reset.
- [ ] **WP-05 — full principal/function matrix and transaction boundary.** Depends G1 and relevant WP-04 structure. Security owner implements §5 grants/policies/checked functions and server-only transaction exports, no default access. Record each function caller→owner→table/column/policy path and each command's LOCK-01 subsequence. Scope helper inputs independently; service and missing-account audit paths are distinct. Auth adapter implementation follows proven A1 contract, not just its fixture.
- **Exit G2:** complete fresh replay + second incremental rehearsal, Prisma validation/generation and client transaction; normalized catalog inventory matches all 34 tables and expected constraints/security objects. Negative FK/tuple/role/cycle/immutable/code-update tests actually fail, staged circular inserts succeed. Actual runtime login cannot bypass RLS, table-owner/function privilege boundaries or mutate evidence. Re-run A1/A2 against integrated baseline; CR2-04 helper/static labels cannot substitute for these tests. All enabled commands have complete policy/lock/receipt coverage; unimplemented commands remain ungranted, not permissive stubs.

### P3 — one publishable content path, then assessment assembly

- [ ] **WP-06 — assigned Lesson draft → published revision.** Depends G2. Content owner implements assignment/history, current Teacher edit/preview, omitted assessment contribution desired state, parent versions, submit/freeze/review and Admin approval/publication. Complete one vertical path with key/media/readiness validation; Admin cannot author payload. Keep FTR-01 checks at every boundary. Source reassignment preserves attribution; requirement generation change invalidates stale pins.
- [ ] **WP-07 — submitted contributions → system assessment version.** Depends G2 and WP-06 submitted-source contract/fixtures. Assembly owner implements deterministic complete selection, greatest submitted revision + omitted/rejected filtering, blueprint count/coverage, exact source submission/episode pins, input-hash idempotency, immutable membership and SYSTEM audit. Admin review/approve/publish calls separate lifecycle functions, checker and active switch; no manual composition endpoint or generic secret read.
- [ ] **WP-08 — private media binding/retirement.** Depends G2; integrates with WP-06/07 before publication acceptance. Storage owner implements private avatar/audio buckets, immutable keys/validated metadata, authorized streams, parent→asset reservation, retired reference refusal and provider deletion after DB commit/final check. Prove current references cannot race cleanup; no published object overwrite. Reuse provider Storage, no new media service.
- **Exit G3:** zero-core Draft saves; submit/approve/publish zero-core reject atomically; N>=1 path publishes and safe payload excludes keys. Test stale versions/receipts, frozen edit denial, omission/include retries, exact provenance and same-course pins. Assembly produces one complete version or no version; Teacher cannot read/modify full assembled exam. Race both fingerprint publication directions across different courses; only a valid serial outcome commits. Failed replace/publish preserves old active version, audit/receipt rollback. Relevant DB43/RDR acceptance cases execute; no merely copied PASS.

### P4 — learner vertical slices and integrated concurrency

- [ ] **WP-09 — context + Lesson start/answer/completion.** Depends G2, G3 Lesson/media fixture. Learner owner restores only required Next.js server/route boundary and verifies real Auth + wrapper. Context create/resume/pause/select-start enforces unique learner/language, max-two ACTIVE, coming-soon and current curriculum policy. Start rechecks N>=1 and pins exact membership. Answer/one-retry/N+K, completion/redo, preserved history and core-vocabulary enrollment commit correctly. Progress/latest/best/streak are derived under approved rules.
- [ ] **WP-10 — SRS and supplementary focus.** Depends G2 + WP-09 enrollment/session contract; may develop against accepted fixtures before WP-09 integration. SRS owner implements one learner+concept card, Policy B scheduling, idempotent operation and at-most-once same-session reinforcement with no second schedule write. Context PAUSED does not revoke account-global SRS. Focus affects next supplementary session only, no due-list browsing or scored/core composition mutation.
- [ ] **WP-11 — Placement/Level-up execution.** Depends G3 assessment/media fixture + WP-09 context contract. Assessment owner pins version, accepts one keyed final submission, grades privately and atomically persists aggregate result/progression. No result for unfinished attempt, foreign version membership or raw answer/correctness leak after submit. Current Level-up readiness is rechecked separately from the pinned assessment content.
- [ ] **WP-12 / A4 — integrated race and failure rehearsal.** Depends integrated WP-06–11. Verification owner runs real independent connections with barriers, both schedules and injected rollback/unknown-commit outcomes: max-two contexts; concurrent answer/complete/redo/SRS; publish vs withdrawal/reassignment/config change; assembly vs source correction; media bind vs retire; disable vs protected command; cross-course fingerprint race. Capture lock traces and ensure no inverse rank, partial evidence or duplicate first completion/result/schedule. Measure coarse course lock contention on declared synthetic cardinality/concurrency and record waits/latency/timeouts. Do not loosen locks for an unmeasured optimization; any change repeats affected race tests.
- **Exit G4:** authenticated end-to-end smoke for Teacher→Admin publish→Learner completion/SRS and assembled Placement/Level-up, role-isolation negatives, deterministic expected scoring/evidence counts, no secrets in UI/network/logs, bounded deadlock/timeout retry and pooled subject isolation. A4 observed schedules, counts and commit/rollback states are reviewable; generic test runner success alone is insufficient.

### P5 — staging rehearsal and separate live proposal

- [ ] **WP-13 — non-live release rehearsal.** Depends G4. Integration owner runs fresh deploy and incremental deploy to a disposable/staging environment with approved synthetic data; verifies config separation, deployed runtime principal, Auth redirects/email, private Storage, full catalogs and smoke. Restore a backup into another isolated target and verify UUID/history/object hashes. Exercise failure/rollback without overwriting new evidence. Log migration checksums and release/runtime versions; remove secrets from client bundles.
- **Exit G5:** reviewable non-live readiness packet and restore/recovery proof. Produce a separate live inventory/preservation/import/cutover proposal naming environment, permissions, retained IDs/history, legacy mapping, rollback/delta preservation and owner approvals. **G5 does not authorize live connection, reset or deployment.** Unknown legacy data is not treated as disposable; never fabricate TARGET attempt/score/SRS evidence from old overloaded rows.

## 8. Safe parallel work and integration order

1. G0 precedes all experiments. A1/A2/A3 can overlap only with the fixture/environment separation in P1; schema integration and final combined G1 run are sequential.
2. After G1, WP-04 owns all schema/migrations. WP-05 can draft disjoint runtime/security tests and adapter files against frozen signatures, but its SQL goes through the schema owner, then one G2 integration. No two packages append migration IDs or modify schema.prisma concurrently.
3. After G2, content draft/review code and media worker can proceed in disjoint files with fixed reference/retirement contracts. Assembly consumes the accepted submission contract; it cannot invent source provenance. Publish integration follows both.
4. After G3, learner Lesson/SRS/assessment adapters can progress against fixed DB command/DTO contracts and synthetic fixtures. Context/session shared files have one owner; route ownership is disjoint. Integrate context/Lesson first, then SRS and assessment; run combined A4.
5. No worker changes role/grant/function signature, lock ranks or shared migration ownership privately. A bounded integration change updates this spec and affected tests; product/architecture behavior changes are separately reported.

## 9. Evidence, acceptance and remaining blockers

Each future gate packet records commit + dirty diff, exact dependencies/provider versions, disposable project identity (no credentials), prerequisites, command, exit code, redacted observed output, expected result, counts/state before/after, SQL/catalog/checksum snapshots and the reviewer disposition. Race evidence identifies two independent connections, barriers/waits and commit/rollback outcome. Failure-injection tests name the boundary, then demonstrate recovery with the same operation identity. Do not record passwords, JWTs, invite links, keys or real learner answers. Mocks are supporting unit tests, not integration acceptance.

Future reproducible invocations are `npm run test:db:a1 -w lingora-admin`, `npm run test:db:a2 -w lingora-admin`, `npm run test:db:a3 -w lingora-admin`, `npm run test:db:integrity -w lingora-admin`, `npm run test:db:security -w lingora-admin`, `npm run test:db:concurrency -w lingora-admin` and `npm run test:db:smoke -w lingora-admin`; **these scripts do not exist and did not run in this spec task**. G0 implementation must wire each command and refuse unallowlisted environments. Prefer the Node test runner for minimal provider/SQL integration harness; reuse installed project test tooling when actual scaffolds need it, without adding a framework solely for these PoCs. App build/typecheck/lint are restored only with actual manifests and invoked for slices that exist. Prisma validation/generation uses the Admin-owned schema; migration apply commands require explicit disposable environment binding before invocation.

Disposition/acceptance checklist:

- FTR-01: product decision closed; implementation acceptance requires G3 readiness and G4 start/finalization tests.
- FTR-02: technical contract selected; runtime closure requires A1, then integrated Auth regression at G2/G5.
- FTR-03: technical contract selected; runtime closure requires A2, then all concrete helper/policy branches at G2/A4.
- A1/A2/A3 are **NOT EXECUTED**. No phase is accepted from historical PASS/static checks. Full runtime is **NOT IMPLEMENTED**, live database **UNVERIFIED**.
- No new architecture/product blocker was established by this recheck. The remaining technical unknowns have explicit experiments and stop conditions above, not PO implementation questions. Existing nullable purpose/configuration proposals do not become newly approved product behavior through this spec; only already authorized optional preferences/configuration are used by slices, and any later feature requiring a distinct product timing/default decision stays out of that slice.

The old high-level plan was insufficient for greenfield file ownership, Auth delivery/recovery, lock-only RLS, integrated migration replay and a single lock order. This spec supplies those contracts without changing the stack, table count or accepted assessment ownership. End this task after issuing the spec; no automatic execution or delegation.

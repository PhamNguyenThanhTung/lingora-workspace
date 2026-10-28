# Lingora A3 Minimal Representative Fixture Interface

**Package:** P1-03a (A3 Minimal Fixture Baseline)  
**Authority:** `plans/2026-10-26-p1-continuation-spec.md` (AC-03, AC-04) and `plans/2026-10-22-database-runtime-implementation-spec.md` §§2, 4–7, 9.  
**Status:** FROZEN INTERFACE FOR A1 / A2 CONSUMERS (Corrected Round 1).

---

## 1. Fixture Entrypoints & Helper API

Downstream consumer suites (A1, A2) must import the frozen A3 fixture helpers from:
```javascript
import {
  setupA3Baseline,
  cleanupA3Baseline,
  validatePrismaContext,
  runGuardedPrismaCommand,
  createGuardedPrismaClient,
  getRuntimeCredentials,
  reconcileClusterRoles,
  disposeRuntimeCredentials,
} from '../a3/prisma-helper.mjs';
```

### 1.1 `setupA3Baseline(testContext, options)`
- **Purpose:** Deterministic, serialized setup lifecycle for downstream consumers and A3 tests. Under PostgreSQL cluster advisory lock (`7103001`), executes:
  1. `reconcileClusterRoles(testContext)` (creates unexposed schemas, 3 LOGIN, 10 NOLOGIN roles, mode 0600 credentials);
  2. `runGuardedPrismaCommand(testContext, ['migrate', 'deploy'])` (applies baseline migration);
  3. `runGuardedPrismaCommand(testContext, ['generate'])` (generates Prisma Client);
  4. Records atomic state in `<runDir>/a3-baseline-state.json`.
- **Concurrency & Safety:** Serializes multiple callers via cluster-level advisory locking; idempotent on fresh or already-provisioned targets.

### 1.2 `cleanupA3Baseline(testContext, options)`
- **Purpose:** Clean teardown of A3 fixture state and credentials.
- **Actions:** Removes `<runDir>/a3-baseline-state.json` and calls `disposeRuntimeCredentials(testContext)`.

### 1.3 `runGuardedPrismaCommand(testContext, args, options)`
- **Purpose:** Executes pinned local Prisma 6.19.3 CLI commands in a clean child environment with explicit `schema.prisma` and cwd `lingora-admin`.
- **Operation Allowlist:** Explicitly permits only `validate`, `generate`, `migrate deploy`, `migrate status`. Rejects `db push`, `migrate dev`, `migrate reset`, `db execute`, and any unreviewed subcommands.
- **Security:** Revalidates parent run lock before spawn. Strips ambient `DATABASE_URL` and `PG*`. Injects only validated operation-specific target URL. Rejects caller CLI flags (`--url`, `--database-url`, `--shadow-database-url`, `--config`, `--schema`) and option overrides before process construction. Sanitizes stdout/stderr with credential redaction.

### 1.4 `createGuardedPrismaClient(testContext, options)`
- **Purpose:** Returns an instantiated `@prisma/client` bound to the validated test target under the specified role (`role: 'runtime'` by default for `lingora_runtime`, or `'assembly'` / `'auth_adapter'`).
- **Security:** Validates parent lock before client construction. Reads runtime credentials from private run storage (mode 0600, UID verified, symlink rejected). Never uses administrative credentials for runtime operations.

### 1.5 `disposeRuntimeCredentials(testContext)`
- **Purpose:** Securely unlinks `<runDir>/runtime-credentials.json` upon run teardown after validating path containment and non-symlink status.

---

## 2. Seed & Lifecycle Rules on Owned Targets

1. **Target Provenance:**
   - Runs exclusively against a fresh owned disposable stack allocated via `node lingora-admin/tests/database/env/stack-manager.mjs start --new-run`.
   - Never inspects, adopts, mutates, or connects to `run-823006cc1b9e0057` or any prior/unknown target.
   - Prohibits live, production, or remote database access.
2. **Setup Lifecycle:**
   - Step 1: Allocate fresh run -> `node lingora-admin/tests/database/env/stack-manager.mjs start --new-run`.
   - Step 2: Consumer calls `await setupA3Baseline(ctx)` in `before()` hook.
   - Step 3: Execute guarded tests -> `npm run test:db:a3 -w lingora-admin -- --run <run-id>`.
   - Step 4: Consumer calls `await cleanupA3Baseline(ctx)` in `after()` hook.
   - Step 5: Clean disposal -> `node lingora-admin/tests/database/env/stack-manager.mjs destroy --run <run-id>`.
3. **Prohibited Operations:**
   - Zero `db push`, `migrate reset`, `migrate dev`, or blanket schema drops.
   - If shadow database ownership is unproved, tests fail closed with `SHADOW_TARGET_UNPROVED` rather than resetting the main target.

---

## 3. Supported Principals & Credential Handoff

| Principal | Role Type | Mode | Attributes | Handed-Off Credential Location |
|---|---|---|---|---|
| `postgres` | LOGIN | Direct setup/migration | SUPERUSER | `testContext.credentials.databaseUrl` |
| `lingora_runtime` | LOGIN | Non-owner app runtime | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | `<runDir>/runtime-credentials.json` (mode 0600) |
| `lingora_assembly` | LOGIN | System assembly service | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | `<runDir>/runtime-credentials.json` (mode 0600) |
| `lingora_auth_adapter` | LOGIN | Isolated server Auth adapter | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | `<runDir>/runtime-credentials.json` (mode 0600) |
| `lingora_authz_reader` | NOLOGIN | Definer function owner | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Definer function ownership) |
| `lingora_scoped_locker` | NOLOGIN | Scoped locker principal | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Principal-specific policy) |
| `lingora_content_writer` | NOLOGIN | Definer function owner | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Definer function ownership) |
| `lingora_transition_writer`| NOLOGIN | Transition writer | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Principal-specific policy) |
| `lingora_learner_writer` | NOLOGIN | Learner writer | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Principal-specific policy) |
| `lingora_grader` | NOLOGIN | Grader principal | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Principal-specific policy) |
| `lingora_fingerprint_reader`| NOLOGIN | Collision checker owner | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Definer function ownership) |
| `lingora_assembly_writer`| NOLOGIN | Assembly writer | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Principal-specific policy) |
| `lingora_auth_provisioner` | NOLOGIN | Auth trigger owner | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Definer function ownership) |
| `lingora_audit_writer` | NOLOGIN | Audit writer | NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE, INHERIT | N/A (Principal-specific policy) |

---

## 4. Stable Synthetic Identifiers & Seed Data

The baseline migration seeds immutable reference data with stable synthetic UUIDs:

### 4.1 Languages (`app.languages`)
| ID | Code | Learnable | UI Locale | Names (JSONB) |
|---|---|---|---|---|
| `00000000-0000-0000-0000-000000000001` | `en` | `true` | `true` | `{"en": "English", "vi": "Tiếng Anh"}` |
| `00000000-0000-0000-0000-000000000002` | `vi` | `false` | `true` | `{"en": "Vietnamese", "vi": "Tiếng Việt"}` |

### 4.2 Frameworks (`app.frameworks`)
| ID | Code | Version | Names (JSONB) |
|---|---|---|---|
| `00000000-0000-0000-0000-000000000010` | `CEFR` | `2020` | `{"en": "Common European Framework of Reference", "vi": "Khung tham chiếu chung Châu Âu"}` |

### 4.3 Levels (`app.levels`)
| ID | Framework ID | Code | Position | Label (JSONB) |
|---|---|---|---|---|
| `00000000-0000-0000-0000-000000000021` | `...0010` | `A1` | 1 | `{"en": "Beginner", "vi": "Mới bắt đầu"}` |
| `00000000-0000-0000-0000-000000000022` | `...0010` | `A2` | 2 | `{"en": "Elementary", "vi": "Sơ cấp"}` |
| `00000000-0000-0000-0000-000000000023` | `...0010` | `B1` | 3 | `{"en": "Intermediate", "vi": "Trung cấp"}` |
| `00000000-0000-0000-0000-000000000024` | `...0010` | `B2` | 4 | `{"en": "Upper Intermediate", "vi": "Trung cao cấp"}` |

### 4.4 Courses (`app.courses`)
| ID | Language ID | Framework ID | Default Start Level | Active | Curriculum Gen |
|---|---|---|---|---|---|
| `00000000-0000-0000-0000-000000000030` | `...0001` (`en`) | `...0010` (`CEFR`) | `...0021` (`A1`) | `true` | 1 |

---

## 5. Domain Constraints & Invariant States

- **Three Fixed Business Roles:** `ADMIN`, `TEACHER`, `LEARNER` (one role per account; enforced by `accounts.role CHECK`).
- **Account Statuses:** `PENDING`, `ACTIVE`, `DISABLED` (enforced by `accounts.status CHECK`).
- **Omission Contract:** `accounts.display_name` is strictly omitted from the baseline; reserved for AC-09 incremental migration.
- **Content Availability:** `PLANNED`, `AVAILABLE`, `WITHDRAWN`.
- **Revision Statuses:** `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`, `WITHDRAWN`.
- **Blueprint Purposes:** `PLACEMENT`, `LEVEL_UP`.
- **LearningContext Statuses:** `ACTIVE`, `PAUSED` (at most 2 ACTIVE per account); study focus: `BALANCED`, `VOCABULARY`, `GRAMMAR`, `READING`, `LISTENING`.
- **MediaAsset Kinds:** `AVATAR`, `CONTENT` (enforced mutually exclusive ownership via check constraint).
- **ProvisioningRequest States:** `REQUESTED`, `IDENTITY_CREATED`, `READY`, `FAILED_RETRYABLE`.
- **AuditEvent Actor Kinds:** `ACCOUNT`, `VERIFIED_AUTH_SUBJECT`, `SYSTEM`.
- **Auth Trigger Contract:** On `auth.users` INSERT:
  - If email is present in `app_private.provisioning_requests` with state `REQUESTED`/`IDENTITY_CREATED`, the trigger skips account creation (controlled staff provisioner will bind exact UUID and PENDING account).
  - Otherwise, public signup creates a safe `LEARNER` account in `ACTIVE` status with `ui_locale = 'en'`.

---

## 6. Table & Object Inventory (20 Representative Tables)

| # | Table Name | Schema | Owner | Purpose & Consumer Need |
|---|---|---|---|---|
| 1 | `languages` | `app` | Admin Config | UI locale and learnable language definitions (A1, A2, A3) |
| 2 | `frameworks` | `app` | Admin Config | Versioned curriculum frameworks (A2, A3) |
| 3 | `levels` | `app` | Admin Config | Ordered proficiency levels within framework (A2, A3) |
| 4 | `courses` | `app` | Admin Config | Language/framework course configuration and generation lock (A2, A3) |
| 5 | `units` | `app` | Admin Config | Ordered curriculum units within course and level (A2, A3) |
| 6 | `lessons` | `app` | Admin Curriculum | Logical curriculum lesson with circular pointer to active revision (A2, A3) |
| 7 | `content_assignments` | `app` | Admin Governance | Stable Lesson package assignment to current Teacher (A2, A3) |
| 8 | `assignment_history` | `app` | Admin Governance | Append-only Teacher reassignment and scope generation episodes (A2, A3) |
| 9 | `lesson_revisions` | `app` | Teacher/Admin | Payload revisions with assignment episode provenance (A2, A3) |
| 10 | `item_identities` | `app` | Teacher Authoring | Stable exercise identity and canonical exact fingerprint (A2, A3) |
| 11 | `item_revisions` | `app` | Teacher Authoring | Prompt definitions, draft omission flags, and blueprint links (A2, A3) |
| 12 | `assessment_blueprints` | `app` | Admin Config | Requirements and coverage configuration for exams (A2, A3) |
| 13 | `assessment_versions` | `app` | System Assembly | Immutable assembled versions with partial active index (A2, A3) |
| 14 | `media_assets` | `app` | Teacher / Learner | Private avatar and content media metadata and retirement locks (A2, A3) |
| 15 | `accounts` | `app` | Auth / Admin | Identity, trusted role/status, profile and provider auth FK (A1, A2, A3) |
| 16 | `learning_contexts` | `app` | Learner Context | Learner language enrollment, start point, and progression state (A2, A3) |
| 17 | `revision_reviews` | `app` | Governance | Submission and review event provenance for lessons and versions (A2, A3) |
| 18 | `provisioning_requests` | `app_private` | Auth Provisioner | Staff provisioning idempotency, planned UUID correlation, and skip trigger (A1, A3) |
| 19 | `command_receipts` | `app_private` | Trusted Server | Command idempotency receipts for lifecycle operations (A2, A3) |
| 20 | `audit_events` | `app_private` | Audit Writer | Sanitized append-only security and domain audit log (A1, A2, A3) |

---

## 7. Unsupported SQL-Only Objects Inventory (Finding A3-R5)

The following objects are maintained in reviewed custom migration SQL because Prisma 6.19.3 cannot natively represent them in `schema.prisma`:

| Object Identifier | Database Object Type | Explicit Reason for Custom SQL Ownership |
|---|---|---|
| `accounts_id_auth_users_fkey` | FOREIGN KEY | Cross-schema foreign key to provider-managed `auth.users(id)`. Prisma does not model or manage external auth schemas. |
| `accounts_role_check` | CHECK CONSTRAINT | Enforces exactly three fixed business roles (`ADMIN`, `TEACHER`, `LEARNER`). Custom CHECK constraints unsupported in Prisma schema. |
| `accounts_status_check` | CHECK CONSTRAINT | Enforces account statuses (`PENDING`, `ACTIVE`, `DISABLED`). Custom CHECK constraints unsupported in Prisma schema. |
| `lesson_revisions_status_check` | CHECK CONSTRAINT | Enforces revision statuses (`DRAFT`, `IN_REVIEW`, etc.). Custom CHECK constraints unsupported in Prisma schema. |
| `lesson_revisions_revision_no_check` | CHECK CONSTRAINT | Enforces `revision_no > 0`. Custom CHECK constraints unsupported in Prisma schema. |
| `assessment_versions_active_blueprint_idx` | PARTIAL UNIQUE INDEX | Enforces single active version per blueprint (`WHERE is_active = true`). Partial unique indexes unsupported in Prisma schema. |
| `app_private.handle_auth_user_created` | TRIGGER FUNCTION | Autonomous trigger function on `auth.users` enforcing learner creation / staff skip logic. Database trigger functions unsupported in Prisma schema. |
| `on_auth_user_created` | TRIGGER | Database trigger on provider `auth.users`. Triggers unsupported in Prisma schema. |
| `app_private.get_auth_subject_account` | SECURITY DEFINER FUNCTION | Nonrecursive account lookup for RLS policies owned by `lingora_authz_reader`. Database functions unsupported in Prisma schema. |
| `app_private.set_draft_assessment_contribution_omitted` | SECURITY DEFINER FUNCTION | Atomic draft contribution toggle function owned by `lingora_content_writer`. Database functions unsupported in Prisma schema. |
| `app_private.check_fingerprint_collision` | SECURITY DEFINER FUNCTION | Existence-only collision checker owned by `lingora_fingerprint_reader`. Database functions unsupported in Prisma schema. |
| `ENABLE & FORCE ROW LEVEL SECURITY` | RLS ENFORCEMENT | Mandatory FORCE RLS on all 20 tables preventing superuser/table owner bypass in runtime contexts. RLS unsupported in Prisma schema. |
| Table RLS Policies | RLS POLICIES | Explicit principal-specific policies enforcing scope, read secrecy, and lock-only denial (`WITH CHECK (false)`). Policies unsupported in Prisma schema. |

---

## 8. Migration Baseline Checksum

- **Migration Path:** `lingora-admin/prisma/migrations/20261026000000_a3_baseline/migration.sql`
- **SHA-256 Checksum:** `740ba7f6bb1cd113f2f564c883f81626984c52eb32b530dd1c632bf9632cdf9c`
- **Application Method:** `prisma migrate deploy` (tracked via `_prisma_migrations`).

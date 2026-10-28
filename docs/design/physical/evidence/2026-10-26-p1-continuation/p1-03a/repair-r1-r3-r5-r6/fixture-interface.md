# A3 Fixture & Guarded Prisma Interface Specification

- Date: 2026-10-26T14:00:00+07:00
- Package: A3-MUST-R1-R3-R5-R6
- Status: FROZEN / REPAIRED (Fresh-Only / Anchored Descriptor Contract)

This document defines the executable lifecycle, helper boundary, and credential storage interfaces for A3 database baseline testing and runtime verification.

---

## 1. Fixture Lifecycle Interface (`lingora-admin/tests/database/a3/fixture-lifecycle.mjs`)

### `setupA3Baseline(testContext, options = {})`
- **Purpose**: Deterministically provisions and verifies cluster roles, unexposed schemas, baseline migration deployment, Prisma client generation, catalog parity, and credential authentication under PostgreSQL advisory lock `7103001`.
- **Preconditions**:
  - `testContext` must be valid, active, and bound to a running stack (`phase === 'BOUND'`).
  - Parent run lock (`.run.lock`) must be active, valid, mode `0600`, and UID-matching with a live holder PID.
  - Context authority must match exact lexical `owner.json` (`runId`, `stackId`, `stackName`, non-tombstone).
- **Fresh-Only Contract (M-03)**:
  - Cached authority is completely removed. Setup requires both `a3-baseline-state.json` and `runtime-credentials.json` to be absent before initialization.
  - Repeated setup on an already initialized target with a valid receipt is explicitly denied before database construction (`BASELINE_ALREADY_INITIALIZED`).
  - Stale, foreign, or corrupted receipts fail closed (`STATE_INVALID`).
  - Incomplete state (credentials present without receipt) fails closed (`STATE_INCOMPLETE`).
  - Pre-apply target inspection queries absence of application baseline tables and `_prisma_migrations` baseline records; targets that are already migrated fail closed (`ALREADY_MIGRATED`).
- **Behavior**:
  1. Preflights current authority, parent lock, provider credentials, and run directory descriptors via anchored storage before acquiring database connection.
  2. Acquires PostgreSQL session advisory lock `7103001`.
  3. Verifies absence of baseline application tables and prior migration records.
  4. Executes `reconcileClusterRoles(testContext)` to create/reconcile LOGIN and NOLOGIN roles and generate private runtime credentials.
  5. Runs guarded `prisma migrate deploy`, capturing execution command, start/end timestamps, stdout, stderr, and exit code.
  6. Runs guarded `prisma generate`, capturing execution results.
  7. Queries live migration checksum from `_prisma_migrations` and verifies exact match against SHA-256 of canonical `migration.sql`.
  8. Executes complete representable baseline parity (`verifyBaselineParity`): compares all 250 derived columns and 60 foreign keys in both directions against live catalog, and validates full SQL-only inventory (CHECK constraints, partial unique indexes, functions, triggers, RLS policies, and grants).
  9. Authenticates all three generated LOGIN credentials (`lingora_runtime`, `lingora_assembly`, `lingora_auth_adapter`) via guarded pg connections, verifying session identity and non-superuser/non-bypassrls attributes.
  10. Atomically writes receipt `a3-baseline-state.json` via race-safe anchored temporary file (mode `0600`), fsync, and atomic rename, recording stack incarnation (`stackId`), `stackName`, source hashes, migration checksum, catalog tables, and credentials digest.
  11. Releases advisory lock in `finally` block and closes admin verification client.
- **Returns**: `{ status: 'READY', source: 'PROVISIONED', runId, stackId, stackName, stateFile, deployResult, generateResult, migrationRecord, parityResult }`

### `cleanupA3Baseline(testContext, options = {})`
- **Purpose**: Disposes private credentials and baseline state files from private run storage after all client consumers have disconnected.
- **Preconditions**:
  - `testContext.assertLockHeld()` enforced.
  - Consumers (Prisma clients, pg Clients) must already be disconnected.
- **Behavior**:
  1. Validates authority and parent lock under anchored directory descriptor.
  2. Unlinks `a3-baseline-state.json` via anchored descriptor.
  3. Unlinks `runtime-credentials.json` via anchored descriptor.
  4. Verifies postcondition absence (`ENOENT`) on both files via anchored descriptor.
- **Returns**: `{ status: 'CLEANED', stateFileRemoved, credentialsDisposed, runId, stackId, startedAt, finishedAt }`

---

## 2. Guarded Prisma Helper Interface (`lingora-admin/tests/database/a3/prisma-helper.mjs`)

### Permitted CLI Operation Tuples (RP-01)
Strictly matches one of four exact tuples:
1. `['validate']`
2. `['generate']`
3. `['migrate', 'deploy']`
4. `['migrate', 'status']`

Any other command, CLI override flag (e.g., `--url`, `--schema`, `--config`, `-u`), or CLI suffix (e.g., `--watch`, `--preview-feature`, `--sql`, positional arguments) throws `COMMAND_FORBIDDEN` or `ALLOWLIST_FAIL` before subprocess construction. Canonical schema `schema.prisma` is appended internally by the helper.

### Distinct Command and Client Option Surfaces (Finding A3-R2)
Option key allowlists are strictly disjoint between command execution and client instantiation:

#### Command Options (`runGuardedPrismaCommand`)
- Allowed keys: `['executor', 'timeoutMs', 'role']`
- `options.role`: Permitted roles: `['admin', 'migration', 'runtime']`. Default: `'admin'`. Explicit unsupported or falsey values (`null`, `false`, `0`, `''`) are rejected with `ALLOWLIST_FAIL`.
- `options.executor`: Custom spawn executor function (for test spying). Must be a function if supplied.
- `options.timeoutMs`: Execution timeout. Must be a finite positive number (`Number.isFinite(v) && v > 0`). Default: `60000`.

#### Client Options (`createGuardedPrismaClient`)
- Allowed keys: `['role', 'log', 'clientConstructor']`
- `options.role`: Permitted roles: `['runtime', 'assembly', 'auth_adapter', 'migration', 'admin']`. Default: `'runtime'`. Explicit unsupported or falsey values (`null`, `false`, `0`, `''`) are rejected with `ALLOWLIST_FAIL`.
- `options.log`: Array of valid log definitions. Each item must be a valid log level string (`'query' | 'info' | 'warn' | 'error'`) or a valid log object (`{ level, emit }`).
- `options.clientConstructor`: Custom PrismaClient constructor (for test spying). Must be a function if supplied.

#### Common Rejected Options
- Arbitrary destination URLs, connection strings, schema overrides, or directory parameters (`url`, `databaseUrl`, `connectionString`, `schema`, `schemaPath`, `cwd`, `config`) are rejected with `ALLOWLIST_FAIL`.
- Shadow database flags (`shadow`, `shadowUrl`, `requireShadow`) are rejected with `SHADOW_TARGET_UNPROVED`.

### `runGuardedPrismaCommand(testContext, args, options = {})`
- **Purpose**: Executes a permitted Prisma CLI command with clean child environment (no ambient `DATABASE_URL` or `PG*`).
- **Operation-to-Credential Boundary**:
  - `args[0] === 'migrate'` requires administrative credentials; specifying `role: 'runtime'` is denied with `ALLOWLIST_FAIL`.
- **Returns**: `{ status, exitCode, stdout, stderr, command, cwd, startedAt, finishedAt }`

### `createGuardedPrismaClient(testContext, options = {})`
- **Purpose**: Constructs a type-safe `PrismaClient` connected as `lingora_runtime`, `lingora_assembly`, `lingora_auth_adapter`, or administrative setup user.
- **Preconditions**:
  - `testContext.assertLockHeld()` enforced before construction.

### `getRuntimeCredentials(testContext)`
- **Purpose**: Safely loads runtime credentials from `runtime-credentials.json` via anchored descriptor read (`O_RDONLY | O_NOFOLLOW`).
- **Validation**:
  - Enforces `validateRunContextAuthority` before reading.
  - Enforces fixed record shape: exactly `['lingora_runtime', 'lingora_assembly', 'lingora_auth_adapter']` with no extra keys.
  - Enforces strict password regex pattern (`/^[a-zA-Z0-9_-]{24,64}$/`).

---

## 3. Anchored Run Storage Primitive (`lingora-admin/prisma/bootstrap/private-run-storage.mjs`)

### Linux Anchored Path Security (M-02)
- Walks from absolute root `/` with directory descriptors opened with `O_RDONLY | O_DIRECTORY | O_NOFOLLOW`.
- Verifies permitted ancestor semantics: ancestor directories must be owned by UID 0 (root) or current process UID; symbolic links and non-directories are rejected.
- Enforces private run directory UID match and strict mode `0700`.
- All subsequent private record operations use retained directory descriptor via `/proc/self/fd/<dirfd>/<child>`:
  - Rejection of directory escape (`..`, slashes, path traversal).
  - Pre-effect continuity verification: confirms canonical path dev and inode match retained descriptor before every private operation.
  - Safe persistence: opens exclusive temporary file with `O_WRONLY | O_CREAT | O_EXCL | O_NOFOLLOW` and mode `0600`, fsyncs buffer, and executes atomic rename within anchored directory.
  - Unlink verifies `ENOENT` postcondition.

# A3 Fixture & Guarded Prisma Interface Specification

- Date: 2026-10-26T12:20:00+07:00
- Package: P1-03a-REPAIR
- Status: FROZEN / REPAIRED

This document defines the executable lifecycle, helper boundary, and credential storage interfaces for A3 database baseline testing and runtime verification.

---

## 1. Fixture Lifecycle Interface (`lingora-admin/tests/database/a3/fixture-lifecycle.mjs`)

### `setupA3Baseline(testContext, options = {})`
- **Purpose**: Serializes role bootstrap, baseline migration deployment, Prisma client generation, and state caching under PostgreSQL advisory lock `7103001`.
- **Preconditions**:
  - `testContext` must be valid, active, and bound to a running stack.
  - Parent run lock (`.run.lock`) must be active, valid, mode `0600`, and UID-matching.
- **Behavior**:
  1. Preflights `a3-baseline-state.json` and `runtime-credentials.json` path security before database connection.
  2. Acquires PG session advisory lock `7103001`.
  3. If a cached `a3-baseline-state.json` exists in `testContext.runDir`, revalidates file safety, descriptor attributes (mode `0600`, UID match), run ID, stack incarnation, exact setup source digests (`schema.prisma`, `migration.sql`, `bootstrap-cluster.mjs`, `manifest.json`), fixed credential record shape, live migration checksum in `_prisma_migrations`, and exact 20-table catalog identity (`EXPECTED_20_TABLES`) before returning cached `'READY'`. Any mismatch invalidates cache.
  4. If uninitialized or cache invalid, executes `reconcileClusterRoles(testContext)` to generate secure per-run credentials for login roles.
  5. Runs `prisma migrate deploy` using administrative setup credentials.
  6. Runs `prisma generate` to produce pinned TypeScript client.
  7. Atomically writes `a3-baseline-state.json` via race-safe temporary file and atomic replace with mode `0600`, recording stack incarnation, source hashes, migration checksum, catalog identity, and credentials digest.
  8. Releases advisory lock in `finally` block.
- **Returns**: `{ status: 'READY', source: 'PROVISIONED' | 'CACHED', runId, stateFile }`

### `cleanupA3Baseline(testContext, options = {})`
- **Purpose**: Disposes private credentials and baseline state files from run storage after all client consumers have disconnected.
- **Preconditions**:
  - `testContext.assertLockHeld()` must succeed.
  - Consumers (Prisma clients, pg Clients) must already be disconnected.
- **Behavior**:
  1. Validates and unlinks `a3-baseline-state.json` in `testContext.runDir`.
  2. Validates and unlinks `runtime-credentials.json` via `disposeRuntimeCredentials`.
  3. Verifies post-removal absence of both files via `fs.lstatSync` (expecting `ENOENT`).
- **Returns**: `{ status: 'CLEANED', stateFileRemoved, credentialsDisposed }`

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
- `options.timeoutMs`: Execution timeout. Must be a finite positive number (`Number.isFinite(v) && v > 0`); `NaN`, `Infinity`, `<= 0` are rejected with `ALLOWLIST_FAIL`. Default: `60000`.

#### Client Options (`createGuardedPrismaClient`)
- Allowed keys: `['role', 'log', 'clientConstructor']`
- `options.role`: Permitted roles: `['runtime', 'assembly', 'auth_adapter', 'migration', 'admin']`. Default: `'runtime'`. Explicit unsupported or falsey values (`null`, `false`, `0`, `''`) are rejected with `ALLOWLIST_FAIL`.
- `options.log`: Array of valid log definitions. Each item must be a valid log level string (`'query' | 'info' | 'warn' | 'error'`) or a valid log object (`{ level, emit }`). Non-arrays or invalid levels are rejected with `ALLOWLIST_FAIL`.
- `options.clientConstructor`: Custom PrismaClient constructor (for test spying). Must be a function if supplied.

#### Common Rejected Options
- Arbitrary destination URLs, connection strings, schema overrides, or directory parameters (`url`, `databaseUrl`, `connectionString`, `schema`, `schemaPath`, `cwd`, `config`) are rejected with `ALLOWLIST_FAIL`.
- Shadow database flags (`shadow`, `shadowUrl`, `requireShadow`) are rejected with `SHADOW_TARGET_UNPROVED`.

### `runGuardedPrismaCommand(testContext, args, options = {})`
- **Purpose**: Executes a permitted Prisma CLI command with clean child environment (no ambient `DATABASE_URL` or `PG*`).
- **Operation-to-Credential Boundary**:
  - `args[0] === 'migrate'` requires administrative credentials; specifying `role: 'runtime'` is denied with `ALLOWLIST_FAIL`.

### `createGuardedPrismaClient(testContext, options = {})`
- **Purpose**: Constructs a type-safe `PrismaClient` connected as `lingora_runtime`, `lingora_assembly`, `lingora_auth_adapter`, or administrative setup user.
- **Preconditions**:
  - `testContext.assertLockHeld()` enforced before construction.

### `getRuntimeCredentials(testContext)`
- **Purpose**: Safely loads runtime credentials from `runtime-credentials.json` via race-safe descriptor read (`O_RDONLY | O_NOFOLLOW`).
- **Validation**:
  - Enforces `validateCredentialStorage` before reading.
  - Enforces fixed record shape: exactly `['lingora_runtime', 'lingora_assembly', 'lingora_auth_adapter']` with no extra keys.
  - Enforces strict password regex pattern (`/^[a-zA-Z0-9_-]{24,64}$/`).

---

## 3. Credential Storage Security (`lingora-admin/prisma/bootstrap/bootstrap-cluster.mjs`)

### `validateCredentialStorage(credPath, runDir, { allowAbsent = false } = {})`
- **Validation Gates**:
  1. Rejects non-string or empty paths (`ALLOWLIST_FAIL`).
  2. Verifies path is strictly contained within normalized `runDir` (`ALLOWLIST_FAIL`).
  3. Rejects symbolic links in target or any parent directory component (`ALLOWLIST_FAIL`).
  4. If file exists:
     - Verifies it is a regular file (`S_ISREG`). Rejects directories, pipes, sockets, symlinks.
     - Verifies file mode permissions are strictly `0600` (`ALLOWLIST_FAIL`).
     - Verifies owner UID matches `process.getuid()` (`ALLOWLIST_FAIL`).
  5. If file is absent and `allowAbsent: true`:
     - Verifies that target does NOT exist as a dangling symlink (`ALLOWLIST_FAIL`).
     - Verifies parent directory exists, is regular directory, mode `0700`, UID-matching, non-symlink.

### Safe Credential Persistence
- Uses `fs.openSync(credFile, fs.constants.O_NOFOLLOW | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_WRONLY, 0o600)`.
- Writes JSON payload directly to file descriptor, invokes `fs.fsyncSync`, and closes descriptor.

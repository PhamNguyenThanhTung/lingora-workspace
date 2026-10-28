# P1-00 Worker Delivery Report: Runner Context Integration & Pooler Characterization

**Date:** 2026-10-25  
**Package:** `P1-00` (prerequisite for A1/A2/A3 feasibility execution)  
**Spec Reference:** `plans/2026-10-22-database-runtime-implementation-spec.md` (§§2, 4–7)  
**Execution Plan:** `plans/2026-10-25-p1-a1-a2-a3-execution-plan.md`  
**Worker Status:** `PASS` (Worker self-tested; Codex acceptance pending)

---

## 1. Executive Summary & Deliverables

Package P1-00 establishes the trusted runner-to-child test execution boundary and evaluates native session-pooler readiness for downstream test slices (A1, A2, A3):

1. **Explicit Trusted Context Handoff (`LINGORA_TEST_CONTEXT`):**  
   Child test processes spawned under `runScaffold` receive an explicit, validated run context payload containing `runId`, `runsDir`, `runDir`, `recordPath`, and `lockToken`. Ambient credential and environment fallbacks (`DB_URL`, `DATABASE_URL`, `PG*`, `SUPABASE_*`) are strictly rejected.
2. **Continuous Exclusive Parent Run Lock Retention:**  
   The parent runner's exclusive file lock (`.run.lock`) and live data reconciliation remain actively held throughout child test execution and client database sessions until runner teardown in `finally`.
3. **Fail-Closed Verification & Negative Side-Effect Guarantees:**  
   Child tests verify lock presence, correct mode (0600), owner UID, parent PID `/proc` liveness, token identity, and authority state before accessing credentials. Missing, malformed, foreign, stale, or pending-operation contexts fail closed immediately with zero SQL connections and zero HTTP requests.
4. **Finite, Sanitized Diagnostic Capture:**  
   `runScaffold` parses child test runner output into structured finite counts (`total`, `pass`, `fail`, `failedTests`), sanitizing all outputs and preventing leakage of raw error streams, connection strings, or canary tokens.
5. **Native Session-Pooler Characterization & A2 Prerequisite Proposal:**  
   Characterization of pinned Supabase CLI 2.121.0 confirms native Supavisor v2.9.13 binary availability supporting `session` and `transaction` modes. Current configuration (`supabase/config.toml`) has `enabled = false`. A2 cannot use direct PostgreSQL as a substitute; an owner prerequisite proposal is provided.

---

## 2. Changed & Tested Source Files

Strict ownership was maintained. Zero modifications were made to `env-guard.mjs`, `stack-manager.mjs`, `supabase/config.toml`, product schemas, package manifests, or pins.

| File Path | Status | SHA-256 Digest |
|---|---|---|
| `lingora-admin/tests/database/scaffolds/runner-base.mjs` | Modified | `11a8540f54322a207ceda0a0588df096e39d5d09100e58e317e2a60e3221c01a` |
| `lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs` | Modified | `ad479080bf24ced1856d9c09eab9879fa12fabf0982087500248742a87857adf` |
| `lingora-admin/tests/database/test-context.mjs` | Added | `095b148f9c48b28762db99f438902fc945eaea306af50f771df96890b4f594e2` |
| `lingora-admin/tests/database/test-context.test.mjs` | Added | `021c0e2c2656b76412b1dd5ef7408670b91ecd61c5f834e15c531372a1fb0c0d` |
| `lingora-admin/tests/database/test-child-integration.mjs` | Added | `6996c74ee38df09f0c751041aa6c71e1f6dd961d36e830b35b80a049543dc7e9` |

All 18 input dependencies from `entry.json` were verified unchanged before and after testing.

---

## 3. Implementation Details

### 3.1 `runner-base.mjs`
- **Output Sanitization & Summary (`parseTestOutputSummary`):** Parses Node test runner output lines (`✔`, `✖`, `# pass`, `# fail`, `# tests`), sanitizing content via `sanitizeString` so no tokens or passwords leak to console.
- **Explicit Context Injection:** Injects `LINGORA_TEST_CONTEXT` JSON string into `testRunnerEnv` containing `runId`, `runsDir`, `runDir`, `recordPath`, and `lockToken: lock.token`.
- **Lock Lifetime:** Parent `acquireRunLock` occurs before authority re-validation and child execution; lock release occurs strictly in `finally` after child execution completes.

### 3.2 `test-context.mjs`
- **Explicit Context Enforcement (`getTestContext`):** Reads only `options.context` or `process.env.LINGORA_TEST_CONTEXT`. Rejects ambient env vars (`DB_URL`, `DATABASE_URL`, `PG*`).
- **Path & Directory Allowlisting:** Rejects unallowlisted, forbidden, or legacy runs directories (`assertAllowlistedRunsDir`). Validates `runDir` existence, mode `0700`, owner UID match, and symlink prohibition.
- **Lock & Parent PID Validation (`assertLockHeld`):** Verifies `.run.lock` presence, mode `0600`, UID match, `run_id` match, `token` match, and parent PID `/proc` liveness via `checkProcessAlive`.
- **Authority & Credentials Inspection:** Validates `owner.json` via `validateAuthorityRecord` (phase `BOUND`, zero pending operations; denies with `RECOVERY_REQUIRED` on pending ops). Validates `credentials.json` (mode `0600`, UID match, `DB_URL` port 54322, `API_URL` port 54321).
- **Client Factory (`createTargetPgClient`):** Pre-asserts lock validity, strips ambient `PG*` env vars, and connects with explicit parameters (`127.0.0.1`, port 54322, synthetic user/database).

---

## 4. Test Verification & Results

### 4.1 Unit Test Suite (`test-scaffold-behavior.mjs` + `test-context.test.mjs`)
- **Command:** `node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs lingora-admin/tests/database/test-context.test.mjs`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Exit Code:** `0`
- **Results:** 23 passed, 0 failed (duration ~2.1s).
  - Preserved existing Tests 1–6 (fails closed on unbound env, forged flags, absent tests, failing fixture propagation, pending denial `RECOVERY_REQUIRED`, canary redaction).
  - Test 7: Runner passes explicit `LINGORA_TEST_CONTEXT` to child.
  - Test 8: Runner safely captures output, extracts summary, and sanitizes secrets.
  - Test 9: Real paused child holds parent lock; contender lock acquisition attempt is demonstrably BLOCKED with `LOCKED: Run lock held (disposition: RECOVERY_REQUIRED)`.
  - Context Tests 1–13: Missing context, invalid payload, forbidden runsDir, stale lock, dead parent PID, token mismatch, run_id mismatch, pending denial, unbound authority, foreign endpoints, positive typed retrieval, lock unlinking detection, ambient `PG*` stripping.
  - Context Test 14: Zero SQL connections and zero HTTP side-effects across all failure modes.

### 4.2 Guard & Reconciliation Suite (`test-env-guard.mjs`)
- **Command:** `node --test lingora-admin/tests/database/env/test-env-guard.mjs`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Exit Code:** `0`
- **Results:** 37 passed, 0 failed (duration ~9.5s).

### 4.3 Focused Fresh Disposable Child-Path Integration (`test-child-integration.mjs`)
- **Command:** `node lingora-admin/tests/database/test-child-integration.mjs`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Executed Run:** `run-fd9e322f1523f768` (native stack instance `988d7e2e4d38bb3de27f1247a9a0d6021903cbec833932fda316423f6f847ce4`)
- **Exit Code:** `0`
- **Observed Flow:**
  1. Pre-check: sockets quiescent (PASS).
  2. Start fresh stack: `startStack({ newRun: true })` bound successfully.
  3. Child test executed via `runScaffold`:
     - Retrieved typed context via `getTestContext()`.
     - Connected to live PostgreSQL and executed `SELECT version(), current_database(), current_user` (returned `PostgreSQL 17.1`, `postgres`, `postgres`).
     - Probed Auth health at `http://127.0.0.1:54321/auth/v1/health` (HTTP 200).
     - Probed Mail messages at `http://127.0.0.1:54324/api/v1/messages` (HTTP 200).
     - Verified parent lock held continuously throughout queries.
  4. Scaffold completed: `status: 'PASSED', exitCode: 0`.
  5. Teardown: `destroyStack({ runId: 'run-fd9e322f1523f768' })` unlinked credentials and member-map.
  6. Verified on-disk tombstone receipt (`phase: 'DESTROYED'`, `tombstone: true`).
  7. Post-check: all ports 54320–54329 confirmed free and quiescent.

---

## 5. Native Session-Pooler Characterization (CLI 2.121.0)

Per task instructions, the pinned native CLI 2.121.0 session pooler capability was characterized:

1. **Artifact & Engine:**  
   Pinned Supabase CLI 2.121.0 packages Supavisor v2.9.13 (`bin/server`, `bin/prepare`, `bin/provision-tenant`) within its native engine bundle (`node_modules/@supabase/cli-linux-x64/bin/supabase`).
2. **Supported Modes:**  
   The native pooler schema explicitly supports `pool_mode = "session"` and `pool_mode = "transaction"`.
3. **Current Repository Configuration:**  
   In `supabase/config.toml`:
   ```toml
   [db.pooler]
   port = 54329
   pool_mode = "session"
   default_pool_size = 20
   max_client_conn = 100
   enabled = false
   ```
4. **Current Guard & Manager Constraints:**  
   - `env-guard.mjs` pins canonical config digest (`a9067406c77c9e0b4a43f6e96cbb5d19f2b9e85dc1c3f461ee7a7cec3de190e9`) and restricts `EXPECTED_PORTS` to `database: 54322`, `api: 54321`, `mail: 54324`, `studio: 54323`. Port 54329 is not in the active allowlist.
   - `stack-manager.mjs` hardcodes `session_pooler: 'DISABLED_IN_NATIVE_STACK'` during data authorization and checks only direct PostgreSQL (54322).
5. **A2 Contract & Disposition:**  
   - Direct PostgreSQL is **not** an acceptable substitute for A2. A2 mandates Prisma 6.19.3 connecting through the real selected session pooler with custom login.
   - Therefore, **A2 is currently BLOCKED on the pooler transport prerequisite**.
   - P1-00 runner context handoff, A3 schema/migration ownership, and A1 auth testing can proceed independently.

### 5.1 Prerequisite Proposal for A2 Activation
Before A2 execution, the following minimal, reviewed changes must be approved by the owner:
1. `supabase/config.toml`: Set `[db.pooler] enabled = true`.
2. `env-guard.mjs`: Update `CANONICAL_CONFIG_DIGEST` to match the new config hash; add `pooler: 54329` to `EXPECTED_PORTS`.
3. `stack-manager.mjs`: Update `executeUnderLockDataAuthorization` to probe SQL readiness through port 54329 in addition to direct port 54322, and populate pooler connection string in credentials.

---

## 6. Remaining Blockers & Next Actions

- **P1-00:** Complete. All acceptance criteria met with zero unauthorized file edits.
- **A2 Transport Dependency:** Blocked on owner approval of the session pooler configuration edit outlined in §5.1.
- **Next Permitted Action:** Await Codex review and acceptance of P1-00, followed by dispatch of A3 (minimal baseline schema/migration) or A1.

# P1-00 Worker Delivery Report: Correction 1/1

**Date:** 2026-10-25  
**Package:** `P1-00` (prerequisite for A1/A2/A3 feasibility execution)  
**Spec Reference:** `plans/2026-10-22-database-runtime-implementation-spec.md` (§§2, 4–7)  
**Execution Plan:** `plans/2026-10-25-p1-a1-a2-a3-execution-plan.md`  
**Review Reference:** `docs/design/physical/evidence/2026-10-25-p1-feasibility/p1-00/codex-review-1.md`  
**Worker Status:** `PASS` (Correction 1/1 verified; ready for Codex acceptance review)

---

## 1. Executive Summary & Defect Resolutions

This delivery executes the single permitted correction round for package `P1-00`, addressing findings B1–B4 and providing exact native session-pooler capability command evidence.

### B1 Resolution: Independent Trusted Namespace & Destination Parameter Protection
- **Trusted Runs Namespace (`getTestContext`):** Child context resolution no longer accepts arbitrary payload-controlled `runsDir` as its own allowlist. The trusted runs namespace defaults to `DEFAULT_RUNS_DIR` (`.wp00-runs/pkg-g0-minimal`). In-code trusted fixture overrides (`options.expectedRunsDir`) are permitted strictly via in-code options for unit test fixtures, never parsed from untrusted payloads. If `rawContext.runsDir` is supplied in the JSON payload, it is strictly validated against `trustedRunsDir`; any mismatch throws `ALLOWLIST_FAIL`.
- **Destination & Connection Overrides Prohibited (`createTargetPgClient`):** `createTargetPgClient` now checks `options.connectionString` and inspects `options.clientConfig` for destination/connection keys (`host`, `port`, `database`, `user`, `password`, `connectionString`, `ssl`, `client_encoding`). If any destination key is detected, it is rejected with `ALLOWLIST_FAIL` before the transport client class is instantiated. The client configuration is strictly bound to the validated, typed context destination (`127.0.0.1`, port 54322, synthetic target user/database).

### B2 Resolution: Finite Safe Diagnostic Summary & Unregistered Canary Sink
- **Test Names Removed from Public Summary:** `parseTestOutputSummary` in `runner-base.mjs` no longer extracts, stores, or returns test name strings (`failedTests`, `passedTests`). It parses and returns strictly finite counts: `{ total, pass, fail }`.
- **Canary Redaction Assertion:** In `test-scaffold-behavior.mjs` Test 8, a dynamically generated unregistered canary test name (`unreg_canary_child_failure_<hex>`) is injected into the failing test line of `testExecutor` output. The test asserts that the unregistered canary reaches the runner/sink but is strictly absent from `capturedStdout`, `capturedStderr`, and the JSON-serialized scaffold result object (`res.summary`).

### B3 Resolution: Real Low-Adapter Effect Assertions Through Production Path
- **Active Adapter Instrumentation:** Replaced the uninvoked counters in `test-context.test.mjs` Test 14 with `InstrumentingClient` wired directly through `attemptContextToClient` (`getTestContext` → `createTargetPgClient`).
- **7 Negative Modes Verified:** Tested missing context (`TEST_CONTEXT_MISSING`), custom unallowlisted runsDir namespace (`ALLOWLIST_FAIL`), stale lock (`TEST_CONTEXT_STALE`), token mismatch (`TEST_CONTEXT_FORBIDDEN`), pending operation (`RECOVERY_REQUIRED`), destination host override in `clientConfig` (`ALLOWLIST_FAIL`), and `connectionString` override (`ALLOWLIST_FAIL`). In all 7 negative modes, `factoryCallCount` and `connectionAttemptCount` remain strictly 0.
- **Positive Counterproof:** In an authorized positive context, `createTargetPgClient` genuinely increments `factoryCallCount` to 1, and `client.connect()` genuinely increments `connectionAttemptCount` to 1.

### B4 Resolution: API Alignment & Genuine Disposable Child-Path Execution
- **API Alignment:** Corrected `test-child-integration.mjs` to resolve `runDir` via `path.resolve(DEFAULT_RUNS_DIR, runId)` (instead of nonexistent `startResult.runDir`); updated socket quiescence assertions to verify the boolean return of `verifySocketsQuiescent()` (instead of `.quiescent`); updated destroy logging to report `destroyRes.status`, `code`, and `exit_code`.
- **Public Sink Protection:** Wrapped integration script entry point with `sanitizeString` to prevent raw error stacks or tokens from escaping to stderr.
- **Genuine Execution:** Ran genuine fresh disposable native stack lifecycle, executing real queries against PostgreSQL 17 under continuous lock, probing Auth and Mail endpoints, and verifying tombstone teardown.

---

## 2. Session-Pooler Capability Characterization (Exact Commands & Evidence)

Per Codex review, exact commands, working directories, exits, and safe outputs were executed to characterize native Supavisor v2.9.13 support in pinned Supabase CLI 2.121.0.

### 2.1 Pinned Binary Version & Architecture
- **Command:** `node_modules/@supabase/cli-linux-x64/bin/supabase --version`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Exit Code:** `0`
- **Safe Output:**
  ```text
  2.121.0
  ```

### 2.2 Pinned Supavisor Artifact in Native Engine Bundle
- **Command:** `python3 -c "with open('node_modules/@supabase/cli-linux-x64/bin/supabase', 'rb') as f: data = f.read(); idx = data.find(b'ghcr.io/supabase/cli/pooler:v2.9.13-r1'); print(data[idx:idx+250].decode('utf-8', errors='replace'))"`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Exit Code:** `0`
- **Safe Output:**
  ```text
  ghcr.io/supabase/cli/pooler:v2.9.13-r1@sha256:f02ccc6e18ea77789978e248ac302a4e0955d03fdeeea0d63ac0b7a315595c60     ֢ supabase/supavisor:2.9.13   @  їj aa53594e91144a6d33267b802152f0f42d35ca85e6efd13b9cd06f53e327fb5f@  S}} 1c42764f1f706cb177ee4f
  ```
- **Observed Artifact Details:**
  - Upstream Image: `supabase/supavisor:2.9.13`
  - Digest: `sha256:f02ccc6e18ea77789978e248ac302a4e0955d03fdeeea0d63ac0b7a315595c60`
  - Required Binaries: `bin/provision-tenant`, `bin/server`, `bin/prepare`

### 2.3 Binary CLI Configuration Mapping & Pool Modes
- **Command:** `python3 -c "with open('node_modules/@supabase/cli-linux-x64/bin/supabase', 'rb') as f: data = f.read(); idx = data.find(b'[\"supavisor\",{imageConfigField:\"db.pooler.image\"'); print(data[idx:idx+120].decode('utf-8', errors='replace'))"`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Exit Code:** `0`
- **Safe Output:**
  ```text
  ["supavisor",{imageConfigField:"db.pooler.image",enabledGate:"db.pooler.enabled"}]
  ```
- **Command:** `strings node_modules/@supabase/cli-linux-x64/bin/supabase | grep -E "SUPABASE_DB_POOLER_DEFAULT_POOL_SIZE|pooler\.pool_mode" | head -n 5`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Exit Code:** `0`
- **Safe Output:**
  ```text
  pooler.pool_mode     SUPABASE_EDGE_RUNTIME_POLICY   zJ oneshot    :k edge_runtime.policy $  z SUPABASE_DB_POOLER_DEFAULT_POOL_SIZE ' i db.pooler.default_pool_size "  . SUPABASE_DB_POOLER_MA
  ```

### 2.4 Existing Repository Configuration
- **Command:** `grep -A 8 "\[db\.pooler\]" supabase/config.toml`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Exit Code:** `0`
- **Safe Output:**
  ```toml
  [db.pooler]
  enabled = false
  port = 54329
  pool_mode = "session"
  default_pool_size = 20
  max_client_conn = 100
  ```

### 2.5 Static Capability vs. Runtime Transport Assessment
- **Static Support:** The pinned CLI `2.121.0` binary statically packages and supports Supavisor v2.9.13 with native `pool_mode = "session"`.
- **Runtime State:** Currently disabled in `supabase/config.toml` (`enabled = false`) and not registered in `env-guard.mjs` / `stack-manager.mjs`.
- **A2 Transport Disposition:** A2 mandates Prisma 6.19.3 connecting through the real selected session pooler. Direct PostgreSQL substitution is prohibited. A2 remains BLOCKED until the owner reviews and authorizes the technical prerequisite configuration edit below.

### 2.6 A2 Technical Prerequisite Proposal (Awaiting Owner Review)
To enable real session pooler transport for A2, the following minimal changes are required:
1. `supabase/config.toml`: set `[db.pooler] enabled = true`.
2. `env-guard.mjs`: update `CANONICAL_CONFIG_DIGEST` to the new hash and add `pooler: 54329` to `EXPECTED_PORTS`.
3. `stack-manager.mjs`: update `executeUnderLockDataAuthorization` to probe SQL readiness through port 54329 and populate pooler connection string in credentials.

---

## 3. Changed & Tested Source Files

| File Path | Status | SHA-256 Digest |
|---|---|---|
| `lingora-admin/tests/database/scaffolds/runner-base.mjs` | Modified | `22d9aa543ab53f5a885c0266941b441fac27a2da32e24d9fffd1678f00276051` |
| `lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs` | Modified | `f86da51177396de9f1d47d8bd934ad1562fe394bd6636389ad601a7dd9fea541` |
| `lingora-admin/tests/database/test-context.mjs` | Modified | `d22ad7b6d594ae848c7c7234513d0a9eb889d830cf19baf1cfd616d6aad06f0a` |
| `lingora-admin/tests/database/test-context.test.mjs` | Modified | `a55b46d2ecf308fa294571944074c967699b5488700ea89be96421e0aa0bbd1a` |
| `lingora-admin/tests/database/test-child-integration.mjs` | Modified | `78929b42f12b29ba16c6c037df6926bd4123012e895560bea975097f1efc1c1b` |

All 18 input dependencies from `entry.json` were verified unchanged:
`stack-manager.mjs` (`611db38db7...`), `env-guard.mjs` (`a2ee615d54...`), `test-env-guard.mjs` (`360271f42f...`), `supabase/config.toml` (`a9067406c7...`), manifests and runners identical.

---

## 4. Verification Suite Results

| Test Command | CWD | Node Binary & Version | Exit Code | Summary |
|---|---|---|---|---|
| `node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs lingora-admin/tests/database/test-context.test.mjs` | `/home/tung/workspace/school/project1/lingora-workspace` | `/home/tung/.local/bin/node` (`v24.22.1`) | `0` | 23 passed, 0 failed (~2.0s duration). Tests 1–9 PASS; Context tests 1–14 PASS. |
| `node --test lingora-admin/tests/database/env/test-env-guard.mjs` | `/home/tung/workspace/school/project1/lingora-workspace` | `/home/tung/.local/bin/node` (`v24.22.1`) | `0` | 37 passed, 0 failed (~9.5s duration). Full guard, reconciliation, canary suites PASS. |
| `node lingora-admin/tests/database/test-child-integration.mjs` | `/home/tung/workspace/school/project1/lingora-workspace` | `/home/tung/.local/bin/node` (`v24.22.1`) | `0` | Fresh native run allocated (`run-bbcd679f424993b2`, stack `44a6dc179174c4b674a5cd2e348727f6a1a102854e3a7e8bde7e11dedf34a972`), bound, tested under lock, and cleanly destroyed with tombstone. |

---

## 5. Next Actions

- Package `P1-00` correction 1/1 is complete and fully self-tested.
- P1-00 runner context handoff, A3 minimal baseline schema/migration, and A1 auth testing are unblocked and ready for dispatch.
- A2 remains paused at pooler transport dependency pending technical prerequisite authorization.

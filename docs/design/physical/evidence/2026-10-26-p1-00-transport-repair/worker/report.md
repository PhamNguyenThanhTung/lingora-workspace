# P1-00 Transport Repair Delivery Report

**Date:** 2026-10-26  
**Package:** `P1-00` Transport Repair  
**Scope:** `lingora-admin/tests/database/test-context.mjs` and focused regression tests in `lingora-admin/tests/database/test-context.test.mjs`  
**Reference Assignment:** `docs/design/physical/evidence/2026-10-26-p1-00-transport-repair/repair-plan.md`  
**Status:** `PASS` (Worker self-testing complete; ready for independent Codex review)

---

## 1. Executive Summary & Defect B1 Resolution

This delivery fulfills the bounded transport repair authorized for package `P1-00`, strictly resolving the alternate transport bypass identified in Codex Review 2 (`codex-review-2.md`):

1. **Elimination of Arbitrary Config Forwarding:**
   - Removed arbitrary spread `...(options.clientConfig || {})` in `createTargetPgClient`.
   - Fixed configuration strictly enforces harness-validated typed destination parameters:
     - `host: parsed.hostname` (127.0.0.1)
     - `port: parsed.port` (54322)
     - `database: parsed.database` (postgres)
     - `user: parsed.username` (postgres)
     - `password: parsed.password`
     - `connectionTimeoutMillis: options.connectionTimeoutMillis || 5000`
     - `ssl: false`
2. **Strict Top-Level and ClientConfig Allowlists:**
   - `ALLOWED_TOP_LEVEL_OPTIONS`: strictly permits `ClientClass`, `connectionTimeoutMillis`, and `clientConfig`.
   - `SAFE_NON_ROUTING_CLIENT_CONFIG_KEYS`: strictly permits demonstrably non-routing parameters (`statement_timeout`, `query_timeout`, `lock_timeout`, `idle_in_transaction_session_timeout`, `application_name`, `connectionTimeoutMillis`).
   - Only validated safe non-routing parameters are copied; any other key is rejected before factory instantiation.
3. **Exhaustive Pre-Factory Rejection of Transport/Routing Injections & Aliases:**
   - Rejects transport injections: `stream`, `connection` (both in `options.clientConfig` and at top-level `options`).
   - Rejects destination overrides and aliases: `host`, `hostname`, `hostaddr`, `port`, `database`, `dbname`, `db`, `user`, `username`, `password`, `pass`, `connectionString`, `connection_string`.
   - Rejects socket and protocol/security overrides: `socketPath`, `socket`, `ssl`, `sslmode`, `sslcert`, `sslkey`, `sslrootcert`, `sslca`, `sslnegotiation`, `client_encoding`, `encoding`, `replication`.
   - Rejects any unsupported arbitrary parameters with `ALLOWLIST_FAIL`.
4. **Preservation of Seam and Guard Contracts:**
   - Preserves trusted test factory seam (`options.ClientClass`).
   - Zero changes to guard, manager, provider config, pins, contracts, or G0 artifacts.

---

## 2. Acceptance Criteria Verification

| Criterion | Result | Evidence |
|---|---|---|
| Positive validated local target creates/connects normally | PASS | Genuine `pg.Client` and `InstrumentingClient` verified in Tests 13, 14, 15 |
| Stream and connection injections reject before factory | PASS | Tested across `options` and `clientConfig` in Tests 13, 14, 15 |
| Destination overrides and aliases reject before factory | PASS | Tested across destination matrix and aliases in Tests 13 and 14 |
| Reachable factory and connect counters both zero for invalid config | PASS | 14 failure modes verified with zero factory and zero connection attempts in Test 14 |
| Default `pg.Client` stream protection | PASS | Test 15 proves stream probe function is never invoked on invalid options |
| Existing valid context / runner regressions pass | PASS | 24/24 pass in `test-scaffold-behavior.mjs` & `test-context.test.mjs`; 37/37 pass in `test-env-guard.mjs` |

---

## 3. Mutation / Regression Evidence

To demonstrate that the new test suite detects the vulnerability and is not vacuous:
1. `lingora-admin/tests/database/test-context.mjs` was temporarily mutated back to the prior baseline (`d22ad7b6d594ae848c7c7234513d0a9eb889d830cf19baf1cfd616d6aad06f0a`), which forwarded `...(options.clientConfig || {})`.
2. Running the test suite against this mutated prior source failed with **exit code 1 (21 pass, 3 fail)**:
   - Test 13 failed: stream/connection/aliases did not throw expected `ALLOWLIST_FAIL`.
   - Test 14 failed: factory and connection counters incremented instead of remaining 0.
   - Test 15 failed: `STREAM_INVOKED_UNEXPECTEDLY` thrown inside `node_modules/pg/lib/connection.js:20`, proving `new Client` was constructed and reached foreign stream injection.
3. Restored final source (`bb721ba0786dbe5e9b2e9f6436752cb03a52cd6e927d7b11f0348a6fdc3c78b9`) and reran: all 24 tests passed (**exit code 0**).

---

## 4. Commands, Working Directory, Exit Codes & Tested Source Hashes

- **Repository Root:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Resolved Node:** `/home/tung/.local/bin/node` (v24.22.1)

### Command 1: Final Unit & Scaffold Test Suite
- **Command:** `node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs lingora-admin/tests/database/test-context.test.mjs`
- **Exit Code:** `0` (24 pass, 0 fail)
- **Log Path:** `docs/design/physical/evidence/2026-10-26-p1-00-transport-repair/worker/unit-tests-final.log`
- **Tested Source Hash:**
  - `lingora-admin/tests/database/test-context.mjs`: `bb721ba0786dbe5e9b2e9f6436752cb03a52cd6e927d7b11f0348a6fdc3c78b9`
  - `lingora-admin/tests/database/test-context.test.mjs`: `b3f5ce2cc9daff60335c0cedaac105b3c9589b1e04dc77904dacef10823dae7c`

### Command 2: Mutation Test against Prior Forwarding Implementation
- **Command:** `node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs lingora-admin/tests/database/test-context.test.mjs`
- **Exit Code:** `1` (21 pass, 3 fail)
- **Log Path:** `docs/design/physical/evidence/2026-10-26-p1-00-transport-repair/worker/unit-tests-mutation-prior-forwarding.log`
- **Tested Source Hash:**
  - `lingora-admin/tests/database/test-context.mjs`: `d22ad7b6d594ae848c7c7234513d0a9eb889d830cf19baf1cfd616d6aad06f0a`
  - `lingora-admin/tests/database/test-context.test.mjs`: `b3f5ce2cc9daff60335c0cedaac105b3c9589b1e04dc77904dacef10823dae7c`

### Command 3: Environment Guard Regression Test Suite
- **Command:** `node --test lingora-admin/tests/database/env/test-env-guard.mjs`
- **Exit Code:** `0` (37 pass, 0 fail)
- **Log Path:** `docs/design/physical/evidence/2026-10-26-p1-00-transport-repair/worker/test-env-guard.log`
- **Tested Source Hash:**
  - `lingora-admin/tests/database/env/test-env-guard.mjs`: `360271f42f0202592252b053617840acb79468e425ab83e5514f5d85ac2594b7`

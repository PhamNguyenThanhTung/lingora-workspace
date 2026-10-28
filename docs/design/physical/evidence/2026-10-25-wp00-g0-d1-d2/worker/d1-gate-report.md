# Lingora WP-00/G0 — D1 Gate Execution Report

**Date:** 2026-10-25  
**Package:** D1 (Ownership, Lifecycle, Shared Dispatcher, Process Observation, Incident Regression)  
**Status:** D1 GATE COMPLETE — PASS  
**Next Permitted Action:** Proceed to D2 (Guarded Data Helper, Scaffold Bypass Removal, Finite Output Boundary).

---

## 1. Tested Source Hashes (D1 Gate Snapshot)

| Source File | SHA-256 Digest |
|---|---|
| `lingora-admin/tests/database/env/env-guard.mjs` | `e10b4d891644cf24393d21964e410d70d9a8e5fbc3dbf8defa8049acaeabd4f8` |
| `lingora-admin/tests/database/env/stack-manager.mjs` | `5f8a529c142b747b5564467ff8b1bf2b6b0d5e59114579e9305797bb7c04f17f` |
| `lingora-admin/tests/database/env/test-env-guard.mjs` | `2d03155efc0e0a19983a8ffc16646a97a29ad3deceb02436a68acb24fb5bc9b8` |

---

## 2. D1 Verification Execution

- **Command:** `node --test lingora-admin/tests/database/env/test-env-guard.mjs`
- **Node Binary:** `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` (v24.22.1)
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Exit Code:** `0`
- **Results:** 24 tests executed, 24 passed, 0 failed, 0 skipped.

---

## 3. D1 Acceptance Matrix Status

| Case ID | Category | Scope / Tested Invariants | Verdict |
|---|---|---|---|
| **P01** | Positive | First-start allocates new run in private namespace; persists RESERVED authority with pending prepare before spawn; verifies fresh home has no conflicting tuple; binds full 64-hex ID on prepare ack; transitions phase to BOUND atomically. | **PASS** |
| **P02** | Positive | Existing start on running or stopped stack resumes same ID with full tuple reconciliation; dispatches zero prepare calls. | **PASS** |
| **P03** | Positive | Full lifecycle suite: status returns sanitized projection; stop verifies process quiescence and retains state; already-stopped handled cleanly; destroy verifies registry absence and process/socket quiescence, writes DESTROYED tombstone receipt, and unlinks private credentials; repeated destroy operates idempotently on tombstone with zero destructive provider calls. | **PASS** |
| **N01** | Negative | Cross-product matrix (start/status/stop/destroy/data x missing file, corrupt JSON, task_id mismatch, format_version mismatch, unowned legacy roots). All fail closed with CLI=0, HTTP=0, SQL=0; authority files untouched. | **PASS** |
| **N02** | Negative | Cross-product matrix (5 entry points x native registry mismatch). Only declared CLI version and stack list inspection executed (CLI=2, action=0, HTTP=0, SQL=0); retains authority receipt; no blind adoption. | **PASS** |
| **N03** | Negative | Returned ID or runtime mismatch in prepare/start/status response rejected fail-closed; zero HTTP, zero SQL; retains pending state. | **PASS** |
| **F01** | Injection | Lock acquisition failure aborts before any provider calls; lock held by active process prevents concurrent mutation. | **PASS** |
| **F02** | Injection | Prepare dispatch failure retains durable RESERVED intent with `pending_operation: 'prepare'`; exactly one prepare attempted before failure; no silent second prepare while state unknown. | **PASS** |
| **F03** | Injection | Orphan lock recovery safely verifies dead process PID and quiescence before clearing stale lock; rejects removal if process is still active. | **PASS** |
| **F05** | Injection | Stop command failure or process quiescence violation rejects without claiming stopped; retains authority and credentials; releases lock on handled errors. | **PASS** |
| **F06** | Injection | Destroy postcheck failure (stack still present in list or process/socket active) throws `DESTROY_POSTCHECK_FAIL`; performs zero file deletion; retains BOUND authority. | **PASS** |
| **F07** | Injection | Destroy crash after tombstone enables safe idempotent cleanup retry on receipt; residual credentials unlinked; tombstone preserved. | **PASS** |
| **E01** | Incident Regression | Synthetic owner-control-secret canary generated and injected across CLI stdout, stderr, malformed JSON, and exceptions. Asserted absent from harness stdout, stderr, and shared artifacts without ever printing canary in assertion failure message. | **PASS** |
| **E02** | Incident Regression | Destroy failure containing canary in stderr captured safely; canary absent from error messages and retained recovery state. | **PASS** |
| **L01** | Concurrency | Two processes competing for the same run enforce mutual exclusion; loser executes zero CLI, zero HTTP, zero SQL calls; winner releases lock in finally block. | **PASS** |

---

## 4. Gate Conclusion

All D1 ownership, lifecycle, locking, Linux `/proc` process/socket observation, and canary incident regression requirements are fully met with deterministic test proof. D1 gate is CLOSED and PASSED. Proceeding to D2.

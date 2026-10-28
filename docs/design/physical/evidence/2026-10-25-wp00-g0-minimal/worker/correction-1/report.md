# WP-00 / G0 Minimal Safety Package — Worker Correction 1 Report

- **Task**: WP-00/G0 Minimal Safety Package (Codex Correction 1)
- **Review Reference**: `docs/design/physical/evidence/2026-10-25-wp00-g0-minimal/codex-review-1.md`
- **Execution Date**: 2026-10-25
- **Role**: Antigravity Worker (Implementation & Test Owner)
- **Review & Acceptance Authority**: Codex (Independent Reviewer; this report does **not** claim G0 accepted)
- **Status**: **PASS** (Worker correction implementation, fake/unit suites, and corrected production-transport native lifecycle verified)

---

## 1. Changed Files

| File | Relative Path | Final Tested SHA256 |
|---|---|---|
| Environment Guard | `lingora-admin/tests/database/env/env-guard.mjs` | `24b4c1164abba89ec97e8233d1bf6b0134ea759331e478cbace200adaad552c0` |
| Stack Manager | `lingora-admin/tests/database/env/stack-manager.mjs` | `db2d701376fa3d3b60f0b37794900665a157b49d83e5023601816a7beb592feb` |
| Scaffold Runner Base | `lingora-admin/tests/database/scaffolds/runner-base.mjs` | `d6f35e40b337d35ad5711b1c4e3c36bbfb31c4f50120b403d1a7f786bf8b777f` |
| Scaffold Test Suite | `lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs` | `822d316959f89eea41c1ee708bdb4b15ecd86f8d62886926346cf7245138d646` |
| Guard Test Suite | `lingora-admin/tests/database/env/test-env-guard.mjs` | `40c03d796112eb29fab2727f907d996fa88f2c422cc7bc2b5bb3ccbc2e9efc3b` |
| Lifecycle Test Suite | `lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | `2b57aa658aefc05a999cd4675836dcc10ade1312dbd5cfc3430fc63d0ece0e76` |

Pinned binaries verified:
- Node v24.22.1 (`/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`): `61ab14cd750fc24d5db53490ec5fc40f756e4b6e136b78cf7004265471d9bd1d`
- Supabase CLI 2.121.0 (`node_modules/@supabase/cli-linux-x64/bin/supabase`): `e91fc61f09c4fbb9c65dadc37d415640cb6d2398e65eba6d384eec74b2dbbe10`

---

## 2. Concise Changes Addressing F1–F6

- **F1 (Symlink Containment & Env Selection, M01/M03/M04)**: In `env-guard.mjs`, `isSafeChildPath` now enforces strict lexical path containment before `realpathSync` and explicitly rejects symbolic links via `lstatSync().isSymbolicLink()`. In `stack-manager.mjs`, `resolveRunContext` completely ignores `process.env.LINGORA_RUN_ID` and `process.env.LINGORA_RUNS_DIR`, requiring explicit options or CLI flags.
- **F2 (Durable Intent Fsync Propagation, M02)**: Removed swallow-and-ignore directory fsync error handling in `persistAuthorityAtomic`; parent directory fsync failures immediately abort before any CLI prepare or mutation side-effects. P01 explicitly asserts on-disk persistence of `pending_operation: 'prepare'` before the prepare adapter dispatches.
- **F3 (Ownership Continuity & Pending Denial, M03/M04/M06)**: Replaced speculative auto-recovery in `startStack`, `stopStack`, and `destroyStack` with fail-closed denial (`RECOVERY_REQUIRED`, disposition: `recovery-required`) when `pending_operation !== null`, executing zero mutations and zero data probes. In `env-guard.mjs`, `verifyIncarnationContinuity` fails closed on missing/empty `member_map` on any `BOUND` record; `reconcileNativeRegistry` rejects duplicate ID or duplicate stack name under different ID with `RECONCILE_FAIL`.
- **F4 (Unified Data Authorization Boundary, M05/M08)**: Extracted and shared `executeUnderLockDataAuthorization` across initial start, existing start, `probeDataReadiness`, and `runner-base.mjs`. Validates live 4-tuple, running lifecycle, member UUID continuity, live endpoints (no synthesized fallbacks), and live credentials before issuing typed PostgreSQL 17 or HTTP health queries. In `probeSqlReadiness`, `client.end()` close failures in `finally` propagate and fail closed (`DATA_FAIL`), never reporting ready.
- **F5 (Targeted Termination & Tri-State Observation, M07/M10)**: Implemented tri-state `checkFileAbsence` (`ABSENT` for ENOENT, `PRESENT`, `UNKNOWN` for EACCES/errors) and updated `verifyNativeStateFilesAbsent`. In `snapshotRunProcesses`, consulted known native owner identity from `owner.json` and targeted processes; any observation error on target processes or unsearchable state files returns `UNKNOWN`. In `destroyStack`, non-`ABSENT` state files abort teardown, retain `BOUND` authority, and perform zero file deletion.
- **F6 (Public Finite Sinks & Canary Redaction, M09/M10)**: In `runner-base.mjs`, replaced raw child stdout/stderr and error message forwarding with bounded finite static messages (`SCAFFOLD_TEST_FAILED`, `SCAFFOLD_ERROR`). In `test-env-guard.mjs`, updated `E01 & E02` to use reachable failing PG query and fetch probes, correct factory constructor shape, and `assert.rejects`; verified adapter-reached counters and confirmed secret canaries never leak into error messages, stdout, stderr, or files.

---

## 3. Commands & Tests

All tests were executed against the final tested source using pinned Node runtime `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` with PWD at canonical workspace root `/home/tung/workspace/school/project1/lingora-workspace`.

| Command | Exit Code | Tests | Duration | Safe Log Path |
|---|---|---|---|---|
| `node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs` | 0 | 4 passed / 0 failed | 788.8ms | `docs/design/physical/evidence/2026-10-25-wp00-g0-minimal/worker/correction-1/logs/scaffold-behavior.log` |
| `node --test lingora-admin/tests/database/env/test-env-guard.mjs` | 0 | 32 passed / 0 failed | 8994.9ms | `docs/design/physical/evidence/2026-10-25-wp00-g0-minimal/worker/correction-1/logs/env-guard.log` |
| `node --test lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | 0 | 1 passed / 0 failed | 190817.5ms | `docs/design/physical/evidence/2026-10-25-wp00-g0-minimal/worker/correction-1/logs/lifecycle-readiness.log` |

### Corrected Production-Transport Native Lifecycle (R01 / M10)
- **Allocated Run**: `run-90152fc4` / instance `4fb9b8342bc1bac18712bbaa17db0d5ee4b397fb2a62baa413fba1888e7f5c95`
- **Stack Name**: `lingora-wp00-90152fc4`
- **Runtime**: `native` (Supabase CLI 2.121.0)
- **Readiness Probes**: PostgreSQL 17 SELECT confirmed (`current_database: postgres`, schemas `public`, `auth`, `storage`); Auth HTTP health 200 OK; Storage HTTP status 200 OK; Mail HTTP API 200 OK; Session pooler `DISABLED_IN_NATIVE_STACK`.
- **Honest Refusal**: Scaffold runner honesty verified under active stack (`exit 1`, `STATUS: NOT EXECUTED`).
- **Restart Continuity**: Preserved member UUID mapping across restart with zero duplicate prepare dispatches.
- **Compact Exact-Target Termination Summary Logged**:
  ```json
  {
    "target_stack_id": "4fb9b8342bc1bac18712bbaa17db0d5ee4b397fb2a62baa413fba1888e7f5c95",
    "target_stack_name": "lingora-wp00-90152fc4",
    "registry_status": "CONFIRMED_ABSENT",
    "native_state_files": "ABSENT",
    "active_run_processes": 0,
    "quiescent_ports": [54321, 54322, 54324],
    "tombstone_recorded": true,
    "credentials_unlinked": true,
    "termination_verdict": "VERIFIED_ABSENT"
  }
  ```
- **Idempotence**: Repeated destroy on tombstone acknowledged (`ALREADY_DESTROYED`, exit 0, zero provider dispatches).

---

## 4. Acceptance Criteria Results (M01 to M10)

| Criterion | Finding | Result | Primary Assertions & Test Links |
|---|---|---|---|
| **M01: Isolation** | F1 | **PASS** | Tests 1, 8, P01, F1 in `test-env-guard.mjs`. Enforces lexical containment; symlinks on control/home/workdir rejected (`ALLOWLIST_FAIL`). Ambient env vars ignored. |
| **M02: Intent** | F2 | **PASS** | Tests P01, F02, F2 in `test-env-guard.mjs`. Durable reservation verified on disk before prepare dispatch. Directory fsync failure propagates and aborts before prepare dispatch. Prepare failure retains durable intent without second dispatch. |
| **M03: Exact Target** | F1/F3 | **PASS** | Tests P01, P02, N02, N03, N04, F3 in `test-env-guard.mjs`. Full 64-char ID required. BOUND record without initialized member anchor denies (`RECONCILE_FAIL`). Duplicate registry entries deny (`RECONCILE_FAIL`). Zero prefix matching or default adoption. |
| **M04: Denial** | F1/F3 | **PASS** | N01 & N02 matrices, Tests 4-7, F1 in `test-env-guard.mjs`; Tests 1-2 in `test-scaffold-behavior.mjs`. Shared fail-closed validation boundary denies invalid/foreign host, mismatched ports, and unverified authority across all entry points with 0 CLI mutations and 0 HTTP/SQL probes. |
| **M05: Serialization** | F4 | **PASS** | Tests F01, F03, L01, F4 in `test-env-guard.mjs`. Child process lock contention enforces mutual exclusion (loser exits 1 with LOCKED). In-flight data client probe holds lock through query and close, blocking concurrent destroy contenders. |
| **M06: Ambiguity** | F3 | **PASS** | Tests F04, F02b, F3 in `test-env-guard.mjs`. Speculative auto-recovery replaced with fail-closed denial (`RECOVERY_REQUIRED`). Pending prepare, pending stop, pending destroy abort immediately with ZERO provider mutations and ZERO data probes. Authority record preserved. |
| **M07: Termination** | F5 | **PASS** | Tests F05, F06, F07, P03, F5 in `test-env-guard.mjs`; Steps 5, 7, 8 in `test-lifecycle-and-readiness.mjs`. Distinguishes ENOENT (`ABSENT`) from EACCES/errors (`UNKNOWN`). Required observation UNKNOWN aborts destroy, retains `BOUND` authority, and performs ZERO deletion. |
| **M08: Data** | F4 | **PASS** | Tests 2-6, F4 in `test-env-guard.mjs`; Tests 3-4 in `test-scaffold-behavior.mjs`; Step 1 in `test-lifecycle-and-readiness.mjs`. Unified `executeUnderLockDataAuthorization` validates fresh live 4-tuple, running lifecycle, endpoints, and credentials before probes. PG client close failure propagates and fails closed (`DATA_FAIL`). |
| **M09: Output** | F6 | **PASS** | Tests 9, E01, E02, 17 in `test-env-guard.mjs`; Tests 1-4 in `test-scaffold-behavior.mjs`. Scaffold runner outputs static messages, never forwarding raw child stdout/stderr. E01/E02 tests reachable PG query and fetch exceptions via `assert.rejects`; canaries never leak. Adapter reached counters > 0. |
| **M10: Native** | F5/F6 | **PASS** | Single production-transport execution `test-lifecycle-and-readiness.mjs` (R01). Verified prepare, live SQL/Auth/Storage/Mail readiness, honest scaffold refusal, stopped state, restart with member continuity, and destroy with logged compact exact-target postcondition summary. |

---

## 5. Carried-Forward Proofs

As authorized by the execution spec and scope reduction review §6:
1. **Clean Dependencies & Install Proof**: Carried forward from `docs/design/physical/evidence/2026-10-25-wp00-g0-d1-d2/worker/correction-1/logs/v01-dependencies-clean-install.log` (unchanged lockfile, verifier, platform, and isolation inputs).
2. **Provenance & Parity Proof**: Carried forward from `docs/design/physical/evidence/2026-10-25-wp00-g0-d1-d2/worker/correction-1/logs/v01-provenance-parity.log` (unchanged title normalization, SVG preservation, 34-entity scope).
3. **D0 Native Characterization**: Carried forward from `docs/design/physical/wp00-g0-d0-result-2026-10-25.md` (unchanged CLI 2.121.0 binary hash and platform facts).

---

## 6. Remaining Risks & Non-Blockers

- **Experimental Native Stack Subcommand**: `supabase stack` remains an experimental subcommand in CLI 2.121.0. The minimal safety harness isolates this via strict 4-tuple reconciliation, explicit member continuity, and tri-state termination checks.
- **External Session Pooler Requirement**: Native stack does not supply Supabase Supavisor/PgBouncer (`session_pooler: DISABLED_IN_NATIVE_STACK`). This is expected and documented for downstream task A2 (Prisma 6.19.3 session pooler integration).
- **Manual Intervention on Orphan Locks**: Auto-unlock was disabled to eliminate race conditions; orphan locks now fail closed with `LOCKED (recovery-required)`.
- **Pre-existing Unrelated Worktree State**: Untracked/dirty files outside the assigned test and harness scope were preserved without modification. No Git commits or pushes were made.

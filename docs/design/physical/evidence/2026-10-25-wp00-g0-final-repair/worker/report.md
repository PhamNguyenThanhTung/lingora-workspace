# WP-00/G0 Final Bounded Repair — Worker Completion Report

**Date:** 2026-10-25  
**Task:** WP-00/G0 Final Bounded MUST Repair  
**Status:** PASS (Worker implementation & verification complete; acceptance authority belongs to Codex)

---

## 1. Summary of Changes Across the Four Authorized Deliverables

1. **Deliverable 1: Reject Production CLI `--runs-dir` / Custom Namespace (B1, M01/M04)**
   - Pinned production namespace `.wp00-runs/pkg-g0-minimal` in `stack-manager.mjs` CLI `main()`.
   - `main()` strictly rejects `--runs-dir` or `--runs-dir=*` with `COMMAND_INVALID` during argument parsing before any allocation, adoption, inspection, or mutation.
   - Internal test fixtures use trusted internal API options (`runsDir`); child test L01 uses trusted internal bootstrap without CLI namespace bypass flags.
   - Verified via test `16b` (nonzero exit, safe diagnostic, foreign root untouched) and `L01`.

2. **Deliverable 2: Universal Pending-Operation Authorization Rule (B3, M04/M06/M08)**
   - Added universal `assertNoPendingOperation()` check to `env-guard.mjs`.
   - Enforced under lock across all public and internal paths: `startStack` (prepare and start), `statusStack`, `stopStack`, `destroyStack`, `probeDataReadiness`, `executeUnderLockDataAuthorization`, and `runScaffold`.
   - Any non-null `pending_operation` immediately fails closed with `RECOVERY_REQUIRED` (disposition: `recovery-required`), retaining on-disk authority with zero provider mutation, zero cleanup, and zero queries.
   - Verified via test `F3` (destroy and shared data helper deny with `RECOVERY_REQUIRED`) and scaffold test `5`.

3. **Deliverable 3: Required Known Owned Process/Resource Observations Remain UNKNOWN (B5, M07)**
   - Eliminated `existsSync(false) -> ABSENT/DEAD` ambiguity in `parseProcStat`.
   - `parseProcStat` now attempts direct `fs.readFileSync`; non-ENOENT read errors (e.g. `EACCES`, `EPERM`) return `{ status: 'UNKNOWN', stat: null }`. Only confirmed ENOENT on both `/proc/<pid>/stat` and `/proc/<pid>` returns `ABSENT`.
   - `checkProcessAlive` maps non-ABSENT/non-KNOWN observation to `UNKNOWN` (never `DEAD`).
   - `snapshotRunProcesses` checks `ownerFile` via `checkFileAbsence`. Any `UNKNOWN` target process causes `verifyProcessesQuiescent` to return `false`, failing `destroyStack` with `DESTROY_POSTCHECK_FAIL`, performing zero file deletion, and preserving `phase: BOUND`.
   - Verified via unit checks and test `F5b`.

4. **Deliverable 4: Candidate Count Before Filter, Finite Public Errors, Real Paused Client Lifetime (B2, B4, B6, M03/M05/M08/M09)**
   - **B2 (Candidate Count Before Filter):** Post-prepare list in `startStack` filters same-ID candidates before counting (`sameIdCandidates.length !== 1` throws `RECONCILE_FAIL`), preventing contradictory same-ID candidates from being hidden. Verified via test `F6`.
   - **B6 (Finite Public Errors / Canary Sink):** Removed all `${srv}` string interpolations from error messages in `stack-manager.mjs` and `env-guard.mjs`, replacing them with static finite messages. Exercised representative unregistered canary in test `F7` through actual public child process sink with safe negative assertions (canary never printed to stdout/stderr).
   - **B4 (Real Paused Client Lifetime):** Replaced manual parent lock acquisition in `F4` with actual `probeDataReadiness` call with delayed query/end promise. While the client is paused in `end()` (CLOSE), destroy contender attempts destroy, fails with `LOCKED`, executes 0 provider adapters, and leaves authority `BOUND`. Lock is released only after close completion.

---

## 2. Changed Files and Tested Source Hashes

| File | SHA-256 Digest |
|---|---|
| `lingora-admin/tests/database/env/env-guard.mjs` | `208c7b254c32f6784b36d2a31c518d9c56a3c48df39cd2fb728f5f6154db631b` |
| `lingora-admin/tests/database/env/stack-manager.mjs` | `611db38db742ae5df7c27f03e24141c173c271f1558f455bb43066200c3deff8` |
| `lingora-admin/tests/database/env/test-env-guard.mjs` | `599952a7cd23e4b0d873ffd34be5a27512227af132ba2d9478cac849f10ef1d7` |
| `lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | `e0882cf67915263fc5992b09db25ab10bf3351c0dc924168e0dea684ad8f41d1` |
| `lingora-admin/tests/database/scaffolds/runner-base.mjs` | `ace4c06010640a2cd1bdf26a2c63280a46960eb785459454be01184546c5d27d` |
| `lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs` | `4ae35cc91f0babda8660542a8ff44642f7a8a160e9689a454fa3565049351011` |

Toolchain binaries:
- Local Supabase CLI `2.121.0`: `e91fc61f09c4fbb9c65dadc37d415640cb6d2398e65eba6d384eec74b2dbbe10`
- Pinned Node `v24.22.1`: `61ab14cd750fc24d5db53490ec5fc40f756e4b6e136b78cf7004265471d9bd1d`

---

## 3. Test Commands, Working Directory, Exit Codes, and Logs

1. **Scaffold Behavior Suite (5 tests):**
   - Command: `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs`
   - Cwd: `/home/tung/workspace/school/project1/lingora-workspace`
   - Exit Code: `0` (Passed: 5, Failed: 0, Duration: 811.0 ms)
   - Log: `docs/design/physical/evidence/2026-10-25-wp00-g0-final-repair/worker/logs/scaffold.log`

2. **Environment Guard and Failure Injection Suite (36 tests):**
   - Command: `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test lingora-admin/tests/database/env/test-env-guard.mjs`
   - Cwd: `/home/tung/workspace/school/project1/lingora-workspace`
   - Exit Code: `0` (Passed: 36, Failed: 0, Duration: 9573.6 ms)
   - Log: `docs/design/physical/evidence/2026-10-25-wp00-g0-final-repair/worker/logs/guard.log`

3. **Fresh Native Lifecycle and Real Readiness (1 test, R01):**
   - Command: `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs`
   - Cwd: `/home/tung/workspace/school/project1/lingora-workspace`
   - Exit Code: `0` (Passed: 1, Failed: 0, Duration: 240161.6 ms)
   - Log: `docs/design/physical/evidence/2026-10-25-wp00-g0-final-repair/worker/logs/lifecycle-readiness.log`

---

## 4. Carry-Forward and Native Proof Disposition

- **M02 (Intent): PASS (CARRIED FORWARD)**
  - Unchanged durable intent before provider effect, directory fsync, and EIO failure-injection logic; existing P01 and F2 proofs carry.
- **Historical Evidence (Clean Install, Parity, D0 Characterization): CARRIED FORWARD**
  - Dependency manifests, lockfile, verifier, bootstrap, and isolation inputs unchanged.
  - SVG/PNG normalization and 34-entity parity unchanged.
  - Pinned CLI 2.121.0 binary hash and platform facts unchanged.
- **M10 (Native Proof): PASS (INVALIDATED AND RE-RUN ONCE)**
  - Invalidation reason: Initial post-prepare candidate reconciliation, `parseProcStat` non-ENOENT UNKNOWN handling, and `destroyStack` pending checks directly touched native lifecycle paths.
  - Fresh execution: Allocates new run `run-114b6d3f60299bc0`, stack `lingora-wp00-d39a8f44`, instance ID `fca5123f10909dc0bd02228ce011b3bf85cd72cd5a37a69a987c399c66d787ec`.
  - Termination: Target stack confirmed absent from registry; native state files ABSENT (ENOENT); 0 active run processes; target ports [54321, 54322, 54324] quiescent; tombstone recorded in `owner.json`; credentials and member-map deleted; termination verdict `VERIFIED_ABSENT`.
- **Failed Allocation Disposition:**
  - `run-823006cc1b9e0057` timed out during initial prepare disk extraction at the previous 180s threshold. Durable intent retained in `owner.json` (`phase: RESERVED`, `pending_operation: prepare`). Zero credentials created, zero data probes executed, daemon terminated cleanly. Retained untouched under private namespace.

---

## 5. Criteria Mapping and Verdicts (M01–M10)

| Criterion | Worker Verdict | Basis |
|---|---|---|
| **M01 Isolation** | **PASS** | Production CLI rejects custom `--runs-dir` before any action (B1, test 16b); isolated per-run directories under pinned `.wp00-runs/pkg-g0-minimal`. |
| **M02 Intent** | **PASS** | Carried forward; durable intent persisted before mutation; parent directory fsync enforced. |
| **M03 Exact Target** | **PASS** | Initial post-prepare candidates counted before filter (B2, test F6); exact full 64-char ID, stack name, branch, project root, and member UUID continuity required. |
| **M04 Denial Boundary** | **PASS** | All public entry points and scaffolds reject invalid/pending state with zero mutation and zero data probes (B1, B3, tests N01, 16b, F3, scaffold 5). |
| **M05 Serialization** | **PASS** | Real paused data client in F4 with delayed query/close promise verifies destroy contender is locked out with 0 effects while lock is held through CLOSE (B4). |
| **M06 Ambiguity** | **PASS** | Universal pending-operation rule across start, status, stop, destroy, data, and scaffold paths denies with finite `RECOVERY_REQUIRED` (B3, test F3, scaffold 5). |
| **M07 Termination** | **PASS** | Required process read errors remain UNKNOWN without `existsSync` ambiguity; `destroyStack` fails closed on UNKNOWN and preserves `BOUND` recovery state (B5, tests F5, F5b). Real termination postconditions verified in M10. |
| **M08 Data** | **PASS** | Shared `executeUnderLockDataAuthorization` enforces BOUND phase, absence of pending operations, live running status, typed PG, and fixed HTTP endpoints before probes (B3, B4). |
| **M09 Safe Output** | **PASS** | Removed provider string interpolation from errors; representative unregistered canary exercised through public child process sink with safe negative assertions (B6, test F7). |
| **M10 Native Proof** | **PASS** | Complete fresh native disposable run (`run-114b6d3f60299bc0`) executed cleanly through production transports with verified termination postconditions. |

---

## 6. Remaining Blockers

**None.** All four blocker groups (B1–B6) are fully repaired and verified with deterministic tests and fresh native execution evidence.

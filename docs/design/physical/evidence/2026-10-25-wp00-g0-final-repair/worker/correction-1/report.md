# WP-00/G0 Final Bounded Repair — Worker Correction 1/1 Report

**Date:** 2026-10-25  
**Task:** WP-00/G0 Final Bounded MUST Repair — Correction Round 1/1  
**Status:** PASS (Worker implementation & verification complete; acceptance authority belongs to Codex)  
**Codex Review Reference:** `docs/design/physical/evidence/2026-10-25-wp00-g0-final-repair/codex-review-1.md`  

---

## 1. Defect Addressed (M09 Safe Output)

In Codex Review 1, criteria M01–M08 and M10 were verified **PASS**. Criterion **M09 (Safe Output)** remained OPEN due to:
- `assertNoPendingOperation` in `env-guard.mjs` interpolated unchecked `authority.pending_operation` into the exception message.
- `runner-base.mjs` directly output `authority.pending_operation` via `errFn`.
- Because `validateAuthorityRecord` allows arbitrary truthy pending values to facilitate post-crash recovery, a malformed recovery record with an unregistered secret canary in `pending_operation` would safely deny mutation but leak its raw secret content across public output sinks.

---

## 2. Changes Made (Diagnostic-Only Repair)

1. **`lingora-admin/tests/database/env/env-guard.mjs`:**
   - Modified `assertNoPendingOperation()` to use a completely static denial message:
     `${commandName.toUpperCase()}_FAIL: Existing pending operation (RECOVERY_REQUIRED). Recovery required.`
   - Retained `err.code = 'RECOVERY_REQUIRED'` and `err.disposition = 'recovery-required'`.
   - Zero dynamic interpolation of `authority.pending_operation`.

2. **`lingora-admin/tests/database/scaffolds/runner-base.mjs`:**
   - Modified pending operation check under lock to use a static diagnostic:
     `[TEST-SCAFFOLD] RECOVERY_REQUIRED: Existing pending operation. Recovery required.`
   - Retained exit code 1, `status: 'FAILED'`, `code: 'RECOVERY_REQUIRED'`, and zero provider/data/test execution.

3. **`lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs`:**
   - Added Test 6: `Representative unregistered pending-secret canary in authority.pending_operation never leaks to scaffold stdout or stderr`.
   - Generates an unregistered synthetic canary `UNREG_PENDING_CANARY_<hex>`, verifies `isCanaryRegistered() === false`, injects it into `authority.pending_operation`, and invokes `runScaffold`.
   - Asserts exit code 1, `RECOVERY_REQUIRED`, safe negative assertions (canary never printed in stdout or stderr), zero side-effects (0 test runner, 0 PG queries, 0 CLI commands), and disk authority preserved with original pending canary and BOUND phase intact.
   - Enforced explicit `0o700` mode on mock run directory (`fs.chmodSync(runDir, 0o700)`) to satisfy strict permission checks across all umask configurations.

4. **`lingora-admin/tests/database/env/test-env-guard.mjs`:**
   - Added Test F7b: `Representative unregistered pending-operation canary never leaks across public library/child output`.
   - Spawns a real child process executing `statusStack` with an authority containing an unregistered canary `UNREG_PENDING_SECRET_<hex>`.
   - Asserts child exit code 1, safe negative assertions (canary never printed in stdout or stderr), output matches `/RECOVERY_REQUIRED/`, and on-disk authority retains BOUND phase and the original pending canary.
   - Enforced explicit `0o700` mode on mock run directory (`fs.chmodSync(runDir, 0o700)`).

---

## 3. Tested Source SHA-256 Hashes

| File | SHA-256 Digest |
|---|---|
| `lingora-admin/tests/database/env/env-guard.mjs` | `a2ee615d548c7645b96bb05e739b0312527f7fc8358e3c1ca32e91e631601592` |
| `lingora-admin/tests/database/env/stack-manager.mjs` | `611db38db742ae5df7c27f03e24141c173c271f1558f455bb43066200c3deff8` |
| `lingora-admin/tests/database/env/test-env-guard.mjs` | `360271f42f0202592252b053617840acb79468e425ab83e5514f5d85ac2594b7` |
| `lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | `e0882cf67915263fc5992b09db25ab10bf3351c0dc924168e0dea684ad8f41d1` |
| `lingora-admin/tests/database/scaffolds/runner-base.mjs` | `05a12041479aa73668056edbc69b6417883c2edb60fc5b97d2873f057ccb036e` |
| `lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs` | `4d9a2cee30ceb0d52f6984c34827bcd86403c1bb824cefe4cb78793aaaf758d5` |

Toolchain binaries:
- Local Supabase CLI `2.121.0`: `e91fc61f09c4fbb9c65dadc37d415640cb6d2398e65eba6d384eec74b2dbbe10`
- Pinned Node `v24.22.1`: `61ab14cd750fc24d5db53490ec5fc40f756e4b6e136b78cf7004265471d9bd1d`

---

## 4. Test Commands, Working Directory, Exit Codes, and Logs

1. **Scaffold Behavior Suite (6 tests):**
   - Command: `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs`
   - Cwd: `/home/tung/workspace/school/project1/lingora-workspace`
   - Exit Code: `0` (Passed: 6, Failed: 0, Duration: 877.6 ms)
   - Log: `docs/design/physical/evidence/2026-10-25-wp00-g0-final-repair/worker/correction-1/logs/scaffold.log`

2. **Environment Guard and Failure Injection Suite (37 tests):**
   - Command: `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test lingora-admin/tests/database/env/test-env-guard.mjs`
   - Cwd: `/home/tung/workspace/school/project1/lingora-workspace`
   - Exit Code: `0` (Passed: 37, Failed: 0, Duration: 9613.9 ms)
   - Log: `docs/design/physical/evidence/2026-10-25-wp00-g0-final-repair/worker/correction-1/logs/guard.log`

3. **Fresh Native Lifecycle and Real Readiness (1 test, carried from initial delivery):**
   - Log: `docs/design/physical/evidence/2026-10-25-wp00-g0-final-repair/worker/correction-1/logs/lifecycle-readiness.log`
   - Disposition: CARRIED FORWARD per Codex Review 1 instructions. Diagnostic-only error message fixes do not alter the native transport lifecycle or verified termination postconditions (`run-114b6d3f60299bc0`).

---

## 5. Carry-Forward and Retained Authority Disposition

- **M02 Intent:** Carried forward with rationale. Intent persistence, directory fsync, and EIO failure injection untouched; P01 and F2 pass in guard suite.
- **M10 Native Proof:** Carried forward from initial delivery fresh R01 execution `run-114b6d3f60299bc0` (exit 0, duration 240.0s). Pinned CLI 2.121.0 binary hash and platform facts remain unchanged. No rerun solely for timestamp.
- **Retained Quarantine Authority:** `run-823006cc1b9e0057` remains preserved on disk with durable intent retained (`phase: RESERVED`, `pending_operation: prepare`). Zero data probes, zero credentials generated, lingering daemon terminated cleanly. Treated as `RECOVERY_REQUIRED` disposition, not claimed as verified teardown.

---

## 6. Criteria Status (M01–M10)

| Criterion | Worker Verdict | Basis |
|---|---|---|
| **M01 Isolation** | **PASS** | Verified in Review 1 (B1, test 16b, trusted internal L01 bootstrap). |
| **M02 Intent** | **PASS** | Carried forward; intent persistence, fsync order, and EIO failure injection unchanged. |
| **M03 Exact Target** | **PASS** | Verified in Review 1 (B2, test F6 candidate counting before filter). |
| **M04 Denial Boundary** | **PASS** | Verified in Review 1 (B1, B3, tests N01, 16b, F3, scaffold 5). |
| **M05 Concurrency & Lock Lifetime** | **PASS** | Verified in Review 1 (B4, paused client through CLOSE in test F4; L01 child contention). |
| **M06 Authority Reconciliation & Pending Denial** | **PASS** | Verified in Review 1 (B3, universal pending denial across all entry points). |
| **M07 Observation Boundary** | **PASS** | Verified in Review 1 (B5, parseProcStat non-ENOENT UNKNOWN handling; test F5b). |
| **M08 Data Authorization** | **PASS** | Verified in Review 1 (shared locked live reconciliation path; through-close F4). |
| **M09 Safe Output** | **PASS** | Corrected: static finite denial diagnostics in `assertNoPendingOperation` and `runner-base.mjs`; representative unregistered pending canaries exercised through public child sink (F7b) and scaffold (test 6) with 0 leak and 0 side effects. |
| **M10 Provider Lifecycle & Verified Teardown** | **PASS** | Carried forward from Review 1 fresh R01 (`run-114b6d3f60299bc0`, exit 0, verified absent postconditions). |

---

## 7. Remaining Blockers

**None.** All ten criteria (M01–M10) are verified PASS by worker evidence. Codex retains sole acceptance authority.

# WP-00 / G0 Minimal Safety Package — Worker Execution Report

- **Task**: WP-00/G0 Minimal Safety Package Implementation & Testing
- **Execution Date**: 2026-10-25
- **Role**: Antigravity Worker (Implementation & Test Owner)
- **Review & Acceptance Authority**: Codex (Independent Reviewer; this report does **not** claim G0 accepted)
- **Status**: **PASS** (Worker implementation, unit/fake suites, and real native lifecycle verified)

---

## 1. Changed Files

| File | Relative Path | Final Tested SHA256 |
|---|---|---|
| Environment Guard | `lingora-admin/tests/database/env/env-guard.mjs` | `3cf77ee73659d8247d9b2d4aaea66505147a85c7577726e7b671111c4d45faac` |
| Stack Manager | `lingora-admin/tests/database/env/stack-manager.mjs` | `8500c848b4e9a8cfc3627ddf633cda326ee099307a09df7613f36618682dc9f1` |
| Scaffold Runner Base | `lingora-admin/tests/database/scaffolds/runner-base.mjs` | `fb9434906563a335fd45740a00c1795485fc8cc16cc34ea397f24cd216b47409` |
| Guard Test Suite | `lingora-admin/tests/database/env/test-env-guard.mjs` | `7a81bef5e9142bc109738c5dfe9baf33c25cc5f4173d3322dfb3d5af580c1466` |
| Scaffold Test Suite | `lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs` | `829d9159d1cff8423d7adad9e14e2c39f02d24599425c22653f98819e67d94a9` |
| Lifecycle Test Suite | `lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | `19290b01371106db14947c3260a5e77458460251448ece9a9949f830b4db58fb` (unchanged) |

---

## 2. Short Diff Summary (3–6 Lines)

- **Isolation & Target Authority**: Replaced legacy run roots with `.wp00-runs/pkg-g0-minimal`, denied prior disposable run adoption, enforced full 4-tuple matching (ID, name, realpath workdir, branch), and added `verifyIncarnationContinuity` member UUID checking before all mutation commands.
- **Fail-Closed Concurrency & Quiescence**: Disabled unsafe auto-orphan-lock recovery in `acquireRunLock` (fails closed with `LOCKED`/`recovery-required`), made process checking tri-state (`ALIVE`|`DEAD`|`UNKNOWN`), and treated `UNKNOWN` as non-quiescent during teardown.
- **Data & Destroy Teardown**: Enforced running lifecycle and non-empty composition for SQL/HTTP probes, unlinked credentials and member maps only upon strict post-destroy verification (CLI absence, state/owner file absence, process quiescence, socket quiescence), and safely recorded tombstone receipts.
- **Finite Sanitized Outputs**: Redacted canaries across all return envelopes and error handlers via `STATIC_SAFE_MESSAGES` and `sanitizeString`, eliminating raw provider exception leaks across CLI and scaffold runners.

---

## 3. Commands & Tests

All tests were executed against the final tested source using pinned Node runtime `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` with PWD at canonical workspace root `/home/tung/workspace/school/project1/lingora-workspace`.

| Command | Exit Code | Tests | Duration | Safe Log Path |
|---|---|---|---|---|
| `node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs` | 0 | 4 passed / 0 failed | 802.6ms | `docs/design/physical/evidence/2026-10-25-wp00-g0-minimal/worker/logs/scaffold-behavior.log` |
| `node --test lingora-admin/tests/database/env/test-env-guard.mjs` | 0 | 27 passed / 0 failed | 3731.2ms | `docs/design/physical/evidence/2026-10-25-wp00-g0-minimal/worker/logs/env-guard.log` |
| `node --test lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | 0 | 1 passed / 0 failed | 164428.5ms | `docs/design/physical/evidence/2026-10-25-wp00-g0-minimal/worker/logs/lifecycle-readiness.log` |

### Real Native Lifecycle Execution Details (R01 / M10)
- **Run Directory**: `.wp00-runs/pkg-g0-minimal/run-554f9aa2348e317e`
- **Instance ID**: `e7f946b66379b6bb284b3fb2f49b47c3c4a53c6c11f71df68633bc951dedcd19`
- **Runtime**: `native` (Supabase CLI 2.121.0)
- **SQL Readiness**: PostgreSQL 17 confirmed via real `SELECT version(), current_database(), current_user`; schemas `auth`, `storage`, `public` verified.
- **HTTP Readiness**: Auth `/auth/v1/health` (200 OK), Storage `/storage/v1/status` (200 OK), Mail `/api/v1/messages` (200 OK).
- **Session Pooler**: Accurately reported as `DISABLED_IN_NATIVE_STACK`.
- **Honest Refusal**: Scaffold runner honesty verified under active stack (`exit 1`, `STATUS: NOT EXECUTED`).
- **Incarnation Continuity**: Preserved member UUID mapping across restart with zero duplicate prepare dispatches.
- **Teardown**: Stopped and destroyed; `owner.json` retained as tombstone receipt (`phase: 'DESTROYED'`, `tombstone: true`), credentials and member map unlinked, sockets quiescent (ports 54321, 54322, 54324 confirmed inactive).

---

## 4. Acceptance Criteria Results (G0-M01 to G0-M10)

| Criterion | Result | Primary Assertions & Test Links |
|---|---|---|
| **M01: Isolation** | **PASS** | Tests 1, 8, P01 in `test-env-guard.mjs`; Step 1 in `test-lifecycle-and-readiness.mjs`. Allocates fresh private fixture under `.wp00-runs/pkg-g0-minimal`; denies older disposable roots (`.wp00-runs/run-*`, `.wp00-home`, `.supabase-home`). Clean environment excludes host PG* variables. |
| **M02: Intent** | **PASS** | Tests P01, F02 in `test-env-guard.mjs`. Persists durable `RESERVED` authority with canonical config digest prior to CLI prepare. Prepare failure preserves `pending_operation: 'prepare'` without duplicate prepare dispatch or owner loss. |
| **M03: Exact Target** | **PASS** | Tests P01, P02, N02, N03, N04 in `test-env-guard.mjs`; Steps 1, 2, 6 in `test-lifecycle-and-readiness.mjs`. Full 64-character hex ID required. Exact 4-tuple checked against native registry. `verifyIncarnationContinuity` enforces member UUID continuity before mutation and readiness probing. Zero fallback or adoption. |
| **M04: Denial** | **PASS** | N01 & N02 matrices, Tests 4-7 in `test-env-guard.mjs`; Tests 1-2 in `test-scaffold-behavior.mjs`. Shared fail-closed validation boundary denies invalid/foreign host, mismatched ports, and unverified authority across all entry points with 0 CLI mutations and 0 HTTP/SQL probes. |
| **M05: Serialization** | **PASS** | Tests F01, F03, L01 in `test-env-guard.mjs`. Real child-process lock contention enforces mutual exclusion. Unsafe auto-orphan-lock recovery disabled; locked state fails closed with `LOCKED` (`recovery-required`). Only token owner releases lock. |
| **M06: Ambiguity** | **PASS** | Tests F04, F02b in `test-env-guard.mjs`. Pending prepare with single matching stack resumes same intent; zero matches trigger `RECOVERY_REQUIRED` fail-closed error. Stack name collision rejects before prepare. |
| **M07: Termination** | **PASS** | Tests F05, F06, F07, P03 in `test-env-guard.mjs`; Steps 5, 7, 8 in `test-lifecycle-and-readiness.mjs`. Tri-state process checking (`ALIVE`\|`DEAD`\|`UNKNOWN`) fails closed on `UNKNOWN`. Destroy requires strict postcheck passing (registry absence, state/owner file absence, process quiescence, socket quiescence) before unlinking credentials. Safe idempotent destroy retry on tombstone. |
| **M08: Data** | **PASS** | Tests 2-6 in `test-env-guard.mjs`; Tests 3-4 in `test-scaffold-behavior.mjs`; Step 1 in `test-lifecycle-and-readiness.mjs`. Live credentials required; PostgreSQL 17 query execution, Auth health, Storage status, and Mail API verified with lowest client transport. Client always ended in `finally`. Private credentials unlinked upon destroy. |
| **M09: Output** | **PASS** | Tests 9, E01, E02, 17 in `test-env-guard.mjs`; Tests 1-4 in `test-scaffold-behavior.mjs`. `STATIC_SAFE_MESSAGES` table projects bounded error messages; synthetic control canary is never leaked into outputs, logs, or error text. Child stdout/stderr sanitized. |
| **M10: Native** | **PASS** | Real execution `test-lifecycle-and-readiness.mjs` (R01). Verified prepare, live SQL/Auth/Storage/Mail readiness, honest scaffold refusal, stopped state, restart with member map continuity, and complete destroy with clean post-execution port quiescence. |

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

# Lingora WP-00/G0 D1+D2 Worker Correction Report (Round 1)

## Executive Summary
- **Package**: WP-00 / G0 — Work Packages D1 + D2 Correction Round 1
- **Status**: **PASS**
- **Date**: 2026-10-25
- **Owner**: Single Antigravity Implementation Owner
- **Review Authority**: Codex (Round 1 Review Resolution)
- **Node Runtime**: v24.22.1 (`/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`)
- **Pinned CLI**: Supabase CLI 2.121.0 (`node_modules/@supabase/cli-linux-x64/bin/supabase`)
- **Pinned ORM**: Prisma 6.19.3 (`node_modules/.bin/prisma`)

All six findings (R1–R6) from the Codex Round 1 Review (`docs/design/physical/evidence/2026-10-25-wp00-g0-d1-d2/codex-review-round-1.md`) have been structurally resolved and verified through deterministic automated test suites, mutation sensitivity checks, real native provider execution, clean-install dependency verification, and provenance parity checks.

---

## Findings Resolution Summary

### R1: Workdir / Project Root Isolation & Member Incarnation Continuity
- **Config-Only Git Fixture**: Provider native executions (`stack prepare`, `stack start`, `stack status`, `stack stop`, `stack destroy`) no longer use the repository workspace root as `workdir` / `project_root`. Every run allocated via `allocateRun` initializes a minimal, isolated Git repository inside `.wp00-runs/<runId>/fixture` committed with canonical `supabase/config.toml`. `workdir_is_repository` is false.
- **Cache Pre-population Eliminated**: Removed `.supabase-home/cache` copy operations. Runs execute against clean, disposable homes (`.wp00-runs/<runId>/home`).
- **Member UUID Map Incarnation Continuity**: Addressed the discovery that `stack list` does not compose members. The dispatcher queries fresh exact-ID `status` under run lock, captures the full member UUID map (`member_map`), and validates incarnation continuity on all subsequent starts, status checks, and data queries. Counterexample test `N04` proves that stacks recreated with the same logical ID and name but different member UUIDs are rejected with `RECONCILE_FAIL` and execute zero data probes.

### R2: Unified Locked Dispatcher, Safe Process/Socket Observer & Orphan Recovery
- **Unified Dispatcher**: All provider mutations follow the locked lifecycle contract: acquire lock -> reread authority -> reconcile native registry -> persist intent -> execute effect -> verify postconditions -> project finite output -> release lock in `finally`.
- **Strict Orphan Lock Recovery**: Orphan lock unlinking checks not only harness PID death, but actively inspects Linux `/proc` for active provider processes and `/proc/net/tcp` for listening sockets. If background processes or sockets are active, lock clearing is denied (`disposition: recovery-required`).
- **Socket & Process Observation**: Enhanced `/proc/net/tcp` inspection to explicitly match TCP_LISTEN state (`'0A'`) and incorporate bounded polling retries for graceful shutdown transitions.
- **In-flight Crash Recovery**: Multi-match prepare crashes fail closed with `RECOVERY_REQUIRED`; single-match prepare crashes safely recover and bind the full ID without redundant prepares (`F04`).

### R3: Lowest Transport Adapters & Precise Call Assertions
- **PostgreSQL**: Implemented `adapters.pgClientFactory` with explicit client configuration (host, port, user, password, database) and explicitly stripped `PG*` environment variables. Direct SQL queries assert PostgreSQL 17.11 SELECT proof, database name `postgres`, and required schemas (`auth`, `storage`, `public`, `extensions`).
- **HTTP Probes**: Standardized `adapters.fetch` probes requiring HTTP status 200, `redirect: 'error'`, and `AbortController` timers cleared in `finally` blocks.
- **Matrix Assertions**: All tests verify exact call counts and argument traces (`cliCalls`, `httpCalls`, `sqlCalls`).

### R4: Scaffold Runner Locked Boundary & Honest Refusal
- **Locked Runner Base**: `runner-base.mjs` requires explicit `--run <run-id>` and executes under exclusive run lock with native registry and live member continuity reconciliation. Arbitrary binding files and `allowTempRoots` bypass paths have been removed.
- **Honest Refusal (`STATUS: NOT EXECUTED`)**: If the target test directory is missing or empty, the runner outputs `STATUS: NOT EXECUTED` and exits with code 1. It never fakes `PASS`.
- **Deliberate Failure Propagation**: If test files exist, the runner executes them via the Node test runner in a clean child environment (`NODE_TEST_CONTEXT` stripped) and propagates the failure exit code without mutating canonical state (`test-scaffold-behavior.mjs`).

### R5: Strict Finite Output Projection & Unregistered Control-Secret Redaction
- **Finite Output Projection**: `projectFiniteOutput` strictly projects allowlisted enums (`command`, `stage`, `status`, `code`, `phase`, `retry_disposition`) and pre-defined static safe messages. Caller message overrides and raw provider error snippets are unconditionally ignored.
- **Unregistered Synthetic Canary**: Private synthetic control-secret canaries (`CANARY_PRIVATE_UNREGISTERED_*`) were deliberately UNREGISTERED in regex sanitizers and injected into CLI stdout, CLI stderr, JSON parser errors, PostgreSQL connection/query exceptions, HTTP fetch errors, and teardown crashes. The test suite asserts that the canary is 100% absent from all outputs and error messages without ever leaking the secret on assertion failure (`E01 & E02`).

### R6: Native Execution & Complete Deterministic Evidence
- **Real Native Execution (`R01`)**: Executed independent full lifecycle verification on Supabase CLI 2.121.0 against a fresh disposable native stack. Captured real PostgreSQL 17.11 query proofs, Auth 200, Storage 200, and Mail 200.
- **Session Pooler Reporting**: Verified pooler status reported as `DISABLED_IN_NATIVE_STACK` with an explicit architectural note that native direct SQL does not satisfy the A2 session-pooler requirement.
- **Complete Safe Evidence**: All test logs and checks capture complete command, cwd, exit code, and sanitized output in `docs/design/physical/evidence/2026-10-25-wp00-g0-d1-d2/worker/correction-1/logs/`.

---

## Tested Source Hashes (SHA-256)
- `lingora-admin/tests/database/env/env-guard.mjs`: `d06ce4b8e36a0b77e3a2c2b8e645d882768b8f5603ae4541fb6c1ca1f10bb2d0`
- `lingora-admin/tests/database/env/stack-manager.mjs`: `ae4131889f956f58f8d1b3b58e5d3a92a23fba401e6d408b4ad3ac21ab307d43`
- `lingora-admin/tests/database/env/test-env-guard.mjs`: `0379f0366337dce0b8a70bca52a09a6ebba8178673ef7497960219cd78dbb803`
- `lingora-admin/tests/database/scaffolds/runner-base.mjs`: `7b4f917adbd48f2b8638abb32c774b0fe858373f972a54535b921fe9d3048120`
- `lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs`: `0591b1142b577fe3ef0a93a5c97e42c6ea89b2e929f4d13f6999a7751123d3d9`
- `lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs`: `19290b01371106db14947c3260a5e77458460251448ece9a9949f830b4db58fb`

---

## Verification Matrix & Results

| Check ID | Description | Command | Exit Code | Result | Evidence Log |
|---|---|---|:---:|:---:|---|
| **D1-UNIT** | WP-00/G0 D1 Unit, Injection, Concurrency, and Canary Suite | `node --test lingora-admin/tests/database/env/test-env-guard.mjs` | 0 | **PASS** (26/26) | `logs/d1-test-env-guard.log` |
| **D2-SCAFFOLD** | WP-00/G0 D2 Scaffold Honest Behavior and Fail-Closed Suite | `node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs` | 0 | **PASS** (4/4) | `logs/d2-test-scaffold-behavior.log` |
| **MUTATION** | Focused Mutation Sensitivity Suite (3 mutations) | `node docs/.../run-mutation-checks.mjs` | 0 | **PASS** (3/3 caught) | `logs/mutation-checks.log` |
| **R01-NATIVE** | Real Native Supabase 2.121.0 Lifecycle & Readiness Verification | `node --test lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | 0 | **PASS** (1/1) | `logs/r01-native-lifecycle.log` |
| **V01-CLEAN-CI** | Isolated Clean Installation Proof via Locked `npm ci` | `node scripts/verify-dependencies.mjs --clean-install` | 0 | **PASS** | `logs/v01-dependencies-clean-install.log` |
| **V01-PARITY** | Model & Physical ERD Provenance Parity Verification | `python3 scripts/verify-provenance.py` | 0 | **PASS** | `logs/v01-provenance-parity.log` |

---

## Remaining Risks & Blockers
- **Session Pooler in Native Mode**: Supabase native runtime does not bundle a Supabase-managed Supavisor session pooler (`DISABLED_IN_NATIVE_STACK`). Direct G0 SQL access does not satisfy future A2 requirements; A2 must provision an external PgBouncer/Supavisor instance or run via containerized runtime where pooler is bundled.
- **Dependency Advisory Warnings**: Locked `npm ci` reports 3 high severity vulnerabilities in dev toolchain packages (`cross-spawn`). Package versions remain strictly pinned per G0 frozen specification; updates should be triaged in future maintenance packages.
- **Git Preservation**: All unrelated working tree modifications remain untouched. No commits or pushes have been executed.

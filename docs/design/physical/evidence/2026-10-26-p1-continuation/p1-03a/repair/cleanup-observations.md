# RP-07 Cleanup & Residue Reconciliation

- Date: 2026-10-26T13:05:00+07:00
- Workspace Root: `/home/tung/workspace/school/project1/lingora-workspace`
- Target: Bounded lifecycle state, credential disposal, and historical run reconciliation (Finding A3-R6)

---

## 1. Scope, Invariants, and Governance

RP-07 requires bounded, metadata-verified reconciliation of all named runs without reading credential secrets, without creating absent residues, and without reconnecting or re-destroying historical stacks:
- **Prior Named Residue Runs (3)**: `run-6e06a876bbd1c498`, `run-3256c3b16f733619`, `run-3be6d5ff41229fac`.
- **Prior Session Allocations (2)**: `run-dca84591a0dbc8f5`, `run-dba39f772e58027a`.
- **Authorized Correction Run (1)**: `run-bcdc41a8b995232f`.

Invariants maintained:
- Zero credential contents inspected or recorded.
- Directory and tombstone permissions verified (`0700` directory, `0600` tombstone `owner.json`, UID 1000 ownership, non-symlink).
- Historical absence confirmed by real `lstat` checks; historical uncaptured commands explicitly marked `UNPROVED`.
- Active correction run followed strict sequence: allocate -> execute guarded suite -> disconnect consumers -> lifecycle disposal -> verify absence -> destroy stack -> capture receipt.

---

## 2. Prior Named Residue Runs Reconciliation

Independent inspection confirms that all three authorized residue run directories are regular directories (non-symlink, mode `0700`, UID 1000) containing valid tombstones (`owner.json`, mode `0600`, UID 1000) with `phase: "DESTROYED"`, `tombstone: true`, `pending_operation: null`.

All six exact A3 credential/state paths (`runtime-credentials.json` and `a3-baseline-state.json`) are confirmed absent via `lstat` (`ENOENT`).

Because exact command execution receipts from historical file removals were not captured during the original sessions, historical deletion execution is formally recorded as **UNPROVED** (absence is confirmed by current inspection, but historical execution is not claimed without command provenance).

### Run 1: `run-6e06a876bbd1c498`
- **Path**: `.wp00-runs/pkg-g0-minimal/run-6e06a876bbd1c498`
- **Actual Instance ID**: `d1793d4c84b5a9c7dd0c4ee10f619e57f398b677ca22fa5a265b035d08b9fcee`
- **Actual Destroyed At**: `2026-10-26T02:56:58.296Z`
- **Status**: `DESTROYED`, `tombstone: true`, `pending_operation: null`
- **A3 Residue Check**:
  - `runtime-credentials.json`: Absent via `lstat` (`ENOENT`)
  - `a3-baseline-state.json`: Absent via `lstat` (`ENOENT`)
- **Historical Execution**: Unproved (uncaptured command output). Current absence verified.

### Run 2: `run-3256c3b16f733619`
- **Path**: `.wp00-runs/pkg-g0-minimal/run-3256c3b16f733619`
- **Actual Instance ID**: `5a0adfe1f1937c78562f72a577f130d3461a333a289a6868bfe3fe4c630a3ccd`
- **Actual Destroyed At**: `2026-10-26T02:59:41.900Z`
- **Status**: `DESTROYED`, `tombstone: true`, `pending_operation: null`
- **A3 Residue Check**:
  - `runtime-credentials.json`: Absent via `lstat` (`ENOENT`)
  - `a3-baseline-state.json`: Absent via `lstat` (`ENOENT`)
- **Historical Execution**: Unproved (uncaptured command output). Current absence verified.

### Run 3: `run-3be6d5ff41229fac`
- **Path**: `.wp00-runs/pkg-g0-minimal/run-3be6d5ff41229fac`
- **Actual Instance ID**: `dee2fbc0e119e37b92bbf4fe0673140b3bf0c3d0120ae2c556ba8b639df6e141`
- **Actual Destroyed At**: `2026-10-26T03:33:02.598Z`
- **Status**: `DESTROYED`, `tombstone: true`, `pending_operation: null`
- **A3 Residue Check**:
  - `runtime-credentials.json`: Absent via `lstat` (`ENOENT`)
  - `a3-baseline-state.json`: Absent via `lstat` (`ENOENT`)
- **Historical Execution**: Unproved (uncaptured command output). Current absence verified.

---

## 3. Prior Session Allocations Reconciliation

### Allocation 1: `run-dca84591a0dbc8f5`
- **Path**: `.wp00-runs/pkg-g0-minimal/run-dca84591a0dbc8f5`
- **Actual Instance ID**: `2c33fce89e8865f9238d9a0d18150868f587ce5f1628febad355428ea452f4f4`
- **Stack Name**: `lingora-wp00-b698416e`
- **Actual Destroyed At**: `2026-10-26T05:18:53.974Z`
- **Status**: `DESTROYED`, `tombstone: true`, `pending_operation: null`
- **A3 Residue Check**:
  - `runtime-credentials.json`: Absent via `lstat` (`ENOENT`)
  - `a3-baseline-state.json`: Absent via `lstat` (`ENOENT`)

### Allocation 2: `run-dba39f772e58027a`
- **Path**: `.wp00-runs/pkg-g0-minimal/run-dba39f772e58027a`
- **Actual Instance ID**: `98fb309b7995bc3648e1c572d0349ab23bc7063383074059cf1dcee1ff8e6d72`
- **Stack Name**: `lingora-wp00-2963c6a6`
- **Actual Destroyed At**: `2026-10-26T05:12:00.473Z`
- **Status**: `DESTROYED`, `tombstone: true`, `pending_operation: null`
- **A3 Residue Check**:
  - `runtime-credentials.json`: Absent via `lstat` (`ENOENT`)
  - `a3-baseline-state.json`: Absent via `lstat` (`ENOENT`)
- **Historical Execution**: Background dispatch allocation without captured test output; recorded as UNPROVED. Current absence verified.

---

## 4. Fresh Correction Run Lifecycle & Verified Disposal: `run-bcdc41a8b995232f`

### 4.1 Startup Receipt
- **Command**: `node lingora-admin/tests/database/env/stack-manager.mjs start --new-run`
- **Start Time**: `2026-10-26T05:44:45.329Z`
- **End Time**: `2026-10-26T05:46:32.318Z`
- **Exit Code**: `0`
- **Emitted Run ID**: `run-bcdc41a8b995232f`
- **Instance ID**: `66d43dc6bf0d397801ab3c94b3d7ec0c23977d023206fb881b8e2c146e9bf16b`
- **Phase**: `BOUND`
- **CLI stdout**:
```json
{
  "command": "start",
  "stage": "completed",
  "status": "BOUND",
  "code": "SUCCESS",
  "run_id": "run-bcdc41a8b995232f",
  "instance_id": "66d43dc6bf0d397801ab3c94b3d7ec0c23977d023206fb881b8e2c146e9bf16b",
  "phase": "BOUND",
  "exit_code": 0,
  "count": null,
  "retry_disposition": null,
  "message": "Operation completed successfully."
}
```

### 4.2 Guarded Test Suite Execution
- **Command**: `npm run test:db:a3 -w lingora-admin -- --run run-bcdc41a8b995232f`
- **Start Time**: `2026-10-26T06:01:00.724Z`
- **End Time**: `2026-10-26T06:01:17.798Z`
- **Exit Code**: `0`
- **Summary**: `21/21 tests passed` (0 failed, 0 cancelled, 0 skipped).
- **Execution Projections Saved**: `docs/design/physical/evidence/2026-10-26-p1-continuation/p1-03a/repair/execution-projections.json`

### 4.3 Verified Lifecycle Cleanup
- Disconnection order: runtime Prisma client disconnected, setup PG client ended.
- `cleanupA3Baseline(ctx)` invoked in test suite `after()` hook:
  - `runtime-credentials.json`: disposed via atomic descriptor unlink.
  - `a3-baseline-state.json`: disposed via atomic descriptor unlink.
- Independent `lstat` verification on run directory `.wp00-runs/pkg-g0-minimal/run-bcdc41a8b995232f`:
  - `runtime-credentials.json`: `CONFIRMED ABSENT (ENOENT)`
  - `a3-baseline-state.json`: `CONFIRMED ABSENT (ENOENT)`
  - `.run.lock`: `CONFIRMED ABSENT (ENOENT)`

### 4.4 Stack Destruction Receipt
- **Command**: `node lingora-admin/tests/database/env/stack-manager.mjs destroy --run run-bcdc41a8b995232f`
- **Start Time**: `2026-10-26T06:01:38.332Z`
- **End Time**: `2026-10-26T06:01:43.660Z`
- **Exit Code**: `0`
- **CLI stdout**:
```json
{
  "command": "destroy",
  "stage": "completed",
  "status": "DESTROYED",
  "code": "SUCCESS",
  "run_id": "run-bcdc41a8b995232f",
  "instance_id": "66d43dc6bf0d397801ab3c94b3d7ec0c23977d023206fb881b8e2c146e9bf16b",
  "phase": "DESTROYED",
  "exit_code": 0,
  "count": null,
  "retry_disposition": null,
  "message": "Operation completed successfully."
}
```
- **Post-destruction `owner.json`**:
  - `phase`: `DESTROYED`
  - `tombstone`: `true`
  - `destroyed_at`: `2026-10-26T06:01:43.646Z`
  - Run directory preserved as accepted immutable tombstone.

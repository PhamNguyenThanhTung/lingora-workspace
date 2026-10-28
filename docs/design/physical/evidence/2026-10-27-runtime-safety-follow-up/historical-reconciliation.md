# Runtime Safety Follow-up — Historical Evidence Reconciliation

**Date:** 2026-10-27T11:05:00+07:00. This is an authoritative reconciliation record for task `runtime-safety-follow-up` (incorporating Final-Review Correction 1/1); dated CLEANUP-01 snapshots remain unchanged.

## Evidence classification

| Claim | Classification | Source and limit |
|---|---|---|
| Final CLEANUP-01 review rejected acceptance after correction 1/1 | OBSERVED | [Final review](../2026-10-26-repository-cleanup/codex-review-final.md); controls the prior task disposition and defined MUST findings C1–C5. |
| Rollback archive and restoration verification exist outside the repository | OBSERVED (metadata inspection) | Private `/home/tung/workspace/school/lingora-cleanup-rollback-20261026T082320Z/RESTORE.md`, `entry-manifest.json`, `restore-verification.json`; verified present and uncorrupted by metadata check; distinct from fresh archive-wide checksum execution. No private state/secrets copied into repository. |
| 1,847 baseline files recorded at start of cleanup review | OBSERVED (historical snapshot) | `/home/tung/workspace/school/lingora-cleanup-rollback-20261026T082320Z/codex-final-observation.json` records 1,847 baseline files at `2026-10-26T10:04:53.360941+00:00`. |
| 22 original harness owners -> 24 pre-task owners -> fresh test owner chain | OBSERVED / RECONCILED | 22 original test runs under `.wp00-runs/pkg-g0-minimal/` + 2 legacy root runs (`run-1fab09c87d538b05`, `run-70c765fff1ad8203`) = 24 pre-task historical owners. Fresh native test runs added `run-faf1493de3463ab0` (and `run-af1371dc4e4b01d7`). |
| Native lifecycle positive run completed with exit 0 in historical task-768 | OBSERVED | Retained `task-768.log` (1,186 bytes, SHA-256: `6cb65aa0af16be12bf606b47223b2dad4d67ebb475f802de855940b85367abfe`); proves single lifecycle execution, not universal disposal invariants. |
| Four recovery outputs were reported in historical task-216 | OBSERVED | Retained `task-216.log` (1,912 bytes, SHA-256: `d8ab8ff3eaa24cae72decef31c92df6807ca1f3bbd90baba1ef4b032e47a064b`); bounded output records only; does not prove per-operation lock, tuple, or pin invariant on past runs. |
| Task-227 records 20 current-namespace prunes, then failure at first legacy root | OBSERVED | Retained `task-227.log` (3,482 bytes, SHA-256: `674ca907cb7f3cc6f57abfaf18317abed8aef1f29fca09409d8b628d85b9cb25`); proves failure at first legacy root (`run-1fab09c87d538b05`). Historical 22-run claim was not supported by that log. |
| Native lifecycle positive run completed with exit 0 in task-482 | OBSERVED | Retained native lifecycle log `/home/tung/.gemini/antigravity-cli/brain/def021ce-b813-4aba-a6e3-90ad31f108ab/.system_generated/tasks/task-482.log` (1,187 bytes, SHA-256: `f7604db2ca18174c4bb5d13463376372001ad535b58694209ed9382836c3f11e`). Proves positive lifecycle under previous observation heuristics. |
| Historical reports asserted all 22 runs were pruned under full final locks/validation | UNAVAILABLE as historical proof | Recorded task-227 failure and absence of per-operation evidence make that claim unsupported. Historical reports remain intact as immutable history; this document controls acceptance. |
| 28.22 GiB was reclaimed by historical cleanup | RECONSTRUCTED / RECONCILED | 28.22 GiB was a dated workspace measurement on 2026-10-26, NOT a sum of historical per-run `bytesFreed`. |
| Historical per-run `bytesFreed` equals physical blocks reclaimed | UNAVAILABLE as physical claim | Prior calculations did not account for external hardlinks; unlinking a directory containing an external hardlink does not reclaim its underlying disk blocks. |
| 2026-10-26 workspace/runtime sizes and free-space values | OBSERVED (historical snapshot) | Recorded in `codex-final-observation.json` (`allocated_bytes`: `.` 2,311,974,912, `.wp00-runs` 5,931,008; `filesystem_available_bytes`: 427,193,761,792). Preserved without modification. |
| Current 2026-10-27 workspace/runtime sizes and runtime disposition | OBSERVED (fresh measurement) | Captured via exact `du` and `df` commands at 2026-10-27T10:11:52+07:00 (detailed below). |
| Historical per-operation provider registry, lock owner, process-FD, and pin evidence for historical runs | UNAVAILABLE | Retained logs do not record these contemporaneous runtime observations for the 24 historical runs. They cannot be reconstructed retroactively. |
| 24 historical runs currently on disk remain untouched and terminal | OBSERVED | All 24 historical run directories in `.wp00-runs/` verified terminal (`DESTROYED`, `pending_operation: null`, `tombstone: true`). Zero historical runs modified or deleted. |

## Retained Artifact Hashes

| Artifact Path | Size (Bytes) | SHA-256 Digest |
|---|---|---|
| `/home/tung/.gemini/antigravity-cli/brain/bc0cc6da-bf10-4289-9c29-06fd52be544b/.system_generated/tasks/task-216.log` | 1,912 | `d8ab8ff3eaa24cae72decef31c92df6807ca1f3bbd90baba1ef4b032e47a064b` |
| `/home/tung/.gemini/antigravity-cli/brain/bc0cc6da-bf10-4289-9c29-06fd52be544b/.system_generated/tasks/task-227.log` | 3,482 | `674ca907cb7f3cc6f57abfaf18317abed8aef1f29fca09409d8b628d85b9cb25` |
| `/home/tung/.gemini/antigravity-cli/brain/bc0cc6da-bf10-4289-9c29-06fd52be544b/.system_generated/tasks/task-768.log` | 1,186 | `6cb65aa0af16be12bf606b47223b2dad4d67ebb475f802de855940b85367abfe` |
| `/home/tung/.gemini/antigravity-cli/brain/def021ce-b813-4aba-a6e3-90ad31f108ab/.system_generated/tasks/task-482.log` | 1,187 | `f7604db2ca18174c4bb5d13463376372001ad535b58694209ed9382836c3f11e` |

## Implementation Source Hashes

| File | Pre-Worker SHA-256 | Initial Delivered SHA-256 | Correction 1/1 SHA-256 | Role |
|---|---|---|---|---|
| `lingora-admin/tests/database/env/env-guard.mjs` | `96b30750cc5a20012dcf17ad23c8c412fdacd90cdc8be94486710817103935c2` | `c6cac2054d611c4aca0f9686b4afd306f33affeb5824d8c0c983ce3c2be4e3be` | `9010303b65d2f9503e5a3f57c20714a3541082eba93c11329b4c393cc7d9af55` | WP-01..WP-03 guards & validators |
| `lingora-admin/tests/database/env/stack-manager.mjs` | `b3c215fb391304d50658ab6c38fd622da292ee5e3c40ed238f452906a6f24660` | `c36d47f5f4eae534c12b04f5e35444f506cce47a5c455df15c295b0e2a636548` | `42702c7f81f86e4e7238c9095d2e01a8826874c73291b91295ff743658586547` | Cross-path mutual exclusion & recovery |
| `lingora-admin/tests/database/env/test-cleanup.mjs` | `4416c02fd622c7352443930eabfa46866a0f57e8eb5408c1c6ae21f591fd3af9` | `0cde8918642249b52eab450b08161f72f1fe2c2ed81310e62c511a2feffdb9b7` | `829a750e3f0fdd8e0ff3f4881c50349a64bf90316cf3a2ffaed17cfde02dbd0f` | 20 focused verification cases |
| `lingora-admin/tests/database/env/test-env-guard.mjs` | `360271f42f0202592252b053617840acb79468e425ab83e5514f5d85ac2594b7` | `9455898441aec3d3177b095c8a4c49b0b1636616e40b9c60d665a70a23f0c5e9` | `9455898441aec3d3177b095c8a4c49b0b1636616e40b9c60d665a70a23f0c5e9` | 37 regression cases |
| `lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | `076d00ac8ce9e3ee06089c2d721ade0d0568a0a6e11f4c06373951a0ff8bc547` | `076d00ac8ce9e3ee06089c2d721ade0d0568a0a6e11f4c06373951a0ff8bc547` | `076d00ac8ce9e3ee06089c2d721ade0d0568a0a6e11f4c06373951a0ff8bc547` | Unmodified native integration harness |

## Fresh Measurements

### Workspace and Disk Space
- **Timestamp:** 2026-10-27T10:11:52+07:00
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Commands:**
  ```bash
  du -s -B1 . && du -s -B1 .wp00-runs && df -B1 .
  ```
- **Exit Code:** 0
- **Output:**
  ```text
  2312331264	.
  6189056	.wp00-runs
  Filesystem        1B-blocks        Used    Available Use% Mounted on
  /dev/nvme0n1p2 502392610816 49697800192 427099439104  11% /
  ```
- **Analysis:**
  - Workspace total allocated footprint: 2,312,331,264 bytes (~2.15 GiB).
  - All runs (`.wp00-runs/`) allocated footprint: 6,189,056 bytes (~5.90 MiB).
  - Available filesystem space: 427,099,439,104 bytes (~397.77 GiB, well above 8 GiB threshold).

### Historical Runs Disposition
- **Total Historical Runs:** 24 runs (2 legacy roots `.wp00-runs/run-{1fab09c87d538b05,70c765fff1ad8203}` and 22 runs in `.wp00-runs/pkg-g0-minimal/`).
- **Phase:** All 24 runs are confirmed in terminal `phase: "DESTROYED"`.
- **Tombstone:** All 24 runs have `tombstone: true`.
- **Pending Operation:** All 24 runs have `pending_operation: null`.
- **State on Disk:** Preserved untouched; no historical run was deleted or modified during this task.
- **Fresh Disposable Runs:** `run-faf1493de3463ab0` (executed in task-482) and `run-af1371dc4e4b01d7` (fresh disposable run).

## Verification Execution Evidence

### 1. Focused Cleanup Suite (`test-cleanup.mjs`)
- **Command:** `node lingora-admin/tests/database/env/test-cleanup.mjs`
- **Timestamp:** 2026-10-27T11:02:04+07:00
- **Exit Code:** 0
- **Output:**
  ```text
  ✔ Case 1: Valid cleanup and recovery positive path (280.510122ms)
  ✔ Case 2: Live/unknown/mismatched lock or provider identity denial (397.411745ms)
  ✔ Case 3: Unknown observations fail closed with zero effects (0.933009ms)
  ✔ Case 4: Refusing to prune non-DESTROYED or pending runs (35.079661ms)
  ✔ Case 5: Symlink cache escape and C1 Reviewer Reproduction rejected with zero deletions (38.220087ms)
  ✔ Case 6: Cleanup failure surfaces CLEANUP_INCOMPLETE and retry is idempotent (260.699084ms)
  ✔ Case 7: Pending guard denies new allocation with zero provider calls (40.699415ms)
  ✔ Case 8: Disk space < 8 GiB denies new run allocation AND existing RESERVED prepare (140.964085ms)
  ✔ Case 9: Allowed control path allocates new run when namespace clean and disk space sufficient (42.320541ms)
  ✔ Case 10: Competing namespace allocation, recovery, and prune mutual exclusion (136.242107ms)
  ✔ Case 11: Real child process holding open FD inside cache with cwd outside run denies prune; exit allows prune (316.621638ms)
  ✔ Case 11b: Opaque unrelated live process with disabled dumpability holding FD denies prune fail-closed (447.78326ms)
  ✔ Case 11c: Handle opened during slow provider precheck denies prune at final removal gate (115.524765ms)
  ✔ Case 12: Own-process open FD in cache denies prune; closed FD allows prune (241.968847ms)
  ✔ Case 13: Forged legacy basename in temporary namespace rejected with zero bypass (0.920015ms)
  ✔ Case 14: Hardlink-aware cache accounting accurately tracks externally linked files (0.500742ms)
  ✔ Case 15: Real separate-process contenders enforce namespace and recovery mutual exclusion (150.97789ms)
  ✔ Case 15b: Foreign process release and reuse denials (123.088271ms)
  ✔ Case 15c: Barrier-synchronized simultaneous lifecycle contenders produce 1 winner and 1 locked loser (83.908736ms)
  ✔ Case 16: Pinned registry response validator matrix and recovery zero-mutation on invalid response (483.266666ms)
  ℹ tests 20
  ℹ suites 0
  ℹ pass 20
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 3342.65269
  ```

### 2. Independent Codex Probe Scripts
- **Command:** `node /home/tung/workspace/school/runtime-safety-follow-up-20261027/codex-probes.mjs`
- **Timestamp:** 2026-10-27T11:02:10+07:00
- **Exit Code:** 0
- **Output:** All 8 probes passed (`opaque_unrelated_live_fd` -> UNKNOWN/denied/canary intact; `invalid_state`, `short_id`, `empty_identity` -> `REGISTRY_VALIDATION_FAIL`; `invalid_post_registry_recovery` -> zero destroys, phase RESERVED, cache exists; `foreign_process_run_lock_release` -> child exit 1, second owner denied; `foreign_process_namespace_release` -> child exit 1, lock exists; `recovery_cleanup_failure_receipt` -> canary redacted, credentials preserved).
- **Command:** `node /home/tung/workspace/school/runtime-safety-follow-up-20261027/codex-race-and-window.mjs`
- **Timestamp:** 2026-10-27T11:02:20+07:00
- **Exit Code:** 0
- **Output:** Both probes passed (`handle_opened_during_provider_precheck` -> denied prune, canary intact; `simultaneous_lifecycle_contenders` -> exactly 1 winner, 1 locked loser).

### 3. Environment Guard Regression Suite (`test-env-guard.mjs`)
- **Command:** `node lingora-admin/tests/database/env/test-env-guard.mjs`
- **Timestamp:** 2026-10-27T10:58:29+07:00
- **Exit Code:** 1 (35 pass, 2 fail closed due to ambient unobservable desktop processes)
- **Failing Tests:**
  - `P03`: Fails in `stopStack` (`STOP_POSTCHECK_FAIL: Known provider processes are still active after stop.`) because `verifyProcessesQuiescent` strictly refuses to certify quiescence when `snapshot.status === 'UNKNOWN'`.
  - `F07`: Fails in `destroyStack` cleanup retry (`actual: 'CLEANUP_INCOMPLETE', expected: 'ALREADY_DESTROYED'`) because `pruneRunCache` fails closed on unobservable desktop processes.

### 4. Disposable Native Lifecycle Harness (`test-lifecycle-and-readiness.mjs`)
- **Command:** `node lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs`
- **Timestamp:** 2026-10-27T11:00:59+07:00
- **Exit Code:** 1
- **Failure:** Fails at `stopStack` step (`STOP_POSTCHECK_FAIL: Known provider processes are still active after stop.`) due to fail-closed quiescence verification when unobservable desktop processes are present.

## Concrete OS Environment Blocker

Per finding RSF-C1 and the spec contract, process observation must fail closed without heuristics when any live same-UID process has unreadable file descriptors (`/proc/<pid>/fd`).
In the active OS environment, the following 21 same-UID processes are currently running:
- PID 2632: `(sd-pam)`
- PIDs 5766, 5771, 5832, 5862, 5891, 5940, 5960, 5991, 6016, 6041, 6357, 6390, 7072, 7095, 7113, 7284, 7307, 7334, 7361, 9943: `coccoc/browser` zygote, GPU, and renderer processes.

These processes run with Linux kernel dumpability disabled (`dumpable=0`). The Linux kernel enforces that unprivileged non-root users receive `EACCES` when attempting to read `/proc/<pid>/fd` for dumpable=0 processes, even when running under the same UID (1000).

Because:
1. RSF-C1 strictly forbids allowlisting/ignoring these unreadable processes via comm/cmdline/parent heuristics (which allowed the `safety-holder` probe to bypass inspection);
2. Modifying system security settings, elevating privileges to root, or terminating these desktop processes is strictly prohibited;
3. `verifyProcessesQuiescent` and `pruneRunCache` fail closed with `status: 'UNKNOWN'` whenever unobservable same-UID processes exist;

Positive confirmed-dead cleanup and quiescence certification on the real host system cannot complete. Therefore, while all negative, race, validator, and mock test suites pass cleanly, positive end-to-end lifecycle verification on this host is **BLOCKED** by the OS environment.

## Gaps

1. Historical lock ownership, open FD absence, complete provider registry states, and exact per-operation physical block reclamation for the 24 runs during prior tasks cannot be reconstructed retroactively. These records remain UNAVAILABLE.
2. The historical claim of 28.22 GiB remains a dated workspace-level disk space measurement from 2026-10-26, not a proof of cumulative per-run bytesFreed.
3. Current code enhancements and tests verify and prove forward-looking invariants; they do not alter historical reality.

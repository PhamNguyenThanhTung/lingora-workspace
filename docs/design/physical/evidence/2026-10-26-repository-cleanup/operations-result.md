# CLEANUP-01 Operations Result — Repository Cleanup and Runtime Recovery

**Date:** 2026-10-26  
**Package:** `CLEANUP-01` (Correction 1/1)  
**Implementation / Test Owner:** Antigravity  
**Planner / Reviewer:** Codex  
**Spec Reference:** `plans/2026-10-26-repository-cleanup-spec.md`  
**Rollback Reference:** `/home/tung/workspace/school/lingora-cleanup-rollback-20261026T082320Z` (verified via `restore-verification.json`)  
**Review Reference:** `docs/design/physical/evidence/2026-10-26-repository-cleanup/codex-review-1.md`

---

## 1. Honest Physical Disk Block Measurements (CL-01, CL-03, C4)

Disk space measurements are reported using physical allocated filesystem blocks (`stat.blocks * 512` and `du -s -B1`) and filesystem free space (`df -B1` / `statfs.bavail * bsize`). External backup cost is reported separately from workspace reduction.

| State / Boundary | Filesystem Free Space (`df -B1`) | Workspace Allocated Blocks (`du -s -B1 .`) | `.wp00-runs` Allocated Blocks (`du -s -B1 .wp00-runs`) | External Rollback Backup (`du -s -B1`) |
|---|---|---|---|---|
| **Pre-backup baseline** | 406,689,267,712 B (~378.76 GiB) | 32,614,244,352 B (~32.61 GB) | 31,800,283,136 B (~31.80 GB) | 0 B (not created) |
| **Post-backup pre-worker** | 397,261,467,648 B (~370.00 GiB) | 32,614,244,352 B (~32.61 GB) | 31,800,283,136 B (~31.80 GB) | 9,392,824,771 B (~8.75 GiB) |
| **Post-cleanup current** | 427,252,846,592 B (~397.91 GiB) | 2,311,962,624 B (~2.31 GB) | 5,931,008 B (~5.93 MB) | 9,392,824,771 B (~8.75 GiB) |
| **Net Worker Delta** | **+29,991,378,944 B (+27.93 GiB)** | **-30,302,281,728 B (-28.22 GiB)** | **-31,794,352,128 B (-29.61 GiB)** | **+9,392,824,771 B (+8.75 GiB external)** |

### Accounting Notes
- **Apparent Size vs Physical Blocks:** Workspace apparent size (`du -sb .`) is 2,150,028,669 B (~2.15 GB), while physical block allocation (`du -s -B1 .`) is 2,311,962,624 B (~2.31 GB).
- **Physical Block Reclamation:** Reclaimed **30,302,281,728 B (~28.22 GiB / ~30.30 GB)** of physical blocks within the repository workspace, and **31,794,352,128 B (~29.61 GiB / ~31.79 GB)** within `.wp00-runs`.
- **External Hardlinks:** `calculateAllocatedBytes` calculates physical blocks (`stat.blocks * 512`) and skips files with `stat.nlink > 1` when determining uniquely reclaimable bytes, ensuring no misleading inflation from shared hardlinks.

---

## 2. Retained Execution Record: Recovery of Four Pending Runs (CL-02, C4)

The historical recovery of the four positively identified pending runs in `pkg-g0-minimal` was executed synchronously under task `bc0cc6da-bf10-4289-9c29-06fd52be544b/task-216`. Retained execution logs confirm exact instance reconciliation, duration, and exit codes:

```json
[
  {
    "run_id": "run-75e7f7eeb707ef51",
    "instance_id": "553abceb6946b9b2d212fb3614023a82903ac97c413811558c102b2315523039",
    "duration_ms": 3143,
    "exit_code": 0,
    "status": "DESTROYED",
    "phase": "DESTROYED",
    "code": "RECOVERED",
    "stale_lock": "15853 (dead PID verified under boot ID)",
    "message": "Pending stack successfully recovered and destroyed."
  },
  {
    "run_id": "run-77931baeef6362d1",
    "instance_id": "1d07e4ceccd5f7ce81fc845ddb323a1ebd728fcf9eb99db42181af7bf5565f2d",
    "duration_ms": 2072,
    "exit_code": 0,
    "status": "DESTROYED",
    "phase": "DESTROYED",
    "code": "RECOVERED",
    "stale_lock": null,
    "message": "Pending stack successfully recovered and destroyed."
  },
  {
    "run_id": "run-823006cc1b9e0057",
    "instance_id": "e8d71734b91d3c4b58bb400900cbcb44bdf3ca021f59f11299ee5999d9aa92a8",
    "duration_ms": 3351,
    "exit_code": 0,
    "status": "DESTROYED",
    "phase": "DESTROYED",
    "code": "RECOVERED",
    "stale_lock": null,
    "message": "Pending stack successfully recovered and destroyed."
  },
  {
    "run_id": "run-a0a95601256fd486",
    "instance_id": "d9f4159eb90aac7cf286b9ae1af7abc322ebfb93e06f93c9890ac2b7413dc5b1",
    "duration_ms": 4327,
    "exit_code": 0,
    "status": "DESTROYED",
    "phase": "DESTROYED",
    "code": "RECOVERED",
    "stale_lock": null,
    "message": "Pending stack successfully recovered and destroyed."
  }
]
```

### Recovery Invariants Enforced (C2)
- Revalidated UID, directory permissions (0700/0600), non-symlink paths, canonical `config.toml` digest (`a9067406c77c9e0b4a43f6e96cbb5d19f2b9e85dc1c3f461ee7a7cec3de190e9`), and owner workdir/home/project tuples.
- Host PID 15853 revalidated dead via `/proc` and boot ID before lock unlink.
- Pinned Supabase CLI binary hash (`e91fc61f09c4fbb9c65dadc37d415640cb6d2398e65eba6d384eec74b2dbbe10`) and version (`2.121.0`) verified before dispatch.
- Exclusive `.namespace.lock` and `.recovery.lock` acquired; no blind SIGTERM loops executed (fail closed on lingering processes).
- Terminal `owner.json` records: `phase: "DESTROYED"`, `tombstone: true`, `pending_operation: null`, and retains the reconciled 64-character `instance_id`.
- Complete recovery receipt with tuple provenance recorded.

---

## 3. Retained Execution Record: Bounded Cache Pruning (CL-03, C1, C4)

Cache pruning of regenerable `home/cache/` directories was executed under task `bc0cc6da-bf10-4289-9c29-06fd52be544b/task-227` and conversation step 244 across all 22 verified `DESTROYED` runs.

### 22 Pruned Runs
1. **Existing Current Namespace Runs (16 runs):**
   - `run-114b6d3f60299bc0` (freed: 1,415,527,366 B)
   - `run-3256c3b16f733619` (freed: 1,415,527,366 B)
   - `run-378047f173289603` (freed: 1,415,527,366 B)
   - `run-3be6d5ff41229fac` (freed: 1,415,527,366 B)
   - `run-554f9aa2348e317e` (freed: 1,415,527,366 B)
   - `run-5949880c78efd0a1` (freed: 1,415,527,366 B)
   - `run-62d62e7c1961079a` (freed: 1,415,527,366 B)
   - `run-63ad4dd983d690e1` (freed: 1,415,527,366 B)
   - `run-6e06a876bbd1c498` (freed: 1,415,527,366 B)
   - `run-bbcd679f424993b2` (freed: 1,415,527,366 B)
   - `run-bcdc41a8b995232f` (freed: 1,415,527,366 B)
   - `run-cc071b5e323529a9` (freed: 1,415,527,366 B)
   - `run-dba39f772e58027a` (freed: 1,415,527,366 B)
   - `run-dca84591a0dbc8f5` (freed: 1,415,527,366 B)
   - `run-eedf23a5f38066d5` (freed: 1,415,527,366 B)
   - `run-fd9e322f1523f768` (freed: 1,415,527,366 B)
2. **Recovered Current Namespace Runs (4 runs):**
   - `run-75e7f7eeb707ef51` (freed: 985,136,911 B)
   - `run-77931baeef6362d1` (freed: 1,387,977,510 B)
   - `run-823006cc1b9e0057` (freed: 985,136,911 B)
   - `run-a0a95601256fd486` (freed: 854,912,329 B)
3. **Legacy Destroyed Roots (2 runs):**
   - `run-1fab09c87d538b05` (freed: 1,415,527,366 B)
   - `run-70c765fff1ad8203` (freed: 1,415,527,366 B)

### Prune Security Invariants Enforced (C1)
- Strict authority validation via `validateAuthorityRecord` requiring `phase === 'DESTROYED'`, `tombstone === true`, `pending_operation === null`.
- Verified non-symlink paths and lexical containment: `home_dir` must reside inside control root, `cacheDir` inside `home_dir`.
- Acquired exclusive `.prune.lock` and `.namespace.lock`; checked absence of competing `.recovery.lock` or `.run.lock`.
- Verified process, socket, and native state quiescence before deletion.
- Preserved all non-cache files intact (`owner.json`, `stack.log`, config fixtures).

---

## 4. Single Fresh Native Lifecycle Proof (Task 768)

Executed one real local disposable native lifecycle test (`node lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs`) under task `bc0cc6da-bf10-4289-9c29-06fd52be544b/task-768`:

- **Run ID Allocated:** `run-3b11f1e70c9273ad`
- **Native Instance ID:** `308410d933bbe88d79dc0812f2b3167ca9897928a17efbf9d3dfa3c631e59144`
- **Native Stack Name:** `lingora-wp00-a958a60d`
- **Duration:** 135,436 ms
- **Exit Code:** 0
- **Sanitized Readiness Probes:**
  - PostgreSQL 17.11 SQL Query: `SELECT version(), current_database(), current_user;` -> PASS
  - Auth HTTP Health (`/auth/v1/health`): 200 OK -> PASS
  - Storage HTTP Status (`/storage/v1/status`): 200 OK -> PASS
  - Mailpit HTTP API (`/api/v1/messages`): 200 OK -> PASS
  - Session Pooler: accurately reported as `DISABLED_IN_NATIVE_STACK` -> PASS
  - Scaffold honest refusal on active provider stack (`a1-runner.mjs`): exit 1 -> PASS
- **Teardown & Auto-Prune:**
  - `stopStack` cleanly stopped services.
  - Existing start resumed same instance ID and verified member UUID map continuity.
  - `destroyStack` executed under valid lock: provider stopped and destroyed, `home/cache/` auto-pruned, credentials and member-map unlinked, tombstone receipt recorded in `owner.json`.
  - Repeated destroy against tombstone verified: returned `code: "ALREADY_DESTROYED"`, exit code 0.
  - Zero target processes remaining, native state files ABSENT, ports [54321, 54322, 54324] quiescent, zero abandoned runs.

---

## 5. Namespace Cleanliness Post-State

- Executed `verifyNamespaceClean('.wp00-runs/pkg-g0-minimal')`:
  - `clean: true`
  - `count: 22` (all 22 runs are valid `DESTROYED` tombstones with `tombstone: true`, `pending_operation: null`, and cache pruned).
- Zero pending runs, zero active locks across all namespaces.

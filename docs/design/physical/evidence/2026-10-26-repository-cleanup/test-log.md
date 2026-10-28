# CLEANUP-01 Test Log — Verification Evidence

**Date:** 2026-10-26  
**Package:** `CLEANUP-01` (Correction 1/1)  
**Execution Environment:** Linux x86_64, Node.js v24.22.1, Pinned Supabase CLI v2.121.0, PostgreSQL 17.11  
**Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`

---

## 1. Tested Source Code Hashes (SHA-256)

| Source File | SHA-256 Digest |
|---|---|
| `lingora-admin/tests/database/env/env-guard.mjs` | `96b30750cc5a20012dcf17ad23c8c412fdacd90cdc8be94486710817103935c2` |
| `lingora-admin/tests/database/env/stack-manager.mjs` | `b3c215fb391304d50658ab6c38fd622da292ee5e3c40ed238f452906a6f24660` |
| `lingora-admin/tests/database/env/test-cleanup.mjs` | `4416c02fd622c7352443930eabfa46866a0f57e8eb5408c1c6ae21f591fd3af9` |
| `lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | `076d00ac8ce9e3ee06089c2d721ade0d0568a0a6e11f4c06373951a0ff8bc547` |
| Pinned CLI (`node_modules/@supabase/cli-linux-x64/bin/supabase`) | `e91fc61f09c4fbb9c65dadc37d415640cb6d2398e65eba6d384eec74b2dbbe10` |

---

## 2. Existing Guard & Context Regression Suite

- **Command:** `node lingora-admin/tests/database/env/test-env-guard.mjs`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Start / End Time:** 2026-10-26T09:52:55Z – 2026-10-26T09:53:06Z
- **Duration:** 9,271 ms
- **Exit Code:** `0`
- **Verdict:** PASS (37/37 passed, 0 failed, 0 skipped)
- **Coverage:**
  - Strict host/port allowlist enforcement (127.0.0.1, localhost, fixed native ports)
  - Pinned CLI version 2.121.0 and SHA-256 binary validation
  - Process observation and /proc stat parsing
  - Lock acquisition, stale lock handling, and process identity validation
  - Secret redaction across all diagnostic output
  - Full lifecycle operations: status, stop, destroy, and idempotent repeat destroy
  - Fail-closed behavior on missing config, path symlink escape, and invalid identity

---

## 3. Focused Cleanup, Recovery, and Guard Test Suite (CL-05, C1-C4)

- **Command:** `node lingora-admin/tests/database/env/test-cleanup.mjs`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Start / End Time:** 2026-10-26T09:52:50Z – 2026-10-26T09:52:52Z
- **Duration:** 1,107 ms
- **Exit Code:** `0`
- **Verdict:** PASS (10/10 passed, 0 failed, 0 skipped)

### Matrix of Required Cases Verified:
1. **Case 1 (Valid Cleanup/Recovery Positive):**
   - Exclusive recovery succeeds on valid pending run with verified instance ID.
   - Transitions state to `DESTROYED`, unlinks `.run.lock`, auto-prunes cache, and writes atomic tombstone with complete recovery receipt.
2. **Case 2 (Live / Unknown / Mismatched Lock or Provider Identity Denial — C2 Matrix):**
   - 2a (Live PID): Lock held by active PID denies with `LOCKED`, 0 CLI calls, lock retained.
   - 2b (Missing Fields): Lock file missing `start_ticks` or `boot_id` denies with `RECOVER_FAIL`, 0 CLI calls, lock retained.
   - 2c (Mismatched Boot ID): Lock file with prior boot ID denies with `RECOVER_FAIL`, 0 CLI calls, lock retained.
   - 2d (Contradictory Candidate): Candidate stack in registry with mismatched name/runtime denies with `RECOVER_FAIL`, 0 CLI destroy calls, lock retained, owner.json unchanged.
   - 2e (Ambiguous Candidates): Multiple candidates matching tuple denies with `RECOVER_FAIL`, 0 CLI destroy calls, lock retained.
   - 2f: Zero destructive CLI/signal/unlink effects asserted for all denials.
3. **Case 3 (Unknown Observations Fail Closed):**
   - 3a: `statfs` returning unknown/invalid values throws `DISK_SPACE_FAIL`.
   - 3b: `statfs` throwing error throws `DISK_SPACE_FAIL`.
   - 3c: `calculateAllocatedBytes` fails closed on unreadable directories (`READ_FAIL` / `STAT_FAIL`).
4. **Case 4 (Non-DESTROYED Prune Denial):**
   - `pruneRunCache` rejects runs in phase `RESERVED` with `PRUNE_FAIL`; cache remains intact.
5. **Case 5 (Symlink Cache Escape & C1 Reviewer Reproduction):**
   - 5a: Leaf symlink `home/cache -> externalDir` rejected with `PRUNE_FAIL`; external canary untouched.
   - 5b: Reviewer reproduction (`{ phase: 'DESTROYED', home_dir: externalDir, pending_operation: null }`):
     - `verifyNamespaceClean` rejects with `PENDING_GUARD_FAIL`.
     - `pruneRunCache` rejects with `PRUNE_FAIL` / `ALLOWLIST_FAIL`.
     - External canary (`externalDir/cache/review-canary.bin`) is 100% untouched; 0 deletions.
   - 5c: Unheld lock token denies prune with `PRUNE_FAIL: Caller does not hold verified run lock.`
6. **Case 6 (Cleanup Failure Surfaces CLEANUP_INCOMPLETE & Idempotent Retry — C1 Fix):**
   - `destroyStack` on already DESTROYED run with failing prune adapter returns `CLEANUP_INCOMPLETE` (exit 1); credentials and member-map are NOT unlinked.
   - Subsequent destroy retry succeeds with `ALREADY_DESTROYED` (exit 0) and cleanly unlinks credentials and member-map.
   - Repeat prune on absent cache returns `alreadyPruned: true`, `bytesFreed: 0`.
7. **Case 7 (Pending Guard Denies Allocation With Zero Provider Calls):**
   - When a pending prepare run exists in namespace, `startStack({ newRun: true })` denies with `PENDING_GUARD_FAIL`; 0 CLI calls made, 0 runs allocated.
8. **Case 8 (Disk Space < 8 GiB Denies Allocation AND Existing RESERVED Prepare — C3 Fix):**
   - 8a: New run allocation denies with `DISK_SPACE_FAIL` when available space < 8 GiB; 0 CLI calls, 0 runs allocated.
   - 8b: Existing RESERVED run `startStack({ runId, newRun: false })` denies with `DISK_SPACE_FAIL` when available space < 8 GiB; 0 CLI prepare calls, authority remains RESERVED.
9. **Case 9 (Reachable Allowed Control Path):**
   - `allocateRun` successfully allocates when namespace is clean and disk space sufficient; sets initial `phase: 'RESERVED'`, `pending_operation: null`.
10. **Case 10 (Competing Allocation, Recovery, and Prune Mutual Exclusion — C3 Cross-Path):**
    - 10a: Active `.namespace.lock` denies concurrent allocation (`startStack(newRun)`).
    - 10b: Active `.namespace.lock` denies concurrent recovery (`recoverStack`).
    - 10c: Active `.namespace.lock` denies concurrent standalone prune (`pruneStack`).
    - 10d: Active `.recovery.lock` denies concurrent recovery (`recoverStack`) and standalone prune (`pruneRunCache`).
    - 10e: Active `.prune.lock` denies concurrent recovery (`recoverStack`).

---

## 4. Single Fresh Native Lifecycle Proof (CL-05, C4)

- **Command:** `node lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Task ID:** `bc0cc6da-bf10-4289-9c29-06fd52be544b/task-768`
- **Start / End Time:** 2026-10-26T09:55:28Z – 2026-10-26T09:57:43Z
- **Duration:** 135,436 ms
- **Exit Code:** `0`
- **Verdict:** PASS (1/1 passed, 0 failed)

### Exact Observed Operations:
```
[TEST-LIFECYCLE] Allocating and starting fresh disposable native stack...
[TEST-LIFECYCLE] Querying stack status...
[TEST-LIFECYCLE] Verifying scaffold honest refusal on active provider stack...
[TEST-LIFECYCLE] Stopping stack...
[TEST-LIFECYCLE] Resuming stack (existing start)...
[TEST-LIFECYCLE] Stopping stack prior to destroy...
[TEST-LIFECYCLE] Destroying stack...
[TEST-LIFECYCLE] Compact Exact-Target Termination Summary:
{
  "target_stack_id": "308410d933bbe88d79dc0812f2b3167ca9897928a17efbf9d3dfa3c631e59144",
  "target_stack_name": "lingora-wp00-a958a60d",
  "registry_status": "CONFIRMED_ABSENT",
  "native_state_files": "ABSENT",
  "active_run_processes": 0,
  "quiescent_ports": [
    54321,
    54322,
    54324
  ],
  "tombstone_recorded": true,
  "credentials_unlinked": true,
  "termination_verdict": "VERIFIED_ABSENT"
}
[TEST-LIFECYCLE] Verifying repeated destroy on tombstone...
[TEST-LIFECYCLE] Lifecycle test completed cleanly.
✔ Provider stack lifecycle and real readiness verification (R01) (135427.5782ms)
```

- **Run ID:** `run-3b11f1e70c9273ad`
- **Native Instance ID:** `308410d933bbe88d79dc0812f2b3167ca9897928a17efbf9d3dfa3c631e59144`
- **Post-State:** `owner.json` tombstone recorded with `phase: "DESTROYED"`, `tombstone: true`, `pending_operation: null`, cache auto-pruned, 0 active processes, 0 abandoned runs.

---

## 5. Namespace Cleanliness Verification

- **Command:** `node -e 'import("./lingora-admin/tests/database/env/env-guard.mjs").then(m => console.log(m.verifyNamespaceClean()))'`
- **Working Directory:** `/home/tung/workspace/school/project1/lingora-workspace`
- **Exit Code:** `0`
- **Output:** `{ clean: true, count: 22 }`
- **Sockets:** `verifySocketsQuiescent([54321, 54322, 54324, 54323])` returned `true`.

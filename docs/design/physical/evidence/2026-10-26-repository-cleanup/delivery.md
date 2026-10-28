# CLEANUP-01 Delivery Record — Repository Cleanup and Runtime Recovery

**Date:** 2026-10-26  
**Package:** `CLEANUP-01` (Correction Round 1/1)  
**Status:** `DELIVERED` (Ready for Independent Codex Re-Review)  
**Implementation / Test Owner:** Antigravity  
**Planner / Reviewer:** Codex  
**Spec Reference:** `plans/2026-10-26-repository-cleanup-spec.md`  
**Review Input:** `docs/design/physical/evidence/2026-10-26-repository-cleanup/codex-review-1.md`  
**Rollback Reference:** `/home/tung/workspace/school/lingora-cleanup-rollback-20261026T082320Z/entry-manifest.json`

---

## 1. Executive Summary of Corrections (C1–C5)

In this single authorized correction round (1/1), all MUST findings from `codex-review-1.md` have been resolved:

1. **C1 (Unsafe Prune Destination/Authority & Exclusive Checks):**
   - Reused `validateAuthorityRecord` in both `verifyNamespaceClean` and `pruneRunCache`, strictly enforcing lexical containment of `home_dir` inside the run control root and rejecting parent symlink escapes.
   - Enforced mutual exclusion via `.prune.lock` and `.namespace.lock` for standalone prune, and verified caller-held lock tokens for internal destroy/recovery prune.
   - Updated `destroyStack` idempotence to verify terminal tombstone and quiescence before attempting prune, and to unlink credentials/member-maps only after prune succeeds.
   - Verified that the reviewer's reproduction (`home_dir: externalTmp`) fails closed with `PENDING_GUARD_FAIL` / `PRUNE_FAIL` and leaves external canaries 100% untouched.

2. **C2 (Recovery Validated Identity/Pin Contract):**
   - Removed `allowTestRecovery` parameter entirely. Test suites now pass bounded `authorizedPendingRuns` whitelist while executing the exact full production validation path.
   - Reused `validateAuthorityRecord` to validate the full owner tuple, git branch ref, canonical config digest, and CLI pin.
   - Implemented `verifyPinnedCli` enforcing local binary existence, non-symlink path, exact SHA-256 digest (`e91fc61f...`), and version (`2.121.0`).
   - Strictly validated native candidate stacks in registry: rejects malformed `stacks` arrays, rejects contradictory candidate stacks (mismatched name, root, or runtime), and rejects ambiguous multiple candidate stacks.
   - Replaced blind SIGTERM loop with fail-closed process observation: if lingering processes exist after CLI destroy, recovery fails closed with `RECOVER_POSTCHECK_FAIL`.
   - Verified retained fingerprints of `owner.json` and `.run.lock` before mutating or unlinking; unlinks lock only upon full verified quiescence.
   - Persisted complete `recovery_receipt` in `owner.json` recording operation provenance.

3. **C3 (Namespace Safety/Coordination & Startup Disk Gaps):**
   - Updated `verifyNamespaceClean` to enforce path security, directory permissions 0700, UID match, absence of active `.namespace.lock`, absence of active `.run.lock`/`.recovery.lock`/`.prune.lock`, valid `owner.json` under `validateAuthorityRecord`, `phase === 'DESTROYED'`, `tombstone === true`, `pending_operation === null`, and native state files `ABSENT`.
   - Introduced shared mutual exclusion via `.namespace.lock` across `allocateRun`, `startStack` prepare, `recoverPendingRun`, and `pruneRunCache`.
   - Added `verifyAvailableDiskSpace` (>= 8 GiB via `statfs`) check to `startStack` when resuming an existing `RESERVED` run before provider prepare.

4. **C4 (Assertions, Real Outputs & Honest Evidence):**
   - Substantiated historical recovery and prune evidence from retained conversation task records (`task-216.log`, `task-227.log`, step 244).
   - Executed single fresh local disposable native lifecycle proof (`task-768.log`) on `run-3b11f1e70c9273ad` (exit 0, duration 135,436 ms) demonstrating full readiness, scaffold fail-closed, stop, resume, destroy, auto-prune, and idempotent repeat destroy.
   - Reported honest physical disk block allocations (`du -s -B1` / `st_blocks`) and filesystem free space (`df -B1`), separating pre-backup free space (406,689,267,712 B), post-backup pre-worker free space (397,261,467,648 B), current free space (427,252,846,592 B), and external backup cost (9,392,824,771 B).
   - Replaced st_size accumulation in `calculateAllocatedBytes` with `stat.blocks * 512`, failing closed on unreadable files and accounting for external hardlinks (`nlink === 1`).
   - Corrected all factual errors: pinned CLI is `2.121.0`; PostgreSQL is 17.11; namespace reservation lock is `.namespace.lock`; retained `instance_id` in `owner.json` tombstones; file counts reflect 1,847 baseline files.

5. **C5 (Entry Documents Reconciliation):**
   - `docs/QUICK-REF.md`: Updated Admin and Database rows to accurately document the 20-table catalog fixture, migration `20261026000000_a3_baseline`, paused/unaccepted A3 state, and active lifecycle guards.
   - `README.md`: Pointed cleanup plan link to `plans/2026-10-26-repository-cleanup-spec.md`; distinguished observed completed disposal from unaccepted review state.
   - `supabase/README.md` & `ENVIRONMENT.md`: Documented exact `--run <run-id>` and `--new-run` requirements; documented bounded CLI `recover` and `prune` usage and limits.

---

## 2. Protected Baseline Source Files Comparison

Audited current working tree against `/home/tung/workspace/school/lingora-cleanup-rollback-20261026T082320Z/entry-manifest.json`:

- **Total Baseline Authored Files in Manifest:** 1,847
- **Identical (Unchanged SHA-256):** 1,835
- **Authorized Changed Baseline Files (12):**
  1. `README.md` (CL-06 / C5 entry doc)
  2. `ENVIRONMENT.md` (CL-06 / C5 entry doc)
  3. `docs/README.md` (CL-06 entry doc)
  4. `docs/QUICK-REF.md` (CL-06 / C5 entry doc)
  5. `supabase/README.md` (CL-06 / C5 entry doc)
  6. `lingora-admin/tests/database/env/env-guard.mjs` (C1, C2, C3, C4 implementation)
  7. `lingora-admin/tests/database/env/stack-manager.mjs` (C1, C3 implementation)
  8. `lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` (CL-05 lifecycle proof)
  9. `logs/test-log.md` (appended test evidence)
  10. `logs/development-log.md` (appended development log)
  11. `HANDOFF.md` (Codex task pointer)
  12. `plans/current-task.md` (Codex task pointer)
- **Authorized Added Test File (1):**
  - `lingora-admin/tests/database/env/test-cleanup.mjs` (C1–C4 focused test suite)
- **Unexpected Source Files Modified:** 0
- **Missing Baseline Source Files:** 0
- **Pre-Existing Dirty / Untracked Files:** 100% preserved (all A3 source, Prisma schemas, migrations, test contexts, and historical evidence).

---

## 3. Verification Check and Exit Summary

| Verification Step | Command | Exit Code | Observed Output / Verdict |
|---|---|---|---|
| Existing Guard Suite | `node lingora-admin/tests/database/env/test-env-guard.mjs` | 0 | 37/37 passed (PASS) |
| Focused Cleanup Suite | `node lingora-admin/tests/database/env/test-cleanup.mjs` | 0 | 10/10 passed (PASS) |
| Native Lifecycle Proof | `node lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs` | 0 | 1/1 passed; run-3b11f1e70c9273ad, 0 abandoned runs (PASS) |
| Namespace Cleanliness | `verifyNamespaceClean('.wp00-runs/pkg-g0-minimal')` | 0 | Clean: true, count: 22 tombstones, 0 pending, 0 locks |
| Port Quiescence | `verifySocketsQuiescent([54321, 54322, 54324, 54323])` | 0 | Sockets quiescent: true |

---

## 4. Delivery Status

- **STATUS:** `DELIVERED`
- **PACKAGE:** `CLEANUP-01` (Correction 1/1)
- **BLOCKERS:** None.

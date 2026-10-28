# runtime-safety-follow-up — final independent review: FAIL / STOP

2026-10-27. Correction **1/1 is exhausted**. Task **NOT ACCEPTED**. Antigravity reported BLOCKED; Codex independently inspected corrected source, the original spec and review findings, assertions, retained execution logs, runtime state and preservation evidence. No additional correction or Codex implementation takeover follows.

## Final acceptance

| Contract | Verdict | Evidence and limit |
|---|---|---|
| Safe prune with active/unknown handles | PARTIAL / environment blocked | The direct opaque-holder reproduction now returns UNKNOWN, refuses prune and preserves its canary. The final process scan is after provider checks/size walking. Real positive quiescent cleanup does not pass on this host. |
| Confirmed-dead cleanup and native integration | FAIL | Environment guard is 35/37, with P03 and F07 failing. Corrected native lifecycle fails stop postcheck; fresh run is left BOUND/pending stop with cache/state retained. |
| Mutual exclusion and owner checks | PARTIAL | Foreign-process release is now denied; simultaneous lifecycle race has one winner. Malformed identity release and invalid-boot held-token reuse still succeed in direct probes. |
| Registry response validation | Improved; counterexamples closed, integrated positive blocked | Full ID/nonempty/absolute fields, enum checks and finite REGISTRY_VALIDATION_FAIL now reject the first review values. Focused response and cleanup-receipt cases pass with typed synthetic process observations; default real recovery is denied earlier by UNKNOWN. |
| Historical traceability | Reconciled with limitations below | Original byte hashes now match. This final addendum corrects the owner-chain/metadata/measurement/probe claims in the worker reconciliation; unavailable contemporaneous safety evidence remains unavailable. Prior cleanup is not retroactively accepted. |
| Preservation | PASS for protected original work | All 1,847 original authored files remain, modes intact; pre-task log prefixes and 24 historical owners/runtime records preserved. Only expected namespace telemetry changed. A3/schema/config/pins and unrelated dirty/untracked work preserved. |
| All required tests pass / no unresolved fresh runtime | FAIL | Focused 20/20 pass does not establish required positive cleanup. Regression 35/37 and native 0/1 fail; fresh pending-stop run remains unresolved. |

## Checks actually observed

Codex ran the corrected source directly:

- `node lingora-admin/tests/database/env/test-cleanup.mjs`: exit 0, 20/20, 3396.043053 ms.
- `node lingora-admin/tests/database/env/test-env-guard.mjs`: exit 1, 35/37, failures P03 and F07. Exact commands/cwd/start/end/exits are in `codex-final-tests.json`; complete outputs in `codex-final-cleanup.log` and `codex-final-env-guard.log`.
- Re-ran the private default-behavior counterexample script; observations in `codex-final-default-probes.json`. Opaque holder remains alive, observation is UNKNOWN, canary remains. Invalid BORKED state, short ID and empty identity are rejected. Foreign release fails and a second run owner cannot acquire. Default recovery/prune-failure probes stop at process UNKNOWN before destroy: they do **not** prove that later response/cleanup branches executed.
- Direct final lock probes in `codex-final-lock-probes.json`: deleting start_ticks/boot_id and changing run_id in a freshly owned lock still permits release; a held namespace with invalid boot_id still permits acquire. No existing runtime or lock was used by these probes.
- Inspected retained corrected native output `task-1018.log`, copied as `native-correction-failure.log`; SHA-256 `b26966055c12bfabad2360b739226ddceecc15b400003583e2328ac3972eff0d`. It confirms 0/1 failed, `STOP_POSTCHECK_FAIL`, then emergency stop/destroy both refused pending operation. Codex did not launch another native run after observing this unresolved run.
- Read-only pinned CLI stack list for the fresh fixture returns the exact instance below as `runtime:native, owner:unavailable`. At the port observation no target service/internal TCP listener was seen; retained SQLite reservations are not proof of a live listener.
- Read-only source/runtime preservation comparison and pinned CLI hash are recorded in `codex-final-preservation-runtime.json`. HEAD remains `c39806cb45c908135f240c93d68546b6ac5d7784`, no staged files. Both existing log prefixes are preserved.

The probe scripts emit observations, not an assert-based eight-test or two-test acceptance suite. Their exit 0 must not be relabeled “8/8 passed” or “2/2 passed.” Several focused tests now accept denial when ambient observation is UNKNOWN, so their green result does not prove the required real positive control. Case 11c can deny at the first scan in this environment before its late-open hook executes.

## Remaining MUST conditions

### RSF-C1 — positive safe disposal/integration unavailable; legacy validation still excludes a known terminal fixture

The host has live same-UID processes whose `/proc/<pid>/fd` is unreadable (21 observed at 04:12:03 UTC). The corrected default scanner returns UNKNOWN rather than skipping them by comm/parent. That is the appropriate conservative behavior. It also prevents proving full quiescence for a dead run on this host; replacing this uncertainty with a process-name exception would recreate the first review counterexample.

The native test progressed through start/readiness and provider stop, then the process postcheck failed. Its pending stop prevents normal retry/destroy and the finalizer did not dispose it. This fails the user's positive-cleanup, related-test and runtime-disposition requirements.

The legacy prune-only branch hardcodes canonical workspace project/workdir/config for **both** roots. Retained `run-70c765fff1ad8203` actually has its owned fixture as project/workdir/config location, so this branch rejects that genuine terminal authority before disposal. It also still omits some full authority fields (run_id/branch/CLI pin) and accepts absent pending_operation. Exact paths, IDs, added provider check and gate improve safety, but do not close the complete legacy authority contract. Historical roots were inspected read-only, never pruned or edited for this review.

### RSF-C2 — complete identity validation is still conditional

Corrected release checks PID and rejects foreign-process release. However `releaseRunLock` / `releaseNamespaceReservation` only compare start_ticks and boot_id **if those fields are present/truthy**; malformed missing identities can still release. Held namespace reuse checks token/PID and optional ticks but does not check boot ID, or fail on unknown caller stat. The direct final probe acquired using a held record with `boot_id:'invalid-boot'`. Run release also does not bind the record's run_id to the run being released. These are remaining parts of review 1's required valid-owner/resource contract, not a request for a larger locking framework.

### RSF-C3 — corrected negative cases, limited positive proof

The original malformed postcheck and raw cleanup-error persistence counterexamples are addressed in source: typed validation runs before post-absence decisions; cleanup receipt uses a finite allowed error code and atomic temp/fsync/rename; retry credentials/member map stay until successful prune. The focused injected-observation cases exercise them. This is bounded evidence for those paths, not acceptance of the complete real recovery/lifecycle while the real observation remains UNKNOWN. Required integrated acceptance is withheld under RSF-C1 and failing regression tests.

## Fresh runtime requiring explicit later disposition

| Field | Observed state |
|---|---|
| Run | `run-af1371dc4e4b01d7` |
| Instance | `512acb5c6fd861351354f78a582068c628a35c464b1bb1db080d5b1a07ffa114` |
| Authority | BOUND, pending_operation=stop, tombstone=false |
| Files | cache present; native state.json present; no run/recovery/prune lock observed |
| Provider list | exact native instance, owner=unavailable |
| Registry | retained reservations 25412, 30329, 31118; no listener observed in the bounded port read |
| Runtime tree allocation | 1,604,599,808 B at 2026-10-27T04:07:19.869538Z |
| Whole workspace allocation | 3,910,836,224 B at that same observation |

This fresh test residue explains why current `.wp00-runs` is about **1.60 GB**, rather than the pre-task 5.93 MB. The 24 protected historical runs remain unchanged; old cleanup was not rolled back and old caches were not recreated. The successful initial-delivery test `run-faf1493de3463ab0` remains terminal/cache absent. Do not claim zero abandoned/unresolved runs or current 5.93 MB after correction. Private state stays on disk; no secrets are copied into evidence. No force-delete, manual pending/lock clearance or global-registry restoration was used to make the result look complete.

## RSF-C4 — authoritative historical reconciliation addendum

This section supersedes inconsistent acceptance/provenance claims in the new worker reconciliation and log delivery narratives. Older dated snapshots remain unchanged.

- **OBSERVED historical records:** original rollback `entry-manifest.json`, `restore-verification.json`, `disk-before-worker.json`, `codex-final-observation.json`, RESTORE.md and actual retained task logs exist. The original restore result records 1,847 authored files and 133 runtime records verified with no source/runtime errors, plus its dated archive-integrity result. Metadata inspection today is **not** a fresh full archive checksum/corruption test. No fresh archive-wide checksum was executed in this follow-up.
- **RECONSTRUCTED comparison:** archived owner projections hash-match original manifest entries: 18 DESTROYED harness owners (including two legacy) plus four RESERVED/prepare = **22 original harness owners: 20 namespace + two legacy**. The 23rd archived owner.json is a nested native provider owner, not another harness run. Later test runs `run-2327ebb821be5c86` and `run-3b11f1e70c9273ad` explain the **24 pre-task** harness owners. This task then added terminal `run-faf1493de3463ab0` and unresolved `run-af1371dc4e4b01d7`, giving 26 current harness owners. The worker row “22 original namespace + two legacy” does not describe the original archive lineage correctly.
- **OBSERVED dated measurements:** pre-worker cleanup workspace 32,614,244,352 B / runtime 31,800,283,136 B; historical final at `2026-10-26T10:04:53.360941Z` workspace 2,311,974,912 B / runtime 5,931,008 B. Workspace difference is 30,302,269,440 B, about 28.22 GiB. Do not sum separate traversals or attribute filesystem-wide free-space change entirely to cleanup. New-task pre-worker workspace was 2,312,007,680 B / runtime 5,931,008 B. Current post-correction measurements are in the table above; the worker's earlier 10:11:52 snapshot is an earlier snapshot, not final current state.
- **OBSERVED retained outputs:** task-216 contains four RECOVERED outputs/IDs, not per-step safety fingerprints. Task-227 contains 20 current namespace prune outputs, then failure at first legacy root. Task-768 proves one positive native lifecycle. Exact old raw-byte sizes/hashes are in `codex-review-1-historical-log-hashes.json` and now match the corrected worker table. Initial-delivery native task-482 is a separate real positive under the earlier scanner; corrected task-1018 fails. New source hashes in the corrected reconciliation match the actual reviewed files.
- **UNAVAILABLE:** historical per-operation lock/tuple/pin/FD/registry proofs; a contemporaneous complete legacy-disposal log; exact per-run physical blocks reclaimed. Current absence and regenerated tests do not fill these gaps. Current stat.blocks/hardlink accounting is an estimate, not an observed physical reclamation result. Historical old cleanup remains NOT ACCEPTED.

The private new-task baseline and direct preservation trace are retained at `/home/tung/workspace/school/runtime-safety-follow-up-20261027/`; the original full rollback bundle remains private at `/home/tung/workspace/school/lingora-cleanup-rollback-20261026T082320Z/`. No restoration is justified by the observed source/runtime preservation checks.

## Disposition

**STOP / NOT ACCEPTED.** Correction budget exhausted 1/1. No second correction, worker restart, Codex implementation takeover, cleanup rollback/replay, new native run or automatic continuation. Keep the unresolved fresh run/cache/state intact for a separately authorized, exact-target disposition after the observation boundary is resolved; do not bypass guards or edit pending state merely to clear the namespace.

G0 ACCEPTED / WP-00 CLOSED / P1-00 ACCEPTED remain unchanged. A3 remains PAUSED/unaccepted; A1/A2 are not dispatched; A2 session-pooler contract unchanged. No live/production database was accessed. No reset/stash/commit/push occurred. Await the user's next decision; do not resume A3.

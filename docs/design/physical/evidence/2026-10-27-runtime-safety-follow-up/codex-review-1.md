# runtime-safety-follow-up — independent review 1: FAIL

2026-10-27. Reviewed the final spec, pre-worker source diff, connected callers/assertions, actual retained logs, protected source/runtime state, and direct counterexamples. This is the first review of the NEW task. One task-wide Anti correction 1/1 is authorized for the four findings below. No A3 continuation, A1/A2 dispatch, historical runtime replay, live DB, commit/stash/reset/push or Codex implementation takeover.

## Directly observed checks

- Codex reran `node lingora-admin/tests/database/env/test-cleanup.mjs`: exit 0, 16/16; and `node lingora-admin/tests/database/env/test-env-guard.mjs`: exit 0, 37/37. Exact timestamps and outputs are in `codex-review-1-test-results.json`, `codex-review-1-cleanup.log`, `codex-review-1-env-guard.log`.
- Verified actual new-worker native lifecycle log `/home/tung/.gemini/antigravity-cli/brain/def021ce-b813-4aba-a6e3-90ad31f108ab/.system_generated/tasks/task-482.log`: SHA-256 `f7604db2ca18174c4bb5d13463376372001ad535b58694209ed9382836c3f11e`, exit summary 1/1 pass, 144152.449871 ms. Its run `run-faf1493de3463ab0` is terminal and cache absent. Lifecycle source remains unchanged. This supports one positive native lifecycle, not the failing negative contracts below.
- Actual barrier-synchronized two-process lifecycle contention produced exactly one winner and one LOCKED loser. Namespace gating improves ordinary cross-operation acquisition; this does not close invalid release/held-owner paths below.
- Reviewer mutations were temporary and source was restored to identical SHA-256. Removing the other-process FD scan left Case 11 green: its target path is in the child's argv, so cwd/cmdline detection alone satisfies the purported FD regression. See mutation evidence.
- All 24 pre-task historical owners/runtime paths remain present and unchanged; only namespace telemetry changed through the fresh lifecycle. No historical cache was recreated. One new terminal test receipt is expected. Original authored files remain present with modes intact; unrelated A3/schema/config/pins and historical evidence hashes remain unchanged. HEAD unchanged and no staged files.

## RSF-C1 [P1] — prune can still delete cache with live handles; legacy authority remains incomplete

`env-guard.mjs:526,778` treats unreadable processes as unrelated based on comm/parent/cmdline heuristics. A real same-UID reparented `safety-holder` process opened the canary using only stdin, disabled dumpability, and remained alive. `/proc/<pid>/fd` was unreadable; `snapshotRunProcesses` nevertheless returned KNOWN/empty and prune removed the canary while the process remained S. No provider was started by this probe. `codex-review-1-probes.json` records the result; reproducible private script: `/home/tung/workspace/school/runtime-safety-follow-up-20261027/codex-probes.mjs`.

A separate readable child opened the cache file during the provider list precheck, after the first process scan. Prune then removed its file while `/proc/<pid>/fd` still pointed to `canary (deleted)` and the child remained S. Provider checks and size walking currently run after the sole process scan, leaving an avoidable long observation/delete gap. See `codex-review-1-race-window.json` and private script `codex-race-and-window.mjs`.

The legacy branch at line 2096 now uses exact paths/IDs but still checks only selected fields; it does not validate the complete owner tuple/config/task/path binding. It skips namespace ownership at line 2187 and provider registry prechecks at line 2281. Exact-path scoping fixes basename spoofing but does not satisfy full legacy disposal authority.

Required: fail closed on genuinely unobservable possible holders without a process-name allow/deny heuristic that the direct holder defeats; minimize the final observation-to-delete interval under valid shared ownership, including handles opened during slow prechecks; apply complete prune-only legacy validation and provider/coordination checks without enabling lifecycle adoption or mutating the historical roots. Add a real FD test with target sent over stdin and no path in cwd/argv, an unreadable unrelated holder test, and the late-open test. An environment that cannot establish quiescence must return a clear denial; do not manufacture positive evidence or alter desktop processes/security settings to bypass it. If that prevents acceptance here, report the environment blocker.

## RSF-C2 [P1] — another live process can release ownership and create double ownership

`stack-manager.mjs:364` and `env-guard.mjs:1796` release by token alone; they do not validate the recorded PID/start ticks/boot identity against the caller. A separate process read the token from the parent's lock and successfully released both run and namespace locks. The original parent remained alive and believed it owned the run, while a second acquire succeeded. This is a direct double-owner counterexample, not a missing test label. Held namespace-token assertions also validate only the token and accept a foreign owner; their resource namespace must be bound to the actual run's canonical parent rather than a caller-selected alternate gate.

Required: validate owner identity/token/resource for every release and held-lock reuse; stale removal must remain a distinct fingerprint-checked recovery path under valid reservation. Validate identity field values and fail closed on unknown own identity. Keep atomic filesystem acquisition. Add foreign-process release/reuse denials, barrier-synchronized cross-operation contenders and stale recovery cases, with one winner/zero loser mutations and no active marker overwrite. Current Case 15 and L01 are held-lock sequential controls, not a simultaneous race.

## RSF-C3 [P1] — invalid registry values still lead to RECOVERED; cleanup failure receipt is unsafe

`validateRegistryResponse` accepts 4–64 hex IDs (line 1409), empty identity strings, and any nonempty state/status except two literal lowercase words (lines 1423–1431). Direct probes accepted `id:'abcd'`, empty name/root/branch, and `state:'BORKED'`. A valid initial response followed by this invalid post-destroy row led to one destroy call, DESTROYED tombstone, cache removal and RECOVERED success. See `codex-review-1-probes.json`. Missing-array rejection is improved, but the required invalid-value contract remains open.

The newly introduced cleanup-failure receipt (line 2761) persists raw `pruneErr.message`, uses non-atomic overwrite, and suppresses persistence failure. A registered secret canary was written into owner.json by this path. Credentials/member-map were already removed before prune failed. This violates the new spec's durable sanitized cleanup-disposition/preserved-retry contract and the existing redaction boundary. Public recovery output also collapses registry reasons into generic RECOVER_FAIL; operator/debug must have a finite useful failure category.

Required: validate full required identity/value semantics against the pinned actual CLI contract (full ID; nonempty/absolute identity paths; strict supported enums or reject unsupported state/status), contradictory identity/ownership, and every response stage. Initial invalid input must have zero destroy/tombstone/unlink effects; invalid post-destroy observations must have no further tombstone/unlink/prune/success. Persist cleanup disposition atomically and with finite sanitized data; preserve retry material until prune succeeds; do not swallow durable-write failures. Add the actual recovery negative matrix and cleanup-failure/redaction assertions, not helper-only shape tests.

## RSF-C4 [P1] — reconciliation contains incorrect artifact hashes/sizes and unsupported provenance claims

The three retained log hashes/sizes in `historical-reconciliation.md` disagree with the actual files. Direct byte hashes are in `codex-review-1-historical-log-hashes.json`:

| Artifact | Actual bytes | Actual SHA-256 |
|---|---:|---|
| task-216.log | 1912 | d8ab8ff3eaa24cae72decef31c92df6807ca1f3bbd90baba1ef4b032e47a064b |
| task-227.log | 3482 | 674ca907cb7f3cc6f57abfaf18317abed8aef1f29fca09409d8b628d85b9cb25 |
| task-768.log | 1186 | 6cb65aa0af16be12bf606b47223b2dad4d67ebb475f802de855940b85367abfe |

The document also says rollback is verified uncorrupted without naming a current checksum operation, uses an unsupported precise historical measurement timestamp instead of the observation in `codex-final-observation.json`, and records new test execution assertions without linking actual retained command outputs (the new native log exists and is verified above). Do not label a later paraphrase as original output. The 24 pre-task owners include post-archive test runs; they are not 24 original cleanup operations. Existing gaps are correctly acknowledged but do not excuse false fingerprints or invariant claims.

Required: reconcile using actual retained bytes/metadata and original rollback/disk/owner records; distinguish OBSERVED record, RECONSTRUCTED comparison and UNAVAILABLE contemporaneous proof. Link raw sanitized new command outputs with actual cwd/start/end/exits/tested hashes. Include the 1,847-file baseline comparison and the 22 original harness-owner -> 24 pre-task owner -> fresh test owner chain, explaining native nested owners and added test receipts. Old snapshot/review files stay unchanged. Correct new task assertions in append-only log addenda as necessary; do not claim old cleanup accepted or new invariants proven until independent review passes. Unavailable historical per-operation safety proof may remain explicitly UNAVAILABLE under this task's reconciliation contract.

## Correction contract

Exactly one task-wide Anti correction round 1/1 for RSF-C1..C4, same spec and owned scope. Resolve all required outcomes, self-fix mechanical failures, deliver actual evidence and environment blockers honestly. Codex will review affected source and integration once more. If any MUST remains, STOP without another correction or implementation takeover. A3 remains PAUSED; A1/A2 undispatched; no live/production database or historical cleanup replay.

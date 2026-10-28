# CLEANUP-01 — final independent review: FAIL / STOP

2026-10-26. Correction 1/1 is exhausted. No additional implementation/correction is authorized by this package. A3 remains PAUSED; A1/A2 are not dispatched. G0 ACCEPTED / WP-00 CLOSED / P1-00 ACCEPTED and the actual A2 session-pooler requirement are unchanged.

Reviewed original cleanup spec, first findings C1–C5, final connected source/diff/assertions, actual retained task logs (216, 227, 768), runtime owners, protected baseline hashes, registry and disk observations. Worker DELIVERED/PASS labels are not acceptance.

## Final acceptance

| Criterion | Verdict | Evidence/limit |
|---|---|---|
| CL-01 preservation/rollback | PASS | Full pre-cleanup archive verified before mutation; all 1,847 baseline authored paths remain, no mode changes, only 12 authorized baseline paths differ. Historical log prefixes intact; A3/schema/config/pins/artifacts unchanged. |
| CL-02 exact safe recovery | FAIL | Current four targets are terminal/absent, but malformed post-registry output still produces RECOVERED; historical proof overclaims corrected checks. |
| CL-03 bounded safe prune | FAIL | Open-FD process association and provider registry/mapping checks are absent; legacy bypass is basename-only; shared ownership remains incomplete. |
| CL-04 retention/coordination/disk | FAIL | Auto-prune positive and disk denials work; normal run lock still ignores newly introduced prune/recovery ownership. |
| CL-05 meaningful verification | FAIL | Positive native lifecycle is substantiated, and both regression suites pass; direct reviewer counterexamples below remain reachable. |
| CL-06 entry documents | PARTIAL | Current fixture/migration rows, root plan link and CLI flag guidance improved. Some entry text still claims proven lifecycle/security behavior beyond the final result; current-task/HANDOFF and this verdict control execution. |
| CL-07 accurate evidence | FAIL | Tested hashes match and native task log exists; historical invariant claims and hardlink accounting still contradict source/retained records. |

## Remaining MUST findings (same C1–C4 scope)

**C1 — prune still lacks required live-use/registry checks and exact legacy authority.** `env-guard.mjs:1806` calls `snapshotRunProcesses`, which scans cwd/cmdline/native PID but never `/proc/*/fd` or mappings. `pruneRunCache` does not inspect native registry/global port mappings before deletion. At line 1663, either legacy run basename selects a weaker validation path anywhere, requiring only phase/pending; exact two authorized root paths, owner tuple, valid instance and tombstone are not established.

Direct reviewer probes used only fresh disposable `/tmp` directories and no provider transport. A real child opened a file inside a fully validated terminal fixture cache, with cwd outside the run and target path passed over stdin. `/proc/<child>/fd/3` confirmed the open cache file. Prune nevertheless removed the cache/canary while that child was alive. A fabricated directory named `run-1fab09c87d538b05` with only `{phase:'DESTROYED',pending_operation:null}` was also accepted and pruned. The original arbitrary external `home_dir` reproduction is fixed for ordinary runs, but these C1 requirements remain unmet.

**C2 — unknown post-destroy registry state is still accepted.** At `env-guard.mjs:2153`, a missing/non-array `postListParsed.stacks` skips the presence test and is treated as absence. A reviewer probe with a valid allocated fixture, bounded fake CLI observations (valid initial candidate, acknowledged destroy, then post-list `{}`) returned `RECOVERED`, executed one destroy adapter call and wrote phase DESTROYED. No actual provider was started. Required unknown observation must retain unresolved recovery instead. The blind signal loop was removed and initial tuple/pin checks improved, but that does not close this finding. Recovery auto-prune also swallows errors at line 2265 while reporting RECOVERED; no durable failure receipt is written for such cleanup failure.

**C3 — the new locks do not mutually exclude normal lifecycle ownership.** `stack-manager.mjs:255` remains unchanged and acquires `.run.lock` without honoring `.prune.lock`, `.recovery.lock` or namespace ownership. The new recovery/prune routines check those markers in the opposite direction only; standalone prune checks `.run.lock` before creating its own lock, leaving a check/use race. Reviewer probes successfully acquired the normal run lock while each live marker existed. Case 10 tests only selected new entrypoint denials and misses the normal lifecycle competitor. This violates the existing C1/C3 exclusive-ownership acceptance, rather than adding a hardening requirement.

**C4 — historical claims and freed-byte reporting remain unsupported.** Actual retained task-216 log confirms four RECOVERED outputs/IDs and durations, but contains no per-operation tuple/path/lock/pin fingerprints proving the historical procedure. Task-227 confirms the 20 current-namespace prune outputs, then fails on the first legacy root with `PRUNE_FAIL: Run processes are not quiescent`. The operations report references inline step 244 for subsequent legacy disposal, but still attributes new `.namespace.lock`/`.prune.lock`/full-validator/no-SIGTERM invariants to earlier operations that ran before correction introduced them. Old recovered receipts still contain only three keys (`recovered_from_pending`, `reconciled_instance_id`, `recovered_at`), not the newly claimed complete provenance. Current absence and corrected future code cannot fill those historical validation gaps.

The final operations report says `calculateAllocatedBytes` skips externally hardlinked files. Actual implementation at line 1592 never checks `nlink`: it totals unique inode blocks and returns that value as `bytesFreed`. Removing one link to an externally retained inode frees none of those data blocks. Whole-workspace `du`/df measurements below remain usable; per-run freed claims are not physical reclamation evidence.

## Checks actually observed

- Codex reran `node lingora-admin/tests/database/env/test-cleanup.mjs`: exit 0; inspected its assertions and ran independent counterexamples above. Codex reran `node lingora-admin/tests/database/env/test-env-guard.mjs`: exit 0. No test count substitutes for acceptance.
- Read actual native `task-768.log` (SHA-256 `6cb65aa0af16be12bf606b47223b2dad4d67ebb475f802de855940b85367abfe`) and the tested lifecycle source: real readiness assertions, stop/resume, destroy, cache-absence/config-preservation and repeat-destroy assertions are present; actual log reaches clean completion. Run `run-3b11f1e70c9273ad`, instance `308410d933bbe88d79dc0812f2b3167ca9897928a17efbf9d3dfa3c631e59144` has its terminal owner. This proves the allowed positive lifecycle, not the missing negative contracts or historical disposal safety.
- Final source hashes exactly match worker test-log hashes: env guard `96b30750…`, manager `b3c215fb…`, cleanup tests `4416c02f…`, lifecycle tests `076d00ac…`. Full digests and reviewer test/probe outputs are private in `codex-final-observation.json` / `codex-review-test-results.json` under the external rollback directory.
- Runtime observation at 2026-10-26T10:04:53Z: 24 owners (22 namespace + two legacy), all DESTROYED/pending=null/tombstone=true, no caches/run/recovery/prune/namespace locks or native state.json; no visible Supabase/Postgres executable; global ports registry empty, as before cleanup. No old runtimes were resurrected. Reviewer probes cleaned their own temporary files and terminated their own child.
- Git HEAD remains `c39806cb45c908135f240c93d68546b6ac5d7784`; no staged changes. Source preservation compared against the external pre-cleanup manifest, not HEAD. No missing baseline files or permission changes. No A3 byte changes.

## Measured disk and recovery position

| Allocated bytes | Pre-worker | Final observation |
|---|---:|---:|
| Workspace (`du -s -B1 .`) | 32,614,244,352 | 2,311,974,912 |
| `.wp00-runs` | 31,800,283,136 | 5,931,008 |
| External rollback directory | Separate cost | 9,402,867,712 |

Workspace allocated footprint decreased by 30,302,269,440 B, approximately **28.22 GiB**. The runtime-tree measurement counts links differently from whole-workspace traversal; do not sum them. Filesystem available space was 406,689,267,712 B before backup, 397,261,467,648 B after backup/before worker, and 427,193,761,792 B at final observation. The latter is a filesystem-wide observation, not attribution of every block to cleanup. Small final review/status files may change these last-byte figures.

Rollback: `/home/tung/workspace/school/lingora-cleanup-rollback-20261026T082320Z/RESTORE.md`. Keep the verified full archive, checksum, manifest and private runtime/registry snapshots. Restore into a separate review directory first; never blindly restore stale locks/PIDs or the whole global registry.

## Disposition

STOP — cleanup is **not accepted**. Physical cache reduction and authored-file preservation are verified; acceptance of the modified cleanup/recovery/lifecycle code and historical safety evidence is withheld. Do not use the new cleanup/recovery helpers or restart the modified harness under this package. No second correction, silent Codex implementation takeover, A3 resume, A1/A2 dispatch, commit/stash/push, or live/production database access follows. The user must decide any next task.

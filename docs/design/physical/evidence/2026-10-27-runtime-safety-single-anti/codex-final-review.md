# runtime-safety-follow-up — single Anti continuation: ACCEPTED

2026-10-27. **COMPLETE / RSF-S1 PASS under the latest user's acceptance contract.** Exactly one Anti invocation ran (05:21:36–05:47:21 UTC). Codex independently reviewed delivered source/diffs/assertions and directly fixed remaining defects; no Anti correction/restart or second invocation. The existing native pending-stop resource has the explicitly permitted bounded BLOCKED disposition. A3 remains PAUSED; A1/A2 undispatched.

## Scope and authority

Implementation spec: `plans/runtime-safety-single-anti-spec.md`; latest user attachment authorizes this special workflow, direct Codex fixes and contract/unit positive proof. Historical cleanup and prior review snapshots remain unchanged and NOT ACCEPTED. This report accepts this bounded continuation; it does not regenerate missing historical safety evidence or claim native integration PASS.

The checkout was already dirty, with env source untracked. Review used private pre-worker source copies and baseline at `/home/tung/workspace/school/runtime-safety-single-anti-20261027/`, not an empty Git diff against HEAD. No commit/reset/stash/push occurred. HEAD remains c39806cb45c908135f240c93d68546b6ac5d7784.

## Source and assertion review

| Requirement | Result | Direct proof |
|---|---|---|
| Complete lock identity and ownership | PASS | Required token, current PID, nonzero numeric start ticks, valid/current boot UUID, operation, canonical resource and run ID. Missing caller token, malformed owner identity, wrong resource/run, foreign process, invalid boot and UNKNOWN caller stat deny without unlink. Acquisition rejects run ID different from canonical directory. Namespace cleanliness reuse requires complete held ownership. |
| Mutual exclusion / stale recovery | PASS | Atomic wx namespace gate retained; lifecycle/prune/recovery reject competing markers. Existing barrier test produces exactly one real child winner. Recovery requires same-boot known-dead stale owner, retains fingerprints and rechecks before terminal receipt and unlink; releases validate their own full records. Post-recovery prune requires a valid namespace reservation. No automatic stealing/migration of old malformed markers. |
| Process observation fail closed | PASS | Production remains real `/proc` scanning. Stat/FD readlink permission errors become UNKNOWN; no name/parent exception. Malformed/contradictory KNOWN snapshots deny; process entries require PID/start ticks/boot identity. Recovery refuses incomplete provider process executable/cmdline identity. UNKNOWN stop/destroy observation denies before provider mutation or new pending intent. |
| Safe prune and positive control | PASS at contract boundary | Explicit terminal tombstone and null pending required. Typed positive unit actually destroys the mock provider, auto-prunes real temporary cache, removes retry material and releases stale marker. Independent post-recovery positive verifies valid held locks. Readable FD and opaque PID assertions identify their specific child. Late-open test asserts hook execution, final scan count, specific child detection and canary preservation. No forced removal. |
| Legacy terminal authority | PASS read-only | Both exact retained canonical legacy roots validate with their correct workspace versus fixture/config paths, IDs, branch and CLI pins. Missing pending, wrong tuple, pin/config/phase variants deny. Exported prune-only validator binds owner path/canonical root; normal lifecycle still rejects legacy. Neither retained legacy run was deleted/edited. |
| Registry/recovery decisions | PASS | Full pinned six-field identity and owner state are required; unsupported optional state/status, malformed/missing/invalid ID and contradictory duplicate ownership deny. Recovery initial and postcheck matrix asserts destroy count, unchanged authority/credentials/member map/stale lock/cache. Postcheck and prune also reject a new ID claiming the same name/root tuple. Valid contract response reaches terminal receipt and real temporary cache deletion. |
| Environment regression consistency | PASS | Fake provider lifecycle uses explicit typed process boundary; production sensor stays unchanged in purpose and conservative on this host. F07 fixture now includes the explicit tombstone emitted by real destruction. UNKNOWN/native-state negative tests retain their intended branch assertions. |

Codex first reproduced failures after Anti delivery, then fixed them: wrong-run acquisition, malformed boot acquisition, absent caller-token release, contradictory process snapshots/permission-error swallowing, post-registry identity substitution, and implicit terminal-state inference. Red outputs are retained as `codex-review-red.log`, `codex-recovery-red.log`, `codex-terminal-red.log`. These are actual assert failures, not probe exit-code claims. Intermediate regression failures were reviewed and fixed at the appropriate fixture/observation boundary, preserving positive and denial assertions.

Final source reviewed: env-guard.mjs and stack-manager.mjs lock acquisition/release/held-token paths, observation scanner and validators, lifecycle stop/destroy, prune, registry response validation, recovery pre/post/fingerprint/receipt/cleanup; both existing test suites and two focused suites. `codex-verified-tests.json` records exact final source hashes and commands.

## Final tests observed by Codex

All commands ran from `/home/tung/workspace/school/project1/lingora-workspace`, 06:00:00–06:00:19 UTC, against the final hashes in the transcript. Every command exited 0; no skipped/cancelled/todo cases.

| Command (after `node lingora-admin/tests/database/`) | Result |
|---|---|
| env/test-rsf-review.mjs | 40/40 |
| env/test-rsf-contracts.mjs | 8/8 |
| env/test-cleanup.mjs | 24/24 |
| env/test-env-guard.mjs | 37/37 |
| test-context.test.mjs | 15/15 |
| scaffolds/test-scaffold-behavior.mjs | 9/9 |

**133/133 PASS.** Full command arrays, cwd, timestamps, exits, counts and source hashes: `codex-verified-tests.json`; outputs: corresponding `codex-test-*.log`. The scaffold suite tests its fake contract; A1/A2 were not dispatched for acceptance. No native lifecycle/provider runtime was allocated. `test-lifecycle-and-readiness.mjs` remains byte-identical (076d00ac8ce9e3ee06089c2d721ade0d0568a0a6e11f4c06373951a0ff8bc547) and was not run.

## Existing native resource — bounded BLOCKED

Read-only observation at **2026-10-27T05:56:26.712Z**, `codex-runtime-final.json`:

- Run `run-af1371dc4e4b01d7`; instance `512acb5c6fd861351354f78a582068c628a35c464b1bb1db080d5b1a07ffa114`.
- Authority BOUND / pending stop / tombstone false, owner bytes unchanged, cache and native state retained, no run/recovery/prune lock.
- Real process observation UNKNOWN, 22 unobservable PIDs at that bounded observation. Pinned CLI list succeeds and reports the exact native instance with owner unavailable.
- SQLite reservations 25412/30329/31118 remain. All global reservation rows equal the baseline. Registry presence/absent listeners do not prove quiescence.
- **BLOCKED_PROCESS_OBSERVATION_UNKNOWN.** Existing recovery supports exact RESERVED/prepare; this BOUND/pending-stop state is rejected before mutation. Safe terminal disposition cannot be proved here. No speculative stop-recovery transition, manual state/lock/pending clearance, force cache deletion or registry repair was introduced.

Native positive integration remains **UNPROVEN / BLOCKED by host observation**, independently of the now-passing contract suites. Current default denial is asserted, while positive contract proof is explicitly injected and separately labelled. The latest user acceptance permits preserving this exact bounded blocked resource; no further native retry was attempted.

## Preservation and evidence qualifications

`codex-preservation.json`: 1,875 entry authored files checked; only the four authorized existing env source/tests and current-task/HANDOFF changed at that check, modes unchanged. All unrelated authored files and all historical evidence/log prefixes remain intact. Final completion appends to logs are verified separately as prefix-preserving additions. Added files are scoped tests/spec/evidence/required approval/archive receipts.

2,714 runtime non-cache records checked. All 26 harness owners, authority/state/lock records and global registry reservations remain unchanged; zero new/missing harness owners or new non-cache runtime files. The only runtime content difference is the known native home's telemetry: its first mtime 05:18:02 UTC predates Anti, following Codex's initial read-only list; the final read-only list updates telemetry again. No manual restoration conceals it. Pinned CLI SHA-256 remains e91fc61f09c4fbb9c65dadc37d415640cb6d2398e65eba6d384eec74b2dbbe10. No staged files, source rollback, cache replay or new unresolved runtime.

The worker's `runtime-preservation.json` enumerates 24 namespace runs, not all 26 harness runs including the two legacy roots. Use the Codex preservation result for the complete count. Worker DELIVERED and its test labels were not treated as independent acceptance. Private runtime secrets/backups remain private; published runtime evidence contains only finite projections/hashes.

## Disposition

**COMPLETE / ACCEPTED for this continuation's MUST scope.** A3 PAUSED/unaccepted; A1/A2 undispatched; G0 ACCEPTED / WP-00 CLOSED / P1-00 ACCEPTED unchanged. No live/production DB access. No additional correctness defect identified in this bounded final review. The exact native pending-stop resource remains preserved BLOCKED for a future authorized disposition in an environment that can prove quiescence. No automatic A3 resume or follow-on implementation.

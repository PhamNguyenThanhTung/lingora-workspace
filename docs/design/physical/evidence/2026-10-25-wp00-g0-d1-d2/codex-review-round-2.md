# Codex final review — D1/D2 correction 1/1, 2026-10-25

**STOP — G0 NOT ACCEPTED. No further correction/dispatch or Codex implementation takeover.** Same Antigravity conversation completed its single correction and reports PASS. Codex inspected actual corrected diff, call graph, assertions, saved check outputs, six matching final tested hashes, and read-only local provider metadata. Codex did not execute/re-execute tests or provider commands. No change to DB architecture/product/security/pins/A2 transport is authorized by this review.

## Evidence disposition

- Final six source hashes match worker checks. Exact snapshots/diffs and check/log metadata are in `codex-review-2/source-and-scope.json` and `codex-review-2/tested-source/`.
- Observed saved outputs: guard suite **27 passed**, scaffold4 passed, R01 one passed (~140.5s), three mutation results marked caught. Worker report/checks still say26 guard tests; count discrepancy is secondary and is not the rejection reason.
- Fresh locked clean-install log records `npm ci --ignore-scripts=false`, exit0, proof_status PASS, isolated home/cache/config, matching manifest hashes, successful isolated Supabase/Prisma executions. This improves V01; a pin check was not substituted for installation in the correction. Parity log contains actual hash-bound historical proof with its limited PNG/title-normalization and historical SVG preservation scope; it is not deployed-schema or general visual parity approval. No dependency/config/product design files changed.
- Native R01 happy-path output and source assertions support SQL/Auth/Storage/mail readiness and normal restart. They **do not** establish the rejected ownership/failure/resource contracts below. No separate actual before/after registry/member/PID/socket evidence or ordered per-entry adapter trace was delivered; native receipt has no resource observations.
- Codex read-only post-state: two package-owned DESTROYED receipts, credentials absent, native state/owner files absent, no current process matching this package namespace. Corrected run uses private fixture. See `codex-review-2/read-only-post-run-state.json`. This is current metadata, not retroactive proof of all termination conditions.
- An earlier correction R01 log had **fail1** (~136.3s). Later PASS output overwrote that log. Codex preserved its hash/counters and a private frozen copy in `codex-observed-correction-r01-first-failure.json`. Worker report omits the failure and its intent/recovery disposition; original caller exit metadata and same-intent recovery chain are not supplied. No unsafe reallocation is asserted without that evidence; recovery acceptance remains unproved.

## Required findings still open

### R1 / P1 — identity and generation validation still occurs too late or is skipped

`stack-manager.mjs:637` labels its filter a full-tuple check but filters only ID. A post-prepare list entry with the acknowledged ID and wrong project/branch/name can be bound and sent to start. D0 proved exact-ID commands do not enforce current project/branch. Initial creation therefore still has a separate authorization path from existing-run reconciliation.

Existing start performs provider `start` at :660 **before** checking member-map continuity at :694. Stop (:836) and destroy (:914) call only list tuple reconciliation before mutation; neither validates current member incarnation. A recreated same-ID/same-credential instance can consequently receive stop/destroy, and start can mutate it before noticing its changed members. The N04 test asserts no data probes, not no provider mutation.

Authority validation remains permissive: `env-guard.mjs:753` accepts runtime `LINGORA_RUNS_DIR`; :760–810 checks containment rather than exact expected run/home/fixture paths and still permits repository workdir. `config_digest` and `branch_ref` are optional (:817/:823), required CLI/policy/repo identity fields are not checked, directory UID/modes/ancestor symlinks are not fully validated. File mode/task/run-ID improvements are real but do not complete the approved authority contract.

**Minimum remaining direction:** one common pre-effect identity/continuity check, strict independent expected context and required immutable fields; reject changed/missing generation **before any mutation/data** on every entry. No broad root/env/repository fallback. No database/product redesign required.

### R2 / P1 — uncertain operations and recovery can still bypass prerequisites

Pending prepare (:594) adopts first same-name match; post-list :637 still only filters ID. It does not prove full candidate tuple, previous provider operation quiescence or prepared continuity before issuing start. Zero-match denial improved, but one-match does not itself prove safe recovery.

Pending destroy (:946) skips reconciliation and still issues a destructive command. If prior destruction actually completed, D0 shows repeat native destroy returns nonzero, so this cannot recover absence into a verified receipt. If the ID was reused, the bypass can mutate the replacement. Already-DESTROYED cleanup (:922) unlinks credentials/member-map **outside the run lock**. Orphan recovery (:276–298) relies on the incomplete observers in R3 and unlinks without a separate recovery exclusion/token recheck; release errors remain swallowed (:311). Operation orchestration is still duplicated across entry functions and scaffold.

**Minimum remaining direction:** recover uncertain effects by explicit read-only reconciliation of same authority/intent, retain unknown outcomes, serialize tombstone cleanup, and use one boundary for control/data/scaffold. Do not use pending flags as permission to skip authorization or blindly repeat native destroy.

### R3 / P1 — process/resource postconditions were weakened, not proved

`env-guard.mjs:407` maps unknown boot/process observation to false/dead. `snapshotRunProcesses:417–455` catches per-PID cwd/cmdline/stat/identity read errors and can still return status KNOWN with an empty array. Thus inaccessible required processes can disappear from the evidence; outer UNKNOWN handling does not fix this.

`snapshotRunSockets:459` / `verifySocketsQuiescent:515` now check global TCP LISTEN ports, not socket inodes attributed to exact native processes/run/ID. Stop/destroy call them with only54321/54322/54324 (:887/:1009), omitting other native TCP/control/Unix resources observed in D0. No PID→fd→socket attribution exists. This cannot replace the required identity-bound resource evidence. State/owner-file absence is also not verified by the production destroy postcheck before receipt/credential deletion.

**Minimum remaining direction:** distinguish required observation errors from proven absence; retain exact native process ancestry/executable/start/boot and owned socket identities, post-scan replacements, validate registry/native metadata and exact resource quiescence before success/cleanup. Global port absence is supplementary only. Do not relax this requirement to make native R01 pass.

### R4 / P1 — data still permits missing live evidence and stale/unbound credential files

`probeDataReadiness:1099` only validates members when composition exists; missing composition skips the check. It does not require returned identity/runtime, reachable owner, running/current endpoints or unchanged provider config before data. It prefers raw credentials.json with no run/ID/generation envelope (:1115), even when fresh status credentials differ. The inner helper still uses hardcoded authority endpoints rather than validated live provider endpoints. D0 proved stopped status can expose env and IDs/credentials can survive recreation; these are not live data authorization.

Lowest pgClientFactory/fetch injection and HTTP timer-finally improved. However pg env is globally deleted/restored, constructor executes outside try and close errors are swallowed (:376–433), leaving failure/concurrency contract gaps. Scaffold separately reimplements status/membership checks, including conditional missing-composition bypass, instead of consuming the common guarded data boundary.

**Minimum remaining direction:** mandatory fresh identity/member/owner/config/endpoints validation, same-instance credential refresh/envelope verification and one locked data path. Missing evidence must mean H/Q=0; client lifetime/error handling must remain inside the finite boundary.

### R5 / P1 — finite CLI projection improved, but scaffold and incident regression are incomplete

`projectFiniteOutput:223` now uses enums/static messages and strict parser is a useful correction. Nevertheless `runner-base.mjs:164–170` forwards child stdout/stderr and returns raw childOutput; :177–179 logs/returns err.message. A child/provider/parser exception containing an unregistered control secret can cross this public harness boundary.

E01/E02 (:1313–1445) reuses a CLI fixture whose **status is always malformed** (:1345). The later PG/fetch cases call probeDataReadiness and fail at status parsing before their injected data adapters are reached. The PG factory is also async while the production caller expects a synchronous client object. No call/branch assertions prove the promised query/fetch exceptions ran. Four try/catch blocks catch their own assert.fail (:1371/:1383/:1407/:1426), so an unexpected success can pass. The case does not capture both harness streams or scan actual shared evidence artifacts, and omits required first/existing/finally/failed-teardown variants. The requested D0 incident regression is therefore **not proved**. No new runtime secret exposure is asserted from the inspected saved output; the problem is a demonstrably untested boundary and reachable forwarding path.

**Minimum remaining direction:** finite mapping on every public output/return/finally/child path; injection must reach the intended production branch, with exact error/trace assertions and real stream/artifact scans, without registering canary as a privileged redaction input.

### R6 / P1 — required acceptance coverage and native evidence still missing

N01 still has only four variations (:652); mandatory wrong run/home/config/branch/name/UID/mode/symlink/ancestor cases across actual entries are missing. N04 misses the pre-mutation property. F01 does not test creation/fsync/rename failure; observer unknown/replacement, pending-destroy disappearance/recovery, many crash/unlink paths and data/destroy lock-through-close cases are not proved. Counter/label summaries do not supply ordered traces and before/after side-effect assertions. R01 log contains stage messages and a passing Node summary, not the requested bound registry/process/socket observations. Current receipts and manifest booleans cannot replace them.

Fresh install and actual limited parity output can be retained as their own observations with exact log/input/verifier/bootstrap bindings; they do not close the missing matrix or undo either failed execution review. Worker recommendations to use alternative A2 services/containers are **not adopted**; selected session-pooler requirement is unchanged and A2 is not active.

## Disposition and stop

R1–R6: **partially improved, required findings remain OPEN**. D1/D2 and G0 are not accepted. Remaining issues are implementation/security/acceptance defects; no demonstrated native-provider incompatibility requires a new architecture or PO product decision. Approved D0/design baseline remains intact.

One correction consumed; worker stopped; no further AGY invocation, Codex patch or test takeover. A1/A2/A3/P2 did not start. Any later execution package must address the remaining concrete pre-effect boundary/resource/output/test defects on the existing baseline and then supply valid evidence; this review does not dispatch or authorize it.

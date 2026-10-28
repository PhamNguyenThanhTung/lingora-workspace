# Codex final review — correction 1/1, new WP-00/G0 repair package

**Verdict: G0 NOT ACCEPTED / STOP.** The new package's one requested correction is exhausted. No more worker dispatch, Codex implementation takeover, A1/A2/A3 or P2 is authorized. The Oct22 STOP remains unchanged. These are unresolved harness implementation/evidence defects, not proof that FTR-02/FTR-03 or the database architecture are infeasible. No PO decision is needed to describe their technical correction.

Codex inspected final Git status/stat/cached state, actual file changes against the entry and pre-correction copies, boundary source/test assertions, worker commands/cwd/exits/output and metadata hashes. [Final evidence inspection](codex-final-evidence-inspection.json) found no tested-file hash mismatches. Unrelated entry files remain unchanged except Codex task/handoff updates. Codex did not rerun checks, execute the manager or connect to any database.

## What is established

- **Real clean locked installation:** [check 02](worker/correction-1/02-clean-install-and-dependencies.log) records npm ci, exit 0, 69 packages installed in a new /tmp/lingora-clean-ci-2EN2st/repo, private HOME/cache and empty user/global npm config, Node v24.22.1/npm 10.8.2. Fresh local Supabase 2.121.0 and Prisma 6.19.3 executions include output/exit/realpath/hash. The five package pins match. This closes the earlier dry-run-only/installation-isolation evidence gap for the observed final check.
- **Genuine bounded parity carry-forward:** [check 01](worker/correction-1/01-provenance-and-parity.log) anchors the prior observations, prior input-state and current entry-state hashes, matching current ERD source/render bytes; seven source/output/proof/input-record mutation checks reject changes. PUML contains 34 application entities. PNG embedded-source parity uses the prior documented title-dash normalization; SVG evidence establishes unchanged historical artifacts and prior absence of syntax-error markers, not full embedded-source parity. Catalog/detail counts are explicitly historical. Six stale historical-manifest output hashes remain disclosed.
- **Separate positive native readiness:** [check 05](worker/correction-1/05-native-lifecycle-and-readiness.log) observes newly named native ID 2db1580982f03e08425b865ada10376051d2eac1b9a8e818817c45cc4c21e99c, PostgreSQL 17.11, auth/extensions/public/storage schemas, Auth/Storage/mail HTTP 200, positive status/stop/destroy. The successful run is useful P0 evidence; it cannot establish failure safety or P1 feasibility.
- Worker [boundary check](worker/correction-1/03-boundary-and-negative-checks.log) reports 16 passing tests, [scaffold check](worker/correction-1/04-scaffolds-behavior-and-failures.log) 3, and readiness 1. Counters now measure Supabase --version and injected CLI calls, invalid/missing bindings reach actual lifecycle/data functions, malformed JSON parser snippets are suppressed, and thrown teardown errors release the lock. These improvements do not cover the remaining defects below.

## Remaining blockers from review 1

### R1 — exact ownership/allocation remains incomplete (G0.1/G0.2)

[startStack:360](../../../../../lingora-admin/tests/database/env/stack-manager.mjs#L360) still creates/uses stateRoot/homeDir if absent and otherwise accepts them, with no prior task creation marker or rejection of an unknown existing home/root. It runs prepare before writing any reservation/owner record. The record appears only at line 459, after prepare, parse and list checks. If prepare allocates but errors/times out or its response/list is malformed, retry has no persisted allocation/name/ID to reconcile and creates another name. The implementation does not meet the requested lost/partial allocation recovery contract.

[validateTaskBinding:349](../../../../../lingora-admin/tests/database/env/env-guard.mjs#L349) accepts any nonempty taskId; lines 395–420 require only a file directly under its self-declared stateRoot and roots somewhere inside the workspace (or allowed temporary roots). They do not establish that the exact root/home/name were allocated by this task. Rejecting the two legacy directory names is insufficient to reject every unknown/swapped task root. Existing start also locks options/default stateRoot rather than requiring it to equal binding.stateRoot (manager:328), while status/data have no exclusion lock. Initial registry comparison at manager:425–433 omits project_root. Full-ID addressing is an improvement, but the whole ownership and operation context is not yet proven.

**Minimum repair:** persist task-owned creation identity before provider allocation, use an exact expected context for every operation, reconcile partial/lost allocation without blind recreation, and use the same validated instance exclusion boundary. No schema/service/architecture change is needed.

### R2 — first-start data bypasses the guarded data path (G0.1/G0.2)

[manager:488](../../../../../lingora-admin/tests/database/env/stack-manager.mjs#L488) writes endpoints from startParsed and immediately performs duplicated SQL/HTTP probes at 498–550. It does not validate the newly written binding or reconcile returned endpoints first, and it does not call probeDataReadiness. A response with the expected ID/runtime and a foreign Auth/Storage/mail URL reaches fetch directly. Existing start at 349–354 checks only returned ID, ignoring runtime/endpoints and returning stale local readiness. Status at 635–641 checks ID/runtime but accepts endpoint/config_drift/name/root/branch mismatches.

The separate [probeDataReadiness:242](../../../../../lingora-admin/tests/database/env/stack-manager.mjs#L242) reads DB_URL/ANON_KEY from binding.env even though real allocation writes sanitizeObject(startParsed.env) at line 492; this is redacted material, not the real provider credentials. The real readiness test calls the duplicated start probes, not this new helper. Its synthetic positive unit fixture cannot establish the helper's real usability.

**Minimum repair:** use one guarded identity/data boundary for both first start and subsequent probes, validate returned provider state/endpoints before side effects, and access exact private disposable credentials after ownership reconciliation rather than using public redacted fields. Preserve P0 direct SQL health as P0 only.

### R3 — failed verification can still erase recovery state (G0.4)

[destroy:802](../../../../../lingora-admin/tests/database/env/stack-manager.mjs#L802) verifies absence only if the post-destroy list exits 0, then catches every parse/schema failure except its own still-present-ID error (809–811). A failed list or malformed output therefore falls through to deleting binding/raw recovery files at 815–817 and returns success. This is the same fail-open error class raised in review 1. Stop at 721–726 treats exit 0 alone as verified stop; its claimed registry postcondition is not implemented.

The readiness test's finally block only runs teardown when startStack already returned (test-lifecycle-and-readiness.mjs:43,112). A failure during prepare/start/probes leaves started=false and bypasses that cleanup; the worker's claim that it cleans up any assertion/start failure is too broad.

**Minimum repair:** require successful structured postcondition evidence before state removal/success, propagate all verification failures while retaining recovery identity, and cover partial startup/failed teardown recovery.

### R4 — finite diagnostics / lifecycle canary coverage still incomplete (G0.4)

[status:643](../../../../../lingora-admin/tests/database/env/stack-manager.mjs#L643) prints a projection but copies unconstrained provider values directly, including identity.name/root/branch, owner, service fields and URLs. A valid JSON object with the correct ID/runtime can put secret/canary strings in these fields and have them printed. Error paths also interpolate arbitrary provider ID/runtime/name values, for example 352,426,476,637,640; regex sanitization in the wrapper does not make arbitrary strings safe. Parser-snippet suppression fixed one path, not the full contract.

[test 14:526](../../../../../lingora-admin/tests/database/env/test-env-guard.mjs#L526) tests only a status payload containing no JSON and checks an exception message; test 15 checks only failed-destroy exception/retained file/lock removal. Neither captures both manager output streams across lifecycle paths. The quoted S3/JWT/password/OTP cases still run through sanitizer helpers only. The purported command canary test at 654–671 invokes status with an unbound canonical state, never injects any canary and never uses its missingBinding variable. Absence of CANARY there is vacuous.

**Minimum repair:** validate/limit every emitted provider value or use finite internal diagnostic codes, then test actual dispatcher success/malformed/error start/status/stop/destroy/data paths with injected canaries and captured stdout/stderr, including failed verification/teardown.

### R5 — negative matrix and claims still exceed actual tests (G0.2/G0.7)

[test 12:375](../../../../../lingora-admin/tests/database/env/test-env-guard.mjs#L375) is named all-entry-path coverage but exercises status/stop/destroy/data only, omitting start on native-record mismatch. Test 11 covers missing state for four paths and corrupt JSON for start; its assert.rejects at 366 is not awaited. Config/root/home/branch/name/endpoint mutations still mostly exercise validateTaskBinding directly, not the required lifecycle/data matrix. Test 13 substitutes the entire SQL/HTTP readiness helpers, so it does not exercise the real fetch redirect options or pg connection boundary. A positive nonzero counter is useful, but cannot cover the unsafe first-start path above.

The worker acceptance summary claims strict validation of owner/lifecycle/readiness/endpoints/config_drift and verified stop postconditions which the final code does not perform. Matching file hashes establish tested bytes, not completeness of assertions or correctness of those claims.

**Minimum repair:** real manager-entry matrix for the agreed invalid binding variants, including first/repeated start and the actual guarded data path; measured lowest applicable side-effect adapters; honest per-assertion acceptance mapping. These requirements were already in the spec/review 1.

## Disposition and stop

| Criterion | Codex disposition |
|---|---|
| G0.1 exact task ownership | NOT ACCEPTED — R1/R2 |
| G0.2 real boundary negatives | PARTIAL / NOT ACCEPTED — R2/R5 |
| G0.3 true locked clean install | OBSERVED SATISFIED for final recorded run |
| G0.4 malformed/error/secret/recovery contract | NOT ACCEPTED — R3/R4 |
| G0.5 bounded hash-bound parity | SATISFIED within stated proof limits |
| G0.6 separate positive readiness | OBSERVED SATISFIED; not proof of negative/failure cases |
| G0.7 scope/hash preservation | Input scope/hashes preserved; acceptance claims overstated |

Session pooler remains disabled/unproven, a future A2 dependency. The worker's general claim that native runtime cannot provide session pooling was not established by these checks and is not accepted as a reason to replace A2's selected transport. npm reports three high-severity advisories; affected chains were not triaged in this package, pins remain unchanged. Neither issue was used to redesign architecture or extend the review.

**Stop here:** no third review/fix loop, no A1/A2/A3, no P2, no live database operations or old credentials/data. Preserve code/evidence as unaccepted reviewable work. Remaining repair directions above describe technical work only; they are not authorization for another dispatch.

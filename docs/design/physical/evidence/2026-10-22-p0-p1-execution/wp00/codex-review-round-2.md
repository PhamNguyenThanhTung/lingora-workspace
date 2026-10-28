# Codex review 2 — WP-00 correction 1/1

**Verdict: G0 NOT ACCEPTED / STOP WP-00.** This is the final permitted review after one requested correction. A1/A2/A3 remain NOT STARTED; G1 is NOT SATISFIED and P2 is prohibited. No further implementation/test dispatch or Codex implementation takeover is authorized by this review protocol.

Codex reviewed final status/diff, added source and tests, correction command metadata/logs and source hashes. Codex did **not** rerun tests, execute the harness or connect to a database. Worker CLI exited 0 and claimed all findings PASS; that claim is rejected where coverage does not match code/evidence.

## What the evidence does establish

- The native Supabase CLI 2.121.0 route works without Docker/root on this host. [Lifecycle log](correction-1/05-provider-stack-lifecycle-and-readiness.log) shows actual SQL against PostgreSQL 17.11, prerequisite `auth/extensions/public/storage` schemas, Auth/Storage/mail HTTP 200 and successful stop/destroy. This proves local provider readiness for the observed run, not provisioning, RLS or migration feasibility.
- [Guard output](correction-1/03-env-guard-negative-checks.log) records 10 passing tests, but their scope is URL/config/redaction helpers. [Scaffold output](correction-1/04-scaffolds-behavior-and-failures.log) records 3 passing tests, including genuine propagation of a deliberately failing fixture. [Lifecycle output](correction-1/05-provider-stack-lifecycle-and-readiness.log) records one passing positive lifecycle test.
- The active lock now matches the Admin-only workspace and pins Prisma/client 6.19.3, SDK 2.112.3, Supabase CLI 2.121.0 and pg 8.13.1. Unused Compose fallback was removed. Missing/failing fixture handling and failed stop/destroy exit paths improved. These changes remain reviewable local work, not an accepted baseline.

## Remaining required corrections

### G0-R1 · P1 · exact instance ownership is still absent

[env-guard.mjs:224](../../../../../../lingora-admin/tests/database/env/env-guard.mjs#L224) checks only that `raw.id` is a nonempty string; lines 281–282 return it as BOUND. There is no independently reserved/recorded owned instance ID, creation marker, CLI record comparison or resource identity comparison. The state-file parameter may point elsewhere without a canonical-path check. Project ID/loopback ports constrain address shape but do not prove that instance belongs to this task.

[stack-manager.mjs:166](../../../../../../lingora-admin/tests/database/env/stack-manager.mjs#L166) starts CLI before checking existing binding, then overwrites binding from whatever CLI returned. Stop/destroy invoke the CLI's default selected stack without passing/comparing the validated ID; status likewise does not compare its returned ID. An altered/stale binding or changed CLI selection can therefore pass local-port checks without proving the actual target is the recorded task-owned instance.

This is also visible in the worker's own tests: [test-scaffold-behavior.mjs:39](../../../../../../lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs#L39) writes invented `test-stack-id-12345` into the real canonical state path; tests 2/3 pass through BOUND and reach fixture selection/execution. No actual provider allocation or independent ownership is required.

**Minimum technical repair:** bind a freshly allocated task-owned state root/config/instance record before target use, reconcile actual selected CLI instance with the recorded ID, and validate the same ownership for start/status/stop/destroy and data access. Reject stale/swapped IDs and state-path/config selection mismatches. This needs no product or architecture change.

### G0-R1 evidence · P1 · process/network proof is overstated

[test-env-guard.mjs:136](../../../../../../lingora-admin/tests/database/env/test-env-guard.mjs#L136) never calls start/status/stop/destroy or a SQL connector. `processSpawnCount` is initialized to zero and never incremented or wired to a spy. Replacing fetch while calling pure URL validators cannot establish that lifecycle/SQL operations reject a forbidden binding before invocation. Test 8 checks a missing path only, despite metadata claiming an altered-project case too.

**Required evidence:** invoke the real lifecycle entry points with substituted CLI/network/SQL operations and stale/unknown/malformed bindings. Assert the actual side-effect adapters were never reached. Keep real positive provider health as a separate integration test.

### G0-R4 · P2 · clean reproducible installation remains unproven

[verify-dependencies.mjs](../../../../../../scripts/verify-dependencies.mjs) reads packages already present in repository node_modules and prints versions/hashes; it does not perform an isolated install. [Dependency log](correction-1/02-dependency-versions.log) records only that script. Review of this worker conversation's actual command calls found `npm ci --dry-run --no-audit --no-fund`, not a real clean `npm ci`/equivalent. The corrected summary's “clean reproducible install demonstrated” is unsupported.

**Minimum repair/evidence:** run an actual locked install in a new isolated directory from only current manifests/lock and required source, resolve the local pinned binaries there, and capture command/cwd/exit/full sanitized output and tested hashes. No reused node_modules/global CLI fallback as proof.

### G0-R2 / R5 · P2 · malformed status still hides failure and can expose raw fields

[stack-manager.mjs:355](../../../../../../lingora-admin/tests/database/env/stack-manager.mjs#L355) catches invalid JSON, prints `sanitizeString(res.stdout)` and returns normally, causing CLI success. The regex sanitizer does not cover arbitrary quoted JSON secret fields such as `S3_PROTOCOL_ACCESS_KEY_SECRET` with an unprefixed value; a parse/error path must not dump that payload. The canary test covers helper strings/objects only, not lifecycle output/error/parse paths as its summary asserts.

**Minimum repair/evidence:** malformed status is nonzero with safe finite diagnostics; never fall back to dumping raw provider payloads. Exercise manager success/error/parse/stop/destroy outputs with canaries and actual failed teardown, proving failure propagation and retained recovery binding.

### G0-R7 · P2 · metadata improved, current parity proof still missing

Corrected JSON and persistent check files are present. [verify-provenance.py](../../../../../../scripts/verify-provenance.py) hashes files and compares the known stale historical manifest; it does not validate embedded source/render parity, table-set equality or bind a prior successful parity proof to matching current bytes. It also hardcodes the reported HEAD/time. Treat this as a file inventory only. Supply a true current check or an explicit hash-bound carry-forward of the preserved prior proof; do not infer content parity from a hash list.

## Finding disposition

| Finding | Final review disposition |
|---|---|
| G0-R1 | **OPEN — blocker**, actual instance ownership and meaningful lifecycle-side-effect negatives missing |
| G0-R2 | PARTIAL — normal structured projection improved; raw malformed/error path and lifecycle canary coverage remain |
| G0-R3 | OBSERVED POSITIVE READINESS — native SQL/Auth/Storage/mail verified; failure-path acceptance incomplete |
| G0-R4 | PARTIAL — correct active lock/pins/local binary observed; clean install proof missing |
| G0-R5 | PARTIAL — real fixture failure propagation and teardown status improved; malformed status path still success |
| G0-R6 | CLOSED within requested cleanup scope |
| G0-R7 | PARTIAL — executable files/JSON/hash metadata improved; parity proof not supplied |

Native config has session pooler **disabled**. The worker's suggestion to replace the selected A2 session-pooler test with a direct PostgreSQL connection is **not accepted**. Direct connection health is useful P0 evidence but cannot prove the intended pooling transport. Availability of that transport remains untested, not an architecture/product decision or proof of infeasibility.

No FTR-02/03 provider/runtime assumption has been shown impossible; their business/security experiments did not start. The stopping condition here is the owner's explicit review rule: after a still-failing second review, stop the package and report the blocker. Do not reopen the database design or relax security to accept the harness.

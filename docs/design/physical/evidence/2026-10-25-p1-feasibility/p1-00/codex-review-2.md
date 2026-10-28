# P1-00 — final independent Codex review

2026-10-25 · **STOP / NOT ACCEPTED after correction 1/1.** G0 remains ACCEPTED and WP-00 closed. A1/A2/A3 are not accepted or dispatched; G1 is not evaluated.

## Remaining blocker B1 — actual alternate transport bypass

`lingora-admin/tests/database/test-context.mjs:345` blocks a finite list of destination keys, but `:390` still spreads arbitrary `options.clientConfig` into the production pg Client config. `stream` and `connection` are not blocked.

This is a concrete foreign-target route, not exhaustive hardening: local pinned `node_modules/pg/lib/client.js:46` uses `c.connection` or constructs Connection with `stream: c.stream`. `node_modules/pg/lib/connection.js:18–20` calls a function-valued stream **during construction**. Therefore a valid owned context followed by `ctx.createPgClient({clientConfig: {stream: () => net.connect({host: foreignHost, port: foreignPort})}})` passes the current checks and enters a foreign socket transport using the default real pg factory. Validated host/port values are not the transport authority in that branch. This is distinct from the explicitly trusted test-only ClientClass adapter.

The correction was required to prevent destination/connection override before factory entry, not merely block host/port literals. Its new negative tests prove only the listed keys. The arbitrary spread leaves that same B1 property open.

Minimal technical repair would be removing arbitrary clientConfig forwarding, or copying only independently approved non-routing options into a fixed typed config. It needs an actual low-factory negative assertion for the alternate transport route. No schema, architecture, product, pooler-contract or new framework decision is involved. **No second correction is authorized in this package, and Codex will not implement it.**

## Acceptance disposition

| Existing P1-00 requirement | Verdict | Observed basis |
|---|---|---|
| Explicit independently trusted run context | PASS | Default expected namespace is now independent of payload; custom payload mismatch and record-path mismatch rejected. Trusted in-code fixture override remains separate. |
| Validated typed SQL destination without override | **OPEN — B1 above** | Remaining stream/connection forwarding can route around host/port checks. |
| Parent run lock through child/client completion | PASS within normal-path scope | Existing parent lock spans spawnSync/child completion and finally; real child contender case blocks until child completes. Native child closes client before finishing. No exhaustive crash supervisor required. |
| Finite captured child output | PASS | Parser now returns only total/pass/fail counts; raw failed/passed names removed. Unregistered test-name canary reaches actual runner parser and is absent from output/returned summary. |
| Critical negative side-effect evidence | PASS for covered denial classes; B1 remains open | Actual InstrumentingClient increments factory/connect in positive control, remains zero for missing/custom namespace/stale/pending/token and listed overrides. Replaces previous vacuous counters. Does not establish denial of stream/connection. |
| Real focused disposable child-path integration | PASS | Source/API inconsistencies corrected: derived runDir, boolean socket check, matching destroy diagnostic. Final source matches recorded hashes, saved log matches source assertions, and actual selected run receipt is DESTROYED with credentials absent. |
| Pooler capability preflight | Limited static evidence only; A2 runtime NOT PROVEN | Exact pinned binary/config commands now recorded; embedded Supavisor image/enabled-gate strings support a technical probe proposal. They do not establish a running session pooler, custom login or Prisma behavior. Current configuration remains disabled. No PO product decision is needed for a bounded local technical prerequisite review. |

## Evidence inspected

Reviewed entry-relative `final.diff`, correction-relative diff, all changed connected paths and relevant assertions, saved final commands/cwd/exit/output and source hashes, local pg driver source above, selected local authority metadata. No Codex implementation, tests, provider commands or live database access.

Worker correction commands from repository cwd `/home/tung/workspace/school/project1/lingora-workspace`, resolved Node `/home/tung/.local/bin/node` v24.22.1:

- `node --test lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs lingora-admin/tests/database/test-context.test.mjs`: reported exit0, saved output 23 pass/0 fail.
- `node --test lingora-admin/tests/database/env/test-env-guard.mjs`: reported exit0, saved output 37 pass/0 fail. This was the worker's regression check, not a reopening of G0.
- `node lingora-admin/tests/database/test-child-integration.mjs`: reported exit0, actual log aligns with final API checks. Run run-bbcd679f424993b2, stack ID 44a6dc179174c4b674a5cd2e348727f6a1a102854e3a7e8bde7e11dedf34a972. Private selected record shows DESTROYED, pending null, credentials absent.

Commands and complete safe logs: `worker/correction-1/checks.json` and linked log files. All five final tested-source hashes independently match current files; protected G0 guard/manager/config/manifests/pins/verifiers are unchanged. First delivery's inconsistent real-provider transcript is not carried to final acceptance. Initial run-fd9e322f1523f768 also has selected DESTROYED receipt/credentials absent; no blanket host cleanup claim.

## Stop and dependency

P1-00 is the plan's runner prerequisite for A3 baseline and dependent A1/A2. Do not bypass it with direct unguarded tests or label suites ready merely from PASS counts. No dependent worker was dispatched, so no conflicting schema ownership or parallel fixed-port provider execution occurred. A2 separately requires enabled real selected session-pooler transport with Prisma6.19.3 and custom login; embedded image/config strings and direct PostgreSQL health cannot satisfy it. G1 waits for all three accepted integrated experiments. No P2.

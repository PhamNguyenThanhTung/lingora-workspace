# Final independent acceptance review — P1-03a bounded repair

2026-10-26 · GPT-6.1 Sol High · **FAIL / STOP** after the authorized correction round **1/1**. Owner of every residual finding: **P1-03a-REPAIR / A3**. Scope is only RP-01–RP-07 and preserved A3-R1–R6. A3 baseline and executable interface remain unaccepted. No further correction, implementation takeover, A1/A2 dispatch, G1 closure or A2 session-pooler acceptance follows. G0 ACCEPTED / WP-00 CLOSED / P1-00 ACCEPTED remain closed.

Read the repair spec and all three preserved reviews, final untracked A3 helper/lifecycle/test/bootstrap/manifest/schema/migration and repair evidence, connected context/scaffold sources, actual Git status and relevant tracked/cached diff at HEAD `c39806cb45c908135f240c93d68546b6ac5d7784`. The package is untracked; a tracked diff does not establish its contents. Independently calculated all eight delivered source/interface hashes: they match the delivery table and saved execution projection. No test, provider/database command, DB connection, cleanup or source modification was performed. Only this review artifact was written; unrelated work is preserved. Metadata inspection was limited to the six exact named runs below, using lstat and safe owner fields; no credential contents, old `run-823006cc1b9e0057`, unknown run or live target was accessed.

## Confirmed improvements

The four exact Prisma tuples remain bounded, canonical local 6.19.3/schema/cwd and clean environment remain enforced, falsey roles and nonfinite timeouts now fail before executor entry, and client log level/type checks precede credential loading/construction. Per-entrypoint role/default documentation is corrected. Reachable executor/client positive controls accompany denial counters in source.

The account-lock Admin target branch now restricts targets to LEARNER/TEACHER (`migration.sql:1066–1077`) with its narrow role SELECT dependency. Tests now exercise own/foreign/nonactive account locks, Admin target roles, representative published lesson/item locks, assessment/course/context locks, genuine RLS UPDATE denial and runtime SET ROLE denial. The previously identified unconditional media branch and arbitrary-account helper remain removed; protected reads require ACTIVE account lookup. These source improvements resolve the particular A3-R4 target-role defect, subject to the remaining acceptance evidence gaps below.

The remaining named MediaAsset FK map and fifteen database updated_at defaults are corrected. The second provider FK is inventoried. Bootstrap now checks memberships recursively for all thirteen LOGIN/NOLOGIN roles, preserving the explicit setup-owner grants; direct runtime and NOLOGIN-owner membership regressions are present. Final-component no-follow descriptor reads, strict credential record keys/tokens, early dangling-link detection and exclusive temporary-file replacement improve storage safety. They do not resolve all R3/R5/R6 MUST conditions.

## Residual blockers

### A3-R1 — Execution binding, fresh-run proof and required observations remain incomplete

**Acceptance:** RP-06, with RP-01–05/07 evidence. **Locations:** repair `test-run.log:59–114,149–171`, `delivery-record.md:11,34–41`, `execution-projections.json:3–6,20–38,155–190`; `a3-database.test.mjs:70–99,122–130,1067–1162,1187–1189,1447–1463,1465–1589`; lifecycle `:199–209`.

The count-only scaffold output is consistent with twenty-one test declarations. However the detailed child listing is again attributed to child stdout without an executed capture command or capture mechanism; unchanged `scaffolds/runner-base.mjs:188–210` consumes that output and emits only counts. Delivery line 36 says no fabricated child listing while the log supplies this unexplained listing. It cannot establish acceptance independently.

The new JSON writer is real and saves validate/generate/status stdout and exits, PostgreSQL version/checksum, role attributes and selected security results. Actual successful **deploy** stdout/stderr/exit is still discarded by setup, and no command stderr, command start/end/cwd or provider version/result is saved in the projections. There is no queried grant/EXECUTE/search_path/policy projection. Parity still saves counts, not the normalized catalog rows required by RP-04. Execution-time hashing omits connected harness state, and there is no in-suite final hash comparison; the log's post table omits the interface and all harness state despite claiming complete zero drift.

Provenance is contradictory: final owner metadata names stack **`lingora-wp00-32164eec`**, whereas delivery/log/cleanup name **`lingora-wp00-50d2bb20`**. The instance ID `66d43dc6…` and destruction timestamp do match. The projection records `instance_id` as the run ID and `stack_name: null`, because the source reads nonexistent context properties instead of `stackId`/`stackName`. Its migration `finished_at` is **05:46:44.219Z**, before the claimed guarded suite start **06:01:00.724Z**. Thus that suite ran on an already migrated target; no captured preceding guarded execution accounts for that apply or proves final-source fresh provisioning. A PROVISIONED cache result does not establish a fresh database.

Required test proof is still narrower than the report: protected item/assessment/media do not each exercise the stated PENDING/DISABLED matrix, the learning-context negative accepts unrelated `P2003`/generic violations and lacks the claimed PENDING/DISABLED INSERT cases, and private-write proof covers provisioning only, not receipt forgery/activation. Bootstrap instrumentation records only connection denials; there are no private read/write counters, and its positive control uses uninstrumented `ctx`, so the same counter is never shown reachable. State-file preflight, foreign UID/type, parent-replacement and transitive-owner-membership regression observations are absent. These are prior RP-06 residuals, not later A2 pooling requirements.

**Acceptance evidence still missing:** genuine final-source fresh lifecycle and command/result binding, accurate provenance/capture labels, full required projections and the specified boundary/negative observations. No reviewer rerun or additional correction is authorized.

### A3-R3 — READY authority still does not bind the actual incarnation or catalog/credential validity

**Acceptance:** RP-02/RP-06. **Locations:** `fixture-lifecycle.mjs:81,117–184,192–194,211–242`; `test-context.mjs:302–307`; tests `:2006–2064`; repair interface `:18–27`.

`stackIncarnation = testContext.instanceId || testContext.metadata?.instance_id || testContext.runId` falls back to **runId for every real accepted context**; that context supplies `stackId`, not either inspected property. The saved projection confirms this fallback. Replacing the stack incarnation under the same run therefore does not invalidate READY as claimed.

Catalog validation checks twenty table names and the saved migration checksum only. Dropping/changing a column, FK, policy or grant while preserving table names and `_prisma_migrations` still returns CACHED. The live checksum is compared to the cached value, not directly to the current migration source. Credential validity means JSON shape/token/digest, not that those credentials still authenticate or retain the expected catalog authority; a password changed only in PostgreSQL is invisible to the cache. These are the stale/different-source/catalog/credential cases RP-02 expressly excludes. TC-04-12 tampers state fields/table-name strings, not actual catalog or credentials, and cannot prove those conditions.

**Acceptance evidence still missing:** an authoritative cache bound to actual stack identity and the required source/catalog/usable-credential validity, or removal of cached authority, with corresponding genuine focused observations. The current executable interface overstates that guarantee.

### A3-R5 — Complete representable source/catalog parity is still not performed

**Acceptance:** RP-04/RP-06. **Locations:** `a3-database.test.mjs:612–761`; `execution-projections.json:185–190`; delivery `:82–85`; manifest `sql_only_objects_inventory`.

The named source mismatches are fixed, but the mandatory full comparison is absent. TC-03-09 fetches all 250 columns then checks updated_at/created_at/default arrays and a few schema regexes. It never derives the baseline's complete mapped scalar-column set or compares each native type, nullability and representable default against catalog. It selects sixty FKs but checks only six, comparing their source/target tuples and only selected actions/MATCH properties; it does not derive and compare every Prisma relation/name/action/MATCH tuple. Counts and handpicked assertions do not establish full parity, as the first repair review already explained.

The inventory adds the missing provider FK but still names only three individual CHECKs; many retained custom CHECKs have no individual or grouped ownership entry. The projection records only inventory count, not a complete SQL-only ownership comparison. The delivery's “all foreign keys” and “full normalized baseline” claims exceed the actual assertions.

**Acceptance evidence still missing:** the complete retained baseline normalized source/catalog column/relation comparison and accurate SQL-only inventory/projection required by RP-04. This is baseline parity, not AC-09 replay/delta work.

### A3-R6 — State/credential entrypoint preflight and parent-race safety remain incomplete; historical cleanup execution is unproved

**Acceptance:** RP-05/RP-06/RP-07. **Locations:** `fixture-lifecycle.mjs:73–84,100–158,187–188,227,247–262,296–309`; `bootstrap-cluster.mjs:61–139,207–219,410–428,455–465`; `prisma-helper.mjs:319–331`; tests `:1067–1162`; repair interface `:106–108`; cleanup observations §§2–4.

Setup preflights only path metadata, **then connects at line 84 before reading/parsing either state or credential record**. Malformed/extra-key credential JSON therefore reaches a DB connection before eventual bootstrap rejection, and malformed state is swallowed as a cache miss and reprovisioned. The actual bootstrap entrypoint now correctly rejects the tested dangling credential link before connection, but that does not establish the same required boundary for the exported setup lifecycle/state authority.

No-follow protects final components only. Paths are still checked with lstat and later opened/renamed/unlinked through mutable absolute parent paths; no directory descriptor anchors these operations. A checked parent/run directory can be replaced between validation and open/rename, redirecting same-UID 0600 credentials/state outside the intended directory. The validator checks components only from runDir downward, not ancestor symlinks/escaping parent resolution. Setup also reads credential content with unguarded `fs.readFileSync(credFile)` at line 227. Consequently the explicit parent/no-follow race-safe guarantee remains false despite safe temporary-file replacement of the final file. The interface additionally still describes the old O_TRUNC persistence implementation at lines 106–108.

Metadata reconciliation is improved: the legacy exact instance IDs/timestamps now agree with the actual receipts, and all twelve named A3 credential/state paths are currently absent. But the record expressly concedes the historical deletion commands/revalidation were uncaptured (UNPROVED), and the background allocation still lacks captured commands/results. Present absence cannot prove the RP-07 under-lock exact-tuple removal procedure. For the final run, source after-hook order supports disconnect then cleanup, but its cleanup result is not saved; the lstat statements are narrative output without a captured execution command, and stack provenance differs as described in R1. Tombstones alone establish recorded destruction, not file-disposal execution.

**Acceptance evidence still missing:** all exported entrypoint record preflight before DB construction/connection, race-safe anchored private-path handling and actual reachable I/O-counter observations, plus truthful exact cleanup execution/provenance. Already absent paths must remain absent; no recreation, historical reconnect or re-destruction is warranted.

## Exact metadata-only cleanup postconditions

All six run directories were non-symlink UID1000/mode0700; owner records were regular UID1000/mode0600. All had matching exact run/control_root/workdir/home paths, config digest `a9067406c77c9e0b4a43f6e96cbb5d19f2b9e85dc1c3f461ee7a7cec3de190e9`, CLI2.121.0, phase DESTROYED, tombstone=true, pending_operation=null. Both `runtime-credentials.json` and `a3-baseline-state.json` were absent by lstat/ENOENT in each exact directory.

| Exact run | Actual instance ID | Actual destroyed_at |
|---|---|---|
| run-6e06a876bbd1c498 | d1793d4c84b5a9c7dd0c4ee10f619e57f398b677ca22fa5a265b035d08b9fcee | 2026-10-26T02:56:58.296Z |
| run-3256c3b16f733619 | 5a0adfe1f1937c78562f72a577f130d3461a333a289a6868bfe3fe4c630a3ccd | 2026-10-26T02:59:41.900Z |
| run-3be6d5ff41229fac | dee2fbc0e119e37b92bbf4fe0673140b3bf0c3d0120ae2c556ba8b639df6e141 | 2026-10-26T03:33:02.598Z |
| run-dba39f772e58027a | 98fb309b7995bc3648e1c572d0349ab23bc7063383074059cf1dcee1ff8e6d72 | 2026-10-26T05:12:00.473Z |
| run-dca84591a0dbc8f5 | 2c33fce89e8865f9238d9a0d18150868f587ce5f1628febad355428ea452f4f4 | 2026-10-26T05:18:53.974Z |
| run-bcdc41a8b995232f | 66d43dc6bf0d397801ab3c94b3d7ec0c23977d023206fb881b8e2c146e9bf16b | 2026-10-26T06:01:43.646Z |

The corrected historical metadata and current absence are accepted as those limited postconditions. They do not repair lost execution proof or the remaining source defects. **Final verdict: FAIL / STOP; A3-R1, A3-R3, A3-R5 and A3-R6 remain blocking after round 1/1.**

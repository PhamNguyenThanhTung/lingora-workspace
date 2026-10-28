# Codex final review — G0-minimal

2026-10-25 · **G0 ACCEPTED / WP-00 CLOSED** after correction 1/1. G1 NOT EXECUTED. No P1/P2 dispatch.

Authority: [scope-reduction review](../../wp00-g0-scope-reduction-review-2026-10-25.md) ten criteria, D0 facts and unchanged baseline safety; [bounded execution spec](../../../../../plans/2026-10-25-wp00-g0-final-repair-spec.md). No SHOULD requirement was returned to the gate.

## Review basis

Codex reviewed actual entry-relative `delivery-1.diff` and `final.diff`, connected guard/manager/scaffold paths and relevant assertions, worker commands/cwd/exit/output, exact tested-source and binary hashes, and selected local metadata. The entire source tree is already dirty/untracked at entry; Git diff alone does not represent the worker's six-file delta. Entry-source snapshots preserve that distinction. No Codex implementation, test rerun, provider CLI, production/live access, commit or push.

Correction changed two pending diagnostic strings, added public pending-canary regressions, and fixed fixture directory permissions. Manager and native test hashes are identical to delivery 1. Control/data/termination behavior is unchanged by correction. The previous provider-service interpolation defect was fixed in initial delivery; the new raw pending echo found in review 1 is now fixed too.

| Criterion | Final verdict | Concrete basis |
|---|---|---|
| **M01 Isolation** | **PASS** | Production main rejects both --runs-dir syntaxes before dispatch, cannot pass arbitrary root to lifecycle methods. Test 16b rejects custom namespace; trusted test bootstrap is internal. Existing fresh private HOME/SUPABASE_HOME/config-only fixture and clean pinned child environment retained. |
| **M02 Intent** | **PASS** | Persistence/fsync/intent-before-effect logic unchanged from accepted proof. P01/F2 cover durable record at dispatch and failed required persistence with zero provider effects. Carry remains valid. |
| **M03 Exact target** | **PASS** | Post-prepare same-ID count precedes tuple validation; conflicting/duplicate candidate rejection cannot hide behind filtering. F6 denies before start, existing stale/tuple/incarnation tests retain zero mutation/data after safe inspection. Full ID alone remains insufficient. |
| **M04 Denial boundary** | **PASS** | Public start/status/stop/destroy/data/scaffold map to local validation and under-lock pending denial. Test 16b + N/F3 + scaffold cases establish no namespace/pending bypass and no data/destructive effects. Internal fake transports do not replace production guard/parser/locking. |
| **M05 Serialization** | **PASS** | F4 invokes actual probeDataReadiness, pauses inside end(), tests destroy while close is incomplete (LOCKED and zero provider effects), then resolves close and observes release. L01 adds a real competing child. No manual-lock substitute or orphan stealing. |
| **M06 Ambiguity** | **PASS** | Pending start/status/stop/destroy/shared data/scaffold deny under lock with same record retained, including pending destroy. Unknown/malformed provider outcome does not authorize allocation/adoption/retry/cleanup. Successful automated recovery is not required. |
| **M07 Termination** | **PASS** | Required PID reads distinguish non-ENOENT UNKNOWN from confirmed absence; owner-file UNKNOWN contributes to failed observation. F5/F5b demonstrate nonzero/zero deletion and retained recovery state; native R01 observes actual normal stop/destroy. Full-host forensic completeness is deferred. |
| **M08 Data** | **PASS** | Initial/existing start and public/scaffold paths share live reconciled/locked authorization, typed SQL and fixed HTTP targets. Negative live/endpoint checks and through-close case assert target/effects; real initial/resume SQL health confirms production transport usage. |
| **M09 Safe output** | **PASS** | Pending messages now static, code/disposition retained. F7b invokes statusStack in an actual child and captures both public streams; scaffold 6 captures the real public logging callbacks, asserts nonzero/RECOVERY_REQUIRED, zero CLI/PG/test-executor calls and retained pending authority. Unregistered canaries are asserted absent, never printed into shared logs. Existing stdout/stderr/malformed/data/failed-teardown sink proofs remain; no exhaustive cross-product added. |
| **M10 Native proof** | **PASS** | Delivery-1 R01 ran on repaired normal lifecycle: fresh create/SQL/Auth/Storage/mail → status → stop → existing same-ID/member-map start through data path → stop → destroy. Exact-target postchecks and tombstone/idempotent cleanup assertions passed. Correction only changes denied diagnostics and tests; carry to final source is behavior-bound, not a timestamp claim. |

## Observed checks and source binding

Antigravity executed the commands below, all from `/home/tung/workspace/school/project1/lingora-workspace`, using `/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test`:

| Argument | Exit / observed output | Evidence |
|---|---|---|
| lingora-admin/tests/database/env/test-env-guard.mjs | 0; 37 pass, 0 fail, including F3/F4/F5/F5b/F6/F7/F7b | worker/correction-1/logs/guard.log |
| lingora-admin/tests/database/scaffolds/test-scaffold-behavior.mjs | 0; 6 pass, 0 fail, including actual pending denial and safe sinks | worker/correction-1/logs/scaffold.log |
| lingora-admin/tests/database/env/test-lifecycle-and-readiness.mjs | 0; 1 pass, 0 fail, 240161.6ms; carried across diagnostic-only correction | worker/logs/lifecycle-readiness.log |

Test counts and exit codes summarize execution; code and side-effect assertions establish acceptance. All six final source hashes, CLI binary and Node binary independently matched worker/correction-1/checks.json. Native copied log is byte-identical to the original; use the original log as canonical proof, not two independent runs. Manager/native-test hashes did not change in correction; only two failure diagnostics changed in guard/scaffold. Root/admin manifests, lockfile, provider config, dependency/provenance verifiers and .gitignore match entry hashes. Historical clean install and limited parity proofs carry only within the scope specified by the scope-reduction review, not as database/runtime deployment evidence.

## Native state, limits and remaining dependencies

Accepted R01: run-114b6d3f60299bc0; stack lingora-wp00-d39a8f44; full ID fca5123f10909dc0bd02228ce011b3bf85cd72cd5a37a69a987c399c66d787ec. Log assertions establish absent registry/native state, zero observed owned processes and quiet target ports after destroy. Selected read-only metadata also shows DESTROYED receipt, no credentials or member-map. Caches/tombstones remain; no claim of complete host erasure.

Earlier allocation run-823006cc1b9e0057 is RESERVED/pending prepare with no credentials. Its record is retained and **RECOVERY_REQUIRED**. Codex does not accept worker wording “daemon terminated cleanly” as verified provider quiescence. No further mutation/adoption/deletion is authorized for that context. Retention and denial satisfy the minimal ambiguity contract; successful crash recovery remains deferred.

G0 proves a safe disposable harness, not Auth provisioning, restricted runtime RLS, migration workflow, full schema, application completeness or live readiness. A2's selected session-pooler transport is still disabled/unproved, with no direct-PG substitution. A1/A2/A3 remain unexecuted; [next execution plan](../../../../../plans/2026-10-25-p1-a1-a2-a3-execution-plan.md) decomposes prerequisites and ownership. No design/architecture/product/security/pooler contract changed.

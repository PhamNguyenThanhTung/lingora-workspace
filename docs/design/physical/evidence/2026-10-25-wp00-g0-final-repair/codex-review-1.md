# Codex review 1 — final bounded repair

2026-10-25. Verdict: one focused correction required; G0 NOT ACCEPTED yet. Scope is the existing ten minimal criteria, not the old D1/D2 matrix. Reviewed entry-relative `delivery-1.diff`, six changed sources/tests, worker commands and saved output, tested hashes and selected local record metadata. Codex did not implement or rerun tests/provider commands.

| Criterion | Verdict | Evidence / defect |
|---|---|---|
| M01 | PASS | CLI parsing rejects both --runs-dir forms before dispatch; test 16b and trusted internal L01 bootstrap; isolated home/fixture unchanged. |
| M02 | PASS | Carry: intent persistence/fsync/order unchanged; F2 also remains in passing guard output. No timestamp-only reinstall/parity rerun. |
| M03 | PASS | Initial same-ID candidates counted before tuple validation; F6 rejects before start. Existing full-ID, tuple and initialized member-map checks remain. |
| M04 | PASS | Namespace rejection and common under-lock pending denial precede provider/data effects; F3 and scaffold 5 assert zero effects and retained authority. |
| M05 | PASS | F4 now pauses actual probeDataReadiness in client.end(), attempts destroy while close incomplete, asserts LOCKED/zero destroy calls, then releases close and observes lock removal. L01 separately exercises actual process contention. |
| M06 | PASS | Start/status/stop/destroy/data/scaffold all deny unresolved pending state; retained same intent, no adoption/allocation/cleanup. |
| M07 | PASS | Required known-PID read error now UNKNOWN; confirmed ENOENT required for absence. F5/F5b retain recovery state on unknown required observations; normal native teardown additionally observed. No full-host forensic requirement added. |
| M08 | PASS | Shared locked live reconciliation path used for initial/existing readiness and public/scaffold data; F4 through-close and native initial/resume probes support it. |
| M09 | OPEN | Prior provider-service echo is fixed and F7 reaches a real public child sink. However new assertNoPendingOperation at env-guard.mjs:1211 interpolates unchecked authority.pending_operation into a public library exception, and runner-base.mjs:102 directly sends it to errFn (default console.error). validateAuthorityRecord carries arbitrary truthy pending values through at env-guard.mjs:1069. Thus a malformed recovery record with an unregistered secret canary in pending_operation is rejected safely for effects but still leaks its raw content through normal output. Make the denial diagnostic finite/static while retaining RECOVERY_REQUIRED; prove this one reachable public sink. No exhaustive cross-product required. |
| M10 | PASS | Directly affected native lifecycle justified one fresh R01. Saved exit0 log asserts real SQL/Auth/Storage/mail, initial and existing start with stable full ID/member map, stop/destroy and exact-target postconditions. Current run-114b6d3f60299bc0 has DESTROYED receipt and no credentials/member-map. |

Worker commands: scaffold suite exit0 (5 tests), guard suite exit0 (36), real native R01 exit0 (1). Counts are summaries only; assertions and source establish the properties. Source and pinned binary hashes matched the delivery checks. Manifests/config/verifiers remain unchanged from entry; historical clean-install/parity carry within their original scope.

Failed first allocation run-823006cc1b9e0057 remains RESERVED/pending prepare with no credentials. Treat its provider outcome as RECOVERY_REQUIRED; do not infer quiescence from the worker's phrase “daemon terminated cleanly.” Its retained record is quarantine/recovery authority, not an accepted teardown. No requirement for automatic crash recovery is added to G0.

## Correction 1/1

Only M09 above remains open. Replace raw pending-value echoes with finite diagnostics, keep the denial/effect/retention contracts, and add one unregistered pending canary reaching the actual public scaffold or public library sink, asserting no stdout/stderr/shared evidence leak and zero provider/data/test-executor effects. Rerun affected fake/unit suites, save exact commands/exit/output and updated hashes. Preserve initial delivery evidence. M02 and this delivery's M10 may carry across a diagnostic-only correction; no new native lifecycle solely for timestamp. If further normal-path changes invalidate that claim, explain and test only what changed. No other acceptance expansion.

# Codex pre-dispatch review — new repair package

2026-10-25. Authorization: current owner explicitly requested a new WP-00/G0 repair execution package. The Oct22 STOP after correction 1/1 remains valid and its evidence is not overwritten. New correction budget: 0/1 requested.

Inspected actual repository status, existing manager/guard/scaffolds/tests, dependency/provenance scripts, provider config, old review 2 and runtime evidence. HEAD c39806c is not a clean implementation baseline: entry-state.json and before copies preserve actual dirty input. No database or provider lifecycle command was run by Codex.

Minimum repair from review 2 is necessary but needs these concrete constraints:

- A nonempty ID, two copies of the same ID, or a matching loopback port cannot prove ownership. Native selection is project-root/branch/name dependent. The installed pinned CLI's readonly help confirms exact --workdir and --stack-id, and prepare registration before service start. Fresh private root + native registry reconciliation + full-ID addressing can implement this without changing database architecture.
- Negative assertions must sit around actual lifecycle/data adapters, including first/repeated start and failed teardown. The old counter and scaffold invented ID do not qualify. Distinguish invalid local binding (zero adapters) from a mismatching provider inspection (inspection only, no action/data).
- Real npm ci must occur in a new dependency tree with private config/cache and local binary resolution. Existing node_modules version output and dry-run are insufficient.
- Malformed output is a failure with finite safe diagnostics; generic regex redaction followed by dumping an unknown provider string remains unsafe. Canary evidence must cover manager paths and command exit behavior.
- Prior parity can be carried forward only if prior proof, original tested inputs, source and output bytes are bound and match; retain title-dash normalization/stale-manifest limitations. Hash inventory does not itself prove parity.

Ownership/dependencies/acceptance are formalized in plans/2026-10-25-wp00-g0-repair-spec.md. A single worker owns implementation/tests because guard, manager and test interface edits overlap. Clean-install and provenance slices are logically independent/file-disjoint but need no extra worker. All native lifecycle integration runs are sequential on new package-owned resources.

No PO or architecture decision is required. Session-pooler availability is a future A2 dependency; direct PostgreSQL readiness cannot replace it. A1/A2/A3 and P2 remain prohibited. Codex will review worker diff, assertions, exact check metadata/output and safe provider-state observations without taking over implementation or rerunning worker checks.

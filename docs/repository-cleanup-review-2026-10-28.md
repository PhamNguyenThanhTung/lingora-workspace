# Independent documentation cleanup review — FAIL

2026-10-28 · Reviewer: GPT-6.1 Sol High · Package: `DOC-CLEAN-01`.

Reviewed the original cleanup spec (DC-01–05), retained documents and technical consumers, tracked/staged diffs, untracked product foundation and relevant worker tool events. Compared current Git metadata with `/tmp/lingora-doc-cleanup-baseline-20261028*`. Existing user edits, including staged scratch relocation and prior source/modeling changes, are not findings against this package. This review changed only this artifact; it ran no application/database tests, npm, services or network operations.

## Required corrections

### DC-R1 — Current entry documents still prescribe the retired gates and describe an obsolete checkout

**Acceptance:** DC-02, DC-03, DC-05; explicit spec requirement to simplify current entry documents, rather than prepend warnings. **Owner:** DOC-CLEAN-01. **Priority:** P2.

The requested current-entry cleanup is materially incomplete. `docs/README.md:7–17` and `docs/QUICK-REF.md:5–17` retain the accumulated STOP/READY/G0/A1/A2/A3 status chain, including “app implementation stays pending READY” and A1 AND A2 AND A3 before broad implementation. `docs/README.md:79` still says design review must precede any application change. These remain operational instructions even though the new top notice says they are historical. `docs/QUICK-REF.md:31–38`, under **What actually exists / Verified repository state**, still describes the Admin/database primarily as the A3 fixture and a proposed 34-table design, omitting the current 34-model product schema, four product migrations, seed and DB module. `docs/README.md:38–40` also mixes the removed legacy implementation with current source status and calls a deleted archived master plan a retained reference.

The same retired sequencing remains foregrounded in current supporting entry documents: `docs/design/physical/rebuild-plan.md:3` explicitly gates broad implementation on A1/A2/A3, and `docs/design/physical/ftr-disposition-2026-10-22.md:13` still presents that gate as controlling execution. The physical README's opening status stack also ends with app implementation pending READY (`docs/design/physical/README.md:1`). These are precisely the remnants the original spec requires resolving, not new implementation requirements imposed by this review.

**Resolution/evidence:** Replace the contradictory entry/status chains with a concise current foundation/proposed-slice/parked-harness summary and topic authority links. Preserve useful technical contracts and dated evidence in their existing locations, with clear historical scope, while retiring their execution-gate language in current navigation. Do not assert full database readiness or fix source. Inspect affected entry pages and record the targeted current-link/fragment checks after editing.

### DC-R2 — Required residual evidence gaps disappear from the cleanup report

**Acceptance:** DC-02, DC-05; spec “Targeted reference repairs and useful unfinished work,” items 2–3. **Owner:** DOC-CLEAN-01. **Priority:** P2.

`docs/repository-cleanup-2026-10-28.md:84–93` preserves FDB-05/06 and several smoke/replay concerns, but omits **FDB-09's incomplete full seed-record/timestamp idempotency evidence** and **FDB-10's missing applicable global/per-schema default-ACL inventory**. The retained remediation review explicitly distinguishes those evidence gaps from a broken seed or observed permission leak. The spec explicitly requires carrying that distinction into this report before removing the repair plans; merely linking the old review does not supply the promised concise open-item summary.

The FDB-06 summary also needs to retain the separate version envelope/catalog correspondence issue, rather than mentioning only review-assignment equality and a generic schema-version caveat. Source inspection confirms `20261027030000_product_remediation/migration.sql:329–382` checks Lesson pins conditionally without checking the review row's own generation/snapshot, and `:393–463` checks presence of version envelope fields without proving the required typed/catalog correspondence. For FDB-05, the parenthetical saying both omitted fields exist only in the DRAFT branch is inaccurate: the current else branch checks `created_at`, but neither branch compares `prior_revision_id` (`:294–319`).

**Resolution/evidence:** Add a few accurately qualified sentences covering FDB-09/10 and FDB-06's version/catalog gap, and correct the FDB-05 parenthetical. Cite the existing remediation review. State these as retained source/evidence limitations, without claiming fresh live findings, scheduling a repair or restoring a global audit gate. No database checks or code changes are needed.

### DC-R3 — Report gives an unqualified passing verification result that the actual command did not produce

**Acceptance:** DC-05 (actual checks and limitations). **Owner:** DOC-CLEAN-01. **Priority:** P2.

`docs/repository-cleanup-2026-10-28.md:106` says `git diff --check` passed on the tracked edited text paths. Actual worker event 244 in `/tmp/lingora-doc-cleanup-20261028-agy-stream.jsonl` exited **2**, reporting trailing whitespace at `logs/development-log.md:3468,3470`. Event 247 and the passing event 277 excluded that edited log. The affected lines are preserved prior user history; this is not a request to normalize or remove them. The report currently does not disclose the exclusion/preexisting failure, so it overstates the check performed on the delivered dirty worktree.

The link-check report (`:107–110`) should likewise state its actual bounded result: event 259 reports 290 valid links and 11 unresolved links, including mapped historical removed-plan citations and preexisting Windows file URLs/`docs/plantuml/erd-mvp-learning.puml`. That is consistent with the allowed historical-link policy, but the report omits the requested preexisting-issue/check limitation classification. No whole-repository zero-link requirement applies.

**Resolution/evidence:** Correct the report to distinguish passing selected-path checks from the preserved preexisting development-log whitespace, identify the actual checked scope and unresolved-link classifications, and record the affected file/fragment checks requested by the spec. Do not clean historical log bytes to manufacture a global PASS, and do not run the legacy verifier suite.

## Verified work and acceptance disposition

- **DC-01: PASS.** Actual remaining sets match the exact exceptions: five root plans, six approved provenance inputs, archive README only, one research benchmark and three substantive logs. Worker deletion event 238 records 196 files / 2,393,874 bytes (18 root plans, 97 approved, 80 archive, one empty registry), consistent with the inspected before inventory and current sets. No replacement archive tree was introduced.
- **DC-02: correction required (DC-R1/R2).** Real ADRs and log history remain. Diff boundaries remove the blank ADR template, initial test placeholder/instruction and add brief notices; existing research/testing additions belong to the entry baseline. The development log's non-UTF8 content was detected before editing; worker records byte-preserving insertion. The remaining stored SQL risks and absent web/API/auth foundation were checked against source, not inferred from cancellation.
- **DC-03: correction required (DC-R1); bounded evidence qualification under DC-R3.** Representative deleted-plan navigation was repaired. The three retained baseline files match the dynamic readers in physical `verify.py`, `verify_final_review.py` and the native-parity tooling; A3's retained plan remains available to its exercised-file consumer. Historical citations may remain mapped. Contradictory current authority/sequencing instructions still need removal.
- **DC-04: supported.** Worker event 238 records the before/after in-memory byte/mode comparison for 191 protected files and identical `git ls-files --stage`. Current staged numstat independently matches the supplied entry metadata exactly. Protected tracked implementation/config/diagram/scratch numstats retain their entry values; the task delta visible in tracked metadata is confined to owned documentation/deletions. No source changes are requested by this review.
- **DC-05: correction required (DC-R1/R2/R3).** The Vietnamese report supplies deletion counts, keep reasons and successor mappings, but completion/status and verification claims require the bounded corrections above. Package JSON parse succeeded in actual tool events; no database or application test result is claimed for this cleanup.

**Verdict: FAIL — DC-R1, DC-R2, DC-R3.** One task-wide Antigravity correction round remains. Corrections belong to documentation and its affected non-mutating checks only.

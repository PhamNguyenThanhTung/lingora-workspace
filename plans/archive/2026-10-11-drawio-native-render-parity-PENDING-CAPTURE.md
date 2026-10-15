# All Diagram PUML Native draw.io Rendering Parity

**Status:** IMPLEMENTING — applying the user-approved exclusion of deferred ACT-05 from the primary native draw.io deliverable; the existing task commit gate remains constrained by the output path's pre-existing untracked status.
**Date:** 2026-10-11
**Scope authorization:** User requested the entire 36-diagram PlantUML set render directly in draw.io with a layout visually close to the existing SVG reference. The user approved a presentation-only design that preserves diagram meaning and accepts small renderer differences in paths and coordinates. No product behavior or modeling decision is authorized to change.
**Request / design review:** User requested all 36 PUML diagrams render natively in draw.io like their SVG references. User approved the written spec and gave explicit plan approval (“ok làm đi”) on 2026-10-11. Approved immutable plan and request evidence: `plans/approved/2026-10-11-drawio-native-render-parity-APPROVED.md` and `plans/approved/2026-10-11-drawio-native-render-parity-REQUEST.txt`.
**Baseline:** Captured before converter or canonical diagram edits in `plans/approved/2026-10-11-drawio-native-render-parity-BASELINE.json`: 36 source inventories, 72 SVG/PNG hashes, 36 page identities, HEAD, index, and pre-existing changed paths. Canonical PUML semantics and references remain unchanged.

**User clarification (2026-10-11):** The final output must remain a native, individually editable draw.io diagram; an SVG object is not acceptable because it looks generated and is not convenient to edit. The user explicitly asked that the native diagram be arranged for readability after conversion. This selects the native deliverable and approves a presentation-only post-conversion mxGraph layout pass. Immutable amendment: `plans/approved/2026-10-11-drawio-native-cell-layout-APPROVED.md`; request evidence: `plans/approved/2026-10-11-drawio-native-cell-layout-REQUEST.txt`.

**User scope amendment (2026-10-11):** The user instructed that item/page 13, ACT-05 Reassessment, is outside scope and should be removed. The primary editable package now targets 35 active pages, while the 36 canonical source/render inventory and ACT-05 deferred traceability artifacts remain intact. Immutable approval/request evidence: `plans/approved/2026-10-11-drawio-exclude-deferred-act05-APPROVED.md` and `plans/approved/2026-10-11-drawio-exclude-deferred-act05-REQUEST.txt`.

## PLAN

**Goal:** Make the 35 active canonical PUML diagrams render clearly through draw.io's native PlantUML conversion and produce an editable 35-page `lingora-all-diagrams.drawio`, while retaining the approved semantic model and 36-source traceability baseline.

**Observed cause:** The existing canonical draw.io package embeds all 36 PUML sources and their exact corresponding SVG outputs (read-only comparison: 36 pages, zero PUML mismatches, zero SVG mismatches). The SVGs come from the local PlantUML/Graphviz renderer. The native draw.io build script strips `!include` lines before conversion, so shared `style.puml` settings are absent from native output; the two rendering engines also choose different geometry. Three builders currently target the same `.drawio` output path, so the approved native builder must be identified and alternate SVG export paths kept separate.

**Authority:** `docs/modeling/current-target/README.md`, its final modeling review, current approved ADR-030–036 semantics and user-approved presentation-only scope. Preserve the existing modeling verdict and historical review evidence. If a layout request requires changing a node, relationship, label, cardinality, branch, or authority claim, stop and route it for decision; do not infer product behavior.

**Dependencies:** 36 canonical source diagrams plus `style.puml`; local PlantUML renderer; bundled draw.io PlantUML converter in `scripts/vendor/drawio-plantuml.min.js`; current builders and validator; existing 36 SVG/PNG reference pairs and render manifest.

**Permitted writes after plan approval:**
- `docs/modeling/current-target/src/*.puml` and `style.puml` for presentation/layout only.
- `scripts/build_drawio_from_puml.js`, the SVG-backed builder scripts, and `scripts/validate_drawio.py` to resolve shared styles, give builders distinct output paths, and enforce native-page/source invariants.
- `docs/modeling/current-target/rendered/` SVG/PNG outputs and `render-manifest.json` when canonical sources change.
- `docs/modeling/current-target/lingora-all-diagrams.drawio` for the 36 native, editable pages carrying their source.
- The user-approved ACT-05 packaging amendment and synchronized builder/validator/verifier, primary output, 35-page preview evidence, and task records. Keep ACT-05's canonical PUML/render references as deferred traceability evidence.
- A new task-specific semantic/render verifier and visual-review evidence; relevant modeling README task/presentation pointers. Preserve the prior task verifier/output/final-review evidence as historical evidence.
- `plans/current-task.md`, approved request/baseline/snapshot and indexes, archive record/index, `HANDOFF.md`, the task pointer in `docs/QUICK-REF.md`, and append-only test/development logs.
- The new design spec is limited to the task-specific tooling/layout proposal; it does not alter product or logical modeling authority.

**Excluded:** Product/UC meaning, actors, use cases, entities, fields, messages, activities, transitions, cardinalities, role semantics, requirements, ADRs, application code, database/schema/migrations, dependency changes, draw.io vendor engine edits, unrelated workspace files, live integrations, staging unrelated changes, and history rewriting.

## REVIEW / APPROVE

- [x] Check the current-target modeling index and project source hierarchy; this task is strictly presentation/tooling and may not resolve product or modeling conflicts.
- [x] Search the open-decision sources for a renderer/layout decision; no active product decision applies to this presentation-only scope.
- [x] Compare all 36 embedded draw.io sources/SVGs with canonical PUML/rendered outputs; both inventories have zero mismatches. Identify include stripping and overlapping builder output paths as the native-render causes.
- [x] User explicitly approved the all-diagram native-render design and tolerance for minor engine geometry differences.
- [x] Self-review the written spec for placeholders, internal consistency, semantic boundaries, and scope.
- [x] Obtain the user's review of the written design spec; approval received in the current conversation on 2026-10-11.
- [x] Write and self-review the detailed implementation plan at `docs/superpowers/plans/2026-10-11-drawio-native-render-parity.md`.
- [x] Obtain/record approval of the implementation plan; user replied “ok làm đi” on 2026-10-11.
- [x] Save the immutable approved plan and request evidence before implementation.
- [x] Capture the approved task baseline before converter or canonical diagram changes.
- [x] Implement and exercise the shared-style resolver, native builder, native validator, and distinct SVG builder paths; preserve the four approved notation pilots.
- [x] Export UC-01, ACT-03, SEQ-01, DATA-03, and SYS-04 with draw.io Desktop 32.4.1 and compare them to the canonical SVGs.
- Initial converter-only review found layout gaps on UC-01, SYS-04, ACT-03, and DATA-03; see the historical pilot section of `docs/modeling/current-target/evidence/native-render-review.md`.
- The user selected native editable shapes and approved the readability pass. SVG references are read-only geometry guides and are not embedded in the final native diagram.
- [x] Implement a deterministic native mxGraph layout pass; change only positions, dimensions, edge routes/label offsets, and page bounds. Preserve cell IDs, labels, source/target references, PUML payloads, and semantics. Fail closed on ambiguous geometry mappings.
- [x] Export and visually review all 36 pages in draw.io Desktop 32.4.1, fix layout-only defects, and capture page-by-page evidence.
- [x] Review the new scope instruction against ADR-036; record the bounded exclusion as an immutable approved amendment before implementation.

## IMPLEMENT / TEST / LOG / COMMIT

1. [x] Establish a machine-readable baseline for all 36 diagrams: normalized semantic declarations, source hashes, existing SVG/PNG hashes, draw.io page identities, HEAD and index state.
2. [x] Pilot native conversion on the approved diagram families, resolve safe shared-style expansion, and review the actual draw.io exports.
3. [x] User clarified that native editable diagrams are required and authorized the layout cleanup; approved amendment and request evidence are saved before implementation.
4. [x] Complete native geometry normalization, rebuild the original 36-page set, export/review it, and verify source/cell semantic preservation.
5. [ ] Exclude deferred ACT-05 from the primary package; validate the exact 35-page active set and refresh preview evidence while preserving the immutable 36-source baseline.
6. [ ] Commit only the approved task scope with a Conventional Commit after TEST and LOG gates pass. Do not amend/reset/rewrite history.

## Acceptance / verification

- All 35 active PUML sources convert through the native draw.io engine without parse errors and yield 35 named editable pages with embedded PUML; ACT-05 is absent from this package.
- The native draw.io layouts align with their current SVG references in diagram direction, grouping, hierarchy, compactness, and readability; small renderer-specific path/coordinate differences are acceptable.
- All 36 canonical source semantic inventories match their baseline; no source authority or accepted modeling verdict changes. The primary output includes only the 35 active source identities.
- All canonical SVG/PNG and draw.io outputs match the final source/build; no stale or orphan render output.
- Existing unrelated file contents, the existing Git index, and pre-task HEAD remain unchanged until the final scoped commit.

**Verification commands (final commands to be confirmed in the approved Test Plan):**
- `py -3.13 docs/modeling/current-target/render.py`
- `node scripts/build_drawio_from_puml.js`
- `py -3.13 scripts/validate_drawio.py`
- New task-specific semantic/render verifier, per-diagram visual review record, `git diff --check`, task baseline and scope checks. The prior modeling verifier remains unchanged as historical task evidence.

**Implementation result before the ACT-05 amendment:** `lingora-all-diagrams.drawio` was rebuilt from the 36 canonical PUML sources. The layout pass transfers matched SVG relationship routes to native mxGraph edges and positions/dimensions to native cells; it also maps actor glyph identities so actor-to-use-case associations use the reference paths. The original file had 36 ordered pages, 2,115 mxCells, 2,043 editable vertices/edges, and no SVG image cells. Its page exports, hashes, and contact sheets are the pre-amendment evidence. All 36 semantic inventories and PUML payloads matched the baseline.

**Current gate:** `TESTING — implementation, verification, visual review, and logs are complete; commit remains pending`. The approved plan's commit step says not to include a pre-existing overlapping path when a clean task-only delta cannot be staged. The canonical `.drawio` output was already untracked at baseline and is the delivered artifact, so it cannot be added without user direction. Preserve the initial HEAD/index and unrelated worktree state. The repository-wide modeling verifier still has its pre-existing canonical-file-count conflict from `docs/design/physical/physical-erd.puml`; all task-specific semantic, render, page, and layout checks pass. No product or model decision is open.

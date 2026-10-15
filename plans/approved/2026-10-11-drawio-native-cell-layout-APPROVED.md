# Native draw.io Render Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Track each step with the checkboxes below.

**Goal:** Make all 36 canonical Lingora PlantUML diagrams render as readable, individually editable native draw.io shapes, while preserving the accepted diagram semantics.

**Architecture:** Keep the canonical PUML and local Graphviz SVG/PNG renderer. Resolve only the shared local `style.puml` include before passing each standalone source to draw.io's bundled native converter. Then run a deterministic native-cell layout pass that repositions the converter's existing mxGraph cells using current PlantUML renders as geometry references only. The final `lingora-all-diagrams.drawio` contains native draw.io shapes and connectors, never an SVG diagram object. SVG-backed builders remain separate comparison alternatives, not the requested deliverable. A task verifier checks source inventories, page/source identity, outputs, and pre-existing Git state.

**Tech Stack:** PlantUML source, bundled draw.io `mxPlantUmlToDrawio`, Node.js, Python 3.13, XML, existing local PlantUML/Graphviz renderer.

**Spec:** [2026-10-11-drawio-native-render-parity-design.md](../specs/2026-10-11-drawio-native-render-parity-design.md)

## Global Constraints

- Change presentation and conversion tooling only. Preserve IDs, names, actors, nodes, labels, relationships, directions of business flow, branches, messages, states, entities, fields, cardinalities, and authority claims.
- Keep `docs/modeling/current-target/lingora-all-diagrams.drawio` as the native editable deliverable with 36 ordered pages. Do not edit the vendored draw.io converter or add dependencies.
- Resolve only the repository-local `../style.puml` include. Reject any unexpected or external include with its source filename and include text in the error.
- Preserve initial HEAD, existing index, and all pre-existing worktree contents. Never stage unrelated files or silently overwrite pre-existing generated artifacts.
- If the bundled converter produces a readability gap, correct native cell geometry after conversion; reference SVGs may guide positions and routes but must not be embedded in the final diagram. If a correction requires changing semantic declarations or editing the vendored converter, stop that item and record the reason.

## User Clarification Amendment — 2026-10-11

The user clarified that the final deliverable must remain a native draw.io diagram because an SVG object looks generated and cannot be edited as individual diagram shapes. The user requests that the native shapes be arranged for readability after conversion. This resolves the earlier primary-output choice in favor of the native 36-page file. The SVG-backed file remains a separate comparison artifact only.

This amendment extends the presentation-only implementation approach to a deterministic post-conversion mxGraph geometry pass. The pass may change native vertex/group positions and sizes, native edge routes/label offsets, title placement, and page bounds. It must preserve cell identities, labels, source/target references, PUML edit payloads, and semantic declarations. The final page must contain native cells and no SVG image object.

---

## Task 1 — Capture the approved task baseline

**Files:**
- Create `plans/approved/2026-10-11-drawio-native-render-parity-APPROVED.md` as an immutable copy of the user-approved plan.
- Create `plans/approved/2026-10-11-drawio-native-render-parity-REQUEST.txt` with the user request and plan approval evidence.
- Create `plans/approved/2026-10-11-drawio-native-render-parity-BASELINE.json`.
- Update `plans/approved/README.md` to point to the immutable plan and request evidence.
- Add `scripts/verify_drawio_native_parity.py` with a baseline-capture mode and deterministic source normalizer.

**Interfaces:**
- `capture_baseline(root: Path) -> dict`: returns baseline version/date, HEAD SHA, sorted index-entry digest, pre-existing Git status and file-state digest, 36 source/style hashes, 72 SVG/PNG hashes, render-manifest hash, ordered draw.io page IDs/names, and one ordered normalized semantic-line inventory per diagram.
- `semantic_inventory(source: str) -> list[str]`: removes only comments, PlantUML wrappers, the shared include line, recognized renderer/style directives, recognized layout-only directives, and hidden presentation links; retains remaining nonblank source lines in order so labels and directed business declarations are compared exactly.
- `--capture-baseline PATH`: writes stable, sorted UTF-8 JSON and exits nonzero unless all expected 36 source/page/render identities are present and unique.
- `resolvePumlSource(sourcePath: string, pumlDir: string) -> { rawSource: string, expandedSource: string }`: consumes a canonical file in `src/`, permits the exact `!include ../style.puml` resolving to sibling `current-target/style.puml`, and returns original plus wrapper-free expanded source.
- `convertPumlToXml(sourcePath: string, pumlDir: string, converter: object) -> { rawSource: string, expandedSource: string, wrappedXml: string }`: parses the expanded source and stores that same standalone source in the edit payload.

**Steps:**

- [ ] **Step 1: Save the user-approved immutable plan and request evidence.** Copy this approved plan verbatim to `plans/approved/2026-10-11-drawio-native-render-parity-APPROVED.md`; record the Vietnamese user request and approval of the spec and plan in `plans/approved/2026-10-11-drawio-native-render-parity-REQUEST.txt`; list both in `plans/approved/README.md`. Do not edit these snapshots after saving them.
- [ ] **Step 2: Add a failing normalizer fixture.** In `scripts/test_drawio_native_parity.py`, add:

  ```python
  source = """@startuml\nskinparam shadowing false\nleft to right direction\nA --> B : approved\nif (ready?) then (yes)\nEntity ||--o{ Record\n@enduml\n"""
  self.assertEqual(["A --> B : approved", "if (ready?) then (yes)", "Entity ||--o{ Record"], semantic_inventory(source))
  ```

  Include separate assertions that comments, the exact shared include line, known style directives, known direction directives, and hidden links are omitted.
- [ ] **Step 3: Run the fixture and record the expected initial failure.**

  Run: `py -3.13 scripts/test_drawio_native_parity.py -v`

  Expected before implementation: nonzero because `scripts.verify_drawio_native_parity.semantic_inventory` does not yet exist.
- [ ] **Step 4: Implement the normalizer and baseline capture.** Import `semantic_inventory` in the test and implement its ordered filter:

  ```python
  def semantic_inventory(source: str) -> list[str]:
      kept = []
      for raw_line in source.splitlines():
          line = raw_line.strip()
          if not line or line.startswith("'") or line in {"@startuml", "@enduml", "!include ../style.puml"}:
              continue
          if re.match(r"^(skinparam\b|left to right direction$|top to bottom direction$|!pragma layout\b)", line):
              continue
          if re.search(r"-{1,2}\s*\[hidden\]\s*-{1,2}", line):
              continue
          kept.append(line)
      return kept
  ```

  Serialize inventories by canonical filename. Bind Git state using read-only `git rev-parse HEAD`, sorted `git ls-files --stage` entries, and `git status --short --untracked-files=all`; hash current content for pre-existing changed/untracked files without changing the index.
- [ ] **Step 5: Run baseline-normalizer tests.**

  Run: `py -3.13 scripts/test_drawio_native_parity.py -v`

  Expected: every normalizer test passes; the test does not create or mutate modeling sources.
- [ ] **Step 6: Capture and inspect the immutable baseline.**

  Run: `py -3.13 scripts/verify_drawio_native_parity.py --capture-baseline plans/approved/2026-10-11-drawio-native-render-parity-BASELINE.json`

  Expected: exit 0, 36 source inventories, 72 reference-render hashes, and 36 unique ordered page identities. Save the exact initial HEAD and index digest in the baseline.

## Task 2 — Resolve shared style and test standalone conversion

**Files:**
- Modify `scripts/build_drawio_from_puml.js`.
- Create `scripts/test_drawio_from_puml.js`.

**Interfaces:**
- `resolvePumlSource(sourcePath, pumlDir) -> { rawSource, expandedSource }`: reads the canonical source and expands only `!include ../style.puml`; strips the included style fragment's outer `@startuml` and `@enduml` lines; retains the original source as the basis for identity checks.
- `expandedSource` is used both for `converter.parseText(expandedSource)` and `converter.wrapGroup(..., expandedSource, null)`, so the draw.io edit payload is standalone.
- `convertPumlToXml(sourcePath, pumlDir, converter) -> { rawSource, expandedSource, wrappedXml }`: composes the safe resolver with `parseText` and `wrapGroup`; throws through the parser diagnostics on unsupported PlantUML syntax.
- Export `resolvePumlSource` and `convertPumlToXml` for Node tests; run `main()` only when `require.main === module`.

**Steps:**

- [ ] **Step 1: Add resolver cases.** In `scripts/test_drawio_from_puml.js`, create a temporary `current-target/src/sample.puml` and sibling `current-target/style.puml`; assert the exact approved include expands once without nested document wrappers, an absent include works, and unknown/absolute/escaping includes throw with source filename and directive.
- [ ] **Step 2: Run resolver cases before implementation.**

  Run: `node scripts/test_drawio_from_puml.js`

  Expected before implementation: resolver cases fail because the builder has no safe include resolver.
- [ ] **Step 3: Implement fail-closed local style resolution and conversion.** Resolve `src/` and `style.puml` from `pumlDir`; permit only the exact `../style.puml` directive whose normalized path equals the sibling `style.puml`. Reject every other include. Strip only the included fragment's outer PlantUML wrappers, then:

  ```javascript
  const { rawSource, expandedSource } = resolvePumlSource(sourcePath, pumlDir);
  const rawModelXml = converter.parseText(expandedSource);
  const wrappedXml = converter.wrapGroup(rawModelXml, expandedSource, null);
  return { rawSource, expandedSource, wrappedXml };
  ```

  Keep the canonical source file unchanged by expansion.
- [ ] **Step 4: Test resolver and native converter on four representatives.** Convert `UC-01`, `ACT-03`, `SEQ-01`, and `DATA-03` in a temporary output using the bundled engine; inspect that each output contains native mxCells and a page-local expanded PUML payload with no `!include` or nested wrappers.

  Run: `node scripts/test_drawio_from_puml.js`

  Expected: all synthetic resolver cases pass. Pilot conversion reports one successful native parse for each representative and no external asset reference.

## Task 3 — Separate builder outputs and make the native builder canonical

**Files:**
- Modify `scripts/build_drawio_from_puml.js`.
- Modify `scripts/build_drawio.py`.
- Modify `scripts/build_drawio_from_svgs.py`.
- Modify `scripts/validate_drawio.py`.
- Extend `scripts/test_drawio_native_parity.py` with XML validation fixtures.

**Interfaces:**
- `node scripts/build_drawio_from_puml.js` writes `docs/modeling/current-target/lingora-all-diagrams.drawio`.
- `py -3.13 scripts/build_drawio.py` writes `docs/modeling/current-target/lingora-all-diagrams-svg-editable.drawio`.
- `py -3.13 scripts/build_drawio_from_svgs.py` writes `docs/modeling/current-target/lingora-all-diagrams-svg.drawio`; its existing `--output` argument continues to override that default.
- `py -3.13 scripts/validate_drawio.py` validates the native deliverable and requires unique page IDs/names, ordered 36 pages, expected native cells on every page, and a standalone editable PUML payload matching that page's canonical source plus style expansion.
- `validate_document(root: ET.Element, canonical_sources: dict[str, str]) -> list[str]`: returns all page identity, native-cell, edit-payload, and canonical-source mismatch errors without terminating the process; the CLI prints these errors and exits 1.

**Steps:**

- [ ] **Step 1: Add validator fixtures for output identity and payload checks.** Build an `mxfile` fixture with one named `UC-01` page containing root/layer cells, one native vertex, and a `UserObject` whose `plantUmlData` JSON contains the exact expanded source. Assert no errors for this fixture, then mutate it per subtest to cover a missing page, duplicate page ID, SVG-only page, absent payload, and stale payload. The core assertion is:

  ```python
  errors = validate_document(ET.fromstring(valid_xml), {"UC-01": expanded_source})
  self.assertEqual([], errors)
  self.assertTrue(validate_document(ET.fromstring(svg_only_xml), {"UC-01": expanded_source}))
  ```
- [ ] **Step 2: Run validator tests before implementation.**

  Run: `py -3.13 scripts/test_drawio_native_parity.py -v`

  Expected before implementation: nonzero because `validate_document` does not yet exist and the current SVG-only page fixture is not accepted as native.
- [ ] **Step 3: Change output defaults.** Keep the JavaScript native builder on `lingora-all-diagrams.drawio`; give the Python hybrid builder and SVG-only builder the two alternate paths listed above. Retain the SVG-only builder's `--output` override; do not change the SVG/PNG renderer output directory.
- [ ] **Step 4: Extend the validator to inspect native pages and expanded sources.** Parse XML; for each page, verify the canonical ID/name/order and page ID `page-{diagram ID}`; require at least one native vertex/edge cell beyond root/layer IDs; parse the page's `UserObject.plantUmlData` JSON and compare its `data` field exactly with the expected expanded canonical source; reject a page containing only an SVG image object. Keep error reporting in `validate_document` and make the CLI print all errors.
- [ ] **Step 5: Build and validate all 36 pages.**

  Run: `node scripts/build_drawio_from_puml.js`

  Expected: 36 native conversions, 36 pages, zero duplicate IDs, and no parser error.

  Run: `py -3.13 scripts/validate_drawio.py`

  Expected: exit 0 and one passing native/edit-payload check for each page.

## Task 4 — Pilot and implement native-cell layout normalization

**Files:**
- Create a deterministic post-conversion native-cell layout pass under `scripts/` and focused tests in `scripts/test_drawio_native_parity.py`.
- Modify `scripts/build_drawio_from_puml.js` only as needed to invoke/document the layout pass reproducibly.
- Update only the native mxGraph geometry in `docs/modeling/current-target/lingora-all-diagrams.drawio`; preserve its cells, edit payloads, and semantic inventory.
- Create `docs/modeling/current-target/evidence/native-render-review.md` and exported native-page PNG evidence.

**Interfaces:**
- The layout pass consumes the native `.drawio` XML and matching reference SVGs as read-only geometry guides.
- Layout mapping must fail closed on ambiguous/missing matches; explicit per-diagram mappings may resolve exceptions and must report unmatched cells before writing.
- Review row fields: diagram ID, native cell/page counts, source inventory hash, final native PNG hash/dimensions, verdict, and layout note.
- Allowed edits are limited to native positions, dimensions, edge routes/label offsets, title placement, and page bounds. Labels, IDs, edge endpoints, and PUML edit payloads remain unchanged.

**Steps:**

- [ ] **Step 1: Add failing tests for native geometry mapping and semantic preservation.** Cover grouped and standalone vertices, linked edges, title/page bounds, native-only output, unchanged IDs/labels/source-targets/PUML payloads, and fail-closed ambiguous matches.
- [ ] **Step 2: Implement SVG-guided native geometry transfer.** Match existing native cells to reference geometry by label/type with checked per-diagram mappings where needed. Convert child positions correctly and set readable native edge routes/label offsets. Do not copy SVG bytes into the target pages.
- [ ] **Step 3: Pilot UC-01, ACT-03, SEQ-01, DATA-03, and SYS-04.** Apply the pass, export through draw.io Desktop 32.4.1, inspect fit and close zoom, and refine only geometry until all five are legible and native-editable.
- [ ] **Step 4: Apply the layout pass to all 36 pages.** Export every page through draw.io Desktop and add one review row/image per page. Fail the build on unmapped required cells or any SVG-only page.
- [ ] **Step 5: Fix remaining visual-only issues in the layout pass and repeat full export/review.**
- [ ] **Step 6: Freeze the final output and prove semantic identity.** Confirm IDs, labels, edge endpoints, PUML payloads, and all 36 normalized PUML inventories match pre-layout values.

## Task 5 — Rebuild complete artifacts and document the canonical path

**Files:**
- Modify `docs/modeling/current-target/README.md`.
- Modify `scripts/validate_drawio.py` if the complete-set checks expose a missing invariant.
- Regenerate `docs/modeling/current-target/lingora-all-diagrams.drawio` from the native builder and geometry pass. Reference SVG/PNG outputs are read-only unless an approved canonical source change is required.
- Keep alternates only when generated by their separately named builders.

**Steps:**

- [ ] **Step 1: Document output roles and reproducible commands.** State that `lingora-all-diagrams.drawio` is the native editable set from the JavaScript builder; list the SVG-only and SVG-editable alternatives and commands separately; keep the existing local renderer and semantic approval statements intact.
- [ ] **Step 2: Rebuild in canonical order.**

  Run: `node scripts/build_drawio_from_puml.js`

  Expected: exit 0; exactly 36 native pages in the existing group/ID order, followed by the deterministic layout pass.

- [ ] **Step 3: Validate source/render/page identities.**

  Run: `py -3.13 scripts/validate_drawio.py`

  Expected: exit 0; 36 unique named native pages, every page's PUML payload matches its canonical expanded source, and no source page is missing or duplicated.

  Run: `py -3.13 docs/modeling/current-target/verify.py`

  Expected: existing accepted modeling/source/render invariants remain satisfied; any pre-existing repository-wide denominator conflict is recorded without modifying unrelated physical-design files.

  Run: `py -3.13 scripts/verify_drawio_native_parity.py --verify-baseline plans/approved/2026-10-11-drawio-native-render-parity-BASELINE.json`

  Expected: exit 0; all 36 semantic inventories match baseline. It reports changed hashes only for approved source/style/render/draw.io outputs and preserves every unrelated pre-existing path, the initial HEAD, and the index digest.

## Task 6 — Record evidence, close task pointers, and commit scoped changes

**Files:**
- Append task evidence in `logs/test-log.md` and `logs/development-log.md`.
- Append a tooling decision record in `logs/decision-log.md` using the next unused ADR ID, classified as a renderer/tooling decision with no product authority.
- Update `plans/current-task.md`, `HANDOFF.md`, `docs/QUICK-REF.md`, `plans/approved/README.md`, and `plans/archive/README.md`; create a task completion archive under `plans/archive/`.

**Steps:**

- [ ] **Step 1: Run final verification after all sources, builders, and evidence are stable.**

  Run: `py -3.13 scripts/test_drawio_native_parity.py -v`

  Expected: all tests pass.

  Run: `py -3.13 docs/modeling/current-target/render.py`

  Expected: exit 0 and 36 source/reference render identities.

  Run: `node scripts/build_drawio_from_puml.js`

  Expected: exit 0, 36 converted pages, zero duplicate IDs.

  Run: `py -3.13 scripts/validate_drawio.py`

  Expected: exit 0 for all native pages and edit payloads.

  Run: `py -3.13 docs/modeling/current-target/verify.py`

  Expected: exit 0 with the existing accepted modeling/source/render invariants still satisfied.

  Run: `py -3.13 scripts/verify_drawio_native_parity.py --verify-baseline plans/approved/2026-10-11-drawio-native-render-parity-BASELINE.json`

  Expected: exit 0 with matching semantic inventories and unchanged unrelated state/index.

  Run: `git diff --check`

  Expected: exit 0 with no whitespace errors.

- [ ] **Step 2: Record observed outputs, not inferred verdicts.** Add exact commands, exit codes, relevant output, environment/commit SHA, manual 36-page review evidence, diffstat, and new-file line counts to the required logs. Set `DONE` only after all approved checks pass and required logs are complete.
- [ ] **Step 3: Archive task state and reconcile pointers.** Mark current task `DONE`, copy the final task record into `plans/archive/2026-10-11-drawio-native-render-parity-DONE.md`, update both indexes and the single current handoff state. Preserve the accepted modeling review and existing logs as historical evidence.
- [ ] **Step 4: Commit only task-owned changes with a Conventional Commit.** Review the complete staged diff and confirm every staged path is within the approved task scope. If a pre-existing staged/unstaged change overlaps a task-owned file and cannot be staged as a clean task-only delta, do not include it; record the overlap and leave commit pending user direction rather than committing unrelated work.

## Final acceptance

- Native draw.io output contains 36 ordered, uniquely identified, editable native pages with self-contained PUML edit payloads.
- Native pages are readable and align with the corresponding SVG references in orientation, hierarchy, grouping, page fit, and legibility; small engine-specific path/coordinate differences are documented.
- All 36 normalized semantic inventories exactly match the captured baseline.
- The shared style include is expanded safely; unknown/external includes fail closed.
- SVG-only and SVG-editable builders cannot overwrite the native deliverable by default.
- SVG/PNG/render manifest and native draw.io outputs are fresh and reproducible.
- Pre-existing Git index, HEAD, and unrelated worktree contents are preserved; logs and task pointers contain observed evidence.

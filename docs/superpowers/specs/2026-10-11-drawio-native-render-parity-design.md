# Native draw.io Rendering Parity for the Lingora Diagram Set

**Status:** PROPOSED — design direction approved by the user on 2026-10-11; implementation remains gated on approval of the detailed plan and immutable snapshot.
**Date:** 2026-10-11
**Scope:** All 36 canonical modeling diagrams. This proposal changes rendering/layout tooling only. The accepted diagram semantics remain controlled by the current modeling sources and ADR-030–036.

## 1. Context and observed cause

The canonical set contains 36 PlantUML sources under `docs/modeling/current-target/src/`, a shared `style.puml`, and 36 rendered SVG/PNG pairs. The existing `lingora-all-diagrams.drawio` currently embeds every canonical PUML source with the exact SVG generated from it; a read-only comparison found 36 pages, zero source mismatches, and zero embedded-SVG mismatches.

There are two rendering engines. `docs/modeling/current-target/render.py` invokes the local PlantUML renderer and its layout engine to create the SVG/PNG reference. `scripts/build_drawio_from_puml.js` invokes the bundled draw.io JavaScript converter to create native mxGraph shapes. All 36 canonical sources include the same `../style.puml` fragment; the native builder removes those `!include` lines before conversion, so the native result loses the shared presentation settings. The two layout engines can also route links and place clusters differently when given the same diagram declarations. Three builder scripts currently target the same `.drawio` path, which makes the intended output ambiguous.

## 2. Goals and boundaries

The task aims to:

- Render all 36 diagrams through the draw.io native PlantUML converter with their shared presentation settings and readable layouts.
- Make `docs/modeling/current-target/lingora-all-diagrams.drawio` the native, editable 36-page deliverable, with a source-edit control on each page.
- Keep the canonical PUML files and their local SVG/PNG outputs reproducible; compare native output with the corresponding current SVG for hierarchy, direction, grouping, spacing, and readability.
- Preserve each diagram's meaning and all accepted modeling decisions.

The task does not change actors, use-case identities, entity or attribute names, messages, branches, state transitions, associations, multiplicities, role policy, source authority, application behavior, database design, or requirements. It does not edit the vendored draw.io converter or change dependencies. If visual parity would require changing a semantic declaration or unsupported vendor behavior, stop and report the affected diagram instead of approximating its meaning.

## 3. Approaches considered

| Approach | Benefits | Costs |
|---|---|---|
| **Resolve shared PUML includes for native conversion and add supported layout hints where needed** | PUML remains the source; native draw.io pages remain editable; one builder can produce the requested deliverable. | The JavaScript and Graphviz renderers can still differ slightly in curves and coordinates; each notation type needs visual review. |
| Keep SVG-backed pages and preserve PUML in the edit payload | The current package already displays the reference SVGs accurately and contains PUML. | Direct editing/re-rendering can return to the draw.io engine's different layout. |
| Hand-author all 36 pages as draw.io cells | Provides direct control over native geometry. | Creates a second hand-maintained representation that can drift from PUML and increases ongoing edit cost. |

The selected direction is the first approach, as approved in chat on 2026-10-11. The parity target is the same visual hierarchy and readability, with small renderer-specific path and coordinate differences accepted.

## 4. Proposed design

### 4.1 Source and style resolution

Keep `style.puml` shared in the canonical sources. Update the native builder to resolve supported local `!include` paths before calling the JavaScript converter, including expanding the style fragment without duplicating its `@startuml`/`@enduml` wrapper. Unknown or external includes must fail with a clear error. The generated draw.io edit payload must contain a self-contained PlantUML source so a page can be re-rendered after import without access to a repository-relative include path. The task verifier will confirm that the expanded payload is derived from the canonical source and shared style.

### 4.2 Layout compatibility

First convert one representative from each major notation: use-case, activity/state, sequence, and class/ERD/component or deployment. Compare native draw.io output with the matching SVG. Use only syntax supported by the bundled converter and current renderers. Apply source-level presentation hints only where the pilot shows a material readability gap; keep them outside semantic declarations. Review all 36 pages after the shared fix, then make targeted presentation edits for remaining gaps.

### 4.3 One canonical draw.io output

Designate `scripts/build_drawio_from_puml.js` as the builder for `lingora-all-diagrams.drawio`. The resulting pages use native draw.io cells and retain a self-contained PUML edit payload. Route the SVG-backed builders to a clearly named alternate output such as `lingora-all-diagrams-svg.drawio`, so running an alternate builder cannot overwrite the native deliverable. Update the validator and modeling README with the canonical builder commands and output roles.

Keep the local PlantUML renderer as the canonical SVG/PNG reference generator. If a canonical PUML source changes, regenerate its SVG/PNG and render manifest from that source. Preserve the previous modeling review, verifier, logs, and approved/archive snapshots as historical evidence; record this task's native render review separately.

### 4.4 Semantic guard

Capture a task baseline before implementation: all 36 source hashes, SVG/PNG hashes, draw.io page IDs/names, and a normalized inventory of each diagram's declared labels and relationships. The task verifier must confirm the native draw.io pages carry the expected expanded source and that semantic inventories match the baseline. Keep the existing final modeling verdict and evidence unchanged.

## 5. Verification and acceptance

- The native builder converts all 36 pages without parser errors; output page IDs/names remain unique and ordered, each page contains native diagram cells and a source-edit payload, and no external image dependency is introduced.
- Every native page is visually reviewed against its corresponding SVG. Direction, grouping, hierarchy, spacing, and line routing remain readable and closely aligned; any remaining path/coordinate differences are recorded.
- All 36 semantic inventories match the baseline. No product or accepted logical-model decision changes.
- The local SVG/PNG outputs and render manifest are fresh for their canonical PUML/style inputs. The `.drawio` is fresh for the native builder and all 36 canonical sources.
- The existing unrelated workspace modifications, initial HEAD, and Git index are preserved until the approved task files are selectively staged after TEST and LOG.
- Record exact verification commands and observed results in the repository test/development logs; record the renderer/build choice in the decision log using its ADR template.

## 6. Risks and stop conditions

- The bundled JavaScript converter implements a different layout engine and may not support all PlantUML directives. Pilot before broad edits; if a diagram cannot be made readable without semantic changes or vendor modifications, stop and report that diagram.
- Local style expansion must not accidentally nest PlantUML document wrappers or execute arbitrary include paths. Limit resolution to the task's local style include and fail closed on any other include.
- Three builder scripts currently target one output. Distinct output defaults and validator expectations are part of the implementation, preventing accidental replacement of the requested native file by the SVG-backed version.
- Existing user changes and untracked artifacts are part of the baseline. Never reset, overwrite unrelated files, or stage the existing dirty workspace wholesale.

## 7. Review state

This spec records the approved direction, not an accepted product or logical-model change. The detailed implementation plan at `docs/superpowers/plans/2026-10-11-drawio-native-render-parity.md` names the source/tooling files, baseline procedure, visual acceptance process, and verification commands. The user must approve that plan before implementation begins.

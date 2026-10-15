# Native draw.io Render Review — 2026-10-11

**Task:** All Diagram PUML Native draw.io Rendering Parity  
**Renderer:** draw.io Desktop 32.4.1, Windows  
**Review verdict:** `REVIEW REQUIRED` — the native converter does not meet the approved visual-parity acceptance for key overview/data diagrams. No canonical PUML declarations were changed during this review.

## Four-diagram pilot

PNG previews were exported from the actual `.drawio` files with the installed draw.io CLI. Canonical dimensions are from the current PlantUML SVGs.

| Diagram | Native PNG | SVG reference | Finding | Evidence |
|---|---:|---:|---|---|
| UC-01 | 1502 × 583 | 704 × 1352 | **Fail.** Native output lays all four packages side by side, leaves the system boundary around only the login box, and sends actor/include connectors across the page. The SVG stacks packages inside the system boundary. | [native PNG](native-render-review/native-UC-01.png), [SVG reference](../rendered/UC-01-target-overall.png) |
| ACT-03 | 1188 × 1705 | 1189 × 1733 | **Needs correction.** Overall flow is similar, but the title wraps and the first retry decision label is crossed by its connector in native output. | [native PNG](native-render-review/native-ACT-03.png), [SVG reference](../rendered/ACT-03-lesson-learning.png) |
| SEQ-01 | 950 × 1053 | 920 × 1120 | **Pass with small differences.** Vertical sequence structure and messages remain readable; proportions are close. | [native PNG](native-render-review/native-SEQ-01.png), [SVG reference](../rendered/SEQ-01-login-authorization.png) |
| DATA-03 | 2401 × 1028 | 1931 × 923 | **Fail.** Native layout changes the row grouping; relationship labels and lines overlap around the lower central entities. | [native PNG](native-render-review/native-DATA-03.png), [SVG reference](../rendered/DATA-03-target-logical-erd.png) |

Additional blocker observed on **SYS-04**: native export is 1425 × 836 versus a 1403 × 464 SVG reference, with database relationship labels overlapping around the center. See [native PNG](native-render-review/native-SYS-04.png) and [SVG reference](../rendered/SYS-04-target-components.png).

The shared style is now expanded before native conversion, and each native page retains a self-contained expanded PUML payload. Those fixes do not change the bundled converter's group placement and edge routing. Tested direction/spacing and hidden-link hints did not change the UC-01 package geometry. Changing model relationships to force positions would violate the semantic-preservation boundary, so no such workaround was applied.

## Visual-fidelity alternative

`lingora-all-diagrams-svg-editable.drawio` was built as the separate SVG-backed option. Its 36 pages contain the exact canonical SVG bytes (36/36 SHA-256 matches) and self-contained PUML edit payloads (36/36 matches after shared-style expansion). Draw.io's own export of its UC-01 page is 706 × 1354; the 2-pixel difference is page margin around the 704 × 1352 reference. Preview: [SVG-editable UC-01 PNG](native-render-review/svg-editable-UC-01.png).

This option presents each diagram as one SVG object with embedded PlantUML edit data; native cell-by-cell editing is provided by `lingora-all-diagrams.drawio` instead. Editing and re-rendering the PUML through draw.io invokes its native converter and can reintroduce the layout differences above.

The additional [native-export-test.svg](native-export-test.svg) is a 1218 × 269 draw.io SVG export retained from the renderer CLI smoke check. Its opening label is “Kho mã nguồn Lingora”; it is export evidence, not a canonical PlantUML reference.

## Evidence hashes

| Preview | SHA-256 |
|---|---|
| `native-UC-01.png` | `6c2773c4c082ceeaaa8decacf2e02e45502b23e03a985d9e33682afae2b845b0` |
| `native-ACT-03.png` | `e04e4c7e5fa987d99de6cd34be9daec57c83a973b043aa771c023d526e4ba944` |
| `native-SEQ-01.png` | `9c3abd79aef0456c4a7ed9ef92072abd65d818313ad16e10abbc41272be0b386` |
| `native-DATA-03.png` | `65e53dee4a58ea765c9ef7c1aa4da6f19ae179bbbe90e8b15233fca7f6a8b921` |
| `native-SYS-04.png` | `408e6342ca32239a46ec35423442a91165b97b5c27970def2503ac45db2d6568` |
| `svg-editable-UC-01.png` | `dfc8d17a0cd385c8d3f171674d8e8f711e677ecbf1bc8ac20d052ebc0ae0bf4a` |

## User resolution — native diagram remains primary

On 2026-10-11, the user clarified that SVG-backed pages do not meet the request because SVG looks generated and cannot be edited as diagram shapes. The primary file remains `lingora-all-diagrams.drawio`; its 36 pages must be native editable shapes arranged for readability after conversion. `lingora-all-diagrams-svg-editable.drawio` is only a comparison artifact.

The implementation may use the canonical SVGs as read-only geometry references, then transfer positions/routes to the existing mxGraph cells. The final native file must not contain SVG image cells. Preserve all PUML edit payloads, IDs, labels, relationships, and semantic inventories. Updated scope and approval evidence: `plans/approved/2026-10-11-drawio-native-cell-layout-APPROVED.md` and its REQUEST companion.

## Pre-amendment native-cell layout review — 2026-10-11

**Pre-amendment visual review:** `PASS` for all 36 native pages. The earlier pilot findings above describe the unnormalized converter output and are retained as historical evidence. The reviewed native diagram set at [lingora-all-diagrams.drawio](../lingora-all-diagrams.drawio) used editable draw.io cells on every page.

The post-conversion pass transfers native cell positions and matched relationship routes from the read-only SVG references. A final review found that actor glyphs are separate from their text cells in the native model; their SVG identities were not being attached to native actor cells, leaving actor-to-use-case connectors on the converter's default routes. The layout pass now maps the glyph IDs too, so actor associations inherit the reference routes while remaining native mxGraph edges. This changes only presentation geometry.

The pre-amendment file contained 36 ordered pages, 2,115 mxCells, including 2,043 editable vertices and edges, and zero SVG image cells. The activity and sequence pages retain their already-readable native flow/message routes. The three state pages retain native shapes and transitions with corrected label offsets/routes where the converter overlapped labels.

Draw.io Desktop 32.4.1 exported every page from that 36-page `.drawio` file. The updated 35-page export evidence is described below. UC-01 is 706 × 1352 pixels; its reference SVG is 704 × 1352. The actor associations now follow the reference curves, and the system boundary and vertically stacked packages are visible in the native page.

Automated comparison at that stage confirmed all 36 semantic inventories still matched the approved baseline, all 36 PUML edit payloads matched their canonical expanded sources, and the native output contained no SVG image objects. Small renderer-specific differences in line sampling, font metrics, and page margins remain. The repository-wide modeling verifier still reports its pre-existing `single canonical set plus shared style` file-count conflict because `docs/design/physical/physical-erd.puml` is outside this 36-diagram set; the file was preserved and the task-specific source/render checks passed.

## Active package amendment — exclude deferred ACT-05

The user directed that item 13, ACT-05 Reassessment, is outside scope and should be removed. The primary editable package now contains exactly **35 active pages**; ACT-06 is page 13 and subsequent pages are renumbered. The canonical ACT-05 PUML/SVG/PNG remain in the Deferred index for traceability and are not embedded in this active package.

The native builder, page validator, and baseline verifier enforce this exact exclusion. The original immutable baseline still covers all 36 source inventories and 72 render hashes; comparison confirms all 36 semantic inventories are unchanged while only the approved ACT-05 output page is omitted. The current `.drawio` has 35 pages, 2,106 mxCells, 2,034 editable vertices/edges, and zero SVG image cells. Draw.io Desktop 32.4.1 exported all 35 pages. Their dimensions and SHA-256 values are in [final/manifest.csv](native-render-review/final/manifest.csv), and [contact-01](native-render-review/final/contact-01.png), [02](native-render-review/final/contact-02.png), [03](native-render-review/final/contact-03.png), and [04](native-render-review/final/contact-04.png) show the active set.

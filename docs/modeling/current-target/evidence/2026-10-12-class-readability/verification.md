# DOM-01 existing UML class diagram — native readability correction

The existing page29 `29 - Domain - Mô hình miền Lingora (DOM-01)` is a UML domain class diagram. No duplicate/new diagram required. [Direct user scope](../../../../../plans/approved/2026-10-12-class-readability-APPROVED.md) authorizes inspection and legible presentation; existing domain is retained.

Before: native child fields exceeded class bounds; derived fields had negative child coordinates; Progress header was hidden beneath another frame; some multiplicity cells were detached and seven relationships mixed them into central labels. Root cause is native presentation geometry, not missing domain classes. No source changes or builder fixes.

After: repositioned all existing23 classifiers (22 classes and one StudyFocus enum), resized headers/compartments, moved all35 existing member rows into their frames (30 attributes + five enum values), rerouted24 existing relationships through clear orthogonal gutters and displayed their48 source multiplicities at endpoints. Added14 multiplicity text cells only for seven previously combined central labels; no new classifier, member, function, association, composition, role or multiplicity value. Existing classifier/member/relationship IDs and embedded source unchanged. Automatic duplicate/new-diagram addition was unnecessary.

Final Draw.io Desktop32.4.1 page-index29 PNG and SVG exports exit0; whole diagram and final detailed native crop visually reviewed. Font16 for members/17 for class headers, wrapped Exercise row, separate derived headers, and no text escaping frames. Shared relation trunks/gutter crossings remain where required by the existing full domain model; no connector through an unrelated classifier. The full view uses a wide page; SVG supports vector zoom/report export.

Observed temporary audit exit0, PASS/errors=[]: 44 total pages; other43 raw fragments exact; 23 classifiers,35 member rows,24 relationship identities/endpoints/kinds,48 approved-source multiplicities preserved; no class-frame overlaps, detached/clipped member rows, endpoint-label collisions, role/endpoint-label overlap or connector through unrelated class; 1,018 protected file hashes, source payload, HEAD/index and historical log prefixes unchanged. Canonical PUML/renders/specification, UC/Activity views, code/schema/API/ADR/test/runtime all read-only.

- [Final native PNG](after.png) / [vector SVG](after.svg)
- [Before native PNG](before.png), [complete entry backup](before-package.zip)
- [Machine audit](verification.json), [entry baseline](baseline.json), [layout/relationship mapping](layout.json)
- [PNG export stdout](export-png.stdout.txt) / [stderr](export-png.stderr.txt)
- [SVG export stdout](export-svg.stdout.txt) / [stderr](export-svg.stderr.txt)
- [Diff check](diff-check.txt), [whole-worktree stat](diff-stat.txt), [line counts](line-counts.txt)

Exact read-only audit: `python C:/Users/PC/AppData/Local/Temp/lingora-class-check/verify_class.py`. Temporary scripts outside repository only. Initial native style normalization lost the bare swimlane marker and centered header labels; observed in actual export and corrected to shape=swimlane before final export. Intermediate audit caught three initial label/frame collisions and then six wider endpoint/role collisions; fixed by route-distance endpoint placement and individual gutter offsets, then rerun to PASS. No failure treated as acceptance.

No product semantics/code/schema/API/ADR/runtime changes, repository script/test edits, history deletion, staging or commit. Runtime/application acceptance N/A (diagram-only). Existing independent Activity task pointer is retained and the DOM task recorded additively; no declaration that the Activity work is complete. Prior source/output insertion conflict and physical/liveDB gates remain separate.

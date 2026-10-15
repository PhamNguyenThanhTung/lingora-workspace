# Page 05 UC-01 — native straight layout verification

Direct user approval: [scope](../../../../../plans/approved/2026-10-12-overall-usecase-straight-layout-APPROVED.md). Layout only in the existing primary Draw.io page; no UML correction or business change.

Before: old SVG waypoint arrays caused long curved/polygonal routes, scattered include labels, uneven oval dimensions and wrapped title. After: removed all 33 waypoint arrays, pinned straight endpoints, aligned goal ovals to a 70 px rhythm, separated four existing groups, placed include labels in the right gutter, enlarged the title and spaced authentication arrowheads. Existing names/actors/relationships/source payload retained.

Observed artifact audit: 44 pages, 43 other raw fragments byte-identical; 17 goals, three actors, 20 associations and 13 include dependencies unchanged; zero waypoint arrays; 913 protected files, HEAD/index and historical log prefixes unchanged. Actors outside boundary and goals spaced within it. Canonical PUML, generated source images, nine cleaned report views, specifications, manifests, tests, scripts, application/schema/API/ADR/runtime all read-only.

Fresh Draw.io Desktop 32.4.1 page5 export exit 0; final PNG opened and visually inspected. All connectors straight, no whole-system route loops, labels outside goal ovals. Shared account goals still have intersecting associations in the left corridor; preserving all existing actor associations means no semantic simplification was attempted under this layout-only request.

- [Before PNG](before.png)
- [After PNG](after.png)
- [Complete entry backup](before-package.zip)
- [Machine audit](verification.json)
- [Raw-page/protected-file baseline](baseline.json)
- [Export stdout](export.stdout.txt) / [stderr](export.stderr.txt)
- [Whole-worktree diff stat](diff-stat.txt), [diff check](diff-check.txt)

Exact audit: `python C:/Users/PC/AppData/Local/Temp/lingora-overall-straight/verify.py` — temporary read-only artifact probe outside the repository; no test edits. An initial inspection command failed through Windows cp1252 stdout encoding; rerun with UTF-8 succeeded before edits. Native visual refinement moved include labels away from folder borders and added group gaps, followed by a fresh export/inspection/audit.

Runtime/application acceptance N/A (diagram layout only). Prior insertion source/output conflict remains in separate REVIEW capture. No full-bundle rebuild, staging or commit. The whole-worktree diff contains preexisting unrelated changes; bounded-scope proof is the raw-page and protected-file baseline.

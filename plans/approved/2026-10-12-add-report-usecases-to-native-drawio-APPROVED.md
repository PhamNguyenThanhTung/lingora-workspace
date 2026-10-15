# Add Report Use Case Views to the Native Draw.io Bundle

**Date:** 2026-10-12 (Asia/Saigon)  
**Status:** Approved bounded documentation/modeling packaging task.  
**Approval evidence:** Direct user instruction: “mấy cái uc mới kh nằm trong này à thêm vào cho tôi đi thêm vào ngay sau cái 08 uc quản trị viên kìa” (add the new UC diagrams to `lingora-all-diagrams.drawio` immediately after page 08 Admin).

## Goal

Add the nine existing report-oriented functional views `VIEW-RUC-01` through `VIEW-RUC-07`, `VIEW-RUC-08A`, and `VIEW-RUC-08B` as editable native Draw.io pages immediately after `VIEW-UC-04` / “Use Case - Quản trị viên”. Preserve all existing diagram behavior and canonical UC identities.

## Review and constraints

- The report view README defines eight functional groups across nine diagrams and states `VIEW-RUC-*` labels do not add or renumber canonical UCs.
- Current primary package contains 35 pages because deferred `ACT-05` is omitted. Adding nine pages yields 44 pages; canonical `ACT-01` must follow the nine new pages.
- The nine existing report PUML files and their SVG/PNG render outputs are the content authority. Their contents and render manifests are read-only for this task.
- This is a bounded documentation/modeling packaging task. It makes no product behavior, canonical use-case catalog, physical design, database, schema, API, or application decision.

## Permitted files/actions

- Edit `docs/modeling/current-target/lingora-all-diagrams.drawio` and its builder/layout/validation/parity scripts and focused tests so rebuilding yields the same 44-page order.
- Update only the relevant native Draw.io package README, current task pointer, handoff, archive record, quick reference if necessary, approved/archive indexes if necessary, and append-only test/development logs.
- Create a pre-change evidence snapshot under `plans/approved/` and preserve unrelated workspace/index changes.
- Do not edit report PUML, SVG/PNG, manifests, canonical PUML, product specs/ADRs, physical-design artifacts, application, schema, migration, database, seed, or deployment files. Do not stage or commit.

## Acceptance and verification

1. The Draw.io bundle has 44 pages. Existing pages 01–08 preserve their original identities and order. The nine report pages occupy 09–17, in the README order, directly after Admin. Existing pages after Admin retain their identity/order and are renumbered; `ACT-01` becomes page 18. `ACT-05` remains absent.
2. Each report page has editable native cells and a standalone PlantUML source payload exactly matching its existing PUML after the shared style include is expanded. The nine report source/render files remain unchanged.
3. The builder, validator, and native parity verifier accept the package and enforce the expected order/count. Rebuilding is deterministic and does not alter the 35 existing page semantics.
4. Focused tests are run before and after implementation; Draw.io structural/native-cell validation, baseline parity verification, output preservation checks, syntax/freshness checks as applicable, and `git diff --check` are recorded from observed output. No staging or commit.

## Review result

The requested insertion point and source set are explicit. The existing report-view approval already establishes their identities and separation from the canonical UC catalog. Reusing these views as native editable pages is packaging only, so no unresolved product or physical-design decision is needed.

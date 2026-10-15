# Approved Amendment — Exclude Deferred ACT-05 from the Primary Draw.io Package

**Date:** 2026-10-11  
**Status:** APPROVED by explicit user instruction  
**Parent task:** All Diagram PUML Native draw.io Rendering Parity

## Approval evidence

The user instructed: “tại sao cái 13 ngoài phạm vi còn vẻ vào làm gì bỏ nó luôn đi được mà” — remove item/page 13 because it is outside scope.

## Bounded scope

- Exclude `ACT-05` (Reassessment — `DEFERRED — NOT IN MVP`) from the primary native editable `lingora-all-diagrams.drawio` package.
- The primary editable package must contain 35 active pages. Renumber page labels and refresh its page-preview manifest/contact sheets accordingly.
- Update the native builder, validator, semantic-baseline verifier, and task evidence so they agree on the 35-page delivered set.
- Preserve the 36-source canonical PUML/render inventory and the approved semantic baseline. Keep ACT-05's source and rendered reference as deferred traceability evidence outside the active native package.

## Review and constraints

ADR-036 explicitly defers Reassessment from MVP and says any retained diagram artifact must be marked deferred and must not appear in the active MVP diagram catalog. Excluding the page from the active editable deliverable follows that decision. This amendment changes packaging only; it does not alter diagram meaning, source declarations, actor/use-case identities, or the existing immutable baseline.

## Acceptance

- The primary native `.drawio` contains exactly 35 pages and has no `ACT-05` page.
- All 35 pages remain native editable draw.io cells with their matching PUML payloads and no SVG image cells.
- The validator accepts this exact omission and rejects an omission of any other canonical page.
- The verifier confirms all 36 source semantic inventories and render hashes still match the immutable task baseline, while accepting the intentional output-page omission and page renumbering.
- Final preview manifest/contact sheets describe only the 35-page primary deliverable.
- Existing Git HEAD, index, unrelated changes, and canonical ACT-05 source/render evidence remain unchanged.

## Permitted files/actions

`plans/current-task.md`; this immutable approval/request record; `plans/approved/README.md`; `scripts/build_drawio_from_puml.js`; `scripts/validate_drawio.py`; `scripts/verify_drawio_native_parity.py`; `scripts/test_drawio_native_parity.py`; primary native `.drawio`; final native preview evidence/manifest/contact sheets; `docs/modeling/current-target/README.md`; `docs/modeling/current-target/evidence/native-render-review.md`; `docs/QUICK-REF.md`; `HANDOFF.md`; append-only `logs/test-log.md` and `logs/development-log.md`.

**Excluded:** deleting canonical ACT-05 PUML/SVG/PNG evidence; modifying any diagram's semantics; modifying the SVG-backed comparison package; unrelated workspace changes; staging/committing overlapping pre-existing paths; rewriting Git history.

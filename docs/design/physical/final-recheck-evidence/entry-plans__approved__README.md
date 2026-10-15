# Approved Plans

When a task receives explicit human approval, copy the approved snapshot here before implementation. Use a stable filename such as `YYYY-MM-DD-task-slug.md`.

Approved snapshots are immutable. If scope changes, return the active task to REVIEW and create a new approved snapshot after re-approval.

A snapshot is current authorization only while `plans/current-task.md` points to it for the active task. Snapshots for completed or superseded tasks remain `HISTORICAL` evidence; their former approval does not authorize later work. M2.6 accepted a design handoff only and is not a Phase 2 implementation approval.

- `2026-10-10-lingora-product-revision-pass-APPROVED.md` is the historical approval snapshot for the completed documentation-only Product Revision Pass, recorded in `plans/archive/2026-10-10-lingora-product-revision-pass-DONE.md`. It does not authorize implementation or physical database changes.


- `2026-10-11-lingora-final-modeling-review-APPROVED.md` is the historical bounded documentation-review approval after task completion; companion REQUEST and BASELINE captures preserve authorization and dirty-worktree evidence. No implementation/physical execution approval.

- `2026-10-11-full-diagram-correction-pass-APPROVED.md` is the historical bounded correction approval; REQUEST/BASELINE preserve user authorization and dirty-worktree evidence. Completion is in the matching DONE archive. It does not grant final modeling approval or downstream physical/implementation authorization.

- `2026-10-11-final-3-point-modeling-correction-APPROVED.md` is the immutable approval snapshot for a bounded post-review correction of assignment lifecycle, configurable Level-up gate, and progress denominator semantics. Matching REQUEST and BASELINE preserve the direct PO scope and initial dirty-workspace state. Final state is in the matching DONE archive.

- `2026-10-11-physical-data-runtime-design-APPROVED.md` authorizes the design-only task, not its technical result/implementation. REQUEST and BASELINE preserve exact PO scope and starting workspace; final scope stops before physical design approval.

- `2026-10-11-drawio-native-render-parity-APPROVED.md` authorizes the approved presentation/tooling plan for native draw.io rendering across all 36 diagrams. Its REQUEST records the user request and explicit “ok làm đi” plan approval; BASELINE preserves the original HEAD, index, source/render/page identities, and semantic inventories.

- `2026-10-11-drawio-native-cell-layout-APPROVED.md` is the immutable amendment selecting native editable shapes as the only requested final form and authorizing a presentation-only post-conversion mxGraph layout pass. Its REQUEST records the user's clarification; the original native parity BASELINE remains authoritative for semantics and unrelated workspace state.

- `2026-10-11-drawio-exclude-deferred-act05-APPROVED.md` is the user-authorized packaging amendment removing deferred ACT-05 from the primary editable 35-page set while retaining its canonical source/render traceability. Its REQUEST records the direct instruction; the original 36-source baseline remains immutable.

- `2026-10-11-final-physical-runtime-review-APPROVED.md` is the immutable direct documentation-review scope, with exact REQUEST and initial BASELINE. It authorizes independent review and optional bounded physical documentation correction, not approval of technical choices/implementation/rebuild. Final review found F01–F12; technical corrections were not applied.

- `2026-10-11-physical-design-correction-pass-APPROVED.md` is the immutable direct documentation-only correction scope for F01–F12. Its REQUEST and BASELINE preserve the exact user instruction and dirty-workspace start state. Corrections remain proposed and require a separate final recheck; implementation, database execution, staging and commit are not authorized.

# Archived Plans

Move completed, superseded, or cancelled task plans here. Preserve history; do not overwrite or delete prior plans.

Archived plans are `HISTORICAL` evidence and never authorize current work. `plans/current-task.md` identifies the only active task and points to its current approval snapshot when one is required.

Recommended filename: `YYYY-MM-DD-task-slug-DONE.md` or `YYYY-MM-DD-task-slug-SUPERSEDED.md`.

`2026-10-07-prior-master-plan-active-task-capture-SUPERSEDED.md` is an exact byte-for-byte capture of the then-current `plans/current-task.md`, preserved when the user authorized a replacement control-reconciliation task. It is historical evidence, not an approved-plan snapshot or implementation authorization.

`2026-10-10-p0-d07-logical-security-decisions-DONE.md` records the completed, user-approved documentation-only P0-D07 logical decision task. ADR-035 resolves product/security policy only; its archive does not authorize physical design or implementation.

`2026-10-10-lingora-product-revision-pass-DONE.md` records the completed Product Revision Pass. ADR-036 updates current MVP product policy and modeling; the package is READY FOR FINAL MODELING REVIEW. No implementation, physical schema, or live database work was authorized.

### Historical Phase 0 and Phase 1 Plans Archived (2026-10-10)

The following completed and superseded historical plan documents were moved from the root of `plans/` into `plans/archive/` to ensure the root directory strictly contains only active pointers and roadmap:
- `2026-09-22-m2-2-behavior-uc-activity-state-plan-HISTORICAL.md`: Milestone M2.2 plan (accepted by ADR-020; superseded by 14 UC baseline).
- `2026-09-23-m2-3-sequence-api-service-boundary-plan-HISTORICAL.md`: Milestone M2.3 plan (accepted by ADR-025; superseded by 9 canonical sequences SEQ-01..09).
- `2026-09-23-m2-4-architecture-security-plan-HISTORICAL.md`: Milestone M2.4 plan (accepted by ADR-027; roles and security updated by ADR-034/035).
- `2026-09-26-m2-5-design-validation-plan-HISTORICAL.md`: Milestone M2.5 plan (accepted by ADR-028; historical validation gates complete).
- `2026-09-26-m2-6-design-handoff-plan-HISTORICAL.md`: Milestone M2.6 plan (accepted by ADR-029; Phase 1 design handoff complete).
- `2026-09-20-phase-0-fix-plan-HISTORICAL.md`: Phase 0 documentation adjudication and fix plan (completed).
- `2026-09-20-phase-0-presentation-fix-plan-HISTORICAL.md`: Phase 0 presentation audit fix plan (completed).
- `2026-09-20-phase-0-tai-lieu-requirements-fix-plan-HISTORICAL.md`: Phase 0 requirements document slide-readiness fix plan (completed).
- `2026-08-23-phase-0-user-research-analysis-and-requirements-writing-plan-HISTORICAL.md`: Phase 0 user research and requirements authoring plan (completed).

- `2026-10-11-lingora-final-modeling-review-DONE.md` records MODELING APPROVED WITH NON-BLOCKING NOTES / READY FOR PHYSICAL DESIGN; no follow-on task or implementation is authorized.

- `2026-10-11-full-diagram-correction-pass-DONE.md` records correction completion / READY FOR FINAL MODELING REVIEW, with36 sources/36 SVG/36 PNG and36 individual visual checks. A separate FINAL MODELING REVIEW is the next separately authorized task; no follow-on task is active.

- `2026-10-11-final-3-point-modeling-correction-DONE.md` records the post-review correction of three authorized modeling points and the verdict MODELING APPROVED / READY FOR PHYSICAL DESIGN. Only ACT-01 and ACT-09 were rerendered; the original worktree/index was preserved. No physical design task is active.

- `2026-10-11-physical-data-runtime-design-DONE.md` records completed proposed physical design/rebuild documentation. It does not approve technical choices or authorize implementation/reset; next review is separate.

- `2026-10-11-final-physical-runtime-review-DONE.md` records the completed documentation-only final review: NEEDS PHYSICAL CORRECTION / NOT READY FOR IMPLEMENTATION PLANNING, F01–F12 open, 34-table recommendation unchanged. It grants no physical/product/implementation/rebuild approval.
- `2026-10-11-physical-design-correction-pass-DONE.md` records the bounded F01–F12 documentation correction and independent closure check. All findings are CLOSED and the task stops at PHYSICAL CORRECTION COMPLETE — READY FOR FINAL RECHECK; it does not approve the physical design or authorize implementation. The next gate is a separate FINAL PHYSICAL DESIGN REVIEW.
- `2026-10-11-drawio-native-render-parity-PENDING-CAPTURE.md` preserves the exact prior pending task pointer when the user started physical review; it does not mark that draw.io task DONE or resolve its commit gate.

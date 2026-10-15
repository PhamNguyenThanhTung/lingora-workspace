# Current Task — Lingora Product Revision Pass

**Status:** DONE
**Approval evidence:** The user’s explicit Product Revision request (2026-10-10) approves the bounded documentation-only scope and the enumerated PO decisions. This task records those decisions and aligns active requirements, use cases, traceability, and canonical modeling. It does not authorize application implementation or physical database design.
**Approved snapshot:** `plans/approved/2026-10-10-lingora-product-revision-pass-APPROVED.md`
**Prior task:** Archive Phase 0 and Legacy Report Artifacts to docs/archive/ is DONE; no follow-on task was active before this request.

## Scope and permitted files/actions

1. Record the six approved product decision groups as ADR-036, preserving ADR-030–035 and historical documents unchanged.
2. Add a clearly current TARGET product-policy section to `docs/02-requirements.md`.
3. Reconcile `docs/use-case-specifications.md` and `docs/05-traceability-matrix.md`; keep the existing catalog identities, explicitly classify reminder as deferred, and confirm Reassessment is not an active MVP UC.
4. Correct affected PlantUML diagrams under `docs/modeling/current-target/src/`: learner/overall use cases, onboarding, placement, lesson attempt/scoring, level-up, SRS, authoring/review/assessment publication, account administration, domain/logical ERD, relevant states and security DFD. Keep any Reassessment artifact only as explicitly `DEFERRED — NOT MVP`, outside the active flow catalog.
5. Update modeling `README.md`, `review.md`, render manifest and generated renders for the affected sources; reconcile `docs/QUICK-REF.md`, `docs/README.md`, and `HANDOFF.md` authority pointers.
6. Append required development/test evidence and update this task to DONE only after verification.

## Explicit exclusions

- No application/source implementation, API contract, Prisma, SQL migration, seed, RLS/RPC, live DB inspection, or database rebuild.
- No physical table/column/enum/FK or generic workflow-engine design.
- Do not rewrite or delete historical documents to imply the new decisions existed earlier; do not modify ADR-030–035.
- Do not stage or commit; the user explicitly excluded staging/commit absent separate authorization.

## Dependencies and review

- Controlling authority: this request’s PO decisions; ADR-030–035; current use-case catalog; active requirements; canonical modeling package; repository documentation hierarchy.
- Review confirms the request only narrows or adds behavior within existing logical product scope. Existing policy remains in force unless the new ADR explicitly supersedes it. No physical representation is selected.
- User’s request supplies explicit approval for this bounded documentation-only task and decision set. Preserve this snapshot before implementation.

## Acceptance criteria

- [x] ADR-036 records: lesson retry/scoring/completion/latest performance; core/optional SRS enrollment and Policy B recurrence/reinforcement; available-curriculum eligibility and withdrawal/replacement history; assessment blueprint/readiness/immutable versions/practice-item separation; Reassessment deferred; Admin learner account scope and immutable learning evidence.
- [x] Requirements and current UC semantics match ADR-036, without changing historical catalogs or arbitrary UC numbering.
- [x] Traceability connects each ADR-036 decision group to the current requirement sections, UC identities, and logical concepts.
- [x] Active MVP diagrams contain no Reassessment flow and reflect the approved lesson, SRS, curriculum, assessment-authoring, Admin account, and data concepts.
- [x] No example question count becomes an invariant; no A1/Unit 1/80% is a platform invariant; no active MVP Reassessment; Policy B includes recurrence after the final stage.
- [x] Render every canonical PlantUML source; renderer reports zero errors; output/manifest match source set.
- [x] Check active UC catalog and traceability, duplicate diagram source IDs, `git diff --check`, and manually review final diff.
- [x] Record exact observed verification in `logs/test-log.md` and work summary in `logs/development-log.md`; update `HANDOFF.md` and this task status.

**Completed:** 2026-10-10. Evidence: `T-PRP-001`; all 36 sources rendered to 72 outputs; seven ADR-036 static checks PASS; `git diff --check` exit 0. No application implementation, schema changes, live DB operations, staging, or commit.

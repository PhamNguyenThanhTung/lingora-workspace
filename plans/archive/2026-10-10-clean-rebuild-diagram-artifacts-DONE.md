# Current Task — Clean Rebuild of Lingora Diagram Artifacts

**Status:** DONE
**Approval:** Product Owner explicit instruction (2026-10-10) authorizes complete deletion of legacy diagram artifacts and clean rebuild of modeling baseline from canonical authorities (ADR-030–035, requirements, use-case specifications). AGENTS.md permits direct authorization of documentation/modeling work. Zero application source, API, Prisma, migration, seed, RLS/RPC or DB data changes.
**Prior task:** Full CURRENT + TARGET Modeling Review was completed and approved. This task executes the clean rebuild of modeling artifacts requested by Product Owner.

## Scope and permitted files/actions

1. Inventory all legacy diagram sources (.puml, .plantuml), generated outputs (.png, .svg), and diagram-specific catalogs/indexes across the repository.
2. Delete legacy standalone diagram artifacts:
   - `docs/diagrams/current-target-2026-10-10/**`
   - `docs/diagrams/lingora-modeling/**`
   - `docs/plantuml/**`
   - `docs/report/diagrams/**`
   - `docs/diagrams/` (remove empty parent directory)
3. Establish new canonical modeling directory: `docs/modeling/current-target/`
   - `src/` for clean PlantUML sources
   - `rendered/` for rendered SVG and PNG outputs
   - `README.md` for Product Owner Review Index & Navigation
   - `review.md` for audit, gap analysis, and readiness conclusion
   - `render.py` for reproducible local rendering
4. Construct complete set of 36 fresh, authoritative diagrams covering:
   - System (Context, Components for CURRENT and TARGET)
   - Use Cases (Overall, Learner, Teacher, Admin for TARGET)
   - Activities (9 business flows)
   - States (Account, Assignment, Content Revision)
   - Domain (Core Domain Model)
   - Data (CURRENT Migration, CURRENT Prisma, TARGET Logical ERD; Live DB marked UNVERIFIED and omitted)
   - Sequences (9 critical interaction/security flows)
   - Security (Trust Boundary & DFD)
   - Deployment (CURRENT and TARGET)
5. Enforce all target rules: 3 single roles, no AI runtime, Unit as logical concept only (physical table deferred), neutral SRS recall outcome terms, Policy B server-computed, answer secrecy, PO decisions MR-Q01/Q02/Q03 reflected.
6. Render all diagrams with zero PlantUML errors and verify with automated script.
7. Update pointers in `docs/README.md`, `docs/QUICK-REF.md`, `HANDOFF.md`, and log files.

## Out of scope

No application source, API, dependency manifest, Prisma, migration, seed, RLS/RPC or DB data changes; no modification of canonical textual requirements, ADRs, or UC specifications.

## Work and acceptance

- [x] Complete inventory and delete legacy diagram artifacts.
- [x] Create `docs/modeling/current-target/` structure and `style.puml`.
- [x] Author all 36 clean PlantUML sources according to ADR-030–035.
- [x] Render all 36 sources to SVG and PNG (72 outputs) with zero errors.
- [x] Author `README.md` (PO Review Index) and `review.md` (Audit, Gaps, Readiness).
- [x] Verify zero prohibited legacy terms, zero broken references, clean `git diff --check`.
- [x] Update repository pointers, HANDOFF.md, and test/development logs.

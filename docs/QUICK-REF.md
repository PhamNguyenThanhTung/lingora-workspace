# Lingora — Quick Reference

> **CURRENT snapshot: 2026-10-20.** [Authority map](README.md), [repository audit](repository-audit-2026-10-16.md). Task status lives only in [current-task](../plans/current-task.md); operational context in [HANDOFF](../HANDOFF.md).

## Current redesign boundary

**Latest review (2026-10-20):** [Full design review](design/full-design-review-2026-10-20.md) is complete with seven open findings (3 P1 / 4 P2): UI guidance, logical assembly/revision/provenance and physical key/receipt/purpose mapping. Verdict NEEDS DESIGN RECONCILIATION; report-accuracy independently checked, no design corrections or new approvals. Current-task is DONE for review only; no follow-on task active.

**Use Case + Activity + Class Diagram baseline established.** [Class review](modeling/current-target/class-review-2026-10-16.md) completed semantic/trace/cardinality, independent and visual acceptance. Database-design reconciliation is COMPLETE under the PO database request: [current reconciliation](design/physical/database-reconciliation-2026-10-20.md) updates the 34-table proposal against this baseline and ADR-043. Physical mechanisms remain PROPOSED / NOT IMPLEMENTED; implementation planning/execution and live migrations are not authorized by documentation acceptance. Independent documentation review PASS; current-task is DONE for reconciliation only. No follow-on task active.

Exactly three business roles: **Admin, Teacher, Learner**, one role per account (ADR-034). Admin assigns/reassigns work, reviews, approves and publishes; assigned Teachers author content; Learners self-register and learn. Old six-role matrices and two-role SQL are legacy artifacts, not the redesign permission model.

## What actually exists

| Area | Verified repository state |
|---|---|
| Learner web | Supabase SSR auth/register/logout, session middleware, vi/en UI; routes `/`, `/login`, `/register`. Home is a foundation shell. |
| Learning flows | Placement, learning contexts, course/lesson execution, progress and SRS runtime absent. Tables or seed data do not implement them. |
| Admin | Prisma/schema/migrations/seed and historical DB harnesses; no Admin web app. Root Admin startup/build aliases target missing package scripts. |
| Database | Prisma six roles plus assignedRoles versus SQL LEARNER/ADMIN; legacy artifacts disagree. Live DB and deployed security unverified. |
| AI | No tracked AI runtime or learner AI proxy/routes. Ignored local cache and separate public staging are not current app source. |

## Design sources and boundaries

| Topic | Source and status |
|---|---|
| Approved product/domain rules | [Decision log](../logs/decision-log.md): ADR-030–036, ADR-041–043, each within its scope. No physical/implementation authorization. |
| Behavioral catalog | [UC specifications](use-case-specifications.md): 14 identities, reminder UC-03 deferred; Reassessment outside MVP. [Requirements](02-requirements.md) scoped addenda support these rules. |
| Use Case | [Canonical sources](modeling/current-target/README.md), UC-01–04; [nine report views](modeling/report-usecases/README.md), VIEW-RUC identifiers do not renumber UCs. |
| Activity | Canonical ACT-01/02/03/04/06/07/08/09. Corrected v2 layout saved in primary after independent acceptance on 2026-10-17; source-faithful routing repairs preserve approved behavior. Historical candidate retained. |
| Class | COMPLETE: 22 classes + 1 enum / 28 relationships; DOM-01 source, PNG/SVG and primary native page 29 synchronized. `Unit` / `AssessmentBlueprintVersion`; [review/trace](modeling/current-target/class-review-2026-10-16.md). Earlier candidate/history preserved. |
| Native editing | [44-page Draw.io](modeling/current-target/lingora-all-diagrams.drawio); Latest eight-page Activity merge preserved other 36 pages, including DOM, byte-for-byte; native and artifact integrity checks PASS. Do not run a full-bundle builder for a single page. |
| Database design | [Reconciled proposal](design/physical/database-reconciliation-2026-10-20.md): 34-table catalog/security/four-view ERD; system assembly, Lesson-only assignments and exact source episodes. Independent review PASS after one correction round; static checks/render/source parity PASS. Live DB UNVERIFIED; older READY verdicts are historical. |
| Later logical views | Sequence/DATA/state/security/deployment diagrams still require reconciliation with accepted Class and ADR-043; unchanged native bundle is not claimed updated by database work. |
| Planning | [Next design plan (2026-10-20)](../plans/2026-10-20-next-design-plan.md) originally proposed Sequence first; PO subsequently prioritized database reconciliation. Remaining logical tasks are proposals, not automatic follow-on authorization. [Old Phase 2 roadmap](../plans/archive/2026-10-07-master-implementation-and-report-plan-SUPERSEDED.md) remains historical, not execution instructions. |

DOM closeout is in [current class evidence](modeling/current-target/evidence/2026-10-16-class-review/independent-review.md); [old completion evidence](modeling/current-target/evidence/2026-10-12-class-design-completion/) and its [unfinished report](modeling/current-target/class-design-completion-2026-10-12.md) remain historical. The [original Activity v2 evidence](modeling/current-target/evidence/2026-10-12-ad-layout-v2/) is unchanged; [corrected Activity acceptance](modeling/current-target/evidence/2026-10-16-activity-layout/independent-review.md) covers the saved primary layout. Seventeen stale source hashes are reconciled. [Maintenance closeout](modeling/current-target/modeling-closeout-2026-10-16.md) records current verification. Use `verify_current.py` for current 36-source/72-output and 44-page integrity; old task-specific verifiers and snapshots remain historical. Artifact integrity does not approve downstream designs.

## Approved semantic guardrails

ADR-030/031: curriculum scoped by language/framework; one context per learner/language, at most two ACTIVE; account-global profile/streak, context-owned learning state; LearningPlan/Progress may be derived. ADR-032: Placement recommends a starting level, not verified proficiency; self-report/default entry supported. ADR-033/036: completion separate from correctness/performance; configured curriculum gate plus passed Level-up; Jump and Reassessment deferred. ADR-035: trusted server identity/role/status, assignment versus revision lifecycle, assessment grading secrecy, trusted/idempotent SRS, audit. ADR-041: internal due/overdue SRS selection, excluded from immutable scored assessments. ADR-042: context Study Focus biases next supplementary practice only. ADR-043: system assembles Teacher-submitted Lesson question packages by blueprint; Admin reviews/approves/publishes, with no separate whole-assessment Teacher assignment. Fixed English counts/thresholds are not platform invariants.

## Navigation

Use [AGENTS.md](../AGENTS.md) for workflow, [docs/README.md](README.md) for topic authority, [environment notes](../ENVIRONMENT.md) for dated toolchain context. Architecture, API, data, traceability and old logical design documents are routed through that authority map; do not infer current implementation or accepted physical schema from their existence. The audit preserves dated reviews, approvals, logs and source/export provenance rather than overwriting historical evidence.

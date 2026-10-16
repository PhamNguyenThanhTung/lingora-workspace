# Lingora — Quick Reference

> **CURRENT snapshot: 2026-10-16.** [Authority map](README.md), [repository audit](repository-audit-2026-10-16.md). Task status lives only in [current-task](../plans/current-task.md); operational context in [HANDOFF](../HANDOFF.md).

## Current redesign boundary

**Use Case + Activity baseline → Class Diagram IN PROGRESS.** The user has paused downstream design/implementation while the repository is cleaned. Next design work is to review and complete Class Diagram against the sources below. No physical approval, rebuild, migration or application implementation task is active.

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
| Approved product/domain rules | [Decision log](../logs/decision-log.md): ADR-030–036, ADR-041/042, each within its scope. No physical/implementation authorization. |
| Behavioral catalog | [UC specifications](use-case-specifications.md): 14 identities, reminder UC-03 deferred; Reassessment outside MVP. [Requirements](02-requirements.md) scoped addenda support these rules. |
| Use Case | [Canonical sources](modeling/current-target/README.md), UC-01–04; [nine report views](modeling/report-usecases/README.md), VIEW-RUC identifiers do not renumber UCs. |
| Activity | Canonical ACT-01/02/03/04/06/07/08/09. Primary native layout is the saved baseline; interrupted Activity v2 candidate is retained separately, not declared saved/DONE. |
| Class | DOM-01 PUML/PNG/SVG and class candidate contain 23 classifiers/28 relations; primary native has older 23/24. Both are preserved, explicitly IN PROGRESS. Completion report lacks closeout. |
| Native editing | [44-page Draw.io](modeling/current-target/lingora-all-diagrams.drawio); only DOM has visible source drift. Do not run a full-bundle builder to merge a single page. |
| Later design | Sequence/logical data/security/deployment views and [physical proposal](design/physical/README.md) require reconciliation after class review. Historical READY verdicts do not advance today's design stage. |
| Planning | [Old Phase 2 roadmap](../plans/archive/2026-10-07-master-implementation-and-report-plan-SUPERSEDED.md) and archived plans are historical context, not execution instructions. |

DOM work is recoverable in [class completion evidence](modeling/current-target/evidence/2026-10-12-class-design-completion/) and its [unfinished report](modeling/current-target/class-design-completion-2026-10-12.md). The [Activity v2 evidence](modeling/current-target/evidence/2026-10-12-ad-layout-v2/) contains entry/candidate/export checks but no accepted primary save. Old task snapshots remain immutable; superseding unfinished work is not claiming it complete.

## Approved semantic guardrails

ADR-030/031: curriculum scoped by language/framework; one context per learner/language, at most two ACTIVE; account-global profile/streak, context-owned learning state; LearningPlan/Progress may be derived. ADR-032: Placement recommends a starting level, not verified proficiency; self-report/default entry supported. ADR-033/036: completion separate from correctness/performance; configured curriculum gate plus passed Level-up; Jump and Reassessment deferred. ADR-035: trusted server identity/role/status, assignment versus revision lifecycle, assessment grading secrecy, trusted/idempotent SRS, audit. ADR-041: internal due/overdue SRS selection, excluded from immutable scored assessments. ADR-042: context Study Focus biases next supplementary practice only. Fixed English counts/thresholds are not platform invariants.

## Navigation

Use [AGENTS.md](../AGENTS.md) for workflow, [docs/README.md](README.md) for topic authority, [environment notes](../ENVIRONMENT.md) for dated toolchain context. Architecture, API, data, traceability and old logical design documents are routed through that authority map; do not infer current implementation or accepted physical schema from their existence. The audit preserves dated reviews, approvals, logs and source/export provenance rather than overwriting historical evidence.

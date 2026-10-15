# Lingora Documentation

## Source-of-truth policy

The repository has topic-specific authorities; `docs/` membership alone does not make a statement current or approved. At task start, read `plans/current-task.md`, `docs/QUICK-REF.md`, `HANDOFF.md`, then this index. Read the controlling topic source listed below. `AGENTS.md` controls agent procedure; this file controls documentation authority and supersession.

### Authority order

1. The active, human-authorized scope in `plans/current-task.md` controls what may be done in the current task. An approval applies only to that scope.
2. `logs/decision-log.md` records approved architecture and product decisions. A decision controls only the subject it explicitly resolves; a later approval supersedes an earlier one only within the approved scope.
3. Immutable snapshots in `plans/approved/` authorize only the named scope while referenced by the active `plans/current-task.md`. Completed or superseded snapshots are `HISTORICAL`; their old approval does not authorize new work. A plan draft or task status without current approval evidence and snapshot does not authorize implementation.
4. Accepted design documents control their named TARGET design only. They do not prove runtime or database deployment.
5. Repository source and ordered SQL migrations establish CURRENT repository artifacts. A live deployment or applied database state requires dated environment/catalog evidence; prose, Prisma alone, and old test logs do not establish it.
6. `plans/master-implementation-and-report-plan.md` is a draft TARGET roadmap and the existing P0 decision backlog. It does not independently authorize a milestone.

If the authorities disagree, label the affected rule `CONFLICT`, do not combine or select behavior by inference, and keep dependent implementation out of scope until the named decision is approved and recorded.

### Required classifications

| Classification | Meaning |
|---|---|
| `CURRENT` | Verified repository artifacts or dated runtime evidence; not a future design claim. |
| `TARGET` | Approved future design; not implemented or deployed by virtue of being documented. |
| `PROPOSED` | Direction or detail with no recorded approval. |
| `HISTORICAL` | Previous approved or implemented state retained as evidence. |
| `SUPERSEDED` | No longer controlling; the replacing source is named. |
| `CONFLICT` | Sources disagree and no controlling approval resolves the difference. |

`ke-hoach-chi-tiet/` was the legacy planning directory. It has been removed after full migration verification (M0). The migration map below is retained as a historical traceability record only.

The final product name is **Lingora**. The following are documented architectural boundaries, not proof that every subsystem exists in the current checkout:

```text
lingora-web/    # Learner Web Platform (Next.js 15, SSR Auth, UI)
lingora-admin/  # Admin & Content Studio (Next.js 15, Prisma 6, Content Workflow)
lingora-ai/     # Supporting AI Capability Service (Python 3.11, FastAPI, GEC)
└── api/
```

## Full Diagram Correction Pass & Final Modeling Review (2026-10-11)

- **Correction Pass:** [Canonical correction report](modeling/current-target/review.md) records all 36 sources (30 TARGET, 5 CURRENT repository/configuration views, 1 deferred scope marker). Presentation, UML/data abstraction, and 11-concern consistency were corrected.
- **Final Modeling Review and 3-point correction:** [Final review report](modeling/current-target/final-review.md) records the bounded recheck after the previous review. Verdict: **MODELING APPROVED** / **READY FOR PHYSICAL DESIGN**. It confirms there is no Assignment `CLOSED` state, Level-up readiness/pass parameters are configured without a platform-wide 100% lesson gate, and progress counts published active required lessons even when normal progression has not unlocked them. Unpublished/unavailable and withdrawn-incomplete content remains excluded. Only ACT-01 and ACT-09 were changed and rerendered; no physical design or implementation was started. See [diagram index](modeling/current-target/README.md) and [correction evidence](modeling/current-target/evidence/final-three-point-correction.md).

## Proposed Physical Data & Runtime Design (2026-10-11)

[Physical design](design/physical/README.md) and [conditional rebuild plan](design/physical/rebuild-plan.md) are **PROPOSED PHYSICAL DESIGN — NOT IMPLEMENTED**. They map approved logical modeling to 34 proposed tables, auth/RLS/runtime boundaries, four-view physical ERD and future acceptance tests. The task authorizes inspection/design only; technical choices are not yet approved. Live DB remains **LIVE DB UNVERIFIED**. Design review must precede any Implementation Plan, Prisma/migration/database or application change. [Review evidence](design/physical/review-and-verification.md) records independent defects/corrections and observed documentation checks.

**Final independent review (2026-10-11):** [Final A–S review](design/physical/final-review.md) returned **NEEDS PHYSICAL CORRECTION / NOT READY FOR IMPLEMENTATION PLANNING**, with F01–F12 open at that review gate. Recommended table count remains 34; CLEAN REBUILD is conditional on separate live inventory/preservation/restore/cutover gates. Earlier physical readiness is historical input, not approval. That review changed only review/status/evidence; no physical correction or implementation was applied in it. The subsequently authorized correction pass is recorded below.

**Physical correction pass (2026-10-11):** [Correction report](design/physical/correction-pass.md) records the bounded F01–F12 documentation changes; the independent [closure recheck](design/physical/independent-recheck.md) found all twelve CLOSED. F10 follows approved ACT-01; F12 now has explicit positive and negative coverage-tag scenarios. These cases are specified but NOT EXECUTED, so the physical design remains PROPOSED and the live database remains UNVERIFIED. Next is a separate FINAL PHYSICAL DESIGN REVIEW; implementation planning still requires that review's explicit approval.

## Canonical documents

| Document | Authority |
|---|---|
| [QUICK-REF.md](QUICK-REF.md) | First-read project snapshot: CURRENT repository state, TARGET intent, known conflicts, and task-specific pointers. Sections 1–5 are explicitly marked `HISTORICAL / SUPERSEDED` as operational instructions. |
| [use-case-specifications.md](use-case-specifications.md) | Current 14-entry behavioral catalog with versioned crosswalks to inherited 15-entry catalogs. ADR-030–036 control only their recorded domain/logical scope: ADR-034 roles/responsibilities; ADR-032 Placement; ADR-033 completion/progression/activity; ADR-035 identity security, assignment/content lifecycle, assessment secrecy, SRS trust, and audit policy; ADR-036 revised lesson attempts, SRS enrollment, curriculum availability, assessment packages/versions, Reassessment deferral, and Admin learner-account scope. UC-03 reminders are deferred; Reassessment is not an active MVP UC. English configuration is not selected by UC text alone. Physical realization/live state remains open; this is not implementation approval. |
| [01-architecture.md](01-architecture.md) | Phase 0 architecture reference; accepted Phase 1 architecture TARGET is [M2.4](phase-1-m2-4-architecture-security.md). ADR-030/031/032/033/034/035 record curriculum, learner-state, assessment/progression, business-role, and logical security policies without implementation authorization or physical-schema changes. Current code determines runtime; database/security deployment facts require read-only reconciliation. |
| [02-requirements.md](02-requirements.md) | Mixed historical and proposed requirements, not blanket product approval. The current MVP Product Baseline Addendum is controlled by ADR-036 for lesson attempts, SRS enrollment, curriculum availability, assessment versions/purposes, and Admin learner support; ADR-034 controls current roles and ADR-035 logical security/governance. Legacy sections are historical where marked and do not override these decisions. Physical implementation remains unauthorized and deferred. |
| [03-api-contract.md](03-api-contract.md) | Read-only legacy AI API contract. Its existence does not establish that the AI service or compatibility routes exist in the current checkout or are in active implementation scope. |
| [04-data-model.md](04-data-model.md) | Historical and target data-model reference. ADR-030/031/032/033/034/035/036 control their recorded logical domain/product policies only; none decides physical schema. ADR-036 adds attempt/performance, completion, SRS enrollment/history, curriculum eligibility, assessment blueprint/version, and audited learner support concepts without requiring one table per concept. Current artifacts are `lingora-admin/prisma/schema.prisma` plus ordered SQL migrations; they disagree, including six Prisma roles plus `assignedRoles` versus two SQL role values. Physical mapping/RLS, assignments, publication, results, SRS, audit, `UserProgress.score`, performance/attempt representation, and `Profile.dailyGoalMin` remain deferred. Migration history does not establish live DB state. |
| [05-traceability-matrix.md](05-traceability-matrix.md) | Current ADR-034–036 product/security traceability addenda plus an unchanged historical Phase 0 19-function/15-UC catalog. Historical implementation/test statuses are not current evidence; current catalog crosswalk is in `use-case-specifications.md`. |
| [phase-1-m2-1-domain-and-logical-data-foundation.md](phase-1-m2-1-domain-and-logical-data-foundation.md) | Accepted logical domain TARGET. Logical entities and fields are not physical schema or implementation. ADR-030 controls the approved curriculum/framework scope; ADR-031 supersedes its single-`LearnerProfile` ownership assumptions where state must be per context and does not require persisted `SkillProfile` by default. The historical design is not rewritten. |
| [phase-1-d3-assessment-learning-engine-design.md](phase-1-d3-assessment-learning-engine-design.md) | Accepted, historical assessment-engine TARGET. Progress/proficiency/mastery/readiness distinctions, two assessment classification axes, and immutable completed `AssessmentResult` concept remain where compatible. ADR-030/031/032/033/035 control curriculum, context ownership, Placement, completion/progression/activity, and logical answer/result security. Single-`LearnerProfile` ownership and unconditional persisted-`SkillProfile` assumptions are superseded within ADR-031 scope; stage-adaptive diagnostic is deferred by ADR-032; conflicting D06 rules are superseded within ADR-033; ADR-035 constrains assessment feedback/secrecy but approves no physical representation. The D3 file remains unchanged historical evidence. |
| [phase-1-d4-content-curriculum-design.md](phase-1-d4-content-curriculum-design.md) | Proposed logical curriculum/content design; header says `READY FOR INDEPENDENT REVIEW`, so it is not an accepted implementation authority. ADR-030 controls accepted P0-D04 curriculum decisions and ADR-035 controls logical assignment/content lifecycle and publication-unit behavior; other D4 content remains proposed. |
| [phase-1-m2-4-architecture-security.md](phase-1-m2-4-architecture-security.md) | Accepted architecture/security TARGET (ADR-027); supersedes Phase 0 architecture where covered, subject to later approved decisions. Its six-role names and actor/permission mapping are historical/superseded by ADR-034/035 for current business/logical security semantics; physical enforcement and deployment state remain deferred. |
| [phase-1-m2-6-design-handoff.md](phase-1-m2-6-design-handoff.md) | Accepted handoff only (ADR-029); does not approve Phase 2 implementation. |
| [phase-1-m2-2-behavior-uc-activity-state.md](phase-1-m2-2-behavior-uc-activity-state.md) | `SUPERSEDED` for current use-case behavior/actors by `use-case-specifications.md`; retained as historical design evidence. ADR-034/035 control current business/logical security and content responsibility; ADR-032/033 control Placement and progression/activity where older M2.2 statements conflict. UC IDs are catalog-local and crosswalked in the current specification. |
| [08-english-a1-curriculum.md](08-english-a1-curriculum.md) | English A1 MVP `TARGET` content only; unit/lesson counts and sequence are not platform-wide architecture. |
| [09-placement-and-jump-specification.md](09-placement-and-jump-specification.md) | Earlier English A1 Placement/Jump `HISTORICAL` specification and approval evidence. ADR-032 supersedes conflicting MVP Placement defaults; ADR-033 defers Jump as an MVP progression mechanism and supersedes its 95%/24-hour policy as a default. English counts, time, blueprint, thresholds, mapping (including historically approved Mapping A), and level-up settings remain configuration candidates requiring review. Historical approval remains intact. |
| [archive/phase-0/phase-0-roles-and-mvp-final.md](archive/phase-0/phase-0-roles-and-mvp-final.md) | `HISTORICAL` Phase 0 roles and MVP. Its role names/responsibilities are superseded by ADR-034/035 for current business/logical security semantics; physical account-role mapping remains deferred. |
| `Historical six-role matrix (legacy)` | Historical six-role M2.4 permission/security target. The legacy standalone artifact was deleted in the clean diagram rebuild. Canonical modeling baseline is at [modeling/current-target/](modeling/current-target/). ADR-034/035 control current business/logical security policy; physical enforcement remains deferred. |
| [06-system-analysis.md](06-system-analysis.md) and [07-data-dictionary.md](07-data-dictionary.md) | Historical Phase 0 analysis/data-dictionary sources. Neither is current role or physical-schema authority; use ADR-034/035 for business/logical security policy and Full CURRENT + TARGET Modeling Review for physical reconciliation. |
| [00-master-plan.md](00-master-plan.md) | `HISTORICAL` Phase 0 priorities and roadmap; not Phase 2 task authorization. Its old P0 AI/GEC items are not current Phase 2 priorities. |

Workflow authority lives in [AGENTS.md](../AGENTS.md). The single task-status pointer is [plans/current-task.md](../plans/current-task.md); `DONE` means no follow-on task is active until a new one is recorded. [HANDOFF.md](../HANDOFF.md) summarizes operational state. The Phase 2 roadmap and decision queue are in `plans/master-implementation-and-report-plan.md`; that roadmap is a draft and does not authorize implementation. Accepted decisions remain in `logs/decision-log.md` (ADR-030 P0-D04, ADR-031 P0-D03, ADR-032 P0-D05, ADR-033 P0-D06, ADR-034 P0-D02, ADR-035 P0-D07 logical product/security target, ADR-036 MVP product revision); evidence belongs in `logs/test-log.md` and `logs/development-log.md`.

## Classification legend

- `ORIGINAL`: unique source content migrated to its canonical destination.
- `DUPLICATE`: source repeats content already migrated from another source; canonical text appears once.
- `MISSING`: source refers to information that is not present in the repository.
- `CONFLICT`: two sources disagree; no silent resolution is allowed.
- `UNCLEAR`: source explicitly leaves a decision unconfirmed or has ambiguous scope.

## Migration map

| Source | Destination | Action | Status |
|---|---|---|---|
| `plan` | `00-master-plan.md` | Preserve high-level product/stack/deployment overview; naming normalized to Lingora | DUPLICATE |
| `00-tong-quan-va-lo-trinh.md` §§0.1–0.5 | `00-master-plan.md` | Migrate assumptions, principles, P0/P1/P2, 12-week roadmap, cuts and deliverables | ORIGINAL |
| `01-kien-truc-he-thong.md` §§1.1–1.2, 1.5, 1.7–1.8 | `01-architecture.md` | Migrate topology, responsibilities, auth flow, repo layout and scalability; naming normalized | ORIGINAL |
| `01-kien-truc-he-thong.md` §1.6 | `03-api-contract.md` | Migrate requests, responses, errors, supporting endpoints and invariants | ORIGINAL |
| `01-kien-truc-he-thong.md` §§1.3–1.4 | `04-data-model.md` | Migrate schema excerpt, SQL/RLS/RPC, Scheduler boundary and exercise payloads | ORIGINAL |
| `02-phan-tach-yeu-cau-bao-cao.md` §§2.0–2.4 | `02-requirements.md` | Migrate three-report separation, scope, Must/Nice artifacts, outlines and matrix | ORIGINAL |
| `03-tech-stack.md` §§3.1–3.6 | `01-architecture.md` | Migrate approved stack, libraries, model strategy, datasets, estimates and fallbacks | ORIGINAL |
| `03-tech-stack.md` §3.7 | `01-architecture.md` | Retain week-1 initialization commands as future execution reference only | ORIGINAL |
| `04 phuong phap trien khai` §§4.1–4.5 | `00-master-plan.md`, `AGENTS.md`, `logs/test-log.md` | Migrate delivery method, Git/DoD/test baseline; workflow rules already represented once | DUPLICATE |
| `04 phuong phap trien khai` §4.6 | `00-master-plan.md`, `02-requirements.md` | Migrate model acceptance and latency protocol | ORIGINAL |
| `05 rui ro va trien khai` §§5.1–5.7 | `00-master-plan.md`, `03-api-contract.md`, `04-data-model.md` | Migrate risks, fallback/mock, deployment, secrets, demo and citations | ORIGINAL |
| `archive/06 quy trinh lam viec.md` §§6.3–6.6 | `AGENTS.md`, `plans/`, `logs/` | Workflow fully represented by current framework | DUPLICATE |
| `archive/06 quy trinh lam viec.md` §§6.1–6.2 | `00-master-plan.md`, `01-architecture.md`, this file | Product/repository/document split represented with approved Lingora names | DUPLICATE |
| `archive/06 quy trinh lam viec.md` §§6.7–6.8 | `AGENTS.md`, `DESIGN.md` | Preserved as historical guidance; design tokens limited to UI/UX | DUPLICATE |
| Legacy schema comment: omitted Course/Lesson/Vocabulary/Exercise/UserProgress definitions | `04-data-model.md` | Record unavailable referenced schema rather than inventing it | MISSING |
| `ChatMessage.naturalnessScore` vs API `grammatical_acceptability_score` | `04-data-model.md`, `03-api-contract.md` | Preserve both source definitions and flag discrepancy | CONFLICT |
| `/health` described as Render keep-alive vs prohibition on ping-based warming | `03-api-contract.md`, `00-master-plan.md` | Preserve endpoint and risk rule; intended operational use requires decision | CONFLICT |
| Legacy assumptions G1/G2 and reward/leaderboard detail | `00-master-plan.md`, `02-requirements.md` | Preserve as unconfirmed assumptions/open scope | UNCLEAR |
| Legacy `docs/model_registry.csv` location vs framework `logs/model-registry.csv` | `00-master-plan.md`, `logs/model-registry.csv` | Framework decision makes `logs/model-registry.csv` canonical; metrics unchanged | CONFLICT — RESOLVED BY APPROVAL |
| Legacy `app + ml/srs + ml/chatbot` vs `api + ml_srs + nlp_chatbot` | `01-architecture.md` | Use explicitly approved Lingora repository boundaries | CONFLICT — RESOLVED BY APPROVAL |

## Migration status

- Canonical documents `00` through `05`: M0 migration plus M0.5 approved normalization.
- Product/repository naming: normalized to Lingora where naming-only.
- Legacy workflow (`ke-hoach-chi-tiet/archive/06 quy trinh lam viec.md`): archived after coverage verification; the entire `ke-hoach-chi-tiet/` directory was subsequently removed (cleanup task, 2026-08-14).
- M0.5 resolves the approved core-model, ownership, locale, streak, health, response-metadata, grammar-score and REORDER decisions through normative override sections while preserving migrated findings as history.
- No feature implementation, dependency, migration, endpoint, UI, or model work was performed.

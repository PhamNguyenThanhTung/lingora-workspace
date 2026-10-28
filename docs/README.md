# Lingora Documentation

> **Quy trình hiện hành — 2026-10-28:** Chủ dự án đã hủy `WP-DB-REMAIN-01`, preapply/Stage A/Stage B và cổng DATABASE READY để bắt đầu code app. Làm theo [AGENTS.md](../AGENTS.md): KISS, validation tại Backend, từng vertical slice. Đợt dọn dẹp tài liệu `DOC-CLEAN-01` đã hoàn tất (xem [báo cáo dọn dẹp](repository-cleanup-2026-10-28.md)). Các yêu cầu audit/hash/review và trạng thái vận hành cũ trong các tài liệu lịch sử không phải chỉ thị thực thi hiện hành. Chỉ đọc tài liệu liên quan đến tính năng đang làm. [Kết quả reset](../docs/pragmatic-reset-2026-10-28.md).

> **Hiện trạng nền tảng & Tác vụ tiếp theo:**
> - **Mã nguồn hiện có:** Workspace `lingora-admin/` chứa product Prisma schema (34 models), 4 migration đã áp dụng, seed và module DB tại `src/server/db/index.js`. Chưa có web framework, UI hay ứng dụng đăng nhập trong checkout này.
> - **Test harness:** Disposable native test harness trong `lingora-admin/tests/database/` đang parked và tách biệt khỏi runtime sản phẩm.
> - **Đề xuất slice tiếp theo:** Vertical slice 1: [Quản lý Ngôn ngữ cho Admin](../plans/2026-10-27-next-app-slice.md), bao gồm xác thực phiên đăng nhập và kiểm tra quyền Admin tại Backend.
> - **Thẩm quyền hiện hành:** Tác vụ đang thực hiện tại [current-task](../plans/current-task.md); thông tin vận hành tại [HANDOFF](../HANDOFF.md).
> - **Tài liệu tham khảo lịch sử:** Các báo cáo kỹ thuật trước đây (như [Remediation Review 2026-10-27](design/physical/evidence/2026-10-27-product-database-finalize/remediation-review.md), [RDR correction](design/rdr-correction-2026-10-22.md), [phased spec](../plans/2026-10-22-database-runtime-implementation-spec.md) và kết quả harness G0) được bảo toàn làm tài liệu kỹ thuật/bằng chứng lịch sử, không còn đóng vai trò là các cổng chặn thực thi code ứng dụng.

> **Relocation notice (2026-10-28):** Root `scratch/` (slide builders, report verification tooling, and visual assets) has been relocated to [`docs/scratch/`](scratch/); historical references to `scratch/` in past review logs, evidence manifests, and archived specs refer to this moved location.

## Source-of-truth policy

The repository has topic-specific authorities; `docs/` membership alone does not make a statement current or approved. Read only the topic source needed for the current feature; the former mandatory entry chain is retired. `AGENTS.md` controls agent procedure; this file controls documentation authority and supersession.

### Authority order (Current Source-of-Truth Chain)

To determine current Lingora product, domain, and behavioral design, agents MUST follow this strict precedence:

1. **Current accepted product/domain ADRs** that are not superseded (`logs/decision-log.md`: ADR-030–036, ADR-041–044). A decision controls only the subject it explicitly resolves.
2. **Current requirements & behavioral/modeling sources**:
   - [`docs/use-case-specifications.md`](use-case-specifications.md) (Current 14-entry behavioral catalog; UC-03 reminder deferred; Reassessment absent from MVP).
   - [`docs/02-requirements.md`](02-requirements.md) (Current MVP Baseline Addendum: ADR-036 attempt scoring, vocabulary SRS enrollment, curriculum availability; ADR-041 SRS session boundaries; ADR-042 Study Focus).
   - [`docs/modeling/current-target/`](modeling/current-target/) (Canonical 36-source inventory: Use Case and Activity baselines; Class Diagram DOM-01 COMPLETE per [2026-10-16 review](modeling/current-target/class-review-2026-10-16.md). Downstream views are not reapproved by class completion).
3. **Current active task & authorized scope**:
   - [`plans/current-task.md`](../plans/current-task.md) controls what work is currently active and authorized.
   - Completed snapshots in `plans/approved/` and archived plans in `plans/archive/` are historical evidence; they do not authorize new work or override current domain rules.
4. **Current foundation & legacy implementation (Historical boundary)**:
   - Current foundation consists of `lingora-admin/` with the 34-model product schema, four migrations, seed, and `src/server/db/index.js`. No web framework, UI, or learner auth app currently exists.
   - The obsolete Web/Admin source, Prisma schema and SQL migrations were removed on 2026-10-22 and remain recoverable at Git `84baa85`. They do NOT define target behavior, permissions, future architecture or new-design progress.
5. **Design references, historical planning & reports**:
   - `docs/design/physical/` contains design references and dated reviews. Current physical mapping is recorded in the product Prisma schema and four migrations; each unimplemented mechanism remains a proposal within its own scope. Phase 0 plans and report workspaces (`docs/report/`, `docs/project-1/`, `docs/presentation/`) provide historical context and do not override current product decisions or task scope.

If authorities disagree, label the affected rule `CONFLICT`, do not combine or select behavior by inference, and route it to the owner in the active decision backlog.

### Required classifications

| Classification | Meaning |
|---|---|
| `CURRENT AUTHORITY` | Primary source controlling current product/domain behavior (active ADRs, current UC specs, MVP addenda, active task). |
| `CURRENT SUPPORTING REFERENCE` | Supporting context, design tokens, or reference checklists; does not override primary authority. |
| `HISTORICAL / SUPERSEDED` | Previously valid design or decision that has been replaced (e.g. 6-role models, legacy Jump/reassessment rules, Phase 0 plans). |
| `LEGACY IMPLEMENTATION EVIDENCE` | Removed or superseded implementation preserved for historical reference; it does not describe the current checkout. |
| `PROPOSED / UNAPPROVED` | A target capability or mechanism not implemented in current source; assess each proposal separately from the existing database foundation. |
| `REPORT / PRESENTATION ARTIFACT` | Academic reports, presentation scripts, or slide decks; frozen historical snapshots not governing product design. |
| `DELETE CANDIDATE` | Artifact with no historical, operational, verification, or design value that risks confusion. |
| `CONFLICT` | Sources disagree and no controlling approval resolves the difference. |

`ke-hoach-chi-tiet/` was the legacy planning directory. It has been removed after full migration verification (M0). The migration map below is retained as a historical traceability record only.

The final product name is **Lingora**. The following are historical target application boundaries. Only `lingora-admin/` currently exists, with the database foundation described above; its web runtime and the learner/AI applications are absent. Framework versions in this target sketch do not describe installed applications:

```text
lingora-web/    # Learner Web Platform (Next.js 15, SSR Auth, UI)
lingora-admin/  # Admin & Content Studio (Next.js 15, Prisma 6, Content Workflow)
lingora-ai/     # Supporting AI Capability Service (Python 3.11, FastAPI, GEC)
└── api/
```

## Historical modeling review and downstream physical proposals (2026-10-11–12)

The dated outcomes and next-step statements below describe those earlier tasks only. The Class baseline and [Activity/provenance maintenance](modeling/current-target/modeling-closeout-2026-10-16.md) are complete; historical next-step statements do not select a new task or approve downstream artifacts.

- **Correction Pass:** [Canonical correction report](modeling/current-target/review.md) records all 36 sources (30 TARGET, 5 CURRENT repository/configuration views, 1 deferred scope marker). Presentation, UML/data abstraction, and 11-concern consistency were corrected.
- **Final Modeling Review and 3-point correction:** [Final review report](modeling/current-target/final-review.md) records the bounded recheck after the previous review. Verdict: **MODELING APPROVED** / **READY FOR PHYSICAL DESIGN**. It confirms there is no Assignment `CLOSED` state, Level-up readiness/pass parameters are configured without a platform-wide 100% lesson gate, and progress counts published active required lessons even when normal progression has not unlocked them. Unpublished/unavailable and withdrawn-incomplete content remains excluded. Only ACT-01 and ACT-09 were changed and rerendered; no physical design or implementation was started. See [diagram index](modeling/current-target/README.md) and [correction evidence](modeling/current-target/evidence/final-three-point-correction.md).

## Physical database foundation and design history

The current [product Prisma schema](../lingora-admin/prisma/product/schema.prisma) has 34 models, with [four migrations](../lingora-admin/prisma/product/migrations/), seed and a server DB module. The [product database README](../lingora-admin/prisma/product/README.md) documents the current commands. Web UI, API routes and login remain unimplemented. This documentation update performs no live database checks and does not establish that every designed mechanism is complete or correct.

[Physical design](design/physical/README.md), [database reconciliation](design/physical/database-reconciliation-2026-10-20.md), [rebuild reference](design/physical/rebuild-plan.md) and [review evidence](design/physical/review-and-verification.md) provide topic-specific design and historical verification context. Current task scope follows [current-task](../plans/current-task.md) and [AGENTS.md](../AGENTS.md); the physical-review prerequisites from the earlier design-only tasks are retired.

Historical review sequence:

- **2026-10-11:** [Final A–S review](design/physical/final-review.md), [F01–F12 correction report](design/physical/correction-pass.md) and [closure recheck](design/physical/independent-recheck.md) record the findings and outcomes for those document revisions.
- **2026-10-12:** [Final A–R recheck](design/physical/final-recheck.md) recorded remaining F01/F02 findings; the later correction below records their closure. These dated results describe their original tasks, without selecting a new task or requiring another approval cycle.

## Approved Study Focus semantics and historical physical correction (2026-10-12)

[Study Focus addendum](study-focus-addendum.md) and ADR-042 control the additive product scope alongside unchanged ADR-036/041: one primary focus per owned context, default BALANCED, affecting next supplementary practice only. Independent internal due SRS remains separate from eligible authored-practice bias/fallback; shared core and scored pinned assessments stay unchanged. Canonical UC-01–14 remains unchanged.

The **2026-10-12** [A–L correction report](design/physical/personalization-and-final-correction.md) and [targeted review](design/physical/personalization-correction-evidence/independent-review.md) record F01/F02 closure with no table-count change (34→34). Their verifier results and task restrictions apply to those historical revisions; they do not describe current deployment or impose an approval prerequisite on the next application slice.

## Canonical documents

| Document | Authority |
|---|---|
| [QUICK-REF.md](QUICK-REF.md) | First-read project snapshot: CURRENT repository state, TARGET intent, known conflicts, and task-specific pointers. Sections 1–5 are explicitly marked `HISTORICAL / SUPERSEDED` as operational instructions. |
| [use-case-specifications.md](use-case-specifications.md) | Current 14-entry behavioral catalog with versioned crosswalks to inherited 15-entry catalogs. ADR-030–036 control only their recorded domain/logical scope: ADR-034 roles/responsibilities; ADR-032 Placement; ADR-033 completion/progression/activity; ADR-035 identity security, assignment/content lifecycle, assessment secrecy, SRS trust, and audit policy; ADR-036 revised lesson attempts, SRS enrollment, curriculum availability, assessment packages/versions, Reassessment deferral, and Admin learner-account scope. UC-03 reminders are deferred; Reassessment is not an active MVP UC. English configuration is not selected by UC text alone. Physical realization/live state remains open; this is not implementation approval. |
| [01-architecture.md](01-architecture.md) | Phase 0 architecture reference; accepted Phase 1 architecture TARGET is [M2.4](phase-1-m2-4-architecture-security.md). ADR-030/031/032/033/034/035 record curriculum, learner-state, assessment/progression, business-role, and logical security policies without implementation authorization or physical-schema changes. Current code determines runtime; database/security deployment facts require read-only reconciliation. |
| [02-requirements.md](02-requirements.md) | Mixed historical and proposed requirements. The current MVP Product Baseline Addendum is controlled by ADR-036 for lesson attempts, SRS enrollment, curriculum availability, assessment versions/purposes, and Admin learner support; ADR-034 controls current roles and ADR-035 logical security/governance. Legacy sections do not override these decisions. The product schema and four migrations form the existing database foundation; application features remain proposed and current task scope determines what work proceeds. |
| [03-api-contract.md](03-api-contract.md) | Read-only legacy AI API contract. Its existence does not establish that the AI service or compatibility routes exist in the current checkout or are in active implementation scope. |
| [04-data-model.md](04-data-model.md) | Historical and target data-model reference. ADR-030–036 control their recorded logical domain/product policies without requiring one table per concept. Removed artifacts at Git `84baa85` differ from the current product schema and are historical. Use `lingora-admin/prisma/product/schema.prisma` and its four migrations for the current physical mapping; application workflows and unresolved design/source concerns are tracked separately. Migration files alone do not establish live DB state. |
| [05-traceability-matrix.md](05-traceability-matrix.md) | Current ADR-034–036 product/security traceability addenda plus an unchanged historical Phase 0 19-function/15-UC catalog. Historical implementation/test statuses are not current evidence; current catalog crosswalk is in `use-case-specifications.md`. |
| [phase-1-m2-1-domain-and-logical-data-foundation.md](phase-1-m2-1-domain-and-logical-data-foundation.md) | Accepted logical domain TARGET. Logical entities and fields are not physical schema or implementation. ADR-030 controls the approved curriculum/framework scope; ADR-031 supersedes its single-`LearnerProfile` ownership assumptions where state must be per context and does not require persisted `SkillProfile` by default. The historical design is not rewritten. |
| [phase-1-d3-assessment-learning-engine-design.md](phase-1-d3-assessment-learning-engine-design.md) | Accepted, historical assessment-engine TARGET. Progress/proficiency/mastery/readiness distinctions, two assessment classification axes, and immutable completed `AssessmentResult` concept remain where compatible. ADR-030/031/032/033/035 control curriculum, context ownership, Placement, completion/progression/activity, and logical answer/result security. Single-`LearnerProfile` ownership and unconditional persisted-`SkillProfile` assumptions are superseded within ADR-031 scope; stage-adaptive diagnostic is deferred by ADR-032; conflicting D06 rules are superseded within ADR-033; ADR-035 constrains assessment feedback/secrecy but approves no physical representation. The D3 file remains unchanged historical evidence. |
| [phase-1-d4-content-curriculum-design.md](phase-1-d4-content-curriculum-design.md) | Proposed logical curriculum/content design; header says `READY FOR INDEPENDENT REVIEW`, so it is not an accepted implementation authority. ADR-030 controls accepted P0-D04 curriculum decisions and ADR-035 controls logical assignment/content lifecycle and publication-unit behavior; other D4 content remains proposed. |
| [phase-1-m2-4-architecture-security.md](phase-1-m2-4-architecture-security.md) | Accepted architecture/security TARGET (ADR-027), subject to later scoped decisions. Its six-role names and actor/permission mapping are superseded by ADR-034/035. Consult current source for implemented mechanisms and dated evidence for deployment observations; the target document does not prove runtime enforcement. |
| [phase-1-m2-6-design-handoff.md](phase-1-m2-6-design-handoff.md) | Accepted handoff only (ADR-029); does not approve Phase 2 implementation. |
| [phase-1-m2-2-behavior-uc-activity-state.md](phase-1-m2-2-behavior-uc-activity-state.md) | `SUPERSEDED` for current use-case behavior/actors by `use-case-specifications.md`; retained as historical design evidence. ADR-034/035 control current business/logical security and content responsibility; ADR-032/033 control Placement and progression/activity where older M2.2 statements conflict. UC IDs are catalog-local and crosswalked in the current specification. |
| [08-english-a1-curriculum.md](08-english-a1-curriculum.md) | English A1 MVP `TARGET` content only; unit/lesson counts and sequence are not platform-wide architecture. |
| [09-placement-and-jump-specification.md](09-placement-and-jump-specification.md) | Earlier English A1 Placement/Jump `HISTORICAL` specification and approval evidence. ADR-032 supersedes conflicting MVP Placement defaults; ADR-033 defers Jump as an MVP progression mechanism and supersedes its 95%/24-hour policy as a default. English counts, time, blueprint, thresholds, mapping (including historically approved Mapping A), and level-up settings remain configuration candidates requiring review. Historical approval remains intact. |
| [archive/phase-0/phase-0-roles-and-mvp-final.md](archive/phase-0/phase-0-roles-and-mvp-final.md) | `HISTORICAL` Phase 0 roles and MVP. Its role names/responsibilities are superseded by ADR-034/035 for current business/logical security semantics; physical account-role mapping remains deferred. |
| `Historical six-role matrix (legacy)` | Historical six-role M2.4 permission/security target. The legacy standalone artifact was deleted in the clean diagram rebuild. Canonical modeling baseline is at [modeling/current-target/](modeling/current-target/). ADR-034/035 control current business/logical security policy; physical enforcement remains deferred. |
| [06-system-analysis.md](06-system-analysis.md) and [07-data-dictionary.md](07-data-dictionary.md) | Historical Phase 0 analysis/data-dictionary sources. Neither is current role or physical-schema authority; use ADR-034/035 for business/logical security policy and Full CURRENT + TARGET Modeling Review for physical reconciliation. |
| [00-master-plan.md](00-master-plan.md) | `HISTORICAL` Phase 0 priorities and roadmap; not Phase 2 task authorization. Its old P0 AI/GEC items are not current Phase 2 priorities. |

Workflow authority lives in [AGENTS.md](../AGENTS.md). [plans/current-task.md](../plans/current-task.md) is the sole task-status pointer; [HANDOFF.md](../HANDOFF.md) supplies current operational context. Prior Phase 2 planning remains historical reference. Accepted decisions remain in `logs/decision-log.md` (ADR-030–036, ADR-041/042, each within scope); evidence belongs in `logs/test-log.md` and `logs/development-log.md`. Class review and the scoped Activity/provenance closeout are complete; no further task, physical approval or implementation planning is active.

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
| Legacy `docs/model_registry.csv` location vs empty `logs/model-registry.csv` placeholder | `00-master-plan.md` | Empty 150-byte placeholder removed in DOC-CLEAN-01; future evidence, no registry/results yet | RESOLVED / PLACEHOLDER REMOVED |
| Legacy `app + ml/srs + ml/chatbot` vs `api + ml_srs + nlp_chatbot` | `01-architecture.md` | Use explicitly approved Lingora repository boundaries | CONFLICT — RESOLVED BY APPROVAL |

## Migration status

- Canonical documents `00` through `05`: M0 migration plus M0.5 approved normalization.
- Product/repository naming: normalized to Lingora where naming-only.
- Legacy workflow (`ke-hoach-chi-tiet/archive/06 quy trinh lam viec.md`): archived after coverage verification; the entire `ke-hoach-chi-tiet/` directory was subsequently removed (cleanup task, 2026-08-14).
- M0.5 resolves the approved core-model, ownership, locale, streak, health, response-metadata, grammar-score and REORDER decisions through normative override sections while preserving migrated findings as history.
- No feature implementation, dependency, migration, endpoint, UI, or model work was performed.

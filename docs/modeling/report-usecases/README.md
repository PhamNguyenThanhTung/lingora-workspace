# Report-Oriented Functional Use Case Views

**Presentation correction 2026-10-12:** All nine report views now have clean goal-level diagrams without note boxes, internal processing ellipses or redundant dependencies. Editable native versions occupy pages 09–17 immediately after Admin in [the primary Draw.io bundle](../current-target/lingora-all-diagrams.drawio). Detailed rules remain in the existing Use Case Specification; no product/catalog change was made.

These eight **report-oriented functional views** group existing behavior by feature for Chapter II. They complement the canonical actor-oriented views (`VIEW-UC-01`–`VIEW-UC-04`), which remain the role and scope checks. The `VIEW-RUC` labels identify report diagrams only (the Admin group uses subviews 08A and 08B): **they do not add, replace, or renumber canonical UC-01–UC-14**. The catalog still has 13 active use cases and deferred reminder UC-03; Reassessment is not active.

## Report subsection mapping

| Suggested report subsection | Functional view | Canonical UC(s) involved |
|---|---|---|
| 2.2.1 Sơ đồ Use Case tổng quát | [VIEW-UC-01](../current-target/src/UC-01-target-overall.puml) — actor-oriented overview | UC-01–UC-14; UC-03 reminder is deferred |
| 2.2.2 Đăng ký, đăng nhập và quản lý hồ sơ | [VIEW-RUC-01](VIEW-RUC-01-auth-profile.puml) | UC-01 |
| 2.2.3 Thiết lập ngữ cảnh học tập | [VIEW-RUC-02](VIEW-RUC-02-learning-context.puml) | UC-01 supporting authentication, UC-02 Placement, UC-04 learning path |
| 2.2.4 Học bài và luyện tập | [VIEW-RUC-03](VIEW-RUC-03-lesson-practice.puml) | UC-06 lesson, UC-08 performance/progress; UC-07 only for optional system-selected SRS questions in ordinary practice |
| 2.2.5 Ôn tập từ vựng theo SRS | [VIEW-RUC-04](VIEW-RUC-04-srs-review.puml) | UC-07 SRS; UC-06 is the core-vocabulary enrollment trigger |
| 2.2.6 Placement và Level-up Assessment | [VIEW-RUC-05](VIEW-RUC-05-assessment.puml) | UC-02 Placement, UC-05 Level-up |
| 2.2.7 Theo dõi tiến độ và lịch sử học tập | [VIEW-RUC-06](VIEW-RUC-06-progress-history.puml) | UC-04 learning path, UC-06 lesson completion/performance, UC-08 progress/streak |
| 2.2.8 Giáo viên biên soạn nội dung | [VIEW-RUC-07](VIEW-RUC-07-teacher-authoring.puml) | UC-09 assignment scope, UC-10 authoring, UC-11 submit/revise |
| 2.2.9 Phân công, duyệt và xuất bản nội dung | [VIEW-RUC-08A — Governance](VIEW-RUC-08A-admin-content-governance.puml) | UC-09 planning/assignment, UC-12 review/approval/publication |
| 2.2.10 Quản lý tài khoản và hỗ trợ | [VIEW-RUC-08B — Account/support](VIEW-RUC-08B-admin-account-support.puml) | UC-13 account administration, UC-14 reports/audit; UC-01 supporting authentication |

The Admin functional group is split into two report subviews for page readability: VIEW-RUC-08A covers content governance and VIEW-RUC-08B covers account/support. Each keeps the same Admin actor and existing canonical UC mapping.

## View files

| View | PlantUML source |
|---|---|
| VIEW-RUC-01 — Đăng ký, đăng nhập và hồ sơ | [PUML](VIEW-RUC-01-auth-profile.puml) |
| VIEW-RUC-02 — Ngữ cảnh học tập | [PUML](VIEW-RUC-02-learning-context.puml) |
| VIEW-RUC-03 — Học bài và luyện tập | [PUML](VIEW-RUC-03-lesson-practice.puml) |
| VIEW-RUC-04 — SRS | [PUML](VIEW-RUC-04-srs-review.puml) |
| VIEW-RUC-05 — Placement/Level-up | [PUML](VIEW-RUC-05-assessment.puml) |
| VIEW-RUC-06 — Progress/history | [PUML](VIEW-RUC-06-progress-history.puml) |
| VIEW-RUC-07 — Teacher authoring | [PUML](VIEW-RUC-07-teacher-authoring.puml) |
| VIEW-RUC-08A — Admin content governance | [PUML](VIEW-RUC-08A-admin-content-governance.puml) |
| VIEW-RUC-08B — Admin account/support | [PUML](VIEW-RUC-08B-admin-account-support.puml) |

## SRS interaction clarification

- Core vocabulary is enrolled after valid lesson completion. Optional vocabulary is enrolled only when the learner chooses **Add to Review**.
- The server detects due/overdue cards and selects questions for a suitable ordinary learning/practice session, or after the learner starts an optional dedicated review session. The learner sees one question/prompt and answers it; the learner does **not** see a due-card list, stage list, due date, or preview of upcoming cards.
- A due/overdue card remains eligible for a later suitable session until a valid review is recorded. Policy B remains `1 → 3 → 7 → 14 → 30` days, then every 30 days; one logical card is owned per Learner+Vocabulary. A forgotten answer resets the stage and allows at most one same-session reinforcement without a second scheduling operation.
- SRS may appear in ordinary practice/checkpoints, but never as dynamic content inside a scored immutable Placement/Level-up Assessment Version. Any separate nearby review remains outside its score and pass/fail decision.
- **Downstream physical-design note:** Physical design must consume the updated SRS interaction semantics; due_at remains persisted/internal, but learner-facing due-list browsing is not an MVP capability. Physical artifacts are not modified here.

## Rendering and style

Sources reuse the canonical white/black/gray academic style from `../current-target/style.puml`. PlantUML sources and the primary Draw.io bundle are retained; generated PNG/SVG exports are not stored here. Eight functional groups are represented by nine report diagrams because the Admin group is split into 08A/08B for readability. They are stored separately from the 36-source canonical modeling package and do not change its identities or inventory.


## Study Focus integration (ADR-042)

VIEW-RUC-02 adds supporting owned-context focus selection/change; VIEW-RUC-03 adds personalized supplementary practice outside core; VIEW-RUC-04 keeps due selection internal and independent from focus. Canonical UC-01–14 remain unchanged. [Addendum](../../study-focus-addendum.md) controls these changes; the editable PlantUML sources describe these rules. Physical interaction sync is now recorded in physical correction; the earlier downstream note describes the prior report-only task.

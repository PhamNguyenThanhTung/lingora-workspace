# 05 - Lingora Traceability Matrix

## FDR-01–07 correction trace (2026-10-20)

| Correction / authority | Corrected design | Design acceptance / future runtime cases |
|---|---|---|
| UI roles/entry/retry/states — ADR-031–036/041–043, current UC | DESIGN.md current screen index | DC01-A–E; actual documentation review only |
| System assembly/current-assignee feedback — ADR-043 | ACT-08, SEQ-03/04, STA-03 | DC02-A–E; existing DB43-01/02/03/06/07/08/09/10 |
| Completed-revision membership — Class dictionary/ADR-036 | DATA-03, SEQ-08 | DC03-A–D; PD-SRS-01, PD-LESSON-04/05 |
| Exact creation/submission/contribution episodes — Class/ADR-035/043 | DATA-03 | DC04-A–D; DB43-06/07/12 |
| Supporting composite target keys — proposed physical integrity | Physical catalog/learning ERD | DC05-A–D; PD-DC05-KEYS/SCOPE |
| Review receipt replay/capabilities — proposed physical realization of trusted commands | Physical catalog/security/learning ERD | DC06-A–D; PD-DC06-REPLAY/HASH/RACE/AUTH |
| Purpose mapping/narrow update — Class/ADR-030/031/032/033 plus proposed representation | Physical catalog/security/content ERD | DC07-A–D; PD-DC07-PURPOSE/CONTEXT/HISTORY/ELIGIBILITY |

[Correction report/evidence](design/design-correction-2026-10-20.md) records observed documentation/artifact checks; [DC plan](../plans/2026-10-20-design-correction-plan.md) and [future physical cases](design/physical/rebuild-plan.md) distinguish runtime NOT EXECUTED. Purpose code/null/empty-tag/session representation remains PROPOSED, not new product approval. No canonical UC renumbering or runtime acceptance is implied.

## Current assessment assembly traceability — ADR-043

| Requirement | Current behavioral authority | Future design acceptance |
|---|---|---|
| Lesson assignment; system assembles submitted multi-Teacher contributions | ADR-043; UC-09/10/11 | DB43-01/02/03/05 |
| Creation/submission episode provenance; current-assignee rights and routed correction | ADR-035/043; UC-09–12; accepted Class Assignment/ContentRevision/AssessmentItem | DB43-06/07/08/12 |
| Immutable secure version, Admin review/publish and private grading | ADR-035/036/043; UC-02/05/12 | DB43-04/09/10/11 |
| Complete Class-to-storage mapping | Accepted Class baseline; ADR-030–036/041/042 | DB43-13 and database reconciliation mapping |

[DB43-01–13](design/physical/database-reconciliation-2026-10-20.md) are specified runtime cases, **NOT EXECUTED**. Physical design is proposed. The later FDR correction trace above synchronizes only its six named logical sources with relevant current rules; other views and historical evidence are preserved, not blanket reapproved.

## Current Study Focus traceability — ADR-042

| Requirement | Canonical behavior / affected views | Design acceptance |
|---|---|---|
| One owned-context focus, default BALANCED; optional change, next session only | UC-04 supporting preferences; VIEW-RUC-02; ACT-01; DOM-01/DATA-03 | PERS-01/05/09/10 |
| Configured nonexclusive bias, eligible fallback and finite published practice metadata | UC-06; VIEW-RUC-03; ACT-03/SEQ-06; DOM-01/DATA-03 | PERS-02/03/09 |
| Internal independent due/overdue SRS, no due browsing; unchanged Policy B | UC-07; VIEW-RUC-04; ACT-06/SEQ-08 | PERS-04/05 |
| Shared core N/K, completion, order/unlocks/gates unchanged | UC-04/06/08; ACT-03/SEQ-06 | PERS-06 |
| No dynamic focus/SRS in scored pinned secure assessments | UC-02/05; existing secure-assessment views unchanged | PERS-07/08 |
| Exact Teacher key projection/submit and own-context principal lock path | UC-10/11 and UC-04; proposed physical security correction | PD-F01-AUTHORING-ALLOW/OTHER-TEACHER/LEARNER-KEY-DENIED/PINNED-GRADER/MISSING-KEY/TEACHER-PUBLISH-DENIED; PD-F02-PARENT-LOCK-PRIVILEGES/LOCKER-CONTEXT-READ/CREATE-RESUME-PAUSE-RACE |

Canonical UC-01–14 identity/count is unchanged. [Addendum](study-focus-addendum.md) and [physical correction](design/physical/personalization-and-final-correction.md) contain future design acceptance, **NOT EXECUTED**; no runtime implementation/test status is inferred. Earlier trace rows remain historical where marked.


> **HISTORICAL Phase 0 baseline (aligned 2026-09-14 & ADR-014):** This matrix preserves the inherited 19-function/15-use-case trace catalog and its then-reported implementation/test statuses. Those statuses are not evidence of the current checkout or current requirements. Its UC IDs are catalog-local. Use the versioned crosswalk in `docs/use-case-specifications.md` for comparison with the current 14-entry behavior catalog; ADR-034/035 control current business/logical security policy. Physical mappings remain deferred under P0-D07.

---

## Current Traceability Addendum — 2026-10-10

This addendum is the current role/governance/security trace for ADR-034/035. It supplements, but does not rewrite, the historical Phase 0 matrix below. “Implemented” is reported only where a current source artifact was inspected; design docs and old test logs are not implementation evidence. ADR-035 resolves logical policy only; physical/live database conformance remains unverified.

| Business flow / requirement | Current UC | Approved rule | Diagram / controlling source | Repository evidence and current state |
|---|---|---|---|---|
| Learner signup and session | UC-01; P1-FR-001 (scope subject to current auth source) | Learners self-register; exactly one business role/account; Teacher/Admin do not public-signup (ADR-034). `auth.uid()` is the trusted subject; role/status is server-controlled; disabled accounts are blocked on the next request; ambiguous legacy roles require review, never blanket mapping (ADR-035). | [VIEW-UC-01](modeling/current-target/src/UC-01-target-overall.puml); ADR-034/035; current auth code | `lingora-web` contains learner auth UI/service calls. This does not implement Teacher/Admin provisioning, account-disable enforcement, or prove role claims/RLS match policy. Live DB state is unverified. |
| Placement and starting point | UC-02 | Placement/self-report/default are distinct; completed evidence is retained; no permanent lock/lifetime limit; no verified proficiency from Placement (ADR-032). Assessment grading is server-authoritative; generic content reads omit answer keys; incomplete attempts create no completed Result; Placement result is aggregate-only after submit (ADR-035). | ADR-032/035; `docs/use-case-specifications.md` | No Placement runtime was found in current web/admin source inspected. Migration `202608140002` gives authenticated readers row-level SELECT on published lesson exercises; the policy does not field-filter JSON payloads, so it does not prove answer secrecy if a payload contains a key. Result/attempt storage, answer filtering, and runtime conformance are not evidenced; inspect live state and access path before implementation. |
| Learning completion, progress, streak | UC-06, UC-08 | Required core exercises + valid submission + recorded completion; progress is completed/eligible required lessons; completed redo and recorded SRS review qualify for streak (ADR-033). | ADR-033; active learner UCs | No lesson/assessment workflow runtime was found in current web/admin source. Prisma/migration realization is not verified as a deployed state and remains P0-D07. |
| Curriculum requirements and assignments | UC-09 | Admin owns requirements/scope/checklist and assignment/reassignment; one assignment is one Lesson/content package plus related items with one responsible Teacher; Teacher authors only assigned work; attribution/history survive reassignment; minimal optimistic concurrency (ADR-034/035). | ADR-034/035; UC-09–11; [VIEW-UC-01](modeling/current-target/src/UC-01-target-overall.puml), [VIEW-UC-03](modeling/current-target/src/UC-03-target-teacher.puml) | No current assignment model or authoring UI was found in inspected app trees. Logical behavior is approved; assignment persistence is not implemented/evidenced. |
| Authoring, review, approval, publication | UC-10–12 | Teacher authors assigned work; edits only Draft/Changes Requested; Admin requests changes/approves and publishes approved revisions. Published edits create new revision; active Lesson/revision replacement is atomic on successful publish; failure retains active content; no hard-delete after learner reference/progress. Unit/Course visibility derives from curriculum blueprint/eligibility (ADR-034/035). | ADR-034/035; UC-10–12; current authoring/admin diagrams | No Admin governance UI or matching three-role enforcement was found. Prisma contains `ContentStatus`, `Lesson`/`Unit` artifacts and six legacy roles; initial SQL migration defines only `LEARNER`/`ADMIN` role enum and migration set lacks a matching three-role assignment/revision workflow. These are artifacts, not live state. |
| Teacher account administration | UC-13 | Admin provisions/manages Teacher accounts; role-conversion UI absent; Learner accounts remain separate. Disable takes effect at the next request even with an unexpired token; relevant account changes are audited (ADR-034/035). | ADR-034/035; UC-01/13; [VIEW-UC-04](modeling/current-target/src/UC-04-target-admin.puml) | No Teacher provisioning UI/service found in inspected app source. Migration `is_admin()` reads `profiles.role`; SQL role enum has two values while Prisma models six roles plus assigned-role fields. Current claims, disable enforcement, grants and RLS are not verified live. |
| Reports and audit | UC-14 | Admin may read security audit in MVP. Minimum events, required event fields, logical append-only behavior, separation from workflow history, and secret exclusions are set by ADR-035. Retention/anonymization duration is deferred. | ADR-035; UC-14; [VIEW-UC-04](modeling/current-target/src/UC-04-target-admin.puml) | No current reporting UI/runtime was found. Prisma declares `AuditLog`, but the inspected ordered migrations do not create its table or establish event emission. A model/log artifact alone does not prove audit behavior or deployed logging; physical store/emitter/retention remain deferred. |
| SRS review | UC-07 | User+Vocabulary remains default ownership (ADR-030/031); Policy B remains approved; client submits card identity/rating only; server/RPC calculates schedule; same-operation retry is idempotent; paused context does not pause global SRS; recorded review qualifies for streak (ADR-033/035). | ADR-030/031/033/035; current UC-07 | Historical RPC/migration accepts caller-supplied probability/interval parameters, which does not demonstrate conformance to ADR-035 and must be assessed read-only against live DB before implementation. Current Web SRS route is absent; runtime conformance is unverified. |

## Current Product Revision Traceability Addendum — ADR-036 (2026-10-10)

This table maps the six newly approved product decision groups to the current requirement addendum, current UC identities, and logical modeling concepts. It does not update the historical Phase 0 catalogs or report implementation status.

| ADR-036 decision | Requirement authority | Current UC | Logical concepts / canonical diagrams | Status |
|---|---|---|---|---|
| Lesson attempt, one retry, score contributions, completion independent of correctness, latest completed attempt | `docs/02-requirements.md` → “Lesson attempts and performance” | UC-06 Lesson and exercises; UC-08 Progress/streak | LessonAttempt, completed performance, completion fact; ACT-03, SEQ-06, DOM-01, DATA-03 | `TARGET — approved product rule; physical representation deferred` |
| Core/optional vocabulary enrollment, unique learner card, Policy B recurrence and one-time reinforcement | `docs/02-requirements.md` → “Vocabulary enrollment and SRS” | UC-07 Vocabulary/SRS; UC-06 lesson completion trigger | Vocabulary identity, SRS card, review operation/history; ACT-06, SEQ-08, DOM-01, DATA-03 | `TARGET — approved product rule; physical representation deferred` |
| Active curriculum eligibility, unavailable future content, withdrawal/replacement and preserved history | `docs/02-requirements.md` → “Curriculum availability and history” | UC-04 Learning path; UC-06 lesson; UC-08 progress | Curriculum availability/eligibility, active revision, historical completion; ACT-01, ACT-03, ACT-04, ACT-09, STA-03, DOM-01, DATA-03 | `TARGET — approved product rule; physical representation deferred` |
| Blueprint coverage, assigned Teacher item authorship, readiness validation, Admin approval, immutable version, practice-item separation | `docs/02-requirements.md` → “Assessment package and version” | UC-09 requirements/assignment; UC-10 authoring; UC-11 submit; UC-12 review/publish; UC-02 Placement; UC-05 Level-up | AssessmentBlueprint, AssessmentVersion, AssessmentItem, AssessmentResult; ACT-08, SEQ-03, SEQ-04, SEQ-07, DOM-01, DATA-03, SEC-01 | `TARGET — approved product rule; physical representation deferred` |
| Reassessment removed from MVP; only Placement and Level-up active | `docs/02-requirements.md` → “MVP assessment scope” | No Reassessment UC in the current 14-entry catalog; UC-03 reminder remains deferred | ACT-05 retained only as explicitly deferred reference; VIEW-UC-01/02 learner maps omit Reassessment | `TARGET — approved scope; no catalog renumbering` |
| Admin minimal Learner account support; no editing learning evidence | `docs/02-requirements.md` → “Admin learner-account operations” | UC-13 Account administration; UC-14 Reports/audit | Account identity/status, context summary, audited admin action; VIEW-UC-04 Admin, SEQ-09, SEC-01 | `TARGET — approved product rule; physical representation deferred` |

The current detailed catalog has 14 entries: 13 active UCs and one deferred reminder UC-03. Diagram identities are VIEW-UC-01–04, separate from canonical UC-01–14; stable filenames are crosswalked in the UC specification. See the [correction cross-diagram consistency matrix](modeling/current-target/review.md#k-cross-diagram-consistency). Its UC-03 reminder entry is deferred; no standalone Reassessment entry exists to remove or renumber. Any local identifiers in diagrams remain subordinate to the catalog-versioned crosswalk.

## Current SRS Interaction Clarification Traceability Addendum — ADR-041 (2026-10-12)

| PO clarification | Requirement authority | Current UC | Report/canonical views | Status |
|---|---|---|---|---|
| System selects due/overdue cards; learner sees question/prompt only and cannot browse or preview a due list | `docs/02-requirements.md` → “SRS interaction and session boundary” | UC-07; UC-06 when review is integrated with a normal lesson/practice session | VIEW-RUC-03/04; ACT-03/06; SEQ-06/08 | `APPROVED PO interaction rule; logical behavior only` |
| Due/overdue cards persist until valid review; optional dedicated review selects only after start; Policy B and one-time reinforcement remain unchanged | Same section plus ADR-036 “Vocabulary enrollment and SRS” | UC-07; lesson completion trigger UC-06 | VIEW-RUC-03/04; ACT-06; SEQ-08 | `APPROVED PO clarification; physical representation deferred` |
| Do not dynamically insert SRS into scored immutable Placement/Level-up versions | Same section; “Assessment package and version” | UC-02 Placement; UC-05 Level-up; UC-07 SRS | VIEW-RUC-04/05; ACT-02/04; SEQ-07 | `APPROVED session boundary; no assessment-version change` |
| Report subsection mappings group existing UC catalog behavior; no new canonical IDs | `docs/modeling/report-usecases/README.md` | UC-01–UC-14 (UC-03 remains deferred) | VIEW-RUC-01–07 and VIEW-RUC-08A/08B are report diagram identities only; VIEW-UC-01–04 actor views remain | `NO canonical UC renumbering` |

Physical design must consume the updated SRS interaction semantics; due_at remains persisted/internal, but learner-facing due-list browsing is not an MVP capability. No physical-design package was changed.

The inherited catalog rows in sections 1–3 below retain their original UC labels, owner names, implementation claims, and test claims as historical evidence. They must not be read as current role mapping or current test results.

---

## 1. Phase 0 MVP Function ➔ Use Case Traceability Matrix

| MVP ID | MVP Chức Năng | Owner Chính | Canonical Use Case | Requirements | Runtime Surface | Test Evidence | Trạng Thái (Status) |
|---|---|---|---|---|---|---|---|
| **MVP-01** | Đăng ký, đăng nhập, quên mật khẩu (design spec), khôi phục phiên | Administrator, All Roles | `UC-01 Authenticate & Manage Session` | `P1-FR-001`, `P1-NFR-001` | `lingora-web` (`/login`, `/register`, `@supabase/ssr`), Supabase GoTrue | `M1.6W-T-003/004/005` (PASS; Password Recovery: DESIGN SPEC ONLY / Runtime Pending) | `IMPLEMENTED (Auth Foundation) / PENDING (Recovery Runtime)` |
| **MVP-02** | Onboarding mục tiêu học | Learner | `UC-02 Configure Goals & Study Time` | `P1-FR-010`, `P1-FR-014` | `lingora-web` (`/profile`, `Profile.dailyGoalMin`, `uiLocale`) | `P1-T-018`, `M1.6W-T-002` (PASS) | `PARTIAL (Profile ready, Onboarding UI pending M2)` |
| **MVP-03** | Đánh giá chẩn đoán (Diagnostic) hoặc chọn cấp độ | Learner | `UC-03 Stage-Adaptive Diagnostic Assessment` | `P1-FR-016` | `lingora-web` (Diagnostic runner), Common Assessment Engine, Starting Unit mapper (OD-PLACEMENT-MAPPING: APPROVED MAPPING A [0–7: U1, 8–12: U2, 13–17: U3, 18–22: U4, 23–26: U5, 27–30: U6] as initial English A1 curriculum placement rule) | Planned placement/diagnostic tests | `DESIGN (Specification updated; Implementation pending)` |
| **MVP-04** | Lộ trình học (Curriculum & Remediation) | Lesson Creator | `UC-04 Browse Learning Path` | `P1-FR-002` | `lingora-web` (`/courses`, `/learn`, Course/Lesson tree, Remedial Micro-lessons), Supabase RLS | `M1.4-T-001` (Seed PASS), `P1-T-002` | `PARTIAL (DB/RLS ready; UI pending M2)` |
| **MVP-05** | Lesson ngắn 5–10 phút | Lesson Creator | `UC-05 Complete Lesson Exercises`, `UC-08 Create Lesson Draft` | `P1-FR-002`, `P1-FR-004` | `lingora-web` (Player), `lingora-admin` (Authoring), `Lesson` entity | `M1.4-T-001` (PASS) | `PARTIAL (DB ready; Player pending M2; Admin pending M3)` |
| **MVP-06** | Năm dạng exercise đề cương (MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR) | Lesson Creator | `UC-05 Complete Lesson Exercises`, `UC-08 Create Lesson Draft` | `P1-FR-003` (Core 3 types: `MCQ`, `FILL_BLANK`, `REORDER`; ext: `P1-FR-012` `GRAMMAR`, `P1-FR-013` `LISTENING`) | `lingora-web` (Exercise engine), `Exercise.payload` (Prisma JSONB) | `M1.6W-T-002` (PASS), `P1-T-003` | `PARTIAL (Prisma schema ready; Player pending M2)` |
| **MVP-07** | Phản hồi tức thời & giải thích | Moderator | `UC-05 Complete Lesson Exercises`, `UC-09 Review Content` | `P1-FR-003`, `P1-FR-012` | `lingora-web` (Instant feedback component), `Exercise.payload` | `P1-T-003`, `P1-T-016` | `PARTIAL (Payload schema ready; interactive UI pending M2)` |
| **MVP-08** | Tiến độ học tập cá nhân (Tách biệt Progress vs Mastery) | Learner | `UC-07 Track Progress, Mastery & Readiness` | `P1-FR-004` | `lingora-web`, Supabase `UserProgress` table (Curriculum progress separate from skill mastery) | `M1.4-T-001` (PASS), `P1-T-004` | `PARTIAL (DB/RLS ready; UI pending M2)` |
| **MVP-09** | Ôn tập nội dung yếu (SRS) | Learner | `UC-06 Spaced Repetition Review (SRS)` | `P1-FR-005`, `P1-FR-006` | `lingora-web` (`/srs`), RPC `record_review`, `user_vocab_srs`, `review_logs` | `M1.3-T-001` (RPC PASS), `M1.4-T-001`, `M1.6W-T-006-RERUN` | `PARTIAL (RPC/DB ready; Web deterministic review UI pending M2)` |
| **MVP-10** | Daily goal và streak | Learner | `UC-02 Configure Goals`, `UC-07 Track Progress, Mastery & Readiness` | `P1-FR-011`, `P1-FR-014` | `lingora-web`, `Profile.streakCount`, `lastQualifyingActivityDate` | `M1.4-T-001` (PASS), `P1-T-011`, `P1-T-018` | `PARTIAL (DB fields ready; UI pending M2)` |
| **MVP-11** | Báo cáo cá nhân (Skill Profile & Readiness) | Learner | `UC-07 Track Progress, Mastery & Readiness` | `P1-FR-004`, `P1-FR-011`, `P1-FR-017` | `lingora-web` (`/profile`, spider/radar stats card: Progress, Skill Profile, Mastery, Level Readiness) | `M1.6W-T-002` (PASS) | `PARTIAL (Foundation ready; full dashboard pending M2)` |
| **MVP-12** | Quản lý nội dung (Draft/Media) | Lesson Creator | `UC-08 Create & Edit Lesson Draft` | `P1-FR-008`, `P1-FR-009` | `lingora-admin` (Authoring UI), Supabase Storage (`lingora-media`) | `M1.3-T-001` (Admin RLS PASS), `M1.3-T-002` (Storage PASS) | `PARTIAL (DB/Storage ready; Authoring UI pending M3)` |
| **MVP-13** | Kiểm duyệt & Xuất bản nội dung | Moderator, Organizational Manager | `UC-09 Review & Approve Content`, `UC-10 Publish Content` | `P1-FR-008` | `lingora-admin` (Moderation queue, Publishing), `Course/Lesson.isPublished` | `M1.3-T-001` (Admin RLS PASS) | `DESIGN / PARTIAL (DB publish flag exists; 6-state workflow UI pending M3)` |
| **MVP-14** | Quản trị tài khoản và quyền | Administrator | `UC-11 Manage Accounts & Roles` | `P1-FR-008`, `P1-NFR-001` | `lingora-admin` (`/users`), Supabase GoTrue, `Profile.role` | `M1.3-T-001` (RLS PASS) | `PARTIAL (2 roles in DB: LEARNER/ADMIN; 6-role RBAC UI pending M3)` |
| **MVP-15** | Báo cáo vận hành | Administrator | `UC-12 View System Reports` | `P1-FR-008` | `lingora-admin` (`/analytics`) | Planned operational tests | `DESIGN (Specification in Phase 0; Implementation pending M3)` |
| **MVP-16** | Hỗ trợ người dùng (Ticket) | Operations Staff | `UC-14 Handle Support Tickets` | Operational Support | `lingora-admin` (`/support`), Support ticket store | Planned ticket tests | `DESIGN (GAP: SupportTicket entity not yet in Prisma; scheduled for Ops milestone)` |
| **MVP-17** | Quản lý cohort tùy chọn | Organizational Manager | `UC-15 Manage Cohorts & Group Progress` | Optional Organization Module | `lingora-admin` (Cohort portal), Cohort grouping schema | Planned cohort tests | `DESIGN (FUTURE / OPTIONAL: Cohort entities not yet in Prisma; optional module)` |
| **MVP-18** | Trạng thái trải nghiệm chuẩn | Mọi owner | Cross-cutting across `UC-01`..`UC-15` | `P1-NFR-004` | `lingora-web`, `lingora-admin` shared UI (Loading skeleton, ErrorBoundary, EmptyState) | `M1.6W-T-002/008/009/010` (PASS) | `IMPLEMENTED (Foundation established in lingora-web)` |
| **MVP-19** | Quyền riêng tư và audit | Administrator | `UC-11 Manage Accounts`, `UC-13 View & Audit Security Logs` | `P1-NFR-001` | Supabase RLS, Audit log store, server-side validation | `M1.3-T-001` (RLS harness PASS: 34/34 tests) | `PARTIAL (RLS enforced at DB; dedicated Audit UI pending M3)` |

---

## 2. Use Case Catalog: 14 Core MVP Use Cases (UC-01..UC-14) & 1 Optional B2B Module (UC-15)

| UC ID | Tên Use Case | Tác Nhân Chính | Gói Chức Năng | MVP Functions | Trạng Thái Triển Khai |
|---|---|---|---|---|---|
| `UC-01` | Authenticate & Manage Session | Learner, Admin | Core Learning / Admin | `MVP-01` | `IMPLEMENTED (M1.6W Web SSR Auth + Supabase GoTrue)` |
| `UC-02` | Configure Goals & Study Time | Learner | Core Learning | `MVP-02`, `MVP-10` | `PARTIAL (DB Profile ready; Onboarding/Goal UI pending M2)` |
| `UC-03` | Take Diagnostic Assessment / Select Level | Learner | Core Learning | `MVP-03` | `DESIGN (Approved specification; Implementation pending)` |
| `UC-04` | Browse Learning Path | Learner | Core Learning | `MVP-04` | `PARTIAL (DB Course/Lesson ready; Web UI pending M2)` |
| `UC-05` | Complete Lesson Exercises | Learner | Core Learning | `MVP-05`, `MVP-06`, `MVP-07` | `PARTIAL (Schema/types ready; Exercise engine pending M2)` |
| `UC-06` | Spaced Repetition Review (SRS) | Learner | Core Learning | `MVP-09` | `PARTIAL (RPC record_review ready; Web UI pending M2)` |
| `UC-07` | Track Progress, Mastery & Readiness | Learner | Core Learning (included by UC-05, UC-06) | `MVP-08`, `MVP-10`, `MVP-11` | `PARTIAL (DB progress/streak ready; full UI pending M2)` |
| `UC-08` | Create & Edit Lesson Draft | Lesson Creator | Content Workflow | `MVP-05`, `MVP-06`, `MVP-12` | `PARTIAL (DB schema ready; Admin authoring UI pending M3)` |
| `UC-09` | Review & Approve Content | Moderator | Content Workflow | `MVP-07`, `MVP-13` | `DESIGN (Review flow specified; UI pending M3)` |
| `UC-10` | Publish Approved Content | Organizational Manager | Content Workflow | `MVP-13` | `PARTIAL (isPublished flag in DB; Publishing UI pending M3)` |
| `UC-11` | Manage Accounts & Roles | Administrator | Administration & Operations | `MVP-14`, `MVP-19` | `PARTIAL (Prisma Profile ready; Role management UI pending M3)` |
| `UC-12` | View System Reports | Administrator | Administration & Operations | `MVP-15` | `DESIGN (Metrics specified; Dashboard pending M3)` |
| `UC-13` | View & Audit Security Logs | Administrator | Administration & Operations | `MVP-19` | `PARTIAL (DB RLS logs ready; Audit UI pending M3)` |
| `UC-14` | Handle Support Tickets | Operations Staff | Administration & Operations | `MVP-16` | `DESIGN (GAP: Support ticket schema and UI pending Ops milestone)` |
| `UC-15` | [OPTIONAL B2B / FUTURE] Manage Cohorts & Group Progress | Organizational Manager | Optional Cohort Module | `MVP-17` | `DESIGN (FUTURE / OPTIONAL: Cohort schema and UI pending optional module)` |

---

## 3. Engineering Requirements (P1-FR, P1-NFR, ML-GEC) Traceability

| Requirement ID | Priority | Mapped UC | Architecture | Data Entity | API / RPC | Test Evidence | Status |
|---|---|---|---|---|---|---|---|
| **P1-FR-001** | Must | `UC-01` | `docs/01` Web SSR Auth, Password Recovery Spec | `Profile` | Supabase Auth (GoTrue ES256, `POST /auth/v1/recover`) | `M1.6W-T-003/004/005` (PASS; Recovery: DESIGN SPEC ONLY / Runtime Pending) | `IMPLEMENTED (M1.6W Auth) / PENDING (Recovery Runtime)` |
| **P1-FR-002** | Must | `UC-04`, `UC-05` | `docs/01` Architecture | `Course`, `Lesson`, `Vocabulary` | PostgREST / Storage (`lingora-media`) | `M1.4-T-001` (PASS) | `PARTIAL (Pending M2 UI)` |
| **P1-FR-003** | Must | `UC-05`, `UC-08` | `docs/01` Architecture | `Exercise.payload`, `UserProgress` | Server Actions / Client Engine | `M1.6W-T-002` (PASS) | `PARTIAL (Pending M2 Engine)` |
| **P1-FR-004** | Must | `UC-05`, `UC-07` | `docs/01` Architecture | `UserProgress` | Server Action (Score aggregate 0–100%) | `M1.4-T-001` (PASS) | `PARTIAL (Pending M2 UI)` |
| **P1-FR-005** | Must | `UC-06` | `docs/01` SRS boundary | `UserVocabSrs`, `ReviewLog` | Deterministic due-card query | `M1.6W-T-006-RERUN` (PASS) | `PARTIAL (Audit Pending)` |
| **P1-FR-006** | Must | `UC-06` | `docs/01` RPC boundary | `UserVocabSrs`, `ReviewLog` | RPC `record_review` | `M1.3-T-001` (PASS: 34/34 tests) | `IMPLEMENTED (M1.3)` |
| **P1-FR-007** | Must | Scenario Writing | `docs/01` GEC boundary | `ChatScenario` (transient result) | Route Handler `/api/ai/gec` ➔ `/v1/gec/correct` | `M1.6W-T-007-RERUN` | `TARGET (Pending GEC API)` |
| **P1-FR-008** | Must | `UC-08`..`UC-11` | `docs/01` Admin boundary | `Course`, `Lesson`, `Exercise`, `Profile` | Admin Client / PostgREST RLS | `M1.3-T-001` (PASS) | `PARTIAL (DB ready; UI pending M3)` |
| **P1-FR-009** | Must | `UC-08` | `docs/01` Storage | `lingora-media`, `lingora-avatars` | Supabase Storage API + RLS policies | `M1.3-T-002` (PASS) | `IMPLEMENTED (M1.3)` |
| **P1-FR-010** | Must | `UC-01`..`UC-07` | `docs/01` i18n | `Language`, `*Translation` | Next.js Locale Catalog (`vi` / `en`) | `M1.6W-T-002` (PASS) | `IMPLEMENTED (M1.6W)` |
| **P1-FR-011** | Must | `UC-07` | `docs/01` Gamification | `Profile.streakCount`, `lastQualifyingActivityDate` | Server Action (Timezone-aware check) | `M1.4-T-001` (PASS) | `PARTIAL (Pending M2 UI)` |
| **P1-FR-012** | Must | `UC-05` | `docs/01` ADR-006 | `Exercise.payload` (`type='GRAMMAR'`) | Client render component & validation | Planned M2 tests | `LOCKED (Pending M2)` |
| **P1-FR-013** | Must | `UC-05` | `docs/01` ADR-006 | `Exercise.payload` (`type='LISTENING'`) | Audio element + Storage playback | Planned M2 tests | `LOCKED (Pending M2)` |
| **P1-FR-014** | Must | `UC-02` | `docs/01` ADR-006 | `Profile.dailyGoalMin` | Profile Update Action (5–120 min) | Planned M2 tests | `LOCKED (Pending M2)` |
| **P1-FR-015** | Must | In-App Reminder | `docs/01` ADR-008 | Client-local state (No reminder entity) | In-App Banner/Toast | Planned M2+ tests | `LOCKED (Option 6d; Later M2+)` |
| **P1-FR-016** | Must | `UC-03` | `docs/01 §3`, `docs/phase-1-m2-1-domain-and-logical-data-foundation.md §6.12`, `docs/09-placement-and-jump-specification.md` | `LearnerProfile`, `SkillProfile`, `AssessmentResult` | Common Assessment Engine / Starting Unit mapper (OD-PLACEMENT-MAPPING: APPROVED MAPPING A for initial English A1 scope) | Planned Placement/Diagnostic tests | `DESIGN (Specification updated; Implementation pending)` |
| **P1-FR-017** | Nice / P2 | Achievements | `docs/01` Achievements | Private badge catalog | Badge evaluation service | Planned Badge tests | `[OPTIONAL / DEFERRED FROM MUST]` |
| **P1-NFR-001**| Must | All | `docs/01` Security | RLS on all 17 tables | JWT ES256 / RLS enforced at DB | `M1.3-T-001`, `M1.5-AMEND-T-001` | `IMPLEMENTED (M1.3/M1.5/M1.6W)` |
| **P1-NFR-002**| Must | `UC-05`, `UC-06`| `docs/01` Resilience | SRS state usable without GEC | 8s GEC timeout + recoverable UI | `M1.6W-T-006/007` (PASS) | `IMPLEMENTED (Foundation)` |
| **P1-NFR-003**| Must | AI API | `docs/01` Contract | N/A | snake_case, error envelope, compatibility | Historical 37-test suite (PASS) | `CONTRACT LOCKED` |
| **P1-NFR-004**| Must | All Web UI | `docs/01` UX | N/A | Resilient UI States (Loading/Empty/Error) | `M1.6W-T-002/008/009/010` (PASS) | `IMPLEMENTED (M1.6W)` |
| **ML-GEC-FR-001** | Must | GEC Pipeline | `docs/01` ML boundary | Dataset artifacts outside DB | Preprocessing pipeline | Future dataset tests | `APPROVED / PENDING` |
| **ML-GEC-FR-002** | Must | GEC Inference | `docs/01` T5-small | `logs/model-registry.csv` | `/v1/gec/correct`, `/v1/model/info` | Future training tests | `APPROVED / PENDING` |
| **ML-GEC-FR-003** | Must | GEC Alignment | `docs/01` Derived output | None; transient response | GEC corrections / error_type | Future diff tests | `APPROVED / PENDING` |
| **ML-GEC-FR-004** | Must | GEC Evaluation | `docs/01` Evaluation | `logs/model-registry.csv` | `/v1/model/info` | Future F0.5/ERRANT evidence | `APPROVED / PENDING` |
| **ML-GEC-FR-005** | Should | GEC Optional | Optional derived modules | None; transient response | Optional suggestion/explanation | Future optional tests | `APPROVED OPTIONAL / PENDING` |
| **ML-GEC-NFR-001** | Must | GEC Security | Stateless boundary | None | GEC endpoint + standard errors | Future contract tests | `APPROVED / PENDING` |
| **ML-GEC-NFR-002** | Must | GEC Latency | CPU deployment | `logs/model-registry.csv` | latency_ms + 8s Web timeout | Future latency tests | `APPROVED / PENDING` |

---

## 4. Multilateral Traceability: Expert Research ➔ Design Decision ➔ Requirement ➔ Use Case ➔ Domain Concept

| Mã Bằng Chứng Chuyên Gia | Phát Hiện Thực Nghiệm (Expert Finding) | Quyết Định Thiết Kế (Design Decision) | Yêu Cầu Kỹ Thuật (Requirements) | Use Case Liên Kết | Khái Niệm / Thực Thể Domain Liên Kết | Trạng Thái Quyết Định |
|---|---|---|---|---|---|---|
| **E-EXP-01** (Thầy Quân) | Người học tự đánh giá sai trình độ (người đi làm tự nhận mất gốc nhưng test được A2/B1; sinh viên nhận B2 nhưng rỗng ngữ pháp/nghe) | Quyết định D4: Luồng khởi đầu linh hoạt. Tách biệt hoàn toàn `Initial Self-Reported Level` (tự chọn) với `Verified Proficiency` (đã qua kiểm tra) | `MVP-03`, `P1-FR-016` | `UC-03`, `UC-02` | `LearnerProfile.selfReportedLevel` vs `LearnerProfile.verifiedProficiency` | `FROZEN` |
| **E-EXP-02** (Thầy Quân) | Năng lực ngôn ngữ phát triển lệch (Spiky Profile / Jagged Skills); điểm trung bình phẳng làm che giấu lỗ hổng kỹ năng | Quyết định D1: Đánh giá chẩn đoán đa chiều (Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu). Xuất Skill Profile đa chiều (Spider/Radar), không gộp thành 1 điểm chung duy nhất | `MVP-03`, `MVP-11`, `P1-FR-016` | `UC-03`, `UC-07` | `SkillProfile` (4 chiều năng lực), `AssessmentResult.dimensions` | `FROZEN` (Cấu trúc 4 chiều) / `PENDING VALIDATION` (Thuật toán Anchor Level) |
| **E-EXP-03** (Thầy Quân) | "Intermediate Trap" (kẹt ở B1/B2 do ảo tưởng hoàn thành bài học là đã giỏi; thiếu cơ chế xác nhận sẵn sàng lên cấp) | Tách biệt 4 khái niệm: Progress ≠ Proficiency ≠ Mastery ≠ Level Readiness. Đánh giá sẵn sàng chuyển cấp phải dựa trên bằng chứng tổng hợp | `MVP-08`, `MVP-11`, `YC-CORE-11`, `YC-EXT-03` | `UC-07`, `UC-04` | `LearningProgress` (sở hữu duy nhất bởi `LearnerProfile`), `ConceptMastery`, `LevelReadiness` | `FROZEN` |
| **E-EXP-04** (Cô Mai) | "Rào cản chữ Hán" & "Bẫy Pinyin" (nhìn pinyin thì đọc hiểu nhưng giấu pinyin thì mù chữ Hán); cần đo chính xác khả năng nhận diện ký tự | Kiến trúc Common Assessment Engine dùng chung cho đa ngôn ngữ, tham số hóa qua config. Phần đọc hiểu tiếng Trung mặc định ẩn pinyin (`hidePinyin: true`) | `MVP-03`, `P1-FR-016`, `NFR-LOC` | `UC-03` | `AssessmentResult.languageConfig`, Common Assessment Engine | `FROZEN` |
| **E-EXP-05** (Cô Mai) | Lỗi ngữ pháp trật tự từ và hư từ phân tán theo từng điểm kiến thức cụ thể, cần theo dõi lỗ hổng kiến thức chính xác | Concept Tagging trên bài tập/bài học để phát hiện Knowledge Gap cụ thể thay vì chỉ ghi nhận đúng/sai cơ học | `MVP-06`, `MVP-07`, `P1-FR-003`, `P1-FR-012` | `UC-05` | `ConceptMastery`, `KnowledgeGap` | `FROZEN` |
| **E-EXP-06** (Cô Mai & Thầy Quân) | Người học nản lòng và bỏ cuộc nếu bị hạ toàn bộ cấp độ (demotion) hoặc bị ép học lại bài cũ | Cơ chế Remedial Learning tại cấp độ Concept/Skill: giao micro-lesson bổ khuyết với ngữ cảnh mới; 3 trạng thái chuyển tiếp (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`) | `MVP-04`, `YC-EXT-03` | `UC-04` | `RemedialModule`, `Recommendation`, `LevelReadiness` | `FROZEN` (Nguyên lý Remediation) / `CONFIGURABLE` (Ngưỡng kích hoạt) |
| **E-EXP-07** (Thầy Quân & Cô Mai) | Người học mệt mỏi và làm bừa nếu bài test chẩn đoán vượt quá 15–20 phút | Quyết định D3: Stage-Adaptive Diagnostic Assessment 2 giai đoạn (Routing Stage → Targeted Stage, ~25–30 items, ≤ 15 min) | `MVP-03`, `P1-FR-016` | `UC-03` | `AssessmentResult.stageData` | `FROZEN` (Kiến trúc 2 giai đoạn) / `PROPOSED / PENDING VALIDATION` (Số lượng item, ngưỡng thăng/giáng nhánh) |

---

## 5. End-to-End Multilateral Traceability: YC ➔ MVP ➔ P1-FR ➔ UC ➔ Domain Design

Bảng dưới đây thiết lập chuỗi truy vết khép kín toàn diện 5 tầng:
`YC (Yêu cầu Nghiệp vụ)` $\longrightarrow$ `MVP (Chức năng Sản phẩm)` $\longrightarrow$ `P1-FR / NFR (Đặc tả Kỹ thuật)` $\longrightarrow$ `UC (Use Case Hệ thống)` $\longrightarrow$ `Design (Mô hình Thực thể Dữ liệu / Domain Design)`

### 5.1. Bảng Truy vết 12 Yêu cầu Nghiệp vụ Cốt lõi (YC-CORE-01 .. YC-CORE-12)

| Mã YC | Tên Yêu Cầu Nghiệp Vụ | Chức Năng MVP | Đặc Tả Kỹ Thuật (P1-FR / NFR) | Canonical Use Case | Thực Thể Miền & Cấu Trúc Thiết Kế Logic | Trạng Thái |
|---|---|---|---|---|---|---|
| **YC-CORE-01** | Đăng ký, đăng nhập, quên mật khẩu (design spec), bảo vệ phiên, phân quyền, chọn ngôn ngữ học | `MVP-01`, `MVP-02` | `P1-FR-001`, `P1-FR-010`, `P1-NFR-001` | `UC-01`, `UC-02` | `Profile`, `Language`, `@supabase/ssr` session cookie, Password Recovery Spec | `IMPLEMENTED (Auth M1.6W) / PENDING (Recovery Runtime)` |
| **YC-CORE-02** | Tạo khung khóa học, Unit, phân công biên soạn (Assignment Brief) | `MVP-04`, `MVP-12` | `P1-FR-002`, `P1-FR-008` | `UC-08` | `Course`, `Unit`, `Lesson` (`creatorId`, `assignmentBrief`) | `PARTIAL (DB ready; Admin UI M3)` |
| **YC-CORE-03** | Biên soạn học liệu, tải âm thanh chuẩn, 5 dạng bài tập, giải thích đáp án | `MVP-05`, `MVP-06`, `MVP-07`, `MVP-12` | `P1-FR-003`, `P1-FR-009`, `P1-FR-012`, `P1-FR-013` | `UC-05`, `UC-08` | `Lesson`, `Vocabulary`, `LessonVocabulary`, `Exercise` (5 types: MCQ, FILL, REORDER, LISTENING, GRAMMAR), `Concept` | `PARTIAL (Prisma schema ready; UI M2/M3)` |
| **YC-CORE-04** | Kiểm duyệt bài học độc lập, nghe 100% âm thanh, phê duyệt / từ chối | `MVP-07`, `MVP-13` | `P1-FR-008` | `UC-09` | `Lesson` (`reviewerId`, `status: ContentStatus`), `Exercise`, `AuditLog` | `DESIGN / PARTIAL (Workflow specified; Admin UI M3)` |
| **YC-CORE-05** | Xuất bản bài học, mở khóa Unit đủ 4 bài, xuất bản khẩn cấp có giải trình | `MVP-13`, `MVP-19` | `P1-FR-008`, `P1-NFR-001` | `UC-10`, `UC-13` | `Course`, `Unit`, `Lesson.isPublished`, `AuditLog` | `PARTIAL (DB flag ready; UI M3)` |
| **YC-CORE-06** | Nhân bản bài học đã xuất bản (Clone-to-draft v2), không sửa in-place | `MVP-12`, `MVP-13` | `P1-FR-008` | `UC-08` | `Lesson.supersedesId`, Revision v2 pipeline, `AuditLog` | `LOCKED (ADR-002 / Spec)` |
| **YC-CORE-07** | Học bài học vi mô, làm bài tập 5 dạng, controlled retry, phân biệt progress/mastery | `MVP-05`, `MVP-06`, `MVP-07`, `MVP-08` | `P1-FR-002`, `P1-FR-003`, `P1-FR-004`, `P1-FR-012`, `P1-FR-013` | `UC-04`, `UC-05`, `UC-07` | `UserProgress`, `LearningProgress`, `Concept`, `ConceptMastery`, `KnowledgeGap` | `PARTIAL (DB ready; Player M2)` |
| **YC-CORE-08** | Lập lịch & thực hiện ôn tập từ vựng ngắt quãng (SRS Policy B: 1,3,7,14,30) | `MVP-09` | `P1-FR-005`, `P1-FR-006` | `UC-06` | `UserVocabSrs`, `ReviewLog`, `Vocabulary`, RPC `record_review` | `PARTIAL (RPC PASS; Review UI M2)` |
| **YC-CORE-09** | Đánh giá chẩn đoán thích ứng 2 giai đoạn, Skill Profile 4 chiều, Starting Unit | `MVP-03` | `P1-FR-016` | `UC-03` | `LearnerProfile`, `SkillProfile`, `AssessmentResult`, `Concept`, Starting Unit Mapper (Mapping A) | `DESIGN (Frozen architecture; Spec ready)` |
| **YC-CORE-10** | Theo dõi chuỗi ngày học liên tục (Streak), mục tiêu ngày (5–120p), nhắc in-app | `MVP-02`, `MVP-10` | `P1-FR-011`, `P1-FR-014`, `P1-FR-015` | `UC-02`, `UC-07` | `Profile` (`streakCount`, `dailyGoalMin`, `timezone`, `lastQualifyingActivityDate`), Client State | `PARTIAL (DB fields ready; UI M2)` |
| **YC-CORE-11** | Báo cáo cá nhân tổng hợp, phân định 4 khái niệm (Progress/Proficiency/Mastery/Readiness) | `MVP-08`, `MVP-11` | `P1-FR-004`, `P1-FR-011`, `P1-FR-017` | `UC-07` | `LearningProgress`, `SkillProfile`, `ConceptMastery`, `LevelReadiness` | `PARTIAL (Entities designed; Dashboard M2)` |
| **YC-CORE-12** | Quản trị tài khoản 6 vai trò, phân quyền SoD, ghi nhật ký kiểm toán bất biến | `MVP-14`, `MVP-19` | `P1-FR-008`, `P1-NFR-001` | `UC-11`, `UC-13` | `Profile` (`role`, `assignedRoles`), `AuditLog` | `PARTIAL (RLS harness PASS; Admin UI M3)` |

### 5.2. Bảng Truy vết 8 Yêu cầu Chức năng Mở rộng (YC-EXT-01 .. YC-EXT-08) & Chức năng Bổ trợ

| Mã YC | Tên Yêu Cầu Mở Rộng | Phân Loại / Module | Đặc Tả Kỹ Thuật (P1-FR / ML-GEC) | Canonical Use Case | Thực Thể Miền & Cấu Trúc Thiết Kế Logic | Trạng Thái Triển Khai |
|---|---|---|---|---|---|---|
| **YC-EXT-01** | Sửa lỗi ngữ pháp câu viết tự luận (GEC AI tool) | Supporting AI (GEC) | `P1-FR-007`, `ML-GEC-FR-001..005`, `ML-GEC-NFR-001..002` | Scenario Writing (`MVP-18` support) | `ChatScenario` (kết quả transient via Route Handler `/api/ai/gec`, không lưu lỗi vào DB) | `APPROVED PENDING (FastAPI model pipeline)` |
| **YC-EXT-02** | Luyện hội thoại theo tình huống thực tế (Roleplay Chat) | Supporting AI (NLP) | `P1-FR-007`, `P1-NFR-003` | Scenario Roleplay | `ChatScenario`, `ChatScenarioTranslation`, `ChatSession`, `ChatMessage` | `COMPATIBILITY SURFACE (FastAPI /v1/chat/roleplay)` |
| **YC-EXT-03** | Đề xuất lộ trình thích ứng & học bổ trợ khái niệm (Remedial Learning) | Core Adaptive Extension | `P1-FR-016`, `E-EXP-06` | `UC-04`, `UC-07` | `RemedialModule`, `Recommendation`, `KnowledgeGap`, `LevelReadiness`, `Concept` | `FROZEN ARCHITECTURE (Logical design M2.1)` |
| **YC-EXT-04** | Tiếp nhận & phân phối phiếu hỗ trợ người dùng (Support Ticket) | Administration & Operations | Operational Support | `UC-14` (`MVP-16`) | `SupportTicket` (`userId`, `assignedTo`, `status`) [Extension Boundary] | `DESIGN GAP (Scheduled for Ops Milestone)` |
| **YC-EXT-05** | Bảng điều khiển tra cứu và lọc nhật ký kiểm toán hệ thống | Administration & Operations | `P1-FR-008`, `P1-NFR-001` | `UC-12`, `UC-13` (`MVP-15`, `MVP-19`) | `AuditLog` [Target Schema] | `DESIGN (Scheduled for Admin M3)` |
| **YC-EXT-06** | Chuyển đổi ngôn ngữ giao diện song ngữ (i18n vi / en) | Cross-cutting Foundation | `P1-FR-010`, `P1-NFR-004` | Cross-cutting `UC-01`..`UC-15` (`MVP-18`) | `Language`, Next.js Locale Catalog (`vi` / `en`) | `IMPLEMENTED (M1.6W)` |
| **YC-EXT-07** | Gửi email nhắc nhở học tập định kỳ (Ngoài phạm vi MVP) | Deferred External Service | Notification Policy | `UC-02` (mở rộng) | Client-local daily goal setting; external email service deferred | `DEFERRED (Outside MVP scope)` |
| **YC-EXT-08** | Nhập danh mục bài học hàng loạt từ bảng tính (CSV/Excel) | Content Authoring Extension | `P1-FR-008` | `UC-08` | Batch importer service $\rightarrow$ `Lesson`, `Vocabulary`, `Exercise` (Draft) | `PLANNED (Post-M3 feature)` |
| — | Quản lý nhóm học viên & tiến độ lớp học (Cohort Portal) | Optional B2B Module | Organizational Extension | `UC-15` (`MVP-17`) | `Cohort`, `CohortMember` [Extension Boundary] | `DESIGN (Optional B2B Module / Future)` |

---

## 6. D3 Assessment & Learning Engine Traceability (Design-Only)

> Detail: [`docs/phase-1-d3-assessment-learning-engine-design.md`](phase-1-d3-assessment-learning-engine-design.md) (A–Q). 15-UC catalog unchanged (`UC-01`..`UC-15`). No new evidence invented. English A1 Mapping A is D2 compatibility (`docs/09-placement-and-jump-specification.md` §2), not a D3 scoring rule.

| Research / Evidence → Decision | Requirement → UC | Domain → D3 rule | D3 section |
|---|---|---|---|
| `E-EXP-01` → D4 flexible entry (`selfReportedLevel UNVERIFIED` ≠ `verifiedProficiency`) | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03`, `UC-02` | `LearnerProfile` → `AssessmentResult` → `SkillProfile` → starting point | D3 §B, §C, §D, §I |
| `E-EXP-02` → D1 four-dimension profile (no flat average; Anchor pending) | `YC-CORE-09` → `MVP-03`, `MVP-11` → `P1-FR-016` → `UC-03`, `UC-07` | `SkillProfile` 4 dims + provenance + `sourceAssessmentResultId` | D3 §D |
| `E-EXP-07` → D3 two-stage adaptive (`ROUTING → TARGETED`; scale proposed) | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03` | Engine stages → `AssessmentResult.stageData` | D3 §B, §C |
| `E-EXP-05` → concept-tagged errors → gaps | `YC-CORE-07` → `MVP-05/06/07` → `P1-FR-003` → `UC-05` | `Exercise` → `Concept` → `ConceptMastery` ↔ `KnowledgeGap` (typed error evidence) | D3 §E |
| `E-EXP-03` → four-concept separation (`LearningProgress` ≠ Proficiency ≠ Mastery ≠ Readiness) | `YC-CORE-11` → `MVP-08`, `MVP-11` → `P1-FR-004` → `UC-07` | `LearningProgress` / `SkillProfile` / `ConceptMastery` / `LevelReadiness` | D3 §D, §E, §F, §I |
| `E-EXP-06` → concept remediation + 3-state transition (no downgrade, no replay) | `YC-EXT-03` → `MVP-04` → `P1-FR-016` → `UC-04`, `UC-07` | `LevelReadiness` (`ADVANCE` / `ADVANCE_WITH_SUPPORT` / `REMEDIATE`) → `RemedialModule` → `Recommendation` | D3 §F, §G, §H |
| `E-EXP-04` → 4-tier multi-lang chain + `hidePinyin: true` | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03` | Engine → Config → Bank → Rubric; `AssessmentResult.languageConfig` | D3 §J, §A |

---

## 7. D4 Content & Curriculum Design Traceability (Logical Design)

> Detail: [`docs/phase-1-d4-content-curriculum-design.md`](phase-1-d4-content-curriculum-design.md) (A–T). Preserves 15-UC canonical catalog (`UC-01`..`UC-15`). Zero new requirements or ghost entities invented. All content rules trace backward to approved baselines and expert evidence.

| Source Evidence / Finding | Requirement → MVP → P1-FR → UC | Domain Entity / Logical Construct | D4 Content Design Rule | D4 Section | Status |
|---|---|---|---|---|---|
| `E-EXP-01` (Thầy Quân) | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03`, `UC-02` | `LearnerProfile`, `Lesson`, `AssessmentItem` | Blueprint (§F) and Item Bank (§L) isolate unverified starting points from diagnostic items | D4 §F, §L | `FROZEN` |
| `E-EXP-02` (Thầy Quân) | `YC-CORE-09` → `MVP-03`, `MVP-11` → `P1-FR-016` → `UC-03`, `UC-07` | `SkillProfile`, `Exercise`, `AssessmentItem` | Exercise & Item authoring envelopes tag discrete skill dimensions (Vocab/Grammar/Reading/Listening) | D4 §H, §L | `FROZEN` |
| `E-EXP-03` (Thầy Quân) | `YC-CORE-11` → `MVP-08`, `MVP-11` → `P1-FR-004` → `UC-07` | `LearningProgress`, `ConceptMastery`, `LevelReadiness` | Strict separation: Lesson completion measures progress; mastery and readiness require evidence gates | D4 §D, §F | `FROZEN` |
| `E-EXP-04` (Cô Mai) | `YC-CORE-09`, `NFR-LOC` → `MVP-03` → `P1-FR-016` → `UC-03` | `LanguageConfig`, Common Engine | Declarative Chinese config enforces `hidePinyinDefault: true` for Hanzi reading assessment | D4 §M | `FROZEN` |
| `E-EXP-05` (Cô Mai) | `YC-CORE-07` → `MVP-05/06` → `P1-FR-003`, `P1-FR-012` → `UC-05` | `Concept`, `ConceptMastery`, `KnowledgeGap` | Authoritative `Concept` schema; 0 free-text `conceptTag` allowed; acyclic prerequisite DAG | D4 §G | `FROZEN` |
| `E-EXP-06` (Cô Mai & Quân) | `YC-EXT-03` → `MVP-04` → `P1-FR-016` → `UC-04` | `RemedialModule`, `KnowledgeGap`, `Recommendation` | RemedialModule delivers fresh context/exercises for target concept; no downgrade, no forced replay | D4 §K | `FROZEN` |
| `E-EXP-07` (Quân & Mai) | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03` | `AssessmentItem`, `AssessmentResult.stageData` | Item Bank classifies items by difficulty bands (Entry/Mid/Upper) for 2-stage adaptive routing | D4 §L | `PROPOSED / PENDING` |
| ADR-002 / PO SoD | `YC-CORE-04..06` → `MVP-12/13/19` → `P1-FR-008` → `UC-08/10/13` | `Course`, `Unit`, `Lesson`, `AuditLog` | Content lifecycle SoD, Unit visibility (4/4 published), and `supersedesId` for Clone-to-Draft v2 | D4 §D | `FROZEN` |
| ADR-006 / PO Exercise Mix | `YC-CORE-03/07` → `MVP-05` → `P1-FR-012/013` → `UC-05` | `Exercise` (5 canonical types: MCQ, FILL, REORDER, LIS, GRM) | Standard 5-exercise mix per lesson; JSON authoring envelopes; 0 Matching canonical | D4 §H | `FROZEN (Logical)` |
| PO Policy D5 / D6 | `YC-CORE-09` → `MVP-03` → `P1-FR-016` → `UC-03` | `Unit`, `Lesson`, `AssessmentResult` | English A1 6-Unit/24-Lesson baseline mapping; Unit unlock via linear progress or Jump (>=95%) | D4 §E | `FROZEN (Mapping A)` |
| PO Policy D8 / SRS Baseline | `YC-CORE-08` → `MVP-09` → `P1-FR-005/006` → `UC-06` | `UserVocabSrs`, `Vocabulary` | MVP-09 is inherited from D8; D4 defines only vocabulary/content linkage (§J1) and does not redefine SRS scheduling policy | D4 §J | `FROZEN (D8)` |

---

## 8. M2.2 System Behavior, Use Cases & State Machine Traceability (Logical Design)

> Canonical Detail: [`docs/phase-1-m2-2-behavior-uc-activity-state.md`](phase-1-m2-2-behavior-uc-activity-state.md) (sections 1–16). Preserves the 15-UC canonical catalog (`UC-01`..`UC-15`) and maps exactly 15 Behavioral Families (`BF-01`..`BF-15`). Zero runtime code, zero schema migrations, zero ghost use cases (`UC-16/17/18`).

| Technical Requirement & Policy | MVP Feature | Canonical Use Case | Behavioral Family Mapping | Domain Entities & Logical State Representation | M2.2 Contract Ref | Governance Status |
|---|---|---|---|---|---|---|
| `P1-FR-001`, `P1-FR-010`, `P1-NFR-001` | `MVP-01`, `MVP-02` | `UC-01` | `BF-01` Authentication Flow | `Profile`, Session Cookie (`@supabase/ssr`) | M2.2 §2 (UC-01), §3 | `FROZEN` |
| `P1-FR-014`, `P1-FR-015` | `MVP-02`, `MVP-10` | `UC-02` | Goal & Profile Configuration | `Profile` (`dailyGoalMin`, `timezone`, In-app Reminder) | M2.2 §2 (UC-02), §3 | `FROZEN` |
| `P1-FR-016`, Policy D5, D6 | `MVP-03` | `UC-03` | `BF-08` Placement Test Flow | `AssessmentResult`, `SkillProfile`, `verifiedProficiency`, `LearnerProfile` | M2.2 §2 (UC-03), §3, §6 | `FROZEN` |
| `P1-FR-002`, `P1-FR-004`, `P1-FR-016` | `MVP-04`, `MVP-08` | `UC-04` | `BF-11` Conditional Jump Flow & Path Browse | `Course`, `Unit`, `Lesson`, `LearningProgress` | M2.2 §2 (UC-04), §3, §6 | `FROZEN` |
| `P1-FR-003`, `P1-FR-012/013`, Policy D7 | `MVP-05/06/07` | `UC-05` | `BF-09` Learning Lesson & `BF-10` Controlled Retry | `Exercise`, `Concept`, `KnowledgeGap`, `ConceptMastery` | M2.2 §2 (UC-05), §3, §5 | `FROZEN` |
| `P1-FR-005`, `P1-FR-006`, Policy D8 | `MVP-09` | `UC-06` | `BF-12` SRS Review Flow | `UserVocabSrs`, `ReviewLog`, RPC `record_review` | M2.2 §2 (UC-06), §3, §7 | `FROZEN` |
| `P1-FR-004`, `P1-FR-011` (Skill Profile ref: `P1-FR-016`) | `MVP-08`, `MVP-10`, `MVP-11` | `UC-07` | `BF-13` Progress & Streak Tracking Flow | `LearningProgress`, `Profile.streakCount`, `SkillProfile`, `LevelReadiness` | M2.2 §2 (UC-07), §3, §4 | `FROZEN` |
| `P1-FR-008`, ADR-002, ADR-004 | `MVP-12` | `UC-08` | `BF-03` Assignment, `BF-04` Authoring, `BF-06` Revision | `Lesson` (`creatorId`, `assignmentBrief`, `supersedesId`), `Exercise`, `Concept` | M2.2 §2 (UC-08), §3, §4 | `FROZEN` |
| `P1-FR-008`, ADR-004 (SoD) | `MVP-13` | `UC-09` | `BF-05` Content Review Flow | `Lesson` (`reviewerId`, `status: IN_REVIEW / APPROVED / CHANGES_REQUESTED`), `AuditLog` | M2.2 §2 (UC-09), §3, §4 | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-004 | `MVP-13`, `MVP-19` | `UC-10` | `BF-07` Publication & `BF-02` Curriculum Planning | `Lesson.isPublished`, `Unit`, `AuditLog` | M2.2 §2 (UC-10), §3, §4 | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-003 | `MVP-14` | `UC-11` | Account & Role Management | `Profile.role`, `AuditLog` | M2.2 §2 (UC-11), §3 | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001` | `MVP-15` | `UC-12` | System Reporting & Analytics | System Analytics Views, Aggregated Activity Logs | M2.2 §2 (UC-12), §3 | `DESIGN` |
| `P1-NFR-001`, ADR-004 | `MVP-19` | `UC-13` | Security Audit Log | `AuditLog` (immutable event ledger) | M2.2 §2 (UC-13), §3 | `FROZEN` |
| Operational Support | `MVP-16` | `UC-14` | `BF-15` Operations & Ticket Flow | `SupportTicket`, `Profile` | M2.2 §2 (UC-14), §3 | `DESIGN / SUPPORTING` |
| Scenario Writing with GEC (`P1-FR-007`) | `MVP-18` | *(No UC — Stateless Service)* | `BF-14` Scenario Writing with GEC Flow | `ChatScenario`, transient `/api/ai/gec` | M2.2 §3 (BF-14) | `FROZEN (Stateless Service)` |
| Organizational Cohorts (B2B) | `MVP-17` | `UC-15` | Cohort & Group Management | `Cohort`, `CohortMember` (Extension Boundary) | M2.2 §2 (UC-15), §3 | `OPTIONAL BOUNDARY` |

---

## 9. M2.3 Sequence Interactions, API Contracts & Service Boundaries Traceability (Logical Design)

> Canonical Detail: [`docs/phase-1-m2-3-sequence-api-service-boundary.md`](phase-1-m2-3-sequence-api-service-boundary.md) (sections 1–11). Preserves 15-UC canonical catalog (`UC-01`..`UC-15`) and 15 Behavioral Families (`BF-01`..`BF-15`). Zero runtime code, zero schema migrations, zero ghost use cases (`UC-16/17/18`).

| Technical Requirement & Policy | MVP Feature | Canonical UC | Behavioral Family Mapping | Domain / Persistence Boundary | M2.3 Sequence Flow Ref | M2.3 Contract & Service Surface Ref | Governance Status |
|---|---|---|---|---|---|---|---|
| `P1-FR-001`, `P1-FR-010`, `P1-NFR-001` | `MVP-01`, `MVP-02` | `UC-01` | `BF-01` Authentication Flow | `Profile`, Supabase GoTrue Auth, Session Cookie | `SEQ-01` | Surface 5 (GoTrue), §4.1 BFF | `FROZEN` |
| `P1-FR-014`, `P1-FR-015` | `MVP-02`, `MVP-10` | `UC-02` | Goal & Profile Configuration | `Profile` (`dailyGoalMin`, `timezone`), `LearnerProfile` | `SEQ-02` | Surface 10 (App Services), §5 State 4 | `FROZEN` |
| `P1-FR-016`, Policy D5, D6 | `MVP-03` | `UC-03` | `BF-08` Placement Test Flow | `AssessmentResult`, `SkillProfile`, `verifiedProficiency` | `SEQ-03` | Surface 10, §4.1 PlacementService, Mapping A | `FROZEN` |
| `P1-FR-002`, `P1-FR-004`, `P1-FR-016` | `MVP-04`, `MVP-08` | `UC-04` | `BF-11` Conditional Jump Flow & Path Browse | `Course`, `Unit`, `Lesson`, `LearningProgress` | `SEQ-04` | Surface 10, §4.1 JumpService (>=95%, 24h) | `FROZEN` |
| `P1-FR-003`, `P1-FR-012/013`, Policy D7 | `MVP-05/06/07` | `UC-05` | `BF-09` Learn & `BF-10` Retry | `Exercise`, `Concept`, `KnowledgeGap`, `ConceptMastery` | `SEQ-05` | Surface 6/8, §4.1 LessonExecutionService | `FROZEN` |
| `P1-FR-005`, `P1-FR-006`, Policy D8 | `MVP-09` | `UC-06` | `BF-12` SRS Review Flow | `user_vocab_srs`, `review_logs`, RPC `record_review` | `SEQ-06` | Surface 7 (RPC), §4.1 SrsScheduler (Policy B) | `FROZEN` |
| `P1-FR-004`, `P1-FR-016` (Skill Profile) | `MVP-08/10/11` | `UC-07` | `BF-13` Progress Tracking | `LearningProgress`, `Profile.streak_count`, `SkillProfile` | `SEQ-07` | Surface 6/7, §4.1 StreakEvaluator (Asia/Ho_Chi_Minh) | `FROZEN` |
| `P1-FR-008`, ADR-002, ADR-004 | `MVP-12` | `UC-08` | `BF-03/04/06` Authoring | `Lesson` (`creatorId`), `Exercise` (supersedesId [TARGET-CANDIDATE DD-02]) | `SEQ-08` | Surface 9 (Admin/Prisma), §4.1 ContentLifecycle | `FROZEN` |
| `P1-FR-008`, ADR-004 (SoD) | `MVP-13` | `UC-09` | `BF-05` Content Review | `Lesson` (`reviewerId`, `status: IN_REVIEW/APPROVED`) | `SEQ-08` | Surface 9 (Admin/Prisma), §4.1 ContentLifecycle | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-004 | `MVP-13/19` | `UC-10` | `BF-07` Publish & `BF-02` Plan | `Lesson.isPublished`, `Unit` (4/4 published), `AuditLog` | `SEQ-08` | Surface 9 (Admin/Prisma), §4.1 ContentLifecycle | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-003 | `MVP-14` | `UC-11` | Account/Role Management | `Profile.role`, `AuditLog` | `SEQ-09` | Surface 9 (Admin/Prisma), §4.1 AdminService | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001` | `MVP-15` | `UC-12` | System Analytics & Reports | System Aggregated Views, Activity Logs | `SEQ-09` | Surface 9 (Admin/Prisma), §4.1 AdminService | `DESIGN` |
| `P1-NFR-001`, ADR-004 | `MVP-19` | `UC-13` | Security Audit Ledger | `AuditLog` (immutable event store) | `SEQ-09` | Surface 9 (Admin/Prisma), §5 State 9 | `FROZEN` |
| Operational Support | `MVP-16` | `UC-14` | `BF-15` Support Tickets | `SupportTicket`, `Profile` | `SEQ-09` | Surface 9 (Admin/Prisma), §4.1 SupportService | `DESIGN / SUPPORTING` |
| Scenario Free-Writing (`P1-FR-007`) | `MVP-18` | *(No UC — Stateless)* | `BF-14` Scenario Writing Flow | `ChatScenario`, transient GEC diffs | `SEQ-10` | Surface 2 & 4 (Proxy, 8.0s timeout, fallback) | `FROZEN (Stateless)` |
| Organizational Cohorts (B2B) | `MVP-17` | `UC-15` | Cohort & Group Management | `Cohort`, `CohortMember` (Extension Boundary) | `SEQ-09` | Boundary marker only, Surface 9 | `OPTIONAL BOUNDARY` |

---

## 10. M2.4 Component Architecture & Security Responsibility Matrix Traceability (Logical Design)

> Canonical Detail: [`docs/phase-1-m2-4-architecture-security.md`](phase-1-m2-4-architecture-security.md) (sections 1–15). Preserves 15-UC canonical catalog (`UC-01`..`UC-15`) and 15 Behavioral Families (`BF-01`..`BF-15`). Zero runtime code, zero schema migrations, zero ghost use cases (`UC-16/17/18`).

| Technical Requirement & Policy | MVP Feature | Canonical UC | Behavioral Family Mapping | Component Architecture Owner (#13) | Deployment & Security Zone (#14) | Security Matrix Enforcement Boundary (#16) | Governance Status |
|---|---|---|---|---|---|---|---|
| `P1-FR-001`, `P1-FR-010`, `P1-NFR-001` | `MVP-01`, `MVP-02` | `UC-01` | `BF-01` Authentication Flow | `COMP-DOM-01` Auth & Identity Service | Zone 1 (Client) ↔ Zone 2 (BFF) ↔ Zone 3 (GoTrue) | OP-01: App httpOnly cookie, DB RLS `profiles`, GoTrue emit | `FROZEN` |
| `P1-FR-014`, `P1-FR-015` | `MVP-02`, `MVP-10` | `UC-02` | Goal & Profile Configuration | `COMP-DOM-01` Auth & Identity Service | Zone 1 (Client) ↔ Zone 2 (BFF) ↔ Zone 3 (DB) | OP-02: App bounds `[5..120]`, DB RLS `auth.uid() = id`, client-local reminder | `FROZEN` |
| `P1-FR-016`, Policy D5, D6 | `MVP-03` | `UC-03` | `BF-08` Placement Test Flow | `COMP-DOM-03` Assessment & Diagnostic Service | Zone 1 (Client) ↔ Zone 2 (BFF) ↔ Zone 3 (DB) | OP-03: Mapping A (0–30), immutable `AssessmentResult`, emit `DIAGNOSTIC_COMPLETED` | `FROZEN` |
| `P1-FR-002`, `P1-FR-004`, `P1-FR-016` | `MVP-04`, `MVP-08` | `UC-04` | `BF-11` Conditional Jump Flow & Path Browse | `COMP-DOM-03` Assessment & Diagnostic Service | Zone 1 (Client) ↔ Zone 2 (BFF) ↔ Zone 3 (DB) | OP-04: $\ge 95\%$ check, 24h lockout guard, emit `JUMP_PASSED`/`JUMP_FAILED` | `FROZEN` |
| `P1-FR-003`, `P1-FR-012/013`, Policy D7 | `MVP-05/06/07` | `UC-05` | `BF-09` Learn & `BF-10` Retry | `COMP-DOM-05` Lesson Execution & Retry Service | Zone 1 (Client) ↔ Zone 2 (BFF) ↔ Zone 3 (DB) | OP-05: Policy D7 allowance/70% credit, DB RLS `user_progress` | `FROZEN` |
| `P1-FR-005`, `P1-FR-006`, Policy D8 | `MVP-09` | `UC-06` | `BF-12` SRS Review Flow | `COMP-DOM-04` SRS Scheduling Service | Zone 1 (Client) ↔ Zone 2 (BFF) ↔ Zone 3 (DB/RPC) | OP-06: Policy B `[1,3,7,14,30]`, atomic RPC `record_review`, log to `review_logs` | `FROZEN` |
| `P1-FR-004`, `P1-FR-016` (Skill Profile) | `MVP-08/10/11` | `UC-07` | `BF-13` Progress Tracking | `COMP-DOM-02` Curriculum & Progression Service | Zone 1 (Client) ↔ Zone 2 (BFF) ↔ Zone 3 (DB) | OP-05/06/07: Calendar date boundary (`Asia/Ho_Chi_Minh`), DB RLS `LearningProgress` | `FROZEN` |
| `P1-FR-008`, ADR-002, ADR-004 | `MVP-12` | `UC-08` | `BF-03/04/06` Authoring | `COMP-DOM-06` Content Lifecycle & SoD Service | Zone 1 (Admin) ↔ Zone 2 (Admin BFF) ↔ Zone 3 (DB) | OP-07: Creator role check, `supersedesId` [DD-02], emit `CONTENT_DRAFT_CREATED` | `FROZEN` |
| `P1-FR-008`, ADR-004 (SoD) | `MVP-13` | `UC-09` | `BF-05` Content Review | `COMP-DOM-06` Content Lifecycle & SoD Service | Zone 1 (Admin) ↔ Zone 2 (Admin BFF) ↔ Zone 3 (DB) | OP-08: Moderator check, SoD cut `auth.uid() != creatorId`, emit `CONTENT_APPROVED` | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-004 | `MVP-13/19` | `UC-10` | `BF-07` Publish & `BF-02` Plan | `COMP-DOM-06` Content Lifecycle & SoD Service | Zone 1 (Admin) ↔ Zone 2 (Admin BFF) ↔ Zone 3 (DB) | OP-09: Org Manager check, 4/4 Unit publish rule, emit `CONTENT_PUBLISHED` | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001`, ADR-020 | `MVP-14` | `UC-11` | Account/Role Management & Emergency | `COMP-DOM-07` Admin Governance & Audit Service | Zone 1 (Admin) ↔ Zone 2 (Admin BFF) ↔ Zone 3 (DB) | OP-10/11: Admin role check, emergency publish on `APPROVED` only, emit `AuditLog` | `FROZEN` |
| `P1-FR-008`, `P1-NFR-001` | `MVP-15` | `UC-12` | System Analytics & Reports | `COMP-DOM-07` Admin Governance & Audit Service | Zone 1 (Admin) ↔ Zone 2 (Admin BFF) ↔ Zone 3 (DB) | OP-12: Read-only aggregated views, PII minimization | `DESIGN` |
| `P1-NFR-001`, ADR-004, DD-03 | `MVP-19` | `UC-13` | Security Audit Ledger | `COMP-INFRA-05` Immutable Audit Log Store | Zone 2 (BFF) ↔ Zone 3 (Append-Only DB Store) | OP-13: Admin read-only audit query, UPDATE/DELETE denied, emit `AUDIT_LOG_INSPECTED` | `FROZEN` |
| Operational Support | `MVP-16` | `UC-14` | `BF-15` Support Tickets | `COMP-DOM-07` Admin Governance & Audit Service | Zone 1 (Admin) ↔ Zone 2 (Admin BFF) ↔ Zone 3 (DB) | OP-14: Operations Staff minimal lookup, no content editing | `DESIGN / SUPPORTING` |
| Scenario Free-Writing (`P1-FR-007`) | `MVP-18` | *(No UC — Stateless)* | `BF-14` Scenario Writing Flow | `COMP-DOM-08` AI Integration & Proxy Service | Zone 1 (Client) ↔ Zone 2 (Proxy) ↔ Zone 4 (AI Engine) | OP-15: Forward user JWT, 8.0s timeout, circuit-breaker fallback, zero DB access | `FROZEN (Stateless)` |
| Organizational Cohorts (B2B) | `MVP-17` | `UC-15` | Cohort & Group Management | Extension Boundary | Zone 1 (Admin) ↔ Zone 2 (Admin BFF) ↔ Zone 3 (DB) | Boundary marker only, Future Migration | `OPTIONAL BOUNDARY` |

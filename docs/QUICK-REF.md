# Lingora — Quick Reference

> **Quy trình hiện hành — 2026-10-28:** Chủ dự án đã hủy `WP-DB-REMAIN-01`, preapply/Stage A/Stage B và cổng DATABASE READY để bắt đầu code app. Làm theo [AGENTS.md](../AGENTS.md): KISS, validation tại Backend, từng vertical slice. Đợt dọn dẹp tài liệu `DOC-CLEAN-01` đã hoàn tất (xem [báo cáo dọn dẹp](repository-cleanup-2026-10-28.md)). Các yêu cầu audit/hash/review và trạng thái vận hành cũ trong các tài liệu lịch sử không phải chỉ thị thực thi hiện hành. Chỉ đọc tài liệu liên quan đến tính năng đang làm. [Kết quả reset](../docs/pragmatic-reset-2026-10-28.md).

> **Hiện trạng nền tảng & Tác vụ tiếp theo:**
> - **Nền tảng mã nguồn:** Workspace `lingora-admin/` có product schema (34 models), 4 migration đã áp dụng, seed, Prisma Client và module DB tại `src/server/db/index.js`. Chưa có web framework, UI hay hệ thống đăng nhập trong checkout này.
> - **Test harness:** Disposable native test harness trong `lingora-admin/tests/database/` đang parked và tách biệt khỏi runtime sản phẩm.
> - **Đề xuất tiếp theo:** Vertical slice 1: [Quản lý Ngôn ngữ cho Admin](../plans/2026-10-27-next-app-slice.md), bao gồm xác thực phiên đăng nhập và kiểm tra quyền Admin tại Backend.
> - **Thẩm quyền hiện hành:** Tác vụ đang thực hiện tại [current-task](../plans/current-task.md); thông tin bàn giao tại [HANDOFF](../HANDOFF.md); bản đồ tài liệu tại [Authority map](README.md).
> - **Lịch sử kỹ thuật:** Các báo cáo trước đây (như [Remediation Review 2026-10-27](design/physical/evidence/2026-10-27-product-database-finalize/remediation-review.md), [RDR correction](design/rdr-correction-2026-10-22.md), [phased spec](../plans/2026-10-22-database-runtime-implementation-spec.md) và kết quả harness G0) được bảo toàn làm tài liệu tham khảo kỹ thuật, không còn là cổng chặn code.

## Current redesign boundary

**Full re-review (2026-10-21):** [Review](design/full-design-review-2026-10-21.md) recorded three P2 findings: logical audit actor cardinality, assessment contribution omission in drafts, and cross-scope fingerprint-check privileges. The subsequent [round-2 review](design/evidence/2026-10-22-rdr-correction/codex-review-round-2.md) identified remaining defects; the owner then authorized local corrections. See the current correction report for the changed state and its open verification limit. Physical design remains unapproved and implementation is not authorized by documentation corrections.

**Latest review (2026-10-20):** [Full design review](design/full-design-review-2026-10-20.md) recorded seven findings (3 P1 / 4 P2): UI guidance, logical assembly/revision/provenance and physical key/receipt/purpose mapping. Its dated verdict was NEEDS DESIGN RECONCILIATION; the current correction disposition follows below. Original review remains unchanged.

**FDR-01–07 corrections (2026-10-20):** [Correction report](design/design-correction-2026-10-20.md) records closure of those seven earlier design-document findings after semantic/native/physical visual review and static preservation checks. That task's then-current pointer was DONE. Physical mechanisms remain PROPOSED / NOT IMPLEMENTED; runtime NOT EXECUTED, live DB UNVERIFIED. Later RDR work is tracked separately in the current-task pointer.

**Use Case + Activity + Class Diagram baseline established.** [Class review](modeling/current-target/class-review-2026-10-16.md) completed semantic/trace/cardinality, independent and visual acceptance. Database-design reconciliation is COMPLETE under the PO database request: [current reconciliation](design/physical/database-reconciliation-2026-10-20.md) updates the 34-table proposal against this baseline and ADR-043. Physical mechanisms remain PROPOSED / NOT IMPLEMENTED; implementation planning/execution and live migrations are not authorized by documentation acceptance. Independent documentation review PASS for that reconciliation; current status is recorded only in current-task.

Exactly three business roles: **Admin, Teacher, Learner**, one role per account (ADR-034). Admin assigns/reassigns work, reviews, approves and publishes; assigned Teachers author content; Learners self-register and learn. Old six-role matrices and two-role SQL are legacy artifacts, not the redesign permission model.

## What actually exists

| Area | Verified repository state |
|---|---|
| Learner web | Legacy Web app removed; no web framework, API routes or learner UI in current checkout. |
| Learning flows | Placement, learning contexts, course/lesson execution, progress and SRS runtime absent. |
| Admin application | No web framework, dev/build scripts, API routes or UI components implemented yet. |
| Database foundation | Product schema (34 models) at `lingora-admin/prisma/product/schema.prisma`, 4 migrations up to date, seed, Prisma Client and server DB module (`src/server/db/index.js`). |
| Database harness | P0 disposable harness accepted at G0 with 20-table fixture; A3 parked and unaccepted; A1/A2/G1 not executed. Harness is parked and separate from product runtime. |
| AI | No tracked AI runtime or learner AI proxy/routes. Ignored local cache and separate public staging are not current app source. |

## Design sources and boundaries

| Topic | Source and status |
|---|---|
| Approved product/domain rules | [Decision log](../logs/decision-log.md): ADR-030–036, ADR-041–044, each within its scope. No physical/implementation authorization. |
| Behavioral catalog | [UC specifications](use-case-specifications.md): 14 identities, reminder UC-03 deferred; Reassessment outside MVP. [Requirements](02-requirements.md) scoped addenda support these rules. |
| Use Case | [Canonical sources](modeling/current-target/README.md), UC-01–04; [nine report views](modeling/report-usecases/README.md), VIEW-RUC identifiers do not renumber UCs. |
| Activity | Canonical ACT-01/02/03/04/06/07/08/09. Corrected v2 layout saved in primary after independent acceptance on 2026-10-17; source-faithful routing repairs preserve approved behavior. Historical candidate retained. |
| Class | COMPLETE: 22 classes + 1 enum / 28 relationships; DOM-01 source, PNG/SVG and primary native page 29 synchronized. `Unit` / `AssessmentBlueprintVersion`; [review/trace](modeling/current-target/class-review-2026-10-16.md). Earlier candidate/history preserved. |
| Native editing | [44-page Draw.io](modeling/current-target/lingora-all-diagrams.drawio); the 2026-10-22 RDR correction updates DOM-01 and DATA-03, preserving the other 42 pages. New native exports live under the current evidence folder; older evidence files are restored. Do not run a full-bundle builder for a single page. |
| Database design | [Reconciled proposal](design/physical/database-reconciliation-2026-10-20.md): 34-table catalog/security/four-view ERD; RDR corrections add draft omission/readiness, exact cross-scope checker privileges and collision locking. Physical remains PROPOSED; see the current correction report for review and verification status. Live DB UNVERIFIED; older READY verdicts are historical. |
| Later logical views | ACT-08, SEQ-03/04/08, STA-03 and DATA-03 now reconcile the seven findings. Other logical views are preserved, not blanket reapproved; core API/config/NFR/implementation-slice readiness remain separate. |
| Planning | [2026-10-22 RDR correction](design/rdr-correction-2026-10-22.md) covers RDR-01–03; cleanup results are in [báo cáo dọn dẹp](repository-cleanup-2026-10-28.md). Earlier Sequence-first and Phase 2 roadmaps remain historical proposals. [Current task](../plans/current-task.md) controls execution scope. |

DOM closeout is in [current class evidence](modeling/current-target/evidence/2026-10-16-class-review/independent-review.md); [old completion evidence](modeling/current-target/evidence/2026-10-12-class-design-completion/) and its [unfinished report](modeling/current-target/class-design-completion-2026-10-12.md) remain historical. The [original Activity v2 evidence](modeling/current-target/evidence/2026-10-12-ad-layout-v2/) is unchanged; [corrected Activity acceptance](modeling/current-target/evidence/2026-10-16-activity-layout/independent-review.md) covers the saved primary layout. Seventeen stale source hashes are reconciled. [Maintenance closeout](modeling/current-target/modeling-closeout-2026-10-16.md) records current verification. Use `verify_current.py` for current 36-source/72-output and 44-page integrity; old task-specific verifiers and snapshots remain historical. Artifact integrity does not approve downstream designs.

## Approved semantic guardrails

ADR-030/031: curriculum scoped by language/framework; one context per learner/language, at most two ACTIVE; account-global profile/streak, context-owned learning state; LearningPlan/Progress may be derived. ADR-032: Placement recommends a starting level, not verified proficiency; self-report/default entry supported. ADR-033/036: completion separate from correctness/performance; configured curriculum gate plus passed Level-up; Jump and Reassessment deferred. ADR-035: trusted server identity/role/status, assignment versus revision lifecycle, assessment grading secrecy, trusted/idempotent SRS, audit. ADR-041: internal due/overdue SRS selection, excluded from immutable scored assessments. ADR-042: context Study Focus biases next supplementary practice only. ADR-043: system assembles Teacher-submitted Lesson question packages by blueprint; Admin reviews/approves/publishes, with no separate whole-assessment Teacher assignment. Fixed English counts/thresholds are not platform invariants.

## Navigation

Use [AGENTS.md](../AGENTS.md) for workflow, [docs/README.md](README.md) for topic authority, [environment notes](../ENVIRONMENT.md) for dated toolchain context. Architecture, API, data, traceability and old logical design documents are routed through that authority map; do not infer current implementation or accepted physical schema from their existence. The audit preserves dated reviews, approvals, logs and source/export provenance rather than overwriting historical evidence.

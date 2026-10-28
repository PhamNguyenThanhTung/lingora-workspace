# Lingora — Canonical Modeling / Bộ sơ đồ báo cáo

**2026-10-22 — code cũ đã xóa; sửa thiết kế RDR đang được rà soát:** Dự án mới đang design. DATA-01/02, DEP-01 và SYS-01/03 là **snapshot lịch sử của code/config trước cleanup**, đọc cùng Git `84baa85`; không chứng minh checkout hiện có app, Prisma hay migrations. Giữ nguyên source/ảnh/native/manifest và nhãn `CURRENT` của snapshot để bảo toàn provenance, không coi nhãn cũ là trạng thái hiện tại. Owner đã yêu cầu sửa RDR-01–03 sau review vòng 2; xem [báo cáo sửa hiện tại](../../design/evidence/2026-10-22-rdr-correction/codex-self-correction.md). Các cập nhật chưa được nghiệm thu độc lập; physical design vẫn PROPOSED và live DB UNVERIFIED.

**Current correction 2026-10-20 COMPLETE:** [FDR-01–07 correction report](../../design/design-correction-2026-10-20.md) reconciles ACT-08, SEQ-03/04/08, STA-03 and DATA-03 with ADR-043 and accepted revision/provenance rules. Source/render/native acceptance and current integrity PASS. Other 38 native pages, Class and historical acceptance remain preserved; this is not blanket acceptance of all downstream views. Physical mechanisms stay proposed; no runtime implementation.


**Trạng thái hiện tại (2026-10-16): CLASS DIAGRAM COMPLETE.** DOM-01 được chấp nhận làm baseline logical/domain sau semantic review, traceability, independent review, source/native parity và visual acceptance trong [class review](class-review-2026-10-16.md). Use Case và Activity baseline được giữ nguyên. Physical/database design NOT STARTED / NOT APPROVED by this task; implementation và implementation planning NOT AUTHORIZED. Kết luận READY FOR PHYSICAL DESIGN trong [final-review.md](final-review.md) vẫn là lịch sử, không cho phép bước downstream.

**DOM đã đồng bộ:** [PUML](src/DOM-01-core-domain-model.puml), PNG/SVG và primary Draw.io page 29 hiện cùng 22 class + 1 enum, 28 relations, `Unit` / `AssessmentBlueprintVersion`. Trong task Class ngày 2026-10-16, chỉ DOM-01 được merge/render; 43 trang còn lại và các candidate Use Case/Activity được giữ byte-identical tại thời điểm đó. [Evidence hiện tại](evidence/2026-10-16-class-review/independent-review.md) giữ inventory, provenance, review và checks. [Candidate cũ](evidence/2026-10-12-class-design-completion/candidate.drawio), [completion chưa đóng](class-design-completion-2026-10-12.md) và [audit tại entry](../../repository-audit-2026-10-16.md) là lịch sử được giữ nguyên. Sequence/logical data/security/deployment bên dưới cần đối chiếu riêng sau baseline lớp; không được phê duyệt lại bởi task này.

**Authority:** PO decisions → ADR-036 → ADR-030–035 trong phạm vi tương thích → [requirements](../../02-requirements.md) → [UC catalog](../../use-case-specifications.md) → [traceability](../../05-traceability-matrix.md) → modeling. [Decision log](../../../logs/decision-log.md), [correction report](review.md), [final review report](final-review.md).

Bộ canonical gồm **36 sources: 30 TARGET + 5 CURRENT + 1 DEFERRED**, 35 views active. ID diagram VIEW-UC-01–04 khác UC-01–14 của catalog; giữ nguyên filename `UC-*.puml`. Catalog vẫn 13 UC active và reminder UC-03 deferred. Supporting “Đăng nhập / Xác thực” trong Overall chỉ là presentation của UC-01; không tạo UC-15. Report-oriented functional views are maintained separately in [report-usecases](../report-usecases/README.md); their VIEW-RUC labels are not canonical UCs and do not enter the 36-source canonical inventory. `<<include>>` diễn tả phụ thuộc phiên xác thực theo yêu cầu PO, không yêu cầu nhập mật khẩu lại ở mỗi hành động.

Các hình dùng nền trắng, chữ/association đen, border đen/xám, tiêu đề tiếng Việt. Tên lớp/entity và thuộc tính logic giữ English để map model. Metadata/authority/mapping nằm trong source comment và index. SVG là bản vector dùng để dàn trang; PNG dùng xem nhanh.

**Maintenance 2026-10-17 COMPLETE:** [Activity/provenance closeout](modeling-closeout-2026-10-16.md) records eight corrected Activity pages saved to primary, independent visual/source acceptance and preservation of the other 36 pages including DOM. Seventeen stale source hashes reconciled; 36 source/export records and 44 native pages pass current integrity checks. Original candidates and historical approvals remain unchanged.

## Main Report Diagrams

20 hình TARGET được đề xuất theo thứ tự báo cáo: context → UC → activity → sequence → domain → logical ERD → security/deployment. Chọn hình phù hợp chương; không cần chèn cả 20 vào slide. DOM/ERD cần trang ngang riêng để giữ font dễ đọc.

| ID | Hình | Source | SVG | PNG |
|---|---|---|---|---|
| SYS-02 | Sơ đồ ngữ cảnh hệ thống Lingora | [PUML](src/SYS-02-target-context.puml) | [SVG](rendered/SYS-02-target-context.svg) | [PNG](rendered/SYS-02-target-context.png) |
| VIEW-UC-01 | Sơ đồ Use Case tổng quan hệ thống Lingora | [PUML](src/UC-01-target-overall.puml) | [SVG](rendered/UC-01-target-overall.svg) | [PNG](rendered/UC-01-target-overall.png) |
| VIEW-UC-02 | Sơ đồ Use Case của Học viên | [PUML](src/UC-02-target-learner.puml) | [SVG](rendered/UC-02-target-learner.svg) | [PNG](rendered/UC-02-target-learner.png) |
| VIEW-UC-03 | Sơ đồ Use Case của Giáo viên | [PUML](src/UC-03-target-teacher.puml) | [SVG](rendered/UC-03-target-teacher.svg) | [PNG](rendered/UC-03-target-teacher.png) |
| VIEW-UC-04 | Sơ đồ Use Case của Quản trị viên | [PUML](src/UC-04-target-admin.puml) | [SVG](rendered/UC-04-target-admin.svg) | [PNG](rendered/UC-04-target-admin.png) |
| ACT-01 | Sơ đồ hoạt động – Khởi đầu học và chọn ngôn ngữ | [PUML](src/ACT-01-learner-onboarding.puml) | [SVG](rendered/ACT-01-learner-onboarding.svg) | [PNG](rendered/ACT-01-learner-onboarding.png) |
| ACT-02 | Sơ đồ hoạt động – Kiểm tra xếp lớp | [PUML](src/ACT-02-placement-assessment.puml) | [SVG](rendered/ACT-02-placement-assessment.svg) | [PNG](rendered/ACT-02-placement-assessment.png) |
| ACT-03 | Sơ đồ hoạt động – Học bài và luyện tập | [PUML](src/ACT-03-lesson-learning.puml) | [SVG](rendered/ACT-03-lesson-learning.svg) | [PNG](rendered/ACT-03-lesson-learning.png) |
| ACT-04 | Sơ đồ hoạt động – Kiểm tra lên cấp | [PUML](src/ACT-04-level-up-assessment.puml) | [SVG](rendered/ACT-04-level-up-assessment.svg) | [PNG](rendered/ACT-04-level-up-assessment.png) |
| ACT-06 | Sơ đồ hoạt động – Thêm từ và ôn tập ngắt quãng | [PUML](src/ACT-06-srs-review.puml) | [SVG](rendered/ACT-06-srs-review.svg) | [PNG](rendered/ACT-06-srs-review.png) |
| ACT-08 | Sơ đồ hoạt động – Soạn thảo, duyệt và xuất bản nội dung | [PUML](src/ACT-08-content-governance.puml) | [SVG](rendered/ACT-08-content-governance.svg) | [PNG](rendered/ACT-08-content-governance.png) |
| SEQ-01 | Sơ đồ trình tự – Đăng nhập và kiểm tra quyền truy cập | [PUML](src/SEQ-01-login-authorization.puml) | [SVG](rendered/SEQ-01-login-authorization.svg) | [PNG](rendered/SEQ-01-login-authorization.png) |
| SEQ-04 | Sơ đồ trình tự – Thẩm định, phê duyệt và xuất bản nội dung | [PUML](src/SEQ-04-review-approve-publish.puml) | [SVG](rendered/SEQ-04-review-approve-publish.svg) | [PNG](rendered/SEQ-04-review-approve-publish.png) |
| SEQ-06 | Sơ đồ trình tự – Làm bài tập và ghi nhận hoàn thành bài học | [PUML](src/SEQ-06-lesson-exercise-submission.puml) | [SVG](rendered/SEQ-06-lesson-exercise-submission.svg) | [PNG](rendered/SEQ-06-lesson-exercise-submission.png) |
| SEQ-07 | Sơ đồ trình tự – Nộp bài kiểm tra xếp lớp hoặc lên cấp | [PUML](src/SEQ-07-assessment-submission.puml) | [SVG](rendered/SEQ-07-assessment-submission.svg) | [PNG](rendered/SEQ-07-assessment-submission.png) |
| SEQ-08 | Sơ đồ trình tự – Thêm từ vựng và ôn tập ngắt quãng | [PUML](src/SEQ-08-srs-review.puml) | [SVG](rendered/SEQ-08-srs-review.svg) | [PNG](rendered/SEQ-08-srs-review.png) |
| DOM-01 | Sơ đồ lớp miền của hệ thống Lingora | [PUML](src/DOM-01-core-domain-model.puml) | [SVG](rendered/DOM-01-core-domain-model.svg) | [PNG](rendered/DOM-01-core-domain-model.png) |
| DATA-03 | Sơ đồ quan hệ dữ liệu logic của Lingora | [PUML](src/DATA-03-target-logical-erd.puml) | [SVG](rendered/DATA-03-target-logical-erd.svg) | [PNG](rendered/DATA-03-target-logical-erd.png) |
| SEC-01 | Sơ đồ luồng dữ liệu và ranh giới tin cậy | [PUML](src/SEC-01-target-trust-boundary-dfd.puml) | [SVG](rendered/SEC-01-target-trust-boundary-dfd.svg) | [PNG](rendered/SEC-01-target-trust-boundary-dfd.png) |
| DEP-02 | Sơ đồ phân bố triển khai dự kiến của Lingora | [PUML](src/DEP-02-target-deployment.puml) | [SVG](rendered/DEP-02-target-deployment.svg) | [PNG](rendered/DEP-02-target-deployment.png) |

## Supporting Modeling Diagrams

10 hình TARGET chi tiết cho phụ lục/technical review: modules, provisioning, replacement, state và sequence quản trị. Các cặp activity/sequence/state là góc nhìn khác nhau của cùng flow, không phải nguồn canonical trùng byte.

| ID | Hình | Source | SVG | PNG |
|---|---|---|---|---|
| ACT-07 | Sơ đồ hoạt động – Khởi tạo tài khoản giáo viên | [PUML](src/ACT-07-teacher-provisioning.puml) | [SVG](rendered/ACT-07-teacher-provisioning.svg) | [PNG](rendered/ACT-07-teacher-provisioning.png) |
| ACT-09 | Sơ đồ hoạt động – Thay thế và thu hồi phiên bản | [PUML](src/ACT-09-revision-replacement.puml) | [SVG](rendered/ACT-09-revision-replacement.svg) | [PNG](rendered/ACT-09-revision-replacement.png) |
| SEQ-02 | Sơ đồ trình tự – Cấp tài khoản Giáo viên | [PUML](src/SEQ-02-teacher-provisioning.puml) | [SVG](rendered/SEQ-02-teacher-provisioning.svg) | [PNG](rendered/SEQ-02-teacher-provisioning.png) |
| SEQ-03 | Sơ đồ trình tự – Phân công, soạn và nộp nội dung | [PUML](src/SEQ-03-assignment-authoring-submit.puml) | [SVG](rendered/SEQ-03-assignment-authoring-submit.svg) | [PNG](rendered/SEQ-03-assignment-authoring-submit.png) |
| SEQ-05 | Sơ đồ trình tự – Thay thế phiên bản và bảo toàn lịch sử | [PUML](src/SEQ-05-revision-replacement.puml) | [SVG](rendered/SEQ-05-revision-replacement.svg) | [PNG](rendered/SEQ-05-revision-replacement.png) |
| SEQ-09 | Sơ đồ trình tự – Hỗ trợ tài khoản Học viên và kiểm soát truy cập | [PUML](src/SEQ-09-disable-account-enforcement.puml) | [SVG](rendered/SEQ-09-disable-account-enforcement.svg) | [PNG](rendered/SEQ-09-disable-account-enforcement.png) |
| STA-01 | Sơ đồ trạng thái – Tài khoản | [PUML](src/STA-01-account-status.puml) | [SVG](rendered/STA-01-account-status.svg) | [PNG](rendered/STA-01-account-status.png) |
| STA-02 | Sơ đồ trạng thái – Trách nhiệm công việc được giao | [PUML](src/STA-02-assignment-lifecycle.puml) | [SVG](rendered/STA-02-assignment-lifecycle.svg) | [PNG](rendered/STA-02-assignment-lifecycle.png) |
| STA-03 | Sơ đồ trạng thái – Phiên bản nội dung | [PUML](src/STA-03-content-revision-lifecycle.puml) | [SVG](rendered/STA-03-content-revision-lifecycle.svg) | [PNG](rendered/STA-03-content-revision-lifecycle.png) |
| SYS-04 | Sơ đồ kiến trúc thành phần logic của Lingora | [PUML](src/SYS-04-target-components.puml) | [SVG](rendered/SYS-04-target-components.svg) | [PNG](rendered/SYS-04-target-components.png) |

## Historical implementation snapshots (retained CURRENT metadata)

5 hình mang nhãn CURRENT bên dưới chỉ mô tả repository/configuration **trước khi xóa code ngày 2026-10-22**. DATA-01 là subset 8/17 bảng migrations cũ; DATA-02 là subset 7/18 Prisma models cũ. Hai artifacts không khớp nhau và nay chỉ còn trong Git history. Không lấy chúng làm CSDL TARGET hoặc bằng chứng runtime hiện có; live DB/deployed enforcement chưa kiểm chứng.

| ID | Hình | Source | SVG | PNG |
|---|---|---|---|---|
| DATA-01 | Sơ đồ dữ liệu từ migration trong repository (CURRENT) | [PUML](src/DATA-01-current-migration-erd.puml) | [SVG](rendered/DATA-01-current-migration-erd.svg) | [PNG](rendered/DATA-01-current-migration-erd.png) |
| DATA-02 | Sơ đồ mô hình Prisma trong repository (CURRENT) | [PUML](src/DATA-02-current-prisma-model.puml) | [SVG](rendered/DATA-02-current-prisma-model.svg) | [PNG](rendered/DATA-02-current-prisma-model.png) |
| DEP-01 | Sơ đồ cấu hình triển khai trong kho mã nguồn | [PUML](src/DEP-01-current-deployment.puml) | [SVG](rendered/DEP-01-current-deployment.svg) | [PNG](rendered/DEP-01-current-deployment.png) |
| SYS-01 | Sơ đồ ngữ cảnh hệ thống theo mã nguồn hiện có | [PUML](src/SYS-01-current-context.puml) | [SVG](rendered/SYS-01-current-context.svg) | [PNG](rendered/SYS-01-current-context.png) |
| SYS-03 | Sơ đồ thành phần theo mã nguồn hiện có | [PUML](src/SYS-03-current-components.puml) | [SVG](rendered/SYS-03-current-components.svg) | [PNG](rendered/SYS-03-current-components.png) |

## Deferred

ACT-05 giữ source và output để truy vết; DEFERRED — NOT IN MVP. Không thuộc Main Report hay learner journey active.

| ID | Hình | Source | SVG | PNG |
|---|---|---|---|---|
| ACT-05 | Kiểm tra đánh giá lại – DEFERRED — NOT IN MVP | [PUML](src/ACT-05-reassessment.puml) | [SVG](rendered/ACT-05-reassessment.svg) | [PNG](rendered/ACT-05-reassessment.png) |

## Domain và data: hai abstraction khác nhau

DOM-01 sử dụng UML association/multiplicity, concept nghiệp vụ và thuộc tính tối thiểu; có LearningPlan/Progress dẫn xuất. DATA-03 dùng logical identifier, reference và cardinality dữ liệu; có response records, liên kết Lesson–Vocabulary, version-bound items và assignment/SRS history. AccountRecord nhóm User/Profile; CurriculumReference nhóm các tham chiếu chương trình. Các nhóm này không quyết định denormalization hay tên bảng vật lý. Reference có trong thuộc tính nhưng không vẽ tất cả join để tránh đường nối rối; vẫn phải map đầy đủ trong physical design được duyệt riêng.

## Reproduce verification

Từ repository root:

```powershell
$env:PYTHONUTF8='1'
py -3.11 docs/modeling/current-target/verify_current.py
py -3.11 docs/modeling/current-target/evidence/2026-10-16-modeling-closeout/verify_closeout.py
git diff --check
```

Renderer dùng Java/local PlantUML jar; có thể đặt `PLANTUML_JAR` khi vị trí khác mặc định. `render.py` ghi đè exports/manifest; không chạy để audit read-only hoặc tự đồng bộ native. Manifest ghi identity/classification từ source comments và hash source/style/output. [Static evidence](verification-output.txt), [manual visual record](evidence/visual-review.md), [task](../../../plans/current-task.md). Static checks không thay manual review.

Historical Class acceptance (2026-10-16) remains recorded in [Class verification](evidence/2026-10-16-class-review/verification.json) and [visual acceptance](evidence/2026-10-16-class-review/visual-review.md). The old `verify.py` and `verify_class.py` contain task-specific preservation assertions; they are not the current aggregate acceptance commands after the authorized Activity/provenance maintenance. Do not rerun a full builder/renderer to fix a single page. Current checks above verify artifacts, not downstream semantic approval.

Prior review/verifier/output được giữ nguyên nội dung trong `evidence/2026-10-11-prior-*` để truy vết trước correction; approval/archive snapshots cũ không bị sửa. Vòng này dừng trước final approval/physical design/implementation.

## Editable draw.io diagram set

The current primary deliverable is [lingora-all-diagrams.drawio](lingora-all-diagrams.drawio), with **44 pages: 35 active canonical views and nine report functional Use Case views**. The report views occupy pages 09–17 immediately after page 08 Admin; deferred ACT-05 remains excluded. All nine report pages were corrected on 2026-10-12 with editable native actors, boundaries, ellipses and connectors, no note boxes or redundant dependencies. [Before/after report and current native previews](../report-usecases/cleanup-review-2026-10-12.md) document the targeted correction. The other 35 page fragments were preserved byte-for-byte from this task's entry backup. Earlier 35-page export evidence in [the native render review](evidence/native-render-review.md) and [its preview manifest](evidence/native-render-review/final/manifest.csv) remains historical evidence. The full-bundle builder resynchronizes every page from PUML; it was not run for this nine-page correction. SVG-backed alternatives remain comparison artifacts only.

**Historical native draw.io layout task — TESTING snapshot:** The earlier readability pass covered the 35-page canonical set then present. See [native-render-review.md](evidence/native-render-review.md) for dated evidence. The bundle is tracked in synchronization commit `bc40d0f`; former untracked/no-commit statements describe their task-time state. DOM source/native divergence was resolved by the focused 2026-10-16 review; this does not reaccept or regenerate downstream views.


## Study Focus targeted addendum (ADR-042, 2026-10-12)

[PO addendum](../../study-focus-addendum.md) synchronizes ACT-01/03/06, SEQ-06/08 and DOM-01/DATA-03 only. No canonical UC/diagram identity changes. Context focus affects next supplementary composition; SRS selection stays internal/independent and secure assessments stay pinned. Scope/render/review evidence: [physical correction](../../design/physical/personalization-and-final-correction.md). Earlier full-review verdicts remain dated evidence, not approval of this physical proposal.

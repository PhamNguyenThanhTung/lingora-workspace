# Task

report-requirements-use-case-realignment

## Status

APPROVED

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Objective

Rà soát toàn bộ đề cương báo cáo/phân tích yêu cầu trong tài liệu người dùng cung cấp và viết lại thành kế hoạch phù hợp với baseline hiện tại của LINGORA. Kết quả phải phân biệt rõ:

1. Phạm vi sản phẩm Software Engineering đang được dự án cam kết.
2. Phạm vi Machine Learning/Deep Learning với T5-small GEC.
3. Nội dung báo cáo cần viết và bằng chứng cần thu thập.
4. Hai Use Case mở rộng đã được phê duyệt về mặt kế hoạch nhưng chưa triển khai.

Task này lập kế hoạch và tạo bộ nguồn báo cáo cho 10 Use Case. Không tạo số liệu khảo sát giả, không triển khai production code/API/UI/model/database. Việc đưa UC-09 và UC-11 vào kế hoạch không đồng nghĩa schema/API/UI đã được triển khai.

## Review kết luận

### 1. Những điểm đúng trong bản nháp

- Nên làm phân tích yêu cầu, User Story/Acceptance Criteria và đặc tả Use Case trước PlantUML và slide.
- Cần kiểm tra traceability thay vì chỉ vẽ sơ đồ độc lập.
- Cần mô tả GEC theo luồng prompt tình huống → input learner → T5-small correction → diff an toàn.
- Cần giữ SRS ở dạng deterministic cho đến khi audit `record_review` chứng minh thuật toán; chưa được tự gọi là SM-2.
- Cần giữ tương thích với các endpoint cũ trong giai đoạn migration.

### 2. Những điểm phải sửa

- Không được dùng các tỷ lệ như `N=45`, `84.4%`, `77.8%`, `88.9%`, `66.7%` nếu chưa có file dữ liệu khảo sát/phỏng vấn gốc. Báo cáo phải gắn nhãn `EVIDENCE-PENDING` hoặc trình bày định tính.
- Ba track cũ (DKT/HLR/SRS, chatbot MultiWOZ, GEC) không còn là phạm vi học thuật hiện tại. Baseline hiện tại chỉ có Software Engineering và ML/Deep Learning với T5-small GEC; DKT/HLR và MultiWOZ dialogue generation chỉ được giữ ở phần lịch sử `SUPERSEDED`.
- Không dùng các mã `UC-AUTH-*`, `UC-GEC-*` thay thế 8 mã hệ thống. Nếu cần chi tiết, dùng sub-flow/alternative flow và lập mapping rõ ràng về `UC-01`…`UC-08`.
- Placement test và achievements/badges được chấp nhận là Use Case mục tiêu bổ sung của kế hoạch này. Chúng vẫn cần requirement, acceptance criteria, traceability, thiết kế dữ liệu/API và task implementation riêng; leaderboard, social features, chatbot mở và entity lưu writing submission vẫn ngoài phạm vi.
- Không mô tả `corrections`, `error_type`, `suggested_text`, `explanation` như output tự giải thích của model. T5-small chỉ sở hữu `corrected_text`; các field còn lại là module xác định hoặc optional.
- Không tạo một Use Case riêng cho từng actor phụ trợ, endpoint, bảng dữ liệu hoặc bước UI. Use Case phải thể hiện mục tiêu có ý nghĩa của actor.

## Phạm vi Use Case được khóa cho báo cáo hiện tại

| Mã | Use Case cấp hệ thống | Actor chính | Năng lực/requirement | Trạng thái |
|---|---|---|---|---|
| UC-01 | Đăng ký, đăng nhập và quản lý phiên | Learner, Admin | P1-FR-001 | Foundation implemented |
| UC-02 | Khám phá và học bài | Learner | P1-FR-002 | Pending M2 |
| UC-03 | Làm bài tập tương tác và đánh giá | Learner | P1-FR-003, 012, 013 | Pending M2 |
| UC-04 | Quản trị nội dung và xuất bản | Admin | P1-FR-008, 009 | DB/RLS implemented; UI pending M3 |
| UC-05 | Ôn tập từ vựng bằng SRS xác định | Learner | P1-FR-005, 006 | RPC implemented; policy audit pending |
| UC-06 | Luyện viết theo tình huống với GEC | Learner, AI Service | P1-FR-007, ML-GEC-FR-001..004 | Target amended; implementation pending |
| UC-07 | Theo dõi tiến độ, streak và mục tiêu ngày | Learner | P1-FR-004, 011, 014 | Pending M2 |
| UC-08 | Nhắc nhở học tập trong ứng dụng | Learner | P1-FR-015 | Later M2+; in-app only |
| UC-09 | Kiểm tra trình độ đầu vào và gợi ý cấp độ | Learner | P1-FR-016 (proposed) | Approved target; implementation pending |
| UC-10 | Thành tích và huy hiệu học tập | Learner | P1-FR-017 (proposed) | Approved target; implementation pending |

Mười Use Case này là phạm vi báo cáo mục tiêu. UC-01…UC-08 là baseline đã có trong canonical docs; UC-09 và UC-11 là phần mở rộng được phê duyệt về mặt kế hoạch nhưng chưa được coi là implemented. Các mã này được giữ nguyên theo đề xuất người dùng; không tạo UC-10 để tránh đánh số giả.

### Ràng buộc UC-09 và UC-11

- `UC-09 Placement Test`: learner làm bài test đầu vào tái sử dụng exercise engine; hệ thống tính level theo policy xác định và gợi ý course/lesson theo `Course.cefr`. Không gọi là adaptive learning nếu chưa có policy và evidence; không cho phép learner tự đổi kết quả placement.
- `UC-11 Achievements/Badges`: hệ thống cấp badge riêng tư dựa trên event/progress đã xác định, tối thiểu streak và số từ đã ôn/hoàn thành. Streak trong UC-07 không tự động có nghĩa là badge system; cần khóa catalog badge, điều kiện cấp, idempotency và quyền xem.
- Hai Use Case này không được triển khai bằng cách âm thầm sửa 17-model schema. Nếu cần bảng/entity mới, API mới, trigger/RPC hoặc thay đổi RLS, task tương ứng phải quay lại REVIEW và nêu rõ trong allowlist.

## Gói nội dung báo cáo cần chuẩn bị

### A. Nghiên cứu người dùng và yêu cầu

Phải ghi phương pháp, đối tượng, thời gian, câu hỏi và nguồn bằng chứng. Khi chưa có dữ liệu gốc, chỉ dùng kết luận định tính với nhãn `EVIDENCE-PENDING`; không nội suy phần trăm.

Đầu ra cần có:

- Problem statement và scope/boundary.
- Stakeholder/actor catalog.
- Pain points và nhu cầu được truy nguyên về evidence.
- Assumptions, constraints, deferred scope.
- Bảng phân biệt “observed”, “inferred”, “approved requirement”.

### B. User Story và Acceptance Criteria

Viết cho 10 UC cấp hệ thống, ưu tiên UC-02, UC-03, UC-05, UC-06, UC-09 và UC-11. Acceptance criteria phải phản ánh behavior hiện tại hoặc được đánh dấu `PROPOSED` đối với UC-09/UC-11:

- GEC đi qua `Browser → Next.js Route Handler → FastAPI → T5-small`.
- Input rỗng/quá dài, scenario không tồn tại, unauthorized và model unavailable có lỗi chuẩn.
- SRS ghi qua `record_review`, ownership lấy từ `auth.uid()`, không tự ghi từ browser.
- GEC không yêu cầu persistence mới trong MVP.
- UC-09 phải có bộ câu hỏi, scoring/level mapping, tie-breaking và fallback khi chưa đủ dữ liệu.
- UC-11 phải có badge catalog, điều kiện cấp xác định, chống cấp trùng và phạm vi riêng tư; không có leaderboard.

### C. Đặc tả Use Case

Mỗi đặc tả gồm: mục tiêu, actor, precondition, trigger, main flow, alternative/exception flows, postcondition, dữ liệu/API liên quan, security boundary, acceptance criteria và trace IDs.

Ưu tiên viết đầy đủ UC-03, UC-05, UC-06, UC-09 và UC-11; các UC còn lại tối thiểu đủ catalog và flow chính. Không biến sub-use-case thành danh mục thứ hai không mapping.

### D. Sơ đồ

Chỉ tạo sau khi đặc tả được review:

1. Use Case overview với Learner, Admin, AI Service.
2. Learner/Admin detail diagrams nếu cần.
3. Activity: lesson/exercise, SRS review, scenario GEC.
4. Sequence: auth/proxy, SRS RPC, GEC proxy/inference.
5. ERD dùng 17 model hiện có làm baseline; UC-09/UC-11 phải có sơ đồ đề xuất riêng nếu cần entity mới và phải ghi rõ `PROPOSED / NOT IMPLEMENTED`.

### E. Báo cáo và slide

Báo cáo SE trình bày sản phẩm web, yêu cầu, 10 UC, kiến trúc, dữ liệu, security/RLS, test và traceability; phải phân biệt 8 UC baseline với 2 UC proposed. Báo cáo ML trình bày dataset/license/split, T5-small, baseline, Precision/Recall/F0.5/ERRANT-compatible, latency và giới hạn. Báo cáo NLP độc lập không còn là deliverable hiện hành; tài liệu cũ chỉ được đánh dấu historical/superseded.

Slide làm sau khi report, sơ đồ và evidence ổn định; không dùng slide để thay thế đặc tả.

## Files Expected To Change

- `plans/current-task.md`
- `plans/approved/2026-08-21-report-requirements-use-case-realignment-APPROVED.md`
- `docs/report/lingora-requirements-and-use-cases.md`
- `docs/report/evidence-register.md`
- `docs/plantuml/use-case-overview.puml`
- `docs/plantuml/use-case-learner.puml`
- `docs/plantuml/use-case-admin.puml`
- `docs/plantuml/activity-lesson-exercise.puml`
- `docs/plantuml/activity-srs-review.puml`
- `docs/plantuml/activity-gec-practice.puml`
- `docs/plantuml/activity-placement-test.puml`
- `docs/plantuml/activity-achievements.puml`
- `docs/plantuml/sequence-auth.puml`
- `docs/plantuml/sequence-srs.puml`
- `docs/plantuml/sequence-gec.puml`
- `docs/plantuml/sequence-placement-test.puml`
- `docs/plantuml/sequence-achievements.puml`
- `docs/plantuml/dfd-context.puml`
- `docs/plantuml/erd-baseline-and-proposed.puml`
- `logs/test-log.md`
- `logs/development-log.md`

Không được tự sửa `docs/00`–`docs/07`, schema, migrations, API runtime, UI, model artifacts hoặc report binaries trong task DRAFT này.

## Review gates trước khi xin APPROVE

- [x] Mọi claim khảo sát có nguồn hoặc được gắn `EVIDENCE-PENDING`.
- [x] 8 UC baseline mapping với P1 requirements và traceability còn nguyên.
- [x] UC-09/UC-11 có requirement IDs proposed, acceptance criteria và trạng thái implementation pending.
- [x] UC-09/UC-11 không được ghi là implemented và không làm thay đổi schema/API/RLS trong task này.
- [x] Không còn active claim về DKT/HLR/DQN/MultiWOZ dialogue generation.
- [x] GEC responsibility, proxy boundary, error envelope và persistence boundary nhất quán.
- [x] SRS chưa gọi là SM-2 nếu chưa có RPC audit.
- [x] PlantUML/report/slide được xếp sau requirements và UC specification.
- [x] Không có file ngoài allowlist cần sửa.

## Proposed test/evidence plan after approval

| ID | Kiểm tra | Bằng chứng |
|---|---|---|
| RPT-UC-001 | Scope/terminology scan | Không có active three-track hoặc UC mở rộng chưa duyệt |
| RPT-UC-002 | 10-UC trace | UC → P1-FR → component/data/API → test/report; UC-09/UC-11 marked proposed |
| RPT-UC-003 | Evidence audit | Nguồn khảo sát, claim status, không có số liệu bịa |
| RPT-UC-004 | Boundary review | Web proxy, FastAPI stateless, JWT, RLS, transient GEC |
| RPT-UC-005 | Diagram consistency | Actor/flow/entity/API khớp đặc tả |
| RPT-UC-006 | Scope expansion check | Placement/badges included as proposed targets; no unapproved implementation |

## Approval

Status: **APPROVED**

- Requested by: Pham Nguyen Thanh Tung
- Human action: User explicitly requested “thêm luôn 9 và 11 vào đi và approve”.
- Approval scope: approve the 10-Use-Case reporting plan, including UC-09 and UC-11 as proposed implementation targets and the report/PlantUML source files listed above.
- Explicit boundary: this approval authorizes documentation and diagram source files only. It does not authorize production code, schema, migration, RLS, RPC, API runtime, UI, model, dependency or report-binary changes. Each implementation change requires its own approved plan.
- Approval date: 2026-08-21

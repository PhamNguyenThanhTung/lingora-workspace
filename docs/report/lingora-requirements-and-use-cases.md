# LINGORA - Báo cáo Phân tích Yêu cầu và Mô hình hóa

**Phiên bản:** 0.1.0
**Ngày:** 2026-08-21
**Phạm vi:** Project 1 / Software Engineering

> Tài liệu phân biệt `OBSERVED`, `APPROVED` và `EVIDENCE-PENDING`. Không sử dụng số liệu khảo sát giả.

## 1. Mục tiêu và phạm vi

LINGORA là nền tảng Web học tiếng Anh gồm khóa học, bài học, từ vựng, bài tập, SRS xác định, luyện viết theo tình huống với GEC, tiến độ, streak, mục tiêu ngày và nhắc nhở trong ứng dụng. Track AI hiện hành là T5-small GEC; DKT/HLR/DQN và MultiWOZ dialogue generation chỉ là lịch sử `SUPERSEDED`.

### 1.1 Danh mục Use Case

| Mã | Tên | Actor chính | Trạng thái |
|---|---|---|---|
| UC-01 | Đăng ký, đăng nhập và quản lý phiên | Learner, Admin | Implemented foundation |
| UC-02 | Khám phá và học bài | Learner | Pending M2 |
| UC-03 | Làm bài tập tương tác và đánh giá | Learner | Pending M2 |
| UC-04 | Quản trị nội dung và xuất bản | Admin | DB/RLS có; UI pending M3 |
| UC-05 | Ôn tập từ vựng bằng SRS xác định | Learner | RPC có; policy audit pending |
| UC-06 | Luyện viết theo tình huống với GEC, nhập text hoặc giọng nói | Learner | Contract approved; internal GEC processing pending; client speech convenience approved |
| UC-07 | Theo dõi tiến độ, streak và mục tiêu ngày | Learner | Pending M2 |
| UC-08 | Nhắc nhở học tập trong ứng dụng | Learner | Later M2+ |
| UC-09 | Kiểm tra trình độ đầu vào và gợi ý cấp độ | Learner | Proposed; implementation pending |
| UC-10 | Thành tích và huy hiệu học tập | Learner | Proposed; implementation pending |

UC-09/UC-10 không được trình bày như chức năng đã có trong sản phẩm. Danh mục hiện hành dùng mã liên tục `UC-01`..`UC-10`.

## 2. Thu thập yêu cầu

### 2.1 Nguồn và quy định

`D:/ml/Bai 2 - Phân tích yêu cầu.pdf` yêu cầu xác định stakeholder; lập phỏng vấn/bảng hỏi; thu thập quy định/mẫu biểu; viết User Story/Acceptance Criteria; đặc tả FR/NFR; mô hình Use Case, Activity, DFD, ERD; xác minh; quản lý baseline và traceability.

Nguồn dự án: `docs/00`-`docs/07`, `DESIGN.md` và `plans/current-task.md`. Chi tiết evidence nằm trong [evidence-register.md](evidence-register.md).

### 2.2 Stakeholders

| Stakeholder | Mối quan tâm |
|---|---|
| Learner | Học bài, luyện tập, ôn tập, feedback, động lực |
| Admin/Teacher | Tạo, chỉnh sửa và xuất bản học liệu |
| Project owner/student | Đáp ứng Project 1 và ML/GEC deliverables |
| Supabase services | Auth, RLS, dữ liệu, RPC, media |
| GEC/T5-small internal processing | Xử lý chuỗi stateless, bounded, nằm trong ranh giới Lingora; không phải actor |
| Giảng viên/Reviewer | Quy trình phân tích, kiểm thử, traceability |

### 2.3 Phương pháp và giới hạn

Áp dụng document analysis, User Story, Use Case, phỏng vấn và questionnaire. Workspace có 6 biên bản phỏng vấn gốc và 3 bản ghi bổ sung; tần suất của hai nhóm được giữ riêng và không được diễn giải như thống kê đại diện.

### 2.4 Câu hỏi khảo sát/phỏng vấn

1. Trình độ và tần suất học tiếng Anh của bạn?
2. Ba khó khăn lớn nhất: từ vựng, ngữ pháp, nghe, viết, lộ trình hay thói quen?
3. Bạn đang ôn từ vựng bằng cách nào?
4. Bạn có muốn placement test khi bắt đầu? Thời lượng tối đa?
5. Bạn cần feedback GEC nào: câu sửa, vị trí lỗi, loại lỗi hay giải thích?
6. In-app reminder và badge riêng tư có hữu ích không?
7. Bạn có muốn leaderboard công khai không?
8. Lo ngại về dữ liệu cá nhân và AI correction?
9. Tính năng quan trọng nhất bạn muốn?

## 3. User Story và Acceptance Criteria

### US-01 - Xác thực phiên

**Story:** Với tư cách learner hoặc admin, tôi muốn đăng ký, đăng nhập, refresh phiên và đăng xuất để truy cập đúng chức năng.

**Acceptance criteria:** Credentials hợp lệ tạo phiên; lỗi xác thực an toàn; phiên dùng server-side `httpOnly` cookie; token không nằm trong local/session storage; refresh thất bại đưa về login; logout xóa phiên.

**Trace:** `UC-01`, `P1-FR-001`, `P1-NFR-001`.

### US-02 - Học bài và vocabulary

**Story:** Với tư cách learner, tôi muốn duyệt course/lesson đã xuất bản và học vocabulary theo lộ trình.

**Acceptance criteria:** Chỉ published content hiển thị; thứ tự ổn định; audio hợp lệ phát được; thiếu/unauthorized audio có trạng thái phục hồi.

**Trace:** `UC-02`, `P1-FR-002`.

### US-03 - Làm bài tập

**Story:** Với tư cách learner, tôi muốn làm MCQ, FILL_BLANK, REORDER, GRAMMAR và LISTENING để củng cố bài học.

**Acceptance criteria:** Payload được validate; hiển thị đúng/sai; mỗi submission cập nhật progress tối đa một lần; GRAMMAR/LISTENING dùng Exercise hiện có.

**Trace:** `UC-03`, `P1-FR-003`, `P1-FR-012`, `P1-FR-013`.

### US-04 - Quản trị nội dung

**Story:** Với tư cách Admin, tôi muốn tạo, sửa, xuất bản học liệu và media để learner chỉ thấy nội dung hợp lệ.

**Acceptance criteria:** Chỉ ADMIN được ghi; publish/unpublish hoạt động; learner write bị từ chối; sai MIME/quá giới hạn bị từ chối.

**Trace:** `UC-04`, `P1-FR-008`, `P1-FR-009`.

### US-05 - SRS xác định

**Story:** Với tư cách learner, tôi muốn ôn từ đến hạn và ghi kết quả để lịch ôn cập nhật nhất quán.

**Acceptance criteria:** Due card thỏa `nextReviewAt <= now` và thuộc learner; gọi `record_review`; một review tạo một log và cập nhật card trong cùng transaction; chưa gọi là SM-2 trước RPC audit.

**Trace:** `UC-05`, `P1-FR-005`, `P1-FR-006`.

### US-06 - Scenario writing với GEC và nhập liệu nói tùy chọn

**Story:** Với tư cách learner, tôi muốn trả lời prompt tình huống bằng cách gõ hoặc nói, nhận câu sửa và nghe câu mẫu để luyện độ chính xác và phản xạ tiếng Anh.

**Acceptance criteria:** Prompt theo thứ tự; giao diện có editor text và nút microphone; khi browser hỗ trợ `SpeechRecognition`/`webkitSpeechRecognition`, transcript được điền vào editor để learner sửa trước khi gửi; khi API không hỗ trợ hoặc permission bị từ chối, UI cảnh báo nhẹ và vẫn dùng text input; request gửi qua `Browser -> Next.js Route Handler -> FastAPI` với contract canonical `original_text` và `scenario_code`; input hợp lệ trả `corrected_text`; T5-small chỉ sở hữu field này; diff/error type do module xác định; nút speaker dùng `speechSynthesis` để phát câu sửa hoặc phrasing tùy chọn; lỗi input/scenario/auth/model dùng envelope chuẩn; GEC lỗi không chặn lesson/SRS. Speech-to-text và text-to-speech chỉ là tiện ích client-side, không gửi audio lên FastAPI, không thêm speech model hoặc persistence.

**Trace:** `UC-06`, `P1-FR-007`, `ML-GEC-FR-001..004`, `ML-GEC-NFR-001..002`.

### US-07 - Progress, streak và goal

**Story:** Với tư cách learner, tôi muốn xem tiến độ, streak và đặt mục tiêu ngày.

**Acceptance criteria:** Progress chuyển `NOT_STARTED -> IN_PROGRESS -> COMPLETED`; completion idempotent; streak tăng tối đa một lần/ngày theo timezone; `dailyGoalMin` scoped theo learner.

**Trace:** `UC-07`, `P1-FR-004`, `P1-FR-011`, `P1-FR-014`.

### US-08 - In-app reminder

**Story:** Với tư cách learner, tôi muốn thấy reminder trong app khi chưa học trong ngày.

**Acceptance criteria:** Chỉ hiện khi app mở trong cửa sổ chọn; không push khi app đóng; không dùng push subscription/device token; có thể đóng và không crash.

**Trace:** `UC-08`, `P1-FR-015`.

### US-09 - Placement test (PROPOSED)

**Story:** Với tư cách learner mới, tôi muốn làm bài test đầu vào ngắn để nhận gợi ý course/level.

**Acceptance criteria đề xuất:** Dùng exercise engine với bộ câu hỏi có version; policy xác định score, ngưỡng CEFR, tie-breaking và fallback; kết quả map theo `Course.cefr`; learner không tự sửa result; lỗi cho phép bỏ qua; persistence/API/RLS chỉ quyết định ở task implementation riêng.

**Trace mục tiêu:** `UC-09`, `P1-FR-016 (proposed)`.

### US-10 - Achievements và badges (PROPOSED)

**Story:** Với tư cách learner, tôi muốn nhận badge riêng tư cho mốc học tập.

**Acceptance criteria đề xuất:** Catalog có mã ổn định và điều kiện; điều kiện dựa trên progress/event; không cấp trùng; learner chỉ xem badge của mình; không leaderboard/social feed; lỗi badge không chặn lesson/SRS; entity/API/RPC/RLS chỉ quyết định ở task riêng.

**Trace mục tiêu:** `UC-10`, `P1-FR-017 (proposed)`.

## 4. Đặc tả yêu cầu phần mềm

### 4.0 Use Case specification summary

| UC | Preconditions | Main flow | Exception/fallback | Postcondition |
|---|---|---|---|---|
| UC-01 | User is on auth page | Submit credentials -> Supabase Auth -> secure session | Invalid credentials; refresh failure | Authenticated or safe login error |
| UC-02 | Published course exists | Browse course -> lesson -> vocabulary/audio | Empty/unavailable content | Learner sees lesson or recoverable state |
| UC-03 | Published lesson is open | Load ordered exercises -> answer -> validate -> score | Invalid payload/audio; retryable error | UserProgress updated idempotently |
| UC-04 | Admin session is valid | CRUD content/media -> publish | Non-admin, invalid file, RLS rejection | Approved content state changed |
| UC-05 | Learner owns SRS cards | Query due cards -> review -> record_review | Not owner, invalid input, RPC error | ReviewLog and card update atomic |
| UC-06 | Published scenario exists | Prompt -> choose typing/speech -> edit text -> proxy -> FastAPI -> correction -> diff -> optional speech synthesis | Unsupported/denied microphone, input/scenario/auth/model error | Safe transient correction, audio playback or retry state |
| UC-07 | Learner has profile/activity | Read progress -> update goal -> qualify activity | Invalid goal or duplicate day | Progress/streak/goal state updated |
| UC-08 | App is open in reminder window | Check daily activity -> show in-app reminder | No qualifying activity or dismissed reminder | Reminder shown/dismissed locally |
| UC-09 | New learner and test policy exists | Load versioned test -> answer -> score -> CEFR mapping | Insufficient answers -> default/skip | Proposed placement recommendation |
| UC-10 | Qualifying progress event exists | Evaluate badge rules -> idempotent award -> display private badge | Rule/data failure -> no-op | Proposed private award state |

UC-09 and UC-10 rows are approved targets, not implementation evidence.

### 4.1 Functional requirements mở rộng

Baseline là `P1-FR-001..015` trong `docs/02-requirements.md`.

| ID | Requirement | Trạng thái |
|---|---|---|
| P1-FR-016 | Learner làm placement test và nhận gợi ý CEFR/course theo policy xác định. | Approved plan; implementation pending |
| P1-FR-017 | Learner xem badge riêng tư được cấp idempotent theo mốc học tập. | Approved plan; implementation pending |

Hai ID này chưa phải schema/API contract. Nếu cần entity, API, RPC hoặc RLS phải tạo implementation plan và impact review.

### 4.2 Non-functional requirements

- **Security:** learner chỉ truy cập dữ liệu của mình; Admin write qua server/RLS; FastAPI stateless.
- **Performance:** GEC warm CPU p95 mục tiêu <= 2.000 ms; Web timeout 8 giây; chỉ ghi PASS khi có benchmark.
- **Reliability:** lesson/SRS dùng được khi GEC lỗi; UC-09/UC-10 lỗi không chặn học.
- **Usability:** Must screens có loading, empty, error, success và responsive behavior.
- **Maintainability:** IDs ổn định, JSON snake_case, thay đổi có impact analysis.
- **Privacy:** badge private-by-default; không leaderboard; placement result không tự sửa; audio không được gửi tới FastAPI hoặc lưu trong Lingora.

### 4.3 Ràng buộc và ngoài phạm vi

Giữ 17 Prisma models; không persistence writing submission; không speech service phía server; không chatbot sinh hội thoại, DKT/HLR/DQN, Web Push, leaderboard hoặc social feature; không dùng số liệu khảo sát chưa có nguồn. SpeechRecognition và `speechSynthesis` chỉ là tiện ích UI của browser, có fallback text-only khi không hỗ trợ hoặc bị từ chối quyền microphone.

## 5. Mô hình hóa yêu cầu

PlantUML source nằm trong `docs/plantuml/`:

| Diagram | File |
|---|---|
| Use Case overview | `use-case-overview.puml` |
| Learner Use Cases | `use-case-learner.puml` |
| Admin Use Cases | `use-case-admin.puml` |
| Auth Activity | `activity-auth-session.puml` |
| Lesson Activity | `activity-lesson-exercise.puml` |
| Admin Content Activity | `activity-admin-content.puml` |
| SRS Activity | `activity-srs-review.puml` |
| GEC Activity | `activity-gec-practice.puml` |
| Progress/Reminder Activity | `activity-progress-reminder.puml` |
| Placement Activity | `activity-placement-test.puml` |
| Achievements Activity | `activity-achievements.puml` |
| Auth Sequence | `sequence-auth.puml` |
| SRS Sequence | `sequence-srs.puml` |
| GEC Sequence | `sequence-gec.puml` |
| Placement Sequence | `sequence-placement-test.puml` |
| Achievements Sequence | `sequence-achievements.puml` |
| DFD Context | `dfd-context.puml` |
| DFD Level 0 | `dfd-level-0.puml` |
| DFD Lesson/Exercise | `dfd-lesson-exercise.puml` |
| DFD SRS | `dfd-srs.puml` |
| DFD GEC | `dfd-gec.puml` |
| ERD Baseline/Proposed | `erd-baseline-and-proposed.puml` |

### 5.1 DFD mức ngữ cảnh

Learner cung cấp credentials, answers, review result và writing input; nhận lesson, score, schedule, corrected text, progress và private badges. Admin cung cấp content/media/scenario và nhận publish/validation state. GEC/T5-small được mô hình hóa như xử lý nội bộ của Lingora; FastAPI chỉ là component triển khai và không sở hữu primary data. Supabase Auth, Postgres/RLS/RPC và Storage là supporting services.

### 5.2 ERD

ERD baseline dùng 17 models trong `docs/07-data-dictionary.md`. UC-09 có thể cần placement result hoặc tái sử dụng `UserProgress`; UC-10 có thể cần badge catalog/award. Hai quyết định chưa khóa; entity đề xuất phải ghi `PROPOSED / NOT IMPLEMENTED`.

## 6. Xác minh và quản lý

- Đúng: requirement có actor, goal và evidence.
- Đầy đủ: 10 UC được cover.
- Nhất quán: proxy, RPC, RLS và persistence boundary không mâu thuẫn.
- Khả thi: UC-09/UC-10 chưa hứa triển khai trước impact review.
- Kiểm thử được: criteria có success và error/fallback.
- Truy vết được: UC -> FR/NFR -> component/data/API -> test/report.

Mọi thay đổi UC-09/UC-10 phải cập nhật plan, requirement IDs, traceability, data/API impact và test plan; không sửa lịch sử approved/archive.

## 7. Kết luận

8 UC baseline phản ánh hệ thống hiện có; UC-09 và UC-10 là mục tiêu approved nhưng implementation pending. Bước tiếp theo là khóa placement scoring policy và badge catalog/rules trong các implementation plan riêng.

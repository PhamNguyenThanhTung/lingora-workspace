# LINGORA - BÁO CÁO PHÂN TÍCH YÊU CẦU VÀ MÔ HÌNH HÓA

**Môn học:** Phân tích và thiết kế hệ thống / Software Engineering
**Dự án:** Nền tảng Web học tiếng Anh Lingora
**Phiên bản:** 1.1 - 22/08/2026

## Tóm tắt

Lingora là nền tảng Web hỗ trợ học tiếng Anh qua khóa học, bài học, từ vựng, bài tập, ôn tập lặp lại có cấu trúc, theo dõi tiến độ và luyện viết theo tình huống. Báo cáo này tổng hợp yêu cầu từ tài liệu giảng viên, tài liệu canonical của dự án và sáu cuộc phỏng vấn bán cấu trúc. Báo cáo phân biệt rõ năng lực baseline, mục tiêu đã được phê duyệt nhưng chưa triển khai, và các nhu cầu còn nằm ngoài phạm vi.

## 1. Giới thiệu

### 1.1 Bối cảnh và vấn đề

Người học thường gặp khó khăn trong việc nhớ từ vựng, xác định thời điểm ôn, duy trì lịch học, biết nên học nội dung nào và đánh giá tiến bộ. Họ cũng mong muốn có môi trường thực hành và phản hồi lỗi. Lingora tập trung giải quyết các vấn đề này bằng lộ trình bài học ngắn, exercise engine, SRS xác định, progress/streak/daily goal, in-app reminder và scenario writing với GEC.

### 1.2 Mục tiêu

- Cung cấp luồng học bài và làm bài có thể đo lường.
- Hỗ trợ ôn từ đúng hạn bằng `record_review` và quyền sở hữu theo `auth.uid()`.
- Trả phản hồi sửa câu tiếng Anh an toàn qua `Browser -> Next.js Route Handler -> FastAPI -> T5-small`.
- Tạo nền tảng báo cáo có traceability từ bằng chứng đến requirement, Use Case và mô hình.

### 1.3 Phạm vi và giới hạn

Phạm vi hiện hành gồm Software Engineering Web và ML/Deep Learning với T5-small GEC. DKT/HLR/DQN và MultiWOZ dialogue generation là lịch sử superseded. UC-06 được bổ sung tiện ích nhập liệu bằng SpeechRecognition và phát âm bằng speechSynthesis ở browser; đây không phải speech model của backend. Không bao gồm chatbot sinh hội thoại mở, speech processing phía server, Web Push, leaderboard, social feed hoặc persistence mới cho writing submission trong MVP.

## 2. Nguồn và phương pháp thu thập yêu cầu

Nguồn chính gồm tài liệu giảng viên `D:/ml/Bai 2 - Phân tích yêu cầu.pdf`, `docs/01`-`docs/07`, `DESIGN.md`, kế hoạch được phê duyệt và `docs/phỏng_vấn.docx`. Phỏng vấn là bán cấu trúc, gồm 6 người và 15 câu hỏi về cách học, quên từ, lịch ôn, tính đều đặn, bài tập, tiến độ, luyện nói, feedback và ứng dụng đang dùng. P1-P4 và P6 học tiếng Anh; P5 học tiếng Nhật.

Các số 6/6, 5/6, 4/6 trong bảng nguồn là tần suất chủ đề của mẫu phỏng vấn nhỏ, không phải tỷ lệ thống kê đại diện. Ý kiến P5 được xem là quan sát bổ sung liên ngôn ngữ; kết luận riêng cho sản phẩm tiếng Anh ưu tiên 5 người học tiếng Anh.

### 2.1 Kết quả phỏng vấn

| Chủ đề | Tần suất nguồn | Mapping | Diễn giải |
|---|---:|---|---|
| Quên từ vựng | 6/6 | UC-02, UC-05 | Nhu cầu ôn lại có lịch |
| Không biết lúc nào ôn | 5/6 | UC-05 | Cần SRS xác định |
| Học không đều | 4/6 | UC-07, UC-08 | Cần mục tiêu và reminder trong app |
| Không biết nên học gì | 4/6 | UC-02, UC-09 | Hỗ trợ placement đề xuất, chưa phải adaptive learning |
| Khó theo dõi tiến bộ | 5/6 | UC-03, UC-07 | Cần điểm và progress rõ ràng |
| Thiếu người luyện nói | 6/6 | UC-06 một phần | Tiện ích nhập giọng nói và nghe câu sửa trong browser; không phải chatbot hội thoại hai chiều |
| Muốn được sửa lỗi | 6/6 | UC-06 | Phù hợp scenario writing + GEC |
| Muốn nội dung cá nhân hóa | 4/6 | UC-09 | Nhu cầu cần policy và validation riêng |

### 2.2 Đánh giá mức phù hợp với Use Case

Phỏng vấn phù hợp trực tiếp với UC-02, UC-03, UC-05, UC-07 và UC-08; phù hợp với UC-06 ở chức năng viết/sửa câu và hỗ trợ tiện ích nói ở phía browser. UC-09 có thể dùng nhu cầu “không biết nên học gì” làm động lực, nhưng vẫn là proposed. UC-10 không có bằng chứng trực tiếp và chỉ giữ như giả thuyết thiết kế được phê duyệt. Không thêm UC hội thoại nói hai chiều vào baseline.

## 3. Stakeholder và actor

| Stakeholder/actor | Mối quan tâm |
|---|---|
| Learner | Học bài, làm bài, ôn từ, feedback, tiến độ và động lực |
| Admin/Teacher | Tạo, chỉnh sửa và xuất bản học liệu, media, scenario |
| GEC/T5-small internal processing | GEC stateless, giới hạn input và timeout; nằm trong boundary, không phải actor |
| Supabase | Auth, Postgres, RLS, RPC và Storage |
| Giảng viên/Reviewer | Format báo cáo, validation, traceability và bằng chứng |

## 4. User Story và Acceptance Criteria

### US-01 - Xác thực và phiên

Là learner hoặc admin, tôi muốn đăng ký, đăng nhập, refresh và đăng xuất để truy cập đúng chức năng. **AC:** credentials hợp lệ tạo phiên; lỗi an toàn; cookie server-side; logout xóa phiên; refresh lỗi đưa về login. Trace: UC-01, P1-FR-001.

### US-02 - Học bài và từ vựng

Là learner, tôi muốn duyệt course/lesson đã xuất bản và học vocabulary theo thứ tự. **AC:** chỉ content published hiển thị; thứ tự ổn định; audio lỗi có trạng thái phục hồi. Trace: UC-02, P1-FR-002.

### US-03 - Bài tập và đánh giá

Là learner, tôi muốn làm MCQ, FILL_BLANK, REORDER và các loại đã duyệt để củng cố bài. **AC:** payload validate; hiển thị đúng/sai; score và completion idempotent. Trace: UC-03, P1-FR-003, 012, 013.

### US-04 - Quản trị nội dung

Là admin, tôi muốn CRUD và publish học liệu/media. **AC:** chỉ ADMIN ghi; learner write bị từ chối; MIME và kích thước được kiểm soát. Trace: UC-04, P1-FR-008, 009.

### US-05 - SRS xác định

Là learner, tôi muốn ôn card đến hạn và ghi kết quả. **AC:** card thuộc user; gọi `record_review`; review log và card cập nhật trong một transaction; chưa gọi là SM-2 trước audit. Trace: UC-05, P1-FR-005, 006.

### US-06 - Scenario writing với GEC và nhập liệu nói tùy chọn

Là learner, tôi muốn trả lời scenario bằng cách gõ hoặc nói, nhận câu sửa và nghe câu mẫu. **AC:** editor text và microphone toggle cùng tồn tại; browser SpeechRecognition điền transcript vào editor; learner sửa transcript trước khi gửi; unsupported API hoặc denied microphone có warning và fallback text-only; request đi qua proxy với `original_text` và `scenario_code`; T5-small chỉ sở hữu `corrected_text`; diff do module xác định; speaker dùng `speechSynthesis`; lỗi input/scenario/auth/model dùng error envelope; audio không đi qua FastAPI và không tạo persistence mới. Trace: UC-06, P1-FR-007, ML-GEC-FR-001..004.

### US-07 - Progress, streak và daily goal

Là learner, tôi muốn xem tiến độ và mục tiêu ngày. **AC:** trạng thái progress ổn định; completion idempotent; streak tăng tối đa một lần/ngày theo timezone. Trace: UC-07, P1-FR-004, 011, 014.

### US-08 - Reminder trong ứng dụng

Là learner, tôi muốn thấy reminder khi chưa học trong ngày. **AC:** chỉ hiển thị khi app mở; không Web Push; dismiss không crash. Trace: UC-08, P1-FR-015.

### US-09 - Placement test (PROPOSED)

Là learner mới, tôi muốn làm test đầu vào để nhận gợi ý CEFR/course. **AC đề xuất:** đề có version; scoring, ngưỡng, tie-breaking và fallback xác định; map theo `Course.cefr`; learner không sửa kết quả. Trace: UC-09, P1-FR-016 proposed.

### US-10 - Private badges (PROPOSED)

Là learner, tôi muốn nhận badge riêng tư cho mốc học tập. **AC đề xuất:** catalog và điều kiện ổn định; cấp idempotent; chỉ chủ tài khoản xem; không leaderboard; lỗi badge không chặn học. Trace: UC-10, P1-FR-017 proposed.

## 5. Đặc tả yêu cầu

### 5.1 Functional requirements

Baseline `P1-FR-001..015` bao phủ auth, learning, exercises, progress, SRS, GEC, admin và reminder. `P1-FR-016` và `P1-FR-017` là requirement proposed cho placement và badges; chưa phải API/schema contract.

### 5.2 Non-functional requirements

Security: RLS theo ownership, admin write qua boundary, FastAPI stateless. Performance: Web timeout GEC 8 giây; benchmark mới được ghi PASS khi có output. Reliability: lesson/SRS vẫn hoạt động khi GEC lỗi. Usability: loading, empty, error, success và responsive; UC-06 fallback text-only khi SpeechRecognition không khả dụng hoặc permission bị từ chối. Privacy: badge private-by-default, không leaderboard; audio không được gửi tới FastAPI hoặc lưu trong Lingora.

### 5.3 Ràng buộc

Giữ 17 Prisma models hiện tại. Không tự thêm persistence writing, speech service phía server, push subscription hoặc entity mới cho UC-09/UC-10 khi chưa có implementation plan và impact review. Web Speech API là tiện ích client-side; khả năng nhận dạng và xử lý audio phụ thuộc browser/provider, không được mô tả là offline/on-device mặc định.

## 6. Danh mục và đặc tả Use Case

| Mã | Use Case | Actor | Trạng thái |
|---|---|---|---|
| UC-01 | Đăng ký, đăng nhập và quản lý phiên | Learner, Admin | Foundation implemented |
| UC-02 | Khám phá và học bài | Learner | Pending M2 |
| UC-03 | Bài tập tương tác và đánh giá | Learner | Pending M2 |
| UC-04 | Quản trị nội dung và xuất bản | Admin | DB/RLS có, UI pending |
| UC-05 | Ôn tập từ vựng bằng SRS xác định | Learner | RPC có, policy audit pending |
| UC-06 | Luyện viết theo tình huống với GEC, nhập text hoặc giọng nói | Learner | Internal GEC processing pending; client speech convenience approved |
| UC-07 | Tiến độ, streak và mục tiêu ngày | Learner | Pending M2 |
| UC-08 | Nhắc nhở học tập trong ứng dụng | Learner | Later M2+ |
| UC-09 | Placement test và gợi ý cấp độ | Learner | Proposed |
| UC-10 | Thành tích và huy hiệu riêng tư | Learner | Proposed |

Luồng chung: actor đáp ứng precondition, khởi tạo trigger, hệ thống xác thực và kiểm tra dữ liệu, thực hiện main flow, ghi trạng thái qua boundary phù hợp, rồi trả kết quả hoặc fallback. UC-09/UC-10 chỉ là target; các policy dữ liệu/API/RLS cần task riêng.

## 7. Mô hình hóa yêu cầu - vị trí chèn hình

Các file PlantUML tương ứng nằm trong `docs/plantuml/`. Người dùng chèn ảnh vào các vị trí sau:

**Hình 1. Sơ đồ Use Case tổng quan**
`[CHÈN ẢNH: docs/plantuml/use-case-overview.puml]`

**Hình 2. Sơ đồ Use Case phía Learner**
`[CHÈN ẢNH: docs/plantuml/use-case-learner.puml]`

**Hình 3. Sơ đồ Use Case phía Admin**
`[CHÈN ẢNH: docs/plantuml/use-case-admin.puml]`

**Hình 4. Activity xác thực và phiên**
`[CHÈN ẢNH: docs/plantuml/activity-auth-session.puml]`

**Hình 5. Activity học bài và làm bài**
`[CHÈN ẢNH: docs/plantuml/activity-lesson-exercise.puml]`

**Hình 6. Activity quản trị nội dung**
`[CHÈN ẢNH: docs/plantuml/activity-admin-content.puml]`

**Hình 7. Activity ôn SRS**
`[CHÈN ẢNH: docs/plantuml/activity-srs-review.puml]`

**Hình 8. Activity scenario writing và GEC**
`[CHÈN ẢNH: docs/plantuml/activity-gec-practice.puml]`

**Hình 9. Activity progress/reminder**
`[CHÈN ẢNH: docs/plantuml/activity-progress-reminder.puml]`

**Hình 10. Activity placement test [PROPOSED]**
`[CHÈN ẢNH: docs/plantuml/activity-placement-test.puml]`

**Hình 11. Activity achievements [PROPOSED]**
`[CHÈN ẢNH: docs/plantuml/activity-achievements.puml]`

**Hình 12. Sequence authentication/proxy**
`[CHÈN ẢNH: docs/plantuml/sequence-auth.puml]`

**Hình 13. Sequence SRS RPC**
`[CHÈN ẢNH: docs/plantuml/sequence-srs.puml]`

**Hình 14. Sequence GEC**
`[CHÈN ẢNH: docs/plantuml/sequence-gec.puml]`

**Hình 15. Sequence placement test [PROPOSED]**
`[CHÈN ẢNH: docs/plantuml/sequence-placement-test.puml]`

**Hình 16. Sequence achievements [PROPOSED]**
`[CHÈN ẢNH: docs/plantuml/sequence-achievements.puml]`

**Hình 17. DFD mức ngữ cảnh**
`[CHÈN ẢNH: docs/plantuml/dfd-context.puml]`

**Hình 18. DFD mức 0**
`[CHÈN ẢNH: docs/plantuml/dfd-level-0.puml]`

**Hình 19. DFD chi tiết Lesson/Exercise**
`[CHÈN ẢNH: docs/plantuml/dfd-lesson-exercise.puml]`

**Hình 20. DFD chi tiết SRS**
`[CHÈN ẢNH: docs/plantuml/dfd-srs.puml]`

**Hình 21. DFD chi tiết GEC**
`[CHÈN ẢNH: docs/plantuml/dfd-gec.puml]`

**Hình 22. ERD baseline và phần đề xuất**
`[CHÈN ẢNH: docs/plantuml/erd-baseline-and-proposed.puml]`

ERD baseline dùng 17 model hiện hành. Entity placement/badge nếu được đề xuất trong hình phải ghi rõ `PROPOSED / NOT IMPLEMENTED`.

## 8. Validation và traceability

Validation kiểm tra tính đúng, đầy đủ, nhất quán, khả thi và kiểm thử được. Traceability đi từ `Interview/Canonical source -> User Story -> UC -> FR/NFR -> component/data/API -> test`. Không ghi số liệu accuracy, latency hoặc tỷ lệ khảo sát nếu chưa có evidence command/output.

## 9. Kết luận (để trống theo yêu cầu)

`[ĐỂ TRỐNG / BỔ SUNG SAU KHI HOÀN THIỆN PHẦN DEMO VÀ KẾT QUẢ KIỂM THỬ]`

## Phụ lục A. Bảng hỏi/phỏng vấn (để trống)

`[CÓ THỂ DÁN TOÀN BỘ BẢNG HỎI VÀO ĐÂY NẾU GIẢNG VIÊN YÊU CẦU; BẢN GỐC LƯU TẠI docs/phỏng_vấn.docx]`

## Tài liệu tham khảo nội bộ

1. `D:/ml/Bai 2 - Phân tích yêu cầu.pdf` - tài liệu hướng dẫn của giảng viên.
2. `docs/01-architecture.md`, `docs/02-requirements.md`, `docs/03-api-contract.md`, `docs/04-data-model.md`, `docs/05-traceability-matrix.md`, `docs/06-system-analysis.md`, `docs/07-data-dictionary.md`.
3. `docs/phỏng_vấn.docx` - biên bản phỏng vấn người học.

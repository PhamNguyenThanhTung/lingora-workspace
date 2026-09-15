> [!WARNING]
> **[HISTORICAL / SUPERSEDED — LEGACY 10-UC CATALOG]**
> Tài liệu này thuộc tập báo cáo học thuật đợt 1 (legacy 10 Use Cases, 2 vai trò Learner/Admin). Toàn bộ danh mục Use Case chuẩn mực của dự án Lingora hiện đã được nâng cấp thành **14 Use Cases Cốt lõi (Core MVP UC-01..UC-14) & 1 Phân hệ Mở rộng Tùy chọn (Optional B2B Module UC-15)** phủ 6 vai trò canonical tại [06-system-analysis.md](../06-system-analysis.md) và [05-traceability-matrix.md](../05-traceability-matrix.md). Giữ tài liệu này chỉ với mục đích tham khảo lịch sử đồ án.

# LINGORA - BÁO CÁO PHÂN TÍCH YÊU CẦU VÀ MÔ HÌNH HÓA

**Môn học:** Phân tích và thiết kế hệ thống / Software Engineering
**Dự án:** Nền tảng Web học tiếng Anh Lingora
**Phiên bản:** 1.1 - 23/08/2026

## Tóm tắt

Lingora là nền tảng Web hỗ trợ học tiếng Anh qua khóa học, bài học, từ vựng, bài tập, ôn tập lặp lại có cấu trúc, theo dõi tiến độ và luyện viết theo tình huống kèm kiểm tra ngữ pháp. Báo cáo này tổng hợp yêu cầu từ tài liệu giảng viên, tài liệu canonical, sáu cuộc phỏng vấn bán cấu trúc và khảo sát định lượng bổ sung N=15. Toàn bộ 10 Use Cases (UC-01 đến UC-10) đều là các chức năng chính thức trong phạm vi hệ thống.

## 1. Giới thiệu

### 1.1 Bối cảnh và vấn đề

Người học thường gặp khó khăn trong việc nhớ từ vựng, xác định thời điểm ôn, duy trì lịch học, biết nên học nội dung nào và đánh giá tiến bộ. Họ cũng mong muốn có môi trường thực hành và phản hồi lỗi. Lingora tập trung giải quyết các vấn đề này bằng lộ trình bài học ngắn, engine bài tập tương tác, thuật toán ôn tập ngắt quãng SRS, theo dõi tiến độ/streak/daily goal, nhắc nhở trong ứng dụng và luyện viết theo tình huống có kiểm tra ngữ pháp.

### 1.2 Mục tiêu

- Cung cấp luồng học bài và làm bài có thể đo lường.
- Hỗ trợ ôn từ đúng hạn bằng `record_review` và quyền sở hữu theo `auth.uid()`.
- Trả phản hồi sửa câu tiếng Anh an toàn qua `Browser -> Next.js Route Handler -> Mô-đun kiểm tra ngữ pháp nội bộ`.
- Tạo nền tảng báo cáo có traceability từ bằng chứng đến requirement, Use Case và mô hình.

### 1.3 Phạm vi và giới hạn

Phạm vi hiện hành tập trung vào Kỹ nghệ Phần mềm Web cho nền tảng Lingora. UC-06 được bổ sung tiện ích nhập liệu bằng SpeechRecognition và phát âm bằng speechSynthesis ở browser. Không bao gồm Web Push, leaderboard hoặc mạng xã hội trong MVP.

## 2. Nguồn và phương pháp thu thập yêu cầu

Nguồn chính gồm tài liệu giảng viên `Tài liệu Bài giảng: Bài 2 - Phân tích yêu cầu.pdf`, `docs/01`-`docs/07`, `DESIGN.md`, kế hoạch được phê duyệt, biên bản phỏng vấn và file khảo sát định lượng. Phỏng vấn là bán cấu trúc, gồm 6 người; khảo sát định lượng bổ sung có 15 câu trả lời trên 24 câu hỏi.

### 2.1 Kết quả phỏng vấn

| Chủ đề | Tần suất nguồn | Mapping | Diễn giải |
|---|---:|---|---|
| Quên từ vựng | 6/6 | UC-02, UC-05 | Nhu cầu ôn lại có lịch |
| Không biết lúc nào ôn | 5/6 | UC-05 | Cần thuật toán SRS |
| Học không đều | 4/6 | UC-07, UC-08 | Cần mục tiêu và reminder trong app |
| Không biết nên học gì | 4/6 | UC-02, UC-09 | Hỗ trợ placement test định vị trình độ |
| Khó theo dõi tiến bộ | 5/6 | UC-03, UC-07 | Cần điểm và progress rõ ràng |
| Thiếu người luyện nói | 6/6 | UC-06 | Tiện ích nhập giọng nói và nghe câu sửa trong browser |
| Muốn được sửa lỗi | 6/6 | UC-06 | Phù hợp luyện viết tình huống + kiểm tra ngữ pháp |
| Muốn nội dung cá nhân hóa | 4/6 | UC-09 | Đánh giá trình độ ban đầu |

### 2.2 Khảo sát định lượng bổ sung (N=15)

Khảo sát bổ sung ghi nhận **15 phản hồi** trên 24 câu hỏi: **100,0% (15/15)** từng quên từ đã học; **86,7% (13/15)** từng học không đều hoặc bỏ học; **80,0% (12/15)** đánh giá tự động xác định từ và thời điểm ôn ở mức 4-5/5; **93,3% (14/15)** muốn hệ thống tự đề xuất nội dung học/ôn; **66,7% (10/15)** yêu cầu sửa lỗi ngữ pháp; **73,3%** ưu tiên bài tập điền từ; **80,0%** học phục vụ công việc.

## 3. Stakeholder và actor

| Stakeholder/actor | Mối quan tâm |
|---|---|
| Learner | Học bài, làm bài, ôn từ, feedback, tiến độ và động lực |
| Admin / Teacher | Tạo, chỉnh sửa và xuất bản học liệu, media, scenario |
| Mô-đun kiểm tra ngữ pháp nội bộ | Thành phần xử lý ngữ pháp nội bộ, giới hạn input và timeout; nằm trong boundary, không phải actor |
| Supabase | Auth, Postgres, RLS, RPC và Storage |
| Giảng viên / Reviewer | Format báo cáo, validation, traceability và bằng chứng |

## 4. User Story và Acceptance Criteria

### US-01 - Xác thực và phiên
Là learner hoặc admin, tôi muốn đăng ký, đăng nhập, refresh và đăng xuất để truy cập đúng chức năng. **AC:** credentials hợp lệ tạo phiên; lỗi an toàn; cookie server-side; logout xóa phiên. Trace: UC-01
Là learner, tôi muốn làm MCQ, FILL_BLANK, REORDER và các loại đã duyệt để củng cố bài. **AC:** payload validate; hiển thị đúng/sai; score và completion idempotent. Trace: UC-03
Là learner, tôi muốn ôn card đến hạn và ghi kết quả. **AC:** card thuộc user; gọi `record_review`; review log và card cập nhật trong một transaction theo thuật toán SM-2. Trace: UC-05
Là learner, tôi muốn xem tiến độ và mục tiêu ngày. **AC:** trạng thái progress ổn định; completion idempotent; streak tăng tối đa một lần/ngày theo timezone. Trace: UC-07
Là learner mới, tôi muốn làm test đầu vào để nhận gợi ý CEFR/course. **AC:** bộ câu hỏi có version; scoring và phân loại cấp độ tự động; kết quả lưu vào hồ sơ. Trace: UC-09

### 5.1 Functional requirements
Baseline `P1-FR-001..017` bao phủ auth, learning, exercises, progress, SRS, writing & grammar check, admin, reminder, placement và private badges. Tất cả đều là yêu cầu active/in-scope.

### 5.2 Non-functional requirements
Security: RLS theo ownership, admin write qua boundary. Performance: Web timeout 8 giây. Reliability: lesson/SRS vẫn hoạt động khi mô-đun kiểm tra ngữ pháp gặp sự cố. Usability: loading, empty, error, success và responsive. Privacy: badge private-by-default, không leaderboard.

## 6. Danh mục và đặc tả Use Case

| Mã | Use Case | Actor | Trạng thái |
|---|---|---|---|
| UC-01 | Đăng ký, đăng nhập và quản lý phiên | Learner, Admin | In Scope / Active |
| UC-02 | Khám phá và học bài | Learner | In Scope / Active |
| UC-03 | Bài tập tương tác và đánh giá | Learner | In Scope / Active |
| UC-04 | Quản trị nội dung và xuất bản | Admin | In Scope / Active |
| UC-05 | Ôn tập từ vựng bằng SRS xác định | Learner | In Scope / Active |
| UC-06 | Luyện viết tình huống và kiểm tra ngữ pháp | Learner | In Scope / Active |
| UC-07 | Tiến độ, streak và mục tiêu ngày | Learner | In Scope / Active |
| UC-08 | Nhắc nhở học tập trong ứng dụng | Learner | In Scope / Active |
| UC-09 | Placement test và gợi ý cấp độ | Learner | In Scope / Active |
| UC-10 | Thành tích và huy hiệu riêng tư | Learner | In Scope / Active |

## 7. Mô hình hóa yêu cầu - vị trí chèn hình (32 sơ đồ PlantUML)

Các file PlantUML tương ứng nằm trong `docs/plantuml/`:

**Hình 1. Sơ đồ Use Case tổng quan**
`[CHÈN ẢNH: docs/plantuml/use-case-overview.puml]`

### Use Case chi tiết UC-01 đến UC-10

`[CHÈN ẢNH: docs/plantuml/use-case-uc01.puml]`
`[CHÈN ẢNH: docs/plantuml/use-case-uc02.puml]`
`[CHÈN ẢNH: docs/plantuml/use-case-uc03.puml]`
`[CHÈN ẢNH: docs/plantuml/use-case-uc04.puml]`
`[CHÈN ẢNH: docs/plantuml/use-case-uc05.puml]`
`[CHÈN ẢNH: docs/plantuml/use-case-uc06.puml]`
`[CHÈN ẢNH: docs/plantuml/use-case-uc07.puml]`
`[CHÈN ẢNH: docs/plantuml/use-case-uc08.puml]`
`[CHÈN ẢNH: docs/plantuml/use-case-uc09.puml]`
`[CHÈN ẢNH: docs/plantuml/use-case-uc10.puml]`

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

**Hình 8. Activity luyện viết tình huống và kiểm tra ngữ pháp**
`[CHÈN ẢNH: docs/plantuml/activity-writing-grammar.puml]`

**Hình 9. Activity progress/reminder**
`[CHÈN ẢNH: docs/plantuml/activity-progress-reminder.puml]`

**Hình 10. Activity placement test**
`[CHÈN ẢNH: docs/plantuml/activity-placement-test.puml]`

**Hình 11. Activity achievements**
`[CHÈN ẢNH: docs/plantuml/activity-achievements.puml]`

**Hình 12. Sequence authentication/proxy**
`[CHÈN ẢNH: docs/plantuml/sequence-auth.puml]`

**Hình 13. Sequence SRS RPC**
`[CHÈN ẢNH: docs/plantuml/sequence-srs.puml]`

**Hình 14. Sequence luyện viết và kiểm tra ngữ pháp**
`[CHÈN ẢNH: docs/plantuml/sequence-writing-grammar.puml]`

**Hình 15. Sequence placement test**
`[CHÈN ẢNH: docs/plantuml/sequence-placement-test.puml]`

**Hình 16. Sequence achievements**
`[CHÈN ẢNH: docs/plantuml/sequence-achievements.puml]`

**Hình 17. DFD mức ngữ cảnh**
`[CHÈN ẢNH: docs/plantuml/dfd-context.puml]`

**Hình 18. DFD mức 0**
`[CHÈN ẢNH: docs/plantuml/dfd-level-0.puml]`

**Hình 19. DFD chi tiết Lesson/Exercise**
`[CHÈN ẢNH: docs/plantuml/dfd-lesson-exercise.puml]`

**Hình 20. DFD chi tiết SRS**
`[CHÈN ẢNH: docs/plantuml/dfd-srs.puml]`

**Hình 21. DFD chi tiết Luyện viết và kiểm tra ngữ pháp**
`[CHÈN ẢNH: docs/plantuml/dfd-writing-grammar.puml]`

**Hình 22. Sơ đồ thực thể liên kết ERD**
`[CHÈN ẢNH: docs/plantuml/erd-baseline-and-proposed.puml]`

## 8. Validation và traceability

Validation kiểm tra tính đúng, đầy đủ, nhất quán, khả thi và kiểm thử được theo chuẩn IEEE 830. Traceability đi từ `Khảo sát / Phỏng vấn -> User Story -> UC -> FR/NFR -> Component/Data/API -> Test`.

## 9. Kết luận

## Phụ lục A. Bảng hỏi/phỏng vấn (để trống)

`[CÓ THỂ DÁN TOÀN BỘ BẢNG HỎI VÀO ĐÂY NẾU GIẢNG VIÊN YÊU CẦU]`

## Tài liệu tham khảo nội bộ

1. `Tài liệu Bài giảng: Bài 2 - Phân tích yêu cầu.pdf` - tài liệu hướng dẫn của giảng viên.
2. `docs/01-architecture.md`, `docs/02-requirements.md`, `docs/03-api-contract.md`, `docs/04-data-model.md`, `docs/05-traceability-matrix.md`, `docs/06-system-analysis.md`, `docs/07-data-dictionary.md`.

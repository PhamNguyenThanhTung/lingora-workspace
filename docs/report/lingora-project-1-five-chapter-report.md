# TRƯỜNG ĐẠI HỌC [BỔ SUNG TÊN TRƯỜNG]
## KHOA [BỔ SUNG TÊN KHOA]

# BÁO CÁO PROJECT 1
## XÂY DỰNG NỀN TẢNG HỌC TIẾNG ANH LINGORA

**Giảng viên hướng dẫn:** [Bổ sung]
**Nhóm sinh viên:** Phạm Nguyễn Thanh Tùng, [Thành viên 2], [Thành viên 3]
**Năm:** 2026

---

## LỜI MỞ ĐẦU

Lingora là nền tảng Web hỗ trợ người học tiếng Anh học theo bài, luyện tập, ôn từ vựng và theo dõi tiến độ. Báo cáo trình bày quy trình phát triển, phân tích bài toán, thiết kế hệ thống, kết quả xây dựng và kế hoạch kiểm thử/triển khai. Các nội dung được đối chiếu với tài liệu yêu cầu, kiến trúc, API, dữ liệu, biên bản phỏng vấn và khảo sát định lượng N=15 của dự án.

## LỜI CẢM ƠN

[Bổ sung lời cảm ơn theo yêu cầu của nhóm/giảng viên.]

## PHÂN CÔNG CÔNG VIỆC

| Thành viên | Phạm vi phụ trách |
|---|---|
| Phạm Nguyễn Thanh Tùng | Kiến trúc Web, tích hợp mô-đun kiểm tra văn bản tiện ích kiểm tra văn bản, quản lý báo cáo và traceability |
| Thành viên 2 | Phỏng vấn người dùng, dữ liệu/Prisma, nội dung bài học và exercise |
| Thành viên 3 | Use Case, giao diện người học, SRS và kiểm thử trải nghiệm |
| Cả nhóm | Review chéo, kiểm thử, hoàn thiện báo cáo và thuyết trình |

## MỤC LỤC

1. Chương 1 - Các mô hình quy trình phát triển phần mềm
2. Chương 2 - Tổng quan bài toán và công nghệ, công cụ
3. Chương 3 - Phân tích và thiết kế hệ thống
4. Chương 4 - Xây dựng ứng dụng
5. Chương 5 - Kiểm thử và triển khai sản phẩm
6. Kết luận và hướng phát triển
7. Tài liệu tham khảo
8. Phụ lục A - Biên bản phỏng vấn

## DANH MỤC HÌNH VẼ

Hình 1. Use Case tổng quan; Hình 2. Use Case Learner; Hình 3. Use Case Admin; Hình 4. Activity học và làm bài; Hình 5. Activity SRS; Hình 6. Activity tiện ích kiểm tra văn bản; Hình 7. Sequence Auth; Hình 8. Sequence SRS; Hình 9. Sequence tiện ích kiểm tra văn bản; Hình 10. DFD ngữ cảnh; Hình 11. ERD baseline và phần đề xuất.

## DANH MỤC BẢNG BIỂU

Bảng 1. So sánh mô hình SDLC; Bảng 2. Stakeholder; Bảng 3. Kết quả phỏng vấn; Bảng 4. Use Case; Bảng 5. Requirement; Bảng 6. Ma trận truy vết; Bảng 7. Ma trận kiểm thử.

# CHƯƠNG 1. CÁC MÔ HÌNH QUY TRÌNH PHÁT TRIỂN PHẦN MỀM

## 1.1. Tổng quan SDLC

SDLC mô tả các hoạt động từ xác định vấn đề, thu thập yêu cầu, phân tích, thiết kế, xây dựng, kiểm thử, triển khai đến bảo trì. Với sản phẩm học ngoại ngữ có phần Web và xử lý văn bản, yêu cầu cần được kiểm chứng lặp lại giữa trải nghiệm người dùng, hợp đồng API và khả năng mô hình.

## 1.2. Các mô hình phổ biến

### 1.2.1. Waterfall

Waterfall tuần tự, dễ quản lý tài liệu nhưng phản hồi muộn và khó thích nghi khi yêu cầu phần mềm/UI thay đổi.

### 1.2.2. Agile/Scrum

Agile chia sản phẩm thành các increment và sprint ngắn. Nhóm có thể làm mock trước, kiểm thử liên tục và thay đổi ưu tiên theo evidence.

### 1.2.3. Spiral

Spiral lặp theo đánh giá rủi ro, phù hợp dự án có rủi ro kỹ thuật cao nhưng chi phí quản lý lớn.

### 1.2.4. V-Model

V-Model liên kết từng pha phát triển với pha kiểm thử tương ứng, phù hợp hệ thống cần kiểm soát chặt nhưng kém linh hoạt với UI/phần mềm.

### 1.2.5. Prototype

Prototype giúp xác minh nhanh luồng học, bài tập và phản hồi trước khi khóa thiết kế. Prototype không thay thế sản phẩm kiểm thử được.

## 1.3. Đánh giá và lựa chọn

| Mô hình | Ưu điểm | Hạn chế | Mức phù hợp |
|---|---|---|---|
| Waterfall | Tài liệu và mốc rõ | Khó đổi yêu cầu | Trung bình |
| Agile/Scrum | Lặp nhanh, phản hồi sớm | Cần kỷ luật backlog | Cao |
| Spiral | Kiểm soát rủi ro | Phức tạp | Trung bình |
| V-Model | Kiểm thử có cấu trúc | Ít linh hoạt | Trung bình |
| Prototype | Xác minh UX sớm | Dễ nhầm prototype là sản phẩm | Cao ở giai đoạn đầu |

Lingora chọn Agile/Scrum, kết hợp prototype và kiểm thử theo từng increment. Cách chọn này phù hợp nhóm nhỏ, sản phẩm Web có hai track và cần thay đổi dựa trên phỏng vấn, test contract và model evaluation.

# CHƯƠNG 2. TỔNG QUAN BÀI TOÁN VÀ CÔNG NGHỆ, CÔNG CỤ

## 2.1. Giới thiệu bài toán

Người học thường quên từ, không biết thời điểm ôn, học không đều, khó xác định nội dung tiếp theo, khó theo dõi tiến bộ và thiếu môi trường luyện tập. Lingora giải quyết bằng bài học ngắn, bài tập, SRS xác định, tiến độ/streak/daily goal, trong ứng dụng reminder và luyện viết theo tình huống với tiện ích kiểm tra văn bản.

## 2.2. Hiện trạng và benchmark

Duolingo, Memrise, Anki, Busuu, Airlearn, Cambridge Write & Improve, ELSA Speak và Speak được dùng như nguồn tham khảo thiết kế. Benchmark không thay thế bằng chứng phỏng vấn và không được dùng để khẳng định thị phần hoặc hiệu quả nếu chưa có nguồn học thuật.

| Sản phẩm | Bài học tham khảo |
|---|---|
| Duolingo | Micro-learning, streak, bài tập ngắn |
| Anki | Flashcard và lịch ôn do người dùng kiểm soát |
| Memrise | Nội dung từ vựng và video ngữ cảnh |
| Busuu | Course structure và CEFR |
| Cambridge Write & Improve | Phản hồi writing |

## 2.3. Phân tích yêu cầu người dùng

Phỏng vấn bán cấu trúc gồm 6 người, 15 câu hỏi/người. P1-P4 và P6 học tiếng Anh; P5 học tiếng Nhật. Các số dưới đây là tần suất chủ đề trong mẫu, không phải tỷ lệ đại diện.

| Chủ đề | Tần suất | Đối chiếu |
|---|---:|---|
| Quên từ vựng | 6/6 | UC-02, UC-05 |
| Không biết lúc nào ôn | 5/6 | UC-05 |
| Học không đều | 4/6 | UC-07, UC-08 |
| Không biết nên học gì | 4/6 | UC-02, UC-09 |
| Thiếu người luyện nói | 6/6 | Gap tương lai của UC-06 |
| Muốn được sửa lỗi | 6/6 | UC-06 luyện viết theo tình huống/tiện ích kiểm tra văn bản |

### 2.3.1. Khảo sát định lượng bổ sung (N=15)

File khảo sát bổ sung có **15 phản hồi**. Các kết quả nổi bật: **100,0% (15/15)** từng quên từ đã học; **86,7% (13/15)** từng học không đều hoặc bỏ học; **80,0% (12/15)** đánh giá tự động xác định từ và thời điểm ôn ở mức 4-5/5; **93,3% (14/15)** muốn hoặc có thể thử hệ thống tự đề xuất nội dung học/ôn; **66,7% (10/15)** đánh giá bài tập sau bài học ở mức 4-5/5. Với câu hỏi nhiều lựa chọn, tỷ lệ tính trên từng phương án và cùng mẫu 15 người nên tổng có thể vượt 100%. Khảo sát được giữ riêng với 6 cuộc phỏng vấn định tính, dùng để củng cố ưu tiên yêu cầu chứ không suy rộng cho toàn bộ người học.

### 2.3.2. Phạm vi Use Case

UC-01 đến UC-10 là baseline phạm vi chính thức. UC-09 Placement Test và UC-10 Private Badges đang chờ implementation evidence. Không thêm chức năng hội thoại hai chiều vào baseline.

### 2.3.3. Yêu cầu chức năng

`P1-FR-001..017` là baseline về auth, lesson, exercise, progress, SRS, tiện ích kiểm tra văn bản, admin, reminder, placement và badges. P1-FR-016/017 là active/in-scope requirements với implementation evidence pending.

### 2.3.4. Yêu cầu phi chức năng

Bảo mật: RLS theo ownership, cookie httpOnly và phần mềm qua Route Handler. Hiệu năng: Web timeout tiện ích kiểm tra văn bản 8 giây; p95 warm CPU <= 2.000 ms là mục tiêu cần benchmark. Độ tin cậy: lesson/SRS không phụ thuộc tiện ích kiểm tra văn bản. Tính riêng tư: badge private-by-default, không leaderboard.

## 2.4. Công nghệ và công cụ

| Thành phần | Công nghệ |
|---|---|
| Learner Web | Next.js 15 App Router, TypeScript, Tailwind/shadcn |
| Auth và dữ liệu | Supabase Auth, PostgreSQL, RLS, Storage |
| ORM/Admin | Prisma 6, Next.js Admin |
| phần mềm/tiện ích kiểm tra văn bản | FastAPI, PyTorch, Transformers, mô-đun kiểm tra văn bản |
| Mô hình hóa | PlantUML, Draw.io |
| Quản lý mã | Git/GitHub |

# CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

## 3.1. User Story và Acceptance Criteria

US-01 xác thực; US-02 học bài/từ vựng; US-03 bài tập; US-04 admin content; US-05 SRS; US-06 luyện viết theo tình huống tiện ích kiểm tra văn bản; US-07 progress/streak/goal; US-08 reminder; US-09 placement; US-10 badges. Mỗi story được truy nguyên tới UC và P1-FR trong báo cáo yêu cầu nguồn.

## 3.2. Phân tích hướng cấu trúc

### 3.2.1. Biểu đồ phân rã chức năng

Lingora được phân rã thành bảy nhóm: xác thực; học course/lesson; exercise; vocabulary/SRS; progress/reminder; luyện viết theo tình huống/tiện ích kiểm tra văn bản; admin content.
**[CHÈN HÌNH BFD - bổ sung sau]**

### 3.2.2. DFD mức ngữ cảnh

Learner gửi credentials, answer, review result và writing input; nhận lesson, score, schedule, progress và corrected text. Admin gửi content/media và nhận trạng thái publish. tiện ích kiểm tra văn bản/mô-đun kiểm tra văn bản là xử lý nội bộ; Supabase cung cấp Auth/Postgres/RLS/Storage.
**Hình 10. DFD mức ngữ cảnh - [CHÈN ẢNH từ `dfd-context.puml`]**

### 3.2.3. DFD mức 1

Các luồng chính gồm Auth/session, học bài/exercise, SRS qua `record_review`, và tiện ích kiểm tra văn bản.
**Hình 11. DFD mức 0 - [CHÈN ẢNH từ `dfd-level-0.puml`]**
**Hình 12. DFD Lesson/Exercise - [CHÈN ẢNH từ `dfd-lesson-exercise.puml`]**
**Hình 13. DFD SRS - [CHÈN ẢNH từ `dfd-srs.puml`]**
**Hình 14. DFD tiện ích kiểm tra văn bản - [CHÈN ẢNH từ `dfd-tiện ích phần mềm.puml`]**

### 3.2.4. ERD

Baseline hiện có 15 mô hình dữ liệu hoạt động. Placement/badges là capability in-scope; persistence design chưa được cộng vào physical baseline cho đến khi có task schema được phê duyệt.
**Hình 15. ERD baseline và phần mở rộng in-scope - [CHÈN ẢNH từ `erd-baseline-and-proposed.puml`]**

## 3.3. Phân tích hướng đối tượng

### 3.3.1. Use Case

**Hình 1. Use Case tổng quan - [CHÈN ẢNH từ `use-case-overview.puml`]**
**Hình 2. Use Case Learner - [CHÈN ẢNH từ `use-case-learner.puml`]**
**Hình 3. Use Case Admin - [CHÈN ẢNH từ `use-case-admin.puml`]**

### 3.3.2. Activity

**Hình 4. Activity học và làm bài - [CHÈN ẢNH từ `activity-lesson-exercise.puml`]**
**Hình 5. Activity SRS - [CHÈN ẢNH từ `activity-srs-review.puml`]**
**Hình 6. Activity tiện ích kiểm tra văn bản - [CHÈN ẢNH từ `activity-tiện ích phần mềm-practice.puml`]**

### 3.3.3. Sequence

**Hình 7. Sequence Auth - [CHÈN ẢNH từ `sequence-auth.puml`]**
**Hình 8. Sequence SRS `record_review` - [CHÈN ẢNH từ `sequence-srs.puml`]**
**Hình 9. Sequence tiện ích kiểm tra văn bản `Browser -> Next.js -> FastAPI -> mô-đun kiểm tra văn bản` - [CHÈN ẢNH từ `sequence-tiện ích phần mềm.puml`]**

### 3.3.4. Class Diagram

**[CHÈN HÌNH CLASS DIAGRAM ánh xạ các thực thể nghiệp vụ - bổ sung sau]**

# CHƯƠNG 4. XÂY DỰNG ỨNG DỤNG

## 4.1. Kiến trúc hệ thống

Learner Web dùng Next.js App Router. Auth/session được xử lý server-side với Supabase. Dữ liệu core đi qua Supabase/PostgREST/RPC. phần mềm call không đi trực tiếp từ browser đến FastAPI mà qua Next.js Route Handler; FastAPI stateless và mô-đun kiểm tra văn bản sở hữu `corrected_text`.

## 4.2. Triển khai xây dựng

Nhóm áp dụng mock-first, giữ API contract và kiểm thử theo milestone. Track Software Engineering xây nền tảng Web, DB/RLS, Auth và các luồng học. Track tiện ích phần mềm xây tiện ích kiểm tra văn bản mô-đun kiểm tra văn bản độc lập để không làm lesson/SRS phụ thuộc model.

## 4.3. Kết quả và giao diện

Các khu vực cần mô tả/chèn ảnh gồm: màn hình Auth; course/lesson; exercise MCQ/FILL_BLANK/REORDER; flashcard SRS; luyện viết theo tình huống và diff correction; Admin CMS. Ảnh giao diện hiện để placeholder vì chưa có ảnh chụp được cung cấp.

| Khu vực | Trạng thái tài liệu |
|---|---|
| Auth/session | Foundation implemented |
| Course/lesson/exercise | Pending M2 |
| Admin CMS | DB/RLS có, UI pending |
| SRS | RPC có, policy audit pending |
| Scenario tiện ích kiểm tra văn bản | Contract approved, implementation pending |
| Placement/badges | Proposed |

# CHƯƠNG 5. KIỂM THỬ VÀ TRIỂN KHphần mềm SẢN PHẨM

## 5.1. Kiểm thử hệ thống

### 5.1.1. Test plan

Kiểm thử gồm unit test, integration/contract test, RLS isolation, proxy error handling, responsive/accessibility và static documentation audit. Không ghi PASS cho benchmark hoặc model metric nếu chưa có output.

### 5.1.2. Evidence hiện có

Các milestone trước đã có evidence Auth/RLS/Storage, deterministic seed, FastAPI mock, JWT verifier, Web foundation, Playwright và PlantUML. tiện ích kiểm tra văn bản thật, M2 lesson flow, placement scoring và badge catalog vẫn pending implementation evidence.

### 5.1.3. Ma trận truy vết rút gọn

| Requirement | Use Case | Thành phần | Kiểm thử |
|---|---|---|---|
| P1-FR-001 | UC-01 | Supabase Auth/Next.js | Auth tests |
| P1-FR-002/003 | UC-02/03 | Lesson/exercise engine | M2 tests |
| P1-FR-005/006 | UC-05 | `record_review`/RLS | SRS/RLS tests |
| P1-FR-007 | UC-06 | Proxy/FastAPI/mô-đun kiểm tra văn bản | tiện ích kiểm tra văn bản contract tests |
| P1-FR-016 | UC-09 | Active placement policy | Implementation plan |
| P1-FR-017 | UC-10 | Active badge catalog | Implementation plan |

## 5.2. Triển khai sản phẩm

Môi trường mục tiêu gồm Vercel cho Web/Admin, Supabase Cloud cho Auth/PostgreSQL/Storage và Render hoặc HF Spaces cho FastAPI. CI/CD, biến môi trường, health checks và rollback phải được khóa trong kế hoạch triển khai riêng. Bản báo cáo này không khẳng định production deployment khi chưa có log triển khai tương ứng.

# KẾT LUẬN

# TÀI LIỆU THAM KHẢO

1. Tài liệu hướng dẫn môn học, phần Phân tích yêu cầu hệ thống.
2. Tài liệu kiến trúc và yêu cầu dự án Lingora.
3. Tài liệu hợp đồng API, mô hình dữ liệu và ma trận truy vết Lingora.
4. Biên bản phỏng vấn người học, Phụ lục A.
5. PlantUML/Draw.io diagrams của dự án Lingora.

# PHỤ LỤC A. BIÊN BẢN PHỎNG VẤN NGƯỜI DÙNG

Biên bản gốc gồm 6 người tham gia và 15 câu hỏi/người. Khi nộp báo cáo, chèn toàn bộ câu hỏi và câu trả lời đã ẩn danh từ tài liệu phỏng vấn của nhóm vào phần này. Người tham gia P5 học tiếng Nhật; phần này phải ghi rõ để tránh diễn giải sai phạm vi tiếng Anh.

**[CHÈN TOÀN BỘ BIÊN BẢN PHỎNG VẤN ĐÃ ẨN DANH TẠI ĐÂY]**

# Lingora Requirements Evidence Register

## 1. Mục đích

Sổ đăng ký này ghi nguồn dùng để xây dựng báo cáo phân tích yêu cầu. Mỗi kết luận trong báo cáo phải thuộc một trong ba trạng thái:

- `OBSERVED`: có bằng chứng trực tiếp từ tài liệu, schema, migration, test hoặc mã nguồn.
- `APPROVED`: đã được con người phê duyệt trong plan/ADR nhưng có thể chưa triển khai.
- `EVIDENCE-PENDING`: chưa có dữ liệu gốc; không được trình bày như kết quả thực nghiệm.

## 2. Tài liệu quy định và mẫu biểu

| ID | Nguồn | Loại | Nội dung sử dụng | Trạng thái |
|---|---|---|---|---|
| SRC-REQ-001 | `D:/ml/Bai 2 - Phân tích yêu cầu.pdf` | Tài liệu giảng viên, 22 trang | Quy trình elicitation, User Story, Acceptance Criteria, FR/NFR, Use Case, Activity, DFD, ERD, validation và traceability | `OBSERVED` |
| SRC-REQ-002 | `docs/02-requirements.md` | SRS canonical | P1-FR-001..015, P1-NFR-001..004, ML-GEC requirements | `OBSERVED` |
| SRC-REQ-003 | `docs/05-traceability-matrix.md` | Traceability canonical | Mapping requirement - Use Case - component - data - API - test - report | `OBSERVED` |
| SRC-REQ-004 | `docs/06-system-analysis.md` | System analysis canonical | Stakeholder, actor, system boundary và UC-01..UC-08 | `OBSERVED` |
| SRC-REQ-005 | `docs/01-architecture.md` | Architecture canonical | Next.js, Supabase, FastAPI, security boundary | `OBSERVED` |
| SRC-REQ-006 | `docs/03-api-contract.md` | API contract canonical | GEC target, compatibility endpoints và error envelope | `OBSERVED` |
| SRC-REQ-007 | `docs/04-data-model.md` và `docs/07-data-dictionary.md` | Data canonical | 17 Prisma models, RLS, RPC và storage | `OBSERVED` |
| SRC-REQ-008 | `plans/current-task.md` | Approved plan | Bổ sung UC-09 Placement Test và UC-10 Achievements/Badges | `APPROVED` |
| SRC-REQ-009 | `DESIGN.md` | UI/UX source | Chỉ dùng khi thiết kế/đánh giá màn hình; không thay thế functional requirements | `OBSERVED` |
| SRC-REQ-010 | `docs/phỏng_vấn.docx` | Biên bản phỏng vấn bán cấu trúc | Sáu người tham gia; pain points về từ vựng, lịch ôn, thói quen, tiến độ, luyện nói và correction | `OBSERVED` |
| SRC-REQ-011 | User approval, 2026-08-22 | Scope clarification for UC-06 | Client-side speech input/playback is a UI convenience; FastAPI/T5-small remains text-in/text-out; canonical request keeps `original_text` and `scenario_code`; approved report/PlantUML/DOCX allowlist | `APPROVED` |
| SRC-REQ-012 | [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) | Browser capability and limitation reference | `SpeechRecognition`/`webkitSpeechRecognition` feature detection, `SpeechSynthesis` playback, browser/provider support and permission/fallback considerations | `OBSERVED` |
| SRC-REQ-013 | `pasted-text.txt`, user attachment 2026-08-23 | Academic refinement source | Suggested elicitation/findings/benchmark/FR-NFR/validation organization; unsupported metrics are not treated as evidence | `INFERRED / EVIDENCE-PENDING` |
| SRC-REQ-014 | User decision, 2026-08-23 | ERD reporting resolution | Physical baseline reported as 17; 15 active-flow models; `ChatSession`/`ChatMessage` legacy/deprecated pending formal migration cleanup; UC-09/UC-10 entities excluded | `APPROVED` |
| SRC-REQ-015 | `D:/TimHieuPaper_Nhom16.pptx` | Presentation visual reference | University logo, purple/yellow header and gray footer background used for the teacher-facing deck | `OBSERVED` |
| SRC-REQ-016 | User attachment `4826819f-27da-4af2-a3d3-571d6faf7d62/pasted-text.txt`, 2026-08-23 | Three supplementary interview records | Named 30-minute records for a high-school learner, university learner and working learner; used as qualitative supporting evidence on slides 7-8 | `OBSERVED / SUPPLEMENTARY` |
| SRC-REQ-017 | User approval, 2026-08-23 | Actor/boundary and UC numbering decision | Learner/Admin are the only external actors; GEC/T5-small is internal processing; achievements use UC-10; complete PlantUML and synchronize current Markdown reports | `APPROVED` |

## 3. Kết quả phân tích tài liệu giảng viên

PDF `SRC-REQ-001` yêu cầu nhóm thực hiện tối thiểu:

1. Xác định các bên liên quan.
2. Lập câu hỏi phỏng vấn hoặc bảng hỏi.
3. Thu thập quy định và mẫu biểu liên quan.
4. Viết User Story và Acceptance Criteria.
5. Đặc tả yêu cầu chức năng và phi chức năng.
6. Mô hình hóa bằng Use Case, Activity, DFD và ERD.
7. Xác minh tính đúng, đầy đủ, nhất quán, khả thi và có thể kiểm thử.
8. Duy trì baseline, version control và traceability.

## 4. Dữ liệu nghiên cứu người dùng

| Hạng mục | Bằng chứng hiện có | Cách sử dụng trong báo cáo |
|---|---|---|
| File kết quả khảo sát | Chưa tìm thấy CSV/XLSX/Google Forms export | `EVIDENCE-PENDING`; không ghi tỷ lệ phần trăm |
| Biên bản phỏng vấn | `docs/phỏng_vấn.docx`, 6 người tham gia, 15 câu hỏi/người | `OBSERVED`; dùng làm bằng chứng định tính và phải nêu giới hạn mẫu |
| Ảnh thống kê khảo sát | Chưa tìm thấy | Không tạo biểu đồ giả |
| Số lượng người tham gia | Có bảng tổng hợp ghi 6 người | Ghi là mẫu phỏng vấn định tính; người 5 học tiếng Nhật nên không gộp vào kết luận tiếng Anh |
| Pain points người học | Câu trả lời chi tiết của P1-P6 và bảng tổng hợp trong DOCX | `OBSERVED`; không suy rộng ra toàn bộ người học |
| Ba phiếu bổ sung | Nguyễn Hải Dương, Trần Văn Đài, Cao Thị Ngân trong `SRC-REQ-016` | Dùng vai trò ẩn danh trên slide; chưa gộp vào tần suất `6/6`, `5/6`, `4/6` nếu chưa mã hóa lại toàn bộ 9 phiếu |

### 4.1 Kết quả phỏng vấn và cách diễn giải

File `docs/phỏng_vấn.docx` ghi nhận 6 cuộc phỏng vấn bán cấu trúc. P1-P4 và P6 học tiếng Anh; P5 học tiếng Nhật. Vì vậy, các chủ đề chung về SRS, bài tập, tiến độ và môi trường luyện nói được dùng như insight thiết kế; khi nói riêng về sản phẩm học tiếng Anh, cần ưu tiên 5 người học tiếng Anh. Các dòng `6/6`, `5/6`... là số người đề cập trong mẫu, không phải tỷ lệ đại diện.

| Chủ đề quan sát | Tần suất ghi trong nguồn | Đối chiếu Use Case | Cách dùng đúng |
|---|---:|---|---|
| Quên từ vựng | 6/6 | UC-02, UC-05 | Bằng chứng cho nhu cầu ôn lại có cấu trúc |
| Không biết lúc nào nên ôn | 5/6 | UC-05 | Hỗ trợ SRS; chưa khẳng định policy đã là SM-2 |
| Học không đều/quên lịch | 4/6 | UC-07, UC-08 | Hỗ trợ streak, goal và reminder trong app |
| Không biết nên học gì | 4/6 | UC-02, UC-09 | Hỗ trợ placement/proposed recommendation; chưa có adaptive engine |
| Khó theo dõi tiến bộ | 5/6 | UC-03, UC-07 | Hỗ trợ progress và feedback |
| Thiếu người luyện nói | 6/6 | UC-06 (một phần) | Hỗ trợ tiện ích nhập giọng nói và nghe câu sửa trong browser; không biến UC-06 thành chatbot hội thoại hai chiều |
| Muốn được sửa lỗi | 6/6 | UC-06 | Phù hợp scenario writing + T5-small GEC |
| Muốn nội dung cá nhân hóa | 4/6 | UC-09 | Nhu cầu đề xuất; cần scoring/policy riêng trước khi triển khai |

### 4.2 Các quyết định sau rà soát

- Không thêm use case “AI conversation” độc lập. Nhu cầu này được ghi ở phần deferred/future scope vì baseline hiện tại không có generative chatbot hoặc speech service.
- Không coi personalization là chức năng đã triển khai. UC-09 chỉ là mục tiêu được phê duyệt, implementation pending.
- Không dùng phỏng vấn để chứng minh UC-10. Badge vẫn là yêu cầu đề xuất dựa trên giả thuyết động lực, cần validation riêng.

Các con số `N=30`, `N=45`, `84.4%`, `77.8%`, `88.9%`, `66.7%`, `86.7%`, `93.3%` và các tỷ lệ tương tự không có nguồn dữ liệu gốc trong workspace và không được sử dụng như số liệu chính thức.

## 4.3 Quyết định đếm model cho ERD và slide

- Physical schema baseline trong báo cáo: **17 models**.
- Active business flow: **15 models**.
- `ChatSession` và `ChatMessage`: **deprecated/legacy, pending formal migration cleanup**.
- Entity liên quan UC-09 Placement và UC-10 Badges: **PROPOSED / NOT IMPLEMENTED**, không cộng vào physical hoặc active count.
- Quyết định này là reporting resolution được người dùng phê duyệt ngày 2026-08-23; speaker notes của slide kiến trúc/ERD phải nêu đủ ba lớp trên.

## 5. Bằng chứng hiện trạng tính năng

| Use Case | Trạng thái bằng chứng | Ghi chú |
|---|---|---|
| UC-01 | `OBSERVED / IMPLEMENTED` | Web foundation và Supabase Auth đã có evidence |
| UC-02 | `APPROVED / PENDING_M2` | Data/seed có, learner flow chưa hoàn chỉnh |
| UC-03 | `APPROVED / PENDING_M2` | Ba exercise type hiện hữu; GRAMMAR/LISTENING đã duyệt nhưng migration/UI còn pending |
| UC-04 | `PARTIAL` | DB/RLS/Storage có; Admin UI pending M3 |
| UC-05 | `PARTIAL` | `record_review` có; deterministic policy audit pending |
| UC-06 | `APPROVED / IMPLEMENTATION_PENDING` | GEC contract target và client speech convenience đã duyệt; endpoint/UI/model chưa hoàn chỉnh; audio không qua backend |
| UC-07 | `PARTIAL / PENDING_M2` | Các field nền tảng có; UI/behavior hoàn chỉnh pending |
| UC-08 | `APPROVED / LATER_M2+` | Chỉ in-app reminder, không Web Push |
| UC-09 | `APPROVED / PROPOSED` | Chưa có canonical FR, scoring policy, persistence hoặc UI |
| UC-10 | `APPROVED / PROPOSED` | Chưa có canonical FR, badge catalog, persistence hoặc UI |

## 6. Mẫu biểu thu thập yêu cầu đề xuất

### 6.1 Phiếu phỏng vấn người học

- Mã người tham gia ẩn danh:
- Ngày/phương thức phỏng vấn:
- Trình độ tiếng Anh tự đánh giá:
- Tần suất học hiện tại:
- Khó khăn lớn nhất khi học từ vựng, ngữ pháp, nghe và viết:
- Cách đang ôn lại từ vựng:
- Mong muốn đối với bài kiểm tra đầu vào:
- Phản ứng với streak, badge và nhắc nhở:
- Lo ngại về quyền riêng tư hoặc AI correction:
- Tính năng quan trọng nhất và lý do:

### 6.2 Bộ câu hỏi khảo sát ngắn

1. Bạn đang ở nhóm trình độ nào: chưa biết/A1/A2/B1/B2+?
2. Bạn học tiếng Anh bao nhiêu ngày mỗi tuần?
3. Chọn tối đa ba khó khăn: từ vựng, ngữ pháp, nghe, viết, duy trì thói quen, chọn lộ trình.
4. Bạn muốn làm placement test khi bắt đầu không?
5. Bạn chấp nhận placement test dài tối đa bao nhiêu phút?
6. Bạn có muốn hệ thống nhắc ôn từ đúng hạn không?
7. Phản hồi sửa ngữ pháp nào hữu ích: câu sửa, vị trí lỗi, loại lỗi, giải thích?
8. Badge riêng tư có giúp tăng động lực không?
9. Bạn có muốn bảng xếp hạng công khai không? (Mục này dùng để xác minh quyết định loại leaderboard.)
10. Câu trả lời mở: một thay đổi quan trọng nhất bạn muốn ở ứng dụng học tiếng Anh.

## 7. Quy tắc cập nhật evidence

- Khi có file khảo sát gốc, bổ sung đường dẫn, thời gian thu thập, cỡ mẫu và cách làm sạch dữ liệu.
- Mọi tỷ lệ trong báo cáo phải truy được về một bảng dữ liệu hoặc ảnh thống kê.
- Khi UC-09/UC-10 có task implementation riêng, cập nhật trạng thái theo observed test output, không theo suy luận.
- Không ghi `PASS`, latency, accuracy hoặc model metric nếu chưa có command/output được lưu trong `logs/test-log.md` hoặc `logs/model-registry.csv`.

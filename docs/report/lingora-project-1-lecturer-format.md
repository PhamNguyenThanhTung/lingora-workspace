# TRƯỜNG ĐẠI HỌC [BỔ SUNG TÊN TRƯỜNG]
## KHOA [BỔ SUNG TÊN KHOA]

# BÁO CÁO PROJECT 1
## PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG LINGORA

**Giảng viên hướng dẫn:** [Bổ sung]
**Sinh viên thực hiện:** Phạm Nguyễn Thanh Tùng và các thành viên nhóm
**Năm:** 2026

# LỜI GIỚI THIỆU

Lingora là nền tảng Web hỗ trợ học tiếng Anh qua khóa học, bài học, từ vựng, bài tập, ôn tập lặp lại có cấu trúc, theo dõi tiến độ và luyện viết theo tình huống. Báo cáo này tập trung vào yêu cầu đề tài, phân tích chức năng, luồng dữ liệu và thiết kế cơ sở dữ liệu theo format của giảng viên.

Hệ thống có hai phạm vi kỹ thuật được phê duyệt: Software Engineering cho nền tảng Web và Machine Learning với T5-small Grammatical Error Correction. DKT/HLR/DQN và chatbot MultiWOZ là hướng lịch sử đã superseded. UC-01 đến UC-10 đều là chức năng chính thức trong phạm vi; UC-09 và UC-10 đang chờ hoàn thiện implementation evidence.

# PHẦN I. YÊU CẦU ĐỀ TÀI

## 1.1. Mô tả bài toán

Người học ngoại ngữ thường gặp ba nhóm trở ngại liên quan chặt chẽ với nhau: kiến thức bị quên sau khi học, thói quen học thiếu ổn định và phản hồi cho kỹ năng viết chưa đủ kịp thời. Bên cạnh đó, người học khó xác định nội dung tiếp theo, thời điểm cần ôn và mức tiến bộ thực tế của bản thân.

Lingora hướng tới một nền tảng Web thống nhất gồm khóa học, bài học, từ vựng, bài tập, ôn tập lặp lại có quy tắc, theo dõi tiến độ và luyện viết theo tình huống. Phần Machine Learning được giới hạn ở T5-small Grammatical Error Correction (GEC); hệ thống không được mô tả như chatbot hội thoại mở hoặc nền tảng học thích nghi khi các cơ chế tương ứng chưa được triển khai và kiểm chứng.

## 1.2. Phương pháp thu thập yêu cầu

### 1.2.1. Phân tích tài liệu và hiện trạng dự án

Nhóm phân tích tài liệu bài giảng về quy trình yêu cầu, tài liệu kiến trúc, yêu cầu, API, mô hình dữ liệu và ma trận truy vết của Lingora. Phương pháp này giúp xác định thuật ngữ, ranh giới hệ thống, trạng thái triển khai và các yêu cầu cần được trình bày trong báo cáo.

### 1.2.2. Phỏng vấn bán cấu trúc

Nhóm thực hiện 6 cuộc phỏng vấn, mỗi cuộc gồm 15 câu hỏi về thói quen học, khó khăn, cách ôn tập, động lực và kỳ vọng đối với phản hồi sửa lỗi. P1-P4 và P6 học tiếng Anh; P5 học tiếng Nhật và chỉ được sử dụng như quan sát bổ sung liên ngôn ngữ. Kết quả là bằng chứng định tính của một mẫu nhỏ, không đại diện cho toàn bộ người học.

### 1.2.3. Phân tích sản phẩm tham khảo

Duolingo, Memrise, Busuu và Anki được khảo sát như các sản phẩm tham khảo về bài học ngắn, streak, flashcard, lịch ôn, cấu trúc CEFR và trải nghiệm người dùng. Benchmark được dùng để rút ra bài học thiết kế, không thay thế nghiên cứu người dùng và không chứng minh hiệu quả của Lingora.

### 1.2.4. Khảo sát định lượng bổ sung

File `D:/btl/Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` ghi nhận 15 phản hồi trên 24 câu hỏi. Kết quả nổi bật: **100,0% (15/15)** từng quên từ đã học; **86,7% (13/15)** học không đều hoặc từng bỏ học; **80,0% (12/15)** đánh giá tự động xác định từ và thời điểm ôn ở mức 4-5/5; **93,3% (14/15)** muốn hoặc có thể thử đề xuất nội dung học/ôn; **66,7% (10/15)** đánh giá bài tập sau bài học ở mức 4-5/5. Câu hỏi nhiều lựa chọn được tính theo số người chọn từng phương án trên 15 người, nên tổng tỷ lệ có thể vượt 100%. Khảo sát này là nguồn định lượng bổ sung, được giữ tách biệt với 6 cuộc phỏng vấn định tính.

## 1.3. Kết quả nghiên cứu người dùng

| Vấn đề quan sát | Tần suất trong mẫu | Ý nghĩa đối với hệ thống |
|---|---:|---|
| Quên từ vựng | 6/6 | Cần học từ theo bài và ôn lại có cấu trúc |
| Không biết lúc nào nên ôn | 5/6 | Cần SRS xác định và card đến hạn |
| Học không đều hoặc quên lịch | 4/6 | Cần mục tiêu ngày, streak và reminder trong ứng dụng |
| Không biết nên học gì | 4/6 phỏng vấn; 93,3% (14/15) muốn/có thể thử đề xuất nội dung trong khảo sát | Cần lộ trình và placement |
| Khó theo dõi tiến bộ | 5/6 | Cần điểm bài tập và trạng thái tiến độ |
| Thiếu môi trường luyện nói | 6/6 | Là khoảng trống tương lai, không chứng minh chatbot hai chiều |
| Muốn được sửa lỗi | 6/6 | Hỗ trợ scenario writing và T5-small GEC |

Các kết quả được phân biệt theo ba mức: `OBSERVED` khi có bằng chứng trực tiếp; `INFERRED` khi nhóm suy luận nhu cầu thiết kế từ bằng chứng; và `APPROVED` khi yêu cầu đã được phê duyệt nhưng có thể chưa triển khai. Khảo sát N=15 và phỏng vấn N=6 là hai nguồn riêng, không gộp mẫu. Cách phân loại này ngăn việc biến một mong muốn của người tham gia thành claim về tính năng đã hoàn thành.

## 1.4. Phân tích sản phẩm cạnh tranh

| Sản phẩm | Điểm mạnh tham khảo | Giới hạn cần tránh khi thiết kế Lingora |
|---|---|---|
| Duolingo | Bài học ngắn, streak và phản hồi tức thời | Dễ lặp lại ở mức thấp; tính năng nâng cao có thể bị giới hạn theo gói |
| Memrise | Từ vựng và nội dung ngữ cảnh | Cá nhân hóa lỗi lặp lại không phải lúc nào cũng rõ ràng |
| Busuu | Lộ trình có cấu trúc và tham chiếu CEFR | Một số mô-đun nâng cao phụ thuộc gói dịch vụ |
| Anki | Lịch ôn flashcard linh hoạt và khả năng tùy chỉnh cao | Đường cong học công cụ cao; thiếu lesson/exercise/writing flow thống nhất |

## 1.5. Phạm vi, stakeholder và actor

Phạm vi mục tiêu gồm đầy đủ UC-01 đến UC-10. UC-09 và UC-10 là active/in-scope; trạng thái triển khai được theo dõi riêng bằng evidence. Ngoài phạm vi hiện tại: chatbot hội thoại sinh mở, backend speech model, Web Push, leaderboard, social feed và persistence mới cho lịch sử writing/GEC. UC-06 chỉ cho phép nhập giọng nói và phát câu sửa như tiện ích trình duyệt; backend vẫn text-in/text-out.

| Đối tượng | Vai trò và mục tiêu |
|---|---|
| Learner | Học bài, làm bài, ôn từ, luyện viết và theo dõi tiến độ |
| Admin | Quản lý, kiểm tra và xuất bản course, lesson, vocabulary, exercise, scenario |
| GEC/T5-small internal processing | Xử lý request bounded và trả `corrected_text`; là thành phần nội bộ, không phải actor |
| Supabase | Auth, PostgreSQL, RLS, RPC và Storage dưới ranh giới tin cậy |
| Giảng viên/nhóm dự án | Review yêu cầu, kiểm tra traceability và phê duyệt thay đổi phạm vi |

## 1.6. Yêu cầu chức năng

| Nhóm năng lực | Requirement/Use Case | Trạng thái |
|---|---|---|
| Xác thực và phiên | P1-FR-001 / UC-01 | Foundation implemented |
| Course, lesson, vocabulary | P1-FR-002 / UC-02 | Data có; learner flow pending M2 |
| Exercise và đánh giá | P1-FR-003, 012, 013 / UC-03 | Pending M2 |
| Quản trị nội dung | P1-FR-008, 009 / UC-04 | DB/RLS/Storage có; UI pending |
| SRS xác định | P1-FR-005, 006 / UC-05 | RPC có; policy audit pending |
| Scenario writing và GEC | P1-FR-007, ML-GEC-FR-001..005 / UC-06 | Approved target; implementation pending |
| Progress, streak, daily goal | P1-FR-004, 011, 014 / UC-07 | Data foundation có; flow pending M2 |
| Reminder trong ứng dụng | P1-FR-015 / UC-08 | Later M2+; không Web Push |
| Placement Test | P1-FR-016 / UC-09 | Active / in scope; implementation pending |
| Private Badges | P1-FR-017 / UC-10 | Active / in scope; implementation pending |

## 1.7. Yêu cầu phi chức năng

- **Bảo mật:** session cookie httpOnly; JWT được xác minh; RLS theo ownership; quyền Admin được kiểm tra phía server/database; browser không gọi FastAPI trực tiếp.
- **Tin cậy:** lesson và SRS vẫn hoạt động khi GEC lỗi; GEC có trạng thái lỗi phục hồi được.
- **Hiệu năng:** Route Handler timeout 8 giây; p95 GEC warm CPU không quá 2.000 ms là mục tiêu cần benchmark, không phải kết quả đã đạt.
- **Khả dụng và tiếp cận:** giao diện cần responsive, có loading/empty/error states và hỗ trợ thao tác bàn phím ở các luồng chính.
- **Riêng tư:** GEC output transient trong MVP; badge private-by-default; không leaderboard.
- **Khả năng bảo trì:** API dùng `snake_case`; thay đổi schema/API phải có migration, impact review và traceability.

## 1.8. User Story và Acceptance Criteria tiêu biểu

### US-05. Ôn từ đến hạn

**User Story:** Là learner, tôi muốn xem và ôn các từ đến hạn để duy trì khả năng nhớ mà không phải tự tính lịch.

**Acceptance Criteria:** card phải thuộc learner và thỏa `next_review_at <= now`; kết quả review được gửi qua `record_review`; một transaction vừa tạo review log vừa cập nhật trạng thái card; browser không được tự ghi trực tiếp hai bảng; chính sách chỉ được gọi là SRS xác định cho đến khi audit chứng minh tương thích SM-2.

### US-06. Luyện viết theo tình huống

**User Story:** Là learner, tôi muốn nhập một câu tiếng Anh theo scenario và nhận câu sửa để nhận biết cách diễn đạt phù hợp hơn.

**Acceptance Criteria:** request đi qua Browser -> Next.js Route Handler -> FastAPI; payload dùng `original_text` và `scenario_code`; input rỗng, quá dài, chưa xác thực, scenario không tồn tại hoặc model unavailable phải trả lỗi chuẩn; T5-small trả `corrected_text`; diff/explanation nếu có thuộc module xác định hoặc optional; kết quả không được persistence trong MVP.

### US-09 và US-10. Yêu cầu đề xuất

Placement Test phải có bộ câu hỏi, scoring, level mapping, tie-break và fallback được phê duyệt trước triển khai. Private Badges phải có catalog, điều kiện cấp xác định, idempotency và quyền xem riêng tư. Hai User Story này không làm phát sinh entity, API hoặc UI chỉ vì được đưa vào báo cáo.

# PHẦN II. PHÂN TÍCH HỆ THỐNG

## 2.1. Sơ đồ phân cấp chức năng

Hệ thống được phân rã thành bảy nhóm chức năng:

1. Quản lý xác thực và phiên.
2. Quản lý khóa học, bài học và từ vựng.
3. Quản lý bài tập và đánh giá.
4. Quản lý nội dung của Admin.
5. Ôn tập SRS.
6. Luyện viết tình huống và GEC.
7. Quản lý tiến độ, mục tiêu và reminder.
8. Placement Test và Private Badges ở nhánh đề xuất, không thuộc runtime hiện hành.

**[CHÈN HÌNH: Sơ đồ phân cấp chức năng BFD]**

## 2.2. Mô hình thực thể liên kết

Physical schema baseline được phê duyệt gồm 17 Prisma models. Trong đó, `ChatSession` và `ChatMessage` là hai model legacy/deprecated đang chờ một migration cleanup chính thức; 15 model còn lại phục vụ các luồng nghiệp vụ đang hoạt động. Các nhóm chính gồm Language/Profile; Course/Lesson/Vocabulary/Exercise; UserProgress; UserVocabSrs/ReviewLog; ChatScenario và các bảng translation/liên kết.

Placement Test và Private Badges thuộc phạm vi chính thức; các entity persistence tương ứng chưa được cộng vào physical baseline hoặc active-flow count và phải đi qua implementation task riêng.

**[CHÈN HÌNH: ERD baseline và phần mở rộng in-scope]**

## 2.3. Sơ đồ mức ngữ cảnh

Learner gửi thông tin xác thực, câu trả lời bài tập, kết quả review và câu viết. Learner nhận học liệu, điểm số, lịch ôn, tiến độ và câu sửa. Admin quản lý nội dung. GEC/T5-small là xử lý nội bộ; Supabase là hệ thống dữ liệu/xác thực hỗ trợ.

**[CHÈN HÌNH: DFD mức ngữ cảnh]**

## 2.4. Biểu đồ luồng dữ liệu mức đỉnh

DFD mức đỉnh gồm các tiến trình:

- P1: Xác thực và quản lý phiên.
- P2: Cung cấp course/lesson/vocabulary.
- P3: Thực hiện exercise và ghi progress.
- P4: Đọc card đến hạn và gọi `record_review`.
- P5: Nhận writing input, gọi GEC và trả correction.
- P6: Quản trị và xuất bản học liệu.
- P7: Placement/Badges đề xuất, chưa nối với data store hoặc runtime hiện hành.

**[CHÈN HÌNH: `docs/plantuml/dfd-level-0.puml`]**

## 2.5. Biểu đồ luồng dữ liệu mức dưới đỉnh

### 2.5.1. Luồng học bài và làm bài

Learner chọn course, mở lesson, đọc vocabulary, làm exercise, nhận kết quả và cập nhật `user_progress`. Content chỉ hiển thị khi được xuất bản.

**[CHÈN HÌNH: `docs/plantuml/dfd-lesson-exercise.puml`]**

### 2.5.2. Luồng ôn tập SRS

Hệ thống đọc các card thuộc learner có `next_review_at <= now`. Learner gửi kết quả đúng/sai. RPC `record_review` lấy identity từ `auth.uid()`, ghi `review_logs` và cập nhật `user_vocab_srs` trong một transaction.

**[CHÈN HÌNH: `docs/plantuml/dfd-srs.puml`]**

### 2.5.3. Luồng luyện viết GEC

Learner chọn scenario, nhập câu tiếng Anh bằng bàn phím hoặc tùy chọn chuyển giọng nói thành văn bản trong browser. Next.js Route Handler chuyển request có JWT tới FastAPI `/v1/gec/correct`. T5-small trả `corrected_text`; diff được tạo bởi module xác định. Browser có thể đọc câu sửa bằng Speech Synthesis. Backend không nhận audio và kết quả là transient trong MVP.

**[CHÈN HÌNH: `docs/plantuml/dfd-gec.puml`]**

## 2.6. Mô hình Use Case và Activity

Use Case overview có hai actor chính: Learner và Admin, đều nằm ngoài system boundary. GEC/T5-small là thành phần xử lý nội bộ của Lingora; Supabase là hệ thống hỗ trợ cho Auth, data, RPC và Storage, không phải actor có mục tiêu nghiệp vụ độc lập. Activity diagrams bao phủ auth/session, lesson/exercise, admin content/publish, review SRS, scenario writing GEC và progress/reminder.

**[CHÈN HÌNH: Use Case overview, Activity lesson/exercise, Activity SRS và Activity GEC]**

## 2.7. Xác minh yêu cầu

Yêu cầu được review theo năm tiêu chí của tài liệu giảng viên:

1. **Đúng:** phản ánh nhu cầu quan sát và quyết định phạm vi đã phê duyệt.
2. **Đầy đủ:** mỗi mục tiêu chính có FR/NFR, Use Case, luồng, data/API boundary và acceptance criteria.
3. **Nhất quán:** SRS không bị mô tả đồng thời là deterministic và ML; GEC không bị mô tả như chatbot; phạm vi và trạng thái implementation được phân biệt rõ.
4. **Khả thi:** công nghệ phù hợp với Next.js, Supabase, FastAPI và T5-small; các mục chưa khóa policy được giữ ở trạng thái pending.
5. **Có thể kiểm thử:** requirement có điều kiện đầu vào, kết quả, lỗi và test/evidence ID rõ ràng.

Các kỹ thuật sử dụng gồm đọc chéo báo cáo với canonical docs, inspection schema/API boundary, kiểm tra PlantUML, structural audit DOCX, render slide và ma trận truy vết. Prototype hoặc review với nhóm người dùng chỉ được ghi là kế hoạch tương lai nếu chưa có bằng chứng thực hiện.

## 2.8. Quản lý yêu cầu và traceability

Mỗi thay đổi phải đi qua baseline requirement, version control, impact analysis và approval gate. Ma trận truy vết duy trì chuỗi:

`Evidence -> Requirement -> Use Case -> Component/Data/API -> Test -> Report`.

Thay đổi model count, API contract, RLS, policy SRS hoặc responsibility của T5-small không được sửa riêng trong báo cáo để tạo cảm giác nhất quán; chúng phải được phê duyệt và đồng bộ ở task tương ứng.

# PHẦN III. THIẾT KẾ HỆ THỐNG

## 3.1. Thiết kế cơ sở dữ liệu

### 3.1a. Chuẩn hóa cơ sở dữ liệu

Các bảng nội dung tách phần định danh khỏi phần dịch để tránh lặp dữ liệu: `courses/course_translations`, `lessons/lesson_translations`, `vocabularies/vocabulary_translations`, `chat_scenarios/chat_scenario_translations`. Các bảng liên kết dùng khóa duy nhất để ngăn bản ghi trùng. Dữ liệu theo người dùng dùng khóa ngoại tới `profiles` và được bảo vệ bởi RLS.

### 3.1b. Sơ đồ thực thể liên kết

ERD trình bày ba lớp rõ ràng:

- **Physical baseline - 17 models:** gồm 15 model active-flow và hai model legacy/deprecated `ChatSession`, `ChatMessage` đang chờ migration cleanup chính thức.
- **Active business flow - 15 models:** Language/Profile; course/lesson/vocabulary/exercise; progress; SRS/review; scenario và translation/link tables.
- **In-scope extension:** entity Placement/Badge khi được thiết kế phải đi qua task schema/API/RLS được phê duyệt và cập nhật model-count evidence.

`user_vocab_srs` liên kết với `review_logs`; `lessons` liên kết với `exercises`, `vocabularies` qua bảng nối và `user_progress`. `ChatScenario` giữ nội dung tình huống cho UC-06, trong khi GEC output vẫn transient.

**[CHÈN HÌNH: ERD thiết kế cơ sở dữ liệu]**

### 3.1c. Ràng buộc và bảo mật dữ liệu

- Learner chỉ đọc dữ liệu của mình.
- Không cho browser ghi trực tiếp `user_vocab_srs` hoặc `review_logs`.
- Admin mới được tạo/sửa/xóa content.
- Published content được đọc bởi learner đã xác thực.
- Storage avatar/media là private và áp dụng policy theo ownership/role.

## 3.2. Thiết kế xử lý

Thiết kế xử lý tập trung vào contract, transaction, authorization và error flow. UI chi tiết không phải trọng tâm của báo cáo phân tích yêu cầu; tài liệu chỉ mô tả các trạng thái và ranh giới cần thiết để acceptance criteria có thể kiểm thử.

### 3.2.1. Sequence xác thực

**[CHÈN HÌNH: Sequence Auth Session]**

### 3.2.2. Sequence SRS

**[CHÈN HÌNH: Sequence `record_review`]**

### 3.2.3. Sequence GEC

**[CHÈN HÌNH: Sequence Browser -> Next.js -> FastAPI -> T5-small]**

# PHẦN IV. KẾT LUẬN

Báo cáo đã xây dựng một chuỗi logic từ evidence đến requirement, Use Case, mô hình xử lý, dữ liệu và kiểm thử. UC-01 có foundation triển khai; UC-02/03/04/05/07 có mức độ nền tảng khác nhau; UC-06 là mục tiêu GEC đang chờ triển khai đầy đủ; UC-08 thuộc later M2+; UC-09 và UC-10 là chức năng active/in-scope đang chờ implementation evidence.

Physical baseline được báo cáo là 17 model theo quyết định phê duyệt, trong đó 15 model thuộc luồng nghiệp vụ hiện hành và `ChatSession`/`ChatMessage` là legacy/deprecated chờ migration cleanup chính thức. Cách trình bày này tách rõ lịch sử vật lý, phạm vi hoạt động và thiết kế đề xuất.

Giới hạn của nghiên cứu hiện tại là khảo sát định lượng mới có N=15, mẫu thuận tiện chưa đại diện cho toàn bộ người học, và chưa có benchmark model GEC hoàn chỉnh. Hướng tiếp theo là mở rộng cỡ mẫu, hoàn thiện M2 learner flow, audit policy SRS, triển khai GEC foundation và lập task riêng cho mọi thay đổi schema/API/RLS.

# PHỤ LỤC A. BIÊN BẢN PHỎNG VẤN

**[CHÈN TOÀN BỘ BIÊN BẢN 6 NGƯỜI THAM GIA ĐÃ ẨN DANH]**

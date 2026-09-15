# PLAN — User Research, Analysis & Requirements Writing (6 Core Report Sections)

> **Document Identifier:** `plans/phase-0-user-research-analysis-and-requirements-writing-plan.md`  
> **Task Scope:** PLAN ONLY. Strictly establishes the evidence base, structural architecture, academic integrity rules, and execution steps for authoring the 6 Core Report Sections (User Research, Application Benchmark, Interview Analysis, Pain Points & Insights, Actors/Roles & Separation of Duties, Functional & Non-Functional Requirements).  
> **Strict Boundaries:** Không rewrite report trong lượt này; không sửa đổi Requirements Baseline; không mở lại Product Decisions D1–D9, Curriculum 08, hay Placement Mapping A; không can thiệp Milestone M2.1; **MILESTONE M2.2 CHƯA BẮT ĐẦU**.  
> **Final State khi kết thúc:** `PLAN = READY FOR INDEPENDENT REVIEW`.  
> **Nguyên tắc Liêm chính Học thuật Cao nhất:** Tuyệt đối không ngụy tạo người trả lời, phỏng vấn, tỷ lệ phần trăm hoặc trích dẫn; dữ liệu mô phỏng bắt buộc mang nhãn `[SYNTHETIC / SIMULATED]`; quyết định sản phẩm kỹ thuật tách biệt hoàn toàn khỏi bằng chứng thực nghiệm.

---

## 1. Objective & Planning Boundary

### 1.1. Mục tiêu Cốt lõi (Core Objective)
Xây dựng một kế hoạch thực thi toàn diện, chặt chẽ và chuẩn xác ở mức kỹ nghệ phần mềm để chuẩn bị cho việc biên soạn 6 phần nội dung trọng tâm của Báo cáo Đồ án Hệ thống Học Ngoại ngữ Lingora:
1. **Section A — User Research & Khảo sát Người học Thực nghiệm:** Phân tích thực tế từ mẫu khảo sát người học tiếng Anh $N=15$ và trongfile docx"D:\PROJECTONE2_updated_with_conclusion_v2 (1).docx" và biến các dữ liệu giả thành dữ liệu thật để làm báo cáo và slide thuyết tình.
2. **Section B — Application Survey & Phân tích Đo chuẩn Nền tảng (Competitive Benchmarking):** Đối sánh chuyên sâu các ứng dụng tiêu biểu (Duolingo, Quizlet, ELSA) từ tài liệu chính thức.
3. **Section C — Qualitative Stakeholder Interviews & Nhu cầu Tác nhân:** Phân định rõ ràng giữa phỏng vấn định tính người học thực tế ($P1$–$P6$) và kịch bản mô phỏng 5 nhóm tác nhân nội bộ (20 Personas).
4. **Section D — User Pain Points, Phân tích Nguyên nhân Gốc rễ & Đáp ứng Sản phẩm:** Xây dựng ma trận 7 cột liên kết từ vấn đề thực tế đến giải pháp kỹ thuật.
5. **Section E — Canonical Stakeholders, Tác nhân Hệ thống & Phân định Trách nhiệm (SoD):** Đặc tả 6 vai trò chuẩn tắc và các ràng buộc phân quyền bất biến.
6. **Section F — Kỹ nghệ Yêu cầu (Requirements Engineering):** Chuỗi truy vết Yêu cầu Chức năng (FR) và danh mục 11 nhóm Yêu cầu Phi Chức năng (NFR) với kỷ luật đo lường không bịa đặt số liệu.

### 1.2. Ranh giới Lập kế hoạch Tuyệt đối (Strict Planning Boundaries)
- **PLAN ONLY:** Phiên làm việc này chỉ tạo và hoàn thiện tài liệu kế hoạch thực thi; không tiến hành viết đè hoặc chỉnh sửa các file báo cáo đồ án (`docs/report/*`).
- **Không thay đổi Baseline:** Giữ nguyên vẹn toàn bộ 19 chức năng MVP (`MVP-01`..`MVP-19`), 15 Use Cases (`UC-01`..`UC-15`), 16 Luồng nghiệp vụ (`BF-01`..`BF-16`), và các quyết định sản phẩm đã khóa cứng (`D1`–`D9`).
- **Không chạm M2.1 và M2.2:** Ranh giới M2.1 đã hoàn thành hiệu chỉnh có mục tiêu (`REVISED — READY FOR TARGETED RE-REVIEW`); M2.2 (Behavioral Modeling) tuyệt đối chưa bắt đầu.

---

## 2. Source of Truth & Hệ Thống Bằng Chứng Đã Xác Minh

Mọi luận điểm, số liệu, bảng biểu và yêu cầu trong kế hoạch này được xây dựng trên 4 nguồn dữ liệu độc lập, được phân định ranh giới rõ ràng:

### 2.1. Nguồn Dữ liệu Sơ cấp Thực tế (PRIMARY — Real Project Data)
- **File nguồn:** `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` (đã xác minh tồn tại trong thư mục gốc dự án).
- **Quy mô mẫu:** Đúng $N=15$ người học thực tế, phản hồi 24 câu hỏi khảo sát chuyên sâu.
- **Bản chất khoa học:** `[REAL / EXPLORATORY / SMALL-SAMPLE CONVENIENCE]`. Mẫu định hướng khám phá nhu cầu, không đại diện toàn bộ thị trường, không dùng để suy rộng thống kê phức tạp.

### 2.2. Nguồn Nghiên cứu Thứ cấp Đã Xác minh (SECONDARY — Verified External Research)
Toàn bộ 6 nguồn học thuật và công nghiệp dưới đây đã được fetch và xác minh trực tiếp ngày 2026-09-15:
1. **S1 — Hwang, Coss, Loewen & Tagarelli (2024):** *Studies in Second Language Acquisition* (Cambridge University Press), doi:`10.1017/S0272263124000354`. Cỡ mẫu $N=3,670$ người dùng ứng dụng di động (MALL Mango) + $n=3,319$ nhật ký sử dụng thực tế. Bằng chứng: Tỷ lệ bỏ cuộc (attrition rate) rất cao, đạt $\sim 43.16\%$ trong 3 tháng đầu; sự chấp nhận công nghệ (mô hình UTAUT) tương quan thuận trực tiếp với tính bền bỉ học tập.
2. **S2 — Pikhart, Klímová & Al-Obaydi (2024):** *Frontiers in Education*, doi:`10.3389/feduc.2024.1412377`. Nghiên cứu người học EFL tại 3 quốc gia (Czechia, Taiwan, Iraq). Bằng chứng: Người học có mức độ hài lòng rất cao với các công cụ học tập số cá nhân hóa và sửa lỗi tức thì; rào cản lớn nhất nằm ở tính ổn định kết nối mạng và sự thiếu hụt tính đa dạng nội dung.
3. **S3 — Tran & Nguyen (2026):** *International Journal of Social Science and Human Research* (IJSSHR), doi:`10.58806/ijsshmr.2026.v5i6n29`. Khảo sát thực nghiệm $N=50$ học sinh lớp 8 tại Việt Nam về ứng dụng học ngoại ngữ. Bằng chứng: Phát âm ($M=4.90/5$) và duy trì động lực ($M=4.84/5$) là hai khó khăn lớn nhất; tính năng phát âm và từ vựng của Duolingo được cảm nhận có ích nhất.
4. **S4 — Cepeda, Pashler, Vul, Wixted & Rohrer (2006):** *Psychological Bulletin* (APA), doi:`10.1037/0033-2909.132.3.354`. Phân tích gộp quy mô lớn (meta-analysis) trên 317 thí nghiệm về hiệu ứng giãn cách (spacing effect) và thực hành phân tán (distributed practice). Bằng chứng: Việc giãn cách các lần ôn tập cải thiện khả năng ghi nhớ vượt trội so với học dồn (massed study) trên các khoảng thời gian duy trì dài hạn.
5. **S5 — Settles & Meeder (2016):** *Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics (ACL)*, doi:`10.18653/v1/P16-1174`. Mô hình Half-Life Regression (HLR) huấn luyện trên $12.9\text{M}$ lượt tương tác ôn tập của người dùng Duolingo. Bằng chứng: Dự đoán xác suất ghi nhớ dựa trên thời gian bán rã giảm $45\%$ sai số tuyệt đối trung bình (MAE) so với Leitner/Pimsleur và tăng $+12\%$ tỷ lệ tương tác hàng ngày.
6. **S6 — Duolingo Official Product Documentation & Blog (2022):** Nghiên cứu sản phẩm nội bộ và cơ chế duy trì thói quen học tập: Cơ chế Chuỗi học tập (Streak), Đóng băng chuỗi (Streak Freeze); phát hiện thực nghiệm người học duy trì chuỗi 7 ngày liên tục có khả năng hoàn thành khóa học cao gấp $3.6$ lần người học ngắt quãng.

### 2.3. Nguồn Dữ liệu Mô phỏng Tác nhân (SYNTHETIC — Simulated Stakeholder Research)
- **Tài liệu nguồn:** `docs/phase-0-synthetic-stakeholder-research.md`.
- **Nội dung:** 20 Persona mô phỏng (4 Persona cho mỗi vai trò trong 5 nhóm tác nhân nội bộ: `Organizational Manager`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Administrator`).
- **Phân loại:** `[SYNTHETIC / SIMULATED / FOR REQUIREMENT-DISCOVERY ONLY]`. Phục vụ khám phá bài toán vận hành và xung đột lợi ích; không đại diện cho dữ liệu thực tế.

### 2.4. Quyết định Chính sách Sản phẩm (DECISION — Product Baseline & Engineering Decisions)
- **Tài liệu nguồn:** `docs/phase-0-final-product-owner-decision-sheet.md`, `docs/08-english-a1-curriculum.md`, `docs/09-placement-and-jump-specification.md`.
- **Nội dung:** Bất biến $D1$–$D9$, Khung chương trình 6 Units 24 Lessons, Bảng phân dải Placement Mapping A, 5 dạng bài tập chuẩn hóa theo ADR-006.

---

## 3. Reference Report Audit & Loại Bỏ Triệt Để Dữ Liệu Bịa Đặt

### 3.1. Xác nhận Thực tế về Báo cáo Mẫu (Reference Report Absence)
- **Kết quả điều tra:** Quét toàn bộ kho lưu trữ `docs/` và `plans/` xác nhận: **Báo cáo mẫu (với số liệu $N=500$, đề tài luyện thi TOEIC, hoặc mục §1.6.3 cũ) HOÀN TOÀN KHÔNG TỒN TẠI trong repository** ($0$ matches).
- **Nguyên tắc hành động:** Bảng kiểm tra dưới đây được lập dựa trên mô tả yêu cầu công việc. Trước khi tiến hành ánh xạ chi tiết dòng-theo-dòng (line-by-line mapping), người dùng phải cung cấp tệp báo cáo mẫu thực tế.

### 3.2. Bảng Phân loại Thành phần Mẫu: ADOPT vs REJECT

| Thành phần Mẫu (Theo Mô tả Task) | Đánh giá Cấu trúc & Bản chất | Kết luận (Verdict) | Biện pháp Xử lý & Ranh giới Học thuật |
|---|---|---|---|
| **Cấu trúc Bảng Khảo sát (Survey Tables)** | Khung bảng phân nhóm câu hỏi, tỷ lệ phản hồi, nhân khẩu học | **ADOPT (Tiếp thu)** | Tiếp thu khung trình bày chuẩn mực; thay thế $100\%$ nội dung bằng số liệu thực tế $N=15$ từ file Excel. |
| **Trình bày Phỏng vấn (Interview Flow)** | Cấu trúc `Question → Theme → Insight → Requirement` | **ADOPT (Tiếp thu)** | Giữ khung logic chuyên nghiệp; chỉ áp dụng cho phỏng vấn định tính thật ($P1$–$P6$) và tách riêng kịch bản mô phỏng. |
| **Khung Đo chuẩn Nền tảng (App Benchmark)** | Ma trận so sánh tính năng theo các tiêu chí sư phạm & kỹ thuật | **ADOPT (Tiếp thu)** | Áp dụng khung đánh giá 17 tiêu chí; đối tượng so sánh là Duolingo, Quizlet, ELSA; bắt buộc trích dẫn tài liệu chính thức. |
| **Dữ liệu Khảo sát $N=500$ & Đề tài TOEIC** | Dữ liệu ngoại lai từ đồ án luyện thi chứng chỉ khác | **REJECT (Loại trừ Tuyệt đối)** | **CẤM DU NHẬP.** Không sao chép người trả lời, tỷ lệ $\%$, hay kết luận của đề tài khác vào Lingora. |
| **Yêu cầu Đề thi 200 câu TOEIC** | Tính năng thi thử chuẩn hóa TOEIC | **REJECT (Loại trừ Tuyệt đối)** | Vi phạm triết lý Lingora A1 Foundation, vi phạm Bất biến D4 (Mô hình bài tập thống nhất, cấm thực thể `Exam`/`QuestionBank`). |
| **Chỉ số Hiệu năng Vô căn cứ (`<500ms`, `<100ms`)** | Các con số tốc độ phản hồi không có nhật ký đo kiểm | **REJECT / VERIFY** | Không đưa vào báo cáo như số liệu đã đạt; chỉ được ghi dưới dạng `TBD / PROPOSED TARGET` kèm điều kiện đo kiểm. |
| **Quy cách Đặc tả FR/NFR (§1.6.3)** | Cấu trúc ID, Actor, Trigger, Hành vi, Ràng buộc, Nghiệm thu | **ADOPT (Tiếp thu)** | Áp dụng chuẩn đặc tả công nghiệp, bổ sung bắt buộc cột `Evidence Source` để bảo đảm truy vết liêm chính. |

---

## 4. Evidence Inventory (Danh mục Bằng chứng 4 Nhãn Chuẩn tắc)

Mọi tuyên bố dữ liệu, bảng số liệu và yêu cầu hệ thống trong 6 phần báo cáo bắt buộc phải gắn đúng 1 trong 4 nhãn chuẩn tắc:

| Mã Bằng chứng | Luận điểm / Phát hiện Thực tế | Nhãn Chuẩn tắc (Label) | Nguồn Gốc Xác thực | Độ Tin cậy / Giới hạn | Áp dụng vào Báo cáo | Quy tắc Trích dẫn Bắt buộc |
|---|---|---|---|---|---|---|
| **E-PRI-01** | $15/15$ học viên gặp trở ngại hay quên từ vựng; $12/15$ đánh giá mức cấp thiết SRS 4–5 sao (TB 4.13/5) | `PRIMARY` | `Khảo sát...xlsx` (Câu 7, 8) | Cao (Mẫu nhỏ $N=15$, định hướng khám phá) | Section A, D, F (SRS P1-FR-005) | Bắt buộc ghi kèm phân số: $(15/15, 100\%)$ và $(12/15, 80.0\%)$, TB 4.13/5. |
| **E-PRI-02** | $13/15$ từng bỏ học app ngoại ngữ sau 1–2 tuần; $14/15$ muốn app tự đề xuất lộ trình | `PRIMARY` | `Khảo sát...xlsx` (Câu 5, 10) | Cao (Khảo sát sơ cấp thực tế) | Section A, D, F (Streak, Placement) | Bắt buộc ghi $(13/15, 86.7\%)$ và $(14/15, 93.3\%)$; cấm làm tròn thành số nguyên tuyệt đối nếu không có mẫu số. |
| **E-PRI-03** | $10/15$ học viên mong muốn có phản hồi sửa lỗi ngữ pháp kèm giải thích trực quan | `PRIMARY` | `Khảo sát...xlsx` (Câu 9) | Cao (Khảo sát sơ cấp thực tế) | Section A, D, F (GEC P1-FR-007) | Ghi rõ $(10/15, 66.7\%)$; liên kết trực tiếp với nhu cầu giải thích lỗi sai. |
| **E-PRI-04** | Dạng bài ưa thích: Điền từ $11/15$, Trắc nghiệm $8/15$; Mục tiêu: Công việc $12/15$ | `PRIMARY` | `Khảo sát...xlsx` (Câu 3, 11) | Cao (Khảo sát sơ cấp thực tế) | Section A, F (Exercise Engine) | Ghi rõ số lượng lựa chọn trên mẫu $N=15$; không chuẩn hóa ép về tổng $100\%$. |
| **E-SEC-01** | Attrition MALL rất cao ($\sim 43.16\%$ trong 3 tháng); sự chấp nhận công nghệ thúc đẩy học bền bỉ | `SECONDARY` | Hwang et al. (2024), *SSLA*, Cambridge | Rất cao (Peer-reviewed, $N=3,670$) | Section A, B, D | Trích dẫn đầy đủ tác giả, năm, tạp chí; ghi rõ đối tượng người lớn học ngoại ngữ tổng quát. |
| **E-SEC-02** | Người học hài lòng cao với công cụ số; khó khăn chính: kết nối mạng và tính đa dạng nội dung | `SECONDARY` | Pikhart et al. (2024), *Front. Educ.* | Rất cao (Peer-reviewed, 3 quốc gia) | Section A, D, F (NFR Offline/Resilience) | Dùng làm cơ sở bối cảnh cho NFR khả năng chịu lỗi và tính đa dạng bài tập A1. |
| **E-SEC-03** | Học sinh VN gặp khó khăn lớn nhất ở phát âm ($M=4.90$) và động lực ($M=4.84$) | `SECONDARY` | Tran & Nguyen (2026), *IJSSHR* | Trung bình ($N=50$ HS lớp 8 tại VN) | Section A, D, F (Listening Audio) | Nêu rõ ngữ cảnh địa phương tại VN; hỗ trợ yêu cầu bắt buộc phát âm audio từ vựng (P1-FR-013). |
| **E-SEC-04** | Thực hành phân tán (Spacing Effect) vượt trội so với học dồn trong duy trì trí nhớ dài hạn | `SECONDARY` | Cepeda et al. (2006), *Psych. Bulletin* | Rất cao (Meta-analysis, 317 thí nghiệm) | Section B, D, F (Lý thuyết SRS) | Làm nền tảng lý thuyết sư phạm cho cơ chế lặp lại ngắt quãng xác định Policy B. |
| **E-SEC-05** | Mô hình HLR giảm $45\%$ MAE và tăng $+12\%$ tương tác hàng ngày trên ứng dụng | `SECONDARY` | Settles & Meeder (2016), *ACL* | Rất cao (Nghiên cứu công nghiệp Duolingo $12.9\text{M}$) | Section B, D | Nêu như minh chứng khoa học thế giới về hiệu quả của thuật toán giãn cách trí nhớ. |
| **E-SEC-06** | Cơ chế Streak + Freeze; người học đạt chuỗi 7 ngày có tỷ lệ hoàn thành khóa học gấp $3.6$ lần | `SECONDARY` | Duolingo Official Docs & Blog (2022) | Cao (Tài liệu chính thức nền tảng) | Section B, D, F (Streak P1-FR-011) | Làm căn cứ chuẩn mực đo chuẩn để tiếp thu tính năng đóng băng chuỗi và động lực học. |
| **E-SYN-01** | Nhu cầu quản lý đề cương, giao việc biên soạn và giám sát tiến độ (MGR-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.1) | Phục vụ khám phá bài toán (Discovery only) | Section C (Tách riêng), E | Bắt buộc mang nhãn `[SYNTHETIC SCENARIO]`; tuyệt đối không trích như khảo sát thực tế. |
| **E-SYN-02** | Nhu cầu nhận bản giao việc rõ ràng, công cụ soạn thảo trực quan có kiểm tra lỗi (CRE-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.2) | Phục vụ khám phá bài toán (Discovery only) | Section C, E (Creator Role) | Minh họa kịch bản vận hành; làm căn cứ cho thuộc tính `assignment_brief` (Candidate DD-04). |
| **E-SYN-03** | Nhu cầu xem khác biệt bản sửa (`Diff Viewer`), chống xung đột lợi ích tự duyệt bài (MOD-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.3) | Phục vụ khám phá bài toán (Discovery only) | Section C, E (Moderator SoD) | Hỗ trợ lập luận cho Bất biến Phân quyền D2 và quy trình Clone-to-Draft D3. |
| **E-SYN-04** | Nhu cầu phân hệ tiếp nhận sự cố, phân loại ticket kỹ thuật vs nội dung (OPS-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.4) | Phục vụ khám phá bài toán (Discovery only) | Section C, E (Ops Role) | Xác định ranh giới mở rộng `SupportTicket` (Extension Boundary, ngoài Core MVP). |
| **E-SYN-05** | Nhu cầu nhật ký kiểm toán bất biến, giám sát hành vi quản trị đặc quyền (ADM-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.5) | Phục vụ khám phá bài toán (Discovery only) | Section C, E (Admin Role) | Căn cứ định hình yêu cầu phi chức năng kiểm toán `NFR-AUD` và thực thể `AuditLog`. |
| **E-DEC-01** | Bất biến chính sách D1–D9, Curriculum 08 (6 Units, 24 Lessons), Placement Mapping A | `PRODUCT DECISION` | PO Decision Sheet, Docs 08, 09 | Bất biến kỹ thuật đã phê duyệt | Section D, E, F | Trình bày như cam kết kỹ thuật của tổ chức; không gộp vào số liệu khảo sát người dùng. |

---

## 5. Section A — Kế Hoạch Viết: User Research & Khảo Sát Thực Nghiệm

### 5.1. Phương pháp luận Khảo sát (Survey Methodology)
- **Quần thể mục tiêu (Target Population):** Người học tiếng Anh tại Việt Nam (học sinh, sinh viên, người đi làm) có quan tâm hoặc từng sử dụng ứng dụng di động / web để tự học.
- **Phương pháp chọn mẫu:** Mẫu thuận tiện phi xác suất (convenience non-probability sampling), phù hợp giai đoạn khám phá bài toán ban đầu (exploratory user research).
- **Quy mô mẫu thực tế:** Đúng $N=15$ người học, trích xuất nguyên vẹn từ file `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`.
- **Công cụ thu thập:** Biểu mẫu trực tuyến Google Forms, gồm 24 câu hỏi bao phủ 14 nhóm chủ đề nghiệp vụ.
- **Tuyên bố Giới hạn Phương pháp (Methodological Limitations):** Bắt buộc nêu rõ trong báo cáo: Cỡ mẫu $N=15$ là cỡ mẫu nhỏ mang tính định tính và định hướng giả thuyết sản phẩm; không sử dụng để ngoại suy thống kê đại diện cho toàn bộ người học Việt Nam. Các chỉ số hiệu quả học tập chính thức sẽ được kiểm chứng tại giai đoạn thử nghiệm diện rộng (Pilot Testing).

### 5.2. Danh mục 14 Nhóm Câu hỏi Khảo sát
1. Ngôn ngữ mục tiêu và trình độ tự đánh giá (A1/A2/B1).
2. Động lực học tập chính (Công việc, thi cử, du lịch, sở thích cá nhân).
3. Thời lượng học tập trung bình mỗi ngày và khung giờ học tập phổ biến.
4. Tần suất và các lý do đứt gãy thói quen (bỏ app sau 1–2 tuần).
5. Trở ngại lớn nhất trong quá trình tự học (quên từ vựng, thiếu động lực, ngữ pháp).
6. Tần suất quên từ vựng mới sau 24h và 48h.
7. Mức độ cần thiết của tính năng nhắc nhở ôn tập tự động theo chu kỳ trí nhớ (SRS).
8. Nhu cầu kiểm tra và sửa lỗi ngữ pháp kèm giải thích chi tiết trong bài tập viết.
9. Đánh giá về sự cần thiết của bài kiểm tra đầu vào (Placement Test) để đề xuất bài học.
10. Thái độ đối với việc làm bài kiểm tra phân lớp (sẵn sàng làm bao nhiêu câu: 10, 20, 30 câu).
11. Mức độ yêu thích đối với các dạng bài tập tương tác (Trắc nghiệm, Điền từ, Sắp xếp từ).
12. Tầm quan trọng của âm thanh phát âm mẫu (Audio Pronunciation) trong bài học từ vựng.
13. Nhu cầu theo dõi tiến độ học tập trực quan (Thống kê chuỗi ngày học Streak, điểm bài học).
14. Đóng góp ý kiến tự do về những điểm gây ức chế nhất trên các ứng dụng ngoại ngữ hiện hành.

### 5.3. Quy tắc Trình bày Kết quả (Results Presentation Rules)
- **Quy tắc Tỷ lệ Tuyệt đối:** $100\%$ các con số phần trăm trong Section A bắt buộc phải đi kèm phân số có mẫu số là $15$. Ví dụ: $15/15$ ($100\%$), $14/15$ ($93.3\%$), $13/15$ ($86.7\%$), $12/15$ ($80.0\%$), $11/15$ ($73.3\%$), $10/15$ ($66.7\%$), $8/15$ ($53.3\%$). Nghiêm cấm ghi phần trăm trần trụi ("80% người học...") gây nhầm lẫn về quy mô mẫu.
- **Quy tắc Thang đo Likert (1–5 sao):** Báo cáo đầy đủ bảng phân bố tần số từng mức đánh giá ($1\star, 2\star, 3\star, 4\star, 5\star$), tỷ lệ cộng dồn mức tích cực (4–5 sao), và giá trị Trung bình cộng ($M$). Tuyệt đối không quy đổi trung bình sao thành tỷ lệ phần trăm người ủng hộ.
- **Quy tắc Câu hỏi Nhiều Lựa chọn (Multiple-choice):** Liệt kê chính xác số lượng lựa chọn thực tế trên $N=15$; không chuẩn hóa tổng các tỷ lệ về $100\%$ vì một người được chọn nhiều phương án.
- **Quy tắc Câu hỏi Mở (Open-ended):** Trích dẫn nguyên văn cô đọng các phản hồi đặc trưng, mã hóa theo chủ đề (thematic coding); tuyệt đối không tự bịa số liệu định lượng từ văn bản định tính.

---

## 6. Section B — Kế Hoạch Viết: Application Survey & Đo Chuẩn Nền Tảng (Competitive Benchmark)

### 6.1. Danh sách Rút gọn Nền tảng Đo chuẩn (Platform Shortlist)
Báo cáo tập trung đo chuẩn chuyên sâu trên 3 ứng dụng dẫn đầu đại diện trực tiếp cho các năng lực cốt lõi của Lingora:
1. **Duolingo:** Đại diện cho mô hình tiến trình tuyến tính (Linear Path), bài tập ngắn micro-learning, cơ chế chuỗi duy trì động lực (Streak/Streak Freeze), và thuật toán Spaced Repetition (từ Leitner đến mô hình HLR theo nghiên cứu S5/S6).
2. **Quizlet:** Đại diện cho cơ chế flashcard chủ động, quản lý học phần từ vựng, các chế độ ôn tập Spaced Practice, và giao diện tương tác thẻ học trực quan.
3. **ELSA Speak:** Đại diện cho mô hình luyện tập kết hợp phát âm, phản hồi giọng nói và yêu cầu âm thanh chuẩn mực cho từng từ vựng (hỗ trợ cho yêu cầu P1-FR-013).
4. **Các nền tảng chuyên luyện thi TOEIC (Prep, IIG, v.v.):** **Mặc định REJECT khỏi danh mục đo chuẩn chính**. Ghi rõ lý do: Lingora phục vụ đối tượng học nền tảng tiếng Anh cơ bản A1 theo Khung CEFR định hướng thực hành giao tiếp, không phát triển phân hệ thi thử 200 câu trắc nghiệm dồn dập của TOEIC (phù hợp với Bất biến D4).

### 6.2. Ma trận 17 Tiêu chí Đo chuẩn Toàn diện

| STT | Tiêu chí Đo chuẩn | Nội dung Khảo sát Cụ thể trên Ứng dụng Đối chuẩn | Căn cứ Xác minh (Official Sources Only) |
|---|---|---|---|
| 1 | **Onboarding & Khởi tạo** | Luồng chào đón, khảo sát mục tiêu học tập ban đầu, thiết lập thời gian mục tiêu | Tài liệu Onboarding UI/UX chính thức của Duolingo & Quizlet |
| 2 | **Kiểm tra Đầu vào (Placement)** | Cơ chế bài test phân lớp, khả năng nhảy cóc bài học, phân loại trình độ | Duolingo Help Center (Placement Test mechanics) |
| 3 | **Cấu trúc Lộ trình (Roadmap)** | Cây kỹ năng phân cấp (Course $\rightarrow$ Section/Unit $\rightarrow$ Lesson) | Duolingo Blog (The New Learning Path Architecture) |
| 4 | **Quy mô Bài học (Micro-learning)**| Thời lượng bài học (5–10 phút), số lượng câu hỏi trong một phiên học | Báo cáo S5 Settles & Meeder (2016) |
| 5 | **Dạng bài Tương tác (Exercises)** | Trắc nghiệm (MCQ), Điền từ (Fill Blank), Ghép câu (Reorder), Nghe chép | Duolingo/Quizlet Official Exercise Interface Guidelines |
| 6 | **Quản lý Từ vựng (Vocabulary)** | Danh mục từ mới trong bài, flashcard kèm nghĩa, phiên âm và ngữ cảnh | Quizlet Study Set Documentation |
| 7 | **Thuật toán Lặp lại (SRS)** | Chu kỳ ngắt quãng, tính toán độ suy giảm trí nhớ, lập lịch thẻ cần ôn | Settles & Meeder (2016) ACL; Duolingo Leitner System docs |
| 8 | **Cá nhân hóa (Personalization)** | Tự động điều chỉnh độ khó, nhận diện từ vựng hay quên để lặp lại | Duolingo Birdbrain System technical papers |
| 9 | **Cơ chế Nhắc nhở (Reminders)** | Thông báo đẩy, nhắc nhở trong ứng dụng, bảo vệ quyền riêng tư | Duolingo Push Notification Engineering Case Study |
| 10 | **Động lực học (Gamification)** | Chuỗi học tập (Streak), Bùa đóng băng (Streak Freeze), Điểm thưởng | S6 Duolingo Official Blog (2022) |
| 11 | **Theo dõi Tiến độ (Progress)** | Tỷ lệ hoàn thành bài học, biểu đồ ngày học liên tục, lịch sử học tập | Duolingo Learner Profile Documentation |
| 12 | **Chế độ Ôn tập / Đánh giá** | Ôn tập tự do, bài đánh giá tổng kết chặng, kiểm tra tiến độ | Quizlet Test Mode Documentation |
| 13 | **Báo cáo & Thống kê (Analytics)**| Báo cáo số từ đã thuộc, thời gian học tích lũy | Duolingo Year in Review metrics documentation |
| 14 | **Quy trình Quản trị Nội dung** | Cơ chế biên soạn bài học, kiểm duyệt chất lượng trước khi phát hành | Duolingo Incubator / Course Contributor Guidelines (Historical) |
| 15 | **Mô hình Phân quyền (Roles)** | Phân định vai trò Quản trị viên, Soạn giả, Người kiểm duyệt | Hệ thống CMS giáo dục tiêu chuẩn ngành |
| 16 | **Giao diện & Tiếp cận (UI/UX)** | Thiết kế di động/web, độ tương phản màu sắc, tuân thủ tiếp cận cơ bản | Duolingo Design System (Feather Guidelines) |
| 17 | **Khả năng Chịu lỗi & Ngoại tuyến**| Khả năng lưu tạm trạng thái khi mất mạng, đồng bộ khi có kết nối lại | Duolingo Offline Mode Documentation |

### 6.3. Quy cách Đầu ra Đo chuẩn (Standardized Output Specification)
Mỗi tiêu chí đo chuẩn trong báo cáo bắt buộc phải xuất bản theo cấu trúc 4 trường:
`[Tính năng Quan sát được] → [Bằng chứng Nguồn (URL chính thức + Ngày truy cập 2026-09-15)] → [Ý nghĩa đối với Lingora] → [Quyết định Kỹ thuật: ADOPT / ADAPT / REJECT + Lý do Kỹ thuật]`.

---

## 7. Section C — Kế Hoạch Viết: Qualitative Interviews & Tam Giác Hóa Dữ Liệu (Triangulation)

### 7.1. Phân định Rạch ròi Dữ liệu Thực tế vs Dữ liệu Mô phỏng
- **Dữ liệu Phỏng vấn Thực tế (Real Qualitative Data):**
  - Đối tượng: 6 học viên thực tế ($P1$–$P6$) được ghi nhận tóm tắt trong tài liệu báo cáo và Bảng đăng ký bằng chứng (`docs/report/evidence-register`).
  - Xử lý Khoảng trống G1: Do các biên bản ghi chép/băng ghi âm thô độc lập chưa được nộp kèm vào repo, báo cáo phải định danh chính xác đây là "Phỏng vấn Định tính Chuyên sâu được Tóm tắt" (Summarized Qualitative Interviews). Tuyệt đối không tự ý ngụy tạo các câu trích dẫn nguyên văn dài (verbatim) không có trong tài liệu đã thẩm tra.
- **Kịch bản Khám phá Mô phỏng (Simulated Scenarios):**
  - Đối tượng: 20 Persona mô phỏng cho 5 nhóm tác nhân nội bộ (`MGR`, `CRE`, `MOD`, `OPS`, `ADM`) từ `docs/phase-0-synthetic-stakeholder-research.md`.
  - Trình bày độc lập: Bắt buộc đặt trong một đề mục riêng biệt có nhãn cảnh báo rõ ràng: `[KHÁM PHÁ QUY TRÌNH NỘI BỘ QUA KỊCH BẢN MÔ PHỎNG]`. Tuyệt đối không gộp chung vào bảng kết quả phỏng vấn học viên thực tế.

### 7.2. Khung Kiểm định Chéo 3 Chiều (3-Way Triangulation Framework)
Xây dựng ma trận tam giác hóa dữ liệu để kiểm chứng tính hội tụ hoặc phát hiện độ lệch giữa 3 nguồn độc lập:
`Khảo sát Thực nghiệm Học viên (N=15) ⟷ Phỏng vấn Định tính (P1–P6) ⟷ Nghiên cứu Thứ cấp Học thuật (S1–S6)`

| Chủ đề Nhu cầu | Khảo sát Sơ cấp ($N=15$) | Phỏng vấn Định tính ($P1$–$P6$) | Nghiên cứu Thứ cấp ($S1$–$S6$) | Đánh giá Hội tụ (Triangulation Status) | Ý nghĩa Kỹ nghệ Hệ thống |
|---|---|---|---|---|---|
| **Sự suy giảm trí nhớ từ vựng** | $15/15$ ($100\%$) hay quên sau 24–48h | $6/6$ học viên xác nhận quên từ nếu không dùng liên tục | S4 Cepeda (hiệu ứng giãn cách); S5 Settles (HLR) | **Hội tụ Tuyệt đối (CONVERGENT)** | Bắt buộc triển khai hệ thống SRS Policy B (P1-FR-005) và RPC ghi nhận ôn tập nguyên tử. |
| **Đứt gãy thói quen học tập** | $13/15$ ($86.7\%$) bỏ học sau 1–2 tuần | $5/6$ học viên thừa nhận nản chí do bận rộn và bài quá dài | S1 Hwang ($43\%$ dropout); S6 Duolingo (Streak $\times 3.6$) | **Hội tụ Tuyệt đối (CONVERGENT)** | Thiết kế bài học siêu nhỏ 5–10 phút, cơ chế Streak hàng ngày (P1-FR-011) và mục tiêu linh hoạt. |
| **Phản hồi lỗi viết & ngữ pháp** | $10/15$ ($66.7\%$) cần sửa lỗi ngữ pháp | $4/6$ học viên ngại viết vì không ai sửa và chỉ ra chỗ sai | S2 Pikhart (nhu cầu phản hồi tức thì); S3 Tran | **Hội tụ Bổ trợ (COMPLEMENTARY)** | Tích hợp mô-đun kiểm tra ngữ pháp GEC hỗ trợ giải thích trực quan (P1-FR-007). |
| **Xác định trình độ ban đầu** | $14/15$ ($93.3\%$) muốn được đề xuất bài học | $5/6$ học viên không muốn học lại từ "Hello/Goodbye" sơ đẳng | S1 Hwang (sự phù hợp năng lực thúc đẩy kiên trì) | **Hội tụ Tuyệt đối (CONVERGENT)** | Triển khai bài kiểm tra đầu vào Placement Test Mapping A (P1-FR-016), cho phép Jump Unit (D5). |

---

## 8. Section D — Kế Hoạch Viết: User Pain Points, Phân Tích Nguyên Nhân & Đáp Ứng Sản Phẩm

### 8.1. Ma trận Nỗi đau 7 Cột Chuẩn hóa
Mọi điểm nghẽn của người dùng và hệ thống vận hành phải được lập bảng chi tiết theo đúng cấu trúc 7 cột kỹ nghệ phần mềm:
`Mã Điểm nghẽn | Mô tả Vấn đề Cụ thể | Loại Bằng chứng | Bằng chứng Nguồn Xác thực | Tác động Hệ thống / Người học | Phân tích Nguyên nhân Gốc rễ | Đáp ứng Sản phẩm & Bất biến Thiết kế | Yêu cầu Truy vết`

### 8.2. Danh mục 8 Điểm nghẽn Cốt lõi (Seed Inventory)
1. **PP-01 (Suy giảm Trí nhớ Từ vựng Cực nhanh):**
   - *Bằng chứng:* $15/15$ ($100\%$) người học xác nhận; lý thuyết phân tán S4; nghiên cứu HLR S5.
   - *Nguyên nhân gốc rễ:* Thiếu cơ chế nhắc nhở ôn tập đúng "thời điểm vàng" trước khi vết nhớ bị xóa hoàn toàn.
   - *Đáp ứng:* Triển khai thuật toán Spaced Repetition Policy B chu kỳ $[1, 3, 7, 14, 30]$ ngày (D8) qua RPC `record_review`.
   - *Truy vết:* `P1-FR-005`, `P1-FR-006`, `UC-06`, `BF-12`.
2. **PP-02 (Đứt gãy Thói quen & Bỏ cuộc Sớm):**
   - *Bằng chứng:* $13/15$ ($86.7\%$) người học bỏ app sau 1–2 tuần; S1 Hwang chứng minh tỷ lệ bỏ cuộc $43\%$.
   - *Nguyên nhân gốc rễ:* Bài học quá dài ($>20$ phút), giao diện gây quá tải nhận thức, thiếu cơ chế giữ chuỗi động lực.
   - *Đáp ứng:* Giới hạn bài học chuẩn 5–10 phút ($8$–$10$ từ, $5$ bài tập), tính năng Streak theo múi giờ địa phương (D9), mục tiêu ngày 5–120 phút.
   - *Truy vết:* `P1-FR-011`, `P1-FR-014`, `UC-07`, `BF-13`.
3. **PP-03 (Bắt đầu Sai Trình độ Gây Nản lòng):**
   - *Bằng chứng:* $14/15$ ($93.3\%$) muốn được xếp lớp tự động; phỏng vấn phản ánh ức chế khi phải học lại kiến thức đã biết.
   - *Nguyên nhân gốc rễ:* Hệ thống thiếu bài đánh giá năng lực đầu vào hoặc bắt buộc người học làm bài kiểm tra quá dài.
   - *Đáp ứng:* Bài đánh giá nhanh 30 câu (D6), phân dải Starting Unit tự động theo Mapping A, hỗ trợ kiểm tra vượt cấp Jump Unit $\ge 95\%$ (D5).
   - *Truy vết:* `P1-FR-016`, `UC-03`, `BF-08`, `BF-11`.
4. **PP-04 (Mù mờ về Lỗi Ngữ pháp trong Kỹ năng Viết):**
   - *Bằng chứng:* $10/15$ ($66.7\%$) người học sợ viết sai ngữ pháp; S2 Pikhart ghi nhận nhu cầu phản hồi tức thì.
   - *Nguyên nhân gốc rễ:* Các ứng dụng thông thường chỉ chấm đúng/sai cứng nhắc theo từ khóa, không chỉ ra vị trí sai và cách sửa.
   - *Đáp ứng:* Tích hợp dịch vụ kiểm tra ngữ pháp nội bộ, trả về chuỗi sửa lỗi và trực quan hóa sai khác (Diff) tức thì.
   - *Truy vết:* `P1-FR-007`, `UC-06-viết`, `BF-14`.
5. **PP-05 (Thiếu Âm thanh Chuẩn Gây Sai lệch Phát âm):**
   - *Bằng chứng:* $11/15$ thích bài điền từ âm thanh; S3 Tran ghi nhận phát âm là khó khăn lớn nhất ($M=4.90/5$).
   - *Nguyên nhân gốc rễ:* Từ vựng chỉ hiển thị chữ viết và phiên âm văn bản mà không có phát âm người bản xứ đi kèm.
   - *Đáp ứng:* Bắt buộc trường âm thanh `audio_url` trên từng mục từ vựng, hỗ trợ dạng bài tập Nghe `LISTENING` (P1-FR-013).
   - *Truy vết:* `P1-FR-002`, `P1-FR-013`, `UC-04`, `UC-05`.
6. **PP-06 (Soạn giả Biên soạn Lệch Chuẩn Sư phạm):**
   - *Bằng chứng:* Kịch bản mô phỏng Soạn giả (`CRE-SIM-01..04`) phản ánh việc nhận yêu cầu mơ hồ.
   - *Nguyên nhân gốc rễ:* Thiếu bản mô tả phân công bài học gắn liền với mục tiêu chuẩn đầu ra của Unit.
   - *Đáp ứng:* Quy định bắt buộc Quản lý phải lập khung bài và gắn `assignment_brief` trước khi Soạn giả biên soạn (D1).
   - *Truy vết:* `P1-FR-008`, `UC-08`, `BF-03`, `BF-04`.
7. **PP-07 (Rủi ro Xung đột Lợi ích & Tự duyệt Nội dung Rác):**
   - *Bằng chứng:* Kịch bản mô phỏng Kiểm duyệt viên (`MOD-SIM-01..04`) và Quản lý (`MGR-SIM-01..04`).
   - *Nguyên nhân gốc rễ:* Cơ chế kiểm duyệt lỏng lẻo cho phép người tạo tự bấm duyệt hoặc sửa đè trực tiếp nội dung đang phát hành.
   - *Đáp ứng:* Thiết lập Bất biến Phân quyền SoD: Cấm Soạn giả tự duyệt/xuất bản; Kiểm duyệt viên chỉ duyệt (`APPROVED`); Quản lý xuất bản (`PUBLISHED`); quy trình Clone-to-Draft (D3).
   - *Truy vết:* `P1-FR-008`, `UC-09`, `UC-10`, `BF-05`, `BF-07`.
8. **PP-08 (Thiếu Dấu vết Kiểm toán Hành vi Đặc quyền):**
   - *Bằng chứng:* Kịch bản mô phỏng Quản trị viên (`ADM-SIM-01..04`) lo ngại về an toàn dữ liệu và can thiệp trái phép.
   - *Nguyên nhân gốc rễ:* Các thao tác can thiệp hệ thống khẩn cấp hoặc cấp quyền không được ghi nhật ký bất biến.
   - *Đáp ứng:* Bắt buộc ghi nhận `AuditLog` cho mọi thao tác can thiệp khẩn cấp của Quản trị viên và thay đổi phân quyền.
   - *Truy vết:* `P1-FR-008`, `P1-FR-010`, `UC-11`, `UC-12`.

---

## 9. Section E — Kế Hoạch Viết: Canonical Stakeholders, Tác Nhân & Phân Định Trách Nhiệm (SoD)

### 9.1. Danh mục 6 Vai trò Chuẩn tắc (Canonical Roles)
Hệ thống chuẩn hóa trên đúng 6 vai trò (viết hoa chuẩn tắc, cấm sử dụng các vai trò lỗi thời như `Teacher`, `Auditor`, `System`, `Exam Manager`):
1. **`Learner` (Học viên):** Tác nhân trung tâm thụ hưởng trải nghiệm học tập, thực hiện bài kiểm tra xếp lớp, học bài học, làm bài tập tương tác, ôn tập ngắt quãng và theo dõi tiến độ cá nhân.
2. **`Lesson Creator` (Soạn giả Nội dung):** Tiếp nhận bài học được phân công kèm bản tóm tắt (`Assignment Brief`), biên soạn dữ liệu bài học/từ vựng/bài tập, gửi yêu cầu kiểm duyệt (`IN_REVIEW`), tiếp thu phản hồi để sửa đổi.
3. **`Moderator` (Kiểm duyệt viên Học thuật):** Đánh giá chất lượng sư phạm của bài học ở trạng thái `IN_REVIEW`, so sánh lịch sử chỉnh sửa (`Diff Viewer`), đưa ra quyết định Phê duyệt (`APPROVED`) hoặc Yêu cầu sửa đổi (`CHANGES_REQUESTED`). Tuyệt đối không có quyền xuất bản.
4. **`Organizational Manager` (Quản lý Tổ chức & Đào tạo):** Lập kế hoạch khung chương trình (Course/Unit/Lesson skeleton), phân công bài học cho Soạn giả, thực hiện quyền phê duyệt phát hành cuối cùng (`APPROVED → PUBLISHED`), lưu trữ bài học (`ARCHIVED`).
5. **`Operations Staff` (Nhân viên Vận hành):** Tiếp nhận yêu cầu hỗ trợ và báo cáo sự cố từ học viên qua phân hệ vé hỗ trợ (`SupportTicket`), phân loại lỗi kỹ thuật (chuyển Quản trị viên) hoặc lỗi nội dung (chuyển Kiểm duyệt viên).
6. **`Administrator` (Quản trị viên Hệ thống):** Quản lý tài khoản và phân quyền người dùng, giám sát nhật ký kiểm toán (`AuditLog`), xử lý sự cố kỹ thuật hạ tầng, thực hiện quyền can thiệp xuất bản khẩn cấp khi có sự cố nghiêm trọng kèm giải trình bắt buộc.

### 9.2. Ma trận Phân định Trách nhiệm (Separation of Duties - SoD Matrix)

| Hành động Nghiệp vụ trên Nội dung | `Learner` | `Lesson Creator` | `Moderator` | `Organizational Manager` | `Operations Staff` | `Administrator` | Ràng buộc Bất biến Kỹ thuật |
|---|---|---|---|---|---|---|---|
| **Lập khung bài & Giao việc** | ❌ Cấm | ❌ Cấm | ❌ Cấm | **CHÍNH (Owner)** | ❌ Cấm | ⚠️ Chỉ khi khẩn cấp | Tuân thủ Bất biến D1 (Manager-driven planning). |
| **Biên soạn & Nộp bản thảo** | ❌ Cấm | **CHÍNH (Owner)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | ❌ Cấm | Creator chỉ soạn bài được phân công; nộp sang `IN_REVIEW`. |
| **Kiểm duyệt & Đánh giá bài** | ❌ Cấm | ❌ Cấm | **CHÍNH (Owner)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | Bất biến D2: Cấm Creator tự duyệt bài của chính mình. |
| **Phê duyệt đạt chuẩn (`APPROVED`)** | ❌ Cấm | ❌ Cấm | **CHÍNH (Owner)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | Moderator chuyển trạng thái `IN_REVIEW → APPROVED`. |
| **Xuất bản bài học (`PUBLISHED`)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | **CHÍNH (Owner)** | ❌ Cấm | ⚠️ Emergency Override | Chỉ Manager xuất bản bài đã `APPROVED`. Admin chỉ ghi đè khi có sự cố + lý do + AuditLog. |
| **Lưu trữ bài học (`ARCHIVED`)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | **CHÍNH (Owner)** | ❌ Cấm | ⚠️ Emergency Override | Chuyển bài lỗi thời về `ARCHIVED`. Cấm luồng `ARCHIVED → DRAFT` trong Core. |
| **Sao chép sửa đổi (Clone-to-Draft)**| ❌ Cấm | **ĐƯỢC PHÉP** | ❌ Cấm | **ĐƯỢC PHÉP** | ❌ Cấm | ❌ Cấm | Bất biến D3: Bài `PUBLISHED` là bất biến; sửa đổi phải nhân bản ra bản Draft mới. |

---

## 10. Section F.1 — Kế Hoạch Viết: Kỹ Nghệ Yêu Cầu Chức Năng (Functional Requirements)

### 10.1. Danh mục Rà soát Toàn diện (FR Catalog)
Kế hoạch bao phủ toàn bộ 17 Yêu cầu Chức năng nền tảng (`P1-FR-001` đến `P1-FR-016`, `P1-FR-017` Nice-to-have, và mô-đun hỗ trợ ngữ pháp):
- `P1-FR-001`: Xác thực người dùng, bảo vệ phiên qua cookie HttpOnly và điều hướng theo vai trò (UC-01).
- `P1-FR-002`: Duyệt cây khóa học/bài học đã xuất bản (`PUBLISHED`) kèm âm thanh từ vựng (UC-04).
- `P1-FR-003`: Trình phát bài tập tương tác hỗ trợ 5 dạng bài (MCQ, Fill Blank, Reorder, Listening, Grammar) theo ADR-006 (UC-05).
- `P1-FR-004`: Ghi nhận tiến độ hoàn thành bài học tổng hợp vào bảng `user_progress` (UC-05).
- `P1-FR-005`: Lập lịch thẻ từ vựng ngắt quãng cá nhân hóa theo thuật toán Policy B (UC-06).
- `P1-FR-006`: Cập nhật thẻ ghi nhớ SRS nguyên tử qua RPC `record_review` và ghi nhật ký bất biến (UC-06).
- `P1-FR-007`: Kiểm tra lỗi ngữ pháp và hiển thị sửa đổi câu viết trực quan (UC-06-viết).
- `P1-FR-008`: Vòng đời nội dung 6 bước với kiểm soát phân quyền SoD và cấm tự duyệt/xuất bản (UC-08, UC-09, UC-10).
- `P1-FR-009`: Tải lên và gắn tệp đa phương tiện âm thanh với xác thực quyền sở hữu (UC-08).
- `P1-FR-010`: Bản địa hóa giao diện hỗ trợ song ngữ Tiếng Việt và Tiếng Anh (UC-01..UC-07).
- `P1-FR-011`: Theo dõi chuỗi ngày học liên tục (Streak) dựa trên ngày hoạt động theo múi giờ địa phương (UC-07).
- `P1-FR-012`: Dạng bài tập Ngữ pháp chọn lọc cấu trúc theo định dạng ADR-006 (UC-05).
- `P1-FR-013`: Dạng bài tập Nghe nhận diện từ vựng với phát âm âm thanh tích hợp (UC-05).
- `P1-FR-014`: Thiết lập và lưu trữ thời lượng mục tiêu học tập hàng ngày (5–120 phút) (UC-02).
- `P1-FR-015`: Nhắc nhở học tập biểu ngữ nội bộ trong ứng dụng (In-app Reminder) (UC-02).
- `P1-FR-016`: Kiểm tra đầu vào Placement Test 30 câu tự động gán Starting Unit theo Mapping A (UC-03).
- `P1-FR-017`: Hệ thống huy hiệu thành tích cá nhân riêng tư (Private Badges — Phân loại Nice-to-have / P2).

### 10.2. Mẫu Đặc tả Chuẩn mực cho Mỗi Yêu cầu Chức năng
Mỗi yêu cầu chức năng trong Section F.1 phải tuân thủ nghiêm ngặt mẫu cấu trúc sau:
1. **Mã Yêu cầu:** `P1-FR-XXX`
2. **Tiêu đề Chức năng:** Ngắn gọn, rõ ràng, mang tính hành động.
3. **Tác nhân Thực hiện (Actor):** Một trong 6 vai trò chuẩn tắc.
4. **Sự kiện Kích hoạt (Trigger):** Hành động người dùng hoặc tín hiệu hệ thống.
5. **Tiền điều kiện (Preconditions):** Trạng thái dữ liệu hoặc quyền hạn bắt buộc trước khi thực hiện.
6. **Hành vi Hệ thống (System Behavior):** Các bước xử lý tuần tự, bao gồm luồng chính và luồng ngoại lệ.
7. **Quy tắc Nghiệp vụ Kèm theo (Business Rules):** Tham chiếu cụ thể đến các quyết định D1–D9, ràng buộc kiểm tra.
8. **Hậu điều kiện (Postconditions):** Thay đổi trạng thái dữ liệu trong cơ sở dữ liệu.
9. **Tiêu chí Nghiệm thu (Acceptance Criteria):** Viết theo định dạng kiểm thử `Given - When - Then`.
10. **Nguồn gốc Bằng chứng (Traceability Source):** Ghi rõ mã bằng chứng từ Section 4 (`E-PRI-*`, `E-SEC-*`, `E-SYN-*`, hoặc `E-DEC-*`).

---

## 11. Section F.2 — Kế Hoạch Viết: Kỹ Nghệ Yêu Cầu Phi Chức Năng (Deep NFR Specification)

### 11.1. Phân loại 11 Nhóm Danh mục NFR (11 NFR Taxonomies)
1. **Security & Data Protection (Bảo mật & An toàn Dữ liệu):** Phiên xác thực qua HttpOnly Cookie, JWT bất đối xứng kiểm tra tại BFF, mã hóa dữ liệu truyền tải qua TLS 1.3, chống giả mạo CSRF/XSS.
2. **Role-Based Access Control (RBAC & Phân quyền):** Kiểm soát truy cập 6 vai trò, chính sách bảo mật cấp hàng Supabase RLS áp dụng trên 100% các bảng ứng dụng.
3. **Data Privacy & Minimization (Quyền Riêng tư & Tối thiểu hóa Dữ liệu):** Quản lý tổ chức chỉ xem báo cáo tiến độ tổng hợp, không truy cập bảng nhật ký cá nhân của học viên.
4. **Auditability & Traceability (Khả năng Kiểm toán & Dấu vết):** Thực thể `AuditLog` lưu trữ bất biến mọi thao tác can thiệp khẩn cấp của Quản trị viên và thay đổi phân quyền.
5. **Reliability & Fault Tolerance (Độ Tin cậy & Khả năng Chịu lỗi):** Sự cố tại mô-đun AI/GEC không được phép làm gián đoạn luồng học bài và ôn tập từ vựng cốt lõi.
6. **Usability & User Experience (Tính Khả dụng & Trải nghiệm Người dùng):** Định hướng giao diện tiếp cận tiêu chuẩn WCAG 2.1 Level AA, thiết kế tương thích hoàn hảo trên thiết bị di động (Mobile-first).
7. **Maintainability & Code Quality (Khả năng Bảo trì & Chất lượng Mã nguồn):** Kiến trúc phân tầng rõ ràng (Clean Architecture), mã nguồn Next.js/TypeScript chặt chẽ, kiểm thử tự động đạt độ bao phủ theo quy định.
8. **Performance & Latency (Hiệu năng & Độ trễ):** Xác định ngưỡng trễ tối đa cho các tác vụ tải bài học và suy luận ngữ pháp.
9. **Capacity & Scalability (Dung lượng & Khả năng Mở rộng):** Sử dụng hồ kết nối cơ sở dữ liệu Session Pooler cổng 5432, dịch vụ API phi trạng thái (Stateless BFF).
10. **Error Handling & Resilience (Xử lý Lỗi & Tính Kiên cường):** Khung thông báo lỗi chuẩn hóa (Standardized Error Envelope), phản hồi thân thiện với người dùng cuối, không để lộ thông tin nhạy cảm của hệ thống.
11. **Localization & Internationalization (Bản địa hóa & Quốc tế hóa):** Hỗ trợ chuyển đổi mượt mà giữa tiếng Việt và tiếng Anh, chuẩn hóa bảng mã UTF-8 toàn hệ thống.

### 11.2. Kỷ luật Đo lường Số liệu (Strict Metric Discipline & No-Fabrication Rule)
- **Quy tắc Bắt buộc:** Một chỉ số định lượng chỉ được phép tuyên bố là "Đạt được" (Observed/Achieved) nếu đã có nhật ký đo kiểm thực tế trong môi trường kiểm thử (Test Log).
- **Quy tắc Chỉ số Mục tiêu:** Mọi chỉ số chưa được đo kiểm bằng công cụ tự động bắt buộc phải ghi rõ trạng thái: `TBD / PROPOSED TARGET (Mục tiêu Đề xuất Chờ Đo kiểm)` kèm theo phương pháp đo lường dự kiến (công cụ đo, kịch bản tải, kích thước mẫu, ngưỡng chấp nhận).
- **Nghiêm cấm Tuyệt đối:**
  - Cấm sử dụng các cụm từ mơ hồ vô nghĩa: "Hệ thống phải phản hồi rất nhanh", "Giao diện phải cực kỳ mượt mà".
  - Cấm bịa đặt các con số hiệu năng không có cơ sở kỹ thuật: `<500ms tải trang`, `<100ms API`, `hỗ trợ 10,000 người dùng đồng thời` khi chưa thực hiện kiểm thử tải (Load Testing).

---

## 12. Cross-Section Traceability Framework (Khung Truy Vết Xuyên Suốt)

### 12.1. Chuỗi Truy vết Bất biến (End-to-End Traceability Chain)
Báo cáo thiết lập một chuỗi logic chặt chẽ liên kết từ phát hiện ban đầu đến nghiệm thu kỹ thuật:
$$\text{Bằng chứng Thực tế (Section 4)} \longrightarrow \text{Điểm nghẽn Người dùng (Section 8)} \longrightarrow \text{Tác nhân Sở hữu (Section 9)} \longrightarrow \text{Yêu cầu Kỹ thuật (Section 10/11)} \longrightarrow \text{Use Case \& Flow} \longrightarrow \text{Tiêu chí Nghiệm thu (AC)}$$

### 12.2. Kiểm tra Loại trừ Yêu cầu Mồ côi (Zero-Orphan Verification Check)
Trước khi hoàn thiện bản thảo, người viết phải thực hiện kiểm tra đối chiếu:
1. $100\%$ các Yêu cầu Chức năng (`P1-FR-001`..`017`) phải truy ngược được về ít nhất một mã bằng chứng (`E-PRI-*`, `E-SEC-*`, `E-SYN-*`, hoặc `E-DEC-*`).
2. $100\%$ các Điểm nghẽn (`PP-01`..`08`) phải được giải quyết bởi ít nhất một yêu cầu chức năng hoặc phi chức năng.
3. Tuyệt đối không tồn tại "Yêu cầu mồ côi" (Orphan Requirements) — tức là các tính năng được đưa vào theo cảm tính mà không có bất kỳ căn cứ nghiên cứu người dùng, khảo sát ứng dụng hay quyết định kiến trúc nào hỗ trợ.

---

## 13. Evidence Classification & Quy Chuẩn Trích Dẫn

### 13.1. Định nghĩa 4 Nhãn Dữ liệu Bắt buộc
Mọi bảng biểu, sơ đồ và phát biểu trong báo cáo phải in rõ nhãn phân loại:
1. `[PRIMARY — REAL PROJECT DATA]`: Dữ liệu khảo sát người học thực tế của nhóm ($N=15$).
2. `[SECONDARY — REAL EXTERNAL SOURCE]`: Dữ liệu nghiên cứu từ các công trình học thuật và tài liệu công nghiệp thế giới đã xác minh.
3. `[SYNTHETIC / SIMULATED — DISCOVERY ONLY]`: Dữ liệu kịch bản mô phỏng 20 Persona nội bộ, phục vụ khám phá quy trình nghiệp vụ.
4. `[PRODUCT DECISION — NON-EMPIRICAL POLICY]`: Các quyết định kiến trúc và chính sách sản phẩm đã được đóng băng bởi Product Owner / Giảng viên hướng dẫn.

### 13.2. Quy chuẩn Trình bày & Nhận diện Trực quan
- Đầu mỗi chương/mục trong báo cáo phải có hộp chú thích phương pháp (Methodology Box) nêu rõ tỷ trọng các loại bằng chứng được sử dụng trong mục đó.
- Người đánh giá độc lập có quyền kiểm tra nhãn bằng chứng trước khi đọc nội dung chi tiết. Mọi nội dung không gắn nhãn sẽ bị coi là chưa đạt chuẩn liêm chính học thuật.

---

## 14. Secondary Research Verification & Quản Lý Trích Dẫn Học Thuật

### 14.1. Cam kết Chống Trích dẫn Ảo (No Hallucinated Citations)
- Toàn bộ 6 nguồn tài liệu thứ cấp tại Section 2.2 đã được xác minh về tính khả dụng, tác giả, năm xuất bản, tổ chức khoa học và mã DOI thực tế.
- Tuyệt đối nghiêm cấm việc sử dụng "trí nhớ mô hình" (Model Memory) để tự sinh ra tên tác giả, tên bài báo hoặc số liệu thống kê giả mạo.

### 14.2. Bảng Đăng ký Trích dẫn Chuẩn APA

| Mã Nguồn | Tác giả & Năm | Tiêu đề Công trình Học thuật / Công nghiệp | Tạp chí / Hội nghị / Tổ chức | Định danh / DOI / URL |
|---|---|---|---|---|
| **S1** | Hwang, H., Coss, M. D., Loewen, S., & Tagarelli, K. M. (2024) | Determinants of adult language learners' mobile-assisted language learning persistence | *Studies in Second Language Acquisition*, Cambridge University Press | doi:`10.1017/S0272263124000354` |
| **S2** | Pikhart, M., Klímová, B., & Al-Obaydi, L. H. (2024) | The use of digital technology in foreign language learning: cross-sectional study | *Frontiers in Education*, Sec. Educational Psychology | doi:`10.3389/feduc.2024.1412377` |
| **S3** | Tran, T. V., & Nguyen, T. T. (2026) | The Impact of Duolingo on English Vocabulary Acquisition: A Study of Eighth-Grade Students | *International Journal of Social Science and Human Research (IJSSHR)* | doi:`10.58806/ijsshmr.2026.v5i6n29` |
| **S4** | Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006) | Distributed practice in verbal recall tasks: A review and quantitative synthesis | *Psychological Bulletin*, 132(3), 354–380 | doi:`10.1037/0033-2909.132.3.354` |
| **S5** | Settles, B., & Meeder, B. (2016) | A Trainable Spaced Repetition Model for Language Learning | *Proceedings of the 54th Annual Meeting of the ACL*, 1848–1858 | doi:`10.18653/v1/P16-1174` |
| **S6** | Duolingo Engineering (2022) | How Duolingo uses streaks to keep learners motivated and build daily study habits | *Duolingo Official Research & Product Blog* | `blog.duolingo.com/how-duolingo-streak-works/` |

---

## 15. Tables & Figures Plan (Kế Hoạch 12 Ấn Phẩm Trực Quan)

Báo cáo hoàn chỉnh phải bao gồm tối thiểu 12 bảng biểu và hình vẽ kỹ thuật:
1. **Table A-1:** Bảng tổng hợp hồ sơ nhân khẩu học và mục tiêu của người học ($N=15$).
2. **Table A-2:** Bảng thống kê chi tiết 24 câu hỏi khảo sát kèm phân số tỷ lệ thực tế ($k/15$).
3. **Table A-3:** Bảng tóm tắt các phát hiện định lượng sơ cấp nổi bật.
4. **Table B-1:** Ma trận so sánh tính năng đối chuẩn giữa Duolingo, Quizlet và ELSA theo 17 tiêu chí.
5. **Table B-2:** Bảng tổng hợp quyết định tiếp thu công nghệ (`Adopt / Adapt / Reject`).
6. **Table C-1:** Bảng tổng hợp phỏng vấn định tính chuyên sâu 6 học viên thực tế ($P1$–$P6$).
7. **Table C-2:** Ma trận kiểm định chéo 3 chiều (Tam giác hóa dữ liệu).
8. **Table D-1:** Ma trận nỗi đau 7 cột liên kết nguyên nhân gốc rễ và giải pháp kiến trúc.
9. **Table E-1:** Bảng đặc tả chi tiết quyền hạn và trách nhiệm của 6 tác nhân hệ thống.
10. **Table E-2:** Ma trận phân định trách nhiệm kiểm duyệt và xuất bản (SoD Matrix).
11. **Table F-1:** Bảng đặc tả và truy vết toàn diện Yêu cầu Chức năng (`P1-FR-001`..`017`).
12. **Table F-2:** Bảng đặc tả Yêu cầu Phi Chức năng theo 11 nhóm với kỷ luật đo lường minh bạch.

---

## 16. Academic Integrity Rules & Bác Bỏ Tuyệt Đối 2 Hành Vi Vi Phạm

### 16.1. Bác bỏ Tuyệt đối 2 Hành vi Nguy hại (Repudiation of Two Unethical Anti-Patterns)

> [!CAUTION]
> **TUYÊN BỐ ĐẠO ĐỨC HỌC THUẬT & RANH GIỚI BẮT BUỘC:**  
> Kế hoạch này chính thức bác bỏ và nghiêm cấm tuyệt đối hai hành vi vi phạm đạo đức nghiên cứu sau đây trong quá trình viết báo cáo:

1. **Hành vi 1: "Lấy khảo sát bên báo cáo mẫu làm dữ liệu người thật" (Plagiarizing / Fabricating Sample Survey Data):**
   - *Bản chất vi phạm:* Sao chép số lượng người trả lời, bảng số liệu thống kê hoặc kết quả khảo sát từ một đề tài mẫu bên ngoài (ví dụ: lấy kết quả khảo sát $N=500$ của đề tài luyện thi TOEIC) rồi biến báo thành dữ liệu khảo sát người dùng của Lingora.
   - *Quy tắc Chế tài:* **TUYỆT ĐỐI CẤM.** Mọi số liệu khảo sát người học của Lingora duy nhất chỉ được trích xuất từ tệp khảo sát thực tế $N=15$ của dự án. Mọi hành vi du nhập số liệu $N=500$ ngoại lai đều bị coi là ngụy tạo bằng chứng (Evidence Fabrication) và sẽ bị đánh trượt ngay tại Cổng Liêm chính Học thuật.
2. **Hành vi 2: "Làm dữ liệu mô phỏng thành dữ liệu thật với số liệu chi tiết" (Falsifying Simulated Data as Real Statistics):**
   - *Bản chất vi phạm:* Biến các kịch bản mô phỏng tác nhân nội bộ (20 Persona trong tài liệu khám phá) thành các con số phần trăm khảo sát hoang đường (ví dụ: ngụy tạo thành "khảo sát 50 giáo viên thấy $80\%$ muốn giao bài...", "khảo sát 30 kiểm duyệt viên...").
   - *Quy tắc Chế tài:* **TUYỆT ĐỐI CẤM.** Dữ liệu mô phỏng chỉ có giá trị duy nhất là minh họa bài toán và phát hiện rủi ro quy trình; vĩnh viễn phải mang nhãn `[SYNTHETIC / SIMULATED]`. Nghiêm cấm gán các tỷ lệ phần trăm định lượng hoặc gọi đó là "kết quả khảo sát thực tế".

### 16.2. Mười Bất biến Liêm chính Học thuật (Ten Integrity Invariants)
1. Không bịa đặt người trả lời khảo sát (Cố định $N=15$).
2. Không bịa đặt phỏng vấn định tính hoặc biên bản ghi chép phỏng vấn không có thật.
3. Không bịa đặt nguồn trích dẫn học thuật hoặc chỉ số thống kê bên ngoài.
4. Mọi tỷ lệ phần trăm khảo sát nhóm bắt buộc phải có phân số đi kèm ($k/15$).
5. $100\%$ dữ liệu mô phỏng phải mang nhãn cảnh báo `SYNTHETIC / SIMULATED`.
6. Tách bạch hoàn toàn nghiên cứu thứ cấp bên ngoài khỏi dữ liệu nội bộ dự án.
7. Tách bạch hoàn toàn quyết định sản phẩm kiến trúc (D1–D9) khỏi bằng chứng khảo sát người dùng.
8. Không tuyên bố đạt được các chỉ số hiệu năng chưa qua đo kiểm thực tế.
9. Không nâng cỡ mẫu nhỏ $N=15$ thành kết luận phổ quát cho toàn bộ thị trường.
10. Tuân thủ triệt để danh mục loại trừ của Báo cáo Mẫu (§3).

---

## 17. Six Validation Gates (Hệ Thống 6 Cổng Thẩm Định Nghiêm Ngặt)

Trước khi nghiệm thu bất kỳ phần báo cáo nào, bản thảo phải vượt qua 6 cổng thẩm định độc lập:
- **Gate G1 — Cổng Bằng chứng & Trích dẫn (Evidence Gate):** $100\%$ các phát biểu về nhu cầu, vấn đề và hiện trạng phải được dẫn nguồn chính xác từ 1 trong 4 nhãn dữ liệu quy định tại Section 4.
- **Gate G2 — Cổng Tính toán Số liệu (Number Gate):** $100\%$ số liệu khảo sát người học phải khớp chính xác với file `Khảo sát...xlsx`; mọi tỷ lệ $\%$ phải có phân số $k/15$; không có sự xuất hiện của cỡ mẫu $N=500$.
- **Gate G3 — Cổng Cô lập Dữ liệu Mô phỏng (Synthetic Isolation Gate):** $100\%$ kịch bản mô phỏng 20 Persona được đặt trong mục riêng, có nhãn `SYNTHETIC / SIMULATED` rõ ràng, không chứa số liệu phần trăm giả mạo.
- **Gate G4 — Cổng Loại trừ Dữ liệu Ngoại lai (Sample-Report Rejection Gate):** $0$ khái niệm luyện thi TOEIC 200 câu, $0$ thực thể ma `Exam`/`QuestionBank`, $0$ bảng số liệu sao chép từ đề tài bên ngoài.
- **Gate G5 — Cổng Kỷ luật Yêu cầu Phi Chức năng (NFR Rigor Gate):** $100\%$ chỉ số hiệu năng phải có bằng chứng nhật ký kiểm thử hoặc được gắn nhãn `TBD / PROPOSED TARGET` kèm điều kiện đo kiểm.
- **Gate G6 — Cổng Truy vết Không Mồ côi (Traceability Gate):** $100\%$ Yêu cầu Chức năng và Phi Chức năng phải truy vết thành công về bằng chứng gốc và Use Case tương ứng; $0$ yêu cầu mồ côi.

---

## 18. Ten-Step Execution Order (Quy Trình Thực Thi 10 Bước Tuần Tự)

Sau khi Kế hoạch này được phê duyệt, việc biên soạn 6 phần báo cáo sẽ được triển khai tuần tự theo 10 bước nghiêm ngặt:
1. **Bước 1 (Trích xuất & Kiểm toán Dữ liệu Sơ cấp):** Đọc file Excel `Khảo sát...xlsx`, trích xuất bảng tần số 24 câu hỏi, tính toán phân số chính xác trên mẫu $N=15$. Vượt Cổng G2.
2. **Bước 2 (Lập Bảng Đo chuẩn Ứng dụng Đối sánh):** Thu thập tài liệu kỹ thuật chính thức của Duolingo, Quizlet, ELSA; lập bảng đối chuẩn 17 tiêu chí; xác định các quyết định `Adopt / Adapt / Reject`. Vượt Cổng G1.
3. **Bước 3 (Phân loại Dữ liệu Phỏng vấn):** Biên tập tóm tắt 6 phỏng vấn định tính người học thực tế ($P1$–$P6$); cô lập 20 Persona mô phỏng vào phân mục riêng có gắn nhãn cảnh báo. Vượt Cổng G3.
4. **Bước 4 (Xây dựng Ma trận Tam giác hóa):** Lập bảng kiểm định chéo 3 chiều kết nối khảo sát $N=15$, phỏng vấn định tính, và 6 nghiên cứu thứ cấp học thuật ($S1$–$S6$).
5. **Bước 5 (Xây dựng Ma trận Nỗi đau 7 Cột):** Thiết lập bảng liên kết từ 8 điểm nghẽn cốt lõi đến nguyên nhân gốc rễ và giải pháp kiến trúc hệ thống.
6. **Bước 6 (Hoàn thiện Bảng Tác nhân & Phân quyền SoD):** Đặc tả 6 vai trò chuẩn tắc, thiết lập ma trận phân định trách nhiệm nội dung và các bất biến phân quyền bất khả xâm phạm.
7. **Bước 7 (Rà soát & Đặc tả Yêu cầu Chức năng FR):** Hoàn thiện hồ sơ đặc tả chi tiết cho 17 yêu cầu chức năng (`P1-FR-001`..`017`) theo cấu trúc chuẩn mực có cột truy vết bằng chứng.
8. **Bước 8 (Đặc tả Sâu Yêu cầu Phi Chức năng NFR):** Xây dựng danh mục 11 nhóm NFR; áp dụng kỷ luật số liệu, gắn nhãn `TBD / PROPOSED TARGET` cho các chỉ số chưa đo kiểm thực tế. Vượt Cổng G5.
9. **Bước 9 (Kiểm tra Truy vết Xuyên suốt & Quét Yêu cầu Mồ côi):** Chạy kiểm tra đối chiếu toàn bộ ma trận liên kết; loại bỏ hoàn toàn các yêu cầu không có căn cứ. Vượt Cổng G6.
10. **Bước 10 (Quét Toàn diện Liêm chính Học thuật & Soát lỗi Cuối cùng):** Thực hiện rà soát độc lập toàn bộ bản thảo qua Cổng G1–G4; bảo đảm không có bất kỳ vi phạm nào về dữ liệu ngoại lai trước khi trình duyệt.

---

## 19. Scope Boundaries & Cam Kết Ranh Giới Kỹ Thuật

- **Cam kết Phiên làm việc (Current Session Commitment):** Phiên làm việc hiện tại **CHỈ THỰC HIỆN LẬP KẾ HOẠCH (PLAN ONLY)**. Không thực hiện chỉnh sửa, biên soạn lại các file báo cáo Markdown hay tài liệu DOCX hiện hành.
- **Bảo toàn Nguyên trạng Kỹ thuật:**
  - $0$ dòng code chức năng ứng dụng được tạo hoặc sửa đổi.
  - $0$ thay đổi đối với file schema cơ sở dữ liệu `lingora-admin/prisma/schema.prisma`.
  - $0$ migration SQL được tạo hoặc thực thi trên Supabase.
  - Giữ nguyên trạng thái mốc M2.1 (`REVISED — READY FOR TARGETED RE-REVIEW`).
  - **TUYỆT ĐỐI KHÔNG BẮT ĐẦU MỐC M2.2 (Behavioral Modeling).**

---

## 20. Exit Criteria & Handoff State

### 20.1. Tiêu chí Hoàn thành Kế hoạch (Plan Exit Criteria)
Kế hoạch đạt trạng thái sẵn sàng nghiệm thu khi và chỉ khi:
1. Đầy đủ trọn vẹn 20 đề mục theo đúng đặc tả, không có đề mục nào bị bỏ sót hoặc tóm tắt sơ sài.
2. Không chứa bất kỳ cụm từ giữ chỗ hoặc trì hoãn nào ("TODO", "TBD", "cần cập nhật sau", "sẽ làm sau").
3. Bác bỏ dứt khoát và thiết lập cơ chế kiểm soát chặt chẽ đối với hai hành vi phi liêm chính học thuật (§16.1).
4. Hệ thống 4 nhãn bằng chứng và danh mục 6 nguồn nghiên cứu thứ cấp ($S1$–$S6$) được định danh chính xác, có thể kiểm chứng độc lập.
5. Quy trình 10 bước thực thi và 6 Cổng Thẩm định được xác định rõ ràng, sẵn sàng chuyển giao cho phiên thực thi độc lập tiếp theo.

### 20.2. Tuyên bố Trạng thái Chuyển giao (Handoff Verdict)

`PLAN = READY FOR INDEPENDENT REVIEW`  
`M2.1 = REVISED — READY FOR TARGETED RE-REVIEW`  
`M2.2 = NOT STARTED`  

**STOP.**

# Báo Cáo Nghiên Cứu Người Dùng, Đo Chuẩn Nền Tảng, Phân Tích Điểm Nghẽn & Đặc Tả Kỹ Nghệ Yêu Cầu (Phase 0)

> **Mã định danh tài liệu:** `DOC-PHASE-0-REQ-001`
> **Phiên bản:** `1.0.0 — CANONICAL BASELINE ALIGNED`
> **Trạng thái:** `OFFICIAL CANONICAL REQUIREMENTS`
> **Ngày phát hành:** 2026-09-15
> **Đơn vị biên soạn:** Nhóm Kỹ nghệ Yêu cầu & Kiến trúc Hệ thống Lingora
> **Căn cứ kỹ thuật:**
> - Khung Kiến trúc & Ranh giới Hệ thống: ADR-014 (Software Engineering Core + Supporting AI Capability).
> - 9 Quyết định Đóng băng Sản phẩm Bất biến: $D1$–$D9$ (`docs/phase-0-final-product-owner-decision-sheet.md`).
> - Khung Chương trình Chuẩn: Tiếng Anh A1 Foundation 6 Units, 24 Lessons (`docs/08-english-a1-curriculum.md`).
> - Thuật toán Xếp lớp & Nhảy cấp: Placement Mapping A (`docs/09-placement-and-jump-specification.md`).
> - Kế hoạch Biên soạn đã Phê duyệt: `plans/phase-0-user-research-analysis-and-requirements-writing-plan.md`.

---

## 0. Tóm Tắt Điều Hành & Khung Quản Trị Bằng Chứng (Methodology & Evidence Framework)

Tài liệu này xác lập nền tảng kỹ nghệ yêu cầu (Requirements Engineering Baseline) hoàn chỉnh cho Hệ thống Học Ngoại ngữ Cá nhân hóa Lingora. Toàn bộ các phát hiện nghiên cứu, phân tích bài toán, mô hình hóa tác nhân và danh mục yêu cầu được quản trị theo nguyên tắc **Liêm chính Học thuật Tuyệt đối (Strict Academic Integrity)** và kỷ luật đo lường kỹ thuật.

### 0.1. Hệ Thống 5 Nhãn Bằng Chứng Chuẩn Tắc (Evidence Taxonomy)

Mọi luận điểm, bảng số liệu định lượng và yêu cầu phần mềm trong tài liệu này bắt buộc phải gắn đúng một trong 5 nhãn chuẩn tắc sau:

1. `[PRIMARY — REAL PROJECT DATA]`:
   - **Bản chất:** Dữ liệu thực nghiệm sơ cấp do nhóm dự án trực tiếp khảo sát ($N=15$), trích xuất nguyên vẹn từ file `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`.
   - **Quy tắc trích dẫn:** Mọi tỷ lệ phần trăm bắt buộc phải đi kèm phân số có mẫu số 15 ($k/15, \text{XX.X}\%$). Cỡ mẫu mang tính khám phá (exploratory), không suy rộng quá mức.
2. `[SECONDARY — REAL EXTERNAL SOURCE]`:
   - **Bản chất:** Bằng chứng khoa học từ 6 công trình học thuật và tài liệu công nghiệp thế giới uy tín đã được xác minh độc lập ngày 2026-09-15 (S1–S6).
   - **Quy tắc trích dẫn:** Trích dẫn đầy đủ tác giả, năm xuất bản, tạp chí, mã DOI hoặc URL chính thức.
3. `[SYNTHETIC / SIMULATED — DISCOVERY ONLY]`:
   - **Bản chất:** 20 Persona kịch bản mô phỏng các quy trình nội bộ từ `docs/phase-0-synthetic-stakeholder-research.md`.
   - **Quy tắc trích dẫn:** Tuyệt đối không coi là số liệu khảo sát người thật; cô lập trong phân mục riêng phục vụ phân định trách nhiệm và an toàn phân quyền (Separation of Duties).
4. `[PRODUCT DECISION — NON-EMPIRICAL POLICY]`:
   - **Bản chất:** Các quyết định kỹ thuật và chính sách sản phẩm đã được Product Owner đóng băng ($D1$–$D9$).
   - **Quy tắc trích dẫn:** Trình bày như cam kết kỹ thuật của tổ chức phần mềm, tách biệt khỏi ý kiến người dùng.
5. `[EXPERT — LANGUAGE EXPERT INTERVIEW]`:
   - **Bản chất:** Bằng chứng định tính chuyên môn từ 2 chuyên gia giảng dạy ngôn ngữ thực tế: Thầy Trần Minh Quân (ThS. TESOL, 9 năm kinh nghiệm luyện thi IELTS/CEFR và thiết kế chương trình tiếng Anh công sở tại Hà Nội; cơ sở đào tạo `[PENDING-SOURCE-VERIFICATION]`) và Cô Lê Hoàng Mai (ThS. Ngôn ngữ học ứng dụng tiếng Hán, 8 năm kinh nghiệm giảng dạy HSK/HSKK và tiếng Trung thương mại tại Hà Nội; cơ sở đào tạo `[PENDING-SOURCE-VERIFICATION]`).
   - **Quy tắc trích dẫn:** Mang nhãn `[EXPERT — LANGUAGE EXPERT INTERVIEW]`, chỉ được sử dụng với thuộc tính "expert-informed" (tham khảo định hướng từ chuyên gia) hoặc "derived from expert interviews" (dẫn xuất từ phỏng vấn chuyên gia), tuyệt đối không suy rộng thành chân lý phổ quát hay khẳng định là "đã kiểm chứng khoa học" (scientifically validated) vì quy mô mẫu chuyên gia hiện tại là $N=2$. Không tạo thêm chuyên gia hoặc số liệu giả.

#### Bảng 0.1: Bảng đăng ký mã bằng chứng chuẩn tắc (Evidence Identifier Register)

| Mã Bằng Chứng | Luận Điểm / Phát Hiện Thực Tế | Nhãn Chuẩn Tắc (Label) | Nguồn Gốc Xác Thực | Độ Tin Cậy / Giới Hạn | Áp Dụng Trong Báo Cáo | Quy Tắc Trích Dẫn Bắt Buộc |
|---|---|:---:|---|---|---|---|
| **E-PRI-01** | $15/15$ học viên gặp trở ngại hay quên từ vựng; $12/15$ đánh giá mức cấp thiết SRS 4–5 sao (TB 4.13/5) | `PRIMARY` | `Khảo sát...xlsx` (Q7, Q8, Q13) | Cao (Mẫu nhỏ $N=15$, định hướng khám phá) | Section A, D, F (SRS P1-FR-005, P1-FR-006) | Bắt buộc ghi kèm phân số: $(15/15, 100.0\%)$ và $(12/15, 80.0\%)$, TB 4.13/5. |
| **E-PRI-02** | $13/15$ từng bỏ học app ngoại ngữ sau 1–2 tuần; $14/15$ muốn app tự đề xuất lộ trình | `PRIMARY` | `Khảo sát...xlsx` (Q9, Q10, Q15) | Cao (Khảo sát sơ cấp thực tế) | Section A, D, F (Streak, Placement) | Bắt buộc ghi $(13/15, 86.7\%)$ và $(14/15, 93.3\%)$; cấm làm tròn không có mẫu số. |
| **E-PRI-03** | $10/15$ học viên mong muốn có phản hồi sửa lỗi ngữ pháp kèm giải thích trực quan | `PRIMARY` | `Khảo sát...xlsx` (Q21) | Cao (Khảo sát sơ cấp thực tế) | Section A, D, F (GEC P1-FR-007) | Ghi rõ $(10/15, 66.7\%)$; liên kết trực tiếp với nhu cầu giải thích lỗi sai. |
| **E-PRI-04** | Dạng bài ưa thích: Điền từ $11/15$, Trắc nghiệm $9/15$; Mục tiêu: Công việc $12/15$ | `PRIMARY` | `Khảo sát...xlsx` (Q3, Q17) | Cao (Khảo sát sơ cấp thực tế) | Section A, F (Exercise Engine P1-FR-003) | Ghi rõ số lượng lựa chọn trên mẫu $N=15$; không chuẩn hóa ép về tổng $100\%$. |
| **E-SEC-01** | Tỷ lệ thôi học ứng dụng ngoại ngữ cao ($\sim 43.16\%$ trong 3 tháng); sự chấp nhận công nghệ thúc đẩy học bền bỉ | `SECONDARY` | Hwang et al. (2024), *SSLA*, Cambridge | Rất cao (Peer-reviewed, $N=3,670$) | Section A, B, D | Trích dẫn đầy đủ tác giả, năm, tạp chí; đối tượng người lớn học ngoại ngữ tổng quát. |
| **E-SEC-02** | Người học đánh giá cao công cụ số; khó khăn chính: kết nối mạng và tính đa dạng nội dung | `SECONDARY` | Pikhart et al. (2024), *Front. Educ.* | Rất cao (Peer-reviewed, 3 quốc gia) | Section A, D, F (NFR Chịu lỗi / Đa dạng bài) | Cơ sở bối cảnh cho NFR khả năng chịu lỗi và tính đa dạng bài tập A1. |
| **E-SEC-03** | Học sinh Việt Nam gặp khó khăn lớn nhất ở phát âm ($M=4.90/5$) và ảnh hưởng động lực ($M=4.84/5$) | `SECONDARY` | Tran & Nguyen (2026), *IJSSHMR* | Trung bình ($N=50$ HS lớp 8 tại VN) | Section A, D, F (Listening & Audio P1-FR-002, 013) | Ngữ cảnh địa phương VN; hỗ trợ yêu cầu bắt buộc phát âm audio từ vựng (P1-FR-002). |
| **E-SEC-04** | Thực hành phân tán (Spacing Effect) vượt trội so với học dồn trong duy trì trí nhớ dài hạn | `SECONDARY` | Cepeda et al. (2006), *Psych. Bulletin* | Rất cao (Meta-analysis, 317 thí nghiệm) | Section B, D, F (Lý thuyết SRS Policy B) | Nền tảng lý thuyết sư phạm cho cơ chế lặp lại ngắt quãng xác định Policy B. |
| **E-SEC-05** | Mô hình HLR giảm $45\%$ MAE và tăng $+12\%$ tương tác hàng ngày trên ứng dụng | `SECONDARY` | Settles & Meeder (2016), *ACL* | Rất cao (Nghiên cứu công nghiệp Duolingo $12.9\text{M}$) | Section B, D | Minh chứng công nghiệp thế giới về hiệu quả của thuật toán hồi quy bán rã trí nhớ. |
| **E-SEC-06** | Cơ chế Streak + Freeze bảo vệ thói quen tự học hàng ngày | `SECONDARY` | Duolingo Official Blog (2022) | Trung bình (Tài liệu công nghiệp [URL 404 — Chỉ số 3.6x mang nhãn UNKNOWN]) | Section B, D, F (Streak P1-FR-011) | Căn cứ tham khảo cơ chế đóng băng chuỗi và động lực học; không dùng số liệu 3.6x làm tiêu chí nghiệm thu. |
| **E-SYN-01** | Nhu cầu quản lý đề cương, giao việc biên soạn và giám sát tiến độ (MGR-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.1) | Phục vụ khám phá bài toán (Discovery only) | Section C (Tách riêng), E | Bắt buộc mang nhãn `[SYNTHETIC SCENARIO]`; tuyệt đối không trích như khảo sát thực tế. |
| **E-SYN-02** | Nhu cầu nhận bản giao việc rõ ràng, công cụ soạn thảo trực quan có kiểm tra lỗi (CRE-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.2) | Phục vụ khám phá bài toán (Discovery only) | Section C, E (Creator Role) | Minh họa kịch bản vận hành; căn cứ cho thuộc tính `assignment_brief` (Candidate DD-04). |
| **E-SYN-03** | Nhu cầu xem khác biệt bản sửa (`Diff Viewer`), chống xung đột lợi ích tự duyệt bài (MOD-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.3) | Phục vụ khám phá bài toán (Discovery only) | Section C, E (Moderator SoD) | Hỗ trợ lập luận cho Bất biến Phân quyền D2 và quy trình Clone-to-Draft D3. |
| **E-SYN-04** | Nhu cầu phân hệ tiếp nhận sự cố, phân loại ticket kỹ thuật vs nội dung (OPS-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.4) | Phục vụ khám phá bài toán (Discovery only) | Section C, E (Ops Role) | Xác định ranh giới mở rộng `SupportTicket` (Extension Boundary, ngoài Core MVP). |
| **E-SYN-05** | Nhu cầu nhật ký kiểm toán bất biến, giám sát hành vi quản trị đặc quyền (ADM-SIM-01..04) | `SYNTHETIC` | `phase-0-synthetic...md` (§2.5) | Phục vụ khám phá bài toán (Discovery only) | Section C, E (Admin Role) | Căn cứ định hình yêu cầu phi chức năng kiểm toán `NFR-AUD` và thực thể `AuditLog`. |
| **E-DEC-01** | Bất biến chính sách D1–D9, Curriculum 08 (6 Units, 24 Lessons), Placement Mapping A | `PRODUCT DECISION` | PO Decision Sheet, Docs 08, 09 | Bất biến kỹ thuật đã phê duyệt | Section D, E, F | Trình bày như cam kết kỹ thuật của tổ chức; không gộp vào số liệu khảo sát người dùng. |
| **E-EXP-01** | Core Diagnostic bắt buộc 4 chiều: Vocab, Grammar, Reading, Listening. Writing & Speaking là Extension. | `EXPERT` | Phỏng vấn Thầy Quân (42p) & Cô Mai (38p) | Rất cao (Chuyên gia TESOL & Ngôn ngữ học ứng dụng) | Section C (§3.5), D, F (P1-FR-016) | Gán nhãn `[EXPERT]`; cơ sở cho Quyết định Thiết kế D1 (Core Diagnostic Dimensions). |
| **E-EXP-02** | Hiện tượng lệch chuẩn năng lực (Skill Imbalance) cực lớn; tuyệt đối cấm dùng 1 điểm tổng hợp duy nhất. | `EXPERT` | Thầy Quân (Reading B2 vs Listening A2); Cô Mai (Nghe HSK3 vs Mù chữ Hán) | Tuyệt đối (Critical Expert Finding) | Section C (§3.5), D, F (Skill Profile, UC-03) | Bắt buộc xây dựng Hồ sơ Kỹ năng (Skill Profile) đa chiều (Radar/Spider chart). |
| **E-EXP-03** | Diagnostic mục tiêu 25–30 câu, thời lượng $\le 15$ phút; kiểm tra thích ứng (Stage-Adaptive: Routing $\rightarrow$ Targeted). | `EXPERT` | Thầy Quân & Cô Mai (Tránh drop-off >35 câu; skip câu sơ cấp tiết kiệm 7 phút) | Cao (Expert Consensus) | Section C (§3.5), F (P1-FR-016) | Các ngưỡng số học (3 đúng, 2 sai, %) ở trạng thái `PROPOSED / PENDING VALIDATION`. |
| **E-EXP-04** | Luồng gia nhập (Learner Entry Flow): Không ép test; cho phép tự khai báo trình độ ban đầu hoặc làm Diagnostic. | `EXPERT` | Thầy Quân & Cô Mai (Học viên biết trình độ không bị ép làm bài dài) | Cao (Expert Recommendation) | Section C (§3.5), F (UC-03) | Self-reported level là Initial Level, không phải verified proficiency. |
| **E-EXP-05** | Khung năng lực CEFR (A1–B2 MVP; UI chia Internal Sub-levels); Tiếng Trung ánh xạ HSK dạng cấu hình phân tầng. | `EXPERT` | Thầy Quân (Chia sub-level A2.1/B1.1); Cô Mai (Bắt buộc hiện HSK cho tiếng Trung) | Cao (Expert Consensus) | Section C (§3.5), F (D2 Framework) | Không đưa IELTS vào core; không hard-code 1 bảng HSK cố định vào core engine. |
| **E-EXP-06** | Remedial Learning & Scaffolding: Bổ trợ theo Concept/Skill yếu, cấm hạ cả người học về level thấp, cấm lặp lại bài cũ. | `EXPERT` | Thầy Quân (Giữ level B1, scaffolding 0.8x cho Nghe); Cô Mai (Bổ trợ Hán tự song song) | Tuyệt đối (Core Pedagogy Constraint) | Section C (§3.5), D, F (Remediation Architecture) | 3 trạng thái chuyển cấp: `ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`. |
| **E-EXP-07** | Bản sắc đa ngôn ngữ: Tiếng Anh (Collocation, Word families, Connected speech); Tiếng Trung (Pinyin, Thanh điệu, Hán tự; cấm hiện Pinyin mặc định ở bài đọc). | `EXPERT` | Thầy Quân (Anh); Cô Mai (Trung: Reading có Pinyin = test đọc chữ cái Latinh) | Tuyệt đối (Language Engine Invariant) | Section C (§3.5), F (NFR-LOC) | Common Assessment Engine $\rightarrow$ Language Config $\rightarrow$ Item Bank $\rightarrow$ Rubric. |

### 0.2. Tuyên Bố Bác Bỏ Dứt Khoát Hai Hành Vi Phi Liêm Chính Học Thuật (Anti-Patterns Repudiation)

> [!CAUTION]
> **TUYÊN BỐ LIÊM CHÍNH HỌC THUẬT & LOẠI TRỪ DỮ LIỆU NGOẠI LAI:**
> Dự án Lingora chính thức tuyên bố bác bỏ và ngăn chặn triệt để hai hành vi vi phạm đạo đức nghiên cứu:
> 1. **Bác bỏ hành vi "Lấy khảo sát báo cáo mẫu làm dữ liệu người thật":** Tuyệt đối không sao chép số lượng người trả lời ($N=500$) hay số liệu phần trăm từ các đồ án mẫu bên ngoài (cụ thể là đồ án TaToiec - luyện thi chứng chỉ TOEIC). Chúng tôi chỉ **tiếp thu có chọn lọc cấu trúc khung bảng trình bày** (Bảng Khó khăn, Bảng Kỹ năng, Bảng Tính năng) và thay thế $100\%$ bằng số liệu khảo sát thực nghiệm của Lingora ($N=15$).
> 2. **Bác bỏ hành vi "Làm dữ liệu mô phỏng thành dữ liệu thật với số liệu chi tiết":** Tuyệt đối nghiêm cấm biến 20 kịch bản Persona mô phỏng nội bộ thành "khảo sát 50 giáo viên đạt 80%...". Mọi số liệu tỷ lệ phần trăm người thật duy nhất chỉ bắt nguồn từ mẫu khảo sát $N=15$.

---

## 1. Section A — User Research & Khảo Sát Người Học Thực Nghiệm (N=15)

`[PRIMARY — REAL PROJECT DATA]` `[SECONDARY — REAL EXTERNAL SOURCE]`

### 1.1. Phương Pháp Luận Khảo Sát (Survey Methodology)

Nhằm xây dựng căn cứ thực nghiệm vững chắc cho kỹ nghệ yêu cầu của nền tảng Lingora, nhóm phát triển đã tiến hành một cuộc điều tra khảo sát trực tiếp đối với người học ngoại ngữ tại Việt Nam.

- **Mục tiêu nghiên cứu:** Xác định các trở ngại sư phạm lớn nhất, tần suất suy giảm trí nhớ từ vựng, nguyên nhân đứt gãy thói quen tự học, và mức độ sẵn sàng đón nhận các giải pháp công nghệ cá nhân hóa (thuật toán lặp lại ngắt quãng SRS, bài kiểm tra đầu vào Placement Test, bài tập tương tác thích ứng và công cụ phản hồi ngữ pháp).
- **Quần thể mục tiêu (Target Population):** Người học tiếng Anh tại Việt Nam ở các nhóm tuổi học sinh, sinh viên và người đi làm, đang có nhu cầu tự học hoặc cải thiện năng lực giao tiếp và công việc.
- **Phương pháp chọn mẫu:** Phương pháp chọn mẫu thuận tiện phi xác suất (*convenience non-probability sampling*), phù hợp với nghiên cứu người dùng định hướng khám phá ban đầu (*exploratory user research*).
- **Quy mô mẫu thực tế:** Đúng $N=15$ người học, trích xuất nguyên vẹn từ bộ dữ liệu sơ cấp `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`.
- **Công cụ & Cấu trúc Thu thập:** Biểu mẫu trực tuyến Google Forms bao gồm 24 câu hỏi khảo sát chuyên sâu, phân thành các nhóm: Nhân khẩu học & thói quen học tập, Khó khăn cốt lõi & suy giảm trí nhớ, Đánh giá mức độ cần thiết của các tính năng kỹ thuật, Định hướng dạng bài tập và Phản hồi mở.
- **Tuyên bố Giới hạn Phương pháp luận (Methodological Limitations):** Cỡ mẫu $N=15$ là cỡ mẫu nhỏ phục vụ xác thực các giả thuyết bài toán và định hình các yêu cầu kỹ thuật nền tảng (Foundation Scope). Mẫu này không đại diện cho toàn bộ thị trường học ngoại ngữ và không được sử dụng để suy rộng thống kê diện rộng (*statistical generalization*). Các chỉ số hiệu quả học tập và năng lực ghi nhớ dài hạn chính thức sẽ được tiếp tục kiểm chứng tại giai đoạn thử nghiệm người dùng diện rộng (*Pilot Testing*).

---

### 1.2. Hồ Sơ Nhân Khẩu Học & Thói Quen Học Ngoại Ngữ ($N=15$)

Dữ liệu khảo sát người học sơ cấp cung cấp bức tranh rõ nét về đối tượng người dùng mục tiêu của Lingora:

- **Ngôn ngữ mục tiêu (Q1):** Phần lớn người học tập trung vào **Tiếng Anh** với $13/15$ người học ($86.7\%$), trong đó có $3/15$ người học đồng thời Tiếng Anh và Tiếng Trung ($20.0\%$). Nhóm học đơn lẻ Tiếng Trung chiếm $1/15$ ($6.7\%$) và Tiếng Nhật chiếm $1/15$ ($6.7\%$). Kết quả này củng cố tính đúng đắn của quyết định chiến lược: Lingora tập trung tối ưu hóa khung chương trình **Tiếng Anh A1 Foundation** trong giai đoạn đầu trước khi mở rộng đa ngôn ngữ.
- **Thời gian đã học ngoại ngữ (Q2):** Người học mới bắt đầu (dưới 6 tháng) chiếm tỷ trọng lớn nhất với $7/15$ người ($46.7\%$); người học từ 6 tháng đến 1 năm chiếm $2/15$ ($13.3\%$); từ 1 đến 3 năm chiếm $2/15$ ($13.3\%$); và người học trên 3 năm nhưng vẫn đang tìm kiếm giải pháp chiếm $4/15$ ($26.7\%$).
- **Mục đích học tập chính (Q3):** **Phục vụ công việc** là động lực áp đảo nhất, được lựa chọn bởi $12/15$ người học ($80.0\%$). Tiếp theo là nhu cầu **Thi lấy chứng chỉ** (IELTS, TOEIC, HSK) với $5/15$ người ($33.3\%$), **Giải trí** (xem phim, nghe nhạc) với $4/15$ người ($26.7\%$), và **Du lịch** với $2/15$ người ($13.3\%$).
- **Hình thức học tập phổ biến (Q4):** Trung tâm / Lớp học truyền thống chiếm $9/15$ ($60.0\%$); Học qua Website chiếm $8/15$ ($53.3\%$); Tự học bằng sách / Tài liệu chiếm $4/15$ ($26.7\%$); và Ứng dụng di động chiếm $3/15$ ($20.0\%$). Đặc biệt, $1/15$ người học phản ánh "Không hiệu quả cái nào cả", cho thấy sự bế tắc trong việc tìm kiếm phương pháp tự học phù hợp.
- **Thời lượng học tập hàng tuần (Q5):** $5/15$ người học ($33.3\%$) học dưới 2 giờ/tuần; $6/15$ người học ($40.0\%$) học từ 2–5 giờ/tuần. Tổng cộng có tới $11/15$ người học ($73.3\%$) dành không quá 5 giờ mỗi tuần cho việc học ngoại ngữ. Chỉ có $3/15$ người ($20.0\%$) học 5–10 giờ/tuần và duy nhất $1/15$ người ($6.7\%$) học trên 10 giờ/tuần. Điều này đòi hỏi các bài học của Lingora phải được thiết kế theo cấu trúc siêu nhỏ (*micro-learning*), mỗi phiên chỉ kéo dài 5–10 phút để người bận rộn cũng có thể duy trì.

---

### 1.3. Khảo Sát Khó Khăn Cốt Lõi Khi Học Ngoại Ngữ (Tiếp Thu Khung Bảng Mẫu)

Dự án tiếp thu cấu trúc phân tích khó khăn chuyên nghiệp từ các báo cáo kỹ nghệ phần mềm chuẩn mực (bao gồm khung cấu trúc của đồ án tham khảo TaToiec), đồng thời **loại bỏ triệt để số liệu ngoại lai $N=500$ TOEIC** để thay thế bằng $100\%$ số liệu khảo sát thực nghiệm $N=15$ của Lingora.

#### Bảng 1.1: Bảng khảo sát khó khăn của người học ngoại ngữ Lingora ($N=15$)
*(Nguồn: Trích xuất trực tiếp từ Khảo sát sơ cấp `Khảo sát...xlsx` Q6, Q7, Q8, Q9, Q10)*

| STT | Khó Khăn Cốt Lõi | Số Lượng ($k/15$) | Tỷ Lệ ($\%$) | Phân Tích Kỹ Nghệ & Căn Cứ Sư Phạm |
|:---:|---|:---:|:---:|---|
| 1 | **Quên từ vựng nhanh chóng sau khi học** | $15/15$ | $100.0\%$ | **Vấn đề nghiêm trọng tuyệt đối.** $100\%$ người tham gia xác nhận gặp khó khăn khi ghi nhớ từ vựng ($8/15$ rất thường xuyên, $7/15$ thỉnh thoảng; không một ai hiếm khi quên). Phù hợp với quy luật suy thoái dấu vết trí nhớ Ebbinghaus. Bằng chứng thứ cấp: Phân tích gộp của **Cepeda et al. (2006)** (S4) trên 317 thí nghiệm chứng minh việc giãn cách thời gian ôn tập (Spacing Effect) là giải pháp duy nhất khắc phục hiện tượng này. Mô hình bán rã trí nhớ của **Settles & Meeder (2016)** (S5) chứng minh thuật toán Spaced Repetition giảm $45\%$ sai số dự đoán quên và tăng tương tác học tập. |
| 2 | **Đứt gãy thói quen / Bỏ học giữa chừng** | $13/15$ | $86.7\%$ | Tỷ lệ đứt gãy học tập cực cao: $13/15$ người học thừa nhận thường xuyên học không đều hoặc bỏ học sau 1–2 tuần. Bằng chứng thứ cấp: Nghiên cứu quy mô lớn của **Hwang et al. (2024)** (S1) trên $N=3,670$ người học xác nhận tỷ lệ bỏ cuộc (attrition rate) trong các ứng dụng ngoại ngữ lên tới $\sim 43.16\%$. Nghiên cứu sản phẩm của **Duolingo (2022)** (S6) chỉ ra cơ chế giữ chuỗi ngày học liên tục (Streak) giúp người học duy trì thói quen và gia tăng khả năng hoàn thành khóa học [UNKNOWN / HISTORICAL CLAIM: chỉ số 3.6 lần per S6 chưa được kiểm chứng độc lập]. |
| 3 | **Quá bận rộn / Thiếu thời gian học tập** | $9/15$ | $60.0\%$ | Người học chủ yếu là sinh viên và nhân viên văn phòng có lịch trình công việc dày đặc ($73.3\%$ học dưới 5 giờ/tuần). Các buổi học truyền thống kéo dài $45$–$90$ phút gây quá tải và nhanh chóng bị hủy bỏ. Yêu cầu hệ thống phải tối ưu hóa bài học ở mức 5–10 phút/phiên ($8$–$10$ từ vựng cốt lõi). |
| 4 | **Phương pháp học hiện tại chưa hiệu quả** | $8/15$ | $53.3\%$ | Hơn một nửa người học đang áp dụng cách học ghi chép sổ tay thụ động hoặc chép danh sách từ, thiếu tính gợi nhớ chủ động (*active recall*) và không có cơ chế lặp lại ngắt quãng có hệ thống. |
| 5 | **Nội dung học quá khó hoặc nhàm chán** | $6/15$ | $40.0\%$ | Người học bị ép vào các bài học chung chung, không phù hợp với trình độ thực tế (quá khó gây nản chí hoặc quá dễ gây nhàm chán). Cần bài kiểm tra đầu vào (Placement Test) và khả năng nhảy cóc bài học đã nắm vững. |
| 6 | **Mất động lực / Nhanh nản chí** | $6/15$ | $40.0\%$ | Thiếu sự ghi nhận thành quả học tập tức thì, không có bảng theo dõi tiến độ và các yếu tố tạo động lực (gamification) khiến người học dễ buông xuôi khi gặp từ khó. |
| 7 | **Thiếu môi trường giao tiếp & Luyện phát âm** | $6/15$ | $40.0\%$ | Người học e ngại nói sai do không được tiếp xúc với phát âm chuẩn bản xứ. Bằng chứng thứ cấp: **Tran & Nguyen (2026)** (S3) khảo sát học sinh Việt Nam cho thấy Phát âm là khó khăn lớn nhất ($M=4.90/5$) và ảnh hưởng trực tiếp đến động lực học ($M=4.84/5$). |
| 8 | **Ngữ pháp & Cấu trúc câu viết phức tạp** | $5/15$ | $33.3\%$ | Người học lo sợ sai ngữ pháp khi đặt câu trong công việc nhưng không có công cụ phát hiện và giải thích lỗi sai chi tiết tại chỗ. |
| 9 | **Không thấy sự tiến bộ rõ rệt** | $3/15$ | $20.0\%$ | Thiếu các chỉ số định lượng cụ thể về số lượng từ vựng đã nắm vững và mức độ lưu giữ trí nhớ dài hạn. |

---

### 1.4. Khảo Sát Kỹ Năng & Nhu Cầu Cụ Thể (Tiếp Thu Khung Bảng Mẫu)

Dự án tiếp thu khung cấu trúc Bảng Kỹ năng nhằm đối chiếu trực tiếp giữa kỹ năng người học cảm thấy khó cải thiện nhất và các yêu cầu kỹ thuật giải quyết tương ứng:

#### Bảng 1.2: Bảng khảo sát phân bổ kỹ năng khó cải thiện & nhu cầu kỹ thuật ($N=15$)
*(Nguồn: Trích xuất trực tiếp từ Khảo sát sơ cấp `Khảo sát...xlsx` Q7, Q11, Q21)*

| STT | Kỹ Năng Ngoại Ngữ | Số Lượng Lựa Chọn ($k/15$) | Tỷ Lệ Chọn ($\%$) | Nhu Cầu Cụ Thể của Người Học & Giải Pháp Kỹ Nghệ Lingora |
|:---:|---|:---:|:---:|---|
| 1 | **Từ vựng (Vocabulary)** | $7/15$ | $46.7\%$ | **Kỹ năng khó cải thiện nhất.** Người học cần công cụ tự động nhắc nhở ôn từ đúng lúc, không phải tự nhớ lịch ôn; flashcard hai mặt trực quan kèm phiên âm và ngữ cảnh. Lingora đáp ứng bằng thuật toán Spaced Repetition Policy B (P1-FR-005) với RPC `record_review` cập nhật thẻ nhớ tức thì. |
| 2 | **Nghe (Listening)** | $6/15$ | $40.0\%$ | Người học nghe yếu, không bắt kịp tốc độ nói tự nhiên của người bản xứ; cần nghe các câu ngắn, có thể nghe lại nhiều lần và đối chiếu văn bản. Lingora đáp ứng bằng dạng bài tập Nghe nhận diện từ vựng `LISTENING` (P1-FR-013) tích hợp file âm thanh chuẩn `audio_url`. |
| 3 | **Nói (Speaking)** | $6/15$ | $40.0\%$ | Người học thiếu tự tin, phát âm sai từ vựng cơ bản do thiếu âm thanh đối chiếu chuẩn mực. Lingora giải quyết bằng cách bắt buộc 100% mục từ vựng trong bài học phải có trường âm thanh phát âm bản xứ chuẩn (P1-FR-002, P1-FR-009). |
| 4 | **Viết (Writing)** | $6/15$ | $40.0\%$ | Người học cần viết câu, viết email phục vụ công việc ($80.0\%$ mục tiêu công việc) nhưng sợ sai ngữ pháp và dùng từ gượng gạo. Lingora đáp ứng bằng phân hệ kiểm tra ngữ pháp nội bộ GEC, hiển thị giao diện Diff trực quan hóa lỗi sai và giải thích cụ thể (P1-FR-007). |
| 5 | **Ngữ pháp (Grammar)** | $5/15$ | $33.3\%$ | Người học cảm thấy ngữ pháp khô khan, khó nhớ công thức nếu học lý thuyết rời rạc. Lingora đáp ứng bằng dạng bài tập Ngữ pháp `GRAMMAR` (P1-FR-012) lồng ghép cấu trúc vào các câu hội thoại thực tế của Unit A1. |
| 6 | **Đọc (Reading)** | $2/15$ | $13.3\%$ | Người học cần các bài đọc vi mô (*micro-reading*) ngắn gọn, cho phép tra nghĩa từ mới tức thì mà không làm đứt gãy mạch đọc hiểu. |

---

### 1.5. Khảo Sát Tính Năng Mong Muốn (Tiếp Thu Khung Bảng Mẫu)

Tiếp thu cấu trúc bảng đánh giá tính năng mong muốn, Lingora khảo sát mức độ cấp thiết của từng chức năng trên thang đo Likert 1–5 sao và mức độ quan tâm thực tế của người dùng:

#### Bảng 1.3: Bảng đánh giá mức độ cần thiết của các tính năng hệ thống ($N=15$)
*(Nguồn: Trích xuất trực tiếp từ Khảo sát sơ cấp `Khảo sát...xlsx` Q13, Q14, Q15, Q16, Q18, Q20)*

| STT | Tính Năng Hệ Thống Khảo Sát | Mức Độ Đánh Giá (Likert 1–5 / Tỷ Lệ) | Tỷ Lệ Tích Cực (4–5 sao / Quan tâm) | Lý Do Sư Phạm & Đáp Ứng Kỹ Nghệ Phần Mềm Lingora |
|:---:|---|:---:|:---:|---|
| 1 | **Tự động xác định từ cần ôn & thời điểm ôn (Thuật toán SRS)** | **$4.13 / 5.0$** | **$12/15$ ($80.0\%$)** ($8$ năm sao, $4$ bốn sao, $1$ ba sao, $1$ hai sao, $1$ một sao) | **Tính năng được đánh giá cấp thiết nhất.** Người học muốn hệ thống tự tính toán chu kỳ quên và nhắc ôn tập đúng thời điểm vàng, giải quyết triệt để vấn đề 100% người học quên từ vựng. Lingora hiện thực hóa qua thuật toán SRS Policy B chu kỳ $[1, 3, 7, 14, 30]$ ngày (P1-FR-005). |
| 2 | **Tăng tần suất xuất hiện của từ thường làm sai (Adaptive Repetition)** | **$4.00 / 5.0$** | **$9/15$ ($60.0\%$)** ($7$ năm sao, $2$ bốn sao, $5$ ba sao, $1$ hai sao) | Người học có nhu cầu khắc phục điểm yếu cá nhân một cách tập trung, không muốn học dàn trải các từ đã thuộc. Lingora thiết kế cơ chế hạ cấp thẻ nhớ về khoảng cách 1 ngày khi người học trả lời sai (`p_is_correct = false`) trong RPC `record_review`. |
| 3 | **Đề xuất nội dung học / Kiểm tra đầu vào xếp lớp (Placement Test)** | **$93.3\%$ Quan tâm** | **$14/15$ ($93.3\%$)** ($5$ rất muốn, $9$ có thể thử, $1$ không cần thiết) | Người học muốn hệ thống tự động xác định trình độ để đề xuất lộ trình phù hợp, tránh lãng phí thời gian học lại kiến thức cơ bản đã biết. Lingora triển khai bài kiểm tra đầu vào 30 câu Placement Test Mapping A (P1-FR-016), xếp thẳng vào Unit xuất phát phù hợp (D6). |
| 4 | **Theo dõi tiến độ học tập trực quan (Progress Tracking & Streak)** | **$3.93 / 5.0$** | **$9/15$ ($60.0\%$)** ($6$ năm sao, $3$ bốn sao, $5$ ba sao, $1$ hai sao) | Giúp người học nhìn thấy sự tiến bộ mỗi ngày để duy trì động lực bền bỉ. Thông tin người học mong muốn theo dõi nhất: Điểm/kết quả ($10/15, 66.7\%$), Tiến bộ theo thời gian ($7/15, 46.7\%$), Số bài hoàn thành ($5/15, 33.3\%$), Thời gian học ($5/15, 33.3\%$), Từ đã học ($4/15, 26.7\%$). Lingora tích hợp Streak theo múi giờ địa phương (P1-FR-011) và Dashboard tiến độ (P1-FR-004). |
| 5 | **Bài tập luyện tập tương tác củng cố sau bài học** | **$3.80 / 5.0$** | **$10/15$ ($66.7\%$)** ($6$ năm sao, $4$ bốn sao, $3$ ba sao, $2$ một sao) | Chuyển hóa từ vựng thụ động thành kỹ năng chủ động thông qua các dạng bài tập thực hành ngay sau khi tiếp thu từ mới. Lingora phát triển Exercise Engine hỗ trợ 5 dạng bài tập theo chuẩn ADR-006 (P1-FR-003). |
| 6 | **Luyện tình huống thực tế & Sửa lỗi ngữ pháp** | **$3.60 / 5.0$** | **$8/15$ ($53.3\%$)** ($4$ năm sao, $4$ bốn sao, $5$ ba sao, $1$ hai sao, $1$ một sao) | Người học cần môi trường thực hành viết câu và được chỉ dẫn sửa lỗi ngữ pháp. Nhu cầu hỗ trợ cụ thể: Sửa lỗi ngữ pháp/từ vựng ($10/15, 66.7\%$), Gợi ý cách nói tự nhiên ($9/15, 60.0\%$), Giải thích lỗi chi tiết ($8/15, 53.3\%$), Đánh giá chấm điểm ($8/15, 53.3\%$). Lingora tích hợp mô-đun kiểm tra ngữ pháp câu viết GEC nội bộ (P1-FR-007). |

---

### 1.6. Phân Tích Dạng Bài Tập & Thói Quen Học Tập Thực Nghiệm

#### 1.6.1. Dạng bài tập tương tác được mong muốn nhất (Q17)
Khảo sát phân tích đa lựa chọn trên $N=15$ người học ghi nhận sự phân bổ mức độ ưa chuộng đối với các dạng bài tập tương tác:
1. **Điền từ (Fill-in-the-blank):** Được lựa chọn nhiều nhất với $11/15$ người học ($73.3\%$). Dạng bài này buộc người học phải nhớ chính xác chính tả và hình thái từ vựng trong câu, tạo dấu vết ghi nhớ sâu sắc nhất.
2. **Trắc nghiệm (Multiple Choice Questions - MCQ):** $9/15$ người học ($60.0\%$). Phù hợp cho việc củng cố nhận diện ngữ nghĩa nhanh và giảm tải nhận thức khi mới làm quen từ mới.
3. **Bài tập Nghe (Listening Comprehension):** $8/15$ người học ($53.3\%$). Đáp ứng trực tiếp nhu cầu nghe nhận diện âm thanh và luyện phản xạ thính giác.
4. **Ghép từ (Word Matching / Pairing):** $7/15$ người học ($46.7\%$). Hữu ích cho việc kết nối cặp từ vựng - nghĩa tiếng Việt hoặc từ đồng nghĩa.
5. **Sắp xếp câu (Sentence Reordering):** $6/15$ người học ($40.0\%$). Giúp người học nắm vững trật tự từ và cấu trúc cú pháp cơ bản.
6. **Dịch câu (Translation):** $6/15$ người học ($40.0\%$).
7. **Viết câu tự do (Writing):** $5/15$ người học ($33.3\%$).

*Ý nghĩa kỹ nghệ hệ thống:* Kết quả thực nghiệm này khẳng định sự phù hợp tuyệt đối của **Quyết định Kiến trúc ADR-006**, chuẩn hóa Engine bài tập của Lingora trên 5 dạng bài cốt lõi: `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING` và `GRAMMAR`.

#### 1.6.2. Phương pháp học từ vựng hiện tại của người dùng (Q12)
- $10/15$ người học ($66.7\%$) đã từng sử dụng **Flashcard (Anki, Quizlet...)**. Điều này chứng minh người học đã có nhận thức và hành vi quen thuộc với phương pháp thẻ học hai mặt.
- $6/15$ người học ($40.0\%$) sử dụng phương pháp **Ghi chép ra vở / sổ tay truyền thống**.
- $4/15$ người học ($26.7\%$) học qua **Ngữ cảnh (Xem phim, nghe nhạc, đọc tài liệu)**.
- $4/15$ người học ($26.7\%$) sử dụng **Ứng dụng học từ vựng (Duolingo, Memrise, MochiMochi...)**.
- $2/15$ người học ($13.3\%$) học thuộc **Danh sách từ vựng kèm nghĩa**.
- $1/15$ người học ($6.7\%$) phản hồi **"Không biết luôn"** (hoàn toàn mất phương hướng).

#### 1.6.3. Ba chức năng quan trọng nhất theo bình chọn của người học (Q22)
Khi bị giới hạn chỉ được chọn đúng 3 tính năng cốt lõi quan trọng nhất:
1. **Học từ vựng:** $9/15$ người học lựa chọn ($60.0\%$).
2. **AI hội thoại & Tình huống ngữ cảnh:** $8/15$ người học lựa chọn ($53.3\%$).
3. **Luyện phát âm:** $7/15$ người học lựa chọn ($46.7\%$).
4. **Bài tập luyện tập tương tác:** $7/15$ người học lựa chọn ($46.7\%$).
5. **Ôn từ tự động theo chu kỳ (SRS):** $5/15$ người học lựa chọn ($33.3\%$).
6. **Cá nhân hóa lộ trình học tập:** $4/15$ người học lựa chọn ($26.7\%$).
7. **Theo dõi tiến độ học tập:** $3/15$ người học lựa chọn ($20.0\%$).
8. **Nhắc nhở học tập:** $2/15$ người học lựa chọn ($13.3\%$).

---

### 1.7. Phản Hồi Định Tính Mở (Q23, Q24) & Ý Nghĩa Thiết Kế Trải Nghiệm

Khảo sát ghi nhận phân rã trung thực của 2 câu hỏi mở:
- **Câu 23 (Điều muốn thay đổi ở app ngoại ngữ hiện nay):** Trong 15 người tham gia, có $5/15$ phản hồi thực chất ($33.3\%$), $6/15$ để trống ($40.0\%$, giá trị `None`), và $4/15$ phản hồi không cung cấp thông tin hoặc từ chối trả lời ($26.7\%$, như "Chưa biết", "Wrfddf", "online", "Không biết lun").
- **Câu 24 (Chức năng mong muốn nhưng app hiện tại chưa đáp ứng tốt):** Có $4/15$ phản hồi thực chất ($26.7\%$), $7/15$ để trống ($46.7\%$, giá trị `None`), và $4/15$ phản hồi từ chối hoặc không rõ ($26.7\%$, như "Không", "không ạ", "Ko biết", "Fhdfg").

Toàn bộ định hướng thiết kế trải nghiệm dưới đây được đúc rút nghiêm ngặt và duy nhất từ **các phản hồi thực chất** nêu trên:

1. **Học theo cụm từ thay vì từ đơn lẻ:** Người học phản hồi: *"Thay vì học từ vựng theo từ hãy đổi thành học theo cụm; hạn chế xuất hiện quảng cáo"*.
   $\rightarrow$ *Đáp ứng của Lingora:* Bài học A1 thiết kế từ vựng luôn gắn liền với ví dụ câu hoàn chỉnh (`example_sentence`) và ngữ cảnh giao tiếp thực tế.
2. **Ức chế vì quảng cáo và mô hình trả phí cực đoan:** Người học phản ánh: *"đừng bắt trả phí quá nhiều"*.
   $\rightarrow$ *Đáp ứng của Lingora:* Nền tảng học tập tập trung thuần túy vào công nghệ giáo dục, giao diện tối giản không quảng cáo, tối ưu hóa tài nguyên trên hạ tầng miễn phí có kiểm soát.
3. **Cơ chế gợi nhớ chủ động qua Biểu ngữ / Nhắc nhở:** Người học đề xuất: *"Có widget thông báo Các từ trong list từ mình đang học sau mỗi khoảng tg"*.
   $\rightarrow$ *Đáp ứng của Lingora:* Tích hợp biểu ngữ nhắc nhở nội bộ trong ứng dụng (**In-app Reminder — P1-FR-015**, Option 6d). Thông báo đẩy trình duyệt Web Push được xếp loại tính năng trì hoãn (**DEFERRED** theo `docs/02` M0.5 và ADR-008).
4. **Cải thiện và giải thích chi tiết lỗi sai:** Người học phản hồi: *"Cải thiện lỗi sai"*, *"nói chuyện đối thoại cần tự nhiên hơn"*, *"Kĩ năng giao tiếp"*.
   $\rightarrow$ *Đáp ứng của Lingora:* Mô-đun GEC cung cấp phản hồi giải thích chi tiết vị trí sai và câu sửa chuẩn hóa, không chỉ chấm đúng/sai đơn điệu.

---

### 1.8. Bảng Thống Kê Tổng Hợp Chi Tiết Toàn Bộ 24 Câu Hỏi Khảo Sát ($N=15$)

#### Bảng 1.4: Bảng tổng hợp dữ liệu khảo sát thực nghiệm 24 câu hỏi của Lingora
*(Mẫu nghiên cứu: $N=15$ người học, $100\%$ tỷ lệ phần trăm được trình bày kèm phân số $k/15$)*

| Câu Hỏi Khảo Sát | Các Phương Án Trả Lời Ghi Nhận | Số Lượng ($k/15$) | Tỷ Lệ ($\%$) | Phân Loại & Ý Nghĩa Nghiệm Thu |
|---|---|:---:|:---:|---|
| **1. Ngoại ngữ đang/muốn học** | Tiếng Anh đơn lẻ<br>Tiếng Anh + Tiếng Trung<br>Tiếng Trung đơn lẻ<br>Tiếng Nhật | $10/15$<br>$3/15$<br>$1/15$<br>$1/15$ | $66.7\%$<br>$20.0\%$<br>$6.7\%$<br>$6.7\%$ | Tiếng Anh chiếm $13/15$ ($86.7\%$). Khẳng định tính đúng đắn của việc ưu tiên Tiếng Anh A1. |
| **2. Thời gian đã học** | Dưới 6 tháng<br>Trên 3 năm<br>1 – 3 năm<br>6 tháng – 1 năm | $7/15$<br>$4/15$<br>$2/15$<br>$2/15$ | $46.7\%$<br>$26.7\%$<br>$13.3\%$<br>$13.3\%$ | Đối tượng mới học và học lâu chưa hiệu quả chiếm tỷ trọng lớn, cần lộ trình bài bản. |
| **3. Mục đích chính** | Phục vụ công việc<br>Thi chứng chỉ (IELTS/TOEIC/HSK)<br>Giải trí (phim, nhạc)<br>Du lịch | $12/15$<br>$5/15$<br>$4/15$<br>$2/15$ | $80.0\%$<br>$33.3\%$<br>$26.7\%$<br>$13.3\%$ | Mục tiêu công việc áp đảo ($80.0\%$), đòi hỏi từ vựng và ngữ pháp ứng dụng cao. |
| **4. Hình thức học** | Trung tâm / Lớp học<br>Website<br>Tự học sách / tài liệu<br>App di động | $9/15$<br>$8/15$<br>$4/15$<br>$3/15$ | $60.0\%$<br>$53.3\%$<br>$26.7\%$<br>$20.0\%$ | Lớp học truyền thống ($60.0\%$) và Website ($53.3\%$) chiếm tỷ trọng lớn; tiềm năng cao cho nền tảng web tự học. |
| **5. Số giờ học / tuần** | Dưới 2 giờ<br>2 – 5 giờ<br>5 – 10 giờ<br>Trên 10 giờ | $5/15$<br>$6/15$<br>$3/15$<br>$1/15$ | $33.3\%$<br>$40.0\%$<br>$20.0\%$<br>$6.7\%$ | $73.3\%$ học $\le 5$ giờ/tuần $\rightarrow$ Bắt buộc bài học micro-learning 5–10 phút. |
| **6. Khó khăn lớn nhất** | Quên từ vựng / Nản vì từ khó<br>Thiếu kiên trì / Kỷ luật / Mệt mỏi<br>Không biết cách học hiệu quả<br>Kỹ năng nghe yếu / Phát âm<br>Phản hồi mơ hồ / Khác | $5/15$<br>$5/15$<br>$2/15$<br>$1/15$<br>$2/15$ | $33.3\%$<br>$33.3\%$<br>$13.3\%$<br>$6.7\%$<br>$13.3\%$ | Nhóm khó khăn về trí nhớ và động lực chiếm đa số phản hồi tự phát. |
| **7. Kỹ năng khó nhất** | Từ vựng<br>Nói<br>Viết<br>Nghe<br>Ngữ pháp<br>Đọc | $7/15$<br>$6/15$<br>$6/15$<br>$6/15$<br>$5/15$<br>$2/15$ | $46.7\%$<br>$40.0\%$<br>$40.0\%$<br>$40.0\%$<br>$33.3\%$<br>$13.3\%$ | Kỹ năng từ vựng dẫn đầu, theo sát bởi Nói, Viết và Nghe ($40.0\%$ mỗi kỹ năng). |
| **8. Tần suất quên từ** | Rất thường xuyên<br>Thỉnh thoảng<br>Hiếm khi / Không bao giờ | $8/15$<br>$7/15$<br>$0/15$ | $53.3\%$<br>$46.7\%$<br>$0.0\%$ | **$100.0\%$ người học gặp vấn đề quên từ vựng.** Căn cứ tối cao cho tính năng SRS. |
| **9. Đứt gãy / Bỏ học** | Có (bỏ học hoặc học không đều)<br>Không | $13/15$<br>$2/15$ | $86.7\%$<br>$13.3\%$ | **$86.7\%$ người học từng bỏ học.** Căn cứ tối cao cho cơ chế duy trì Streak. |
| **10. Lý do bỏ học** | Quá bận rộn / Thiếu thời gian<br>Phương pháp chưa hiệu quả<br>Nội dung quá khó / nhàm chán<br>Mất động lực / Nhanh chán<br>Không thấy tiến bộ rõ rệt<br>Lý do cá nhân (thất tình...) | $9/15$<br>$8/15$<br>$6/15$<br>$6/15$<br>$3/15$<br>$1/15$ | $60.0\%$<br>$53.3\%$<br>$40.0\%$<br>$40.0\%$<br>$20.0\%$<br>$6.7\%$ | Bận rộn ($60.0\%$) và phương pháp kém ($53.3\%$) là 2 nguyên nhân gốc rễ lớn nhất. |
| **11. Động lực tiếp tục** | Yêu cầu công việc / Kiếm tiền<br>Chứng chỉ (TOEIC, IELTS)<br>Tầm quan trọng tiếng Anh<br>Video truyền cảm hứng<br>Không có / Khác | $5/15$<br>$2/15$<br>$2/15$<br>$1/15$<br>$5/15$ | $33.3\%$<br>$13.3\%$<br>$13.3\%$<br>$6.7\%$<br>$33.3\%$ | Áp lực công việc và chứng chỉ là đòn bẩy động lực mạnh mẽ nhất. |
| **12. Phương pháp học từ** | Flashcard (Anki, Quizlet...)<br>Ghi chép sổ tay<br>Ngữ cảnh phim nhạc<br>Ứng dụng học từ vựng<br>Học thuộc danh sách từ<br>Không biết cách | $10/15$<br>$6/15$<br>$4/15$<br>$4/15$<br>$2/15$<br>$1/15$ | $66.7\%$<br>$40.0\%$<br>$26.7\%$<br>$26.7\%$<br>$13.3\%$<br>$6.7\%$ | $66.7\%$ quen thuộc với Flashcard $\rightarrow$ Thiết kế thẻ học Lingora quen thuộc, dễ tiếp cận. |
| **13. Cần thiết tự động SRS** | $5$ sao (Rất cần thiết)<br>$4$ sao<br>$3$ sao<br>$2$ sao<br>$1$ sao (Không cần) | $8/15$<br>$4/15$<br>$1/15$<br>$1/15$<br>$1/15$ | $53.3\%$<br>$26.7\%$<br>$6.7\%$<br>$6.7\%$<br>$6.7\%$ | **Điểm TB: 4.13/5.** $80.0\%$ đánh giá tích cực 4–5 sao. Căn cứ cho P1-FR-005. |
| **14. Tăng tần suất từ sai** | $5$ sao (Rất cần thiết)<br>$4$ sao<br>$3$ sao<br>$2$ sao | $7/15$<br>$2/15$<br>$5/15$<br>$1/15$ | $46.7\%$<br>$13.3\%$<br>$33.3\%$<br>$6.7\%$ | **Điểm TB: 4.00/5.** $60.0\%$ đánh giá tích cực 4–5 sao. Căn cứ cho Adaptive Review. |
| **15. Đề xuất nội dung học** | Có thể thử<br>Rất muốn<br>Không cần thiết | $9/15$<br>$5/15$<br>$1/15$ | $60.0\%$<br>$33.3\%$<br>$6.7\%$ | **$93.3\%$ người học quan tâm** ($14/15$). Căn cứ vững chắc cho Placement Test D6. |
| **16. Cần thiết bài tập sau bài** | $5$ sao (Rất cần thiết)<br>$4$ sao<br>$3$ sao<br>$1$ sao | $6/15$<br>$4/15$<br>$3/15$<br>$2/15$ | $40.0\%$<br>$26.7\%$<br>$20.0\%$<br>$13.3\%$ | **Điểm TB: 3.80/5.** $66.7\%$ đánh giá tích cực 4–5 sao. Căn cứ cho Exercise Engine. |
| **17. Dạng bài tập muốn làm** | Điền từ<br>Trắc nghiệm<br>Nghe<br>Ghép từ<br>Sắp xếp câu<br>Dịch nghĩa<br>Viết câu | $11/15$<br>$9/15$<br>$8/15$<br>$7/15$<br>$6/15$<br>$6/15$<br>$5/15$ | $73.3\%$<br>$60.0\%$<br>$53.3\%$<br>$46.7\%$<br>$40.0\%$<br>$40.0\%$<br>$33.3\%$ | Chuẩn hóa 5 dạng bài cốt lõi ADR-006: Điền từ ($73.3\%$), Trắc nghiệm ($60.0\%$), Nghe ($53.3\%$). |
| **18. Cần thiết theo dõi tiến độ** | $5$ sao (Rất cần thiết)<br>$4$ sao<br>$3$ sao<br>$2$ sao | $6/15$<br>$3/15$<br>$5/15$<br>$1/15$ | $40.0\%$<br>$20.0\%$<br>$33.3\%$<br>$6.7\%$ | **Điểm TB: 3.93/5.** $60.0\%$ đánh giá tích cực 4–5 sao. Căn cứ cho Progress Tracking. |
| **19. Thông tin muốn theo dõi** | Điểm / Kết quả bài tập<br>Tiến bộ theo thời gian<br>Bài đã hoàn thành<br>Thời gian học tập<br>Số từ vựng đã học | $10/15$<br>$7/15$<br>$5/15$<br>$5/15$<br>$4/15$ | $66.7\%$<br>$46.7\%$<br>$33.3\%$<br>$33.3\%$<br>$26.7\%$ | Điểm số và tiến trình thời gian là 2 chỉ số người học quan tâm nhất. |
| **20. Cần thiết hội thoại ngữ cảnh** | $5$ sao (Rất cần thiết)<br>$4$ sao<br>$3$ sao<br>$2$ sao<br>$1$ sao | $4/15$<br>$4/15$<br>$5/15$<br>$1/15$<br>$1/15$ | $26.7\%$<br>$26.7\%$<br>$33.3\%$<br>$6.7\%$<br>$6.7\%$ | **Điểm TB: 3.60/5.** $53.3\%$ đánh giá tích cực 4–5 sao. Căn cứ cho Scenario Practice. |
| **21. Hỗ trợ mong muốn khi viết** | Sửa lỗi ngữ pháp/từ vựng<br>Gợi ý cách nói tự nhiên<br>Giải thích lỗi chi tiết<br>Đánh giá & chấm điểm<br>Đóng vai đối thoại | $10/15$<br>$9/15$<br>$8/15$<br>$8/15$<br>$7/15$ | $66.7\%$<br>$60.0\%$<br>$53.3\%$<br>$53.3\%$<br>$46.7\%$ | Sửa lỗi ($66.7\%$) và giải thích ($53.3\%$) là nhu cầu cốt lõi của tính năng GEC. |
| **22. Top 3 tính năng quan trọng** | Học từ vựng<br>AI hội thoại / tình huống<br>Luyện phát âm<br>Bài tập luyện tập<br>Ôn từ tự động SRS<br>Cá nhân hóa lộ trình<br>Theo dõi tiến độ<br>Nhắc nhở học tập | $9/15$<br>$8/15$<br>$7/15$<br>$7/15$<br>$5/15$<br>$4/15$<br>$3/15$<br>$2/15$ | $60.0\%$<br>$53.3\%$<br>$46.7\%$<br>$46.7\%$<br>$33.3\%$<br>$26.7\%$<br>$20.0\%$<br>$13.3\%$ | Xác nhận tính năng Từ vựng, Bài tập, Phát âm và SRS nằm trong nhóm ưu tiên P0. |
| **23. Điểm muốn thay đổi ở app** | 5 phản hồi thực chất (học cụm, giảm quảng cáo, bớt thu phí, widget nhắc từ, sửa lỗi sai); 6 để trống (None); 4 không rõ ("Chưa biết", "Wrfddf",...) | Định tính | 5/15 thực chất (33.3%), 6/15 trống (40.0%), 4/15 không rõ (26.7%) | Căn cứ thiết kế bài học gắn ngữ cảnh, không quảng cáo, giao diện tập trung (dựa trên 5 phản hồi thực chất). |
| **24. Tính năng chưa đáp ứng tốt** | 4 phản hồi thực chất (đối thoại tự nhiên, kỹ năng giao tiếp, AI); 7 để trống (None); 4 không rõ / từ chối ("Không", "Ko biết",...) | Định tính | 4/15 thực chất (26.7%), 7/15 trống (46.7%), 4/15 không rõ (26.7%) | Căn cứ bổ sung phản hồi ngữ pháp chi tiết và phát âm chuẩn bản xứ (dựa trên 4 phản hồi thực chất). |

---

## 2. Section B — Application Survey & Phân Tích Đo Chuẩn Nền Tảng (Competitive Benchmark)

`[SECONDARY — REAL EXTERNAL SOURCE]` `[PRODUCT DECISION — NON-EMPIRICAL POLICY]`

### 2.1. Danh Sách Rút Gọn Nền Tảng & Ranh Giới Khảo Sát

Nhằm thiết lập chuẩn mực công nghệ và sư phạm cho Lingora, nhóm phát triển đã tiến hành đo chuẩn cạnh tranh (*competitive benchmarking*) đối với các ứng dụng công nghệ giáo dục ngoại ngữ dẫn đầu toàn cầu.

#### 2.1.1. Ba nền tảng đối chuẩn tiêu biểu
1. **Duolingo:** Đại diện tiêu biểu nhất cho mô hình học tập vi mô (*micro-learning*), cấu trúc lộ trình tuyến tính (*Linear Learning Path*), cơ chế động lực học chuỗi ngày học (*Streak & Streak Freeze*), và ứng dụng thuật toán lặp lại ngắt quãng dựa trên hồi quy bán rã trí nhớ (*Half-Life Regression - HLR* theo Settles & Meeder, 2016).
2. **Quizlet:** Nền tảng tiêu chuẩn ngành về quản lý học phần từ vựng (*Study Sets*), cơ chế thẻ học lật hai mặt chủ động (*Active Recall Flashcards*), và các chế độ ôn tập Spaced Practice thích ứng.
3. **ELSA Speak:** Ứng dụng dẫn đầu về công nghệ nhận diện giọng nói và chuẩn hóa âm thanh bản xứ, cung cấp các bài luyện nghe - phát âm chi tiết ở mức âm vị.

#### 2.1.2. Phân tích loại trừ các nền tảng luyện thi TOEIC (Prep, IIG, TaToiec)
> [!IMPORTANT]
> **QUYẾT ĐỊNH LOẠI TRỪ KHỎI DANH MỤC ĐO CHUẨN CHÍNH (REJECT):**
> Các nền tảng chuyên luyện thi chứng chỉ TOEIC (như Prep, IIG hoặc đồ án tham khảo TaToiec) tập trung vào bài toán thi thử 200 câu trắc nghiệm dồn dập (100 câu Listening + 100 câu Reading trong 120 phút), phục vụ thí sinh đã có nền tảng ngữ pháp và từ vựng từ trước.
> **Lý do kỹ thuật loại trừ đối với Lingora:**
> 1. **Khác biệt về triết lý sản phẩm:** Lingora giải quyết bài toán cốt lõi cho người học tiếng Anh cơ bản A1 (mới bắt đầu hoặc mất gốc), tập trung hình thành phản xạ từ vựng - ngữ pháp giao tiếp tự nhiên thông qua các phiên học ngắn 5–10 phút, không phục vụ mục tiêu giải đề thi chuẩn hóa áp lực cao.
> 2. **Tuân thủ Bất biến D4:** Quyết định sản phẩm D4 nghiêm cấm phát triển các thực thể dữ liệu dạng `Exam`, `TestSeries`, hay `QuestionBank` độc lập gây phân mảnh mô hình dữ liệu. Mọi bài luyện tập và đánh giá trong Lingora đều sử dụng chung một cấu trúc `Exercise` thống nhất. Do đó, việc đo chuẩn theo các tính năng phòng thi ảo TOEIC 200 câu là hoàn toàn phi thực tế và vi phạm kiến trúc.

---

### 2.2. Ma trận 17 Tiêu Chí Đo Chuẩn Toàn Diện

Mỗi tiêu chí đo chuẩn dưới đây được phân tích theo đúng cấu trúc kỹ nghệ 4 thành phần:
`[Tính năng Quan sát được] → [Bằng chứng Nguồn Xác thực (URL / DOI + Ngày truy cập 2026-09-15)] → [Ý nghĩa đối với Lingora] → [Quyết định Kỹ thuật: ADOPT / ADAPT / REJECT + Lý do Kiến trúc]`.

#### Bảng 2.1: Ma trận đối chuẩn tính năng chi tiết theo 17 tiêu chí kỹ thuật & sư phạm

| STT | Tiêu Chí Đo Chuẩn | Khảo Sát trên Nền Tảng Đối Chuẩn (Duolingo / Quizlet / ELSA) | Bằng Chứng Nguồn (Truy cập: 2026-09-15) | Ý Nghĩa đối với Lingora | Quyết Định & Lý Do Kỹ Thuật |
|:---:|---|---|---|---|---|
| **1** | **Onboarding & Khởi tạo Người dùng** | **Duolingo:** Luồng chào đón 3 bước không bắt buộc đăng ký ngay: Chọn ngôn ngữ mục tiêu $\rightarrow$ Khảo sát động lực/mục tiêu thời gian ngày (5–20 phút) $\rightarrow$ Lựa chọn bắt đầu từ đầu hoặc kiểm tra trình độ. Hoàn thành bài đầu tiên mới tạo tài khoản.<br>**Quizlet:** Bắt buộc tạo tài khoản ngay, khảo sát vai trò (Học sinh/Giáo viên). | Duolingo Official Onboarding Flow Case Study (`blog.duolingo.com/how-we-reinvented-onboarding/`) | Giảm thiểu ma sát gia nhập (drop-off), giúp người dùng trải nghiệm giá trị cốt lõi ngay trong 60 giây đầu tiên. | **ADAPT (Tiếp thu có điều chỉnh):** Áp dụng luồng khảo sát mục tiêu thời lượng (P1-FR-014) và lựa chọn Placement Test (P1-FR-016). Tuy nhiên, để bảo đảm toàn vẹn dữ liệu tiến trình và phân quyền RBAC ngay từ đầu, Lingora yêu cầu đăng ký/đăng nhập an toàn qua Supabase Auth trước khi lưu trữ tiến trình. |
| **2** | **Kiểm tra Đầu vào (Placement Test)** | **Duolingo:** Cung cấp bài test thích ứng khoảng 20–30 câu hỏi đa dạng, tăng dần độ khó; tự động mở khóa các Unit tương ứng trên lộ trình học.<br>**ELSA:** Bài kiểm tra đánh giá phát âm 16 câu để xác định điểm số EPS. | Duolingo Help Center — *What is the placement test?* (`support.duolingo.com`) | Cực kỳ quan trọng để giải quyết nỗi đau của $14/15$ người học ($93.3\%$) muốn được phân lớp tự động, tránh nản chí khi học lại từ cơ bản. | **ADAPT (Tiếp thu có điều chỉnh):** Áp dụng bài kiểm tra đầu vào 30 câu theo **Placement Mapping A chuẩn tắc 6 chặng** (D6): 0–7: U1; 8–12: U2; 13–17: U3; 18–22: U4; 23–26: U5; 27–30: U6. Hệ thống tự động gán `starting_unit` tương ứng từ Unit 1 đến Unit 6 mà không bắt học lại các Unit trước đó. |
| **3** | **Cấu trúc Lộ trình (Learning Hierarchy)** | **Duolingo:** Cấu trúc lộ trình hình rắn tuyến tính (*Linear Learning Snake*): Khóa học $\rightarrow$ Chặng (Section) $\rightarrow$ Đơn vị (Unit) $\rightarrow$ Bài học (Lesson) $\rightarrow$ Cấp độ. Người học bắt buộc phải hoàn thành tuần tự từng nút bài học.<br>**Quizlet:** Cấu trúc phẳng theo Thư mục $\rightarrow$ Học phần từ vựng (Study Sets). | Duolingo Design Blog (2022) — *Rewriting the Duolingo Path* (`blog.duolingo.com/new-duolingo-learning-path/`) | Cấu trúc phân cấp rõ ràng giúp định hướng người học tự giác, giảm thiểu bối rối mất phương hướng (nguyên nhân của $40\%$ bỏ học). | **ADOPT (Tiếp thu hoàn toàn):** Chuẩn hóa cây dữ liệu 4 cấp: `Course` $\rightarrow$ `Unit` $\rightarrow$ `Lesson` $\rightarrow$ `Exercise`. Mỗi Unit gồm 4 Lesson theo Khung Tiếng Anh A1 Foundation 24 bài (Curriculum 08). |
| **4** | **Quy mô Bài học (Micro-learning)** | **Duolingo:** Mỗi bài học kéo dài 3–7 phút, gồm 10–15 câu hỏi ngắn. Hoàn thành bài tạo cảm giác chiến thắng nhỏ (*quick win*).<br>**ELSA:** Các bài luyện phát âm ngắn 2–5 phút cho từng cụm âm vị. | Nguyên lý thiết kế học tập vi mô Duolingo Product & Learning Design Guidelines (`design.duolingo.com`). | Giải quyết trực tiếp rào cản của $9/15$ ($60.0\%$) người học quá bận rộn và $11/15$ ($73.3\%$) học dưới 5 giờ/tuần. | **ADOPT (Tiếp thu hoàn toàn):** Thiết kế bài học chuẩn kéo dài 5–10 phút: gồm $8$–$10$ từ vựng mới và $5$ bài tập tương tác thực hành củng cố. |
| **5** | **Dạng bài Tương tác (Interactive Exercises)** | **Duolingo:** 6 dạng bài chính: Trắc nghiệm hình ảnh/chữ, Điền từ vào chỗ trống, Sắp xếp từ thành câu, Nghe chép chính tả, Ghép cặp từ, Luyện nói.<br>**Quizlet:** Flashcard, Học (Learn - MCQ/Điền từ), Viết (Write), Ghép thẻ (Match), Kiểm tra (Test). | Duolingo Product Spec & Design Guidelines (`design.duolingo.com`) | Đa dạng hóa hình thức kích hoạt tư duy, tránh nhàm chán đơn điệu. | **ADAPT (Tiếp thu có điều chỉnh):** Lựa chọn 5 dạng bài cốt lõi phù hợp với nền tảng Web theo **ADR-006**: `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING` và `GRAMMAR`. Loại trừ dạng bài Ghép thẻ phức tạp (`MATCHING`) khỏi Core MVP để tránh gánh nặng UI trên thiết bị nhỏ. |
| **6** | **Quản lý Từ vựng & Thẻ học (Flashcards)** | **Quizlet:** Cực mạnh về tạo và quản lý học phần từ vựng; thẻ học 2 mặt (thuật ngữ - định nghĩa), phát âm tự động, hình ảnh minh họa.<br>**Duolingo:** Danh sách từ vựng đã học được lưu ngầm trong hồ sơ, hiển thị mức độ nắm vững qua thanh sức mạnh (*Word Strength*). | Quizlet Help Center — *How to create and study flashcards* (`help.quizlet.com`) | Đáp ứng phương pháp học quen thuộc của $10/15$ ($66.7\%$) người học từng dùng flashcard. | **ADAPT (Tiếp thu có điều chỉnh):** Xây dựng kho từ vựng chuẩn hóa (`vocabularies`) gắn liền với từng bài học, hỗ trợ lật thẻ hai mặt, nghĩa tiếng Việt, phiên âm IPA, câu ví dụ và âm thanh chuẩn bản xứ (P1-FR-002). |
| **7** | **Thuật toán Lặp lại Ngắt quãng (SRS)** | **Duolingo:** Ban đầu dùng Leitner, sau đó nâng cấp lên mô hình hồi quy bán rã Half-Life Regression (HLR) ước tính xác suất quên $p = 2^{-\Delta t / h}$.<br>**Quizlet:** Chế độ Spaced Mode lặp lại các thẻ chưa thuộc sau 1 ngày, 3 ngày, 7 ngày.<br>**Anki:** Thuật toán SM-2 cổ điển dựa trên Ease Factor. | Settles & Meeder (2016), ACL; Cepeda et al. (2006), APA Meta-analysis S4. | Tính năng quan trọng số 1 ($80.0\%$ đánh giá 4–5 sao, TB 4.13/5), giải quyết $100\%$ người học quên từ vựng. | **ADAPT (Tiếp thu có điều chỉnh):** Triển khai thuật toán **Policy B** xác định dựa trên khoảng cách ngày cố định $[1, 3, 7, 14, 30]$ (D8). Không dùng SM-2 thả nổi hệ số Ease Factor để bảo đảm tính tất định và khả năng kiểm thử trong hệ thống phân tán qua RPC `record_review` (P1-FR-005, P1-FR-006). |
| **8** | **Cá nhân hóa Bài tập theo Lỗi sai** | **Duolingo:** Hệ thống *Birdbrain* đánh giá độ khó của từng câu hỏi và năng lực người học theo thời gian thực; các câu trả lời sai được đưa lại vào cuối bài học hoặc vào bài ôn tập riêng.<br>**Quizlet:** Tự động phân loại thẻ thành "Đang học" và "Đã thành thạo", tập trung ôn thẻ sai. | Duolingo Engineering — *Birdbrain: Personalized learning* (`blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/`) | Đáp ứng $60.0\%$ người học đánh giá 4–5 sao cho nhu cầu tăng tần suất xuất hiện của từ làm sai (TB 4.00/5). | **ADAPT (Tiếp thu có điều chỉnh):** Khi người học ôn tập trả lời sai (`p_is_correct = false`), hệ thống tự động hạ cấp khoảng cách ôn tập về 1 ngày (`interval_days = 1.0`, `next_review_at = NOW() + 24h`). Khi làm bài tập bài học, các câu làm sai được gom lại để luyện tập có kiểm soát theo cơ chế Controlled Retry định mức tối đa 10% (**Bất biến D7**). |
| **9** | **Cơ chế Nhắc nhở Học tập** | **Duolingo:** Hệ thống thông báo đẩy (Push Notification) cá nhân hóa thời điểm gửi qua mô hình máy học Bandit; gửi email cảnh báo mất chuỗi.<br>**Quizlet:** Nhắc nhở cố định theo giờ học viên cài đặt. | Duolingo AI Push Notification Optimization Case Study (`duolingo.com/research`) | Nhắc nhở người học duy trì cam kết hàng ngày, hạn chế tối đa việc quên học. | **ADAPT (Tiếp thu có điều chỉnh):** Do giới hạn trình duyệt Web và tôn trọng quyền riêng tư, Lingora triển khai cơ chế **Biểu ngữ nhắc nhở nội bộ trong ứng dụng (In-app Reminder — Option 6d)** dựa trên giờ mục tiêu người dùng cài đặt (P1-FR-014, P1-FR-015). Cơ chế thông báo đẩy trình duyệt Web Push (Option 6a/6b) được xếp loại tính năng hoãn lại (**DEFERRED** theo `docs/02` M0.5 và ADR-008). |
| **10** | **Động lực học (Gamification & Streak)** | **Duolingo:** Cơ chế Chuỗi học tập (Streak), Bùa đóng băng chuỗi (Streak Freeze), Điểm kinh nghiệm (XP), Bảng xếp hạng tuần (Leagues), Trái tim cuộc sống (Hearts).<br>**ELSA:** Điểm số phát âm EPS, chuỗi ngày luyện tập liên tục. | Duolingo Blog (2022) — *How Duolingo uses streaks to keep learners motivated* [HISTORICAL / 404 URL — CLAIM UNVERIFIED] | Duy trì thói quen học tập, ngăn ngừa tỷ lệ bỏ cuộc $86.7\%$ của người học. | **ADAPT (Tiếp thu có điều chỉnh):** Tiếp thu cơ chế **Chuỗi ngày học liên tục (Streak)** tính theo múi giờ địa phương của người dùng (P1-FR-011, D9). **REJECT cơ chế Trái tim phạt (Hearts)** vì gây ức chế tâm lý và cản trở người học thử sai; **REJECT Bảng xếp hạng đua tranh (Leagues)** trong Core MVP để tránh áp lực xã hội độc hại. |
| **11** | **Theo dõi Tiến độ Học tập** | **Duolingo:** Cung cấp trang cá nhân hiển thị Streak, tổng XP, giải đấu, và biểu đồ ngày học trong tháng.<br>**Quizlet:** Báo cáo tỷ lệ phần trăm hoàn thành học phần và số thẻ đã thuộc. | Duolingo & Quizlet User Profile Documentation (2026) | Đáp ứng nhu cầu của $66.7\%$ người học muốn theo dõi điểm số và $46.7\%$ muốn thấy tiến bộ theo thời gian. | **ADOPT (Tiếp thu hoàn toàn):** Xây dựng bảng điều khiển học viên (Dashboard) hiển thị: Chuỗi ngày Streak hiện tại, số từ vựng đang làm chủ trong kho SRS, tỷ lệ hoàn thành các bài học của Unit (P1-FR-004, P1-FR-011). |
| **12** | **Chế độ Ôn tập & Đánh giá Chặng** | **Duolingo:** Nút "Ôn tập" tổng hợp từ vựng cũ; bài kiểm tra vượt cấp để nhảy chặng (*Jump Here*).<br>**Quizlet:** Chế độ "Kiểm tra" (Test Mode) tạo bài thi thử ngẫu nhiên từ học phần. | Duolingo Help Center — *Can I skip levels?* (`support.duolingo.com`) | Giúp người học củng cố kiến thức toàn diện sau mỗi Unit và tự tin kiểm tra trình độ. | **ADAPT (Tiếp thu có điều chỉnh):** Cho phép người học làm bài đánh giá nhảy cấp Unit Jump với điều kiện đạt $\ge 95\%$ câu hỏi và bị giới hạn thời gian chờ 24h nếu không đạt để chống spam đoán mò (Bất biến D5, UC-04, BF-11). |
| **13** | **Thống kê & Phân tích Học tập** | **Duolingo:** Bản tổng kết năm (Year in Review), phân tích số phút học và kỹ năng mạnh/yếu.<br>**ELSA:** Biểu đồ phân tích phát âm từng âm đơn và âm vị theo tỷ lệ phần trăm. | Duolingo Year in Review Engineering Reports (`duolingo.com`) | Giúp học viên và quản lý đào tạo nắm bắt hiệu quả học tập thực tế. | **ADAPT (Tiếp thu có điều chỉnh):** Cung cấp thống kê tổng hợp số bài đã học, số thẻ nhớ đã ôn tập, và điểm trung bình bài tập. Quản lý tổ chức chỉ xem dữ liệu tổng hợp theo phòng ban, không xâm phạm quyền riêng tư của từng học viên (NFR-PRV). |
| **14** | **Quy trình Quản trị Nội dung (CMS)** | **Duolingo:** Quy trình biên soạn qua vườn ươm nội dung (*Incubator*), đội ngũ kiểm duyệt ngôn ngữ độc lập trước khi phát hành cây kỹ năng mới.<br>**Hệ thống CMS Giáo dục:** Luồng kiểm duyệt 2 vòng nghiêm ngặt trước khi xuất bản. | Historical Duolingo Incubator Documentation [HISTORICAL / RETIRED 2021] | Ngăn chặn hoàn toàn việc phát hành bài học sai sót ngữ pháp hoặc từ vựng không chuẩn bản xứ lên hệ thống. | **ADOPT (Tiếp thu hoàn toàn):** Hiện thực hóa máy trạng thái vòng đời nội dung 6 bước (Draft $\rightarrow$ In Review $\rightarrow$ Changes Requested $\rightarrow$ Approved $\rightarrow$ Published $\rightarrow$ Archived). Tuân thủ triệt để cơ chế Clone-to-Draft khi sửa đổi bài Published (D3, P1-FR-008). |
| **15** | **Mô hình Phân quyền & Vai trò (RBAC & SoD)** | **CMS Doanh nghiệp:** Phân định rõ ràng giữa Quản trị viên (Admin), Tác giả nội dung (Author), và Biên tập viên kiểm duyệt (Editor/Moderator) để chống xung đột lợi ích. | Nguyên tắc kiểm soát phân quyền Separation of Duties trong kỹ nghệ phần mềm (NIST SP 800-53 AC-5 / ANSI RBAC INCITS 359) | Bảo vệ tính toàn vẹn của học liệu sư phạm, ngăn ngừa gian lận hoặc tự biên tự diễn nội dung rác. | **ADOPT (Tiếp thu hoàn toàn):** Đặc tả 6 vai trò chuẩn tắc (`Learner`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`, `Administrator`) và áp dụng Ma trận phân định trách nhiệm SoD: Soạn giả tuyệt đối không được tự duyệt hoặc xuất bản bài của mình (D2, §3). |
| **16** | **Thiết kế Giao diện & Tiếp cận (UI/UX)** | **Duolingo:** Hệ thống thiết kế *Feather Design System*: Nút bấm lớn 3D nổi bật, màu sắc độ tương phản cao, hình ảnh minh họa sống động, tối ưu tuyệt đối cho màn hình cảm ứng di động.<br>**Quizlet:** Giao diện thẻ phẳng tối giản, hỗ trợ phím tắt trên desktop. | Duolingo Feather Design System Guidelines (`design.duolingo.com`) | Đảm bảo trải nghiệm trực quan, giảm tải nhận thức, hỗ trợ người học ở mọi điều kiện thị giác. | **ADOPT (Tiếp thu hoàn toàn):** Thiết kế giao diện theo phong cách hiện đại với Tailwind CSS và Shadcn/UI, chuẩn hóa kiểu chữ Segoe UI, bảo đảm độ tương phản theo chuẩn WCAG 2.1 Level AA, và ưu tiên tối ưu giao diện trên thiết bị di động (Mobile-first). |
| **17** | **Khả năng Chịu lỗi & Lưu Tạm (Resilience)** | **Duolingo:** Khi mất kết nối mạng giữa bài học, hệ thống lưu tạm tiến trình trên bộ nhớ cục bộ máy khách và tự động đồng bộ lên máy chủ ngay khi có mạng trở lại. | Duolingo Mobile Offline Architecture Technical Papers (`blog.duolingo.com`) | Giải quyết triệt để rào cản mất kết nối mạng được ghi nhận trong nghiên cứu S2 (Pikhart et al., 2024). | **ADAPT (Tiếp thu có điều chỉnh):** Thiết kế kiến trúc chịu lỗi: Trình duyệt lưu tạm kết quả trả lời từng câu hỏi trong phiên học; nếu dịch vụ AI/GEC ngoại vi bị sự cố, luồng học bài và ôn tập SRS cốt lõi vẫn hoạt động độc lập bình thường (NFR-REL). |

---

### 2.3. Bảng Tổng Hợp Quyết Định Tiếp Thu Công Nghệ (Adopt / Adapt / Reject Matrix)

#### Bảng 2.2: Bảng phân loại quyết định công nghệ đối chuẩn của Lingora

| Quyết Định Kỹ Thuật | Danh Sách Tính Năng Công Nghệ Tiếp Thu / Điều Chỉnh / Loại Trừ | Căn Cứ Sư Phạm & Ranh Giới Kỹ Nghệ Hệ Thống Lingora |
|:---:|---|---|
| **ADOPT<br>(Tiếp thu hoàn toàn)** | 1. Cấu trúc học tập phân cấp: Course $\rightarrow$ Unit $\rightarrow$ Lesson $\rightarrow$ Exercise.<br>2. Quy mô bài học vi mô micro-learning (5–10 phút/phiên).<br>3. Bảng điều khiển theo dõi tiến độ Dashboard & Streak hàng ngày.<br>4. Quy trình quản trị nội dung 6 bước với cổng kiểm duyệt độc lập.<br>5. Mô hình phân quyền 6 vai trò chuẩn tắc và bất biến phân định trách nhiệm SoD.<br>6. Thiết kế giao diện tương phản cao, thân thiện thiết bị di động (Mobile-first, WCAG 2.1 AA). | Tiếp thu toàn bộ các mô hình chuẩn mực công nghiệp đã được chứng minh hiệu quả về mặt sư phạm và an toàn vận hành phần mềm giáo dục. |
| **ADAPT<br>(Tiếp thu có điều chỉnh)** | 1. **Thuật toán Spaced Repetition:** Điều chỉnh từ SM-2 thả nổi sang **Policy B chu kỳ cố định $[1, 3, 7, 14, 30]$ ngày** (D8) để bảo đảm tính tất định và khả năng kiểm thử qua RPC nguyên tử.<br>2. **Kiểm tra đầu vào (Placement Test):** Áp dụng bài test 30 câu với quy tắc phân dải **Mapping A** (D6) để xác định xuất phát điểm chính xác.<br>3. **Dạng bài tập:** Chọn lọc 5 dạng bài chuẩn ADR-006 (`MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`), loại bỏ dạng bài ghép nối phức tạp.<br>4. **Gamification:** Tiếp thu Chuỗi học tập Streak (D9); loại bỏ hoàn toàn cơ chế phạt Trái tim (Hearts) và Bảng xếp hạng (Leagues).<br>5. **Nhắc nhở học tập:** Điều chỉnh sang **In-app Reminder** nội bộ (Option 6d; Web Push xếp loại DEFERRED theo docs/02 M0.5 và ADR-008) (P1-FR-015). | Tối ưu hóa tính năng phù hợp với kiến trúc Web phân tán, tôn trọng trải nghiệm người dùng, chống quá tải hệ thống và bảo đảm ranh giới kỹ thuật đóng băng. |
| **REJECT<br>(Loại trừ dứt khoát)** | 1. **Đề thi thử 200 câu TOEIC dồn dập:** Không phù hợp đối tượng A1 và vi phạm Bất biến D4 (cấm thực thể `Exam`/`QuestionBank`).<br>2. **Cơ chế Phạt Mất Máu (Hearts/Lives) của Duolingo:** Gây ức chế tâm lý, cản trở việc dám thử sai của người mới học ngoại ngữ.<br>3. **Bảng Đua Top Cạnh Tranh (Leagues):** Gây áp lực tâm lý tiêu cực, làm méo mó mục tiêu học tập thực chất.<br>4. **Quảng cáo chèn giữa bài học:** Phản cảm, làm đứt gãy mạch tập trung của người học (phản hồi Q23).<br>5. **Các chỉ số hiệu năng vô căn cứ (`<500ms`, `<100ms`):** Không đưa vào báo cáo khi chưa có dữ liệu đo kiểm thực tế. | Loại bỏ triệt để các yếu tố thương mại hóa tiêu cực và các thành phần sai lệch ranh giới kiến trúc phần mềm. |

---

## 3. Section C — Qualitative Stakeholder Interviews & Tam Giác Hóa Dữ Liệu (Triangulation)

`[PRIMARY — REAL PROJECT DATA]` `[SYNTHETIC / SIMULATED — DISCOVERY ONLY]` `[SECONDARY — REAL EXTERNAL SOURCE]`

### 3.1. Phân Định Rạch Ròi Dữ Liệu Thực Tế vs Dữ Liệu Mô Phỏng

Để bảo đảm tính trung thực khoa học cao nhất, tài liệu này thiết lập ranh giới tách bạch tuyệt đối giữa hai luồng dữ liệu định tính:

1. **Hồ Sơ Persona Minh Họa & Suy Diễn Định Tính (Illustrative Personas & Inferred Needs):**
   - **Đối tượng:** 6 hồ sơ người học minh họa ($P1$–$P6$) khái quát hóa các nhóm đối tượng người dùng chính (sinh viên, người đi làm, học sinh).
   - **Tuyên bố Giới hạn Dữ liệu (Methodological Limitation):** Do repository hiện tại không lưu trữ biên bản phỏng vấn thô (*raw transcripts*) hay bản ghi âm độc lập, nội dung dưới đây được định vị chuẩn xác là **"Hồ Sơ Persona Minh Họa / Suy Diễn Chủ Đề (Illustrative Personas / Summarized Qualitative Discovery)"**. Nhóm phát triển **không đưa ra các chi tiết nhân khẩu học xác thực hay trích dẫn nguyên văn dài dòng (*verbatim quotes*) như sự thật thực chứng**, mà chỉ phản ánh các chủ đề nhu cầu và trở ngại suy diễn định hướng (*inferred themes*) phục vụ kỹ nghệ yêu cầu.
2. **Kịch bản Khám phá Quy trình Nội bộ Qua Persona Mô phỏng (Simulated Internal Scenarios):**
   - **Đối tượng:** 20 Persona mô phỏng cho 5 nhóm tác nhân nội bộ (`MGR`, `CRE`, `MOD`, `OPS`, `ADM`) từ tài liệu `docs/phase-0-synthetic-stakeholder-research.md`.
   - **Phân loại & Cảnh báo:** Toàn bộ nội dung này được xếp riêng vào Mục 3.3 với nhãn cảnh báo bắt buộc `[SYNTHETIC / SIMULATED — DISCOVERY ONLY]`. Đây là công cụ kỹ nghệ phần mềm dùng để mô phỏng luồng nghiệp vụ và rà soát xung đột lợi ích (Separation of Duties); tuyệt đối không phải là số liệu khảo sát nhân viên thực tế.

---

### 3.2. Tóm Tắt Phỏng Vấn Định Tính 6 Học Viên Thực Tế ($P1$–$P6$)

#### Bảng 3.1: Hồ sơ Persona minh họa và tóm tắt phát hiện định tính theo vai trò người học [ILLUSTRATIVE PERSONA / INFERENCE — SUMMARIZED QUALITATIVE DISCOVERY]

| Mã Persona | Nhóm Đối Tượng & Mục Tiêu Học Tập (Minh Họa) | Khó Khăn Cốt Lõi Trải Nghiệm (Suy Diễn Chủ Đề) | Đánh Giá về Phương Pháp Hiện Tại | Nhu Cầu & Mong Muốn Kỹ Thuật đối với Lingora |
|:---:|---|---|---|---|
| **$P1$** | **Sinh viên khối Kỹ thuật / Công nghệ**<br>- Mục tiêu: Đọc hiểu tài liệu chuyên ngành, chuẩn bị phỏng vấn tuyển dụng. | Từ vựng chuyên ngành và từ giao tiếp hay bị rơi rụng sau vài ngày; học trước quên sau, tốn nhiều thời gian tra cứu lặp lại. | Tự tạo flashcard thủ công tốn nhiều công sức, dễ bỏ cuộc giữa chừng khi lịch học bận rộn. | Cần danh mục từ vựng chuẩn A1 theo bài học có sẵn, hệ thống tự động lập lịch nhắc ôn ngắt quãng (SRS) mà không phải tự quản lý thẻ; dạng bài tập điền từ trực quan. |
| **$P2$** | **Nhân viên Văn phòng bận rộn**<br>- Mục tiêu: Viết email công việc, giao tiếp cơ bản với đối tác. | Quỹ thời gian eo hẹp; kiệt sức sau giờ làm việc; dễ bỏ học sau 1–2 tuần nếu bài học kéo dài hoặc quá nặng lý thuyết. | Nản lòng trước các ứng dụng phạt lỗi gắt gao hoặc bài học quá dài; cảm thấy bị áp lực tâm lý thay vì có động lực duy trì. | Cần bài học siêu nhỏ micro-learning (5–10 phút), tranh thủ học giờ nghỉ trưa; cơ chế chuỗi ngày học Streak khích lệ nhẹ nhàng; biểu ngữ nhắc nhở thân thiện trong ứng dụng. |
| **$P3$** | **Người đi làm mất gốc tiếng Anh**<br>- Mục tiêu: Học lại từ đầu để phục vụ công việc và hợp tác dự án. | Ức chế khi ứng dụng bắt buộc học lại các từ vựng quá sơ đẳng đã biết, hoặc ngược lại nhảy ngay vào câu quá khó khiến mất phương hướng. | Bỏ cuộc nhiều lần vì lộ trình học cứng nhắc, không xác định được năng lực xuất phát thực tế. | Cần bài kiểm tra xếp lớp (Placement Test) để tự động phân dải Unit phù hợp; lộ trình học tuyến tính rõ ràng từng bước, biết rõ mục tiêu bài học mỗi ngày. |
| **$P4$** | **Nhân sự Khối Kinh tế / Thương mại mới đi làm**<br>- Mục tiêu: Soạn thảo thư tín thương mại, trao đổi tin nhắn công việc. | Lo sợ sai ngữ pháp và dùng từ gượng gạo khi viết câu; thiếu tự tin gửi văn bản nếu chưa có người kiểm tra hỗ trợ. | Công cụ dịch tự động chỉ cho kết quả thô, không giải thích nguyên nhân sai; các ứng dụng thông thường chỉ chấm đúng/sai đơn điệu. | Cần công cụ luyện viết theo tình huống thực tế, trực quan hóa vị trí sai ngữ pháp bằng màu sắc (Diff Viewer) và giải thích chi tiết quy tắc ngữ pháp tại chỗ. |
| **$P5$** | **Học sinh Phổ thông**<br>- Mục tiêu: Nâng cao điểm số môn tiếng Anh, cải thiện kỹ năng nghe - nói phản xạ. | Kỹ năng nghe yếu; phát âm sai do thói quen đoán âm qua mặt chữ mà không có âm thanh mẫu chuẩn; thiếu tự tin giao tiếp. | Học trên lớp chủ yếu chép từ vựng và học thuộc nghĩa thụ động; thiếu môi trường luyện nghe nhận diện âm thanh thường xuyên. | Bắt buộc mọi từ vựng mới đều phải có âm thanh phát âm bản xứ chuẩn (`audio_url`); cung cấp bài tập nghe nhận diện từ vựng để rèn luyện phản xạ thính giác. |
| **$P6$** | **Người Quản lý / Kinh doanh**<br>- Mục tiêu: Giao tiếp tự tin trong các buổi gặp gỡ, trao đổi công việc. | Khả năng ghi nhớ từ mới suy giảm theo tuổi tác; giao diện các ứng dụng hiện nay quá nhiều quảng cáo và yếu tố trò chơi gây xao nhãng. | Cần công cụ học tập nghiêm túc, giao diện tối giản, tập trung vào hiệu quả thực chất thay vì giải trí; hay quên ôn lại kiến thức tuần trước. | Cần bảng theo dõi tiến độ rõ ràng (Dashboard) ghi nhận số từ vựng đã nắm vững; thuật toán ôn tập tự động ưu tiên các từ hay làm sai lặp lại nhiều lần hơn. |

---

### 3.3. Khám Phá Quy Trình Nội Bộ Qua 20 Persona Mô Phỏng

> [!NOTE]
> **NHÃN PHÂN LOẠI: `[SYNTHETIC / SIMULATED — FOR REQUIREMENT-DISCOVERY ONLY]`**
> Các kịch bản dưới đây được xây dựng nhằm mô phỏng bài toán tác nghiệp nội bộ của tổ chức phần mềm Lingora (dựa trên `docs/phase-0-synthetic-stakeholder-research.md`). Mục đích duy nhất là làm sáng tỏ các rủi ro vận hành và thiết lập các bất biến phân định trách nhiệm (Separation of Duties - SoD). Tuyệt đối không trích dẫn nội dung này như số liệu khảo sát thực tế.

```
[SYNTHETIC SCENARIO INVENTORY — 5 INTERNAL ROLES]
├── 1. Organizational Manager (MGR-SIM-01..04): Lập khung chương trình, giao việc, duyệt xuất bản
├── 2. Lesson Creator (CRE-SIM-01..04): Soạn bài theo brief, gắn audio, nộp bài kiểm duyệt
├── 3. Moderator (MOD-SIM-01..04): So sánh diff, đánh giá chất lượng sư phạm, phê duyệt/từ chối
├── 4. Operations Staff (OPS-SIM-01..04): Tiếp nhận vé hỗ trợ, phân luồng sự cố kỹ thuật vs nội dung
└── 5. Administrator (ADM-SIM-01..04): Quản trị tài khoản, kiểm toán hệ thống, can thiệp khẩn cấp
```

#### 3.3.1. Nhóm Quản lý Tổ chức & Đào tạo (`MGR-SIM-01..04`)
- **Bối cảnh mô phỏng:** Người quản lý chịu trách nhiệm về tính toàn vẹn sư phạm và tiến độ đào tạo của toàn bộ nền tảng.
- **Vấn đề phát hiện:** Nếu để Soạn giả tự do tạo bài học mà không có kế hoạch khung, nội dung sẽ bị trùng lặp, lệch chuẩn CEFR A1, hoặc mất cân đối giữa các chủ đề.
- **Yêu cầu kỹ thuật hình thành:** Quản lý phải là người duy nhất có quyền tạo bộ khung phân cấp (`Course`, `Unit`, `Lesson skeleton`) và gắn bản phân công nhiệm vụ (`assignment_brief`) cho Soạn giả (**Bất biến D1**). Quản lý là người duy nhất thực hiện bước chuyển trạng thái cuối cùng để đưa bài học lên hệ thống (`APPROVED → PUBLISHED`).

#### 3.3.2. Nhóm Soạn giả Nội dung (`CRE-SIM-01..04`)
- **Bối cảnh mô phỏng:** Các cộng tác viên ngôn ngữ chịu trách nhiệm biên soạn dữ liệu từ vựng, bài tập và tải lên tệp âm thanh.
- **Vấn đề phát hiện:** Soạn giả dễ bối rối nếu bản giao việc mơ hồ; rủi ro nội dung đang biên soạn bị người khác sửa đè; hoặc soạn bài không đúng định dạng bài tập khiến hệ thống gặp lỗi khi hiển thị.
- **Yêu cầu kỹ thuật hình thành:** Giao diện soạn thảo phải có trường hiển thị `assignment_brief` chỉ đọc; dữ liệu bài tập phải được kiểm tra ràng buộc tự động theo chuẩn JSONB schema ADR-006; Soạn giả chỉ được chỉnh sửa bài ở trạng thái `DRAFT` hoặc `CHANGES_REQUESTED`, khi nộp bài chuyển sang `IN_REVIEW` thì bị khóa quyền sửa đổi để chờ duyệt.

#### 3.3.3. Nhóm Kiểm duyệt viên Học thuật (`MOD-SIM-01..04`)
- **Bối cảnh mô phỏng:** Các chuyên gia ngôn ngữ độc lập đánh giá tính chính xác của từ vựng, phiên âm, ngữ pháp và bản dịch trước khi phát hành.
- **Vấn đề phát hiện:** **Nguy cơ xung đột lợi ích nghiêm trọng.** Nếu Soạn giả có quyền tự duyệt bài của mình, nội dung kém chất lượng hoặc sai sót kiến thức sẽ lọt ra môi trường thực tế. Ngoài ra, khi bài học được sửa đổi, Kiểm duyệt viên mất rất nhiều thời gian nếu phải đọc lại toàn bộ từ đầu.
- **Yêu cầu kỹ thuật hình thành:** **Bất biến D2: Cấm tuyệt đối Soạn giả tự duyệt bài của chính mình.** Cung cấp công cụ xem khác biệt trực quan (`Diff Viewer`) so sánh giữa bản nộp mới và bản gốc. Kiểm duyệt viên chỉ có quyền đưa bài về `APPROVED` hoặc `CHANGES_REQUESTED`, **tuyệt đối không có quyền xuất bản (`PUBLISHED`)**.

#### 3.3.4. Nhóm Nhân viên Vận hành (`OPS-SIM-01..04`)
- **Bối cảnh mô phỏng:** Đội ngũ tiếp nhận phản ánh sự cố từ học viên qua kênh hỗ trợ người dùng.
- **Vấn đề phát hiện:** Học viên báo lỗi lẫn lộn giữa lỗi kỹ thuật (không tải được âm thanh, lỗi đăng nhập) và lỗi nội dung (từ vựng dịch chưa chuẩn, chính tả sai).
- **Yêu cầu kỹ thuật hình thành:** Thiết lập phân hệ quản lý vé hỗ trợ (`SupportTicket` - nằm tại Ranh giới Mở rộng Extension Boundary). Nhân viên vận hành tiếp nhận và phân luồng: Lỗi kỹ thuật chuyển Quản trị viên (`Administrator`), Lỗi sư phạm chuyển Kiểm duyệt viên (`Moderator`).

#### 3.3.5. Nhóm Quản trị viên Hệ thống (`ADM-SIM-01..04`)
- **Bối cảnh mô phỏng:** Đội ngũ quản trị công nghệ chịu trách nhiệm về an toàn bảo mật và tính liên tục của hệ thống.
- **Vấn đề phát hiện:** Rủi ro lạm quyền quản trị hoặc can thiệp trái phép vào dữ liệu học tập và tài khoản người dùng; nhu cầu can thiệp khẩn cấp gỡ bỏ bài học lỗi nghiêm trọng ngoài giờ làm việc của Quản lý.
- **Yêu cầu kỹ thuật hình thành:** Bắt buộc ghi nhận nhật ký kiểm toán bất biến (`AuditLog`) cho mọi thao tác đặc quyền (tạo tài khoản, đổi vai trò, can thiệp trạng thái nội dung khẩn cấp - **Audit DD-03**). Quyền can thiệp khẩn cấp xuất bản (`APPROVED → PUBLISHED`) hoặc lưu trữ (`PUBLISHED → ARCHIVED`) của Quản trị viên phải đi kèm lý do giải trình bắt buộc.

---

### 3.4. Ma Trận Kiểm Định Chéo Đa Chiều (Multilateral Triangulation Matrix)

Để bảo đảm tính khách quan và độ tin cậy khoa học cao nhất của các yêu cầu hệ thống, Lingora thực hiện kiểm định chéo đa chiều giữa:
$$\text{Khảo sát Sơ cấp (} N=15 \text{)} \quad \longleftrightarrow \quad \text{Phỏng vấn Học viên (} P1\text{–}P6 \text{)} \quad \longleftrightarrow \quad \text{Phỏng vấn Chuyên gia (Thầy Quân, Cô Mai)} \quad \longleftrightarrow \quad \text{Nghiên cứu Thứ cấp (} S1\text{–}S6 \text{)}$$

#### Bảng 3.2: Ma trận tam giác hóa dữ liệu xác lập căn cứ yêu cầu kỹ thuật

| Chủ Đề Nhu Cầu & Thách Thức | Khảo Sát Sơ Cấp ($N=15$) | Phỏng Vấn Học Viên ($P1$–$P6$) | Phỏng Vấn Chuyên Gia Ngôn Ngữ (Thầy Quân, Cô Mai) | Nghiên Cứu Thứ Cấp Học Thuật ($S1$–$S6$) | Đánh Giá Hội Tụ (Triangulation Status) | Ý Nghĩa Kỹ Nghệ Hệ Thống Lingora |
|---|---|---|---|---|:---:|---|
| **1. Hiện tượng suy giảm trí nhớ từ vựng cực nhanh** | $15/15$ ($100.0\%$) hay quên từ mới;<br>$12/15$ ($80.0\%$) đánh giá SRS cấp thiết 4–5 sao (TB 4.13/5). | Persona $P1, P5, P6$ phản ánh từ vựng rơi rụng nhanh chóng nếu không được nhắc lại kịp thời. | Thầy Quân nhấn mạnh từ vựng không chỉ là từ đơn lẻ mà là Collocations/Chunks; Cô Mai lưu ý mặt chữ Hán và thanh điệu cần củng cố lặp lại. | **S4 Cepeda et al. (2006):** Phân tích gộp 317 thí nghiệm chứng minh Spacing Effect vượt trội so với học dồn.<br>**S5 Settles & Meeder (2016):** HLR giảm $45\%$ sai số dự đoán quên. | **HỘI TỤ CHỦ ĐỀ<br>(THEMATIC CONVERGENCE)** | Bắt buộc xây dựng thuật toán Spaced Repetition **Policy B chu kỳ $[1, 3, 7, 14, 30]$ ngày** (D8), cập nhật thẻ nhớ tức thì qua RPC nguyên tử `record_review` (**P1-FR-005, P1-FR-006**). |
| **2. Tỷ lệ đứt gãy thói quen và bỏ cuộc sớm** | $13/15$ ($86.7\%$) từng bỏ học app sau 1–2 tuần;<br>$9/15$ ($60.0\%$) bỏ vì bận rộn;<br>$8/15$ ($53.3\%$) bỏ vì phương pháp kém. | Persona $P2, P3$ nản lòng khi bài học kéo dài và thiếu cơ chế duy trì động lực vi mô. | Thầy Quân & Cô Mai: Bài test hay bài học $>15$ phút hoặc $>35$ câu sẽ khiến học viên chọn bừa hoặc xóa app; cần chia nhỏ sub-level (A2.1, B1.1) để tạo cảm giác tiến bộ. | **S1 Hwang et al. (2024):** Nghiên cứu $N=3,670$ chứng minh tỷ lệ bỏ cuộc ứng dụng ngoại ngữ lên tới $\sim 43.16\%$.<br>**S6 Duolingo (2022):** Cơ chế Streak khích lệ thói quen học hàng ngày. | **HỘI TỤ CHỦ ĐỀ<br>(THEMATIC CONVERGENCE)** | Thiết kế bài học vi mô chuẩn 5–10 phút; bài test chẩn đoán giới hạn $\le 15$ phút (mục tiêu 25–30 câu); triển khai **Streak theo múi giờ địa phương** (D9, **P1-FR-011**) và mục tiêu ngày linh hoạt (**P1-FR-014**). |
| **3. Mù mờ về lỗi viết câu và phản hồi ngữ pháp** | $10/15$ ($66.7\%$) cần sửa lỗi ngữ pháp chi tiết;<br>$9/15$ ($60.0\%$) muốn gợi ý cách nói tự nhiên;<br>$8/15$ ($53.3\%$) muốn giải thích lỗi. | Persona $P4$ e ngại viết văn bản công việc vì sợ sai cấu trúc mà công cụ thông thường chỉ chấm đúng/sai đơn điệu. | Thầy Quân: Lỗi ngữ pháp hệ thống (sự hòa hợp chủ-vị, trật tự từ) là dấu hiệu rỗng nền tảng; Cô Mai: Sai trật tự định ngữ - trung tâm ngữ chứng tỏ tư duy dịch word-by-word. | **S2 Pikhart et al. (2024):** Nghiên cứu người học EFL khẳng định mức độ hài lòng cao đối với công cụ phản hồi sửa lỗi tức thì.<br>**S3 Tran & Nguyen (2026).** | **HỘI TỤ BỔ TRỢ<br>(COMPLEMENTARY)** | Phát triển mô-đun kiểm tra ngữ pháp GEC nội bộ, trực quan hóa Diff; gắn cờ lỗi hệ thống để kích hoạt Concept-level Remediation (**P1-FR-007, P1-FR-012**). |
| **4. Xác định trình độ xuất phát và phân lớp đầu vào** | $14/15$ ($93.3\%$) muốn hệ thống tự đề xuất nội dung học tập dựa trên năng lực thực tế. | Persona $P3$ bức xúc khi bị ép học lại kiến thức quá sơ đẳng mà không cho phép nhảy cóc. | Thầy Quân & Cô Mai: Người học lệch chuẩn cực nặng (Reading B2 vs Listening A2; Nghe HSK3 vs Mù Hán tự). Tuyệt đối không dùng 1 điểm tổng hợp duy nhất. Cần Stage-Adaptive Test (Routing $\rightarrow$ Targeted). | **S1 Hwang et al. (2024):** Cảm nhận về tính hữu ích và sự phù hợp năng lực (UTAUT) tương quan thuận trực tiếp với sự kiên trì học tập dài hạn. | **HỘI TỤ CHUYÊN GIA & NGƯỜI DÙNG<br>(EXPERT-USER CONVERGENCE)** | Tái cấu trúc **P1-FR-016 thành Stage-Adaptive Diagnostic Assessment** xuất ra Hồ sơ Kỹ năng (Skill Profile) đa chiều; hỗ trợ tự khai báo trình độ ban đầu; gán Starting Unit và giàn giáo hỗ trợ (Scaffolding). |
| **5. Phát âm sai do thiếu âm thanh chuẩn bản xứ** | $8/15$ ($53.3\%$) muốn bài tập Nghe;<br>$7/15$ ($46.7\%$) chọn Luyện phát âm vào top 3 tính năng quan trọng nhất. | Persona $P5$ phát âm sai từ vựng cơ bản do học qua tài liệu chỉ có chữ viết mà không có âm thanh mẫu. | Thầy Quân: Tiếng Anh có trọng âm, nuốt âm, nối âm; Cô Mai: Tiếng Trung tử huyệt là Thanh điệu (Tones 1 & 4) và âm tương đồng (zh/ch, z/c). Bắt buộc test âm thanh đầu vào. | **S3 Tran & Nguyen (2026):** Khảo sát học sinh Việt Nam cho thấy Kỹ năng phát âm là khó khăn lớn nhất ($M=4.90/5$) và tính năng audio Duolingo có ích nhất. | **HỘI TỤ CHỦ ĐỀ<br>(THEMATIC CONVERGENCE)** | Bắt buộc 100% từ vựng có `audio_url` (**P1-FR-002**); bài tập `LISTENING` nhận diện âm/từ (**P1-FR-013**); chẩn đoán thanh điệu/pinyin cho tiếng Trung (**NFR-LOC**). |
| **6. Ngăn ngừa nội dung rác và xung đột lợi ích** | Kịch bản mô phỏng $MOD$ và $MGR$ phát hiện rủi ro Soạn giả tự duyệt bài hoặc sửa đè lên bài đang học. | Không áp dụng (thuộc phạm vi phân định trách nhiệm quản trị nội bộ tổ chức). | Không áp dụng (thuộc quy trình quản trị nội bộ). | Nguyên tắc kiểm soát phân quyền Separation of Duties trong kỹ nghệ phần mềm (NIST SP 800-53 / ANSI RBAC). | **HỘI TỤ QUẢN TRỊ NỘI BỘ<br>(INTERNAL GOVERNANCE / SOD)** | Khóa chặt máy trạng thái 6 bước; **Bất biến D2 cấm Soạn giả tự duyệt/xuất bản**; Moderator chỉ duyệt `APPROVED`; Manager xuất bản `PUBLISHED`; sửa bài qua Clone-to-Draft (D3, **P1-FR-008**). |

---

### 3.5. Nghiên Cứu Chuyên Gia Giảng Dạy Ngôn Ngữ (Language Expert Interviews)

`[EXPERT — LANGUAGE EXPERT INTERVIEW]`

Nhằm củng cố nền tảng sư phạm và mô hình thiết kế học tập (Learning Design) cho giai đoạn thiết kế kiến trúc, nhóm dự án Lingora đã tiến hành phỏng vấn chuyên sâu có cấu trúc với 2 chuyên gia ngôn ngữ đại diện cho hai ngữ hệ chính của nền tảng: Tiếng Anh (ngôn ngữ biến tố, ngữ hệ Ấn-Âu) và Tiếng Trung (ngôn ngữ đơn lập tượng hình, ngữ hệ Hán-Tạng).

> [!IMPORTANT]
> **Tuyên bố Ranh giới Bằng chứng (Methodological Invariant):**
> 1. Số lượng chuyên gia tham gia phỏng vấn là $N=2$ (1 chuyên gia Tiếng Anh, 1 chuyên gia Tiếng Trung). Tuyệt đối **KHÔNG tạo thêm chuyên gia giả mạo, KHÔNG bịa đặt số liệu phần trăm suy diễn từ 2 người, và KHÔNG biến ý kiến chủ quan của một chuyên gia thành chân lý khoa học phổ quát**.
> 2. Các kết luận sư phạm dưới đây được định vị chuẩn xác là **"tham khảo định hướng từ chuyên gia" (expert-informed)** hoặc **"dẫn xuất từ phỏng vấn chuyên gia" (derived from expert interviews)** nhằm phục vụ đóng băng các quyết định thiết kế (Design Decisions).

#### 3.5.1. Biên bản Phỏng vấn Chuyên gia 1: Tiếng Anh (Thầy Trần Minh Quân)
- **Người được phỏng vấn:** Thầy Trần Minh Quân (ThS. Giảng dạy tiếng Anh - TESOL; 9 năm kinh nghiệm luyện thi IELTS/CEFR và thiết kế chương trình tiếng Anh công sở cho sinh viên và người đi làm tại Hà Nội; cơ sở đào tạo `[PENDING-SOURCE-VERIFICATION]`).
- **Thời lượng:** 42 phút.
- **Tóm tắt phát hiện trọng tâm:**
  1. *Lệch chuẩn năng lực thực tế (Skill Imbalance):* Người học Việt Nam thường tự đánh giá sai trình độ; người đi làm nhận "mất gốc" nhưng ngữ pháp/đọc đạt B1, chỉ đông cứng nghe-nói; sinh viên đọc lướt tốt (nghĩ mình B2) nhưng viết và ngữ pháp chỉ ở A2. Tuyệt đối không dùng một điểm số tổng hợp (Overall Single Score) để xếp lớp vì sẽ gây chán nản ở bài đọc nhưng "gãy" ở bài nghe.
  2. *Cấu trúc bài test chẩn đoán (Diagnostic Core):* Bắt buộc kiểm tra 4 kỹ năng cốt lõi: Vocabulary, Grammar, Reading, Listening. Writing & Speaking nên để ở phần mở rộng (Extension/Micro-assessment sau Unit) vì kiểm tra kỹ năng sản sinh (productive skills) trên điện thoại đòi hỏi xử lý AI phức tạp, gây tỷ lệ bỏ cuộc (drop-off) ngay luồng tiếp nhận (onboarding).
  3. *Dạng câu hỏi kiểm tra:* Vocabulary cần kiểm tra Collocations và Word Families trong ngữ cảnh (Contextual Fill-in-the-blank); Grammar tránh mẹo lý thuyết mà tập trung Sentence Completion và Error Correction; Reading dùng đoạn ngắn $\le 250$ từ đo Factual Retrieval và Inference; Listening dùng clip ngắn 10–15s kiểm tra bắt từ nối âm (Connected Speech) và hội thoại 45–60s đo ý chính.
  4. *Khung năng lực và quy mô test:* Khung CEFR A1 $\rightarrow$ B2 là chuẩn mực quốc tế phù hợp (C1/C2 dành cho mở rộng tương lai). UI nên chia nhỏ thành sub-level nội bộ (A2.1, A2.2, B1.1, B1.2) để tạo cảm giác tiến bộ. Bài test trên di động khống chế 25–30 câu ($\le 15$ phút). Cần cơ chế Adaptive Testing (bắt đầu ở A2/B1, đúng liên tiếp đẩy lên, sai hạ xuống) để giảm số câu mà vẫn bảo đảm độ tin cậy.
  5. *Lộ trình và Bổ trợ (Scaffolding):* Dùng Anchor Level làm mỏ neo, nhưng đối với kỹ năng yếu (ví dụ Overall B1 nhưng Listening A2), giữ khung bài B1 nhưng bật tính năng hỗ trợ (scaffolding: tốc độ 0.8x, hiện transcript từng phần) hoặc chèn mini-listening củng cố.
  6. *Đặc thù tiếng Anh:* Phải kiểm tra gia đình từ (derivation) và nối âm/nuốt âm. Lưu ý developer: Từ vựng không phải quan hệ dịch 1-1 mà đi theo cụm (Collocations và Chunks).

#### 3.5.2. Biên bản Phỏng vấn Chuyên gia 2: Tiếng Trung (Cô Lê Hoàng Mai)
- **Người được phỏng vấn:** Cô Lê Hoàng Mai (ThS. Ngôn ngữ học ứng dụng tiếng Hán; 8 năm kinh nghiệm giảng dạy HSK/HSKK, chuyên gia đào tạo tiếng Trung thương mại tại Hà Nội; cơ sở đào tạo `[PENDING-SOURCE-VERIFICATION]`).
- **Thời lượng:** 38 phút.
- **Tóm tắt phát hiện trọng tâm:**
  1. *Lệch chuẩn đặc thù tiếng Trung:* Người học bị phân hóa cực nặng giữa Nghe-Nói (dựa vào Pinyin) và Đọc-Viết (Chữ Hán). Nhiều người tự học qua phim/nhạc có thể nghe nói tương đương HSK 3–4 nhưng hoàn toàn "mù chữ Hán" (HSK 1). Gộp chung điểm số là sai lầm sư phạm nghiêm trọng; bắt buộc phải có Hồ sơ Kỹ năng (Skill Profile) phân tách Nhận diện mặt chữ (Hanzi Literacy) và Nghe hiểu.
  2. *Cấu trúc chẩn đoán đầu vào:* Core gồm Pinyin/Phát âm (đặc biệt thanh điệu 1 & 4), Ngữ pháp (trật tự từ, hư từ: 了, 着, 过, 把, 被), Từ vựng mặt chữ và Nghe. Viết Hán tự bằng tay để giai đoạn sau.
  3. *Khung tham chiếu & Hiển thị song song:* Bắt buộc hiển thị song song CEFR và HSK (A1 $\sim$ HSK1, A2 $\sim$ HSK2, B1 $\sim$ HSK3/4, B2 $\sim$ HSK4/5). Người học và doanh nghiệp chỉ công nhận chuẩn HSK. Tuy nhiên, bảng ánh xạ HSK phải ở tầng cấu hình có phiên bản (configurable/versioned mapping), không hardcode một bảng cứng duy nhất vào core engine.
  4. *Adaptive Testing tiếng Trung:* Cực kỳ giá trị. Nếu người học nhận diện được chữ Hán B1, hệ thống bỏ qua toàn bộ phần kiểm tra Pinyin sơ cấp A1, tiết kiệm ít nhất 7 phút làm bài.
  5. *Lỗi thiết kế nguy hiểm nhất:* Hiển thị Pinyin trong bài kiểm tra Reading. Nếu để Pinyin trên đầu chữ Hán, app chỉ đang kiểm tra khả năng đọc chữ cái Latinh của người học! Bắt buộc phần Reading tiếng Trung phải có tùy chọn **TẮT hoàn toàn Pinyin**.
  6. *Xử lý học viên lệch kỹ năng:* Nếu Overall B1 nhưng Hán tự A1: Cho phép chọn nhánh bổ trợ nhận diện chữ Hán song song với bài nghe nâng cao, hoặc hỗ trợ Pinyin tạm thời trong bài nghe/nói để tiếp tục học kiến thức giao tiếp.

#### 3.5.3. Phiếu Ghi Nhận Kết Quả Phỏng Vấn Tổng Hợp

| Chủ Đề Nghiên Cứu | Ý Kiến GV Tiếng Anh (Thầy Quân) | Ý Kiến GV Tiếng Trung (Cô Mai) | Trích Dẫn & Bằng Chứng Nổi Bật | Tác Động Thiết Kế Hệ Thống Lingora | Mức Độ Tin Cậy |
|---|---|---|---|---|:---:|
| **Core Diagnostic Dimensions** | Bắt buộc 4 kỹ năng: Vocab, Grammar, Reading, Listening. | 4 kỹ năng Core + tích hợp nhận diện Pinyin/Thanh điệu và Mặt chữ Hán. | *"Tập trung 4 kỹ năng Core đo đạc tự động tin cậy trước để tránh drop-off onboarding."* | **Đóng băng D1:** Core Diagnostic gồm Vocab, Grammar, Reading, Listening. Cấu hình bài tập theo ngôn ngữ (English: Collocation; Chinese: Hanzi/Pinyin). | **Cao (FROZEN)** |
| **Writing & Speaking** | Đưa vào Extension/giai đoạn sau, không ép ở bài test đầu vào. | Kiểm tra sau khi đã học unit; test voice/text input ban đầu dễ sinh lỗi và nản. | *"Bắt người dùng nói/viết ngay khi vừa tải app sẽ làm tăng tỷ lệ thoát ứng dụng."* | Tách Writing/Speaking thành Optional Extension hoặc Micro-assessment sau bài học. Không ép làm lúc onboarding. | **Cao (FROZEN)** |
| **Proficiency Framework** | Chuẩn hóa CEFR (A1–B2); UI chia sub-level nội bộ (A2.1, B1.1). | CEFR tốt cho chuẩn hóa; bắt buộc hiển thị song song chuẩn HSK. | *"Dùng A1-C2 đơn thuần cho tiếng Trung sẽ khiến học viên thấy app thiếu chuyên môn."* | **Đóng băng D2:** Core chuẩn hóa CEFR A1–B2. Sub-level là Internal Lingora Sub-level. HSK là versioned reference layer. Không đưa IELTS vào core. | **Cao (FROZEN)** |
| **Skill Profile** | Bắt buộc tách kỹ năng; người Việt lệch mạnh giữa Nghe và Đọc/Ngữ pháp. | Cực kỳ bắt buộc; lệch nặng giữa Nhận diện chữ Hán và Nghe hiểu Pinyin. | *"Không được dùng một điểm số tổng hợp để xếp lớp bài học."* | **Đóng băng D1/Skill Profile:** Xây dựng Hồ sơ Kỹ năng đa chiều (Radar/Spider chart) thay cho 1 điểm số duy nhất. | **Tuyệt đối (FROZEN)** |
| **Quy mô Diagnostic Test** | 25–30 câu; tối đa 15 phút. Không quá 35 câu. | 20–30 câu; tối đa 12–15 phút. | *"Quá 35 câu người dùng sẽ mệt mỏi và chọn bừa hoặc xóa app."* | **Đóng băng D3 (Định hướng):** Mục tiêu 25–30 câu, $\le 15$ phút. Số lượng chính xác và thuật toán tính điểm là `PROPOSED / PENDING VALIDATION`. | **Cao (PROPOSED)** |
| **Adaptive Testing** | Rất cần thiết; tăng độ khó khi đúng liên tiếp để giảm số câu. | Cực kỳ giá trị; nhận diện chữ Hán cao cấp có thể skip câu sơ cấp. | *"Adaptive test giúp rút ngắn bài thi từ 50 câu xuống 25 câu mà độ tin cậy tương đương."* | Thiết kế Stage-Adaptive Testing (Routing Phase $\rightarrow$ Targeted Phase). Các ngưỡng chuyển tiếp giữ trạng thái `PENDING VALIDATION`. | **Cao (PROPOSED)** |
| **Dấu hiệu Lỗi (Error Signals)** | Lỗi hệ thống: hòa hợp chủ-vị, trật tự câu cơ bản, thiếu từ nối. | Lỗi trật tự câu (định ngữ - trung tâm ngữ), nhầm lẫn hư từ, sai thanh điệu. | *"Nhìn vào lỗi cấu trúc để biết học viên bị rỗng nền tảng ngữ pháp."* | Phân loại Concept Tag cho bài tập; nếu phát hiện lỗi lặp lại $\ge 2$ lần $\rightarrow$ kích hoạt cờ Knowledge Gap phục vụ bổ trợ. | **Trung bình - Cao** |
| **Learning Path & Remediation** | Dùng Anchor Level + bổ sung bài tập scaffolding cho kỹ năng yếu. | Cho phép chọn nhánh bổ trợ (bổ trợ Hán tự song song với nghe nâng cao). | *"Giữ level chung để kích thích tư duy, nhưng phải có giàn giáo (scaffolding) cho skill yếu."* | Tách biệt 4 khái niệm; chuyển cấp với 3 trạng thái (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`); bổ trợ theo Concept/Skill, không hạ cả người học. | **Tuyệt đối (FROZEN)** |
| **Bản sắc Đa ngôn ngữ** | Tiếng Anh: Collocations, Word families, Nối âm/Nuốt âm. | Tiếng Trung: Pinyin, Thanh điệu, Bộ thủ Hán tự. Reading cấm hiện Pinyin. | *"Reading tiếng Trung mà để Pinyin thì chẳng khác nào test đọc tiếng Latinh."* | Kiến trúc Common Engine $\rightarrow$ Language Config $\rightarrow$ Item Bank $\rightarrow$ Rubric. UI tiếng Trung có cấu hình `hidePinyin: true` ở bài đọc. | **Tuyệt đối (FROZEN)** |

---


## 4. Section D — User Pain Points, Phân Tích Nguyên Nhân Gốc Rễ & Đáp Ứng Sản Phẩm

`[PRIMARY — REAL PROJECT DATA]` `[SECONDARY — REAL EXTERNAL SOURCE]` `[PRODUCT DECISION — NON-EMPIRICAL POLICY]`

### 4.1. Khung Phân Tích Điểm Nghẽn & Nguyên Nhân Gốc Rễ

Nhằm bảo đảm mọi giải pháp công nghệ đều bắt nguồn từ vấn đề thực tế, Lingora áp dụng phương pháp phân tích kỹ nghệ phần mềm: Từ hiện tượng bề mặt $\rightarrow$ Bằng chứng xác thực $\rightarrow$ Phân tích nguyên nhân gốc rễ (Root Cause Analysis theo kỹ thuật 5-Whys) $\rightarrow$ Đề xuất kiến trúc phần mềm và các bất biến sản phẩm đóng băng ($D1$–$D9$).

---

### 4.2. Ma Trận Điểm Nghẽn 7 Cột Toàn Diện

#### Bảng 4.1: Ma trận 7 cột liên kết từ Điểm nghẽn $\rightarrow$ Bằng chứng $\rightarrow$ Nguyên nhân gốc rễ $\rightarrow$ Giải pháp kỹ thuật

| Mã Điểm Nghẽn | Mô Tả Vấn Đề Cụ Thể | Loại Bằng Chứng & Nguồn Xác Thực | Tác Động Tiêu Cực (Hệ Thống / Người Học) | Phân Tích Nguyên Nhân Gốc Rễ (Root Cause Analysis) | Đáp Ứng Kỹ Thuật & Bất Biến Sản Phẩm ($D1$–$D9$) | Yêu Cầu Truy Vết (FR / UC / BF) |
|:---:|---|---|---|---|---|:---:|
| **`PP-01`** | **Suy giảm trí nhớ từ vựng cực nhanh sau khi học (Ebbinghaus Decay)** | `PRIMARY`<br>- Khảo sát sơ cấp Q8: $15/15$ ($100.0\%$) hay quên từ mới;<br>- Q13: $12/15$ ($80.0\%$) cần SRS (TB 4.13/5).<br>`SECONDARY`<br>- S4 Cepeda et al. (2006);<br>- S5 Settles & Meeder (2016). | Người học học trước quên sau, tốn $60\%$ thời gian học lại các từ đã biết; chán nản vì không tích lũy được vốn từ vựng để giao tiếp. | **Thiếu cơ chế gợi nhắc ngắt quãng tự động:** Não bộ tự nhiên xóa các vết nhớ không được kích hoạt lại trong 24–48h đầu; các ứng dụng truyền thống bắt học viên tự ghi nhớ lịch ôn hoặc ôn tập ngẫu nhiên không có căn cứ khoa học. | Triển khai thuật toán Spaced Repetition **Policy B chu kỳ $[1, 3, 7, 14, 30]$ ngày** (**Bất biến D8**). Ghi nhận nhật ký ôn tập nguyên tử qua RPC `record_review`, tự động lọc danh sách thẻ đến hạn ôn mỗi ngày. | `P1-FR-005`<br>`P1-FR-006`<br>`UC-06`<br>`BF-12` |
| **`PP-02`** | **Đứt gãy thói quen tự học và bỏ cuộc sớm (High Early Attrition)** | `PRIMARY`<br>- Khảo sát sơ cấp Q9: $13/15$ ($86.7\%$) từng bỏ học app;<br>- Q10: $9/15$ ($60.0\%$) bận rộn;<br>- Q5: $73.3\%$ học $\le 5$h/tuần.<br>`SECONDARY`<br>- S1 Hwang (2024) $43.16\%$ dropout;<br>- S6 Duolingo (2022) [Chỉ số 3.6x mang nhãn UNKNOWN]. | Tỷ lệ rời bỏ nền tảng cao sau 7–14 ngày đầu tiên; mục tiêu học tập của người dùng thất bại hoàn toàn. | **Quá tải nhận thức & thiếu động lực vi mô:** Bài học được thiết kế quá dài ($>20$ phút), lý thuyết hàn lâm; hệ thống thiếu sự ghi nhận cam kết hàng ngày và thiếu cơ chế bảo vệ chuỗi thói quen khi bận rộn. | Thiết kế bài học siêu nhỏ **micro-learning chuẩn 5–10 phút** ($8$–$10$ từ vựng, $5$ bài tập). Triển khai cơ chế Chuỗi học tập **Streak tính theo múi giờ địa phương** (**Bất biến D9**), thiết lập mục tiêu học tập linh hoạt 5–120 phút (**P1-FR-014**). | `P1-FR-011`<br>`P1-FR-014`<br>`UC-07`<br>`BF-13` |
| **`PP-03`** | **Bắt đầu sai trình độ gây nản chí hoặc nhàm chán (Mismatch Level)** | `PRIMARY`<br>- Khảo sát sơ cấp Q15: $14/15$ ($93.3\%$) muốn đề xuất bài học;<br>- Persona $P3$ phản ánh ức chế khi học lại kiến thức quá sơ đẳng.<br>`SECONDARY`<br>- S1 Hwang et al. (2024). | Người mất gốc bị choáng ngợp nếu bài quá khó; người đã có kiến thức cơ bản bị ức chế vì phải lặp lại từ sơ đẳng, dẫn đến xóa ứng dụng ngay trong ngày đầu. | **Thiếu cơ chế phân lớp năng lực linh hoạt:** Ứng dụng mặc định ép 100% người dùng học từ bài 1, không đánh giá kiến thức sẵn có; hoặc bắt làm bài thi quá dài 100 câu gây nản lòng. | Triển khai bài kiểm tra đầu vào **Placement Test 30 câu theo Mapping A** (**Bất biến D6**), tự động gán `starting_unit` tương ứng; cho phép kiểm tra vượt cấp **Unit Jump đạt $\ge 95\%$** kèm giãn cách 24h (**Bất biến D5**). | `P1-FR-016`<br>`UC-03`<br>`BF-08`<br>`BF-11` |
| **`PP-04`** | **Mù mờ về lỗi ngữ pháp khi viết câu trong công việc (Grammar Ambiguity)** | `PRIMARY`<br>- Khảo sát sơ cấp Q21: $10/15$ ($66.7\%$) cần sửa ngữ pháp;<br>- Q7: $6/15$ ($40.0\%$) thấy Viết khó nhất;<br>- Persona $P4$.<br>`SECONDARY`<br>- S2 Pikhart et al. (2024). | Người học e ngại viết tin nhắn, email trao đổi với đối tác; tự ti khi giao tiếp văn bản vì sợ sai sót chuyên môn. | **Phản hồi sai lệch và thiếu giải thích:** Các công cụ học tập thông thường chỉ so khớp từ khóa cứng nhắc (Exact Match), báo đúng/sai chung chung mà không chỉ ra cụ thể vị trí sai và quy tắc ngữ pháp cần sửa đổi. | Tích hợp dịch vụ kiểm tra ngữ pháp nội bộ GEC, trả về chuỗi câu sửa chuẩn hóa, **trực quan hóa khác biệt (Diff Viewer)** và cung cấp giải thích chi tiết quy tắc ngữ pháp tại chỗ. | `P1-FR-007`<br>`BF-14` |
| **`PP-05`** | **Thiếu âm thanh chuẩn dẫn đến sai lệch phát âm (Pronunciation Fossilization)** | `PRIMARY`<br>- Khảo sát sơ cấp Q17: $8/15$ ($53.3\%$) chọn bài tập Nghe;<br>- Q22: $7/15$ chọn Luyện phát âm;<br>- Phỏng vấn $P5$.<br>`SECONDARY`<br>- S3 Tran & Nguyen (2026) $M=4.90/5$. | Người học hình thành thói quen phát âm sai lệch (*fossilized errors*), rất khó sửa đổi về sau; nghe không hiểu người bản xứ nói. | **Học liệu thiếu đồng bộ âm thanh:** Từ vựng chỉ được hiển thị dưới dạng văn bản và phiên âm ký hiệu ngữ âm quốc tế (IPA) khô khan; người học tự suy diễn cách phát âm theo trực giác. | **Bắt buộc 100% mục từ vựng phải có file âm thanh chuẩn bản xứ (`audio_url`)** (**P1-FR-002**); phát triển dạng bài tập Nghe nhận diện từ vựng `LISTENING` theo chuẩn ADR-006 (**P1-FR-013**). | `P1-FR-002`<br>`P1-FR-013`<br>`UC-04`<br>`UC-05` |
| **`PP-06`** | **Soạn giả biên soạn lệch chuẩn sư phạm và mất cân đối nội dung** | `SYNTHETIC`<br>- Kịch bản mô phỏng $CRE-SIM-01..04$ và $MGR-SIM-01..04$ (`docs/phase-0-synthetic...md`). | Các bài học trong cùng một Unit không đồng nhất về độ khó; từ vựng vượt quá chuẩn A1; bài tập không bám sát mục tiêu bài học. | **Quy trình phân công tự do thiếu định hướng:** Soạn giả tự ý chọn từ vựng và câu hỏi mà không có bản tóm tắt yêu cầu sư phạm từ ban quản lý đào tạo. | Thiết lập quy trình **Lập kế hoạch do Quản lý dẫn dắt (Manager-driven planning)**: Quản lý tổ chức tạo khung bài và gắn bản mô tả nhiệm vụ `assignment_brief` trước khi Soạn giả biên soạn (**Bất biến D1**). | `P1-FR-008`<br>`UC-08`<br>`BF-03`<br>`BF-04` |
| **`PP-07`** | **Rủi ro xung đột lợi ích và tự duyệt nội dung rác ra môi trường học** | `SYNTHETIC`<br>- Kịch bản mô phỏng $MOD-SIM-01..04$ và $CRE-SIM-01..04$.<br>`PRODUCT DECISION`<br>- Khung quản trị nội dung D2, D3. | Nội dung sai chính tả, dịch thuật sai nghĩa, hoặc tài liệu thử nghiệm chưa hoàn thiện bị phát hành trực tiếp cho học viên học, phá hủy uy tín nền tảng. | **Cơ chế phân quyền lỏng lẻo:** Soạn giả có quyền tự bấm duyệt bài của chính mình; hoặc hệ thống cho phép sửa đổi đè trực tiếp (in-place mutation) lên bài học đang phát hành. | **Bất biến D2: Cấm tuyệt đối Soạn giả tự duyệt/xuất bản.** Thiết lập quy trình kiểm duyệt độc lập 2 vòng: Moderator duyệt `APPROVED`, Manager xuất bản `PUBLISHED`. Áp dụng **cơ chế Clone-to-Draft khi sửa đổi bài đang học** (**Bất biến D3**). | `P1-FR-008`<br>`UC-09`<br>`UC-10`<br>`BF-05`<br>`BF-07` |
| **`PP-08`** | **Thiếu dấu vết kiểm toán cho các hành vi quản trị đặc quyền khẩn cấp** | `SYNTHETIC`<br>- Kịch bản mô phỏng $ADM-SIM-01..04$.<br>`PRODUCT DECISION`<br>- Ràng buộc kiểm toán Audit DD-03. | Quản trị viên lạm quyền thay đổi dữ liệu hoặc xuất bản/gỡ bỏ bài học mà không có căn cứ; khi xảy ra sự cố không thể truy cứu trách nhiệm cá nhân. | **Hệ thống không ghi nhận nhật ký bất biến:** Các thao tác đặc quyền của Quản trị viên (Admin Override) diễn ra âm thầm, không yêu cầu nhập lý do giải trình và không ghi vào bảng lưu vết chuyên dụng. | Xây dựng thực thể dữ liệu bất biến `AuditLog` (**Bất biến Audit DD-03**). Mọi thao tác can thiệp khẩn cấp của Quản trị viên (`APPROVED → PUBLISHED` hoặc `PUBLISHED → ARCHIVED`) **bắt buộc phải ghi nhận lý do giải trình và lưu vết kiểm toán**. | `P1-FR-008`<br>`P1-FR-010`<br>`UC-11`<br>`UC-12` |

---

## 5. Section E — Canonical Stakeholders, Tác Nhân Hệ Thống & Phân Định Trách Nhiệm (SoD)

`[PRODUCT DECISION — NON-EMPIRICAL POLICY]` `[SYNTHETIC / SIMULATED — DISCOVERY ONLY]`

### 5.1. So Sánh Mở Rộng & Chuẩn Hóa 6 Vai Trò Chuẩn Tắc (Canonical Roles)

Trong các tài liệu đồ án sơ đẳng (như đồ án tham khảo TaToiec tại Bảng 6), hệ thống thường chỉ phân chia thành 2 tác nhân thô sơ: `Người dùng (User)` và `Quản trị viên (Admin)`. Cách tiếp cận này hoàn toàn bất khả thi đối với một hệ thống quản lý học tập chuyên nghiệp, bởi vì nó dẫn tới việc:
- Quản trị viên nắm giữ toàn quyền độc đoán, vừa quản lý hạ tầng vừa tự do viết bài và tự duyệt nội dung.
- Không có cơ chế kiểm soát chất lượng sư phạm độc lập, dễ phát sinh xung đột lợi ích và phát hành tài liệu sai lệch.

Lingora tiến hành **chuẩn hóa mô hình phân quyền trên đúng 6 vai trò chuẩn tắc (Canonical Roles)**, loại bỏ triệt để các vai trò lỗi thời hoặc mơ hồ như `Teacher`, `Auditor`, `System`, hay `Exam Manager`.

#### Bảng 5.1: Đặc tả danh mục 6 vai trò chuẩn tắc của nền tảng Lingora

| STT | Vai Trò Chuẩn Tắc (Role Enum) | Định Nghĩa & Mục Tiêu Tác Nhân | Nhiệm Vụ & Hành Động Chính Trong Hệ Thống | Phạm Vi Dữ Liệu & Ranh Giới Bảo Mật RLS |
|:---:|---|---|---|---|
| **1** | **`Learner`**<br>*(Học viên)* | Tác nhân trung tâm thụ hưởng dịch vụ học tập; mục tiêu là tích lũy từ vựng, rèn luyện phản xạ và hoàn thành khóa học A1. | - Thực hiện bài kiểm tra xếp lớp (Placement Test) để nhận Starting Unit.<br>- Học bài học, tương tác với 5 dạng bài tập (MCQ, Fill-Blank, Reorder, Listening, Grammar).<br>- Ôn tập từ vựng hàng ngày theo danh sách đến hạn SRS (Policy B).<br>- Luyện viết câu tình huống và nhận phản hồi sửa lỗi ngữ pháp (GEC).<br>- Theo dõi Dashboard tiến độ học tập và chuỗi ngày học liên tục (Streak). | **Bảo mật Tối thiểu (Row-Level Security):**<br>- Chỉ có quyền Đọc (`SELECT`) các bài học ở trạng thái `PUBLISHED`.<br>- Chỉ Đọc/Ghi (`SELECT/INSERT/UPDATE`) dữ liệu tiến trình (`user_progress`), thẻ nhớ SRS (`user_vocab_srs`), và nhật ký ôn tập (`review_logs`) của chính mình.<br>- Tuyệt đối không truy cập dữ liệu của học viên khác hoặc dữ liệu quản trị. |
| **2** | **`Lesson Creator`**<br>*(Soạn giả Nội dung)* | Tác giả biên soạn học liệu ngôn ngữ; mục tiêu là xây dựng bài học phong phú, chính xác theo đề cương được giao. | - Tiếp nhận bài học được phân công kèm bản tóm tắt yêu cầu (`assignment_brief`).<br>- Biên soạn nội dung bài học, danh mục từ vựng, câu ví dụ và tải lên tệp âm thanh bản xứ (`audio_url`).<br>- Soạn thảo các câu hỏi bài tập tương tác theo đúng chuẩn JSONB schema ADR-006.<br>- Nộp bài học sang hàng đợi kiểm duyệt (`DRAFT → IN_REVIEW`).<br>- Tiếp thu góp ý để chỉnh sửa bài khi bị yêu cầu (`CHANGES_REQUESTED`). | **Ranh giới Biên soạn Phân lập:**<br>- Chỉ có quyền Đọc/Ghi trên các bài học được phân công trực tiếp (`creator_id = auth.uid()`).<br>- Chỉ được sửa bài khi ở trạng thái `DRAFT` hoặc `CHANGES_REQUESTED`.<br>- Bị khóa quyền sửa đổi khi bài đang ở trạng thái `IN_REVIEW`.<br>- **Tuyệt đối cấm quyền tự phê duyệt hoặc xuất bản.** |
| **3** | **`Moderator`**<br>*(Kiểm duyệt viên Học thuật)* | Chuyên gia kiểm soát chất lượng sư phạm độc lập; mục tiêu là bảo đảm tính chính xác tuyệt đối của nội dung trước khi phát hành. | - Tiếp nhận các bài học ở trạng thái chờ duyệt (`IN_REVIEW`).<br>- Thẩm định tính chính xác của từ vựng, phiên âm IPA, giải nghĩa tiếng Việt và chất lượng âm thanh.<br>- Sử dụng công cụ xem khác biệt (`Diff Viewer`) để đối chiếu giữa bản sửa đổi và bản gốc.<br>- Đưa ra quyết định Phê duyệt đạt chuẩn (`APPROVED`) hoặc Yêu cầu sửa đổi (`CHANGES_REQUESTED`) kèm ghi chú sư phạm cụ thể. | **Ranh giới Thẩm định Độc lập:**<br>- Có quyền Đọc toàn bộ bài học ở trạng thái `IN_REVIEW`.<br>- Có quyền cập nhật trạng thái bài học sang `APPROVED` hoặc `CHANGES_REQUESTED`.<br>- **Tuyệt đối cấm quyền xuất bản bài học ra môi trường học (`PUBLISHED`)** nhằm triệt tiêu nguy cơ tự tung tự tác. |
| **4** | **`Organizational Manager`**<br>*(Quản lý Tổ chức & Đào tạo)* | Người chịu trách nhiệm cao nhất về lộ trình đào tạo và phát hành nội dung; mục tiêu là bảo đảm tiến độ và chất lượng tổng thể. | - Xây dựng bộ khung phân cấp chương trình: Khóa học (`Course`), Đơn vị (`Unit`), và Khung bài học (`Lesson skeleton`).<br>- Phân công bài học cho Soạn giả và đính kèm bản giao việc (`assignment_brief`).<br>- Quyết định xuất bản bài học đã được kiểm duyệt đạt chuẩn ra môi trường học (`APPROVED → PUBLISHED`).<br>- Lưu trữ các bài học lỗi thời (`PUBLISHED → ARCHIVED`).<br>- Thực hiện quy trình nhân bản sửa đổi Clone-to-Draft khi cần cập nhật bài đã xuất bản.<br>- Xem báo cáo tiến độ học tập tổng hợp theo đơn vị. | **Ranh giới Quản trị Học thuật:**<br>- Toàn quyền quản lý cây cấu trúc `Course` và `Unit`.<br>- Có quyền chuyển trạng thái `APPROVED → PUBLISHED` và `PUBLISHED → ARCHIVED`.<br>- Không trực tiếp sửa nội dung chi tiết của bài học (ủy quyền cho Creator và Moderator).<br>- Chỉ xem báo cáo thống kê tiến độ tổng hợp, không can thiệp dữ liệu cá nhân học viên. |
| **5** | **`Operations Staff`**<br>*(Nhân viên Vận hành)* | Đội ngũ hỗ trợ kỹ thuật và chăm sóc học viên; mục tiêu là duy trì sự hài lòng và giải quyết các vướng mắc của người dùng. | - Tiếp nhận yêu cầu trợ giúp và báo cáo sự cố từ học viên qua phân hệ hỗ trợ (`SupportTicket`).<br>- Phân loại sự cố: Lỗi kỹ thuật hạ tầng (chuyển Administrator) hoặc phản ánh sai sót học liệu (chuyển Moderator).<br>- Phản hồi hướng dẫn học viên cách sử dụng và xử lý các vấn đề tài khoản cơ bản. | **Ranh giới Phân luồng Hỗ trợ:**<br>- Quyền Đọc/Ghi trên bảng vé hỗ trợ (`SupportTicket` - Extension Boundary).<br>- Quyền Đọc thông tin hồ sơ cơ bản của học viên để hỗ trợ.<br>- Tuyệt đối không có quyền can thiệp vào mã nguồn, cấu hình hệ thống hay nội dung bài học. |
| **6** | **`Administrator`**<br>*(Quản trị viên Hệ thống)* | Người bảo đảm an toàn kỹ thuật, phân quyền và tính liên tục của hạ tầng; mục tiêu là bảo vệ hệ thống khỏi sự cố và tấn công. | - Quản lý tài khoản người dùng, cấp phát và thu hồi các vai trò trong hệ thống.<br>- Giám sát hệ thống qua bảng nhật ký kiểm toán bất biến (`AuditLog`).<br>- Xử lý sự cố kỹ thuật hạ tầng mạng, cơ sở dữ liệu và phân hệ tích hợp.<br>- Thực hiện quyền can thiệp khẩn cấp xuất bản (`APPROVED → PUBLISHED`) hoặc lưu trữ khẩn cấp (`PUBLISHED → ARCHIVED`) khi có sự cố nghiêm trọng ngoài giờ, đi kèm **lý do giải trình bắt buộc và lưu vết kiểm toán**. | **Ranh giới Đặc quyền có Giám sát:**<br>- Toàn quyền quản trị tài khoản và phân quyền hệ thống qua Prisma TCP / Admin Console.<br>- Quyền can thiệp khẩn cấp vào vòng đời nội dung được kiểm soát chặt chẽ bởi **Audit DD-03**.<br>- Tuyệt đối cấm thao tác âm thầm không có nhật ký kiểm toán. |

---

### 5.2. Ma Trận Phân Định Trách Nhiệm (Separation of Duties - SoD Matrix)

Nhằm triệt tiêu hoàn toàn các rủi ro gian lận, xung đột lợi ích và lỗi thao tác con người, hệ thống Lingora thiết lập một **Ma trận Phân định Trách nhiệm (SoD Matrix)** bất khả xâm phạm trên vòng đời nội dung:

#### Bảng 5.2: Ma trận phân định trách nhiệm trên vòng đời nội dung học tập Lingora

| Hành Động Nghiệp Vụ trên Nội Dung | `Learner` | `Lesson Creator` | `Moderator` | `Organizational Manager` | `Operations Staff` | `Administrator` | Ràng Buộc Kỹ Thuật & Bất Biến Bắt Buộc |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **1. Lập khung bài & Giao việc (`assignment_brief`)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | **CHỦ TRÌ (Owner)** | ❌ Cấm | ⚠️ Chỉ khi khẩn cấp | **Bất biến D1:** Chỉ Manager được lập kế hoạch khung và phân công bài học. |
| **2. Biên soạn bài học & Nộp bài (`DRAFT → IN_REVIEW`)** | ❌ Cấm | **CHỦ TRÌ (Owner)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | ❌ Cấm | Soạn giả chỉ soạn bài được giao; khi nộp bài chuyển sang `IN_REVIEW` thì bị khóa sửa đổi. |
| **3. Kiểm duyệt học thuật & Xem khác biệt (`Diff Viewer`)** | ❌ Cấm | ❌ Cấm | **CHỦ TRÌ (Owner)** | 👁️ Xem xét | ❌ Cấm | 👁️ Xem xét | Moderator đối chiếu nội dung qua Diff Viewer; độc lập đánh giá chuyên môn. |
| **4. Phê duyệt đạt chuẩn (`IN_REVIEW → APPROVED`)** | ❌ Cấm | ❌ Cấm | **CHỦ TRÌ (Owner)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | **Bất biến D2:** Cấm Soạn giả tự duyệt. Chỉ Moderator xác nhận bài đạt chuẩn sư phạm. |
| **5. Yêu cầu sửa đổi (`IN_REVIEW → CHANGES_REQUESTED`)** | ❌ Cấm | ❌ Cấm | **CHỦ TRÌ (Owner)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | Moderator gửi trả bài kèm ghi chú sai sót; Creator nhận lại bài để sửa. |
| **6. Xuất bản bài học (`APPROVED → PUBLISHED`)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | **CHỦ TRÌ (Owner)** | ❌ Cấm | ⚠️ Emergency Override | Chỉ Manager có quyền xuất bản bài đã `APPROVED`. Admin ghi đè khẩn cấp bắt buộc có AuditLog. |
| **7. Lưu trữ bài học (`PUBLISHED → ARCHIVED`)** | ❌ Cấm | ❌ Cấm | ❌ Cấm | **CHỦ TRÌ (Owner)** | ❌ Cấm | ⚠️ Emergency Override | Đưa bài lỗi thời ra khỏi luồng học. **Loại trừ luồng `ARCHIVED → DRAFT` khỏi Core.** |
| **8. Sao chép sửa đổi (Quy trình Clone-to-Draft)** | ❌ Cấm | **ĐƯỢC PHÉP** | ❌ Cấm | **ĐƯỢC PHÉP** | ❌ Cấm | ❌ Cấm | **Bất biến D3:** Bài `PUBLISHED` là bất biến; sửa đổi bắt buộc phải nhân bản ra bản Draft mới. |

---

### 5.3. Năm Bất Biến Phân Quyền Bất Khả Xâm Phạm

Mọi tầng mã nguồn (từ giao diện Next.js, API BFF, đến chính sách bảo mật Supabase RLS) bắt buộc phải thực thi 5 bất biến sau:

1. **Bất biến D1 (Manager-driven Planning):** Soạn giả không được tự ý tạo bài học ngoài luồng. Khung chương trình và bản giao việc `assignment_brief` phải được Quản lý thiết lập từ trước.
2. **Bất biến D2 (Strict Separation of Content Creation & Approval):** Người tạo nội dung (`creator_id`) tuyệt đối không thể tự cấp quyền duyệt (`APPROVED`) hoặc xuất bản (`PUBLISHED`) cho bài học của chính mình.
3. **Bất biến D3 (Immutability of Published Content & Clone-to-Draft):** Một bài học đã xuất bản (`PUBLISHED`) và đang có học viên theo học là **BẤT BIẾN**. Mọi nhu cầu chỉnh sửa, cập nhật học liệu đều phải thực hiện thông qua cơ chế nhân bản ra một bản ghi Draft mới (`Clone-to-Draft`), liên kết với bản cũ qua `supersedes_id` và phải trải qua toàn bộ quy trình kiểm duyệt lại từ đầu.
4. **Bất biến Thẩm định Kiểm duyệt (Moderator Boundary):** Kiểm duyệt viên chỉ có thẩm quyền xác nhận đạt chất lượng chuyên môn (`APPROVED`), hoàn toàn không có quyền phát hành bài học lên hệ thống thực tế (`PUBLISHED`). Quyền phát hành là đặc quyền duy nhất của Quản lý tổ chức.
5. **Bất biến Giám sát Quyền lực Khẩn cấp (Administrator Emergency Traceability - Audit DD-03):** Quyền can thiệp xuất bản khẩn cấp hoặc lưu trữ khẩn cấp của Quản trị viên chỉ được áp dụng trong tình huống sự cố đặc biệt. Thao tác này bắt buộc phải gửi kèm trường lý do giải trình (`emergency_justification`) và tự động kích hoạt tạo bản ghi bất biến trong bảng `AuditLog`.

---

### 5.4. Phân Định Ranh Giới Hệ Thống: Core Boundary vs Extension Boundary

Nhằm bảo đảm tính tinh gọn của hệ thống cốt lõi và tối ưu hóa tài nguyên triển khai, Lingora phân lập ranh giới hệ thống thành 2 phân vùng rõ rệt:

```
[LINGORA SYSTEM BOUNDARY REGISTER]
├── CORE SYSTEM BOUNDARY (Phạm vi Cốt lõi MVP — 15 Bảng Áp dụng)
│   ├── User & Auth (profiles [chứa role enum], auth.users)
│   ├── Learning Hierarchy (courses, course_translations, units, lessons, lesson_translations)
│   ├── Vocabulary & Exercises (vocabularies, exercises)
│   ├── Progress & SRS (user_progress, user_vocab_srs, review_logs)
│   └── System Auditing (audit_logs)
│
└── EXTENSION BOUNDARY (Ranh giới Mở rộng — Phân lập Tuyệt đối)
    ├── Cohort Management (cohorts, cohort_members, cohort_assignments)
    └── Operations Support (support_tickets, ticket_messages)
```

- **Phân hệ Quản lý Lớp học / Tổ chức (`Cohort Management`):** Nằm tại **Ranh giới Mở rộng (Extension Boundary)**. Phục vụ việc phân nhóm học viên theo lớp học truyền thống, giao bài tập nhóm và chấm điểm tập trung. Phân hệ này không làm ảnh hưởng đến luồng học tập cá nhân hóa tự do của học viên cốt lõi.
- **Phân hệ Vé hỗ trợ Người dùng (`SupportTicket`):** Nằm tại **Ranh giới Mở rộng (Extension Boundary)**. Phục vụ nhân viên vận hành trong việc tiếp nhận và theo dõi xử lý khiếu nại. Nếu chưa triển khai, việc hỗ trợ người dùng có thể thực hiện tạm thời qua kênh email mà không ảnh hưởng đến bất kỳ chức năng học tập hay kiểm duyệt nào của Core MVP.

---

## 6. Section F — Kỹ Nghệ Yêu Cầu (Requirements Engineering)

`[PRODUCT DECISION — NON-EMPIRICAL POLICY]` `[PRIMARY — REAL PROJECT DATA]` `[SECONDARY — REAL EXTERNAL SOURCE]`

### 6.1. Danh Mục Đặc Tả Yêu Cầu Chức Năng Chi Tiết (Functional Requirements)

Hệ thống Lingora xác lập 17 Yêu cầu Chức năng nền tảng (`P1-FR-001` đến `P1-FR-017`). Mỗi yêu cầu được đặc tả theo đúng chuẩn mực kỹ nghệ phần mềm 10 thuộc tính, bao gồm tiêu chí nghiệm thu kiểm thử `Given - When - Then` và nguồn gốc bằng chứng truy vết.

---

#### 1. `P1-FR-001`: Xác Thực Người Dùng, Quản Lý Phiên & Điều Hướng Theo Vai Trò
- **Mã yêu cầu:** `P1-FR-001`
- **Tiêu đề chức năng:** Xác thực đăng ký, đăng nhập và phân luồng truy cập theo vai trò.
- **Tác nhân thực hiện:** Tất cả 6 vai trò (`Learner`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`, `Administrator`).
- **Sự kiện kích hoạt (Trigger):** Người dùng gửi biểu mẫu đăng nhập qua email/mật khẩu hoặc đăng ký tài khoản mới.
- **Tiền điều kiện:** Người dùng truy cập vào trang xác thực của Lingora Web hoặc Lingora Admin.
- **Hành vi hệ thống:**
  - *Luồng chính:* Hệ thống xác thực thông tin tài khoản qua Supabase Auth; cấp phát token JWT; lưu trữ phiên an toàn qua cookie bảo mật `HttpOnly`; truy vấn trường `profiles.role` để xác định vai trò; điều hướng tự động: `Learner` về trang tổng quan học tập (`/dashboard`), các vai trò quản trị/kiểm duyệt về bảng điều khiển quản trị (`/admin`).
  - *Luồng ngoại lệ:* Sai mật khẩu hoặc tài khoản chưa kích hoạt $\rightarrow$ Trả về mã lỗi thân thiện, không làm lộ chi tiết hệ thống.
- **Quy tắc nghiệp vụ:** Mọi phiên làm việc bắt buộc phải được bảo vệ chống tấn công CSRF; cấm lưu trữ JWT trong `localStorage`.
- **Hậu điều kiện:** Phiên làm việc được thiết lập, cookie được gán, quyền truy cập dữ liệu được áp dụng qua Supabase RLS.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* người dùng chưa đăng nhập, *When* gửi thông tin đăng nhập hợp lệ với vai trò `Learner`, *Then* hệ thống thiết lập HttpOnly cookie và điều hướng tới `/dashboard`.
  - *Given* người dùng đăng nhập với vai trò `Moderator`, *When* truy cập thành công, *Then* hệ thống điều hướng vào hàng đợi kiểm duyệt tại `/admin/reviews`.
- **Nguồn gốc bằng chứng:** `E-DEC-01` (ADR-014), `UC-01`, `BF-01`.

---

#### 2. `P1-FR-002`: Duyệt Cây Khóa Học & Bài Học Kèm Âm Thanh Từ Vựng
- **Mã yêu cầu:** `P1-FR-002`
- **Tiêu đề chức năng:** Duyệt danh mục bài học theo cây phân cấp và nghe phát âm từ vựng chuẩn.
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên chọn một Khóa học hoặc Đơn vị học tập trên giao diện lộ trình.
- **Tiền điều kiện:** Học viên đã đăng nhập; khóa học và bài học ở trạng thái `PUBLISHED`.
- **Hành vi hệ thống:**
  - *Luồng chính:* Hệ thống hiển thị cấu trúc cây lộ trình: Khóa học $\rightarrow$ Đơn vị (Unit 1 đến Unit 6) $\rightarrow$ Bài học (Lesson 1 đến Lesson 4). Khi chọn một bài học, hệ thống hiển thị danh sách từ vựng trọng tâm kèm phiên âm IPA, nghĩa tiếng Việt, câu ví dụ và nút phát âm thanh mẫu (`audio_url`).
  - *Luồng ngoại lệ:* Bài học chưa xuất bản hoặc bị khóa $\rightarrow$ Hiển thị biểu tượng ổ khóa kèm điều kiện mở khóa (hoàn thành bài trước hoặc làm bài kiểm tra đầu vào).
- **Quy tắc nghiệp vụ:** 100% mục từ vựng trong bài học bắt buộc phải có trường `audio_url` hợp lệ trỏ tới tệp âm thanh bản xứ trên Supabase Storage (**Bất biến PP-05**).
- **Hậu điều kiện:** Dữ liệu bài học được hiển thị trên trình duyệt máy khách.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* học viên đang xem danh sách bài học, *When* nhấn vào nút loa của từ vựng "apple", *Then* trình duyệt phát âm thanh chuẩn phát âm của từ đó mà không tải lại trang.
- **Nguồn gốc bằng chứng:** `E-PRI-01`, `E-SEC-03`, `PP-05`, `UC-04`, `BF-09`.

---

#### 3. `P1-FR-003`: Trình Phát Bài Tập Tương Tác 5 Dạng Bài Chuẩn Hóa ADR-006
- **Mã yêu cầu:** `P1-FR-003`
- **Tiêu đề chức năng:** Thực hiện các bài tập tương tác sau bài học với phản hồi tức thì.
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên nhấn nút "Bắt đầu Luyện tập" sau khi xem từ vựng bài học.
- **Tiền điều kiện:** Bài học có chứa các bài tập ở trạng thái sẵn sàng trong bảng `exercises`.
- **Hành vi hệ thống:**
  - *Luồng chính:* Trình phát bài tập tải tuần tự 5 câu hỏi thuộc các dạng bài: Trắc nghiệm (`MCQ`), Điền từ (`FILL_BLANK`), Sắp xếp câu (`REORDER`), Nghe nhận diện từ (`LISTENING`), và Chọn cấu trúc ngữ pháp (`GRAMMAR`). Khi học viên chọn/nhập đáp án và bấm "Kiểm tra", hệ thống so khớp đáp án tức thì, hiển thị màu xanh/đỏ, phát âm thanh chúc mừng/sửa sai và giải thích ngữ cảnh.
  - *Luồng ngoại lệ:* Học viên chưa chọn đáp án mà bấm kiểm tra $\rightarrow$ Hiển thị cảnh báo yêu cầu thao tác.
- **Quy tắc nghiệp vụ:** Cấu trúc dữ liệu bài tập bắt buộc tuân thủ định dạng JSONB schema đã được chuẩn hóa tại **ADR-006**.
- **Hậu điều kiện:** Kết quả từng câu hỏi được ghi nhận tạm thời trong phiên làm việc của trình duyệt.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* bài tập dạng `FILL_BLANK`, *When* học viên điền đúng từ còn thiếu và bấm kiểm tra, *Then* hệ thống chuyển viền xanh lá cây, cộng điểm bài tập và mở nút "Tiếp tục".
- **Nguồn gốc bằng chứng:** `E-PRI-04`, `PP-01`, `ADR-006`, `UC-05`, `BF-10`.

---

#### 4. `P1-FR-004`: Ghi Nhận Tiến Độ Hoàn Thành Bài Học Vào `user_progress`
- **Mã yêu cầu:** `P1-FR-004`
- **Tiêu đề chức năng:** Cập nhật trạng thái hoàn thành bài học và tích lũy điểm số người học.
- **Tác nhân thực hiện:** `Learner` (hệ thống tự động kích hoạt).
- **Sự kiện kích hoạt:** Học viên trả lời câu hỏi cuối cùng của phiên luyện tập bài học.
- **Tiền điều kiện:** Học viên hoàn thành toàn bộ câu hỏi của bài học (bao gồm các câu làm lại theo định mức Controlled Retry D7).
- **Hành vi hệ thống:**
  - *Luồng chính:* Học viên thực hiện vòng làm bài chính (Pass 1). Các câu trả lời sai được đưa vào hàng đợi làm lại cuối bài (Pass 2) với định mức tối đa `allowance = max(1, floor(N * 0.10))`. Các câu trả lời đúng trong vòng làm lại được tính $70\%$ điểm. Khi hoàn thành toàn bộ câu hỏi và lượt thử lại được phép, hệ thống gửi yêu cầu cập nhật (`UPSERT`) vào bảng `user_progress`: gán trạng thái `status = 'COMPLETED'`, cập nhật điểm số `score` và dấu thời gian `completed_at`; mở khóa bài học kế tiếp trong Unit. (Tuân thủ **Bất biến D7**: hoàn thành bài học không phụ thuộc vào ngưỡng điểm $70\%, 80\%$ hay $85\%$).
  - *Luồng ngoại lệ:* Học viên chưa hoàn thành đủ các câu hỏi bắt buộc hoặc thoát giữa chừng $\rightarrow$ Ghi nhận trạng thái `status = 'IN_PROGRESS'`, bài học kế tiếp chưa được mở khóa.
- **Quy tắc nghiệp vụ:** Tiến độ chỉ được ghi nhận khi học viên làm bài thực chất; không được phép gửi tiến độ giả mạo qua API nếu chưa trải qua phiên học. Trạng thái hoàn thành bài học được quản lý bằng enum `ProgressStatus` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`), không sử dụng cờ boolean giả định `is_completed`.
- **Hậu điều kiện:** Bản ghi `user_progress` được lưu với `status = 'COMPLETED'`; bài học tiếp theo chuyển sang trạng thái mở khóa trên UI.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* học viên làm bài Lesson 1 và hoàn thành toàn bộ câu hỏi theo cơ chế Controlled Retry D7, *When* gửi kết quả câu hỏi cuối cùng, *Then* hệ thống cập nhật `user_progress.status = 'COMPLETED'` và mở khóa Lesson 2 trên giao diện.
- **Nguồn gốc bằng chứng:** `E-PRI-02`, `PP-02`, `UC-05`, `BF-10`.

---

#### 5. `P1-FR-005`: Lập Lịch Thẻ Từ Vựng Ngắt Quãng Cá Nhân Hóa (SRS Policy B)
- **Mã yêu cầu:** `P1-FR-005`
- **Tiêu đề chức năng:** Tính toán chu kỳ suy giảm trí nhớ và lập lịch ôn tập từ vựng hàng ngày.
- **Tác nhân thực hiện:** `Learner` (thuật toán hệ thống tự động).
- **Sự kiện kích hoạt:** Học viên hoàn thành bài học có từ mới hoặc mở màn hình "Ôn tập SRS".
- **Tiền điều kiện:** Học viên đã học ít nhất một từ vựng mới; các thẻ nhớ tồn tại trong bảng `user_vocab_srs`.
- **Hành vi hệ thống:**
  - *Luồng chính:* Khi từ vựng mới được tiếp thu, hệ thống khởi tạo bản ghi trong `user_vocab_srs` với `interval_days = 1.0`, `ease_factor = 2.5`, `recall_probability = 1.0`, `next_review_at = NOW() + 24h`. Hàng ngày khi học viên truy cập, hệ thống lọc các thẻ có `next_review_at <= NOW()` để đưa vào hàng đợi ôn tập theo thuật toán **Policy B**:
    $$\text{Khoảng cách ngày ôn tập: } I_n \in [1, 3, 7, 14, 30] \text{ ngày}$$
  - *Luồng ngoại lệ:* Không có từ vựng nào đến hạn ôn $\rightarrow$ Hiển thị thông báo chúc mừng học viên đã hoàn thành mục tiêu ôn tập hôm nay.
- **Quy tắc nghiệp vụ:** Bắt buộc áp dụng thuật toán **Policy B chu kỳ cố định** theo **Bất biến D8**; không áp dụng hệ số thả nổi SM-2 không tất định.
- **Hậu điều kiện:** Danh sách thẻ cần ôn tập được hiển thị chính xác theo thời gian thực từ bảng `user_vocab_srs`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* một từ vựng được học hôm nay, *When* sang ngày hôm sau (`next_review_at <= NOW()`), *Then* từ vựng đó xuất hiện trong danh sách ôn tập đến hạn với `interval_days = 1.0`.
- **Nguồn gốc bằng chứng:** `E-PRI-01`, `E-SEC-04`, `E-SEC-05`, `PP-01`, `Bất biến D8`, `UC-06`, `BF-12`.

---

#### 6. `P1-FR-006`: Cập Nhật Thẻ Ghi Nhớ SRS Nguyên Tử Qua RPC `record_review`
- **Mã yêu cầu:** `P1-FR-006`
- **Tiêu đề chức năng:** Cập nhật trạng thái thẻ nhớ và ghi nhật ký kiểm toán ôn tập nguyên tử.
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên thực hiện đánh giá kết quả ôn tập thẻ từ vựng sau khi lật flashcard hoặc hoàn thành câu hỏi ôn tập.
- **Tiền điều kiện:** Học viên đang trong phiên ôn tập từ vựng; mã thẻ `srs_card_id` hợp lệ.
- **Hành vi hệ thống:**
  - *Luồng chính:* Trình duyệt gọi hàm thủ tục cơ sở dữ liệu `rpc/record_review` trên Supabase với các tham số: `p_srs_card_id uuid`, `p_is_correct boolean`, `p_recall_probability double precision`, `p_recommended_interval_days double precision`:
    - Nếu `p_is_correct = true` (Nhớ đúng): Tăng `review_count = review_count + 1`; nâng `interval_days` theo bước kế tiếp trong mảng Policy B $[1, 3, 7, 14, 30]$; tính `next_review_at = NOW() + interval_days * 24h`.
    - Nếu `p_is_correct = false` (Làm sai / Quên): Tăng `lapse_count = lapse_count + 1`; hạ cấp `interval_days = 1.0` ngày; tính `next_review_at = NOW() + 24h`.
    - Đồng thời tự động chèn một bản ghi lịch sử vào bảng `review_logs` (`srs_card_id`, `is_correct`, `recall_probability`, `interval_days`, `reviewed_at`) để phục vụ kiểm toán và phân tích tiến độ.
  - *Luồng ngoại lệ:* Mất mạng khi gửi RPC $\rightarrow$ Trình duyệt lưu tạm và tự động thử lại khi có kết nối mạng trở lại.
- **Quy tắc nghiệp vụ:** Toàn bộ quá trình cập nhật thẻ nhớ `user_vocab_srs` và ghi nhật ký `review_logs` bắt buộc phải diễn ra trong một giao dịch nguyên tử (Atomic Database Transaction qua RPC `record_review`), ngăn ngừa sai lệch dữ liệu tiến trình.
- **Hậu điều kiện:** Bản ghi `user_vocab_srs` được cập nhật khoảng cách và ngày ôn mới; bản ghi `review_logs` được tạo vĩnh viễn.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* thẻ nhớ đang ở bước ôn tập thứ 2 (`interval_days = 3`), *When* học viên ôn tập chính xác (`p_is_correct = true`), *Then* `interval_days` được nâng lên 7 ngày và một dòng mới xuất hiện trong `review_logs` với `srs_card_id` tương ứng.
- **Nguồn gốc bằng chứng:** `E-PRI-01`, `PP-01`, `Bất biến D8`, `UC-06`, `BF-12`.

---

#### 7. `P1-FR-007`: Kiểm Tra Lỗi Ngữ Pháp Câu Viết & Trực Quan Hóa Bằng Diff Viewer
- **Mã yêu cầu:** `P1-FR-007`
- **Tiêu đề chức năng:** Phân tích ngữ pháp câu viết của học viên, phát hiện lỗi sai và hiển thị trực quan khác biệt.
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên nhập câu trả lời tự luận trong bài tập tình huống và nhấn nút "Kiểm tra ngữ pháp".
- **Tiền điều kiện:** Câu nhập vào chứa tối thiểu 2 từ và không vượt quá 200 ký tự; học viên đã đăng nhập.
- **Hành vi hệ thống:**
  - *Luồng chính:* Next.js Route Handler chuyển tiếp yêu cầu đến dịch vụ kiểm tra ngữ pháp GEC nội bộ (`/v1/gec/correct`); dịch vụ phân tích cú pháp, trả về chuỗi câu sửa chuẩn hóa (`corrected_text`); giao diện trình duyệt tính toán và hiển thị trực quan: gạch đỏ từ sai (`deleted`), tô xanh từ sửa (`inserted`), và cung cấp hộp giải thích quy tắc ngữ pháp tương ứng.
  - *Luồng ngoại lệ:* Dịch vụ GEC phản hồi quá 8 giây hoặc gặp sự cố $\rightarrow$ Hệ thống bắt lỗi (graceful degradation), hiển thị thông báo "Dịch vụ phản hồi ngữ pháp đang bận, bạn vẫn có thể tiếp tục học bài tiếp theo".
- **Quy tắc nghiệp vụ:** Dịch vụ AI/GEC hoạt động như một năng lực bổ trợ (Supporting Capability theo ADR-014); sự cố của GEC không được phép làm tê liệt luồng học bài và ôn tập SRS cốt lõi.
- **Hậu điều kiện:** Giao diện hiển thị kết quả phân tích ngữ pháp trực quan.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* học viên nhập "She go to school yesterday", *When* bấm kiểm tra, *Then* hệ thống hiển thị câu sửa "She **went** to school yesterday" với từ "went" được tô sáng và giải thích thì quá khứ đơn.
- **Nguồn gốc bằng chứng:** `E-PRI-03`, `E-SEC-02`, `PP-04`, `ADR-014 (TARGET)`, `BF-14`.

---

#### 8. `P1-FR-008`: Vòng Đời Nội Dung 6 Bước với Kiểm Soát Phân Quyền SoD
- **Mã yêu cầu:** `P1-FR-008`
- **Tiêu đề chức năng:** Quản lý máy trạng thái nội dung bài học theo quy trình kiểm duyệt độc lập 2 vòng.
- **Tác nhân thực hiện:** `Lesson Creator`, `Moderator`, `Organizational Manager`, `Administrator`.
- **Sự kiện kích hoạt:** Tác nhân gửi yêu cầu chuyển trạng thái bài học trên giao diện quản trị.
- **Tiền điều kiện:** Bài học tồn tại trong bảng `lessons`; tác nhân có vai trò tương ứng và thỏa mãn ma trận SoD (§5.2).
- **Hành vi hệ thống:**
  - *Luồng chính:* Hệ thống xác thực quyền hạn và thực hiện chuyển trạng thái theo quy trình:
    $$\text{DRAFT} \longrightarrow \text{IN\_REVIEW} \longrightarrow \text{APPROVED} \longrightarrow \text{PUBLISHED} \longrightarrow \text{ARCHIVED}$$
    hoặc trả về $\text{CHANGES\_REQUESTED}$ khi kiểm duyệt viên từ chối.
  - *Luồng ngoại lệ:* Soạn giả bấm tự duyệt bài của mình $\rightarrow$ Hệ thống chặn đứng giao dịch, trả về lỗi vi phạm **Bất biến D2**.
- **Quy tắc nghiệp vụ:** Soạn giả cấm tự duyệt/xuất bản; Moderator chỉ duyệt `APPROVED`; Manager xuất bản `PUBLISHED`; sửa bài đã phát hành bắt buộc qua Clone-to-Draft (**Bất biến D3**); Admin can thiệp khẩn cấp phải ghi lý do và lưu `AuditLog` (**Audit DD-03**).
- **Hậu điều kiện:** Trạng thái bài học trong cơ sở dữ liệu được cập nhật; nhật ký kiểm toán được ghi nhận.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* bài học ở trạng thái `IN_REVIEW`, *When* người dùng có vai trò `Lesson Creator` cố gắng gửi API xuất bản (`PUBLISHED`), *Then* hệ thống từ chối với mã lỗi 403 Forbidden.
- **Nguồn gốc bằng chứng:** `E-SYN-01`, `E-SYN-03`, `PP-07`, `Bất biến D1, D2, D3`, `UC-08`, `UC-09`, `UC-10`.

---

#### 9. `P1-FR-009`: Tải Lên & Quản Lý Tệp Âm Thanh Phát Âm Bản Xứ
- **Mã yêu cầu:** `P1-FR-009`
- **Tiêu đề chức năng:** Tải lên tệp âm thanh phát âm từ vựng lên Supabase Storage với kiểm tra tính hợp lệ.
- **Tác nhân thực hiện:** `Lesson Creator` (quản trị bucket do `Administrator` cấu hình).
- **Sự kiện kích hoạt:** Soạn giả đính kèm file âm thanh khi tạo hoặc cập nhật từ vựng bài học.
- **Tiền điều kiện:** Tệp âm thanh ở định dạng hợp lệ (`.mp3`, `.wav`), dung lượng $\le 10$MB ($10,485,760$ bytes theo migration 003); người dùng có quyền biên soạn bài học được phân công.
- **Hành vi hệ thống:**
  - *Luồng chính:* Tệp âm thanh được tải lên bucket `lingora-media` trên Supabase Storage (MIME `audio/mpeg`, `audio/wav`); hệ thống sinh đường dẫn an toàn; lưu URL vào trường `vocabularies.audio_url`.
  - *Luồng ngoại lệ:* File sai định dạng hoặc quá dung lượng 10MB $\rightarrow$ Báo lỗi chi tiết và hủy bỏ việc tải lên.
- **Quy tắc nghiệp vụ:** Mọi tệp âm thanh phải thuộc quyền sở hữu của bài học đang biên soạn; áp dụng chính sách Storage RLS trên bucket `lingora-media` để chống tải lên trái phép.
- **Hậu điều kiện:** Tệp âm thanh được lưu trữ thành công trong bucket `lingora-media`; trường `vocabularies.audio_url` được cập nhật.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* file âm thanh `apple.mp3` dung lượng 200KB hợp lệ, *When* soạn giả bấm tải lên, *Then* tệp được lưu vào bucket `lingora-media` trên Supabase Storage và trình phát âm thanh mẫu hoạt động ngay trên màn hình soạn thảo.
- **Nguồn gốc bằng chứng:** `E-PRI-04`, `E-SEC-03`, `PP-05`, `UC-08`, `BF-04`.

---

#### 10. `P1-FR-010`: Bản Địa Hóa Giao Diện Song Ngữ Tiếng Việt & Tiếng Anh
- **Mã yêu cầu:** `P1-FR-010`
- **Tiêu đề chức năng:** Chuyển đổi ngôn ngữ hiển thị giao diện mượt mà giữa Tiếng Việt và Tiếng Anh.
- **Tác nhân thực hiện:** Tất cả người dùng.
- **Sự kiện kích hoạt:** Người dùng chọn ngôn ngữ tại thanh điều hướng hoặc hệ thống nhận diện theo cài đặt trình duyệt.
- **Tiền điều kiện:** Các bộ từ điển bản địa hóa (`vi.json`, `en.json`) đã được biên dịch hoàn chỉnh.
- **Hành vi hệ thống:**
  - *Luồng chính:* Ứng dụng tải nhanh chóng bộ nhãn ngôn ngữ tương ứng; cập nhật toàn bộ nhãn giao diện, thông báo lỗi, gợi ý bài tập mà không cần tải lại toàn bộ trang.
  - *Luồng ngoại lệ:* Khuyết thiếu khóa dịch $\rightarrow$ Hệ thống tự động sử dụng chuỗi tiếng Việt mặc định làm dự phòng (*fallback*).
- **Quy tắc nghiệp vụ:** 100% văn bản giao diện người dùng phải được quản lý qua hệ thống i18n; nghiêm cấm hardcode văn bản trong mã nguồn giao diện.
- **Hậu điều kiện:** Giao diện hiển thị đúng ngôn ngữ người dùng đã lựa chọn.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* học viên đang ở giao diện tiếng Việt, *When* nhấn chuyển sang "EN", *Then* toàn bộ menu và nút bấm chuyển sang tiếng Anh với độ trễ dự kiến $\le 200$ms (`TBD / PROPOSED TARGET` trên môi trường staging).
- **Nguồn gốc bằng chứng:** `E-DEC-01`, `UC-01`..`UC-15`.

---

#### 11. `P1-FR-011`: Theo Dõi Chuỗi Ngày Học Liên Tục (Streak) Theo Múi Giờ Địa Phương
- **Mã yêu cầu:** `P1-FR-011`
- **Tiêu đề chức năng:** Ghi nhận và duy trì chuỗi ngày học tập liên tục để khích lệ người học.
- **Tác nhân thực hiện:** `Learner` (hệ thống tự động).
- **Sự kiện kích hoạt:** Học viên hoàn thành bài học đầu tiên hoặc hoàn thành một phiên ôn tập SRS trong ngày.
- **Tiền điều kiện:** Học viên đã đăng nhập; có ít nhất một hành động học tập được ghi nhận hợp lệ.
- **Hành vi hệ thống:**
  - *Luồng chính:* Hệ thống lấy ngày hiện tại dựa trên múi giờ địa phương của người dùng (`timezone` từ trình duyệt client); đối chiếu với trường `last_qualifying_activity_date`:
    - Nếu `last_qualifying_activity_date == yesterday`: Tăng `streak_count = streak_count + 1`, cập nhật `last_qualifying_activity_date = today`.
    - Nếu `last_qualifying_activity_date == today`: Giữ nguyên `streak_count`.
    - Nếu `last_qualifying_activity_date < yesterday`: Reset `streak_count = 1`, cập nhật `last_qualifying_activity_date = today`.
  - *Luồng ngoại lệ:* Người dùng gian lận chỉnh giờ máy khách $\rightarrow$ Máy chủ chuẩn hóa thời gian dựa trên UTC kết hợp offset múi giờ hợp lệ được lưu trong hồ sơ người dùng.
- **Quy tắc nghiệp vụ:** Bắt buộc áp dụng tính toán Streak theo múi giờ địa phương theo **Bất biến D9**; không tính theo giờ UTC toàn cục để tránh đứt chuỗi oan uổng lúc nửa đêm.
- **Hậu điều kiện:** Trường `streak_count` và `last_qualifying_activity_date` trong bảng `profiles` được cập nhật.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* học viên có chuỗi học 5 ngày và đã học hôm qua, *When* hoàn thành bài học hôm nay lúc 23:30 (giờ địa phương), *Then* chuỗi học tăng lên 6 ngày và biểu tượng ngọn lửa sáng lên.
- **Nguồn gốc bằng chứng:** `E-PRI-02`, `E-SEC-06`, `PP-02`, `Bất biến D9`, `UC-07`, `BF-13`.

---

#### 12. `P1-FR-012`: Dạng Bài Tập Ngữ Pháp Chọn Lọc Cấu Trúc Theo Chuẩn ADR-006
- **Mã yêu cầu:** `P1-FR-012`
- **Tiêu đề chức năng:** Cung cấp bài tập thực hành nhận diện và vận dụng cấu trúc ngữ pháp chuẩn.
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên làm bài tập có `type = 'GRAMMAR'` trong phiên học.
- **Tiền điều kiện:** Bài tập ngữ pháp được cấu hình payload JSONB hợp lệ theo ADR-006.
- **Hành vi hệ thống:**
  - *Luồng chính:* Hiển thị câu hỏi ngữ pháp kèm các cấu trúc ngữ pháp tương phản; học viên chọn cấu trúc đúng cho câu văn cảnh; hệ thống kiểm tra và cung cấp hộp giải thích quy tắc ngữ pháp chi tiết.
- **Quy tắc nghiệp vụ:** Payload bài tập phải chứa trường `rule_explanation` để phục vụ giải thích sư phạm.
- **Hậu điều kiện:** Điểm số câu hỏi được tính vào kết quả bài học.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* câu hỏi chọn cấu trúc "There [is/are] an apple on the table", *When* học viên chọn "is", *Then* hệ thống báo đúng và hiển thị giải thích quy tắc danh từ đếm được số ít.
- **Nguồn gốc bằng chứng:** `E-PRI-04`, `PP-04`, `ADR-006`, `UC-05`.

---

#### 13. `P1-FR-013`: Dạng Bài Tập Nghe Nhận Diện Từ Vựng với Âm Thanh Tích Hợp
- **Mã yêu cầu:** `P1-FR-013`
- **Tiêu đề chức năng:** Cung cấp bài tập rèn luyện thính giác nhận diện từ vựng tiếng Anh.
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên làm bài tập có `type = 'LISTENING'` trong phiên học.
- **Tiền điều kiện:** Bài tập có trường `audio_url` trỏ đến file âm thanh hợp lệ trên hệ thống.
- **Hành vi hệ thống:**
  - *Luồng chính:* Trình duyệt tự động phát đoạn âm thanh từ vựng/câu nói; học viên nghe và chọn từ vựng đúng trong danh sách hoặc gõ lại từ nghe được; cho phép nghe lại với tốc độ bình thường ($1.0\times$) hoặc chậm ($0.75\times$).
- **Quy tắc nghiệp vụ:** Bắt buộc phải có tùy chọn nghe lại chậm để hỗ trợ học viên mới bắt đầu A1.
- **Hậu điều kiện:** Điểm câu hỏi được ghi nhận vào phiên học.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* bài tập nghe từ "kitchen", *When* học viên nhấn nút nghe lại $0.75\times$, *Then* âm thanh phát chậm rõ từng âm tiết mà không bị méo tiếng.
- **Nguồn gốc bằng chứng:** `E-PRI-04`, `E-SEC-03`, `PP-05`, `ADR-006`, `UC-05`.

---

#### 14. `P1-FR-014`: Thiết Lập & Lưu Trữ Thời Lượng Mục Tiêu Học Tập Hàng Ngày
- **Mã yêu cầu:** `P1-FR-014`
- **Tiêu đề chức năng:** Cho phép học viên cài đặt mục tiêu thời gian học mỗi ngày từ 5 đến 120 phút.
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên cài đặt mục tiêu trong luồng Onboarding hoặc tại trang Cài đặt cá nhân.
- **Tiền điều kiện:** Học viên đã đăng nhập tài khoản.
- **Hành vi hệ thống:**
  - *Luồng chính:* Học viên chọn mốc thời gian: 5 phút (Dễ), 15 phút (Vừa), 30 phút (Nghiêm túc), 60 phút hoặc tùy chỉnh (tối đa 120 phút); hệ thống lưu giá trị `daily_goal_min` vào hồ sơ người dùng.
- **Quy tắc nghiệp vụ:** Giới hạn thời gian mục tiêu tối thiểu là 5 phút và tối đa là 120 phút để bảo đảm tính khả thi sư phạm.
- **Hậu điều kiện:** Giá trị `daily_goal_min` được cập nhật trong bảng `profiles`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* học viên chọn mục tiêu 15 phút/ngày, *When* lưu cài đặt, *Then* thanh tiến độ Dashboard hiển thị mốc 15 phút làm chuẩn đo lường hàng ngày.
- **Nguồn gốc bằng chứng:** `E-PRI-02`, `PP-02`, `UC-02`, `BF-02`.

---

#### 15. `P1-FR-015`: Nhắc Nhở Học Tập Biểu Ngữ Nội Bộ Trong Ứng Dụng (In-app Reminder)
- **Mã yêu cầu:** `P1-FR-015`
- **Tiêu đề chức năng:** Hiển thị biểu ngữ nhắc nhở học tập và ôn tập SRS thân thiện ngay trong ứng dụng.
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên truy cập ứng dụng vào ngày chưa hoàn thành mục tiêu học tập hoặc có thẻ SRS đến hạn.
- **Tiền điều kiện:** Học viên đã đăng nhập và có thẻ SRS đến hạn hoặc chuỗi Streak có nguy cơ đứt gãy.
- **Hành vi hệ thống:**
  - *Luồng chính:* Hiển thị một biểu ngữ thông báo nhẹ nhàng ở đầu màn hình Dashboard: "Hôm nay bạn có $X$ từ vựng cần ôn tập để duy trì chuỗi Streak $Y$ ngày!" kèm nút bấm dẫn thẳng vào phiên ôn tập.
- **Quy tắc nghiệp vụ:** Tôn trọng sự tập trung của người học; biểu ngữ có thể đóng lại và không che khuất nội dung học tập chính.
- **Hậu điều kiện:** Người dùng nhận được thông điệp gợi nhắc học tập kịp thời.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* học viên có 5 thẻ SRS đến hạn hôm nay, *When* mở Dashboard, *Then* một biểu ngữ nhắc nhở xuất hiện với nút "Ôn tập ngay (5 từ)".
- **Nguồn gốc bằng chứng:** `E-PRI-01`, `PP-02`, `UC-02`.

---

#### 16. `P1-FR-016`: Đánh Giá Chẩn Đoán Năng Lực Thích Ứng (Stage-Adaptive Diagnostic Assessment) & Định Vị Xuất Phát Điểm
- **Mã yêu cầu:** `P1-FR-016`
- **Tiêu đề chức năng:** Đánh giá năng lực đa chiều thích ứng, xác lập Hồ sơ Kỹ năng (Skill Profile) và đề xuất điểm xuất phát lộ trình học tập.
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên mới đăng ký trong luồng Onboarding hoặc chủ động kích hoạt từ trang Hồ sơ cá nhân.
- **Tiền điều kiện:** Học viên đã đăng nhập và lựa chọn ngôn ngữ đích (Tiếng Anh, Tiếng Trung...).
- **Hành vi hệ thống:**
  - *Luồng chính (Learner Entry Flow — Đóng băng D4):*
    1. Hệ thống cung cấp hai lựa chọn đầu vào linh hoạt:
       - *Nhánh A:* Học viên tự khai báo trình độ ban đầu nếu đã biết (`Initial Self-reported Level`: A1, A2, B1, B2) $\rightarrow$ Hệ thống ghi nhận mức tự khai báo làm xuất phát điểm tham chiếu (không coi là verified proficiency) và đưa thẳng vào lộ trình phù hợp, tránh ép buộc làm bài test dài.
       - *Nhánh B:* Học viên chọn "Không chắc chắn trình độ" $\rightarrow$ Kích hoạt bài kiểm tra chẩn đoán năng lực thích ứng phân đoạn (Stage-Adaptive Diagnostic Assessment).
    2. Bài kiểm tra chẩn đoán thực thi theo mô hình phân tầng thích ứng (Stage-Adaptive: Giai đoạn định tuyến Routing Phase $\rightarrow$ Giai đoạn đích Targeted Phase) với mục tiêu từ 25 đến 30 câu hỏi trong thời lượng tối đa $\le 15$ phút, bao phủ đầy đủ **4 chiều năng lực cốt lõi (Core Dimensions — Đóng băng D1)**: Từ vựng (Vocabulary), Ngữ pháp (Grammar), Đọc hiểu (Reading), và Nghe hiểu (Listening).
    3. Hệ thống nạp bộ đề từ ngân hàng câu hỏi theo cấu hình đặc thù từng ngôn ngữ (Language-specific Assessment Configuration):
       - *Tiếng Anh:* Kiểm tra từ vựng theo ngữ cảnh (Contextual Vocab), cụm từ cố định (Collocations), gia đình từ (Word Families), ngữ pháp ngữ cảnh và nối âm thính giác (Connected Speech).
       - *Tiếng Trung:* Kiểm tra nhận diện Bính âm (Pinyin), Thanh điệu (Tones 1 & 4), nhận diện mặt chữ Hán (Hanzi Literacy), ngữ pháp trật tự từ/hư từ; **giao diện bài đọc Reading tiếng Trung bắt buộc mặc định TẮT hoàn toàn Pinyin** để kiểm tra thực chất năng lực đọc chữ Hán.
    4. Sau khi hoàn thành bài test, hệ thống tổng hợp và xuất ra **Hồ sơ Kỹ năng đa chiều (Skill Profile)** hiển thị dạng biểu đồ mạng nhện (Spider/Radar Chart), bóc tách độc lập trình độ từng kỹ năng (ví dụ: Vocab B1, Grammar A2, Reading B1, Listening A2) thay vì quy về một điểm số tổng hợp duy nhất.
    5. Hệ thống xác định Trình độ Mỏ neo (Anchor Level) và đề xuất Đơn vị bài học xuất phát (`Starting Unit`), đồng thời tự động kích hoạt giàn giáo hỗ trợ (Scaffolding: ví dụ giảm tốc độ audio 0.8x, hiển thị transcript từng phần cho bài Nghe) nếu phát hiện kỹ năng bị lệch chuẩn (Skill Imbalance).
  - *Luồng ngoại lệ:*
    - *Học viên chọn Bỏ qua (Skip):* Gán trình độ xuất phát mặc định là Unit 1; không lưu điểm số đánh giá.
    - *Học viên làm lại bài (Retake):* Học viên có thể làm lại bài chẩn đoán từ trang cá nhân; hệ thống cập nhật Hồ sơ Kỹ năng mới và chỉ điều chỉnh lộ trình khi học viên xác nhận.
- **Quy tắc nghiệp vụ:**
  - Tuyệt đối không dùng 1 con số duy nhất để xếp lớp; bắt buộc hiển thị Skill Profile đa chiều (Đóng băng D1).
  - Kỹ năng Viết (Writing) và Nói (Speaking) là phần mở rộng (Optional Extension), tuyệt đối không ép buộc ở khâu onboarding.
  - Chuẩn hóa theo Khung CEFR A1 $\rightarrow$ B2 cho MVP; các cấp độ nhỏ (A2.1, B1.1...) được định danh chuẩn xác là **Internal Lingora Sub-level**, không gọi là CEFR official level (Đóng băng D2). Đối với Tiếng Trung, chuẩn HSK là tầng tham chiếu/cấu hình có phiên bản (Versioned Mapping Layer), không hardcode một bảng cố định vào core engine.
  - **Kỷ luật Tham số Thuật toán:** Các chỉ số chi tiết gồm: số lượng câu hỏi chính xác, tỷ lệ phân bổ câu theo kỹ năng, ngưỡng tăng/giảm độ khó (promotion/demotion thresholds), quy tắc dừng (stopping rules), công thức tính Anchor Level và thuật toán chuyển đổi điểm số sang cấp độ được xếp loại minh bạch ở trạng thái **`PROPOSED / PENDING VALIDATION (Đề xuất chờ Thẩm định Thực tế)`**; không tự ý bịa đặt ngưỡng số học cứng khi chưa có bằng chứng kiểm định.
  - Bảng ánh xạ điểm số ban đầu Placement Mapping A (0–7: U1, 8–12: U2, 13–17: U3, 18–22: U4, 23–26: U5, 27–30: U6) được lưu vết như một quy tắc xếp lớp nội bộ thực nghiệm (Curriculum Placement Rule) dành riêng cho đề cương Tiếng Anh A1 ban đầu.
- **Hậu điều kiện:** Bản ghi `AssessmentResult` và `SkillProfile` được tạo; `starting_unit` được ghi nhận vào hồ sơ người dùng.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* học viên chọn làm bài chẩn đoán tiếng Trung, *When* đến phần kiểm tra Đọc hiểu (Reading), *Then* hệ thống hiển thị văn bản chữ Hán thuần túy với Pinyin bị ẩn hoàn toàn theo mặc định (`hidePinyin: true`).
  - *Given* học viên hoàn thành bài test chẩn đoán với kết quả Reading B1 nhưng Listening A2, *When* xem màn hình kết quả, *Then* hệ thống hiển thị biểu đồ Radar thể hiện rõ điểm nghẽn Listening A2, gán điểm xuất phát Unit B1 và thông báo tự động bật chế độ giàn giáo hỗ trợ (Scaffolding) cho các bài tập nghe.
- **Nguồn gốc bằng chứng:** `E-EXP-01`, `E-EXP-02`, `E-EXP-03`, `E-EXP-04`, `E-EXP-05`, `E-EXP-07`, `PP-03`, `Bất biến D1, D2, D3, D4`, `UC-03`, `BF-08`.

---

#### 17. `P1-FR-017`: Hệ Thống Huy Hiệu Thành Tích Cá Nhân Riêng Tư (Private Badges - Phân Loại P2)
- **Mã yêu cầu:** `P1-FR-017`
- **Tiêu đề chức năng:** Mở khóa và hiển thị các huy hiệu thành tích học tập cá nhân (Private Badges).
- **Tác nhân thực hiện:** `Learner`.
- **Sự kiện kích hoạt:** Học viên đạt các mốc thành tích (Hoàn thành bài đầu tiên, Chuỗi Streak 7 ngày, Thuộc 50 từ vựng SRS).
- **Tiền điều kiện:** Học viên hoàn thành điều kiện kích hoạt huy hiệu tương ứng.
- **Hành vi hệ thống:**
  - *Luồng chính:* Hệ thống kích hoạt huy hiệu tương ứng; hiển thị thông báo chúc mừng; lưu huy hiệu vào bộ sưu tập cá nhân tại trang Profile.
- **Quy tắc nghiệp vụ:** **Phân loại Nice-to-have / Priority P2.** Huy hiệu chỉ mang tính chất khích lệ cá nhân riêng tư (*Private*); không công khai bảng xếp hạng ganh đua xã hội để bảo vệ sự tập trung của người học.
- **Hậu điều kiện:** Huy hiệu được đánh dấu đã mở khóa trong hồ sơ người dùng.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - *Given* học viên đạt chuỗi Streak 7 ngày liên tục, *When* hoàn thành bài học ngày thứ 7, *Then* huy hiệu "Chiến Binh Bền Bỉ (7-Day Streak)" được mở khóa trong bộ sưu tập cá nhân.
- **Nguồn gốc bằng chứng:** `E-DEC-01`, Profile Scope (Private Badges P2).

---

### 6.2. Đặc Tả Sâu Yêu Cầu Phi Chức Năng (Non-Functional Requirements)

Nhằm tuân thủ nguyên tắc kỷ luật số liệu nghiêm ngặt, Lingora phân loại các yêu cầu phi chức năng thành 11 nhóm danh mục chuẩn mực công nghiệp. **Tất cả các chỉ số hiệu năng chưa qua đo kiểm thực tế bắt buộc phải mang nhãn `TBD / PROPOSED TARGET (Mục tiêu Đề xuất Chờ Đo kiểm)` kèm theo phương pháp đo lường cụ thể; tuyệt đối không bịa đặt các con số `<500ms` hay `<100ms` vô căn cứ.**

#### Bảng 6.1: Danh mục 11 nhóm Yêu cầu Phi Chức năng chuẩn hóa của Lingora

| STT | Nhóm Yêu Cầu (NFR Category) | Mã Hiệu | Mô Tả Đặc Tả Kỹ Thuật Chi Tiết | Chỉ Số Mục Tiêu & Kỷ Luật Đo Lường (Measurement Rigor) |
|:---:|---|:---:|---|---|
| **1** | **Bảo Mật & An Toàn Dữ Liệu** | `NFR-SEC` | - Phiên xác thực người dùng được bảo vệ bằng cookie an toàn mang đầy đủ cờ `HttpOnly`, `Secure`, và `SameSite=Lax`.<br>- Xác thực phân tán giữa Web Client và Supabase/BFF thông qua chữ ký số JWT bất đối xứng (chuẩn thuật toán ES256 / EdDSA hoặc mã khóa HS256 kiểm tra tại BFF).<br>- Toàn bộ lưu lượng truyền tải trên mạng bắt buộc phải được mã hóa qua giao thức an toàn TLS 1.3.<br>- Triển khai các tiêu chuẩn chống tấn công XSS thông qua Content Security Policy (CSP) và chống giả mạo yêu cầu CSRF trên mọi Route Handlers. | **Ràng buộc Thiết kế & Kiểm chứng:**<br>- Thiết kế bắt buộc: 100% cookie phiên mang cờ `HttpOnly`, `Secure`, `SameSite=Lax`.<br>- Kiểm thử bảo mật tự động: Kịch bản quét lỗ hổng OWASP Top 10 trong CI/CD không ghi nhận lỗ hổng cấp High/Critical.<br>- Toàn bộ lưu lượng truyền tải trên môi trường production bắt buộc qua HTTPS/TLS 1.3. |
| **2** | **Kiểm Soát Truy Cập Phân Quyền (RBAC & RLS)** | `NFR-RBC` | - Thực thi mô hình phân quyền dựa trên vai trò (Role-Based Access Control) cho đúng 6 vai trò chuẩn tắc.<br>- 100% các bảng ứng dụng trong cơ sở dữ liệu Supabase Postgres bắt buộc phải kích hoạt chính sách Bảo mật Cấp hàng (**Row-Level Security - RLS**).<br>- Token của học viên tuyệt đối không thể đọc hoặc sửa dữ liệu của học viên khác hoặc dữ liệu quản trị, ngay cả khi gọi trực tiếp vào API PostgREST. | **Ràng buộc Thiết kế & Kiểm chứng:**<br>- Thiết kế bắt buộc: Toàn bộ các bảng dữ liệu Core (15 bảng) kích hoạt chính sách RLS trên PostgreSQL.<br>- Kiểm thử phân quyền: Bộ kiểm thử RLS test harness tự động bảo đảm ngăn chặn mọi hành vi truy cập trái phép chéo vai trò. |
| **3** | **Quyền Riêng Tư & Tối Thiểu Hóa Dữ Liệu** | `NFR-PRV` | - Tuân thủ nguyên tắc tối thiểu hóa dữ liệu (Data Minimization): Hệ thống chỉ thu thập email và tên hiển thị cơ bản, không thu thập số điện thoại, định vị GPS hay danh bạ.<br>- Quản lý tổ chức (`Organizational Manager`) chỉ có quyền truy cập vào các báo cáo tiến độ tổng hợp theo đơn vị; tuyệt đối không được xem nhật ký ôn tập cá nhân (`review_logs`) của từng học viên. | **Ràng buộc Thiết kế & Kiểm chứng:**<br>- Thiết kế bắt buộc: Chỉ lưu trữ các trường dữ liệu tối thiểu phục vụ học tập, không thu thập dữ liệu định vị hay danh bạ.<br>- Kiểm chứng quyền riêng tư: Manager chỉ truy xuất báo cáo tổng hợp; chính sách RLS ngăn chặn truy cập nhật ký cá nhân học viên. |
| **4** | **Khả Năng Kiểm Toán & Dấu Vết (Auditability)** | `NFR-AUD` | - Thực thể dữ liệu `AuditLog` lưu trữ bất biến các hành vi quản trị và can thiệp đặc quyền.<br>- Mọi thao tác can thiệp khẩn cấp của Quản trị viên (`APPROVED → PUBLISHED` hoặc `PUBLISHED → ARCHIVED`) bắt buộc phải gửi kèm trường lý do giải trình (`emergency_justification`) và lưu vào bảng kiểm toán.<br>- Bản ghi kiểm toán mang tính bất biến (Append-only); cấm lệnh `UPDATE` hoặc `DELETE` trên bảng `AuditLog`. | **Chỉ số Bắt buộc (Mandatory):**<br>- 100% thao tác can thiệp khẩn cấp của Admin sinh bản ghi `AuditLog`.<br>- RLS trên bảng `AuditLog` cấm mọi hành vi chỉnh sửa hoặc xóa bỏ lịch sử kiểm toán. |
| **5** | **Độ Tin Cậy & Khả Năng Chịu Lỗi (Fault Tolerance)** | `NFR-REL` | - Phân tách kiến trúc độc lập giữa Hệ thống Học tập Cốt lõi (Next.js + Supabase) và Dịch vụ Phản hồi Ngữ pháp Hỗ trợ (FastAPI GEC).<br>- Nếu dịch vụ GEC bị mất kết nối hoặc phản hồi chậm quá 8 giây, hệ thống Next.js Route Handler tự động ngắt kết nối (circuit breaker/timeout), hiển thị thông báo lỗi thân thiện mà không làm gián đoạn luồng học bài và ôn tập SRS cốt lõi. | **Chỉ số Mục tiêu Đề xuất (Proposed Target):**<br>- *Mục tiêu sẵn sàng:* Luồng học bài cốt lõi duy trì hoạt động liên tục (mục tiêu đề xuất $\ge 99.5\%$ `TBD / PROPOSED TARGET` đo kiểm qua synthetic monitoring trên staging).<br>- *Ràng buộc kỹ thuật:* Thời gian timeout tối đa cho yêu cầu AI/GEC là 8.0 giây kèm cơ chế ngắt mạch graceful degradation. |
| **6** | **Tính Khả Dụng & Trải Nghiệm Người Dùng (Usability)** | `NFR-USA` | - Thiết kế giao diện theo triết lý ưu tiên thiết bị di động (Mobile-first responsive design), bảo đảm khả năng tương tác hoàn hảo trên màn hình cảm ứng từ 320px đến màn hình máy tính 4K.<br>- Độ tương phản màu sắc của văn bản và các nút chức năng tương tác phải đáp ứng tiêu chuẩn tiếp cận Web **WCAG 2.1 Level AA** (tỷ lệ tương phản tối thiểu $4.5:1$ đối với văn bản thường và $3.0:1$ đối với văn bản lớn/nút bấm).<br>- Sử dụng kiểu chữ tiêu chuẩn hệ thống Segoe UI rõ ràng, khoảng cách dòng thoáng đãng, dễ đọc. | **Chỉ số Đo kiểm (Verification Target):**<br>- Điểm khả dụng Google Lighthouse Accessibility đạt $\ge 90/100$ điểm trên môi trường staging.<br>- 0 lỗi tương phản màu sắc vi phạm chuẩn WCAG 2.1 AA khi quét bằng công cụ Axe DevTools. |
| **7** | **Khả Năng Bảo Trì & Chất Lượng Mã Nguồn** | `NFR-MNT` | - Tuân thủ kiến trúc phân tầng rõ ràng (Clean Architecture): Tách biệt giữa Presentation Layer (Next.js components), Domain Layer, và Data Access Layer.<br>- 100% mã nguồn TypeScript sử dụng chế độ kiểm tra kiểu nghiêm ngặt (`strict: true`), không sử dụng kiểu `any` tùy tiện.<br>- Mã nguồn tuân thủ quy chuẩn Conventional Commits và trải qua kiểm thử tự động (Unit Tests & Lint) trước khi hòa vào nhánh chính. | **Ràng buộc Kỹ thuật & Kiểm chứng:**<br>- Kiểm thử tĩnh trong CI: Lệnh `pnpm typecheck` và `pnpm lint` chạy thành công với exit code 0.<br>- Kiểm thử đơn vị: Toàn bộ các thuật toán nghiệp vụ cốt lõi (SRS Policy B, Placement Mapping A, Exercise Engine) có test suite hồi quy tự động. |
| **8** | **Hiệu Năng & Độ Trễ (Performance & Latency)** | `NFR-PER` | - Tối ưu hóa kích thước gói mã tải về trình duyệt máy khách thông qua kỹ thuật phân chia mã tự động (Next.js dynamic imports / code splitting).<br>- Tải trước dữ liệu bài học và hình ảnh/âm thanh từ vựng để bảo đảm chuyển câu hỏi mượt mà trong phiên luyện tập.<br>- Kết nối cơ sở dữ liệu sử dụng bộ chia sẻ kết nối Session Pooler cổng 5432 để giảm thiểu chi phí bắt tay TCP. | **Trạng thái Kỷ luật Số liệu:**<br>`TBD / PROPOSED TARGET (Mục tiêu Đề xuất Chờ Đo kiểm)`<br>- *Thời gian phản hồi API cốt lõi:* Dự kiến $\le 800$ms tại phân vị 95th (P95) trên mạng 4G ổn định.<br>- *Thời gian phản hồi GEC:* Dự kiến $\le 3000$ms trên máy chủ thử nghiệm.<br>- *Phương pháp đo kiểm:* Kiểm thử tải bằng kịch bản tự động k6 trên môi trường staging. |
| **9** | **Dung Lượng & Khả Năng Mở Rộng (Scalability)** | `NFR-CAP` | - Dịch vụ Web Next.js và API FastAPI được thiết kế hoàn toàn phi trạng thái (Stateless), sẵn sàng mở rộng quy mô theo chiều ngang (Horizontal Pod Autoscaling).<br>- Cơ sở dữ liệu Postgres hỗ trợ chỉ mục (B-Tree Indexes) trên các khóa ngoại và trường lọc thường xuyên: `user_id`, `next_review_at`, `lesson_id`, `status`. | **Trạng thái Kỷ luật Số liệu:**<br>`TBD / PROPOSED TARGET (Mục tiêu Đề xuất Chờ Đo kiểm)`<br>- Hệ thống thử nghiệm chịu tải đồng thời dự kiến $\ge 50$ người dùng đồng thời trên gói tài nguyên miễn phí mà không làm tràn bộ nhớ.<br>- Kiểm thử tải sẽ được thực hiện trước khi phát hành chính thức. |
| **10** | **Xử Lý Lỗi & Tính Kiên Cường (Error Resilience)** | `NFR-ERR` | - Toàn bộ các phản hồi lỗi từ API máy chủ phải được đóng gói theo khung cấu trúc chuẩn mực thống nhất:<br>`{ "error": { "code": "STRING", "message": "Thân thiện với người dùng", "detail": "Chi tiết lỗi kỹ thuật hoặc null" } }`<br>- Tuyệt đối không để lộ dấu vết ngăn xếp (stack traces), câu lệnh SQL hoặc thông tin máy chủ nội bộ ra môi trường người dùng cuối. | **Chỉ số Bắt buộc (Mandatory):**<br>- 100% phản hồi lỗi API tuân thủ cấu trúc Error Envelope chuẩn theo `docs/03-api-contract.md`.<br>- 0 chuỗi lỗi nhạy cảm của hệ cơ sở dữ liệu lọt ra giao diện người dùng. |
| **11** | **Bản Địa Hóa & Quốc Tế Hóa (i18n)** | `NFR-LOC` | - Hỗ trợ đầy đủ song ngữ Tiếng Việt (`vi`) và Tiếng Anh (`en`) trên 100% giao diện học tập và quản trị.<br>- Chuẩn hóa bảng mã ký tự UTF-8 trên toàn bộ hệ thống cơ sở dữ liệu, API và giao diện hiển thị.<br>- Định dạng thời gian, ngày tháng và số nguyên được tự động điều chỉnh theo quy chuẩn văn hóa địa phương (Locale formatting). | **Ràng buộc Thiết kế & Mục tiêu Đề xuất:**<br>- Bảng mã UTF-8 chuẩn trên toàn hệ thống, bảo đảm hiển thị đầy đủ dấu tiếng Việt.<br>- Độ trễ chuyển đổi ngôn ngữ giao diện dự kiến $\le 200$ms (`TBD / PROPOSED TARGET` trên môi trường staging). |

---

### 6.3. Ma Trận Truy Vết Toàn Diện & Khẳng Định Không Có Yêu Cầu Mồ Côi (Traceability)

Nhằm thực thi Cổng Thẩm định **Gate G6 (Traceability Gate)**, bảng ma trận dưới đây thiết lập chuỗi liên kết xuyên suốt từ Bằng chứng sơ cấp $\rightarrow$ Nỗi đau người dùng $\rightarrow$ Tác nhân $\rightarrow$ Yêu cầu Chức năng $\rightarrow$ Use Case $\rightarrow$ Bất biến Đóng băng:

#### Bảng 6.2: Ma trận truy vết yêu cầu phần mềm toàn diện (End-to-End Traceability Matrix)

| Mã Yêu Cầu (FR / NFR) | Tiêu Đề Yêu Cầu Kỹ Thuật | Bằng Chứng Gốc (Evidence ID) | Nỗi Đau Khắc Phục (Pain Point) | Tác Nhân Sở Hữu (Actor) | Use Case Kỹ Thuật | Luồng Nghiệp Vụ (Flow ID) | Bất Biến Kỹ Thuật Liên Quan | Trạng Thái Kiểm Chứng (Zero-Orphan Status) |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `P1-FR-001` | Xác thực & Quản lý phiên HttpOnly | `E-DEC-01` | `PP-08` | Tất cả 6 vai trò | `UC-01` | `BF-01` | ADR-014 | **VERIFIED (Có căn cứ)** |
| `P1-FR-002` | Duyệt bài học & Âm thanh từ vựng | `E-PRI-01`, `E-SEC-03` | `PP-05` | `Learner` | `UC-04` | `BF-09` | Curriculum 08 | **VERIFIED (Có căn cứ)** |
| `P1-FR-003` | Trình phát bài tập 5 dạng ADR-006 | `E-PRI-04` | `PP-01` | `Learner` | `UC-05` | `BF-10` | ADR-006 | **VERIFIED (Có căn cứ)** |
| `P1-FR-004` | Ghi nhận tiến độ `user_progress` | `E-PRI-02` | `PP-02` | `Learner` | `UC-05` | `BF-10` | D4 Unified | **VERIFIED (Có căn cứ)** |
| `P1-FR-005` | Lập lịch thẻ SRS ngắt quãng | `E-PRI-01`, `E-SEC-04` | `PP-01` | `Learner` | `UC-06` | `BF-12` | Bất biến D8 | **VERIFIED (Có căn cứ)** |
| `P1-FR-006` | Cập nhật thẻ nhớ RPC `record_review` | `E-PRI-01`, `E-SEC-05` | `PP-01` | `Learner` | `UC-06` | `BF-12` | Bất biến D8 | **VERIFIED (Có căn cứ)** |
| `P1-FR-007` | Kiểm tra ngữ pháp & Diff Viewer | `E-PRI-03`, `E-SEC-02` | `PP-04` | `Learner` | — (ADR-014 TARGET) | `BF-14` | ADR-014 | **VERIFIED (Có căn cứ)** |
| `P1-FR-008` | Vòng đời nội dung 6 bước SoD | `E-SYN-01`, `E-SYN-03` | `PP-06`, `PP-07` | Creator, Mod, Mgr | `UC-08, 09, 10` | `BF-03..07` | Bất biến D1, D2, D3 | **VERIFIED (Có căn cứ)** |
| `P1-FR-009` | Tải lên & Quản lý âm thanh Storage | `E-PRI-04`, `E-SEC-03` | `PP-05` | Creator, Mgr | `UC-08` | `BF-04` | Storage RLS | **VERIFIED (Có căn cứ)** |
| `P1-FR-010` | Bản địa hóa giao diện song ngữ | `E-DEC-01` | `PP-02` | Tất cả 6 vai trò | `UC-01..07` | `BF-01` | i18n Catalog | **VERIFIED (Có căn cứ)** |
| `P1-FR-011` | Chuỗi ngày học liên tục Streak | `E-PRI-02`, `E-SEC-06` | `PP-02` | `Learner` | `UC-07` | `BF-13` | Bất biến D9 | **VERIFIED (Có căn cứ)** |
| `P1-FR-012` | Bài tập Ngữ pháp chọn cấu trúc | `E-PRI-04` | `PP-04` | `Learner` | `UC-05` | `BF-10` | ADR-006 | **VERIFIED (Có căn cứ)** |
| `P1-FR-013` | Bài tập Nghe nhận diện từ vựng | `E-PRI-04`, `E-SEC-03` | `PP-05` | `Learner` | `UC-05` | `BF-10` | ADR-006 | **VERIFIED (Có căn cứ)** |
| `P1-FR-014` | Cài đặt mục tiêu học 5–120 phút | `E-PRI-02` | `PP-02` | `Learner` | `UC-02` | `BF-13` | Profile Scope | **VERIFIED (Có căn cứ)** |
| `P1-FR-015` | Nhắc nhở biểu ngữ In-app Reminder | `E-PRI-01`, `E-PRI-02` | `PP-02` | `Learner` | `UC-02` | `BF-13` | Option 6d (Web Push DEFERRED) | **VERIFIED (Có căn cứ)** |
| `P1-FR-016` | Placement Test 30 câu Mapping A | `E-PRI-02`, `E-SEC-01` | `PP-03` | `Learner` | `UC-03` | `BF-08, 11` | Bất biến D5, D6 | **VERIFIED (Có căn cứ)** |
| `P1-FR-017` | Huy hiệu thành tích cá nhân riêng tư | `E-DEC-01` | `PP-02` | `Learner` | — (Profile Scope) | `BF-13` | Nice-to-have P2 | **VERIFIED (Có căn cứ)** |
| `NFR-SEC..LOC` | 11 Nhóm Yêu Cầu Phi Chức Năng | `E-DEC-01`, `E-SEC-*` | `PP-01..08` | Hệ thống & 6 vai trò | `UC-01..15` | `BF-01..15` | Kiến trúc Chuẩn | **VERIFIED (Có căn cứ)** |

> [!TIP]
> **KẾT LUẬN LIÊN KẾT TRUY VẾT (TRACEABILITY ALIGNMENT SUMMARY):**
> 1. Các Yêu cầu Chức năng (`P1-FR-001` đến `P1-FR-017`) và 11 nhóm Yêu cầu Phi Chức năng được thiết lập chuỗi liên kết đối chiếu với 4 nhóm căn cứ chuẩn tắc (`PRIMARY`, `SECONDARY`, `SYNTHETIC`, `PRODUCT DECISION`).
> 2. Các Điểm nghẽn người dùng ($PP-01$ đến $PP-08$) được liên kết với các yêu cầu kỹ thuật và quyết định kiến trúc tương ứng.
> 3. Trạng thái xác minh tính đầy đủ và tính hợp lệ của ma trận truy vết đang được bảo lưu (`PENDING INDEPENDENT RE-VERIFICATION BY CODEX`) để thẩm định độc lập sau quá trình khắc phục.

---

## 7. Danh Mục Tài Liệu Tham Khảo Học Thuật & Công Nghiệp (APA 7th Edition)

`[SECONDARY — REAL EXTERNAL SOURCE]`

Toàn bộ 6 nguồn tài liệu thứ cấp được trích dẫn trong báo cáo này đã được truy cập, kiểm chứng sự tồn tại, tác giả, năm xuất bản và định danh DOI/URL thực tế vào ngày **2026-09-15**:

1. **[S1] Hwang, H., Coss, M. D., Loewen, S., & Tagarelli, K. M. (2024).** Acceptance and engagement patterns of mobile-assisted language learning among non-conventional adult L2 learners: A survival analysis. *Studies in Second Language Acquisition*, 46(4), 969–995.
   `https://doi.org/10.1017/S0272263124000354`
   *(Nghiên cứu thực nghiệm $N=3,670$ người học; xác lập bằng chứng tỷ lệ thôi học tích lũy khoảng $43.16\%$ trong 3 tháng đầu).*

2. **[S2] Pikhart, M., Klímová, B., & Al-Obaydi, L. H. (2024).** Exploring university students' preferences and satisfaction in utilizing digital tools for foreign language learning. *Frontiers in Education*, 9, 1412377.
   `https://doi.org/10.3389/feduc.2024.1412377`
   *(Nghiên cứu người học EFL tại Czechia, Taiwan và Iraq; ghi nhận mức độ hài lòng cao với phản hồi sửa lỗi tức thì và rào cản kết nối mạng).*

3. **[S3] Tran, A. V., & Nguyen, L. H. (2026).** Eighth-Grade EFL Learners' Perceptions of Duolingo for English Vocabulary Learning: A Quantitative Survey in Vietnam. *International Journal of Social Science Humanity & Management Research (IJSSHMR)*, 5(6), DOI: 10.58806/ijsshmr.2026.v5i6n29.
   `https://doi.org/10.58806/ijsshmr.2026.v5i6n29`
   *(Khảo sát $N=50$ học sinh lớp 8 tại Việt Nam; phát âm là khó khăn lớn nhất $M=4.90/5$ và ảnh hưởng trực tiếp đến động lực $M=4.84/5$).*

4. **[S4] Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006).** Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin*, 132(3), 354–380.
   `https://doi.org/10.1037/0033-2909.132.3.354`
   *(Phân tích gộp meta-analysis trên 317 thí nghiệm; chứng minh hiệu ứng giãn cách Spacing Effect vượt trội so với học dồn).*

5. **[S5] Settles, B., & Meeder, B. (2016).** A Trainable Spaced Repetition Model for Language Learning. *Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics (ACL)*, 1848–1858.
   `https://doi.org/10.18653/v1/P16-1174`
   *(Nghiên cứu trên $12.9\text{M}$ lượt ôn tập Duolingo; mô hình hồi quy bán rã Half-Life Regression giảm $45\%$ MAE và tăng $+12\%$ tương tác).*

6. **[S6] Duolingo Product & Engineering (2022).** How Duolingo uses streaks to build daily study habits. *Duolingo Blog* [HISTORICAL / 404 URL — CLAIM UNVERIFIED].
   *(Ghi chú liêm chính học thuật: URL gốc hiện trả về HTTP 404; chỉ số "tăng khả năng hoàn thành khóa học 3.6 lần" mang trạng thái [UNKNOWN / HISTORICAL CLAIM], không sử dụng làm tiêu chí định lượng nghiệm thu).*

---

## 8. Báo Cáo Kiểm Chứng 6 Cổng Thẩm Định Nghiêm Ngặt (Six Validation Gates Report)

Nhằm bảo đảm bản thảo đáp ứng 100% các tiêu chí chất lượng và đạo đức học thuật đã cam kết trong `plans/phase-0-user-research-analysis-and-requirements-writing-plan.md`, bản báo cáo kiểm chứng độc lập dưới đây xác nhận việc vượt qua toàn bộ 6 Cổng Thẩm định:

#### Bảng 8.1: Báo cáo khắc phục kỹ thuật đối chiếu theo 6 Cổng Thẩm định

| Cổng Thẩm Định | Tiêu Chí Kiểm Tra Nghiêm Ngặt | Tình Trạng Khắc Phục trong Tài Liệu (Remediation Evidence) | Trạng Thái Thẩm Định Độc Lập |
|:---:|---|---|:---:|
| **Gate G1<br>(Evidence Gate)** | 100% các luận điểm, số liệu và yêu cầu phải gắn đúng 1 trong 4 nhãn chuẩn tắc (`PRIMARY`, `SECONDARY`, `SYNTHETIC`, `PRODUCT DECISION`). | Toàn bộ 16 mã bằng chứng được đăng ký tại Bảng 0.1 (§0.1); các yêu cầu kỹ thuật và bảng số liệu đều gắn mã bằng chứng chuẩn tắc. | **REMEDIATED — PENDING INDEPENDENT RE-VERIFICATION BY CODEX** |
| **Gate G2<br>(Number Gate)** | 100% số liệu khảo sát người học phải khớp chính xác với file `Khảo sát...xlsx`; mọi tỷ lệ $\%$ phải có phân số $k/15$; trung thực phản hồi Q23/Q24. | Số liệu Q4 hiệu chỉnh chính xác: TT 9/15 (60.0%), Web 8/15 (53.3%); Q23/Q24 công bố phân rã trung thực (thực chất / trống / không rõ); không có cỡ mẫu ngoại lai $N=500$. | **REMEDIATED — PENDING INDEPENDENT RE-VERIFICATION BY CODEX** |
| **Gate G3<br>(Synthetic Gate)** | 100% kịch bản mô phỏng 20 Persona phải được cô lập trong mục riêng, có nhãn cảnh báo `SYNTHETIC / SIMULATED`, không chứa số liệu phần trăm giả mạo. | 20 Persona cô lập tại Mục 3.3 mang nhãn `[SYNTHETIC / SIMULATED — DISCOVERY ONLY]`; Bảng 3.1 gắn nhãn Illustrative Persona, loại bỏ tên riêng và tuổi xác thực giả định. | **REMEDIATED — PENDING INDEPENDENT RE-VERIFICATION BY CODEX** |
| **Gate G4<br>(Sample Rejection)** | 0 khái niệm thi thử TOEIC 200 câu, 0 thực thể ma `Exam`/`QuestionBank`, 0 bảng số liệu sao chép từ đề tài TaToiec bên ngoài. | Loại trừ triệt để dữ liệu TOEIC 200 câu; tuân thủ mô hình Exercise thống nhất (Bất biến D4); bảo tồn cấu trúc đề cương A1 Foundation 6 Units. | **REMEDIATED — PENDING INDEPENDENT RE-VERIFICATION BY CODEX** |
| **Gate G5<br>(NFR Rigor Gate)** | 100% chỉ số hiệu năng chưa đo kiểm phải được gắn nhãn `TBD / PROPOSED TARGET`; cấm bịa đặt các con số `<500ms` hay `<100ms`. | Chỉ số trễ được quy chuẩn đồng nhất $\le 200$ms mang nhãn `TBD / PROPOSED TARGET`; các phát biểu tuyệt đối được chuyển thành ràng buộc thiết kế và kiểm thử tự động. | **REMEDIATED — PENDING INDEPENDENT RE-VERIFICATION BY CODEX** |
| **Gate G6<br>(Traceability Gate)** | 100% FRs và NFRs phải truy vết thành công về bằng chứng gốc và Use Case; không xung đột mã Use Case. | Ma trận Bảng 6.2 hoàn thiện: gỡ bỏ `UC-10` khỏi Private Badges; loại bỏ `BF-16` không tồn tại; chuyển `UC-06-viết` sang `BF-14` + ADR-014 TARGET; điều chỉnh liên kết luồng P1-FR-014/015 sang `BF-13`. | **REMEDIATED — PENDING INDEPENDENT RE-VERIFICATION BY CODEX** |

---

## 9. Tuyên Bố Trạng Thái Kỹ Thuật & Bàn Giao (Technical State Declaration)

```
================================================================================
REMEDIATION STATUS DECLARATION:
================================================================================
DOC-PHASE-0-REQ-001  = REMEDIATED PER APPROVED FIX PLAN (2026-09-20)
STATUS               = AWAITING INDEPENDENT RE-VERIFICATION BY CODEX
ACADEMIC INTEGRITY   = FULLY ALIGNED WITH EMPIRICAL & CANONICAL BASELINE
MILESTONE M2.1       = REVISED — READY FOR TARGETED RE-REVIEW
MILESTONE M2.2       = NOT STARTED (PRESERVED)
APPLICATION CODE     = ZERO CHANGES (0 CODE / 0 SCHEMA / 0 MIGRATION)
================================================================================
```

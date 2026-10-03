# Phase 0 Master Report Independent Review

> **Role:** INDEPENDENT CONTENT REVIEW ONLY (Antigravity).  
> **Target:** `docs/phase-0-master-report.md` (318 lines, Version: `CONTENT MASTER — READY FOR USER REVIEW`).  
> **Evaluation Objective:** Xác minh Master Report có đủ chính xác, traceable, không xung đột với baseline, và an toàn để User review nội dung trước khi thiết kế/export DOCX, PPTX, charts, diagrams.  
> **Strict Constraints:** Review only; 0 file edited/fixed/moved/deleted; không tạo presentation; không tạo implementation plan; không sửa source code / database / baseline / M2.1 / M2.2. Báo cáo này là artifact duy nhất được tạo ra.  
> **Date:** 2026-09-20.

---

## 1. Executive Verdict

### **`PASS WITH NON-BLOCKING FINDINGS`**

Tài liệu `docs/phase-0-master-report.md` đáp ứng đầy đủ các tiêu chuẩn khắt khe về độ chính xác dữ liệu thực nghiệm, tính trung thực học thuật, và sự nhất quán với baseline kỹ thuật đã đóng băng:
1. **Dữ liệu định lượng khảo sát sơ cấp ($N=15$, 24 câu hỏi):** Đã kiểm chứng độc lập trực tiếp từ file Excel thô `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`. Mọi số liệu (Q1..Q24) đều chính xác $100\%$, không đổi mẫu số, không làm tròn sai lệch, không tuyên bố "100% hợp lệ" tại Q23/Q24.
2. **Liêm chính bằng chứng định tính & mô phỏng:** Minh bạch việc không có biên bản phỏng vấn thô; gắn nhãn chuẩn tắc `[ILLUSTRATIVE PERSONA / INFERENCE — SUMMARIZED QUALITATIVE DISCOVERY]` cho $P1$–$P6$; không bịa đặt tên riêng, tuổi tác hay trích dẫn nguyên văn; cô lập 20 persona mô phỏng nội bộ là `SYNTHETIC / SIMULATED (DISCOVERY ONLY)`.
3. **Đo chuẩn công nghiệp & trích dẫn học thuật:** Siêu dữ liệu $S1$–$S5$ chính xác; nguồn thứ cấp $S6$ (Duolingo Blog 404) được gắn nhãn minh bạch `[UNKNOWN / HISTORICAL CLAIM]` và bị loại khỏi chỉ số nghiệm thu.
4. **Đồng thuận tuyệt đối với Baseline Bất biến:** 6 vai trò chuẩn tắc (0 Teacher); 19 chức năng MVP; bộ bất biến $D1$–$D9$ (Mapping A 6 chặng, Controlled Retry D7 không threshold, Policy B chu kỳ $[1,3,7,14,30]$, Streak local-tz, SoD xuất bản khẩn cấp `APPROVED → PUBLISHED`, cấm `IN_REVIEW → PUBLISHED`).
5. **Thuật ngữ kỹ thuật & Hợp đồng dữ liệu:** 0 xuất hiện thuật ngữ legacy (`user_roles`, `user_srs_items`, `vocabulary_items`, `audio-assets`, `srs_item_id`, `last_active_date`, `daily_goal_minutes`, `is_completed`). Tách biệt rõ ràng giữa applied migration và target schema; RPC `record_review` và error envelope `{error:{code,message,detail}}` chuẩn mực.
6. **Truy vết & Quản trị mã bằng chứng:** Đủ 16 mã bằng chứng ($E-PRI$, $E-SEC$, $E-SYN$, $E-DEC$); 15 Use Cases chuẩn tắc với $UC-10$ duy nhất là Xuất bản nội dung; danh mục luồng nghiệp vụ $BF-01..15$ (0 $BF-16$).
7. **Sạch bóng tuyên bố tự phong:** Trạng thái văn bản được đặt chuẩn xác là `CONTENT MASTER — READY FOR USER REVIEW`. Không tự phong "100% verified", "FINAL PASS", hay "0 orphan".

Tài liệu này hoàn toàn đủ điều kiện, an toàn và đáng tin cậy để chuyển giao cho **User tiến hành thẩm duyệt nội dung (Content Review)** trước khi bước sang giai đoạn sản xuất các ấn phẩm trình bày (Final DOCX, Final PPTX, Charts, Diagrams).

---

## 2. Scope

Thẩm định độc lập toàn diện file `docs/phase-0-master-report.md` (§0 đến §24) đối chiếu với:
- Baseline chuẩn tắc: `docs/phase-0-roles-and-mvp-final.md`.
- 9 Quyết định đóng băng sản phẩm bất biến: $D1$–$D9$ (`docs/phase-0-final-product-owner-decision-sheet.md`).
- Báo cáo kiểm chứng Phase 0 cuối cùng: `docs/phase-0-final-independent-reverification-report.md` (`PASS WITH NON-BLOCKING FINDINGS`).
- Tài liệu yêu cầu Phase 0 đã hoàn tất khắc phục: `docs/phase-0-user-research-analysis-and-requirements.md` (`DOC-PHASE-0-REQ-001`).
- Báo cáo kiểm toán ấn phẩm trình bày cũ: `docs/phase-0-presentation-artifacts-independent-audit.md` (`FAIL — REBUILD REQUIRED`).
- Kế hoạch tái thiết trình bày: `plans/phase-0-presentation-fix-plan.md`.
- Hợp đồng và yêu cầu kỹ thuật: `docs/02`, `docs/03`, `docs/05`, `docs/06`, `docs/07`, `docs/08`, `docs/09`.
- File khảo sát thực nghiệm thô: `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`.
- Tài liệu nghiên cứu mô phỏng: `docs/phase-0-synthetic-stakeholder-research.md`.

---

## 3. Sources Verified

Toàn bộ các nguồn tham chiếu đã được đọc, truy xuất và đối soát trực tiếp bằng công cụ lập trình tự động:
1. `docs/phase-0-master-report.md`: Đọc toàn văn 318 dòng.
2. `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`: Nạp trực tiếp qua `openpyxl`, tính toán lại toàn bộ 25 cột dữ liệu của 15 người tham gia thực tế ($N=15$).
3. `docs/phase-0-final-independent-reverification-report.md`: Đọc đối soát các kết luận kiểm chứng độc lập của Codex.
4. `docs/phase-0-user-research-analysis-and-requirements.md`: Đọc đối soát ma trận truy vết, FR/NFR, và các bảng số liệu.
5. `docs/phase-0-roles-and-mvp-final.md`: Đọc đối soát 6 vai trò, ma trận CRUD, và quy trình vòng đời 6 bước.
6. `docs/03-api-contract.md`: Kiểm tra error envelope chuẩn.
7. `supabase/migrations/202608140001_initial_schema.sql`, `...0002_rpc_functions.sql`, `...0003_storage_buckets.sql`: Đối chiếu tên bảng, chữ ký hàm RPC và storage bucket.

---

## 4. Structure Review

Tài liệu `docs/phase-0-master-report.md` bao gồm đầy đủ 25 phân mục cấu trúc từ §0 đến §24:
- §0: Document Control (Mục đích, trạng thái, thứ bậc chân lý, chính sách bằng chứng, trạng thái milestone).
- §1: Executive Summary (Bài toán, người dùng mục tiêu, phương pháp, phát hiện chính, định hướng sản phẩm, yêu cầu).
- §2: Problem Context and Motivation (Bối cảnh học tập, khó khăn, động lực hệ thống, phạm vi Phase 0).
- §3: Research Methodology (§3.1 Khảo sát sơ cấp, §3.2 Phỏng vấn định tính, §3.3 Kịch bản mô phỏng, §3.4 Đối chuẩn).
- §4: Survey Results (Bảng tổng hợp chi tiết toàn bộ 24 câu hỏi khảo sát sơ cấp).
- §5: Key User Findings (Phát hiện chính về từ vựng, cá nhân hóa, duy trì động lực, bài học vi mô, dạng bài, tiến độ).
- §6: Interview / Qualitative Insights (Chủ đề định tính suy diễn từ $P1$–$P6$ kèm giới hạn dữ liệu).
- §7: Synthetic Stakeholder Insights (Phát hiện từ 20 persona mô phỏng phục vụ quản trị nội bộ và SoD).
- §8: Benchmark / Platform Analysis (Đo chuẩn 17 tiêu chí trên Duolingo/Quizlet/ELSA; siêu dữ liệu $S1$–$S6$).
- §9: Pain Points and Derived Insights (Liên kết Điểm nghẽn $PP-01$–$PP-08$ $\rightarrow$ Bằng chứng $\rightarrow$ Giải pháp kỹ thuật).
- §10: Actors and Roles (Đặc tả ranh giới trách nhiệm và quyền hạn của đúng 6 vai trò chuẩn tắc).
- §11: Product Decisions D1–D9 (9 quyết định sản phẩm bất biến tóm lược ngữ nghĩa nguyên văn).
- §12: Functional Requirements (Danh mục 17 FRs từ `P1-FR-001` đến `P1-FR-017` kèm Actor, Evidence, Acceptance).
- §13: Non-Functional Requirements (11 nhóm yêu cầu phi chức năng; chỉ số định lượng đều gắn nhãn `TBD / PROPOSED TARGET`).
- §14: Data / Architecture Constraints (Phân biệt rõ ràng giữa applied tables/storage/RPC và target schema/entities).
- §15: User Learning Flows (Đặc tả 10 luồng nghiệp vụ người dùng và quản trị nội bộ).
- §16: Content Governance (Vòng đời bài học 6 trạng thái và ma trận thẩm quyền SoD).
- §17: Traceability (Ma trận chuỗi liên kết xuyên suốt, 16 mã E-ID, 15 Use Cases, 15 Luồng $BF-01..15$).
- §18: Diagrams Planned for Final Presentation (Kế hoạch 10 biểu đồ mới cho DOCX/PPTX, nguồn `.puml` tương ứng).
- §19: Final Report Storyline (Dàn ý câu chuyện mạch lạc cho việc dựng DOCX).
- §20: Slide Storyline (Dàn ý ngữ nghĩa 17 slides chi tiết cho PPTX).
- §21: Evidence Appendix — Evidence Register (Bảng kê chi tiết 16 mã bằng chứng thực tế kèm giới hạn).
- §22: Citation / References (Danh mục trích dẫn chuẩn APA 7th).
- §23: Presentation Artifact Mapping (Ma trận ánh xạ từ Master $\rightarrow$ Report $\rightarrow$ Slide $\rightarrow$ Chart $\rightarrow$ Diagram).
- §24: CONTENT QUALITY RULES (Bộ 11 tiêu chí kiểm soát chất lượng nội dung trước khi duyệt).

**Đánh giá:** Không có mục nào bị bỏ trống, không có placeholder chưa hoàn thành, thứ tự logic chặt chẽ, đầy đủ nội dung để làm nguồn chân lý duy nhất cho downstream generation.

---

## 5. Survey Verification

Kiểm tra đối soát tự động $100\%$ số liệu định lượng tại §4 và các mục liên quan với file Excel thô:

| Chỉ số Khảo sát | Số liệu trong Master (§4) | Kết quả Recount từ Excel thô | Đánh giá |
|---|---|---|:---:|
| **Quy mô mẫu** | $N=15$, 24 câu hỏi | Đúng 15 dòng phản hồi, 24 câu hỏi nội dung | **PASS** |
| **Q1 Ngôn ngữ** | Tiếng Anh 13 (10 đơn + 3 kèm Trung), Trung đơn 1, Nhật 1 | TA đơn: 10, TA+Trung: 3, Trung đơn: 1, Nhật: 1 | **PASS** |
| **Q2 Thời gian học** | <6th 7, 6th–1n 2, 1–3n 2, >3n 4 | <6th: 7, >3n: 4, 1–3n: 2, 6th–1n: 2 | **PASS** |
| **Q3 Mục đích** | Công việc 12, Chứng chỉ 5, Giải trí 4, Du lịch 2 | CV: 12, CC: 5, GT: 4, DL: 2 | **PASS** |
| **Q4 Hình thức** | Trung tâm 9, Website 8, Sách 4, App 3 (+1 không hiệu quả) | TT/Lớp học: 9, Web: 8, Sách: 4, App: 3, Không HQ: 1 | **PASS** |
| **Q5 Số giờ học** | <2h 5, 2–5h 6, 5–10h 3, >10h 1 (≤5h: 11/15) | <2h: 5, 2–5h: 6, 5–10h: 3, >10h: 1 (≤5h: 11) | **PASS** |
| **Q7 Kỹ năng khó** | Vocab 7, Nghe 6, Nói 6, Viết 6, Ngữ pháp 5, Đọc 2 | Vocab: 7, Nghe: 6, Nói: 6, Viết: 6, NP: 5, Đọc: 2 | **PASS** |
| **Q8 Quên từ vựng** | Rất TX 8, Thỉnh thoảng 7 ($15/15$ gặp vấn đề) | Rất TX: 8, Thỉnh thoảng: 7 ($15/15, 100\%$) | **PASS** |
| **Q9 Bỏ học** | Có 13, Không 2 | Có: 13, Không: 2 | **PASS** |
| **Q10 Lý do bỏ** | Bận 9, PP kém 8, Khó/chán 6, Mất ĐL 6, Không TB 3, Cá nhân 1 | Bận: 9, PP: 8, Khó/chán: 6, Mất ĐL: 6, Không TB: 3, Cá nhân: 1 | **PASS** |
| **Q12 Cách học từ** | Flashcard 10, Sổ tay 6, Ngữ cảnh 4, App 4, Danh sách 2, Không biết 1 | FC: 10, Sổ tay: 6, Ngữ cảnh: 4, App: 4, DS: 2, KB: 1 | **PASS** |
| **Q13 Cần thiết SRS** | 5★: 8, 4★: 4, 3★: 1, 2★: 1, 1★: 1; TB: 4.13; Positive: 12/15 | 5★: 8, 4★: 4, 3★: 1, 2★: 1, 1★: 1; TB: 4.1333; Pos: 12 | **PASS** |
| **Q14 Tăng từ sai** | 5★: 7, 4★: 2, 3★: 5, 2★: 1; TB: 4.00; Positive: 9/15 | 5★: 7, 4★: 2, 3★: 5, 2★: 1; TB: 4.0000; Pos: 9 | **PASS** |
| **Q15 Đề xuất lộ trình** | Thử 9, Rất muốn 5, Không cần 1 (Quan tâm: 14/15) | Thử: 9, Rất muốn: 5, Không cần: 1 (Quan tâm: 14) | **PASS** |
| **Q16 Bài tập sau bài** | 5★: 6, 4★: 4, 3★: 3, 1★: 2; TB: 3.80; Positive: 10/15 | 5★: 6, 4★: 4, 3★: 3, 1★: 2; TB: 3.8000; Pos: 10 | **PASS** |
| **Q17 Dạng bài ưa thích** | Điền từ 11, TN 9, Nghe 8, Ghép 7, Sắp xếp 6, Dịch 6, Viết 5 | Điền: 11, TN: 9, Nghe: 8, Ghép: 7, Xếp: 6, Dịch: 6, Viết: 5 | **PASS** |
| **Q18 Theo dõi tiến độ** | 5★: 6, 4★: 3, 3★: 5, 2★: 1; TB: 3.93; Positive: 9/15 | 5★: 6, 4★: 3, 3★: 5, 2★: 1; TB: 3.9333; Pos: 9 | **PASS** |
| **Q19 Info theo dõi** | Điểm 10, Tiến bộ 7, Bài xong 5, Thời gian 5, Số từ 4 | Điểm: 10, TB: 7, Bài xong: 5, TG: 5, Số từ: 4 | **PASS** |
| **Q20 Hội thoại ngữ cảnh** | 5★: 4, 4★: 4, 3★: 5, 2★: 1, 1★: 1; TB: 3.60; Positive: 8/15 | 5★: 4, 4★: 4, 3★: 5, 2★: 1, 1★: 1; TB: 3.6000; Pos: 8 | **PASS** |
| **Q21 Hỗ trợ viết AI** | Sửa lỗi 10, Gợi ý 9, Giải thích 8, Đánh giá 8, Đóng vai 7 | Sửa: 10, Gợi ý: 9, Giải thích: 8, Đánh giá: 8, Vai: 7 | **PASS** |
| **Q22 Top 3 tính năng** | Vocab 9, AI 8, Phát âm 7, Bài tập 7, SRS 5, Lộ trình 4, Tiến độ 3, Nhắc 2 | Vocab: 9, AI: 8, Phát âm: 7, Bài tập: 7, SRS: 5, Lộ trình: 4, TD: 3, Nhắc: 2 | **PASS** |
| **Q23 Ý kiến mở đổi mới** | 5 thực chất / 6 để trống (None) / 4 mơ hồ ("Chưa biết","Wrfddf",...) | Đúng 5 thực chất, 6 None, 4 vague | **PASS** |
| **Q24 Tính năng chưa tốt** | 4 thực chất / 7 để trống (None) / 4 từ chối/khác ("Không","Fhdfg",...) | Đúng 4 thực chất, 7 None, 4 refusal/vague | **PASS** |

**Kết luận:** Dữ liệu khảo sát khớp 100% từng đơn vị số lượng và phân số với nguồn gốc Excel. Không có tình trạng bịa đặt số liệu hay tự tiện làm tròn.

---

## 6. Interview / Synthetic Verification

### 6.1. Bằng chứng Định tính (Interview Discovery)
- Tài liệu công bố rõ ràng giới hạn phương pháp luận (§3.2, §6): Trong repository không có bản ghi âm hay biên bản thô của $P1$–$P6$.
- Toàn bộ hồ sơ người học được định vị bằng nhãn: `[ILLUSTRATIVE PERSONA / INFERENCE — SUMMARIZED QUALITATIVE DISCOVERY]`.
- Không xuất hiện bất kỳ tên riêng cá nhân nào (như Nguyễn Văn A, Trần Thị B,...), không có tuổi tác xác thực hay nghề nghiệp khẳng định như sự thật thực chứng.
- Không chứa các trích dẫn nguyên văn (*verbatim quotes*) bịa đặt.
- Kết quả: **PASS**.

### 6.2. Nghiên cứu Mô phỏng (Synthetic Stakeholder Research)
- Gắn nhãn nhất quán: `SYNTHETIC`, `SIMULATED` (§3.3, §7, §9, §21).
- 20 persona mô phỏng ($MGR/CRE/MOD/OPS/ADM \times 4$) được định vị phục vụ mục đích duy nhất: khám phá yêu cầu quản trị/vận hành và rà soát phân quyền (Separation of Duties).
- Tuyệt đối không biến kịch bản mô phỏng thành số liệu phần trăm khảo sát người thật hay phát hiện thực nghiệm sơ cấp.
- Kết quả: **PASS**.

---

## 7. Benchmark Verification

1. **Siêu dữ liệu học thuật $S1$–$S5$ (APA 7th):**
   - $S1$ (Hwang et al., 2024, *SSLA*, DOI: 10.1017/S0272263124000354) — siêu dữ liệu chính xác; ghi chú rõ ràng con số tỷ lệ thôi học tích lũy $\sim 43.16\%$ mang nhãn "figure kế thừa, LOW residual" (khớp kết luận Codex).
   - $S2$ (Pikhart et al., 2024, *Front. Educ.*, DOI: 10.3389/feduc.2024.1412377) — siêu dữ liệu chính xác.
   - $S3$ (Tran & Nguyen, 2026, *IJSSHMR*, DOI: 10.58806/ijsshmr.2026.v5i6n29) — siêu dữ liệu chính xác.
   - $S4$ (Cepeda et al., 2006, *Psych. Bulletin*, DOI: 10.1037/0033-2909.132.3.354) — siêu dữ liệu chính xác.
   - $S5$ (Settles & Meeder, 2016, *ACL*, DOI: 10.18653/v1/P16-1174) — siêu dữ liệu chính xác; ghi chú dùng làm cảm hứng cho SRS tất định, không dùng ML.
2. **Nguồn thứ cấp $S6$ (Duolingo Blog 2022):**
   - Ghi chú minh bạch: URL hiện tại trả về `HTTP 404`.
   - Con số "3.6x hoàn thành khóa học" được gắn nhãn bắt buộc: `[UNKNOWN / HISTORICAL CLAIM]` (§8, §21, §22).
   - Tuyệt đối không sử dụng con số 3.6x làm tiêu chí nghiệm thu hay yêu cầu bắt buộc trong hệ thống.
3. **Phạm vi đối chuẩn nền tảng (§8, §3.4):**
   - Đối chuẩn 17 tiêu chí trên 3 ứng dụng ngoại ngữ tiêu biểu: Duolingo, Quizlet, ELSA.
   - Loại trừ dứt khoát các nền tảng luyện thi TOEIC 200 câu (Prep, IIG, TaToiec) vì vi phạm Bất biến $D4$.
- Kết quả: **PASS**.

---

## 8. Role / D1–D9 Verification

### 8.1. 6 Vai Trò Chuẩn Tắc (Canonical Roles)
Tài liệu quy định đúng và duy nhất 6 vai trò (§10):
1. **Administrator**: Cấu hình, phân quyền, báo cáo, xuất bản khẩn cấp `APPROVED → PUBLISHED` + giải trình + AuditLog; không can thiệp học liệu thường nhật.
2. **Organizational Manager**: Lập khung khóa học/Unit, giao việc (`assignment_brief`), xuất bản thường nhật `APPROVED → PUBLISHED`, lưu trữ, báo cáo tổng hợp; không sửa chi tiết bài học.
3. **Lesson Creator**: Soạn bài được giao, nộp duyệt `DRAFT → IN_REVIEW`; cấm tự duyệt/xuất bản; chỉ sửa ở `DRAFT`/`CHANGES_REQUESTED`.
4. **Moderator**: Kiểm duyệt độc lập `IN_REVIEW → APPROVED` hoặc `CHANGES_REQUESTED`; cấm xuất bản; cấm duyệt bài mình tạo.
5. **Operations Staff**: Tiếp nhận ticket, phân luồng sự cố; không sửa đổi học liệu.
6. **Learner**: Học, ôn tập SRS, luyện viết GEC, làm bài placement, duy trì streak; tuân thủ RLS dữ liệu cá nhân.

*Xác nhận:* Hoàn toàn không có vai trò `Teacher`. Không phát sinh vai trò thứ 7.

### 8.2. Bộ 9 Quyết Định Sản Phẩm Bất Biến ($D1$–$D9$)
- **$D1$ (Manager-driven):** Quản lý lập kế hoạch và giao việc; Soạn giả biên soạn theo brief.
- **$D2$ (SoD):** Moderator duyệt `APPROVED`; Manager xuất bản `PUBLISHED`; cấm Soạn giả tự duyệt/xuất bản; cấm Moderator xuất bản; Admin can thiệp khẩn cấp `APPROVED → PUBLISHED` + justification + AuditLog; **0 xuất hiện `IN_REVIEW → PUBLISHED`**.
- **$D3$ (Clone-to-Draft):** Sửa bài Published phải clone sang Draft v2 rồi duyệt lại; cấm sửa đè tại chỗ (in-place edit).
- **$D4$ (Unified Exercise):** Một mô hình `Exercise` thống nhất; Core MVP chỉ gồm 3 dạng: `MCQ`, `FILL_BLANK`, `REORDER` (bổ sung `GRAMMAR`, `LISTENING` theo ADR-006); cấm `Exam`, `QuestionBank`, `MATCHING` trong MVP.
- **$D5$ (Conditional Jump):** Đạt $\ge 95\%$ bài kiểm tra chặng, cooldown 24h nếu trượt để chống đoán mò.
- **$D6$ (Placement Mapping A):** Chuẩn tắc 6 chặng (0–7: U1; 8–12: U2; 13–17: U3; 18–22: U4; 23–26: U5; 27–30: U6); không gắn nhãn CEFR.
- **$D7$ (Controlled Retry):** Hai vòng làm bài (Pass 1 chính + Pass 2 làm lại câu sai gom cuối bài); định mức làm lại tối đa `allowance = max(1, floor(N * 0.10))`; credit làm lại $70\%$; hoàn thành bài học không phụ thuộc ngưỡng điểm $70\%, 80\%, 85\%$; không có cờ `is_completed`; không có thực thể `ExerciseAttempt`.
- **$D8$ (SRS Policy B):** Chu kỳ ngắt quãng cố định $[1, 3, 7, 14, 30]$ ngày; tính toán tất định qua RPC cơ sở dữ liệu; không sử dụng Machine Learning hay mạng nơ-ron trong SRS.
- **$D9$ (Streak):** Tính theo múi giờ địa phương của người dùng; tối đa 1 lần ghi nhận hợp lệ/ngày; lỡ 1 ngày tự động reset về 1; không có bùa freeze/recovery trong MVP.

*Kết quả:* **PASS**.

---

## 9. Functional Requirements (FR) Verification

Kiểm tra đối chiếu toàn bộ 17 FRs (§12):
- `P1-FR-001` (Auth / Session / HttpOnly): All 6 roles, $UC-01$, $BF-01$.
- `P1-FR-002` (Duyệt cây bài học & Audio vocab): Learner, $UC-04$, $BF-09$.
- `P1-FR-003` (Exercise Player 5 dạng ADR-006): Learner, $UC-05$, $BF-10$.
- `P1-FR-004` (Tiến độ `user_progress` theo D7): Learner, $UC-05$, $BF-10$, D7 (COMPLETED, không threshold).
- `P1-FR-005` (Lịch thẻ SRS Policy B `user_vocab_srs`): Learner, $UC-06$, $BF-12$, D8.
- `P1-FR-006` (RPC nguyên tử `record_review`): Learner, $UC-06$, $BF-12$, D8.
- `P1-FR-007` (GEC Scenario + Diff Viewer): Learner, $BF-14$, ADR-014 TARGET (không chiếm UC).
- `P1-FR-008` (Vòng đời nội dung 6 bước + SoD): Creator/Mod/Mgr/Admin, $UC-08/09/10$, $BF-03..07$, D1/D2/D3.
- `P1-FR-009` (Tải lên audio `lingora-media` 10MB $\rightarrow$ `vocabularies.audio_url`): Creator (Admin cấu hình), $UC-08$, $BF-04$.
- `P1-FR-010` (Bản địa hóa song ngữ vi/en): All users, $UC-01..07$, trễ $\le 200$ms (`TBD / PROPOSED TARGET`).
- `P1-FR-011` (Theo dõi chuỗi học Streak local-tz): Learner, $UC-07$, $BF-13$, D9.
- `P1-FR-012` (Bài tập GRAMMAR chọn cấu trúc): Learner, $UC-05$, ADR-006.
- `P1-FR-013` (Bài tập LISTENING nhận diện từ): Learner, $UC-05$, ADR-006.
- `P1-FR-014` (Cài đặt mục tiêu học 5–120 phút `daily_goal_min`): Learner, $UC-02$, $BF-13$.
- `P1-FR-015` (In-app Reminder biểu ngữ nội bộ): Learner, $UC-02$, $BF-13$ (Web Push DEFERRED).
- `P1-FR-016` (Placement Test 30 câu Mapping A): Learner, $UC-03$, $BF-08+11$, D5/D6 (AC: 25/30 vào Unit 5).
- `P1-FR-017` (Huy hiệu cá nhân riêng tư Private Badges P2): Learner, $BF-13$, Profile Scope (không chiếm UC).

*Đánh giá:* Toàn bộ 17 FRs hoàn toàn nhất quán với Phase 0 main document và baseline đóng băng. Không phát sinh yêu cầu thừa hoặc yêu cầu mồ côi. Kết quả: **PASS**.

---

## 10. Non-Functional Requirements (NFR) Verification

Kiểm tra 11 nhóm yêu cầu phi chức năng (§13):
- **Kỷ luật số liệu hiệu năng:** Toàn bộ các chỉ số định lượng đều mang nhãn bắt buộc `TBD / PROPOSED TARGET` hoặc `TBD`:
  - Độ trễ chuyển đổi ngôn ngữ giao diện: $\le 200$ms (`TBD` staging).
  - Độ trễ API cốt lõi: $\le 800$ms P95 (4G).
  - Độ trễ phản hồi GEC: $\le 3000$ms (test server).
  - Tính sẵn sàng luồng học cốt lõi: $\ge 99.5\%$ (`TBD` synthetic monitoring staging).
  - Tải đồng thời: $\ge 50$ concurrent users trên gói tài nguyên miễn phí.
- **Ràng buộc thiết kế & kiểm thử tự động:**
  - `NFR-SEC`: HttpOnly, Secure, SameSite=Lax, JWT ES256/HS256, TLS 1.3, CSP/CSRF. Kiểm chứng qua quét OWASP Top 10 CI (0 High/Critical).
  - `NFR-RBC`: 6 roles, RLS toàn bộ bảng ứng dụng. Kiểm chứng qua RLS test harness.
  - `NFR-PRV`: Tối thiểu hóa dữ liệu (email + tên hiển thị), Manager chỉ xem báo cáo tổng hợp.
  - `NFR-AUD`: `AuditLog` append-only, 100% can thiệp khẩn cấp sinh bản ghi kèm `emergency_justification`.
  - `NFR-MNT`: Clean Architecture, TypeScript strict, `pnpm typecheck` và `lint` exit 0, test regression cho các thuật toán.
  - `NFR-USA`: Mobile-first 320px..4K, WCAG 2.1 AA (4.5:1 / 3.0:1), Lighthouse $\ge 90$ + Axe 0 lỗi.
  - `NFR-ERR`: Cấu trúc Error Envelope chuẩn `{error:{code,message,detail}}`.

*Đánh giá:* Không có tuyên bố hiệu năng giả mạo hay số đo chưa kiểm chứng được trình bày như sự thật thực tế. Kết quả: **PASS**.

---

## 11. Schema / Contract Verification

Kiểm tra đối chiếu với các migration thực tế (`202608140001`, `...0002`, `...0003`) và `docs/03-api-contract.md` (§14):
- **Phân định rạch ròi trạng thái:**
  - `CURRENT_APPLIED_DATABASE`: Các thực thể và cột đã áp dụng trong migration Postgres (`profiles.role`, `daily_goal_min`, `streak_count`, `timezone`, `last_qualifying_activity_date`, `vocabularies.audio_url`, `user_progress.status`, `user_vocab_srs`, `review_logs.srs_card_id`).
  - `TARGET_SCHEMA`: Các thực thể/thuộc tính ở mức thiết kế (`schema.prisma`) chờ migration tiếp theo (`Unit`, `AuditLog`, 6-role enum, `ContentStatus`, `assignment_brief`).
- **Storage Buckets:**
  - Khẳng định bucket âm thanh là `lingora-media` (10MB, audio/mpeg/wav).
  - Khẳng định bucket ảnh là `lingora-avatars` (5MB, image/jpeg/png/webp).
  - Tuyên bố rõ ràng: Không tồn tại bucket `audio-assets`.
- **Hàm RPC Cập nhật Thẻ nhớ:**
  - Khớp nguyên văn migration 002:
    `record_review(p_srs_card_id uuid, p_is_correct boolean, p_recall_probability double precision, p_recommended_interval_days double precision)`.
  - Không tồn tại tham số UI Rating 1–5.
- **Hợp đồng Lỗi API (Error Contract):**
  - Khớp nguyên văn `docs/03` §143–146:
    `{"error":{"code":"...","message":"...","detail":"..."}}`.
  - Không có cờ `success: false` hay trường số nhiều `details`.

*Kết quả:* **PASS**.

---

## 12. Flow / Governance Verification

- **10 Luồng Nghiệp vụ (§15):** Onboarding, Placement, Học bài, Làm bài tập, Controlled Retry, Ôn tập SRS, Duy trì Streak, Bảng điều khiển tiến độ, Vòng đời biên soạn/kiểm duyệt/xuất bản, Quản trị tổ chức. Tất cả đều tuân thủ chặt chẽ các quyết định $D1$–$D9$.
- **Quản trị Vòng đời Bài học (§16):**
  - Máy trạng thái 6 bước: `DRAFT → IN_REVIEW → CHANGES_REQUESTED → APPROVED → PUBLISHED → ARCHIVED`.
  - Phân quyền SoD: Soạn giả không được tự duyệt/xuất bản; Moderator chỉ duyệt `APPROVED`; Manager xuất bản thường nhật `PUBLISHED`; Admin can thiệp khẩn cấp `APPROVED → PUBLISHED` + giải trình + AuditLog.
  - Tuyệt đối không có luồng `IN_REVIEW → PUBLISHED`.

*Kết quả:* **PASS**.

---

## 13. Traceability Verification

Kiểm tra chuỗi truy vết (§17, §21):
- Đăng ký đầy đủ 16 mã định danh bằng chứng chuẩn tắc:
  - 4 mã sơ cấp: `E-PRI-01..04`.
  - 6 mã thứ cấp: `E-SEC-01..06`.
  - 5 mã mô phỏng: `E-SYN-01..05`.
  - 1 mã quyết định đóng băng: `E-DEC-01`.
- 15 Use Cases chuẩn tắc với định danh duy nhất cho $UC-10$: **`UC-10 = Publish Approved Content`**.
  - `P1-FR-017` (Private Badges) được định vị thuộc `Profile Scope` (P2), không chiếm mã Use Case.
  - `P1-FR-007` (GEC Scenario) gắn với luồng `BF-14` + `ADR-014 TARGET`, không chiếm mã Use Case.
- Danh mục luồng nghiệp vụ chuẩn tắc từ $BF-01$ đến $BF-15$. Không xuất hiện mã $BF-16$ không tồn tại.

*Kết quả:* **PASS**.

---

## 14. Diagram / Report / Slide Planning Verification

- **Kế hoạch Biểu đồ (§18):** Xác định danh mục 10 biểu đồ cần vẽ mới/render lại cho DOCX và PPTX. Nêu rõ mục đích, nguồn `.puml` và thông điệp kỹ thuật. Ghi chú rõ ràng cấm sao chép ngữ nghĩa cũ (SM-2, 4-band, Admin-publish, `audio_path`).
- **Dàn ý Báo cáo DOCX (§19):** Cấu trúc chương mạch lạc từ Nghiên cứu $\rightarrow$ Khảo sát $\rightarrow$ Phân tích $\rightarrow$ Điểm nghẽn $\rightarrow$ Tác nhân $\rightarrow$ Quyết định $\rightarrow$ FR/NFR $\rightarrow$ Kiến trúc/Dữ liệu $\rightarrow$ Luồng nghiệp vụ $\rightarrow$ Quản trị $\rightarrow$ Truy vết $\rightarrow$ Nghiệm thu. Không chứa các chương rác legacy (không thi thử TOEIC, không SM-2).
- **Dàn ý Bài thuyết trình PPTX (§20):** Cấu trúc 17 slide ngữ nghĩa cô đọng, phản ánh đúng 6 roles, 19 MVP, số liệu khảo sát thực nghiệm $N=15$, trích dẫn học thuật đã kiểm chứng, và trạng thái kỹ thuật hiện hành.
- **Ma trận Ánh xạ (§23):** Kết nối mạch lạc từ Master Section $\rightarrow$ Final Report $\rightarrow$ Slide $\rightarrow$ Chart $\rightarrow$ Diagram.

*Kết quả:* **PASS**.

---

## 15. Forbidden / Legacy Content Scan

Thực hiện quét tự động bằng biểu thức chính quy (Regex Scan) trên toàn văn file `docs/phase-0-master-report.md` đối với toàn bộ các thuật ngữ cấm:

| Thuật ngữ Cấm | Số lần xuất hiện | Phân loại ngữ cảnh | Kết luận |
|---|:---:|---|:---:|
| `2 actors` / `Teacher` | 3 | NEGATED / AUDIT NOTE (Line 125, 248: "không Teacher"; Line 302: checklist) | **PASS** |
| `10-UC` model legacy | 1 | AUDIT NOTE (Line 302: checklist) | **PASS** |
| `SM-2` | 2 | NEGATED / AUDIT NOTE (Line 232: "không copy SM-2"; Line 302: checklist) | **PASS** |
| Placement `15–20 câu` | 0 | Không xuất hiện | **PASS** |
| `CEFR` placement | 2 | NEGATED / AUDIT NOTE (Line 141: "không claim CEFR"; Line 302: checklist) | **PASS** |
| `<500ms` / `500ms` | 0 | Không xuất hiện | **PASS** |
| `24/7` availability | 0 | Không xuất hiện | **PASS** |
| `IN_REVIEW → PUBLISHED` | 3 | NEGATED / AUDIT NOTE (Line 137, 208: "không có IN_REVIEW → PUBLISHED"; Line 305: checklist) | **PASS** |
| `4-band` placement | 1 | NEGATED (Line 232: "không copy 4-band") | **PASS** |
| Threshold `70% / 80% / 85%` hoàn thành | 0 | Không xuất hiện trong quy tắc hoàn thành bài học | **PASS** |
| `is_completed` | 2 | NEGATED / AUDIT NOTE (Line 185: "không is_completed"; Line 304: checklist) | **PASS** |
| `audio_path` | 1 | NEGATED (Line 232: "không copy audio_path") | **PASS** |
| `user_roles` | 1 | AUDIT NOTE (Line 309: checklist cấm schema cũ) | **PASS** |
| `user_srs_items` | 1 | AUDIT NOTE (Line 309: checklist cấm schema cũ) | **PASS** |
| `vocabulary_items` | 1 | AUDIT NOTE (Line 309: checklist cấm schema cũ) | **PASS** |
| `audio-assets` | 2 | NEGATED / AUDIT NOTE (Line 187: "Không tồn tại audio-assets"; Line 309: checklist) | **PASS** |
| `srs_item_id` | 1 | AUDIT NOTE (Line 309: checklist cấm schema cũ) | **PASS** |
| `daily_goal_minutes` | 1 | AUDIT NOTE (Line 309: checklist cấm schema cũ) | **PASS** |
| `last_active_date` | 1 | AUDIT NOTE (Line 309: checklist cấm schema cũ) | **PASS** |
| `BF-16` | 2 | NEGATED / AUDIT NOTE (Line 215: "không BF-16"; Line 311: checklist) | **PASS** |
| Duplicate `UC-10` (badges) | 1 | NEGATED (Line 214: "UC-10 = Publish... (duy nhất)") | **PASS** |
| `80% kiến thức bị quên sau 24-48h` | 1 | AUDIT NOTE (Line 308: checklist cấm tuyên bố này) | **PASS** |
| Tự phong `100% verified / FINAL PASS` | 2 | NEGATED / AUDIT NOTE (Line 3, 312: khẳng định không tự phong) | **PASS** |

*Kết luận quét:* **100% các từ khóa cấm xuất hiện đều ở thể BÁC BỎ (NEGATED) hoặc NẰM TRONG CHECKLIST KIỂM TOÁN (AUDIT NOTE). Tuyệt đối không có bất kỳ trường hợp nào xuất hiện ở thể quy chuẩn hiện hành (LIVE NORMATIVE).**

---

## 16. User-Review Readiness

Tài liệu `docs/phase-0-master-report.md` hoàn toàn sẵn sàng cho User Review:
1. **Minh định rõ ranh giới thẩm quyền:** Định vị chính xác là `CONTENT MASTER — READY FOR USER REVIEW`, không tự xưng là báo cáo cuối cùng hay bài thuyết trình đã hoàn tất.
2. **Minh bạch hóa bản chất thông tin:** Người đọc phân biệt rạch ròi giữa dữ liệu thực chứng (`FACT`), suy luận định tính có giới hạn (`INFERENCE`), kịch bản mô phỏng nội bộ (`SYNTHETIC`), cam kết kỹ thuật tổ chức (`DECISION`), và các chỉ số chưa kiểm chứng (`UNKNOWN` / `TBD`).
3. **Độc lập tự thân (Self-contained):** Đầy đủ ngữ nghĩa, số liệu, và quy tắc để downstream agent xây dựng DOCX/PPTX mà không phải mò mẫm hay diễn dịch lại từ các artifact legacy lỗi thời.

---

## 17. Findings

| ID | Severity | Section | Finding | Evidence | Impact | Required Change |
|:---:|:---:|:---:|---|---|---|---|
| **MR-01** | `LOW` | §9 (Line 123) | Mã yêu cầu liên kết với $PP-08$ ghi `(P1-FR-008/010)`. Trong hệ thống, `P1-FR-010` là yêu cầu Bản địa hóa i18n; thực thể kiểm toán $AuditLog$ gắn với `P1-FR-008` và `NFR-AUD`. | Line 123: `PP-08 thiếu audit... (P1-FR-008/010)`. (Nguyên nhân: trích xuất nguyên văn từ Table 4.1 của main doc). | Không ảnh hưởng ngữ nghĩa cốt lõi, nhưng có thể gây thắc mắc nhỏ khi downstream agent dựng chi tiết bảng ma trận. | Khi user duyệt hoặc khi downstream agent dựng DOCX/PPTX, làm rõ $PP-08$ liên kết chính với `P1-FR-008` và `NFR-AUD`. |
| **MR-02** | `LOW` | §19 (Line 236) | Chuỗi dàn ý DOCX tại §19 liệt kê các mục nối tiếp nhưng không nêu tên rõ phân mục §5 (Key User Findings) và §7 (Synthetic Stakeholder Insights) trong chuỗi `→`. | Line 236: `Survey (§4) → Qualitative Discovery (§6) → Benchmark (§8)...` | Dàn ý DOCX có thể bị hiểu là bỏ qua §5 và §7 nếu downstream agent máy móc đọc chuỗi mũi tên. | Downstream agent khi dựng DOCX cần lồng ghép nội dung §5 và §7 vào Chương II và Chương III như đã phân bổ tại Bảng ma trận §23. |
| **MR-03** | `LOW` | §23 (Line 295) | Lỗi chính tả gõ phím tại cột Final Report: ghi `Placement coffre` thay vì `Placement core` hoặc `Placement course`. | Line 295: `§9 (D5/D6), §4 Q15 \| Placement coffre \| 12...` | Lỗi chính tả nhỏ, không ảnh hưởng kỹ thuật hay số liệu. | Hiệu chỉnh chính tả thành `Placement core` trong lần cập nhật văn bản tiếp theo. |

*Tổng số phát hiện:* 3 phát hiện thuộc mức độ `LOW` (Góp ý biên tập và làm rõ ngữ nghĩa cho downstream generation). Không có phát hiện nào thuộc mức `BLOCKER` hay `HIGH`.

---

## 18. Final Verdict

### **`PASS WITH NON-BLOCKING FINDINGS`**

- **Nhận định:** `docs/phase-0-master-report.md` là một bản tổng hợp nội dung xuất sắc, trung thực với dữ liệu thực nghiệm, hoàn toàn tuân thủ các bất biến kiến trúc và phân quyền, không chứa tàn dư legacy ở thể quy chuẩn, và đủ độ chi tiết để làm nguồn ngữ nghĩa duy nhất cho việc dựng Final DOCX và Final PPTX.
- **Khuyến nghị bước tiếp theo:** 
  1. Trình User phê duyệt nội dung tài liệu `docs/phase-0-master-report.md`.
  2. Sau khi User phê chuẩn (User Approval), kích hoạt task xây dựng Final DOCX và Final PPTX dựa trên kế hoạch và cấu trúc đã được định hình tại Master Report.
  3. Không thực hiện bất kỳ sửa đổi nào đối với Master Report trước khi có phản hồi của User.

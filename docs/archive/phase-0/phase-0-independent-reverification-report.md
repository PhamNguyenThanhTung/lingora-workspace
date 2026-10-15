# Phase 0 Independent Re-Verification Report

> **Tư cách kiểm định:** Độc lập — Nghiêm ngặt — Tuyệt đối tuân thủ nguyên tắc Không Chỉnh Sửa Mã/Tài liệu Gốc (AUDIT ONLY).  
> **Đối tượng thẩm định:** `docs/phase-0-user-research-analysis-and-requirements.md` (DOC-PHASE-0-REQ-001, v1.0.0, 908 dòng, ngày 2026-09-15).  
> **Căn cứ chuẩn tắc tối cao (Core Baseline):** `docs/phase-0-roles-and-mvp-final.md` (FINAL FOR PHASE 0, 2026-09-07), `docs/phase-0-final-product-owner-decision-sheet.md` (D1–D9), `docs/09-placement-and-jump-specification.md` (Mapping A), `docs/07-data-dictionary.md`, `docs/03-api-contract.md`.  
> **Nguồn dữ liệu thực nghiệm:** `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` (16 dòng $\times$ 25 cột = 1 tiêu đề + $N=15$ học viên thật, 24 câu hỏi).  
> **Thời điểm thẩm định:** 2026-09-20.  
> **Tiêu chuẩn ghi nhận bằng chứng:** `FACT` (Quan sát / Tính toán trực tiếp) | `INFERENCE` (Suy luận logic có căn cứ) | `UNKNOWN` (Không có bằng chứng trong kho lưu trữ).

---

## 1. Executive Verdict (Kết Luận Điều Hành)

**KẾT LUẬN CUỐI CÙNG:** **`FAIL`**

### Tóm tắt Căn cứ Bác bỏ (FACT-backed Rationale):
Mặc dù tài liệu `docs/phase-0-user-research-analysis-and-requirements.md` đã có nỗ lực đáng kể trong việc loại bỏ dữ liệu ngoại lai ($N=500$ TOEIC từ đồ án tham khảo) và cô lập 20 Persona mô phỏng nội bộ vào phân mục riêng biệt, cuộc tái kiểm định độc lập phát hiện **nhiều sai lệch trọng yếu mang tính cấu trúc, vi phạm các bất biến đã đóng băng và gãy đổ truy vết kỹ thuật**:

1. **Vi phạm Bất biến Placement Mapping A (Bất biến D6) — `BLOCKER`:** `P1-FR-016` tự ý định nghĩa bảng dải điểm Placement Test 4 chặng chỉ bao phủ Unit 1 đến Unit 4 (0–7 câu: U1; 8–15 câu: U2; 16–23 câu: U3; 24–30 câu: U4), bỏ rơi hoàn toàn Unit 5 và Unit 6 của Khung Đề cương A1 6 Unit (Curriculum 08). Điều này mâu thuẫn trực tiếp với chuẩn tắc Mapping A 6 chặng (0–7: U1; 8–12: U2; 13–17: U3; 18–22: U4; 23–26: U5; 27–30: U6) tại `docs/09`, `docs/02` và `docs/05`.
2. **Vi phạm Bất biến Bài tập & Điều kiện Hoàn thành (Bất biến D7) — `BLOCKER`:** `P1-FR-004` áp đặt điều kiện tiên quyết $\ge 70\%$ câu đúng và Tiêu chí Nghiệm thu 80% điểm số, cùng trường dữ liệu `is_completed = true`. Điều này vi phạm dứt khoát quyết định D7 đã đóng băng: Hoàn thành bài học không phụ thuộc vào ngưỡng điểm $70/80/85\%$ mà phụ thuộc vào việc hoàn thành 2 vòng làm bài (Two-pass) và hoàn thành các câu làm sai trong hạn mức retry allowance (`max(1, floor(N*0.10))`). Đồng thời `is_completed` là trường bịa đặt (thực tế dùng enum `ProgressStatus`).
3. **Phá vỡ Phân định Trách nhiệm (Separation of Duties - D2) — `HIGH`:** Tại các mục §3.3.5, Table 4.1 (`PP-08`), và §6.2 (`NFR-AUD`), tài liệu mô hình hóa quyền can thiệp khẩn cấp của Quản trị viên là `IN_REVIEW → PUBLISHED`. Luồng này cho phép Admin nhảy cóc qua khâu kiểm duyệt học thuật của Moderator, vi phạm nguyên tắc SoD cốt lõi và mâu thuẫn với chính Bảng 5.2 (vốn ghi đúng `APPROVED → PUBLISHED`).
4. **Bịa đặt Thực thể và Tham số Cơ sở Dữ liệu / RPC — `HIGH`:** Tài liệu đưa vào các tên bảng và trường không tồn tại trong CSDL thực tế: `user_roles` (thay vì `Profile.role`), `user_srs_items` (thay vì `user_vocab_srs`), `vocabulary_items` (thay vì `vocabulary`), bucket `audio-assets` (thay vì `lingora-media`), `srs_item_id` (thay vì `srs_card_id`). Nghiêm trọng hơn, `P1-FR-006` mô tả gọi RPC `record_review` với tham số `rating` 1–5, trong khi hàm SQL thực tế trong migration `202608140002` nhận `p_is_correct boolean`.
5. **Sai lệch Hợp đồng Lỗi API (Error Contract) — `HIGH`:** `NFR-ERR` mô tả khung lỗi có bọc `"success": false` và dùng trường số nhiều `"details": {}`, trái ngược hoàn toàn với chuẩn tắc bất biến tại `docs/03-api-contract.md` (`{ "error": { "code", "message", "detail" } }`).
6. **Sai lệch Thống kê Khảo sát Thực nghiệm (Q4, Q23, Q24) — `MEDIUM`:** Bảng 1.4 và §1.2 báo cáo thiếu số liệu lựa chọn hình thức học ở Q4 (báo cáo Trung tâm 7/15 thay vì 9/15 thực tế; Website 6/15 thay vì 8/15 thực tế). Đồng thời khẳng định "100.0% phản hồi hợp lệ" ở Q23 và Q24 dù thực tế có 6–7 câu trả lời là "None" hoặc gõ phím vô nghĩa.
7. **Nguồn Trích dẫn Chết (HTTP 404) và Sai Lệch Metadata Học thuật — `HIGH`:** Đường dẫn S6 (`blog.duolingo.com/how-duolingo-streak-works/`) trả về mã lỗi HTTP 404. Các bài báo S1, S2, S3 dù có mã DOI thực tế nhưng bị sửa đổi/bịa đặt tên bài báo và tên tác giả so với ấn bản gốc đã xuất bản.
8. **Đứt gãy Truy vết Nội tài liệu (Orphan Evidence IDs) & Xung đột Mã Use Case — `HIGH`:** Hơn 40 vị trí viện dẫn các mã bằng chứng `E-PRI-*`, `E-SEC-*`, `E-SYN-*`, `E-DEC-*` nhưng tài liệu không hề có bảng tra cứu định nghĩa các mã này (bảng này chỉ nằm ở bản kế hoạch `plans/`). Ngoài ra, `P1-FR-017` gán mã `UC-10` cho Huy hiệu cá nhân, tạo xung đột trực tiếp với `UC-10` chuẩn tắc của hệ thống là "Publish Approved Content" (do Manager thực hiện).
9. **Khẳng định Vượt mức Sự thật (Overclaims) — `MEDIUM`:** Tuyên bố tại Mục 8 rằng hệ thống "Đạt 100% 6 Cổng Thẩm định", "100% verified", "0 orphan requirements" là hoàn toàn không đúng sự thật khi đối chiếu với các phát hiện trên.

---

## 2. Scope and Sources (Phạm Vi & Nguồn Thẩm Định)

Cuộc tái thẩm định độc lập đã đọc, đối chiếu và phân tích toàn diện các nguồn sau:

### 2.1. Tài liệu Cốt lõi & Chuẩn tắc Hệ thống (Direct Verification)
- **Chuẩn tắc Vai trò & Chức năng MVP:** `docs/phase-0-roles-and-mvp-final.md` (141 dòng, kiểm tra toàn bộ 6 vai trò, ma trận CRUD, quy trình 6 bước, 19 MVP functions).
- **Tài liệu Thẩm định Chính:** `docs/phase-0-user-research-analysis-and-requirements.md` (DOC-PHASE-0-REQ-001, 908 dòng).
- **Hồ sơ Quyết định Đóng băng Sản phẩm:** `docs/phase-0-final-product-owner-decision-sheet.md` (D1–D9).
- **Đặc tả Placement & Jump:** `docs/09-placement-and-jump-specification.md` (Mapping A dải 6 chặng, điều kiện Jump 1..3+).
- **Từ điển Dữ liệu & ERD Hiện thực:** `docs/07-data-dictionary.md` (17 thực thể hiện tại, phân định Applied vs Target).
- **Hợp đồng Giao diện Lập trình API:** `docs/03-api-contract.md` (Error Envelope §143–146).
- **Yêu cầu & Ma trận Truy vết Chuẩn:** `docs/02-requirements.md`, `docs/05-traceability-matrix.md`.
- **Phân tích Hệ thống:** `docs/06-system-analysis.md` (Danh mục 15 Use Cases, 15 Luồng nghiệp vụ BF-01..15).
- **Khung Đề cương Tiếng Anh A1:** `docs/08-english-a1-curriculum.md` (6 Units, 24 Lessons).
- **Tập lệnh Di chuyển CSDL (SQL Migrations):** `lingora-admin/prisma/migrations/` (`202608140001_init`, `202608140002_auth_rls_storage_record_review`, `202608140003_storage_two_bucket_size_enforcement`).

### 2.2. Nguồn Nghiên cứu Người dùng & Đo chuẩn
- **Khảo sát Thực nghiệm Thô:** `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` (16 dòng, 25 cột, kiểm toán độc lập từng ô dữ liệu qua openpyxl).
- **Nghiên cứu Mô phỏng Tác nhân:** `docs/phase-0-synthetic-stakeholder-research.md` (399 dòng, 20 personas SIM).
- **Kiểm tra Trực tiếp Nguồn Mạng:** Kiểm tra phản hồi HTTP thực tế của URL S6; tra cứu DOI học thuật S1, S2, S3 qua cơ sở dữ liệu CrossRef / Semantic Scholar / nhà xuất bản gốc.

---

## 3. Survey Verification (Kiểm Toán Khảo Sát Định Lượng Thô)

Toàn bộ 15 dòng phản hồi thực tế từ file Excel đã được đối soát độc lập với từng số liệu được công bố trong tài liệu Phase 0.

### 3.1. Bảng Đối Soát Chi Tiết Dữ Liệu Khảo Sát Thô ($N=15$, 24 Câu hỏi)

| Câu Hỏi / Luận Điểm | Số Liệu Báo Cáo Trong Tài Liệu Phase 0 | Tính Toán Trực Tiếp Từ Excel Thô | Nhãn Bằng Chứng | Kết Luận Thẩm Định | Ghi Chú Kỹ Thuật & Sai Lệch |
|---|---|---|:---:|:---:|---|
| **Quy mô mẫu ($N$)** | $N=15$, 24 câu hỏi | 16 dòng $\times$ 25 cột (1 header + 15 respondents, 24 câu + timestamp) | `FACT` | **PASS** | Đúng kích thước mẫu thực tế. |
| **Q1: Ngôn ngữ học** | Tiếng Anh 13/15 ($86.7\%$), gồm 3 học kèm tiếng Trung; Tiếng Trung 1/15 ($6.7\%$); Tiếng Nhật 1/15 ($6.7\%$) | 10 thuần Anh, 3 Anh+Trung, 1 thuần Trung, 1 thuần Nhật | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q2: Thời gian đã học** | <6 tháng: 7/15; 6th–1n: 2/15; 1–3 năm: 2/15; >3 năm: 4/15 | 7 / 2 / 2 / 4 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q3: Mục đích chính** | Công việc: 12/15; Chứng chỉ: 5/15; Giải trí: 4/15; Du lịch: 2/15 | 12 / 5 / 4 / 2 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q4: Hình thức học** | **Trung tâm: 7/15 ($46.7\%$); Website: 6/15 ($40.0\%$); Sách/tài liệu: 4/15; App: 3/15** | **Trung tâm: 9/15 ($60.0\%$); Website: 8/15 ($53.3\%$); Sách/tài liệu: 4/15; App: 3/15** | `FACT` | **FAIL (UNDERCOUNT)** | **Báo cáo thiếu 2 người ở Trung tâm và 2 người ở Website.** Do thuật toán split chuỗi không xử lý các ô phản hồi kết hợp bị cắt ngắn ("Trung tâm / Lớp học, Sư", "Trung tâm / Lớp học, "). |
| **Q5: Số giờ học/tuần** | <2h: 5/15; 2–5h: 6/15; 5–10h: 3/15; >10h: 1/15 (Tổng $\le 5$h: 11/15, $73.3\%$) | 5 / 6 / 3 / 1 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q6: Khó khăn lớn nhất** | Mã hóa 5 nhóm: 5/15, 5/15, 2/15, 1/15, 2/15 | 15 chuỗi văn bản tự do | `INFERENCE` | **PASS WITH NOTE** | Phân loại định tính có tính chủ quan của người mã hóa, nhưng hợp lý về mặt chủ đề. |
| **Q7: Kỹ năng khó nhất** | Từ vựng: 7; Nghe: 6; Nói: 6; Viết: 6; Ngữ pháp: 5; Đọc: 2 | 7 / 6 / 6 / 6 / 5 / 2 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q8: Quên từ vựng** | Rất thường xuyên: 8/15; Thỉnh thoảng: 7/15; Không bao giờ: 0/15 ($100\%$ gặp vấn đề) | 8 rất thường xuyên, 7 thỉnh thoảng, 0 không bao giờ | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. Căn cứ cho SRS. |
| **Q9: Bỏ học giữa chừng** | Có: 13/15 ($86.7\%$); Không: 2/15 ($13.3\%$) | 13 Có / 2 Không | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. Căn cứ cho Streak. |
| **Q10: Lý do bỏ học** | Quá bận: 9; Phương pháp kém: 8; Quá khó/chán: 6; Mất động lực: 6; Không tiến bộ: 3; Cá nhân: 1 | 9 / 8 / 6 / 6 / 3 / 1 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q11: Động lực học** | Công việc/tiền: 5; Chứng chỉ: 2; Quan trọng: 2; Video: 1; Khác/Trống: 5 | 5 / 2 / 2 / 1 / 5 người | `INFERENCE` | **PASS** | Mã hóa câu trả lời mở hợp lý. |
| **Q12: Cách học từ vựng** | Flashcard: 10; Sổ tay: 6; Ngữ cảnh: 4; App: 4; Danh sách: 2; Không biết: 1 | 10 / 6 / 4 / 4 / 2 / 1 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q13: Cần thiết SRS** | Điểm TB: 4.13/5; Tích cực: 12/15 ($80.0\%$); Phân bổ: 5: 8, 4: 4, 3: 1, 2: 1, 1: 1 | Tổng điểm = 62; TB = 4.133; Phân bổ khớp 100% | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q14: Tăng từ làm sai** | Điểm TB: 4.00/5; Tích cực: 9/15 ($60.0\%$); Phân bổ: 5: 7, 4: 2, 3: 5, 2: 1 | Tổng điểm = 60; TB = 4.000; Phân bổ khớp 100% | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q15: Đề xuất lộ trình** | Có thể thử: 9; Rất muốn: 5; Không cần: 1 (Quan tâm: 14/15, $93.3\%$) | 9 / 5 / 1 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. Căn cứ cho Placement. |
| **Q16: Bài tập sau bài** | Điểm TB: 3.80/5; Tích cực: 10/15 ($66.7\%$); Phân bổ: 5: 6, 4: 4, 3: 3, 1: 2 | Tổng điểm = 57; TB = 3.800; Phân bổ khớp 100% | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q17: Dạng bài tập muốn** | Điền từ: 11; Trắc nghiệm: 9; Nghe: 8; Ghép từ: 7; Sắp xếp: 6; Dịch: 6; Viết: 5 | 11 / 9 / 8 / 7 / 6 / 6 / 5 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q18: Theo dõi tiến độ** | Điểm TB: 3.93/5; Tích cực: 9/15 ($60.0\%$); Phân bổ: 5: 6, 4: 3, 3: 5, 2: 1 | Tổng điểm = 59; TB = 3.933; Phân bổ khớp 100% | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q19: Thông tin theo dõi** | Điểm: 10; Tiến bộ: 7; Bài xong: 5; Thời gian: 5; Số từ: 4 | 10 / 7 / 5 / 5 / 4 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q20: Hội thoại ngữ cảnh** | Điểm TB: 3.60/5; Tích cực: 8/15 ($53.3\%$); Phân bổ: 5: 4, 4: 4, 3: 5, 2: 1, 1: 1 | Tổng điểm = 54; TB = 3.600; Phân bổ khớp 100% | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q21: Hỗ trợ khi viết/AI** | Sửa lỗi: 10; Gợi ý: 9; Giải thích: 8; Đánh giá: 8; Đóng vai: 7 | 10 / 9 / 8 / 8 / 7 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q22: Top 3 tính năng** | Từ vựng: 9; AI: 8; Phát âm: 7; Bài tập: 7; SRS: 5; Lộ trình: 4; Tiến độ: 3; Nhắc nhở: 2 | 9 / 8 / 7 / 7 / 5 / 4 / 3 / 2 người | `FACT` | **PASS** | Khớp 100% dữ liệu gốc. |
| **Q23 & Q24: Câu hỏi mở** | **Khẳng định "100.0% phản hồi hợp lệ"** | **Q23 có 6 ô "None", 1 ô gõ bậy "Wrfddf", 1 ô "Chưa biết"; Q24 có 7 ô "None", 1 ô "Fhdfg". Chỉ có 4–5 phản hồi có nội dung thực chất.** | `FACT` | **FAIL (OVERCLAIM)** | **Thổi phồng mức độ hợp lệ của dữ liệu mở.** Cần ghi nhận trung thực tỷ lệ phản hồi rỗng/vô nghĩa. |
| **Bảng 1.1 Dòng 7: Phát âm** | Ghi "6/15 (40.0%)" trích từ Q6, Q8, Q9, Q10 | Q10 không có tùy chọn phát âm; Q7 có Nói: 6 và Nghe: 6 | `INFERENCE` | **WEAK TRACE** | Lấy số liệu từ Q7 nhưng tiêu đề nguồn bảng chỉ ghi Q6, Q8, Q9, Q10. |

---

## 4. Interview Verification (Kiểm Toán Phỏng Vấn Định Tính P1–P6)

### 4.1. Thực Trạng Bằng Chứng Phỏng Vấn Trong Repository
- **Sự vắng mặt của biên bản gốc (Raw Transcripts):** Không tìm thấy bất kỳ file ghi âm, file text hay tài liệu Word thô nào (như `phong_van.docx` được nhắc tới trong các ghi chú cũ) trong toàn bộ kho lưu trữ (`FACT`).
- **Thừa nhận về mặt phương pháp (§3.1):** Tài liệu Phase 0 đã chủ động công bố hạn chế này: không đưa vào các trích dẫn nguyên văn (verbatim quotes) để tránh ngụy tạo lời nói (`FACT PASS`).

### 4.2. Điểm Tồn Tại Cần Chỉnh Lý (Findings)
- **Hư cấu thông tin nhân khẩu học cụ thể trong Bảng 3.1:** Bảng 3.1 mô tả chi tiết danh tính giả định của 6 người học: tên họ đầy đủ (Nguyễn Văn A đến Đỗ Quốc F), độ tuổi chính xác (22, 26, 29, 23, 17, 31), nghề nghiệp cụ thể (SV CNTT năm cuối, kế toán, kỹ sư xây dựng, cử nhân kinh tế mới ra trường, học sinh THPT, trưởng nhóm kinh doanh bất động sản), cùng các chi tiết rất cụ thể như "bài học quá 15 phút", "ép học từ Hello/Boy/Girl".
- **Xác lập ranh giới bằng chứng:**
  - *Chủ đề nhu cầu (Themes):* Cần SRS, bài học ngắn, giải thích ngữ pháp, kiểm tra đầu vào $\rightarrow$ Được xác nhận là `INFERENCE` hợp lý (suy diễn từ các ghi nhận đề cương báo cáo trước đây).
  - *Chi tiết nhân khẩu học và hoàn cảnh cá nhân cụ thể:* Bắt buộc phải gắn nhãn là `UNKNOWN / ILLUSTRATIVE PERSONA` chứ không được trình bày như dữ liệu thu thập thực tế (`FACT`).

---

## 5. Synthetic Stakeholder Research Verification (Kiểm Toán Nghiên Cứu Mô Phỏng)

- **Cô lập kịch bản mô phỏng (§3.3):** Tài liệu đã tuân thủ nghiêm ngặt việc cô lập 20 Persona nội bộ (Manager, Creator, Moderator, Operations, Admin) trong hộp cảnh báo `[SYNTHETIC / SIMULATED — FOR REQUIREMENT-DISCOVERY ONLY]` (`FACT PASS`).
- **Không có hiện tượng ngụy tạo tỷ lệ:** Không phát hiện bất kỳ câu chữ nào biến Persona mô phỏng thành số liệu phần trăm khảo sát người thật (ví dụ: không có "80% kiểm duyệt viên cho rằng...") (`FACT PASS`).
- **Nguồn gốc tài liệu:** Khớp hoàn toàn với tài liệu nguồn `docs/phase-0-synthetic-stakeholder-research.md` (`FACT PASS`).

---

## 6. Benchmark Verification (Kiểm Toán Đối Chuẩn Nền Tảng)

### 6.1. Ranh Giới Đối Chuẩn & Quyết Định Công Nghệ
- Việc lựa chọn Duolingo, Quizlet, ELSA Speak và bác bỏ dứt khoát các ứng dụng luyện thi TOEIC (Prep, IIG, TaToiec) là hoàn toàn phù hợp với Bất biến D4 (Unified Exercise Model, không Exam/QuestionBank) (`FACT PASS`).
- Ma trận 17 tiêu chí kỹ thuật (Bảng 2.1) và bảng Adopt/Adapt/Reject (Bảng 2.2) có cấu trúc sư phạm rõ ràng (`FACT PASS`).

### 6.2. Kiểm Toán Nguồn Trích Dẫn Đối Chuẩn & Sai Lệch Chi Tiết

| Mã Tiêu Chí / Tham Chiếu | Nguồn Trích Dẫn Công Bố | Kết Quả Kiểm Tra Thực Tế | Nhãn | Mức Độ | Sai Lệch Cụ Thể |
|:---:|---|---|:---:|:---:|---|
| **[S6] Duolingo Streak** | `https://blog.duolingo.com/how-duolingo-streak-works/` | **HTTP 404 Not Found** (Kiểm tra trực tiếp 2026-09-20) | `FACT` | **HIGH** | **Đường dẫn chết (Dead link).** Con số "tăng khả năng hoàn thành 3.6 lần" mất nguồn kiểm chứng trực tiếp. |
| **[S1] Hwang et al. (2024)** | DOI: `10.1017/S0272263124000354` | DOI tồn tại trên Cambridge Core; tác giả đúng; cỡ mẫu $N=3,670$ đúng; **nhưng tên bài báo trong tài liệu bị sai lệch** | `FACT` | **HIGH** | Tên thật: *"Acceptance and engagement patterns of mobile-assisted language learning among non-conventional adult L2 learners: A survival analysis"* (không phải "Determinants of adult..."). |
| **[S2] Pikhart et al. (2024)** | DOI: `10.3389/feduc.2024.1412377` | DOI tồn tại trên Frontiers in Education; tác giả đúng; **nhưng tên bài báo bị sai lệch** | `FACT` | **HIGH** | Tên thật: *"Exploring university students' preferences and satisfaction in utilizing digital tools for foreign language learning"*. |
| **[S3] Tran & Nguyen (2026)** | DOI: `10.58806/ijsshmr.2026.v5i6n29` | DOI tồn tại trên tạp chí *IJSSHMR*; nội dung khảo sát Duolingo tại VN đúng; **nhưng tên tác giả và tên bài báo bị sai lệch** | `FACT` | **HIGH** | Tác giả thật: *Tran Anh Vu & Nguyen Lan Huong*; Tên bài thật: *"Eighth-Grade EFL Learners' Perceptions of Duolingo for English Vocabulary Learning: A Quantitative Survey in Vietnam"*. |
| **B2: Placement Test** | `support.duolingo.com` | Mô tả dải điểm gán `starting_unit (Unit 1, 2, 3, 4)` | `FACT` | **HIGH** | Áp đặt dải điểm 4 Unit vi phạm Placement Mapping A 6 Unit (Bất biến D6). |
| **B4: Micro-learning** | Cites Settles & Meeder (2016) | Bài báo của Settles & Meeder nghiên cứu về Spaced Repetition (HLR), không nghiên cứu về độ dài phiên học micro-learning | `FACT` | **MEDIUM** | Gán ghép sai căn cứ học thuật (Misattribution). |
| **B8: Error Retry** | Cites "(Controlled Retry 10% - D5)" | Quyết định D5 là Conditional Jump; Controlled Retry là **Quyết định D7** | `FACT` | **MEDIUM** | Trích dẫn sai mã quyết định đóng băng. |
| **B9: Reminder** | "hỗ trợ thông báo đẩy trình duyệt tùy chọn" | ADR-006 & ADR-008 đã **hoãn (DEFERRED)** Web Push (6a/6b); chỉ duyệt In-app 6d | `FACT` | **HIGH** | Trình bày tính năng đã hoãn như phạm vi được hỗ trợ. |
| **B12: Jump Review** | Cites "(D5, P1-FR-016)" | P1-FR-016 là Placement Test; Jump là quy tắc kiểm tra vượt chặng (D5, UC-04, BF-11) | `FACT` | **LOW** | Nhầm lẫn liên kết yêu cầu chức năng. |
| **B14: Incubator** | `incubator.duolingo.com` | Duolingo Incubator đã chính thức đóng cửa/ngừng hoạt động từ năm 2021 | `FACT` | **MEDIUM** | Nguồn tham chiếu lịch sử đã lỗi thời (Stale source). |
| **B15: RBAC & SoD** | ISO/IEC 19788 | ISO/IEC 19788 là tiêu chuẩn Metadata học liệu (MLR), không phải tiêu chuẩn phân quyền RBAC/SoD | `FACT` | **MEDIUM** | Viện dẫn tiêu chuẩn không đúng phạm vi chuyên môn. |

---

## 7. Role & Actor Verification (Kiểm Toán Vai Trò & Tác Nhân)

- **Số lượng vai trò chuẩn tắc:** Đúng 6 vai trò (`Learner`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`, `Administrator`). Không có vai trò thứ 7; vai trò `Teacher` được loại trừ chính xác (`FACT PASS`).
- **Ma trận SoD Bảng 5.2:** Phân định rõ ràng: Creator chỉ nộp bài; Moderator chỉ duyệt `APPROVED`; Manager xuất bản `PUBLISHED`; cấm tự duyệt và tự xuất bản (`FACT PASS`).
- **LỖI PHÂN QUYỀN TRỌNG YẾU (HIGH):**
  - Tại §3.3.5 (dòng 356), Bảng 4.1 (`PP-08`, dòng 401), và §6.2 (`NFR-AUD`, dòng 803), tài liệu định nghĩa luồng can thiệp khẩn cấp của Quản trị viên là **`IN_REVIEW → PUBLISHED`**.
  - Đây là sự vi phạm nghiêm trọng nguyên tắc Separation of Duties (D2): Quản trị viên xuất bản thẳng bài học từ hàng đợi `IN_REVIEW` mà không cần kiểm duyệt học thuật của Moderator.
  - Theo chuẩn tắc `docs/phase-0-roles-and-mvp-final.md` §4 và chính Bảng 5.2 dòng 6, can thiệp khẩn cấp của Admin chỉ áp dụng khi bài đã **`APPROVED`** nhưng Manager vắng mặt hoặc sự cố vận hành (`APPROVED → PUBLISHED`).

---

## 8. D1–D9 Invariant Verification (Kiểm Toán 9 Bất Biến Sản Phẩm)

| Bất Biến | Nội Dung Chuẩn Tắc (Baseline) | Trạng Thái Trong Tài Liệu Phase 0 | Kết Luận | Chi Tiết Sai Lệch & Bằng Chứng |
|---|---|---|:---:|---|
| **D1** | Khung bài học do Manager chủ trì; Creator không vượt rào | Thể hiện đầy đủ tại §5.2 dòng 1, §5.3 §1, P1-FR-008 | **PASS** | `FACT`: Tuân thủ nghiêm ngặt. |
| **D2** | SoD: Mod duyệt, Manager publish; cấm tự duyệt/publish | Bảng 5.2 đúng; nhưng §3.3.5, PP-08, NFR-AUD ghi Admin `IN_REVIEW → PUBLISHED` | **PARTIAL FAIL (HIGH)** | `FACT`: Xuất hiện luồng nhảy cóc kiểm duyệt sai quy định. |
| **D3** | Clone-to-Draft khi sửa bài Published; loại trừ `ARCHIVED → DRAFT` khỏi Core | Thể hiện rõ ràng tại §5.2 dòng 7–8, §5.3 §3, P1-FR-008 | **PASS** | `FACT`: Tuân thủ nghiêm ngặt. |
| **D4** | Unified Exercise: MVP gồm MCQ, FILL_BLANK, REORDER; không Exam, không QuestionBank, không MATCHING | Bác bỏ Exam, QuestionBank, MATCHING; nhưng gộp cả LISTENING, GRAMMAR vào MVP core | **PASS WITH NOTE** | `FACT`: Bác bỏ đúng; việc đưa LISTENING/GRAMMAR từ ADR-006 vào làm lệch nhẹ câu chữ "3 dạng bài" của `roles-final`. |
| **D5** | Conditional Jump: $\ge 95\%$ đúng; rớt chờ 24h; lũy tiến 1, 2–3, >3 | Thể hiện đúng tại §3.3, Bảng 3.2, PP-03; nhưng B12/FR-016 trích dẫn nhầm | **PASS WITH NOTE** | `FACT`: Quy tắc nghiệp vụ đúng; lỗi liên kết văn bản nhỏ. |
| **D6** | **Placement Mapping A:**<br>• 0–7 $\rightarrow$ U1<br>• 8–12 $\rightarrow$ U2<br>• 13–17 $\rightarrow$ U3<br>• 18–22 $\rightarrow$ U4<br>• 23–26 $\rightarrow$ U5<br>• 27–30 $\rightarrow$ U6 | **`P1-FR-016` định nghĩa dải 4 Unit:**<br>• 0–7 $\rightarrow$ U1<br>• 8–15 $\rightarrow$ U2<br>• 16–23 $\rightarrow$ U3<br>• 24–30 $\rightarrow$ U4 | **FAIL (BLOCKER)** | **`FACT`: Bịa đặt một bảng Mapping A hoàn toàn khác, cắt xén 2 Unit cuối của khung chương trình A1.** |
| **D7** | **Controlled Retry:** 2 vòng làm bài; wrong items to end; retry allowance = $\max(1, \lfloor N \times 0.10 \rfloor)$; 70% credit; **không phụ thuộc ngưỡng điểm 70/80/85%; không có `ExerciseAttempt`** | **`P1-FR-004` áp đặt:** Tiền điều kiện $\ge 70\%$ câu đúng; AC yêu cầu 80% điểm; gán trường `is_completed = true` | **FAIL (BLOCKER)** | **`FACT`: Vi phạm trực tiếp định nghĩa hoàn thành bài học không điểm số của D7; bịa đặt trường CSDL.** |
| **D8** | SRS Policy B: khoảng cách $[1, 3, 7, 14, 30]$; không ML; không KnowledgeItem/LearnerSkillState | Khoảng cách đúng; nhưng mô tả Rating 1–5 và gọi RPC sai tham số | **PARTIAL FAIL (HIGH)** | `FACT`: Khoảng cách đúng; sai lệch hoàn toàn ở tầng giao tiếp CSDL/RPC. |
| **D9** | Streak theo múi giờ địa phương; tối đa 1 lần/ngày; đứt chuỗi về 1; không freeze/recovery MVP | Thể hiện đúng các quy tắc tính chuỗi; trường dữ liệu gọi tên `last_active_date` | **PASS WITH NOTE** | `FACT`: Quy tắc nghiệp vụ đúng; tên trường schema chưa chuẩn. |

---

## 9. Functional Requirements Verification (Kiểm Toán Yêu Cầu Chức Năng)

Tài liệu đặc tả 17 Yêu cầu Chức năng (`P1-FR-001` đến `P1-FR-017`). Các sai lệch trọng yếu được ghi nhận như sau:

1. **`P1-FR-001` (Auth & RBAC):** Viện dẫn bảng `user_roles` để kiểm tra quyền. CSDL Supabase hiện thực lưu vai trò trực tiếp trong `Profile.role` (`profiles.role`), không tồn tại bảng riêng `user_roles`.
2. **`P1-FR-004` (Lesson Progress):**
   - Tiền điều kiện bắt buộc $\ge 70\%$ và AC đạt $80\%$ vi phạm Bất biến D7 (`BLOCKER`).
   - Cập nhật `is_completed = true` là sai lệch mô hình dữ liệu (chuẩn là enum `ProgressStatus`: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).
3. **`P1-FR-005` & `P1-FR-006` (SRS Scheduling & RPC):**
   - Viện dẫn bảng `user_srs_items`, trường `srs_item_id`, `repetition`, `interval`. Bảng thực tế trong migration 001 là `user_vocab_srs`, trường `srs_card_id`, `intervalDays`.
   - Mô tả học viên đánh giá Rating 1–5 và RPC phân nhánh theo `rating >= 3`. Migration 002 hiện thực hàm `record_review(p_srs_card_id uuid, p_is_correct boolean, p_recall_probability double precision, p_recommended_interval_days double precision)` nhận tham số kiểu `boolean`, không nhận integer rating.
4. **`P1-FR-007` (Grammar Checker Diff):** Liên kết tới Use Case mang tên phi chuẩn `UC-06-viết`.
5. **`P1-FR-009` (Audio Management):**
   - Chỉ định bucket lưu trữ là `audio-assets` dung lượng $\le 5$MB.
   - Kiến trúc chuẩn tắc (ADR-003, Migration 003) phân lập 2 bucket: `lingora-avatars` (2MB) và `lingora-media` (10MB). Không có bucket nào tên là `audio-assets`.
   - Lưu URL vào bảng `vocabulary_items` (bảng chuẩn là `vocabulary`).
6. **`P1-FR-010` (i18n):** Tiêu chí nghiệm thu đặt chỉ số độ trễ chuyển ngữ `< 100ms` mâu thuẫn với `NFR-LOC` quy định `< 200ms`.
7. **`P1-FR-011` (Streak):** Gọi tên trường lưu trữ là `last_active_date` thay vì `lastQualifyingActivityDate` trong data dictionary.
8. **`P1-FR-014` & `P1-FR-015` (Daily Goal & In-app Reminder):**
   - Cột truy vết Table 6.2 gán liên kết với `BF-02` (Course/Unit Planning) là sai luồng nghiệp vụ.
   - Gọi tên trường `daily_goal_minutes` thay vì `dailyGoalMin`.
9. **`P1-FR-016` (Placement Test):**
   - Tự chế dải điểm 4 Unit (0–7: U1, 8–15: U2, 16–23: U3, 24–30: U4) phá vỡ Bất biến D6 Mapping A 6 Unit (`BLOCKER`).
10. **`P1-FR-017` (Private Badges):**
    - Gán mã `UC-10` trong bảng Table 6.2, xung đột trực tiếp với `UC-10 Publish Content` của phân hệ Quản trị nội dung (`HIGH`).

---

## 10. Non-Functional Requirements Verification (Kiểm Toán Yêu Cầu Phi Chức Năng)

Tài liệu công bố 11 nhóm NFR (`NFR-SEC` đến `NFR-LOC`). Kết quả rà soát phân loại như sau:

### 10.1. Đánh giá Chỉ số Số học & Tính Kỷ Luật
- **Engineering Targets (Hợp lệ):** `NFR-PER` ($\le 800$ms P95, GEC $\le 3000$ms) và `NFR-CAP` ($\ge 50$ concurrent users) đã tuân thủ việc dán nhãn `TBD / PROPOSED TARGET` kèm phương pháp đo kiểm (`k6`) (`PASS`).
- **Chỉ số Áp đặt Không Căn cứ (Unsupported / Mandatory Overclaim):**
  - `P1-FR-010` AC quy định chuyển ngữ `< 100ms` và `NFR-LOC` quy định `< 200ms` không có căn cứ đo kiểm.
  - `NFR-REL` cam kết độ sẵn sàng $\ge 99.5\%$ không có bằng chứng hạ tầng hoặc SLA nhà cung cấp.
  - `NFR-SEC`, `NFR-RBC`, `NFR-MNT` tuyên bố các chỉ số tuyệt đối hóa "100% HttpOnly", "0 lỗ hổng bảo mật", "100% độ bao phủ RLS", "pnpm exit code 0" mang tính khẳng định cam kết chứ không phải yêu cầu người dùng thực nghiệm.

### 10.2. Sai Lệch Hợp Đồng API Lỗi (Error Envelope Mismatch — HIGH)
- Tại `NFR-ERR` (Bảng 6.1, dòng 805), tài liệu bắt buộc 100% phản hồi lỗi phải đóng gói theo cấu trúc:
  ```json
  { "success": false, "error": { "code": "STRING", "message": "Thân thiện", "details": {} } }
  ```
- **Đối chiếu Hợp đồng Chuẩn (`docs/03-api-contract.md` §143–146):**
  ```json
  { "error": { "code": "STRING", "message": "Thông điệp", "detail": {} } }
  ```
- **Sai lệch cụ thể:**
  1. Thừa trường bao ngoài `"success": false` (Chuẩn tắc không sử dụng bọc wrapper boolean).
  2. Trường chi tiết lỗi là danh từ số ít `"detail"`, tài liệu viết thành số nhiều `"details"`.

---

## 11. Data & Schema Claim Verification (Kiểm Toán Tuyên Bố CSDL / Lược Đồ)

Tài liệu Phase 0 đã vi phạm ranh giới hiện thực khi biến nhiều thiết kế mục tiêu hoặc tên gọi tự chế thành dữ liệu hiển nhiên:

| Tên Bảng / Thực Thể Trong Phase 0 | Trạng Thái Trong `docs/07` & Migrations Thực Tế | Phân Loại Ranh Giới Chuẩn Tắc | Kết Luận Thẩm Định |
|---|---|:---:|:---:|
| `user_roles` | Không tồn tại. Vai trò được lưu tại `Profile.role` (`profiles.role`) | `CURRENT_APPLIED_DATABASE` | **SAI LỆCH (BỊA ĐẶT TÊN BẢNG)** |
| `user_srs_items` | Không tồn tại. Bảng thực tế là `user_vocab_srs` (Model `UserVocabSrs`) | `CURRENT_APPLIED_DATABASE` | **SAI LỆCH (BỊA ĐẶT TÊN BẢNG)** |
| `vocabulary_items` | Không tồn tại. Bảng thực tế là `vocabulary` (Model `Vocabulary`) | `CURRENT_APPLIED_DATABASE` | **SAI LỆCH (BỊA ĐẶT TÊN BẢNG)** |
| `srs_item_id` | Trường thực tế liên kết thẻ nhớ là `srs_card_id` | `CURRENT_APPLIED_DATABASE` | **SAI LỆCH (BỊA ĐẶT TÊN CỘT)** |
| Bucket `audio-assets` | Không tồn tại. 2 bucket duy nhất là `lingora-avatars` và `lingora-media` | `CURRENT_APPLIED_DATABASE` | **SAI LỆCH (BỊA ĐẶT BUCKET)** |
| `AuditLog` | Đã có trong `prisma/schema.prisma` mục tiêu, chưa có trong migration SQL | `TARGET_SCHEMA` | **CHẤP NHẬN (CẦN GHI RÕ TARGET)** |
| `Unit` | Đã có trong `prisma/schema.prisma` mục tiêu, chưa có trong migration SQL | `TARGET_SCHEMA` | **CHẤP NHẬN (CẦN GHI RÕ TARGET)** |
| `Badge` / `UserBadge` | Không có trong schema hiện tại lẫn schema mục tiêu; thuộc phân loại P2 | `FUTURE / PROPOSED` | **CHẤP NHẬN (KHÔNG ĐƯỢC COI LÀ CORE)** |

---

## 12. Citation & Traceability Verification (Kiểm Toán Trích Dẫn & Truy Vết)

### 12.1. Đứt Gãy Bảng Đăng Ký Mã Bằng Chứng (Orphan Evidence IDs)
- Trong các yêu cầu chức năng và Bảng ma trận truy vết 6.2, các mã bằng chứng xuất hiện dày đặc: `E-PRI-01`, `E-PRI-02`, `E-PRI-03`, `E-PRI-04`, `E-SEC-01`..`06`, `E-SYN-01`..`04`, `E-DEC-01`.
- **Phát hiện kiểm toán (`FACT`):** Toàn bộ tài liệu `docs/phase-0-user-research-analysis-and-requirements.md` **hoàn toàn không có bảng định nghĩa/đăng ký cho các mã này** (Mục 0.1 chỉ nêu 4 nhãn phân loại, không có danh mục mã). Bảng đăng ký chi tiết chỉ nằm trong tài liệu kế hoạch biên soạn (`plans/`). Một tài liệu đặc tả chính thức không thể viện dẫn các mã nội bộ mà không có bảng tra cứu định danh.

### 12.2. Xung Đột Mã Use Case & Luồng Nghiệp Vụ
- **Xung đột kép tại `UC-10`:**
  - Dòng `P1-FR-017` gán `UC-10` cho *Private Badges*.
  - Dòng `P1-FR-008` gán `UC-10` cho *Publish Approved Content*.
  - Danh mục Use Case chuẩn tắc hệ thống (`docs/06-system-analysis.md`) khẳng định: `UC-10` là **Publish Approved Content**; Huy hiệu cá nhân chỉ là tính năng phụ P2 không chiếm mã Use Case cốt lõi.
- **Viện dẫn luồng nghiệp vụ không tồn tại:** Cột cuối Table 6.2 ghi nhận NFR liên kết tới `BF-01..16`. Trong `docs/06-system-analysis.md`, danh mục luồng nghiệp vụ chỉ dừng lại ở **`BF-15`**; mã `BF-16` hoàn toàn không tồn tại.
- **Sai lệch liên kết luồng:** `P1-FR-014` và `P1-FR-015` liên kết với `BF-02` (Course/Unit Planning) thay vì các luồng người học.

---

## 13. Conflicts / Duplicates / Obsolete Artifacts (Xung Đột, Trùng Lặp & Tài Liệu Cũ)

Qua rà soát toàn bộ kho lưu trữ, các tài liệu liên quan đến Phase 0 được phân loại và định vị như sau:

| Đường Dẫn Tài Liệu | Trạng Thái Phân Loại | Số Lượt Tham Chiếu Trong Repo | Quyết Định Xử Lý | Lý Do Kỹ Thuật & Căn Cứ |
|---|:---:|:---:|:---:|---|
| `docs/phase-0-roles-and-mvp-final.md` | `KEEP (CORE BASELINE)` | 20 references | **BẢO TỒN TUYỆT ĐỐI** | Căn cứ chuẩn tắc tối cao cho 6 vai trò, quy trình 6 bước, 19 MVP functions. |
| `docs/phase-0-final-product-owner-decision-sheet.md` | `KEEP (ACTIVE DECISION)` | 13 references | **BẢO TỒN TUYỆT ĐỐI** | Hồ sơ đóng băng chính thức các quyết định D1–D9 từ Product Owner. |
| `docs/phase-0-synthetic-stakeholder-research.md` | `KEEP (ACTIVE SYNTHETIC)` | 8 references | **BẢO TỒN TUYỆT ĐỐI** | Tài liệu nguồn cho 20 Persona mô phỏng nội bộ; đã được dán nhãn chuẩn. |
| `docs/phase-0-user-research-analysis-and-requirements.md` | `KEEP BUT REVIEW` | 8 references | **GIỮ NGUYÊN ĐỂ SỬA THEO BÁO CÁO** | Tài liệu chính đang bị kiểm toán; giữ nguyên hiện trạng để làm đầu vào cho task sửa. |
| `docs/phase-0-mock-survey-report.md` | `REPLACED (HISTORICAL AUDIT)` | 6 references | **BẢO TỒN — KHÔNG ĐƯỢC XÓA** | Được tham chiếu bởi `docs/00-master-plan.md` và `docs/phase-0-roles-and-mvp-final.md` làm bằng chứng lịch sử F1–F14. |
| `docs/phase-0-survey-requirements.md` | `REPLACED (HISTORICAL AUDIT)` | 7 references | **BẢO TỒN — KHÔNG ĐƯỢC XÓA** | Bản thảo ban đầu (2026-09-07), được tham chiếu bởi master plan và requirements. |
| `docs/phase-0-product-owner-decision-sheet.md` | `REPLACED (HISTORICAL AUDIT)` | 2 references | **BẢO TỒN — KHÔNG ĐƯỢC XÓA** | Tiền thân của `final-product-owner-decision-sheet.md`. |
| `docs/phase-0-requirements-gap-audit.md` | `HISTORICAL AUDIT` | 2 references | **BẢO TỒN — KHÔNG ĐƯỢC XÓA** | Hồ sơ giải trình việc chuẩn hóa UC-10 từ Badges sang Publish Content. |
| `docs/phase-0-final-master-consolidation.md` | `HISTORICAL AUDIT` | 2 references | **BẢO TỒN — KHÔNG ĐƯỢC XÓA** | Hồ sơ đối chiếu tổng thể Phase 0 giai đoạn trước. |
| `docs/report/evidence-register.md` | `KEEP (REPORT AUDIT)` | 4 references | **BẢO TỒN TUYỆT ĐỐI** | Sổ đăng ký bằng chứng phục vụ báo cáo học thuật môn học. |

> **Nguyên tắc bảo tồn:** Toàn bộ các tài liệu mang nhãn `REPLACED` hoặc `HISTORICAL AUDIT` đều có liên kết tham chiếu từ các tài liệu khác trong repository. Tuyệt đối không xóa bất kỳ file nào để bảo toàn toàn vẹn lịch sử kiểm toán học thuật.

---

## 14. Findings Table (Bảng Tổng Hợp Các Phát Hiện Kiểm Toán)

| ID | Mức Độ (Severity) | Phân Loại (Category) | Nội Dung Phát Hiện (Finding) | Bằng Chứng (Evidence) | Tác Động (Impact) | Trạng Thái (Status) |
|---|:---:|---|---|---|---|:---:|
| **F-MAP-01** | **BLOCKER** | `D6 / FR Drift` | `P1-FR-016` tự chế dải điểm Placement Test 4 chặng (U1–U4), bỏ rơi Unit 5 và Unit 6 của Khung Đề cương A1, mâu thuẫn với Mapping A 6 chặng chuẩn tắc. | `FACT`: Trực tiếp tại dòng 758–762 của tài liệu Phase 0 vs `docs/09` §2. | Học viên đạt 24–30 câu bị xếp sai vào Unit 4 thay vì Unit 6; gãy cấu trúc 6 Unit A1. | **OPEN** |
| **F-D7-01** | **BLOCKER** | `D7 / Invariant Violation` | `P1-FR-004` đặt điều kiện tiên quyết $\ge 70\%$ câu đúng, AC yêu cầu 80% điểm, và gán `is_completed = true`, vi phạm Bất biến D7 (hoàn thành không phụ thuộc điểm số). | `FACT`: Trực tiếp tại dòng 547, 549, 554 vs Quyết định D7 và schema `ProgressStatus`. | Phá vỡ triết lý sư phạm thử sai không trừng phạt; đặc tả trường CSDL không tồn tại. | **OPEN** |
| **F-EMG-01** | **HIGH** | `SoD / Role Authorization` | §3.3.5, Table 4.1 (`PP-08`), và `NFR-AUD` mô hình hóa quyền Admin khẩn cấp là `IN_REVIEW → PUBLISHED`, nhảy cóc khâu duyệt của Moderator, vi phạm D2 và mâu thuẫn với Table 5.2. | `FACT`: Mâu thuẫn nội tại giữa Table 5.2 (dòng 6) và các dòng 356, 401, 803 vs `roles-final` §4. | Lỗ hổng quản trị; nội dung rác có thể bị xuất bản thẳng mà không qua kiểm duyệt. | **OPEN** |
| **F-SCH-01** | **HIGH** | `Schema / Data Drift` | Sử dụng hàng loạt tên bảng và trường bịa đặt không có trong CSDL: `user_roles`, `user_srs_items`, `vocabulary_items`, `srs_item_id`, `last_active_date`, `daily_goal_minutes`. | `FACT`: Đối chiếu với `docs/07` và migration 001–003. | Lập trình viên hiện thực sai cấu trúc CSDL; gãy các truy vấn Prisma và Supabase RLS. | **OPEN** |
| **F-SCH-02** | **HIGH** | `Contract / RPC Mismatch` | `P1-FR-006` đặc tả gọi RPC `record_review` với Rating 1–5, trong khi hàm SQL thực tế trong migration 002 nhận tham số `p_is_correct boolean`. | `FACT`: Trực tiếp tại dòng 581–587 vs migration `202608140002` dòng 192. | Trình duyệt gọi RPC thất bại do sai lệch chữ ký hàm (`function does not exist`). | **OPEN** |
| **F-STO-01** | **HIGH** | `Storage Architecture` | `P1-FR-009` gán bucket âm thanh là `audio-assets` dung lượng $\le 5$MB. Hệ thống chỉ có 2 bucket: `lingora-avatars` (2MB) và `lingora-media` (10MB). | `FACT`: Trực tiếp tại dòng 638, 640 vs `docs/QUICK-REF.md` và migration 003. | Tải file âm thanh thất bại do không tìm thấy bucket. | **OPEN** |
| **F-ERR-01** | **HIGH** | `API Contract` | `NFR-ERR` mô tả khung lỗi có bọc `"success": false` và dùng trường số nhiều `"details": {}`, vi phạm hợp đồng chuẩn `{ "error": { "code", "message", "detail" } }`. | `FACT`: Dòng 805 vs `docs/03-api-contract.md` §143–146. | Gãy đổ bộ phân tích lỗi ở BFF và giao diện Web. | **OPEN** |
| **F-CIT-01** | **HIGH** | `Citation Verifiability` | Đường dẫn tham khảo S6 (`blog.duolingo.com/how-duolingo-streak-works/`) trả về mã lỗi HTTP 404. | `FACT`: Kết quả kiểm tra HTTP trực tiếp ngày 2026-09-20. | Tài liệu chứa liên kết chết; mất nguồn kiểm chứng khoa học. | **OPEN** |
| **F-CIT-02** | **HIGH** | `Academic Citation Accuracy` | Các trích dẫn S1, S2, S3 có DOI thật nhưng bị sửa đổi, bịa đặt tên bài báo và tên tác giả so với ấn bản gốc đã xuất bản. | `FACT`: Đối chiếu dữ liệu xuất bản CrossRef / nhà xuất bản. | Vi phạm tính liêm chính học thuật trong trích dẫn nghiên cứu. | **OPEN** |
| **F-TRC-01** | **HIGH** | `Traceability Completeness` | Hơn 40 vị trí viện dẫn mã bằng chứng `E-PRI-*`, `E-SEC-*`, `E-SYN-*`, `E-DEC-*` nhưng tài liệu không có bảng đăng ký định danh các mã này. | `FACT`: Quét toàn văn tài liệu Phase 0 có 0 dòng định nghĩa mã E-ID. | Tài liệu không tự chứa đựng (self-contained); đứt gãy truy vết bằng chứng. | **OPEN** |
| **F-TRC-02** | **HIGH** | `Traceability Consistency` | `P1-FR-017` trỏ vào `UC-10` gây xung đột với `UC-10 Publish Content`; Table 6.2 trỏ vào `BF-16` không tồn tại; `P1-FR-007` dùng mã `UC-06-viết`. | `FACT`: Đối chiếu Table 6.2 với `docs/06-system-analysis.md`. | Ma trận truy vết sai lệch mục tiêu; xung đột danh mục Use Case chuẩn. | **OPEN** |
| **F-SUR-01** | **MEDIUM** | `Survey Reconciliation` | Bảng 1.4 và §1.2 báo cáo thiếu người chọn hình thức học ở Q4 (báo cáo Trung tâm 7/15 thay vì 9/15; Website 6/15 thay vì 8/15). | `FACT`: Đếm trực tiếp từ file Excel cột 5 dòng 2–16. | Báo cáo sai lệch số liệu thực nghiệm sơ cấp. | **OPEN** |
| **F-SUR-02** | **MEDIUM** | `Survey Integrity` | Khẳng định "100.0% phản hồi hợp lệ" ở Q23 và Q24 dù thực tế có 6–7 câu trả lời là "None" hoặc gõ phím vô nghĩa ("Wrfddf", "Fhdfg"). | `FACT`: Dữ liệu cột 24 và 25 trong file Excel thô. | Thổi phồng chất lượng dữ liệu khảo sát mở. | **OPEN** |
| **F-INT-01** | **MEDIUM** | `Interview Evidence` | Bảng 3.1 mô tả cụ thể tên họ, độ tuổi chính xác, nghề nghiệp và hoàn cảnh cá nhân của P1–P6 mà không có biên bản phỏng vấn thô trong repo. | `FACT / UNKNOWN`: Kho lưu trữ không chứa file phỏng vấn thô nào. | Chi tiết cá nhân dễ bị chất vấn; cần chuẩn hóa thành nhãn Illustrative Persona. | **OPEN** |
| **F-BNCH-01** | **MEDIUM** | `Benchmark Rigor` | Gán ghép sai bài báo micro-learning (B4), trích dẫn nhầm mã quyết định (B8, B12), nguồn cũ hết hạn Incubator (B14), tiêu chuẩn ISO lệch ngành (B15). | `FACT`: Trực tiếp tại Bảng 2.1 các dòng tương ứng. | Giảm tính thuyết phục và chuẩn xác của phân tích đo chuẩn. | **OPEN** |
| **F-NFR-01** | **MEDIUM** | `NFR Metric Rigor` | Áp đặt các chỉ số trễ `< 100ms`, `< 200ms`, độ sẵn sàng $\ge 99.5\%$ như tiêu chí nghiệm thu bắt buộc mà không có căn cứ đo kiểm thực tế. | `FACT`: Đối chiếu P1-FR-010 AC, NFR-LOC, NFR-REL. | Đưa ra các cam kết kỹ thuật cảm tính thiếu cơ sở đo lường. | **OPEN** |
| **F-OV-01** | **MEDIUM** | `Verification Rigor` | Mục 8 và §6.3 tuyên bố "Đạt 100% 6 Cổng Thẩm định", "100% verified", "0 orphan requirements" trái ngược với các phát hiện sai lệch thực tế. | `FACT`: Đối chiếu các phát hiện trên với Bảng 8.1 và dòng 838. | Đánh giá sai lệch trạng thái kỹ thuật trước khi qua thẩm định độc lập. | **OPEN** |
| **F-SUR-03** | **LOW** | `Survey Traceability` | Bảng 1.1 dòng 7 trích số liệu Phát âm 6/15 từ Q7 nhưng tiêu đề ghi nguồn trích từ Q6, Q8, Q9, Q10. | `INFERENCE`: Khớp số lượng với Q7 Nói/Nghe nhưng thiếu ghi chú. | Lệch vết trích dẫn nhỏ trong bảng khảo sát. | **OPEN** |

---

## 15. Files That Must Be Preserved (Danh Mục Tệp Bắt Buộc Bảo Tồn)

Các tệp sau đây tuyệt đối **KHÔNG ĐƯỢC XÓA, ĐỔI TÊN HOẶC DI CHUYỂN**:
1. `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`: Nguồn dữ liệu thực nghiệm thô gốc $N=15$.
2. `docs/phase-0-roles-and-mvp-final.md`: Chuẩn tắc tối cao về 6 vai trò và phạm vi 19 MVP functions.
3. `docs/phase-0-final-product-owner-decision-sheet.md`: Quyết định đóng băng chính sách sản phẩm D1–D9.
4. `docs/phase-0-synthetic-stakeholder-research.md`: Nghiên cứu mô phỏng tác nhân nội bộ 20 personas.
5. `docs/00-master-plan.md` đến `docs/09-placement-and-jump-specification.md`: Bộ tài liệu kỹ nghệ chuẩn tắc của nền tảng.
6. `docs/phase-0-mock-survey-report.md`, `docs/phase-0-survey-requirements.md`, `docs/phase-0-product-owner-decision-sheet.md`: Hồ sơ kiểm toán lịch sử được tham chiếu chéo.
7. `docs/report/evidence-register.md`: Sổ bộ bằng chứng học thuật của báo cáo đồ án.
8. Toàn bộ mã nguồn `lingora-web/`, `lingora-admin/`, `lingora-ai/` và các migration SQL.

---

## 16. Items Requiring Decision (Các Hạng Mục Cần Quyết Định Trước Khi Sửa)

Trước khi tiến hành task sửa đổi tài liệu Phase 0, cần có sự thống nhất từ Product Owner / Giảng viên hướng dẫn về các điểm sau:
1. **Khóa chặt dải điểm Placement Mapping A:** Xác nhận giữ vững bảng dải 6 chặng của Bất biến D6 (`docs/09`) để bao phủ trọn vẹn 6 Unit của đề cương A1, loại bỏ dải 4 Unit trong `P1-FR-016`.
2. **Khóa chặt cơ chế hoàn thành bài học D7:** Xác nhận loại bỏ hoàn toàn các ngưỡng điểm $70\%$ và $80\%$ khỏi `P1-FR-004`, giữ đúng nguyên tắc Controlled Retry (Two-pass + retry allowance).
3. **Thống nhất luồng can thiệp khẩn cấp của Admin:** Xác nhận Admin chỉ được can thiệp xuất bản khi nội dung đã được Moderator phê duyệt (`APPROVED → PUBLISHED`), tuyệt đối cấm nhảy cóc `IN_REVIEW → PUBLISHED`.
4. **Chuẩn hóa chữ ký RPC `record_review`:** Xác nhận tài liệu Phase 0 phải mô tả đúng chữ ký hàm thực tế `record_review(uuid, boolean, double, double)` của migration 002, loại bỏ mô tả Rating 1–5.
5. **Cập nhật nguồn trích dẫn S6:** Thay thế URL bài viết blog Duolingo bị lỗi 404 bằng ấn bản lưu trữ hợp lệ hoặc tài liệu kỹ thuật tương đương về Spaced Repetition / Streaks của Duolingo.
6. **Sửa chính xác metadata bài báo S1, S2, S3:** Cập nhật lại đúng tiêu đề và tác giả thực tế theo mã DOI đã xuất bản.
7. **Bổ sung Bảng Đăng Ký Mã Bằng Chứng (Evidence Register):** Đưa bảng tra cứu chi tiết `E-PRI-*`, `E-SEC-*`, `E-SYN-*`, `E-DEC-*` vào trực tiếp Section 0.1 của tài liệu Phase 0 để đảm bảo tính khép kín.
8. **Điều chỉnh mã Use Case `P1-FR-017`:** Gỡ bỏ mã `UC-10` khỏi Huy hiệu cá nhân, chuyển sang nhãn hỗ trợ phụ hoặc liên kết với Profile Scope để trả lại `UC-10` duy nhất cho phân hệ Xuất bản nội dung.

---

## 17. Final Verdict (Tuyên Bố Phán Quyết)

**KẾT QUẢ TÁI THẨM ĐỊNH ĐỘC LẬP:** **`FAIL`**

Tài liệu `docs/phase-0-user-research-analysis-and-requirements.md` **chưa đạt yêu cầu chuẩn tắc để làm cơ sở triển khai kỹ thuật hoặc nghiệm thu Phase 0**.

### Yêu cầu Tiếp theo:
1. **DỪNG TOÀN BỘ CÁC CÔNG VIỆC THIẾT KẾ VÀ LẬP TRÌNH TIẾP THEO.**
2. Giữ nguyên toàn bộ mã nguồn, cơ sở dữ liệu và cấu hình hệ thống theo nguyên tắc nghiêm ngặt `AUDIT ONLY`.
3. Khởi tạo một kế hoạch sửa đổi tài liệu độc lập (`phase-0-user-research-and-requirements-remediation-plan.md`) nhằm khắc phục triệt để 18 phát hiện (đặc biệt là 2 lỗi `BLOCKER` và 9 lỗi `HIGH`) được nêu chi tiết trong Báo cáo Thẩm định này trước khi tái đánh giá lần cuối.
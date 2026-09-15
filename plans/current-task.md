# Active Task

`phase-0-user-research-analysis-and-requirements-authoring`

## Status

`DONE`

## User Directive

> "bắt đầu làm đi" (Following completion and approval of `plans/phase-0-user-research-analysis-and-requirements-writing-plan.md`)

## Objective

Biên soạn toàn diện tài liệu đặc tả 6 phần trọng tâm của Báo cáo Đồ án Hệ thống Học Ngoại ngữ Lingora (`docs/phase-0-user-research-analysis-and-requirements.md`) theo đúng quy trình 10 bước và 6 Cổng Thẩm định đã phê duyệt trong `plans/phase-0-user-research-analysis-and-requirements-writing-plan.md`:
1. **Section A:** User Research & Khảo sát Người học Thực nghiệm ($N=15$, trích xuất 24 câu hỏi, tiếp thu khung bảng Khó khăn / Kỹ năng / Tính năng từ đồ án mẫu nhưng sử dụng $100\%$ số liệu thực tế $N=15$, gắn kết nghiên cứu thứ cấp S1–S3).
2. **Section B:** Application Survey & Phân tích Đo chuẩn Nền tảng (Duolingo, Quizlet, ELSA qua 17 tiêu chí chi tiết, trích dẫn tài liệu chính thức 2026-09-15, quyết định Adopt/Adapt/Reject).
3. **Section C:** Qualitative Stakeholder Interviews & Tam giác hóa Dữ liệu (Tóm tắt phỏng vấn định tính học viên thật $P1$–$P6$, cô lập 20 Persona kịch bản mô phỏng vào mục riêng mang nhãn `[SYNTHETIC]`, ma trận tam giác hóa 3 chiều).
4. **Section D:** User Pain Points, Phân tích Nguyên nhân Gốc rễ & Đáp ứng Sản phẩm (Ma trận 7 cột cho 8 điểm nghẽn $PP-01$..$PP-08$).
5. **Section E:** Canonical Stakeholders, Tác nhân Hệ thống & Phân định Trách nhiệm (Đặc tả 6 vai trò chuẩn tắc, ma trận phân quyền SoD).
6. **Section F:** Kỹ nghệ Yêu cầu (17 Yêu cầu Chức năng $P1-FR-001$..$017$ có AC Given-When-Then và truy vết bằng chứng; 11 nhóm NFR với kỷ luật số liệu `TBD / PROPOSED TARGET`).

## Ranh giới & Cam kết Tuyệt đối

1. **Ranh giới Kỹ thuật:**
   - KHÔNG viết code chức năng ứng dụng (0 application code).
   - KHÔNG sửa file `prisma/schema.prisma`.
   - KHÔNG tạo hoặc chạy migration SQL.
   - KHÔNG thay đổi cơ sở dữ liệu Supabase đang chạy.
   - KHÔNG hiện thực hóa UI hay API endpoints.
2. **Bảo tồn Quyết định Chính sách Sản phẩm đã Freeze (`D1`–`D9`):**
   - Giữ nguyên toàn bộ quyết định D1–D9, Curriculum 08 (6 Units, 24 Lessons), và Placement Mapping A.
3. **Ranh giới Milestone:**
   - Giữ nguyên trạng thái M2.1 (`REVISED — READY FOR TARGETED RE-REVIEW`).
   - Tuyệt đối DỪNG LẠI trước M2.2 (Behavioral Modeling).
4. **Liêm chính Học thuật:**
   - Tuyệt đối bác bỏ Hành vi 1 (sao chép $N=500$ TOEIC từ đồ án mẫu).
   - Tuyệt đối bác bỏ Hành vi 2 (lấy 20 persona mô phỏng làm số liệu phần trăm người thật).
   - $100\%$ số liệu khảo sát nhóm mang phân số $k/15$.

## Deliverables

1. `docs/phase-0-user-research-analysis-and-requirements.md` (Tài liệu đặc tả 6 phần nghiên cứu người dùng và kỹ nghệ yêu cầu hoàn chỉnh).
2. Cập nhật `logs/test-log.md` với bản ghi kiểm chứng Cổng G1–G6 (`T-P0-REQ-001`).
3. Cập nhật `logs/development-log.md`.

## Verification

- Cổng G1 (Evidence Gate): 100% luận điểm có nhãn chuẩn tắc (PRIMARY, SECONDARY, SYNTHETIC, PRODUCT DECISION).
- Cổng G2 (Number Gate): 100% số liệu khớp $N=15$ từ file Excel, phân số $k/15$ rõ ràng.
- Cổng G3 (Synthetic Isolation Gate): 20 Persona cô lập trong phân mục riêng, $0$ tỷ lệ phần trăm giả mạo.
- Cổng G4 (Sample-Report Rejection Gate): $0$ dữ liệu ngoại lai TOEIC 500 người.
- Cổng G5 (NFR Rigor Gate): Không bịa đặt chỉ số `<500ms`, chỉ dùng `TBD / PROPOSED TARGET`.
- Cổng G6 (Traceability Gate): 100% FRs và NFRs truy vết đầy đủ, 0 yêu cầu mồ côi.

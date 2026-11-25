# Nghiệm thu hành trình Giáo viên → Học viên — Vòng 1 (tiếng Anh, máy local)

Ngày: 2026-11-25 · Môi trường: stack local (`scripts/journey-stack.mjs`), Playwright Chromium, desktop 1280×800 và mobile 375×812.
Bài thử: "Bài 4: Gia đình của bạn" (3 đoạn, 5 từ vựng, 6 bài tập: MCQ×2, FILL_BLANK×2, REORDER, GRAMMAR).
Ảnh: `docs/acceptance/screenshots/<mã>-<thiết bị>-<ngôn ngữ>.png`. Kịch bản chạy lại: `scripts/journey/*.mjs`.

## Kết quả tổng

Hành trình chạy trọn: soạn → lưu → xem trước → nộp duyệt → admin trả về → sửa → nộp lại → duyệt → xuất bản →
học viên mới onboarding → học bài (đọc, luyện tập, cố ý sai) → màn kết quả → làm lại câu sai → ôn SRS.
Không có lỗi console, không tràn ngang trên mobile. **Không có lỗi P0.**

## Ghi nhận

| Mã | Bước | Vai | Mô tả | Mức | Ảnh | Trạng thái |
|---|---|---|---|---|---|---|
| F1 | Trả bài (B3) | Admin | "Yêu cầu chỉnh sửa" thành công khi ô nhận xét trống → giáo viên chỉ thấy banner chung, không biết sửa gì | P1 | B3-request-changes-empty, B3-teacher-sees-feedback | Đã sửa (PR F1): xác minh lại 2026-11-25 — nhận xét trống bị chặn, có nhận xét thì giáo viên thấy; ảnh F1-after-fix-* |
| F2 | Luyện tập (C5) | Học viên | Trả lời sai chỉ hiện "Chưa chính xác." rồi nhảy sang câu sau; không hiện đáp án đúng/giải thích giáo viên đã viết (chỉ xem được ở màn kết quả cuối) | P1 | C5-L4-ex2-wrong | Đã sửa (PR F2): request đầu và replay đều trả đáp án + giải thích; xác minh mobile/desktop, ảnh F2-after-fix-wrong-feedback-* |
| F3 | Luyện tập (C5) | Học viên | Banner phản hồi của câu trước vẫn nằm trên câu kế tiếp ("✓ Chính xác!" cạnh câu mới) → dễ nhầm | P2 | C5-L4-ex1-wrong, C5-L4-ex5 | Mở — xác minh lại sau F2: vẫn còn, chưa sửa (ngoài phạm vi gói) |
| F4 | Luyện tập (C5) | Học viên mobile | Phần đọc + 6 bài tập "Chỉ đọc" vẫn hiển thị dài bên dưới câu đang làm; trang rất dài, nút Gửi bị đẩy giữa trang | P2 | C5-L4-ex2-wrong | Mở — xác minh lại sau F2: phần đọc + 6 bài tập vẫn nằm dài phía trên câu đang làm, chưa sửa; ảnh F3F4-after-reload-* |
| F5 | Xem trước (A9) | Giáo viên | Xem trước chỉ có trong chế độ Lesson Studio; trình soạn mặc định không có xem trước | P2 | A9-studio-preview-desktop/mobile | Mở |
| F6 | Xem trước/Học viên | Cả hai | Phiên âm hiển thị hai dấu gạch `//ˈfæməli//` (dữ liệu nhập `/ˈfæməli/` bị bọc thêm) | P2 | A9, C4-L4-reading | Mở |
| F7 | Nhiều nơi | Học viên/Giáo viên | Mã loại bài tập thô (MCQ, FILL_BLANK, REORDER, GRAMMAR) hiện ra trong giao diện học viên, màn kết quả và xem trước | P2 | C5-*, C7-L4-celebration | Mở |
| F8 | Soạn (A5) | Giáo viên | REORDER yêu cầu nhập "thứ tự đúng" bằng ID token; MCQ chọn sẵn đáp án đúng mặc định dễ quên đổi | P2 | A5-exercise-REORDER | Mở |
| F9 | Soạn (A4) | Giáo viên | Từ vựng trùng chỉ báo lỗi khi lưu, câu chữ kỹ thuật (senseKey) | P2 | A4-vocab-modal | Mở |
| F10 | Lộ trình (C3) | Học viên | Tên bài lặp tiền tố "Bài 4: Bài 4: …" vì giao diện tự đánh số còn tiêu đề giáo viên cũng chứa "Bài 4:" | P2 | C3-course-path | Mở |
| F11 | Home (C8) | Học viên | Học hết chương: "Chưa có bài học tiếp theo / Chọn một lộ trình…" — không chúc mừng hoàn thành chương, không gợi ý bước kế | P2 | C8-home-after | Mở |
| F12 | Soạn trên mobile (A9) | Giáo viên | Trình soạn bị cắt chữ/bảng trên 375px | P3 | A9-studio-preview-mobile | Mở |
| F13 | Duyệt (B2) | Admin | Admin xem JSON chấm điểm thô và ID `opt_1795…`; chưa có xem trước đúng giao diện học viên | P3 | B2-review-detail | Mở |
| F14 | Dữ liệu dev | Học viên | Nhãn "[DEV]" của dữ liệu mẫu hiển thị cho học viên (chỉ môi trường dev) | P3 | C2-home | Bỏ qua |
| F15 | Nộp duyệt (A10) | Giáo viên | Nút "Nộp kiểm duyệt" bị vô hiệu khi form có thay đổi chưa lưu — đúng thiết kế, có gợi ý, nhưng ô "Tóm tắt thay đổi" gõ sau khi lưu cũng làm form "bẩn" | P3 | — | Mở |

## Điểm tốt (giữ nguyên)

- Luồng trạng thái rõ: Bản nháp → Đang chờ duyệt → Yêu cầu chỉnh sửa → Đã duyệt → Xuất bản; thông báo thành công mỗi bước.
- Tiến độ luyện tập được lưu, mở lại tiếp tục đúng câu; câu sai được làm lại ở cuối ("Làm lại câu sai").
- Màn kết quả liệt kê từng câu: đáp án của bạn, đáp án đúng, giải thích.
- SRS: thông báo "chưa có từ đến hạn" rõ; phiên ôn 14 từ chạy trọn.
- Kim cương/XP/chuỗi ngày cộng đúng (+40/+30 XP; 💎 +15/+10/+5).

## Chưa làm (vòng sau)

- Phần D chi tiết (chất lượng nội dung chương mẫu) và vòng 2 (production), vòng 3 (Pháp, Nhật).

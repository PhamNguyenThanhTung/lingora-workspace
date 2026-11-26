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
| F3 | Luyện tập (C5) | Học viên | Banner phản hồi của câu trước vẫn nằm trên câu kế tiếp ("✓ Chính xác!" cạnh câu mới) → dễ nhầm | P2 | C5-L4-ex1-wrong, C5-L4-ex5 | Đã sửa (nhánh `fix/learner-ui-f3-f4`): banner có nhãn "Kết quả câu vừa rồi" và tự ẩn khi bắt đầu trả lời câu kế |
| F4 | Luyện tập (C5) | Học viên mobile | Phần đọc + 6 bài tập "Chỉ đọc" vẫn hiển thị dài bên dưới câu đang làm; trang rất dài, nút Gửi bị đẩy giữa trang | P2 | C5-L4-ex2-wrong | Đã xử lý (nhánh `fix/learner-ui-f3-f4`): kiểm tra viewport thật cho thấy phiên luyện tập đã là lớp phủ toàn màn hình; ảnh fullPage gây hiểu nhầm. Đã khóa cuộn trang phía sau |
| F5 | Xem trước (A9) | Giáo viên | Xem trước chỉ có trong chế độ Lesson Studio; trình soạn mặc định không có xem trước | P2 | A9-studio-preview-desktop/mobile | Mở |
| F6 | Xem trước/Học viên | Cả hai | Phiên âm hiển thị hai dấu gạch `//ˈfæməli//` (dữ liệu nhập `/ˈfæməli/` bị bọc thêm) | P2 | A9, C4-L4-reading | Đã sửa (PR #15) |
| F7 | Nhiều nơi | Học viên/Giáo viên | Mã loại bài tập thô (MCQ, FILL_BLANK, REORDER, GRAMMAR) hiện ra trong giao diện học viên, màn kết quả và xem trước | P2 | C5-*, C7-L4-celebration | Đã sửa (PR #15) |
| F8 | Soạn (A5) | Giáo viên | REORDER yêu cầu nhập "thứ tự đúng" bằng ID token; MCQ chọn sẵn đáp án đúng mặc định dễ quên đổi | P2 | A5-exercise-REORDER | Đã sửa (PR #15) |
| F9 | Soạn (A4) | Giáo viên | Từ vựng trùng chỉ báo lỗi khi lưu, câu chữ kỹ thuật (senseKey) | P2 | A4-vocab-modal | Đã sửa (PR #15) |
| F10 | Lộ trình (C3) | Học viên | Tên bài lặp tiền tố "Bài 4: Bài 4: …" vì giao diện tự đánh số còn tiêu đề giáo viên cũng chứa "Bài 4:" | P2 | C3-course-path | Đã sửa (PR #15) |
| F11 | Home (C8) | Học viên | Học hết chương: "Chưa có bài học tiếp theo / Chọn một lộ trình…" — không chúc mừng hoàn thành chương, không gợi ý bước kế | P2 | C8-home-after | Đã sửa (PR #15) |
| F12 | Soạn trên mobile (A9) | Giáo viên | Trình soạn bị cắt chữ/bảng trên 375px | P3 | A9-studio-preview-mobile | Mở |
| F13 | Duyệt (B2) | Admin | Admin xem JSON chấm điểm thô và ID `opt_1795…`; chưa có xem trước đúng giao diện học viên | P3 | B2-review-detail | Đã sửa (PR #15) |
| F14 | Dữ liệu dev | Học viên | Nhãn "[DEV]" của dữ liệu mẫu hiển thị cho học viên (chỉ môi trường dev) | P3 | C2-home | Bỏ qua |
| F15 | Nộp duyệt (A10) | Giáo viên | Nút "Nộp kiểm duyệt" bị vô hiệu khi form có thay đổi chưa lưu — đúng thiết kế, có gợi ý, nhưng ô "Tóm tắt thay đổi" gõ sau khi lưu cũng làm form "bẩn" | P3 | — | Đã sửa (PR #15) |

## Điểm tốt (giữ nguyên)

- Luồng trạng thái rõ: Bản nháp → Đang chờ duyệt → Yêu cầu chỉnh sửa → Đã duyệt → Xuất bản; thông báo thành công mỗi bước.
- Tiến độ luyện tập được lưu, mở lại tiếp tục đúng câu; câu sai được làm lại ở cuối ("Làm lại câu sai").
- Màn kết quả liệt kê từng câu: đáp án của bạn, đáp án đúng, giải thích.
- SRS: thông báo "chưa có từ đến hạn" rõ; phiên ôn 14 từ chạy trọn.
- Kim cương/XP/chuỗi ngày cộng đúng (+40/+30 XP; 💎 +15/+10/+5).

## Chưa làm (vòng sau)

- Vòng 2 (production): xong 2026-11-26, xem [2026-11-journey-round2-production.md](2026-11-journey-round2-production.md) (H1–H14, không có P0). Vòng 3 (Pháp, Nhật, local): xem [2026-11-journey-round3-fr-ja.md](2026-11-journey-round3-fr-ja.md).


## Phần D — Chất lượng chương tiếng Anh A1 (Bài 1–3 mẫu + Bài 4 do giáo viên soạn)

Cách làm: đọc nguồn nội dung (`lingora-admin/src/server/curriculum/sample-a1.ts`, bài 4 từ `scripts/journey/author.mjs`),
đối chiếu từng bài tập với phần đọc + từ vựng của đúng bài đó và các bài trước; chấm thử đáp án bằng chính bộ chấm của sản phẩm.
Đây là đánh giá nội dung/sư phạm, chưa có học viên thật thử.

### Tổng quan

| Bài | Từ vựng | Bài tập | Dạng | Ý chính |
|---|---|---|---|---|
| 1 Chào hỏi | 3 | 3 | MCQ, FILL, REORDER | Văn bản dạy ~9 cụm chào; bài tập hỏi "How are you?" chưa hề được dạy |
| 2 Giới thiệu | 3 | 3 | MCQ, GRAMMAR, REORDER | Khớp nhất: a/an, "I am from", "My name is" đều có trong phần đọc |
| 3 Thói quen | 3 | 3 | FILL, MCQ, REORDER | Ngữ pháp ngôi thứ ba được kiểm tra; câu REORDER dùng nội dung ngoài bài |
| 4 Gia đình (GV soạn) | 5 | 6 | MCQ×2, FILL×2, REORDER, GRAMMAR | Khớp hội thoại và từ vựng; chưa ôn lại bài 1–3 |

### Phát hiện

| Mã | Bài/Câu | Mô tả | Mức | Đề xuất |
|---|---|---|---|---|
| D1 | Chấm GRAMMAR/FILL | Câu đúng bị chấm sai nếu thêm dấu chấm cuối hoặc 2 dấu cách: với đáp án "I have one brother", học viên gõ "I have one brother." → sai (đã chạy thử bằng bộ chấm; "i have one brother" thì đúng). Bài mẫu 2 né bằng cách liệt kê 4 biến thể; giáo viên không được cảnh báo | P1 — **Đã sửa** (nhánh `fix/grader-trailing-punctuation`) | Chấm bỏ qua dấu câu cuối câu (. ! ? … 。！？) và gộp mọi dãy khoảng trắng; vẫn giữ dấu thanh, ¿ ¡ đầu câu, dấu giữa câu. Đã thêm test |
| D2 | B1 Câu 3 | REORDER "How are you?" nhưng phần đọc và từ vựng bài 1 không dạy câu này → bài tập kiểm tra kiến thức chưa học | P1 — **Đã sửa** (nhánh `fix/sample-content-d2-d5`) | Thêm "How are you?" vào phần đọc + từ vựng, hoặc đổi câu hỏi sang cụm đã dạy (vd. "Good morning" / "Nice to meet you") |
| D3 | B3 Câu 3 | REORDER "I read books every night." — "read books", "every night" không có trong phần đọc/từ vựng bài 3; không kiểm tra điểm ngữ pháp mới (ngôi thứ ba) | P1 — **Đã sửa** (nhánh `fix/sample-content-d2-d5`) | Đổi thành "She wakes up at six." hoặc "He has breakfast at seven." |
| D4 | B1 Câu 2 | FILL "Nice to ____ you" (gặp lần đầu) chấp nhận cả "see"; "Nice to see you" là câu chào khi gặp lại, mâu thuẫn với đề và giải thích | P2 — **Đã sửa** (nhánh `fix/sample-content-d2-d5`) | Chỉ nhận "meet" |
| D5 | B2 Câu 2 | Phần đọc dạy cả "I come from Vietnam" nhưng đáp án chỉ nhận dạng "I am/I'm from…" → câu đúng đã học bị chấm sai | P2 — **Đã sửa** (nhánh `fix/sample-content-d2-d5`) | Thêm "I come from Vietnam(.)" vào đáp án nhận |
| D6 | Cả chương | Mỗi bài chỉ 3 bài tập, đều ở mức nhận biết/ghép câu; độ khó phẳng, không có bài tập ôn lại bài trước, không có bài tổng kết chương. Bài 4 (6 bài tập) cũng chưa dùng lại "I am a…", "My name is…" | P2 — **Đã sửa** (nhánh `feat/sample-content-d6-d7`; chưa có bài kiểm tra cuối chương) | 5–6 bài/bài; từ bài 3 trở đi chèn 1 câu ôn bài trước; thêm bài/đề kiểm tra cuối chương |
| D7 | Từ vựng | Từ vựng bài 1–3 chỉ 3 từ/bài và không khớp văn bản (bài 1 dạy Hi/Good afternoon/Good evening/Nice to meet you mà từ vựng lại là Hello/Morning/Goodbye; "Country", "Work", "Sleep" không có bài tập) → thẻ SRS ôn từ ít dùng | P2 — **Đã sửa** (nhánh `feat/sample-content-d6-d7`; chưa có bài kiểm tra cuối chương) | Từ vựng lấy từ cụm đã dạy và đã kiểm tra; 5–6 từ/bài |
| D8 | B3 Câu 2 | Phương án nhiễu "sleep breakfast" vô nghĩa (quá dễ); "make breakfast" cũng là cụm đúng nghĩa "nấu bữa sáng" nên dễ gây tranh luận | P3 | Đổi nhiễu thành "eat a breakfast"/"do breakfast" và nêu rõ nghĩa trong đề  — **Đã sửa (PR #15)** |
| D9 | B3 | Văn bản nói "thêm -s hoặc -es" nhưng không có ví dụ/bài tập "-es" (go → goes) | P3 | Thêm 1 câu "She goes to school." vào đọc và bài tập  — **Đã sửa (PR #12)** |
| D10 | B4 (GV soạn) | Nội dung chính xác: đáp án "Hai người…" khớp hội thoại; giải thích đúng; phương án nhiễu hợp lý nhưng hơi dễ ("Không có") | Ổn | Giữ; chỉ cần thêm biến thể đáp án có dấu chấm (xem D1) |

### Kết luận phần D

- Đáp án và giải thích nhìn chung chính xác; lỗi nằm ở **độ khớp giữa dạy và kiểm tra** (D2, D3), **chấm quá khắt về dấu câu** (D1) và **độ mỏng/phẳng** của chương (D6, D7).
- Ưu tiên sửa: D1 (code, ảnh hưởng mọi giáo viên) → D2, D3 (nội dung mẫu) → D4, D5 → D6, D7 (bổ sung nội dung).
- Chưa kiểm tra: nội dung chương đang chạy trên production (có thể trùng dữ liệu mẫu), và độ khó thực tế với học viên thật.

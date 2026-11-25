# Nghiệm thu hành trình Giáo viên → Học viên — Vòng 3 (tiếng Pháp & tiếng Nhật, máy local)

Ngày: 2026-11-25 · Môi trường: stack local (`scripts/journey-stack.mjs`, admin :3100 / web :3200), Playwright Chromium,
desktop 1280×800 và mobile 375×812. Không chạm production/Supabase/Vercel; chỉ tài khoản seed của stack.
Bài thử:
- Tiếng Pháp — khóa "Tiếng Pháp cơ bản A1" (CEFR/A1), chương `FR-A1-U1`, bài "Bài 1: Chào hỏi và giới thiệu bản thân"
  (3 đoạn, 5 từ vựng, 6 bài tập: MCQ×2, FILL_BLANK, REORDER, GRAMMAR, LISTENING).
- Tiếng Nhật — khóa "Tiếng Nhật sơ cấp N5" (khung JLPT 2010 + trình độ N5 tạo mới qua UI), chương `JA-N5-U1`,
  bài "Bài 1: Chào hỏi và tự giới thiệu" (3 đoạn, 5 từ vựng, 6 bài tập cùng loại).

Ảnh: `docs/acceptance/screenshots/<mã>-<thiết bị>-<fr|ja>.png`. Kịch bản chạy lại: `scripts/journey/r3/*.mjs`
(`s1-setup` → `s2-author` → `s3-review` → `s4-onboarding` → `s5-learn` → `s6-srs` → `s7-grader-probe`,
`s8-desktop`, `s9-character-block`, `db-probe`).

Toàn bộ thiết lập và soạn bài làm **qua UI của sản phẩm** (không dùng API, không dùng script ghi DB).
Ngoại lệ duy nhất có ghi DB: hạ `due_at` của thẻ SRS để ôn được trong ngày
(`node scripts/journey/r3/db-probe.mjs --make-due`) — ghi nhận ở **G12**.

## Kết quả tổng

Cả hai ngôn ngữ chạy trọn hành trình: giáo viên soạn → lưu → xem trước (Lesson Studio) → nộp duyệt →
admin duyệt → xuất bản → mở cho học viên → học viên mới onboarding chọn ngôn ngữ → học bài (đọc, luyện tập,
cố ý sai) → màn kết quả → làm lại câu sai → ôn SRS.
Không có mojibake (`Ã`, `â€`, `�`) ở bất kỳ bề mặt nào; không có lỗi console; không tràn ngang ở 375×812 và 1280×800.
**Không có lỗi P0.** Vấn đề nặng nhất là nhóm chuẩn hóa chuỗi khi chấm điểm (G1–G5) và thiếu hạ tầng ngôn ngữ
(`lang`, furigana, ký tự Hán tự) — G6–G8.

## Ghi nhận

| Mã | Bước | Vai | Mô tả | Mức | Ảnh | Trạng thái |
|---|---|---|---|---|---|---|
| G1 | Chấm điểm (C5) | Học viên | Tiếng Pháp thiếu dấu phụ bị tính sai hoàn toàn: `cafe` ≠ `café`, `ca va` ≠ `Ça va`; chỉ có tùy chọn `caseSensitive`, không có mức dung thứ dấu phụ và không có gợi ý "thiếu dấu" | P1 | C5-ex0-FILL_BLANK-wrong-mobile-fr | Mở |
| G2 | Chấm điểm (C5) | Học viên | Nháy cong và nháy thẳng không tương đương: học viên gõ `je m'appelle` bị sai so với đáp án `je m’appelle` (bàn phím thường chỉ có nháy thẳng) | P1 | — | Mở |
| G3 | Chấm điểm (C5) | Học viên | Tiếng Nhật: dấu cách toàn chiều rộng U+3000 do IME chèn chỉ bị thu thành dấu cách nửa chiều rộng chứ không bị bỏ → `わたしは　田中です。` bị tính sai dù đúng nội dung; tiếng Nhật viết liền nên nên bỏ mọi dấu cách khi so khớp | P1 | C5-ex0-GRAMMAR-wrong-mobile-ja | Mở |
| G4 | Chấm điểm (C5) | Học viên | Không chuẩn hóa NFKC/kana: katakana nửa chiều rộng `ｺｰﾋｰ` ≠ `コーヒー`, hiragana `こーひー` ≠ katakana `コーヒー` | P2 | — | Mở |
| G5 | Kết quả (C7) / Duyệt (B2) | Học viên + Admin | REORDER luôn ghép token bằng dấu cách cho mọi ngôn ngữ → câu Nhật hiện `わたしは 田中 です` ở màn kết quả và trang duyệt, trái với chính giải thích của bài ("tiếng Nhật viết liền"); nguồn: `lingora-web/src/server/lessons/practice-service.ts:171,191`, `lingora-admin/src/components/ReviewDetailView.tsx:34` | P1 | C7-result-review-mobile-ja, C8-result-review-desktop-ja | Mở |
| G6 | Từ vựng (C4) / SRS (C9) | Học viên | Phiên âm luôn bị bọc dấu gạch IPA: cách đọc tiếng Nhật thành `/konnichiwa/`, `/がくせい / gakusei/`; không có trường riêng cho furigana/kana nên giáo viên phải nhồi vào ô phiên âm; nguồn: `packages/lesson-content/src/LessonContent.ts:807`, `lingora-web/src/app/review/ReviewView.tsx:656` | P1 | C9-srs-card0-back-mobile-ja, C4-reading-mobile-ja | Mở |
| G7 | Toàn hệ thống | Tất cả | Mọi nội dung ngoại ngữ nằm trong `<html lang="vi">`, không bề mặt nào gắn `lang="fr"`/`lang="ja"` (grep toàn repo không có thuộc tính `lang` nào khác) → trình duyệt chọn sai font và sai luật ngắt dòng cho CJK, trình đọc màn hình đọc chữ Pháp/Nhật bằng giọng Việt, và chưa có cơ sở để làm TTS | P1 | C4-reading-mobile-ja | Mở |
| G8 | Soạn (A9) | Giáo viên | Tiếng Nhật không soạn được phần chữ (kana/kanji): khối "字 Ký tự (Character)" có trong Lesson Studio nhưng `GET /api/teacher/lessons/<id>/character-options` trả `data: []`, bảng `app.writing_characters` trống và `createWritingCharacter` (`lingora-admin/src/server/characters/catalogue.ts:37`) không có nơi gọi nào ngoài fixtures trong code → tính năng luyện viết chữ không dùng được qua sản phẩm | P1 | A9-character-picker-desktop-ja | Mở |
| G9 | Soạn (A5) / Duyệt (B2) | Giáo viên + Admin | LISTENING chỉ nhận URL ngoài (không tải tệp lên), và cả trình soạn lẫn trang duyệt chỉ in chuỗi "Âm thanh: <url>" chứ không phát thử → không ai kiểm được bản ghi có đúng ngôn ngữ/giọng; ở local audio không tải được (học viên thấy "Không thể tải âm thanh") và request treo làm `networkidle` không bao giờ xảy ra | P2 | A5-editor-filled-desktop-ja, B2-review-detail-desktop-ja | Mở |
| G10 | Kết quả (C7) | Học viên | Mục GRAMMAR ở màn kết quả hiện câu nguồn thay cho câu hỏi: "Câu 4 (Viết câu) … vous" (Pháp), "… 田中" (Nhật) | P2 | C7-result-review-mobile-ja, C8-result-review-desktop-ja | Mở |
| G11 | Ôn SRS (C9) | Học viên | Phiên ôn trộn thẻ nhiều ngôn ngữ trong cùng một lượt (10 thẻ Pháp + Nhật nối nhau), thẻ không có nhãn ngôn ngữ và trang ôn không cho chọn ôn theo ngôn ngữ/lộ trình | P2 | C9-srs-card1-back-mobile-fr | Mở |
| G12 | Ôn SRS (C9) | Học viên | Từ vừa nạp SRS đến hạn sau ~1 ngày và không có cách ôn ngay ("Chưa có từ nào đến hạn") → không thử được bước ôn trong cùng ngày; phải hạ `due_at` bằng script DB (`db-probe.mjs --make-due`) mới chạy tiếp được | P2 | C9-srs-card0-back-mobile-ja | Mở (đã dùng workaround DB) |
| G13 | Home (C2) | Học viên | Học viên tối đa 2 lộ trình đang hoạt động; sau khi onboarding tiếng Nhật, `/home` vẫn mặc định lộ trình tiếng Pháp ("Tiếng Pháp · A1 - Mới bắt đầu", "🎉 Bạn đã học hết các bài hiện có") — bài Nhật mới chỉ nằm trong danh sách "Lộ trình đang xem", không có bộ chuyển ngôn ngữ rõ ràng | P2 | C2-home-mobile-ja | Mở |
| G14 | Thiết lập (S1) | Admin | Ô "Chọn ngôn ngữ học" khi tạo khóa học liệt kê cả "Tiếng Việt (vi)" dù ngôn ngữ này `is_learnable = false` → có thể tạo khóa học ở ngôn ngữ không học được | P2 | S1-course-form-desktop-ja | Mở |
| G15 | Bài học (C4/C8) | Học viên | Breadcrumb lặp tiền tố chương: "Chương 1: Chương 1: Chào hỏi và tự giới thiệu" (tái diễn F10 vòng 1, lần này ở cấp chương, cả hai ngôn ngữ) | P2 | C8-lesson-desktop-ja | Mở |
| G16 | Từ vựng (A4) | Giáo viên | `normalizedForm` lưu y nguyên dạng canonical (giữ dấu phụ, nháy cong, kana/kanji): `je m’appelle`, `à bientôt`, `学生` → hai cách gõ của cùng một từ tạo hai khái niệm khác nhau mà không có cảnh báo trùng; `senseKey` vẫn phải tự đặt bằng tay | P2 | A5-editor-filled-desktop-fr | Mở |
| G17 | Onboarding (C1) | Học viên | Danh sách ngôn ngữ chỉ có tên + mã thô ("Tiếng Pháp / Mã: FR") — không cờ/ảnh, không cho biết khung trình độ hay số bài có sẵn; bước 5 "Tôi biết trình độ" chỉ liệt kê đúng trình độ mặc định của khóa (A1 / N5), chưa phải bài kiểm tra xếp trình độ | P3 | C1-onboarding-lang-mobile-ja, C1-onboarding-selfreport-mobile-ja | Mở |
| G18 | Luyện tập (C5) / Duyệt (B2) | Học viên + Admin | Tái diễn với fr/ja các ghi nhận vòng 1 chưa sửa: nội dung đọc + toàn bộ bài tập "Chỉ đọc" vẫn trải dài quanh câu đang làm (F4), và trang duyệt vẫn hiển thị JSON chấm điểm thô kèm ID `opt_…`/`tok_…` (F13) | P3 | C5-ex1-REORDER-mobile-fr, B2-review-detail-desktop-fr | Mở |

### Bảng dò chuẩn hóa chuỗi (nguồn G1–G4)

Chạy trực tiếp hàm chấm thật (`lingora-web/src/server/lessons/grader.ts`) qua `scripts/journey/r3/s7-grader-probe.mjs`:

| Ngôn ngữ | Đáp án mẫu | Học viên nhập | Kết quả | Ghi chú |
|---|---|---|---|---|
| fr | café | `café` | ĐÚNG | đúng chính tả |
| fr | café | `cafe` | SAI | thiếu dấu sắc (G1) |
| fr | café | `CAFÉ` | ĐÚNG | hoa/thường bỏ qua |
| fr | café | `café.` | ĐÚNG | dấu câu cuối được bỏ |
| fr | café | `e + U+0301` (NFD) | ĐÚNG | có chuẩn hóa NFC |
| fr | je m’appelle | `je m'appelle` | SAI | nháy thẳng (G2) |
| fr | Comment allez-vous ? | `Comment allez-vous?` | ĐÚNG | thiếu dấu cách trước `?` vẫn được |
| fr | Ça va | `ca va` | SAI | thiếu cedilla (G1) |
| ja | わたしは田中です。 | `わたしは田中です` | ĐÚNG | bỏ `。` vẫn được |
| ja | わたしは田中です。 | `わたしは　田中です。` | SAI | dấu cách U+3000 (G3) |
| ja | 学生 / がくせい | `がくせい。` | ĐÚNG | đa đáp án + bỏ `。` |
| ja | ありがとう！ | `ありがとう` | ĐÚNG | `！` toàn chiều rộng được bỏ |
| ja | コーヒー | `ｺｰﾋｰ` | SAI | katakana nửa chiều rộng (G4) |

## Điểm tốt (giữ nguyên)

- Thiết lập đa ngôn ngữ làm trọn **qua UI admin**: thêm ngôn ngữ fr/ja (có cờ "học được"), tạo khung JLPT 2010 +
  trình độ N5, hai khóa học, hai chương, hai bài, phân công giáo viên — không cần API hay script ghi DB.
- Unicode đi trọn vòng không hỏng: `é è à ç`, `« »`, kana/kanji, `。、「」（）` giữ nguyên qua soạn → lưu → tải lại →
  xem trước → duyệt → xuất bản → học viên → thẻ SRS; không thấy mojibake ở bất kỳ bước nào.
- Chuẩn hóa NFC và bỏ dấu câu cuối câu hoạt động đúng cho cả hai ngôn ngữ (`café.`, `学生。`, `ありがとう！`,
  và cả khoảng trắng kiểu Pháp trước `?`).
- FILL_BLANK nhiều đáp án được chấp nhận hoạt động tốt cho tiếng Nhật (`学生` hoặc `がくせい`).
- Nhãn loại bài tập đã là tiếng Việt ("Trắc nghiệm", "Điền từ", "Sắp xếp từ", "Viết câu", "Nghe và chọn") → F7 vòng 1
  đã sửa; trả lời sai hiện ngay đáp án đúng + giải thích của giáo viên → F2 vòng 1 đã sửa; phiên âm không còn gạch đôi
  `//…//` → F6 vòng 1 đã sửa (nhưng xem G6).
- Vòng "Làm lại câu sai" chạy đúng cho cả hai ngôn ngữ; XP/kim cương/chuỗi ngày và nạp SRS đúng
  (Pháp +40 XP · 💎 +10 · chính xác lần 1 67% · +5 từ; Nhật +30 XP · 💎 +5 · 67% · +5 từ).
- Audio lỗi không im lặng: học viên thấy hộp "Không thể tải âm thanh. Vui lòng kiểm tra lại."
- Mobile 375×812 và desktop 1280×800 đều không tràn ngang, kể cả với đoạn văn Nhật dài không có dấu cách.

## Chưa làm

- Luyện viết chữ Hán/kana (nét, `writing_sessions`) — không tạo được dữ liệu ký tự qua sản phẩm (G8).
- TTS/đọc to từ vựng: sản phẩm chưa có (không tìm thấy `speechSynthesis` ở cả hai app), nên chưa kiểm được
  việc chọn giọng theo ngôn ngữ.
- Bài kiểm tra xếp trình độ thật và nhiều trình độ/nhiều chương cho fr/ja (mỗi khung chỉ có 1 trình độ, mỗi chương 1 bài).
- Hành trình nhiều ngày của SRS (stage ≥ 2, giãn cách thật) — chỉ ôn được sau khi hạ `due_at` (G12).
- Bàn phím IME thật và thiết bị thật (iOS Safari, Android): mọi phép thử đều gõ qua Playwright trên Chromium.
- Vòng 2 (production) — ngoài phạm vi, không chạm tới.

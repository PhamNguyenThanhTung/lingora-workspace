# DOC-02 — Index Ảnh Nghiệm Thu (`docs/acceptance`, `docs/ui-audit`) và Kiểm Kê Scripts

Ngày lập: 2026-11-27 · Baseline đối chiếu: `origin/main` = `9dccaa83fed7cb9c5f86f0e07db5c76d19d43dfd` · Luồng: **L4 — Chỉ đọc**.

## 1. Tổng quan thư mục ảnh

| Nguồn | Số file thực tế | Viewport | Ngôn ngữ | Tình trạng Git (`origin/main`) | Lưu ý |
|---|---|---|---|---|---|
| `docs/acceptance/screenshots/` (trên `origin/main`) | **58** PNG | Desktop 1280×800 & Mobile 375×812 | `en` (24), `fr` (12), `ja` (22) | **Tracked** (PR #16 & PR #18) | Nguồn chính thức cho Vòng 1 (sau sửa) & Vòng 3 |
| `docs/acceptance/screenshots/` (chỉ ở local `lingora-workspace`) | **52** PNG (tổng trên đĩa 76 = 24 trùng `origin/main` + 52 riêng) | Desktop 1280×800 & Mobile 375×812 | `en` (52) | **Untracked** trên `lingora-workspace` | Bộ chụp đầy đủ các bước Vòng 1 (`A2..A10`, `B1..B6`, `C1..C9`) trước khi tách chọn lọc vào PR #16 |
| `docs/ui-audit/screenshots/` (local `lingora-workspace`) | **80** PNG (`admin` 26, `auth` 7, `error` 6, `learner` 27, `public` 2, `teacher` 12) | Desktop 1440×900 & Mobile 390×844 | `vi` (chủ yếu) + 1 Nhật (`122`) | **Untracked** (chỉ local) | SHA gốc chưa được ghi metadata trong `README.md`; lưu ý `README.md` ghi nhầm tổng 2+7+24+10+25+6=74 trong khi thực tế trên đĩa là 80 ảnh |
| Vòng 2 production (`#21`) | **0** PNG trong repo | ~457×589 | `en` | — | Chạy trực tiếp trên browser Claude desktop, không lưu file ảnh vào repo |

Ghi chú kiểm tra an toàn thông tin / rác repo:
- Không có file `.eml`, cookie hay `/tmp/journey-stack.json` trong `docs/` hoặc `scripts/`.
- Ghi nhận một khác biệt kỹ thuật trong `docs/ui-audit/SCREENSHOT_INDEX.md`: dùng link tuyệt đối `file:///home/tung/...`; nếu đưa vào repo sau này cần chuyển sang link tương đối và rà soát lại các ảnh để đảm bảo không lộ email/token.

## 2. Index ảnh `docs/acceptance/screenshots/` (110 ảnh duy nhất)

Quy ước đặt tên: `<Mã bước>-<Mô tả>-<desktop|mobile>-<en|fr|ja>.png`.

### 2.1. Vòng 1 — Tiếng Anh local (`76` ảnh trên đĩa `lingora-workspace`: `24` đã lên `origin/main`, `52` chỉ có ở local)

- **Đã tracked trên `origin/main` (`24` ảnh, PR #16 `312975d`):**
  - GV / Admin: `A1-desktop-en.png`, `A4-vocab-modal-desktop-en.png`, `A5-exercise-REORDER-desktop-en.png`, `A9-studio-preview-desktop-en.png`, `A9-studio-preview-mobile-en.png`, `B2-review-detail-desktop-en.png`, `B3-request-changes-empty-desktop-en.png`, `B3-teacher-sees-feedback-desktop-en.png`
  - Học viên: `C2-home-desktop-en.png`, `C2-home-mobile-en.png`, `C3-course-path-mobile-en.png`, `C4-L4-reading-mobile-en.png`, `C5-L4-ex1-mobile-en.png`, `C5-L4-ex1-wrong-mobile-en.png`, `C5-L4-ex2-wrong-mobile-en.png`, `C5-L4-ex5-mobile-en.png`, `C7-L4-celebration-mobile-en.png`, `C8-home-after-mobile-en.png`
  - Bằng chứng sau sửa F1–F4 (chụp trước merge PR #10/#14): `F1-after-fix-empty-comment-desktop-en.png`, `F1-after-fix-teacher-view-desktop-en.png`, `F2-after-fix-wrong-feedback-desktop-en.png`, `F2-after-fix-wrong-feedback-mobile-en.png`, `F3F4-after-reload-desktop-en.png`, `F3F4-after-reload-mobile-en.png`

- **Chỉ có ở local `lingora-workspace` (`52` ảnh, chưa commit):**
  - GV soạn bài (`A2–A10`, `21` ảnh): `A2-desktop-en.png`, `A3-paragraph-desktop-en.png`, `A3-paragraph-vocab-desktop-en.png`, `A3-after-save-desktop-en.png`, `A4-vocab-create-desktop-en.png`, `A5-exercise-modal-desktop-en.png`, `A5-exercise-FILL_BLANK-desktop-en.png`, `A5-exercise-GRAMMAR-desktop-en.png`, `A5-exercise-LISTENING-desktop-en.png`, `A5-filled-before-save-desktop-en.png`, `A6-empty-prompt-desktop-en.png`, `A6-empty-titles-desktop-en.png`, `A6-fill-no-answer-desktop-en.png`, `A6-fill-no-blank-desktop-en.png`, `A6-listening-bad-url-desktop-en.png`, `A6-mcq-empty-options-desktop-en.png`, `A8-after-reload-desktop-en.png`, `A9-preview-desktop-en.png`, `A9-preview-mobile-en.png`, `A10-state-desktop-en.png`, `A10-after-submit-desktop-en.png`
  - Admin duyệt (`B1–B6`, `5` ảnh): `B1-review-queue-desktop-en.png`, `B4-approved-desktop-en.png`, `B4-resubmitted-desktop-en.png`, `B5-approved-detail-desktop-en.png`, `B6-published-desktop-en.png`
  - Học viên (`C1–C9`, `26` ảnh):
    - Onboarding: `C1-onboarding-1-desktop-en.png`, `C1-onboarding-1-mobile-en.png`, `C1-onboarding-2-mobile-en.png`, `C1-onboarding-3-mobile-en.png`, `C1-onboarding-4-mobile-en.png`, `C1-onboarding-5-mobile-en.png`, `C1-onboarding-6-preview-mobile-en.png`
    - Đọc & Luyện tập: `C4-lesson-open-mobile-en.png`, `C4-reading-mobile-en.png`, `C4-ex1-question-mobile-en.png`, `C4-ex1-feedback-mobile-en.png`, `C4-ex2-question-mobile-en.png`, `C4-ex2-feedback-mobile-en.png`, `C4-ex3-question-mobile-en.png`, `C4-ex3-feedback-mobile-en.png`, `C4-before-finalize-mobile-en.png`, `C4-celebration-mobile-en.png`, `C5-L4-ex3-tokens-mobile-en.png`, `C5-L4-resumed-mobile-en.png`, `C6-L4-after-last-mobile-en.png`, `C6-L4-ready-to-finish-mobile-en.png`
    - SRS: `C9-srs-0-mobile-en.png`, `C9-srs-card-mobile-en.png`, `C9-srs-card-back-mobile-en.png`, `C9-srs-review-mobile-en.png`, `C9-srs-done-mobile-en.png`

  *(Lưu ý: 18/24 ảnh Vòng 1 đã lên `origin/main` vẫn hiện `??` trong `git status` của `lingora-workspace` vì worktree này đang checkout nhánh cũ `463af8b` trước PR #16.)*

### 2.2. Vòng 3 — Tiếng Pháp & Tiếng Nhật local (`34` ảnh, đều đã tracked trên `origin/main` qua PR #18 `7096fa1`)

- **Thiết lập Admin (`S1`, `5` ảnh — `1 fr`, `4 ja`):** `S1-language-form-ja-desktop-ja.png`, `S1-languages-after-desktop-fr.png`, `S1-jlpt-levels-desktop-ja.png`, `S1-course-form-desktop-ja.png`, `S1-lessons-desktop-ja.png`
- **Tiếng Pháp (`fr`, `11` ảnh còn lại; tổng `fr` = `12`):** `A5-editor-filled-desktop-fr.png`, `A9-studio-preview-desktop-fr.png`, `B2-review-detail-desktop-fr.png`, `B7-lesson-available-desktop-fr.png`, `C2-home-desktop-fr.png`, `C4-reading-mobile-fr.png`, `C5-ex0-FILL_BLANK-wrong-mobile-fr.png`, `C5-ex1-REORDER-mobile-fr.png`, `C5-ex6-FILL_BLANK-retry-mobile-fr.png`, `C7-result-mobile-fr.png`, `C9-srs-card1-back-mobile-fr.png`
- **Tiếng Nhật (`ja`, `18` ảnh còn lại; tổng `ja` = `22`):** `A5-editor-filled-desktop-ja.png`, `A8-editor-after-reload-desktop-ja.png`, `A9-character-picker-desktop-ja.png`, `A9-studio-preview-desktop-ja.png`, `A9-studio-preview-mobile-ja.png`, `A10-submitted-desktop-ja.png`, `B2-review-detail-desktop-ja.png`, `B2-review-detail-mobile-ja.png`, `B6-published-desktop-ja.png`, `C1-onboarding-lang-mobile-ja.png`, `C1-onboarding-selfreport-mobile-ja.png`, `C2-home-mobile-ja.png`, `C4-reading-mobile-ja.png`, `C5-ex0-GRAMMAR-wrong-mobile-ja.png`, `C7-result-review-mobile-ja.png`, `C8-lesson-desktop-ja.png`, `C8-result-review-desktop-ja.png`, `C9-srs-card0-back-mobile-ja.png`

## 3. Index ảnh `docs/ui-audit/screenshots/` (`80` ảnh, chỉ local)

Nguồn chi tiết từng ảnh đã có trong [`docs/ui-audit/SCREENSHOT_INDEX.md`](../ui-audit/SCREENSHOT_INDEX.md) và [`docs/ui-audit/VISUAL_GALLERY.md`](../ui-audit/VISUAL_GALLERY.md). Tóm tắt phân bố thực tế trên đĩa:

| Thư mục con | Số ảnh | Phạm vi màn hình | Viewport |
|---|---|---|---|
| `public/` | 2 | Landing Page (`001` desktop, `002` mobile) | 1440×900, 390×844 |
| `auth/` | 7 | Login/Register Learner (`010`–`013`), Staff Login (`014`–`015`), Activate Teacher (`016`) | 1440×900, 390×844 |
| `learner/` | 27 | Home (`100`–`101`), Onboarding 7 bước (`102`–`109`), Catalogue (`110`–`111`), Lesson & Writing Canvas (`120`–`123`), Practice (`130`–`135`), SRS (`140`–`144`) | 1440×900, 390×844 |
| `teacher/` | 12 | Holding (`200`–`201`), Assigned Lessons (`210`–`211`), Lesson Studio (`220`–`227`) | 1440×900, 390×844 |
| `admin/` | 26 | Dashboard (`300`–`301`), Languages (`310`–`312`), Frameworks (`320`–`322`), Courses (`330`–`332`), Unit Lessons & Assign (`340`–`342`), Teachers (`350`–`351`), Review (`360`–`363`), Assessments (`370`–`372`), Audit Events (`380`–`382`) | 1440×900, 390×844 |
| `error/` | 6 | 404 (`900`–`902`), Access Denied (`903`–`904`), Unauthorized Redirect (`905`) | 1440×900, 390×844 |

Lưu ý: Không gán SHA cho bộ `docs/ui-audit/` vì tài liệu gốc chỉ ghi "Tháng 11/2026" và không kèm commit SHA. Bộ ảnh này phản ánh giao diện trước PR #22/#24.

## 4. Kiểm kê scripts (`scripts/journey-stack.mjs` và `scripts/journey/`)

| Thành phần | Tracked trên `origin/main` | Trạng thái trên `lingora-workspace` | Guard DB disposable | Ghi chú an toàn |
|---|---|---|---|---|
| `scripts/journey-stack.mjs` | Có (PR #16) | `??` nhưng **trùng byte-exact** với `origin/main` | **Có:** gọi `validateOwnedDatabaseUrl().ownedUrl` (`test-guard-utils.mjs`) | An toàn; chỉ chạy với Postgres disposable do `local-test-db.mjs` tạo |
| `scripts/journey/*.mjs` (40 file vòng 1) | Có (PR #16) | `??` nhưng **trùng byte-exact** với `origin/main` | Chạy qua HTTP tới stack local `:3100/:3200`; `db.mjs` đọc `/tmp/journey-dburl` | Không trỏ `.env` production; `db.mjs` chỉ là helper ad-hoc cho DB URL từ `/tmp/journey-dburl` |
| `scripts/journey/r3/stack-r3.mjs` | Có (PR #18) | Không có trên đĩa nhánh cũ `463af8b` | Kế thừa `journey-stack.mjs` và ghi `SLICE11_TEST_DATABASE_URL` vào `/tmp/journey-dburl` | An toàn |
| `scripts/journey/r3/*.mjs` (12 file còn lại) | Có (PR #18) | Không có trên đĩa nhánh cũ `463af8b` | **Cảnh báo:** `db-probe.mjs` có flag `--make-due` chạy `UPDATE app.srs_cards SET due_at = ...` trên URL đọc từ `/tmp/journey-dburl` mà không gọi lại `validateOwnedDatabaseUrl()` | **Không dùng `--make-due` làm bước mặc định nghiệm thu** và tuyệt đối không trỏ `/tmp/journey-dburl` vào DB production |

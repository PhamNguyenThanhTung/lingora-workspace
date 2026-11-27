# DOC-01 — Đối chiếu Findings (Vòng 1–3 & UI Audit) với PR và Evidence

Ngày đối chiếu: 2026-11-27 · Baseline đối chiếu: `origin/main` = `9dccaa83fed7cb9c5f86f0e07db5c76d19d43dfd` · Luồng: **L4 — Chỉ đọc**.

Quy ước trạng thái theo §1 / §19.2:
- `MERGED`: code/doc đã merge vào `origin/main` (chỉ ra PR/commit); **không** tự suy diễn là đã nghiệm thu lại trên production (`PUBLIC_PASS`).
- `PR_OPEN`: đã có code trên PR đang mở (#22/#23/#24/#8) hoặc PR tài liệu (#21), chưa merge vào `main`.
- `LOCAL_WIP`: mới sửa/soạn cục bộ, chưa có PR vào `main`.
- `DEFERRED_OWNER` / `OUT_OF_SCOPE`: đã được chủ dự án chốt để lại ngoài đợt A (§3.1 / §3.3).

## 1. Tổng hợp PR liên quan (GitHub `PhamNguyenThanhTung/lingora-workspace`)

| PR | Trạng thái | Merge commit / HEAD | Nội dung chính |
|---|---|---|---|
| #1 | MERGED | `c2fb319` | Slice 12: xác nhận email cross-device qua `token_hash` + `POST /auth/confirm` |
| #4–#7 | MERGED | `07fc6ce`, `6e7f41d`, `cdab715`, `13ab120` | Theme, gamification Phase 1–5 (Gems) |
| #9 | MERGED | `20d2c52` | Log lỗi DB an toàn (`describeDbError`) |
| #10 | MERGED | `679a2b8` | F1 (bắt buộc nhận xét khi trả bài), F2 (hiện đáp án + giải thích khi sai) |
| #11 | MERGED | `81fe2a3` | D1 (bỏ dấu câu cuối và gộp khoảng trắng khi chấm text) |
| #12 | MERGED | `86ea43d` | D2–D5, D9 (nội dung mẫu A1 bài 1–3) |
| #13 | MERGED | `93923ca` | D6–D7 (làm giàu chương mẫu A1: 6 bài tập + từ vựng khớp) |
| #14 | MERGED | `ab326bf` | F3–F4 (nhãn kết quả câu vừa rồi, khóa scroll nền luyện tập) |
| #15 | MERGED | `8737630` | F6–F11, F13, F15, D8 |
| #16 | MERGED | `312975d` | Cập nhật trạng thái findings vòng 1 sau #10–#15 |
| #17 | MERGED | `0ff3501` | F5, F12 (xem trước ở trình soạn mặc định, responsive 375px) |
| #18 | MERGED | `7096fa1` | Báo cáo vòng 3 Pháp/Nhật local (`1d98459` đính chính G18) |
| #19 | MERGED | `a08b47d` | G1–G4 (chấm dung thứ: dấu phụ, nháy cong, CJK whitespace, NFKC) |
| #20 | MERGED | `9dccaa8` | G11–G12 (SRS theo ngôn ngữ, thẻ mới đến hạn ngay, "Ôn nhanh") |
| #8 | **OPEN** | `d4df6f1` | A11y chọn mục tiêu ngày ở `OnboardingWizardView.tsx` (gộp vào L2) |
| #21 | **OPEN** | `7ace3a1` | Báo cáo vòng 2 production (chỉ tài liệu H1–H14) |
| #22 | **OPEN** | `5284d96` | H1, H2, G15, H10, H11, H13 (phía learner) |
| #23 | **OPEN** | `ca79cc4` | H3, H4, H5, H7 (một phần), H8, H9, G14 (phía admin; L3 tiếp tục) |
| #24 | **OPEN** | `0673ac4` | UI học viên game hóa (trên nền `5284d96`; L2 tiếp tục & rebase sau #22) |

## 2. Đối chiếu Vòng 1 — UI/Workflow (F1–F15) và Nội dung A1 (D1–D10)

| Mã | Mức | Trạng thái trên `origin/main` | PR / Bằng chứng | Ghi chú cần kiểm lại |
|---|---|---|---|---|
| F1 | P1 | `MERGED` | PR #10 (`679a2b8`) | Đã có ảnh after-fix ở vòng 1; cần smoke lại ở M4 |
| F2 | P1 | `MERGED` | PR #10 (`679a2b8`) | Đã retest thêm ở vòng 2 production (đạt) |
| F3 | P2 | `MERGED` | PR #14 (`ab326bf`) | Đạt ở vòng 3 local; retest sau UI mới (#24) |
| F4 | P2 | `MERGED` | PR #14 (`ab326bf`) | Không phải lỗi ẩn nội dung; đã khóa scroll nền |
| F5 | P2 | `MERGED` | PR #17 (`0ff3501`) | Đã merge sau vòng 1; cần smoke trên production |
| F6 | P2 | `MERGED` (phạm vi bỏ `//…//` cơ bản) | PR #15 (`8737630`) | Tách khỏi G6/LNG-03 chuẩn hóa IPA vs kana/romaji (giao L5/L2/L3) |
| F7 | P2 | `MERGED` | PR #15 (`8737630`) | Đạt ở vòng 3 |
| F8 | P2 | `MERGED` | PR #15 (`8737630`) | Đã cập nhật test ở `dcf709a` |
| F9 | P2 | `MERGED` | PR #15 (`8737630`) | Riêng trùng đa biến thể tiếng Pháp/Nhật xử lý thêm ở G16/LNG-05 (L3) |
| F10 | P2 | `MERGED` | PR #15 (`8737630`) | Vòng 2–3 còn biến thể khác → xem H2 & G15 (#22) |
| F11 | P2 | `MERGED` | PR #15 (`8737630`) | Kiểm lại UI mới (#24) khi học hết chương |
| F12 | P3 | `MERGED` | PR #17 (`0ff3501`) | Kiểm responsive 375px ở editor trên production |
| F13 | P3 | `MERGED` | PR #15 (`8737630`) | Xác nhận ở vòng 2 & vòng 3 (G18) |
| F14 | P3 | `SKIP` (thiết kế dev) | — | Nhãn `[DEV]` chỉ ở dữ liệu dev |
| F15 | P3 | `MERGED` | PR #15 (`8737630`) | Kiểm lại ở M4 |
| D1 | P1 | `MERGED` | PR #11 (`81fe2a3`) | Nâng cấp tiếp bởi PR #19 |
| D2–D5, D9 | P1/P2/P3 | `MERGED` | PR #12 (`86ea43d`) | Áp dụng cho `sample-a1.ts`; kiểm smoke CNT-02 |
| D6–D7 | P2 | `MERGED` | PR #13 (`93923ca`) | Chưa thêm bài thi cuối chương (ngoài scope đợt A) |
| D8 | P3 | `MERGED` | PR #15 (`8737630`) | Đã sửa distractor ở `73644dd` |
| D10 | Ổn | `CLOSED` | — | Nội dung mẫu GV soạn vòng 1 đạt |

Lưu ý diff local trong `lingora-workspace`:
- `docs/acceptance/2026-11-journey-findings.md` đang sửa cục bộ tại nhánh cũ `fix/review-comment-and-wrong-answer-hints` (`463af8b`), **chủ yếu trùng** với cập nhật đã merge ở PR #16 (`312975d`) — chỉ khác ở chỗ PR #16 ghi "F5/F12 Mở" trong khi PR #17 đã merge sửa F5/F12 sau đó, và PR #16 ghi D8/D9 đã sửa theo #15/#12. Không nên commit đè diff local này lên `main`.
- `plans/2026-11-25-gems-pr7-completion.md` đang có thêm phần kết quả nghiệm thu production 2026-11-25 + sự cố 503 pooler (cổng 6543) + đề xuất kế hoạch hành trình — đây là thông tin riêng chưa lên `main`.

## 3. Đối chiếu Vòng 2 — Production (H1–H14)

Nguồn gốc: PR #21 (`7ace3a1`, `OPEN`). Tại thời điểm thử (2026-11-26), production chạy `main` trước #19/#20.

| Mã | Mức | Trạng thái hiện tại | Hướng đóng theo spec | Kiểm chứng còn thiếu |
|---|---|---|---|---|
| H1 | P1 | `PR_OPEN` (#22 `5284d96`, đã có trong #24) | LEA-01: bài tùy chọn luôn mở trong trình độ/ngữ cảnh hợp lệ | Review + merge #22 → retest trên production |
| H2 | P2 | `PR_OPEN` (#22 + quyết định Q2 §3.1) | LEA-02: giữ nguyên tên Admin đặt; chỉ thêm `Bài N:` khi chưa có tiền tố số | Kiểm ca GV gõ số khác vị trí + merge #22 |
| H3 | P2 | `PR_OPEN` (#23 `ca79cc4`) | ADM-01: bỏ `rowVersion` khỏi nhãn "Phiên bản" | Review + merge #23 (L3) |
| H4 | P2 | `PR_OPEN` (#23 `ca79cc4`) | ADM-01: làm rõ tên chương vs tên bài ở tiêu đề editor | Review + merge #23 |
| H5 | P3 | `PR_OPEN` (#23 `ca79cc4`) | ADM-02: hỗ trợ Enter tìm từ, empty state rõ, gợi ý tạo mới | Kiểm IME tiếng Nhật + empty state (L3) |
| H6 | P3 | `OPEN` (giao L5 + L2/L3) | LNG-03 (G6 format tối thiểu, mức B đã chốt) | L5 tạo helper, L2/L3 gắn consumer |
| H7 | P2 | `PR_OPEN` (một phần ở #23) | ADM-04: mục tiêu chốt Q3 warm median ≤ 2s, p95 ≤ 5s | L3 tối ưu tiếp + đo 20 mẫu trước/sau trên DB disposable |
| H8 | P3 | `PR_OPEN` (#23 `ca79cc4`) | ADM-02: xác nhận trước khi nộp duyệt | Review + merge #23 |
| H9 | P2 | `PR_OPEN` (#23 `ca79cc4`) | ADM-03: hiện tên/fallback người duyệt | Review + merge #23 |
| H10 | P2 | `PR_OPEN` (#22 `5284d96`) | LEA-03: tách rõ chính xác lần 1 vs tổng lượt làm/làm lại | Review + merge #22 |
| H11 | P3 | `PR_OPEN` (#22 `5284d96`) | LEA-04: không hiện "Chưa đọc" gây hiểu nhầm trên bài đã hoàn thành | Review + merge #22 |
| H12 | P2 | `DIAGNOSED` (CNT-01) | Lệch seed cũ trên DB `sncfyvpzwedqgwfpffkh`; source `origin/main` đã đúng | Tạo successor draft Bài 7 & Bài 8 qua UI GV/Admin và xuất bản |
| H13 | P3 | `PR_OPEN` (#22 `5284d96`) | LEA-04: kiểm distinct lessons, redo và timezone | Review + merge #22 + test timezone (L1) |
| H14 | P1 | `DEFERRED_OWNER` (§3.1, mức D) | Không cấu hình SMTP trong đợt này | Giữ ghi nhận mở; không ghi FIXED |

## 4. Đối chiếu Vòng 3 — Tiếng Pháp & Tiếng Nhật Local (G1–G18)

Nguồn gốc: PR #18 (`MERGED` `7096fa1`, đã sửa G18 tại `1d98459`).

| Mã | Mức | Trạng thái code | Trạng thái nghiệm thu | Việc còn lại |
|---|---|---|---|---|
| G1 | P1 | `MERGED` (PR #19 `a08b47d`) | `PUBLIC_NOT_VERIFIED` | ACC-03 retest thiếu dấu + gợi ý trên deployment |
| G2 | P1 | `MERGED` (PR #19 `a08b47d`) | `PUBLIC_NOT_VERIFIED` | ACC-03 retest nháy thẳng/cong |
| G3 | P1 | `MERGED` (PR #19 `a08b47d`) | `PUBLIC_NOT_VERIFIED` | ACC-03 retest khoảng trắng CJK / U+3000 |
| G4 | P2 | `MERGED` (PR #19 `a08b47d`) | `PUBLIC_NOT_VERIFIED` | ACC-03 retest NFKC (`ｺｰﾋｰ` = `コーヒー`; không đồng nhất hira/kata) |
| G5 | P1 | `OPEN` (đã chốt Q1 → L5 + L2/L3) | `LOCAL_NOT_DONE` | LNG-01: helper ghép token `ja`/`zh` không chèn dấu cách |
| G6 | P1 | `OPEN` (một phần tối thiểu ở L5; trường furigana để sau Q4) | `PARTIAL_SCOPE` | LNG-03 format `/…/` vs cách đọc; phần trường mới hoãn sang gói C |
| G7 | P1 | `OPEN` (đã chốt Q1 → L5 + L2/L3) | `LOCAL_NOT_DONE` | LNG-02: gắn `lang` theo vùng nội dung ngoại ngữ |
| G8 | P1 | `DEFERRED_OWNER` (Q4 — gói C) | `DEFERRED_OWNER` | Không triển khai trong đợt A |
| G9 | P2 | `OPEN` (phát thử → L3; upload → deferred) | `LOCAL_NOT_DONE` | LNG-04: thêm audio player + xử lý lỗi ở editor & review |
| G10 | P2 | `OPEN` (L2/L3) | `LOCAL_NOT_DONE` | LNG-04: câu `GRAMMAR` hiện prompt câu hỏi thay `sourceSentence` |
| G11 | P2 | `MERGED` (PR #20 `9dccaa8`) | `PUBLIC_NOT_VERIFIED` | ACC-03 retest SRS tách ngôn ngữ trên production |
| G12 | P2 | `MERGED` (PR #20 `9dccaa8`) | `PUBLIC_NOT_VERIFIED` | ACC-03 retest thẻ mới đến hạn ngay |
| G13 | P2 | `OPEN` (đã chốt Q1/§3.1 → L2) | `LOCAL_NOT_DONE` | UI-01: bộ chọn lộ trình `Ngôn ngữ · mã trình độ` (Nhật N5–N1) |
| G14 | P2 | `PR_OPEN` (#23 `ca79cc4`) | `LOCAL_PENDING_MERGE` | L3 hoàn tất và merge #23 |
| G15 | P2 | `PR_OPEN` (#22 `5284d96`) | `LOCAL_PENDING_MERGE` | Merge #22 (chung rule đánh số Q2) |
| G16 | P2 | `OPEN` (L3) | `LOCAL_NOT_DONE` | LNG-05: cảnh báo từ trùng cùng ngôn ngữ, không auto-merge |
| G17 | P3 | `PARTIAL` (polish dữ liệu thật ở UI-01/02; placement thật ngoài scope) | `OUT_OF_SCOPE` (placement) | Chỉ polish hiển thị metadata sẵn có |
| G18 | P3 | `NOT_A_BUG` (`1d98459`) | `CLOSED` | Giữ nguyên kết luận |

## 5. Đối chiếu `docs/ui-audit/BUGS.md` (BUG-001..BUG-010)

Tài liệu `docs/ui-audit/` được ghi nhận là đầu vào tham khảo (chỉ có ở local, chưa commit). Rất nhiều hạng mục thuộc phạm vi ngoài đợt A:

| Mã UI-Audit | Mô tả ngắn | Quan hệ với Spec 2026-11-27 |
|---|---|---|
| BUG-001 | Bảng `/audit-events`, `/review`, `/teachers` tràn ngang trên mobile | Ngoài phạm vi đợt A (chỉ xử lý `LessonDraftEditor` 375px ở #17; backlog admin responsive) |
| BUG-002 | Thiếu phím tắt Space / 1–4 ở SRS flashcard desktop | Xem UI-04 (có thể tham khảo cho keyboard UX SRS nếu gọn, không ép nếu ngoài scope) |
| BUG-003 | Ô ngôn ngữ bị khóa ở Onboarding bước 1 thiếu giải thích | Tham khảo UI-02/onboarding (nhỏ, có thể cải thiện trong L2 nếu phù hợp) |
| BUG-004 | Thiếu nhận xét ghim theo từng khối ở màn duyệt Admin | Thực tế `RevisionReviewComment` theo block/item đã tồn tại trong schema và được dùng ở vòng 1/2/3 (`B2-review-detail`); cần giữ nguyên trạng thái thực tế |
| BUG-005 | Lesson Studio thiếu Undo / Redo (`Ctrl+Z`) | **Ngoài phạm vi đợt A** (§14 DOC-01) |
| BUG-006 | Thẻ Daily Quests trên `/home` thiếu progress bar | Phù hợp định hướng UI-01 (L2 gamified UI đang làm trên `#24`) |
| BUG-007 | Nút "Xem bài học mẫu" trên Landing chỉ cuộn tới `#features-demo` | Ngoài phạm vi đợt A |
| BUG-008 | `/courses` thiếu ô tìm kiếm nhanh | Ngoài phạm vi đợt A (chỉ làm vocab search trong #23) |
| BUG-009 | Bất nhất bo góc (`rounded-xl` vs `rounded-lg`) và palette giữa web/admin | PR #4 đã đồng bộ palette indigo; UI-00 thống nhất token phía learner (#24) |
| BUG-010 | Learner `/assessment` trả về 404 | **Ngoài phạm vi đợt A** (§3.3 & §14 DOC-01: learner assessment runner ngoài scope) |

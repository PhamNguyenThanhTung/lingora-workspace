# CNT-01 — Đối chiếu Bài 7 & Bài 8 giữa `origin/main` (`demo-a1.ts`) và dữ liệu đang publish (H12)

Ngày kiểm tra: 2026-11-27 (Asia/Ho_Chi_Minh) · Luồng: **L4 — Chỉ đọc** (không sửa code, không sửa dữ liệu production).

## 1. Kết luận chính

- **Kết luận nguyên nhân H12:** **Lệch dữ liệu seed cũ trên production** (cũ hơn source trong Git), **không phải lỗi source `origin/main`**.
- Source [`lingora-admin/src/server/curriculum/demo-a1.ts`](../../lingora-admin/src/server/curriculum/demo-a1.ts) tại `origin/main` (`9dccaa83fed7cb9c5f86f0e07db5c76d19d43dfd`) đã đúng ngay từ commit khởi tạo `25348be` (2026-11-21): Bài 7 không có block `MEDIA` hay bài tập `LISTENING`, và có sẵn guard kiểm tra `"Lesson 7 must not have listening exercise"`; phần nghe chỉ đường nằm ở Bài 8 dùng `unit3-lesson8-directions.mp3`.
- Dữ liệu đang publish trên Supabase `sncfyvpzwedqgwfpffkh` được tạo ngày **2026-11-18T03:40–03:45Z** (trước `25348be` 3 ngày), dùng UUID ngẫu nhiên (khác UUID cố định của `demo-a1.ts`) và gắn file `unit3-lesson7-directions.mp3` (upload lúc `2026-11-18T03:29:05Z`) + bài tập `LISTENING` chỉ đường vào **Bài 7 ("Gọi món")**, trong khi **Bài 8 ("Hỏi đường")** không có `MEDIA` và không có `LISTENING`.

## 2. Bảng đối chiếu ID, revision và nội dung

Khóa học: `e0000000-0000-4000-8000-000000000001` ("Tiếng Anh A1 — Giao tiếp hằng ngày") · Chương `ENG-A1-U03` (`e0000000-0000-4000-8000-000000000013`, vị trí 3).

| Mục | Dữ liệu đang publish (DB `sncfyvpzwedqgwfpffkh`) | Source `origin/main:lingora-admin/src/server/curriculum/demo-a1.ts` (`9dccaa8`) | Khác biệt |
|---|---|---|---|
| **Bài 7 — Lesson ID** | `ba9e3d98-15d7-43f4-b0b0-eba46220d0ee` (pos 1, `AVAILABLE`) | `e0000000-0000-4000-8000-000000000027` (`lesson7Id`, pos 1) | UUID seed cũ khác source |
| **Bài 7 — Active Revision** | `a1ef13e0-268c-4347-8010-86df67beb691` (`revisionNo: 1`, `PUBLISHED` `2026-11-18T03:44:40.931Z`) | — (seed target 1 revision) | — |
| **Bài 7 — Title (`vi` / `en`)** | `Bài 7: Gọi món` / `Lesson 7: Ordering Food` | `Gọi món` / `Lesson 7: Ordering Food` (từ `ab6da26` bỏ tiền tố `Bài N:` trong `vi`) | Seed cũ giữ tiền tố `Bài 7:` |
| **Bài 7 — GV phụ trách** | Trần Thu Hà (`e0000000-0000-4000-8000-00000000000b`) | `teacherB` (Trần Thu Hà) | Khớp |
| **Bài 7 — Block `MEDIA`** | `l7-b7` (pos 7): `audio/unit3-lesson7-directions.mp3`, caption `"Nghe chỉ đường: Excuse me. Go straight and turn left at the bank."` | **Không có** (`l7-b7` là `CALLOUT`, `l7-b8` là `CALLOUT`, `l7-b9` là `DIVIDER`) | **Lạc chủ đề trên DB (H12)** |
| **Bài 7 — Exercise pos 1** | `LISTENING` (`lessonExerciseId: 25587d55-f659-404e-ba57-b0c8a2949a61`, `itemId: db8849cb-7221-4133-a019-86b94483ebef`, `itemRevisionId: 329f9a3a-c7c7-43c4-9f24-a528788066f6`, rev 1) · prompt `"Nghe đoạn âm thanh và cho biết người nói bảo rẽ hướng nào ở ngân hàng?"` · `audioUrl: .../unit3-lesson7-directions.mp3` | `MCQ` · prompt `"Khi muốn xin hóa đơn thanh toán tại quán ăn một cách lịch sự, câu nào sau đây là phù hợp nhất?"` (`Could we have the bill, please?`) | **Lạc chủ đề trên DB (H12)**; ex 2–6 khớp source |
| **Bài 8 — Lesson ID** | `0ccf6f88-4564-4b09-bedf-c6ebf4628b22` (pos 2, `AVAILABLE`) | `e0000000-0000-4000-8000-000000000028` (`lesson8Id`, pos 2) | UUID seed cũ khác source |
| **Bài 8 — Active Revision** | `85b301ab-be0f-4529-beae-fcfaecd027d8` (`revisionNo: 1`, `PUBLISHED` `2026-11-18T03:44:46.872Z`) | — | — |
| **Bài 8 — Title (`vi` / `en`)** | `Bài 8: Hỏi đường` / `Lesson 8: Asking for Directions` | `Hỏi đường` / `Lesson 8: Asking for Directions` | Seed cũ giữ tiền tố `Bài 8:` |
| **Bài 8 — Block `MEDIA`** | **Không có** (`l8-b7` là `CALLOUT`, `l8-b8` là `DIVIDER`, tổng 8 blocks) | `l8-b7_media` (pos 7): `audio/unit3-lesson8-directions.mp3`, caption `"Luyện nghe: Chỉ đường đến địa điểm trong thành phố"` | **DB thiếu block nghe ở Bài 8** |
| **Bài 8 — Exercise pos 1** | `MCQ` (`itemId: d13ee52b-573e-45c9-a5f7-17846e8c3ab6`, `itemRevisionId: 80366a86-d730-4c37-a7a5-b35732d1c7cc`) · prompt `"Người qua đường hỏi: 'Where is the bank?'. Câu chỉ đường nào sau đây đúng ngữ pháp?"` | `LISTENING` · prompt `"Nghe đoạn âm thanh và cho biết người nói bảo rẽ hướng nào ở ngân hàng?"` · `audioUrl: .../unit3-lesson8-directions.mp3` | **DB thiếu bài nghe ở Bài 8**; ex 2–6 khớp source |

Ghi chú thêm trong cùng khóa `ENG-A1`:
- Bài 3 (`343773bc-7437-42e4-b71f-4aadd10a8dcf`, rev 1 `PUBLISHED` `2026-11-18T03:44:15Z`) đang dùng `audio/unit1-lesson3-emma.mp3` (upload `2026-11-18T03:29:03Z`, HTTP 200, 28.224 bytes), trong khi `demo-a1.ts` dùng `audio/unit1-lesson3-age-phone.mp3` (upload `05:01:48Z`).
- Bài 5 (`d907068b-ae4a-4312-b261-4064d97d9047`) dùng `audio/unit2-lesson5-routine.mp3`, khớp tên URL với `demo-a1.ts`.
- Bảng `app.media_assets` và `app.media_bindings` trên DB đang trống (`0` hàng); các URL audio lưu trực tiếp trong `content_blocks.content.url` và `item_revisions.prompt_data.audioUrl`.

## 3. Kiểm chứng file audio thực tế

Đã tải đọc trực tiếp 2 clip trên Supabase Storage `lingora-media` (không sửa storage):

| File URL (`.../lingora-media/audio/...`) | HTTP | Content-Length | Last-Modified (GMT) | Định dạng | Nội dung nghe được |
|---|---|---|---|---|---|
| `unit3-lesson7-directions.mp3` | 200 | 30.336 bytes | 2026-11-18 03:29:05 | MP3 64 kbps, 24 kHz, mono | `"Excuse me, go straight and turn left at the bank."` |
| `unit3-lesson8-directions.mp3` | 200 | 30.528 bytes | 2026-11-18 05:01:53 | MP3 64 kbps, 24 kHz, mono | `"Excuse me, go straight and turn left at the bank."` |

Nhận xét: `unit3-lesson8-directions.mp3` phát đúng câu chỉ đường khớp 100% với prompt, options (`Turn left (Rẽ trái)`), transcript và explanation của câu `LISTENING` thuộc Bài 8 trong `demo-a1.ts`.

## 4. Đề xuất xử lý (chưa thực thi, đúng quy tắc bất biến revision)

Theo CNT-01 AC: **không re-seed toàn bộ DB, không UPDATE trực tiếp revision đã publish, không xóa bài thử #4 hoặc từ `large`**. Khi triển khai sửa H12:
1. Dùng tài khoản GV được phân công cho Bài 7/Bài 8 (**Trần Thu Hà**, `e0000000-0000-4000-8000-00000000000b`) tạo **successor draft** (`revisionNo: 2`) cho Bài 7 (`ba9e3d98-...`): gỡ block `MEDIA` `l7-b7` và thay bài tập `LISTENING` pos 1 bằng `MCQ` xin hóa đơn (`Could we have the bill, please?`).
2. Tạo **successor draft** (`revisionNo: 2`) cho Bài 8 (`0ccf6f88-...`): bổ sung block `MEDIA` (`.../unit3-lesson8-directions.mp3`) và bài tập `LISTENING` (`.../unit3-lesson8-directions.mp3`, giữ hoặc sắp lại vị trí câu hỏi cho hợp lý).
3. Admin duyệt và xuất bản hai revision mới; các revision cũ (`a1ef13e0-...` và `85b301ab-...`), attempt, điểm số và receipt cũ vẫn bất biến.

## 5. Khối evidence chuẩn (§19.2)

```text
Requirement/Test ID: CNT-01 (H12)
Branch / source SHA / deployment: origin/main 9dccaa83fed7cb9c5f86f0e07db5c76d19d43dfd / Supabase sncfyvpzwedqgwfpffkh
Môi trường / ngôn ngữ / viewport / timezone: Read-only Prisma query + curl/audio check trên production storage & DB
Fixture (ID không nhạy cảm): Course e0000000-0000-4000-8000-000000000001, Unit ENG-A1-U03, Lesson 7 ba9e3d98-..., Lesson 8 0ccf6f88-...
Expected: Bài 7 không có câu chỉ đường/audio; Bài 8 có audio/đáp án chỉ đường khớp demo-a1.ts
Actual: Source origin/main đã đúng; DB production đang chạy revision 1 publish ngày 2026-11-18T03:44Z (trước commit demo-a1.ts 25348be) nên Bài 7 vẫn chứa MEDIA + LISTENING chỉ đường và Bài 8 thiếu MEDIA + LISTENING. Audio unit3-lesson8-directions.mp3 nghe đúng nội dung chỉ đường.
Lệnh hoặc các bước đã chạy: git show origin/main:lingora-admin/src/server/curriculum/demo-a1.ts; read-only Prisma query qua product-client; curl -sIL và nghe MP3 từ lingora-media.
Kết quả: DIAGNOSED (lệch seed cũ trên production, không phải lỗi source); phần sửa revision trên production chưa thực hiện (L4 chỉ đọc).
Ảnh/log đã che dữ liệu nhạy cảm: Báo cáo này (không chứa credential/PII).
Giới hạn còn lại: Chưa tạo successor draft sửa Bài 7/8 trên production vì L4 chỉ đọc.
Commit / PR / merge / rollout status: Báo cáo L4 chờ chủ dự án duyệt.
```

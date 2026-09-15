# Gap Analysis — Đề bài gốc vs. Canonical docs/00-05

## Trạng thái tài liệu

- Loại: **BÁO CÁO AUDIT** — không phải plan, không phải task, không phải scope amendment.
- Không có file nào trong `docs/00-05` bị sửa trong bước này (xác nhận ở §6).
- Không có trạng thái task nào bị thay đổi. Không có feature nào được thêm.
- Ngày: 2026-08-15 · Baseline Git: `46130d5` · Baseline plan: `00-master-plan.md` v5 (đã khóa)
- Cơ sở khóa scope: `docs/00-master-plan.md:36` — *"Sau bản v5 này, plan được coi là baseline
  triển khai đã khóa — chuyển sang implement tuần 1, không tiếp tục thêm tính năng/công nghệ
  hoặc redesign kiến trúc"*.
- Mọi thay đổi phát sinh từ báo cáo này thuộc `AGENTS.md` Stop rules và **phải** có APPROVE
  của người trước khi bất kỳ file `docs/00-05` nào được sửa.

---

## 1. Đề bài gốc và 6 chức năng được đối chiếu

> "Xây dựng ứng dụng học ngoại ngữ trên nền tảng di động — Ứng dụng bao gồm các chức năng
> học từ vựng, ngữ pháp, nghe, kiểm tra, lên lịch học tập và nhắc nhở người học học tập
> theo lịch biểu."

Tiêu đề đề bài này được ghi nhận nguyên văn trong repo tại `docs/00-master-plan.md:7`
(ADR-002) và `docs/01-architecture.md:361` — nên phạm vi đề bài là **có tồn tại** trong tài
liệu, chỉ nội dung 6 chức năng là chưa được phủ đủ.

### Phương pháp

Grep case-insensitive trên toàn bộ 6 file canonical (`00`–`05`), các cụm:

| Nhóm từ khóa | Kết quả |
|---|---|
| `grammar`, `ngữ pháp` | 15 hit — **tất cả** thuộc `grammatical_acceptability_score` (NLP/CoLA) hoặc câu loại trừ |
| `notification`, `reminder`, `nhắc`, `push`, `FCM`, `alarm`, `WorkManager` | 0 hit mô tả tính năng; chỉ có câu loại trừ + `nhắc` nghĩa "mention" |
| `lịch học`, `lịch biểu`, `study plan`, `timetable`, `dailyGoal`, `goal` | **1 hit duy nhất**: `dailyGoalMin` |
| `listening`, `nghe`, `audio` | audio playback có; `LISTENING` như bài tập chấm điểm bị hoãn |
| `quiz`, `kiểm tra`, `exam` | `Quiz` chỉ là nhãn hiển thị; không có entity/attempt |

---

## 2. Bảng đối chiếu 6 chức năng

| # | Chức năng đề bài | Trạng thái | Bằng chứng chính |
|---|---|---|---|
| 1 | Học từ vựng | ✅ **ĐỦ** | `P1-FR-002`, `P1-FR-003`, `P1-FR-005`, `P1-FR-006`; entity `Vocabulary`/`VocabularyTranslation`/`LessonVocabulary`/`UserVocabSrs`/`ReviewLog`; RPC `record_review` |
| 2 | Ngữ pháp | ❌ **VẮNG — bị loại trừ tường minh** | `docs/02:218`, `docs/04:437`, `docs/05:65` |
| 3 | Nghe | ⚠️ **MỘT PHẦN** — chỉ phát audio, không có bài tập nghe chấm điểm | `docs/02:219`, `docs/04:434`, `docs/05:66` |
| 4 | Kiểm tra | ⚠️ **MỘT PHẦN / phụ thuộc cách diễn giải** | `P1-FR-003` (MCQ/FILL_BLANK/REORDER); `docs/02:220`, `docs/04:435`, `docs/05:67` |
| 5 | Lên lịch học tập | ❌ **VẮNG như đề bài diễn đạt** — chỉ có SRS Scheduler | `docs/04:436`, `docs/05:68` |
| 6 | Nhắc nhở | ❌ **VẮNG — bị hoãn tường minh, không có priority** | `docs/02:221`, `docs/04:433,436`, `docs/05:69` |

Điểm quan trọng: cả 3 chức năng thiếu **không phải bị bỏ sót do vô tình**. Chúng đã được
`ADR-004 — Project 1 learning capability scope-gap resolutions` (2026-08-14, `logs/decision-log.md`)
xem xét và **chủ động loại trừ/hoãn** với lý do "prevent broad product labels from silently
creating new entities". Đây là khác biệt cốt lõi so với giả thuyết ban đầu: docs không im lặng
về chúng — docs nói *"không làm"*.

---

## 3. Bằng chứng chi tiết (yêu cầu bước 1: có nằm trong 01/02 mà lọt khỏi 00 không?)

### 3.1. (2) Ngữ pháp — KHÔNG có module học ngữ pháp; bị loại trừ tường minh

`docs/01-architecture.md` **không** có bất kỳ đề cập nào tới grammar/ngữ pháp — grep 0 hit.

`docs/02-requirements.md:218` (mục M0.5 semantic decisions):

> "Grammar curriculum is not part of the current Project 1 scope. The only Grammar-related
> capability is the optional NLP-owned P2 `grammatical_acceptability_score`; Project 1 may
> display that field when available but does not own grammar lessons, grammar progress, or a
> separate Grammar schema."

`docs/04-data-model.md:437`:

> "Grammar curriculum is outside the current Project 1 data model. The optional NLP P2
> `grammatical_acceptability_score` remains API-only and is not persisted."

`docs/05-traceability-matrix.md:65`:

> "| Grammar | No Project 1 grammar curriculum. Optional `grammatical_acceptability_score`
> remains NLP-owned Nice/P2 and API-only. | Keep `NLP-FR-005`; no P1 grammar requirement or
> persistence row. |"

**Kết luận:** nhận định sơ bộ của người là **đúng** và còn mạnh hơn — `grammatical_acceptability_score`
chấm ngữ pháp *câu trả lời của user trong chatbot* (CoLA), là `Nice/P2`, API-only, không persist,
và là **hạng mục bị cắt đầu tiên** khi chậm tiến độ (`docs/00:105`). Không có `Grammar`,
`GrammarLesson`, `GrammarProgress` trong entity inventory (`docs/02:210`) hay `schema.prisma`.

### 3.2. (5) Lên lịch học tập — KHÔNG có; `dailyGoalMin` là hằng số trơ

`docs/01`, `docs/02`, `docs/03`, `docs/05`: grep `lịch học|lịch biểu|study plan|timetable|dailyGoal`
→ **0 hit**.

`docs/04-data-model.md:56` — hit duy nhất trong toàn bộ 6 file:

> `  dailyGoalMin   Int      @default(15)`

Field này đã được apply vào schema thật (`lingora-admin/prisma/schema.prisma:68`) nhưng
**không có bất kỳ hành vi nào được đặc tả cho nó** — không xuất hiện trong requirement nào
(`P1-FR-001`…`P1-FR-011`), không trong traceability matrix, không trong lộ trình 12 tuần.
Nó là một con số được lưu mà không ai đọc.

`docs/04-data-model.md:436` phân định rõ SRS ≠ lịch học tập của người dùng:

> "`UserVocabSrs.nextReviewAt` represents due state. It is not a notification/reminder delivery
> record and does not authorize notification schema."

`docs/05:68` xác nhận SRS Scheduler thuộc ML: "Project 1 owns integration/persistence and ML
owns model/Scheduler/evaluation."

**Kết luận:** nhận định của người **đúng**. SRS Scheduler suy ra `recommended_interval_days`
từ `recall_probability` — hệ thống quyết định *khi nào nên ôn từ nào*, hoàn toàn khác
"người học tự lên lịch học tập theo lịch biểu cá nhân". Không có entity nào cho phép user
khai báo lịch biểu (thứ mấy, giờ nào, học bao lâu).

### 3.3. (6) Nhắc nhở — KHÔNG có; bị hoãn và tường minh "không có priority"

`docs/02-requirements.md:221`:

> "SRS due state and Notification/Reminder delivery are separate concerns. The current Must SRS
> scope does not include notification delivery. Notification/Reminder remains deferred with no
> canonical priority unless a later human-approved requirement defines it."

`docs/02-requirements.md:231` (`P1-FR-005`, in ngay trong acceptance criteria):

> "Reminder/notification delivery is not part of this requirement."

`docs/04-data-model.md:433`:

> "No search/favorite, pronunciation-score, separate mastery, standalone flashcard, Grammar
> curriculum, Grammar progress, Quiz, QuizAttempt, **notification preference, device-token, or
> reminder-schedule entity** is approved by the Scope Gap Review."

`docs/05-traceability-matrix.md:69`:

> "| Notification/Reminder | Not part of current Must SRS scope and has no canonical priority.
> `nextReviewAt` is due state only. | No requirement/API/data mapping is created unless a future
> human approval adds the feature. |"

Grep `FCM|push|WorkManager|AlarmManager|notification channel` trên `docs/01` (kể cả bảng thư
viện Android `docs/01:149–176`) → **0 hit**. Không có dependency nào cho notification trong
tech stack đã chốt.

**Kết luận:** nhận định của người **đúng**. `streakCount` là bộ đếm hồi tố (đếm ngày đã học),
`dailyGoalMin` là mục tiêu tĩnh — cả hai đều không phải cơ chế nhắc.

### 3.4. Bổ sung — (3) Nghe: hẹp hơn mức người đã ghi nhận

Người ghi nhận `LISTENING` chỉ xuất hiện 1 lần ở danh sách cắt giảm `docs/00:107`. Thực tế
`docs/02`, `docs/04`, `docs/05` nói mạnh hơn thế:

- `docs/02:219`: "Vocabulary audio playback is part of the current learning flow, but it is not
  a scored `LISTENING` exercise. A scored `LISTENING` exercise remains deferred/P2 and is not
  one of the approved exercise types."
- `docs/04:16`: enum legacy `MATCHING LISTENING WRITING` được đánh dấu **superseded**; "The
  canonical exercise set is only `MCQ`, `FILL_BLANK`, and `REORDER`."
- `docs/04:434`: "`Vocabulary.audioUrl` supports vocabulary media playback only. It does not
  imply a scored `LISTENING` exercise or add `LISTENING` to `ExerciseType`."
- Schema đã apply (`lingora-admin/prisma/schema.prisma:24–28`): `enum ExerciseType { MCQ
  FILL_BLANK REORDER }` — `LISTENING` **không tồn tại trong DB thật**.

Nên (3) Nghe hiện là: **phát được audio từ vựng, không kiểm tra được kỹ năng nghe**.

### 3.5. Bổ sung — (4) Kiểm tra: diễn giải được nhưng mỏng

`P1-FR-003` (`docs/02:229`) phủ MCQ + FILL_BLANK + REORDER, có chấm đúng/sai và cập nhật
progress → diễn giải "kiểm tra" là **hợp lý**. Nhưng `docs/02:220` chặn phần còn lại:

> "'Quiz' may be used only as a user-facing/report label for the existing lesson exercise
> sequence. It does not introduce a separate Quiz entity, attempt/session history, timer, pass
> threshold, or result model; those semantics remain unapproved/deferred."

Nghĩa là **không có** bài kiểm tra cuối chương, không có lịch sử làm bài, không có điểm đạt/không
đạt, không có giới hạn thời gian. `UserProgress` chỉ lưu **một** aggregate cho mỗi
`(userId, lessonId)` (`docs/04:446`). Nếu hội đồng hiểu "kiểm tra" = bài test có kết quả và
lịch sử, phần này sẽ bị coi là mỏng.

---

## 4. Hai hướng xử lý cho từng chức năng thiếu

Bối cảnh chi phí: G1 cho ~12 tuần từ 2026-08-13; M1.3 đã dùng tuần 1–2; hiện đang ở đầu tuần 3.
Lộ trình `docs/00:88–104` đã kín ở các tuần 3–8. Tuần 9 (Profile + biểu đồ tiến độ) và tuần 10
(polish/test) là hai chỗ có dư địa; **tuần 10 kết thúc bằng M5 Feature freeze** — sau đó cấm
thêm tính năng.

Không có đề xuất nào dưới đây được thực hiện trước khi có APPROVE.

### 4.1. (2) Ngữ pháp

**Hướng A — gộp vào kiến trúc hiện có: thêm `GRAMMAR_MCQ` như một giá trị `ExerciseType`**

`docs/01:121` đã tự trả lời câu "Thêm loại bài tập mới?" → *"`Exercise.payload` là JSONB + enum
`ExerciseType` → thêm 1 giá trị enum + 1 Fragment, không migrate bảng."* Đây là con đường
kiến trúc đã lường trước.

- Thay đổi: +1 giá trị enum (migration nhỏ, không đổi bảng), +1 Zod validator ở Admin,
  +1 Fragment Android, nội dung ngữ pháp seed dưới dạng bài tập trong lesson.
- Chi phí: ~2–3 ngày, nằm gọn trong tuần 5 (đã có việc "bài tập MCQ + Fill-blank") hoặc tuần 7
  (Admin CRUD Exercise).
- Vi phạm change control: mục 3 (schema/enum) và mục 4 nếu payload mới lộ ra API → cần ADR.
- Đánh đổi: là "bài tập ngữ pháp", **không phải** "học ngữ pháp" (không có bài giảng, không có
  tiến độ ngữ pháp riêng). Nếu hội đồng đòi giáo trình ngữ pháp thì vẫn thiếu.
- Rẻ hơn nữa (0 code): dùng chính `FILL_BLANK` hiện có cho nội dung ngữ pháp và mô tả trong báo
  cáo là "bài tập ngữ pháp". Chi phí gần bằng 0, nhưng yếu nhất về mặt bằng chứng.

**Hướng B — thêm đúng nghĩa: module Grammar riêng**

- Cần: entity `GrammarLesson` + `GrammarLessonTranslation` + `UserGrammarProgress`, RLS cho cả
  3, CRUD Admin, màn Android riêng, seed nội dung ngữ pháp.
- Chi phí: **~1.5–2 tuần** (schema + migration + RLS + Admin CRUD + UI + seed + test).
- Chỗ nhét: **không có chỗ nào an toàn**. Tuần 9 chỉ dư ~3–4 ngày; nhét vào đây sẽ đẩy test/polish
  (tuần 10) sang tuần 11 và va vào đóng gói APK + viết tài liệu SE. Đây là vi phạm change control
  mục 1 và 3, và trên thực tế là redesign — thứ mà `docs/00:36` cấm.
- Khuyến nghị: **không chọn B** trừ khi bạn chấp nhận cắt bù một hạng mục P1 (ví dụ Room cache
  hoặc UI `en`).

### 4.2. (5) Lên lịch học tập

**Hướng A — gộp: đổi tên/UI cho SRS Scheduler + đọc `dailyGoalMin` đã có**

Đây là hướng có tỉ lệ lợi/chi phí tốt nhất trong cả 3 chức năng thiếu.

- Màn "Ôn tập thông minh" (đã có trong tuần 8) hiển thị thêm dưới dạng **lịch học**: "Hôm nay:
  N từ cần ôn · mục tiêu M phút" — dữ liệu lấy từ `recommended_interval_days` + `nextReviewAt`
  (đã có) và `dailyGoalMin` (đã có trong DB, hiện chưa ai đọc).
- Thêm màn Profile (tuần 9) một control cho phép user **sửa** `dailyGoalMin` → biến field trơ
  thành thứ user điều khiển được. Đây là chỗ gần nhất với "lịch biểu cá nhân" mà không cần
  schema mới.
- Chi phí: **~1–2 ngày**, không migration, không endpoint mới, không entity mới.
- Vi phạm change control: **không có mục nào** nếu chỉ là UI + đọc/ghi field đã tồn tại. Vẫn
  cần một requirement ID mới (ví dụ `P1-FR-012`) và một dòng traceability → cần APPROVE, nhưng
  đây là mức rẻ nhất có thể.
- Đánh đổi: là "lịch ôn tập do hệ thống đề xuất + mục tiêu ngày do user đặt", không phải
  "user tự chọn thứ 3 và thứ 5, 20:00". Cần diễn đạt trung thực trong báo cáo, không nói quá.

**Hướng B — thêm đúng nghĩa: `StudyPlan` do user tự định nghĩa**

- Cần: entity `StudyPlan`/`StudySlot` (thứ trong tuần, giờ, thời lượng, khóa học mục tiêu),
  RLS owner-only, màn tạo/sửa lịch trên Android, và logic đối chiếu lịch với hoạt động thực tế.
- Chi phí: **~1 tuần** (schema + RLS + UI CRUD + test). Cộng thêm nếu muốn nhắc theo lịch thì
  phụ thuộc §4.3.
- Chỗ nhét: tuần 9 nếu cắt bớt phần biểu đồ tiến độ, hoặc tuần 10 trước M5 — nhưng tuần 10 là
  tuần test/polish duy nhất, ăn vào đây là rủi ro chất lượng.
- Vi phạm change control: mục 3 (schema mới + RLS mới) → bắt buộc ADR.

### 4.3. (6) Nhắc nhở

**Hướng A — gộp: local notification thuần Android, không backend**

- Dùng `WorkManager` (hoặc `AlarmManager`) + `NotificationCompat` đặt một thông báo hằng ngày
  tại giờ user chọn, nội dung lấy từ số thẻ due local (`nextReviewAt` đã cache trong Room) và
  `dailyGoalMin`.
- Không cần: FCM, server push, device-token table, notification-preference table. Giờ nhắc có
  thể lưu bằng `SharedPreferences` phía client → **không cần migration**.
- Chi phí: **~1–2 ngày** (+1 ngày nếu xử lý tử tế Android 13+ `POST_NOTIFICATIONS` runtime
  permission và doze mode).
- Vi phạm change control: mục 2 — `WorkManager` là dependency mới, chưa có trong `docs/01:149–176`
  → cần ADR ghi lý do và impact. Không đụng schema, không đụng API.
- Chỗ nhét: tuần 9 (cùng màn Profile, nơi đặt giờ nhắc) hoặc tuần 10.
- Đánh đổi: chỉ nhắc khi app đã được cài và không bị OEM kill; không nhắc được từ server. Với
  một đồ án môn học thì đây là mức đủ và **demo được trực tiếp trước hội đồng**, vốn là điều
  quan trọng nhất.
- Lưu ý cần trung thực: nếu lưu giờ nhắc ở `SharedPreferences` thì mất khi cài lại app. Nếu
  muốn bền thì cần thêm 1 field vào `Profile` → khi đó chạm change control mục 3.

**Hướng B — thêm đúng nghĩa: hệ thống notification có server**

- Cần: FCM project, `device_tokens` table + RLS, `notification_preferences` table, một scheduled
  job (Supabase cron / Edge Function) quét `nextReviewAt` và gửi push, xử lý token hết hạn.
- Chi phí: **~1–1.5 tuần**, và thêm một thành phần hạ tầng mới ngoài 3 repo đã chốt.
- Chỗ nhét: **không có**. Việc này thêm một runtime thứ tư (scheduled job) — vi phạm change
  control mục 1 (kiến trúc) và mục 3 (schema), và đi ngược `docs/01:365` (AI Server/hệ thống
  không tự ý mở rộng quyền ghi dữ liệu learner).
- Khuyến nghị: **không chọn B**. Lợi ích học thuật thấp, chi phí và rủi ro cao nhất trong toàn
  bộ báo cáo này.

### 4.4. Tổng hợp chi phí

| Chức năng | Hướng A (gộp) | Hướng B (đúng nghĩa) | Khuyến nghị |
|---|---|---|---|
| (2) Ngữ pháp | ~2–3 ngày · +1 enum, không đổi bảng | ~1.5–2 tuần · module riêng | **A** |
| (5) Lên lịch học tập | ~1–2 ngày · 0 migration | ~1 tuần · entity `StudyPlan` | **A** |
| (6) Nhắc nhở | ~1–2 ngày · +1 dependency | ~1–1.5 tuần · FCM + 2 bảng + cron | **A** |
| **Tổng hướng A** | **~5–8 ngày** | — | nhét được vào tuần 5/7/9 trước M5 |
| **Tổng hướng B** | — | **~3.5–4.5 tuần** | phá vỡ lộ trình đã khóa |

Toàn bộ hướng A cộng lại ≈ 1 tuần rưỡi công việc rải ra 3 điểm trong lộ trình, và **không có
hạng mục nào cần bảng mới**. Đây là lý do khuyến nghị nghiêng hẳn về A cho cả ba.

---

## 5. Rủi ro nếu không làm gì

### 5.1. Rủi ro chấm điểm — đây là rủi ro chính

Đề bài liệt kê 6 chức năng như thành phần cấu thành của ứng dụng ("Ứng dụng bao gồm các chức
năng..."). Đối chiếu mức độ phủ hiện tại:

| Chức năng | Mức phủ hiện tại |
|---|---|
| Học từ vựng | Đầy đủ, có chiều sâu (SRS + AI) |
| Kiểm tra | Có, ở mức bài tập trong bài học |
| Nghe | Chỉ phát audio, không kiểm tra kỹ năng nghe |
| Ngữ pháp | Không có (chỉ có điểm chấm ngữ pháp trong chatbot, lại là P2 cắt đầu tiên) |
| Lên lịch học tập | Không có theo nghĩa đề bài |
| Nhắc nhở | Không có |

Tức **1.5–2.5 / 6 chức năng** được phủ tùy độ khắt khe của người chấm. Đây là rủi ro cụ thể
nhất: hội đồng KNPM chấm theo SRS/Use Case mà chính bạn viết, và Use Case Diagram
(`docs/02:39`, yêu cầu 12–15 use case) sẽ **không có** use case nào cho ngữ pháp, lịch học,
nhắc nhở. Khoảng trống hiện ngay trên sơ đồ.

Nghiêm trọng hơn: mất điểm ở đây **không thể bù bằng chất lượng AI**. Hai model AI (DKT-LSTM,
T5-small) chỉ làm sâu thêm chức năng (1) Học từ vựng và thêm chatbot roleplay — vốn **không nằm
trong 6 chức năng đề bài**. Kiến trúc SE/AI càng tốt cũng không trả lời được câu "phần ngữ pháp
đâu, phần nhắc nhở đâu".

### 5.2. Rủi ro câu hỏi phản biện

Hội đồng có thể hỏi trực tiếp: *"Đề bài yêu cầu nhắc nhở người học theo lịch biểu — em làm ở
đâu?"* Hiện chưa có câu trả lời nào dựa trên artifact. Trả lời "SRS Scheduler tính lịch ôn" là
đúng kỹ thuật nhưng không khớp câu hỏi, và dễ bị truy tiếp: *"vậy ai nhắc người học?"*.

`dailyGoalMin` là điểm dễ bị bắt bẻ nhất: nó **tồn tại trong DB thật** nhưng không có hành vi
nào đọc nó. Một field mục tiêu học tập được lưu mà không dùng là bằng chứng ngược — cho thấy
tính năng từng được nghĩ tới rồi bỏ dở.

### 5.3. Rủi ro thời điểm — cửa sổ đang đóng

- Hiện: đầu tuần 3 / 12. Cửa sổ còn mở đến hết tuần 10 (**M5 Feature freeze**).
- Sau M5, thêm bất cứ chức năng nào đều vi phạm chính gate mà bạn đặt ra — và điều đó lại
  thành một lỗi quy trình để hội đồng KNPM chất vấn.
- Hướng A rẻ **bây giờ** (nhét vào tuần 5/7/9). Cùng công việc đó ở tuần 11 sẽ va vào đóng gói
  APK, deploy và viết 3 báo cáo. Chi phí trì hoãn tăng theo thời gian, không phẳng.

### 5.4. Rủi ro của việc *có* làm (cần cân đối, không chỉ nêu một chiều)

Không phải không làm gì mới có rủi ro:

- Sửa `docs/00-05` sẽ phá trạng thái "baseline đã khóa 9.1/10" (`docs/00:34`) — bản thân việc
  mở lại baseline cũng là điểm yếu quy trình nếu không có ADR sạch.
- Ba tính năng thêm vào đều **không có nội dung học máy/NLP** → không tăng điểm cho hai môn ML
  và NLP, chỉ cứu điểm môn KNPM.
- Nếu chọn hướng B ở bất kỳ mục nào, rủi ro trượt tiến độ M4/M4.5 (điều kiện "tuyệt đối không
  cắt" ở `docs/00:110`) là thật.

Đây là lý do báo cáo khuyến nghị hướng A cho cả ba: nó là phương án duy nhất đóng được khoảng
trống đề bài mà không đe dọa các mốc không được cắt.

### 5.5. Một lựa chọn thứ ba, chi phí gần bằng 0 — cần được cân nhắc ngang hàng

Nếu bạn xác nhận với giảng viên rằng 6 chức năng là **gợi ý phạm vi**, không phải checklist bắt
buộc, thì phương án đúng đắn nhất là: **không sửa code, chỉ viết một mục "Phạm vi và giới hạn"
trong Chương 1 báo cáo KNPM**, nêu rõ đã chọn làm sâu 2 chức năng (từ vựng + kiểm tra) với AI
cá nhân hóa thay vì làm nông 6 chức năng, và liệt kê 4 chức năng còn lại vào "Hướng phát triển"
(Ch7 đã có sẵn chỗ này — `docs/02:57`).

Chi phí: 0 ngày code. Rủi ro: phụ thuộc hoàn toàn vào việc giảng viên có chấp nhận cách khoanh
phạm vi này hay không — **đây là thông tin chỉ bạn có, tôi không kiểm chứng được**.

Khuyến nghị thực tế: xác nhận điều này với giảng viên trước, vì câu trả lời quyết định giữa
"0 ngày" và "5–8 ngày". Nếu không xác nhận được, làm hướng A vì nó rẻ và an toàn.

---

## 6. Xác nhận không thay đổi tài liệu & bước tiếp theo theo Stop rules

### Đã xác nhận

- `docs/00-master-plan.md`, `01-architecture.md`, `02-requirements.md`, `03-api-contract.md`,
  `04-data-model.md`, `05-traceability-matrix.md`: **không sửa một ký tự nào** trong bước này.
- `plans/current-task.md`: **không sửa**, giữ nguyên trạng thái `REVIEW` của task
  `public-snapshot-staging`.
- `logs/*`: **không sửa**.
- `lingora-admin/prisma/schema.prisma` và migrations: **không sửa**.
- File duy nhất được tạo: `plans/gap-analysis-de-bai-vs-master-plan.md` (chính file này).

### Áp dụng Stop rules (`AGENTS.md` §Stop rules)

Bất kỳ hành động nào theo báo cáo này đều kích hoạt Stop rules:

- "A dependency, schema, API path, or architecture change is implied but not named in the
  approved task" — đúng với cả 3 chức năng.
- Ngoài ra vi phạm change controls: mục 2 (dependency `WorkManager`), mục 3 (enum/schema),
  mục 6 (dịch chuyển Must/Nice).

Do đó **không** có thay đổi nào được thực hiện, và cần theo trình tự:

1. Bạn quyết định phạm vi: chọn hướng A / hướng B / lựa chọn §5.5 cho **từng** chức năng
   (có thể trộn — ví dụ (5) và (6) theo A, (2) bỏ vào Hướng phát triển).
2. Xác nhận với giảng viên về diễn giải 6 chức năng, nếu làm được (ảnh hưởng lớn nhất tới
   quyết định — xem §5.5).
3. Nếu quyết định thêm chức năng: viết `plans/current-task.md` mới cho scope amendment, kèm
   ADR trong `logs/decision-log.md` (dự kiến `ADR-006`) ghi rõ việc mở lại baseline v5 đã khóa
   và các change control bị chạm.
4. Bạn APPROVE plan đó → chỉ khi đó `docs/00-05` mới được sửa.
5. Cập nhật `docs/05-traceability-matrix.md` §"Scope Gap Review approved resolutions" —
   3 dòng Grammar/Notification-Reminder/SRS hiện đang ghi "không làm" và **sẽ tự mâu thuẫn**
   nếu code được thêm mà bảng không được cập nhật.

Lưu ý về ADR-004: các loại trừ hiện tại đến từ `ADR-004` (2026-08-14) — một quyết định đã được
người phê duyệt. Đảo chiều nó cần một ADR mới ghi rõ superseding, không phải sửa lặng lẽ nội
dung `ADR-004`.

### Trạng thái báo cáo

`REVIEW — chờ quyết định phạm vi của người. Không có file canonical nào bị sửa.`




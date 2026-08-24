# ADR-004 Amendment — Full Scope Restoration (4 hạng mục đề bài)

## Status

APPROVED

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

> **Người đã APPROVE amendment này ngày 2026-08-15** (`Status: APPROVED` do người đặt).
> Bốn quyết định phạm vi ở §12 đã chốt. Amendment **chưa được implement**: không có file
> `docs/00-05`, `schema.prisma`, migration, RLS hay code nào bị sửa — xác nhận ở §11.
> Theo `AGENTS.md:61`, implement chỉ bắt đầu khi có một `plans/current-task.md` mới ở trạng thái
> `APPROVED`; điều kiện tiền đề ghi ở §14.
> Audit trạng thái Git khi có session song song: §13.

## Amends

- `ADR-004 — Project 1 learning capability scope-gap resolutions` (2026-08-14, đã duyệt)
- Không thay thế `ADR-002`, `ADR-003`, `ADR-005`. Quan hệ với `SEC-D1…SEC-D10`: xem §6.

## Date

`2026-08-15`

## Category

`scope-ambiguity`

---

## 1. Context

Đối chiếu đề bài gốc — *"Xây dựng ứng dụng học ngoại ngữ trên nền tảng di động — Ứng dụng bao
gồm các chức năng học từ vựng, ngữ pháp, nghe, kiểm tra, lên lịch học tập và nhắc nhở người học
học tập theo lịch biểu"* — với canonical `docs/00-05` cho thấy 6 chức năng đề bài chỉ được phủ
khoảng 1.5–2.5. Chi tiết bằng chứng: `plans/gap-analysis-de-bai-vs-master-plan.md`.

`ADR-004` đã **chủ động loại trừ** Grammar curriculum, Notification/Reminder và scored
`LISTENING` để tránh việc nhãn sản phẩm rộng âm thầm sinh ra entity mới. Quyết định đó đúng về
mặt kiểm soát phạm vi, nhưng hệ quả là ứng dụng không phủ đề bài.

Người đã quyết định (2026-08-15) chọn **hướng gộp vào kiến trúc hiện có** cho cả 4 hạng mục,
loại bỏ hướng "thêm đúng nghĩa" (~3.5–4.5 tuần).

### Bối cảnh lộ trình

- Hiện tại: **đầu tuần 3 / 12** (G1 tính từ 2026-08-13). M1.3 đã dùng tuần 1–2.
- Cửa sổ đóng: **hết tuần 10 = M5 Feature freeze** (`docs/00:102`).
- Tuần 3–8 đã kín theo `docs/00:88–104`. Dư địa thực tế: tuần 5, 7, 9.
- Trạng thái code thật: `lingora-android/` và `lingora-ai/` **chưa scaffold** (chỉ có README +
  `.env.example`); `lingora-admin/` có `prisma/` nhưng **chưa có `src/`**. Nghĩa là mọi việc
  Android/Admin dưới đây là **code mới**, không phải sửa code cũ — điều này làm chi phí thấp
  hơn so với việc thêm tính năng vào codebase đã tồn tại.

---

## 2. Ba phát hiện làm thay đổi chi phí so với gap-analysis

Ba điểm dưới đây phát sinh từ việc đọc migration SQL thật, không có trong báo cáo gap-analysis.
Chúng cần được người biết trước khi APPROVE.

### 2.1. Mục 2 (Lên lịch học tập) có chi phí backend bằng **0** — đã được cấp quyền sẵn

Không chỉ `dailyGoalMin` tồn tại trong schema. Toàn bộ đường ghi đã được mở sẵn từ M1.3:

- `202608140002/migration.sql:316` — `GRANT UPDATE (display_name, avatar_url, ui_locale,
  native_lang_code, daily_goal_min, timezone) ON public.profiles TO authenticated;`
- `202608140002/migration.sql:430` — `CREATE POLICY profiles_own_safe_update ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());`
- `202608140002/migration.sql:36–38` — trigger `validate_profile_write()` đã validate
  `daily_goal_min >= 0`.

Nghĩa là learner **đã có thể** `PATCH` `daily_goal_min` qua PostgREST ngay hôm nay. Mục 2 thuần
là công việc UI. Không migration, không RLS, không grant, không SEC-D amendment.

### 2.2. Thêm giá trị enum **vẫn cần một migration file** — chỉ là không cần bảng mới

`docs/01:121` nói *"thêm 1 giá trị enum + 1 Fragment, không migrate bảng"*. Diễn giải chính xác:
`ALTER TYPE "ExerciseType" ADD VALUE 'X'` là một **migration DDL thật** (enum được tạo ở
`202608140001/migration.sql:11`), chỉ không tạo/đổi bảng nào. Cả mục 1 và mục 4 đều cần migration
file mới. Đây không phải rào cản, nhưng change control mục 3 bị chạm và cần ghi nhận trung thực.

Cảnh báo kỹ thuật kèm theo: PostgreSQL **không cho dùng giá trị enum mới trong cùng transaction
đã thêm nó**. Prisma bọc mỗi migration trong một transaction, nên migration thêm enum value
**không được** đồng thời seed dữ liệu dùng giá trị đó. Phải tách thành hai migration. Nếu bỏ qua
điểm này, `prisma migrate deploy` sẽ fail và rất khó chẩn đoán.

### 2.3. Mục 4 (Nghe) — rào cản thật **không phải** enum hay bảng, mà là Storage RLS

Đây là phát hiện quan trọng nhất và là lý do mục 4 phải được cân nhắc độc lập.

Không cần bảng mới: `Exercise.payload` là JSONB (`schema.prisma:194`), constraint duy nhất là
`jsonb_typeof(payload) = 'object'` và `payload->>'payloadVersion' = '1'`
(`202608140001/migration.sql:142–143`). Payload nghe kiểu
`{audioUrl, transcript, mode: "TYPE_WHAT_YOU_HEAR"}` (đúng như legacy `docs/04:347`) vừa khít.

Nhưng audio cho bài tập nghe phải nằm ở đâu đó, và Storage RLS hiện tại **chỉ cho phép đúng hai
đường dẫn**:

- `profiles/{userId}/{filename}` trong `lingora-avatars`
- `vocabulary/{vocabularyId}/{filename}` trong `lingora-media` — và learner chỉ đọc được khi
  `vocabularyId` là UUID hợp lệ **và** reachable qua `lesson_vocabulary → lessons → courses` với
  cả hai `is_published = true` (`202608140002/migration.sql:501–522`).

Hệ quả chia mục 4 thành hai phương án chi phí khác nhau hẳn:

- **4a — nghe ở mức từ vựng:** audio tái sử dụng đúng `vocabulary/{vocabularyId}/` đã có. RLS
  hiện tại **đã cho phép**, không cần chạm SEC-D8. Bài tập: nghe audio của từ → chọn/gõ đúng từ.
- **4b — nghe ở mức câu:** cần audio không gắn với một `vocabulary` row (ví dụ câu
  *"I have an apple"* ở `docs/04:347`). Không có đường dẫn nào được phê duyệt cho loại audio này
  → cần **path convention mới + policy RLS mới + có thể bucket limit mới** → **bắt buộc amend
  SEC-D8**, vốn là quyết định đã qua một vòng amendment do lỗ hổng size enforcement phát hiện
  bằng HTTP thật (`ADR-005 Amendment — SEC-D8 PA2`).

Khuyến nghị: chọn **4a**. Nó phủ được chức năng "Nghe" của đề bài với chi phí gần bằng mục 1, và
tránh mở lại SEC-D8 — nơi dự án đã từng có một lỗ hổng thật.

---

## 3. Mục 1 — Ngữ pháp

### Quyết định đề xuất

Thêm **một** giá trị vào enum `ExerciseType`: **`GRAMMAR`** — **người đã chốt tên này 2026-08-15 (§12.1)**.

Lý do chọn tên `GRAMMAR` thay vì `GRAMMAR_MCQ`: enum mô tả *loại bài tập theo miền kiến thức*
để `payload.mode` tự do mô tả hình thức (chọn đáp án / điền dạng đúng của động từ). Nếu đặt
`GRAMMAR_MCQ` thì việc thêm dạng ngữ pháp thứ hai lại phải thêm enum value nữa.

Ngữ pháp **không** trở thành subsystem: không có bảng `GrammarLesson`, không có
`UserGrammarProgress`. Nội dung ngữ pháp là `Exercise` gắn vào `Lesson` đã có, tiến độ vẫn đi qua
`UserProgress` lesson-level như `P1-FR-004`.

### Payload đề xuất (KHÔNG duyệt cứng — xem §12.4)

> Người đã quyết định 2026-08-15: hình dạng cuối của payload để lại cho **task implement** và
> **acceptance test**. Khối dưới đây là đề xuất tham khảo, không phải hợp đồng đã khóa. Ràng buộc
> duy nhất bắt buộc là `payloadVersion = '1'` và `jsonb_typeof(payload) = 'object'`.

```json
{ "payloadVersion": "1", "mode": "CHOOSE_CORRECT_FORM",
  "prompt": "She ___ to school every day.",
  "options": ["go", "goes", "going", "gone"], "correctIndex": 1,
  "explanation": "Present simple, chủ ngữ số ít ngôi thứ ba → thêm -es." }
```

`explanation` là điểm khác biệt so với MCQ thuần: bài tập ngữ pháp cần giải thích quy tắc, và đây
cũng là bằng chứng "có học ngữ pháp" chứ không chỉ "có bài tập". Trường này không cần schema
change vì nằm trong JSONB.

### File sẽ đổi

| File | Thay đổi | Ghi chú |
|---|---|---|
| `lingora-admin/prisma/schema.prisma` | `enum ExerciseType` thêm `GRAMMAR` | dòng 24–28 |
| `lingora-admin/prisma/migrations/<new>/migration.sql` | `ALTER TYPE "ExerciseType" ADD VALUE 'GRAMMAR';` | **migration mới, không bảng mới** |
| `lingora-admin/src/lib/validators/exercise.ts` | Zod schema cho payload `GRAMMAR` | file chưa tồn tại — sẽ tạo ở tuần 7 |
| `lingora-admin/src/app/(dashboard)/exercises/*` | form nhập bài tập ngữ pháp | chưa tồn tại — tuần 7 |
| `lingora-android/…/ui/exercise/GrammarExerciseFragment.java` | Fragment mới | chưa tồn tại — tuần 5 |
| `lingora-android/…/ui/exercise/ExerciseFragmentFactory.java` | map `GRAMMAR` → Fragment | chưa tồn tại — tuần 5 |
| `docs/02-requirements.md` | sửa `P1-FR-003`; **thay** dòng loại trừ Grammar ở `:218` | chỉ sau APPROVE |
| `docs/04-data-model.md` | thêm payload `GRAMMAR`; sửa `:437` | chỉ sau APPROVE |
| `docs/05-traceability-matrix.md` | sửa dòng `Grammar` ở `:65` | chỉ sau APPROVE |
| `logs/decision-log.md` | ADR-006 (amendment này) | khi implement |

### Vị trí Fragment trong luồng Lesson hiện có

Luồng đã được đặc tả: Lesson detail → danh sách `Exercise` sắp theo `orderIndex` → mỗi exercise
render một Fragment theo `type`. `GrammarExerciseFragment` là **nhánh thứ tư** trong cùng
factory đó, ngang hàng `McqExerciseFragment` / `FillBlankExerciseFragment` /
`ReorderExerciseFragment`. Không có entry point riêng trên navigation, không có tab mới. Người
học gặp bài ngữ pháp **trong** bài học, đúng như gặp MCQ.

Chấm điểm đi qua đúng đường `P1-FR-003`/`P1-FR-004` đã duyệt: chấm client-side, ghi
`UserProgress` lesson-level. Không có write path mới.

### Effort · Migration · Tuần

| | |
|---|---|
| **Effort** | **2.5 ngày** — 0.5 (schema+migration) · 0.5 (Zod+Admin form) · 1 (Fragment + render + chấm) · 0.5 (test) |
| **Migration** | **CÓ** — 1 migration, `ALTER TYPE ADD VALUE`, không bảng mới, không RLS mới |
| **Tuần** | Migration + Zod ở **tuần 5**; Admin form ở **tuần 7** (đã có việc "CRUD Exercise") |
| **Ảnh hưởng mốc** | Không. Tuần 5 = M2 (học trọn 1 bài) — thêm loại bài tập thứ tư **làm mạnh** M2 |

---

## 4. Mục 2 — Lên lịch học tập

### Quyết định đề xuất

Không có thay đổi backend. Đưa `dailyGoalMin` từ field trơ thành field người dùng điều khiển,
và hiển thị "lịch học hôm nay" suy ra từ dữ liệu đã có.

Hai phần:

1. **Profile — đặt mục tiêu.** Control cho `dailyGoalMin` (ví dụ 10/15/30/60 phút).
   Ghi qua PostgREST `PATCH /rest/v1/profiles?id=eq.<uid>`, đường ghi đã mở sẵn (§2.1).
2. **Home — lịch học hôm nay.** Hiển thị "Hôm nay: N từ cần ôn · mục tiêu M phút", với N từ
   `user_vocab_srs.next_review_at <= now()` (đã có index `(user_id, next_review_at)` theo
   `docs/01:118`) và M từ `dailyGoalMin`.

### Diễn đạt trung thực — bắt buộc trong báo cáo

Đây là **"mục tiêu học tập hằng ngày + lịch ôn tập do hệ thống đề xuất"**, không phải "người học
tự chọn thứ 3 và thứ 5, 20:00". Nếu báo cáo KNPM nói quá thành cái sau, hội đồng chỉ cần mở app
là thấy. Ghi rõ giới hạn này trong mục Phạm vi, và đặt `StudyPlan` do user tự định nghĩa vào
Ch7 Hướng phát triển.

### File sẽ đổi

| File | Thay đổi |
|---|---|
| `lingora-android/…/ui/profile/ProfileFragment.java` | control sửa `dailyGoalMin` |
| `lingora-android/…/data/repository/ProfileRepository.java` | `PATCH` safe-field |
| `lingora-android/…/ui/home/HomeFragment.java` | thẻ "lịch học hôm nay" |
| `lingora-android/…/data/repository/SrsRepository.java` | đếm thẻ due |
| `docs/02-requirements.md` | requirement mới `P1-FR-012` (sau APPROVE) |
| `docs/05-traceability-matrix.md` | dòng traceability + `P1-T-012` (sau APPROVE) |

**Không đổi:** `schema.prisma`, migrations, RLS, grants, API contract.

### Effort · Migration · Tuần

| | |
|---|---|
| **Effort** | **1.5 ngày** — 0.5 (Profile control + PATCH) · 0.5 (thẻ Home + đếm due) · 0.5 (test) |
| **Migration** | **KHÔNG** — cả field, grant, policy và validation trigger đều đã tồn tại |
| **Tuần** | **Tuần 9** (đã có việc "Màn Profile, biểu đồ tiến độ") — khớp tự nhiên |
| **Ảnh hưởng mốc** | Không. Sau M4, trước M5 |

### Phụ thuộc

Mục 3 (Nhắc nhở) phụ thuộc mục 2 vì nhắc theo `dailyGoalMin`. Làm mục 2 trước trong cùng tuần 9.

---

## 5. Mục 3 — Nhắc nhở

### Quyết định đề xuất

Local notification **thuần client-side**. Giữ nguyên toàn bộ phần bị chặn ở `docs/04:433`: không
FCM, không `device_tokens`, không `notification_preferences`, không server push, không scheduled
job. Chỉ đảo ngược đúng một điều: cụm *"reminder-schedule entity"* vẫn bị chặn, nhưng một
**reminder client-side không có entity** được cho phép.

Cơ chế: `WorkManager` `PeriodicWorkRequest` chạy mỗi ngày một lần, đọc số thẻ due từ Room cache
và `dailyGoalMin`, so với `lastQualifyingActivityDate` — nếu hôm nay chưa có hoạt động đủ điều
kiện thì hiện notification.

### Nơi lưu giờ nhắc — **người đã chọn 3a** (§12.2)

| Phương án | Chi phí | Đánh đổi |
|---|---|---|
| **3a — `SharedPreferences`** ✅ **ĐÃ CHỌN** | 0 migration | Mất khi cài lại app / đổi máy. Không chạm SEC-D3. |
| **3b — thêm `Profile.reminderTime`** ❌ đã loại | 1 migration + amend SEC-D3 | Bền, đồng bộ đa thiết bị. Chạm change control mục 3 và **phải amend SEC-D3** để thêm field vào danh sách learner-writable + thêm `GRANT UPDATE`. |

**Quyết định: 3a.** Giờ nhắc là thiết lập theo thiết bị, không phải dữ liệu học tập. 3b mở lại
SEC-D3 — quyết định định nghĩa ranh giới an ninh learner-writable — để đổi lấy tiện lợi không
liên quan tới điểm số. Vì 3a được chọn, **không có SEC-D nào cần amend cho mục 3**, và hạn chế
"giờ nhắc mất khi đổi máy" phải được nêu thẳng trong báo cáo, không che.


### Điểm kỹ thuật không được bỏ qua

- **Android 13+ (API 33+)** yêu cầu runtime permission `POST_NOTIFICATIONS`. `targetSdk 35`
  (`docs/QUICK-REF.md:15`) nên **bắt buộc** xin quyền, kèm trạng thái bị từ chối.
- **Doze / OEM battery killer:** `WorkManager` không đảm bảo giờ chính xác. Phải diễn đạt là
  "nhắc trong khoảng thời gian đã chọn", không phải "đúng 20:00".
- **`WorkManager` là dependency mới** — chưa có trong `docs/01:149–176`. Chạm change control
  mục 2, cần ghi lý do + impact trong ADR-006. Đây là thư viện AndroidX chính thức, không phải
  third-party; rủi ro thấp.

### File sẽ đổi

| File | Thay đổi |
|---|---|
| `lingora-android/app/build.gradle` | `androidx.work:work-runtime:2.9.1` (pinned) |
| `lingora-android/app/src/main/AndroidManifest.xml` | `POST_NOTIFICATIONS` |
| `lingora-android/…/util/ReminderWorker.java` | Worker mới |
| `lingora-android/…/util/ReminderScheduler.java` | enqueue/cancel |
| `lingora-android/…/ui/profile/ProfileFragment.java` | bật/tắt + chọn giờ |
| `lingora-android/app/src/main/res/values{,-vi}/strings.xml` | chuỗi notification 2 locale |
| `docs/01-architecture.md` | `WorkManager` vào bảng thư viện `:149–176` (sau APPROVE) |
| `docs/02-requirements.md` | `P1-FR-013`; **thay** dòng loại trừ `:221` (sau APPROVE) |
| `docs/04-data-model.md` | sửa `:433`/`:436` — client-side reminder không sinh entity (sau APPROVE) |
| `docs/05-traceability-matrix.md` | sửa dòng `Notification/Reminder` `:69` (sau APPROVE) |

### Effort · Migration · Tuần

| | |
|---|---|
| **Effort** | **2 ngày** (phương án 3a) — 0.5 (dependency + permission + manifest) · 0.75 (Worker + scheduler) · 0.25 (UI chọn giờ) · 0.5 (test trên máy thật, gồm cả trường hợp từ chối quyền) |
| | **+0.5 ngày** nếu chọn 3b (migration + grant + amend SEC-D3 + test) |
| **Migration** | **KHÔNG** với 3a · **CÓ** với 3b |
| **Tuần** | **Tuần 9**, sau mục 2 |
| **Ảnh hưởng mốc** | Không. Cần test trên **máy thật** (emulator không phản ánh doze/OEM) |

---

## 6. Mục 4 — Nghe (chi phí tách riêng theo yêu cầu)

### 6.1. Xác nhận trực tiếp câu hỏi của người

> *"xác nhận rõ có cần bảng mới không hay chỉ thêm enum value là đủ."*

**Không cần bảng mới.** `Exercise.payload` là JSONB, chỉ ràng buộc `jsonb_typeof = 'object'` và
`payloadVersion = '1'`. Payload nghe vừa khít.

**Nhưng "chỉ thêm enum value" là chưa đủ** — và đây là điểm mục 4 khác hẳn ba mục trên. Rào cản
thật là **Storage RLS**, không phải schema. Chi tiết ở §2.3. Hai phương án:

### 6.2. Phương án 4a — nghe ở mức từ vựng (**ĐÃ CHỌN** — §12.3)

Bài tập: phát audio của một từ vựng → người học chọn hoặc gõ lại từ đó. Audio dùng đúng
`vocabulary/{vocabularyId}/{filename}` đã có, `Vocabulary.audioUrl` đã có
(`schema.prisma`), và policy `lingora_vocabulary_audio_select` **đã cho phép** learner đọc khi
từ đó reachable qua published `Course → Lesson → LessonVocabulary`.

Payload (đề xuất tham khảo — **không duyệt cứng**, xem §12.4):

```json
{ "payloadVersion": "1", "mode": "LISTEN_AND_CHOOSE",
  "vocabularyId": "<uuid>",
  "options": ["apple", "apply", "ample", "appeal"], "correctIndex": 0 }
```

Điểm mạnh về mặt an ninh: payload tham chiếu `vocabularyId` chứ **không** nhúng URL tự do. Nghĩa
là quyền đọc audio vẫn do RLS quyết định, client không thể trỏ tới object ngoài phạm vi. Đây là
lý do 4a không chạm SEC-D8.

| | |
|---|---|
| **Effort** | **2.5 ngày** — 0.5 (enum+migration) · 0.5 (Zod+Admin) · 1 (Fragment nghe + Media3 playback + chấm) · 0.5 (test) |
| **Migration** | **CÓ** — 1 migration `ALTER TYPE "ExerciseType" ADD VALUE 'LISTENING'`. Không bảng mới, không RLS mới, không Storage change |
| **SEC-D bị chạm** | **KHÔNG** |
| **Tuần** | Tuần 5 (enum+Fragment) + tuần 7 (Admin form) — gộp cùng mục 1 để chỉ tốn **một** migration |
| **Ảnh hưởng mốc** | Không |

### 6.3. Phương án 4b — nghe ở mức câu (**ĐÃ LOẠI** — §12.3 chọn 4a)

Bài tập kiểu `docs/04:347`: nghe câu *"I have an apple"* → gõ lại. Audio này **không thuộc** một
`vocabulary` row nào, nên không có đường dẫn Storage nào được phê duyệt cho nó.

Cần thêm, ngoài phần 4a:

1. Path convention mới, ví dụ `exercise/{exerciseId}/{filename}`.
2. Policy `storage.objects` mới cho SELECT (learner, reachable qua published lesson của exercise)
   và INSERT/DELETE (ADMIN).
3. Đường reachability mới: `exercises → lessons → courses`, tương tự policy hiện có nhưng qua
   `exercises` thay vì `lesson_vocabulary`.
4. **Amend SEC-D8** — quyết định định nghĩa topology Storage, đã qua một vòng amendment do lỗ
   hổng size enforcement phát hiện bằng HTTP thật.
5. Upload audio ở Admin cho exercise (khác luồng upload audio từ vựng hiện có).
6. Test HTTP thật cho boundary mới: anonymous denied, learner của khóa chưa publish denied,
   learner hợp lệ allowed, size/MIME enforcement, ADMIN-only write.

| | |
|---|---|
| **Effort** | **4a (2.5 ngày) + 3 ngày = 5.5 ngày** — 1 (path+policy+migration) · 0.5 (Admin upload) · 0.5 (Fragment gõ lại câu) · **1 (test HTTP boundary thật — bắt buộc, không được suy luận)** |
| **Migration** | **CÓ** — 1 migration cho enum + **1 migration Storage policy** |
| **SEC-D bị chạm** | **CÓ — SEC-D8 phải amend** |
| **Tuần** | Tuần 7 (cùng Admin upload media) |
| **Rủi ro** | **Cao nhất trong cả 4 mục.** Mở lại SEC-D8 là mở lại đúng nơi đã từng có lỗ hổng thật (`ADR-005 Amendment`: avatar 5,242,881 byte trả HTTP 200). Mỗi policy Storage mới là một bề mặt tấn công mới cần chứng minh bằng HTTP evidence, không phải bằng lập luận |

### 6.4. So sánh để người quyết định

| | 4a | 4b |
|---|---|---|
| Effort | 2.5 ngày | 5.5 ngày (**+120%**) |
| Bảng mới | Không | Không |
| Migration | 1 (enum) | 2 (enum + Storage policy) |
| Amend SEC-D8 | Không | **Có** |
| Phủ chức năng "Nghe" của đề bài | **Có** | Có, phong phú hơn |
| Rủi ro an ninh | Không đổi | Bề mặt Storage mới |

**Khuyến nghị 4a.** Đề bài yêu cầu "nghe" chứ không quy định nghe ở mức câu. 4a phủ đủ yêu cầu
với 45% chi phí và không chạm quyết định an ninh nào. 4b có thể ghi vào Ch7 Hướng phát triển.

---

## 7. Xác nhận ảnh hưởng tới các quyết định SEC-D đã duyệt

Đây là phần trả lời trực tiếp yêu cầu của người. Đã đọc `SEC-D1…SEC-D10` trong
`logs/decision-log.md:390–399` và migration SQL thật.

| Quyết định | Ảnh hưởng | Cần amend? |
|---|---|---|
| **SEC-D1** Profile creation trong signup transaction | Không mục nào chạm signup/trigger | **Không** |
| **SEC-D2** Email authoritative, metadata không set privileged field | Không mục nào ghi role/streak/identity | **Không** |
| **SEC-D3** Learner safe-field: `displayName, avatarUrl, uiLocale, nativeLangCode, dailyGoalMin, timezone` | **Mục 2 nằm trọn trong SEC-D3** — `dailyGoalMin` đã có tên trong danh sách, đã có `GRANT UPDATE`, đã có policy `profiles_own_safe_update`, đã có validation `daily_goal_min >= 0`. Mục 2 chỉ **sử dụng** quyền đã cấp | **Không** — với 3a.<br>**CÓ nếu chọn 3b** (thêm `reminderTime` vào danh sách learner-writable + `GRANT UPDATE` + validation) |
| **SEC-D4** Account deletion deferred | Không mục nào xóa account | **Không** |
| **SEC-D5** RLS operation-specific; UserProgress mutation trusted-flow-only | **Xác nhận không sai lệch.** Mục 1 và 4 thêm *loại* exercise, không thêm write path. Chấm điểm và ghi `UserProgress` đi đúng đường `P1-FR-003`/`P1-FR-004` đã duyệt. `exercises_visible_read` (`:393`) đã phủ mọi `ExerciseType` vì policy lọc theo `lesson_id`, **không** theo `type` | **Không** |
| **SEC-D6** ADMIN không có learner-data access | Mục 1/4 mở rộng ADMIN content management (đã thuộc SEC-D6), không thêm learner-data access | **Không** |
| **SEC-D7** Learner content read theo published `Course → Lesson` | Bài tập ngữ pháp/nghe là `Exercise` con của `Lesson` → **đã được SEC-D7 phủ sẵn**, không cần policy mới | **Không** |
| **SEC-D8** Storage topology hai bucket | **4a: không chạm.** Tái dùng `vocabulary/{vocabularyId}/` và policy hiện có.<br>**4b: bắt buộc amend** — path + policy + reachability mới | **Không với 4a · CÓ với 4b** |
| **SEC-D9** `record_review` semantics | Không mục nào đổi `record_review`. Mục 2 **đọc** `next_review_at`, không ghi | **Không** |
| **SEC-D10** Không idempotency table trong M1.3 | Không mục nào thêm idempotency | **Không** |

### Kết luận §7

- **Mục 1, 2, 3 (3a), 4a: không cần amend bất kỳ SEC-D nào.** Cả bốn đều đi trong ranh giới an
  ninh đã duyệt.
- **Cần amend SEC-D chỉ khi** người chọn 3b (→ SEC-D3) hoặc 4b (→ SEC-D8).

Điểm đáng chú ý: `exercises_visible_read` lọc theo `lesson_id` chứ không theo `type`, nên bất kỳ
`ExerciseType` mới đều tự động thừa hưởng đúng ranh giới visibility. Đây là lý do thêm loại bài
tập rẻ về mặt an ninh — thiết kế M1.3 đã lường trước điều này.

### Change controls bị chạm (`AGENTS.md` §Change controls)

| Mục | Điều khoản | Chi tiết |
|---|---|---|
| 1, 4 | **3** (schema) | `ALTER TYPE ADD VALUE` — cần ADR |
| 3 | **2** (dependency) | `WorkManager` — cần ghi lý do + impact |
| 1, 2, 3, 4 | **6** (Must/Nice) | `LISTENING` từ deferred/P2 → Must; Reminder từ "no canonical priority" → Must |
| — | **7, 8** | **Không chạm** — không xóa/refactor gì ngoài phạm vi |

---

## 8. Tổng hợp

### Chi phí

| Mục | Effort | Migration | Bảng mới | SEC-D | Tuần |
|---|---|---|---|---|---|
| 1 — Ngữ pháp | 2.5 ngày | CÓ (enum) | Không | Không | 5 + 7 |
| 2 — Lên lịch học tập | 1.5 ngày | **KHÔNG** | Không | Không | 9 |
| 3 — Nhắc nhở (3a) | 2 ngày | **KHÔNG** | Không | Không | 9 |
| 4 — Nghe (**4a**) | 2.5 ngày | CÓ (enum) | Không | Không | 5 + 7 |
| **Tổng khuyến nghị** | **8.5 ngày** | 1 migration gộp | Không | Không amend | 5 · 7 · 9 |
| *4b thay cho 4a* | *+3 ngày → 11.5* | *+1 Storage* | *Không* | ***SEC-D8*** | *7* |
| *3b thay cho 3a* | *+0.5 ngày* | *+1* | *Không* | ***SEC-D3*** | *9* |

**8.5 ngày** cho cả 4 hạng mục, so với 3.5–4.5 tuần của hướng "thêm đúng nghĩa".

Tối ưu: gộp enum của mục 1 và 4a vào **một** migration
(`ALTER TYPE "ExerciseType" ADD VALUE 'GRAMMAR'; ALTER TYPE "ExerciseType" ADD VALUE 'LISTENING';`)
→ một lần review migration thay vì hai. Nhớ ràng buộc ở §2.2: migration này **không được** seed
dữ liệu dùng hai giá trị mới.

### Phân bổ theo lộ trình — không mốc nào bị đẩy lùi

| Tuần | Việc đã có (`docs/00`) | Thêm | Mốc |
|---|---|---|---|
| 5 | Bài tập MCQ + Fill-blank, `record_review` | +1 migration enum · Fragment ngữ pháp · Fragment nghe (**2 ngày**) | **M2** — thêm loại bài tập *làm mạnh* "học trọn 1 bài" |
| 7 | Web Admin CRUD Exercise, upload audio | +Zod & form cho 2 loại mới (**1 ngày**) | **M3** — cùng công việc CRUD Exercise |
| 9 | Màn Profile, biểu đồ tiến độ | +`dailyGoalMin` UI · thẻ lịch hôm nay · reminder (**3.5 ngày**) | **M4.5** — Profile là chỗ tự nhiên |
| 10 | Test, polish | +2 ngày đệm test | **M5** freeze |

Tổng 8.5 ngày rải trên 3 tuần đã có việc cùng chủ đề. **Không** mốc M2/M3/M4/M4.5/M5 nào bị đẩy.
Không việc nào chạm tuần 11 (APK + tài liệu) hay 12 (demo + slide).

Điều kiện "tuyệt đối không cắt" (`docs/00:110`) — Auth, luồng học 1 bài, ≥1 API AI thật, 3 báo
cáo — **không bị ảnh hưởng**: không mục nào đụng tới AI hay Auth.

### Rủi ro của chính amendment này

1. **Mở lại baseline v5 đã khóa** (`docs/00:36`, đánh giá 9.1/10). Cần ADR-006 sạch giải thích
   vì sao: phủ đề bài gốc, không phải thêm tính năng tùy ý.
2. **Không tăng điểm ML/NLP.** Cả 4 mục thuần SE — chỉ cứu điểm KNPM.
3. **Enum value không xóa được** trong PostgreSQL. Thêm `GRAMMAR`/`LISTENING` là quyết định
   một chiều. Cần chắc về tên trước khi APPROVE.
4. **Tuần 9 gánh 3.5 ngày** trên tổng 5. Nếu M4.5 (cả 2 AI chạy thật) trượt vào tuần 9, phải
   ưu tiên M4.5 và đẩy mục 2+3 sang tuần 10 — vẫn trước M5, vẫn an toàn.
5. **Mục 3 cần máy thật** để test. Nếu chỉ có emulator, không kết luận được về doze/OEM và phải
   ghi là giới hạn đã biết.

---

## 9. Review

- **Architecture:** không repo boundary nào đổi; không runtime mới; AI Server không bị chạm.
- **Requirements:** thêm `P1-FR-012` (lịch học), `P1-FR-013` (nhắc nhở); sửa `P1-FR-003`
  (2 loại exercise mới). Ba dòng loại trừ trong `ADR-004` bị thay thế có kiểm soát.
- **Security:** đã audit toàn bộ SEC-D1…SEC-D10 (§7). Phương án khuyến nghị **không** cần amend
  SEC-D nào. Hai phương án đắt hơn (3b, 4b) được nêu rõ kèm SEC-D bị chạm để người quyết định.
- **Data model:** không bảng mới, không cột mới (với 3a). Hai enum value + payload JSONB mới.
- **Scope:** đúng hướng "gộp vào kiến trúc hiện có" người đã chọn; không mục nào thành subsystem.
- **Traceability:** ba dòng `Grammar` / `Listening` / `Notification-Reminder` trong
  `docs/05:65,66,69` hiện ghi "không làm" và **sẽ tự mâu thuẫn** nếu code được thêm mà bảng không
  cập nhật. Bắt buộc sửa cùng lúc.

## 10. Test Plan (thực thi sau APPROVE, không phải bây giờ)

1. `npx prisma migrate deploy` — xác nhận hai enum value được thêm, không bảng nào đổi
   (`git diff` trên schema chỉ có enum).
2. Xác nhận migration enum **không** chứa DML dùng giá trị mới (ràng buộc §2.2).
3. Bài tập `GRAMMAR` và `LISTENING`: learner đọc được khi lesson published, **không** đọc được
   khi draft — chứng minh `exercises_visible_read` phủ type mới mà không cần policy mới.
4. Zod reject payload sai cho cả hai loại mới.
5. `PATCH profiles` với `daily_goal_min` hợp lệ → 200; giá trị âm → lỗi từ trigger
   `validate_profile_write`; ghi `role`/`streak_count` → **vẫn bị chặn** (chứng minh SEC-D3 không
   bị nới).
6. 4a: learner đọc được audio của từ reachable qua published lesson; **không** đọc được khi lesson
   draft; anonymous denied.
7. Reminder: notification xuất hiện trên **máy thật**; trường hợp từ chối `POST_NOTIFICATIONS`
   xử lý sạch, không crash.
8. Ghi evidence theo `AGENTS.md` §Testing: Environment · Command · Output(exit code) · Verdict
   từ output quan sát được, **không** suy luận.

---

## 11. Xác nhận chưa thay đổi gì

- `docs/00-05`: **không sửa một ký tự** — `git diff --stat docs/` rỗng.
- `lingora-admin/prisma/schema.prisma` và `migrations/`: **không sửa** — `git diff --stat` rỗng.
- `logs/decision-log.md`: **không sửa** bởi task này. `ADR-004` giữ nguyên trạng thái đã duyệt;
  ADR-006 chỉ được ghi khi implement.
- `plans/current-task.md`: **không sửa bởi task này**. File này đã bị **session song song** chuyển
  `public-snapshot-staging` từ `REVIEW` sang `DONE` — thay đổi đó được giữ nguyên, không revert (§13).
- File duy nhất tạo/sửa bởi task này: `plans/adr-004-amendment-full-scope.md` (chính file này) và
  `plans/gap-analysis-de-bai-vs-master-plan.md` (báo cáo audit trước đó).

## 12. Quyết định của người — đã chốt 2026-08-15

Người đã trả lời bốn câu hỏi review. Ghi lại nguyên văn quyết định, **không** đổi trạng thái
amendment sang APPROVED:

| # | Câu hỏi | Quyết định | Hệ quả |
|---|---------|-----------|--------|
| 12.1 | Tên giá trị enum | **`GRAMMAR`** | Chốt. Không có canonical doc nào dùng `GRAMMAR_MCQ`; grep `GRAMMAR` trên `docs/0*.md`, `schema.prisma`, cả 3 migration → **0 match**, nên không có xung đột. |
| 12.2 | Mục 3 — nơi lưu giờ nhắc | **3a — `SharedPreferences` client-side** | 0 migration, 0 backend, **không cần amend SEC-D3**. Loại bỏ nhánh 3b (`Profile.reminderTime`). |
| 12.3 | Mục 4 — mức audio | **4a — nghe ở mức từ vựng** | Dùng lại `vocabulary/{vocabularyId}/`, **không chạm SEC-D8**, 2.5 ngày. Loại bỏ nhánh 4b (mức câu, 5.5 ngày). |
| 12.4 | Payload §3 và §6.2 | **Chưa duyệt cứng** | Hình dạng cuối của hai payload để lại cho **task implement** và **acceptance test** quyết định. Payload trong §3/§6.2 chỉ là đề xuất tham khảo, không phải hợp đồng đã khóa. |

### Hệ quả tổng hợp sau khi chốt 12.1–12.4

- Tổng effort: **8.5 ngày** (mục 1: 2đ · mục 2: 1đ · mục 3a: 3đ · mục 4a: 2.5đ). Không đổi so với §8
  vì §8 đã tính theo nhánh 3a + 4a khuyến nghị.
- **1 migration duy nhất**: một file `ALTER TYPE "ExerciseType" ADD VALUE` gộp `GRAMMAR` +
  `LISTENING`, kèm cái bẫy Postgres cùng-transaction ở §2.2.
- **0 bảng mới**, **0 SEC-D cần amend** (xác nhận lại §7: 1 + 2 + 3a + 4a đều không chạm SEC-D nào).
- Phân bổ tuần giữ nguyên §8: tuần 5 (2đ) · tuần 7 (1đ) · tuần 9 (3.5đ) — không mốc M2–M5 nào bị đẩy.
- Vì 12.4 chưa chốt payload, `exercises_payload_version_check` (`payloadVersion = '1'`, migration
  `202608140001_init:143`) trở thành **ràng buộc bắt buộc** mà task implement phải thỏa, bất kể
  payload cuối có hình dạng nào.

### Trạng thái duyệt

Người đã APPROVE toàn bộ amendment ngày 2026-08-15. Không còn câu hỏi mở nào. Ranh giới của
APPROVE này — cho phép gì, chưa cho phép gì — ghi ở §14.

---

## 13. Audit trạng thái Git / worktree — session song song

Thực hiện 2026-08-15 trước khi sửa file này, vì một session khác đang thao tác cùng repository.
Toàn bộ audit là **read-only**; không có thay đổi nào của session kia bị ghi đè, revert, reset hay clean.

### 13.1. Trạng thái nền

| Kiểm tra | Kết quả |
|---|---|
| `HEAD` | `46130d5` trên `main` — **không đổi**, không có commit mới |
| `git worktree list` | chỉ `D:/btl 46130d5 [main]` — session kia dùng **cùng một worktree**, không phải worktree riêng |
| `git stash list` | rỗng — không có gì bị stash |
| `git diff --stat docs/ lingora-admin/prisma/` | **rỗng** — canonical docs, `schema.prisma`, cả 3 migration đều nguyên vẹn |

### 13.2. Thay đổi thuộc session kia (giữ nguyên, không can thiệp)

| File | Diffstat | Nội dung |
|---|---|---|
| `AGENTS.md` | +41 | Thêm `HANDOFF.md` làm source-of-truth #3, mục `Task routing` (9 mapping), REVIEW-escalation với tag `category:` grep được, mục `Stop rules`, và ghi chú `AGENTS.md` thắng `.agents/` + `.codex/` |
| `logs/decision-log.md` | +88 | Hai entry mới: `REVIEW-2026-08-15-01` (public snapshot private-reference scan boundary) và `REVIEW-2026-08-15-02` (AGENTS routing task closure scope), cả hai `category: scope-ambiguity`. **`ADR-004` không bị sửa.** |
| `logs/development-log.md` | +71 | Bản ghi hoàn thành cho `public-snapshot-staging` và `agents-task-routing-clarifications`; cả hai ghi `Commit: PENDING` |
| `logs/test-log.md` | +6 | `AGENT-ROUTING-T-001` PASS; `PUBLIC-SNAPSHOT-T-001…004` PASS; `T-005` N/A (review tài liệu) |
| `plans/current-task.md` | +120/-20 | `public-snapshot-staging` chuyển `REVIEW` → **`DONE`**, kèm allowlist, test plan 10 mục, và một mục `Review Re-entry` |
| `HANDOFF.md` | untracked, mới | Handoff brief; ghi M1.3 DONE, M2 chưa bắt đầu |
| `plans/archive/2026-08-15-agent-workflow-hardening-DONE.md` | untracked, mới | Plan đã hoàn thành, lưu trữ |
| `plans/archive/2026-08-15-agents-task-routing-clarifications-DONE.md` | untracked, mới | Plan đã hoàn thành, lưu trữ |
| `staging/lingora-workspace-public/` | untracked, mới | 32 file snapshot công khai |

Tổng: **304 insertions, 22 deletions** trên 5 file tracked.

### 13.3. Kiểm chứng độc lập snapshot của session kia

- `staging/lingora-workspace-public/.git` — **không tồn tại**; `node_modules` — không tồn tại.
- `find` cho `AGENTS.md`, `HANDOFF.md`, `.env`, `QUICK-REF.md`, `00-master-plan.md`, `ENVIRONMENT.md` →
  **0 kết quả**, khớp với `PUBLIC-SNAPSHOT-T-001`.
- `cmp -s` với bản gốc: `DESIGN.md`, `docs/01`…`docs/05`, `schema.prisma`, `package.json`,
  `m1_3_security_test.js` → **byte-identical**. `README.md`, `docs/README.md`, `.gitignore` khác
  bản gốc **đúng như thiết kế** (là ba file được viết mới).

### 13.4. Xung đột với amendment này

**Không có.** Hai session không chạm cùng file nào:

- Session kia: `AGENTS.md`, `logs/*`, `plans/current-task.md`, `HANDOFF.md`, `plans/archive/*`, `staging/*`.
- Session này: `plans/gap-analysis-de-bai-vs-master-plan.md`, `plans/adr-004-amendment-full-scope.md`.

Một điểm cần người lưu ý: `plans/current-task.md` hiện là `public-snapshot-staging` ở `DONE`, nên
amendment này **chưa có slot trong `current-task.md`**. Khi APPROVE, task implement cần một
`plans/current-task.md` mới — theo đúng `HANDOFF.md` mục *Do NOT do next* ("không bắt đầu implement
trước khi có plan mới được duyệt").

### 13.5. Xác nhận không can thiệp

Mọi lệnh dùng trong audit đều read-only: `git status`, `git diff`, `git diff --stat`,
`git worktree list`, `git stash list`, `find`, `cmp -s`, `grep`. Không chạy `checkout`, `reset`,
`restore`, `clean`, `stash`, `commit`, hay `push`. Không có file nào của session kia bị sửa.

## 14. Phạm vi mà APPROVE này cho phép — và không cho phép

Người đã APPROVE amendment ngày 2026-08-15. Ghi rõ ranh giới để không có bước nào bị suy diễn rộng.

### 14.1. APPROVE này cho phép

- Chốt **phạm vi** của 4 hạng mục: mục 1 (`GRAMMAR`), mục 2 (`dailyGoalMin` UI), mục 3a
  (`SharedPreferences` + `WorkManager` local notification), mục 4a (nghe mức từ vựng).
- Chốt **kết luận §7**: 1 + 2 + 3a + 4a **không cần amend bất kỳ SEC-D nào**.
- Chốt **phân bổ lộ trình**: tuần 5 (2đ) · tuần 7 (1đ) · tuần 9 (3.5đ), tổng **8.5 ngày**, không
  mốc M2–M5 nào bị đẩy lùi.
- Cho phép viết `ADR-006` vào `logs/decision-log.md` như bản ghi quyết định của amendment này.

### 14.2. APPROVE này KHÔNG cho phép

Bốn việc dưới đây vẫn cần một `plans/current-task.md` riêng ở trạng thái `APPROVED`, theo
`AGENTS.md:61` ("If `plans/current-task.md` is not `APPROVED`, do not implement feature code") và
`AGENTS.md` §Change controls mục 2 (dependency) + mục 3 (schema/RLS/RPC):

1. Sửa `lingora-admin/prisma/schema.prisma`.
2. Tạo migration `ALTER TYPE "ExerciseType" ADD VALUE`.
3. Thêm dependency `androidx.work:work-runtime`.
4. Sửa `docs/02-requirements.md`, `docs/04-data-model.md`, `docs/05-traceability-matrix.md` — ba file
   này hiện **phủ định tường minh** cả 4 hạng mục (`02:218`, `02:221`, `04:433`, `04:434`, `05:65–69`).
   Nếu code được thêm mà canonical docs không được cập nhật, dự án sẽ **tự mâu thuẫn** — đây là
   điều kiện bắt buộc, không phải việc dọn dẹp tùy chọn.

### 14.3. Điều kiện tiền đề trước khi implement

- `plans/current-task.md` hiện là `public-snapshot-staging` ở `DONE` (do session song song, §13).
  Cần **thay bằng plan mới**, không chèn thêm vào plan cũ.
- Ghi `ADR-006` vào `logs/decision-log.md` **trước hoặc cùng lúc** với implement (`AGENTS.md:103`).
- Cái bẫy Postgres ở §2.2: migration thêm enum value **không được** cùng transaction với seed dữ liệu
  dùng giá trị đó. Nếu bỏ qua, `prisma migrate deploy` sẽ fail.
- Thứ tự khuyến nghị: mục 2 trước (0 migration, 0 rủi ro, chứng minh `dailyGoalMin` không còn trơ),
  rồi mục 1 + 4a chung một migration, mục 3a sau cùng (phụ thuộc mục 2 về `dailyGoalMin` UI).

## Approval

Status: APPROVED
Approved by: Pham Nguyen Thanh Tung
Date: 2026-08-15
Decisions recorded: §12.1 `GRAMMAR` · §12.2 `3a` · §12.3 `4a` · §12.4 payload để lại cho task implement
Phạm vi approve: §14.1 cho phép · §14.2 KHÔNG cho phép · §14.3 điều kiện tiền đề
Chưa implement: chưa sửa schema, migration, RLS, dependency, canonical docs hay code.

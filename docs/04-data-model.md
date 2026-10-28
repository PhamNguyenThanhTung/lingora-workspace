# 04 - Lingora Data Model (Historical & Target Physical Reference)

> **Quy trình hiện hành — 2026-10-28:** Chủ dự án đã hủy `WP-DB-REMAIN-01`, preapply/Stage A/Stage B và cổng DATABASE READY để bắt đầu code app. Bốn migration và schema 34 model được giữ nguyên; xem [báo cáo dọn dẹp](repository-cleanup-2026-10-28.md).

> **WP-DB-FINAL-01 latest status (2026-10-27): STOP / NOT DATABASE READY.** Owner-authorized targeted repair was independently re-reviewed: [FAIL](design/physical/evidence/2026-10-27-product-database-finalize/remediation-review.md). FDB-01 routing and FDB-07 scope-source defects are closed; frozen provenance/snapshot correspondence, fixture safety and acceptance evidence remain incomplete. Four successful checksum-matching migrations and 71 enabled triggers are observed on the exact 34-table DEV target (29+5). Clean replay is NOT RUN / UNESTABLISHED. Preserve all four applied migrations/data; do not run the dormant Auth smoke branch against existing accounts. Parked infrastructure remains nonblocking; app implementation stays pending READY.

> **Current database-design entry — 2026-10-20:** [Reconciliation and Class mapping](design/physical/database-reconciliation-2026-10-20.md), [34-table physical catalog](design/physical/README.md), [security](design/physical/security-and-rls.md) and [four-view ERD](design/physical/physical-erd.puml) are the revised PROPOSED physical package. ADR-043 accepts system assembly of Teacher-submitted Lesson question packages; physical realization remains unapproved/unimplemented. Legacy schema below is historical; live DB UNVERIFIED.

> **CLASSIFICATION: HISTORICAL SCHEMA & TARGET PHYSICAL REFERENCE — NOT CURRENT LOGICAL DOMAIN AUTHORITY.**
> - **Domain authority:** ADR-030–036 and current canonical modeling (`docs/modeling/current-target/`) control logical domain entities, relationships, and invariants. Physical data structures do NOT define domain design.
> - **Role model:** The legacy 6-role descriptions and 2-role SQL schemas below are `HISTORICAL / SUPERSEDED`. The current business role model is strictly 3 roles (`Admin`, `Teacher`, `Learner`) per ADR-034.
> - **Legacy implementation (removed from checkout 2026-10-22; linked Git snapshot):** [`lingora-admin/prisma/schema.prisma`](https://github.com/PhamNguyenThanhTung/lingora-workspace/blob/84baa8521272c38c613a75f2d93144d734c5d4fa/lingora-admin/prisma/schema.prisma) and SQL migrations in `lingora-admin/prisma/migrations/` represent legacy implementation evidence; live database state remains UNVERIFIED.
> - **Physical proposals:** Detailed physical schema proposals (e.g. `docs/design/physical/`) remain PROPOSED / UNAPPROVED; physical mapping remains deferred under P0-D07.
>
> **Phase 0 Canonical Baseline (aligned 2026-09-14 & ADR-014 — Historical Reference):**
> Target database schema aligns with [`docs/plantuml/erd-mvp-learning.puml`](plantuml/erd-mvp-learning.puml) and Phase 0 role/content specifications.
> Historical migrations (`202608140001_init`, `202608140002_auth_rls_storage_record_review`, `202608140003_storage_two_bucket_size_enforcement`) and Git history are strictly preserved for audit.

>
> ### Current Schema vs Target Phase 0 Schema Evolution Strategy
>
> | Classification | Models | Notes & Target Action |
> |---|---|---|
> | **Models to Keep** | `Language`, `Course`, `CourseTranslation`, `Lesson`, `LessonTranslation`, `Vocabulary`, `VocabularyTranslation`, `LessonVocabulary`, `Exercise`, `UserProgress`, `UserVocabSrs`, `ReviewLog` (12 models) | Core learning, vocabulary, exercise, and deterministic SRS foundation. Retain intact. |
> | **Models to Extend** | `Profile` (1 model) | Current: `role: LEARNER \| ADMIN`. Target: support 6 canonical roles (`ADMINISTRATOR`, `LESSON_CREATOR`, `MODERATOR`, `OPERATIONS_STAFF`, `LEARNER`, `ORGANIZATIONAL_MANAGER`) via backward-compatible enum extension or role-mapping junction; add optional cohort reference. |
> | **Models to Extend (Workflow)** | `Course`, `Lesson` | Target: Content workflow status (`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`), `created_by`, `reviewed_by` audit fields. |
> | **Legacy Compatibility** | `ChatScenario`, `ChatScenarioTranslation` (2 models) | Retain for scenario writing prompts context (`UC-06` / `P1-FR-007`). |
> | **Models to Deprecate** | `ChatSession`, `ChatMessage` (2 models) | Retained as physical models for backward compatibility; deprecated pending migration cleanup. |
> | **Target Models to Introduce (Future)** | `Cohort`, `CohortMember`, `SupportTicket`, `AuditLog` | Required for Org Manager (`UC-15`), Ops Staff (`UC-14`), and System Audit (`UC-13`). Not implemented in Phase 0 Reconciliation; scheduled for subsequent milestones. |

---

## [SUPERSEDED / HISTORICAL REFERENCE] Migrated source: database design

### 1.3. Thiết kế Database

#### Nguyên tắc đa ngôn ngữ (giữ nguyên như bản gốc)

| Loại | Là gì | Giải pháp |
|---|---|---|
| **UI i18n** | Nhãn nút, thông báo lỗi | Next.js i18n message catalogs (`vi`/`en`) — **không** nằm trong DB |
| **Content i18n** | Tiêu đề bài học, nghĩa của từ, tiêu đề kịch bản chat | Bảng `*_translations` riêng, khoá `(entity_id, locale)` |

#### `schema.prisma` (Applied M1.2/M1.3 runtime baseline)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Supabase Shared Pooler / Session mode (port 5432)
}

enum Role           { LEARNER ADMIN }
enum Cefr           { A1 A2 B1 B2 C1 C2 }
enum ExerciseType   { MCQ FILL_BLANK REORDER }
enum ProgressStatus { NOT_STARTED IN_PROGRESS COMPLETED }
enum ChatRole        { USER AI }

/// Danh mục ngôn ngữ
model Language {
  code        String  @id @db.VarChar(8)
  name        String
  nativeName  String  @map("native_name")
  isLearnable Boolean @default(false) @map("is_learnable")
  isUiLocale  Boolean @default(false) @map("is_ui_locale")

  courses      Course[]
  vocabularies Vocabulary[]
}

/// Mở rộng auth.users của Supabase. id = auth.users.id (tạo bằng trigger)
model Profile {
  id             String   @id @db.Uuid
  email          String   @unique
  displayName    String?  @map("display_name")
  avatarUrl      String?  @map("avatar_url")
  role           Role     @default(LEARNER)
  uiLocale       String   @default("vi") @map("ui_locale") @db.VarChar(8)
  nativeLangCode String   @default("vi") @map("native_lang_code") @db.VarChar(8)
  dailyGoalMin   Int      @default(15) @map("daily_goal_min")
  streakCount    Int      @default(0) @map("streak_count")
  createdAt      DateTime @default(now()) @map("created_at")

  progress     UserProgress[]
  srsCards     UserVocabSrs[]
  chatSessions ChatSession[]

  @@map("profiles")
}

// ... Course / CourseTranslation / Lesson / LessonTranslation / Vocabulary /
//     VocabularyTranslation / LessonVocabulary / Exercise / UserProgress
//     GIỮ NGUYÊN 100% như bản gốc (xem file 01 cũ nếu cần) — không đổi vì
//     không liên quan tới nhánh AI.

/// ============ NHÁNH MỚI: SPACED REPETITION / KNOWLEDGE TRACING ============

/// 1 "thẻ ôn tập" = 1 cặp (user, từ vựng). Model AI cập nhật recallProbability
/// và nextReviewAt sau mỗi lần gọi /v1/srs/schedule.
model UserVocabSrs {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @db.Uuid
  vocabularyId      String    @db.Uuid
  easeFactor        Float     @default(2.5)     // dùng làm fallback SM-2 khi model chưa có đủ dữ liệu
  intervalDays      Float     @default(1)
  recallProbability Float?                      // 0..1, do model AI dự đoán, null = chưa từng ôn
  nextReviewAt      DateTime  @default(now())
  lastReviewedAt    DateTime?
  reviewCount       Int       @default(0)
  lapseCount        Int       @default(0)        // số lần trả lời sai (dùng làm feature cho model)
  createdAt         DateTime  @default(now())

  user       Profile     @relation(fields: [userId], references: [id])
  vocabulary Vocabulary  @relation(fields: [vocabularyId], references: [id])
  logs       ReviewLog[]

  @@unique([userId, vocabularyId])
  @@index([userId, nextReviewAt])
  @@map("user_vocab_srs")
}

/// Nhật ký từng lần ôn — đây chính là "dữ liệu tương tác" nuôi model DKT/HLR.
/// Càng nhiều dòng ở bảng này, model càng dự đoán chính xác (thay dần dataset public).
model ReviewLog {
  id           String   @id @default(uuid()) @db.Uuid
  srsCardId    String   @db.Uuid
  isCorrect    Boolean
  responseMs   Int?                    // thời gian trả lời — feature cho model
  intervalDays Float                   // khoảng cách (ngày) kể từ lần ôn trước, tại thời điểm ôn này
  reviewedAt   DateTime @default(now())

  srsCard UserVocabSrs @relation(fields: [srsCardId], references: [id], onDelete: Cascade)

  @@index([srsCardId, reviewedAt])
  @@map("review_logs")
}

/// ============ NHÁNH MỚI: CHATBOT ROLEPLAY ============

model ChatScenario {
  id            String   @id @default(uuid()) @db.Uuid
  code          String   @unique              // "hotel_booking", "shopping"
  isPublished   Boolean  @default(true)
  systemPrompt  String                        // ngữ cảnh/persona đưa vào model khi sinh phản hồi
  createdAt     DateTime @default(now())

  translations ChatScenarioTranslation[]
  sessions     ChatSession[]

  @@map("chat_scenarios")
}

model ChatScenarioTranslation {
  scenarioId  String @db.Uuid
  uiLocale    String @db.VarChar(8)
  title       String                          // "Đặt phòng khách sạn"
  description String?

  scenario ChatScenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)

  @@id([scenarioId, uiLocale])
  @@map("chat_scenario_translations")
}

model ChatSession {
  id         String    @id @default(uuid()) @db.Uuid
  userId     String    @db.Uuid
  scenarioId String    @db.Uuid
  startedAt  DateTime  @default(now())
  endedAt    DateTime?

  user     Profile      @relation(fields: [userId], references: [id])
  scenario ChatScenario @relation(fields: [scenarioId], references: [id])
  messages ChatMessage[]

  @@map("chat_sessions")
}

model ChatMessage {
  id               String   @id @default(uuid()) @db.Uuid
  sessionId        String   @db.Uuid
  role             ChatRole
  content          String
  createdAt        DateTime @default(now())

  session ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId, createdAt])
  @@map("chat_messages")
}
```

> **Lưu ý khi nộp bài:** phần schema các bảng `Course/Lesson/Vocabulary/Exercise/UserProgress` giữ nguyên y hệt bản kế hoạch gốc — chỉ có khối "AI" là thay đổi. Khi viết `docs/erd.png` cuối cùng, xuất lại toàn bộ bằng `prisma-erd-generator` để đảm bảo khớp code.

#### SQL bổ sung (Prisma không sinh được — chạy tay 1 lần)

```sql
-- 1) Tự tạo profile khi user đăng ký (giữ nguyên bản gốc)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) RLS: user chỉ đọc/sửa dữ liệu của mình
alter table public.profiles       enable row level security;
alter table public.user_progress  enable row level security;
alter table public.user_vocab_srs enable row level security;
alter table public.review_logs    enable row level security;
alter table public.chat_sessions  enable row level security;
alter table public.chat_messages  enable row level security;

create policy "own profile"  on public.profiles      for all using (auth.uid() = id);
create policy "own progress" on public.user_progress  for all using (auth.uid() = user_id);

-- user CHỈ ĐƯỢC ĐỌC srs card/review log của mình. Ghi/sửa bắt buộc đi qua RPC
-- record_review() (security definer) — không cho INSERT/UPDATE trực tiếp từ client.
create policy "read own srs card" on public.user_vocab_srs
  for select using (auth.uid() = user_id);

create policy "read own review log" on public.review_logs
  for select using (exists (
    select 1 from public.user_vocab_srs s
    where s.id = srs_card_id and s.user_id = auth.uid()
  ));

create policy "own chat session" on public.chat_sessions for all using (auth.uid() = user_id);

create policy "own chat message" on public.chat_messages
  for all using (exists (
    select 1 from public.chat_sessions cs
    where cs.id = session_id and cs.user_id = auth.uid()
  ));

-- 3) Nội dung: ai đăng nhập cũng đọc được, chỉ ADMIN sửa (giữ nguyên bản gốc, áp cho cả chat_scenarios)
alter table public.courses        enable row level security;
alter table public.chat_scenarios enable row level security;

create policy "read published courses" on public.courses
  for select using (is_published = true);
create policy "admin write courses" on public.courses
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN'));

create policy "read published scenarios" on public.chat_scenarios
  for select using (is_published = true);
create policy "admin write scenarios" on public.chat_scenarios
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ADMIN'));
```

#### RPC hữu ích

```sql
-- Lấy danh sách từ "đến hạn ôn hôm nay" theo lịch đã lưu (dùng khi AI Server tạm chết → fallback)
create or replace function public.get_due_srs_cards(p_user_id uuid, p_limit int default 20)
returns table (srs_id uuid, vocabulary_id uuid, term text, next_review_at timestamptz, recall_probability float)
language sql stable as $$
  select s.id, v.id, v.term, s.next_review_at, s.recall_probability
  from user_vocab_srs s
  join vocabularies v on v.id = s.vocabulary_id
  where s.user_id = p_user_id and s.next_review_at <= now()
  order by coalesce(s.recall_probability, 0) asc, s.next_review_at asc
  limit p_limit;
$$;
```

Web Learner gọi: `POST /rest/v1/rpc/get_due_srs_cards` với body `{"p_user_id":"...","p_limit":20}` — dùng làm nguồn dữ liệu **fallback** khi AI Server không phản hồi kịp (xem `05`).

#### 1.3b. Tách rõ DKT/HLR khỏi Scheduler

**Vấn đề cần tránh:** để hội đồng hiểu nhầm rằng "DKT tự nhiên sinh ra `recommended_interval_days = 1.5`". DKT/HLR **chỉ** trả về một con số duy nhất: xác suất user còn nhớ đúng từ này ngay bây giờ (`recall_probability`, hay nói đúng bản chất Knowledge Tracing là `P(correct | history)`). Việc biến xác suất đó thành "bao lâu nữa nên ôn lại" là một **chính sách (policy)** riêng, độc lập với model:

```
review_logs (lịch sử)
        │
        ▼
┌─────────────────┐
│   DKT / HLR      │   → chỉ trả:  recall_probability ∈ [0,1]
└─────────────────┘
        │
        ▼
┌─────────────────┐
│    Scheduler     │   → nhận recall_probability + ease_factor hiện tại
│  (rule-based,    │      → suy ra: priority (REVIEW_NOW/TODAY/LATER)
│   không phải ML) │                recommended_interval_days
└─────────────────┘
```

Scheduler là code thuần (không train), ví dụ một biến thể SM-2 có trọng số theo `recall_probability`:
```python
def schedule(recall_probability: float, ease_factor: float, prev_interval: float) -> dict:
    if recall_probability < 0.5:
        priority, interval = "REVIEW_NOW", 1.0
    elif recall_probability < 0.75:
        priority, interval = "REVIEW_TODAY", max(1.0, prev_interval * 0.7)
    else:
        priority, interval = "REVIEW_LATER", prev_interval * ease_factor
    return {"priority": priority, "recommended_interval_days": round(interval, 1)}
```
Trong báo cáo ML, đây là ranh giới rõ ràng: **Ch3–Ch6 nói về DKT/HLR (có train, có metric)**; **Scheduler chỉ nhắc 1 đoạn ngắn ở Ch7 (Triển khai)** vì nó không phải nội dung học máy.

#### 1.3c. RPC `record_review` — tránh lệch dữ liệu giữa client và DB

**Vấn đề cần tránh:** nếu client tự tính `nextReviewAt`/`intervalDays` mới rồi gọi 2 lệnh ghi rời rạc (`INSERT review_logs`, `UPDATE user_vocab_srs`) qua PostgREST, có rủi ro 1 trong 2 lệnh thất bại giữa chừng (mất mạng, app bị kill) → dữ liệu lệch nhau. Giải pháp: gộp thành **1 RPC transaction** ở tầng Postgres:

```sql
create or replace function public.record_review(
  p_srs_card_id uuid,
  p_is_correct boolean,
  p_response_ms int,
  p_recall_probability float,      -- do AI Server trả về, client chỉ chuyển tiếp
  p_recommended_interval_days float
) returns void
language plpgsql security definer as $$
declare
  v_prev_interval float;
begin
  select interval_days into v_prev_interval from user_vocab_srs where id = p_srs_card_id;

  insert into review_logs (srs_card_id, is_correct, response_ms, interval_days)
  values (p_srs_card_id, p_is_correct, p_response_ms, coalesce(v_prev_interval, 1));

  update user_vocab_srs
  set recall_probability = p_recall_probability,
      interval_days      = p_recommended_interval_days,
      next_review_at     = now() + make_interval(days => p_recommended_interval_days),
      last_reviewed_at   = now(),
      review_count       = review_count + 1,
      lapse_count        = lapse_count + case when p_is_correct then 0 else 1 end
  where id = p_srs_card_id;
end; $$;
```

Luồng đúng:
```
Người học trả lời 1 thẻ
   │
   ├─ gọi FastAPI /v1/srs/schedule (nếu chưa có prediction mới cho thẻ này hôm nay)
   │      → nhận recall_probability + recommended_interval_days
   │
   └─ gọi POST /rest/v1/rpc/record_review  (Authorization: Bearer JWT, RLS tự giới hạn theo owner)
          → ghi review_logs + cập nhật user_vocab_srs trong CÙNG 1 transaction
```
Client **không** tự ý ghi trực tiếp vào `user_vocab_srs`/`review_logs` bằng `INSERT`/`UPDATE` PostgREST thô nữa — chỉ được gọi qua RPC này, giữ đúng nguyên tắc "không tin business logic ở client".

---

### 1.4. Hình dạng `Exercise.payload` theo `type`

Giữ nguyên bản gốc (không đổi vì không thuộc nhánh AI):

```jsonc
// MCQ
{ "question": "Choose the correct form", "options": ["go","goes","going"], "answerIndex": 1, "explanation": "..." }

// FILL_BLANK
{ "sentence": "She ___ to school every day.", "answers": ["goes"], "hint": "present simple" }

// REORDER
{ "tokens": ["I","am","a","student"], "correctOrder": [0,1,2,3] }

// MATCHING
{ "pairs": [ {"left":"apple","right":"quả táo"}, {"left":"book","right":"quyển sách"} ] }

// LISTENING
{ "audioUrl": "https://.../a1.mp3", "transcript": "I have an apple", "mode": "TYPE_WHAT_YOU_HEAR" }

// WRITING — bài luyện viết tự do trong bài học, KHÔNG gọi AI Server (khác với màn Chat riêng)
{ "prompt": "Write 3 sentences about your family.", "minWords": 20 }
```

> Màn "Luyện hội thoại" (Chatbot) là **màn hình riêng**, không nằm trong `Exercise` — nó thuộc luồng free-practice, gắn với `ChatScenario`.

---

## M0.5 approved logical data-model baseline

This is the canonical logical baseline approved by `ADR-002`. It documents intended semantics only; it is not a Prisma schema, SQL migration, RLS policy or RPC implementation.

### Core content entities

| Entity | Approved logical fields and constraints |
|---|---|
| `Language` | Existing fields remain. `code` is the key. `vi` and `en` are UI locales; `ja` is P2. `en` is initially learnable. |
| `Profile` | Existing fields remain. Add `timezone` as an IANA zone, default `Asia/Ho_Chi_Minh`, and optional `lastQualifyingActivityDate` for streak idempotency. `uiLocale` and `nativeLangCode` reference supported Language codes. |
| `Course` | `id` UUID key; `languageCode` FK; `cefr`; non-negative `orderIndex`; `isPublished`; `createdAt`; `updatedAt`. Initial course learned language is `en`. |
| `CourseTranslation` | `courseId`, `locale`, required `title`, optional `description`; composite key `(courseId, locale)`. |
| `Lesson` | `id` UUID key; `courseId` FK; non-negative `orderIndex`; `isPublished`; timestamps; unique `(courseId, orderIndex)`. |
| `LessonTranslation` | `lessonId`, `locale`, required `title`, optional `description`; composite key `(lessonId, locale)`. |
| `Vocabulary` | `id` UUID key; `languageCode` FK; required `term`; optional `phonetic`, `audioUrl`, `cefr`; timestamps. Exact term-uniqueness scope remains an explicit M1 schema decision and must not be assumed. |
| `VocabularyTranslation` | `vocabularyId`, `locale`, required `meaning`, optional `example`; composite key `(vocabularyId, locale)`. |
| `LessonVocabulary` | `lessonId`, `vocabularyId`, non-negative `orderIndex`; unique pair and unique ordering within a lesson. |
| `Exercise` | `id`, `lessonId`, `type`, `payload`, non-negative `orderIndex`; unique ordering within a lesson. Payload must validate against its type. Must types: `MCQ`, `FILL_BLANK`, `REORDER`. |
| `UserProgress` | `id`, `userId`, `lessonId`, `status`, optional `score`, optional `completedAt`, `updatedAt`; unique `(userId, lessonId)`. Exact score range and lesson-completion aggregation require an approved M1 task. |

Delete/cascade behavior for the newly completed core entities must be chosen in the M1 schema plan rather than inferred during implementation.

### Translation and publication rules

- UI and content locales are distinct.
- UI fallback: requested supported locale, otherwise `vi`.
- Content fallback: requested locale → supported learner native locale → `vi` → `en` → explicit unavailable state.
- A content translation inherits read visibility from its parent. Admin is the only content writer.
- At least the approved fallback translation required by the initial content-release plan must exist before publication; M1 must encode the exact validation point.

### Learner ownership and RLS requirements

| Resource | Learner | Admin | Anonymous |
|---|---|---|---|
| Published content/translations/scenarios | Read | CRUD | Deny |
| Draft content | Deny | CRUD | Deny |
| Profile | Own read/update of approved safe fields | Privileged support/role flow | Deny |
| UserProgress | Own read; trusted-flow result writes | Support read only when approved | Deny |
| UserVocabSrs | Own read; no direct mutation | No default direct mutation | Deny |
| ReviewLog | Own read; no direct mutation | Analytics/support only when approved | Deny |
| ChatSession/ChatMessage | Own session access | Support read only when approved | Deny |

Media is system/Admin-managed. Admin uploads/replaces/deletes; learners access only media attached to visible published content. Bucket/path naming is deferred, not the actor boundary.

> **M1.3 implementation status (ADR-005 SEC-D8 PA2):** Storage uses two private buckets with direct authenticated access governed by RLS. `lingora-avatars` stores owner-managed `profiles/{userId}/{filename}` images, allows JPEG/PNG/WebP, and enforces a 5,242,880-byte bucket limit. `lingora-media` stores ADMIN/service-managed `vocabulary/{vocabularyId}/{filename}` audio, allows MPEG/WAV, and enforces a 10,485,760-byte bucket limit; learner reads require reachability through published Course → Lesson → LessonVocabulary. Anonymous access, overwrite and unauthorized delete remain denied. M1.3 implements no signed-URL runtime or TTL guarantee.

### `record_review` authorization invariant

The RPC must:

1. Derive caller identity from `auth.uid()`.
2. Select `p_srs_card_id` only when the card belongs to that caller.
3. Reject a missing/non-owned card before inserting a ReviewLog or updating UserVocabSrs.
4. Never trust a caller-supplied user ID as authority.
5. Preserve the atomic log-and-schedule update.

### Streak semantics

- A qualifying day contains at least one completed lesson exercise session or recorded vocabulary review. App opening and roleplay-only activity do not qualify.
- Increment at most once on the first qualifying activity of a local calendar day.
- Yesterday → increment; today → unchanged; any older/no date → set current streak to `1`.
- Use the stored IANA timezone, initially `Asia/Ho_Chi_Minh` by default.
- Persist `lastQualifyingActivityDate`; a full history table is deferred.
- Qualifying writes must be idempotent.

### Grammar-score persistence

`ChatMessage` contains no grammar/naturalness score field in the canonical M1 baseline. The optional API-only P2 field is `grammatical_acceptability_score`.

### REORDER invariant

`correctOrder` is a complete permutation of token-instance indices. A submission is correct only when its complete index sequence exactly matches `correctOrder`. Missing, duplicate, negative or out-of-range indices are invalid. Duplicate token text remains distinguishable by instance/index. Alternate orders and normalization are deferred.

### Scope Gap Review data boundaries [HISTORICAL / SUPERSEDED by Phase-1 M2.1 Logical Target Schema]

> **Ghi chú phân định phiên bản kiến trúc & thứ bậc tài liệu (Architecture Precedence):**
> Phần ranh giới dữ liệu dưới đây là snapshot mang tính **lịch sử (Historical Baseline)** tại thời điểm Scope Gap Review ban đầu (trước khi hoàn thành thiết kế logic M2.1).
> Kể từ Milestone 2.1, tài liệu `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` là **CHUẨN CANONICAL** cho mô hình dữ liệu logic (Logical Target Schema bao gồm các thực thể `AssessmentResult`, `SkillProfile`, `Concept`, `ConceptMastery`, `KnowledgeGap`, `RemedialModule`, `LearningProgress`, `Cohort`, `SupportTicket`, v.v.). `Assessment` là conceptual mode của `Exercise` (D4), không phải persisted entity; không tồn tại entity `AssessmentSession`.
> Việc triển khai vật lý (Physical DB Schema/Migrations) của các thực thể này được phân kỳ thực hiện theo các mốc Phase 1 M2.x mà không mâu thuẫn với ranh giới M1.2 ban đầu dưới đây.

- The existing `Vocabulary`, `VocabularyTranslation`, `LessonVocabulary`, and `UserVocabSrs` structures are sufficient for the approved Vocabulary scope: published lesson vocabulary, optional audio playback, approved exercises, and SRS integration.
- No search/favorite, pronunciation-score, separate mastery, standalone flashcard, Grammar curriculum, Grammar progress, Quiz, QuizAttempt, notification preference, device-token, or reminder-schedule entity is approved in M1.2. ADR-006 (2026-08-15) does not weaken this list: it adds **zero** tables and **zero** columns to the M1.2 physical baseline. `GRAMMAR` and `LISTENING` are values of the existing `ExerciseType` enum on the existing `Exercise` table, and the approved reminder is client-local with its setting stored on-device, so every entity named above remains unapproved for M1.2 physical persistence.
- `Vocabulary.audioUrl` supports vocabulary media playback. ADR-006 adds word-level `LISTENING` to `ExerciseType`; a `LISTENING` payload references `vocabularyId` so that read authorization stays with the existing vocabulary-audio Storage policy. No new Storage path, bucket, or policy is introduced, and `audioUrl` alone still does not imply a scored exercise for a given row.
- “Quiz” is presentation/report terminology for the existing lesson exercise sequence only; canonical persistence remains `Exercise` plus lesson-level `UserProgress`, with attempt history deferred under ADR-003.
- `UserVocabSrs.nextReviewAt` represents due state. It is not a notification/reminder delivery record and does not authorize notification schema. The reminder approved by ADR-006 reads `Profile.dailyGoalMin` and `Profile.lastQualifyingActivityDate` on-device and still authorizes no notification schema, no device-token column, and no reminder-schedule table.
- Grammar content is an `Exercise` row with `type = 'GRAMMAR'` and a JSONB payload; no grammar table, grammar-progress column, or separate Grammar schema exists in M1.2. The optional NLP P2 `grammatical_acceptability_score` remains API-only and is not persisted.
- `Profile.dailyGoalMin` is the canonical daily study goal field for the scheduling capability approved by ADR-006. It already exists in the applied M1.2/M1.3 schema with a learner write grant and server-side non-negative validation, so that capability adds no column and no policy.

## M1.2 approved database semantics (ADR-003)

This section is normative for the first Prisma migration. It refines the M0.5 logical baseline without creating a Prisma schema, migration, SQL, RLS policy or RPC implementation.

### UserProgress aggregate

- `score` is a nullable integer percentage constrained to `0–100`.
- M1.2 stores only one lesson-level aggregate per `(userId, lessonId)`.
- Exercise completion detection and aggregate calculation belong to a trusted application/service layer until attempt history is separately approved.
- A trusted completion write updates `status`, `score`, `completedAt`, and `updatedAt` atomically and idempotently.
- No `ExerciseAttempt`, submission-history or implicit lesson-session table is part of M1.2.

### Approved FK deletion matrix

The implementation must verify every actual Prisma FK against this matrix before migration review.

| Parent → child relationship | Approved action |
|---|---|
| `Language → Course` | `RESTRICT` |
| `Language → Vocabulary` | `RESTRICT` |
| `Language → Profile.uiLocale` | `RESTRICT`; real FK to `Language.code` |
| `Language → Profile.nativeLangCode` | `RESTRICT`; real FK to `Language.code` |
| `Language → CourseTranslation.locale` | `RESTRICT`; real FK to `Language.code` |
| `Language → LessonTranslation.locale` | `RESTRICT`; real FK to `Language.code` |
| `Language → VocabularyTranslation.locale` | `RESTRICT`; real FK to `Language.code` |
| `Language → ChatScenarioTranslation.uiLocale` | `RESTRICT`; real FK to `Language.code` |
| `Course → CourseTranslation` | `CASCADE` |
| `Course → Lesson` | `RESTRICT`; prefer unpublish/archive for published or referenced content |
| `Lesson → LessonTranslation` | `CASCADE` when Lesson deletion is permitted |
| `Lesson → Exercise` | `CASCADE` when unpublished/unreferenced Lesson deletion is permitted |
| `Lesson → LessonVocabulary` | `CASCADE` when Lesson deletion is permitted |
| `Vocabulary → VocabularyTranslation` | `CASCADE` when Vocabulary deletion is permitted |
| `Vocabulary → LessonVocabulary` | `RESTRICT` while linked |
| `Lesson → UserProgress` | `RESTRICT` |
| `Profile/Auth user → UserProgress` | explicit account-deletion workflow |
| `Vocabulary → UserVocabSrs` | `RESTRICT` |
| `Profile/Auth user → UserVocabSrs` | explicit account-deletion workflow |
| `UserVocabSrs → ReviewLog` | `RESTRICT` for normal operations |
| `Profile/Auth user → ReviewLog` | explicit account-deletion workflow |
| `ChatScenario → ChatSession` | `RESTRICT`; prefer unpublish/archive |
| `ChatScenario → ChatScenarioTranslation` | `CASCADE` |
| `Profile/Auth user → ChatSession` | explicit account-deletion workflow |
| `ChatSession → ChatMessage` | `CASCADE` only through owner-authorized session/account deletion |
| `Profile/Auth user → ChatMessage` | explicit account-deletion workflow |

Normal content deletion must not remove `UserProgress`, `UserVocabSrs`, or `ReviewLog`.

### Vocabulary identity

- Preserve `term` as display spelling.
- Use deterministic `normalizedTerm` consistently in Admin validation, deterministic seed and trusted application writes.
- Unique identity is `(languageCode, normalizedTerm)`.
- M1.2 does not add alias, sense, lemma, synonym or morphology tables and does not prescribe an over-engineered normalization algorithm.

### Publication validation

- Draft content may be incomplete.
- Course/Lesson publication requires at least one complete translation in `vi` or `en`.
- A Lesson may publish only when its Course is published and its required Exercise payloads are valid.
- Vocabulary used by a published Lesson must have a usable `vi` or `en` meaning under the approved fallback chain.
- Publication validation runs through a trusted server/Admin transaction or database function, not UI-only checks.

### Exercise payload validation

- Keep one `Exercise` table with `type` and versioned JSONB `payload` for `MCQ`, `FILL_BLANK`, and `REORDER` only.
- Trusted application/server validation owns full type-specific semantics.
- Database checks cover practical universal shape/type invariants where feasible.
- Learners cannot write Exercise payloads directly.

### ReviewLog persistence boundary

- Keep canonical review identity, ownership/card relationship, outcome and timestamps required by the SRS flow.
- API response fields such as `model_version` and `is_mock` do not automatically require ReviewLog persistence.
- `responseTimeMs`, scheduler/model provenance and other ML-evaluation metadata remain deferred unless a later canonical persistence requirement is approved.
- Do not store full model input/output, grammar score, or create an ML-specific schema/table in M1.2.

### Chat ordering and retention

- `ChatMessage.sequenceNumber` is a positive integer allocated by a trusted session write path.
- `(sessionId, sequenceNumber)` is unique and is the deterministic dialogue order.
- Authorization derives through the owned ChatSession.
- ChatSession deletion may cascade messages only through an owner-authorized session/account-deletion workflow.
- Referenced ChatScenario rows are restricted from hard deletion; unpublish/archive is preferred.

### ADMIN role

- Profile role is the database-controlled enum `LEARNER | ADMIN`, default `LEARNER`.
- Clients cannot update roles. Only a privileged server/service-role workflow may change them.
- M1 does not introduce generalized roles/permissions tables.

### Initial index candidates

The following approved candidates must be checked against actual queries and requirement paths before migration:

- unique `(courseId, orderIndex)` on Lesson;
- unique `(lessonId, orderIndex)` on Exercise;
- unique `(lessonId, vocabularyId)` and `(lessonId, orderIndex)` on LessonVocabulary;
- unique `(languageCode, normalizedTerm)` on Vocabulary;
- unique `(userId, lessonId)` on UserProgress;
- unique `(userId, vocabularyId)` plus index `(userId, nextReviewAt)` on UserVocabSrs;
- index `(srsCardId, reviewedAt)` on ReviewLog;
- index `(userId, updatedAt)` on ChatSession;
- unique `(sessionId, sequenceNumber)` on ChatMessage.

No speculative analytics, full-text or partition indexes are approved for M1.2.

### Supabase / Prisma connection

- Supabase PostgreSQL in `ap-southeast-1` is the canonical online database.
- Prisma uses Shared Pooler / Session mode on port `5432` through private `DATABASE_URL`.
- Direct IPv6 and Dedicated IPv4 are not used; `DIRECT_URL` remains unset.
- Pooler compatibility and generated migration SQL must be reviewed before the first migration is applied.

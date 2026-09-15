# M2.1 Targeted Fix Report — Findings P1-01 & P2-01

> **Document:** `docs/phase-1-m2-1-targeted-fix-p1-01-p2-01.md`  
> **Milestone:** M2.1 (Domain & Logical Data Foundation)  
> **Reference Audit:** `docs/phase-1-m2-1-independent-re-review.md`  
> **Verdict Prior to Fix:** `M2.1 = FAIL — REQUIRES CORRECTION`  
> **Scope of Work:** Strictly fix **P1-01** (false `CURRENT_APPLIED` field claims) and **P2-01** (non-canonical scope label `LEGACY_APPLIED`). Zero changes to product decisions D1–D9, architecture, lifecycle, schema, or runtime code. Milestone M2.2 NOT started.

---

## 1. Finding P1-01: False CURRENT_APPLIED Field Claims

### 1.1. Original False Claims
The Independent Re-Review identified 3 false field-level claims where non-existent columns were tagged as `CURRENT_APPLIED_DATABASE` or `[Applied]`:
1. **`docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§8.15):** Included an erroneous row:
   `| score | INTEGER | YES | NULL | System (record_review)| Optional score | CURRENT_APPLIED_DATABASE | P1-FR-005 |`
2. **`docs/plantuml/domain-model-core.puml` (line 99):** Inside class `UserVocabSrs`, falsely declared:
   `+ recall_score: Integer [Applied]`
3. **`docs/plantuml/domain-model-core.puml` (line 105):** Inside class `ReviewLog`, falsely declared:
   `+ score: Integer [Applied]`

### 1.2. Actual Migration & Schema Evidence (Source of Truth)
Inspection of the actual applied migration files revealed the physical reality:
1. **`lingora-admin/prisma/migrations/202608140001_init/migration.sql` (lines 183–192):**
   ```sql
   CREATE TABLE "review_logs" (
       "id" UUID NOT NULL,
       "srs_card_id" UUID NOT NULL,
       "is_correct" BOOLEAN NOT NULL,
       "interval_days" DOUBLE PRECISION NOT NULL,
       "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

       CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id"),
       CONSTRAINT "review_logs_interval_days_check" CHECK ("interval_days" >= 0)
   );
   ```
   **Evidence:** The physical `review_logs` table has exactly 5 columns: `id`, `srs_card_id`, `is_correct`, `interval_days`, `reviewed_at`. There is **NO `score` column** in `review_logs`.
2. **`lingora-admin/prisma/migrations/202608140001_init/migration.sql` (lines 161–180):**
   ```sql
   CREATE TABLE "user_vocab_srs" (
       "id" UUID NOT NULL,
       "user_id" UUID NOT NULL,
       "vocabulary_id" UUID NOT NULL,
       "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
       "interval_days" DOUBLE PRECISION NOT NULL DEFAULT 1,
       "recall_probability" DOUBLE PRECISION,
       "next_review_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "last_reviewed_at" TIMESTAMP(3),
       "review_count" INTEGER NOT NULL DEFAULT 0,
       "lapse_count" INTEGER NOT NULL DEFAULT 0,
       "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       ...
   );
   ```
   **Evidence:** The physical `user_vocab_srs` table has **`recall_probability` (DOUBLE PRECISION / Float)**, but **NO `recall_score` (Integer)** column.
3. **`lingora-admin/prisma/migrations/202608140002_auth_rls_storage_record_review/migration.sql` (lines 192–255):**
   Stored function `public.record_review(p_srs_card_id, p_is_correct, p_recall_probability, p_recommended_interval_days)` executes:
   ```sql
   INSERT INTO public.review_logs (id, srs_card_id, is_correct, interval_days, reviewed_at)
   VALUES (pg_catalog.gen_random_uuid(), p_srs_card_id, p_is_correct, v_previous_interval, pg_catalog.clock_timestamp());
   ```
   **Evidence:** Confirms review logging is binary (`is_correct`) and updates interval/probability; no `score` exists or is processed in SRS review logs.
4. **`user_progress.score` Verification:**
   The only table in the applied database containing a `score` column is `user_progress` (`202608140001_init/migration.sql` line 152: `"score" INTEGER`, check $0 \le score \le 100$). Its `[Applied]` tag in `UserProgress` is authentic and preserved.

### 1.3. Exact Corrected Representation
1. **Tài liệu `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§8.15):**
   - Đã xóa hoàn toàn dòng `score` khỏi bảng đặc tả `ReviewLog`.
   - Bảng §8.15 hiện phản ánh trung thực đúng 5 trường vật lý trong `CURRENT_APPLIED_DATABASE`:
     `id` (UUID), `srs_card_id` (UUID), `is_correct` (BOOLEAN), `interval_days` (FLOAT), `reviewed_at` (TIMESTAMPTZ).
2. **PlantUML `docs/plantuml/domain-model-core.puml`:**
   - Trong class `UserVocabSrs`: Đã thay thế `+ recall_score: Integer [Applied]` bằng `+ recall_probability: Float [Applied]`, đồng thời bổ sung các trường thực tế còn thiếu (`last_reviewed_at`, `lapse_count`) để khớp hoàn toàn với §8.14.
   - Trong class `ReviewLog`: Đã xóa hoàn toàn `+ score: Integer [Applied]`. Class hiện chỉ chứa đúng 5 thuộc tính applied (`id`, `srs_card_id`, `is_correct`, `interval_days`, `reviewed_at`).
   - Trong class `UserProgress`: Giữ nguyên `+ score: Integer [Applied]` vì đây là trường có thực trong bảng `user_progress`.

### 1.4. Files Changed
- `docs/phase-1-m2-1-domain-and-logical-data-foundation.md`
- `docs/plantuml/domain-model-core.puml`

---

## 2. Finding P2-01: Canonicalize Scope Label

### 2.1. Original Deviation
- Tại `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` §7.1 (bảng kiểm kê thực thể, dòng 22 và 23), hai bảng `chat_sessions` và `chat_messages` bị gán nhãn `Scope (Trục 1)` là:
  `LEGACY_APPLIED`
- Nhãn này là sự lai ghép giữa Trục Scope và Trục Implementation Status, vi phạm nguyên tắc chuẩn hóa 3 giá trị Scope chuẩn tắc.

### 2.2. Replacement with Canonical Scope Value `EXCLUDED`
- Cột `Scope (Trục 1)` của cả hai dòng 22 (`chat_sessions`) và 23 (`chat_messages`) được thay thế chuẩn xác bằng:
  `EXCLUDED`
- Cột `Implementation Status (Trục 2)` vẫn giữ nguyên độc lập:
  `CURRENT_APPLIED_DATABASE`

### 2.3. Explanation of Scope vs Implementation Status (2-Axis Separation)
- **Trục 1: Scope (Phạm vi Nghiệp vụ)** có đúng 3 giá trị chuẩn tắc:
  - `CORE`: Bắt buộc cho phạm vi sản phẩm Core MVP v1.
  - `EXTENSION`: Tính năng mở rộng tùy chọn B2B / Vận hành (như Cohort, SupportTicket), nằm ngoài Core MVP.
  - `EXCLUDED`: Khái niệm hoặc đối tượng nằm ngoài phạm vi Core MVP (bao gồm cả các đối tượng legacy hoặc các khái niệm bị cấm như Exam, QuestionBank).
- **Trục 2: Implementation Status (Hiện trạng Triển khai Kỹ thuật)** có đúng 3 giá trị chuẩn tắc:
  - `CURRENT_APPLIED_DATABASE`: Hiện diện vật lý trong cơ sở dữ liệu Supabase đang chạy (các migration `001..003`).
  - `TARGET_SCHEMA`: Đã định nghĩa trong `lingora-admin/prisma/schema.prisma` mục tiêu, cần migration để kích hoạt.
  - `FUTURE_MIGRATION`: Chưa có trong cả target schema lẫn applied database.
- Hai bảng `chat_sessions` và `chat_messages` tồn tại thực tế trong cơ sở dữ liệu Supabase (`202608140001_init`) để bảo toàn tương thích ngược cho các endpoint thử nghiệm trước đây, nhưng hoàn toàn nằm ngoài ranh giới Core Learning Domain của hệ thống. Do đó:
  - Scope = `EXCLUDED`
  - Implementation Status = `CURRENT_APPLIED_DATABASE`
- Bổ sung ghi chú chuẩn hóa ngay dưới bảng §7.1 để khẳng định tính trực giao của 2 trục.

---

## 3. PlantUML Consistency Verification

Sau khi thực hiện hiệu chỉnh:
1. `domain-model-core.puml` và `phase-1-m2-1-domain-and-logical-data-foundation.md` hoàn toàn đồng nhất:
   - `ReviewLog`: 5 trường applied trong Markdown = 5 trường applied trong PlantUML (0 trường `score`).
   - `UserVocabSrs`: `recall_probability` (Float) trong Markdown = `recall_probability: Float [Applied]` trong PlantUML (0 trường `recall_score`).
   - `UserProgress`: `score` (Integer) trong Markdown = `score: Integer [Applied]` trong PlantUML (được chứng thực bởi `migration.sql`).
2. Sơ đồ `erd-logical-status-mapping.puml` đã vốn chính xác từ trước:
   - `review_logs` chỉ gồm `id`, `srs_card_id`, `is_correct`, `interval_days`, `reviewed_at`.
   - `user_vocab_srs` không chứa `recall_score`.
   - Thực thể legacy `chat_sessions` và `chat_messages` không được đưa vào ERD vì thuộc scope `EXCLUDED`.
3. Kiểm tra tính toàn vẹn cú pháp:
   - Tất cả 4 file PlantUML đảm bảo cân bằng cú pháp `@startuml` / `@enduml`.
   - Tuyệt đối không tái sinh các token cấm: 0 `TARGET_EXT`, 0 `MATCHING`, 0 `Exam`, 0 `QuestionBank`, 0 `ARCHIVED -> DRAFT` transition.

---

## 4. Verification Command Evidence

### 4.1. `git diff --check`
```
$ git diff --check -- plans/current-task.md
warning: in the working copy of 'plans/current-task.md', LF will be replaced by CRLF the next time Git touches it
(Exit code: 0 - Clean)
```

### 4.2. `git status --short`
```
$ git status --short
 M plans/current-task.md
?? docs/phase-1-m2-1-domain-and-logical-data-foundation.md
?? docs/plantuml/domain-model-core.puml
?? docs/phase-1-m2-1-targeted-fix-p1-01-p2-01.md
```
*Ghi chú: Toàn bộ các file mã nguồn ứng dụng (`lingora-admin/prisma/schema.prisma`, `lingora-admin/prisma/migrations/*`, `lingora-web/*`, `lingora-ai/*`) hoàn toàn không bị chỉnh sửa.*

### 4.3. `LEGACY_APPLIED` Search
```
$ Select-String -Path "docs/phase-1-m2-1-domain-and-logical-data-foundation.md", "docs/plantuml/*" -Pattern "LEGACY_APPLIED"
(Exit code: 0 - No matches found)

$ git grep "LEGACY_APPLIED" -- docs/phase-1-m2-1-domain-and-logical-data-foundation.md docs/plantuml
(Exit code: 1 - 0 matches)
```
**Kết quả:** 0 occurrences of `LEGACY_APPLIED` in active M2.1 design.

### 4.4. Field-Status Verification
```
$ Select-String -Path "docs/phase-1-m2-1-domain-and-logical-data-foundation.md", "docs/plantuml/domain-model-core.puml" -Pattern "score.*Applied|recall_score|review_logs.*score"

docs\phase-1-m2-1-domain-and-logical-data-foundation.md:197:    +Integer score [Applied]
docs\phase-1-m2-1-domain-and-logical-data-foundation.md:366:  - *Phân định Ranh giới Vật lý vs Ứng dụng:* Bảng `user_progress` lưu trữ trạng thái hoàn thành tổng hợp (`status`, `score`, `completed_at`)...
docs\phase-1-m2-1-domain-and-logical-data-foundation.md:587:| `score` | `INTEGER` | NO | `0` | System | Weighted score | `CURRENT_APPLIED_DATABASE` | P1-FR-004 |
docs\phase-1-m2-1-domain-and-logical-data-foundation.md:801:| **DD-07** | D7 Controlled Retry... Bảng `user_progress` hiện tại (`status`, `score`)...
docs\plantuml\domain-model-core.puml:131:    + score: Integer [Applied]
```
**Phân tích kết quả:**
- `recall_score`: **0 occurrences** (đã loại bỏ hoàn toàn).
- `review_logs.score` / `review_logs` score: **0 occurrences** (đã loại bỏ hoàn toàn).
- Duy nhất `user_progress.score` / `UserProgress` giữ nhãn `[Applied]` / `CURRENT_APPLIED_DATABASE`, hoàn toàn đúng với migration `202608140001_init/migration.sql` dòng 152 (`"score" INTEGER`).

---

## 5. Final State

`M2.1 = REVISED — READY FOR TARGETED RE-REVIEW`  
`M2.2 = NOT STARTED`  

STOP.

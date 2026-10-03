# M2.1 INDEPENDENT RE-REVIEW — DOMAIN & LOGICAL DATA FOUNDATION

> **Vai trò:** Independent re-review, không self-approval.
> **Phạm vi:** Chỉ đối soát M2.1 sau bản sửa; không sửa artifact nguồn trong lúc review; không bắt đầu M2.2.
> **Evidence rule:** Mọi kết luận dưới đây dựa trên file và command output đọc trực tiếp trong repository.

## Executive Verdict

**FAIL — M2.1 REQUIRES FIX**

Review không đạt hard gate vì còn các P0/P1 findings:

1. Tiêu chí yêu cầu nêu emergency publish `IN_REVIEW -> PUBLISHED`, nhưng M2.1 và PlantUML chỉ mô hình hóa `APPROVED -> PUBLISHED`.
2. Data Dictionary/PlantUML vẫn có các claim `CURRENT_APPLIED_DATABASE` không khớp migration thực tế và claim bao phủ 100% trường nhưng còn thiếu nhiều cột.
3. `TARGET_EXT` còn 5 occurrences và `MATCHING` còn 6 occurrences trong M2.1 Markdown, trái với yêu cầu literal zero-occurrence.
4. `CORE (Supporting)` được dùng như giá trị Scope, trái với tập canonical `{CORE, EXTENSION, EXCLUDED}`.

Không có thay đổi nào đối với M2.1 Markdown, bốn PlantUML nguồn, schema, migration, Supabase, web hoặc AI code trong review này. Chỉ báo cáo review được cập nhật sau khi hoàn tất kiểm tra.

## Finding Matrix

| ID | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| P0-01 | P0 | Emergency publish theo tiêu chí review phải có `IN_REVIEW -> PUBLISHED`; artifact chỉ có `APPROVED -> PUBLISHED`. | M2.1 `§5.2` lines 273-275; `content-lifecycle-state.puml:38`; baseline `phase-0-roles-and-mvp-final.md:64` cũng ghi `Approved -> Published` (emergency Admin). | **FAIL against requested gate; baseline inconsistency requires clarification/fix** |
| P1-01 | P1 | Applied claims không trung thực: `lessons.objective`, `vocabularies.audio_path`, `exercises.created_at`, `exercises.updated_at`, `user_progress.created_at` được ghi là applied nhưng không có trong applied migration. | M2.1 lines 502, 529-530, 548, 589; `domain-model-core.puml:55,83`; migration `202608140001_init`: lessons lines 75-85, exercises 133-144, user_progress 147-158, vocabularies 98-110. | **FAIL** |
| P1-02 | P1 | Data Dictionary tuyên bố bao phủ 100% nhưng bỏ sót các cột applied thực tế: `profiles.ui_locale`, `native_lang_code`, `timezone`, `last_qualifying_activity_date`; `vocabularies.normalized_term`, `phonetic`, `audio_url`, `created_at`, `updated_at`; `chat_scenarios.is_published`, `created_at`. | Claim 100% tại M2.1 lines 430, 742; dictionary lines 565-578, 542-549, 627-633; migration lines 31-48, 98-110, 195-203. | **FAIL** |
| P1-03 | P1 | Forbidden-token zero check không đạt: `TARGET_EXT=5`, `MATCHING=6` trong M2.1 Markdown. Các occurrences nằm trong câu phủ định/“đã loại bỏ”, nhưng yêu cầu re-review đặt `0 occurrences` và command check sẽ bắt chúng. | Fresh command `Select-String` trên M2.1 + PlantUML: `TARGET_EXT=5`, `MATCHING=6`; M2.1 lines 124, 540, 738-740, 757, 779, 880, 882. | **FAIL** |
| P1-04 | P1 | `CORE (Supporting)` là hybrid Scope label, không thuộc canonical Scope `{CORE, EXTENSION, EXCLUDED}`. | M2.1 lines 418-419, 627, 634; `erd-logical-status-mapping.puml:222,231`. | **FAIL** |
| P1-05 | P1 | D-G1 traceability table không bao phủ toàn bộ core/supporting entities được inventory: `Language`, các translation tables và `ChatScenario`/`ChatScenarioTranslation` không có dòng mapping FR/UC/BF tương ứng trong §4.3. | Core inventory M2.1 lines 117-130 và §7.1 lines 402-419; trace table §4.3 lines 224-236 chỉ có 13 dòng logic, không có các thực thể trên. | **FAIL** |
| P2-01 | P2 | PlantUML ERD không liệt kê đầy đủ các trường đã có trong Data Dictionary của `user_vocab_srs`, `vocabularies` và `chat_scenarios`; ngoài các false claims ở P1-01, đây là rủi ro drift khi triển khai. | `domain-model-core.puml:91-110`; `erd-logical-status-mapping.puml:123-178`; đối chiếu M2.1 §8.9, §8.14, §8.17 và migration. | **OPEN** |

## D-G1

**Input:** M2.1 artifacts §§4-6, bốn PlantUML, `docs/02-requirements.md`, `docs/05-traceability-matrix.md`, `docs/09-placement-and-jump-specification.md`, role baseline và product-owner decision sheet.

**Validation method:** Đọc trực tiếp các bảng traceability, state matrix, prohibition matrix, progression rules và baseline role authority; kiểm tra từng dòng theo yêu cầu review.

| Item | Evidence | Result |
|---|---|---|
| Core entities → FR/UC/BF | M2.1 §4.1 và §7.1 liệt kê `Language`, translations và chat supporting entities; §4.3 lines 224-236 không map đầy đủ chúng. | **FAIL — P1-05** |
| Lifecycle states → FR/UC/BF | M2.1 §5.2 lines 268-278; PlantUML lifecycle lines 17-50; các state/normal flow hiện diện. | PASS, nhưng P0-01 còn unresolved |
| Admin emergency authority | M2.1 lines 251-257, 275-277; PlantUML lines 35-45; normal publish là Manager, emergency có justification + AuditLog. | **FAIL against requested `IN_REVIEW -> PUBLISHED`; baseline itself says `APPROVED -> PUBLISHED`** |
| Separation of duties | M2.1 §5.3 lines 287-294; Creator self-approve/publish, Moderator publish, Admin normal publish và direct edit published đều bị cấm. | PASS |
| No archived→draft Core | M2.1 lines 280-294; PlantUML không có transition edge từ `ARCHIVED` tới `DRAFT`; occurrences chỉ là prohibition/boundary text. | PASS |

**D-G1 Verdict: FAIL.** P0-01 và P1-05 ngăn PASS.

## D-G2

**Input:** M2.1 §7.1 và §§8.1-8.19, `schema.prisma`, applied migrations `202608140001_init` và `202608140002_auth_rls_storage_record_review`.

**Validation method:** Đối chiếu từng applied field và enum với DDL; kiểm tra độc lập hai trục Scope/Implementation Status; kiểm tra candidate fields; chạy forbidden-token searches.

**Evidence:**

- Applied `ExerciseType` trong migration chỉ là `MCQ`, `FILL_BLANK`, `REORDER` (`migration.sql:11`); schema target có thêm `LISTENING`, `GRAMMAR` (`schema.prisma:43-47`).
- `review_logs` thực tế chỉ có 5 cột (`migration.sql:183-192`); `user_vocab_srs` có `recall_probability`, không có `recall_score` (`161-180`). Các claim cũ về SRS score đã được loại bỏ.
- Tuy nhiên các false applied claims và omissions trong P1-01/P1-02 vẫn tồn tại.
- Scope canonical bị phá bởi `CORE (Supporting)`; implementation statuses canonical vẫn quan sát được là `CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`.
- Fresh forbidden search trên M2.1 + PlantUML: `TARGET_EXT=5`, `MATCHING=6`; trên bốn PlantUML riêng lẻ, hai token này bằng 0.

**D-G2 Verdict: FAIL.** P1-01, P1-02, P1-03 và P1-04 đều ảnh hưởng truthfulness/boundary integrity.

## Scope Check

Fresh command results trước khi cập nhật báo cáo:

```text
git status --short --untracked-files=all
<no changed paths; only pre-existing Git directory warnings>

git diff --check
exit code 0
```

Không phát hiện thay đổi ngoài phạm vi review trong:

- `lingora-admin/prisma/schema.prisma`
- `lingora-admin/prisma/migrations/*`
- `lingora-web/*`
- `lingora-ai/*`
- remote Supabase

Sau review, file duy nhất được cập nhật là báo cáo này: `docs/phase-1-m2-1-independent-re-review.md`.

## PlantUML Check

| File | Static syntax | Forbidden-token search | Semantic consistency | Renderer |
|---|---|---|---|---|
| `domain-model-core.puml` | PASS: 1 `@startuml`, 1 `@enduml` | `TARGET_EXT`/`MATCHING`/`Exam`/`QuestionBank`: 0; không có archived→draft edge | **FAIL** do `Lesson.objective` và `Vocabulary.audio_path` gắn `[Applied]` nhưng migration không có các cột đó | `java` và `plantuml` unavailable; static only |
| `content-lifecycle-state.puml` | PASS: 1/1 | Không có forbidden model token; archived→draft chỉ xuất hiện trong prohibition note | **PARTIAL**: normal/emergency semantics nhất quán với M2.1; không có `IN_REVIEW -> PUBLISHED` như tiêu chí review | `java` và `plantuml` unavailable; static only |
| `learning-progression-model.puml` | PASS: 1/1 | Không phát hiện forbidden model token | PASS cho Mapping A, retry tổng quát và không có archived→draft edge | `java` và `plantuml` unavailable; static only |
| `erd-logical-status-mapping.puml` | PASS: 1/1 | `TARGET_EXT`/`MATCHING`/`Exam`/`QuestionBank`: 0; không có archived→draft edge | **FAIL** do `CORE (Supporting)` và thiếu/không khớp field coverage với dictionary | `java` và `plantuml` unavailable; static only |

Kết luận renderer: **STATIC SYNTAX CHECK PASS — RENDERER UNAVAILABLE**. Không tuyên bố render/compile PASS.

## Remaining Risks

1. M2.1 chưa thể được phê duyệt trước khi chốt semantics emergency publish (`IN_REVIEW` theo yêu cầu review hay `APPROVED` theo baseline) và cập nhật đồng bộ Markdown/PlantUML.
2. Data Dictionary cần đối soát lại toàn bộ applied fields với migration, không chỉ ba field SRS đã sửa trước đó.
3. Phải loại bỏ literal `TARGET_EXT` và `MATCHING` khỏi artifact nếu acceptance criterion thực sự yêu cầu zero occurrences.
4. Phải chuẩn hóa `CORE (Supporting)` thành một Scope canonical và biểu diễn “supporting capability” ở cột ghi chú/khác, không ở giá trị Scope.

## Handoff State

**M2.1 — REQUIRES FIX**

**M2.2 — NOT STARTED**

STOP. Không bắt đầu M2.2, không thiết kế API/deployment, không migration, không schema change và không application code.

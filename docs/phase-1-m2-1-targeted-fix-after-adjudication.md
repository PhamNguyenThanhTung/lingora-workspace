# M2.1 — TARGETED FIX AFTER FINDING ADJUDICATION

## 1. Adjudicated Findings

Adjudication đã loại P0-01 vì review criterion mâu thuẫn với approved baseline. Không thay đổi lifecycle semantics; baseline vẫn là:

Draft → In Review → Changes Requested → Approved → Published → Archived

Normal và emergency publication đều bắt đầu từ APPROVED; emergency Administrator bắt buộc có emergency condition, reason/justification và AuditLog.

Các findings được sửa trong task:

- P1-01: false CURRENT_APPLIED_DATABASE field claims.
- P1-02: unsupported 100% Data Dictionary coverage.
- P1-04: non-canonical CORE (Supporting) Scope value.
- P1-05: incomplete FR/UC/BF traceability.
- P2-01: PlantUML field drift.
- P1-03: literal token hygiene.

P0-01 không được sửa theo hướng IN_REVIEW → PUBLISHED.

## 2. P1-01 Correction

Physical truth được lấy từ migration 202608140001_init:

- lessons.objective không tồn tại trong Applied DB; M2.1 đã hạ field này về TARGET_SCHEMA.
- vocabularies.audio_path không tồn tại; M2.1 đã thay bằng applied vocabularies.audio_url.
- exercises.created_at và exercises.updated_at không tồn tại trong applied migration; hai dòng đã bị loại khỏi Applied Data Dictionary.
- user_progress.created_at không tồn tại; dòng đã bị loại.
- user_progress.score được sửa thành nullable với default NULL, khớp migration.
- Domain PlantUML không còn đánh dấu các field không tồn tại là Applied.

Không sửa Prisma schema hoặc migration.

## 3. P1-02 Correction

Data Dictionary đã được reconcile với applied migration cho toàn bộ các bảng được M2.1 phân loại CURRENT_APPLIED_DATABASE.

Bổ sung:

- profiles: ui_locale, native_lang_code, timezone, last_qualifying_activity_date.
- vocabularies: normalized_term, phonetic, audio_url, cefr, created_at, updated_at.
- chat_scenarios: is_published, created_at.

Các bảng applied khác được kiểm tra lại gồm languages, courses, course_translations, lessons, lesson_translations, exercises, lesson_vocabulary, vocabulary_translations, user_progress, user_vocab_srs, review_logs và chat_scenario_translations.

Claim cũ về coverage đã được đổi thành trạng thái đã correction và pending independent re-review; không tự claim gate PASS.

## 4. P1-04 Correction

Scope axis hiện chỉ dùng:

- CORE
- EXTENSION
- EXCLUDED

CORE (Supporting) đã được loại khỏi M2.1 Markdown và ERD PlantUML. “Supporting capability” chỉ còn ở explanatory note; Implementation Status vẫn tách riêng thành CURRENT_APPLIED_DATABASE, TARGET_SCHEMA và FUTURE_MIGRATION.

## 5. P1-05 Correction

§4.3 đã bổ sung traceability rows cho:

- Language
- CourseTranslation
- UnitTranslation
- LessonTranslation
- VocabularyTranslation
- ChatScenario
- ChatScenarioTranslation

Chỉ dùng source IDs đã tồn tại trong baseline. Với Scenario Writing, tài liệu ghi rõ baseline không cấp UC/BF code riêng thay vì tự bịa ID. Scope của các supporting entities vẫn là CORE theo taxonomy canonical.

## 6. P2-01 Correction

PlantUML đã đồng bộ với Data Dictionary và migration:

- domain-model-core.puml: objective được đánh dấu Target Schema; Vocabulary dùng normalized_term, phonetic, audio_url, cefr, created_at, updated_at; SRS bổ sung created_at; Profile, Language, Exercise, LessonVocabulary và UserProgress được bổ sung applied fields còn thiếu.
- erd-logical-status-mapping.puml: sửa vocabulary field name/status, bổ sung applied fields cho Profile, Lesson, Exercise, UserProgress, UserVocabSrs và ChatScenario; Scope của chat entities là CORE.

Không có field nào được đánh dấu Applied nếu không tồn tại trong applied migration.

## 7. P1-03 Literal Cleanup

Đã viết lại explanatory text trong M2.1 Markdown để các literal token bị loại bỏ không còn xuất hiện:

- TARGET_EXT: 0 occurrences trong M2.1 Markdown + bốn PlantUML.
- MATCHING: 0 occurrences trong M2.1 Markdown + bốn PlantUML.
- CORE (Supporting): 0 occurrences trong M2.1 Markdown + bốn PlantUML.

ExerciseType semantics không thay đổi:

- Applied: MCQ, FILL_BLANK, REORDER.
- Target/Future: LISTENING, GRAMMAR.

Exam và QuestionBank chỉ còn các câu cấm/loại trừ trong M2.1 Markdown; không có entity/class active trong PlantUML. ARCHIVED -> DRAFT chỉ còn boundary/prohibition prose; không có active transition edge trong state machine.

## 8. Regression Checks

Đã giữ nguyên:

- D1/D2/D3 separation of duties.
- Normal publication bởi Organizational Manager.
- Emergency Administrator publication/archive chỉ từ approved/published boundary, có reason/justification và AuditLog.
- Không có Admin normal publication hoặc Admin IN_REVIEW bypass.
- D3 clone-to-draft và không sửa published in-place.
- Placement Mapping A.
- D7 two-pass retry và 70% retry credit.
- D8 Policy B.
- D9 local-timezone streak.
- Không có Exam/QuestionBank entity.
- M2.2 chưa bắt đầu.

## 9. Verification Evidence

Fresh commands và observed results:

- Applied-column inventory checker đối chiếu toàn bộ 15 applied dictionary sections với migration: PASS — all applied dictionary fields present.
- Explicit Applied fields trong domain-model-core.puml đối chiếu migration columns: PASS.
- Literal search trên M2.1 Markdown + bốn PlantUML:
  - TARGET_EXT = 0
  - MATCHING = 0
  - CORE (Supporting) = 0
- PlantUML static balance:
  - domain-model-core.puml: start=1, end=1
  - content-lifecycle-state.puml: start=1, end=1
  - learning-progression-model.puml: start=1, end=1
  - erd-logical-status-mapping.puml: start=1, end=1
- Active edge check: PASS — không có ARCHIVED -> DRAFT edge trong content-lifecycle-state.puml.
- git diff --check: exit code 0.
- Java và PlantUML renderer: unavailable; chỉ ghi nhận static syntax, không claim render/compile PASS.

Files changed by this targeted fix:

- docs/phase-1-m2-1-domain-and-logical-data-foundation.md
- docs/plantuml/domain-model-core.puml
- docs/plantuml/erd-logical-status-mapping.puml
- docs/phase-1-m2-1-targeted-fix-after-adjudication.md

Không thay đổi:

- baseline/Product Decision/requirements
- docs/plantuml/content-lifecycle-state.puml
- Prisma schema
- migrations
- database/Supabase
- lingora-web
- lingora-ai
- M2.2 artifacts

## 10. Remaining Unknowns

- Independent re-review phải xác nhận lại toàn bộ D-G1/D-G2 và không được lấy report fix này làm self-approval.
- Human approval của M2.1 vẫn PENDING.
- Renderer PlantUML chưa có trong môi trường; chỉ có static syntax evidence.
- Các câu cấm Exam/QuestionBank và boundary prose ARCHIVED -> DRAFT cần được đánh giá semantic trong independent re-review; không phải active entities/transitions.

## 11. Final State

M2.1 = CORRECTED — READY FOR INDEPENDENT RE-REVIEW

M2.2 = NOT STARTED

Không claim PASS. Không chạy independent re-review trong cùng task.

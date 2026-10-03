# M2.1 — FINDING ADJUDICATION BEFORE FIX

## 1. Executive Result

Mục tiêu của task này là adjudicate các findings trước khi sửa. Không có M2.1 source artifact, baseline, schema, migration, database hoặc application code nào được chỉnh sửa.

Kết quả:

- P0-01 = REVIEW-CRITERION CONFLICT WITH BASELINE — NOT A VALID FINDING
- P1-01 = VALID
- P1-02 = VALID
- P1-03 = FORMAT/HARD-LITERAL ISSUE, không phải active product/design occurrence
- P1-04 = VALID
- P1-05 = VALID
- P2-01 = VALID — DOCUMENTATION DRIFT
- Governance state có dấu hiệu stale và cần cập nhật sau targeted fix, nhưng chưa sửa trong task này.

## 2. P0-01 Adjudication

### Source-of-truth precedence

Approved Product Decision / Requirements baseline được ưu tiên hơn review prompt.

Evidence trực tiếp:

- docs/phase-0-roles-and-mvp-final.md:56 khóa lifecycle: Draft → In Review → Changes Requested → Approved → Published → Archived.
- docs/phase-0-roles-and-mvp-final.md:64 ghi: Approved → Published | Organizational Manager (hoặc Administrator khẩn cấp).
- docs/phase-0-roles-and-mvp-final.md:65 ghi: Published → Archived | Organizational Manager ..., Administrator.
- docs/phase-0-final-product-owner-decision-sheet.md:33,57-60 khóa D2: Moderator chịu trách nhiệm APPROVED, Organizational Manager chịu trách nhiệm PUBLISHED, Administrator không can thiệp quy trình thường nhật.
- docs/phase-0-final-reconciliation-log.md:30 xác nhận Administrator chỉ được emergency publication/archive, còn publication thường nhật thuộc Organizational Manager.
- M2.1 hiện tại giữ đúng semantics baseline tại lines 274-277.
- docs/plantuml/content-lifecycle-state.puml:35-45 cũng dùng APPROVED -> PUBLISHED cho normal/emergency publish và PUBLISHED -> ARCHIVED cho archive.

### Adjudication

Không có evidence baseline nào yêu cầu Administrator emergency publish trực tiếp từ IN_REVIEW. IN_REVIEW -> APPROVED là transition của Moderator; publication xảy ra từ APPROVED.

Kết luận:

P0-01 = REVIEW-CRITERION CONFLICT WITH BASELINE — NOT A VALID FINDING

Không được đổi M2.1 sang IN_REVIEW -> PUBLISHED chỉ để làm review prompt PASS. Nếu muốn thay đổi semantics, đó là product-governance decision riêng.

## 3. P1-01 Verification

Đối chiếu migration 202608140001_init với M2.1 Markdown và domain-model-core.puml:

| Field | Migration Exists? | M2.1 Claim | Valid? |
|---|---|---|---|
| lessons.objective | Không; lessons migration lines 75-85 không có cột này. | M2.1:502 CURRENT_APPLIED_DATABASE; domain-model-core.puml:55 [Applied]. | Không hợp lệ — P1-01 VALID |
| vocabularies.audio_path | Không; migration lines 98-110 có audio_url, không có audio_path. | M2.1:548 CURRENT_APPLIED_DATABASE; domain-model-core.puml:83 [Applied]. | Không hợp lệ — P1-01 VALID |
| exercises.created_at | Không; exercises migration lines 133-144 không có. | M2.1:529 CURRENT_APPLIED_DATABASE. | Không hợp lệ — P1-01 VALID |
| exercises.updated_at | Không; exercises migration lines 133-144 không có. | M2.1:530 CURRENT_APPLIED_DATABASE. | Không hợp lệ — P1-01 VALID |
| user_progress.created_at | Không; user_progress migration lines 147-158 có updated_at nhưng không có created_at. | M2.1:589 CURRENT_APPLIED_DATABASE. | Không hợp lệ — P1-01 VALID |

Kết luận P1-01: VALID. Đây là false applied-field claim.

## 4. P1-02 Verification

M2.1 claim data dictionary coverage 100% tại lines 430 và 742. Các applied columns bị bỏ sót:

| Table | Applied columns bị bỏ sót | Evidence |
|---|---|---|
| profiles | ui_locale, native_lang_code, timezone, last_qualifying_activity_date | Migration 202608140001_init:31-48; M2.1 dictionary 565-578. |
| vocabularies | normalized_term, phonetic, audio_url, created_at, updated_at | Migration 98-110; M2.1 dictionary 542-549. |
| chat_scenarios | is_published, created_at | Migration 195-203; M2.1 dictionary 627-633. |

Đối chiếu các applied table còn lại cũng giữ nguyên các false claims ở P1-01.

Kết luận P1-02: VALID. Claim 100% field coverage không được migration evidence hỗ trợ.

## 5. P1-03 Verification

Fresh search trên M2.1 Markdown và bốn PlantUML:

| Token | Active occurrence | Exclusion/prohibition occurrence | Result |
|---|---:|---:|---|
| TARGET_EXT | 0 | 5 | Không có active hybrid label; còn literal token trong câu giải thích “đã loại bỏ”. |
| MATCHING | 0 | 6 | Không có enum/type active; còn literal token trong câu giải thích “không tồn tại/đã loại bỏ”. |

Các occurrences nằm tại M2.1 lines 124, 540, 738-740, 757, 779, 880, 882; không có occurrence trong field/status label active của PlantUML.

Kết luận P1-03: FORMAT/HARD-LITERAL ISSUE, không phải active product/design violation. Nếu acceptance command bắt literal zero occurrences, targeted fix cần viết lại các câu giải thích này.

## 6. P1-04 Verification

CORE (Supporting) xuất hiện trực tiếp trong actual Scope column:

- M2.1 §7.1 lines 418-419: chat_scenarios, chat_scenario_translations.
- M2.1 headings lines 627 và 634.
- erd-logical-status-mapping.puml:222,231.

M2.1 tự định nghĩa Scope canonical tại lines 426-428 chỉ gồm CORE, EXTENSION, EXCLUDED. Vì vậy CORE (Supporting) là hybrid label trong Scope axis.

Kết luận P1-04: VALID.

## 7. P1-05 Verification

M2.1 inventory có các entity sau, nhưng §4.3 lines 224-236 không có mapping FR/UC/BF riêng:

| Entity | Inventory | FR | UC | BF | Trace Complete |
|---|---:|---|---|---|---|
| Language | Có, §4.1 và §7.1 row 1 | Liên hệ khái niệm P1-FR-002, không có row §4.3 | Không có row riêng | Không có row riêng | Không |
| CourseTranslation | Có, §7.1 row 3 | P1-NFR-005 trong dictionary | Không có row §4.3 | Không có row §4.3 | Không |
| UnitTranslation | Có, §7.1 row 5 | P1-NFR-005 trong dictionary | Không có row §4.3 | Không có row §4.3 | Không |
| LessonTranslation | Có, §7.1 row 7 | P1-NFR-005/P1-FR-009 | Không có row §4.3 | Không có row §4.3 | Không |
| VocabularyTranslation | Có, §7.1 row 11 | P1-NFR-005/P1-FR-003 | Không có row §4.3 | Không có row §4.3 | Không |
| ChatScenario | Có, §7.1 row 17 | P1-FR-007 | Không có row §4.3 | Không có row §4.3 | Không |
| ChatScenarioTranslation | Có, §7.1 row 18 | P1-FR-007/P1-NFR-005 | Không có row §4.3 | Không có row §4.3 | Không |

§4.3 có các dòng cho 13 entity/nhóm khác nhưng không đủ để support claim “100% Core entities traced”.

Kết luận P1-05: VALID.

## 8. P2-01 Verification

Đối chiếu PlantUML với Data Dictionary và migration:

- user_vocab_srs: domain-model-core.puml:91-102 thiếu created_at; ERD:158-168 thiếu recall_probability, last_reviewed_at, lapse_count, created_at.
- vocabularies: domain model:79-84 và ERD:123-130 dùng audio_path thay vì applied audio_url, đồng thời thiếu normalized_term, phonetic, created_at, updated_at.
- chat_scenarios: ERD:217-223 thiếu is_published, created_at; domain model không biểu diễn entity này.

Đây là documentation/diagram drift, không tự thay đổi product policy D1-D9.

Kết luận P2-01: VALID — DOCUMENTATION DRIFT.

## 9. Governance State Check

Trạng thái hiện không đồng nhất:

- M2.1 source ghi REVISED — READY FOR RE-REVIEW tại phase-1-m2-1-domain-and-logical-data-foundation.md:6,812,891.
- Targeted report ghi TARGETED INDEPENDENTLY VERIFIED FOR P1-01/P2-01 và READY FOR NEXT GOVERNANCE DECISION tại phase-1-m2-1-targeted-re-review-p1-01-p2-01.md:14,95.
- Targeted fix report vẫn ghi REVISED — READY FOR TARGETED RE-REVIEW tại line 176.
- plans/current-task.md vẫn là task Phase 0 đã DONE, không phải state machine governance riêng cho M2.1.

Đây là STALE GOVERNANCE STATE sau targeted verification. Không sửa trong adjudication task. Full independent re-review còn mở các P1 khác, nên chưa có cơ sở APPROVED.

## 10. Final Finding Set

| ID | Severity | Valid Finding? | Evidence | Action |
|---|---|---|---|---|
| P0-01 | P0 | No — review criterion conflicts with approved baseline | Baseline roles:56,64-65; decision sheet D2; reconciliation log:30; M2.1/PlantUML match APPROVED -> PUBLISHED. | DISCARD |
| P1-01 | P1 | Yes | Migration-vs-M2.1 field table in §3. | FIX |
| P1-02 | P1 | Yes | Applied-column coverage table in §4; claim 100% unsupported. | FIX |
| P1-03 | P1/hygiene | Partial — format/hard-literal only | Active=0; exclusion/prohibition occurrences only. | FIX |
| P1-04 | P1 | Yes | CORE (Supporting) in actual Scope column and ERD. | FIX |
| P1-05 | P1 | Yes | Inventory vs §4.3 trace table in §7. | FIX |
| P2-01 | P2 | Yes — documentation drift | PlantUML field comparison in §8. | FIX |
| GOV-01 | P2 | Yes — stale governance state | M2.1 source, targeted report, targeted fix report and current-task state in §9. | CLARIFY SOURCE OF TRUTH |

M2.1 = FINDINGS ADJUDICATED — READY FOR TARGETED FIX

M2.2 = NOT STARTED

STOP. Không sửa findings trong task này, không approve M2.1, không bắt đầu M2.2.

# Active Task

`d1-final-design-cleanup-and-d2-domain-data-design`

## Status

`DONE`

## User Directive

System Design task D1 → D2 từ baseline `PASS WITH NON-BLOCKING ISSUES` (Requirement Analysis COMPLETED; 12 YC-CORE, 8 YC-EXT, 19 MVP, 15 UC `UC-01..UC-15`; frozen principles: 4 core diagnostic dims, W/S extension, CEFR A1–C2 canonical / MVP A1–B2, self-report OR diagnostic, 4-concept separation, 3-state transition, concept-level remediation, L3 recommendation, 4-tier multi-lang chain).
`D1` xử lý toàn bộ non-blocking cleanup còn tồn tại. `D2` thiết kế domain/logical data model chi tiết chuẩn bị cho D3–D6.
KHÔNG implement runtime, KHÔNG sửa application code, KHÔNG tạo migration, KHÔNG đổi Supabase runtime schema, KHÔNG viết scoring algorithm, KHÔNG implement recommendation/remediation engine. Design-first only. Không tuyên bố Design Freeze cuối ở task này.

## Category Tag

`category: scope-ambiguity`

## D1 Scope — Final Design Cleanup (6 items, evidence-verified 2026-09-24)

### D1.1 Assessment semantics
- `docs/04-data-model.md:449` xóa `AssessmentSession` khỏi liệt kê logical canonical (ghost: grep toàn `docs/` đúng 1 hit, zero định nghĩa; M2.1 10-entity list không có nó).
- `docs/phase-1-m2-1-domain-and-logical-data-foundation.md:1016` sửa purpose line `"Diagnostic, Placement, Jump hoặc Exit/Re-evaluation"` → chỉ purposes (`DIAGNOSTIC/EXIT/RE_EVALUATION`), modes nằm ở `deliveryMode` (`:1021` đã đúng + HISTORICAL banner).
- `docs/01-architecture.md:451` bổ sung `STANDARD` vào DeliveryMode (hiện chỉ nêu PLACEMENT/JUMP).
- `docs/plantuml/domain-model-core.puml:193-202` thêm `delivery_mode` vào `AssessmentResult` cho khớp prose `:1021`.
- Giữ: `AssessmentResult` = persisted logical entity duy nhất; `Assessment` = conceptual mode của Exercise (D4).

### D1.2 LearningProgress ownership — VERIFY ONLY
Đã đúng: `domain-model-core.puml:308` sole owner + note `:309`; `M2.1:1013` sole owner; GUARD-09 cover. Chỉ re-verify bằng guard, không sửa prose trừ khi guard fail.

### D1.3 Concept model — VERIFY ONLY
Đã đúng: `conceptId FK` ở M2.1 (`:278,287,307,1048,1059,1098`) + puml (`:216,225`); `conceptTag` chỉ còn trong replacement notes. Chỉ re-verify.

### D1.4 Expert identity — PENDING-SOURCE-VERIFICATION
Tên/tenure đã nhất quán (Trần Minh Quân 9y; Lê Hoàng Mai 8y; zero `Tuyết Mai`). Còn assert chưa source: `docs/phase-0-user-research-analysis-and-requirements.md:38,432` + `docs/slide-deck-17-slides.md:22,162` (trường ĐH + chi tiết credential, không transcript/scan/dated note trong repo). Gắn qualifier `[PENDING-SOURCE-VERIFICATION]` cho cơ sở đào tạo/credential ở đúng 4 vị trí, không đổi tên/tenure, không chọn trường mới. (Parity: áp cho cả Victoria/Quân.)

### D1.5 Multi-language documentation
Chain đã có ở `01:444`, `M2.1:559`, `tai-lieu:548`, `phase-0:67`. Bổ sung room (config keys, không physical tables — giữ note `01:462`):
- EN ở `01:454` + rubric `01:460`: thêm collocation, word family, connected speech, contextual vocabulary.
- ZH ở `01:455`/`01:461`: thêm Chinese grammar/order + Chinese listening specifics (giữ `hidePinyin: true`, HSK 2.0/3.0 versioned).
- `tai-lieu:499` EN bổ sung `word family` (hiện chỉ collocations/connected speech).
- M2.1 §6.9 Tầng 2 (`:561-563`) mirror EN keys tương ứng.

### D1.6 Historical references — không rewrite history
Đã gắn HISTORICAL: `decision-sheet:135` (COMPLETED_BY_JUMP), 2 report files CEFR-auto, puml `:125`. Còn lại:
- `phase-0-final-master-consolidation.md:219` + `phase-0-roles-and-mvp-final.md:92` (`Ba dạng`): frozen baselines → chỉ gắn tag `[HISTORICAL — superseded by ADR-006 five types]`, không rewrite nội dung.
- `docs/plantuml/erd-mvp-learning.puml:60` (`audio_path` vs applied `audio_url`): sửa diagram-only thành `audio_url` (PA-07 đã ghi nhận; zero runtime change).

## D2 Scope — Detailed Domain & Logical Data Design (16 items)

### D2.1 Learner domain (M2.1 §8.20 + puml)
- `LearnerProfile`: identity, target language, learning goal, self-reported level, verified proficiency ref, assessment state. Không `Profile.level` authoritative.
- `SkillProfile`: 4 dims + level/status + assessment provenance; nhãn anchor PENDING; không flat Overall Score. (Puml hiện thiếu provenance → bổ sung.)
- `LearningProgress`: content completion/engagement; nhãn `≠ proficiency`.
- `AssessmentResult`: purpose/type + deliveryMode + language + state + responses/summary + skill outputs + starting/exit evidence + timestamp + provenance/version. Không scoring formula (giữ PROPOSED/PENDING).

### D2.2 Mastery domain
- `Concept`: id/code/language scope/description/level-ref metadata (đã có `:1033-1041`; puml `:204-211` parity: bổ sung `name`, `prerequisiteConceptId`, `isActive`; xử lý drift `cefr_level` vs `PRONUNCIATION` — thống nhất 1 enum, ghi decision).
- `ConceptMastery` (`NOVICE/DEVELOPING/MASTERED`): quan hệ LearnerProfile→Concept→ConceptMastery; `conceptId` FK (đã có).
- `KnowledgeGap`: learner/concept/severity-state/detectedAt/resolvedAt/evidence-provenance; resolution rule giữ `CONFIGURABLE / PENDING VALIDATION`, cấm hard-code `3 consecutive correct`.
- Ghi delete/archive behavior cho cả ba.

### D2.3 Readiness domain
- `LevelReadiness`: ADVANCE / ADVANCE_WITH_SUPPORT / REMEDIATE; evidence typed struct (`progressRatio`, `masteryRatio`, `highSeverityGapsCount`, `sourceAssessmentResultIds[]` + `evidenceVersion`, `evaluatedAt`) thay JSONB opaque; ref AssessmentResult/mastery/gaps; không completion=readiness, không single-score, không hard-code thresholds.

### D2.4 Recommendation domain
- `Recommendation` (L3 inputs: proficiency + skill profile + goal + history + error history + mastery/gaps; output: next content/module + reason/provenance + generatedAt + rule/model version). Puml `:255-262` hiện thiếu provenance → bổ sung `inputSnapshot/version` semantics (logical only, không algorithm).

### D2.5 RemedialModule governance
Đã có fields (`01:478`, puml `:241-253`). Ghi rõ lifecycle Draft→In Review→Approved→Published qua Moderator (không bypass), fresh vocab/context/exercise cho concept cũ. Verify-only + thiếu gì bổ sung nấy.

### D2.6 Content domain
Course→Unit→Lesson→Exercise→Concept; 5 types canonical (MCQ/FILL_BLANK/REORDER/LISTENING/GRAMMAR); READING logical representation (đã PROPOSED/DESIGN GAP — giữ status, parity prose↔puml); `GRAMMAR ≠ GEC` (transient, không persistence).

### D2.7 Multi-language domain/config
`Language → LanguageConfig → AssessmentConfig → ItemBank → Rubric` (conceptual, per note `01:462`); EN/ZH config points riêng (kế thừa D1.5); HSK = versioned reference, không core level engine.

### D2.8 Assessment lifecycle
Entry (Self Report OR Diagnostic → AssessmentResult → SkillProfile → Starting Point) / Learning (Lesson→Exercise→Error→Concept→Mastery/Gap) / Post-learning (EXIT/RE_EVALUATION → AssessmentResult → evidence → LevelReadiness) / Decision (3 states). Ghi vào M2.1 §6.x + `01 §3` + puml progression; khớp `09` (Mapping A) + `06` UC-03/04/07.

### D2.9 Jump semantics
SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP + `by_jump=true`; never COMPLETED_BY_LEARNING; Jump ≠ certification. (Đã đúng — verify + parity diagrams.)

### D2.10 Versioning/provenance
Chỉ nơi future consistency phụ thuộc: assessment blueprint, Language Config, Item Bank, Rubric, RemedialModule (`version` đã có), Recommendation rule/model version, proficiency mapping. Không overdesign; ghi bảng quyết định version-ở-đâu.

### D2.11 Logical invariants (10, ghi tập trung M2.1 + `01 §3.3`)
LearningProgress≠Proficiency; Proficiency≠Mastery; Mastery≠LevelReadiness; Completed B1≠certification; Completed B1≠auto B2; weak skill≠downgrade; remediation≠replay; Jump≠learning completion; self-reported≠verified; Diagnostic≠Exit.

### D2.12 Relationship/cardinality matrix
Bảng owner/cardinality/optionality/lifecycle/delete-archive cho 10 relations trong đề bài (LearnerProfile→{LearningProgress, SkillProfile, AssessmentResult, ConceptMastery, KnowledgeGap}; Concept→{ConceptMastery, KnowledgeGap, RemedialModule}; Lesson→Exercise; Exercise→Concept). Không duplicate ownership (kế thừa D1.2).

### D2.13 Traceability update
Bổ sung Requirement→UC→Domain→Design rule cho CORE-09 (Diagnostic→AssessmentResult→SkillProfile→Starting Point), CORE-07 (Exercises→Concept→Mastery→Gap→Remediation), CORE-08 (SRS→LearningProgress/Review, không conflation proficiency), EXT-03 (Recommendation→Readiness/Gap/History). Ghi vào `05` §5 + M2.1 §4.3.

### D2.14 Diagrams
`domain-model-core.puml` (delivery_mode, Concept parity, Recommendation provenance, giữ balance `@startuml/@enduml`), `learning-progression-model.puml` (lifecycle D2.8, jump), Mermaid M2.1 §4.1 — prose↔diagrams khớp 100%, no ghost/duplicate.

### D2.15 Schema readiness review
Bảng Entity|Purpose|Owner|Key relations|Status (FROZEN/PROPOSED/PENDING VALIDATION) cho toàn bộ entities. Không label implementation detail FROZEN nếu chưa decided.

### D2.16 Runtime compatibility report (read-only M1 model)
Đối chiếu logical target vs current M1 runtime (Prisma applied: 3 exercise types; 2 roles; `audio_url`; `user_progress`; `record_review`): compatible / requires future schema extension / requires runtime migration later / unresolved. Không chạm runtime.

## Open Decisions (output K — giữ nguyên, không quyết trong task này)
exact diagnostic item count; exact item distribution; scoring algorithm; adaptive thresholds; Anchor aggregation; readiness threshold; remediation threshold; CEFR→Unit mapping (ngoài Mapping A đã approved cho English A1); HSK mapping/version chi tiết. Tất cả giữ `PROPOSED / PENDING VALIDATION / CONFIGURABLE`.

## Files Expected To Change
- `docs/04-data-model.md` (D1.1)
- `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (D1.1, D1.5-mirror, D2.1–D2.13, D2.15–D2.16)
- `docs/01-architecture.md` §3 (D1.1, D1.5, D2.8, D2.11)
- `docs/plantuml/domain-model-core.puml` + `docs/plantuml/learning-progression-model.puml` (D1.1, D2.14)
- `docs/phase-0-user-research-analysis-and-requirements.md` (D1.4: 2 vị trí)
- `docs/slide-deck-17-slides.md` (D1.4: 2 vị trí)
- `docs/tai-lieu-phan-tich-yeu-cau.md` (D1.5 EN word family)
- `docs/phase-0-final-master-consolidation.md` + `docs/phase-0-roles-and-mvp-final.md` (D1.6 tag-only)
- `docs/plantuml/erd-mvp-learning.puml` (D1.6 audio_url diagram-only)
- `docs/05-traceability-matrix.md` §5 (D2.13)
- `scratch/verify_consistency_guards.py` (extend guards: ghost-absence, pending-tag, EN keys, deliveryMode-puml, Concept parity, Recommendation provenance, invariants presence)
- `logs/test-log.md` + `logs/development-log.md` + `logs/decision-log.md` (TEST + LOG gates)
- `docs/QUICK-REF.md` + `HANDOFF.md` (chỉ sau DONE, qua approved task flow)

## Files Explicitly NOT Touched
Application code (`lingora-web/`, `lingora-admin/` runtime, `lingora-ai/api/`); Prisma schema/migrations; Supabase runtime; scoring/recommendation/remediation algorithms; historical approved/archive records ngoài tag D1.6.

## Test Plan (approved gates)
1. `py scratch/verify_consistency_guards.py` (11 guards cũ + guards mới) — expect exit 0.
2. `git diff --check` — expect 0.
3. Grep-verifiable: `AssessmentSession` 0 hit ngoài HISTORICAL (nếu giữ alias); `conceptTag` 0 live-field; `UC-16/17/18` 0; `Ba dạng` 0 ngoài HISTORICAL; puml `@startuml/@enduml` balance.
4. Evidence format `logs/test-log.md` (Environment/Command/Output/Verdict). Verdict từ observed output, không suy luận.

## Negative Invariants
0 code, 0 migration, 0 fake expert/số liệu, 15 UC giữ nguyên, adaptive params giữ PROPOSED/PENDING VALIDATION, không hard-code threshold/formula, không claim Design Freeze ở task này.

## Approval (human only)
- [ ] Scope D1+D2 đã đủ / cần bớt / cần thêm:
- [ ] Files Expected To Change đã đủ / có file cần loại:
- [ ] Approved by:            Date:
- Quyết định D1.6 `Ba dạng` (tag-only vs rewrite):
- Quyết định Concept enum (`cefr_level` vs `PRONUNCIATION` + name/prereq/isActive):

## Status Log
- 2026-09-24: PLAN drafted (DRAFT) from user directive + evidence sweep (gated workflow PLAN→REVIEW→APPROVE→IMPLEMENT→TEST→LOG→COMMIT). Awaiting human approval. Không implement trước APPROVED.
- 2026-09-24: Human APPROVED (triển khai). IMPLEMENTED D1 (6/6) + D2 (16/16) per Files Expected To Change; no out-of-scope file touched. TESTED: T-D1-D2-DESIGN-001 PASS (18/18 guards, diff--check 0). LOGGED: test-log, development-log, ADR-015. DONE. Commit pending explicit user request (per git discipline).

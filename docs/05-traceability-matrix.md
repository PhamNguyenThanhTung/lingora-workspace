# 05 - Lingora Traceability Matrix

> **Canonical status:** M1.6W Post-Recovery Baseline. This matrix maps approved requirement IDs to Use Cases (`docs/06-system-analysis.md`), Architecture (`docs/01`), Data Model / Dictionary (`docs/07`), API/RPC (`docs/03`), Tests, and Report Evidence.

## Matrix

| Requirement ID | Priority | Use Case | Architecture | Data Entity / Dictionary | API / RPC | Test ID / Evidence | Report Evidence | Status |
|---|---|---|---|---|---|---|---|---|
| **P1-FR-001** | Must | `UC-01` | `docs/01` §3.1–3.2 Web SSR Auth | `Profile` (`docs/07` §2.2) | Supabase Auth (GoTrue ES256) | `M1.6W-T-003/004/005` (PASS) | P1 Report §3.1 (Auth UC) | `IMPLEMENTED (M1.6W)` |
| **P1-FR-002** | Must | `UC-02` | `docs/01` §1.2, §3.2 | `Course`, `Lesson`, `Vocabulary`, `Language` (`docs/07` §2.3–2.5) | PostgREST / Storage (`course-media`) | `M1.4-T-001` (Seed PASS), `P1-T-002` | P1 Report §3.2 (Curriculum Flow) | `CONFIRMED (Pending M2 UI)` |
| **P1-FR-003** | Must | `UC-03` | `docs/01` §1.2, §3.2 | `Exercise.payload` (`docs/07` §2.6), `UserProgress` | Server Actions / Client Engine | `P1-T-003`, `M1.6W-T-002` | P1 Report §3.3 (Exercise Engine) | `CONFIRMED (Pending M2 Engine)` |
| **P1-FR-004** | Must | `UC-03`, `UC-07` | `docs/01` §1.3 (ADR-003) | `UserProgress` (`docs/07` §2.7) | Server Action (Score aggregate 0–100%) | `P1-T-004`, `M1.4-T-001` | P1 Report §3.4 (Progress Model) | `CONFIRMED (Pending M2 UI)` |
| **P1-FR-005** | Must | `UC-05` | `docs/01` §1.3, §3.2 | `UserVocabSrs` (`docs/07` §2.8) | `/api/ai/srs` ➔ `/v1/srs/schedule` | `M1.6W-T-006-RERUN` (PASS), `M1.5-AMEND-T-002` | P1/ML Report §3.5 (SRS Sequence) | `IMPLEMENTED_FOUNDATION (M1.6W)` |
| **P1-FR-006** | Must | `UC-05` | `docs/01` §1.3 (ADR-003) | `UserVocabSrs`, `ReviewLog` (`docs/07` §2.8) | RPC `record_review` (`docs/04` §4.2) | `M1.3-T-001` (PASS), `M1.4-T-001` | P1 Report §3.5 (RPC Transaction) | `IMPLEMENTED (M1.3)` |
| **P1-FR-007** | Must | `UC-06` | `docs/01` §1.4, §3.2 | `ChatScenario`, `ChatSession`, `ChatMessage` (`docs/07` §2.9) | `/api/ai/chat` ➔ `/v1/chat/roleplay` | `M1.6W-T-007-RERUN` (PASS), `M1.5-AMEND-T-002` | P1/NLP Report §3.6 (Roleplay Hop) | `IMPLEMENTED_FOUNDATION (M1.6W)` |
| **P1-FR-008** | Must | `UC-04` | `docs/01` §1.2 (Admin) | Content entities (`Course`, `Lesson`, etc.) | Admin Client / PostgREST RLS | `M1.3-T-001` (Admin RLS PASS) | P1 Report §3.7 (Admin CRUD) | `IMPLEMENTED_DB (M1.3; UI Pending M3)` |
| **P1-FR-009** | Must | `UC-04` | `docs/01` §1.6 Storage | `course-media`, `chat-audio` (`docs/07` §3) | Supabase Storage API + RLS policies | `M1.3-T-002` (Storage RLS PASS) | P1 Report §3.8 (Storage Audit) | `IMPLEMENTED (M1.3)` |
| **P1-FR-010** | Must | `UC-01`..`07` | `docs/01` §3.2 (i18n) | `Language`, `*Translation` (`docs/07` §2.1–2.9) | Next.js Locale Catalog (`vi` / `en`) | `M1.6W-T-002` (Vitest i18n PASS) | P1 Report §3.9 (Localization) | `IMPLEMENTED_FOUNDATION (M1.6W)` |
| **P1-FR-011** | Must | `UC-07` | `docs/01` §1.5 (Gamification)| `Profile.streakCount`, `lastQualifyingActivityDate` | Server Action (Timezone-aware check) | `M1.4-T-001` (PASS), `P1-T-011` | P1 Report §3.10 (Streak Engine) | `CONFIRMED (Pending M2 UI)` |
| **P1-FR-012** | Must | `UC-03` | `docs/01` §1.2 (ADR-006) | `Exercise.payload` (`type='GRAMMAR'`) | Client render component & validation | `P1-T-016` | P1 Report §3.3 (Grammar Exercise) | `ADR-006 LOCKED (Pending M2)` |
| **P1-FR-013** | Must | `UC-03` | `docs/01` §1.2, §1.6 | `Exercise.payload` (`type='LISTENING'`), `course-media` | Audio element + Storage playback | `P1-T-017` | P1 Report §3.3 (Listening Exercise)| `ADR-006 LOCKED (Pending M2)` |
| **P1-FR-014** | Must | `UC-07` | `docs/01` §1.5 (ADR-006) | `Profile.dailyGoalMin` (`docs/07` §2.2) | Profile Update Action (5–120 min) | `P1-T-018` | P1 Report §3.10 (Daily Goal) | `ADR-006 LOCKED (Pending M2)` |
| **P1-FR-015** | Must | `UC-08` | `docs/01` §1.5 (ADR-008) | Client-local state (No reminder entity) | N/A — In-App Banner/Toast | `P1-T-019` | P1 Report §3.11 (In-App Reminder) | `ADR-008 LOCKED (Option 6d; Later M2+)` |
| **P1-NFR-001**| Must | All | `docs/01` §1.7 Security | RLS on all 17 tables (`docs/07` §2) | JWT ES256 / RLS enforced at DB | `M1.3-T-001`, `M1.5-AMEND-T-001` | P1 Report §4.1 (Security Architecture) | `IMPLEMENTED (M1.3/M1.5/M1.6W)` |
| **P1-NFR-002**| Must | `UC-05` | `docs/01` §1.3 Resilience | `UserVocabSrs` fallback state | 8.0s Route Handler Timeout + Deterministic Rule | `M1.6W-T-002`, `M1.6W-T-008` (PASS) | P1/ML Report §4.2 (Resilience) | `IMPLEMENTED_FOUNDATION (M1.6W)` |
| **P1-NFR-003**| Must | `UC-05/06` | `docs/01` §1.3–1.4 API | N/A | snake_case, `ApiErrorEnvelope`, latency_ms | `M1.5-AMEND-T-001` (37/37 Pytest PASS) | AI Reports (API Contract) | `IMPLEMENTED (M1.5/M1.6W)` |
| **P1-NFR-004**| Must | All Web UI | `docs/01` §3.2 UX | N/A | Resilient UI States (Loading/Empty/Error) | `M1.6W-T-002/008/009/010` (PASS) | P1 Report §4.3 (UI Baseline) | `IMPLEMENTED_FOUNDATION (M1.6W)` |
| **ML-FR-001** | Must | `UC-05` | `docs/01` §2.1 ML SRS | `UserVocabSrs`, `ReviewLog` | `/v1/srs/schedule` | `M1.5-AMEND-T-001` (Mock PASS) | ML Report §2 (DKT Model) | `MOCK_IMPLEMENTED (M1.5; Train M4)` |
| **ML-FR-002** | Must | `UC-05` | `docs/01` §2.1 Baseline | N/A | `/v1/srs/schedule` | `M1.5-AMEND-T-001` (PASS) | ML Report §3 (HLR Baseline) | `MOCK_IMPLEMENTED (M1.5; Train M4)` |
| **ML-FR-003** | Must | `UC-05` | `docs/01` §2.1 Scheduler | N/A | Response fields: `recall_probability`, `priority` | `M1.5-AMEND-T-001` (PASS) | ML Report §4 (Scheduler) | `MOCK_IMPLEMENTED (M1.5; M4)` |
| **ML-FR-004** | Must | `UC-05` | `docs/01` §2.1 Evaluation | `logs/model-registry.csv` | `/v1/model/info` | `M1.5-AMEND-T-001` (PASS) | ML Report §5 (Evaluation) | `MOCK_IMPLEMENTED (M1.5; Eval M4)` |
| **ML-NFR-001**| Must | `UC-05` | `docs/01` §2.1 Acceptance | `logs/model-registry.csv` | `/v1/model/info` | `M1.5-AMEND-T-001` (PASS) | ML Report §6 (Model Registry) | `MOCK_IMPLEMENTED (M1.5; M4)` |
| **NLP-FR-001**| Must | `UC-06` | `docs/01` §2.2 NLP Chat | `ChatScenario`, `ChatMessage` | `/v1/chat/roleplay` | `M1.5-AMEND-T-001`, `M1.6W-T-007-RERUN` | NLP Report §2 (Multi-turn Roleplay) | `MOCK_IMPLEMENTED (M1.5; Train M4)` |
| **NLP-FR-002**| Must | `UC-06` | `docs/01` §2.2 Pipeline | N/A | Chat endpoint tokenizer/generation | `M1.5-AMEND-T-001` (PASS) | NLP Report §3 (Seq2Seq Architecture) | `MOCK_IMPLEMENTED (M1.5; Train M4)` |
| **NLP-FR-003**| Must | `UC-06` | `docs/01` §2.2 Model | `logs/model-registry.csv` | `/v1/model/info` | `M1.5-AMEND-T-001` (PASS) | NLP Report §4 (T5-small Deployment) | `MOCK_IMPLEMENTED (M1.5; M4)` |
| **NLP-FR-004**| Must | `UC-06` | `docs/01` §2.2 Metrics | N/A | Separate BLEU/ROUGE/Perplexity metrics | `M1.5-AMEND-T-001` (PASS) | NLP Report §5 (Evaluation Metrics) | `MOCK_IMPLEMENTED (M1.5; Eval M4)` |
| **NLP-FR-005**| Nice | `UC-06` | `docs/01` §2.2 Grammar | N/A (Persistence deferred) | Optional `grammatical_acceptability_score` | `M1.5-AMEND-T-001` (PASS) | NLP Report Appendix (Optional CoLA) | `NICE / OPTIONAL (M1.5 Mock)` |
| **NLP-NFR-001**| Must| `UC-06` | `docs/01` §2.2 Deploy | N/A | CPU inference latency < 2000ms | `M1.5-AMEND-T-001` (PASS) | NLP Report §6 (Deployment Latency) | `MOCK_IMPLEMENTED (M1.5; M4)` |

---

## Ghi chú Vòng đời & Trạng thái Ranh giới (Boundary Status Notes)

1. **Nền tảng Học viên Web (`lingora-web`):** Toàn bộ các yêu cầu người học (`P1-FR-001`..`015`) được hiện thực trên nền tảng Web theo quyết định `ADR-008`. Mã nguồn Android trước đây tại commit `585ca6c` đã được đánh dấu `SUPERSEDED` và loại bỏ khỏi cây mã nguồn hoạt động.
2. **Cơ chế Nhắc nhở Học tập:**
   - `6d (In-app reminder)`: Là phương án chính thức được phê duyệt theo `ADR-006` và `ADR-008`.
   - `6b (Web Push + scheduler)`: Được đánh dấu **`DEFERRED` (Tạm hoãn)**, bảo toàn trên lộ trình mở rộng sau này, không triển khai ở M1/M2.
3. **Mở rộng Dạng bài tập:** `GRAMMAR` (`P1-FR-012`) và `LISTENING` (`P1-FR-013`) đã được phê duyệt ở `ADR-006` và sẽ được bổ sung vào schema/migration ở Milestone M2.

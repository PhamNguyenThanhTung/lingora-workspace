# 05 - Lingora Traceability Matrix

> **Canonical status:** M0.5 approved documentation baseline. This matrix maps approved requirement IDs to architecture, data, API/RPC, tests, and report evidence. `PROPOSED` fields in `docs/04-data-model.md` remain documentation decisions, not implemented schema.

## Matrix

| Requirement ID | Priority | Acceptance criteria summary | Architecture | Data model | API/RPC | Test ID | Report evidence | Status |
|---|---|---|---|---|---|---|---|---|
| P1-FR-001 | Must | Auth session, refresh once, logout clears session | `docs/01:57–78` Android/Auth | `Profile` `04:45–63` | Supabase Auth; N/A AI | P1-T-001 | SE Auth UC/sequence | CONSISTENT |
| P1-FR-002 | Must | Published ordered course/lesson/vocab browsing plus available vocabulary audio; no implied extra vocabulary subfeatures | `docs/01:42,46–51,167` | Course/Lesson/Vocabulary/Translation/LessonVocabulary; `Vocabulary.audioUrl` | PostgREST/Storage delivery | P1-T-002 | SE course/lesson/vocabulary flow | CONSISTENT logical baseline; implementation pending |
| P1-FR-003 | Must | MCQ, Fill-blank, Reorder, GRAMMAR, word-level LISTENING validation and progress; “Quiz” is a label only | `docs/01:121` | `Exercise.payload`; lesson-level `UserProgress`; no Quiz/Attempt entity | N/A | P1-T-003 | SE exercise tests | CONSISTENT; GRAMMAR/LISTENING detail in `P1-FR-012`/`P1-FR-013` |
| P1-FR-004 | Must | Nullable 0–100 lesson aggregate; trusted calculation; idempotent completion; no attempt table | Android/Supabase boundary | `UserProgress`; ADR-003 | N/A | P1-T-004 | SE progress/ERD | CONSISTENT; implementation pending |
| P1-FR-005 | Must | AI schedule plus 8s fallback; notification/reminder delivery excluded | `docs/01:42,119` | `UserVocabSrs` due state; no reminder entity | `/v1/srs/schedule`; planned `get_due_srs_cards` | P1-T-005 | SRS sequence/failure flow | CONSISTENT semantics; integration pending |
| P1-FR-006 | Must | Owner-checked atomic review transaction | `docs/01:48–51` | `ReviewLog/UserVocabSrs` `04:74–109` | `record_review` `04:282–324` | P1-T-006 | SE sequence/RLS | IMPLEMENTED M1.3; DB/RPC tests PASS |
| P1-FR-007 | Must | Hotel roleplay succeeds; optional scorer failure does not fail chat | `docs/01:32–34,42` | Chat entities `04:112–165` | `/v1/chat/roleplay` `03:55–100` | P1-T-007 | Roleplay sequence | CONSISTENT |
| P1-FR-008 | Must | ADMIN-only content/scenario writes | `docs/01:46–51` | Content entities and applied M1.3 RLS | PostgREST/Prisma | P1-T-008 | Admin CRUD/RLS | IMPLEMENTED M1.3; DB actor tests PASS |
| P1-FR-009 | Must | ADMIN-only vocabulary audio plus owner-managed avatar under SEC-D8 PA2 | Supabase Storage `docs/01:18–25,50` | Applied two-private-bucket Storage policies and limits | Direct authenticated Storage API + RLS | P1-T-009 | SE storage test | IMPLEMENTED; full Auth/Storage HTTP boundary and authorization matrix PASS |
| P1-FR-010 | Must | UI vi/en, default/fallback vi; content requested/native/vi/en; ja P2 | M0.5 locale boundary `docs/01` | M0.5 locale/translation baseline `docs/04` | Chat `lang=en` is learned language, not UI locale | P1-T-010 | UI/locale table | CONSISTENT |
| P1-FR-011 | Must | Qualifying lesson/review activity; once per local day; stored IANA timezone/date | M0.5 approved scope `docs/01` | M0.5 Profile/streak baseline `docs/04` | N/A | P1-T-011 | Gamification test | CONSISTENT logical baseline |
| P1-FR-012 | Must | GRAMMAR exercise validates, shows rule explanation, updates progress once; no grammar entity | `docs/01:121` enum + Fragment path | `Exercise.payload` `type = 'GRAMMAR'`; lesson-level `UserProgress`; no grammar table | N/A | P1-T-016 | SE exercise tests, ADR-006 | APPROVED scope ADR-006; implementation pending |
| P1-FR-013 | Must | Word-level LISTENING plays referenced vocabulary audio and grades answer; payload references `vocabularyId`, never a URL | `docs/01:121`; Supabase Storage `docs/01:18–25` | `Exercise.payload` `type = 'LISTENING'`; existing `vocabulary/{vocabularyId}/` path; no new Storage entity | Direct authenticated Storage API + existing RLS | P1-T-017 | SE exercise/storage tests, ADR-006 | APPROVED scope ADR-006 option 4a; implementation pending |
| P1-FR-014 | Must | Learner views/sets daily study goal; negative rejected; no schema or policy change | Android Profile screen `docs/01:46–51` | Existing `Profile.dailyGoalMin`; applied M1.3 grant and validation | PostgREST safe-field update | P1-T-018 | SE profile tests, ADR-006 | APPROVED scope ADR-006; implementation pending |
| P1-FR-015 | Must | Local reminder within chosen window when day has no qualifying activity; permission denial handled; no backend delivery | Android-local only; no new server component | Reads `Profile.dailyGoalMin` and `lastQualifyingActivityDate`; no notification/reminder entity | N/A — client-local, no API | P1-T-019 | SE reminder tests, ADR-006 | APPROVED scope ADR-006 option 3a; implementation pending |
| P1-NFR-001 | Must | RLS ownership and stateless AI boundary | `docs/01:42,48–51,122–123` | Applied M1.3 RLS/grants/functions | JWT/RPC boundary | P1-T-012 | Security chapter | IMPLEMENTED M1.3; live security audit PASS |
| P1-NFR-002 | Must | Core flow survives AI failure | `docs/00:61–67,253–263` | Due-card fallback `04:232–247` | AI errors `03:92–100` | P1-T-013 | Failure-mode tests | CONSISTENT |
| P1-NFR-003 | Must | snake_case, metadata on inference success, optional grammar omission | API rules `03:87–111` | Grammar persistence deferred | `/v1/srs/schedule`, `/v1/chat/roleplay` | P1-T-014 | API contract tests | CONSISTENT after M0.5 |
| P1-NFR-004 | Must | Loading/empty/error/success on Must screens | Android/Admin responsibilities `docs/01:46–51` | N/A | N/A | P1-T-015 | UI test checklist | DESIGN follow-up |
| ML-FR-001 | Must | DKT next-interaction probability and reproducibility | `docs/01:227–250` | SRS logs `04:96–109` | `/v1/srs/schedule` `03:11–53` | ML-T-001 | ML DKT chapter | CONSISTENT |
| ML-FR-002 | Must | Independent HLR baseline/fallback acceptance | `docs/00:75–77,213–215` | SRS entities | `/v1/srs/schedule` | ML-T-002 | ML comparison | CONSISTENT |
| ML-FR-003 | Must | Scheduler derives priority/interval separately | `docs/01:227–250` | Scheduler boundary `04:247–280` | Response fields `03:35–51` | ML-T-003 | Scheduler diagram | CONSISTENT |
| ML-FR-004 | Must | AUC/Brier/latency and random/HLR baselines | `docs/00:213–220` | N/A | `/v1/model/info` `03:107` | ML-T-004 | Evaluation tables | CONSISTENT |
| ML-NFR-001 | Must | Acceptance gates before production replacement | `docs/00:209–223` | Model registry log | `/v1/model/info` | ML-T-005 | Model registry | CONSISTENT |
| NLP-FR-001 | Must | Hotel multi-turn roleplay | `docs/01:261–276` | Chat scenario/session/message `04:112–165` | `/v1/chat/roleplay` | NLP-T-001 | NLP examples | CONSISTENT |
| NLP-FR-002 | Must | Tokenization, attention, seq2seq evidence | `docs/01:250–266` | N/A | Chat endpoint | NLP-T-002 | NLP report | CONSISTENT |
| NLP-FR-003 | Must | T5-small production metadata/evaluation | `docs/01:250–276` | Model registry | `/v1/model/info` | NLP-T-003 | Model card | CONSISTENT |
| NLP-FR-004 | Must | Separate approved metrics, no combined score | `docs/02:153–154` | N/A | `/v1/model/info` | NLP-T-004 | NLP evaluation | CONSISTENT |
| NLP-FR-005 | Nice | Optional score in [0,1], omitted if unavailable | `docs/00:77,102` | Persistence deferred | `/v1/chat/roleplay` `03:71–85` | NLP-T-005 | Optional CoLA appendix | CONSISTENT after M0.5 |
| NLP-NFR-001 | Must | snake_case, lang=en, errors, CPU latency | `docs/00:216–220` | N/A | `/v1/chat/roleplay` | NLP-T-006 | NLP deployment | CONSISTENT |

## Cross-check rules

### M0.5 approved row corrections

The `P1-FR-010` and `P1-FR-011` rows above are superseded where their compact summaries conflict with the approved canonical baseline:

- `P1-FR-010`: UI supports `vi` and `en`, defaults and falls back to `vi`, and keeps `ja` as P2. Content lookup is requested locale → supported learner native locale → `vi` → `en` → explicit unavailable state.
- `P1-FR-011`: only a completed lesson exercise session or recorded vocabulary review qualifies; it increments at most once per local day using stored IANA timezone and `lastQualifyingActivityDate`. Points/rewards are P2; leaderboard is P3/out of scope.

These rows map to the normative M0.5 sections in `docs/01-architecture.md`, `docs/02-requirements.md`, and `docs/04-data-model.md`.

The following review-era status labels in the compact matrix are also superseded:

| Requirement | Canonical M0.5 status |
|---|---|
| `P1-FR-002` | `CONSISTENT logical baseline; implementation pending` — Course/Lesson/Vocabulary definitions are approved in `docs/04`. |
| `P1-FR-004` | `CONSISTENT; implementation pending` — ADR-003 defines the nullable 0–100 lesson aggregate, trusted calculation boundary, idempotent completion and no attempt table. |
| `P1-FR-006` | `IMPLEMENTED M1.3` — owner-checked, row-locked atomic RPC is applied and its DB tests pass. |
| `P1-FR-008` | `IMPLEMENTED M1.3` — ADMIN content/scenario policies are applied; learner mutation and ADMIN learner-data isolation tests pass. |
| `P1-FR-009` | `VERIFIED` — PA2 two-private-bucket path/type/size/ownership/visibility semantics pass live Auth/Storage HTTP tests, including exact 5 MB avatar and 10 MB audio boundaries. |
| `P1-NFR-001` | `IMPLEMENTED M1.3` — all 17 application tables have RLS and live grants/function audits pass. |

These implementation-pending labels are not semantic conflicts and do not reopen M0.5.

### Scope Gap Review approved resolutions

| Concern | Canonical resolution | Traceability effect |
|---|---|---|
| Vocabulary | Current Project 1 scope is published lesson vocabulary browsing, available audio playback, approved exercises, and SRS integration. Extra search/favorite/pronunciation/mastery/standalone-flashcard behavior is not implied. | Covered by existing `P1-FR-002`, `P1-FR-003`, and `P1-FR-005`; no new requirement ID or entity. |
| Grammar | Amended by ADR-006 (2026-08-15): `GRAMMAR` is an approved `ExerciseType` value delivered as `Exercise` rows on existing lessons. No Project 1 grammar curriculum, grammar schema, or grammar-progress entity. Optional `grammatical_acceptability_score` remains NLP-owned Nice/P2 and API-only. | Maps to new `P1-FR-012`; progress stays under `P1-FR-004`; `NLP-FR-005` unchanged; no persistence row added. |
| Listening | Amended by ADR-006 (2026-08-15): word-level scored `LISTENING` is approved and reuses the existing `vocabulary/{vocabularyId}/` Storage path. Sentence-level listening audio is rejected because it would require a new Storage path and a SEC-D8 amendment. | Maps to new `P1-FR-013`; vocabulary audio playback stays under `P1-FR-002`; legacy sentence-level examples remain superseded. |
| Quiz | “Quiz” may label the existing MCQ/FILL_BLANK/REORDER sequence but does not introduce Quiz/Attempt persistence. | Remains under `P1-FR-003`/`P1-FR-004`; attempt history stays deferred. |
| SRS | Scope is already approved; remaining gaps are implementation sequencing. Project 1 owns integration/persistence and ML owns model/Scheduler/evaluation. ADR-006 additionally makes the daily study goal (`Profile.dailyGoalMin`) a mapped requirement rather than an unreferenced field. | `record_review` remains in M1.3; deterministic seed in M1.4; mock API foundation in M1.5; Android foundation/connectivity in M1.6; due fallback and smart-review E2E require a later approved SRS integration task. Daily study goal maps to new `P1-FR-014`; `record_review` scope is unchanged. |
| Notification/Reminder | Amended by ADR-006 (2026-08-15): an Android-local reminder is approved, derived on-device from `dailyGoalMin` and `lastQualifyingActivityDate`. No server-side delivery, device token, FCM, notification-preference entity, or reminder-schedule entity is approved. `nextReviewAt` remains due state only. | Maps to new `P1-FR-015`; no API or data mapping is created; delivery is specified within a chosen window, never as an exact time. |

These resolutions clarify existing scope. They do not by themselves authorize application implementation. The `ExerciseType` enum addition for `GRAMMAR` and `LISTENING` is authorized by ADR-006 and still requires its own separately approved implementation task; the API contract is unchanged, and no new table or column is authorized.

1. Every Must requirement has an architecture reference and a planned test.
2. Requirements involving persistence have a data-model mapping; rows marked `MISSING`, `PROPOSED`, or `DEFERRED` cannot authorize implementation until resolved by an approved task.
3. Requirements involving HTTP/RPC have an API/RPC reference.
4. Every core endpoint, RPC and architecture boundary must map to at least one requirement; otherwise classify it as `N/A`, `MISSING`, `CONFLICT`, or `DEFERRED` rather than leaving a blank.
5. The AI boundary is unchanged: AI Server is stateless, receives learner history through requests, and does not own primary Supabase data.

## Planned test-ID groups

The IDs above are planning identifiers only. Test implementation and evidence belong to later approved implementation tasks:

- `P1-T-*`: Android, Supabase, Admin, RLS, Storage, locale, gamification and fallback checks.
- `ML-T-*`: model sanity, evaluation, acceptance and latency checks.
- `NLP-T-*`: contract, roleplay, metrics, optional scorer and latency checks.

# Task

Scope Gap Review — Project 1 learning capabilities

## Status

APPROVED

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

This is a documentation/research review task only. The agent may not approve it. No canonical documentation, requirement priority, architecture, schema, migration, API, Android/Admin code, ML/NLP implementation, dependency, database state, Word report, or commit may be changed while this task remains in `REVIEW`.

## Objective

Review Lingora's current canonical requirements and implemented foundation against the Project 1 product capabilities currently being considered, with special attention to:

1. Vocabulary
2. Grammar
3. Listening
4. Quiz
5. Study scheduling / SRS
6. Notification / Reminder

The review must identify what is already defined, partially defined, absent, deferred, or apparently inconsistent across requirements, architecture, data model, API contract, Android planning, and ML/NLP ownership. It must not turn an observed gap into an approved feature or priority.

## Workflow Gate

`PLAN → REVIEW → APPROVE → IMPLEMENT → TEST → LOG → COMMIT`

For this task, “IMPLEMENT” means only an explicitly approved documentation-resolution package. It does not authorize application feature implementation. Any later feature work requires its own plan and approval.

## Prior Active Task Preservation

The unapproved M1.3 security plan has been preserved without implementation at:

`plans/archive/2026-08-14-m1.3-auth-rls-record-review-REVIEW.md`

This Scope Gap Review does not approve, reject, or resolve M1.3's open security decisions.

## Canonical Sources To Review

- `docs/00-master-plan.md`
- `docs/01-architecture.md`
- `docs/02-requirements.md`
- `docs/03-api-contract.md`
- `docs/04-data-model.md`
- `docs/05-traceability-matrix.md`
- `logs/decision-log.md`, especially ADR-002 and ADR-003
- `lingora-admin/prisma/schema.prisma`
- current milestone/archive plans where they provide implementation status rather than semantics

Word reports are reporting outputs and must not be used to resolve technical semantics.

## Classification Rules

Each capability must be classified using only the following review labels:

- `PRESENT`: requirement and supporting boundaries are sufficiently defined for later implementation planning.
- `PARTIAL`: some layers are defined, but one or more required boundaries or implementation stages are missing.
- `MISSING`: no canonical requirement or supporting design exists.
- `CONFLICT`: two active-looking sources imply incompatible scope or behavior.
- `DEFERRED`: canonical material explicitly postpones the capability.
- `UNCLEAR`: terminology or ownership is ambiguous and requires human interpretation.

An item may use a compound label such as `PARTIAL / DEFERRED`. Classification is evidence, not a priority decision.

## Initial Gap Matrix For Review

| Capability | Current classification | What exists | Gap / inconsistency | Primary evidence |
|---|---|---|---|---|
| Vocabulary | `PARTIAL` | Must-level course/lesson/vocabulary browsing; normalized multilingual Vocabulary schema; lesson-vocabulary ordering; audio URL; SRS card relation; Admin CRUD is planned. | “Học từ vựng” is high-level wording, but no dedicated acceptance criteria define vocabulary detail/flashcard interaction, pronunciation playback behavior, search/filter, learned/mastered state, or whether browsing plus lesson exercises fully satisfies the feature. Do not assume these subfeatures are required. | `docs/02-requirements.md:29,223`; `docs/00-master-plan.md:77,94`; `lingora-admin/prisma/schema.prisma` Vocabulary/VocabularyTranslation/LessonVocabulary/UserVocabSrs. |
| Grammar | `PARTIAL / UNCLEAR` | Optional NLP `grammatical_acceptability_score` is Nice/P2, API-only, omitted when unavailable, and not persisted. | No requirement defines grammar lessons, grammar topics, explanations, grammar exercises, correction workflow, or learner grammar progress. “Grammar” could mean only the P2 chatbot scorer or a separate Project 1 learning capability; human intent is required. | `docs/02-requirements.md:124,153,214,256`; `docs/03-api-contract.md:71–85`; `docs/04-data-model.md:418–420`. |
| Listening | `CONFLICT / DEFERRED` | Legacy-preserved data-model examples mention `LISTENING`; architecture lists audio playback dependency; Vocabulary has `audioUrl`. | Approved exercise scope is only MCQ, FILL_BLANK and REORDER, and the applied schema excludes LISTENING. Master-plan cut rules explicitly remove LISTENING/MATCHING when reducing scope. It is unclear whether vocabulary audio playback alone is considered “Listening” or whether a scored listening exercise is desired later. | `docs/04-data-model.md:27–29,344`; `docs/02-requirements.md:216,224`; `docs/00-master-plan.md:82,104–107`; `schema.prisma:24–28`. |
| Quiz | `MISSING / UNCLEAR` | Exercise types and lesson-level aggregate progress exist. | “Quiz” does not occur in canonical docs, and there is no Quiz entity, quiz grouping, quiz attempt, submission history, pass threshold, timer, result summary, or requirement ID. Human must decide whether “quiz” is merely the existing lesson Exercise flow or a separate capability. Attempt history was explicitly deferred by ADR-003. | No `quiz` occurrence in docs/00–05 or current schema; `docs/02-requirements.md:224–225`; ADR-003 in `logs/decision-log.md`; Exercise/UserProgress in schema. |
| Study scheduling / SRS | `PARTIAL` | Must requirements, SRS API contract, DKT/HLR/Scheduler ownership, UserVocabSrs current state, ReviewLog history, due date/index, fallback concept and owner-checked atomic review invariant are defined. M1.2 schema is applied. | Auth/RLS/`record_review` remains unimplemented; `get_due_srs_cards` fallback is documented but not yet planned as an approved implementation task; FastAPI model/Scheduler and Android smart-review flow are not implemented. Reminder delivery is not part of SRS semantics today. | `docs/02-requirements.md:226–227,238–245`; `docs/03-api-contract.md:11–53`; `docs/04-data-model.md:74–109,281–324,399–407`; `docs/05: P1-FR-005/006`; schema UserVocabSrs/ReviewLog. |
| Notification / Reminder | `MISSING` | `nextReviewAt` represents when a card becomes due. | No requirement, architecture component, Android notification plan, permission flow, device token/local scheduling model, user preference, timezone rule for reminders, delivery API, persistence field, cancellation/reschedule rule, or test exists. A due timestamp must not be interpreted as an approved notification feature. | No `notification` or `reminder` occurrence in canonical docs/schema; `UserVocabSrs.nextReviewAt` only. |

## Cross-Layer Impact Matrix

| Capability | Requirements impact | Architecture impact | Data-model impact | API impact | Android impact | ML/NLP impact |
|---|---|---|---|---|---|---|
| Vocabulary | May need clearer P1 acceptance criteria if “learn vocabulary” means more than browse/audio/exercises. | May need an explicit vocabulary-learning flow; current Supabase ownership remains valid. | Existing entities cover content and SRS linkage; extra learner state must not be invented. | No dedicated API is currently required; Supabase/PostgREST is the planned content path. | Screens/interactions and evidence are not specified beyond course/lesson browsing and high-level audio learning. | ML consumes review history only; vocabulary content ownership remains P1. NLP has no ownership. |
| Grammar | A new P1 requirement would be needed only if grammar learning is intended; current scorer is NLP Nice. | Separate grammar learning would add a P1 content capability; scorer remains an optional NLP integration. | No GrammarTopic/Rule/Progress schema exists; adding one would reopen data-model review. | Current chat field covers only optional acceptability score, not grammar curriculum/correction. | No grammar screen or exercise UX is specified. | NLP owns optional scorer; it must not silently become Project 1 grammar-course ownership. |
| Listening | Priority/scope must be clarified before requirement change. | Audio playback already exists conceptually; scored listening would require an exercise flow. | Vocabulary audio field exists; LISTENING exercise payload/schema does not. | No AI endpoint is needed unless separately designed; media uses Supabase Storage. | Audio playback versus scored listening permissions, UI and offline behavior are different work items. | No current ML/NLP ownership; speech recognition/synthesis must not be inferred. |
| Quiz | Requires a definition of whether Quiz equals a lesson's exercise sequence or is a separate feature. | Separate Quiz would introduce grouping/submission/result boundaries. | No Quiz or Attempt entity; ADR-003 stores lesson aggregate only and defers attempt history. | No Quiz endpoint/RPC exists. | Existing exercise UI could potentially satisfy a non-separate interpretation, but this is not approved. | No ML/NLP ownership unless a later explicit feature says otherwise. |
| SRS | Existing P1/ML requirements remain; implementation-state labels need tracking, not semantic redesign. | Boundaries are defined across Android → Supabase/FastAPI; fallback implementation ownership needs milestone placement. | Current state/history schema exists; RPC/security remains pending. | `/v1/srs/schedule` is canonical; `record_review` and fallback RPC implementation are pending. | Smart-review screen, timeout fallback and persistence orchestration remain later implementation. | ML owns DKT/HLR/Scheduler and evaluation; P1 owns mobile integration/persistence. |
| Notification/Reminder | New requirement and acceptance criteria would be necessary if included. | Must choose local Android scheduling, server push, or another architecture; none is approved. | Preferences/device tokens/reminder records may or may not be needed depending on architecture. | Push/server delivery could require an API; local reminders might not. No choice exists. | Requires notification permission, scheduling, timezone, deep-link and reschedule UX decisions. | SRS may supply due times, but ML must not own notification delivery. NLP has no impact. |

## Evidence Review Tasks

1. Trace every relevant Project 1 requirement ID to the six capabilities.
2. Separate high-level feature wording from measurable acceptance criteria.
3. Identify legacy-preserved examples superseded by ADR-002/ADR-003 or the applied schema.
4. Compare canonical design with actual M1.2 schema without treating implementation absence as a semantic conflict.
5. Distinguish content playback from assessed exercise behavior.
6. Distinguish SRS due-state calculation from reminder delivery.
7. Distinguish optional NLP grammar scoring from a Project 1 grammar curriculum.
8. Record every unsupported inference as `UNCLEAR` rather than proposing it as scope.

## Human Decisions Required

### GAP-D1 — Meaning of “Vocabulary learning”

Decide whether the current course/lesson vocabulary browsing, audio, exercises and SRS interface fully satisfy the intended Project 1 capability, or whether one or more separately named behaviors must be added. If adding behavior, define it before assigning priority.

### GAP-D2 — Meaning of “Grammar”

Decide whether Grammar means only the existing optional NLP acceptability score or a separate Project 1 learning capability. Do not treat the P2 scorer as evidence for grammar lessons or grammar progress.

### GAP-D3 — Listening scope

Decide whether listening remains deferred/out, means vocabulary audio playback only, or means a scored LISTENING exercise. This decision may not silently restore the legacy enum value.

### GAP-D4 — Quiz semantics

Decide whether “Quiz” is a user-facing label/grouping for the existing MCQ/FILL_BLANK/REORDER lesson exercise flow or a separate persisted feature. A separate Quiz/Attempt model would require a new data-model decision because attempt history is currently deferred.

### GAP-D5 — SRS completion boundary

Confirm which pending parts belong to the existing approved SRS scope and which milestone should plan them: Auth/RLS/`record_review`, fallback due-card retrieval, deterministic seed, FastAPI scheduling foundation, Android smart-review orchestration, and later ML model integration. This is milestone sequencing, not a scope expansion.

### GAP-D6 — Notification/Reminder product decision

Decide whether reminders are part of Project 1 at all. If yes, approve priority only after choosing a minimum product behavior and acceptance criteria; architecture and persistence must be reviewed afterward.

### GAP-D7 — Canonical terminology cleanup strategy

Decide whether legacy LISTENING examples in `docs/04` should later be annotated more visibly as superseded, while preserving history. This review must not edit them automatically.

## Final Gap / Decision Matrix

The table below is the review conclusion. “Project 1 owner” and “priority” are separate axes: `P1-FR-*` denotes the academic/software track, while P0/P1/P2 denotes delivery priority in the master plan.

| Decision | Final evidence-based conclusion | Academic owner | Current canonical priority/status | Recommended resolution for human approval | Canonical change required if approved? |
|---|---|---|---|---|---|
| `GAP-D1` Vocabulary | The existing Project 1 scope already covers published vocabulary browsing inside Course/Lesson, vocabulary audio, three exercise types, and integration with SRS. Dedicated flashcard mode, search/favorite lists, pronunciation scoring and a separate mastery state are not defined. | Project 1 owns content, mobile UX and persistence; ML owns only SRS prediction/evaluation. | Vocabulary is P0/Must. The unspecified extra behaviors have no approved priority. | Treat the existing browse/audio/exercise/SRS boundary as the complete current Vocabulary scope. Any additional behavior requires a later requirement decision rather than being inferred from the word “Vocabulary.” | Clarification-only wording in requirements/traceability; no schema/API change. |
| `GAP-D2` Grammar | The only approved Grammar-related capability is optional `grammatical_acceptability_score` in chatbot output. There is no grammar curriculum or grammar-learning progress. | NLP owns the optional scorer. Project 1 only displays/integrates it when available. | Scorer is Nice/P2. Grammar lessons/exercises are absent, not Must. | Keep grammar curriculum outside current Project 1 scope. Preserve the scorer as optional NLP P2 and do not create Grammar entities/screens. | At most a terminology clarification; no schema/API semantic change. |
| `GAP-D3` Listening | Vocabulary audio playback and a scored LISTENING exercise are different capabilities. Audio playback is already part of the vocabulary plan; LISTENING appears only in legacy examples and is excluded from the approved three-type schema. | Project 1 owns media playback and any future listening exercise. No current ML/NLP ownership is implied. | Vocabulary/audio belongs to the existing P0/Must learning flow. Scored LISTENING is cut/deferred under the current plan and is not in the applied schema. | Keep vocabulary audio playback in current P1. Keep scored LISTENING exercise deferred/P2 unless a future human decision explicitly restores it. | Annotate legacy wording only; no enum/schema change. |
| `GAP-D4` Quiz | Canonical scope has a lesson Exercise sequence and lesson-level aggregate progress, but no separate Quiz concept or attempt history. | Project 1. | MCQ/FILL_BLANK/REORDER are Must. A separate Quiz feature has no approved priority; attempt history is deferred. | Treat “quiz” only as an optional user-facing/report label for the existing lesson exercise sequence, not a new entity or persistence model. A distinct timed/grouped Quiz requires a new semantic task. | Clarification-only if the term is used; no schema/API change. |
| `GAP-D5` SRS | SRS scope is semantically defined but only the M1.2 data foundation is implemented. The pending work is implementation sequencing, not a requirement gap. | Project 1 owns Auth/RLS/RPC, Android orchestration and persistent review flow. ML owns DKT/HLR/Scheduler/model evaluation. | P0/Must overall; advanced dual-model completion follows the approved ML acceptance plan. | Preserve scope. Resume M1.3 for Auth/RLS/`record_review`; M1.4 for deterministic seed; M1.5 for mock FastAPI foundation; M1.6 for Android foundation/connectivity. Place `get_due_srs_cards` and the complete smart-review flow in an explicitly approved later SRS integration task; do not silently add them to M1.3. | Plan/traceability implementation-status clarification only; no semantic redesign. |
| `GAP-D6` Notification/Reminder | Due timestamps exist, but no reminder product behavior exists at any layer. Notification delivery is not part of the approved SRS contract. | Would be Project 1 if added; ML may supply due time but does not own delivery. | `MISSING`; no canonical priority. | Recommended minimum-scope outcome is defer it outside the current Must baseline. If the human wants it, first approve a new requirement and priority, then review local-versus-server delivery. Do not label it P2 canonically without human approval. | None if deferred. New requirement/architecture design required if added. |
| `GAP-D7` Documentation cleanup | Legacy `docs/04` examples still show LISTENING/MATCHING and earlier enum wording, while later normative sections and the applied schema use only MCQ/FILL_BLANK/REORDER. | Documentation governance; no product ownership change. | Clarification task only. | Add a non-destructive “superseded by ADR-002/ADR-003 and applied schema” annotation in a separately approved canonical documentation update. Preserve historical text. | Yes, documentation-only after explicit approval. |

## Final Cross-Layer Impact

| Capability | Requirements | Architecture | API | Data model | Milestone/plan |
|---|---|---|---|---|---|
| Vocabulary | Existing `P1-FR-002/003/005` are sufficient if GAP-D1 is approved; clarify what is not implied. | No new component. Supabase content plus Android learning flow remains authoritative. | No new endpoint; content remains Supabase/PostgREST and SRS remains the existing AI contract. | Existing Vocabulary/Translation/LessonVocabulary/UserVocabSrs is sufficient. | Keep existing course/lesson/vocabulary and SRS tasks; do not add a new milestone. |
| Grammar | No new P1 FR. Keep `NLP-FR-005` Nice/P2 only. | Optional scorer remains inside NLP service boundary. | Preserve optional `grammatical_acceptability_score`; omission remains valid. | No grammar persistence. | Only schedule if P2 work is explicitly selected after Must work. |
| Listening | Vocabulary audio remains covered by current P1 learning/media scope. A scored exercise would require a new/changed FR. | Existing media playback is enough for audio; scored LISTENING would need later exercise design. | No new API for playback. | Keep `audioUrl`; do not restore LISTENING enum/payload. | Audio follows vocabulary implementation; scored LISTENING remains deferred. |
| Quiz | Existing exercise acceptance criteria remain authoritative. Separate Quiz requires a new FR. | No separate Quiz boundary under recommended resolution. | No new endpoint/RPC. | Keep Exercise plus lesson-level UserProgress; no Quiz/Attempt table. | Use existing lesson exercise task; no extra milestone. |
| SRS | Requirements already complete; update implementation status only when work is tested. | Existing Android/Supabase/FastAPI split remains. | Existing schedule contract; `record_review` and due fallback need separately approved implementation tasks. | M1.2 state/history schema remains sufficient. | Resume M1.3–M1.6 foundation sequence, then approve a specific smart-review integration task. |
| Notification/Reminder | No FR/NFR today. A new requirement is mandatory if added. | Local scheduling versus server push is unresolved. | None today; server-driven choice could require one later. | None today; do not add preferences/tokens/reminder tables. | Recommended deferred; no milestone until human approves product behavior and priority. |

## Minimum Proposed Documentation Delta

No delta is authorized during this REVIEW. If GAP-D1 through GAP-D7 are approved as recommended, the smallest later canonical update would be:

1. In `docs/02-requirements.md`, add a short scope clarification—not new features—stating:
   - current Vocabulary means published lesson vocabulary, audio playback, approved exercises and SRS integration;
   - Grammar curriculum is not in current scope; only the NLP P2 scorer exists;
   - vocabulary audio is not the same as a LISTENING exercise;
   - “Quiz,” if used in UI/report wording, refers to the existing lesson exercise sequence and does not imply Quiz/Attempt persistence;
   - Notification/Reminder is deferred unless separately approved.
2. In `docs/04-data-model.md`, annotate legacy LISTENING/MATCHING examples as superseded by ADR-002/ADR-003 and the applied three-type schema. Do not delete historical material.
3. In `docs/05-traceability-matrix.md`, clarify the existing P1-FR-002/003/005 mappings and implementation status. Do not invent a reminder row unless the feature is approved.
4. In the milestone plan, explicitly place `get_due_srs_cards` and end-to-end smart review in a later approved SRS integration task. Do not enlarge M1.3.

No architecture, API-contract or data-model semantic change is needed under the recommended resolutions.

## Mandatory Human Approval Checklist

- [ ] `GAP-D1`: Existing browse/audio/exercise/SRS behavior is the complete current Vocabulary scope.
- [ ] `GAP-D2`: Grammar curriculum remains out of current scope; optional NLP scorer remains P2.
- [ ] `GAP-D3`: Vocabulary audio remains P1 Must; scored LISTENING remains deferred/P2 and absent from schema.
- [ ] `GAP-D4`: Quiz is only a label for the existing exercise sequence; no separate Quiz/Attempt model.
- [ ] `GAP-D5`: Preserve SRS semantics and use the proposed implementation sequencing without expanding M1.3.
- [ ] `GAP-D6`: Notification/Reminder remains deferred with no priority unless separately approved.
- [ ] `GAP-D7`: Permit a later clarification-only annotation of superseded legacy wording.

Until all relevant boxes are approved, these remain review recommendations and may not be canonicalized.

## Conditional Plan / Milestone Recommendations

These are proposals for human consideration only and do not alter the master plan:

1. **No scope change:** add clarification-only requirement/traceability wording in a separately approved documentation task, then resume M1.3. Mark Quiz and Reminder as explicitly absent/deferred and Listening according to the approved interpretation.
2. **Clarify existing behavior:** if Vocabulary, Listening or Quiz are only labels for existing browse/audio/exercise flows, update acceptance criteria and report terminology without adding schema entities.
3. **Add a new P1 capability:** create a separate semantic design task before milestone placement. It must define requirement ID, priority, acceptance criteria, architecture/data/API impact and tests before implementation planning.
4. **SRS sequencing only:** preserve the approved SRS scope and map its unfinished components to existing M1.3–M1.6/later milestones after human review; do not redesign ML/NLP.
5. **Reminder candidate:** if approved, schedule it only after the human chooses local versus server-driven delivery and after SRS due-state behavior is stable. No milestone number is assigned by this review.

## Proposed Deliverables After Approval

If this review task is approved, produce documentation-only review artifacts:

- a finalized evidence-backed gap matrix;
- a source/reference inventory with exact headings/line references;
- a conflict and terminology register;
- a decision package for GAP-D1 through GAP-D7;
- a proposed requirement/traceability delta, clearly marked non-canonical until separately approved;
- a conditional milestone impact map.

No canonical change is included unless the human later approves a specific delta.

## Files Expected To Change After Approval

- `plans/current-task.md` lifecycle and finalized review content
- optionally a new file under `plans/research/` or `plans/reviews/` if an existing convention supports it and the human approves the deliverable location
- `logs/development-log.md` and `logs/test-log.md` only after the approved review is completed and validated

Canonical `docs/00–05` are evidence inputs, not expected outputs of this review.

## Out of Scope

- Choosing or changing Must/Nice/P2/P3 priority.
- Adding requirement IDs or acceptance criteria directly to canonical docs.
- Resolving product intent without human approval.
- Editing architecture, API contract or data-model semantics.
- Creating Quiz, Grammar, Notification, Listening or Vocabulary feature schema.
- Creating migration, SQL, RLS, RPC, seed or database data.
- Implementing Android/Admin/FastAPI/ML/NLP functionality.
- Selecting notification vendors, libraries or dependencies.
- Training speech, grammar, SRS or NLP models.
- Editing Word reports or fabricating evidence.
- Resuming M1.3 implementation.
- Committing changes.

## Review Validation Plan

- `SGR-T-001`: every matrix claim has a canonical file/section/line reference or an explicit zero-occurrence result.
- `SGR-T-002`: Vocabulary, Grammar, Listening, Quiz, SRS and Notification/Reminder each have a classification and cross-layer impact.
- `SGR-T-003`: legacy wording is distinguished from later approved normative decisions and actual schema.
- `SGR-T-004`: no classification silently changes priority or creates a requirement.
- `SGR-T-005`: Project 1, ML and NLP ownership remain separated.
- `SGR-T-006`: no canonical doc, schema, migration, code, dependency, database or Word report is modified.
- `SGR-T-007`: preserved M1.3 plan exists and remains unapproved/unimplemented.
- `SGR-T-008`: `git diff --check` passes and no credential is exposed.

## Acceptance Criteria

- The six requested capabilities are classified consistently using evidence.
- “Missing implementation” is not confused with “missing requirement.”
- Every conflict or ambiguity is visible and not silently resolved.
- Human decisions identify the minimum question to answer without recommending priority as fact.
- Conditional milestone impacts are clearly non-canonical.
- No feature implementation or canonical semantic change occurs.

## Risks

- Legacy-preserved examples can be mistaken for current approved scope, especially LISTENING.
- “Grammar” can be confused with the optional NLP scorer rather than a learning capability.
- “Quiz” can duplicate the current Exercise flow or reopen deferred attempt-history semantics.
- `nextReviewAt` can be incorrectly treated as proof that notifications are already designed.
- A gap review can unintentionally expand scope if suggestions are written as requirements.
- Pausing M1.3 without preserving its review state could lose security decisions; the snapshot prevents that.

## Questions / Decisions Needed

Human review is required for GAP-D1 through GAP-D7. Until then, all initial classifications and milestone suggestions remain review findings only.

## Approval

Status: APPROVED
Approved by: Human product owner
Date: 2026-08-14

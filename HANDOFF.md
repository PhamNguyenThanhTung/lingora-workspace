# Lingora — Agent Handoff Brief

> Updated whenever a task moves to `DONE` or `BLOCKED`. Keep only current state — not a history log.
> Read this after `docs/QUICK-REF.md` when starting a new session or resuming after a task gap.

---

## Current state

- Latest task: `align-uc-scope-and-report-status` — DONE. UC-01..UC-10 are official in-scope features in active canonical docs and Markdown reports; UC-09/UC-10 have canonical `P1-FR-016/017` entries and traceability rows. Runtime/schema/API implementation remains separately gated and is not claimed as complete. Scope scan and `git diff --check` pass.

- Latest task: `standardize-plantuml-english-technical-terminology` — DONE. Standardized all 22 PlantUML files across `docs/plantuml/`: actors (`Learner`, `Admin`), Use Cases (`UC-01`..`UC-10`), system boundary (`Lingora Web Learning System`), lifelines, DFD processes/stores, and ERD packages use standard English technical terminology without internal model branding in UC bubbles. Kept natural Vietnamese action steps in Activity diagrams and clear Vietnamese message labels on Sequence arrows. PlantUML compiler validation (22/22 PASS), PNG rendering (22/22 PASS), and `git diff --check` (PASS).

- Latest task: `vietnamize-all-plantuml-diagrams` — SUPERSEDED by `standardize-plantuml-english-technical-terminology`.

- Latest task: `complete-plantuml-coverage-and-integrate-reports` — DONE. Current documentation now uses the contiguous `UC-01`..`UC-10` catalog; UC-09 Placement and UC-10 Private Achievements remain `PROPOSED / NOT IMPLEMENTED`. Learner and Admin are the only external Use Case actors, both outside the Lingora boundary with solid non-arrow associations. GEC/T5-small is documented as internal processing. The PlantUML catalog contains 22 compiling sources, including Level 0 and detailed Lesson/Exercise, SRS and GEC DFDs. The ERD reports 15 active + 2 legacy/deprecated physical models and excludes proposed entities. Markdown reports retain six original interviews plus three supplementary records without combining frequencies. Final audit: 22/22 PlantUML compile PASS; actor/UC/ERD/catalog/interview scans PASS.

- Latest task: `redesign-requirements-presentation-deck-with-visual-cards-and-image-placeholders` — DONE. Redesigned all 19 slides of `docs/report/Lingora-Project-1-Requirements-Presentation.pptx` using modern card layouts, typography (Segoe UI), status badges, single-line dynamic titles, and dedicated image placeholders with guidance text on key slides (Slides 1, 4, 7, 8, 10, 11, 14, 16, 17). 100% template fidelity preserved (UTC logo, header banner, footer graphics). All 19 slides rendered, visual checks and boundary layout validation passed.

- Latest task: `add-supplementary-interview-evidence-to-presentation` — DONE. The 19-slide Lingora requirements deck was fully restructured to the user-specified defense flow. Slides 7-8 now include the three newly supplied interview records as supplementary anonymized evidence; they are not mixed into the original six-record frequencies. The deck includes team/topic ownership, visual agenda, introduction, current state, problem framing, elicitation, benchmark, Use Case overview, UC-05/UC-06 Acceptance Criteria, FR/NFR, modeling, verification, current-status conclusion and Q&A. All 19 slides render and the overflow test passes.

- Latest task: `generate-19-slide-lingora-requirements-presentation` — DONE. Rebuilt `docs/report/Lingora-Project-1-Requirements-Presentation.pptx` as a 19-slide Vietnamese academic deck using the supplied university template. The deck preserves evidence boundaries, labels UC-09/UC-10 proposed, uses the 17/15/2 model-count decision, removes unsupported latency claims, and keeps Slide 18 limited to current status/verification. All 19 slides rendered; visual review and automated overflow check pass.

- Latest task: `integrate-requirements-research-sections-into-lecturer-report` — DONE. Expanded the Vietnamese lecturer-format report with requirements elicitation, interview findings, benchmark, FR/NFR, User Story/Acceptance Criteria, validation, change management and traceability. Created `docs/report/Lingora-Project-1-Requirements-Presentation.pptx` as a 14-slide deck cloned from `D:\TimHieuPaper_Nhom16.pptx` without modifying the source. Speaker notes cite the PDF, interview evidence, canonical docs and the approved ERD model-count decision. Physical schema is reported as 17 models; active business flow is 15; `ChatSession`/`ChatMessage` are legacy/deprecated pending formal migration cleanup; UC-09/UC-10 proposed entities are excluded from counts. DOCX title sanitation, deck template fidelity, overflow and full-slide visual QA pass. LibreOffice DOCX render remains unavailable.

- Latest task: `cleanup-legacy-chatbot-and-prepare-gec` — DONE. UC-06 report,
  evidence register and approved PlantUML diagrams now describe optional
  browser SpeechRecognition input and Speech Synthesis playback. The backend
  remains text-in/text-out with canonical `original_text` and
  `scenario_code`; no speech service, audio persistence, schema, migration or
  runtime change was made. All 15 PlantUML sources compile and the rebuilt DOCX
  passes Google Docs title sanitization. Visual DOCX render remains unavailable
  because LibreOffice/soffice is not installed.

- Current task: `project-1-requirements-report-docx` — report Markdown and Google Docs-targeted DOCX created. Interview review confirms alignment with UC-02/03/05/07/08 and partial UC-06; UC-09/UC-10 remain proposed. DOCX title sanitizer and structural checks pass. Visual render QA is pending because LibreOffice/soffice is unavailable (`WinError 2`).
- Latest task: `complete-project-1-five-chapter-report` — complete Vietnamese five-chapter Markdown and DOCX created at `docs/report/`. It follows the requested university structure, keeps the approved two-track scope, and marks unimplemented/proposed content explicitly. Structural/title checks pass; visual render remains unavailable because LibreOffice/soffice is not installed.
- Latest report revision: `restructure-project-report-to-lecturer-format` — created `docs/report/lingora-project-1-lecturer-format.md` and `docs/report/Lingora-Project-1-Lecturer-Format.docx` following the lecturer PDF: Part I contains survey/interview requirements; Part II contains BFD/DFD/analysis; Part III contains database design; Part IV contains conclusion. UI/UX is deferred and not presented as current scope.

- Last completed task: `report-requirements-use-case-realignment` — DONE. Created the report source `docs/report/lingora-requirements-and-use-cases.md`, evidence register and 15 PlantUML sources. The report covers the lecturer's elicitation, User Story/Acceptance Criteria, FR/NFR, Use Case, Activity, DFD, ERD, validation and traceability requirements. UC-09 Placement Test and UC-10 private Achievements/Badges are approved proposed targets, not implemented. PlantUML compiler validation: 15/15 PASS.

- Last completed task: `two-track-se-ml-gec-scope-amendment` — DONE. ADR-010 consolidates the future target into Software Engineering plus T5-small GEC. The documentation amendment did not change Web/FastAPI/model/database implementation.

- Previous completed task: `requirements-system-analysis-documentation-recovery` — DONE. Created authoritative
  [`docs/06-system-analysis.md`](docs/06-system-analysis.md) (problem statement, 6 capabilities, stakeholder/actor
  catalog, boundaries, 8 Use Cases, sequence flows, assumptions/constraints, audit findings register) and
  [`docs/07-data-dictionary.md`](docs/07-data-dictionary.md) (implementation-grounded ERD with 17 models, 24 FKs,
  attribute constraints, private storage buckets, schema mismatch table). Updated [`docs/05-traceability-matrix.md`](docs/05-traceability-matrix.md)
  and reading order in [`docs/project-1/README.md`](docs/project-1/README.md).
  Evidence: `RSA-T-001` .. `RSA-T-009` (all 9 checks PASS).
- Previous implementation milestones:
  - `M1.6W` Web learner foundation DONE (Next.js 15, SSR Auth, Route Handler proxy to AI, 19/19 Vitest unit tests, Playwright e2e).
  - `M1.5` JWT verifier amendment DONE (Supabase JWKS / ES256 & HS256 compatibility, 37/37 Pytest PASS).
  - `M1.4` Seed & RLS test harness DONE (34/34 tests PASS).
  - `M1.3` Auth + RLS + Storage (two-bucket) + `record_review` DONE.
  - `M1.2` Prisma + Supabase schema DONE (17 models, 3 migrations).
- Last approved scope decision: `ADR-010 — Two-track consolidation: Software Engineering + Transformer GEC`.
- Next implementation tasks remain separately gated: M2 Web core flow, deterministic SRS audit, GEC API foundation, scenario-writing UI and model training/evaluation.
- Public staging snapshot: `staging/lingora-workspace-public/` — pre-reset; regeneration pending.

---

## Pending decisions / open questions

- Exact SRS policy name remains pending a read-only audit of `record_review`; do not call it SM-2 without evidence.
- GEC offset units, input limit, dataset/license and benchmark protocol must be locked in their implementation plans.
- Legacy `/v1/srs/schedule` and `/v1/chat/roleplay` remain implemented compatibility endpoints until consumers migrate.

- `ADR-006` scope remains **approved and documented, not implemented**: enum `GRAMMAR`, listening option `4a`
  (word-level audio), `dailyGoalMin` UI. Payload shapes for `GRAMMAR` and `LISTENING` belong to the M2 implementation task.
- Reminder options `6a` (PWA/service worker notification) and `6b` (Web Push + `push_subscriptions` + scheduler,
  VAPID, a sender outside `lingora-web`) are **DEFERRED, not rejected**. Re-entry needs a new plan and a new ADR;
  it does not require reversing `ADR-008`.
- Option `6d` (in-app reminder) is approved for later feature milestone (M2+).
- `staging/lingora-workspace-public/` must be regenerated under its own approved task before any public
  publication — it now contradicts the canonical docs on platform.
- `.codex/` and `.agents/` cleanup deferred; safe checkpoint is commit `d0e4276`.

---

## Do NOT do next

- Do not implement M2 feature code without an approved `plans/current-task.md` for Milestone M2.
- Do not implement UC-09 placement test or UC-10 achievements/badges from the report alone. Create and approve separate implementation plans that lock scoring/badge policy, data/API/RLS impact and tests.
- Do not modify database schema, migrations, RLS, or RPC without an approved plan and ADR.
- Do not reintroduce Android, Gradle/AGP, Retrofit, Room, or APK into active codebase.
- Do not add a service worker, web app manifest, PWA install flow, push code, or scheduler — `6a`/`6b` are deferred.
- Do not touch `lingora-ai/api/` runtime without an approved task; current verifier supports both ES256 and HS256.
- Do not implement `/v1/gec/correct`, scenario UI, model training, endpoint deprecation or cleanup without their own approved follow-up task.
- Do not place secrets in code, logs, screenshots, fixtures, or commits.
- Do not amend or rebase historical commits, and do not rewrite Git history or force-push.

---

## Suggested next step

Draft `plans/current-task.md` for **`m2-web-core-lesson-flow`** (Milestone M2):
- Implement Course/Lesson navigation and lesson player in `lingora-web/`.
- Implement interactive exercise engine supporting `MCQ`, `FILL_BLANK`, `REORDER` (plus `GRAMMAR` and `LISTENING` per ADR-006).
- Implement lesson progress scoring (0–100%) and atomic completion update to `UserProgress`.
- Verify responsive layouts and accessibility.

---

## Context not in code

- The platform switch was a human decision made on 2026-08-17 with the assignment-title risk raised and
  knowingly accepted (risk `R12` in `docs/00-master-plan.md`, recorded in `ADR-008`).
- Learner AI calls go through Next.js Route Handler proxy (`/api/ai/srs`, `/api/ai/chat`) rather than browser-to-FastAPI directly.
- Storage two-bucket split (`lingora-avatars` / `lingora-media`) is strictly enforced at database/storage level.
- The internal GEC FastAPI component is stateless by design; it never reads/writes Supabase directly.
- `MOCK_MODE=true` is supported for mock inference during development.

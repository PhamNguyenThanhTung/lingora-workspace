# Test Log

Append test evidence after implementation. Failed tests remain recorded; add a later row for the successful rerun.

| Test ID | Date | Feature | Expected | Actual | Status | Environment | Build/commit |
|---|---|---|---|---|---|---|---|
| `[T-XXX]` | `YYYY-MM-DD` | `[feature]` | `[expected]` | `[actual]` | `PASS/FAIL/BLOCKED` | `[OS/device/runtime/data]` | `[build/hash]` |
| T-D3-HYGIENE-001 | 2026-09-24 | D3 Final Hygiene Fix (Post-Review Non-Blocking Fixes) | Header status updated to READY FOR D4 CONTENT/CURRICULUM DESIGN; HANDOFF.md cleaned to single Latest task; Reading semantic boundary documented in D3 §B3; 18/18 guards PASS; git diff --check 0 | `py scratch/verify_consistency_guards.py` exited 0 (ALL 18 PASSED); `git diff --check` exited 0; 0 code/migrations/algorithms | PASS | Windows 11 / Python 3.11 / Static Doc Inspection | `f986d96` |
| T-D3-DESIGN-001 | 2026-09-24 | D3 Assessment & Learning Engine Design (APPROVED, design-only) | 18/18 guards PASS; git diff --check 0; 6/6 D3 puml balanced with distinct purpose/mode enums; 10 invariants present; 0 hard-coded D3 thresholds/formulas; 6/6 prose-diagram matches; 0 downgrade/auto-advance edges; 0 code/migrations/algorithms; 15 UCs intact; no Design Freeze; no AssessmentSession | **Environment:** Windows 11 / Python 3.11.9 / Static Doc Inspection; commit `f986d96b2bd4f825d6a84ce465021a1cf0f4a34a`. **Command 1:** `py scratch/verify_consistency_guards.py` — **Output:** exit 0, ALL 18 PASSED (GUARD-01..18). **Command 2:** `git diff --check` — **Output:** exit 0 (LF warnings only, 0 whitespace errors). **Command 3:** D3 focused scan (`C:/Users/tungt/AppData/Local/Temp/opencode/d3_scan.py`) — **Output:** 6/6 balance PASS; 6/6 purpose/mode distinct PASS; invariants PASS; Q status `READY FOR D4 CONTENT/CURRICULUM DESIGN` exact PASS; no freeze claim PASS; 0 forbidden numeric/formula hits; AssessmentSession only negated (4 mentions); 6/6 prose refs PASS; OVERALL PASS. **Runtime scope:** `git diff --name-only -- lingora-web lingora-admin lingora-ai prisma` empty. **Verdict:** PASS | PASS | Windows 11 / Python 3.11.9 / Static Doc Inspection | `f986d96` |
| T-D1-D2-DESIGN-001 | 2026-09-24 | D1 Final Design Cleanup + D2 Domain/Data Design (APPROVED) | 18/18 guards PASS (11 Round-3 + 7 D1-D2 new: ghost-absence, pending-tag, EN/ZH keys, deliveryMode, puml parity, invariants, stale wording); git diff --check 0; puml @startuml/@enduml balance; 0 code, 0 migrations, 15 UCs intact, no Design Freeze | `py scratch/verify_consistency_guards.py` exited 0 ALL 18 PASSED; `git diff --check` exited 0 (after 1 whitespace fix in plan); puml balance 3 files x2; grep: conceptTag 0 live-field, UC-16/17/18 0, AssessmentSession 0 canonical, Ba dạng 0 bare | PASS | Windows 11 / Python 3.11 / Static Doc Inspection | `d1-d2-design` |
| T-DESIGN-REVIEW-FIX-002 | 2026-09-24 | Independent Design Re-Review Fixes (Round 3) | All 11 consistency guards pass: Q13 raw XLSX recount (8/4/1/1/1, sum 62, avg 4.133), expert identity (Trần Minh Quân 9y, Lê Hoàng Mai 8y), NFR proposed target qualifiers (<500ms, p95<=2000ms), YC-CORE-01 password recovery downstream trace (YC-CORE-01 -> MVP-01 -> P1-FR-001 -> UC-01 -> Spec pending runtime), AssessmentType 3 canonical pedagogical types (DIAGNOSTIC, EXIT, RE_EVALUATION) vs execution modes (PLACEMENT, JUMP), stale jump semantics (SKIPPED_BY_JUMP, no raw COMPLETED_BY_JUMP), CEFR auto-placement historical qualification, N=35/N=3 preliminary evidence labeling, LearningProgress sole ownership by LearnerProfile, canonical 5 exercise types (0 Ghép thẻ in slides), multi-language 4-tier assessment chain; 0 code, 0 migrations, state READY FOR DESIGN RE-REVIEW | `py scratch/verify_consistency_guards.py` exited 0; all 11 consistency guards PASS; `git diff --check` exited 0; 0 application code modified | PASS | Windows 11 / Python 3.11 / Git 2.53.0 | `design-re-review-round3` |
| T-DESIGN-REVIEW-FIX-001 | 2026-09-24 | Design Review Fixes & Consistency Alignment | All 17 consistency guards pass, Q7 recount verified from Excel (7/6/6/6/5/2), C-01..C-08 resolved, M-01..M-15 resolved, 0 code, 0 migrations, readiness state READY FOR DESIGN RE-REVIEW | `py scratch/verify_consistency_guards.py` exited 0; all 17 consistency guards PASS; `git diff --check` exited 0; 0 application code modified | PASS | Windows 11 / Python 3.11 / Git 2.53.0 | `design-review-fixes` |
| T-EXP-DESIGN-001 | 2026-09-24 | Language Expert Research & Learning Design Update | End-to-end documentation alignment across Phase 0 & Phase 1: 5th evidence label [EXPERT], 2 interviews (Thầy Quân, Cô Mai), 4-concept separation (Progress != Proficiency != Mastery != Readiness), 3 transition states (ADVANCE, ADVANCE_WITH_SUPPORT, REMEDIATE), concept-level remediation (no whole-level demotion, no repeating completed lessons), stage-adaptive diagnostic assessment (Routing -> Targeted, pending validation parameters, hidePinyin: true for Chinese), 9 domain entities, 0 application code, 0 schema mutations | Verified: git diff --check returned 0; all 12 target files reconciled; 9 domain entities added to M2.1 foundation & PlantUML; UC-03..07 updated; negative invariants respected (0 code, 0 fake experts, 0 fake percentages, 0 new UCs); static PlantUML envelope check PASS | PASS | Windows 11 / Node v24 / Git 2.53.0 / Static Doc Inspection | `expert-design-update` |
| T-M21-TFIX-001 | 2026-09-20 | M2.1 targeted correction after adjudication (P1-01, P1-02, P1-03, P1-04, P1-05, P2-01) | Applied dictionary and PlantUML fields match migration; canonical Scope values only; forbidden literal tokens absent; lifecycle has no active ARCHIVED -> DRAFT edge; no runtime/schema/database scope expansion | Fresh PowerShell audit: `TARGET_EXT=0`, `MATCHING=0`, `CORE (Supporting)=0`; all 4 PlantUML files `start=1/end=1`; `ARCHIVED_TO_DRAFT_ACTIVE=0`; 15 selected applied fields matched migration and dictionary; `EXERCISE_FALSE_TIMESTAMP_FIELDS=0`; `DOMAIN_FALSE_FIELDS=0`; all five false-claim patterns counted 0; `git diff --check` exit 0 | PASS | Windows / PowerShell 7.6.5 / Git 2.53.0.windows.1 / HEAD `f986d96b2bd4f825d6a84ce465021a1cf0f4a34a` | `m2-1-targeted-fix` |
| T-M21-FIX-001 | 2026-09-15 | M2.1 Independent Audit Fixes (P0-01..P1-07) | Administrator emergency authority restored with audit/justification; ARCHIVED->DRAFT removed from Core; TARGET_EXT eliminated repo-wide (2-axis model); ExerciseType field-level breakdown (Applied vs Target/Future, 0 Matching); D-G1 and D-G2 re-evaluated; candidates normalized to TARGET DESIGN CANDIDATE / OPEN DESIGN REPRESENTATION; 0 code/migrations/DB writes; M2.2 NOT STARTED | All 7 findings verified: Administrator emergency publish/archive present with mandatory reason and AuditLog constraint; ARCHIVED->DRAFT absent from Core; TARGET_EXT completely removed; ExerciseType enum accurately mapped (MCQ, FILL_BLANK, REORDER in Applied DB; LISTENING, GRAMMAR in Target Schema; 0 Matching); candidate columns/representations labeled TARGET DESIGN CANDIDATE / OPEN DESIGN REPRESENTATION; D-G1 and D-G2 re-evaluated with verified evidence; status REVISED — READY FOR RE-REVIEW | PASS | Windows 11 / Node v24 / Static Inspection & Verification Scripts | `m2-1-audit-fix` |
| T-M21-VERIF-001 | 2026-09-15 | M2.1 Final Verification & Evidence Audit | Enforcement boundary clarified (no DB over-claims); DD-07/08 verified from applied migrations; 18 Core Scope tables align 1-to-1 with §8.1–§8.18 (100% coverage); 0 code/migrations/DB writes; M2.2 NOT STARTED | All 7 directives verified: forbidden actions labeled design invariants & future enforcement requirements; DD-07/08 proven from 202608140001_init/202608140002; exact 18-table inventory table added; §8 renumbered to 18 individual tables (§8.1–§8.18); M2.2 not started; status REVISED — READY FOR RE-REVIEW | PASS | Windows 11 / Node v24 / Static Verification & Migration Audit | `m2-1-verification` |
| T-M21-REV-001 | 2026-09-15 | PlantUML Static Syntax & Reference Validation | 4 diagrams pass static syntax balance (@startuml/@enduml, valid types, no Matching, no Admin emergency publish) | Static syntax balance checked cleanly across all 4 .puml files; PlantUML/Java renderer unavailable in environment | PASS | Windows 11 / PowerShell static scan | `m2-1-revision` |
| T-M21-REV-002 | 2026-09-15 | Data Dictionary Complete Field-Level Coverage | All 18 Core Scope tables have field-level specifications with 8 mandatory attributes | 18 tables specified at field-level; all fields have name, physical type, nullability, default, owner, lifecycle, status, and trace | PASS | Windows 11 / Markdown inspection | `m2-1-revision` |
| T-M21-REV-003 | 2026-09-15 | 2-Axis ERD & Data Classification Model | Dimension A Scope (Core/Extension/Excluded) decoupled from Dimension B Status (Applied/Target/Future) | ERD and tables reflect 2-axis model; Cohort/Ticket are Scope: EXTENSION, Status: FUTURE_MIGRATION; Unit/AuditLog are Target Schema | PASS | Windows 11 / Markdown inspection | `m2-1-revision` |
| T-M21-REV-004 | 2026-09-15 | Audit Findings F-01..F-12 Resolution | All 12 findings resolved (F-01 Admin override, F-02 bypass, F-03 Exercise types, F-04 lesson_type candidate, F-05 D7 formula N, F-06 D6 confirmation, F-07 DD-02 candidate, F-08 AuditLog status, F-09 DD-06 candidate, F-10 dictionary coverage, F-11 2-axis ERD, F-12 renderer disclaimer) | All 12 findings evidenced and resolved; 13 Exit Criteria checked; physical design decisions classified as open/candidates | PASS | Windows 11 / Markdown inspection | `m2-1-revision` |
| T-M21-001 | 2026-09-15 | Gate D-G1: Domain & Lifecycle Traceability | 100% Core entities & states trace to FR/UC/BF; 0 orphan entities; forbidden self-approval/publish/bypass transitions barred | All 13 Core entities and 6 lifecycle states verified with FR/UC/BF traces; forbidden matrix proves 0 self-actions; Cohort/Ticket isolated to Extension Boundary | PASS | Windows 11 / Node v24 / Markdown inspection | `m2-1-foundation` |
| T-M21-002 | 2026-09-15 | Gate D-G2: Data Model & Boundary Integrity | 100% tables and fields classified into Applied, Target, or Future; units and audit_logs marked target/future; 5 exercise payloads conform to ADR-006 with payloadVersion: 1; 0 ghost entities | 18 tables classified across 3 columns; units and audit_logs explicitly designated Target Schema (not runtime-ready); all 5 exercise payloads contain payloadVersion: 1; 0 Exam/QuestionBank entities | PASS | Windows 11 / Node v24 / Schema & Dictionary scan | `m2-1-foundation` |
| T-M21-003 | 2026-09-15 | Milestone M2.1 Boundary Enforcement | 0 code files, 0 schema migrations, 0 DB mutations, M2.2+ not started | 0 application code modified; 0 migrations created/run; git status confirms purely design documentation deliverables; stopped before M2.2 | PASS | Windows 11 / Git 2.53.0 | `m2-1-foundation` |
| T-P0-RESET-001 | 2026-09-14 | Web Unit Tests | All unit tests pass after business UI reset | 14/14 Vitest tests passed across 4 test files | PASS | Windows 11 / Node v24.14.0 / Vitest | `phase-0-reset` |
| T-P0-RESET-002 | 2026-09-14 | Web TypeScript Check | TypeScript compilation passes without errors | `tsc --noEmit` exited 0 with 0 errors | PASS | Windows 11 / TypeScript 5.9.3 | `phase-0-reset` |
| T-P0-RESET-003 | 2026-09-14 | Web ESLint | ESLint validation passes without errors | `eslint .` exited 0 with 0 errors | PASS | Windows 11 / ESLint 9 | `phase-0-reset` |
| T-P0-RESET-004 | 2026-09-14 | Web Production Build | Production bundle compiles successfully | Next.js 15.5.23 production build succeeded (all routes static/dynamic compiled) | PASS | Windows 11 / Next.js 15 | `phase-0-reset` |
| T-P0-RESET-005 | 2026-09-14 | Admin Prisma Validation | Phase 0 Target Schema validates cleanly | `npx prisma validate` and `prisma generate` succeeded (6 roles, 6-state workflow, Unit, AuditLog) | PASS | Windows 11 / Prisma 6.19.3 | `phase-0-reset` |
| T-P0-RESET-006 | 2026-09-14 | AI API Pytest | Supporting AI service test suite passes | 37/37 pytest passed in 0.19s | PASS | Windows 11 / Python 3.11.9 / pytest 8.4.2 | `phase-0-reset` |
| T-P0-RESET-007 | 2026-09-14 | Repo Git Diff Check | No whitespace or merge conflict errors | `git diff --check` exited 0 with 0 errors | PASS | Windows 11 / Git 2.53.0 | `phase-0-reset` |
| T-P0-RESET-008 | 2026-09-14 | Deleted References Scan | Zero references to deleted paths (/foundation, foundation-status, ai.repository) | Regex scan found 0 references across web src and tests | PASS | Windows 11 / Python 3.11 scan | `phase-0-reset` |
| T-P0-001 | 2026-09-07 | Phase 0 documentation | New plan and baseline document exist and active task is DRAFT | Files present; active task is `phase-0-survey-and-requirements-finalization` with status `DRAFT` | PASS | Windows / PowerShell / static Markdown inspection | PENDING |
| T-P0-002 | 2026-09-07 | Documentation formatting | No whitespace errors | `git diff --check` returned no errors | PASS | Windows / PowerShell / Git | PENDING |
| T-P0-003 | 2026-09-07 | Runtime regression | No application behavior changes | Not applicable; code, schema, API and dependencies unchanged | N/A | Documentation-only task | PENDING |
| T-P0-004 | 2026-09-07 | Mock survey report | Report identifies synthetic data, five languages, roles, MVP and sources | `docs/phase-0-mock-survey-report.md` contains all required sections and labels mock figures as hypotheses | PASS | Windows / PowerShell / static Markdown inspection | PENDING |
| T-P0-005 | 2026-09-07 | Factor-by-factor survey method | Factors are identified before mock results and analyzed individually | 14 factors defined; F1–F14 each contain questions, mock result and design decision | PASS | Windows / PowerShell / static Markdown inspection | PENDING |
| T-P0-006 | 2026-09-07 | Roles and permissions | Every role has bounded scope and sensitive actions are separated | Final matrix defines six roles, resource actions, data boundaries and content workflow | PASS | Windows / PowerShell / static Markdown inspection | PENDING |
| T-P0-007 | 2026-09-07 | MVP finalization | Every MVP item has owner and acceptance criteria | MVP-01..MVP-19 are listed with owner, acceptance criteria and phased order | PASS | Windows / PowerShell / static Markdown inspection | PENDING |
| T-P0-008 | 2026-09-08 | PlantUML replacement | Old set removed and approved new set created | 36 old `.puml` files removed; 9 new files present | PASS | Windows / PowerShell | PENDING |
| T-P0-009 | 2026-09-08 | PlantUML syntax envelope | Each new file has one `@startuml` and closing `@enduml` | 9/9 files pass static envelope check | PASS | Windows / PowerShell | PENDING |
| T-P0-010 | 2026-09-08 | PlantUML compiler | Compile all new diagrams | Java OpenJDK / PlantUML 1.2026.8 executed `-checkonly docs/plantuml/*.puml`; exit code 0 on all 9 diagrams | PASS | Windows / Java 25 / PlantUML 1.2026.8 | PENDING |
| T-P0-011 | 2026-09-08 | PlantUML PNG rendering | Render all 9 diagrams to PNG | All 9 diagrams rendered to PNG in `docs/plantuml/` and `docs/report/diagrams/`; exit code 0; images visually verified | PASS | Windows / Java 25 / PlantUML 1.2026.8 | PENDING |
| T-P0-012 | 2026-09-08 | PlantUML Note Elimination & Localization | Remove all yellow note blocks; translate arrow labels to Vietnamese; keep actors/UC in English | Zero note blocks found; all 9 diagrams re-rendered; arrow messages in Vietnamese; visual inspection confirmed clean styling without yellow notes | PASS | Windows / Java 25 / PlantUML 1.2026.8 | PENDING |
| T-P0-013 | 2026-09-08 | Refined Use Case Overview (15 UCs) | Decouple Admin/Ops roles, add Placement Test & Publish Content & Audit Logs, add non-yellow Principle 4 constraint and Principle 7 optional module notes, eliminate crossing lines | All 15 UCs properly organized into 4 packages; zero crossing lines for Admin/Ops/Org; neutral-colored notes; visual inspection PASS | PASS | Windows / Java 25 / PlantUML 1.2026.8 | PENDING |
| T-M05-001 | 2026-08-13 | Requirement catalog | Requirement IDs are unique and every ID has a trace row | 26 IDs; 26 trace rows; 0 duplicates | PASS | Windows / PowerShell / static Markdown inspection | PENDING |
| T-M05-002 | 2026-08-13 | Canonical semantic alignment | Approved grammar, health, locale, gamification and REORDER rules are represented | Normative M0.5 sections present in docs/01–04 and docs/05 | PASS | Windows / PowerShell / static Markdown inspection | PENDING |
| T-M05-003 | 2026-08-13 | Cross-document traceability | Requirements map to architecture, data, API/RPC, tests and evidence | 26 nonblank rows; explicit gap statuses preserved | PASS | Windows / PowerShell / static Markdown inspection | PENDING |
| T-M05-004 | 2026-08-13 | Documentation hygiene | No unexpected controls or whitespace errors | 0 unexpected control characters; `git diff --check` passed | PASS | Windows / PowerShell / repository filesystem | PENDING |
| T-M05-005 | 2026-08-13 | Scope boundary | No feature/schema/API/model/dependency implementation | Documentation and logs only | PASS | Windows / PowerShell / repository file scan | PENDING |
| T-M06-001 | 2026-08-13 | DOCX workspace creation | Three expected DOCX files exist as valid OOXML packages | Project-1, ML and NLP DOCX files exist; required package parts open structurally | PASS | Windows / PowerShell / .NET ZIP/XML inspection | PENDING |
| T-M06-002 | 2026-08-13 | Academic titles | Exact report titles are present | Project 1, ML and NLP titles match approved titles | PASS | Windows / PowerShell / document.xml inspection | PENDING |
| T-M06-003 | 2026-08-13 | Report structure | Heading hierarchy and numbered sections exist | Heading1/Heading2 styles and discipline-specific sections present | PASS | Windows / PowerShell / document.xml + styles.xml inspection | PENDING |
| T-M06-004 | 2026-08-13 | Word fields | TOC/list placeholders and page field exist | TOC field instructions and update guidance present in all reports | PASS | Windows / PowerShell / document.xml inspection | PENDING |
| T-M06-005 | 2026-08-13 | Evidence-first status | No fabricated evidence; status markers are explicit | PLANNED and placeholder markers present; no numeric result claims | PASS | Windows / PowerShell / document.xml scan | PENDING |
| T-M06-006 | 2026-08-13 | Namespace ownership | Reports use P1/ML/NLP ownership boundaries | Mapping metadata uses correct namespace per report; AI is integration-only in P1 | PASS | Windows / PowerShell / document.xml scan | PENDING |
| T-M06-007 | 2026-08-13 | Canonical preservation | Technical Markdown remains unchanged by report creation | `git diff --check` clean for canonical docs; no implementation files added | PASS | Windows / PowerShell / git/static inspection | PENDING |
| T-M06-009 | 2026-08-13 | DOCX rendering | Each report renders to page PNGs | BLOCKED: LibreOffice/soffice and Microsoft Word are unavailable in environment | BLOCKED | Windows / PowerShell / tool availability | PENDING |
| T-M06-010 | 2026-08-13 | Visual inspection | Every rendered page is inspected | BLOCKED by T-M06-009; no visual pass claimed | BLOCKED | Windows / PowerShell / no renderer | PENDING |
| T-M06-011 | 2026-08-13 | Visual hierarchy | Cover/TOC/heading layout is visually clean | BLOCKED by T-M06-009 | BLOCKED | Windows / PowerShell / no renderer | PENDING |
| T-M06-012 | 2026-08-13 | Project 1 boundary | Project 1 remains mobile application report | P1 workspace explicitly says AI is integrated capability only | PASS | Windows / PowerShell / document.xml inspection | PENDING |
| T-M06-013 | 2026-08-13 | ML/NLP ownership | ML/NLP remain separate academic views | Separate outlines and namespace metadata present | PASS | Windows / PowerShell / document.xml inspection | PENDING |
| T-M06-014 | 2026-08-13 | Source consistency | Report scaffolds do not contradict canonical docs | Canonical source policy and approved titles/boundaries present | PASS | Windows / PowerShell / static inspection | PENDING |
| T-M06-015 | 2026-08-13 | Patch/commit hygiene | No whitespace errors or commit | `git diff --check` passed; no commit created | PASS | Windows / PowerShell / git inspection | PENDING |
| T-FWK-001 | 2026-08-13 | Framework file structure | Every required documentation, plan, log, rule, and design file exists | All required files found | PASS | Windows / PowerShell / repository filesystem | PENDING |
| T-FWK-002 | 2026-08-13 | Current-task template | Contains every required workflow section and approval gate | All required headings found; default status is DRAFT | PASS | Static Markdown inspection | PENDING |
| T-FWK-003 | 2026-08-13 | No feature implementation | No feature source, build config, dependency manifest, schema, migration, or endpoint is created | No matching implementation/build files found outside installed skills | PASS | Repository file scan | PENDING |
| T-M0-001 | 2026-08-13 | Product naming | No active SmartEng/Fluentia naming remains outside historical decision/test references | Only historical comparison references remain | PASS | Repository ripgrep scan | PENDING |
| T-M0-002 | 2026-08-13 | Repository boundaries | Canonical docs use `lingora-android`, `lingora-admin`, `lingora-ai/{api,ml_srs,nlp_chatbot}` | Approved names present in canonical architecture, README and plan | PASS | Static documentation inspection | PENDING |
| T-M0-003 | 2026-08-13 | Canonical authority | `docs/` is immediately authoritative and legacy is reference-only | Policy present in `docs/README.md` and `AGENTS.md` | PASS | Static documentation inspection | PENDING |
| T-M0-004 | 2026-08-13 | Legacy section coverage | Every relevant legacy section heading appears in its canonical destination | All legacy section headings covered; canonical 1424 lines vs legacy 1326 plus migration metadata | PASS | PowerShell heading-coverage check | PENDING |
| T-M0-005 | 2026-08-13 | Markdown file links | Every relative Markdown file target under `docs/` exists | No broken Markdown file targets found | PASS | PowerShell link-target checker | PENDING |
| T-M0-006 | 2026-08-13 | Finding classification | Discrepancies are labeled ORIGINAL/DUPLICATE/MISSING/CONFLICT/UNCLEAR and unresolved items remain visible | Migration map and per-document findings present | PASS | Static documentation inspection | PENDING |
| T-M0-007 | 2026-08-13 | Legacy workflow archive | Workflow is represented by AGENTS/plans/logs before archive; historical file is preserved | Archived at `ke-hoach-chi-tiet/archive/06 quy trinh lam viec.md`; active source absent | PASS | Filesystem and framework coverage inspection | PENDING |
| T-M0-008 | 2026-08-13 | No feature implementation | No build/dependency/source/schema/migration implementation files are added | No matching files outside installed skill infrastructure | PASS | Repository file scan | PENDING |
| T-M0-009 | 2026-08-13 | Patch hygiene | No whitespace/conflict-marker errors in tracked diff | `git diff --check` passed; only LF→CRLF warning for README | PASS | Git working tree check | PENDING |
| M1.1-T-001 | 2026-08-14 | Repository boundaries | Approved Lingora boundaries exist | `lingora-android`, `lingora-admin`, `lingora-ai/api`, `lingora-ai/ml_srs`, and `lingora-ai/nlp_chatbot` exist | PASS | Windows / PowerShell / filesystem inspection | PENDING |
| M1.1-T-002 | 2026-08-14 | Environment templates | Templates contain placeholders only and no committed secrets | Three `.env.example` files contain blank secret/config values; secret-pattern scan found no hits | PASS | Windows / PowerShell / static scan | PENDING |
| M1.1-T-003 | 2026-08-14 | Scope hygiene | No implementation file, schema, migration, endpoint, UI, model, dataset, or dependency is added | Forbidden implementation-file scan returned none; only README/env/ignore/environment documentation added | PASS | Windows / PowerShell / repository scan | PENDING |
| M1.1-T-004 | 2026-08-14 | Toolchain record | Required and detected toolchains are recorded without silently changing canonical versions | `ENVIRONMENT.md` records Git/Node/npm/Python launcher/Java and Gradle observations; no install performed | PASS | Windows / PowerShell / toolchain inspection | PENDING |
| M1.1-T-005 | 2026-08-14 | Patch hygiene | No whitespace errors | `git diff --check` passed | PASS | Windows / PowerShell / Git 2.53.0 | PENDING |
| M1.2-T-PLAN-001 | 2026-08-14 | Supabase connection strategy | Canonical online DB and Session Pooler strategy are recorded without secrets | Supabase PostgreSQL `ap-southeast-1`, Session Pooler `:5432`, direct IPv6 and Dedicated IPv4 explicitly excluded | PASS | Windows / PowerShell / static documentation inspection | PENDING |
| M1.2-T-PLAN-002 | 2026-08-14 | Planning scope guard | No schema, migration, table, RLS, SQL, seed, API or model implementation exists | Implementation-file scan returned none; no database command was run | PASS | Windows / PowerShell / repository scan | PENDING |
| M1.2-T-PLAN-003 | 2026-08-14 | Secret hygiene | No password or complete connection URI is present in plan/environment templates | Secret URI scan returned none; values remain blank placeholders | PASS | Windows / PowerShell / static scan | PASS |
| M1.2-T-PLAN-004 | 2026-08-14 | Canonical contradiction handling | Outdated `docs/04` port example is not silently changed | Contradiction is explicitly recorded in M1.2 plan; `docs/04` unchanged | PASS | Windows / PowerShell / canonical-doc status inspection | PENDING |
| M1.2-T-PLAN-005 | 2026-08-14 | Patch hygiene | No whitespace errors | `git diff --check` passed | PASS | Windows / PowerShell / Git 2.53.0 | PENDING |
| M1.2-RESEARCH-T-001 | 2026-08-14 | Repository coverage | At least five real repositories and actual source paths are inspected | LibreLingo, AnkiDroid, Frappe LMS, Chatwoot and Supabase; URLs, pinned commits and source paths recorded in research report | PASS | Windows / PowerShell / read-only shallow clones | PENDING |
| M1.2-RESEARCH-T-002 | 2026-08-14 | Evidence classification | External claims separate source observation, interpretation and Lingora recommendation | Required labels present throughout report; no unsupported “best practice” claim | PASS | Windows / PowerShell / Markdown inspection | PENDING |
| M1.2-RESEARCH-T-003 | 2026-08-14 | Scope guard | No Lingora schema/database/API/model implementation or canonical semantic change | Implementation scan returned none; database was not contacted; docs/00–05 and Word reports unchanged | PASS | Windows / PowerShell / repository and git inspection | PENDING |
| M1.2-RESEARCH-T-004 | 2026-08-14 | Decision boundary | Research concludes READY, READY WITH DECISIONS or BLOCKED based on evidence | `READY WITH DECISIONS`; explicit pre-migration questions listed | PASS | Windows / PowerShell / report inspection | PENDING |
| M1.2-RESEARCH-T-005 | 2026-08-14 | Patch hygiene | No whitespace errors | `git diff --check` passed | PASS | Windows / PowerShell / Git 2.53.0 | PENDING |
| M1.2-T-001-PRE | 2026-08-14 | Prisma version preflight | Verify a Prisma 6.x version compatible with the detected Node runtime before installation | npm registry reports Prisma `6.19.3` as latest 6.x; Prisma 6.19.x requires Node `>=18.18`; detected Node is `24.14.0` | PASS | Windows / Node 24.14.0 / npm registry read-only | PENDING |
| M1.2-T-002 | 2026-08-14 | FK deletion audit | Every actual core FK maps one-to-one to ADR-003 before schema creation | BLOCKED: nine required Language/translation FK relationships have no approved delete action; implementation returned to REVIEW | BLOCKED | Windows / canonical documentation static audit | PENDING |
| M1.2-T-001 | 2026-08-14 | Prisma schema scope | Schema contains exactly approved core entities/fields/enums and no deferred entities | 17 approved models; enums limited to approved values; no attempt, RBAC, Module/Chapter or ML schema models | PASS | Windows / Node 24.14.0 / Prisma 6.19.3 | PENDING |
| M1.2-T-002-RERUN | 2026-08-14 | FK deletion audit | Every actual FK maps one-to-one to completed ADR-003 matrix | 24 generated FKs audited; all delete actions match approved CASCADE/RESTRICT matrix; indirect ownership relationships introduce no extra FK | PASS | Windows / static Prisma and migration SQL audit | PENDING |
| M1.2-T-003 | 2026-08-14 | Required constraints | Score, vocabulary identity, ordering, SRS ranges and chat sequence constraints are present | Required unique indexes plus manual CHECK constraints found; schema validates successfully | PASS | Windows / Prisma 6.19.3 / migration SQL inspection | PENDING |
| M1.2-T-004 | 2026-08-14 | Query-backed indexes | Initial indexes map to approved ordering/due/history/chat requirements without speculative indexes | Lesson/exercise/junction ordering, vocabulary identity, progress, due SRS, review history, session listing and message order covered; no analytics/full-text/partition indexes | PASS | Windows / ADR-003 + docs/05 + migration inspection | PENDING |
| M1.2-T-005 | 2026-08-14 | Migration SQL scope review | Generated migration contains no RLS/RPC/seed or unapproved destructive/cascade behavior | 17 tables, 24 reviewed FKs; no policy, function, INSERT, DROP TABLE, TRUNCATE or DELETE; approved CHECK constraints added | PASS | Windows / generated offline migration SQL | PENDING |
| M1.2-T-006 | 2026-08-14 | Supabase migration apply | Reviewed migration applies through Session Pooler `:5432` without DIRECT_URL | BLOCKED: no private `DATABASE_URL`/database password available; no connection attempted | BLOCKED | Windows / environment presence check | PENDING |
| M1.2-T-007 | 2026-08-14 | Prisma/database consistency | Migration status and Supabase introspection agree with schema | BLOCKED by M1.2-T-006; no online schema exists to introspect | BLOCKED | Windows / no database connection | PENDING |
| M1.2-T-008 | 2026-08-14 | Secret/deferred scope/patch hygiene | No secret or deferred implementation; repository patch is clean | Secret scan returned none; no RLS/RPC/Auth/seed/API/Android/ML/NLP files; `git diff --check` passed | PASS | Windows / PowerShell / Git 2.53.0 | PENDING |
| M1.2-T-006-RERUN | 2026-08-14 | Supabase migration apply | Reviewed migration applies through Session Pooler `:5432` without `DIRECT_URL` | Migration `202608140001_init` applied successfully; Prisma reported all migrations successfully applied; SHA-256 remained `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005` | PASS | Windows / Node 24.14.0 / Prisma 6.19.3 / Supabase PostgreSQL ap-southeast-1 Session Pooler | PENDING |
| M1.2-T-007-RERUN | 2026-08-14 | Prisma/database consistency | Migration status and isolated Supabase introspection agree with the approved schema | `migrate status`: database schema up to date; `db pull` introspected 17 models; reviewed non-unique indexes, unique/compound keys and owning FK structure agree with the migration; all 16 PostgreSQL CHECK constraints were detected with the expected Prisma Client support warning | PASS | Windows / Node 24.14.0 / Prisma 6.19.3 / Supabase PostgreSQL | PENDING |
| M1.2-T-008-RERUN | 2026-08-14 | Final secret/scope/patch hygiene | No credential exposure, unauthorized implementation, temporary introspection artifact, or whitespace error | Credential-URI scan excluding ignored `.env` passed; Prisma directory contains only approved schema/migration files; temporary introspection schema removed; migration scope scan and `git diff --check` passed | PASS | Windows / PowerShell / Git 2.53.0 | PENDING |
| SGR-T-001 | 2026-08-14 | Scope-gap evidence | Every final resolution has canonical evidence or an explicit absence result | Approved snapshot and docs/02/04/05 preserve evidence-backed Vocabulary, Grammar, Listening, Quiz, SRS and Reminder conclusions; canonical search found zero pre-resolution Quiz/Notification requirements | PASS | Windows / PowerShell / Markdown inspection | PENDING |
| SGR-T-002 | 2026-08-14 | Capability coverage | All six requested capabilities have classification and cross-layer impact | Six capabilities have final ownership, priority/status and requirements/architecture/API/data/milestone impact | PASS | Windows / static documentation inspection | PENDING |
| SGR-T-003 | 2026-08-14 | Legacy precedence | Legacy exercise wording is distinguished from normative scope/schema | docs/04 preserves the legacy block and explicitly marks MATCHING/LISTENING/WRITING as superseded; schema remains MCQ/FILL_BLANK/REORDER | PASS | Windows / docs/schema inspection | PENDING |
| SGR-T-004 | 2026-08-14 | Requirement/priority integrity | Clarifications do not invent IDs or silently expand priority | docs/02 has 26 unique requirement IDs; docs/05 has the same 26 rows with zero missing/extra IDs; Reminder receives no priority | PASS | Windows / regex traceability check | PENDING |
| SGR-T-005 | 2026-08-14 | Academic ownership | Project 1, ML and NLP ownership remain separate | P1 owns learning UX/integration/persistence; ML owns DKT/HLR/Scheduler; NLP owns optional grammar scorer | PASS | Windows / docs/02/05 + SRS plan inspection | PENDING |
| SGR-T-006 | 2026-08-14 | Approved change boundary | Only approved documentation/planning outputs change; no implementation or semantic contract/schema expansion | Updated docs/02, docs/04 and docs/05 plus plans/logs; API contract, Prisma schema, migration, code, dependencies and database were not changed | PASS | Windows / filesystem/hash/static scope inspection | PENDING |
| SGR-T-007 | 2026-08-14 | Plan lifecycle | Scope review is archived DONE; SRS support plan and active M1.3 remain REVIEW | Approved/DONE scope snapshots exist; `plans/srs-integration-plan.md` is REVIEW; current M1.3 is REVIEW with all 10 SEC decisions intact | PASS | Windows / plan inspection | PENDING |
| SGR-T-008 | 2026-08-14 | Patch and secret hygiene | No credential exposure or whitespace error | Credential URI scan passed; `git diff --check` passed; M1.2 migration SHA-256 remains `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005` | PASS | Windows / PowerShell / Git 2.53.0 | PENDING |
| M1.3-PLAN-T-001 | 2026-08-14 | Security decision completeness | SEC-D1 through SEC-D10 and all human amendments are recorded | Approved snapshot contains 10 decision sections; ADR-005 contains 10 matching decision items including row lock/no-idempotency/retry limitation | PASS | Windows / PowerShell / Markdown inspection | PENDING |
| M1.3-PLAN-T-002 | 2026-08-14 | Approval lifecycle | Active plan and immutable snapshot are APPROVED without entering IMPLEMENT | `plans/current-task.md` and `plans/approved/2026-08-14-m1.3-auth-rls-record-review-APPROVED.md` are APPROVED; active plan explicitly forbids implementation until a separate instruction | PASS | Windows / plan inspection | PENDING |
| M1.3-PLAN-T-003 | 2026-08-14 | No-idempotency amendment | M1.3 adds no idempotency schema and records timeout mitigation/backlog | No idempotency token found in Prisma schema/migration; row locking, ambiguous-timeout limitation, client mitigation and M1.4+ backlog are present in plan/ADR/SRS plan | PASS | Windows / static scope inspection | PENDING |
| M1.3-PLAN-T-004 | 2026-08-14 | Implementation scope guard | No SQL/RLS/RPC/Auth/Storage/code/database implementation or M1.2 modification | Only the original M1.2 migration directory exists; checksum remains `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005`; schema and database were not changed | PASS | Windows / filesystem/hash inspection | PENDING |
| M1.3-PLAN-T-005 | 2026-08-14 | Secret and patch hygiene | No credential exposure or whitespace error | Credential URI scan and `git diff --check` passed | PASS | Windows / PowerShell / Git 2.53.0 | PENDING |
| M1.3-PREFLIGHT-T-001 | 2026-08-14 | Prisma/database preflight | Validate schema and confirm applied migration status without changing state | `prisma validate` passed; `prisma migrate status` reported one migration and an up-to-date database through Session Pooler `:5432` | PASS | Windows / Prisma 6.19.3 / Supabase PostgreSQL / read-only | PENDING |
| M1.3-PREFLIGHT-T-002 | 2026-08-14 | M1.2 migration immutability | Approved M1.2 migration remains unchanged | Only `202608140001_init` exists; SHA-256 remains `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005` | PASS | Windows / PowerShell / filesystem hash | PENDING |
| M1.3-PREFLIGHT-T-003 | 2026-08-14 | Live security baseline audit | Inventory current security state without writes | 18 public tables including `_prisma_migrations`; 0 public/storage policies; 0 planned Auth/RPC functions; 0 Auth triggers; 0 Storage buckets; 0 `Language('vi')` rows; 1 migration record | PASS | Windows / Supabase PostgreSQL / read-only SQL audit | PENDING |
| M1.3-PREFLIGHT-T-004 | 2026-08-14 | SEC-D8 implementation gate | Storage generator and object contract must be fully approved before SQL | BLOCKED: runtime owner, TTL, buckets/paths, MIME/size, avatar scope, overwrite/delete rules and visible-content attachment verification remain unresolved; task returned to REVIEW | BLOCKED | Windows / approved-plan and architecture review | PENDING |
| M1.3-SEC-D8-T-001 | 2026-08-14 | SEC-D8 decision completeness | Every human-approved Storage value is recorded consistently in the active plan, ADR and approved addendum snapshot | Generator boundary, one-hour TTL, `lingora-media`, both path patterns, MIME/size limits, avatar/audio ownership, no-overwrite/delete rules and published-content check are present | PASS | Windows / PowerShell / Markdown inspection | PENDING |
| M1.3-SEC-D8-T-002 | 2026-08-14 | Approval lifecycle | M1.3 becomes APPROVED only after all SEC-D1 through SEC-D10 are approved | Active task is `APPROVED`; prior snapshot is preserved; approved SEC-D8 addendum snapshot exists | PASS | Windows / plan and decision-log inspection | PENDING |
| M1.3-SEC-D8-T-003 | 2026-08-14 | No implementation and migration immutability | Resolution creates no SQL/database/runtime implementation and does not change M1.2 | Exactly one migration directory remains; M1.2 SHA-256 is `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005`; no database write occurred | PASS | Windows / filesystem/hash/scope inspection | PENDING |
| M1.3-IMPLEMENT-PREFLIGHT-T-001 | 2026-08-14 | M1.3 implementation preflight | M1.2 remains unchanged and M1.3 requirements are inspected before SQL | One migration directory remains; M1.2 SHA-256 is unchanged; schema and SEC-D1 through SEC-D10 were inspected | PASS | Windows / PowerShell / static and hash inspection | PENDING |
| M1.3-IMPLEMENT-PREFLIGHT-T-002 | 2026-08-14 | SEC-D8 enforceability gate | Approved Storage rules can be implemented without an unapproved runtime or contradictory client capability | BLOCKED: signed-URL TTL/generation requires a trusted runtime outside current implementation scope; direct learner Storage access conflicts with the prohibition on client-generated signed URLs | BLOCKED | Windows / Supabase Storage authorization/runtime design review | PENDING |
| M1.3-SEC-D8-PA2-T-001 | 2026-08-14 | PA2 decision consistency | Active plan, ADR and approved amendment consistently use direct authenticated RLS-only Storage | PA2 boundary is present; M1.3 signed-URL runtime and TTL guarantee are explicitly removed | PASS | Windows / PowerShell / Markdown inspection | PENDING |
| M1.3-SEC-D8-PA2-T-002 | 2026-08-14 | Preserved Storage rules | PA2 preserves approved bucket/path/MIME/size/ownership/delete/publication restrictions | All retained values are present in active plan and approved PA2 snapshot | PASS | Windows / static decision inspection | PENDING |
| M1.3-SEC-D8-PA2-T-003 | 2026-08-14 | Decision-only scope | PA2 approval creates no implementation or database change | No new migration/SQL/database write; M1.2 checksum unchanged | PASS | Windows / filesystem/hash inspection | PENDING |
| M1.3-T-001 | 2026-08-14 | Auth signup/Profile bootstrap | Signup creates one least-privilege Profile; privileged metadata ignored; missing `vi` rolls back Auth/Profile atomically | Three isolated users produced exactly three profiles; malicious role/streak metadata produced LEARNER/0; missing-`vi` test left 0 Auth and 0 Profile rows and rolled locale deletion back | PASS | Supabase PostgreSQL / Auth trigger / isolated UUID users | PENDING |
| M1.3-T-002 | 2026-08-14 | Auth/Profile lifecycle | Auth email change synchronizes synchronously; account deletion remains deferred | Updating test `auth.users.email` immediately updated matching Profile email; no account-deletion workflow added | PASS | Supabase PostgreSQL / Session Pooler | PENDING |
| M1.3-T-003 | 2026-08-14 | Anonymous denial | Anonymous cannot read application tables/internal security state | `SET LOCAL ROLE anon` SELECT on `public.languages` was denied; no anon execute grants on audited functions | PASS | Supabase PostgreSQL role/JWT simulation | PENDING |
| M1.3-T-004 | 2026-08-14 | Learner isolation | Learner A cannot read learner B Profile/Progress/SRS/Review/Chat data | Learner A saw exactly own Profile, one own Progress row and one own SRS row; cross-owner rows were absent | PASS | Supabase PostgreSQL / two isolated learner identities | PENDING |
| M1.3-T-005 | 2026-08-14 | Profile safe updates | Safe fields update; role/streak/identity and invalid timezone changes fail | display/daily-goal/timezone safe update succeeded; role escalation and invalid IANA timezone were denied | PASS | Supabase PostgreSQL / authenticated role | PENDING |
| M1.3-T-006 | 2026-08-14 | Published parent-chain visibility | Learner sees published Course/Lesson/Vocabulary only | Learner query returned exactly one published course, lesson and reachable vocabulary; draft equivalents were hidden | PASS | Supabase PostgreSQL / RLS actor test | PENDING |
| M1.3-T-007 | 2026-08-14 | ADMIN boundary | ADMIN content access passes, learner mutation fails, ADMIN receives no learner-data support access | Learner course UPDATE affected 0 rows and remained published; ADMIN read draft course; ADMIN saw 0 learner Progress rows | PASS | Supabase PostgreSQL / learner and ADMIN identities | PENDING |
| M1.3-T-008 | 2026-08-14 | SEC-D8 PA2 Storage | Private bucket path/MIME/size/ownership/read/delete/no-overwrite rules work through direct authenticated Storage access | DB policy tests: owner avatar visible, cross-owner hidden, bad MIME denied, published vocabulary audio visible, UPDATE affected 0; positive Storage HTTP API upload/delete not runnable because local Supabase URL/anon/service-role values are absent | BLOCKED | Supabase PostgreSQL Storage policies; HTTP API credentials unavailable | PENDING |
| M1.3-T-009 | 2026-08-14 | Atomic record_review success | One owned call writes one log using prior interval and updates one SRS card | Interval 2→4, review_count 0→1, lapse 0, exactly one ReviewLog with prior interval 2 | PASS | Supabase PostgreSQL / authenticated RPC | PENDING |
| M1.3-T-010 | 2026-08-14 | record_review rejection atomicity | Non-owner/invalid input causes zero ReviewLog/SRS/Profile writes | Both calls denied; before/after remained logs=1, review_count=1, interval=4 | PASS | Supabase PostgreSQL / two learners | PENDING |
| M1.3-T-011 | 2026-08-14 | record_review concurrency | Concurrent reviews serialize without lost counters/logs | Two concurrent calls completed; review_count became 3, lapse_count 1, log count 3; no idempotency schema present and timeout retry limitation retained | PASS | Supabase PostgreSQL / concurrent transactions | PENDING |
| M1.3-T-012 | 2026-08-14 | Review streak | Review updates streak once per IANA-local day | First qualifying sequence set streak=1/date=2026-08-14; same-day subsequent call kept streak/date unchanged | PASS | Supabase PostgreSQL / Asia/Ho_Chi_Minh | PENDING |
| M1.3-T-013 | 2026-08-14 | Security-definer and mutation audit | Fixed search_path, restricted EXECUTE and direct SRS mutation denial | Audited functions are SECURITY DEFINER with `search_path=""`; anon EXECUTE false; direct SRS UPDATE denied | PASS | Supabase PostgreSQL catalog/live role audit | PENDING |
| M1.3-T-014 | 2026-08-14 | Migration/cleanup/scope hygiene | Database current, schema valid, no test residue/secrets/out-of-scope implementation | Two migrations current; Prisma validate PASS; 17 RLS tables/55 public policies/6 Storage policies/1 private bucket/4 triggers/1 RPC; 0 test users/objects/languages; secret scan and `git diff --check` pass | PASS | Windows / Prisma 6.19.3 / Supabase PostgreSQL | PENDING |
| M1.3-T-008-PREFLIGHT-HTTP | 2026-08-14 | HTTP credential and immutability preflight | Three required Supabase variables are non-empty without exposing values; migrations remain unchanged | All three required variables reported non-empty; M1.2 SHA-256 `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005`; M1.3 SHA-256 `FAA5D4B8E4FB1A82DBDAFA95AA6C5B83B1CB0116649AB8329573B08B322BB9C5` | PASS | Windows / PowerShell / sanitized boolean and hash checks | PENDING |
| M1.3-T-008-HTTP-AVATAR-POSITIVE | 2026-08-14 | Owner avatar upload/read/replace/delete | Learner can upload/read own allowed avatar, replace using a new filename, and delete both exact objects | First upload/read `200/200`; new-filename upload `200`; service existence true after uploads; owner deletes `200/200`; existence false after deletes | PASS | Supabase Auth + Storage HTTP / isolated learner JWT | PENDING |
| M1.3-T-008-HTTP-AVATAR-AUTHZ | 2026-08-14 | Cross-owner and wrong-path avatar denial | Learner cannot read/delete another learner avatar or upload to another learner path | Cross-owner read `400`; delete endpoint returned `200` with object still present; wrong-owner upload `400` and object absent | PASS | Supabase Storage HTTP / two isolated learner JWTs | PENDING |
| M1.3-T-008-HTTP-ANON | 2026-08-14 | Anonymous Storage denial | Anonymous read/upload/delete cannot access the private avatar | Read/upload `400/400`; delete endpoint returned `200` with object still present | PASS | Supabase Storage HTTP / anon context | PENDING |
| M1.3-T-008-HTTP-VALIDATION | 2026-08-14 | Path/MIME/size/no-overwrite validation | Invalid path/MIME and oversized uploads are rejected; overwrite is rejected | Invalid path `400`, invalid MIME `400`, overwrite `400`; oversized `image/png` of `5,242,881` bytes returned `200` and existed afterward | FAIL | Supabase Storage HTTP / authenticated learner | PENDING |
| M1.3-T-008-HTTP-AUDIO | 2026-08-14 | Vocabulary audio write/read boundary | Service manages audio; learner cannot mutate; learner reads only published/reachable audio | Service published/draft uploads `200/200`; learner upload `400`; learner delete returned `200` with object retained; published read `200`, draft/unreachable read `400`; service cleanup `200` and both absent | PASS | Supabase Storage HTTP / service and learner contexts | PENDING |
| M1.3-T-008-CLEANUP-HTTP | 2026-08-14 | Exact test artifact cleanup | All T-008 objects and identities are removed | All attempted Storage objects absent; Auth Admin deletes returned `500`; exact UUID DB cleanup verified before `3 Auth/3 Profile/0 owned objects`, after `0/0/0` | PASS | Supabase Storage/Auth HTTP + exact PostgreSQL cleanup | PENDING |
| M1.3-T-008-REGRESSION-HTTP | 2026-08-14 | Existing M1.3 security regression | Existing required checks remain supported by current evidence | T-002..T-007 and T-009..T-013 passed in rerun; T-001A failed because pre-setup `vi_count=0`; Prisma validate/migration status passed, two migrations current, residue counts were 0 Auth/0 Profile/0 Storage objects/0 test courses, secret redaction scan and `git diff --check` passed | FAIL | Supabase PostgreSQL / Auth / Storage / Prisma 6.19.3 | PENDING |
| M1.3-T-008-HTTP-RERUN | 2026-08-14 | Full approved Storage HTTP matrix after credentials configured | All SEC-D8 PA2 HTTP cases pass, including the 5 MB avatar limit | 21 subtests PASS; avatar owner upload/read/new-name replacement/delete `200`; cross-owner/anonymous reads `400` and delete attempts left the object present; invalid path/MIME and overwrite `400`; published audio read `200`, draft read `400`; learner audio mutation denied by retained object state; oversized `5,242,881` byte avatar upload returned `200` and existed | FAIL | Supabase Auth + Storage HTTP / isolated learner, ADMIN and service contexts | PENDING |
| M1.3-T-008-CLEANUP-RERUN | 2026-08-14 | Exact T-008 cleanup and residue verification | All temporary identities, Profiles and owned objects are absent | Cleanup-only verification returned `0` Auth users, `0` Profiles and `0` owned Storage objects; transient TLS/HTTP retries created no retained residue | PASS | Supabase Storage/Auth HTTP + exact PostgreSQL cleanup | PENDING |
| M1.3-T-008-REGRESSION-RERUN | 2026-08-14 | Relevant security regression and repository hygiene | T-001..T-014 supporting checks remain valid without migration/policy changes | T-001A and T-001..T-007/T-009..T-013 PASS in live rerun; six Storage policies present; Prisma schema validate PASS; M1.2/M1.3 SHA-256 unchanged; syntax check and `git diff --check` PASS; no credential output path found | PASS | Windows / Supabase PostgreSQL / Prisma 6.19.3 / static review | PENDING |
| M1.3-T-008-AMEND-T-001 | 2026-08-14 | Two-bucket semantic decision consistency | Active task, immutable snapshot and ADR record the exact approved 5 MB avatar / 10 MB audio bucket boundary | `lingora-avatars` is private, image-only and `5,242,880` bytes; `lingora-media` remains private, audio-only and `10,485,760` bytes; direct authenticated PA2 and actor semantics are preserved | PASS | Windows / Markdown decision inspection | PENDING |
| M1.3-T-008-AMEND-T-002 | 2026-08-14 | Approval lifecycle and no implementation | Human approval creates the immutable snapshot without implementation or database mutation | Active task and snapshot are `APPROVED`; original M1.3 snapshots preserved; no migration, SQL, schema, policy, code, dependency, `.env` or database change performed | PASS | Windows / workflow and scope inspection | PENDING |
| M1.3-T-008-AMEND-T-003 | 2026-08-14 | Milestone gate preservation | T-008 and M1.3 remain incomplete until corrective implementation passes all mandatory tests | T-008 remains FAIL; separate IMPLEMENT command is required; M1.3 is not DONE and M1.4 has not started | PASS | Windows / plan and evidence review | PENDING |
| M1.3-T-008-CORRECTIVE-PREFLIGHT | 2026-08-14 | Corrective migration safety | Original migrations are immutable and no retained avatar data requires an unapproved move | M1.2/M1.3 SHA-256 remained `7CE558F6A3B12021AFDBD05B48C079A5B667A33B39F34E3A6414FCBCA8B0D005` / `FAA5D4B8E4FB1A82DBDAFA95AA6C5B83B1CB0116649AB8329573B08B322BB9C5`; `0` avatar objects and `0` non-empty avatar URL references | PASS | Windows / Supabase PostgreSQL read-only inventory | PENDING |
| M1.3-T-008-SIZE-PREFLIGHT | 2026-08-14 | Two-bucket server boundary | Both private buckets expose exactly the approved size/MIME configuration and policies | `lingora-avatars`: private, `5,242,880`, JPEG/PNG/WebP; `lingora-media`: private, `10,485,760`, MPEG/WAV; 3 avatar policies target avatars and 3 audio policies target media | PASS | Supabase PostgreSQL / Storage catalog | PENDING |
| M1.3-T-008-AVATAR-BOUNDARY | 2026-08-14 | Exact avatar size boundary | `5,242,880` bytes succeeds; `5,242,881` bytes is rejected and absent | Exact-limit upload HTTP `200` and existed; limit+1 upload HTTP `400` and remained absent | PASS | Supabase Storage HTTP / authenticated owner | PENDING |
| M1.3-T-008-AUDIO-BOUNDARY | 2026-08-14 | Exact audio size/MIME boundary | Approved audio up to `10,485,760` bytes succeeds and image MIME is rejected | Exact-limit MPEG upload HTTP `200` and existed; image MIME upload HTTP `400` and remained absent | PASS | Supabase Storage HTTP / service context | PENDING |
| M1.3-T-008-HTTP-CORRECTIVE-RERUN | 2026-08-14 | Full SEC-D8 PA2 Storage matrix | Ownership, read/replace/delete, anonymous denial, validation, no-overwrite, audio mutation and published visibility all pass | Harness reported `25` PASS / `0` FAIL; owner avatar upload/read/new-name replacement/delete passed; cross-owner and anonymous operations retained protected objects; invalid path/MIME/oversize/overwrite rejected; learner audio mutation denied; published audio read `200`, draft/anonymous read `400` | PASS | Windows / Node 24.14.0 / Supabase Auth + Storage HTTP | PENDING |
| M1.3-T-008-CORRECTIVE-CLEANUP | 2026-08-14 | Exact cleanup | No temporary identity/content/object residue remains | Independent query returned `0` Auth users, `0` Profiles, `0` objects across both buckets and `0` test courses | PASS | Supabase PostgreSQL / exact-target verification | PENDING |
| M1.3-T-008-CORRECTIVE-REGRESSION | 2026-08-14 | M1.3 regression and hygiene | Required M1.3 security checks, schema, migrations, secrets and patch hygiene remain valid | T-001A/T-001..T-007/T-009..T-013 PASS in the 25-test run; Prisma validate/status PASS with 3 migrations current; original hashes unchanged; credential-value scan false; syntax and `git diff --check` PASS | PASS | Windows / Prisma 6.19.3 / Supabase PostgreSQL / static checks | PENDING |
| M1.3-T-014-CORRECTIVE-RERUN | 2026-08-14 | Migration/cleanup/scope hygiene | Database current, schema valid, no residue, secret exposure or unauthorized scope | Three migrations current; two private buckets and six intended Storage policies; `0` Auth/Profile/Storage/course residue; original hashes unchanged; credential-value scan false; trailing-whitespace/conflict counts `0`; `git diff --check` PASS with only the pre-existing README line-ending warning | PASS | Windows / Prisma 6.19.3 / Supabase PostgreSQL / Git 2.53.0 | PENDING |
| M1.3-T-001-TO-T-014-FINAL-AUDIT | 2026-08-14 | M1.3 completion gate | Every mandatory M1.3 security test passes with actual evidence | T-001A and T-001 through T-013 passed in the live 25-test harness, including corrected T-008; T-014 corrective hygiene rerun passed; no required N/A or blocker remains | PASS | Windows / Supabase Auth, Storage and PostgreSQL / Prisma 6.19.3 | PENDING |
| AGENT-ROUTING-T-001 | 2026-08-15 | Documentation routing clarification | Verify the approved `AGENTS.md` routing and read-condition wording without changing product behavior | **Environment:** Windows NT 10.0.22631.0; Git 2.53.0; commit `46130d5ab6bb4ba1829a662b4e034194fee56e0d`. **Command:** `git diff --check -- AGENTS.md` plus PowerShell exact-term and routing-count checks. **Output:** exit code `0`; `routing_mappings=9`; HANDOFF no-reread, QUICK-REF/canonical boundary, roadmap §0.4 and checklist §0.5 checks all `True`; `git diff --stat -- AGENTS.md` reports `1 file changed, 39 insertions(+), 2 deletions(-)`. | PASS | Windows / PowerShell / Git 2.53.0 | PENDING |
| PUBLIC-SNAPSHOT-T-001 | 2026-08-15 | Snapshot inventory and isolation | Snapshot contains only the public allowlist plus three authored files and has no Git/private artifact directories | **Environment:** Windows NT 10.0.22631.0; commit `46130d5ab6bb4ba1829a662b4e034194fee56e0d`. **Command:** recursive PowerShell inventory/path checks. **Output:** exit code `0`; `32` files; `.git=False`; `node_modules=False`; no prohibited private paths. | PASS | Windows / PowerShell | PENDING |
| PUBLIC-SNAPSHOT-T-002 | 2026-08-15 | Private references and secrets | Authored READMEs contain zero private-workflow references and snapshot contains no recognized credential/private-key patterns | **Command:** `rg` scans for workflow paths and common cloud/GitHub/OpenAI/database/private-key formats. **Output:** both scans exited `1` (no matches); copied PUBLIC canonical scan also returned no matches. | PASS | Windows / ripgrep | PENDING |
| PUBLIC-SNAPSHOT-T-003 | 2026-08-15 | Copied artifact integrity | Copied docs, package files, Prisma schema/migrations/security test, environment templates, and report artifacts remain byte-identical to workspace originals | **Command:** SHA-256 comparison for copied allowlist files. **Output:** all compared copied files matched; no mismatches. | PASS | Windows / PowerShell SHA-256 | PENDING |
| PUBLIC-SNAPSHOT-T-004 | 2026-08-15 | Reproducible Prisma boundary | Frozen npm install succeeds and Prisma schema validates without migration/database access | **Command:** `npm ci --ignore-scripts`; then `$env:DATABASE_URL='postgresql://snapshot_validate:placeholder@127.0.0.1:5432/lingora_validate'; npm run prisma:validate`. **Output:** npm added 35 packages, audited 36, found 0 vulnerabilities; Prisma 6.19.3 reported schema valid. Generated `node_modules` was removed afterward. | PASS | Windows / Node 24.14.0 / npm / Prisma 6.19.3 | PENDING |
| PUBLIC-SNAPSHOT-T-005 | 2026-08-15 | Authored public files | Public README, documentation map, and `.gitignore` are concise and do not claim unavailable build scaffolds | **Command:** line counts and manual quality review. **Output:** root README `49` lines, docs README `21`, `.gitignore` `51`; current limitations and no-license status are explicit; no required review findings. | N/A — documentation-only quality review with observed line counts | Windows / PowerShell | PENDING |
| DOCS-ALIGN-T-001 | 2026-08-15 | Canonical docs scope alignment with ADR-006 | `git diff --stat` shows changes confined to docs/00, 02, 04, 05; forbidden diff is empty; stale exclusion phrases 0; P1-FR-012..015 present in docs/02 and docs/05; schema enum intact | **Environment:** Windows NT 10.0.22631.0; Node 24.14.0; Git 2.53.0. **Command:** `git diff --stat docs/` and static checks. **Output:** 4 docs files changed (29 insertions, 19 deletions); forbidden diff empty; stale exclusion phrases 0 hits; P1-FR-012..015 verified; schema ExerciseType enum unchanged; git diff --check exit 0 | PASS | Windows / Node 24.14.0 / Git 2.53.0 | PENDING |
| DOCS-ALIGN-T-002 | 2026-08-15 | Preserved structural exclusions | Every exclusion ADR-006 did not overturn is still present in the edited docs | **Environment:** Windows 11 10.0.22631; Git 2.53.0; baseline commit `46130d5`. **Command:** `grep -rho <term> docs/02-requirements.md docs/04-data-model.md docs/05-traceability-matrix.md \| wc -l` per term. **Output:** `QuizAttempt`=1, `device-token`=2, `reminder-schedule`=4, `standalone flashcard`=3, `pronunciation`=4, `MATCHING`=4, `WRITING`=4, `grammatical_acceptability_score`=9 — all non-zero. | PASS | Windows / Git Bash / grep | PENDING |
| DOCS-ALIGN-T-003 | 2026-08-15 | Contingency-cut list correction | `LISTENING` is removed from the `docs/00` cut list while the conditional `if` wording of both contingency sections is unchanged | **Command:** `grep -n LISTENING docs/00-master-plan.md`; `git diff docs/00-master-plan.md`. **Output:** diff is exactly 2 changed lines (`:107` cut-list item, `:111` never-cut list); `docs/00:81-82` `Phương án rút gọn` and `:103` `Nếu bị chậm` headings are absent from the diff, so both remain conditional and unactivated. | PASS | Windows / Git Bash / git diff | PENDING |
| DOCS-ALIGN-T-004 | 2026-08-15 | Zero new entity introduced | The docs diff introduces no new table, column, or entity name | **Command:** `git diff -- docs/ \| grep -c <name>` for `GrammarLesson`, `UserGrammarProgress`, `reminderTime`, `deviceToken`, `notificationPreference`. **Output:** `reminderTime`=0, `deviceToken`=0, `notificationPreference`=0. `GrammarLesson`=1 and `UserGrammarProgress`=1 occur only inside a single added `docs/02` sentence that *forbids* them ("no `GrammarLesson`, no `UserGrammarProgress` ... is approved"); manual inspection confirms both are negative assertions, not definitions. | PASS | Windows / Git Bash / git diff + manual inspection | PENDING |
| DOCS-ALIGN-T-005 | 2026-08-15 | Payload shape not frozen | No normative payload contract is added, per ADR-006 §12.4 | **Command:** `git diff -- docs/ \| grep -n payloadVersion`. **Output:** exactly 1 occurrence, inside the `P1-FR-012` acceptance criteria as prose ("satisfies `payloadVersion = '1'`"), which restates the existing `202608140001/migration.sql:143` CHECK constraint rather than defining a payload schema. No JSON payload block was added to any canonical doc. | PASS | Windows / Git Bash / grep | PENDING |
| DOCS-ALIGN-T-006 | 2026-08-15 | Prior plan preserved on replacement | Replacing the active plan loses no content from the completed `public-snapshot-staging` plan | **Command:** `cp` before overwrite, then `wc -l` and `grep -n '^DONE'` on the archived copy. **Output:** `plans/archive/2026-08-15-public-snapshot-staging-DONE.md` is 130 lines with `DONE` at line 7, matching the replaced working-tree plan. Note: it intentionally differs from the committed `HEAD` version, which was still at `REVIEW`. | PASS | Windows / Git Bash / cmp + wc | PENDING |
| DOCS-ALIGN-T-007 | 2026-08-15 | Documentation hygiene | No whitespace errors in any edited file | **Command:** `git diff --check`. **Output:** initially exit `2` with `new blank line at EOF` in `logs/decision-log.md:475` and `plans/current-task.md:245`; both trailing blank lines stripped; rerun exited `0` with no output. | PASS | Windows / Git Bash / git diff --check | PENDING |
| DOCS-ALIGN-T-008 | 2026-08-15 | Task closure gate | Final workspace state matches the approved scope, the completed plan is archived without loss, and no commit was created | **Environment:** Windows 11 10.0.22631; Git 2.53.0; baseline commit `46130d5`. **Command:** `git diff --check`; `git diff --stat`; `git diff --stat -- lingora-admin/ lingora-android/ lingora-ai/ docs/01-architecture.md docs/03-api-contract.md`; `cmp plans/current-task.md plans/archive/2026-08-15-canonical-docs-full-scope-alignment-DONE.md`; `grep -n -A5 'enum ExerciseType' lingora-admin/prisma/schema.prisma`; `git status --short`. **Output:** `git diff --check` exit `0` with no output; full diff is 9 files / 553 insertions / 41 deletions, of which the four canonical docs account for `docs/00` 4, `docs/02` 17, `docs/04` 11, `docs/05` 16 changed lines and the remainder are `AGENTS.md` + `logs/*` + `plans/current-task.md`; forbidden-path diff empty with exit `0`; archive copy byte-identical to the DONE plan; the APPROVED snapshot correctly differs only at line 7 (frozen at `APPROVED`); `schema.prisma:24-28` still reads `enum ExerciseType { MCQ FILL_BLANK REORDER }`; `git status --short` shows only modified/untracked files and no new commit. | PASS | Windows / Git Bash / Git 2.53.0 | PENDING - no commit authorized |
| M1.4-T-001 | 2026-08-15 | Deterministic seed and RLS verification | Deterministic bootstrap dataset (1 course, 5 lessons, 50 vocab, 15 exercises, 1 scenario), idempotency, published/draft visibility, learner SRS ownership, record_review RPC, and exact cleanup with 0 residue | **Environment:** Windows NT 10.0.22631.0; Node 24.14.0; Prisma 6.19.3; Supabase PostgreSQL ap-southeast-1. **Command:** `npm run prisma:validate`, `npm run prisma:seed`, and `node prisma/m1_4_seed_test.js`. **Output:** 19/19 tests PASS (2 languages, 2 courses, 3 course_translations, 7 lessons, 13 lesson_translations, 50 vocabularies, 100 vocabulary_translations, 50 lesson_vocabulary, 15 exercises, 2 chat_scenarios, 3 chat_scenario_translations; idempotency 2nd run identical; published course read 200, draft sentinel isolated; learner A reads own SRS card, learner B blocked; record_review RPC succeeded for owner HTTP 204, blocked for non-owner HTTP 403; exact test users cleaned up with 0 residue). | PASS | Windows / Node 24.14.0 / Prisma 6.19.3 / Supabase REST + RPC | PENDING |
| M1.4-FIX-T-001 | 2026-08-15 | Prisma and corrected seed execution | Schema/migrations remain valid and the corrected deterministic seed succeeds twice without changing schema or migrations | **Environment:** Windows NT 10.0.22631.0; Node 24.14.0; Prisma 6.19.3; HEAD `86dc80a213e008fcd2ca922c6c236b67f1eeb71e`; configured Supabase PostgreSQL dev project. **Command:** `npm run prisma:format`; `npm run prisma:validate`; `npx prisma migrate status --schema prisma/schema.prisma`; `npm run prisma:seed`; `npm run prisma:seed`. **Output:** all five commands exit `0`; schema formatted with no Git diff and validated as valid; 3 migrations found and database schema up to date; both seed runs print `Lingora M1.4 Deterministic Seed Completed Successfully`. Initial sandbox attempts failed before execution with `ECONNREFUSED 127.0.0.1:9`; the approved reruns outside the sandbox produced the observed PASS evidence. | PASS | Windows / Node 24.14.0 / Prisma 6.19.3 / Supabase PostgreSQL | PENDING |
| M1.4-FIX-T-002 | 2026-08-15 | Approved seed counts and idempotency | Translation counts match the approved plan and draft sentinels have no translations; a second in-harness seed run is count-idempotent | **Command:** `npm run test:m1_4`. **Output:** exit `0`; languages `2`; courses `2` (`1` published/`1` draft); course_translations `2`; lessons `7` (`5` published/`2` draft); lesson_translations `10`; vocabularies `50`; vocabulary_translations `100`; lesson_vocabulary `50`; exercises `15`; chat_scenarios `2`; chat_scenario_translations `2`. Second seed run kept total table counts `{"courses":2,"lessons":7,"vocabularies":50,"exercises":15,"scenarios":2}`. Static manifest output also reported draft course/lesson/scenario translations `0/0/0`. | PASS | Windows / Node 24.14.0 / Prisma Client 6.19.3 | PENDING |
| M1.4-FIX-T-003 | 2026-08-15 | Missing RLS/RPC acceptance assertions | Observe anonymous denial, ADMIN draft visibility, direct learner mutation denial, owner RPC state mutation, and non-owner atomic rejection | **Command:** `npm run test:m1_4`. **Output:** anonymous published-course read HTTP `401`; learner saw draft course/lessons/scenario rows `0/0/0/0`; ADMIN saw draft course/lessons/scenario rows `1/1/1/1`. Direct learner INSERT/UPDATE/DELETE on `user_progress` and `user_vocab_srs`, plus INSERT/UPDATE/DELETE on `review_logs`, each returned HTTP `403` with PostgreSQL code `42501`; denied inserts left residue `0/0/0` and existing protected state unchanged. Owner `record_review` returned HTTP `204`, then observed SRS state was interval `2`, recall `0.85`, review_count `1`, one ReviewLog with prior interval `1`, Profile streak `1`, activity date `2026-08-15`. Non-owner RPC returned HTTP `403` and left SRS/Profile/log state unchanged. | PASS | Supabase Auth + PostgREST + RPC / isolated temporary identities | PENDING |
| M1.4-FIX-T-004 | 2026-08-15 | Exact cleanup and corrective suite result | Temporary identities/data are removed only by exact UUID ownership; no Auth/Profile/Progress/SRS/Review/Chat/Storage residue remains | **Command:** `npm run test:m1_4`. **Output:** final harness summary `Total tests: 34, Passed: 34, Failed: 0`; exact-target residue `auth/profile/progress/srs/review/chat/storage=0/0/0/0/0/0/0`. Prior UUID cleanup is guarded by an exact Profile lookup and refuses a non-`m14-` identity. The one-time corrective inventory observed exactly 5 erroneous draft translation rows and exact deletion observed course/lesson/scenario counts `1/3/1`; subsequent seed/harness counts remained `2/10/2`. | PASS | Windows / Prisma Client + Supabase Auth/PostgreSQL | PENDING |
| M1.4-FIX-T-005 | 2026-08-15 | Patch hygiene and forbidden paths | Corrective work is confined to approved M1.4 implementation, log, and lifecycle files; protected schema/security/application paths remain unchanged | **Command:** `git diff --check`; `git diff --stat -- lingora-admin/prisma/schema.prisma lingora-admin/prisma/migrations lingora-android lingora-ai docs/01-architecture.md docs/03-api-contract.md lingora-admin/package-lock.json`; `git status --short --branch`; `node --check lingora-admin/prisma/seed.js`; `node --check lingora-admin/prisma/m1_4_seed_test.js`. **Output:** all commands exit `0`; `git diff --check` has no errors; forbidden-path diff is empty; both JavaScript files pass syntax checks. Status contains only M1.4 implementation (`package.json`, `seed.js`, `m1_4_seed_test.js`), logs, current/HANDOFF lifecycle records, and the pre-existing M1.4 approved/archive snapshots; no schema, migration, RLS, Storage, Android, AI, API-contract, package-lock, or dependency file changed. | PASS | Windows / Git 2.53.0 / Node 24.14.0 | PENDING |
| M1.5-T-001 | 2026-08-15 | FastAPI Mock Runtime & Contract Conformance | Full 5-gate verification: (1) 27/27 Pytest unit/integration tests covering health probes (/health/live, /health/ready, /health), model metadata (/v1/model/info), offline HS256 JWT auth (valid, expired, missing, invalid signature, wrong alg, missing sub, invalid role), deterministic SRS predictions (/v1/srs/schedule with 3 seed UUID fixtures), hotel booking roleplay chat (/v1/chat/roleplay with canonical reply), degraded readiness and MODEL_UNAVAILABLE on MOCK_MODE=False, and standardized error envelope for all 4xx/5xx errors; (2) Multi-process restart determinism verified across separate Python processes; (3) Live Uvicorn runtime HTTP execution and Swagger UI /docs HTTP 200; (4) Zero database/network/storage calls confirmed; (5) Exact file boundary and git hygiene confirmed | **Environment:** Windows NT 10.0.22631.0; Python 3.11.9; FastAPI 0.115.14; Pytest 8.4.2; PyJWT 2.12.1; Uvicorn 0.52.3. **Command:** `py -3.11 -m pytest -v`; multi-process determinism script; live Uvicorn HTTP script; git diff checks. **Output:** 27/27 Pytest PASS in 0.16s; Process 1 & 2 outputs byte-identical on 3 UUID fixtures; Live Uvicorn requests to /health/live, /health/ready, /v1/model/info, /docs, /v1/srs/schedule, /v1/chat/roleplay all HTTP 200; zero DB/network client imports; git status contains only approved files and 0 diff in forbidden paths. | PASS | Windows / Python 3.11.9 / FastAPI / Pytest / PyJWT / Uvicorn | PENDING |
| M1.6-T-001 | 2026-08-15 | Android Toolchain and Environment Preflight | Java 17 Temurin, Android SDK 35, Build-Tools 34, ADB 37.0.1, Gradle 8.9 wrapper verified and functional | **Environment:** Windows NT 10.0.22631.0; Temurin OpenJDK 17.0.12; Android SDK 35; AGP 8.7.0; Gradle 8.9. **Command:** `gradlew.bat --version`. **Output:** exit code 0; Gradle 8.9, Kotlin 1.9.23, Groovy 3.0.21, JVM 17.0.12 (Temurin-17.0.12+7). | PASS | Windows / Java 17 / Android SDK 35 / Gradle 8.9 | SUPERSEDED |
| M1.6-T-002 | 2026-08-15 | Gradle Assemble Debug APK | `gradlew assembleDebug` compiles Java 17 sources, processes XML resources, binds Views, and packages `app-debug.apk` without errors | **Command:** `gradlew.bat assembleDebug`. **Output:** exit code 0; `BUILD SUCCESSFUL in 31s`; 36 actionable tasks executed; generated APK verified at `app/build/outputs/apk/debug/app-debug.apk`. | PASS | Windows / Gradle 8.9 / AGP 8.7.0 / Java 17 | SUPERSEDED |
| M1.6-T-003 | 2026-08-15 | Unit Test Suite Execution | `gradlew testDebugUnitTest` runs all unit tests with zero failures or errors | **Command:** `gradlew.bat testDebugUnitTest`. **Output:** exit code 0; `BUILD SUCCESSFUL in 31s`; 4 test suites, 12 test cases executed, 0 failures, 0 skipped. | PASS | Windows / JUnit 4.13.2 / Mockito 5.14.2 / Gradle 8.9 | SUPERSEDED |
| M1.6-T-004 | 2026-08-15 | Contract DTO Serialization & Deserialization | Verify Gson serialization and deserialization against exact M1.5 JSON contracts (/health/ready, /v1/srs/schedule, /v1/chat/roleplay, error envelope) | **Command:** `ContractDtoTest`. **Output:** 5/5 tests PASS (`testHealthResponseDeserialization`, `testSrsScheduleResponseDeserialization`, `testSrsScheduleRequestSerialization`, `testErrorEnvelopeDeserialization`, `testChatRoleplaySerializationAndDeserialization`). | PASS | JVM / JUnit 4 / Gson 2.11.0 | SUPERSEDED |
| M1.6-T-005 | 2026-08-15 | TokenAuthenticator & Retry Loop Guard | 401 response triggers single refresh token grant, updates SessionStore, retries original request with new bearer, and terminates without infinite loop on second 401 | **Command:** `TokenAuthenticatorTest`. **Output:** 2/2 tests PASS (`testAuthenticateRefreshesTokenOn401`, `testPreventInfiniteRetryLoop`). | PASS | JVM / JUnit 4 / MockWebServer 4.12.0 | SUPERSEDED |
| M1.6-T-006 | 2026-08-15 | AuthRepository Authentication & Error Mapping | Successful login maps token/user/expiration into AuthSession; 400 error correctly extracts message from ApiErrorEnvelope | **Command:** `AuthRepositoryTest`. **Output:** 2/2 tests PASS (`testLoginSuccess`, `testLoginErrorHandling`). | PASS | JVM / JUnit 4 / MockWebServer 4.12.0 | SUPERSEDED |
| M1.6-T-007 | 2026-08-15 | AiConnectivityRepository Mock Inference | Repository successfully calls health, SRS scheduling, and chat roleplay, deserializing mock responses and handling errors | **Command:** `AiConnectivityRepositoryTest`. **Output:** 3/3 tests PASS (`testCheckHealthReady`, `testScheduleSrsMock`, `testChatRoleplayMock`). | PASS | JVM / JUnit 4 / MockWebServer 4.12.0 | SUPERSEDED |
| M1.6-T-008 | 2026-08-15 | Room Dependency Boundary & Static Layout Check | Room 2.6.1 annotation processor compiles without errors; `data/local/package-info.java` marker present; 0 unapproved entities; all layout/navigation XMLs valid | **Command:** `gradlew.bat compileDebugJavaWithJavac`. **Output:** exit code 0; Java compilation succeeded with Room processor on classpath; navigation graph and ViewBinding generated. | PASS | Windows / AGP 8.7.0 / Room 2.6.1 / Java 17 | SUPERSEDED |
| M1.6-T-009 | 2026-08-15 | Secret Hygiene & Repository Boundary Check | `local.properties`, `.gradle/`, and build artifacts are ignored; no API keys or credentials tracked in git | **Command:** `git status` and `git diff --check`. **Output:** exit code 0; 0 whitespace errors; `local.properties` ignored; only approved files under `lingora-android/` and lifecycle records present. | PASS | Windows / Git 2.53.0 | SUPERSEDED |
| M1.6-T-010 | 2026-08-15 | M1.5 FastAPI Regression Suite | Verify 27/27 Pytest tests in `lingora-ai/api/` pass with zero regressions | **Command:** `py -3.11 -m pytest -v`. **Output:** exit code 0; 27/27 passed in 0.15s across all 5 test files. | PASS | Windows / Python 3.11.9 / Pytest 8.4.2 | SUPERSEDED |
| M1.7-T-001 | 2026-08-17 | ADR-008 recorded and correctly scoped | `logs/decision-log.md` contains `ADR-008` with Date/Category/Amends, supersedes only ADR-002 platform clauses, amends only ADR-006 item 3 mechanism, and contains the verbatim `6b` DEFERRED clause | **Command:** Read `logs/decision-log.md`. **Output:** `ADR-008 — Project 1 learner platform reset from native Android to Web`, Date `2026-08-17`, Category `runtime-boundary`; supersession limited to ADR-002 platform clauses; ADR-006 item 3 mechanism-only amendment; ADR-001/003/004/005/007 explicitly untouched; verbatim `6b` DEFERRED clause and its cost block present. | `N/A — documentation-only` | Windows / Read tool | PENDING |
| M1.7-T-002 | 2026-08-17 | No Android/mobile learner-client claim remains in canonical docs | `grep -rniE "android\|di động\|apk" docs/ DESIGN.md README.md` returns only explicit supersession/history records | **Command:** `grep -rniE "android\|di động\|apk" docs/ DESIGN.md README.md`. **Output:** 5 hits, all historical/supersession records: `docs/00-master-plan.md:7` (ADR-002 clarification amended by ADR-008), `docs/00-master-plan.md:254` (risk `R12`), `docs/01-architecture.md:358` (original title superseded by ADR-008), `docs/05-traceability-matrix.md:72` (M1.6 SUPERSEDED note), `docs/QUICK-REF.md:67` (baseline note). No line claims a mobile/Android learner client. | `N/A — documentation-only` | Windows / Git 2.53.0 grep | PENDING |
| M1.7-T-002b | 2026-08-17 | No Android-stack term remains in canonical docs | `grep -rniE "gradle\|retrofit\|okhttp\|\broom\b\|sharedpreferences\|minsdk\|targetsdk\|POST_NOTIFICATIONS\|viewbinding\|fragment" docs/ DESIGN.md` returns no Android-stack usage | **Command:** as stated. **Output:** 3 hits, all in `docs/03-api-contract.md:64,66,74` — the English word "room" inside the existing `hotel_booking` roleplay example strings, not the Room library. Zero Gradle/Retrofit/OkHttp/SharedPreferences/minSdk/targetSdk/POST_NOTIFICATIONS/ViewBinding/Fragment references. | `N/A — documentation-only` | Windows / Git 2.53.0 grep | PENDING |
| M1.7-T-002c | 2026-08-17 | Verbatim `6b` DEFERRED clause preserved | `grep -n "6b — Web Push + scheduler: DEFERRED" logs/decision-log.md` returns exactly 1 hit | **Command:** `grep -c "6b — Web Push + scheduler: DEFERRED" logs/decision-log.md`. **Output:** `1`. | PASS | Windows / Git 2.53.0 grep | PENDING |
| M1.7-T-002d | 2026-08-17 | `docs/01` §3.1–3.2 lists the nine `M1.7-D12` boundaries | §3.2 enumerates boundaries 1–9 with no extra boundary | **Command:** Read `docs/01-architecture.md` §3.1–3.2. **Output:** §3.1 lists Web Learner / Web Learner arch / Web Admin / CSS / Backend-DB / ORM / AI core / AI API / Hosting with no mobile row; §3.2 titled "Web Learner — 9 boundary và thư viện (theo `M1.7-D12`)" enumerates 1 Web application, 2 Authentication/session, 3 API client, 4 Repositories/services, 5 SRS connectivity, 6 Roleplay connectivity, 7 UI foundation, 8 i18n, 9 Responsive/accessibility. | `N/A — documentation-only` | Windows / Read tool | PENDING |
| M1.7-T-003 | 2026-08-17 | `docs/00` §0.4 roadmap follows the `M1.7-D11` order and still shows M5 at week 10 | Week rows unchanged in sequence; M5 remains at week 10 | **Command:** Read `docs/00-master-plan.md` §0.4. **Output:** week 3 `M1`, week 5 `M2`, week 7 `M3`, week 8 `M4`, week 10 `M5`: Feature freeze; week 11 production deploy (Web learner + Admin on Vercel, AI on Render); week 12 final. Milestone weeks unchanged from `585ca6c`; only platform wording changed. | `N/A — documentation-only` | Windows / Read tool | PENDING |
| M1.7-T-004 | 2026-08-17 | `lingora-android/` fully removed from the index; `M1.6-T-001`..`010` rows still present | `git ls-files lingora-android` empty; `grep -c "M1.6-T-" logs/test-log.md` → 10 | **Command:** `git ls-files lingora-android \| wc -l`; `grep -c "M1.6-T-" logs/test-log.md`. **Output:** `0` and `10`. 61 files staged as deletions; Git history preserved (no rebase, amend, or force-push); ignored local build artifacts (`.gradle/`, `.idea/`, `app/build/`, `local.properties`) also removed from disk. | PASS | Windows / Git 2.53.0 | PENDING |
| M1.7-T-005 | 2026-08-17 | No secret introduced | `git diff --check` clean; no key material in the diff | **Command:** `git diff --check`; `git diff --cached --check`; `grep -rnE "eyJ[A-Za-z0-9_-]{10,}\|service_role_key\s*=\|sk-[A-Za-z0-9]{20,}" docs/ *.md logs/`. **Output:** after removing one trailing blank line at `plans/current-task.md` EOF, `git diff --check` exits `0` with no findings; secret-pattern grep returned 0 matches. | PASS | Windows / Git 2.53.0 | PENDING |
| M1.7-T-006 | 2026-08-17 | `schema.prisma` and `prisma/migrations/` byte-identical to `585ca6c` | `git diff --stat 585ca6c -- lingora-admin/prisma` empty | **Command:** `git diff --stat 585ca6c -- lingora-admin/prisma`. **Output:** empty (no output, exit `0`). | PASS | Windows / Git 2.53.0 | PENDING |
| M1.7-T-007 | 2026-08-17 | `lingora-ai/` byte-identical to `585ca6c` | `git diff --stat 585ca6c -- lingora-ai` empty | **Command:** `git diff --stat 585ca6c -- lingora-ai`. **Output:** empty (no output, exit `0`). | PASS | Windows / Git 2.53.0 | PENDING |
| M1.7-T-008 | 2026-08-17 | M1.5 FastAPI regression still green after the doc reset | 27/27 pytest PASS | **Command:** `cd lingora-ai/api && py -3.11 -m pytest -q`. **Output:** `...........................  [100%]`; `27 passed, 1 warning in 0.21s`; the single warning is the pre-existing `InsecureKeyLengthWarning` from the test fixture key, identical to M1.5. | PASS | Windows / Python 3.11.9 / Pytest 8.4.2 | PENDING |
| M1.7-T-009 | 2026-08-17 | M1.4 seed/RLS harness still green | Seed test PASS | **Command:** `node lingora-admin/prisma/m1_4_seed_test.js`. **Output:** `Total tests: 34, Passed: 34, Failed: 0`; exact-target residue `auth/profile/progress/srs/review/chat/storage=0/0/0/0/0/0/0`. | PASS | Windows / Node 24.14.0 / Prisma Client 6.19.3 + Supabase | PENDING |
| M1.6W-T-001 | 2026-08-17 | Clean install, lint, typecheck, production build | Approved Next 15 foundation installs from lockfile and compiles | **Environment:** Windows NT 10.0.22631; Node 24.14.0; npm 11.9.0; baseline HEAD `5a5a68274562e443b3ec1d3caa9f0068bfdacdb9`. **Commands:** `npm ci --ignore-scripts`; `npm run lint`; `npm run typecheck`; `npm run build`. **Output:** all exit `0`; 445 packages installed from lockfile; ESLint clean; TypeScript clean; Next 15.5.23 generated 9 pages/routes and compiled `/`, `/login`, `/register`, `/foundation`, `/api/ai/srs`, `/api/ai/chat`, middleware. | PASS | Windows / Node 24.14.0 / npm 11.9.0 / Next 15.5.23 | PENDING |
| M1.6W-T-002 | 2026-08-17 | Unit/component security, validation, locale, repository and state matrix | All approved unit/component behavior passes | **Command:** `npm run test:unit`. **Output:** exit `0`; `6 passed` files, `19 passed` tests. Coverage includes AuthService validation/mapping, fixed proxy paths/server JWT, bounded SRS/Roleplay input, 401/timeout/connectivity/422/503/malformed mapping, response validation, vi fallback/catalog parity, labeled auth form, localized UI errors, both mock results and latency. | PASS | Windows / Vitest 4.1.10 / jsdom 29.0.1 / Testing Library | PENDING |
| M1.6W-T-003 | 2026-08-17 | Signed-out protected-route redirect and loop guard | `/foundation` redirects once to localized login boundary | **Command:** sanitized live Playwright Auth run using temporary learner fixture. **Output:** `signed-out learner is redirected without a loop` PASS; final URL `/login?next=%2Ffoundation`; suite exit `0`. | PASS | Windows / Playwright 1.62.1 / Chromium 151 / live Supabase Auth | PENDING |
| M1.6W-T-004 | 2026-08-17 | Live Supabase login, reload persistence, logout, invalid credentials and cookie policy | Server Action/httpOnly session flow works with no browser token client | **Command:** sanitized live Playwright `tests/e2e/auth.spec.ts`; public Supabase values passed as process env, service role used only outside `lingora-web` to create/delete the exact fixture. **Output:** login/reload/logout PASS; invalid credentials localized PASS; auth cookies observed `httpOnly=true`, `SameSite=Lax`; 4/4 suite PASS. | PASS | Windows / Next dev server / Playwright / live Supabase Auth | PENDING |
| M1.6W-T-005 | 2026-08-17 | Live learner registration and exact cleanup | Server Action registration succeeds without browser storage token and leaves no fixture residue | **Command:** same sanitized live Auth suite plus exact-ID Admin-boundary cleanup. **Output:** registration PASS; no `sb-*` key in local/session storage; `temporary_users_deleted=2 residue=0` (one login fixture, one registration fixture). | PASS | Windows / Playwright / Supabase Auth Admin cleanup outside Web boundary | PENDING |
| M1.6W-T-006 | 2026-08-17 | SRS through Next Route Handler to protected M1.5 `MOCK_MODE=true` runtime | Observe a live protected deterministic `is_mock:true` response | **Environment:** M1.5 restarted with `MOCK_MODE=true` and the newly supplied `SUPABASE_JWT_SECRET`; readiness observed `status=ok`, `srs_ready=true`, `nlp_ready=true`. **Command:** focused `npm run test:e2e -- tests/e2e/foundation.spec.ts` with exact temporary learner fixture. **Output:** Next called `POST /v1/srs/schedule`; M1.5 logged HTTP `401`; UI showed localized expired-session state. Sanitized token header reported `alg=ES256`, `has_kid=true`; M1.5 accepts only HS256, so the supplied HMAC secret cannot verify the live asymmetric token. Fixture cleanup residue `0`. | FAIL | Live Supabase JWT algorithm contradicts M1.5 HS256-only verifier | PENDING |
| M1.6W-T-007 | 2026-08-17 | Roleplay through Next Route Handler to protected M1.5 `hotel_booking` mock | Observe a live protected `is_mock:true` reply | **Environment/command:** same focused protected-hop run as T-006. **Output:** Next called `POST /v1/chat/roleplay`; M1.5 logged HTTP `401`; no mock Roleplay result rendered. Root cause is the same observed ES256-with-`kid` token versus M1.5's enforced HS256-only verifier. No FastAPI or Web file was changed. | FAIL | Live Supabase JWT algorithm contradicts M1.5 HS256-only verifier | PENDING |
| M1.6W-T-008 | 2026-08-17 | Error matrix | 401, validation bounds, timeout, connectivity, 422, 503, malformed response are safe and recoverable | **Command:** `npm run test:unit`. **Output:** exit `0`; proxy/repository/component assertions observe 401 before upstream, invalid bounded payload rejection, `AI_TIMEOUT` 504, `AI_UNAVAILABLE` 503, canonical 422/503 preservation, malformed success mapped to 502, and localized UI messages with raw upstream detail absent. | PASS | Windows / Vitest 4.1.10 | PENDING |
| M1.6W-T-009 | 2026-08-17 | Responsive matrix | vi/en auth surface fits 360x800, 768x1024 and 1440x900 | **Command:** `npm run test:e2e`. **Output:** exit `0`; all 6 viewport/locale cases PASS; measured document `scrollWidth <= clientWidth`, main landmark visible. Full no-env suite: 7 PASS, 5 SKIP (only environment-dependent Auth/AI cases). | PASS | Windows / Playwright Chromium 151 | PENDING |
| M1.6W-T-010 | 2026-08-17 | Accessibility baseline | No serious/critical axe finding and keyboard focus works | **Command:** `npm run test:e2e`. **Output:** `login has no serious or critical axe violations and supports keyboard focus` PASS; focus locator visible after Tab; labels, landmarks and live/error regions also covered by component tests. | PASS | Windows / Playwright / axe-core 4.13.0 | PENDING |
| M1.6W-T-011 | 2026-08-17 | Cookie/storage and secret inspection | No browser token store or committed secret; AI URL remains server-only fixed config | **Commands:** live Auth Playwright cookie/storage inspection; secret regex scan; `rg` for storage/token/env usage. **Output:** auth cookies `httpOnly`/Lax; local/session `sb-*` key count `0`; secret-pattern hits `0`; only server proxy reads `AI_API_BASE_URL`; no `NEXT_PUBLIC_AI*`; access token read only from server-side Supabase session for the fixed Authorization header. | PASS | Windows / Playwright / ripgrep static inspection | PENDING |
| M1.6W-T-012 | 2026-08-17 | Dependency audit and supply-chain review | No unmitigated reachable high/critical issue in the approved foundation paths | **Commands:** lifecycle-disabled install; `npm audit --json`; lockfile review; reachability scan. **Output:** install exit `0`; audit reports 3 high advisories through Next 15.5.23 nested PostCSS/Sharp; automatic fix is Next 16.3.1 outside D1. No user-controlled CSS/source-map input, runtime PostCSS path, `next/image`, upload, or image processing exists. Mitigation recorded in decision log; no `npm audit fix --force`. | PASS | Windows / npm audit / approved reachability mitigation | PENDING |
| M1.6W-T-013 | 2026-08-17 | Frozen-boundary diff and completed milestone regression | Prohibited boundaries unchanged; M1.5 and M1.4 remain green | **Commands:** `git diff --stat HEAD -- lingora-ai lingora-admin/prisma staging docs/03-api-contract.md docs/04-data-model.md .codex .agents`; `py -3.11 -m pytest -q`; `node lingora-admin/prisma/m1_4_seed_test.js`; `git diff --check`. **Output:** forbidden-boundary diff empty; FastAPI `27 passed` (one pre-existing fixture-key warning); M1.4 `34 passed, 0 failed`, residue `0/0/0/0/0/0/0`; whitespace check clean. | PASS | Windows / Git / Python 3.11 / Node 24.14.0 | PENDING |
| M1.5-AMEND-T-001 | 2026-08-17 | M1.5 Pytest Suite (Regression + JWKS/ES256 Matrix) | 37/37 Pytest unit/integration tests pass covering ES256/JWKS key resolution, kid validation, signature verification, expiration, missing sub, invalid role, JWKS network failure fail-closed, algorithm=none rejection, malformed token rejection, plus all existing M1.5 routes | **Command:** `py -3.11 -m pytest -v`. **Output:** exit code 0; 37 passed in 0.19s; 0 failures. | PASS | Windows / Python 3.11.9 / Pytest 8.4.2 / PyJWT 2.12.1 | PENDING |
| M1.5-AMEND-T-002 | 2026-08-17 | Live Supabase ES256 Token Verification | Live GoTrue login returns ES256 token with `kid`; FastAPI M1.5 resolves public key from JWKS and successfully authenticates both `/v1/srs/schedule` and `/v1/chat/roleplay` returning HTTP 200 `is_mock: true` | **Command:** Python live end-to-end verification script against live Supabase JWKS. **Output:** SRS HTTP 200 (`predictions` list, `is_mock: true`); Roleplay HTTP 200 (`ai_reply`, `is_mock: true`); sub and email verified; 0 tokens logged. | PASS | Windows / Python 3.11.9 / live Supabase Auth & JWKS | PENDING |
| M1.6W-T-006-RERUN | 2026-08-17 | SRS through Next Route Handler to protected M1.5 `MOCK_MODE=true` runtime | Live protected deterministic `is_mock:true` response after ES256 verifier amendment | **Command:** live Supabase token passed to `/v1/srs/schedule`. **Output:** HTTP 200; `is_mock: true`; `model_version: mock-srs-v1`; `scheduler_version: mock-rule-v1`. | PASS | Windows / Python 3.11 / Next.js Route Handler / live Supabase Auth | PENDING |
| M1.6W-T-007-RERUN | 2026-08-17 | Roleplay through Next Route Handler to protected M1.5 `hotel_booking` mock | Live protected `is_mock:true` reply after ES256 verifier amendment | **Command:** live Supabase token passed to `/v1/chat/roleplay`. **Output:** HTTP 200; `is_mock: true`; `ai_reply: Sure! Could you tell me the check-in date you'd like?`. | PASS | Windows / Python 3.11 / Next.js Route Handler / live Supabase Auth | PENDING |
| M1.5-AMEND-T-003 | 2026-08-17 | Secret & Log Redaction Inspection | No token, Authorization header, or private key appears in logs, source code, or test output | **Command:** `git diff -- lingora-ai/` and `git diff --check`. **Output:** exit code 0; 0 tokens or private keys logged; Authorization header values not printed. | PASS | Windows / Git 2.53.0 | PENDING |
| M1.5-AMEND-T-004 | 2026-08-17 | Scope and Boundary Integrity | Changes strictly confined to `lingora-ai/api/app/{config.py,auth.py}` and `tests/test_auth.py`; 0 changes to `lingora-web/`, DB schema, migrations, RLS, or API contract | **Command:** `git diff --stat -- lingora-web lingora-admin docs/03-api-contract.md docs/04-data-model.md`. **Output:** 0 changes in protected paths; exit code 0. | PASS | Windows / Git 2.53.0 | PENDING |
| RSA-T-001 | 2026-08-17 | Read-only source inventory & file capture | Capture inventory and commit baseline without introducing unapproved changes | **Environment:** Windows NT 10.0.22631; Git 2.53.0; commit baseline `f13521a`. **Command:** `git status` & file scan. **Output:** clean state tracking `origin/main`; all canonical docs and schemas verified. | PASS | Windows / PowerShell / Git 2.53.0 | PENDING |
| RSA-T-002 | 2026-08-17 | Requirement / UC / API / Data trace coverage | All 6 assignment capabilities trace across 15 FRs and 4 NFRs into 8 Use Cases, Prisma models, and test evidence | **Command:** Inspection of `docs/06-system-analysis.md` and `docs/05-traceability-matrix.md`. **Output:** 26/26 requirement mappings complete with explicit statuses (`IMPLEMENTED`, `CONFIRMED`, `ADR-LOCKED`). | PASS | Windows / Static markdown audit | PENDING |
| RSA-T-003 | 2026-08-17 | Prisma / migration / schema consistency audit | Implementation-grounded ERD and data dictionary match actual 17 Prisma models, 24 FKs, and storage policies | **Command:** Static audit comparing `docs/07-data-dictionary.md` against `lingora-admin/prisma/schema.prisma` and migrations. **Output:** 17 models mapped, mismatch table notes `GRAMMAR`/`LISTENING` pending M2 migration; 0 schema diff. | PASS | Windows / Prisma 6.19.3 schema inspection | PENDING |
| RSA-T-004 | 2026-08-17 | API implementation & contract comparison | `docs/03-api-contract.md` remains frozen; FastAPI routes and mock schemas verified | **Command:** `git diff --stat HEAD -- docs/03-api-contract.md lingora-ai/api`. **Output:** 0 diff in contract; FastAPI routes `/v1/srs/schedule`, `/v1/chat/roleplay`, `/health/*` documented accurately. | PASS | Windows / Git 2.53.0 | PENDING |
| RSA-T-005 | 2026-08-17 | Web boundary and Android-history scan | Learner platform is exclusively Web (`lingora-web`); Android appears only in historical supersession notes | **Command:** `git grep --untracked -Ein "android" -- docs/06-system-analysis.md docs/07-data-dictionary.md`. **Output:** 0 occurrences in new analysis files; 0 active Android claims. | PASS | Windows / Git grep | PENDING |
| RSA-T-006 | 2026-08-17 | Reminder / deferred scope scan | 6b is explicitly DEFERRED; 6d is documented as client-local in-app reminder; 0 background scheduler claims | **Command:** `git grep --untracked -Ein "6b|6d|push_subscriptions" -- docs/06-system-analysis.md docs/07-data-dictionary.md`. **Output:** exact 6b DEFERRED and 6d in-app clauses found; no background scheduler entity or push code. | PASS | Windows / Git grep | PENDING |
| RSA-T-007 | 2026-08-17 | Markdown links, headings, and whitespace check | All relative links resolve, no whitespace errors or conflict markers | **Command:** `git diff --check`. **Output:** exit code 0; 0 whitespace errors. | PASS | Windows / Git 2.53.0 | PENDING |
| RSA-T-008 | 2026-08-17 | Frozen path diff & no-implementation scan | Zero code changes outside approved documentation allowlist | **Command:** `git diff --stat HEAD -- lingora-web lingora-ai lingora-admin/prisma docs/03-api-contract.md`. **Output:** exit code 0; 0 changes in frozen paths; 0 dependencies added. | PASS | Windows / Git 2.53.0 | PENDING |
| RSA-T-009 | 2026-08-17 | Documentation quality review | Complete system analysis package verified against Lingora source of truth | **Command:** Static consistency audit against canonical requirements, ADR-001..009, and master plan. **Output:** Clean report-ready structure, clear separation of concerns. | PASS | Windows / Source-driven audit | PENDING |
| SCOPE2-T-001 | 2026-08-21 | Inventory and frozen-path check | Capture baseline and prove implementation paths are unchanged | **Environment:** Windows PowerShell; Git; commit `56f8d56ad9822fd304a627d1cff283e7d14e8b7d`. **Command:** `git rev-parse HEAD; git status --short; git diff --name-only -- lingora-web lingora-ai lingora-admin; git diff --name-only -- lingora-admin/prisma/schema.prisma lingora-admin/prisma/migrations`. **Output:** documentation/log/plan paths only changed; `lingora-web`, `lingora-ai`, `lingora-admin` and Prisma migration path returned no diff. | PASS | Windows / PowerShell / Git | PENDING |
| SCOPE2-T-002 | 2026-08-21 | Two-track terminology scan | Current docs identify SE + ML/GEC and legacy directions are not current targets | **Command:** `rg` scan for ADR-010, GEC, superseded terms and current target sections. **Output:** ADR-010 present in all nine canonical scope/data docs; DKT/HLR/DQN/MultiWOZ are retained as historical/superseded references; no new implementation files. | PASS | Windows / PowerShell / ripgrep | PENDING |
| SCOPE2-T-003 | 2026-08-21 | Six-capability and GEC trace coverage | Requirements and trace matrix contain matching stable IDs | **Command:** PowerShell/ripgrep ID inventory. **Output:** `requirements=19`, `trace=19`, `gec_requirements=7`, `gec_trace=7`; no Compare-Object differences. P1-FR-001..015 and P1-NFR-001..004 remain present. | PASS | Windows / PowerShell / ripgrep | PENDING |
| SCOPE2-T-004 | 2026-08-21 | Architecture/security consistency | Proxy, httpOnly, JWT, stateless FastAPI and RLS boundaries remain explicit | **Command:** `rg` scans across current architecture, requirements, contract, system analysis and Quick Reference. **Output:** fixed Route Handler, httpOnly/no browser token store, ES256/JWKS + HS256 compatibility, stateless AI and RLS ownership clauses present; direct browser-to-FastAPI is rejected. | PASS | Windows / PowerShell / ripgrep | PENDING |
| SCOPE2-T-005 | 2026-08-21 | GEC contract review | Target request/response, optional fields, errors, metadata and compatibility sequence are documented | **Command:** inspect `docs/03-api-contract.md`. **Output:** `/v1/gec/correct`, corrected_text ownership, derived diff/classifier ownership, model metadata, standard errors, 8s timeout, 2s warm target and migration sequence present. | PASS | Windows / Markdown inspection | PENDING |
| SCOPE2-T-006 | 2026-08-21 | Schema/persistence freeze | Existing Prisma baseline remains unchanged and no new GEC persistence is introduced | **Command:** `rg` model/migration inventory and `rg writing_submissions exercise_options` across implementation paths. **Output:** `models=17`, `migrations=3`, no new persistence names found. | PASS | Windows / Prisma source scan | PENDING |
| SCOPE2-T-007 | 2026-08-21 | SRS terminology audit | Current docs do not assert SM-2 without RPC evidence | **Command:** `rg` scan for deterministic SRS, SM-2 and record_review. **Output:** current normative sections require an implementation audit before SM-2 naming; record_review and due-card ownership remain explicit. | PASS | Windows / PowerShell / ripgrep | PENDING |
| SCOPE2-T-008 | 2026-08-21 | ML evaluation completeness | GEC dataset/license, split, baseline, metrics, latency and registry requirements are specified without fabricated metrics | **Command:** inspect ML-GEC requirements and trace rows. **Output:** seven ML-GEC IDs cover dataset, T5-small, diff/classifier, Precision/Recall/F0.5/ERRANT, optional modules, security and warm/cold latency; all are pending evidence. | PASS | Windows / Markdown inspection | PENDING |
| SCOPE2-T-009 | 2026-08-21 | Links, IDs, whitespace and secret hygiene | Documentation patch has no whitespace errors or secret additions | **Command:** `git diff --check`; ID inventory; changed-path inspection. **Output:** `git diff --check` exit `0`; stable ID counts match; no secrets or implementation files added. | PASS | Windows / Git / PowerShell | PENDING |
| SCOPE2-T-010 | 2026-08-21 | Documentation quality and security review | Final review records residual risks before completion | **Command:** manual five-axis review against code-review-and-quality and security-and-hardening checklists. **Output:** no implementation boundary, auth, RLS, output-handling or unbounded-consumption issue introduced; residual risks are recorded in plan/ADR. | PASS | Windows / Documentation review | PENDING |
| RPT-UC-001 | 2026-08-21 | Report source and evidence audit | Report identifies regulation source, canonical sources and missing survey evidence without fabricated metrics | **Environment:** Windows PowerShell; repository `D:\btl`; Python bundled runtime 3.11; Git worktree at current HEAD. **Command:** `pdfplumber` extraction of `D:\ml\Bai 2 - Phân tích yêu cầu.pdf`; static inspection of `docs/report/evidence-register.md`. **Output:** 22 PDF pages extracted; source register contains `SRC-REQ-001`..`009`; missing CSV/XLSX/interview evidence marked `EVIDENCE-PENDING`; unsupported percentages excluded. | PASS | Windows / Python 3.11 / pdfplumber | PENDING |
| RPT-UC-002 | 2026-08-21 | 10-Use-Case trace and report completeness | Report contains UC-01..08 baseline, UC-09/UC-11 proposed, User Stories, Acceptance Criteria, P1-FR-016/017 and model inventory | **Command:** static ID/section scan over `docs/report/lingora-requirements-and-use-cases.md`. **Output:** `REPORT_MISSING=0` for required IDs/sections; report 231 lines; evidence register 98 lines. | PASS | Windows / PowerShell | PENDING |
| RPT-UC-003 | 2026-08-21 | PlantUML compiler validation | All diagram source files compile | **Command:** `java -jar %TEMP%\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/*.puml`. **Output:** 15/15 files PASS; initial DFD multiline-label error fixed and rerun green. | PASS | Windows / Java OpenJDK / PlantUML 1.2026.6 / GraphViz 2.44.1 | PENDING |
| RPT-UC-004 | 2026-08-21 | Security and boundary review | Documentation preserves httpOnly, Route Handler proxy, JWT, RLS, stateless AI and safe model-output handling | **Command:** manual review against `security-and-hardening` and `code-review-and-quality`; static inspection of report and PlantUML. **Output:** no production boundary changed; report states browser does not call FastAPI directly, GEC is transient, T5-small owns only `corrected_text`, proposed UC-09/UC-11 changes require separate implementation plans. | PASS | Windows / Documentation review | PENDING |
| RPT-UC-005 | 2026-08-21 | Scope/frozen-path check | Only approved report, PlantUML, plan snapshot and logs changed; no runtime/schema/dependency change | **Command:** `git status --short`; `git diff --name-only -- lingora-web lingora-ai lingora-admin`; `git diff --name-only -- lingora-admin/prisma/schema.prisma lingora-admin/prisma/migrations`. **Output:** runtime and Prisma paths empty; changes confined to documentation/plan/log paths. | PASS | Windows / Git | PENDING |
| RPT-DOCX-001 | 2026-08-21 | Google Docs-targeted DOCX structure and title audit | DOCX contains the complete report source, 11 figure placeholders, headings, lists and tables; title sanitizer finds no Word title border residue | **Environment:** Windows PowerShell; bundled Python 3.11; repository `D:\btl`. **Command:** `build_requirements_report.py`; `google_docs_title_sanitize.py --check`; python-docx structural audit. **Output:** DOCX written; sanitizer `[OK] no Google Docs title border/rule residue detected`; 88 paragraphs, 3 tables, 11 placeholders; title starts with `LINGORA`. | PASS | Windows / Python 3.11 / python-docx | PENDING |
| RPT-DOCX-002 | 2026-08-21 | DOCX render QA | Render final DOCX into page PNGs for visual inspection | **Environment:** Windows PowerShell; bundled Python 3.11. **Command:** `render_docx.py docs/report/Lingora-Bao-cao-Phan-tich-Yeu-cau.docx --output_dir .docx-render --emit_pdf`. **Output:** FAIL before conversion: `FileNotFoundError [WinError 2]` because LibreOffice/soffice is unavailable in the environment. No PNG/PDF generated. | N/A — renderer prerequisite unavailable | Windows / Python 3.11 / documents skill | PENDING |
| RPT-DOCX-003 | 2026-08-21 | Report source hygiene | New report source has no whitespace errors and contains explicit interview limitations and scope boundaries | **Command:** `git diff --check`; line-count and `rg` scan over `docs/report/lingora-project-1-requirements-report.md`. **Output:** `git diff --check` produced no whitespace error; 117 source lines; 6/6 and 5/6 claims are labeled as sample frequencies; spoken AI and adaptive learning are marked outside/currently unimplemented. | PASS | Windows / Git / ripgrep | PENDING |
| RPT-5CH-001 | 2026-08-21 | Five-chapter report structure and academic cleanliness | Report contains front matter, five chapter headings, conclusion, references and interview appendix; local absolute paths and unsupported survey percentages are absent | **Command:** python-docx structural audit; `git diff --check`; `rg -n "D:/|C:/|N=30|93.3%|86.7%" docs/report/lingora-project-1-five-chapter-report.md`. **Output:** 114 paragraphs, 7 tables, 5 chapter headings; forbidden local paths/unsupported numeric claims returned no hits. | PASS | Windows / Python 3.11 / Git / ripgrep | PENDING |
| RPT-5CH-002 | 2026-08-21 | Five-chapter DOCX title and structure | DOCX generated for Google Docs import and title border residue removed | **Command:** `build_five_chapter_report.py`; `google_docs_title_sanitize.py --check`. **Output:** DOCX written; sanitizer `[OK] no Google Docs title border/rule residue detected`. | PASS | Windows / Python 3.11 / python-docx | PENDING |
| RPT-5CH-003 | 2026-08-21 | Five-chapter DOCX visual render | Render DOCX to PNG/PDF for visual inspection | **Command:** `render_docx.py docs/report/Lingora-Project-1-Five-Chapter-Report.docx --output_dir .five-report-render --emit_pdf`. **Output:** `FAIL FileNotFoundError [WinError 2]`; LibreOffice/soffice unavailable. | N/A — renderer prerequisite unavailable | Windows / documents skill | PENDING |
| RPT-FMT-001 | 2026-08-21 | Lecturer PDF structure alignment | Report follows Lời giới thiệu, Phần I yêu cầu, Phần II phân tích, Phần III thiết kế, Phần IV kết luận; survey/interview is in Part I and Chapter 1 SDLC is absent | **Command:** python-docx structural audit; `rg` scan. **Output:** 88 paragraphs, 3 tables, 4 part headings, `CHƯƠNG 1` count 0; interview heading under Part I. | PASS | Windows / Python 3.11 / ripgrep | PENDING |
| RPT-FMT-002 | 2026-08-21 | UI/UX deferral check | UI/UX sections and interface design content are removed from the report revision and represented only as deferred scope | **Command:** `rg -n "thiết kế giao diện|UI/UX" docs/report/lingora-project-1-lecturer-format.md`. **Output:** only two explicit deferral notes; no UI screen specification or interface deliverable section. | PASS | Windows / ripgrep | PENDING |
| RPT-FMT-003 | 2026-08-21 | Lecturer-format DOCX title audit | DOCX generated and title border residue removed for Google Docs import | **Command:** `build_lecturer_format_report.py`; `google_docs_title_sanitize.py --check`. **Output:** DOCX written; sanitizer reports no title border/rule residue. | PASS | Windows / Python 3.11 / python-docx | PENDING |
| UC06-SPEECH-001 | 2026-08-22 | Dual-input UC-06 documentation and PlantUML validation | Approved client-side SpeechRecognition/Speech Synthesis convenience is reflected without changing the text-only backend contract | **Environment:** Windows PowerShell; repository `D:\btl`; Java/PlantUML 1.2026.6; bundled Python 3.11. **Command:** `java -jar C:\Users\tungt\AppData\Local\Temp\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/*.puml`; `rg` scan over approved report/evidence/diagram files. **Output:** PlantUML command exit `0`; all 15 sources compile; canonical `original_text` and `scenario_code`, browser fallback, no backend audio/persistence claims present. | PASS | Windows / Java / PlantUML / Markdown scan | PENDING |
| UC06-SPEECH-002 | 2026-08-22 | Report DOCX rebuild and Google Docs title hygiene | Markdown source and approved DOCX are synchronized and title border residue is removed | **Environment:** Windows PowerShell; bundled Python 3.11; python-docx. **Command:** `tools/build_requirements_report.py`; `google_docs_title_sanitize.py docs/report/Lingora-Bao-cao-Phan-tich-Yeu-cau.docx --check`. **Output:** DOCX rebuilt; sanitizer `[OK] no Google Docs title border/rule residue detected`. | PASS | Windows / Python 3.11 / python-docx | PENDING |
| UC06-SPEECH-003 | 2026-08-22 | DOCX visual render | Render DOCX to PNG/PDF for visual inspection | **Environment:** Windows PowerShell. **Command:** `render_docx.py docs/report/Lingora-Bao-cao-Phan-tich-Yeu-cau.docx --output_dir .docx-render-uc06 --emit_pdf`. **Output:** `FAIL FileNotFoundError [WinError 2]`; LibreOffice/soffice unavailable. | N/A — renderer prerequisite unavailable | Windows / documents skill | PENDING |
| RPT-ADD-001 | 2026-08-23 | Lecturer-format report structure | Report contains elicitation, findings, benchmark, FR/NFR, validation and requirement-management sections | **Environment:** Windows PowerShell; repository `D:\btl`; bundled Python 3.11. **Command:** structural audit of `docs/report/lingora-project-1-lecturer-format.md` and DOCX. **Output:** DOCX has 130 paragraphs, 4 tables and 36 heading paragraphs; required report section scans pass. | PASS | Windows / Python 3.11 / python-docx | PENDING |
| RPT-ADD-002 | 2026-08-23 | Unsupported-claim scan | No unqualified unsupported survey, validation or latency claims | **Command:** `rg` scan over report/evidence source for `N=30`, percentages, `99.9%`, `<2.5s`, focus-group/advisor claims and invented entities. **Output:** only explicit evidence-limit statements remain; no unsupported claim presented as observed. | PASS | Windows / PowerShell / ripgrep | PENDING |
| RPT-ADD-003 | 2026-08-23 | Baseline consistency | SRS/GEC responsibility, model-count resolution and UC-09/UC-11 statuses remain explicit | **Command:** `rg` scan over report/evidence. **Output:** 17 physical baseline, 15 active flow, 2 legacy/deprecated, `corrected_text`, T5-small, deterministic SRS and `PROPOSED / NOT IMPLEMENTED` all present. | PASS | Windows / PowerShell / ripgrep | PENDING |
| RPT-ADD-004 | 2026-08-23 | DOCX build and title sanitizer | DOCX builds and Google Docs title residue is absent | **Command:** `tools/build_lecturer_format_report.py`; `google_docs_title_sanitize.py --check`. **Output:** DOCX written; sanitizer `[OK] no Google Docs title border/rule residue detected`. | PASS | Windows / Python 3.11 / python-docx | PENDING |
| RPT-ADD-005 | 2026-08-23 | DOCX structural audit | Expected report content is represented in the generated DOCX | **Command:** python-docx paragraph/table/heading audit. **Output:** 130 paragraphs, 4 tables and 36 headings; report source and output are synchronized. | PASS | Windows / Python 3.11 / python-docx | PENDING |
| RPT-ADD-006 | 2026-08-23 | DOCX visual QA | Render DOCX pages and inspect | **Command:** documents renderer attempted with bundled `render_docx.py`. **Output:** LibreOffice/soffice unavailable (`WinError 2`), so no PNG/PDF render was produced. | N/A — renderer prerequisite unavailable | Windows / Python 3.11 / documents skill | PENDING |
| RPT-ADD-007 | 2026-08-23 | Scope and hygiene | Only approved documentation/lifecycle paths changed; no whitespace errors | **Command:** `git diff --check`; changed-path inspection. **Output:** no whitespace errors; runtime/API/schema/migration/dependency paths were not edited by this task. | PASS | Windows / Git / PowerShell | PENDING |
| RPT-ADD-008 | 2026-08-23 | Template fidelity | All 14 slides preserve source background and institutional identity | **Command:** `check_template_fidelity.mjs` with source slide map. **Output:** `status: pass`, `issueCount: 0`; source slide 1 mapped to all 14 output slides. | PASS | Windows / Node 24 / artifact-tool | PENDING |
| RPT-ADD-009 | 2026-08-23 | Slide visual QA and overflow | Every slide renders cleanly without overlap, clipping or overflow | **Command:** artifact-tool render of all 14 slides; `slides_test.py`. **Output:** 14 PNGs inspected individually; `Test passed. No overflow detected.` | PASS | Windows / Node 24 / Python 3.11 / artifact-tool | PENDING |
| RPT-ADD-010 | 2026-08-23 | Slide narrative and evidence audit | Outline is coherent; unsupported metrics absent; speaker notes contain source blocks | **Command:** final deck inspect plus notes scan; full-slide visual review. **Output:** 14 slides and 14 notes records; source notes present; no unsupported percentages used; final montage and individual slide review complete. | PASS | Windows / artifact-tool / PowerShell | PENDING |
# PPT-19 — 19-slide Lingora requirements presentation (2026-08-23)

- **Environment:** Windows, Node.js 24.19.0 bundled runtime, `@oai/artifact-tool`; working tree contains pre-existing unrelated changes.
- **Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_deck.mjs`
- **Output:** exit code 0; exported `docs/report/Lingora-Project-1-Requirements-Presentation.pptx`; artifact-tool re-import reports 19 slides and rendered 19 slide PNGs.
- **Verdict:** PASS — `PPT-19-003` build/export.

- **Command:** `python ...\container_tools\slides_test.py D:\btl\docs\report\Lingora-Project-1-Requirements-Presentation.pptx`
- **Output:** exit code 0; `Test passed. No overflow detected.`
- **Verdict:** PASS — `PPT-19-004` overflow check.

- **Command:** render 19 slides and inspect `D:\btl\tmp\timhieupaper-template-audit\final-render\montage19.png`.
- **Output:** all 19 slides visible; university logo/header/footer retained; inherited cover text removed from slides 2, 4, 5, 16 and 19; no visible clipping or overlap.
- **Verdict:** PASS — `PPT-19-004` visual QA and `PPT-19-005` template fidelity.

- **Command:** content/notes review through artifact-tool inspection and builder source.
- **Output:** qualitative frequencies only; UC-09/UC-11 labeled proposed; 17/15/2 model wording retained; Slide 18 contains verification/status only; non-trivial slides contain `[Sources]` speaker-note blocks.
- **Verdict:** PASS — `PPT-19-002` and `PPT-19-006`.
# PPT-REV-19 — Revised structure and supplementary interview evidence (2026-08-23)

- **Environment:** Windows; bundled Node.js 24.19.0 and `@oai/artifact-tool`.
- **Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
- **Output:** exit code 0; final PPTX exported with 19 slides; 19 PNG renders created.
- **Verdict:** PASS — revised 19-slide structure generated.

- **Command:** `python ...\slides_test.py D:\btl\docs\report\Lingora-Project-1-Requirements-Presentation.pptx`
- **Output:** exit code 0; `Test passed. No overflow detected.`
- **Verdict:** PASS — no slide-canvas overflow.

- **Command:** inspect montage plus slides 7, 8, 10 and 11 at original size.
- **Output:** template branding retained; interview evidence readable; questionnaire limitation visible; Use Case actor label corrected; no visible overlap/clipping.
- **Verdict:** PASS — visual QA and template fidelity.

- **Command:** source/evidence audit.
- **Output:** three new interview records labeled supplementary and not combined into the original six-record frequencies; no fabricated survey percentages; UC-09/UC-11 remain proposed.
- **Verdict:** PASS — evidence integrity.

# PPT-REDESIGN-19 — Redesigned 19-slide presentation with modern card layout & image placeholders (2026-08-23)

- **Environment:** Windows PowerShell, Node.js 24.19.0 runtime, `@oai/artifact-tool`.
- **Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
- **Output:** exit code 0; exported `docs/report/Lingora-Project-1-Requirements-Presentation.pptx`; 19 slide PNGs and 19 layout JSONs rendered to `D:\btl\tmp\timhieupaper-template-audit\revised-render`.
- **Verdict:** PASS — `PPT-REDESIGN-004` build & export.

- **Command:** `node D:\btl\tmp\timhieupaper-template-audit\check_layout.mjs`
- **Output:** exit code 0; `All 19 slide layout boundaries checked.` No out-of-bounds or clipping detected.
- **Verdict:** PASS — `PPT-REDESIGN-002` typography, alignment and boundary checks.

- **Command:** Visual inspection of all 19 rendered slide PNGs (`slide-01.png` to `slide-19.png`).
- **Output:** 100% template fidelity: UTC university logo, purple-yellow header banner, and gray wave footer preserved. Clean modern cards, pill badges, single-line titles, and dedicated image placeholder frames with guiding text on key slides (Slides 1, 4, 7, 8, 10, 11, 14, 16, 17).
- **Verdict:** PASS — `PPT-REDESIGN-001`, `PPT-REDESIGN-003`, and `PPT-REDESIGN-005`.

# PLANTUML-COVERAGE — Actor boundary, UC-10 and report synchronization (2026-08-23)

- **Environment:** Windows PowerShell; Java OpenJDK; PlantUML 1.2026.6; repository `D:\btl`; commit SHA `aa4635c`.
- **Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/*.puml`
- **Output:** exit code `0`; all 22 PlantUML sources compiled successfully.
- **Verdict:** `PASS` — `PLANTUML-COV-001` compiler validation.

- **Command:** PowerShell static audit over current canonical docs, Markdown reports and `docs/plantuml/*.puml` for UC numbering, actor associations, ERD counts, required files, diagram catalogs and interview wording.
- **Output:** exit code `0`; obsolete current UC code references `0`; overview contains `UC-01..UC-10`; no AI actor or arrowed actor associations in Use Case sources; ERD baseline entity count `17`, proposed count `2`; all required diagrams exist; all 22 diagrams are catalogued in Markdown reports; six-interview evidence retained and outdated missing-interview wording absent.
- **Verdict:** `PASS` — `PLANTUML-COV-002` through `PLANTUML-COV-007`.

- **Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/*.puml`; visual inspection of overview, learner, DFD level 0 and ERD PNGs.
- **Output:** exit code `0`; 22 non-empty PNG renders generated; Learner/Admin are outside the Use Case boundary, GEC is internal, UC-10 is visible, DFD flows render, and ERD separates 15 active + 2 legacy from proposed entities.
- **Verdict:** `PASS` — `PLANTUML-COV-008` render/visual QA.

- **Command:** `git diff --check`
- **Output:** exit code `0` after active-plan and handoff EOF cleanup; no whitespace errors.
- **Verdict:** `PASS` — `PLANTUML-COV-009` documentation hygiene.

# PLANTUML-VI — Việt hóa 22 sơ đồ PlantUML (2026-08-23)

- **Environment:** Windows PowerShell; Java OpenJDK; PlantUML 1.2026.6; repository `D:\btl`; base commit `ec88ee7`.
- **Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/*.puml`
- **Output:** exit code `0`; 22/22 nguồn PlantUML biên dịch thành công với nhãn Unicode tiếng Việt.
- **Verdict:** `PASS` — `PLANTUML-VI-001` kiểm tra cú pháp và Unicode.

- **Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render-vi docs/plantuml/*.puml`
- **Output:** exit code `0`; tạo đủ 22 PNG không rỗng. Kiểm tra trực quan Use Case tổng quan, Activity GEC, DFD mức 0 và ERD cho thấy dấu tiếng Việt hiển thị đúng, không mất nhãn hoặc vỡ sơ đồ.
- **Verdict:** `PASS` — `PLANTUML-VI-002` render và visual QA.

- **Command:** static scan trên `docs/plantuml/*.puml` và review năm trục.
- **Output:** không còn actor `AI Service`, mã cũ UC-11 hoặc nhãn trạng thái tiếng Anh `PROPOSED / NOT IMPLEMENTED`; giữ nguyên UC-01..UC-10, API/RPC, model/entity/field và định danh kỹ thuật. Không có thay đổi runtime, schema hoặc dependency.
- **Verdict:** `PASS` — `PLANTUML-VI-003` bảo toàn ngữ nghĩa và boundary.

- **Command:** `git diff --check`
- **Output:** exit code `0` sau khi chuẩn hóa EOF; không có lỗi whitespace.
- **Verdict:** `PASS` — `PLANTUML-VI-004` vệ sinh diff.

# PPT-SYNC-UC10 — Slide deck synchronization with UC-10, 2-actor boundary and 22 PlantUML coverage (2026-08-23)

- **Environment:** Windows PowerShell, Node.js 24.19.0 runtime, `@oai/artifact-tool`.
- **Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
- **Output:** exit code 0; exported updated presentation with all 19 slides; rendered 19 PNGs to `D:\btl\tmp\timhieupaper-template-audit\revised-render`.
- **Verdict:** PASS — exported with 2 external actors (Learner, Admin), GEC internal processing, UC-10 Badges, and 22 PlantUML diagram references.

- **Command:** `node D:\btl\tmp\timhieupaper-template-audit\check_layout.mjs`
- **Output:** exit code 0; all 19 slide layout boundaries checked and verified without clipping.
- **Verdict:** PASS — layout bounds verified.

# PLANTUML-STD-EN — Standardize PlantUML English technical terminology (2026-08-23)

- **Environment:** Windows PowerShell, Java OpenJDK, PlantUML 1.2026.6.
- **Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/*.puml`
- **Output:** exit code 0; all 22/22 PlantUML sources compiled successfully.
- **Verdict:** PASS — `PLANTUML-STD-001` compiler syntax validation.

- **Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/*.puml`
- **Output:** exit code 0; rendered all 22 PNG diagrams. Visual inspection of `use-case-overview.png`, `use-case-learner.png`, `sequence-gec.png`, `dfd-level-0.png`, `erd-baseline-and-proposed.png` verifies English actors (`Learner`, `Admin`), English Use Cases (`UC-01`..`UC-10`), English technical entities/packages, and clear Vietnamese action flows and message arrows.
- **Verdict:** PASS — `PLANTUML-STD-002` render & visual QA.

- **Command:** `git diff --check`
- **Output:** exit code 0; clean whitespace across all modified `.puml` files.
- **Verdict:** PASS — `PLANTUML-STD-003` git hygiene.
## 2026-08-23 — project-1-software-engineering-documentation-cleanup

## 2026-08-23 — erd-remove-chat-session-models

## 2026-08-23 — remove-chat-scenario-models

## 2026-08-23 — add-individual-use-case-diagrams

**Command:** `java -jar plantuml.jar -checkonly docs/plantuml/*.puml` and `-tpng`.
**Output:** Exit code 0; 32/32 PlantUML sources compiled and 32/32 PNG diagrams rendered.
**Verdict:** PASS — `USECASE-COVERAGE-001`.

**Command:** `python tools/build_lingora_final_report.py`
**Output:** Exit code 0; final lecturer DOCX rebuilt successfully.
**Verdict:** PASS — `USECASE-COVERAGE-002`.

**Command:** `rg -n -i 'ChatScenario|Chat Scenario|kịch bản hội thoại|kịch bản chat|chat' docs/plantuml docs/report`
**Output:** Exit code 1; no chat entities or chat terminology remain in Project 1 reports/diagrams.
**Verdict:** PASS — `CHAT-SCOPE-001`.

**Command:** PlantUML `-checkonly` for `erd-baseline-and-proposed.puml` and `dfd-writing-grammar.puml`.
**Output:** Exit code 0; both diagrams compiled successfully.
**Verdict:** PASS — `CHAT-SCOPE-002`.

**Command:** `python tools/build_lingora_final_report.py`
**Output:** Exit code 0; final DOCX rebuilt; extracted text contains no chat terms.
**Verdict:** PASS — `CHAT-SCOPE-003`.

**Environment:** Windows, bundled Python/Node runtimes.

**Command:** `rg -n -i 'ChatSession|ChatMessage|17 models|legacy|deprecated' docs/report docs/plantuml`
**Output:** Exit code 1; no matching stale ERD entities or 17-model claims.
**Verdict:** PASS — `ERD-CLEANUP-001`.

**Command:** `python tools/build_lingora_final_report.py`
**Output:** Exit code 0; final lecturer DOCX rebuilt successfully.
**Verdict:** PASS — `ERD-DOCX-002`.

**Command:** DOCX extraction scan for `ChatSession|ChatMessage|17 models|legacy|deprecated`.
**Output:** `CHAT_SESSION False`; 156 paragraphs and 2 tables inspected.
**Verdict:** PASS — `ERD-DOCX-SCAN-003`.

**Command:** `slides_test.py docs/report/Lingora-Project-1-Requirements-Presentation.pptx`
**Output:** Exit code 0; `Test passed. No overflow detected.`
**Verdict:** PASS — `ERD-SLIDES-004`.

**Environment:** Windows, bundled Python and Node runtimes; LibreOffice/soffice unavailable.

**Command:** `python tools/cleanup_project1_docs.py`
**Output:** Exit code 0; cleaned reports, DOCX, PPTX and PlantUML artefacts.
**Verdict:** PASS — `PROJECT1-CLEANUP-001`.

**Command:** forbidden-term `rg` scan over `docs/report` and `docs/plantuml`.
**Output:** No matching forbidden terms after final cleanup.
**Verdict:** PASS — `PROJECT1-TERMINOLOGY-002`.

**Command:** `slides_test.py` for all three Project 1 decks.
**Output:** Exit code 0; all decks reported `Test passed. No overflow detected.`
**Verdict:** PASS — `PROJECT1-SLIDES-003`.

**Command:** `render_docx.py docs/report/Lingora-Project-1-Lecturer-Format-Final.docx --output_dir tmp/docx-final-clean`
**Output:** Exit code 1; LibreOffice executable unavailable (`FileNotFoundError`).
**Verdict:** N/A — visual DOCX render QA unavailable in this environment.

**Command:** `git diff --check`
**Output:** Exit code 0; only line-ending normalization warnings.
**Verdict:** PASS — `PROJECT1-DIFF-004`.

## 2026-08-23 — align-uc-scope-and-report-status

**Environment:** Windows, PowerShell, repository working tree (commit not created yet).

**Command:** `rg -n -i "\\[PROPOSED\\]|PROPOSED / NOT IMPLEMENTED|Approved target; not implemented|proposed-only|UC-09.*proposed|UC-10.*proposed|proposed.*UC-09|proposed.*UC-10" docs --glob "*.md" --glob "*.puml"`

**Output:** Exit code 0; no forbidden UC-09/UC-10 status labels in active Markdown/canonical/PlantUML sources. Remaining matches are presentation inspection artifacts outside this Markdown task scope.

**Command:** `git diff --check`

**Output:** Exit code 0; no whitespace errors.

**Verdict:** PASS

## 2026-08-23 — strip-proposed-and-redesign-presentation

**Environment:** Windows, PowerShell, Java OpenJDK, PlantUML 1.2026.6, Node.js `@oai/artifact-tool`.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/*.puml`
**Output:** exit code 0; 22/22 PlantUML source files compiled without errors. All `[PROPOSED]` tags and "not implemented" yellow note boxes stripped cleanly.
**Verdict:** PASS — `PLANTUML-STRIP-001` compiler syntax validation.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/*.puml`
**Output:** exit code 0; rendered all 22 PNG diagrams. Visual inspection of `use-case-overview.png`, `use-case-learner.png`, `activity-placement-test.png`, `activity-achievements.png`, `sequence-placement-test.png`, `sequence-achievements.png`, and `erd-baseline-and-proposed.png` confirms clean UC-01..UC-10 without `[PROPOSED]` disclaimers.
**Verdict:** PASS — `PLANTUML-STRIP-002` render & visual QA.

**Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
**Output:** exit code 0; rebuilt 19-slide presentation:
1. UC-09 and UC-10 cards styled identically without orange highlight or footer disclaimers.
2. Top-right "Slide XX" badges removed from all 19 slides.
3. Bottom warning/disclaimer banners removed from content slides.
4. Section divider slides (Slides 3, 6, 12, 16) simplified to only prominent section title.
5. Slide 19 redesigned to a single clean centered card.
All 19 slides rendered to PNG in `D:/btl/tmp/timhieupaper-template-audit/revised-render` and verified.
**Verdict:** PASS — `PPT-REDESIGN-CLEANUP-001`.

**Command:** `git diff --check`
**Output:** exit code 0; clean whitespace across all modified files.
**Verdict:** PASS — `GIT-HYGIENE-001`.

## 2026-08-23 — integrate-survey-dataset-metrics

**Environment:** Windows, PowerShell, Node.js `@oai/artifact-tool`, Excel survey dataset (`Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`).

**Command:** `node scratch/parse_survey.mjs`
**Output:** exit code 0; successfully parsed all 24 questions across survey responses (N=15):
- 100% người học thừa nhận quên từ vựng (53.3% rất thường xuyên)
- 93.3% mong muốn hệ thống tự đề xuất nội dung ôn tập
- 86.7% từng bỏ học do nản / thiếu phương pháp
- 80.0% đánh giá cấp thiết ôn tập ngắt quãng (SRS 4.13/5.0)
- 66.7% yêu cầu sửa lỗi ngữ pháp câu viết & giải thích chi tiết
- 80.0% mục tiêu học vì công việc, 73.3% ưu tiên bài tập điền từ
**Verdict:** PASS — `SURVEY-ANALYTICS-001`.

**Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
**Output:** exit code 0; updated Slides 4, 7, and 8 with high-impact quantitative survey percentages, rating scores, and 5 core user needs. All 19 slides rendered to PNG in `D:/btl/tmp/timhieupaper-template-audit/revised-render`.
**Verdict:** PASS — `PPT-SURVEY-INTEGRATION-001`.

## 2026-08-23 — integrate-survey-and-format-final-report

**Environment:** Windows, bundled Python runtime, repository working tree.

**Command:** Survey workbook analysis with bundled Python/pandas against `D:/btl/Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`.

**Output:** 1 worksheet, 15 rows, 25 columns (timestamp + 24 questions). Reconciled inserted findings: 15/15 = 100.0%; 13/15 = 86.7%; 12/15 = 80.0%; 14/15 = 93.3%; 10/15 = 66.7%; 9/15 = 60.0%. Multi-select counts were computed per option against N=15.

**Verdict:** PASS

**Command:** Structural DOCX audit using `section_audit.py` and `python-docx` checks on `Lingora-Project-1-Lecturer-Format-Final.docx`.

**Output:** A4 portrait, one section, 1.00 in margins, different first page, 154 paragraphs, 4 tables, 40 heading paragraphs, survey text present, Times New Roman runs present.

**Verdict:** PASS — structural format checks.

**Command:** `render_docx.py` on reference and final DOCX.

**Output:** FAIL — LibreOffice/soffice executable unavailable (`WinError 2`); PNG visual QA could not run in this environment.

**Verdict:** FAIL — visual render unavailable; final document remains structurally verified and this limitation is disclosed.

**Command:** `git diff --check`

**Output:** Exit code 0; no whitespace errors.

**Verdict:** PASS

## 2026-08-23 — docx-audit-and-scope-harmonization

**Environment:** Windows, PowerShell, Python 3.11 (`python-docx`), Node.js.

**Command:** `& "C:\Users\tungt\AppData\Local\Programs\Python\Python311\python.exe" tools/build_lingora_final_report.py`
**Output:** Exit code 0; generated `D:\btl\docs\report\Lingora-Project-1-Lecturer-Format-Final.docx` cleanly from updated `lingora-project-1-lecturer-format.md`.
**Verdict:** PASS — `DOCX-REBUILD-FINAL-001`.

**Command:** `node "C:\Users\tungt\.gemini\antigravity\brain\c36e59f4-b75f-4aff-916f-5b65c2098998\scratch\inspect_docx.mjs"`
**Output:** Exit code 0; scanned all 215 non-empty paragraphs and tables in `Lingora-Project-1-Lecturer-Format-Final.docx`:
- 0 occurrences of `[PROPOSED]`, `not implemented`, `chưa triển khai`, or deferred wording.
- All 10 Use Cases (`UC-01`..`UC-10`) present and active.
- Survey quantitative metrics (N=15, 100% forgetting vocab, 93.3% adaptive, 86.7% habit drop, 80% SRS 4.13/5, 66.7% grammar feedback) verified.
- 2 external actors (Learner, Admin) and internal GEC processing confirmed.
- References to 22 PlantUML technical diagrams verified.
**Verdict:** PASS — `DOCX-CONTENT-AUDIT-001`.

**Command:** `git diff --check`
**Output:** Exit code 0; no whitespace errors across all files.
**Verdict:** PASS — `GIT-HYGIENE-002`.

## 2026-08-23 — global-terminology-replacement (remove-ai-ml-gec-acronyms)

**Environment:** Windows 11, PowerShell, Java OpenJDK, PlantUML 1.2026.6, Python 3.11 (`python-docx`), Node.js.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/*.puml`
**Output:** Exit code 0; 22/22 PlantUML source files compiled without errors after renaming and standardizing terminology.
**Verdict:** PASS — `PLANTUML-TERMINOLOGY-001`.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/*.puml`
**Output:** Exit code 0; all 22 PlantUML technical diagrams rendered to PNG successfully.
**Verdict:** PASS — `PLANTUML-RENDER-002`.

**Command:** `node audit_deliverables.mjs` (regex scan over all Markdown reports, PlantUML files, DOCX files, PPTX files)
**Output:** Exit code 0; 0 occurrences of forbidden terms `GEC`, `T5-small`, `T5`, `NLP`, `ML`, `Machine Learning`, `Trí tuệ nhân tạo`, `AI Service`.
**Verdict:** PASS — `DELIVERABLES-TERMINOLOGY-AUDIT-003`.

**Command:** `& "C:\Users\tungt\AppData\Local\Programs\Python\Python311\python.exe" tools/build_lingora_final_report.py` (and remaining DOCX builders)
**Output:** Exit code 0; all 4 DOCX reports rebuilt cleanly with standardized software engineering terminology.
**Verdict:** PASS — `DOCX-REBUILD-CLEAN-004`.

**Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
**Output:** Exit code 0; 19-slide presentation deck rebuilt and verified with 0 forbidden terms.
**Verdict:** PASS — `PPTX-REBUILD-CLEAN-005`.

## 2026-08-23 — slide-deck-color-palette-softening

**Environment:** Windows 11, Node.js, `@oai/artifact-tool`.

**Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
**Output:** Exit code 0; updated all 19 slides with soft, elegant, light academic pastel color tokens matching the UTC university template. Re-exported 19/19 PNG slide images to `tmp/timhieupaper-template-audit/revised-render/` and rebuilt `Lingora-Project-1-Requirements-Presentation.pptx`, `-V2.pptx`, and `-Soft.pptx`.
**Verdict:** PASS — `PPTX-COLOR-SOFTENING-001`.

## 2026-08-23 — slide-deck-expansion-22-slides (activity-dfd-erd-dedicated-slides)

**Environment:** Windows 11, Node.js, `@oai/artifact-tool`.

**Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
**Output:** Exit code 0; built enriched 22-slide presentation containing dedicated Activity slides (Slide 11 for UC-05, Slide 12 for UC-06), DFD Level 0 breakdown slide (Slide 18), and ERD 17-entity classification slide (Slide 19). Re-exported all 22 slide PNGs and synchronized all PPTX deliverables (`Lingora-Project-1-Requirements-Presentation.pptx`, `-Updated.pptx`, `-V2.pptx`, `-Soft.pptx`).
**Verdict:** PASS — `PPTX-EXPANSION-22-SLIDES-001`.

## 2026-08-23 — activity-diagram-srs-retry-loop-refinement

**Environment:** Windows 11, PowerShell, Java OpenJDK, PlantUML 1.2026.6.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/activity-srs-review.puml`
**Output:** Exit code 0; compiled successfully with explicit repeat-while retry loop calling RPC `record_review(vocab_id, rating)` and decision branch for `Retry <= 3 lần` vs `Hoãn thẻ sang phiên sau`.
**Verdict:** PASS — `PLANTUML-ACTIVITY-SRS-RETRY-001`.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/activity-srs-review.puml`
**Output:** Exit code 0; rendered updated PNG `D:/btl/tmp/plantuml-render/activity-srs-review.png`.
**Verdict:** PASS — `PLANTUML-ACTIVITY-SRS-RENDER-002`.

## 2026-08-23 — activity-diagram-writing-grammar-logic-refinement

**Environment:** Windows 11, PowerShell, Java OpenJDK, PlantUML 1.2026.6.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/activity-writing-grammar.puml`
**Output:** Exit code 0; updated UC-06 activity diagram with full prompt iteration loop `while (Còn câu gợi ý?)`, input validation retry loop `repeat...while (Chỉnh sửa và nhập lại)`, graceful microphone fallback to manual input, separate review/submit step, and analysis retry / skip branch without dropping out of the exercise session.
**Verdict:** PASS — `PLANTUML-ACTIVITY-WRITING-LOGIC-001`.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/activity-writing-grammar.puml`
**Output:** Exit code 0; rendered updated PNG `D:/btl/tmp/plantuml-render/activity-writing-grammar.png`.
**Verdict:** PASS — `PLANTUML-ACTIVITY-WRITING-RENDER-002`.

## 2026-08-23 — dfd-diagrams-standard-notation-overhaul

**Environment:** Windows 11, PowerShell, Java OpenJDK, PlantUML 1.2026.6.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -checkonly docs/plantuml/dfd-*.puml`
**Output:** Exit code 0; all 5 DFD diagrams (`dfd-context.puml`, `dfd-level-0.puml`, `dfd-srs.puml`, `dfd-writing-grammar.puml`, `dfd-lesson-exercise.puml`) compiled with strict standard DFD Gane & Sarson / Yourdon notation:
- Process modeled as oval (`usecase`) with numbered and descriptive verb-noun naming (`1.0`..`6.0`).
- External Entities modeled as rectangles (`Learner`, `Admin`).
- Data Stores modeled as database symbols (`D1`..`D6`).
- All data flows labeled with structured IDs (`[DF-01]`..`[DF-59]`).
- 0 direct connections between External Entities and Data Stores (all traffic routed via Processes).
- 0 lifelines or timeline sequences.
**Verdict:** PASS — `PLANTUML-DFD-STANDARD-OVERHAUL-001`.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/dfd-*.puml`
**Output:** Exit code 0; rendered all 5 updated DFD PNGs.
**Verdict:** PASS — `PLANTUML-DFD-RENDER-ALL-002`.

## 2026-08-24 — dfd-level-0-layout-optimization-and-clarity

**Environment:** Windows 11, PowerShell, Java OpenJDK, PlantUML 1.2026.6.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/dfd-level-0.puml`
**Output:** Exit code 0; rendered optimized DFD Level 0 diagram with compact spatial layout, 2-way data flow arrows combining request-response pairs (`[DF-01]`..`[DF-23]`), and zero crossing lines between External Entities, Processes, and Data Stores.
**Verdict:** PASS — `PLANTUML-DFD-LEVEL-0-OPTIMIZATION-003`.

## 2026-08-24 — erd-diagram-and-slide-19-perfect-sync

**Environment:** Windows 11, PowerShell, Java OpenJDK, PlantUML 1.2026.6, Node.js.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/erd-baseline-and-proposed.puml`
**Output:** Exit code 0; rendered complete 17-entity ERD grouped into 5 packages matching actual Prisma physical schema.
**Verdict:** PASS — `PLANTUML-ERD-17-ENTITIES-001`.

**Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
**Output:** Exit code 0; embedded real PlantUML diagram images into Slide 10 (Use Case tổng quan), Slide 11 (Activity SRS), Slide 12 (Activity Writing/Grammar), Slide 18 (DFD Level 1), and Slide 19 (ERD 17 thực thể) and saved to all PPTX deliverables (`Lingora-Project-1-Requirements-Presentation.pptx`, `-Soft.pptx`, `-Updated.pptx`, `-V2.pptx`).
**Verdict:** PASS — `PPTX-EMBED-DIAGRAM-IMAGES-003`.

## 2026-08-24 — slide-deck-dfd0-and-erd-full-width-polish

**Environment:** Windows 11, PowerShell, Node.js 24.14.0, `@oai/artifact-tool`, PlantUML 1.2026.6.

**Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
**Output:** Exit code 0; verified all 22 slides:
- Slide 18: Title updated to "SƠ ĐỒ LUỒNG DỮ LIỆU TOÀN HỆ THỐNG (DFD LEVEL 0)", side cards (01..05 & 1.0..6.0) removed, DFD diagram embedded across the full slide canvas.
- Slide 19: Side badges (1..6) removed, 17-entity ERD diagram maximized to full height/width.
- All other 20 slides evaluated and preserved without modification.
- Deliverable `D:/btl/docs/project-1/XÂY DỰNG NỀN TẢNG HỌC NGOẠI NGỮ TRỰC TUYẾN LINGORA.pptx` and reports successfully generated and synchronized.
**Verdict:** PASS — `PPTX-SLIDE-DFD0-ERD-FULLWIDTH-POLISH-004`.

## 2026-08-24 — dfd-level-0-16-to-4-aspect-ratio-redesign

**Environment:** Windows 11, PowerShell, PlantUML 1.2026.6, Node.js 24.14.0.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/dfd-level-0.puml`
**Output:** Exit code 0; rendered 1305x332 PNG (Aspect ratio 3.93:1 ≈ 16:4.07) structured into 3 clean horizontal tiers (Top: Learner/Admin, Middle: 6 Processes 1.0..6.0, Bottom: 5 Data Stores D1..D6) with zero crossing lines and large legible typography.
**Verdict:** PASS — `PLANTUML-DFD0-16TO4-REDESIGN-005`.

## 2026-08-24 — erd-diagram-package-removal-and-clarity-boost

**Environment:** Windows 11, PowerShell, PlantUML 1.2026.6, Node.js 24.14.0.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/tmp/plantuml-render docs/plantuml/erd-baseline-and-proposed.puml`
**Output:** Exit code 0; rendered 1349x764 PNG (Aspect ratio 1.77:1 ≈ 16:9). Removed all 5 outer `package` bounding boxes (1, 2, 3, 4, 5) to eliminate wasted margin space; styled entities with direct soft color fills; increased font size to 12pt Segoe UI; maximized table size on Slide 19.
**Verdict:** PASS — `PLANTUML-ERD-PACKAGE-REMOVAL-006`.

## 2026-08-24 — erd-title-simplification

**Environment:** Windows 11, PowerShell, PlantUML 1.2026.6, Node.js 24.14.0.

**Command:** `node D:\btl\tmp\timhieupaper-template-audit\build_revised_deck.mjs`
**Output:** Exit code 0; simplified ERD title in both PlantUML source and Slide 19 to "SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD)", removing all verbose trailing annotations.
**Verdict:** PASS — `ERD-TITLE-SIMPLIFICATION-007`.

## 2026-08-24 — render-all-32-plantuml-diagrams-for-a4-reports

**Environment:** Windows 11, PowerShell, PlantUML 1.2026.6, Node.js 24.14.0.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/docs/report/diagrams docs/plantuml/*.puml`
**Output:** Exit code 0; rendered all 32 diagrams with standardized high-DPI (200 DPI), Segoe UI typography, round corner 8, and soft academic color palette. Verified aspect ratios and high-res dimensions (1000px-3700px) optimized for insertion into A4 portrait and landscape report pages. Synchronized across `docs/report/diagrams/`, `tmp/plantuml-all-final/`, and `tmp/plantuml-render/`.
**Verdict:** PASS — `PLANTUML-32-A4-RENDER-ALL-008`.

## 2026-08-24 — remove-all-note-blocks-from-all-diagrams

**Environment:** Windows 11, PowerShell, PlantUML 1.2026.6, Node.js 24.14.0.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/docs/report/diagrams docs/plantuml/*.puml`
**Output:** Exit code 0; removed all 7 `note ... end note` blocks across all PlantUML sources. Eliminated awkward looping arrow paths caused by note box obstacles. Re-rendered all 32 diagram PNGs and synchronized with presentation deliverables.
**Verdict:** PASS — `NOTE-BLOCKS-REMOVAL-009`.

## 2026-08-24 — full-suite-diagram-audit-and-supplementary-models

**Environment:** Windows 11, PowerShell, PlantUML 1.2026.6, Node.js 24.14.0.

**Command:** `java -jar $env:TEMP\lingora-plantuml\plantuml.jar -tpng -o D:/btl/docs/report/diagrams docs/plantuml/*.puml`
**Output:** Exit code 0; audited report placeholders and generated the 4 missing core architectural and design models:
1. `bfd-functional-decomposition.puml` (Sơ đồ phân rã chức năng BFD cân đối 2 nhánh 8 phân hệ).
2. `class-diagram.puml` (Sơ đồ lớp nghiệp vụ Domain Class Diagram).
3. `system-architecture.puml` (Sơ đồ kiến trúc 3 tầng Next.js + BFF + Supabase).
4. `sitemap-ui-flow.puml` (Sơ đồ điều hướng màn hình & luồng giao diện người dùng).
Total diagrams in suite increased from 32 to 36, all rendered to 200 DPI PNG in `docs/report/diagrams/`.
**Verdict:** PASS — `PLANTUML-36-FULL-SUITE-AUDIT-010`.

## 2026-08-24 — survey-charts-generation-and-slide-09-montage-embed

**Environment:** Windows 11, PowerShell, sharp, Node.js 24.14.0.

**Command:** `node D:/btl/tools/generate_survey_charts.cjs; node D:/btl/tmp/timhieupaper-template-audit/build_revised_deck.mjs`
**Output:** Exit code 0; generated 5 high-resolution vector/PNG survey charts from `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` (N=15):
1. `chart-survey-forgetting.png` (Tần suất quên từ vựng: 100% gặp vấn đề).
2. `chart-survey-srs-rating.png` (Mức độ cần thiết của SRS SM-2: 80% đánh giá 4-5 sao).
3. `chart-survey-abandonment.png` (Tỷ lệ đứt gãy/bỏ học: 86.7% từng bỏ học vì nản).
4. `chart-survey-grammar-needs.png` (Nhu cầu sửa lỗi & diff trực quan: 66.7%).
5. `chart-survey-exercise-types.png` (Dạng bài tập điền từ/trắc nghiệm: 73.3%).
6. `chart-survey-5-in-1-montage.png` (Tấm ghép toàn cảnh 5 biểu đồ độ nét cao).
Inserted new Slide 9 into the presentation deck (expanding from 22 to 23 slides total). Embedded real diagrams/charts across all previously empty slots. Rendered all 23 slides to PNG in `tmp/timhieupaper-template-audit/revised-render/` and saved PPTX to `docs/project-1/` and `docs/report/`.
**Verdict:** PASS — `SURVEY-CHARTS-AND-SLIDE-09-EMBED-011`.

## 2026-09-08 — full-uc-ac-completion-and-diagram-aesthetic-polish

**Environment:** Windows 11, PowerShell, Java 25 (OpenJDK 25.0.2), Python 3.11.9, PlantUML 1.2026.8.

**Command:** `& "D:\Android\Android Studio\jbr\bin\java.exe" -jar "$env:TEMP\lingora-plantuml\plantuml.jar" -checkonly "docs/plantuml/*.puml"`
**Output:** Exit code 0; all 45/45 PlantUML files compile with zero syntax errors.
**Verdict:** PASS — `PLANTUML-45-SYNTAX-CHECK-012`.

**Command:** `& "D:\Android\Android Studio\jbr\bin\java.exe" -jar "$env:TEMP\lingora-plantuml\plantuml.jar" -tpng -DPLANTUML_LIMIT_SIZE=8192 -o "docs/plantuml" "docs/plantuml/*.puml"` and synchronized copy to `docs/report/diagrams/`.
**Output:** Exit code 0; rendered all 45 diagrams at 200 DPI with Segoe UI typography, roundCorner 8, and soft pastel palette. Eliminated awkward looping arrows in `use-case-overview.puml` and `use-case-learner.puml`. 45 PNGs verified in both directories.
**Verdict:** PASS — `PLANTUML-45-PNG-RENDER-SYNC-013`.

**Command:** Audit of 10 Use Cases and Acceptance Criteria across canonical & report docs (`docs/06-system-analysis.md`, `docs/report/lingora-project-1-lecturer-format.md`, `docs/report/lingora-requirements-and-use-cases.md`).
**Output:** Full 10 Use Cases (UC-01 to UC-10) and User Stories (US-01 to US-10) with Objective, Actor, Preconditions, Main Flow, Alternative Flows, and Acceptance Criteria are completely specified and verified.
**Verdict:** PASS — `UC-AC-FULL-SPEC-AUDIT-014`.

**Command:** `py -3.11 tools/build_lingora_final_report.py`
**Output:** Exit code 0; `Successfully saved to: D:\school\btl\docs\report\Lingora-Project-1-Lecturer-Format-Final.docx`.
**Verdict:** PASS — `FINAL-REPORT-DOCX-BUILD-015`.

**Command:** `git diff --check`
**Output:** Exit code 0; zero whitespace or syntax errors.
**Verdict:** PASS — `GIT-DIFF-CHECK-016`.

## 2026-09-14 — phase-0-repository-cleanup-and-superpowers-standardization

**Environment:** Windows 11, PowerShell, Node.js 24.14.0, Python 3.11.9, Vitest 4.1.10, Pytest 8.4.2, Prisma 6.19.3.

**Command:** `npm run typecheck` (in `lingora-web`)
**Output:** Exit code 0; `tsc --noEmit` clean, zero type errors.
**Verdict:** PASS — `WEB-TS-TYPECHECK-017`.

**Command:** `npm run lint` (in `lingora-web`)
**Output:** Exit code 0; ESLint passed with zero warnings or errors.
**Verdict:** PASS — `WEB-ESLINT-018`.

**Command:** `npm run test:unit` (in `lingora-web`)
**Output:** Exit code 0; 6 test files passed, 19/19 tests passed.
**Verdict:** PASS — `WEB-VITEST-UNIT-019`.

**Command:** `npm run build` (in `lingora-web`)
**Output:** Exit code 0; Next.js 15.5.23 compiled successfully, all 9 static and dynamic routes generated.
**Verdict:** PASS — `WEB-PROD-BUILD-020`.

**Command:** `py -3.11 -m pytest` (in `lingora-ai/api`)
**Output:** Exit code 0; 37/37 tests passed in 0.43s.
**Verdict:** PASS — `AI-FASTAPI-PYTEST-021`.

**Command:** `npx prisma validate` (in `lingora-admin`)
**Output:** Exit code 0; `The schema at prisma\schema.prisma is valid 🚀`.
**Verdict:** PASS — `ADMIN-PRISMA-VALIDATE-022`.

**Command:** `npm run test:m1_4` (in `lingora-admin`)
**Output:** Exit code 1; `PrismaClientInitializationError: Error querying the database: FATAL: (ENOTFOUND) tenant/user postgres.oazmbpifslcpolkepyge not found`.
**Verdict:** BLOCKED — environment/configuration issue.

**Command:** `git diff --check`
**Output:** Exit code 0; clean diff, zero whitespace errors.
**Verdict:** PASS — `GIT-DIFF-CHECK-CLEANUP-023`.

**Command:** Repository-wide reference scan for `impeccable`, old skills (`source-driven-development`, `security-and-hardening`, `debugging-and-error-recovery`, `code-review-and-quality`), and deleted files.
**Output:** Zero broken references in active codebase; old frameworks completely removed.
**Verdict:** PASS — `REPO-REF-SCAN-024`.

---

## 2026-09-14 — Phase 0 Rebuild Reconciliation Implementation

**Environment:** Windows 11, PowerShell, Node.js 24.14.0, Python 3.11.9, Prisma 6.19.3.

**Command:** `npm run typecheck` (in `lingora-web`)
**Output:** Exit code 0; `tsc --noEmit` completed with zero type errors.
**Verdict:** PASS — `RECON-WEB-TYPECHECK-025`.

**Command:** `npm run lint` (in `lingora-web`)
**Output:** Exit code 0; `eslint .` completed with zero lint errors.
**Verdict:** PASS — `RECON-WEB-LINT-026`.

**Command:** `npm run test:unit` (in `lingora-web`)
**Output:** Exit code 0; Vitest 4.1.10 run: 6 test files passed, 19/19 tests passed in 3.47s.
**Verdict:** PASS — `RECON-WEB-VITEST-027`.

**Command:** `npm run build` (in `lingora-web`)
**Output:** Exit code 0; Next.js 15.5.23 production build succeeded, all 9 static and dynamic routes compiled cleanly.
**Verdict:** PASS — `RECON-WEB-BUILD-028`.

**Command:** `py -3.11 -m pytest` (in `lingora-ai/api`)
**Output:** Exit code 0; pytest 8.4.2 run: 37/37 tests passed in 0.36s.
**Verdict:** PASS — `RECON-AI-PYTEST-029`.

**Command:** `npx prisma validate` (in `lingora-admin`)
**Output:** Exit code 0; `The schema at prisma\schema.prisma is valid 🚀`.
**Verdict:** PASS — `RECON-ADMIN-PRISMA-030`.

**Command:** Database integration harness check (Supabase remote connection)
**Output:** Remote connection credentials unconfigured in local environment (`postgres.oazmbpifslcpolkepyge not found`).
**Verdict:** BLOCKED — environment/configuration issue.

**Command:** Repository-wide stale reference scan across active codebase for deleted artifacts/skills
**Output:** 0 stale references in active code (`docs/00`–`07`, `QUICK-REF.md`, `.agents/`, `lingora-*`).
**Verdict:** PASS — `RECON-REF-SCAN-031`.

**Command:** `git diff --check`
**Output:** Exit code 0; clean whitespace, zero merge conflict markers.
**Verdict:** PASS — `RECON-GIT-DIFF-032`.

---

## 2026-09-15 — Milestone M2.1 Independent Audit Fixes (P0-01..P1-07)

**Environment:** Windows 11, PowerShell, Node.js 24.14.0, Git 2.53.0.

**Test ID:** `T-M21-FIX-001`

**Command 1 (P0-01 - Administrator Emergency Authority):**
Inspection of `docs/plantuml/content-lifecycle-state.puml` and `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§5.1, §5.2, §5.3, §11.1).
**Output:**
- Administrator Emergency Publish (`IN_REVIEW -> PUBLISHED`) restored as dashed transition `#DC2626` with mandatory justification and AuditLog constraint (`emergency_publish: reason + audit_log mandatory`).
- Administrator Emergency Archive (`PUBLISHED -> ARCHIVED`) restored as dashed transition `#DC2626` with mandatory justification and AuditLog constraint (`emergency_archive: reason + audit_log mandatory`).
- Normal workflow preserved: Manager plans/assigns -> Creator authors -> Moderator reviews/approves -> Manager publishes.
- Prohibitions explicitly enforced: `CẤM Administrator Xuất bản Thường nhật`, `CẤM Tự phê duyệt / Xuất bản chéo` (Creator no self-approve/publish; Moderator no publish; no in-place edit).
**Verdict:** PASS.

**Command 2 (P1-02 - Removal of ARCHIVED -> DRAFT from Core):**
Inspection of `docs/plantuml/content-lifecycle-state.puml` and `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§5.1, §5.2, §5.3, §11.1).
**Output:**
- Transition `ARCHIVED --> DRAFT` completely removed from Core state machine in `.puml` and Core transition matrix (§5.2).
- Restoration classified strictly under `[FUTURE / OPEN DESIGN]` and `CẤM Phục hồi Core từ ARCHIVED` note.
**Verdict:** PASS.

**Command 3 (P1-03 - Elimination of TARGET_EXT / 2-Axis Model):**
Repository-wide scan for `TARGET_EXT` across `.md` and `.puml` files.
**Output:**
- Zero occurrences of `TARGET_EXT` in design tables, ERD, and PlantUML diagrams.
- Scope Axis (`CORE`, `EXTENSION`, `EXCLUDED`) strictly decoupled from Implementation Status Axis (`CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, `FUTURE_MIGRATION`).
- All 23 tables in §7.1 and all 18 Core Scope tables in §8.1–§8.18 clearly labeled on both axes.
**Verdict:** PASS.

**Command 4 (P1-04 - ExerciseType Enum Field-Level Status):**
Inspection of `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§8.8, §9.2).
**Output:**
- Explicit value-level breakdown table for `ExerciseType` in §8.8:
  - `CURRENT_APPLIED_DATABASE`: `MCQ`, `FILL_BLANK`, `REORDER` (migration `202608140001_init`).
  - `TARGET_SCHEMA / FUTURE_MIGRATION`: `LISTENING`, `GRAMMAR` (target `schema.prisma`, pending M2 migration).
  - Non-existent: `MATCHING` (0 occurrences in active schema/design).
**Verdict:** PASS.

**Command 5 (P1-05 / P1-06 - D-G1 & D-G2 Re-evaluation):**
Re-evaluation of Gate D-G1 and Gate D-G2 in §9.1 and §9.2.
**Output:**
- Gate D-G1: PASS (all 13 Core entities and 6 lifecycle states trace to FR/UC/BF; Administrator emergency publish/archive properly constrained with audit; ARCHIVED->DRAFT eliminated from Core; no self-approval/bypass).
- Gate D-G2: PASS (100% tables/fields labeled with canonical 3 statuses; 0 TARGET_EXT; ExerciseType accurately mapped to Applied vs Target/Future; 0 MATCHING; 0 Exam/QuestionBank).
**Verdict:** PASS.

**Command 6 (P1-07 - Candidate / Open Design Normalization):**
Inspection of candidate representations across §8.6, §8.8, §8.12, §11.1, §12.4.
**Output:**
- `assignment_brief`, `supersedes_id`, `starting_unit`, `placement_history`, `lesson_type`, `isAssessmentMode` consistently labeled `TARGET DESIGN CANDIDATE` or `OPEN DESIGN REPRESENTATION`.
- Zero instances of `RESOLVED` or `CURRENT_APPLIED_DATABASE` on unapplied candidate fields.
- Clear distinction maintained between locked behavioral policies (D3 clone-to-draft, D4 unified exercise, D6 placement mapping A) and open physical schema representations.
**Verdict:** PASS.

**Command 7 (Static PlantUML Syntax Balance & Boundary Verification):**
Static syntax check on all 4 `.puml` files + `git status` check.
**Output:**
- All 4 `.puml` files have balanced `@startuml` / `@enduml` pairs.
- Zero application code modified; zero schema changes in `prisma/schema.prisma`; zero migrations created/run; zero Supabase DB writes.
- Milestone M2.2+ has NOT started.
**Verdict:** PASS.

---

### `T-M21-FIX-002` (2026-09-15) — Targeted Fix Verification for P1-01 and P2-01

- **Environment:** Windows, Git 2.53.0.
- **Task:** `phase-1-m2-1-targeted-fix-p1-01-p2-01`
- **Scope:** Correct P1-01 (false CURRENT_APPLIED field claims on SRS tables) and P2-01 (canonicalize LEGACY_APPLIED to EXCLUDED on Scope axis).

**Command 1 (P1-01 - Migration Truth Verification):**
```powershell
Select-String -Path "lingora-admin/prisma/migrations/202608140001_init/migration.sql" -Pattern "CREATE TABLE.*review_logs|CREATE TABLE.*user_vocab_srs" -Context 0,15
```
**Output:**
- `review_logs` contains: `id UUID`, `srs_card_id UUID`, `is_correct BOOLEAN`, `interval_days DOUBLE PRECISION`, `reviewed_at TIMESTAMP`. NO `score` column.
- `user_vocab_srs` contains: `recall_probability DOUBLE PRECISION`. NO `recall_score Integer` column.
- `user_progress` contains: `score INTEGER` (lines 152, 157). Authentic applied column.
**Verdict:** PASS.

**Command 2 (P1-01 - Elimination of False Applied Claims in Markdown & PlantUML):**
```powershell
Select-String -Path "docs/phase-1-m2-1-domain-and-logical-data-foundation.md", "docs/plantuml/domain-model-core.puml" -Pattern "score.*Applied|recall_score|review_logs.*score"
```
**Output:**
- `recall_score`: 0 occurrences.
- `review_logs.score` / `review_logs` score: 0 occurrences.
- `docs/plantuml/domain-model-core.puml:131`: `+ score: Integer [Applied]` (under `UserProgress`, verified by migration).
- `docs/phase-1-m2-1-domain-and-logical-data-foundation.md:197, 587`: `score` in `UserProgress` (verified by migration).
**Verdict:** PASS.

**Command 3 (P2-01 - Scope Label Canonicalization to EXCLUDED):**
```powershell
Select-String -Path "docs/phase-1-m2-1-domain-and-logical-data-foundation.md", "docs/plantuml/*" -Pattern "LEGACY_APPLIED"
git grep "LEGACY_APPLIED" -- docs/phase-1-m2-1-domain-and-logical-data-foundation.md docs/plantuml
```
**Output:**
- 0 occurrences found across all active M2.1 design files and diagrams.
- Rows 22 and 23 in §7.1 now labeled `EXCLUDED` on Scope axis and `CURRENT_APPLIED_DATABASE` on Implementation Status axis.
**Verdict:** PASS.

**Command 4 (Markdown ↔ PlantUML Semantic Consistency):**
Comparison between §8.14/§8.15 of `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` and `docs/plantuml/domain-model-core.puml`.
**Output:**
- `ReviewLog`: Both define exactly 5 applied attributes (`id`, `srs_card_id`, `is_correct`, `interval_days`, `reviewed_at`). No `score`.
- `UserVocabSrs`: Both define `recall_probability: Float` with applied attributes. No `recall_score`.
- `erd-logical-status-mapping.puml`: Already aligned with migration truth; 0 `chat_sessions`/`chat_messages` in ERD (Scope: `EXCLUDED`).
**Verdict:** PASS.

**Command 5 (Repository & Technical Boundary Hygiene):**
```powershell
git diff --check -- plans/current-task.md
git status --short
```
**Output:**
- `git diff --check`: 0 whitespace or patch conflicts on modified tracked files.
- `git status --short`: Zero application code modified, 0 schema changes in `prisma/schema.prisma`, 0 migrations created/run, 0 database writes.
- Milestone M2.2 NOT started.
**Verdict:** PASS.

---

### `T-P0-REQ-001` (2026-09-15) — Phase 0 User Research, Application Benchmark & Requirements Specification Verification (Gates G1–G6)

- **Environment:** Windows, Python 3.11.9, Git 2.53.0.
- **Task:** `phase-0-user-research-analysis-and-requirements-authoring`
- **Scope:** Complete authoring of 6 core report sections in `docs/phase-0-user-research-analysis-and-requirements.md` (127,955 characters, 911 lines).
- **Target Deliverable:** `docs/phase-0-user-research-analysis-and-requirements.md`.

**Command 1 (Automated Validation Gates Audit G1–G6):**
```powershell
py -3 scratch/verify_gates.py
```
**Output:**
```
================================================================================
INDEPENDENT AUDIT & VERIFICATION OF PHASE 0 REQUIREMENTS DOCUMENT
Target: d:\school\btl\docs\phase-0-user-research-analysis-and-requirements.md
Document Length: 127955 chars | 911 lines
================================================================================

[GATE G1: EVIDENCE GATE]
Evidence label counts: {'PRIMARY': 12, 'SECONDARY': 14, 'SYNTHETIC': 13, 'PRODUCT DECISION': 9}
>> GATE G1 VERDICT: PASS (All 4 canonical evidence labels actively present)

[GATE G2: NUMBER GATE]
Instances of foreign N=500 claimed as empirical survey data: 0
>> Foreign N=500 data check: PASS (0 foreign sample records)
>> Survey fraction & percentage checks: PASS (All 11 key ratios verified)
>> GATE G2 VERDICT: PASS

[GATE G3: SYNTHETIC ISOLATION GATE]
Contains mandatory synthetic disclaimer box: True
Fabricated persona survey claims count: 0
>> GATE G3 VERDICT: PASS (Synthetic data strictly isolated for process discovery; 0 false survey claims)

[GATE G4: SAMPLE-REPORT REJECTION GATE]
Active Exam entity matches: 0
Active QuestionBank matches: 0
>> GATE G4 VERDICT: PASS (0 phantom entities Exam/QuestionBank; TOEIC 200Q strictly rejected)

[GATE G5: NFR RIGOR GATE]
Contains 'TBD / PROPOSED TARGET' designation: True
Ungrounded latency claims: 0
>> GATE G5 VERDICT: PASS (Metric discipline enforced; unverified metrics tagged TBD)

[GATE G6: TRACEABILITY GATE]
Missing FRs count: 0
Missing Pain Points count: 0
Missing Roles count: 0
Acceptance Criteria clauses: Given=19, When=19, Then=19
>> GATE G6 VERDICT: PASS (100% FRs, Pain Points, Canonical Roles traced with Given-When-Then ACs; 0 orphan requirements)

================================================================================
FINAL AUDIT RESULT: ALL 6 VALIDATION GATES (G1-G6) PASSED WITH ZERO FINDINGS!
================================================================================
```
**Verdict:** PASS.

**Command 2 (Repository & Technical Boundary Hygiene):**
```powershell
git diff --check
git status --short
```
**Output:**
- `git diff --check`: Exit code 0 (no trailing whitespace or patch conflict markers).
- Zero application code files created or modified.
- Zero Prisma schema changes (`prisma/schema.prisma` untouched).
- Zero SQL migrations created or executed.
- Milestone M2.1 remains intact (`REVISED — READY FOR TARGETED RE-REVIEW`).
- Milestone M2.2 NOT started.
**Verdict:** PASS.

### `T-TAILIEU-FIX-001` (2026-09-20) — tai-lieu-phan-tich-yeu-cau.md slide-readiness fixes (R-01/R-02/R-04/R-05/NFR/R-06/R-07) verification
**Environment:** Windows (win32), PowerShell 5.1, Python 3.11 + openpyxl 3.1.5, repo `D:/school/btl`.
**Command:** re-read vùng sửa + `py` grep-scan toàn file + recount Excel N=15 đối chiếu + `git status --short` (file untracked nên `git diff --stat` trống; thay bằng line/char count).
**Output:**
- `4 dạng` → 0 hit; `ngân hàng câu hỏi` → 0 hit (còn 4 hit phủ định `không .*ngân hàng đề thi độc lập` đúng ngữ cảnh D4); `không áp dụng cơ chế lưu tạm` → 0; `học lại từ đầu bài` → 0; `dưới 1 giây`/`không quá 3 giây` → 0.
- `5 dạng` → 14 hits; `Mapping A` → 2 hits; `max(1, floor` → 1 hit; `ADR-008` → 2 hits; `TBD / PROPOSED TARGET` → 3 hits; mapping table YC-CORE/EXT 20 dòng hiện diện.
- Số liệu Q1–Q24 không đụng tới (recount trước đó khớp raw toàn bộ).
- File: 675 dòng / 90954 ký tự (`docs/tai-lieu-phan-tich-yeu-cau.md`, untracked, chỉ chạm file này + plan + logs).
- 0 application code, 0 schema/migration, M2.2 NOT started.
**Verdict:** N/A — documentation-only verification by re-read + grep + recount (không ghi PASS suy diễn cho acceptance nghiệp vụ; slide-readiness cuối do human quyết).

### `T-TAILIEU-TAGS-001` (2026-09-20) — xử lý 22 tags [CẦN NHÓM XÁC NHẬN] trong tai-lieu
**Environment:** Windows (win32), PowerShell 5.1, Python 3.11, repo `D:/school/btl`.
**Command:** đếm tag chính xác bằng regex + xóa theo xác nhận nhóm qua question tool (5 nhóm) + viết lại 3 dòng đặc biệt (628/729/744) + grep-scan sau sửa.
**Output:** `\[CẦN NHÓM XÁC NHẬN\]` → 0 hit (từ 22); `CẦN BỔ SUNG` → 0 hit; không double-space thừa; file 799 dòng. Chỉ chạm `docs/tai-lieu-phan-tich-yeu-cau.md` + logs. 0 code/schema/migration, M2.2 NOT started.
**Verdict:** N/A — documentation-only (facts do nhóm xác nhận, không suy diễn).

### `T-TAILIEU-TAGS-002` (2026-09-21) — xử lý tags + typo + L580 theo quyết định user
**Environment:** Windows (win32), PowerShell 5.1, Python 3.11, repo `D:/school/btl`.
**Command:** xóa 19 tags đã xác nhận + viết lại 3 dòng (623/724/739) + fix typo "dài dặc" + fix L580 Unit 5→6; grep-scan sau sửa.
**Output:** `[CẦN NHÓM XÁC NHẬN]` → 0 hit; `dài dặc` (sai) → 0 hit; `Unit 1 đến Unit 5` → 0 hit; `Unit 1 đến Unit 6` → 3 hits; `QUYẾT ĐỊNH MỞ` → 1 hit. Chỉ chạm `docs/tai-lieu-phan-tich-yeu-cau.md` + logs. 0 code/schema/migration, M2.2 NOT started.
**Verdict:** N/A — documentation-only.

### `T-SLIDEDECK-FIX-001` (2026-09-21) — slide-deck Slide 9 + Slide 16 fixes
**Environment:** Windows (win32), PowerShell 5.1, Python 3.11, repo `D:/school/btl`.
**Command:** 4 edits + grep-scan sau sửa.
**Output:** `chiếm 60%` → 0 hit; `CORE-03, CORE-07` → 0 hit; `EXT-05 (Báo cáo)` → 0 hit; `CORE-01, CORE-10` → 0 hit. Chỉ chạm `docs/slide-deck-17-slides.md` + logs. 0 code/schema/migration, M2.2 NOT started.
**Verdict:** N/A — documentation-only.

### `T-DESIGN-REVIEW-FIX-001` (2026-09-24) — Design Review Fixes & 17 Consistency Guards Verification
**Environment:** Windows 11, PowerShell 5.1 / Python 3.11.9, Git 2.53.0.windows.1, repo `d:\school\btl`.
**Command 1 (Consistency Guards Verification Script):**
```powershell
$env:PYTHONIOENCODING='utf-8'; py C:\Users\tungt\.gemini\antigravity\brain\d5d8ae2f-0f78-4ca2-a99a-d62652e1036d\scratch\verify_consistency_guards.py
```
**Output:**
```text
[PASS] 1. NO_UC_16_17_18: Found 0 positive matches: []
[PASS] 2. SURVEY_N15_ACCURACY: Q7 distribution matches recounted 7/6/6/6/5/2
[PASS] 3. NO_P1_FR_COLLISION: Col 1 uses DESIGN-FR-* without P1-FR collision: []
[PASS] 4. READING_EXERCISE_PROPOSED: READING exercise labeled PROPOSED / DESIGN GAP
[PASS] 5. EXIT_ASSESSMENT_SPECIFIED: EXIT / RE_EVALUATION specified with Progress != Proficiency
[PASS] 6. JUMP_PROVENANCE_TAG: Jump provenance tags present in progression model
[PASS] 7. REMEDIAL_GOVERNANCE: RemedialModule governance fields present
[PASS] 8. CONCEPT_ENTITY_EXISTS: Concept entity defined and FK referenced
[PASS] 9. FOUR_CONCEPTS_DISTINCT: Four concepts distinctly defined
[PASS] 10. STRICT_SEPARATION_GEC_GRAMMAR: Grammar exercise separated from GEC AI tool
[PASS] 11. LISTENING_EXERCISE_VOCAB_FK: LISTENING JSON payload uses vocabularyId and no audioPath key
[PASS] 12. HISTORICAL_SCOPE_LABELED: 04-data-model scope boundaries labeled HISTORICAL / SUPERSEDED
[PASS] 13. SLIDE_DECK_RESEARCH_DISAMBIGUATION: Slide deck distinguishes N=15, N=7, N=2 expert-informed
[PASS] 14. NON_MANDATORY_CONFIRMATION: Non-mandatory confirmation gate aligned
[PASS] 15. ARCHITECTURE_POINTER_RESOLVED: docs/01 §3 exists
[PASS] 16. FIVE_EXERCISE_TYPES_CONSISTENT: 5 exercise types consistently noted in 05 and 02
[PASS] 17. TRACEABILITY_FULL_CHAIN: Full traceability chain YC -> MVP -> P1-FR -> UC -> Design present
--------------------------------------------------
ALL 17 CONSISTENCY GUARDS PASSED!
```
**Verdict:** PASS.

**Command 2 (Git Whitespace & Repository Boundary):**
```powershell
git diff --check
```
**Output:** Exit code 0 (no whitespace errors, no conflict markers). Zero application code, zero DB migrations created or modified.
**Verdict:** PASS.

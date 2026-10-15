# M2.3 PLAN — Sequence + API / Service Boundary (PLAN ONLY)

> Status: `DRAFT — REVIEW REQUIRED` (human approval required before any M2.3 implementation).
> Entry state: `M2.1 ACCEPTED FOR M2.2`, `M2.2 ACCEPTED FOR M2.3` (commit `7ab74b4`), `M2.3 PLAN: NOT STARTED`.
> Boundary: PLAN ONLY. No runtime code, API implementation, Prisma/schema, migrations, RLS, UI, or service-code changes. `docs/03-api-contract.md` is READ-ONLY during planning.

## 1. Objective

Define how accepted M2.2 behavior is translated into a **design-level interaction contract**: sequence interactions, service boundaries, API contract boundaries, request/response responsibility, state-change ownership, failure/error boundaries, and UC/BF→sequence/API/service traceability. Output is design documentation only (PlantUML + Markdown), not implementation.

## 2. Source of Truth

| # | Document | Role in M2.3 |
|---|---|---|
| 1 | `docs/phase-1-system-design-plan.md` §7 (M2.3), §5 (artifacts 11, 12, 15), §10 (D-G4/D-G5/D-G6) | Authoritative roadmap: scope, contracts, gates. Overrides all paraphrases |
| 2 | `docs/phase-1-m2-2-behavior-uc-activity-state.md` (§§2–10) + 7 `*m22.puml` | Accepted behavior input: 15 UCs, 15 BFs, state machines, decision flows |
| 3 | `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§§4, 8, 11.2) | Authoritative ownership + Applied/Target/Future statuses + DD register |
| 4 | `docs/03-api-contract.md` (READ-ONLY) | Existing AI-service HTTP contract: tiers, GEC target, error envelope/codes, MOCK/version rules |
| 5 | `docs/01-architecture.md` (M0.5 baseline §§379–428, §§3.1–3.6) + ADRs (002, 005, 008, 014) | Component/repo boundaries, stateless AI, `record_review` security-definer rule, locale/health boundaries |
| 6 | `docs/02-requirements.md` (P1-FR-001..017, P1-NFR-001..004), `docs/05-traceability-matrix.md`, `docs/06-system-analysis.md` (§4–§5) | Requirements, UC/BF catalogs, existing traces |
| 7 | `docs/08-english-a1-curriculum.md`, `docs/09-placement-and-jump-specification.md`, D3 (§§A–Q, esp. §N), D4 (§§A–T, esp. §Q) | Locked policies (Mapping A, Jump, Retry, SRS, streak) + OPEN decisions firewall |
| 8 | `HANDOFF.md`, `plans/current-task.md`, `logs/decision-log.md` | Governance state; M2.3 remains NOT STARTED |

Historical/superseded material (`00` §§0.1–0.5 legacy, Android, DKT/HLR/MultiWOZ, 10-UC legacy, `01` migrated blocks) is reference-only. Source-of-truth precedence rule (normative for M2.3): **current accepted ADR/architecture decision = normative; historical M0.5 ownership wording = historical/superseded context**. In particular, `01` M0.5 ML/NLP ownership lines (§M0.5, incl. lines 387–388 on DKT/HLR/Transformer ownership) are superseded by ADR-014 and must never be cited as normative. M2.1/M2.2 artifacts are read-only baselines; corrections, if ever needed, go through their own review tasks, never silent M2.3 edits.

### Normative GEC ownership (reconciled from ADR-014 + `03`, no inference)

* Normative owner: the **supporting AI service boundary** (`lingora-ai/api/`, stateless) invoked exclusively through the fixed Next.js Route Handler proxy; behavior family **BF-14**; **no UC** (fabricating one is forbidden).
* GEC owns only `corrected_text` per `03`; alignment/classifier own derived edits (per `03` normative rules).
* GEC owns **nothing** else: not LearningProgress, mastery, proficiency, streak, completion, or curriculum progression (§7 invariant; SEQ-10 fallback mandatory).
* If this reconciliation ever fails against canonical sources, STOP and record `REVIEW / BLOCKED — GEC ownership conflict requires human resolution`. It reconciles cleanly at plan time — no block triggered.

### Artifact identity (normative for M2.3)

| ID | Canonical identity | Owns (distinct, no collapse) |
|---|---|---|
| #11 | Sequence Diagrams / Sequence Set | Sequence interactions; lifelines; request/response flow; alternate/error paths; UC/BF interaction coverage |
| #12 | API Contract / Service Boundary | API contract boundary; service-facing request/response semantics; input/output ownership; read/write boundary; auth context; error boundary; compatibility/gap analysis against existing `03` (read-only) |
| #15 | Service Interaction / Boundary Model | Service responsibilities (incl. presentation/data/domain layer responsibilities); service-to-service interaction; dependency direction; authoritative state ownership; AI boundary; persistence boundary; failure containment; logical service interaction model |

No separate "Domain-Class Model" artifact exists under M2.3: layer/class-responsibility content lives **inside #15** as service-responsibility modeling (not a standalone artifact, not dropped). #12 and #15 are never collapsed into one artifact and their responsibilities are never swapped: #12 faces the contract/consumer side, #15 faces the service/ownership side.

## 3. Scope

**In scope (design only):** artifact #11 sequences for grouped canonical flows; artifact #12 contract/service-facing boundary analysis; artifact #15 service interaction model (incl. layer responsibilities) + classified boundary table; ownership/failure/idempotency analysis at conceptual level; UC/BF→sequence/API traceability append; D-G4/D-G5 evidence + D-G6 input evidence; controlled updates to `01` (cross-ref), `05` (§9 M2.3), logs, `HANDOFF.md`, `plans/current-task.md` at implementation time.

**Out of scope (§19):** API code, controllers, service classes, repositories, Prisma changes, migrations, RLS changes, runtime auth changes, UI code, AI implementation, deployment, monitoring, performance optimization, load testing. Physical audit-schema design belongs to M2.4+ (DD-03). RLS implementation belongs to M2.4+. MFA/rate-limit values/token formats/transport mechanisms are not invented.

## 4. Artifact Contract (six-field, per roadmap §5)

| # | Purpose | Inputs | Outputs | Dependencies | Trace | Validation Gate |
|---|---|---|---|---|---|---|
| #11 Sequence Diagrams / Sequence Set | Define interaction ownership, timeout/fallback, persistence, audit points for grouped M2.2 flows | API/security constraints (read-only), M2.1 state/data models, M2.2 behavior, `01` boundaries, `03` contract | `sequence-*m23.puml` set (§5: SEQ-01..10) + sequence specification notes | Artifacts 2, 5, 10 (+ #15/#16 as downstream references) | BF; UC/BF; ADR boundaries; `record_review`; GEC 8s timeout | D-G4 + D-G5: no AI primary-data ownership; RLS/RPC + timeout evidence present |
| #12 API Contract / Service Boundary | Define the service-facing contract boundary: request/response semantics, I/O ownership, read/write split, auth context, error boundary, compatibility/gap analysis vs `03` | `03` (read-only), M2.2 behavior flows, M2.1 ownership, SEQ-01..10 interaction needs | Contract-boundary analysis per surface (semantics, owner, auth context, errors, gaps); NO contract edits, NO code | #11 sequences; M2.1 domain model; `03` | UC/BF flows; P1-FR-002/003/005 request/response needs; `01` | D-G4 + D-G5: consumer-facing semantics traceable without implementation claims; no silent change |
| #15 Service Interaction / Boundary Model | Define service responsibilities (incl. presentation/data/domain layer duties), service-to-service interaction, dependency direction, authoritative state ownership, AI/persistence boundaries, failure containment | `01` architecture, M2.1 domain/status model, M2.2 behavior, #11 interaction needs | Logical service interaction model doc + `service-boundary-m23.puml` (services, layers, dependencies, owners); CURRENT/TARGET/FUTURE/COMPATIBILITY GAP table for PostgREST/RPC/Storage/Admin/AI + owner + errors + gap register | #11 sequences; M2.1 model; downstream #13/#16 (M2.4 references, not inputs) | API contracts; UC/BF; `record_review`; GEC; single-owner table (§7) | D-G5 + D-G6-input: boundaries classified, ownership single, AI non-owner; missing surfaces classified, never invented |

Expected paths: `docs/phase-1-m2-3-sequence-api-service-boundary.md` (master), `docs/plantuml/sequence-*m23.puml` (SEQ-01..10), `docs/plantuml/service-boundary-m23.puml` (services + layers + dependencies + owners + boundary table); controlled updates: `01` (§3.7 cross-ref), `05` (§9), logs, `HANDOFF.md`, `plans/current-task.md`. No standalone layer/class-model file: layer duties are a section inside the #15 model.

## 5. Sequence Scope (#11)

Grouped diagrams (10 max, full coverage; no per-UC explosion):

| ID | Sequence | UC/BF source |
|---|---|---|
| SEQ-01 | Authenticate/session (GoTrue → Profile lookup → httpOnly session; invalid/locked exceptions) | UC-01/BF-01 |
| SEQ-02 | Onboarding: goals/timezone + entry-path choice (self-report UNVERIFIED vs diagnostic offer) | UC-02 (+ UC-03 offer) |
| SEQ-03 | Diagnostic placement (Routing→Targeted → AssessmentResult → SkillProfile → Mapping A → Starting Unit; skip/retake branches) | UC-03/BF-08 |
| SEQ-04 | Jump assessment (cooldown check → scoped test → ≥95% provenance vs 24h lockout) | UC-04/BF-11 |
| SEQ-05 | Lesson/exercise/retry/completion (first-pass → allowance → 70% credit → COMPLETED; audio-failure exception) | UC-05/BF-09/10 |
| SEQ-06 | SRS review (due query → recall → Policy B step → atomic `record_review` → ReviewLog) | UC-06/BF-12 |
| SEQ-07 | Progress/streak (qualifying activity → tz-aware date compare → +1/keep/reset-to-1) | UC-07/BF-13 |
| SEQ-08 | Authoring→moderation→publish (assign → draft → IN_REVIEW → APPROVED/CHANGES_REQUESTED → PUBLISHED; emergency APPROVED→PUBLISHED + reason + AuditLog; clone-to-draft v2) | UC-08/09/10, BF-03/04/05/06/07 |
| SEQ-09 | Admin/ops (accounts UC-11, reports UC-12, audit read UC-13, tickets UC-14/BF-15; UC-15 extension shown as boundary-only) | UC-11–15 |
| SEQ-10 | Scenario writing + GEC (prompt → Route Handler proxy → `/v1/gec/correct` → transient diff; 8s timeout → recoverable fallback; no persistence) | BF-14/P1-FR-007 (no UC) |

### Lifeline vocabulary (closed set — no vague "System")

`Learner` and 5 staff actors (canonical 6 roles); `Web Learner` (Next.js Route Handler/proxy + UI boundary); `Web Admin`; `Supabase GoTrue Auth`; `Supabase PostgREST`; `Supabase RPC (record_review)`; `Supabase Storage`; `AI Server (FastAPI, stateless)`; `AuditLog (append-only store, TARGET)`. Technical swimlanes must be labeled infrastructure, never new business roles. No new domain entities for diagram convenience (use M2.1 entities only).

### Per-flow responsibility checklist (§8)

Primary actor → UI/client boundary → application/orchestrator → domain/service component → persistence boundary → AI service (iff BF-14) → external auth (iff SEQ-01) → returned result → error/failure path (from §11 taxonomy). Every mutation names its authoritative owner (§9); every read names read-owner vs derived consumer.

## 6. API Contract / Service Boundary (#12) + Service Interaction Model (#15)

### 6A. Artifact #12 — contract/consumer-facing scope

For each surface in the register below, #12 defines: service-facing request/response semantics, input/output ownership, read vs write split, auth context required, error boundary (codes only from `03`, else `OPEN / PENDING VALIDATION`), and compatibility/gap analysis against existing `03`. #12 never edits contracts, never writes code, never designs physical schema.

### 6B. Artifact #15 — service/ownership-facing scope

For the same surfaces, #15 defines: responsible service (incl. presentation/data/domain layer duties), service-to-service interaction + dependency direction, authoritative state owner (single, per §7), AI boundary (non-owner), persistence boundary, failure containment, and the CURRENT / TARGET / FUTURE / COMPATIBILITY GAP classification. #12 and #15 are produced as two distinct sections/artifacts and never collapsed.

### 6C. Surfaces to classify (initial register; M2.3 verifies exhaustiveness)

| Surface | Expected status | Basis |
|---|---|---|
| AI HTTP: `GET /health/*`, `GET /v1/model/info` | CURRENT | `03` tiers (observed implemented) |
| AI HTTP: `POST /v1/srs/schedule`, `/v1/chat/roleplay`, `GET /v1/chat/scenarios` | COMPATIBILITY GAP (retained) | `03` + ADR-010/014; consumers migrate before any deprecation |
| AI HTTP: `POST /v1/gec/correct` | TARGET (specified, pending) | `03` target + SEQ-10 |
| Web Learner Route Handler proxy (auth forward, 8s timeout, fallback) | TARGET (observed foundation, design to be specified) | `01` boundary + M2.2 BF-14 |
| Supabase GoTrue (signup/login/refresh/sign-out, JWT) | CURRENT | M1.6W evidence; SEQ-01 |
| PostgREST reads (published chain, own-learner rows) | CURRENT (implicit contract — no HTTP doc exists) | M1.3/RPC evidence; gap note, not invention |
| RPC `record_review` (atomic log + card + streak) | CURRENT (locked behavior + security-definer rule) | `01` M0.5 + M2.1 DD-08 + SEQ-06 |
| Supabase Storage (avatar/audio paths, RLS-mediated) | CURRENT (paths) / TARGET (any new need → gap, not invention) | M1.3 evidence |
| Admin/Prisma boundary (content/scenario/media writes, service-role isolation) | TARGET (design to be specified; implementation in later tasks) | `01` + SoD |
| Placement/Jump/SRS/progress writes via application services | TARGET (ownership specified in §9; no code) | M2.2 behavior |

`03` stays READ-ONLY: M2.3 records gaps/contradictions in a gap register; any future contract edit needs its own approved task (per `03` §5.3 versioning rules).

## 7. Ownership Rules (from M2.1/M2.2, unchanged)

Single authoritative owners — no duplicates:

| State | Write owner | Read owner / consumers | Notes |
|---|---|---|---|
| Lesson completion (`UserProgress`) | Application lesson service (UC-05/BF-10 rule) | Learner dashboard (derived) | Completion ≠ score/mastery/proficiency |
| LearningProgress | LearnerProfile-scoped progress service | Dashboard, readiness inputs | Sole owner LearnerProfile (M2.1) |
| Streak (`streakCount`, `lastQualifyingActivityDate`) | Streak evaluator within `record_review` transaction + lesson-completion path | Dashboard | D9; AI excluded |
| Curriculum entry / Starting Unit | Placement service (diagnostic) / provisional self-report path | Path browse | Self-report UNVERIFIED, no evidence entities |
| Jump provenance (`by_jump`, SKIPPED labels) | Jump assessment service | Path browse | Never completion |
| KnowledgeGap / ConceptMastery | Gap/mastery evaluators on exercise/SRS evidence | Readiness, recommendation inputs, dashboard | Thresholds CONFIGURABLE (firewall) |
| AssessmentResult | Assessment execution (per purpose×mode) | SkillProfile updater, readiness, dashboard | Immutable; retake = new record |
| AI outputs (GEC text) | Transient only | Scenario UI (derived display) | AI owns NOTHING listed above (§9 invariant) |
| AuditLog events | Emitting boundary per action (auth/content/publish/admin flows) | UC-13 reads | Append-only; physical schema NOT designed in M2.3 |

## 8. Questions A–H (plan answers at implementation)

A. Auth terminates at Supabase GoTrue; session identity trusted via server-side session (httpOnly) + `auth.uid()` derivation at RPC; role authorization evaluated at application boundary (conceptual) + RLS (M2.4 implementation). No new mechanisms. B. Role/SoD enforced conceptually in application/service layer per matrix; RLS NOT implemented in M2.3 (M2.4). C. See §7 table. D. Assessment crosses boundaries as: execution → immutable result → derived SkillProfile update; purpose/mode preserved on the result; retake = new record. E. GEC invoked at Route Handler proxy → AI server; stateless; never authoritative for progression (SEQ-10 fallback path mandatory). F. Scheduling (Policy B step, application-side deterministic) separated from review capture and from atomic `record_review` persistence; `record_review` stays the atomic conceptual mutation boundary. G. Creator/Moderator/Manager cross application→data boundaries only through SoD-gated transitions (SEQ-08); no bypass path may appear. H. Audit recording owner = emitting boundary per action (table in §7); physical audit schema out of scope.

## 9. Error / Failure Taxonomy (design-level; codes only from `03`)

Unauthenticated, unauthorized role, invalid state transition, missing resource, duplicate/replayed mutation, stale request, validation failure, dependency timeout (incl. 8s GEC), AI failure (`MODEL_UNAVAILABLE` → fallback), persistence failure, atomic-mutation failure. Reuse `03` codes (`INVALID_INPUT`, `TEXT_TOO_LONG`, `LANG_NOT_SUPPORTED`, `SCENARIO_NOT_FOUND`, `UNAUTHORIZED`, `RATE_LIMITED`, `MODEL_UNAVAILABLE`) + envelope where applicable; anything unresolved → `OPEN / PENDING VALIDATION` (no invented codes/schemas).

## 10. Idempotency / Atomicity Matrix (conceptual)

Reads: idempotent by nature (dashboard, path browse, due query). Atomicity-required: `record_review` (locked), publish transition (single-writer Manager + audit), clone-to-draft creation. Idempotency-protection analysis REQUIRED (not mechanisms): retry completion (double-submit), placement/retake (replay), Jump (replay/cooldown races), assignment, publish; each gets a conceptual requirement row (e.g., "replayed submit must not double-count") without implementation mechanism.

## 11. Traceability Strategy

Append: Requirement → MVP → P1-FR → UC → BF → Domain → D3 → D4 → M2.2 Behavior → **M2.3 Sequence/API** (artifact/section IDs). Consume UC-01..15, BF-01..15, D3/D4 decision IDs, M2.2 section IDs as-is; zero new IDs.

### Coverage matrix (normative for M2.3 completeness)

Every row must resolve to existing IDs; indirectly-covered items carry explicit rationale. Verified at plan time against accepted baselines:

| UC/BF | Sequence ID | Artifact #12 API Boundary | Artifact #15 Service Boundary |
|---|---|---|---|
| UC-01 / BF-01 | SEQ-01 | GoTrue session semantics; auth context + envelope errors | Auth service vs session trust boundary; `auth.uid()` derivation point |
| UC-02 (goals/time) | SEQ-02 | Goal/timezone I/O semantics; validation errors | Profile-owning service; tz-aware evaluation owner |
| UC-03 Placement / BF-08 | SEQ-03 | Diagnostic I/O; Mapping A output semantics; retake = new record | Placement service; AssessmentResult writer; SkillProfile derived updater |
| UC-04 Jump / BF-11 | SEQ-04 | Jump request/result semantics; cooldown + provenance fields | Jump service; bypass-marker writer (never completion) |
| UC-05 Exercise/Retry / BF-09/10 | SEQ-05 | Answer/feedback/completion semantics; allowance + credit fields | Lesson service (completion owner); concept-evidence routing |
| UC-06 SRS / BF-12 | SEQ-06 | Due/review/record semantics; atomic `record_review` contract | SRS scheduler (deterministic) vs persistence boundary; AI excluded |
| UC-07 Progress/Streak / BF-13 | SEQ-07 | Progress/streak read semantics; qualifying-activity definition | Streak evaluator; dashboard derived consumer |
| UC-08 Authoring / BF-03/04 | SEQ-08 §authoring | Draft/clone I/O; assignment context fields | Creator-scoped service; SoD gate enforcement point |
| UC-09 Review / BF-05/06 | SEQ-08 §review | Approve/request-changes semantics | Moderator-scoped service; no publish path |
| UC-10 Publish / BF-07 (+BF-02 planning) | SEQ-08 §publish | Publish/archive semantics; emergency reason + audit fields | Manager service (sole publisher); Admin emergency path; AuditLog emitter |
| UC-11/12/13 (accounts/reports/audit) | SEQ-09 §admin | Admin I/O semantics; audit-read semantics | Admin service; audit-append emitter vs audit-read consumer |
| UC-14 Support / BF-15 | SEQ-09 §support | Ticket I/O; escalation semantics | Ops service; minimal-lookup boundary |
| BF-14 GEC (no UC) | SEQ-10 | `/v1/gec/correct` consumer semantics; timeout/fallback contract | Stateless AI service boundary; transient-only; non-owner of all §7 states |
| UC-15 extension | SEQ-09 §boundary-only | No Core contract surface | Extension boundary marker only (rationale: optional/future, zero Core dependency) |

## 12. Gates (roadmap-exact)

**D-G4** (plan §10 verbatim scope: artifacts 9–12+19, UC/BF/roles): M2.3 evidence = sequence set (#11) + contract/service boundary analyses (#12/#15) + screen→interaction→service trace; PASS = all UCs/BFs correct actors/traces incl. sequences, UC-15 future, no ghost/policy drift; FAIL = orphan/wrong-actor/missing-exception/future-in-Core/drift. (References to artifacts 9, 10, 19 inputs are satisfied by accepted M2.2 outputs; "layer model" evidence lives inside #15, not a separate artifact.) **D-G5** (artifacts 11–15 + `01` + `03` + ADRs): evidence = ownership verification + full surface classification (#15 table) + contract analysis (#12) + ADR cross-ref; PASS = boundaries match ADRs, no silent contract change, stateless AI, explicit timeout/fallback; FAIL = contradiction/unclassified/target-as-current/unauthorized change. **D-G6** (artifact 16 + 13–15 + roles + RLS model + ADRs): M2.3 provides INPUT evidence only (ownership/timeout/fallback/RLS-RPC/boundary references from #11/#12/#15); gate closure belongs to M2.4/M2.5 — the plan forbids claiming D-G6 PASS in M2.3. No gate renamed; D-G5 is boundary-consistency evidence, never "API testing".

## 13. Open-Decision Firewall

Preserved OPEN/PENDING/CONFIGURABLE: scoring/weights, adaptive branching, stopping, mastery/readiness/remediation thresholds, Anchor aggregation, CEFR expansion, HSK mapping/version, recommendation policy/version, gap archival, Reading physical representation, diagnostic item-count beyond `~25–30 PROPOSED`. Any sequence guard/API field/service rule needing an unlocked value writes `OPEN / PENDING VALIDATION` + owner/source (e.g., "owner: future psychometric validation; source: D3 §N"). Gate scan hunts frozen values.

## 14. Verification Strategy (deterministic)

Trace-completeness checklist (matrix §11 row-by-row); UC/BF coverage scan (0 orphan, 0 new IDs); SoD walkthrough per sequence (creator≠approver≠publisher; emergency path exact); ghost-entity scan (Exam/QuestionBank/AssessmentSession/MATCHING/physical-READING); endpoint-invention scan (every surface maps to `03` or gap register); physical-schema-claim scan (no tables/columns/RLS/SQL); open-decision-freeze scan (no literal thresholds beyond locked D1–D9 values); contract-drift check (`03` untouched — byte-compare); D-G4/D-G5 evidence + D-G6-input completeness. PlantUML balance checks allowed as syntax-only, never semantic proof.

## 15. Risks

| Risk | Mitigation |
|---|---|
| Existing API contract conflicts with M2.2 behavior | Read-only compatibility audit + explicit gap register (§6 table) |
| Service boundary duplicates state ownership | Single-owner table (§7); D-G5 probe |
| Sequences freeze implementation choices | Logical-boundary notation + non-claim section per diagram (lifelines = accepted boundaries; no libraries/routes/code) |
| AI becomes progression owner | AI non-ownership invariant in every relevant sequence + SEQ-10 fallback; D-G5 probe |
| SoD bypass in service interactions | Actor→service authorization matrix (SEQ-08); D-G4/D-G6-input probes |
| Open decisions become API fields/guards | OPEN/PENDING tagging + gate scan (§13) |
| Legacy routes silently normalized | `03` preserved byte-identical; explicit change list = empty unless approved task exists |
| Sequence explosion | 10 grouped sequences + coverage matrix (§5, §11) |

Known watch item (not a blocker): `01` M0.5 lines 387–388 (ML/NLP ownership of DKT/HLR/Transformer) are stale vs ADR-014; M2.3 cites ADR-014 as authoritative and flags the lines for a future canonical cleanup task — does not resolve or rely on them.

## 16. Out of Scope (§19 restated)

No API code/controllers/service classes/repositories/Prisma/migrations/RLS/runtime-auth/UI/AI-impl/deployment/monitoring/perf/load-testing. M2.3 defines the contract later implementation must follow; physical audit schema and RLS implementation wait for M2.4+.

## 17. Execution Order (post-approval)

```text
M2.2 ACCEPTED → M2.3 PLAN REVIEW → HUMAN APPROVE → M2.3 IMPLEMENT
→ D-G4/D-G5/D-G6 VALIDATION → INDEPENDENT REVIEW → remediation if needed
→ ACCEPTANCE → commit → M2.4 PLAN
```

## 18. Exit Gate

M2.3 DONE only when: #11/#12/#15 satisfy six-field contracts with consistent canonical identity throughout (table, paths, coverage matrix, gate evidence, file list, exit criteria); all 10 sequences + service interaction model (incl. layer duties) + boundary table complete with ownership/fallback evidence; every surface classified (zero unclassified); `03` byte-identical; no ghost/policy-drift/open-freeze findings; traceability append complete; D-G4/D-G5 evidence + D-G6-input evidence recorded; zero implementation work performed.

## 19. Stop Conditions

Return to REVIEW/BLOCKED (record issue, invent nothing) if: D-G5/D-G6 unlocatable (§12 located them — cleared); `03` vs M2.2 conflict needs unapproved product decision; new entity/field/enum required; runtime/schema/security implementation required; untraceable requirement; new ID required; open decision must freeze; accepted M2.2 semantics must change. None triggered at plan time.

## 20. Files Expected (implementation phase, NOT this task)

`docs/phase-1-m2-3-sequence-api-service-boundary.md`, `docs/plantuml/sequence-*m23.puml` (SEQ-01..10), `docs/plantuml/service-boundary-m23.puml` (services + layers + dependencies + owners + boundary table — includes layer-responsibility content, no separate layer file); controlled updates: `01` (§3.7), `05` (§9), logs, `HANDOFF.md`, `plans/current-task.md`.

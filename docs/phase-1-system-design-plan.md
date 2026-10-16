# PHASE 1 — SYSTEM ANALYSIS & DESIGN PLAN (IMPLEMENTATION-INDEPENDENT)

> **Document:** `docs/phase-1-system-design-plan.md`<br>
> **Status:** `HISTORICAL (Phase 1 System Design Plan — Executed in M2.1–M2.6; Historical Reference)`<br>
> **Purpose:** Historical planning record for the Phase 1 System Analysis & Design package.<br>
> **Boundary:** No code, schema change, migration, database change, API implementation, UI implementation, ERD/UML/DFD execution, requirements change, curriculum change, Placement Mapping change, or M2 implementation is authorized by this plan.

## 1. Objective

Produce the Lingora System Analysis & Design package so that every design artifact is traceable from Requirements → FR → UC → BF → Design, every current/target/future boundary is explicit, every open physical design decision is resolved before implementation handoff, and the Repository Design and Academic Report remain synchronized.

The plan determines HOW. It does not redefine WHAT.

## 2. Baseline and Non-Negotiable Invariants

The following are read-only inputs to design:

- Product scope: Software Engineering core; AI/GEC supporting capability.
- Roles: Learner, Lesson Creator, Moderator, Organizational Manager, Operations Staff, Administrator.
- Logical learning hierarchy: `Course → Unit → Lesson → Exercise`.
- Content workflow and separation of duties: Manager-driven assignment; Moderator review/approval; Manager publication; no self-approval; revision clone-to-draft; six-state lifecycle.
- Curriculum: English A1 pilot, 6 Units, 24 Lessons, approximately 200 vocabulary items.
- Placement: approximately 30 questions, Skip → U1, Retake from Profile, output Starting Unit, approved Mapping A, no CEFR certification.
- Jump: approved scopes, pass ≥95%, fail cooldown 24 hours.
- Retry: allowance `max(1, floor(N * 0.10))`, retry credit 70%, completion is not an 80% score threshold.
- SRS: deterministic Policy B `[1, 3, 7, 14, 30]`, independent of AI service ownership.
- Boundaries: Learner Web, Admin application, Supabase Auth/Postgres/RLS/Storage/RPC, and stateless AI service through the approved proxy boundary.
- Security invariants: application authorization, Supabase RLS, privileged service-role isolation, Admin boundary, audit of sensitive actions, and AI inference-only ownership.

These invariants are not open design decisions and must not be changed by Phase 1 design.

## 3. Scope

In scope: workstreams A–I, the 20 artifacts in §5, the locked/open decision register in §8, milestones M2.1–M2.6 in §7, validation gates D-G1–D-G10 in §10, the report mapping in §11, and the design handoff evidence in §12.

Out of scope: implementation, migration execution, runtime schema changes, API implementation, pixel UI/design tokens, model training/benchmarking, new MVP functions, Exam or QuestionBank entities, badges, advanced exam security, DOCX import, formula processing, streak recovery, CEFR certification, DKT, HLR, MultiWOZ, Android learner platform, or any product-policy change.

`Cohort` and `SupportTicket` are extension boundaries only. They must not be treated as Core MVP entities in the Core domain/data design.

## 4. Design Workstreams

**A. Analysis refinement** — Normalize the existing FR/UC/BF terminology and alias table; mark Core versus extension boundaries; label every data reference `CURRENT_APPLIED_DATABASE`, `TARGET_SCHEMA`, or `FUTURE_MIGRATION`. This workstream may not change requirements or product policy.

**B. Logical design** — Define Core domain vocabulary, the locked content lifecycle, progression, assignment semantics, and explicit extension-boundary notes for Cohort/SupportTicket.

**C. Data design** — Map the approved logical model to Current Applied Database, Target Schema, and Future Migration as separate statuses. Define logical field semantics and Exercise payload context without executing schema or migration work.

**D. Interaction/behavior design** — Define UC, Activity, State, Sequence, Placement, Jump, Retry, and SRS behavior from locked business rules. Assessment remains a conceptual mode/context of `Exercise`; no Exam, QuestionBank, or separate assessment aggregate is permitted.

**E. Architecture design** — Place approved logic in the existing Web/Admin/Supabase/AI components. Preserve AI statelessness and inference-only ownership.

**F. Security design** — Define one responsibility matrix covering Learner Web, Admin application, Supabase RLS, privileged service role, AI server, and audit boundary. Application authorization never replaces RLS; RLS never replaces application role/flow checks.

**G. API/service boundary design** — Map current, target, future, and compatibility surfaces without silently modifying `docs/03-api-contract.md`. Review API and security jointly for `record_review`, RLS, privileged Admin writes, AI JWT verification, AI statelessness, and the 8-second GEC timeout/fallback.

**H. Validation** — Produce objective evidence for D-G1–D-G10, contradiction scans, terminology/ID checks, boundary checks, and trace completeness.

**I. Report packaging** — Maintain the explicit Design Artifact → Academic Report mapping in §11 and synchronize artifact identifiers and evidence references.

## 5. Artifact Register

Every artifact has the required six fields: Purpose, Inputs, Outputs, Dependencies, Trace, and Validation Gate.

| # | Artifact | Purpose | Inputs | Outputs | Dependencies | Trace | Validation Gate |
|---:|---|---|---|---|---|---|---|
| 1 | Domain Model | Define shared Core logical vocabulary and relations while isolating extension boundaries. | Requirements, actor catalog, UC/BF, curriculum, data dictionary. | Core domain model; Cohort/SupportTicket extension notes. | Requirements Baseline. | FR/UC/BF-02..15. | D-G1: every Core concept has purpose and trace; extension concepts are labeled. |
| 2 | Content Lifecycle State Model | Define locked six-state lifecycle, actor transitions, forbidden transitions, revision and publish authority. | D1–D3, roles baseline, UC-08/09/10, BF-05/06/07. | State/transition table with forbidden and audit obligations. | Artifact 1; locked workflow rules. | D1/D2/D3; UC-08/09/10; BF-05/06/07. | D-G1 and D-G7: every transition and forbidden self-action is evidenced. |
| 3 | Learning Progression Model | Define Course→Unit→Lesson progression and approved placement/jump entry behavior. | Curriculum 08, Placement/Jump 09, D5/D6. | Logical progression and entry-flow specification. | Artifact 1; locked Mapping A and Jump rules. | UC-03/04; BF-08/11; curriculum IDs. | D-G1 and D-G7: exact bands, thresholds, cooldown, and no-CEFR rule pass. |
| 4 | ERD (logical/status mapping) | Map logical entities and relations to Current Applied, Target Schema, and Future Migration. | Artifacts 1–3, data model, data dictionary, architecture. | ERD with status label on every store/entity. | Artifacts 1–3. | FR/UC/BF data references; D-G2. | D-G2: no target/applied/future conflation and no unapproved Core entity. |
| 5 | Data Dictionary Final | Define field semantics and Exercise payload/context rules without implementing schema. | Artifact 4, data dictionary, ADR-006, API contracts. | Field-level dictionary with status, ownership, nullability intent, and payload rules. | Artifact 4; locked Unified Exercise invariant. | FR/UC/BF fields; API request/response references. | D-G2: every field is classified and every payload has a trace. |
| 6 | DFD Context | Define system boundary, actors, stores, and AI supporting boundary. | Architecture, roles, UC catalog, artifacts 1 and 4. | Context flow view with Core versus extension labeling. | Artifacts 1 and 4. | UC-01..15; architecture boundary. | D-G3: external actors, stores, and AI boundary match source documents. |
| 7 | DFD Level 0 | Define Core processes, stores, controls, and data flows. | Context, ERD/status mapping, UC/BF, security boundary. | Level-0 process/data-flow specification. | Artifact 6; artifacts 4–5. | BF-01..15. | D-G3: every Core flow has source, destination, store status, and trace. |
| 8 | DFD Level 1 | Detail high-risk placement, lesson completion, SRS, and moderation flows. | Level 0, state model, placement spec, API/security constraints. | Four Level-1 flow specifications with error/fallback branches. | Artifacts 2, 3, 7, 15, 16. | BF-05/07/08/09/10/12. | D-G3 and D-G7: policy values and ownership are evidenced; no ghost store/entity. |
| 9 | Use Case Diagram | Define all 15 UC actors and Core/optional classification. | UC catalog, role catalog, extension boundary. | 15-UC actor map: 14 Core plus UC-15 optional/future. | Artifacts 1 and 6. | UC-01..15; trace matrix. | D-G4: all 15 UCs have correct actor and status labels. |
| 10 | Activity/State Behavior Set | Define business decisions, alternate paths, and state-dependent behavior. | State model, UC/BF, curriculum, D5–D8. | Activity/state specifications for approved flows. | Artifacts 2, 3, 9. | BF-01..15; D5/D6/D7/D8. | D-G4 and D-G7: each decision has locked rule, alternate path, and evidence. |
| 11 | Sequence Set | Define interaction ownership, timeout/fallback, persistence, and audit points. | API/security constraints, state/data models, architecture. | Auth, completion, `record_review`, GEC-BFF, moderation/publish sequences. | Artifacts 2, 5, 10, 15, 16. | BF; ADR architecture boundaries. | D-G4 and D-G5: no AI primary-data ownership; RLS/RPC and timeout evidence present. |
| 12 | Domain/Class Model | Define implementation-independent presentation/data/domain responsibilities. | Architecture, API boundary, Core domain model. | Conceptual class/layer model; no code classes required. | Artifacts 1, 5, 15. | P1-FR-002/003/005; architecture. | D-G4: responsibilities and dependencies are traceable without implementation claims. |
| 13 | Component Architecture | Define component ownership of rules and data boundaries. | Architecture baseline, artifacts 11, 15, 16, ADRs. | Component responsibility specification. | API/security pair; sequence set. | Architecture ADRs; UC/BF ownership. | D-G5: existing Web/Admin/Supabase/AI boundaries are preserved. |
| 14 | Deployment/Runtime Boundary | Define deployment locations, secret boundaries, and current versus target runtime status. | Architecture, environment constraints, security matrix. | Deployment/status specification. | Artifact 13; artifact 16. | NFRs; architecture and security docs. | D-G5 and D-G6: target schema/deployment is not claimed runtime-ready without evidence. |
| 15 | API Boundary Specification | Classify API/data surfaces as CURRENT, TARGET, FUTURE, or COMPATIBILITY GAP. | `docs/03-api-contract.md`, data model, security model, architecture. | Boundary table for PostgREST/RPC/Storage/Admin/AI. | Artifacts 5, 13, 16. | API contracts; UC/BF; `record_review`; GEC. | D-G5 and D-G6: no silent contract change; missing surfaces are classified. |
| 16 | Security Responsibility Matrix | Define application authorization, RLS, privileged operations, AI isolation, and audit responsibilities. | Roles baseline, architecture, data model, API boundary. | One matrix covering Learner Web, Admin, RLS, service role, AI, and audit. | Artifacts 13 and 15. | P1-NFR-001; UC-11/13; role matrix. | D-G6: every sensitive operation has enforcement and audit owner. |
| 17 | Placement/Jump Decision Flows | Define approved Mapping A, Jump scopes, threshold, and cooldown flows. | Placement/Jump spec, progression model, Exercise context invariant. | Decision-flow specification. | Artifacts 3, 10, 15. | UC-03/04; BF-08/11; D5/D6. | D-G7: exact policy values, Starting Unit output, and no CEFR pass. |
| 18 | SRS Decision Flow | Define deterministic Policy B schedule and AI-independent persistence ownership. | D8, SRS data model, API/security boundary. | Baseline→due→item→workload flow. | Artifacts 5, 11, 15, 16. | UC-06; BF-12; D8. | D-G7: deterministic schedule and AI non-ownership are evidenced. |
| 19 | Screen/Flow Inventory | Inventory Core role-based screens and states without pixel design. | UC/BF, role/security matrix, architecture boundary. | Screen/flow inventory with Core/extension status. | Artifacts 9, 10, 16. | UC catalog; BF catalog; NFR states. | D-G4 and D-G6: no future screen is presented as Core MVP. |
| 20 | Design Validation Report | Consolidate gate evidence, contradiction scan, open-decision closure, and report synchronization. | Artifacts 1–19, baseline audits, report mapping. | Evidence index, unresolved-issue register, final DoD result. | All artifacts; §§10–11. | D-G1..D-G10; FR→UC→BF→artifact. | D-G8, D-G9, D-G10: all evidence is present and no P0/P1 contradiction remains. |

## 6. Dependency Graph

```text
Requirements Baseline
        ↓
Domain Model (#1)
        ↓
┌──────────────────────────────┐
│ Data Design (#4–5)           │
│              ↕               │
│ Lifecycle / State (#2)       │
└──────────────────────────────┘
        ↓
UC / Activity / Behavior (#9–10)
        ↓
Sequence (#11)
        ↓
┌──────────────────────────────┐
│ API / Service (#15) ↔        │
│ Security (#16)               │
└──────────────────────────────┘
        ↓
Architecture / Deployment (#13–14)
        ↓
Validation (#20)
        ↓
Report Mapping / Handoff
```

The graph has two controlled iterative pairs and no deadlock:

1. **Data ↔ Lifecycle/State:** lifecycle transitions constrain audit/version/status fields; applied/target data constraints constrain which representation can realize those transitions. Each iteration must preserve the locked behavior and three-status labels.
2. **API ↔ Security:** `record_review`, RLS, privileged Admin writes, AI JWT verification, AI statelessness, and the 8-second GEC timeout/fallback must be reviewed together. API design cannot silently bypass the security matrix, and security design cannot invent an API contract.

## 7. Milestones

### M2.1 — Domain + Logical Data Foundation

**Scope:** Artifacts 1–5; Core domain, locked hierarchy/workflow vocabulary, status-labeled logical data mapping.  
**Input:** Requirements Baseline, roles/UC/BF, curriculum, placement specification, data model, ADRs.  
**Output:** Artifacts 1–5, alias table, Core/extension boundary register.  
**Dependencies:** Requirements Baseline; locked behavior list in §2.  
**Validation:** D-G1 and D-G2 using trace tables, status labels, and entity/field evidence.  
**Exit Criteria:** Every Core entity and state has FR/UC/BF trace; Cohort/SupportTicket are extension-only; no Current/Target/Future conflation remains.

### M2.2 — Behavior / UC / Activity / State

**Scope:** Artifacts 2, 3, 9, 10, 17, 18, 19.  
**Input:** M2.1 outputs, locked D1–D9 rules, curriculum and placement specifications.  
**Output:** UC, activity/state, progression, placement/jump, SRS, and Core screen/flow specifications.  
**Dependencies:** M2.1; Unified Exercise invariant; role/extension labels.  
**Validation:** D-G4 and D-G7 with exact rule-value evidence and actor matrices.  
**Exit Criteria:** All 15 UCs and 15 BFs are mapped; every locked policy appears exactly; no Exam/QuestionBank or CEFR behavior is introduced.

### M2.3 — Sequence + API / Service Boundary

**Scope:** Artifacts 11, 12, and 15.  
**Input:** M2.1–M2.2 outputs, `docs/03-api-contract.md`, architecture and security constraints.  
**Output:** Sequence set, conceptual class/layer model, and classified API/service boundary table.  
**Dependencies:** M2.1 data/lifecycle; M2.2 behavior; iterative API↔Security review.  
**Validation:** D-G4, D-G5, and D-G6 using ownership, timeout, fallback, RLS/RPC, and contract-classification evidence.  
**Exit Criteria:** Every surface is CURRENT, TARGET, FUTURE, or COMPATIBILITY GAP; no API contract is silently changed; AI has no primary-data ownership.

### M2.4 — Architecture + Security

**Scope:** Artifacts 13, 14, and 16.  
**Input:** M2.3 outputs, architecture ADRs, role catalog, data/RLS model.  
**Output:** Component/deployment responsibility specification and one six-boundary security responsibility matrix.  
**Dependencies:** API↔Security pair; current Web/Admin/Supabase/AI architecture.  
**Validation:** D-G5 and D-G6 against architecture, RLS, secrets, privileged access, and audit evidence.  
**Exit Criteria:** Application authorization and RLS are both present; service-role isolation, Admin boundary, AI isolation, and audit owner are explicit; target runtime is not claimed ready.

### M2.5 — Design Validation

**Scope:** Artifact 20 and all cross-artifact contradiction/trace checks.  
**Input:** Artifacts 1–19, baseline audits, decision register, risks, report mapping.  
**Output:** Evidence index, gate results, contradiction scan, open-decision closure record.  
**Dependencies:** M2.1–M2.4; §§8, 10, and 11.  
**Validation:** D-G1–D-G9 with recorded Input, Method, PASS/FAIL, and Evidence for each gate.  
**Exit Criteria:** All gates have evidence; every artifact satisfies six fields; no unresolved P0/P1 design contradiction or requirements drift exists.

### M2.6 — Design-to-Implementation Handoff

**Scope:** Design handoff only: migration-plan outline, implementation test-plan skeleton, report synchronization, and dependency register.  
**Input:** M2.5 validation report and approved design artifacts.  
**Output:** Implementation dependency list and handoff package; no executed implementation.  
**Dependencies:** M2.5; explicit report mapping in §11.  
**Validation:** D-G10 against the revised DoD and handoff evidence.  
**Exit Criteria:** Design package is implementation-readable, all open physical design decisions are resolved, report mapping is complete, and no code/schema/migration/API/UI work has been executed.

## 8. Decision Register

### 8.1 Locked Behavior — Not Reopened

These are requirements/business rules, not blocking open design decisions.

| Decision | Category | Why | Options | Recommended | Blocking? |
|---|---|---|---|---|---|
| Course→Unit→Lesson | LOCKED BEHAVIOR | Curriculum and MVP-04 define the hierarchy. | None at product level. | Preserve hierarchy; decide only physical representation in DD-01. | No |
| Manager-driven assignment | LOCKED BEHAVIOR | D1 defines planning/assignment ownership. | None at product level. | Manager plans/assigns; Creator authors assigned work only. | No |
| Separation of duties | LOCKED BEHAVIOR | D2 requires Moderator review/approval and Manager publication; no self-approval. | None at product level. | Preserve all actor restrictions and audit. | No |
| Clone-to-draft revision | LOCKED BEHAVIOR | D3 forbids in-place editing of published content. | None at product level. | Preserve immutable published history; resolve identity in DD-02. | No |
| Unified Exercise model | LOCKED BEHAVIOR | D4/ADR-006 prohibit separate assessment entities in MVP. | None at product level. | Assessment is conceptual mode/context of Exercise. | No |
| Placement output | LOCKED BEHAVIOR | D6 defines approximately 30 questions, Skip→U1, Retake from Profile, Starting Unit, no CEFR. | None at product level. | Preserve; resolve persistence HOW in DD-06. | No |
| Mapping A | LOCKED BEHAVIOR | Product Owner approved the curriculum-based score bands. | None. | Preserve exact Mapping A. | No |
| Jump | LOCKED BEHAVIOR | D5 fixes scopes, ≥95% pass, and 24h cooldown. | None. | Preserve exact rules. | No |
| Controlled Retry | LOCKED BEHAVIOR | D7 fixes 10% allowance, 70% credit, and completion semantics. | None. | Preserve exact rules. | No |
| SRS Policy B | LOCKED BEHAVIOR | D8 fixes deterministic intervals and AI independence. | None. | Preserve exact rules. | No |
| Security/ownership boundaries | LOCKED BEHAVIOR | Architecture and ADRs require Web/Admin boundaries, RLS, privileged isolation, audit, and AI inference-only ownership. | None at invariant level. | Preserve all invariants; resolve responsibility detail in DD-10. | No |

### 8.2 Open Design Representation — Must Resolve Before Handoff

| Decision | Category | Why | Options | Recommended | Blocking? |
|---|---|---|---|---|---|
| DD-01 Unit representation | OPEN DESIGN | Logical hierarchy is locked, but Current Applied DB and Target Schema differ. | Target Unit relation with future migration mapping; compatible view/grouping only if it preserves the locked hierarchy. | Design a Target representation and explicit Current Applied/Future Migration mapping; do not reopen hierarchy. | Yes for data design |
| DD-02 Revision identity | OPEN DESIGN | Clone-to-draft behavior is locked; identity and relation are physical design questions. | Revision key; parent/version relation; uniqueness; published identity options. | Choose a representation that preserves immutable published history and unambiguous parent/version identity. | Yes for lifecycle/data |
| DD-03 Audit physical structure | OPEN DESIGN | Audit semantics are locked: actor, action, target, timestamp, immutable/append-only behavior. | Physical storage, metadata/diff, IP/device metadata only if justified, retention, exact schema. | Choose only fields justified by requirements/security evidence; do not add schema at plan stage. | Yes for security/data |
| DD-04 Assignment representation | OPEN DESIGN | Manager assignment, Creator ownership, and no bypass are locked. | Lesson-associated fields/metadata; another representation only if no new entity is required. | Represent assignment information and `AssignmentBrief` within the approved Lesson boundary; no Assignment entity by default. | Yes for workflow/data |
| DD-05 Assessment context representation | OPEN DESIGN | D4 locks a unified Exercise model. | Context in approved Exercise payload; lesson/exercise scope metadata; another non-entity representation. | Choose a representation that creates no Exam entity, QuestionBank entity, or separate assessment aggregate. | Yes for behavior/data |
| DD-06 Placement persistence | OPEN DESIGN | Placement behavior and Mapping A are locked; persistence HOW is not. | Physical placement result representation across approved profile/result boundaries; exact history strategy. | Resolve score, startingUnit, latest result, retake history, timestamps, learner/profile relation, and non-editability before implementation. Do not choose derived/no-history unless evidence proves Retake, latest-result, auditability, and profile behavior. | Yes for data/security |
| DD-10 Role enforcement split | OPEN DESIGN | Six target roles coexist with two-role applied runtime. | Exact division of application authorization, RLS, privileged service role, Admin boundary, AI isolation, and audit; migration sequencing. | Use one responsibility matrix. Any “application first” sequencing must never weaken current RLS/security guarantees; application checks do not replace RLS. | Yes for security/architecture |

## 9. MVP and Boundary Controls

**Core Design:** Course, Unit, Lesson, Exercise, Vocabulary, Progress, SRS, content workflow, audit/security, and GEC boundary.

**Extension boundary only:** Cohort and SupportTicket.

**Not Core:** Badges, Exam, QuestionBank, DOCX import, formula processing, advanced exam security, streak recovery, CEFR certification, DKT, HLR, MultiWOZ, and Android learner platform.

Every ERD, Data Dictionary, DFD store, Architecture/Deployment note, Screen Inventory entry, and Report Mapping row must label extension and non-Core material explicitly. No future concept may appear as an MVP entity or runtime-ready component.

## 10. Validation Gates

### D-G1 — Domain Consistency

**Input:** Requirements Baseline, actor catalog, UC/BF catalog, curriculum, artifacts 1–3.  
**Validation Method:** Cross-reference every Core entity, state, actor ownership, and extension boundary against FR/UC/BF and locked behavior.  
**PASS Condition:** Every Core concept has a business purpose, owner, and FR/UC/BF trace; extension concepts are labeled; no orphan or contradictory ownership exists.  
**FAIL Condition:** Any orphan entity/state, role contradiction, unapproved Core entity, or missing trace.  
**Evidence:** Domain model, traceability table, extension-boundary register.

### D-G2 — Data Status and Logical Mapping

**Input:** Artifacts 1–5, `docs/04-data-model.md`, `docs/07-data-dictionary.md`.  
**Validation Method:** Inspect every entity/field/store status and compare logical, Current Applied Database, Target Schema, and Future Migration columns.  
**PASS Condition:** Every item has one explicit status; target existence is not described as runtime readiness; no unapproved Core schema is introduced.  
**FAIL Condition:** Any status conflation, missing field status, target-as-runtime claim, or invented entity/column.  
**Evidence:** ERD status table, Data Dictionary status column, applied/target/future reconciliation matrix.

### D-G3 — DFD and Ownership Flow

**Input:** Artifacts 4, 6–8, 13, 15, 16.  
**Validation Method:** For every Core data/control flow, verify source, destination, store status, actor authority, AI boundary, and fallback path.  
**PASS Condition:** All Core flows are traceable to BF/UC; stores have status labels; AI is inference-only; security ownership is explicit.  
**FAIL Condition:** Missing flow/store, unexplained data movement, AI primary-data ownership, or future flow shown as Core.  
**Evidence:** Context/Level-0/Level-1 flow specifications and flow trace table.

### D-G4 — UC, Activity, Sequence, and Screen Trace

**Input:** Artifacts 9–12 and 19, UC/BF catalog, roles baseline.  
**Validation Method:** Cross-check all 15 UCs, 15 BFs, actors, alternate paths, screen states, and sequence participants.  
**PASS Condition:** All UCs/BFs have correct actors and behavior traces; UC-15 is labeled optional/future; no diagram/spec introduces Exam/QuestionBank or altered product policy.  
**FAIL Condition:** Orphan UC/BF, wrong actor, missing exception path, future screen in Core, or behavior drift.  
**Evidence:** UC/BF-to-artifact matrix, activity/state set, sequence set, screen inventory.

### D-G5 — Architecture and API Boundary

**Input:** Artifacts 11–15, `docs/01-architecture.md`, `docs/03-api-contract.md`, ADRs.  
**Validation Method:** Verify component ownership and classify every API surface as CURRENT, TARGET, FUTURE, or COMPATIBILITY GAP.  
**PASS Condition:** Web/Admin/Supabase/AI boundaries match ADRs; no silent API contract change; AI is stateless/inference-only; timeout/fallback ownership is explicit.  
**FAIL Condition:** Boundary contradiction, unclassified surface, target-as-current claim, or API change without approved contract update.  
**Evidence:** Component/deployment responsibility tables, API classification table, ADR cross-reference.

### D-G6 — Security Responsibility

**Input:** Artifact 16, artifacts 13–15, roles baseline, RLS/data model, architecture ADRs.  
**Validation Method:** Walk each sensitive operation through application authorization, RLS, privileged service role, Admin boundary, AI boundary, and audit owner.  
**PASS Condition:** One matrix covers Learner Web, Admin, Supabase RLS, privileged service role, AI server, and audit; application checks and RLS are both present; secrets are isolated.  
**FAIL Condition:** Any operation relies on UI-only checks, application authorization replaces RLS, service role leaks, AI writes primary data, or audit owner is missing.  
**Evidence:** Responsibility matrix, RLS matrix, secret-boundary table, audit responsibility table.

### D-G7 — Locked Learning Policies

**Input:** Artifacts 3, 10, 17, 18; curriculum and placement specs; D5–D8.  
**Validation Method:** Compare every placement, jump, retry, SRS, and Exercise-context rule to the locked numeric and semantic policies.  
**PASS Condition:** Mapping A, Starting Unit output, Skip→U1, Jump scopes/95%/24h, Retry 10%/70%, SRS Policy B, and Unified Exercise invariant match exactly; no CEFR claim appears.  
**FAIL Condition:** Any threshold, cooldown, interval, completion rule, output, entity model, or CEFR statement differs.  
**Evidence:** Decision-flow tables, policy-value checklist, traceability rows.

### D-G8 — Artifact Contract and Trace Completeness

**Input:** Artifacts 1–20 and §5.  
**Validation Method:** Check each artifact for Purpose, Inputs, Outputs, Dependencies, Trace, and Validation Gate, then follow every trace to a source ID.  
**PASS Condition:** All 20 artifacts contain all six fields and every Core output has FR/UC/BF evidence.  
**FAIL Condition:** Missing field, generic validation wording, broken trace, or artifact without an evidence-producing gate.  
**Evidence:** Six-field artifact checklist and FR→UC→BF→artifact matrix.

### D-G9 — Contradiction, Drift, and Boundary Scan

**Input:** All design artifacts, baseline audit patterns, §8, §9, and source documents.  
**Validation Method:** Scan for obsolete terminology, requirements-change language, Exam/QuestionBank entities, CEFR claims, future-feature leakage, target/applied conflation, and report/design divergence.  
**PASS Condition:** Zero unresolved P0/P1 contradiction or requirements drift; every match is either removed or explicitly labeled historical/extension/out-of-scope.  
**FAIL Condition:** Any unresolved obsolete statement, product-policy reopening, future Core leakage, or stale source-of-truth reference.  
**Evidence:** Pattern list, match/disposition log, source/version check, boundary scan result.

### D-G10 — Design-to-Implementation Handoff Readiness

**Input:** D-G1–D-G9 evidence, DoD, §11 report mapping, handoff package.  
**Validation Method:** Verify all artifacts, milestones, locked/open decisions, boundaries, security matrix, API classifications, risks, and report rows are complete without implementation execution.  
**PASS Condition:** All 20 artifacts and six milestones satisfy their contracts; all open physical decisions are resolved; report mapping and implementation dependency outlines are complete; no code/schema/migration/API/UI work was executed.  
**FAIL Condition:** Any missing evidence, unresolved P0/P1 contradiction, open blocking design decision, incomplete report mapping, or implementation work performed.  
**Evidence:** Design Validation Report, DoD checklist, decision closure register, handoff index.

## 11. Design Artifact → Academic Report Mapping

| Design Artifact | Report Chapter/Section | Requirements | UC/BF | Evidence |
|---|---|---|---|---|
| 1–3 Domain, Lifecycle, Progression | System Analysis / System Design | FR, curriculum, D1–D8 | UC-03/04/08/09/10; BF-05/06/07/08/11/12 | Domain/state/progression artifacts |
| 4–5 ERD and Data Dictionary | Database Design | Data model and approved logical fields | Data-bearing UC/BF rows | ERD status table and dictionary |
| 6–8 DFD Context/Level 0/1 | System Design / Architecture | System boundaries and data flows | BF-01..15 | DFD specifications and flow trace |
| 9–10 UC/Activity/State | System Analysis | Requirements and business rules | UC-01..15; BF-01..15 | UC/BF matrix and behavior set |
| 11–12 Sequence/Class | System Design | API and ownership constraints | Completion, review, publish, GEC, SRS flows | Sequence/class specifications |
| 13–14 Architecture/Deployment | Architecture | ADRs and runtime boundaries | Cross-cutting UC/BF | Component/deployment evidence |
| 15 API Boundary | API/Integration Design | `docs/03-api-contract.md` | API-bearing UC/BF | Current/target/future table |
| 16 Security/RBAC | Security Design | P1-NFR-001 and roles baseline | UC-11/13 and sensitive BF | Responsibility/RLS/audit matrices |
| 17 Placement/Jump | System Analysis / System Design | D5/D6, Mapping A | UC-03/04; BF-08/11 | Policy-flow evidence |
| 18 SRS | System Design / Supporting Capability Boundary | D8 | UC-06; BF-12 | Deterministic-flow evidence |
| 19 Screen/Flow Inventory | UI/Interaction Design (non-pixel) | UC/BF and NFR states | All Core screen-bearing UC/BF | Role/status inventory |
| 20 Design Validation Report | Design Governance / Appendix | Full traceability and DoD | D-G1..D-G10 | Evidence index and closure register |

This table is the single report-governance mapping. It must be updated only through an approved documentation task if chapter identifiers change.

## 12. Design-to-Implementation Handoff Conditions

The handoff package may contain plans and skeletons only; it must not execute implementation.

Required handoff outputs:

1. Migration-plan outline with order, rollback considerations, and Current Applied/Target/Future labels; no migration execution.
2. Test-plan skeleton for Mapping A, Jump/cooldown, Retry math, SRS determinism, RLS matrix, and GEC fallback; no implementation test execution is required for System Design completion.
3. API dependency register with each surface classified CURRENT, TARGET, FUTURE, or COMPATIBILITY GAP.
4. Security responsibility matrix and audit boundary.
5. Complete report mapping and artifact identifier index.
6. Closure record for DD-01, DD-02, DD-03, DD-04, DD-05, DD-06, and DD-10.

## 13. Risk Register

| Risk | Impact | Likelihood | Mitigation | Validation Gate |
|---|---|---|---|---|
| Unit applied/target mismatch | Design may imply runtime support that does not exist. | High | Maintain status labels and explicit Future Migration mapping. | D-G2 |
| Revision inconsistency | Clone revisions may lose parent, published identity, or immutable history. | Medium | Resolve identity/parent/version/uniqueness in DD-02 and test lifecycle evidence. | D-G1, D-G7 |
| Role enforcement duplication/gap | App and RLS may disagree, enabling unauthorized operations or broken flows. | High | Maintain one six-boundary responsibility matrix; application checks never replace RLS. | D-G6 |
| AI ownership drift | AI may accidentally own progress or primary learner data. | Medium | Enforce inference-only AI boundary, JWT verification, and explicit sequence ownership. | D-G5, D-G6 |
| Stale document divergence | Design may follow superseded architecture or requirements wording. | Medium | Run source/version and obsolete-pattern scan; record dispositions. | D-G9 |
| Future-feature leakage | Cohort, SupportTicket, or excluded features may become accidental MVP scope. | High | Label extension and non-Core material in every affected artifact and report row. | D-G1, D-G2, D-G9 |
| Report/design divergence | Academic diagrams and repository artifacts may become competing sources of truth. | Medium | Maintain §11 mapping and evidence index from one artifact ID set. | D-G8, D-G10 |
| Placement history loss | Retake, latest result, profile behavior, or auditability may not be explainable. | High | DD-06 must resolve score, Starting Unit, latest result, retake history, timestamps, relation, and non-editability before handoff. | D-G2, D-G6, D-G7 |
| Diagram without trace | Design output may be visually complete but academically unverifiable. | Medium | Require six-field artifact contract and FR→UC→BF evidence. | D-G8 |
| API/security coupling gap | `record_review`, RLS, privileged writes, JWT verification, or timeout behavior may be inconsistent. | Medium | Review API and security as one iterative pair before architecture closure. | D-G5, D-G6 |

## 14. Definition of Done

System Design is DONE only when:

- All 20 artifacts are completed and satisfy the six-field contract.
- All six milestones satisfy Scope, Input, Output, Dependencies, Validation, and Exit Criteria.
- D-G1–D-G10 are objectively testable and have recorded evidence.
- All locked behavior and security/ownership invariants are preserved.
- DD-01, DD-02, DD-03, DD-04, DD-05, DD-06, and DD-10 open physical design decisions are resolved.
- Current Applied Database, Target Schema, and Future Migration boundaries are explicit in ERD, Data Dictionary, DFD stores, and Architecture/Deployment notes.
- The security responsibility matrix is complete.
- Every API surface is classified and no API contract is silently changed.
- Every Core artifact is traceable to FR/UC/BF.
- The Design Artifact → Academic Report Mapping is complete.
- Risks have owners/mitigations represented by gate evidence.
- No P0/P1 design contradiction or requirements drift remains.
- No implementation code, schema, migration, database, API, UI, or M2 execution is required or performed to claim System Design completion.

## 15. Final Plan Status

```text
Planning status: REVISED — READY FOR REVIEW
Requirements changed: NO
Product Policy changed: NO
Curriculum changed: NO
Placement changed: NO
Schema changed: NO
Migration: NO
Code: NO
```

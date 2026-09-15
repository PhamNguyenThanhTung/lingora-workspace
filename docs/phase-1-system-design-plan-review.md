# LINGORA — Phase 1 System Design Plan Review

**Review type:** Independent PLAN REVIEW and design-decision gate  
**Reviewed document:** `docs/phase-1-system-design-plan.md`  
**Review date:** 2026-09-15  
**Verdict:** **C — PLAN REVISION REQUIRED**

## 1. Review Scope

This review evaluates whether the Phase 1 plan is sufficiently precise and bounded to begin System Analysis & Design. It reviews plan completeness, workstreams, dependency ordering, all 20 proposed artifacts, DD-01..DD-06 and DD-10, requirements stability, MVP/future boundaries, current/applied/target/future data boundaries, API and security boundaries, milestones M2.1–M2.6, gates D-G1..D-G10, risks, and the Definition of Done.

No system design artifact, ERD, UML, DFD, schema, migration, API implementation, UI, or requirements change was produced by this review.

## 2. Source of Truth

The review used the following authoritative material:

- `docs/02-requirements.md`
- `docs/05-traceability-matrix.md`
- `docs/06-system-analysis.md`
- `docs/07-data-dictionary.md`
- `docs/08-english-a1-curriculum.md`
- `docs/09-placement-and-jump-specification.md`
- `docs/phase-0-final-requirements-baseline-audit.md`
- `docs/phase-0-final-user-research-and-requirements-audit.md`
- `docs/phase-0-final-reconciliation-log.md`
- `docs/phase-0-roles-and-mvp-final.md`
- `docs/01-architecture.md`
- `docs/04-data-model.md`
- approved ADR/plan records available in `plans/approved/` and the ADR references cited by the canonical documents.

The Requirements Baseline controls WHAT. The design plan may decide HOW only where the baseline and ADRs do not already decide the behavior.

## 3. Plan Completeness

The plan has a useful scope statement, nine named workstreams, 20 intended artifacts, a dependency graph, milestones, a decision register, gates, a DoD, risks, and handoff conditions. It is materially stronger than an informal design checklist.

It is not yet approval-ready for five reasons:

1. The artifact table has `Purpose`, `Traces to`, and `Gate`, but omits the required `Inputs`, `Outputs`, `Dependencies`, and explicit validation method for every artifact.
2. M2.1–M2.6 do not each state Scope, Input, Output, Dependencies, Validation, and Exit criteria as separate testable fields.
3. D-G1..D-G10 are assertions, not gates with Input, Validation method, PASS condition, FAIL condition, and Evidence. “Run gates” and “review” are not evidence criteria.
4. Section 11 is referenced as the report-mapping section in §13, but section 11 is actually the Risks section. The required `Design Artifact → Report Chapter → Requirements/UC/BF` mapping is absent.
5. The decision register mixes locked product/business rules with open physical design decisions. This makes the blocking set inaccurate and permits accidental reopening of frozen requirements.

## 4. Workstream Review

| Workstream | Result | Review finding |
|---|---|---|
| A Analysis refinement | PARTIAL | Correctly addresses terminology, alias debt, and applied/target labels. It must explicitly state that it may normalize traceability only; it may not revise FR, BF, curriculum, Mapping A, or D1–D9. |
| B Logical design | PARTIAL | Correct coverage. `Ticket` and `Cohort` are future/optional modules and must be represented as extension boundaries, not as Core MVP domain scope. |
| C Data design | PARTIAL | The three-column applied/target/future boundary is strong. The plan must not treat target `Unit`/`AuditLog` as runtime-ready and must distinguish approved logical design from a future migration plan. |
| D Interaction/behavior | PASS WITH FIX | Correctly covers UC, activity, sequence, placement, jump, retry, and SRS. D4 must be stated as a hard invariant: assessment is a conceptual mode of `Exercise`; no `Exam`, `QuestionBank`, or assessment entity may be introduced. |
| E Architecture | PASS WITH FIX | Matches the current Web/Admin/Supabase/AI boundaries. Authorization ownership must be described jointly as application authorization plus database RLS, not as an “app first, DB later” choice. |
| F Security | PARTIAL | Covers authentication, RBAC, RLS, secrets, privileged writes, separation, and audit. It needs an explicit responsibility matrix for Learner Web, Admin application, Supabase RLS, privileged service role, and AI server. |
| G API/service boundary | PASS WITH FIX | Correctly treats the work as boundary specification rather than implementation. It must label existing/current, target, compatibility, and future API surfaces and must not silently change `docs/03-api-contract.md`. |
| H Validation | FAIL AS SPECIFIED | Validation is named but not operationalized. Each gate needs objective evidence and pass/fail rules. |
| I Report packaging | PARTIAL | The intent is correct, but the report mapping section is missing and the section reference is wrong. |

No workstream is intrinsically implementation work, provided that migration outlines, test-plan skeletons, and API mappings remain design/handoff outputs rather than executed implementation.

## 5. Dependency Review

The proposed ordering is generally reasonable:

`Requirements Baseline → Domains → Data → State → UC/Activity → Sequence → API/Security → Architecture → Validation`

Required corrections:

- Unit hierarchy, content lifecycle behavior, unified Exercise semantics, Manager-driven assignment, Placement output, and role/security invariants must enter the graph as **already-decided constraints**, not as open product choices.
- Data design and lifecycle/state design are mutually dependent in practice. The plan may run them iteratively, but must record the dependency explicitly: lifecycle/version/audit semantics constrain data fields, while applied/target data constraints constrain realizable state transitions.
- API/service boundary and security are also coupled. `record_review`, RLS, Admin privileged writes, and AI statelessness should be reviewed together before final architecture packaging.
- DFD Context can begin from domain and architecture boundaries; DFD Level 0/1 needs the approved logical data stores and ownership matrix. The plan already partially states this and should formalize it per artifact.
- Validation must depend on all preceding artifacts and on the report mapping, not only on diagrams.

No unresolvable circular dependency was found. The plan should document the two iterative pairs above rather than implying a strictly one-way chain.

## 6. Artifact Review

The following review supplies the required six fields. `Validation` is the review of whether the plan currently specifies a usable validation gate for that artifact.

| # | Artifact | Purpose | Inputs | Outputs | Dependencies | Trace | Validation |
|---:|---|---|---|---|---|---|---|
| 1 | Domain Model | Shared business vocabulary and relationships | 02, 05, 06, 08, 09 | Logical domain model plus extension-boundary notes | Baseline, role catalog | FR/UC/BF | PARTIAL: add explicit future-module boundary and evidence checklist |
| 2 | Content Lifecycle State Model | States, actors, forbidden transitions, revision/publish authority, audit obligation | D1–D3, 06, roles baseline | State/transition table and decision evidence | Domain model, D1–D3 | UC-08/09/10, BF-05/06/07 | PARTIAL: gate must test every transition and forbidden self-approval/publish case |
| 3 | Learning Progression Model | Course→Unit→Lesson progression and placement/jump entry | 08, 09, D5/D6 | Logical progression and entry rules | Domain model, locked Mapping A | UC-03/04, BF-08/11 | PARTIAL: must assert no CEFR output and exact Mapping A bands |
| 4 | ERD | Logical-to-applied/target/future data mapping | 04, 06, 07, artifacts 1–3 | ERD with three explicit schema statuses | Domain/lifecycle/progression | Data model, D-G2 | PARTIAL: pass requires no target/applied conflation |
| 5 | Data Dictionary Final | Field semantics and payload contracts | 04, 07, ERD, ADR-006 | Field-level dictionary and payload rules | ERD and approved logical model | FR/UC/BF and API payloads | PARTIAL: plan must define field evidence and future fields separately |
| 6 | DFD Context | System boundary and external actors | 01, 05, 06 | Context flow view | Domain and architecture constraints | UC-01..15 | PASS WITH FIX: label future/optional actors and flows |
| 7 | DFD Level 0 | Core processes, stores, and control/data flows | 01, 04, 06, artifacts 1–5 | Level-0 flow view | Context plus logical stores | BF-01..15 | PARTIAL: include current/target status and ownership evidence |
| 8 | DFD Level 1 | Detailed high-risk flows | 04, 06, 09, artifacts 4–7 | Placement, completion, SRS, moderation flows | Level 0, state, API/security | BF-05/07/08/09/10/12 | PARTIAL: do not imply unapproved persistence or entities |
| 9 | Use Case Diagram | Actor-to-UC overview | 05, 06 | Complete 15-UC view | Role catalog and future labeling | UC-01..15 | PASS WITH FIX: state 14 core + UC-15 optional/future explicitly |
| 10 | Activity Diagrams | Business decisions and alternate/error paths | 06, 08, 09, D5–D8 | Activities for approved BF set | State and progression | BF and D5–D8 | PARTIAL: gate must check exact policy values and exception paths |
| 11 | Sequence Diagrams | Interaction, ownership, timeout/fallback | 01, 03, 04, state/data artifacts | Sequences for auth, completion, review, GEC, publish | API/security plus logical stores | BF and architecture boundaries | PARTIAL: include AI 8s timeout, no AI primary persistence, and RLS/RPC evidence |
| 12 | Domain/Class Model | Presentation/data/domain separation | 01, 03, 04 | Conceptual class/domain view | Logical model and current architecture | P1-FR-002/003/005 | PASS WITH FIX: keep implementation-independent; no code classes required |
| 13 | Architecture Diagram | Component ownership and responsibility | 01, ADRs, artifacts 11/15/16 | Component architecture view | API/security decisions | ADRs and ownership | PARTIAL: must preserve existing architecture and role boundaries |
| 14 | Deployment/Component Diagram | Runtime placement and secret boundary | 01, environment constraints | Deployment view | Architecture and security | ADRs, NFRs | PASS WITH FIX: distinguish deployed target from current runtime evidence |
| 15 | API Boundary Specification | Surface mapping without implementation | 03, 04, 01 | Current/target/compatibility boundary table | Data/security and architecture | API contracts, UC/BF | PARTIAL: no arbitrary contract changes; missing surface must be marked future |
| 16 | Security/RBAC Model | Authentication, authorization, RLS, audit, secrets | 01, roles baseline, 04 | Responsibility/RBAC/RLS matrix | API, architecture, lifecycle | P1-NFR-001, UC-11/13 | FAIL AS WRITTEN: add explicit Input/method/PASS/FAIL/Evidence and all five boundary layers |
| 17 | Placement/Jump Decision Flows | Approved Mapping A and jump rules | 09, D5/D6 | Decision flows | Progression and Exercise-mode constraint | UC-03/04, BF-08/11 | PARTIAL: exact thresholds, cooldown, scopes, and no CEFR claim |
| 18 | SRS Decision Flow | Deterministic Policy B flow | 04, D8, BF-12 | Baseline/due/item/workload flow | SRS logical data and AI ownership | UC-06, BF-12 | PASS WITH FIX: evidence must prove deterministic scheduler and AI non-ownership |
| 19 | Screen/Flow Inventory | Role-based screens and major flows without pixel design | 05, 06, DESIGN.md boundary | Inventory with role and state coverage | UC/BF and security matrix | UC catalog and §14 intent | PARTIAL: include only MVP/core surfaces; extension screens labeled future |
| 20 | Design Validation Report | Consolidated gate evidence and contradiction scan | Artifacts 1–19, baseline audits | Evidence report and unresolved-issue register | All artifacts and report mapping | D-G1..D-G10 | FAIL AS WRITTEN: cannot pass until gates have objective evidence definitions |

## 7. Design Decision Review

| Decision | Classification | Review conclusion |
|---|---|---|
| DD-01 Unit representation | **ALREADY DECIDED + OPEN DESIGN DECISION** | The requirement and approved curriculum decide the logical hierarchy `Course → Unit → Lesson`; that must not be reopened. The physical mapping across Current Applied, Target Schema, and Future Migration remains open design. The plan must remove any option that turns Unit into a product-level grouping decision. |
| DD-02 Revision identity | **ALREADY DECIDED + OPEN DESIGN DECISION** | D3 already decides clone-to-draft, no in-place edit, and immutable published history behavior. Revision key, parent/version relation, published-version identity, and uniqueness remain open design. The register must split these two layers. |
| DD-03 Audit shape | **ALREADY DECIDED + OPEN DESIGN DECISION** | Audit is required for sensitive actions; actor, action, target, and time are required business/audit facts, and audit records must be immutable/append-only in semantics. Exact diff/IP/metadata shape, retention, and physical representation remain open design. Do not add fields not justified by the baseline. |
| DD-04 Assignment | **ALREADY DECIDED + OPEN DESIGN DECISION** | D1 decides Manager-driven assignment and `AssignmentBrief` is a logical attribute associated with the assigned Lesson/Creator workflow. Do not reopen ownership and do not introduce an `Assignment` entity by default. Remaining design is field semantics, lifecycle, visibility, and how the brief is represented within the approved Lesson boundary. |
| DD-05 Assessment mode | **ALREADY DECIDED + OPEN DESIGN DECISION** | D4 decides the Unified Exercise Model and forbids separate `Exam`/`QuestionBank` MVP entities. Assessment is a conceptual mode/context of `Exercise`. The design may decide the non-entity representation and scoping of that context, but it must not propose a new assessment entity or contradict ADR-006/09. |
| DD-06 Placement persistence | **ALREADY DECIDED + OPEN DESIGN DECISION** | D6 decides approximately 30 questions, Skip→Unit 1, Retake from Profile, and output `Starting Unit`; Mapping A is locked. Storage of score, starting unit, latest result, retake history, timestamps, and learner/profile relationship remains open design. A purely derived/no-history option is not sufficient unless the plan proves it satisfies Retake and auditability requirements. |
| DD-10 Role enforcement boundary | **ALREADY DECIDED + OPEN DESIGN DECISION** | The architecture already requires server/application authorization, Supabase RLS, privileged service-role isolation, and a stateless AI boundary. The design may decide the precise responsibility split and migration sequencing for six target roles versus two-role applied runtime. “App-layer first, DB later” cannot weaken current RLS or imply that application checks replace database enforcement. |

Non-blocking register items DD-07/08/09 are correctly treated as confirmations, but the plan should label DD-09 as an architectural invariant rather than a new decision. DD-11 and DD-12 are non-blocking only when kept outside Core Design and clearly tied to approved future/task boundaries.

## 8. Requirements Stability

**Result: BASELINE STABLE; no requirements-instability verdict.** The plan does not explicitly propose changing D1–D9, the curriculum, Mapping A, or the placement/jump thresholds.

Required anti-drift corrections:

- Replace the phrase “question-bank M-task” with a bounded content-authoring dependency. It must not imply a new `QuestionBank` product entity or reopen D4.
- Keep `Cohort` and `SupportTicket` as explicit optional/future extension boundaries. They are not Core MVP data design.
- Preserve the locked “no CEFR certification” rule and the exact Mapping A output.
- Mark any future `Exam`, `QuestionBank`, badges, notification/reminder delivery, DOCX import, formula processing, streak recovery, CEFR, DKT, HLR, and MultiWOZ material as out of Core Design unless the baseline explicitly names it as a current supporting boundary.

No prohibited “reconsider requirement”, “change curriculum”, “redefine actor”, or “change Jump threshold” sentence was found.

## 9. MVP Boundary

The plan correctly excludes code, migration execution, training, and new MVP features. It still leaks future scope in artifact #1 (`Ticket/Cohort-logical`) and in the data-design wording that treats future models as part of the main entity set.

Boundary required:

- Core Design: Course, Unit, Lesson, Exercise, Vocabulary, Progress, SRS, approved content workflow, audit/security boundary, and approved GEC boundary.
- Extension boundary only: Cohort, CohortMember, SupportTicket, and any optional B2B/operations expansion.
- Not Core Design: badges, advanced exam, DOCX import, formula processing, streak recovery, CEFR, DKT/HLR model training, and MultiWOZ research/training. The plan may mention them only as explicit exclusions or future dependencies.

## 10. Data/API/Security Boundary

**Data:** The three-way comparison `Current Applied / Target Schema / Future Migration` is correct and should be retained. The plan must explicitly state that Target Schema existence is not runtime readiness. `Unit` and `AuditLog` are target/future until migration and runtime evidence exist; Cohort and SupportTicket are future models.

**API:** The plan is correctly limited to mapping requirements to current and target boundaries. It must not invent or silently alter paths, request/response fields, error envelopes, compatibility status, or ownership in `docs/03-api-contract.md`. Missing API surface should be labeled `TARGET` or `FUTURE`, not silently treated as current.

**Security:** The required boundary is:

`Learner Web` (no service role, server proxy) → `Supabase Auth/PostgREST/RPC/Storage with RLS`  
`Admin application` (server-side privileged workflows and Prisma ownership) → `Supabase`  
`Privileged service role` (server-only, narrowly scoped)  
`AI server` (JWT verification/inference only, no primary-data read/write)

The plan must show which checks are application authorization, which are RLS, which are privileged operations, and which are audit events. It must not defer DB enforcement as an optional later choice.

## 11. Milestone Review

| Milestone | Result | Required correction |
|---|---|---|
| M2.1 | PARTIAL | Add explicit Scope, Input, Output, Dependencies, Validation method, and Exit criteria. Split locked Unit/lifecycle constraints from physical representation decisions. |
| M2.2 | PARTIAL | Add the same six fields; label UC-15/future screens and preserve D4. |
| M2.3 | PARTIAL | Add API contract inputs and security/RLS dependencies; validate timeout/fallback and ownership evidence. |
| M2.4 | PARTIAL | Add the five-layer role enforcement matrix and current-vs-target deployment evidence. |
| M2.5 | FAIL AS WRITTEN | Define evidence-producing validation activities, not only “re-scan + report”. |
| M2.6 | PARTIAL | Handoff artifacts are valid planning outputs, but report mapping must exist and no implementation task may be executed. |

No milestone explicitly requires coding or migration execution. The migration outline and test-plan skeleton are acceptable only as implementation handoff documents.

## 12. Gate Review

Current gate definitions are insufficient because they lack the required five fields. The following minimum format is mandatory for every D-G gate:

`Input | Validation method | PASS condition | FAIL condition | Evidence`

Examples of acceptable evidence include a trace matrix row set, a state transition table with all forbidden transitions, a three-status data mapping table, a role/RLS responsibility matrix, an API current/target table, or a contradiction-scan result with matched patterns and disposition. “Review carefully”, “diagram looks consistent”, or an unreferenced sign-off is not testable evidence.

Specific corrections:

- D-G1/D-G7 must prove exact locked policies, including Mapping A, 95%, 24h, retry 10%/70%, and SRS Policy B.
- D-G2 must prove no Applied/Target/Future conflation.
- D-G3 must prove stores and flows match the approved logical model and AI boundary.
- D-G4 must prove all 15 UC/BF mappings and actor correctness, with UC-15 marked optional/future.
- D-G5/D-G6 must prove architecture and security against current ADRs and the five-layer enforcement boundary.
- D-G8 must prove every artifact has purpose, inputs, outputs, dependencies, trace, and evidence.
- D-G9 must record scan patterns, matches, disposition, and zero unresolved obsolete statements.
- D-G10 must prove the DoD and report mapping are complete without claiming implementation readiness equals runtime readiness.

## 13. Risk Review

The plan identifies four important risks: missing applied Unit, assessment ghost fields, AI ownership drift, diagram/trace inflation, stale roadmap wording, and absent question content. It should add:

| Additional risk | Impact | Required mitigation |
|---|---|---|
| Revision inconsistency | Clone/revision can lose parent, published identity, or immutable history | Separate locked D3 behavior from open identity/uniqueness design; validate with lifecycle evidence |
| Role enforcement duplication or gap | App and RLS disagree; unauthorized writes become possible | One responsibility matrix covering application checks, RLS, privileged service role, and audit |
| Stale document divergence | Report, baseline, and design become competing sources of truth | Add the missing report mapping and a source/version check in D-G9 |
| Future-feature leakage | Optional Cohort/SupportTicket or advanced features become accidental MVP scope | Mark extension boundaries in every affected artifact and gate |
| Report/design divergence | Academic report diagrams differ from repository design | Add a real §11 mapping table and require one artifact ID source |
| Placement history loss | Retake/latest result cannot be explained or audited | Require explicit persistence semantics for score, starting unit, latest result, and retake history |

## 14. Issues

**P0 — approval blockers**

1. Artifact definitions are incomplete against the required six-field review contract.
2. D-G1..D-G10 are not testable gates with evidence and fail conditions.
3. Report mapping is missing and §11 is referenced incorrectly.
4. Locked requirements and open design decisions are not separated for DD-01..DD-06/DD-10.
5. DD-10’s “application first, database later” recommendation is unsafe unless constrained by existing RLS and privileged boundaries.

**P1 — design blockers**

6. DD-06 permits derived/no-history placement persistence without demonstrating compatibility with Retake and latest-result/history requirements.
7. Future Cohort/SupportTicket concepts are included in Core logical artifact wording.
8. DD-05 needs an explicit no-Exam/no-QuestionBank invariant.

**P2/P3 — minor fixes**

9. Replace “14+1” with a clear “15 total: 14 core + UC-15 optional/future” convention wherever used.
10. Add explicit inputs/outputs to each milestone and identify iterative dependencies between lifecycle/data and API/security/architecture.

## 15. Required Fixes

Before approval, update the plan to:

1. Expand the artifact register to `Purpose | Inputs | Outputs | Dependencies | Trace | Validation Gate` for all 20 artifacts.
2. Add a real report-mapping section and correct the §13 reference.
3. Rewrite M2.1–M2.6 using Scope, Input, Output, Dependencies, Validation, and Exit criteria.
4. Rewrite D-G1..D-G10 using Input, Validation method, PASS condition, FAIL condition, and Evidence.
5. Split every decision into locked behavior versus open physical design. In particular, lock hierarchy, clone-to-draft, audit obligation, Manager assignment, Unified Exercise, Placement output/Mapping A, and the existing security architecture.
6. Constrain DD-01, DD-02, DD-03, DD-04, DD-05, DD-06, and DD-10 as described in §7; do not reopen product policy.
7. Make placement persistence explicitly address latest result, score, starting unit, retake history, learner/profile relation, and non-editability.
8. Replace “app-layer first, DB later” with an explicit application-authorization/RLS/privileged-operation design boundary that preserves current security invariants during migration sequencing.
9. Mark Cohort and SupportTicket as extension boundaries in the domain, data, DFD, screen, and report mappings; remove any implication that they are Core MVP entities.
10. Add the additional risks and evidence requirements in §§12–13.

## 16. Final Verdict

### **C — PLAN REVISION REQUIRED**

The plan has a sound overall direction and a reasonable high-level dependency order, and the Requirements Baseline itself is stable. It is not sufficiently robust to approve because its artifact contract, milestone contract, and gate contract are incomplete, and its decision register does not consistently distinguish already-decided product behavior from open design representation.

After the required corrections above, the plan can return to REVIEW. This review does **not** authorize System Design execution and does not change requirements, ADRs, schema, API contracts, or product policy.

```text
Code changed: NO
Schema changed: NO
Migration: NO
Requirements changed: NO
Product Policy changed: NO
Plan implementation executed: NO
```

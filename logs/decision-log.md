# Decision Log

## ADR-014 — Software Engineering Core & AI Supporting Capability Architecture (Superseding ADR-010 Two-Track Delivery)

### Date

`2026-09-14`

### Category

`runtime-boundary`

### Context

ADR-010 previously consolidated project scope into "two academic tracks": Software Engineering and a Machine Learning track focused on T5-small GEC fine-tuning. However, maintaining ML as a parallel research track created architectural friction, ambiguity in system boundaries, and unnecessary complexity (e.g. pressure to self-train models, manage research pipelines, or treat GEC as equal in scope to the entire learning platform).

Under the Phase 0 Rebuild, the product architecture is formally clarified: **Software Engineering is the CORE system**, while **AI is a SUPPORTING CAPABILITY**.

### Decision

1. **Software Engineering is Primary / Core:**
   - The core deliverable of Lingora is a complete, reliable, modern language learning web application: Auth, RBAC (6 canonical roles), Courses, Units, Lessons, Exercises (MCQ, Fill-in-the-blank, Reorder), Learning Progress tracking, Spaced Repetition System (SRS), Content Management & Review Workflow (6 lifecycle states: Draft → In Review → Changes Requested → Approved → Published → Archived), Content Publishing, Account Management, Operations/Support, Security, and Deployment.
2. **AI is a Supporting Capability:**
   - AI/ML is not a parallel, independent research track.
   - Grammatical Error Correction (GEC) is a supporting feature/service that assists learners with sentence-level feedback during scenario writing exercises.
3. **Flexible AI Model / Provider Abstraction:**
   - GEC does NOT require training from scratch or fine-tuning models locally (e.g. no mandatory self-trained T5-small pipeline).
   - GEC can be fulfilled via a pretrained model, a containerized open-source checkpoint, or an external API provider.
   - The underlying model or inference provider may be swapped at any time behind the service abstraction without impacting the core web application or database architecture.
4. **Historical Preservation:**
   - ADR-010, ADR-002, ADR-003, ADR-004, ADR-006, and all earlier plans and logs remain preserved in repository history for academic auditability.
   - Obsolete research tracks (DKT-LSTM, HLR, DQN, MultiWOZ generative dialogue) remain explicitly superseded and archived.
5. **Architectural Decoupling:**
   - The core learning platform functions 100% independently of the AI service. If the AI service is unreachable or degraded, core learning (courses, units, lessons, exercises, progress, and deterministic SRS) continues without interruption.

### Consequences

- Developers and agents will focus on delivering the core Software Engineering platform first.
- The AI API in `lingora-ai/api/` is maintained as a lightweight, stateless supporting service implementing standard contracts (`/health/*`, `/v1/model/info`, and target `/v1/gec/correct`).
- Complex ML training pipelines, model artifacts, and datasets are removed from active runtime scope.

### Status

`PARTIALLY SUPERSEDED — 6-role model superseded by ADR-034 (3 business roles: Admin, Teacher, Learner); AI supporting capability deferred from active Phase 2 implementation.`

---

## ADR-030 — P0-D04 Shared Curriculum and Learner-Context Domain Decision

### Date

2026-10-08

### Category

`domain-model / curriculum-architecture`

### Approval Evidence

The user explicitly accepted the revised P0-D04 proposal on 2026-10-08, subject to the three clarifications recorded below. This approval is limited to the domain decision and documentation reconciliation. It does not authorize product implementation, schema changes, migrations, or P0-D03 work.

### Context

P0-D04 was open in `plans/master-implementation-and-report-plan.md` §19.1. The current repository has `Language`, `Course`, `Unit`, `Lesson`, and learner-content state models, but no `LearningContext`, `LearningPlan`, or framework-aware `ProficiencyFramework` / `Level` models. The existing Prisma `Course.cefr` field and SQL migration state remain physical repository evidence and are not changed by this decision. Earlier logical designs contain English A1 assumptions and learner-state ownership choices that must not be generalized beyond their scope.

### Decision

1. Lingora uses **shared curriculum/content with learner-specific plans and state**. Learners do not own copies of `Course`, `Lesson`, or `Exercise`.
2. In the MVP, each learnable `Language` has one shared/core `Course` as its primary curriculum. This is an MVP business convention, not a permanent schema invariant. More than one `Course` for a `Language` may be justified later by a genuinely independent syllabus, such as a specialized exam-preparation program. No `Track` is needed now.
3. `Work`, `Study`, `Travel`, and `General communication` are primarily `LearningPurpose` preferences on a learner's context. They do not automatically create separate Courses. Shared Lessons may carry controlled metadata for applicable framework/level, skill, topic, and purpose.
4. `LearningContext` is learner-specific state scoped to a learned `Language`. In the MVP, a user has **at most one `LearningContext` per learned `Language`** and at most **two active learned languages**. These are business rules, not schema cardinality constraints. P0-D03 retains the remaining decisions about context persistence and ownership of goals, course participation, progress, and proficiency.
5. `ProficiencyFramework` and `Level` are framework-aware concepts. CEFR is not a universal level enum; a level is interpreted within its framework and, where required, its version. Detailed framework mappings and physical representation remain outside this decision.
6. Learning/content `Progress` and language `Proficiency` are distinct. Completing all content does not itself certify proficiency or promote a learner to another level.
7. Placement evidence is scoped to the relevant `LearningContext`, not a one-time global account state. This does not resolve placement behavior, skip/retake rules, or the physical evidence model; those remain with P0-D05 and the applicable assessment design.
8. SRS remains associated with the user and shared `Vocabulary` by default; this decision does not move SRS state into `LearningContext`.
9. `LearningPlan` is initially a domain concept and deterministic result, with ordered `LearningPlanItems` referring to shared Lessons. Do not create `LearningPlan` or `LearningPlanItem` tables in the MVP unless a requirement needs persistence, learner edits, exact resumption of a prior plan, or plan-history audit.
10. TOEIC remains `DEFERRED` until requirements establish whether it is only a learning purpose, a separate curriculum/program, or an assessment-specific target.

### Consequences and Supersession

- P0-D04 is `RESOLVED` for the domain semantics above. No other P0 decision is resolved by this ADR.
- This decision supersedes earlier logical-target interpretations that require one CEFR level to define every Course or treat English A1 seed/curriculum data as platform-wide architecture. The existing `Course.cefr` physical field remains unchanged and is not endorsed as the future framework-neutral domain model.
- D3's distinction between progress, proficiency, mastery, and readiness remains in force. Its exact learner-state ownership and evidence representation must be reconciled with the per-language context boundary through P0-D03/P0-D05; historical D3/D4 specifications are not rewritten by this ADR.
- The D4 document remains `READY FOR INDEPENDENT REVIEW`; this ADR controls only the P0-D04 decisions explicitly listed above and does not accept the rest of D4.
- No Prisma, SQL migration, seed, application, API, frontend, or test changes are included. No product implementation is authorized.
- P0-D03 remains open. P0-D05 through P0-D07 remain unresolved as listed in the master plan.

### Status

`ACCEPTED — P0-D04 DOMAIN DECISION ONLY; IMPLEMENTATION NOT AUTHORIZED`

---

## ADR-031 — P0-D03 Independent Learner Context and Learner-State Ownership

### Date

`2026-10-08`

### Category

`domain-model / learner-state-ownership`

### Approval Evidence

The user explicitly accepted the P0-D03 domain proposal on 2026-10-08 with the clarifications recorded below. Approval is limited to domain semantics and documentation reconciliation. It does not authorize product implementation, physical-schema changes, migrations, or starting P0-D05.

### Context

ADR-030 accepted shared curriculum and a per-language `LearningContext` boundary while leaving remaining learner-state ownership and persistence to P0-D03. The repository's current Prisma and ordered SQL migration artifacts do not implement `LearningContext`, and their physical state disagrees; live database state remains unverified. Earlier M2.1/D3 logical targets place learner state on a single `LearnerProfile`; that ownership and the assumed persistence of `SkillProfile` require a scoped update for the accepted multi-language context model. Those historical documents are retained unchanged.

### Decision

1. `LearningContext` is learner-specific state for the pair `(User, learned Language)`. In the MVP, each user has at most one context for each learned Language and at most two contexts in `ACTIVE` state. These are domain/business rules, not a permanent schema constraint or a maximum total row count.
2. MVP context lifecycle requires only `ACTIVE` and `PAUSED`. A paused context remains available to resume and does not count toward the two-active-context limit. Do not add `COMPLETED` unless a later requirement establishes a distinct lifecycle need; finishing content is not completion of the learner's language context.
3. `Profile` owns account-global state: UI locale, native language, timezone, account preferences, and the global streak. `LearningContext` owns the learned Language, one primary `LearningPurpose`, focus-skill preferences, simple study preferences, starting point, and self-reported proficiency. Changing purpose or pausing a context does not reset progress, proficiency evidence, or SRS.
4. Starting point is a curriculum entry reference, not verified proficiency. Keep it level-level in the MVP with source/provenance such as placement evidence, self-report, or default entry; these are conceptual sources, not a prescribed physical enum. Finer Unit/Lesson routing remains subject to separately approved placement requirements.
5. Verified proficiency must be derived from trusted assessment evidence scoped to the relevant context. Lesson completion does not create or update verified proficiency. The displayed/current level is derived from verified evidence where available; otherwise label self-report as unverified or show a provisional starting point. Do not require persisted `SkillProfile` by default; persist a derived profile only if a concrete requirement is approved. Preserve the distinctions `Progress ≠ Proficiency ≠ Mastery ≠ Readiness`.
6. Progress is logically owned by `LearningContext`. The MVP does not require a physical FK from progress to context where the context is uniquely derivable from `User + Lesson → Course → Language` under the one-context-per-user-language rule. This does not prescribe or modify physical tables or keys.
7. Placement and assessment evidence is scoped to its `LearningContext`. This decision does not choose placement behavior, thresholds, skip/retake rules, or level mapping; those remain outside P0-D03.
8. SRS remains learner-global by `(User, Vocabulary)`. Changing purpose or pausing a context does not reset vocabulary memory.
9. Streak remains global per account in the MVP. P0-D06 decides which activity qualifies toward that streak.
10. `LearningPlan` remains a deterministic domain output derived from context preferences, starting point, learner progress, and shared-content metadata. It is not a persisted entity by default; no plan tables are required absent an approved persistence, editing, exact-resume, or audit-history requirement. SRS review remains separate by default.
11. No separate `Enrollment` is needed in the MVP: the shared/core Course for a Language follows ADR-030 and can be derived from the context's Language. Reconsider Enrollment only if genuinely independent Courses for one Language or a separate enrollment lifecycle (such as paid access or organization assignment) becomes a requirement.
12. Study preferences are context-specific but must remain simple. Do not create a generic preference engine. The existing physical `Profile.dailyGoalMin` remains unchanged evidence; reconciling that field with the accepted context-owned study-preference target is a separate physical-schema task.
13. Reminder scheduling/persistence remains `DEFERRED`; this decision does not add account- or context-level reminder behavior.

### Consequences and Supersession

- P0-D03 is `RESOLVED` for the domain ownership and persistence defaults above. This is a domain target, not a physical-schema or implementation approval.
- This ADR supersedes M2.1/D3 ownership statements only where they make a single `LearnerProfile` the owner of state that must be per-language, including self-reported proficiency, progress ownership, and context-scoped assessment evidence. It also supersedes treating persisted `SkillProfile` as an unconditional MVP requirement. The historical documents are not rewritten.
- D3's immutable `AssessmentResult` evidence concept, no-self-report-promotion rule, and distinctions among progress, proficiency, mastery, and readiness remain in force where compatible. Assessment behavior and proficiency mappings remain open to their designated decisions.
- ADR-030 remains controlling for shared curriculum, Course/Language conventions, frameworks, placement-evidence context scope, SRS default scope, and deterministic `LearningPlan` semantics. ADR-031 adds the remaining state ownership rules without reopening P0-D04.
- P0-D02 roles, P0-D05 placement behavior, P0-D06 progression/qualifying activity, and P0-D07 physical schema, migrations, publication/governance, and AI compatibility remain unresolved as listed in the master plan.
- The `Profile` versus `LearnerProfile` physical FK target, existing `dailyGoalMin` reconciliation, and all live database state remain outside this ADR.
- No Prisma, SQL migration, seed, application, API, frontend, or test changes are included. Product implementation remains unauthorized.

### Status

`ACCEPTED — P0-D03 DOMAIN DECISION ONLY; IMPLEMENTATION NOT AUTHORIZED`

---

## ADR-032 — P0-D05 Placement and Starting-Point Policy

### Date

`2026-10-08`

### Category

`product-domain / placement-policy`

### Approval Evidence

The user explicitly accepted the P0-D05 placement proposal on 2026-10-08 with the clarifications recorded below. Approval is limited to product/domain policy and documentation reconciliation. It does not authorize product implementation, schema changes, migrations, or P0-D06 work.

### Context

P0-D05 was `CONFLICT` in the existing decision queue. The repository has no implemented placement flow or `AssessmentResult` model in the current application/Prisma artifacts. The latest use-case specification, the earlier English placement specification, D3, and the Phase 2 draft roadmap contain conflicting rules for skip, retake, result, Mapping A, and adaptive assessment. This ADR establishes the accepted MVP domain policy and leaves English assessment values and physical realization open.

### Decision

1. MVP Placement is an onboarding/diagnostic mechanism for recommending where a learner should begin in the curriculum for a learned Language. It does not itself create verified proficiency, certification, or a mastery claim.
2. Learner entry has three paths: take Placement; self-report a known level; or start from the beginning/default starting point. A separate `Skip` choice is unnecessary where it means only bypassing assessment and using the default.
3. Placement's primary MVP output is `recommended starting level` in the applicable framework/curriculum. UI wording should say, for example, “Điểm bắt đầu đề xuất: A2”; do not imply “Trình độ của bạn là A2” from a starting recommendation.
4. Self-report creates no `AssessmentResult` and no verified proficiency. Preserve its provenance as learner self-report. Starting-from-beginning/default selects the lowest/default starting point with available curriculum content; do not label the learner A1/N5/etc. unless they self-report or valid assessment evidence supports that label. This path does not remove the learner's later access to Placement.
5. A permanent placement lock and a lifetime placement/reassessment quota are superseded for MVP. Preserve completed prior evidence when later evidence is recorded.
6. Distinguish initial Placement (onboarding), an optional placement retake near onboarding, Reassessment after a period of learning, and progression/level-up assessment (P0-D06). These purposes must not be collapsed into one behavior. Exact retake timing/cooldown is not decided here.
7. A completed assessment result exists only after a valid submission has been accepted by the server, graded, and recorded successfully. An interruption before a completed result produces no score of zero, no placement lock, and no fabricated recommendation. Timer expiry does not have a universally mandated auto-submit behavior; timer behavior belongs to assessment/runtime configuration.
8. Client-side temporary answer state until final submission may be an MVP implementation choice, not a platform/domain invariant. Server autosave and resume across sessions are `DEFERRED`.
9. Question count, time limit, blueprint, threshold, and mapping from evidence to a starting point are assessment/course configuration, not platform invariants. English values appearing in earlier documents (30 questions, 25 minutes, 20 A1 + 10 A2, threshold 15/20 + 7/10, and Mapping A) are not approved automatically by their presence in those documents. Keep them as English MVP configuration candidates requiring a separate review where approval is insufficient.
10. `AssessmentResult` remains scoped to `LearningContext`. Retain D3's separate `assessmentType` and `deliveryMode` classifications; no flat `PLACEMENT` enum is required.
11. `LearningPurpose` may influence deterministic `LearningPlan` content/routing after assessment, but it does not change the score or estimated level derived from the same evidence. `LearningPlan` uses the accepted starting point, context preferences, progress, and shared-curriculum metadata to produce a deterministic route; persistence is not required by this decision.
12. D3's stage-adaptive diagnostic is `DEFERRED`/superseded as a mandatory MVP Placement requirement. MVP Placement need not use adaptive branching. The historical D3 document and its approval remain intact as evidence; this supersession is limited to MVP Placement and does not rewrite D3 as a historical design.

### Consequences and Supersession

- P0-D05 is `RESOLVED` for the MVP domain policy stated above. This is not physical schema or implementation approval.
- For MVP Placement, this ADR supersedes the account-wide permanent lock, skip-consumes-placement rule, lifetime one-shot restriction, and any requirement to output a Starting Unit as the default product behavior in conflicting use-case/roadmap prose. It does not erase or rewrite those historical specifications.
- The previous approval of English A1 Mapping A is retained as historical, English-curriculum-specific approval evidence. Mapping A is not a platform-wide/default Placement policy, and its use in the current MVP English configuration remains subject to configuration review.
- D3's stage-adaptive mechanism is deferred for MVP Placement as stated above. D3's two classification axes, immutable completed `AssessmentResult` evidence concept, provenance/versioning, context ownership as reconciled by ADR-031, and distinctions between progress, proficiency, mastery, and readiness remain where compatible.
- ADR-030/031 continue to control shared curriculum, framework-aware levels, `LearningContext` ownership, and deterministic `LearningPlan` semantics. P0-D06 remains responsible for progression, completion, retry, and qualifying activity; P0-D07 remains responsible for physical schema, migration, governance, and runtime reconciliation.
- Existing English item counts, duration, blueprint, thresholds, and starting-point mapping remain unselected configuration candidates unless separately confirmed. Other language mappings and framework-specific assessment configurations remain open.
- No Prisma, SQL migration, seed, application, API, frontend, or test changes are included. Product implementation remains unauthorized.

### Status

`ACCEPTED — P0-D05 PRODUCT/DOMAIN DECISION ONLY; IMPLEMENTATION NOT AUTHORIZED`

---

## ADR-033 — P0-D06 Lesson Completion, Retry, Progression and Qualifying Activity Policy

### Date

`2026-10-08`

### Category

`product-domain / lesson-completion-progression-activity`

### Approval Evidence

The user explicitly accepted P0-D06 on 2026-10-08 with the seventeen clarifications recorded below. Approval is limited to MVP product/domain policy and authority reconciliation. It does not authorize product implementation, physical-schema changes, migrations, or P0-D07 work.

### Context

P0-D06 was `CONFLICT` in the existing decision queue. The latest use-case specification, older M2.2/D3 material, English placement/Jump specification, and Phase 2 roadmap contain overlapping but inconsistent lesson completion, retry, curriculum completion, Jump/level-up, retake, and streak rules. The current repository has a physical `UserProgress` aggregate and a `record_review` migration that updates the account streak for recorded SRS reviews; it does not establish the accepted learner lesson/progression runtime. This ADR records the accepted MVP domain policy while leaving physical result representation and configuration values to their designated scope.

### Decision

1. An ordinary lesson is completed only when the learner answers every required core exercise, submits valid input, and the system successfully records completion. No accuracy threshold is required for ordinary lesson completion. Completion and performance are separate concepts.
2. A lesson may have a separate performance/result. This decision does not choose latest, best, first-attempt, or attempt-history semantics. Physical and presentation semantics remain for P0-D07 or a separately approved implementation design. A lesson score does not cancel completion, establish verified proficiency, or unlock a level.
3. Ordinary exercise retry and lesson redo may be unlimited in the MVP. Exercise retry, lesson redo, and assessment retake are separate actions; assessment retake has its own policy. A lesson redo does not reset completion, increment completed-lesson count, or delete progress, though a legitimate completed redo may create a new learning activity.
4. MVP level progress is the unweighted ratio `completed required lessons / eligible required lessons` within the current level. Optional review or purpose-specific content is outside the denominator by default. Progress is not proficiency.
5. Starting at a higher level does not mark earlier levels complete. Preserve the semantic distinction `SKIPPED_BY_STARTING_POINT != COMPLETED` without requiring a physical enum. Earlier content may remain available for review.
6. Core curriculum is mostly sequential: core lessons retain their order, and the next core lesson usually opens after completion of its predecessor. Review and prior content remain accessible; optional personalized review does not gate core progression.
7. Curriculum completion is distinct from proficiency. The completion gate is course-defined; the platform sets no universal percentage. An English MVP configuration may require 100% of required core lessons, but that value is not a platform invariant.
8. MVP level-up progression requires both the course-defined curriculum completion gate and a passed level-up assessment. Neither condition alone unlocks the next level by default. Conditional Jump is not a parallel MVP progression mechanism and is `DEFERRED`.
9. Passing a level-up assessment unlocks the next working/curriculum level and does not rewrite starting-point history. Keep unlocked learning level, displayed learning level, and verified proficiency distinct. Passing does not create verified proficiency unless the assessment independently meets approved trusted-proficiency evidence criteria. ADR-031 continues to govern displayed/current-level derivation.
10. Failing a level-up assessment does not delete progress/evidence, downgrade the learner, reset the context, or revoke existing lesson/review access. The system should suggest suitable review/remediation.
11. No lifetime retake cap or universal fixed cooldown applies by default. Review/remediation before a retake is the default recommendation and may be assessment configuration when suitable content exists; it is not a platform-wide mandatory gate.
12. Reassessment evaluates proficiency; a level-up assessment decides progression. Reassessment does not unlock a level unless a future policy explicitly says so. Placement is not a level-up assessment. Placement evidence and classification remain subject to ADR-032.
13. `LearningPlan` remains a deterministic domain output and may be recalculated after lesson completion, an assessment result, or a LearningPurpose change. MVP does not require plan persistence or version history.
14. MVP weak-skill review may use wrong answers, topic/skill metadata, and published review content. It does not require a mastery engine, BKT, recommendation engine, or AI adaptive system.
15. Streak remains global per account and can increase at most once per local calendar day using the account timezone. Qualifying activity is a completed lesson, a legitimate completed lesson redo, or a recorded SRS review. An isolated exercise retry, Placement, Reassessment, level-up assessment, login, and app opening do not qualify. A recorded SRS review qualifies even for a paused language context. Lesson progress is not recorded for a paused context until it is resumed. MVP has no streak freeze.
16. Daily goal and streak are separate: streak does not require the full daily goal, and the goal does not gate streak. The physical `Profile.dailyGoalMin` artifact remains for P0-D07 reconciliation.
17. Historical English values (100% lesson completion, 40 questions, 35 minutes, 80% pass, Jump 95%, and 24-hour cooldown) do not become platform invariants by appearing in older UCs/specifications. Retain the historical evidence, but treat the values as unselected English-specific configuration unless separately approved. Jump and its associated progression/cooldown policy are deferred for the MVP.

### Consequences and Supersession

- P0-D06 is `RESOLVED` for the MVP domain policy above. This is not implementation, physical-schema, migration, API, or test approval.
- ADR-033 controls the MVP domain meaning of lesson completion/performance, retry categories, progress ratio, starting-point semantics, sequencing, course-defined curriculum gate, level-up gate, retake/reassessment distinction, deterministic plan recalculation, weak-skill review scope, and qualifying streak activity.
- Earlier ADR-030/031/032 statements that P0-D06 remained unresolved are historical status statements superseded by this later acceptance; the substantive accepted scope of those ADRs is unchanged.
- Where they conflict within that scope, the latest use-case specification's lesson-completion/retry, level-up, and streak clauses and the older M2.2/D3/roadmap rules are superseded only for the MVP policy stated here; source files and historical approvals remain unchanged.
- The English-specific 100% curriculum gate remains an eligible configuration choice, not a selected platform rule. The 40-question/35-minute/80% level-up configuration remains unselected. Jump 95% and its 24-hour cooldown are deferred as an MVP progression mechanism. Other assessment parameters require their own configuration approval.
- ADR-031 continues to control account-global streak ownership, daily-goal ownership boundaries, context lifecycle, and current/displayed-level derivation. ADR-032 continues to control Placement and starting-point policy. ADR-030 continues to control shared curriculum and deterministic LearningPlan principles.
- Physical `UserProgress.score`, performance storage, attempt/result history, level-state representation, `Profile.dailyGoalMin`, migration reconciliation, and live runtime state remain for P0-D07 or a separately approved implementation design. The existing Prisma and migration artifacts are not changed or reconciled here.
- P0-D07 remains open. No Prisma, SQL migration, seed, application, API, frontend, or test changes are included. Product implementation remains unauthorized.

### Status

`ACCEPTED — P0-D06 MVP PRODUCT/DOMAIN DECISION ONLY; IMPLEMENTATION NOT AUTHORIZED`

---

## ADR-034 — P0-D02 Three Business Roles and Content Responsibilities

### Date

`2026-10-10`

### Category

`product-domain / role-semantics / content-governance`

### Approval Evidence

The user/PO explicitly authorized this bounded P0-D02 resolution in the task request attached on 2026-10-10. The approved scope is business-role semantics, permissions, assignment ownership, and current use-case identity reconciliation. It authorizes documentation reconciliation only. It does not authorize implementation, physical role mapping, schema/API/RLS changes, or any P0-D07 decision.

### Context

The repository contains a legacy six-business-role target, a current three-actor use-case model, and physical artifacts that disagree (including Prisma role/assigned-role fields and SQL role values). The active UC-10/12 text also allowed Admin self-authoring, self-approval, or direct publication, while the user-approved product model assigns authoring to Teachers and review/publication to Admin. Existing 14-entry and 15-entry use-case catalogs reuse UC identifiers for different meanings. P0-D02 must resolve the product meaning without implying a physical migration or treating historical diagrams, test evidence, or an implementation plan as approval.

### Decision

1. The product has exactly three business roles: `Admin`, `Teacher`, and `Learner`. Each account has exactly one business role in the MVP. There is no role-conversion UI. A staff member who wants to use learner features uses a separate Learner account; a staff account is not also a learner account.
2. Learners may self-register publicly. Teacher accounts are provisioned by Admin; Admin accounts use controlled provisioning. There is no public signup for Teacher or Admin.
3. Admin creates curriculum/content requirements and assignments, manages curriculum/configuration within the Admin remit, assigns/reassigns Teachers, administers Teacher accounts, reviews submitted work, requests changes, approves, publishes only approved content, and archives under an approved policy. Admin does not author lesson, exercise, or assessment content in the MVP. There is no Admin self-author or self-approval exception.
4. Teacher authors and edits only assigned work; may preview drafts, submit/resubmit, and see feedback/review history for assigned work. Teacher cannot assign work, author outside an assignment, review, approve, publish, archive, or administer accounts.
5. Reassignment changes the current assignee but preserves authorship attribution and assignment/review history. This is a business invariant; its physical representation remains P0-D07.
6. Assignment is a business concept and does not have to reuse `ContentStatus`. Assignment state names, tables, keys, workflow persistence, role enum/claims, RLS, and live DB mapping remain unresolved under P0-D07.
7. Current use-case identities are catalog-versioned. The current 14-entry catalog is the source for the current behavior names. Historical M2.2 and inherited Phase 0 trace catalogs remain historical; reused `UC-xx` strings are not a stable cross-catalog key. The crosswalk is recorded in `docs/use-case-specifications.md`. No arbitrary maximum/minimum UC count is imposed; keep, split, merge, defer, or add cases according to distinct business outcomes and actor goals.

### Permission Matrix

| Action | Learner | Teacher | Admin |
|---|---|---|---|
| Public self-registration | Yes | No | No |
| Account provisioning | Self-register | Admin-provisioned | Controlled provisioning |
| Learn, take assessments, use SRS, view own progress | Own account only | No on staff account; use separate Learner account | No on staff account; use separate Learner account |
| Manage curriculum requirements/configuration and create assignments | No | No | Yes, within Admin remit |
| Assign or reassign content work | No | No | Yes; retain attribution/history |
| View work/feedback | Own learning | Assigned work and its feedback/review history | Admin review/assignment remit |
| Author/edit/preview lesson, exercise, assessment content | No | Assigned work only | No |
| Submit/resubmit authored work | No | Assigned work only | No |
| Request changes/review/approve content | No | No | Yes |
| Publish approved content/archive under approved policy | No | No | Admin only |
| Administer Teacher accounts | No | No | Yes |
| Convert role in UI | No | No | No |

### Consequences and Supersession

- P0-D02 is `RESOLVED` for the business role, account, permission, assignment, authoring, review, and catalog-identity semantics above. This is not physical role mapping or implementation approval.
- Six-role documents and the six-role SoD/permission matrix are `HISTORICAL / SUPERSEDED` only where they define current business-role names, actors, or responsibility mapping. Preserve the historical records. The approved current business workflow is Teacher authoring assigned work and Admin review/approval/publication, with no Admin authoring or self-approval exception.
- ADR-034 does not decide answer secrecy or post-submit feedback, assessment result/attempt persistence, SRS scheduling/trust boundary, publication/version/replacement physical states, audit event schema/emission/retention, `ContentStatus` or assignment physical representation, or the Prisma/migration/live database reconciliation. These remain P0-D07.
- Historical reports, test logs, diagrams, and requirement rows are not implementation evidence unless confirmed by current source/runtime evidence. The current checkout has only its evidenced learner-auth foundation and database artifacts; the business decision does not assert that the role model is implemented.
- No application, API, schema, migration, RLS, seed, generated data-model, or runtime test changes are included. Product implementation remains unauthorized.

### Status

`ACCEPTED — P0-D02 BUSINESS/DOMAIN DOCUMENTATION ONLY; IMPLEMENTATION AND PHYSICAL MAPPING NOT AUTHORIZED`

---

## ADR-035 — P0-D07 Logical Product and Security Decision Resolution

### Date

`2026-10-10`

### Category

`product-domain / application-security / content-governance / assessment-integrity / audit`

### Approval Evidence

The user explicitly approved the seven decision packages in the 2026-10-10 request and directed Codex to resolve P0-D07 at the logical product/security level, document deferred physical/live-database questions, reassess Diagram Readiness, and require **Full CURRENT + TARGET Modeling Review** before implementation. Approval is limited to this logical policy and documentation reconciliation. It does not approve a physical table, column, enum, claim, grant, RLS policy, RPC, API shape, migration, live database state, or implementation.

### Context

P0-D07 combined business/security policy with unresolved physical realization and unverified current database state. ADR-034 had already approved exactly three business roles and their responsibilities, while Prisma, SQL migrations, historical six-role target documents, and runtime evidence did not align. The remaining product-level security rules could be decided independently of those physical facts. This ADR records those logical rules without treating Prisma or a migration as product authority.

### Decision

1. **Role and identity:** `auth.uid()` is the trusted subject identity. Role and account status come from server-controlled sources; client-supplied role and user ID are not trusted. Authorization is enforced at a trusted server boundary and by appropriate RLS. A disabled account is denied from its next request even while an older session/token remains unexpired. Legacy role records that cannot be mapped unambiguously to Admin, Teacher, or Learner require deliberate review and migration; no blanket conversion is allowed.
2. **Assignment and authorship:** One MVP assignment covers one Lesson/content package and its related exercise/assessment items. Exactly one Teacher is responsible at a time. Admin creates requirements, scope, checklist, and assignment but does not author content. Teacher authors/edits only assigned content. Reassignment preserves attribution and history. Use a minimal optimistic version/concurrency check; do not add collaboration or project-management subsystems.
3. **Content lifecycle:** Assignment lifecycle is separate from content lifecycle. The logical content flow is Draft → In Review → Changes Requested or Approved → Published → Archived/Withdrawn. Teacher may edit only Draft or Changes Requested. Approved/Published content is not edited in place. A change to published content creates a new revision and repeats review/approval. The active version switches atomically only after the new revision publishes successfully; on failure the current version remains active. Content with learner references/progress is not hard-deleted. The MVP publication unit is a Lesson/revision. Unit/Course visibility is derived from curriculum blueprint/eligibility; publishing an entire Unit as one transaction is not required.
4. **Assessment and answer secrecy:** Placement, Level-up, and Reassessment have distinct purposes and share security invariants. Grading is server-authoritative. Generic content reads do not expose answer keys. An invalid or unsubmitted attempt does not create a completed Result. Cross-session assessment resume is not required for MVP. Retrying the same submission is idempotent; a deliberate new attempt creates new result/evidence. Placement, Level-up, and Reassessment expose no per-item correctness during the attempt; after submission they expose only the required aggregate result/pass/recommendation, not an answer key or per-item solution. These restrictions do not apply to ordinary lesson practice, which may provide feedback/correctness through its separate learning flow.
5. **SRS:** Keep the already-approved Policy B; do not switch to SM-2 or FSRS. Client input is limited to card identity and a valid self-rating. Trusted server/RPC logic computes stage, interval, and due date; client interval/probability is not authoritative. Retrying the same review operation is idempotent; a deliberate re-review is a new operation. Pausing a LearningContext does not pause global SRS. A recorded legitimate SRS review continues to qualify for streak under the controlling ADR.
6. **Audit:** Minimum audited events are account provision/disable/enable/role change; assignment/reassignment; submit/request changes/approve/publish/archive/withdraw/replacement; assessment configuration changes; and denied sensitive privileged actions. Each event logically records actor, action, target/version, server timestamp, outcome, and reason when policy requires it. Security audit is append-only in logical behavior and separate from workflow/content history. Admin is the MVP reader of security audit. Passwords, tokens, and answer secrets are never logged. Retention and anonymization duration are deferred to NFR/implementation design and do not block P0-D07 logical resolution.
7. **Database reconciliation:** Neither Prisma nor an individual migration is product authority. Before implementation or migration, inspect the live database read-only and reconcile it with Prisma, migration history, role distribution, grants, RLS/policies, and RPCs. Never rewrite historical migrations. After logical approval, prepare a forward-migration strategy. Preserve IDs, progress, attribution, and history; never auto-convert ambiguous role data.

### Deferred Physical and Deployment Questions

- Actual live database contents, applied migration state, role distribution, grants, RLS/policies, RPC definitions, and runtime behavior remain unverified and must be inspected read-only before implementation/migration.
- Physical representation of identity/role/status, assignment and authorship/version concurrency, content revisions and atomic active-version selection, assessment attempts/results, answer filtering/API payloads, SRS idempotency keys and trusted RPC inputs, and audit storage/emission/access/retention remains open for a separately authorized design.
- Physical realization of ADR-031 context ownership/FK, `Profile.dailyGoalMin`, and `UserProgress.score`/performance also remains deferred.
- No physical schema or migration strategy is approved here; forward migrations may be planned only after the required live-state inspection and a separately approved implementation scope.

### Consequences and Supersession

- P0-D07 is `RESOLVED — LOGICAL PRODUCT/SECURITY TARGET ONLY`. The status does not mean the current database or runtime conforms, and does not authorize diagrams that claim unverified current physical state or any implementation.
- ADR-034 remains authoritative for the three business roles and role responsibilities. ADR-035 adds identity trust, account disable enforcement, assessment answer/result behavior, SRS trust, assignment/revision behavior, and audit policy; it does not remap roles or reopen P0-D02.
- Within the scope above, conflicting historical/target requirements and use-case prose are superseded as current logical policy. Historical records remain preserved. Physical names and persistence semantics are not inferred from logical lifecycle labels.
- AI runtime/compatibility is outside this P0-D07 decision. No AI capability is restored or approved.
- Diagram Readiness: business-level CURRENT + TARGET behavior modeling has no remaining P0-D07 policy blocker. A trustworthy CURRENT deployment/database view is not ready until read-only live reconciliation. The next task is **Full CURRENT + TARGET Modeling Review**; implementation must not precede it.
- No application, API, schema, Prisma, migration, seed, live-database, generated, or diagram-file change is included. Runtime tests are not applicable to this decision-only task.

### Status

`ACCEPTED — P0-D07 LOGICAL PRODUCT/SECURITY TARGET ONLY; PHYSICAL DESIGN, LIVE-DB CLAIMS, AND IMPLEMENTATION DEFERRED`

---

## ADR-036 — MVP Learning, SRS, Assessment and Learner Operations Product Revision

### Date

2026-10-10

### Category

`product-behavior / learning-progress / assessment / learner-operations`

### Approval Evidence

The Product Owner explicitly approved the six decision groups in the 2026-10-10 Product Revision request and directed this bounded documentation-only reconciliation. It does not authorize application implementation, API changes, physical schema, migrations, Prisma edits, or database operations.

### Context

The prior audit found that several canonical activity diagrams still implied correctness-gated lesson completion, English-specific assessment defaults, periodic Reassessment, and incomplete SRS enrollment behavior. The current detailed learner requirements and approved ADR-030–035 provide the broader authority; this ADR resolves the requested MVP product behavior without changing physical representation or historical documents.

### Decision

1. **Lesson attempt, retry, score and completion.** A lesson has `N` required core exercises, configured for that lesson; no question count is a platform invariant. In one attempt, a first correct response contributes `1.0`. A first incorrect response receives formative feedback and that exercise moves to the end of the queue for exactly one retry. A correct retry contributes `0.5`; an incorrect retry contributes `0`. If `K` exercises were first answered incorrectly, the completed attempt performance is `sum(contributions) / (N + K)`: every actual response, including each retry, is in the denominator. The score may be displayed as a percentage, but no example count defines the rule. Completion requires validly processing all core exercises, including each required retry, and successfully recording the validly ended attempt; correctness does not gate completion. An unfinished attempt creates no completion or completed performance. Redo creates a new attempt without incrementing completed-lesson count. The latest completed attempt is the primary performance display; best completed performance may be secondary. Completion and progress do not depend on either score.
2. **Vocabulary enrollment and SRS.** Core Vocabulary attached to a lesson is enrolled for that learner when the lesson is completed. Optional Vocabulary is not enrolled automatically; the learner may explicitly add it for review. A learner has one logical card per Vocabulary identity. Seeing the same Vocabulary again reuses the card without resetting stage or due date. A newly enrolled card starts at Policy B stage 1 with its first due date one day later. Remembered ratings advance the stage and server-calculated due date through `1 → 3 → 7 → 14 → 30` days; after the final stage, the card remains active and recurs every 30 days. A forgotten rating resets the schedule to stage 1 with a one-day due date and may return the card to the end of the same review session once. That reinforcement is not a second scheduling operation and does not change the long-term schedule again. Scheduling authority and operation idempotency remain governed by ADR-035. This does not adopt a four-rating scale.
3. **Available curriculum, withdrawal and replacement.** Learners follow the active curriculum. Future content that is not published/available can be shown as locked or coming soon and is excluded from the eligible required-lesson progress denominator. Withdrawal preserves valid completion, result, performance and history; an uncompleted withdrawn lesson is unavailable and does not appear as an uncompleted requirement in current eligible progress. Replacement does not erase history or force a learner who completed the prior version to repeat it. A learner who has not completed the lesson follows the active replacement. Current-curriculum progress uses eligible available requirements; historical evidence remains available separately. A future policy that requires relearning or migrates curriculum obligations needs separate approval. If the next level has no available content, show it as locked/coming soon and explain that the learner completed all currently available content.
4. **Assessment blueprint and immutable version.** Admin defines the assessment requirement/blueprint, including language, framework, level or transition, purpose, curriculum and topic coverage, skill/knowledge coverage, item requirements/distribution, and necessary configuration. Teacher authors the actual items within assigned work. The system checks blueprint coverage, required items/configuration, valid answer/grading data, required media, and item completeness before submission/publication. Teacher submits; Admin reviews, approves and publishes an immutable logical Assessment Version. A learner attempt is bound to one version; its items and grading keys cannot change during that attempt. An exact item previously exposed in ordinary lesson practice together with its answer, correctness, or answer-revealing explanation cannot be reused in an assessment; the same concepts may be tested with different items or variants. This is a bounded product flow, not authorization for a generic workflow engine or a physical schema.
5. **Reassessment is deferred.** Reassessment, periodic rechecking, and verified-proficiency reassessment are outside MVP. MVP learner assessment purposes are Placement (starting-point recommendation only) and Level-up (curriculum progression only); neither implies comprehensive certification. Reassessment material in historical specifications remains historical. Any retained diagram artifact must be labelled `DEFERRED — NOT MVP` and must not appear in the active learner journey or active MVP diagram catalog. The current detailed 14-entry use-case catalog contains no standalone Reassessment use case; its count and identities do not change. UC-03 email reminder remains a catalog placeholder deferred under ADR-031.
6. **Admin learner-account operations.** Admin may find a Learner account, view only necessary identity/status/role information and a minimal LearningContext summary for support, disable/re-enable the account, enter a reason where appropriate, and have the operation audited. Admin may not alter lesson completion, performance, assessment results, SRS review history, activity, level, progress, or other learning evidence. Password recovery remains an account recovery flow; Admin does not learn or set the learner's current password.

### Logical Data Implications

The logical model must be able to express lesson attempt/performance provenance, completion facts, Vocabulary identity and SRS enrollment/review history, curriculum availability/eligibility, assessment blueprint/version/items/results, and audited learner-account actions. These are domain concepts, not instructions to create one physical table per concept. No `SkillProfile`, mastery engine, `KnowledgeGap`, persisted `LearningPlan`, `Enrollment`, generalized QuestionBank, or generic workflow engine is introduced.

### Consequences and Supersession

- ADR-036 is the current MVP product authority for the six scopes above. It supplements ADR-030–035; it does not reopen their other decisions or approve implementation/physical design.
- Within the stated scope, it supersedes conflicting active TARGET prose/diagrams that require correctness for completion, imply fixed question counts as platform rules, enroll all vocabulary automatically, stop SRS at the final stage, count unavailable content as incomplete, force redo after replacement, reuse answer-exposed practice items verbatim in assessments, include Reassessment in MVP, or let Admin edit learning evidence.
- Existing catalog numbering and historical crosswalks remain stable. No current detailed UC is removed for Reassessment because none exists there; reminder UC-03 remains explicitly deferred.
- Existing English curriculum examples may remain curriculum-specific configuration/content. They do not become platform-wide question counts, level mappings, or assessment thresholds.
- Physical attempt/performance, SRS enrollment/review records, curriculum eligibility, assessment versioning, Admin learner scope, audit representation, and live runtime/database state remain for later approved design and implementation tasks.
- This approval covers documentation only. No application source, API, Prisma, SQL migration, seed, RLS/RPC, or database was changed or authorized.

### Status

`ACCEPTED — MVP PRODUCT/DOCUMENTATION POLICY; IMPLEMENTATION AND PHYSICAL DESIGN NOT AUTHORIZED`

## ADR-041 — Learner-Facing SRS Selection and Assessment Session Boundary

### Date

2026-10-12.

### Category

product-behavior / srs-interaction / assessment-boundary

### Approval Evidence

The user's direct task request and PO clarification are preserved in plans/approved/2026-10-12-report-functional-usecase-views-REQUEST.txt with the bounded documentation-only scope in -APPROVED.md. This record authorizes the stated product interaction clarification and its logical/report documentation; it does not authorize application implementation or physical-design changes.

### Context

The previous SRS specification described opening a review session and returning a due-card list to the learner interface. The latest PO clarification says due/overdue identity and schedule are internal and the learner should not preview the vocabulary that the system will ask. The same clarification distinguishes ordinary learning/practice from scored immutable Placement and Level-up Assessment Versions.

### Decision — accepted PO clarification

1. Do not provide learner-facing due/overdue vocabulary list, preview, stage list, or selection from a due queue. due_at, due detection, and candidate selection remain internal/server-authoritative.
2. During an ordinary learning/practice/checkpoint session, the system may select eligible due/overdue cards and append or interleave review questions. The learner sees only each selected question/prompt and answer interaction. A dedicated review session is optional; if offered, item selection starts only after the learner begins that session.
3. Keep due/overdue cards eligible for later suitable sessions until validly reviewed. The learner may supply a valid recall outcome and may explicitly Add to Review for optional vocabulary, but does not choose stage, interval, due date, or the due-card set.
4. Never insert dynamic SRS items into the scored immutable Assessment Version used for Placement or Level-up. A separate review block near an assessment remains outside that version, score, and pass/fail result.
5. Preserve ADR-036 scheduling semantics: core vocabulary auto-enrolls after valid lesson completion; optional vocabulary requires learner action; one logical card per Learner+Vocabulary; Policy B is 1 → 3 → 7 → 14 → 30 days then every 30 days; forgot resets stage and allows at most one same-session reinforcement with no second scheduling operation. Server scheduling authority and operation idempotency remain.

This clarification changes only learner-facing SRS interaction and session composition. It does not create a new canonical UC, role, persisted Progress subsystem, or physical design.

### Alternatives

Showing a due-word list or letting learners choose items was rejected by the supplied PO clarification. Injecting SRS questions into immutable scored assessment versions is rejected because it changes item composition by learner and can alter score/pass-fail semantics. Keeping a separate optional review after the learner starts it is allowed.

### Consequences / Evidence

docs/02-requirements.md, UC-06/UC-07 in docs/use-case-specifications.md, docs/05-traceability-matrix.md, ACT-03/ACT-06/SEQ-06/SEQ-08, and report-oriented views now state this interaction boundary. VIEW-RUC-* identifiers are report diagrams only; canonical UC-01–UC-14 remain unchanged. The Domain/Data diagrams retain dueAt/due_at as internal scheduling data and were inspected; they do not claim learner visibility. Physical design must consume the updated SRS interaction semantics; due_at remains persisted/internal, but learner-facing due-list browsing is not an MVP capability. Physical files were not changed.

### Status

ACCEPTED — PO CLARIFICATION; LOGICAL PRESENTATION ONLY; NO PHYSICAL-DESIGN APPROVAL

## ADR-042 — Study Focus personalization addendum and bounded physical correction

### Date
2026-10-12

### Category
product-behavior / logical-modeling / proposed-physical-security

### Approval Evidence
Direct PO instruction preserved in plans/approved/2026-10-12-study-focus-personalization-f01-f02-REQUEST.txt and bounded APPROVED.md. Product semantics are authorized; physical correction is proposed documentation, not physical-design or implementation approval. ADR-036 and ADR-041 remain unchanged.

### Context
PO requested lightweight context personalization without changing shared core, SRS schedules or immutable scored assessments. The final physical recheck left exact authoring-secret and context-lock principal dependencies F01/F02 open.

### Decision
One primary Study Focus per LearningContext: BALANCED default, VOCABULARY, GRAMMAR, READING, LISTENING. Owned-context preference change affects only subsequent supplementary composition; no resets/history rewrite. Use configuration-driven nonexclusive bias with eligible fallback, independently selected internal due/overdue SRS and finite existing course Topic/Skill metadata. Eligible authored PRACTICE stays published AVAILABLE and accessible in context; secure assessment items and prohibited reuse excluded. Shared core N/K contributions 1/0.5/0 with N+K, completion/order/unlocks/gates and Policy B remain unchanged. Learner receives only current prompt after start, no due browse/preview. Placement/Level-up retain pinned composition/results. No new canonical UC or preference/composition/history/taxonomy table.

The proposed physical realization uses existing context study_focus and item practice-skill metadata, retaining 34 tables; named checked Teacher grading read/edit/readiness/submit and Admin review/pinned grader paths; learner_writer stable parent-account lock before context lookup/count with explicit FORCE RLS grants/policies, and independent scoped-locker context SELECT. These proposed mechanisms still require separate final physical approval.

### Alternatives
Exclusive focus filtering, fixed selection percentages/counts, due-list browsing, dynamic secure-assessment injection, score/progress/SRS reset and new taxonomy/history/composition tables are rejected within this PO scope.

### Consequences / Evidence
docs/study-focus-addendum.md controls semantics/PERS-01–10; requirements, UC-04 supporting preferences, UC-06/07, trace, seven targeted logical sources and three existing report views are synchronized. docs/design/physical/personalization-and-final-correction.md, security-and-rls.md and rebuild-plan.md describe design/future acceptance. Runtime cases are NOT EXECUTED; current DB remains LIVE DB UNVERIFIED. Historical approval/review/ADR records are preserved.

### Status
ACCEPTED — PO PRODUCT ADDENDUM; PROPOSED PHYSICAL REALIZATION; NO IMPLEMENTATION AUTHORIZATION

## ADR-043 — System assembly of submitted assessment contributions

### Date
2026-10-20

### Category
product-behavior / assessment-authoring

### Approval Evidence
Direct PO answer to the multi-Lesson assessment assembly/submission ownership question: **“Hệ thống ghép các gói câu hỏi Teacher đã nộp theo blueprint, Admin chỉ duyệt/xuất bản”**. The preceding request “database đã có chưa chưa có thì bắt đầu làm đi” authorizes database-design work; neither statement approves a deployed schema, destructive migration or live cutover.

### Context
UC-09 and the accepted Class baseline assign one Lesson/content package and related items to one responsible Teacher at a time. A complete assessment can use several such packages. The retained physical proposal incorrectly assumed a standalone blueprint assignment and a Teacher submitting the entire assessment version. The logical sources had not assigned assembly ownership.

### Decision
Teacher authors and submits question contributions within the current Lesson assignment, following the Admin-configured blueprint. The system assembles eligible submitted question packages into a complete version according to that blueprint. Admin reviews, requests corrections, approves and publishes the assembled version; Admin does not author or manually compose its items. There is no lead-Teacher whole-exam submission role and no separate assessment Assignment target.

Preserve creation authorship, assignment episodes, source submissions and review history for every contribution. Feedback routes to the current Teacher responsible for the affected Lesson; corrected contributions are submitted again and assembled into a successor version. Published versions and learner attempt pins remain immutable. Existing readiness, coverage, grading secrecy and distinct secure-item rules remain in force. No new canonical use case, generic question bank or extra business role is introduced.

### Consequences / Evidence
UC-09–12, requirements and traceability record this ownership. Database reconciliation supplies proposed keys, copy-on-edit snapshots, assembly idempotency/security and future DB43-01–13 acceptance cases. Physical implementation choices remain PROPOSED; runtime tests are NOT EXECUTED and live DB is UNVERIFIED. The unchanged logical diagram bundle is a prior baseline; downstream Sequence/DATA/state views still require reconciliation with this addendum.

### Status
ACCEPTED — PO PRODUCT CLARIFICATION; PHYSICAL REALIZATION PROPOSED; NO LIVE MIGRATION APPROVAL

## ADR-044 — Completable published Lessons require at least one core exercise

### Date
2026-10-22

### Category
product-behavior / lesson-readiness

### Approval Evidence
Direct PO decision for FTR-01: **“Mọi Lesson có thể được publish để Learner hoàn thành phải có ít nhất 1 core exercise (`N >= 1`).”** The same instruction permits zero-core Draft, requires submit/approve/publish and runtime-start checks, retains `lesson_attempts.n_core > 0`, excludes N=0 completion/performance and prohibits a special content-only table/state/mechanism in MVP. The accompanying request authorizes dispositions and a formal staged implementation spec only; no Anti/Gemini, implementation, PoC or live database operation.

### Context
ADR-036 defines N/K scoring and processing every required response, but did not explicitly settle whether N=0 Lessons can complete. The Class revision-to-Exercise cardinality 0..* allows an empty Draft and does not require zero-core publication. FTR-01 identified this product boundary before implementation.

### Decision
Every Lesson publishable for Learner completion requires N>=1 core exercise on its exact revision. Draft authoring/save/preview may have zero. Readiness rejects zero at submit, approve and publish, and runtime start rechecks. Retain the physical positive n_core constraint. No N=0 performance/completion path or special content-only lifecycle is supported in MVP. Optional review, vocabulary and assessment contributions do not satisfy the core exercise count.

### Consequences / Evidence
ADR-036 completion, 2/1/0 half-unit scoring and N+K denominator, redo/history and SRS remain unchanged. The accepted Class cardinality remains valid without a diagram change. Requirements, UC clarification and physical readiness are synchronized. See official FTR disposition and implementation spec. FTR-02/03 technical contracts are Codex-selected and runtime-gated, not newly asserted PO product decisions. A1/A2/A3 and all implementation acceptance tests remain NOT EXECUTED.

### Status
ACCEPTED — EXPLICIT PO PRODUCT DECISION; IMPLEMENTATION SPEC ISSUED; NO IMPLEMENTATION OR LIVE ACTION AUTHORIZATION

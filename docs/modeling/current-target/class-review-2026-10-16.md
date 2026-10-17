# Class Diagram — semantic review and closeout, 2026-10-16

**Status: CLASS DIAGRAM COMPLETE.** DESIGN MODE, authorized by the current user request. Semantic review, traceability, relationship/cardinality review, canonical source/native merge, render verification and focused visual acceptance all PASS. No physical design, API, application code or implementation planning. This report supersedes the unfinished class-completion claim, not historical evidence or product decisions.

## Inventory before editing

[Machine inventory](evidence/2026-10-16-class-review/inventory.json) records every classifier/member, relationship, multiplicity and containment in the three entry models. [Baseline](evidence/2026-10-16-class-review/baseline.json) records entry HEAD, tracked-file hashes and raw hashes for all 44 native pages; [entry DOM page](evidence/2026-10-16-class-review/entry-DOM-01.xml) preserves the older primary.

| Artifact | Role at entry | Observed model |
|---|---|---|
| `src/DOM-01-core-domain-model.puml` | Canonical semantic editable source, completion unaccepted | 22 classes + StudyFocus enum, 28 relationships |
| `rendered/DOM-01-core-domain-model.svg` / `.png` | Generated canonical source renders, not proof of completion | Candidate naming and members |
| `lingora-all-diagrams.drawio`, page `page-DOM-01` (29) | Primary native editable representation; stale DOM only | 22 classes + 1 enum, 24 relationships; LogicalUnit / AssessmentVersion |
| `evidence/2026-10-12-class-design-completion/candidate.drawio` / `candidate-DOM-01.xml` | Unmerged candidate, preserved unchanged | 22 classes + 1 enum, 28 relationships; Unit / AssessmentBlueprintVersion |
| Same evidence directory `model.json`, `layout.json`, `baseline.json`, backup | Previous candidate/review provenance | Evidence, not independent approval |
| `class-design-completion-2026-10-12.md` | Unfinished earlier reconciliation | No render/review/merge closeout |
| `class-completeness-review-2026-10-12.md` and class-completeness/readability evidence | Dated review/export evidence | Earlier 24-relationship model |
| `lingora-all-diagrams-svg-editable.drawio`, `evidence/previews/DOM-01-core-domain-model.png`, `evidence/native-render-review/final/20-DOM-01.png` | Comparison/historical generated artifacts | Not primary/current acceptance |

There are six compositions: User–Profile, Course–Unit, Unit–Lesson, Lesson–ContentRevision, ContentRevision–Exercise, BlueprintVersion–AssessmentItem. Other links are plain, nondirectional associations. No inheritance or shared aggregation; Admin/Teacher/Learner are mutually exclusive account roles, not subclasses or multiple-role inheritance.

## Authority and trace (all classifiers)

Controlling sources: [accepted ADRs](../../../logs/decision-log.md) ADR-030–036/041/042, [14-entry UC catalog](../../use-case-specifications.md), [current requirements addenda](../../02-requirements.md), [Study Focus](../../study-focus-addendum.md), and the eight active ACT sources. Compatible naming/snapshot clarification is explicitly preserved in the [approved class request](../../../plans/approved/2026-10-12-class-design-completion-REQUEST.txt) §§2/6/10 and its [scope record](../../../plans/approved/2026-10-12-class-design-completion-APPROVED.md); neither overrides ADRs. Prisma, downstream logical-data/physical proposals and old D4 prose do not justify this model.

| Classifier | Current justification | Review / minimum action |
|---|---|---|
| User | ADR-034/035; UC-01/13; ACT-07 | KEEP one trusted role/status; constrain learner-owned links |
| Profile | ADR-031 §3/9; UC-01/08 | KEEP account-global identity/preferences/timezone/streak |
| LearningContext | ADR-030/031/032/033/042; UC-02/04/05; ACT-01/02/04 | COMPLETE bounded in-flight assessment references and derived working level; preserve starting-point provenance |
| StudyFocus (enum) | ADR-042; UC-04/06/07; ACT-01/03/06 | KEEP exactly five values, BALANCED default |
| Language | ADR-030/031; UC-04; ACT-01 | KEEP learned-language scope |
| ProficiencyFramework | ADR-030 §5; UC-02/04/05 | KEEP framework/version scope |
| Level | ADR-030/033; UC-04/05/08; ACT-04 | KEEP framework-aware level, not universal CEFR |
| Course | ADR-030 §1–3; ADR-033 §7–8; UC-04/09 | COMPLETE configured curriculum gate reference |
| Unit | ADR-030 shared ordered curriculum; UC-04/06; compatible class request §§2/6 | KEEP ordered Lesson grouping under Course; no separate LogicalUnit |
| Lesson | ADR-030/035/036; UC-04/06/09; ACT-03/09 | KEEP shared identity/order/eligibility and controlled metadata |
| Vocabulary | ADR-030/031/036; UC-07; ACT-03/06 | KEEP shared lexical content; core/optional belongs to revision membership |
| Exercise | ADR-033/035/036/042; UC-06/10; ACT-03/08 | COMPLETE bounded required media; retain grading secrecy and finite practice metadata |
| Assignment | ADR-034 §3–6; ADR-035 §2; UC-09–11; ACT-08/09 | KEEP retained episodes, one active Teacher per Lesson package; no terminal content status |
| ContentRevision | ADR-035 §3/6; UC-10–12; ACT-08/09 | COMPLETE learner content/media, vocabulary membership, retained submission/review feedback and assignment attribution |
| SecurityAuditEvent | ADR-035 §6; UC-13/14; ACT-07/08/09 | KEEP append-only security audit, separate from workflow history |
| AssessmentBlueprint | ADR-036 §4; UC-09; ACT-08 | COMPLETE explicit curriculum scope and Admin configurator |
| AssessmentBlueprintVersion | ADR-035/036/041; UC-02/05/10–12; ACT-02/04/08 | COMPLETE frozen curriculum/item-requirement snapshots and review history; configuration AND authored items/grading |
| AssessmentItem | ADR-035/036/042; UC-10/12; ACT-08 | COMPLETE assigned Teacher provenance/media; REMOVE misleading practiceExposureEligible |
| AssessmentResult | ADR-031/032/035/036; UC-02/05; ACT-02/04 | COMPLETE separate assessmentType/deliveryMode; completed immutable evidence only |
| LessonAttempt | ADR-033/036; UC-06/08; ACT-03/09 | COMPLETE bounded core-response history; keep revision binding and independent completion/performance |
| LearningPlan | ADR-030 §9; ADR-031 §10; UC-04; ACT-01 | KEEP derived deterministic ordered shared Lessons; persistence DEFER |
| Progress | ADR-031/033/036; UC-08; ACT-01/04/09 | KEEP derived eligible intersection numerator/denominator/optional ratio per Level |
| SrsCard | ADR-030/031/035/036/041/042; UC-07; ACT-06 | KEEP account-wide User+Vocabulary state and trusted review history; schedule internal |

**ORPHAN CLASS: none. MISSING DOMAIN CONCEPT:** in-flight pinned assessment, revision-specific core/optional Vocabulary membership, retained submission/review feedback, assigned assessment authorship and learner content/media were incompletely represented. Existing classes plus bounded logical reference values suffice; no new classifier, table or framework is needed.

UC coverage: UC-01 User/Profile; UC-02 assessment/context; UC-03 reminder explicitly DEFERRED (no Reminder class); UC-04 curriculum/context/plan; UC-05 assessment/progress; UC-06 lesson/revision/exercise/attempt; UC-07 Vocabulary/SrsCard; UC-08 Progress/Profile; UC-09 blueprint/Assignment; UC-10 authored revisions/items; UC-11 retained submission/feedback; UC-12 revision/version lifecycle; UC-13 User/audit; UC-14 derived reporting from authorized state/audit. ACT-01/02/03/04/06/07/08/09 are covered; no ACT-05 or extra UC is activated.

## Divergences and all relationship constraints

**Unit:** same classifier as LogicalUnit, ordered grouping of shared Lessons within a Course, scoped to a Level. No different logical responsibility justifies a second concept. Naming follows current shared-curriculum behavior and compatible explicit class approval, not Prisma.

**AssessmentBlueprintVersion:** immutable published assessment definition: purpose/scope/coverage/configuration plus fixed authored item content, media and grading policy. This is the “Assessment Version” of ADR-036, not a config-only version and not a newly generated per-learner test. Each in-flight attempt pins exactly one such version before any Result exists. Changing blueprint/configuration cannot change existing version evidence.

**24 → 28:** exactly four additions after normalizing the two names: User–Assignment (Admin assigner, ADR-034/035), Vocabulary–Language (shared lexical-language scope, UC-07 and ADR-030/031), Progress–Level (ADR-033 level denominator), LessonAttempt–ContentRevision (ADR-035/036 retained evidence). Context–Language and Unit–Level already existed in the 24, so are not additions. All four stay. No relationship is added merely for a newer file.

| Links (source → target) | Multiplicities / rationale |
|---|---|
| User → Profile | 1 : 1 composition of account-global state |
| User → LearningContext | 1 : 0..*; Learner owner only; unique User+Language, at most two ACTIVE; paused history is not capped at two |
| Context → Language; Unit → Level; Vocabulary → Language | many : 1; one learned/content/lexical scope |
| Context → LearningPlan | 1 : 0..1 derived current output, no required storage |
| Context → Progress; Progress → Level | 1 : 0..*; many : 1; at most one derived current value per Context+Level |
| Language → Course | 1 : 0..*; MVP one shared core convention, not permanent structural limit |
| Framework → Level | 1 : 1..*; every modeled framework defines levels |
| Course → Unit → Lesson | each 1 : 0..* composition; empty preparation allowed, no fixed counts or Course/Unit publication state |
| Lesson ↔ Vocabulary | 0..* : 0..* structural content relation; exact core/optional membership pinned by revision |
| Context → LessonAttempt; Attempt → Lesson; Attempt → ContentRevision | 1 : 0..*; many : 1; many : 1; revision must belong to same Lesson and context language |
| User → SrsCard; SrsCard → Vocabulary | 1 : 0..*; many : 1; Learner owner only; unique pair, global across contexts |
| Blueprint → Version; Version → Result; Context → Result | each 1 : 0..*; no fabricated Result for an unfinished/invalid/unrecorded submission |
| Assignment → User (Teacher); User (Admin) → Assignment; Assignment → Lesson | many : 1; 1 : 0..*; many : 1; historical episodes retained, one active Teacher per package |
| Lesson → ContentRevision; Revision → Exercise; Version → AssessmentItem | each 1 : 0..* composition; drafts may be empty; publication readiness requires configured complete payload/items |
| User → SecurityAuditEvent | 1 : 0..*; authenticated actor for scoped privileged operations; immutable events do not contain secrets |

Association lines indicate domain references, not navigation/API directions. Composition means exclusive logical ownership, **not** cascade deletion; referenced revisions/items/attempts/results/history remain retained. Framework/language/scope references must agree across curriculum, context, version, item and result. No six-role inheritance, learner-owned curriculum copies or physical data assumptions.

## Bounded reference dictionary and invariants

`Reference` denotes a logical domain reference/value, never an FK, JSON storage decision, endpoint or generic plugin. Collections below carry their stated content; they cannot substitute arbitrary data.

- `LearningContext.assessmentAttempts`: attempt identity + one owned context + one published BlueprintVersion pinned from start + submission identity, with 0..1 completed Result. In-flight state may be transient; invalid/interrupted/failed-record attempts yield no completed Result; same-submission retry is idempotent, deliberate new attempt is distinct. No one-active-attempt cap or cross-session resume is prescribed. Result provenance identifies this same attempt/context/version.
- `LearningContext./workingLevel`: derived curriculum working/unlocked level from accepted entry and valid Level-up evidence plus current curriculum policy; does not rewrite starting-point history or claim verified proficiency.
- `Course.curriculumGate`: course/level configured completion criterion required alongside passed Level-up; no fixed platform percentage. Blueprint `curriculumScope/coverage/itemRequirements`: configured Course, topic/skill/knowledge coverage and item distribution, defined by Admin. Version snapshots freeze those values along with purpose, language/framework/level transition, result policy and server-only grading; later live blueprint edits never reinterpret evidence.
- `ContentRevision.learnerContent/mediaRefs`, Exercise/AssessmentItem `mediaRefs`: bounded text/instructions/content/media required by configured item format/readiness. No media subsystem or schema is selected.
- `ContentRevision.vocabularyMemberships`: zero or more distinct Vocabulary references, each core or optional for that revision and matching Lesson language. Lesson–Vocabulary is the structural union/view; completion enrolls exactly core members of the revision actually completed, never every later/current member or a global Vocabulary flag.
- Revision `author/assignment`, Item `authoring`: immutable attribution to creating Teacher and the Assignment episode covering that same Lesson/content package; subsequent reassignment preserves old attribution. Assessment item scope also agrees with its blueprint coverage. No standalone-assessment Assignment XOR is introduced.
- Revision/Version `submissionReviewHistory`: retained actor, action, time, feedback, target revision/version and applicable Assignment episode. Only current assigned Teacher submits/edits Draft or Changes Requested; Admin requests changes/approves/publishes. History is distinct from append-only SecurityAuditEvent; neither replaces the other. Minimal optimistic version check applies; persistence is deferred.
- Result `assessmentType/deliveryMode`: independent logical classifications retained by ADR-032 §10; separate from MVP purpose Placement or LevelUp, traced to the pinned evidence configuration. This diagram does not select new modes, adaptive branching or deferred Reassessment.
- LessonAttempt `responses`: valid first/retry outcomes and contribution per required core Exercise in the pinned revision. Exactly one retry for each first-incorrect answer; N is configured core count, K first-incorrect count, `responseCount=N+K` on completion and performance is contributionSum/responseCount. Incomplete attempts have no completedAt/performance. Supplementary practice/SRS never enters these values. Completion counts distinct Lessons, redo never adds another completed Lesson.
- Progress numerator is completed Lessons **within the eligible required set** in the Level; denominator includes published active required Lessons locked only by sequential progression, excludes unavailable and withdrawn-incomplete requirements. No ratio when denominator is zero. Old completion/history remains retained separately after withdrawal/replacement; no forced redo.
- SrsCard `reviewHistory`: trusted review operation identity, valid recall outcome, server time and resulting schedule, retained independently of context. Same-operation retry is idempotent; forgotten reinforcement at most once per session never schedules again. Policy B 1/3/7/14/30 then recurring 30 days; due/stage internal, no learner due list. Context pause/focus never resets cards.
- SecurityAuditEvent records actor/action/target/version/serverTime/outcome/conditional reason; privileged account, assignment, review/publication, config and denial events are append-only and Admin-readable. No passwords/tokens/answer secrets. Admin cannot alter learning evidence.

Published payload/items/grading are immutable; archive/withdrawal changes availability/lifecycle only. Ordinary practice may give formative feedback, but secure assessments reveal only aggregate result/recommendation, never per-item correctness/keys. Exact answer-exposed practice items cannot become assessment items; concept variants may. Dynamic SRS/focus practice is excluded from pinned scored versions. Study Focus affects next supplementary composition only; started composition, core order/gates, evidence, history and SRS remain unchanged.

## Independent review / acceptance

Initial independent reviewer read all eight active Activities and current ADR/UC/requirement sources. Bounded corrections were required; no material product ambiguity and no orphan classifier. Corrected semantic and final artifact reviews PASS; see [independent review](evidence/2026-10-16-class-review/independent-review.md). Header separators crossing derived members were corrected in one bounded artifact correction; role/card collisions and routes around expanded classes were checked and corrected before acceptance.

**Final model:** 22 classes, one enum, 28 relationships (six compositions, 22 associations), 147 class attributes plus five enum values. No class was added/removed; only the unjustified `AssessmentItem.practiceExposureEligible` field was removed. Missing responsibilities were expressed by existing classes and bounded reference values, not new subsystems.

**Acceptance gates:** semantic PASS; traceability PASS (14 UC identities / eight active ACTs); relationships/cardinalities PASS; source/native canonical identity PASS; PNG/SVG render/export PASS; focused coordinator and independent visual review PASS. All 23 native classifier IDs/positions/widths preserved. Canonical DOM is the exact independently reviewed candidate; all 43 other native page fragments, 35 other manifest records, old candidates/evidence and unrelated tracked files are unchanged.

## Verification and limits

Environment: Windows, Python 3.11, local JDK 17, PlantUML 1.2026.8 (same version as the existing manifest), portable Draw.io Desktop 32.4.1. Export tools were cached outside the repository; no project dependency or product code changed.

| Command/check | Observed result |
|---|---|
| `py -3.11 docs/modeling/current-target/evidence/2026-10-16-class-review/build_candidate.py` | PASS; DOM-only native candidate staged using preserved IDs/geometry |
| Java / existing PlantUML CLI `--check-before-run --no-error-image --format svg/png` on DOM-01 only | Both exit 0; full command/output in `plantuml-svg.json` / `plantuml-png.json` |
| Draw.io `--export --format png/svg --page-index 29 --border 30 --theme light` on candidate | Both exit 0; native PNG 4205×2737, source PNG 3384×2738; page index is one-based |
| `py -3.11 docs/modeling/current-target/evidence/2026-10-16-class-review/verify_class.py` | Exit 0; source/native members and 28 relationship tuples, bounds/routes, SVG text, hashes, 44-page preservation, scope and local links PASS |
| `py -3.11 scripts/validate_drawio.py` | Exit 0; complete 44-page validation PASS. Its old success message still says “35”; actual inventory/page count is independently checked as 44 (35 active canonical + nine report views) |
| Focused visual inspection and independent re-review | PASS; [hash-bound visual record](evidence/2026-10-16-class-review/visual-review.md) |
| `git diff --check` | Exit 0; no whitespace errors |
| Existing broad `py -3.11 docs/modeling/current-target/verify.py` at entry | FAIL on `fresh source DEP-01`; [unchanged pre-existing failure](evidence/2026-10-16-class-review/all-bundle-entry-check.txt). 17 non-DOM source hashes were already stale; full script also carries dated task-specific checks. Not repaired or claimed PASS by this focused task |

[Machine results](evidence/2026-10-16-class-review/verification.json), [complete focused output](evidence/2026-10-16-class-review/class-check.txt) and [native validator output](evidence/2026-10-16-class-review/native-check.txt) record observed checks. All required Class acceptance checks pass. No unresolved Class domain issue; the broad bundle's pre-existing provenance drift remains a separate concern, not a Class Diagram completion claim.

**Class Diagram accepted as the current logical/domain design baseline.** Physical/database design remains **NOT STARTED / NOT APPROVED by this task**. Historical downstream proposals remain unapproved. No implementation or implementation planning authorized; no follow-on task automatically activated. No commit/push created; changes remain reviewable in the working tree.

## Exact changed files

Paths are repository-relative. No files outside these documented areas changed.

| Path | Purpose |
|---|---|
| `HANDOFF.md` | Current handoff and next boundary |
| `docs/QUICK-REF.md` | Current snapshot/check limits |
| `docs/README.md` | Authority/baseline status |
| `docs/modeling/current-target/README.md` | Canonical index/focused reproduction |
| `docs/modeling/current-target/class-review-2026-10-16.md` | Inventory, trace, invariants and closeout |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/DOM-01-core-domain-model.png` | Reviewed full render or focused visual QA detail |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/DOM-01-core-domain-model.svg` | Reviewed full render or focused visual QA detail |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/all-bundle-entry-check.txt` | Pre-existing broad-verifier failure output |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/baseline.json` | Entry file/raw page hashes |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/build_candidate.py` | DOM-only reconstruction from preserved IDs/layout |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/candidate-DOM-01.xml` | Reviewed native candidate before canonical merge |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/candidate-source.txt` | Reviewed corrected source snapshot |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/candidate.drawio` | Reviewed native candidate before canonical merge |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/class-check.txt` | Exact commands, observed check/export results and provenance |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/diff-check.txt` | Exact commands, observed check/export results and provenance |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/entry-DOM-01.xml` | Preserved older primary DOM page |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/independent-review.md` | Independent semantic/artifact review and hashes |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/inventory.json` | All entry classifier/member/relationship inventories |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/model.json` | Final classifier/member/relationship inventory |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/native-DOM-01.png` | Reviewed full render or focused visual QA detail |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/native-DOM-01.svg` | Reviewed full render or focused visual QA detail |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/native-assessment.png` | Reviewed full render or focused visual QA detail |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/native-check.txt` | Exact commands, observed check/export results and provenance |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/native-governance.png` | Reviewed full render or focused visual QA detail |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/native-identity.png` | Reviewed full render or focused visual QA detail |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/native-progress.png` | Reviewed full render or focused visual QA detail |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/plantuml-png.json` | Exact commands, observed check/export results and provenance |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/plantuml-svg.json` | Exact commands, observed check/export results and provenance |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/source-identity.png` | Reviewed full render or focused visual QA detail |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/verification.json` | Exact commands, observed check/export results and provenance |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/verify_class.py` | Focused deterministic acceptance and preservation |
| `docs/modeling/current-target/evidence/2026-10-16-class-review/visual-review.md` | Manual visual acceptance/final hashes |
| `docs/modeling/current-target/lingora-all-diagrams.drawio` | DOM-01 only, 43 other fragments unchanged |
| `docs/modeling/current-target/render-manifest.json` | DOM source/render/native/review provenance only |
| `docs/modeling/current-target/rendered/DOM-01-core-domain-model.png` | Canonical generated source render |
| `docs/modeling/current-target/rendered/DOM-01-core-domain-model.svg` | Canonical generated source render |
| `docs/modeling/current-target/src/DOM-01-core-domain-model.puml` | Canonical editable logical/domain source |
| `logs/development-log.md` | Completion/problems/corrections, byte-preserving append |
| `logs/test-log.md` | Observed commands/results, byte-preserving append |
| `plans/approved/2026-10-16-class-review-APPROVED.md` | Authorized design scope snapshot |
| `plans/archive/2026-10-16-class-review-DONE.md` | Design completion snapshot |
| `plans/current-task.md` | DONE pointer and scope |

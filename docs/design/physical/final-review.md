# Final Physical Data & Runtime Design Review — Lingora

**Ngày:** 2026-10-11 · **Phạm vi:** independent review, documentation only.
**Baseline:** [request](../../../plans/approved/2026-10-11-final-physical-runtime-review-REQUEST.txt), [approved review scope](../../../plans/approved/2026-10-11-final-physical-runtime-review-APPROVED.md), [workspace baseline](../../../plans/approved/2026-10-11-final-physical-runtime-review-BASELINE.json).

## A. Final verdict

**NEEDS PHYSICAL CORRECTION**

Review phát hiện **12 findings: 6 P1, 6 P2**. Các bảng có giá trị persistence, nhưng thiết kế chưa khép kín quyền thực thi, scope/history và concurrency. `PHYSICAL DESIGN READY FOR REVIEW` của vòng trước chỉ là trạng thái đầu vào; không được dùng làm bằng chứng phê duyệt. Không có blocker nào cần đổi chính sách sản phẩm đã được duyệt. Các hướng sửa dưới đây là đề xuất physical; không tự trở thành quyết định được PO chấp thuận.

Nguồn đối chiếu: latest PO request; ADR-030–036 trong [decision log](../../../logs/decision-log.md); [active requirements](../../02-requirements.md); [UC catalog](../../use-case-specifications.md); [traceability addenda](../../05-traceability-matrix.md); approved [DOM-01](../../modeling/current-target/src/DOM-01-core-domain-model.puml), [DATA-03](../../modeling/current-target/src/DATA-03-target-logical-erd.puml), ACT-01/03/04/06/08/09, STA-01/02/03, SEQ-03/04/06/07/08/09 và SEC-01. ADR-036 supersedes conflicting historical retry/Reassessment/availability prose; older UC numbers and old implementation statuses are not evidence.

Đã đọc catalog/typed definitions, [security matrix](security-and-rls.md), [rebuild/test plan](rebuild-plan.md), [prior review](review-and-verification.md), ERD source, manifest, verifier và outputs. Ba reviewer độc lập, read-only, kiểm tra security, learner evidence, content/rebuild; reviewer chính đối chiếu findings với nguồn và xem riêng cả bốn PNG. Structural verifier không chứng minh semantic correctness; không có runtime/DB test trong task này.

### Findings phải đóng trước approval

Các line numbers dưới đây thuộc source package tại review baseline. Review chỉ thêm status/pointer ở đầu README; không sửa các định nghĩa đang được đánh giá.

| ID | Priority | Gap | Scope | Trạng thái |
|---|---|---|---|---|
| F01 | P1 | Teacher SUBMIT không có principal/grant path phù hợp | security 38–39, 67, 86 | OPEN |
| F02 | P1 | First context không qua được course-lock predicate; thiếu own-context lookup privilege | security 41; README 73, 240 | OPEN |
| F03 | P2 | Authenticated denial khi thiếu account không ghi được actor FK | README 108, 139–143 | OPEN |
| F04 | P2 | Không pin assignment generation/scope đã submit/approve | README 77, 86, 88, 101; security 39 | OPEN |
| F05 | P1 | Không biểu diễn được removal của draft memberships | README 79, 83, 85, 102, 187; security 50, 96 | OPEN |
| F06 | P1 | Cleanup race có thể xóa media vừa được reference/publish | README 84–85, 181, 240; security 96 | OPEN |
| F07 | P1 | Same-framework level/course moves có thể đổi nghĩa lịch sử và obligations | README 71–73 | OPEN |
| F08 | P1 | Old open lesson attempt có thể tạo first completion sau replacement | README 92, 149, 159, 199 | OPEN |
| F09 | P2 | Reinforcement uniqueness theo parent chưa thực hiện bound card/session | README 96, 206, 247 | OPEN |
| F10 | P2 | Default start chỉ kiểm tra framework, chưa kiểm tra available curriculum | README 70, 73 | OPEN |
| F11 | P2 | Mutable blueprint scope có thể làm invalid pinned historical attempt | README 100–103, 169 | OPEN |
| F12 | P2 | Chưa có authoritative controlled topic/skill/purpose representation | README 72, 77, 100, 102 | OPEN |

**F01 — Teacher submission.** Current assigned ACTIVE Teacher submits valid DRAFT. `lingora_content_writer` cannot update lifecycle/provenance; `lingora_transition_writer` requires ACTIVE ADMIN; trigger responsibility reserves lifecycle metadata to Admin. This valid UC-11/SEQ-03 operation has no feasible named executor. Add a separately checked Teacher SUBMIT capability on an existing narrow owner: current assignment, editable state, expected parent version, readiness checks, only submission/status/version fields and append-only provenance/audit. Keep approve/publish Admin-only. Identify private-key SELECT for authorized Teacher authoring too: content writer lists INSERT/UPDATE but matrix promises Teacher read. Do not solve by generic runtime lifecycle UPDATE.

**F02 — Context creation/lock dependencies.** Locker authorizes learner course lock through an already-owned matching context, which does not exist at first creation. It also lacks enumerated context SELECT or named authorization-helper EXECUTE for that predicate. Creating context before course lock contradicts the documented order; skipping lock loses configuration serialization. Define a bounded first-create branch validating ACTIVE learner, learnable language and selected course configuration under actor → course locks; explicitly provide own-context lookup for existing-context locks. Policy predicates need the privileges of their referenced relations; row locking needs applicable SELECT/UPDATE permissions. [PostgreSQL CREATE POLICY](https://www.postgresql.org/docs/15/sql-createpolicy.html), [SELECT](https://www.postgresql.org/docs/15/sql-select.html).

**F03 — Missing account audit.** Provisioning intentionally allows verified Auth UUID with no account row. A sensitive privileged request is denied correctly, but independent audit INSERT cannot reference that UUID in `accounts`; null actor contradicts authenticated attribution. Separate trusted verified subject UUID from optional account FK. Preserve account attribution for normal successful domain actions; bounded subject attribution covers missing-account denial. Add a negative test for this recovery window, without tokens/email/raw answers in audit.

**F04 — Reviewed assignment scope.** Package approved under assignment generation 3; Admin changes requirement/scope to generation 4. Package and review records have no pinned generation/snapshot proving what approval covered. `blueprint_generation` is independent and cannot cover assignment changes. Pin bounded assignment generation and requirement/scope at submission/review; compare at approval/publication. Define invalidation of pending approved work without mutating approved payload or silently treating it as reviewed for the new scope. No additional table is necessary.

**F05 — Draft removal.** Teacher cannot remove mistakenly added core exercise, vocabulary, audio binding or assessment member: all D denied, even draft children, and none has excluded/retired representation. Swapping contents or setting an exercise optional cannot remove vocabulary/media/assessment membership. Specify editable-parent removal for DRAFT and CHANGES_REQUESTED under assignment/version lock. Options: narrowly delete only unprotected memberships, or retain explicit exclusions with consistent query/validation filters. Keep frozen/published/evidence-referenced content and immutable item versions retained. Do not broaden deletion to attempts/results/completions/audit.

**F06 — Provider cleanup race.** Cleanup checks an unreferenced asset under DB lock, commits, then calls Storage outside locks. In between, Teacher binds/publishes the asset or learner assigns it as avatar; provider deletion removes referenced bytes. Existing `retired_at` is not an attach/publication guard. Atomically reserve retirement under asset lock, requiring no references. Binding, avatar reference and publication must share that lock/check and reject retired assets. Then delete provider bytes outside transaction, retry safely, retain tombstone and never reuse object key. A network request must not run while holding DB locks.

**F07 — Historical curriculum scope.** Moving a lesson or whole Unit from level A1 to A2 in the same framework passes the documented language/framework prohibition. Historical attempts/completions join mutable ancestors, so A1 work becomes A2 progress without approved obligation migration. Generation locks serialize the move but do not authorize its meaning. Preserve course/level ownership once published/referenced; allow ordering within unchanged scope. Guard ancestor course language/framework and Unit course/level mutations too. Broader moves require the separate mapping/relearning approval required by ADR-036. No new product policy is needed to prevent the accidental move.

**F08 — First completion after replacement.** Learner has v1 responses but no completion. Admin publishes v2 with different N/core vocabulary. Current prose explicitly allows pinned v1 work to finish; it creates first completion/enrollment without following active v2. ADR-036 decision 3, requirements availability section and ACT-09 require the uncompleted learner to follow the active replacement. Under the shared course lock, finalization of first logical completion must check active revision/availability before any completion/performance/SRS/day/receipt write. Preserve old open attempt/responses, start a fresh v2 attempt and do not repin v1 responses. If grandfathering is desired, return NEEDS PO DECISION for that exception. Already completed facts and identical retries of committed finalizations remain intact.

**F09 — Per-card/session reinforcement.** Two intentional forgotten SCHEDULE operations A/B for the same card/session each have a valid distinct parent; reinforcement RA/RB satisfy parent UNIQUE and same-owner/card/session checks. The stated constraint does not realize ADR-036's once-per-card/session bound. Add partial UNIQUE(card_id,session_key) WHERE kind='REINFORCEMENT', or an explicitly specified card-locked card/session existence check, retaining parent validation/uniqueness. No new session table. Reinforcement never reschedules or adds a second qualifying day fact.

**F10 — Available default entry.** Configured default level has only PLANNED lessons while another level has AVAILABLE published content. Framework-compatible initialization can select the empty default; ADR-032 decision 4 and ACT-01 require a lowest/default point with available content. Specify availability-aware resolution under course generation lock. Test unavailable configured default with another available level, and zero available levels; the latter shows coming-soon without fabricated proficiency/completion.

**F11 — Pinned assessment scope.** v1/C1 attempt starts; mutable blueprint changes course/framework/purpose/transition for v2. Finalization compares immutable v1 snapshot and current blueprint scope, so previously valid historical pin may fail. Keep blueprint identity/scope stable once published/used, using new blueprint identity for scope changes; or explicitly validate historical scope from the immutable snapshot rather than current blueprint. Config/coverage generation and current curriculum readiness are separate concerns. Test scope change separately from changed current pass configuration and assessment replacement.

**F12 — Controlled coverage metadata.** `topic_X` can appear in blueprint/item coverage, but no named bounded curriculum vocabulary or lesson topic/skill/purpose fields establish whether it is valid/in scope. ADR-030 permits controlled lesson metadata; ADR-036 requires coverage validation. Name versioned finite configuration and constrained revision tags/metadata on existing rows; validate allowed IDs and curriculum membership. No generic taxonomy/QuestionBank/preference engine or extra table is required.

## B. Table-count verdict

**appropriate** · Proposed: **34** · Final recommended: **34**. No mandatory merge/remove/add. Findings concern columns, guards and command responsibilities, not an arbitrary count target. `Unit` is **KEEP**: stable course/level membership, ordering, Admin management and lesson movement within valid scope justify its FK and query value.

| Table | Why persisted? | Could derive/merge? | Required by MVP? | Verdict |
|---|---|---|---|---|
| `accounts` | Fixed role/status and global profile mapped to Auth UUID | Already merges account/profile; credentials stay in Auth | Yes | KEEP; F03 uses separate audit subject |
| `languages` | Stable learnable/UI language identity and configuration | Labels can be JSON; identity cannot derive | Yes | KEEP |
| `frameworks` | Framework/version interpretation of levels | CEFR enum would lose neutrality/version | Yes | KEEP |
| `levels` | Configured ordered levels with FK identity | Derived string label cannot enforce scope | Yes | KEEP |
| `courses` | Shared curriculum/default/gates/generation | Purpose-specific course copies unnecessary | Yes | KEEP; F07/F10 |
| `units` | Stable ordered grouping, Admin management and path FK | Embedded grouping loses manageable identity | Yes | KEEP; F07 |
| `lessons` | Logical identity, availability, active revision | Cannot merge with immutable revisions | Yes | KEEP; F07/F08 |
| `lesson_revisions` | Reviewed/published immutable payload and attribution | Mutable lesson-only storage loses history | Yes | KEEP; F04/F12 |
| `vocabulary_concepts` | Shared language/form/sense SRS identity | Surface text alone false-merges senses | Yes | KEEP |
| `lesson_vocabulary_links` | Per-revision core flag/display snapshot/order | Concept row cannot represent all memberships | Yes | KEEP; F05 |
| `item_identities` | Stable origin/version family/variant provenance | Revision-only merge loses stable identity | Yes | KEEP; clarify duplicate fingerprint column |
| `item_revisions` | Immutable prompt/type and authoring owner | Full package JSON copies lose item provenance | Yes | KEEP |
| `item_grading_secrets` | Keys/rubrics behind distinct grants/DTO boundary | Row RLS cannot hide secret columns | Yes | KEEP |
| `lesson_exercises` | Ordered core membership of pinned item revisions | Item row cannot represent revision-specific order/core | Yes | KEEP; F05 |
| `media_assets` | Immutable provider object/hash/ownership/readiness | Raw URLs cannot enforce lifecycle/security | Yes | KEEP; F06 |
| `media_bindings` | FK-backed asset use in lesson/item revisions | JSON URLs lose reference/cleanup checks | Yes | KEEP; F05/F06 |
| `learning_contexts` | Unique learner/language, start/preferences/progression | Cannot derive mutable learner state from curriculum | Yes | KEEP; F02/F10 |
| `lesson_attempts` | Pinned redo/history/N/K/completed performance | Completion fact cannot represent all attempts | Yes | KEEP; F08 |
| `lesson_responses` | Actual first/retry inputs/contributions/queue/keys | Final answer alone loses N+K provenance | Yes | KEEP |
| `lesson_completions` | One first fact per context/logical lesson | Deriving solely from attempts complicates stable provenance/uniqueness | Yes | KEEP |
| `srs_cards` | One account-wide mutable schedule per Vocabulary | Latest event derivation complicates due queries/locking | Yes | KEEP |
| `srs_review_operations` | Idempotent history and reinforcement identity | Mutable card alone loses retry distinction/evidence | Yes | KEEP; F09 |
| `assessment_blueprints` | Admin-controlled coverage/requirements/config | Teacher version cannot replace independent requirement | Yes | KEEP; F11/F12 |
| `assessment_versions` | Approved immutable snapshot/package lifecycle | Current blueprint cannot reproduce historical grading | Yes | KEEP; F04/F11 |
| `assessment_version_items` | Ordered weighted immutable version membership | Prompt revisions cannot encode package coverage/order | Yes | KEEP; F05 |
| `assessment_attempts` | Context/pinned version/start/submission identity | Result-only row cannot represent incomplete attempt | Yes | KEEP; F11 |
| `assessment_responses` | Private final submission/grading evidence | Public result merge increases secrecy risk | Yes | KEEP |
| `assessment_results` | Immutable completed aggregate/purpose outcome | Open attempt cannot masquerade as completed evidence | Yes | KEEP |
| `content_assignments` | Admin scope and single current Teacher | Revision lifecycle cannot substitute responsibility | Yes | KEEP; F04 |
| `assignment_history` | Durable responsibility changes/scope attribution | Audit parsing is inappropriate for domain queries | Yes | KEEP |
| `revision_reviews` | Repeated submit/review/approval provenance | Current actor columns lose previous review events | Yes | KEEP; F01/F04 |
| `provisioning_requests` | Recover provider/Auth/account split operation | SQL receipt cannot represent partial external progress | Yes, technical recovery | KEEP |
| `command_receipts` | Successful command retry/hash/result identity | Domain-specific keys already used where sufficient | Yes, bounded commands | KEEP |
| `audit_events` | Append-only sensitive action/denial evidence | Domain history lacks security outcomes | Yes | KEEP; F03 |

LearningPlan, Progress, latest/best performance, readiness, curriculum eligibility, workflow worklist and reporting summaries remain derived. No SkillProfile/mastery/knowledge-gap store, role join table, Enrollment or generic workflow engine. Domain provenance columns plus bounded history are purposeful duplication for common queries, not duplicated security-event storage.

## C. Auth/runtime security

Direction is sound: `auth.users.id → accounts.id`; no duplicate password/email credentials; one scalar business role; server-controlled role/status; validated provider subject; fresh account check on each protected request; ACTIVE/PENDING/DISABLED are bounded. Disable denies next request, not instantaneous revocation of an in-flight operation. Actor/target locks and current status recheck define concurrency. Client metadata cannot provision staff.

Provisioning reservation + server-only correlation + exact provider UUID, missing-account fail-closed and reconciliation are necessary; email-only adoption is forbidden. Invitation/correlation API behavior remains unverified and requires disposable integration proof. Auth, app SQL and invitation delivery are multiple transactions; email delivery is not claimed exactly-once. F02/F03 remain open. Eight helper ownership principals do not create additional business roles, but their full command→owner→grant→policy dependency map must be complete (F01/F02).

## D. Data integrity

Natural uniques and composite FKs address context identity, exact attempt membership, assignment target, completion and SRS identity. Max-two ACTIVE contexts is a transaction/account-lock invariant, not a cross-row CHECK. One active lesson pointer belongs to the same lesson; assessment partial UNIQUE gives one active version. Neither SQL UNIQUE nor a trigger substitutes current actor/ownership checks. Cross-table role/framework/gates need named transactions/functions and real FK dependencies.

All history FKs are RESTRICT/NO ACTION; account disable and content withdrawal preserve data. F05 must narrow draft removal while preserving historical children; F07 must prevent reverse ancestor changes invalidating referenced scope. No executable constraint correctness or live grants were tested.

## E. Historical evidence

Positive: immutable version/item/secret snapshots, exact N/K attempt history, first completion provenance, assignment/review records, aggregate assessment results and SRS operations. Redo does not replace first completion. Replacement does not change old results/bytes. F04 lacks evidence of reviewed assignment generation; F07 permits historical level reinterpretation; F08 incorrectly grants a first completion on retired work. Legacy percentage scores cannot fabricate TARGET N/K responses; importer extensions need separately reviewed provenance.

## F. Lesson/Progress

Integer half-units correctly implement `sum(contributions)/(N+K)`; first correct2, retry correct1, wrong0; denominator counts responses. Completion has no score threshold. Required first-wrong retries are processed once after first-response queue. Optional work is excluded from core completion/denominator. Latest completed performance derives from completed attempt order; best is optional derived output.

Progress intersects completion with the same eligible published/AVAILABLE/active-curriculum required set. A progression-locked published required lesson still counts. PLANNED/unpublished/withdrawn content is excluded; zero eligible lessons yields unavailable. Both numerator/denominator change when a completed requirement is withdrawn, while history remains. F07/F08/F10 require correction. Course/level gating is configuration; no A1, Unit1 or universal 100% invariant.

## G. SRS

Language + normalized surface + curated sense identity avoids false homograph merge; teachers search/reuse concepts rather than automatically stem/remap. Curated sense duplication still needs review tooling, not a second dictionary engine. Frozen semantics and revision display snapshots preserve history.

One card per learner+Vocabulary is account-wide, independent of context pause. Initial stage1/+1 day; remembered3/7/14/30/30 days; forgotten1/+1; no-reset enrollment and core completion enrollment share transaction. Same operation retry returns stable history; intentional later review has new key; reinforcement has distinct identity without schedule/streak mutation. F09 must explicitly enforce one reinforcement per card/session across different parent operations.

## H. Assessment

Admin blueprint versus assigned Teacher items, immutable version/item IDs and server-supplied config snapshot are appropriate. Finite JSON schemas require versioned validation, not a generic rules engine. Only PLACEMENT/LEVEL_UP; assessmentType/deliveryMode stay separate. No fixed item counts/pass thresholds or active Reassessment.

Origin + immutable revision fingerprints + shared sorted advisory fingerprint locks protect exact copied practice item exposure, including absent-row races. Collision checks must include ever-published/exposed archived/withdrawn evidence, not only currently active content. Human review remains necessary for semantic variants outside deterministic fingerprint equivalence.

Incomplete/invalid submission has no completed result. Private responses and grading are excluded from aggregate DTOs before and after assessment. Intentional new attempt creates new result; same key/hash retry returns committed aggregate. F11 prevents mutable scope from invalidating pins; F12 makes coverage checks well-defined.

Current curriculum gate is rechecked for Level-up while pass config comes from pinned version. The documented conflict before acceptance when readiness changes is not treated as a proven product contradiction; specify acceptance behavior explicitly. Already accepted results remain immutable. A passed result with unavailable next-level content stays evidence and shows coming-soon. No separate starting-point history table is justified by authority: Level-up leaves selected start untouched; prior Placement results and selection receipts remain.

## I. Content/Assignment/Publication

Logical lesson identity versus immutable payload, separate assignment responsibility, current Teacher/expected version guards and reassignment provenance are sound. No CLOSED assignment state. Unit/Course visibility derives from available lesson publications.

Atomic replacement validates before switching old state/pointer; rollback leaves old active content. Course/blueprint locks plus partial unique/pointer guards prevent committed zero/two active versions. Explicit withdrawal may remove availability. F01/F04/F05 prevent the proposed author/review workflow from being implementable as written; F08 aligns learner replacement with ADR-036. Approval/published bytes never reopen in place.

## J. Media/Audit

Private draft and assessment assets, assignment/attempt-scoped streams and next-request status checks prevent public-bucket bypass. Serving ordinary published content privately is justified by account/availability revocation in this proposal; independent truly public non-sensitive assets could use public access only after explicit classification. No new signed-URL requirement for every public asset. Bounded avatar signed URLs have residual validity and do not promise instantaneous revocation.

F06 closes cleanup versus attach/publish/profile-reference race. Byte replacement uses new object IDs, not upsert. Audit is separate from domain history; success commits with transition, denied/failure append survives rollback via narrow writer. Exclude tokens/passwords/keys/raw answers/unnecessary PII. Admin-only bounded audit reads; retention/purge/anonymization deferred. F03 fixes missing-account subject attribution without weakening fail-closed authorization.

## K. RLS/authorization

Browser direct table access denied; app/app_private unexposed; ordinary Prisma uses non-owner/NOBYPASSRLS login and transaction-local verified subject. Runtime service/owner connections would bypass the intended row protection and are explicitly excluded. RLS and grants are separate; row SELECT does not field-hide keys, so physical secret separation and DTO allowlists remain required. FORCE RLS does not constrain superuser/BYPASSRLS, and custom GUC is a trusted-server boundary rather than protection against compromised DB credentials. [PostgreSQL RLS](https://www.postgresql.org/docs/15/ddl-rowsecurity.html), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Resource-by-resource audit covers profile, configuration, content/items/keys/media, contexts, attempts/responses/completions, cards/reviews, assignment/review, blueprint/version, assessment responses/results, provision/receipts/audit. Intended denied actions: learner role/score/completion/due-date writes; draft/key fetch; Teacher unassigned edit/self-approval/publish/other-Teacher scope; Admin evidence modification; duplicate network finalize/review writes. Private helper policies need independent authorization and narrow EXECUTE; F01/F02 expose incomplete capability dependencies. No actual RLS pass is claimed.

## L. Transactions/idempotency/concurrency

Named boundaries cover lesson finalization+performance+completion+core SRS/day/receipt; SRS history+schedule; assessment response+result+progression; publication+old replacement; provisioning recovery across providers. Global lock ordering, expected versions, natural uniques and bounded retries are preferable to distributed locks. Shared fingerprint advisory lock protects absent collisions.

F04 adds reviewed-scope pin; F06 adds two-phase provider retirement; F08 makes course-lock ordering determine replacement/finalization eligibility; F09 adds card/session bound. Dedupe must run before current queue/pointer/gate rejection for a previously committed valid operation, after identity/ownership/status authorization. Test repeated old key after subsequent answer/progression/publication. New intentional action must not be collapsed into a retry.

### Acceptance scenarios that must be added/refined

Existing 44 scenarios are a useful future plan, **NOT EXECUTED**, but do not cover all counterexamples.

| Scenario | Positive/negative/retry/concurrency expectation |
|---|---|
| Teacher SUBMIT capability (F01) | Own editable complete draft submits/freezes; other Teacher/Admin authoring/stale version fail; duplicate submit does not duplicate provenance |
| First context locks (F02) | First eligible context succeeds without preexisting row; foreign/disabled/config-invalid rejects; two creates/resumes honor max2 and course-generation order |
| Missing-account audit (F03) | Verified subject is denied domain access but sanitized denial remains recorded without invalid account FK |
| Assignment generations (F04) | Same reviewed scope publishes; scope change after submit/approve blocks stale publication; old review evidence remains |
| Draft removal (F05) | Remove exercise/vocabulary/media/assessment membership in both editable states; frozen/evidence-referenced removal denied; concurrent save/submit conflicts |
| Cleanup race (F06) | Cleanup vs bind/publish/avatar reference yields one valid winner; no referenced object deletion; provider timeout retry retains retirement reservation |
| Historical scope (F07) | Same-scope reorder allowed; referenced course/level/Unit scope mutation rejected through direct and ancestor edits; old progress classification stable |
| Replacement first completion (F08) | Completion before replacement remains; replacement before first finalize blocks old attempt, retains responses and creates no summary/card/day/receipt; fresh active attempt works |
| Reinforcement (F09) | Two distinct forgotten parents same card/session still yield one reinforcement; forged/foreign session rejects; no schedule rewind or additional day |
| Default availability (F10) | Unavailable configured default resolves eligible available entry; zero available is coming-soon; course update racing initialization is serialized |
| Blueprint scope (F11) | Historical pinned version finalizes after config/new-version changes; identity/scope mutation follows explicit guard; no repin or grading drift |
| Coverage metadata (F12) | Valid configured tags pass; invented/out-of-course/removed-version tags reject; snapshot remains reproducible |
| Retry after later state | Same response key after next response/finalize and same assessment submission after progression return committed result; changed payload conflicts |
| Concurrent distinct completions/enrollment | Two attempts for one lesson create one first fact; same concept across contexts creates one unchanged card |
| History/current progress | Withdraw completed requirement updates numerator/denominator together; publish v2 without redo preserves v1 performance and completion |
| Existing fingerprint exposure | Archived/withdrawn ever-exposed practice cannot become secure assessment under new UUID; current-status filter cannot erase exposure |

## M. Index/query review

Natural unique indexes already serve course path, logical completion, item/revision membership and one active assessment. Do not duplicate them. Due SRS `(learner_id,due_at,id)`, latest completed performance `(context_id,lesson_id,completed_at DESC,id DESC)`, Teacher worklist and partial review queues map to actual queries. Prefixes must match ownership filtering and keyset order.

Audit pagination orders by time and stable ID, so implementation planning should include ID tie-breakers in candidate indexes and DTO cursors. `assessment_version_items(version,position)` is shorthand; actual column is `assessment_version_id`. Revision FK/reference checks and published-active candidate selection need query plans later; no speculative index on every FK/JSON. Immutable `item_revisions.exact_fingerprint` is authoritative; define/remove redundant mutable identity fingerprint and avoid duplicate speculative collision indexes. No performance benchmark or scalability claim. Measure EXPLAIN/cardinality on disposable realistic fixtures.

## N. Logical → physical consistency

| Logical concept | Physical representation | Verdict |
|---|---|---|
| User/Profile/AccountRecord | accounts + Auth identity | Compatible; F03 audit subject gap |
| Language/framework/Level/Course/LogicalUnit | languages/frameworks/levels/courses/units | Compatible; F07/F10 scope/default guards |
| LearningContext/ContextRecord | learning_contexts | Compatible ownership; F02 first-create dependency |
| LearningPurpose/preferences | simple context purpose/preferences | Compatible; no generic engine |
| LearningPlan/LearningPlanItems | derived configured ordered lessons and context/progress | No persistence required; F12 metadata incomplete |
| Progress/readiness/eligibility | eligible set and completion intersection + gates | Derived; no summary table; F07 |
| Lesson/RevisionRecord/ContentRevision | lessons + lesson_revisions | Identity/history sound; F04/F08 |
| Exercise/ExerciseRecord/protected grading | item identities/revisions/secrets + lesson membership | Compatible boundary; F01/F05 workflow gap |
| Vocabulary/LessonVocabularyLink | vocabulary concepts + revision display links | Compatible account-wide identity; F05 removal |
| LessonAttempt/ExerciseResponse | attempts + bounded first/retry response rows | Correct N/K/half-unit provenance; F08 eligibility |
| CompletionRecord | unique context/logical lesson first attempt fact | Redo/history sound; F08 finalization guard |
| Latest/best performance | derived completed attempts | Compatible; no summary persistence |
| SrsCard/SrsOperation | cards + operation rows | Compatible; F09 per-card/session bound |
| Blueprint/Version/VersionItem | blueprints/versions/members + immutable items | Compatible separation; F04/F11/F12 |
| AssessmentAttempt/Result | attempts/private responses/aggregate results | Compatible secrecy/pinning; F11 scope |
| Assignment/AssignmentHistory | assignment + history | No CLOSED/engine; F04 generation proof |
| Submit/review attribution | actor columns + revision_reviews | Domain provenance separate from audit; F01/F04 |
| Media references | assets + typed bindings/private provider objects | Necessary physical realization; F05/F06 |
| Global streak | distinct local dates from completed attempts + scheduled SRS | Derived; stored historical day/timezone justified |
| SecurityAuditRecord/Event | append-only audit_events | Compatible policy; F03 missing account |
| Provision/retry support | provisioning_requests/command_receipts | Explained technical recovery; no logical product subsystem added |

No approved logical concept is intentionally removed; F12 is an incomplete physical mapping. No unexplained AI, mastery, generic workflow, QuestionBank or multi-role subsystem appears.

### ERD/dependency audit

All four source views and rendered PNGs individually inspected: identity 1192×655, content 869×760, learning 894×1319, assessment 1361×499. Readable at full size, no clipping; PK/FK/nullability/uniques match summarized catalog; every actual table appears once and reference boxes reuse identities. Optional secret row in drafts is compatible with required ready-key validation at submit/publish. Optional result on an attempt does not imply result for incomplete work. Auxiliary FK lines omitted explicitly by legend remain required in typed catalog. The learning view includes governance/technical boxes but stays readable. All captions retain **PROPOSED PHYSICAL DESIGN — NOT IMPLEMENTED**.

34-table graph is feasible without mandatory circular insertion: seed languages/frameworks/levels; create account with null avatar; course/default→Unit→PLANNED lesson; assignment→empty draft→members; add nullable active pointer after revision readiness. Blueprint→assignment→draft version→owned items is ordered. Context can exist with null start_result before assessment; selected result then refers to its owned context. Self prior-revision/variant/history and nullable media pointers are added after independent IDs exist. Future migration SQL must create cyclic FKs after tables and test deferred publication guard at commit; ORM declaration order alone is not proof. F07/F11 reverse scope guards remain necessary.

## O. Clean rebuild verdict

**CLEAN REBUILD RECOMMENDED**

Recommend a fresh/disposable environment first. Repo legacy divergence is material: 18 Prisma models/six roles versus 17 initial SQL tables/two roles, absent TARGET contexts/immutable attempts/assessment packages and unsafe legacy SRS authority. Preserving that inconsistent shape through numerous backfills has no demonstrated benefit at this project stage. This is a conditional design recommendation, not an assertion that live data is disposable.

Original migration files/checksums/history remain immutable. Future execution plan must choose an explicitly separate executable migration root/configuration for new baseline; merely adding baseline beside old Prisma migrations may replay old public tables/Auth trigger/RPC/policies. New environment has accurate new history, existing environment has its own reviewed cutover/import procedure. Valuable/unmappable live evidence or infeasible rollback can change the execution choice to forward/parallel migration.

## P. Live DB requirement

**LIVE DB UNVERIFIED.** This review did not connect, inspect catalogs/data or repeat credentials probing. Design approval can proceed without live DB after physical findings are closed; the current rejection is based on source design defects, not missing live data.

Destructive execution remains blocked until exact project/environment is bound; dated read-only table/constraint/index/migration/grant/RLS/RPC/role/schema/bucket inventory; owner-approved must-preserve/nice/disposable/unknown classification; backup plus isolated restore/object-hash proof; preserved identity/history mapping and ambiguous-role decisions; rollback/delta preservation/cutover approval. No reset against unknown data. Metadata access gaps remain unverified. Fresh implementation must also satisfy ADR-035's live reconciliation gate before production migration.

## Q. Corrections made

**No physical schema/security/runtime correction applied in this review.** Findings require coordinated capability/guard/representation changes and a complete physical correction/recheck. Section 53 allows reviewer correction but does not require silently choosing between viable physical strategies. The independent review is complete with explicit counterexamples/minimal correction directions; it does not approve a partly patched package.

Changes are limited to this review/evidence, task approval/request/baseline/archive/index records, final-review status pointers and append-only logs. Prior approved logical sources, physical definitions/ERD source/renders, historical review/verifier outputs, app/Prisma/migration/seed/dependencies and Git index/HEAD are preserved. Concurrent draw.io packaging changes are separately observed, not attributed to this task.

## R. Remaining non-blocking notes

- Bind real restricted connection/pooler/exposure/definer grants in the later environment test; owner-connected tests do not prove RLS.
- Test provider correlation/invitation/reconciliation in a disposable project before committing to its SDK/API mechanics; do not assume unsupported marker semantics.
- Specify finite JSON validation versions for content/config/snapshot/tags and server-generated fingerprint canonicalization. No giant untyped JSON or table per block.
- Keep current-gate versus pinned-pass semantics, immutable historical local-day timezone and retry-after-state-change expectations explicit in the approved plan.
- Include audit ID ordering and clarify/remove identity-level fingerprint duplication after real query design. No table-count cut is justified.
- UC-14 reports should derive only authorized aggregate operational views; no reporting summary persistence or broad Admin learner-evidence SELECT follows from the catalog.
- Retention/anonymization is deferred; no purge job/period or additional product policy is approved.

Observed checks and their limitations are in [final review verification](final-review-evidence/verification.md). Historical baseline failures are retained verbatim; current scope preservation is checked against this task's own baseline plus exact concurrent observations.

## S. Implementation readiness

**NOT READY FOR IMPLEMENTATION PLANNING**

Next permitted work is a separately recorded bounded **physical correction plan and independent recheck of F01–F12**. No new product decision is necessary for the identified gaps; any requested lesson grandfathering/obligation migration exception needs PO decision. Only after a clean final physical verdict may the separate **IMPLEMENTATION MASTER PLAN + DATABASE REBUILD EXECUTION PLAN** be prepared and reviewed. No Prisma, API/UI, migrations, seed/reset/deploy, stage or commit follows from this review.

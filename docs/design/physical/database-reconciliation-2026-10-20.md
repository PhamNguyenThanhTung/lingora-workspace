# Database reconciliation — 2026-10-20

**Status:** Reconciliation COMPLETE; independent documentation review PASS after one correction round. Physical design remains PROPOSED. Product assembly ownership is ACCEPTED in ADR-043. Physical mechanisms are reviewable proposals, not installed schema or physical approval.

**Authorization:** PO requested “database đã có chưa chưa có thì bắt đầu làm đi”, then chose “Hệ thống ghép các gói câu hỏi Teacher đã nộp theo blueprint, Admin chỉ duyệt/xuất bản”. This task completes database-design reconciliation; it does not execute migrations or inspect a live database.

## What exists

| Layer | Observed state | Meaning |
|---|---|---|
| Repository Prisma | 18 models | Legacy implementation; role model differs from current three-role authority |
| Repository SQL | Three migration files | Historical two-role SQL; not a migration path approved for the redesign |
| Retained physical proposal | 34 application tables, four ERD views | Reconciled here; no new subsystem/table needed |
| Live database | UNVERIFIED; no connection attempted | Neither existence of deployed redesign tables nor installed RLS is established |

[Entry inventory](evidence/2026-10-20-database-design/inventory.json) records paths and hashes. No credentials or live records were read. Current topic authority is ADR-030–036/041–043, UC-09–12 and the accepted [Class review](../../modeling/current-target/class-review-2026-10-16.md). Existing SQL and older physical verdicts establish history only. The [catalog](README.md) defines the revised columns; [security](security-and-rls.md) applies the revised authorization; the four-view [ERD](physical-erd.puml) depicts them. This report controls the 2026-10-20 reconciliation delta if an older dated physical review/test describes the superseded structure.

## Domain coverage

All 22 accepted classes and StudyFocus are accounted for. Supporting physical tables represent evidence/security, not new business classes.

| Accepted class / enum | Representation | Important boundary |
|---|---|---|
| User, Profile | accounts + provider auth.users | One fixed role; provider owns credentials/email; profile fields in accounts, streak derived |
| LearningContext, StudyFocus | learning_contexts.study_focus and bounded study_preferences | At most two ACTIVE; preferences never override evidence or curriculum gates |
| Language | languages | Learnable language separate from UI locale |
| ProficiencyFramework, Level | frameworks, levels | Scoped/versioned framework; no fixed CEFR enum |
| Course, Unit | courses, units | Unit.code retained; no extra publication lifecycle |
| Lesson, ContentRevision | lessons, lesson_revisions | Logical identity, same-Lesson prior revision, change_summary and immutable author/creation episode |
| Vocabulary | vocabulary_concepts, lesson_vocabulary_links | part_of_speech/example optional; core/optional and display snapshot per completed revision |
| Exercise | item_identities, item_revisions, lesson_exercises, private item_grading_secrets | Practice origin, revision-bound membership and grading secrecy |
| Assignment | content_assignments + assignment_history | Stable Lesson container; ordered immutable episode snapshots, one current Teacher |
| SecurityAuditEvent | private audit_events | SYSTEM assembly distinct from accountable human review |
| AssessmentBlueprint | assessment_blueprints | Admin scope/configuration; not a separate Teacher assignment target |
| AssessmentBlueprintVersion | assessment_versions + assessment_version_items | System-assembled immutable definition, configuration and item membership |
| AssessmentItem | item_identities + item_revisions + version membership + private secrets | Authored in Lesson package; contribution records exact submission and authoring episode |
| AssessmentResult | assessment_attempts, private assessment_responses, assessment_results | Pin version before result; incomplete attempt has no result |
| LessonAttempt | lesson_attempts, lesson_responses, lesson_completions | Completed performance distinct from first logical completion |
| LearningPlan, Progress | Queries over curriculum, contexts and completion facts | Derived, no persisted editable plan/percentage |
| SrsCard | srs_cards, srs_review_operations | Account-wide vocabulary identity; unchanged Policy B/idempotency |

Media tables bind private immutable bytes; provisioning_requests and command_receipts support bounded technical recovery. They do not add product workflows.

## Corrections to the inherited proposal

### Assignment and authorship

`content_assignments.lesson_id` is required and unique. Remove the blueprint target and XOR target rule. An assignment includes the Lesson package and its related practice/assessment items. The stable row is a physical container, not the logical episode itself.

Each `assignment_history` row records the resulting Teacher, requirements/scope generation, actor and server time. Ordered next-row time supplies the previous episode's end; the latest row is the current responsibility. `(assignment_id, sequence_no)` is unique; `(id, assignment_id)` supports matching FKs. Reassignment appends rather than replacing history. Scope changes append a new immutable snapshot even if Teacher is unchanged. No CLOSED/COMPLETED assignment state.

`lesson_revisions` and `item_revisions` pin immutable `created_by` and `creation_assignment_episode_id`; the episode must belong to the revision's Lesson assignment and name the creating Teacher at creation. Creation attribution never follows mutable current_teacher_id. A new assignee can create a successor revision with their own attribution; former authors retain their prior attribution without retaining access. Every Teacher submission pins the applicable episode, generation and bounded scope snapshot in `revision_reviews`.

Reassignment alone does not rewrite or invalidate submitted authorship. A requirement/scope generation change makes an old approval ineligible for publication until a new conforming package/version is submitted and reviewed. Rights to edit/preview/respond to feedback follow the current assignment; publication compares requirement/scope generations, not equality between the original author and current assignee.

### Submitted question packages and assembly

Both item origins have exactly one immutable `authoring_lesson_revision_id`. ASSESSMENT items additionally name the relevant `assessment_blueprint_id` and `blueprint_generation`; PRACTICE items have neither. An assessment item is authored before an assembled version exists. Remove `authoring_assessment_version_id`. Readiness validates that the assignment's Lesson is in the blueprint curriculum scope, tags satisfy its catalog/requirements, grading/media are complete and the item has never been exposed as exact answer-revealing practice. No generic question bank or cross-origin reuse is introduced.

Teacher submits the assigned Lesson/content revision, including its assessment contributions. Submission permanently freezes its payload, source item revisions, keys and bindings; feedback produces a successor editable revision. CHANGES_REQUESTED may carry feedback on the frozen submitted row, but never reopens its bytes. Fresh drafts/changes-requested successors reference prior_revision_id. This technical copy-on-edit rule preserves reproducible contribution snapshots while supporting UC-11 resubmission.

The system first resolves the effective submitted revision for each covered Lesson: the greatest revision_no among all its submitted revisions. Each submitted Lesson package is a complete replacement snapshot of its contributions, across its applicable blueprint scopes; omissions contribute nothing and never implicitly retain an older source. The assembler then selects items declaring the requested blueprint identity/generation from that effective revision. Submission is atomic and each revision submits once, so revision_no gives an unambiguous successor order. An unsubmitted draft never supersedes a valid submission. A newer submitted revision supersedes all older contributions from that Lesson, including unchanged questions copied into its new immutable ownership; the assembler never mixes old and new sources for the same Lesson/scope. If that effective revision is rejected/withdrawn or its requirement generation is stale, report an unmet requirement rather than falling back to an older revision. Scope remains limited to the blueprint named by each item; no generic item bank is created.

The system then excludes source item revisions named by any retained assessment REQUEST_CHANGES feedback. Nonempty feedback_item_ids expands through that reviewed version's membership to the exact rejected source items; an empty list expands to every member/source item of that version. Rejection exclusion remains effective for that immutable source item even if its Lesson status otherwise permits use. Correction uses new item revisions and a successor submitted Lesson source. Review history is never deleted to make a rejected item eligible again. The resulting effective, non-rejected sources must be complete and match current requirement/scope and blueprint generations. Only after these filters does stable ID ordering break otherwise equal choices satisfying configured counts/distributions/coverage. No SRS/StudyFocus/current learner answers influence composition. Incomplete/contradictory configuration or insufficient eligible inputs produces no reviewable version, partial publication or silent threshold reduction; unmet requirements are derived for Admin.

Assembly commits one `assessment_versions` row with IN_REVIEW status, its complete immutable blueprint/config snapshot, all immutable version members and SYSTEM audit in one transaction. `assembled_at` and `assembly_input_hash` identify the operation. A unique `(blueprint_id, blueprint_generation, assembly_input_hash)` deduplicates retries over identical canonical source submission/item IDs, their content hashes, ordering/weights and blueprint snapshot. A changed input produces a new version. Concurrent assembly serializes on the blueprint. No fake Teacher submitter, Admin creator or artificial system account is used.

Each `assessment_version_items` row pins `source_lesson_revision_id`, `source_submission_id` (a Teacher SUBMIT event) and `contribution_assignment_episode_id`, alongside the exact item revision, item identity, coverage and weight. Composite FKs/guards bind the submit event to that revision/episode, and item authoring owner to the source revision. Immutable source history supplies submitting Teacher/scope; immutable item provenance supplies creating Teacher/episode. These may legitimately differ after reassignment. A UUID alone never proves valid provenance.

### Review, corrections and publication

Admin reviews the assembled IN_REVIEW version, requests changes with feedback, approves, then publishes. Admin cannot write/reorder/remove version members, author questions or bypass assembly. Teacher cannot create/submit an assembled version. All version payload/membership freezes at assembly, including versions later marked CHANGES_REQUESTED. Revision-review status fields remain mutable only through checked lifecycle commands.

For assessment feedback, `revision_reviews` targets the version; bounded `feedback_item_ids` names affected membership IDs from that same version. An empty list means version-wide feedback and expands to all contributing source Lessons/items for both eligibility exclusion and worklist routing. The worklist resolves that expanded set through each source Lesson assignment to its current Teacher. It exposes only that Teacher's relevant contribution/feedback, never other Teachers' questions. Teachers correct successor Lesson/item revisions and submit again; effective-source selection excludes the older/rejected inputs and the system assembles a successor version for Admin review. New submission IDs/revision hashes change assembly_input_hash, so deduplication cannot replay a returned version as a successful corrected submission. Old feedback, authorship and learner pins remain intact.

For a lesson owner, review rows require assignment episode/generation/snapshot; for an assessment owner these are null and `blueprint_generation` is required. Teacher SUBMIT is legal only for a Lesson revision. Admin review events have real account actors. System assembly uses audit actor_kind SYSTEM and version assembled_at, not a fabricated SUBMIT event.

Approval/publication validates the exact assembled snapshot and all referenced submitted sources against current requirement/scope and blueprint generations, effective-source selection and feedback exclusions under shared locks. Explicit rejection/withdrawal or supersession of a source contribution before publication blocks publication; copying old pointers cannot restore eligibility. Request-changes and assembly lock the same course/blueprint/source rows, so rejection cannot race past input validation. Reassignment alone keeps immutable prior submission provenance. Active-version replacement is atomic; failure preserves the existing published version. Later changes never alter a previously pinned learner attempt or historical grade. Existing published-version withdrawal behavior is retained; this task introduces no new learner cancellation policy.

### Small mapping omissions

Add `units.code text` (nonblank; no invented global uniqueness), `lesson_revisions.change_summary text?`, and `vocabulary_concepts.part_of_speech text? / example text?`. Define revision display_snapshot keys for form, meaning, pronunciation, part_of_speech and example so later vocabulary edits cannot alter completed revision content. prior_revision_id must name the same Lesson and an earlier revision; cycles/self-reference are rejected.

`learning_contexts.working_level_id` is a rebuildable transactional projection of the accepted starting point, valid Level-up evidence and current curriculum policy. It is not an independently editable level. Optional study_preferences is a bounded object; `{}` represents absence. Profile.nativeLanguage already maps to accounts.native_language_id.

## Security and transaction obligations

Retain unexposed app/app_private, non-owner NOBYPASSRLS runtime, FORCE RLS, split grading secrets/private response evidence, no generic DELETE and fresh verified account status. These are proposals, not deployed claims. The security addendum replaces old standalone-assessment assignment/Teacher version-write paths.

The non-login assembly writer has only the source read and version/member insert/lock privileges required by the checked system assembly command, plus SYSTEM audit append. Runtime is not a member and cannot SET ROLE. Calling assembly from an Admin/Teacher request never grants that actor composition privileges: the trusted service independently discovers eligible inputs and validates every source. No caller-supplied member list, forged actor kind or unrestricted secret SELECT is accepted. Assembly reads secret readiness/fingerprint facts through a narrow checker, not learner-returnable grading keys. Administrative review reads the whole version through its separate exact-version checked projection.

Governance lock order: verified actor when present, course, blueprint(s) sorted UUID, assignment containers sorted UUID, Lesson revisions/items sorted UUID, then assets sorted UUID. System assembly has no business actor account lock. Source edits/submission/reassignment/scope changes and publish share relevant parent locks; multi-source publish checks every pinned generation before writing. Assignment operations without blueprint access never acquire blueprint locks afterwards. The implementation spec must realize this order, grants, cross-table guards and failure rollback tests before any migration can be accepted.

Useful indexes reuse existing tables: item_revisions(assessment_blueprint_id, blueprint_generation, authoring_lesson_revision_id), assignment_history(assignment_id, sequence_no) UNIQUE, revision_reviews(lesson_revision_id, occurred_at, id), version members(source_submission_id), and assessment_versions(assembled_at, id) WHERE status='IN_REVIEW'. Keep one active published version per blueprint and all existing attempt/result/receipt uniqueness.

## Acceptance matrix

These are future runtime acceptance cases, **NOT EXECUTED** by this documentation task. Static design/diagram checks and independent review are recorded separately in the dated evidence and test log.

| ID | Scenario and required result |
|---|---|
| DB43-01 | Two Teachers submit contributions for different Lessons in one blueprint: one complete system version; both authors/creation and submission episodes queryable |
| DB43-02 | Missing count/coverage, missing key/media, wrong language/course/generation or invalid tags: no partial version or review-queue entry |
| DB43-03 | Teacher/client/Admin attempts direct version member create/edit/delete or fabricated whole-version SUBMIT: denied; Admin can review/approve/publish valid assembled version |
| DB43-04 | Exact practice-exposed item or cross-origin copy: rejected; distinct eligible assessment variant remains possible |
| DB43-05 | Identical assembly retry/race: same version, no duplicated members/audit; changed input: new version |
| DB43-06 | Reassign A→B before edit/submit: A denied; B successor preserves A creation history and records B submission/creation as applicable |
| DB43-07 | Reassignment after valid submission alone preserves provenance; subsequent requirement/scope generation change blocks stale approval/publication |
| DB43-08 | Admin returns a source item whose old stable ID sorts before its corrected successor: effective-source/rejection filtering selects the new submitted source, never old input or the CHANGES_REQUESTED version; own current Teacher gets feedback, other Teacher cannot read full exam. Empty feedback IDs expands to all contributing Lessons/items, routes each current Teacher's own feedback and excludes all rejected inputs until fresh successors are submitted |
| DB43-09 | Attempt starts at V1, V2 later published: attempt/responses/result remain V1; incomplete attempt has no result; learner sees aggregate output only |
| DB43-10 | Source request-changes/withdrawal races with publish: shared locks force valid serial outcome; failed publish preserves active version and no partial approval/audit |
| DB43-11 | Missing/disabled account, forged role/subject/SYSTEM context and ordinary runtime connection: deny unauthorized assembly/secret access; helper principals cannot be assumed |
| DB43-12 | Every item belongs to its source Lesson revision and submission episode; mismatched FK/provenance rejected; same-Lesson prior revision cannot cycle |
| DB43-13 | Vocabulary display snapshot and Unit.code/change_summary round trip; new occurrence does not reset account-wide SRS; working-level rebuild matches valid evidence |

## Deliverable boundary

[Independent review](evidence/2026-10-20-database-design/review.md) records the rejected-source selection finding and its accepted correction. Scoped static checks verify the 34-table catalog/detail/ERD inventory, four view endpoints/aliases, eight renders with PNG/source parity, local links and preservation of 18-model legacy schema, three migrations, accepted DOM and native 44-page bundle. Existing logical artifact integrity also passes. One broken link in historical docs/04-data-model.md prose predates task entry and is retained; no new broken link is introduced. Observed commands/results and environment are in logs/test-log.md, T-DATABASE-DESIGN-043.

This reconciliation corrects the physical catalog/security/ERD and records ADR-043 plus UC/requirement/trace updates. It preserves legacy schema/migrations and the accepted 44-page logical diagram bundle. Older Sequence/DATA/state/deployment views still require their separately tracked reconciliation; ADR-043 takes precedence on assembly ownership. No old diagram is silently presented as newly reviewed.

A subsequent implementation task can draft concrete Prisma/SQL/RLS work only after physical review resolves its findings and the relevant design boundary is approved. Live inventory, preservation/restore and cutover are separate gates before any destructive rebuild; CLEAN REBUILD is not selected by this report. Existing dated physical reviews and future test cases remain historical evidence within their original scope.

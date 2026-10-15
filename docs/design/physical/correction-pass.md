# Physical Design Correction Pass — F01–F12

> **PROPOSED PHYSICAL DESIGN — NOT IMPLEMENTED** · 2026-10-11  
> Correction scope is complete; the independent closure check is recorded separately. This report is not physical-design approval, implementation authorization, or evidence of live database behavior. LIVE DB UNVERIFIED.

Controlling finding source: [original final physical review](final-review.md). Corrected proposal: [physical catalog/runtime](README.md), [security/RLS and command matrix](security-and-rls.md), [ERD source](physical-erd.puml), and [future rebuild/acceptance plan](rebuild-plan.md). The direct bounded documentation-only request and immutable scope are preserved in [the exact request](../../../plans/approved/2026-10-11-physical-design-correction-pass-REQUEST.txt) and [approved correction snapshot](../../../plans/approved/2026-10-11-physical-design-correction-pass-APPROVED.md). Technical choices remain proposed pending the separate final recheck.

## A. Finding closure matrix

“CLOSED” here means the proposed correction and evidence are now present for independent review. It does not mean the design is approved or implemented. The independent reviewer’s separate verdict controls whether this task can stop at READY FOR FINAL RECHECK.

| Finding | Priority | Correction recorded | Evidence | Result |
|---|---|---|---|---|
| F01 | P1 | Checked narrow Teacher submit operation; current assignee/target, editable state, readiness, expected row version and assignment pin; Admin-only approval/publication remain separate | [Teacher submit definition](README.md#e-curriculumcontentrevision-design); [capability grants](security-and-rls.md#principals-for-narrow-functions-under-force-rls); PD-F01-TEACHER-SUBMIT / PD-F01-UNASSIGNED-DENIED | CLOSED |
| F02 | P1 | First-context branch needs no existing row; own-context SELECT is explicit; actor/course lock and max-two ACTIVE count serialize creation | [context schema/transaction](README.md#identity-and-curriculum); [learner writer and lock branch](security-and-rls.md#principals-for-narrow-functions-under-force-rls); PD-F02-FIRST-CONTEXT / PD-F02-CONTEXT-CAPACITY-RACE | CLOSED |
| F03 | P2 | Audit distinguishes ACCOUNT, VERIFIED_AUTH_SUBJECT and SYSTEM; verified missing-account UUID is retained without a phantom account | [audit actor shape](README.md#assessment-and-bounded-infrastructure); [audit writer](security-and-rls.md#principals-for-narrow-functions-under-force-rls); PD-F03-MISSING-ACCOUNT-AUDIT | CLOSED |
| F04 | P2 | Assignment scope generation and bounded versioned scope snapshot are pinned at submit/review; stale approval cannot publish after scope change | [assignment/review records](README.md#content-items-media-and-governance); [workflow pin comparison](security-and-rls.md#command-capability-matrix); PD-F04-CURRICULUM-ASSIGNMENT-HISTORY | CLOSED |
| F05 | P1 | Checked Teacher command deletes only supported draft association rows under current assignment/state/version; published/history/evidence identities remain retained | [membership definitions](README.md#content-items-media-and-governance); [restricted delete grant](security-and-rls.md#principals-for-narrow-functions-under-force-rls); PD-F05-REMOVE-DRAFT-MEMBER | CLOSED |
| F06 | P1 | `retired_at` is a locked retirement reservation/tombstone; every acquisition and publish path shares the lock; final reference check precedes provider delete outside transaction | [asset rules](README.md#content-items-media-and-governance); [media cleanup capability](security-and-rls.md#command-capability-matrix); PD-F06-CLEANUP-PUBLISH-RACE | CLOSED |
| F07 | P1 | Language/framework/course, level/framework, Unit course/level and Lesson Unit ownership freeze once referenced; same-scope position-only reorder remains allowed | [curriculum ownership rules](README.md#identity-and-curriculum); PD-F04-CURRICULUM-ASSIGNMENT-HISTORY | CLOSED |
| F08 | P1 | New first logical completion requires the pinned attempt revision to remain active and AVAILABLE under the shared course lock; dedupe of committed retries precedes pointer freshness | [completion guard](README.md#f-lesson-attempt--completion--performance-design); [LESSON_COMPLETE path](security-and-rls.md#command-capability-matrix); PD-F08-OLD-OPEN-ATTEMPT / PD-F08-REPLACEMENT-COMPLETION-RACE | CLOSED |
| F09 | P2 | Independent partial unique keys bound one SCHEDULE and one REINFORCEMENT per card/session; parent uniqueness remains and reinforcement never reschedules | [SRS operation constraints](README.md#learner-evidence-and-srs); PD-F09-DUPLICATE-REINFORCEMENT-RETRY / PD-F09-CARD-SESSION-UNIQUE-RACE | CLOSED |
| F10 | P2 | In line with approved ACT-01, default selects the lowest-position level with eligible published AVAILABLE content; a higher configured default cannot override it; zero available levels yields a valid uninitialized context/coming-soon | [course/context resolution](README.md#identity-and-curriculum); PD-F10-AVAILABILITY-AWARE-DEFAULT | CLOSED |
| F11 | P2 | Blueprint identity/scope freezes once submitted or used; non-scope config versions into a new snapshot; historical attempt uses pinned snapshot while current curriculum gate stays separate | [blueprint/version/attempt definitions](README.md#assessment-and-bounded-infrastructure); PD-F11-BLUEPRINT-CONFIG-AFTER-PUBLISH / PD-F11-VERSION-COVERAGE-SNAPSHOT | CLOSED |
| F12 | P2 | Finite course-scoped versioned `coverage_catalog`; existing lesson/version rows carry validated topic/skill tags and immutable label snapshots; valid tags pass, invented/out-of-scope/retired/uncovered tags reject; only PLACEMENT/LEVEL_UP; no taxonomy subsystem/table | [course catalog](README.md#identity-and-curriculum); [version-item tags](README.md#assessment-and-bounded-infrastructure); PD-F12-COVERAGE-TAGS-VALIDATION | CLOSED |

## B. Table-count result

The proposed inventory remains **34 tables: 0 added, 0 removed, 34 retained**. Corrections alter constraints, fields, query/command responsibilities and ERD annotations only. `coverage_catalog`, bounded scope snapshots and topic/skill tags are JSON/array values on existing rows; they do not introduce a taxonomy, session, event-sourcing or workflow-engine table.

## C–D. Security and runtime capabilities

The revised [resource/RLS matrix](security-and-rls.md#resource-authorization-matrix) keeps browser S/I/U/D denied and generic table DELETE denied. It adds only a named, checked draft-association removal command. The [command capability matrix](security-and-rls.md#command-capability-matrix) now names actor, trusted-server validation, ownership/scope predicate, DB/RLS dependency and transaction boundary for context creation, lesson/assessment/SRS operations, Teacher edit/remove/submit, Admin lifecycle actions and media cleanup.

The Teacher submit capability writes only submission state/provenance under the current assignment and exact target; Teacher has no approval or publication capability. First context creation validates ACTIVE learner/course configuration without an existing-context predicate, while existing-context reads use explicit owner SELECT. The proposed database service-role remains outside ordinary domain queries. Even if a future trusted connection bypasses RLS, server authorization and DTO projection remain mandatory. All security language is proposed and unverified against a live runtime.

## E–F. Provenance, curriculum scope and assessment coverage

Assignment scope changes increment `scope_generation` and append a history snapshot. Submission and review preserve the exact generation plus a bounded JSON object with `schema_version`, target, requirement and scope. Approval/publication recheck both pins; old approval is immutable but unpublishable after a scope change. Scope-changing blueprint edits after submit/use require a new blueprint identity. Non-scope configuration can produce a new immutable version.

Referenced curriculum ownership cannot be repointed: course language/framework, level framework/code identity, Unit course/level and Lesson Unit. Ordering can change only within the same scope and under the course generation lock. Coverage uses finite stable topic/skill IDs in a versioned course catalog. Lesson revisions and assessment version items record validated IDs and snapshot labels/generation; IDs must be in blueprint scope and covered curriculum membership. Purpose is limited to PLACEMENT/LEVEL_UP. No hard-coded A1, universal 100% readiness, or fixed assessment item count is an invariant.

## G–H. Lesson completion and SRS

An open old attempt and its responses remain intact after replacement. A first logical completion takes the shared course lock and checks the pinned revision is still active and AVAILABLE before any performance, completion, SRS enrollment, qualifying-day or receipt write. If replacement wins, no partial evidence is created and a fresh attempt uses the active revision. If finalization wins, its valid completion precedes replacement. An already committed identical retry is deduped before the active-pointer check after authorization.

SRS operation rows retain the learner/operation key, while partial unique indexes enforce at most one `(card_id,session_key)` SCHEDULE and one REINFORCEMENT. Same-session reinforcement remains tied to its forgotten parent and does not update stage, due date or qualifying day. A later intentional review uses a new session.

## I–J. Media and audit

Media cleanup reserves an unreferenced asset by setting `retired_at` under the shared asset lock. Bind, avatar-reference and publication paths lock/check the same asset and reject a reservation. The worker commits the reservation, performs a final reference check, and calls the provider outside the database transaction. Tombstones and immutable keys make retry safe; referenced bytes cannot be retired by a stale cleanup check.

Audit actor shape supports an application-account FK, a verified Auth subject UUID without that FK, or SYSTEM. The narrow writer accepts missing-account attribution only from the verified server boundary. It never creates a phantom account or records a credential/token. Append-only domain assignment/review history remains the source for workflow scope and actor provenance.

## K–L. Transaction and scenario coverage

The fixed lock order now includes the actor/course path for first context and lesson finalization, assignment/revision/media paths for governance, and a single asset lock for cleanup. Expected row versions and scope generations are compared before mutation; provider calls stay outside DB transactions. The [future acceptance table](rebuild-plan.md#f01f12-correction-acceptance-scenarios) contains all sixteen requested correction scenarios, with fixture, action, expected invariant and explicit NOT EXECUTED status. Race cases require separate database transactions and assert both committed state and the losing path’s absence of side effects.

The exact scenario IDs are: PD-F01-TEACHER-SUBMIT, PD-F01-UNASSIGNED-DENIED, PD-F02-FIRST-CONTEXT, PD-F10-AVAILABILITY-AWARE-DEFAULT, PD-F02-CONTEXT-CAPACITY-RACE, PD-F05-REMOVE-DRAFT-MEMBER, PD-F06-CLEANUP-PUBLISH-RACE, PD-F11-BLUEPRINT-CONFIG-AFTER-PUBLISH, PD-F04-CURRICULUM-ASSIGNMENT-HISTORY, PD-F08-OLD-OPEN-ATTEMPT, PD-F08-REPLACEMENT-COMPLETION-RACE, PD-F09-DUPLICATE-REINFORCEMENT-RETRY, PD-F09-CARD-SESSION-UNIQUE-RACE, PD-F03-MISSING-ACCOUNT-AUDIT, PD-F11-VERSION-COVERAGE-SNAPSHOT, PD-F12-COVERAGE-TAGS-VALIDATION.

## M. Verifier correction and baseline authority

The prior physical-design verifier is preserved as [historical source](final-review-evidence/historical-verify.py); its recorded output is historical evidence, not current authority. Its task-specific checks were stale for this correction session:

| Historical assertion | Why it no longer controls | Current authority/check |
|---|---|---|
| `preexisting files changed only in authorized pointers` | That allowlist described the earlier review task, not the exact correction-pass permissions or the already-dirty starting tree | `CURRENT AUTHORITY` is this task’s immutable approved scope plus current `AGENTS.md`; the current verifier compares starting hashes and allows only the correction task’s named files |
| `six separately observed unrelated drawio files` | This was an exact six-path snapshot from the earlier task; the later workspace contained 38 separately recorded draw.io path changes before this task began | The old task baseline is retained as historical evidence; this task compares its own complete start-of-task file/hash baseline and never attributes preexisting paths to the correction |
| `task new files only authorized physical/task artifacts` | The old task’s new-file set cannot enumerate this task’s report, reviewer record, evidence and immutable approval snapshot | The current verifier has the correction task’s own exact new-file rules and correction-evidence prefix |
| `all 139 canonical modeling files unchanged` | 139 was the earlier baseline count; the current correction-task baseline protects 189 existing `docs/modeling/current-target/` files | The current verifier hashes every path in this task’s baseline; all 189 must match exactly |

No valid semantic check was removed to force a pass. The current verifier additionally checks the 34-table catalog/detail/ERD sets, four ERD panel endpoints, local links, proposed/unverified status, allowlists, command matrix, F01–F12 semantic phrases, scenario IDs, historical-check disposition, exact task baseline hashes, append-only log prefixes, all 189 approved-modeling hashes, HEAD and the original index. Its no-Reassessment check is scoped to the active purpose CHECK constraint, not descriptive historical text.

## N. Independent recheck and final boundary

The independent verdict is maintained in [independent recheck](independent-recheck.md), not inferred from this correction report. If any finding is STILL OPEN, the task returns to review/correction for that finding. Only twelve independent CLOSED results support the terminal status **PHYSICAL CORRECTION COMPLETE — READY FOR FINAL RECHECK**. This does not mean PHYSICAL DESIGN APPROVED. No code, Prisma schema, SQL/migration, database, seed, deployment, implementation plan, stage or commit is authorized or performed.

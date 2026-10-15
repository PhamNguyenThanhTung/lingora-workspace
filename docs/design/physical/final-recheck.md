# FINAL PHYSICAL DESIGN RECHECK — Lingora

**Started:** 2026-10-11; **completed:** 2026-10-12 (Asia/Saigon). Independent documentation review; no implementation or live database access.
**Scope:** [exact human request](../../../plans/approved/2026-10-11-final-physical-design-recheck-REQUEST.txt), [immutable authorization](../../../plans/approved/2026-10-11-final-physical-design-recheck-APPROVED.md), [entry baseline](../../../plans/approved/2026-10-11-final-physical-design-recheck-BASELINE.json).

## A. Final verdict

**NEEDS PHYSICAL CORRECTION**

Ten findings independently CLOSED; F01 and F02 STILL OPEN in narrowly identified principal dependencies. Teacher SUBMIT and first-context creation were corrected, but their original findings also included authoring-read and existing-context authorization dependencies that remain incomplete. No new product decision is required. Do not redesign or begin implementation planning inside this review.

Authority checked: latest PO request; ADR-036 and compatible ADR-030–035 in the [decision log](../../../logs/decision-log.md); active addenda in [requirements](../../02-requirements.md), [UC catalog](../../use-case-specifications.md), [traceability](../../05-traceability-matrix.md); approved DOM-01/DATA-03, ACT-01/03/04/06/08/09, SEQ-03/04/05/06/07/08/09 and SEC-01. Historical fixed counts/roles/AI rules do not control. Physical definitions and grants were read directly rather than inferred from closure summaries. A focused read-only reviewer independently corroborated F01/F02 and calibrated F05/F06; its record is in [reviewer evidence](final-recheck-evidence/principal-review.md).

## B. F01–F12 closure matrix

Line references below identify unchanged underlying physical definitions at this recheck; the README receives only a new status pointer after review. Scenario IDs are design specifications, **NOT EXECUTED**.

| Finding | Original problem | Correction implemented in proposal | Independent evidence | Verdict |
|---|---|---|---|---|
| F01 | Teacher SUBMIT principal missing; authorized Teacher key-read path also incomplete | `submit_assigned_work` now has Teacher-specific transition checks, locks, scope pin and provenance | Security lines 41/94 and README §E support SUBMIT, but security line 40 omits secret SELECT for content_writer; line 38 grader is Learner-gated. Lines 61/110 promise Teacher reads without a named privileged reader. Counterexample below. PD-F01 covers submission, not this unresolved read | STILL OPEN |
| F02 | First-create course lock required an existing context; own-context lookup dependency incomplete | FIRST_CONTEXT_CREATE has no existing-context predicate; learner_writer gets owner SELECT; actor/course locks enforce max-two | README context definition and security lines 39/43/87 support first creation. Locker's explicit relation list still omits learning_contexts and no owner-read helper EXECUTE bridge is named. PD-F02 covers first create/capacity but cannot establish the absent existing-context principal dependency | STILL OPEN |
| F03 | Missing app account prevented authenticated audit attribution | Optional account FK plus verified Auth UUID and actor-kind CHECK | README audit definition; security audit_writer; PD-F03-MISSING-ACCOUNT-AUDIT: deny domain access, sanitized subject denial after rollback, no phantom account/token | CLOSED |
| F04 | Approval could silently apply to changed assignment requirement/scope | Scope generation, initial/change/reassignment history and immutable submit/review snapshots; pins compared at approval/publication | README assignment/history/review definitions and §§E/I–K; ADMIN_APPROVE/PUBLISH; PD-F04 verifies stale approval denial and retained meaning | CLOSED |
| F05 | No valid removal of mistakenly added draft membership | `remove_draft_member`; exact editable association DELETE, parent/assignment lock and version bump; entity/evidence retained | Four association definitions; security content_writer and TEACHER_REMOVE_DRAFT_MEMBER; PD-F05 covers both editable states, removed-member exclusion and frozen rejection | CLOSED |
| F06 | Post-commit cleanup could delete newly referenced media | Atomic retired_at reservation; every attach/avatar/publish uses asset lock/check; final check before provider delete outside transaction | README asset/binding definitions and §I; MEDIA_CLEANUP; PD-F06 race has one safe winner and permanent immutable-key tombstone | CLOSED |
| F07 | Mutable ancestors could reclassify old evidence/obligations | Referenced course language/framework, level framework/code, Unit course/level and Lesson Unit ownership freeze; same-scope reorder only | README identity/curriculum definitions and §E; direct/ancestor guards plus generation lock; PD-F04 covers referenced movement rejection | CLOSED |
| F08 | Old open attempt could create first completion after replacement | Shared course lock; active AVAILABLE pinned revision required before first completion side effects; committed retry dedupe precedes freshness | README attempts/§F/§O; LESSON_COMPLETE and ADMIN_PUBLISH; PD-F08 tests both lock orders, no partial completion/performance/card/day/receipt and preserved prior completion | CLOSED |
| F09 | Parent-only uniqueness permitted multiple reinforcement occurrences per card/session | Separate partial UNIQUE(card_id,session_key) for SCHEDULE and REINFORCEMENT; parent validation/unique retained | README SRS definition/§G; SRS_REVIEW; card lock, operation hash and no reinforcement schedule/day update; PD-F09 retry/concurrency cases | CLOSED |
| F10 | Framework-valid default could enter unavailable curriculum | Lowest-position level with eligible published AVAILABLE content; higher default cannot override; null start/coming-soon when none | Direct approved ACT-01 comparison; README course/context and CTX_CREATE; PD-F10 covers unavailable higher candidate, zero content and concurrent config generation | CLOSED |
| F11 | Mutable blueprint scope invalidated historical version pins | Used/submitted blueprint scope freezes; scope change needs new identity; version stores immutable snapshot, non-scope config generations separate | README blueprint/version/attempt and §H; PD-F11 config-after-publish/coverage-snapshot; old grade and scope use v1 while current Level-up gate remains separate | CLOSED |
| F12 | Fabricated/out-of-scope topic/skill lacked controlled authority | Finite course catalog with generation/active flags, revision tags and immutable labels; blueprint/curriculum membership validation; two assessment purposes | README course/revision/version-item definitions and §H; PD-F12 permits allowed IDs, rejects invented/other-course/inactive/retired/uncovered IDs; no taxonomy/mastery table | CLOSED |

### F01 — remaining P1 dependency

An ACTIVE assigned Teacher reopens an editable MCQ to inspect its saved correct choice. Generic runtime secret SELECT is denied. `lingora_content_writer` explicitly lists SELECT only for authoring-parent/item ownership and INSERT/UPDATE for secrets. `lingora_grader` checks ACTIVE LEARNER and returns bounded grading outcomes. The resource matrix and authoring responsibility promise Teacher secret read, but do not supply its named function owner, secret SELECT grant, principal policy and checked EXECUTE path. This is the original F01 dependency, not a request for implemented SQL or a new subsystem.

Minimal follow-on correction must identify the existing narrow authoring read executor and its complete dependency path, maintaining assigned/editable-only access and denying generic runtime/browser key reads. Also reconcile security line 111's Admin-only lifecycle-trigger sentence with the explicit Teacher SUBMIT exception; that stale sentence alone is a small documentation inconsistency, not the substantive reason for rejection.

### F02 — remaining P1 dependency

A valid Learner resumes an owned context. `lingora_learner_writer` can SELECT that context, but the named course-lock function runs as `lingora_scoped_locker`, whose explicit table grant list excludes learning_contexts while its existing-context predicate requires an owned matching context. No named checked owner-lookup function/EXECUTE bridge connects those principals. A caller's separate lookup does not establish the lock function's independent authorization.

Minimal follow-on correction must name the bounded context lookup dependency available to the locker and its owner policy or checked helper path. Preserve FIRST_CONTEXT_CREATE and actor → course order; do not grant generic curriculum updates or treat client ownership claims as authoritative. PostgreSQL evaluates a definer function with its owner's privileges; policy expressions also require access to referenced objects. See [CREATE FUNCTION](https://www.postgresql.org/docs/15/sql-createfunction.html) and [CREATE POLICY](https://www.postgresql.org/docs/15/sql-createpolicy.html).

## C. Regression findings

No new independently demonstrated P1/P2 correctness/security/integrity/product contradiction found. F01/F02 are incomplete closure of original findings, not newly numbered findings. Previous correction/closure reports remain historical evidence; this report controls the latest status and does not overwrite them.

Non-blocking artifact observations: governance tables repeat across content/learning ERD views; content_assignments is declared twice with the same alias in the content view, which merges reference and field labels. The content-view assignment_history/revision_reviews boxes have no local edges, but their FK labels and the learning view explicitly supply those relationships. No orphan exists in the combined catalog. See §N/Q.

## D. Table-count verdict

**34 APPROPRIATE**

34 unique catalog/detail/ERD identities agree. No correctness issue requires adding or removing tables. Unit retains stable grouping, course/level ordering, curriculum management and navigation justification. Derived LearningPlan, progress, latest/best performance, streak and reporting are not new persisted subsystems. No SkillProfile/mastery/KnowledgeGap/Enrollment/generic workflow/QuestionBank platform is introduced.

## E. Auth / RLS / capability verdict

**NOT READY**, limited to F01/F02 dependencies. Browser is untrusted; trusted backend verifies provider subject and fresh role/status. Proposed Prisma login is non-owner/non-superuser/NOBYPASSRLS with transaction-local verified subject; migrator and provider service-role adapter are separate. Bypass connections never replace server authorization. RLS/grants/DTO/secret separation are distinct responsibilities; actual role/pooler/schema exposure remains unverified. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

All fourteen requested matrix rows were inspected. CTX_CREATE's first-create branch, lesson answer/completion, SRS, assessment finalize, Teacher edit/remove/submit, Admin request-changes/approve/publish/disable/reenable and media retirement each name a command and transaction. Teacher authoring key read and existing-context locking still lack complete principal paths. Definer EXECUTE/table/policy dependencies must be bound before design acceptance; runtime security tests remain future work.

## F. Data integrity verdict

**COHERENT PROPOSED DESIGN**, subject to capability closure. Context learner/language UNIQUE; max-two actor-lock count; completion context/logical-lesson UNIQUE; pinned membership composite FKs; single active lesson pointer and assessment partial unique; all retained FKs RESTRICT/NO ACTION. Draft association deletion preserves identities/evidence; no account/curriculum/evidence cascade or Admin learner-history mutation. No cross-row CHECK is treated as a transaction substitute.

## G. Historical / provenance verdict

**PASS AT DESIGN LEVEL.** Original requirement/scope, Admin creator, current Teacher and ordered reassignment/scope history remain reconstructible. Created/edited/submitted/approved/published actors and review pins preserve attribution. Referenced curriculum scope cannot move silently; used blueprint scope freezes, version coverage/config/labels remain immutable. Current catalog edits cannot rewrite old attempts/results.

## H. Lesson / progress verdict

**PASS AT DESIGN LEVEL.** N configured core members; K first-wrong; integer half-units reproduce contributions 1/0.5/0 divided by N+K. Exactly one retry per first-wrong; unfinished attempt has no completed performance; score does not gate completion. Redo uses new attempt without duplicate completion. Shared course lock decides replacement versus first completion; prior committed evidence and identical retry remain valid. Progress excludes unpublished/unavailable/withdrawn content, includes active published required content even when progression-locked, and intersects the same eligible set for numerator/denominator. No fixed count/A1/Unit1/universal 100% gate.

## I. SRS verdict

**PASS AT DESIGN LEVEL.** One learner+Vocabulary account-wide card; core auto-enrollment, optional explicit choice, no-reset reuse. Initial +1 day; remembered 3/7/14/30/30; forgotten stage1/+1. Card lock, key/hash and partial card/session uniques prevent duplicate schedule/reinforcement; reinforcement never changes due date/stage/day. Context pause does not pause global SRS.

## J. Assessment verdict

**PASS AT DESIGN LEVEL**, with authoring executor closure in F01 required. Mutable Admin non-scope config becomes a new immutable version snapshot. Purpose/language/framework/level-transition/curriculum/topic/skill/distribution/config remain reconstructible; current Level-up readiness stays separate from pinned grade/pass policy. Learner DTOs exclude keys, accepted answers, private grading/awarded per-item points and prohibited feedback before/after finalization. Exact practice reuse uses server canonical fingerprints and shared PostgreSQL advisory locks, with ever-exposed history retained. Only Placement/Level-up; incomplete submission creates no result.

## K. Content / assignment / publication verdict

**PARTIAL — F01 STILL OPEN.** Assigned editable Teacher save/remove/SUBMIT has version/state/scope checks; Teacher cannot approve/publish. Admin transitions compare immutable assignment pins; stale old approval becomes unpublishable rather than altered. Active replacement validates and switches atomically, rollback preserves prior content. Proposed payload/member/key/media immutability and historical references remain sound; Teacher key-read executor and trigger wording need closure.

## L. Media / audit verdict

**PASS AT DESIGN LEVEL.** Cleanup candidate designation alone never authorizes provider deletion: asset lock/no-reference check reserves permanent retirement; all reference acquisitions/publish reject retirement. Reference-first prevents reservation; reservation-first prevents attach/publish. Final DB check precedes provider call outside transaction; timeout retries immutable key/tombstone. Private streaming rechecks scope/status; no published byte overwrite. Audit supports missing-account verified Auth UUID with DENIED/reason and no fabricated account/token. Stable audit order/index uses occurred_at plus id (equivalent domain timestamp to created_at).

## M. Transaction / concurrency / idempotency verdict

**COHERENT DESIGN WITH F02 EXECUTOR DEPENDENCY.** Actor → course → context → attempt → sorted cards; governance → assignment → parent → child/assets; cleanup only asset. Row-version/generation checks and natural uniqueness support serialization, no distributed locks. Dedupe after actor/ownership/status and before obsolete queue/pointer rejection replays committed results; changed payload conflicts. Domain writes/audit-success/receipt are atomic; denied audit append survives rollback; provider calls stay outside DB transaction. Acceptance specifications cover valid/invalid authorization, retries, stale revision, races, history, secrecy, cleanup, missing-account, tags and first creation, without claiming execution.

## N. Physical ERD verdict

**RENDER/INTEGRITY PASS; MINOR DOCUMENTATION NOTES.** All four isolated PNG/SVG renders freshly generated, match primary renders byte-for-byte, decode/parse and were individually visually inspected. Labels are readable/unclipped; PK/FK/nullability/uniques/cardinality and reference identities were checked against catalog. Each view retains PROPOSED / NOT IMPLEMENTED. [Hash/dimension manifest](final-recheck-evidence/render-manifest.json).

Repeated governance definitions represent the same three tables rather than additional tables; content assignments alias repetition blends a reference label with its fields. Learning view supplies history/review edges, while content view's loose boxes are redundant annotations. Assessment ERD's topic_ids/skill_ids are shorthand for validated IDs within coverage_tags, not extra physical columns; `version` in README's membership-index shorthand means assessment_version_id. These can be normalized in a bounded documentation cleanup; they do not change FK identity, add a table or explain the rejection.

## O. Clean rebuild verdict

**CLEAN REBUILD RECOMMENDED**

Independent read-only repository inventory supports material legacy divergence (18 Prisma models/six roles versus initial 17 SQL tables/two roles and missing target context/version/evidence boundaries). Prefer new/disposable environment first. Preserve old migration bytes/history; separate executable baseline root/config avoids replaying legacy public/Auth/RPC policies. This remains a conditional recommendation, not permission to discard live data. Valuable unmappable evidence or infeasible rollback can change the execution strategy after live review.

## P. Live DB status

**LIVE DB UNVERIFIED.** This task did not connect, probe credentials or read live catalogs/data.

That status alone does **not block design approval**. Current design rejection is caused by F01/F02. It **blocks destructive execution**, which requires exact environment binding, dated read-only inventory, owner-approved preserved/disposable/unknown disposition and role/history mapping, backup, isolated restore/object-hash proof and approved rollback/cutover. ADR-035 also requires live reconciliation before implementation/migration.

## Q. Remaining non-blocking notes

- Bind actual restricted login/pooler/role flags, grants, RLS/FORCE, helper EXECUTE/search_path and provider correlation mechanics in the later disposable integration gate; no owner-connected test proves runtime RLS.
- PD-F09-CARD-SESSION-UNIQUE-RACE's two same-session SCHEDULE parents are now impossible under the proposed schedule unique. Future test should assert rejection of the second schedule before racing valid reinforcement requests, or explicitly label a corrupt-fixture test. The invariant itself is correctly enforced.
- Normalize redundant ERD governance aliases and index/tag shorthands described in §N. Fingerprint is non-unique exact duplicate/reuse lookup data, server normalized from prompt/options/media/key semantics and not authorization identity. Measure proposed indexes later; no benchmark prerequisite now.
- Retention/anonymization duration remains deferred; no purge policy is inferred.

Observed artifact commands/results, source/status scans and manual review are in [verification evidence](final-recheck-evidence/verification.md). Structural verifier PASS never supplies semantic acceptance. No physical redesign was applied.

## R. Implementation readiness

**NOT READY FOR IMPLEMENTATION PLANNING**

Next separately authorized action: bounded F01/F02 physical documentation dependency correction, then independent recheck of those paths and regressions. Keep original numbering. Do not repeat unrelated design choices or add a subsystem. This review is complete; no implementation master plan, production Prisma, migration, DB rebuild, seed, API/UI, deployment, staging or commit follows.

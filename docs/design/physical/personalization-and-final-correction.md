# Lingora — Study Focus addendum + final physical correction F01/F02

**2026-10-12 · documentation/modeling only · PROPOSED PHYSICAL DESIGN — NOT IMPLEMENTED.** Final approval remains a separate task. [PO request](../../../plans/approved/2026-10-12-study-focus-personalization-f01-f02-REQUEST.txt) and [bounded authorization](../../../plans/approved/2026-10-12-study-focus-personalization-f01-f02-APPROVED.md) control this correction.

## A. Product decision

The additive [Study Focus decision](../../study-focus-addendum.md), ADR-042, records one primary focus per LearningContext: BALANCED default, VOCABULARY, GRAMMAR, READING, LISTENING. Learner changes affect next supplementary composition only. ADR-036 remains intact; ADR-041's internal SRS interaction remains intact. No core/progress/SRS/start/result reset or historical score rewrite.

## B. Logical/modeling changes

Targeted scope is ACT-01 optional default focus, ACT-03 supplementary after core, ACT-06 independent internal due selection; SEQ-06 ordinary supplementary composition and SEQ-08 no due browsing; DOM-01/DATA-03 context focus and finite practice-skill metadata. No new canonical diagram/UC or broad 36-diagram re-audit. Untouched sources/renders are protected by task-entry/handover hashes.

## C. UC/report-view impact

`Chọn/thay đổi trọng tâm học tập` is a supporting owned-context preferences subflow of UC-04, consumed in UC-06/07. Canonical UC-01–UC-14 unchanged. Existing VIEW-RUC-02/03/04 synchronize context preference, personalized supplementary practice and internal SRS selection. No learner due-list/pre-browse function.

## D. SRS integration

Supplementary composition combines independently selected due/overdue cards with configured focus-biased eligible authored practice. Grammar focus never suppresses due vocabulary. Internal due_at/overdue state persists until valid review. Only the started session's current prompt is returned. Policy B 1/3/7/14/30 recurring 30, forgotten stage 1, enrollment/account-wide card uniqueness and at-most-once reinforcement without second schedule are unchanged. Supplementary outcomes never enter core N/K, completion or secure assessment results.

## E. Physical personalization design

Existing learning_contexts receives five-value NOT NULL/default BALANCED study_focus. Existing finite course catalog maps stable practice skill IDs to four controlled knowledge areas; existing item_revisions holds skill IDs/immutable metadata snapshot. Bounded practice_config supplies selection bias/limits without fixed platform percentages/counts. Only published AVAILABLE accessible PRACTICE membership with valid active course metadata/media is eligible, preserving secure item-reuse/exposure guards. Sparse pools fall back or yield an empty optional component. [Named update/query/grader grants and signed-session boundary](security-and-rls.md) describe proposed enforcement. No composition/history/session table is needed.

## F. F01 correction

The prior recheck's open counterexample is explicitly repaired: content_writer has exact private grading SELECT columns and assignment/editable-authoring-owner principal policies; runtime executes checked read/edit functions only. Teacher SUBMIT calls content_writer's independently authorized readiness validator through transition_writer EXECUTE, with no raw-key result. Locks/version/assignment-generation checks precede mutation; IN_REVIEW, SUBMIT provenance, audit and receipt commit together. Frozen reused membership has a separate grader-owned Boolean readiness validator callable only by the checked content_writer package validator, with independent grants/policies; it grants no raw Teacher key read or frozen mutation. The stale Admin-only lifecycle sentence now includes the narrow Teacher SUBMIT exception. Admin read-only review and ACTIVE Learner pinned server grading are separate checked grader paths. Learner/raw/generic key SELECT and Teacher publication remain denied. Six positive/negative cases and FORCE RLS path cases are in [future acceptance](rebuild-plan.md).

## G. F02 correction

create_or_resume_learning_context is owned by learner_writer, which now has own ACTIVE account SELECT + lock-only UPDATE(row_version) and matching nonrecursive policies. It locks the stable account row before any context lookup/count, then reads/writes own contexts through its explicit SELECT/INSERT/command-column UPDATE policies. Scoped course locker independently has minimal own-context SELECT, language/course lookup grants and lock-only course UPDATE with separate first-create/existing-context predicates; it never assumes caller grants. All create/resume/reactivate/pause capacity paths share the account lock. Unique learner/language and max-two ACTIVE remain. Default start stays lowest-position eligible published AVAILABLE level; higher configured defaults cannot skip it. Focus is independent.

## H. Table impact

**34 → 34.** No new account, taxonomy, learner plan, preference history, supplementary composition or event subsystem. Existing Unit grouping justification and all retained evidence relationships remain.

## I. Verifier correction

Root cause: the physical verifier remained tied to the older correction-pass baseline/allowlist, rejecting legitimate final-recheck, report and subsequent task artifacts. Its historical source and failing output are preserved in [entry verifier](personalization-correction-evidence/entry-verify.py) and [observed output](personalization-correction-evidence/entry-physical-verifier-output.txt). Current authority uses this task's immutable baseline plus exact concurrent-task handover hashes and a finite task inventory. No wildcard authorization or deletion of valid earlier evidence. Canonical verifier's stale global docs/*.puml count/old correction baseline and outdated SRS literal checks are migrated to package identity/freshness and current scoped preservation, retaining all substantive checks. Final observed output: [canonical modeling](personalization-correction-evidence/modeling-output.txt), [physical](personalization-correction-evidence/physical-output.txt) and [finite inventory/freshness/links](personalization-correction-evidence/scope-output.txt) each exit 0; git diff --check exits 0. Current source/table/manifest identities and retained unchanged views agree. [Verification detail](personalization-correction-evidence/verification.md) and [visual QA](personalization-correction-evidence/visual-review.md) preserve scope and limitations.

## J. Independent targeted review

[Fresh independent targeted review](personalization-correction-evidence/independent-review.md) returns personalization CONSISTENT, F01 CLOSED, F02 CLOSED, regression NONE. It identified and rechecked the frozen-item reuse validator and complete membership/catalog/media reads before sealing its verdict.

## K. Remaining issues

No actionable product/design blocker remains after independent review. Final artifact verification/log gates are recorded below. LIVE DB UNVERIFIED is unchanged: actual grants/functions/RLS and runtime behavior require the separately approved later implementation/testing scope. Conditional CLEAN REBUILD recommendation retains read-only inventory, preservation mapping and isolated restore/destructive-execution gates; none was executed. This live-state limitation is not by itself a design blocker.

## L. Final status

PERSONALIZATION ADDENDUM APPLIED; F01 CLOSED; F02 CLOSED; PHYSICAL DESIGN READY FOR FINAL APPROVAL RECHECK. No physical approval, implementation planning, code/UI/Prisma/migration/live DB mutation/rebuild/seed/deployment/staging/commit is authorized here. Next separate task after successful closure: **FINAL PHYSICAL APPROVAL RECHECK**.

| Finding | Current targeted result | Basis |
|---|---|---|
| F01 | CLOSED | Exact assigned Teacher authoring-secret read/edit and readiness/submit EXECUTE chain corrected |
| F02 | CLOSED | Stable parent lock and complete writer/locker FORCE RLS lookup/create privileges corrected |
| F03 | CLOSED | Verified missing-account denial audit actor attribution unchanged |
| F04 | CLOSED | Assignment generation/snapshot pin and unpublishable stale approval unchanged |
| F05 | CLOSED | Draft-only removal limited to four exact association tables; no identity/evidence deletion |
| F06 | CLOSED | Media retirement reservation/final-reference/provider-delete race guard unchanged |
| F07 | CLOSED | Referenced curriculum ownership stable; position-only reorder unchanged |
| F08 | CLOSED | Shared course lock/active first-completion guard and committed retry dedupe unchanged |
| F09 | CLOSED | Card/session SCHEDULE and REINFORCEMENT uniques/one schedule unchanged |
| F10 | CLOSED | Availability-aware lowest eligible default and coming-soon unchanged |
| F11 | CLOSED | Immutable blueprint scope and version snapshot/pinned grading unchanged |
| F12 | CLOSED | Finite course coverage validation/snapshot preserved; practice metadata extends same catalog |

PERS-01–10 and added F01/F02 cases are design acceptance specifications **NOT EXECUTED**. The historical [correction scenarios](correction-pass.md) and prior [final recheck](final-recheck.md) remain unchanged evidence; their dated verdicts are not overwritten.

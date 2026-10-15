# Independent targeted Study Focus and F01/F02 review

**2026-10-12 · reviewer `/root/study_focus_targeted_review` · documentation/design review only.** Human authorization is the [exact PO request](../../../../plans/approved/2026-10-12-study-focus-personalization-f01-f02-REQUEST.txt) and [bounded approved scope](../../../../plans/approved/2026-10-12-study-focus-personalization-f01-f02-APPROVED.md). Source changes were made by the author; the reviewer changed only this new evidence record. Earlier reviews remain immutable.

| Concern | Final verdict |
|---|---|
| Personalization addendum | CONSISTENT |
| F01 | CLOSED |
| F02 | CLOSED |
| F03–F12 regression | NONE |

## Scope and observed evidence

Entry reads followed AGENTS.md: current-task, QUICK-REF, HANDOFF, docs/README. The review examined the PO request/approval, Study Focus addendum, affected active requirements/UC/traceability, ACT-01/03/06, SEQ-06/08, DOM-01/DATA-03 and VIEW-RUC-02/03/04. Physical sources examined were README, security-and-rls, rebuild-plan, personalization-and-final-correction, the current physical ERD and preserved entry ERD. Prior final-recheck and its principal-review supplied the exact original F01/F02 counterexamples. No full 36-diagram audit, runtime/database test, application edit, staging or commit was performed.

This verdict concerns product semantics and the proposed privilege chains. It does not infer semantic approval from structural verifiers, inspect transient pending-review labels as defects, or claim final visual/verifier gates were completed by this reviewer. Runtime acceptance scenarios remain **NOT EXECUTED**. LIVE DB UNVERIFIED remains an execution limitation; it does not independently create a design blocker.

## Product consistency

[Study Focus addendum](../../../study-focus-addendum.md), lines 5–23, agrees with the PO instruction: one five-value focus per context, BALANCED default, optional change affecting subsequent supplementary composition only. Existing started composition and historical scores/progress/SRS/start/working level remain intact. Authored practice uses finite existing course skill/area metadata, published AVAILABLE accessible PRACTICE content, configuration-driven nonexclusive bias and eligible fallback. No taxonomy/AI/mastery subsystem or fixed question count/percentage is introduced.

Independent internal due/overdue selection remains separate from focus bias; no learner due-card list or advance enumeration appears in the affected views. Policy B, account-wide Learner+Vocabulary uniqueness, enrollment and at-most-once reinforcement remain. Core N/K and 1/0.5/0 contributions over N+K, core completion/order/unlocks/readiness, and pinned scored Placement/Level-up composition/results are unchanged. Requirements lines 25–31, UC supporting subflow lines 149–151 and supplementary/SRS sections, and current traceability rows express the same boundaries. Canonical UC-01–14 identities remain unchanged. The inspected catalog contains the same 34 proposed tables; fields/finite metadata extend existing context/course/item structures, giving **34 → 34**.

## F01 closure and correction during this review

The original Teacher authoring-read gap is closed in [security-and-rls](../security-and-rls.md), lines 146–162. The named content_writer read/edit functions have explicit secret-column SELECT/I/U grants, independent ACTIVE/current-assignee/editable-authoring-owner policies, exact projection and expected-version checks. Runtime receives checked EXECUTE, never generic key SELECT or role assumption. transition_writer calls the separately granted content_writer readiness validator and commits only Teacher SUBMIT fields, scope pin, provenance, audit and receipt. Admin review and pinned Learner grading use separate checked grader paths. Owners remain non-login/NOBYPASSRLS under FORCE RLS, with schema/helper/lock/audit EXECUTE dependencies named independently.

The reviewer initially found one **P1 F01 readiness dependency**: physical README line 83 permits frozen same-origin revisions in additional consumer packages, but the first draft of the package validator reused the authoring-only secret policy. A valid editable consumer package containing such a frozen member could not validate its key under FORCE RLS. This was reported to the author, rather than patched by the reviewer.

The author added `validate_frozen_member_readiness`, owned by the existing grader, at security line 153. Its own secret/membership/assignment/item SELECT grants and separate principal policy require the exact current assigned editable consumer, frozen same-origin member and valid scope. Only content_writer's package validator can execute it; the returned Boolean/finite codes expose no keys and confer no authoring mutation. The reviewer also requested explicit content_writer membership/catalog/media read dependencies. Security line 158 now supplies those SELECT fields and package-scoped policies, including the grader's own independent scope reads. Lines 152–160 were freshly reread after both corrections. The original authoring-only projection remains restricted and cannot exploit the new internal policy as a raw frozen-key read.

[Rebuild acceptance](../rebuild-plan.md), lines 172–178, now covers assigned/foreign/Learner authoring, pinned grading, missing keys, Teacher publication denial and PD-F01-FROZEN-REUSE. The latter includes valid reuse, foreign/stale/removed membership, invalid-key rejection and preserved raw-key denial. **The reported P1 is CLOSED at design level; no F01 action remains.**

## F02 closure

Security lines 166–177 explicitly give learner_writer its own account SELECT plus lock-only UPDATE(row_version), nonrecursive ACTIVE-owner SELECT/UPDATE policies and actor-helper EXECUTE. Stable account locking precedes any context lookup/count, including first creation. Own-context SELECT/INSERT/command-specific UPDATE grants/policies support lookup/create/resume without caller-right inheritance.

The scoped course locker has its own minimal context/language/course SELECT, lock-only course UPDATE and independent policies for existing owned context versus FIRST_CONTEXT_CREATE. Only checked learner_writer functions execute that helper. Default resolution has separate configured-curriculum reads valid before the first context exists. Every create/resume/reactivate/pause capacity path shares the parent lock; UNIQUE(learner,language) and serialized max-two ACTIVE enforcement remain distinct. The lowest eligible published AVAILABLE level/coming-soon behavior is preserved independently of focus. Future PD-F02 cases at rebuild lines 179–181 cover missing privileges, existing-context owner lookup, first-create and cross-language capacity races. **F02 CLOSED at design level.**

## Focused regression result

**NONE.** No changed-path contradiction was demonstrated in F03–F12. Missing-account audit attribution, immutable assignment scope pins, draft-association-only removal, media retirement reservation, stable referenced curriculum ownership, stale first-completion serialization, SRS schedule/reinforcement uniqueness, availability-aware default entry, immutable blueprint/version scope and finite course coverage remain specified. New focus does not mutate these records; supplementary transient feedback does not enter core or assessment evidence. The frozen-readiness correction preserves item/key immutability and checked role separation. Findings F03–F12 remain CLOSED; no unrelated design choice was reopened.

PostgreSQL's [SECURITY DEFINER ownership rule](https://www.postgresql.org/docs/15/sql-createfunction.html), [row-lock privilege requirement](https://www.postgresql.org/docs/15/sql-select.html) and [row-security behavior](https://www.postgresql.org/docs/15/ddl-rowsecurity.html) were checked against primary documentation. The review therefore does not assume that a helper inherits caller relation grants or bypasses FORCE RLS through ownership.

Final fresh-read binding: HEAD `89d58f3da8b9ffcb9a7d9bcdfc6eb76b93eab737`; security-and-rls SHA-256 `34b6d3ab02081311ab613ef1cf10dbdcceec57695afc1b51614c682b982e9790`; rebuild-plan SHA-256 `a5978757edb4120a16ebb282428ab77726935746d5fac13d02ab18564601790f`. UTF-8 reread confirmed corrected acceptance text. These are observed source hashes, not runtime evidence.

No actionable product/F01/F02/F03–F12 finding remains. This supports **PHYSICAL DESIGN READY FOR FINAL APPROVAL RECHECK** once the author completes the separate required artifact-verification/log gates; it does not grant PHYSICAL DESIGN APPROVED or implementation-planning permission.

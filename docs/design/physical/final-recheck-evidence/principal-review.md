# Focused independent principal review

Read-only reviewer `/root/principal_recheck`, dispatched under requesting-code-review. Review returned during the final recheck started 2026-10-11; completed report/log date 2026-10-12 (Asia/Saigon). No reviewer edits or live tests.

## F01 — STILL OPEN

Security lines 41/94 name Teacher submit_assigned_work with assignment/state/readiness/version/provenance. Line 40 grants content_writer secret INSERT/UPDATE, but SELECT only for parent/item ownership. Lines 61/110 and README secret definition promise Teacher authoring reads without a named secret SELECT executor. Line 38 grader is ACTIVE-LEARNER gated and returns bounded outcomes. Assigned Teacher reopening saved editable MCQ keys has no complete named read path. Line 111's Admin-only trigger clause is a tiny stale inconsistency, not the substantive rejection reason.

## F02 — STILL OPEN

First-create branch in security lines 43/87 and README context definition is corrected; learner_writer has own-context SELECT (39/46). Scoped locker requires an owned matching context but its explicit relation grant list (43) excludes learning_contexts. No named checked owner-lookup EXECUTE bridge. Caller privileges do not carry into SECURITY DEFINER execution as the locker; treating passed ownership as sufficient conflicts with independent function checks (35).

## Adjacent calibration

F05 CLOSED: named remove_draft_member, four association DELETE grants, exact assigned editable parent RLS/version guard now address missing removal; minimum association ownership reads must be tested later, not turned into a new finding solely for absent SQL.

F06 CLOSED: retirement reservation/shared acquisition locks/final recheck remove original race. System asset-only maintenance lock need not use ACTIVE-human actor branch. Future principal mapping still needs implementation proof; no demonstrated unavoidable race or new blocker.

No additional demonstrated correctness/security defect found in the fourteen command rows. Principal findings are limited to original F01/F02. Approved SEQ-03 and ADR-034–036 do not fill missing physical grants. PostgreSQL CREATE POLICY/CREATE FUNCTION confirm referenced-object permissions and definer owner execution, as linked in the final report.

# Final Physical Data & Runtime Design Review

**Status:** IMPLEMENTING — documentation-only independent review.
**Date:** 2026-10-11
**Approval:** The user's attached request explicitly authorizes the final independent physical/runtime review and bounded technical corrections to physical documentation (section 53). Exact request: `plans/approved/2026-10-11-final-physical-runtime-review-REQUEST.txt`. No product behavior or implementation approval is inferred.
**Prior task:** draw.io rendering task remains pending its existing commit gate; exact pointer captured verbatim in `plans/archive/2026-10-11-drawio-native-render-parity-PENDING-CAPTURE.md`. This review neither completes nor commits that work.

## PLAN / REVIEW / APPROVE

- Review all physical artifacts against latest PO decisions, ADR-030–036, active requirements/UC/traceability and approved logical modeling.
- Audit all 34 tables, Unit persistence, auth/runtime privileges, immutable history, transactions, retries/concurrency, indexes, four physical ERD views and conditional rebuild safety.
- Produce a durable A–S final review, per-table necessity audit and logical-to-physical mapping with evidence and exact findings.
- Correct only clear technical documentation defects; product gaps become NEEDS PO DECISION. Preserve approved modeling and historical records.
- Authorized writes: `docs/design/physical/` review/corrections/render/verification artifacts; task approved/request/baseline/archive records and indexes; task/status pointers in `docs/README.md`, `docs/QUICK-REF.md`, `HANDOFF.md`; append-only test/development/decision logs as applicable. No application, Prisma, SQL, seed, dependency, database, staging or commit actions.
- Direct bounded documentation authorization satisfies APPROVE under AGENTS.md. Save immutable scope snapshot and baseline before corrections.

## Acceptance / verification

- Every requested concern receives a substantive verdict, including all 34 persisted tables and all four manually inspected ERD views.
- Separate proposed design approval/readiness from unverified runtime/live deployment and destructive rebuild permission.
- Run physical verifier and record observed output, including historical-baseline failures without pretending they are current defects; add a current review scope/evidence check if necessary.
- Validate local links, semantic security/scope scan, ERD source/render integrity, `git diff --check`, `git diff --stat`, new-file line counts and preservation of preexisting files/index/HEAD.
- Render ERD and reinspect affected views after any source correction.
- Append observed test/development evidence. Update handoff and task state after completion. Stop at final review; implementation planning is a separate task.

## Progress

- [x] Entry sources and request read; prior dirty workspace/index inspected.
- [x] Review scope/authorization recorded; immutable request and baseline captured.
- [ ] Full independent semantic review and per-table/mapping audits.
- [ ] Bounded technical corrections, if warranted, and relevant rechecks.
- [ ] Observed verification, logs, final A–S report and handoff.
- [ ] DONE; no stage/commit authorized.

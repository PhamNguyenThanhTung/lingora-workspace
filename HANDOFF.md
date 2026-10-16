# Lingora — Current handoff

**2026-10-16 · Pre-design cleanup / repository audit DONE — READY TO CONTINUE CLASS DESIGN.**

[Current task](plans/current-task.md) is the sole status pointer (cleanup DONE; no follow-on active); [audit](docs/repository-audit-2026-10-16.md) records KEEP/UPDATE/DELETE/REVIEW and actual implementation. The former contradictory task pointer is preserved exactly in [superseded capture](plans/archive/2026-10-16-pre-cleanup-task-pointer-SUPERSEDED.md). Unfinished class completion and Activity v2 are superseded as active tasks, not declared complete.

**Design boundary: CLASS DIAGRAM IN PROGRESS.** Approved scoped ADR-030–036/041/042, current UC catalog and eight active Activity behaviors are the starting sources. Three roles only: Admin, Teacher, Learner. Current indexes distinguish later physical/sequence/data proposals and old Phase 2 planning from today's next work.

**Recoverable interrupted work:** DOM PUML/PNG/SVG and [class candidate](docs/modeling/current-target/evidence/2026-10-12-class-design-completion/candidate.drawio) contain23 classifiers/28 relations, Unit/AssessmentBlueprintVersion. The primary44-page native DOM remains23/24, LogicalUnit/AssessmentVersion. [Class report](docs/modeling/current-target/class-design-completion-2026-10-12.md) has no completion/merge closeout. [Activity v2 candidate](docs/modeling/current-target/evidence/2026-10-12-ad-layout-v2/) differs on eight ACT pages; entry matches primary, candidate-only PASS is not saved acceptance. All these artifacts remain unchanged.

**Actual implementation:** learner SSR authentication/registration/logout and vi/en UI foundation; no core learning flows, Admin app or AI runtime. Prisma/migration/seed artifacts retain old incompatible role/data assumptions; live DB/deployment unverified. The package aliases for Admin do not provide an app.

**Next permitted action after cleanup:** record a separately authorized class task to review and complete the existing Class Diagram against UC/Activity/scoped ADRs, then explicitly handle any DOM merge. Do not run full-bundle builders or proceed to physical approval, migration or implementation. Raw manifest provenance differences remain documented; no full-verifier or fresh visual approval is claimed.

**Verification:** exact deletion allowlist, 1,138 protected hashes, original task capture/log prefixes, changed-document links, plugin JSON/targets and 51 mirrored skill files checked; independent final review found no blockers. T-PRE-DESIGN-CLEANUP-001 records observed output and known raw-source provenance gaps. Runtime/live DB/fresh rendering N/A. Cleanup committed locally after TEST/LOG; no push requested.

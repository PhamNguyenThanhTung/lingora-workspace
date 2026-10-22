# Lingora

Lingora is in the **design stage** for a language-learning platform with three business roles: **Admin, Teacher, Learner**. Use Case, Activity and Class baselines are established. The [latest design review](docs/design/full-design-review-2026-10-21.md) leaves three P2 findings open; the physical database design remains a proposal.

On 2026-10-22, the owner identified the old application as obsolete and requested its removal. The legacy `lingora-web/`, `lingora-admin/` and root npm workspace configuration have been removed from the checkout. Their code, tests, Prisma schema, migrations and seed remain recoverable from Git at `84baa85`. They do not count toward implementation progress of the new design. Design/report tooling remains available; no application for the new design is implemented here.

The [current correction and cleanup plan](plans/2026-10-22-design-corrections-and-legacy-cleanup-plan.md) covers RDR-01–03 and Supabase connection instructions. Database deployment remains unverified; no online database was modified. The [2026-10-16 audit](docs/repository-audit-2026-10-16.md) is a dated historical snapshot.

## Start here

Read [agent rules](AGENTS.md), then the entry order defined there: [current task](plans/current-task.md), [quick reference](docs/QUICK-REF.md), [handoff](HANDOFF.md), [documentation authority map](docs/README.md). The workflow has one authority, `AGENTS.md`; Superpowers skills supply reusable methods. [Environment notes](ENVIRONMENT.md) distinguish historical setup from this checkout.

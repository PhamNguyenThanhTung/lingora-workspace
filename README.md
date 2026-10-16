# Lingora

Lingora is being redesigned as a language-learning platform with three business roles: **Admin, Teacher, Learner**. Use Case and Activity form the behavioral baseline; **Class Diagram is in progress**. Later sequence/data/physical designs and implementation roadmaps are retained references requiring reconciliation after class review.

The repository contains learner authentication/registration and a Vietnamese/English UI foundation in `lingora-web/`. `lingora-admin/` contains older Prisma/migration/seed artifacts, not an Admin application. Main learning flows and AI runtime are absent; database deployment is unverified.

The [2026-10-16 cleanup audit](docs/repository-audit-2026-10-16.md) identifies current design sources, the unfinished PUML/native class merge, retained legacy artifacts and verification limits.

## Start here

Read [agent rules](AGENTS.md), then the entry order defined there: [current task](plans/current-task.md), [quick reference](docs/QUICK-REF.md), [handoff](HANDOFF.md), [documentation authority map](docs/README.md). The workflow has one authority, `AGENTS.md`; Superpowers skills supply reusable methods. [Environment notes](ENVIRONMENT.md) distinguish historical setup from this checkout.

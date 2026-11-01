# Slice10 approved migration result

Owner approved LessonConsumption design/access semantics and DEV apply on2026-11-01. Codex promoted the draft to `20261101000000_lesson_consumption` and merged only its model/three inverse relations into the single product Prisma schema.

## Executed checks

- `npm run db:product:validate`: exit0.
- Prisma `migrate diff --from-empty --to-schema-datamodel lingora-admin/prisma/product/schema.prisma --script` with loopback placeholder config: exit0; generated SQL used for isolated mapping comparison.
- `node tmp/slice10/migration-check.mjs`: exit0 on disposable PostgreSQL17.11. Up/FK/RESTRICT/unique/cardinality/version/time/security/consumption-context-guard and empty/nonempty rollback checks PASS. SQL/Prisma columns/FKs/indexes match. SQL UNIQUE constraint and Prisma UNIQUE index enforce equivalent cardinality. [Detailed evidence](migration-local-check.json).
- Scoped DEV precheck through existing trusted Prisma connection, RepeatableRead+READ ONLY: exact prior context guard,5 finished migrations, table absent, PostgreSQL17.11. [Evidence](migration-precheck.json).
- `npm run db:product:migrate`: exit0. Only the new additive migration applied. Existing migration files/ledger were retained.
- Scoped DEV postcheck, RepeatableRead+READ ONLY:6 finished migrations; prior5 entries unchanged; exact columns/FKs/indexes; enabled/forced RLS with no client grants/policies; exact new guard; reading row count0/no backfill; graded constraints/triggers byte-equal at query-result level. [Evidence](migration-dev-verified.json).
- `npm run db:product:generate`: exit0. Generation is client mapping preparation; DEV catalog is the separate database proof.

## Rollback

[Guarded procedure](../../migrations/slice-10-consumption.rollback.sql) was executed only in the owned temporary cluster. Nonempty table refused rollback without deleting rows; empty rollback restored the exact prior function and dropped only the new table with RESTRICT. The temporary cluster was stopped and its data removed. No DEV down migration was run. After any real reading history, roll back the app while retaining the table/guard; removal requires a separate retention decision.

No attempt/response/completion/SRS/level data were written by migration validation or apply. No generic forensic/closure harness, database reset, role/global grant change or migration-in-build hook. App implementation and local/public feature acceptance are still required.

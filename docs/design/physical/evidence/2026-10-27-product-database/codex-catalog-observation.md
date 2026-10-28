# Codex read-only DEV catalog observation

Date: 2026-10-27. Target: user-authorized dedicated Supabase DEV project `sncfyvpzwedqgwfpffkh`.

This is a read-only observation, not DATABASE READY acceptance or a replacement for the independent review.

From repository root, Codex used installed Node `pg`, parsed the ignored `lingora-admin/.env` in memory, checked exact project/user/host agreement, and connected with eight-second connection/statement timeouts. No secrets were printed. Every catalog query ran inside `BEGIN READ ONLY` followed by `ROLLBACK`; no schema, data, provider identity, or privilege was changed.

Queries observed server version/current role, `pg_tables` in `app`/`app_private`, migration-history schema, and non-internal `pg_trigger` counts. Observed results:

- PostgreSQL `17.11`; connection role `postgres` (trusted DEV credential, not evidence of least-privilege runtime authorization).
- All 34 named canonical product tables present: 29 in `app`, five in `app_private`.
- Additional Prisma metadata table `app._prisma_migrations` present; excluded from product count.
- Non-internal triggers: 28 in `app`, seven in `app_private`.
- Catalog inspection exited 0.

The first read-only connection attempt exited 1 with `SELF_SIGNED_CERT_IN_CHAIN`: installed `pg-connection-string` interprets `sslmode=require` as `verify-full`. The second used its explicit `uselibpqcompat=true` option for libpq `require` semantics, with TLS encryption, and exited 0. This connection-only option was applied in memory; the secret file and product source were not changed. Certificate verification/hardening is not claimed by this observation.

Presence/counts do not prove full canonical column/check/guard behavior. The original review and correction review determine outstanding implementation defects; the worker's claimed 12/12 smoke result is not independent acceptance.

# Lingora Local Environment

> **Current setup reference (2026-10-28):** Reconciled under documentation cleanup package `DOC-CLEAN-01`.

## 1. Repository Structure & Toolchain

- **Workspace:** Single npm package/workspace under `lingora-admin/`. Package dependencies are defined in `lingora-admin/package.json` and locked in `package-lock.json`.
- **Runtime & Build:** Currently, no web framework (Next.js/React runtime), API routes, UI components, or `dev`/`build` execution scripts are implemented in this checkout.
- **Node & Tooling:** Node.js (v20+ recommended) and standard npm.

## 2. Environment Variables

- Configuration variables reside in `lingora-admin/.env` (ignored by Git; never commit credentials, secret keys, or real endpoints).
- Standard connection variable names:
  - `DATABASE_URL`: Connection string for Prisma Client and runtime queries.
  - `DIRECT_URL`: Direct database connection string (if pooler is used).
- Do not commit service role keys, JWT secrets, or administrative credentials.

## 3. Database Operations

- The product database foundation is maintained in `lingora-admin/prisma/product/`.
- Standard Prisma CLI commands (e.g., `npm run db:product:generate`, `npm run db:product:migrate`, `npm run db:product:seed`) are documented in [lingora-admin/prisma/product/README.md](lingora-admin/prisma/product/README.md).
- Note: Neither `npm ci`, Prisma client generation, nor database connections/migrations were executed as part of this documentation cleanup.

## 4. Test Harness Status

- The disposable native Supabase test harness in `lingora-admin/tests/database/` is **PARKED** and not part of normal application startup or development.

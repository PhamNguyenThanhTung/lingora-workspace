# Lingora Local Environment

This file records the M1.1/M1.2 environment boundary and the approved M1.6W Web foundation runtime.

## Required toolchain from the canonical architecture

| Area | Required baseline | Detected on 2026-08-14 |
|---|---|---|
| Version control | Git | Git 2.53.0 |
| Admin tooling | Node.js/npm; exact project dependencies belong to an approved subtask | Node.js 24.14.0; npm 11.9.0 |
| AI API | Python 3.11 | Python 3.11 available through `py -3.11`; the `python` command is not currently usable |
| Web learner | Node.js/npm; exact project dependencies belong to an approved `M1.6W` subtask | Node.js 24.14.0; npm 11.9.0 |

The M1.6W dependency lockfile is `lingora-web/package-lock.json`. Install with `npm ci` from `lingora-web/`.
Playwright Chromium is installed separately by `npx playwright install chromium` when the local browser cache
is absent.

Tool versions in `docs/01-architecture.md` remain authoritative. Detected versions are observations, not automatic approvals to upgrade or change the baseline.

## Repository boundaries

- `lingora-web/`: Project 1 Web learner application (Next.js App Router).
- `lingora-admin/`: Project 1 administration boundary and future Prisma owner.
- `lingora-ai/api/`: FastAPI integration surface.
- `lingora-ai/ml_srs/`: ML-owned SRS research code boundary.
- `lingora-ai/nlp_chatbot/`: NLP-owned chatbot research code boundary.

M1.1 creates boundaries and non-secret configuration templates only. Later gated subtasks create build files, dependencies, schemas, endpoints, UI, and model code.

## Secret handling

1. Copy the relevant `.env.example` to a local ignored `.env` file only when its implementation subtask begins.
2. Never commit real Supabase URLs, keys, JWT secrets, database credentials, model paths, access tokens, or local environment files.
3. `SUPABASE_SERVICE_ROLE_KEY` is server/Admin-only and must never be placed in `lingora-web` or any client-side code.
4. `SUPABASE_JWT_SECRET` is server-only and must not be logged.
5. `MOCK_MODE` belongs to the FastAPI runtime, not to the Web application.

## Supabase database connection strategy (M1.2)

- Canonical provider: Supabase PostgreSQL, region `ap-southeast-1`.
- Approved mode: Shared Pooler / Session mode.
- Host: `aws-0-ap-southeast-1.pooler.supabase.com`.
- Port: `5432`; database: `postgres`.
- User: `postgres.oazmbpifslcpolkepyge`.
- `DATABASE_URL` is supplied privately through the pooler connection configuration.
- Direct connection is not used because the current project requires IPv6 for it.
- No Dedicated IPv4 Add-on is required or approved.
- `DIRECT_URL` remains an environment-name placeholder only until a separately approved connectivity decision changes this strategy.
- Never commit the password or a complete connection URI; keep credentials in ignored local/host configuration.

The database is online and canonical, but M1.2 remains in `REVIEW`: no schema, migration, table, RLS, SQL or seed has been created or run.

## Current startup state

For the Web learner foundation, copy `lingora-web/.env.example` to an ignored `.env.local`, provide the two
public Supabase values and fixed server-only `AI_API_BASE_URL`, then run `npm run dev` in `lingora-web/`.
The M1.5 FastAPI runtime must run separately with `MOCK_MODE=true` for protected SRS/Roleplay checks.

## Git repositories & remote strategy

- **Private Workspace Repository (Full workspace with Agent logs & plans):**
  - Remote: `origin`
  - URL: `https://github.com/PhamNguyenThanhTung/lingora-workspace`
  - Purpose: Preserves the entire development history, code, database migrations, plans, test logs, and agent configurations.

- **Public Submission Repository (Clean submission for instructors):**
  - Source snapshot: `staging/lingora-workspace-public/`
  - URL: `https://github.com/PhamNguyenThanhTung/BTL`
  - Purpose: Contains only clean source code, canonical architecture/requirements docs, and READMEs for academic review, excluding internal agent plumbing and logs.

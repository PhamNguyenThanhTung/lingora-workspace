# Lingora Task-Local Disposable Supabase Environment

## Overview

This directory provides configuration for a reproducible, task-local, disposable Supabase environment for Lingora database feasibility testing (P0/P1).

## Proven Native Runtime (`--runtime native`)

- **Host Requirements**: Linux amd64 with glibc >= 2.35. (Verified on Ubuntu 24.04 LTS, Linux 6.8, glibc 2.39).
- **Execution Mechanism**: Supabase CLI 2.121.0 native runtime (`SUPABASE_EXPERIMENTAL_STACK=1`, `supabase stack start --runtime native`) starts services directly as user-space host processes without requiring root, sudo, Docker, or Podman.
- **Services Started**: Native PostgreSQL 17.11, GoTrue Auth v2.197.0, Storage v1.82.1, PostgREST v16.4, Realtime v2.143.4, Mailpit/Inbucket mail sink.
- **Session Pooler Status**: `db.pooler` is disabled by default in `config.toml` for the local native stack; native connections connect directly to PostgreSQL on port 54322. Session-pooler availability for A2 must be evaluated separately or provisioned explicitly.
- **State Isolation**: Runtime state, sockets, and ephemeral data are kept strictly in ignored task-local directories (`.supabase/`, `.supabase-home/`, `.local-stack/`).

## Lifecycle Commands

Managed through `lingora-admin` npm scripts:

| Command | Action |
|---|---|
| `npm run stack:start -w lingora-admin` | Start task-local native Supabase stack and verify real readiness |
| `npm run stack:status -w lingora-admin` | Probe status and readiness of local services |
| `npm run stack:stop -w lingora-admin` | Stop running task-local services cleanly |
| `npm run stack:destroy -w lingora-admin` | Permanently tear down stack and discard disposable data |
| `npm run env:check -w lingora-admin` | Run strict fail-closed environment allowlist check |

## Security & Fail-Closed Boundaries

- **Allowlist Enforcement**: All database and API connections must resolve to `127.0.0.1` or `localhost` on allowlisted ports for the `lingora-local-dev` project. Foreign hosts or remote domains trigger an immediate fail-closed abort.
- **Zero Real Secrets**: All JWT keys, service keys, and passwords are freshly generated synthetic local values. They are never committed to git, never echoed to logs, and sanitized before evidence recording.
- **No Old Environment Loading**: Inherited `.env` files are never parsed; tests strictly construct or load task-local synthetic parameters.

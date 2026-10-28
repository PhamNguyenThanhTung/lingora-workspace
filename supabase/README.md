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

Managed through `lingora-admin` npm scripts and the direct `stack-manager.mjs` dispatcher:

| Command | Action |
|---|---|
| `npm run stack:start -w lingora-admin` | Start task-local native Supabase stack (requires `--new-run` to allocate fresh run or `--run <run-id>` to resume existing run) |
| `npm run stack:status -w lingora-admin` | Probe status and readiness of local services (requires `--run <run-id>`) |
| `npm run stack:stop -w lingora-admin` | Stop running task-local services cleanly (requires `--run <run-id>`) |
| `npm run stack:destroy -w lingora-admin` | Permanently tear down stack, auto-prune cache, and retain tombstone (requires `--run <run-id>`) |
| `npm run env:check -w lingora-admin` | Run strict fail-closed environment allowlist check |

### Exact Bounded Recovery & Prune CLI

Direct CLI entrypoints via `node lingora-admin/tests/database/env/stack-manager.mjs`:
- `node lingora-admin/tests/database/env/stack-manager.mjs recover --run <run-id>`:
  - Exact bounded recovery for authorized pending runs in phase `RESERVED` with `pending_operation: 'prepare'`.
  - Verifies harness lock owner PID is dead under system boot ID; denies if alive or unknown.
  - Verifies exactly one candidate stack in native registry, stops/destroys orphan provider instance, confirms registry absence and socket quiescence.
  - Persists atomic tombstone receipt with full tuple provenance, unlinks stale credentials, and auto-prunes cache.
- `node lingora-admin/tests/database/env/stack-manager.mjs prune --run <run-id>`:
  - Bounded cache prune for runs in phase `DESTROYED` with `tombstone: true` and `pending_operation: null`.
  - Acquires exclusive `.prune.lock` and namespace reservation; verifies process, socket, and native state quiescence.
  - Removes only regenerable `home/cache/` within run control root; never escapes parent; preserves config and fixture.

## Security & Fail-Closed Boundaries

- **Allowlist Enforcement**: All database and API connections must resolve to `127.0.0.1` or `localhost` on allowlisted ports for the `lingora-local-dev` project. Foreign hosts or remote domains trigger an immediate fail-closed abort.
- **Zero Real Secrets**: All JWT keys, service keys, and passwords are freshly generated synthetic local values. They are never committed to git, never echoed to logs, and sanitized before evidence recording.
- **No Old Environment Loading**: Inherited `.env` files are never parsed; tests strictly construct or load task-local synthetic parameters.
- **Clean Namespace & Pending Guard**: Inspects the authorized namespace before allocation; denies new runs with `PENDING_GUARD_FAIL` if prior pending operations or unresolved locks exist.
- **Minimum 8 GiB Available Disk Guard**: Evaluates available disk space via `statfs` before fresh allocation; unknown observations or available space < 8 GiB fail closed with `DISK_SPACE_FAIL`.
- **Auto-Pruning on Destroy**: Destroy commands auto-prune per-run regenerable caches (`home/cache`) while retaining truthful `owner.json` tombstones and receipts. Failure to prune surfaces `CLEANUP_INCOMPLETE`.

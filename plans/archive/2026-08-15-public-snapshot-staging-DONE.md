# Task

public-snapshot-staging - Prepare Reviewable Public Workspace Snapshot

## Status

DONE

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Parent Milestone

Infrastructure / Documentation - public delivery preparation, no product behavior change.

## Immutable References

- Audit request and PUBLIC / PRIVATE / UNCERTAIN classification: conversation 2026-08-15
- Target repository name: `PhamNguyenThanhTung/lingora-workspace`
- Workspace Git baseline: commit `46130d5`
- Private workspace and existing Git history must remain intact.

## Objective

Create a separate, non-Git staging snapshot at `staging/lingora-workspace-public/` containing
only the approved public allowlist. Produce public-safe root and documentation READMEs, add a
snapshot-specific `.gitignore`, preserve source/schema/migrations byte-for-byte, and verify that
the snapshot contains no private workflow material or credentials.

## Files Expected To Change

- `plans/current-task.md` - lifecycle updates
- `plans/archive/2026-08-15-agent-workflow-hardening-DONE.md` - preserve completed uncommitted plan
- `staging/lingora-workspace-public/**` - new standalone snapshot without `.git/`
- `logs/test-log.md` - verification evidence after implementation
- `logs/development-log.md` - completed-work record after implementation
- `HANDOFF.md` - update only when the task reaches DONE or BLOCKED

Within `staging/lingora-workspace-public/`, the only authored files are:

- `README.md` - public-safe replacement for the internal root README
- `docs/README.md` - public-safe documentation map
- `.gitignore` - public snapshot ignore rules

All other snapshot files must be copied byte-for-byte from the approved PUBLIC allowlist.

## Public Allowlist

- `DESIGN.md`
- `docs/01-architecture.md`
- `docs/02-requirements.md`
- `docs/03-api-contract.md`
- `docs/04-data-model.md`
- `docs/05-traceability-matrix.md`
- `docs/project-1/**`
- `docs/ml/**`
- `docs/nlp/**`
- `lingora-admin/.env.example`
- `lingora-admin/README.md`
- `lingora-admin/package.json`
- `lingora-admin/package-lock.json`
- `lingora-admin/prisma/schema.prisma`
- `lingora-admin/prisma/migrations/**`
- `lingora-admin/prisma/m1_3_security_test.js`
- `lingora-ai/README.md`
- `lingora-ai/api/.env.example`
- `lingora-ai/api/README.md`
- `lingora-ai/ml_srs/README.md`
- `lingora-ai/nlp_chatbot/README.md`
- `lingora-android/.env.example`
- `lingora-android/README.md`

## Explicitly Out Of Scope

- Creating `.git/` inside the snapshot or changing workspace `.git/`
- Creating a GitHub repository, commit, tag, branch, remote, or push
- Copying `.agents/`, `.codex/`, `AGENTS.md`, `HANDOFF.md`, `plans/`, `logs/`,
  `docs/00-master-plan.md`, `docs/QUICK-REF.md`, or `ENVIRONMENT.md`
- Copying any real `.env`, credentials, local artifacts, dependency directories, caches,
  model files, datasets, APK/AAB, editor metadata, or build output
- Adding a `LICENSE` before explicit human approval
- Editing source code, Prisma schema, migrations, database state, dependencies, or package metadata
- Claiming that Android, AI, or Next.js applications are buildable before their scaffolds exist

## Review

- Architecture: preserves the three approved repository boundaries without changing ownership.
- Requirements: retains submission-facing architecture, requirements, contracts, data model,
  traceability, design, and report scaffolds.
- Security: uses an explicit allowlist, scans snapshot content and filenames, excludes real `.env`,
  and checks that no private workflow references remain in the two rewritten READMEs.
- Reproducibility: retains npm lockfile, Prisma schema, migration lock and all migrations, environment
  templates, component READMEs, and `m1_3_security_test.js`; documents current scaffold limitations.
- Scope: snapshot-only writes; originals remain untouched.

## Test Plan

1. Confirm `staging/lingora-workspace-public/.git` does not exist and workspace `.git` is unchanged.
2. Enumerate every snapshot file and compare it against the allowlist.
3. Verify prohibited paths/names are absent, including private workflow directories and real `.env`.
4. Require zero references to `AGENTS.md`, `plans/`, `logs/`, `HANDOFF.md`, `.agents/`, `.codex/`,
   approval-gate language, or private workflow material in the authored `README.md` and
   `docs/README.md`. Scan all other copied PUBLIC canonical files and report any remaining
   references without modifying those canonical files.
5. Run secret-pattern scans for common cloud/GitHub/OpenAI/Supabase/database/private-key formats.
6. Confirm `.env.example` files contain only empty, boolean, or documented placeholder values.
7. Byte-compare copied source, schema, migrations, lockfile, test script, and report artifacts with originals.
8. Run `npm ci --ignore-scripts` and `npm run prisma:validate` from an isolated copy or existing dependency
   boundary without modifying source; record observed output. Do not run migrations or touch the database.
9. Record exact file inventory, line counts for authored README/.gitignore files, `git diff --stat`, commands,
   outputs, exit codes, and verdicts in `logs/test-log.md`.
10. Run post-implementation quality review before marking DONE. No commit is authorized.

## Approval

Status: APPROVED
  Approved by: Pham Nguyen Thanh Tung
  Date: 2026-08-15

## Review Re-entry

- Date: 2026-08-15
- category: `scope-ambiguity`
- Gap: Test Plan item 4 requires the entire snapshot to contain no `logs/` or private-workflow
  references, but approved PUBLIC canonical documents contain such references and must be copied
  byte-for-byte. Satisfying both requirements would require editing canonical documents, which is
  explicitly out of scope.
- Proposed amendment: require zero private references only in authored `README.md` and
  `docs/README.md`; scan all other copied PUBLIC files and report remaining references without
  modifying them.
- Amendment decision: APPROVED by Pham Nguyen Thanh Tung on 2026-08-15.

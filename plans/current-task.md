# Task

M1.3-T-008 Amendment - Enforce Avatar 5 MB At Storage Bucket Boundary

## Status

DONE

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

This amendment addresses only the observed SEC-D8 PA2 avatar-size enforcement gap. It does not authorize implementation until a human explicitly approves the proposed Storage boundary, completes the Approval section, and an immutable approved snapshot is created under `plans/approved/`.

M1.3 remains incomplete. M1.4 must not start while this required M1.3 test is failing.

## Parent Milestone

M1.3 - Auth + RLS + Storage Authorization + `record_review`

## Immutable References

- `plans/approved/2026-08-14-m1.3-auth-rls-record-review-APPROVED.md`
- `plans/approved/2026-08-14-m1.3-sec-d8-storage-resolution-APPROVED.md`
- `plans/approved/2026-08-14-m1.3-sec-d8-pa2-direct-storage-APPROVED.md`
- `plans/approved/2026-08-14-m1.3-t-008-http-test-infrastructure-APPROVED.md`
- `ADR-005 - M1.3 Auth, RLS, Storage and record_review security semantics`
- Supabase Storage bucket restrictions: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Storage RLS access control: https://supabase.com/docs/guides/storage/security/access-control

## Observed Failure

The live Supabase Storage HTTP test established:

- Approved maximum avatar size: `5,242,880` bytes.
- Test upload size: `5,242,881` bytes.
- MIME type: `image/png`.
- Actor/path: authenticated learner uploading under the learner's own approved avatar path.
- Observed upload response: HTTP `200`.
- Service verification: the oversized object existed after upload.

`M1.3-T-008-HTTP-VALIDATION` therefore remains `FAIL` even though the other required Storage HTTP cases pass.

## Root Cause Review

The applied M1.3 implementation uses one private bucket, `lingora-media`, with a bucket-level size limit of `10,485,760` bytes because vocabulary audio may be up to 10 MB.

The avatar INSERT RLS policy additionally compares `storage.objects.metadata ->> 'size'` with `5,242,880`. Live HTTP evidence proves that predicate does not reject the oversized upload end to end in the deployed Storage request flow.

Supabase documents maximum file size and allowed content types as bucket-level upload restrictions. RLS on `storage.objects` is the authorization boundary for operations and object ownership. The robust server-side limit should therefore be enforced by the Storage bucket configuration rather than relying on object metadata inside RLS.

## Proposed Semantic Amendment

Replace the single mixed-size bucket contract with two private buckets separated by media class:

| Bucket | Purpose | Bucket limit | Allowed MIME types |
|---|---|---:|---|
| `lingora-avatars` | Learner-owned profile avatars | `5,242,880` bytes | `image/jpeg`, `image/png`, `image/webp` |
| `lingora-media` | ADMIN/service-managed vocabulary audio | `10,485,760` bytes | `audio/mpeg`, `audio/wav` |

Approved object-name formats remain:

- Avatar: `profiles/{userId}/{filename}` inside `lingora-avatars`.
- Vocabulary audio: `vocabulary/{vocabularyId}/{filename}` inside `lingora-media`.

The direct authenticated PA2 model remains unchanged: both buckets are private, anonymous access is denied, and authenticated requests are authorized by RLS.

## Why This Boundary Is Proposed

- Bucket restrictions are applied by Supabase Storage during upload and are the documented mechanism for maximum file size and MIME restrictions.
- A single bucket cannot simultaneously enforce a 5 MB maximum for avatars and allow 10 MB vocabulary audio using one bucket-level limit.
- Splitting by media class preserves both approved limits without adding an API, Edge Function, signed-URL service or application runtime.
- RLS remains responsible for actor, path, ownership, published-content visibility and delete permissions, not the byte-size enforcement that failed in live HTTP testing.

## Alternatives Reviewed

### A. Keep one 10 MB bucket and rely on RLS metadata size

Rejected as the proposed resolution because the live HTTP test already demonstrates that a `5,242,881` byte avatar is accepted.

### B. Reduce `lingora-media` bucket limit to 5 MB

Rejected because this would violate the approved 10 MB vocabulary-audio contract.

### C. Add client-only size validation

Rejected as a security boundary because untrusted clients can bypass it. Client validation may be added later for UX only, but it cannot make T-008 pass.

### D. Add a trusted upload API or Edge Function

Not proposed because it expands architecture/runtime scope and conflicts with the deliberately selected direct authenticated PA2 boundary unless separately approved.

## Proposed Implementation Scope After Human Approval

1. Create one new additive corrective migration; do not edit the applied M1.2 or M1.3 migrations.
2. Create/configure private bucket `lingora-avatars` with the exact 5 MB limit and avatar MIME allowlist.
3. Restrict `lingora-media` to vocabulary-audio MIME types while preserving its 10 MB limit.
4. Move avatar SELECT/INSERT/DELETE policies to `lingora-avatars` while preserving the approved owner/path/no-update semantics.
5. Keep vocabulary-audio policies on `lingora-media` with the existing ADMIN/service mutation and published-content learner-read semantics.
6. Update the T-008 HTTP harness to address the correct bucket per media class and rerun the full approved matrix.
7. Update ADR/canonical documentation and traceability to record the human-approved two-bucket correction.
8. Record observed test and development evidence.

## Files Expected To Change After Approval

- `lingora-admin/prisma/migrations/<new-m1.3-storage-size-correction>/migration.sql`
- `lingora-admin/prisma/m1_3_security_test.js`
- `docs/04-data-model.md`
- `docs/05-traceability-matrix.md`
- `logs/decision-log.md`
- `logs/test-log.md`
- `logs/development-log.md`
- `plans/current-task.md` for lifecycle/status updates
- `plans/approved/<approved-amendment-snapshot>.md` only after explicit human approval

No other file is authorized. If another file becomes necessary, return this task to `REVIEW`.

## Explicitly Out Of Scope

- Editing either applied migration `202608140001_init` or `202608140002_auth_rls_storage_record_review`.
- Prisma application-schema changes.
- Changes to Auth/Profile lifecycle, non-Storage RLS, `record_review`, API contracts or application business behavior.
- New API routes, Edge Functions, signed-URL runtimes or dependencies.
- Client-only validation as the security enforcement mechanism.
- `.env`, credentials, Stop-hook configuration or M1.4 work.
- Commit, amend, reset, history rewrite or push.

## Implementation Plan After Approval

1. Re-read the approved snapshot, ADR-005 and current deployed Storage state.
2. Verify M1.2/M1.3 migration hashes and confirm no test residue exists.
3. Inspect live bucket and Storage-policy definitions before drafting SQL.
4. Create an additive migration implementing the approved two-bucket boundary.
5. Review migration safety, compatibility and rollback implications before applying.
6. Apply the migration through the existing approved database workflow.
7. Update only the approved test harness paths/buckets.
8. Run the complete T-008 HTTP matrix and all relevant M1.3 security regressions.
9. Verify exact cleanup, schema/migration status, hashes, secret redaction and `git diff --check`.
10. Update approved canonical documentation, ADR and logs with observed evidence.
11. Re-audit T-001 through T-014. Move M1.3 to `DONE` only if every mandatory test passes or has a human-approved N/A.

## Test Plan

- `M1.3-T-008-SIZE-PREFLIGHT`: both private buckets have the approved size/MIME restrictions and expected policies.
- `M1.3-T-008-AVATAR-BOUNDARY`: `5,242,880` byte approved avatar succeeds; `5,242,881` byte avatar is rejected and absent.
- `M1.3-T-008-AUDIO-BOUNDARY`: approved vocabulary audio up to 10 MB remains supported; audio MIME/path rules remain enforced.
- `M1.3-T-008-HTTP-AVATAR-POSITIVE`: owner upload/read/new-filename replacement/delete passes on `lingora-avatars`.
- `M1.3-T-008-HTTP-AVATAR-AUTHZ`: cross-owner and wrong-path avatar operations remain denied.
- `M1.3-T-008-HTTP-ANON`: anonymous operations remain denied on both buckets.
- `M1.3-T-008-HTTP-VALIDATION`: invalid path/MIME, oversized avatar and overwrite are rejected.
- `M1.3-T-008-HTTP-AUDIO-WRITE`: learner mutation remains denied; ADMIN/service mutation remains allowed.
- `M1.3-T-008-HTTP-AUDIO-READ`: only published/reachable vocabulary audio is learner-readable.
- `M1.3-T-008-CLEANUP`: all exact temporary identities, content and objects are absent afterward.
- `M1.3-T-008-REGRESSION`: T-001 through T-014 supporting security checks pass without unrelated changes.
- `M1.3-T-008-HYGIENE`: applied migrations are current, original hashes unchanged, no credentials are exposed and `git diff --check` passes.

## Acceptance Criteria

- A `5,242,880` byte approved avatar can be uploaded by its owner.
- A `5,242,881` byte avatar is rejected by Supabase Storage and does not exist afterward.
- Vocabulary audio retains its approved 10 MB limit and MIME types.
- Ownership, anonymity, no-overwrite, delete and published-content rules remain unchanged.
- No applied migration is modified; the correction is additive.
- No API/runtime/dependency or M1.4 scope is introduced.
- Full T-008 and relevant M1.3 regression evidence is recorded without credentials.
- M1.3 remains non-DONE until the complete mandatory matrix passes.

## Review Against Project Controls

- Architecture: preserves direct authenticated Supabase Storage PA2; changes only bucket partitioning inside the existing Storage boundary.
- Requirements: restores enforceability of the already approved 5 MB/10 MB SEC-D8 limits; adds no product feature.
- API contract: no Lingora API path or response-envelope change.
- Data model: requires an additive Storage migration and policy correction; no Prisma application-table schema change.
- Security: moves size/MIME enforcement to the documented server-side Storage boundary and preserves least-privilege RLS.
- Compatibility: existing object URL data or deployed objects, if any, must be audited before migration application; no object move is authorized without exact evidence and approval.

## Approval

Status: APPROVED
Approved by: Human product owner
Date: 2026-08-14

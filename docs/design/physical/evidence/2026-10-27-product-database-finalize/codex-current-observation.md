# Codex targeted read-only DEV observation

2026-10-27. This confirms current applied state and the review's provenance defect; it is not DATABASE READY acceptance.

From repository root, Codex used installed Node `pg`, read the ignored admin `.env` in memory, required exact project `sncfyvpzwedqgwfpffkh`, validated both configured URL identities (provider host/user, port 5432, database postgres, no fragment or target override), and connected through DATABASE_URL with eight-second timeouts. Only catalog reads ran inside `BEGIN READ ONLY`, followed by unconditional `ROLLBACK` and disconnect. No credentials, provider identities or payloads were printed. The connection used documented `uselibpqcompat=true` require semantics in memory; certificate or runtime-principal hardening is not claimed.

Observed exit 0:

- PostgreSQL 17.11, database postgres, role postgres.
- Both migrations are finished and not rolled back: baseline checksum `69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862`; finalize checksum `b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16`. Preserve both applied files.
- `assignment_history` has `next_teacher_id` and `scope_generation`; it has neither `assigned_teacher_id` nor `generation`.
- Hosted `check_lesson_revision_provenance` and `check_item_revision_provenance` definitions contain `assigned_teacher_id`. Their definition hashes are respectively `4e23308ec0e8ae131656d3484803767cfa5821f117a78e323c7465680450fb96` and `e916f40827af03ad498d015c96499b4c913446e6f80bf65510da91eec353c61f`.
- Hosted `check_revision_review_provenance` definition hash: `ae70fb7d2d6a0936368ccd2a9c2ef60de593e8ab2e883526297734f04e40c90b`.
- Current noninternal trigger counts are 54 app + 8 app_private = 62, superseding the pre-finalize count of 35. Counts establish presence only; definitions/behavior still require acceptance.

The first catalog query attempt exited 1 with SQLSTATE 42809 because a `pg_get_functiondef` expression in a WHERE clause could be evaluated for an aggregate. It made no writes and rolled back. The corrected query selected only ordinary functions before examining their returned definitions; its results above are the successful observation. No mutation smoke was executed by Codex.

## After correction round 1/1

Codex repeated the same narrowly scoped read-only approach after Antigravity delivered, exit 0. Only catalog, privilege/capability metadata and the count of provider identities were read; no mutation smoke or resource creation was performed.

- Exact canonical inventory is still **29 app + 5 app_private = 34** product tables, plus only `app._prisma_migrations` metadata. The worker's correction report/current-task split of 33+1 is incorrect.
- All three history rows are finished, not rolled back and match local file SHA-256: baseline `69093deb1f9ed8d2350fda757a86546044c2a66eb6d58a4cef326928188d9862`, finalize `b3cea3d36ab2072b6ef839b957a96c484f9c79d63e01b13cadd4407e31545f16`, correction `3a5847261839367edd608065be3bcb8359bb11eeaaf7c0f51813231dbc1d9029`.
- Noninternal trigger count is now **61 app + 9 app_private = 70**, none disabled. Presence/enabled counts do not establish correct bindings or behavior.
- All 100 product FKs report DELETE RESTRICT / UPDATE NO ACTION. This grouped observation does not replace ordered target/column/uniqueness comparison.
- The only assessment_type-related CHECK on assessment_results is validated `assessment_results_assessment_type_nonblank_check`, definition `CHECK ((length(TRIM(BOTH FROM assessment_type)) > 0))`. The invented PLACEMENT/LEVEL_UP classification enum is absent. No valid-parent result mutation was performed.
- Corrected hosted creation functions contain no `assigned_teacher_id`. Definition hashes: `check_lesson_revision_provenance` = `65aedaeecec3176f685c12d9d8fde9d00ac96c41a7711d27d2ff1f78a677de34`; `check_item_revision_provenance` = `54124227d191d6179b9eb7fa1de5df0422dc68160d4ae7249628ee0dd9f098a9`; `check_revision_review_provenance` = `055fa03fee6e585cd52f09c14c841db528ed0b6ef6d7b31a2f61378b746b3cb3`; `check_assessment_version_snapshot` = `a0d0355a30fb015f2591b46a6fc0c64e7ce26d5a63e17e624185a54498ae7293`.
- Existing provider identity count is zero; no identities were created or inspected individually.
- Capability metadata: postgres is not superuser, **has CREATEDB**, owns database postgres, has USAGE on auth and SELECT on auth.users; auth schema owner is supabase_admin. These facts alone do **not** prove authentic schema-only transfer or another safe clean approach impossible. Clean migration proof remains unexecuted/unestablished; the worker's categorical B-ISO conclusion is not accepted by this observation.

This observation supports only the statements above. The final correction review determines the unresolved storage, target, smoke and evidence requirements; worker 10/10 labels are not independent acceptance.

## After owner-authorized targeted remediation

2026-10-27. Codex performed a fresh direct read-only observation on **both** configured routes, with exact provider host/user/ref, port 5432 and postgres database validated in memory. Each connection used eight-second timeouts, BEGIN READ ONLY, unconditional ROLLBACK and disconnect. Exit 0; no mutation probes or resource creation were performed. The two routes agree on the observed identity, exact table inventory, migration history, trigger counts and selected function definition hashes.

- PostgreSQL 17.11; exact 29 app + 5 app_private canonical product tables plus app._prisma_migrations.
- All four migration rows are finished, not rolled back, and match local files. The prior three hashes above remain unchanged; new `20261027030000_product_remediation` hash is `5026899d25e2bfd04bec69e7e74d8c84a71d13ce92344dde3f8999cf4e23dbf6`.
- 71 enabled noninternal triggers: 62 app + 9 app_private; none disabled. These counts alone do not establish full bindings or behavior.
- Hosted `check_lesson_attempt_scope` definition again contains the active-revision comparison. Definition hash `fb00a507893d29f8d2eee7bce85e0d0b4a2d2cad98444baf690dc2faa623fd86`.
- Selected other hosted definition hashes: `check_assessment_version_snapshot` = `1ebdf058063cd013ab4b409c937546feb173cbf3989e795680c2b3be9cdd5c93`; `check_lesson_available_revision` = `aa8d05bc3ce3b089836eb15789c01a8d1a448fff77bc5104331cff5e13cf187f`; `guard_item_revision_delete` = `b0367efb22446b3ad0eb312525ad2047fd3e838271ba40ad1dcfdcba48ff01bc`; `guard_item_revision_insert` = `8aea15804ebe9a82e734c0fb1dc932ef27ce6eb72e1daea07570486f52f31ff6`.
- No database currently named `lingora_test_tmpl` or matching `lingora_db_finalize_20261027_%` was found. This present-state observation proves neither a historical creation attempt nor its error/cleanup.
- Independent local tooling check `command -v pg_dump pg_restore psql` exited 1 with no paths. These tools are absent from current PATH; parked native resources were not searched or used.

The preflight's `inspectCleanProofCapability` still embeds a literal 55006 error string and returns infeasible without executing the claimed clone attempt. The delivered checks log repeats that helper output; it contains no actual CREATE DATABASE command/error capture. A template-clone failure, if observed, would constrain that method; it would not by itself disprove a faithful schema-only transfer. PostgreSQL's [pg_dump documentation](https://www.postgresql.org/docs/17/app-pgdump.html) documents schema-only export and no-owner restoration; superuser/auth-schema ownership alone is not a universal impossibility proof. No alternative method or clean replay was performed by Codex. Final acceptance remains for the independent remediation re-review.

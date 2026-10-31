# Slice 8 — Assessment Authoring Foundation

Planning date: 2026-10-31. Source revision: `222d6b2d9178e6cde0983f35d90a05aef143098e` (`main` / `origin/main`). Canonical requirements: `/home/tung/.codex/attachments/e9225076-e393-4e8a-8164-d3442148fb47/Pasted text.txt`, narrowed by `/home/tung/.codex/attachments/d5895b5c-60c6-4019-8adf-85fcb6f9fbae/Pasted text.txt`.

**Execution status: LOCAL ACCEPTANCE PASS; PUBLIC DEV ACCEPTANCE PENDING.** Product decision: active assigned Teachers author ASSESSMENT ItemRevisions through their own DRAFT LessonRevision and assignment episode; ACTIVE Admins manage Blueprints and assemble AssessmentVersions. This preserves truthful `createdBy` provenance and requires no migration. Admin revision mutation is forbidden; Teacher Blueprint/version mutation is forbidden.

## Locked scope and product contract

Slice 8 is **Assessment Authoring Foundation**. It includes typed Blueprint composition in existing JSON columns, Admin Blueprint CRUD, Teacher ASSESSMENT item revision authoring through assigned lesson provenance, Admin concrete `AssessmentVersion` assembly with exact immutable item revision pins, and reproducibility proof. It excludes sections, schema migrations, learner attempts/player, scoring or placement runtime, level-up decisions, adaptive selection, analytics, and Slice 9. Preserve accepted Slice 0–7 behavior and existing unrelated dirty files.

The application accepts only strict JSON objects, rejecting unknown keys:

```ts
coverage = {
  itemCount: positive integer,
  exerciseTypes: unique non-empty array of supported assessment exercise types,
}
requirements = {
  minimumItemsByType: partial record from allowed type to non-negative integer,
}
config = {
  shuffleItems: boolean,
  shuffleOptions: boolean,
}
```

`sum(minimumItemsByType) <= itemCount`; every minimum key must occur in `coverage.exerciseTypes`. A concrete version selects exactly `itemCount` unique ItemIdentity records and meets every minimum. Blueprint authoring may precede item-bank readiness. The allowed purpose values remain exactly `PLACEMENT` and `LEVEL_UP`.

## Verified persistence contract

Relevant schema: `lingora-admin/prisma/product/schema.prisma`; assessment-specific migrations are cited below.

| Model | Source-backed behavior |
|---|---|
| `AssessmentBlueprint` | Required creator, language, framework, and course FKs; optional target/next Level FKs; `purpose` String; JSONB `coverage`, `requirements`, `config`; positive `generation`, `coverageCatalogGeneration`, `rowVersion`. No title/code/status/active flag/sections. Course language/framework must match the Blueprint; each supplied Level must belong to the same Framework (`20261027010000_product_finalize/migration.sql`, `check_assessment_blueprint_scope`). Purpose CHECK in `20261027000000_product_baseline/migration.sql:1196` allows `PLACEMENT`, `LEVEL_UP`. Scope fields become immutable after any version exists (`20261027030000_product_remediation/migration.sql:565`). Application increments `rowVersion` for writes and `generation` when typed composition or scope semantics change; do not change `coverageCatalogGeneration` without a catalog change. |
| Item kind | There is no ItemRevision purpose/kind column. Purpose is `ItemIdentity.origin`, with DB values `PRACTICE` and `ASSESSMENT`; `ItemRevision.type` is one of `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR` (`item_revisions_type_check`, baseline migration `:1123`). `AssessmentVersionItem` requires ASSESSMENT origin, so PRACTICE revisions are never relabeled or reused. `LessonExercise` requires PRACTICE origin (baseline migration `:1545`). |
| `ItemRevision` | Stores the versioned payload, private `ItemGradingSecret`, `authoringLessonRevisionId`, `creationAssignmentEpisodeId`, optional Blueprint ID/generation pins, `isDraftOmitted`, `frozenAt`, and `createdBy`. Origin-pin trigger requires positive non-null Blueprint/generation pins for ASSESSMENT and both null for PRACTICE (`20261027020000_product_correction/migration.sql:903`). Revision identity/provenance is immutable; a new revision row is needed for edits. |
| Provenance / authorship | `check_item_revision_provenance` requires the creation episode's assignment to equal the authoring LessonRevision's assignment and `ItemRevision.createdBy = AssignmentHistory.nextTeacherId` (`20261027020000_product_correction/migration.sql:77`). `guard_item_revision_insert` rejects insertion after the source LessonRevision was submitted/frozen (`20261027030000_product_remediation/migration.sql:166`). Grading secrets also cannot be inserted after submission/freeze (`20261027020000_product_correction/migration.sql:451`). Lesson SUBMIT review actor must be that episode's assigned Teacher and requires the submitted facts (`20261027020000_product_correction/migration.sql:98`). |
| `AssessmentVersion` | This is the concrete version model; there is no root `Assessment` table. It pins Blueprint ID/generation, immutable `blueprintSnapshot`, `assemblyInputHash`, `versionNo`, status, and publication metadata. Unique Blueprint/version number and Blueprint/generation/input hash. Existing lifecycle CHECK values are `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`, `WITHDRAWN`; Slice 8 creates the model's default `IN_REVIEW` version and adds no review/publish runtime. |
| `AssessmentVersionItem` | Stores exact `itemRevisionId` **and** `itemId`, source LessonRevision, source SUBMIT review, contribution episode, position, positive Decimal(10,4) weight and `coverageTags`. Unique version/position and version/item identity. All FKs are restrictive. Eligibility trigger requires ASSESSMENT origin, frozen and non-omitted revision, matching Blueprint/generation pins, exact submitted LessonRevision/episode/SUBMIT tuple, and matching Course/language/Framework scope (`20261027020000_product_correction/migration.sql:156`). Published Lesson status is not required. |

The version snapshot must preserve the DB-required envelope (`blueprint_id`, `blueprint_generation`, `course_id`, `language_id`, `framework_id`, `purpose`, numeric `schema_version: 1`, `coverage_catalog_generation`, `config`, `target_level_id`, `next_level_id`; validated in `20261028010000_database_closure/migration.sql:309`). Include the typed `coverage` and `requirements` objects as additional frozen snapshot fields so later Blueprint edits cannot reinterpret composition. Keep database BigInts exact; API DTOs serialize them as decimal strings.

No current code path authors ASSESSMENT items. `lingora-admin/src/server/lessons/index.ts:2163–2166` creates PRACTICE identities, and `src/server/lessons/snapshot.ts:29–45` requires all lesson exercises to be PRACTICE and currently equates authored item revision count with exercise references. The new Admin authoring path must preserve these invariants and make source-revision child validation explicitly account for separate ASSESSMENT children without putting them into `LessonExercise`.

## Role boundary and source provenance

The product decision selects Teacher authoring and Admin management/assembly. The schema's `ItemRevision.createdBy = AssignmentHistory.nextTeacherId` rule is preserved as an accurate author attribution. Never spoof a Teacher, synthesize a Teacher SUBMIT review, or let an Admin write item revisions.

- ACTIVE ADMIN may create/list/read/update Blueprints; inspect submitted eligible ASSESSMENT item revisions; and assemble/read AssessmentVersions.
- ACTIVE assigned TEACHER may read eligible Blueprint metadata for the Teacher's assigned Course and author ASSESSMENT item revisions only on their own DRAFT LessonRevision, using its actual assignment episode. Teacher cannot mutate Blueprint or AssessmentVersion.
- LEARNER, disabled accounts, unassigned Teachers, and missing sessions are rejected at the server boundary.
- ItemRevision payload and `ItemGradingSecret` must be written before the exact source LessonRevision is submitted. The Teacher submits that exact source revision using the accepted Slice 7 flow. The existing SUBMIT review is the only allowed source identity. An Admin may not mark a LessonRevision submitted or create its provenance rows.

The source revision must be treated as a LessonRevision parent with two disjoint child categories: PRACTICE ItemRevisions referenced by `LessonExercise`, and ASSESSMENT ItemRevisions referenced by Blueprint/version assembly but never by `LessonExercise`. Extend existing snapshot validation minimally to account for valid ASSESSMENT children without weakening the PRACTICE exercise invariants or changing Slice 7 workflow semantics. The Teacher item editor must create the assessment child revisions under the current source revision; it must not submit an item outside the assigned Teacher's actual episode.

## Executable implementation contract after resolution

One Anti vertical package is appropriate; no parallel file ownership split. Own the Admin Assessment area, server services/routes, shared item-validation helpers only where safe, focused feature/component fixtures and evidence. Keep existing Teacher Lesson routes and public Slice 7 behavior intact apart from the narrowly required snapshot child accounting. No broad editor refactor.

### Blueprint service and UI

- Admin-only list/create/read/update. Verify ACTIVE ADMIN on every server boundary; reject Teacher/Learner, disabled accounts and unauthenticated calls.
- Derive language/Framework from selected Course; validate nullable Level FKs against that Framework. Whitelist `purpose`, scope fields and strict typed `coverage`/`requirements`/`config`. Do not accept client creator, generation, rowVersion, timestamps or arbitrary JSON.
- Persist strict schemas and reconcile client forms from server DTOs. Use expected `rowVersion` for stale edit conflicts. Increment `generation` on typed semantics/scope changes. Preserve DB immutability of Blueprint scope once versions exist. Never app-cascade restrictive history.
- Navigation can be one Assessments area with Blueprint, Item, and Version catalogue/detail flows. No section screens or invented Blueprint title/status fields; use purpose + Course/context + short ID for identity.

### ASSESSMENT item authoring

- Teacher item editor reuses Slice 6 type validators and forms where safe. The editor is scoped to the Teacher's assigned DRAFT LessonRevision and actual episode. Do not insert ASSESSMENT identities into LessonExercise or convert PRACTICE identities.
- Teacher may read/select only a Blueprint whose Course equals the assigned Lesson's Course. Server derives creator and episode from authenticated assignment state; client cannot spoof either.
- Create each ItemIdentity with `origin = ASSESSMENT` and each ItemRevision with the selected Blueprint ID/current generation pins, same source LessonRevision, exact creation episode and assigned Teacher `createdBy`. Create the grading secret in the same pre-submit transaction. Validate curriculum Course/language/Framework and current Blueprint generation under locks.
- Keep ASSESSMENT child revisions separate from LessonExercise. Extend lesson snapshot validation to validate PRACTICE exercise identity against the PRACTICE child set while accepting only well-formed separate ASSESSMENT children; cover Slice 6/7 save/submit regressions. Never weaken `LessonExercise` origin or PRACTICE checks.
- Editing creates a successor ItemRevision under the current DRAFT LessonRevision; after that source is submitted, further edits require a newer DRAFT LessonRevision/episode. Never update an existing ItemRevision or grading secret in place. Stale Blueprint generation makes an unassembled item ineligible and must be visible to Teacher as a recoverable validation state.

### Concrete version assembly

- Show only source-submitted ASSESSMENT item revisions matching selected Blueprint ID/current generation, curriculum scope, non-omitted state and valid exact source review tuple. On final assembly revalidate under transaction/locks.
- Require exactly `coverage.itemCount` selected unique ItemIdentity records; every type is in `coverage.exerciseTypes`; minimum type counts pass. Reject duplicates by item identity (DB unique key), stale generation, PRACTICE origin, wrong scope, missing/fake source review, unfrozen/omitted rows, and stale version number.
- Build the required DB snapshot envelope plus exact frozen `coverage` and `requirements`. `config` is server-read from the locked Blueprint. Compute `assemblyInputHash` as SHA-256 over canonical JSON of schema version, frozen Blueprint snapshot and ordered `(position,itemId,itemRevisionId,exactFingerprint)` selection; no grading secrets in hash.
- In one transaction lock Blueprint then selected items/source rows in a consistent order; mark selected ItemRevisions `frozenAt` monotonically, create `AssessmentVersion` with next version number, then create `AssessmentVersionItem` rows with server-derived provenance. Use position from explicit Admin ordering, `weight = 1.0000` as neutral required storage metadata, and `coverageTags = {}`; do not expose scoring semantics or runtime. Keep status default `IN_REVIEW`, `isActive=false`.
- Detail/retrieval resolves the persisted `AssessmentVersionItem.itemRevisionId` relation only. Never resolve latest ItemRevision. `AssessmentVersion` assembly pins are immutable under existing DB guard.

## Required local and mutation checks

Tests use production route/service/page callbacks rather than copied page logic. Auth coverage proves Admin can manage/assemble but cannot author item revisions, and an assigned Teacher can author items but cannot manage Blueprints or assemble versions.

- Blueprint: valid round trip; exact purposes; strict/unknown/malformed JSON; each count/type/minimum invariant; invalid FKs and Course/Framework/Level mismatch; ACTIVE ADMIN only; stale rowVersion conflict and retained form input; immutable scope after version exists; server DTO reconciliation.
- Item: each supported type; ASSESSMENT vs PRACTICE boundary; current Blueprint generation pins; actor/assignment/source provenance; grading-secret pre-submit ordering; item edit creates a successor revision; Admin/Learner/unassigned-Teacher rejection; source-child accounting and Slice 6/7 regression coverage.
- Version: valid exact pin; reject PRACTICE, unsupported type, insufficient/extra count, duplicate identity/position, stale generation, wrong context, unsubmitted or mismatched source review/episode, omitted/unfrozen revision and non-Admin. Exercise deterministic concurrent/stale assembly behavior.
- Reproducibility: assemble V1 with exact revision X; author and submit revision Y for same ItemIdentity using a new source revision; verify V1's production retrieval path still resolves X and its frozen prompt/grading reference.
- Production UI: real create/edit/assembly callbacks, exact API payloads, server DTO reconciliation, dependency retry, pending lock, conflict/error recovery, input retention, 401/403 and reload persistence.
- Mutations A–G from the canonical task: remove Admin guard; loosen Blueprint validation; allow PRACTICE in assembly; remove minimum composition validation; change exact revision to latest; remove applicable Framework/Level check; break production callback. Each intended assertion must kill its mutation; restore source byte-exact.
- After Anti handoff, Codex independently reviews source/diff and fixes findings directly. Run feature/component suites, applicable mutations, `npm run typecheck`, `npm run build`, and `git diff --check`. Do not rerun unrelated prior Slice gates.

## Public DEV acceptance after local gates

1. Deploy/push only the reviewed source commit; verify that exact commit is `Ready` at `https://lingora-workspace.vercel.app/` before live writes.
2. Use owned `DEV_S8_*` Blueprint/item/version fixtures and a compatible Teacher assignment/source LessonRevision. Do not mutate canonical curriculum/content. Have an assigned Teacher author the ASSESSMENT revisions before submitting their source LessonRevision through the actual public Teacher flow; then Admin assembles from the exact submitted item revisions.
3. Publicly create/edit typed Blueprint, author sufficient ASSESSMENT items, submit each source revision, assemble concrete version from selected exact revisions, create a newer submitted revision, and verify old version still resolves its original revision.
4. Cause a genuine invalid composition failure; show visible error and retained input, then valid retry succeeds.
5. Query DB read-only for Blueprint typed JSON, purpose/context, ItemIdentity origins, item revision IDs/generations/frozen state, source review/episode, version snapshot/hash, exact version item revision IDs and retrieval identity.
6. Restore safe fixture state. Restrictive history may remain only as explicit allowlisted `DEV_S8_*`; unexpected residue must be zero. Close browser/test session and retain no credentials/storage state.

## Local acceptance evidence

| Gate | Result |
|---|---|
| `npm run test:feature` | PASS |
| `npm run test:components` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS; Next reports existing Prisma dynamic-filesystem tracing warnings |
| Mutation controls A–G | PASS; each KILLED and mutation runner restored source byte-exact |
| `git diff --check` | PASS |
| Independent review | PASS; no actionable findings after conflict-scope refresh and pending-banner regressions |
| Schema migration | None |
| Live DEV writes / DB reads | Not started; wait for exact pushed commit deployment to be Ready |

Preserve dirty `AGENTS.md`, product README, and existing unrelated database plans; commit only Slice 8 source/evidence once public acceptance and fixture restoration are complete. Do not start Slice 9.

## Public DEV acceptance progress — 2026-10-31

- Initial exact deployment `dpl_FJ6UjBEBuQ3C3G2nXbrsTc7UFk6V` is READY at source commit `aa031136df708064090685317a9354acba26e73f` (rechecked before continuing live writes).
- Admin created and edited Blueprint `75bf3fab-5f33-44f2-9e28-62abfdcfe990` on the owned S5 DEV Course: LEVEL_UP, A1 → A2, generation/rowVersion 2, count 2, minimum MCQ 1 + FILL_BLANK 1, both shuffle flags false.
- User authorized temporarily enabling Teacher fixture `7d14d388-bb1e-4c57-877a-4f07ec2468d0`, authenticating, then restoring DISABLED. No recovery UI exists. User personally entered and submitted a temporary password through a one-use loopback-only helper using server-side Supabase Admin capability; helper exited afterward. No password/token/storageState was logged or saved. Credential rotation and persistent Supabase Auth audit entry are allowlisted; original unknown credential cannot be restored. User manually signed in through public login.
- Teacher authored three ASSESSMENT revisions on existing owned DRAFT source `fb9acf29-fdf2-488d-a7c1-71689eaadbe2` (r10), then publicly submitted that exact revision. DB read-only confirms SUBMIT `9a1c3e85-b815-4e0d-a418-1e3f3f5b1973`, actor = assigned Teacher, episode `32008c0d-b858-4752-82f1-0611f7f02e76`, generation 1.
- Genuine two-MCQ assembly failure showed minimum FILL_BLANK error and retained both selections. Correcting selection to MCQ X `52b7b90a-271d-4c15-a08a-d3b0d8ff668b` + FILL_BLANK `cdd24402-c63f-40c1-937a-eaf911a18ba3` exposed a public-only P2028 timeout: default interactive transaction 5000 ms expired at 5143–5144 ms during final version hydration. Vercel runtime logs identify both requests; DB read-only confirms zero versions after rollback.
- Narrow Codex fix: give assembly the same bounded 30000 ms transaction budget as lesson draft saves. Regression advances virtual database round-trip time beyond 5000 ms: RED (503) before patch, GREEN (201) after patch. Slice 8 feature 17/17, routes 4/4, components 8/8 PASS. No schema or product contract change. Public retry and remaining isolation/restore proofs pending patched deployment.

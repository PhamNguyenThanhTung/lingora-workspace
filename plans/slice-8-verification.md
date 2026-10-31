# Slice 8 verification — PASS / ACCEPTED

Date: 2026-10-31. Contract: [Assessment Authoring Foundation](2026-10-31-slice-8-assessment-foundation.md). Machine-readable evidence: [public DEV read-only snapshot and checks](2026-10-31-slice-8-public-dev-evidence.json).

## Accepted contract

ACTIVE Admins manage strict typed flat Blueprints and explicitly assemble concrete AssessmentVersions. ACTIVE assigned Teachers author ASSESSMENT ItemRevisions through their own DRAFT LessonRevision and assignment episode, then submit that exact source through the accepted Slice 7 flow. The DB-required Teacher author attribution is preserved. Admins cannot author revisions; Teachers cannot mutate Blueprints or assemble versions.

Blueprint JSON uses only typed coverage, minimum composition and shuffle configuration. Purpose values are PLACEMENT and LEVEL_UP. Assembly validates exact count, unique ItemIdentity, allowed types/minimum counts, Blueprint generation, curriculum scope and source SUBMIT provenance under locks. It freezes selected revisions and persists exact revision pins plus a frozen snapshot/hash. Retrieval reads persisted pins. No sections, schema/migration, learner attempts, scoring, placement/level-up runtime, or Slice 9 implementation.

## Local evidence and public fix

Initial implementation, full feature/component suites, typecheck/build, independent review and semantic mutation controls A–G passed at `aa031136df708064090685317a9354acba26e73f`. Unchanged gates were retained.

Public valid assembly exposed a real transaction-budget bug. Vercel logged expiration during final `assessmentVersion.findUnique()` at 5143–5144 ms against Prisma's default 5000 ms budget. Failing requests were `rm8p5-1793457468836-f7c91c8338fd` and `kjbf9-1793457502610-296a26582f94`. Read-only DB checks confirmed zero versions after rollback; the UI retained the valid selection.

Codex directly applied a one-line bounded 30000 ms assembly timeout, matching the existing lesson-save convention. A regression simulates serial database round trips past 5000 ms: RED (503) before the patch; GREEN (201) after it. No guards, payload validation, snapshot logic, pins or migrations changed.

| Affected patch gate | Result |
|---|---|
| Slice 8 domain/service feature tests | PASS, 17/17 |
| Slice 8 production route tests | PASS, 4/4 |
| Slice 8 production component callbacks | PASS, 8/8 |
| Typecheck / production build | PASS |
| Diff check and focused source review | PASS |

Build retained the existing generated-Prisma tracing/deprecation warnings. Unrelated prior Slice suites and mutations were not repeated for the timeout-only change.

## Exact public deployments

- Initial deployment `dpl_FJ6UjBEBuQ3C3G2nXbrsTc7UFk6V` was READY at exact commit `aa031136df708064090685317a9354acba26e73f` before initial writes. Teacher authenticated at its unique deployment hostname and retained that session for unchanged authoring/submission code.
- Patch deployment `dpl_ELB9ERMpRB3mGbwmdngC31T55yso` was READY at exact commit `0f73586ffd2278d39378418ba5f3c004b556e3aa` before live assembly retry. Production alias `https://lingora-workspace.vercel.app/` served the patched Admin assembly/retrieval and cleanup flows.
- The patch changes only the assembly transaction budget; the affected public flow was rerun after redeployment. Later evidence/document commits contain no product source changes.

## Public flow and exact identities

1. Admin created Blueprint `75bf3fab-5f33-44f2-9e28-62abfdcfe990` on owned Course `4a7024f1-d24a-42d8-9d3a-3591b67229ca`, then edited it from PLACEMENT to LEVEL_UP, A1 → A2. Persisted generation/rowVersion = 2, count = 2, allowed MCQ/FILL_BLANK, minima one each, shuffle flags false.
2. With the user's explicit authorization, the existing Teacher fixture was enabled temporarily. No recovery UI exists. The user personally entered/confirmed a temporary password into a one-use loopback form backed by server-only Supabase Admin `updateUserById` for that exact DEV Auth identity. The helper exited after success. The user signed in through public login; no password/token/storageState was captured or saved. Credential rotation and provider Auth audit history are explicitly retained; the unknown original password cannot be restored.
3. Teacher authored two MCQs and one FILL_BLANK under source r10 `fb9acf29-fdf2-488d-a7c1-71689eaadbe2`, then submitted that exact source. SUBMIT review `9a1c3e85-b815-4e0d-a418-1e3f3f5b1973` attributes the real assigned Teacher and episode `32008c0d-b858-4752-82f1-0611f7f02e76` / generation 1.
4. Selecting the two MCQs caused a genuine server minimum-composition failure for missing FILL_BLANK. Both selections/order and the error remained visible. Correcting to MCQ X plus FILL_BLANK encountered the timeout above; after the verified patch, the same retained valid selection successfully created exactly one version. [Failure/input retention](evidence/slice-8/invalid-composition.png).
5. V1 `7b9b26ec-246f-4159-ae42-4ec1c76ab75a` remains IN_REVIEW, inactive, with exact ordered pins:
   - X `52b7b90a-271d-4c15-a08a-d3b0d8ff668b`, ItemIdentity `f5e69deb-aa38-481d-af9e-e7c927050480`.
   - FILL_BLANK `cdd24402-c63f-40c1-937a-eaf911a18ba3`, ItemIdentity `c0f04ba0-7854-44d5-aa87-2b446e24b888`.
   - Both pin source r10 and its exact SUBMIT review/episode. Hash: `ec989434e51f37f7048e5e2d312c0856a75e5bd44561ddb85e8c6e93a4bd6072`.
6. Admin requested source changes. Teacher created source r11 `b0ba3173-3ff5-410c-b10e-dd839602ada3`, authored Y `0b779e34-26dc-4ed1-9a7c-b0b42aa5c17f` (same ItemIdentity as X, item revision #3), changed both prompt and grading reference, and submitted r11 through public UI. SUBMIT review: `9cb5867f-dda3-446e-83ef-f9b7b57f9be2`.
7. Reloaded Admin catalogue listed submitted Y. Production version-detail callback still returned original X, its source r10, original prompt and fingerprint, and unchanged hash/snapshot. Read-only DB independently confirmed both grading references use their own exact revision PKs, fingerprints match payloads, and V1 remains unchanged. [Pinned detail after Y](evidence/slice-8/version-after-submitted-Y-detail.png); [full UI identity state](evidence/slice-8/version-after-submitted-Y.txt).

## Read-only DB verification and restoration

All evidence queries used explicit READ ONLY transactions; the final snapshot used REPEATABLE READ. No direct domain DB writes were used. A transient local DB connection failure was retried without writes.

Final checks confirm Blueprint typed JSON/generations, ASSESSMENT origin, exact ItemRevision IDs, real source submission/episode/actors, monotonic freeze markers, snapshot/hash, prompt/grading-reference isolation, reviewer actors and unchanged publication pointer. Private grading payloads were checked in memory; only revision references/fingerprints and boolean results were retained in evidence.

After source r11 request-changes, Teacher created safe restoration DRAFT r12 `7426de56-5dc9-448a-9b5f-0a107d7709d4`. Its title/content and PRACTICE/vocabulary snapshots match source r10's baseline semantics. It retains explicitly allowlisted DEV_S8 assessment lineage cloned by the existing successor model. Teacher was logged out and restored to DISABLED, rowVersion 21; Teacher Auth session count is 0. Course remains inactive, Lesson availability PLANNED, owner/episode unchanged, and `activeRevisionId` still points to published r9 `a0dac479-6eae-44e0-ad3e-80c3ac8833e7`.

Persistent allowlist: one Blueprint, one inactive version/two pins, three ASSESSMENT identities/eleven ItemRevisions and their grading references, source histories r10–r12 with expected cloned PRACTICE/vocabulary children, four SUBMIT/REQUEST_CHANGES reviews and two Teacher enable/disable audit events. No command receipts were created. Exact IDs and per-table unexpected counts are in the JSON evidence. **Unexpected residue: 0.**

Both Teacher/Admin logout responses reached public login; both agent-created test tabs were closed. Only the pre-existing user Vercel tab remains. Temporary helper is stopped; no credentials or browser storageState were saved. Unrelated workspace changes remain outside the acceptance commits.

**SLICE 8: PASS — SLICE 8 ACCEPTED**

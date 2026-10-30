# Slice 2 — Canonical UUID Compatibility & Final Acceptance

Final status: **PASS / SLICE 2 ACCEPTED**, correction0/1. [Codex final review](evidence/2026-10-30-slice-2-canonical-uuid/review.md), [actual live A–E and cleanup](evidence/2026-10-30-slice-2-canonical-uuid/live-flows.md). Historical task FAILs preserved.

New independent task; previous FAIL/STOP histories stay unchanged. Codex directly plans/reviews, Anti implements/tests. New correction budget 0/1; one batch correction after review FAIL, then STOP if still FAIL. No Slice 3.

## Verified root cause and rule

Read product schema Framework (87–102), Level (104–126), seed CEFR (99) and deterministic Level IDs (129–132), service validator, all Slice 2 param boundaries and existing actual-page tests. Framework.id, Level.id and Level.frameworkId are @db.Uuid, with no UUID version/variant constraint. Seed CEFR is 00000000-0000-0000-0000-000000000010. Existing validator requires version1–5 and variant8/9/a/b, rejecting it before lookup. Prior live catalogue independently returned this exact ID.

Identifier rule for existing Slice 2 resource URLs: case-insensitive 32 hex digits in standard 8-4-4-4-12 representation, with no version/variant restriction. This represents every 128-bit stored UUID value. PostgreSQL always outputs that standard representation and stores any UUID regardless of version/origin: https://www.postgresql.org/docs/current/datatype-uuid.html . Its alternative SQL input spellings (braces, missing/additional hyphens) are distinct textual aliases, not additional stored values; expanding URL syntax/normalization is outside this repair. Reject malformed/short/long/nonhex strings and whitespace. No new UUID framework.

## Ownership / dependency DAG

U1 Anti: smallest shared-validator repair and canonical regression coverage -> U2 Anti targeted/full local gates + concise delivery -> R Codex independent source/test review and five mutation controls -> L Codex rebuilt3012 read-only canonical navigation -> A–E Codex owned DEV fixture CRUD/conflict/recovery/cleanup -> F Codex whole uncommitted Slice2 review, acceptance documentation, explicit allowlist commit/push origin/main.

U1 owns src/server/frameworks/index.ts and narrowly needed Framework/Level boundaries/tests/harness. All existing boundaries import/reexport the same validator: detail page; Framework GET/PATCH/DELETE; nested Level GET/POST/PATCH/DELETE parent/child params; Framework get/update/delete helpers; Level list/get/create/update/delete helpers. Preserve shared use; do not mechanically replace unrelated IDs. Canonical child IDs need coverage too. Parent comes from URL, scoped mutations retain both IDs.

## Acceptance

1. Actual canonical CEFR ID passes production validator, actual service lookup executes with exact ID, actual production detail TSX returns correct parent/Levels. Production catalogue renders CEFR and its actual generated href leads to production detail success. Reuse compileAndLoadPage/actual component seam; no copied page logic. Malformed ID still rejects, with no catalogue DB access.
2. Add focused tests for canonical parent and child across relevant API/service paths, plus nil/max/non-version1–5 UUID values as useful. Keep existing tests and acceptance strength.
3. Anti runs targeted canonical, actual production-page and parent-context tests; full feature (baseline150), components (baseline31), typecheck, build. Mechanical self-fixes before delivery allowed. Raw logs outside repo at /home/tung/.codex/task-logs/slice-2-canonical-uuid/; concise delivery only at plans/evidence/2026-10-30-slice-2-canonical-uuid/delivery.md . No copying raw logs/screenshots into repo.
4. Codex independently restores old strict validator temporarily: canonical regression MUST fail; restore bytes exactly and PASS. Recheck page-wiring, actual404, Level POST ADMIN, both logout-draft-cleanup mutants; all KILLED, restored byte-exact. No mutation committed.
5. Codex independent full local gates then rebuild/restart actual3012. First read-only /frameworks -> canonical CEFR href -> detail -> four Levels correct parent. If404 STOP before fixture creation.
6. Owned unique Framework + Level create/edit; real unique-conflict UI retains inputs, no false success, usable recovery; delete owned Levels before Framework, reload proves no residue. Never mutate canonical CEFR/Levels, en/vi, Account/Admin or others.
7. Only all PASS: current-task/evidence preserve history, review entire uncommitted Slice2 tree, stage explicit Slice2 source/tests/concise docs only; commit/push origin/main. No secrets/raw logs/build/local artifacts/unrelated DB files.

## Hard boundaries

No DB/schema/seed/migration edits or executions, DB harness/audits/provisioning, auth refactor, domain/UI redesign, dependencies or Slice3. Preserve unrelated dirty product README/migration/DB plans and all prior evidence. Never read/copy/edit/stage protected docs/design/physical/evidence/2026-10-22-p0-p1-execution/wp00/05-provider-stack-lifecycle.log or reveal credentials/env values. Anti does not commit/push, dispatch agents, start/write live3012 or use real DB; Codex owns live gates.

Delivery: STATUS DELIVERED/BLOCKED/FAILED, PACKAGE U1-U2, CHANGED FILES, exact TESTS/exit codes, EVIDENCE, BLOCKER. Delivery is not independent acceptance.

# Patched DEV runtime — read-only acceptance failure

2026-10-29. Actual production build rebuilt after independent local gate, then `npm run start -w lingora-admin -- --hostname 127.0.0.1 --port 3012`; existing3012 was not running. Reused ambient authenticated owner IAB session through DOM only; no cookie/token/credential inspection or login provisioning.

Observed `/frameworks`: production guarded catalogue rendered CEFR / 2020 with four levels. The displayed existing row's actual "Xem cấp độ" link pointed to `/frameworks/00000000-0000-0000-0000-000000000010`. Clicking that read-only navigation produced actual page title **404: This page could not be found.**, heading404 and "This page could not be found." at that exact URL. No mutation button clicked.

Source root cause: `lingora-admin/src/server/frameworks/index.ts:20–21` requires UUID version nibble1–5 and variant8/9/a/b. This rejects the ID that production list returns. `src/app/frameworks/[frameworkId]/page.tsx:18–20` immediately calls notFound when that validator returns false. Framework API/services and Levels reuse this same validator, so valid stored catalogue rows with this ID format cannot be managed through their listed route. This is an implementation bug in original uncommitted Slice2, independent of the corrected page-test copy/authorization/logout blockers; no database/schema change is needed or attempted to diagnose it.

Independent isolated service diagnostic imported the production isValidUuid/getFramework and supplied a DB double that would return that exact existing-id shape. Result: acceptedBySlice2Validator=false, status400 INVALID_ID, catalogueReads=0. No real DB connection/query was used by this diagnostic. Existing tests use version4/variant8 ids and do not cover the actual listed identifier shape.

**Owned live A–E NOT RUN.** The failure was discovered during initial live read-only verification before creating any fixture. No owned Framework/Level DEV rows exist from this task, no cleanup writes are owed, and no cleanup reload/residue query is claimed. No canonical data writes or Account/Auth provisioning occurred. With correction1/1 exhausted, final acceptance is FAIL/STOP, no additional worker/fix or Codex implementation takeover, no commit/push.

Closeout: stopped only this task-owned Next runtime on3012 after confirming its cwd and pid; no pre-existing3012 service existed at start. No fixture cleanup was necessary.

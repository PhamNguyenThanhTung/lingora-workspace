# Slice10 public DEV acceptance — PASS

Date:2026-11-01 (Asia/Saigon). Exact source commit `2fb844735beca8d024c310778a7c23d923eca054` was pushed and verified READY before live fixture writes:

- Learner `dpl_9whRMVDDX4MjQgT5ZhusAyPk4phT`; public alias `https://lingora-learner-dev.vercel.app` independently resolved to that deployment.
- Staff `dpl_C9D2Da9ViaNPUMofB9AvRBxXrgqg`; `https://lingora-workspace.vercel.app` independently resolved to that deployment.
- Both production deployment metadata match the exact source SHA. No app source changed during public acceptance.

## Real public flows

[Main run:27 checks](public/DEV_S10_1793516488377_retry_1793516750708.json): real learner login/empty context → own Course/Unit catalogue → exact published X → actual start callback → reload IN_PROGRESS → actual reading acknowledgement → reload COMPLETED. Duplicate start/complete/start-after-complete preserve first timestamps/version. B sees its own NOT_STARTED state and cannot read/write A's context. Unpublished/direct locked access rejected. Reading X and Y never unlocks the next required Lesson.

Teacher authored newer draft Y through authenticated public staff routes; learner continued seeing published X. Teacher submitted Y, Admin approved/published the exact revision. A second actual X page returned409 PUBLICATION_CHANGED on complete, showed failure without false success, and the real reload callback recovered to Y/Chưa đọc. Y required a separate start and completion; stale retry of already committed X also409. X row/content/children unchanged. Same-session disabled and paused context mutations failed and valid retry recovered. Graded attempt/response/completion, assessment evidence, SRS and context Level/start data compare unchanged in read-only before/after snapshots.

[Exact content proof:7 checks](public/exact-content-proof.json): real public authenticated Y DTO compared directly with read-only DB title/content, exercise membership IDs, ItemRevision IDs, item IDs, promptData, vocabulary link IDs and displaySnapshot. X remains ARCHIVED with distinct retained child pins; Y PUBLISHED/current. APPROVE/PUBLISH actors equal the owned Admin, SUBMIT actors equal the assigned Teacher. GET alone created no consumption row. This bounded follow-up used one disposable learner, then restored runtime baseline and removed its session/data.

## Revision-aware consumption

| Publication | Exact revision | Reading row | Persisted state before cleanup |
|---|---|---|---|
| X | `add1b8d7-d4ec-45c5-bf7d-e3b9e258fd8d` | `8ee1f604-8b55-485f-a54f-75ff89654a61` | completed, rowVersion2 |
| Y | `92051c75-79cc-4e4a-bf46-7252a1ef3c54` | `ac5b78dd-4aad-48c8-817f-e382fc11a4e5` | separate completed row, rowVersion2 |

DB evidence records exact started/created/completed/updated timestamps, current pointer, actor IDs and history. These were owned disposable reading rows and were removed during authorized fixture cleanup. No graded completion was manufactured.

## Operator recovery

[Initial attempt](public/DEV_S10_1793516488377.json) stopped before consumption because its read-only comparison mistakenly queried AssessmentResponse in `app`; the actual mapping is `app_private`. Operator query fixed; no product bug/source change, local rerun or redeploy was needed. Initial learner/session cleanup succeeded. The successful retry reused the same owned content and staff IDs. Temporary staff passwords were rotated server-side through Supabase Admin and existed only in RAM; no credential values or storageState were recorded. No new staff account was made because its password was forgotten.

## Cleanup and security

[Final read-only cleanup](public/final-cleanup-readonly.json):5 disposable learner Auth/Accounts across all attempts removed, all test contexts/consumptions removed, sessions0; owned Teacher/Admin DISABLED, Course inactive, all3 Lessons PLANNED. Original S5 fixture Teacher remained DISABLED; nonfixture Accounts compared unchanged. Persistent allowlist: one labeled Course/Unit,3 Lessons,2 assignment episodes,3 immutable revisions/children,10 review events and their2 disabled staff actors. Main published pointer intentionally remains Y; locked fixture Lesson retains its own publication. Unexpected residue **0**.

Browsers/contexts closed; user-owned tabs untouched. [Client scan](client-secret-scan.json):40 local files +19 public HTML/JS responses across both apps,0 credential/private import matches. No password/token/storageState/traces committed. No answer/grading/SRS/Level-up implementation or Slice11.

**SLICE 10: PASS — SLICE 10 ACCEPTED**

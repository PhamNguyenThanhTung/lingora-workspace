# Slice 7 public DEV acceptance

Date: 2026-10-31. Deployment was verified before live writes.

## Deployment

- Vercel deployment: `dpl_HYwmjTVpdkjYPzjHmSKkFu8Am2pz`
- State/target: `READY` / production
- Git commit: `04c14951523137eb1b931817d335545219d8991a`
- Public alias: `https://lingora-workspace.vercel.app/`

## Public workflow

- Fixture Course `4a7024f1-d24a-42d8-9d3a-3591b67229ca` and Lesson `96635a98-975a-487e-b8de-b80c8fd794d3`; Teacher `7d14d388-bb1e-4c57-877a-4f07ec2468d0` was temporarily enabled via Admin UI.
- Teacher submitted revision #8 `84c7162e-f2b1-4477-b94a-447eccdc4fff`; Admin reviewed its pinned snapshot and requested changes. Submission event: `7882a22b-ea50-4a62-830b-edd6f6914400`.
- Teacher submitted successor revision #9 `a0dac479-6eae-44e0-ad3e-80c3ac8833e7`; Admin submission `d70dfb4e-49ed-4377-b245-511fccc48fba` displayed the exact submitted snapshot. Admin approved and published that revision.
- Stale second-view approval returned HTTP 409. The UI showed the conflict, and reload reconciled to `Trạng thái: Đã duyệt`; the valid publish path then succeeded.
- Teacher created successor draft #10 `fb9acf29-fdf2-488d-a7c1-71689eaadbe2`. Teacher reload showed #10 as `Bản nháp`; Admin reload showed #9 as `Đã xuất bản`.

## Read-only database reconciliation

The final query ran in a read-only transaction against the scoped DEV Supabase project.

| Revision | ID | Final status | Submitted by | Approved/published by |
|---|---|---|---|---|
| #8 | `84c7162e-f2b1-4477-b94a-447eccdc4fff` | `CHANGES_REQUESTED` | fixture Teacher | — |
| #9 | `a0dac479-6eae-44e0-ad3e-80c3ac8833e7` | `PUBLISHED` | fixture Teacher | ACTIVE Admin `5650336e-550c-413d-b2a8-4afa2e4d9160` |
| #10 | `fb9acf29-fdf2-488d-a7c1-71689eaadbe2` | `DRAFT` | — | — |

`Lesson.activeRevisionId` is revision #9. History contains exactly five expected events: #8 `SUBMIT`, `REQUEST_CHANGES`; #9 `SUBMIT`, `APPROVE`, `PUBLISH`. Revision #9 content hash is `b9a1bb0d9f738ee7b26d4e651d4103d5`; #10 is `c5fee6981ecd547b3a74a9902c7d4e97`. Revisions #1–7 and their exercise/vocabulary snapshots compare byte-for-byte at the query-result level with baseline.

## Cleanup

- Course remains inactive; fixture Teacher is restored to `DISABLED` through the Admin UI.
- Assignment owner and assignment episode are unchanged. No canonical records were touched.
- Persistent allowlisted output is limited to revisions #8–10, their expected snapshots, the five review events, and the intentional published pointer to #9. Unexpected residue: **0**.
- Playwright browser and contexts were closed; auth existed only in process memory. No token, password, or `storageState` was saved.
- Evidence sources are the task-local read-only SQL snapshot and the public UI run record under `/home/tung/.codex/task-logs/slice-7/`; neither contains credentials or browser storage state.

**SLICE 7: PASS — SLICE 7 ACCEPTED**

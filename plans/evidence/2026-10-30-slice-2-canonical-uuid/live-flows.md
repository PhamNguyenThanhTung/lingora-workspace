# Actual DEV live acceptance — PASS

2026-10-30, Codex-operated IAB on rebuilt production `http://127.0.0.1:3012`, existing owner session. No cookie/token inspection or synthetic live provider/database doubles. Screenshots outside Git: `/home/tung/.codex/task-logs/slice-2-canonical-uuid/codex-review/live-*.jpg`.

Read-only gate FIRST: actual `/frameworks` displays CEFR2020, levelCount4, actual href `/frameworks/00000000-0000-0000-0000-000000000010`. Clicking that link opens successful detail with CEFR parent identity and A1/A2/B1/B2 at positions1–4; row IDs match canonical21–24. No404. `live-cefr.jpg`.

Owned run: Framework `ZZS2_20261030_CUUID`, version `run-01`, names `Fixture kiểm thử UUID 20261030` / `Owned disposable UUID acceptance fixture`, generated id `572fac5e-44d2-4dd5-a7bb-8bf8ba9a4a8e`.

| Flow | Actual observation |
| --- | --- |
| A create Framework | Submitted real form, pending controls disabled, modal closed, authoritative new row/href with count0 and success message. `live-A-framework.jpg`. |
| B create Level | Followed owned Framework href, verified parent banner and empty state; created OWN_L1 position10, generated id `573a5ddd-1beb-441f-b08d-6897caa5de6e`; authoritative row and success shown, persisted after reload. |
| C edit | Reopened OWN_L1 after reload; prefilled original fields; changed position10→11 and Vietnamese label to `Đã sửa owned Level UUID run 01`; saved and reloaded, new position/label persisted. `live-C-level-edit.jpg`. |
| E real failure + recovery | New OWN_L2 at occupied position11 produced precise server field error `Thứ tự vị trí này đã tồn tại trong khung năng lực.` Form stayed open with exact code/position/label; Submit and Cancel enabled, zero OWN_L2 rows, no false success. Changed only position to12 and retried; closed successfully and reload displayed exactly OWN_L1#11 + OWN_L2#12. OWN_L2 id `48f26ca4-6e5a-4cb4-9667-2e3a34d9c703`. `live-E-conflict.jpg`, `live-E-recovery.jpg`. No explicit network status capture is claimed; this is actual production UI constraint/recovery proof, not an isolated response double. |
| D delete + cleanup | Confirmed deletion of OWN_L2, then OWN_L1 using their own dialogs. Reload owned detail: empty Levels state. Back catalogue: owned parent count0. Confirmed deletion of that Framework; final reload showed only CEFR2020 count4, owned-row count0. `live-cleanup-levels.jpg`, `live-cleanup-final.jpg`. |

**FIXTURE CLEANUP: PASS; owned residue none.** Only the listed disposable rows were created/edited/deleted. Canonical CEFR/Levels, Languages en/vi, Admin/Accounts and unrelated data were not mutated. No database CLI/schema/migration/seed/audit/provisioning commands. No Slice3.

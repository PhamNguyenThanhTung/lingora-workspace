# Legacy code cleanup and design correction planning — 2026-10-22

Owner explicitly requested removing the old implementation, planning corrections and explaining Supabase connections; subsequently confirmed Supabase. Entry Git `84baa85`, clean working tree.

Removed exactly 54 tracked files: Web 41, Admin 12, root npm config one. No untracked/ignored files or nested Git repositories were present in those app folders. Old code/tests/config/Prisma/migrations/seed remain in Git history; no replacement app was created. Documentation and diagram tooling retained. Current entry docs classify the new project as design-only and old implementation views as historical snapshots; 17 source links pin the entry Git commit.

Deliverable: [plan and Supabase instructions](../2026-10-22-design-corrections-and-legacy-cleanup-plan.md). RDR-01–03 have scope, dependencies and closure scenarios but remain OPEN and unexecuted. No Antigravity delegation. Prior FDR closure and historical reviews are unchanged. No database/account connection, schema deployment or remote mutation occurred.

Verification and limitations: T-LEGACY-CLEANUP-PLAN-001 in [test log](../../logs/test-log.md). Scope/preservation/link/whitespace checks distinguish cleanup from design acceptance. Aggregate modeling verifier fails on a pre-existing CRLF/LF style hash difference, reproduced at entry; source/manifest/render bytes are unchanged. No overall integrity PASS or independent design acceptance is claimed. App build/tests are inapplicable after removal; runtime/SQL/RLS/concurrency NOT EXECUTED, live DB UNVERIFIED.

Cleanup and planning COMPLETE; no correction task automatically active. A future correction task must first account for the cross-platform verifier limitation, then follow RDR-01 → RDR-02 → RDR-03 and actual review. Commit follows verification/log gates; no push or history rewrite.

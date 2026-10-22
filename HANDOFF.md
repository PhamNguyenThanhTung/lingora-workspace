# Lingora — Current handoff

**2026-10-22 — DESIGN-ONLY CHECKOUT; LEGACY CLEANUP AND CORRECTION PLANNING COMPLETE.**

[Current task](plans/current-task.md); [new plan and Supabase guide](plans/2026-10-22-design-corrections-and-legacy-cleanup-plan.md), [cleanup/planning closeout](plans/archive/2026-10-22-design-corrections-and-legacy-cleanup-DONE.md). RDR correction execution is not active.

- **Verdict:** NEEDS BOUNDED DESIGN RECONCILIATION. RDR-01 mandatory account audit cardinality conflicts with system events; RDR-02 no defined same-draft assessment-contribution omission path; RDR-03 no explicit cross-scope fingerprint existence-check privilege chain. No new P0/P1 confirmed.
- **Previous corrections:** FDR-01–07 remain closed within documented scope. This review does not erase prior acceptance or claim runtime regressions.
- **Cleanup:** Owner identifies Web/Admin code as old and requests deletion. Removed exactly 54 tracked app/config/test/schema/migration/seed files and root npm startup aliases; recoverable at Git `84baa85`. Design, report tooling and historical evidence retained. Old app is not progress of the new design. Old CURRENT implementation views are dated historical snapshots.
- **Evidence:** Entry clean; no untracked/ignored or nested repositories in removed app directories. Exact deletion/preservation checks and current documentation checks recorded in T-LEGACY-CLEANUP-PLAN-001. Latest historical design-review evidence remains T-FULL-DESIGN-REVIEW-002; not independently repeated here.
- **Known verifier limitation:** Linux `verify_current.py` exit 1 `stale style`, reproduced from entry HEAD. CRLF hashes match the Windows manifest; actual source/render/native files remain unchanged. This is not caused by deleting app code; do not rewrite provenance to hide it. Account for portability before future correction acceptance.
- **Boundary:** RDR corrections planned only. Physical catalog/security/ERD, canonical diagrams and ADRs unchanged. Two legacy-source reference documents updated only with removal notice/pinned links. Physical mechanisms PROPOSED; runtime/SQL/security/concurrency NOT EXECUTED; live DB UNVERIFIED.
- **Supabase:** Provider confirmed by owner; connection instructions in plan. No account login or project/database changes. Connect is not schema deployment; no new migration is available yet.
- **Next permitted action:** Use the new plan when owner starts correction work: handle verifier portability, then RDR-01 → RDR-02 → RDR-03. Core transport/config/per-slice UI/NFR, physical approval and online database execution remain separate prerequisites/tasks.
- **Git:** Commit after cleanup/planning verification and logs; actual SHA in final response. No push/history rewrite.

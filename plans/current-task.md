# Current task pointer

**Active task:** Legacy code removal + design correction plan + Supabase guidance (2026-10-22).
**Authorization:** Owner identifies current code as obsolete, asks to remove it, plan design corrections and explain connecting Supabase.
**Mode:** DESIGN planning + explicitly authorized local legacy cleanup; no new application implementation.
**Status:** DONE — 54 legacy files removed; correction plan and Supabase guidance saved. RDR-01–03 remain OPEN and unexecuted.
**Plan / scope:** [Correction and cleanup plan](2026-10-22-design-corrections-and-legacy-cleanup-plan.md).
**Active Work Packages:** Not applicable; design correction work is planned only, not executing.
**Closeout:** [Cleanup and planning completion](archive/2026-10-22-design-corrections-and-legacy-cleanup-DONE.md).
**Verification:** Exact 54-file deletion, 1162 protected tracked hashes, no newly broken local links and historical log-prefix preservation PASS; whitespace PASS. T-LEGACY-CLEANUP-PLAN-001. Aggregate modeling verifier has entry-reproduced `stale style` CRLF/LF failure, not a new cleanup regression; no overall integrity PASS claimed.
**Next permitted action:** No correction task active. When owner starts corrections, use the saved plan: address cross-platform verification, then RDR-01 → RDR-02 → RDR-03 with scoped edits and review.
**Boundary:** RDR-01–03 OPEN; FDR-01–07 retain prior closure. Physical mechanisms PROPOSED; runtime/SQL/security/concurrency NOT EXECUTED; live DB UNVERIFIED. No online database changes, deployment, new migrations or Antigravity delegation.

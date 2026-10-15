# Final 3-Point Modeling Correction — Evidence

Date: 2026-10-11. Scope is limited to the three user-specified modeling points. Authority: ADR-034/035 for assignment responsibility/history; ADR-033 for course-defined Level-up gates and non-invariant historic values; ADR-036 for availability/withdrawal rules; the user request clarifies normal progression lock eligibility. No ADR or product policy was changed.

## A. Assignment lifecycle

Read `STA-02` source, final-review assignment criterion and relevant ADRs. The source is already a single responsibility state with reassignment as a self-transition; it has no `CLOSED` or `COMPLETED` state. Existing report already says reassignment changes the responsible Teacher and preserves attribution/history. No source or output changed for this point. A prohibition comment mentioning `CLOSED` is not a modeled state.

## B. Level-up readiness

Read `ACT-04`, UC-05, active requirements and ADR-033. The gate and pass parameters are explicitly course configuration; there is no fixed 100% level-up threshold in active source/UC. ADR-033 says no universal percentage, and historical English 100% remains only a configuration choice. No source/UC behavior needed changing. Final review wording now states both rules are configuration-driven and 100% is not a platform invariant.

## C. Progress denominator

The original activity/UC wording used the same `locked/coming soon` phrase near denominator exclusion without stating what happens when a published lesson is locked only by normal progression. Clarified ACT-01, ACT-09, UC-04 and the current requirements addendum: unpublished/unavailable and withdrawn-incomplete content is excluded; a published, active, required lesson remains eligible even if the learner has not unlocked it. A UI lock icon may be shared but the availability/progression meaning is distinguished.

## D. Render / verification

Only ACT-01 and ACT-09 were rendered, to SVG and PNG, using installed PlantUML 1.2026.8; both format commands exited0 for2 requested sources. Their final PNGs were individually opened and inspected. Dimensions and final PNG hashes are in `evidence/visual-review.md`, matched to the render manifest. The canonical verifier exited0:36 source records, 72 fresh outputs, final output hashes, 186 resolved local links, scope/HEAD/index/log-prefix preservation, and all three targeted semantics passed. Targeted search output is preserved in [scan evidence](final-three-point-scans.txt); manual observations are in [per-image records](visual-review.md). `git diff --check` exited0; output and whole-worktree stat are in [diff evidence](final-threepoint-diff-check.txt) and [stat evidence](final-threepoint-worktree-stat.txt). Commands and excerpts are in `logs/test-log.md` under T-F3C-001. This is documentation/modeling evidence; no runtime test applies.

Final closure rerun after DONE archive/current pointers/logs: canonical verifier exit0, 187 local links, DONE archive51 lines, authorized-scope/HEAD/index/log-prefix checks PASS. `git diff --check` rerun after closure exit0.

## E. Verdict

The three assertions in the user request are satisfied against the controlling authority. Final verdict: **MODELING APPROVED**. Readiness: **READY FOR PHYSICAL DESIGN**. No physical design, code, Prisma, migration or database task was started; no staging or commit.

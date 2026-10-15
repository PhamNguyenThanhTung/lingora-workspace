# Phase 0 Final Independent Re-Verification

> **Role:** INDEPENDENT FINAL VERIFICATION ONLY (Codex). No file edited, fixed, moved, or cleaned up. This report is the sole created artifact.
> **Target:** `docs/phase-0-user-research-analysis-and-requirements.md` (DOC-PHASE-0-REQ-001, 933 lines after fix).
> **Inputs (claims treated as claims, never as proof):** `plans/phase-0-fix-plan.md`, `docs/phase-0-fix-plan-independent-review.md` (plan verdict PASS WITH NON-BLOCKING FINDINGS), `docs/phase-0-corrective-implementation-report.md` (44/44 self-check, status AWAITING re-verification).
> **Prior audit:** `docs/phase-0-independent-reverification-report.md` (18 finding IDs, verdict FAIL).
> **Date:** 2026-09-20. Labels: FACT (directly observed) / INFERENCE (derived) / UNKNOWN (no source).

## 1. Executive Verdict

**`PASS WITH NON-BLOCKING FINDINGS`**

All 18 finding IDs are closed against direct evidence (closure matrix §16). No material correctness issue remains: no placement conflict, no D7 conflict, no lifecycle bypass, no pervading schema-as-applied falsehood, RPC signature and error envelope match migrations/contract, traceability resolves, citations are corrected or honestly labeled UNKNOWN, and no self-awarded PASS remains (status explicitly defers to this verification). Residuals (§17) are 7 LOW documentation-polish items that do not affect requirements correctness, baseline, traceability, contracts, or evidence integrity.

## 2. Scope

Final verification of the remediated Phase 0 requirements document against baseline, locked D1–D9, canonical contracts, applied migrations, raw survey, and repository evidence — plus change-scope control, false-claim detection, M2.1 drift check, and repo-wide contradiction scan.

## 3. Sources Actually Verified

Read/checked directly (not via implementation report): fixed main doc end-to-end (lines 1–933); `git status` + `git diff --stat` + targeted `git diff` (code/migration/schema/contract paths empty); baseline `docs/phase-0-roles-and-mvp-final.md` (clean, intact); decision sheet D1–D9; `docs/02` (M0.5, P1-FR-016 Mapping A), `docs/03` (§143–146 envelope), `docs/05` (UC-10 = Publish, Mapping A), `docs/06` (BF-01..BF-15, UC-10), `docs/07` + migrations 001 (tables/enums), 002 (`record_review(uuid, boolean, double, double)`), 003 (buckets 5242880/10485760); `docs/08/09`; synthetic research; `docs/report/evidence-register.md`; raw xlsx (recount re-run: Q4 9/8/4/3, Q23 5/6/4, Q24 4/7/4); live fetches: S6 URL → 404 (re-confirmed), S1/S2/S4/S5 DOI metadata (all match doc), S3 metadata (prior verification stands); repo-wide grep scan for 20+ forbidden terms with per-hit classification.

## 4. Working Tree / Change Scope Verification

- FACT: modified = main Phase 0 doc only (expected, ~1840-line diff) + pre-existing M2.1/plantuml/log modifications that already existed before this fix cycle (observed in earlier sessions; implementation report §4 consistent — not caused by this implementation, not reverted).
- FACT: untracked = fix plan, fix-plan review, implementation report, prior audit report (expected generated artifacts).
- FACT: zero diff on `lingora-admin/`, `lingora-web/`, `lingora-ai/`, baseline, `docs/02/03/05/06/07/08/09`. No source/migration/schema/PlantUML changes; no deletions. Baseline file clean.

## 5. Survey Verification

- Q4 (§1.2 + Table 1.4): 9/15 (60.0%) Trung tâm, 8/15 (53.3%) Website, 4/15, 3/15 — matches recount incl. truncated cells. FIXED.
- Q23/Q24 (§1.7 + Table 1.4): honest splits (Q23 5/6/4; Q24 4/7/4) with categories, examples, denominators; "100% valid" gone. Q24's 4th substantive ("Không" = asserted no-gap) is a defensible reading, transparently shown — no finding.
- Q12/Q21/Q22: unchanged and correct vs raw (10/6/4/4/2/1; 10/9/8/8/7; 9/8/7/7/5/4/3/2). Untouched per directive. Table 1.1 source note now cites Q7. All other Q-counts/percentages/means spot-checked consistent.

## 6. Interview Verification

- FACT: no P1–P6 raw transcripts/audio in repo (no `.docx` under `docs/`; evidence-register's `docs/phỏng_vấn.docx` absent — register claim itself needs a future correction outside this file, noted as dependency).
- Table 3.1: role-level illustrative personas (no names/ages/jobs-as-fact), banner `[ILLUSTRATIVE PERSONA / INFERENCE — SUMMARIZED QUALITATIVE DISCOVERY]`; §3.1 limitation explicit; no verbatim quotes (survey quotes shown are PRIMARY with honest breakdown, legitimate).
- Table 3.2: THEMATIC CONVERGENCE + INTERNAL GOVERNANCE/SOD row; interview legs cite "Persona Pn" (residual R-02: one "Phỏng vấn $P5$" leftover in PP-05).

## 7. Synthetic Research Verification

§3.3 `[SYNTHETIC / SIMULATED — DISCOVERY ONLY]` banner, 20 SIM-ID personas, zero fake percentages, no leakage into survey/interview/empirical cells (PP-06/07/08 correctly labeled SYNTHETIC + PRODUCT DECISION). PASS.

## 8. Benchmark Verification

- B2: 6-band Mapping A verbatim. B4: Settles removed from session-length cell. B8: D7 + `p_is_correct=false`. B9/§1.7/Table 2.2: In-app 6d only, Web Push DEFERRED. B12: (D5, UC-04, BF-11). B14: [HISTORICAL / RETIRED 2021]. B15: NIST SP 800-53 AC-5 / ANSI INCITS 359 (legitimate SoD/RBAC authorities). TOEIC/Exam/QuestionBank REJECT intact.
- S1/S2/S4/S5 metadata verified live against DOI records — all match. S3 metadata corrected (prior verification). S6: 404 + [UNKNOWN / HISTORICAL CLAIM]; 3.6x appears only with UNKNOWN labels, never as acceptance criterion.

## 9. D1–D9 Verification

D1 Manager-driven ✓. D2: Moderator approves / Manager publishes / no self-approve-publish / Moderator cannot publish; emergency exclusively `APPROVED→PUBLISHED` + justification + AuditLog (Table 5.2, §3.3.5, PP-08, NFR-AUD, §5.3-5); zero `IN_REVIEW→PUBLISHED` normative paths (all remaining hits are legitimate review-flow states or audit-trail mentions) ✓. D3 clone-to-draft + ARCHIVED→DRAFT excluded ✓. D4: no Exam/QuestionBank/MATCHING as MVP; 5 ADR-006 types consistent with `docs/02` M0.5 ✓. D5: ≥95%, 24h cooldown, 1/2–3/>3 scopes ✓. D6: Mapping A 6-band in B2, PP-03, P1-FR-016 (AC 25/30→U5 correct) ✓. D7: two-pass, `max(1,floor(N*0.10))`, 70% credit, explicit no-70/80/85-threshold, `status='COMPLETED'`, no `is_completed`, no `ExerciseAttempt` ✓. D8: [1,3,7,14,30], deterministic, boolean RPC, no ML/new entities ✓. D9: local tz, ≤1/day, miss→1, no freeze ✓.

## 10. Functional Requirements Verification

17 FRs re-checked: `profiles.role` (001), `user_vocab_srs`/`review_logs`/`srs_card_id`/`interval_days`/`next_review_at`, RPC signature verbatim vs migration 002, `lingora-media` 10MB mpeg/wav + `vocabularies.audio_url`, Creator actor (+Admin configures bucket — resolves REV-P0-02), `daily_goal_min`, `last_qualifying_activity_date`, ≤200ms TBD AC, P1-FR-007 → BF-14 + TARGET (no UC), P1-FR-017 → Profile Scope (UC-10 single-use = Publish). FR behaviors consistent with 6 roles / 19 MVP / D1–D9.

## 11. Non-Functional Requirements Verification

Single ≤200ms `TBD / PROPOSED TARGET` (P1-FR-010 AC + NFR-LOC consistent); ≥99.5% TBD + method; SEC/RBC/PRV/AUD/MNT absolutes reframed as design constraints + automated-test verification; NFR-PER/CAP TBD intact; NFR-USA Lighthouse/Axe stated as measurable verification targets (acceptable, not empirical claims); NFR-ERR canonical envelope, `detail` singular, no wrapper.

## 12. Database / Schema / RPC / Storage Verification

Applied claims match migrations: `profiles.role`, `user_vocab_srs`, `vocabularies`+`audio_url`, `srs_card_id`, `last_qualifying_activity_date`, `daily_goal_min`, `user_progress(status enum+score)`, `review_logs` keys; TARGET items (`AuditLog`, `Unit`, 6-role enum, ContentStatus) live only in `schema.prisma`, not claimed as applied; `record_review` name/types/semantics (owner check, atomic insert+update, streak update) match migration 002; storage bucket/limits/MIME match migration 003. Residual R-01: one bullet lists `review_logs` with extra `recall_probability` (no such applied column) — LOW, one-token fix.

## 13. Citation Verification

S1/S2/S4/S5 live-verified; S3 corrected; S6 dead-but-honestly-labeled; B-row sources corrected; no generic-source-for-specific-claim overreach remains except legacy product-design URLs (Onboarding/Path/Help-Center/Feather) presented as design references, acceptable. Inherited effect-size figures (43.16%, 12.9M, 45%, 317) noted as R-07 LOW (metadata verified, figures inherited).

## 14. Traceability Verification

16-code E-ID register present and coherent (code/claim/label/source/limits/usage/rule); all FR citations resolve; UC-10 single-use (Publish); BF range BF-01..BF-15, no BF-16; P1-FR-014/015 → BF-13; `E-SEC-*` wildcard resolves to register range (acceptable). No fake IDs introduced to force zero orphans (status honestly PENDING → this report).

## 15. Repository Contradiction Scan

20+ terms scanned repo-wide. Old terms survive ONLY as: (a) audit-evidence/historical files (prior audits, gap/baseline audits, reconciliations), (b) approved historical writing plan, (c) fix plan + implementation/fix-review reports quoting removed states as audit trail, (d) two acceptable in-doc mentions (negation + remediation row). Zero live normative occurrences in the fixed doc or any other active canonical file (`docs/02/05/06/07/09` clean). Historical writing plan's "BF-01..BF-16" line is a historical-plan inaccuracy, out of scope, left untouched.

## 16. Finding Closure Matrix

| Finding ID | Previous Status | Final Status | Evidence | Remaining Risk |
|---|---|---|---|---|
| F-MAP-01 | OPEN | FIXED | 6-band Mapping A in B2/P1-FR-016/PP-03; AC 25/30→U5; zero 4-band remnants | None |
| F-D7-01 | OPEN | FIXED | No thresholds; allowance formula + 70% credit + status COMPLETED; zero `is_completed` normative use | None |
| F-EMG-01 | OPEN | FIXED | Emergency APPROVED-sourced in §3.3.5/PP-08/NFR-AUD/Table 5.2/§5.3-5; zero bypass paths | None |
| F-SCH-01 | OPEN | FIXED | All six named items replaced, verified zero normative hits; fields match migration 001 | R-01 (one extra column token, LOW) |
| F-SCH-02 | OPEN | FIXED | RPC signature verbatim vs migration 002; Rating scale gone incl. Table 1.3/B8 | None |
| F-STO-01 | OPEN | FIXED | `lingora-media`, 10MB, mpeg/wav, `vocabularies.audio_url`; actor resolved (Creator) | None |
| F-ERR-01 | OPEN | FIXED | Canonical `{error:{code,message,detail}}`, singular, no wrapper | None |
| F-CIT-01 | OPEN | FIXED | S6 404 re-confirmed; 3.6x only UNKNOWN-labeled, never normative | R-07 (figures inherited, LOW) |
| F-CIT-02 | OPEN | FIXED | S1/S2/S4/S5 live-verified; S3 corrected | R-07 (effect sizes inherited, LOW) |
| F-TRC-01 | OPEN | FIXED | 16-code register present, coherent, cited throughout | None |
| F-TRC-02 | OPEN | FIXED | UC-10 single; no BF-16; no UC-06-viet; BF-13 retargets | None |
| F-SUR-01 | OPEN | FIXED | Q4 9/8/4/3 matches recount | None |
| F-SUR-02 | OPEN | FIXED | Honest Q23/Q24 splits, claim removed | None |
| F-INT-01 | OPEN | FIXED | Illustrative labels, no names/ages/jobs/quotes; limitation stated | R-02 (one leftover label, LOW) |
| F-BNCH-01 | OPEN | FIXED | All B-rows corrected per evidence | None |
| F-NFR-01 | OPEN | FIXED | Single TBD latency; TBD availability; constraints+tests | None |
| F-OV-01 | OPEN | FIXED | REMEDIATED—PENDING wording; verdict deferred to this report; §9 AWAITING | R-06 (wording, LOW) |
| F-SUR-03 | OPEN | FIXED | Table 1.1 cites Q7 | None |

## 17. Remaining Findings

| ID | Severity | Category | Evidence | Impact |
|---|---|---|---|---|
| R-01 | LOW | Schema precision | P1-FR-006 bullet lists `review_logs` incl. `recall_probability`; applied table (migration 001:183–192) lacks it | One-token doc fix; no behavioral/contract impact |
| R-02 | LOW | Label consistency | PP-05 cell "Phỏng vấn $P5$" vs "Persona Pn" elsewhere | One-word fix |
| R-03 | LOW | Prose precision | Carried-over soft quantifiers: "tốn 60% thời gian", "24–48h" (PP-01), "sau 1–2 tuần" (Table 1.1/3.2/PP-02/E-SEC-01), ">20 phút" (PP-02), hypothetical "100 câu" (PP-03) | Soften/remove in polish pass; non-requirement-driving |
| R-04 | LOW | TARGET labeling | §5.4 "15 Bảng Áp dụng" header covers TARGET `units`/`audit_logs`; `starting_unit` stored per P1-FR-016 without applied column | Add TARGET labels; placement is DESIGN-status |
| R-05 | LOW | Status drift | §9 "M2.1 = REVISED — READY FOR TARGETED RE-REVIEW" vs established independently-verified state | Correct line only; do not touch M2.1 |
| R-06 | LOW | Wording | §9 "ACADEMIC INTEGRITY = FULLY ALIGNED" pre-verdict; mitigated by explicit AWAITING line | Retain/replace per this verdict |
| R-07 | LOW | Citation depth | Inherited effect sizes (43.16%, 12.9M, 45%/+12%, 317) not paper-verified (metadata verified) | Spot-check recommended |

## 18. Baseline Preservation

FACT: `docs/phase-0-roles-and-mvp-final.md` has zero diff. 6 roles, 19 MVP functions, D1–D9, Mapping A references, D7 semantics, 6-state lifecycle + transition table, authorization matrix, and acceptance criteria remain intact (file untouched; fix direction was doc→baseline throughout).

## 19. M2.1 / M2.2 Status Check

M2.2 = NOT STARTED, preserved ✓. M2.1: §9 line restates the stale "REVISED — READY FOR TARGETED RE-REVIEW" string against the established independently-verified-after-fix state → recorded as R-05 (documentation drift only). No M2.1 dependency proven; M2.1 untouched; not reopened.

## 20. Final Verdict

**`PASS WITH NON-BLOCKING FINDINGS`** — 18/18 findings closed on direct evidence; 7 LOW residuals listed above (one-token fixes, label polish, inherited-figure spot-checks), none touching requirements correctness, baseline, traceability, contracts, or evidence integrity. No further fix cycle required before use as requirements baseline; residuals may be cleared in a routine polish pass. Then STOP.

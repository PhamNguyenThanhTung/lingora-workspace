# Phase 0 User Research & Requirements — Independent Review

> **Report:** `docs/phase-0-user-research-analysis-and-requirements-independent-review.md`
> **Role:** REVIEW ONLY. Zero files modified during review (this report is the sole creation).
> No baseline/D1–D9/M2.1/plan/source/code/schema/DB changes. `M2.2 = NOT STARTED`.
> **Method:** direct reads (target doc 911 lines, full) + independent Excel computation
> (`py -3.11` + openpyxl, 16 rows × 25 cols = N=15 + header, 24 questions confirmed) +
> migration/DDL verification + live URL checks (2026-09-15) + prior verified secondary sources.
> Author self-checks (§8 gates) treated as supporting claims only, never as proof.

## 1. Executive Verdict

**FAIL**

Multiple P1s: primary-data count mismatches, a competing Placement Mapping, D7/threshold
contradictions, invented schema/storage/API-contract names, undefined evidence-ID traces,
wrong reference titles + a dead citation URL, and interview detail beyond filed sources.
No fabricated respondents (N=15 real) and no N=500/TOEIC import — the integrity failures are
misreporting and drift, not wholesale fabrication — but P1s block any PASS.

## 2. Scope Reviewed

Target doc (all 9 sections); xlsx primary source (full frequency tables recomputed);
`02` (P1-FR/NFR), `05`, `06` (UC/BF), `07`, `09` (Mapping A), roles/decision-sheet/baseline audit,
M2.1 foundation (consistency only); S1–S6 re-verified (S6 URL live-fetched → 404);
`plans/...-writing-plan.md` (compliance); migrations 001 (17 CREATE TABLEs, ExerciseType enum,
user_progress 147–157, srs/review 161–192) and 002 (record_review params, RLS policy),
003 (buckets lingora-media/avatars, 10MB, mpeg/wav); 03-api-contract error envelope.

## 3. Evidence Integrity

- PRIMARY: N=15 real, file exists; most counts verified — but §6 mismatches (Table 1.4 row 4:
  Trung tâm 7 claimed vs 9 raw; Website 6 vs 8; row 21 chấm điểm 8 vs 7; row 22 vocab 9 vs 10;
  row 12 danh sách 2 vs 1; Table 1.1 rows 7–8 counts 6/15, 5/15 untraceable to raw).
- SECONDARY: S1–S6 exist, but ref titles wrong (S1/S2/S3) and S6 URL 404 (§7); several claims
  exceed sources (B4 session length ← Settles; Ebbinghaus 24–48h precision).
- SYNTHETIC: correctly labeled/isolated (§3.3 banner, Table 1.1 not mixed) — PASS.
- DECISION: D1–D9 cited, but doc drifts from them (§12 findings).

## 4. Survey Verification

| Claim | Reported | Source | Verified | Verdict |
|---|---|---|---|---|
| N=15, 24 questions | N=15/24 | xlsx 16×25 | exact | PASS |
| Quên từ 15/15; 8 Rất TX + 7 TT | 100% (53.3/46.7) | Q9 raw | exact | PASS |
| Bỏ học 13/15; SRS 12/15 TB 4.13 | 86.7%; 4.13 | Q10/Q14 raw recompute 62/15 | exact | PASS |
| Đề xuất ND 14/15; Q15 9/15 4–5; Q17–Q22 counts | various | raw recount | exact except below | PASS |
| Hình thức: Trung tâm 7, Website 6 | Table 1.4 row 4 | raw: 9 and 8 | **MISMATCH (P1)** | FAIL |
| Q22 chấm điểm 8/15 | Table 1.4 row 21 | raw: 7 | **MISMATCH (P1)** | FAIL |
| Q23 vocab 9/15 | Table 1.4 row 22 | raw: 10 | **MISMATCH (P1)** | FAIL |
| Q12 danh sách 2/15 | §1.6.2 | raw: 1 | **MISMATCH (P1)** | FAIL |
| Table 1.1 rows 7 (6/15), 8 (5/15) | counts | no raw derivation found | **UNSUPPORTED (P1)** | FAIL |
| "sau 1–2 tuần", occupations, "tốn 60% thời gian" | triangulation/PP | not in survey | **UNSUPPORTED (P1/P2)** | FAIL |

Interpretation (§1.1 limitations statement) is honest (exploratory, no generalization) — PASS;
but "Respondent preference → mandatory requirement" jumps occur without justification
(e.g., Q22 AI-conversation votes → full GEC Diff-viewer mandate; Q23 SRS ranked only 5th at 5/15
yet SRS presented as top-validated need) — P2.

## 5. Application Benchmark Verification

Platforms Duolingo/Quizlet/ELSA + TOEIC exclusion present with 17-criteria matrix and Adopt/Adapt/Reject.
Source quality: mostly generic domains (support.duolingo.com, design.duolingo.com — real but article-unspecific);
specific URLs unverified except S6-URL which 404s. Reasoning mostly evidence-based, EXCEPT:
- B2 invents a ≥95%-of-unit placement rule + U1–U4-only mapping contradicting Mapping A (P1, §12).
- B9 + §1.7 push-notification support contradicts DEFERRED 6a/6b (P1).
- B4 misattributes session-length claims to Settles 2016 (P2); B8 cites D5 for retry (→D7) and B12 cites
  P1-FR-016 for Jump (P2 wrong refs); B14 Incubator source stale; B17 source vague (P2/P3).

## 6. Interview Verification

- P1–P6: existence attested (evidence-register/DOCX) but NO raw transcripts in repo → summarized-only
  status correctly declared in §3.1 (good). HOWEVER Table 3.1 publishes specific names/ages/occupations/
  vivid details (24–48h, >15min, "Hello/Apple") with no filed source → hallucinated detail (P1).
- Synthetic 20 personas: labeled, no fake percentages, not called real (PASS).

## 7. Triangulation Verification

Row-by-row: R1/R2/R4/R5 convergence rests partly on unverifiable interview specifics and added details
("sau 1–2 tuần", exact durations) → CONVERGENT overclaimed where legs don't independently support it (P2,
downgrade to COMPLEMENTARY or soften specifics). Row 3 COMPLEMENTARY honest (PASS). Row 6
"GOVERNANCE ALIGNED" is non-user governance reasoning presented inside a user-triangulation matrix —
category error (P2); underlying SoD content itself is baseline-correct.

## 8. Pain Point Verification (PP-01..PP-08)

PP-01: "tốn 60% thời gian" invented (P1); Ebbinghaus 24–48h unsourced precision (P2).
PP-02: ">20 phút" threshold unsourced (P2). PP-03: "bài thi 100 câu" hypothetical (P2).
PP-05: "100% audio mandatory" exceeds nullable baseline (P2). PP-06/07: synthetic-labeled, baseline-aligned (PASS).
PP-08: cites P1-FR-010 + UC-11/12 for audit logging — wrong traces (→P1-NFR-001/MVP-19/UC-13) (P2);
states Admin emergency `IN_REVIEW→PUBLISHED`, contradicting verified M2.1/baseline `APPROVED` source (P1).
USER PAIN vs GOVERNANCE vs DECISION properly separated at matrix level (PASS).

## 9. Actor / Role / SoD Verification

6 canonical roles, no Teacher/Auditor/System/Exam Manager as current (PASS). SoD matrix correct
(Manager publish, Moderator approve-only, Creator locked) (PASS) EXCEPT Admin emergency modeled as
`IN_REVIEW→PUBLISHED`, bypassing moderation — contradicts D2 and verified M2.1 P0 (APPROVED source) (P1).
`emergency_justification` field name and `supersedes_id` mechanism stated as decided though DD-02/DD-03
keep them OPEN candidates (P2). `user_roles` table cited in P1-FR-001 does not exist (P1).

## 10. Functional Requirement Verification

- P1-FR-004: ≥70% precondition + 80% AC + `is_completed` field — contradicts frozen D7 (no threshold)
  and schema (status enum). **P1.**
- P1-FR-016: bands 8–15/16–23/24–30, U1–U4 only + AC 25/30→U4 — a THIRD mapping contradicting approved
  Mapping A (8–12/13–17/18–22/23–26/27–30, U1–U6). **P1.**
- P1-FR-005/006: `user_srs_items`, `repetition`/`interval` fields, Rating 1–5, `srs_item_id` — contradict
  verified schema (`user_vocab_srs`: ease_factor/interval_days/recall_probability/…) and RPC signature
  (`p_is_correct` boolean; baseline Again/Hard/Good/Easy). **P1.**
- P1-FR-009: bucket `audio-assets`, table `vocabulary_items`, 5MB/m4a — real: lingora-media,
  `vocabularies`, 10MB, mpeg/wav. **P1.**
- P1-FR-010: 100ms AC invented. **P1.** P1-FR-011: `last_active_date` nonexistent (→last_qualifying_activity_date). **P1.**
- P2s: `daily_goal_minutes` naming; `rule_explanation` unverified vs ADR-006; invented routes
  /dashboard /admin/reviews; P1-FR-014/015→BF-02 and P1-FR-010→UC-01..07 arbitrary traces.
- Given-count 18 with no 19/19/19 claim — no finding. Orphans: none structurally (all FRs have rows),
  but traces point at wrong targets (UC-10-badges for P1-FR-017 vs canonical UC-10=Publish; NFR→BF-01..16
  where BF-16 doesn't exist) — false traceability (P1).

## 11. Non-functional Requirement Verification

11 categories present with IDs/metrics/verification columns (structure PASS). Truthfulness:
- NFR-SEC (EdDSA/TLS1.3/CSP specifics), NFR-RBC (100%/100% measured), NFR-PRV (narrow collection claim),
  NFR-MNT (pnpm exit-0, 100% unit tests): unverified MANDATORY metrics (P2).
- NFR-LOC 200ms: invented (P1, with P1-FR-010 100ms).
- NFR-USA (Lighthouse/Axe targets), NFR-PER/CAP (TBD + k6 method): properly labeled (PASS).
- NFR-ERR envelope `{success:false,…}` contradicts 03-api-contract `{error:{code,message,detail}}` (P1).
- NFR-AUD emergency field + IN_REVIEW source: P1/P2 per §9.

## 12. Product Decision Alignment

D1/D3/D4/D5(95%/24h)/D7-formula/D8-intervals/D9: stated correctly. DRIFT: D2 (Admin emergency source
bypasses moderation); D6 (third mapping + U1–U4 cap); D7 (70%/80% thresholds in P1-FR-004);
D8 (Rating 1–5 mechanism vs deterministic RPC); retry D-number citations (D5↔D7 swaps).
Mapping A / 95% / cooldown / two-pass / 70% / Policy B / local-tz streak / clone-to-draft /
Manager-driven / SoD: violated in the instances above (**FAIL**).

## 13. MVP Boundary Check

TOEIC-200Q/Exam/QuestionBank properly REJECTED (semantic PASS); MATCHING excluded; DKT/HLR/MultiWOZ/
CEFR-cert/recovery/DOCX/Android absent as active MVP (PASS). Badges correctly P2 (PASS).

## 14. Traceability Audit

| Item | Source | Target | Evidence Quality | Status |
|---|---|---|---|---|
| Survey→PP→FR | xlsx recounts | P1-FR rows | 4 count mismatches + 2 untraceable | FAIL (P1) |
| E-ID traces (E-PRI/E-SEC/…) | cited ~40× | NO register exists (§0.1 has none; "Bảng Đăng ký §0.1" missing) | broken | FAIL (P1) |
| FR→UC | Table 6.2 | UC-10-badges wrong; BF-16 nonexistent; BF-02 mistraces | broken links | FAIL (P1) |
| Secondary→claims | S1–S6 | mostly aligned | titles/URL wrong (§7) | PARTIAL (P1) |
| Zero-orphan conclusion | §6.3 TIP | contradicted by above | false | FAIL |

## 15. Academic Integrity Audit

Hard-fail scan: no fabricated respondents (N=15 verified real); no N=500 import; synthetic correctly
labeled; no model-memory citations (S1–S6 all real, fetched). BUT: invented statistic ("60% thời gian"),
interview specifics without source, wrong ref titles, dead S6 URL, and false "100% verified/0 orphan"
self-claims. Verdict: integrity failures of misreporting class (P1s above), not wholesale fabrication —
still FAIL per §21 (primary-data mismatch + unsupported major claims + false traceability).

## 16. Plan Compliance

Plan required: structure/headings present (A–F + refs + gates + 20-section coverage claim) — form PASS.
Substance gaps: sample-report structural mapping provisional (file absent from repo — plan honestly states this);
evidence model used but E-ID register never created; TBD-metric rule violated by 100ms/200ms ACs;
orphan-check claimed but wrong. Compliance: PARTIAL (headings ≠ execution).

## 17. Findings Matrix

| ID | Severity | Finding | Evidence | Impact | Recommendation |
|---|---|---|---|---|---|
| F-DATA-01 | P1 | Table 1.4 row 4 counts wrong (7 vs 9; 6 vs 8) | xlsx COL5 recount vs doc:198 | Survey table untrustworthy | Recount from xlsx; fix row |
| F-DATA-02 | P1 | Table 1.1 rows 7–8 (6/15, 5/15) untraceable | no raw derivation | Unsupported difficulty ranking | Derive openly or remove counts |
| F-DATA-03 | P1 | Minor count errors (Q22 8vs7; Q23 9vs10; Q12 2vs1) | recounts §6 | Systematic recount weakness | Full independent recount of all k/15 |
| F-MAP-01 | P1 | Third placement mapping (8–15/16–23/24–30, U1–U4) | §P1-FR-016:762–771 | Competing canonical rule | Replace with Mapping A bands + U1–U6 |
| F-D7-01 | P1 | 70%/80% completion thresholds + `is_completed` | §P1-FR-004:551–558 | Violates frozen D7 + schema | Rewrite to D7 semantics + status enum |
| F-SCH-01 | P1 | Invented schema names (`user_roles`, `user_srs_items`, `vocabulary_items`, `last_active_date`, `daily_goal_minutes`*) | §P1-FR-001/005/006/011/014, §5.4 register | FRs don't match verified DB | Align to migration-verified names (*minutes=P2 naming) |
| F-SCH-02 | P1 | P1-FR-005/006 Rating 1–5 + repetition mechanics vs RPC | RPC params boolean; baseline labels | Contradicts implementation+baseline | Rewrite to Again/Hard/Good/Easy + RPC truth |
| F-STO-01 | P1 | `audio-assets`/5MB/m4a vs lingora-media/10MB/mpeg-wav | migration 003 | False storage spec | Correct bucket/limits/types |
| F-MET-01 | P1 | Invented metrics (100ms, 200ms) as acceptance | §P1-FR-010:666, NFR-LOC:810 | NFR overclaim | TBD + measurement plan |
| F-PUSH-01 | P1 | Browser/push notifications as supported | §1.7:181, B9:262, Table 2.2:281 | Contradicts DEFERRED 6a/6b | In-app only |
| F-EMG-01 | P1 | Admin emergency `IN_REVIEW→PUBLISHED` | PP-08:401, §5.4 table, NFR-AUD:803 | Bypasses moderation; contradicts verified M2.1 P0 | APPROVED-source emergency only |
| F-CIT-01 | P1 | Wrong ref titles S1/S2/S3; dead S6 URL | §7:855–877; S6 URL→404 live | Broken citations | Correct titles; replace S6 URL with verified slug |
| F-INT-01 | P1 | P1–P6 names/ages/jobs/vivid specifics sans source | Table 3.1:309–314; no transcripts in repo | Unsupported interview evidence | Theme-level only or file transcripts |
| F-TRC-01 | P1 | E-ID codes undefined; missing register; wrong UC/BF links (UC-10-badges, BF-16, BF-02 mistraces) | §6.3 + §14 table | False traceability | Create register; fix links |
| F-API-01 | P1 | NFR-ERR envelope contradicts 03 contract | NFR-ERR:810 vs 03:145 | False API spec | Adopt `{error:{code,message,detail}}` |
| F-PP-01 | P1 | "tốn 60% thời gian" invented | PP-01:394 | Fabricated stat | Remove or source |
| F-NFR-01 | P2 | Unverified MANDATORY metrics (SEC/RBC/PRV/MNT 100%s, pnpm) | §6.2 rows 1–4,7 | Overclaim posture | Evidence or demote to TBD/target |
| F-BM-01 | P2 | Weak/stale benchmark sources (generic URLs, Incubator, Settles misattribution, D-number swaps) | §2.2 rows 2,4,5,8,12,14 | Weak evidence chain | Pin article URLs; fix refs |
| F-TRI-01 | P2 | CONVERGENT resting on unverifiable specifics; gov row in user matrix | Table 3.2 rows 1,2,4,5,6 | Overclaim convergence | Downgrade/soften; move gov row out |
| F-Q-01 | P2 | "sau 1–2 tuần", occupations, 24–48h precision, 100 câu hypothetical, "100% hợp lệ", 100%-audio mandate | various | Unsourced precision | Soften or source |
| F-STALE-01 | P2 | Line 907 M2.1 state contradicts verified state | :907 vs targeted re-review | Stale governance | Update state string |
| F-ED-01 | P3 | `rule_explanation` unverified; invented UI routes; Segoe UI mandate tone | various | Minor | Verify vs ADR-006 or soften |

## 18. Required Corrections

Listed above (F-DATA through F-ED); no file touched by this review. Priority order:
1. F-MAP-01, F-D7-01, F-EMG-01 (frozen-policy contradictions). 2. F-DATA/F-CIT/F-TRC (evidence truth).
3. F-SCH/F-STO/F-API (verified-foundation alignment). 4. F-MET/F-PUSH/F-PP-01/F-INT (claims).
5. P2/P3 hygiene. Then independent re-verification (recount + URL re-fetch) before any PASS.

## 19. Final State

`PHASE 0 = REQUIRES CORRECTION`

`M2.2 = NOT STARTED`

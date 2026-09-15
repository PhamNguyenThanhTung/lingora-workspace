# M2.1 INDEPENDENT RE-REVIEW — DOMAIN & LOGICAL DATA FOUNDATION

> **Report:** `docs/phase-1-m2-1-independent-re-review.md`
> **Role:** INDEPENDENT RE-REVIEW (not self-approval). No files modified during review. No M2.2 started.
> **Sources read directly:** M2.1 md (888 lines, full), 4 PlantUML (full), baseline
> (`phase-0-roles-and-mvp-final.md:64`, `06-system-analysis.md:218,323,737`, decision sheet,
> `02:259`, `05:14,52,74-75`, `09 §2/§9`), applied migrations
> (`.../202608140001_init/migration.sql` CREATE TABLE ×17, `ExerciseType` enum line 11,
> `user_progress` lines 147–157, `user_vocab_srs`/`review_logs` lines 161–192;
> `.../202608140002.../migration.sql` `record_review` params lines 193–196 + streak logic,
> `user_progress_own_read` policy), `schema.prisma` (target).
> **Renderer:** unavailable (no java) → static checks only, no render claims.

## Executive Verdict

**FAIL — M2.1 REQUIRES CORRECTION**

One P1 documentation defect (false `CURRENT_APPLIED` field claims on SRS tables, 3 spots)
violates D-G2 truthfulness and D-G6. One P2 labeling deviation (`LEGACY_APPLIED` scope axis).
Everything else passes, including the P0 emergency-authority hard gate. Fix is small and scoped;
re-review after correction should be fast. No corrections applied by this review (per §12).

## Finding Matrix

| ID | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| P0-01 | P0 | Admin emergency authority must match baseline (normal=Manager; emergency with condition+reason+AuditLog; all prohibitions) | M2.1 §5.1:246–262, §5.2 rows 274–277, §5.3 rows 287–294, puml lines 35,38,45,52–61 vs baseline `roles-and-mvp-final.md:64` (Approved→Published incl. Admin khẩn cấp), `06:323` (emergency archive) | PASS |
| F-01 | (old) | Emergency publish/archive baseless? | Baseline HAS basis (above); M2.1 restores with constraints, no normal-publish for Admin | PASS |
| F-02 | (old) | Creator bypass D1 | Matrix starts Manager PLAN_AND_ASSIGN (§5.2:268); puml `[*]-->DRAFT` by Manager only (line 17); forbidden row §5.3:293 | PASS |
| F-03 | (old) | ExerciseType/MATCHING | §8.8 per-value rows; applied enum verified `('MCQ','FILL_BLANK','REORDER')` (migration line 11); MATCHING only in "removed/0-occ" statements (md:124,536,737,756,776,879); 0 in puml | PASS |
| F-04 | (old) | lesson_type locked | §6.5:374 candidate only | PASS |
| F-05 | (old) | Retry N=5 hard-code / completion | §6.4:353–362 general N + correct completion; puml lines 56–61 general N; "5 câu/bài" only as curriculum-input note (:357, explicitly non-invariant) | PASS |
| F-06 | (old) | Placement confirm-apply rule | §6.2:335 removed to FUTURE UX OPTION; puml flow test→score→unit→save, no confirm gate (lines 25–44) | PASS |
| F-07 | (old) | DD-02 resolved | §5.4:306 OPEN; candidates only | PASS |
| F-08 | (old) | AuditLog mixing | §5.6:315–319 TARGET vs ABSENT vs REQUIRED; §7.1 row 16; §8.16 | PASS |
| F-09 | (old) | DD-06 locked physical | §6.6:378–381 TARGET CANDIDATE/FUTURE, OPEN | PASS |
| F-10 | (old) | Dictionary 100% claim | 18 sections §8.1–8.18 exist BUT §8.15:608 false row (see P1-01) | PARTIAL |
| F-11 | (old) | ERD Extension vs Future mix | §7.1 rows 19–21 separate axes; TARGET_EXT 0 in artifacts (only "removed" mentions md:735,754,775,778,877); erd puml canonical EXTENSION+FUTURE (lines 197–214) | PASS (with P2-01) |
| F-12 | (old) | Render-validated claim | §4.2:134 + §7.2:430 static-only notes; no render claims found | PASS |
| C-01 | Critical | DD-07/DD-08 applied evidence | user_progress DDL lines 147–157; srs/review DDL 161–192; record_review params 193–196 + streak; RLS `user_progress_own_read` verified; app-layer algorithm separation §6.4:366, §6.7:390 | PASS |
| C-02 | Critical | 18 core tables count | §7.1 #1–18; §8.1–8.18 headings verified; applied PRESENT=15 (#1,2,3,6,7,8,9,10,11,12,13,14,15,17,18) vs 17 CREATE TABLEs; target-only=3 (#4,5,16); future-required=7; count is real | PASS (count) / FAIL (truthfulness — see P1-01) |
| C-03 | Critical | Enforcement claims | Only proper disclaimers (§5.3:296–298); "khóa cứng" scoped to LOCKED BEHAVIOR (:846); 0 false DB-enforcement claims | PASS |
| P1-01 | **P1** | **False CURRENT_APPLIED field claims (SRS tables)** — `review_logs.score INTEGER NULL CURRENT_APPLIED` (§8.15:608) and `recall_score [Applied]` + `score [Applied]` (domain-model-core.puml:99,105); applied migration has NEITHER column (review_logs: id/srs_card_id/is_correct/interval_days/reviewed_at; user_vocab_srs has recall_probability, no score/recall_score) | md:608; puml:99,105; migration 161–192 | **FAIL — requires correction** |
| P2-01 | P2 | Scope-axis label `LEGACY_APPLIED` (§7.1 rows 22–23) deviates from canonical Scope {CORE,EXTENSION,EXCLUDED}; truthful content, wrong axis value — normalize to EXCLUDED + compat note | md:423–424 | OPEN (fix with P1-01) |
| O-01 | Obs | Task text cites emergency `IN_REVIEW->PUBLISHED`; M2.1 models emergency `APPROVED->PUBLISHED`, matching cited baseline source (roles:64). Stricter + baseline-faithful. No action. | roles:64 vs §5.2:275 | ACCEPTABLE |
| O-02 | Obs | puml omits some applied SRS columns (recall_probability, last_reviewed_at, lapse_count, created_at) while §8.14 lists them correctly — align during P1-01 fix. | puml:91–109 vs md:594–601 | NOTE (fix with P1-01) |

D1–D9 drift check: D1/D2/D3 (§5 + puml, incl. F-02 prohibitions) PASS; D4 (no Exam/QB entity; assessment-mode candidates open, §6.5) PASS; D5 (sizes 20/25–30/40, 95% policy, 24h — §6.3 + puml:74–86) PASS; D6 (30/Skip/Retake/StartingUnit/Mapping A bands verified puml:27–38, no CEFR, no confirm rule) PASS; D7 (general N, 70%, completion semantics) PASS; D8 (Policy B, deterministic, no ML/entities) PASS; D9 (deferred, no freeze/recovery) PASS.

## D-G1

- **Input:** Artifacts 1–3 (§4–6), 4 puml, baseline (02/05/06/08/09, roles, decision sheet).
- **Validation method:** rebuilt trace table independently (spot-verified, not self-report):

| Item | Evidence | Result |
|---|---|---|
| Core entities → FR/UC/BF | §4.3 table + §7.1 inventory + 05 matrix | PASS |
| Lifecycle states → FR/UC/BF | §5.2 matrix + puml + UC-08/09/10, BF-05/06/07 | PASS |
| Admin emergency authority | baseline roles:64 + 06:323 vs §5.1–5.3 + puml:38,45 | PASS |
| Separation of duties | §5.3 rows 287–291 + puml note 52–61 + 06:737 | PASS |
| No archived→draft Core | matrix row 294 + note :280–281; puml: no ARCHIVED arrows, prohibitions :47,61; clone arrow is PUBLISHED→DRAFT (:50, matrix :278) | PASS |

- **Verdict:** **D-G1 PASS.**

## D-G2

- **Input:** Artifacts 4–5 (§7–8), 04-data-model, schema.prisma, migrations 001–003.
- **Validation method:** per-table applied/target/future verification against migration DDL (17 CREATE TABLEs, enum line 11, RLS policies, record_review); per-value ExerciseType check; candidate-label check; dictionary section inventory.
- **Evidence:** C-01/C-02 verified counts above; §8.8, §8.4/8.5/8.16 TARGET labels correct; BUT P1-01 false applied rows.
- **Verdict:** **D-G2 FAIL** (sole cause: P1-01; dictionary-100% claim at §7.1:426 and §9.2:739 overstates until fixed).

## Scope Check

- `git status --short`: M2.1 md + 4 puml are untracked new files (fix work product, design-docs scope — in scope).
- `git diff --check -- docs/`: clean (only LF warnings).
- No changes made during this re-review (reviewer touched zero files; report file creation is the only write).
- Pre-existing worktree modifications (schema.prisma target redesign, web reset, cleanup deletions) predate and are independent of M2.1; no migration/runtime files were added or altered by the M2.1 fix (migrations dir: no new files; M2.1 artifacts are docs-only).
- Forbidden-token repo-scope search in M2.1 artifacts: MATCHING/Exam-as-entity/QuestionBank/TARGET_EXT/ARCHIVED→DRAFT-transition all 0 (only removal/prohibition mentions). No scope breach by M2.1 content.
- **Scope: CLEAN.**

## PlantUML Check

| File | Static syntax (`@startuml`/`@enduml` balance) | Forbidden tokens | Semantic consistency vs md | Renderer |
|---|---|---|---|---|
| domain-model-core.puml (:1–192) | PASS | none (no MATCHING/Exam/QB/TARGET_EXT/ARCHIVED→DRAFT) | CONSISTENT except P1-01 field tags (:99,105) | UNAVAILABLE → STATIC SYNTAX CHECK PASS — RENDERER UNAVAILABLE |
| content-lifecycle-state.puml (:1–64) | PASS | :47,:61 are prohibitions, not transitions; 0 arrows from ARCHIVED | CONSISTENT with §5.1–5.3 (Manager normal, Admin emergency+reason+audit, clone candidate) | UNAVAILABLE → STATIC ONLY |
| learning-progression-model.puml (:1–97) | PASS | none; Mapping A bands exact; general-N retry; no confirm gate | CONSISTENT with §6.2–6.4 | UNAVAILABLE → STATIC ONLY |
| erd-logical-status-mapping.puml (:1–263) | PASS | none (EXTENSION+FUTURE canonical; :137 `example:text` false positive) | CONSISTENT with §7.1 (modulo P2-01 label) | UNAVAILABLE → STATIC ONLY |

## Remaining Risks

1. P1-01 (above) — blocks M2.1 approval; fix = delete/re-tag 3 rows + align puml SRS classes with §8.14.
2. P2-01 LEGACY_APPLIED label — normalize with the same fix pass.
3. Pre-existing worktree dirt (uncommitted target-schema/web changes) is outside M2.1 but M2.2 implementers must not mistake uncommitted target files for applied reality — restate 3-state boundary at M2.2 kickoff.

## Handoff State

**M2.1 — REQUIRES FIX**

**M2.2 — NOT STARTED** (verified: no `phase-1-m2-2*` or `*m2-2*` artifacts; M2.1 §12.7 stop commitment intact).

**STOP.** No M2.2, no API/architecture design, no migration, no code. Awaiting fix + re-review of P1-01/P2-01 only.

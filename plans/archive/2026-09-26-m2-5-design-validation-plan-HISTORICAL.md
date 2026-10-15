# M2.5 PLAN — Design Validation (PLAN ONLY)

> Status: `APPROVED` (human approval recorded 2026-09-26: initial review `PASS WITH NON-BLOCKING ISSUES`, remediation `P2-01 = CLOSED`, final re-review `PASS`; approved scope: Artifact #20 Design Validation Report, D-G1–D-G9 validation, six-field × 20 validation, contradiction/drift scan, traceability/report-mapping verification, validation-status recording for open decisions; no physical resolution; implementation NOT STARTED).
> Entry state: `M2.4 ACCEPTED FOR M2.5` (ADR-027; checkpoint commit `0a9a126`), `M2.5 PLAN: APPROVED`.
> Baseline: the M2.4 commit plus canonical roadmap/documents — NOT the dirty worktree. Unrelated/pre-existing D4/M2.1 worktree changes are out of scope and must remain untouched.
> Boundary: PLAN ONLY. No runtime code, Prisma/schema, migrations, RLS SQL, UI, tests execution beyond read-only scans, secrets, infrastructure, or service-code changes. No implementation artifacts created by this planning task itself.

## 1. Executive Summary

M2.5 closes no product policy, resolves no open physical design decision, implements nothing, and claims no production readiness. It turns the accepted design package (M2.1 domain/logic, M2.2 behavior, M2.3 interaction/service boundary, M2.4 architecture/security) into an **authoritative design validation package**: a single Artifact #20 report consolidating D-G1–D-G9 evidence (each gate with recorded Input, Method, PASS/FAIL, Evidence), a six-field completeness check over all 20 artifacts, a cross-artifact contradiction/drift/boundary scan, a trace-completeness verification (FR→UC→BF→artifact plus `docs/phase-1-system-design-plan.md` §11 report-mapping verification), and an open-decision closure RECORD (status recorded, nothing resolved). D-G10, DD physical resolution, migration planning, and any production-readiness claim belong to M2.6 or later and are explicitly excluded.

## 2. Current Baseline

Accepted, frozen, read-only inputs: M2.1 (domain/logic, Applied/Target/Future statuses, DD register, D-G1/D-G2 PASS), M2.2 (15 UCs, 15 BFs, state machines, decision flows, D-G4/D-G7 PASS), M2.3 (SEQ-01..10, #12 boundary table, #15 service model, ownership matrix, D-G4/D-G5 PASS, D-G6 input-only), M2.4 (Artifacts #13/#14/#16: 19 components in 5 layers, 5 logical security zones, one 6-boundary × 15-operation matrix, DD-03/DD-10 three-tier verdicts with physical representation OPEN, D-G5 design evidence PASS, D-G6 INPUT EVIDENCE ONLY, target runtime NOT PRODUCTION READY / NOT DEPLOYED). Architecture baseline: `01` §§3.1–3.8; ADRs 002/003/005(+PA2)/006/008/010/014/020/025/026/027; SEC-D1..D10; `03` API contract (AI-service scope, read-only, byte-identical). The stale `HANDOFF.md` “Next step: human independent review of M2.4” line is historical superseded context; normative acceptance is ADR-027 plus commit `0a9a126`.

## 3. Exact Roadmap Scope

Per `phase-1-system-design-plan.md` §7: **Scope: Artifact 20 and all cross-artifact contradiction/trace checks. Input: Artifacts 1–19, baseline audits, decision register, risks, report mapping. Output: evidence index, gate results, contradiction scan, open-decision closure record. Dependencies: M2.1–M2.4; §§8, 10, and 11. Validation: D-G1–D-G9 with recorded Input, Method, PASS/FAIL, and Evidence for each gate. Exit: all gates have evidence; every artifact satisfies six fields; no unresolved P0/P1 design contradiction or requirements drift exists.** Canonical title (no rename):
- **#20 Design Validation Report** — consolidate gate evidence, contradiction scan, open-decision closure record, and report synchronization.
Explicit exclusions: D-G10 (M2.6 handoff readiness), DD physical-tier resolution (M2.6), migration-plan outline and test-plan skeleton beyond evidence pointers (M2.6 §12), any production-readiness or deployment claim.

## 4. DD Handling (record only, resolve nothing)

All of DD-01, DD-02, DD-03, DD-04, DD-05, DD-06, DD-10 stay OPEN in physical representation through M2.5. M2.5 records per decision: tier status (Locked / Design Specification / Open Physical as established, with M2.4’s DD-03/DD-10 Design Specification closures preserved verbatim), blocking-for-handoff flag per §8.2, evidence pointer, and explicit `OPEN` label. It resolves no metadata shape, trigger/app-emission choice, IP/device field, retention value, revision identity, assignment field, assessment-context field, placement-history strategy, role-migration sequencing, or DDL/SQL. If any DD tier appears to require closure in order to record validation → STOP per §15 (record, invent nothing).

## 5. Artifact-by-Artifact Work Plan

Only Artifact #20 is produced; Artifacts 1–19 are validated read-only (zero edits to their semantics):
1. Title/purpose per §3. 2. Source traceability: Artifacts 1–19 master specs + `01` + `03` + `04`/`07` + `05` + `06` + `08`/`09` + ADRs + SEC-D1..D10 + §§8/10/11/13/14. 3. Scope: validation evidence only — no new rules, entities, thresholds, or policies. 4. Logical-vs-physical: report records design-level evidence; physical proof stays future work. 5. Inputs: per §3. 6. Outputs: Artifact #20 sections (§20.1 gate evidence D-G1..D-G9; §20.2 six-field×20 checklist; §20.3 contradiction/drift log; §20.4 trace-completeness matrix + `docs/phase-1-system-design-plan.md` §11 mapping verification; §20.5 open-decision closure record; §20.6 DoD gap list for M2.6). 7. Dependencies: M2.1–M2.4; §§8, 10, 11. 8. Actors/roles: read-only use of the 6 canonical roles; no role change. 9. Responsibilities: evidence ownership per gate (which artifact/input evidences which gate). 10. Open decisions: none closed; closure record only. 11. Gates: D-G1..D-G9 evidenced; D-G10 explicitly NOT evidenced (M2.6). 12. Files: `docs/phase-1-m2-5-design-validation.md` (§20 sections), no new PlantUML by default. 13. Verification: §11 verification plan. 14. Acceptance: §14 — every gate has Input/Method/PASS-FAIL/Evidence; zero new IDs; zero semantic changes to Artifacts 1–19.

## 6. Security Model Plan (regression only)

No new security design. Re-walk only, against M2.4 Artifact #16 rows × SEQ-08 paths: App Authorization + Database RLS dual presence per operation (app never replaces RLS); privileged service-role isolation (`N/A — privileged service-role path`, least-privilege, non-exposed, auditable); SoD negatives (`403 SOD_VIOLATION_SELF_REVIEW`, `403 SOD_VIOLATION_MODERATOR_PUBLISH`, no `IN_REVIEW→PUBLISHED`, Admin emergency on `APPROVED` only + reason + AuditLog); secret isolation (zero service-role key in learner/client); AI stateless/proxied/JWT/8.0s timeout/fallback; audit owner per operation. Any walkthrough mismatch is a recorded finding (P0/P1/P2) — never a silent fix.

## 7. Architecture Plan (regression only)

No architecture change. Re-verify only: 5-layer one-way acyclic hierarchy over 19 components; 5 logical security zones as zones (not provisioning); CURRENT_APPLIED vs TARGET_DESIGN vs FUTURE_EXTENSION labels intact; zero target-as-ready claims; component rule/data ownership single-owner invariant. Any drift is a recorded finding — never a silent edit to `01` or Artifacts #13–#15.

## 8. Current vs Target vs Future

M2.5 introduces zero new status labels. It verifies existing labels across ERD/status mapping, Data Dictionary, DFD stores, and Architecture/Deployment notes: every entity/field/store/secret/policy carries exactly one of CURRENT_APPLIED / TARGET_SCHEMA (or TARGET_DESIGN) / FUTURE_MIGRATION (or FUTURE_EXTENSION); target existence is never described as runtime readiness. Any conflation, missing status, or invented entity/column is a P1 finding.

## 9. Traceability Plan

Verify — do not extend semantics: Requirement → MVP → P1-FR → UC → BF → Domain → D3 → D4 → M2.2 → M2.3 → M2.4 → M2.5 evidence index; `01` §§3.1–3.8 and `05` §§7–10 frozen read-only. The M2.5 validation evidence index belongs to the Artifact #20 validation specification/report package by default; `docs/05-traceability-matrix.md` remains read-only by default and appends a `docs/05-traceability-matrix.md` §11 validation evidence index ONLY if the §12 conditional condition is demonstrably satisfied (existing `05` §§1–10 content untouched); `docs/05-traceability-matrix.md` §11 must not be confused with `docs/phase-1-system-design-plan.md` §11. `docs/phase-1-system-design-plan.md` §11 report-mapping table verified row-by-row (Artifacts 1–20 → report chapters, UC/BF, evidence). Consume existing IDs only (UC-01..15, BF-01..15, DD-*, P1-FR-*, ADR-*, OP-01..15, SEQ-01..10). Zero new IDs; zero renamed artifacts.

## 10. Open Decision Firewall and Explicitly Preserved Invariants

Carry-forward register — all stay OPEN and all invariants below are preserved verbatim (M2.5 closes none, changes none): 6 canonical roles; UC-01..UC-15 only; BF-01..BF-15 only; `LearningProgress != Proficiency != Mastery != LevelReadiness`; self-report UNVERIFIED (never verified proficiency); diagnostic → AssessmentResult → SkillProfile → verifiedProficiency → curriculumStartingPoint; AssessmentResult immutable with retake-as-new-result; D1–D9 locked; content lifecycle + SoD (Creator≠self-review, Moderator≠publish, Admin emergency on APPROVED only + reason + AuditLog); AI/GEC stateless with zero learner-state ownership; App AuthZ never replaces DB RLS; privileged service-role isolation; CURRENT_APPLIED vs TARGET_DESIGN vs FUTURE_EXTENSION; DD-03/DD-10 three-tier split with physical OPEN; D-G5/D-G6 status exactly as M2.4 (design evidence / input-only; NOT closed for production); target runtime NOT PRODUCTION READY / NOT DEPLOYED. Open physical/content/behavioral items (DD-01..06/10 physical; mastery/readiness/remediation thresholds; adaptive/stopping; scoring/Anchor; recommendation policy/version; CEFR expansion; HSK mapping/version; gap archival; Reading physicalization; diagnostic `~25–30 PROPOSED`; placement-history strategy) are accommodated (threshold-agnostic, version-tolerant references), never force-closed.

## 11. Verification Plan

Deterministic, read-only scans (no implementation execution): six-field contracts ×20 (Purpose/Inputs/Outputs/Dependencies/Trace/Validation Gate each present and non-generic); D-G1..D-G9 evidence completeness (each gate has Input, Method, PASS/FAIL, Evidence); contradiction/drift/boundary scan per D-G9 pattern list (obsolete terminology, requirements-change language, Exam/QuestionBank, CEFR claims, future-as-Core, target-as-ready, stale source refs; every match dispositioned as removed or labeled historical/extension/out-of-scope); trace integrity (zero orphan/broken FR→UC→BF→artifact links); open-decision-freeze scan (zero silent closures); contract-drift check (`03` byte-identical); invariant regression scan (all §10 invariants); M2.2/M2.3/M2.4 value regression (Mapping A, Jump ≥95%/24h, Retry 10%/70%, SRS Policy B, streak date boundary, SoD, 8.0s GEC timeout, RLS/RPC ownership). PlantUML checks (if any validation diagram is warranted, syntax-balance only) plus `git diff --check` hygiene on touched files.

## 12. File Allowlist (implementation phase ONLY)

`docs/phase-1-m2-5-design-validation.md` (new), `docs/05-traceability-matrix.md` §11 (validation evidence index ONLY — `05` §§1–10 frozen read-only; default: if the index fits inside the Artifact #20 spec, `05` stays fully read-only; this §11 means `docs/05-traceability-matrix.md` §11 and must not be confused with `docs/phase-1-system-design-plan.md` §11), `logs/` (append-only), `HANDOFF.md`, `plans/current-task.md` (only when implementation is human-approved). Nothing else. No `01` edits. No new PlantUML by default (syntax-only if an evidence diagram proves warranted).

## 13. File Denylist (must remain untouched)

Runtime (`lingora-web/`, `lingora-admin/` code, `lingora-ai/` code), Prisma schema/migrations, RLS/migration SQL, `docs/03-api-contract.md` (byte-identical), M2.1/M2.2/M2.3/M2.4 accepted artifacts (read-only baselines; corrections go through their own review tasks, never silent M2.5 edits), canonical decisions/ADRs (no rewrites), DD physical resolution (M2.6), D-G10 evidence (M2.6), any implementation/test execution beyond read-only scans, historical records, unrelated pending work (D4/M2.1 files, reports, PPTX, scratch/tmp) — DO NOT CLEAN/RESET/COMMIT/REFORMAT/OVERWRITE (worktree discipline).

## 14. Acceptance Criteria, Verdict Definitions, and Required Review Evidence

Binary M2.5 exit: (a) Artifact #20 complete with D-G1..D-G9 evidence rows (Input/Method/PASS-FAIL/Evidence each); (b) six-field checklist ×20 complete with zero missing/generic fields; (c) contradiction scan complete with zero unresolved P0/P1 and every match dispositioned; (d) trace verification complete with zero orphan/broken links and zero new IDs; (d2) `docs/phase-1-system-design-plan.md` §11 mapping verified row-by-row; (e) open-decision closure record complete with all blocking DDs labeled OPEN for handoff; (f) D-G10 untouched; (g) zero implementation work performed. Verdicts: `PASS` = all gates PASS with zero open P0/P1/P2 findings; `PASS WITH NON-BLOCKING ISSUES` = 0 P0, 0 P1, N P2 with recorded dispositions, accepted as M2.6 input; `FAIL` = any P0/P1 open, any gate FAIL, any silent closure/invention, any scope-creep edit, or any implementation executed. Independent-review evidence pack: Artifact #20 spec; gate-evidence table (9 gates); six-field checklist; contradiction match/disposition log; trace-verification output; open-decision register; `03` hash/byte comparison; `git diff --check`; regression-scan outputs; frozen-baseline reference list (M2.1–M2.4 commits/specs).

## 15. STOP Conditions and No-Scope-Creep Rule

STOP (record, invent nothing; return for human resolution) if: authoritative sources conflict; any DD tier needs invention to record validation; physical implementation or test execution becomes necessary to evidence a gate; current/target indistinguishable; untraceable requirement or new ID required; an open decision must be frozen to pass validation; accepted M2.1–M2.4 semantics must change; D-G10 or production-readiness evidence is demanded inside M2.5; report-mapping chapter change requires doc edits beyond the §12 allowlist. No-scope-creep rule: M2.5 adds evidence and records only — any design content change, policy closure, threshold choice, schema/RLS/API/UI edit, or D-G10 claim is out of scope even if it would make validation “pass cleaner.” None triggered at plan time.

## 16. Plan Approval Record

- **Approval Decision:** `M2.5 PLAN = APPROVED`
- **Date:** 2026-09-26
- **Review Trail:**
  - Initial Review: `PASS WITH NON-BLOCKING ISSUES` (`P2-01 — Ambiguous bare §11 references`)
  - Remediation: `P2-01 = CLOSED` (explicit document qualification across all §11 references)
  - Targeted Final Re-Review: `M2.5 PLAN = PASS`
- **Approved Scope:**
  - Artifact #20 Design Validation Report (`docs/phase-1-m2-5-design-validation.md`)
  - D-G1 through D-G9 validation (recorded Input, Method, PASS/FAIL, Evidence per gate)
  - Six-field × 20 validation (deterministic completeness check over all 20 artifacts)
  - Contradiction/drift validation (D-G9 pattern scan, dispositioning all matches)
  - Traceability & report-mapping verification (FR→UC→BF→artifact and `docs/phase-1-system-design-plan.md` §11 row-by-row)
  - Validation-status recording for open decisions (systematic closure record; DD-01..06 and DD-10 remain OPEN)
  - No physical-resolution work (no DDL/SQL, no metadata schema locking, no migration sequencing)
- **Preserved Constraints & Invariants:**
  - D-G10 excluded (deferred to M2.6 handoff readiness)
  - DD-01..06/10 remain OPEN where currently open
  - DD-03 physical representation remains OPEN
  - DD-10 physical representation remains OPEN
  - No runtime/schema/migration/UI/infra implementation
  - No production-readiness claim (target runtime NOT PRODUCTION READY / NOT DEPLOYED)
  - D-G5/D-G6 remain at the status established by M2.4 (design evidence / input-only; NOT closed for production)
  - CURRENT_APPLIED / TARGET_DESIGN / FUTURE_EXTENSION remain distinct
  - M2.4 accepted invariants remain unchanged (6 canonical roles, 15 UCs, 15 BFs, SoD negatives, stateless AI with 8.0s timeout, App AuthZ does not replace RLS, privileged service-role isolation)
  - `docs/03-api-contract.md` remains 100% byte-identical / read-only
- **Implementation State:** `M2.5 IMPLEMENTATION = NOT STARTED`

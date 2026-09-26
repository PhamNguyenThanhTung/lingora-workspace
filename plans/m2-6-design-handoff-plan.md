# M2.6 PLAN — Design-to-Implementation Handoff — APPROVED

> Status: `APPROVED` (human approval recorded 2026-09-26: initial review `FAIL` [P1-01, P2-01..P2-07], remediation `ALL CLOSED`, final re-review `PASS`; approved scope: migration-plan outline + rollback [8 phases], test-plan skeleton [17 frames], API dependency register [4 tiers], security/audit reconfirmation [6 boundaries, 5 zones, 15 ops, 11 events], academic report mapping + artifact/evidence index, DD-01..06/10 Tier-3 physical decisions on paper [10 columns], Implementation & Governance Dependency Register [9 fields], D-G10 validation; DESIGN HANDOFF / HANDOFF-ONLY; zero execution; implementation NOT STARTED; acceptance NOT recorded; commit NOT created).
> Entry state: `M2.5 ACCEPTED FOR M2.6` (ADR-028; checkpoint commit `d09f7cc`), `M2.6 PLAN: APPROVED`, `M2.6 IMPLEMENTATION: NOT STARTED`.
> Baseline: the M2.5 commit plus canonical roadmap/documents — NOT the dirty worktree. Unrelated/pre-existing D4/M2.1 worktree changes are out of scope and must remain untouched.
> Boundary: PLAN ONLY. No runtime code, Prisma/schema, migrations, RLS SQL execution, UI, test execution, secrets, infrastructure, production deployment, or service-code changes. No implementation artifacts created by this planning task itself.

## 1. Executive Summary

M2.6 is the final Phase 1 milestone and a handoff milestone only: it converts the validated design package (M2.1 domain/logic, M2.2 behavior, M2.3 interaction/service boundary, M2.4 architecture/security, M2.5 validation evidence for D-G1..D-G9) into an **implementation-readable handoff package** — migration-plan outline, implementation test-plan skeleton, API dependency register, security/audit reconfirmation, complete report mapping plus artifact identifier index, and the closure record that resolves the Tier 3 physical representations of DD-01..DD-06 and DD-10 **at design level** (documented TARGET decisions with order and rollback considerations; zero execution). It closes the remaining open physical design decisions on paper, evidences D-G10, and implements nothing: no migration execution, no schema change, no RLS deployment, no API/UI code, no test execution, no production readiness claim beyond handoff completeness.

## 2. Current Baseline

Accepted, frozen, read-only inputs: M2.1 (D-G1/D-G2 PASS), M2.2 (15 UCs, 15 BFs, D-G4/D-G7 PASS), M2.3 (SEQ-01..10, #12, #15, D-G4/D-G5 PASS, D-G6 input-only), M2.4 (Artifacts #13/#14/#16, 19 components, 5 zones, 6-boundary × 15-operation matrix, DD-03/DD-10 three-tier verdicts with physical OPEN, D-G5 design evidence, D-G6 input-only, target NOT READY), M2.5 (Artifact #20 validation report: D-G1..D-G9 evidenced with Input/Method/PASS-FAIL/Evidence, six-field ×20 complete, 11-category D-G9 scan with 0 P0/P1, traceability + `phase-1-system-design-plan.md` §11 mapping 12/12 verified, DD-01..06/10 Tier 3 physical OPEN recorded, `05` §§1–10 read-only). Architecture baseline: `01` §§3.1–3.8; ADRs incl. 026/027/028; SEC-D1..D10; `03` API contract (read-only, byte-identical).

## 3. Exact Roadmap Scope

Per `phase-1-system-design-plan.md` §7: **Scope: Design handoff only: migration-plan outline, implementation test-plan skeleton, report synchronization, and dependency register. Input: M2.5 validation report and approved design artifacts. Output: Implementation dependency list and handoff package; no executed implementation. Dependencies: M2.5; explicit report mapping in §11. Validation: D-G10 against the revised DoD and handoff evidence. Exit: Design package is implementation-readable, all open physical design decisions are resolved, report mapping is complete, and no code/schema/migration/API/UI work has been executed.** Per §12 the handoff package contains plans and skeletons only and MUST include: (1) migration-plan outline with order, rollback considerations, and Current Applied/Target/Future labels — no migration execution; (2) test-plan skeleton for Mapping A, Jump/cooldown, Retry math, SRS determinism, RLS matrix, GEC fallback — no implementation test execution required; (3) API dependency register with each surface classified CURRENT, TARGET, FUTURE, or COMPATIBILITY GAP; (4) security responsibility matrix and audit boundary (reconfirmation, not redesign); (5) complete report mapping and artifact identifier index; (6) closure record for DD-01..DD-06 and DD-10. No new numbered artifact is created (Artifacts #1–#20 are complete); the handoff package is validated as a whole under D-G10.

## 4. DD Handling (resolve Tier 3 on paper; execute nothing)

M2.6 resolves the Tier 3 physical representation of each open decision **as a documented design decision with migration/test consequences spelled out** — Locked Behavior and M2.4 Design Specification verdicts are preserved verbatim; only the OPEN physical tier is closed, and only in prose/spec form:
- **DD-01:** Target Unit relation, Current Applied/Future Migration mapping, hierarchy-preserving compatibility rule.
- **DD-02:** Revision identity/parent/version/uniqueness representation preserving immutable published history (`supersedesId` lineage).
- **DD-03:** Audit physical fields: `metadata JSONB` shape, trigger-vs-app emission choice, IP/device fields (only if justified in M2.6), retention values, exact `audit_logs` target definition.
- **DD-04:** Assignment storage fields/metadata inside the Lesson boundary (no Assignment entity).
- **DD-05:** Exercise payload JSON schema per interaction type without creating Exam/QuestionBank entities.
- **DD-06:** Placement history strategy: score, startingUnit, latest result, retake history (new immutable `AssessmentResult` per retake), timestamps, learner/profile relation, non-editability.
- **DD-10:** Role migration sequencing CURRENT 2-role → TARGET 6-role with per-step app-check vs RLS vs service-role split and backward-compatibility guarantee.
The §5.6 closure record MUST use this exact 10-column schema per decision (not a free-form table): (1) Current Status; (2) Tier 1 Locked Behavior; (3) Tier 2 Design Specification; (4) Tier 3 Physical Decision; (5) Rationale; (6) Dependencies; (7) Migration Impact; (8) Rollback Consideration; (9) Affected Artifacts; (10) Implementation Consequences. Clarification: Tier 3 is a written design decision in prose/spec form — not SQL, not an executed migration, not a schema implementation.
Hard rule: decisions are WRITTEN as target specifications, outlines, and skeletons — no `.sql` migration files authored, no `schema.prisma` edit, no RLS policy deployed, no seed executed. If any Tier 3 item cannot be resolved without executing implementation → STOP per §15 (record, invent nothing).

## 5. Handoff-Output Work Plan (per §12, items 1–6, plus Dependency Register)

Only the handoff package is produced; Artifacts #1–#20 are referenced read-only (zero semantic edits). Each output below defines its name, purpose, inputs/source of truth, required contents, evidence, acceptance criteria, and implementation firewall.

### 5.1. Output 1 — Migration-plan outline + rollback
- **Purpose:** Give Phase 2 an ordered, reversible, status-labeled path from Current Applied Database to the documented Target Schema without executing anything.
- **Inputs / Source of Truth:** DD-01..06/10 Tier 1+2 verdicts (§4), M2.1 ERD/status mapping, M2.4 deployment zones, roadmap §§8/14.
- **Required contents:** All eight phases, design-only: (1) pre-migration checks; (2) compatibility / expand; (3) data transformation / backfill; (4) role / RLS transition; (5) application cutover considerations; (6) validation checkpoints; (7) rollback strategy; (8) post-migration validation. Every step carries Current Applied/Target/Future labels, its order position, its per-step rollback target, and its DD references.
- **Evidence:** Outline section in the handoff spec; per-step labels and per-step rollback entries present.
- **Acceptance:** All 8 phases present; every step labeled with order, status transition, rollback target, and DD pointer.
- **Firewall:** No `.sql` authored, no `schema.prisma` edit, no migration run, no seed executed.

### 5.2. Output 2 — Test-plan skeleton
- **Purpose:** Give Phase 2 test frames (scenario/dataset-shape/assertion-shape templates for future executable tests) without running any test.
- **Inputs / Source of Truth:** Locked policies D5–D8, Mapping A, M2.2 decision flows, M2.4 matrix/SEQ, roadmap §12 item 2.
- **Required contents:** Scenario frames explicitly covering: Mapping A six raw-score bands (0–7:U1, 8–12:U2, 13–17:U3, 18–22:U4, 23–26:U5, 27–30:U6); Skip → U1; retake → new `AssessmentResult`; Jump ≥95%; Jump cooldown 24h; Jump ≠ completion; Controlled Retry allowance + 70% credit; SRS `[1,3,7,14,30]`; streak local timezone; streak reset-to-1; six-role authorization matrix; cross-user RLS isolation; Creator self-review denial; Moderator publish denial; Admin emergency publish constraints; GEC timeout/fallback; AI non-ownership of learner state.
- **Evidence:** Skeleton section with one frame per item above; each frame states preconditions, input shape, and expected-behavior shape.
- **Acceptance:** Every listed item has a frame; zero executed results claimed.
- **Firewall:** No test run, no fixtures executed, no results fabricated (see §9 anti-fabrication rules).

### 5.3. Output 3 — API dependency/register
- **Purpose:** Reconfirm every M2.3 surface classification for implementers.
- **Inputs / Source of Truth:** M2.3 Artifact #15/#12, byte-identical `03`.
- **Required contents:** Every surface re-listed with CURRENT, TARGET, FUTURE, or COMPATIBILITY GAP reconfirmed; no contract change. This register is about API surfaces ONLY and is explicitly distinct from the Implementation & Governance Dependency Register (§5.7).
- **Evidence:** Register table with one row per surface and a classification column.
- **Acceptance:** All M2.3 surfaces present with unchanged classifications.
- **Firewall:** No contract edit, no endpoint implementation.

### 5.4. Output 4 — Security responsibility + audit reconfirmation
- **Purpose:** Restate (not redesign) the M2.4 enforcement model for handoff readers.
- **Inputs / Source of Truth:** M2.4 Artifact #16, SEC-D1..D10, DD-03/DD-10 Tier 1+2.
- **Required contents:** Six-boundary × 15-operation matrix by reference (no new operations, no new boundaries); 11-event audit catalog with owners; service-role isolation restatement.
- **Evidence:** Reconfirmation section with pointers to M2.4 sources.
- **Acceptance:** Matrix/owners/isolation match M2.4 verbatim.
- **Firewall:** No new enforcement design, no RLS deployment.

### 5.5. Output 5 — Report mapping + artifact identifier/evidence index
- **Purpose:** Close the documentation loop for Phase 2 readers.
- **Inputs / Source of Truth:** Roadmap §11, M2.5 evidence index (read-only reference).
- **Required contents:** §11 rows reconfirmed; finalized artifact identifier index (#1–#20); pointer to the M2.5 validation evidence index (referenced, not duplicated).
- **Evidence:** Mapping table + index present with resolvable IDs.
- **Acceptance:** All §11 rows reconfirmed; zero new/renamed IDs.
- **Firewall:** No `01`/`05` edits.

### 5.6. Output 6 — DD-01..06 + DD-10 closure record
- **Purpose:** Record Tier 3 physical decisions on paper with full traceability.
- **Inputs / Source of Truth:** §4 per-decision verdicts, §§8/10.
- **Required contents:** One row per decision using the exact 10-column schema defined in §4 (Current Status; Tier 1 Locked Behavior; Tier 2 Design Specification; Tier 3 Physical Decision; Rationale; Dependencies; Migration Impact; Rollback Consideration; Affected Artifacts; Implementation Consequences).
- **Evidence:** Closure table with all 10 columns populated per decision.
- **Acceptance:** All 7 decisions have complete rows; Tier 3 entries are written decisions (not SQL, not executions).
- **Firewall:** No DDL/SQL authored or executed.

### 5.7. Deliverable 7 — Implementation & Governance Dependency Register (distinct from §5.3)
- **Purpose:** Make every technical and governance precondition for Phase 2 entry explicit and checkable, so D-G10 can be judged on unresolved blockers.
- **Inputs / Source of Truth:** Repository inventory and roadmap (derive the actual list; the examples below are illustrative, not copied blindly): (A) technical/implementation side — database migration tooling, Prisma/DB client generation, Supabase Auth/GoTrue, JWKS/JWT validation, Next.js BFF/Route Handler requirements, FastAPI GEC service, AI timeout/fallback plumbing, storage, RLS/security, test infrastructure, seed/demo-data, deployment/environment (marked TARGET/FUTURE as applicable); (B) governance/milestone side — approved design baseline, M2.6 D-G10 completion, plan approval gates, independent review, acceptance, implementation entry criteria, downstream Phase 2 milestones, unresolved blockers.
- **Required contents (mandatory 9-field schema, not a free-form list):** (1) Dependency ID; (2) Description; (3) Source; (4) Blocks; (5) Blocked by; (6) Current/Target/Future; (7) Required milestone; (8) Evidence; (9) Resolution status.
- **Status definitions:** `RESOLVED` = evidence present and verified against its Source (e.g., approved artifact/decision present; tool version documented as a requirement, not installed); `OPEN` = documented but awaiting a defined milestone/event; `BLOCKING` = an OPEN dependency whose absence prevents D-G10 PASS (any BLOCKING row fails D-G10). Sufficient evidence = a pointer to an accepted artifact, approved decision, or a Phase 2 entry criterion — never an executed result, screenshot, metric, or deployment proof (see §9).
- **Evidence:** Register table with all 9 columns populated per row; D-G10 verdict explicitly references unresolved BLOCKING rows.
- **Acceptance:** Both (A) and (B) sides covered; every row has all 9 fields; zero BLOCKING rows unresolved at acceptance.
- **Firewall:** The register is DESIGN/HANDOFF documentation only — it must NOT execute dependencies, install infrastructure, run migrations, deploy services, or create runtime code.

Files: `docs/phase-1-m2-6-design-handoff.md` (handoff sections); no new PlantUML by default. Acceptance: §14 — package implementation-readable, every DD Tier 3 decided on paper, D-G10 evidenced, zero execution.

## 6. Security Model Plan (reconfirm only)

No new security design and no enforcement deployment. Restate by reference: App Authorization + Database RLS dual presence per OP-01..15 (app never replaces RLS); service-role isolation (`N/A — privileged service-role path`, least-privilege, non-exposed, auditable); SoD negatives (`403 SOD_VIOLATION_SELF_REVIEW`, `403 SOD_VIOLATION_MODERATOR_PUBLISH`, no `IN_REVIEW→PUBLISHED`, Admin emergency on `APPROVED` only + reason + AuditLog); secret isolation (service-role key in Zone 5 only); AI stateless/proxied/JWT/8.0s/fallback; per-operation audit owners. Any restatement mismatch against M2.4 is a recorded finding — never a silent redesign.

## 7. Architecture Plan (reconfirm only)

No architecture change. Restate by reference: 5-layer acyclic hierarchy over 19 components; 5 logical security zones (incl. Zone 5 Privileged Ops) as zones, not provisioning; CURRENT_APPLIED vs TARGET_DESIGN vs FUTURE_EXTENSION labels; zero target-as-ready claims; single-owner rule/data ownership. Any drift is a recorded finding — never a silent edit to `01` or Artifacts #13–#15.

## 8. Current vs Target vs Future

M2.6 introduces zero new status values. The migration outline APPLIES the existing labels step by step (each migration step labeled with its source→target status transition and rollback target); target existence is never described as runtime readiness, and the outline explicitly states production deployment is out of Phase 1. Any conflation, missing label, or invented entity/column is a P1 finding.

## 9. Traceability Plan

Verify — do not extend semantics: the M2.5 evidence index is reused read-only; `01` §§3.1–3.8 and `05` §§1–10 stay fully read-only (M2.6 appends no traceability sections; the handoff package references the M2.5 index instead of duplicating it); `phase-1-system-design-plan.md` §11 mapping reconfirmed row-by-row (no chapter-ID change; any chapter change goes through its own documentation task). Consume existing IDs only (UC-01..15, BF-01..15, DD-*, P1-FR-*, ADR-*, OP-01..15, SEQ-01..10). Zero new IDs; zero renamed artifacts. Anti-fabrication rule: downstream links of the form `implementation task → test evidence → report evidence` are PLANNED/SKELETON POINTERS during M2.6 — do NOT fabricate test results, screenshots, performance numbers, or runtime evidence, and do NOT represent future implementation as completed. Only accepted downstream milestone evidence may later populate those links.

## 10. Open Decision Firewall and Explicitly Preserved Invariants

All Phase 1 invariants preserved verbatim (M2.6 resolves representation, never policy): 6 canonical roles; UC-01..UC-15 only; BF-01..BF-15 only; `LearningProgress != Proficiency != Mastery != LevelReadiness`; self-report UNVERIFIED; diagnostic → AssessmentResult → SkillProfile → verifiedProficiency → curriculumStartingPoint; AssessmentResult immutable with retake-as-new-result; D1–D9 locked; content lifecycle + SoD (Creator≠self-review, Moderator≠publish, Admin emergency on APPROVED only + reason + AuditLog); AI/GEC stateless with zero learner-state ownership; App AuthZ never replaces DB RLS; service-role isolation; CURRENT_APPLIED vs TARGET_DESIGN vs FUTURE_EXTENSION; D-G1..D-G9 evidence as recorded in M2.5 (reconfirmed, not re-litigated); D-G5/D-G6 NOT closed for production; target runtime NOT PRODUCTION READY / NOT DEPLOYED until a post-Phase-1 milestone explicitly validates readiness. M2.5’s threshold-agnostic/version-tolerant carry-forwards (mastery/readiness/remediation, adaptive/stopping, scoring/Anchor, recommendation, CEFR expansion, HSK, gap archival, Reading physicalization, diagnostic `~25–30 PROPOSED`, placement-history) are decided representationally here, never as product-policy changes.

## 11. Verification Plan

Design-level checks only (no execution): D-G10 evidence completeness (DoD checklist per §14, DD closure register with all 7 Tier 3 decisions resolved on paper, handoff index complete, §11 mapping reconfirmed, no-implementation proof via `git status`/`git diff` scope scan); D-G1..D-G9 regression (no drift since M2.5 evidence; six-field ×20 still complete); DD-closure audit (each Tier 3 closure cites Locked + Design-Spec basis, contains no invented IDs/entities, creates no Exam/QuestionBank); contract-drift check (`03` byte-identical); invariant regression scan (all §10 invariants + M2.2/M2.3/M2.4 locked values: Mapping A raw bands, Jump ≥95%/24h, Retry 10%/70%, SRS Policy B, streak date boundary, SoD, 8.0s GEC timeout, RLS/RPC ownership); `git diff --check` hygiene on touched files. PlantUML: none required (syntax-only if an outline diagram proves warranted).

### D-G10 — Implementation Handoff Readiness (formal six-field specification; handoff readiness ONLY, never runtime/production readiness)
1. **Input:** D-G1..D-G9 evidence (M2.5), DoD per roadmap §14, `phase-1-system-design-plan.md` §11 mapping, the §5 handoff package (outputs 1–6 plus §5.7 register).
2. **Validation Method:** Check each §14 exit item against its evidence section; confirm every Tier 3 closure cites Locked + Design-Spec basis; confirm no execution artifacts exist (scope scan).
3. **PASS Condition (all required):** 20 artifacts six-field contract accounted for; D-G1..D-G9 evidence available from M2.5; all M2.6 six outputs complete; Tier-3 DD physical decisions documented on paper; migration outline complete; rollback outline complete; test skeleton complete; API register complete; security/audit reconfirmation complete; report synchronization complete; Implementation & Governance Dependency Register complete; no unresolved BLOCKING dependency; no unresolved ambiguity that would force an implementer to invent architecture.
4. **FAIL Condition (any):** Any PASS item missing; any Tier 3 undecided or executed; any BLOCKING dependency unresolved; any silent redesign/invention; any implementation executed.
5. **Evidence:** DoD checklist, DD closure register, handoff index, §11 reconfirmation, no-implementation proof, dependency register with zero BLOCKING rows.
6. **Source of Truth:** Roadmap §§7 (M2.6), 10 (D-G10), 11, 12, 14; M2.5 Artifact #20 evidence index (read-only reference).

## 12. File Allowlist (implementation phase ONLY)

`docs/phase-1-m2-6-design-handoff.md` (new), `logs/` (append-only), `HANDOFF.md`, `plans/current-task.md` (only when implementation is human-approved). Nothing else. No `01` edits. No `05` edits (fully read-only; M2.5 index reused by reference). No new PlantUML by default (syntax-only if an outline diagram proves warranted).

## 13. File Denylist (must remain untouched)

Runtime (`lingora-web/`, `lingora-admin/` code, `lingora-ai/` code), Prisma `schema.prisma`, `migrations/` (no files authored, none executed), RLS/SQL execution, seed execution, `docs/03-api-contract.md` (byte-identical), M2.1–M2.5 accepted artifacts (read-only baselines; corrections go through their own review tasks, never silent M2.6 edits), canonical decisions/ADRs (no rewrites), any test execution beyond read-only scans, production deployment, historical records, unrelated pending work (D4/M2.1 files, reports, PPTX, scratch/tmp) — DO NOT CLEAN/RESET/COMMIT/REFORMAT/OVERWRITE (worktree discipline).

## 14. Acceptance Criteria, Verdict Definitions, and Required Review Evidence

Binary M2.6 exit: (a) handoff package complete with §12 items 1–6; (b) all 7 Tier 3 physical representations decided on paper with Locked/Design-Spec basis cited and zero execution; (c) D-G10 evidenced (DoD checklist, closure register, handoff index, §11 reconfirmation, no-implementation proof); (d) D-G1..D-G9 regression clean (no drift since M2.5); (e) report mapping + artifact index complete with zero new/renamed IDs; (f) zero implementation work performed. Verdicts: `PASS` = exit (a)–(f) hold with zero open P0/P1/P2 findings; `PASS WITH NON-BLOCKING ISSUES` = 0 P0, 0 P1, N P2 with recorded dispositions, accepted as Phase 2 input; `FAIL` = any P0/P1 open, any Tier 3 undecided or executed, any D-G10 gap, any silent redesign/invention, or any implementation executed. Independent-review evidence pack: handoff spec; D-G10 evidence (DoD checklist + closure register + handoff index); D-G1..D-G9 regression output; DD Tier 3 decision table; `03` hash/byte comparison; scope proof (`git status`, `git diff`); frozen-baseline reference list (M2.1–M2.5 commits/specs).

## 15. STOP Conditions and No-Scope-Creep Rule

STOP (record, invent nothing; return for human resolution) if: authoritative sources conflict; any Tier 3 needs invention beyond canonical evidence or requires execution to decide; current/target indistinguishable; untraceable requirement or new ID required; an accepted M2.1–M2.5 semantic must change to complete handoff; report-mapping chapter change requires doc edits beyond the §12 allowlist; production deployment or test execution is demanded inside M2.6. No-scope-creep rule: M2.6 writes decisions, outlines, skeletons, registers, and indexes only — any schema/migration write or execution, RLS deployment, API/UI code, test run, or production claim is out of scope even if it would make handoff “more complete.” None triggered at plan time.

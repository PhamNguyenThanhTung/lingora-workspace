# M2.4 PLAN — Architecture + Security Design (PLAN ONLY)

> Status: `DRAFT — REVIEW REQUIRED` (human approval required before any M2.4 implementation).
> Entry state: `M2.1 ACCEPTED FOR M2.2`, `M2.2 ACCEPTED FOR M2.3`, `M2.3 ACCEPTED FOR M2.4` (commit `379c259` + governance repair `d37fc78`), `M2.4 PLAN: NOT STARTED`.
> Boundary: PLAN ONLY. No runtime code, Prisma/schema, migrations, RLS, UI, secrets, infrastructure, or service-code changes. No PlantUML implementation artifacts beyond what this plan lists (and none created by this planning task itself).

## 1. Executive Summary

M2.4 addresses the architecture and security design gap between the accepted domain/behavior/service-boundary package and the remaining validation/handoff milestones: turning the accepted behavior (M2.2), interaction/service boundaries (M2.3), and logical data model (M2.1) into an **architecture/security design package** — component/deployment responsibility, trust boundaries, authN/authZ model, RLS enforcement responsibilities, role/SoD enforcement, audit design, and the DD-03/DD-10 decision boundaries. It closes **no product policy** and implements **nothing**; every physical enforcement step stays a labeled TARGET/FUTURE for M2.6 handoff and later implementation.

## 2. Current Baseline

Accepted, frozen, read-only inputs: M2.1 (domain/logic, Applied/Target/Future statuses, DD register, D-G1/D-G2 PASS), M2.2 (15 UCs, 15 BFs, state machines, D-G4/D-G7 PASS), M2.3 (SEQ-01..10, #12 boundary table, #15 service model, ownership matrix, D-G4/D-G5 PASS, D-G6 input-only). Architecture baseline: `01` M0.5 (§§379–428) + §§3.1–3.7; ADRs 002/003/005(+PA2)/006/008/010/014; SEC-D1..D10; `03` API contract (AI-service scope, read-only).

## 3. Exact Roadmap Scope

Per `phase-1-system-design-plan.md` §7: **Scope: Artifacts 13, 14, 16. Input: M2.3 outputs, architecture ADRs, role catalog, data/RLS model. Output: component/deployment responsibility specification + one six-boundary security responsibility matrix. Dependencies: API↔Security pair; current Web/Admin/Supabase/AI architecture. Validation: D-G5 + D-G6. Exit: app authorization + RLS both present; service-role isolation, Admin boundary, AI isolation, audit owner explicit; target runtime NOT claimed ready.** Canonical titles (no renames):
- **#13 Component Architecture** — component ownership of rules and data boundaries.
- **#14 Deployment/Runtime Boundary** — deployment locations, secret boundaries, current-vs-target runtime status.
- **#16 Security Responsibility Matrix** — app authorization, RLS, privileged operations, AI isolation, audit across Learner Web, Admin, Supabase RLS, privileged service role, AI server, audit.

## 4. DD-03 / DD-10 Handling

Three-tier verdict required per decision (no silent closure):
- **DD-03 (audit physical structure):** LOCKED BEHAVIOR = audit semantics (actor, action, target, timestamp; immutable/append-only). DESIGN SPECIFICATION (M2.4 closes) = event catalog per §6 tiers (REQUIRED vs CANDIDATE), actor-identity rules, category taxonomy, append-only expectation, TARGET-state audit fields justified by P1-FR-008/P1-NFR-001. OPEN PHYSICAL REPRESENTATION (stays open) = `metadata JSONB` exact shape, triggers vs app-emitted writes, IP/device fields (only if justified), retention values, exact schema — no new columns invented.
- **DD-10 (role enforcement split):** LOCKED = 6 target roles, RLS mandatory at DB, app never replaces RLS, AI stateless. DESIGN SPECIFICATION (M2.4 closes) = CURRENT (LEARNER/ADMIN) vs TARGET (6 roles) mapping, per-boundary enforcement split (app check vs RLS vs privileged service role), SoD matrix, least-privilege rules, negative paths, compatibility statement (current guarantees never weakened). OPEN (stays open) = physical migration sequencing details beyond design-level ordering; no RLS SQL written.
- If DD-03/DD-10 cannot be represented without inventing a decision → STOP per §15.

## 5. Artifact-by-Artifact Work Plan

### #13 Component Architecture
1. Title/purpose per §3. 2. Source traceability: M2.3 #15 services + SEQ-01..10 + `01` + ADRs. 3. Scope: ownership of rules/data boundaries per component; dependency direction (one-way, no cycles); AI boundary. 4. Logical-vs-physical: components are logical responsibilities, not deployables/code modules. 5. Inputs: M2.3 outputs, ADRs, role catalog. 6. Outputs: component responsibility spec (+ diagram). 7. Dependencies: API↔Security pair; M2.3 #15. 8. Actors/roles: all 6 + service-role actor (infrastructure, not 7th role). 9. Responsibilities: rule ownership per component. 10. Open decisions: none closed; DD-10 split recorded. 11. Gates: D-G5. 12. Files: `docs/phase-1-m2-4-architecture-security.md` (§13 section), `docs/plantuml/component-architecture-m24.puml`. 13. Verification: ownership-vs-M2.3-matrix consistency; ADR cross-ref. 14. Acceptance: every rule has exactly one owning component; no new entities/IDs.

### #14 Deployment/Runtime Boundary
Items 1–15 as above, with: runtime status per component/secret/store (CURRENT_APPLIED vs TARGET, never "ready" for target); secret boundaries (what lives where, conceptually — no values); deployment/security zones (Vercel/Supabase/AI-hosting as zones, not provisioning); physical-readiness constraints; gates D-G5 (+D-G6 where deployment touches secrets/audit). Files: master spec (§14), `deployment-boundary-m24.puml`. Acceptance: zero target-as-ready claims; every secret/store has a status label.

### #16 Security Responsibility Matrix
Items 1–15 as above, with: THE one six-boundary matrix (Learner Web, Admin, Supabase RLS, privileged service role, AI server, audit) covering every sensitive operation (auth, content CRUD per SoD, placement/jump writes, SRS/record_review, streak, tickets, cohort-extension, AI proxy, audit reads). Every sensitive operation must have an explicit enforcement boundary; possible boundaries include application authorization, database RLS where applicable, controlled privileged service-role execution where intentionally required, and external-provider/service isolation where applicable. RLS must never be treated as optional merely because an application check exists. Privileged service-role bypass of RLS, where required by architecture, must be explicitly identified, isolated from learner/browser paths, least-privilege, non-exposed to client, and auditable where appropriate. No new service-role capabilities are created; architecture ownership is unchanged; service-role bypass is never the default path. The matrix keeps two separate columns — Application Authorization | Database / RLS Boundary — allowing the value `N/A — privileged service-role path` where canonical architecture determines RLS is not the direct enforcement boundary for that operation. Service-role isolation + Admin boundary + AI isolation + audit owner explicit per row; negative paths (self-approve, moderator-publish, learner cross-read, AI primary-write, service-role leak) each mapped to enforcing boundaries. Gates: D-G6 (primary) + D-G5. Files: master spec (§16), `security-matrix-m24.puml` (or table-only if diagram adds nothing). Acceptance: zero operations with UI-only checks; zero missing audit owners; zero operations without an explicit enforcement owner.

## 6. Security Model Plan

- **AuthN:** GoTrue/JWT baseline (M1.5 ES256/HS256 as observed context, not redesigned); session boundary (httpOnly server-side); identity propagation (`auth.uid()` derivation at RPC/service); service/external boundary (AI proxied with user JWT; no direct browser→AI); no fabricated modes.
- **AuthZ:** RBAC per 6-role catalog + target permission mapping; SoD (creator≠approver≠publisher; emergency `APPROVED→PUBLISHED` + reason + AuditLog; no `IN_REVIEW→PUBLISHED`); learner-own-data boundary; Ops minimal-lookup + escalation (no content mutation, no learner-data support beyond approved minimum).
- **RLS:** model-only matrix (who may read/write/not-write per domain + owning state); cite applied RLS as CURRENT where proven (SEC-D5/D7/D9 evidence), TARGET where designed; never claim unproven enforcement.
- **SoD:** matrix + negative paths (above).
- **Audit:** tiered event catalog — REQUIRED / DESIGN-SPECIFIED (login/authentication, role/permission changes, content lifecycle transitions, emergency publish, security-sensitive administrative actions, per accepted requirements/architecture) vs CANDIDATE / PENDING VALIDATION (anything without firm canonical basis) vs OUT OF SCOPE. No decisions on retention periods, IP logging, device fingerprinting, exact admin-read auditing, or SRS exception auditing unless canonical sources lock them. DD-03 physical representation stays OPEN PHYSICAL REPRESENTATION.
- **Trust boundaries:** browser/client ↔ BFF/application ↔ domain services ↔ database ↔ external auth/storage ↔ AI/GEC (stateless, non-owner, proxied, timeout/fallback). Data-protection notes: least privilege, no secrets in client/logs, PII minimization in audit/ops reads.

## 7. Architecture Plan

Logical component map derived from M2.3 #15 (no new components without source); dependency direction one-way (presentation → BFF → domain → persistence/external); deployment zones (client, Vercel web/admin runtimes, Supabase project incl. Auth/Postgres/Storage, AI hosting) as ZONES with CURRENT/TARGET status; physical-readiness boundary section listing everything NOT yet deployed/enforced; DD-10 evolution ordering at design level (2-role current → 6-role target sequencing constraints, compatibility guarantee).

## 8. Current vs Target vs Future

Explicit matrix (entity/boundary/secret/policy × CURRENT_APPLIED / TARGET_SCHEMA / FUTURE_MIGRATION), e.g.: 2-role enum + applied RLS = CURRENT; 6-role model, expanded RLS, `audit_logs` table, privileged workflows = TARGET (designed, not deployed); cohorts/support-ticket stores, reminder push (6a/6b), advanced analytics = FUTURE/extension. Target runtime is never claimed ready (D-G5/D-G6 FAIL-condition guard).

## 9. Traceability Plan

Append Requirement → MVP → P1-FR → UC → BF → Domain → D3 → D4 → M2.2 → M2.3 → **M2.4** (`05` §10 new section; `01` cross-ref §3.8). Consume existing IDs only (UC-01..15, BF-01..15, DD-*, P1-FR-*, ADR-*). Security decisions traced: SEC-D1..D10 (as applicable, read-only), DD-03/DD-10, P1-NFR-001, UC-11/13/14.

## 10. Open Decision Firewall

Carry-forward register (all stay OPEN unless source places them in M2.4 — none of these do): DD-03 physical fields, DD-10 migration details, mastery/readiness/remediation thresholds, adaptive/stopping, scoring/Anchor, recommendation policy/version, CEFR expansion, HSK mapping/version, gap archival, Reading physicalization, diagnostic scale beyond `~25–30 PROPOSED`, placement-history strategy (DD-06 persists as designed-behavior + open-physical). Architecture must accommodate (e.g., threshold-agnostic evaluation points, version-tolerant config) never force-close.

## 11. Verification Plan

Deterministic checks: six-field contracts ×3; Current/Target/Future labeling scan (zero target-as-ready); SoD walkthrough (matrix rows × SEQ-08 paths); explicit-enforcement-ownership per matrix row (application and/or RLS/service-role as applicable; RLS never optional merely because an app check exists); secret-boundary completeness; audit-owner completeness; ghost-entity/ID scan; open-decision-freeze scan; contract-drift check (`03` byte-identical); D-G5/D-G6 evidence completeness (D-G6 closure evidence present WITHOUT claiming production readiness — design-evidence only); M2.2/M2.3 invariant regression scan (roles, UC/BF, D5–D9 values, self-report separation, immutability, single ownership, GEC non-ownership). PlantUML balance = syntax-only.

## 12. File Allowlist (implementation phase ONLY)

`docs/phase-1-m2-4-architecture-security.md` (new), `docs/plantuml/component-architecture-m24.puml`, `docs/plantuml/deployment-boundary-m24.puml`, `docs/plantuml/security-matrix-m24.puml` (new, if diagram warranted), `docs/01-architecture.md` (§3.8 cross-ref only), `docs/05-traceability-matrix.md` (§10 only), `logs/` (append), `HANDOFF.md`, `plans/current-task.md`. Nothing else.

## 13. File Denylist (must remain untouched)

Runtime (`lingora-web/`, `lingora-admin/` code, `lingora-ai/` code), Prisma schema/migrations, `docs/03-api-contract.md`, M2.1/M2.2/M2.3 accepted artifacts (read-only), canonical decisions/ADRs (no rewrites), historical records, unrelated pending work (D4/M2.1 files, reports, PPTX, scratch/tmp) — DO NOT CLEAN/RESET/COMMIT/REFORMAT/OVERWRITE (worktree discipline).

## 14. Acceptance Criteria (binary)

Six-field contracts hold ×3 with correct #13/#14/#16 identity; one six-boundary matrix complete: (a) every sensitive operation has an explicit enforcement boundary (application and/or RLS/service-role as applicable, with the two columns kept separate), audit owner, isolation boundaries; (b) zero target-as-ready claims; (c) DD-03/DD-10 three-tier verdicts recorded without silent closure; (d) traceability §10 complete, zero new IDs; (e) D-G5 + D-G6 design-evidence recorded (production readiness NOT claimed); (f) zero implementation work performed.

## 15. STOP Conditions

STOP (record, invent nothing) if: authoritative sources conflict; DD-03/DD-10 need invented decisions; physical security implementation becomes necessary; current/target indistinguishable; untraceable requirement; new ID required; open decision must freeze; accepted M2.2/M2.3 semantics must change. None triggered at plan time.

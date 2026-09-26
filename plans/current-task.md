# Milestone M2.4: Architecture & Security Design -- DONE (M2.4 ACCEPTED FOR M2.5)

## Status

`DONE -- M2.4 ACCEPTED FOR M2.5` (acceptance recorded 2026-09-26: Independent Review `PASS WITH NON-BLOCKING ISSUES`, final P2 cleanup verified closed, 17/17 + 18/18 + 17/17 PASS, `git diff --check` clean, `03` byte-identical, zero runtime/schema scope; `M2.5 = NEXT MILESTONE / PLAN NOT STARTED`; `COMMIT: NOT CREATED`.)

## Entry Condition

- `M2.3 ACCEPTED FOR M2.4` (ADR-025; commit `379c259` + governance repair `d37fc78`)
- `M2.4 PLAN APPROVED` (`plans/m2-4-architecture-security-plan.md`)
- D1–D4, M2.1, M2.2, M2.3 baselines FROZEN & ACCEPTED

## Objective & Deliverables

Implement the complete authoritative architecture and security design layer for Lingora according to the approved plan `plans/m2-4-architecture-security-plan.md`, covering:
1. **Master Specification:** `docs/phase-1-m2-4-architecture-security.md` encompassing Artifacts #13, #14, #16, each exposing the roadmap-exact 6-field architectural contract.
2. **Artifact #13 (Component Architecture):** 5-layer logical hierarchy (Presentation, BFF/Application Orchestrators, Domain Services, Persistence/Infrastructure, External Providers) across 19 logical components with strict top-down acyclic dependencies; authoritative ownership of rules and data boundaries; stateless AI integration boundary.
3. **Artifact #14 (Deployment / Runtime Boundary):** 5 logical security zones (Untrusted Public Client, Trusted App Server / Vercel, Managed Database & Storage / Supabase, Isolated AI Compute / FastAPI, Privileged Ops / CLI); secret isolation boundaries; explicit `CURRENT_APPLIED` vs `TARGET_DESIGN` vs `FUTURE_EXTENSION` classification; strict anti-drift rule that target runtime is NEVER claimed ready or deployed.
4. **Artifact #16 (Security Responsibility Matrix):** Authoritative single 6-boundary matrix across 15 sensitive operations (`OP-01`..`OP-15`) detailing Learner Web, Admin Web, Supabase RLS, Privileged Service Role, AI Server, and Audit Ledger; strict enforcement split between Application Authorization and Database RLS (app checks never replace RLS); Separation of Duties (SoD) negative denial paths (`403 SOD_VIOLATION_SELF_REVIEW`, `403 SOD_VIOLATION_MODERATOR_PUBLISH`); least-privilege privileged service role isolation.
5. **Decision DD-03 (Audit Architecture) Handling:** Mandatory 3-tier verdict: Locked Behavior (immutable, append-only, 4 core fields), Design Specification (closed in M2.4: 11-event catalog, actor/target typing, UTC ISO 8601), and Open Physical Representation (`metadata JSONB` shape, trigger vs app emission, IP/device fields, retention stay `OPEN`).
6. **Decision DD-10 (Role Enforcement Split) Handling:** Mandatory 3-tier verdict: Locked Behavior (6 canonical roles, DB-level RLS mandatory, app never replaces RLS), Design Specification (closed in M2.4: CURRENT 2-role vs TARGET 6-role mapping, app check vs RLS split, backward compatibility guarantee), and Open Physical Representation (migration DDL and SQL scripts stay `OPEN`).
7. **Traceability:** Section 10 update in `docs/05-traceability-matrix.md` linking requirements, MVP, P1-FR, UC, BF, Domain to M2.4 Component, Deployment Zone, and Security Matrix Operations.
8. **Architecture Cross-Reference:** Section 3.8 update in `docs/01-architecture.md`.
9. **Validation Gates:** Design evidence for D-G5 (Boundary & Contract Consistency) and D-G6 (Security & Auth Boundary Consistency); explicit rule that D-G5 and D-G6 are NOT claimed as closed.
10. **PlantUML Diagrams:** Authored under `docs/plantuml/`:
    - `component-architecture-m24.puml`
    - `deployment-boundary-m24.puml`
    - `security-matrix-m24.puml`
11. **Deterministic Verification Harness:** `scratch/verify_m24_design.py` validating all 16 invariant criteria.

## Category Tag

`category: runtime-boundary`

## Constraints & Scope Firewall

- Zero application runtime code (`lingora-web`, `lingora-admin`, `lingora-ai`).
- Zero database schema or migration changes (`schema.prisma`, `migrations/`).
- Zero RLS SQL or migration SQL written.
- Zero modifications to `docs/03-api-contract.md` (100% byte-identical, read-only).
- Zero changes to source artifacts of D1/D2/D3/D4, M2.1, M2.2, or M2.3.
- Target runtime is NEVER claimed ready or deployed.
- D-G5 and D-G6 are NOT claimed as closed.
- Exactly 6 canonical roles; `service_role` is a technical infrastructure boundary swimlane.
- All open decision groups preserved as `OPEN / CONFIGURABLE / PENDING VALIDATION`.
- `COMMIT: NOT CREATED`.

## Next Milestone State

```text
M2.5 = NEXT MILESTONE / PLAN NOT STARTED
```

M2.5 (Design Validation) requires a separate human-approved plan. No M2.5 work begins in this task.

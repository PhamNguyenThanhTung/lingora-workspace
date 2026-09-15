# Lingora Documentation

## Source-of-truth policy

`docs/` is the canonical and immediately authoritative documentation set for Lingora.

`ke-hoach-chi-tiet/` was the legacy planning directory. It has been removed after full migration verification (M0). The migration map below is retained as a historical traceability record only.

The final product name is **Lingora**. Approved repository boundaries are:

```text
lingora-web/    # Learner Web Platform (Next.js 15, SSR Auth, UI)
lingora-admin/  # Admin & Content Studio (Next.js 15, Prisma 6, Content Workflow)
lingora-ai/     # Supporting AI Capability Service (Python 3.11, FastAPI, GEC)
└── api/
```

## Canonical documents

| Document | Authority |
|---|---|
| [00-master-plan.md](00-master-plan.md) | Scope, priority, roadmap, workflow, risk and delivery baseline |
| [01-architecture.md](01-architecture.md) | System boundaries, responsibilities, stack, model roles and repository layout |
| [02-requirements.md](02-requirements.md) | Requirements, 19 MVP functions, 15 Use Cases, 6 roles, 6-state content workflow |
| [03-api-contract.md](03-api-contract.md) | AI API contract (health, model info, target GEC contract, compatibility) |
| [04-data-model.md](04-data-model.md) | Phase 0 Target Data Model, 6 roles, content lifecycle, RLS, RPC |
| [05-traceability-matrix.md](05-traceability-matrix.md) | Requirement-to-MVP-UC-data-API-UI-test traceability |
| [06-system-analysis.md](06-system-analysis.md) | System analysis, stakeholder catalog, boundaries, sequence flows |
| [07-data-dictionary.md](07-data-dictionary.md) | Data dictionary, attribute constraints, schema definitions |
| [phase-0-roles-and-mvp-final.md](phase-0-roles-and-mvp-final.md) | Phase 0 final roles (6 roles), permission matrix, 19 MVP functions |
| [phase-0-survey-requirements.md](phase-0-survey-requirements.md) | Survey requirements elicitation baseline |
| [QUICK-REF.md](QUICK-REF.md) | High-level quick reference snapshot for development |

Workflow authority lives in [AGENTS.md](../AGENTS.md), [plans/current-task.md](../plans/current-task.md), and `logs/`.

## Classification legend

- `ORIGINAL`: unique source content migrated to its canonical destination.
- `DUPLICATE`: source repeats content already migrated from another source; canonical text appears once.
- `MISSING`: source refers to information that is not present in the repository.
- `CONFLICT`: two sources disagree; no silent resolution is allowed.
- `UNCLEAR`: source explicitly leaves a decision unconfirmed or has ambiguous scope.

## Migration map

| Source | Destination | Action | Status |
|---|---|---|---|
| `plan` | `00-master-plan.md` | Preserve high-level product/stack/deployment overview; naming normalized to Lingora | DUPLICATE |
| `00-tong-quan-va-lo-trinh.md` §§0.1–0.5 | `00-master-plan.md` | Migrate assumptions, principles, P0/P1/P2, 12-week roadmap, cuts and deliverables | ORIGINAL |
| `01-kien-truc-he-thong.md` §§1.1–1.2, 1.5, 1.7–1.8 | `01-architecture.md` | Migrate topology, responsibilities, auth flow, repo layout and scalability; naming normalized | ORIGINAL |
| `01-kien-truc-he-thong.md` §1.6 | `03-api-contract.md` | Migrate requests, responses, errors, supporting endpoints and invariants | ORIGINAL |
| `01-kien-truc-he-thong.md` §§1.3–1.4 | `04-data-model.md` | Migrate schema excerpt, SQL/RLS/RPC, Scheduler boundary and exercise payloads | ORIGINAL |
| `02-phan-tach-yeu-cau-bao-cao.md` §§2.0–2.4 | `02-requirements.md` | Migrate three-report separation, scope, Must/Nice artifacts, outlines and matrix | ORIGINAL |
| `03-tech-stack.md` §§3.1–3.6 | `01-architecture.md` | Migrate approved stack, libraries, model strategy, datasets, estimates and fallbacks | ORIGINAL |
| `03-tech-stack.md` §3.7 | `01-architecture.md` | Retain week-1 initialization commands as future execution reference only | ORIGINAL |
| `04 phuong phap trien khai` §§4.1–4.5 | `00-master-plan.md`, `AGENTS.md`, `logs/test-log.md` | Migrate delivery method, Git/DoD/test baseline; workflow rules already represented once | DUPLICATE |
| `04 phuong phap trien khai` §4.6 | `00-master-plan.md`, `02-requirements.md` | Migrate model acceptance and latency protocol | ORIGINAL |
| `05 rui ro va trien khai` §§5.1–5.7 | `00-master-plan.md`, `03-api-contract.md`, `04-data-model.md` | Migrate risks, fallback/mock, deployment, secrets, demo and citations | ORIGINAL |
| `archive/06 quy trinh lam viec.md` §§6.3–6.6 | `AGENTS.md`, `plans/`, `logs/` | Workflow fully represented by current framework | DUPLICATE |
| `archive/06 quy trinh lam viec.md` §§6.1–6.2 | `00-master-plan.md`, `01-architecture.md`, this file | Product/repository/document split represented with approved Lingora names | DUPLICATE |
| `archive/06 quy trinh lam viec.md` §§6.7–6.8 | `AGENTS.md`, `DESIGN.md` | Preserved as historical guidance; design tokens limited to UI/UX | DUPLICATE |
| Legacy schema comment: omitted Course/Lesson/Vocabulary/Exercise/UserProgress definitions | `04-data-model.md` | Record unavailable referenced schema rather than inventing it | MISSING |
| `ChatMessage.naturalnessScore` vs API `grammatical_acceptability_score` | `04-data-model.md`, `03-api-contract.md` | Preserve both source definitions and flag discrepancy | CONFLICT |
| `/health` described as Render keep-alive vs prohibition on ping-based warming | `03-api-contract.md`, `00-master-plan.md` | Preserve endpoint and risk rule; intended operational use requires decision | CONFLICT |
| Legacy assumptions G1/G2 and reward/leaderboard detail | `00-master-plan.md`, `02-requirements.md` | Preserve as unconfirmed assumptions/open scope | UNCLEAR |
| Legacy `docs/model_registry.csv` location vs framework `logs/model-registry.csv` | `00-master-plan.md`, `logs/model-registry.csv` | Framework decision makes `logs/model-registry.csv` canonical; metrics unchanged | CONFLICT — RESOLVED BY APPROVAL |
| Legacy `app + ml/srs + ml/chatbot` vs `api + ml_srs + nlp_chatbot` | `01-architecture.md` | Use explicitly approved Lingora repository boundaries | CONFLICT — RESOLVED BY APPROVAL |

## Migration status

- Canonical documents `00` through `05`: M0 migration plus M0.5 approved normalization.
- Product/repository naming: normalized to Lingora where naming-only.
- Legacy workflow (`ke-hoach-chi-tiet/archive/06 quy trinh lam viec.md`): archived after coverage verification; the entire `ke-hoach-chi-tiet/` directory was subsequently removed (cleanup task, 2026-08-14).
- M0.5 resolves the approved core-model, ownership, locale, streak, health, response-metadata, grammar-score and REORDER decisions through normative override sections while preserving migrated findings as history.
- No feature implementation, dependency, migration, endpoint, UI, or model work was performed.

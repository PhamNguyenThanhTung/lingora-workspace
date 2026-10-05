# Lingora Design System & UI/UX Index

## Document Status & Scope

- **Document Role:** Primary entry-point and visual/interaction index for Lingora UI/UX.
- **Current Status:** `ACTIVE INDEX / CANONICAL DESIGN ENTRY-POINT`. Visual tokens and screen flows are anchored in the approved Phase 1 & Phase 2 baselines.
- **Architectural Baseline:** Web platform (`lingora-web` for Learner; `lingora-admin` for Content & Operations).
- **Controlling Plans & Specifications:**
  - Overall Execution: [`plans/master-implementation-and-report-plan.md`](plans/master-implementation-and-report-plan.md)
  - Screen-Flow Inventory: [`docs/phase-1-m2-2-behavior-uc-activity-state.md`](docs/phase-1-m2-2-behavior-uc-activity-state.md) §8 (Artifact #19) & [`docs/plantuml/screen-flow-inventory-m22.puml`](docs/plantuml/screen-flow-inventory-m22.puml)
  - Interaction Sequences: [`docs/phase-1-m2-3-sequence-api-service-boundary.md`](docs/phase-1-m2-3-sequence-api-service-boundary.md)
  - Curriculum & Content Blueprint: [`docs/phase-1-d4-content-curriculum-design.md`](docs/phase-1-d4-content-curriculum-design.md) & [`docs/08-english-a1-curriculum.md`](docs/08-english-a1-curriculum.md)

---

## Canonical Learner Navigation & Screen Flow Index

The learner experience is structured into 14 logical screen flows (`SCR-L-01` through `SCR-L-14`):

```text
[SCR-L-01: Auth & Welcome] ──> [SCR-L-02: Onboarding Goals] ──> [SCR-L-03: Entry Choice]
                                                                       │
           ┌───────────────────────────────────────────────────────────┴──────────────────────────┐
           ▼                                                                                      ▼
[SCR-L-04: Diagnostic Runner] ──> [SCR-L-05: Placement Summary]                                [Skip Pathway: U1]
           │                                                                                      │
           └──────────────────────────────────────────┬───────────────────────────────────────────┘
                                                      ▼
                                       [SCR-L-06: Curriculum Dashboard]
                                                      │
                                                      ▼
                                         [LESSON LEARNING FLOW]
                                                      │
                                                      ▼
                                       [SCR-L-07A: Lesson Content Viewer]
                                       (Vocabulary, Transcription, Vietnamese Meaning,
                                        Contextual Examples, Standard Audio, Grammar Summary)
                                                      │
                                                      ▼
                                       [SCR-L-07B: Exercise Execution Runner]
                                       (5 Unified Types: MCQ, Fill, Reorder, Listening, Grammar)
                                                      │
                                                      ▼
                                       [SCR-L-08: Controlled Retry Modal]
                                       (max(1, floor(N*0.10)), 70% Credit)
                                                      │
                                                      ▼
                                       [SCR-L-09: Lesson Completion Summary]
                                                      │
                    ┌─────────────────────────────────┴─────────────────────────────────┐
                    ▼                                                                   ▼
       [SCR-L-10: SRS Review Session]                                      [SCR-L-14: Profile & Streak View]
```

### Approved Learner Core Flow (Design Closure)
$$\text{Open Lesson} \longrightarrow \text{Lesson Content Viewer} \longrightarrow \text{Start Exercises} \longrightarrow \text{Exercise Sequence} \longrightarrow \text{Lesson Result / Progress}$$
- **Content Before Practice:** Learner reviews lesson vocabulary, translations, audio, and grammar patterns before engaging in assessment exercises.
- **Non-AI Content Delivery:** All learning assets in the Lesson Content Viewer are static curriculum data from database and Supabase Storage; no generative AI is used.
- **Invariants:** Lesson content viewing does NOT mark lesson completion; completion requires exercise execution and retry allowance processing per `UC-05` / `BF-10`.

---

## Canonical Authoring & Operations Screen Flow Index

Content governance is structured into 11 operational screen flows (`SCR-A-01` through `SCR-A-11`):

| Screen ID | Logical Screen Name | Canonical Role | Key Responsibility |
|---|---|---|---|
| `SCR-A-01` | Admin Authentication | All Staff Roles | Session sign-in, MFA/cookie session handling |
| `SCR-A-02` | Curriculum Planning & Assignment | Organizational Manager | Plan units, assign lessons to creators |
| `SCR-A-03` | Lesson Authoring & Editor | Lesson Creator | Draft vocabulary, grammar patterns, 5 exercise payloads |
| `SCR-A-04` | Moderation Review Queue | Moderator | Review submissions, evaluate English A1 pedagogical quality |
| `SCR-A-05` | Review Detail & Feedback Modal | Moderator | Approve (`APPROVED`) or request changes (`CHANGES_REQUESTED`) |
| `SCR-A-06` | Publication Management | Organizational Manager | Verify Unit 4/4 condition; publish approved lessons |
| `SCR-A-07` | Emergency Publish Modal | Administrator | Emergency publication of APPROVED content with mandatory justification |
| `SCR-A-08` | Revision & Clone Management | Creator / Manager | Clone published lesson to Draft v2 (`supersedes_id`) |
| `SCR-A-09` | User & Role Administration | Administrator | Manage accounts, assign canonical roles, column-level security |
| `SCR-A-10` | Audit Log Explorer | Administrator | Inspect immutable system audit trail (11 audit event types) |
| `SCR-A-11` | Operations Support Console | Operations Staff | Coordinate learner support tickets (UC-14 business flow) |

---

## Visual Design System & Foundation Tokens

The current runtime implements a functional light theme via Tailwind CSS 4 and shadcn/ui primitives (`lingora-web` and `lingora-admin`). Detailed brand token hardening follows milestone planning:

### Typography
- **Current Runtime Stack:** System sans-serif font stack with Vietnamese and English glyph coverage (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`).
- **Detailed Type Scale / Custom Font Licensing:** `PENDING / TO BE RESOLVED IN M3.1`

### Color System
- **Current Runtime Palette:** Tailwind neutral scale, semantic indicators (success: green-600, error: red-600, warning: amber-500, info: blue-600).
- **Custom Brand Identity Palette / Dark Mode:** `PENDING / TO BE RESOLVED IN M3.1`
- **Accessibility Invariant:** Minimum WCAG AA contrast ratio ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large text/controls).

### Spacing & Layout
- **Base Grid:** 4px base unit (`rem`-based scale).
- **Touch Targets:** Minimum 44px $\times$ 44px interactive hit area for learner controls.
- **Responsive Breakpoints:** Mobile (360px+), Tablet (768px+), Desktop (1024px+). Single-column auth and stacked exercise controls on mobile.

---

## [HISTORICAL / SUPERSEDED CONTEXT] Early Skeletons

> **Historical Context Note:** Early design drafts assumed a 2-actor model (`Student`/`Teacher`) and separate experimental AI chat surfaces. These are completely superseded by the 6-canonical-role architecture, deterministic exercise engine, and closed-loop learner cycle documented above.

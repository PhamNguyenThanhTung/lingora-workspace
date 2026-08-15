# Lingora — Agent Handoff Brief

> Updated whenever a task moves to `DONE` or `BLOCKED`. Keep only current state — not a history log.
> Read this after `docs/QUICK-REF.md` when starting a new session or resuming after a task gap.

---

## Current state

- Last completed task: `canonical-docs-full-scope-alignment` — DONE and archived to
  `plans/archive/2026-08-15-canonical-docs-full-scope-alignment-DONE.md`. `docs/00`, `docs/02`,
  `docs/04`, `docs/05` now match approved `ADR-006`; documentation only, no code. Evidence:
  `DOCS-ALIGN-T-001` … `DOCS-ALIGN-T-008`, all PASS.
- Last approved scope decision: `ADR-004 Amendment — Full Scope Restoration` = `ADR-006`, APPROVED
  2026-08-15. Scope approved and documented; **feature code not yet authorized**.
- Last commit: `46130d5` — docs: add quick project reference for agents *(all current workspace changes uncommitted)*
- Milestone: M1.3 DONE. Requirements now carry `P1-FR-012`…`P1-FR-015` (grammar · word-level
  listening · daily study goal · local reminder). Next: plan the first ADR-006 slice, then M2.
- Public staging snapshot: `staging/lingora-workspace-public/` — verified, no `.git`, but now holds
  pre-alignment copies of `docs/02`, `docs/04`, `docs/05`

---

## Pending decisions / open questions

- `ADR-006` scope is **approved and documented, not implemented**. Locked decisions: enum `GRAMMAR`,
  reminder option `3a` (`SharedPreferences`), listening option `4a` (word-level audio), payload shapes
  deliberately deferred to the implementation task. Remaining work: 8.5 days across weeks 5, 7, 9 —
  one combined enum migration, zero new tables, zero SEC-D amendments. See
  `plans/approved/2026-08-15-adr-004-amendment-full-scope-APPROVED.md` §14.
- M2 scope not yet planned (Android lesson flow — week 4 in roadmap per `docs/QUICK-REF.md §3`)
- `staging/lingora-workspace-public/` now contains a **pre-alignment** copy of `docs/02`, `docs/04`,
  `docs/05`; regenerate it under its own approved task before any public publication.
- `.codex/` and `.agents/` cleanup deferred; safe checkpoint is commit `d0e4276`

---

## Do NOT do next

- Do not implement the ADR-006 feature slices yet. Documentation alignment is done; **code is not
  authorized**. A new `plans/current-task.md` at `APPROVED` is required first. Still blocked:
  `lingora-admin/prisma/schema.prisma`, the `ALTER TYPE "ExerciseType" ADD VALUE` migration, the
  `androidx.work:work-runtime` dependency, and any file under `lingora-android/`, `lingora-ai/`, or
  `lingora-admin/src/`.
- Do not freeze the `GRAMMAR` or `LISTENING` payload shape in canonical docs — `ADR-006` §12.4
  deliberately leaves it to the implementation task and its acceptance tests.
- Do not restore `MATCHING` or `WRITING`, and do not implement sentence-level listening audio
  (option `4b`) — it was rejected and would require a SEC-D8 amendment.
- Do not start M2 implementation before a new `plans/current-task.md` plan is written and approved
- Do not touch `.gitignore`, `.codex/`, `.agents/` without a dedicated cleanup task approved first
- Do not amend or rebase commits `d0e4276` or `46130d5`

---

## Suggested next step

Write a new `plans/current-task.md` for the first ADR-006 feature slice and submit it for approval.
Recommended order from `ADR-006` §14.3: item 2 (`dailyGoalMin` UI — zero migration, proves the field
is no longer inert) first, then items 1 + 4a sharing **one** enum migration, then item 3a.

Two traps to carry into that plan:
- The enum migration must not seed data using the new value in the same transaction that adds it —
  PostgreSQL forbids it and Prisma wraps each migration in one transaction, so it must be split into
  two migrations or `prisma migrate deploy` fails.
- `P1-FR-015` must be described as reminding *within the chosen window*, never at an exact time.

Separately: a human still reviews the staging snapshot and UNCERTAIN items. Note that
`staging/lingora-workspace-public/` now holds a **pre-alignment** copy of `docs/02`, `docs/04`, and
`docs/05`; it must be regenerated under its own approved task before any public publication. Create
public Git history only under a new, separately approved task; do not commit or push from the private
workspace task implicitly.


---

## Context not in code

- Storage two-bucket split (`lingora-avatars` / `lingora-media`) was forced by live T-008 HTTP
  evidence: a 5,242,881-byte avatar returned HTTP 200 on the single-bucket implementation.
  See:
  - `logs/decision-log.md` → `ADR-005 Amendment — SEC-D8 PA2 two-bucket size enforcement`
  - `logs/decision-log.md` → `ADR-005 Implementation Addendum — SEC-D8 PA2 bucket boundary realization`
  - `plans/approved/2026-08-14-m1.3-t-008-two-bucket-size-enforcement-APPROVED.md`
- AI Server is stateless by design; it never reads/writes Supabase directly.
- `MOCK_MODE=true` is mandatory — every Android screen must work on mock before real AI is connected.

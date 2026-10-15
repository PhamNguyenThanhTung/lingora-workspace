# Current Task — Full CURRENT + TARGET Modeling Review

**Status:** IMPLEMENTING
**Approval:** The user's attached 2026-10-10 request explicitly authorizes this bounded documentation/modeling review and safe read-only database inspection. AGENTS.md permits direct authorization of documentation-only work. This does not approve product implementation or change ADR-030–035.
**Approved snapshot:** plans/approved/2026-10-10-full-current-target-modeling-review-APPROVED.md
**Request snapshot:** plans/approved/2026-10-10-full-current-target-modeling-review-REQUEST.txt
**Prior task:** P0-D07 remains DONE in its existing archive and immutable snapshot.

## Scope and permitted files/actions

- Inventory and hash existing diagram sources/outputs without editing or deleting them.
- Inspect application source, Prisma, ordered migrations, seed/security scripts and runtime/config evidence read-only; keep CODE, PRISMA, MIGRATION and LIVE DB views distinct.
- Inspect live DB only through safe read-only catalog/aggregate queries, without printing secrets; otherwise record LIVE DB UNVERIFIED and omit M25 deliberately.
- Create successor PlantUML sources and SVG/PNG outputs under docs/diagrams/current-target-2026-10-10/; reuse established PlantUML conventions. Add an index, evidence, gap review and reproducible rendering/validation helpers there.
- Update task/snapshot/archive pointers, HANDOFF.md, current snapshot/index links in docs/README.md and docs/QUICK-REF.md, required logs and modeling finding pointers in the existing decision backlog only if needed.
- Use independent read-only/source-modeling agents for evidence and model families; the primary agent integrates and reviews cross-diagram consistency.

## Out of scope

No application source, API, dependency manifest, Prisma, migration, seed, RLS/RPC or DB data changes; no AI restoration; no historical deletion/rewriting; no physical schema contract or product decision change. No implementation planning begins in this task. Preserve all pre-existing worktree changes.

## Dependencies and review

AGENTS.md and docs/README.md authority; ADR-030–035; current 14-entry UC catalog and requirements/traceability authority notes; accepted architecture/data-domain sources only where later ADRs do not supersede them; master-plan §19.1; actual repository artifacts. A true active-ADR contradiction stops dependent modeling and is routed to PO, never resolved by inference. CURRENT-to-TARGET differences are expected review findings, not authorization to correct implementation.

## Work and acceptance

- [ ] Inventory old sources, aliases, output provenance and classification.
- [ ] Record dated CURRENT evidence and safe live inspection outcome.
- [ ] Create M01–M38 coverage: system/container, UCs, activities, states, domain, separate migration/Prisma/live/logical ERDs, sequences, DFD and deployment. M25 exists only with verified catalog evidence; otherwise index records explicit omission.
- [ ] Keep three roles, assignment/content separation, immutable publication, distinct assessment purposes, aggregate assessment feedback, trusted Policy B and audit policy consistent; distinguish completion/performance/proficiency/readiness.
- [ ] Deliver PO review order, per-view purpose/authority/source/output/dependencies/limitations, gap classification, findings and readiness conclusion.
- [ ] Render every created/changed diagram and inspect visuals/manual semantics, not only syntax validation.
- [ ] Log exact verification output, archive DONE task and update handoff; stop at Modeling Review for PO.

## Verification

1. Render all M*.puml to SVG and PNG with recorded PlantUML version; fail on syntax/error images.
2. Validate index/source/output references, hashes, duplicate sources/outputs and complete coverage (M25 omission allowed only with explicit evidence).
3. Scan TARGET sources for old roles, AI runtime, emergency publishing and prohibited extra persisted concepts; verify CURRENT/TARGET labels.
4. Manual cross-diagram review against ADR-030–035 and current UC catalog, including actor permission/lifecycle/security/progress consistency.
5. git diff --check; inspect task diff, git diff --stat and new-file line counts; compare baseline hashes for every out-of-scope pre-existing file.
6. Runtime tests N/A: no product behavior changed. Record actual PASS/FAIL only for commands run.

## Git gate

Commit only task-owned changes after TEST and LOG. Shared files already dirty must retain prior user content; if an isolated task commit cannot safely include those deltas, report the preserved worktree and the uncompleted COMMIT gate explicitly. Never stage unrelated prior work, amend, reset, force-push or rewrite history.

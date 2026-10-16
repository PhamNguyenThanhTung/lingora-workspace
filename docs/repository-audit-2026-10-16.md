# Lingora — pre-design cleanup and repository audit

## A. Verdict

**READY TO CONTINUE CLASS DESIGN.** The design boundary is **Class Diagram IN PROGRESS**; continuing its review does not imply that class completion, native merge, physical design or implementation is approved or finished.

Entry: `D:/school/btl`, clean `main`, HEAD `bc40d0f0b10a0013ed19adef4cf3048710565229`; origin `PhamNguyenThanhTung/lingora-workspace`; fetch plus direct remote-ref check confirmed main equal, ahead/behind `0/0`. Inventory baseline: 1,155 tracked files. No reset/stash/history rewrite. Relevant ignored local directories were also inspected.

## B. Current source of truth

| Purpose | Source / authority |
|---|---|
| Scope/status/workflow | [Current task](../plans/current-task.md), [handoff](../HANDOFF.md), [AGENTS](../AGENTS.md); approval is task-scoped. |
| Product/domain decisions | [ADR log](../logs/decision-log.md), ADR-030–036/041/042 within scope; ADR-034 explicitly has Admin/Teacher/Learner. |
| Behavioral specification | [14-entry UC catalog](use-case-specifications.md), [requirements](02-requirements.md) current addenda, [Study Focus](study-focus-addendum.md). Reminder deferred; no standalone MVP Reassessment. |
| UC / Activity | [Modeling sources/index](modeling/current-target/README.md): UC-01–04, eight active ACTs; [report views](modeling/report-usecases/README.md): nine VIEW-RUC views, eight groups. |
| Class work in progress | [DOM PUML](modeling/current-target/src/DOM-01-core-domain-model.puml), matching canonical PNG/SVG, [class candidate](modeling/current-target/evidence/2026-10-12-class-design-completion/candidate.drawio), [unfinished completion report](modeling/current-target/class-design-completion-2026-10-12.md). These are review inputs, not accepted completion evidence. |
| Saved native presentation | [Primary 44-page Draw.io](modeling/current-target/lingora-all-diagrams.drawio); current DOM is older than the candidate. Source/editable/export identities must remain explicit. |

Current DOM PUML/render/candidate has **22 classes + 1 enum, 28 relationships**, names `Unit` and `AssessmentBlueprintVersion`. Primary native DOM has the earlier **22 + 1, 24 relationships**, names `LogicalUnit` and `AssessmentVersion`. Candidate differs only on DOM. Its report ends with an unfinished A–K section; no final primary merge/visual closeout exists. The dated completeness review describes its earlier inventory, not today's parity.

Activity v1 was completed. The later [Activity v2 evidence](modeling/current-target/evidence/2026-10-12-ad-layout-v2/) preserves entry/candidate/exports; entry matches the primary, candidate differs on eight ACT pages. Candidate PASS does not establish an accepted save. Both interrupted tasks are superseded as active work by this cleanup, preserved for later review, never relabeled DONE.

Read-only parity audit: all 72 canonical and 18 report output bytes match their manifests; all nine report source hashes match. Seventeen canonical raw source hashes differ: seven are LF/CRLF differences, ten remain provenance mismatches. Decoding PNG source metadata shows no observed visible semantic drift: renderer dash conversion and two UC-02 comment lines explain visible-source comparisons. Primary embedded source agrees visibly on 43 pages; DOM is the sole visible mismatch. This is **not** a passing full canonical verifier or a fresh visual review; manifests were not rewritten to hide provenance issues.

## C. DELETE — verified obsolete artifacts

| Path | Evidence and reason |
|---|---|
| `scratch/fix_dev_log.py` | Cuts the log at an old M2.3 marker and rewrites it, discarding later append-only history. No active caller. |
| `scratch/generate_clean_modeling.py` | One-time embedded 36-diagram snapshot overwrites current PUML with older semantics; independent canonical source/render pipeline exists. No active caller. |
| `scratch/render_puml.py` | Obsolete default points to removed `docs/plantuml`; public-server renderer superseded by canonical local rendering. No active caller. |
| `.codex/skills/{code-review-and-quality,debugging-and-error-recovery,impeccable,security-and-hardening,source-driven-development}` | Five untracked dangling Windows junctions to missing `D:/btl/.agents/skills/…`; obsolete skill removal already recorded in ADR-012. Unlink junction entries only, never recurse into their targets. |

Before deletion: exact-name Git/text reference searches found only historical hashes/captures, no current imports, package commands, script/test/automation consumers. Historical baseline references and generated outputs are preserved. These executables are obsolete tooling, not approval/test evidence. Git retains their source (`36bbfc6` / `bc40d0f`). No diagram, database, package or business data deletion.

## D. UPDATE

- Existing current-task/HANDOFF: replace contradictory DONE/TESTING/IMPLEMENTING pointers with this single task and an explicit paused class/Activity split. Preserve the former pointer byte-for-byte in a new superseded capture.
- Root README, QUICK-REF, docs/modeling/physical indexes, old roadmap notice: make Class Diagram the next design stage; distinguish historical readiness from current acceptance. Remove duplicate workflow prose in README and obsolete Quick Ref roadmap tables.
- ENVIRONMENT and learner README: remove absent-proxy/mock-connectivity claims; identify real auth/i18n foundation and missing Admin commands.
- AGENTS: clarify Codex planner/reviewer, Antigravity/Gemini implementation workers; safe independent parallelism; coordinator owns shared state; verify worker evidence; one correction round across task/final review, then STOP unresolved dependent work. Canonical rules override generic five-round/model-routing defaults.
- Plugin metadata: skills path resolves to existing `./.agents/skills/`; omit two nonexistent optional icon paths. Keep upstream skill mirrors unchanged.
- Required approval/archive and append-only test/development evidence; no new tracker or skill.

## E. KEEP despite suspicion / REVIEW

| Area | Classification, incoming references and rationale |
|---|---|
| Prisma, three migrations, seed and DB harnesses | KEEP as legacy repository evidence, REVIEW before reuse. Six Prisma roles/assignedRoles versus SQL LEARNER/ADMIN; neither is the approved three-role design. Migration history and auth dependencies prohibit casual deletion or a silent schema fix. |
| Physical package / later sequence/data/security/deployment views | KEEP as downstream proposals/history, REVIEW after class completion. Referenced by approvals, reviews and ADRs; not current physical authority. No advancement of their old READY status. |
| Old roadmap, approvals/archive, logs, domain/requirements/traceability history | KEEP stable references and audit evidence. Header/pointer supersession is sufficient; old Jump/fixed English/role statements do not become current rules. |
| `.agents/skills` and `.codex/skills` | KEEP for current discovery/portability. All 51 mirrored tracked files match. Replace duplicate storage only when discovery/packaging can be verified; avoid Windows-only link conversion. Reference checklists and PPTX tooling are reusable support, not competing workflow frameworks. |
| `scripts/` native builders/layout and tests | KEEP: connected imports/tests and historical parity scopes. Full builders overwrite aggregate output; manual controlled use only, no audit-time rebuild. |
| Other `scratch/` and ignored `tools/` | REVIEW individually: historical verifiers, report/deck source generators and dependencies exist; not uniformly junk. No blanket purge or report-file edits. |
| Class/Activity candidates, backups and SVG-backed comparison | KEEP recoverable work and referenced historical comparisons. Not disposable duplicate diagrams. |
| Ignored `tmp/`, `lingora-ai/`, root bundle | REVIEW: tmp includes source notes/scripts/manifests; AI directory is cache-only, not runtime. Root bundle is recoverable backup. Deleting broad trees has no design benefit. |
| Ignored `staging/lingora-workspace-public/` | KEEP separate Git repository with its own modified/deleted artifacts. Older mock AI source there is not current workspace implementation. Never treat it as a disposable generated duplicate or publish it automatically. |
| Local `.claude/settings.local.json` / user-global settings | REVIEW only; ignored local Bash grants and global old trust entries are not repository approval. No user/global configuration writes or credential output. |

## F. Needs user decision

No unresolved product decision blocks this cleanup or the next class review. Starting that review still requires a separately recorded task authorization. Class candidate semantics and any save/acceptance belong to that next task; physical schema, migration/data retention and implementation approvals remain later gates. The audit does not choose them.

## G. Vibe-coding / harness audit

One canonical workflow remains in AGENTS, with Superpowers methods. Mirrored skill discovery is real duplication but currently portable and byte-identical. Generic SDD permits five corrections and model escalation; canonical project policy now caps one correction dispatch plus re-review, forbids blind PASS acceptance and controls shared logs/pointers. Runtime schemas override generic tool examples. No fixed worker count or new agent abstraction introduced.

User-global configuration was inspected only for relevant keys: multi-agent enabled, depth two; orchestration/review/Ponytail plugins enabled. Existing old trust-state entries and aggressive Antigravity execution settings do not grant project approval. AGY binaries exist but `agy`/`gemini` do not resolve in this shell PATH; actual worker execution/plugin installation was not smoke-tested. No repository `.agent/`, `.github/`, Codex hook/config was found. Global files unchanged.

## H. Repository structure findings

Current source/export/manifests are discoverable in existing modeling folders; historical and candidate evidence has value even when large. Fixing entry indexes is more useful than moving these paths and breaking evidence. No new legacy tree or large refactor.

Actionable future boundaries: root Admin startup/build aliases are unusable until an Admin app exists; old DB test scripts mutate services and must not be run as lightweight checks. Seed exercise JSON and historical migration grants, plus caller-supplied SRS correctness/interval, require review before future implementation; no live exposure was established. Canonical raw-hash provenance needs reconciliation before claiming full verifier success. These do not block model review.

## I. Actual project status

| Category | Observed status |
|---|---|
| Design completed baseline | Scoped approved product rules, UC catalog/views and Activity behavior; saved native presentation exists. Activity v2 polish remains interrupted. |
| Design in progress | Class Diagram source/candidate versus native merge, semantic review and final evidence. |
| Implementation actually present | Learner auth/register/logout, SSR session middleware, vi/en UI, basic components and auth/i18n tests. |
| Legacy implementation | Prisma/migrations/seed/security harnesses with older roles, content/progress/SRS assumptions. No automatic redesign compatibility. |
| Scaffold | Authenticated home and Prisma-only Admin workspace; root Admin aliases do not provide an application. |
| Not implemented | Main learning contexts/course/lesson/Placement/progression/SRS, Teacher/Admin application, AI runtime. No verified live DB/deploy. |

## J. Next step and verification

**Tiếp tục review và hoàn thiện Class Diagram dựa trên source of truth vừa xác minh.** Review the existing candidate first, reconcile it against UC/Activity/ADRs, then handle only the explicitly approved DOM merge. Do not overwrite the Activity candidate or regenerate the bundle. This cleanup does not start that work.

Deterministic checks passed: exact three-file deletion allowlist, 1,138 protected tracked hashes, unchanged log prefixes, exact old-pointer capture, 51 matching mirrored skill files, existing plugin targets and no broken changed-document links. The read-only design checker independently confirms the source/native/candidate boundaries above; final diff whitespace check exits 0. An independent reviewer found no blocking issue. Observed output is recorded in [test log](../logs/test-log.md); completion/change/commit evidence in [development log](../logs/development-log.md). Runtime/E2E, live DB, production security, worker launch and fresh visual rendering are outside this cleanup's verification scope.

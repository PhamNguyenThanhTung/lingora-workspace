# Physical Design Review and Verification Evidence

> **PROPOSED PHYSICAL DESIGN — NOT IMPLEMENTED** · 2026-10-11
> This is documentation/diagram verification, not a runtime, migration, security-deployment or restore-test result. LIVE DB UNVERIFIED.
> **Historical task evidence:** this records the earlier first-pass physical review and its then-current verdict. The subsequent F01–F12 findings and their corrections are tracked in the separate [physical correction pass](correction-pass.md); consult that report for current status.

Scope: historical authorized plan, exact PO request, and pre-change baseline (historical approved package 2026-10-11, archived/mapped in cleanup report). Design: [catalog/runtime](README.md), [security/RLS](security-and-rls.md), [rebuild/tests](rebuild-plan.md).

## Independent review

Codex performed the documentation first pass; no Antigravity invocation capability was available in this session. A separately dispatched read-only reviewer, `/root/physical_design_review`, reviewed only the new proposed physical documents/ERD, against the user request and controlling logical authority. It did not mutate repository files or database. Review covered normalization, integrity, retained history, query patterns, security/RLS, idempotency/transactions and overengineering. It is independent agent review, not PO approval.

| Finding | Initial verdict | Correction and acceptance scenario |
|---|---|---|
| R1 — FORCE RLS helper-owner bypass assumption | P1 | Removed owner-bypass claim; explicit non-login/NOBYPASSRLS principals with column grants/nonrecursive principal policies, narrow EXECUTE and no runtime SET ROLE; PD-RLS-HELPER |
| R2 — absent fingerprint collision race | P1 | Shared canonical-fingerprint PostgreSQL transaction advisory lock on create/edit/attach/submit/publish/exposure, sorted old/new keys and collision recheck; PD-ASSESS-05 |
| R3 — package assignment target mismatch | P1 | Assignment composite uniques plus revision/version composite target FKs; PD-CONTENT-OWN |
| R4 — attempt context/content scope mismatch | P1 | Explicit start/finalize guard matching course/language/framework for lesson and assessment; PD-CTX-SCOPE |
| R5 — item authoring ownership versus immutable reuse | P2 | XOR immutable authoring owner FKs separate from frozen consumer memberships; copy/edit new item revision; parent guards; PD-CONTENT-OWN |
| R6 — finalizer/provisioner privilege responsibilities incomplete on recheck | P1 | Named learner writer and key authoring writer, exact INSERT/column UPDATE/read/policy responsibilities, protected completed facts; provisioner exact Auth correlation/reservation/activation grants and executor boundary; PD-RLS-HELPER/PD-AUTH-04 |

First review: NEEDS PHYSICAL CORRECTION, five findings. First recheck closed R2–R5 and account-helper aspect of R1; identified remaining R6. The first reviewer closed R2–R5 and the account-helper defect. Its last R6 recheck could not run due to an agent usage-limit error. A second independent read-only reviewer, `/root/independent_review`, checked the remaining exact privilege responsibilities, requested explicit context INSERT, parent-version/row-lock permissions and course/assignment lock coverage, then verified the scoped-lock helper correction. Its final finding: **R6 closed; no material defect remains in the narrow recheck; ready for final physical design review**. This completes independent coverage of all recorded defects; it is not a second full audit or PO approval. Reviewer found no product contradiction in successfully recorded evidence retention/current-gate finalization, and no material overengineering concern. Technical choices remain proposed.

## Request coverage

| Request sections | Artifact coverage |
|---|---|
| 1–5 | Authority/technology/design-only scope; repository/live audit and metadata protocol |
| 6–7, 50 | Identity/account profile/three roles/PENDING activation/disabled-next-request/provider recovery |
| 8–12, 58, 61–62 | Naming/UUIDs/34-table typed catalog, Unit options, logical mapping and separate four-view physical ERD |
| 13–19, 27–31 | Lesson revisions/publication, assignment/provenance, bounded content blocks, prompt/secret and immutable assessment package/items |
| 20–26 | First/retry events, N/K performance, authoritative completion, derived progress/context/starting point |
| 32–36 | Account-wide Vocabulary identity/SRS Policy B/idempotency/reinforcement/global qualifying-date streak |
| 37–44 | Private media/audit/resource matrix/delete/FK/invariant/index/concurrency design |
| 45–49, 51 | Idempotency/transaction/client-server/command-query boundaries; Prisma/raw SQL and actual-role RLS checks |
| 52–57, 67 | Rebuild option comparison/preservation/future execution/history/seed/test plan and per-file disposition |
| 59–60, 63–66 | Approved modeling unchanged; small cohesive artifact set; security/invariant matrices; physical decisions; no new infrastructure |
| 68–69 | Deterministic documentation checks/render/manual images and independent defect/recheck loop |
| 70–71 | A–W report in catalog/companions; review-only final verdict/STOP; next FINAL PHYSICAL DESIGN REVIEW |

## Read-only inspection evidence

Repository schema/migration/auth/storage/seed/security-test files were read; no old mutation scripts were run. Inspection confirmed 18 Prisma models versus 17 initial SQL tables, six old Prisma roles versus two initial SQL roles, absent TARGET contexts/revisions/assessment attempts and caller-controlled legacy SRS interval RPC. Package versions are manifest observations; runtime/deployment is not claimed.

Credential-availability probe used Node `fs.existsSync/readFileSync` for root/Admin/Web `.env` and `.env.local`, and process env. It printed **only booleans/file names**, not values. Observed exit0: `local_config_files: []`; DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY all false. Result: **LIVE DB UNVERIFIED**. No connection attempted because no valid credentials/tool connection was available. No live catalog/content or provider mutation.

## Render and visual review

Commands from repository root (PowerShell):

```powershell
java '-Djava.awt.headless=true' -jar C:/Users/PC/scoop/apps/plantuml/current/plantuml.jar -charset UTF-8 -checkonly docs/design/physical/physical-erd.puml
java '-Djava.awt.headless=true' -jar C:/Users/PC/scoop/apps/plantuml/current/plantuml.jar -charset UTF-8 -tsvg docs/design/physical/physical-erd.puml
java '-Djava.awt.headless=true' -jar C:/Users/PC/scoop/apps/plantuml/current/plantuml.jar -charset UTF-8 -tpng docs/design/physical/physical-erd.puml
```

Observed exits: 0/0/0, no syntax diagnostics. One source creates four named SVGs and four PNGs. All final PNGs individually inspected via view_image: identity, content, learning, assessment. First identity render had connector text overlap; redundant active-pointer edge/connector text removed (pointer retained in column/catalog), and disconnected reference boxes removed. Final diagrams have readable PK/FK/unique/nullable markers, consistent monochrome styling and explicit PROPOSED caption; no clipped text. Long item-owner fields remain visible. Auxiliary actor/scope relationships are explicitly documented in the catalog rather than drawing every FK through a dense combined diagram. All 34 actual tables appear across the views; references are not extra entities.

[Render/manual manifest](verification-manifest.json) binds source and eight outputs to SHA256, PNG dimensions and individual manual acceptance. Output hashes are not a runtime correctness claim.

## Deterministic verification command

```powershell
$env:PYTHONUTF8='1'
py -3.13 docs/design/physical/verify.py > docs/design/physical/verification-output.txt
git diff --check
git diff --stat
git diff --numstat -- plans/current-task.md docs/README.md docs/QUICK-REF.md HANDOFF.md plans/approved/README.md plans/archive/README.md logs/test-log.md logs/development-log.md logs/decision-log.md
```

The local verifier connects to no database. It checks catalog/detail/ERD set equality, edge endpoints, internal links, supported role/status/purpose/exercise allowlists, absence of old roles/active Reassessment/AI tables in proposed inventory, configured gates/framework levels, N/K/SRS/progress/secrecy assertions, render/manual hashes, unchanged canonical modeling/HEAD/index, task-only changes/new files and preserved log prefixes. Searches distinguish explicit prohibition/historical evidence/examples from active enums/invariants; e.g. test ratios and historical A1 are not platform defaults. The proposed schema is prose/ERD, so executable SQL FK/security correctness is reserved for future acceptance tests.

Evidence outputs: [verification output](verification-output.txt), [Git checks/stat](git-checks.txt). New-file line counts are included in verifier output. Global diffstat includes earlier unrelated work and is not attributed to this task; scoped changed-path baseline is the attribution check. No application tests, DB RLS tests, seeds or migration were executed.

## Completion result

**Final verdict: PHYSICAL DESIGN READY FOR REVIEW.** Independent first-pass defects and the privilege recheck are closed. Deterministic verifier observed exit0 with catalog/detail/ERD equality for 34 tables, 54 local links, all semantic/scope/render assertions and unchanged preexisting canonical modeling/HEAD/index. Physical PNG sizes: identity 1192×655; content 869×760; learning 894×1319; assessment 1361×499. Four final PNGs individually accepted; all eight output hashes match source-bound manifest. Future acceptance plan contains 44 NOT-EXECUTED scenarios.

Initial local verifier exit1 was an evidence/scope setup issue: verification-output/git-checks links had not yet been written, and separate concurrent work had created drawio files after the baseline. Evidence outputs were then created and six unrelated paths were explicitly observed/hash-captured without editing them. The [unrelated workspace observation](unrelated-workspace-observations.json) keeps them separate from task attribution; no blanket allowlist widening. Final scope checks preserve all 139 preexisting canonical modeling files and the original cached index. This task adds no modeling edit even though another activity added a drawio artifact there.

Fresh `git diff --check` is exit0 (LF/CRLF notices only). Diffstat is attached and includes prior dirty work; line counts for new textual files are recorded. Test/development entries T-PD-001 / PD-001 record observed checks; ADR-037 records proposals without accepting them. Runtime, live DB catalog, actual grants/RLS/security and rebuild restore remain unverified; no database/application implementation tests were run. No app/Prisma/migration/dependency change, no upload/seed/deploy/stage/commit. Final design approval belongs to the next task, **FINAL PHYSICAL DESIGN REVIEW**; no implementation follows automatically.

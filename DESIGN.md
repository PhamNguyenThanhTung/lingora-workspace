# Lingora — UI/UX index

## Status and controlling sources

**CURRENT SUPPORTING REFERENCE — reconciled 2026-10-20 (FDR-01).** This index maps approved behavior to logical screens; it does not approve new product rules or claim implemented screens. Current authorities: [documentation map](docs/README.md), [UC catalog](docs/use-case-specifications.md), [requirements addenda](docs/02-requirements.md), [Class baseline](docs/modeling/current-target/class-review-2026-10-16.md), [modeling index](docs/modeling/current-target/README.md), ADR-030–036/041–044 in the [decision log](logs/decision-log.md). Task status: [current task](plans/current-task.md).

Learner UI belongs to `lingora-web`; Teacher/Admin UI belongs to `lingora-admin`. In the current checkout, no web/admin UI framework or learner auth application exists; all learning and staff screens below are TARGET, not implemented UI. Historical M2.2/M2.3 screens/UC labels are crosswalk inputs, not current behavior authority. Current UC identities are never inferred from screen numbers.

## Roles and entry

Exactly one business role per account: **Learner, Teacher, Admin**. Learners self-register. Teachers author/submit only currently assigned Lesson packages. Admin assigns/reassigns, reviews/approves/publishes, manages permitted accounts and reads audit; Admin does not author lesson/item content or change learner evidence. Current role/status is checked server-side; disabled accounts are denied from the next request (ADR-034/035).

Learner entry: authenticate → create/select owned language context → Placement, self-report or default entry → curriculum. Placement recommends a starting level, not verified proficiency; self-report creates no AssessmentResult. Default selects the lowest available level, never a forced U1/A1 label. No available content produces coming-soon, not fabricated progress. One context per learner/language, at most two ACTIVE; PAUSED/resume retains history and account-wide SRS. Context purpose/preferences and Study Focus are distinct. Study Focus defaults BALANCED and may change to VOCABULARY/GRAMMAR/READING/LISTENING; it affects the next supplementary session only (ADR-031/032/042).

## Active learner screen/flow inventory

Existing screen IDs below retain their broad identity. These are logical flows, not a prescribed modal/page count; 07A/07B are the established lesson subviews. No replacement meaning is assigned to unused historical IDs.

| Screen ID | TARGET flow / actor | Current trace | Entry → exit / successful behavior |
|---|---|---|---|
| SCR-L-01 | Auth/welcome/profile access — Learner | UC-01; ADR-034/035 | Public learner signup/login/recovery → authenticated owned account; no public Teacher/Admin signup |
| SCR-L-02 | Context goals/preferences — Learner | UC-04 supporting context; ADR-031/042 | Select learned language/context → view/create/resume/pause, purpose/preferences and focus; preserve history |
| SCR-L-03 | Entry choice — Learner | UC-02/04; ADR-032 | Owned context → Placement / self-report / default available starting point |
| SCR-L-04 | Placement runner — Learner | UC-02; ADR-032/035/036 | Start published immutable version → valid server-graded submission; no per-item correctness; interruption creates no completed result |
| SCR-L-05 | Placement summary — Learner | UC-02; ADR-032/035 | Completed result → aggregate/recommended starting level, labelled provisional; no certification claim |
| SCR-L-06 | Curriculum dashboard / Level-up entry — Learner | UC-04/05/08; ADR-033/036 | Context → ordered path, eligible required-lesson progress and configured readiness; Level-up requires curriculum gate plus passed assessment, pinned version and aggregate feedback |
| SCR-L-07A | Lesson content viewer — Learner | UC-06; ADR-036 | Accessible published revision → vocabulary/text/static media/grammar content → start exercises; viewing alone never completes lesson |
| SCR-L-07B | Core exercise runner — Learner | UC-06; ADR-036 | Pin revision and N configured core exercises → first responses and queued retries; MCQ/FILL_BLANK/REORDER/LISTENING/GRAMMAR with server grading |
| SCR-L-08 | Required retry interaction — Learner | UC-06; ADR-036 | Each first-wrong item → exactly one retry after first-response queue; no percentage quota or 70% credit |
| SCR-L-09 | Completed lesson summary / optional practice — Learner | UC-06/08; ADR-036/041/042 | Successful complete attempt → latest completed performance, preserved first completion; optional supplementary block outside core score |
| SCR-L-10 | System-selected SRS interaction — Learner | UC-07; ADR-036/041/042 | Ordinary supplementary block or learner-started optional dedicated review → one selected prompt at a time, no due-list/card preview/stage/due date |
| SCR-L-14 | Profile/progress/streak — Learner | UC-01/08; ADR-031/033/036 | Own account → account-global profile/streak and context-owned learning summary; no editable learning evidence |

Core flow: view content → N first responses → K exactly-once retries → successfully record completed attempt → summary. First-correct contribution 1; correct retry 0.5; wrong retry 0. Performance = sum of contributions / (N+K). N=3, first correct/wrong/wrong and retry correct/wrong gives 1.5/5 = **30%**; completion still succeeds. An unfinished/failed-record attempt has no completed score/completion. Redo creates another attempt, not another completed-lesson count (ADR-036).

Completion enrolls core Vocabulary of the exact completed revision. Optional vocabulary requires Add to Review. Existing Learner+Vocabulary card keeps stage/due. Policy B remains 1→3→7→14→30 days then every 30 days; forgotten resets to stage1/+1 day with at most one same-session reinforcement and no second schedule write. Context-specific ordinary review uses matching-language cards; optional dedicated review is account-wide, including paused contexts. Focus biases authored supplementary practice, never suppresses due vocabulary or changes core/order/gates. Placement/Level-up never receive dynamic SRS/focus items (ADR-036/041/042).

## Active Teacher/Admin screen/flow inventory

| Screen ID | TARGET flow / actor | Current trace | Entry → exit / successful behavior |
|---|---|---|---|
| SCR-A-01 | Staff authentication — Teacher/Admin | UC-01; ADR-034/035 | Teacher invitation → initial-password setup/activation → staff login and current role/status check; shared recovery/profile/password change/logout; no role selection/escalation |
| SCR-A-02 | Curriculum/blueprint and Lesson assignments — Admin | UC-09; ADR-034/035/043 | Requirements/configuration → one current Teacher per Lesson package; reassignment preserves episodes/attribution |
| SCR-A-03 | Assigned Lesson/item editor — Teacher | UC-10; ADR-035/036/043 | Current editable assigned package → validate/save/preview; actual assessment questions are Lesson contributions, not whole-exam authoring |
| SCR-A-04 | Review queue — Admin | UC-12; ADR-036/043 | Submitted Lesson or complete system-assembled assessment version → choose exact target/version; insufficient assembly inputs are reported, not partial versions |
| SCR-A-05 | Review/feedback — Admin | UC-12; ADR-035/043 | Exact target/version → approve or request changes; item/version-wide feedback routes to current Teacher for each source Lesson, never transfers historical authorship |
| SCR-A-06 | Publication — Admin | UC-12; ADR-035/036/043 | Approved/readiness-valid target → publish immutable target; successful atomic active replacement preserves history/pins; failure keeps prior active version; no Unit 4/4 gate |
| SCR-A-08 | Revision/correction — current assigned Teacher; Admin review | UC-10/11/12; ADR-035/043 | Own Lesson feedback → permitted corrected contribution and resubmission → system assembles successor assessment version; no direct edit of old composition |
| SCR-A-09 | Teacher/Learner account administration — Admin | UC-13; ADR-034/035/036 | Necessary identity/status and minimal context summary → provision Teacher, disable/re-enable permitted account with reason/audit; no role-conversion UI, passwords or evidence editing |
| SCR-A-10 | Reports/security audit — Admin | UC-14; ADR-035/036 | Authorized bounded query → permitted summaries and append-only audit; no answer secrets or direct-publish report |

## Shared interaction states and acceptance

Every active inventory row inherits these states, with domain-specific variations below. Server authorization is authoritative; a visible/hidden UI control never grants permission.

| State | Required interaction |
|---|---|
| Loading | Bounded pending indicator; prevent accidental duplicate command submission while preserving retry identity |
| Empty | Explicit no-data explanation and permitted next action; no invented score/progress/result |
| Error | Recoverable message; retain permitted form/input where appropriate; same-operation retry does not duplicate committed evidence |
| Denied | Explain login/disabled/role/assignment/ownership failure safely; do not reveal other users' data, keys or full exams to Teachers |
| Success | Show only permitted result/status; lesson completion independent of score; assessments aggregate-only |
| Coming soon / unavailable | Curriculum screen distinguishes no published/available content from published content locked by sequential access; only unavailable content excluded from eligible denominator |

Shared account subflows apply to all three roles within their account boundaries. SCR-A-01 shows invalid/expired invitation or recovery links safely, permits the supported retry/recovery route and does not grant domain access while Teacher account is PENDING.

Additional cases: SCR-L-02 explains two-ACTIVE capacity; SCR-L-04/05 distinguish interrupted versus completed assessment; SCR-L-07A/B handle unavailable media/invalid input; SCR-L-09/10 allow empty supplementary pools without failing completed core; SCR-A-03/08 report stale version/reassignment and refresh own work; SCR-A-04 reports unmet assembly requirements; SCR-A-05/06 preserve target/version identity and active content on failed transition. See [correction acceptance](docs/design/design-correction-2026-10-20.md) DC01–07 for documentation checks and future runtime cases.

## Compatible visual foundation

Supporting design guidance only: 4px/rem spacing grid; 44×44px learner touch targets; mobile 360px+, tablet 768px+, desktop 1024px+; Vietnamese/English glyph coverage; normal-text contrast ≥4.5:1 and large text/controls ≥3:1. System sans-serif and semantic neutral/success/error/warning/info colors remain a baseline; detailed typography/brand/dark mode are unresolved visual work, not claims about a running Admin application. No new runtime/CSS is implemented by this index.

## Historical screen identities (not active MVP authority)

SCR-L-11/12/13 are absent from the current active inventory; historical meanings remain in prior artifacts, not recycled here. SCR-A-07 emergency-publish modal and SCR-A-11 operations ticket console are historical entries, not current approved MVP flows. Six-role UI matrices, Unit 4/4, Skip→U1, retry quota/70% credit and old UC/BF mappings are superseded by the controlling decisions above; their original versions remain in Git/history. Reminder UC-03, Jump and Reassessment remain deferred. This reconciliation does not reopen them.

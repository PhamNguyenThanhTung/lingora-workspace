# Clean the nine report Use Case diagrams

Date: 2026-10-12 (Asia/Saigon). Classification: approved bounded documentation/modeling correction.

## Human authorization

The user explicitly requests: “Hãy sửa lại TOÀN BỘ 9 Use Case diagram mới thêm gần đây.” The instruction authorizes removal of all rendered notes, layout cleanup, correction/removal of invalid or redundant UML relationships, and merging UI/internal steps into existing actor goals. It prohibits product/domain changes, new use cases outside these views, Prisma/migrations/application/API/tests/ADR edits, and historical-document deletion. It requires a before/after report and permits the named Word document as a formatting reference only. This direct instruction approves this documentation-only scope under AGENTS.md; no further product approval is inferred.

## Reviewed source authority

- Current `docs/use-case-specifications.md` UC-01/02/04/05/06/07/08/09/10/11/12/13/14 and `docs/study-focus-addendum.md` control the represented behavior.
- The nine `VIEW-RUC` sources and their README provide the existing functional-view identities. Canonical catalog IDs/count stay unchanged.
- Word reference: `C:/Users/PC/Downloads/PROJECTONE2_updated_with_conclusion_v2 (1).docx`, read-only. Borrow actor-outside-boundary and readable spacing only; do not import its TOEIC functions, CRUD/DB/hash use cases or questionable dependencies.
- The prior Draw.io insertion task remains captured in REVIEW as historical task state. This new scope modifies only the nine report pages in the current 44-page file; it preserves the other 35 pages exactly as they exist at this task's entry. It does not resolve or approve the prior source/output drift.

## Permitted changes

1. Nine `docs/modeling/report-usecases/VIEW-RUC-*.puml` files, their 18 SVG/PNG outputs, their manifest and relevant README documentation.
2. Only the nine `page-VIEW-RUC-*` pages in `docs/modeling/current-target/lingora-all-diagrams.drawio`; preserve every other page's raw XML, name, identity, order and payload. Do not execute the full-bundle builder.
3. A before/after report, backup ZIP, preservation baseline, exported native-page review evidence, lifecycle plan/approval/archive records, HANDOFF, and append-only test/development logs. A targeted current-target README note is allowed for the corrected nine-page package.
4. Temporary automation outside repository source directories may generate diagram artifacts and run read-only artifact audits. No repository scripts, tests, application, schema, APIs, migrations, ADR, product rules, canonical UC specifications, canonical PUML/renders or physical-design files may change. No staging/commit.

## Presentation design reviewed before edits

- One system boundary per diagram, actors outside it, no inner package boxes or rendered notes. Goal-level ellipses only, short straight associations, consistent spacing and font size.
- RUC-01 keeps all six existing functions. Abstract presentation actor “Người dùng” specializes into the three existing actors to share only Login/Recovery/Profile/Logout; Learner Signup and Teacher Activate remain exclusive.
- RUC-02 merges Language/ChooseStart/SelfReport/DefaultStart into CreateContext; keeps Placement, Focus, Resume, Pause and OpenPath as existing goals.
- RUC-03 merges OpenLesson/Core/Feedback/Retry/Complete into the existing canonical UC-06 name “Học bài và Làm bài tập tương tác”. Keep Redo, Performance and Supplementary; SRSQuestion is an ordinary practice interaction within supplementary/SRS behavior, not another goal.
- RUC-04 merges AnswerQuestion/StartReview/SelectDue/Schedule into “Ôn tập từ vựng theo SRS”; keeps AddOptional. No scheduling/due-list actor use case.
- RUC-05 merges submission into the respective assessment goals; corrects whole-goal names to existing “Làm Placement” and catalog “Thi lên cấp”; keeps the two result-view goals.
- RUC-06 keeps all five functions; RUC-07 merges Members/Preview into Draft and receiving Changes into Resubmit/History; RUC-08A keeps all eight functions; RUC-08B keeps all four functions.
- Remove three RUC-03 dependencies and three RUC-04 dependencies once their step/internal nodes are folded. No replacement include/extend is necessary; do not turn preconditions or actor co-use into UML dependency.
- Remove seven rendered note boxes. Their content remains in current specifications; no rule is deleted or changed.

## Acceptance and verification

1. Before report identifies all nine files, layout problems, suspicious relationships, notes, classifications, name corrections and merges before any diagram edit.
2. Exactly nine corrected report sources and eighteen fresh renders; no rendered note, technical internal goal, unapproved new goal or invented include/extend. Retained names are unchanged except the listed goal-level corrections.
3. Nine editable native Draw.io pages occupy the existing 09–17 positions after Admin. Other 35 raw page fragments, current canonical/domain/spec/ADR/app/schema/script/test files, HEAD/index and Word reference match the entry baseline.
4. Run PlantUML syntax and fresh SVG/PNG rendering for the nine only. Export all nine actual native pages with Draw.io Desktop and inspect every page. Check actors outside boundary, containment, grid/spacing, labels, straight connectors and lack of crossings/overlaps through structural audits plus visual review.
5. User explicitly forbids test edits; use artifact checks only. Do not modify historical verifiers/baselines to obtain PASS. Record observed evidence, diff/stat, line counts and append-only logs before marking DONE. No runtime test or physical/product acceptance claim.

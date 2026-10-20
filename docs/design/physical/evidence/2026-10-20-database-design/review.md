# Independent reconciliation review — 2026-10-20

Scope: current database reconciliation, proposed catalog/security/four-view ERD, accepted Class coverage and ADR-043 ownership. Separate read-only reviewer `database_design_review` inspected the actual diff, source rules and content/assessment PNGs. No live database or runtime tests.

## Initial verdict: NEEDS CORRECTION

**F-DB43-01 (P1):** Corrected contributions could lose to rejected originals. Stable-ID selection of submitted items did not explicitly supersede earlier source revisions or exclude source items rejected through version-level feedback. A correction could therefore select an earlier rejected item and replay the same CHANGES_REQUESTED version. Empty feedback IDs also lacked explicit expansion for routing.

The reviewer otherwise found consistent Lesson-only assignments, creation/submission episodes, system-only immutable assembly, Admin lifecycle authority, proposed FORCE RLS chains, 22-class/enum coverage and 34 tables. Product approval remained distinct from proposed physical mechanisms and live-state claims. Inspected PNGs were readable.

## One bounded correction round

- Resolve greatest submitted revision_no per covered Lesson before blueprint/item filtering. Submitted packages are complete replacement snapshots; omission does not inherit older items. Unsubmitted drafts do not supersede; invalid latest submitted source blocks rather than falling back.
- Derive source-item exclusions from retained REQUEST_CHANGES feedback; empty list expands every member/source Lesson for exclusion and own-assignee routing.
- Corrected successors use new submission/item identities and input hash; rejected input cannot replay its returned version. Approval/publication shares locks and rechecks precedence/exclusions.
- DB43-08 now covers rejected old IDs sorting first and version-wide feedback routing. Catalog, security and report agree; no extra table.

## Final independent verdict: PASS — F-DB43-01 CLOSED

The same independent reviewer re-read the actual revised selection/feedback, catalog, security and DB43-08 rules after the one bounded correction round. Greatest submitted revision per Lesson supersedes earlier input; omissions cannot fall back; rejection filtering precedes ordering; empty feedback expands all sources; new submissions change assembly input; publication rechecks under shared locks. **No remaining blocking findings within the reviewed documentation scope.** Initial review's other inspected boundaries remain consistent.

Independent documentation review does not approve physical deployment or establish installed RLS. Runtime DB43 cases remain NOT EXECUTED; live DB/security UNVERIFIED.

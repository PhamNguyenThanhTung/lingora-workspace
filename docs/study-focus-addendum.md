# Study Focus personalization — ADR-042 addendum

**PO DECISION RECORDED · 2026-10-12 · documentation/modeling only.** This additive decision follows ADR-036 and the internal SRS interaction clarification ADR-041. It does not approve physical implementation. Exact PO request controls this scope.

Each LearningContext has exactly one primary `studyFocus`: `BALANCED` (default), `VOCABULARY`, `GRAMMAR`, `READING`, or `LISTENING`. Learners can choose/change it in their owned context preferences. Creation succeeds without choosing it. Changing it affects the next supplementary session; an already started session retains its selected composition. No preference-history subsystem is required. Existing purpose/preferences remain separate.

The shared core curriculum retains its order, unlocks, required lessons, completion and Level-up gates. Core performance uses configured N, first-wrong K, contributions 1/0.5/0 and denominator N+K; completion is independent of score. Supplementary responses neither enter N/K nor create core completion. Changing focus does not reset progress, SRS, starting point or working level; it never rewrites old attempts, results or scores.

## Supplementary selection and eligible metadata

For ordinary learning/practice, the system may prepare a supplementary block after core completion. It combines two independent concerns: internally eligible due/overdue SRS cards and eligible authored practice with a focus bias. Focus is a preference, not an exclusive filter. BALANCED uses the ordinary distribution; the other four bias the corresponding area using finite configuration. Counts, ratios and weights are configuration-driven, with no fixed platform question count or percentage. If preferred-area material is sparse, fall back to eligible material in other areas; an empty eligible pool produces an empty optional block without failing the completed core lesson.

Eligible authored practice must belong to the context's course/language/framework and currently permitted curriculum scope, with an active published AVAILABLE lesson revision/membership, PRACTICE origin and valid active metadata. Selection must not bypass progression access. Exclude drafts, withdrawn/retired/inactive content/media, secure assessment items and prohibited assessment reuse. Frozen fingerprints/exposure protections remain in force; no generated content is introduced.

Reuse the finite course Topic/Skill/Knowledge Area catalog. Its controlled area codes are `VOCABULARY`, `GRAMMAR`, `READING`, `LISTENING`; a catalog skill maps to one such area and retains its stable ID, label, active flag and generation. Authored practice references these existing skill IDs. Validate course membership, active flag and area mapping before publication, snapshot with immutable item revision, and reject invalid mappings in current selection. This is a bounded metadata extension, with no taxonomy subsystem or extra table. BALANCED is a preference, not a content-area tag. Exercise format (e.g. MCQ) is separate from knowledge area.

## SRS and secure assessments

Due/overdue selection, due_at and stage remain internal. Learners see a question/prompt only after starting the ordinary supplementary block or optional dedicated review session; there is no due-list query, preview, card menu or advance enumeration. A rating references only the server-selected card in the signed session. Unselected overdue cards remain due and eligible. GRAMMAR/READING/LISTENING focus never suppresses due VOCABULARY cards. Ordinary context sessions use language-matching cards; optional dedicated account review remains account-wide, including paused contexts.

Keep Policy B: stages 1/3/7/14/30 days, recurring 30 days at stage 5, FORGOTTEN returns to stage 1/+1 day. Core vocabulary enrolls on valid core completion; optional vocabulary uses Add to Review. Learner+Vocabulary is unique, existing enrollment preserves schedule, and a forgotten card may have at most one end-session reinforcement with no second schedule/day write.

Placement and Level-up retain their pinned immutable Assessment Version composition, purpose/scope/coverage/grading and result rules. Never inject focus-biased practice or dynamic SRS into their scored item set. Any separately started practice before/after an assessment is supplementary and cannot enter its result, completion or progression transaction.

## UC and modeling boundary

`Chọn/thay đổi trọng tâm học tập` is a supporting context/preferences subflow of UC-04, also used by ordinary practice UC-06 and SRS UC-07. Canonical UC-01–UC-14 identities/count remain unchanged; no new canonical UC. Existing report views for context, lesson/practice and SRS reflect this subflow. Only ACT-01/03/06, SEQ-06/08 and DOM-01/DATA-03 need focused synchronization. Untouched secure-assessment diagrams retain their entry hashes.

## Design acceptance — future runtime tests, NOT EXECUTED

| ID | Setup/action | Expected invariant |
|---|---|---|
| PERS-01 | Create a valid new context without a focus choice | BALANCED is stored; starting-point defaults and capacity checks remain valid |
| PERS-02 | Set GRAMMAR; start a new ordinary supplementary session with sufficient eligible grammar material | Configured grammar bias applies to authored practice; existing core history stays intact |
| PERS-03 | Preferred-area pool is sparse/empty | Fall back to other eligible areas; no session/core failure caused by scarcity |
| PERS-04 | GRAMMAR focus and due/overdue vocabulary cards coexist | Due cards remain independently eligible/selected by the SRS policy; no focus-based suppression |
| PERS-05 | Change focus while prior attempts, progress, an open supplementary session and SRS cards exist | Only subsequent composition changes; old scores/progress/SRS/start/working level and open composition stay unchanged |
| PERS-06 | Complete core then supplementary answers | N/K, 1/0.5/0, N+K, unlock order/completion and readiness gates use core only |
| PERS-07 | Start/finalize Placement with any focus and due cards | No dynamic item injection; pinned version/result remains unchanged |
| PERS-08 | Start Level-up, then change focus/current practice configuration | Original immutable assessment item set and grading stay pinned; current curriculum gate is checked separately |
| PERS-09 | Send a focus outside the five-value set or invalid/retired/out-of-course practice tags | Reject invalid preference/metadata; no mutation or unauthorized selection |
| PERS-10 | Learner L2 requests a focus update or supplementary session for L1's context | Deny before reading private context/cards or mutating preferences; no side effects |

Physical principal/transaction detail and F01/F02 acceptance are in [security and RLS](design/physical/security-and-rls.md), [physical design](design/physical/README.md) and future acceptance. No runtime acceptance verdict is claimed by this document.

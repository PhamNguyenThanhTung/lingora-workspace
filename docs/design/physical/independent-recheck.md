# Independent F01–F12 Closure Recheck

> **PROPOSED PHYSICAL DESIGN — NOT IMPLEMENTED** · 2026-10-11
> Read-only second review after the correction pass. This is a documentation-closure verdict, not physical-design approval or runtime/database evidence. All future acceptance scenarios remain **NOT EXECUTED**; LIVE DB UNVERIFIED.

The independent reviewer checked the corrected artifacts and controlling source for each finding, including the physical catalog/runtime design, capability matrix, ERD, correction report, and future acceptance scenarios. F10 was checked against approved ACT-01. No repository edits were made by the reviewer.

| Finding | Result | Independent evidence |
|---|---|---|
| F01 | CLOSED | `README.md` §E and `TEACHER_SUBMIT` define a checked assigned-Teacher submit path; success and unassigned/stale denial are in PD-F01. |
| F02 | CLOSED | `README.md` §B and `CTX_CREATE` support first context without an existing row and serialize owner/capacity checks; PD-F02 covers creation and capacity races. |
| F03 | CLOSED | `README.md` §§I–K and `lingora_audit_writer` retain a verified Auth subject without an account row; PD-F03 covers the denied operation/audit attribution. |
| F04 | CLOSED | `README.md` §§E, I–K pin assignment generation/scope through review; PD-F04 covers stale approval and referenced curriculum movement. |
| F05 | CLOSED | `README.md` §§E, L–M and `TEACHER_REMOVE_DRAFT_MEMBER` restrict removal to checked draft associations; PD-F05 covers editable and frozen cases. |
| F06 | CLOSED | `README.md` §I and `MEDIA_CLEANUP` use the shared asset lock and retirement reservation; PD-F06 covers the cleanup/reference race. |
| F07 | CLOSED | `README.md` §E freezes referenced curriculum ownership and permits only same-scope reorder; PD-F04 covers cross-level movement and reorder. |
| F08 | CLOSED | `README.md` §F and `LESSON_COMPLETE` require the active AVAILABLE revision for first completion; PD-F08 covers stale attempts and replacement races. |
| F09 | CLOSED | `README.md` §§G, L–M specify separate card/session uniqueness for schedules and reinforcements; PD-F09 covers retries and distinct parents. |
| F10 | CLOSED | Approved ACT-01 selects the lowest level with content. `README.md` §B, `CTX_CREATE`, and `physical-erd.puml` prevent a higher configured default from overriding it; PD-F10 covers that case, zero available levels, and a concurrent update under the course lock. |
| F11 | CLOSED | `README.md` §H freezes used blueprint scope and pins attempts to version snapshots; PD-F11 covers configuration changes and historical attempts. |
| F12 | CLOSED | `README.md` §§B, E, H define finite course-scoped active tags, generation and label snapshots, blueprint coverage checks, and PLACEMENT/LEVEL_UP only; PD-F12 covers allowed tags and rejection of invented, other-course, retired/inactive, and uncovered tags. |

The reviewer also confirmed that the current ERD renders match the evidence renders. The coverage/default scenarios are proposed future acceptance cases only; no database execution, live-state claim, or physical-design approval follows from this recheck.

**Overall: READY FOR FINAL PHYSICAL DESIGN RECHECK.** The correction task may stop at **PHYSICAL CORRECTION COMPLETE — READY FOR FINAL RECHECK**. The separate final physical design review remains necessary before implementation planning.

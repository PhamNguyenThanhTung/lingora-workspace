# M2.2 BEHAVIOR / UC / ACTIVITY / STATE — PLAN

> PLAN ONLY. Không implementation, không sửa domain model/D3/D4/M2.1, không code/API/schema/migration/UI, không commit.
> Status: `REVIEW REQUIRED` (chưa APPROVED — không được implement trước human approval).
> Entry condition đã đạt: M2.1 ACCEPTED FOR M2.2 (D-G1/D-G2 PASS).

## A. Objective

Thiết kế toàn bộ **behavior layer** của Lingora (UC, activity, state machines, progression, placement/jump, SRS, exercise/retry, screen-flow logic) trên nền M2.1/D1–D4 đã ACCEPTED, tuân thủ `docs/phase-1-system-design-plan.md` §7 (M2.2: artifacts 2, 3, 9, 10, 17, 18, 19; validation D-G4 + D-G7). Mọi behavior kế thừa locked rules D1–D9 nguyên văn; mọi giá trị chưa được phép chốt giữ `OPEN / CONFIGURABLE / PENDING VALIDATION`.

## B. Source of Truth

| # | Tài liệu | Dùng cho |
|---|---|---|
| 1 | `docs/phase-1-system-design-plan.md` §§2,5,7,8,10 (§7 M2.2, gates D-G4/D-G7) | Artifact contract, scope, gates — **current roadmap duy nhất** |
| 2 | `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (§§4–9, §11.2, §12) | Domain entities, lifecycle §5, progression §6, DD behavioral baselines |
| 3 | `docs/phase-1-d3-assessment-learning-engine-design.md` (§§A–Q) | Assessment architecture, invariants I1–I10, open decisions §N |
| 4 | `docs/phase-1-d4-content-curriculum-design.md` (§§A–T) | Curriculum hierarchy, lesson blueprint, concept taxonomy, item bank, open decisions §Q |
| 5 | `docs/02-requirements.md` (P1-FR-001..017, P1-NFR-001..004) | Functional requirements |
| 6 | `docs/05-traceability-matrix.md` (§§3,6,7) | FR→MVP→UC→Domain→D3→D4 chains |
| 7 | `docs/08-english-a1-curriculum.md` | 6 Units / 24 Lessons / ~200 vocab baseline |
| 8 | `docs/09-placement-and-jump-specification.md` | Mapping A, jump scopes, retry/compat |
| 9 | `docs/01-architecture.md` (§3.1–3.5) | Engine/config/bank/rubric, SoD, invariants |
| 10 | `docs/03-api-contract.md` | Read-only context (không sửa ngầm) |
| 11 | `docs/04-data-model.md` (:449 canonical pointer) | M2.1 là canonical cho logical data model |
| 12 | `docs/06-system-analysis.md` (§4 UC catalog, §5 BF-01..15) | UC/BF catalogs + flows hiện có |
| 13 | `HANDOFF.md`, `docs/QUICK-REF.md`, `plans/current-task.md`, `logs/decision-log.md` (ADR-014/015/016/017) | State, boundaries, decisions |

Historical/superseded (`docs/00-master-plan.md` §§0.1–0.5 legacy, Android M1.6, DKT/HLR/MultiWOZ, 10-UC legacy) **không phải source** — chỉ dùng để gắn nhãn khi đối chiếu.

## C. Scope

**In scope (behavioral design only):**
* UC specs cho 15 canonical UCs (actor/trigger/pre/main/alt/exception/post/rules/objects/trace).
* Activity specifications cho các flow chính (gom logical flows, không bắt buộc 15 diagrams riêng).
* State machines: content lifecycle (reuse M2.1 §5 + behavior spec), progression 3-state, KnowledgeGap, ConceptMastery, AssessmentResult creation-to-immutable lifecycle (không mutable state machine).
* Decision flows: placement/jump (artifact 17), SRS (artifact 18), progression (artifact 3 behavior layer).
* Screen-flow inventory logic (artifact 19), không pixel/UI.
* Behavioral closure cho DD-01/02/04/05/06 (semantics only — §M).
* Traceability append: Requirement → MVP → P1-FR → UC → **M2.2 Behavior**.

## D. M2.2 Artifact Contract

Theo plan §5 (six fields bắt buộc: Purpose, Inputs, Outputs, Dependencies, Trace, Validation Gate):

| Artifact | Vai trò trong M2.2 | Outputs |
|---|---|---|
| #2 Content Lifecycle State Model | REUSE + behavior binding (không redesign lifecycle) | Behavior specs bám §5.2/§5.3 + puml hiện có; actor authority trong từng UC authoring |
| #3 Learning Progression Model | EXTEND behavior layer | Entry-flow behavior (hai nhánh self-reported vs diagnostic + jump/standard paths), Starting Point ≠ Proficiency ≠ Completion |
| #9 Use Case Diagram | VERIFY + COMPLETE | 15-UC actor map: 14 Core + UC-15 optional/future; SoD thể hiện trên associations |
| #10 Activity/State Behavior Set | CREATE (core mới của M2.2) | Activity + state specs cho approved flows, bám Product Decisions D5–D9 where applicable |
| #17 Placement/Jump Decision Flows | CREATE | Mapping A bands, jump scopes/threshold/cooldown, no-CEFR |
| #18 SRS Decision Flow | CREATE | Baseline→due→item→workload flow, deterministic, AI non-ownership |
| #19 Screen/Flow Inventory | CREATE | Logical inventory learner + authoring, Core/extension status |

Files dự kiến (tên đúng contract khi thực thi): master `docs/phase-1-m2-2-behavior-uc-activity-state.md` + PlantUML `docs/plantuml/uc-*.puml`, `activity-*.puml`, `state-*.puml`, `placement-jump-m22.puml`, `srs-flow-m22.puml`, `screen-flow-inventory-m22.puml` + cập nhật `docs/05-traceability-matrix.md` (§8 M2.2), `docs/01-architecture.md` (cross-ref §3.6), `logs/*`, `plans/current-task.md`, `HANDOFF.md`. Số lượng diagram tối thiểu đủ coverage, không phình.

## E. Use Case Design

Canonical catalog (per `phase-0-final-master-consolidation.md:277-291`; UC-15 optional):

| UC | Tên canonical | Actor authoritative (SoD) |
|---|---|---|
| UC-01 | Authenticate & Manage Session | Learner, Admin |
| UC-02 | Configure Goals & Study Time | Learner |
| UC-03 | Take Placement Test | Learner |
| UC-04 | Browse Learning Path & Jump Units | Learner |
| UC-05 | Complete Lesson & Controlled Retry | Learner |
| UC-06 | Spaced Repetition Review (SRS) | Learner |
| UC-07 | Track Progress & Streak | Learner |
| UC-08 | Create & Edit Lesson Draft | Lesson Creator (assigned only) |
| UC-09 | Review & Moderate Content | Moderator (APPROVED, no publish, no self-approve) |
| UC-10 | Publish Approved Content | **Organizational Manager** (+ Admin emergency `APPROVED→PUBLISHED` + justification + AuditLog) |
| UC-11 | Manage Accounts & Roles | Administrator |
| UC-12 | View System Reports | Administrator |
| UC-13 | View & Audit Security Logs | Administrator |
| UC-14 | Handle Support Tickets | Operations Staff (minimal lookup, escalate Mod/Admin, không sửa học liệu) |
| UC-15 | Manage Cohorts & Group Progress | Organizational Manager — **OPTIONAL/FUTURE, extension boundary** |

Mỗi UC spec gồm: actor, trigger, preconditions, main success flow, alternate flows, exception flows, postconditions, business rules (D1–D9 exact values), referenced domain objects (từ M2.1 §4/§8), traceability (MVP/P1-FR/BF). **Không UC-16/17/18.**

Hai điểm đã biết phải xử lý trong spec (không phải findings mới):
1. **Scenario writing + GEC (P1-FR-007) không chiếm UC** — behavior thuộc **BF-14** + ADR-014 TARGET (`master-report-independent-review:196,279`; `corrective-report:164` đã gỡ `UC-06-viết`). Cấm resurrect nhãn `UC-06-viết`.
2. **UC-10 actor table ghi "Manager, Moderator"** (`consolidation:286`) — spec phải chốt theo SoD baseline: publisher duy nhất là Organizational Manager (Moderator dừng ở APPROVED); Moderator xuất hiện trong UC-10 chỉ ở vai trò upstream, không phải publisher.

## F. Activity Design

Activity specs bám `06-system-analysis.md` §5 (BF-01..15, mỗi flow đã có actor/trigger/input/steps/decision/output/state-change/exception) và mở rộng thành behavior sets fully-specified. Tối thiểu cover 15 families: auth/session (BF-01), goals/study time (BF-13 touch P1-FR-014/015), diagnostic/placement (BF-08), browse path (BF-09 + BF-02 planning context), exercise + retry (BF-09/10), SRS (BF-12), progress/streak (BF-13), authoring (BF-03/04), review (BF-05), publish (BF-07), accounts (UC-11), reports (UC-12), audit (UC-13), support (BF-15), cohort (UC-15, extension). Gom logical flows khi cùng actor + decision table (ví dụ BF-03/04 authoring, BF-05/06/07 workflow) nhưng trace matrix phải chứng minh coverage BF-01..15 đầy đủ, không BF-16.

## G. State Machine Design

Artifacts riêng cho:
1. **Lesson/content lifecycle** — REUSE M2.1 §5 + `content-lifecycle-state.puml` (`Draft → In Review → Changes Requested → Draft → In Review → Approved → Published → Archived`; ARCHIVED terminal trong Core; clone-to-draft tạo v2). M2.2 chỉ thêm behavior binding per-UC, không redesign transitions.
2. **Learning progression** — 3-state `ADVANCE / ADVANCE_WITH_SUPPORT / REMEDIATE` (D3 §F); **cấm automatic advance** (completion ≠ readiness, invariants I3/I4/I5).
3. **KnowledgeGap** — `OPEN → IN_REMEDIATION → RESOLVED` (D3 §E; archival policy OPEN).
4. **ConceptMastery** — `NOVICE → DEVELOPING → MASTERED` (thresholds CONFIGURABLE, §8.20.5).
5. **Assessment entry & result lifecycle** — hai nhánh behavior tách bạch tuyệt đối, không gộp:

### Self-reported entry (không sinh evidence)

```text
Self-reported level
→ UNVERIFIED
→ temporary curriculumStartingPoint
→ no AssessmentResult
→ no SkillProfile
→ no verifiedProficiency
```

### Diagnostic entry (sinh evidence)

```text
Diagnostic assessment
→ AssessmentResult
→ SkillProfile
→ verifiedProficiency
→ curriculumStartingPoint
```

Invariants giữ trong mọi behavior/diagram:

```text
Self-reported ≠ Verified
Starting-point ≠ Proficiency
```

Jump/Standard paths giữ semantics riêng theo D1–D9 (assessment executions tuân purpose/mode axes của D3; self-reported entry không bao giờ sinh `AssessmentResult`).

**AssessmentResult lifecycle wording (bắt buộc):** không mô tả `AssessmentResult` như mutable state machine. M2.2 chỉ mô tả:

```text
Assessment execution
→ AssessmentResult created
→ completed
→ immutable persisted evidence
```

Retake / re-evaluation tạo **AssessmentResult mới**, không mutate result cũ. Diagram lifecycle (nếu có) phải dùng terminology không gây hiểu nhầm rằng result chuyển qua các business states sau khi completed (ví dụ đặt tên `executed → recorded → immutable`, cấm các state như `approved/published/in-review` cho result).

## H. Progression Behavior

Tuyến tính Unit 1→6 (mỗi Unit 4 lessons, L4 review gate — 08). Curriculum entry / starting-point selection may be established through:
- linear curriculum prerequisites,
- diagnostic placement (Starting Unit từ Diagnostic entry, §G),
- self-reported temporary starting point (UNVERIFIED, §G),
- Jump according to existing policy (SKIPPED_BY_JUMP/UNLOCKED_BY_JUMP, `by_jump=true`, never COMPLETED_BY_LEARNING).
Self-report chỉ tạo temporary/unverified starting point và không sinh `AssessmentResult`, `SkillProfile` hoặc `verifiedProficiency` — không phải verified unlock. Unit visible khi 4/4 lessons PUBLISHED (catalog visibility ≠ learner unlock — D4). Readiness gate 3-state trước chuyển cấp; weak skill → scaffolding/remediation, không whole-level downgrade; remediation = fresh context/vocab/exercises, không forced replay (I6/I7).

## I. Placement / Jump Behavior

* Entry paths: self-reported (UNVERIFIED, Skip→U1, temporary starting point, **no AssessmentResult** — §G) vs diagnostic (sinh AssessmentResult → SkillProfile → verifiedProficiency → Starting Unit) vs jump vs standard learning (semantics riêng D1–D9). `Starting Point ≠ Proficiency ≠ Learning Completion`.
* Placement: Skip→U1 (no score), Retake từ Profile (tạo AssessmentResult mới — §G), output duy nhất Starting Unit, Mapping A bands chính xác (0–7:U1, 8–12:U2, 13–17:U3, 18–22:U4, 23–26:U5, 27–30:U6), **English A1 curriculum placement only — không CEFR certification, không universal conversion, không scoring algorithm**.
* Jump: scopes 20q (1 Unit) / 25–30q (2–3 Units) / 40q (>3 Units, không cấm); pass ≥95% (Product Policy); fail → cooldown 24h; provenance labels + `by_jump=true`. Cấm `COMPLETED_BY_JUMP` dưới mọi hình thức.

## J. Exercise / Retry Behavior

Flow: Lesson → Exercise → Answer → Feedback (đúng/sai + explanation) → Retry policy → Completion/continued practice. Phân biệt 4 tầng: `Exercise correctness ≠ Lesson completion ≠ Mastery ≠ Proficiency`. Controlled Retry D7 chính xác: allowance `max(1, floor(N×0.10))`, credit 70%, completion = xử lý hết first-pass + câu sai bắt buộc trong allowance, **không điểm sàn 80%**. Không tạo assessment scoring algorithm mới; 5 exercise types + READING candidate giữ nguyên D4 boundary.

## K. SRS Behavior

Flow: baseline `[1,3,7,14,30]` → due queue (`nextReviewAt <= now()`) → item adaptation → workload adaptation → `record_review` atomic (log + card + streak) → next-review determination. Deterministic, AI-independent (AI không sở hữu tiến độ). Streak interaction: qualifying activity, +1/ngày theo local timezone (`Asia/Ho_Chi_Minh`), miss → reset về **1** (D9; biết trước mâu thuẫn 06 UC-07:281 "về 0" — spec chốt theo D9/BF-13). Không Reminder subsystem (6d in-app là M2+ scope; 6a/6b deferred).

## L. Screen-flow Inventory

Logical inventory, 2 chuỗi:
* Learner: Login → Foundation/Home → Course → Unit → Lesson → Exercise → Review → Progress (+ SRS entry, placement/diagnostic entry, self-reported entry, GEC scenario entry BF-14, goals/streak screens).
* Authoring: Manager assignment → Creator draft → Moderator review → Manager publish (+ revision clone-to-draft loop, ops ticket escalation path, admin accounts/reports/audit).
Mỗi entry: role, UC/BF trace, state coverage, Core/extension status (UC-15 + cohort screens = extension). Không pixel/color/typography/components/CSS/code.

## M. DD-01/02/04/05/06 Behavioral Closure

| DD | M2.2 closes (behavioral semantics) | M2.2 KHÔNG làm (physical — milestones sau) |
|---|---|---|
| DD-01 Unit | Hierarchy behavior trong progression/screen flows (Course→Unit→Lesson điều hướng, placement/jump theo Unit) | Physical Unit relation + migration mapping (M2.6 handoff) |
| DD-02 Revision | Clone-to-draft behavior trong authoring flows (v1 PUBLISHED giữ nguyên, v2 lifecycle đầy đủ) | `supersedes_id` vs revisions-table vs version-flag (M2.3+/M2.6) |
| DD-04 Assignment | Assignment behavior (Manager plans/assigns → Creator authors assigned only → no bypass) trong UC-08/BF-03 flows | Physical fields `creatorId`/`assignmentBrief` (M2.3+/M2.6) |
| DD-05 Assessment context | Assessment-mode behavior (purpose vs mode trong activity/state/decision flows, 0 Exam/QB; self-reported entry không sinh result — §G) | `isAssessmentMode` vs `lesson_type` physical (M2.3+/M2.6) |
| DD-06 Placement | Placement behavior (score→Starting Unit, Skip/Retake, non-editability, auditability requirements; retake = new AssessmentResult — §G) | `starting_unit`/`placement_history` physical + history strategy (M2.3+/M2.4) |

DD-03/DD-10 ngoài scope M2.2 (M2.4: artifacts 13/14/16); M2.2 chỉ dùng audit obligations + role boundaries như behavioral requirements có sẵn, không thiết kế security matrix.

## N. Traceability

Append-only: Requirement → MVP → P1-FR → UC → Domain (có sẵn từ D4 chain) → D3 → D4 → **M2.2 Behavior** (UC spec § + activity/state/decision-flow IDs). Không tạo Requirement/MVP/P1-FR/UC ID mới. Mọi behavior row phải resolve tới ID thật; chỗ baseline không cấp code (P1-FR-007/BF-14, P1-FR-017) giữ chữ mô tả như canonical matrix, không bịa UC.

## O. Verification & D-G4/D-G7

**D-G4** (Input: artifacts 9,10,19 + UC/BF catalog + roles baseline; Method: cross-check 15 UCs + 15 BFs + actors + alt/exception paths + screen states; PASS: actors đúng incl. SoD, UC-15 optional/future, 0 Exam/QuestionBank, 0 policy drift; FAIL: orphan UC/BF, wrong actor, missing exception path, future screen trong Core, behavior drift; Evidence: UC/BF-to-artifact matrix + activity/state set + screen inventory).
**D-G7** (Input: artifacts 3,10,17,18 + 08/09 + Product Decisions D5–D9 where applicable; Method: đối chiếu từng placement/jump/retry/SRS/exercise-context rule với locked values; PASS: Mapping A bands, Starting Unit output, Skip→U1, jump scopes/95%/24h + provenance, retry 10%/70% + completion rule, SRS Policy B + AI non-ownership, unified exercise, self-reported ≠ verified + starting-point ≠ proficiency, 0 CEFR claim; FAIL: bất kỳ threshold/cooldown/interval/completion-rule/output/entity-model/self-report-merge/CEFR nào lệch; Evidence: decision-flow tables + policy-value checklist + trace rows).

## P. Open Decisions

Giữ nguyên từ D3 §N + D4 §Q: diagnostic item count/distribution, scoring function, adaptive/stopping thresholds, mastery/readiness/remediation thresholds, Anchor aggregation, CEFR→Unit ngoài Mapping A, HSK mapping/version, KnowledgeGap archival policy, recommendation policy/version, Reading physical representation. Behavior spec dùng placeholder `OPEN / CONFIGURABLE / PENDING VALIDATION` — cấm điền giá trị, cấm freeze thresholds qua activity guards.

## Q. Risks

| Risk | Mitigation trong plan |
|---|---|
| Threshold drift (behavior spec vô tình chốt số) | Mọi decision node có OPEN-tag + D-G7 checklist bắt literal values |
| Flat-score temptation (gộp SkillProfile) | Invariant I2 trong mọi assessment activity; D-G4 probe |
| Mapping A generalization | Scope note "English A1 only" trên mọi placement flow; D-G7 no-CEFR probe |
| Completion-as-readiness regression | I1/I4/I5 + no-automatic-advance edge rule; progression state machine review |
| Purpose/mode conflation | Hai trục tách bạch trên mọi diagram + label (không gộp enum) |
| Self-report/verified conflation | Hai nhánh §G tách bạch + invariants Self-reported ≠ Verified, Starting-point ≠ Proficiency; D-G7 probe cấm nhánh self-report sinh AssessmentResult |
| Mutable-result temptation | Wording §G bắt buộc (created → completed → immutable; retake = new result); D-G4 probe terminology |
| Ghost-entity reintroduction (đặc biệt AssessmentSession persistent) | D-G4 probe 0 Exam/QuestionBank/AssessmentSession active |
| UC-10 actor ambiguity (table ghi Moderator) | SoD-authoritative actor rule (§E.2); verification bắt publisher = Manager |
| Streak reset wording ("về 0" vs "về 1") | Spec chốt D9 (về 1); ghi discrepancy note, không sửa baseline trong M2.2 |
| Diagram inflation (quá nhiều diagram) | Gom logical flows (§F); coverage chứng minh bằng trace matrix |

## R. Explicit Out of Scope

Runtime code; API implementation; Prisma/schema; migration + migration execution; RLS implementation; UI implementation (pixel/components/CSS/React/Android); algorithm implementation (scoring, recommendation, mastery, readiness engines); sửa D3/D4 artifacts; sửa M2.1 artifacts (chỉ REUSE/extend behavior layer); training/benchmarking; new MVP functions/UC IDs; Exam/QuestionBank/badges/streak-recovery/CEFR-certification/DKT/HLR/MultiWOZ/Android.

## S. Execution Order

```text
M2.1 accepted (DONE)
→ M2.2 behavior (plan này; APPROVE trước khi implement)
→ M2.3 sequence/API (artifacts 11,12,15)
→ M2.4 architecture/security (artifacts 13,14,16; DD-03/DD-10)
→ M2.5 validation (artifact 20; D-G1..D-G9)
→ M2.6 handoff (D-G10; physical DD closures)
→ Design Complete → Implementation (M2 web core… — gated riêng)
```

Không nhảy M2.3/M2.4 trước khi M2.2 behavior ổn định + D-G4/D-G7 PASS.

## T. Exit Gate

M2.2 DONE chỉ khi: artifacts 2,3,9,10,17,18,19 đủ six-field contract; 15 UCs + 15 BFs mapped đầy đủ; mọi locked policy xuất hiện chính xác (D-G7 checklist); self-reported/verified tách bạch + AssessmentResult immutable wording đúng §G; 0 Exam/QuestionBank/AssessmentSession/CEFR-drift; UC-15 + cohort/support screens labeled extension; traceability append hoàn chỉnh; D-G4 + D-G7 có Input/Method/PASS/FAIL/Evidence records; 0 implementation work performed.

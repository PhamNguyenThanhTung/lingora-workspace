# PHASE 0 — FINAL REQUIREMENTS BASELINE AUDIT

> **Mã tài liệu:** `docs/phase-0-final-requirements-baseline-audit.md`
> **Loại:** REQUIREMENTS AUDIT (độc lập, documentation-only). Không phải System Design; không ERD/DFD/UML/UI/API/M2.
> **Ngày audit:** 2026-09-14.
> **Câu hỏi duy nhất:** khảo sát + stakeholder/actor + FR/NFR + business rules + UC + flows + traceability
> đã đủ hoàn chỉnh và nhất quán để đóng REQUIREMENTS BASELINE chưa?
> **Vai trò:** đánh giá `Requirements Baseline Readiness` của đồ án thiết kế hệ thống.
> Tài liệu `Product Owner Approval` chỉ được xem là artifact/decision record — không dùng chữ ký (kể cả
> chữ ký đã có cho Mapping A) như evidence thay cho kiểm chứng độc lập. Mọi kết luận dưới đây đều từ
> đối chiếu trực tiếp, có file:dòng.
> **Ranh giới:** không code/schema/migration/DB/runtime/feature mới; không đổi D1–D9, curriculum, Mapping A;
> không biến assumption thành requirement. Chỉ sửa wording/ID, gắn historical, tạo audit report.

---

## 1. Audit Scope

Đọc trực tiếp: `docs/00–09` (trọng tâm 02/05/06/07/08/09), toàn bộ `docs/phase-0-*` (12 files),
`docs/report/*.md` + evidence-register, HANDOFF, QUICK-REF, `plans/current-task.md`,
`lingora-admin/prisma/schema.prisma` + migration init (đối chiếu TARGET/APPLIED, read-only).
Search toàn repo: bands mapping, legacy roles/terms, SM-2/DKT/HLR, 80%, ghost fields, Exam/QuestionBank,
PlacementResult/ExerciseAttempt/Profile.level, publish authority, CEFR claims, Android.
Không chạy test suite, không render diagram/DOCX (soffice không có sẵn — đã biết từ HANDOFF).

## 2. Source-of-Truth Hierarchy

Áp dụng đúng thứ tự task §3: (1) D1–D9 → (2) Curriculum 08 → (3) Placement/Jump 09 (+ Mapping A approved) →
(4) 02 → (5) 05 → (6) 06 → (7) user-research audit → (8) stakeholder research → (9) architecture/data docs →
(10) historical/archive. Mọi mâu thuẫn source-thấp-vs-cao trong phiên này đều đã sửa/đánh dấu ở §27
(P1-FR-015 khôi phục; không còn mapping cạnh tranh ở current docs).

## 3. Document Inventory

| Tài liệu | Phân loại | Ghi chú |
|---|---|---|
| Decision sheet D1–D9 (`phase-0-final-product-owner-decision-sheet.md`) | CURRENT / CANONICAL | Immutable policy |
| `docs/08`, `docs/09` (+ Mapping A approved 09 §2/§9) | CURRENT / CANONICAL | Curriculum + assessment spec |
| `docs/02` (MVP + P1-FR/NFR + ML-GEC) | CURRENT / CANONICAL | Historical §§2.1–2.4 đã gắn SUPERSEDED nội bộ |
| `docs/05` (14+1 UC catalog + FR trace) | CURRENT / CANONICAL | UC-15 tách optional |
| `docs/06` (actor catalog, 15 UC specs, 15 BF) | CURRENT / CANONICAL | §6 IN_DATABASE = target-file scope (xem §25) |
| `docs/01`, `docs/03`, `docs/04`, `docs/07` | SUPPORTING | Historical blocks đã nhãn; 07 ERD = applied snapshot + §5 evolution |
| `phase-0-synthetic-stakeholder-research.md` | SUPPORTING | Banner synthetic đầy đủ |
| `phase-0-survey-requirements.md` | DRAFT | Baseline DRAFT 2026-09-07; term drift "Reviewer" (P3) |
| `phase-0-mock-survey-report.md` | SUPPORTING (design artifact) | Banner giả lập; mẫu mock N=120 không phải dữ liệu |
| `phase-0-roles-and-mvp-final.md`, `role-content-workflow-review.md`, `requirements-gap-audit.md`, `final-master-consolidation.md` | SUPPORTING | Đã reconcile ACT-01..07 |
| `phase-0-product-owner-decision-sheet.md` (bản cũ: 80/85%, CAT, recovery options) | HISTORICAL | Đề xuất cũ, đã bị final sheet thay thế |
| `docs/report/*.md` (4 files legacy 10-UC) | HISTORICAL (đã gắn banner ACT-07) | Chỉ tham khảo; báo cáo dùng catalog 14+1 |
| `docs/00-master-plan.md` (roadmap tuần ML cũ) | HISTORICAL (phần roadmap) + CURRENT (G-principles) | Cần nhãn rõ hơn (P3) |
| Approval packet | SUPPORTING (artifact/decision record) | Mapping A + sign-off template trống |
| `plans/current-task.md` | DRAFT (`READY FOR REQUIREMENTS REVIEW`, chưa APPROVED) | Không chặn baseline kỹ thuật |

Không tài liệu historical nào còn mạo danh current sau audit này.

## 4. Executive Verdict

**B — READY WITH MINOR CLEANUP (P2/P3 only, không ảnh hưởng semantics).**
Không còn P0/P1 contradiction. Mapping A nhất quán toàn current docs; FR testable đầy đủ
(sau khôi phục P1-FR-015); actor/UC/BF/traceability/MVP boundary ổn định; evidence integrity đạt
(user-research audit verdict B, 7 findings đã sửa). Công việc còn lại là hygiene + M-design details
(question bank thật, chia câu jump lẻ, migration plan) — đúng vị trí sau-baseline, không phải missing requirement.

## 5. Stakeholder & User Research Audit

- **Real survey N=15:** giữ REAL/EXPLORATORY/SMALL-SAMPLE; numerators/denominators đầy đủ (15/15, 14/15,
  13/15, 12/15 ×2, 11/15, 10/15; TB 4,13/5); limitations ghi rõ (không đại diện thị trường; success metrics
  đo lại bằng pilot). Không suy rộng. PASS.
- **Secondary (đã xác minh tồn tại, §4 user-research audit):** S1 Hwang et al. 2024 SSLA N=3.670
  (attrition ~43%/3 tháng); S2 Pikhart et al. 2024 Frontiers (satisfaction + connectivity/content-variety);
  S3 Tran & Nguyen 2026 (50 HS VN, self-report only, tier thấp đã ghi rõ). Đủ source/year/sample/finding/
  relevance/limitation. PASS.
- **Synthetic (20 persona 5 nhóm):** banner + purpose requirement-discovery đầy đủ; không % thực nghiệm;
  không trộn N=15; không claim statistically. Không gọi là empirical interview. PASS.

## 6. Lecturer Feedback Traceability

| Lecturer feedback | Requirement/Analysis section | Evidence | Status |
|---|---|---|---|
| F1 User groups | 6 canonical actors (06 §2; decision sheet §V) | Role baseline + permission matrix | RESOLVED |
| F2 Function mapping | MVP-01..19 owners + UC-01..15 (05; packet §11-matrix) | Traceability matrix | RESOLVED |
| F3 Content workflow Planning→…→Publish | BF-02..BF-07; D1/D2/D3; ACT-01 publish fix | 06 §5 + 05 UC-08/09/10 | RESOLVED |
| F4 Learning process rõ | BF-08..BF-13; 08 progression; 09 blueprint/mapping/jump | 08/09 + P1-FR-003..006/011/016 | RESOLVED (spec; item bank thật là M-task đã ghi OPEN) |

## 7. Actor Audit

6 canonical actors có definition/goal/responsibility/permission/owned-data/UC đầy đủ (06 §2;
chi tiết trong audit trước + user-research audit §6). Legacy scan (02/05/06/07/08/09):
`Teacher` = 0 current-hit (chỉ "Teacher forcing" trong historical ML block 02:141 và vocab example 08:74 —
FALSE POSITIVE); Auditor/System/Exam Manager/Question Bank Manager = 0 hit. PASS.

## 8. Role → Function Audit

| Actor | Goal | Functions | Permissions | UC | Requirements |
|---|---|---|---|---|---|
| Learner | Học + tiến bộ | Onboarding, placement, lessons, SRS, streak, reports, GEC | R published; RW own data | UC-01..07 | P1-FR-001..007/010/011/014/015/016 |
| Lesson Creator | Soạn theo assignment | Draft/preview/submit, media | C/U assigned drafts; DRAFT→IN_REVIEW | UC-08 | P1-FR-008/009; MVP-05/06/12 |
| Moderator | Giữ chuẩn | Review/CHANGES_REQUESTED/APPROVED; cấm self-approve | R IN_REVIEW; →APPROVED | UC-09 | MVP-07/13 |
| Org Manager | Khung + publish + cohort | Planning, assignment, PUBLISHED, cohort | Course/Unit C/U; APPROVED→PUBLISHED | UC-10/15 | MVP-04/13/17 |
| Operations Staff | Hỗ trợ đúng thẩm quyền | Ticket triage/escalate; cấm sửa học liệu | R/U ticket; minimal lookup | UC-14 | MVP-16 |
| Administrator | An toàn + RBAC + audit | Accounts/roles, reports, audit, emergency unpublish | M users/roles/audit | UC-01/11/12/13 | MVP-01/14/15/19 |

Không actor-without-function, function-without-actor, permission-without-justification, hay
actor/permission contradiction (D2: Creator=author, Moderator=review/approve, Manager=publish,
Administrator=audit/security — verified 05 UC-09/UC-10 rows + 06:737). PASS.

## 9. User Needs Audit

Mỗi nhóm có Need/Pain/Context/Evidence/Implication/Derived requirement (§8 user-research audit;
chain §14). Phân loại Observed (N=15 counts) / Research-backed (S1–S3) / Synthetic (personas) /
Assumption (đã gắn nhãn) / Design decision (D1–D9). Không requirement vô căn cứ. PASS.

## 10. Functional Requirements Audit

02 có P1-FR-001..016 (015 đã khôi phục trong phiên) + P1-FR-017 (P2) + P1-NFR-001..004 + ML-GEC-*
(locked TARGET). Mỗi FR trả lời WHO/WHAT/CONDITION/RESULT (acceptance + evidence cột riêng).
Quét: duplicate = 0 (P1-FR-012/013 là extension chi tiết của 003, có viện dẫn chéo — không duplicate);
orphan = 0 (017 đã demote + ghi Deferred); vague = 0 (không còn "system manages X" ở canonical);
unsupported = 0; contradictory = 0; hidden assumptions: scoring 1đ/câu, retake unlimited, diagnostic 40 câu —
đều đã gắn `[ASSUMPTION]` trong 09 (minh bạch, không hidden). PASS (sau fix P1-FR-015).

## 11. Non-Functional Requirements Audit

Security/RBAC/privacy/auditability/usability/performance/reliability/maintainability/availability/
error-handling phân loại MEASURED (RLS/JWT tests, failure-mode E2E, UI states) / RESEARCH-BACKED (S1–S3
attrition/satisfaction) / TARGET (6-role UI, AuditLog UI, WCAG mục tiêu, perf numbers) / ASSUMPTION
(privacy-minimization không audit độc lập) / UNKNOWN (maintainability — ghi rõ) / FUTURE (push 6a/6b,
CAT). Không target nào mạo danh measured; không benchmark bịa. PASS.

## 12. Business Rules Audit

D1 Manager-driven (BF-02..04) · D2 SoD (UC-09 APPROVED / UC-10 Manager publish; 06:737 cấm self-approve) ·
D3 Clone-to-draft (BF-06/07) · D4 Unified Exercise (không Exam/QuestionBank entity — 0 hit trong canonical) ·
D5 Jump (1→previous-U 20câu / 2–3→cumulative 25–30 / >3→comprehensive 40câu; ≥95% policy; 24h cooldown — 09 §3) ·
D6 Placement (~30/Skip→U1/Retake/Starting Unit/no-CEFR — 02:259, 06:218, 09 §1.3) · **Mapping A approved**
(02:259, 05:14/75, 06:750, 09 §2/§9, packet §2 — đồng nhất) · D7 Retry (10%, `max(1,⌊N·0.10⌋)`, 70% credit,
completion≠threshold; 0 hit `score>=80%` ở current) · D8 Policy B `[1,3,7,14,30]`, deterministic, 0 entity mới ·
D9 Streak (same-day unchanged; after-yesterday +1; miss→reset-to-1; recovery deferred). 0 contradictory rule. PASS.

## 13. Curriculum Consistency

08 (6U/24L/objectives/8–10 từ/lesson/grammar/prereq/exercise-mix/assessment-scope/progression tuyến tính)
nhất quán với: learning requirements (P1-FR-002/003/004), placement blueprint blocks B1–B6 (09 §1.1),
jump scopes (§3), SRS pool ~170–190 + entry rule (§5). Không mismatch file/section nào. PASS.

## 14. Placement Audit

Current docs chỉ chứa Mapping A (0–7:U1, 8–12:U2, 13–17:U3, 18–22:U4, 23–26:U5, 27–30:U6);
grep bands cạnh tranh (8–13→/14–19→/20–24→/25–28→/29–30→) = 0 hit (các hit "8-13" chỉ là ngày 2026-08-13 —
false positive đã loại). ~30/Skip/Retake/Starting Unit/no-CEFR/score-mapping verified
(02:259, 05:14/75, 06:218 + BF-08, 09 §§1–2). Historical file không chứa mapping cũ (mapping cũ chỉ tồn tại
trong reconciliation-log description đã resolved — đúng vị trí log). PASS.

## 15. Jump Audit

Requirements (D5) = UC-04/BF-11 = BR (09 §3) = curriculum (08 §5): 20 / 25–30 / 40 scopesMapping đồng nhất;
không tài liệu nào dùng scope số khác. PASS.

## 16. Retry / SRS / Streak Audit

Retry: first-pass→wrong-to-end→one-retry→allowance→70%→completion tách score; 0 current `score>=80%`. PASS.
SRS: 0 SM-2 claim ở current (lecturer:55 đã sửa Policy B); 0 ML/DKT/HLR claim ngoài historical blocks đã nhãn
(02 §§2.1–2.4 SUPERSEDED); 0 unapproved knowledge-state entities (09:132 cấm tường minh). PASS.
Streak: timezone + once-per-day + miss→1 + recovery deferred (P1-FR-011, 06 BF-13, D9). PASS.

## 17. Content Workflow Audit

Lifecycle 6-state đầy đủ (schema target enum + 06 BF-05/06/07 + UC-08/09/10). Actor transitions:
Creator DRAFT→IN_REVIEW (assigned only); Moderator →CHANGES_REQUESTED/APPROVED (06:737 cấm self-approve);
Manager APPROVED→PUBLISHED (05 UC-10; ACT-01 đã sửa roles-and-mvp); revision = clone v2 (D3).
Ghost fields = 0 hit (assignedToId/approvedBy/UNPUBLISHED/isAssessmentMode đã khử). PASS.

## 18. Use Case Audit

14 Core UC-01..14 (mỗi UC: ID/name/actor/goal/trigger/pre/main+alt+exception/post/FR/BR/data — 06 §4.2)
+ UC-15 tách `[OPTIONAL B2B / FUTURE]` (05:52, 06:169/375). Mọi FR quan trọng → UC (05); mọi canonical UC →
requirement; 0 orphan/duplicated; 0 future-UC trong MVP. PASS.

## 19. Business Flow Audit

15 flows BF-01..BF-15 bao phủ đủ 16 flow families task yêu cầu (Approval nằm trong BF-05;
Revision = BF-06) — mỗi flow có actor/trigger/input/steps/decision/output/state-change/exception (06 §5).
PASS.

## 20. Traceability Audit

Chain Evidence→Need→BR→FR→UC→BF→AC đầy đủ (§14 user-research audit + 05 matrix). Không orphan evidence/
need/FR/UC/BR; không AC-without-requirement (mọi AC gắn FR row). Dual ID schemes (P1-FR vs FR-/BR-*)
là debt P2 đã biết — báo cáo chỉ dùng P1-FR + UC nên không ảnh hưởng baseline. PASS.

## 21. ID Consistency Audit

P1-FR-* (01..016 + 017-P2; 015 đã khôi phục), P1-NFR-*, ML-GEC-*, UC-*, BF-* duy nhất và có mapping 05.
FR-*/BR-* (role-review/synthetic) là candidate IDs có giải thích (alias, không thay P1-FR). NFR-* cũ
(NFR-SEC-01…) chỉ còn trong 06/synthetic, không trùng P1-NFR. PASS (với debt P2 đã ghi nhận).

## 22. MVP Boundary Audit

Mỗi feature thuộc đúng 1 nhóm (packet Decision 4): MVP = 14 UC core; OPTIONAL = UC-15/cohort;
FUTURE = Exam/QuestionBank/DOCX/Formula/exam-security/badges(P2)/CAT; DEFERRED = streak-recovery/push-6a-6b/
ML-SRS; HISTORICAL = 3-faculty/10-UC-reports/00-roadmap-cũ. Cohort/SupportTicket/Badges/Reminder/CEFR/DKT/HLR/
MultiWOZ/Android: không mục nào vô tình thành MVP current (SupportTicket UC-14 DESIGN+GAP đúng quy trình;
reminder chỉ 6d in-app). PASS.

## 23. Legacy Contamination Scan

| Term | Kết quả | Phân loại |
|---|---|---|
| Teacher/Auditor/System/Exam-Manager/QB-Manager | 0 current-hit | PASS (2 false positives: "Teacher forcing" historical ML, vocab example) |
| CEFR (output claim) | 0 current-hit (chỉ "no CEFR" disclaimers + nhãn phân cấp nội bộ) | PASS |
| Exam entity / QuestionBank | 0 hit canonical | PASS |
| SM-2 / DKT / HLR / MultiWOZ (current) | 0 hit ngoài historical blocks | PASS |
| 80% completion | 0 hit | PASS |
| Moderator publish / Creator approve-publish | 0 hit (05 MVP-13 joint-row là review+publish coverage, UC-09/10 actors đúng) | PASS |
| assignedToId/approvedBy/UNPUBLISHED/isAssessmentMode | 0 hit | PASS |
| PlacementResult/ExerciseAttempt/Profile.level | 0 hit | PASS |
| Cohort (MVP claim) | 0 hit (mọi nơi OPTIONAL/FUTURE) | PASS |
| Android learner | 0 hit current | PASS |

## 24. Report Readiness

Sinh viên có thể trình bày nhất quán khảo sát (N=15 + S1–S3 + synthetic có nhãn) → nhu cầu (§8/§14) →
actor (6) → requirement (P1-FR/NFR) → BR (D1–D9 + Mapping A) → UC (14+1) → flow (BF-01..15):
survey methodology ✓, findings ✓ (tử/mẫu), limitations ✓, stakeholder table ✓, actor table ✓,
requirement list ✓, business rules ✓, UC ✓, flows ✓, traceability ✓. Không yêu cầu statistical
significance (N=15 exploratory + secondary hỗ trợ — đã khai báo đúng). READY.

## 25. Baseline Gate Results

| Gate | Verdict |
|---|---|
| R-B1 Actor stable | PASS |
| R-B2 Role/function stable | PASS |
| R-B3 Evidence integrity | PASS |
| R-B4 FR complete + testable | PASS (sau khôi phục P1-FR-015) |
| R-B5 NFR specified (đúng nhãn) | PASS |
| R-B6 BR consistent | PASS |
| R-B7 Curriculum resolved | PASS |
| R-B8 Mapping A consistent | PASS |
| R-B9 Jump/Retry/SRS/Streak consistent | PASS |
| R-B10 UC complete | PASS |
| R-B11 BF complete | PASS |
| R-B12 Traceability complete | PASS |
| R-B13 MVP boundary explicit | PASS |
| R-B14 No P0/P1 contradiction | PASS |
| R-B15 Legacy controlled | PASS |

15/15 PASS.

## 26. Remaining Issues

- P0: 0. P1: 0.
- P2 (4): (1) Dual ID schemes P1-FR vs FR-/BR-* (alias debt); (2) 06 §6 `IN_DATABASE` thiếu nhãn
  TARGET-file-vs-APPLIED-migration (Unit row trung thực LOGICAL_HIERARCHY; các row khác đọc theo target file);
  (3) 07 ERD snapshot = applied-state trong khi target đã khác (cần nhãn 2 tầng); (4) M-design details mở
  đúng vị trí (question bank thật, chia câu jump lẻ, assessment-mode representation, migration plan).
- P3 (3): "Reviewer" vs "Moderator" (survey-requirements DRAFT §6); 00 roadmap ML cũ cần nhãn SUPERSEDED rõ hơn;
  transcript rời P1–P6 chưa filed (trích mức summarized — đã khai báo).

## 27. Required Corrections (đã áp dụng trong phiên)

| File | Old wording | New wording | Reason | Evidence/source |
|---|---|---|---|---|
| `docs/02-requirements.md` (giữa P1-FR-014/016) | (thiếu row P1-FR-015) | Thêm row P1-FR-015 In-App Reminder (client-local, window, no entity) | Orphan reference ở 05:74; requirement đã approved (ADR-008 6d), chỉ thiếu definition — không phải requirement mới | 05:74 + ADR-008 + UC-02 |

Không đụng: schema/migration/DB/runtime/code/API/UI, D1–D9, curriculum, Mapping A, assumptions→requirements.

## 28. Final Requirements Baseline Recommendation

Baseline đủ ổn định để đóng: 15/15 gates PASS, 0 P0/P1, Mapping A nhất quán, evidence integrity đạt,
report-readiness READY. Bước tiếp theo là System Design (ERD/DFD/UML từ baseline này), sau đó M2.
Các P2/P3 §26 là hygiene/design-detail, xử lý song song mà không mở lại baseline.
Không dùng chữ ký PO (kể cả Mapping A approval record) thay cho kiểm chứng — kiểm chứng đã thực hiện độc lập ở trên.

# PHASE 0 — PRODUCT OWNER APPROVAL PACKET (PRE-FREEZE GATE)

> **Mã tài liệu:** `docs/phase-0-product-owner-approval-packet.md`
> **Loại:** APPROVAL PACKET — audit + chuẩn bị quyết định, KHÔNG phải quyết định.
> **Trạng thái:** `AWAITING PRODUCT OWNER SIGN-OFF` (không phải `Requirements Frozen`).
> **Ranh giới gate này:** KHÔNG code, KHÔNG schema, KHÔNG migration, KHÔNG đổi D1–D9,
> KHÔNG approve curriculum thay PO, KHÔNG sửa curriculum/mapping (xem Change Control §10).
> **Nguồn đối chiếu:** `docs/08`, `docs/09`, `docs/02` (P1-FR-016/017), `docs/05` (14+1 catalog),
> `docs/06` (UC-03/04, BF, ghost-field fixes), `docs/07` (dictionary snapshot),
> `docs/phase-0-final-reconciliation-log.md` (ACT-01..07 RESOLVED),
> `docs/phase-0-final-requirements-audit.md` (B1/B2/B3), Product Policy D1–D9.

---

## 0. Pre-freeze Checklist Results

### 0.1 Curriculum approval checklist (`docs/08`)

| Item | Evidence | Verdict |
|---|---|---|
| 6 Units | U1–U6, 08 §2 | PASS |
| 24 Lessons | 4/Unit, 08 §3 | PASS |
| Learning objectives | Mỗi lesson 1 objective + Unit goal, 08 §§2–3 | PASS |
| Vocabulary | Theme + count/lesson (8–10), coverage ~200 từ, 08 §§3–4 | PASS |
| Grammar / language functions | Mỗi lesson 1 điểm mới, spiral nhẹ, 08 §§2–3 | PASS |
| Prerequisite | Tuyến tính U1→…→U6 + per-lesson prereq + L4 gate, 08 §5 | PASS |
| Exercise coverage | Mix chuẩn 5/lesson, GRAMMAR/LISTENING rải đều, 08 §3 | PASS |
| Assessment coverage | Per-Unit scope + L4 review gate, 08 §§2–3 | PASS |
| Progression | Graph tuyến tính, không branch; Placement/Jump chỉ chọn điểm vào, 08 §5 | PASS |
| Mỗi Unit trả lời "học gì / trước-sau gì / đánh giá thế nào" | Có, 08 §2 hàng Assessment Scope + §3 cột Assessment contribution | PASS |
| Con số `[ASSUMPTION]` (5 ex/lesson, 8–10 từ, ±20% duyệt lệch) | Đã gắn nhãn, chờ PO chốt = chính nội dung approval này | MINOR (by design — PO resolves by signing) |

**Không phát hiện BLOCKING ở curriculum.**

### 0.2 Placement approval checklist (`docs/09` + reconciled `docs/02/05/06`)

| Item | Evidence | Verdict |
|---|---|---|
| ~30 questions | Blueprint 30 câu, blocks B1–B6, 09 §1.1 | PASS |
| Skip → U1 | 09 §1.3; P1-FR-016 (`docs/02:259`) | PASS |
| Retake (from Profile) | 09 §1.3; P1-FR-016 | PASS |
| Output = Starting Unit | 09 §1.3; 06:218; P1-FR-016 (đã sửa ACT-02) | PASS |
| No CEFR claim | "does not claim international CEFR certification" (02:259); "Không claim chuẩn CEFR" (06:218); 09 §1.3 | PASS |
| **Placement Mapping Decision** | PO chính thức phê duyệt **Mapping A (09 §2)**: 0–7:U1, 8–12:U2, 13–17:U3, 18–22:U4, 23–26:U5, 27–30:U6. Mapping cạnh tranh đã loại bỏ khỏi docs canonical. | **PASS — RESOLVED** |

### 0.3 Jump approval (`docs/09 §3` vs D5)

| Rule | Curriculum mapping | Verdict |
|---|---|---|
| Jump 1 → previous Unit assessment | Bảng vào Unit k = review Unit k−1, 20 câu | PASS |
| Jump 2–3 → cumulative | Scope = đúng Units bị bỏ qua, 25–30 câu | PASS |
| Jump >3 → comprehensive diagnostic | "Comprehensive" = stratified U1..U(k−1), 40 câu, vd U1→U6 | PASS |
| Pass ≥95% (Product Policy, không claim science) | 09 §3 quy tắc chung | PASS |
| Fail → 24h cooldown | 09 §3 quy tắc chung | PASS |
| Quy mô đề (20/25–30/40) là `[ASSUMPTION]` | Chờ PO chốt = nội dung approval | MINOR (by design) |

### 0.4 Data / runtime reality check (TARGET vs APPLIED vs RUNTIME)

| Tầng | Thực trạng verified | Wording bắt buộc |
|---|---|---|
| TARGET DESIGN | `schema.prisma`: enum `Role` 6 giá trị, `ContentStatus` 6-state, `Unit`/`UnitTranslation`, `AuditLog`; không `Cohort`/`SupportTicket` | "Target design supports Unit hierarchy, 6-state workflow, 6 roles." |
| CURRENT APPLIED DATABASE | `migrations/202608140001_init`: `Role` = (`LEARNER`,`ADMIN`), **không** có bảng `units`/`audit_logs`/`cohorts`/`support_tickets` | "Current applied implementation currently supports 2-role baseline without Unit tables." |
| CURRENT RUNTIME | Chạy trên applied schema (M1.x evidence); Unit/cohort/support flows chưa active | "Migration required before runtime activation of Unit hierarchy, 6-role RBAC, AuditLog, cohort/support modules." |

Report/audit sau này KHÔNG được viết "system supports Unit hierarchy" mà thiếu 3-tầng phân biệt trên.
Nợ wording còn lại (MINOR, sửa trước freeze, không chặn ký duyệt): `docs/07` ERD snapshot mô tả
applied-state (`role LEARNER|ADMIN`, 07:64,220) trong khi target đã khác — cần nhãn rõ TARGET-vs-APPLIED;
một số ô `IN_DATABASE` trong `docs/06 §6` cần rà lại theo cùng chuẩn.

### 0.5 Requirements dependency check

| Requirement | Curriculum đã đủ để freeze? |
|---|---|
| Placement (MVP-03/UC-03/P1-FR-016) | YES — blueprint + mapping rule (chờ PO chọn bands) |
| Jump (MVP-04/UC-04) | YES — scopes + sizes proposed |
| Retry (D7/UC-05) | YES — 5 ex/lesson → allowance luôn = 1, tính được |
| SRS vocabulary scope (UC-06/P1-FR-005/006) | YES — pool ~170–190 thẻ + entry rule, không entity mới |
| Learning progression (UC-04) | YES — graph tuyến tính + gates |
| Lesson hierarchy (UC-08) | YES — 6U/24L + assignment-ready ranges |
| Assessment coverage (UC-05/09) | YES — per-Unit weights (tinh chỉnh ở M-design được) |

Không requirement nào còn phụ thuộc PO decision chưa được phát biểu — mọi decision cần thiết đã nằm
trong packet này dưới dạng sign-off items (§§1–5). PO decision duy nhất còn OPEN sau freeze đề xuất:
TTS tạm cho vocab audio (non-blocking, 09 §9).

---

## 1. Decision 1 — English A1 Curriculum (PROPOSED)

```text
6 Units (U1 Greetings → U6 Plans/Future), tuyến tính, không branch
24 Lessons (4/Unit, 5–10 phút, 5 exercises/lesson)
~200 vocabulary (~170–190 SRS-eligible items)
Per-lesson objective + vocab + grammar + prereq + assessment contribution
L4 mỗi Unit = review gate
Word examples illustrative (non-normative); Creator linh hoạt trong assignment (D1)
```

## 2. Decision 2 — Placement Mapping (APPROVED BY PRODUCT OWNER: MAPPING A)

```text
Score 0–30 (1 điểm/câu, không trừ điểm, one-shot, không áp D7 retry):
0–7   → U1 (Greetings & Introductions)
8–12  → U2 (People & Daily Life)
13–17 → U3 (Food, Shopping & Money)
18–22 → U4 (Places, Directions & Travel)
23–26 → U5 (Time, Routines & Past Events)
27–30 → U6 (Plans, Future & Everyday Talk)
Skip (trước nộp) → U1, không lưu score · Retake từ Profile, xác nhận mới áp dụng
```

Tính chất: `CURRICULUM-BASED PRODUCT PLACEMENT RULE` — quy tắc sản phẩm nội bộ suy từ block
blueprint (mỗi band ≈ 1 Unit block), KHÔNG phải CEFR calibration, KHÔNG phải scientific mastery
validation.

> **XÁC NHẬN PHÊ DUYỆT CỦA PRODUCT OWNER:**  
> Product Owner đã chính thức chọn **Phương án A (Mapping A)** theo `docs/09 §2`.  
> Toàn bộ các tài liệu canonical (`docs/09`, `docs/02`, `docs/05`, `docs/06`) đã được đồng bộ chuẩn hóa theo Mapping A. Phương án cạnh tranh cũ (8–13, 14–19...) đã bị loại bỏ hoàn toàn khỏi các tài liệu hiện hành.

## 3. Decision 3 — Jump Rules (PROPOSED)

```text
Jump 1 (vào Unit k): assessment = Unit k−1, 20 câu (vocab 8 · grammar 10 · listening 2)
Jump 2–3: cumulative = đúng các Unit bị bỏ qua, 25–30 câu chia theo Unit
Jump >3: comprehensive diagnostic = stratified U1..U(k−1), 40 câu (vd U1→U6: 8×5 blocks)
Pass ≥95% (PRODUCT POLICY, không claim scientific mastery) · Fail → cooldown 24h
Không cấm Jump >3 · Không giới hạn số lần thử lại sau cooldown
Assessment = conceptual mode của Exercise (D4); physical representation là M-design decision
```

Nguồn: `docs/09-placement-and-jump-specification.md` §3.

## 4. Decision 4 — MVP Scope (xác nhận đóng băng phạm vi)

```text
MVP (14 Core UC UC-01..UC-14; 19 functions MVP-01..19 trừ badges):
  Auth/session · Onboarding/goals · Placement/Starting Unit · Learning path + Jump ·
  Lesson 5–10' + Controlled Retry · 5 exercise types · Instant feedback · Progress/streak/goal ·
  Personal reports · Draft/preview/submit · Moderation/APPROVED · Publish (Manager) ·
  Accounts/RBAC · System reports · Audit logs · Support tickets (Ops flow; schema ở M-milestone)
FUTURE / OPTIONAL (không chặn freeze, không in MVP acceptance):
  UC-15 Cohort/B2B module · Exam/QuestionBank entities · DOCX import · LaTeX formula ·
  Advanced exam security/proctoring · Achievements/badges (P1-FR-017 = Nice/P2, ACT-03)
DEFERRED (sau pilot): Streak Freeze/Recovery · Push 6a/6b (chỉ in-app 6d) · CAT adaptive testing ·
  DKT/HLR ML-SRS (SUPERSEDED bởi D8 deterministic Policy B; historical refs giữ nhãn)
HISTORICAL (tham khảo, không hiệu lực): 3-faculty breakdown, legacy 10-UC reports (đã gắn nhãn ACT-07)
```

## 5. Decision 5 — Remaining Open Decisions (thực sự còn OPEN)

| # | Open item | Status | Blocking freeze? |
|---|---|---|:---:|
| OD-1 | Chọn placement bands (§2 vs `docs/09 §2`) | **RESOLVED & LOCKED** (PO đã phê duyệt Mapping A) | NO |
| OD-2 | TTS tạm cho vocab audio (09 §9) | **OPEN** (Non-blocking, M2/M3 implementation) | NO |
| OD-3 | Post-sign-off doc sync & reality check | **COMPLETED** (Đã đồng bộ Mapping A & OD-3 terminology trên toàn bộ docs) | NO |

---

## 6. Product Owner Sign-off Template (KHÔNG điền thay PO)

```text
PRODUCT OWNER DECISION

[ ] APPROVE
[ ] APPROVE WITH CONDITIONS
[ ] REJECT / REVISION REQUIRED

Approved Curriculum (Decision 1):
____________________

Approved Placement Mapping (Decision 2 — ghi rõ bands được chọn, §2 hoặc docs/09 §2):
____________________

Approved Jump Rules (Decision 3):
____________________

MVP Scope confirmed (Decision 4):
____________________

Conditions (vd: post-sign-off doc sync OD-3; Assessment weights tinh chỉnh ở M-design):
____________________

Date:
____________________

Signature:
____________________
```

---

## 7. Final Freeze Readiness

```text
Curriculum technically ready for approval? YES
  (6U/24L/objectives/vocab/grammar/prereq/exercise/assessment/progression đầy đủ; chỉ còn [ASSUMPTION] chờ PO chốt bằng chính chữ ký)

Placement technically ready for approval? YES (CONDITIONAL: PO chọn bands OD-1 tại ký)
  (~30/Skip/Retake/Starting Unit/No-CEFR verified; mapping rule phát biểu đầy đủ + limitation công khai)

Jump technically ready for approval? YES
  (1/2–3/>3 map vào curriculum + 95% + 24h verified; sizes là [ASSUMPTION] chờ PO chốt)

Any unresolved P0? NO
  (B1 resolved ở spec 08/09; B2/B3 resolved bởi reconciliation ACT-01..07 đã verify §0.2–0.4)

Any unresolved P1 affecting requirements? NO
  (badges→P2, UC-15→optional, ghost fields, CEFR wording: verified RESOLVED; còn nợ wording 07/06-IN_DATABASE = MINOR doc-debt, sửa ở OD-3 trước freeze)

Any unresolved product decision (ngoài sign-off items)? NO
  (mọi decision cần thiết đã phát biểu trong §§1–5; TTS OD-2 non-blocking)

Requirements Freeze technically possible after PO sign-off? YES
  (điều kiện: PO ký + hoàn thành OD-3 doc sync, sau đó mới được ghi Requirements Frozen)
```

```text
FINAL STATUS:
READY FOR REQUIREMENTS FREEZE (Placement Mapping A Approved by Product Owner)
```

(Đã sẵn sàng để đóng băng yêu cầu chính thức theo quyết định của Product Owner.)

---

## 8. Change Control (§10)

```text
Schema changed: NO
Migration created: NO
Code changed: NO
Product Policy changed: NO (D1–D9 immutable, chỉ viện dẫn)
Curriculum changed: NO (docs/08 untouched — discrepancy bands chỉ BÁO CÁO tại §2, không tự sửa)
Placement mapping changed: NO (docs/09 §2 untouched — chờ PO ruling)
```

Không phát hiện documentation contradiction nghiêm trọng mới ngoài discrepancy bands §2 (đã báo cáo,
không tự quyết). File duy nhất tạo trong gate này: `docs/phase-0-product-owner-approval-packet.md`.

## 9. Final Verdict (§11)

**A — READY FOR PRODUCT OWNER SIGN-OFF**

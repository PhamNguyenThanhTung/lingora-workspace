# PHASE 0 — FINAL AUDIT: KHẢO SÁT NGƯỜI DÙNG & PHÂN TÍCH YÊU CẦU (REPORT-READINESS)

> **Mã tài liệu:** `docs/phase-0-final-user-research-and-requirements-audit.md`
> **Loại:** DOCUMENTATION AUDIT (không code, không schema, không migration, không M2, không đổi D1–D9,
> không thêm feature, không bịa evidence).
> **Ngày audit:** 2026-09-14. **Trạng thái:** `AUDITED — VERDICT B (xem §18)`.
> **Câu hỏi điều khiển:** phần "Khảo sát + Phân tích người dùng + Requirements" đã đủ chặt chẽ để đưa
> vào báo cáo đồ án chưa?

---

## 1. Scope

Audit bao phủ 11 mảng (§2 task): hiện trạng, survey người dùng, stakeholder, actor, nhu cầu từng nhóm,
FR, NFR, business rules, UC, business flows, traceability — dưới chuẩn liêm chính học thuật §2
(6 evidence types; cấm respondent/số liệu giả, cấm trộn N=15 với synthetic, cấm dùng số liệu internet
như khảo sát nhóm). Nguồn đọc: file xlsx N=15, `phase-0-survey-requirements.md`,
`phase-0-mock-survey-report.md` (F1–F14 + mẫu mock), `phase-0-synthetic-stakeholder-research.md`,
`phase-0-roles-and-mvp-final.md`, `phase-0-role-content-workflow-review.md`,
`docs/02/05/06/07`, `docs/08/09`, `docs/report/*` (4 md + evidence-register), decision sheet D1–D9.

## 2. Evidence Classification

| Type | Định nghĩa | Nội dung trong repo |
|---|---|---|
| REAL PRIMARY DATA | Nhóm tự thu thập | Khảo sát N=15 (xlsx, 24 câu) + 6 phỏng vấn P1–P6 (chi tiết trong DOCX/Evidence-register; **không có transcript rời** — xem §16 G3) |
| REAL SECONDARY RESEARCH | Nguồn ngoài đã xác minh (§4) | S1 Hwang et al. 2024 (SSLA/Cambridge, N=3.670 + usage n=3.319); S2 Pikhart et al. 2024 (Frontiers Educ., EFL 3 nước); S3 Tran & Nguyen 2026 (IJSSHM R, 50 HS Việt Nam, Duolingo vocab) |
| SYNTHETIC / SIMULATED | Giả lập để phát hiện yêu cầu, không phải evidence thực nghiệm | 20 persona (MGR/CRE/MOD/OPS/ADM-SIM) + mock-survey design N=120 (design artifact, không phải dữ liệu) |
| PRODUCT DECISION | PO chốt (D1–D9, OD mappings) | Decision sheet; 08/09 PROPOSED (chờ ký) |
| ASSUMPTION | Giả định ghi nhãn `[ASSUMPTION]` | 5 ex/lesson, ~200 từ, bands rationale, scoring 1đ/câu… |
| OPEN QUESTION | Chưa quyết | TTS audio, bands OD-1, badge catalog, chia câu jump lẻ |

Quy tắc trích dẫn cho báo cáo: mọi % phải có tử/mẫu/quần thể/nguồn; synthetic không bao giờ mang %;
secondary chỉ hỗ trợ bối cảnh, không thay thế dữ liệu nhóm.

## 3. Real Learner Survey (N=15) — PASS, giữ nguyên nhãn REAL/EXPLORATORY/SMALL-SAMPLE

- **File:** `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` (15 phản hồi, 24 câu).
- **Mục tiêu/đối tượng/phương pháp:** định hướng nhu cầu người học tiếng Anh (tự chọn mẫu, convenience);
  câu hỏi bao phủ mục tiêu, ngôn ngữ/cấp độ, thời lượng, lý do bỏ app, dạng bài ưa thích, placement, chỉ số tiến bộ
  (`phase-0-survey-requirements.md` §§2–3).
- **Kết quả (tử/mẫu đầy đủ):** quên từ 15/15; đề xuất nội dung 14/15; bỏ học 13/15; SRS 4–5 sao 12/15
  (TB 4,13/5); ngữ pháp 10/15; mục tiêu công việc 12/15; điền từ 11/15.
- **Hạn chế (đã ghi trong docs, không suy rộng):** mẫu nhỏ, không đại diện thị trường; chỉ dùng để ưu tiên
  giả thuyết sản phẩm; success metrics chính thức phải đo lại bằng pilot (§7 doc survey, §9:146–158).
- **→ Requirement:** quên từ → SRS/UC-06; bỏ học → streak/UC-07; ngữ pháp → GEC/UC-06-viết; dạng bài → engine/UC-05;
  đề xuất nội dung → placement/UC-03 (chain đầy đủ ở §14).

## 4. Secondary Research (đã xác minh tồn tại — không bịa)

| Finding | Population | Year | Source | Evidence Type | Lingora Relevance | Limitation |
|---|---|---|---|---|---|---|
| Attrition MALL lớn (~43,16% dropout trong 3 tháng đầu); acceptance (UTAUT) → bền bỉ hơn | 3.670 adult MALL users (Mango) + usage n=3.319 | 2024 | Hwang, Coss, Loewen & Tagarelli, Stud. Second Lang. Acquis. (Cambridge), doi:10.1017/S0272263124000354 | REAL SECONDARY (peer-reviewed) | Ủng hộ streak/daily-goal/re-engagement (UC-07); cảnh báo attrition sớm | Non-university adults, chủ yếu L2 không phải tiếng Anh, dùng miễn phí qua thư viện — không phải learner Lingora |
| Hài lòng công cụ số (Duolingo/ChatGPT/Translate); khó khăn: connectivity, content variety | SV EFL Czech/Taiwan/Iraq (questionnaire) | 2024 | Pikhart, Klímová & Al-Obaydi, Front. Educ., doi:10.3389/feduc.2024.1412377 | REAL SECONDARY (peer-reviewed) | Ủng hộ vocab/exercise/GEC tức thì; yêu cầu offline-tolerant + đa dạng nội dung | Questionnaire cắt ngang, 3 nước cụ thể; không đo learning gain |
| Khó khăn lớn nhất: phát âm (M=4,90), thiếu động lực (M=4,84); Duolingo được cảm nhận hữu ích đúng chỗ khó | 50 HS lớp 8 Việt Nam (paper survey) | 2026 | Tran & Nguyen, IJSSHM R, doi:10.58806/ijsshmr.2026.v5i6n29 | REAL SECONDARY (tạp chí tier thấp — ghi rõ) | Contextual VN: audio vocab bắt buộc (P1-FR-013), streak/động lực, SRS retention | Self-report, không pre/post-test; chỉ cảm nhận (perceived usefulness), N=50 một trường |
| Ebbinghaus (1885, âm tiết vô nghĩa) | Lab memory | 1885 (kinh điển) | Lý thuyết lịch sử | REAL SECONDARY (theory, không phải user evidence) | Chỉ làm cảm hứng cho SRS; đã sửa wording lecturer-format:24 (xem §17) | Không đại diện học từ vựng có ngữ cảnh — cấm suy rộng |

Không dùng blog vô danh. Không copy dài nguồn — chỉ paraphrase + citation như trên.

## 5. Stakeholder Analysis (5 nhóm non-learner — không gọi là respondents thật)

Nguồn: synthetic 20 persona (requirement-discovery) + F11–F14 + domain assumptions. Mỗi role có đủ 12 trường
(chi tiết trong synthetic §§2–5; rút gọn bảng chuẩn §11):

| Role | Goal | Pain Points chính | Expected System Support | Derived Requirements | Evidence Type |
|---|---|---|---|---|---|
| Organizational Manager | Khung chương trình + publish đúng chuẩn | Creator chèn bài ngoài đề cương; không thấy tiến độ biên soạn | Course/Unit skeleton, Assignment, publish gate (APPROVED mới publish) | BR-CONTENT-ASSIGN/PUBLISH; UC-10/15; MVP-04/13/17 | SYNTHETIC + ASSUMPTION |
| Lesson Creator | Soạn bài 5–10' đúng assignment | Brief mơ hồ; JSONB dễ sai; không biết sửa gì khi bị trả | AssignmentBrief, WYSIWYG builder + validate, Preview, feedback theo exercise | BR-CREATOR-*; UC-08; MVP-05/06/12 | SYNTHETIC + ASSUMPTION |
| Moderator | Giữ chất lượng học thuật | Diff v1/v2 tốn công; rủi ro tự duyệt; từ chối cả bài vì lỗi nhỏ | Diff Viewer, Preview Player, hard constraint chống self-approve, Clone-to-draft | BR-MOD-*; UC-09; MVP-07/13 | SYNTHETIC + PRODUCT DECISION (D2/D3) |
| Operations Staff | Xử lý ticket nhanh, đúng thẩm quyền | Thiếu kênh ghi nhận; không được sửa bài; rủi ro lộ dữ liệu | SupportTicket + thu thập context tự động, escalation Mod/Admin, minimal lookup | BR-OPS-*; UC-14; MVP-16 | SYNTHETIC + ASSUMPTION |
| Administrator | An toàn + RBAC + audit | Không truy vết hành động đặc quyền; role tùy tiện | AuditLog bất biến, 6-enum RBAC UI, health dashboard | BR-ADM-*; UC-11/12/13; MVP-14/15/19 | SYNTHETIC + PRODUCT DECISION |

## 6. Actor Analysis — PASS (6 canonical; không Teacher/Auditor/System/Exam/QuestionBank Manager ở vị trí current)

6 actor chuẩn tắc đã khóa (decision sheet §V; 06 §2; packet Decision 4). Lệch duy nhất: `survey-requirements.md` §6
dùng tên **"Reviewer"** thay vì **"Moderator"** (MINOR term drift — sửa ở §17). Report legacy có "Teacher" đã gắn
banner HISTORICAL (ACT-07) — đạt.

## 7. Lecturer Feedback Traceability — PASS

- **Role identification:** ai quản lý (Org Manager) / tạo (Creator) / duyệt (Moderator) / vận hành (Ops) /
  quản trị (Admin) / học (Learner) — 06 §2 + RACI ma trận quyền (roles-and-mvp §3). Đạt.
- **Function mapping:** mỗi role có MVP functions + UC tương ứng (packet §11 matrix). Đạt.
- **Content workflow:** Planning→Assignment→Authoring→Review→Approval→Publish (BF-02..BF-07, D1/D2/D3);
  Creator bypass/self-approve/self-publish bị cấm tường minh; reconciliation ACT-01 đã sửa publish authority. Đạt.
- **Learning workflow:** Placement/Skip→Starting Unit→Lesson→Exercise→Retry→Progress→SRS
  (BF-08..BF-13, 08/09, D5–D8). Đạt ở spec; question bank thật là M-task (đã ghi OPEN, không giấu).

## 8. User Needs (mỗi need gắn evidence type — không nhảy thẳng sang feature)

| Need | Evidence | Type |
|---|---|---|
| Học bài ngắn vừa sức, biết học gì tiếp theo | N=15 (bỏ học 13/15; đề xuất ND 14/15) + S1 (attrition sớm) | REAL PRIMARY + SECONDARY |
| Không quên từ (ôn đúng hạn) | N=15 (15/15; 12/15 cần auto-SRS) + S3 (retention M=4,06) | REAL PRIMARY + SECONDARY |
| Sửa lỗi viết tức thì + giải thích | N=15 (10/15) + S2 (satisfaction instant feedback) | REAL PRIMARY + SECONDARY |
| Lộ trình từ điểm xuất phát đúng | N=15 (14/15) + interviews | REAL PRIMARY |
| Nội dung đúng chuẩn trước khi học (niềm tin) | Synthetic MOD/MGR personas + S2 (content variety) | SYNTHETIC + SECONDARY |
| Hỗ trợ khi gặp sự cố, không lộ dữ liệu | Synthetic OPS personas + privacy assumption | SYNTHETIC + ASSUMPTION |
| Quản trị an toàn, có audit | Synthetic ADM personas | SYNTHETIC + PRODUCT DECISION |

## 9. Functional Requirements Audit — PASS (sau ACT-02/03)

| ID | Actor | Trigger → Outcome (rút gọn) | Priority | Evidence | UC |
|---|---|---|---|---|---|
| P1-FR-001 Auth | Learner/Admin | Credentials → session httpOnly / lỗi rõ | Must | Observed (M1.6W tests) | UC-01 |
| P1-FR-002 Browse published | Learner | Mở /learn → cây published + audio | Must | Observed (seed/RLS) | UC-04 |
| P1-FR-003 Exercises 5 types | Learner | Nộp bài → đúng/sai + giải thích | Must | Target (engine M2) | UC-05 |
| P1-FR-004 Progress | Learner | Hoàn thành → UserProgress/COMPLETED + score | Must | Observed (DB) | UC-05/07 |
| P1-FR-005/006 SRS + record_review | Learner | Due card → RPC nguyên tử + log bất biến | Must | Observed (RPC 34/34) | UC-06 |
| P1-FR-007 GEC scenario | Learner | Câu EN → corrected_text (transient) | Must/TARGET | Target (contract locked) | UC-06-viết |
| P1-FR-008/009 Content + media/Admin | Creator/Mod/Manager/Admin | Draft→review→publish; upload có kiểm duyệt | Must | Partial (DB ready; UI M3) | UC-08/09/10 |
| P1-FR-010 Locale | Learner | vi/en, default/fallback vi | Must | Observed (M1.6W) | UC-01..07 |
| P1-FR-011 Streak/goal | Learner | Qualifying activity → +1/ngày, miss → 1 | Must | Observed (DB fields) | UC-07 |
| P1-FR-012/013 GRAMMAR/LISTENING | Learner | Payload hợp lệ → chấm + audio vocabId | Must | Target (M2) | UC-05 |
| P1-FR-014 dailyGoalMin | Learner | Đặt 5–120' → lưu Profile | Must | Observed (M1.3 path) | UC-02 |
| P1-FR-015 In-app reminder 6d | Learner | Mở app trong window, chưa học → banner | Must | Target (M2+) | UC-02 |
| P1-FR-016 Placement | Learner | ~30 câu/Skip/Retake → Starting Unit, no CEFR | Must | Target (08/09 + PO ký) | UC-03 |
| P1-FR-017 Badges | — | Demoted Nice/P2, orphan resolved (ACT-03) | P2 | Deferred | (none — đúng) |

Không orphan/vague/unsupported FR ở canonical hiện tại. Dual ID schemes (P1-FR vs FR-*/BR-*) là debt P2
đã biết — không ảnh hưởng báo cáo nếu báo cáo chỉ dùng P1-FR + UC.

## 10. Non-Functional Requirements Audit (không bịa benchmark)

| NFR | Nội dung | Phân loại |
|---|---|---|
| Security (httpOnly, JWT fail-closed, BFF proxy 8s) | Đã implement + test | Observed |
| RBAC 6 roles + RLS | Target file 6 roles; applied 2 roles; UI M3 | Target (ebel rõ TARGET/APPLIED) |
| Privacy/minimization (Ops/Manager aggregate-only) | Policy statements, chưa audit độc lập | Assumption → Target |
| Auditability (AuditLog bất biến) | Model ở target; UI M3 | Target |
| Reliability (học + SRS sống khi GEC chết) | Failure-mode E2E | Observed |
| Usability (responsive; WCAG 2.1 AA) | Chưa đo bằng công cụ | Target (cấm ghi "đạt WCAG" — chỉ ghi "mục tiêu WCAG 2.1 AA") |
| Maintainability | Chưa có evidence riêng | Unknown (ghi rõ, không bịa) |
| Performance (lesson <500ms; GEC p95 ≤2000ms) | Chưa benchmark log | Target (không ghi như số đo) |
| Error handling (loading/empty/error/success) | M1.6W tests | Observed |

## 11. Business Rules Audit — PASS (D1–D9 immutable + quy tắc派生)

D1 Manager-driven · D2 SoD (Mod APPROVED, Manager PUBLISHED) · D3 Clone-to-draft · D4 Unified Exercise ·
D5 Jump (1/cumulative/comprehensive; ≥95% policy-not-science; 24h cooldown) · D6 Placement (~30/Skip→U1/
Retake/Starting Unit/no CEFR; mapping bands chờ PO chọn OD-1) · D7 Retry (`max(1,⌊N·0.10⌋)`, 70% credit,
completion ≠ threshold) · D8 SRS Policy B `[1,3,7,14,30]`, no ML/entities mới · D9 streak local-tz, miss→1,
recovery deferred. Không rule nào mâu thuẫn; bands placement là PRODUCT RULE (không mạo danh science).

## 12. Use Case Audit — PASS (14 Core UC-01..14 + 1 Optional UC-15)

Mỗi UC có actor/goal/trigger/pre/main+alt+exception/post/BR/FR (06 §4.2). UC xuất phát từ requirement
(05 traceability; packet Decision 4). Không UC "cho đủ số lượng" (UC-15 đã tách optional đúng ACT-05).
Lưu ý cho báo cáo: tài liệu legacy 10-UC đã gắn banner HISTORICAL — báo cáo đồ án PHẢI dùng catalog 14+1.

## 13. Business Flow Audit — PASS (16 flows, đủ 7-tuple)

Auth · Planning (BF-02) · Assignment (BF-03) · Authoring (BF-04) · Review (BF-05) · Approval (BF-05) ·
Publishing (BF-07) · Revision v2 (BF-06) · Placement (BF-08) · Learning (BF-09) · Retry (BF-10) ·
Jump (BF-11) · SRS (BF-12) · Progress/Streak (BF-13) · GEC (BF-14) · Operations/Support (BF-15) —
mỗi flow có actor/input/action/decision/output/state-change/exception (06 §5). Thiếu duy nhất implementation
detail (question bank thật, chia câu jump lẻ) — đã ghi OPEN, đúng phạm vi báo cáo.

## 14. Survey → Requirement Traceability (Evidence→Need→Problem→Requirement→UC→AC)

| Evidence | Need | Requirement | Actor | UC | Priority |
|---|---|---|---|---|---|
| 15/15 quên từ (N=15) + S3 retention | Ôn đúng hạn | P1-FR-005/006 deterministic SRS + record_review | Learner | UC-06 | Must |
| 13/15 bỏ học + S1 attrition 43% | Duy trì thói quen | P1-FR-011 streak/goal + P1-FR-014/015 | Learner | UC-07/02 | Must |
| 10/15 cần sửa ngữ pháp + S2 | Feedback viết tức thì | P1-FR-007 GEC transient | Learner | UC-06 | Must |
| 14/15 muốn đề xuất ND | Điểm xuất phát đúng | P1-FR-016 placement→Starting Unit | Learner | UC-03 | Must |
| 11/15 dạng bài + S3 audio | Bài tập đa dạng + phát âm | P1-FR-003/012/013 | Learner | UC-05 | Must |
| Synthetic MOD/MGR + D2/D3 | Nội dung đáng tin | P1-FR-008 moderation/publish | Creator/Mod/Manager | UC-08/09/10 | Must |
| Synthetic OPS + privacy assumption | Hỗ trợ tối thiểu dữ liệu | UC-14 + RLS/minimal lookup | Ops | UC-14 | Must |
| Synthetic ADM + D-decisions | An toàn, truy vết | AuditLog + RBAC | Admin | UC-11/13 | Must |

Không requirement nào xuất hiện ngẫu nhiên — mọi Must đều có evidence (primary/secondary/synthetic có nhãn)
hoặc PRODUCT DECISION.

## 15. Overclaim / Evidence Integrity Audit — 7 findings, đã sửa trong phiên này

| # | Câu/pattern | Vị trí | Loại | Xử lý |
|---|---|---|---|---|
| F1 | "80,0% …; 73,3% …" thiếu mẫu số | lecturer:48 (cũ), use-cases:65 (cũ) | NO FAKE PRECISION vi phạm | ĐÃ SỬA → (12/15), (11/15) |
| F2 | "100%/86,7%/66,7% khảo sát (6/6–5/6 phỏng vấn)" trộn mẫu số | lecturer:54,56,58 (cũ) | Trộn N=15 với interviews | ĐÃ SỬA → tách "(13/15); 5/6 phỏng vấn định tính…" |
| F3 | "thuật toán SM-2" | lecturer:55 (cũ) | Claim sai policy (D8) | ĐÃ SỬA → Policy B, không gọi SM-2 |
| F4 | "quên đến 80% sau 24–48h (Ebbinghaus)" như sự thật tuyệt đối | lecturer:24 (cũ) | Overclaim lý thuyết | ĐÃ SỬA → cảm hứng lịch sử + evidence thực 15/15 |
| F5 | Quét `users want|most learners|majority|teachers need|students demand` toàn docs | Chỉ 1 hit benign (master-consolidation:199) | PASS — không claim vô căn cứ |
| F6 | Số "73/82/91/95%" bịa | Không tồn tại (95% là D5 policy có nguồn PO; % còn lại đều có mẫu số) | PASS | — |
| F7 | Synthetic trình bày như respondent thật | Không tồn tại (banner + §§1,7 synthetic doc) | PASS | — |

## 16. Gaps (còn lại — đều MINOR, không chặn báo cáo)

- **G1.** Transcript rời P1–P6/IV-SUPP không có trong repo (chỉ có tóm tắt trong DOCX + evidence-register).
  Báo cáo được trích dẫn ở mức "summarized qualitative interviews"; muốn mạnh hơn phải nộp phụ lục transcript.
- **G2.** "Reviewer" (survey-requirements §6) vs "Moderator" (canonical) — term drift trong doc DRAFT.
- **G3.** Quan hệ mock-N=120 design doc vs synthetic-20-persona doc dễ gây nhầm (cả hai đều hypothetical):
  báo cáo chỉ nên trích N=15 + 20-persona + S1–S3; mock-120 giữ ở mức design artifact.
- **G4.** P1-FR-016 còn chữ "OPEN" và placement bands chờ PO chọn (OD-1) — báo cáo ghi đúng trạng thái
  "pending PO sign-off", không tự chốt.
- **G5.** NFR maintainability = Unknown; WCAG/perf = Target chưa đo — báo cáo phải giữ đúng nhãn, không nâng thành "đạt".

## 17. Recommended Corrections (đã làm + còn lại)

**Đã thực hiện trong phiên (doc-only, liệt kê đủ):**
- lecturer-format:48 → thêm (12/15), (11/15); :54/:56/:58 → tách mẫu số survey/interview + nguồn;
  :55 → SM-2 thành Policy B; :24 → Ebbinghaus thành cảm hứng lịch sử + evidence 15/15.
- use-cases:65 → thêm (12/15), (11/15).
- Bổ sung secondary research đã xác minh (S1–S3, §4) vào audit này để báo cáo trích dẫn.

**Còn lại (cho chủ báo cáo, không phải agent tự ý):** G1 (nộp transcript hoặc giữ nhãn summarized);
G2 (đổi Reviewer→Moderator khi duyệt DRAFT); G3 (ghi rõ mock-120 là artifact trong báo cáo);
G4 (điền bands sau PO ký); G5 (giữ nhãn Target/Unknown cho NFR chưa đo).

## 18. Final Readiness Verdict

**B — COMPLETE WITH MINOR DOCUMENTATION FIXES**

Lý do: chuỗi Evidence→Need→Requirement→UC→AC đầy đủ, FR/NFR/BR/actor/UC/BF qua audit không orphan/vague/
unsupported; liêm chính evidence đạt (7 findings §15 đã sửa hết phần agent được phép sửa; quét toàn repo
không còn claim vô căn cứ, không số liệu giả, không trộn mẫu). Những gì còn thiếu (G1–G5) đều là minor
documentation hygiene, không làm sập bất kỳ requirement nào và đã liệt kê chính xác ở §16–§17.
Không đủ A vì transcript rời và vài nhãn NFR/term-drift chưa hoàn thiện; không phải C/D vì phân tích đầy đủ
và evidence integrity không có vấn đề chặn.

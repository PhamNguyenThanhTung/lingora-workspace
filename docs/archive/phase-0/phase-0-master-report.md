# Phase 0 — Master Report

> **CONTENT MASTER — READY FOR USER REVIEW.** Đây KHÔNG phải final presentation. Không tuyên bố `100% verified`, `0 orphan`, hay `FINAL PASS`.
> Tài liệu này là nguồn nội dung duy nhất (single content source) để về sau dựng Final DOCX, Final PPTX, charts, diagrams, speaker notes và appendix.

## 0. Document Control

- **Purpose:** Hợp nhất toàn bộ nội dung Phase 0 đã kiểm chứng thành một nguồn duy nhất cho công tác báo cáo/thuyết trình. Agent dựng DOCX/PPTX sau này chỉ dùng file này, không cần đọc artifacts legacy.
- **Status:** `CONTENT MASTER — READY FOR USER REVIEW` (chờ user đọc và chấp nhận trước khi thiết kế/export).
- **Source-of-truth hierarchy:** (1) `docs/phase-0-roles-and-mvp-final.md`; (2) locked D1–D9; (3) final re-verification report (Phase 0 Research/FR/NFR = `PASS WITH NON-BLOCKING FINDINGS`); (4) main doc Phase 0 đã fix; (5) presentation audit (Presentation Set = `FAIL — REBUILD REQUIRED`); (6) canonical docs 02/03/05/06/07/08/09; (7) raw survey xlsx; (8) synthetic research. Legacy DOCX/PPTX/charts cũ KHÔNG phải nguồn ngữ nghĩa.
- **Evidence policy:** mọi thông tin gắn một trong `FACT` (quan sát/trích xuất trực tiếp) / `INFERENCE` (suy luận có căn cứ) / `SYNTHETIC` (mô phỏng, chỉ discovery) / `DECISION` (quyết định sản phẩm) / `UNKNOWN` (chưa xác minh được). Cấm fabricate số liệu, chi tiết phỏng vấn, quotes, citations; cấm biến synthetic thành empirical; cấm biến proposed target thành measured result.
- **Milestone state (FACT):** Phase 0 Research/FR/NFR = `PASS WITH NON-BLOCKING FINDINGS`; Presentation Set = `FAIL — REBUILD REQUIRED`; M2.1 = `INDEPENDENTLY VERIFIED AFTER TARGETED FIX`; M2.2 = `NOT STARTED`.

## 1. Executive Summary

- **Problem (INFERENCE từ survey):** người học tiếng Anh tại Việt Nam hay quên từ vựng (15/15), dễ bỏ cuộc (13/15), thiếu phản hồi ngữ pháp khi viết (10/15 cần sửa lỗi), cần lộ trình đúng trình độ (14/15 muốn đề xuất nội dung).
- **Target users (FACT):** 13/15 học tiếng Anh (10 đơn ngữ + 3 kèm tiếng Trung); 7/15 mới học <6 tháng; 12/15 học vì công việc; 11/15 học ≤5 giờ/tuần → bài học micro 5–10 phút.
- **Research approach (FACT):** survey thực N=15 (24 câu, raw Excel) + qualitative discovery P1–P6 (summarized, có limitation) + 20 synthetic personas nội bộ (SIMULATED, discovery-only) + benchmark Duolingo/Quizlet/ELSA + 6 nguồn thứ cấp S1–S6 (S6 UNKNOWN).
- **Key findings:** SRS cấp thiết 12/15 (TB 4.13); placement quan tâm 14/15; điền từ 11/15; streak/progress/reminder là đòn bẩy duy trì.
- **Product direction (DECISION):** 6 canonical roles; 19 MVP functions; D1–D9 đóng băng; Mapping A 6 chặng; Policy B `[1,3,7,14,30]`; Controlled Retry không threshold; Streak local-tz; SoD nghiêm ngặt (Manager publish, Admin emergency `APPROVED→PUBLISHED`).
- **Requirements direction:** 17 FR (P1-FR-001..017) + 11 nhóm NFR (quantitative targets đều `TBD / PROPOSED TARGET`); traceability đầy đủ về E-ID/UC/BF.

## 2. Problem Context and Motivation

- **Learning context (FACT):** tự học ngoại ngữ ngoài lớp, quỹ thời gian hẹp (73.3% ≤5h/tuần), phương thức pha trộn (trung tâm 9/15, website 8/15).
- **Difficulties (FACT từ Q8/Q9/Q10):** quên từ 15/15; bỏ học 13/15 với nguyên nhân bận rộn 9/15, phương pháp kém 8/15, nội dung khó/chán 6/15, mất động lực 6/15.
- **Motivation for system (INFERENCE):** khoảng trống giữa nhu cầu (nhắc ôn đúng lúc, sửa lỗi viết, xếp lớp đúng, bài ngắn, theo dõi tiến độ) và phương pháp hiện tại (sổ tay, flashcard thủ công, app phạt lỗi) → nền tảng học micro + SRS deterministic + GEC + placement + streak.
- **Phase 0 scope (DECISION):** research + requirements + baseline đóng băng; chưa implementation M2.2; placement/badges ở mức specification/design.

## 3. Research Methodology

### 3.1 Real Survey (FACT)

- File raw: `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx`; N=15 respondents thật, 24 câu hỏi + timestamp; Google Forms, convenience sampling.
- Quy tắc đọc: câu đa lựa chọn đếm containment trên từng option (tổng % có thể >100%); câu Likert 1–5 tính TB + distribution; câu mở phân loại substantive/blank/vague.
- **Limitations:** N=15 nhỏ, exploratory, không suy rộng thống kê; Q6/Q11 mã hóa chủ quan (INFERENCE); Q23/Q24 nhiều blank (Q23 6, Q24 7).

### 3.2 Qualitative Interview Discovery (INFERENCE + LIMITATION)

- 6 hồ sơ P1–P6 ở dạng **Illustrative Persona / Summarized Qualitative Discovery**: nhóm đối tượng (SV kỹ thuật, NV văn phòng, người đi làm mất gốc, nhân sự kinh tế, HS phổ thông, quản lý/kinh doanh) + chủ đề nhu cầu (SRS, bài ngắn, placement, GEC, audio, dashboard).
- **LIMITATION (FACT):** repository không lưu raw transcripts/audio → không trình bày tên/tuổi/nghề/quotes/anecdote cụ thể như factual evidence.

### 3.3 Synthetic Stakeholder Research (SYNTHETIC)

- 20 personas SIM (MGR/CRE/MOD/OPS/ADM × 4) từ `docs/phase-0-synthetic-stakeholder-research.md`; mục đích duy nhất: discovery yêu cầu quản trị/vận hành + stress-test SoD/workflow. Tuyệt đối không phải survey/interview người thật, không có % người thật.

### 3.4 Secondary Research / Benchmark

- Framework: ma trận 17 tiêu chí (quan sát được → nguồn URL/DOI → ý nghĩa → ADOPT/ADAPT/REJECT) trên Duolingo/Quizlet/ELSA; loại trừ nền tảng luyện thi TOEIC (vi phạm D4). 6 nguồn S1–S6 (chi tiết §8, §22).

## 4. Survey Results (authoritative: raw Excel; FACT trừ khi ghi rõ)

| Q | Kết quả (k/15) | Dùng để derive |
|---|---|---|
| Q1 ngôn ngữ | TA 13 (10 đơn + 3 kèm Trung), Trung đơn 1, Nhật 1 | Ưu tiên English A1 |
| Q2 thời gian học | <6th 7, 6th–1n 2, 1–3n 2, >3n 4 | Lộ trình cho người mới + mất gốc |
| Q3 mục đích | công việc 12, chứng chỉ 5, giải trí 4, du lịch 2 | Từ vựng/ngữ pháp ứng dụng công việc, GEC |
| Q4 hình thức | Trung tâm 9, Website 8, Sách 4, App 3 (+1 "không hiệu quả") | Tiềm năng web tự học |
| Q5 giờ/tuần | <2h 5, 2–5h 6, 5–10h 3, >10h 1 (≤5h: 11/15) | Micro-learning 5–10 phút |
| Q7 kỹ năng khó | vocab 7, nghe/nói/viết 6, ngữ pháp 5, đọc 2 | Audio bắt buộc, GEC, bài nghe |
| Q8 quên từ | rất TX 8, thỉnh thoảng 7 (15/15 gặp vấn đề) | SRS (căn cứ tối cao) |
| Q9 bỏ học | Có 13, Không 2 | Streak/goal/reminder |
| Q10 lý do bỏ | bận 9, PP kém 8, khó/chán 6, mất ĐL 6, không tiến bộ 3, cá nhân 1 | Bài ngắn + placement + progress |
| Q12 cách học từ | flashcard 10, sổ tay 6, ngữ cảnh 4, app vocab 4, danh sách 2, không biết 1 | Thiết kế thẻ SRS quen thuộc |
| Q13 SRS cần thiết | 5★8, 4★4, 3★1, 2★1, 1★1; TB 4.13; positive 12/15 | P1-FR-005/006 (Policy B) |
| Q14 tăng từ sai | 5★7, 4★2, 3★5, 2★1; TB 4.00; positive 9/15 | Adaptive review (`p_is_correct=false` → 1 ngày) |
| Q15 đề xuất ND | thử 9, rất muốn 5, không cần 1 (quan tâm 14/15) | Placement Mapping A |
| Q16 bài tập sau bài | 5★6, 4★4, 3★3, 1★2; TB 3.80; positive 10/15 | Exercise engine |
| Q17 dạng bài | điền từ 11, TN 9, nghe 8, ghép 7, sắp xếp 6, dịch 6, viết 5 | 5 dạng ADR-006 |
| Q18 theo dõi TD | 5★6, 4★3, 3★5, 2★1; TB 3.93; positive 9/15 | Dashboard + streak |
| Q19 info muốn xem | điểm 10, tiến bộ 7, bài xong 5, thời gian 5, số từ 4 | Dashboard metrics |
| Q20 hội thoại | 5★4, 4★4, 3★5, 2★1, 1★1; TB 3.60; positive 8/15 | Scenario writing (mức vừa) |
| Q21 hỗ trợ viết | sửa lỗi 10, gợi ý 9, giải thích 8, đánh giá 8, đóng vai 7 | GEC + Diff |
| Q22 top-3 | vocab 9, AI 8, phát âm 7, bài tập 7, SRS 5, cá nhân hóa 4, tiến độ 3, nhắc nhở 2 | Ưu tiên P0 |
| Q23 mở | 5 substantive / 6 blank / 4 vague ("Chưa biết","Wrfddf","online","Không biết lun") | cụm từ, không quảng cáo/phí, widget nhắc từ, sửa lỗi chi tiết |
| Q24 mở | 4 substantive / 7 blank / 4 vague ("Không","Fhdfg","không ạ","Ko biết","Không biết lun"...) | đối thoại tự nhiên, giao tiếp, AI |
| Q6/Q11 mở | mã hóa chủ đề (INFERENCE) | Bối cảnh động lực/khó khăn |

## 5. Key User Findings

- **Vocabulary retention (FACT):** 15/15 quên từ; 12/15 cần SRS (TB 4.13) → Policy B + `record_review` nguyên tử.
- **Personalization (FACT):** 14/15 muốn đề xuất nội dung → Placement Mapping A + Unit Jump ≥95%/24h.
- **Motivation/consistency (FACT):** 13/15 từng bỏ; 9/15 bận → streak local-tz + goal 5–120 phút + in-app reminder (6d; Web Push DEFERRED).
- **Reminder demand (FACT + INFERENCE):** Q23 widget + Q14/Q18 → banner in-app khi có thẻ đến hạn/Streak nguy cơ đứt.
- **Learning experience (FACT):** micro 5–10 phút (73.3% ≤5h/tuần); audio bản xứ cho 100% vocab mới (nghe 6/15 khó, phát âm top-3 7/15).
- **Exercise preferences (FACT):** điền từ 11 > TN 9 > nghe 8 > ghép 7 > sắp xếp/dịch 6 > viết 5 → 5 dạng ADR-006.
- **Progress tracking (FACT):** điểm 10/15, tiến bộ 7/15 → dashboard (bài xong, accuracy, thời gian, streak, từ cần ôn).

## 6. Interview / Qualitative Insights

- **FACT:** không có raw transcripts trong repo; mọi nội dung P1–P6 là summarized discovery.
- **INFERENCE (themes):** cần SRS tự động; bài siêu nhỏ cho người bận; placement để khỏi học lại từ sơ đẳng; GEC giải thích thay vì đúng/sai đơn điệu; audio chuẩn cho phát âm; dashboard + ôn từ sai nhiều hơn.
- **LIMITATION:** không tên/tuổi/nghề/quotes/anecdote cụ thể; nhãn dùng: `ILLUSTRATIVE PERSONA / INFERENCE — SUMMARIZED QUALITATIVE DISCOVERY`.
- Minh họa P1–P6 theo nhóm đối tượng (SV kỹ thuật, NV văn phòng, người đi làm mất gốc, nhân sự kinh tế, HS phổ thông, quản lý/kinh doanh) — xem main doc §3.2.

## 7. Synthetic Stakeholder Insights

- 20 SIM personas bao phủ: lập khung + giao việc + publish (MGR), soạn theo brief + preview (CRE), diff + chống tự duyệt (MOD), ticket + phân luồng (OPS), RBAC + audit + emergency (ADM).
- Phát hiện dùng cho: D1 (Manager-driven + `assignment_brief`), D2 (cấm tự duyệt/publish), D3 (Clone-to-Draft), AuditLog/DD-03, SupportTicket/Cohort ở Extension Boundary.
- Không % người thật nào từ nguồn này. Xung đột tác nhân đã giải quyết theo D1–D9 (xem main doc §3.3–3.4).

## 8. Benchmark / Platform Analysis (SECONDARY + DECISION)

| Nguồn | Nội dung dùng (FACT) | Relevance | Trạng thái |
|---|---|---|---|
| S1 Hwang et al. 2024, SSLA (DOI 10.1017/S0272263124000354) | attrition ~43.16% (N=3,670 — figure kế thừa, LOW residual) | Ủng hộ streak/retention | Metadata verified |
| S2 Pikhart et al. 2024, Front. Educ. (DOI 10.3389/feduc.2024.1412377) | hài lòng với feedback tức thì; rào cản mạng | NFR resilience/GEC | Metadata verified |
| S3 Tran & Nguyen 2026, IJSSHMR (DOI 10.58806/ijsshmr.2026.v5i6n29) | phát âm khó nhất M=4.90/5, N=50 VN | Audio bắt buộc | Metadata corrected |
| S4 Cepeda et al. 2006, Psych. Bulletin (DOI 10.1037/0033-2909.132.3.354) | Spacing Effect, 317 thí nghiệm | Nền tảng Policy B | Verified |
| S5 Settles & Meeder 2016, ACL (DOI 10.18653/v1/P16-1174) | HLR, giảm 45% MAE (figure kế thừa) | Cảm hứng deterministic (không dùng ML) | Verified |
| S6 Duolingo Blog (2022) | URL 404; "3.6x" = `UNKNOWN / HISTORICAL CLAIM`, không làm AC | Chỉ tham khảo streak concept | Dead link, labeled |
| Duolingo/Quizlet/ELSA (17 tiêu chí) | micro-learning, flashcards, audio; loại Hearts/Leagues; in-app reminder | ADOPT/ADAPT/REJECT (xem main doc §2) | Product-benchmark |

## 9. Pain Points and Derived Insights (Evidence → Insight → Implication)

- PP-01 quên từ (Q8 15/15 + Q13 12/15; S4/S5) → observed → SRS Policy B + RPC (P1-FR-005/006).
- PP-02 bỏ cuộc (Q9 13/15 + Q10/Q5; S1/S6-UNKNOWN) → observed → micro-lesson + streak + goal + reminder (P1-FR-011/014/015).
- PP-03 sai trình độ (Q15 14/15 + Persona P3; S1) → observed/inferred → Placement Mapping A + Jump (P1-FR-016, D5/D6).
- PP-04 mù mờ ngữ pháp (Q21 10/15 + Q7 viết 6/15 + Persona P4; S2) → observed → GEC + Diff (P1-FR-007).
- PP-05 phát âm (Q17 nghe 8/15 + Q22 phát âm 7/15 + Persona P5; S3) → observed → `audio_url` bắt buộc + LISTENING (P1-FR-002/009/013).
- PP-06 soạn lệch chuẩn (SYNTHETIC CRE/MGR) → decided → Manager-driven + brief (D1, P1-FR-008).
- PP-07 tự duyệt (SYNTHETIC MOD/CRE + D2/D3) → decided → SoD + Clone-to-Draft (P1-FR-008).
- PP-08 thiếu audit (SYNTHETIC ADM + DD-03) → decided → AuditLog + emergency justification (P1-FR-008/010).

## 10. Actors and Roles (DECISION — canonical, đúng 6, không Teacher)

1. **Administrator** — tài khoản/phân quyền/cấu hình/báo cáo; emergency `APPROVED→PUBLISHED`/`PUBLISHED→ARCHIVED` + justification + AuditLog; không can thiệp chuyên môn thường nhật.
2. **Organizational Manager** — lập khung Course/Unit/skeleton, giao việc (`assignment_brief`), publish thường nhật, archive, báo cáo cohort tổng hợp; không sửa nội dung chi tiết.
3. **Lesson Creator** — soạn bài được giao (vocab, exercise JSONB ADR-006, audio), preview, nộp `DRAFT→IN_REVIEW`; cấm tự duyệt/publish; chỉ sửa ở DRAFT/CHANGES_REQUESTED.
4. **Moderator** — duyệt độc lập `IN_REVIEW→APPROVED`/`CHANGES_REQUESTED` (+Diff Viewer); cấm publish; cấm duyệt bài mình tạo.
5. **Operations Staff** — ticket/phân luồng (kỹ thuật→Admin, học liệu→Moderator); dữ liệu tối thiểu; không sửa học liệu.
6. **Learner** — học/luyện/SRS/GEC/placement/streak/goal; chỉ đọc nội dung PUBLISHED + dữ liệu của mình (RLS).

## 11. Product Decisions D1–D9 (DECISION — semantics nguyên văn rút gọn)

- **D1 Manager-driven:** Manager lập khung + giao việc; Creator không bypass assignment/planning.
- **D2 SoD:** Moderator duyệt (`APPROVED`); Manager publish (`PUBLISHED`); Creator cấm tự duyệt/publish; Moderator cấm publish; Admin emergency `APPROVED→PUBLISHED` (+`PUBLISHED→ARCHIVED`) kèm justification + AuditLog. Không có `IN_REVIEW→PUBLISHED`.
- **D3 Clone-to-Draft:** Published v1 bất biến → Draft v2 → duyệt → publish v2; cấm in-place edit; `ARCHIVED→DRAFT` ngoài Core.
- **D4 Unified Exercise:** một model `Exercise` (`isAssessmentMode`) cho học/assessment/placement/jump; MVP `MCQ, FILL_BLANK, REORDER` (+`GRAMMAR, LISTENING` theo ADR-006); không `Exam`/`QuestionBank`/`MATCHING` trong MVP.
- **D5 Conditional Jump:** Jump 1 = assessment Unit trước; 2–3 = cumulative; >3 = comprehensive diagnostic (không cấm); pass ≥95% (product policy); fail → cooldown 24h.
- **D6 Placement Mapping A:** 0–7→U1; 8–12→U2; 13–17→U3; 18–22→U4; 23–26→U5; 27–30→U6. ~30 câu, có Skip (→U1) + Retake, không claim CEFR.
- **D7 Controlled Retry:** two-pass (sai gom cuối bài); allowance `max(1, floor(N*0.10))`; credit 70%; hoàn thành = xong pass 1 + retry cho phép (qua `status COMPLETED`); KHÔNG threshold 70/80/85; không `ExerciseAttempt`; tách score vs completion.
- **D8 SRS Policy B:** baseline `[1, 3, 7, 14, 30]`; due queue (`next_review_at<=now()`); item + workload adaptation; deterministic qua RPC; không ML; không `KnowledgeItem/LearnerSkillState/NextAction`.
- **D9 Streak:** local timezone; ≤1 valid activity/ngày; lỡ 1 ngày → quay lại reset về 1; không freeze/recovery trong MVP.

## 12. Functional Requirements (DECISION + evidence; không tạo mới, không legacy)

| ID | Requirement | Actor | Evidence / Decision | Acceptance |
|---|---|---|---|---|
| P1-FR-001 | Auth/session/điều hướng theo vai trò (Supabase Auth, HttpOnly) | All 6 roles | E-DEC-01, UC-01/BF-01 | Session hợp lệ; lỗi thân thiện; logout xóa phiên |
| P1-FR-002 | Duyệt cây Course→Unit→Lesson + audio vocab | Learner | E-PRI-01/E-SEC-03, UC-04/BF-09 | Chỉ PUBLISHED; audio phát không reload |
| P1-FR-003 | Exercise player 5 dạng ADR-006 | Learner | E-PRI-04, UC-05/BF-10 | Chấm tức thì + giải thích |
| P1-FR-004 | Tiến độ `user_progress` theo D7 | Learner | E-PRI-02, UC-05/BF-10, D7 | Xong pass1+retry → `COMPLETED`, mở bài tiếp |
| P1-FR-005 | Lịch SRS Policy B (`user_vocab_srs`) | Learner | E-PRI-01/E-SEC-04, UC-06/BF-12, D8 | Thẻ đến hạn (`next_review_at<=NOW()`) hiển thị |
| P1-FR-006 | RPC `record_review(uuid, boolean, double, double)` nguyên tử | Learner | E-PRI-01, UC-06/BF-12, D8 | Sai→1 ngày; đúng→bước tiếp; +`review_logs` |
| P1-FR-007 | GEC scenario + Diff Viewer (TARGET) | Learner | E-PRI-03/E-SEC-02, BF-14, ADR-014 | `corrected_text` + diff + giải thích; timeout 8s degrade |
| P1-FR-008 | Lifecycle 6-state + SoD | Creator/Mod/Mgr/Admin | E-SYN-01/03, UC-08/09/10, BF-03..07, D1/D2/D3 | Creator publish → 403; emergency có AuditLog |
| P1-FR-009 | Upload audio `lingora-media` 10MB → `vocabularies.audio_url` | Creator (Admin cấu hình bucket) | E-PRI-04/E-SEC-03, UC-08/BF-04 | Sai format/size → lỗi chi tiết |
| P1-FR-010 | i18n vi/en | All users | E-DEC-01, UC-01..07 | Chuyển ngữ ≤200ms (`TBD / PROPOSED TARGET`) |
| P1-FR-011 | Streak local-tz | Learner | E-PRI-02/E-SEC-06, UC-07/BF-13, D9 | ≤1/ngày; ví dụ 5→6 ngày lúc 23:30 |
| P1-FR-012 | Bài GRAMMAR + `rule_explanation` | Learner | E-PRI-04, UC-05, ADR-006 | Đúng/sai + giải thích quy tắc |
| P1-FR-013 | Bài LISTENING + replay 0.75x | Learner | E-PRI-04/E-SEC-03, UC-05, ADR-006 | Nghe lại chậm rõ, không méo |
| P1-FR-014 | Daily goal 5–120 phút (`daily_goal_min`) | Learner | E-PRI-02, UC-02/BF-13 | Lưu profiles; dashboard đo theo mốc |
| P1-FR-015 | In-app reminder (6d; push DEFERRED) | Learner | E-PRI-01/02, UC-02/BF-13 | Banner + nút vào ôn tập; đóng được |
| P1-FR-016 | Placement 30 câu Mapping A | Learner | E-PRI-02, UC-03/BF-08+11, D5/D6 | 25/30 → U5 (mở U1–4) |
| P1-FR-017 | Private badges P2 (Profile Scope, không UC) | Learner | E-DEC-01, BF-13 | Mở khóa + bộ sưu tập riêng tư, không leaderboard |

## 13. Non-Functional Requirements (nhóm chuẩn; quantitative = `TBD / PROPOSED TARGET` trừ khi ghi rõ design constraint)

- **Security (design constraint + test):** HttpOnly/Secure/SameSite=Lax; JWT ES256/HS256 tại BFF; TLS 1.3; CSP/CSRF. Kiểm chứng: OWASP Top 10 scan trong CI (0 High/Critical).
- **RBAC/RLS (design constraint + test):** đúng 6 roles; RLS mọi bảng app; token learner không chạm dữ liệu người khác. Kiểm chứng: RLS test harness.
- **Privacy (design constraint):** data minimization (email + tên hiển thị); Manager chỉ báo cáo tổng hợp, không `review_logs` cá nhân.
- **Auditability (design constraint):** `AuditLog` append-only (cấm UPDATE/DELETE); 100% emergency sinh bản ghi + `emergency_justification`.
- **Reliability (PROPOSED TARGET):** core học + SRS độc lập GEC (timeout 8s + graceful degradation); sẵn sàng ≥99.5% (`TBD`, synthetic monitoring staging).
- **Usability (verification target):** mobile-first 320px→4K; WCAG 2.1 AA (4.5:1 / 3.0:1); Lighthouse Accessibility ≥90 + Axe 0 lỗi (staging).
- **Accessibility:** gộp trong Usability (tương phản, phím tắt, vi/en).
- **Maintainability (design constraint + test):** Clean Architecture; TypeScript strict, không `any` tùy tiện; Conventional Commits; `pnpm typecheck` + `lint` exit 0; unit tests cho SRS/Mapping/engine.
- **Performance (TBD):** API core ≤800ms P95 (4G); GEC ≤3000ms (test server); đo bằng k6 staging.
- **Capacity (TBD):** stateless + HPA; index (`user_id`, `next_review_at`, `lesson_id`, `status`); mục tiêu ≥50 concurrent (free-tier, không tràn bộ nhớ).
- **Localization (TBD):** vi/en 100% UI, UTF-8, locale formatting; chuyển ngữ ≤200ms (`TBD` staging).
- **Error Handling (Mandatory):** envelope chuẩn `{error:{code,message,detail}}` (khớp `docs/03`); không lộ stack/SQL; 100% lỗi API theo envelope.

## 14. Data / Architecture Constraints (FACT — applied migrations; TARGET gắn nhãn)

- **Applied tables/columns:** `profiles.role` (applied 2 roles; 6 roles = TARGET `schema.prisma`), `daily_goal_min`, `streak_count`, `timezone`, `last_qualifying_activity_date`; `courses`/`lessons` (`is_published` applied; `status`/`creator_id`/`reviewer_id` = TARGET); `vocabularies` (+`audio_url`), `vocabulary_translations`, `lesson_vocabulary`; `exercises` (`MCQ,FILL_BLANK,REORDER` applied; `GRAMMAR,LISTENING` = TARGET ADR-006); `user_progress` (`status` enum + `score`, không `is_completed`); `user_vocab_srs` (ease_factor/interval_days/recall_probability/next_review_at/review_count/lapse_count); `review_logs` (`srs_card_id`, `is_correct`, `interval_days`, `reviewed_at`).
- **TARGET (chưa migration):** `Unit`/`UnitTranslation`, `AuditLog`, 6-role enum, ContentStatus, `starting_unit`/`placement_history` (candidates), `assignment_brief`/`supersedes_id` (candidates).
- **Storage (FACT migration 003):** `lingora-avatars` 5,242,880 bytes (image/jpeg/png/webp, `profiles/{userId}/…`); `lingora-media` 10,485,760 bytes (audio/mpeg/wav, `vocabulary/{vocabularyId}/…`); private, RLS, không overwrite. Không tồn tại `audio-assets`.
- **RPC (FACT migration 002):** `record_review(p_srs_card_id uuid, p_is_correct boolean, p_recall_probability double precision, p_recommended_interval_days double precision)` — check owner `auth.uid()`, atomic (insert `review_logs` + update `user_vocab_srs` + streak), SECURITY DEFINER. Không Rating 1–5.
- **Error contract (FACT docs/03):** `{"error":{"code":"...","message":"...","detail":"..."}}` — không wrapper `success`, `detail` số ít.
- **Kiến trúc:** Learner Web (Next.js) → Supabase (Auth/PostgREST/RPC/Storage) qua RLS; AI/GEC stateless qua BFF Route Handler (timeout 8s), không đọc/ghi DB trực tiếp; MOCK_MODE khi model chưa sẵn.

## 15. User Learning Flows (DECISION + D1–D9; không invent behavior)

- **Onboarding:** đăng ký → chọn ngôn ngữ/cấp độ/mục tiêu/thời lượng → placement hoặc Skip→U1 → goal 5–120 phút.
- **Placement:** ~30 câu (6/6/5/5/5/3 theo U1–U6) → Mapping A → `starting_unit` (+Retake từ Profile).
- **Course/Unit/Lesson learning:** cây Course→Unit→Lesson (6 Units × 4 lessons A1); preview bài khóa (read-only); bài 5–10 phút (8–10 từ, 5 bài tập).
- **Exercise:** MCQ/FILL_BLANK/REORDER (+GRAMMAR/LISTENING) → đúng/sai + giải thích tức thì.
- **Controlled retry:** pass 1 → câu sai vào cuối → retry ≤ allowance → đúng 70% → `COMPLETED` → mở bài tiếp.
- **SRS:** lesson COMPLETED → tạo thẻ (`nextReviewAt=now`) → due queue → Again/Hard/Good/Easy → RPC → interval Policy B.
- **Streak:** hoạt động hợp lệ/ngày (local-tz) → +1 (tối đa 1/ngày); lỡ ngày → về 1 khi quay lại.
- **Progress:** dashboard (bài xong, accuracy, thời gian, streak, từ cần ôn).
- **Content creation/review/publish:** Manager lập khung + giao việc → Creator soạn (DRAFT) → nộp (IN_REVIEW) → Moderator duyệt (APPROVED) hoặc trả (CHANGES_REQUESTED) → Manager publish (PUBLISHED) → lỗi thời archive; Published lỗi → Clone-to-Draft v2. Emergency: Admin `APPROVED→PUBLISHED`/`PUBLISHED→ARCHIVED` + justification + AuditLog.
- **Organizational management:** tạo cohort → thêm thành viên → gán course → báo cáo tổng hợp (optional B2B).

## 16. Content Governance (DECISION)

- Lifecycle: `DRAFT → IN_REVIEW → CHANGES_REQUESTED → APPROVED → PUBLISHED → ARCHIVED` (CHANGES_REQUESTED quay lại IN_REVIEW; ARCHIVED→DRAFT ngoài Core).
- Authority: Creator soạn bài được giao; Moderator duyệt (không publish, không duyệt bài mình); Organizational Manager publish/archive thường nhật; Administrator emergency + justification + AuditLog; **không có `IN_REVIEW → PUBLISHED`**.

## 17. Traceability (FACT — canonical mapping hiện hành)

- Chuỗi: Evidence (E-ID) → Pain Point → Actor → FR → UC/BF → Invariant → Acceptance.
- E-IDs hợp lệ: E-PRI-01..04, E-SEC-01..06, E-SYN-01..05, E-DEC-01 (định nghĩa đầy đủ ở main doc §0.1 Bảng 0.1).
- UC canonical 15: UC-01 Auth, UC-02 Goals, UC-03 Placement, UC-04 Browse, UC-05 Exercises, UC-06 SRS, UC-07 Progress/Streak, UC-08 Create draft, UC-09 Review, **UC-10 = Publish Approved Content (duy nhất)**, UC-11 Accounts, UC-12 Reports, UC-13 Audit logs, UC-14 Tickets, UC-15 Cohorts. P1-FR-017 (badges P2) không chiếm UC; P1-FR-007 (GEC TARGET) dùng BF-14, không UC.
- BF-01..BF-15 (không BF-16): BF-01 Auth, BF-02 Planning, BF-03 Assignment, BF-04 Authoring, BF-05 Review, BF-06 Revision, BF-07 Publication, BF-08 Placement, BF-09 Lesson, BF-10 Retry, BF-11 Jump, BF-12 SRS, BF-13 Progress/Streak, BF-14 GEC, BF-15 Ticket.

## 18. Diagrams Planned for Final Presentation (liệt kê, KHÔNG render ở đây)

| # | Diagram | Purpose | Source `.puml` | Key message | Placement |
|---|---|---|---|---|---|
| 1 | System context | Ranh giới hệ thống + actors | Mới (từ sys-arch, tách 6 roles) | Web↔Supabase↔GEC-via-BFF; 6 actors ngoài | Report §kiến trúc / Slide 15 |
| 2 | Role/Use-case overview | 6 roles ↔ 15 UCs | `use-case-mvp-overview.puml` (sửa: bỏ Moderator→UC-10, thêm Org→UC-10) | SoD trực quan | Report + Slide 9 |
| 3 | Content lifecycle | 6-state + emergency | `content-lifecycle-state.puml` (đúng, chỉ render) | APPROVED→PUBLISHED; không bypass | Report + Slide 10 |
| 4 | Learning progression | Placement→Jump→Retry→SRS→Streak | `learning-progression-model.puml` (đúng, chỉ render) | Mapping A + D5/D7/D8/D9 một hình | Report + Slide 10–12 |
| 5 | Domain/ERD | Applied vs TARGET | `erd-logical-status-mapping.puml` + `domain-model-core.puml` (chỉ render) | Phân biệt CURRENT/TARGET/FUTURE | Report appendix |
| 6 | ERD MVP rút gọn | Học tập core | `erd-mvp-learning.puml` (sửa `audio_url`) | Tables learner-facing | Report |
| 7 | Activity flows | Học/duyệt/SRS/GEC | activity-*.puml (sửa approval: Manager publish) | Luồng nghiệp vụ chính | Report |
| 8 | Sequence key flows | Publish/completion/SRS | sequence-*.puml (sửa publish actor) | Tương tác theo thời gian | Report |
| 9 | Placement detail | Blueprint + bands | Mới (từ docs/09 §1–2) | 30 câu + Mapping A | Slide 12 |
| 10 | SRS/Retry flows | Policy B + D7 | Mới (từ D7/D8) | allowance/credit/intervals | Slide 12 |

Không copy semantics obsolete (SM-2, 4-band, Admin-publish, `audio_path`); mọi PNG export 200 DPI + đọc kiểm trực quan.

## 19. Final Report Storyline (cho DOCX)

Research (§2–3) → Survey (§4) → Qualitative Discovery (§6) → Benchmark (§8) → Pain Points (§9) → Actors (§10) → Product Decisions (§11) → FR (§12) → NFR (§13) → Architecture/Data (§14) → Flows (§15) → Governance (§16) → Traceability (§17) → Acceptance (§20-Slide 17 nội dung) → Conclusion (tóm §1 + trạng thái §0; không tuyên bố presentation final).

## 20. Slide Storyline (semantic content, chưa dựng PPTX; số slide linh hoạt)

- **Slide 1** Project title/scope: Lingora, English A1 pilot, 6 roles, 19 MVP, Phase 0 PASS WITH NON-BLOCKING FINDINGS.
- **Slide 2** Problem: quên từ 15/15, bỏ học 13/15, mù mờ ngữ pháp 10/15 (k/15 đầy đủ).
- **Slide 3** Methodology: N=15/24Q raw Excel + P1–P6 illustrative (limitation) + 20 SIMULATED + S1–S6 (S6 UNKNOWN); không suy rộng.
- **Slide 4** Survey profile: Q1–Q5 (TA 13/15, mới học 7/15, công việc 12/15, ≤5h 11/15, web/t.trung tâm).
- **Slide 5** Key findings: Q13 12/15 TB 4.13; Q15 14/15; Q17 điền từ 11/15; Q22 top-3; Q23/Q24 splits trung thực.
- **Slide 6** Pain points PP-01..PP-08 (evidence→implication, 1 dòng mỗi cái).
- **Slide 7** Qualitative insights: themes INFERENCE + banner limitation; synthetic tách riêng SIMULATED.
- **Slide 8** Benchmark: Duolingo/Quizlet/ELSA decisions + S1–S5 (metadata đúng) + S6 UNKNOWN (không 3.6x normative).
- **Slide 9** Six roles: bảng responsibility/boundary (không Teacher).
- **Slide 10** Core workflow: lifecycle 6-state + learning flows (§15 rút gọn).
- **Slide 11** D1–D4: Manager-driven, SoD (emergency APPROVED→PUBLISHED), Clone-to-Draft, Unified Exercise.
- **Slide 12** D5–D9: Jump ≥95%/24h; Mapping A 6 bands; Retry allowance/70%/không threshold; Policy B; Streak local-tz.
- **Slide 13** FR: bảng 17 FR rút gọn (ID/actor/evidence/AC chính).
- **Slide 14** NFR: 11 nhóm + nhãn TBD/design-constraint (≤200ms, ≥99.5% đều PROPOSED TARGET).
- **Slide 15** System view: kiến trúc + applied tables + RPC + error envelope.
- **Slide 16** Traceability: chuỗi E-ID→PP→FR→UC/BF (UC-10 Publish duy nhất; BF-01..15).
- **Slide 17** Acceptance/status: Gates + trạng thái §0 (presentation rebuild pending; M2.2 NOT STARTED).

## 21. Evidence Appendix — Evidence Register (chỉ evidence thực)

| ID | Evidence Type | Source | Supports | Limitation |
|---|---|---|---|---|
| E-PRI-01 | PRIMARY | xlsx Q7/Q8/Q13 | Quên từ 15/15; SRS 12/15 TB 4.13 | N=15 exploratory |
| E-PRI-02 | PRIMARY | xlsx Q9/Q10/Q15 | Bỏ học 13/15; placement 14/15 | N=15; Q10 đa chọn |
| E-PRI-03 | PRIMARY | xlsx Q21 | Sửa lỗi 10/15 + giải thích | N=15 |
| E-PRI-04 | PRIMARY | xlsx Q3/Q17 | Công việc 12/15; điền từ 11/15 | N=15 |
| E-SEC-01 | SECONDARY | Hwang et al. 2024, SSLA (DOI …0354) | Attrition context | Figures kế thừa (LOW residual) |
| E-SEC-02 | SECONDARY | Pikhart et al. 2024, Front. Educ. (DOI …1412377) | Feedback/resilience context | — |
| E-SEC-03 | SECONDARY | Tran & Nguyen 2026, IJSSHMR (DOI …v5i6n29) | Phát âm M=4.90 | — |
| E-SEC-04 | SECONDARY | Cepeda et al. 2006 (DOI …132.3.354) | Spacing Effect | — |
| E-SEC-05 | SECONDARY | Settles & Meeder 2016 (DOI …P16-1174) | HLR inspiration (không ML) | Effect figures kế thừa |
| E-SEC-06 | SECONDARY | Duolingo Blog 2022 (URL 404) | Streak concept | 3.6x UNKNOWN, không làm AC |
| E-SYN-01..05 | SYNTHETIC | synthetic research §2.1–2.5 | D1/brief, SoD/diff, ticket, audit | Discovery-only, 0% người thật |
| E-DEC-01 | DECISION | PO decision sheet + docs/08/09 | D1–D9, Mapping A, curriculum | Policy, không phải empirical |

## 22. Citation / References (sạch; S6 404 không làm valid source)

1. Hwang, H., Coss, M. D., Loewen, S., & Tagarelli, K. M. (2024). Acceptance and engagement patterns… *SSLA*, 46(4), 969–995. https://doi.org/10.1017/S0272263124000354 — hỗ trợ bối cảnh attrition.
2. Pikhart, M., Klímová, B., & Al-Obaydi, L. H. (2024). Exploring university students' preferences… *Front. Educ.*, 9, 1412377. https://doi.org/10.3389/feduc.2024.1412377 — hỗ trợ feedback/resilience.
3. Tran, A. V., & Nguyen, L. H. (2026). Eighth-Grade EFL Learners' Perceptions… *IJSSHMR*, 5(6). https://doi.org/10.58806/ijsshmr.2026.v5i6n29 — hỗ trợ audio bắt buộc.
4. Cepeda, N. J., et al. (2006). Distributed practice… *Psych. Bulletin*, 132(3), 354–380. https://doi.org/10.1037/0033-2909.132.3.354 — nền tảng spacing.
5. Settles, B., & Meeder, B. (2016). A Trainable Spaced Repetition Model… *ACL*, 1848–1858. https://doi.org/10.18653/v1/P16-1174 — cảm hứng HLR (deterministic, không ML).
6. Duolingo Product & Engineering (2022). *Duolingo Blog* [URL 404 — CLAIM UNVERIFIED] — "3.6x" = UNKNOWN, không dùng normative.

## 23. Presentation Artifact Mapping (mọi output sau này derive từ master)

| Master Section | Final Report | Slide | Chart | Diagram |
|---|---|---|---|---|
| §1–2 | Ch I mở đầu | 1–2 | — | — |
| §3–4 | Ch II survey | 3–5 | Q8/Q13/Q17/Q21/Q22/Q23-24 regenerations | — |
| §6–8 | Ch II–III discovery/benchmark | 7–8 | — | — |
| §9 | Ch III pain points | 6 | — | — |
| §10–11 | Ch IV roles/decisions | 9–12 | — | #2,3,4 |
| §12–13 | Ch V requirements | 13–14 | — | — |
| §14–16 | Ch VI architecture/flows/governance | 15 | — | #1,5,6,7,8 |
| §9 (D5/D6), §4 Q15 | Placement coffre | 12 | Placement bands chart (mới, từ docs/09) | #9 |
| §17 | Ch VII traceability | 16 | — | — |
| §0 + §21–22 | Appendix + refs | 17 | — | — |
| SRS/Retry (§11 D7/D8) | Ch V–VI | 12 | Interval ladder + retry allowance figure (mới) | #10 |

## 24. CONTENT QUALITY RULES (checklist trước khi user duyệt)

- [ ] Không legacy requirement (Teacher, 10-UC cũ, CEFR-placement, SM-2 normative, QuestionBank/Exam/MATCHING MVP).
- [ ] Không conflicting placement mapping (chỉ Mapping A 6 chặng).
- [ ] Không D7 score threshold / `is_completed` / `ExerciseAttempt`.
- [ ] Không `IN_REVIEW → PUBLISHED`.
- [ ] Không fake interview (tên/tuổi/nghề/quotes cụ thể).
- [ ] Không unsupported survey numbers (mọi k/15 đối chiếu §4).
- [ ] Không unsupported 80% claim (không "80% quên sau 24–48h").
- [ ] Không obsolete schema (`user_roles`, `user_srs_items`, `vocabulary_items`, `audio-assets`, `srs_item_id`, `daily_goal_minutes`, `last_active_date`); TARGET gắn nhãn.
- [ ] Không unsupported academic claims (S6 UNKNOWN; figures kế thừa ghi rõ).
- [ ] Không `BF-16`; không duplicate `UC-10`.
- [ ] Không self-pass (`100% verified`, `0 orphan`, `FINAL PASS`).

**Kết quả tự kiểm (FACT):** toàn bộ 11 rules đạt trên nội dung file này — số liệu lấy từ §4 (đã verified), roles/D1–D9/FR/NFR/schema/traceability khớp SoT, S6 UNKNOWN, không self-pass (status: READY FOR USER REVIEW).

---
*Hết Master Report. Chờ user đọc và chấp nhận nội dung trước khi thiết kế/export (bước tiếp theo chỉ sau approval).*

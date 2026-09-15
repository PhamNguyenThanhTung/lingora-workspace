# 09 — Placement & Jump Specification (trên English A1 Curriculum)

> **Mã tài liệu:** `docs/09-placement-and-jump-specification.md`
> **Loại:** ASSESSMENT SPECIFICATION (documentation only — không implement Placement/Jump, không schema, không code)
> **Trạng thái:** `READY FOR REQUIREMENTS FREEZE` (Placement Mapping A Approved by Product Owner)
> **Căn cứ:** D5/D6/D7/D8 (immutable); `docs/08-english-a1-curriculum.md` (6 Units U1–U6, 24 lessons, ~200 từ); Quyết định phê duyệt của Product Owner.
> **Ranh giới:** Assessment = conceptual mode của `Exercise` (D4 — không tạo entity). Mọi threshold/band là
> `PRODUCT POLICY / CURRICULUM PLACEMENT RULE`, không phải scientific validation, không phải CEFR certification.
> `[ASSUMPTION]` = giả định kỹ thuật/sư phạm chưa kiểm chứng; `[OPEN DECISION]` = cần PO chốt.

---

## 1. Placement Blueprint (~30 câu)

### 1.1 Coverage theo Unit (stratified, thứ tự dễ→khó theo progression)

| Block | Unit nguồn | Số câu | Dạng câu (trên Exercise model) | Kiểm tra gì |
|---|---|---|---|---|
| B1 | U1 | 6 | MCQ×3 (greetings/be/countries), FILL_BLANK×2, LISTENING×1 (numbers) | be-verb, greetings, numbers 1–20 |
| B2 | U2 | 6 | MCQ×2, FILL_BLANK×2 (possessives/plurals), REORDER×1, LISTENING×1 (days/time) | have/live/like, possessives, time |
| B3 | U3 | 5 | MCQ×2, FILL_BLANK×2 (How much/a-an-some), REORDER×1 | shopping functions, quantifiers |
| B4 | U4 | 5 | MCQ×2, FILL_BLANK×1 (prepositions), REORDER×1, LISTENING×1 (places) | directions, in/on/at/near, can |
| B5 | U5 | 5 | MCQ×1, FILL_BLANK×2 (routine/past), REORDER×1, GRAMMAR×1 (3rd-sg/past) | present routine, frequency, past đơn |
| B6 | U6 | 3 | MCQ×1, FILL_BLANK×1 (going to), REORDER×1 | invitations, going to, small talk |
| **Tổng** | U1–U6 | **30** | MCQ 11 · FILL 10 · REORDER 5 · LISTENING 3 · GRAMMAR 1 | — |

**Rationale:** trọng số nghiêng về U1–U2 (12/30) vì learner mất gốc cần phân biệt mịn ở đầu lộ trình;
U6 chỉ 3 câu vì mục đích placement là tìm điểm vào, không phải kiểm tra toàn diện (toàn diện là việc của
Jump >3 diagnostic). `[ASSUMPTION]` Phân bổ này tối ưu cho onboarding; hiệu chỉnh sau khi có dữ liệu thật.

### 1.2 Coverage theo knowledge area & độ khó tương đối

| Knowledge area | Số câu | Câu hỏi thuộc block |
|---|---|---|
| Vocabulary recognition/use | 12 | B1×3, B2×3, B3×2, B4×2, B5×1, B6×1 |
| Grammar/function in context | 15 | B1×3, B2×3, B3×3, B4×2, B5×3, B6×1 |
| Listening (word-level, audio vocab) | 3 | B1, B2, B4 |
| Độ khó tương đối | Dễ (B1–B2): 12 · Trung bình (B3–B4): 10 · Khó (B5–B6): 8 | Thứ tự làm bài cố định từ dễ đến khó; không adaptive (CAT là DEFERRED theo gap-audit) |

### 1.3 Scoring, Skip, Retake, Output

- **Scoring:** mỗi câu 1 điểm, tổng 0–30, không trừ điểm câu sai, không trọng số `[ASSUMPTION — đơn giản, minh bạch]`.
  Retry (D7) KHÔNG áp dụng cho placement (one-shot assessment).
- **Skip:** bất kỳ lúc nào trước khi nộp → Starting Unit = U1, không lưu score.
- **Retake:** từ Profile, không giới hạn số lần `[ASSUMPTION]`; mỗi lần làm lại dùng cùng blueprint
  (ngân hàng câu hỏi chi tiết + shuffle là việc của M-implementation, không thuộc spec này);
  kết quả mới chỉ áp dụng khi learner xác nhận cập nhật lộ trình.
- **Output duy nhất:** `Starting Unit` (U1–U6). Không output CEFR, không output điểm thành tích.

---

## 2. Placement → Starting Unit Mapping (OD-PLACEMENT-MAPPING: APPROVED MAPPING A)

> **QUYẾT ĐỊNH CHÍNH THỨC CỦA PRODUCT OWNER:**
> Đã phê duyệt chính thức **Placement Mapping A** dưới dạng **CURRICULUM-BASED PRODUCT PLACEMENT RULE**.
> Tuyệt đối KHÔNG PHẢI chứng chỉ CEFR quốc tế và KHÔNG PHẢI kiểm định năng lực tâm trắc học (Not CEFR certification & not scientific calibration).
> Bảng quy đổi điểm số dưới đây là chuẩn duy nhất (Canonical Mapping) được áp dụng:

| Score (0–30) | Starting Unit | Rationale (gắn curriculum) |
|---|---|---|
| 0–7 | **U1** | Dưới ngưỡng làm chủ B1 (6 câu U1): chưa chứng minh được block cơ bản nhất → bắt đầu từ đầu |
| 8–12 | **U2** | ≈ làm chủ 1 block (~5–6 câu) + lẻ: đã qua U1, không nên học lại greetings/be từ số 0 |
| 13–17 | **U3** | ≈ 2.5 blocks: xong U1–U2 (family/time cơ bản) → vào shopping |
| 18–22 | **U4** | ≈ 3.5 blocks: xong U1–U3 → vào directions/travel |
| 23–26 | **U5** | ≈ 4.5 blocks: xong đến U4 → vào routines/past |
| 27–30 | **U6** | Gần trọn bài: chỉ còn U6 (plans/future) chưa học → vào thẳng U6, ôn U1–U5 qua SRS backlog |

**Tại sao bands ~4–5 điểm:** mỗi band ≈ 1 block Unit trong blueprint (§1.1); items sắp xếp theo progression
nên tổng điểm tương quan đơn điệu với Unit cao nhất đã làm chủ. **Limitation (ghi rõ, không giấu):**
pattern không đơn điệu (đúng câu khó, sai câu dễ) vẫn áp total-score rule — deterministic, đơn giản,
chấp nhận được cho placement nội bộ `[ASSUMPTION]`. Tie-break không cần vì bands phủ kín 0–30, biên nguyên.

---

## 3. Jump Specification (D5 — cụ thể hóa trên curriculum)

Quy tắc chung: Pass **≥95%**, Fail → **24h cooldown**, không giới hạn số lần thử lại sau cooldown (D5).
Jump assessment = tập Exercise ở assessment mode (D4), số câu và scope như dưới.

### Jump 1 (vào Unit k từ cuối Unit k−1): assessment = Unit k−1

| Nhảy tới | Assessment scope | Quy mô đề xuất `[ASSUMPTION]` |
|---|---|---|
| U2 | U1 review (U1-L4 gate + sample L1–L3) | 20 câu: vocab 8, grammar 10, listening 2 |
| U3 | U2 review | 20 câu, cùng phân bổ |
| U4 | U3 review | 20 câu, cùng phân bổ |
| U5 | U4 review | 20 câu, cùng phân bổ |
| U6 | U5 review (gồm past đơn — bar cao nhất) | 20 câu, cùng phân bổ |

### Jump 2–3 (vào Unit k, bỏ qua 2–3 Units): cumulative gồm đúng các Unit bị bỏ qua

| Nhảy tới | Cumulative scope | Quy mô `[ASSUMPTION]` |
|---|---|---|
| U3 (bỏ U1–U2) | U1 + U2 | 25 câu (12 + 13) |
| U4 (bỏ U2–U3 / U1–U3 tùy điểm xuất phát) | Các Unit bị bỏ qua (liệt kê khi thi) | 25 câu, chia đều theo Unit |
| U5 | Các Unit bị bỏ qua (2–3 Units) | 25–30 câu |
| U6 | Các Unit bị bỏ qua (2–3 Units) | 25–30 câu |

### Jump >3 (vào Unit k, bỏ qua ≥4 Units): comprehensive diagnostic

- **"Comprehensive" = stratified sample toàn bộ Units từ U1 đến U(k−1)**, phân bổ theo blueprint placement
  §1.1 nhưng scale lên **40 câu** `[ASSUMPTION]` (đủ bao phủ mà không kiệt sức; dài hơn placement vì stakes cao hơn).
  Vd: nhảy U1→U6: 40 câu phủ U1–U5 theo tỉ trọng B1(8)+B2(8)+B3(8)+B4(8)+B5(8).
- Không cấm Jump >3 (D5); diagnostic dài hơn chính là rào cản chất lượng thay cho lệnh cấm.

---

## 4. Assessment Blueprint (mỗi Unit — conceptual, trên Exercise model)

| Unit | Learning objective (đánh giá) | Dimensions + Weight `[ASSUMPTION]` | Exercise types | Ghi chú D4 |
|---|---|---|---|---|
| U1 | Giao tiếp chào hỏi cơ bản | Vocab 40% · be-grammar 45% · listening(numbers) 15% | MCQ, FILL, LISTENING | Assessment = cùng Exercise rows, chạy ở mode kiểm tra |
| U2 | Mô tả người/thời gian hàng ngày | Vocab 40% · grammar (possessive/plural/present) 45% · listening 15% | + REORDER | — |
| U3 | Giao dịch mua sắm đơn giản | Vocab 35% · functions (How much/quantifiers) 50% · listening 15% | + GRAMMAR (a/an/some) | — |
| U4 | Hỏi–chỉ đường, di chuyển | Vocab 35% · directions/prepositions/can 50% · listening 15% | Full 5 types | — |
| U5 | Kể routine + quá khứ đơn | Vocab 30% · grammar (routine/past) 55% · listening 15% | Full 5 types | Bar cao nhất (quá khứ) |
| U6 | Hẹn hò, kế hoạch, small talk | Vocab 30% · functions (invite/going to) 55% · listening 15% | Full 5 types | U6-L4 = comprehensive review |

Physical representation của assessment mode (cờ riêng hay lesson-link) là **M-design decision** —
spec này không chốt để tránh tạo ghost field mới (bài học từ audit ACT-05).

---

## 5. SRS Connection (D8 — không mở rộng policy)

- **Eligible:** mọi item trong `LessonVocabulary` thuộc lessons đã `COMPLETED` (từ đơn/danh từ/động từ/tính từ;
  cụm >2 từ và giới từ đứng riêng KHÔNG tạo thẻ — học qua exercise, xem 08 §4).
- **Entry vào review candidate:** khi lesson chuyển COMPLETED, các vocab items của lesson được tạo thẻ SRS
  với `nextReviewAt = now()` (học ngay) — dùng entity `UserVocabSrs`/`ReviewLog` hiện có, qua RPC `record_review`.
- **Ước lượng pool:** ~170–190 thẻ sau toàn khóa; learner học 1 lesson/ngày → backlog ổn định trong thang
  `[1,3,7,14,30]` mà không quá tải (workload adaptation D8-Tầng 4 tự điều tiết từ mới).
- KHÔNG tạo `KnowledgeItem`/`LearnerSkillState`/`NextAction` (đúng D8).

---

## 6. Learning Progression Validation

| Question | Answer | Evidence from curriculum | Open gap |
|---|---|---|---|
| Learner có hoàn thành Unit N mà không hổng prerequisite? | YES | Prereq tuyến tính (§5 doc 08); mỗi Unit chỉ +1 cụm ngữ pháp mới trên nền cũ | Không |
| Jump 1 có định nghĩa được? | YES | §3: assessment = Unit k−1, 20 câu, scope/band rõ | Cần ngân hàng câu chi tiết (M-task) |
| Cumulative Jump 2–3 có định nghĩa được? | YES | §3: scope = đúng Units bị bỏ qua, 25–30 câu | Cần quy tắc chia câu/Unit khi scope lẻ (M-design) |
| Placement coverage có sample được? | YES | Blueprint 30 câu §1 phủ U1–U6 theo block | Cần viết câu hỏi thật (M-task, Creator theo D1) |
| Starting Unit có xác định được? | YES | Mapping bands §2 phủ kín 0–30, deterministic | Không (chờ freeze sign-off) |
| SRS pool có xác định được? | YES | §5: ~170–190 thẻ, entry rule rõ | Không |

---

## 7. Product Policy Impact (không đổi D1–D9)

```text
D5 Jump → phụ thuộc Unit progression (08 §5) + scope định nghĩa ở 09 §3: RESOLVED ở spec
D6 Placement → phụ thuộc Unit map (08 §2) + mapping rule (09 §2): OD-PLACEMENT-MAPPING đề xuất DECIDED
D7 Retry → phụ thuộc item counts: 5 exercises/lesson → allowance luôn = 1 (tính được, không threshold)
D8 SRS → phụ thuộc vocab coverage: pool ~170–190 thẻ + entry rule (09 §5): RESOLVED ở spec
```

---

## 8. MVP Feasibility

| Metric | Giá trị | Đánh giá |
|---|---|---|
| Total Units | 6 | — |
| Total Lessons | 24 (4/Unit) | Mỗi lesson 5–10', tổng ~2–4h content học lần đầu — vừa cho pilot |
| Exercises (lesson) | ~120 (5/lesson) | + Placement 30 + Jump banks (tái dùng lesson items + diagnostic 40) — trong sức 1 Creator team + Moderation queue |
| Vocabulary | ~200 từ (~180 thẻ SRS) | Đủ nhỏ để biên soạn/thu audio trong MVP; đủ lớn để SRS có backlog thật |
| Kết luận | **MVP FEASIBLE** | Không cần reduction. Rủi ro duy nhất: thu âm ~200 audio vocab — giảm tải bằng TTS tạm `[ASSUMPTION — đề xuất, chờ PO]` |

---

## 9. Required Decision Table

| Decision | Status | Rationale | Impacted requirements | Blocking Freeze? |
|---|---|---|---|---|
| **OD-PLACEMENT-MAPPING: APPROVED MAPPING A** (§2) | APPROVED & LOCKED | Product Owner đã phê duyệt Mapping A (0–7:U1, 8–12:U2, 13–17:U3, 18–22:U4, 23–26:U5, 27–30:U6); không claim science/CEFR | MVP-03, UC-03, P1-FR-016 | RESOLVED |
| Placement blueprint 30 câu (§1) | PROPOSED | Stratified theo Unit, nghiêng đầu lộ trình cho mất gốc | MVP-03, UC-03 | YES |
| Jump scopes + sizes (§3: 20 / 25–30 / 40 câu) | PROPOSED `[ASSUMPTION]` | Tương xứng stakes; comprehensive thay lệnh cấm | UC-04, MVP-04 | YES (acceptance UC-04) |
| Assessment weights (§4) | PROPOSED `[ASSUMPTION]` | Phản ánh trọng tâm từng Unit | UC-05, P1-FR-003 | PARTIAL (tinh chỉnh ở M-design được) |
| SRS eligibility + entry rule (§5) | PROPOSED | Dùng entity hiện có, không entity mới | P1-FR-005/006, UC-06 | YES (SRS pool definition) |
| TTS tạm cho vocab audio | `[OPEN DECISION]` | Giảm tải MVP nếu không thu âm kịp | P1-FR-009/013 | NO |

---

## 10. Final Answers (không tuyên bố Requirements Freeze)

1. **Curriculum đã đủ cụ thể chưa?** YES ở mức freeze-yêu-cầu: Course→Unit→Lesson→objective→vocab→grammar→exercise→assessment→prereq đầy đủ (doc 08); chi tiết câu hỏi/audio thật là việc của M-tasks (Creator theo D1), không thuộc spec.
2. **Placement mapping đã quyết định được chưa?** YES — đề xuất DECIDED dưới dạng curriculum placement rule (§2), hiệu lực khi freeze sign-off; OD cũ được thay thế có kiểm soát.
3. **Jump scope đã xác định được chưa?** YES — Previous/Cumulative/Comprehensive gắn scope+quy mô cụ thể (§3).
4. **Blocker nào vẫn còn?** B1 coi như resolved ở spec. Còn lại thuộc reconciliation (audit ACT-01..ACT-07: P1-FR-016 CEFR wording, badges, UC-15 boundary, ghost fields, dictionary tầng, report legacy) + APPROVE con người theo gated workflow.
5. **Requirements có thể chuyển sang reconciliation chưa?** YES — đề nghị mở reconciliation task áp dụng ACT-01..ACT-12 (doc-only), sau đó re-audit gates R2/R4/R5/R7/R8/R9/R10/R13–R16 rồi mới freeze.

# Phase 0 Presentation Fix Plan

> **Loại task:** ADJUDICATE + PLAN ONLY. Không implement, không sửa bất kỳ artifact nào.
> **Trạng thái đầu vào:** Phase 0 Research/FR/NFR = `PASS WITH NON-BLOCKING FINDINGS`; Presentation = `FAIL` (`docs/phase-0-presentation-artifacts-independent-audit.md`, 14 findings PA-01..PA-14).
> **Output duy nhất:** file này (`plans/phase-0-presentation-fix-plan.md`). Sau khi tạo: STOP. Bước tiếp theo là Independent Review của plan này.

## 1. Scope

- **In-scope (implementation آینده):** DOCX Final stale; 4 PPTX legacy (1 duplicate); charts sai raw; 4 PlantUML lỗi + exports thiếu/sai; speaker notes; evidence-register/index refs; numbering/cross-references; orphan PNG handling (phân loại, không xóa); report↔slide consistency rebuild.
- **Out-of-scope tuyệt đối:** baseline (`docs/phase-0-roles-and-mvp-final.md`), D1–D9, main doc Phase 0, source code, database/schema/migration, M2.1, M2.2 (NOT STARTED, không mở), xóa historical evidence, tạo dữ liệu/phỏng vấn/trích dẫn mới, sửa chart tay không đối chiếu raw.

## 2. Source-of-Truth Hierarchy

1. `docs/phase-0-roles-and-mvp-final.md` (6 roles, 19 MVP, lifecycle §4, auth matrix).
2. Locked D1–D9 (decision sheet): Manager publish thường nhật; Admin emergency `APPROVED → PUBLISHED`; Mapping A 6 chặng; D7 two-pass + `max(1, floor(N*0.10))` + 70% credit, không threshold; D4 MCQ/FILL_BLANK/REORDER (+GRAMMAR/LISTENING theo ADR-006, không MATCHING/Exam/QuestionBank); D3 Clone-to-Draft; D8 `[1,3,7,14,30]` deterministic; D9 local-tz/streak.
3. `docs/phase-0-final-independent-reverification-report.md` (PASS WITH NON-BLOCKING FINDINGS) + main doc Phase 0 đã fix.
4. Audit presentation (`docs/phase-0-presentation-artifacts-independent-audit.md`) — đầu vào phát hiện, không phải SoT.
5. Canonical requirements/contracts (`docs/02/03/05/06/07/08/09`) + raw survey xlsx (số liệu authoritative: Q4 9/8/4/3; Q13 8/4/1/1/1 TB 4.13; Q17 điền từ 11/TN 9/nghe 8/ghép 7/sắp xếp 6; Q21 10/9/8/8/7; Q22 9/8/7/7/5/4/3/2; Q23 5/6/4; Q24 4/7/4).

## 3. Finding Adjudication

| ID | Verdict | Evidence | Root Cause | Corrective Action | Artifact(s) | Priority |
|---|---|---|---|---|---|---|
| PA-01 | VALID (BLOCKER) | DOCX trích xuất toàn văn: 2 actors, 10-UC legacy, placement 15–20 câu CEFR A1–B2, SM-2 nhiều vị trí, `<500ms`, `Admin/Teacher`, `PlacementQuestion/Result/Badge/UserBadge`, "đồng nhất 100%", Next.js 14, PHẦN III/IV + Phụ lục A trống, không banner historical | DOCX export từ era legacy, không sync sau Phase 0 reset; cấu trúc đã obsolete toàn diện | §5: gắn banner SUPERSEDED cho bản cũ (giữ file) + rebuild DOCX Final mới từ main doc đã PASS | DOCX Final | P0 |
| PA-02 | VALID (BLOCKER) | Text extraction 4 decks: slide 3 (2 actors), slide 8 (10 FR/UC, placement UC-09/badges UC-10), slide 4 (AC SM-2), slide 9 (`<500ms`, 24/7), slide 15 (M2 ✓ done + "22 sơ đồ"), slide 14/notes (100%/không xung đột/mọi AC có test) | Decks đóng băng ở era Project 1 đợt 1, trước Phase 0 reset | §6: rebuild deck mới từ baseline; giữ slides tốt (methodology 17/21, status 20) làm mẫu; gắn SUPERSEDED cho decks cũ | 4 PPTX | P0 |
| PA-03 | VALID (HIGH) | Slides "N=9"/"9 phỏng vấn", demographics IV-SUPP (trường/ngành/nghề), "100%/83.3%" mẫu không xác định; không transcript trong repo | Gộp 6+3 + chi tiết hóa quá mức từ nguồn bổ sung | Trình bày tách 6 gốc + 3 bổ sung riêng, bỏ demographics, ghi limitation (mẫu slide 17), không % gộp | PPTX slides 12/21/25/26 | P0 |
| PA-04 | VALID (HIGH) | "80% kiến thức bị quên sau 24-48h" (+Ebbinghaus) trên slides 18/22/23 + DOCX P30; raw Q8 chỉ có tần suất 8/7/0 | Số liệu minh họa không nguồn, gán ghép Ebbinghaus | Xóa; thay bằng Q8 thực (8/15 rất TX + 7/15 thỉnh thoảng) | PPTX + DOCX | P0 |
| PA-05 | VALID (HIGH) | sequence-content-publishing: Admin publish, vắng Org Manager; activity-content-approval: "Administrator hoặc Moderator xuất bản"; use-case-mvp-overview: Moderator→UC-10, thiếu Org→UC-10 | Vẽ sai phân quyền D2 từ era cũ | Sửa đúng: Manager→Publish (UC-10), Moderator→Approve (UC-09), Admin→emergency APPROVED→PUBLISHED + AuditLog | 3 puml + exports | P0 |
| PA-06 | VALID (HIGH) | Montage đã xem trực quan: panel Diff "46.7% (7)" không có trong Q21; "Sắp xếp câu (7)" vs raw 6/15; Q13 distribution 3★(2)/1-2★(1) vs raw 8/4/1/1/1; nhãn SM-2 nhiều nơi | Vẽ chart tay/sai nguồn, gán nhãn thuật toán cũ | Regenerate toàn bộ charts từ raw bằng script (§7), nhãn Policy B; bỏ panel Diff hoặc ghi UNKNOWN có căn cứ | Slide 23/27/28 media + charts | P0 |
| PA-07 | VALID (MEDIUM) | `erd-mvp-learning.puml` line 60 `audio_path` vs applied `audio_url` (migration 001) | Terminology drift | Đổi `audio_url` + re-export | erd-mvp-learning puml/png | P1 |
| PA-08 | VALID (MEDIUM) | role-permission-matrix: mũi tên Moderator→Admin "Ủy quyền xuất bản (Approved)" | Diễn đạt quan hệ publish gây hiểu sai D2 | Vẽ lại luồng publish qua Manager; Admin chỉ emergency | role-permission-matrix puml/png | P1 |
| PA-09 | VALID (MEDIUM) | Notes trỏ puml đã xóa (use-case-overview, activity-*, dfd-*, erd-baseline) + docs/02 § cũ; overclaims ("ERD 17 bảng khớp 100% Prisma", "không xung đột", "mọi AC có test") | Notes viết theo cấu trúc repo cũ | Viết lại notes theo artifacts hiện hành, dẫn nguồn tồn tại, bỏ overclaims | PPTX notes 23–28 slides/deck | P1 |
| PA-10 | VALID (MEDIUM) | 4 puml đúng nhất (lifecycle, progression, erd-logical, domain-model) thiếu PNG; 45 orphan PNG legacy không source | Thiếu export + tồn dư cleanup chưa phân loại sử dụng | Render đủ PNG (200 DPI); loại orphan khỏi final set, giữ file + ghi rõ không dùng | Exports + report/diagrams/ | P1 |
| PA-11 | VALID (MEDIUM) | evidence-register: mapping UC-02..UC-10 legacy (placement UC-09, badges UC-10); dẫn `docs/phỏng_vấn.docx` vắng mặt; "luyện viết 8/15" gán sai số Q22-AI | Register chưa sync canonical 15-UC + ref file không tồn tại | Cập nhật mapping canonical (Placement UC-03, Review UC-09, Publish UC-10); sửa dẫn nguồn (ghi rõ file vắng mặt + dùng xlsx); sửa nhãn Q22 | evidence-register.md | P1 |
| PA-12 | VALID (MEDIUM) | "22 sơ đồ" vs "32 sơ đồ" vs 13 puml thực tế; "15 active" vs 17 entities (docs/07); benchmark slide (Grammarly/Memrise/Busuu) vs main doc (Duolingo/Quizlet/ELSA) không nguồn | Số "đẹp" không traceable + scope benchmark trôi | Chuẩn hóa theo canonical (số puml thực tế sau rebuild; 17 entities docs/07; benchmark = main doc + nguồn đầy đủ) | Slides + report md liên quan | P1 |
| PA-13 | VALID (LOW) | system-architecture-mvp gộp actor "Content & Operations Staff"; sequence-lesson-completion thiếu retry ("hoàn thành kèm điểm số" dễ gợi score-gate) | Simplification quá mức | Tách actor theo 6 roles (hoặc ghi rõ simplification); bổ sung retry note D7 | 2 puml + exports | P2 |
| PA-14 | VALID (LOW) | README (CANONICAL INDEX) trỏ docx Final + md legacy + diagrams/ stale; slide 15 vs slide 20 mâu thuẫn M2 trong cùng deck | Index chưa sync + mâu thuẫn nội bộ deck | Cập nhật index trỏ final set mới; thống nhất slide 15 theo slide 20 (M2+ pending) | README + decks | P2 |

Không có INVALID/PARTIALLY VALID: toàn bộ 14 findings đứng vững trên evidence trực tiếp và SoT. (Điểm tốt đã ghi nhận trong audit — slide methodology 17/21, chart Q8 đơn, quality render — được giữ lại khi rebuild, không cần action.)

## 4. Artifact Inventory

| Nhóm | Artifacts | Status | Dùng cho final mới? |
|---|---|---|---|
| DOCX Final (1) | Lecturer-Format-Final.docx | SUPERSEDED (gắn banner, giữ file) | Không — rebuild mới |
| PPTX (4, 1 duplicate) | Requirements-Presentation (23) = XÂY DỰNG (duplicate, SHA256 trùng); Expanded (27); Target-Defined (28) | SUPERSEDED (giữ file) | Không dùng nguyên deck — tái sử dụng slides tốt 17/20/21 + charts đúng |
| Report md (4) | Đã nhãn HISTORICAL | HISTORICAL, giữ nguyên | Không |
| evidence-register + README index | Đang dùng | CURRENT NEEDS UPDATE | Có, sau cập nhật (§10) |
| PlantUML (13 source) | 4 đúng (lifecycle, progression, erd-logical, domain-model); 5 OK-lưu ý; 4 lỗi (PA-05/PA-07) | CURRENT / NEEDS UPDATE theo file | Có |
| Exports (7 png plantuml) | Contemporary với source (mtime cùng đợt) | CURRENT SUPPORTING (re-export sau sửa) | Có, sau re-export |
| Orphan (45 png report/diagrams) | Không source, era legacy | SUPERSEDED/UNVERIFIABLE, giữ file | Không |
| Charts trong PPTX (10 media/deck) | Sai raw (PA-06) | SUPERSEDED | Không — regenerate (§7) |

## 5. DOCX Remediation

Gắn banner `[SUPERSEDED — replaced by <new-final-docx>]` vào DOCX cũ (bằng cách tạo bản mới, không sửa bản cũ ngoài banner nếu công cụ cho phép; nếu không, chỉ tạo mới + ghi rõ thay thế trong README). Rebuild DOCX Final mới từ main doc Phase 0 đã PASS: 6 roles, 15 UC (UC-09 Review, UC-10 Publish), placement 30 câu Mapping A, Policy B, D7 không threshold, NFR TBD, citations S1–S6 đúng + S6 UNKNOWN, E-ID register rút gọn, interview limitation + illustrative persona, phụ lục thật (không để trống/không placeholder "Ctrl+A F9"), version công cụ đúng (Next.js 15). Validation: grep 0 hit legacy terms (SM-2 normative, `<500ms`, `Teacher` role, CEFR-placement, QuestionBank entities, "100%...đồng nhất").

## 6. PPTX Remediation

Rebuild 1 deck final duy nhất (khuyến nghị từ Target-Defined 28 slides vì đã có slides methodology/status tốt): slide 3 → 6 actors; slide 8 → P1-FR/15 UC mapping đúng (Placement UC-03, Review UC-09, Publish UC-10, badges P2 không UC); slide 4 → Policy B + RPC boolean; slide 9 → NFR TBD (≤200ms PROPOSED TARGET, không `<500ms`/24-7 measured); slide 15 → trạng thái đúng (M1 done theo QUICK-REF, M2/M2.2 pending, không M2 ✓); slide 14 + notes → bỏ overclaims; slides interview → tách 6/3 + limitation (mẫu slide 17); benchmark slide → scope main doc + nguồn. 3 decks cũ + duplicate: gắn SUPERSEDED, giữ file (duplicate ghi rõ DUPLICATE OF deck chính trong log, không xóa). Validation: text-extraction diff ضد baseline checklist.

## 7. Chart Remediation

Regenerate bằng script từ raw xlsx (không sửa tay): Q8 donut (8/7/0) ✓ giữ mẫu; Q13 bars đúng 8/4/1/1/1 + TB 4.13, nhãn Policy B; abandonment 13/2 (bỏ chú thích nguyên nhân raw-không-có); Q21 đúng 5 options 10/9/8/8/7 (bỏ panel Diff-7 hoặc chứng minh nguồn, mặc định bỏ); exercise types đúng 11/9/8/7(ghép)/6(sắp xếp)/6/5; mỗi chart ghi source column/question + denominator N=15. Output: media mới thay 10 media/deck cũ + file montage mới. Validation: recount script assert từng con số + denominator trước khi nhúng.

## 8. PlantUML / Diagram Remediation

- sequence-content-publishing: thêm actor Organizational Manager publish thường nhật (`APPROVED→PUBLISHED`); Admin chỉ emergency + justification/AuditLog; Moderator dừng ở approve.
- activity-content-approval: "Manager xuất bản (Admin chỉ emergency)" thay dòng sai.
- use-case-mvp-overview: bỏ Moderator→UC-10, thêm Org→UC-10 (giữ Admin→UC-10 chỉ khi thể hiện emergency — nếu gây rối thì bỏ, ghi chú emergency trong note).
- erd-mvp-learning: `audio_path` → `audio_url`.
- role-permission-matrix: vẽ lại quan hệ publish qua Manager.
- PA-13 (LOW, làm luôn cùng đợt): tách actor sys-arch; thêm retry note vào sequence-lesson-completion.
- Export: render đủ 13 PNG (200 DPI, Segoe UI) incl. 4 file đang thiếu; PNG cũ re-export sau sửa. Validation: `skinparam dpi 200` + đọc trực quan từng ảnh (text/arrows/legend/state edges) + checklist D2/publish-role.

## 9. Speaker Notes Remediation

Viết lại toàn bộ notes theo artifacts hiện hành: dẫn đúng file tồn tại (puml mới, docs/02-09 sections hiện tại, xlsx, evidence-register sections hiện tại); bỏ overclaims (khớp 100% Prisma, không xung đột, mọi AC có test); milestone đúng (M2 pending/M2.2 NOT STARTED); interview limitation. Validation: mọi path/§ dẫn trong notes tồn tại (script check).

## 10. Evidence Register / Index Remediation

- evidence-register: mapping UC canonical (Placement→UC-03/BF-08, Review→UC-09, Publish→UC-10, badges P2 không UC); sửa Q22 ("AI hội thoại 8/15", bỏ "luyện viết 8/15"); dẫn `docs/phỏng_vấn.docx` → ghi rõ file vắng mặt trong repo, dùng xlsx + main doc §3 làm nguồn (không fake evidence).
- README index: trỏ final set mới (DOCX mới, deck mới, diagrams mới); mục legacy trỏ lại kèm nhãn SUPERSEDED. Không tạo UC/BF giả.

## 11. Numbering / Cross-Reference Remediation

Canonical numbering: số diagrams = số puml thực tế trong final set (đếm sau rebuild, không dùng 22/32); entities = 17 applied (docs/07) + TARGET gắn nhãn; benchmark scope = main doc Phase 0 (Duolingo/Quizlet/ELSA + S1–S6 có DOI/URL + S6 UNKNOWN); milestone theo §14. Mọi cross-ref report↔slide↔diagram dẫn đúng file/section tồn tại. Validation: script đếm + grep refs.

## 12. Legacy / Historical Artifact Handling

Nguyên tắc: gắn nhãn SUPERSEDED/HISTORICAL + giữ file; KHÔNG xóa trong implementation (kể cả duplicate và 45 orphan PNG — chỉ loại khỏi final set + ghi rõ "không dùng"). 4 report md đã nhãn đúng → giữ nguyên. Ghi log references cho orphan PNG nếu lần ra được nguồn (nếu không: UNVERIFIABLE, không dùng).

## 13. Validation Gates

Gate 1: không còn role-model 2-actor normative (6 roles đúng chính tả Anh/Việt). Gate 2: placement duy nhất Mapping A 6 chặng, 30 câu, không CEFR-range. Gate 3: SRS = Policy B + RPC boolean, 0 "SM-2" normative; D7 không threshold/`is_completed`. Gate 4: publish = Manager, emergency Admin APPROVED→PUBLISHED + justification/AuditLog; 0 "Admin/Moderator xuất bản", 0 Moderator→UC-10, Org→UC-10 hiện diện. Gate 5: mọi chart reproduce raw (recount assert). Gate 6: không demographics/quotes N=9 không nguồn; limitation hiện diện. Gate 7: benchmark scope + DOI/URL đúng; 3.6x chỉ UNKNOWN/removed. Gate 8: 13/13 puml render PNG 200 DPI khớp source (đọc trực quan). Gate 9: mọi note refs tồn tại, không overclaim. Gate 10: register mapping canonical, không missing-file ref sống, không fake UC/BF. Gate 11: numbering/refs nhất quán. Gate 12: milestone đúng (không M2 ✓; M2.2 NOT STARTED; không sửa M2.1). Gate 13: final set không còn legacy normative (grep 0 hit danh sách cấm). Gate 14: baseline→main doc→final report→slides→diagrams/charts chuỗi khớp (sampling quan trọng).

## 14. Execution Order

1. Adjudicate artifact status (§4: gắn nhãn SUPERSEDED cho DOCX/decks cũ). 2. Khóa cấu trúc presentation mới (mục lục DOCX + outline deck). 3. Rebuild DOCX (§5). 4. Rebuild PPTX (§6). 5. Regenerate charts từ raw (§7). 6. Sửa PlantUML (§8). 7. Export diagrams (§8). 8. Viết speaker notes (§9). 9. Cập nhật register/index (§10). 10. Chuẩn hóa numbering/refs (§11). 11. Quét presentation toàn repo (§13-Gate 13). 12. Independent re-audit (task riêng).

## 15. Risks

- R1 Deck/DOCX mới lệch baseline → giảm bằng Gates 1–4,13,14 + checklist D1–D9/roles/Mapping A trong review.
- R2 Chart "đúng hình thức sai số" → giảm bằng recount assert tự động trước nhúng (Gate 5), cấm sửa tay.
- R3 Nguồn thay thế benchmark yếu hơn nguồn cũ → giảm bằng quy tắc "replacement phải trực tiếp hỗ trợ câu văn, không thì gỡ câu".
- R4 Xóa nhầm historical evidence → giảm bằng cấm xóa (§12); chỉ loại khỏi final set.
- R5 M2.1 vô tình bị đụng → giảm bằng cấm chạm M2.1 (§14-Gate 12); milestone claims lấy từ QUICK-REF §3.

## 16. Final Acceptance Criteria

Implementation xong khi và chỉ khi: 14/14 Gates PASS trên final set (DOCX mới + 1 deck mới + charts mới + 13 PNG + notes + register/index); artifacts cũ đã gắn SUPERSEDED và giữ nguyên; 0 thay đổi baseline/code/schema/M2.1; không M2.2; sau đó chuyển Independent Re-audit (task riêng) quyết định PASS/FAIL cuối. STOP tại đây — không implement trong task này.

# Phase 0 Presentation Artifacts Independent Audit

> **Tư cách:** AUDIT ONLY. Không sửa report/slide/image/PlantUML, không regenerate diagram, không xóa/rename/move, không cleanup, không implementation, không đụng source code/database/baseline/M2.1/M2.2.
> **Bối cảnh:** Phase 0 Research/FR/NFR đã `PASS WITH NON-BLOCKING FINDINGS` (`docs/phase-0-final-independent-reverification-report.md`). Audit này KHÔNG thay đổi verdict đó (§25).
> **Output duy nhất:** file này. Sau khi tạo: STOP.
> **Nhãn bằng chứng:** FACT (quan sát/trích xuất trực tiếp) / INFERENCE (suy luận có căn cứ) / UNKNOWN (không có nguồn).
> **Phương pháp:** inventory toàn repo theo extension; đọc toàn văn 5 report markdown + README index + evidence-register; trích text 4 PPTX (23/27/28 slides + 23-28 speaker notes) và toàn văn DOCX (176 paras, 2 tables) bằng script; đọc toàn văn 13/13 `.puml`; kiểm tra mtime source↔export; xem trực quan 3 ảnh render + 10 chart media của slide 23; đối chiếu raw xlsx (recount độc lập đã có: Q4 9/8/4/3; Q13 8/4/1/1/1; Q17 điền từ 11/TN 9/nghe 8/ghép 7/sắp xếp 6; Q21 10/9/8/8/7; Q22 9/8/7/7/5/4/3/2).

## 1. Executive Verdict

**`FAIL`**

Toàn bộ presentation set hiện hành (1 DOCX `Final`, 4 PPTX trong đó 1 duplicate, 5 report markdown) và một phần diagram hiện hành **misrepresent một cách material Phase 0 canonical baseline cuối cùng**: 2 actors thay vì 6 roles; catalog 10-UC legacy (placement=UC-09, badges=UC-10) thay vì 15 UC canonical; SM-2 thay vì Policy B; placement 15–20 câu/CEFR thay vì 30 câu Mapping A; NFR `<500ms`; claim M2 đã hoàn thành; interview N=9 gộp với demographics; số liệu chart sai raw; publish-role sai trong 3 diagrams. Không tồn tại **CURRENT FINAL** presentation artifact nào phản ánh baseline mới. Cần một presentation fix plan riêng. Phase 0 verdict giữ nguyên.

## 2. Artifact Inventory

| # | Path | Type | Slides/Pages | Ghi chú |
|---|---|---|---|---|
| 1 | `docs/report/Lingora-Project-1-Requirements-Presentation.pptx` (3,016,043 bytes) | PPTX 23 slides + 23 notes + 10 media | Deck báo cáo chính |
| 2 | `docs/project-1/XÂY DỰNG...LINGORA.pptx` (3,016,043 bytes, SHA256 prefix trùng #1) | PPTX DUPLICATE của #1 | FACT duplicate byte-identical |
| 3 | `docs/project-1/Lingora-Survey-Requirements-Expanded.pptx` (27 slides) | PPTX | #1 + slides 17–20 (methodology/status) |
| 4 | `docs/project-1/Lingora-Survey-Requirements-Target-Defined.pptx` (28 slides) | PPTX | #3 + slide 21 (giới hạn diễn giải) |
| 5 | `docs/report/Lingora-Project-1-Lecturer-Format-Final.docx` (49,838 bytes, 176 paras, 2 tables) | DOCX | Không có banner historical; PHẦN III/IV trống; Phụ lục A trống |
| 6–9 | 4 report `.md` trong `docs/report/` (131–270 dòng) | Markdown | Cả 4 có banner HISTORICAL/SUPERSEDED đầu file |
| 10 | `docs/report/evidence-register.md` | Markdown register | Đang được dùng, nhưng mapping UC legacy |
| 11 | `docs/project-1/README.md` | Index CANONICAL INDEX | Vẫn trỏ docx Final + md legacy + diagrams/ |
| 12 | `docs/plantuml/` 13 `.puml` + 7 `.png` | Diagram source + export | 4 puml quan trọng thiếu png |
| 13 | `docs/report/diagrams/` 45 `.png` | Orphan exports | Nguồn puml đã bị xóa, không verify được |

Không tồn tại: `reports/`, `slides/`, `presentation/` riêng; không có PDF/JPG/SVG/WEBP presentation.

## 3. Source-of-Truth Verification

SoT theo thứ tự: roles-and-mvp-final (6 roles, 19 MVP, lifecycle §4) → D1–D9/Mapping A → final re-verification report → main doc Phase 0 đã fix → docs/02/03/05/06/07/08/09 → raw xlsx. Artifacts trình bày KHÔNG phải SoT. Kết quả đối chiếu ở §§4–15.

## 4. Report Audit

- 4 report markdown: nội dung legacy 10-UC/2-actor (placement 15–20 câu CEFR A1–B2; SM-2; `<500ms`; `Admin/Teacher`; `PlacementQuestion/Result/Badge/UserBadge`; "đồng nhất 100%"; §7 trỏ 32 puml đã bị xóa) — nhưng cả 4 mang banner HISTORICAL/SUPERSEDED rõ ràng → phân loại HISTORICAL, không tính là contradiction hiện hành. Ngoại lệ: `lingora-project-1-five-chapter-report.md` §2.3 chứa demographic "P1-P4/P6 tiếng Anh, P5 tiếng Nhật" không có transcript trong repo (ghi nhận, historical).
- DOCX Final: toàn bộ legacy trên mà KHÔNG có nhãn historical; PHẦN III chỉ có heading 3.1 trống, PHẦN IV trống, Phụ lục A trống dù claim đính kèm; mục lục còn placeholder "Ctrl+A F9"; "Next.js 14" sai version. → PA-01 BLOCKER.
- evidence-register: đang dùng nhưng mapping UC-02..UC-10 legacy (placement=UC-09, badges=UC-10); §4.2 dẫn `docs/phỏng_vấn.docx` không tồn tại trong repo; dòng "luyện viết và sửa câu 53.3% (8/15)" gán nhãn sai cho số 8/15 của Q22-AI-hội-thoại. → PA-11 MEDIUM.

## 5. Slide Audit

Cả 4 decks (23/27/28 slides) cùng một gốc legacy: 2 actors Learner/Admin (slide 3); catalog 10 FR/10 UC với placement=UC-09, badges=UC-10 (slide 8); AC "thuật toán SM-2" (slide 4); NFR `<500ms` + "24/7" (slide 9); kết luận "10 Use Cases, 22 sơ đồ" (slide 15); overclaims IEEE 830/"100%"/"mọi AC có test" (slide 14); notes trỏ puml đã xóa + docs/02 § cũ + "ERD 17 bảng khớp 100% Prisma" (notes 13). Điểm cộng: slide 17/21 methodology trung thực (N=15, 6+3 tách riêng, không suy rộng); slide 20 status M2+ trung thực — nhưng slide 15 cùng deck claim M2 đã ✓ xong (mâu thuẫn nội bộ). Chi tiết ở §§7,8,10,11,12,15.

## 6. Image / Diagram Audit

- Xem trực quan: chart Q8 khớp raw (8/7/0) nhưng montage 5-panel sai 3 điểm (SM-2 label; Q13 distribution 3★(2)/1-2★(1) vs raw 3★(1)/2★(1)/1★(1); panel Diff "46.7% (7)" không có trong raw; "Sắp xếp câu 46.7% (7)" vs raw 6/15=40.0%); `use-case-overview.png` legacy 10-UC/2-actor render rõ; `role-permission-matrix.png` khớp source kèm mũi tên misleading.
- Quality: 3 ảnh đã xem readable, không clipping/overlap/vỡ chữ. DPI chỉ suy từ `skinparam dpi 200` trong source, không đo được trên PNG render (ghi rõ, không claim).
- 45 orphan PNG legacy không verify source được (nguồn đã xóa). 4 puml quan trọng (lifecycle, progression, erd-logical, domain-model) thiếu PNG export.

## 7. Survey Consistency

- Số liệu 5 chỉ số chính trên slides (100/93.3/86.7/80.0/TB 4.13/66.7; điền từ 73.3; công việc 80.0; điểm số 66.7) khớp raw. LƯU Ý layout text-run: số đứng sau label ("Mục tiêu công việc"→80.0% ✓), đã đối chiếu kỹ, không sai.
- Lỗi: montage Q13 distribution sai; "Sắp xếp câu (7)" sai raw (6); panel Diff (7) không truy vết được; "sau 1–2 tuần" và "80% quên sau 24-48h" không có trong raw. Q4/Q23/Q24 classification mới không xuất hiện trên slides (không stale, nhưng slides chưa đồng bộ tri thức mới — INFERENCE: decks đóng băng ở era cũ).

## 8. Interview / Synthetic Evidence Consistency

- Slides 12/20/21/25/26: "9 phỏng vấn chuyên sâu", "N=9", demographics IV-SUPP-01 "SV Năm 4 ĐTVT" / 02 "Kỹ sư phần mềm CNTT" / 03 "Học viên TOEIC", "100%...; 83.3%..." (mẫu của 83.3% không xác định: 5/6 gốc hay 7-8/9 gộp — misleading). Không transcript trong repo. → HIGH.
- Main doc Phase 0 đã fix đúng (illustrative persona + limitation) nhưng presentation không phản ánh → drift.
- Synthetic: slides/report/diagrams không nhắc synthetic stakeholder research — không leakage (PASS), nhưng cũng không phân biệt ở đâu (không áp dụng vì không xuất hiện).

## 9. Benchmark / Citation Consistency

- Slide benchmark (Duolingo/Quizlet/Grammarly) và five-chapter (Duolingo/Memrise/Anki/Busuu/Cambridge/ELSA) khác scope main doc (Duolingo/Quizlet/ELSA + S1–S6): Grammarly/Memrise/Busuu/Cambridge không có trong benchmark chuẩn; claims không kèm source/DOI nào.
- Không slide nào dẫn S1–S6/DOI nên không sai citation trực tiếp; nhưng cũng không có S6/3.6x (không vi phạm). five-chapter §2.2 có câu guardrail tốt ("không suy rộng") — ghi nhận.

## 10. D1–D9 Consistency

- Slides/docx/report-legacy: không hề có D1–D9/Mapping A/Policy B/Controlled Retry/Streak-local-tz (thay bằng SM-2, placement CEFR, streak chung chung) → toàn bộ D1–D9 không được trình bày đúng ở presentation set.
- Diagrams hiện hành: lifecycle ✓, progression ✓ (Mapping A 6-band, allowance, 70%, ≥95%/24h, [1,3,7,14,30]), erd-logical ✓, domain-model ✓; role-permission-matrix MEDIUM (mũi tên Moderator→Admin "Ủy quyền xuất bản"); use-case-mvp-overview HIGH (Moderator→UC-10 thừa, thiếu Org→UC-10); sequence-content-publishing HIGH (Admin publish, vắng Organizational Manager); activity-content-approval HIGH ("Administrator hoặc Moderator xuất bản"); erd-mvp-learning MEDIUM (`audio_path` vs `audio_url`); sequence-lesson-completion LOW (thiếu retry); system-architecture-mvp LOW (gộp actor "Content & Operations Staff").

## 11. FR / NFR Consistency

- Slides/docx: catalog FR-01..FR-10/UC-01..UC-10 legacy (không phải P1-FR-001..017; placement/badges sai vị trí; thiếu SoD/publish/admin roles).
- NFR `<500ms` + "24/7" trình bày như measured (không TBD label) — mâu thuẫn kỷ luật TBD của baseline mới. Không có `success:false`/`details` trong artifacts (PASS).

## 12. Report ↔ Slide Consistency

- Slide số liệu chính ↔ raw: khớp (ngoại trừ chart errors §6). Report md legacy ↔ slides: khớp nhau (cùng era cũ) nhưng cùng stale so với baseline mới.
- Mâu thuẫn nội bộ: slide 15 (M2 ✓ xong) vs slide 20 (M2+ pending) trong cùng deck; "22 sơ đồ" (slide) vs "32 sơ đồ" (report md) vs 13 puml thực tế; "15 active" (slide) vs 17 entities applied (docs/07).

## 13. Diagram Source ↔ Export Consistency

- 7 PNG plantuml contemporary với source (mtime cùng đợt 08-09) — INFERENCE khớp, nhưng source chứa lỗi (§10) nên export cũng lỗi.
- 4 puml mới/sửa (lifecycle 15-09, progression 15-09, erd-logical 20-09, domain-model 20-09) thiếu PNG → diagrams đúng nhất lại chưa render để dùng.
- 45 orphan PNG: không source → UNVERIFIABLE (không dùng làm evidence).

## 14. Academic Integrity

Vi phạm trình bày: N=15 không bị nói quá thành population (slide 17/21 guard tốt — ghi nhận); nhưng: synthetic không xuất hiện (trung tính); quotes P1–P6 không xuất hiện trên slides (trung tính — demographics IV-SUPP mới là vấn đề); limitations bị giấu trong decks chính (chỉ bản Expanded/Target có slide 17/21); NFR `<500ms`/`24/7` như measured; "80% quên sau 24-48h" + Ebbinghaus gán ghép (slide + docx); "100%/không xung đột/mọi AC có test"; M2-done claims; chart numbers sai raw. → FAIL-góp phần.

## 15. Milestone Status Consistency

Slides không nhắc M2.1/M2.2 (dùng khung M1/M2 cũ) → không contamination trực tiếp; nhưng slide 15 claim "M2 ✓ (học từ vựng/audio, bài tập, SRS, viết kịch bản)" mâu thuẫn "M2.2 NOT STARTED + M2 pending" → misrepresentation HIGH (gộp PA-02). Không sửa M2.1.

## 16. Artifact Classification Table

| Path | Type | Status | Used In Final Presentation? | Drift | Evidence |
|---|---|---|---|---|---|
| report/Lingora-Project-1-Requirements-Presentation.pptx | PPTX 23 slides | SUPERSEDED (unlabeled) | YES (deck chính) | BLOCKER-class (PA-02..04) | §§5,7,8,15 |
| project-1/XÂY DỰNG...pptx | PPTX duplicate | DUPLICATE | NO (bản copy) | — | SHA256 trùng #1 |
| project-1/...-Expanded.pptx (27) | PPTX | SUPERSEDED (unlabeled) | MAYBE (bản đầy đủ nhất) | BLOCKER-class + slide 17/20 tốt | §§5,7 |
| project-1/...-Target-Defined.pptx (28) | PPTX | SUPERSEDED (unlabeled) | MAYBE | Như trên + slide 21 tốt | §§5,7 |
| report/...-Lecturer-Format-Final.docx | DOCX Final | SUPERSEDED (unlabeled) | YES (final nộp) | BLOCKER (PA-01) | §4 |
| 4 report .md | Markdown | HISTORICAL (labeled) | NO (tham khảo) | None hiện hành | §4 |
| report/evidence-register.md | Register | CURRENT SUPPORTING (NEEDS UPDATE) | YES | PA-11 MEDIUM | §4 |
| project-1/README.md | Index | CURRENT (NEEDS UPDATE refs) | YES | Trỏ stale artifacts | §4 |
| plantuml/ 4 puml đúng (lifecycle, progression, erd-logical, domain-model) | Source | CURRENT FINAL (source) | NO (thiếu export) | PA-10 MEDIUM | §10 |
| plantuml/ 5 puml OK-với-lưu ý (role-matrix, learner-journey, lesson-completion, sys-arch, sitemap) | Source | CURRENT SUPPORTING | PARTIAL | LOW/MEDIUM nhẹ | §10 |
| plantuml/ 4 puml lỗi (use-case-overview, sequence-publishing, activity-approval, erd-mvp) | Source | NEEDS UPDATE | YES (có png) | PA-05..07 | §10 |
| plantuml/ 7 .png | Export | CURRENT SUPPORTING (lỗi theo source) | YES | Theo source | §13 |
| report/diagrams/ 45 .png | Export | SUPERSEDED/UNVERIFIABLE | YES (report cũ) | Không dùng cho final mới | §§6,13 |

Kết luận phân loại: KHÔNG tồn tại CURRENT FINAL presentation artifact phản ánh baseline mới.

## 17. Findings

| ID | Severity | Artifact | Finding | Evidence | Impact | Required Action |
|---|---|---|---|---|---|---|
| PA-01 | BLOCKER | DOCX Final | Toàn diện stale, không nhãn historical: 2 actors, 10-UC legacy (placement 15–20 CEFR, badges UC-10), SM-2 ×nhiều, `<500ms`, `Admin/Teacher`, QuestionBank entities, "đồng nhất 100%", Next.js 14, PHẦN III/IV + Phụ lục A trống | FACT: trích xuất docx P30/P33/P52-P55/P63/P86/P101-P102/P116/P123-P125/P149-P162/P170-P175 | Final nộp misrepresent baseline | Viết lại/tái xuất từ baseline mới hoặc gắn SUPERSEDED + thay final mới |
| PA-02 | BLOCKER | 4 PPTX | Cùng gốc legacy: 2 actors, 10-UC catalog, SM-2 (slides 4/15/19), `<500ms`+24/7 (slide 9), M2 ✓ done (slide 15) vs M2 pending thực tế, overclaims slide 14 + notes | FACT: text extraction slides 3/4/8/9/14/15/notes 13 | Thuyết trình sai baseline + milestone | Cập nhật decks theo §§10–12 baseline hoặc tạo deck mới |
| PA-03 | HIGH | PPTX slides 21/25/26 | Interview "N=9" gộp 6+3, demographics IV-SUPP (trường/ngành/nghề), "100%/83.3%" mẫu không xác định, không transcript trong repo | FACT: text runs slides 21/25/26 | Fabricated-appearing evidence | Tách 6/3, bỏ demographics, ghi limitation như slide 17 |
| PA-04 | HIGH | PPTX slides 18/22/23 + DOCX P30 | "80% kiến thức bị quên sau 24-48h" (+Ebbinghaus) không có trong raw/không nguồn | FACT: text runs + raw Q8 (chỉ tần suất, không % quên theo giờ) | Unsupported numeric claim | Xóa hoặc thay bằng Q8 thực (8/7/0) |
| PA-05 | HIGH | 3 puml + png | Publish-role sai: sequence-content-publishing (Admin publish, vắng Org); activity-content-approval ("Admin hoặc Moderator xuất bản"); use-case-mvp-overview (Moderator→UC10, thiếu Org→UC10) | FACT: source lines đã dẫn | Diagram dạy sai D2/SoD | Sửa actor đúng baseline (Manager publish, Admin emergency) |
| PA-06 | HIGH | Slide 23/27/28 charts | Chart sai raw: panel Diff "46.7% (7)" không tồn tại trong Q21; "Sắp xếp câu (7)" vs raw 6/15; Q13 distribution sai (3★(2)/1-2★(1) vs 8/4/1/1/1); nhãn SM-2 | FACT: montage đã xem + recount Q13/Q17/Q21 | Chart trực quan sai dữ liệu | Vẽ lại charts từ raw + nhãn Policy B |
| PA-07 | MEDIUM | erd-mvp-learning.puml/.png | `audio_path` vs applied `audio_url` | FACT: line 60 vs migration 001 | Terminology drift trong diagram | Đổi `audio_url` |
| PA-08 | MEDIUM | role-permission-matrix puml/png | Mũi tên Moderator→Admin "Ủy quyền xuất bản (Approved)" gợi Moderator giao quyền publish cho Admin | FACT: render đã xem + source line 25 | Misleading SoD | Vẽ lại quan hệ publish qua Manager |
| PA-09 | MEDIUM | PPTX speaker notes | Trỏ puml đã xóa (use-case-overview, activity-*, dfd-*, erd-baseline) + docs/02 § cũ; overclaims ("ERD 17 bảng khớp 100% Prisma", "không xung đột", "mọi AC có test") | FACT: notes extraction slides 3/4/10/11/13/14 | Người trình bày đọc sai nguồn | Viết lại notes theo artifacts hiện hành |
| PA-10 | MEDIUM | Exports | 4 puml đúng nhất thiếu PNG; 45 orphan PNG legacy không verify source được | FACT: mtime + glob | Không có visual đúng để dùng | Render 4 PNG mới; loại orphan khỏi final set (không xóa file) |
| PA-11 | MEDIUM | evidence-register.md | UC mapping legacy (UC-09 placement, UC-10 badges); dẫn `docs/phỏng_vấn.docx` vắng mặt; Q22 "luyện viết 8/15" gán nhãn sai | FACT: lines 64-72/78/116-117 | Register hiện hành sai lệch | Cập nhật mapping canonical + sửa dẫn nguồn |
| PA-12 | MEDIUM | Cross-artifact | Numbering: "22 sơ đồ" vs "32 sơ đồ" vs 13 puml; "15 active" vs 17 entities; benchmark scope slide (Grammarly/Memrise/Busuu) vs main doc (Duolingo/Quizlet/ELSA) không nguồn | FACT: slides 2/15, md, five-chapter §2.2 | Rối số liệu thuyết trình | Chuẩn hóa theo baseline + ghi nguồn benchmark |
| PA-13 | LOW | system-architecture-mvp, sequence-lesson-completion | Gộp actor "Content & Operations Staff"; sequence thiếu retry semantics ("hoàn thành kèm điểm số" dễ gợi score-gate) | FACT: source lines | Simplification rủi ro thấp | Tách actor / bổ sung retry note |
| PA-14 | LOW | Index + slide nội bộ | README trỏ stale artifacts; slide 15 vs slide 20 mâu thuẫn M2 trong cùng deck | FACT: README lines 27-29; slides 15 vs 20 | Điều hướng sai | Cập nhật index + thống nhất slide 15 theo slide 20 |

Slide 17/21 (methodology trung thực), chart Q8 đơn, quality render 3 ảnh đã xem: PASS — ghi nhận, không finding.

## 18. Required Fix Scope

Tạo presentation fix plan riêng (ngoài task này): (1) quyết định final set (deck mới từ baseline mới hay nâng cấp deck Target-Defined 28 slides — khuyến nghị deck mới vì delta quá lớn); (2) viết lại DOCX Final từ main doc Phase 0 đã PASS (kèm banner trạng thái + phụ lục thật); (3) sửa 4 puml PA-05/PA-07/PA-08 + render đủ 13 PNG (200 DPI) + loại orphan khỏi final set; (4) vẽ lại charts từ raw (bỏ Diff-7, sửa sắp xếp 6, Q13 đúng, nhãn Policy B); (5) viết lại speaker notes + numbering + benchmark có nguồn; (6) cập nhật evidence-register + README index; (7) gate: re-audit presentation trước khi dùng. Không đụng 7 LOW residuals của main doc trừ khi chúng xuất hiện gây hiểu sai (không phát hiện trường hợp nào — Q4/Q23/Q24 mới không có trên slides).

## 19. Final Verdict

**`FAIL`** — presentation set hiện hành (đặc biệt DOCX `Final` và PPTX decks) misrepresent material Phase 0 baseline cuối cùng trên roles, UC catalog, placement, SRS, NFR, interview evidence, charts và milestone; diagrams publish-role sai; không có CURRENT FINAL artifact nào dùng được. Phase 0 Research/FR/NFR verdict (`PASS WITH NON-BLOCKING FINDINGS`) được giữ nguyên theo §25. Bước kế tiếp (task riêng): presentation fix plan → sửa → re-audit. STOP.

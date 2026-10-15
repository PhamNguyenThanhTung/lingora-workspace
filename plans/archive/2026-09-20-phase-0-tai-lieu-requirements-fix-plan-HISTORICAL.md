# Plan: Khắc phục findings review tài liệu `tai-lieu-phan-tich-yeu-cau.md` (slide-readiness)

## Status

`DONE` — đã IMPLEMENT + TEST + LOG xong ngày 2026-09-20 (human phê duyệt trong chat). Chưa COMMIT (chờ human yêu cầu rõ).

## 1. Objective

Khắc phục các findings P2/P3 từ review ngày 2026-09-20 để `docs/tai-lieu-phan-tich-yeu-cau.md` đủ điều kiện làm nguồn nội dung slide, trong khi giữ nguyên canonical baseline (main doc Phase 0 + D1–D9 + ADR).

Quyết định đã được user phê duyệt trước (ghi nhận, không cần approve lại):
- **N=35 / N=3 / thực nghiệm 01 bài: chấp nhận trạng thái PENDING-EVIDENCE.** User bổ sung file raw sau (follow-up riêng). Cho đến lúc đó: (a) slide gắn nhãn `sơ bộ, chưa kiểm chứng độc lập` hoặc (b) loại khỏi slide. Không trình bày như verified data.

## 2. Files Expected To Change (duy nhất)

1. `docs/tai-lieu-phan-tich-yeu-cau.md` — các sửa liệt kê §3.
2. `logs/test-log.md`, `logs/development-log.md` — chỉ ở LOG gate (ghi evidence verification).

Không chạm: main doc Phase 0, baseline D1–D9, schema/migration/code, M2.1, `plans/current-task.md`. Nếu phát sinh file ngoài danh sách → dừng, trả task về REVIEW.

## 3. Fixes (theo finding)

### R-01 — Thống nhất semantics offline-save (P2, bắt buộc trước slide)
- Vị trí: §8.1(3) dòng ~418; rà soát §4.7 bước 5 + YC-CORE-07.
- **Hướng đề xuất (Option A — khuyến nghị):** theo canonical main doc (B17/NFR-REL, P1-FR-006): trình duyệt lưu tạm đáp án trong phiên + tự thử lại; không ghi nhận hoàn thành khi chưa xong.
  - Sửa §8.1(3) thành: cho phép lưu tạm câu trả lời trên thiết bị trong phiên; khi mất mạng báo thân thiện, không ghi hoàn thành dở dang, tự đồng bộ khi có mạng.
- Option B (không khuyến nghị): giữ nguyên tai-lieu → khi đó phải sửa main doc baseline, cần ADR + approval riêng. Không làm trong task này.
- **Cần human chốt Option A/B ở Approval (§7).**

### R-02 — Chuẩn hóa 5 dạng bài ADR-006 (P2)
- Vị trí: §3.3.1 phiếu giao việc (~dòng 142: "theo 4 dạng"), §3.3.2 (~dòng 169), YC-CORE-03 (~dòng 333: "theo 4 dạng chuẩn"), §4.3 bước 4 (~dòng 227: liệt kê 4 dạng), §4.9 bước 2–3 (~dòng 299/302: "đủ 4 dạng").
- Sửa: mọi chỗ "4 dạng" → 5 dạng `Trắc nghiệm (MCQ), Điền từ (FILL_BLANK), Sắp xếp (REORDER), Nghe nhận diện (LISTENING), Ngữ pháp (GRAMMAR)` + yêu cầu `rule_explanation` cho dạng ngữ pháp (khớp ADR-006/P1-FR-012).

### R-04 — Mapping YC ↔ P1-FR/UC/BF (P2, bắt buộc trước slide)
- Thêm bảng ánh xạ trong §7 (cuối ma trận) + 1 câu tuyên bố: file này là supporting doc, canonical là main doc Phase 0.
- Mapping đề xuất:
  | YC | P1-FR / UC / BF |
  |---|---|
  | YC-CORE-01 | P1-FR-001 / UC-01 |
  | YC-CORE-02 | P1-FR-008 / UC-08 |
  | YC-CORE-03 | P1-FR-003/008/009 / UC-08 |
  | YC-CORE-04 | P1-FR-008 / UC-09 |
  | YC-CORE-05 | P1-FR-008 / UC-10 |
  | YC-CORE-06 | P1-FR-008 (D3) / UC-08+UC-10 |
  | YC-CORE-07 | P1-FR-002/003/004 / UC-04+UC-05 |
  | YC-CORE-08 | P1-FR-005/006 / UC-06 |
  | YC-CORE-09 | P1-FR-016 / UC-03 (+ chèn Mapping A 6 bands 0–7/8–12/13–17/18–22/23–26/27–30) |
  | YC-CORE-10 | P1-FR-011/014/015 / UC-07+UC-02 |
  | YC-CORE-11 | P1-FR-004/011 / UC-07 |
  | YC-CORE-12 | P1-FR-001 / UC-11 |
  | YC-EXT-01 | P1-FR-007 (GEC TARGET) |
  | YC-EXT-02 | P1-FR-017 (badges P2) |
  | YC-EXT-03 | UC-15 (cohort) |
  | YC-EXT-04 | UC-14 (support ticket) |
  | YC-EXT-05 | NFR-AUD / AuditLog |
  | YC-EXT-06 | P1-FR-010 (i18n) |
  | YC-EXT-07 | P1-FR-015 (xem R-05) |
  | YC-EXT-08 | Proposal mới, chưa có P1-FR (ghi rõ cần baseline decision nếu vào MVP) |
- Bổ sung vào YC-CORE-07: công thức D7 (`allowance = max(1, floor(N*0.10))`, credit 70%, không threshold).

### R-05 — YC-EXT-07 email reminder vs ADR-008 (P2, REVIEW)
- Không xóa YC-EXT-07 (đã gắn EXT/proposal). Thêm cảnh báo rõ: "chưa đối chiếu ADR-008 (no server-side delivery); cấm đưa vào slide MVP; chỉ xem xét sau privacy/ADR review".
- **Cần human xác nhận cách xử lý ở Approval (§7)** (giữ-cảnh-báo / hạ mức / loại bỏ).

### NFR numbers (P2)
- §6.3: thay các số "dưới 1 giây / 3 giây / 99.5%" bằng tham chiếu canonical main doc §6.2 (API ≤800ms P95 TBD, GEC ≤3000ms TBD, 99.5% TBD, chuyển ngữ ≤200ms TBD), giữ văn phong business-level. Không bịa số mới.

### R-06 (P3)
- YC-EXT-01: bổ sung điều kiện chặn — "không vào slide MVP cho đến khi có privacy review cho third-party NLP".

### R-07 (P3)
- Q24: ghi rõ "ai" xếp nhóm thực chất (tổng 4: đối thoại tự nhiên, giao tiếp, AI + 1). §4.5 "Unit hiển thị khi đủ 4 bài": đối chiếu `docs/08-english-a1-curriculum.md` trong lúc implement; nếu không có căn cứ thì gắn nhãn đề xuất của nhóm.

## 4. Test Plan (doc-only verification)
1. Re-read toàn file sau sửa, đối chiếu checklist R-01..R-07.
2. Grep: `4 dạng chuẩn` → 0 hit; `IN_REVIEW → PUBLISHED` → 0 hit; `Mapping A` present ở YC-CORE-09; `max(1, floor(N` present ở YC-CORE-07.
3. Recount lại mọi k/15, k/35 trích dẫn sau sửa (đặc biệt Q-section không được đụng tới).
4. `git diff --stat` + line-count check.
- Verdict cho doc-task: `N/A — documentation-only, verified by re-read + grep + recount` (không ghi PASS suy diễn). Ghi `logs/test-log.md` theo evidence format (Environment/Command/Output/Verdict) + `logs/development-log.md`.

## 5. LOG → COMMIT
- Chỉ commit sau TEST + LOG xong, message Conventional Commits, không amend/force-push, không động secrets. Commit chỉ thực hiện khi user yêu cầu rõ (mặc định dừng sau LOG).

## 6. Risks
- R-01/R-05 cần quyết định ngữ nghĩa của human — nếu human đổi hướng, cập nhật §3 rồi mới implement.
- Không để mapping YC↔P1-FR tạo requirement mới (YC-EXT-08 giữ nguyên proposal).

## 7. Approval (human điền)

- [ ] Đồng ý Option A cho R-01 (theo canonical main doc). Nếu không, ghi hướng khác: __________
- [ ] Đồng ý cách xử lý R-05 (giữ + cảnh báo + cấm slide MVP).
- [ ] Chuyển status task này sang `APPROVED` để implement. Người duyệt + ngày: __________

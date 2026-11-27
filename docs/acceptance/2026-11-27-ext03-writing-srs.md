# Nghiệm thu local & hồ sơ rollout EXT-03 — Writing SRS

- **Ngày:** 2026-11-27
- **Nhánh:** `test/ext03-writing-srs` (từ `origin/main` @ `5e83429`)
- **Trạng thái:** `LOCAL_PASS / PUBLIC_NOT_ACCEPTED / FLAG_OFF`
- **Phạm vi:** Chỉ bổ sung test và tài liệu nghiệm thu theo `plans/2026-11-27-package-c-proposal.md` §3 và §7. Không sửa source code ứng dụng (`lingora-web/src/*`), không tạo migration, không đặt biến môi trường trên Vercel/Preview/Production, không dùng credential production.

---

## 1. Môi trường kiểm tra (Bước 1 — Local)

- **DB:** PostgreSQL disposable local qua `scripts/local-test-db.mjs` (`SLICE11_TEST_DATABASE_OWNED=1`).
- **Trình duyệt E2E:** Playwright Chromium headless, kiểm tra viewport desktop (`1280×800`) và mobile (`375×812`), kiểm tra không tràn ngang (`scrollWidth <= innerWidth`).
- **Cờ tính năng trong test:** Các test mới tự đặt `WRITING_SRS_ENABLED` / `WRITING_SRS_LEARNER_IDS` theo từng ca và khôi phục trong `try / finally`; các suite ở §3.4 được chạy với `WRITING_SRS_ENABLED=true` và `WRITING_SRS_LEARNER_IDS` trỏ tới UUID của fixture. `.env.example` vẫn giữ mặc định tắt (`false` và danh sách rỗng).

---

## 2. Kết quả 5 ca nghiệm thu (§3.2 Bước 1)

| Ca | Mô tả | Bằng chứng kiểm thử | Kết quả |
|---|---|---|---|
| Ca 1 | Học viên ngoài allowlist (`WRITING_SRS_ENABLED=true`, UUID không nằm trong `WRITING_SRS_LEARNER_IDS`): không có thẻ WRITING trong phiên, gọi thẳng `POST /api/srs/sessions/[id]/writing-attempts` nhận `404` (`NOT_FOUND`). | `lingora-web/tests/feature/srs-sessions-routes.test.mjs` (`EXT-03 Ca 1`), `lingora-web/tests/feature/srs-sessions-postgres.test.mjs` (`EXT-03 Ca 1 & Ca 2`), `lingora-web/tests/feature/writing-practice-e2e.test.mjs` (`EXT-03 E2E` qua HTTP thật). | PASS |
| Ca 2 | `WRITING_SRS_ENABLED=false` dù UUID có mặt trong `WRITING_SRS_LEARNER_IDS`: vẫn tắt, không khởi tạo hay xếp thẻ WRITING, gọi thẳng trả `404` (`NOT_FOUND`). | `lingora-web/tests/feature/srs-sessions-routes.test.mjs` (`EXT-03 Ca 2`), `lingora-web/tests/feature/srs-sessions-postgres.test.mjs` (`EXT-03 Ca 1 & Ca 2`). | PASS |
| Ca 3 | Học viên trong allowlist ôn hết một vòng, đủ 4 mức đánh giá (`AGAIN`, `HARD`, `GOOD`, `EASY`), lịch ôn MEANING (`SrsCard.dueAt`, `stage`, `SrsMemoryState(MEANING)`) không bị ảnh hưởng. | `lingora-web/tests/feature/srs-writing-scheduler.test.mjs`, `lingora-web/tests/feature/srs-sessions-postgres.test.mjs` (`EXT-03 Ca 3`), `lingora-web/tests/feature/writing-practice-e2e.test.mjs` (4 nút đánh giá hiển thị và hoàn tất phiên). | PASS |
| Ca 4 | Gửi lại cùng một lượt viết (retry khi mất phản hồi hoặc double-submit đồng thời cùng `operationKey`): không ghi hai lần, trả cùng kết quả idempotent. | `lingora-web/tests/feature/srs-sessions-postgres.test.mjs` (`S6-09`, `S6-10.2c`, `EXT-03 Ca 4`), `lingora-web/tests/feature/writing-practice-e2e.test.mjs` (lost-response retry giữ nguyên `evidenceId`), `lingora-web/tests/feature/review-components.test.mjs` (`S6-10.2e`). | PASS |
| Ca 5 | Đang giữa phiên mà bị gỡ khỏi allowlist (`WRITING_SRS_LEARNER_IDS`) hoặc tắt cờ: thẻ WRITING bị bỏ qua, không lỗi 500, không mất tiến độ MEANING. | `lingora-web/tests/feature/srs-sessions-postgres.test.mjs` (`S6-10.2d`, `EXT-03 Ca 5` cả trường hợp còn thẻ MEANING phía sau lẫn thẻ WRITING ở cuối phiên), `lingora-web/tests/feature/review-components.test.mjs` (`S6-10.2d`). | PASS |

---

## 3. Ảnh chụp màn hình ôn viết (Desktop & Mobile)

Chụp từ bản build production (`next build` + `next start`) trong `lingora-web/tests/feature/writing-practice-e2e.test.mjs`:

| Màn hình | Viewport | Tràn ngang | File ảnh |
|---|---|---|---|
| Nhắc nghĩa + khung vẽ viết (Desktop) | `1280×800` | Không | `docs/acceptance/screenshots/ext03-writing-srs-prompt-desktop.png` |
| Kết quả chấm từng ký tự + 4 mức ôn FSRS (Desktop) | `1280×800` | Không | `docs/acceptance/screenshots/ext03-writing-srs-revealed-desktop.png` |
| Nhắc nghĩa + khung vẽ viết (Mobile) | `375×812` | Không (`scrollWidth <= innerWidth`) | `docs/acceptance/screenshots/ext03-writing-srs-prompt-mobile.png` |
| Kết quả chấm từng ký tự + 4 mức ôn FSRS (Mobile) | `375×812` | Không (`scrollWidth <= innerWidth`) | `docs/acceptance/screenshots/ext03-writing-srs-revealed-mobile.png` |

---

## 4. Lệnh gate đã chạy (§3.4)

Tất cả các lệnh chạy từ root của worktree `/home/tung/workspace/school/project1/lingora-c3`:

| Lệnh | Biến môi trường sử dụng | Kết quả |
|---|---|---|
| `npm run typecheck` | — | PASS |
| `npm run test:feature` | `WRITING_SRS_ENABLED=true`, `WRITING_SRS_LEARNER_IDS=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` | PASS |
| `npm run test:components` | `WRITING_SRS_ENABLED=true`, `WRITING_SRS_LEARNER_IDS=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa` | PASS |
| `npm run test:integration:srs` | `WRITING_SRS_ENABLED=true`, `WRITING_SRS_LEARNER_IDS=33333333-0000-4000-8000-000000000001` | PASS (45/45) |
| `npm run test:e2e:srs` | `WRITING_SRS_ENABLED=true`, `WRITING_SRS_LEARNER_IDS=33333333-0000-4000-8000-000000000001` | PASS |
| `npm run test:integration:writing` | `WRITING_SRS_ENABLED=true`, `WRITING_SRS_LEARNER_IDS=33333333-0000-4000-8000-000000000001` | PASS (6/6) |
| `npm run test:e2e:writing` | `WRITING_SRS_ENABLED=true`, `WRITING_SRS_LEARNER_IDS=<srsLearnerId trong fixture>` (đặt trong test) | PASS (5/5) |

---

## 5. Quy trình Cohort thử nghiệm & Checklist Bước 3 (Chủ dự án tự thực hiện)

### Bước 2 — Cohort thử nghiệm (chủ dự án quyết định)
- Chọn 1–3 tài khoản học viên **thử** (ví dụ tài khoản của chủ dự án) có thẻ SRS tiếng Nhật và dùng ký tự **đã có nét chữ** (`CharacterStrokeData`).
- Bật `WRITING_SRS_ENABLED=true` và `WRITING_SRS_LEARNER_IDS=<UUID cohort>` trên **Preview deployment** trước; **không** bật ngay trên production.

### Bước 3 — Checklist trước khi bật trên production (chủ dự án tự tick)
- [ ] Bước 1 PASS trên đúng SHA sẽ deploy.
- [ ] Các ký tự trong bài của cohort đều có nét chữ với nguồn và giấy phép đã duyệt (phụ thuộc Q-C4).
- [ ] Đã ghi lại danh sách UUID cohort, deployment ID và ngày bật.
- [ ] Đã kiểm trên production: tài khoản ngoài allowlist không thấy tính năng, tài khoản trong allowlist ôn hết một vòng, retry không ghi đôi.
- [ ] Có cách tắt: đặt `WRITING_SRS_ENABLED=false` rồi redeploy. Dữ liệu `SrsMemoryState` của WRITING vẫn giữ nguyên, không cần xoá.

> **Lưu ý rollout:** Production hiện giữ trạng thái `FLAG_OFF` (`PUBLIC_NOT_ACCEPTED`) cho tới khi chủ dự án tự bật biến môi trường trên Vercel và có bằng chứng kiểm tra production. Việc chưa bật Writing SRS **không chặn** việc release UI hay meaning SRS. Thuật toán lịch ôn giữ nguyên `FSRS_6_TS_FSRS_5_4_2`.

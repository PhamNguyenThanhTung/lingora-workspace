# ACC-04 — Hồ sơ Evidence Slice 12 (Xác nhận Email Cross-Device)

Ngày soạn khung hồ sơ: 2026-11-27 · Luồng: **L4 — Chỉ đọc** · Spec tham chiếu: [`plans/2026-11-21-slice-12-cross-device-confirmation.md`](../../plans/2026-11-21-slice-12-cross-device-confirmation.md) và [`plans/2026-11-27-mvp-acceptance-and-gamified-ui-spec.md`](../../plans/2026-11-27-mvp-acceptance-and-gamified-ui-spec.md) (§3.1 Q5, §13 ACC-04, §19.2).

## 1. Trạng thái hiện tại (trước khi chủ dự án điền bổ sung)

- **Code trên `origin/main`:** PR #1 (`c2fb319`) đã triển khai luồng `GET /auth/confirm?token_hash=...&type=email` (303 sang `/auth/verify`, **không** đốt token), trang `/auth/verify` với form `POST /auth/confirm` (`verifyOtp` + `signOut({ scope: 'local' })` → `/login?confirmed=1`), và `POST /api/auth/resend-confirmation`.
- **Chủ dự án báo cáo (27/11/2026):** đã tự đăng ký bằng email thật trên production và xác nhận thành công. Không chạy thêm lượt đăng ký email thật từ agent và không chỉnh SMTP.
- **Trạng thái đóng hồ sơ hiện tại:** **`OWNER_REPORTED / EVIDENCE_PENDING`** — sau khi chủ dự án điền các ô trống ở Mục 2 bên dưới (ngày thử, deployment/SHA và ảnh/ghi chú đã che token/email nhạy cảm nếu có), mục Slice 12 chuyển sang **`PUBLIC_PASS (owner-tested)`**.

## 2. Mẫu điền evidence cho lượt thử thật của chủ dự án

*(Chủ dự án điền vào các ô `[...]` bên dưới; tuyệt đối không dán `token_hash`, link xác nhận sống, cookie hoặc email cá nhân nếu không muốn lưu vào repo.)*

```text
Requirement/Test ID: ACC-04 / Slice 12 — Đăng ký mới & xác nhận email cross-device (production)
Người thực hiện: Chủ dự án (owner-tested)
Ngày / giờ thử (Asia/Ho_Chi_Minh): [ĐIỀN NGÀY/GIỜ THỬ, vd: 2026-11-27 ...]
Deployment / URL / Source SHA: https://lingora-learner-dev.vercel.app (deployment ID: [ĐIỀN NẾU CÓ], source SHA: [ĐIỀN SHA HOẶC >= c2fb319])
Môi trường / trình duyệt / thiết bị:
  - Đăng ký (Thiết bị/Trình duyệt A): [ĐIỀN, vd: Desktop Chrome / ...]
  - Mở email & bấm xác nhận (Thiết bị/Trình duyệt B): [ĐIỀN, vd: Điện thoại / trình duyệt khác / cùng trình duyệt]
Email template Supabase Dashboard: đã chuyển sang {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email ([XÁC NHẬN CÓ/KHÔNG])
Fixture (ID không nhạy cảm): Tài khoản thử mới của chủ dự án (đã che email/PII)
Expected:
  1. Đăng ký ở /register thành công, nhận được email xác nhận.
  2. Mở link trong email đi qua /auth/confirm -> /auth/verify (nút "Xác nhận email", không tự đốt token ở GET).
  3. Bấm nút xác nhận (POST /auth/confirm) chuyển tới /login?confirmed=1.
  4. Đăng nhập bằng mật khẩu thành công → vào onboarding → vào /home đúng ngữ cảnh học.
Actual: Chủ dự án xác nhận đã đăng ký bằng email thật và xác nhận thành công trên production. [ĐIỀN CHI TIẾT QUAN SÁT THÊM NẾU CÓ: trang /auth/verify, /login?confirmed=1, onboarding -> /home]
Ảnh/log đã che dữ liệu nhạy cảm: [ĐIỀN ĐƯỜNG DẪN ẢNH TRONG docs/acceptance/screenshots/ HOẶC "Không kèm ảnh"]
Kết quả: [ĐỔI THÀNH PUBLIC_PASS (owner-tested) SAU KHI ĐIỀN NGÀY & XÁC NHẬN]
Giới hạn còn lại: Không cấu hình SMTP riêng (theo quyết định §3.1). Các ca edge (link hết hạn, dùng lại, scanner prefetch) xác minh bằng suite local bên dưới.
```

## 3. Ranh giới kiểm thử local (cần chạy lại trên SHA tích hợp ở M4)

Lượt thử thật của chủ dự án chứng minh luồng happy-path trên production, không thay thế kiểm tra hồi quy local cho các nhánh lỗi bảo mật/chống quét link. Tại mốc tích hợp cuối (M4), cần chạy và ghi kết quả thực tế cho các suite đã có trên `origin/main`:

| Suite / Lệnh (`lingora-web`) | Phạm vi kiểm tra | Trạng thái trên phiên bản L4 |
|---|---|---|
| `npm run test:feature -w @lingora/lingora-web` | Gồm `auth-registration.test.mjs`, `confirmation-transport.test.mjs`, `confirmation-cross-device.test.mjs` (validate `token_hash`/`type`, `GET` không gọi `verifyOtp`, `POST` same-origin, link hết hạn/`otp_expired`, dùng lại token, `resend-confirmation` chống dò email & 429) | `NOT_RUN` (L4 chỉ đọc, chờ chạy ở M4 trên SHA tích hợp) |
| `npm run test:components -w @lingora/lingora-web` | Gồm `register-components.test.mjs`, `confirmation-verify-components.test.mjs` (render `/auth/verify` và form `ResendConfirmationForm`) | `NOT_RUN` (L4 chỉ đọc, chờ chạy ở M4 trên SHA tích hợp) |
| `npm run test:browser:confirmation -w @lingora/lingora-web` | `tests/feature/confirmation-browser.mjs` (synthetic provider đếm lượt `POST /auth/v1/verify`, giả lập scanner/prefetch ở GET rồi người dùng xác nhận thật) | `NOT_RUN` (L4 chỉ đọc, chờ chạy ở M4 trên SHA tích hợp) |

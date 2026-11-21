# Slice 12 — Xác nhận email mở được trên thiết bị khác (cross-device)

Spec thực thi ngày 2026-11-21. Gói: **S12-XDEVICE**. Người thực hiện: Anti, gọi qua `agy`. Review và nghiệm thu cuối: Claude (root).
Baseline: `origin/main` `fcfaee1` cùng working tree local hiện tại. Working tree đang có thay đổi chưa commit của các lane khác, phải giữ nguyên.

## 1. Bối cảnh và nguyên nhân

- Email xác nhận hiện gửi link kiểu PKCE: `/auth/confirm?code=...`. Để đổi `code` lấy session, SDK cần cookie `*-code-verifier` nằm trên **đúng trình duyệt đã đăng ký**. Mở link ở điện thoại, ở app mail khác hoặc ở trình duyệt khác thì sẽ hỏng. Lượt public ngày 04/11 còn gặp `flow_state_expired` (HTTP 422) sau khoảng 25 phút, vì flow state của PKCE có hạn ngắn hơn OTP email.
- Route [`lingora-web/src/app/auth/confirm/route.ts`](../lingora-web/src/app/auth/confirm/route.ts) **đã có nhánh `token_hash` + `verifyOtp({ token_hash, type })`**. Nhánh này không cần verifier nên dùng được trên thiết bị khác. Có điều email template chưa bao giờ gửi `token_hash`.
- Nhánh `token_hash` hiện **tiêu thụ token ngay ở GET**. Trình quét link của mail (Outlook Safe Links, antivirus, preview) có thể "mở trước" và đốt token dùng một lần. Khi đó người dùng thật bấm vào sẽ nhận `otp_expired`.
- Chưa có cách **gửi lại email xác nhận** khi link hết hạn.

## 2. Mục tiêu

Learner đăng ký ở thiết bị A, mở link trong email ở thiết bị hoặc trình duyệt B (không có cookie nào của A), bấm xác nhận và thấy `/login?confirmed=1`. Sau đó đăng nhập bằng mật khẩu thành công trên B hoặc A, Account `LEARNER/ACTIVE` được bootstrap và vào được onboarding → Home.

## 3. Quyết định thiết kế (đã chốt, không tự đổi)

| # | Quyết định |
|---|---|
| D1 | Email template sẽ trỏ tới `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. `RedirectTo` là `emailRedirectTo` = `${origin}/auth/confirm` do register route gửi, nên mỗi deployment tự đúng origin. **Thay template là việc của chủ dự án trên Supabase Dashboard, Anti không làm.** |
| D2 | **GET không tiêu thụ token.** `GET /auth/confirm?token_hash&type` validate rồi trả `303` sang trang `/auth/verify?token_hash=…&type=…`. Trang này hiển thị nút "Xác nhận email". Chỉ khi người dùng bấm nút (form `POST /auth/confirm`) mới gọi `verifyOtp`. |
| D3 | Nhánh `GET ?code=` (PKCE) **giữ nguyên hành vi** cho các link cũ đã gửi. Không xóa, không đổi log hay diagnostic. |
| D4 | Sau khi `verifyOtp` thành công ở POST, gọi `supabase.auth.signOut({ scope: 'local' })`. Response xóa cookie session rồi `303 /login?confirmed=1`. Lý do: giữ hợp đồng "xác nhận rồi đăng nhập bằng mật khẩu", và không để lại session trên thiết bị mượn. Nếu signOut lỗi, vẫn redirect `confirmed=1` (email đã xác nhận) và không ném lỗi. |
| D5 | `type` chỉ nhận `email` hoặc `signup`. Mọi type khác (`recovery`, `invite`, `magiclink`, `email_change`…) → `invalid_confirmation_type`. |
| D6 | `token_hash` hợp lệ khi là chuỗi dài 1–512, chỉ gồm `[A-Za-z0-9_-]` (cho phép tiền tố `pkce_`). Sai định dạng → `/login?error=missing_confirmation_token` mà không gọi provider. |
| D7 | Thêm `POST /api/auth/resend-confirmation` với body `{ email }`. Endpoint gọi `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: origin + '/auth/confirm' } })` và **luôn trả cùng một body 200 chung chung**, kể cả khi email không tồn tại hoặc đã xác nhận, để chống dò email. Chỉ map riêng rate limit → 429 và lỗi provider → 503. |
| D8 | Không đổi schema/Prisma/migration, không đổi app Staff (`lingora-admin`), không đổi `bootstrapLearnerAccount`, không thêm `next=`/open redirect. Mọi đích redirect đều cố định, cùng origin. |

## 4. Phạm vi việc

### 4.1 `GET /auth/confirm` (sửa)

File: `lingora-web/src/app/auth/confirm/route.ts`.

- Thứ tự kiểm tra **giữ nguyên**: `error`/`error_code` → `code` → `token_hash` → thiếu token.
- Nhánh `token_hash`:
  - Kiểm tra `type` (D5) và định dạng (D6).
  - Trả `303` tới `new URL('/auth/verify', origin)` kèm đúng hai query `token_hash` và `type`, không thêm tham số nào khác.
  - **Không** tạo Supabase client, không gọi `verifyOtp`.
  - Header `no-store, private` qua `buildAuthResponseHeaders`, cùng `Referrer-Policy: no-referrer`.
- Không log `token_hash`, URL hay message lỗi của SDK.

### 4.2 Trang `/auth/verify` (mới)

File mới: `lingora-web/src/app/auth/verify/page.tsx`. Có thể tách thêm component client nếu cần trạng thái pending.

- Server component, `dynamic = 'force-dynamic'`, metadata `robots: noindex`.
- Đọc `searchParams`. Nếu token hoặc type sai (D5/D6) thì hiển thị thông báo lỗi, link về `/login` và form gửi lại email (4.5), **không** render form xác nhận.
- Nếu hợp lệ, hiển thị tiêu đề "Xác nhận email", một câu giải thích ngắn và `<form method="post" action="/auth/confirm">`. Form có hai `<input type="hidden">` (`token_hash`, `type`) và nút submit "Xác nhận email". Nút bị khóa khi pending để tránh bấm hai lần.
- Không tự submit bằng JS. Đây chính là cơ chế chống quét link.
- Dùng style và layout của trang `/login` / `/register` hiện có (CSS class sẵn có, font Lato). Không thêm thư viện. Chạy tốt ở 360/390px.
- Không đưa `token_hash` vào text hiển thị, log hay analytics. Page response phải `no-store`. Nếu App Router không cho đặt header trên page, đặt qua `proxy.ts` cho path `/auth/verify`, hoặc ghi rõ cách đã làm.

### 4.3 `POST /auth/confirm` (mới, cùng file route)

- Chỉ nhận `application/x-www-form-urlencoded`. Content-type khác → `303 /login?error=missing_confirmation_token`. Đây là luồng form của trình duyệt, nên trả redirect chứ không trả JSON.
- Same-origin: dùng `validateSameOrigin(request)` có sẵn. Đọc code để chắc hàm chấp nhận form POST có header `Origin` cùng origin. Sai origin → `303 /login?error=confirmation_failed`, không gọi provider.
- Validate `token_hash`/`type` theo D5/D6.
- Gọi `verifyOtp({ token_hash, type })`, kết quả xử lý như sau:
  - **Thành công:** làm theo D4, rồi `303 /login?confirmed=1`.
  - **Lỗi:** gọi `logConfirmationFailure('otp_verify', error, null)`, rồi `303 /login?error=confirmation_failed`. Thêm `otp_expired` vào `SAFE_CONFIRMATION_ERROR_CODES`.
  - **Lỗi provider hoặc mạng** (`isProviderAvailabilityError`): `303 /login?error=service_unavailable`.
- Chuyển tiếp cookie và header đã refresh như nhánh GET hiện có. Header `no-store, private`.

### 4.4 Thông báo trên `/login`

File: `lingora-web/src/app/login/LoginForm.tsx`. File này đang có diff local, **phải giữ nguyên diff đó**.

- Viết lại thông báo `confirmation_failed`: "Liên kết xác thực không hợp lệ hoặc đã hết hạn. Nếu bạn đã xác nhận trước đó, hãy đăng nhập. Nếu chưa, hãy gửi lại email xác nhận bên dưới." Bỏ câu gợi ý "mở trên thiết bị khác".
- Thêm thông báo cho `service_unavailable`.
- Khi URL có `error=confirmation_failed` hoặc `missing_confirmation_token`, hiển thị khối "Gửi lại email xác nhận" (4.5).
- Khi đăng nhập trả 403 kiểu "chưa xác thực email" (FORBIDDEN của bootstrap), cũng hiển thị khối gửi lại, điền sẵn email đã nhập.

### 4.5 Gửi lại email xác nhận

Route mới: `lingora-web/src/app/api/auth/resend-confirmation/route.ts`.

- Kiểm tra theo đúng mẫu của `register/route.ts`:
  - same-origin → 403 `FORBIDDEN_ORIGIN`
  - `application/json` → 415
  - JSON hỏng → 400
- Zod schema dùng lại phần `email` của `registerSchema` (trim, lowercase, email, max 255), `.strict()`.
- Body thành công cố định: `{ ok: true, message: 'Nếu email đã đăng ký và chưa xác thực, chúng tôi đã gửi lại liên kết xác nhận. Vui lòng kiểm tra hộp thư.' }`.
- Response trả về theo từng trường hợp:
  - **Thành công**, hoặc lỗi kiểu user không tồn tại / đã xác nhận: trả body thành công cố định, status 200.
  - **Rate limit** (`over_email_send_rate_limit`, `over_request_rate_limit`): 429 `RATE_LIMITED`.
  - **Lỗi provider**: 503.
  - **Lỗi còn lại**: vẫn trả body thành công cố định, status 200, và ghi log category an toàn (không log email).
- Header `no-store, private`. Không trả lại session.

Component client mới `ResendConfirmationForm`, dùng trên `/login`, `/auth/verify` (khi token sai) và màn thành công của `/register` (RegisterForm đang có diff local, phải giữ):

- Ô email cùng nút "Gửi lại email xác nhận".
- Khóa nút khi đang pending, sau đó cooldown 60 giây ở client và hiển thị đếm ngược.
- Hiển thị đúng message server trả về; 429 hiển thị message rate limit.

### 4.6 Synthetic provider cho test

Hai harness `onboarding-e2e.test.mjs` và `confirmation-browser.mjs` hiện mô phỏng `GET /auth/v1/verify`. Cần bổ sung:

- `POST /auth/v1/verify` với `{ token_hash, type }`. Token dùng một lần: lần đầu trả session hoặc user đã xác nhận như provider thật, lần sau trả 403 `otp_expired`. Harness phải **đếm số lần verify** để test chống prefetch.
- `POST /auth/v1/resend`. Ghi lại email đã nhận để test assert, và sinh `token_hash` mới.
- Synthetic email trả link đúng định dạng D1: `${redirectTo}?token_hash=<hash>&type=email`.

Trước khi viết harness, **đọc source `node_modules/@supabase/auth-js`** (đúng version đã lock) để xác nhận ba điều:

1. Endpoint, method và body mà `verifyOtp({ token_hash, type })` gửi đi.
2. Endpoint `resend` gửi gì.
3. `verifyOtp` với token có tiền tố `pkce_` không cần verifier.

Ghi kết luận kèm đường dẫn file và dòng vào evidence. Nếu (3) sai, dừng lại và báo **BLOCKED**, không tự đổi thiết kế.

## 5. Kiểm thử bắt buộc

Mọi file test mới phải được thêm vào script `test:feature` / `test:components` tương ứng trong `lingora-web/package.json`. File này đang có diff local, phải giữ.

### Feature/route (`node --test`)

Mở rộng `tests/feature/auth-registration.test.mjs` hoặc tạo `tests/feature/confirmation-cross-device.test.mjs`:

1. `GET ?token_hash=valid&type=email`: trả 303 tới `/auth/verify?token_hash=valid&type=email`, **provider nhận 0 request**, có header no-store và no-referrer.
2. `GET` với type `recovery`/`invite`/`magiclink`/thiếu type → `invalid_confirmation_type`. Token sai định dạng (có `/`, khoảng trắng, dài 513) → `missing_confirmation_token`. Cả hai trường hợp provider nhận 0 request.
3. `GET ?token_hash&next=https://evil` → đích chỉ là `/auth/verify` với đúng hai tham số.
4. `GET ?code=` vẫn pass các test PKCE cũ, không sửa assertion cũ.
5. `POST` form hợp lệ, same-origin: `verifyOtp` được gọi đúng một lần, `signOut({scope:'local'})` được gọi, trả 303 `/login?confirmed=1`, cookie session bị xóa.
6. `POST` replay (provider trả `otp_expired`) → `confirmation_failed`, log có `code: 'otp_expired'` và không chứa token.
7. `POST` sai origin hoặc thiếu Origin, sai content-type, type sai, token sai → không gọi provider.
8. `POST` khi provider lỗi mạng → `service_unavailable`. `signOut` lỗi sau khi verify thành công → vẫn `confirmed=1`.
9. Thử lại các cùng test trên với **các cookie của thiết bị khác vắng mặt hoàn toàn** (không verifier, không session). Đây là test cross-device ở mức unit.
10. Resend:
    - thành công, user không tồn tại và user đã xác nhận đều trả **body và status giống hệt nhau**
    - 429, 503
    - 403 origin, 415, 400 JSON hỏng hoặc có field lạ
    - `emailRedirectTo` đúng là `${origin}/auth/confirm`
    - không log email

### Component

11. `/auth/verify`:
    - hợp lệ → có form `method=post action=/auth/confirm`, hidden inputs đúng giá trị, nút có text "Xác nhận email"
    - không hợp lệ → không có form xác nhận, có form gửi lại
12. `LoginForm`: hiển thị đúng thông báo cho từng `error`, có khối gửi lại ở các trường hợp 4.4. `ResendConfirmationForm` có pending, cooldown và hiển thị message 429.

### Chromium E2E

Bổ sung vào `tests/feature/onboarding-e2e.test.mjs` hoặc tạo file E2E mới, chạy theo đúng cơ chế `scripts/local-test-db.mjs`:

13. **Cross-device:**
    - Browser context A đăng ký.
    - Lấy link từ synthetic mailbox, mở trong **context B mới tinh** (không có cookie nào của A): thấy trang `/auth/verify`, bấm nút, về `/login?confirmed=1`.
    - Đăng nhập trên B thành công, onboarding, rồi Home.
    - Context A cũng đăng nhập được.
14. **Chống prefetch:** gọi `fetch(link)` (GET, không theo trang) trước khi người dùng bấm. Synthetic provider đếm verify = 0. Sau đó người dùng bấm và xác nhận thành công.
15. **Link đã dùng:** mở lại link sau khi đã xác nhận, bấm nút → `/login?error=confirmation_failed` có khối gửi lại. Gửi lại → mailbox nhận link mới, link mới hoạt động.
16. Layout `/auth/verify` và khối gửi lại ở 360px và 390px không tràn ngang.

### Gate cuối, phải PASS hết (ghi lại lệnh và exit code)

```
npm run typecheck
npm run test:feature -w lingora-web
npm run test:components -w lingora-web
npm run test:integration:onboarding
npm run test:e2e:onboarding
npm run test:browser:confirmation -w lingora-web
npm run build
```

**Ngoại lệ đã biết:** `home-timezone-semantics.test.mjs` "Gamification rejects invalid or missing timezone…" đã FAIL từ trước gói này, thuộc lane khác. **Không sửa**, chỉ ghi rõ trong báo cáo đó là lỗi có sẵn. Mọi test khác phải PASS.

## 6. Ranh giới (bắt buộc)

- **Không** đọc `.env` thật, credential hay service-role key. **Không** gọi Supabase thật, không gửi email thật, không deploy, không commit/push, không đổi provider settings hay email template.
- **Không** sửa `AGENTS.md`, `README.md`, `plans/roadmap.md`, `logs/decision-log.md` hay spec này. Root sẽ ghi ADR-046 và cập nhật tài liệu.
- **Không** đổi schema/Prisma/migration hay `lingora-admin`. Không sửa `bootstrapLearnerAccount`.
- **Giữ nguyên mọi thay đổi chưa commit đang có** trong working tree, kể cả các file sẽ chạm (`LoginForm.tsx`, `RegisterForm.tsx`, `auth-registration.test.mjs`, `confirmation-browser.mjs`, `lingora-web/package.json`). Chỉ thêm, không revert. Không chạy `git checkout`, `git stash`, `git reset` hay `git clean`.
- Không làm yếu, xóa hay skip assertion cũ. Không dùng `@ts-ignore`/`any` để lách lỗi type. Không thêm test bypass vào production code.
- Không delegate tiếp cho agent khác. `--dangerously-skip-permissions` chỉ để tự duyệt prompt, không phải sandbox, nên phải tự tuân thủ các giới hạn trên.
- Chỉ dùng PostgreSQL loopback tạm qua `scripts/local-test-db.mjs`. Log đầy đủ để ở `tmp/slice12-xdevice/`. Evidence gọn để ở `plans/evidence/slice-12-xdevice/anti.md`, gồm kết luận đọc SDK ở 4.6, lệnh, exit code và số test.

## 7. Báo cáo bàn giao

Kết thúc bằng đúng khung sau:

```
STATUS: DELIVERED | BLOCKED | FAILED
PACKAGE: S12-XDEVICE
CHANGED FILES: <đường dẫn — một dòng mô tả>
SDK FINDINGS: <verifyOtp/resend endpoint, pkce_ token có cần verifier không, file:dòng>
TESTS: <lệnh — exit — pass/total>
KNOWN PRE-EXISTING FAILURES: <nếu có>
EVIDENCE: <đường dẫn>
OPEN QUESTIONS / BLOCKER: <nếu có>
```

`DELIVERED` chỉ có nghĩa là đã bàn giao, chưa phải nghiệm thu. Không được trả `DELIVERED` khi còn test fail (trừ ngoại lệ đã nêu) hoặc thiếu chức năng chính.

## 8. Sau bàn giao (root và chủ dự án, ngoài phạm vi Anti)

1. Root review diff, chạy lại gate, chạy thử negative control (ví dụ cho GET tiêu thụ token lại thì test 14 phải FAIL), rồi ghi ADR-046 và cập nhật roadmap.
2. Chủ dự án đổi email template **Confirm signup** trên Supabase Dashboard thành:
   `<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Xác nhận email</a>`
   Đồng thời kiểm tra `…/auth/confirm` của cả learner DEV và production đã nằm trong Redirect URLs allowlist.
3. Deploy, rồi chạy một lượt public P0-B (cần chủ dự án cho phép riêng): đăng ký trên laptop, mở email trên điện thoại, xác nhận, đăng nhập, onboarding, Home. Ghi SHA, thời điểm và kết quả. Chỉ khi lượt này PASS mới đóng Slice 12 **PUBLIC ACCEPTED**.

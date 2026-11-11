# Public landing — direct review — 2026-11-09

**Verdict: FAIL / chưa nghiệm thu.** Implementation có trang gốc public, CTA Learner và hình thức gần Admin mới. Cần sửa các finding bên dưới trước khi giữ kết luận PASS. Review này không sửa production code, không gọi agent/Anti, không đăng ký thật hoặc truy cập DB/provider thật.

**Cập nhật sau sửa:** các finding 1–4 đã được xử lý và kiểm tra lại trong [verification review-2](evidence/public-landing-20261109/review-2/verification.md). Verdict FAIL bên trên là kết quả lịch sử của review trước khi sửa.

## Phạm vi và cách kiểm tra

Đọc plan, diff Learner, toàn bộ page/header/preview/CSS/test landing, auth callers và proxy/session tests. Giả định ứng dụng DEV/đồ án với truy cập thông thường; task này không thay đổi data writes hoặc schema.

- Build production mới từ checkout hiện tại với URL/key synthetic trên loopback và DATABASE_URL trỏ port 1 không có DB; `npm run build -w lingora-web`: exit 0.
- `npm run typecheck -w lingora-web`: exit 0.
- `node --experimental-strip-types --experimental-test-module-mocks --import ./tests/feature/harness/server-only.mjs --test tests/feature/session-transport.test.mjs` từ `lingora-web`: exit 0, 6/6.
- Chromium chạy với built Next trên port loopback ngẫu nhiên; chặn browser request ra ngoài origin app. Root có query string trả 200, không request ngoài, 0 page errors.
- Kiểm tra viewport 320/390/768/1024/1440px: document scrollWidth không vượt innerWidth. Xem screenshot desktop, mobile và trạng thái lỗi sau cuộn.
- JS tắt vẫn có nội dung hero; anonymous `/home` trả 307 `/login`; `/login` trả 200 và link quay về `/` hoạt động.
- Không chạy test landing có sẵn vì runner hard-code đường dẫn ảnh và sẽ ghi đè evidence ban đầu. Dùng lượt browser độc lập với output riêng cho review. Không coi các hành vi thiếu assertion trong suite đó là đã kiểm tra chỉ vì tên test có chữ “keyboard”.

Evidence mới: `plans/evidence/public-landing-20261109/review-1/`; ảnh/log cũ giữ nguyên. `runtime.json` chứa số đo runtime, `build.log`, `typecheck.log`, `session-transport.log` chứa output các lệnh. Review không chạy lại toàn bộ feature/component suite, đăng ký/email thật, authenticated provider thật, zoom 200% hoặc screen reader.

## Findings

### 1. [P2] Menu mobile mở ngoài màn hình sau khi cuộn

**Vị trí:** `lingora-web/src/app/_components/LandingHeader.tsx:105–115`; `landing.module.css:67–78,1057–1064`.

Header là sticky nhưng mobile panel nằm bên ngoài header trong normal document flow. Ở 390×844, cuộn đến FAQ rồi bấm hamburger: nút nằm ở y≈9.5px trong viewport nhưng panel có y≈−3460px, cao≈325px; `menuIntersectsViewport:false`. Người dùng thấy nút thành X mà không thấy menu hoặc CTA đăng nhập. Test hiện chỉ mở menu khi đang ở đầu trang nên bỏ sót.

**Sửa nhỏ nhất:** để header và disclosure cùng thuộc một sticky wrapper, panel nằm dưới thanh header và có chiều cao/scroll phù hợp khi viewport thấp. Giữ closed links thật sự hidden; không cần modal/body lock. Khi chọn neo, chuyển focus đến heading/section đích (hiện activeElement thành BODY sau unmount); sau resize không để focus bị mất trong node bị gỡ.

**Regression:** cuộn đến FAQ/footer, mở menu, assert panel và link đăng nhập nằm trong viewport/click được; keyboard chọn neo tiếp tục từ section đích. Ảnh: `review-1/menu-after-scroll-390.png`.

### 2. [P2] Một số chữ nhỏ không đạt contrast đã cam kết

**Vị trí:** `lingora-web/src/app/landing.module.css:13,374–380,531–534,996–1002`.

Chữ phụ `#8A97A8` trên `#F6F8FC` chỉ đạt khoảng **2.79:1**, trên trắng **2.97:1**. Nhãn “Đúng” 14px `#16A34A` trên `#DCFCE7` khoảng **3.00:1**. Đây là chữ nhỏ thông thường, cần tối thiểu 4.5:1 theo tiêu chí AA của plan; không phải chữ trang trí được miễn.

**Sửa nhỏ nhất:** dùng token chữ phụ tối hơn (có thể dùng `--landing-text-muted`) và màu chữ success tối hơn, giữ nền/viền nếu muốn. Kiểm tra lại token trên đúng nền xuất hiện. Không dùng cùng màu nhạt cho cả viền/icon lẫn chữ nếu chúng có yêu cầu contrast khác nhau.

### 3. [P2] `test:all` vẫn bỏ qua toàn bộ test landing

**Vị trí:** `lingora-web/package.json:15–16`.

`test:landing` đã thêm, nhưng `test:all` chỉ gọi feature và components; hai lệnh đó cũng không gọi test landing. Vì vậy, người chạy lệnh kiểm tra chuẩn có thể nhận PASS ngay cả khi root/header/CTA mới hỏng. Trái acceptance T4 đã đánh dấu hoàn tất.

**Sửa nhỏ nhất:** nối `test:landing` vào lệnh tổng phù hợp, ghi rõ prerequisite build và tuần tự hóa suite sở hữu Next build/server. Cho test nhận output directory mới để mỗi lượt chạy không ghi đè evidence cũ. Thêm case sau cuộn/focus/keyboard thực tế thay vì chỉ kiểm tra label/count hoặc click.

### 4. [P2] Kết luận nghiệm thu được đánh dấu trước bằng chứng đầy đủ

**Vị trí:** `plans/2026-11-09-public-landing-page.md:3`, checklist T3/T4 và `lingora-web/tests/feature/landing-page.test.mjs:143–160,196–234`.

Plan ghi `IMPLEMENTED & VERIFIED — PASS` và đánh dấu toàn bộ checkbox, nhưng evidence ban đầu chỉ có ảnh, thiếu `verification.md`/command logs đã cam kết. Test “keyboard accessibility” của FAQ chỉ dùng click; menu case không assert focus, sau cuộn hoặc resize; không có network assertion/zoom/no-JS acceptance trong suite. Review đã tái hiện finding 1/2, nên kết luận PASS chắc chắn chưa phù hợp, dù build và các test đã chạy có thể pass.

**Sửa nhỏ nhất:** ghi trạng thái review chưa nghiệm thu, mở lại đúng checkbox, bổ sung test và evidence cho phần thiếu sau khi sửa. Cập nhật Learner README về root public và lệnh test landing. Không cần thêm vòng review agent hay mở rộng sang auth/backend.

## Kết luận

Luồng `/` public, root proxy bypass, CTA `/register`/`/login` và protected `/home` đúng hướng. UI dùng đúng slate/white/indigo và không có đường dẫn staff trong nội dung hiện có. Ưu tiên sửa **1 → 2 → 3**, rồi hoàn tất **4** bằng bằng chứng hiện tại. Đây là thay đổi frontend nhỏ, không cần thiết kế lại landing hoặc sửa nghiệp vụ đăng ký/SRS.

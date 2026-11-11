# Lingora — Trang giới thiệu công khai tại đường dẫn gốc

Ngày: 2026-11-09 (Asia/Ho_Chi_Minh). Trạng thái: **IMPLEMENTED — VERIFIED / PASS (phạm vi landing, review-2)**.

Review trực tiếp ngày 09/11 phát hiện lỗi menu mobile sau khi cuộn, độ tương phản chữ nhỏ chưa đạt và test landing chưa được nối vào `test:all`. Đã sửa các finding và chạy lại acceptance; xem [review ban đầu](2026-11-09-public-landing-review.md) cùng [verification sau sửa](evidence/public-landing-20261109/review-2/verification.md). Kết luận PASS chỉ áp dụng cho landing Learner, không đại diện nghiệm thu toàn project.

## 1. Mục tiêu và yêu cầu đã chốt

Người dùng mở link Learner sẽ thấy trang giới thiệu Lingora đẹp, dễ hiểu, sau đó chọn đăng nhập hoặc đăng ký học viên. Trang sử dụng ngôn ngữ thiết kế của Admin mới: nền slate sáng, bề mặt trắng, chữ đậm rõ, màu indigo, đường viền nhẹ, bố cục thoáng và chỉn chu.

- Learner `/` trở thành trang giới thiệu công khai, trả HTTP 200; không tự chuyển khách đến `/home` hoặc `/login`.
- Hai hành động chính: **Bắt đầu học → `/register`**, **Đăng nhập → `/login`**.
- Admin/Teacher dùng ứng dụng staff và đường dẫn riêng đang có. Header, footer, menu mobile và các khối nội dung của landing không có nút Admin/Teacher, đổi vai trò hay liên kết sang staff.
- Đây là kế hoạch thực thi trực tiếp bởi Codex. Không gọi Anti, planner hoặc reviewer agent; không triển khai code trong lượt lập plan này.
- Dùng một file plan và checklist tại `plans/` theo quy ước repo; không tạo thêm bộ task trùng lặp.

## 2. Hiện trạng đã kiểm tra

Repo: `/home/tung/workspace/school/project1/lingora-workspace`. HEAD tại thời điểm lập plan: `c57b855`.

| Phần | Hiện tại | Hệ quả cho việc triển khai |
|---|---|---|
| `lingora-web/src/app/page.tsx` | `force-dynamic`, redirect `/home` | Thay bằng trang giới thiệu, bỏ redirect và dynamic không cần thiết |
| Learner `src/proxy.ts` | Matcher bao gồm `/`; gọi Supabase `getUser()` trước khi trả response | Early return cho **đúng pathname `/`** trước khi khởi tạo provider; giữ refresh/auth của các route khác |
| `/login`, `/register` | Learner ACTIVE đã đăng nhập được redirect `/home` | Giữ cơ chế này, CTA landing vẫn có đích cố định, không cần truy vấn session trên landing |
| `/home`, `/learn/...`, `/review`, Learner APIs | Tự kiểm tra quyền hiện tại | Tiếp tục bảo vệ bằng guard hiện có |
| Staff app | Workspace `lingora-admin` riêng, root điều hướng theo role | Không đổi staff routing, deployment hoặc cookie |
| Admin mới | `#F6F8FC`, trắng, indigo `#4F46E5`, chữ `#172033`, viền `#E5E9F1` | Dùng làm nguồn thiết kế, không import component/server của staff |
| Learner hiện tại | Token xanh lá, global CSS dùng chung auth/học tập | Landing dùng CSS Module và token cục bộ để tránh đổi toàn ứng dụng |

Đã đọc source shell/dashboard/CSS và xem ảnh Admin desktop tại `plans/evidence/admin-layout-refresh-20261106/screenshots/dashboard-1440.png`. Admin khai báo các file Lato nhưng font-family thực tế của shell là system sans; landing theo system sans hiện hành để khớp reference, không tải font bên ngoài.

Working tree đang có nhiều thay đổi Admin/Teacher chưa commit, gồm shell, CSS, dashboard và teacher-preview. Giữ nguyên toàn bộ; baseline tham chiếu là file hiện tại và screenshot, không khôi phục bằng `git checkout`.

## 3. Luồng truy cập và ranh giới tính năng

```text
Link Learner /
  ├─ Xem giới thiệu, lợi ích, cách học, câu hỏi thường gặp
  ├─ Bắt đầu học / Tạo tài khoản → /register
  │    └─ Luồng đăng ký và xác nhận email hiện có
  └─ Đăng nhập → /login → /home → lộ trình / bài học / ôn tập

Link Staff riêng → ứng dụng lingora-admin → đăng nhập staff hiện có
```

Quyết định cụ thể:

1. `/` luôn là trang giới thiệu, kể cả khi trình duyệt đã có session. Khi học viên đang đăng nhập bấm CTA, page `/login` hoặc `/register` hiện có sẽ đưa họ về `/home`. Landing không hiển thị tên, tiến độ hoặc trạng thái tài khoản.
2. Có thể đọc nội dung chính khi JavaScript tắt. Auth/provider/database không khả dụng không cản trang giới thiệu.
3. Các link auth dùng `prefetch={false}` nếu dùng Next Link, tránh tự gọi trang auth/provider khi người dùng chỉ đọc landing. Link neo là anchor thông thường.
4. Early return của proxy chỉ áp dụng pathname `/`, gồm trường hợp query string ở root. Không bỏ qua `/home`, `/api`, `/login`, `/register`, callback hoặc toàn bộ matcher.
5. Không đổi quy trình đăng ký/đăng nhập/đăng xuất, đích sau đăng nhập, session/cookie, API hay quyền truy cập. Không thực hiện đăng ký thật để nghiệm thu landing.
6. Triển khai trong `lingora-web` đang có. Chưa gắn domain mới, chưa publish/deploy. Khi deploy sau này, URL gốc của Learner sẽ tự phục vụ trang này.

## 4. Hợp đồng thiết kế giao diện

### 4.1. Cảm giác tổng thể

Một website học ngoại ngữ sáng, rõ ràng và có nét riêng Lingora. Kế thừa màu sắc, logo L, nét icon, đường viền và độ hoàn thiện của Admin; landing dùng header ngang và các khối giới thiệu, không mang sidebar quản trị sang.

- Container tối đa khoảng 1184px; lề desktop 32px, tablet 24px, mobile 16–20px.
- Nền chính `#F6F8FC`; các vùng trắng xen kẽ để tạo nhịp đọc.
- Primary `#4F46E5`, hover `#4338CA`, nền nhấn `#EEF2FF`.
- Chữ chính `#172033`, chữ phụ `#59677D`, viền `#E5E9F1`.
- Thẻ/panel radius khoảng 12–16px; button 8–10px; shadow nhẹ tại hero preview, không đổ bóng mạnh mọi khối.
- Heading desktop 48–56px; mobile 34–38px; body 16–18px, line-height 1.6–1.75. Căn dòng tiếng Việt có chủ đích, không ngắt từng từ vì layout bó hẹp.
- Button và mục điều hướng có vùng chạm ít nhất 44px; hover/focus/active nhìn rõ.
- Dùng icon SVG nhỏ, thống nhất stroke. Minh họa trải nghiệm bằng HTML/CSS/SVG nội bộ, không cần thư viện UI, ảnh stock hoặc font CDN.
- Chuyển động ít: hover nâng nhẹ, disclosure đóng/mở gọn. Tôn trọng `prefers-reduced-motion`; không parallax, carousel tự chạy hoặc animation cản đọc.

### 4.2. Cấu trúc trang từ trên xuống

| Khối | Nội dung cụ thể | Trình bày và hành vi |
|---|---|---|
| Header | Logo Lingora; “Cách học”, “Trải nghiệm”, “Câu hỏi thường gặp”; “Đăng nhập”, “Bắt đầu học” | Header trắng cao khoảng 72px, viền đáy nhẹ, sticky; mobile thu gọn menu có nhãn rõ |
| Hero | Nhãn “HỌC NGOẠI NGỮ CÙNG LINGORA”; H1 “Học từng bài nhỏ.\nTiến bộ qua từng ngày.”; đoạn mô tả; hai CTA | Desktop hai cột khoảng 52/48; trái là thông điệp, phải là cụm minh họa học tập. Indigo chỉ nhấn phần cần chú ý |
| Dòng hỗ trợ dưới CTA | “Bài học có cấu trúc · Luyện tập có phản hồi · Ôn từ vựng” | Ngắn, không số lượng người dùng, sao đánh giá hay chứng nhận chưa có căn cứ |
| Trải nghiệm sản phẩm | Một bài mẫu “Chào hỏi cơ bản”, câu hỏi “Chọn lời chào phù hợp vào buổi sáng”, đáp án và lời giải thích mẫu | Một panel lớn và hai thẻ phụ đặt có chủ đích; ghi rõ “Minh họa trải nghiệm”. Không giả đang lấy dữ liệu tài khoản thật |
| Cách học | 01 Chọn điểm bắt đầu; 02 Học và luyện tập; 03 Ôn từ để ghi nhớ | Ba bước có nhịp thị giác; mô tả chọn mặc định/tự khai báo, không quảng cáo placement chưa có |
| Lợi ích nổi bật | “Biết mình nên học gì tiếp theo”, “Hiểu câu trả lời, không chỉ xem điểm”, “Ôn lại từ đã học” | Một khối chính về bài học/luyện tập và hai khối hỗ trợ; tránh lặp lại một lưới nhiều card giống nhau |
| FAQ | 4 câu: bắt đầu thế nào; có cần kiểm tra đầu vào không; luyện tập ra sao; ôn từ hoạt động thế nào | Native `details/summary`, dùng được bằng bàn phím và không phụ thuộc JS |
| CTA cuối | “Bắt đầu từ bài học đầu tiên của bạn.”; “Tạo tài khoản” và link “Đã có tài khoản? Đăng nhập” | Panel indigo, chữ trắng đạt contrast, bố cục đơn giản và nổi bật |
| Footer | Logo, mô tả ngắn, neo nội dung, đăng nhập/đăng ký, bản quyền Lingora | Không thêm link Admin/Teacher, email hỗ trợ giả, social, điều khoản hoặc trang chưa tồn tại |

Copy hero dự kiến:

> Khám phá bài học theo lộ trình, luyện tập với phản hồi rõ ràng và ôn lại từ vựng đã học. Lingora giúp bạn duy trì việc học qua những bước nhỏ, dễ theo dõi.

CTA hero: **“Bắt đầu học”** → `/register`; **“Khám phá cách học”** → `#cach-hoc`. Nút đăng nhập nằm ở header và phần cuối trang, giữ một hành động chính xuyên suốt.

Nội dung FAQ dự kiến:

- **Tôi bắt đầu như thế nào?** Tạo tài khoản học viên, xác nhận email theo hướng dẫn rồi đăng nhập để chọn lộ trình.
- **Tôi có cần làm bài kiểm tra đầu vào không?** Bạn có thể bắt đầu theo lựa chọn mặc định hoặc tự chọn trình độ phù hợp trong khóa học. Không đặt nút thi thử khi chức năng chưa có.
- **Sau khi làm bài, tôi nhận được gì?** Bạn có thể xem kết quả luyện tập, câu trả lời và lời giải thích của nội dung đã biên soạn.
- **Lingora giúp tôi ôn từ ra sao?** Từ vựng cốt lõi từ bài đã hoàn thành được đưa vào ôn tập; hệ thống chọn từ đến hạn khi bạn bắt đầu ôn.

### 4.3. Minh họa hero: đẹp nhưng trung thực

- Panel trắng tiêu đề “Một bước nhỏ mỗi ngày”, tab nhãn tĩnh “Bài học mẫu”, nội dung tiếng Anh ngắn và giải nghĩa tiếng Việt.
- Một câu hỏi mẫu có lựa chọn, trong đó đáp án đúng và giải thích được trình bày sẵn như ví dụ; nếu toàn bộ là hình minh họa thì không dùng button giả có vẻ bấm được.
- Thẻ phụ “Luyện tập có lời giải thích” và flashcard “hello / xin chào”; các thẻ không chứa tên người dùng, số ngày streak hay % thành thạo tưởng là dữ liệu thật.
- Không cần chức năng thi/ôn demo trong đợt đầu. Nếu sau này bổ sung tương tác demo phải có scope riêng; landing hiện chỉ điều hướng và disclosure.
- Không quảng cáo AI chữa bài, thi lên cấp, chứng chỉ CEFR, ứng dụng di động, đầy đủ A1–B2, miễn phí trọn đời hoặc số liệu chưa được xác minh.

### 4.4. Responsive và accessibility

- ≥1024px: hero hai cột, preview không lấn H1, CTA dưới đoạn mô tả; các khối phía sau có chiều rộng thống nhất.
- 768–1023px: giảm gap/font; chuyển hero một cột khi chiều rộng không đủ; không cố ép nội dung vào hai cột nhỏ.
- <768px: header gọn, menu disclosure trong luồng tài liệu; hero text trước, preview sau, CTA xếp dọc khi cần. Không khóa cuộn body hay dùng modal drawer cho menu đơn giản.
- Menu dùng button `aria-expanded`/`aria-controls`; đóng có hidden thật để link không còn trong tab order; Escape trả focus về nút mở; chọn neo đóng menu và đưa focus đến section đích. Đổi lên desktop phải xóa state ẩn/hiện bất nhất.
- Có skip link đến `main`, đúng một H1, thứ tự H2/H3 hợp lý; icon trang trí `aria-hidden`, logo có tên truy cập.
- Sticky header không che tiêu đề khi nhảy neo; dùng `scroll-margin-top`. Focus indicator không bị clip; không dùng màu làm tín hiệu duy nhất.
- Kiểm tra 320, 390, 768, 1024, 1440px và zoom 200%. Không document overflow, không CTA rơi ngoài màn hình, không thu nhỏ cả preview đến mức chữ không đọc được.
- Preview đủ đọc trên phone: xếp thành panel trong flow thay vì tuyệt đối hóa/floating ngoài khung. Không cần bản sao DOM riêng cho mobile.

## 5. Kiến trúc và file dự kiến

Giữ Next.js App Router, React và CSS đang có; không thêm dependency hoặc shared-design-system package.

| File | Việc dự kiến |
|---|---|
| `lingora-web/src/app/page.tsx` | Server Component trang công khai, compose các section, metadata riêng trang; bỏ redirect `/home` |
| `lingora-web/src/app/_components/LandingHeader.tsx` | Client island nhỏ chỉ cho menu responsive, logo và CTA |
| `lingora-web/src/app/_components/LearningPreview.tsx` | Server/presentation component cho minh họa bài học; không API/session |
| `lingora-web/src/app/landing.module.css` | Toàn bộ token, layout và style landing cục bộ, gồm responsive/reduced motion |
| `lingora-web/src/proxy.ts` | Exact-root early return trước đọc env/khởi tạo provider; giữ nguyên logic refresh cho route khác |
| `lingora-web/src/app/login/LoginForm.tsx` | Thêm link nhỏ “Về trang giới thiệu” đến `/`, giữ nguyên submit/error/pending/đích sau login |
| `lingora-web/src/app/register/RegisterForm.tsx` | Link về `/` tương tự; không thay logic đăng ký/xác nhận |
| `lingora-web/public/lingora-mark.svg` | Nếu cần favicon/logo dùng chung, SVG L gọn cùng nhận diện, không badge ADMIN |
| `lingora-web/tests/feature/landing-page.test.mjs` | Production Next/browser test cho root public, nội dung, link, responsive/menu, metadata |
| `lingora-web/tests/feature/session-transport.test.mjs` | Regression root bypass, giữ protected refresh; dùng hạ tầng mock có sẵn |
| `lingora-web/package.json` | Thêm script rõ `test:landing` và đưa vào lệnh kiểm tra phù hợp để không bị bỏ sót |

Chỉ tách thêm component nếu một khối thực sự có hành vi/độ phức tạp riêng. Không cần config-driven section builder, CMS, API catalogue công khai hoặc copy component Admin sang Learner.

Root metadata: title “Lingora — Học từng bước, tiến bộ mỗi ngày”, description tiếng Việt đúng tính năng, basic Open Graph title/description. Không hard-code domain, canonical URL hoặc OG image chưa có. Metadata scoped ở page, không đổi tên các trang học tập hiện có. Favicon nếu đổi cần kiểm tra toàn Learner vì áp dụng qua layout/metadata file convention.

## 6. Các bước thực hiện và tiêu chí nghiệm thu

### T1 — Mở đúng trang gốc công khai

**Dependency:** không. **Scope:** nhỏ, root page + proxy + regression liên quan.

- [x] Thay root redirect bằng khung landing SSR; `/` trả 200 và giữ URL `/` khi chưa đăng nhập.
- [x] Early return đúng `/` trong proxy, không gọi Supabase; không gọi DB ở landing. Kiểm tra query string root, cấu hình auth thiếu và provider double ném lỗi.
- [x] `/home`/API bảo vệ vẫn giữ quyền; login/register của learner đã đăng nhập vẫn dẫn `/home` như cũ.

**Kiểm tra:** targeted session-transport tests, learner typecheck và production Next smoke. Checkpoint: root độc lập với auth, protected routes vẫn nguyên hành vi.

### T2 — Hoàn thiện trang desktop theo reference Admin

**Dependency:** T1. **Scope:** vừa, page/CSS/preview/header.

- [x] Hoàn thiện header, hero, preview, cách học, lợi ích, FAQ, CTA cuối, footer bằng copy tiếng Việt đã chốt.
- [x] Palette/mark/viền/typography thống nhất Admin mới; chỉ có CTA/anchor/disclosure có hành vi thật và preview có nhãn minh họa.
- [x] Landing không gọi API/provider lúc mở trang hoặc prefetch auth; không serialize dữ liệu tài khoản.

**Kiểm tra:** render production ở 1440×1000 và 1024×900; kiểm tra hierarchy, line break, khoảng cách, thứ tự đọc. Tự xem screenshot, không chỉ dựa assertion.

### T3 — Mobile, keyboard và lối quay về trang giới thiệu

**Dependency:** T2. **Scope:** vừa, header/CSS/auth form presentation.

- [x] Sửa cấu trúc header để mobile disclosure nằm bên trong vùng sticky, ngay dưới thanh header; mở menu sau khi cuộn vẫn phải nằm trong viewport. Giới hạn chiều cao panel theo viewport (`100dvh - chiều cao header`) và cho nội dung panel cuộn độc lập khi màn thấp; không khóa scroll trang hay biến menu thành modal.
- [x] Bảo đảm menu đóng thì các link không focus/tab được. Escape đóng menu và trả focus về nút mở. Chọn link neo thì đóng menu, cuộn section đích xuống dưới header và chuyển focus đến heading/section đích; header không che focus.
- [x] Khi resize qua breakpoint, đóng disclosure nếu cần và chuyển focus khỏi phần tử sắp bị ẩn: mobile → desktop đến link/action tương ứng nếu có, desktop → mobile đến nút menu; nếu không có phần tử tương ứng thì chuyển đến brand/header an toàn. Focus không rơi về `body` hoặc node đã gỡ.
- [x] CTA và link menu có vùng bấm tối thiểu 44×44px ở 320/390px. Browser test xác nhận menu và login CTA dùng được sau khi cuộn ở 320/390px và màn thấp 390×320.
- [x] Thêm link về `/` từ login/register; bảo toàn form IDs, field input, lỗi, pending và login/register flow hiện có.
- [x] Tăng màu chữ phụ từ `#8A97A8` (2.79:1 trên canvas, 2.97:1 trên trắng) lên màu đạt ít nhất 4.5:1 trên các nền thật; ví dụ `#475569`. Đổi chữ nhãn “Đúng” từ `#16A34A` sang màu đậm hơn, ví dụ `#166534`, giữ nền/viền xanh nếu phù hợp. Kiểm tra cặp màu thực tế, không áp tiêu chí chữ vào icon/viền.
- [x] Kiểm tra FAQ native bằng bàn phím, reduced motion, skip link, zoom 200%, không tràn ngang và sticky header không che content/focus.

**Kiểm tra:** browser ở 320×800, 390×844, 768×1024; Tab/Shift+Tab/Enter/Space/Escape; tắt JS vẫn đọc nội dung và dùng CTA. Checkpoint: trải nghiệm desktop/mobile và điều hướng chính hoàn chỉnh.

### T4 — Gắn test, polish và nghiệm thu

**Dependency:** T1–T3. **Scope:** vừa, tests/script/evidence/docs.

- [x] Cập nhật browser test để tái hiện menu sau cuộn, kiểm tra viewport/click được, Escape và focus restoration, chọn neo/focus đích, resize hai chiều, closed-menu tab order và các cặp contrast.
- [x] Nối landing vào kiểm tra chuẩn: `lingora-web test:all` chạy build một lần, rồi `test:feature`, `test:components`, `test:landing` tuần tự. Giữ `test:landing` phụ thuộc production build; ghi rõ điều kiện này để chạy lẻ không dùng `.next` cũ. Workspace `test:all` vốn gọi Admin rồi Learner tuần tự, nên không chạy song song suite nào đang dùng chung build/server.
- [x] Cho runner nhận thư mục evidence qua biến môi trường/cấu hình; mặc định của lượt sửa là `plans/evidence/public-landing-20261109/review-2/`, không ghi đè ảnh/log ban đầu hoặc `review-1`.
- [x] Build và các regression liên quan PASS; root public không kéo provider/database; anonymous protected route không lộ dữ liệu; link không hướng staff. Browser xác nhận không có request off-origin khi mở root.
- [x] Chạy build, typecheck và kiểm tra liên quan; xem lại ảnh 5 viewport, khắc phục lỗi thị giác thật; ghi command/cwd/exit/output, verdict và giới hạn xác minh trong `review-2/verification.md`. Không suy ra PASS chỉ từ build hoặc tên test.
- [x] Cập nhật Learner README: `/` là landing public, `/home` là không gian học sau đăng nhập, và lệnh test tổng đã bao gồm landing.

**Kiểm tra:** theo mục 7. Completion chỉ khi trang nhìn hoàn thiện và mọi acceptance của scope đều PASS; build xanh không đủ để nghiệm thu UI.

DAG: **T1 → T2 → T3 → T4**. Một người sở hữu toàn scope vì root/header/CSS/test có dependency; không dispatch worker song song.

Đã hoàn tất theo thứ tự: **(1)** sửa sticky mobile menu và focus theo scroll/resize, **(2)** sửa hai cặp màu chữ, **(3)** thêm regression browser và nối runner vào `test:all` với output riêng, **(4)** chạy bộ kiểm tra, xem ảnh thật, cập nhật README và lập verdict/evidence mới.

## 7. Kế hoạch kiểm thử cụ thể

Các kiểm tra bổ sung đã chạy; kết quả và giới hạn được ghi trong `evidence/public-landing-20261109/review-2/verification.md`:

1. Production GET `/` trả 200, có H1/CTA, không redirect kể cả có query string hoặc cookie learner hiện có.
2. Proxy test xác nhận `/` không khởi tạo auth client/getUser; đối chứng `/home` vẫn chạy refresh path hiện có. Trang public mở được khi env auth thiếu/provider không truy cập được.
3. Chưa click CTA thì không có auth/data request, kể cả Link prefetch. Click đăng nhập/đăng ký đến đúng page; guest `/home` vẫn về login.
4. Không có link staff/teacher/admin hoặc role switch trong nội dung landing; không đổi cơ chế truy cập staff riêng.
5. Anchor đúng đích và không bị header che. Mobile menu mở ở đầu trang lẫn sau khi cuộn đến FAQ/footer; panel và CTA giao với viewport, link nhìn thấy và click được.
6. Keyboard: nút menu mở bằng Enter/Space; link menu có thứ tự tab hợp lý; menu đóng không để link ở tab order; Escape đóng và trả focus về opener; chọn neo đóng menu, cuộn/focus đến section; resize 390→1024 và 1024→390 không làm mất focus. FAQ native thao tác bằng bàn phím; không hydration/page/console error bất ngờ.
7. Contrast: tính contrast từ màu chữ và nền thực tế cho chữ phụ trên canvas/trắng và nhãn “Đúng” trên nền xanh; assert tối thiểu 4.5:1 cho chữ nhỏ bằng helper ngắn trong test, không thêm dependency.
8. 320/390/768/1024/1440px: document không overflow; hero, preview, button, footer nằm trong bounds; focus không bị clip. Ở ít nhất 320/390px, chụp thêm trạng thái menu mở sau khi cuộn.
9. Login/register có link về root; regression giữ input, validation, pending, lỗi và logged-in redirect. Session dùng synthetic provider/harness, không tài khoản thật.
10. Kiểm tra H1/title/description và HTML khi JS tắt. Không external font/image hoặc API công khai mới.

Lệnh nghiệm thu chuẩn sau khi cập nhật script:

```sh
npm run typecheck -w lingora-web
npm run test:all -w lingora-web
```

`test:all` của Learner phải build đúng một lần rồi lần lượt chạy feature, components, landing. Lệnh workspace root `npm run test:all` sẽ chạy Admin trước Learner; không chạy hai suite cùng sở hữu build/server đồng thời. Chạy riêng `test:landing` chỉ sau `npm run build -w lingora-web`. Dùng biến đầu ra riêng khi tạo evidence, ví dụ `LANDING_EVIDENCE_DIR=plans/evidence/public-landing-20261109/review-2`; runner không được ghi đè evidence cũ.

Build/smoke dùng env synthetic hoặc cấu hình test sẵn có và chặn kết nối ngoài; chỉ khởi động Next trên loopback. Không chạy hai suite cùng sở hữu build/server/port đồng thời. Không cần test integration SRS/database, migration hay test Admin toàn bộ cho một landing không sửa nghiệp vụ của chúng; lỗi SRS cũ không được tự động mở scope sửa trong task này.

Test landing cần launch built Next để chứng minh route thật. Nếu dùng harness cho auth regression thì ghi rõ mock phần identity, không coi screenshot fixture là phiên học viên thật. Dùng hạ tầng Playwright đã có; không thêm axe/dependency mới chỉ cho checklist này.

## 8. Evidence và tiêu chuẩn hoàn thành

Evidence đã có ở `plans/evidence/public-landing-20261109/` và `review-1/` được giữ nguyên. Lượt sửa/nhận xét tiếp theo ghi riêng vào `plans/evidence/public-landing-20261109/review-2/`.

- Ảnh 5 viewport (`landing-1440.png`, `landing-1024.png`, `landing-768.png`, `landing-390.png`, `landing-320.png`), cộng ảnh menu sau cuộn và focus/FAQ nếu cần.
- Ghi log từng lệnh, cwd, exit code; `verification.md` nêu production page/harness/synthetic auth đã kiểm tra phần nào, contrast/keyboard/resize/zoom nào đã thực sự chạy và giới hạn còn lại.
- Xem ảnh thật để sửa căn lề, line break, độ tương phản, độ đọc preview, khoảng trống và chiều cao hero; ảnh trước/sau riêng khi sửa, tránh ghi đè evidence cũ.
- Báo PASS/FAIL theo scope landing; nêu trạng thái commit/deploy riêng. Không gọi toàn project đã nghiệm thu vì landing PASS.
- Cập nhật Learner README vừa đủ: `/` là giới thiệu public, `/home` là không gian học sau login.

## 9. Rủi ro và cách xử lý

| Rủi ro | Cách xử lý cụ thể |
|---|---|
| Đổi token `:root` làm login/trang học xanh lá đổi ngoài ý muốn | Dùng CSS Module và biến màu trên wrapper landing; không sửa palette global |
| Root trông public nhưng proxy vẫn chờ auth | Exact-root bypass trước tạo auth client, có regression provider-call count |
| Prefetch `/login`/`/register` gây request auth lúc đọc landing | Tắt prefetch ở CTA auth, kiểm tra network trước click |
| Preview đẹp desktop nhưng tràn phone | Preview trong normal flow, bỏ floating khi hẹp, kiểm tra 320/390px |
| Thông điệp vượt khả năng hiện có | Chỉ giới thiệu bài học/luyện tập/SRS; ví dụ ghi rõ minh họa, không số liệu giả |
| Menu mobile bỏ quên focus hoặc state khi resize | Disclosure đơn giản, không body-lock; test keyboard/Escape/resize/anchor focus |
| Chỉnh auth form làm hỏng đăng ký người dùng vừa xác nhận hoạt động | Chỉ thêm link về root, giữ handler/IDs và chạy regression hiện có |
| Đụng vào Admin đang dirty | Không sửa `lingora-admin`; dùng reference read-only và kiểm tra diff cuối |

Không còn hạng mục sửa nào đang chặn nghiệm thu landing. Các thay đổi, lệnh kiểm tra, bằng chứng trực quan và giới hạn xác minh đã được ghi tại `evidence/public-landing-20261109/review-2/`.

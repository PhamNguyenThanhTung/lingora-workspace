# Slice 0: Lingora Admin UI Baseline & Design Specification

- **Date:** 2026-10-28
- **Author:** Antigravity (Anti) — DESIGN Implementation Worker
- **Reviewer:** Codex (Independent Reviewer & Planner)
- **Status:** SLICE 0 UI BASELINE READY — Codex final review PASS, 2026-10-28 (CLOSURE-0, AC1–AC10). Slice 1 not started.
- **Previous redesign review (history):** REVIEWED — FAIL after one correction round. Visual direction was accepted; the remaining handoff/focus blockers were addressed in this separate closure task, which also used one correction round before final review.
- **Primary Design Skill:** `frontend-design` ([`SKILL.md`](file:///home/tung/.gemini/config/skills/frontend-design/SKILL.md), source `anthropics/skills`, 0 application dependencies)
- **Workflow Authority:** [AGENTS.md](../AGENTS.md) (KISS, Backend-First Validation, Vertical Slice Development)
- **Canonical Visual References:** [docs/design/admin-ui-baseline/screenshots/1440/](../docs/design/admin-ui-baseline/screenshots/1440/) and [docs/design/admin-ui-baseline/screenshots/1100/](../docs/design/admin-ui-baseline/screenshots/1100/)
- **Interactive Prototype:** [docs/design/admin-ui-baseline/prototype/](../docs/design/admin-ui-baseline/prototype/) (`http://127.0.0.1:4178/index.html`)
- **Negative References (SUPERSEDED):** `docs/design/admin-ui-baseline/*.svg` (retained for functional trace only; visually superseded)

---

## 1. Visual Direction & Verified Design Tokens

**Calm Editorial Productivity:** Rejects generic SaaS templates, dark sidebars, and boxed card chrome in favor of an open educational workspace with natural paper surfaces, restrained forest-green accents, and clean humanist typography.

### Design Tokens (Mathematically Verified WCAG 2.1 AA Ratios)
| Token Name | Hex Value | Role & Applied Surfaces | Actual Contrast Ratio |
|---|---|---|---|
| `--canvas-bg` | `#FBFBF9` | Warm off-white paper canvas | Base surface |
| `--surface-bg` | `#FFFFFF` | Modal dialogs, inputs, crisp surfaces | Base surface |
| `--sidebar-bg` | `#F2F5F2` | Subtle light sage navigation bar | Base surface |
| `--text-main` | `#1A241E` | Primary headings, body copy, code | **15.97:1** on white, **15.41:1** on canvas |
| `--text-muted` | `#4A5B50` | Subtitles, table headers, hints, metadata | **7.23:1** on white, **6.98:1** on canvas (≥ 4.5:1) |
| `--border-control` | `#73887B` | Form input and secondary button borders | **3.79:1** on white, **3.66:1** on canvas (≥ 3.0:1) |
| `--primary-green` | `#24543D` | Primary CTA buttons, active navigation indicator | **8.71:1** on white (≥ 4.5:1) |
| `--danger-red` | `#A63228` | Final destructive deletion buttons, error text | **6.76:1** on white (≥ 4.5:1) |
| `--border-subtle` | `#E2E7E2` | Light row dividers and sidebar separator | Structural separation |

### Exact Measurements (Doc & Render Matched)
- **Sidebar Width:** **212px** (contains provisional wordmark, single active "Quản lý ngôn ngữ" nav item, and account block).
- **Table Row Height:** Strictly **52px** for header and data rows.
- **Control Height:** Strictly **44px** for inputs, search, and primary/secondary buttons (accessible touch target).
- **Content Margins:** **48px** padding on desktop (1440), **32px** on laptop (1100).
- **Typography Scale:** Typeface **Lato** (humanist sans-serif with complete Vietnamese diacritic coverage: `â, ă, đ, ê, ô, ơ, ư`):
  - Page Title: **28px** / line-height 35px, font-weight 600.
  - Section / Modal Title: **20px** / line-height 26px, font-weight 600.
  - Body / Table Cell: **16px** / line-height 24px, font-weight 400.
  - Supporting Text / Column Headers / Hints: **14px** (strictly ≥ 14px in real UI).
  - Unobtrusive outer reference caption: **12px** (outside app canvas).

---

## 2. Architecture, Authorization & Language Semantics

1. **Product Boundary:**
   - Monorepo package `lingora-admin/` is strictly for **Admin and Teacher** personas. No learner routes or public signups.
   - Learner application `lingora-web` is deferred to Slice 9+.
2. **Server-Side Authorization Boundary:**
   - Identity from Supabase Auth (`auth.users.id`). Fresh backend query in `app.accounts` where `id == auth.users.id`.
   - **Active Admin Gate:** Accessing `/languages` or language CRUD requires `role === 'ADMIN'` and `status === 'ACTIVE'`.
   - **Teacher Safe Boundary:** If `role === 'TEACHER'` authenticates at `/login`, display safe informational landing (*"Xin chào Giáo viên [Tên]. Phân hệ giảng dạy đang được phát triển. Vui lòng quay lại sau."*) with Logout. Never redirect teachers into `/languages` or 403 loops.
   - **Status Denials:** Inactive/pending/disabled accounts receive HTTP 403 Forbidden. Unauthenticated requests receive HTTP 401 Unauthorized (`403 Forbidden != 401 Expired`).
3. **Language Semantics & Scope Boundaries:**
   - **Target Language (Ngôn ngữ mục tiêu):** Ngôn ngữ người học đang học trong khóa học (ví dụ: `en` — Tiếng Anh, `ja` — Tiếng Nhật, `fr` — Tiếng Pháp).
   - **Instruction Language (Ngôn ngữ giảng dạy / giải thích):** Ngôn ngữ dùng để giải thích khái niệm, dịch nghĩa, đưa ra hướng dẫn và chỉ dẫn sư phạm trong quá trình học tập.
     *Ví dụ:* Người học Việt Nam học Tiếng Anh:
     - `target_language = 'en'`
     - `instruction_language = 'vi'`
   - **Interface Language (Ngôn ngữ giao diện):** Ngôn ngữ hiển thị của toàn bộ hệ thống gồm thanh điều hướng, nút bấm, menu quản trị và system UI chung (`isUiLocale: true`). Đây là khái niệm hoàn toàn độc lập với instruction language.
   - **Phạm vi màn hình Languages (`/languages`):** Chỉ quản lý danh mục ngôn ngữ hệ thống (`Language` catalogue), đánh dấu khả năng làm ngôn ngữ học tập (`isLearnable`) và hỗ trợ bản địa hóa giao diện (`isUiLocale`). Màn hình này **tuyệt đối không quản lý cặp quan hệ "học X bằng Y"** (learn-X-through-Y pairing) và **không có cột "Học bằng"**.
4. **Deferred Architecture Check cho Course Slice (Slice 3):**
   - Khi thiết kế Slice 3 (Quản lý khóa học & chương trình học), Codex và Implementation Agent phải kiểm tra và xác minh schema PostgreSQL thực tế xem đã có quan hệ mô hình hóa `target_language` và `instruction_language` (hoặc cấu trúc quan hệ tương đương) hay chưa.
   - Tuyệt đối không tự ý thêm cột/field vào database schema trong Slice 0 hay Slice 1.
   - Nếu trong MVP có nhận định cố định instruction language là Tiếng Việt, đó phải được ghi nhận rõ là **product assumption**, không được tự biến assumption thành schema fact.

---

## 3. UI Decisions & Screen Baseline

### Screen SCR-A-01: Staff Authentication (Login)
- **Composition:** Borderless open form composition (max-width 380px) on `#FBFBF9` canvas. No card borders, no shadow box.
- **Content:** Provisional wordmark "Lingora", heading "Đăng nhập cán bộ", subtitle "Dành riêng cho Quản trị viên và Giáo viên hệ thống.", plain "Email" and "Mật khẩu" inputs, and 44px primary CTA "Đăng nhập".
- **Invalid State:** In-place red alert banner above inputs (*"Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại."*). Preserves entered email, clears password, focuses password input.

### Screen SCR-A-LANG-01: Languages Catalog (Table)
- **Open Layout:** Directly on paper canvas with light 1px dividers (`#E2E7E2`). No outer card borders or footer panels.
- **Header:** Page title "Quản lý ngôn ngữ" (28px), subtitle "Khai báo mã ngôn ngữ, cấu hình học tập và hỗ trợ bản địa hóa giao diện.", and "+ Thêm ngôn ngữ" button.
- **Toolbar:** Single compact search input (280px) with stroke search icon. No filter chrome buttons.
- **Columns (Schema fields only):**
  1. **Mã:** Lowercase code in 14px monospace font-weight 600 (`vi`, `en`, `ja`, `fr`).
  2. **Tên ngôn ngữ:** Vietnamese name primary (16px bold), English name secondary (14px muted).
  3. **Có thể học:** Typographic `Học được` (`isLearnable: true`) or `— Không` (`false`). *(Không có cột "Học bằng".)*
  4. **Làm giao diện:** Typographic `Hỗ trợ giao diện` (`isUiLocale: true`) or `— Không` (`false`).
  5. **Thao tác:** Lightweight text buttons: "Sửa" (green text) and "Xóa" (muted text). No button borders.
- **Empty State:** Open layout with message *"Chưa có ngôn ngữ nào. Bắt đầu bằng cách thêm ngôn ngữ đầu tiên vào danh mục quản trị."* and CTA button "+ Thêm ngôn ngữ". No conflicting counts or dummy tables.
- **Loading State:** 4 clean skeleton shimmer lines matching 52px table rhythm. No fabricated counts or timestamps.

### Screen SCR-A-LANG-02 & 03: Create & Edit Language Modals
- **Form Pattern Choice:** Centered Modal Dialog (**520px**). Short 5-field administrative records remain anchored in catalog context with keyboard focus trapping.
- **Mã ngôn ngữ (`code`):**
  - *Format (UI Decision):* Lowercase alphanumeric and hyphens, 2–10 chars (`^[a-z0-9]{2,10}(-[a-z0-9]+)?$`), maxlength 10. Hint: *"Từ 2–10 ký tự thường (ví dụ: vi, en, zh-cn). Không thể đổi sau khi tạo."*
  - *Create Mode:* Editable text input with focus ring.
  - *Edit Mode:* Locked with plain readonly styling (background `#F2F5F2`, text `#4A5B50`, border `#CBD5CE`). All inputs maintain consistent 100% width.
- **Tên tiếng Việt (`names.vi`):** Required text input, 1–100 chars (*"Tên tiếng Việt \*"*).
- **Tên tiếng Anh (`names.en`):** Optional text input, max 100 chars (*"Tên tiếng Anh (tùy chọn)"*).
- **Checkboxes:** Clean labels without schema variable names: `[ ] Có thể học` and `[ ] Dùng làm ngôn ngữ giao diện`.

### Screen SCR-A-LANG-04: Delete Confirmation vs. Delete Blocked
- **Delete Confirmation (Unreferenced language, e.g. `fr`):**
  - Neutral heading "Xóa ngôn ngữ", body *"Bạn có chắc chắn muốn xóa ngôn ngữ Tiếng Pháp (fr)? Thao tác này không thể hoàn tác."*
  - Initial focus strictly defaults to "Hủy" button (Cancel). Confirm button is destructive red "Xóa ngôn ngữ".
- **Delete Blocked State (Referenced language, e.g. `vi`):**
  - Concise plain statement: Heading "Không thể xóa ngôn ngữ", body *"Ngôn ngữ Tiếng Việt (vi) đang được sử dụng trong các khóa học hoặc tài khoản người dùng."*
  - No fake counts, no database error codes, no toggle suggestions. Single primary action "Đóng" (Close).

### Screen SCR-A-LANG-05: Session Expired Modal (Accessibility & Focus)
- **Initial Focus:** Initial focus strictly placed onto the primary login-return action button ("Đăng nhập lại", `#sessionLoginBtn`) with a visible focus ring (2px green outline with 2px offset).
- **Inert Background:** The entire main application container (`#appContainer`) is marked `inert`.
- **Focus Containment:** Tab and Shift+Tab navigation are strictly contained within the modal.
- **Escape Key Guard:** The Escape key must NOT dismiss the modal back to the expired catalogue (`preventDefault` is called, keeping the modal open and focused to protect stale administrative catalog data).
- **Safe Transition:** Activating "Đăng nhập lại" safely closes the modal, transitions cleanly to the login view (`#authView`), and sets focus directly into the email input.

---

## 4. Component Baseline (Slice 1 Canonical Taxonomy)

Để đảm bảo Slice 1 xây dựng đúng và không trừu tượng hóa quá mức (KISS), các thành phần UI được phân định rõ ràng thành 3 nhóm:

### 4.1 Reusable Primitives (Thực sự cần ở Slice 1)
| Component | Trách nhiệm chính | State quan trọng | Khi nào tái sử dụng (Reuse) |
|---|---|---|---|
| `AppShell` | Khung bố cục tổng thể ứng dụng Admin (sidebar 212px cố định bên trái + vùng nội dung chính cuộn bên phải). | Unauthenticated (ẩn shell), Authenticated (hiển thị shell kèm sidebar và content view). | Mọi màn hình nội bộ Admin/Teacher (Languages, Courses, Accounts). |
| `Sidebar` | Thanh điều hướng 212px bên trái, hiển thị brand wordmark, menu điều hướng và khối tài khoản cán bộ kèm nút đăng xuất. | Nav item active/default, account avatar/name. | Cố định trong toàn bộ AppShell. |
| `PageHeader` | Vùng tiêu đề đầu trang (tiêu đề 28px, mô tả ngắn 14px) và action chính cấp trang (+ Thêm ngôn ngữ). | Tiêu đề tĩnh, có/không có action button. | Đầu mỗi trang quản trị chức năng. |
| `Button` | Các nút bấm tương tác 44px (Primary `#24543D`, Secondary, Destructive Red `#A63228`) và text button không viền (Sửa, Xóa). | Default, hover, focus-visible (outline 2px offset 2px), loading/disabled. | Mọi form, dialog, thanh toolbar và hàng bảng. |
| `Input` | Ô nhập liệu chuẩn 44px (text, search, email, password) với viền control đạt tương phản WCAG. | Normal, focus (green ring), error (red ring), readonly/disabled. | Mọi form nhập liệu và ô tìm kiếm. |
| `Field` | Bọc nhãn (`label`), đánh dấu bắt buộc (`*`), gợi ý dưới control (`hint`) và liên kết trợ năng (`id`/`htmlFor`/`aria-describedby`). | Normal, error, required/optional. | Mọi trường dữ liệu trong form/dialog. |
| `FieldError` | Dòng text thông báo lỗi trực tiếp dưới control (`role="alert"`, màu đỏ `--danger-red`, font 14px semibold). | Hidden, visible (chứa nội dung lỗi cụ thể như trùng mã HTTP 409). | Mọi input có validation hoặc lỗi từ chối từ backend. |
| `Table` | Bảng dữ liệu phẳng dạng mở (không bọc card), các đường kẻ ngang 1px phân cách nhẹ, chiều cao hàng chuẩn 52px. | Thead cố định nhịp, tbody danh sách dòng dữ liệu, hover hiệu ứng nhẹ. | Các bảng danh mục dữ liệu phẳng trong Admin. |
| `EmptyState` | Bố cục thông báo danh mục rỗng dạng mở (tiêu đề 20px, mô tả, nút CTA thêm mới). | Hiển thị khi danh mục có 0 bản ghi. | Mọi danh mục rỗng (không dựng bảng giả hay số đếm mâu thuẫn). |
| `InlineAlert` | Khối thông báo/cảnh báo nằm trong luồng giao diện (`role="alert"`), ví dụ thông báo sai thông tin đăng nhập hoặc lỗi tải dữ liệu 500. | Error / Warning, hiển thị inline trong flow. | Trang login, đỉnh form khi gặp lỗi tổng quát của máy chủ. |
| `Dialog` | Cửa sổ modal nổi (520px cho form, 460px-480px cho confirm), backdrop bán trong suốt 45%, bẫy focus Tab, backdrop ngoài `inert`. | Open/close, trapping focus, pending lock (khóa submit/escape/backdrop khi mutation đang gửi). | Mọi tác vụ tạo/sửa nhanh và hộp thoại xác nhận. |
| `LoadingState` | 4 dòng skeleton shimmer nhịp 52px mô phỏng bảng dữ liệu trong khi fetch API. | Visible khi fetch dữ liệu ban đầu, hidden khi có data/error. | Màn hình chờ tải dữ liệu danh mục. |

### 4.2 Language-Specific Components (Chỉ thuộc feature Languages)
1. `LanguageTable`: Bảng hiển thị 5 cột đặc thù của Languages kèm tóm tắt số lượng và thanh feedback trạng thái inline.
2. `LanguageForm`: Form 5 trường (code, names.vi, names.en, checkLearnable, checkUiLocale) đặt trong Dialog.
3. `LanguageDeleteModals`: Cặp modal xác nhận xóa (với ngôn ngữ chưa ràng buộc) và modal thông báo chặn xóa (với ngôn ngữ có khóa ngoại ràng buộc).

### 4.3 Deferred Components (Chưa cần thiết ở Slice 1)
- Complex dropdown / cascading context menu popovers.
- Global toast notification framework / floating snackbars.
- Data-grid abstractions (virtual scrolling, dynamic column sorting/resizing, column reordering).
- Learner-facing components (bài học, luyện tập, flashcards, game widgets).
- Course authoring studio components (cây bài học, biên tập quiz, rich text/markdown editor).

---

## 5. Mutation Feedback & Table Update Lifecycle

### 5.1 Success Feedback Convention (Quy ước duy nhất)
- **Cơ chế:** Dòng chữ thông báo trạng thái inline nhỏ gọn, sử dụng `role="status"` và `aria-live="polite"`.
- **Vị trí:** Đặt bên cạnh/dưới dòng tóm tắt số lượng bản ghi hiện có (`.table-summary-bar`). Tuyệt đối không dùng toast framework, không dùng modal thông báo, không dùng floating overlay.
- **Tiêu điểm:** Không di chuyển focus bàn phím vào dòng status feedback.
- **Thông điệp chuẩn Tiếng Việt:**
  - Tạo mới thành công: `Đã thêm ngôn ngữ`
  - Cập nhật thành công: `Đã cập nhật ngôn ngữ`
  - Xóa thành công: `Đã xóa ngôn ngữ`
- **Thời điểm xóa (Clear):** Dòng status text tự động biến mất ngay khi người dùng thực hiện tương tác tiếp theo (gõ ô tìm kiếm, mở modal tạo/sửa, bấm nút sửa/xóa hàng) hoặc chuyển đổi trạng thái giao diện.

### 5.2 Table Mutation & Reconciliation Behavior
1. **Create Success:**
   - Đóng dialog form ngay sau khi nhận phản hồi thành công từ backend (HTTP 201).
   - Chèn bản ghi mới từ response server vào danh sách bảng theo mã `code` bất biến.
   - Cập nhật số đếm danh mục và ẩn EmptyState nếu trước đó rỗng.
   - Bảo toàn ngữ nghĩa bộ lọc/tìm kiếm: nếu bản ghi mới không khớp với từ khóa tìm kiếm đang gõ, bảng tiếp tục áp dụng lọc, nhưng dòng thông báo inline làm rõ thao tác tạo đã thành công.
   - Không reload toàn bộ trang; không xóa/chèn optimistic trước khi có phản hồi máy chủ.
   - Focus tự động quay về nút `+ Thêm ngôn ngữ` ở đầu trang.
2. **Edit Success:**
   - Đóng dialog form ngay sau khi nhận phản hồi thành công từ backend (HTTP 200).
   - Thay thế trực tiếp dữ liệu dòng trong bảng bằng payload từ server (bao gồm việc xóa khóa `names.en` nếu người dùng để trống).
   - Không reload toàn bộ trang.
   - Focus tự động quay về nút `Sửa` của dòng vừa cập nhật (fallback về nút `+ Thêm ngôn ngữ` nếu dòng không còn tồn tại).
3. **Delete Success:**
   - Đóng modal xác nhận chỉ sau khi nhận phản hồi thành công từ backend (HTTP 200/204).
   - Xóa dòng khỏi bảng dữ liệu và giảm số đếm danh mục.
   - Tuyệt đối không xóa optimistic trước phản hồi máy chủ.
   - Nếu phần tử vừa xóa là phần tử cuối cùng, chuyển giao diện sang `EmptyState`.
   - Focus tự động chuyển sang nút hành động của dòng sống kế tiếp (hoặc dòng sống trước đó), hoặc chuyển vào nút `+ Thêm ngôn ngữ` nếu bảng trở thành rỗng.
4. **Authoritative List Reconciliation Fallback:**
   - Nếu response của mutation không trả về bản ghi đầy đủ chuẩn xác, client phải thực hiện refetch lại danh mục chuẩn từ backend trước khi hiển thị thông báo thành công đồng bộ.
   - Nếu thao tác refetch gặp lỗi, UI tuyệt đối không được tự ý báo là bảng đã được cập nhật.
5. **Mutation Failure & Pending Locks:**
   - Trong quá trình gửi request lên server (create/edit/delete): nút submit chuyển sang trạng thái loading và disabled; nút Hủy disabled; phím Escape và thao tác click ra ngoài backdrop bị khóa.
   - Khi gặp lỗi validation (ví dụ trùng mã `code` HTTP 409): hiển thị lỗi sát trường `code`, giữ nguyên 100% dữ liệu đang nhập dở, đưa focus về trường lỗi.
   - Khi gặp lỗi mạng / 500: hiển thị cảnh báo lỗi inline trong form đang mở, giữ nguyên input cho phép người dùng thử lại.
   - Khi xóa thất bại do ràng buộc khóa ngoại (HTTP 409): hiển thị modal chặn xóa, giữ nguyên 100% dòng và số đếm trong bảng.

### 5.3 Phân biệt giữa Prototype Simulation và Real Backend (Slice 1)
- **Prototype tĩnh (`prototype/`):** Chỉ là công cụ trực quan hóa giao diện và mô phỏng in-memory nhẹ (local simulation) cho các luồng cơ bản: tạo, sửa, xóa, báo trùng mã và chặn xóa để kiểm tra tương tác UI và chụp ảnh màn hình tham chiếu. Prototype **chưa cài đặt kết nối mạng thực tế, chưa có API backend, chưa có pending locks bất đồng bộ hay cơ chế xử lý lỗi máy chủ HTTP 500 thực tế**.
- **Quy chuẩn sản phẩm thực tế (Slice 1):** Toàn bộ các quy tắc về kết nối mạng, xử lý pending state, lỗi 500, bẫy lỗi Zod/Prisma và xác thực quyền Admin trên server sẽ được xây dựng hoàn chỉnh ở Backend của Slice 1 theo đúng kiến trúc monorepo `lingora-admin/`.

---

## 6. Interaction, Validation & Data Integrity Rules

1. **Optional English Clearing (`names.en`):**
   - Submitting an empty or blank `names.en` on edit causes the backend to delete the `en` key (`delete updatedNames.en`), while preserving all existing untouched locale keys (`names.vi`, and any existing `names.ja`, `names.fr`, etc.).
2. **Account-Scoped Drafts & Safe Session Expiry:**
   - Unsaved dirty form data is stored in `sessionStorage` strictly scoped to the verified account UUID: `lingora_draft_lang_<accountId>`.
   - Cleared immediately on logout or identity switch. Expired after **1 hour** TTL.
   - On re-login as the same user, an explicit prompt offers draft recovery; it is **never automatically replayed as a database write**.
3. **Duplicate Code Error (HTTP 409):**
   - Error appears directly under the `code` input (*"Mã ngôn ngữ này đã tồn tại trong hệ thống."*).
   - User inputs in `names.vi`, `names.en`, and checkboxes are **strictly preserved**. Focus returns to `code`.
4. **Network / 500 Failure:**
   - Form inputs preserved; warning banner appears; submit button re-enabled for retry.
5. **Pending Mutation Interaction:**
   - Submit button shows loading state and is disabled; Cancel disabled; Escape key and backdrop click locked.
6. **Modal Accessibility & Focus Trapping:**
   - All dialogs implement `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.
   - Main container is marked `inert` while dialog is active.
   - Focus is automatically placed into first editable field upon opening, trapped during Tab navigation, and restored to trigger button upon close.

---

## 7. Canonical Screenshot References

Captured in real Chromium 152 via Playwright across **1440×960** (desktop) and **1100×800** (laptop/tablet):

| State | Desktop (1440×960) | Laptop (1100×800) | Description |
|---|---|---|---|
| `login-normal` | [1440/login-normal.png](../docs/design/admin-ui-baseline/screenshots/1440/login-normal.png) | [1100/login-normal.png](../docs/design/admin-ui-baseline/screenshots/1100/login-normal.png) | Borderless open login composition, provisional wordmark, email & password. |
| `login-invalid` | [1440/login-invalid.png](../docs/design/admin-ui-baseline/screenshots/1440/login-invalid.png) | [1100/login-invalid.png](../docs/design/admin-ui-baseline/screenshots/1100/login-invalid.png) | In-place red alert banner, email preserved, password error border. |
| `languages-populated` | [1440/languages-populated.png](../docs/design/admin-ui-baseline/screenshots/1440/languages-populated.png) | [1100/languages-populated.png](../docs/design/admin-ui-baseline/screenshots/1100/languages-populated.png) | Light sage sidebar, 4 open table rows (52px), column "Có thể học", typographic booleans, text actions. |
| `languages-empty` | [1440/languages-empty.png](../docs/design/admin-ui-baseline/screenshots/1440/languages-empty.png) | [1100/languages-empty.png](../docs/design/admin-ui-baseline/screenshots/1100/languages-empty.png) | Open empty catalog message with CTA, zero filter chrome. |
| `language-create` | [1440/language-create.png](../docs/design/admin-ui-baseline/screenshots/1440/language-create.png) | [1100/language-create.png](../docs/design/admin-ui-baseline/screenshots/1100/language-create.png) | 520px modal, code focus ring, consistent input widths, checkbox "Có thể học". |
| `language-edit` | [1440/language-edit.png](../docs/design/admin-ui-baseline/screenshots/1440/language-edit.png) | [1100/language-edit.png](../docs/design/admin-ui-baseline/screenshots/1100/language-edit.png) | Locked code `fr` in plain readonly style, focus on Vietnamese name, checkbox "Có thể học". |
| `delete-confirmation` | [1440/delete-confirmation.png](../docs/design/admin-ui-baseline/screenshots/1440/delete-confirmation.png) | [1100/delete-confirmation.png](../docs/design/admin-ui-baseline/screenshots/1100/delete-confirmation.png) | Neutral dialog, default autofocus on "Hủy", red delete button. |
| `delete-blocked` | [1440/delete-blocked.png](../docs/design/admin-ui-baseline/screenshots/1440/delete-blocked.png) | [1100/delete-blocked.png](../docs/design/admin-ui-baseline/screenshots/1100/delete-blocked.png) | Concise referenced-data explanation, single primary "Đóng" button. |
| `language-create-duplicate` | [1440/language-create-duplicate.png](../docs/design/admin-ui-baseline/screenshots/1440/language-create-duplicate.png) | [1100/language-create-duplicate.png](../docs/design/admin-ui-baseline/screenshots/1100/language-create-duplicate.png) | Duplicate code error placed directly under field; other inputs preserved. |
| `languages-loading` | [1440/languages-loading.png](../docs/design/admin-ui-baseline/screenshots/1440/languages-loading.png) | [1100/languages-loading.png](../docs/design/admin-ui-baseline/screenshots/1100/languages-loading.png) | Shimmering 52px skeleton rows; zero fake counts or timestamps. |
| `languages-fetch-error` | [1440/languages-fetch-error.png](../docs/design/admin-ui-baseline/screenshots/1440/languages-fetch-error.png) | [1100/languages-fetch-error.png](../docs/design/admin-ui-baseline/screenshots/1100/languages-fetch-error.png) | Open error message with "Thử tải lại" retry action. |
| `session-lost` | [1440/session-lost.png](../docs/design/admin-ui-baseline/screenshots/1440/session-lost.png) | [1100/session-lost.png](../docs/design/admin-ui-baseline/screenshots/1100/session-lost.png) | Safe draft notification with visible focus ring on "Đăng nhập lại" return CTA. |

---

## 8. Reproduction & Inspection Commands

1. **Serve Prototype Locally:**
   ```bash
   cd docs/design/admin-ui-baseline/prototype && python3 -m http.server 4178
   ```
   Open `http://127.0.0.1:4178/index.html` in browser.
2. **Re-execute Automated Screenshot Capture:**
   ```bash
   NODE_PATH=/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /home/tung/.local/bin/node docs/design/admin-ui-baseline/prototype/capture.cjs
   ```
   Capture specific affected states:
   ```bash
   NODE_PATH=/home/tung/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules /home/tung/.local/bin/node docs/design/admin-ui-baseline/prototype/capture.cjs languages-populated language-create language-create-duplicate language-edit delete-confirmation delete-blocked session-lost
   ```

---

## 9. Slice 1 Implementation Acceptance Criteria

1. **Architecture Compliance:** All Slice 1 implementation restricted to `lingora-admin/`. No `lingora-web` package or learner routes created. Schema unchanged.
2. **Auth Verification:** Backend query in `app.accounts` verifies `role === 'ADMIN'` and `status === 'ACTIVE'`. Teachers receive safe informational view. Unauthenticated receives 401; unauthorized receives 403.
3. **Data Schema & Validation:** `code` regex `^[a-z0-9]{2,10}(-[a-z0-9]+)?$`, max 10 chars. Required `names.vi` (1–100 chars). Optional `names.en` (clearing removes key from JSON). Existing locale keys preserved. No invented columns (`status`, `name`, `isActive` do not exist on `Language`).
4. **Error & State Retention:** Duplicate code returns HTTP 409 and highlights `code` while preserving other fields. FK delete restrict returns HTTP 409 and renders blocked dialog. Dirty forms cached to account-scoped session storage.
5. **UI & Accessibility:** Table rows strictly 52px; controls strictly 44px; text contrast ≥ 4.5:1; control borders ≥ 3.0:1. Cancel button autofocuses on delete confirmation dialog. Dialogs trap Tab focus and restore focus on close.
6. **Mutation & Success Conventions:** Follow the single inline status text convention (`role="status"`, `aria-live="polite"` beside/below summary) with exact messages: `Đã thêm ngôn ngữ`, `Đã cập nhật ngôn ngữ`, `Đã xóa ngôn ngữ`.

## 10. Slice 0 Closure Acceptance — Codex, 2026-10-28

| Criterion | Final review |
|---|---|
| AC1 — Component baseline | PASS — reusable primitives, Languages-specific and deferred groups in §4. |
| AC2 — Mutation success | PASS — one inline status convention and create/edit/delete outcomes in §5. |
| AC3 — Table reconciliation | PASS — server-result rules, count/empty/focus/failure in §5.2; local create/edit/delete, filters and empty → create → delete → create verified in Chromium. |
| AC4 — Session-expired focus | PASS — initial focus on login action, visible 2px ring, inert background, Tab/Shift+Tab containment, Escape guard and login/email transition verified at both widths. |
| AC5 — Terminology | PASS — `Có thể học` throughout canonical/prototype/reference text; previous ambiguous label absent. |
| AC6 — Languages scope | PASS — catalogue/learnable/interface flags only; no instruction-language column. |
| AC7 — Language semantics | PASS — target/instruction/interface distinction and example in §2.3. |
| AC8 — Deferred Course check | PASS — actual schema/equivalent relations must be verified in Slice 3; Vietnamese instruction remains a product assumption, not a schema fact (§2.4). |
| AC9 — Visual scope | PASS — accepted palette, Lato, layout and sidebar retained; all 14 affected PNGs inspected and matched final browser output; 10 unaffected PNGs unchanged. |
| AC10 — No Slice 1 | PASS — no production app, DB/API/Supabase, dependency or package-script changes; no commit/push. |

Codex independently inspected the closure diff, canonical and all affected screenshots. Final Playwright/Chromium checks at 1440×960 and 1100×800 exited 0 with zero console errors; duplicate/blocked failures preserve data, and markup-shaped names remain literal text in rows and delete dialogs. Real network/pending/500 handling remains a Slice 1 requirement (§5.3). Before Slice 1 runtime verification, confirm Supabase Auth configuration and an authenticated account with `role = ADMIN`, `status = ACTIVE`; the current seed does not provision an Account. Credentials and database access were not inspected in this closure.

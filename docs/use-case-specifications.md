# ĐẶC TẢ CHI TIẾT CÁC USE CASE - HỆ THỐNG LINGORA

Tài liệu này chứa 14 mục catalog: 13 Use Case active và một reminder deferred của Lingora; UC-03 reminder được giữ để traceability nhưng deferred. Reassessment không phải một UC MVP trong catalog này.

---

## MỤC LỤC DANH MỤC USE CASE CHI TIẾT

- **Phân hệ Chung**
  - [1. Xác thực, Đăng nhập và Quản lý hồ sơ](#1-xác-thực-đăng-nhập-và-quản-lý-hồ-sơ)
- **Phân hệ Người học**
  - [2. Kiểm tra trình độ đầu vào](#2-kiểm-tra-trình-độ-đầu-vào)
  - [3. Nhắc học qua Email](#3-nhắc-học-qua-email)
  - [4. Khám phá Lộ trình học](#4-khám-phá-lộ-trình-học)
  - [5. Thi lên cấp](#5-thi-lên-cấp)
  - [6. Học bài và Làm bài tập tương tác](#6-học-bài-và-làm-bài-tập-tương-tác)
  - [7. Học từ vựng Flashcard và Ôn tập](#7-học-từ-vựng-flashcard-và-ôn-tập)
  - [8. Theo dõi Tiến độ và Chuỗi ngày học](#8-theo-dõi-tiến-độ-và-chuỗi-ngày-học)
- **Phân hệ Đề cương & Biên soạn**
  - [9. Lập đề cương, ma trận đề thi và Phân công](#9-lập-đề-cương-ma-trận-đề-thi-và-phân-công)
  - [10. Soạn bài học và Câu hỏi đề thi theo phân công](#10-soạn-bài-học-và-câu-hỏi-đề-thi-theo-phân-công)
  - [11. Nộp bài và Nộp lại sau chỉnh sửa](#11-nộp-bài-và-nộp-lại-sau-chỉnh-sửa)
  - [12. Thẩm định và Xuất bản nội dung](#12-thẩm-định-và-xuất-bản-nội-dung)
- **Phân hệ Quản trị & Vận hành**
  - [13. Quản lý Người dùng và Tài khoản Giáo viên](#13-quản-lý-người-dùng-và-tài-khoản-giáo-viên)
  - [14. Xem Báo cáo và Thống kê toàn hệ thống](#14-xem-báo-cáo-và-thống-kê-toàn-hệ-thống)
- **Tổng kết & Giới hạn**
  - [15. Hạn chế đã biết (Known Limitations)](#15-hạn-chế-đã-biết-known-limitations)

---



> **Authority and catalog identity (2026-10-10):** The numbered behavior catalog below has 14 entries; heading 15 is only a limitations section, not UC-15. UC-03 reminder remains deferred; there is no standalone Reassessment UC in this catalog. UC-xx identifiers are local to their source catalog and do not establish identity across versions. ADR-034 controls current business roles/responsibilities; ADR-032 controls Placement; ADR-033 controls lesson completion/progress/progression/activity; ADR-035 controls logical identity security, assignment/content lifecycle, assessment secrecy/results, SRS trust, and audit behavior; ADR-036 controls revised lesson attempts, SRS enrollment, curriculum availability, assessment packages/versions, Reassessment deferral, and Admin learner-account scope; ADR-041 clarifies learner-visible SRS interaction and excludes SRS from scored immutable Placement/Level-up versions. These are product/domain decisions, not implementation approval; physical realization remains deferred.
>
> The requested “Phase 2A catalog” is not present as a separately named authoritative artifact. The nearest extant predecessor is docs/05-traceability-matrix.md §2, which labels itself a Phase 0 15-UC catalog; the M2.2 15-UC catalog is in docs/phase-1-m2-2-behavior-uc-activity-state.md. Both are retained as historical crosswalk inputs. Their deployment statuses and role names are not current evidence.

| Current catalog (use-case-specifications.md) | Inherited 15-UC trace catalog (docs/05 §2) | M2.2 15-UC catalog | Relationship / current disposition |
|---|---|---|---|
| UC-01 Authentication/profile | UC-01 Authenticate & Manage Session | UC-01 Authenticate & Manage Session | Same broad capability; current actor/account rules are narrower and controlled by ADR-034. |
| UC-02 Placement | UC-03 Diagnostic / Select Level | UC-03 Take Placement Test | Renumbered; ADR-032 replaces lifetime lock, fixed result mapping, and default-A1 claims. |
| UC-03 Email reminder | No direct equivalent | No direct equivalent | Added later; deferred by ADR-031. Retained as a catalog placeholder, not an MVP commitment. |
| UC-04 Learning path | UC-04 Browse Learning Path | UC-04 Browse Path & Jump | Browse-path portion maps; Jump is deferred by ADR-033. |
| UC-05 Level-up assessment | No direct equivalent | UC-04 Browse Path & Jump | Distinct current assessment behavior; Jump is not an alias and remains deferred. |
| UC-06 Lesson and exercises | UC-05 Complete Lesson Exercises | UC-05 Complete Lesson Exercises | Broad capability maps; ADR-033 controls completion and performance semantics. |
| UC-07 Vocabulary/SRS | UC-06 Spaced Repetition Review | UC-06 Spaced Repetition (SRS) | SRS portion maps; flashcard authoring/learning detail is broader in current wording. ADR-035 fixes the logical Policy B trust boundary/idempotency; physical RPC/storage realization remains deferred. |
| UC-08 Progress/streak | UC-07 Track Progress, Mastery & Readiness | UC-07 Track Progress & Streak | Progress/streak maps; mastery/readiness must not be inferred from completion metrics. |
| UC-09 Curriculum requirements and assignment | No direct equivalent | No direct equivalent | Current administrative planning/assignment capability; ADR-035 fixes logical assignment scope/ownership; physical representation remains deferred. |
| UC-10 Assigned content authoring | UC-08 Create & Edit Lesson Draft | UC-08 Create/Edit Lesson Draft | Same broad capability; current author is Teacher on assigned work only. |
| UC-11 Submit/resubmit assigned work | Part of UC-08 | Part of UC-08 | Split from authoring for clarity; no independent legacy ID. |
| UC-12 Review, approval, publication | UC-09 Review & Approve + UC-10 Publish Approved Content | UC-09 Review/Moderate + UC-10 Publish Approved Content | Two predecessor cases consolidated; Admin may publish only approved content. ADR-035 fixes logical revision/publication behavior; physical states/versioning stay deferred. |
| UC-13 Learner/Teacher account administration | UC-11 Manage Accounts & Roles | UC-11 Manage Accounts & Roles | Controlled account provisioning/management under ADR-034/036; no role-conversion workflow or learning-evidence edits. |
| UC-14 Operational reports | UC-12 View System Reports | UC-12 View System Reports | Broad reporting capability maps; direct-publish report is obsolete. ADR-035 fixes minimum logical audit events and Admin read access; physical audit storage/emission/retention stays deferred. |
| No standalone current UC | UC-02 Configure Goals & Study Time | UC-02 Configure Goals & Time | No current standalone UC; daily goal is distinct from streak and physical Profile.dailyGoalMin remains P0-D07. |
| No standalone current UC | UC-13 View & Audit Security Logs | UC-13 View/Audit Security Log | Cross-cutting audit need, not a separate current UC; logical policy is ADR-035 and physical audit implementation remains deferred. |
| No current UC | UC-14 Handle Support Tickets | UC-14 Handle Support Tickets | Not in current catalog; historical/future scope pending Product Owner decision. |
| No current UC | UC-15 Optional Cohorts | UC-15 Manage Cohorts / Groups | Optional future B2B boundary; not current MVP scope. |


### Canonical UC identity and diagram views (Final Modeling Review, 2026-10-11)

The catalog has 13 active actor-goal cases (UC-01/02/04–14) and one deferred placeholder (UC-03 reminder). Heading 15 is a limitations section. Auth/profile share the account-access goal; authoring (UC-10) and submission/revision response (UC-11) have distinct outcomes; curriculum planning/assignment (UC-09) differs from review/publication (UC-12). Reassessment has no active UC. No count is imposed as a product constraint.

| Diagram identity | Canonical behavior coverage | Stable source filename alias |
|---|---|---|
| VIEW-UC-01 overall | UC-01–14 (UC-03 deferred) | `modeling/current-target/src/UC-01-target-overall.puml` |
| VIEW-UC-02 learner | UC-01/02/04/05/06/07/08; context as supporting behavior | `modeling/current-target/src/UC-02-target-learner.puml` |
| VIEW-UC-03 teacher | UC-01/10/11 | `modeling/current-target/src/UC-03-target-teacher.puml` |
| VIEW-UC-04 admin | UC-01/09/12/13/14 | `modeling/current-target/src/UC-04-target-admin.puml` |

VIEW-UC-* identifies diagrams only. UC-* in behavior labels identifies the canonical catalog. Old diagram filenames remain stable aliases; VIEW-UC-03 never means reminder UC-03. The historical catalog crosswalk above remains unchanged.

### Report-oriented functional view crosswalk (2026-10-12)

The `VIEW-RUC-01`–`VIEW-RUC-07` diagrams and `VIEW-RUC-08A`/`VIEW-RUC-08B` subviews under `docs/modeling/report-usecases/` group existing behavior for report presentation; these are diagram IDs, not new or renumbered canonical Use Cases. Actor-oriented `VIEW-UC-01`–`VIEW-UC-04` remain the role/scope views.

| Report view | Canonical UC coverage |
|---|---|
| VIEW-RUC-01 — Tài khoản và hồ sơ | UC-01 |
| VIEW-RUC-02 — Ngữ cảnh học tập | UC-01 supporting authentication; UC-02 Placement; UC-04 learning path |
| VIEW-RUC-03 — Bài học và luyện tập | UC-06 lesson; UC-08 progress/performance; UC-07 only for optional SRS review questions in ordinary practice |
| VIEW-RUC-04 — SRS | UC-07; UC-06 lesson-completion enrollment trigger |
| VIEW-RUC-05 — Placement và Level-up | UC-02 Placement; UC-05 Level-up |
| VIEW-RUC-06 — Tiến độ và lịch sử | UC-04 curriculum path; UC-06 completion/performance; UC-08 progress/streak |
| VIEW-RUC-07 — Teacher authoring | UC-09 assigned scope; UC-10 authoring; UC-11 submission/revision response |
| VIEW-RUC-08A — Admin content governance; VIEW-RUC-08B — Admin account/support | UC-09 planning/assignment; UC-12 review/publication; UC-13 accounts; UC-14 reports/audit |


## 1. Xác thực, Đăng nhập và Quản lý hồ sơ

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Xác thực, Đăng nhập và Quản lý hồ sơ** |
| **Tác nhân chính** | Người học, Giáo viên, Quản trị viên (Admin) |
| **Mục tiêu** | Cho phép người dùng đăng ký tài khoản (dành cho Người học), đăng nhập hệ thống, kích hoạt tài khoản lần đầu qua email (dành cho Giáo viên), khôi phục mật khẩu khi quên, đổi mật khẩu và cập nhật thông tin cá nhân cơ bản. |
| **Mô tả ngắn gọn** | Người dùng truy cập hệ thống để đăng nhập, đăng ký tài khoản mới, kích hoạt tài khoản qua liên kết hoặc gửi yêu cầu đặt lại mật khẩu; sau khi đăng nhập thành công, người dùng có thể cập nhật họ tên hiển thị, đổi mật khẩu hoặc đăng xuất khỏi hệ thống. |
| **Tiền điều kiện** | Thiết bị có kết nối mạng Internet liên tục tới máy chủ hệ thống. |
| **Hậu điều kiện** | • Nếu đăng nhập/đăng ký thành công, hệ thống tạo phiên làm việc hợp lệ cho người dùng.<br>• Nếu thực hiện cập nhật hồ sơ, đổi mật khẩu hoặc kích hoạt tài khoản, thông tin tương ứng được cập nhật vào cơ sở dữ liệu.<br>• Nếu yêu cầu đặt lại mật khẩu, liên kết đặt lại được tạo và gửi đến email hợp lệ. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người dùng chọn thao tác mong muốn: "Đăng nhập", "Đăng ký" (chỉ Người học), "Quên mật khẩu", hoặc mở "Liên kết kích hoạt tài khoản lần đầu" nhận được qua email (dành cho Giáo viên).<br>**2.** Hệ thống hiển thị biểu mẫu tương ứng.<br>**3.** Người dùng nhập thông tin xác thực:<br>&nbsp;&nbsp;• Nếu Đăng nhập: Nhập Email và Mật khẩu.<br>&nbsp;&nbsp;• Nếu Đăng ký: Nhập Họ tên, Email, Mật khẩu.<br>&nbsp;&nbsp;• Nếu Quên mật khẩu: Nhập Email đã đăng ký để nhận liên kết đặt lại mật khẩu.<br>&nbsp;&nbsp;• Nếu Kích hoạt tài khoản lần đầu (Giáo viên): Mở liên kết từ email, nhập mật khẩu mới theo yêu cầu.<br>**4.** Hệ thống kiểm tra dữ liệu và phản hồi:<br>&nbsp;&nbsp;4a. Dữ liệu sai định dạng hoặc mật khẩu không đủ độ dài → Báo lỗi trường thông tin tương ứng.<br>&nbsp;&nbsp;4b. Đăng nhập sai Email hoặc Mật khẩu → Thông báo "Email hoặc mật khẩu không chính xác".<br>&nbsp;&nbsp;4c. Đăng ký với Email đã tồn tại → Thông báo "Email đã được sử dụng".<br>&nbsp;&nbsp;4d. Tài khoản đang bị khóa → Thông báo "Tài khoản tạm thời bị vô hiệu hóa, vui lòng liên hệ Quản trị viên".<br>&nbsp;&nbsp;4e. Yêu cầu Quên mật khẩu hợp lệ → Gửi email chứa liên kết đặt lại mật khẩu và hiển thị thông báo "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu". Người dùng mở liên kết, nhập mật khẩu mới và hoàn tất.<br>&nbsp;&nbsp;4f. Kích hoạt tài khoản lần đầu hợp lệ → Lưu mật khẩu mới, kích hoạt trạng thái tài khoản thành hoạt động và chuyển đến trang đăng nhập.<br>&nbsp;&nbsp;4g. Đăng nhập/Đăng ký thành công → Khởi tạo phiên làm việc và chuyển hướng người dùng đến trang chính theo vai trò.<br>**5.** Người dùng mở mục "Hồ sơ cá nhân", chỉnh sửa Họ tên hiển thị hoặc chọn "Đổi mật khẩu" (nhập Mật khẩu hiện tại, Mật khẩu mới).<br>**6.** Hệ thống kiểm tra và cập nhật:<br>&nbsp;&nbsp;6a. Mật khẩu hiện tại không khớp → Báo lỗi mật khẩu không đúng.<br>&nbsp;&nbsp;6b. Mật khẩu mới trùng mật khẩu cũ hoặc không đủ độ dài → Yêu cầu nhập lại.<br>&nbsp;&nbsp;6c. Hợp lệ → Cập nhật cơ sở dữ liệu và thông báo "Lưu thông tin thành công".<br>**7.** Người dùng nhấn "Đăng xuất".<br>**8.** Hệ thống thu hồi phiên làm việc và chuyển hướng về màn hình đăng nhập. |
| **Điều kiện đặc biệt** | • Mật khẩu tối thiểu 8 ký tự, bao gồm cả chữ và số.<br>• Tài khoản Giáo viên do Quản trị viên khởi tạo trong hệ thống, không mở đăng ký tự do; Giáo viên kích hoạt tài khoản qua liên kết gửi tới email.<br>• Tài khoản Quản trị viên được provision có kiểm soát, không public signup. Mỗi tài khoản có đúng một business role (Admin, Teacher hoặc Learner); không có UI chuyển đổi role trong MVP. Staff không học bằng staff account; người cần học dùng Learner account riêng.<br>• Yêu cầu kết nối mạng liên tục; nếu mất mạng trong quá trình gửi biểu mẫu, hệ thống hiển thị thông báo "Mất kết nối Internet, vui lòng kiểm tra mạng". |
| **Yêu cầu phi chức năng** | • Thời gian xử lý xác thực ≤ 1.5 giây.<br>• Mật khẩu lưu trữ dưới dạng băm một chiều an toàn.<br>• Giao diện tương thích máy tính và thiết bị di động. |

---

## 2. Kiểm tra trình độ đầu vào

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Kiểm tra trình độ đầu vào / đề xuất điểm bắt đầu** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Hỗ trợ xác định điểm bắt đầu học phù hợp trong một LearningContext; kết quả Placement là chẩn đoán/đề xuất, không tự thân chứng nhận năng lực. |
| **Phạm vi được chốt** | Placement là một trong ba cách xác định điểm bắt đầu: Placement, người học tự khai báo, hoặc điểm bắt đầu mặc định. Placement gắn với LearningContext. Chỉ kết quả hoàn tất mới tạo bằng chứng; lượt chưa hoàn tất không tạo kết quả. Kết quả hoàn tất được giữ lại. Không có giới hạn trọn đời, khóa vĩnh viễn, hay quy tắc buộc người học làm Placement. |
| **Luồng chính** | **1.** Người học chọn làm Placement trong onboarding hoặc từ chức năng phù hợp của LearningContext.<br>**2.** Hệ thống hiển thị thông tin và tham số bài đánh giá đang được cấu hình cho ngôn ngữ/khóa học đó.<br>**3.** Người học làm và nộp bài; tham số như số câu, thời lượng, phân bố và ngưỡng là cấu hình, không phải hằng số toàn nền tảng.<br>**4.** Hệ thống ghi nhận kết quả đã hoàn tất và đề xuất điểm bắt đầu theo cấu hình được duyệt.<br>**5.** Người học xem đề xuất và tiếp tục lộ trình; lựa chọn tự khai báo hoặc điểm bắt đầu mặc định vẫn là các đường đi riêng và không được gắn nhãn là năng lực đã xác minh. |
| **Luồng thay thế** | Nếu người học rời bài hoặc bài chưa hoàn tất, không ghi nhận kết quả Placement; người học có thể tiếp tục theo một điểm bắt đầu khác hoặc làm Placement sau. Hệ thống không khóa Placement vĩnh viễn do bỏ qua hay nộp bài. |
| **Điều kiện đặc biệt** | Placement không tạo verified proficiency, certification, mastery, hay level-up result. Stage-adaptive Placement deferred trong MVP. Mapping A, A1/A2 mặc định, 30 câu, 25 phút, các ngưỡng cụ thể, và các giá trị tiếng Anh khác trong tài liệu cũ là cấu hình lịch sử/chưa được chọn nếu chưa có quyết định riêng. Assessment phải tuân thủ answer/result secrecy theo ADR-035; cách lưu result/attempt là physical design còn deferred. |
| **Yêu cầu phi chức năng** | Grading phải server-authoritative; generic content read không trả answer key; attempt chưa submit hợp lệ không tạo completed Result; Placement không trả per-item correctness trong lúc làm, và sau submit chỉ trả aggregate result/pass/recommendation cần thiết theo ADR-035. Physical API/schema boundary chưa được quyết định. |

---

## 3. Nhắc học qua Email

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Nhắc học qua Email** |
| **Tác nhân chính** | Người học |
| **Trạng thái** | DEFERRED — retained for traceability only; no MVP reminder scheduling/persistence is approved. |
| **Mục tiêu dự kiến** | Cho phép người học đặt tùy chọn nhắc học qua email. |
| **Giới hạn hiện tại** | ADR-031 xác định reminder scheduling/persistence là deferred. Vì vậy UC này không đặt yêu cầu gửi email, lưu lịch, timezone scheduler, daily-goal check, hay SLA gửi đúng giờ cho MVP. Nội dung chi tiết lịch sử phía dưới không phải yêu cầu hiện hành. |
| **Điều kiện để mở lại** | Cần Product Owner quyết định lại phạm vi, kênh, lịch, múi giờ, consent, hủy đăng ký, và ai chịu trách nhiệm scheduler trước khi cập nhật yêu cầu/thiết kế. |

---

## 4. Khám phá Lộ trình học

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Khám phá Lộ trình học** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Cung cấp sơ đồ curriculum trực quan theo Framework/Level → Unit → Lesson; thể hiện nội dung đã hoàn thành, đang mở, đang khóa hoặc sắp có, và điều hướng learner tới nội dung phù hợp. |
| **Mô tả ngắn gọn** | Người học xem curriculum hiện hành, tiến độ theo required lesson đủ điều kiện và trạng thái mở khóa. Nội dung chưa publish/không khả dụng có thể hiển thị locked/coming soon; lesson đã publish trong active curriculum nhưng chưa mở do thứ tự tiến trình vẫn là required lesson đủ điều kiện. |
| **Tiền điều kiện** | Người học đã đăng nhập; dữ liệu lộ trình học tập đã được xuất bản trên hệ thống. |
| **Hậu điều kiện** | Người học được chuyển hướng thành công đến bài học hoặc bài thi đã chọn. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người học mở curriculum hiện hành của LearningContext.<br>**2.** Hệ thống hiển thị required lessons trong curriculum active cùng trạng thái completion, availability và progression lock. Node chưa publish/không khả dụng có thể hiển thị “Đang phát triển”; lesson đã publish trong curriculum active nhưng chưa mở do tiến trình có thể dùng lock icon với ý nghĩa riêng.<br>**3.** Progress dùng completed eligible required lessons / eligible required lessons. Mẫu số gồm lesson bắt buộc đã publish và còn active, kể cả lesson chỉ bị khóa do tiến trình bình thường; loại lesson chưa publish/không khả dụng và lesson withdrawn chưa hoàn thành.<br>**4.** Người học mở lesson đang available hoặc xem summary của lesson đã hoàn thành; summary cho thấy latest completed performance và có thể hiển thị best secondary.<br>**5.** Nếu không còn nội dung current có thể học, hệ thống giải thích rằng learner đã hoàn thành mọi nội dung hiện có và level kế tiếp đang được phát triển.<br>**6.** Assessment Level-up được vào khi curriculum gate đạt; level curriculum tiếp theo chỉ mở khi cả curriculum gate và assessment pass đạt, và nội dung level đó available; Reassessment không nằm trong learner journey MVP. |
| **Điều kiện đặc biệt** | • Completion và lịch sử của learner được giữ khi lesson withdrawn, replaced hoặc curriculum updated; không ép redo chỉ vì replacement.<br>• Learner chưa hoàn thành lesson sẽ theo active replacement; learner đã hoàn thành revision cũ không bị bắt học lại mặc định.<br>• “Đang phát triển” biểu thị nội dung chưa publish/không khả dụng và bị loại khỏi mẫu số. Progression lock chỉ biểu thị learner chưa mở được lesson đã publish trong curriculum active; trạng thái đó vẫn thuộc eligible denominator. Hai trạng thái có thể dùng chung icon khóa nhưng phải có semantics/UI label phân biệt; không trạng thái nào biểu thị learner failure. Future relearning/curriculum migration cần policy được duyệt riêng. |
| **Yêu cầu phi chức năng** | • Thời gian tải toàn bộ dữ liệu lộ trình ≤ 1.5 giây.<br>• Tự động cuộn màn hình đến vị trí bài học đang học gần nhất của người học khi mở trang. |

---

### Supporting context preferences — Study Focus (ADR-042)

`Chọn/thay đổi trọng tâm học tập` is supporting behavior within UC-04, not a new canonical UC. ACTIVE Learner chooses one of BALANCED (default), VOCABULARY, GRAMMAR, READING, LISTENING for their own context; invalid value/foreign context denies. Creation does not require a choice. Changes affect next supplementary practice only, preserve started composition and never reset start/progress/SRS or rewrite evidence. See [decision/design cases](study-focus-addendum.md).

## 5. Thi lên cấp

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Thi lên cấp** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Đánh giá điều kiện chuyển sang level học tiếp theo theo chính sách của khóa học; kết quả này quyết định progression, không tự động là chứng nhận proficiency. |
| **Tiền điều kiện** | LearningContext đang hoạt động và người học đã đạt curriculum completion gate do khóa học cấu hình; attempt pin một published immutable Assessment Version. |
| **Luồng chính** | **1.** Hệ thống kiểm tra riêng điều kiện hoàn thành curriculum và điều kiện bài đánh giá lên cấp.<br>**2.** Người học làm và nộp assessment theo cấu hình hiện hành.<br>**3.** Hệ thống ghi nhận kết quả hoàn tất.<br>**4.** Attempt chưa hoàn tất/invalid/recording failed không tạo completed result hay fake failure. Chỉ khi thỏa cả curriculum gate và assessment pass thì level tiếp theo được mở theo progression policy của khóa học. Nếu nội dung level kế tiếp chưa available, giữ passed evidence và progress, hiển thị locked/coming soon. Nếu trượt, tiến độ/evidence hiện có không bị xóa hoặc hạ cấp; hệ thống đề xuất ôn tập phù hợp. |
| **Điều kiện đặc biệt** | Không có ngưỡng phần trăm, số câu, thời lượng, số câu hỏi ngân hàng, lifetime retake cap, hoặc cooldown mặc định ở cấp nền tảng. Giá trị lịch sử 40 câu/35 phút/80% và Jump/95%/24 giờ chưa được chọn; Jump deferred trong MVP. Retake assessment, lesson redo và Placement là các hành vi riêng. MVP chỉ có Placement và Level-up purposes; Reassessment deferred theo ADR-036. Theo ADR-035, grading server-authoritative, không lộ per-item correctness trong assessment, sau submit chỉ trả aggregate result/pass/recommendation cần thiết, retry cùng submission idempotent, và attempt chưa submit hợp lệ không tạo completed Result. Persistence vật lý còn deferred. |

---

## 6. Học bài và Làm bài tập tương tác

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Học bài và Làm bài tập tương tác** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Xem nội dung bài học, luyện tập với feedback, và xử lý hợp lệ toàn bộ core exercises để hoàn tất lesson, đồng thời ghi nhận performance riêng với completion. |
| **Tiền điều kiện** | Người học đã đăng nhập; lesson thuộc nội dung được mở cho LearningContext đang ACTIVE. Quy tắc thứ tự/mở khóa core lesson tuân theo curriculum policy đã duyệt. |
| **Luồng chính** | **1.** Người học mở revision active của lesson và xem nội dung học.<br>**2.** Hệ thống lấy `N` core exercises theo lesson/config; optional review không tham gia completion hoặc denominator mặc định.<br>**3.** Với mỗi exercise: first correct đóng góp `1.0`; first incorrect nhận feedback, chuyển xuống cuối queue và được retry đúng một lần; retry correct đóng góp `0.5`, retry incorrect đóng góp `0`.<br>**4.** Khi toàn bộ core exercises và retry bắt buộc đã được xử lý hợp lệ, hệ thống kết thúc và ghi attempt. Nếu `K` câu sai lần đầu, performance là tổng đóng góp chia `N + K`; mọi actual response, gồm retry, nằm trong denominator.<br>**5.** Completion được ghi khi attempt hợp lệ và được lưu thành công, bất kể correctness/score. Attempt bị bỏ dở không tạo completion hay completed performance.<br>**6.** Redo tạo attempt mới, không tăng completed lesson count; latest completed performance là primary display và best có thể secondary. |
| **Điều kiện đặc biệt** | Không có accuracy threshold cho completion. `N` là số core exercises được cấu hình theo lesson; không có question count cố định ở cấp platform. Nội dung review tùy chọn không thuộc completion/denominator mặc định và không khóa progression. Exercise types gồm MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR. Core vocabulary được enroll SRS khi lesson hoàn thành; optional vocabulary chỉ enroll theo lựa chọn “Add to review”; UC-07 quy định card uniqueness/schedule. Phiên learning/practice thông thường có thể thêm review question do hệ thống chọn; block này nằm ngoài `N`, `K`, performance và điều kiện completion. Answer key không xuất hiện trong generic content read. Feedback/correctness ordinary practice tách khỏi secrecy áp cho Placement và Level-up. Attempt/performance persistence vật lý còn deferred. |
| **Yêu cầu phi chức năng** | Ghi nhận completion phải tin cậy và nhất quán; chi tiết transaction/schema thuộc quyết định triển khai đã được phê duyệt. |

---

### Completable Lesson readiness — ADR-044 (2026-10-22)

UC-06/UC-10–12 consume the explicit PO decision: a published Lesson available for Learner completion requires `N >= 1` core exercise. Draft/save may have zero; submit, approve and publish reject zero, and runtime start rechecks the pinned revision. Optional review, vocabulary and assessment contributions do not satisfy this core count. Keep `lesson_attempts.n_core > 0`; N=0 completion/performance and a special content-only lifecycle are outside MVP. This refines the count boundary without changing ADR-036 scoring, redo, SRS or Class draft cardinality `0..*`. See disposition.

### Supplementary practice — ADR-042

After valid core completion, learner may start a supplementary block: independent internal due/overdue SRS plus configured focus-biased eligible authored practice. Other-area fallback handles scarce focus material; an empty optional practice pool never fails core completion. Restrict to published AVAILABLE accessible same-context curriculum with active finite practice-skill/area metadata and PRACTICE origin; no secure assessment reuse. Temporary feedback stays outside core N/K, performance/completion/unlocks, secure assessment result and progression. No extra canonical UC or persisted composition/history is required.

## 7. Học từ vựng Flashcard và Ôn tập

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Học từ vựng Flashcard và Ôn tập** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Giúp người học ghi nhớ từ vựng dài hạn thông qua thẻ ghi nhớ hai mặt và cơ chế lặp lại ngắt quãng theo chu kỳ ngày cố định (SRS Policy B). |
| **Mô tả ngắn gọn** | Core vocabulary được enroll khi lesson hoàn tất; learner có thể chủ động thêm optional vocabulary. Trong phiên learning/practice thông thường, hệ thống có thể chọn due/overdue cards và đưa từng review question vào sau hoặc xen giữa core work; dedicated review session là tùy chọn và cũng chỉ chọn items sau khi learner bắt đầu. Learner chỉ thấy prompt/câu hỏi và tương tác trả lời, không xem trước danh sách từ, stage, hay từ sẽ xuất hiện. Client gửi card identity và recall outcome hợp lệ; server/RPC tính Policy B. |
| **Tiền điều kiện** | Người học đã đăng nhập và tham gia phiên learning/practice phù hợp hoặc chủ động bắt đầu dedicated review session tùy chọn; hệ thống xác định nội bộ có eligible due/overdue card. Learner không cần mở hay duyệt due-card list. |
| **Hậu điều kiện** | Trạng thái ghi nhớ và ngày ôn tập tiếp theo của từng từ vựng được cập nhật vào cơ sở dữ liệu. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Khi lesson hoàn tất hợp lệ, hệ thống tự enroll core Vocabulary; learner có thể chọn “Add to Review” cho optional Vocabulary. Một learner có một logical card cho mỗi Vocabulary identity; thẻ đã có giữ stage/lịch, thẻ mới bắt đầu stage 1 và đến hạn sau một ngày.<br>**2.** Trong phiên học/luyện tập thường, hệ thống có thể truy vấn và chọn nội bộ một số card due/overdue để đưa từng review question vào sau hoặc xen giữa phần core. Hoặc learner bắt đầu dedicated review session tùy chọn, sau đó hệ thống mới lựa chọn items. Không có bước learner xem/dò/chọn card từ danh sách due.<br>**3.** Hệ thống đưa một question/prompt ra; learner trả lời và chọn recall outcome hợp lệ (“Đã nhớ” / “Chưa nhớ”). Server/RPC xác thực operation và tự tính lịch; due/overdue card tiếp tục đủ điều kiện ở phiên sau nếu chưa được review hợp lệ.<br>&nbsp;&nbsp;3a. “Đã nhớ” tiến Policy B `1 → 3 → 7 → 14 → 30` ngày; sau stage cuối, card tiếp tục lặp mỗi 30 ngày.<br>&nbsp;&nbsp;3b. “Chưa nhớ” reset về stage 1, đến hạn sau một ngày và có thể được đưa xuống cuối cùng phiên để reinforcement tối đa một lần. Lượt reinforcement không tạo scheduling operation thứ hai hoặc đổi lịch dài hạn lần nữa.<br>**4.** Retry cùng operation idempotent; một deliberate new review là operation riêng. Hệ thống tiếp tục chọn câu hỏi phù hợp hoặc kết thúc phiên và có thể hiển thị summary; không lộ due-card list/stage/upcoming vocabulary. |
| **Điều kiện đặc biệt** | Due/overdue selection, due date, stage và interval là internal/server-authoritative; learner không duyệt due list, không chọn card từ queue, stage, interval hoặc ngày đến hạn. Card due/overdue vẫn được giữ/eligible cho tới khi có valid review; nếu context paused, global SRS vẫn hoạt động. SRS có thể xuất hiện trong ordinary learning/practice/checkpoint nhưng không được chèn vào scored immutable Placement/Level-up Assessment Version; review block riêng không nằm trong Assessment Version, score hoặc pass/fail. Mỗi learner có một card logic cho mỗi Vocabulary identity. Policy B lặp `1, 3, 7, 14, 30` ngày rồi mỗi 30 ngày; “Chưa nhớ” reset stage đầu/1 ngày, reinforcement tối đa một lần mà không schedule lần hai. Client chỉ gửi card identity và rating hợp lệ; server/RPC tính lịch. Retry cùng operation idempotent; recorded legitimate SRS review qualify streak theo ADR-033. Physical card/history design còn deferred. |
| **Yêu cầu phi chức năng** | • Hiệu ứng lật thẻ mượt mà, phản hồi ngay lập tức.<br>• Tệp âm thanh phát âm được tải trước để phát ngay khi bấm nghe. |

---

### Focus and SRS selection — ADR-042

Focus bias is separate from due selection: GRAMMAR still keeps due VOCABULARY eligible. No learner due list, card preview or stage/date enumeration. One prompt is returned only after ordinary supplementary/dedicated session start; overdue persists until valid review. Policy B, core enrollment/optional Add to Review, account-wide card uniqueness and at-most-once reinforcement without a second schedule remain unchanged. No dynamic SRS/focus practice enters scored Placement/Level-up versions.

## 8. Theo dõi Tiến độ và Chuỗi ngày học

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Theo dõi Tiến độ và Chuỗi ngày học** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Hiển thị tiến độ curriculum và account-global streak mà không đánh đồng tiến độ với proficiency, mastery, hoặc readiness. |
| **Luồng chính** | **1.** Người học mở tổng quan cá nhân.<br>**2.** Hệ thống hiển thị progress là tỷ lệ không trọng số giữa số required lesson đã hoàn thành và số required lesson đủ điều kiện trong level hiện tại.<br>**3.** Hệ thống hiển thị streak theo timezone của account; streak tăng tối đa một lần mỗi ngày lịch địa phương. |
| **Điều kiện đặc biệt** | Qualifying activity là lesson hoàn tất, lesson redo hợp lệ đã hoàn tất, hoặc SRS review đã được ghi nhận. Isolated exercise retry, Placement, Level-up assessment, login, và mở ứng dụng không qualify. Streak không yêu cầu hoàn thành daily goal; daily goal và streak là hai khái niệm riêng. Mốc curriculum/progress không tạo verified proficiency. Physical Profile.dailyGoalMin, progress/performance representation, attempt history và live-state reconciliation thuộc P0-D07. Reassessment không thuộc MVP theo ADR-036. |

---

## Current assessment assembly clarification — ADR-043 (2026-10-20)

UC-09–12 retain their identities. Admin configures the blueprint and assigns Lesson/content packages, including related assessment questions. Teacher submits those assigned packages. The system assembles submitted eligible contributions from one or more Teachers into a complete assessment version according to the blueprint, then queues it for Admin review/approval/publication. Teacher does not submit a whole assembled exam; Admin does not manually compose or author its items. Feedback on version items routes to the current Teacher for their source Lesson. Corrections use successor contributions and a newly assembled version, retaining authorship, assignment episodes and prior review history. This paragraph controls assembly ownership where older wording below is less specific; exact physical mechanisms remain proposed in the database reconciliation. Logical diagrams predating ADR-043 have not been reapproved by this addendum.

## 9. Lập đề cương, ma trận đề thi và Phân công

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Lập yêu cầu nội dung và Phân công** |
| **Tác nhân chính** | Admin |
| **Mục tiêu** | Quản lý curriculum/content requirements, assessment blueprints và assignment cho Teacher. Admin xác định coverage/checklist; Teacher viết câu hỏi thực tế. |
| **Tiền điều kiện** | Admin đăng nhập; curriculum/configuration nằm trong quyền quản trị đã cấp. |
| **Luồng chính** | **1.** Admin xem curriculum/topic và yêu cầu nội dung.<br>**2.** Với assessment, Admin xác định purpose, language/framework, level hoặc transition, curriculum/topic coverage, skill/knowledge coverage, item requirements/distribution và cấu hình cần thiết.<br>**3.** Admin giao Lesson/content package và assessment items liên quan cho một Teacher.<br>**4.** Hệ thống giữ authorship attribution và lịch sử nếu Admin reassignment.<br>**5.** Teacher thấy work item được giao; Admin quản lý requirement/blueprint, không viết câu hỏi. |
| **Điều kiện đặc biệt** | Assignment là ranh giới authoring: một MVP assignment bao phủ một Lesson/content package cùng exercise/assessment items liên quan, với một responsible Teacher tại một thời điểm. Assessment blueprint lấy topic/coverage từ curriculum; ví dụ topic, skill và phân bố item không phải platform constants. Reassignment giữ attribution/history; dùng optimistic version/concurrency tối thiểu. Không tạo generic workflow hay QuestionBank. Physical state/table/key/history vẫn deferred. |

---

## 10. Soạn bài học và Câu hỏi đề thi theo phân công

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Soạn nội dung được phân công** |
| **Tác nhân chính** | Teacher |
| **Mục tiêu** | Soạn, xem trước và chỉnh sửa lesson/exercise/assessment items chỉ trong assignment được giao và theo requirement/blueprint đã duyệt. |
| **Tiền điều kiện** | Teacher đã đăng nhập và đang được giao assignment còn hiệu lực. |
| **Luồng chính** | **1.** Teacher mở assignment mình đang phụ trách.<br>**2.** Teacher tạo/chỉnh Lesson package, exercise và assessment items ở Draft/Changes Requested theo requirement/blueprint.<br>**3.** Teacher preview learner-facing content, grading behavior và media; lưu draft.<br>**4.** Trước submit, hệ thống kiểm tra coverage, item/config đủ, grading data hợp lệ, media bắt buộc tồn tại và item không incomplete.<br>**5.** Teacher submit package cho Admin review qua UC-11. |
| **Điều kiện đặc biệt** | Teacher không author ngoài assignment, tự giao việc, review/approve/publish, quản trị tài khoản, hoặc sửa work item đã chuyển cho người khác. Teacher chỉ edit Draft/Changes Requested; Admin định nghĩa blueprint nhưng không author item. Assessment không dùng nguyên xi item đã lộ answer/correctness/answer-revealing explanation trong ordinary practice; cùng concept có thể được kiểm tra bằng item/variant khác. Không có generic workflow/QuestionBank. Physical assignment/authorship/readiness representation remains deferred. |

---

## 11. Nộp bài và Nộp lại sau chỉnh sửa

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Nộp và nộp lại nội dung được phân công** |
| **Tác nhân chính** | Teacher |
| **Mục tiêu** | Gửi nội dung assignment để Admin review và tiếp tục sửa/nộp lại sau feedback. |
| **Tiền điều kiện** | Teacher là người được giao assignment và nội dung đáp ứng các yêu cầu đã được duyệt cho assignment đó. |
| **Luồng chính** | **1.** Teacher kiểm tra nội dung và preview draft.<br>**2.** Teacher submit assignment kèm ghi chú nếu cần.<br>**3.** Admin review theo UC-12.<br>**4.** Nếu nhận yêu cầu chỉnh sửa, Teacher xem feedback và review history, cập nhật draft, rồi resubmit.<br>**5.** Teacher xem trạng thái kết quả review và lịch sử submission/feedback của assignment mình được giao. |
| **Điều kiện đặc biệt** | Quyền submit/resubmit chỉ theo assignment hiện hành; Teacher không thể chuyển nội dung trực tiếp sang approved/published. Checklist validation lấy từ requirement/configuration đã được duyệt, không từ các ngưỡng hardcoded trong bản cũ. Reassignment không xóa authorship attribution hay lịch sử trước đó. Logical lifecycle/editability follows ADR-035; exact physical status/version persistence and audit emission remain deferred. |

---

## 12. Thẩm định và Xuất bản nội dung

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Review, phê duyệt và xuất bản nội dung** |
| **Tác nhân chính** | Admin |
| **Mục tiêu** | Kiểm tra nội dung Teacher đã submit, yêu cầu chỉnh sửa hoặc phê duyệt; chỉ xuất bản nội dung đã được phê duyệt. |
| **Tiền điều kiện** | Admin đăng nhập và có nội dung đã được Teacher submit hoặc nội dung đã publish cần xử lý theo policy được duyệt. |
| **Luồng chính** | **1.** Admin mở review queue và xem nội dung/feedback history.<br>**2.** Admin preview và đánh giá nội dung theo yêu cầu/configuration đã duyệt.<br>**3.** Admin yêu cầu Teacher chỉnh sửa kèm feedback, hoặc phê duyệt nội dung.<br>**4.** Chỉ nội dung đã được phê duyệt mới đủ điều kiện để Admin publish.<br>**5.** Admin có thể archive nội dung theo policy lưu trữ đã được duyệt.<br>**6.** Khi cần sửa nội dung đã publish, Admin tạo/reassign công việc cho Teacher; Teacher sửa và gửi lại qua UC-11. Lịch sử tác giả và review được giữ lại. |
| **Quyền và ranh giới** | Admin không tự author lesson/exercise/assessment content; không tự phê duyệt nội dung do chính mình tạo; không có self-approval exception hoặc direct-publish path trong MVP. Teacher không review, approve, publish, hoặc archive. |
| **Đã quyết định về logic (ADR-035/036)** | Content states are Draft → In Review → Changes Requested or Approved → Published → Archived/Withdrawn; Teacher edits only Draft/Changes Requested; Approved/Published is immutable in place; published changes use a new revision and repeat review/approval; active Lesson/revision replacement is atomic on successful publish and failure preserves the current version. Do not hard-delete content with learner references/progress. Publication unit is Lesson/revision; Unit/Course visibility derives from curriculum blueprint/eligibility and does not require atomic Unit publication. Assessment items are checked for readiness; Admin reviews/approves and publishes an immutable Assessment Version, and each learner attempt remains bound to that version. |
| **Còn deferred (physical design)** | Physical state fields/tables, revision linkage, atomic publication transaction/active pointer, curriculum-eligibility representation, assessment blueprint/version/item storage and readiness enforcement, archive/withdrawal representation, API/payload answer filtering, assessment-result persistence, audit schema/emission/storage/retention, and live database realization. Historical state names do not prescribe schema. |

---

## 13. Quản lý Người dùng và Tài khoản Giáo viên

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Quản lý tài khoản Learner và Teacher** |
| **Tác nhân chính** | Admin |
| **Mục tiêu** | Provision Teacher và hỗ trợ account operations tối thiểu cho Learner trong quyền Admin. |
| **Luồng chính** | **1.** Admin tìm Learner hoặc provision/tra cứu Teacher theo quy trình được phép.<br>**2.** Với Learner, Admin xem identity/status/role tối thiểu và LearningContext summary tối thiểu khi cần support.<br>**3.** Admin disable/re-enable account; nhập reason khi phù hợp; hệ thống audit hành động và chặn account disabled từ request kế tiếp dù token/session còn hạn.<br>**4.** Learner dùng account password recovery flow; Admin không biết current password. |
| **Điều kiện đặc biệt** | Admin không sửa lesson completion, performance, assessment result, SRS review history, activity, level, progress hay learning evidence khác. Staff không học bằng staff account; người cần học dùng Learner account riêng. `auth.uid()` là trusted subject; role/status lấy từ server-controlled source và authorization thực hiện tại trusted boundary/RLS phù hợp theo ADR-035. Physical role mapping/RLS, learner support data access và audit representation vẫn deferred. |

---

## 14. Xem Báo cáo và Thống kê toàn hệ thống

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Xem Báo cáo và Thống kê toàn hệ thống** |
| **Tác nhân chính** | Admin |
| **Mục tiêu** | Xem báo cáo vận hành trong phạm vi dữ liệu được Admin phép truy cập. |
| **Luồng chính** | **1.** Admin mở trang báo cáo.<br>**2.** Hệ thống hiển thị các chỉ số được sản phẩm chọn và có nguồn dữ liệu tin cậy, ví dụ tổng hợp hoạt động Learner, tiến độ curriculum, và trạng thái nghiệp vụ nội dung.<br>**3.** Admin lọc/xem báo cáo theo khoảng thời gian hoặc chiều lọc đã được duyệt. |
| **Điều kiện đặc biệt** | Báo cáo không bao hàm bảng riêng “direct publish by Admin” vì không có direct-publish path. ADR-035 yêu cầu audit tối thiểu cho account provision/disable/enable/role change; assignment/reassignment; submit/request changes/approve/publish/archive/withdraw/replacement; assessment config changes; và denied sensitive privileged actions. Event logic gồm actor, action, target/version, server timestamp, outcome, reason khi policy yêu cầu; security audit append-only, tách khỏi workflow/content history, Admin được đọc trong MVP. Password/token/answer secret không được log. Physical event storage/emission và retention/anonymization duration vẫn deferred; UC này không áp một audit schema/UI cụ thể. Không xem progress là proficiency/mastery/readiness. |

---

## 15. Hạn chế đã biết (Known Limitations)

Đây là mục ghi chú, không phải UC-15. Các con số và quy trình dưới đây là legacy assumptions, không phải current behavior hoặc cấu hình đã được chọn.

1. **Assessment configuration:** Câu hỏi, thời lượng, blueprint, ngưỡng, retake, và curriculum gate cần được chọn theo khóa học. Các ví dụ 30 câu/25 phút/Mapping A hoặc 40 câu/35 phút/80%/80 câu không phải mặc định nền tảng; Jump và cooldown 24 giờ được deferred theo ADR-033.
2. **Curriculum availability:** Nội dung và thứ tự hiển thị phụ thuộc curriculum được cấu hình và policy publication được duyệt; không giả định toàn bộ A1/A2 phải được publish trước hoặc luôn có đúng 4 lesson mỗi Unit.
3. **Placement:** ADR-032 cho phép Placement, self-report, hoặc default starting point. Không khóa vĩnh viễn Placement, không bắt buộc Placement, và không suy ra default A1/Unit 1 hay proficiency đã xác minh.
4. **Open physical/deployment decisions:** Physical publication/approval state and revision representation, assessment result/attempt persistence and API filtering, assignment/authorship persistence, SRS RPC/idempotency implementation, audit storage/emission/retention, identity/role/RLS mapping, context FK and live DB state remain deferred under P0-D07. Their logical behavior is controlled by ADR-035; perform Full CURRENT + TARGET Modeling Review and read-only DB reconciliation before implementation.


# Rà soát và sửa chín sơ đồ Use Case chức năng

Ngày 2026-10-12. Phạm vi: trình bày/UML trong chín VIEW-RUC; không thay đổi catalog hay nghiệp vụ. Đặc tả hiện hành: [UC catalog](../../use-case-specifications.md), [Study Focus](../../study-focus-addendum.md). File Word mẫu chỉ được đọc để tham khảo hình thức; không lấy nghiệp vụ TOEIC, DB/hash hay các quan hệ đáng nghi của mẫu vào Lingora.

## Báo cáo trước khi sửa

| File | Vấn đề hiện tại | Loại correction |
|---|---|---|
| [VIEW-RUC-01-auth-profile.puml](VIEW-RUC-01-auth-profile.puml) | 15 association giao nhau; package thừa; note staff đè kích hoạt | Layout và generalization actor cho chức năng chung |
| [VIEW-RUC-02-learning-context.puml](VIEW-RUC-02-learning-context.puml) | 10 ellipse quá dài; bước chọn ngôn ngữ/cách khởi đầu tách vụn | Layout và gộp bước UI/nhánh onboarding |
| [VIEW-RUC-03-lesson-practice.puml](VIEW-RUC-03-lesson-practice.puml) | Actor nối nhiều đường vòng; core/feedback/retry/completion tách vụn; note công thức | Layout và correction UML |
| [VIEW-RUC-04-srs-review.puml](VIEW-RUC-04-srs-review.puml) | Selection/scheduling nội bộ thành UC; dependencies khiến goal khó đọc | Layout và correction UML |
| [VIEW-RUC-05-assessment.puml](VIEW-RUC-05-assessment.puml) | Bắt đầu/nộp tách thành UC; version là chi tiết kỹ thuật; note lớn | Layout và gộp bước làm/nộp vào actor goal |
| [VIEW-RUC-06-progress-history.puml](VIEW-RUC-06-progress-history.puml) | Package và note progress không cần thiết | Layout cleanup; giữ năm goal |
| [VIEW-RUC-07-teacher-authoring.puml](VIEW-RUC-07-teacher-authoring.puml) | Preview/member/nhận feedback là bước/event trong authoring | Layout và gộp bước vào goal hiện có |
| [VIEW-RUC-08A-admin-content-governance.puml](VIEW-RUC-08A-admin-content-governance.puml) | Nhiều đường dài và box/note; hành động Admin chưa đọc nhanh được | Layout cleanup; giữ tám goal |
| [VIEW-RUC-08B-admin-account-support.puml](VIEW-RUC-08B-admin-account-support.puml) | Package một goal; note hỗ trợ dài | Layout cleanup; giữ bốn goal |

### Quan hệ include/extend đáng nghi

| Quan hệ cũ | Lý do cần correction | Xử lý dự kiến |
|---|---|---|
| Core → Feedback (`include`) | Feedback là phản hồi trong UC-06, không phải actor goal độc lập | Gộp vào UC-06, bỏ cạnh |
| Retry → Core (`extend`) | Retry sai lần đầu là behavior bắt buộc theo điều kiện đã chốt, không phải UC do actor khởi tạo riêng | Gộp vào UC-06, bỏ cạnh; quy tắc một retry giữ nguyên |
| Complete → Core (`include`) | Hoàn thành là kết quả của xử lý core và ghi nhận hợp lệ, không phải chức năng gọi làm core lại | Gộp cả nhóm vào UC-06, bỏ cạnh |
| AnswerQuestion → SelectDue (`include`) | Card đã được chọn nội bộ để đưa prompt; không phải goal người học chọn due list | Gộp vào luồng SRS, bỏ cạnh |
| AnswerQuestion → Schedule (`include`) | Tính/ghi lịch là xử lý hệ thống, không cần một ellipse riêng trong view goal-level | Gộp vào luồng SRS, bỏ cạnh |
| StartReview → SelectDue (`include`) | Start là entry step, selection là nội bộ; sơ đồ không cần tách hai bước | Gộp vào mục tiêu ôn SRS, bỏ cạnh |

Những file khác không có include/extend. Không thêm dependency giữa Placement/self-report/default, các kết quả xem độc lập, draft/submit/resubmit, review/approve/publish hoặc provision/support/report. Trạng thái đã approved là tiền điều kiện publish; không có nghĩa publish thực hiện approve mỗi lần.

### Bảy note box bị loại và nơi giữ quy tắc

| View | Note bị loại khỏi hình | Đặc tả giữ nội dung |
|---|---|---|
| 01 | Staff được cấp có kiểm soát, không public signup | UC-01, điều kiện đặc biệt |
| 03 | N/K, 1/0.5/0, N+K, một retry, completion độc lập điểm, supplementary ngoài core | UC-06 và Supplementary practice / ADR-042 |
| 05 | Placement/Level-up version riêng; Reassessment inactive; không SRS vào scored version | UC-02/05/07; Study Focus phần secure assessments |
| 06 | Progress derived; không tự tạo persistence; khác proficiency/mastery/readiness | UC-04/08 và source authority; không đổi representation |
| 07 | Teacher chỉ author assignment; không giao/approve/publish | UC-09/10/11 |
| 08A | Admin requirement/assignment/review/publish; không author lesson/exercise/item | UC-09/12 |
| 08B | Support không sửa completion/performance/results/SRS/evidence | UC-13 |

RUC-02 và RUC-04 không có note box. Comment metadata không render trong PUML được giữ để traceability; không có comment box trong output.

### Correction tên được báo trước

| Tên/nhóm cũ | Tên hiển thị sau gộp | Lý do |
|---|---|---|
| OpenLesson/Core/Feedback/Retry/Complete | Học bài và Làm bài tập tương tác | Dùng nguyên tên UC-06 của đặc tả cho actor goal toàn lesson; không đặt tên mới |
| Trả lời câu hỏi ôn tập do hệ thống đưa ra; Bắt đầu phiên ôn riêng (tùy chọn) | Ôn tập từ vựng theo SRS | Dùng tên phạm vi đang có ở view; cả ordinary interaction và optional dedicated entry được giữ trong UC-07 |
| Bắt đầu Placement cho ngữ cảnh học | Làm Placement | Tên đã có ở RUC-02; bao gồm làm và nộp, không chỉ bấm bắt đầu |
| Bắt đầu Level-up khi đạt điều kiện | Thi lên cấp | Dùng tên UC-05 trong catalog; curriculum gate vẫn là tiền điều kiện |

RUC-01 thêm actor tổng quát “Người dùng” để chia sẻ bốn association Login/Recovery/Profile/Logout qua generalization. Đây là abstraction của ba actor hiện có, không phải business role/account mới. Signup chỉ Learner; Activate chỉ Teacher. Các tên goal còn giữ đều nguyên văn, chỉ xuống dòng để đọc dễ hơn.

### Nguyên nhân lỗi hình thức

Nguồn đang tách cả UI steps, internal selection/scheduling, phản hồi và postcondition thành ellipse; phần chuyển sang native Draw.io còn để các package-boundary lồng nhau và giữ các note/title chưa map đúng vào geometry mới. Vì vậy note có thể đè oval, association vòng qua trang, title và oval không dùng cùng grid. Correction sẽ thay trực tiếp chín page XML với geometry rõ ràng, không dùng full-bundle rebuild.

Tham khảo ký hiệu: [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1), [PlantUML Use Case](https://plantuml.com/use-case-diagram). Các quy tắc include/extend trong yêu cầu của người dùng kiểm soát phạm vi correction này.

## Kết quả sau khi sửa

Đã sửa đủ chín nguồn, chín PNG, chín SVG và chín trang native ở vị trí 09–17 của [bộ Draw.io](../current-target/lingora-all-diagrams.drawio). Rà trực tiếp cả chín PNG export bằng Draw.io Desktop 32.4.1 và cả chín PNG từ PlantUML. Hình cuối dùng actor ngoài boundary, oval có khoảng cách đều, không note/inner package, không đường vòng hoặc cạnh cắt qua oval khác. Các association native là đoạn thẳng; generalization dùng tam giác rỗng hướng tới actor tổng quát.

### A. Chín sơ đồ đã sửa

| View | Số ellipse trước → sau | Bản native đã export |
|---|---:|---|
| VIEW-RUC-01 — Tài khoản/hồ sơ | 6 → 6 | [PNG native](evidence/2026-10-12-cleanup/native/VIEW-RUC-01.png) |
| VIEW-RUC-02 — Ngữ cảnh học | 10 → 6 | [PNG native](evidence/2026-10-12-cleanup/native/VIEW-RUC-02.png) |
| VIEW-RUC-03 — Học bài/luyện tập | 9 → 4 | [PNG native](evidence/2026-10-12-cleanup/native/VIEW-RUC-03.png) |
| VIEW-RUC-04 — SRS | 5 → 2 | [PNG native](evidence/2026-10-12-cleanup/native/VIEW-RUC-04.png) |
| VIEW-RUC-05 — Assessment | 6 → 4 | [PNG native](evidence/2026-10-12-cleanup/native/VIEW-RUC-05.png) |
| VIEW-RUC-06 — Tiến độ/lịch sử | 5 → 5 | [PNG native](evidence/2026-10-12-cleanup/native/VIEW-RUC-06.png) |
| VIEW-RUC-07 — Teacher authoring | 8 → 5 | [PNG native](evidence/2026-10-12-cleanup/native/VIEW-RUC-07.png) |
| VIEW-RUC-08A — Admin governance | 8 → 8 | [PNG native](evidence/2026-10-12-cleanup/native/VIEW-RUC-08A.png) |
| VIEW-RUC-08B — Admin account/support | 4 → 4 | [PNG native](evidence/2026-10-12-cleanup/native/VIEW-RUC-08B.png) |

Tổng số ellipse trong chín view giảm 61 → 44. Đây là số biểu diễn goal/subflow của report, không phải số canonical UC. Catalog giữ nguyên 14 mục, trong đó UC-03 reminder deferred; không có UC mới hoặc Reassessment active.

### B. Quan hệ UML đã correction

Đã bỏ đúng sáu cạnh liệt kê trong bảng trước sửa: năm `include` và một `extend`, do các node đầu/cuối tương ứng được gộp thành bước/behavior trong actor goal. Không đổi một cạnh sai thành cạnh giả khác; không thêm include/extend mới. RUC-03 không còn biểu diễn completion gọi lại core, feedback là chức năng riêng hay retry là actor goal. RUC-04 không còn biến due selection và scheduling thành chức năng người học.

RUC-01 giữ sáu chức năng nhưng thay các association chung lặp cho ba actor bằng bốn association của “Người dùng” và ba generalization từ Học viên/Giáo viên/Quản trị viên. Hai association riêng là Học viên → đăng ký và Giáo viên → kích hoạt. Tổng chín cạnh dễ đọc thay cho 15 association cũ; không thêm role hay quyền mới.

### C. Note/comment box đã xóa

Đã xóa đủ bảy note trong bảng trước sửa; output có **0 note box**. Metadata/authority comments chỉ nằm trong source và không render. Quy tắc staff provisioning, N/K/performance/retry/completion, SRS assessment isolation, progress, phân quyền authoring/governance và support vẫn nằm trong các mục đặc tả đã dẫn. Nội dung file đặc tả và ADR được kiểm tra hash, giữ nguyên.

### D. Các goal giữ nguyên tên

- **01:** Đăng ký tài khoản (Học viên); Đăng nhập / Xác thực; Khôi phục mật khẩu; Quản lý hồ sơ cá nhân; Đăng xuất / kết thúc phiên; Kích hoạt tài khoản đã được cấp.
- **02:** Tạo ngữ cảnh học; Tiếp tục ngữ cảnh đang tạm dừng; Tạm dừng ngữ cảnh; Chọn/thay đổi trọng tâm học tập; Làm Placement; Mở lộ trình hiện hành.
- **03:** Học lại bài đã hoàn thành; Xem performance lượt hoàn tất gần nhất; Luyện tập bổ sung theo trọng tâm. Goal chính dùng tên UC-06 đã báo trước.
- **04:** Thêm từ tùy chọn vào Review. Goal ôn tập được gộp/đặt tên ở mức mục tiêu phiên như đã báo trước.
- **05:** Xem điểm bắt đầu được đề xuất; Xem kết quả tổng hợp và tiến trình. Hai goal làm assessment dùng các tên hiện có đã báo trước.
- **06:** Xem lộ trình và lesson đủ điều kiện; Xem tỷ lệ lesson đã hoàn thành; Xem lịch sử hoàn thành; Xem performance các lượt hoàn tất; Xem chuỗi ngày học.
- **07:** Xem assignment và yêu cầu nội dung; Tạo / sửa draft được phân công; Submit draft; Sửa và resubmit; Xem phản hồi / lịch sử.
- **08A:** Tạo requirement và phạm vi nội dung; Lập assessment blueprint; Phân công / phân công lại Giáo viên; Review nội dung đã nộp; Yêu cầu chỉnh sửa; Approve nội dung; Publish nội dung đã duyệt; Withdraw / archive nội dung.
- **08B:** Provision tài khoản Giáo viên; Disable / re-enable tài khoản; Hỗ trợ tài khoản Học viên trong phạm vi cho phép; Xem báo cáo và audit.

Tổng 40 label goal được giữ nguyên, bốn label goal được correction theo bảng tên trước sửa. Xuống dòng không đổi tên hoặc nghĩa.

### E. Các bước/behavior được gộp, không xóa nghiệp vụ

| View | Biểu diễn nhỏ bị gộp | Nơi thể hiện actor goal/luồng giữ nguyên |
|---|---|---|
| 02 | Chọn ngôn ngữ học | Luồng thiết lập/tạo ngữ cảnh hiện có |
| 02 | Chọn cách xác định điểm bắt đầu; tự khai báo; dùng mặc định | Các nhánh điểm bắt đầu trong luồng thiết lập ngữ cảnh/UC-02 hiện có; không đặt giới hạn thời điểm mới. Làm Placement vẫn là goal riêng, không bắt buộc |
| 03 | Mở và xem nội dung; làm core; nhận feedback; một retry; completion | Actor goal UC-06 “Học bài và Làm bài tập tương tác”; retry/completion/performance theo đặc tả không đổi |
| 03 | Trả lời câu ôn đến hạn do hệ thống chọn | Tương tác ordinary practice/supplementary/SRS hiện có; goal ôn SRS ở view 04. Không thêm due-list hoặc cho người học chọn card |
| 04 | Bắt đầu phiên riêng; trả lời prompt; chọn due nội bộ; cập nhật/tính lịch | Actor goal ôn SRS trong UC-07; entry phiên riêng vẫn tùy chọn; lựa chọn due/schedule vẫn do hệ thống |
| 05 | Nộp Placement hoàn tất | Bước làm/nộp của goal “Làm Placement” |
| 05 | Nộp bài theo Assessment Version đã gắn | Bước làm/nộp của goal “Thi lên cấp”; pinned immutable version không đổi |
| 07 | Thêm/xóa draft member; Preview nội dung | Các bước authoring/preview trong “Tạo / sửa draft được phân công” |
| 07 | Nhận yêu cầu chỉnh sửa | Feedback/event được đọc qua “Xem phản hồi / lịch sử”, xử lý qua “Sửa và resubmit” |

### F–G. Bảo toàn nghiệp vụ và phạm vi

Không đổi nghiệp vụ đã chốt, không thêm canonical UC hay capability ngoài chín view. Staff signup, assignment boundary, Teacher authoring/Admin review-publication, retry một lần, completion độc lập performance, Policy B, due selection nội bộ, Study Focus supplementary, Placement/Level-up secrecy/versions/gates và giới hạn support đều giữ nguyên. Không sửa đặc tả domain, ADR, Prisma, migration, application/API code, repository scripts, tests hoặc runtime; không xóa tài liệu lịch sử, không stage/commit.

Kiểm tra cuối: **44 trang, đúng chín trang sửa; 35 raw page fragments còn lại giữ nguyên từng byte so với ZIP trước sửa; 1.035 file ngoài phạm vi cùng HEAD/index và Word mẫu giữ nguyên hash**. Chín standalone source payload khớp PUML đã expand shared style; 44 association, ba generalization, không include/extend hoặc note trên chín view. Cả 18 render hashes và chín actual-native PNG được kiểm tra. [Evidence máy đọc](evidence/2026-10-12-cleanup/verification.json), [backup đầy đủ](evidence/2026-10-12-cleanup/before-package.zip).

Việc giữ 35 trang trong lần sửa này tính từ trạng thái vào task. Conflict của lần insertion trước được lưu riêng ở REVIEW capture; correction này không tự phục hồi hay phê duyệt tám trang canonical từng được dựng lại ở task đó.

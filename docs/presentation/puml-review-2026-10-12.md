# Review toàn bộ PUML và kịch bản UC/AD — 12/10/2026

Kết quả: **49 file PUML hiện có không có lỗi cú pháp**; nguồn và render primary khớp manifest. Kịch bản cũ cần điều chỉnh phạm vi và bổ sung phần AD trước khi dùng cho buổi trình bày 10 phút. Có các vấn đề về cách trình bày, tính rõ ràng của mô hình và verifier lịch sử; không kết luận toàn bộ repository “PASS”.

Đây là review tài liệu. Các sơ đồ TARGET mô tả thiết kế dự kiến; chức năng học tập chưa được triển khai trong checkout theo CURRENT snapshot. Physical ERD vẫn PROPOSED / NOT IMPLEMENTED. Review này không phê duyệt physical design, kiểm thử runtime hay sửa hành vi sản phẩm.

## Phạm vi và bằng chứng

| Nhóm | Số file | Kết quả review |
|---|---:|---|
| Canonical `current-target/src` | 36 | Đọc UC, Activity, Sequence, State, System, Security, Domain, Data, Deployment; phân loại 30 TARGET, 5 CURRENT, 1 DEFERRED |
| Style dùng chung | 1 | Kiểm tra include/font/màu; không tính thành UC hoặc AD |
| Report functional views | 9 | Đọc đủ VIEW-RUC-01–07, 08A/08B; giữ nguyên mapping catalog |
| Physical ERD primary | 1 | Đọc bốn panel; kiểm tra cấu trúc minh họa và tình trạng PROPOSED |
| Physical evidence snapshots | 2 | Hai bản giống byte nhau, khác primary bằng cùng unified diff 70 dòng; giữ nguyên lịch sử |
| **Tổng** | **49** | **58 khối `@startuml`, gồm wrapper style và ba nguồn physical bốn panel** |

Danh sách từng file, số dòng và phân loại: [inventory](puml-review-evidence-2026-10-12/inventory.md). Hash nguồn, HEAD và index: [baseline](puml-review-evidence-2026-10-12/inventory.json). File legacy đang bị xóa khỏi checkout không được tính là đã review.

Đã xem tổng thể 49 hình PNG primary bằng contact sheet; xem riêng ở kích thước gốc VIEW-RUC-01–05, ACT-03/04/06 và physical content panel. Đây là kiểm tra bố cục tổng thể cộng kiểm tra chi tiết các hình được chọn, không phải chứng nhận mọi chữ trong toàn bộ hình đều đọc được khi chiếu lên màn hình.

## Các nhận xét cần xử lý

### R01 — Kịch bản hiện tại chưa có phần trình bày AD đầy đủ

**Ưu tiên cao cho buổi thuyết trình.** [Kịch bản cũ](usecase-activity-presentation.md) dành 0:35–9:30 để đi qua toàn bộ nhóm functional UC. Dòng “Nếu cần mở sơ đồ diễn tiến” ở phần SRS chỉ dẫn link ACT-06/SEQ-08, không có thời lượng hay lời thoại đi qua nhánh của AD. Vì yêu cầu mới bao gồm “một số AD nổi bật”, không thể chỉ bỏ các đoạn UC không cần rồi dùng nguyên bản còn lại.

Đề xuất dùng ba AD: [ACT-03 Học bài](../modeling/current-target/src/ACT-03-lesson-learning.puml), [ACT-06 SRS](../modeling/current-target/src/ACT-06-srs-review.puml), [ACT-04 Lên cấp](../modeling/current-target/src/ACT-04-level-up-assessment.puml). Mỗi AD cần giải thích luồng chính, một nhánh thay thế và kết quả được giữ/ghi nhận. ACT-01 onboarding và ACT-02 Placement để dự phòng; ACT-08 governance là phương án thay thế nếu muốn nhấn mạnh staff workflow, không cộng thêm vào timeline 10 phút.

### R02 — Dễ nhầm UC catalog với mã hình VIEW-RUC

**Ưu tiên cao.** Canonical UC-06 là Học bài, UC-07 là SRS, UC-08 là Tiến độ; nhưng VIEW-RUC-06 là Tiến độ/lịch sử, VIEW-RUC-07 là Teacher, VIEW-RUC-08A/08B là Admin. VIEW-RUC-03 không phải UC-03 reminder. Cần ghi tên chức năng bên cạnh mã trong timeline và lời mở đầu; bỏ một nhóm hình không có nghĩa xóa UC canonical.

Người dùng đã xác nhận thời lượng **10 phút** và làm rõ “06 - Use Case - Học viên (UC-02), 07 - Use Case - Giáo viên (UC-03), 08 - Use Case - Quản trị viên (UC-04)”. Đây là ba sơ đồ actor-oriented cần bỏ: `UC-02-target-learner.puml`, `UC-03-target-teacher.puml`, `UC-04-target-admin.puml`. **Giữ toàn bộ chín functional views**, gồm tài khoản, tiến độ, Teacher và hai Admin subviews; giữ UC tổng quan. Không loại các business UC có số trùng với filename. [Crosswalk](../modeling/report-usecases/README.md) và [catalog hiện hành](../use-case-specifications.md) là nguồn đối chiếu.

### R03 — ACT-03 quá dài để chiếu toàn hình trên một màn 16:9

**Ưu tiên cao về khả năng đọc.** ACT-03 là **1570 × 2561 px**; ACT-04 **1110 × 1650 px**; ACT-06 **1545 × 1626 px**. Khi thu ACT-03 vừa chiều cao 1080 px, toàn hình chỉ rộng khoảng 662 px; chữ nhỏ hơn đáng kể so với render gốc. Nguồn không lỗi, nhưng khán giả khó theo dõi queue/retry và phần supplementary nếu chỉ chiếu toàn hình.

Trình bày ACT-03 theo ba vùng: mở bài/queue, lần đầu/retry/chấm, lưu completion/phần bổ sung. Với ACT-06 dùng hai vùng enrollment và review/reinforcement. ACT-04 dùng gate và kết quả. Phóng SVG/PNG trong trình xem hoặc dùng viewport ở công cụ trình chiếu; giữ nguyên topology và nhãn. Chưa tạo hoặc sửa deck trong task này.

### R04 — Cần làm rõ curriculum gate ở bước áp dụng Level-up

**Ưu tiên trung bình; nhận xét về mức độ rõ ràng, không khẳng định sai runtime.** [ACT-04](../modeling/current-target/src/ACT-04-level-up-assessment.puml) kiểm tra curriculum gate tại dòng 13 trước khi bắt đầu, nhưng nhánh sau lưu ở dòng 45 chỉ ghi “Đạt điều kiện bài kiểm tra?” rồi mở cấp. [SEQ-07](../modeling/current-target/src/SEQ-07-assessment-submission.puml) ghi rõ “Xét đạt theo cấu hình và điều kiện chương trình” ở bước finalize. Catalog UC-05 cũng yêu cầu cả curriculum gate và assessment pass.

Đề xuất correction riêng làm rõ việc xét cả hai điều kiện tại thời điểm áp dụng progression, theo authority hiện hành. Trong lời thoại phải nói “đủ điều kiện chương trình, đạt bài thi và có nội dung cấp sau khả dụng”; không suy luận chỉ pass là luôn mở cấp. Không sửa AD hoặc đặt thêm transaction contract trong review này.

### R05 — Physical content panel khai báo trùng alias `content_assignments`

**Ưu tiên trung bình về mô hình.** [Physical ERD](../design/physical/physical-erd.puml) dòng 163 khai báo `entity "app.content_assignments" as content_assignments` có thuộc tính, rồi dòng 182 khai báo lại `entity "content_assignments" as content_assignments <<reference>>`. Render gộp cùng alias: box có stereotype `reference`, tên `content_assignments`, nhưng vẫn mang thuộc tính của bảng. Người đọc khó phân biệt bảng đang định nghĩa và box tham chiếu từ panel khác.

Chọn một khai báo trong correction được duyệt riêng: entity đầy đủ hoặc box reference; không dùng lại alias với hai vai trò trong cùng panel. Đây không phải lỗi syntax hay bằng chứng tồn tại hai bảng; inventory physical vẫn 34 bảng riêng biệt. Hai snapshot lịch sử cũng có cấu trúc cũ này, không sửa lịch sử.

### R06 — Hai verifier repository đang fail do baseline/scope tác vụ cũ

**Ưu tiên trung bình cho chất lượng evidence.** Cả canonical và physical verifier đều gọi `personalization-correction-evidence/check_task.py`. Script đó dùng baseline của task personalization, hash presentation của task khác và rule cấm rendered note trên VIEW-RUC-03. Trong khi task report-resumption đã có [Amendment 01](../../plans/approved/2026-10-12-report-functional-usecase-views-resumption-AMENDMENT-01.md) cho phép note scoring và cập nhật render.

Fail đã quan sát trước khi tạo file review: VIEW-RUC-01/source/render và presentation không khớp hash cũ; năm artifact report-resumption nằm ngoài inventory cũ; scoring note VIEW-RUC-03 bị rule cũ từ chối. Chạy lại sau khi ghi task review còn báo thêm các file review mới, đúng theo giới hạn inventory cũ. Vì vậy hai lệnh vẫn có verdict **FAIL**, dù independent freshness và syntax không lỗi.

Đề xuất task verifier riêng: tách kiểm tra nội dung/freshness có thể chạy lại khỏi kiểm tra bảo toàn frozen task baseline. Không xóa hoặc viết lại baseline, amendment hay evidence cũ để ép PASS.

### R07 — Lời thoại cần bổ sung các trường hợp biên

**Ưu tiên trung bình về độ đầy đủ.** Nội dung scoring, SRS và Study Focus trong script cũ phù hợp ADR-036/041/042. Tuy nhiên khi sửa phạm vi cần giữ các điểm dễ bị hỏi:

- Tối đa hai context ACTIVE; PAUSED giữ trạng thái. Profile/streak là toàn tài khoản; progress và Placement theo context.
- Placement bỏ dở/invalid/lưu thất bại không tạo kết quả và không trở thành “thi trượt”. Chỉ trả aggregate/recommendation, không đáp án từng câu.
- Lesson retry đúng một lần cho câu sai lần đầu; completion độc lập performance; redo không tăng số bài hoàn thành.
- Level-up fail giữ progress; pass nhưng cấp sau chưa available giữ passed evidence và hiển thị “Đang phát triển”. Số câu, thời lượng, gate và ngưỡng là cấu hình; không mặc định 30 câu/80%/100%.
- SRS không có due-list/preview; recall có hai outcome; củng cố không cập nhật lịch lần hai; focus không loại thẻ due.
- Progression-locked lesson đã publish trong curriculum active vẫn tính mẫu số; nội dung chưa available không tính. VIEW-RUC-06 vẫn thuộc phạm vi thuyết trình; giải thích ngắn ở đó, không lặp lại toàn bộ ở phần gate.
- UC-03 reminder, Jump và Reassessment không được đưa thành chức năng MVP active.

## Kết quả kiểm tra

| Kiểm tra | Output quan sát | Verdict |
|---|---|---|
| PlantUML `--check-syntax` trên 49 đường dẫn | Exit 0, không stdout/stderr lỗi | PASS |
| Hash nguồn/render 36 canonical + 9 report; parse SVG/decode PNG; primary physical source và 4 cặp render | 138 dòng evidence, không failure | PASS |
| `py -3.13 docs/modeling/current-target/verify.py` | Exit 1; exact historical task inventory gate fail | FAIL |
| `py -3.13 docs/design/physical/verify.py` | Exit 1; cùng dependency historical task inventory gate | FAIL |
| Runtime học tập/DB | Không chạy, review tài liệu không kiểm chứng runtime | N/A |
| Thời lượng lời nói thực tế | Người dùng chốt 10 phút; chưa có rehearsal có bấm giờ | N/A — timeline là ngân sách trình bày |

Chi tiết: [syntax](puml-review-evidence-2026-10-12/syntax.txt), [freshness](puml-review-evidence-2026-10-12/freshness.txt), [canonical](puml-review-evidence-2026-10-12/canonical.txt), [physical](puml-review-evidence-2026-10-12/physical.txt), [dimensions](puml-review-evidence-2026-10-12/image-dimensions.json). Kịch bản cũ có khoảng 2174 token phân tách bằng khoảng trắng trong các đoạn lời thoại, chưa tính cách chỉ hình/Q&A; con số này không phải số từ ngôn ngữ học hay chứng minh đúng 10 phút.

Kịch bản theo phạm vi đã xác nhận: [bản 10 phút UC + AD](usecase-activity-script-10min.md). Không sửa PUML, render, manifest, catalog, physical design hay verifier. Bản script gốc được bảo toàn để đối chiếu. Các đề xuất correction ở trên cần scope riêng; chúng không phải những sửa chữa đã được áp dụng.

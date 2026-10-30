# Kịch bản thuyết trình 10 phút: Use Case chức năng của Lingora

> **Thời lượng:** khoảng 10 phút, gồm thời gian mở sơ đồ, chỉ các phần cần nhấn mạnh và chuyển giữa các view. Phần hỏi đáp cuối tài liệu không tính vào 10 phút.
>
> **Mục tiêu:** trình bày các nhóm chức năng theo cách dễ theo dõi trong Chương II; phân biệt trách nhiệm của ba actor; giải thích cách SRS hoạt động sau clarification của Product Owner. Đây là kịch bản lời nói, không phải nội dung cần đọc nguyên văn trên slide.

## Thứ tự mở sơ đồ

| Thời gian | Nội dung | Sơ đồ mở |
|---|---|---|
| 0:00–0:35 | Mở đầu | Chưa mở hình |
| 0:35–1:00 | Use Case tổng quan | [VIEW-UC-01 PNG](../modeling/current-target/src/UC-01-target-overall.puml) · [PlantUML](../modeling/current-target/src/UC-01-target-overall.puml) |
| 1:00–1:45 | VIEW-RUC-01 — Tài khoản | [PNG](../modeling/report-usecases/VIEW-RUC-01-auth-profile.puml) · [PlantUML](../modeling/report-usecases/VIEW-RUC-01-auth-profile.puml) |
| 1:45–2:40 | VIEW-RUC-02 — Ngữ cảnh học | [PNG](../modeling/report-usecases/VIEW-RUC-02-learning-context.puml) · [PlantUML](../modeling/report-usecases/VIEW-RUC-02-learning-context.puml) |
| 2:40–3:55 | VIEW-RUC-03 — Bài học và luyện tập | [PNG](../modeling/report-usecases/VIEW-RUC-03-lesson-practice.puml) · [PlantUML](../modeling/report-usecases/VIEW-RUC-03-lesson-practice.puml) |
| 3:55–5:30 | VIEW-RUC-04 — SRS | [PNG](../modeling/report-usecases/VIEW-RUC-04-srs-review.puml) · [PlantUML](../modeling/report-usecases/VIEW-RUC-04-srs-review.puml) |
| 5:30–6:25 | VIEW-RUC-05 — Đánh giá | [PNG](../modeling/report-usecases/VIEW-RUC-05-assessment.puml) · [PlantUML](../modeling/report-usecases/VIEW-RUC-05-assessment.puml) |
| 6:25–7:10 | VIEW-RUC-06 — Tiến độ và lịch sử | [PNG](../modeling/report-usecases/VIEW-RUC-06-progress-history.puml) · [PlantUML](../modeling/report-usecases/VIEW-RUC-06-progress-history.puml) |
| 7:10–8:10 | VIEW-RUC-07 — Giáo viên | [PNG](../modeling/report-usecases/VIEW-RUC-07-teacher-authoring.puml) · [PlantUML](../modeling/report-usecases/VIEW-RUC-07-teacher-authoring.puml) |
| 8:10–9:30 | VIEW-RUC-08A/08B — Quản trị nội dung và tài khoản | [08A PNG](../modeling/report-usecases/VIEW-RUC-08A-admin-content-governance.puml) · [08B PNG](../modeling/report-usecases/VIEW-RUC-08B-admin-account-support.puml) |
| 9:30–10:00 | Kết luận | Quay lại VIEW-UC-01 nếu thuận tiện |

Mapping giữa tiểu mục báo cáo, view và UC canonical có trong [README của bộ functional views](../modeling/report-usecases/README.md). Có tám nhóm chức năng, trong đó nhóm Admin tách thành hai sơ đồ để dễ đọc.

---

## Lời thoại đọc trực tiếp

### 0:00–0:35 — Mở đầu

“Em xin trình bày phần Use Case chức năng của Lingora. Mục tiêu của phần này là đi từ bức tranh tổng thể đến từng nhóm công việc cụ thể: Học viên sử dụng hệ thống để học và theo dõi tiến trình; Giáo viên biên soạn nội dung được giao; còn Quản trị viên quản lý yêu cầu, quy trình duyệt và tài khoản.”

“Sau sơ đồ tổng quan, em sẽ lần lượt giải thích tám nhóm chức năng. Các sơ đồ có nhãn VIEW-RUC được tạo để trình bày chức năng theo chủ đề trong báo cáo. Đây là cách nhóm các hành vi đã có, không phải một bộ Use Case canonical mới.”

### 0:35–1:00 — Sơ đồ Use Case tổng quan

“Ở sơ đồ tổng quan, hệ thống có đúng ba actor nghiệp vụ: Học viên, Giáo viên và Quản trị viên. Các đường nối thể hiện actor nào tham gia vào chức năng nào; chúng không biểu diễn thứ tự thực hiện. Học viên là người sử dụng các chức năng học tập. Giáo viên phụ trách nội dung được phân công. Quản trị viên tổ chức và kiểm soát quy trình nội dung, đồng thời xử lý các chức năng quản trị tài khoản.”

“Catalog vẫn là UC-01 đến UC-14. Những ID VIEW-RUC mà em sắp trình bày chỉ là nhãn cho sơ đồ báo cáo. UC-03 nhắc học vẫn deferred, và Reassessment không phải chức năng MVP đang hoạt động.”

**Cách chỉ hình:** chỉ ba actor, rồi lướt qua các cụm Học tập, Biên soạn, Quản trị và Tài khoản; không cần đọc từng ellipse.

### 1:00–1:45 — VIEW-RUC-01: Đăng ký, đăng nhập và quản lý hồ sơ

“View thứ nhất gom các chức năng truy cập và hồ sơ. Học viên có thể tự đăng ký, đăng nhập, khôi phục quyền truy cập, cập nhật thông tin hồ sơ cơ bản và đăng xuất. Đây là điểm bắt đầu trước khi sử dụng các chức năng học tập.”

“Tài khoản Giáo viên và Quản trị viên không đi theo luồng tự đăng ký công khai. Quản trị viên provision tài khoản Giáo viên; sau đó Giáo viên kích hoạt và đăng nhập bằng tài khoản đã được cấp. Quản trị viên cũng đăng nhập để thực hiện nhiệm vụ quản trị. Những thao tác xác thực này không tạo ra một business role mới: mỗi tài khoản vẫn chỉ mang một trong ba vai trò đã nêu.”

“Nhóm này ánh xạ chủ yếu tới UC-01. Các view phía sau sẽ tập trung vào hành vi học tập hoặc quản trị tương ứng, thay vì lặp lại chi tiết xác thực.”

**Cách chỉ hình:** bắt đầu từ actor Học viên và nhóm hồ sơ; sau đó chỉ vào đăng nhập/kích hoạt của Giáo viên và Quản trị viên.

### 1:45–2:40 — VIEW-RUC-02: Thiết lập ngữ cảnh học tập

“Trước khi bắt đầu một lộ trình, Học viên chọn ngôn ngữ muốn học và tạo một LearningContext cho ngôn ngữ đó. Ngữ cảnh này giúp hệ thống xác định Học viên đang học nội dung nào, và cho phép lưu trạng thái khi Học viên tạm dừng rồi quay lại tiếp tục.”

“Khi chọn điểm bắt đầu, Học viên có ba hướng. Một là làm Placement để nhận gợi ý về vị trí bắt đầu. Hai là tự khai báo kinh nghiệm hoặc trình độ của mình. Ba là dùng điểm mặc định được cấu hình cho khóa học. Đây là các đường vào lộ trình khác nhau; không có đường nào tự động chứng nhận trình độ ngôn ngữ.”

“Placement vì thế hỗ trợ chọn điểm xuất phát, chứ không phải kỳ thi cấp chứng chỉ. Tự khai báo cũng là thông tin do Học viên cung cấp, còn điểm mặc định là giá trị do khóa học cấu hình. Sơ đồ không hard-code A1: cấp độ và nội dung khởi đầu phụ thuộc vào curriculum khả dụng của ngôn ngữ đang học.”

“Trong cùng LearningContext, Học viên cũng có thể chọn hoặc đổi trọng tâm học tập: cân bằng, từ vựng, ngữ pháp, đọc hoặc nghe. Nếu chưa chọn, trọng tâm mặc định là BALANCED. Đây là tùy chọn cá nhân cho phần luyện tập bổ sung ở các phiên tiếp theo; nó không thay đổi điểm bắt đầu, bài core hay lịch sử học đã ghi.”

**Cách chỉ hình:** chỉ nhóm LearningContext và phần chọn trọng tâm; tiếp theo lần lượt ba đường chọn điểm bắt đầu. Nhấn rằng các lựa chọn điểm bắt đầu đều dẫn vào lộ trình đã cấu hình.

### 2:40–3:55 — VIEW-RUC-03: Học bài và luyện tập

“Trong một bài học, hệ thống cung cấp nội dung bài và N bài tập cốt lõi bắt buộc theo cấu hình của bài đó. Học viên làm từng câu và nhận phản hồi hỗ trợ việc học. Nếu một câu sai ở lần đầu, hệ thống đưa câu đó về cuối hàng đợi để Học viên có đúng một lượt thử lại. Cách tổ chức này cho phép vừa ghi nhận kết quả ban đầu, vừa cho Học viên cơ hội sửa lỗi ngay trong bài.”

“Gọi K là số câu sai ở lần đầu. Mỗi câu đúng ngay lần đầu đóng góp 1 điểm performance; câu sai lần đầu nhưng đúng ở lượt thử lại đóng góp 0,5; câu vẫn sai sau lượt thử lại đóng góp 0. Vì tất cả lượt trả lời thực tế đều được tính, mẫu số là N cộng K. Performance là tổng các phần đóng góp chia cho N cộng K.”

“Điểm này mô tả kết quả của lượt học, còn hoàn thành bài là một trạng thái riêng. Học viên hoàn thành khi mọi bài core và lượt thử lại bắt buộc đã được xử lý hợp lệ, rồi hệ thống ghi nhận thành công. Bài không đòi hỏi phải đạt một ngưỡng điểm mới được tính hoàn thành. Nếu Học viên làm lại bài, đó là một attempt mới; việc làm lại không biến cùng một bài thành nhiều bài đã hoàn thành.”

“Nếu phiên học có thêm câu hỏi SRS, các câu đó nằm ngoài N, K, performance và điều kiện hoàn thành của phần core.”

“Sơ đồ còn có phần luyện tập bổ sung theo trọng tâm. Khi bắt đầu một phiên phù hợp tiếp theo, hệ thống có thể ưu tiên bài luyện tập đã được duyệt theo trọng tâm đã chọn. Đây là ưu tiên có fallback nếu tài liệu phù hợp còn ít, không phải bộ lọc loại bỏ mọi nội dung khác. Các thẻ SRS đến hạn được chọn độc lập; chọn trọng tâm ngữ pháp chẳng hạn không làm thẻ từ vựng đến hạn bị bỏ qua. Cả hai phần bổ sung đều không thay đổi kết quả core.”

**Cách chỉ hình:** lần theo nhánh sai lần đầu và lượt thử lại, rồi dừng ở ghi chú về `N`, `K`, `N + K` và phần bổ sung nằm ngoài core.

### 3:55–5:30 — VIEW-RUC-04: Ôn tập từ vựng theo SRS

“Ở view SRS, điểm cần nhấn mạnh là Học viên không duyệt trước danh sách từ đến hạn. Hệ thống lưu ngày đến hạn, stage và trạng thái due hoặc overdue để tự quyết định nội bộ. Học viên không xem danh sách đó, không chọn từ trong queue và cũng không thấy trước chính xác từ nào sắp xuất hiện. Khi đến lượt review, Học viên chỉ thấy câu hỏi hoặc prompt mà hệ thống đưa ra rồi trả lời.”

“SRS có thể xuất hiện trong một phiên học hoặc luyện tập thông thường. Sau phần core, hoặc xen giữa phiên nếu phù hợp, hệ thống có thể chọn một số thẻ đủ điều kiện và đưa từng câu hỏi ra. Một phiên review riêng cũng có thể được cung cấp như lựa chọn; nhưng trước tiên Học viên phải bắt đầu phiên. Chỉ sau đó hệ thống mới chọn nội dung. Như vậy, việc chọn thẻ vẫn do hệ thống quyết định và Học viên không nhìn thấy trước nội dung cần nhớ.”

“Với từ vựng cốt lõi, một bài học hoàn thành hợp lệ sẽ kích hoạt việc đưa từ vào SRS. Với từ tùy chọn, Học viên có thể chủ động chọn Add to Review. Mỗi cặp Học viên và Vocabulary chỉ có một thẻ logic; nếu cùng từ xuất hiện ở bài khác, hệ thống dùng lại thẻ hiện có thay vì tạo một lịch độc lập.”

“Policy B vẫn giữ nguyên: các khoảng là một, ba, bảy, mười bốn rồi ba mươi ngày; sau stage cuối, thẻ tiếp tục lặp lại mỗi ba mươi ngày. Nếu Học viên chọn ‘Chưa nhớ’, thẻ quay về stage đầu và được lên lịch lại sau một ngày. Hệ thống có thể đưa thẻ đó thêm một lần củng cố ở cuối chính phiên hiện tại, tối đa một lần; lượt củng cố không tạo thao tác cập nhật lịch thứ hai. Nếu thẻ đã đến hạn nhưng chưa được ôn, thẻ không mất đi mà tiếp tục đủ điều kiện cho một phiên phù hợp tiếp theo.”

**Cách chỉ hình:** chỉ thao tác trả lời của Học viên, rồi chuyển sang phần hệ thống lựa chọn và cập nhật lịch. Không mô tả một màn due-list hay thao tác để Học viên chọn thẻ.

**Nếu cần mở sơ đồ diễn tiến:** [Activity SRS](../modeling/current-target/src/ACT-06-srs-review.puml) · [Sequence SRS](../modeling/current-target/src/SEQ-08-srs-review.puml).

### 5:30–6:25 — VIEW-RUC-05: Placement và Level-up Assessment

“Nhóm đánh giá đang hoạt động trong MVP có hai chức năng. Placement hỗ trợ đưa ra điểm bắt đầu cho LearningContext. Level-up hỗ trợ quyết định việc chuyển cấp khi Học viên đã đáp ứng điều kiện curriculum và yêu cầu của bài đánh giá.”

“Mỗi lượt đánh giá gắn với một Assessment Version đã được xác định. Version này bất biến trong lúc làm bài, nên thành phần câu hỏi không thay đổi theo từng Học viên hoặc theo lịch SRS của người đó. Vì vậy, hệ thống không tự chèn câu hỏi SRS vào Placement hay Level-up đang được chấm điểm. Nếu muốn ôn tập gần thời điểm đánh giá, phần review phải nằm ở một phiên riêng, ngoài Assessment Version; nó không cộng vào điểm và không ảnh hưởng quyết định đạt hay chưa đạt.”

“Kết quả Placement là gợi ý điểm xuất phát, không phải chứng nhận năng lực. Reassessment vẫn chưa nằm trong phạm vi hoạt động của MVP.”

**Cách chỉ hình:** chỉ hai package Placement và Level-up; sau đó nhấn vào ranh giới giữa Assessment Version và phiên review riêng.

### 6:25–7:10 — VIEW-RUC-06: Theo dõi tiến độ và lịch sử học tập

“Sau khi học, Học viên cần biết mình đang ở đâu trong lộ trình và đã hoàn thành những gì. Progress được thể hiện như tỷ lệ không trọng số giữa số bài bắt buộc đã hoàn thành và số bài bắt buộc đủ điều kiện trong level hiện tại. Học viên cũng có thể xem thông tin về completion, performance của các lượt đã ghi nhận và streak.”

“Điều này không đòi hỏi tạo thêm một subsystem Progress để lưu bản sao. Tiến độ được suy ra từ các bằng chứng completion và nội dung đủ điều kiện. Đồng thời, progress, performance, proficiency, mastery và readiness là các khái niệm khác nhau: hoàn thành nhiều bài cho thấy tiến trình học, nhưng tự nó không chứng nhận Học viên đã thành thạo hoặc sẵn sàng lên cấp.”

**Cách chỉ hình:** di chuyển từ curriculum sang nhóm progress và history; kết lại bằng việc phân biệt tiến độ với năng lực đã xác minh.

### 7:10–8:10 — VIEW-RUC-07: Giáo viên biên soạn nội dung

“Giáo viên bắt đầu từ assignment và yêu cầu nội dung mà Quản trị viên đã giao. Trong phạm vi được phân công, Giáo viên tạo hoặc chỉnh sửa draft, bổ sung hoặc bỏ các draft member hợp lệ, và preview để tự kiểm tra trước khi submit.”

“Sau khi nộp, nội dung đi vào bước review. Nếu Quản trị viên yêu cầu thay đổi, Giáo viên nhận feedback, chỉnh sửa draft rồi resubmit. Đây là vòng làm việc qua lại để hoàn thiện nội dung. Vai trò Giáo viên chịu trách nhiệm author, nhưng không thể tự tạo assignment cho mình, không approve và không publish. Submit chỉ chuyển nội dung sang bước thẩm định; nó không đồng nghĩa nội dung đã được duyệt hay đã hiển thị cho người học.”

**Cách chỉ hình:** theo thứ tự assignment → draft → preview → submit; rồi chỉ nhánh changes requested quay lại revise/resubmit.

### 8:10–9:30 — VIEW-RUC-08A/08B: Quản trị nội dung, tài khoản và hỗ trợ

“Hai view cuối vẫn thuộc cùng một actor là Quản trị viên. Chúng được tách ra để sơ đồ không quá dày. Ở phần content governance, Quản trị viên xác định yêu cầu và phạm vi nội dung, lập blueprint đánh giá khi cần, rồi phân công hoặc phân công lại Giáo viên chịu trách nhiệm.”

“Khi Giáo viên submit, Quản trị viên xem xét nội dung theo yêu cầu đã thống nhất. Nếu còn thiếu, Quản trị viên request changes và gửi feedback. Nếu nội dung đạt yêu cầu, Quản trị viên approve trước; chỉ nội dung đã approve mới đủ điều kiện publish. Quản trị viên cũng có thể withdraw hoặc archive theo quy tắc vòng đời. Trách nhiệm của Admin là quản lý yêu cầu, phân công và governance; Admin không viết lesson, exercise hay assessment item thay cho Giáo viên.”

“Ở view account/support, Quản trị viên provision tài khoản Giáo viên, disable hoặc re-enable tài khoản và hỗ trợ tài khoản Học viên trong phạm vi được phép. Hỗ trợ tài khoản không có nghĩa là sửa kết quả học, completion, performance, kết quả đánh giá hay lịch sử SRS của Học viên. Những thao tác quản trị cần có khả năng audit để truy lại ai đã làm gì.”

“Như vậy, hai sơ đồ mô tả hai nhóm công việc của cùng một vai trò: một nhóm quản lý nội dung, một nhóm quản lý tài khoản và hỗ trợ.”

**Cách chỉ hình:** ở 08A, lần theo requirement → assignment → review → approve/publish; chuyển sang 08B và chỉ vào account support/audit cùng giới hạn không sửa bằng chứng học tập.

### 9:30–10:00 — Kết luận

“Tóm lại, sơ đồ actor-oriented trả lời câu hỏi ai được làm gì; các functional view giúp trình bày từng nhóm chức năng rõ ràng hơn trong báo cáo. Các nhãn VIEW-RUC chỉ là mã sơ đồ và ánh xạ về UC hiện có. Vì vậy, catalog UC-01 đến UC-14 không bị đánh số lại hay bổ sung UC mới.”

“Với SRS, hệ thống tự chọn câu hỏi phù hợp và Học viên trả lời prompt được đưa ra; không có bước duyệt trước danh sách từ. Review cũng nằm ngoài Placement và Level-up Assessment Version đang được chấm điểm. Cách phân chia này giúp giữ rõ vai trò, hành trình học và ý nghĩa của kết quả đánh giá. Em xin kết thúc phần trình bày.”

---

## Câu hỏi có thể được hỏi

### Học viên có thể mở danh sách từ đến hạn để tự sắp xếp không?

Không. Due/overdue, `due_at` và stage là trạng thái nội bộ. Hệ thống chọn câu hỏi cho phiên phù hợp; Học viên chỉ thấy prompt được đưa ra và trả lời.

### Vì sao SRS có thể xuất hiện trong bài học nhưng không được đưa vào Placement hoặc Level-up?

Phiên học thông thường có thể thêm review block bên cạnh phần core. Placement và Level-up dùng Assessment Version bất biến cho attempt, nên thành phần câu hỏi không được thay đổi tùy theo due card của từng Học viên. Review gần thời điểm thi, nếu có, phải là phiên riêng và không ảnh hưởng điểm hoặc pass/fail.

### Nếu Học viên không ôn ngay khi thẻ đến hạn thì thẻ có mất không?

Không. Thẻ vẫn ở trạng thái due/overdue và tiếp tục đủ điều kiện để hệ thống chọn trong một phiên phù hợp sau này. Học viên không cần mở due list để giữ thẻ.

### Lượt củng cố sau “Chưa nhớ” có đổi lịch thêm lần nữa không?

Không. Kết quả review ban đầu reset stage và tính lịch mới. Lượt củng cố cùng phiên được phép tối đa một lần nhưng không tạo scheduling operation thứ hai.

### Các sơ đồ VIEW-RUC có bổ sung UC canonical mới không?

Không. VIEW-RUC là ID sơ đồ phục vụ báo cáo, không phải canonical UC ID. Tám nhóm chức năng được ánh xạ về các UC đang có; riêng VIEW-RUC-08A và 08B là hai sơ đồ con của nhóm Admin. Catalog vẫn giữ nguyên UC-01 đến UC-14, và UC-03 reminder vẫn deferred.

### Vì sao progress không được mô tả như một bảng hoặc subsystem riêng?

View nói về thông tin Học viên cần xem. Progress được suy ra từ completion và tập bài đủ điều kiện, nên cách trình bày này không tự tạo thêm quyết định lưu trữ.

## Ghi chú khi trình bày

- Mở PNG theo thứ tự trong bảng; chuyển sang SVG nếu cần phóng lớn trong báo cáo.
- Ở VIEW-RUC-03, dừng lại tại ghi chú scoring để giải thích `N`, `K`, các mức đóng góp `1 / 0.5 / 0`, mẫu số `N + K` và việc completion độc lập với performance.
- Ở VIEW-RUC-04, chỉ vào phần câu hỏi Học viên trả lời và phần hệ thống chọn/cập nhật nội bộ; không mô tả due-list UI.
- Ở VIEW-RUC-05, nhấn vào việc Assessment Version bất biến và review nằm ngoài điểm/pass-fail.
- Khi mở 08A/08B, nói rõ đây là hai view của cùng Admin actor, được tách vì độ dễ đọc.
- Nếu cần rút ngắn, ưu tiên giữ nguyên phần lời thoại SRS và Assessment vì đó là clarification quan trọng nhất.

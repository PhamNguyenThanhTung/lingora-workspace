# Kịch bản 10 phút — toàn bộ UC chức năng và ba AD nổi bật

**Phạm vi người dùng đã chốt ngày 12/10/2026:** bỏ ba hình actor-oriented “06 — Học viên (UC-02)”, “07 — Giáo viên (UC-03)”, “08 — Quản trị viên (UC-04)”. Giữ UC tổng quan và **toàn bộ chín functional views** VIEW-RUC-01–07, 08A/08B. Không bỏ nhóm tài khoản, progress, Teacher hoặc Admin chức năng.

Ba AD chọn trình bày: **ACT-03 Học bài → ACT-06 SRS → ACT-04 Lên cấp**. Đây là các sơ đồ TARGET của thiết kế; không mô tả các chức năng đã chạy trong checkout. Lời thoại dưới đây có thể dùng trực tiếp. Timeline gồm chuyển hình/chỉ hình, chưa được kiểm chứng bằng rehearsal thực tế; phần dự phòng không đọc trong 10 phút.

**Ảnh AD đã giãn bố cục ngày 12/10/2026:** các link AD dưới đây dùng bản xuất native Draw.io mới. Khi chiếu ACT-03, mở lần lượt [vùng 1 — mở bài/queue/retry](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-03-part-1.png), [vùng 2 — lưu và completion](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-03-part-2.png), [vùng 3 — supplementary/kết quả](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-03-part-3.png); dùng SVG để phóng khi cần theo dõi toàn luồng. Đây là các vùng cắt có phần giao nhau từ cùng sơ đồ, không phải ba luồng mới.

## Thứ tự mở hình và thời lượng

| Thời gian | Nội dung | Hình cần mở |
|---|---|---|
| 0:00–0:30 | Mở đầu + UC tổng quan | [VIEW-UC-01](../modeling/current-target/rendered/UC-01-target-overall.png) |
| 0:30–1:05 | Tài khoản và hồ sơ | [VIEW-RUC-01](../modeling/report-usecases/rendered/VIEW-RUC-01-auth-profile.png) |
| 1:05–1:50 | Ngữ cảnh học tập | [VIEW-RUC-02](../modeling/report-usecases/rendered/VIEW-RUC-02-learning-context.png) |
| 1:50–2:35 | Bài học và luyện tập | [VIEW-RUC-03](../modeling/report-usecases/rendered/VIEW-RUC-03-lesson-practice.png) |
| 2:35–3:15 | Ôn tập SRS | [VIEW-RUC-04](../modeling/report-usecases/rendered/VIEW-RUC-04-srs-review.png) |
| 3:15–3:55 | Placement và Level-up | [VIEW-RUC-05](../modeling/report-usecases/rendered/VIEW-RUC-05-assessment.png) |
| 3:55–4:20 | Tiến độ và lịch sử | [VIEW-RUC-06](../modeling/report-usecases/rendered/VIEW-RUC-06-progress-history.png) |
| 4:20–4:45 | Giáo viên biên soạn | [VIEW-RUC-07](../modeling/report-usecases/rendered/VIEW-RUC-07-teacher-authoring.png) |
| 4:45–5:25 | Admin governance + tài khoản | [VIEW-RUC-08A](../modeling/report-usecases/rendered/VIEW-RUC-08A-admin-content-governance.png), rồi [08B](../modeling/report-usecases/rendered/VIEW-RUC-08B-admin-account-support.png) |
| 5:25–7:05 | AD Học bài: queue, retry, completion | [ACT-03 PNG](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-03.png) · [SVG để phóng](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-03.svg) |
| 7:05–8:20 | AD SRS: lịch ôn và củng cố | [ACT-06 PNG](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-06.png) · [SVG](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-06.svg) |
| 8:20–9:40 | AD Lên cấp: gate và kết quả | [ACT-04 PNG](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-04.png) · [SVG](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-04.svg) |
| 9:40–10:00 | Kết thúc | Giữ ACT-04 hoặc quay UC tổng quan |

Ngân sách: **5 phút 25 giây UC, 4 phút 15 giây AD, 20 giây kết thúc**. Bỏ ba hình theo actor vì các functional views đã phân tích trách nhiệm theo chức năng. Không mở lại chúng trong phần nói chính.

## Lời thoại

### 0:00–0:30 — UC tổng quan

“Em xin trình bày thiết kế Use Case và Activity Diagram của Lingora. Hệ thống có ba actor: Học viên, Giáo viên và Quản trị viên. Em sẽ đi qua các nhóm chức năng, rồi giải thích ba luồng nổi bật: học bài, ôn tập SRS và thi lên cấp. Use Case cho biết ai sử dụng chức năng nào; Activity Diagram cho biết các bước và nhánh xử lý. Nhắc học và Reassessment hiện ngoài MVP.”

**Chỉ hình:** ba actor và ba cụm học tập/biên soạn/quản trị. Không đọc từng ellipse ở hình tổng quan.

### 0:30–1:05 — VIEW-RUC-01: Tài khoản và hồ sơ

“Nhóm đầu tiên là truy cập hệ thống. Học viên tự đăng ký, đăng nhập, khôi phục mật khẩu, cập nhật hồ sơ và đăng xuất. Giáo viên dùng tài khoản được cấp và kích hoạt qua liên kết; tài khoản staff không tự đăng ký công khai. Mỗi tài khoản có một vai trò. Nhóm này ánh xạ UC-01 và tạo điều kiện truy cập cho các chức năng tiếp theo.”

**Chỉ hình:** nhóm tài khoản, rồi kích hoạt staff; không đi sâu provisioning.

### 1:05–1:50 — VIEW-RUC-02: Ngữ cảnh học tập

“Học viên chọn ngôn ngữ và tạo LearningContext. Mỗi ngôn ngữ có một context cho người học, tối đa hai context hoạt động; tạm dừng rồi tiếp tục vẫn giữ trạng thái. Có ba cách chọn điểm bắt đầu: Placement, tự khai báo hoặc mặc định theo nội dung khả dụng. Placement chỉ đề xuất điểm xuất phát. Học viên còn chọn trọng tâm cân bằng, từ vựng, ngữ pháp, đọc hoặc nghe. Trọng tâm ảnh hưởng luyện tập bổ sung ở phiên sau, không sửa bài core hoặc tiến độ đã ghi.”

**Chỉ hình:** context → ba đường chọn điểm bắt đầu → trọng tâm → mở lộ trình. Phân biệt trạng thái của từng ngôn ngữ với hồ sơ toàn tài khoản.

### 1:50–2:35 — VIEW-RUC-03: Bài học và luyện tập

“Học viên mở nội dung bài, làm bài tập core và nhận phản hồi. Câu sai lần đầu được đưa cuối hàng đợi để thử lại đúng một lần. Hoàn thành và performance là hai kết quả riêng: xử lý hợp lệ toàn bộ core và lưu thành công thì hoàn thành, không cần vượt một ngưỡng điểm. Học lại tạo attempt mới, không tăng số bài hoàn thành. Có thể luyện tập bổ sung theo trọng tâm hoặc trả lời câu SRS do hệ thống chọn; cả hai nằm ngoài điểm và completion core. Phần AD sẽ làm rõ cách tính.”

**Chỉ hình:** xem bài → core/feedback/retry → complete/redo → phần bổ sung. Chưa đọc công thức.

### 2:35–3:15 — VIEW-RUC-04: Ôn tập SRS

“Học viên trả lời câu ôn được hệ thống đưa ra hoặc bắt đầu phiên ôn riêng tùy chọn. Hệ thống tự chọn thẻ đến hạn; người học không duyệt trước danh sách từ, stage hoặc ngày đến hạn. Từ core được thêm sau khi hoàn thành bài; từ tùy chọn cần Add to Review. Mỗi Học viên và Vocabulary chỉ có một thẻ logic. Trọng tâm học tập không làm thẻ đến hạn bị loại. AD SRS sẽ giải thích nhánh đã nhớ, chưa nhớ và lịch tiếp theo.”

**Chỉ hình:** trái là tương tác người học, phải là chọn nội bộ và tính lịch. `include` biểu thị hành vi được dùng, không phải mũi tên thứ tự thời gian.

### 3:15–3:55 — VIEW-RUC-05: Placement và Level-up

“Placement đề xuất điểm bắt đầu; Level-up xét chuyển cấp khi đủ điều kiện chương trình. Cả hai gắn mỗi attempt với một Assessment Version bất biến. Người học không nhận đúng sai từng câu trong khi thi; sau nộp chỉ nhận kết quả tổng hợp phù hợp. Bỏ dở hoặc chưa lưu thành công không tạo kết quả hoàn tất. Không chèn SRS hoặc luyện tập theo trọng tâm vào bài thi được chấm. Số câu, thời lượng và ngưỡng đạt là cấu hình của khóa học.”

**Chỉ hình:** hai package Placement/Level-up và ghi chú ranh giới assessment. Không nhắc 80% hoặc 30 câu như quy tắc chung.

### 3:55–4:20 — VIEW-RUC-06: Tiến độ và lịch sử

“Học viên xem lộ trình, completion, performance và streak. Progress là tỷ lệ bài bắt buộc hoàn thành trên bài đủ điều kiện; bài đã publish nhưng khóa theo tiến trình vẫn tính, còn nội dung chưa khả dụng thì không. Streak dùng hoạt động học hợp lệ theo ngày địa phương của tài khoản. Tiến độ không chứng nhận năng lực hay thành thạo.”

**Chỉ hình:** curriculum/progress → history/streak; không giải thích cấu trúc lưu trữ.

### 4:20–4:45 — VIEW-RUC-07: Giáo viên biên soạn

“Giáo viên xem assignment, soạn draft và chỉnh các thành phần được giao, preview rồi submit. Khi nhận yêu cầu sửa, Giáo viên chỉnh và resubmit, giữ lịch sử phản hồi. Giáo viên chỉ author trong phạm vi được giao, không tự phân công, approve hoặc publish. Submit đưa nội dung sang review, chưa làm nội dung xuất hiện cho người học.”

**Chỉ hình:** worklist/draft/preview → submit → feedback/resubmit.

### 4:45–5:25 — VIEW-RUC-08A/08B: Admin

“Ở 08A, Admin định nghĩa yêu cầu, blueprint đánh giá và phân công hoặc phân công lại Giáo viên. Sau review, Admin yêu cầu sửa hoặc approve; chỉ bản đã duyệt mới được publish. Thu hồi và lưu trữ giữ lịch sử. Admin không viết nội dung thay Giáo viên. Ở 08B, Admin quản lý tài khoản staff, disable hoặc re-enable tài khoản, hỗ trợ Học viên và xem báo cáo, audit. Hỗ trợ không cho phép sửa completion, performance, kết quả assessment hoặc SRS history. Hai view vẫn thuộc cùng một actor.”

**Chỉ hình:** 08A requirement/assignment → review/approve/publish; chuyển 08B support/audit. Chuyển ngay sang AD.

### 5:25–7:05 — ACT-03: Học bài và luyện tập

“Em chuyển sang AD học bài. Lane Học viên chứa thao tác học và trả lời; lane Hệ thống chứa kiểm tra quyền, chấm và ghi kết quả. Sau khi mở bài và xem nội dung, hệ thống tạo N bài tập core, tổng đóng góp bằng không và K bằng không.”

“Trong vòng lặp, câu trả lời không hợp lệ phải gửi lại và chưa tính lượt. Đúng lần đầu đóng góp một điểm. Sai lần đầu làm K tăng một và đưa câu xuống cuối queue. Đúng ở lượt thử lại đóng góp nửa điểm; vẫn sai đóng góp không và không có lượt thứ ba. Khi queue hết, performance bằng tổng đóng góp chia N cộng K, vì mẫu số tính cả các lượt retry.”

“Nếu bỏ dở hoặc lưu thất bại, hệ thống không ghi completion hay performance hoàn tất mới. Nếu kết thúc hợp lệ và lưu thành công, hệ thống ghi completion độc lập điểm, enroll từ core vào SRS và ghi hoạt động streak. Học lại chỉ thêm attempt.”

“Phần cuối là luyện tập bổ sung khi phiên được bắt đầu. Hệ thống chọn SRS độc lập trọng tâm và ưu tiên bài practice phù hợp; thiếu nguồn ưu tiên thì dùng nguồn hợp lệ khác. Kết quả bổ sung không đổi N, K, performance hay completion core. Vì vậy, hoàn thành phần core và kết quả phần bổ sung có ranh giới rõ ràng.”

**Chỉ hình/phóng vùng:** 15 giây đầu vùng mở bài/queue; tiếp theo vùng first/retry; cuối cùng vùng save và supplementary. Không chiếu toàn AD-03 ở cỡ nhỏ rồi đọc mọi node.

### 7:05–8:20 — ACT-06: SRS

“AD SRS bắt đầu từ nguồn enroll: hoàn thành bài thì tự thêm từ core; từ tùy chọn cần người học chọn. Thẻ đã có giữ stage và lịch, thẻ mới đến hạn sau một ngày. Sau khi phiên học hoặc phiên ôn bắt đầu, hệ thống kiểm tra quyền và chọn thẻ nội bộ, chỉ đưa prompt hiện tại.”

“Khi người học trả lời và chọn đã nhớ hoặc chưa nhớ, hệ thống kiểm tra lượt ôn. Gửi lại cùng operation thì trả kết quả cũ, không cập nhật lịch hai lần. Đã nhớ thì lịch tiến qua một, ba, bảy, mười bốn, ba mươi ngày; sau stage cuối tiếp tục mỗi ba mươi ngày. Chưa nhớ thì reset về stage một, ôn sau một ngày.”

“Câu chưa nhớ có thể được củng cố cuối phiên tối đa một lần, giữ nguyên lịch vừa tính. Thẻ quá hạn chưa được chọn vẫn đủ điều kiện ở phiên sau. Đây là cách hỗ trợ ghi nhớ dài hạn mà người học không tự chọn hoặc biết trước due queue.”

**Chỉ hình:** enrollment/thẻ cũ → bắt đầu/chọn prompt → chống ghi trùng → nhớ/quên → reinforcement. Các số ngày là lịch nội bộ, không phải thông tin due-list trên giao diện.

### 8:20–9:40 — ACT-04: Level-up

“AD lên cấp có các điều kiện riêng. Trước hết hệ thống kiểm tra context đang hoạt động và curriculum gate. Chưa đủ thì chỉ ra yêu cầu còn thiếu. Đủ điều kiện mới gắn attempt với version đã publish và cho làm bài.”

“Sau khi nộp, hệ thống xác thực, chấm theo version đã gắn và lưu kết quả. Bỏ dở, dữ liệu không hợp lệ hoặc lưu thất bại không tạo kết quả hoàn tất và không mở cấp mới. Khi áp dụng progression phải thỏa cả điều kiện chương trình và điều kiện đạt bài thi.”

“Nếu chưa đạt, tiến độ và quyền học đang có vẫn giữ, người học được đề xuất ôn tập và thi lại theo cấu hình. Nếu đạt nhưng cấp sau chưa có nội dung khả dụng, hệ thống giữ bằng chứng đã đạt, hiển thị đang phát triển. Khi đủ điều kiện và có nội dung, cấp tiếp theo mới được mở. Như vậy, thi đạt, tiến độ curriculum và nội dung khả dụng được kiểm tra riêng; kết quả lên cấp không tự trở thành chứng chỉ ngôn ngữ.”

**Chỉ hình:** gate đầu → version/submit/save → fail/pass → available/coming soon. AD hiện ghi gate rõ ở đầu; lời thoại nhấn điều kiện kết hợp theo UC-05/SEQ-07, không nói hình đã có node recheck sau save. Xem nhận xét R04 trong [review](puml-review-2026-10-12.md).

### 9:40–10:00 — Kết thúc

“Các UC cho thấy phạm vi công việc của ba vai trò. Ba AD làm rõ cách hoàn thành bài, cập nhật lịch ôn và xét lên cấp. Thiết kế tách completion, performance và progression, đồng thời giữ lịch sử khi học lại hoặc khi chưa có nội dung tiếp theo. Em xin kết thúc phần trình bày.”

## Đối chiếu độ bao phủ

| UC canonical | Functional view được trình bày | Kết quả cần giải thích |
|---|---|---|
| UC-01 | VIEW-RUC-01 | Truy cập/hồ sơ; controlled staff activation |
| UC-02 | VIEW-RUC-02, 05 | Placement và starting recommendation |
| UC-03 | Chỉ nhắc ngoài scope ở mở đầu | Reminder DEFERRED, không trình bày như UC active |
| UC-04 | VIEW-RUC-02, 06 | Context/start/focus, lộ trình và eligibility |
| UC-05 | VIEW-RUC-05 + ACT-04 | Curriculum gate, assessment pass, available next level |
| UC-06 | VIEW-RUC-03 + ACT-03 | Lesson/core/retry/completion/redo/supplementary |
| UC-07 | VIEW-RUC-04 + ACT-06 | Enrollment, prompt nội bộ, remembered/forgotten, schedule |
| UC-08 | VIEW-RUC-06; ACT-03/06 hỗ trợ | Progress, performance history, account streak |
| UC-09 | VIEW-RUC-08A; scope giao việc ở 07 | Requirements/blueprint/assignment/reassignment |
| UC-10 | VIEW-RUC-07 | Assigned authoring/draft members/preview |
| UC-11 | VIEW-RUC-07 | Submit, request changes, revise/resubmit/history |
| UC-12 | VIEW-RUC-08A | Review/approve/publish/withdraw/archive |
| UC-13 | VIEW-RUC-08B | Accounts/support, evidence unchanged |
| UC-14 | VIEW-RUC-08B | Reports/audit |

VIEW-RUC chỉ là mã hình, không đánh lại catalog. Tám nhóm chức năng có chín hình vì Admin tách 08A/08B. Ba hình actor-oriented bị bỏ không đồng nghĩa ba UC nghiệp vụ bị xóa. Không đưa ACT-05 Reassessment vào luồng active.

## Dự phòng khi hỏi đáp — không tính vào 10 phút

- **Ví dụ performance:** giả sử N = 4; hai câu đúng lần đầu, hai câu sai lần đầu nên K = 2; một retry đúng và một retry sai. Tổng đóng góp = 2 + 0,5 = 2,5; performance = 2,5/6 ≈ 41,67%. Nếu xử lý/lưu hợp lệ vẫn hoàn thành. Đây là ví dụ minh họa công thức ADR-036, không quy định mọi bài có bốn câu.
- **Streak tính khi nào:** completed lesson, completed redo hợp lệ hoặc recorded SRS review; tối đa một lần mỗi ngày địa phương, toàn tài khoản. Login, mở app, retry riêng lẻ, Placement hoặc Level-up không qualify.
- **Vì sao không xem due list:** ADR-041 yêu cầu hệ thống chọn nội bộ sau bắt đầu phiên, learner chỉ thấy prompt. Trọng tâm ngữ pháp không suppress từ due; SRS không trộn vào assessment có điểm.
- **Hai AD dự phòng:** [ACT-01 onboarding](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-01.png), [ACT-02 Placement](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-02.png). Nếu muốn nhấn governance, thay ACT-04 bằng [ACT-08](../modeling/current-target/evidence/2026-10-12-ad-layout/ACT-08.png) và chuẩn bị lời thoại riêng; không mở thêm cả ba khi còn đúng 10 phút.
- **Mức độ hiện thực:** đang trình bày thiết kế TARGET. CURRENT checkout mới có nền xác thực/khung web và workspace dữ liệu; không khẳng định learner engine hay Admin web đã chạy.

## Chuẩn bị trước khi nói

1. Mở sẵn hình theo timeline; ưu tiên SVG cho AD để phóng. Nhãn UC-02/03/04 trong tên file actor views dễ nhầm với business UC nên bỏ đúng ba file đã nêu.
2. Bấm giờ rehearsal một lần; 5:25 phải chuyển sang AD-03, 8:20 sang AD-04. Ngân sách gồm thao tác chuyển hình, không phải chỉ tốc độ đọc.
3. Nếu chậm, bỏ ví dụ/cách gọi tên entity và rút phần mô tả phụ; vẫn giữ đủ chín functional views, ba AD và các ranh giới completion/SRS/assessment.
4. Không đọc bảng mapping, phần dự phòng hoặc ghi chú chỉ hình thành lời thoại. Không lặp lại nguyên phần UC khi chuyển sang AD; tập trung decision và nhánh lỗi.

Authority: [catalog](../use-case-specifications.md), [functional crosswalk](../modeling/report-usecases/README.md), ADR-036/041/042 trong [decision log](../../logs/decision-log.md), [Study Focus](../study-focus-addendum.md). Bản gốc [usecase-activity-presentation.md](usecase-activity-presentation.md) giữ nguyên để đối chiếu.

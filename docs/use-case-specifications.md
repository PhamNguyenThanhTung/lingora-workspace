# ĐẶC TẢ CHI TIẾT CÁC USE CASE - HỆ THỐNG LINGORA

Tài liệu này chứa bảng đặc tả chi tiết cho toàn bộ 14 Use Case của hệ thống Lingora.

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

## 1. Xác thực, Đăng nhập và Quản lý hồ sơ

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Xác thực, Đăng nhập và Quản lý hồ sơ** |
| **Tác nhân chính** | Người học, Giáo viên, Quản trị viên (Admin) |
| **Mục tiêu** | Cho phép người dùng đăng ký tài khoản (dành cho Người học), đăng nhập hệ thống, kích hoạt tài khoản lần đầu qua email (dành cho Giáo viên), khôi phục mật khẩu khi quên, đổi mật khẩu và cập nhật thông tin cá nhân cơ bản. |
| **Mô tả ngắn gọn** | Người dùng truy cập hệ thống để đăng nhập, đăng ký tài khoản mới, kích hoạt tài khoản qua liên kết hoặc gửi yêu cầu đặt lại mật khẩu; sau khi đăng nhập thành công, người dùng có thể cập nhật họ tên hiển thị, đổi mật khẩu hoặc đăng xuất khỏi hệ thống. |
| **Tiền điều kiện** | Thiết bị có kết nối mạng Internet liên tục tới máy chủ hệ thống. |
| **Hậu điều kiện** | Phiên đăng nhập hợp lệ được cấp cho người dùng; thông tin cá nhân hoặc mật khẩu mới được cập nhật vào cơ sở dữ liệu. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người dùng chọn thao tác mong muốn: "Đăng nhập", "Đăng ký" (chỉ Người học), "Quên mật khẩu", hoặc mở "Liên kết kích hoạt tài khoản lần đầu" nhận được qua email (dành cho Giáo viên).<br>**2.** Hệ thống hiển thị biểu mẫu tương ứng.<br>**3.** Người dùng nhập thông tin xác thực:<br>&nbsp;&nbsp;• Nếu Đăng nhập: Nhập Email và Mật khẩu.<br>&nbsp;&nbsp;• Nếu Đăng ký: Nhập Họ tên, Email, Mật khẩu.<br>&nbsp;&nbsp;• Nếu Quên mật khẩu: Nhập Email đã đăng ký để nhận liên kết đặt lại mật khẩu.<br>&nbsp;&nbsp;• Nếu Kích hoạt tài khoản lần đầu (Giáo viên): Mở liên kết từ email, nhập mật khẩu mới theo yêu cầu.<br>**4.** Hệ thống kiểm tra dữ liệu và phản hồi:<br>&nbsp;&nbsp;4a. Dữ liệu sai định dạng hoặc mật khẩu không đủ độ dài → Báo lỗi trường thông tin tương ứng.<br>&nbsp;&nbsp;4b. Đăng nhập sai Email hoặc Mật khẩu → Thông báo "Email hoặc mật khẩu không chính xác".<br>&nbsp;&nbsp;4c. Đăng ký với Email đã tồn tại → Thông báo "Email đã được sử dụng".<br>&nbsp;&nbsp;4d. Tài khoản đang bị khóa → Thông báo "Tài khoản tạm thời bị vô hiệu hóa, vui lòng liên hệ Quản trị viên".<br>&nbsp;&nbsp;4e. Yêu cầu Quên mật khẩu hợp lệ → Gửi email chứa liên kết đặt lại mật khẩu và hiển thị thông báo "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu". Người dùng mở liên kết, nhập mật khẩu mới và hoàn tất.<br>&nbsp;&nbsp;4f. Kích hoạt tài khoản lần đầu hợp lệ → Lưu mật khẩu mới, kích hoạt trạng thái tài khoản thành hoạt động và chuyển đến trang đăng nhập.<br>&nbsp;&nbsp;4g. Đăng nhập/Đăng ký thành công → Khởi tạo phiên làm việc và chuyển hướng người dùng đến trang chính theo vai trò.<br>**5.** Người dùng mở mục "Hồ sơ cá nhân", chỉnh sửa Họ tên hiển thị hoặc chọn "Đổi mật khẩu" (nhập Mật khẩu hiện tại, Mật khẩu mới).<br>**6.** Hệ thống kiểm tra và cập nhật:<br>&nbsp;&nbsp;6a. Mật khẩu hiện tại không khớp → Báo lỗi mật khẩu không đúng.<br>&nbsp;&nbsp;6b. Mật khẩu mới trùng mật khẩu cũ hoặc không đủ độ dài → Yêu cầu nhập lại.<br>&nbsp;&nbsp;6c. Hợp lệ → Cập nhật cơ sở dữ liệu và thông báo "Lưu thông tin thành công".<br>**7.** Người dùng nhấn "Đăng xuất".<br>**8.** Hệ thống thu hồi phiên làm việc và chuyển hướng về màn hình đăng nhập. |
| **Điều kiện đặc biệt** | • Mật khẩu tối thiểu 8 ký tự, bao gồm cả chữ và số.<br>• Tài khoản Giáo viên do Quản trị viên khởi tạo trong hệ thống, không mở đăng ký tự do; Giáo viên kích hoạt tài khoản qua liên kết gửi tới email.<br>• Tài khoản Quản trị viên được khởi tạo qua cấu hình quản trị hệ thống, không tạo tự do qua giao diện.<br>• Yêu cầu kết nối mạng liên tục; nếu mất mạng trong quá trình gửi biểu mẫu, hệ thống hiển thị thông báo "Mất kết nối Internet, vui lòng kiểm tra mạng". |
| **Yêu cầu phi chức năng** | • Thời gian xử lý xác thực ≤ 1.5 giây.<br>• Mật khẩu lưu trữ dưới dạng băm một chiều an toàn.<br>• Giao diện tương thích máy tính và thiết bị di động. |

---

## 2. Kiểm tra trình độ đầu vào

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Kiểm tra trình độ đầu vào** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Đánh giá trình độ tiếng Anh ban đầu của người học theo các chuẩn năng lực CEFR thông qua bài kiểm tra 30 câu hỏi; lưu trữ kết quả trình độ ban đầu vào hồ sơ để đối chiếu với kết quả Thi lên cấp sau này và làm căn cứ xếp thẳng vào cấp độ A2 khi nội dung A2 được phát hành chính thức. |
| **Mô tả ngắn gọn** | Người học làm bài kiểm tra trình độ đầu vào 30 câu hỏi đa kỹ năng trong 25 phút (chỉ làm đúng 1 lần duy nhất, nếu chọn bỏ qua cũng tính là dùng hết lượt duy nhất và bị khóa vĩnh viễn); hệ thống chấm điểm và xác định trình độ năng lực theo CEFR. Trong bản pilot, mọi kết quả kiểm tra đều bắt đầu học tại cấp A1 từ Unit 1 bài 1; hệ thống ghi nhận trình độ ước lượng vào hồ sơ học viên để đối chiếu năng lực tiến bộ với kỳ thi lên cấp và để xếp thẳng vào cấp A2 khi A2 phát hành. |
| **Tiền điều kiện** | • Người học đã đăng nhập vào hệ thống.<br>• Tài khoản chưa từng làm hoặc chưa từng bỏ qua bài kiểm tra trình độ đầu vào trước đó (chỉ có đúng 1 lượt duy nhất).<br>• Bộ đề kiểm tra trình độ 30 câu hỏi đã được sẵn sàng trên hệ thống.<br>• Thiết bị có kết nối mạng Internet liên tục. |
| **Hậu điều kiện** | Điểm bài thi (0–30 điểm), trình độ CEFR ước lượng và trạng thái đã hoàn thành bài kiểm tra (hoặc đã bỏ qua) được lưu vĩnh viễn vào hồ sơ học tập của người học; chức năng kiểm tra trình độ đầu vào bị khóa vĩnh viễn. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người học truy cập chức năng "Kiểm tra trình độ đầu vào" từ trang chủ hoặc sau khi đăng ký tài khoản mới.<br>**2.** Hệ thống hiển thị giao diện giới thiệu bài kiểm tra (30 câu hỏi gồm 20 câu A1 và 10 câu A2, thời gian làm bài 25 phút, quy định chỉ được tham gia đúng 1 lần duy nhất) kèm hai tùy chọn: "Bắt đầu làm bài" hoặc "Bỏ qua bài kiểm tra".<br>&nbsp;&nbsp;2a. Người học chọn "Bỏ qua bài kiểm tra" → Hệ thống hiển thị cảnh báo: "Bỏ qua sẽ tính là sử dụng hết lượt kiểm tra trình độ duy nhất và bạn không thể làm lại sau này". Nếu người học xác nhận bỏ qua, hệ thống khóa vĩnh viễn chức năng kiểm tra trình độ, ghi nhận trạng thái chưa qua kiểm tra, xếp người học bắt đầu học cấp độ A1 từ Unit 1 bài 1 và chuyển hướng sang Lộ trình học.<br>**3.** Người học nhấn "Bắt đầu làm bài".<br>**4.** Hệ thống tải bộ đề 30 câu hỏi chuẩn hóa và bắt đầu đếm ngược thời gian 25 phút.<br>**5.** Người học lần lượt trả lời từng câu hỏi (trắc nghiệm, nghe hiểu, điền từ). Mỗi khi người học chọn đáp án, hệ thống lưu nhận câu trả lời lên máy chủ.<br>&nbsp;&nbsp;5a. Người học bị ngắt kết nối mạng → Hệ thống hiển thị cảnh báo "Mất kết nối Internet, vui lòng kiểm tra mạng". Câu trả lời gần nhất đã gửi thành công trước đó được giữ nguyên trên máy chủ. Người học kết nối lại mạng để tiếp tục làm bài.<br>&nbsp;&nbsp;5b. Người học thoát khỏi bài thi dở dang → Hệ thống KHÔNG tính là đã dùng lượt kiểm tra (chức năng chỉ khóa vĩnh viễn khi người học nộp bài, hết giờ làm bài hoặc chủ động bấm Bỏ qua); trạng thái dở dang được lưu tạm, khi người học quay lại sẽ làm bài thi lại từ đầu.<br>**6.** Người học nhấn "Nộp bài" hoặc đồng hồ đếm ngược hết 25 phút.<br>**7.** Hệ thống tự động thu bài, chấm điểm (thang điểm 0–30) và xác định trình độ năng lực theo CEFR:<br>&nbsp;&nbsp;7a. Xác định trình độ theo nguyên tắc cấp cao nhất đạt ≥ 70% số câu [ĐỀ XUẤT – CẦN XÁC NHẬN]:<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu đạt ≥ 7/10 câu A2 (≥ 70% số câu A2) → Trình độ ước lượng: **A2 trở lên**.<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu chưa đạt A2 nhưng đạt ≥ 14/20 câu A1 (≥ 70% số câu A1) → Trình độ ước lượng: **A1 Đạt chuẩn**.<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu đạt < 14/20 câu A1 (< 70% số câu A1) → Trình độ ước lượng: **Dưới A1**.<br>&nbsp;&nbsp;7b. Xếp lớp và lưu trữ trong bản pilot: Hệ thống lưu kết quả điểm số và trình độ ước lượng vào hồ sơ học viên để đối chiếu với bài Thi lên cấp sau này. Trong phiên bản pilot, mọi kết quả kiểm tra đều bắt đầu học tại cấp độ A1 từ Unit 1 bài 1 (kèm thông báo ghi nhận trình độ ước lượng; khi nội dung cấp A2 được phát hành chính thức trong các phiên bản sau mới kích hoạt xếp thẳng vào A2).<br>&nbsp;&nbsp;7c. Khóa vĩnh viễn chức năng kiểm tra trình độ đầu vào của tài khoản để đảm bảo tính khách quan (không cho phép làm lại).<br>**8.** Người học xem bảng kết quả trình độ và bấm "Vào lộ trình học" để bắt đầu học cấp A1 từ Unit 1 bài 1. |
| **Điều kiện đặc biệt** | • Bài kiểm tra trình độ đầu vào chỉ được tham gia đúng 1 lần duy nhất trong suốt vòng đời tài khoản; người học chọn "Bỏ qua bài kiểm tra", hoàn tất nộp bài hoặc để hết giờ làm bài sẽ bị khóa vĩnh viễn chức năng này (thoát dở dang không tính là dùng lượt).<br>• Bộ đề gồm 30 câu hỏi với cơ cấu [ĐỀ XUẤT – CẦN XÁC NHẬN]: khoảng 20 câu cấp độ A1 và 10 câu cấp độ A2. Hệ thống áp dụng nguyên tắc chung trong khảo thí ngôn ngữ: câu hỏi được gắn nhãn theo cấp độ CEFR và quy đổi điểm số về mức trình độ theo cấp cao nhất mà người học đạt chuẩn (≥ 70% số câu của cấp đó).<br>• Không hiển thị đáp án đúng/sai chi tiết sau khi nộp bài để bảo mật ngân hàng đề thi. |
| **Yêu cầu phi chức năng** | • Thời gian tải đề thi và tệp âm thanh nghe ≤ 2 giây.<br>• Chấm điểm và hiển thị kết quả ≤ 1 giây sau khi nộp bài.<br>• Toàn bộ logic chấm điểm thực thi tại máy chủ, không gửi trước đáp án về trình duyệt của người dùng. |

---

## 3. Nhắc học qua Email

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Nhắc học qua Email** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Cho phép người học bật/tắt tính năng nhận email nhắc nhở học tập hàng ngày và chọn khung giờ nhận email mong muốn theo quy tắc nhắc nhở của hệ thống. |
| **Mô tả ngắn gọn** | Người học truy cập trang cài đặt để bật hoặc tắt tính năng nhận email nhắc học và chọn khung giờ nhận thư hàng ngày; hệ thống lưu thiết lập và tự động gửi email nhắc nhở vào đúng giờ đã hẹn nếu trong ngày người học chưa hoàn thành bài học nào. |
| **Tiền điều kiện** | Người học đã đăng nhập vào hệ thống; tài khoản có địa chỉ email hợp lệ. |
| **Hậu điều kiện** | Cấu hình bật/tắt và khung giờ nhận email nhắc nhở được lưu vào cơ sở dữ liệu. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người học truy cập trang "Cài đặt học tập".<br>**2.** Hệ thống hiển thị trạng thái nhắc nhở hiện tại và quy tắc hệ thống: "Mỗi ngày cần hoàn thành ít nhất 1 bài học để duy trì chuỗi ngày học liên tục (Streak)".<br>**3.** Người học bật tùy chọn "Nhận email nhắc học hàng ngày" và chọn khung giờ nhắc nhở mong muốn (ví dụ: 20:00).<br>&nbsp;&nbsp;3a. Người học chọn tắt tùy chọn "Nhận email nhắc học hàng ngày" → Hệ thống hủy lịch gửi email nhắc học.<br>**4.** Người học nhấn "Lưu thay đổi".<br>**5.** Hệ thống kiểm tra kết nối mạng và lưu thiết lập vào cơ sở dữ liệu:<br>&nbsp;&nbsp;5a. Lỗi kết nối mạng → Báo lỗi "Không thể kết nối máy chủ, vui lòng kiểm tra mạng".<br>&nbsp;&nbsp;5b. Thành công → Thông báo "Đã lưu cài đặt nhắc học thành công". Lịch gửi email nhắc học được cập nhật trong hệ thống. |
| **Điều kiện đặc biệt** | • Quy tắc chặn email tự động: Nếu trong ngày người học đã hoàn thành ít nhất 1 bài học trước khung giờ hẹn (đã đạt mục tiêu duy trì Streak của ngày), hệ thống tự động không gửi email nhắc nhở của ngày đó.<br>• Người học có thể điều chỉnh giờ hoặc tắt nhắc nhở bất kỳ lúc nào. |
| **Yêu cầu phi chức năng** | • Thao tác lưu thiết lập phản hồi ≤ 1 giây.<br>• Email nhắc học được gửi đúng giờ đã cài đặt (sai số ≤ 5 phút theo múi giờ địa phương Asia/Ho_Chi_Minh). |

---

## 4. Khám phá Lộ trình học

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Khám phá Lộ trình học** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Cung cấp sơ đồ cây bài học trực quan theo cấu trúc Cấp độ → Unit → Bài học, thể hiện trạng thái từng bài (Đã hoàn thành, Đang mở, Đang khóa) và điều hướng người học vào bài học phù hợp. |
| **Mô tả ngắn gọn** | Người học mở màn hình lộ trình; hệ thống hiển thị danh sách các Unit của cấp độ hiện tại cùng các bài học tương ứng; người học xem tiến trình tổng quan và bấm chọn một bài học đang mở khóa để bắt đầu học. |
| **Tiền điều kiện** | Người học đã đăng nhập; dữ liệu lộ trình học tập đã được xuất bản trên hệ thống. |
| **Hậu điều kiện** | Người học được chuyển hướng thành công đến bài học hoặc bài thi đã chọn. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người học chọn mục "Lộ trình học" trên thanh điều hướng.<br>**2.** Hệ thống tải thông tin lộ trình dựa theo tiến độ cá nhân của người học:<br>&nbsp;&nbsp;2a. Lỗi kết nối mạng → Thông báo "Không thể tải lộ trình, vui lòng kiểm tra kết nối mạng" kèm nút "Thử lại".<br>&nbsp;&nbsp;2b. Lộ trình chưa có bài học được xuất bản → Thông báo "Nội dung bài học đang được cập nhật".<br>**3.** Hệ thống hiển thị bản đồ lộ trình gồm các Unit của cấp độ hiện tại: Tên Unit, danh sách bài học, trạng thái từng bài (Đã hoàn thành / Đang mở / Đang khóa).<br>**4.** Người học nhấn chọn một bài học đang mở khóa (hoặc bài học đã hoàn thành muốn học lại).<br>**5.** Hệ thống hiển thị bảng thông tin tóm tắt bài học: Tên bài, kỹ năng trọng tâm, thời lượng ước tính, điểm số cao nhất đã đạt.<br>**6.** Người học nhấn "Vào học".<br>**7.** Hệ thống điều hướng người học sang giao diện học bài và làm bài tập. |
| **Điều kiện đặc biệt** | • Trạng thái bài học trên lộ trình chỉ bao gồm 3 trạng thái rõ ràng: Đã hoàn thành, Đang mở, Đang khóa.<br>• Bài học bị khóa (chưa hoàn thành bài học tiên quyết) hiển thị biểu tượng khóa, không thể bấm vào học.<br>• Bài thi lên cấp chỉ mở khóa ở cuối lộ trình khi toàn bộ bài học trong tất cả các Unit của cấp độ hiện tại đều đã ở trạng thái Đã hoàn thành. |
| **Yêu cầu phi chức năng** | • Thời gian tải toàn bộ dữ liệu lộ trình ≤ 1.5 giây.<br>• Tự động cuộn màn hình đến vị trí bài học đang học gần nhất của người học khi mở trang. |

---

## 5. Thi lên cấp

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Thi lên cấp** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Đánh giá tổng hợp kiến thức toàn bộ cấp độ A1; công nhận hoàn thành cấp độ A1 khi đạt từ 80% điểm trở lên và chuyển người học lên học từ bài 1 của cấp độ A2. |
| **Mô tả ngắn gọn** | Khi tất cả bài học trong toàn bộ các Unit của cấp độ A1 đều đã hoàn thành, người học tham gia bài thi lên cấp; làm bài trong thời gian quy định; hệ thống chấm điểm tự động. Nếu đạt từ 80% trở lên, hệ thống công nhận hoàn thành cấp độ A1 và mở khóa cấp độ A2 để học từ Unit 1 bài 1; nếu dưới 80%, người học được hiển thị các chủ điểm sai và được quyền thi lại ngay mà không phải chờ đợi. |
| **Tiền điều kiện** | • Người học đã đăng nhập; 100% bài học của cấp độ hiện tại đã ở trạng thái Đã hoàn thành.<br>• Đề thi lên cấp đã được xuất bản sẵn sàng.<br>• Thiết bị có kết nối mạng Internet liên tục. |
| **Hậu điều kiện** | Kết quả bài thi được lưu; hồ sơ học viên được cập nhật trạng thái "Hoàn thành cấp độ A1" (nếu đạt) và mở khóa cấp độ A2 từ bài đầu tiên. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người học chọn mốc "Thi lên cấp" ở cuối lộ trình A1.<br>**2.** Hệ thống kiểm tra điều kiện tham gia:<br>&nbsp;&nbsp;2a. Còn bài học bắt buộc chưa hoàn thành trong cấp độ → Thông báo "Bạn cần hoàn thành tất cả các bài học trong cấp độ hiện tại trước khi tham gia thi lên cấp".<br>&nbsp;&nbsp;2b. Đủ điều kiện → Hiển thị thể lệ bài thi (số câu hỏi, thời gian làm bài, điểm sàn đạt yêu cầu: 80%).<br>**3.** Người học nhấn "Bắt đầu làm bài thi".<br>**4.** Hệ thống tải bộ đề thi lên cấp và bắt đầu đếm ngược thời gian.<br>**5.** Người học làm bài và gửi từng câu trả lời lên máy chủ:<br>&nbsp;&nbsp;5a. Mất kết nối mạng → Báo lỗi mạng rõ ràng. Các câu trả lời đã gửi thành công trước đó được lưu giữ trên máy chủ. Người học kết nối lại mạng để tiếp tục làm bài.<br>**6.** Người học nhấn "Nộp bài" hoặc hết thời gian quy định.<br>**7.** Hệ thống tự động chấm điểm và đánh giá:<br>&nbsp;&nbsp;7a. Điểm đạt ≥ 80% → Thông báo "Chúc mừng bạn đã hoàn thành cấp độ A1!", ghi nhận trạng thái hoàn thành vào hồ sơ, kích hoạt quyền tiếp cận cấp độ A2 bắt đầu từ Unit 1 bài 1 (nếu nội dung A2 đang biên soạn thì hiển thị: "Nội dung cấp độ A2 đang được biên soạn, vui lòng quay lại sau").<br>&nbsp;&nbsp;7b. Điểm đạt < 80% → Thông báo "Chưa đạt yêu cầu (cần tối thiểu 80%)", liệt kê danh sách các chủ điểm cần ôn tập lại kèm nút "Thi lại ngay" để người học thử sức lại bất kỳ lúc nào. |
| **Điều kiện đặc biệt** | • Tiền điều kiện bắt buộc: Hoàn thành 100% tất cả các bài học trong cấp độ hiện tại.<br>• Giới hạn và thi lại: Hệ thống không giới hạn số lần thi lại; người học thi chưa đạt được phép thi lại ngay bất kỳ lúc nào mà không bị giới hạn số lượt và không áp dụng thời gian chờ đợi giữa các lần thi.<br>• Yêu cầu kết nối mạng liên tục; không hỗ trợ làm bài thi ngoại tuyến. |
| **Yêu cầu phi chức năng** | • Đồng hồ đếm ngược đồng bộ chính xác với máy chủ.<br>• Kết quả chấm thi và cập nhật trạng thái lưu trữ an toàn bằng giao dịch cơ sở dữ liệu. |

---

## 6. Học bài và Làm bài tập tương tác

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Học bài và Làm bài tập tương tác** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Cho phép người học tiếp thu kiến thức lý thuyết và thực hành 5 dạng bài tập tương tác với cơ chế chấm điểm tức thì, giải thích đáp án và công nhận hoàn thành bài học khi người học đã trả lời hết toàn bộ các câu hỏi trong bài. |
| **Mô tả ngắn gọn** | Người học xem phần học kiến thức (từ vựng, phát âm, ngữ pháp), sau đó lần lượt trả lời các câu hỏi bài tập thuộc 5 dạng (Trắc nghiệm, Điền từ, Nghe chọn đáp án, Sắp xếp lại câu, Ngữ pháp). Bài học được tính là hoàn thành ngay khi người học trả lời hết tất cả các câu hỏi trong bài (không bắt buộc tỷ lệ đúng). Người học có thể làm lại bài tùy ý không giới hạn để nâng cao kết quả. |
| **Tiền điều kiện** | Người học đã đăng nhập; bài học ở trạng thái mở khóa; thiết bị có kết nối mạng Internet. |
| **Hậu điều kiện** | Trạng thái hoàn thành bài học và kết quả làm bài được ghi nhận vào bảng tiến độ học tập. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người học mở một bài học từ Lộ trình.<br>**2.** Hệ thống tải nội dung lý thuyết và danh sách câu hỏi bài tập.<br>**3.** Người học xem nội dung lý thuyết (từ vựng trọng tâm, phiên âm, câu mẫu, tệp âm thanh chuẩn, tóm tắt ngữ pháp).<br>**4.** Người học nhấn "Bắt đầu làm bài tập".<br>**5.** Hệ thống hiển thị lần lượt từng câu hỏi tương tác thuộc 5 dạng bài tập.<br>**6.** Người học thao tác trả lời và bấm "Kiểm tra".<br>**7.** Hệ thống gửi câu trả lời về máy chủ để chấm điểm và trả về phản hồi:<br>&nbsp;&nbsp;7a. Mất kết nối mạng → Hiển thị thông báo "Mất kết nối Internet, vui lòng thử lại sau khi có mạng".<br>&nbsp;&nbsp;7b. Trả lời đúng → Hiển thị thông báo chính xác kèm âm thanh phản hồi tích cực.<br>&nbsp;&nbsp;7c. Trả lời sai → Hiển thị đáp án đúng kèm lời giải thích ngữ pháp chi tiết; ghi nhận câu sai vào thống kê bài học.<br>**8.** Người học bấm "Tiếp tục" để sang câu hỏi kế tiếp.<br>&nbsp;&nbsp;8a. Người học thoát bài học giữa chừng → Hệ thống KHÔNG lưu các câu đã làm dở dang; bài học chưa được tính hoàn thành; khi người học quay lại bài học, hệ thống bắt đầu lại từ câu hỏi đầu tiên.<br>**9.** Khi người học trả lời hết toàn bộ các câu hỏi trong bài học → Hệ thống hiển thị màn hình tổng kết (số câu đúng/sai, độ chính xác), cập nhật trạng thái bài học thành "Đã hoàn thành", ghi nhận ngày học để duy trì Streak và mở khóa bài học kế tiếp trên lộ trình.<br>**10.** Người học có thể bấm chọn "Làm lại bài học" để ôn luyện (cho phép làm lại bài tùy ý không giới hạn số lần, không trừ điểm). |
| **Điều kiện đặc biệt** | • Tiêu chí hoàn thành bài học: Bài học được tính là hoàn thành khi người học đã trả lời hết toàn bộ các câu hỏi trong bài (không yêu cầu ngưỡng tỷ lệ đúng tối thiểu).<br>• 5 dạng bài tập tương tác bao gồm: Trắc nghiệm (MCQ), Điền từ (Fill-in-blank), Sắp xếp lại câu (Reorder), Nghe chọn đáp án (Listening), Ngữ pháp (Grammar).<br>• Đáp án đúng được bảo mật trên máy chủ, không gửi kèm trước trong dữ liệu bài tập về trình duyệt. |
| **Yêu cầu phi chức năng** | • Thời gian kiểm tra đáp án từng câu ≤ 300ms.<br>• Âm thanh phát âm mẫu phát mượt mà, không bị gián đoạn. |

---

## 7. Học từ vựng Flashcard và Ôn tập

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Học từ vựng Flashcard và Ôn tập** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Giúp người học ghi nhớ từ vựng dài hạn thông qua thẻ ghi nhớ hai mặt và cơ chế lặp lại ngắt quãng theo chu kỳ ngày cố định (SRS Policy B). |
| **Mô tả ngắn gọn** | Người học chọn học từ mới theo bài học hoặc ôn tập các từ đến hạn trong ngày; lật xem hai mặt thẻ (từ vựng, phiên âm IPA, audio, nghĩa tiếng Việt, câu ví dụ); tự đánh giá bằng hai lựa chọn "Chưa nhớ" hoặc "Đã nhớ"; hệ thống tự động tính ngày ôn tập tiếp theo theo chu kỳ ngày cố định [1, 3, 7, 14, 30]. |
| **Tiền điều kiện** | Người học đã đăng nhập; có từ vựng trong các bài học đã học hoặc có từ vựng đến hạn ôn tập trong ngày. |
| **Hậu điều kiện** | Trạng thái ghi nhớ và ngày ôn tập tiếp theo của từng từ vựng được cập nhật vào cơ sở dữ liệu. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người học vào mục "Từ vựng & Flashcard", chọn học theo bài học hoặc chọn "Ôn tập từ vựng hôm nay".<br>**2.** Hệ thống tải danh sách các thẻ từ vựng cần học hoặc đến hạn ôn tập.<br>&nbsp;&nbsp;2a. Không có từ nào đến hạn ôn tập → Hiển thị thông báo "Bạn đã hoàn thành toàn bộ từ vựng cần ôn hôm nay!".<br>**3.** Hệ thống hiển thị mặt trước của thẻ (Từ tiếng Anh, loại từ, phát âm âm thanh).<br>**4.** Người học nghe phát âm, sau đó nhấn "Lật thẻ".<br>**5.** Hệ thống lật sang mặt sau, hiển thị phiên âm IPA, nghĩa tiếng Việt và câu ví dụ minh họa kèm đúng 2 nút đánh giá: "Chưa nhớ" và "Đã nhớ".<br>**6.** Người học chọn mức đánh giá phù hợp.<br>**7.** Hệ thống cập nhật chu kỳ ôn tập tiếp theo theo chính sách SRS Policy B:<br>&nbsp;&nbsp;7a. Người học chọn "Chưa nhớ" → Đặt lại về Mốc 1 (ôn lại sau 1 ngày) và đưa thẻ vào cuối phiên học hôm nay để người học xem lại ngay.<br>&nbsp;&nbsp;7b. Người học chọn "Đã nhớ" → Nâng bậc chu kỳ tiếp theo trong dãy cố định [1 ngày → 3 ngày → 7 ngày → 14 ngày → 30 ngày].<br>**8.** Hệ thống chuyển sang thẻ tiếp theo cho đến khi hoàn thành phiên.<br>**9.** Hệ thống hiển thị màn hình chúc mừng và tổng kết số lượng từ đã ôn tập trong phiên. |
| **Điều kiện đặc biệt** | • Thuật toán lặp lại ngắt quãng áp dụng chính sách cố định SRS Policy B với các chu kỳ: 1, 3, 7, 14, 30 ngày.<br>• Giao diện tối giản chỉ gồm 2 nút đánh giá: "Chưa nhớ" (reset về 1 ngày) và "Đã nhớ" (tiến lên mốc tiếp theo).<br>• Yêu cầu có kết nối mạng để đồng bộ lịch ôn tập về máy chủ. |
| **Yêu cầu phi chức năng** | • Hiệu ứng lật thẻ mượt mà, phản hồi ngay lập tức.<br>• Tệp âm thanh phát âm được tải trước để phát ngay khi bấm nghe. |

---

## 8. Theo dõi Tiến độ và Chuỗi ngày học

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Theo dõi Tiến độ và Chuỗi ngày học** |
| **Tác nhân chính** | Người học |
| **Mục tiêu** | Hiển thị chuỗi ngày học liên tục (Streak), trạng thái hoàn thành bài học hôm nay, số từ vựng đã nắm vững và mức độ hoàn thành lộ trình nhằm khích lệ tính chuyên cần của người học. |
| **Mô tả ngắn gọn** | Người học truy cập trang tổng quan cá nhân để xem chỉ số ngày học liên tục (Streak), lịch học trong tuần/tháng, số bài học thực tế đã hoàn thành và tỷ lệ tiến độ trên lộ trình cấp độ hiện tại. |
| **Tiền điều kiện** | Người học đã đăng nhập vào hệ thống. |
| **Hậu điều kiện** | Dữ liệu thống kê tiến độ mới nhất được hiển thị trên giao diện người dùng. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Người học chọn mục "Tổng quan tiến độ" trên trang cá nhân hoặc bảng điều khiển chính.<br>**2.** Hệ thống truy vấn dữ liệu học tập của người học từ cơ sở dữ liệu.<br>&nbsp;&nbsp;2a. Lỗi kết nối mạng → Báo lỗi không tải được dữ liệu kèm nút "Thử lại".<br>**3.** Hệ thống hiển thị các thông tin thống kê chính:<br>&nbsp;&nbsp;• Chỉ số Chuỗi ngày học liên tục (Streak): Số ngày học liên tiếp mà người học hoàn thành ít nhất 1 bài học/ngày (tính theo múi giờ địa phương Asia/Ho_Chi_Minh).<br>&nbsp;&nbsp;• Trạng thái ngày hôm nay: Đã học (đã hoàn thành ít nhất 1 bài học hôm nay, duy trì chuỗi) hoặc Chưa học (nhắc nhở hoàn thành bài học để không đứt chuỗi).<br>&nbsp;&nbsp;• Tiến độ lộ trình: Tỷ lệ phần trăm hoàn thành cấp độ A1 tính theo số bài học thực tế đã hoàn thành (ví dụ: hoàn thành 12/24 bài đạt tiến độ 50%).<br>&nbsp;&nbsp;• Thống kê từ vựng: Tổng số từ vựng đã học và số từ đã nắm vững theo chu kỳ SRS.<br>**4.** Người học xem chi tiết lịch sử học tập các ngày trong tuần/tháng.<br>**5.** Người học bấm "Tiếp tục bài học gần nhất" để quay trở lại việc học. |
| **Điều kiện đặc biệt** | • Chuỗi ngày học (Streak) được tính theo múi giờ địa phương (Asia/Ho_Chi_Minh) dựa trên việc hoàn thành ít nhất 1 bài học trong ngày theo định nghĩa hoàn thành ở UC-06. Nếu người học không hoàn thành bài học nào trong một ngày lịch, chuỗi Streak sẽ bị đặt lại về 0 vào ngày tiếp theo.<br>• Tỷ lệ tiến độ lộ trình chỉ tính toán dựa trên các bài học thực tế mà người học đã hoàn thành.<br>• Không áp dụng cơ chế đóng băng chuỗi (Streak Freeze) hay tích lũy điểm kinh nghiệm ngoài phạm vi MVP. |
| **Yêu cầu phi chức năng** | • Thời gian tải trang thống kê tiến độ ≤ 1.5 giây.<br>• Số liệu tiến độ và streak được đồng bộ nhất quán giữa máy chủ và giao diện. |

---

## 9. Lập đề cương, ma trận đề thi và Phân công

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Lập đề cương, ma trận đề thi và Phân công** |
| **Tác nhân chính** | Quản trị viên (Admin) |
| **Mục tiêu** | Cho phép Quản trị viên xây dựng cấu trúc chương trình học (Cấp độ, Unit, Bài học), thiết lập chỉ tiêu số lượng nội dung cho từng bài (số câu hỏi tối thiểu, số từ vựng tối thiểu), cấu hình ma trận đề thi và phân công nhiệm vụ biên soạn cho Giáo viên. |
| **Mô tả ngắn gọn** | Quản trị viên tạo mới hoặc chỉnh sửa cấu trúc đề cương theo cây phân cấp; thiết lập các chỉ tiêu nội dung cho từng bài học; định nghĩa ma trận đề thi (số câu hỏi, thời gian, phân bổ độ khó theo CEFR cho bài xếp lớp hoặc điểm sàn đạt yêu cầu cho bài thi lên cấp); sau đó chỉ định Giáo viên chịu trách nhiệm biên soạn nội dung cụ thể. |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập hệ thống với quyền Admin; danh sách tài khoản Giáo viên đã sẵn sàng trong hệ thống. |
| **Hậu điều kiện** | Cấu trúc đề cương, ma trận đề thi và các bản ghi phân công nhiệm vụ được lưu vào cơ sở dữ liệu; nhiệm vụ xuất hiện trong danh sách công việc của Giáo viên được chỉ định. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Quản trị viên truy cập mục "Đề cương & Phân công".<br>**2.** Hệ thống hiển thị cấu trúc chương trình học hiện tại theo từng cấp độ.<br>**3.** Quản trị viên thao tác quản lý đề cương:<br>&nbsp;&nbsp;• Thêm hoặc chỉnh sửa Unit: Nhập Tên Unit, Mô tả, và trường bắt buộc "Số bài bắt buộc của Unit" (làm chuẩn định mức đóng gói cho UC-12).<br>&nbsp;&nbsp;• Thêm Bài học vào Unit: Nhập Tên bài học, Mô tả, Mục tiêu kiến thức, Dạng bài yêu cầu, cùng hai chỉ tiêu bắt buộc: "Số câu hỏi tối thiểu" và "Số từ vựng tối thiểu".<br>&nbsp;&nbsp;• Thiết lập ma trận đề thi: Dùng chung cấu trúc biểu mẫu ma trận chuẩn hóa nhưng cấu hình bộ tham số riêng cho từng loại bài thi:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Bài Kiểm tra trình độ đầu vào: Cấu hình 30 câu hỏi, thời gian 25 phút, phân bổ tỷ lệ các câu theo mức độ CEFR (khoảng 20 câu A1, 10 câu A2), cấu hình quy tắc xác định trình độ theo cấp cao nhất đạt ≥ 70% số câu.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Bài Thi lên cấp: Cấu hình số câu hỏi, thời gian quy định, phân bổ các dạng bài tập và điểm sàn đạt yêu cầu (80%).<br>**4.** Quản trị viên chọn bài học/bộ đề thi cần phân công, chọn Giáo viên phụ trách từ danh sách và nhấn "Giao nhiệm vụ".<br>**5.** Hệ thống kiểm tra và lưu dữ liệu:<br>&nbsp;&nbsp;5a. Thiếu trường thông tin bắt buộc hoặc chỉ tiêu tối thiểu ≤ 0 → Báo lỗi trường cần nhập.<br>&nbsp;&nbsp;5b. Trùng tên bài học trong cùng một Unit → Cảnh báo trùng lặp.<br>&nbsp;&nbsp;5c. Hợp lệ → Lưu cấu trúc đề cương và tạo bản ghi phân công với trạng thái "Đã phân công" (ASSIGNED). Nhiệm vụ xuất hiện trong trang danh sách công việc của Giáo viên được giao. |
| **Điều kiện đặc biệt** | • Quy tắc đóng gói Unit: Trường "Số bài bắt buộc của Unit" là chuẩn kiểm định bắt buộc để UC-12 đối chiếu khi xuất bản toàn bộ Unit (Unit phải đạt đủ số bài học quy định và toàn bộ các bài đều ở trạng thái APPROVED thì mới được phép xuất bản cả Unit).<br>• Hai chỉ tiêu "Số câu hỏi tối thiểu" và "Số từ vựng tối thiểu" là căn cứ kỹ thuật bắt buộc để hệ thống kiểm tra tính hợp lệ khi Giáo viên nộp bài ở UC-11.<br>• Giao diện quản lý cấu trúc hiển thị dạng bảng phân cấp rõ ràng. |
| **Yêu cầu phi chức năng** | • Thao tác lưu đề cương và phân công phản hồi ≤ 1.5 giây.<br>• Đảm bảo tính toàn vẹn dữ liệu quan hệ giữa Cấp độ, Unit, Bài học và Ma trận đề thi. |

---

## 10. Soạn bài học và Câu hỏi đề thi theo phân công

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Soạn bài học và Câu hỏi đề thi theo phân công** |
| **Tác nhân chính** | Giáo viên, Quản trị viên (Admin - trường hợp tự biên soạn) |
| **Mục tiêu** | Cho phép tác giả nhập liệu nội dung lý thuyết bài học, tải lên tệp âm thanh và hình ảnh minh họa, soạn thảo bộ từ vựng flashcard và tạo các câu hỏi bài tập/đề thi theo đúng đề cương đã được phân công hoặc chọn biên soạn. |
| **Mô tả ngắn gọn** | Giáo viên mở nhiệm vụ biên soạn được giao (hoặc Quản trị viên chủ động chọn bài trong đề cương để tự biên soạn); nhập nội dung lý thuyết bài giảng; tạo bộ từ vựng flashcard (từ, phiên âm IPA, audio, nghĩa tiếng Việt, ví dụ); thêm các câu hỏi thuộc 5 dạng bài tập chuẩn; lưu lại dưới dạng Bản nháp (DRAFT) trên máy chủ để tiếp tục hoàn thiện. |
| **Tiền điều kiện** | • Tác nhân đã đăng nhập vào hệ thống.<br>• Có nhiệm vụ biên soạn được phân công (đối với Giáo viên) hoặc quyền quản trị nội dung (đối với Admin).<br>• Thiết bị có kết nối mạng Internet liên tục. |
| **Hậu điều kiện** | Nội dung bài học, bộ từ vựng flashcard và câu hỏi được lưu trong cơ sở dữ liệu dưới trạng thái "Bản nháp" (DRAFT), chưa hiển thị cho người học. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Tác nhân truy cập mục biên soạn nội dung:<br>&nbsp;&nbsp;• Nếu là Giáo viên: Vào mục "Nhiệm vụ biên soạn của tôi" và chọn bài học được giao.<br>&nbsp;&nbsp;• Nếu là Quản trị viên tự biên soạn: Vào cây đề cương, chọn một bài học chưa có người soạn và chọn "Tự biên soạn bài này".<br>**2.** Hệ thống mở giao diện biên soạn nội dung tương ứng.<br>**3.** Tác nhân nhập liệu các thành phần của bài học:<br>&nbsp;&nbsp;• Phần lý thuyết: Nhập văn bản giải thích kiến thức ngữ pháp, ngữ cảnh sử dụng.<br>&nbsp;&nbsp;• Phần bộ từ vựng Flashcard: Thêm từng thẻ từ vựng gồm Từ tiếng Anh, loại từ, phiên âm IPA, tệp âm thanh phát âm, nghĩa tiếng Việt và câu ví dụ minh họa.<br>&nbsp;&nbsp;• Phần câu hỏi bài tập / đề thi: Chọn dạng câu hỏi trong 5 dạng chuẩn (Trắc nghiệm, Điền từ, Nghe chọn đáp án, Sắp xếp lại câu, Ngữ pháp), nhập nội dung câu hỏi, các phương án lựa chọn, chọn đáp án đúng và nhập lời giải thích chi tiết; đối với câu hỏi thuộc bộ đề kiểm tra trình độ đầu vào, tác nhân bắt buộc phải gắn nhãn cấp độ CEFR (A1 hoặc A2) cho từng câu hỏi.<br>&nbsp;&nbsp;• Tải lên tệp âm thanh (.mp3) và tệp hình ảnh (.png, .jpg) minh họa.<br>**4.** Hệ thống kiểm tra tệp tải lên và tính hợp lệ dữ liệu:<br>&nbsp;&nbsp;4a. Tệp vượt quá dung lượng quy định hoặc sai định dạng → Báo lỗi tệp không hợp lệ.<br>&nbsp;&nbsp;4b. Mất kết nối mạng khi đang lưu → Thông báo "Mất kết nối Internet, không thể lưu dữ liệu". Tác nhân kiểm tra lại mạng để bấm lưu lại.<br>**5.** Tác nhân nhấn "Lưu bản nháp".<br>**6.** Hệ thống kiểm tra tính toàn vẹn tối thiểu và lưu dữ liệu vào cơ sở dữ liệu dưới trạng thái DRAFT:<br>&nbsp;&nbsp;6a. Đối với Giáo viên: Bài học hiển thị trong danh sách bản nháp của Giáo viên để chuẩn bị cho bước Nộp bài (UC-11).<br>&nbsp;&nbsp;6b. Đối với Quản trị viên tự soạn: Bài học tự động xuất hiện ở mục "Bài tự soạn" của giao diện Thẩm định & Xuất bản (UC-12) để Admin tiến hành tự xuất bản trực tiếp kèm lý do bắt buộc. |
| **Điều kiện đặc biệt** | • Bộ từ vựng flashcard là thành phần bắt buộc của mỗi bài học nhằm cung cấp dữ liệu cho chức năng Học từ vựng Flashcard & Ôn tập.<br>• Mỗi câu hỏi bài tập bắt buộc phải có ít nhất một đáp án đúng và phần giải thích đáp án.<br>• Bản nháp do Admin tự soạn không cần gửi qua hàng đợi duyệt thông thường mà đi thẳng vào mục "Bài tự soạn" ở UC-12. |
| **Yêu cầu phi chức năng** | • Thời gian tải lên tệp âm thanh và lưu bản nháp ≤ 3 giây.<br>• Giao diện biên soạn rõ ràng, hiển thị trực quan danh sách câu hỏi và từ vựng đã thêm. |

---

## 11. Nộp bài và Nộp lại sau chỉnh sửa

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Nộp bài và Nộp lại sau chỉnh sửa** |
| **Tác nhân chính** | Giáo viên |
| **Mục tiêu** | Cho phép Giáo viên gửi bài học đã hoàn thiện vào hàng đợi thẩm định của Quản trị viên, hoặc xem các ý kiến yêu cầu chỉnh sửa từ Quản trị viên để hoàn thiện và nộp lại. |
| **Mô tả ngắn gọn** | Sau khi hoàn thành bản nháp hoặc sau khi chỉnh sửa theo phản hồi của Admin (kể cả trường hợp chỉnh sửa bài học sau khi Admin tạo bản nháp chỉnh sửa Clone-to-Draft), Giáo viên rà soát lại toàn bộ nội dung, nhập ghi chú tóm tắt và nhấn nộp bài; hệ thống kiểm tra các chỉ tiêu số lượng tối thiểu, chuyển trạng thái bài học sang "Chờ duyệt" (IN_REVIEW) và tạm khóa quyền chỉnh sửa của Giáo viên. |
| **Tiền điều kiện** | Giáo viên đã đăng nhập; bài học đang ở trạng thái "Bản nháp" (DRAFT) hoặc "Yêu cầu chỉnh sửa" (CHANGES_REQUESTED). |
| **Hậu điều kiện** | Trạng thái bài học chuyển thành "Chờ duyệt" (IN_REVIEW); bài học xuất hiện trong hàng đợi thẩm định của Admin; Giáo viên tạm thời không thể chỉnh sửa nội dung bài học này. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Giáo viên mở bài học cần nộp trong danh sách biên soạn.<br>&nbsp;&nbsp;1a. Nếu bài học ở trạng thái CHANGES_REQUESTED → Hệ thống hiển thị rõ ràng danh sách các điểm yêu cầu chỉnh sửa của Admin để Giáo viên đối chiếu và chỉnh sửa trước khi nộp.<br>**2.** Giáo viên kiểm tra lại toàn bộ nội dung và nhấn "Nộp phê duyệt".<br>**3.** Hệ thống kiểm tra các điều kiện nộp bài dựa trên chỉ tiêu đề cương và ma trận đề thi đã thiết lập ở UC-09:<br>&nbsp;&nbsp;3a. Đối với bài học thông thường: Kiểm tra số lượng câu hỏi và từ vựng:<br>&nbsp;&nbsp;&nbsp;&nbsp;• Số lượng câu hỏi bài tập nhỏ hơn "Số câu hỏi tối thiểu" đã quy định trong đề cương → Báo lỗi: "Bài học chưa đủ số lượng câu hỏi tối thiểu (yêu cầu tối thiểu [X] câu)".<br>&nbsp;&nbsp;&nbsp;&nbsp;• Số lượng từ vựng flashcard nhỏ hơn "Số từ vựng tối thiểu" đã quy định trong đề cương → Báo lỗi: "Bài học chưa đủ số lượng từ vựng flashcard tối thiểu (yêu cầu tối thiểu [Y] từ)".<br>&nbsp;&nbsp;3b. Đối với bộ đề thi (đề kiểm tra trình độ đầu vào hoặc đề thi lên cấp): Hệ thống kiểm tra cấu trúc câu hỏi theo đúng ma trận đề thi quy định ở UC-09 (ví dụ đối với đề kiểm tra trình độ đầu vào phải đủ 30 câu hỏi gồm đúng 20 câu gắn nhãn A1 và 10 câu gắn nhãn A2; đối với đề thi lên cấp phải đủ cơ cấu số câu và các dạng bài quy định) thay cho kiểm tra số câu tối thiểu của bài học đơn lẻ → Nếu không khớp cấu trúc ma trận đề thi → Báo lỗi không đúng chuẩn ma trận đề thi.<br>&nbsp;&nbsp;3c. Có câu hỏi chưa chọn đáp án đúng hoặc thiếu phần giải thích → Báo lỗi chi tiết vị trí câu hỏi chưa hoàn thiện.<br>&nbsp;&nbsp;3d. Đủ điều kiện → Hiển thị hộp thoại xác nhận nộp bài kèm ô nhập ghi chú gửi Quản trị viên.<br>**4.** Giáo viên nhập ghi chú nộp bài và nhấn "Xác nhận nộp".<br>**5.** Hệ thống cập nhật trạng thái bài học thành IN_REVIEW trong cơ sở dữ liệu, khóa quyền chỉnh sửa của Giáo viên đối với bài này và hiển thị thông báo "Nộp bài thành công! Bài học đã được chuyển vào hàng đợi thẩm định". |
| **Điều kiện đặc biệt** | • Hệ thống kiểm tra tự động các chỉ tiêu bắt buộc: với bài học thông thường kiểm tra "Số câu hỏi tối thiểu" và "Số từ vựng tối thiểu"; với bộ đề thi kiểm tra đối chiếu khớp chuẩn ma trận đề thi từ UC-09 trước khi cho phép gửi duyệt.<br>• Khi bài học ở trạng thái IN_REVIEW, Giáo viên chỉ có quyền xem, không thể thay đổi nội dung cho đến khi Admin có phản hồi.<br>• Lịch sử các lần yêu cầu chỉnh sửa và ghi chú nộp bài được lưu vết đầy đủ trong hệ thống. |
| **Yêu cầu phi chức năng** | • Xử lý cập nhật trạng thái an toàn, kiểm soát quyền truy cập chặt chẽ tại máy chủ.<br>• Thao tác nộp bài phản hồi ≤ 1.5 giây. |

---

## 12. Thẩm định và Xuất bản nội dung

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Thẩm định và Xuất bản nội dung** |
| **Tác nhân chính** | Quản trị viên (Admin) |
| **Mục tiêu** | Kiểm soát chất lượng nội dung bài học và đề thi trước khi công khai cho người học; thực hiện phê duyệt xuất bản bài học đơn lẻ hoặc xuất bản cả Unit khi đủ số bài; yêu cầu chỉnh sửa (CHANGES_REQUESTED); hoặc tạo bản nháp chỉnh sửa đối với bài học đã xuất bản có sai sót (cơ chế Clone-to-Draft). |
| **Mô tả ngắn gọn** | Quản trị viên mở hàng đợi thẩm định; xem trước bài học ở chế độ mô phỏng góc nhìn người học; quyết định phê duyệt xuất bản để bài học hiển thị trên lộ trình, hoặc từ chối kèm lý do chi tiết gửi lại Giáo viên. Đối với bài học đã xuất bản có sai sót, Quản trị viên tạo bản nháp chỉnh sửa giao lại cho tác giả gốc hoàn thiện. Quản trị viên cũng có thể tự xuất bản trực tiếp các bài do mình tự soạn. |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập hệ thống với quyền Admin; có bài học ở trạng thái IN_REVIEW, bài tự soạn ở trạng thái DRAFT, hoặc bài học đã xuất bản (PUBLISHED) cần xử lý. |
| **Hậu điều kiện** | • Phê duyệt: Trạng thái đổi thành APPROVED (nếu Unit chứa bài chưa xuất bản) hoặc PUBLISHED (nếu Unit đã xuất bản từ trước), bài học được ghi nhận hợp lệ.<br>• Xuất bản Unit: Toàn bộ các bài học trong Unit chuyển từ APPROVED sang PUBLISHED, Unit chính thức xuất hiện trên Lộ trình học.<br>• Yêu cầu sửa: Trạng thái đổi thành CHANGES_REQUESTED kèm lý do gửi Giáo viên.<br>• Chỉnh sửa bài đã xuất bản: Tạo bản nháp mới (DRAFT) giao cho tác giả gốc; bản cũ vẫn tạm thời duy trì để Unit không bị thiếu bài cho đến khi bản mới được duyệt thay thế. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Quản trị viên truy cập mục "Thẩm định nội dung".<br>**2.** Hệ thống hiển thị hai khu vực làm việc: "Hàng đợi chờ duyệt" (các bài học ở trạng thái IN_REVIEW do Giáo viên nộp) và "Bài tự soạn" (các bài do Admin tự biên soạn ở UC-10).<br>**3.** Quản trị viên chọn một bài học và bấm "Xem trước" (Preview) để trải nghiệm giao diện bài học như người học.<br>**4.** Quản trị viên đưa ra quyết định thẩm định:<br>&nbsp;&nbsp;4a. Phê duyệt bài học của Giáo viên: Quản trị viên nhấn "Phê duyệt". Hệ thống kiểm tra trạng thái của Unit chứa bài học:<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu Unit chưa được xuất bản: Bài học chuyển sang trạng thái "Đã duyệt" (APPROVED) để chờ gom đủ điều kiện xuất bản cả Unit; chưa hiển thị công khai cho người học.<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu Unit đã được xuất bản trước đó (trường hợp bài bổ sung hoặc bài sửa lỗi thay thế): Bài học chuyển thẳng sang trạng thái "Đã xuất bản" (PUBLISHED) và kích hoạt hiển thị ngay trên Lộ trình học.<br>&nbsp;&nbsp;4b. Yêu cầu Giáo viên sửa lại: Quản trị viên nhấn "Yêu cầu chỉnh sửa", nhập lý do và chỉ rõ các điểm cần sửa. Hệ thống cập nhật trạng thái thành CHANGES_REQUESTED, chuyển bài về cho Giáo viên phụ trách.<br>&nbsp;&nbsp;4c. Xuất bản trực tiếp bài do Admin tự soạn: Quản trị viên chọn bài trong mục "Bài tự soạn", nhấn "Xuất bản trực tiếp". Hệ thống thực hiện kiểm tra các điều kiện định mức tối thiểu như UC-11 (đủ số câu hỏi tối thiểu, đủ số từ vựng tối thiểu với bài học hoặc đúng chuẩn ma trận đối với bộ đề thi):<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu chưa đạt định mức tối thiểu → Báo lỗi không đủ điều kiện xuất bản và từ chối thực hiện.<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu đạt định mức tối thiểu → Hiển thị biểu mẫu bắt buộc nhập lý do xuất bản trực tiếp; sau khi xác nhận, hệ thống kiểm tra trạng thái Unit:<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ Nếu Unit chưa xuất bản: Bài học chuyển sang trạng thái APPROVED để chờ xuất bản cả Unit.<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ Nếu Unit đã xuất bản: Bài học chuyển sang trạng thái PUBLISHED ngay.<br>&nbsp;&nbsp;&nbsp;&nbsp;Đồng thời hệ thống tự động gắn cờ kiểm toán `DIRECT_PUBLISH_BY_ADMIN` kèm lý do đã nhập vào cơ sở dữ liệu.<br>&nbsp;&nbsp;4d. Xuất bản cả Unit: Khi Quản trị viên chọn thao tác "Xuất bản cả Unit", hệ thống kiểm tra hai điều kiện đóng gói bắt buộc:<br>&nbsp;&nbsp;&nbsp;&nbsp;(1) Số lượng bài học trong Unit phải đạt đủ chỉ tiêu "Số bài bắt buộc của Unit" đã cấu hình ở UC-09.<br>&nbsp;&nbsp;&nbsp;&nbsp;(2) Mọi bài học trong Unit đều phải ở trạng thái APPROVED.<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu thiếu một trong hai điều kiện trên → Hệ thống báo lỗi chi tiết (ví dụ: "Unit chưa đủ số bài bắt buộc" hoặc "Còn bài học chưa đạt trạng thái APPROVED") và chặn xuất bản.<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu thỏa mãn cả hai điều kiện → Hệ thống cập nhật trạng thái của toàn bộ các bài học trong Unit từ APPROVED sang PUBLISHED, chính thức mở Unit trên Lộ trình học.<br>&nbsp;&nbsp;4e. Phát hiện lỗi trên bài đã xuất bản (Cơ chế Clone-to-Draft): Quản trị viên chọn bài học đang ở trạng thái PUBLISHED, chọn "Tạo bản nháp chỉnh sửa" và nhập lý do cần sửa. Hệ thống tạo một bản sao ở trạng thái Bản nháp (DRAFT) và phân công xử lý:<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu tác giả gốc là Admin: Admin tự sửa bản nháp.<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu tác giả gốc là Giáo viên đang hoạt động: Hệ thống giao bản nháp lại cho Giáo viên đó.<br>&nbsp;&nbsp;&nbsp;&nbsp;• Nếu tác giả gốc là Giáo viên đã bị khóa/vô hiệu hóa tài khoản: Hệ thống cho phép Quản trị viên chọn một Giáo viên khác đang hoạt động để phân công sửa hoặc Quản trị viên tự nhận để chỉnh sửa trực tiếp.<br>&nbsp;&nbsp;&nbsp;&nbsp;Trong thời gian chỉnh sửa, bản PUBLISHED hiện tại vẫn tạm thời duy trì để Unit không bị thiếu bài; sau khi bản nháp hoàn thành sửa đổi, bài học phải đi qua quy trình Nộp bài (UC-11) và Thẩm định lại (UC-12); khi bản mới được phê duyệt (do Unit đã xuất bản nên được chuyển thẳng sang PUBLISHED ngay), nó sẽ chính thức thay thế bản cũ, toàn bộ tiến độ của những người học đã hoàn thành bài cũ được bảo lưu trọn vẹn. (Trường hợp tác giả là Admin tự sửa và tự xuất bản bản mới thì vẫn bắt buộc qua kiểm tra định mức, nhập lý do và gắn cờ `DIRECT_PUBLISH_BY_ADMIN`).<br>**5.** Hệ thống thông báo kết quả thao tác thành công và cập nhật lại danh sách hàng đợi. |
| **Điều kiện đặc biệt** | • Quy tắc trạng thái APPROVED: Bài học sau khi thẩm định đạt yêu cầu sẽ ở trạng thái APPROVED nếu Unit chưa xuất bản; chỉ khi cả Unit đủ số bài bắt buộc và 100% bài đạt APPROVED thì thao tác "Xuất bản cả Unit" mới kích hoạt đồng loạt sang PUBLISHED.<br>• Đối với Unit đã xuất bản từ trước, các bài học bổ sung hoặc bài sửa lỗi thay thế sau khi được thẩm định đạt sẽ chuyển thẳng sang PUBLISHED ngay lập tức.<br>• Cơ chế Clone-to-Draft: Đảm bảo bài sửa lỗi luôn có người phụ trách (tác giả gốc, hoặc Giáo viên khác được chỉ định / Admin tự sửa nếu tài khoản tác giả gốc đã bị khóa).<br>• Mọi trường hợp Admin xuất bản trực tiếp bài tự soạn đều phải qua kiểm tra định mức câu hỏi/từ vựng, bắt buộc nhập lý do và được gắn cờ `DIRECT_PUBLISH_BY_ADMIN` trong cơ sở dữ liệu để phục vụ kiểm toán. |
| **Yêu cầu phi chức năng** | • Giao diện xem trước phản ánh chính xác cấu trúc bài học thực tế.<br>• Thời gian thực thi chuyển đổi trạng thái và cập nhật lộ trình ≤ 1.5 giây. |

---

## 13. Quản lý Người dùng và Tài khoản Giáo viên

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Quản lý Người dùng và Tài khoản Giáo viên** |
| **Tác nhân chính** | Quản trị viên (Admin) |
| **Mục tiêu** | Cho phép Quản trị viên quản lý danh sách tài khoản toàn hệ thống, tạo tài khoản chuyên môn mới cho Giáo viên kèm gửi liên kết kích hoạt qua email, và vô hiệu hóa các tài khoản vi phạm. |
| **Mô tả ngắn gọn** | Quản trị viên tra cứu danh sách người dùng; khởi tạo tài khoản mới cho Giáo viên kèm gửi liên kết kích hoạt qua email; khóa hoặc mở khóa tài khoản người dùng khi cần thiết. Mọi hành động quản trị đều được lưu vết vào nhật ký kiểm toán hệ thống. |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống với vai trò Admin. |
| **Hậu điều kiện** | Tài khoản Giáo viên mới được tạo hoặc trạng thái hoạt động của tài khoản người dùng được cập nhật trong cơ sở dữ liệu. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Quản trị viên vào mục "Quản lý Người dùng".<br>**2.** Hệ thống hiển thị danh sách người dùng kèm bộ lọc theo vai trò (Người học, Giáo viên, Admin) và ô tìm kiếm theo Họ tên, Email.<br>**3.** Quản trị viên thực hiện thao tác quản lý:<br>&nbsp;&nbsp;• Tạo tài khoản Giáo viên mới: Nhấn "Tạo tài khoản Giáo viên", nhập Họ tên và Email của Giáo viên.<br>&nbsp;&nbsp;• Khóa/Mở khóa tài khoản: Chọn một tài khoản, nhấn "Vô hiệu hóa tài khoản" và nhập lý do khóa (hoặc "Mở khóa tài khoản").<br>**4.** Hệ thống kiểm tra và xử lý nghiệp vụ:<br>&nbsp;&nbsp;4a. Quản trị viên tự khóa tài khoản của chính mình → Hệ thống cảnh báo và từ chối thực hiện.<br>&nbsp;&nbsp;4b. Tạo tài khoản Giáo viên với Email đã tồn tại → Báo lỗi email đã được đăng ký trong hệ thống.<br>&nbsp;&nbsp;4c. Tạo tài khoản Giáo viên thành công → Tạo bản ghi người dùng với vai trò Giáo viên ở trạng thái chờ kích hoạt, đồng thời gửi email chứa liên kết kích hoạt tài khoản lần đầu đến địa chỉ email của Giáo viên (không gửi mật khẩu trực tiếp qua email). Hành động được ghi vào nhật ký kiểm toán quản trị.<br>&nbsp;&nbsp;4d. Khóa tài khoản thành công → Cập nhật trạng thái vô hiệu hóa, lập tức thu hồi phiên làm việc hiện tại của tài khoản đó và ghi nhật ký kiểm toán.<br>**5.** Hệ thống thông báo kết quả cập nhật thành công và làm mới danh sách người dùng. |
| **Điều kiện đặc biệt** | • Nguyên tắc đơn vai trò: Mỗi tài khoản chỉ nắm giữ duy nhất một vai trò cố định (Người học, Giáo viên hoặc Admin). Để đảm bảo tính toàn vẹn dữ liệu học tập, không thực hiện chuyển đổi qua lại giữa tài khoản Người học và Giáo viên; tài khoản Giáo viên được tạo mới độc lập.<br>• Giao diện không hỗ trợ tạo thêm tài khoản Quản trị viên mới (tài khoản Quản trị viên chỉ được cấp qua cấu hình máy chủ/cơ sở dữ liệu để bảo đảm an toàn hệ thống tối cao).<br>• Toàn bộ nhật ký kiểm toán quản trị (thời gian, người thực hiện, thao tác tạo/khóa tài khoản) được lưu trữ an toàn trong cơ sở dữ liệu phục vụ quản trị kỹ thuật. |
| **Yêu cầu phi chức năng** | • Thời gian tra cứu và tìm kiếm người dùng ≤ 1 giây.<br>• Kiểm soát phân quyền chặt chẽ tại tầng máy chủ, ngăn chặn tuyệt đối các yêu cầu nâng quyền trái phép. |

---

## 14. Xem Báo cáo và Thống kê toàn hệ thống

| Thuộc tính | Chi tiết |
|---|---|
| **Tên Use Case** | **Xem Báo cáo và Thống kê toàn hệ thống** |
| **Tác nhân chính** | Quản trị viên (Admin) |
| **Mục tiêu** | Cung cấp số liệu tổng quan về tình hình hoạt động của hệ thống: số lượng người dùng theo vai trò, tiến độ học tập toàn hệ thống, tỷ lệ thi đỗ cấp độ A1 và bảng kiểm toán các bài học được Admin xuất bản trực tiếp. |
| **Mô tả ngắn gọn** | Quản trị viên truy cập bảng điều khiển báo cáo; xem các chỉ số thống kê tổng hợp theo khoảng thời gian tùy chọn; theo dõi số lượng bài học theo từng trạng thái biên soạn và tra cứu danh sách kiểm toán các bài xuất bản trực tiếp kèm lý do giải trình. |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập hệ thống với quyền Admin. |
| **Hậu điều kiện** | Số liệu thống kê được kết xuất hiển thị trên màn hình quản trị. |
| **Luồng sự kiện chính (gồm luồng thay thế)** | <br>**1.** Quản trị viên truy cập mục "Báo cáo & Thống kê".<br>**2.** Hệ thống truy vấn dữ liệu và hiển thị bảng điều khiển báo cáo tổng quan.<br>**3.** Quản trị viên chọn khoảng thời gian cần thống kê (7 ngày qua, 30 ngày qua, hoặc khoảng ngày tùy chọn).<br>**4.** Hệ thống tổng hợp và hiển thị các khối thông tin thống kê:<br>&nbsp;&nbsp;• Khối Người dùng: Tổng số tài khoản, số lượng tài khoản mới đăng ký, phân bổ theo vai trò (Người học, Giáo viên, Admin).<br>&nbsp;&nbsp;• Khối Nội dung: Thống kê số lượng bài học theo từng trạng thái (Bản nháp - DRAFT, Chờ duyệt - IN_REVIEW, Yêu cầu sửa - CHANGES_REQUESTED, Đã duyệt chờ xuất bản Unit - APPROVED, Đã xuất bản - PUBLISHED).<br>&nbsp;&nbsp;• Khối Học tập: Tỷ lệ người học hoàn thành các Unit trong lộ trình A1 (chỉ tính toán dựa trên các bài học thực tế người học đã hoàn thành), tỷ lệ thi đạt/chưa đạt bài thi lên cấp A1.<br>&nbsp;&nbsp;• Khối Kiểm toán xuất bản trực tiếp: Bảng thống kê chi tiết các bài học được gắn cờ `DIRECT_PUBLISH_BY_ADMIN`, hiển thị rõ Tên bài học, Quản trị viên thực hiện, Ngày xuất bản và Lý do bắt buộc đã nhập.<br>**5.** Quản trị viên lọc và tra cứu thông tin trên từng bảng dữ liệu khi cần đối chiếu nghiệp vụ. |
| **Điều kiện đặc biệt** | • Tỷ lệ hoàn thành Unit và tiến độ lộ trình chỉ tính toán dựa trên số bài học thực tế người học đã hoàn thành.<br>• Bảng kiểm toán cờ `DIRECT_PUBLISH_BY_ADMIN` là dữ liệu bất biến, chỉ cho phép xem, không cho phép chỉnh sửa hay xóa.<br>• Báo cáo tập trung vào các chỉ số nghiệp vụ cốt lõi của MVP, không bao gồm các chỉ số mở rộng ngoài phạm vi (như DAU/MAU hay xuất tệp CSV/Excel). |
| **Yêu cầu phi chức năng** | • Thời gian truy vấn và hiển thị dữ liệu báo cáo tổng hợp ≤ 2 giây.<br>• Số liệu thống kê được tính toán chính xác, nhất quán với dữ liệu thực tế trong cơ sở dữ liệu. |

---

## 15. Hạn chế đã biết (Known Limitations)

Trong phạm vi phiên bản thử nghiệm (Pilot / MVP), hệ thống ghi nhận các hạn chế kỹ thuật và nghiệp vụ sau:

1. **Bộ đề Thi lên cấp (UC-05) cố định và cho phép thi lại ngay:** Do ngân hàng đề thi trong giai đoạn pilot sử dụng bộ đề chuẩn hóa cố định và hệ thống không áp dụng thời gian chờ giữa các lần thi, học viên thi trượt có thể ghi nhớ câu hỏi và đáp án khi thực hiện thi lại nhiều lần liên tiếp.
2. **Bài kiểm tra trình độ đầu vào (UC-02) chưa ảnh hưởng đến lộ trình trong bản pilot:** Do nội dung học tập của hệ thống hiện tại mới chỉ đóng gói hoàn thiện cấp độ A1 (A2 đang được biên soạn), kết quả kiểm tra trình độ (kể cả khi đạt A2 trở lên) chưa thể điều hướng người học nhảy cóc hay vào thẳng các cấp độ cao hơn mà chỉ lưu kết quả ước lượng vào hồ sơ để đối chiếu năng lực và làm dữ liệu nền tảng khi cấp độ A2 chính thức phát hành.


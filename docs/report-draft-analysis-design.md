# BÁO CÁO ĐỒ ÁN KỸ NGHỆ PHẦN MỀM
## ĐỀ TÀI: NỀN TẢNG HỌC NGOẠI NGỮ TRỰC TUYẾN LINGORA
### BẢN NHÁP NỘI DUNG: PHÂN TÍCH YÊU CẦU VÀ THIẾT KẾ HỆ THỐNG

---

# PHẦN A — CƠ SỞ ĐẦU VÀO CHO PHÂN TÍCH

## 1.5. Khảo sát và phân tích nhu cầu

Việc xây dựng một nền tảng học ngoại ngữ trực tuyến đòi hỏi phải hiểu rõ thói quen, tâm lý tiếp nhận kiến thức và những rào cản thực tế mà người học thường xuyên đối mặt trong quá trình tự học. Nhiều giải pháp học tập số hiện nay gặp phải tình trạng người dùng bỏ cuộc sau một thời gian ngắn do bài học quá dài, nội dung thiếu ngữ cảnh thực tế, hoặc ứng dụng chỉ đưa ra thông báo đúng/sai mà không cung cấp giải thích thỏa đáng. Đồng thời, bài toán quản lý chất lượng học liệu, phân định quyền hạn biên soạn và kiểm duyệt nội dung trước khi xuất bản cũng đặt ra yêu cầu cấp thiết về mặt vận hành. 

Quá trình đặc tả yêu cầu và thiết kế kiến trúc hệ thống Lingora dựa trên dữ liệu thu thập đa nguồn: khảo sát định lượng, phỏng vấn định tính chuyên sâu và phân tích đối chuẩn các nền tảng học tập phổ biến trên thị trường.

### 1.5.1. Kết quả khảo sát và phân tích nhu cầu người học

Quá trình nghiên cứu người học được tiến hành theo hai giai đoạn kế tiếp nhau: bắt đầu từ đợt khảo sát ban đầu nhằm nhận diện bức tranh tổng thể và phát hiện các rào cản học tập cốt lõi, tiếp nối bằng đợt khảo sát sơ bộ bổ sung nhằm làm rõ các thông số kỹ thuật phục vụ trực tiếp cho các quyết định thiết kế của phiên bản sản phẩm khả dụng tối thiểu (MVP).

#### Giai đoạn khảo sát ban đầu

Đợt khảo sát người học ban đầu được thực hiện thông qua phiếu câu hỏi trực tuyến với sự tham gia của 15 người học ngoại ngữ thực tế ($N=15$). Phiếu khảo sát bao gồm 24 câu hỏi bao quát từ mục tiêu học tập, phân bổ thời gian tự học, các kỹ năng gặp khó khăn nhất, mức độ suy giảm trí nhớ từ vựng, cho đến kỳ vọng đối với các dạng bài tập tương tác và khả năng cá nhân hóa lộ trình. Danh mục 24 câu hỏi được trình bày tại Phụ lục Mục 11 của tài liệu phân tích yêu cầu (`docs/tai-lieu-phan-tich-yeu-cau.md`); phần này tập trung vào các câu hỏi liên quan trực tiếp đến việc xác định yêu cầu và quyết định thiết kế.

Kết quả thu nhận từ khảo sát ban đầu đã cho thấy thực trạng tự học ngoại ngữ hiện nay:

Trước hết, về ngôn ngữ mục tiêu (Câu hỏi Q1), có tới 13/15 người tham gia khảo sát (≈87%) bày tỏ nhu cầu học tiếng Anh (trong đó 10/15 học chuyên biệt tiếng Anh (≈67%) và 3/15 học kết hợp tiếng Anh và tiếng Trung (≈20%)). Nhu cầu đối với tiếng Trung đơn lẻ đạt 1/15 người (≈7%) và tiếng Nhật là 1/15 người (≈7%). Từ kết quả này, nhóm quyết định ưu tiên xây dựng bộ học liệu Tiếng Anh trình độ cơ bản (English A1) cho giai đoạn đầu của dự án; đồng thời, do một bộ phận người học có nhu cầu tiếng Trung và tiếng Nhật, kiến trúc dữ liệu và dịch vụ của Lingora được thiết kế hỗ trợ đa ngôn ngữ độc lập ngay từ nền tảng.

Về các kỹ năng gây trở ngại lớn nhất (Câu hỏi Q7), khảo sát ghi nhận Từ vựng là kỹ năng khó cải thiện nhất đối với 7/15 người học (≈47%). Tiếp theo đó là các kỹ năng Nghe (6/15 người, ≈40%), Nói (6/15 người, ≈40%), Viết (6/15 người, ≈40%), Ngữ pháp (5/15 người, ≈33%) và Đọc (2/15 người, ≈13%). 

Đặc biệt, vấn đề suy giảm trí nhớ từ vựng (Câu hỏi Q8) là rào cản được ghi nhận ở toàn bộ mẫu khảo sát: 15/15 người học tham gia khảo sát (100%) xác nhận thường xuyên gặp hiện tượng học trước quên sau, trong đó 8/15 người (≈53%) đánh giá bản thân rất thường xuyên quên từ mới và 7/15 người (≈47%) thỉnh thoảng quên; không có bất kỳ người học nào (0/15, 0%) khẳng định không bao giờ quên từ vựng đã học. Khi được hỏi về mức độ cần thiết của tính năng tự động xác định từ cần ôn và thời điểm nhắc ôn theo chu kỳ khoa học (Câu hỏi Q13), có 12/15 người học (≈80%) đánh giá ở mức cấp thiết cao (từ 4 đến 5 điểm trên thang điểm 5), với điểm số trung bình đạt 4.13/5. 

Bên cạnh đó, hiện tượng đứt gãy thói quen tự học xuất hiện với tần suất cao (Câu hỏi Q9): 13/15 người học (≈87%) thừa nhận đã từng bỏ dở giữa chừng quá trình tự học ngoại ngữ. Nguyên nhân chủ yếu xuất phát từ quỹ thời gian tự học trong tuần rất hạn hẹp (Câu hỏi Q5 ghi nhận 11/15 người, tức ≈73%, chỉ có thể dành từ 5 giờ trở xuống mỗi tuần cho việc học) cùng với tâm lý quá tải khi bài học quá dài hoặc thiếu sự duy trì động lực liên tục.

Về sở thích đối với các dạng bài tập tương tác (Câu hỏi Q17), kết quả ghi nhận sự ưa chuộng đối với các dạng bài có tính phản hồi nhanh và gắn liền với ngữ cảnh: dạng điền từ vào chỗ trống dẫn đầu với 11/15 người lựa chọn (≈73%), tiếp đến là trắc nghiệm khách quan với 9/15 người (≈60%), nghe nhận diện từ vựng với 8/15 người (≈53%), ghép từ nối nghĩa với 7/15 người (≈47%) và sắp xếp từ thành câu hoàn chỉnh với 6/15 người (≈40%). Cuối cùng, 14/15 người học (≈93% theo Câu hỏi Q15: "Bạn có muốn hệ thống tự đề xuất nội dung cần học/ôn dựa trên kết quả học trước đó không?") thể hiện mong muốn hệ thống có khả năng tự động phân tích kết quả bài tập để đề xuất nội dung ôn tập sát với điểm yếu của bản thân. Ngoài 5 dạng bài nêu trên, khảo sát còn ghi nhận dạng bài Dịch (6/15 người, ≈40%) và dạng bài Viết tự do (5/15 người, ≈33%); hai lựa chọn này không được đưa vào 5 dạng bài cốt lõi của MVP (dịch thuật nằm ngoài phạm vi; viết tự do chỉ được hỗ trợ trong khuôn khổ luyện viết theo tình huống có gợi ý sửa lỗi `P1-FR-007`). Tương tự, dạng bài ghép từ nối nghĩa được 7/15 người lựa chọn (≈47%) cũng không thuộc 5 dạng chuẩn của MVP: mô hình MVP không tồn tại dạng bài `MATCHING`.

[BẢNG 1.1 — Tổng hợp kết quả định lượng từ khảo sát ban đầu người học (N=15)]

| Chỉ số khảo sát | Số lượng phản hồi | Tỷ lệ phần trăm | Ý nghĩa đối với thiết kế hệ thống |
|---|:---:|:---:|---|
| **Nhu cầu học Tiếng Anh (Q1)** | 13/15 | 87% | Ưu tiên phát triển bộ đề cương Tiếng Anh cơ bản (A1) cho giai đoạn đầu. |
| **Nhu cầu có liên quan tiếng Trung (Q1, gồm 3 người học kết hợp Anh–Trung đã tính trong 13/15 tiếng Anh)** | 4/15 | 27% | Thiết kế kiến trúc hỗ trợ đa ngôn ngữ đích độc lập ngay từ đầu. |
| **Nhu cầu tiếng Nhật (Q1)** | 1/15 | 7% | Cùng định hướng đa ngôn ngữ như trên. |
| **Gặp trở ngại ghi nhớ từ vựng (Q8)** | 15/15 | 100% | Làm cơ sở đưa thuật toán ôn tập ngắt quãng tự động thành chức năng bắt buộc. |
| **Đánh giá cấp thiết nhắc ôn từ vựng (Q13)** | 12/15 | 80% | Đưa phân hệ ôn tập ngắt quãng (SRS) thành chức năng trọng tâm bắt buộc. |
| **Từng bỏ dở việc tự học ngoại ngữ (Q9)** | 13/15 | 87% | Thiết kế bài học vi mô thời lượng 5–10 phút và cơ chế duy trì chuỗi học. |
| **Thời gian tự học $\le$ 5 giờ/tuần (Q5)** | 11/15 | 73% | Giới hạn dung lượng bài học, tránh gây quá tải nhận thức cho người học. |
| **Ưa thích dạng bài Điền từ vào chỗ trống (Q17)** | 11/15 | 73% | Chuẩn hóa dạng bài FILL_BLANK trong bộ bài tập tương tác cốt lõi. |
| **Ưa thích dạng bài Trắc nghiệm khách quan (Q17)** | 9/15 | 60% | Chuẩn hóa dạng bài MCQ trong bộ bài tập tương tác cốt lõi. |
| **Ưa thích dạng bài Nghe nhận diện từ (Q17)** | 8/15 | 53% | Chuẩn hóa dạng bài LISTENING đi kèm tệp âm thanh chuẩn 100% từ vựng. |
| **Kỳ vọng hệ thống tự đề xuất nội dung (Q15)** | 14/15 | 93% | Xây dựng phân hệ đánh giá chẩn đoán và theo dõi năng lực cá nhân hóa. |

#### Giai đoạn khảo sát sơ bộ bổ sung

Mặc dù khảo sát ban đầu đã chỉ ra các nhu cầu nền tảng, một số tham số thiết kế chi tiết vẫn cần dữ liệu thực nghiệm bổ trợ để tránh việc đưa ra các giả định cảm tính trong quá trình xây dựng nghiệp vụ. Cụ thể, nhóm nghiên cứu cần xác định khung thời gian học tập tập trung nhất trong ngày của người học nhằm định hướng cơ chế nhắc nhở, đồng thời cần đánh giá thái độ của học viên đối với cơ chế buộc làm lại các câu hỏi đã trả lời sai ở cuối bài học.

Do đó, một đợt khảo sát sơ bộ bổ sung với quy mô $N=35$ người học đã được triển khai từ ngày 10/09/2026 đến ngày 14/09/2026. Mẫu khảo sát được thu thập theo phương pháp thuận tiện kết hợp quả cầu tuyết, hướng tới nhóm đối tượng là sinh viên đại học và người đi làm tại khu vực Hà Nội tự nhận diện là đang mất căn bản hoặc bắt đầu học lại ngoại ngữ. Cần nhấn mạnh rằng tập dữ liệu $N=35$ này đóng vai trò là nguồn dữ liệu thực nghiệm khám phá sơ bộ (preliminary discovery research) hỗ trợ cho các quyết định thiết kế trong phạm vi phiên bản MVP của đề tài, không nhằm mục đích đại diện cho toàn bộ quần thể người học ngoại ngữ về mặt thống kê xã hội học. Toàn bộ dữ liệu phản hồi thô thu thập qua biểu mẫu trực tuyến được tổng hợp và lưu trữ tại hồ sơ nghiên cứu người dùng của dự án (Phụ lục Khảo sát N=35) để sẵn sàng cung cấp minh chứng đối chiếu khi nghiệm thu đề tài; các kết quả phân tích dưới đây được sử dụng làm bằng chứng thực tiễn để định hướng các quyết định thiết kế.

Khảo sát bổ sung tập trung vào hai câu hỏi nghiệp vụ chuyên biệt:

Câu hỏi thứ nhất tìm hiểu về khung giờ tự học khả thi và có mức độ tập trung tốt nhất trong ngày. Kết quả ghi nhận:
- Khung giờ buổi tối từ 20:00 đến 22:00 chiếm tỷ lệ cao nhất với 18/35 người lựa chọn (≈51%). Đây là thời điểm người học đã hoàn tất các công việc hành chính hoặc học tập chính khóa trên trường, có khoảng thời gian tĩnh để tiếp thu bài học mới.
- Khung giờ nghỉ trưa từ 12:00 đến 13:00 đứng thứ hai với 8/35 người (≈23%), phản ánh xu hướng tranh thủ thời gian nghỉ ngơi giữa ngày để luyện tập nhanh.
- Nhóm người học có thói quen giờ giấc linh hoạt, học bất cứ khi nào có thời gian rảnh rỗi trong ngày chiếm 6/35 người (≈17%).
- Khung giờ sáng sớm từ 06:00 đến 07:30 chỉ ghi nhận 3/35 người lựa chọn (≈9%).

Dữ liệu này cung cấp định hướng quan trọng: buổi tối là khoảng thời gian vàng cho việc tự học. Mặc dù các cơ chế thông báo đẩy trên thiết bị di động (Push Notification) phức tạp tạm thời nằm ngoài phạm vi MVP để tinh gọn hạ tầng, kết quả này được dùng tham khảo để hệ thống thiết lập cửa sổ hiển thị biểu ngữ nhắc nhở học tập trong ứng dụng (In-app Reminder) và lên lịch tác vụ định kỳ sau này.

[BẢNG 1.2 — Phân bố khung giờ tự học khả thi nhất trong ngày (N=35)]

| Khung thời gian trong ngày | Số lượng lựa chọn | Tỷ lệ phần trăm | Định hướng áp dụng thiết kế |
|---|:---:|:---:|---|
| **20:00 – 22:00 (Buổi tối sau giờ làm/học)** | 18/35 | 51% | Cửa sổ ưu tiên mặc định cho cơ chế nhắc nhở học tập trong ứng dụng. |
| **12:00 – 13:00 (Nghỉ trưa)** | 8/35 | 23% | Cửa sổ nhắc nhở phụ trợ cho người học có thói quen học nhanh giữa ngày. |
| **Giờ giấc linh hoạt khi có thời gian rảnh** | 6/35 | 17% | Cho phép người dùng tùy chỉnh cửa sổ thời gian nhắc nhở trong hồ sơ. |
| **06:00 – 07:30 (Sáng sớm)** | 3/35 | 9% | Lưu giữ cấu hình khung giờ cho phân hệ cài đặt nâng cao sau này. |

Câu hỏi thứ hai khảo sát thái độ của người học đối với việc hệ thống yêu cầu làm lại các câu đã trả lời sai ở cuối bài học với tỷ lệ ước tính khoảng 10% dung lượng nội dung nhằm củng cố khả năng ghi nhớ. Kết quả thu được:
- Nhóm đồng ý hoàn toàn rằng việc gặp lại câu sai ở cuối bài là cần thiết để khắc phục lỗ hổng kiến thức ngay tại chỗ chiếm 19/35 người (≈54%).
- Nhóm người học phân vân hoặc mong muốn hệ thống cung cấp tùy chọn cho phép tự do bật hoặc tắt tính năng làm lại câu sai chiếm 11/35 người (≈31%).
- Nhóm người học không muốn lặp lại câu sai do tâm lý sợ áp lực hoặc muốn hoàn thành nhanh bài học chiếm 5/35 người (≈14%).

Tính chung lại, có tới 30/35 người học (≈86%) không phản đối hoàn toàn cơ chế củng cố câu sai. Tuy nhiên, tỷ lệ ≈31% người học phân vân và ≈14% không muốn lặp lại cho thấy hệ thống không được biến việc làm lại câu sai thành một hình thức "phạt" dồn ép người học làm đi làm lại không giới hạn, mà phải kiểm soát chặt chẽ số lượng câu sai được phép làm lại trong một lượt học và giới hạn trần điểm thưởng để đảm bảo sự công bằng.

[BẢNG 1.3 — Phản hồi của người học về cơ chế làm lại câu sai ở cuối bài (N=35)]

| Thái độ đối với việc làm lại câu sai | Số lượng phản hồi | Tỷ lệ phần trăm | Quyết định thiết kế nghiệp vụ |
|---|:---:|:---:|---|
| **Đồng ý cần gặp lại câu sai để củng cố ghi nhớ** | 19/35 | 54% | Thiết kế cơ chế Controlled Retry xuất hiện ngay sau khi kết thúc lượt bài đầu tiên. |
| **Phân vân / Muốn có tùy chọn bật hoặc tắt** | 11/35 | 31% | Khống chế hạn mức làm lại (tối đa 10%), không dồn ứ nhiều câu hỏi. |
| **Không muốn lặp lại nội dung đã làm sai** | 5/35 | 14% | Áp dụng trần điểm tín chỉ (tối đa 70%); mỗi câu sai chỉ xuất hiện tối đa một lần trong lượt làm lại của phiên. |
| **Tổng số người không phản đối hoàn toàn** | **30/35** | **86%** | Xác lập tính chính danh cho cơ chế Controlled Retry trong phạm vi MVP. |

### 1.5.2. Kết quả phỏng vấn người học

Nhóm nghiên cứu phỏng vấn định tính chuyên sâu bán cấu trúc 03 người học ($N=3$) để làm rõ những rào cản tâm lý vô hình và nguyên nhân gốc rễ dẫn đến hành vi từ bỏ ứng dụng tự học. Đây là các sinh viên đại học từng chủ động cài đặt và sử dụng các ứng dụng học ngoại ngữ phổ biến nhưng đã ngừng sử dụng hoàn toàn sau 1 đến 2 tuần đầu tiên. 

Toàn bộ thông tin thu thập được phân tích dưới dạng các phát hiện định tính chuyên sâu, tuyệt đối không quy đổi thành tỷ lệ phần trăm:

Phát hiện thứ nhất liên quan đến tâm lý nản lòng do sự dồn ứ nội dung học tập. Người học thứ nhất (sinh viên năm thứ ba) chia sẻ rằng trong những ngày đầu tiếp cận ứng dụng, bản thân cảm thấy rất hào hứng và hoàn thành nhiều bài học. Tuy nhiên, khi lịch thi cử và các công việc đột xuất ở trường xuất hiện, người học buộc phải gián đoạn việc học trong 2 đến 3 ngày. Khi mở lại ứng dụng vào ngày hôm sau, giao diện hiển thị một danh sách dồn ứ dày đặc các bài tập nhắc nhở cùng hàng chục từ vựng bị gắn nhãn "quá hạn", tạo nên cảm giác áp lực và quá tải nhận thức nghiêm trọng. Người học cảm thấy bản thân đã "mất đà" và không thể theo kịp khối lượng bài vở dồn lại, dẫn tới tâm lý ngại ngùng rồi quyết định xóa ứng dụng.

Phát hiện thứ hai chỉ ra sự bức xúc khi trả lời sai nhưng không được cung cấp lời giải thích thích đáng. Người học thứ hai (sinh viên mới tốt nghiệp) cho biết rào cản lớn nhất khi làm các bài tập trắc nghiệm ngữ pháp hoặc điền từ là hệ thống chỉ đổi màu đỏ báo sai và hiển thị đáp án đúng một cách cơ học. Người học hoàn toàn không hiểu vì sao phương án mình chọn lại không chính xác, hoặc tại sao trong ngữ cảnh đó lại phải sử dụng thì hiện tại hoàn thành thay vì quá khứ đơn. Việc phải thoát ứng dụng để tự tra cứu ngữ pháp trên các diễn đàn mạng làm đứt gãy mạch tư duy và tiêu tốn nhiều thời gian, khiến quá trình luyện tập trở nên ức chế và nhanh chóng dẫn đến quyết định dừng học.

Phát hiện thứ ba xuất phát từ việc bài học quá dài và tác động tiêu cực của cơ chế chuỗi ngày học tập. Người học thứ ba (sinh viên năm thứ hai) phản ánh rằng một số bài học trên các ứng dụng hiện nay tích hợp quá nhiều kiến thức mới trong một phiên, thời gian hoàn thành kéo dài trên 20 phút khiến người học rất khó tận dụng các khoảng thời gian rảnh rỗi ngắn trong ngày. Hơn nữa, cơ chế chuỗi ngày liên tục (Streak) dù ban đầu mang lại động lực tích cực, nhưng khi người học lỡ mất một ngày do sự cố khách quan và chuỗi ngày bị xóa bỏ, người học trải qua cảm giác hụt hẫng và suy giảm động lực rõ rệt.

Những phát hiện định tính trên cho thấy: Lingora cần tuân thủ mô hình bài học vi mô (micro-learning) với thời lượng giới hạn từ 5 đến 10 phút; mọi câu hỏi bài tập cần có phần giải thích đáp án ngắn gọn; và các cơ chế lặp lại câu sai phải được khống chế chặt chẽ để không biến thành gánh nặng dồn ứ làm người học nản chí.

### 1.5.3. Phân tích các nền tảng học ngoại ngữ

Bên cạnh việc lắng nghe người học, nhóm nghiên cứu đã tiến hành đối chuẩn bằng quan sát sản phẩm trên ba nền tảng học ngoại ngữ có lượng người dùng lớn hiện nay gồm Duolingo, Quizlet và ELSA Speak. Đây không phải khảo sát định lượng mà là quan sát các ưu điểm về mặt thiết kế để kế thừa và nhận diện các hạn chế thực tế nhằm rút kinh nghiệm cho kiến trúc Lingora. Các nền tảng được đối chiếu theo các nhóm chức năng liên quan đến bài học, ghi nhớ từ vựng, âm thanh và phản hồi:

#### Duolingo

Nền tảng này rất thành công trong việc áp dụng mô hình bài học vi mô với thời lượng từ 5 đến 10 phút, lộ trình học tập dạng cây tuyến tính trực quan và cơ chế chuỗi ngày học liên tục (Streak) giúp người học duy trì phản xạ truy cập hàng ngày. Tuy nhiên, qua quan sát sản phẩm, Duolingo bộc lộ hạn chế rõ rệt: bài học đôi khi quá nặng về phản xạ lặp lại từ ngữ một cách máy móc, thiếu phần giải thích ngữ pháp chi tiết tại chỗ khi người học chọn đáp án sai, và cơ chế bảo vệ chuỗi ngày tương đối phức tạp, dễ tạo tâm lý ỷ lại. Từ quan sát này, Lingora quyết định kế thừa cấu trúc bài học vi mô 5–10 phút và cơ chế chuỗi ngày học tự giác đơn giản (đứt chuỗi thì đặt lại về 1, hoãn lại hoàn toàn các cơ chế bảo vệ chuỗi ngoài phạm vi MVP), đồng thời bắt buộc Soạn giả phải cung cấp lời giải thích quy tắc ngắn gọn cho mọi câu hỏi tương tác.

#### Quizlet

Quizlet khẳng định thế mạnh vượt trội ở hệ thống thẻ ghi nhớ từ vựng (Flashcard) trực quan, cơ chế chủ động lật mặt trước/sau để tự kiểm tra khả năng gợi nhớ và áp dụng kỹ thuật ôn tập ngắt quãng. Mặc dù vậy, hạn chế lớn của Quizlet là phần lớn thẻ từ vựng chỉ tập trung vào các từ đơn lẻ thiếu câu ví dụ hoàn chỉnh theo ngữ cảnh giao tiếp. Hơn thế nữa, nội dung học liệu trên Quizlet chủ yếu do cộng đồng người dùng tự do tải lên mà không trải qua quy trình kiểm duyệt chất lượng, dẫn tới tình trạng sai chính tả, dịch nghĩa lệch ngữ cảnh hoặc phát âm không chuẩn. Lingora khắc phục nhược điểm này bằng cách chuẩn hóa cấu trúc từ vựng bắt buộc có phiên âm, dịch nghĩa và câu ví dụ theo ngữ cảnh, đồng thời thiết lập quy trình kiểm duyệt học liệu độc lập 100% trước khi phát hành.

#### ELSA Speak

ELSA Speak là nền tảng tiên phong trong việc rèn luyện phát âm chuẩn bản xứ và phản hồi ngữ âm tức thì. Dẫu vậy, nhược điểm thực tế của nền tảng này là sự phụ thuộc hoàn toàn vào công nghệ nhận dạng giọng nói tự động (Speech Recognition). Khi người học ở trong môi trường có tiếng ồn hoặc phát âm chưa chuẩn khẩu hình, hệ thống rất dễ chấm điểm sai lệch, tạo áp lực tâm lý tiêu cực cho những người mới bắt đầu hoặc người mất căn bản. Từ quan sát này, Lingora xác định trong phạm vi MVP sẽ không tích hợp module chấm phát âm qua giọng nói phức tạp; thay vào đó, hệ thống tập trung tải sẵn tệp âm thanh phát âm chuẩn bản xứ cho 100% từ vựng mới và rèn luyện phản xạ thính giác thông qua dạng bài tập nghe nhận diện từ vựng.

[BẢNG 1.4 — Bảng tổng hợp phân tích đối chuẩn các nền tảng học ngoại ngữ]

| Nền tảng đối chuẩn | Ưu điểm nổi bật được kế thừa | Hạn chế thực tế quan sát được | Quyết định thiết kế áp dụng cho Lingora |
|---|---|---|---|
| **Duolingo** | - Bài học vi mô ngắn gọn (5–10 phút).<br>- Lộ trình học tuyến tính rõ ràng.<br>- Cơ chế chuỗi ngày liên tục (Streak). | - Thiếu giải thích ngữ pháp khi trả lời sai.<br>- Lặp lại cơ học gây nhàm chán.<br>- Cơ chế bảo vệ chuỗi phức tạp. | - Chuẩn hóa bài học 5–10 phút.<br>- Bắt buộc có giải thích đáp án tối đa 2 câu.<br>- MVP áp dụng chuỗi ngày đơn giản: lỡ ngày reset về 1, không có bảo vệ chuỗi. |
| **Quizlet** | - Thẻ ghi nhớ (Flashcard) trực quan, lật mặt từ/nghĩa.<br>- Chế độ tự ôn tập chủ động. | - Thiếu ngữ cảnh câu giao tiếp.<br>- Học liệu tự do, thiếu quy trình kiểm duyệt chuyên môn. | - Thẻ từ vựng chuẩn hóa gồm từ, nghĩa, phát âm và câu ví dụ.<br>- Xây dựng quy trình kiểm duyệt 6 trạng thái độc lập trước khi xuất bản. |
| **ELSA Speak** | - Âm thanh phát âm chuẩn bản xứ.<br>- Phản hồi tương tác tức thì. | - Nhận dạng giọng nói dễ lỗi do micro/tạp âm.<br>- Gây áp lực cho người học mất căn bản. | - Cung cấp tệp âm thanh chuẩn 100% từ vựng.<br>- MVP không thu âm chấm giọng nói; thay bằng dạng bài nghe nhận diện từ. |

### 1.5.4. Kết luận từ quá trình khảo sát

Từ sự kết hợp đồng bộ giữa khảo sát định lượng ban đầu ($N=15$), khảo sát bổ sung ($N=35$), phỏng vấn định tính ($N=3$) và phân tích đối chuẩn hệ thống, nhóm nghiên cứu đã đúc kết được sáu luận điểm cốt lõi định hình toàn bộ yêu cầu và giải pháp kiến trúc của Lingora:

1. **Ghi nhớ từ vựng là trở ngại lớn nhất nhưng có thể giải quyết bằng thuật toán:** 15/15 người học (100%) đối mặt với hiện tượng mau quên từ mới và 12/15 người học (≈80%) kỳ vọng vào một cơ chế tự động nhắc ôn tập. Giải pháp thiết kế bắt buộc là xây dựng phân hệ ôn tập ngắt quãng (Spaced Repetition System - SRS) dựa trên chu kỳ khoa học cố định, tự động hóa việc đưa các từ vựng đến hạn vào hàng đợi ôn tập hàng ngày.
2. **Ngăn chặn đứt gãy thói quen bằng bài học vi mô và phản hồi tức thì:** Tỷ lệ bỏ dở 13/15 (≈87%) đòi hỏi cấu trúc bài học phải được thu nhỏ thành các bài học vi mô từ 5 đến 10 phút với mục tiêu học tập rõ ràng, kết hợp cơ chế chuỗi ngày học tự giác để duy trì nhịp độ tiếp cận hàng ngày.
3. **Giải thích đáp án là yêu cầu sư phạm bắt buộc:** Để khắc phục bức xúc của người học khi làm sai, hệ thống Lingora quy định bắt buộc mọi câu hỏi bài tập tương tác thuộc 5 dạng chuẩn đều phải có phần giải thích đáp án ngắn gọn (tối đa 2 câu) do Soạn giả biên soạn và Kiểm duyệt viên thẩm định.
4. **Củng cố câu sai phải có kiểm soát chặt chẽ:** Khảo sát N=35 chỉ ra 30/35 người học (≈86%) không phản đối việc làm lại câu sai. Tuy nhiên, để tránh áp lực dồn ứ như ghi nhận từ phỏng vấn định tính, hệ thống triển khai cơ chế làm lại có kiểm soát (Controlled Retry) xuất hiện ngay ở cuối bài học với hạn mức tối đa 10% số câu hỏi và trần điểm thưởng 70%, tuyệt đối không áp dụng mô hình hàng đợi dồn ngày.
5. **Khung giờ buổi tối là cửa sổ học tập chủ đạo:** Với 18/35 người học (≈51%) tập trung vào khung giờ 20:00 – 22:00, hệ thống định hướng hiển thị các thông báo nhắc nhở trong ứng dụng (In-app Reminder) dựa trên cài đặt mục tiêu học tập cá nhân trong hồ sơ người dùng.
6. **Chất lượng học liệu là ranh giới sống còn của nền tảng:** Để không lặp lại sai lầm về học liệu sai lệch kiến thức như các nền tảng mở, Lingora thiết lập một mô hình quản trị nội dung phân định rõ ràng giữa người lập kế hoạch đề cương, người biên soạn, người thẩm định chuyên môn độc lập và người có quyền xuất bản.

---

## 1.6. Yêu cầu của hệ thống

Trên cơ sở các kết luận rút ra từ quá trình khảo sát người dùng và phân tích đối chuẩn, nhóm nghiên cứu tiến hành chuẩn hóa toàn bộ các yêu cầu của hệ thống Lingora thành hai nhóm: Yêu cầu chức năng và Yêu cầu phi chức năng. Các yêu cầu này được gắn mã định danh thống nhất nhằm phục vụ công tác truy nguyên (traceability) xuyên suốt các giai đoạn thiết kế, cài đặt và kiểm thử.

Trong kỹ nghệ phần mềm và phương pháp thiết kế lấy người dùng làm trung tâm, báo cáo phân định rõ ranh giới giữa hai khái niệm: **Vai trò kỹ thuật hệ thống (System Role / Actor)** và **Ngữ cảnh sử dụng của người học (Contextual Learner Persona)**.

Về mặt kiểm soát an ninh và phân quyền (RBAC/RLS), toàn bộ người học chia sẻ chung một vai trò kỹ thuật duy nhất là `Learner` trên cổng `lingora-web` nhằm tránh lạm phát vai trò trong cơ sở dữ liệu. Tuy nhiên, để phản hồi trực diện và thỏa đáng góp ý của giảng viên về việc "định nghĩa lại nhóm người dùng và yêu cầu chức năng theo từng nhóm", về mặt trải nghiệm sư phạm và thiết kế chức năng, hệ thống ánh xạ nhu cầu của người học qua **ba nhóm ngữ cảnh sử dụng (Contextual Learner Segments)**:

| Nhóm / Ngữ cảnh người học | Đặc điểm & Thách thức thực tế | Nhu cầu sư phạm & Chức năng liên quan |
|---|---|---|
| **Người mới bắt đầu** *(Beginners / Foundation Rebuilders)* | Chưa có điểm xuất phát rõ ràng; tâm lý sợ sai, dễ nản lòng khi bài học quá dài hoặc làm sai mà thiếu giải thích. | - Đánh giá chẩn đoán đầu vào để định vị điểm xuất phát (`P1-FR-016`, `UC-03`, `BF-08`).<br>- Bài học vi mô 5–10 phút với từ vựng có âm thanh chuẩn bản xứ (`P1-FR-002`, `P1-FR-003`, `UC-05`, `BF-09`).<br>- Giải thích đáp án tức thì cho từng câu hỏi sau khi nộp bài (`MVP-07`, `UC-05`).<br>- Làm lại câu sai có kiểm soát (Controlled Retry) ngay trong phiên (`BF-10`). |
| **Người đã có nền tảng** *(Intermediate Learners / Reviewers)* | Đã có kiến thức nền tảng nhất định; không muốn học lặp lại từ đầu; cần học tiếp hoặc ôn tập củng cố trọng tâm. | - Kiểm tra vượt cấp nhảy bài (Conditional Jump) với Unit kế cận (Quy tắc Policy D5, `MVP-04`, `UC-04`, `BF-11`; quy tắc thuộc `UC-04`, không có FR riêng trong bộ yêu cầu canonical hiện tại).<br>- Lộ trình bài học nâng cao và bài tập ngữ pháp chuyên sâu kèm quy tắc (`P1-FR-012`, `UC-05`, `BF-09`).<br>- Ôn tập ngắt quãng tự động theo thuật toán SRS 5 nấc chống quên từ vựng (`P1-FR-005`, `P1-FR-006`, `UC-06`, `BF-12`).<br>- Luyện viết câu theo tình huống (Scenario Writing) với phản hồi gợi ý sửa lỗi (`P1-FR-007`, `BF-14`). |
| **Người có quỹ thời gian hạn chế** *(Busy Professionals / Self-Learners)* | Thời gian tự học ngắn ($\le 5$ giờ/tuần), dễ bị gián đoạn công việc, cần học nhanh đúng vị trí. | - Thiết lập mục tiêu học tập linh hoạt theo số phút hàng ngày (5–120 phút) (`P1-FR-014`, `UC-02`, `BF-01`).<br>- Biểu ngữ nhắc nhở học tập trong ứng dụng (In-app Reminder) ưu tiên khung giờ tối/trưa (`P1-FR-015`, `UC-02`, `BF-01`).<br>- Duy trì động lực qua chuỗi ngày liên tục (Daily Streak) đơn giản, minh bạch (`P1-FR-011`, `UC-07`, `BF-13`).<br>- Theo dõi tiến độ bài học trực quan (`P1-FR-004`, `UC-07`, `BF-13`). |

Cần khẳng định rõ: Đây là các nhóm/ngữ cảnh sử dụng của `Learner`, không phải các system role độc lập. Mối liên kết `User group/context → need → existing function` trên đây giúp đáp ứng trọn vẹn yêu cầu phân hóa chức năng của giảng viên mà vẫn bảo toàn tính tinh gọn của kiến trúc 6 vai trò hệ thống.

### 1.6.1. Yêu cầu chức năng

Yêu cầu chức năng của Lingora được phân thành các nhóm nghiệp vụ tự nhiên bao quát trọn vẹn hành trình trải nghiệm của người học cũng như quy trình quản trị học liệu của đội ngũ cán bộ:

#### Nhóm Quản lý Tài khoản & Xác thực Phiên làm việc
- Người dùng có thể đăng ký tài khoản mới bằng địa chỉ email hợp lệ, thiết lập mật khẩu an toàn và đăng nhập vào hệ thống để nhận phiên làm việc bảo mật thông qua cookie máy chủ (`httpOnly`).
- Hệ thống hỗ trợ quy trình khôi phục mật khẩu thông qua liên kết xác thực gửi tới email đăng ký, tự động làm mới mã thông báo truy cập khi hết hạn, và cho phép đăng xuất an toàn để hủy bỏ toàn bộ phiên làm việc cục bộ (`P1-FR-001`, liên kết `MVP-01`, `UC-01`, `BF-01`).
- Người học có thể thiết lập và điều chỉnh mục tiêu học tập hàng ngày (tính theo số phút, từ 5 đến 120 phút), chọn ngôn ngữ giao diện (`vi` hoặc `en`) và kích hoạt biểu ngữ nhắc nhở học tập trong ứng dụng (`P1-FR-014`, `P1-FR-015`, liên kết `MVP-02`, `UC-02`).

#### Nhóm Đánh giá Chẩn đoán & Điểm xuất phát
- Người học mới có thể lựa chọn làm bài đánh giá chẩn đoán đầu vào thích ứng hai giai đoạn (Stage-Adaptive Diagnostic Assessment) bao phủ 4 chiều năng lực cốt lõi (Từ vựng, Ngữ pháp, Đọc hiểu, Nghe hiểu) hoặc lựa chọn cấp độ tự khai báo ban đầu để nhận khuyến nghị về bài học xuất phát (`Starting Unit`) theo bảng quy đổi Placement Mapping A (`P1-FR-016`, liên kết `MVP-03`, `UC-03`, `BF-08`).
- Hệ thống nghiêm ngặt tách biệt giữa cấp độ tự khai báo chưa kiểm chứng (`selfReportedLevel / UNVERIFIED`) và năng lực thực tế đã qua đánh giá (`verifiedProficiency`), đồng thời hỗ trợ người học thi lại bài chẩn đoán từ trang hồ sơ cá nhân.

#### Nhóm Học tập & Bài tập Tương tác
- Người học có thể duyệt danh mục cây chương trình học tập (Khóa học $\rightarrow$ Đơn vị bài học Unit $\rightarrow$ Bài học nhỏ Lesson) và theo dõi trạng thái khóa/mở của từng bài học (`P1-FR-002`, liên kết `MVP-04`, `UC-04`).
- Người học tham gia thực hiện các bài học vi mô thời lượng 5–10 phút bao gồm danh mục từ vựng chuẩn hóa kèm âm thanh phát âm bản xứ và hoàn thành các dạng bài tập tương tác. Hệ thống mục tiêu hỗ trợ 5 dạng bài tập cốt lõi (MCQ, FILL_BLANK, REORDER, GRAMMAR, LISTENING); trong đó schema cơ sở dữ liệu hiện tại (`CURRENT`) đã áp dụng 3 dạng cơ bản (MCQ, FILL_BLANK, REORDER), còn 2 dạng bài LISTENING và GRAMMAR thuộc phần thiết kế mở rộng (`TARGET`) (`P1-FR-003`, `P1-FR-012`, `P1-FR-013`, liên kết `MVP-05`, `MVP-06`, `UC-05`, `BF-09`).
- Hệ thống lập tức cung cấp phản hồi đúng/sai và hiển thị câu giải thích đáp án ngắn gọn đã được kiểm duyệt cho từng câu hỏi sau khi nộp bài (`MVP-07`, `UC-05`).
- Hệ thống kích hoạt cơ chế làm lại câu sai có kiểm soát (Controlled Retry) ở cuối bài học với hạn mức tối đa 10% nội dung và ghi nhận trần điểm tín chỉ 70% khi trả lời đúng (`BF-10`).
- Người học có thể thực hiện bài kiểm tra vượt cấp nhảy bài (Conditional Jump) đối với Unit kế cận khi đáp ứng điều kiện đạt điểm số $\ge 95\%$, ghi nhận trạng thái bỏ qua có nguồn gốc kiểm tra và kích hoạt thời gian chờ 24 giờ nếu không đạt (Conditional Jump là quy tắc thuộc `UC-04` / `BF-11`, liên kết `MVP-04` và được đặc tả bởi Policy D5; bộ yêu cầu chức năng canonical hiện tại không cấp một P1-FR riêng cho quy tắc này).

#### Nhóm Ôn tập Ngắt quãng (SRS)
- Hệ thống tự động theo dõi các từ vựng trong các bài học đã hoàn thành và lên lịch nhắc ôn tập theo thuật toán ngắt quãng tất định với chuỗi chu kỳ 5 nấc tăng dần: 1 ngày $\rightarrow$ 3 ngày $\rightarrow$ 7 ngày $\rightarrow$ 14 ngày $\rightarrow$ 30 ngày (`P1-FR-005`, liên kết `MVP-09`, `UC-06`, `BF-12`).
- Thao tác nộp bài ôn tập của học viên được cập nhật nguyên tử vào thẻ ôn tập và nhật ký lịch sử thông qua thủ tục lưu trữ an toàn phía máy chủ cơ sở dữ liệu (`P1-FR-006`).

#### Nhóm Tiến độ Học tập & Động lực
- Hệ thống ghi nhận tiến trình bài học (`NOT_STARTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`) và lưu vết lịch sử học tập cá nhân độc lập với cấp độ năng lực tổng thể (`P1-FR-004`, liên kết `MVP-08`, `UC-07`).
- Hệ thống tự động đánh giá và tính toán chuỗi ngày học tập liên tục (Streak) dựa trên ngày lịch địa phương theo múi giờ `Asia/Ho_Chi_Minh`; chuỗi ngày tăng tối đa 1 lần mỗi ngày khi có hoạt động học tập hợp lệ và tự động đặt lại về 1 nếu bị gián đoạn từ 1 ngày trở lên (`P1-FR-011`, liên kết `MVP-10`, `UC-07`, `BF-13`).
- Người học có thể xem báo cáo cá nhân tổng hợp số bài học đã hoàn thành, độ chính xác trung bình, thời gian tự học và biểu đồ hồ sơ kỹ năng (`MVP-11`, `UC-07`).

#### Nhóm Biên soạn, Kiểm duyệt & Xuất bản Học liệu
- Người quản lý đào tạo có thể thiết lập khung chương trình khóa học, tạo cấu trúc các Unit (`UC-10`, `BF-02`) và phân công biên soạn từng bài học cho Soạn giả (`UC-08`, `BF-03`, liên kết `MVP-12`).
- Soạn giả có thể khởi tạo bản nháp bài học, nhập danh mục từ vựng, tải lên tệp âm thanh chuẩn, tạo 5 dạng bài tập tương tác kèm lời giải thích, xem trước giao diện và gửi bài học lên hàng đợi kiểm duyệt (`P1-FR-008`, `P1-FR-009`, liên kết `MVP-05`, `MVP-12`, `UC-08`, `BF-03`, `BF-04`).
- Kiểm duyệt viên độc lập có quyền thẩm định bài học trên hàng đợi, phê duyệt đạt chuẩn hoặc gửi yêu cầu chỉnh sửa kèm lý do chi tiết; tuyệt đối không thể tự duyệt bài do chính mình biên soạn (`MVP-13`, `UC-09`, `BF-05`, `BF-06`).
- Người quản lý đào tạo có quyền xuất bản các bài học đã được phê duyệt ra danh mục người học khi và chỉ khi toàn bộ 4/4 bài học thuộc Unit cấu thành đều đạt trạng thái sẵn sàng (`MVP-13`, `UC-10`, `BF-07`).
- Quản trị viên hệ thống có quyền xuất bản khẩn cấp bài học trong trường hợp bất khả kháng, với điều kiện tiên quyết là bài học đó bắt buộc đã được Kiểm duyệt viên phê duyệt đạt chất lượng học thuật và hành động phải đi kèm lý do giải trình lưu vào nhật ký kiểm toán (`ADR-020`).

#### Nhóm Quản trị Vận hành & Hỗ trợ
- Quản trị viên hệ thống có quyền quản trị danh mục tài khoản, kích hoạt, đình chỉ tài khoản và gán vai trò người dùng tuân thủ nguyên tắc đặc quyền tối thiểu (`P1-FR-008`, liên kết `MVP-14`, `UC-11`).
- Quản trị viên có quyền tra cứu nhật ký kiểm toán an ninh bất biến ghi nhận mọi thao tác nhạy cảm của hệ thống và xem các báo cáo thống kê vận hành tổng hợp (`MVP-15`, `MVP-19`, liên kết `UC-12`, `UC-13`).
- Nhân viên hỗ trợ vận hành có quyền tiếp nhận phiếu yêu cầu hỗ trợ từ người học, tra cứu thông tin học tập cần thiết và điều phối xử lý sự cố (`MVP-16`, liên kết `UC-14`, `BF-15`).

[BẢNG 1.5 — Ma trận tổng hợp yêu cầu chức năng phần mềm (Functional Requirements)]

| Mã Yêu cầu | Tên Yêu cầu Chức năng | Phân loại | Chức năng MVP | Use Case | Behavioral Family |
|---|---|:---:|:---:|:---:|:---:|
| **P1-FR-001** | Xác thực người dùng, quản lý phiên và phục hồi mật khẩu | Must / P1 | `MVP-01` | `UC-01` | `BF-01` |
| **P1-FR-002** | Duyệt danh mục khóa học, bài học và nghe âm thanh từ vựng | Must / P1 | `MVP-04` | `UC-04` | `BF-09` |
| **P1-FR-003** | Làm 5 dạng bài tập tương tác (MCQ, FILL, REORDER, GRAMMAR, LISTENING)<br>*(Mục tiêu 5 dạng bài; schema CURRENT áp dụng 3 dạng, GRAMMAR và LISTENING thuộc thiết kế mở rộng TARGET)* | Must / P1 | `MVP-05`, `06` | `UC-05` | `BF-09` |
| **P1-FR-004** | Theo dõi và cập nhật trạng thái tiến độ bài học | Must / P1 | `MVP-08` | `UC-07` | `BF-13` |
| **P1-FR-005** | Ôn tập từ vựng theo lịch ngắt quãng tất định (SRS Policy B) | Must / P1 | `MVP-09` | `UC-06` | `BF-12` |
| **P1-FR-006** | Ghi nhận kết quả ôn tập nguyên tử qua thủ tục lưu trữ CSDL | Must / P1 | `MVP-09` | `UC-06` | `BF-12` |
| **P1-FR-007** | Luyện viết câu theo tình huống và nhận gợi ý sửa lỗi từ dịch vụ AI hỗ trợ (Scenario Writing)<br>*(Bảng `chat_scenarios` đã có trong schema CURRENT hỗ trợ prompt tĩnh; hành vi nghiệp vụ hoàn chỉnh thuộc thiết kế mục tiêu TARGET)* | Must / P1 | Phụ trợ | – | `BF-14` |
| **P1-FR-008** | Quản trị học liệu, phân quyền tài khoản theo 6 vai trò | Must / P1 | `MVP-12`, `14` | `UC-08`, `11` | `BF-03`, `BF-04` |
| **P1-FR-009** | Tải lên và quản lý tệp đa phương tiện (âm thanh/ảnh) qua vùng lưu trữ riêng | Must / P1 | `MVP-12` | `UC-08` | `BF-04` |
| **P1-FR-010** | Hỗ trợ chuyển đổi song ngữ giao diện người dùng (Mặc định Tiếng Việt) | Must / P1 | `MVP-02` | `UC-02` | `BF-01` |
| **P1-FR-011** | Duy trì động lực học tập qua cơ chế chuỗi ngày liên tục (Daily Streak) | Must / P1 | `MVP-10` | `UC-07` | `BF-13` |
| **P1-FR-012** | Thực hiện bài tập ngữ pháp chuyên sâu kèm giải thích quy tắc<br>*(Thuộc nhóm 5 dạng bài thiết kế mục tiêu TARGET)* | Must / P1 | `MVP-06` | `UC-05` | `BF-09` |
| **P1-FR-013** | Thực hiện bài tập nghe nhận diện từ vựng gắn với âm thanh chuẩn<br>*(Thuộc nhóm 5 dạng bài thiết kế mục tiêu TARGET)* | Must / P1 | `MVP-06` | `UC-05` | `BF-09` |
| **P1-FR-014** | Thiết lập và quản lý mục tiêu học tập hàng ngày theo số phút | Must / P1 | `MVP-02` | `UC-02` | `BF-01` |
| **P1-FR-015** | Nhắc nhở học tập trong ứng dụng (In-app Reminder) theo cửa sổ thời gian | Must / P1 | `MVP-02` | `UC-02` | `BF-01` |
| **P1-FR-016** | Đánh giá chẩn đoán thích ứng đầu vào hoặc chọn cấp độ tự khai báo | Must / P1 | `MVP-03` | `UC-03` | `BF-08` |
| **P1-FR-017** | Hệ thống huy hiệu và danh hiệu cá nhân [HOÃN LẠI NGOÀI CORE MVP] | Nice / P2 | Mở rộng | – | – |

### 1.6.2. Yêu cầu phi chức năng

Để đảm bảo tính khả thi kỹ thuật và chuẩn mực học thuật, báo cáo phân định rạch ròi giữa ba khái niệm: **Yêu cầu kỹ thuật bắt buộc (Requirement)**, **Mục tiêu thiết kế hướng tới (Design Target)**, và **Kết quả đo đạc thực nghiệm (Measured Result)**. Báo cáo tuyệt đối không đánh tráo các mục tiêu thiết kế thành kết quả đo đạc khi hệ thống chưa bước vào giai đoạn kiểm thử vận hành thực tế. Cùng tinh thần đó, các gate D-G4, D-G5 và D-G6 được dùng để kiểm tra tính nhất quán của bộ thiết kế và bằng chứng đi kèm tại milestone M2 (D-G4: bao phủ UC/BF, D-G5: kiến trúc và API, D-G6: ranh giới an ninh và kiểm toán). Kết quả PASS chỉ phản ánh phạm vi kiểm định thiết kế của milestone, chưa phải nghiệm thu vận hành production.

#### Nhóm Bảo mật & Ranh giới Ủy quyền (Security & Authorization Boundary)
- **Yêu cầu (Requirement - P1-NFR-001):** Hệ thống phải bảo vệ dữ liệu người học theo cơ chế cô lập tuyệt đối; người học chỉ được phép truy xuất và sửa đổi dữ liệu thuộc quyền sở hữu của chính mình. Quyền hạn của các vai trò nội bộ phải được kiểm soát chặt chẽ ở cả tầng ứng dụng (Application Layer) và tầng cơ sở dữ liệu (Database RLS). Máy chủ AI hỗ trợ hoàn toàn không được cấp quyền kết nối trực tiếp hoặc sở hữu dữ liệu chính của hệ thống.
- **Mục tiêu thiết kế (Design Target):** 100% các truy vấn dữ liệu từ phía người học đều đi qua bộ lọc chính sách Row Level Security (RLS) của PostgreSQL; mã khóa đặc quyền `SUPABASE_SERVICE_ROLE_KEY` bị cách ly hoàn toàn khỏi môi trường chạy của ứng dụng người học.
- **Hiện trạng kiểm định:** Đã được kiểm chứng về mặt logic thiết kế tại cổng kiểm định kiến trúc D-G6; kết quả đo đạc tải thực tế thuộc về giai đoạn kiểm thử Phase 2.

#### Nhóm Tính Khả dụng & Suy thoái An toàn (Availability & Graceful Degradation)
- **Yêu cầu (Requirement - P1-NFR-002):** Toàn bộ tiến trình học tập cốt lõi (xem lộ trình, học bài vi mô, làm bài tập tương tác, ôn tập ngắt quãng SRS) phải duy trì hoạt động bình thường và ổn định ngay cả trong tình huống dịch vụ AI hỗ trợ bên ngoài bị mất kết nối, quá tải hoặc phản hồi chậm.
- **Mục tiêu thiết kế (Design Target):** Thiết lập rào chắn ngắt mạch (Circuit Breaker) và giới hạn thời gian chờ tối đa 8.0 giây (hard timeout) tại tầng BFF trung gian. Khi dịch vụ AI gặp sự cố, hệ thống tự động suy thoái chức năng an toàn (graceful fallback), hiển thị thông báo thân thiện và bảo toàn bài viết của người học mà không gây treo giao diện hay crash ứng dụng.
- **Hiện trạng kiểm định:** Đã kiểm định cơ chế ngắt mạch trên môi trường giả lập; đo đạc độ sẵn sàng hệ số 99.9% là mục tiêu vận hành dài hạn.

#### Nhóm Tính Tương thích Giao tiếp & Mở rộng (Contract Compatibility)
- **Yêu cầu (Requirement - P1-NFR-003):** Toàn bộ cấu trúc giao tiếp dữ liệu giữa các phân hệ phải tuân thủ nghiêm ngặt hợp đồng API gốc. Định dạng trao đổi dữ liệu duy trì chuẩn `snake_case` đối với các giao tiếp ngoài và đảm bảo tính tương thích ngược khi nâng cấp phiên bản mô hình.
- **Mục tiêu thiết kế (Design Target):** Mọi phản hồi thành công từ dịch vụ suy luận AI đều bắt buộc chứa siêu dữ liệu viễn trắc gồm định danh phiên bản mô hình (`model_version`) và cờ chỉ báo môi trường giả lập (`is_mock`).

#### Nhóm Trải nghiệm Người dùng & Giao diện Đa thiết bị (Responsive States)
- **Yêu cầu (Requirement - P1-NFR-004):** Mọi màn hình chức năng thuộc phạm vi cốt lõi của phân hệ người học và phân hệ quản trị phải hiển thị đầy đủ và tường minh 4 trạng thái giao diện chuẩn: Trạng thái đang tải dữ liệu (Loading), Trạng thái dữ liệu rỗng (Empty), Trạng thái phát sinh lỗi kèm hướng dẫn phục hồi (Error), và Trạng thái hiển thị dữ liệu thành công (Success). Giao diện người học phải vận hành linh hoạt và tương thích hoàn toàn trên cả thiết bị di động (Mobile) và máy tính để bàn (Desktop).
- **Mục tiêu thiết kế (Design Target):** Đạt chuẩn thiết kế Mobile-First cho ứng dụng người học và Desktop-Optimized cho cổng thông tin quản trị học liệu phức tạp.

[BẢNG 1.6 — Bảng phân định yêu cầu phi chức năng (Non-Functional Requirements)]

| Mã Yêu cầu | Danh mục NFR | Bản chất Yêu cầu (Requirement) | Mục tiêu Thiết kế (Design Target) | Trạng thái Hiện tại (Status) |
|---|---|---|---|:---:|
| **P1-NFR-001** | Ranh giới an ninh & RLS | Cô lập dữ liệu người học qua `auth.uid() = user_id`; cấm AI truy cập DB. | Chặn 100% truy cập chéo dữ liệu; bảo vệ khóa đặc quyền Service Role. | Đạt kiểm định thiết kế (D-G6)\* |
| **P1-NFR-002** | Khả năng tự phục hồi | Luồng học và SRS chạy độc lập 100% khi AI gặp sự cố hoặc timeout. | Timeout cứng 8.0s tại BFF; cơ chế suy thoái tính năng an toàn. | Đạt kiểm định thiết kế (D-G5)\* |
| **P1-NFR-003** | Chuẩn hóa API Contract | Giữ chuẩn JSON `snake_case`, tương thích ngược hợp đồng API. | Trả về đủ siêu dữ liệu viễn trắc `model_version`, `is_mock`, `latency_ms`. | Đạt kiểm định thiết kế (D-G5)\* |
| **P1-NFR-004** | Trạng thái hiển thị UI | Bao phủ đủ 4 trạng thái (Loading, Empty, Error, Success) trên mọi màn hình. | Tương thích giao diện đa thiết bị từ Mobile đến Desktop. | Đạt kiểm định thiết kế (D-G4)\*

\* *PASS ở phạm vi kiểm định thiết kế theo M2.5 (D-G5/D-G6 ở mức design evidence); chưa đồng nghĩa với nghiệm thu production.*

---

# CHƯƠNG II — PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### Quy ước trạng thái thiết kế trong tài liệu

Để đảm bảo tính nhất quán và minh bạch học thuật, các quyết định, tham số và bề mặt giao tiếp trong Chương II được chuẩn hóa theo ba trạng thái tài liệu:
1. **`[ĐÃ CHỐT]` (Locked Canonical):** Thiết kế, hợp đồng API hoặc quyết định kiến trúc đã được phê duyệt chính thức và đóng băng làm căn cứ triển khai bất biến (ví dụ: các endpoint dịch vụ AI trong `docs/03-api-contract.md`, chuỗi chu kỳ SRS `[1, 3, 7, 14, 30]`, ngưỡng Jump $\ge 95\%$, ma trận SoD).
2. **`[ĐỀ XUẤT]` (Proposed / Pending Validation):** Các tham số sư phạm, quy mô bài thi thích ứng hoặc ngưỡng chuyển đổi năng lực còn ở trạng thái mở thiết kế, chờ kiểm chứng và đo đạc thực nghiệm trong Phase 2 (ví dụ: quy mô câu hỏi bài chẩn đoán ~25–30 câu, ngưỡng điểm phân định LevelReadiness).
3. **`[MINH HỌA]` (Illustrative Example — Not Locked):** Các ví dụ cú pháp đường dẫn (route examples), cấu trúc URL nội bộ hoặc mẫu thông điệp tại tầng BFF, phục vụ hình dung trực quan luồng giao tiếp chứ không phải hợp đồng giao diện khóa cứng.

## 2.1. Các tác nhân của hệ thống

Trong kỹ nghệ phần mềm, việc xác định chính xác các tác nhân (Actors) tương tác với hệ thống là bước khởi đầu mang tính quyết định nhằm thiết lập ranh giới trách nhiệm, phạm vi phân quyền và luồng dữ liệu an toàn. Nền tảng Lingora chuẩn hóa chính xác sáu nhóm tác nhân người dùng nghiệp vụ. Mỗi tác nhân đại diện cho một vai trò thực tế cụ thể trong hệ sinh thái đào tạo và vận hành:

Thứ nhất là **Người học (Learner)**. Đây là tác nhân trung tâm của phân hệ học tập trực tuyến, đại diện cho học sinh, sinh viên và người tự học ngoại ngữ. Người học tương tác chủ yếu qua cổng ứng dụng Web người học (`lingora-web`). Trách nhiệm của Người học bao gồm: lựa chọn ngôn ngữ mục tiêu, thiết lập mục tiêu thời gian học hàng ngày, tham gia làm bài đánh giá chẩn đoán đầu vào để xác định lộ trình, học các bài học vi mô, làm bài tập tương tác, thực hiện các phiên ôn tập ngắt quãng (SRS), rèn luyện viết câu tình huống và theo dõi tiến trình cùng chuỗi ngày học liên tục (Streak). Về mặt an ninh, Người học tuyệt đối không có quyền can thiệp vào cấu trúc học liệu, không có quyền duyệt bài và bị ngăn chặn hoàn toàn trong việc truy cập dữ liệu học tập cá nhân của người học khác.

Thứ hai là **Soạn giả học liệu (Lesson Creator)**. Tác nhân này đại diện cho giáo viên ngôn ngữ, chuyên viên phát triển nội dung hoặc cộng tác viên học liệu được cấp tài khoản tác nghiệp trên cổng quản trị (`lingora-admin`). Trách nhiệm của Soạn giả là tiếp nhận các bài học được phân công biên soạn, nhập danh mục từ vựng, phiên âm, ngữ nghĩa tiếng Việt, câu ví dụ mẫu, tải lên tệp âm thanh phát âm chuẩn bản xứ, xây dựng 5 dạng bài tập tương tác chuẩn kèm lời giải thích đáp án ngắn gọn và nộp bài lên hàng duyệt. Hành vi bị nghiêm cấm đối với Soạn giả là không được tự ý xuất bản bài học ra môi trường học tập và tuyệt đối không được tự phê duyệt bài học do chính mình biên soạn.

Thứ ba là **Kiểm duyệt viên (Moderator)**. Tác nhân này đại diện cho các chuyên gia thẩm định ngôn ngữ hoặc tổ trưởng chuyên môn sư phạm. Tương tác qua cổng quản trị, Kiểm duyệt viên có trách nhiệm tiếp nhận bài học trên hàng đợi, thẩm định tính chính xác của ngữ liệu, nghe và kiểm tra chất lượng của 100% tệp âm thanh, rà soát tính hợp lý của các câu hỏi bài tập và lời giải thích. Kiểm duyệt viên đưa ra quyết định phê duyệt bài học đạt chuẩn hoặc yêu cầu chỉnh sửa kèm nhận xét chi tiết. Về ranh giới an ninh, Kiểm duyệt viên không được phép xuất bản bài học ra ngoài hệ thống và không được duyệt các bài do chính mình biên soạn (trong trường hợp kiêm nhiệm).

Thứ tư là **Người quản lý đào tạo (Organizational Manager)**. Đại diện cho lãnh đạo tổ chức giáo dục hoặc trưởng ban phát triển chương trình. Tác nhân này chịu trách nhiệm khởi tạo khung chương trình khóa học, thiết lập các Đơn vị bài học (Unit), giao bài học cho Soạn giả, theo dõi tiến độ hoàn thành nội dung và thực hiện xuất bản chính thức các bài học đã qua kiểm duyệt ra môi trường người học. Người quản lý đào tạo không trực tiếp tham gia khâu thẩm định chi tiết của Kiểm duyệt viên và không được xuất bản bài học chưa qua phê duyệt.

Thứ năm là **Nhân viên hỗ trợ vận hành (Operations Staff)**. Đại diện cho đội ngũ kỹ thuật viên và chăm sóc khách hàng. Tác nhân này có trách nhiệm tiếp nhận các phiếu phản ánh sự cố hoặc thắc mắc từ người học, phân loại khiếu nại liên quan đến lỗi kỹ thuật hoặc học liệu để điều phối xử lý, và hỗ trợ giải đáp người dùng. Nhân viên vận hành chỉ được cấp quyền tra cứu các thông tin học tập cần thiết ở mức tối thiểu, tuyệt đối không được phép chỉnh sửa nội dung bài học hay can thiệp vào cơ sở dữ liệu.

Thứ sáu là **Quản trị viên hệ thống (Administrator)**. Đại diện cho kỹ sư an ninh và quản trị hạ tầng nền tảng. Quản trị viên nắm giữ quyền hạn cao nhất về quản trị tài khoản, phân quyền vai trò cho các cán bộ, giám sát an toàn hệ thống, cấu hình tham số vận hành và tra cứu nhật ký kiểm toán bất biến. Trong các tình huống bất khả kháng (như người quản lý vắng mặt dài ngày cần phát hành gấp bài học), Quản trị viên có thẩm quyền xuất bản khẩn cấp nhưng bắt buộc bài học đó phải đạt trạng thái đã duyệt và phải nhập lý do giải trình để lưu vết kiểm toán.

Về mặt kiến trúc, tài khoản **Đặc quyền dịch vụ hạ tầng (Privileged Service Role)** trong hệ thống không phải là một tác nhân người dùng nghiệp vụ. Đây là một ranh giới kỹ thuật tự động hóa được sử dụng nội bộ bởi các tập lệnh di trú dữ liệu (migration scripts) hoặc công cụ bảo trì hệ thống. Kiến trúc Lingora cấm tuyệt đối việc sử dụng Privileged Service Role thay thế cho các tác nhân người dùng thông thường trong các luồng nghiệp vụ hàng ngày.

[BẢNG 2.1 — Danh mục tác nhân và vai trò trách nhiệm trong hệ thống Lingora]

| Tác nhân (Actor) | Bản chất thực tế | Phân hệ tương tác chính | Trách nhiệm cốt lõi | Hành vi bị nghiêm cấm tuyệt đối |
|---|---|---|---|---|
| **Người học** *(Learner)* | Học sinh, sinh viên, người tự học ngôn ngữ | Ứng dụng Web người học (`lingora-web`) | Tự học bài vi mô, làm bài tập tương tác, ôn tập ngắt quãng SRS, theo dõi tiến độ và chuỗi ngày. | Can thiệp sửa đổi học liệu; xem dữ liệu cá nhân của học viên khác. |
| **Soạn giả học liệu** *(Lesson Creator)* | Giáo viên, chuyên viên nội dung học liệu | Cổng quản trị tác nghiệp (`lingora-admin`) | Soạn thảo từ vựng, chuẩn bị tệp âm thanh chuẩn, tạo 5 dạng bài tập tương tác kèm lời giải thích, nộp duyệt. | Tự phê duyệt bài học của mình; tự ý xuất bản bài học ra môi trường học viên. |
| **Kiểm duyệt viên** *(Moderator)* | Chuyên gia thẩm định ngôn ngữ, sư phạm | Cổng quản trị tác nghiệp (`lingora-admin`) | Thẩm định độc lập nội dung, nghe thử 100% âm thanh, duyệt bài hoặc yêu cầu chỉnh sửa kèm lý do. | Tự duyệt bài do mình soạn; tự ý xuất bản bài học ra ngoài danh mục. |
| **Người quản lý đào tạo** *(Organizational Manager)* | Cán bộ quản lý chương trình, đào tạo | Cổng quản trị tác nghiệp (`lingora-admin`) | Lập kế hoạch khung khóa học/Unit, giao bài cho Soạn giả, xuất bản Unit khi đủ 4/4 bài học đã duyệt. | Xuất bản bài chưa qua kiểm duyệt; tự ý chỉnh sửa nội dung bài đã xuất bản. |
| **Nhân viên vận hành** *(Operations Staff)* | Đội ngũ kỹ thuật viên, chăm sóc học viên | Cổng quản trị tác nghiệp (`lingora-admin`) | Tiếp nhận phiếu phản ánh sự cố, tra cứu dữ liệu tối thiểu, điều phối xử lý thắc mắc của người học. | Can thiệp chỉnh sửa cơ sở dữ liệu học liệu; tiết lộ thông tin người học. |
| **Quản trị viên** *(Administrator)* | Kỹ sư kỹ thuật quản trị hệ thống nền tảng | Cổng quản trị tác nghiệp (`lingora-admin`) | Quản trị tài khoản, phân quyền 6 vai trò, tra cứu nhật ký kiểm toán, xuất bản khẩn cấp có điều kiện. | Tự ý sửa đổi nội dung học liệu; xóa hoặc làm sai lệch nhật ký kiểm toán. |

---

## 2.2. Sơ đồ Use Case

Sơ đồ Use Case cung cấp góc nhìn tổng thể về chức năng hệ thống từ lăng kính của các tác nhân bên ngoài, làm rõ sự tương tác giữa người dùng và các dịch vụ mà hệ thống Lingora cung cấp.

### 2.2.1. Sơ đồ Use Case tổng quát

Hệ thống Lingora chuẩn hóa chính xác 15 Use Cases (`UC-01` đến `UC-15`) được tổ chức thành các gói chức năng chặt chẽ. Sơ đồ Use Case tổng quát thể hiện đầy đủ các nghiệp vụ từ phân hệ người học đến phân hệ quản trị và vận hành học liệu:

```text
[HÌNH 2.1 — Sơ đồ Use Case tổng quát của hệ thống Lingora]
Nguồn tham chiếu: docs/plantuml/uc-overview-m22.puml
```

### 2.2.2. Các nhóm chức năng chính

Thay vì phân rã tài liệu thành các mục nhỏ rời rạc, 15 Use Cases của Lingora được phân bổ thành 4 nhóm nghiệp vụ chính:
1. **Nhóm Học tập Cốt lõi (Learner Core):** Bao gồm các chức năng phục vụ hành trình tiếp thu ngôn ngữ của học viên (`UC-01` đến `UC-07`).
2. **Nhóm Vòng đời Quản trị Nội dung (Content Workflow):** Quản lý quy trình từ soạn thảo, kiểm duyệt độc lập đến xuất bản bài học (`UC-08` đến `UC-10`).
3. **Nhóm Quản trị & Vận hành Hệ thống (Administration & Operations):** Đảm bảo an toàn tài khoản, phân quyền, báo cáo vận hành, kiểm toán và hỗ trợ người học (`UC-11` đến `UC-14`).
4. **Nhóm Phân hệ Nhóm Tổ chức Mở rộng (Optional B2B Cohort Extension):** Hỗ trợ quản lý lớp học và tiến độ đào tạo tập trung theo nhóm người dùng (`UC-15`). Phân hệ này được xếp loại chính thức là ranh giới mở rộng trong tương lai (Future Extension Boundary), không thuộc phạm vi bắt buộc của phiên bản MVP.

[BẢNG 2.2 — Danh mục 15 Use Cases của hệ thống Lingora]

| Mã Use Case | Tên Use Case | Tác nhân chính | Gói chức năng | Chức năng MVP liên kết | Mô tả tóm tắt nghiệp vụ |
|:---:|---|---|---|:---:|---|
| **UC-01** | Authenticate & Manage Session | Learner, Administrator | Core Learning / Admin | `MVP-01` | Xác thực danh tính người dùng qua email/mật khẩu, cấp phát phiên cookie an toàn (`httpOnly`), khôi phục mật khẩu. |
| **UC-02** | Configure Goals & Study Time | Learner | Core Learning | `MVP-02`, `10` | Cài đặt mục tiêu số phút học mỗi ngày (5–120 phút), chọn ngôn ngữ giao diện và kích hoạt nhắc nhở học tập. |
| **UC-03** | Take Diagnostic Assessment / Select Level | Learner | Core Learning | `MVP-03` | Thực hiện bài đánh giá chẩn đoán thích ứng đầu vào hoặc chọn cấp độ tự khai báo để nhận khuyến nghị bài học xuất phát. |
| **UC-04** | Browse Learning Path | Learner | Core Learning | `MVP-04` | Duyệt danh mục khóa học, các Đơn vị bài học (Unit), bài học nhỏ (Lesson) và yêu cầu kiểm tra vượt cấp nhảy bài (Jump). |
| **UC-05** | Complete Lesson Exercises | Learner | Core Learning | `MVP-05, 06, 07` | Học từ vựng kèm âm thanh chuẩn, làm 5 dạng bài tập tương tác, nhận giải thích tức thì và thực hiện làm lại câu sai cuối bài. |
| **UC-06** | Spaced Repetition Review (SRS) | Learner | Core Learning | `MVP-09` | Thực hiện ôn tập các từ vựng đến hạn theo thuật toán ngắt quãng tất định 5 nấc, cập nhật trạng thái nguyên tử qua CSDL. |
| **UC-07** | Track Progress, Mastery & Readiness | Learner | Core Learning | `MVP-08, 10, 11` | Xem báo cáo tiến độ bài học, thống kê chuỗi ngày học liên tục (Streak), tỷ lệ chính xác và biểu đồ hồ sơ kỹ năng cá nhân. |
| **UC-08** | Create & Edit Lesson Draft | Lesson Creator | Content Workflow | `MVP-05`, `12` | Khởi tạo bản nháp bài học, nhập từ vựng, tải tệp âm thanh, tạo 5 dạng bài tập kèm giải thích và gửi yêu cầu kiểm duyệt. |
| **UC-09** | Review & Moderate Content | Moderator | Content Workflow | `MVP-07, 13` | Thẩm định độc lập chất lượng học liệu, nghe thử âm thanh, phê duyệt bài học đạt chuẩn hoặc yêu cầu chỉnh sửa kèm lý do. |
| **UC-10** | Publish Approved Content | Organizational Manager | Content Workflow | `MVP-13` | Xuất bản bài học đã được phê duyệt ra danh mục người học khi Unit đạt đủ điều kiện 4/4 bài học hoàn tất. |
| **UC-11** | Manage Accounts & Roles | Administrator | Admin & Operations | `MVP-14, 19` | Quản lý danh mục tài khoản, kích hoạt, khóa/đình chỉ tài khoản và phân quyền người dùng tuân thủ 6 vai trò. |
| **UC-12** | View System Reports | Administrator | Admin & Operations | `MVP-15` | Xem các chỉ số thống kê vận hành hệ thống: số người dùng tích cực, tỷ lệ hoàn thành bài học, tỷ lệ duy trì học tập. |
| **UC-13** | View & Audit Security Logs | Administrator | Admin & Operations | `MVP-19` | Tra cứu chuỗi sự kiện kiểm toán an ninh bất biến ghi nhận mọi thao tác nhạy cảm, phát hiện các hành vi bất thường. |
| **UC-14** | Handle Support Tickets | Operations Staff | Admin & Operations | `MVP-16` | Tiếp nhận phản ánh sự cố từ người học, phân loại yêu cầu, cập nhật tiến độ xử lý và phản hồi kết quả hỗ trợ. |
| **UC-15** | [OPTIONAL / FUTURE] Manage Cohorts & Groups | Organizational Manager | Optional Cohort Module | `MVP-17` | Quản lý danh sách lớp học, thêm thành viên theo nhóm tổ chức và theo dõi báo cáo tiến độ học tập tập trung. |

---

## 2.3. Phân tích luồng nghiệp vụ

Trước khi biểu diễn chi tiết qua các sơ đồ tương tác kỹ thuật, các luồng nghiệp vụ cốt lõi của Lingora cần được phân tích và làm sáng tỏ về mặt logic vận hành.

### 2.3.1. Hành trình học tập của người học

Hành trình học tập của người học trên Lingora được thiết kế khép kín theo chu trình phản hồi liên tục, tối ưu hóa khả năng hấp thu kiến thức tự nhiên và duy trì động lực bền vững:

```text
Đăng nhập & Khởi tạo phiên
        ↓
Xác định điểm xuất phát (Đánh giá chẩn đoán đầu vào hoặc Tự khai báo)
        ↓
Truy cập Lộ trình học tập (Cây Course → Unit → Lesson)
        ↓
Học bài học vi mô (Tiếp thu từ vựng & Nghe phát âm chuẩn)
        ↓
Làm 5 dạng bài tập tương tác (MCQ, FILL, REORDER, GRAMMAR, LISTENING)
        ↓
Nhận phản hồi tức thì & Lời giải thích quy tắc sư phạm
        ↓
Làm lại câu sai có kiểm soát ở cuối bài (Controlled Retry trần 70% credit)
        ↓
Cập nhật Tiến độ bài học & Đánh giá chuỗi ngày học liên tục (Streak)
        ↓
Ôn tập ngắt quãng hàng ngày (SRS với chu kỳ 1 → 3 → 7 → 14 → 30 ngày)
```

Người học mở khóa bài đầu rồi tham gia bài học vi mô 5–10 phút: tiếp thu từ vựng theo ngữ cảnh kèm tệp âm thanh chuẩn, làm bài tập tương tác với phản hồi và giải thích tức thì. Câu sai được xử lý ngay cuối bài (§2.3.3); khi bài hoàn tất, hệ thống cập nhật tiến độ, đánh giá Streak và đưa từ mới vào lịch ôn tập SRS (§2.3.4).

### 2.3.2. Đánh giá chẩn đoán và xếp lớp đầu vào (Placement)

Một trong những sai lầm phổ biến của các ứng dụng học ngoại ngữ là bắt buộc mọi người học phải bắt đầu lại từ những bài học vỡ lòng sơ cấp, hoặc sử dụng các bài kiểm tra trắc nghiệm đơn giản rồi ngộ nhận kết quả đó là "chứng chỉ năng lực quốc tế". Hệ thống Lingora xử lý bài toán này thông qua cơ chế Đánh giá chẩn đoán đầu vào với sự phân định rạch ròi về mặt khái niệm:

Người học mới được quyền lựa chọn một trong hai nhánh khởi đầu linh hoạt:
- **Nhánh tự khai báo trình độ (Self-Reported Level Fallback):** Dành cho những người học muốn bắt đầu ngay mà không làm bài kiểm tra. Người học tự chọn trình độ của bản thân hoặc bấm Bỏ qua (Skip). Khi đó, hệ thống gán bài học xuất phát mặc định là Đơn vị bài học đầu tiên (`Unit 1`) và lưu trữ trạng thái năng lực là chưa kiểm chứng (`UNVERIFIED`).
- **Nhánh đánh giá chẩn đoán thích ứng hai giai đoạn (Stage-Adaptive Diagnostic Assessment):** Dành cho người học muốn xác định chính xác năng lực thực tế. Bài kiểm tra bao gồm:
  1. *Giai đoạn định tuyến (Routing Stage):* Khoảng 10–12 câu hỏi ở mức độ khó trung bình `[ĐỀ XUẤT — PENDING VALIDATION]` nhằm xác định phân dải năng lực sơ bộ của người học.
  2. *Giai đoạn phân nhánh mục tiêu (Targeted Stage):* Hệ thống tự động chuyển người học sang nhánh câu hỏi tương ứng với mức độ năng lực để đo đạc chuyên sâu 4 chiều năng lực cốt lõi gồm Từ vựng (Vocabulary), Ngữ pháp (Grammar), Đọc hiểu (Reading) và Nghe hiểu (Listening). Quy mô toàn bài dự kiến khoảng ~25–30 câu hỏi với thời gian hoàn thành dưới 15 phút để tránh gây mệt mỏi nhận thức `[ĐỀ XUẤT — PENDING VALIDATION]`.

Kết quả bài đánh giá được lưu trữ thành bản ghi bất biến `AssessmentResult` trong cơ sở dữ liệu và kết xuất ra hồ sơ kỹ năng đa chiều `SkillProfile` (hiển thị dưới dạng biểu đồ Radar 4 chiều), tuyệt đối không gộp thành một điểm số trung bình phẳng duy nhất.

Đối với bộ đề cương Tiếng Anh cơ bản (English A1), hệ thống áp dụng bảng quy đổi **Placement Mapping A** được phê duyệt chính thức bởi Product Owner để xác định Đơn vị bài học xuất phát (`Starting Unit`):

[BẢNG 2.3 — Bảng quy đổi điểm số Đánh giá chẩn đoán sang Đơn vị bài học xuất phát (Mapping A)]

| Tổng điểm đạt được (Thang 0–30) | Đơn vị bài học xuất phát (`Starting Unit`) | Căn cứ sư phạm gắn với Đề cương Tiếng Anh A1 |
|:---:|:---:|---|
| **0 – 7 điểm** | **Unit 1** (Greetings, Be-verb, Numbers 1–20) | Người học chưa làm chủ kiến thức nền tảng; bắt đầu từ vạch xuất phát. |
| **8 – 12 điểm** | **Unit 2** (Daily Routine, Have/Live/Like, Time) | Đã làm chủ kiến thức Unit 1; bỏ qua phần chào hỏi cơ bản. |
| **13 – 17 điểm** | **Unit 3** (Shopping, Quantifiers, a/an/some) | Đã nắm chắc kiến thức Unit 1–2; bắt đầu từ chủ đề mua sắm. |
| **18 – 22 điểm** | **Unit 4** (Directions, Prepositions in/on/at, Can) | Đã vượt qua kiến thức Unit 1–3; bắt đầu từ chủ đề chỉ đường, vị trí. |
| **23 – 26 điểm** | **Unit 5** (Routines, Simple Past Tense) | Nắm vững Unit 1–4; bắt đầu từ chủ đề quá khứ đơn và thói quen. |
| **27 – 30 điểm** | **Unit 6** (Future Plans, Invitations, Review) | Nắm chắc gần như toàn bộ đề cương A1; học Unit cuối và ôn tập qua SRS. |

Hệ thống cho phép người học thi lại bài đánh giá chẩn đoán (Retake) từ trang hồ sơ cá nhân bất cứ lúc nào. Ràng buộc bất biến của hệ thống: **Điểm xuất phát trên lộ trình không đồng nghĩa với trình độ năng lực chuẩn (`Starting Point ≠ Proficiency`)**. Việc một học viên được xếp vào Unit 3 chỉ có ý nghĩa về mặt sư phạm giúp học viên tiết kiệm thời gian, hoàn toàn không tương đương với việc học viên đã được cấp chứng nhận đạt trình độ tương ứng.

### 2.3.3. Cơ chế làm lại câu sai có kiểm soát (Controlled Retry)

Từ kết quả khảo sát về tâm lý "sợ sai" và tình trạng dồn ứ câu hỏi lỗi, Lingora thiết kế cơ chế làm lại câu sai có kiểm soát (Controlled Retry) với các nguyên tắc nghiệp vụ cụ thể:

Hạn mức làm lại câu sai (allowance) trong một phiên bài học được tính toán tự động theo công thức toán học chặt chẽ:
$$\text{allowance} = \max(1, \lfloor N \cdot 0.10 \rfloor)$$
Trong đó $N$ là tổng số câu hỏi bài tập tương tác trong bài học. Ví dụ, với một attempt gồm 5 câu hỏi, allowance = max(1, floor(5 × 0.10)) = 1. Đây chỉ là ví dụ minh họa công thức, không phải quy định số câu hỏi của một bài. D4 chỉ quy định 5 exercise types logic (MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR), không quy định mỗi bài học có đúng 5 câu hỏi.

Cơ chế này diễn ra tức thời ngay tại màn hình kết thúc bài học (End-of-Lesson Controlled Retry Modal): nếu học viên có câu trả lời sai trong lượt làm đầu tiên (first-pass), hệ thống sẽ trích xuất các câu sai trong phạm vi hạn mức allowance để học viên thực hiện lại. Nếu học viên trả lời chính xác ở lượt làm lại này, học viên sẽ nhận được trần điểm tín chỉ tối đa là **70% giá trị điểm** của câu hỏi đó (thay vì 100% như làm đúng ngay lần đầu). Nếu trả lời sai, câu hỏi đó nhận 0 điểm và bài học kết thúc.

Kiến trúc nghiệp vụ Lingora kiên quyết bác bỏ mô hình hàng đợi câu sai tích lũy dồn qua nhiều ngày. Việc không lưu trữ câu sai vào một hàng đợi độc lập xuyên ngày đảm bảo bài học được giải quyết trọn vẹn trong phiên, ngăn nguy cơ học viên mở ứng dụng vào ngày hôm sau và phải đối mặt với hàng chục câu hỏi phạt dồn lại gây chán nản.

### 2.3.4. Ôn tập ngắt quãng (Spaced Repetition System - SRS)

Dựa trên phát hiện thực nghiệm 100% người học gặp trở ngại mau quên từ vựng, phân hệ Ôn tập ngắt quãng (SRS) của Lingora được thiết kế để tự động hóa hoàn toàn lịch nhắc ôn từ vựng mà không đòi hỏi người học phải tự ghi nhớ lịch trình.

Hệ thống áp dụng thuật toán lặp lại ngắt quãng tất định (Deterministic Spaced Repetition Policy B) với chuỗi chu kỳ 5 nấc thời gian tăng dần:
$$[1 \text{ ngày} \longrightarrow 3 \text{ ngày} \longrightarrow 7 \text{ ngày} \longrightarrow 14 \text{ ngày} \longrightarrow 30 \text{ ngày}]$$

Điều kiện kích hoạt: Ngay khi một bài học chuyển sang trạng thái hoàn thành (`COMPLETED`), toàn bộ các từ vựng thuộc bài học đó sẽ tự động được hệ thống tạo thẻ ôn tập cá nhân trong cơ sở dữ liệu (`user_vocab_srs`) với mốc ôn tập đầu tiên là `nextReviewAt = NOW()`.

Quy tắc chuyển dịch chu kỳ khi người học thực hiện phiên ôn tập:
- Khi người học trả lời chính xác từ vựng: chu kỳ ôn tập được nâng lên nấc thời gian kế tiếp trong chuỗi (ví dụ từ 1 ngày lên 3 ngày, từ 3 ngày lên 7 ngày...). Mốc thời gian ôn tập tiếp theo `nextReviewAt` được cộng thêm số ngày tương ứng tính từ thời điểm hiện tại.
- Khi người học trả lời sai từ vựng: nấc chu kỳ lập tức bị đặt lại về mốc ban đầu là **1 ngày** ($[1]$) và số lần quên (`lapseCount`) tăng lên 1, buộc từ vựng đó phải xuất hiện lại trong phiên ôn tập của ngày hôm sau.

Yêu cầu nhất quán ở đây là: cập nhật thẻ ôn tập và ghi nhật ký `review_logs` phải hoàn tất cùng nhau trong một lần gọi RPC `record_review` phía PostgreSQL; cơ chế transaction cụ thể do giai đoạn triển khai lựa chọn. Chuỗi ngày học (Streak) được đánh giá độc lập dựa trên hoạt động học tập hợp lệ, không nằm trong phạm vi của thủ tục này.

### 2.3.5. Cơ chế nhảy cấp bài học (Conditional Jump)

Đối với những người học có năng lực tiếp thu nhanh hoặc đã có kiến thức nền tảng nhất định, việc bắt buộc phải hoàn thành tuần tự từng bài học nhỏ có thể gây ra cảm giác nhàm chán. Lingora cung cấp cơ chế Kiểm tra nhảy cấp bài học (Conditional Jump) cho phép người học bỏ qua các nội dung đã thuần thục. Cơ chế này được quy định bởi chính sách Policy D5, thuộc phạm vi Use Case `UC-04` và luồng hành vi `BF-11` (liên kết `MVP-04`); bộ yêu cầu chức năng canonical hiện tại không cấp một P1-FR riêng cho quy tắc này.

Tuy nhiên, để ngăn ngừa hành vi gian lận hoặc nhảy cấp tùy tiện làm thủng kiến thức nền tảng, cơ chế Jump được khống chế bởi 5 điều kiện kỹ thuật:
1. **Chỉ áp dụng với Đơn vị kế cận (Adjacent-Only):** Người học chỉ được phép yêu cầu kiểm tra nhảy cấp đối với Đơn vị bài học (Unit) nằm ngay liền kề với Unit cao nhất mà mình đã hoàn thành hoặc được xếp lớp. Hệ thống nghiêm cấm việc nhảy cóc qua nhiều Unit cùng lúc trong lộ trình học tập thông thường.
2. **Ngưỡng điểm số tuyệt đối ($\ge 95\%$):** Bài kiểm tra Jump cho Unit kế cận bao gồm 20 câu hỏi tổng hợp kiến thức của Unit cần bỏ qua. Người học bắt buộc phải đạt độ chính xác từ 95% trở lên mới được công nhận vượt cấp thành công.
3. **Thời gian khóa chờ 24 giờ (24h Cooldown Lockout):** Nếu người học không đạt ngưỡng điểm 95%, hệ thống lập tức kích hoạt cơ chế khóa chờ trong vòng 24 giờ đối với Unit đó. Trong thời gian này, người học không thể thử lại bài kiểm tra Jump mà phải quay lại học tuần tự các bài học nhỏ.
4. **Ghi nhận nguồn gốc vượt cấp (Provenance Tracking):** Khi vượt cấp thành công, các bài học thuộc Unit được gán trạng thái bỏ qua có kiểm tra (`SKIPPED_BY_JUMP`) đi kèm cờ nguồn gốc `by_jump = true`.
5. **Không tính tín chỉ hoàn thành bài học cơ học:** Bài học được bỏ qua qua cơ chế Jump tuyệt đối không được cấp trạng thái hoàn thành bài học (`COMPLETED`). Điểm số của bài kiểm tra Jump được lưu riêng biệt và không được dùng để tính toán chỉ số hoàn thành khóa học cơ học nhằm phản ánh trung thực thời lượng học tập thực tế.

### 2.3.6. Quy trình quản trị và vòng đời nội dung (Content Governance & SoD)

Chất lượng học liệu là yếu tố sống còn quyết định uy tín của một nền tảng giáo dục. Để đảm bảo tính chính xác về mặt ngôn ngữ và chuẩn mực sư phạm, Lingora thiết lập một quy trình quản trị nội dung chặt chẽ qua 6 trạng thái nghiệp vụ, kết hợp nguyên tắc Phân tách Trách nhiệm (Separation of Duties - SoD) đa tầng:

Sáu trạng thái vòng đời học liệu bao gồm:
1. `DRAFT` (Bản thảo sơ khởi): Bài học được khởi tạo bởi Người quản lý đào tạo và chuyển giao cho Soạn giả tiến hành nhập liệu từ vựng, âm thanh và bài tập.
2. `IN_REVIEW` (Đang kiểm duyệt): Soạn giả hoàn tất bài học, kiểm tra giao diện qua tính năng xem trước và bấm nộp bài lên hàng đợi kiểm định.
3. `CHANGES_REQUESTED` (Yêu cầu chỉnh sửa): Kiểm duyệt viên sau khi thẩm định phát hiện các sai sót về chính tả, đáp án hoặc chất lượng âm thanh, từ chối phê duyệt và trả bài về cho Soạn giả kèm theo biên bản nhận xét chi tiết. Soạn giả hiệu chỉnh và nộp lại theo luồng `CHANGES_REQUESTED → DRAFT → IN_REVIEW` (không sửa trực tiếp bản đã xuất bản).
4. `APPROVED` (Đã phê duyệt): Kiểm duyệt viên độc lập xác nhận bài học đạt chuẩn 100% về mặt học thuật và sư phạm.
5. `PUBLISHED` (Đã xuất bản): Người quản lý đào tạo thực hiện xuất bản bài học ra môi trường học tập của học viên. Ràng buộc hiển thị danh mục quy định: một Unit chỉ chính thức xuất hiện trên giao diện người học khi toàn bộ **4/4 bài học** trực thuộc đều đã đạt trạng thái xuất bản (`PUBLISHED`).
6. `ARCHIVED` (Lưu trữ đóng băng): Bài học cũ hoặc bài học không còn phù hợp với chương trình đào tạo được chuyển vào kho lưu trữ, ẩn khỏi danh mục người học mới nhưng vẫn bảo toàn lịch sử học tập của các học viên cũ.

Nguyên tắc Phân tách Trách nhiệm (Separation of Duties - SoD) được cưỡng chế bất biến tại cả tầng ứng dụng và cơ sở dữ liệu:
- **Soạn giả không được tự phê duyệt bài:** Khi thực hiện thao tác duyệt bài, hệ thống luôn kiểm tra danh tính người duyệt với tác giả bài học (`auth.uid() != Lesson.creatorId`). Mọi nỗ lực tự phê duyệt bài của chính mình đều bị chặn đứng với mã lỗi cấm quyền `403 Forbidden (SOD_VIOLATION_SELF_REVIEW)`.
- **Kiểm duyệt viên không được tự ý xuất bản:** Kiểm duyệt viên chỉ có quyền thẩm định chất lượng học thuật, hoàn toàn không có thẩm quyền phát hành học liệu ra môi trường bên ngoài (`403 Forbidden (SOD_VIOLATION_MODERATOR_PUBLISH)`).
- **Cơ chế Nhân bản Tạo nháp v2 (Clone-to-Draft):** Khi một bài học đã xuất bản (`PUBLISHED`) hoặc đã lưu trữ (`ARCHIVED`) cần sửa đổi nội dung, hệ thống tuyệt đối cấm can thiệp trực tiếp vào bản ghi đang phát hành. Thay vào đó, Người quản lý kích hoạt cơ chế Clone-to-Draft v2, tạo ra một bản ghi bài học mới ở trạng thái `DRAFT` liên kết với bài cũ qua trường tham chiếu `supersedesId`. Bản nháp mới này bắt buộc phải trải qua toàn bộ quy trình biên soạn và kiểm duyệt độc lập từ đầu trước khi được xuất bản để thay thế bản ghi cũ.
- **Xuất bản khẩn cấp có điều kiện của Quản trị viên:** Quản trị viên hệ thống chỉ được phép kích hoạt quyền xuất bản khẩn cấp khi bài học đó **đã đạt trạng thái `APPROVED`** từ trước. Hệ thống kiên quyết từ chối mọi yêu cầu xuất bản khẩn cấp đối với các bài học đang ở trạng thái bản thảo (`DRAFT`) hoặc đang chờ duyệt (`IN_REVIEW`), đồng thời tự động phát sinh bản ghi nhật ký kiểm toán bất biến (`AuditLog`) ghi nhận lý do can thiệp.

---

## 2.4. Sơ đồ trình tự

Sơ đồ trình tự biểu diễn sự tương tác động giữa các tác nhân người dùng, giao diện trình duyệt, tầng điều phối ứng dụng (BFF), các dịch vụ miền nghiệp vụ, cơ sở dữ liệu lưu trữ và các thành phần tích hợp bên ngoài theo trục thời gian tuyến tính. Các luồng dưới đây mô tả hành vi thiết kế mục tiêu (TARGET behavior); ngoại trừ RPC `record_review` đã vận hành ở CURRENT, mức độ hoàn thiện production của các màn hình và điều phối còn lại thuộc các milestone tiếp theo.

### 2.4.1. Đăng nhập và xác thực phiên làm việc

Quy trình xác thực người dùng thiết lập nền tảng bảo mật cho toàn bộ hệ thống Lingora. Giao tiếp xác thực sử dụng Supabase GoTrue Auth, phát hành cặp mã thông báo JWT và Refresh Token được lưu trữ an toàn trong cookie máy chủ (`httpOnly`), ngăn ngừa các lỗ hổng tấn công phía máy khách.

```text
[HÌNH 2.2 — Sơ đồ trình tự: Đăng nhập và xác thực phiên làm việc]
Nguồn tham chiếu: docs/plantuml/sequence-auth-session-m23.puml
```

Mô tả luồng tương tác chính:
1. Người dùng nhập email và mật khẩu tại giao diện đăng nhập (`lingora-web` hoặc `lingora-admin`), kích hoạt Server Action phía máy chủ.
2. Server Action gửi yêu cầu xác thực an toàn tới nhà cung cấp danh tính Supabase GoTrue Auth.
3. Supabase GoTrue kiểm tra thông tin đăng nhập, xác thực mật khẩu băm và phát hành mã thông báo truy cập JWT (ký số ES256/HS256) cùng mã làm mới phiên.
4. Server Action truy vấn cơ sở dữ liệu để lấy thông tin hồ sơ người dùng (`Profile`) và xác định vai trò nghiệp vụ tương ứng.
5. Máy chủ thiết lập phiên làm việc bằng cách đóng gói mã thông báo vào cookie trình duyệt mang cờ bảo vệ `httpOnly=true`, `SameSite=Lax` và `Secure` (trên môi trường vận hành thực tế).
6. Hệ thống chuyển hướng người dùng tới Bảng điều khiển (Dashboard) tương ứng với vai trò đã được cấp quyền. Nếu xác thực thất bại, hệ thống trả về mã lỗi thân thiện mà không để lộ cấu trúc dữ liệu nội bộ.

### 2.4.2. Học bài và làm bài tập tương tác

Luồng tương tác học bài là quy trình diễn ra thường xuyên nhất trên nền tảng, kết nối người học với các bài học vi mô và bộ bài tập tương tác 5 dạng chuẩn.

```text
[HÌNH 2.3 — Sơ đồ trình tự: Học bài và làm bài tập tương tác]
Nguồn tham chiếu: docs/plantuml/sequence-lesson-exercise-retry-m23.puml
```

Mô tả luồng tương tác chính:
1. Người học truy cập vào một bài học đang mở khóa trên lộ trình học tập. Giao diện người học gửi yêu cầu tới Route Handler BFF kèm theo session cookie để xác thực danh tính.
2. BFF kiểm tra phiên làm việc và gửi truy vấn tới Supabase PostgREST để tải nội dung bài học, danh mục từ vựng và danh sách câu hỏi bài tập tương tác (thuộc 5 dạng chuẩn: MCQ, FILL_BLANK, REORDER, GRAMMAR, LISTENING). Cơ sở dữ liệu RLS xác nhận bài học đã ở trạng thái `PUBLISHED` trước khi trả dữ liệu.
3. Người học xem từ vựng, kích hoạt nghe âm thanh phát âm chuẩn bản xứ (tải trực tiếp từ Supabase Storage bucket có RLS bảo vệ) và bắt đầu làm bài tập.
4. Đối với từng câu hỏi, người học nộp phương án qua BFF tới dịch vụ miền `LessonExecutionService`; service chấm tức thì và trả về kết quả Đúng/Sai kèm đáp án và giải thích đã kiểm duyệt. Câu sai được ghi vào danh sách chờ cho pha làm lại cuối bài (§2.4.3).

### 2.4.3. Làm lại câu trả lời sai có kiểm soát

Pha làm lại diễn ra ngay sau câu hỏi cuối của bài học, do `LessonExecutionService` điều phối.

Mô tả luồng tương tác chính:
1. Service kiểm tra danh sách câu sai của phiên; nếu rỗng thì chuyển thẳng tới tổng kết bài học.
2. Nếu có câu sai, service tính hạn mức theo quy tắc tại §2.3.3, trích các câu trong hạn mức và mở Controlled Retry Modal.
3. Học viên nộp lại → service chấm (đúng 70%, sai 0 điểm) → đóng modal, cập nhật `user_progress` sang `COMPLETED` và chuyển sang đánh giá Streak.

### 2.4.4. Kiểm tra xếp lớp đầu vào

Quy trình đánh giá chẩn đoán xếp lớp đầu vào điều phối việc tương tác giữa người học mới và dịch vụ đánh giá thích ứng để xác định Đơn vị bài học xuất phát trên đề cương Tiếng Anh A1.

```text
[HÌNH 2.4 — Sơ đồ trình tự: Kiểm tra xếp lớp đầu vào]
Nguồn tham chiếu: docs/plantuml/sequence-diagnostic-placement-m23.puml
```

Mô tả luồng tương tác chính:
1. Người học bắt đầu bài kiểm tra chẩn đoán trên giao diện người học. Hệ thống khởi tạo phiên đề thi định tuyến (Routing Stage) gồm các câu hỏi trung bình.
2. Người học nộp các câu trả lời định tuyến. Dịch vụ miền `PlacementService` tính toán điểm số thô ban đầu và tự động phân nhánh người học sang đề thi mục tiêu (Targeted Stage) bao phủ 4 chiều kỹ năng (Từ vựng, Ngữ pháp, Đọc, Nghe).
3. Người học hoàn thành các câu hỏi của giai đoạn mục tiêu và bấm nộp bài toàn diện.
4. `PlacementService` tổng hợp điểm số thô trên thang điểm 30, áp dụng bảng quy đổi **Mapping A** để xác định Đơn vị bài học xuất phát (`Starting Unit`, từ Unit 1 đến Unit 6).
5. Hệ thống đóng gói kết quả thành bản ghi bất biến `AssessmentResult` và chèn vào cơ sở dữ liệu qua RLS bảo vệ, đồng thời cập nhật hồ sơ năng lực `SkillProfile` đa chiều cho học viên.
6. Hệ thống mở khóa các bài học thuộc Đơn vị xuất phát trên lộ trình và chuyển người học về giao diện học tập kèm thông điệp điểm bắt đầu được khuyến nghị.

### 2.4.5. Ôn tập từ vựng theo lịch ngắt quãng

Quy trình ôn tập ngắt quãng (SRS) mô tả tương tác giữa người học, BFF và thủ tục `record_review` khi củng cố trí nhớ từ vựng định kỳ.

```text
[HÌNH 2.5 — Sơ đồ trình tự: Ôn tập từ vựng ngắt quãng]
Nguồn tham chiếu: docs/plantuml/sequence-srs-review-m23.puml
```

Mô tả luồng tương tác chính:
1. Người học truy cập phân hệ Ôn tập. Ứng dụng gửi truy vấn tới Supabase PostgREST để quét danh mục các thẻ từ vựng đến hạn ôn tập của người học (`nextReviewAt <= NOW()`). Chính sách RLS đảm bảo người học chỉ nhìn thấy các thẻ do chính mình sở hữu.
2. Giao diện hiển thị danh sách thẻ ghi nhớ tương tác (mặt chữ, ngữ nghĩa, phiên âm và nút phát âm thanh chuẩn).
3. Người học thực hiện trả lời câu hỏi gợi nhớ từ vựng và xác nhận kết quả Đúng hoặc Sai.
4. Trình duyệt gửi kết quả nộp bài tới Route Handler BFF. BFF thực hiện gọi thủ tục lưu trữ an toàn phía cơ sở dữ liệu `rpc/record_review` kèm theo mã thông báo phiên làm việc.
5. Thủ tục `record_review` thực thi: kiểm tra sở hữu thẻ (`auth.uid() = user_id`, sai thì `403 Forbidden`), áp dụng Policy B cập nhật `nextReviewAt`/`reviewCount`, và chèn bản ghi vào `review_logs` — bảo đảm nhất quán theo yêu cầu tại §2.3.4.
6. Trả trạng thái thẻ đã cập nhật về giao diện và kích hoạt đánh giá Streak.

### 2.4.6. Soạn thảo và kiểm duyệt nội dung

Quy trình này mô tả sự phối hợp chặt chẽ và tuân thủ ranh giới phân tách trách nhiệm giữa Soạn giả bài học và Kiểm duyệt viên độc lập.

```text
[HÌNH 2.6 — Sơ đồ trình tự: Soạn thảo và kiểm duyệt học liệu]
Nguồn tham chiếu: docs/plantuml/sequence-authoring-moderation-publish-m23.puml
```

Mô tả luồng tương tác chính:
1. Soạn giả đăng nhập cổng quản trị, mở bài học được phân công, thực hiện nhập danh mục từ vựng, tải lên tệp âm thanh vào vùng lưu trữ `lingora-media` và biên soạn 5 dạng bài tập tương tác kèm lời giải thích quy tắc.
2. Soạn giả sử dụng tính năng xem trước (Preview) để nghe thử âm thanh và làm thử bài tập. Khi đảm bảo chất lượng, Soạn giả nhấn nút "Nộp duyệt".
3. Lệnh gửi duyệt kích hoạt dịch vụ miền `ContentLifecycleService`. Dịch vụ xác thực vai trò tác giả, kiểm tra các điều kiện tiên quyết (các câu hỏi tuân thủ 5 dạng bài tập chuẩn, có tệp âm thanh hợp lệ) và cập nhật trạng thái bài học từ `DRAFT` sang `IN_REVIEW`.
4. Bài học xuất hiện trên Hàng đợi kiểm duyệt (Moderation Queue) của Kiểm duyệt viên.
5. Kiểm duyệt viên độc lập mở giao diện thẩm định, nghe thử 100% tệp âm thanh và kiểm tra tính chính xác của từng câu hỏi và lời giải thích.
6. Kiểm duyệt viên đưa ra quyết định:
   - Nếu phát hiện lỗi: Kiểm duyệt viên nhập lý do vào biên bản và bấm "Yêu cầu chỉnh sửa". `ContentLifecycleService` chuyển trạng thái bài học sang `CHANGES_REQUESTED` và gửi thông báo về cho Soạn giả.
   - Nếu bài học hoàn toàn đạt chuẩn: Kiểm duyệt viên bấm "Phê duyệt". `ContentLifecycleService` kiểm tra chốt chặn SoD: xác nhận người duyệt không phải là tác giả biên soạn (`auth.uid() != creatorId`). Khi thỏa mãn, trạng thái bài học được chuyển thành `APPROVED` và phát sinh sự kiện kiểm toán an ninh.

### 2.4.7. Xuất bản nội dung học liệu

Luồng xuất bản nội dung là khâu cuối cùng chuyển đổi học liệu đã được phê duyệt sang trạng thái khả dụng công khai cho toàn bộ người học trên hệ thống.

Mô tả luồng tương tác chính:
1. Người quản lý đào tạo truy cập danh mục khóa học, kiểm tra các bài học trực thuộc Đơn vị bài học (Unit).
2. Người quản lý kiểm tra điều kiện xuất bản Unit: hệ thống kiểm tra toàn bộ 4 bài học nhỏ cấu thành Unit đó.
3. Khi toàn bộ 4/4 bài học đều đã đạt trạng thái `APPROVED`, Người quản lý kích hoạt nút "Xuất bản Đơn vị bài học".
4. Dịch vụ `ContentLifecycleService` thực thi chuyển đổi toàn bộ 4 bài học sang trạng thái `PUBLISHED` và mở cờ hiển thị công khai cho Unit tương ứng trên catalog học tập của học viên (giữ yêu cầu nhất quán dữ liệu; cơ chế transaction cụ thể do giai đoạn triển khai lựa chọn).
5. Trong trường hợp đặc biệt cần Xuất bản khẩn cấp (Emergency Publish), Quản trị viên hệ thống có thể kích hoạt phát hành một bài học đơn lẻ. Hệ thống thực hiện kiểm tra chốt chặn an ninh bắt buộc: bài học đó **bắt buộc phải đang ở trạng thái `APPROVED`** và Quản trị viên bắt buộc phải nhập lý do giải trình.
6. Hệ thống cập nhật trạng thái bài học sang `PUBLISHED`, đồng thời tự động ghi nhận bản ghi kiểm toán an ninh mức độ tối cao (`CONTENT_EMERGENCY_PUB`) vào bảng `AuditLog` phục vụ công tác thanh tra.

---

## 2.5. Sơ đồ hoạt động

Sơ đồ hoạt động (Activity Diagrams) mô tả chi tiết luồng điều khiển nghiệp vụ, các điểm rẽ nhánh quyết định logic và sự biến đổi dữ liệu giữa các phân hệ. Các luồng dưới đây mô tả hành vi thiết kế mục tiêu; mức độ hoàn thiện production thuộc các milestone tiếp theo.

### 2.5.1. Hoạt động đăng nhập và xác thực người dùng

Luồng hoạt động đăng nhập và xác thực kiểm soát chặt chẽ quá trình cấp phát phiên và phân quyền:

```text
[HÌNH 2.7 — Sơ đồ hoạt động: Đăng nhập và xác thực người dùng]
Nguồn tham chiếu: docs/plantuml/activity-learner-journey.puml
```

Mô tả luồng hoạt động:
Quy trình bắt đầu khi người dùng nhập thông tin email và mật khẩu tại màn hình đăng nhập. Hệ thống tiến hành kiểm tra tính hợp lệ về mặt định dạng của dữ liệu đầu vào. Nếu dữ liệu không hợp lệ, hệ thống báo lỗi ngay tại máy khách. Khi dữ liệu đúng định dạng, yêu cầu được chuyển tới Supabase GoTrue Auth. Tại đây, hệ thống xác thực mật khẩu băm và kiểm tra trạng thái hoạt động của tài khoản trong bảng `Profile`. Nếu tài khoản bị khóa hoặc đình chỉ theo trạng thái quản trị, hệ thống lập tức từ chối truy cập và thông báo tài khoản bị vô hiệu hóa. Nếu xác thực thành công, hệ thống phát hành token JWT, đóng gói phiên vào cookie máy chủ `httpOnly`, trích xuất vai trò người dùng và điều hướng người dùng tới phân hệ tương ứng: học viên được chuyển tới Bảng điều khiển học tập, cán bộ nghiệp vụ được chuyển tới Cổng quản trị tác nghiệp.

### 2.5.2. Hoạt động học bài và làm bài tập

Luồng hoạt động thể hiện tiến trình tương tác của người học trong một phiên bài học vi mô:

```text
[HÌNH 2.8 — Sơ đồ hoạt động: Tiến trình làm bài học vi mô]
Nguồn tham chiếu: docs/plantuml/activity-learner-flow-m22.puml
```

Mô tả luồng hoạt động:
Chọn bài mở khóa → tải nội dung, học từ vựng kèm audio → làm từng câu hỏi (chấm tức thì: đúng đi tiếp, sai vào danh sách chờ) → hết câu hỏi chuyển sang pha retry (§2.5.4).

### 2.5.3. Hoạt động đánh giá chẩn đoán xếp lớp đầu vào

Quy trình đánh giá xếp lớp đầu vào điều phối hai nhánh rẽ nghiệp vụ:

```text
[HÌNH 2.9 — Sơ đồ hoạt động: Đánh giá xếp lớp và chẩn đoán thích ứng]
Nguồn tham chiếu: docs/plantuml/placement-jump-m22.puml
```

Mô tả luồng hoạt động:
Tự khai báo/Bỏ qua → Unit 1 + `UNVERIFIED`, kết thúc. Tham gia đánh giá → Routing (câu hỏi trung bình) → rẽ Targeted theo năng lực (4 chiều: Từ vựng, Ngữ pháp, Đọc, Nghe) → tổng điểm thang 30 → Mapping A → `Starting Unit` → ghi `AssessmentResult` + `SkillProfile` → mở khóa bài học.

### 2.5.4. Hoạt động làm lại câu sai có kiểm soát (Controlled Retry)

Luồng hoạt động Controlled Retry khống chế chặt chẽ việc làm lại câu hỏi sai ở cuối bài học:

Mô tả luồng hoạt động:
Hết first-pass → kiểm tra danh sách câu sai: rỗng → tổng kết; còn câu sai → trích trong hạn mức (quy tắc §2.3.3) → mở Retry Modal → chấm lại (đúng 70%, sai 0) → đóng modal → tổng kết (`COMPLETED`) + Streak.

### 2.5.5. Hoạt động ôn tập từ vựng ngắt quãng (SRS)

Quy trình ôn tập ngắt quãng điều phối chu kỳ củng cố trí nhớ cho người học:

```text
[HÌNH 2.10 — Sơ đồ hoạt động: Quy trình ôn tập ngắt quãng SRS]
Nguồn tham chiếu: docs/plantuml/srs-flow-m22.puml
```

Mô tả luồng hoạt động:
Mở Ôn tập → lọc thẻ đến hạn (`nextReviewAt <= NOW()`): rỗng → báo hoàn thành; còn thẻ → gợi nhớ từng thẻ → đúng lên nấc Policy B, sai về mốc 1 ngày → ghi qua `record_review` (consistency theo §2.3.4) → lặp đến hết danh sách.

### 2.5.6. Hoạt động biên soạn, kiểm duyệt và xuất bản học liệu (Content Governance)

Quy trình quản trị học liệu kết nối 4 vai trò cán bộ trong việc đảm bảo chất lượng bài học:

```text
[HÌNH 2.11 — Sơ đồ hoạt động: Vòng đời kiểm duyệt và xuất bản học liệu]
Nguồn tham chiếu: docs/plantuml/activity-authoring-flow-m22.puml
```

Mô tả luồng hoạt động:
Manager lập khung + giao việc → Creator soạn ở `DRAFT` (từ vựng, audio, 5 dạng bài tập + giải thích, preview) → nộp → `IN_REVIEW` → Moderator thẩm định (nghe 100% audio, kiểm tra sư phạm): không đạt → `CHANGES_REQUESTED` → (`DRAFT` → `IN_REVIEW`); đạt → `APPROVED` (SoD chặn Creator tự duyệt) → đủ 4/4 `APPROVED` → Manager publish → `PUBLISHED`.

---

## 2.6. Sơ đồ trạng thái

Sơ đồ trạng thái (State Machine Diagrams) mô hình hóa vòng đời và các quy tắc chuyển đổi trạng thái bất biến của các thực thể cốt lõi trong hệ thống Lingora.

*Lưu ý kiến trúc về hiện trạng triển khai:* Các sơ đồ trạng thái dưới đây mô tả hành vi mục tiêu của hệ thống (TARGET Behavior); những trạng thái và quy tắc chuyển dịch tự động chưa được kích hoạt trong phiên bản hiện tại được xem là thiết kế chuẩn bị cho các milestone tiếp theo.

### 2.6.1. Vòng đời nội dung học liệu (Content Lifecycle)

Vòng đời nội dung bài học tuân thủ mô hình 6 trạng thái đã được nghiệm thu tại thiết kế nền tảng dữ liệu M2.1. Quy trình kiểm định không sử dụng trạng thái loại bỏ tùy tiện mà sử dụng trạng thái yêu cầu chỉnh sửa có hướng dẫn sư phạm:

```text
               +-------------------------------------------+
               |                   DRAFT                   |<-----------------------+
               +-------------------------------------------+                        |
                                     |                                              |
                                     | Submit for Review (UC-08)                    |
                                     v                                              |
               +-------------------------------------------+                        |
               |                 IN_REVIEW                 |                        |
               +-------------------------------------------+                        |
                     |                                   |                          |
                     | Approve (UC-09 / SoD Pass)        | Request Changes (UC-09)  |
                     v                                   v                          |
+------------------------------------+  +-------------------------------------------+
|              APPROVED              |  |             CHANGES_REQUESTED             |
+------------------------------------+  +-------------------------------------------+
     |                          |                            |
     | Publish Unit (UC-10)     | Emergency Publish (ADR-020)| Creator Edits & Resubmits
     v                          v                            |
+------------------------------------+                       |
|             PUBLISHED              |                       |
+------------------------------------+                       |
     |                                                       |
     | Archive (Deprecate)                                   |
     v                                                       |
+------------------------------------+                       |
|              ARCHIVED              |                       |
+------------------------------------+                       |
     |                                                       |
     +--- Clone-to-Draft v2 (supersedesId) ------------------+
```

Ý nghĩa các trạng thái:
- `DRAFT`: Trạng thái bản thảo nội bộ thuộc quyền biên tập của Soạn giả phụ trách. Bài học ở trạng thái này hoàn toàn ẩn khỏi môi trường người học và chưa thể kiểm duyệt.
- `IN_REVIEW`: Bài học đã được Soạn giả nộp lên hàng đợi kiểm định, bị khóa chức năng chỉnh sửa trực tiếp để chờ Kiểm duyệt viên thẩm định.
- `CHANGES_REQUESTED`: Kiểm duyệt viên từ chối duyệt tạm thời do phát hiện lỗi chuyên môn, kèm theo danh mục các nội dung cần sửa đổi. Bài học được mở khóa lại cho Soạn giả cập nhật ở `DRAFT` rồi nộp lại để chuyển sang `IN_REVIEW`.
- `APPROVED`: Bài học đã được Kiểm duyệt viên độc lập thẩm định đạt chuẩn chất lượng 100%. Bài học bị đóng băng nội dung và sẵn sàng cho khâu xuất bản.
- `PUBLISHED`: Bài học được phát hành công khai trên danh mục học tập của học viên sau khi đáp ứng đủ điều kiện của Đơn vị bài học (Unit).
- `ARCHIVED`: Bài học ngừng phát hành, được lưu trữ vĩnh viễn trong cơ sở dữ liệu để bảo toàn lịch sử học tập của các học viên cũ. Mọi nhu cầu chỉnh sửa bài học đã xuất bản hoặc lưu trữ bắt buộc phải sử dụng cơ chế Clone-to-Draft v2 tạo bản ghi mới gắn cờ `supersedesId`.

### 2.6.2. Trạng thái sẵn sàng thăng cấp năng lực (LevelReadiness)

Máy trạng thái đánh giá năng lực người học xác định mức độ sẵn sàng của học viên khi hoàn thành một cấp độ hoặc lộ trình học tập. Mô hình chuẩn hóa chính xác 3 trạng thái hợp lệ duy nhất, quy định chuyển dịch năng lực dứt khoát:

```text
                        [ Hoàn tất Đánh giá Cấp độ ]
                                     |
                                     v
       +-----------------------------------------------------------+
       |             Đánh giá tổng hợp năng lực học viên           |
       |       (Dựa trên Progress, Mastery và AssessmentResult)    |
       +-----------------------------------------------------------+
                /                     |                     \
               /                      |                      \
   Đạt              Đạt có điều kiện        Chưa đạt yêu cầu
             /                        |                        \
            v                         v                         v
+--------------------+    +----------------------+    +--------------------+
|      ADVANCE       |    | ADVANCE_WITH_SUPPORT |    |     REMEDIATE      |
+--------------------+    +----------------------+    +--------------------+
```

Ý nghĩa các trạng thái:
- `ADVANCE`: Người học hoàn thành tốt nội dung bài học và vượt qua bài kiểm tra cấp độ. Người học được phép thăng cấp trực tiếp lên cấp độ học tập kế tiếp mà không cần điều kiện kèm theo.
- `ADVANCE_WITH_SUPPORT`: Người học đạt yêu cầu tổng thể nhưng tồn tại một số kỹ năng thành phần còn yếu. Hệ thống cho phép người học tiến lên cấp độ mới nhưng tự động đánh dấu các bài học vi mô bổ trợ (RemedialModule) trên lộ trình để người học củng cố song song.
- `REMEDIATE`: Người học chưa đạt mức độ thành thạo tối thiểu để tiếp thu cấp độ mới. Hệ thống không cho phép thăng cấp mà yêu cầu người học tập trung hoàn thành các bài học khắc phục lỗ hổng kiến thức đã được chỉ định. Nguyên tắc sư phạm bất biến: quá trình khắc phục lỗ hổng tuyệt đối không hạ thấp cấp độ hiện tại của học viên và không ép học viên phải học lại toàn bộ các bài học đã hoàn thành.
(Các ngưỡng điểm số cụ thể để phân định ba trạng thái được giữ ở trạng thái mở thiết kế `[ĐỀ XUẤT — CẤU HÌNH MỞ / PENDING VALIDATION]`, không chốt ngưỡng phần trăm cứng trong phạm vi báo cáo này.)

### 2.6.3. Trạng thái lỗ hổng kiến thức (KnowledgeGap)

Máy trạng thái theo dõi và giải quyết các điểm yếu kiến thức của học viên trong quá trình làm bài tập tương tác:

```text
               [ Phát hiện lỗi sai lặp lại trên một Khái niệm ]
                                     |
                                     v
               +-------------------------------------------+
               |                   OPEN                    |
               +-------------------------------------------+
                                     |
                                     | Bắt đầu bài học vi mô khắc phục
                                     v
               +-------------------------------------------+
               |              IN_REMEDIATION               |
               +-------------------------------------------+
                                     |
                                     | Hoàn thành bài tập bổ trợ đạt chuẩn
                                     v
               +-------------------------------------------+
               |                 RESOLVED                  |
               +-------------------------------------------+
```

Ý nghĩa các trạng thái:
- `OPEN`: Lỗ hổng kiến thức được hệ thống nhận diện và khởi tạo khi ghi nhận lỗi thuộc cùng một mã khái niệm học thuật (`Concept`). Lỗ hổng này được ghi nhận vào hồ sơ học tập để định hướng nội dung ôn tập.
- `IN_REMEDIATION`: Người học chủ động kích hoạt và bắt đầu thực hiện bài học vi mô bổ trợ được hệ thống đề xuất riêng cho khái niệm đang bị hổng kiến thức.
- `RESOLVED`: Người học hoàn thành bài luyện tập bổ trợ với kết quả chính xác, chứng minh đã làm chủ lại khái niệm. Lỗ hổng kiến thức được đánh dấu đã khắc phục thành công và lưu giữ làm dữ liệu truy nguyên lịch sử học tập.

### 2.6.4. Trạng thái làm chủ khái niệm (ConceptMastery)

Máy trạng thái đo lường mức độ nhuần nhuyễn của người học đối với từng khái niệm ngôn ngữ cụ thể (từ vựng, điểm ngữ pháp) dựa trên chuỗi bằng chứng làm bài tập:

```text
                   [ Học viên tiếp xúc khái niệm lần đầu ]
                                     |
                                     v
               +-------------------------------------------+
               |                  NOVICE                   |
               +-------------------------------------------+
                                      |
                                      | Tích lũy bằng chứng làm đúng bài tập tương tác
                                      v
                +-------------------------------------------+
                |                DEVELOPING                 |
                +-------------------------------------------+
                                      |
                                      | Duy trì kết quả đúng ổn định và hoàn thành chu kỳ SRS theo quy định
                                      v
                +-------------------------------------------+
                |                 MASTERED                  |
                +-------------------------------------------+
```

Ý nghĩa các trạng thái:
- `NOVICE` (Mới tiếp cận): Trạng thái khởi đầu khi người học vừa tiếp xúc với từ vựng hoặc quy tắc ngữ pháp mới trong bài học vi mô và chưa tích lũy đủ bằng chứng thực hành.
- `DEVELOPING` (Đang phát triển): Người học đã có kết quả đúng với khái niệm đó và đang trong quá trình củng cố phản xạ cùng các nấc chu kỳ ôn tập ban đầu của SRS.
- `MASTERED` (Đã thuần thục): Người học duy trì kết quả chính xác ổn định trong các phiên học và hoàn thành các mốc ôn tập ngắt quãng dài hạn, chứng minh kiến thức đã được khắc sâu vào trí nhớ dài hạn.

---

## 2.7. Thiết kế kiến trúc hệ thống

Kiến trúc hệ thống Lingora được thiết kế tuân thủ các chuẩn mực kỹ nghệ phần mềm hiện đại, hướng tới tính module hóa cao, ranh giới trách nhiệm rõ ràng, khả năng mở rộng linh hoạt và bảo mật chiều sâu.

### 2.7.1. Kiến trúc phân tầng tổng thể

Hệ thống được cấu trúc thành mô hình 5 tầng logic độc lập. Luồng phụ thuộc giữa các tầng tuân thủ nguyên tắc **Phụ thuộc một chiều nghiêm ngặt (Strict One-Way Dependency)** từ trên xuống dưới; tuyệt đối không tồn tại phụ thuộc vòng hoặc phụ thuộc ngược chiều:

```text
[HÌNH 2.12 — Sơ đồ kiến trúc thành phần hệ thống Lingora]
Nguồn tham chiếu: docs/plantuml/component-architecture-m24.puml
```

Mô hình 5 tầng logic bao gồm:
1. **Tầng 1 — Presentation Layer (Tầng Trình diễn):** Chạy hoàn toàn trên trình duyệt người dùng, chịu trách nhiệm kết xuất giao diện người dùng tương tác, tiếp nhận hành vi của người học và đội ngũ tác nghiệp nội bộ. Tầng này không trực tiếp xử lý quy tắc nghiệp vụ mà ủy thác toàn bộ cho tầng điều phối phía sau.
2. **Tầng 2 — Application / BFF Layer (Tầng Điều phối Ứng dụng & BFF):** Đóng vai trò lớp đệm trung gian phía máy chủ (Next.js Route Handlers và Server Actions). Tầng này chịu trách nhiệm xác thực phiên làm việc, quản lý cookie bảo mật, kiểm tra sơ bộ ma trận phân tách trách nhiệm (SoD), điều phối các luồng nghiệp vụ phức hợp và đóng vai trò proxy bảo vệ khi giao tiếp với các dịch vụ bên ngoài.
3. **Tầng 3 — Domain Services Layer (Tầng Dịch vụ Miền Nghiệp vụ):** Trọng tâm của hệ thống phần mềm, chứa toàn bộ các dịch vụ miền (Domain Services) độc lập với giao diện và hạ tầng. Tầng này thực thi các thuật toán sư phạm: đánh giá chẩn đoán thích ứng, tính điểm theo đề cương, kiểm soát hạn mức làm lại câu sai, lập lịch ôn tập ngắt quãng và đánh giá chuỗi ngày học Streak.
4. **Tầng 4 — Persistence & Infrastructure Layer (Tầng Lưu trữ & Hạ tầng Dữ liệu):** Quản trị lưu trữ dữ liệu bền vững, thực thi các chính sách bảo mật tầng sâu Row Level Security (RLS), thực thi các thủ tục lưu trữ giao dịch nguyên tử (RPC) và quản lý lưu trữ tệp đa phương tiện tĩnh tuân thủ chuẩn truy cập trực tiếp có kiểm soát.
5. **Tầng 5 — External Providers Layer (Tầng Nhà cung cấp Bên ngoài):** Các dịch vụ độc lập bên ngoài hệ thống chính, bao gồm nhà cung cấp danh tính Supabase GoTrue Auth và dịch vụ tính toán AI hỗ trợ hoàn toàn không lưu trạng thái (Stateless AI Compute Service).

### 2.7.2. Các thành phần chính và trách nhiệm phân tầng

Kiến trúc hệ thống Lingora chuẩn hóa chính xác **19 thành phần phần mềm** (`COMP-PRES-01/02`, `COMP-APP-01/02`, `COMP-DOM-01..08`, `COMP-INFRA-01..05`, `COMP-EXT-01/02`). Thay vì một khối nguyên khối khó phân định trách nhiệm, hệ thống phân bổ rành mạch trách nhiệm cho từng thành phần:

[BẢNG 2.4 — Danh mục 19 thành phần phần mềm của hệ thống Lingora]

| Tầng kiến trúc | Mã thành phần | Tên thành phần phần mềm | Trách nhiệm kiến trúc cốt lõi |
|---|---|---|---|
| **Layer 1: Presentation** | `COMP-PRES-01` | Learner Web Presentation Component | Kết xuất UI học tập, làm bài tập, luyện phản xạ và xem lộ trình trên trình duyệt người học (`lingora-web`). |
| | `COMP-PRES-02` | Admin Web Presentation Component | Kết xuất giao diện quản trị, biên soạn học liệu, duyệt bài và xem báo cáo trên trình duyệt cán bộ (`lingora-admin`). |
| **Layer 2: App / BFF** | `COMP-APP-01` | Learner Application / BFF Orchestrator | Điều phối logic ứng dụng học viên, quản lý cookie phiên `httpOnly`, áp đặt timeout 8.0s và proxy gọi AI an toàn. |
| | `COMP-APP-02` | Admin Application / BFF Orchestrator | Điều phối logic tác nghiệp cán bộ, kiểm tra sơ bộ quyền hạn và ma trận SoD trước khi thao tác CSDL. |
| **Layer 3: Domain** | `COMP-DOM-01` | Auth & Identity Domain Service | Đảm bảo tính toàn vẹn danh tính, kiểm tra trạng thái kích hoạt tài khoản, ánh xạ vai trò và thiết lập ngữ cảnh. |
| | `COMP-DOM-02` | Curriculum & Progression Domain Service | Quản lý cấu trúc cây đề cương (`Course → Unit → Lesson`), kiểm soát điều kiện mở khóa bài học và tiến trình tuyến tính. |
| | `COMP-DOM-03` | Assessment & Diagnostic Domain Service | Quản trị quy trình kiểm tra đầu vào (Placement) và vượt cấp (Jump), tính điểm theo Mapping A, xác định `Starting Unit`. |
| | `COMP-DOM-04` | Spaced Repetition (SRS) Scheduling Service | Quản lý hàng đợi ôn tập ngắt quãng tất định Policy B $[1,3,7,14,30]$, tính toán mốc `nextReviewAt` cho thẻ từ vựng. |
| | `COMP-DOM-05` | Lesson Execution & Controlled Retry Service | Quản lý phiên làm bài tập, chấm điểm tức thì, áp dụng hạn mức làm lại $\max(1, \lfloor N \cdot 0.1 \rfloor)$ và trần credit 70%. |
| | `COMP-DOM-06` | Content Lifecycle & Moderation Service | Quản lý vòng đời 6 trạng thái học liệu, cưỡng chế quy tắc phân tách trách nhiệm SoD (chặn Creator tự duyệt bài). |
| | `COMP-DOM-07` | Admin Governance & Security Audit Service | Quản lý tài khoản cán bộ, thiết lập vai trò, theo dõi báo cáo thống kê vận hành và phát sinh sự kiện kiểm toán. |
| | `COMP-DOM-08` | AI Integration & Proxy Domain Service | Quản lý giao tiếp với dịch vụ AI hỗ trợ (GEC), giám sát thời gian phản hồi và thực thi cơ chế suy thoái tính năng an toàn. |
| **Layer 4: Persistence** | `COMP-INFRA-01` | PostgreSQL Relational Database Engine | Quản trị lưu trữ bền vững và toàn vẹn quan hệ toàn bộ dữ liệu hệ thống (Postgres 15 trên nền tảng Supabase). |
| | `COMP-INFRA-02` | Row Level Security (RLS) Policy Engine | Thực thi chính sách bảo vệ dữ liệu ở cấp độ từng dòng trong CSDL, cô lập dữ liệu người học theo `auth.uid() = user_id`. |
| | `COMP-INFRA-03` | Stored Procedure / RPC Execution Engine | Thực thi tác vụ biến đổi dữ liệu nguyên tử qua thủ tục lưu trữ (RPC), tiêu biểu là hàm `record_review`; cơ chế transaction và xử lý đồng thời cụ thể (ví dụ row-level locking) do giai đoạn triển khai lựa chọn phù hợp với kiến trúc Supabase/Postgres. |
| | `COMP-INFRA-04` | Object Media Storage Engine | Quản lý lưu trữ và phân phối tệp nhị phân tĩnh (hình ảnh, âm thanh bài học) qua hai private bucket tuân thủ chuẩn PA2. |
| | `COMP-INFRA-05` | Immutable Security Audit Log Store | Lưu trữ chuỗi sự kiện kiểm toán an ninh bất biến (Append-Only Ledger), cấm hoàn toàn mọi thao tác sửa/xóa. |
| **Layer 5: External** | `COMP-EXT-01` | Supabase GoTrue Auth Provider | Dịch vụ xác thực danh tính người dùng, cấp phát và ký số token JWT (ES256/HS256) độc lập. |
| | `COMP-EXT-02` | Stateless AI Compute Service (`lingora-ai`) | Thực thi mô hình học máy T5-small hỗ trợ gợi ý sửa lỗi câu tự do (GEC); hoạt động hoàn toàn không lưu trạng thái. |

Đặc biệt, về mặt kiến trúc, dịch vụ AI (`COMP-EXT-02`) được xác định là một **Năng lực Hỗ trợ (Supporting Capability)** hoàn toàn không lưu trạng thái (Stateless). Thành phần này tuyệt đối không có chuỗi kết nối (connection string) tới cơ sở dữ liệu chính của hệ thống, không sở hữu dữ liệu người học và không tham gia vào việc chấm điểm hay thăng cấp bài học. Khi dịch vụ này tạm thời không khả dụng, hệ thống cốt lõi vẫn vận hành hoàn toàn bình thường.

### 2.7.3. Kiến trúc triển khai và các vùng an ninh

Mô hình triển khai của Lingora được thiết kế dưới dạng **5 Vùng an ninh logic (5 Logical Security Zones)** độc lập, xác lập rõ ranh giới tin cậy và quyền hạn mạng:

```text
[HÌNH 2.13 — Sơ đồ ranh giới triển khai và các vùng an ninh của hệ thống Lingora]
Nguồn tham chiếu: docs/plantuml/deployment-boundary-m24.puml
```

Chi tiết 5 vùng an ninh:
- **Zone 1: Untrusted Public Client Zone (Vùng Trình duyệt Công cộng):** Bao gồm giao diện Web người học và Web quản trị chạy trên trình duyệt người dùng. Vùng này hoàn toàn không đáng tin cậy (Untrusted), không lưu trữ mã khóa bảo mật hay token JWT trong `localStorage`, chỉ sử dụng cookie bảo vệ `httpOnly` và tuyệt đối không được kết nối mạng trực tiếp tới máy chủ AI hay cơ sở dữ liệu.
- **Zone 2: Trusted Application Server Zone (Vùng Máy chủ Ứng dụng Tin cậy):** Môi trường thực thi phía máy chủ của Next.js (chạy trên hạ tầng Serverless/Edge Runtime). Vùng này lưu trữ các khóa bí mật phía máy chủ (Server-Only API Keys), thực thi tầng BFF, áp đặt thời gian ngắt kết nối cưỡng bức 8.0 giây khi gọi dịch vụ ngoài, và cách ly hoàn toàn khỏi mã khóa đặc quyền Service Role đối với phân hệ người học.
- **Zone 3: Managed Database & Storage Zone (Vùng Dữ liệu & Lưu trữ Được quản lý):** Môi trường cơ sở dữ liệu PostgreSQL 15, dịch vụ Supabase GoTrue Auth và hệ thống lưu trữ đối tượng Supabase Storage. Vùng này thực thi các chính sách bảo mật tối hậu RLS và lưu trữ sổ cái kiểm toán bất biến.
- **Zone 4: Isolated AI Compute Zone (Vùng Tính toán AI Độc lập):** Môi trường thực thi microservice Python/FastAPI chạy mô hình T5-small. Vùng này hoàn toàn cách ly, không kết nối cơ sở dữ liệu chính, xác thực quyền truy cập của người học thông qua việc kiểm chứng chữ ký số của token JWT qua endpoint JWKS công khai.
- **Zone 5: Privileged Infrastructure Operations Zone (Vùng Tác nghiệp Hạ tầng Đặc quyền):** Môi trường dòng lệnh (CLI) nội bộ dành riêng cho kỹ sư kỹ thuật thực hiện các tác vụ di trú cơ sở dữ liệu (Prisma migrate) và nạp dữ liệu khởi tạo. Vùng này sử dụng mã khóa đặc quyền `SUPABASE_SERVICE_ROLE_KEY` và hoàn toàn tách biệt khỏi môi trường vận hành của người dùng.

### 2.7.4. Ranh giới bảo mật cốt lõi

Kiến trúc an ninh của Lingora được bảo vệ bởi 6 ranh giới an ninh (B1 đến B6):
- **B1 (Learner Web Client Boundary):** Ranh giới trình duyệt người học, loại bỏ hoàn toàn việc lưu trữ token trong bộ nhớ cục bộ web; mọi giao tiếp đều thông qua cookie bảo mật và Route Handler proxy.
- **B2 (Admin Web Client Boundary):** Ranh giới giao diện quản trị, kiểm tra quyền hạn giao diện theo vai trò của cán bộ trước khi cho phép hiển thị các nút thao tác nghiệp vụ.
- **B3 (Supabase RLS Policy Boundary):** Ranh giới an ninh tối hậu tại tầng cơ sở dữ liệu PostgreSQL, tự động áp đặt bộ lọc `auth.uid() = user_id` độc lập với mọi câu truy vấn gửi lên từ phía máy khách.
- **B4 (Privileged Service-Role Boundary):** Ranh giới cách ly tài khoản đặc quyền tối cao, cấm tuyệt đối việc nạp biến môi trường chứa khóa đặc quyền vào mã nguồn phân hệ người học hoặc chuyển qua API.
- **B5 (AI External Service Boundary):** Ranh giới cách ly dịch vụ AI, cấm mọi kết nối trực tiếp từ trình duyệt người dùng tới máy chủ AI và chặn đứng hoàn toàn việc AI cố tình truy cập cơ sở dữ liệu.
- **B6 (Audit Store Immutability Boundary):** Ranh giới bất biến của bảng nhật ký kiểm toán, cấu hình chính sách CSDL cấm tuyệt đối thao tác sửa đổi (`UPDATE`) và xóa bỏ (`DELETE`) đối với mọi tác nhân người dùng.

---

## 2.8. Thiết kế cơ sở dữ liệu

Thiết kế cơ sở dữ liệu của Lingora được xây dựng trên hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL 15 (trên nền tảng Supabase), đáp ứng trọn vẹn tính toàn vẹn quan hệ, tính nguyên tử trong giao dịch và tuân thủ các quy định bảo mật tầng sâu.

### 2.8.1. Mô hình dữ liệu và chiến lược chuyển đổi

Báo cáo phân định minh bạch giữa hai trạng thái cơ sở dữ liệu:
- **Cơ sở dữ liệu Hiện tại (CURRENT Applied Schema):** Là cấu trúc cơ sở dữ liệu 18 bảng đang vận hành thực tế trong mã nguồn, bao gồm các bảng nền tảng: `languages`, `profiles` (cột `role` trong schema đã có đủ 6 giá trị vai trò), `courses`, `course_translations`, `units`, `unit_translations`, `lessons`, `lesson_translations`, `vocabularies`, `vocabulary_translations`, `lesson_vocabulary`, `exercises`, `user_progress`, `user_vocab_srs`, `review_logs`, `chat_scenarios`, `chat_scenario_translations` (cung cấp ngữ cảnh prompt tĩnh cho tính năng Scenario Writing), `audit_logs`. Sự tồn tại của bảng trong schema chưa đồng nghĩa hành vi nghiệp vụ tương ứng đã hoàn thiện ở mức production.
- **Mô hình Dữ liệu Mục tiêu (TARGET Design Schema):** Là bản thiết kế hoàn thiện hành vi nghiệp vụ còn lại, bao gồm các bảng kết quả đánh giá bất biến `assessment_results`, hồ sơ kỹ năng `skill_profiles`, việc phân định rõ ràng giữa tiến độ học tập `LearningProgress` với hồ sơ kỹ năng `SkillProfile`, và việc phát sinh đầy đủ sự kiện kiểm toán theo DD-03 (bảng `audit_logs` đã tồn tại ở mức schema, nhưng hành vi ghi sự kiện đầy đủ vẫn thuộc phạm vi hoàn thiện tiếp theo).

Quy tắc bất biến: Mô hình dữ liệu mục tiêu được trình bày trong tài liệu này dưới dạng **đặc tả thiết kế (Target Design)**, hoàn toàn không giả xưng rằng các lệnh di trú mở rộng (DDL) đã được thực thi trên môi trường cơ sở dữ liệu sống.

### 2.8.2. Sơ đồ quan hệ thực thể (ERD)

Sơ đồ quan hệ thực thể mô tả cấu trúc các bảng dữ liệu, khóa chính, khóa ngoại và các mối quan hệ quan hệ ngữ nghĩa cốt lõi trong hệ thống:

```text
[HÌNH 2.14 — Sơ đồ quan hệ thực thể (ERD) của hệ thống Lingora]
Nguồn tham chiếu: docs/plantuml/erd-mvp-learning.puml và erd-logical-status-mapping.puml
```

### 2.8.3. Mô tả các bảng dữ liệu cốt lõi

Dưới đây là bảng phân tích chi tiết các thực thể dữ liệu cốt lõi cấu thành nên hệ thống Lingora, ghi chú rõ ràng trạng thái hiện diện giữa CURRENT và TARGET. Các bảng bản địa hóa (`*_translations`) đã liệt kê tại §2.8.1 không trình bày lại ở đây:

[BẢNG 2.5 — Bảng mô tả chi tiết các bảng dữ liệu cốt lõi trong cơ sở dữ liệu Lingora]

| Tên bảng CSDL | Khóa chính (PK) | Các trường dữ liệu quan trọng | Khóa ngoại & Mối quan hệ chính | Trạng thái kiến trúc | Mục đích lưu trữ nghiệp vụ |
|---|---|---|---|:---:|---|
| **`languages`** | `code` (VarChar) | `name`, `native_name`, `is_learnable`, `is_ui_locale` | Tham chiếu bởi `courses`, `profiles`, các bảng translation. | `CURRENT` | Danh mục ngôn ngữ đích và ngôn ngữ giao diện của hệ thống. |
| **`profiles`** | `id` (UUID) | `email`, `display_name`, `role`, `daily_goal_min`, `streak_count`, `timezone`, `last_qualifying_activity_date` | Khóa ngoại `id` liên kết 1-1 với bảng xác thực `auth.users` của Supabase. | `CURRENT` ở mức schema (đã có đủ 6 vai trò); hành vi phân quyền đầy đủ thuộc `TARGET` | Lưu trữ hồ sơ người dùng, phân quyền vai trò, mục tiêu học tập và chỉ số Streak. |
| **`courses`** | `id` (UUID) | `language_code`, `cefr`, `order_index`, `status`, `is_published` | Khóa ngoại tới `languages(code)`. Quan hệ 1-N tới `units` và `lessons`. | `CURRENT` | Đại diện cho một khóa học gắn với một ngôn ngữ đích xác định. |
| **`units`** | `id` (UUID) | `course_id`, `order_index`, `created_at` | Khóa ngoại tới `courses(id)`. Quan hệ 1-N tới `lessons`. | `CURRENT` | Đại diện cho Đơn vị bài học theo chủ đề (ví dụ 6 Units của đề cương A1). |
| **`lessons`** | `id` (UUID) | `course_id`, `unit_id`, `order_index`, `status`, `is_published`, `creator_id`, `reviewer_id` | Khóa ngoại tới `courses(id)`, `units(id)`, `profiles(id)`. Quan hệ 1-N tới `exercises`. | `CURRENT` (Bổ sung `supersedesId` ở `TARGET`) | Đại diện cho bài học vi mô 5–10 phút, lưu trữ trạng thái vòng đời 6 bước. |
| **`vocabularies`** | `id` (UUID) | `language_code`, `term`, `normalized_term`, `phonetic`, `audio_url`, `cefr` | Khóa ngoại tới `languages(code)`. Quan hệ N-N với `lessons` qua bảng nối. | `CURRENT` | Từ điển từ vựng chuẩn hóa, lưu trữ phát âm chuẩn và đường dẫn âm thanh tĩnh. |
| **`lesson_vocabulary`** | `(lesson_id, vocabulary_id)` | `order_index` | Khóa ngoại kép tới `lessons(id)` và `vocabularies(id)`. | `CURRENT` | Bảng liên kết xác định danh mục từ vựng giảng dạy trong từng bài học. |
| **`exercises`** | `id` (UUID) | `lesson_id`, `type`, `payload` (JSONB), `order_index` | Khóa ngoại tới `lessons(id)`. Enum `type`: MCQ, FILL_BLANK, REORDER ở `CURRENT`; GRAMMAR, LISTENING ở `TARGET`. | `CURRENT` (mở rộng `TARGET`) | Lưu trữ 5 dạng bài tập tương tác chuẩn; nội dung và đáp án đóng gói trong JSONB. |
| **`user_progress`** | `id` (UUID) | `user_id`, `lesson_id`, `status`, `score`, `completed_at` | Khóa ngoại tới `profiles(id)` và `lessons(id)`. Enum `status`: NOT_STARTED, IN_PROGRESS, COMPLETED. | `CURRENT` | Ghi nhận tiến độ học tập cơ học của học viên đối với từng bài học vi mô. |
| **`user_vocab_srs`**| `id` (UUID) | `user_id`, `vocabulary_id`, `interval_days`, `next_review_at`, `review_count`, `lapse_count` | Khóa ngoại tới `profiles(id)` và `vocabularies(id)`. Unique `(user_id, vocabulary_id)`. | `CURRENT` | Thẻ ôn tập ngắt quãng cá nhân của học viên, lưu trữ chu kỳ và mốc nhắc ôn. |
| **`review_logs`** | `id` (UUID) | `srs_card_id`, `is_correct`, `interval_days`, `reviewed_at` | Khóa ngoại tới `user_vocab_srs(id)`. | `CURRENT` | Bản ghi nhật ký lịch sử bất biến ghi nhận từng lượt ôn tập thẻ từ vựng qua RPC. |
| **`chat_scenarios`** | `id` (UUID) | `code` (unique), `is_published`, `system_prompt`, `created_at` | Quan hệ 1-N tới `chat_scenario_translations`. | `CURRENT` ở mức schema; hành vi nghiệp vụ đầy đủ thuộc `TARGET` | Bảng kịch bản luyện viết đã có trong schema hiện tại, được duy trì để cung cấp prompt ngữ cảnh tĩnh cho dịch vụ GEC stateless; phần hành vi nghiệp vụ hoàn chỉnh thuộc thiết kế mục tiêu. |
| **`chat_scenario_translations`** | `(scenario_id, ui_locale)` | `title`, `description` | Khóa ngoại tới `chat_scenarios(id)` (Cascade) và `languages(code)`. | `CURRENT` ở mức schema; hành vi nghiệp vụ đầy đủ thuộc `TARGET` | Tiêu đề và mô tả kịch bản theo ngôn ngữ giao diện của hệ thống. |
| **`assessment_results`** | `id` (UUID) | `user_id`, `assessment_type`, `raw_scores`, `stage_data`, `language_config`, `starting_unit` [DD-06 candidate], `completed_at` | Khóa ngoại tới `profiles(id)`. | `TARGET` | Bản ghi bất biến lưu trữ kết quả bài đánh giá chẩn đoán đầu vào và vượt cấp. |
| **`skill_profiles`** | `id` (UUID) | `user_id`, `vocabulary_level`, `grammar_level`, `reading_level`, `listening_level`, `radar_data` | Khóa ngoại liên kết 1-1 với `profiles(id)`. | `TARGET` | Hồ sơ năng lực đa chiều của học viên phục vụ kết xuất biểu đồ Radar 4 chiều. |
| **`audit_logs`** | `id` (UUID) | `actor_id`, `action`, `target_id`, `timestamp` (UTC), `metadata` (JSONB), `ip_address`, `user_agent` | Khóa ngoại tới `profiles(id)`. Lưu trữ Append-Only bất biến. | `CURRENT` ở mức schema; hành vi ghi nhận sự kiện đầy đủ thuộc `TARGET` | Sổ cái kiểm toán an ninh ghi nhận toàn bộ các thao tác nghiệp vụ nhạy cảm (DD-03). |

---

## 2.9. Thiết kế API

Kiến trúc API của Lingora được thiết kế tuân thủ nguyên tắc phân tách trách nhiệm rõ ràng, chuẩn hóa cấu trúc dữ liệu trao đổi và bảo lưu nguyên vẹn tài liệu hợp đồng quy chuẩn.

*Lưu ý kiến trúc về hiện trạng triển khai:* Phần thiết kế API mô tả hợp đồng giao tiếp chuẩn và các route minh họa của thiết kế mục tiêu; trong đó các route cụ thể tại tầng BFF/Server Actions chỉ là ví dụ triển khai nếu không được đánh dấu là đã khóa (locked), phân định với các endpoint dịch vụ AI đã hoạt động ở CURRENT theo hợp đồng `docs/03-api-contract.md`.

### 2.9.1. Nguyên tắc thiết kế và chuẩn hóa API

Thiết kế giao diện lập trình ứng dụng tuân thủ 4 nguyên tắc kiến trúc bất biến:
1. **Tính Bất biến của Tài liệu Hợp đồng Gốc (`docs/03-api-contract.md`):** Tài liệu `docs/03-api-contract.md` là nguồn dữ liệu chính quy định ranh giới HTTP của dịch vụ AI hỗ trợ và được giữ ở trạng thái chỉ đọc (READ-ONLY). Mọi bổ sung bề mặt giao tiếp mới đều được chuẩn hóa tại tầng BFF mà không làm sai lệch hợp đồng gốc.
2. **Kiến trúc Next.js BFF Route Handlers:** Trình duyệt người học và cổng quản trị không gọi trực tiếp tới các dịch vụ backend phân tán hoặc máy chủ AI. Mọi yêu cầu đều đi qua các Route Handler nội bộ đóng vai trò Lớp điều phối ứng dụng (Backend-for-Frontend - BFF).
3. **Phân tách Rạch ròi Đọc và Ghi:** Các truy vấn đọc dữ liệu học liệu công khai và dữ liệu cá nhân của người học được tối ưu hóa qua tầng Supabase PostgREST có bảo vệ bởi chính sách RLS. Các thao tác ghi nhạy cảm (biến đổi trạng thái, cập nhật SRS, xuất bản nội dung) bắt buộc phải đi qua các hàm thủ tục lưu trữ an toàn (RPC) hoặc Server Actions có kiểm tra quyền hạn.
4. **Cơ chế Chuyển tiếp Danh tính An toàn (Identity Propagation):** BFF trích xuất mã thông báo JWT từ session cookie của người dùng và chuyển tiếp vào tiêu đề `Authorization: Bearer <token>` khi gọi tới PostgREST, RPC hoặc máy chủ AI. Dịch vụ nhận yêu cầu tự động giải mã và kiểm chứng chữ ký số của token để xác thực danh tính mà không cần chia sẻ cơ sở dữ liệu.

### 2.9.2. Phân nhóm các bề mặt dịch vụ API

Hệ thống phân định 10 bề mặt giao tiếp dịch vụ bao quát toàn bộ các hoạt động của nền tảng:

[BẢNG 2.6 — Bảng phân nhóm 10 bề mặt giao tiếp dịch vụ API của hệ thống Lingora]

| Bề mặt Giao tiếp | Giao thức / Endpoint mẫu | Bản chất Thao tác | Cơ chế Xác thực & Ngữ cảnh | Mã lỗi giao tiếp |
|---|---|:---:|---|---|
| **1. AI Health & Model Info** | `GET /health/live`<br>`GET /health/ready`<br>`GET /v1/model/info` | Read-only | Không yêu cầu xác thực (Nội bộ / Private Subnet). | `MODEL_UNAVAILABLE (503)` |
| **2. AI GEC Target** | `POST /v1/gec/correct` | Stateless Compute | Token Bearer JWT người học chuyển tiếp qua BFF proxy. | `INVALID_INPUT (400)`, `TEXT_TOO_LONG (413)`, `LANG_NOT_SUPPORTED (422)`, `MODEL_UNAVAILABLE (503)` |
| **3. AI Compatibility Surface** | `POST /v1/srs/schedule`<br>`POST /v1/chat/*` | Compatibility (được duy trì) | Endpoint tương thích đã triển khai, được giữ cho các surface hiện có; không dùng cho luồng Core mới. | `SCENARIO_NOT_FOUND (404)`, `INVALID_INPUT (400)` |
| **4. Web Route Handler Proxy** | `POST /api/ai/gec`<br>*(cú pháp route [MINH HỌA — CHƯA KHÓA CỐ ĐỊNH])* | Proxying (Transient) | Session Cookie an toàn của người học (`Learner`). | `UNAUTHORIZED (401)`, `RATE_LIMITED (429)`, `DEPENDENCY_TIMEOUT (504)` |
| **5. Supabase GoTrue Auth** | `POST /auth/v1/token`<br>`POST /auth/v1/recover` | Read / Write | Khóa công khai `Anon Key` và mã xác thực đăng nhập. | `invalid_credentials`, `user_already_exists` |
| **6. Supabase PostgREST Reads** | `GET /rest/v1/courses`<br>`GET /rest/v1/lessons` | Read-only | Token Bearer JWT (`auth.uid()`), tự động lọc bởi RLS. | `401 Unauthorized`, `403 Forbidden` (Empty Set) |
| **7. Supabase RPC Mutations** | `POST /rest/v1/rpc/record_review` | Atomic Mutation | Token Bearer JWT (`auth.uid()` bắt buộc bên trong hàm CSDL). | `403 Forbidden (Card Not Owned)`, `500 Transaction Error` |
| **8. Supabase Storage API** | `GET /storage/v1/object/...`<br>`POST /storage/v1/object/...` | Read / Write | Đọc tệp âm thanh qua đường dẫn RLS trực tiếp sau khi xác thực (bucket private, không public read); ghi avatar/media theo phạm vi người dùng. | `RESOURCE_NOT_FOUND (404)`, `UNAUTHORIZED (401)` |
| **9. Admin Mutation Boundary** | Server Actions `/admin/lessons/...`<br>*(cú pháp route [MINH HỌA — CHƯA KHÓA CỐ ĐỊNH])* | Write / Read | Session Cookie cán bộ (`Staff Roles`) kèm kiểm tra chốt chặn SoD. | `SOD_VIOLATION_SELF_REVIEW (403)`, `INVALID_STATE_TRANSITION (400)` |
| **10. Assessment Services Boundary**| Server Actions `/placement/...`<br>*(cú pháp route [MINH HỌA — CHƯA KHÓA CỐ ĐỊNH])* | Write / Read | Session Cookie người học (`Learner`). | `JUMP_COOLDOWN_ACTIVE (429)`, `ASSESSMENT_ABORTED (400)` |

*(Lưu ý kỹ thuật: Toàn bộ các đường dẫn `/api/...` hoặc `/admin/...` phía trên mang tính chất minh họa cho kiến trúc phân tầng Route Handler / BFF và không trói buộc định dạng framework cố định).*

Luyện viết theo tình huống (`P1-FR-007`, Scenario Writing) đọc ngữ cảnh prompt từ các scenario đã publish (`chat_scenarios`), gọi AI/GEC xử lý transient qua BFF proxy và không lưu trạng thái phiên (schema canonical không có `ChatSession`/`ChatMessage`).

### 2.9.3. Cơ chế xác thực và phân quyền API

Giao thức xác thực và ủy quyền trên các kênh API được thực thi qua 3 lớp phòng vệ:
- **Lớp Trình duyệt $\rightarrow$ BFF:** Trình duyệt đính kèm cookie bảo mật mang cờ `httpOnly=true` và `SameSite=Lax`. BFF giải mã phiên và xác thực danh tính người dùng trước khi xử lý yêu cầu.
- **Lớp BFF $\rightarrow$ Cơ sở dữ liệu Supabase:** BFF trích xuất mã thông báo truy cập JWT và chuyển tiếp qua tiêu đề `Authorization: Bearer <token>`. Tầng cơ sở dữ liệu PostgreSQL tự động trích xuất `auth.uid()` để áp dụng các chính sách an ninh từng dòng RLS.
- **Lớp BFF $\rightarrow$ Dịch vụ AI (`lingora-ai`):** BFF chuyển tiếp Bearer token JWT của người dùng sang máy chủ FastAPI. Máy chủ AI tải khóa công khai từ endpoint JWKS của Supabase GoTrue để kiểm chứng tính toàn vẹn và thời hạn sống của chữ ký số (ES256/HS256) mà hoàn toàn không cần kết nối tới cơ sở dữ liệu chính.

### 2.9.4. Cấu trúc dữ liệu đầu vào, đầu ra và chuẩn hóa xử lý lỗi

Hệ thống Lingora kế thừa cấu trúc bao gói lỗi (Error Envelope) chuẩn mực từ tài liệu `docs/03-api-contract.md` (mục Envelope lỗi dùng chung) với trường thông tin chi tiết `"detail"` ở dạng số ít (chuỗi ký tự hoặc đối tượng mô tả). Trường `request_id` là thành phần mở rộng thiết kế tùy chọn phục vụ công tác giám sát viễn trắc và truy vết lỗi:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Dữ liệu đầu vào không hợp lệ hoặc thiếu trường bắt buộc",
    "detail": "Trường dailyGoalMin bắt buộc phải nằm trong khoảng từ 5 đến 120 phút",
    "request_id": "req_01hzx8abc123"
  }
}
```

Bảng phân loại mã lỗi giao tiếp hệ thống phân định rạch ròi nguồn gốc giữa các mã quy định từ hợp đồng chuẩn gốc (`CANONICAL_FROM_03`), các mã thiết kế bổ sung của phân hệ phần mềm M2.3 (`M2.3_DESIGN_ADDITION`), và các mã dành riêng cho phân hệ mở rộng tương lai (`FUTURE`):

[BẢNG 2.7 — Bảng chuẩn hóa mã lỗi giao tiếp và phân loại nguồn gốc hệ thống]

| Mã lỗi (Error Code) | Mã HTTP | Phân loại nguồn gốc | Ngữ cảnh phát sinh lỗi | Hành vi xử lý & Phục hồi hệ thống |
|---|:---:|:---:|---|---|
| **`INVALID_INPUT`** | 400 | `CANONICAL_FROM_03` | Dữ liệu gửi lên bị rỗng, sai kiểu dữ liệu hoặc vi phạm ràng buộc miền giá trị. | Trả về thông điệp chi tiết qua `detail`, giữ nguyên dữ liệu trên form người dùng. |
| **`UNAUTHORIZED`** | 401 | `CANONICAL_FROM_03` | Người dùng chưa đăng nhập, token JWT không hợp lệ hoặc phiên làm việc hết hạn. | Xóa session cookie hỏng, chuyển hướng người dùng về trang đăng nhập `/login`. |
| **`TEXT_TOO_LONG`** | **413** | `CANONICAL_FROM_03` | Văn bản bài viết của người học vượt quá giới hạn độ dài quy định. | Thông báo lỗi, yêu cầu người học rút ngắn nội dung trước khi gửi lại. |
| **`LANG_NOT_SUPPORTED`**| **422** | `CANONICAL_FROM_03` | Mã ngôn ngữ gửi lên không nằm trong danh mục hỗ trợ (khác mã `en`). | Từ chối xử lý, thông báo rõ ngôn ngữ đích được hỗ trợ hiện hành. |
| **`SCENARIO_NOT_FOUND`** | 404 | `CANONICAL_FROM_03` | Mã tình huống bài viết không tồn tại hoặc chưa đạt trạng thái xuất bản. | Hiển thị thông báo kịch bản không tồn tại, gợi ý quay về danh mục. |
| **`RATE_LIMITED`** | 429 | `CANONICAL_FROM_03` | Tần suất gửi yêu cầu vượt quá hạn mức an toàn. | Từ chối tạm thời, yêu cầu người dùng chờ đợi trước khi thực hiện lại. |
| **`MODEL_UNAVAILABLE`** | 503 | `CANONICAL_FROM_03` | Dịch vụ suy luận AI chưa tải xong mô hình hoặc hệ thống AI đang quá tải. | Kích hoạt cơ chế suy thoái tính năng an toàn, thông báo hệ thống bận, không chặn bài học. |
| **`FORBIDDEN`** | 403 | `M2.3_DESIGN_ADDITION` | Người dùng không đủ thẩm quyền thực hiện thao tác trên tài nguyên mục tiêu. | Chặn đứng thao tác, ghi nhận cảnh báo vi phạm quyền hạn nếu cần. |
| **`NOT_FOUND`** | 404 | `M2.3_DESIGN_ADDITION` | Bài học, từ vựng hoặc thực thể yêu cầu không tồn tại trong cơ sở dữ liệu. | Kết xuất trang thông báo 404 thân thiện, gợi ý quay lại lộ trình học tập. |
| **`DEPENDENCY_TIMEOUT`** | 504 | `M2.3_DESIGN_ADDITION` | Yêu cầu chuyển tiếp tới dịch vụ AI vượt quá giới hạn thời gian chờ tối đa 8.0 giây. | BFF tự động ngắt kết nối, kích hoạt fallback an toàn, bảo toàn văn bản người học. |
| **`SOD_VIOLATION_SELF_REVIEW`** | 403 | `M2.3_DESIGN_ADDITION` | Soạn giả cố tình thực hiện thao tác phê duyệt bài học do chính mình tạo ra. | Chặn đứng yêu cầu ngay tại BFF; thông tin vi phạm có thể được ghi nhận ở mức log ứng dụng (chưa thuộc 11 sự kiện kiểm toán an ninh canonical của quyết định DD-03, xem Bảng 2.10 và tài liệu `docs/phase-1-m2-4-architecture-security.md`, mục 9.2). |
| **`SOD_VIOLATION_MODERATOR_PUBLISH`** | 403 | `M2.3_DESIGN_ADDITION` | Kiểm duyệt viên cố tình thực hiện thao tác xuất bản bài học ra môi trường học viên. | Chặn đứng yêu cầu ngay tại BFF, thông báo thao tác thuộc thẩm quyền của Quản lý. |
| **`INVALID_STATE_TRANSITION`** | 400 | `M2.3_DESIGN_ADDITION` | Thao tác chuyển đổi trạng thái thực thể vi phạm quy trình vòng đời (vd: duyệt bài DRAFT). | Từ chối thao tác, thông báo rõ trạng thái hiện tại của thực thể. |
| **`JUMP_COOLDOWN_ACTIVE`** | 429 | `M2.3_DESIGN_ADDITION` | Học viên cố làm bài kiểm tra Jump khi đang trong thời gian phạt khóa chờ 24 giờ. | Từ chối nộp bài, hiển thị đồng hồ đếm ngược thời gian chờ còn lại cho học viên. |
| **`ASSESSMENT_ABORTED`** | 400 | `M2.3_DESIGN_ADDITION` | Phiên đánh giá bị hủy bỏ do vi phạm điều kiện thực thi (hết thời gian, thiếu dữ liệu). | Đóng phiên, hướng dẫn học viên bắt đầu lại phiên đánh giá mới. |
| **`TRANSACTION_FAILURE`**| 500 | `M2.3_DESIGN_ADDITION` | Giao dịch nguyên tử trong thủ tục lưu trữ `record_review` bị lỗi kỹ thuật. | Tự động rollback toàn bộ giao dịch, đảm bảo không phát sinh dữ liệu rác trong CSDL. |
| **`COHORT_SEATS_EXCEEDED`**| 409 | `FUTURE` | Số lượng học viên vượt quá số lượng chỗ cam kết của gói nhóm tổ chức (`UC-15`). | Thông báo cho Người quản lý đào tạo nâng cấp hạn mức gói thành viên. |

---

## 2.10. Thiết kế giao diện người dùng (UI/UX)

Thiết kế giao diện người dùng của Lingora được xây dựng theo triết lý tập trung vào người học (Learner-Centered Design), hướng tới trải nghiệm học tập vi mô trực quan, giảm thiểu tối đa các thao tác thừa và duy trì sự tập trung cao độ. Cần nhấn mạnh rằng toàn bộ các nội dung trong phần này đại diện cho **Bản thiết kế giao diện (UI Design Specification)**, không phải là kết quả chụp màn hình sản phẩm đã hoàn thiện triển khai.

### 2.10.1. Luồng màn hình và điều hướng tổng thể

Hệ thống phân định rành mạch hai chuỗi điều hướng màn hình độc lập tương ứng với hai phân hệ: Chuỗi màn hình người học (`SCR-L-01` đến `SCR-L-14`) và Chuỗi màn hình tác nghiệp quản trị (`SCR-A-01` đến `SCR-A-11`):

```text
[HÌNH 2.15 — Sơ đồ luồng điều hướng màn hình tổng thể của hệ thống Lingora]
Nguồn tham chiếu: docs/plantuml/screen-flow-inventory-m22.puml
```

### 2.10.2. Nhóm màn hình phân hệ người học

Phân hệ người học bao gồm 14 màn hình tương tác được thiết kế tối ưu hóa cho trải nghiệm di động (Mobile-First):
- `SCR-L-01 (Màn hình Chào mừng & Xác thực):` Giao diện đăng nhập, đăng ký tài khoản và khôi phục mật khẩu. Thiết kế tối giản, hỗ trợ thông báo lỗi trực quan tại chỗ.
- `SCR-L-02 (Màn hình Thiết lập Mục tiêu Onboarding):` Giúp học viên lựa chọn mục tiêu học tập hàng ngày (từ 5 đến 120 phút), chọn khung giờ nhắc nhở ưu tiên và ngôn ngữ giao diện.
- `SCR-L-03 (Màn hình Lựa chọn Phương thức Khởi đầu):` Cho phép học viên lựa chọn giữa việc làm bài Đánh giá chẩn đoán thích ứng (Khuyến nghị) hoặc Tự khai báo cấp độ / Bỏ qua để bắt đầu từ Unit 1.
- `SCR-L-04 (Màn hình Thực thi Đánh giá Chẩn đoán):` Giao diện làm bài kiểm tra chẩn đoán 2 giai đoạn (~25–30 câu hỏi), hiển thị thanh tiến trình trực quan và bộ đếm thời gian.
- `SCR-L-05 (Màn hình Tổng kết Xếp lớp):` Hiển thị Đơn vị bài học xuất phát (`Starting Unit`) được khuyến nghị, biểu đồ hồ sơ kỹ năng Spider Chart và nút bấm dẫn vào lộ trình học tập.
- `SCR-L-06 (Bảng điều khiển Lộ trình Học tập Dashboard):` Trọng tâm điều hướng của học viên, hiển thị cây lộ trình học tập trực quan (Course $\rightarrow$ Unit $\rightarrow$ Lesson) với các chỉ số trạng thái Khóa, Đang học, Đã hoàn thành, cùng nút kích hoạt kiểm tra nhảy bài (Jump).
- `SCR-L-07 (Màn hình Trình phát Bài học vi mô Lesson Player):` Giao diện học từ vựng kèm nút nghe âm thanh chuẩn và lần lượt thực hiện 5 dạng bài tập tương tác với phản hồi tức thì.
- `SCR-L-08 (Hộp thoại Làm lại Câu sai Controlled Retry Modal):` Hộp thoại chuyên biệt xuất hiện ở cuối bài học, cho phép học viên làm lại các câu sai trong phạm vi hạn mức allowance để nhận trần 70% credit.
- `SCR-L-09 (Màn hình Tổng kết Hoàn thành Bài học):` Tổng kết điểm số đạt được, số từ vựng mới tiếp thu, tỷ lệ chính xác và trạng thái cập nhật chuỗi ngày học Streak.
- `SCR-L-10 (Màn hình Ôn tập Ngắt quãng SRS Review Session):` Giao diện ôn tập thẻ ghi nhớ flashcard lật mặt, phát âm thanh từ vựng và các nút tự đánh giá phản xạ ghi nhớ.
- `SCR-L-11 (Màn hình Kiểm tra Nhảy bài Jump Runner):` Giao diện thực hiện bài thi vượt cấp 20 câu hỏi (cho Unit kế cận) với yêu cầu độ chính xác khắt khe $\ge 95\%$.
- `SCR-L-12 (Trung tâm Bài học Vi mô Bổ trợ Remedial Hub):` Nơi lưu trữ các bài học ngắn khắc phục lỗ hổng kiến thức được hệ thống chỉ định riêng cho từng học viên.
- `SCR-L-13 (Màn hình Luyện viết Tình huống Scenario Writing):` Giao diện nhập câu văn tự do tiếng Anh theo ngữ cảnh kịch bản và nhận phản hồi gợi ý sửa lỗi từ dịch vụ AI hỗ trợ.
- `SCR-L-14 (Màn hình Hồ sơ Cá nhân & Chuỗi ngày học Profile):` Hiển thị thông tin cá nhân, chỉ số chuỗi ngày liên tục (Streak Counter), lịch sử học tập và tùy chọn làm lại bài chẩn đoán.

```text
[HÌNH 2.16 — Bản vẽ Wireframe thiết kế các màn hình phân hệ người học]
Bao gồm: Dashboard Lộ trình (SCR-L-06), Trình phát bài học (SCR-L-07) và Hộp thoại Retry (SCR-L-08)
```

### 2.10.3. Nhóm màn hình phân hệ quản trị và học liệu

Phân hệ quản trị bao gồm 11 màn hình chuyên biệt được thiết kế tối ưu hóa cho màn hình máy tính để bàn (Desktop-Optimized) phục vụ công tác tác nghiệp dữ liệu phức tạp:
- `SCR-A-01 (Màn hình Xác thực & Điều phối Cán bộ):` Giao diện đăng nhập an toàn dành riêng cho đội ngũ cán bộ với kiểm tra vai trò.
- `SCR-A-02 (Bảng điều khiển Vận hành Tác nghiệp):` Tổng hợp các bài học cần biên soạn, hàng đợi kiểm duyệt và tình trạng xuất bản của các Đơn vị bài học.
- `SCR-A-03 (Trình Biên tập Khung Đề cương & Bài học):` Công cụ dành cho Quản lý đào tạo và Soạn giả để cấu trúc các Unit, thiết lập metadata bài học và mục tiêu sư phạm.
- `SCR-A-04 (Ngân hàng Biên soạn Bài tập Item Bank Authoring):` Công cụ nhập liệu từ vựng, tải lên tệp âm thanh chuẩn và thiết lập câu hỏi cho 5 dạng bài tập tương tác kèm lời giải thích.
- `SCR-A-05 (Giao diện Hàng đợi Kiểm duyệt Moderation Board):` Bàn làm việc của Kiểm duyệt viên với công cụ nghe thử âm thanh, đối chuẩn ngữ liệu và các nút bấm Phê duyệt / Yêu cầu sửa đổi kèm lý do.
- `SCR-A-06 (Bàn Vận hành Xuất bản Publishing Operations):` Công cụ kiểm tra điều kiện hoàn tất 4/4 bài học của Unit và kích hoạt xuất bản chính thức hoặc xuất bản khẩn cấp.
- `SCR-A-07 (Cổng Quản trị Tài khoản & Phân quyền User Admin):` Giao diện quản lý danh mục người dùng, khóa/mở khóa tài khoản và gán 6 vai trò.
- `SCR-A-08 (Màn hình Báo cáo Thống kê Vận hành System Reports):` Các biểu đồ trực quan về số lượng học viên hoạt động, tỷ lệ hoàn thành bài học và phân tích chất lượng học liệu.
- `SCR-A-09 (Trình Tra cứu Nhật ký Kiểm toán Audit Log Viewer):` Công cụ tìm kiếm, lọc và tra cứu chuỗi sự kiện an ninh bất biến của hệ thống.
- `SCR-A-10 (Hàng đợi Tiếp nhận Hỗ trợ Support Ticket Queue):` Giao diện tiếp nhận, phân loại và xử lý các phiếu khiếu nại của học viên dành cho Nhân viên vận hành.
- `SCR-A-11 (Cổng Quản lý Nhóm Lớp học Cohort Portal):` Phân hệ mở rộng trong tương lai dành cho việc quản lý các nhóm đào tạo doanh nghiệp hoặc trường học (`UC-15`).

```text
[HÌNH 2.17 — Bản vẽ Wireframe thiết kế các màn hình phân hệ quản trị và kiểm duyệt]
Bao gồm: Bàn làm việc Kiểm duyệt viên (SCR-A-05) và Bàn vận hành xuất bản (SCR-A-06)
```

---

## 2.11. Thiết kế an ninh, bảo mật và phân quyền

An ninh thông tin và bảo mật dữ liệu được đặt làm trọng tâm xuyên suốt kiến trúc Lingora, đảm bảo dữ liệu cá nhân của người học luôn được bảo vệ trong phạm vi thiết kế.

*Lưu ý kiến trúc về hiện trạng triển khai:* Các quy tắc phân quyền (RBAC), ma trận phân tách trách nhiệm (SoD) và sổ cái kiểm toán dưới đây là yêu cầu bảo mật của thiết kế mục tiêu (TARGET Security Specification); việc cơ sở dữ liệu hiện tại (`CURRENT`) đã có các trường vai trò trong `profiles` hoặc cấu trúc bảng `audit_logs` không đồng nghĩa rằng toàn bộ cơ chế thực thi tự động (enforcement) đã hoàn tất ở mức production.

### 2.11.1. Cơ chế xác thực và quản lý phiên

Hệ thống sử dụng dịch vụ Supabase GoTrue Auth cung cấp cơ chế xác thực danh tính dựa trên tiêu chuẩn JSON Web Token (JWT):
- **Cấu trúc Token & Ký số:** Sau khi xác thực thành công, GoTrue phát hành token JWT chứa các trường (`sub`, `email`, `role`, `exp`). Hệ thống hỗ trợ kiểm chứng chữ ký bất đối xứng bằng thuật toán **ES256** thông qua endpoint khóa công khai JWKS của Supabase, cho phép các dịch vụ độc lập như máy chủ AI xác thực danh tính người học mà không cần lưu giữ khóa bí mật dùng chung.
- **Ranh giới Phiên làm việc Bảo vệ:** Toàn bộ mã thông báo truy cập và mã làm mới phiên phía người dùng được lưu trữ độc quyền trong cookie máy chủ mang cờ `httpOnly=true`, `SameSite=Lax` và `Secure`. Hệ thống **tuyệt đối cấm** việc lưu trữ token xác thực trong `localStorage` hoặc `sessionStorage` của trình duyệt nhằm triệt tiêu hoàn toàn rủi ro bị đánh cắp phiên qua tấn công Cross-Site Scripting (XSS).

### 2.11.2. Phân quyền truy cập dựa trên vai trò (RBAC)

Hệ thống Lingora thiết lập ma trận phân quyền dựa trên vai trò (Role-Based Access Control - RBAC) bao phủ 6 vai trò người dùng. Mỗi vai trò được giới hạn trong phạm vi đặc quyền tối thiểu cần thiết để hoàn thành nhiệm vụ:

[BẢNG 2.8 — Ma trận phân quyền vai trò người dùng (RBAC Matrix)]

| Nhóm chức năng / Quyền hạn nghiệp vụ | `Learner` | `Lesson Creator` | `Moderator` | `Organizational Manager` | `Operations Staff` | `Administrator` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Học bài, làm bài tập & Ôn tập SRS (`UC-03..07`)** | **Toàn quyền** | Cấm | Cấm | Cấm | Cấm | Cấm |
| **Khởi tạo & Chỉnh sửa Bản nháp học liệu (`UC-08`)**| Cấm | **Sở hữu bài mình** | Cấm | Cấm | Cấm | Cấm |
| **Thẩm định & Phê duyệt bài học (`UC-09`)** | Cấm | Cấm | **Thẩm định độc lập** | Cấm | Cấm | Cấm |
| **Lập kế hoạch đề cương & Giao việc (`BF-02/03`)** | Cấm | Cấm | Cấm | **Toàn quyền** | Cấm | Giám sát |
| **Xuất bản Đơn vị bài học chính thức (`UC-10`)** | Cấm | Cấm | Cấm | **Toàn quyền (4/4 bài)** | Cấm | Cấm |
| **Xuất bản Khẩn cấp bài học đã duyệt (`ADR-020`)** | Cấm | Cấm | Cấm | Cấm | Cấm | **Chỉ bài APPROVED** |
| **Tiếp nhận & Xử lý Ticket hỗ trợ (`UC-14`)** | Gửi ticket | Cấm | Cấm | Cấm | **Xử lý hỗ trợ** | Giám sát |
| **Tra cứu Nhật ký Kiểm toán an ninh (`UC-13`)** | Cấm | Cấm | Cấm | Cấm | Cấm | **Đọc toàn quyền** |
| **Quản trị tài khoản & Phân quyền vai trò (`UC-11`)**| Cấm | Cấm | Cấm | Cấm | Cấm | **Quản trị tối cao** |

### 2.11.3. Bảo mật dữ liệu tầng sâu bằng Row Level Security (RLS)

Để loại bỏ nguy cơ rò rỉ dữ liệu khi tầng ứng dụng gặp sự cố hoặc bị tấn công vượt quyền, Lingora thiết lập hàng phòng ngự chiều sâu bằng chính sách **Row Level Security (RLS)** được thực thi trực tiếp bên trong nhân cơ sở dữ liệu PostgreSQL:
- **Cô lập dữ liệu người học:** Toàn bộ các bảng dữ liệu cá nhân gồm `profiles`, `user_progress`, `user_vocab_srs`, `review_logs`, `assessment_results` và `skill_profiles` đều được gắn chính sách RLS cưỡng chế kiểm tra `auth.uid() = user_id`. Học viên A tuyệt đối không thể đọc hoặc chỉnh sửa bản ghi dữ liệu của Học viên B dù cố tình sửa đổi tham số trên URL hay gửi câu truy vấn trực tiếp.
- **Bảo vệ học liệu công khai:** Bảng `courses`, `units`, `lessons` và `exercises` áp đặt chính sách: người học chỉ được phép đọc các bản ghi đã đạt trạng thái xuất bản (`is_published = true` và `status = 'PUBLISHED'`). Các bản thảo đang soạn hoặc đang duyệt hoàn toàn vô hình đối với người học ở cấp độ cơ sở dữ liệu.
- **Quyền biên soạn theo quyền sở hữu:** Soạn giả chỉ được phép đọc và sửa đổi các bản ghi bài học ở trạng thái `DRAFT` do chính mình tạo ra (`creator_id = auth.uid()`).

### 2.11.4. Phân tách trách nhiệm (Separation of Duties - SoD)

Hệ thống thiết lập ma trận kiểm soát Phân tách Trách nhiệm (Separation of Duties - SoD) để ngăn chặn gian lận nội dung và xung đột lợi ích, với các quy tắc từ chối nghiêm ngặt:

[BẢNG 2.9 — Ma trận phân tách trách nhiệm trong quy trình quản trị học liệu (SoD Matrix)]

| Vai trò người dùng | Quyền Soạn bài | Quyền Duyệt bài | Quyền Xuất bản thường | Quyền Xuất bản khẩn cấp |
|---|:---:|:---:|:---:|:---:|
| **`Lesson Creator`** | **CÓ** (Bản nháp của mình) | **CẤM TUYỆT ĐỐI** | CẤM | CẤM |
| **`Moderator`** | CẤM | **CÓ** (Thẩm định độc lập) | **CẤM TUYỆT ĐỐI** | CẤM |
| **`Organizational Manager`** | CẤM | CẤM | **CÓ** (Khi đủ 4/4 bài duyệt) | CẤM |
| **`Administrator`** | CẤM | CẤM | CẤM | **CÓ (có điều kiện)** |

Các đường dẫn từ chối cưỡng bức (Negative Authorization Paths):
- **Kịch bản Creator tự duyệt bài:** Khi Soạn giả gửi yêu cầu phê duyệt bài học, tầng điều phối Server Action kiểm tra danh tính `auth.uid() == creatorId`. Nếu trùng khớp, hệ thống lập tức cắt đứt xử lý và trả về mã lỗi `403 Forbidden (SOD_VIOLATION_SELF_REVIEW)`.
- **Kịch bản Moderator tự ý xuất bản:** Nếu Kiểm duyệt viên cố tình gửi lệnh xuất bản bài học, hệ thống kiểm tra vai trò và từ chối ngay lập tức với mã lỗi `403 Forbidden (SOD_VIOLATION_MODERATOR_PUBLISH)`.
- **Kịch bản Admin xuất bản bài chưa duyệt:** Nếu Quản trị viên kích hoạt quyền xuất bản khẩn cấp đối với một bài học đang ở trạng thái `DRAFT` hoặc `IN_REVIEW`, hệ thống kiểm tra trạng thái vòng đời và chặn đứng thao tác với lỗi `403 Forbidden`. Quản trị viên chỉ có thể phát hành khẩn cấp bài học đã được Kiểm duyệt viên phê duyệt (`APPROVED`) và bắt buộc phải nhập lý do giải trình.

### 2.11.5. Kiến trúc kiểm toán an ninh bất biến (Audit Logging)

Căn cứ phán quyết kiến trúc 3 tầng đối với quyết định **DD-03**, hệ thống Lingora thiết lập một nền tảng kiểm toán an ninh bất biến (Immutable & Append-Only Audit Ledger) ghi nhận toàn bộ các thao tác nhạy cảm:
- **Tầng 1 (Locked Behavior — Quy tắc bất biến):** Mọi hành vi nhạy cảm bắt buộc phải phát sinh bản ghi kiểm toán chứa tối thiểu 4 trường ngữ nghĩa: Tác nhân (`actor_id`), Hành động (`action`), Đối tượng tác động (`target_id`) và Thời điểm (`timestamp` theo chuẩn UTC ISO 8601). Quy tắc thiết kế cho sổ cái kiểm toán: chỉ hỗ trợ thao tác `INSERT` và `SELECT`; cấm mọi thao tác `UPDATE` và `DELETE` đối với mọi người dùng (kể cả Quản trị viên hệ thống), được cấu hình qua chính sách an ninh CSDL ở giai đoạn triển khai hoàn thiện (hiện tại bảng đã có cấu trúc DDL ở `CURRENT`).
- **Tầng 2 (Design Specification — Đặc tả thiết kế chuẩn hóa):** Danh mục 11 mã sự kiện an ninh nhạy cảm canonical được quy định thống nhất:

[BẢNG 2.10 — Danh mục 11 sự kiện kiểm toán an ninh nhạy cảm (Security Event Catalog)]

| Mã sự kiện (Event Code) | Nhóm sự kiện | Tác nhân gây ra | Hành vi ghi nhận (`action`) | Đối tượng tác động (`target`) | Mức độ an ninh |
|---|---|---|---|---|:---:|
| **`AUTH_LOGIN_FAILED`** | Xác thực | Người dùng / Vô danh | Đăng nhập thất bại quá số lần quy định | `Profile` (email) | WARNING |
| **`ROLE_ASSIGNED`** | Phân quyền | `Administrator` | Thay đổi hoặc gán vai trò người dùng | `Profile` (`target_user_id`) | CRITICAL |
| **`ACCOUNT_SUSPENDED`** | Quản trị | `Administrator` | Khóa hoặc đình chỉ tài khoản người dùng | `Profile` (`target_user_id`) | CRITICAL |
| **`CONTENT_APPROVED`** | Vòng đời học liệu | `Moderator` | Thẩm định và phê duyệt bản thảo bài học | `Lesson` (`lesson_id`) | INFO |
| **`CONTENT_CHANGES_REQ`** | Vòng đời học liệu | `Moderator` | Yêu cầu chỉnh sửa bản thảo bài học | `Lesson` (`lesson_id`) | INFO |
| **`CONTENT_PUBLISHED`** | Vòng đời học liệu | `Organizational Manager` | Xuất bản Unit/Lesson ra catalog học tập | `Unit` / `Lesson` | INFO |
| **`CONTENT_EMERGENCY_PUB`**| Khẩn cấp | `Administrator` | Phát hành khẩn cấp bài học đã `APPROVED` | `Lesson` (`lesson_id`) | ALERT |
| **`CONTENT_EMERGENCY_ARCH`**| Khẩn cấp | `Administrator` | Lưu trữ khẩn cấp bài học đang phát hành | `Lesson` (`lesson_id`) | ALERT |
| **`DIAGNOSTIC_COMPLETED`** | Đánh giá | `Learner` | Hoàn thành bài chẩn đoán xếp lớp đầu vào | `AssessmentResult` | INFO |
| **`JUMP_LOCKOUT_TRIGGERED`**| Đánh giá | `Learner` | Không đạt bài nhảy cấp, kích hoạt khóa 24h | `LearnerProfile` | WARNING |
| **`AUDIT_LOG_INSPECTED`** | Kiểm toán | `Administrator` | Truy vấn tra cứu nhật ký kiểm toán hệ thống | `AuditLog` | WARNING |

- **Tầng 3 (Open Physical Representation - Biểu diễn vật lý giữ mở):** Cấu trúc chi tiết trường siêu dữ liệu `metadata` (JSONB), việc áp dụng cơ chế Database Trigger hay Application Emit, chính sách lưu trữ lạnh lâu dài và thu thập địa chỉ IP (tuân thủ luật bảo vệ dữ liệu PII) được giữ ở trạng thái mở thiết kế cho Phase 2; tuyệt đối không tạo bảng DDL vật lý tại mốc này.

---

## 2.12. Các quyết định thiết kế quan trọng

Trong quá trình phân tích và thiết kế hệ thống Lingora, nhóm nghiên cứu đã đưa ra năm quyết định kiến trúc trọng yếu có ảnh hưởng trực tiếp đến sự ổn định và tính sư phạm của nền tảng:

### 2.12.1. Điểm xuất phát từ Đánh giá chẩn đoán đầu vào
- **Vấn đề thực tế:** Nhiều ứng dụng học ngoại ngữ ép buộc học viên phải học lại các kiến thức cơ bản quá quen thuộc, gây lãng phí thời gian và làm giảm hứng thú. Ngược lại, nếu cho phép người học tự ý chọn bài học nâng cao mà không qua kiểm tra, người học sẽ nhanh chóng bị quá tải do hổng kiến thức nền tảng.
- **Lựa chọn giải pháp:** Thiết kế cơ chế khởi đầu linh hoạt kết hợp giữa bài đánh giá chẩn đoán thích ứng 2 giai đoạn (Routing $\rightarrow$ Targeted) và quy tắc ánh xạ **Mapping A** trên đề cương Tiếng Anh A1.
- **Căn cứ lý giải:** Áp dụng nguyên tắc tách biệt rạch ròi: Điểm xuất phát không đồng nghĩa với trình độ năng lực chuẩn (`Starting Point ≠ Proficiency`). Người học chọn tự khai báo được xếp vào Unit 1 với trạng thái chưa kiểm chứng (`UNVERIFIED`). Người học làm bài đánh giá nhận được khuyến nghị xuất phát chính xác từ Unit 1 đến Unit 6 cùng hồ sơ kỹ năng đa chiều Radar Chart.
- **Ảnh hưởng hệ thống:** Tạo nên cơ chế phân nhánh luồng onboarding an toàn, bảo vệ người học khỏi áp lực sư phạm và cung cấp dữ liệu chẩn đoán làm cơ sở cho phân hệ bài học bổ trợ sau này.

### 2.12.2. Cơ chế làm lại câu sai có kiểm soát (Controlled Retry)
- **Vấn đề thực tế:** 30/35 người học (≈86%) trong khảo sát bổ sung không phản đối việc củng cố câu sai (gồm 19/35 đồng ý (≈54%) và 11/35 phân vân (≈31%) cần tùy chọn bật/tắt), nhưng phỏng vấn định tính chỉ ra việc dồn ứ các câu hỏi lỗi thành một hàng đợi xuyên ngày gây tâm lý sợ hãi, áp lực và là nguyên nhân hàng đầu khiến người học bỏ rơi ứng dụng.
- **Lựa chọn giải pháp:** Controlled Retry cuối bài theo attempt (quy tắc allowance tại §2.3.3), trần 70% khi đúng ở lượt làm lại; không gom câu sai dồn ngày.
- **Căn cứ lý giải:** Giải quyết lỗi sai ngay trong phiên học mà không tạo ra sự tích lũy dồn ngày (bác bỏ việc gom câu sai dồn ngày), bảo toàn tính toàn vẹn của mô hình bài học vi mô 5–10 phút.
- **Ảnh hưởng hệ thống:** Loại bỏ sự phức tạp của các bảng lưu trữ hàng đợi lỗi cồng kềnh, giảm thiểu tải truy vấn cơ sở dữ liệu và bảo vệ tâm lý tự tin cho người học.

### 2.12.3. Lịch ôn tập ngắt quãng tất định (SRS Scheduling)
- **Vấn đề thực tế:** Vấn đề mau quên từ vựng xuất hiện ở 15/15 người học được khảo sát (100%). Việc phụ thuộc vào các mô hình học máy phức tạp chạy từ xa để tính toán lịch ôn tập tiềm ẩn rủi ro lớn về độ trễ, điểm nghẽn mạng và chi phí hạ tầng.
- **Lựa chọn giải pháp:** Chuẩn hóa thuật toán lặp lại ngắt quãng tất định (Policy B) theo chuỗi chu kỳ cố định 5 nấc $[1, 3, 7, 14, 30]$ ngày và đóng gói toàn bộ quá trình cập nhật thẻ cùng nhật ký lịch sử bên trong thủ tục lưu trữ nguyên tử RPC `record_review` của cơ sở dữ liệu PostgreSQL.
- **Căn cứ lý giải:** Đảm bảo tính độc lập sư phạm; phân hệ ôn tập hoạt động ổn định 100% ngay cả khi các dịch vụ AI bên ngoài gặp sự cố hoàn toàn. Tính nhất quán cập nhật thẻ/nhật ký tuân theo yêu cầu tại §2.3.4.
- **Ảnh hưởng hệ thống:** Đơn giản hóa kiến trúc vận hành, giữ toàn bộ tính toán ôn tập trong cơ sở dữ liệu quan hệ nội bộ (không phụ thuộc dịch vụ AI bên ngoài) và tạo dựng nền tảng dữ liệu lịch sử sạch cho việc nghiên cứu các mô hình thích ứng trong tương lai.

### 2.12.4. Kiểm soát vượt cấp nhảy bài có điều kiện (Conditional Jump)
- **Vấn đề thực tế:** Cần có cơ chế cho phép người học có kiến thức bỏ qua các Đơn vị bài học không cần thiết, nhưng phải ngăn chặn hiện tượng đoán mò đáp án hoặc gian lận vượt cấp làm hỏng tiến trình sư phạm.
- **Lựa chọn giải pháp:** Cưỡng chế cơ chế kiểm tra vượt cấp khắt khe theo chính sách Policy D5 (quy tắc thuộc Use Case `UC-04` và luồng hành vi `BF-11`, liên kết `MVP-04`, không tách mã FR riêng trong bộ yêu cầu canonical): chỉ áp dụng cho Đơn vị bài học kế cận (Adjacent-Only), yêu cầu điểm số tuyệt đối $\ge 95\%$, kích hoạt thời gian phạt khóa chờ 24 giờ khi không đạt, ghi nhận cờ nguồn gốc `by_jump = true` và không cấp tín chỉ hoàn thành bài học cơ học.
- **Căn cứ lý giải:** Ngăn ngừa hành vi bấm thử lại liên tục để mò đáp án, đảm bảo học viên chỉ có thể bỏ qua bài học khi thực sự đã thuần thục kiến thức của Đơn vị bài học liền trước.
- **Ảnh hưởng hệ thống:** Duy trì tính nghiêm cẩn của đề cương đào tạo, đảm bảo các báo cáo tiến độ học tập phản ánh trung thực năng lực thực tế của học viên.

### 2.12.5. Quản trị học liệu và kiểm duyệt độc lập (Content Governance & SoD)
- **Vấn đề thực tế:** Tình trạng học liệu sai chính tả, phát âm lỗi và nội dung lệch chuẩn sư phạm tràn lan trên các nền tảng tự do do thiếu quy trình kiểm soát chuyên môn và xung đột lợi ích khi người biên soạn tự duyệt bài của mình.
- **Lựa chọn giải pháp:** Thiết lập quy trình quản trị nội dung qua 6 trạng thái nghiệp vụ, áp dụng nguyên tắc Phân tách Trách nhiệm (SoD) đa tầng: Creator không được duyệt bài, Moderator không được xuất bản, Organizational Manager chỉ xuất bản khi Unit đủ 4/4 bài đạt chuẩn, và Administrator chỉ xuất bản khẩn cấp bài học đã được phê duyệt. Mọi sửa đổi nội dung đã phát hành đều phải thông qua cơ chế Clone-to-Draft v2 (`supersedesId`).
- **Căn cứ lý giải:** Tạo lập rào cản kỹ thuật tin cậy giúp loại bỏ các sai sót chủ quan, đảm bảo mọi học liệu đến tay người học đều đã qua kiểm duyệt sư phạm.
- **Ảnh hưởng hệ thống:** Nâng cao độ tin cậy của nền tảng, thiết lập ranh giới trách nhiệm kiểm toán minh bạch cho từng cán bộ tham gia vận hành hệ thống.

---

## 2.13. Tổng kết phân tích và thiết kế hệ thống

Quá trình phân tích và thiết kế hệ thống Lingora được thực hiện dựa trên phương pháp luận kỹ nghệ phần mềm chặt chẽ, tạo nên một chuỗi chuyển hóa logic liền mạch và nhất quán từ nghiên cứu thực nghiệm đến kiến trúc kỹ thuật:

Khởi đầu từ những phát hiện thực tế qua các đợt khảo sát người học ($N=15$, $N=35$), phỏng vấn định tính chuyên sâu ($N=3$) và phân tích đối chuẩn các nền tảng đi trước, nhóm nghiên cứu đã nhận diện chính xác các "điểm đau" cốt lõi của người tự học ngoại ngữ: sự suy giảm trí nhớ từ vựng nhanh chóng, tâm lý nản chí khi bài học bị dồn ứ, cảm giác ức chế khi thiếu lời giải thích đáp án và nguy cơ học liệu kém chất lượng. 

Những đòi hỏi thực tiễn đó đã được chuẩn hóa một cách khoa học thành hệ thống 17 Yêu cầu chức năng cốt lõi (`P1-FR-001` đến `P1-FR-017`), 4 nhóm Yêu cầu phi chức năng khắt khe về an ninh và tính sẵn sàng (`P1-NFR-001` đến `P1-NFR-004`), cùng 15 Use Cases nghiệp vụ phân bổ cho 6 vai trò tác nhân rõ ràng. Các mô hình hành vi động (Behavioral Families), sơ đồ trình tự tương tác (Sequence Diagrams) và máy trạng thái (State Machines) đã mô hình hóa chi tiết mọi khía cạnh vận hành của hệ thống, từ các luồng học tập vi mô 5–10 phút, cơ chế làm lại câu sai có kiểm soát (Controlled Retry), thuật toán ôn tập ngắt quãng (SRS) tất định, cho đến quy trình kiểm duyệt học liệu độc lập tuân thủ phân tách trách nhiệm (SoD).

Trên cơ sở đó, kiến trúc hệ thống 5 tầng logic phân ranh giới rõ ràng cùng 19 thành phần phần mềm đã được thiết lập, đảm bảo nguyên tắc phụ thuộc một chiều và định vị dịch vụ AI như một năng lực hỗ trợ hoàn toàn không lưu trạng thái. Kiến trúc an ninh đa tầng với 5 vùng triển khai logic, 6 ranh giới bảo mật và chính sách bảo vệ dữ liệu chiều sâu Row Level Security (RLS) giúp cô lập dữ liệu người học theo đúng thiết kế. Đồng thời, thiết kế cơ sở dữ liệu quan hệ và chuẩn hóa giao tiếp API với cơ chế bao gói lỗi chuẩn mực tạo nên khung kỹ thuật cho các giai đoạn tiếp theo.

Toàn bộ bản thiết kế hệ thống chi tiết này đóng vai trò là cơ sở kỹ thuật cho các giai đoạn lập trình hiện thực hóa, kiểm thử độc lập và nghiệm thu phần mềm trong các mốc triển khai tiếp theo của đề tài.

---

# DANH SÁCH HÌNH DỰ KIẾN

1. `[HÌNH 2.1 — Sơ đồ Use Case tổng quát của hệ thống Lingora]` (Nguồn: `docs/plantuml/uc-overview-m22.puml`)
2. `[HÌNH 2.2 — Sơ đồ trình tự: Đăng nhập và xác thực phiên làm việc]` (Nguồn: `docs/plantuml/sequence-auth-session-m23.puml`)
3. `[HÌNH 2.3 — Sơ đồ trình tự: Học bài và làm bài tập tương tác]` (Nguồn: `docs/plantuml/sequence-lesson-exercise-retry-m23.puml`)
4. `[HÌNH 2.4 — Sơ đồ trình tự: Kiểm tra xếp lớp đầu vào]` (Nguồn: `docs/plantuml/sequence-diagnostic-placement-m23.puml`)
5. `[HÌNH 2.5 — Sơ đồ trình tự: Ôn tập từ vựng ngắt quãng]` (Nguồn: `docs/plantuml/sequence-srs-review-m23.puml`)
6. `[HÌNH 2.6 — Sơ đồ trình tự: Soạn thảo và kiểm duyệt học liệu]` (Nguồn: `docs/plantuml/sequence-authoring-moderation-publish-m23.puml`)
7. `[HÌNH 2.7 — Sơ đồ hoạt động: Đăng nhập và xác thực người dùng]` (Nguồn: `docs/plantuml/activity-learner-journey.puml`)
8. `[HÌNH 2.8 — Sơ đồ hoạt động: Tiến trình làm bài học vi mô]` (Nguồn: `docs/plantuml/activity-learner-flow-m22.puml`)
9. `[HÌNH 2.9 — Sơ đồ hoạt động: Đánh giá xếp lớp và chẩn đoán thích ứng]` (Nguồn: `docs/plantuml/placement-jump-m22.puml`)
10. `[HÌNH 2.10 — Sơ đồ hoạt động: Quy trình ôn tập ngắt quãng SRS]` (Nguồn: `docs/plantuml/srs-flow-m22.puml`)
11. `[HÌNH 2.11 — Sơ đồ hoạt động: Vòng đời kiểm duyệt và xuất bản học liệu]` (Nguồn: `docs/plantuml/activity-authoring-flow-m22.puml`)
12. `[HÌNH 2.12 — Sơ đồ kiến trúc thành phần hệ thống Lingora]` (Nguồn: `docs/plantuml/component-architecture-m24.puml`)
13. `[HÌNH 2.13 — Sơ đồ ranh giới triển khai và các vùng an ninh của hệ thống Lingora]` (Nguồn: `docs/plantuml/deployment-boundary-m24.puml`)
14. `[HÌNH 2.14 — Sơ đồ quan hệ thực thể (ERD) của hệ thống Lingora]` (Nguồn: `docs/plantuml/erd-mvp-learning.puml`)
15. `[HÌNH 2.15 — Sơ đồ luồng điều hướng màn hình tổng thể của hệ thống Lingora]` (Nguồn: `docs/plantuml/screen-flow-inventory-m22.puml`)
16. `[HÌNH 2.16 — Bản vẽ Wireframe thiết kế các màn hình phân hệ người học]` (Nguồn: Thiết kế UI wireframe phân hệ Learner)
17. `[HÌNH 2.17 — Bản vẽ Wireframe thiết kế các màn hình phân hệ quản trị và kiểm duyệt]` (Nguồn: Thiết kế UI wireframe phân hệ Admin)

---

# DANH SÁCH BẢNG DỰ KIẾN

1. `[BẢNG 1.1 — Tổng hợp kết quả định lượng từ khảo sát ban đầu người học (N=15)]`
2. `[BẢNG 1.2 — Phân bố khung giờ tự học khả thi nhất trong ngày (N=35)]`
3. `[BẢNG 1.3 — Phản hồi của người học về cơ chế làm lại câu sai ở cuối bài (N=35)]`
4. `[BẢNG 1.4 — Bảng tổng hợp phân tích đối chuẩn các nền tảng học ngoại ngữ]`
5. `[BẢNG 1.5 — Ma trận tổng hợp yêu cầu chức năng phần mềm (Functional Requirements)]`
6. `[BẢNG 1.6 — Bảng phân định yêu cầu phi chức năng (Non-Functional Requirements)]`
7. `[BẢNG 2.1 — Danh mục tác nhân và vai trò trách nhiệm trong hệ thống Lingora]`
8. `[BẢNG 2.2 — Danh mục 15 Use Cases của hệ thống Lingora]`
9. `[BẢNG 2.3 — Bảng quy đổi điểm số Đánh giá chẩn đoán sang Đơn vị bài học xuất phát (Mapping A)]`
10. `[BẢNG 2.4 — Danh mục 19 thành phần phần mềm của hệ thống Lingora]`
11. `[BẢNG 2.5 — Bảng mô tả chi tiết các bảng dữ liệu cốt lõi trong cơ sở dữ liệu Lingora]`
12. `[BẢNG 2.6 — Bảng phân nhóm 10 bề mặt giao tiếp dịch vụ API của hệ thống Lingora]`
13. `[BẢNG 2.7 — Bảng chuẩn hóa mã lỗi giao tiếp và phân loại nguồn gốc hệ thống]`
14. `[BẢNG 2.8 — Ma trận phân quyền vai trò người dùng (RBAC Matrix)]`
15. `[BẢNG 2.9 — Ma trận phân tách trách nhiệm trong quy trình quản trị học liệu (SoD Matrix)]`
16. `[BẢNG 2.10 — Danh mục 11 sự kiện kiểm toán an ninh nhạy cảm (Security Event Catalog)]`

---

# NGUỒN NỘI BỘ DÙNG CHO BẢN NHÁP

- `HANDOFF.md` — Trạng thái dự án, các bất biến kỹ thuật và ranh giới chấp nhận.
- `docs/01-architecture.md` — Kiến trúc hệ thống, phân tầng phụ thuộc và tích hợp dịch vụ.
- `docs/02-requirements.md` — Đặc tả yêu cầu chức năng (`P1-FR-*`), phi chức năng (`P1-NFR-*`) và phạm vi MVP.
- `docs/03-api-contract.md` — Hợp đồng giao tiếp API của dịch vụ AI (Read-Only).
- `docs/04-data-model.md` — Mô hình dữ liệu, cơ chế RLS và hàm thủ tục lưu trữ RPC `record_review`.
- `docs/05-traceability-matrix.md` — Ma trận truy vết từ yêu cầu đến thiết kế, kiểm thử và mã nguồn.
- `docs/06-system-analysis.md` — Phân tích hệ thống, danh mục tác nhân và 15 Use Cases.
- `docs/08-english-a1-curriculum.md` — Cấu trúc đề cương chương trình Tiếng Anh cơ bản A1 (6 Units, 24 Lessons).
- `docs/09-placement-and-jump-specification.md` — Đặc tả đánh giá chẩn đoán đầu vào, quy tắc Mapping A và nhảy cấp Jump.
- `docs/tai-lieu-phan-tich-yeu-cau.md` — Báo cáo phân tích yêu cầu nghiệp vụ, dữ liệu khảo sát ban đầu ($N=15$), khảo sát bổ sung ($N=35$), phỏng vấn định tính ($N=3$) và phân tích đối chuẩn.
- `docs/phase-1-m2-2-behavior-uc-activity-state.md` — Đặc tả luồng hành vi (BF-01..BF-15), máy trạng thái và sơ đồ luồng màn hình.
- `docs/phase-1-m2-3-sequence-api-service-boundary.md` — Đặc tả sơ đồ trình tự, mô hình dịch vụ và phân loại mã lỗi hệ thống.
- `docs/phase-1-m2-4-architecture-security.md` — Đặc tả 19 thành phần phần mềm, 5 vùng an ninh, ranh giới bí mật và ma trận SoD/Audit.
- `docs/phase-1-m2-5-design-validation.md` — Hồ sơ kiểm định thiết kế, kiểm tra tính toàn vẹn 20 tiêu chí và xác thực cổng.
- `docs/phase-1-m2-6-design-handoff.md` — Hồ sơ bàn giao thiết kế sang triển khai, quy tắc phân lớp API và khung kiểm thử.
- `lingora-admin/prisma/schema.prisma` — Cấu trúc lược đồ cơ sở dữ liệu hiện tại (`CURRENT`).
- `logs/decision-log.md` — Nhật ký các quyết định kiến trúc (ADR-001 đến ADR-029).
- `logs/development-log.md` — Nhật ký tiến trình phát triển và kiểm tra chất lượng đề tài.
- `logs/test-log.md` — Nhật ký kiểm thử và bằng chứng thực thi các kịch bản kiểm tra.
- `plans/current-task.md` — Phạm vi và trạng thái nhiệm vụ hiện hành.

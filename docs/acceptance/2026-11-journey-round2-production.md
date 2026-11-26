# Nghiệm thu hành trình Giáo viên → Học viên — Vòng 2 (production)

Ngày: 2026-11-26 · Môi trường: production — admin `https://lingora-workspace.vercel.app`, học viên
`https://lingora-learner-dev.vercel.app`, Supabase project `sncfyvpzwedqgwfpffkh`. Trình duyệt: khung Browser của
Claude desktop (viewport ~457×589, gần mobile). Code đang chạy là `main` trước PR #19 (chấm điểm dễ tính) và
PR #20 (SRS theo ngôn ngữ), nên hai PR đó **chưa** được thử ở vòng này.

Bài thử: khóa thật "Tiếng Anh A1 — Giao tiếp hằng ngày", chương `ENG-A1-U03`, bài mới ở vị trí #4
"Bài 4: Đặt đồ uống ở quán cà phê" (không bắt buộc): 2 đoạn văn, 2 từ vựng (`coffee` lấy từ kho,
`large` tạo mới), 3 bài tập (MCQ, FILL_BLANK, REORDER).

Tài khoản:
- Admin: tài khoản ADMIN hiện có (người dùng tự nhập mật khẩu).
- Giáo viên: "GV Test (nghiệm thu)" `tungtin201205+gvtest@gmail.com`, tạo riêng cho vòng này qua
  `provisionTeacher`. Email mời của Supabase không đến nên dùng link mời sinh bằng `auth.admin.generateLink`.
- Học viên: tài khoản học viên đang đăng nhập sẵn trong trình duyệt (context `40b98b71…`), trước vòng thử đã xong 2/9 bài.

Mọi thao tác soạn, duyệt, học đều làm **qua UI**. Ghi DB duy nhất ngoài UI là tạo tài khoản giáo viên.
Các truy vấn DB còn lại chỉ đọc: tiến độ học viên và đáp án, dùng để đi nhanh qua 7 bài bắt buộc đứng trước bài thử.

## Kết quả tổng

Hành trình chạy trọn trên production:
1. Admin tạo bài #4 và phân công cho GV Test.
2. GV soạn bài, lưu (2 bản sửa đổi), xem trước, rồi nộp duyệt. Trong lúc chờ duyệt, editor bị khóa.
3. Admin duyệt, rồi "Xuất bản và mở cho học viên". Bài chuyển AVAILABLE, bản #2 PUBLISHED.
4. Học viên học bài: mở bằng URL trực tiếp khi bài còn khóa thì bị chặn đúng. Sau đó đọc nội dung, luyện tập có cố ý sai,
   làm lại câu sai, xem màn kết quả, "Luyện tập lại" (+0 XP), ôn SRS 10 thẻ (1 "Chưa nhớ"). Nhiệm vụ ngày được cộng đủ.

Nội dung học viên thấy khớp với bản GV soạn. Phản hồi khi sai hiện đáp án đúng và lời giải thích của GV.
Chấm FILL_BLANK chấp nhận `MUCH ` (hoa, thừa dấu cách) và `much.` (thừa dấu chấm).
**Không có lỗi P0.** Vấn đề lớn nhất là bài tùy chọn bị khóa tuần tự và xếp cuối chương (H1): học viên phải
học hết 7 bài bắt buộc mới tới được bài mới.

## Ghi nhận

| Mã | Bước | Vai | Mô tả | Mức | Trạng thái |
|---|---|---|---|---|---|
| H1 | Học (C1) | Học viên | Bài **tùy chọn** vẫn bị khóa tuần tự và xếp sau mọi bài bắt buộc của khóa. Bài #4 của chương 3 chỉ mở khi xong cả Bài 3→9 ("Bài học chưa mở khóa – Cần hoàn thành bài học trước"). Cần chốt: bài tùy chọn có nên luôn mở, hoặc chỉ cần xong bài đứng ngay trước nó trong chương? | P1 | Cần chốt |
| H2 | Lộ trình / Danh mục | Học viên | Đánh số bài không thống nhất. Trang chủ dùng tiêu đề GV đặt nên thứ tự đọc là "Bài 7, 8, 9, **Bài 4**". Danh mục khóa đánh lại theo vị trí trong chương ("Chương 2 … **Bài 1**: Một ngày của tôi") trong khi trang chủ ghi "Bài 4: Một ngày của tôi". Breadcrumb lặp "Chương 3: Bài 3: Giao tiếp thực tế" (G15 vẫn còn). Nên bỏ chữ "Bài N" khỏi tiêu đề hoặc để hệ thống tự đánh số | P2 | Mở |
| H3 | Soạn (A) / Duyệt (B) | GV + Admin | Nhãn "Phiên bản" khó hiểu. Ở editor GV, số này tăng sau mỗi lần lưu/nộp (#3 → #4 → #5 → #6) trong khi "Bản sửa đổi" chỉ là #2. Trang duyệt cùng bài lại ghi "Phiên bản: #2", sau khi duyệt thành "#3". Có vẻ đây là row version kỹ thuật bị đem ra hiển thị | P2 | Mở |
| H4 | Soạn (A) | GV | Dưới tiêu đề "Soạn thảo nội dung — Bài học #4", dòng mô tả bắt đầu bằng tên chương "Bài 3: Giao tiếp thực tế", trông như đang sửa Bài 3 | P3 | Mở |
| H5 | Soạn – từ vựng (A) | GV | Ô tra cứu từ: nhấn Enter không tìm (phải bấm nút). Tìm không ra (vd. `large`) thì không có thông báo "Không tìm thấy" hay gợi ý chuyển sang tab "Tạo từ vựng mới" | P3 | Mở |
| H6 | Từ vựng | GV + Học viên | Phiên âm hiển thị không đồng nhất. Bảng từ vựng của editor và trang duyệt in `ˈkɒfi` (không gạch chéo) cạnh `/lɑːrdʒ/`. Phía học viên lại bọc cả hai thành `/ˈkɒfi/`. Cùng nhóm với G6 | P3 | Mở |
| H7 | Soạn (A) | GV | "Lưu bản nháp" và "Nộp kiểm duyệt" mất khoảng 6–14 giây, lâu hơn hẳn các thao tác khác. Trong lúc chờ chỉ thấy "Đang lưu…/Đang xử lý…" | P2 | Mở |
| H8 | Soạn (A) | GV | "Nộp kiểm duyệt" nộp ngay, không có hộp xác nhận (sau khi nộp thì editor bị khóa) | P3 | Cần chốt |
| H9 | Duyệt (B) | Admin | Lịch sử kiểm duyệt ghi người phê duyệt là "Người dùng" (ID 5650336e…) thay vì tên admin | P2 | Mở |
| H10 | Kết quả (C7) | Học viên | Màn kết quả có hai con số lệch nhau: "Điểm số đạt được 5 / 8 (63%)" và "Chính xác lần 1: 67%". Mẫu số 8 gồm cả câu làm lại (3 câu × 2 + 2), học viên khó hiểu. Phần chi tiết câu 1 chỉ ghi "Đúng – Câu trả lời của bạn: Large", không cho thấy lần đầu đã sai | P2 | Mở |
| H11 | Danh mục khóa | Học viên | Bài đã hoàn thành vẫn ghi "Chưa đọc" / "Đang đọc" vì trạng thái đọc nội dung tách khỏi hoàn thành bài; nhãn gây hiểu là chưa học | P3 | Mở |
| H12 | Nội dung khóa A1 | Học viên | "Bài 7: Gọi món" có bài nghe hỏi "người nói bảo rẽ hướng nào ở ngân hàng" (nội dung chỉ đường của Bài 8), lạc chủ đề | P2 | Mở |
| H13 | Trang chủ | Học viên | Dòng mục tiêu ghi "9 bài học" trong ngày, trong khi số bài hoàn thành mới là 8. Có thể do đếm cả lượt "Luyện tập lại"; chưa xác minh | P3 | Chưa xác minh |
| H14 | Tạo tài khoản GV | Admin | Email mời GV (Supabase SMTP mặc định) không đến hộp thư; phải sinh link mời thủ công. Production cần SMTP riêng trước khi mời giáo viên thật | P1 | Mở |

## Những điểm chạy đúng

- Phân công GV, danh sách "Bài học được phân công", quyền GV chỉ thấy bài của mình.
- Xem trước "theo giao diện học viên" ngay trong editor, có chế độ Máy tính / Điện thoại.
- Khóa editor khi bài đang chờ duyệt (mọi input/nút sửa đều `disabled`).
- Trang duyệt hiển thị đủ đáp án, giải thích và tóm tắt thay đổi; có nhận xét theo từng bài tập.
- Duyệt xong thì nút "Xuất bản và mở cho học viên" xuất hiện ngay; bài chuyển AVAILABLE.
- Chặn truy cập bài khóa qua URL trực tiếp.
- Câu sai được đưa lại cuối phiên ("Làm lại câu sai"); "Luyện tập lại" không cộng XP lần hai.
- Từ vựng mới vào SRS sau khi hoàn thành bài (`large` +1). Số thẻ đến hạn giảm đúng sau phiên ôn (24 → 14).
  Nhiệm vụ "Ôn tập 10 từ vựng" được cộng.

## Chưa kiểm ở vòng này

- PR #19 (chấm dễ tính, gợi ý dấu) và PR #20 (SRS theo ngôn ngữ, "Ôn nhanh", thẻ mới đến hạn trong ngày) chưa
  deploy, nên chưa thử trên production.
- Luồng "Yêu cầu chỉnh sửa" (admin trả bài về GV) chưa thử, mới thử nhánh duyệt thẳng.
- Học viên mới đăng ký và onboarding trên production chưa thử, vì dùng tài khoản học viên có sẵn.
- Desktop rộng chưa thử; vòng này chỉ ở viewport ~457px.

## Dữ liệu thử còn lại trên production

- Bài #4 "Bài 4: Đặt đồ uống ở quán cà phê" trong chương `ENG-A1-U03` của khóa A1 thật đang **AVAILABLE**,
  nên mọi học viên của khóa đều thấy (sau các bài bắt buộc).
- Từ vựng mới `large` trong kho từ vựng tiếng Anh.
- Tài khoản GV "GV Test (nghiệm thu)".
- Tài khoản học viên thử đã hoàn thành 10/10 bài, có thêm khoảng 65 thẻ SRS và các huy hiệu, XP liên quan.

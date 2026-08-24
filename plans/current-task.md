# Active Task

`1-day-sprint-team-task-allocation`

## Status

`DRAFT`

## Kế hoạch 1 Ngày (1-Day Sprint) cho Nhóm 3 Người

| Thành viên | Trách nhiệm | Nhiệm vụ cụ thể trong 1 Ngày | Sản phẩm bàn giao cuối ngày |
|---|---|---|---|
| **Thành viên 1**<br>*(Backend)* | **Hạt giống CSDL & Thẻ SRS** | 1. Bổ sung Khóa học Tiếng Anh A2 (5 bài học, 50 từ vựng theo chủ đề: Mua sắm, Du lịch, Ẩm thực, Công việc, Sức khỏe).<br>2. Nạp sẵn 25 thẻ Flashcard SRS gắn theo từng bài học cho tài khoản demo `student@lingora.test` (gồm thẻ đến hạn hôm nay, thẻ nhớ tốt, thẻ hay quên).<br>3. Chạy `node prisma/seed.js` nạp vào Supabase DB. | CSDL có sẵn 10 bài học, 100 từ vựng và kho thẻ SRS sẵn sàng để Frontend query. |
| **Thành viên 2**<br>*(Frontend)* | **Giao diện Lật thẻ Flashcard SRS** | 1. Tạo component lật thẻ Flashcard 3D (`FlashcardItem.tsx`): Mặt trước (Từ, phiên âm, audio, tag chủ đề), Mặt sau (Nghĩa, ví dụ).<br>2. Tạo thanh chuyển chế độ: *Ôn theo Chủ đề* / *Ôn theo ngày*.<br>3. Tạo cụm 4 nút chấm điểm nhớ (Quên, Khó, Tốt, Dễ). | Giao diện trang `/srs/review` lật thẻ mượt mà, sẵn sàng kết nối dữ liệu. |
| **Thành viên 3**<br>*(Admin CMS)* | **Màn hình Quản lý Bài học & Từ vựng** | 1. Tạo giao diện bảng danh sách Khóa học & Bài học trong `lingora-admin`.<br>2. Tạo Form thêm từ vựng mới (Từ, phiên âm, nghĩa tiếng Việt, câu ví dụ).<br>3. Tạo nút bật/tắt Xuất bản (`isPublished`) bài học. | Giao diện Admin quản trị xem và thêm được từ vựng mới vào CSDL. |

---

## Active Execution: Nhiệm vụ Thành viên 1 (Backend Seed)

- **File thay đổi:** `lingora-admin/prisma/seed.js`
- **Kiểm thử:** Chạy `node lingora-admin/prisma/seed.js` và kiểm tra 10 bài học, 25 thẻ SRS được tạo thành công.

---

## Approval Section

- Status: `DRAFT` (Chờ người dùng duyệt để bắt đầu phần việc Thành viên 1)

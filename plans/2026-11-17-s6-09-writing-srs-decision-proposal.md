# S6-09 — Đề xuất quyết định sản phẩm cho WRITING SRS

**Trạng thái:** Product Owner đã duyệt ngày 2026-11-17. Quyết định được ghi ở ADR-045; implementation thuộc S6-09.2.

## Nguồn và xung đột hiện tại

- ADR-035 giữ lịch SRS do server tính và thao tác review idempotent.
- ADR-036 quy định một card cho mỗi `(learner, vocabulary)`, rating `REMEMBERED`/`FORGOTTEN` và Policy B `1 → 3 → 7 → 14 → 30` ngày. ADR ghi rõ MVP không dùng thang bốn rating.
- ADR-041 chỉ cho thấy prompt hiện tại sau khi bắt đầu; không đưa due list ra UI và không trộn mục SRS vào Placement/Level-up đã chấm điểm.
- Sprint 5 đã có `SrsMemoryState` độc lập theo `(cardId, skill)`, nhưng due state gốc và flow session hiện tập trung vào MEANING. `SrsReviewOperation` chưa lưu skill.
- Luyện viết Sprint 6 chấm từng ký tự và giữ score/receipt theo WritingAttempt. Nó không tham gia SRS, không tự phát thưởng, và ký tự có thể tồn tại ngoài Vocabulary.

Vì vậy cần quyết định cả rating/lịch, đơn vị học, enrollment và thứ tự prompt–chấm–reveal trước khi viết implementation hoặc migration.

## Phương án đề xuất

Đề nghị bật WRITING như một skill riêng trên SRS card Vocabulary hiện có, không thay đổi lịch MEANING:

1. **Rating và scheduler:** WRITING dùng bốn lựa chọn learner tự chọn `AGAIN`, `HARD`, `GOOD`, `EASY` với scheduler version riêng dựa trên FSRS. Chỉ lịch WRITING dùng scheduler này; MEANING tiếp tục Policy B không chuyển đổi. Không tự chọn rating từ score/band. Trước implementation phải xác minh thư viện và hợp đồng scheduler; không tự viết thuật toán FSRS hoặc chọn dependency trong đề xuất này.
2. **Identity:** một WRITING item là một Vocabulary đã enrollment của learner. Các ký tự thuộc từ được xử lý theo `VocabularyCharacter.position`; một rating cập nhật state WRITING của cả từ. Đây không phải lịch độc lập cho từng ký tự. Từ không có mapping ký tự/nét hoàn chỉnh không vào hàng WRITING, nhưng vẫn dùng được cho MEANING.
3. **Ký tự đứng riêng:** ký tự chưa thuộc Vocabulary tiếp tục chỉ dùng trong bài học. Không tạo Vocabulary giả hoặc card riêng theo ký tự trong phương án này.
4. **Enrollment:** giữ quy tắc hiện hành cho Vocabulary: core enrollment khi hoàn thành bài; optional chỉ khi learner chủ động Add to Review. WRITING state chỉ được tạo khi Vocabulary đã enrollment và toàn bộ ký tự liên quan có dữ liệu nét được xuất bản. Đề nghị các Vocabulary đã enrollment từ trước được khởi tạo WRITING state lười khi learner đủ điều kiện, với due date không sớm hơn thời điểm bật tính năng; không sửa due date/state MEANING.
5. **Prompt, grade và reveal:** session bắt đầu trước khi chọn item; API chỉ trả item hiện tại. Trước lần thử đầu, không trả glyph, mẫu nét, cách đọc hoặc media làm lộ đáp án. Learner phải gửi tối thiểu một lần thử hợp lệ cho từng ký tự của từ. Sau khi server lưu receipt và chấm từng ký tự, UI mới hiện glyph cùng feedback/score; sau đó learner tự chọn rating. Pass/fail/score không tự quyết định rating và không thay đổi completion bài học.
6. **Evidence, idempotency và reward:** một rating hợp lệ tạo đúng một schedule operation cho `(learner, card, WRITING)`. Operation lưu skill và scheduler version để audit; request hash bao gồm session, card, skill, rating và evidence IDs. Replay cùng payload trả kết quả cũ; cùng key khác payload bị từ chối. Ghi state, operation, session progress và reward trong một transaction. Một review WRITING hợp lệ có thể tính là một hoạt động SRS cho XP/streak/quest; retry, replay và reinforcement không phát thêm. Achievement đếm identity Vocabulary duy nhất như hiện nay, không đếm một từ nhiều lần vì hai skill.
7. **Retention và dữ liệu nét:** giữ WritingAttempt receipt cùng quy tắc lưu hiện có; không lưu thêm tọa độ nét thô trong SRS. Review operation giữ theo cùng chính sách lưu lịch sử SRS hiện hành; không tạo kho evidence/retention riêng. Thời hạn lưu/anonymization tổng thể vẫn thuộc NFR vì ADR-035 chưa ấn định số ngày.
8. **Rollout và rollback:** migration chỉ additive; lịch MEANING, review receipts, XP và due date hiện có không đổi. Bật WRITING bằng cờ rollout riêng sau khi migrate, thử synthetic/internal trước rồi mở theo cohort. Tắt cờ chỉ ngừng tạo session/review WRITING mới; giữ state và receipts để bật lại, không xóa dữ liệu hoặc đảo migration.

### Lựa chọn khác

- **Giữ hai rating và Policy B cho cả hai skill:** thay đổi nhỏ nhất, không cần scheduler mới; nhưng không đáp ứng yêu cầu S6 về bốn lựa chọn.
- **Một card/state độc lập cho từng ký tự:** cho phép lịch và enrollment riêng tới ký tự đứng ngoài Vocabulary; cần identity/state/schema, quy tắc thưởng và migration mới, đồng thời thay đổi phạm vi một-card-per-vocabulary đã duyệt.
- **Hoãn WRITING SRS:** giữ luyện viết trong lesson như hiện tại; không thay đổi ADR, schema hoặc ứng dụng.

## Các điểm Product Owner cần chốt

Đề nghị trả lời **“duyệt phương án đề xuất”**, **“giữ hai rating/Policy B”**, hoặc **“hoãn”**. Nếu chọn thiết kế khác, cần chốt các ý tương ứng:

1. Có cho phép dùng bốn rating và scheduler riêng chỉ cho WRITING, giữ MEANING nguyên trạng không?
2. Có đồng ý một item/rating cho toàn bộ ký tự của một Vocabulary, và ký tự không thuộc Vocabulary không tham gia SRS không?
3. Có đồng ý chỉ hiện rating sau lần thử đầu tiên cho đủ ký tự, server grade và reveal đáp án; rating vẫn do learner chọn, không lấy từ ngưỡng score không?
4. Có đồng ý core/optional enrollment theo quy tắc hiện hành và khởi tạo state WRITING cho Vocabulary cũ đủ dữ liệu khi rollout không?
5. Có đồng ý một reward operation cho một lần review WRITING, không phát thêm khi retry, và giữ achievement theo Vocabulary duy nhất không?
6. Có đồng ý không lưu nét thô trong SRS, giữ receipts/operations theo chính sách lưu hiện hành, rollout theo cờ/cohort và rollback bằng cách tắt cờ không?

**Cổng sau quyết định:** Chỉ khi có chấp thuận tường minh mới cập nhật decision log bằng ADR/addendum mới và bắt đầu S6-09.2. Nếu hoãn/từ chối, ghi trạng thái ấy và không thay đổi app/schema/migration.

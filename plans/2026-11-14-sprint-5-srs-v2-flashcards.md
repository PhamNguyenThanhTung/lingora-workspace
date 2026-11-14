# Sprint 5 — SRS v2 và Flashcards

Baseline là Policy B đang hoạt động ở `lingora-web/src/server/srs`, bảng `SrsCard` và `SrsReviewOperation` trong Prisma product, cùng XP, streak và quest từ Sprint 4. Phạm vi theo roadmap sprint ngày 12/11. Sprint này đưa learner từ Home vào phiên ôn, trình bày từng thẻ, ghi nhận kết quả và quay về Home với số từ đến hạn mới.

## Quyết định sản phẩm cần chốt

- ADR-035/036/041 duy trì Policy B và hai rating. Làm phần tương thích Policy B và flashcard trước. Chốt ADR cập nhật phạm vi, mapping rating, scheduler, retention và cohort trước khi bật FSRS hoặc bốn rating. Đo thử bằng fixture và dữ liệu synthetic trong lúc chờ chốt.
- `SrsCard` tiếp tục đại diện một learner và một vocabulary. Mỗi skill có trạng thái độc lập. MEANING là kỹ năng chuyển đổi từ dữ liệu cũ. RECALL, READING, LISTENING tham gia khi có nội dung phù hợp. WRITING thuộc Sprint 6.
- Mặc định giữ phạm vi ôn toàn tài khoản, kể cả context đã pause. Nếu gửi `contextId`, server kiểm tra ownership và dùng nó để lọc hoặc ưu tiên theo chính sách đã chốt. Home hiển thị số vocabulary đến hạn theo đúng phạm vi của CTA. Quy tắc mặc định cho thí điểm là một thẻ mỗi vocabulary trong một phiên.
- Một lần chấm thành công trên mục đến hạn sinh một lịch ôn và một quyền nhận thưởng. Retry và reinforcement không cộng XP. `WORDS_100` vẫn đếm identity vocabulary riêng biệt. Mỗi lần chấm chỉ ghi vào một nguồn evidence chính để streak, quest và tổng lượt ôn không đếm đôi. Giữ nguyên số XP và lịch sử đã có.

## Công việc và tiêu chí nghiệm thu

| Mốc | Phụ thuộc | Đầu ra và kiểm tra |
| --- | --- | --- |
| S5-01 — Scheduler Policy B | Baseline Sprint 4 | Tách phép tính interval khỏi service, thêm hợp đồng scheduler server và giữ API cũ. Fixture khóa hành vi stage 1–5, quên, mốc đến hạn, đồng hồ DB và reinforcement. `test:integration:srs` và `test:integration:gamification` qua. |
| S5-02 — Trạng thái và chứng cứ | S5-01 | Migration additive cho `SrsMemoryState` với unique `(cardId, skill)`, version, state, stability, difficulty, dueAt, lastReviewedAt, count và lapse. Dùng review operation hiện có nếu đủ để lưu before/after, rating và session. Nếu thêm log riêng, nối một lần chấm với đúng một operation. Giữ FK ownership, phép ghi append-only, RLS và khóa idempotency. Test fresh DB và upgrade DB có card stages khác nhau, lượt ôn và XP. |
| S5-03 — Review session Policy B | S5-02 | Thêm `POST /api/srs/sessions`, `GET /api/srs/sessions/:sessionId`, `POST /api/srs/sessions/:sessionId/reviews` và `POST /api/srs/sessions/:sessionId/complete` theo conventions learner API. Default 20 mục, server giới hạn số lượng và chọn mục theo thứ tự xác định. Response chỉ có mục hiện tại, progress và trạng thái. Resume, replay và complete lặp trả kết quả nhất quán. Test hai tab cùng chấm, hai learner, session hết hạn và rollback giữa update/log/XP. |
| S5-04 — Flashcards và Home | S5-03 | Nối `/review` và Home. Hiển thị mặt trước, nút lật và mặt sau có nghĩa, đọc, ví dụ và audio khi có dữ liệu. Rating bật sau reveal. Giữ hỗ trợ bàn phím, reduced motion, 390px, retry dùng lại UUID và thông báo kết thúc. Dùng dữ liệu vocabulary hiện có trước. Chỉ bổ sung presentation riêng nếu cần metadata hoặc media đã được xuất bản. |
| S5-05 — FSRS và mixed skills | S5-02, S5-03, S5-04 và ADR được chốt | Chọn và khóa thư viện FSRS sau khi đối chiếu API/tài liệu chính thức. Test fixture độc lập cho AGAIN/HARD/GOOD/EASY, timestamp, retention và scheduler version. Lần chấm đầu của MEANING có thể chuyển sang FSRS trong cùng transaction sau khi đến dueAt đã lưu. RECALL, READING, LISTENING được chọn khi có tín hiệu nội dung tương ứng và dùng state riêng. Có fallback MEANING cho thẻ thiếu dữ liệu. |
| S5-06 — Nghiệm thu và rollout | S5-04 cho Policy B, S5-05 cho FSRS | Chạy Chromium E2E từ Home tới ôn và quay về, trên desktop và 390px. Kiểm tra tổng XP, quest, streak, due count và retry sau mất response. Kiểm tra rollout bật/tắt theo cohort, tab cũ và card đã chuyển scheduler. Ghi bằng chứng local và triển khai public theo trạng thái nghiệm thu Slice 12. |

## Hợp đồng chấm và chuyển đổi

- Server xác minh ACTIVE learner, quyền session, mục hiện tại, mốc đến hạn và mã thao tác. Mã trùng cùng payload trả kết quả đã chốt; mã trùng khác nội dung trả 409. Dùng một DB clock sau khi lấy lock theo thứ tự hiện tại. Ghi schedule, log, tiến độ session và XP/streak trong một transaction.
- Trước lần chấm được phép chuyển đổi, state MEANING vẫn đọc lịch cũ và due date gốc. Chuyển đổi khi commit chấm đầu tiên, lưu version cùng state sau và giữ lịch sử cũ. Nếu dừng rollout, ngừng chuyển thẻ mới. Thẻ đã chuyển vẫn được đọc bởi binary hiểu cả hai version và vẫn giữ due date đã ghi.
- `GET` session chỉ trả prompt hiện tại và tiến độ, theo ADR-041. Thông tin có thể tiết lộ đáp án như cách đọc hoặc nội dung media chỉ xuất hiện ở mặt phù hợp. Không trả due list hoặc dùng thẻ ôn để thay đổi composition của Placement/Level-up.

## Gate giao Sprint

- DB sạch và upgrade từ snapshot Sprint 4 trên PostgreSQL dùng một lần. Đối chiếu số card, due date, lịch sử, XP và dữ liệu hai learner. Lượt chấm lặp hoặc lỗi giữa giao dịch giữ nguyên đúng số operation và event.
- Regression `npm run test:feature`, `npm run test:components`, `npm run test:integration:srs`, `npm run test:integration:gamification`, `npm run test:e2e:learning`, `npm run test:e2e:gamification` và build/typecheck. Thêm bộ integration và browser Sprint 5 vào các lệnh repo.
- Bàn giao Policy B + Flashcards độc lập khi đã qua gate. Đánh dấu FSRS và bốn rating theo quyết định ADR và kết quả nghiệm thu riêng. Phát hành public dựa trên bằng chứng luồng đăng ký, xác nhận email và onboarding của Slice 12.

[Quyết định SRS hiện hành](../logs/decision-log.md#adr-041--learner-facing-srs-selection-and-assessment-session-boundary) · [Sprint 4](2026-11-13-sprint-4-home-path-gamification.md) · [Roadmap triển khai](roadmap.md)

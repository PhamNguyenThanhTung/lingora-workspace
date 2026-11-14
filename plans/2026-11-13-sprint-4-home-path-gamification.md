# Sprint 4 — Learner Home, Learning Path và Gamification

## Kết quả bàn giao

- Learner mở Home, xem mục tiêu theo context, tiếp tục một bài còn mở, xem learning path và vào ôn từ đến hạn.
- Hoàn thành bài, ôn SRS và đạt nhiệm vụ sinh XP từ bằng chứng server. Home hiển thị streak theo ngày địa phương, nhiệm vụ trong ngày và thành tựu.
- Sau khi nộp bài, learner thấy kết quả đã chấm, XP thực nhận, từ mới thực sự được thêm vào SRS và nút tiếp tục.

Baseline là working tree của `lingora-workspace` trên `30177a3`, gồm Sprint 3 Core đã qua nghiệm thu local và các chỉnh sửa Studio/Sprint 2 đang có. Phần Home và path đọc hợp đồng Sprint 3, nên kiểm tra Sprint 3 trong regression khi tích hợp. Slice 12 public là điều kiện release theo roadmap. Placement là nhánh có điều kiện riêng. [Nghiệm thu Sprint 3](sprint-3-verification-20261113.md), [ADR-031/033/035/036/041](../logs/decision-log.md), [thiết kế](../DESIGN.md).

## Quy tắc sản phẩm

| Hạng mục | Sprint 4 |
| --- | --- |
| XP | +30 lần hoàn thành đầu tiên của lesson trong context, +1 mỗi SRS operation `SCHEDULE` hợp lệ, +10 khi đạt mỗi nhiệm vụ ngày. Redo chỉ tính streak. Review reinforcement và replay không cộng XP. |
| Streak | Một ngày hợp lệ khi có ít nhất một LessonAttempt hoàn tất, kể cả redo, hoặc một SRS review `SCHEDULE` hợp lệ. Dùng ngày đã lưu trong evidence và timezone account để xác định hôm nay. Giữ streak của hôm qua nếu hôm nay chưa học. Mất chuỗi khi đã bỏ trống một ngày. Quy tắc theo ADR-033, không thêm Streak Freeze hay shop. |
| Daily goal | Hiển thị số phút mục tiêu lấy từ plan/preferences và số bài, số lượt ôn thực tế hôm nay. Chưa có nguồn đo thời gian học đáng tin cậy, nên không suy số phút học từ thời gian mở tab hoặc khoảng cách giữa start/finalize. |
| Daily quest | Hai nhiệm vụ mặc định `LESSON_1` và `REVIEW_10`. Bài đếm first completions, ôn đếm SCHEDULE hợp lệ. Progress giới hạn ở target trên UI. Tự trao thưởng lúc event đạt ngưỡng, kể cả trước lần mở Home đầu tiên. |
| Achievement | `FIRST_LESSON`, `LESSONS_10`, `STREAK_7`, `STREAK_30`, `WORDS_100` và `PERFECT_PRACTICE`. WORDS_100 đếm 100 vocabulary identity khác nhau đã được SCHEDULE review. PERFECT_PRACTICE cần đúng mọi câu core ở lượt đầu trên một attempt đã hoàn tất. |
| Lịch sử | XP/quest reward/achievement bắt đầu từ khi bật Sprint 4. Streak dùng lịch sử có qualifying date để người đang học thấy chuỗi hiện tại. Dùng dữ liệu lịch sử làm tiến độ cho achievement tổng tích lũy khi có event mới, không phát thưởng XP lịch sử. Dữ liệu trước rollout vẫn mở và đọc được. |

## S4-01 — Home và Learning Path

1. Thêm `GET /api/learner/home?contextId=<uuid>` và `GET /api/learner/contexts/:contextId/path`. Dùng loader chung cho SSR `/home` và GET home. Response riêng tư, xác minh learner ACTIVE và ownership. Query bỏ trống chọn context ACTIVE khả dụng theo thứ tự ổn định, ưu tiên context người học vừa hoạt động nếu có. ID context không thuộc learner trả 404. PAUSED, course tắt, chưa có working level và empty curriculum có trạng thái rõ. Review due là số card đến hạn của account, theo cùng phạm vi và DB clock với `/review`.
2. Home DTO gồm `selectedContextId, plan, continueLearning, path, reviewDue, dailyProgress, streak, totalXp, quests, recentAchievement`. Nối `getContextPlan` và shared lesson hierarchy của Sprint 3, tránh hai lần đọc cùng một path trong một request. Context cũ NO_PLAN vẫn tiếp tục bài theo catalogue. CTA chọn bài đang làm nếu còn mở và chưa hoàn thành, sau đó bài tiếp theo đủ điều kiện. CTA dùng href do server tạo. Giữ controls tạo context, onboarding, sửa mục tiêu, pause/resume và logout.
3. Path phản ánh Course → Unit → Lesson hiện có, sắp theo level/unit/lesson rồi ID. Node gồm `lessonId, title, unitTitle, state, score, position, isRequired, href`. COMPLETED dựa trên completion thật, CURRENT là CTA hiện hành, AVAILABLE là bài mở khác, LOCKED là bài đã công bố nhưng chưa đủ điều kiện tuần tự/level. COMING_SOON chỉ hiện placeholder PLANNED an toàn, dùng tên chung nếu chưa có metadata công khai. Không gửi title từ draft, revision chưa xuất bản hoặc answer data. WITHDRAWN ẩn khỏi path hiện tại, giữ completion trong lịch sử. Bài đã hoàn thành với revision cũ vẫn COMPLETED sau republish. Score của attempt hoàn tất hiển thị theo công thức hiện tại; không ghi 0 khi chưa có score.
4. Home bố trí Continue Learning, learning path, review và mục tiêu/ngày. Path dạng dọc, có nhãn trạng thái, điều hướng bàn phím và hỗ trợ 390px. Pending/empty/error dùng conventions của learner UI. Bấm bài LOCKED/COMING_SOON không mở link. Lesson route tiếp tục xác thực quyền và publication khi truy cập trực tiếp.

## S4-02 — XP, daily quests và streak

1. Thêm migration additive cho `XpEvent` trong `app`, FK learner, ID nguồn và loại event, XP dương, DB timestamp và `localDate` kiểu DATE. Unique `(learnerId,eventType,sourceId)` và index đọc theo learner/day. Backend là nơi ghi append-only. Theo cùng ranh giới quyền DB/RLS của LearningPlan. Dùng tổng ledger để đọc XP. Dùng day evidence hiện có để tính current/longest streak và lịch 28 ngày; chưa cần bảng cache profile.
2. Gắn cấp XP vào `finalizePracticeAttempt` và đoạn tạo `SrsReviewOperation` SCHEDULE. Dùng ID `LessonCompletion` hoặc `SrsReviewOperation` đã commit trong transaction, `qualifyingLocalDate` và timestamp từ cùng thao tác. Chỉ chạy khi ghi kết quả thật. Tái dùng account lock và transaction hiện có. Replay đọc phần thưởng gắn với lần commit trước. Khi ghi XP/quest/achievement lỗi, rollback cả giao dịch liên quan để retry an toàn. SRS giữ nguyên Policy B, điểm và progression dùng công thức hiện hành.
3. Dùng ledger ngày để tính hai quest cố định, đếm event trước/sau, ghi `DAILY_QUEST` với ID nguồn ổn định cho bộ learner/ngày/loại. Chỉ một reward mỗi loại/ngày. Home GET thuần đọc, sinh DTO quest ngay cả ngày chưa có event. Tái dùng bảng nếu có sẵn phù hợp. Với quest cố định, không cần lưu hàng progress riêng hoặc cron. Các bảng mới dùng SQL constraint/FK cơ bản, không sửa migration cũ.
4. Đếm ngày theo ISO date trên calendar, dùng DB clock và timezone hợp lệ của account. Một learner học hai context trong cùng ngày có một ngày streak. Dữ liệu đã ghi giữ nguyên local date khi đổi timezone. Mốc nửa đêm và DST dùng calendar day, không dùng 24 giờ để so ngày. Hôm nay chưa đủ điều kiện thì chấm ngày để trống; Home GET không cộng điểm hay streak.

## S4-03 — Achievements và màn hoàn thành bài

1. Dùng bảng cấp thành tựu `LearnerAchievement(learnerId, achievementCode, awardedAt, sourceId)`, unique learner/code. Metadata của 6 định nghĩa cố định nằm trong code. Chỉ xét khi có finalize hợp lệ hoặc SCHEDULE review mới. Giữ idempotency và timestamp cùng transaction với event.
2. Mở rộng DTO finalize bằng phần thưởng learner-safe gồm `lessonXp, questXp, earnedAchievements, newlyEnrolledCount, firstTryAccuracy, streak`. Giữ nguyên dữ liệu hiện có cho caller. `newlyEnrolledCount` lấy số hàng insert thực tế, `firstTryAccuracy` tính từ câu core lần 1. Dữ liệu phần thưởng riêng của lần hoàn thành lưu trong safe receipt hoặc truy xuất qua evidence gắn nguồn. Replay trả đúng kết quả, không cộng lại hoặc ghi lại history. Receipt cũ thiếu phần thưởng vẫn hiển thị kết quả bài bình thường.
3. Thêm celebration vào màn completed Practice, hiển thị tổng quan ngắn, kế tiếp từ server và nút xem lại lời giải hiện có. Mở lại attempt vẫn đọc được kết quả, animation chỉ khi vừa hoàn tất và tôn trọng reduced motion. Lịch streak và kỷ lục dùng dữ liệu Home, xem được cả khi context đã pause.

## Trình tự thực hiện và nghiệm thu

| Mốc | Phụ thuộc | Kiểm tra |
| --- | --- | --- |
| S4-01 | Sprint 3 local | Home SSR/API, Path và Continue dùng DTO thật. Qua pause, NO_PLAN, published/locked/coming soon và hoàn thành rồi mở bài kế. |
| S4-02 | Quy tắc sản phẩm ở trên | PostgreSQL chứng minh XP một lần, retry đồng thời, redo chỉ tính streak, quest +10 một lần khi chạm target, rollback khi fault, ngày địa phương và ôn từ của context PAUSED. |
| S4-03 | S4-01 và S4-02 | Award một lần, dữ liệu celebration đúng khi finalize/replay, UI Home và Practice trên Chromium. |
| S4-04 | Các mốc trên | Chạy build/typecheck, tests và E2E. Đối chiếu dữ liệu DB và UI, ghi kết quả từng lệnh. |

- Test PostgreSQL với fixture có lịch sử cũ, hai context cùng learner và learner khác. Kiểm tra unlock đúng khi revision thay/rút, first completion mới vs redo, SRS duplicate và context pause. Có test trước/sau nửa đêm Asia/Ho_Chi_Minh và một múi giờ có DST. Tạo ít nhất một test fault trong transaction để chứng minh rollback nhất quán. Chạy migration mới trên DB mới và thử upgrade fixture có dữ liệu.
- E2E qua Next production, Chromium và PostgreSQL loopback. Home → Path → lesson → practice finalize → celebration → Home có XP/quest/streak → ôn SRS → Home có count đúng. Refresh và retry giữ nguyên tổng. Hai viewport desktop/390px, dùng bàn phím vào lesson, kiểm tra không tràn layout và không gọi provider ngoài fixture.
- Gate gồm Prisma validate/generate, typecheck, build synthetic, learner feature/components, integration lessons/practice/SRS/onboarding và E2E Core Learner/Sprint 3. Nối test mới vào script repo. Dùng `scripts/local-test-db.mjs` và chỉ DB disposable, không truy cập credential, public signup, DB thật hoặc deployment.

## Gói triển khai

Một lượt Antigravity triển khai S4-01 đến S4-04 theo thứ tự trên. File chính là `lingora-web/src/app/home`, routes learner mới, lesson catalogue/practice/SRS, module gamification mới, Prisma schema/migration và test. Cùng schema với Sprint 3 nên chỉ thêm model/migration Sprint 4 sau hai migration onboarding. Giữ các hunk Sprint 3 và Studio hiện có. Dùng synthetic environment cho toàn bộ build và runtime. Không commit, push hoặc deploy trong lượt triển khai.

Ghi báo cáo và log đã lọc thông tin nhạy cảm vào `plans/evidence/sprint-4/`. Trả trạng thái, file đã sửa, từng lệnh với exit code và blocker cụ thể nếu có. Codex nghiệm thu sau bàn giao.

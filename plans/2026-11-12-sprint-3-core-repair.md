# Kế hoạch sửa Sprint 3 Core

Phạm vi là các lỗi trong onboarding `DEFAULT` và `SELF_REPORT`, LearningPlan, cập nhật mục tiêu và luồng vào bài học. Baseline là working tree trên `30177a3`. Giữ thay đổi Studio và Sprint 2 ngoài phạm vi review. [Đặc tả Sprint 3](2026-11-12-sprint-3-onboarding-learning-plan.md), [báo cáo lỗi đã tái hiện](sprint-3-verification-20261112.md).

## Thứ tự triển khai

| Mốc | Phụ thuộc | Nghiệm thu |
| --- | --- | --- |
| R1 — Lưu SELF_REPORT | — | Preview và complete qua HTTP/PostgreSQL cho cả hai nhánh |
| R2 — Dùng chung catalogue và khóa khi lưu | R1 | Rút bài, đổi revision hoặc đổi level đồng thời cho kết quả đúng |
| R3 — Sửa semantics của preferences và retry | R1, R2 | Cập nhật một trường giữ các trường khác, replay đúng ID hoặc trả 409 |
| R4 — Sửa khôi phục wizard và Home | R3 | Reload/mất response, stale 409, PAUSED và lộ trình đã lưu hoạt động trên browser |
| R5 — Nghiệm thu tích hợp | R1–R4 | Hai nhánh chạy từ signup synthetic đến bài học trên build production |

## R1 — Lưu SELF_REPORT đúng provenance

- [ ] Tái dùng kết quả resolver của `context/service.ts` hoặc trích phần dựng dữ liệu start để luồng complete ghi `selfReport: { levelId: resolvedLevelId }` cho SELF_REPORT. DEFAULT giữ `selfReport` và `startResultId` rỗng. Dùng level server vừa xác thực và ghi context cùng plan trong một transaction.
- [ ] Thêm regression PostgreSQL và HTTP cho SELF_REPORT hợp lệ với đúng course/framework. Kỳ vọng complete 201, đúng `selectedStartLevelId`, `workingLevelId`, provenance và một ACTIVE plan. Case level sai framework hoặc thiếu bài xuất bản trả lỗi nghiệp vụ và ghi 0 context/plan. Kiểm tra DEFAULT và route create/start cũ.

**File chính** — [onboarding service](../lingora-web/src/server/context/onboarding-service.ts), [context service](../lingora-web/src/server/context/service.ts), [PostgreSQL suite](../lingora-web/tests/feature/onboarding-plan-postgres.test.mjs).

## R2 — Đồng bộ rule catalogue và khóa khi ghi

- [ ] Dùng chung một projection và predicate cho publication, hierarchy, thứ tự bài và graded completion giữa lesson catalogue và onboarding. Preview dùng working level ảo và tập completion rỗng. Plan đã lưu dùng context hiện hành, working level và completion thật. CTA chỉ lấy bài chưa hoàn thành, mở được và đúng exact active PUBLISHED revision. `PURPOSE_MATCH` chỉ xuất hiện khi metadata từ level bắt đầu thật sự ảnh hưởng lựa chọn course.
- [ ] Complete khóa Account, Course theo UUID ổn định, Language, rồi tái dùng khóa Level → Unit → Lesson → exact active Revision từ resolver hiện có. Với DEFAULT, xét cả các course ứng viên cùng ngôn ngữ dưới cùng quy tắc. Đọc lại catalogue sau khi lấy khóa, kiểm tra tập ứng viên/pointer đã đổi và giữ các khóa cần thiết đến commit. SELF_REPORT xác minh cả quan hệ với course/framework và availability của bài tại level. Nếu course/level đổi hoặc preview không còn ứng viên, trả `409 RECOMMENDATION_CHANGED`. Nếu chỉ bài gợi ý đổi, trả bài hiện đủ điều kiện. Giữ khóa Account → Course → Language → Context cho đường cập nhật plan và kiểm lại owner, role/status sau lock.
- [ ] Dùng một đường dựng `nextLesson` cho GET, complete replay và update. PAUSED đọc được summary với `nextLesson: null`. Course bị tắt hoặc không còn nội dung xuất bản phù hợp trả `CURRICULUM_UNAVAILABLE`. Course còn nội dung nhưng người học đã hoàn thành hết có thể trả READY với CTA catalogue. GET giữ nguyên snapshot. Context hợp lệ chưa có plan trả NO_PLAN.
- [ ] Dùng PostgreSQL hai kết nối và điểm đồng bộ để kiểm tra hai thứ tự race. Writer giữ khóa trước thì complete đợi và tính lại. Complete giữ khóa trước thì writer đợi đến commit. Bao gồm rút bài, thay active revision, đổi level thấp nhất và hai course cùng ngôn ngữ. Kiểm thử một lần vô hiệu hóa account thắng lock trước update. Xác nhận không ghi hàng khi stale và không sinh CTA bị lesson route từ chối ở cùng trạng thái catalogue.

**File chính** — [curriculum resolver](../lingora-web/src/server/context/curriculum.ts), [lesson catalogue](../lingora-web/src/server/lessons/service.ts), [test concurrency hiện có](../lingora-web/tests/feature/context-concurrency.test.mjs).

## R3 — Cập nhật preferences và replay đúng intent

### Preferences và CAS

- [ ] Với POST plan hiện tại, phân biệt trường vắng mặt với giá trị xóa chủ động. Field vắng giữ giá trị hiện hành. `purpose: null` xóa mục đích, `interests: []` xóa sở thích. Chuẩn hóa trên trạng thái đọc trong transaction và chỉ dùng mặc định 10 phút khi context chưa có giá trị. Giữ các khóa JSON khác và `onboardingCompletedAt` đã có.
- [ ] So phiên bản sau khi đối chiếu một replay đã commit. Update làm đổi kế hoạch thì đánh dấu plan cũ REPLACED, thêm một plan ACTIVE, ghi preferences và tăng context rowVersion trong cùng transaction. No-op trả plan đang ACTIVE, giữ rowVersion và snapshot. Source, course và start level lấy từ context. Context cũ thiếu provenance tiếp tục qua luồng chọn điểm bắt đầu hiện có.

### Lưu dấu thao tác để retry

- [ ] Đề xuất dùng `CommandReceipt` hiện có cho complete và update. Thêm hai mã lệnh bằng migration mới cập nhật CHECK, giữ các mã cũ. Receipt lưu hash của intent chuẩn hóa, context đích và ID plan đã trả. Complete dùng `contextId` làm khóa, update dùng `operationId`. Lưu receipt trong cùng transaction, kể cả update no-op, để phát hiện cùng key nhưng payload khác mà vẫn giữ lịch sử plan. Receipt thuộc schema riêng, DTO chỉ trả dữ liệu sản phẩm.
- [ ] Complete replay so ngôn ngữ, entry choice, course/level dự kiến và toàn bộ preferences chuẩn hóa. Trả đúng plan đầu tiên nếu nó còn ACTIVE. Update replay so context, trường nào có mặt, giá trị chuẩn hóa và rowVersion gửi ban đầu. Cùng key/cùng intent trả cùng plan còn ACTIVE và CTA tính theo catalogue hiện hành. Cùng key/intent khác, plan đã bị thay thế, hoặc key va chạm với plan khác trả 409. Account và context vẫn qua kiểm tra quyền/trạng thái trước khi trả replay. Với thao tác cũ thiếu receipt, GET và một update mới vẫn hoạt động. Replay cũ có provenance không đủ để đối chiếu trả 409 và hướng về bản hiện hành.
- [ ] Test PostgreSQL gửi complete đồng thời, retry sau mất response, đổi từng trường trong cùng key, replay sau thay plan rồi đổi giá trị trở về như cũ, hai update cùng rowVersion, retry no-op và rollback khi ghi plan hoặc receipt lỗi. So snapshot cũ, đúng một ACTIVE, các REPLACED cũ, working level, completion, consumption, attempt và SRS. Nếu thêm migration receipt, chạy trên DB mới và DB fixture đã có plan/progress; xác minh CHECK cũ vẫn cho phép các lệnh hiện hành.

**File chính** — [preferences](../lingora-web/src/server/context/preferences.ts), [DTO](../lingora-web/src/server/context/onboarding-dto.ts), [Prisma schema](../lingora-admin/prisma/product/schema.prisma), [cách dùng CommandReceipt hiện có](../lingora-web/src/server/lessons/practice-service.ts#L724).

## R4 — Khôi phục wizard và Home theo trạng thái server

- [ ] Lưu nháp theo account. Khi reload ở bước review mà chưa submit, gọi lại preview từ đầu vào đã lưu. Trước khi gửi complete, lưu payload đã chốt và cùng `contextId` để retry khi mất response hoặc reload. Nếu commit rồi, replay nhận đúng plan và dọn nháp. Nếu server trả `RECOMMENDATION_CHANGED`, giữ các lựa chọn và yêu cầu xem preview mới trước khi lưu. Chặn gửi trùng khi request pending. Xử lý 401 ở preview và complete.
- [ ] Home đọc plan hiện hành và điền số phút, mục đích và sở thích vào editor. Bổ sung `preferences` và `rowVersion` cho response GET owner-scoped, giữ các field và status Sprint 4 đã dùng. Chỉ gửi trường đã đổi. Retry giữ cùng ID và payload đến khi server xác nhận kết quả. Khi gặp stale 409, tải lại plan/context, giữ bản nháp riêng và cho học viên kiểm tra trước khi gửi thao tác mới. Đồng bộ state bằng response thay vì sửa trực tiếp object context.
- [ ] Kiểm tra production UI ở 390 px và desktop. Bao gồm reload tại review, hai lần nhấn Save, server commit nhưng client mất response, đổi account trong tab, session hết hạn, NO_PLAN, PAUSED, course hết nội dung và nút vào bài dùng đúng `href` server trả. Người học cũ vẫn đi được qua recovery, pause/resume và catalogue.

**File chính** — [wizard](../lingora-web/src/app/onboarding/OnboardingWizardView.tsx), [Home](../lingora-web/src/app/home/HomeView.tsx), [component suite](../lingora-web/tests/feature/onboarding-components.test.mjs).

## R5 — Nghiệm thu Core

- [ ] Thêm E2E có tên riêng cho Sprint 3, dùng provider synthetic, Next production, Chromium và PostgreSQL riêng. Đi từ signup → callback → password login/bootstrap → wizard → preview → lưu → reload → cùng plan ID → bắt đầu bài. Chạy DEFAULT và SELF_REPORT với hai learner mới. Cập nhật mục tiêu trên context có dữ liệu học và kiểm tra dữ liệu trước/sau trong DB. Chạy hồi quy Core Learner MVP cũ.
- [ ] Kiểm tra Prisma validate/generate, typecheck, build, feature/components, integration onboarding/lessons/practice/SRS, browser confirmation và E2E mới/cũ. Đưa các probe từng phát hiện lỗi vào suite để lần sau bắt được cùng regression. Ghi số ca chạy, exit code và SHA hoặc trạng thái working tree vào hồ sơ nghiệm thu.
- [ ] Đánh dấu `SPRINT 3 CORE PASS` khi cả hai entry paths và các ca race/retry/rollback đã qua. Slice 12 vẫn là điều kiện cho rollout public và chỉ chạy theo preflight đã ghi nhận. Placement tiếp tục phụ thuộc AssessmentVersion đã xuất bản, cấu hình điểm sang level và bài thi đã chuẩn bị. Hai mục này có kết quả riêng với Core local. [Slice 12 public preflight](2026-11-05-slice-12-next-public-attempt.md).

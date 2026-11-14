# Kiểm tra Sprint 3 — 12/11/2026

**SPRINT 3 CORE FAIL — `SELF_REPORT` trả HTTP 503 khi lưu và các thao tác plan chưa đáp ứng contract về preferences, retry và catalogue.**

Review working tree trên `30177a3`. Scope gồm recommendation, migration/transaction, API, wizard, cập nhật mục tiêu, Slice 12 và readiness của Placement. Các phép ghi thử sử dụng PostgreSQL và provider synthetic trên loopback. File thay đổi trong lượt review này là báo cáo này. Source Sprint 3 đang nằm trong working tree, chưa có commit nghiệm thu.

## Lỗi cần xử lý

| Mức | Phát hiện | Bằng chứng và cách xử lý |
| --- | --- | --- |
| P1 | `SELF_REPORT` không thể hoàn tất | Chromium desktop gọi preview → 200, complete → 503 `SERVICE_UNAVAILABLE`. PostgreSQL báo `learning_contexts_start_shape_check` vì context có `startSource: SELF_REPORT` nhưng thiếu `selfReport`. Context và plan đều 0 hàng sau lỗi. Tái dùng logic dựng provenance của context service hiện tại và kiểm tra hai nhánh bằng HTTP/DB thật. [Lệnh ghi context](../lingora-web/src/server/context/onboarding-service.ts#L255), [ràng buộc DB](../lingora-admin/prisma/product/migrations/20261027000000_product_baseline/migration.sql#L1362). |
| P1 | Đổi số phút học làm mất mục đích và sở thích | Home gửi mỗi `dailyGoalMinutes`. Backend chuẩn hóa purpose và interests vắng mặt thành `null` và `[]` rồi ghi đè. Probe xác nhận TRAVEL + FOOD → null + []. Áp dụng giá trị patch trên preferences hiện hành trong transaction. Giữ mốc hoàn tất lần đầu khi đổi mục tiêu. [Home POST](../lingora-web/src/app/home/HomeView.tsx#L86), [ghi preferences](../lingora-web/src/server/context/onboarding-service.ts#L605). |
| P1 | Replay chấp nhận payload khác hoặc trả sai plan | Dùng lại `contextId` với purpose/interests khác vẫn thành công. Dùng lại `operationId` với 20 thay vì 15 phút trả plan cũ thành công. Sau khi thay plan đầu tiên và đổi mục tiêu về giá trị ban đầu, replay complete trả ID plan mới, trong khi contract yêu cầu 409. So toàn bộ normalized intent, kiểm đúng plan đầu tiên trước khi replay, và xác thực payload cập nhật trước khi trả thành công. [Complete replay](../lingora-web/src/server/context/onboarding-service.ts#L153), [Update replay](../lingora-web/src/server/context/onboarding-service.ts#L449). |
| P1 | Complete có thể ghi lộ trình từ catalogue đã đổi | Probe dùng hai kết nối PostgreSQL. Kết nối thứ hai đổi bài vừa được chọn sang `PLANNED` và commit giữa lúc tính recommendation và lúc insert context/plan. Complete vẫn trả bài đó và ghi plan. Tái dùng thứ tự khóa Language/Level/Unit/Lesson/Revision của luồng context hiện tại và kiểm eligibility dưới khóa. [Complete recheck](../lingora-web/src/server/context/onboarding-service.ts#L225), [khóa của resolver hiện tại](../lingora-web/src/server/context/service.ts#L247). |
| P2 | Wizard và Home phục hồi thiếu dữ liệu | Reload ở bước review khôi phục bước 6 nhưng không còn preview card hoặc nút lưu. Cần quay lại và tạo preview lại mới tiếp tục được. Home chưa gọi GET plan để hiển thị plan đã lưu và editor mặc định 10 phút. Mỗi lần Save tạo operation ID mới, kể cả retry sau mất response. Đọc plan hiện hành khi mở UI, tái tạo preview từ nháp và giữ ID cho lần gửi lại cùng intent. [Restore](../lingora-web/src/app/onboarding/OnboardingWizardView.tsx#L108), [Home editor](../lingora-web/src/app/home/HomeView.tsx#L74). |
| P2 | Hai nơi thực thi publication và unlock, với kết quả khác nhau ở một số trạng thái | `resolveNextLesson` lặp lại kiểm tra của lesson catalogue. Complete replay còn dùng tập completion rỗng và có thể trả CTA cho context đã pause. GET plan trả `READY` sau khi rút toàn bộ bài, mặc dù plan vẫn còn và `nextLesson` null. Dùng chung query và điều kiện catalogue, xác thực context/availability ở mọi đường trả CTA. [Onboarding resolver](../lingora-web/src/server/context/curriculum.ts#L45), [catalogue hierarchy](../lingora-web/src/server/lessons/service.ts#L48), [GET plan](../lingora-web/src/server/context/onboarding-service.ts#L346). |
| P2 | Update thiếu kiểm tra lại trạng thái account sau khi lấy lock | Route kiểm tra learner trước khi gọi service. Service khóa Account rồi tải context mà không đọc lại role/status, nên một lần vô hiệu hóa diễn ra giữa hai bước có thể lọt qua. Complete và các context mutation cũ kiểm tra role/status dưới khóa. Phát hiện từ đọc source. [Update transaction](../lingora-web/src/server/context/onboarding-service.ts#L419). |

## Kết quả đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run db:product:validate`, `npm run db:product:generate`, `npm run typecheck`, `npm run build` với env synthetic | PASS. Build có cảnh báo Turbopack về tracing Prisma. |
| `npm run test:feature -w lingora-web` | PASS 253/253, gồm registration và confirmation transport. |
| `npm run test:components -w lingora-web` | PASS 62/62. Suite wizard dùng API mock nên chưa bắt lỗi lưu SELF_REPORT trên PostgreSQL. |
| `npm run test:integration:onboarding` | PASS 46/46, gồm 9 ca LearningPlan hiện có. Ca “double-submit” trong suite gọi tuần tự và ca payload conflict chỉ đổi số phút. |
| `npm run test:integration:lessons`, `npm run test:integration:practice`, `npm run test:integration:srs` | PASS 7/7, 13/13, 13/13. |
| `npm run test:e2e:learning` | PASS luồng Core Learner MVP cũ, gồm đọc, Practice, mở khóa và SRS. Harness sử dụng session synthetic và context seed, chưa đi qua wizard Sprint 3. |
| `npm run test:browser:confirmation -w lingora-web` | PASS đăng ký qua Chromium với provider synthetic, callback 303 → `confirmed=1`, PKCE verifier và cookie flags đúng. |
| Probe Chromium trên build production và PostgreSQL riêng | DEFAULT 390 px lưu HTTP 201, CTA mở bài và bắt đầu đọc, GET plan giữ ID qua reload. PAUSED đọc được plan, không có CTA. Learner khác nhận 404. SELF_REPORT desktop preview 200, complete 503. Reload ở bước preview làm mất card và nút lưu. |
| Probe PostgreSQL cho update và migration | Hai POST service dùng cùng rowVersion cho một thành công và một `STALE_OPERATION`. Lỗi chèn plan được tiêm sau khi đánh dấu REPLACED, rollback giữ nguyên plan ACTIVE và context. Snapshot cũ, workingLevel, completion, consumption, attempt và SRS được đối soát nguyên vẹn. Áp migration mới trên DB thử đã có context và dữ liệu học giữ nguyên các hàng đó, 0 plan backfill. |

Probe dùng session synthetic để vào wizard. Ca xuyên suốt từ signup/callback qua password login/bootstrap rồi vào wizard Sprint 3 chưa có kết quả PASS liền mạch. Kiểm tra bổ sung xác nhận đúng các lỗi nêu trên, dù suite có sẵn chạy xanh.

## Trạng thái release

- **S3-00 BLOCKED — preflight public chưa đủ.** GET public Learner `/register` trả 200, `/onboarding` trả 404 và Staff root trả 307. Đây là kiểm tra endpoint, chưa xác minh được SHA đang chạy, readiness của hộp thư hoặc hoàn tất handoff công khai. Hồ sơ ngày 05/11 ghi có một lượt được phép với điều kiện preflight, còn current-task ghi chờ xác nhận. Không có kết quả public mới. Lần instrumented trước ghi `flow_state_expired` / HTTP 422, có verifier cookie. [Lượt đề xuất](2026-11-05-slice-12-next-public-attempt.md), [current task](current-task.md), [bằng chứng public](slice-12-instrumented-acceptance-20261104.md).
- **Placement BLOCKED — thiếu luồng approve/publish AssessmentVersion và cấu hình ánh xạ điểm sang level đã xác nhận.** Source có blueprint, assembly và pin item revision. API version hiện chỉ đọc version. Chưa có learner start/submit cho Placement hoặc bằng chứng course đủ bộ câu hỏi và mapping đã duyệt. [Slice 8](roadmap.md#slice-8--assessment-authoring-foundation-pass--accepted), [route version](../lingora-admin/src/app/api/assessment-versions/%5BversionId%5D/route.ts).

## Hợp đồng đọc cho Sprint 4

`GET /api/learner/contexts/:contextId/plan` trả `{ data: { status, plan, nextLesson } }`. Tất cả bốn trạng thái đã quan sát trên fixture. `Plan` gồm `id`, `contextId`, `courseId`, `startLevel`, `source`, `dailyGoalMinutes`, `status`, `reasonCodes`, `createdAt` và `replacedAt`. CTA dùng nguyên `nextLesson.href` do server trả.

| Ví dụ | `status` | `plan` | `nextLesson` |
| --- | --- | --- | --- |
| Context mới có bài mở được | `READY` | Plan đang ACTIVE | `{ id, title, href }` |
| Context cũ chưa tạo plan | `NO_PLAN` | `null` | `null` |
| Context pause sau khi lưu plan | `PAUSED` | Plan đang ACTIVE | `null` |
| Course bị tắt | `CURRICULUM_UNAVAILABLE` | Plan đang ACTIVE | `null` |

Consumer cần xử lý `READY` với `nextLesson: null`. Trường hợp rút toàn bộ bài mà course vẫn ACTIVE hiện cũng trả shape này, như phát hiện P2.

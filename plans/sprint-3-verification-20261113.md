# Sprint 3 Core — Kiểm tra sau sửa ngày 13/11/2026

**SPRINT 3 CORE PASS trên môi trường local.** Kiểm tra working tree trên commit nền `30177a3`. [Kế hoạch sửa](2026-11-12-sprint-3-core-repair.md), [báo cáo trước khi sửa](sprint-3-verification-20261112.md).

## Phần đã có khi tiếp nhận

Working tree đã có lưu provenance SELF_REPORT, khóa catalogue khi complete, CommandReceipt cho hai thao tác plan, patch preferences và khôi phục preview sau reload. Bộ browser onboarding lúc tiếp nhận dùng session dựng sẵn. Suite ban đầu qua hai nhánh tạo context/plan với fixture A1.

## Phần Codex sửa tiếp

- Onboarding dùng cùng predicate publication và thứ tự/mở khóa bài với lesson catalogue. GET, replay và update lấy CTA từ working level và completion hiện tại. Complete trả 409 nếu preview hết hiệu lực và loại course nằm ngoài tập đã khóa.
- Context cũ có provenance tạo được plan đầu tiên. Mutation đọc lại account dưới khóa, giữ CAS, ghi receipt nguyên tử, trả lỗi xung đột chung khi ID va chạm. Chỉnh mục tiêu giữ mục đích/sở thích vắng mặt trong patch, lịch sử và mốc onboarding.
- Wizard lưu đúng payload đang chờ để retry sau reload. Home giữ nguyên body khi retry và chỉ áp lại những trường người học đã sửa nếu gặp stale 409.
- Browser test đi qua signup, PKCE callback, password login/bootstrap và wizard bằng provider synthetic. Cả DEFAULT ở 390 px và SELF_REPORT desktop bắt đầu được bài học. Khi response bị ngắt sau commit, wizard sau reload và Home gửi lại đúng payload. GET sau reload trả cùng plan ID.

Code chính [curriculum](../lingora-web/src/server/context/curriculum.ts), [onboarding service](../lingora-web/src/server/context/onboarding-service.ts), [lesson service](../lingora-web/src/server/lessons/service.ts), [wizard](../lingora-web/src/app/onboarding/OnboardingWizardView.tsx), [Home](../lingora-web/src/app/home/HomeView.tsx).

## Nghiệm thu

| Lệnh hoặc ca kiểm tra | Kết quả |
| --- | --- |
| Prisma validate/generate, root typecheck, root build | PASS, exit 0 |
| Feature/component learner | PASS 253/253 và 65/65 |
| PostgreSQL integration onboarding | PASS 60/60. Có hai thứ tự race rút bài, duplicate complete đồng thời, stale CAS, rollback chèn plan và tạo plan cho context cũ có completion/SRS |
| PostgreSQL integration lessons/practice/SRS | PASS 7/7, 13/13, 13/13 |
| `npm run test:e2e:onboarding` | PASS trên build production và PostgreSQL loopback. Bao gồm lost-response replay của cả complete và update |
| `npm run test:e2e:learning` | PASS luồng Core Learner MVP cũ |
| `npm run test:browser:confirmation -w lingora-web` | PASS callback 303 và PKCE synthetic |
| Áp hai migration mới lên PostgreSQL riêng đã có dữ liệu | PASS. Context, completion, attempt, SRS và receipt COMPLETE_LESSON giữ nguyên. 0 plan backfill. Context cũ tạo được plan sau upgrade |
| `git diff --check` | PASS |

Test chính [PostgreSQL](../lingora-web/tests/feature/onboarding-plan-postgres.test.mjs), [browser onboarding](../lingora-web/tests/feature/onboarding-e2e.test.mjs). Log lượt chạy trong `/tmp/lingora-s3-repair.RUhoAq`.

Slice 12 public vẫn chờ nghiệm thu với provider thật. Placement vẫn chờ AssessmentVersion xuất bản và cấu hình điểm sang level. Bản sửa đang ở working tree, chưa commit hoặc triển khai.

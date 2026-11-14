# Sprint 3 — Onboarding và lộ trình học cá nhân

**Trạng thái** — Kế hoạch triển khai, đối chiếu với repo tại `30177a3` ngày 12/11/2026. Dự kiến 10 ngày làm việc, tính từ lúc có thể kiểm tra Slice 12. Nhánh Placement có điều kiện bàn giao riêng.

## Kết quả bàn giao

- Người mới đăng ký, xác minh email, đăng nhập và chọn ngôn ngữ, mục đích, số phút học mỗi ngày và sở thích. Sau khi chọn tự khai trình độ hoặc bắt đầu từ đầu, học viên xem lộ trình do server đề xuất và mở được bài học đủ điều kiện.
- Người học quay lại thấy lộ trình đã lưu. Có thể cập nhật mục tiêu của context hiện tại và xem lộ trình mới. Điểm bắt đầu, tiến độ, lịch sử học và SRS của context được giữ nguyên.
- Sprint 4 có DTO ổn định để đọc lộ trình hiện tại, số phút mỗi ngày và bài có thể học tiếp. Placement là lựa chọn thứ ba khi đã có bài đánh giá xuất bản, cấu hình chấm và luồng thi được nghiệm thu.

## Hiện trạng và phụ thuộc

| Hạng mục | Repo hiện có và quyết định cho Sprint 3 |
| --- | --- |
| Slice 12 | Public vẫn **NOT ACCEPTED**. Lượt có chẩn đoán ghi nhận `pkce_exchange` / `flow_state_expired` / HTTP 422 sau 25 phút, có verifier cookie. Bản sửa helper đã PASS offline. Mốc 180 giây là giới hạn của helper, TTL cấu hình thật chưa được xác minh. |
| Context | `LearningContext` đã có `purpose`, `studyPreferences`, `studyFocus`, nguồn và level bắt đầu. Routes create/start hỗ trợ `DEFAULT` và `SELF_REPORT`; đã có CAS, khóa hàng, một context mỗi ngôn ngữ và tối đa hai context ACTIVE. |
| Catalogue | `server/context/service.ts` xác định level đủ nội dung. `server/lessons/service.ts` áp dụng publication, thứ tự và điều kiện mở khóa từ completion. Đây là nguồn xác định bài thực sự có thể mở. |
| LearningPlan | ADR-030/031 mặc định tính lộ trình động, cho phép lưu khi cần lịch sử hoặc khôi phục chính xác. Kế hoạch này chọn lưu snapshot vì đề bài cần mở lại lộ trình đã chấp nhận và giữ các bản được thay thế. |
| Placement | Slice 8 có Blueprint, assembly và item revision pin. Prisma có Attempt/Response/Result. Source chưa có luồng làm bài Placement phía học viên và publish AssessmentVersion cần được hoàn thiện hoặc xác minh tại mốc triển khai. |
| Dữ liệu | Seed repo có English/A1 dùng cho demo có thể lặp lại. Japanese và Chinese lấy theo catalogue thật hoặc fixture cô lập; mức sẵn sàng trên public chưa được xác minh. |

Sprint 3 tái dùng nội dung đã xuất bản, nên có thể triển khai độc lập với Sprint 1, 2 và 5. Sprint 2 có thể sửa cùng schema Prisma và thư mục migration. Khi tích hợp, lấy schema mới nhất, xếp migration theo thứ tự áp dụng và kiểm tra cả DB mới lẫn DB có dữ liệu cũ. Sprint 4 dùng hợp đồng đọc ở dưới.

Nguồn repo: [DESIGN](../DESIGN.md), [ADR-030/031/032/035/036/042](../logs/decision-log.md), [roadmap Slice 8/12](roadmap.md), [Slice 12 contract](2026-11-01-slice-12-onboarding-context.md), [schema Prisma](../lingora-admin/prisma/product/schema.prisma), [catalogue service](../lingora-web/src/server/lessons/service.ts).

## Hợp đồng triển khai

### Sở thích và lộ trình đã lưu

- Lưu mã mục đích chuẩn vào `LearningContext.purpose` gồm `TRAVEL`, `WORK`, `SCHOOL`, `EXAM`, `CONVERSATION`, `CULTURE`, `ENTERTAINMENT`, `OTHER`. Mục đích và sở thích là tùy chọn. Wizard dùng mặc định 10 phút/ngày, cho chọn 5, 10, 15 hoặc 20. Bỏ qua sở thích lưu danh sách rỗng.
- Dùng Zod đọc/ghi phần thuộc onboarding trong `studyPreferences` gồm `dailyGoalMinutes`, `interests`, `onboardingVersion` và `onboardingCompletedAt`. Mã sở thích lấy từ danh sách đóng, tối đa 5 lựa chọn, chuẩn hóa trùng và thứ tự; giữ các khóa JSON cũ của chức năng khác. Mốc hoàn tất do server ghi khi lưu thành công lộ trình đầu tiên. `studyFocus` tiếp tục theo ADR-042. Giờ học, level mục tiêu, skill priorities và ETA theo tuần để dành khi có nhu cầu và dữ liệu.
- Thêm một bảng `LearningPlan` trong schema `app` gồm `id`, `contextId`, `courseId`, `startLevelId`, `source` (`DEFAULT | SELF_REPORT | PLACEMENT`), `dailyGoalMinutes`, `status` (`ACTIVE | REPLACED`), `recommendationSnapshot`, `createdAt`, `replacedAt?`. Snapshot có phiên bản thuật toán, input sở thích đã chuẩn hóa, ID bài đề xuất nếu có và mã lý do. Dùng FK cho context/course/level và unique index có điều kiện trên `context_id` với `status = 'ACTIVE'`. Cột trạng thái và mốc thay thế là phần cập nhật của bản cũ; nội dung snapshot giữ lịch sử.
- Lộ trình đầu tiên của người mới ghi cùng transaction với context và preferences. Khi học viên lưu thay đổi làm đổi đề xuất hoặc mục tiêu, chuyển bản cũ sang `REPLACED` và tạo bản mới trong cùng transaction. Khi input chuẩn hóa và kết quả lưu không đổi, trả bản hiện hành. Dùng rowVersion của context cho CAS và khóa theo thứ tự Account → Course → Language → Context, sau đó theo thứ tự khóa catalogue hiện có. DB failure rollback cả context/preferences/plan liên quan.
- Với context cũ có điểm bắt đầu, khi học viên chủ động tạo lộ trình mới thì dùng đúng course, `selectedStartLevelId` và nguồn đã lưu. Bài đề xuất hiện tại dựa trên `workingLevelId` và progress. Context thiếu điểm bắt đầu tiếp tục dùng luồng khôi phục `/start` với điều kiện hiện có. Các bản ghi thiếu provenance vẫn học qua catalogue và hiện trạng thái chưa có lộ trình. Migration chỉ thêm bảng, không backfill hàng loạt.

### Đề xuất v1

1. Từ ngôn ngữ đã chọn, lọc `isLearnable`, course ACTIVE thuộc ngôn ngữ đó, unit thuộc framework của course, lesson AVAILABLE có exact active revision PUBLISHED và revision thuộc đúng lesson. Nếu không còn ứng viên, trả trạng thái “Sắp có nội dung” và giữ câu trả lời trong wizard.
2. `DEFAULT` lấy level có nội dung thấp nhất của course theo `Level.position`. `SELF_REPORT` xác thực level người học chọn trong course/framework và còn nội dung. `PLACEMENT` lấy kết quả hoàn tất được server xác minh từ đúng context/version. Khi có nhiều course hợp lệ cho `DEFAULT`, ưu tiên course có `purposeTags` khớp tại level bắt đầu nếu catalogue thực sự có mã tương thích, rồi tie-break theo `courseId`. Với `SELF_REPORT`, lựa chọn level mang theo course tương ứng để tránh so mã A1/N5 giữa các framework.
3. Dùng cùng quy tắc đọc catalogue để tìm bài chưa hoàn thành, mở được tại working level, theo thứ tự unit/lesson và ID làm tie-break. Với preview cho người mới, dùng level đề xuất làm working level và tập completion rỗng. Nếu hết bài đủ điều kiện, CTA mở catalogue. Snapshot ghi bài được gợi ý lúc chấp nhận. Khi đọc lại, server kiểm tra lại quyền truy cập và availability trước khi trả `nextLesson`; nếu lesson bị rút hoặc khóa, dùng bài hiện đủ điều kiện hoặc catalogue. Việc đọc lại không sửa snapshot.
4. Mã lý do gồm `LOWEST_AVAILABLE_LEVEL`, `SELF_REPORTED_LEVEL`, `PLACEMENT_RECOMMENDED_LEVEL` và `PURPOSE_MATCH` khi metadata thực sự tham gia quyết định. Daily goal xuất hiện trong kế hoạch học mỗi ngày. Sở thích được lưu cho cá nhân hóa; v1 giữ thứ tự bài chuẩn khi chưa có taxonomy sở thích tương thích. Hiển thị “Điểm bắt đầu đề xuất” và nguồn đề xuất; số phút/ngày là mục tiêu do học viên chọn.

### API và tích hợp Sprint 4

Giữ prefix `/api/learner`. Mọi route mới dùng envelope và auth hiện có, `Cache-Control: no-store, private`, kiểm tra role/status phía server, xác minh quyền sở hữu, và kiểm tra same-origin với POST.

| Route | Contract dự kiến |
| --- | --- |
| `GET /api/learner/context/options` | Tái dùng options ngôn ngữ/course/level. Wizard hiển thị trạng thái sắp có nội dung cho ngôn ngữ chưa có course/level đủ điều kiện. |
| `POST /api/learner/onboarding/preview` | Nhận ngôn ngữ, sở thích hợp lệ và entry choice. Trả `READY` với course/level/bài/lý do, hoặc `NO_ELIGIBLE_CURRICULUM`. Chỉ đọc. Với self-report, client gửi level như lời tự khai. |
| `POST /api/learner/onboarding/complete` | Nhận `contextId` do client tạo một lần, input đã preview và course/level dự kiến để so khớp. Server tính lại và xác thực trong transaction; thay đổi course/level trả `409 RECOMMENDATION_CHANGED` để xem lại. Nếu chỉ bài gợi ý thay đổi, màn kết quả dùng bài đủ điều kiện mới nhất. Trả context và plan đã lưu. Tái dùng logic create context trong transaction; giữ route create cũ cho caller hiện có. |
| `GET /api/learner/contexts/:contextId/plan` | Trả `{ data: { status, plan, nextLesson } }`. `status` là `READY | NO_PLAN | PAUSED | CURRICULUM_UNAVAILABLE`. `plan` có thể null; bản tóm tắt gồm `id, contextId, courseId, startLevel, source, dailyGoalMinutes, reasonCodes, createdAt`. `nextLesson` có thể null hoặc gồm `id, title, href`. Href do server dựng bằng đường dẫn learner hiện có. Context PAUSED hoặc catalogue không khả dụng có thể đọc bản tóm tắt, với `nextLesson: null`. |
| `POST /api/learner/contexts/:contextId/plan` | Tạo lộ trình cho context cũ đã có provenance hoặc lưu preferences mới cho context đã có plan. Nhận `operationId` UUID giữ nguyên khi retry, `expectedRowVersion` và preferences. Source/course/start level lấy từ context. Context phải ACTIVE. Trả DTO mới cùng rowVersion để UI đồng bộ. |

Tạo context mới dùng `contextId` làm khóa replay dưới Account lock. So payload chuẩn hóa với bản plan đầu tiên trước khi tính lại catalogue. Nếu lần ghi đã commit và plan đó vẫn ACTIVE, cùng input trả cùng ID; nếu plan đã được thay thế, trả 409 và yêu cầu tải bản hiện hành. Với cập nhật context đã có, dùng `operationId` làm ID plan mới, đối chiếu owner/context và intent đã lưu dưới lock trước kiểm tra CAS; retry no-op chỉ trả bản hiện hành khi trạng thái vẫn khớp. Reuse cùng khóa với input khác hoặc ghi bằng rowVersion cũ trả 409. Kiểm thử riêng trường hợp pause/resume hoặc ghi khác chen giữa. ID từ client dùng cho dedup và đối chiếu; quyền sở hữu, trạng thái, điểm bắt đầu và bài học lấy từ server.

## Công việc theo thứ tự

| Mốc | Ngày dự kiến | Phụ thuộc | Kết quả kiểm được |
| --- | --- | --- | --- |
| S3-00 | 1–2 | — | Slice 12 có bằng chứng public trọn luồng |
| S3-01 | 3 | S3-00 | Preview DEFAULT và SELF_REPORT dùng catalogue thực |
| S3-02 | 4–5 | S3-01 | Tạo context và plan, đọc lại được sau refresh |
| S3-03 | 6–7 | S3-02 | Wizard, resume, màn lộ trình, mở bài đầu |
| S3-04 | 8 | S3-02 | Context cũ tạo plan, cập nhật sở thích và giữ lịch sử |
| S3-05 | 9–10 | S3-03, S3-04 | Chạy regression, E2E, bàn giao DTO cho Sprint 4 |
| S3-P1 → P3 | Ước lượng thêm 3–5 ngày khi có blueprint và item | S3-00, S3-02; P3 nối S3-03 | Placement đủ điều kiện để bật theo course |

### S3-00 — Nghiệm thu lại Slice 12

- [ ] Đối chiếu [hồ sơ thất bại public](slice-12-instrumented-acceptance-20261104.md), [bản sửa helper](slice-12-pkce-handoff-verification-20261105.md) và [hồ sơ lượt tiếp theo](2026-11-05-slice-12-next-public-attempt.md). Hồ sơ lượt tiếp theo ghi đã được phép với điều kiện preflight, còn `current-task.md` ghi đang chờ. Đối chiếu trạng thái lượt này và readiness hiện tại trước khi thực thi.
- [ ] Chạy lại regression registration/confirmation cần thiết. Kiểm tra deployment thực tế, email handoff và browser state theo hồ sơ lượt test. Mốc public PASS yêu cầu signup → verify → callback đến `/login?confirmed=1` → đăng nhập mật khẩu/bootstrap → tạo context → vào Lesson/Practice → pause/resume và đối soát dữ liệu test theo contract Slice 12.
- [ ] Nếu callback vẫn lỗi, ghi bước lỗi và mã chẩn đoán rồi khoanh vùng dựa trên bằng chứng. Dời lịch rollout Sprint 3 cho tới khi có public PASS. Nếu cần sửa, tập trung vào `auth/confirm/route.ts`, registration/login và helper tùy bằng chứng. Test hiện có: `auth-registration.test.mjs`, `confirmation-transport.test.mjs`, `npm run test:browser:confirmation -w lingora-web`.

### S3-01 — Xem trước điểm bắt đầu

- [ ] Thêm schema sở thích, DTO preview và hàm chọn đề xuất trong `lingora-web/src/server/context/`. Chia sẻ quy tắc eligibility với context/catalogue và đọc metadata trên exact active revision. Nối preview route với options hiện có.
- [ ] Feature tests chứng minh DEFAULT chọn level thấp nhất **có** nội dung, SELF_REPORT từ chối course/framework sai, output ổn định khi thứ tự dữ liệu thay đổi và không gợi ý draft, withdrawn hoặc bài đang khóa. Fixture gồm hai course cùng ngôn ngữ, hai framework và một ngôn ngữ chưa có lesson. Preview ghi 0 context/plan.

### S3-02 — Lưu lộ trình đầu tiên

- [ ] Thêm bảng và migration mới tại `lingora-admin/prisma/product/`, theo ranh giới quyền DB/RLS đã dùng trong repo. Cập nhật Prisma Client dùng chung. Dùng transaction create với validation lại ngay trước ghi, giữ nguyên lock và capacity rule. Nối complete route và GET plan.
- [ ] PostgreSQL test kiểm tra 1 context + 1 ACTIVE plan sau double-submit hoặc mất response; stale preview, 2 ACTIVE contexts, owner khác và DB failure đều không sinh ghi một phần. Test migration trên DB mới và DB đã có context, lesson completion và SRS. Đọc plan lại sau reload phải trả cùng ID và dữ liệu đã lưu.

### S3-03 — Wizard và màn lộ trình

- [ ] Gắn CTA onboarding vào `/home` cho người mới và “Thêm ngôn ngữ” cho người đã học. Wizard tại `/onboarding` đi qua ngôn ngữ → mục đích → số phút → sở thích → tự chọn level hoặc bắt đầu từ đầu → xem đề xuất. Giữ nút quay lại và đầu vào khi lỗi; đổi ngôn ngữ xóa lựa chọn course/level phụ thuộc.
- [ ] Trước khi lưu, dùng `sessionStorage` theo account để phục hồi nháp và ID thao tác khi tải lại trong tab. Sau khi lưu, server là nguồn resume, xóa nháp khi đã đối soát. Đổi tài khoản không hiển thị nháp của người trước. Không đưa câu trả lời, thông tin auth hay ID replay vào URL.
- [ ] Hiển thị course, level đề xuất, nguồn, mục tiêu phút/ngày và CTA bài đầu ở màn kết quả. Xử lý loading, empty, lỗi mạng, phiên hết hạn, stale preview, pending, pause và catalogue thay đổi. Browser test ở 390px và desktop, bàn phím có thể đi qua các bước; CTA bài học mở được route thật.

### S3-04 — Cập nhật mục tiêu và hỗ trợ người học cũ

- [ ] Thêm action tạo/lưu plan trên context hiện có, áp dụng CAS với `operationId` và thay thế snapshot trong transaction. UI có thể tái dùng các bước sở thích của wizard. Người đang học vẫn vào catalogue, pause/resume và ôn tập qua các lối hiện có.
- [ ] PostgreSQL test kiểm tra hai thay đổi đồng thời với cùng rowVersion, mất response, thay đổi xong rồi pause, và rollback khi insert bản mới lỗi. Đối soát đúng một ACTIVE, snapshot cũ giữ nguyên, `workingLevelId` và lịch sử học/SRS không bị ghi lại.

### S3-05 — Nghiệm thu và bàn giao

- [ ] Chạy flow trên Next/Chromium và PostgreSQL test: signup/callback synthetic → login → chọn English → Travel → 10 phút/ngày → chọn sở thích → DEFAULT → xem plan → refresh → mở bài và bắt đầu học. Chạy nhánh SELF_REPORT độc lập. Dùng fixture cô lập cho Japanese/Chinese; demo public chọn ngôn ngữ có catalogue thật.
- [ ] Nghiệm thu public theo Slice 12 ở S3-00. Sau rollout Sprint 3, kiểm tra wizard mới, lộ trình và lesson trên deployment bằng tài khoản test phù hợp. Ghi riêng các kết quả local/synthetic và public.
- [ ] Bàn giao DTO cùng ví dụ `READY`, `NO_PLAN`, `PAUSED` và `CURRICULUM_UNAVAILABLE` cho Sprint 4. Nếu cần rollback, chuyển CTA về luồng context cũ và để dữ liệu plan đã ghi trong bảng additive.

## Nhánh Placement

Đến cuối ngày 2, xác nhận có course với blueprint hợp lệ, bộ câu hỏi do Teacher chuẩn bị, Admin có thể publish version immutable, và có cấu hình ánh xạ điểm → level được chấp thuận. Nếu thiếu hoặc ước lượng vượt khung còn lại, bàn giao core với hai nhánh hiện có, ghi Placement là phần còn mở của Sprint 3 và chỉ bật CTA khi đạt P1–P3. Số phút hiển thị cho bài test lấy từ cấu hình.

- [ ] **S3-P1 — Chuẩn bị bài đánh giá.** Kiểm tra hoặc hoàn thiện phần approve/publish của Slice 8 đủ cho Placement. Đóng băng đúng item revisions, grading refs và cấu hình ánh xạ trong version xuất bản. Fixture cần một version khả dụng và một version draft/superseded để test điều kiện chọn. Không dùng lại item đã lộ lời giải từ lesson practice.
- [ ] **S3-P2 — Bắt đầu và nộp bài.** Đề xuất `POST /api/learner/onboarding/placement/start` để tạo context ACTIVE chưa có điểm bắt đầu, lưu sở thích tạm trong context và mở attempt pin đúng published version thuộc course. Dùng context ID và attempt ID ổn định khi retry, giữ capacity rule. `POST /api/learner/contexts/:contextId/placement/:attemptId/submit` nhận `submissionKey` và danh sách câu trả lời theo item ID của version đó. Tái dùng logic chấm phù hợp ở server. Một submit hợp lệ ghi responses, một result, nguồn `PLACEMENT`, `startResultId`, điểm bắt đầu và plan trong một transaction. Kiểm tra đúng context, pinned version, curriculum generation và điểm bắt đầu còn nội dung. Cùng key/cùng payload trả cùng kết quả; sai owner, key đổi payload hoặc stale không ghi. Runner chỉ nhận prompt và input schema an toàn. Kết quả UI chỉ có tổng điểm và mức đề xuất, không lộ đáp án, điểm từng câu hay grading data.
- [ ] **S3-P3 — Nối wizard và xử lý bỏ dở.** Khi learner rời bài trước khi submit, không tạo result. Nếu họ quay lại và chọn DEFAULT/SELF_REPORT, hỗ trợ hoàn tất trên chính context chuẩn bị cho Placement sau khi xác minh chưa có kết quả hay lịch sử học, bằng thao tác riêng tái dùng resolver. Submit Placement đến sau phải thấy context đã hoàn tất và bị từ chối. PostgreSQL test race submit/fallback và duplicate submit; E2E kiểm tra làm bài → điểm đề xuất → mở bài. Retake và level-up là công việc sau nhánh này.

## Lệnh và tiêu chí hoàn tất

Chạy từ root `lingora-workspace`. Bổ sung test mới vào scripts đang dùng khi triển khai.

```bash
npm run db:product:validate
npm run db:product:generate
npm run typecheck
npm run test:feature -w lingora-web
npm run test:components -w lingora-web
npm run test:integration:onboarding
npm run test:integration:lessons
npm run test:integration:practice
npm run build
npm run test:e2e:learning
```

- [ ] **Slice 12** có public PASS với đúng deployment và xác minh đăng nhập bình thường.
- [ ] **Hành trình learner** đi được qua DEFAULT/SELF_REPORT, lưu một plan, tải lại và mở lesson hợp lệ. Empty catalogue, gián đoạn mạng, pause/resume và context cũ có đường xử lý rõ ràng.
- [ ] **Dữ liệu** có tối đa một ACTIVE plan mỗi context, rollback nguyên tử và giữ lịch sử. Người khác không đọc/ghi được plan; request stale không ghi đè state mới. Logic đọc bài và mở khóa qua graded completion vượt regression.
- [ ] **Bàn giao** đã kiểm DTO Sprint 4, trạng thái rollout và kết quả Placement. Chỉ đánh dấu hoàn tất phạm vi ba nhánh khi Placement đã qua P1–P3.

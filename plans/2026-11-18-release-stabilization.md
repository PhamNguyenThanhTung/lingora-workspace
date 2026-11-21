# Lingora — Release Stabilization

Spec điều phối ngày 2026-11-18. Mục tiêu là đóng các vấn đề P0, xác minh demo A1 và thiết lập baseline tích hợp trước phase Design. Trạng thái bên dưới áp dụng cho SHA đã fetch, theo đúng phạm vi và môi trường của từng bằng chứng.

## 1. Baseline

**Origin main SHA** — `fcfaee122f72d0befa90a47ca2b506e0984c9ae8`, xác nhận bằng `git fetch origin` và `git rev-parse origin/main`. Local `HEAD` cùng SHA tại thời điểm lập spec.

| Commit | Phạm vi có trên `origin/main` |
|---|---|
| `fcfaee1` | Hoàn thiện wizard onboarding và lựa chọn course cho nhánh `DEFAULT`. |
| `1d5372d` | Ưu tiên bài tiếp theo, CTA và fallback trên Learner Home. |
| `11aaf39` | Luyện viết ký tự và WRITING SRS có feature flag và allowlist. |
| `4bbdc23` | Phiên ôn flashcard lưu bền vững, MEANING dùng Policy B. |

**Working tree** — `README.md`, `plans/roadmap.md` và hai manifest `package.json`, `lingora-admin/package.json` có sửa đổi local. Teacher plan, UI audit, demo course, seed và demo test là untracked. Mỗi lane lấy SHA ở trên làm gốc và chỉ nhận phần thay đổi được bàn giao cho lane đó. Các sửa đổi đang có cần được chủ sở hữu giữ riêng khi chuẩn bị diff.

## 2. Source of truth hierarchy

1. **Schema và business constraints** — Ràng buộc dữ liệu, quyền, provenance và trạng thái nghiệp vụ đã duyệt. Đọc schema cùng migrations hiện hành.
2. **Accepted ADR/spec** — Quyết định sản phẩm và hợp đồng của slice, theo phạm vi được phê duyệt. Khi có quyết định mới hơn, ghi điều khoản nào được thay thế.
3. **Current implementation** — Source tại SHA đang xét mô tả hành vi thực tế. Nếu lệch hợp đồng, ghi rõ điểm lệch và phạm vi xử lý.
4. **Tests và acceptance evidence** — Bằng chứng gắn với SHA, môi trường, lệnh/kịch bản và kết quả quan sát được.
5. **Roadmap** — Tóm tắt kế hoạch và trạng thái. Đối chiếu phiên bản committed với diff local.
6. **Audit và recommendation** — Bằng chứng quan sát và đề xuất để xác minh trước khi đưa vào scope.

| Nhãn | Điều kiện dùng |
|---|---|
| **COMMITTED SPEC** | Tài liệu có trong Git tại SHA baseline. Ghi rõ phần nào là quyết định accepted, mục tiêu hoặc bằng chứng lịch sử. |
| **LOCAL/UNTRACKED PROPOSAL** | Nội dung ngoài SHA baseline, kể cả diff của file tracked. Có thể dùng làm đầu vào review với provenance ghi rõ. |
| **IMPLEMENTED** | Có đường thực thi trong source tại SHA được nêu. |
| **TESTED** | Kiểm tra đã chạy, có kết quả và môi trường cụ thể. Báo PASS/FAIL theo từng suite hoặc luồng. |
| **ACCEPTED** | Có quyết định nghiệm thu cho một phạm vi đã xác định và bằng chứng tương ứng. Ghi rõ môi trường nghiệm thu. |
| **PUBLIC ACCEPTED** | Hành trình đã được nghiệm thu trên deployment public định danh được. Ghi SHA/deployment và hành trình đã chạy. |
| **ROLLED OUT** | Xác nhận deployment và phạm vi người dùng thực sự được bật. Với feature flag, ghi môi trường và cohort được bật. |

**Nguồn committed** — [DESIGN](../DESIGN.md), [Roadmap](roadmap.md), [Learner Entry và Home](2026-11-18-learner-entry-and-home-experience.md), [public auth instrumented attempt](slice-12-instrumented-acceptance-20261104.md), [offline PKCE helper verification](slice-12-pkce-handoff-verification-20261105.md), [Slice 8](2026-10-31-slice-8-assessment-foundation.md), [decision log](../logs/decision-log.md) và [Sprint 6 delivery](2026-11-15-sprint-6-delivery.md).

**Đầu vào local** — [Teacher contributions plan](2026-11-16-teacher-contributions-and-lesson-feedback.md), [UI audit](../docs/ui-audit/README.md), [demo curriculum](../lingora-admin/src/server/curriculum/demo-a1.ts), [seed](../scripts/seed-demo-course.mjs) và [demo verification](../tests/feature/demo-course-verification.test.mjs). Các artifact này nằm ngoài baseline Git. Phần hồ sơ, attribution UI và rating bài học trong Teacher plan nằm ngoài phase này.

| Mâu thuẫn | Cách dùng trong phase này |
|---|---|
| ADR-043 giao hệ thống lắp ghép, Admin duyệt và xuất bản. Slice 8 accepted cho phép Admin chọn item revisions rồi tạo version `IN_REVIEW`. | Giữ acceptance của foundation theo đúng kịch bản Slice 8. Ghi auto-assembly và vòng review/publish Assessment là phần hợp đồng chưa hoàn tất. Xử lý trong spec Assessment riêng. |
| UI audit ghi 90,7% working và 0 blocker, gọi chung SRS là FSRS bốn mức và liệt kê Assessment 404 như lỗi. | Số dòng của ma trận lệch tổng kết. Dùng ảnh để tham chiếu UI; dùng source, ADR và test để xác định hành vi. MEANING có hai mức, WRITING có bốn. Learner Assessment nằm ngoài Slice 8. |
| Roadmap local thêm nhãn nghiệm thu Sprint 3–6 và gọi WRITING là FSRS-5. | Ghi trạng thái từ source và evidence theo SHA. Thuật toán WRITING là FSRS-6 với package `ts-fsrs@5.4.2`, theo ADR-045. |
| `DESIGN.md` liệt kê Placement/Level-up trong target và mô tả reinforcement Policy B. | Các màn Assessment vẫn là target. Luồng MEANING `/review` hiện ghi một thao tác lịch rồi tiến sang mục đến hạn kế tiếp; giữ scope này trong stabilization. |
| Offline PKCE helper PASS trong khi public activation FAIL. | Helper chứng minh guard và handoff offline. Lượt public có log vẫn kết thúc ở `flow_state_expired`; P0-B phải có evidence public mới. |

## 3. Current accepted product state

| Miền | Trạng thái và giới hạn |
|---|---|
| Admin/Teacher | **ACCEPTED** cho các slice Staff 1–7, gồm quyền, curriculum, phân công, revision, submit, yêu cầu sửa, approve và publish bài học. Slice 7 có **PUBLIC ACCEPTED** lịch sử trên deployment đã định danh. Trên baseline này, feature/component, integration Studio và joined E2E **TESTED PASS**; Admin E2E tổng **TESTED FAIL** tại draft recovery ngôn ngữ. |
| Learner | Slice 9–10 **ACCEPTED**, có **PUBLIC ACCEPTED** lịch sử cho Learner đã xác nhận sẵn và luồng bài học đúng phạm vi. Home/path và wizard mới **IMPLEMENTED / TESTED local** trên baseline. Authenticated Home và onboarding sau fresh signup còn cần nghiệm thu trên deployment hiện tại. |
| Practice | Slice 11 **ACCEPTED** và có **PUBLIC ACCEPTED** lịch sử. Chấm server, pin exact revision, first pass/retry/finalize, hoàn thành và mở bài theo hợp đồng. Điểm 100% không phải điều kiện hoàn tất. Joined E2E local PASS. |
| Gamification | XP, streak, quest và achievement **IMPLEMENTED / TESTED local**. Home/gamification Chromium + PostgreSQL PASS. Chưa có bằng chứng public cho phạm vi này trên baseline hiện tại. |
| Meaning SRS | **IMPLEMENTED / TESTED local**. Phiên lưu trạng thái, Policy B 5 stage, `REMEMBERED` / `FORGOTTEN`; PostgreSQL và Chromium PASS. Public rollout trên deployment hiện tại chưa xác minh. |
| Writing SRS | **IMPLEMENTED / TESTED local sau khi bật flag**. FSRS-6, bốn rating explicit, state tách theo skill. `WRITING_SRS_ENABLED=true` và ID nằm trong `WRITING_SRS_LEARNER_IDS` là điều kiện rollout. **PUBLIC ACCEPTED** và **ROLLED OUT** chưa xác minh. |
| Assessment | Slice 8 authoring foundation **ACCEPTED** với **PUBLIC ACCEPTED** lịch sử cho Blueprint, Teacher contribution và assembly trong phạm vi đã thử. Tự lắp ghép theo ADR-043, review/publish Assessment và Learner attempt/scoring/placement/level-up ở ngoài phần đã nghiệm thu. |
| Public Auth | Learner signup và callback **IMPLEMENTED / TESTED local**. Slice 12 fresh signup → onboarding **NOT PUBLIC ACCEPTED**. Lượt instrumented thất bại ở PKCE exchange trước app Account/session. Helper offline PASS có phạm vi riêng. |
| Demo curriculum | **LOCAL/UNTRACKED PROPOSAL**. Có code provision và verification cho English A1. Trạng thái qua luồng sản phẩm, rerun an toàn, media và rollout chưa xác minh. |

Bằng chứng public lịch sử của các Slice 7–11 được dẫn từ [Roadmap committed](roadmap.md). Kết quả local ở trên là kết quả independent review trên `fcfaee1`. Build hai app và typecheck sau Prisma generation đều PASS. Admin E2E thất bại hai lần ở assertion draft recovery, nên baseline tổng chưa xanh.

## 4. P0

### P0-A — Authenticated Home Production

**Goal** — Learner đang đăng nhập mở được `/home` trên deployment mục tiêu.

**Scope và dependency** — Dùng tài khoản test đã xác nhận để kiểm tra độc lập với P0-B và demo. Trace `HomePage → loadLearnerHome → loadLearnerContext / path / plan / SRS / gamification → auth và DB`. Màn lỗi chung có thể hiện cùng tiêu đề cho nhiều lỗi. Ghi status và error code từ API, rồi đối chiếu với log. Nếu nguyên nhân nằm trong auth/provider hoặc deployment config, bàn giao cho lane/chủ sở hữu tương ứng.

**Acceptance**

- Với phiên Learner hợp lệ, authenticated `GET /home` trả 200 và hiện nội dung thuộc tài khoản; `GET /api/learner/home` trả 200 với payload thành công.
- Kiểm tra riêng context có bài publish, tài khoản chưa có context và context chưa có bài publish. Dữ liệu rỗng hợp lệ có thông điệp và CTA phù hợp, không sinh `SERVICE_UNAVAILABLE`. Kiểm tra các nhánh paused, thiếu level và course inactive nếu fix chạm path.
- Ghi deployment SHA, thời điểm và log đã lọc thông tin nhạy cảm của lượt xác minh. Nếu lỗi tái hiện, ghi request/status/error code và dependency thất bại. Nếu chỉ smoke PASS, ghi phạm vi đã kiểm tra và giữ nguyên lịch sử incident.
- Home feature/component regressions và Home E2E PASS, gồm `npm run test:components -w lingora-web` và `npm run test:e2e:gamification`. Bao phủ fault/retry nếu sửa loader hoặc error state.

### P0-B — Public Signup

**Goal** — Fresh Learner đi trọn luồng register → confirmation email → callback → password login → Account bootstrap → onboarding → Home.

**Scope và dependency** — Xác minh deployment SHA, template/link thật, callback allowlist, trạng thái provider và giới hạn thời gian của email lẫn PKCE trước lượt public. Lượt lịch sử trả `flow_state_expired` sau khoảng 25 phút dù có verifier; guard offline 180 giây là thời hạn thao tác của helper. Theo đúng thông tin bàn giao và quyền đã cấp cho lượt thử cụ thể. Các tác vụ production, gửi email hoặc đổi provider settings cần phạm vi ủy quyền riêng.

**Policy cross-device** — Đối với callback `code` hiện tại, hợp đồng đề xuất cho P0 là hoàn tất trên cùng browser/profile và thiết bị đã bắt đầu signup để giữ verifier. Xác minh thông báo và đường phục hồi khi người dùng mở ở nơi thiếu verifier. Nếu chủ dự án yêu cầu hỗ trợ cross-device, chốt quyết định riêng trước khi đổi flow/template, rồi nghiệm thu nhánh đó bằng email thật. Có nhánh `token_hash` trong code chưa đủ để tuyên bố hỗ trợ cross-device trên deployment.

**Acceptance**

- Dùng một identity test mới đã được phép. Email thực đến đúng inbox. Link nhận thực tế tới callback, hoàn tất xác nhận và chuyển về login với kết quả confirmed.
- Password login thành công, đúng identity được bootstrap thành Account `LEARNER/ACTIVE`, hoàn tất onboarding tạo context/plan đúng khóa và truy cập được Home có xác thực. Có thể quay Home từ CTA bài đầu/catalogue của wizard.
- Ghi SHA/deployment, kiểu link, các status và checkpoint đã che thông tin nhạy cảm. Xác minh trạng thái cuối và xử lý dữ liệu test theo phạm vi lượt thử. Ghi contract cross-device được duyệt và kết quả tương ứng.
- Auth registration, confirmation transport, session/login regressions và onboarding integration/E2E PASS. Chỉ đóng **PUBLIC ACCEPTED** khi chuỗi đầy đủ qua deployment đã định danh.

### P0-C — Admin E2E Draft Recovery

**Goal** — Xác định lỗi xảy ra do test đọc trước lúc form hydrate từ draft, hay do ứng dụng không phục hồi draft.

**Acceptance**

- Tái hiện bằng Admin E2E và một kịch bản riêng cho draft ngôn ngữ. Kiểm tra code `es`, tên tiếng Việt và draft của đúng Account. Xác minh trường giữ trống sau khi form ổn định hay chỉ trống tạm thời.
- Nếu là race của test, chờ giá trị/hành vi observable. Nếu là lỗi sản phẩm, sửa đúng phạm vi modal và giữ kiểm tra draft isolation, phục hồi và discard. Tránh fixed sleep để đạt PASS.
- `npm run test:e2e -w lingora-admin` PASS **ba lượt liên tiếp**, theo mọi viewport suite hiện có. Chạy `npm run test:components -w lingora-admin` nếu chạm modal hoặc hành vi recovery. Ghi nguyên nhân và log các lần chạy.

## 5. P1 — Demo A1

**Scope** — Review và chuẩn hóa fixture English A1 hiện có cho luồng Admin → Teacher → review/publish → Learner. Dùng đúng runtime hiện tại cho blocks, Practice, XP và Meaning SRS. Tiến hành song song với P0 trên DB test riêng.

**Điều kiện trước khi chạy** — Verification local có fallback sang `lingora-admin/.env` và ghi trực tiếp vào DB. Khóa runner vào PostgreSQL tạm thuộc test qua cơ chế guard hiện có trước khi chạy; dừng khi chưa xác định quyền sở hữu target. Phần script ghi Account, context, attempt, completion, XP và SRS trực tiếp chỉ có giá trị kiểm tra cấu trúc dữ liệu. Nghiệm thu hành vi phải đi qua service/API và browser hiện có, dùng joined E2E làm mẫu. HTTP HEAD cho audio xác minh endpoint có phản hồi; cần phát audio trong browser để xác minh trải nghiệm.

**Acceptance**

- Seed trên DB test mới rồi chạy lại. Xác minh đúng **3 Units, 9 Lessons**, IDs/positions, người phụ trách, active revision pointers và nội dung chính. Rerun không nhân bản assignment, review, revision hoặc content. Kiểm tra đường chạy từ trạng thái provision dở và từ chối xung đột với dữ liệu ngoài fixture.
- Mỗi bài có revision `PUBLISHED` và lesson `AVAILABLE` trong course active. Ít nhất một bài chứng minh assignment episode, author của revision, submit → yêu cầu chỉnh sửa và feedback → resubmit → approve → publish đúng revision. Dùng tài khoản đúng role và ghi evidence provenance.
- Learner có thể chọn course, mở bài đầu, đọc nội dung và phát audio listening. Bài sau bị khóa trước khi hoàn thành Practice và mở theo path sau khi hoàn thành. Ghi test retry, server grading và exact revision pin.
- Finalize qua runtime tạo completion, XP và thẻ core vocabulary. Replay không nhân đôi side effect. Dùng cửa sổ due được kiểm soát trong DB test để chạy một phiên MEANING thật qua hai rating Policy B và đối chiếu stage/due cùng operation record.
- Giữ Writing Nhật/Trung và multi-course onboarding ở fixtures riêng. P1 chỉ bao phủ English A1 bằng chức năng hiện hành.

## 6. P2 — Design foundation

Phase sau stabilization. Phạm vi dự kiến gồm brand tokens, semantic colors, typography, spacing/radius, buttons/forms và các trạng thái loading, empty, error, denied. Dùng chung nhận diện và quy ước tương tác; giữ mật độ, điều hướng và giọng văn theo nhu cầu Admin, Teacher và Learner. Dữ liệu demo đã nghiệm thu dùng để chốt layout populated, kết hợp fixtures cho empty/error. P0 chỉ được chỉnh UI tối thiểu để sửa hành vi thuộc lane.

## 7. Deferred

- Learner Assessment runtime gồm attempt, scoring, placement, recommended level và level progression. Spec riêng cần giải quyết ADR-043 và vòng publish version trước khi tích hợp runtime.
- Undo/Redo trong Lesson Studio.
- Phím tắt bổ sung cho WRITING.
- Interactive landing sandbox.
- UI polish không thiết yếu, gồm icon trang rỗng, search diện rộng và redesign các bảng.

## 8. Parallelization matrix

| Lane | File ownership dự kiến | Phạm vi phối hợp |
|---|---|---|
| **P0-A** | `lingora-web/src/app/home/**`, `lingora-web/src/app/api/learner/home/**`, phần Home/path trong `lingora-web/src/server/context/**` và test Home liên quan. | Giữ hợp đồng wizard và auth. Nếu một test dùng chung có cả Home và login, chỉ sửa case Home hoặc thống nhất một owner cho file. |
| **P0-B** | `lingora-web/src/app/register/**`, `lingora-web/src/app/login/**`, `lingora-web/src/app/auth/confirm/**`, `lingora-web/src/app/api/auth/**`, `lingora-web/src/server/auth/**` và test/harness auth liên quan. | Kiểm tra downstream onboarding/Home bằng hành vi hiện có. Chuyển lỗi Home sang P0-A và ghi dependency nếu chạm auth boundary dùng chung. |
| **P0-C** | `lingora-admin/src/components/LanguageFormModal.tsx`, phần recovery ngôn ngữ trong `LanguagesCatalog.tsx` nếu có lỗi sản phẩm, `lingora-admin/tests/feature/e2e-browser.mjs` và test/harness recovery ngôn ngữ liên quan. | Giới hạn thay đổi vào Language draft recovery. Dùng port và dữ liệu test riêng khi chạy song song. |
| **P1** | `lingora-admin/src/server/curriculum/demo-a1.ts`, `scripts/seed-demo-course.mjs`, `tests/feature/demo-course-verification.test.mjs` và fixture/test chỉ phục vụ demo nếu cần. | Dùng service/API hiện có. Hai manifest local là thay đổi dùng chung, để chủ điều phối review riêng nếu cần wiring lệnh. |

Các lane có thể chạy song song trên branch/worktree tách riêng. Nếu thực sự cần sửa file của lane khác, ghi file, lý do, dependency và thống nhất một người sửa trước khi thay đổi. Dùng bản build, generated Prisma client, port và database riêng; nếu phải dùng chung output build thì chạy tuần tự. Handoff ghi SHA gốc, files changed, lệnh/kết quả, môi trường và blocker còn mở.

## 9. Merge order

1. P0-C hoặc P0 fix đã cô lập, ưu tiên khôi phục Admin E2E sớm.
2. P0-A.
3. P0-B.
4. Demo fixture P1 đã qua các gate của mục 5.
5. Chạy baseline full suite trên SHA tích hợp. Ghi gate local và evidence public theo từng P0.
6. Bắt đầu Design phase sau khi baseline tích hợp đạt DoD và các P0 đạt tiêu chí nghiệm thu.

Thứ tự merge không hạn chế việc kiểm tra hoặc chuẩn bị song song. Có thể đổi nếu dependency thực tế yêu cầu, ví dụ Home hỏng do auth chung và cần P0-B trước. Chủ điều phối ghi lane phụ thuộc, file/contract bị ảnh hưởng, lý do và thứ tự mới trước khi merge.

## 10. Global Definition of Done

- `npm run typecheck`, `npm run build -w lingora-admin` và `npm run build -w lingora-web` PASS. Trên checkout mới, chạy `npm run db:product:generate` trước typecheck.
- Feature tests và integration/E2E bị ảnh hưởng PASS. Ở bước tích hợp chạy `npm run test:all`, `npm run test:feature -w @lingora/lesson-content` và các suite riêng của Home, onboarding, Studio, SRS, Writing, joined E2E và demo. `test:all` chưa bao phủ toàn bộ các suite tích hợp đó.
- Các điều kiện riêng của từng lane có bằng chứng đúng SHA và môi trường. Ghi riêng PASS local, public acceptance và rollout.
- Diff đúng ownership, không có refactor ngoài scope hoặc migration khi chưa có spec riêng. Không đưa secrets, verifier, token, session hoặc URL callback nguyên bản vào Git/log bàn giao.
- Cập nhật tài liệu trạng thái sau khi hành vi tương ứng đã được nghiệm thu. Báo cáo cuối ghi chính xác từng file thay đổi, lệnh/kết quả, SHA đã kiểm tra và mọi gate chưa đạt.

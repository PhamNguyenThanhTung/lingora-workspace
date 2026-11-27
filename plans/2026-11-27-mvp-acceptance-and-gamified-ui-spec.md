# Lingora — Spec hoàn tất nghiệm thu MVP và UI game hoá — V1

Ngày: **27/11/2026, Asia/Ho_Chi_Minh**

Trạng thái: **DRAFT — đặc tả để review; chưa phải biên bản nghiệm thu hoặc lệnh triển khai production.**

Hành trình: **GV soạn → Admin duyệt/trả bài → xuất bản → học viên học → luyện tập → kết quả → ôn lại.**

## 1. Mục tiêu và cách dùng spec

Hoàn tất những phần còn thiếu sau MVP: tích hợp các bản sửa đã có, sửa lỗi còn mở, hoàn thiện giao diện học viên vui và game hoá, rồi nghiệm thu trên đúng phiên bản tích hợp. Không làm lại MVP và không dùng đợt đánh bóng để tự mở rộng tính năng.

Tài liệu này là **một spec tổng** theo yêu cầu chủ dự án. Mỗi nhóm có mã ổn định, phạm vi, đầu vào, tiêu chí nghiệm thu và bằng chứng cần giao. Bảng mô-đun và thứ tự bên dưới nằm trong cùng tài liệu để có thể review toàn bộ trước khi triển khai; không tạo thêm bộ spec/plan trùng lặp.

Các mức phạm vi:

| Mức | Ý nghĩa |
|---|---|
| **A — hoàn tất đợt MVP** | Công việc đã được yêu cầu: review/tích hợp bản sửa, ổn định test, UI game hoá, sửa lỗi và bù nghiệm thu còn thiếu trong phạm vi hiện có. |
| **B — đề xuất, cần chốt trước khi triển khai** | G5/G7/G13 và bản sửa hiển thị tối thiểu G6; đặc tả dưới đây để chủ dự án có thể quyết định cụ thể. Không suy diễn rằng đề xuất trước đã được đồng ý. |
| **C — gói mở rộng có điều kiện** | Trường kana/furigana, quản lý danh mục ký tự và rollout Writing SRS. Chỉ thực hiện khi phạm vi tương ứng được chốt. |
| **D — để lại theo quyết định** | SMTP, đổi mật khẩu và tính năng mới ngoài MVP. Không chặn nghiệm thu các phần độc lập đã hoàn thành. |

**Quy tắc đóng việc:** `CODED`, `LOCAL_PASS`, `MERGED`, `PUBLIC_PASS`, `ROLLED_OUT` là các trạng thái khác nhau. Check CI xanh không thay cho nghiệm thu giao diện hoặc production. Phần chưa chạy phải ghi `NOT_RUN`; thiếu môi trường ghi `BLOCKED` kèm điều kiện cụ thể, không ghi PASS.

## 2. Nguồn sự thật và baseline đã kiểm tra

### 2.1. Thứ tự ưu tiên

1. Chỉ thị và quyết định mới nhất của chủ dự án trong chat.
2. Code thực tế của SHA triển khai, schema/migration hiện hành và bằng chứng thực thi cùng phiên bản đó.
3. Spec này sau khi được chốt, các hợp đồng sản phẩm hiện hành không bị thay thế.
4. PR/diff và báo cáo bàn giao của từng nhánh.
5. Tài liệu lịch sử; trạng thái cũ phải đối chiếu lại, không dùng để ghi đè bằng chứng mới.

Giữ các ranh giới nghiệp vụ trong [DESIGN](../DESIGN.md), [decision log](../logs/decision-log.md), [API contract](../docs/03-api-contract.md) và các spec đã được nghiệm thu. Riêng ngày đến hạn thẻ mới dùng hành vi đã merge ở #20, không chép lại quy tắc +1 ngày từ tài liệu cũ.

Tài liệu liên quan:

- [Kế hoạch UI game hoá cũ](2026-11-22-gamified-learner-ui.md): tham khảo mục tiêu, không coi mọi phase còn chưa làm; #5/#6/#7 đã giao một phần tương ứng.
- [Release stabilization](2026-11-18-release-stabilization.md): tham khảo cách phân biệt local/public/rollout, đối chiếu trạng thái mới.
- [Kế hoạch hành trình nghiệm thu](2026-11-26-teacher-learner-journey-acceptance.md): có trong workspace, chưa commit tại thời điểm lập spec.
- [Báo cáo vòng 2, PR #21](https://github.com/PhamNguyenThanhTung/lingora-workspace/pull/21).
- [Báo cáo vòng 3, PR #18](https://github.com/PhamNguyenThanhTung/lingora-workspace/pull/18).
- [Spec xác nhận email qua thiết bị khác](2026-11-21-slice-12-cross-device-confirmation.md).
- [Sprint 6 delivery](2026-11-15-sprint-6-delivery.md).

### 2.2. Snapshot Git/GitHub ngày lập spec

Remote thực tế: `https://github.com/PhamNguyenThanhTung/lingora-workspace.git`.

`main` trên GitHub và `origin/main` local cùng SHA: `9dccaa83fed7cb9c5f86f0e07db5c76d19d43dfd`.

| Phần | Baseline xác minh | Điều chưa được chứng minh |
|---|---|---|
| Slice 1–11, Core Learner MVP | Đã được nghiệm thu theo hồ sơ dự án | Không tự tuyên bố mọi đường đi đều được chạy lại trên SHA mới |
| Sprint 3–5 | Đã nghiệm thu local | Phải kiểm lại những phần bị đợt tích hợp tác động |
| Chấm dung thứ | #19 **MERGED** | Chưa có bằng chứng mới được đối chiếu về nghiệm thu lại production |
| SRS theo ngôn ngữ, thẻ mới đến hạn ngay, Ôn nhanh | #20 **MERGED** | Tương tự; không đồng nghĩa SRS qua nhiều ngày đã được thử |
| Báo cáo vòng 2 | Commit `7ace3a1`; #21 **OPEN**, chỉ tài liệu | Chưa merge; mô tả “chưa commit” trong chat cũ đã hết hiệu lực |
| Bản sửa học viên | Commit `5284d96`; #22 **OPEN** | Cần independent review, tích hợp và nghiệm thu |
| Bản sửa GV/Admin | Commit `ca79cc4`; #23 **OPEN** | H7 mới xử lý một phần; Character Studio browser test chưa chạy trong bàn giao |
| Timezone và race Admin | `681d9ff`, `e058278` ở `lingora-test-fix` | Chưa nằm trong baseline main trên; chưa có PR; **nhánh chưa push** (upstream đang trỏ `origin/main`) |
| Bản sửa timezone cũ | `1667bb7` ở `lingora-practice-timezone` | Là cách nới assertion; không áp song song máy móc với bản sửa timezone mới; chỉ có ở local |
| UI học viên | `4ddca73` → `2e54858` (27/11 08:48) ở `lingora-ui`, dựa trên `5284d96` | Thay đổi trước đây chưa commit nay đã commit trong `2e54858`: CSS, CatalogueView, PracticeSection **và `OnboardingWizardView.tsx`**. Nhánh **chưa push** (không có upstream). Nhánh đang có người sửa: xác nhận owner trước khi giao việc |
| D1, D2–D5, D6–D7 | #11/#12/#13 đã merge | Không lập lại công việc “commit các file D1/D2” từ bản tóm tắt cũ |
| Xác nhận email | #1 đã merge nhánh `token_hash` | Slice 12 public acceptance vẫn chưa được đóng bằng bằng chứng mới |
| Writing SRS | Có implementation và feature flag | Chưa xác minh public acceptance/rollout |
| Onboarding daily goal accessibility | #8 **OPEN** | Cùng sửa `OnboardingWizardView.tsx` với `2e54858`; nhánh UI chưa có `radiogroup`/`input type="radio"` của #8 → conflict chắc chắn khi tích hợp |

`lingora-workspace` đang ở nhánh cũ `fix/review-comment-and-wrong-answer-hints`, không phải checkout main mới nhất. Trước khi thêm spec này có **76 mục Git chưa commit**, trong đó **70 mục là ảnh**; các mục thư mục có thể chứa nhiều file. Hai file tracked đang sửa là báo cáo findings vòng 1 và kế hoạch gems. Không stage, reset hoặc chuyển các thay đổi đó cùng công việc không liên quan.

Snapshot đã đối chiếu lại ngày 27/11/2026 sau commit `2e54858`. Snapshot này chỉ là mốc lập spec. Khi bắt đầu triển khai phải cập nhật SHA/PR và danh sách file đang sửa; không dùng số lượng file hiện tại như một hằng số.

## 3. Quyết định, giả định và giới hạn

### 3.1. Đã được chủ dự án chốt

- UI học viên theo hướng **vui, game hoá**, có tiến độ và cảm giác hoàn thành rõ.
- Bài tùy chọn **luôn mở trong phạm vi trình độ/ngữ cảnh hợp lệ**, không phải phần thưởng sau mọi bài bắt buộc.
- #19/#20 đã được yêu cầu merge và thực tế đã merge; phần còn lại là xác minh deploy và nghiệm thu lại.
- Giữ dữ liệu thử production: bài GV soạn, từ `large`, GV Test và dữ liệu học thử hiện có. Không tự ẩn/xóa các mục này.
- Không cấu hình SMTP và không đổi mật khẩu admin trong đợt này.
- Hoàn tất nhóm P2/P3, test flaky/timezone và phần còn thiếu của nghiệm thu.
- **Chốt ngày 27/11/2026 (trả lời §20):**
  - Q1: nhận G5 (bỏ dấu cách khi ghép chữ Nhật/Trung), G7 (gắn `lang` cho vùng ngoại ngữ), G13 và G6 format tối thiểu.
  - G13: trình độ hiển thị theo khung của khóa học, **tiếng Nhật dùng N5–N1, không dùng A1/B1**; tiếng Anh/Pháp dùng mã trình độ của khung tương ứng. Lấy mã từ level/framework Admin đã tạo, không hard-code.
  - Q2: **tên bài/chương do Admin đặt**. Hiển thị đúng tên Admin đặt; chỉ thêm số hệ thống khi tên chưa có tiền tố số (đúng hành vi `numberedTitle` ở #22). Không strip hay đổi số trong tên Admin đặt.
  - Q3: mục tiêu H7 lấy theo đề xuất (lưu/nộp thường ≤ 2 giây, chậm nhất phần lớn lượt ≤ 5 giây).
  - Q4: để sau (gói C).
  - Q5: chủ dự án đã tự đăng ký bằng email thật trên production và thành công. **Cập nhật 27/11/2026: chủ dự án quyết bỏ qua bước điền evidence (ngày, ảnh) cho Slice 12.** Ghi Slice 12 là `OWNER_REPORTED (evidence skipped by owner)`; không cần thêm lượt thử của agent.
  - Q6: theo đề xuất (lập inventory, chủ dự án duyệt rồi mới xóa).
  - Q7: cách (a) — merge #22 trước, rebase nhánh UI lên main.
  - Q8: `lingora-ui` do một agent Sonnet khác đang làm; agent đó là owner L2.
- Không tự gọi Anti, Sonnet, Sol hay agent khác khi chưa có lệnh. Ba luồng Sonnet được nhắc trong bàn giao là lịch sử công việc. Khi chủ dự án yêu cầu chạy song song, chia agent theo đúng các luồng ở §4.1, không tạo thêm luồng ngoài bảng đó.

### 3.2. Giả định dùng để soạn spec

- Giữ kiến trúc monorepo, Next.js/React, Prisma và Supabase hiện có; không nâng version framework để đánh bóng.
- Sửa UI dùng API/DTO hiện hành trước. Chỉ bổ sung metadata tối thiểu khi cần hiển thị đúng ngôn ngữ; mọi thay đổi hợp đồng phải có kiểm tra tương thích.
- Tái sử dụng các helper/service/component đang có; không tạo engine gamification, hệ thống theme hoặc workflow mới.
- Nội dung đã xuất bản là revision bất biến. Sửa nội dung qua successor draft → duyệt → xuất bản, không UPDATE trực tiếp lịch sử học/chấm điểm.
- Sửa một lỗi không mở lại toàn bộ hồ sơ nghiệm thu Slice 1–11. Chạy hồi quy theo phần bị tác động và một lượt hành trình tích hợp.
- Mục tiêu hiệu năng và quy tắc đánh số cụ thể dưới đây là **đề xuất trong bản DRAFT**, chưa được mô tả như quyết định lịch sử của chủ dự án.

### 3.3. Ngoài phạm vi đợt A

Không thêm tim/năng lượng, cửa hàng tiêu gems, streak freeze, leaderboard, TTS, bài thi xếp trình độ thật, learner assessment runner, upload audio hay bộ nội dung Pháp/Nhật nhiều trình độ. Có thể ghi backlog, không tự triển khai để đóng một ghi nhận UI.

## 4. Bản đồ phạm vi và phụ thuộc

| Module ID | Trách nhiệm | Phụ thuộc |
|---|---|---|
| `integration` | Đối chiếu PR, SHA, ownership và xử lý tích hợp | — |
| `test-stability` | Timezone, draft readiness, focus và test flaky | integration |
| `learner-correctness` | Gating, thứ tự, đánh số, hoàn thành, kết quả, bộ đếm | integration |
| `staff-correctness` | Authoring, review, khóa học và thời gian lưu/nộp | integration |
| `content-quality` | H12 và đối chiếu nội dung/audio thật | integration |
| `language-presentation` | Helper dùng chung G5/G7/G6 tối thiểu trong `packages/lesson-content` | integration (helper làm song song được); gắn vào consumer chờ learner-correctness và staff-correctness |
| `gamified-ui` | Giao diện học viên, gồm đề xuất G13. **Cùng file với learner-correctness → cùng một luồng, làm tuần tự** | learner-correctness, language-presentation nếu được nhận |
| `character-authoring` | G8 và G6 có trường mới; gói C | staff-correctness, language-presentation |
| `acceptance` | Hành trình tích hợp, public verification và hồ sơ | Các module thực sự được chọn trong release |
| `workspace-hygiene` | Đối chiếu ảnh/script, lưu bằng chứng, đề xuất dọn worktree | acceptance |

G9 (phát thử audio), G10 và G16 thuộc `staff-correctness` vì sửa `LessonDraftEditor.tsx`/`ReviewDetailView.tsx`; riêng phần G10 trên màn kết quả học viên thuộc luồng học viên + UI.

Thứ tự: chốt baseline/ownership → hoàn tất các bản sửa đã có và test → nội dung/hiển thị ngôn ngữ được chọn → hoàn thiện UI → nghiệm thu tích hợp → nghiệm thu public trong phạm vi được phép → đóng hồ sơ. Module có điều kiện không ép release A phải chờ nếu đã được ghi rõ là deferred.

### 4.1. Luồng làm song song

Chỉ áp dụng khi chủ dự án yêu cầu chạy song song. Mỗi luồng một agent, một worktree/nhánh riêng; không hai agent cùng sửa một file.

| Luồng | Mã yêu cầu | Worktree/nhánh | File sở hữu | Chạy song song từ |
|---|---|---|---|---|
| L1 — Test | TST-01/02/03, review #21 | `lingora-test-fix` / `fix/test-flaky-timezone` | `lingora-web/src/server/context/timezone.ts`, `lingora-admin/src/components/focusRestore.ts`, các `*Catalog.tsx`, `TeacherHoldingView.tsx`, `isolated-components.test.mjs` | M1 |
| L2 — Học viên + UI | LEA-01..05, UI-00..05, G10 phía kết quả, gộp #8 | `lingora-ui` / `feat/learner-ui-gamified` (nhánh đang có người sửa; nối tiếp, không mở agent thứ hai) | `lingora-web/src/app/**`, `globals.css`, `server/context/home-dto.ts`, `server/context/path-service.ts`, `server/gamification/service.ts`, `server/lessons/{dto,service}.ts`, `src/shared/*` | M1 |
| L3 — Staff | ADM-01..04, LNG-04 (G9 editor/review), LNG-05 | `lingora-admin-fix` / `fix/admin-authoring-labels` | `lingora-admin/src/components/{LessonDraftEditor,ReviewDetailView,CourseFormModal}.tsx`, `lingora-admin/src/server/{lessons,courses}/*` | M1 |
| L4 — Chỉ đọc | CNT-01 (đối chiếu source/revision/audio), DOC-01/02/03, chuẩn bị ACC-01 | không sửa code | báo cáo Markdown trong `docs/acceptance/` | M1 |
| L5 — Ngôn ngữ (chỉ khi chốt Q1) | Helper LNG-01/02/03 | nhánh mới từ `main` | `packages/lesson-content/src/*` + test của package | M1; consumer wiring giao cho L2/L3 sau khi helper merge |

Không chạy song song: tích hợp cuối, ACC-02..05 và đóng hồ sơ (M4–M6) do một luồng duy nhất làm trên SHA tích hợp. Gói C (EXT-01/02/03) không mở luồng khi chưa chốt Q4. Trước khi giao việc, push các nhánh chỉ có ở local (`lingora-ui`, `lingora-test-fix`) để không mất commit.

## 5. INT — Tích hợp và bảo toàn công việc đang làm

### INT-01 — Lập baseline tích hợp

- Đối chiếu GitHub main, PR #21/#22/#23/#8, nhánh test và nhánh UI trước khi sửa.
- Làm integration trong checkout/worktree sạch phù hợp. Không checkout main đè lên workspace đang có 76 mục thay đổi.
- Ghi SHA đầu vào, commit được lấy và phần chưa lấy vào báo cáo nghiệm thu mới.
- Không merge/cherry-pick trùng `5284d96`: nhánh UI đã có commit này trong ancestry.
- Review diff của #8 với UI mới; lấy đúng phần accessibility còn thiếu hoặc giải thích vì sao đã được bao phủ. Không đóng PR chỉ vì có thiết kế mới. Lưu ý: `2e54858` đã sửa `OnboardingWizardView.tsx` nhưng chưa có `radiogroup`/radio của #8, nên conflict là chắc chắn; L2 giải conflict và giữ test `onboarding-components.test.mjs` của #8.
- Chốt cách đưa #22 vào main: **merge #22 trước, rebase nhánh UI lên main** (đề xuất), hoặc đóng #22 và gộp vào PR UI với lý do ghi trong PR. Không để cả hai cùng mở rồi merge lặp.

**AC:** có một cây code tích hợp chứa các sửa được chọn đúng một lần, truy được nguồn commit; mọi thay đổi chưa commit ban đầu vẫn còn nguyên.

### INT-02 — Ownership và xử lý file giao nhau

| Nhóm | File/ranh giới chính | Quy tắc |
|---|---|---|
| Học viên + UI | `HomeView.tsx`, `CatalogueView.tsx`, `LessonPlayerView.tsx`, `PracticeSection.tsx`, `OnboardingWizardView.tsx`, `globals.css`, `server/context/home-dto.ts`, `server/context/path-service.ts`, `server/gamification/service.ts`, `server/lessons/dto.ts`, `server/lessons/service.ts`, `src/shared/lesson-title.ts` | Một bên sở hữu sửa tại một thời điểm; tiếp tục trên commit bàn giao, không mở thêm bản viết lại song song |
| SRS/ngôn ngữ | `ReviewView.tsx`, `WarmUpStep.tsx`, `packages/lesson-content/src/*` | Chốt props/metadata trước; component chung được kiểm ở cả hai app |
| Staff | `LessonDraftEditor.tsx`, `ReviewDetailView.tsx`, `CourseFormModal.tsx`, server lessons/courses; cả G9 player và G16 cảnh báo từ trùng | UI learner không sửa luồng staff gián tiếp qua thay đổi schema chung thiếu kiểm tra |
| Test | `timezone.ts`, `focusRestore.ts`, các `*Catalog.tsx`, `TeacherHoldingView.tsx`, harness, focus/draft lifecycle | Không sửa cùng expectation theo hai cách đối nghịch; giữ assertion nghiệp vụ có ý nghĩa |

**AC:** sau giải conflict, kiểm bằng hành vi: bài tùy chọn mở, trạng thái completed, sai lần đầu/làm lại, draft recovery và focus còn đúng. Không chỉ dùng `git diff --check` để kết luận merge thành công.

### INT-03 — PR và bàn giao

PR chỉ tài liệu được tách khỏi PR code. Nhánh test được review và đưa vào main trước hoặc cùng baseline chạy gate cuối. Nhánh UI tích hợp cả #22 và #23 đã được chọn; phần thay đổi shared package phải có consumer tests.

Mỗi PR ghi: mã yêu cầu trong spec, hành vi trước/sau, SHA nền, kiểm tra đã chạy, kiểm tra chưa chạy, rủi ro thật và ảnh nếu đổi UI. Không tự push/merge/deploy chỉ vì spec đã được tạo.

## 6. LEA — Hoàn tất bản sửa học viên, PR #22

### LEA-01 — Bài tùy chọn và thứ tự curriculum — H1

- Trong context/course đang hoạt động và trình độ đang được phép học, bài `isRequired=false` đã AVAILABLE và có active published revision mở được ngay, kể cả khi bài bắt buộc trước nó chưa xong.
- Bài tùy chọn đứng theo **trình độ → chương → vị trí bài**, không bị gom xuống cuối mọi bài bắt buộc.
- Không làm bài tùy chọn vẫn mở được bài bắt buộc kế tiếp khi đã thỏa điều kiện bắt buộc hiện hành.
- Bộ đếm hoàn thành chương dùng bài bắt buộc; số tùy chọn hiển thị riêng, thí dụ `2/3 bài bắt buộc · +1 tùy chọn`.
- Giữ kiểm tra quyền sở hữu context, course active, trình độ, availability và revision ở server. “Luôn mở” không cho phép truy cập draft, khóa học khác hoặc trình độ tương lai chưa hợp lệ.

**AC:** UI và truy cập URL trực tiếp đồng nhất; có ca optional xen giữa required, optional cuối chương, future level, unpublished, context người khác và course inactive. Không cấp XP/progress khi chỉ mở bài.

### LEA-02 — Đánh số và breadcrumb — H2/G15

Mục tiêu: cùng một bài/chương có cùng tên hiển thị trên Home, Catalogue, breadcrumb và lesson player; không có `Bài 4: Bài 4:` hoặc `Chương 1: Chương 1:`.

**Quy tắc đã chốt (Q2):** tên bài/chương do Admin đặt và được hiển thị nguyên văn. Nếu tên chưa có tiền tố số thì thêm số hệ thống theo `lesson.position`/`unit.position`; nếu đã có thì giữ nguyên, không thêm lần nữa. Không đổi title/revision đã lưu. Xử lý locale/fallback đang dùng.

`numberedTitle` ở #22 đã theo đúng quy tắc này. Việc còn lại là bảo đảm Home, Catalogue và breadcrumb cùng gọi một helper, không bề mặt nào tự thêm tiền tố riêng.

Regex tiền tố hiện tại (`NUMBER_PREFIX` trong `lingora-web/src/shared/lesson-title.ts`) chỉ nhận `bài/chương/phần/lesson/unit/chapter/part`; tiêu đề như `Leçon 1:`, `Chapitre 2 -`, `第1課`, `第2章` hiện sẽ bị thêm số lần nữa. Cần bổ sung hoặc ghi rõ là giới hạn.

**AC:** cùng fixture được render ở ba bề mặt cho cùng kết quả; có tiêu đề trống, không tiền tố, tiền tố Việt/Anh, dấu `:`/`-`, số không khớp và tiếng Nhật/Pháp (`Leçon 1:`, `第1課`). Không strip chữ số có ý nghĩa trong nội dung tên.

### LEA-03 — Kết quả dễ hiểu, giữ đúng cách chấm — H10

- Chỉ có **một điểm tổng chính**, thí dụ `Điểm: 63%`, lấy từ score server theo hợp đồng N/K và 2/1/0 hiện hành. Không đổi công thức để làm UI đẹp hơn.
- Không đặt `5/8` như thể có 8 câu hỏi nếu đó là contribution units/lượt trả lời. Nếu cần giải thích, ghi bằng ngôn ngữ người học về điểm khi làm lại.
- Nếu hiển thị tỷ lệ đúng lần đầu, phải là chỉ số phụ ghi rõ `Đúng lần đầu`, tránh hai phần trăm cùng được gọi là điểm. Có thể bỏ khỏi phần headline.
- Chi tiết hiện lịch sử có thứ tự: `Lần đầu: Sai — …` → `Làm lại: Đúng — …`, cùng đáp án đúng và giải thích khi được phép xem.
- Giữ feedback ngay khi sai và accent hint của #19; không tiết lộ secret của câu chưa trả lời.

**AC:** fixture 63% điểm và 67% đúng lần đầu được giải thích không mâu thuẫn; đúng ngay, sai rồi đúng, sai cả hai, reload, replay và attempt stale đều hiển thị đúng. Không cộng lại reward khi mở kết quả.

### LEA-04 — Hoàn thành và bộ đếm — H11/H13

- Completion hợp lệ được ưu tiên hiển thị `Đã hoàn thành`; trạng thái đọc vẫn là dữ liệu riêng, không giả ghi reading-complete để đổi nhãn.
- Daily lesson count đếm bài phân biệt theo quy tắc timezone hiện hành, không đếm thêm lượt “Luyện tập lại” hoặc finalize replay.
- Không đổi số liệu lịch sử hoặc phát reward hồi tố để khớp giao diện.

**AC:** lần đầu hoàn thành tăng đúng một; redo cùng ngày/replay không tăng; bài khác tăng; có kiểm tra sát ranh giới ngày và context khác. Tiêu chí completion khi đổi published revision giữ theo hợp đồng hiện có và được regression test.

### LEA-05 — Làm lại câu sai

Xáo lại vị trí đáp án/token khi bắt đầu lượt làm lại theo cơ chế shuffle hiện có. Giá trị/ID đúng không thay đổi; reload cùng trạng thái lượt đang làm không tự làm mất đáp án đã chọn. Không yêu cầu mọi permutation ngẫu nhiên đều phải khác khi tập rất nhỏ; test tính ổn định và việc chấm theo ID, không theo vị trí hiển thị.

**AC:** trả lời đúng vẫn được chấm đúng sau shuffle; phím tắt, chọn/bỏ token và resume dùng cùng mapping. Không tạo câu trả lời hoặc đổi queue trên server chỉ bởi re-render.

## 7. ADM — GV/Admin, PR #23 và phần còn thiếu

### ADM-01 — Nhãn soạn và revision — H3/H4

- Bỏ badge row version kỹ thuật khỏi sản phẩm; giữ `Bản sửa đổi #N` từ revision nghiệp vụ.
- Giữ row version/optimistic concurrency trong request và server.
- Dòng phụ ghi rõ `Chương: … · Khóa: …`, không làm người dùng tưởng đang soạn một bài khác.
- Editor, trang duyệt và lịch sử dùng cùng ý nghĩa của revision.

**AC:** Save nhiều lần không đưa row version ra UI; stale save vẫn báo conflict, giữ input và cho reload/retry đúng thiết kế.

### ADM-02 — Tìm từ vựng và xác nhận nộp — H5/H8

- Enter và nút Tìm cùng gửi một truy vấn; loading/error/empty được phân biệt.
- Không tìm thấy: `Không tìm thấy từ “…”` và hành động tạo mới điền sẵn nội dung tìm. Không tự tạo record khi bấm tìm.
- Khi đang composing IME, Enter hoàn tất composition không gửi tìm kiếm hoặc submit nhầm.
- Nộp duyệt có xác nhận nêu bài/bản sửa đổi và việc editor sẽ bị khóa; Hủy không gửi request. Confirm đang pending không gửi hai lần.
- Điều kiện save/dirty/summary tuân theo hành vi đã sửa trước đây; không làm tóm tắt thay đổi trở thành dirty-content ngoài ý muốn.

**AC:** test Enter/click, query trống, không có kết quả, lỗi server, IME, hủy nộp, confirm và double click; lỗi giữ dữ liệu để thử lại.

### ADM-03 — Tên người duyệt và ngôn ngữ khóa học — H9/G14

- Hiện display name của reviewer nếu có; fallback `Quản trị viên`/`Giáo viên`, không dùng `Người dùng` hoặc ID thô làm tên chính.
- Không thêm email/PII không cần thiết vào DTO chỉ để đặt nhãn.
- Form tạo/chuyển ngôn ngữ khóa chỉ cho ngôn ngữ `isLearnable`; server kiểm lại đầu vào giả mạo.
- Khóa legacy dùng ngôn ngữ đã bị tắt phải vẫn xem được theo quyền hiện có; không âm thầm đổi ngôn ngữ hoặc xóa khóa.

**AC:** reviewer có/không tên; learner/teacher không đọc được review trái quyền; API từ chối create/switch sang ngôn ngữ không học được. Làm rõ hành vi sửa trường khác trên khóa legacy, không vô tình chặn mọi sửa đổi không liên quan.

### ADM-04 — Đo và giảm thời gian lưu/nộp — H7

Baseline báo cáo là 6–14 giây, chưa xác nhận phần nào thuộc cold start, mạng, pool, query hay transaction. #23 mới batch một nhóm `ItemRevision.updateMany`, chưa đóng H7.

1. Đo Save và Submit riêng với bài 5–6 bài tập và từ vựng đại diện; ghi SHA, môi trường, kích thước payload, cold/warm và thời gian client/API/DB nếu quan sát được.
2. Lấy ít nhất 20 mẫu warm mỗi thao tác trên môi trường nghiệm thu; báo median/p95, ghi mẫu cold riêng. Không tạo 20 bản nộp production để benchmark; dùng fixture disposable/staging.
3. **Mục tiêu đề xuất:** warm median ≤ 2 giây, p95 ≤ 5 giây; không có lỗi transaction/pool. Nếu môi trường có giới hạn khiến mục tiêu chưa đạt, ghi kết quả và nguyên nhân, không sửa ngưỡng xuống để báo PASS.
4. Chỉ tối ưu chỗ có bằng chứng: query lặp, reload dư, batch phù hợp. Giữ thứ tự khóa, atomicity, conflict và pin revision.
5. Pending feedback xuất hiện ngay và chặn thao tác trùng; lỗi giữ draft. Không dùng optimistic success cho thao tác chưa được server xác nhận.

**AC:** có số trước/sau cùng loại fixture; race/stale/rollback tests còn qua. Không tăng timeout đơn thuần hoặc xóa validation để đóng vấn đề.

## 8. TST — Timezone và ổn định test

### TST-01 — Timezone

Review `681d9ff`: xác thực zone bằng Intl nhưng giữ mã hợp lệ người gọi cung cấp sau trim, tránh persisted value tùy Node/ICU trả `Asia/Saigon` hay `Asia/Ho_Chi_Minh`. Giữ fallback cho giá trị không hợp lệ theo hợp đồng hiện có.

**AC:** kiểm zone hợp lệ/alias/zone sai; phép tính ngày đúng ở nửa đêm địa phương, UTC và một zone có DST; completion/gamification không phụ thuộc zone máy CI. Không sửa các bản ghi đã lưu chỉ để đồng nhất tên alias. Không cherry-pick thêm `1667bb7` để che lỗi nếu assertion chặt đã được bản sửa mới đáp ứng.

### TST-02 — Draft readiness và focus

Review `e058278`: test chờ form initialized và draft scan hoàn tất thay vì chỉ modal visible hoặc `domcontentloaded`; focus chỉ trả về đích còn tồn tại, đã gỡ inert và còn hợp lệ sau khi đóng modal.

**AC:** recover/prune đúng identity; draft đang chỉnh không bị mount cleanup xóa; focus về đúng trigger bằng bàn phím; đóng/mở nhanh và unmount không gây focus đến vùng khác, timer/observer không bị rò rỉ. Không dùng sleep cố định để biến race thành “ít gặp”.

### TST-03 — Xác minh CI

- Chạy suite liên quan trên Node 24 theo workflow hiện hành; ghi phiên bản Node/ICU khi điều tra timezone.
- Với lỗi flaky đã tái hiện, chạy ca tập trung 3 lượt sau sửa, sau đó một full gate trên baseline tích hợp. Không lặp vô hạn các suite đã xanh nếu không có thay đổi hoặc nghi ngờ mới.
- Không skip/xóa assertion, tăng timeout hàng loạt hoặc bật retry để che lỗi.
- CI hiện chạy typecheck, feature và component; build, disposable DB và journey gates cần chạy riêng khi phạm vi yêu cầu, không gọi CI xanh là đã chạy chúng.

**AC:** không còn failure đã xác định; báo tách lỗi sản phẩm, lỗi harness và thiếu môi trường. Nếu chưa tái hiện được một lỗi thì ghi điều đó, không suy luận đã sửa xong.

## 9. CNT — Chất lượng nội dung và H12

### CNT-01 — Phân biệt source với dữ liệu production

Trong `origin/main:lingora-admin/src/server/curriculum/demo-a1.ts`, Bài 7 hiện không có LISTENING và verifier đã có guard `Lesson 7 must not have listening exercise`. Vì vậy H12 có thể là dữ liệu/revision đang chạy lệch seed; đây là giả thuyết cần kiểm chứng, không phải nguyên nhân đã kết luận.

- Đọc course/unit/lesson ID, active revision, item revision và audio URL của Bài 7/Bài 8 trên deployment hiện tại bằng luồng/API được phép.
- Nghe clip để xác nhận chủ đề và đối chiếu prompt/options/đáp án/giải thích. URL có tên đúng chưa chứng minh audio đúng.
- Nếu source đã đúng mà dữ liệu cũ sai: dùng GV được phân công tạo successor draft, bỏ/thay mục lạc chủ đề, Admin duyệt/xuất bản. Không chạy lại toàn bộ seed hoặc sửa trực tiếp published item.
- Nếu source cũng sai: sửa fixture/seed nhỏ nhất rồi chạy kiểm tra curriculum; deployment code không tự làm dữ liệu đã xuất bản trở thành đúng.
- Giữ các dữ liệu thử đã được chủ dự án yêu cầu giữ. Sửa H12 không đồng nghĩa xóa Bài 4 hoặc từ `large`.

**AC:** bài “Gọi món” không còn câu hỏi chỉ đường lạc chủ đề trên revision mới; Bài 8 giữ audio/đáp án đúng; published revision cũ, attempt, score và receipt cũ không đổi. Có ghi ID/SHA/revision trước/sau, không có thông tin đăng nhập.

### CNT-02 — Smoke chất lượng chương

Xác nhận D1–D7 đã merge không bị tích hợp làm lùi: câu hỏi dùng kiến thức đã dạy, từ vựng gắn nội dung, đủ lựa chọn, không để đáp án đúng lộ qua thứ tự mặc định. Không tự thêm đề thi cuối chương để đóng mục “nội dung cần cải thiện”.

## 10. LNG — Hiển thị Pháp/Nhật và phát âm

### LNG-01 — Ghép token theo ngôn ngữ — G5, mức B

- Một quy tắc dùng chung cho đáp án học viên, đáp án đúng, wrong-answer feedback, result review và Admin preview/review.
- Lấy language từ course/context/revision được server xác thực, không tin query hoặc payload client để quyết định access hay scoring.
- Tiếng Nhật/Trung: bỏ khoảng cách do renderer thêm tại ranh giới CJK/kana và trước dấu câu đóng; fixture `わたしは` + `田中` + `です` → `わたしは田中です`. Tiếng Anh/Pháp giữ khoảng cách giữa từ; xử lý punctuation theo quy tắc hiển thị hiện có.
- Với token Latin nằm trong câu Nhật, giữ khoảng trắng có ý nghĩa giữa các từ Latin và khoảng trắng bên trong token. Quy tắc cho nội dung trộn phải được thể hiện bằng fixture, không dùng `.join('')` cho mọi ngôn ngữ.
- Không dùng chuẩn hóa chấm điểm để render: không tự bỏ dấu, hạ chữ, biến kana hoặc xóa dấu câu gốc.
- Tái sử dụng `@lingora/lesson-content` nếu helper được cả hai app dùng; không tạo hai bản cùng logic.

**AC:** cùng dữ liệu có cùng kết quả ở learner/admin; có fixture ja/fr/en/zh, punctuation, token lặp, nội dung Latin trộn và thiếu token. Grading vẫn theo token ID/order, không đổi sang chấm chuỗi chỉ vì sửa trình bày.

### LNG-02 — Thuộc tính ngôn ngữ — G7, mức B

- Giữ UI chrome tiếng Việt ở `<html lang="vi">`; gắn `lang` của nội dung lên vùng đoạn đọc, ví dụ, token, đáp án, từ vựng, SRS và preview/review tương ứng.
- `lang` lấy từ metadata ngôn ngữ hiện có và được chuẩn hóa nhất quán; nếu DTO thiếu thì bổ sung tối thiểu có test. Không mặc định mọi CHARACTER là tiếng Nhật khi đó là ngôn ngữ khác.
- Dùng font fallback hỗ trợ CJK; tiếng Nhật ngắt dòng tự nhiên; chuỗi Latin/URL dài có fallback không làm tràn viewport.
- Nội dung trộn giữ label/control tiếng Việt đúng ngôn ngữ; không gắn `lang="ja"` lên cả trang giao diện tiếng Việt.

**AC:** kiểm DOM của ja/fr/en trên learner/staff/shared renderer; manual screen-reader smoke nếu môi trường hỗ trợ; có ảnh đoạn Nhật dài ở mobile. Ghi rõ nếu chưa kiểm screen reader thật. Không coi `lang` là đã triển khai TTS.

### LNG-03 — Cách đọc/phiên âm tối thiểu — G6/H6, mức B

Phạm vi nhỏ **không cần trường DB mới**: tận dụng `phonetic` hiện có, thống nhất format ở editor, preview, lesson, WarmUp và SRS. Với en/fr dạng IPA, chỉ bọc đúng một cặp `/…/`; với ja/zh đọc giá trị hiện có như văn bản cách đọc, không tự bọc IPA. Không strip hoặc đoán lại dấu gạch nằm bên trong dữ liệu cách đọc cũ.

**AC:** `/ˈkɒfi/` và `ˈkɒfi` cùng hiện một kiểu; `konnichiwa`/`がくせい / gakusei` không bị bọc IPA; giá trị null rỗng không tạo `//`. Không đổi snapshot lịch sử và không gọi phiên bản này là hỗ trợ furigana đầy đủ.

Trường kana/furigana/romanization riêng thuộc §12, không lẫn vào bản sửa trình bày này.

### LNG-04 — GRAMMAR và phát thử audio — G10/G9, mức A

- Result GRAMMAR ưu tiên câu hỏi `prompt`; `sourceSentence` là ngữ cảnh phụ, không thay câu hỏi. Dữ liệu legacy thiếu prompt vẫn có fallback có ý nghĩa.
- Editor và Admin review có player `<audio controls preload="none">` dùng URL HTTPS đã qua validator hiện hành, kèm loading/error/retry phù hợp. Giữ URL để GV sửa khi cần, không in URL dài như phần nội dung chính.
- Không tự phát, không để media treo khóa Save/Submit và không dùng `networkidle` làm readiness của test có media ngoài.
- Không thêm endpoint proxy audio, tải file trên server hoặc upload storage trong gói này; không mở bề mặt SSRF mới.

**AC:** câu hỏi GRAMMAR đầy đủ trên kết quả; audio hợp lệ nghe được; URL lỗi/chậm/không được trình duyệt hỗ trợ có feedback và các thao tác khác vẫn dùng được. Dùng media fixture xác định trong test; thử URL thật riêng.

### LNG-05 — Cảnh báo từ vựng có thể trùng — G16, mức A có giới hạn

- Tìm ứng viên trong **cùng ngôn ngữ**, dùng normalized lookup hiện có; nếu thiếu thì bổ sung phép chuẩn hóa ứng viên nhỏ, có test cho NFC/khoảng trắng/nháy cong và kiểu chữ phù hợp.
- Hiện ứng viên cùng nghĩa/cách viết để GV chọn tái sử dụng; cho phép xác nhận tạo nghĩa khác theo `senseKey` hiện hành.
- Khác dấu phụ chỉ là gợi ý ứng viên khi thích hợp, không tự coi hai từ là cùng identity. Không tự hợp nhất hiragana/katakana, kana/kanji, các nghĩa khác nhau hoặc vocabulary khác ngôn ngữ.
- Không bulk rewrite `normalizedForm`, không merge concepts/SRS cards và không đổi UNIQUE/FK trong đợt này.

**AC:** cùng từ với nháy cong/thẳng gợi ý tái sử dụng; khác ngôn ngữ không trộn; từ đồng hình khác nghĩa vẫn tạo được theo luật; concurrent create giữ constraint và lỗi dễ hiểu. Không thay logic chấm dung thứ của #19 bằng logic identity.

## 11. UI — Giao diện học viên vui, game hoá

### UI-00 — Phạm vi và nền thiết kế

Tiếp tục `lingora-ui`, không làm lại từ main cũ và không cạnh tranh với người đang sửa file. Lấy code #22 làm nền; review phần đã có trước khi thêm. Hướng hình ảnh: indigo/blue hiện hữu, màu nền sáng có chiều sâu vừa phải, node lộ trình và card rõ trạng thái, typography dễ đọc, phản hồi ngắn và có nhịp hoàn thành.

Không đóng việc bằng đổi màu toàn trang. Bản giao phải cho thấy thứ bậc thông tin, CTA chính, tiến độ, trạng thái và phản hồi khác nhau rõ ràng. Reuse token CSS đang có, không phát sinh thêm các biến cùng nghĩa. Không bắt buộc mascot/minh họa mới; nếu có phải là tài sản được phép sử dụng và không chặn release.

### UI-01 — Home và chuyển lộ trình — G13 là mức B

- Vùng trên cùng cho biết ngôn ngữ/trình độ đang học, một CTA tiếp tục rõ, streak/XP/mục tiêu vừa đủ đọc.
- Lộ trình theo chương; node phân biệt completed/current/locked/optional bằng cả hình/nhãn, không chỉ màu. Bài tùy chọn không giả hiển thị là locked để đẹp bản đồ.
- Mỗi node có tên đọc được, trạng thái và thao tác Học/Ôn lại hợp lệ; dùng bàn phím được. Không bắt người dùng phải hiểu một icon không có label.
- Quests có tiến độ thật từ API, done state và phần thưởng hiện có; lịch streak giữ ngày theo timezone người học. Không tạo progress giả trong CSS.
- Hết bài hiện có: chúc mừng đúng mức và gợi ý ôn từ/chọn lộ trình khác; không nói đã thành thạo ngôn ngữ.
- Empty/loading/error/paused/course inactive có nội dung và hành động rõ, không render bản đồ giả có dữ liệu demo.
- **G13 (đã chốt):** bộ chuyển ngôn ngữ/lộ trình ở gần tên lộ trình, có tên ngôn ngữ và mã trình độ theo khung của khóa (ví dụ `Tiếng Nhật · N5`, `Tiếng Pháp · A1`); không chỉ hiển thị tên khóa khó nhận diện. URL `contextId` hợp lệ được ưu tiên; onboarding thành công chuyển về context vừa tạo. Nếu không có selection hợp lệ, dùng fallback hiện hành có thông báo rõ; không bắt buộc thêm persistence vào DB.
- Chuyển context giữ cách ly progress, warm-up và link SRS; không tự pause/reset context khác. Giới hạn hai ACTIVE contexts giữ nguyên.

**AC:** fixture một/hai context, vừa thêm Nhật sau Pháp, URL context khác chủ, paused, complete, optional và không có curriculum. G13 không bị gắn nhãn “chưa có selector”: hiện đã có `<select>`, việc cần sửa là độ rõ và lựa chọn mặc định.

### UI-02 — Catalogue và bài học

- Catalogue có header chương, số bài hoàn thành và nhóm trạng thái dễ quét; text không bị cắt mất tên quan trọng ở 375px.
- Lesson reader chia khối đọc được, dòng chữ có bề rộng hợp lý trên desktop; vocabulary và bài tập không thành một trang dài khó định hướng.
- “Đọc nội dung”, “Luyện tập”, “Ôn nhanh” có vai trò rõ; không để preview đáp án xuất hiện trước khi học viên làm câu được chấm.
- Điều hướng quay lại giữ context/lộ trình; reload và lỗi mạng không làm mất tiến độ server đã lưu.
- Thiết kế không tạo nút/đường dẫn cho feature chưa có. Audio lỗi có thông báo và retry phù hợp.

**AC:** đọc được bài dài và vocabulary ja/fr, tiếp tục/hoàn thành/luyện lại dùng đúng state; không có liên kết 404 mới hoặc nội dung bị action bar che.

### UI-03 — Phiên luyện tập

- Một câu tại một thời điểm, header/progress, thoát có xác nhận khi phù hợp, CTA dưới dễ chạm; overlay không cho cuộn/tương tác nền ngoài ý muốn.
- MCQ/LISTENING là lựa chọn đủ lớn với selected/focus state; REORDER là token có thể chọn và trả lại; FILL/GRAMMAR là input rõ vị trí nhập.
- Phím 1–9 chọn lựa chọn nếu focus không ở text input; Enter kiểm tra/tiếp tục theo state. Không intercept khi `isComposing`, không submit nhầm từ IME.
- Sau kiểm tra có trạng thái đúng/sai, đáp án/giải thích khi được phép, accent hint; không tự nhảy qua trước khi người học đọc feedback.
- Lượt làm lại có lời dẫn; combo/animation chỉ là trình bày, không thêm reward server hoặc chấm lại vì effect chạy hai lần.
- Pending chặn submit trùng; network failure giữ input và retry đúng operation; revision stale có thông báo và recovery theo hợp đồng.

**AC:** chạy đủ năm dạng câu, đúng/sai → retry → finish, double click, mạng lỗi, reload và IME. Token animation không đổi thứ tự ID gửi lên; shuffle và keyboard mapping vẫn đúng.

### UI-04 — Hoàn thành và SRS

- Celebration có headline, điểm, XP/gems thực nhận và CTA tiếp theo. Badge/quest mới chỉ xuất hiện khi DTO trả; không diễn lại như vừa nhận thưởng sau mỗi reload.
- Có thể dùng chuyển động ngắn bằng CSS; sound nếu đã có thì mặc định tắt. Không thêm dependency animation nặng để đạt nghiệm thu.
- SRS hiển thị ngôn ngữ/context, mặt trước/sau và trạng thái pending rõ; chọn scope nhất quán với #20. Warm-up khác với phiên ôn ghi lịch theo hành vi đã merge, không tự tạo thao tác scheduling mới.
- Empty/due-later khác với “đã hoàn thành lượt ôn”; lịch đến hạn lấy từ server, hiển thị timezone phù hợp.

**AC:** đúng scope ngôn ngữ, không lộ mặt sau trước reveal, retry/replay không nhân reward hoặc scheduling; kết quả/CTA rõ ở mobile và desktop.

### UI-05 — Responsive và accessibility

| Tiêu chí | Điều kiện nghiệm thu |
|---|---|
| Viewport | Ít nhất 375×812, 768×1024, 1440×900; thêm mobile có bàn phím thật hoặc ghi rõ giới hạn |
| Tràn ngang | Không có horizontal overflow cấp trang ở các màn chính; vùng dữ liệu cần cuộn phải có boundary và thao tác được |
| Touch | CTA và điều khiển chính có vùng chạm tối thiểu 44×44 CSS px |
| Contrast | Text thường ≥ 4.5:1, text lớn và thành phần UI cần thiết ≥ 3:1 |
| Keyboard | Focus visible, thứ tự hợp lý, modal trap/restore đúng, không keyboard trap ngoài modal |
| Motion | `prefers-reduced-motion: reduce` bỏ hiệu ứng trang trí mà không mất feedback/state |
| Zoom | 200% không mất CTA/nội dung thiết yếu; text không bị khóa kích thước khó đọc |
| Feedback | Đúng/sai/locked/done có nhãn hoặc icon kèm text, không chỉ dựa vào màu; lỗi gắn control |
| Ngôn ngữ | Nếu chọn LNG-02, các vùng ngoại ngữ có `lang` đúng; UI tiếng Việt vẫn đọc đúng |

Ảnh nghiệm thu tối thiểu: Home, Catalogue, Lesson reader, Practice trước/sau trả lời, Result và SRS trước/sau reveal ở mobile/desktop; thêm empty/error/locked đại diện. Chủ dự án review bằng mắt trước khi gọi UI ACCEPTED. Screenshot đẹp không thay test thao tác.

## 12. EXT — Các gói có điều kiện, chưa gộp vào sửa lỗi nhỏ

### EXT-01 — Trường cách đọc Nhật riêng — phần mở rộng G6, mức C

Chỉ triển khai sau khi chốt nhu cầu: kana reading của cả từ, romanization hay furigana gắn từng phần kanji. Ba loại này không tương đương.

Phạm vi tối thiểu đề xuất: reading dạng kana và romanization tùy chọn, giữ `phonetic` cho dữ liệu cũ; chưa hỗ trợ annotation ruby theo từng ký tự. Kiểm tra khả năng dùng schema/snapshot hiện có trước khi thêm cột.

Nếu cần đổi schema: migration additive, trường optional, không bắt buộc backfill đoán dữ liệu; cập nhật Zod, Prisma, authoring form, lookup DTO, successor-copy, snapshot publish, learner renderer, SRS, warm-up và preview/review. Published snapshots cũ vẫn đọc được. Không tự suy ra kana từ kanji/romaji.

**AC của gói khi được chọn:** GV nhập → lưu/reload → submit/review/publish → learner/SRS hiện đúng reading; dữ liệu legacy vẫn hiển thị; test tránh mất field khi copy revision; migration chạy trên DB disposable và có đường rollback code không phá dữ liệu.

### EXT-02 — Danh mục ký tự qua sản phẩm — G8, mức C

Hiện có `createCharacter`, validator, catalogue lookup và fixtures, nhưng chưa có luồng sản phẩm hoàn chỉnh cho Admin thêm dữ liệu. Báo cáo cũ dùng tên `createWritingCharacter`; implementation phải dựa trên tên API thực tế.

Phạm vi đề xuất:

1. Admin ACTIVE xem/tìm/phân trang catalogue theo language và script, thêm glyph, meaning/reading/romanization/stroke count theo validator hiện có.
2. Server kiểm quyền, language/script, glyph NFC và unique trong cùng ngôn ngữ; không cho Teacher/Learner ghi catalogue.
3. Teacher chỉ tra cứu/chọn ký tự hợp lệ theo course đang được phân công; không thấy hoặc chọn nhầm ngôn ngữ.
4. Nếu chưa có dữ liệu nét đúng pin, UI giải thích và chặn bật animation/guided-writing tương ứng; không tạo stroke path giả. Hiển thị ký tự tĩnh không được gọi là đã có luyện viết.
5. Nguồn stroke data, quyền sử dụng và phạm vi ký tự ban đầu phải được chốt. Không nhập cả bộ dữ liệu bên ngoài hoặc mở upload SVG tùy ý trong gói quản lý metadata.

**AC của gói khi được chọn:** Admin tạo → Teacher tìm/chọn → lưu/reload → submit/review/publish → Learner đọc đúng snapshot. Có quyền sai, trùng glyph, language sai, pagination và late response regression. References đã xuất bản không bị xóa hoặc đổi ngầm.

### EXT-03 — Writing SRS acceptance/rollout, mức C

- Chạy local với `WRITING_SRS_ENABLED=true` và ID fixture trong `WRITING_SRS_LEARNER_IDS`; giữ meaning SRS riêng, bốn rating writing explicit và scheduling hiện hành.
- Không tự bật flag production hoặc mở allowlist đại trà.
- Trước public acceptance phải có data/stroke pin hợp lệ, cohort và deployment xác định. Kiểm ngoài allowlist không thấy/không gọi được tính năng, trong allowlist chạy hết vòng, retry không ghi hai lần.
- Chỉ đổi trạng thái PUBLIC_PASS/ROLLED_OUT khi có bằng chứng public và phạm vi bật thực tế. Nếu chưa chọn rollout, giữ `LOCAL_PASS / PUBLIC_NOT_ACCEPTED / FLAG_OFF` theo bằng chứng, không chặn release UI/meaning SRS.

## 13. ACC — Nghiệm thu hành trình tích hợp và production

### ACC-01 — Ma trận người dùng và dữ liệu

Local/disposable: Admin ACTIVE, Teacher A được phân công, Teacher B không được phân công, Learner mới, Learner có tiến độ, Learner hai ngôn ngữ; trạng thái disabled/paused/inactive theo ca thử. Không dùng credential thật trong repo hoặc báo cáo.

Ngôn ngữ: English A1 cho hành trình đầy đủ; French/Japanese cho grading/presentation/SRS và các mục LNG đã nhận. Không hạ `due_at` production để giả lập nhiều ngày. Test clock/disposable DB có thể điều khiển thời gian nhưng phải ghi rõ là mô phỏng.

### ACC-02 — Kịch bản bắt buộc của bản tích hợp

| Mã | Kịch bản | Điều kiện PASS |
|---|---|---|
| J01 | GV soạn đủ năm dạng câu, thêm/tái sử dụng từ, lưu và reload | Dữ liệu còn nguyên, nhãn đúng, không lộ grading secret cho learner |
| J02 | Dirty input, draft recovery, stale save và network retry | Không mất input hoặc ghi đè revision mới; lỗi có đường phục hồi |
| J03 | GV nộp → Admin yêu cầu chỉnh sửa → GV đọc nhận xét, sửa, nộp lại | Nhận xét bắt buộc theo hợp đồng, history đúng revision/actor, draft trước giữ nguyên |
| J04 | Admin approve → publish | Active pointer đúng, content chỉ mở sau publish, successor không sửa published revision cũ |
| J05 | Learner mở curriculum và optional xen giữa required | Thứ tự, gating và số bài đồng nhất; URL trái quyền bị từ chối |
| J06 | Đọc → practice năm dạng → sai → feedback → làm lại → finalize | UI không mất state; chấm đúng; first-wrong history, score và reward đúng |
| J07 | Reload/replay/luyện tập lại và quay Home/Catalogue | Không nhân completion/XP/gems; daily count và completed label đúng |
| J08 | SRS chọn ngôn ngữ, thẻ mới, Ôn nhanh, reveal/rate/retry | Đúng scope, due và scheduling; không bị trộn ngôn ngữ ngoài lựa chọn |
| J09 | Nội dung/audio Bài 7/Bài 8 | Chủ đề và đáp án khớp audio thực; H12 có kết luận đúng môi trường |
| J10 | French/Japanese grading và hiển thị | Chính sách #19 giữ nguyên; chỉ test LNG đã chọn, ghi riêng deferred |
| J11 | Responsive/keyboard/reduced motion và lỗi mạng | Đạt UI-05; đủ ảnh và thao tác, không chỉ screenshot |
| J12 | Auth/account/context bị disable, stale publish hoặc sai ownership | Server tiếp tục chặn đúng; UI không vượt quyền vì đổi layout |

Thử desktop rộng không thay thế mobile. Đường Admin trả bài phải chạy thật trong journey, không chỉ dựa vào unit test hoặc nhánh approve thẳng.

### ACC-03 — Retest #19/#20 trên production

- Xác minh deployment READY và source SHA chứa hai PR trước khi test.
- #19: thiếu dấu Latin đúng kèm gợi ý; nháy thẳng/cong; full-width katakana; khoảng trắng CJK. **Không** đòi `こーひー` bằng `コーヒー`: code đã chốt đây không phải hai dạng tự động tương đương. Sai chữ có nghĩa khác vẫn bị chấm sai.
- #20: chọn Pháp/Nhật ra đúng thẻ; thẻ mới theo due policy đã merge; Ôn nhanh hoạt động đúng cơ chế và không tự cộng scheduling/reward khác hợp đồng.
- Ghi rõ dữ liệu được giữ lại và tác động học hợp lệ; không reset progress thật để tạo screenshot.

**AC:** bảng ca thử có SHA/deployment, thời điểm, scope ngôn ngữ, expected/actual và ảnh phù hợp. Nếu chỉ chạy preview thì trạng thái là PREVIEW_PASS, không phải PUBLIC_PASS trên production canonical.

### ACC-04 — Đăng ký mới và Slice 12

#1 đã có flow GET xác nhận không tiêu thụ token và POST rõ ý định người dùng. Không quay lại sửa PKCE suy đoán chỉ vì đọc báo cáo cũ. Kiểm lại local bằng synthetic provider và browser tests trước.

Cập nhật 27/11/2026: chủ dự án đã tự đăng ký bằng email thật trên production và thành công. Việc còn lại là ghi evidence của lượt đó (ngày, deployment/SHA, ảnh đã che dữ liệu nhạy cảm) và chạy các ca local cho link hết hạn/dùng lại. Agent **không tự tạo thêm lượt đăng ký/email thật**. Chuẩn bị trước ca thử, deployment, đường nhận email và điều kiện bắt đầu; chỉ chạy public attempt mới khi có phạm vi ủy quyền mới tương ứng. Không cấu hình SMTP, sửa template/provider/env hoặc resend tự động để vượt blocker.

Chốt thêm 27/11/2026: chủ dự án **bỏ qua việc điền evidence** (ngày, ảnh) cho lượt đăng ký thật. Trạng thái Slice 12: `OWNER_REPORTED (evidence skipped by owner)`. Agent không cần soạn hay đòi thêm evidence; chỉ còn các ca local (link hết hạn/dùng lại).

Ca public cần có khi được phép: đăng ký bằng browser A → mở email trên browser/thiết bị B → GET không đốt token → người dùng POST xác nhận → đăng nhập → onboarding → Home đúng context. Thêm kết luận cho expired/reused link và scanner/prefetch bằng test local; không cố tiêu thụ token thật nhiều lần ngoài ca được phép.

**AC:** bằng chứng email/template thật và flow đúng deployment, không lưu token/session/link bí mật vào hồ sơ. Khi đã có evidence lượt thử của chủ dự án, Slice 12 chuyển `PUBLIC_PASS (owner-tested)`; thiếu evidence thì ghi `OWNER_REPORTED / EVIDENCE_PENDING`, tách khỏi kết luận UI/learner.

### ACC-05 — SRS qua ngày và thiết bị thật

- Local test ngày đến hạn, stage tiếp theo, forgotten và timezone bằng clock/DB disposable theo test harness hiện có.
- Public qua nhiều ngày chỉ báo PASS khi đã quan sát theo ngày thật; không đổi due production cho nhanh.
- Smoke iOS Safari/Android và IME Nhật/Pháp trên thiết bị thật nếu có. Chromium/Playwright là bằng chứng browser tự động, không thay thế thiết bị thật.
- Thiếu thiết bị hoặc thời gian thì ghi `NOT_RUN` có giới hạn cụ thể, không làm rộng tuyên bố “đã nghiệm thu mọi nền tảng”.

## 14. DOC — Hồ sơ, dữ liệu và worktree

### DOC-01 — Đối chiếu findings

- Merge/đối chiếu #21 và báo cáo vòng 3; cập nhật trạng thái từng H/G theo SHA và evidence mới, giữ nguyên ghi nhận lịch sử.
- Thu thập diff local của báo cáo vòng 1, kế hoạch gems và kế hoạch journey; tránh commit lại nội dung đã merge trên nhánh khác.
- `docs/ui-audit/` là đầu vào tham khảo cần đối chiếu. Các yêu cầu undo/redo, learner assessment hoặc feature mới trong audit không tự trở thành scope của đợt này.
- Không ghi “đã sửa production” chỉ dựa trên một nhánh local hoặc PR mở.

### DOC-02 — Ảnh và script

- Inventory ảnh theo màn, viewport, ngôn ngữ, vòng thử, trước/sau sửa và SHA nếu biết. Không tự gán SHA cho ảnh cũ không có metadata.
- Ảnh cần che credential/PII/token; không commit cookie, connection info hoặc `/tmp/journey-stack.json`.
- So sánh script `journey-stack.mjs`/`scripts/journey/` với những gì đã track; chỉ đưa script có thể chạy lại và có guard dùng DB disposable. Không để helper đổi production `due_at` thành lệnh mặc định trong nghiệm thu.
- Không yêu cầu manifest/hash audit mới. Index Markdown ngắn và tên file đủ truy nguồn là đủ.

### DOC-03 — Dọn worktree

Lập bảng path → branch → HEAD → PR/merge → dirty files → commit còn riêng → đề xuất giữ/xóa. Giữ worktree UI/test còn hoạt động và mọi dữ liệu chưa được lưu an toàn.

Chỉ xóa/chuyển theo danh sách cụ thể được chủ dự án xác nhận; kiểm lại status ngay trước thao tác. Không `git clean`, `reset --hard`, `worktree remove --force` hoặc xóa node_modules/generated hàng loạt để làm bảng trạng thái trông sạch.

**AC:** nếu chưa được xác nhận thì giao inventory/deletion proposal, trạng thái `AWAITING_OWNER`; đó không phải lỗi của code release. Không mất commit hoặc file chưa commit.

## 15. Hợp đồng kỹ thuật và quy tắc sửa code

### 15.1. Cấu trúc dự án thực tế

```text
lingora-web/src/app/                       Learner pages và route handlers
lingora-web/src/server/context/            Curriculum, home, context, timezone
lingora-web/src/server/lessons/            Access, grading, attempts, result DTO
lingora-web/src/server/srs/                Sessions, scheduling, flag/allowlist
lingora-web/src/shared/                    Helper chỉ dùng bên learner (mới có từ #22, chưa có trên main)
lingora-admin/src/components/              Authoring, review, catalogues
lingora-admin/src/server/lessons/           Draft, submit, review, publish
lingora-admin/src/server/courses/           Course validation
lingora-admin/src/server/characters/        Catalogue, strokes, vocabulary mapping
lingora-admin/src/server/curriculum/        sample-a1.ts, demo-a1.ts
lingora-admin/prisma/product/              Schema/migrations; một schema owner
packages/lesson-content/src/               Schemas, DTO, renderer/helper dùng chung
*/tests/feature/                           Node tests, Playwright component/browser
scripts/local-test-db.mjs                  PostgreSQL disposable cho test
docs/acceptance/                           Findings, ảnh, evidence
plans/                                    Spec/kế hoạch theo convention repository
```

Next/React/Prisma/Supabase và Node dùng version đang khóa trong repo/CI. Không đổi dependency chỉ để chạy spec. Sửa helper ở nơi chia sẻ đúng mức, không nhân bản formatter ở hai app.

### 15.2. Style và lỗi

Dùng TypeScript, tên hàm/field theo code hiện có; backend validation bằng Zod/Prisma, giữ server-only boundaries và error envelope hiện hành. Ví dụ pattern thực tế ở `lingora-web/src/server/lessons/dto.ts`:

```ts
export class LessonServiceError extends Error {
  status: number;
  error: LessonServiceErrorPayload;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.error = { code, message };
    this.name = 'LessonServiceError';
  }
}
```

Không tạo error model hoặc abstraction mới cho từng lỗi nhỏ. Format cùng convention của file, giữ .ts/.js import suffix theo module hiện có. Comment giải thích quyết định khó hiểu, không kể lại từng dòng code.

### 15.3. Bất biến bắt buộc

- Role/status/assignment/context/active revision kiểm ở server, kể cả request trực tiếp.
- Giữ published revision, attempt history, grading secret boundary, operation idempotency, transaction atomicity và lock ordering.
- Một logical card/skill theo mô hình hiện có; thay UI không tạo enrollment hoặc scheduling ngoài contract.
- Không trả raw Prisma/provider errors, secret keys, token, email confirmation URLs hoặc cookie vào log/evidence.
- Không xóa validation, test hoặc constraint để qua gate. Không thêm `any`/suppression/skip hàng loạt.
- Không sửa migration đã áp dụng. Gói A/B ưu tiên không migration; gói C nếu chứng minh cần thì dùng migration additive và rollout tương thích.
- Không đưa nghiệp vụ xuống SQL trigger mới hoặc xây cơ chế SHA audit/quality gate riêng.

## 16. Lệnh kiểm tra và chiến lược test

Chạy từ **root của checkout tích hợp**, không phải thư mục chứa nhiều worktree. Đây là các script đã kiểm tra có trong `package.json`; chạy nhóm tương ứng phạm vi, không mặc định chạy tất cả integration suites cho một sửa CSS.

### 16.1. Gate cơ bản

```bash
npm ci
npm run db:product:generate
node lingora-web/scripts/prepare-prisma-runtime.mjs
npm run typecheck
npm run test:feature
npx playwright install chromium
npm run test:components
npm run build
git diff --check
```

`npm ci` cho checkout sạch hoặc khi dependency thay đổi, không cần lặp nếu môi trường đã sẵn sàng. Linux thiếu system dependencies dùng cách cài Chromium theo workflow CI hiện hành. Không dùng credential production để build/test local.

Lưu ý: root có `test:components`; không gọi script này trong `@lingora/lesson-content` vì package đó không có script cùng tên. Root không có script lint trong baseline kiểm tra, không ghi “lint PASS” nếu chưa có lệnh tương ứng.

### 16.2. Gate theo phạm vi

| Phạm vi | Lệnh từ repo root |
|---|---|
| Shared content | `npm run typecheck -w @lingora/lesson-content` và `npm run test:feature -w @lingora/lesson-content` |
| Learner/score/gating/timezone | `npm run test:integration:lessons`, `npm run test:integration:practice`, `npm run test:integration:gamification` |
| Onboarding/auth bootstrap | `npm run test:integration:onboarding` và `npm run test:e2e:onboarding` |
| Meaning SRS | `npm run test:integration:srs` và `npm run test:e2e:srs` |
| Home/learning UI | `npm run test:e2e:learning` và `npm run test:e2e:gamification` |
| Staff workflow/save | `npm run test:integration:studio` và component/feature tests của `lingora-admin` |
| Character picker bị ảnh hưởng ở #23 | `npm run test:integration:character-options` và `npm run test:e2e:character-studio` |
| Character catalogue nếu chọn EXT-02 | `npm run test:integration:characters`, `npm run test:integration:character-draft-save`, `npm run test:integration:character-workflow` |
| Curriculum sample/demo | `npm run test:integration:sample`; nếu sửa `demo-a1.ts` (H12) thì `npm run test:integration:demo` |
| Curriculum Nhật/Trung (J10, LNG) | `npm run test:integration:japanese` và `npm run test:integration:chinese` |
| Writing nếu chọn rollout | `npm run test:integration:writing` và `npm run test:e2e:writing` |
| Auth confirmation browser | `npm run test:browser:confirmation -w lingora-web` |

Script DB phía trên dùng `scripts/local-test-db.mjs`; không truyền URL production vào để chạy cho tiện. Browser tests nào cần build/server/fixtures phải đọc setup của test trước, khởi động đúng app/port và chờ readiness; không coi lỗi thiếu server là regression sản phẩm.

Stack journey hiện có, chỉ dùng sau khi review guard và tích hợp script:

```bash
node scripts/local-test-db.mjs node --experimental-strip-types scripts/journey-stack.mjs
```

Process này giữ server sống; chạy trong session quản lý được, dừng sau nghiệm thu và không commit file connection info trong `/tmp`. Không giả định script untracked đã tự có mặt trên main.

### 16.3. Cách chọn test

- Logic mới/sửa bug: regression thể hiện lỗi trước, xác nhận PASS sau; kiểm hành vi quan sát được, không chỉ khẳng định helper được gọi.
- API/data: quyền, input sai, stale/concurrency/rollback khi tác động transaction; dùng PostgreSQL disposable.
- UI: component/browser cho hành động quan trọng, ảnh thủ công cho layout; không viết snapshot test cho từng giá trị CSS.
- Không đặt tỷ lệ coverage mới tùy ý cho đợt này. Bảo toàn kiểm tra hiện có và thêm đúng ca còn thiếu.
- Trên SHA tích hợp cuối chạy typecheck, feature, component, build và journey liên quan một lượt đầy đủ. Chỉ chạy lại khi code đổi, test fail hoặc có mối lo chưa giải quyết.

## 17. Ma trận truy vết H/G

### 17.1. Vòng 2 production

| Finding | Yêu cầu | Tình trạng đầu vào / cách đóng |
|---|---|---|
| H1 | LEA-01 | #22; bài tùy chọn luôn mở trong quyền/trình độ hợp lệ |
| H2 | LEA-02 | #22; kiểm thêm số GV gõ khác vị trí hệ thống |
| H3 | ADM-01 | #23; bỏ row version khỏi nhãn sản phẩm |
| H4 | ADM-01 | #23; rõ chương/khóa |
| H5 | ADM-02 | #23; Enter đã hoạt động theo bàn giao, kiểm empty state và IME |
| H6 | LNG-03 / EXT-01 | Hiển thị tối thiểu mức B; trường mới mức C |
| H7 | ADM-04 | #23 mới tối ưu một phần; cần số đo trước/sau |
| H8 | ADM-02 | #23; xác nhận nộp |
| H9 | ADM-03 | #23; tên/fallback reviewer |
| H10 | LEA-03 | #22; điểm/lượt thử rõ nghĩa, không đổi công thức |
| H11 | LEA-04 | #22; nhãn hoàn thành không sửa dữ liệu đọc |
| H12 | CNT-01 | Đối chiếu revision/audio production trước khi sửa source |
| H13 | LEA-04 | #22; kiểm distinct lessons, redo và timezone |
| H14 | D / §3.1 | SMTP để lại theo quyết định; không ghi FIXED |

### 17.2. Vòng 3 French/Japanese

| Finding | Yêu cầu | Tình trạng đầu vào / cách đóng |
|---|---|---|
| G1/G2/G3 | ACC-03 | #19 đã merge; retest thiếu dấu, nháy và CJK whitespace |
| G4 | ACC-03 | NFKC half/full-width đã có; hira/kata không tự coi tương đương |
| G5 | LNG-01 | Mức B; shared presentation, không đổi token grading |
| G6 | LNG-03 / EXT-01 | Tách sửa format khỏi thêm reading/furigana |
| G7 | LNG-02 / UI-05 | Mức B; lang đúng từng vùng, đã có vài chỗ không đồng nghĩa đã phủ hết |
| G8 | EXT-02/03 | Mức C; catalogue product flow và stroke/rollout là hai điều kiện riêng |
| G9 | LNG-04 | Player/error handling mức A; upload audio deferred |
| G10 | LNG-04 | Câu hỏi GRAMMAR không bị sourceSentence thay thế |
| G11/G12 | ACC-03 / UI-04 | #20 đã merge; retest ngôn ngữ, due và warm-up |
| G13 | UI-01 | Mức B; cải thiện selector/default hiện có, không làm selector thứ hai |
| G14 | ADM-03 | #23; cả form và server |
| G15 | LEA-02 | #22; shared title rule |
| G16 | LNG-05 | Cảnh báo ứng viên, không auto merge vocabulary |
| G17 | UI-01/UI-02 và deferred | Polish lựa chọn ngôn ngữ bằng dữ liệu có thật; placement thật ngoài scope |
| G18 | Không phải bug | Giữ kết luận, không mở lại full-page screenshot như lỗi overlay |

Findings F/D cũ đã có PR merge được smoke theo ACC/CNT, không reset về OPEN chỉ vì bảng này tập trung H/G. Nếu phát hiện regression, tạo ghi nhận mới liên kết finding cũ và SHA tái hiện.

## 18. Thứ tự bàn giao và điều kiện qua từng mốc

| Mốc | Deliverable | Điều kiện chuyển tiếp |
|---|---|---|
| M0 — Chốt phạm vi | Spec này, chọn A/B/C, quy tắc đánh số và mục tiêu H7 | Các quyết định còn mở được ghi cụ thể; phần độc lập không cần chờ gói C |
| M1 — Baseline | INT-01/02, review #21/#22/#23/#8 và nhánh test | Không mất WIP; commit/SHA/ownership rõ |
| M2 — Correctness | LEA, ADM, TST và CNT | Regression tập trung, DB/browser theo phạm vi PASS; H7 có số đo |
| M3 — Language/UI | LNG đã chọn, bản UI gamified cuối | Behavior của M2 giữ nguyên; UI-05 và hình ảnh/thao tác được review |
| M4 — Local acceptance | Gate cơ bản + J01–J12 áp dụng | Có bảng expected/actual; không còn lỗi P0/P1 trong phạm vi release |
| M5 — Public acceptance | Retest #19/#20 và các PR đã deploy trong phạm vi được phép | Đúng SHA/deployment; ghi rõ auth/writing/thiết bị nào chưa thử |
| M6 — Đóng hồ sơ | Findings cập nhật, ảnh/script đã đối chiếu, worktree inventory | Không gắn PASS cho mục deferred; không xóa worktree nếu chưa được xác nhận |

Đây là thứ tự phụ thuộc cho spec, không phải lệnh tự tạo agent hoặc tự merge toàn bộ PR. Khi được yêu cầu chạy song song, M1–M3 chia theo §4.1 (L1–L4, thêm L5 nếu chốt Q1); M4–M6 làm tuần tự. Các quyết định production đã cấp trước vẫn có hiệu lực đúng phạm vi; không hỏi lại cho cùng hành động đã được ủy quyền, đồng thời không suy diễn quyền deploy/DB mutation cho việc mới chỉ được yêu cầu viết spec.

## 19. Tiêu chí hoàn tất release và mẫu báo cáo

### 19.1. Checklist hoàn tất phần A

- [ ] Các bản sửa đã chọn được review và tích hợp đúng một lần, có SHA cuối.
- [ ] H1/H2/H3/H4/H5/H8/H9/H10/H11/H13/G14/G15 được kiểm theo spec, không chỉ dựa vào PR title.
- [ ] H7 có kết quả đo và kết luận đạt/chưa đạt mục tiêu đã chốt; H12 có đối chiếu revision/audio thật.
- [ ] G9 phần phát thử, G10 và G16 phần cảnh báo được thực hiện hoặc có disposition rõ được chủ dự án chấp thuận, không âm thầm bỏ sót.
- [ ] Timezone/draft/focus regression và các gate code liên quan PASS; không làm yếu assertions.
- [ ] UI game hoá có đủ màn, trạng thái, responsive, keyboard và reduced motion; chủ dự án đã review hình ảnh/thao tác.
- [ ] #19/#20 được retest đúng deployment hoặc còn ghi PUBLIC_NOT_VERIFIED, không gọi là đã nghiệm thu production.
- [ ] Luồng trả bài → sửa → nộp lại và hành trình tích hợp đã có evidence.
- [ ] Dữ liệu thử được giữ; không mất lịch sử/revision, không nhân XP/gems/card/schedule.
- [ ] Findings và bằng chứng truy được SHA/môi trường; worktree cleanup chưa được phép vẫn chỉ là proposal.

### 19.2. Kết luận phải tách theo phạm vi

Ví dụ hợp lệ: `Release A LOCAL_PASS / PUBLIC_PASS; G5/G7/G13 DEFERRED_OWNER; Slice 12 PUBLIC_PASS (owner-tested); Writing SRS FLAG_OFF / PUBLIC_NOT_ACCEPTED; cleanup AWAITING_OWNER`.

Không dùng một chữ `PASS` để che những mục chưa chạy hoặc còn chờ quyết định. Nếu một mục A bị deferred, phải có lý do và chấp thuận cụ thể, không tự chuyển scope để báo xong.

Mẫu evidence ngắn, mỗi nhóm chỉ cần một báo cáo Markdown liên kết log/ảnh cần thiết:

```text
Requirement/Test ID:
Branch / source SHA / deployment:
Môi trường / ngôn ngữ / viewport / timezone:
Fixture (ID không nhạy cảm):
Expected:
Actual:
Lệnh hoặc các bước đã chạy:
Kết quả: PASS / FAIL / NOT_RUN / BLOCKED / DEFERRED_OWNER
Ảnh/log đã che dữ liệu nhạy cảm:
Giới hạn còn lại:
Commit / PR / merge / rollout status:
```

Không cố định tổng số test PASS vào spec; báo số thực tế của suite và SHA chạy, không chép số cũ.

## 20. Các quyết định (đã chốt 27/11/2026, xem §3.1)

| ID | Quyết định | Đề xuất mặc định | Ảnh hưởng nếu chưa chốt |
|---|---|---|---|
| Q1 | Nhận G5/G7/G13 và G6 format tối thiểu trong release này? | Nhận cả bốn, vì có thể làm bằng dữ liệu hiện có; phối hợp ownership với UI | Không tự triển khai mức B; A độc lập vẫn tiếp tục được |
| Q2 | Quy tắc đánh số khi tên bài có số khác vị trí curriculum? | **Đã chốt khác đề xuất:** tên do Admin đặt, hiện nguyên văn; chỉ thêm số khi tên chưa có tiền tố | Ca không khớp số là trách nhiệm đặt tên của Admin, không phải lỗi hiển thị |
| Q3 | Mục tiêu H7 | Warm median ≤ 2s, p95 ≤ 5s với fixture đại diện; cold báo riêng | Có thể đo trước; chưa chốt ngưỡng thì báo số thực, không tự tuyên bố đạt SLO |
| Q4 | Thêm trường kana/furigana và catalogue kana/kanji? | Để gói C sau; ưu tiên format/metadata ngôn ngữ trước | G6 đầy đủ/G8/Writing public vẫn deferred, không nói đã hỗ trợ trọn vẹn |
| Q5 | Lượt đăng ký/email public mới và điều kiện template/provider | Chuẩn bị local/evidence trước, chỉ chạy khi có ủy quyền cụ thể | Slice 12 vẫn NOT ACCEPTED; không cấu hình SMTP trái quyết định |
| Q6 | Danh sách worktree được xóa | Chốt sau inventory và lưu an toàn WIP | Không xóa/chuyển thư mục |
| Q7 | Đưa #22 vào main thế nào khi nhánh UI đã chứa `5284d96`? | Merge #22 trước rồi rebase UI; PR UI chỉ còn phần UI | Rủi ro merge lặp hoặc review hai lần cùng diff |
| Q8 | Ai đang sở hữu `lingora-ui` (có commit `2e54858` ngày 27/11)? | Giữ người/session đang sửa làm owner L2 | Không giao L2 cho agent mới để tránh hai bên cùng sửa |

Cột "Đề xuất mặc định" giữ lại để truy vết; quyết định cuối là bản ghi ở §3.1. Không hỏi lại các quyết định đã có ở §3.1. Việc review spec không tự thay đổi ngân sách public attempt, feature flags hoặc chính sách giữ dữ liệu.

## 21. Brief giao việc cho agent

Mỗi brief dán nguyên văn cho một agent. Quy tắc chung cho mọi luồng:

- Đọc spec này (§3.1, §4.1 và các mục được giao) trước khi sửa.
- Chỉ sửa file thuộc luồng mình (§4.1). Cần sửa file của luồng khác thì dừng lại và báo, không tự sửa.
- Commit vào nhánh của luồng; được push nhánh và mở/cập nhật PR. **Không merge, không deploy, không sửa dữ liệu production.**
- Báo cáo cuối theo mẫu §19.2: mã yêu cầu, SHA, lệnh đã chạy, PASS/FAIL/NOT_RUN, việc còn lại.

Thứ tự merge (chủ dự án merge): L1 → #23 (L3) → #22 → rebase nhánh UI (L2) lên main → PR UI. L5 merge trước khi L2/L3 nối helper vào consumer.

### L1 — Test (agent mới)

```text
Worktree: /home/tung/workspace/school/project1/lingora-test-fix, nhánh fix/test-flaky-timezone.
Việc: TST-01, TST-02, TST-03 trong plans/2026-11-27-mvp-acceptance-and-gamified-ui-spec.md
(trong lingora-workspace). Review 681d9ff và e058278, bổ sung test còn thiếu theo AC.
Không cherry-pick 1667bb7. Không skip test, không tăng timeout, không thêm sleep.
Gate: npm run typecheck, npm run test:feature, npm run test:components,
npm run test:integration:lessons, npm run test:integration:practice, npm run test:integration:gamification;
ca flaky đã tái hiện chạy 3 lượt sau sửa.
Xong: push nhánh, mở PR, báo cáo theo §19.2.
```

### L2 — Học viên + UI (gửi cho agent Sonnet đang làm lingora-ui)

```text
Tiếp tục trên lingora-ui, nhánh feat/learner-ui-gamified, từ commit 2e54858.
Spec: plans/2026-11-27-mvp-acceptance-and-gamified-ui-spec.md, mục LEA-01..05, UI-00..05.
Quyết định mới: tên bài do Admin đặt, hiện nguyên văn, chỉ thêm số khi tên chưa có tiền tố;
bộ chọn lộ trình hiện "Ngôn ngữ · mã trình độ" theo khung của khóa (tiếng Nhật N5–N1).
Gộp phần a11y của PR #8 vào OnboardingWizardView.tsx (radiogroup + input radio) và giữ test của #8.
Không sửa file của lingora-admin hoặc packages/lesson-content.
Push nhánh ngay để có bản sao trên GitHub. Sau khi #22 được merge, rebase lên main.
Gate: typecheck, test:feature, test:components, test:e2e:learning, test:e2e:gamification, test:e2e:onboarding;
ảnh Home/Catalogue/Lesson/Practice/Result/SRS ở 375px và 1440px.
```

### L3 — Staff (agent mới)

```text
Worktree: /home/tung/workspace/school/project1/lingora-admin-fix, nhánh fix/admin-authoring-labels (PR #23).
Việc: ADM-01..04, LNG-04 (player audio trong editor/review), LNG-05 (cảnh báo từ trùng cùng ngôn ngữ).
H7: đo Save/Submit trước và sau trên DB disposable (20 mẫu warm mỗi thao tác), mục tiêu median ≤ 2s, p95 ≤ 5s.
Không đổi migration, không bulk sửa normalizedForm, không thêm endpoint proxy audio.
Gate: typecheck, test:feature, test:components, test:integration:studio,
test:integration:character-options, test:e2e:character-studio.
Xong: push, cập nhật PR #23 với số đo H7, báo cáo theo §19.2.
```

### L4 — Chỉ đọc (agent mới, không sửa code)

```text
Không sửa code, không sửa dữ liệu production.
1) CNT-01: đối chiếu Bài 7/Bài 8 giữa source (lingora-admin/src/server/curriculum/demo-a1.ts trên origin/main)
   và revision đang publish; ghi ID/revision và kết luận lệch seed hay lệch source.
2) DOC-01/02: đối chiếu findings vòng 1–3 với PR đã merge; lập index ảnh trong docs/acceptance và docs/ui-audit.
3) DOC-03: bảng worktree path → branch → HEAD → PR → dirty → đề xuất giữ/xóa. Không xóa gì.
4) ACC-04: bỏ qua evidence theo quyết định chủ dự án (27/11/2026); chỉ chạy ca local link hết hạn/dùng lại.
Kết quả: các file Markdown trong docs/acceptance/, gửi lại để chủ dự án duyệt.
```

### L5 — Helper ngôn ngữ (agent mới)

```text
Tạo worktree mới từ origin/main: git worktree add ../lingora-lang -b feat/lang-presentation-helpers origin/main
(chạy trong lingora-workspace).
Việc: LNG-01 (ghép token theo ngôn ngữ, ja/zh không chèn dấu cách), LNG-02 (helper chuẩn hóa mã lang),
LNG-03 (format phiên âm: en/fr bọc đúng một cặp /…/, ja/zh không bọc).
Chỉ sửa packages/lesson-content/src/* và test của package. Không sửa lingora-web/lingora-admin;
việc gắn helper vào màn hình sẽ do L2/L3 làm sau khi merge.
Không đổi cách chấm điểm (vẫn theo token ID/thứ tự).
Gate: npm run typecheck -w @lingora/lesson-content, npm run test:feature -w @lingora/lesson-content, npm run typecheck.
Xong: push, mở PR, báo cáo theo §19.2.
```

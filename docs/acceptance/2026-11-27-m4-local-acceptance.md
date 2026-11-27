# M4–M6 — Nghiệm thu local Lingora, 27/11/2026

**Release A LOCAL_FAIL (H2/G15 và UI-05); G5/G6-format/G13 LOCAL_PASS; G7 LOCAL_FAIL; H7 NOT_RUN; PUBLIC_NOT_VERIFIED.**

Gate tự động đạt không thay thế nghiệm thu hành trình/UI. Có 5 finding sản phẩm mới, không sửa trong đợt này. M4 chưa được chấp nhận; M5 chờ deploy/ủy quyền nghiệm thu public; M6 đã tập hợp hồ sơ, còn các phần evidence của chủ dự án ghi dưới đây.

## 1. Định danh và ranh giới (§19.2)

| Trường | Evidence |
|---|---|
| Requirement/Test ID | ACC-01..05, J01–J12, UI-05, ADM-04/H7, DOC-01..03; ma trận H/G ở mục 6 |
| Branch / source SHA | `chore/acceptance-m4`; **`5e834293e0ce21a6dd14452c6ad75224aa45a0fb`** — toàn bộ test và finding trong báo cáo dùng SHA này |
| Baseline | Fetch `origin/main`: `6524a5bb7b6aff1b318f5c5fe63493c9235669c7` → `5e834293e0ce21a6dd14452c6ad75224aa45a0fb`; tạo bằng `git worktree add ../lingora-accept -b chore/acceptance-m4 origin/main` |
| Root | `/home/tung/workspace/school/project1/lingora-accept`; không chạy test từ thư mục cha chứa các worktree |
| Môi trường | Linux, Node `v24.22.3`, npm `10.8.2`, Playwright Chromium `1.62.1`; Next production build chạy local; timezone browser `Asia/Ho_Chi_Minh` |
| Thời gian | 27/11/2026, khoảng 10:08–10:34 (UTC+07); chi tiết thời điểm thao tác trong log/DB snapshot |
| Deployment | Local Admin `127.0.0.1:3100`, Learner `127.0.0.1:3200`; **không có deployment public được nghiệm thu** |
| DB/auth | PostgreSQL disposable do `scripts/local-test-db.mjs` tạo; provider auth loopback và tài khoản `@lingora.test`; không dùng credential production |
| Viewport/ngôn ngữ | 375×812, 768×1024, 1440×900; UI Việt, nội dung en/fr/ja; zh qua integration/helper tests |
| Phạm vi thay đổi | Tài liệu và ảnh/log nghiệm thu. Không sửa product/test/config/dependency; không merge/deploy, không sửa DB production, không đăng ký email thật, không xóa worktree |
| Commit / PR / rollout | Commit tài liệu có source là SHA phía trên; nhánh được push để mở PR tài liệu vào `main`. Không merge hoặc rollout trong nhiệm vụ này |

Spec [MVP acceptance & gamified UI](../../plans/2026-11-27-mvp-acceptance-and-gamified-ui-spec.md) được sao chép từ file untracked (chỉ bỏ dòng trống thừa cuối file) trong `lingora-workspace`, không suy diễn rằng spec đã nằm trên baseline. Xem [provenance](evidence/m4/spec-provenance.json). Đã đọc §3.1, §11, §13, §16, §17 và §19. Những quyết định đã chốt được kiểm riêng ở mục 4.

### Guard và fixture journey

Đã review `scripts/journey-stack.mjs`, `scripts/local-test-db.mjs` và `scripts/test-guard-utils.mjs` trước khi chạy. Guard yêu cầu ownership marker, URL rõ ràng, host loopback, DB chính xác `/slice11_test`, và khớp các URL override. Harness tạo cluster/password mới, migrate hai DB disposable, rồi chạy process con với URL do nó sở hữu. Stack dùng `validateOwnedDatabaseUrl()` trước khi seed; provider chỉ nhận synthetic token của ba actor local.

Đã chạy từ root:

```sh
node scripts/local-test-db.mjs node --experimental-strip-types scripts/journey-stack.mjs
```

Một preload nghiệm thu bên ngoài repo chỉ lưu URL **đã qua guard** vào file `/tmp` quyền `0600` để tạo/đọc fixture bổ sung. Không đưa connection info, cookie hoặc session vào PR. Probe bổ sung cũng kiểm lại guard trước truy cập DB. Không dùng `scripts/journey/db.mjs` hoặc `--make-due` với URL không kiểm soát. Không hạ due production.

Fixture chính: Admin ACTIVE, GV A được phân công, learner mới rồi có tiến độ; GV B không được phân công/inactive và learner thứ hai được kiểm trong E2E Character Studio/learning. English có required ở vị trí 1, 3, 4 và **optional ở vị trí 2**. Bài tác giả `99bb9d8f-eaf4-4261-913a-362ef26d1780`; context English `54abdbce-9dac-47dc-833d-f3cc22e6c557`. French/Japanese được seed qua service thật và onboard qua UI; JLPT có N5–N1, khóa Nhật bắt đầu N5. Để tuân thủ giới hạn hai context ACTIVE, pause English sau khi hoàn tất hành trình English, trước khi mở Japanese. Đây là fixture disposable có chủ đích.

## 2. Gate cơ bản và theo phạm vi (§16)

Toàn bộ lệnh dưới đây exit `0` trên source SHA `5e834293e0ce21a6dd14452c6ad75224aa45a0fb`. **Không có gate fail cần phân loại sản phẩm/harness/môi trường.** Count lấy trực tiếp từ output hiện tại; không dùng số bàn giao cũ. [Lệnh, exit, thời lượng và count máy đọc được](evidence/m4/test-counts.json).

| Gate cơ bản | Actual | Log |
|---|---|---|
| `npm ci` | PASS; có cảnh báo 3 high dependency entries, xem M4-T01 | [npm-ci](evidence/m4/npm-ci.log) |
| `npm run db:product:generate` | PASS | [generate](evidence/m4/generate.log) |
| `node lingora-web/scripts/prepare-prisma-runtime.mjs` | PASS | [runtime](evidence/m4/prisma-runtime.log) |
| `npm run typecheck` | PASS cả 3 workspace | [typecheck](evidence/m4/typecheck.log) |
| `npm run test:feature` | **1.088 tests, 1.088 pass, 0 fail/skip**; Admin 558 + Web 430 + shared 100 | [feature](evidence/m4/feature.log) |
| `npx playwright install chromium` | PASS | [chromium](evidence/m4/chromium.log) |
| `npm run test:components` | **252 tests, 252 pass, 0 fail/skip**; Admin 150 + Web 102 | [components](evidence/m4/components.log) |
| `npm run build` | PASS Admin + Web | [build](evidence/m4/build.log) |
| `git diff --check` | PASS; chạy lại cả staged docs trước commit | [diff-check](evidence/m4/diff-check.log) |

| Gate phạm vi — `npm run test:integration:<tên>` | Tests / pass / fail / skip | Log |
|---|---|---|
| lessons | 7 / 7 / 0 / 0 | [log](evidence/m4/integration-lessons.log) |
| practice | 13 / 13 / 0 / 0 | [log](evidence/m4/integration-practice.log) |
| gamification | 5 / 5 / 0 / 0 | [log](evidence/m4/integration-gamification.log) |
| onboarding | 62 / 62 / 0 / 0 | [log](evidence/m4/integration-onboarding.log) |
| srs | 41 / 41 / 0 / 0 | [log](evidence/m4/integration-srs.log) |
| studio | 38 / 38 / 0 / 0 | [log](evidence/m4/integration-studio.log) |
| character-options | 15 / 15 / 0 / 0 | [log](evidence/m4/integration-character-options.log) |
| sample | 10 / 10 / 0 / 0 | [log](evidence/m4/integration-sample.log) |
| demo | 8 / 8 / 0 / 0, thêm chương trình verification 16 gate và seed idempotent | [log](evidence/m4/integration-demo.log) |
| japanese | 4 / 4 / 0 / 0 | [log](evidence/m4/integration-japanese.log) |
| chinese | 1 / 1 / 0 / 0 | [log](evidence/m4/integration-chinese.log) |
| **Tổng integration node:test** | **204 / 204 / 0 / 0** | |

Các chương trình browser dưới đây dùng `assert`, không phát tổng `node:test`. Mỗi dòng là **1 lần chạy chương trình thành công**, không quy số assertion/checkmark thành số test:

| Lệnh | Actual | Log |
|---|---|---|
| `npm run test:e2e:onboarding` | PASS; 4 scenario, gồm cross-device synthetic confirmation | [log](evidence/m4/e2e-onboarding.log) |
| `npm run test:e2e:srs` | PASS; desktop/mobile, isolation và scheduling/DB | [log](evidence/m4/e2e-srs.log) |
| `npm run test:e2e:learning` | PASS; joined author/publish/learn/finalize/SRS/isolation | [log](evidence/m4/e2e-learning.log) |
| `npm run test:e2e:gamification` | PASS; Home/path/reward | [log](evidence/m4/e2e-gamification.log) |
| `npm run test:e2e:character-studio` | PASS; 11 phần, có trả bài/sửa/nộp lại và attribution | [log](evidence/m4/e2e-character-studio.log) |
| `npm run test:browser:confirmation -w lingora-web` | PASS; GET không tiêu thụ token, POST chủ động, replay thất bại; 0 external provider calls | [log](evidence/m4/browser-confirmation.log) |

Tổng có count TAP: **1.544 tests** (1.088 feature + 252 component + 204 integration), tất cả pass, 0 fail/skip; cộng **6 chương trình browser** nêu riêng. Không ghi lint PASS vì root không có script lint.

## 3. J01–J12 — Expected / Actual / kết quả

Tất cả ca dùng source SHA nêu ở mục 1. `PASS` ở từng dòng chỉ có hiệu lực trong phạm vi Actual, trên local; không có ý nghĩa public hoặc thiết bị thật.

| ID | Expected | Actual và evidence | Kết quả |
|---|---|---|---|
| J01 | GV soạn 5 dạng, thêm/tái dùng từ, save/reload; learner không nhận grading secret | Soạn MCQ/FILL_BLANK/REORDER/GRAMMAR/LISTENING, tạo `family`/`mother`, reload nguyên nội dung; successor tái dùng `Hello` qua tìm kiếm và reload. Gate learner/character kiểm DTO không lộ secret. [author](evidence/m4/journey-author.log), [reuse](evidence/m4/journey-reuse.log), [ảnh](screenshots/m4/J01-editor-reloaded-1440.png) | PASS |
| J02 | Dirty input, local recovery, stale save, retry không mất dữ liệu | Dirty submit bị disable; PATCH offline giữ input; backup sau debounce được khôi phục qua UI; stale payload bị `409 STALE_LESSON`; save lại thành công. Component/integration kiểm concurrency và rollback. [author](evidence/m4/journey-author.log), [resume](evidence/m4/journey-author-resume.log), [offline](screenshots/m4/J02-offline-save-1440.png) | PASS |
| J03 | Nộp → Admin trả bài → GV đọc nhận xét → sửa → nộp lại, đúng actor/revision | Empty comment bị chặn; nhập `M4: bổ sung ví dụ cho từ family.` rồi trả bài; GV thấy nguyên nhận xét, tạo successor, sửa title, nộp lại qua confirmation. Revision #3 CHANGES_REQUESTED được giữ, #4 PUBLISHED sau lượt sau; actor đúng. [review](evidence/m4/journey-review.log), [DB](evidence/m4/db-final.json), [GV đọc nhận xét](screenshots/m4/J03-teacher-feedback-1440.png), [nộp lại](screenshots/m4/J03-resubmitted-1440.png) | PASS |
| J04 | Approve/publish đổi active pointer; successor không đổi nội dung đã publish | Admin approve/publish revision #4; active pointer giữ #4 khi GV tạo/lưu #5 có title khác. Learner vẫn thấy `Bài 99: Gia đình – giữ số Admin`. [audio/successor](evidence/m4/journey-audio-final.log), [DB](evidence/m4/db-final.json), [ảnh](screenshots/m4/J04-successor-published-unchanged-1440.png) | PASS |
| J05 | Optional xen giữa required mở trong scope; required gating và thứ tự đúng | Required 1/3/4, optional 2; optional mở khi required trước chưa xong (API 200); required 3/4 khóa đúng; xong 1 thì học được 3 dù chưa học optional 2. Catalogue giữ thứ tự 1/2/3/4 và tên có tiền tố #99. Ca tên không có tiền tố ở J10 phát hiện M4-F05. [learning](evidence/m4/journey-learning.log), [final](evidence/m4/journey-learning-final.log), [optional](screenshots/m4/J05-optional-before-required-1440.png) | PASS (fixture gating English) |
| J06 | Đọc → đủ 5 dạng → sai/feedback → retry/finalize; history/score/reward đúng hợp đồng | Bài tác giả: MCQ sai lần đầu, hiện đáp án/giải thích, 4 dạng còn lại đúng, MCQ retry đúng. Server `N=5,K=1,9/12=75%`; UI phân biệt điểm 75% và đúng lần đầu 80%, giữ lịch sử sai→đúng; reward 30 XP, 5 gems, 2 cards. Không thay công thức. [log](evidence/m4/journey-learning-final.log), [kết quả](screenshots/m4/result-768.png) | PASS |
| J07 | Reload/replay/redo không nhân completion/XP/gems/card hoặc daily count | Reload giữ completed; redo qua UI hoàn tất lại đủ 5 câu. DB giữ 3 distinct completions và 14 cards; 3 event LESSON_COMPLETION, 100 XP học/quest + 1 XP của đúng 1 lượt SRS; gems 25. Home vẫn `3/3` và quest `1/1`. Finalize replay/idempotency được kiểm trong integration/e2e. [redo](evidence/m4/journey-replay.log), [before](evidence/m4/db-after-learning.json), [after](evidence/m4/db-after-redo.json) | PASS |
| J08 | Chọn ngôn ngữ; due/new/warm-up; reveal/rate/retry đúng scope | En 14 cards, Fr ban đầu 0 rồi 5, Ja 5 sau học; SRS riêng từng ngôn ngữ; en reveal → rate offline → retry thành công đúng 1 lượt; warm-up được mời trước bài khác và skip vào practice; empty Fr được chụp trước khi học Fr. Scheduling ngày/stage/forgotten/timezone qua clock/disposable integration, không giả lập ngày production. [srs](evidence/m4/journey-srs.log), [empty](evidence/m4/journey-empty.log), [fr](evidence/m4/journey-language-fr.log), [ja](evidence/m4/journey-language-ja.log) | PASS (local; phần cuối probe SRS xem HAR-01) |
| J09 | Bài 7/8 đúng chủ đề và khớp nội dung âm thanh thực; kết luận đúng môi trường | Seed demo vào chính journey DB; review thật: Bài 7 `Gọi món` có 0 audio/LISTENING, Bài 8 `Hỏi đường` có LISTENING, transcript chỉ đường và file `unit3-lesson8-directions.mp3`; browser phát được, readyState 4, duration 3,816s, currentTime tăng. Chưa nghe/đối chiếu ngữ nghĩa bằng người; suite cũng ghi `AUDIO_CONTENT_NOT_FULLY_VERIFIED`. [local DB](evidence/m4/demo-lesson7-8.json), [browser](evidence/m4/journey-demo-final.log), [ảnh Bài 8](screenshots/m4/J09-lesson8-review-1440.png). H12 production xem L4/owner, không được đóng bằng local seed | **BLOCKED** (acoustic verification còn NOT_RUN) |
| J10 | Giữ grading #19; ghép token/phiên âm/lang/tên/metadata theo quyết định mới | `cafe` đúng kèm hint `café`; Nhật spaced grammar đúng; reorder result `わたしは田中です` không thêm dấu cách; IPA Fr một cặp `/…/`, Ja reading không bọc; selector `Tiếng Nhật · N5`. Nhưng vùng practice/SRS còn `lang=vi` (M4-F04), tên chưa có tiền tố không nhất quán (M4-F05). NFKC/nháy/CJK/zh có feature/integration coverage. [fr](evidence/m4/journey-language-fr.log), [ja](evidence/m4/journey-language-ja.log), [title](evidence/m4/title-consistency.log) | **FAIL** |
| J11 | Ba viewport, keyboard/modal, reduced motion, 200% zoom, network, contrast đạt UI-05 | Có 33 lượt audit state×viewport, ảnh thực và thao tác; offline retry/zoom/reduced motion/CTA đạt phạm vi nêu ở mục 5. Catalogue tràn 18px, contrast thấp và focus thoát modal: M4-F01..03. Thiết bị/IME/AT thật NOT_RUN. | **FAIL** |
| J12 | Server chặn disabled/paused/ownership/stale publication | Paused English `403 CONTEXT_INACTIVE`; context không thuộc/không tồn tại `404 NOT_FOUND`; learner DISABLED `403 ACCOUNT_INACTIVE`; stale publish `409 REVISION_CONFLICT`. Learner được trả ACTIVE sau ca disposable. E2E thực kiểm unassigned GV B, reassignment/stale tab và isolation learner khác. [security](evidence/m4/journey-security.log), [Character Studio](evidence/m4/e2e-character-studio.log) | PASS |

## 4. Quyết định mới được kiểm riêng (§3.1)

| Ca | Expected | Actual | Kết quả |
|---|---|---|---|
| Title có tiền tố lệch vị trí | Giữ nguyên tên đã đặt, không strip/đổi số | Vị trí 4 vẫn hiện `Bài 99: Gia đình – giữ số Admin`; successor chưa publish không đổi title learner | PASS |
| Title chưa có tiền tố | Thêm số nhất quán ở Catalogue/player/breadcrumb | Catalogue thêm `Bài 1:`, player/breadcrumb không thêm; M4-F05 | FAIL |
| Selector lộ trình | `Ngôn ngữ · mã trình độ` từ dữ liệu khóa; Nhật N5–N1 | En/Fr `· A1`, Nhật `· N5`; JLPT có các level N5–N1 trong DB, không dùng CEFR cho Nhật | PASS |
| Nhật ghép token | Không tự chèn dấu cách | Reorder result/correct answer `わたしは田中です`; không thay token IDs/chấm | PASS |
| `lang` | UI Việt, vùng ngoại ngữ đúng ngôn ngữ | Reader/result/phonetic có metadata; practice và SRS example còn sai; M4-F04 | FAIL |
| Phiên âm | En/Fr đúng một cặp `/…/`; Ja/Zh không bọc | En `/ˈfæməli/`, Fr `/bɔ̃.ʒuʁ/`; Ja `arigatō gozaimasu`; shared tests phủ slash đã có và zh | PASS (zh ở helper/integration) |
| Audio editor/review | Có player, phát được và có lỗi/retry rõ | File fixture phục vụ bằng HTTPS local, DNS map chỉ trong browser; cả hai player readyState 4, currentTime tăng; URL local trả 404 hiện lỗi + nút retry. Không mock response/media | PASS |
| Từ trùng | Cảnh báo, không tự merge dữ liệu | Nhập `family` thấy cảnh báo cùng ngôn ngữ và `Đã có trong bài học này`; không tự tạo/merge. Search Enter/empty/tái dùng Hello cũng chạy thật | PASS |
| Xác nhận nộp | Hủy giữ editable; xác nhận mới POST submit | Hủy giữ bản nháp; xác nhận mới submit; keyboard modal vẫn fail M4-F03 | PASS chức năng / FAIL keyboard |

## 5. UI-05 và ảnh

Audit dùng Playwright điều khiển **Chromium thật**, production Next local và dữ liệu PostgreSQL của stack. Không dùng mock UI/DTO hoặc `route.fulfill` trong bộ ảnh M4. Auth synthetic local là ranh giới an toàn, không phải dữ liệu production. Axe-core `4.13.0` được cài trong `/tmp`, không thêm dependency vào repo. Không có DevTools MCP trong phiên này; dùng browser runtime/DOM và axe để kiểm.

| Màn/trạng thái | 375×812 | 768×1024 | 1440×900 |
|---|---|---|---|
| Home | [ảnh](screenshots/m4/home-375.png) | [ảnh](screenshots/m4/home-768.png) | [ảnh](screenshots/m4/home-1440.png) |
| Catalogue | [ảnh](screenshots/m4/catalogue-375.png) | [ảnh](screenshots/m4/catalogue-768.png) | [ảnh](screenshots/m4/catalogue-1440.png) |
| Lesson reader | [ảnh](screenshots/m4/lesson-reader-375.png) | [ảnh](screenshots/m4/lesson-reader-768.png) | [ảnh](screenshots/m4/lesson-reader-1440.png) |
| Practice trước trả lời | [viewport](screenshots/m4/practice-before-viewport-375.png) | [viewport](screenshots/m4/practice-before-viewport-768.png) | [viewport](screenshots/m4/practice-before-viewport-1440.png) |
| Practice sau trả lời sai | [viewport](screenshots/m4/practice-after-wrong-viewport-375.png) | [viewport](screenshots/m4/practice-after-wrong-viewport-768.png) | [viewport](screenshots/m4/practice-after-wrong-viewport-1440.png) |
| Result | [toàn trang](screenshots/m4/result-375.png), [viewport](screenshots/m4/result-viewport-375.png) | [ảnh](screenshots/m4/result-768.png) | [ảnh](screenshots/m4/result-1440.png) |
| SRS trước reveal | [ảnh](screenshots/m4/srs-before-reveal-375.png) | [ảnh](screenshots/m4/srs-before-reveal-768.png) | [ảnh](screenshots/m4/srs-before-reveal-1440.png) |
| SRS sau reveal | [ảnh](screenshots/m4/srs-after-reveal-375.png) | [ảnh](screenshots/m4/srs-after-reveal-768.png) | [ảnh](screenshots/m4/srs-after-reveal-1440.png) |
| Empty (Fr chưa có card) | [ảnh](screenshots/m4/empty-375.png) | [ảnh](screenshots/m4/empty-768.png) | [ảnh](screenshots/m4/empty-1440.png) |
| Error (SRS rate offline) | [ảnh](screenshots/m4/error-network-375.png) | [ảnh](screenshots/m4/error-network-768.png) | [ảnh](screenshots/m4/error-network-1440.png) |
| Locked (required chưa xong) | [ảnh](screenshots/m4/locked-375.png) | [ảnh](screenshots/m4/locked-768.png) | [ảnh](screenshots/m4/locked-1440.png) |

Ảnh full-page của fixed/sticky overlay có thể ghép cả nền phía sau; dùng ảnh `*-viewport-*` để đánh giá phiên luyện tập thực sự nhìn thấy. **Không mở lại G18 như lỗi overlay.** Bộ full-page là fixture English; bộ practice viewport bổ sung là French, result viewport bổ sung là Japanese, đều trên cùng stack/SHA. [Index 111 PNG và kích thước ảnh](evidence/m4/screenshots.csv). Tất cả người dùng trong ảnh M4 là synthetic; không có email cá nhân, cookie/token hoặc secret cần che. Không sửa/sinh lại nội dung screenshot bằng AI.

| Tiêu chí | Actual / giới hạn | Kết quả |
|---|---|---|
| Không tràn ngang | 32/33 lượt audit không tràn; Catalogue 375px có width 375, scrollWidth 393 | FAIL — M4-F01 |
| Vùng chạm ≥44px | Không phát hiện CTA/link/input/select chính nhỏ hơn 44px trong 33 lượt audit; radio dùng label option lớn, kiểm thao tác thực. Không suy rộng sang mọi control staff/native media | PASS trong bộ màn learner đã audit |
| Focus visible | Focus ring 3px nhìn thấy khi Tab ở Home/Catalogue/reader/practice/result/SRS/empty | PASS phần hiển thị |
| Modal trap/restore | Submit và practice cho Tab tới background; Escape sau khi focus ra ngoài không đóng submit; Escape bên trong đóng nhưng focus về BODY | FAIL — M4-F03 |
| Contrast | Axe + kiểm DOM/screenshot: locked badges 3,66 và 3,54; previous-result label 4,43; XP 1,97; gems 2,54 | FAIL — M4-F02 |
| Reduced motion | `matchMedia(...reduce)=true`; không còn active decorative animation trong các state được đo; vẫn có text/feedback/state | PASS trong các ca đo; [log](evidence/m4/journey-learning-final.log) |
| Zoom browser 200% | Chromium đầy đủ trong Xvfb, profile riêng; `chrome.tabs.setZoom(...,2)` và `getZoom=2`; viewport vật lý 1440×900 → CSS 720×450, DPR≈2. Bảy state Home/Catalogue/reader/result/practice/SRS trước/sau reveal không tràn hoặc mất control theo đo/ảnh viewport; vùng practice cuộn để đến option | PASS trong bộ state desktop; [số đo](evidence/m4/browser-zoom-200.json), [log](evidence/m4/browser-zoom-200-viewport.log), [ảnh practice](screenshots/m4/practice-before-browser-zoom-200-1440.png) |
| Network/error | Offline save/rate giữ dữ liệu; retry thành công, có text; ảnh empty/error/locked đều lấy từ trạng thái thật | PASS |
| Ngôn ngữ | Có vùng ngoại ngữ còn kế thừa vi | FAIL — M4-F04 |
| Thiết bị/AT | iOS Safari, Android thật, bàn phím/IME Nhật-Pháp vật lý, VoiceOver/NVDA hoặc AT/browser pair thật chưa chạy. Chromium và composition tests không thay thế thiết bị thật | NOT_RUN |

Các bản log trong PR được che connection secret nếu có và chuẩn hóa whitespace cuối dòng/EOF; không đổi kết quả hoặc dữ liệu assertion. Năm báo cáo L4 giữ nguyên byte.

Raw audit: [21 lượt learning](evidence/m4/ui-metrics-learning.json), [9 lượt SRS/error](evidence/m4/ui-metrics-srs.json), [3 lượt empty](evidence/m4/ui-metrics-empty.json). Axe không chứng minh WCAG toàn diện. Chủ dự án chưa review toàn bộ ảnh/thao tác, **UI chưa ACCEPTED**.

## 6. H/G cập nhật tại SHA nghiệm thu (§17)

Trạng thái dưới đây thay thế trạng thái **đầu vào lịch sử** trong L4 cho phạm vi local. Cột public giữ riêng; merge code không đồng nghĩa đã nghiệm thu public.

| Mã | Local tại `5e834293e0ce21a6dd14452c6ad75224aa45a0fb` | Evidence / việc còn lại | Public |
|---|---|---|---|
| H1 | LOCAL_PASS | J05 optional xen required, URL/gating + integration | PUBLIC_NOT_VERIFIED |
| H2 | LOCAL_FAIL | Tiền tố sẵn có giữ đúng; thiếu số ở player/breadcrumb khi title chưa có tiền tố — M4-F05 | PUBLIC_NOT_VERIFIED |
| H3 | LOCAL_PASS | Nhãn bản sửa đổi #1..#5 gắn revision; save không dùng rowVersion làm phiên bản sản phẩm | PUBLIC_NOT_VERIFIED |
| H4 | LOCAL_PASS | Editor có chương/khóa; review có context; ảnh J01/J03 | PUBLIC_NOT_VERIFIED |
| H5 | LOCAL_PASS (browser) | Enter tìm Hello, empty state + gợi ý tạo mới; IME vật lý NOT_RUN | PUBLIC_NOT_VERIFIED |
| H6 | LOCAL_PASS format tối thiểu | J10 + component/helper; kana/furigana field mới DEFERRED | PUBLIC_NOT_VERIFIED |
| H7 | NOT_RUN | Không có bench L3 trong Git tree; 0 warm samples, median/p95 chưa đo. Không suy diễn từ test duration | PUBLIC_NOT_VERIFIED |
| H8 | LOCAL_PASS chức năng / LOCAL_FAIL keyboard | J03 confirmation hủy/xác nhận; M4-F03 | PUBLIC_NOT_VERIFIED |
| H9 | LOCAL_PASS | Actor `Quản trị viên` trong review history, J03/J04/J09; fallback component tests | PUBLIC_NOT_VERIFIED |
| H10 | LOCAL_PASS | J06: điểm 75%, đúng lần đầu 80%, ordered first-wrong/retry; công thức giữ nguyên | PUBLIC_NOT_VERIFIED |
| H11 | LOCAL_PASS | Reload/redo vẫn completed, không giả sửa reading state; J07 | PUBLIC_NOT_VERIFIED |
| H12 | LOCAL_SEED_PASS / AUDIO_CONTENT_NOT_FULLY_VERIFIED | Local Bài 7/8 mapping đúng; production lệch seed theo L4, chờ owner sửa revision/audio | AWAITING_OWNER, không FIXED |
| H13 | LOCAL_PASS | 3 distinct lessons sau redo, Home 3/3; timezone gates | PUBLIC_NOT_VERIFIED |
| H14 | DEFERRED_OWNER | Không cấu hình SMTP/đổi mật khẩu; giữ nguyên disposition | DEFERRED_OWNER |
| G1 | LOCAL_PASS | Thiếu dấu `cafe` → đúng + hint café, J10/feature | PUBLIC_NOT_VERIFIED |
| G2 | LOCAL_PASS | Straight/curly apostrophe feature + French fixture | PUBLIC_NOT_VERIFIED |
| G3 | LOCAL_PASS | CJK whitespace feature/integration; spaced Japanese grammar browser | PUBLIC_NOT_VERIFIED |
| G4 | LOCAL_PASS | NFKC feature; không coi hira/kata tự tương đương | PUBLIC_NOT_VERIFIED |
| G5 | LOCAL_PASS | J10 Nhật kết quả ghép liền; zh helper/integration | PUBLIC_NOT_VERIFIED |
| G6 | LOCAL_PASS format / DEFERRED field mới | IPA en/fr một cặp slash; ja/zh không thêm slash; kana/furigana để gói C | PUBLIC_NOT_VERIFIED / DEFERRED |
| G7 | LOCAL_FAIL | Practice và SRS example lang sai; M4-F04 | PUBLIC_NOT_VERIFIED |
| G8 | DEFERRED_OWNER | Catalogue kana/kanji và writing rollout không được nhận trong release này | DEFERRED |
| G9 | LOCAL_PASS player/error | Editor/review phát audio local thật, lỗi 404 có retry; upload deferred; acoustic J09 chưa đủ | PUBLIC_NOT_VERIFIED |
| G10 | LOCAL_PASS | Result GRAMMAR giữ câu hỏi, sourceSentence ở dòng riêng; Fr/Ja/En J06/J10 | PUBLIC_NOT_VERIFIED |
| G11 | LOCAL_PASS | Chọn Fr/Ja ra card đúng scope, J08 và SRS gates | PUBLIC_NOT_VERIFIED |
| G12 | LOCAL_PASS | Card mới due ngay; warm-up được mời và skip; due/schedule integration | PUBLIC_NOT_VERIFIED |
| G13 | LOCAL_PASS | Selector En/Fr A1, Nhật N5; URL contextId của onboarding đúng context mới | PUBLIC_NOT_VERIFIED |
| G14 | LOCAL_PASS | Form/server course-language guards qua feature/component; fixture Fr/Ja thật | PUBLIC_NOT_VERIFIED |
| G15 | LOCAL_FAIL | Cùng lỗi consumer H2 — M4-F05; unit tests helper pass không đóng consumer bug | PUBLIC_NOT_VERIFIED |
| G16 | LOCAL_PASS cảnh báo | J01 family trùng cùng ngôn ngữ; không auto merge; chuẩn hóa candidate có feature/component | PUBLIC_NOT_VERIFIED |
| G17 | LOCAL_PASS metadata / DEFERRED placement | Ngôn ngữ/trình độ có dữ liệu thật; placement thật ngoài scope | PUBLIC_NOT_VERIFIED / DEFERRED |
| G18 | NOT_A_BUG | Giữ kết luận cũ; ảnh viewport xác nhận fixed overlay | Không mở lại |

### H7 — bằng chứng đo hiệu năng

Đã tìm file/script bench trong Git tree tích hợp và thư mục `scripts`, `lingora-admin/tests`; không thấy benchmark Save/Submit của L3. Điều kiện “nếu bench có trong repo” không được đáp ứng; không tự viết bench hoặc sửa code để tạo số đo trong vai trò chỉ nghiệm thu.

| Thao tác | Mẫu warm thực tế | Median | p95 | Ngưỡng đã chốt | Kết luận |
|---|---|---|---|---|---|
| Save | 0/20 | — | — | ≤2s / ≤5s | NOT_RUN — M4-E01 |
| Submit | 0/20 | — | — | ≤2s / ≤5s | NOT_RUN — M4-E01 |

Các thao tác save/submit chức năng đã chạy nhưng không phải benchmark đại diện. Không dùng thời lượng suite hoặc số cũ 6–14s làm số đo mới. **Nếu có số đo bổ sung sau này, đó vẫn là LOCAL trên DB disposable, KHÔNG phải production/SLO production.**

## 7. Finding mới — không tự sửa

Mọi finding bên dưới tái hiện tại **`5e834293e0ce21a6dd14452c6ad75224aa45a0fb`**. Severity P2 là đánh giá tác động của lượt nghiệm thu; không hạ requirement để cho release qua. Trạng thái sản phẩm: **OPEN**, chưa sửa/retest.

| Mã / loại / mức | Bước tái hiện | Expected → Actual | Evidence |
|---|---|---|---|
| **M4-F01 / sản phẩm / P2** | Seed English required 1/3/4 và optional 2, mở Catalogue ở 375×812 khi bài 4 còn khóa | Không tràn trang → `innerWidth=375`, `documentElement.scrollWidth=393`; lesson card tràn 18px | [ảnh](screenshots/m4/catalogue-375.png), [DOM/axe](evidence/m4/ui-metrics-learning.json) |
| **M4-F02 / sản phẩm / P2** | Xem Catalogue có locked badges; trả lời sai 1 câu; finalize bài ở ba viewport | Text thường ≥4,5:1, text lớn ≥3:1 → locked `Chưa đọc` 3,66; locked reason 3,54; `#feedbackPrevLabel` 4,43; `#celebrationTotalXp` 1,97, `#celebrationGems` 2,54 | [audit](evidence/m4/ui-metrics-learning.json), [kết quả](screenshots/m4/result-768.png), [feedback](screenshots/m4/practice-after-wrong-viewport-375.png) |
| **M4-F03 / sản phẩm / P2** | Mở submit confirmation, Tab từ Cancel→Confirm→Tab; hoặc mở practice rồi Tab qua option/submit | Focus ở trong dialog, Escape đóng và trả về opener → focus tới BODY/sidebar/header/reader phía sau; Escape khi focus ngoài submit không đóng; Escape bên trong đóng nhưng focus về BODY | [keyboard](evidence/m4/journey-keyboard.log), [Escape/restore](evidence/m4/modal-focus-detail.log), [ảnh](screenshots/m4/H8-modal-tab-escape-1440.png) |
| **M4-F04 / sản phẩm / P2** | Mở bài Fr/Ja, vào practice MCQ/FILL_BLANK/REORDER/GRAMMAR; SRS reveal và đọc computed closest `[lang]` | Vùng ngoại ngữ/input đúng fr/ja, UI Việt vi → Japanese option `おはようございます`, câu mẫu/input/token kế thừa vi; French sentence/input cũng vi; `.srs-example` `“Bonjour ! …”` / `“ありがとうございます。”` vẫn vi. Result/reader đã có một phần không thay cho coverage thiếu này | [fr DOM](evidence/m4/journey-language-fr.log), [ja DOM](evidence/m4/journey-language-ja.log), [Ja MCQ](screenshots/m4/J10-ja-MCQ-1440.png) |
| **M4-F05 / sản phẩm / P2** | Publish lesson position 1, title `Chào hỏi M4 ja` không có tiền tố; mở Catalogue rồi player | Cùng `Bài 1: Chào hỏi M4 ja` ở các bề mặt → Catalogue có tiền tố, `#lessonHeading` và breadcrumb chỉ `Chào hỏi M4 ja`. Title đã có `Bài 99:` thì giữ đúng | [DOM](evidence/m4/title-consistency.log), [Catalogue](screenshots/m4/H2-ja-catalogue-1440.png), [player](screenshots/m4/H2-ja-player-1440.png) |
| **M4-E01 / thiếu artifact nghiệm thu** | Tìm bench L3/Save/Submit trong source tree tích hợp trước bước H7 | Cần bench để lấy 20 warm samples/thao tác → không có; median/p95 NOT_RUN. Không khẳng định sản phẩm chậm | [inventory](evidence/m4/h7-bench-inventory.log); chờ bàn giao benchmark/evidence |
| **M4-E02 / thiếu evidence nội dung** | J09: đối chiếu lesson snapshot, URL/transcript rồi phát file Bài 8 | Cần xác nhận lời nghe thực khớp đáp án → mapping/HTTP/metadata/playback đạt; acoustic semantic review chưa chạy. Không đóng H12 production | [demo browser](evidence/m4/journey-demo-final.log), [suite tự ghi giới hạn](evidence/m4/integration-demo.log) |
| **M4-T01 / tooling dependency / cần đánh giá** | `npm ci`, sau đó `npm audit --json` | Cần disposition rõ cho cảnh báo → 3 high entries (`effect`, `@prisma/config`, `prisma`) từ một advisory ReDoS `GHSA-7589-6fvf-x4pw`; chưa đánh giá reachability production, không chạy audit fix | [audit](evidence/m4/npm-audit.json) |
| **HAR-01 / probe bổ sung, không phải regression gate** | Các lần đầu chạy probe ngoài repo dùng giả định cũ: click dirty-submit đang disabled; đối chiếu sample IDs cố định; đọc/đổi language khi practice/SRS còn session; tạo context thứ ba ACTIVE; tìm nút successor bằng tên trả-bài | Probe timeout/assert do không theo contract/selector/ID hiện tại → dùng ID service trả về, đúng nút/flow và pause context theo quy định để hoàn tất ca. Không sửa test hoặc code repo; giữ log lần đầu và log tiếp tục, không ghi gate/product FAIL từ các timeout này | [author lần đầu](evidence/m4/journey-author.log), [learning lần đầu](evidence/m4/journey-learning.log), [resume](evidence/m4/journey-learning-resume.log), [cap context](evidence/m4/journey-onboard-ja.log), [SRS session](evidence/m4/journey-srs.log), [audio selector](evidence/m4/journey-audio.log) |

Lỗi bind cổng HTTPS 443 trong setup media là hạn chế quyền local, đã dùng server 3443 và DNS-map trong Chromium cho URL `https://acceptance.lingora.test/…` hợp lệ; không thay validation của sản phẩm. Ảnh zoom dùng browser zoom thật; ảnh thử CSS zoom không đưa vào PR. Full-page screenshot của fixed overlay được bổ sung ảnh viewport để tránh kết luận nhầm G18.

## 8. M5/M6 và hồ sơ L4

Năm báo cáo L4 được đưa vào PR **nguyên văn** từ các file untracked tại `lingora-workspace`; [hash/size provenance](evidence/m4/l4-provenance.json). Đây là snapshot lịch sử ở baseline `9dccaa8`, **không phải trạng thái PR/local mới nhất**. Các tên workspace `@lingora/lingora-web` trong mẫu L4 là lệnh cũ; lượt này dùng đúng root script / `-w lingora-web` như bảng gate.

| Hồ sơ | Disposition hiện tại |
|---|---|
| [DOC-01 findings reconciliation](2026-11-27-doc01-findings-reconciliation.md) | Giữ lịch sử; ma trận local hiện hành là mục 6 của báo cáo này |
| [CNT-01 Bài 7/Bài 8](2026-11-27-cnt01-lesson7-lesson8-audit.md) | **Bài 7 production: AWAITING_OWNER** sửa dữ liệu/revision qua workflow; agent không sửa hoặc reset production |
| [DOC-02 ảnh/scripts index](2026-11-27-doc02-media-and-scripts-index.md) | Giữ index cũ; ảnh M4 mới ở `screenshots/m4/`, có CSV riêng; không đem bộ ảnh mock PR #24 làm evidence M4 |
| [DOC-03 worktree inventory](2026-11-27-doc03-worktree-inventory.md) | Snapshot cũ được giữ; [inventory tại lượt này](evidence/m4/worktrees.txt) bổ sung worktree mới. Cleanup **AWAITING_OWNER**, không xóa worktree |
| [ACC-04 Slice 12 owner evidence](2026-11-27-acc04-slice12-owner-evidence.md) | **OWNER_REPORTED / EVIDENCE_PENDING**; chờ chủ dự án điền ngày/deployment/SHA/evidence; local confirmation đã chạy lại, không tự đổi thành PUBLIC_PASS |

Các phạm vi phải giữ riêng khi bàn giao:

- **PUBLIC_NOT_VERIFIED — chờ deploy và xác minh deployment/SHA.** Các HTTP GET audio public của suite/J09 chỉ chứng minh asset truy cập được, không chứng minh deployment ứng dụng hoặc #19/#20 đã được nghiệm thu public.
- **Bài 7 production — AWAITING_OWNER.** L4 chẩn đoán dữ liệu seed cũ; local source/seed đúng không sửa được revision production đang chạy.
- **Slice 12 — OWNER_REPORTED / EVIDENCE_PENDING.** Không đăng ký thêm email thật, không SMTP/resend thật hoặc cấu hình provider.
- **Writing SRS — FLAG_OFF / PUBLIC_NOT_ACCEPTED.** Stack không bật `WRITING_SRS_ENABLED=true`; theo source mặc định không phát writing sessions. Character Studio browser gate đạt không đồng nghĩa writing rollout được chấp nhận.
- **Kana/furigana + G8 — DEFERRED_OWNER.** G6 chỉ đóng format tối thiểu; chưa nhận thêm field/kho ký tự product flow.
- **Public SRS nhiều ngày, thiết bị thật/IME/AT — NOT_RUN.** Clock/disposable tests không thay ngày thật hoặc thiết bị thật.
- **UI owner visual review — AWAITING_OWNER.** Đã có ảnh/thao tác và findings; chưa dùng nhãn UI ACCEPTED.

Kết luận bàn giao: **Release A LOCAL_FAIL; G5/G6-format/G13 LOCAL_PASS; G7 LOCAL_FAIL; H7 NOT_RUN; J09 AUDIO_CONTENT_NOT_FULLY_VERIFIED; PUBLIC_NOT_VERIFIED; H12 production AWAITING_OWNER; Slice 12 EVIDENCE_PENDING; Writing SRS FLAG_OFF; kana/furigana + G8 DEFERRED; cleanup AWAITING_OWNER.**

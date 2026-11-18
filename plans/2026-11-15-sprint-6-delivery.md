# Sprint 6 — Gói triển khai Antigravity

Baseline đã nghiệm thu `4bbdc23`. Dùng [spec Sprint 6](2026-11-14-sprint-6-script-learning-engine.md) làm hợp đồng. Giao một gói mỗi lượt. Anti chạy kiểm tra của gói và lưu kết quả ở `plans/evidence/sprint-6/<package>/`. Codex review diff và xác minh gate trước khi bắt đầu gói phụ thuộc. Database và browser đều dùng fixture local. Chỉ Codex quản lý Git.

| Gói | Cần trước | Đầu ra và gate |
| --- | --- | --- |
| S6-01 — Catalogue ký tự | Sprint 5 | Chỉ `WritingCharacter`, migration, validator và lookup nội bộ theo language. PostgreSQL kiểm tra ownership của quan hệ, FK, unique, RLS và Unicode. |
| S6-02 — Dữ liệu nét | S6-01 | `CharacterStrokeData`, validator, fixture có provenance và seed chạy lại. Kiểm tra version, path, điểm và số nét. |
| S6-03 — Liên kết từ vựng | S6-01 | `VocabularyCharacter`, kiểm tra glyph, ngôn ngữ và thứ tự; fixture lặp glyph và `日本語`. |
| S6-04a1 — Hợp đồng CHARACTER | S6-03 | Thêm enum và codec nội dung. Test shape, tách input và snapshot, giữ reader legacy. |
| S6-04a2 — Lưu nháp CHARACTER | S6-04a1 | Studio nhận author input, dựng snapshot trong transaction và lưu revision. Kiểm tra assignment, stale request và copy successor. |
| S6-04a3 — Duyệt và xuất bản CHARACTER | S6-04a2 | Submit và publish kiểm tra canonical block, reference và pin dữ liệu nét. |
| S6-04b1 — Teacher chọn CHARACTER | S6-04a3 | Picker theo ngôn ngữ bài được phân công, chỉnh bốn cờ, lưu và tải lại draft. |
| S6-04b1p — Phân trang danh mục Teacher | S6-04b1 | Tìm và chọn được kết quả trang sau, giữ phạm vi course/assignment và loại phản hồi của truy vấn đã hết hiệu lực. |
| S6-04b2 — Admin xem CHARACTER | S6-04a3 | Hiển thị snapshot của đúng bản nộp trong màn duyệt. Giữ thứ tự, nhận xét theo block và quyền Admin hiện có. |
| S6-04b3 — Learner xem CHARACTER | S6-04a3 | DTO và render snapshot đã xuất bản với các trường được phép. Kiểm tra cờ hiển thị, draft isolation và bài bị khóa. |
| S6-04b4 — Learner đọc mẫu nét | S6-04b3, S6-02 | GET ký tự theo `blockKey` của bài đã xuất bản. Kiểm tra selector, quyền bài học, cờ và pin version mẫu. |
| S6-04b5 — Ký tự của từ vựng | S6-04b4, S6-03 | Mapping chốt theo revision và nhánh GET theo `lessonVocabularyLinkId`. Kiểm tra từ cũ chưa có mapping và từ vựng không thuộc bài. |
| S6-05 — Chấm nét | S6-02 | Module grader deterministic. Kiểm tra ba band, thiếu/thừa, đảo hướng/thứ tự và tọa độ lỗi. |
| S6-06a — Bắt đầu phiên viết | S6-04b3, S6-04b5, S6-05 | Schema phiên, POST start và pin nguồn/version. Kiểm tra quyền, lỗi stale và replay. |
| S6-06b — Nộp và kết thúc | S6-06a | Attempt API và complete, grade server, receipt, giới hạn input. PostgreSQL kiểm tra hai tab, rollback và stale. |
| S6-07 — Màn luyện viết | S6-06b, S6-04b4 | Xem mẫu, đồ nét, tự viết và đối chiếu. Chromium desktop/touch, retry mất response và keyboard. |
| S6-08a — Lộ trình Nhật | S6-07 | Fixture xuất bản theo trình tự tiếng Nhật và kiểm thử unlock. |
| S6-08b — Lộ trình Trung | S6-07 | Fixture xuất bản theo trình tự tiếng Trung, pinyin, thanh điệu, media và kiểm thử unlock. |
| S6-09 — Ôn WRITING | S6-07, ADR được chốt | Lịch WRITING riêng theo quyết định scheduler/rating. Giữ riêng lịch MEANING, bằng chứng và XP. |
| S6-10 — Nghiệm thu Sprint | Các gói triển khai | Local fresh/upgrade, PostgreSQL/Chromium cả hai ngôn ngữ, regression Sprint 1–5, ghi rõ phạm vi ADR. |

## Kế hoạch chi tiết để khép các mục còn lại — 2026-11-17

Writing slice S6-07 đã qua review độc lập. Phần còn lại là S6-08a Nhật, S6-08b Trung, ADR và gói triển khai có điều kiện S6-09, rồi nghiệm thu S6-10. Baseline nâng cấp là commit Sprint 5 đã nghiệm thu `4bbdc23`. Chỉ dùng PostgreSQL disposable, Chromium local và dữ liệu synthetic. Working tree đang có nhiều thay đổi chưa commit; giữ nguyên mọi thay đổi ngoài phạm vi từng gói, không reset/clean/stage/commit/push.

### Thứ tự và quyền sở hữu

| Bước | Owner | Phụ thuộc | Đầu ra và tiêu chí nghiệm thu |
| --- | --- | --- | --- |
| S6-08a.1 — Hoàn tất fixture và gating Nhật (**PASS — Sol 6.1 High, 2026-11-17**) | Codex implementation | S6-07 | Hoàn thiện fixture/test PostgreSQL Nhật đang có, nối runner và lưu evidence. Xuất bản đủ sáu giai đoạn qua Teacher save → submit → Admin approve → publish; kiểm tra Home/onboarding chọn course eligible, bài PLANNED cuối hiện `COMING_SOON`, course riêng chưa đủ bài bị loại với `NO_ELIGIBLE_CURRICULUM`, đọc bài qua mutation service không tự mở bài sau, và core completion thật mới mở bài kế. Đối chiếu `LessonCompletion.firstAttemptId` cùng revision với attempt đã tạo. Gọi detail GET API cho lesson khóa, PLANNED và UUID hợp lệ nhưng không tồn tại; kiểm tra status, JSON lỗi an toàn và không có nội dung bài. Fixture chỉ truy vấn identity synthetic của chính nó, không sửa ngôn ngữ/framework chuẩn, và chạy lại giữ identity cả sáu publication. |
| S6-08a.2 — E2E production Nhật | **PASS — Codex, 2026-11-17** | 08a.1 PASS | Tái dùng production Chromium writing harness và Japanese curriculum fixture. `npm run test:e2e:writing` build thành công và cả 2 E2E pass; luồng từ Home thử URL lesson đang khóa, Hiragana demo → trace → freehand → server grade → complete session, xác nhận session/revision/block/glyph/stroke-version, không có completion/unlock/reward do luyện viết; core exercise sau đó mở Katakana và đọc được route. Chi tiết tại `plans/evidence/sprint-6/s6-08a/codex-e2e.md`. |
| S6-08b.1 — Fixture và gating Trung | **PASS — Codex, 2026-11-17** | 08a.2 và gate cục bộ PASS | `npm run test:integration:chinese` PASS (1/1). Fixture xuất bản sáu giai đoạn Pinyin/thanh điệu → Hanzi cơ bản → thành phần → ký tự → từ → câu, cùng bài thứ bảy `PLANNED`; dùng workflow publication hiện có và dữ liệu nét tự tạo có provenance. Kiểm tra onboarding/Home path, course không eligible, API direct detail trả lỗi an toàn cho bài khóa/PLANNED/missing, hoàn tất core exercise mới mở bài kế, public Hanzi có pinyin dấu thanh/nghĩa/số nét/stroke version, mapping `人口` và audio `MEDIA` qua URL HTTPS được validator hiện tại chấp nhận. Chạy lại fixture giữ identity sáu publication. Không sửa validator. Evidence tại `plans/evidence/sprint-6/s6-08b/codex-postgres.md`. |
| S6-08b.2 — E2E production Trung | **PASS — Codex, 2026-11-17** | 08b.1 và gate cục bộ PASS | `npm run test:e2e:writing` build thành công và 3/3 production Chromium tests pass. Luồng Trung kiểm tra URL khóa, pinyin dấu thanh, bấm phát mẫu `mā` WAV tự tổng hợp local qua URL HTTPS fixture, Hanzi glyph/reading/meaning/stroke count, demo → trace → freehand → server grade → complete, pinned revision/block/character/stroke version, không reward/unlock do luyện viết, core completion mới mở bài component. Kiểm tra layout ở 360px và 390px: không tràn ngang, modal nằm trong viewport. Audio fixture kiểm chứng playback/formant-synthesized tone; không đánh giá giọng đọc tự nhiên. Evidence tại `plans/evidence/sprint-6/s6-08b/codex-e2e.md`. |
| S6-09.1 — Đề xuất ADR cho WRITING SRS | **PASS — PO approval, 2026-11-17** | 08b.2 và gate cục bộ PASS | PO duyệt proposal ngày 2026-11-17; quyết định ghi tại ADR-045. Bốn rating + scheduler WRITING riêng, card Vocabulary và state theo skill; ký tự theo thứ tự từ, không tạo SRS cho ký tự độc lập. |
| S6-09.2 — WRITING SRS implementation | **Implemented — focused gates passed, 2026-11-18** | ADR-045 | WRITING FSRS, four explicit ratings and idempotent scheduling/XP are implemented. The integrated review found six issues to resolve in S6-10.2. Prior test evidence is in [S6-10 evidence](evidence/sprint-6/s6-10/codex.md). |
| S6-10.1 — Migration fresh/upgrade | **PASS — Codex, 2026-11-18** | 08a/b; 09.2 approved | Fresh deployment passed in disposable PostgreSQL integration runs. Staged upgrade from baseline `4bbdc23` passed: 37 original tables/columns and grants compared unchanged; five writing tables have RLS/FORCE RLS and no direct `anon`/`authenticated` grants. Reproducible harness: `plans/evidence/sprint-6/s6-10/upgrade-check.mjs`. |
| S6-10.2 — Regression và nghiệm thu cuối | **PASS — Codex follow-up, 2026-11-18** | 10.1, 08a.2/08b.2, 09.2 | After the initial follow-up pass, Codex re-review found unverified legacy WRITING queue order and stale POST replay state. Fixed and checked with the current SRS PostgreSQL, ReviewView, route/scheduler, feature, component, typecheck, production build, and writing Chromium gates. |

**Sol review history 08a.1:** lượt đầu FAIL dù test 4/4; Codex sửa identity fixture, completion pin, mutation-service reading, API error JSON cho locked/PLANNED/missing và identity đủ sáu publication. Follow-up Sol 6.1 High xác nhận PASS, hai cách gọi test wrapper đều 4/4. Evidence chi tiết tại `plans/evidence/sprint-6/s6-08a/anti.md`. Từ đây giữ gate cục bộ theo từng gói nhưng dồn senior review tích hợp về sau S6-10.2.

### DAG và nhịp dispatch

```text
S6-07 PASS → 08a.1 PASS → 08a.2 → 08b.1 → 08b.2 → 09.1 ADR proposal → PO decision
                                                                    ├─ approve → 09.2 ─┐
                                                                    └─ defer/decline ──┤
08a + 08b + 09.2 → 10.1 migration PASS → initial 10.2 regression PASS → Sol 6.2 High review FAIL
10.2 repair → focused checks → final regression → Sol 6.2 High follow-up acceptance review
```

**Local checkpoint 2026-11-17:** S6-08a.2 passes production Chromium E2E with the published Japanese fixture. Writing-session completion leaves lesson completion, XP, achievements, SRS cards, and the next lesson unchanged; completing the Hiragana core exercise awards XP and unlocks the Katakana route.

**Local checkpoint 2026-11-17:** S6-08b.1 passes its isolated PostgreSQL suite (1/1), including the six-stage Chinese progression, current media URL validator, public pinyin/stroke projection, planned/locked gates, eligible onboarding recommendation, and core-completion unlock. No validator or application code changed.

**Local checkpoint 2026-11-17:** S6-08b.2 production build and Chromium suite pass 3/3. The Chinese learner path plays a local formant-synthesized mā tone sample through the HTTPS fixture, grades a Hanzi writing attempt with the expected revision/block/stroke-version pins, and unlocks the next lesson only after core completion; widths 360 and 390 CSS px have no horizontal overflow.

### S6-10.2 — WRITING SRS repair and final acceptance

Sol 6.2 High inspected the current uncommitted Sprint 6 work against [ADR-045](2026-11-17-s6-09-writing-srs-decision-proposal.md). All six findings still apply. The attempt route tests cover rejection, the WRITING component test fulfills its own mock responses, and the real PostgreSQL test calls the service directly with catalogue mappings. That test moves MEANING into the future after WRITING state already exists. The production SRS harness covers MEANING and the production writing harness covers lesson practice. The [initial run evidence](evidence/sprint-6/s6-10/codex.md) predates the integrated review.

Codex's later review found that new attempts still trusted the stored character order and successful WRITING POST replays could leave the browser on an old response. The earlier two-tab test sent requests sequentially, and the cross-skill check ran after session completion. The final checks now use the published pin, simultaneous PostgreSQL connections, an active same-card MEANING entry, authoritative GET after successful WRITING actions, and API/receipt assertions in the production browser test.

Codex owns the following slices in order. Use disposable PostgreSQL and local Chromium with synthetic users. Keep the vocabulary-card identity, Policy B, WRITING FSRS and four explicit ratings, reward idempotency, and no raw-stroke persistence as acceptance invariants. The existing schema and migrations suffice.

1. **S6-10.2a — Published eligibility.** In `lingora-web/src/server/srs/session-service.ts`, resolve each owned card through its `sourceLessonVocabulary` and use that link's `displaySnapshot.characters`. Require matching vocabulary and language, a revision with `publishedAt`, and status `PUBLISHED` or `ARCHIVED`. Republish archives the prior revision while the card still points to its original link. Read all snapshot entries in ascending unique positive `position` order, retaining repeated glyphs and original position gaps. Require a positive pinned version, matching language and exact `CharacterStrokeData` version/count, and valid geometry for every template. Reuse the grader's template validation at eligibility and submission so missing or invalid stored content cannot be graded. Apply the same eligibility to initialization and new WRITING queue selection. The Chinese fixture's `zh` label contains the target `人口`, so exclude labels that echo the answer from the pre-reveal API prompt. Test catalogue-only mappings, catalogue edits after publication, archived publication, missing/draft/approved-only source, empty snapshot, and missing/version-mismatched or malformed templates. Seed snapshots before publication in the PostgreSQL fixtures. Gate `npm run test:integration:srs`.
2. **S6-10.2b — Independent initialization.** After 10.2a, find eligible enrolled cards for the opted-in learner and optional context independently of `SrsCard.dueAt` and the MEANING limit. Create each missing WRITING row once using the database clock and the existing one-day initial interval. Keep `(cardId, skill)` duplicate handling and merge independently due WRITING and MEANING entries in the existing due order. Apply the session limit after eligibility so invalid due WRITING entries cannot crowd out an eligible one. Test future MEANING on first initialization, repeat/concurrent start, context and learner isolation, and unchanged MEANING state and dates. Prove a due WRITING item enters the queue while MEANING is still future. Gate `npm run test:integration:srs`.
3. **S6-10.2c — Attempt request and character identity.** Share one strict body schema across the attempt route and service, with `cardId`, `operationKey`, one-based `characterNumber`, and `candidateStrokes`. `ReviewView.tsx` captures the prompt ordinal with the original pending attempt and puts `sessionId` in the URL. Under the existing account/session locks, bind the receipt and fingerprint to the card, attempted ordinal, pinned character position, and strokes. Same-key replay for the same target and strokes returns the saved receipt. Before new work, compare the stored characters and receipt prefix with the current published pin, while allowing legacy entries whose missing positions can be inferred from their order. Changing ordinal, card or strokes for an existing key gives `OPERATION_CONFLICT`. A new key for a stale ordinal gives `STALE_OPERATION` with no new receipt. Use the reconciled locked row's index and version for queue reads, writes, and response progress. Preserve the Sprint 5 string queue shape. Route/component checks assert the precise request shape and reject missing/invalid ordinals or extra `sessionId`. PostgreSQL checks send two different keys concurrently on separate connections, reuse a key at another ordinal, submit consecutive repeated glyphs, reconcile overlapping sessions, and reject queue characters that no longer match their published pin. Gates for routes, ReviewView and `npm run test:integration:srs`.
4. **S6-10.2d — Rollout continuity.** After 10.2c, use the same rollout check in queue reconciliation and advancement. Skip disabled WRITING slots while retaining queue positions, saved receipts, and FSRS state. Preserve exact replay of committed operations. After any successful WRITING attempt or rating, including a saved replay, refresh the current session before displaying its state. Check adjacent WRITING/MEANING entries for the same card so a stale WRITING action cannot mutate MEANING. Toggle the flag and allowlist between requests in tests. Verify receipt replay, unchanged completed count for skipped slots, no new WRITING attempt/schedule/XP, MEANING review and Finish, and eligibility of the saved WRITING state on re-enable. Cover a WRITING-only queue becoming completed and client recovery through GET without a retry loop. Gates for ReviewView below and `npm run test:integration:srs`.
5. **S6-10.2e — Canvas limits and retry.** In `WritingSrsAttempt.tsx`, enforce up to 128 strokes, 2–256 points per committed stroke and at most 4,096 total points during capture, including rapid moves and pointer cancellation. Keep input normalized and finite and let the learner clear the canvas at the limit. Retain the route's 256 KiB request cap. In `ReviewView.tsx`, a definitive 400 such as `VALIDATION_ERROR` or `INVALID_STROKE_GEOMETRY` releases the canvas and clears that operation and its retry callback. Redrawing and resubmitting creates a fresh key. An ambiguous network, unreadable response, or server failure keeps the original key, ordinal and strokes for exact retry, with drawing and rating disabled while the outcome is uncertain. Component tests hit and exceed all three drawing limits, exercise edit/resubmit after 400, and simulate a lost response followed by byte-equivalent replay. Gates for routes and ReviewView below.
6. **S6-10.2f — Enabled production Chromium.** After 10.2a–e, add the real `/review` flow to `lingora-web/tests/feature/writing-practice-e2e.test.mjs`. Reuse its production Next server, synthetic auth and the genuinely published Chinese `人口` link. Seed an enrolled card, enable only its synthetic learner in the server environment, and make its initialized WRITING state due while MEANING is future. Use the actual browser canvas, attempt and review routes, and PostgreSQL. Assert the full initial API response and intermediate prompt hide every answer glyph, each ordinal returns 200, both persisted receipts match the right character, the final response reveals glyphs and feedback, and the learner can select any of the four ratings. Verify the FSRS operation and one SRS XP event. Include a server-committed attempt with a response lost at the browser and verify retry adds no receipt. Keep the existing production MEANING and Japanese/Chinese lesson-writing checks. Gate `npm run test:e2e:writing`.

**Focused commands from the repo root**

```sh
node --experimental-strip-types --experimental-test-module-mocks --import ./lingora-web/tests/feature/harness/server-only.mjs --test lingora-web/tests/feature/srs-sessions-routes.test.mjs
node --experimental-test-module-mocks --import ./lingora-web/tests/feature/harness/server-only.mjs lingora-web/tests/feature/review-components.test.mjs
npm run test:integration:srs
npm run test:e2e:writing
```

**Final regression and acceptance.** Run `npm run db:product:validate`, `npm run db:product:generate`, `npm run typecheck`, `npm run build`, `npm run test:feature`, `npm run test:components` and `git diff --check`. Rerun the disposable PostgreSQL gates `npm run test:integration:studio`, `npm run test:integration:lessons`, `npm run test:integration:practice`, `npm run test:integration:onboarding`, `npm run test:integration:srs`, `npm run test:integration:gamification`, `npm run test:integration:writing`, `npm run test:integration:japanese`, and `npm run test:integration:chinese`. Rerun `npm run test:e2e:learning`, `npm run test:e2e:onboarding`, `npm run test:e2e:gamification`, `npm run test:e2e:srs` and `npm run test:e2e:writing` against the repaired code. Fresh deployment is covered by the disposable database runners. Keep the staged-upgrade evidence from baseline `4bbdc23` if the migration/schema files are unchanged. If those files change, rerun `S6_REPO="$PWD" node plans/evidence/sprint-6/s6-10/upgrade-check.mjs`.

Record results in [S6-10 evidence](evidence/sprint-6/s6-10/codex.md) and close S6-10.2 only after all six findings pass the follow-up integrated Sol 6.2 High review. Main risks are grading from mutable catalogue data, attributing a stale submission to another character or skill, and issuing a second key when the first attempt may have committed. The published-source, overlap, and lost-response checks exercise those boundaries.

## Thứ tự xử lý sau audit tích hợp

- **S6-04b2 và S6-04b3** cùng phụ thuộc hợp đồng parser. Cố định cách chiếu riêng cho Teacher, Admin và Learner, rồi chạy luồng Chromium lưu → tải lại → nộp → duyệt cùng kiểm tra quyền Learner. [Báo cáo audit](evidence/sprint-6/integration-review/codex.md).
- **S6-05** kiểm tra cặp tọa độ hữu hạn thuộc `[0, 1]` và nét mẫu hợp lệ. Căn giữa và scale đồng nhất trên toàn chữ cho mẫu và bài, giữ tỷ lệ và vị trí tương đối của từng nét, rồi lấy mẫu lại trước khi chấm. Chạy ca cùng hình khác vị trí/kích thước, nét đứng yên, mẫu hỏng, đảo thứ tự/hướng và thiếu/thừa nét.
- **S6-04b5** chốt ký tự từ vựng ở luồng Staff, rồi đọc theo snapshot của revision. PostgreSQL đã tái hiện bài cũ thay đổi kết quả GET khi có mapping catalogue mới. Sửa source này trước khi đưa selector từ vựng vào gói phiên viết. [Bằng chứng](evidence/sprint-6/integration-review/codex.md#kiểm-tra-chốt-ký-tự-từ-vựng-s6-04b5).
- **S6-06a và S6-06b** kiểm tra lại quyền truy cập và revision trước khi replay hoặc ghi. Scope replay theo đúng session, ký tự và fingerprint, khóa trong transaction và yêu cầu ít nhất một lần chấm hợp lệ trước khi complete. Xác nhận giới hạn byte và tổng điểm đầu vào ở route, rồi kiểm thử PostgreSQL đồng thời. **S6-07** chạy lại luồng trình duyệt với backend thật trước khi bắt đầu fixture S6-08a/b.
- **S6-09** tiếp tục chờ ADR về scheduler và rating. [Điều kiện trong spec Sprint 6](2026-11-14-sprint-6-script-learning-engine.md#điều-kiện-bật-writing-trong-srs).

## S6-01 — Đạt kiểm tra local

Bàn giao đã được review. Validator và lookup 18/18, PostgreSQL 11/11, feature suite 833/833. [Báo cáo nghiệm thu](evidence/sprint-6/s6-01/codex-review.md).

- Chỉ sửa Prisma schema product, một migration additive sau `20261115000000`, module catalogue phía server và test tập trung. Không sửa dữ liệu/migration Sprint 5.
- Model gồm ID, `languageId`, `glyph`, `scriptType`, `meaning?`, `primaryReading?`, `romanization?`, `strokeCount` và `metadata`. Năm script theo spec, FK RESTRICT, unique language/glyph, số nét dương tối đa 128, JSON object, ENABLE/FORCE RLS và thu hồi quyền PUBLIC, anon, authenticated. Validator áp NFC, một grapheme và kiểm tra metadata Hanzi hai hệ. Lookup nội bộ phải scope bằng language. Fixture tự tạo, không thêm corpus hay mở catalogue public.
- Lookup catalogue có thể dùng lại ở Staff/Learner nhưng chưa mở API. Không thêm trường/nội dung nét, liên kết từ vựng, Studio/UI, tiến độ, SRS hoặc seed global vào gói này.
- Kiểm tra chức năng validator và lookup, Prisma validate/generate + typecheck, PostgreSQL disposable xác minh constraint/RLS và ký tự cùng hình khác ngôn ngữ. Lưu lệnh, mã thoát và các giới hạn đã biết.

## S6-02 — Đạt kiểm tra local sau sửa

Catalogue và validator 41/41, PostgreSQL stroke 12/12. [Báo cáo nghiệm thu](evidence/sprint-6/s6-02/codex-review.md).

- Thêm đúng một bộ nét trên mỗi `WritingCharacter`, FK `RESTRICT`, unique `characterId`, version dương và `source`/`license` có giá trị. Mọi bảng mới dùng RLS như catalogue. Lookup nội bộ giữ phạm vi language của ký tự.
- Mỗi nét lưu danh sách điểm chuẩn hóa `[x, y]` có thứ tự để grader và renderer dùng chung. Tạo `path` từ cùng các điểm (SVG `M` và `L`), với `start` và `end` khớp hai đầu. Kiểm tra giới hạn điểm/nét, tổng điểm, chỉ số liên tục và số nét bằng `strokeCount` của catalogue. Từ chối nét rỗng, nét không di chuyển và tọa độ không hữu hạn.
- Dùng fixture tự vẽ có nguồn gốc và giấy phép ghi rõ. Chạy seed fixture hai lần cho cùng kết quả; gặp dữ liệu khác đã tồn tại thì báo xung đột. Không thêm dữ liệu global, endpoint hay màn hình trong gói này.
- Gate gồm Prisma validate/generate, typecheck, test validator và PostgreSQL disposable cho quan hệ, RLS, dữ liệu sai và replay seed. Ghi kết quả ở `plans/evidence/sprint-6/s6-02/anti.md`.

## S6-03 — Đạt kiểm tra local sau sửa

Mapping 18/18, PostgreSQL 16/16, feature suite 874/874. [Báo cáo nghiệm thu](evidence/sprint-6/s6-03/codex-review.md).

- Chỉ thêm `VocabularyCharacter`, migration additive, module mapping nội bộ và test. Dùng hai FK `RESTRICT`, unique `(vocabularyId, position)`, `position >= 1` và RLS như catalogue. Giữ nguyên dữ liệu cũ.
- Tách `canonicalForm` bằng `Intl.Segmenter`, tra glyph NFC theo `VocabularyConcept.languageId`. Vị trí tính từ 1 theo chuỗi gốc, nên bỏ qua glyph không có trong catalogue vẫn giữ vị trí các glyph còn lại. Cho phép một glyph lặp lại. Một transaction lưu mapping mới hoặc xác nhận lần chạy lại giống dữ liệu cũ. Báo xung đột nếu mapping đã lưu khác kết quả, vì gói sau sẽ chốt nó theo revision.
- PostgreSQL disposable kiểm tra đúng thứ tự `日本語`, glyph lặp, vị trí khuyết, hai ngôn ngữ cùng glyph, xung đột và RLS. Chạy Prisma validate/generate, typecheck và test tập trung. Ghi bằng chứng ở `plans/evidence/sprint-6/s6-03/anti.md`.

## S6-04a1 — Đạt kiểm tra local sau sửa

Lesson-content 73/73, enum PostgreSQL 4/4, typecheck qua. [Báo cáo nghiệm thu](evidence/sprint-6/s6-04a1/codex-review.md).

- Chỉ thêm giá trị `CHARACTER` vào `LessonBlockType` và một migration additive sau S6-03. Bước này chưa ghi hàng `CHARACTER` qua Studio.
- Tách schema input gồm UUID `characterId` và bốn cờ của spec khỏi schema persisted chứa snapshot server. Bộ test xác nhận input từ client không chấp nhận snapshot hay dữ liệu nét. Reader hiện tại giữ nguyên legacy và an toàn khi gặp block chưa hỗ trợ. Để riêng việc resolve catalogue/snapshot vào S6-04a2 và render UI vào S6-04b.
- Chạy validate/generate, typecheck, feature test `@lingora/lesson-content` và migration trên PostgreSQL disposable. Lưu kết quả ở `plans/evidence/sprint-6/s6-04a1/anti.md`.

## S6-04a2 — Lưu nháp CHARACTER đạt kiểm tra local sau sửa

Draft PostgreSQL 13/13, Studio PostgreSQL 35/35, feature suite 905/905, typecheck qua. [Báo cáo nghiệm thu](evidence/sprint-6/s6-04a2/codex-review.md).

- Nối codec author vào luồng Teacher lưu bản nháp qua API hiện có, giữ kiểm tra collection (giới hạn block, trùng key/vị trí) với các loại block cũ. Từ chối snapshot, metadata và dữ liệu nét do client gửi ở cả route và điểm lưu server.
- Sau kiểm tra quyền và revision trong transaction, lấy language của khóa học từ DB, cùng catalogue và phiên bản nét tương ứng. Lưu snapshot từ các trường catalogue cần thiết. Bắt buộc pin nét dương khi bật hoạt ảnh hoặc hướng dẫn viết. Lỗi đầu vào hoặc reference phải rollback toàn bộ lần lưu.
- Khi không gửi danh sách block, kế thừa block canonical từ bản trước với key, thứ tự và snapshot đã lưu. Kiểm tra DB disposable qua luồng lưu thật, gồm hai ngôn ngữ, thiếu nét, dữ liệu chèn thêm, assignment sai, revision cũ, bản cũ vẫn nguyên, copy successor và legacy. Giữ gate submit/publish cho S6-04a3 và UI/DTO cho S6-04b. Ghi bằng chứng ở `plans/evidence/sprint-6/s6-04a2/anti.md`.

## S6-04a3 — Duyệt và xuất bản CHARACTER đạt kiểm tra local sau sửa

Workflow PostgreSQL 11/11, Studio PostgreSQL 35/35, feature suite 905/905, typecheck qua. [Báo cáo nghiệm thu](evidence/sprint-6/s6-04a3/codex-review.md).

- Kiểm tra collection canonical và reference trong transaction của submit và publish. Tra theo language hiện tại của bài học. Khi bật hoạt ảnh hoặc hướng dẫn viết, xác minh dữ liệu nét còn ở đúng pin trong snapshot. Luồng kiểm tra đọc snapshot đã lưu và giữ nguyên nội dung; phiên bản nét cũ chưa còn khả dụng thì yêu cầu cập nhật draft.
- Kiểm thử PostgreSQL với draft hợp lệ qua submit → approve → publish. Pin sai, mất reference hoặc snapshot lỗi phải trả lỗi có kiểm soát trước khi ghi review, đổi trạng thái hoặc đổi active revision. Thử cả thay dữ liệu nét sau khi submit, cùng các bài legacy. Phần đọc snapshot cho Studio và hiển thị thuộc S6-04b.

## S6-04b1 — Teacher chọn CHARACTER

Đạt nghiệm thu local sau bản sửa khôi phục bản nháp. Chromium xác nhận nhãn của ký tự đã lưu được lấy từ dữ liệu máy chủ, còn lựa chọn mới giữ đúng ID và hiển thị nhãn catalogue sau khi lưu. [Báo cáo nghiệm thu](evidence/sprint-6/s6-04b1/codex-review.md).

- Nối picker danh mục với bài được phân công. Tra cứu theo ngôn ngữ của course và chỉ trả dữ liệu cần cho lựa chọn. Editor tải lại `characterId` và bốn cờ từ bản đã lưu. Cùng giới hạn payload áp dụng khi lưu, đổi thứ tự và khôi phục từ bản nháp cục bộ.
- Kiểm tra trên Chromium local với giáo viên được phân công và giáo viên khác. Tạo block, chỉnh cờ, lưu rồi tải lại. Draft recovery gửi theo schema author và không ghi đè catalogue bằng snapshot cũ.

## S6-04b1p — Phân trang danh mục Teacher

**Trạng thái** · Đạt nghiệm thu local sau bản sửa phản hồi đến muộn. Chromium giữ đúng kết quả của truy vấn mới và API phân trang qua 15/15. [Bằng chứng](evidence/sprint-6/s6-04b1p/codex-review.md).

Khi giáo viên chọn **Tải thêm**, `fetchMoreOptions` chờ phản hồi rồi nối vào mảng kết quả hiện tại. Nếu `fetchOptions` vừa thay mảng đó bằng kết quả của truy vấn mới, callback cũ vẫn nối mục và ghi cursor. Kế hoạch sửa tập trung vào hai file `lingora-admin/src/components/lesson-studio/BlockEditor.tsx` và `lingora-admin/tests/feature/character-studio-browser.test.mjs`.

### Các bước sửa

1. **Thêm ca hồi quy Chromium.** Dùng fixture có ít nhất 22 kết quả. Dùng Playwright giữ phản hồi trang hai của truy vấn A, gửi truy vấn B tìm `日`, chờ B xuất hiện rồi thả phản hồi A. Xác nhận trên bản hiện tại rằng ca thử thất bại vì danh sách B có thêm hai ký tự của A. Điều phối bằng chặn/thả request để thứ tự phản hồi do test quyết định.
2. **Ràng buộc cập nhật state với request còn hiệu lực.** Trong `CharacterBlockEditor`, dùng một `AbortController` lưu trong ref để quản lý request đang chạy. Khi gửi truy vấn mới, hủy lượt trước, đặt lại danh sách và cursor rồi bắt đầu trang đầu. Trước khi cập nhật kết quả, cursor, lỗi hoặc trạng thái tải, xác nhận controller vẫn là của request đang chạy. Khi đóng picker, chọn ký tự hoặc unmount, hủy và bỏ hiệu lực request đang chờ. Lượt **Tải thêm** tiếp tục dùng truy vấn đã gửi gần nhất cùng cursor tương ứng, kể cả khi giáo viên đã gõ nội dung mới.
3. **Chạy lại ca hồi quy rồi nghiệm thu gói.** Sau khi thả A, danh sách vẫn chỉ có `日`, cursor và trạng thái tải khớp với B. Kiểm tra thêm lỗi đến muộn của A không hiện trên kết quả B, tải thêm bình thường vẫn nối đúng thứ tự, trang cuối ẩn nút tải thêm và giáo viên vẫn chọn, lưu, tải lại được ký tự từ trang sau.

### Lệnh nghiệm thu

- [x] `npm run build -w lingora-admin` rồi `npm run test:e2e:character-studio` trên Chromium với PostgreSQL disposable.
- [x] `npm run test:integration:character-options` qua các ca phân trang, cursor và quyền theo course/assignment.
- [x] `npm run typecheck` và `git diff --check` qua. Kết quả được ghi trong báo cáo nghiệm thu S6-04b1p.

## S6-04b2 — Admin xem CHARACTER

Mục tiêu là để Admin xem đúng nội dung Teacher đã nộp tại `/review/[submissionId]`. Trang, API chi tiết và phản hồi các thao tác duyệt đều dùng `getReviewDetail`. Hiện parser chung trả `UNSUPPORTED` cho `CHARACTER`, nên bản nộp hợp lệ vẫn hiện thông báo khối chưa được hỗ trợ. [Hợp đồng Sprint 6](2026-11-14-sprint-6-script-learning-engine.md).

### Các bước triển khai

1. **Chiếu snapshot cho màn duyệt.** Trong `lingora-admin/src/server/lessons/workflow.ts`, đọc từ `submission.lessonRevision` đã có và kiểm tra block bằng `characterBlockPersistedSchema`. Chỉ thay phần tử fallback của `CHARACTER` khi block hợp lệ. Dùng kiểu riêng cho `revision.blocks` của Admin. Giữ `blockKey`, `position`, glyph, loại chữ và số nét. Chỉ đưa nghĩa khi `showMeaning` bật và cách đọc/phiên âm khi `showReading` bật. Dùng allowlist trường; nguồn dữ liệu là snapshot đã lưu. Block lỗi tiếp tục hiện `UNSUPPORTED`; paragraph V0, block V1 cũ và dữ liệu từ vựng/bài tập tiếp tục qua luồng hiện có.
2. **Nối vào từng block trên màn review.** Trong `lingora-admin/src/components/ReviewDetailView.tsx`, render nhánh `CHARACTER` chỉ đọc từ DTO Admin. Hiện đúng glyph kể cả khi tắt nghĩa và cách đọc. Cờ `showStrokeAnimation` và `guidedWriting` hiển thị khả năng tương ứng đã được cấu hình cùng phiên bản nét đã ghim khi có. Gói này dùng preview tĩnh theo bản nộp. Luồng đọc mẫu nét và luyện viết đi theo các gói sau. Dùng wrapper và `blockKey` hiện có để giữ thứ tự và nhận xét đúng khối. Cùng preview phải xuất hiện sau tải lại hoặc sau khi nhận DTO từ yêu cầu chỉnh sửa, duyệt và xuất bản.
3. **Kiểm chứng trên bản nộp thật.** Bổ sung ca DTO vào suite PostgreSQL `character-workflow-postgres.test.mjs` và một luồng Admin vào Chromium Studio hiện có, dùng auth giả lập và lesson có core exercise. Sau khi Teacher nộp, đổi nghĩa và cách đọc trong catalogue. Kiểm tra Admin xem snapshot cũ trước và sau khi duyệt. Sau khi xuất bản, Teacher tạo draft kế tiếp với dữ liệu khác. Admin mở lại submission cũ vẫn thấy snapshot đã nộp, cùng thứ tự và `blockKey`. Kiểm tra từng cờ bật/tắt, cờ viết với pin, block tĩnh không pin, snapshot lỗi, V0 và V1 có cả block cũ và `CHARACTER`.

### Tiêu chí nghiệm thu

- [ ] Admin ACTIVE xem đúng bản nộp qua trang và API. Teacher, Admin không hoạt động và phiên thiếu xác thực đều bị từ chối theo luồng hiện có. ID bản nộp thiếu trả 404.
- [ ] Cờ hiển thị được kiểm tra trong payload và UI. Snapshot hiển thị qua allowlist, dữ liệu raw stroke, metadata tuỳ ý và trường đã tắt vắng mặt trong DTO. Block không hợp lệ dùng fallback, các block cũ và nhận xét giữ đúng hành vi.
- [ ] `npm run test:integration:character-workflow`, `npm run test:integration:studio`, `npm run build -w lingora-admin`, `npm run test:e2e:character-studio`, `npm run typecheck` và `git diff --check` qua. Lưu chứng cứ ở `plans/evidence/sprint-6/s6-04b2/`.

## S6-04b3 — Learner xem CHARACTER

- Chỉ chiếu trường được phép từ snapshot của active published revision, theo cờ nghĩa/cách đọc và quyền truy cập bài học. UI đọc snapshot; raw geometry và phiên luyện viết theo các gói sau.
- Kiểm thử fixture hai ngôn ngữ, bài mở/bài khóa, bản nháp cùng lesson, thứ tự block, cờ tắt và kiểm tra JSON response. Giữ fallback legacy và tương thích các loại block hiện có.

## S6-04b4 — Learner đọc mẫu nét

- Nối GET `/api/characters/:characterId` cho selector `blockKey`. Kiểm tra learning context, lesson đang mở, active revision, block và ID cùng thuộc nguồn được phép. Chỉ trả path mẫu khi bật hoạt ảnh hoặc hướng dẫn viết và pin còn khả dụng. Kiểm tra trộn selector, bài khóa, sai context, thay revision và trường hợp chỉ hiển thị tĩnh.

## S6-04b5 — Ký tự của từ vựng

- Chốt thứ tự mapping theo revision cho từ vựng đã xuất bản. Mở nhánh GET còn lại theo `lessonVocabularyLinkId` và chỉ trả các ký tự đã chốt cho link đó. Kiểm tra từ vựng cũ chưa có mapping, vị trí khuyết/lặp và thay catalogue sau khi xuất bản.

# Sprint 2 — Nhập tài liệu, AI Draft và media trong Teacher Studio

Ngày 12/11/2026 · Kế hoạch 10 ngày làm việc · Baseline Git `30177a3` trên `main`.

## Kết quả cần bàn giao

Teacher đang được phân công mở **Nhập tài liệu** trong Studio, dán văn bản, nhập URL hoặc tải PDF/DOCX, chọn các đoạn muốn dùng rồi đưa chúng vào bản nháp. Teacher có thể yêu cầu AI đề xuất bài đọc, từ vựng, ngữ pháp và bài tập, xem từng đề xuất, chọn phần muốn giữ, xác nhận nguồn rồi Apply. Apply lưu một revision `DRAFT` mới. Teacher tiếp tục chỉnh sửa và chủ động Submit qua quy trình duyệt hiện có.

Teacher cũng có thể tải ảnh/audio trực tiếp từ block `MEDIA`. Admin Review và learner đọc đúng tệp gắn với revision được phép xem. YouTube transcript, OCR, tải media nhúng từ tài liệu và upload trực tiếp vào bài tập `LISTENING` để lượt sau. `LISTENING` tiếp tục dùng HTTPS reference. AI Sprint 2 sinh MCQ, FILL_BLANK, REORDER và GRAMMAR trong domain practice hiện có.

## Điểm tích hợp đã xác minh

| Hiện trạng | Quyết định cho Sprint 2 |
| --- | --- |
| Trang Studio là `/my-lessons/[lessonId]`. API hiện dùng `/api/teacher/lessons/[lessonId]`. | Wizard đặt trong Studio. Import routes đặt dưới API Teacher hiện hữu. |
| `saveTeacherLessonDraft` tạo successor bằng transaction, kiểm tra teacher, lesson, assignment và CAS. Save dùng `expectedRevisionId` và `expectedRowVersion` kiểu chuỗi int64 của **Lesson**. Revision nền là `highestRevision`. | Apply dùng cùng transaction save. Giữ `null` cho lesson chưa có revision và giữ các kiểm tra workflow hiện có. |
| `@lingora/lesson-content` đã có block V1, renderer chung, adapter legacy. `MEDIA` hiện chỉ có audio URL. | Import tạo block V1. Mở rộng `MEDIA` với nhánh managed image/audio. URL audio đã lưu tiếp tục đọc được. |
| `MediaAsset` và `MediaBinding` đã tồn tại. DB dùng `MediaAsset.kind = CONTENT` cho asset của assignment, còn `MediaBinding.usage` phân biệt `IMAGE` và `AUDIO`. `snapshot.ts` hiện từ chối revision có binding. | Reuse hai bảng. Mở hỗ trợ đúng shape lesson-level binding đã kiểm chứng trong read, save và submit. |
| Studio và review đang có thay đổi chưa commit tại lúc lập plan. | Kiểm tra diff trước khi gắn wizard/media UI vào các file đang sửa. Baseline có 35/35 ca integration Studio và 9/9 ca workflow lifecycle pass trên PostgreSQL local. Browser, provider và Storage sẽ được xác minh trong sprint. |

Điểm vào chính nằm ở [teacher draft route](../lingora-admin/src/app/api/teacher/lessons/%5BlessonId%5D/draft/route.ts), [lesson service](../lingora-admin/src/server/lessons/index.ts), [snapshot validator](../lingora-admin/src/server/lessons/snapshot.ts), [editor](../lingora-admin/src/components/LessonDraftEditor.tsx), [block schema](../packages/lesson-content/src/schema.ts) và [Prisma schema](../lingora-admin/prisma/product/schema.prisma).

## Hợp đồng triển khai

### Workspace và nguồn

- **`LessonImport`** là workspace tạm, giữ lesson, teacher, assignment episode, loại nguồn, URL/tiêu đề, hash nội dung chuẩn hóa, các đoạn text có ID ổn định, tập đề xuất hiện hành, mã lỗi, mốc thời gian, hạn dùng và ID revision đã Apply. Dùng migration additive, FK, index cho lookup và expiry. Raw text và AI output chỉ đi qua service phía server. Hash hỗ trợ phát hiện nội dung giống nhau trong workspace của teacher; các bài vẫn có thể dùng chung một nguồn.
- **Trạng thái** `CREATED → EXTRACTING → READY → APPLIED`. `FAILED` của extract có thể retry, workspace chưa Apply có thể `DISCARDED`. Generate là operation riêng trên `READY`; lỗi Generate giữ kết quả extract và tập đề xuất hợp lệ trước đó nếu có. Apply và discard là terminal. Operation claim có hạn để lần gọi bị ngắt có thể hồi phục. Kết quả đến muộn chỉ ghi khi claim còn hiện hành và assignment episode còn đúng.
- **`LessonSource`** là snapshot của revision. Lưu loại nguồn, tiêu đề, tác giả nếu biết, URL đã loại thông tin nhạy cảm, thời điểm lấy, rights basis, attribution và người/thời điểm xác nhận. Apply thêm nguồn cho successor. Save thường sao chép nguồn cùng snapshot; review đọc đúng revision. Nguồn hiển thị cho learner chỉ gồm attribution dùng để xuất bản và metadata công khai của revision mà learner đang đọc. Workspace hết hạn có thể xóa mà attribution đã lưu vẫn đọc được.
- **Xác nhận sử dụng** bắt buộc ở Apply, kiểm tra lại phía server. Các lựa chọn cho nội dung được đưa vào draft gồm `OWN_CONTENT`, `LICENSED`, `PUBLIC_DOMAIN` và `PERMISSION_GRANTED`. `REFERENCE_ONLY` dùng để đánh dấu nguồn tham khảo trong workspace và chặn Apply nội dung của nguồn đó. Với `LICENSED`, nhập thông tin ghi công để reviewer kiểm tra.

### API import

Prefix `/api/teacher/lessons/[lessonId]/imports`. Dùng envelope và xác thực staff hiện có, `no-store`, kiểm tra same-origin cho mutation và recheck assignment episode trên mọi operation. Import khác lesson/chủ sở hữu hoặc thuộc episode cũ trả `404`. Actor hết session nhận `401`, sai role/inactive nhận `403`. Giới hạn payload trả `413`, loại tệp sai trả `415`, quota trả `429`, trạng thái hoặc revision xung đột trả `409`.

| Method / path | Hợp đồng |
| --- | --- |
| `POST /` | Tạo workspace theo `sourceType`. Dán văn bản và URL dùng JSON; PDF/DOCX dùng multipart có giới hạn, file gốc chỉ giữ tạm trong vùng private tới khi extract xong hoặc hết hạn. Trả `importId`, trạng thái và hạn dùng. |
| `GET /[importId]` | Trả trạng thái, đoạn đã extract, proposal set hiện hành và mã lỗi được phép hiển thị. Khi resume, client dùng `importId` của lesson đó và server xác thực lại. |
| `POST /[importId]/extract` | Chuẩn hóa đoạn text theo thứ tự và lưu ID từng đoạn. Claim nguyên tử trước khi parse/fetch, giới hạn thời gian, giải phóng claim khi kết thúc. Gọi lại khi đã `READY` trả snapshot hiện có. |
| `POST /[importId]/generate` | Nhận `selectedSegmentIds`, nhóm đề xuất, level và số lượng. Đọc ngôn ngữ bài học từ server. Cùng input trong lúc đang chạy trả trạng thái hiện tại; retry sau khi đã ghi kết quả dùng lại proposal set. Regenerate chủ động tạo set mới và yêu cầu chọn lại. |
| `POST /[importId]/apply` | Nhận `baseRevisionId`, `rowVersion`, `proposalSetId`, `selectedSuggestionIds`, attribution có xác nhận và `title` khi tạo revision đầu tiên. Với luồng thủ công, mỗi đoạn đã extract là một đề xuất `TEXT` xác định từ ID đoạn. Trả detail DTO chuẩn của Studio. |
| `DELETE /[importId]` | Discard workspace chưa Apply. Gọi lại an toàn. Hủy khả năng ghi của operation đang chạy; dọn file tạm qua cleanup retryable. |

### Apply vào Studio

1. Wizard chỉ mở Apply khi editor đã lưu các chỉnh sửa cục bộ. Nếu có thay đổi chưa lưu, giữ workspace và hướng Teacher lưu trước. Lesson chưa có revision dùng `baseRevisionId: null` và yêu cầu Teacher nhập tiêu đề ngay trong wizard theo schema Save hiện có.
2. Trong transaction, giữ thứ tự khóa hiện có của save (account → lesson → assignment), rồi khóa import. Kiểm tra lại quyền, episode, expiry và trạng thái. Retry đúng payload đã Apply nhận kết quả thành công kèm `appliedRevisionId` trước khi kiểm tra CAS. Request Apply khác payload trên cùng import trả `409`.
3. Map `baseRevisionId` sang `expectedRevisionId`, `rowVersion` sang `expectedRowVersion`. Resolve ID đã chọn từ proposal set hiện hành phía server; yêu cầu danh sách có ít nhất một ID, duy nhất và đúng tập. Tái sử dụng snapshot merge/save, không gọi vòng qua HTTP. Đọc predecessor trong transaction để append theo thứ tự, cấp block key/position mới và giữ tiêu đề, block key, practice, vocabulary và nội dung assessment đã có. V0 qua adapter hiện hữu. Trùng vocabulary/exercise xử lý theo validator và fingerprint hiện có, trả lỗi có field để Teacher điều chỉnh lựa chọn.
4. Lưu successor, provenance và dấu Apply trong cùng transaction. Nếu validate, CAS hoặc write lỗi, toàn bộ rollback. `STALE_LESSON`/`REVISION_CONFLICT` giữ lựa chọn; UI tải bản mới để Teacher xem lại và Apply chủ động. UI nhận detail chuẩn, chuyển sang revision mới và hiển thị kết quả. Retry khi đã có revision mới hơn phải hiện detail mới nhất cùng `appliedRevisionId`, tránh ghi đè editor bằng snapshot cũ.

### Giới hạn vận hành ban đầu

| Phần | Mặc định đề xuất và cách xác minh |
| --- | --- |
| Workspace | Hạn 7 ngày; tối đa 100 đoạn và 60.000 ký tự đã chuẩn hóa. Giới hạn Studio hiện hữu vẫn áp dụng sau merge (50 blocks, 100 vocabulary, 100 exercises, payload 1 MiB). Gom nhiều đoạn vào các block `TEXT` theo giới hạn AST. Báo thiếu chỗ nếu draft vượt giới hạn. |
| URL | Chỉ HTTP(S) trên cổng mặc định, tối đa 3 redirects, 8 giây tổng và 2 MiB response đã giải nén; chỉ HTML/plain text. Kiểm tra địa chỉ mạng trước mỗi hop, xác minh endpoint kết nối là địa chỉ public đã duyệt, giữ kiểm tra TLS theo hostname. Chặn private/reserved/link-local, IPv6 tương đương, credentials và origin không được phép. Bỏ script, form và phần điều hướng; chỉ trả text. |
| PDF/DOCX | Tối đa 5 MiB hoặc giới hạn request của host nếu thấp hơn. Kiểm tra byte signature/container thực, giới hạn tài nguyên parser, số trang và kích thước DOCX sau giải nén. Đọc text local, bỏ embedded resource và external relationship. File scan không có text, mã hóa hoặc hỏng có lỗi riêng để Teacher đổi nguồn. |
| AI | Input tối đa 20.000 ký tự từ các đoạn đã chọn, timeout ban đầu 20 giây trong budget host; tối đa 20 vocabulary, 5 ghi chú ngữ pháp và 10 bài tập mỗi lần. Ban đầu 10 lần Generate/teacher/giờ, một Generate đang chạy mỗi workspace. Xác minh timeout và quota trước khi bật trên dev. |
| Media | Private bucket, JPEG/PNG/WebP tối đa 5 MiB, MP3/OGG tối đa 10 MiB. Kiểm tra byte thật và checksum trước khi ready. Upload có object key duy nhất, server giữ intent hết hạn; signed upload token và thời hạn intent được kiểm thử riêng. |

Các mức trên là mặc định đề xuất cho dev. Kiểm tra giới hạn deploy và fixture kích thước sát ngưỡng ở T0/T5 trước khi chốt. Log chỉ giữ ID operation, loại nguồn, kích thước, thời gian, kết quả và mã lỗi; tránh raw text, grading, credential, query string và signed URL.

## Thứ tự triển khai

| Task | Phụ thuộc để bàn giao |
| --- | --- |
| T1 | T0 |
| T2, T3, T4 | T1 |
| T5a | T0 |
| T5b | T2, T5a |
| T6 | T1, T2 |
| T7 | T2, T3, T4, T5b, T6 |

T3, T4 và phần provider của T6 có thể bắt đầu khi T1 chốt segment DTO. Nghiệm thu Apply từ URL/file cần T2. T5a có thể bắt đầu sau T0. Đặt migration và file schema chung theo thứ tự T1/T2 trước khi merge T5a. T2 và T5b đều chạm snapshot save và editor, cần tích hợp tuần tự tại các file đó. Ngày bên dưới là các mốc dự kiến trong khung hai tuần.

### T0 — Chốt contract và môi trường · Ngày 1

- [ ] Đối chiếu Git diff, route Save/Submit, DTO Studio và snapshot V0/V1. Chốt field CAS, quy tắc quyền assignment episode và mô hình binding trước khi sửa code. Dùng [schema](../lingora-admin/prisma/product/schema.prisma) và [snapshot validator](../lingora-admin/src/server/lessons/snapshot.ts) làm điểm xuất phát.
- [ ] Chạy lại hai baseline trong phần kiểm thử nếu HEAD hoặc worktree Studio thay đổi. Xác minh trên dev giới hạn body/timeout, private bucket, quyền cấp URL cho admin/web và một AI provider có model hỗ trợ structured output. Giữ Paste/Apply và fake provider làm đường triển khai nếu môi trường ngoài chưa có.

### T1 — Dán văn bản, xem đoạn và discard · Ngày 1–2

- [ ] Thêm migration `LessonImport`, service `lingora-admin/src/server/lesson-imports/` và routes create/get/extract/discard dưới Teacher API. Chỉ parser text cần hoạt động ở lát đầu. Chuẩn hóa xuống dòng, chia đoạn, giữ nguyên chữ Unicode; gắn ID đoạn và hash sau chuẩn hóa.
- [ ] Thêm nút **Nhập tài liệu** và hai bước đầu của wizard trong `LessonDraftEditor.tsx`. Có trạng thái loading, empty, error, expired, forbidden và retry. Lưu ID workspace theo lesson để có thể mở lại sau reload.
- [ ] Kiểm thử text đa ngôn ngữ, text rỗng/quá lớn, resume, discard trong lúc extract, workspace hết hạn và lesson/teacher khác. Xác nhận DB chưa có revision mới sau create/extract.

### T2 — Apply thủ công và attribution · Ngày 3–4

- [ ] Thêm `LessonSource`, form nguồn và bước chọn đoạn. Xây Apply từ proposal thủ công đến canonical draft, đặt transaction cùng logic Save tại `src/server/lessons/index.ts` và chuyển snapshot metadata trong đường save hiện có. Đọc attribution ở Studio/Admin Review và DTO hiển thị learner của revision đủ quyền.
- [ ] Kiểm thử PostgreSQL với lesson trống, V0, V1 và lesson có bản đã publish. Bắn Apply trùng, Apply cạnh tranh Save, Apply cạnh tranh reassign và mô phỏng lỗi ghi attribution để xác nhận rollback. Kiểm tra rights basis, tập đề xuất cũ, rebase có chủ đích và thay đổi cục bộ chưa lưu.
- [ ] **Mốc ngày 4** — Teacher dán văn bản, chọn đoạn, xác nhận nguồn, Apply và thấy đúng draft trong Studio. Bản mới vào review queue khi Teacher Submit. Published pointer và các child rows của bản publish cũ giữ nguyên.

### T3 — Nhập từ URL · Ngày 5

- [ ] Thêm adapter URL server-only với fetch có giới hạn và kiểm tra mạng ở mọi hop. Chuẩn hóa title và phần nội dung chính về cùng segment DTO. Chỉ bật lựa chọn URL trong wizard khi các ca kiểm thử an toàn pass.
- [ ] Kiểm thử bằng resolver/transport mock và fixture HTML tĩnh. Bao phủ địa chỉ nội bộ, đổi IP sau resolve, redirect ra ngoài phạm vi cho phép, timeout, body quá lớn và sai content type. Xác nhận không kết nối tới địa chỉ bị từ chối và không render HTML nguồn.

### T4 — Nhập PDF và DOCX · Ngày 5–6

- [ ] Chọn parser phía server tại T0/T4 sau khi thử fixture đại diện và kiểm tra dependency phù hợp runtime Node. Thêm adapter trả segment DTO, liên kết metadata file, dọn file tạm sau extract thành công, discard hoặc hết hạn.
- [ ] Kiểm thử PDF có text, DOCX có heading/list và nội dung tiếng Việt/CJK, tài liệu scan, file giả định dạng, file hỏng/mã hóa, file quá lớn và tài liệu có external resource. Kiểm tra Apply thủ công với cả hai loại file.

### T5a — Upload media có quản lý · Ngày 6–7

- [ ] Thêm `POST /api/media/upload-intent`, `POST /api/media/complete`, `DELETE /api/media/[assetId]` ở admin, dùng Supabase client server-only hiện có. Intent giữ lesson, assignment episode, teacher, object key, hạn và kết quả complete. Bucket private và object key do server cấp; upload không cho ghi đè. Server đối chiếu intent, quyền hiện hành, bytes, MIME và checksum rồi tạo `MediaAsset` `CONTENT` có `readyAt`. Retry complete trả cùng asset. [Supabase signed uploads](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl), [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).
- [ ] Delete chỉ retire asset chưa từng được binding và thuộc phạm vi teacher. Serialize với thao tác gắn binding; xử lý xóa object sau khi đã retire, có thể retry khi Storage lỗi. Cleanup dọn intent hết hạn, tệp tạm và object mồ côi sau khi token upload hết hiệu lực. Asset đã có binding ở bất kỳ revision nào tiếp tục phục vụ snapshot lịch sử.
- [ ] Kiểm thử bucket private, cross-assignment, complete trùng, upload dở, MIME giả, sai checksum, retire cạnh tranh Save và lỗi Storage. Chạy smoke thật trên bucket dev riêng.

### T5b — Gắn media vào revision và render · Ngày 7–8

- [ ] Thêm biến thể block managed gồm `assetId`, loại và caption/alt cần thiết. Trong Save, kiểm tra asset ready đúng lesson/assignment episode hoặc được kế thừa hợp lệ từ predecessor, ghi binding theo vị trí block trong successor. Rà `snapshot.ts` và `workflow.ts` để Save/Submit chấp nhận đúng bộ asset + binding khớp block. Binding cấp item tiếp tục theo contract hiện tại.
- [ ] Gắn upload vào block `MEDIA`, render bằng renderer chung. Server ký URL đọc ngắn hạn sau khi kiểm tra asset được gắn với đúng revision mà Teacher/Admin/Learner được xem. Learner dùng quyền của published/pinned revision hiện hành; đường đọc asset lấy revision và binding phía server. Có nút tải lại khi URL hết hạn, kiểm tra audio seek và ảnh có alt text. URL ký chỉ xuất hiện trong dữ liệu trình bày tạm, ngoài nội dung persisted của block. [Supabase signed reads](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl).
- [ ] Kiểm thử reorder, bỏ block khỏi successor, Save lại, Submit/Publish, role ngoài phạm vi, learner truy cập revision khác và audio HTTPS cũ. Published/pinned revision cũ vẫn mở đúng object sau khi Teacher lưu successor.

### T6 — AI Draft và chọn đề xuất · Ngày 5–9

- [ ] Tạo `ContentGenerationProvider.generateLessonDraft(input)` phía server, một adapter cho provider được chọn và một fake xác định cho test. Input gồm đoạn Teacher chọn, ngôn ngữ/level từ lesson, nhóm đầu ra và số lượng. Tài liệu là dữ liệu đầu vào; provider không có quyền gọi tool, tải URL hoặc ghi DB. Giao diện thông báo phần text đã chọn sẽ được gửi khi Teacher bấm **Tạo đề xuất**.
- [ ] Validate structured output bằng Zod trước khi lưu; tái sử dụng block, vocabulary và exercise schemas hiện hữu. Server cấp suggestion ID, từ chối output sai loại hoặc grading không hợp lệ. Bài tập map vào domain practice và lưu grading qua `ItemGradingSecret`. AI không tạo assessment item hay media URL. Teacher thấy từng đề xuất và đáp án trong wizard, chọn Apply hoặc bỏ qua AI và dùng đoạn gốc.
- [ ] Kiểm thử fake success, timeout, quota, output sai schema/đáp án MCQ, regenerate thay tập ID, Generate đến muộn sau discard/reassign và chọn tập cũ. Smoke provider thật với tài liệu mẫu, xác nhận schema hợp lệ, chi phí nằm trong budget dev và không có AI grading/raw input trong learner response.

### T7 — Kiểm thử xuyên luồng và rollout · Ngày 9–10

- [ ] Chạy kiểm thử trong bảng dưới. Playwright chạy Teacher import → chọn đoạn/đề xuất → Apply → chỉnh trong Studio → Submit → Admin Review/Approve/Publish → learner đọc và làm bài. Chạy Paste và một fixture URL/PDF cho happy path; DOCX và biến thể lỗi chạy adapter/route tests. Kiểm tra Wizard ở desktop và 360/390 px, gồm lỗi/stale/retry và trạng thái pending.
- [ ] Thử cleanup expiry và retry khi Storage lỗi. Xác minh backup/restore đọc được published snapshots. Migrate additive, đưa reader hỗ trợ managed media lên cả admin/web trước khi bật writer. Bật import thủ công trước, rồi bật URL/file, AI và media sau smoke tương ứng. Khi tắt tính năng, các revision đã lưu vẫn đọc được bằng reader tương thích.
- [ ] Ghi kết quả PASS/FAIL từng phần cùng lệnh, số ca và blocker thật. Nếu provider/bucket dev chưa xác minh được, ghi rõ AI/media chưa đạt nghiệm thu và giữ phần đó tắt.

## Kiểm thử và nghiệm thu

| Hạng mục | Cách kiểm tra |
| --- | --- |
| Baseline đã chạy | `npm run test:integration:studio` pass 35/35. `node scripts/local-test-db.mjs node --experimental-strip-types --experimental-test-module-mocks lingora-admin/tests/feature/studio-e2e-workflow.test.mjs` pass 9/9. Lệnh sau kiểm tra lifecycle qua service và PostgreSQL. |
| Schema và build | `npm run db:product:validate`, `npm run db:product:generate`, `npm run typecheck`, `npm run build`. Kiểm tra migrate trên DB sạch và DB có lesson V0/V1. |
| Regression | `npm run test:feature`, `npm run test:components`, `npm run test:integration:studio`, workflow lifecycle ở trên và `npm run test:integration:practice`. Chạy ca Sprint 2 mới qua harness PostgreSQL/Playwright hiện có và đưa chúng vào lệnh test phù hợp của repo. |
| Nghiệm thu browser và tích hợp thật | Playwright theo T7, Storage private với image/audio thật, provider dev với fixture nhỏ. Kiểm tra learner chỉ đọc revision được cấp quyền, grading thực thi server-side và không lộ answer key. |

Sprint đạt khi Teacher nhập được cả bốn loại nguồn và Apply được theo hai luồng thủ công/AI. Chỉ các mục đã chọn vào successor. Admin thấy attribution khi review. Learner thấy nội dung và media của đúng revision sau Publish. Retry, stale, reassign, discard và lỗi một phần đều có ca kiểm thử xác nhận trạng thái cuối. URL/file/AI/media đều có giới hạn vận hành đã kiểm chứng trên môi trường bật tính năng.

# Pragmatic reset — 2026-10-28

`WP-DB-REMAIN-01` đã **CANCELLED** theo chỉ thị chủ dự án. Preapply/Stage A/Stage B và điều kiện audit DATABASE READY để bắt đầu code app đã được bỏ khỏi quy trình. Ngoài migration thứ 5, chưa xóa hoặc archive hàng loạt file nào.

## 1. Database và lệnh chạy

| Yêu cầu | Kết quả thực tế |
|---|---|
| Xóa migration thứ 5 | Đã xóa `lingora-admin/prisma/product/migrations/20261028000000_product_remaining_repair/`. |
| Giữ bốn migration và schema | Đã so sánh trực tiếp bytes trước/sau: baseline, finalize, correction, remediation và `schema.prisma` không thay đổi. Không tạo manifest/hash mới. |
| Generate Client | `npx prisma generate --schema=lingora-admin/prisma/product/schema.prisma` từ workspace root: exit 0, Prisma Client 6.19.3 được generate. Biến môi trường từ admin `.env` được nạp trong process, không in credentials. |
| Kết nối/lịch sử | Từ admin: `npx prisma migrate status --schema prisma/product/schema.prisma`: exit 0; bốn migration, database up to date. |
| Đọc bằng Client | Product Prisma Client thực hiện `language.count()` và `course.count()`: thành công, 2 languages và 1 course. Đây là kiểm tra chỉ đọc. |
| Migrate | Admin dùng `prisma migrate deploy --schema prisma/product/schema.prisma`; root tiếp tục delegate vào admin workspace. Không còn chạy wrapper preflight trước/sau. |
| Seed | Admin dùng `prisma db seed --schema prisma/product/schema.prisma`; `package.json#prisma.seed` trỏ tới seed hiện có. Đã bỏ import/call preflight trong entry point seed; giữ transaction, kiểm tra xung đột và disconnect. |
| `dev` / `build` | Cả hai package chưa có các lệnh này hoặc pre/post hook tương ứng. Chưa có web app để chạy; không thêm lệnh giả. |

Các lệnh preflight/smoke riêng vẫn nằm trong package để chờ xác nhận dọn dẹp; chúng không được gọi bởi migrate/seed. Root `package.json` đã kiểm tra và không cần sửa. Chưa chạy migrate deploy, seed hay smoke lên DEV; không thay đổi dữ liệu hoặc trigger trong database.

## 2. Ba nhóm cần đơn giản hóa

Quét cấu trúc gồm root/config, `lingora-admin/`, `scripts/`, `plans/`, `docs/`, `.agents/`, `scratch/`, các thư mục harness ẩn. Không đọc toàn bộ nội dung dependency/generated/cache. `plans/` có khoảng 3.3 MB; bằng chứng database khoảng 16 MB. Kích thước không tự chứng minh một file là rác.

| Nhóm | Phát hiện | Đề xuất |
|---|---|---|
| Rác kiểm duyệt / bằng chứng chéo AI | Bốn wrapper/contract product, script provenance/dependency proof, nhiều entry/hash/review/correction/log và source snapshot. | Archive các phần lịch sử đã hết nhiệm vụ; gỡ wrapper khỏi package khi xóa. Danh sách cụ thể bên dưới, **chờ xác nhận**. |
| SQL Trigger nghiệp vụ | 71 tên trigger khác nhau trong bốn migration; một số định nghĩa được thay thế ở migration sau. Snapshot JSON, provenance, freeze và scope kiểm tra nhiều bảng có thể chặn CRUD. | Có thể dùng migration mới DROP từng nhóm đã chọn, sau khi Backend đảm nhiệm validation của nhóm đó. Giữ cấu trúc và bảo vệ dữ liệu cần thiết. **Chưa tạo migration này.** |
| Chỉ thị AI / kế hoạch | `AGENTS.md` cũ dài khoảng 210 dòng, entry chain nhiều tài liệu, spec/approved snapshots và review bắt buộc. Có 22 file Markdown ở root `plans/`, 103 mục trong `plans/approved/`. | Đã thay quy tắc hoạt động bằng KISS; các kế hoạch cũ không tự kích hoạt công việc. Không có `CLAUDE.md`, `.cursorrules` hoặc `.cursor/rules/` trong phần repo được quét. |

### Danh sách chờ xác nhận xóa hoặc archive

Các đường dẫn dưới đây tính từ workspace root. Ưu tiên archive để giữ lịch sử học thuật/khắc phục sự cố nếu còn cần.

| Đường dẫn cụ thể / phạm vi | Lý do và phụ thuộc |
|---|---|
| `lingora-admin/scripts/product-catalog-contract.mjs` | Expected catalog/checksum contract; vẫn yêu cầu migration thứ 5 đã hủy. Không phải runtime CRUD. |
| `lingora-admin/scripts/product-preflight.mjs` | Parser/target/state/catalog gate, bao gồm bộ 22 parser cases. Sau reset, seed và migrate chính không phụ thuộc file này. |
| `lingora-admin/scripts/product-database-smoke.mjs` | Phụ thuộc preflight và catalog contract, chứa fixtures/gates cũ. Không nên dùng làm điều kiện bắt đầu code. |
| `lingora-admin/scripts/product-migrate.mjs` | Wrapper pre/post gate cũ, hiện không còn được lệnh migrate gọi. |
| `scripts/verify-provenance.py` | Kiểm tra hash của bằng chứng và manifest lịch sử. |
| `scripts/verify-dependencies.mjs` | Proof cài dependencies cô lập, binary hashes và acceptance G0; không cần nằm trong luồng viết tính năng hằng ngày. Giữ lockfile/npm tooling bình thường. |
| `docs/design/physical/evidence/2026-10-28-database-remaining-repair/` | Có `entry-and-source.json`, `preapply-review.md`, `preapply-review-correction.md`, `correction-result.md`, `checks.log`, worker logs/task prompts, `stage-a-result.md`. SQL/ZIP trong đây chứa migration đã hủy; chỉ là snapshot lịch sử, không phải nguồn migrate hiện tại. |
| `docs/design/physical/evidence/2026-10-27-product-database-finalize/` và `docs/design/physical/evidence/2026-10-27-product-database/` | Review/correction/parity/logs của các vòng trước; có thể archive cả thư mục thay vì để agent đọc lại. |
| `plans/2026-10-28-database-remaining-repair-spec.md`, `plans/2026-10-27-product-database-finalize-spec.md`, `plans/2026-10-27-product-database-spec.md` | Spec cũ áp đặt audit/acceptance. Spec remaining repair đã được đánh dấu CANCELLED; cả ba là ứng viên archive. |
| `plans/approved/` và các plan cũ ở root `plans/` | Nhiều snapshot/quy trình đã kết thúc. Chọn archive theo tác vụ; giữ `plans/current-task.md` gọn, không xóa mù toàn bộ tài liệu sản phẩm. |
| `docs/design/physical/verification-manifest.json` | Manifest verification lịch sử; không cần cho Backend/API/UI. |
| `docs/design/physical/evidence/2026-10-25-wp00-g0-repair/before/`, `docs/design/physical/evidence/2026-10-25-p1-feasibility/entry-source/`, `docs/design/physical/evidence/2026-10-26-p1-00-transport-repair/entry-source/` | Bản sao source phục vụ chứng minh/review cũ; khác với source chạy app. |

Trước khi xóa các script product, gỡ các alias riêng `db:product:preflight` / `db:product:smoke` trong **cả hai** package và xử lý các link tài liệu lịch sử liên quan. Hiện `product-migrate.mjs` và smoke vẫn import preflight/catalog; nên archive cùng nhóm. Không còn import các gate này từ seed hoặc module runtime DB.

Không tìm thấy file tên chính xác `lingora_canonical_product_db.sql`. Có bundle tương tự `docs/design/physical/evidence/2026-10-28-database-remaining-repair/database-source.sql` và ZIP review cùng thư mục; không dùng chúng thay bốn migration hiện tại.

**Chưa phân loại là rác cần xóa:** product schema/bốn migration/seed, `src/server/db/index.js`, FK/UNIQUE/CHECK, `.env`, `package-lock.json`, test integrity/security/concurrency có giá trị, tài liệu yêu cầu và công cụ dựng sơ đồ/báo cáo. `.agents/` chủ yếu là skill PowerPoint và reference security/performance, không có cổng audit database bắt buộc riêng. `scratch/` chứa công cụ báo cáo cũ, có thể rà riêng nếu muốn dọn đồ án.

**Dung lượng harness ngoài luồng app:** `.supabase-home/` khoảng 1.5 GB, `.wp00-runs/` khoảng 1.5 GB, `.wp00-home/` khoảng 27 MB. Đây là dữ liệu/caches/lifecycle harness, không phải chỉ tài liệu chấm chéo AI. Chưa xóa, dừng tài nguyên hay kết luận có thể xóa an toàn toàn bộ.

### Trigger có thể cản CRUD

Đọc theo thứ tự baseline → finalize → correction → remediation; các ví dụ dưới đây dùng định nghĩa sau cùng khi đã được thay thế. Số 71 là số tên khác nhau trong source, không phải một chứng nhận hành vi/live audit.

| Trigger / nhóm | CRUD bị ảnh hưởng | Đề xuất |
|---|---|---|
| `trg_assessment_version_snapshot_shape` | INSERT/UPDATE assessment version phải có JSON object đủ 11 khóa, generation và scope khớp blueprint/course hiện tại. Định nghĩa cuối: `20261027030000_product_remediation/migration.sql:393–464`. | Ứng viên rõ nhất để chuyển validation envelope sang Backend. |
| `trg_lesson_revision_provenance`, `trg_item_revision_provenance`, `trg_revision_review_provenance` | Tạo/sửa phải khớp assignment episode, teacher, generation/snapshot; không chỉ thỏa FK là đủ. Lesson/item: finalize `:787–869`; review: remediation `:329–387`. | Chuyển logic episode/quyền/submit vào service khi làm tính năng soạn bài. |
| `trg_lesson_revision_submitted_payload`, `trg_lesson_revision_core_readiness` | Submit phải có actor/timestamp/assignment snapshot và bài tập core; đã submit thì nhiều trường không được sửa hoặc quay về draft. Remediation `:191–327`, baseline `:1520–1544`. | Đưa kiểm tra chuyển trạng thái vào Backend, dùng transaction. |
| `trg_lesson_revision_delete`, `trg_item_revision_insert`, `trg_item_revision_delete`, `trg_item_revision_frozen`, `trg_lesson_exercise_parent_frozen`, `trg_lesson_vocabulary_parent_frozen`, `trg_media_binding_parent_frozen`, `trg_vocabulary_frozen`, `trg_vocabulary_delete` | Cấm thêm/sửa/xóa nội dung hoặc liên kết khi revision đã submit/frozen hoặc được tham chiếu. Được bổ sung/thay thế trong finalize và remediation. | Không coi lỗi này là Prisma hỏng. Có thể DROP theo nhóm sau khi Backend giữ đúng quy tắc sửa nội dung. |
| `trg_assessment_version_assembly_pins`, `trg_assessment_version_item_eligibility`, `trg_assessment_blueprint_immutable_scope`, `trg_item_revision_origin_pins`, `trg_item_identity_update` | Cố định assembly/origin/scope; thay blueprint/items hoặc sửa nguồn có thể bị từ chối. Assembly: finalize `:544–564`; blueprint: remediation `:567–588`. | Xử lý tại service assessment khi triển khai tính năng đó. |
| `trg_course_scope`, `trg_course_deactivate_guard`, `trg_framework_level_scope`, `trg_unit_scope`, `trg_lesson_scope`, `trg_lesson_available_revision`, `trg_lesson_revision_demote_guard` | Khóa đổi ngôn ngữ/framework/level/parent khi đã có dữ liệu con; không cho tắt course còn lesson AVAILABLE; lesson AVAILABLE đòi revision PUBLISHED và course active. Course scope: finalize `:763–782`; deactivate: correction `:836–854`; available: remediation `:526–564`. | Đáng xem xét khi làm Quản lý Khóa học. Chuyển kiểm tra UI/backend trước khi bỏ từng guard. |
| `trg_unit_framework_scope`, `trg_course_default_level_scope`, `trg_blueprint_scope`, `trg_assessment_blueprint_scope`, `trg_learning_context_scope`, `trg_learning_context_immutable_identity`, `trg_lesson_attempt_scope`, `trg_assessment_attempt_scope` | Kiểm tra chéo scope/course/level/context/revision; một số kiểm tra bảo vệ dữ liệu của người học. | Không DROP hàng loạt chỉ vì nhiều trigger; chuyển kiểm tra scope/ownership sang Backend trước. |
| Các trigger `*_no_update`, `*_no_delete`, completion/attempt finalized và provenance predecessor | Cố ý giữ lịch sử assignment, review, attempt, result, response, receipt/audit bất biến. Ví dụ `trg_revision_review_no_update`, `trg_lesson_attempt_completed`, `trg_assessment_attempt_finalized`. | Khác CRUD cấu hình. Giữ nếu tính năng chưa cần chỉnh lịch sử; không loại bỏ bảo vệ audit/grading một cách máy móc. |

**Khuyến nghị:** Có, một migration mới nhỏ dùng `DROP TRIGGER ... ON ...` cho một nhóm nghiệp vụ đã chọn là hợp lý; ưu tiên snapshot/provenance/freeze khi thực sự làm các tính năng đó. Không sửa bốn migration đã áp dụng. Giữ bảng, FK, UNIQUE, NOT NULL và CHECK cơ bản. Bảo vệ quyền truy cập, dữ liệu người học và grading secrets phải có ở Backend trước khi bỏ cơ chế tương ứng trong DB; không đồng loạt DROP RLS/ACL/trigger lịch sử. Sau DROP, cột bắt buộc/FK/CHECK vẫn có thể yêu cầu payload; DROP trigger không tự đơn giản hóa schema. Chưa tạo hoặc áp dụng migration DROP nào.

Lưu ý: Trong các migration cũ còn có kiểm tra pre-apply ngay trong SQL, ví dụ phần đầu remediation kiểm tra lịch sử migration. Chúng không phải wrapper npm và được giữ nguyên theo yêu cầu bảo toàn bốn migration. `migrate status` thành công không chứng minh replay từ database sạch.

## 3. Workflow đã reset

- `AGENTS.md` đã thay bằng quy tắc ngắn: KISS; không thêm trigger phức tạp, SHA-256 manifest hoặc script tự audit schema; Backend JS/TS với Zod/Prisma kiểm tra form/quyền/trạng thái; phát triển Database Query → API Route → UI và chạy thử giao diện.
- `README.md`, `HANDOFF.md`, `plans/current-task.md` và product database README phản ánh bốn migration, lệnh Prisma trực tiếp và việc hủy gói cũ.
- `docs/README.md`, `docs/QUICK-REF.md`, `docs/design/physical/README.md` có thông báo ưu tiên quy trình mới; các quy tắc vận hành cũ bên dưới được đánh dấu lịch sử. Đã bỏ mandatory entry chain trong policy index.
- Spec remaining repair có thông báo CANCELLED ở đầu. Các artifact còn lại được giữ để chờ xác nhận archive/xóa, không tự động áp dụng lại.

## 4. Tính năng đầu tiên: Quản lý Ngôn ngữ

Hiện admin có module Prisma `lingora-admin/src/server/db/index.js` và seed dữ liệu, **chưa có web runtime, API routes, UI hoặc đăng nhập Admin**. Không thể chạy một màn quản trị có sẵn ngay hôm nay bằng `npm run dev`.

Làm một vertical slice nhỏ: dựng khung web Admin tối thiểu, dùng đăng nhập Supabase và kiểm tra account có quyền Admin ở Backend; `GET/POST /api/admin/languages`, `PATCH/DELETE /api/admin/languages/:id`; một trang danh sách kèm form code/tên Anh–Việt/cờ learnable/UI locale. Dùng model `Language` và Client hiện có, validate bằng Zod, trả lỗi trùng code và lỗi FK có thông báo dễ hiểu. Không thêm service/repository framework hoặc trigger.

Chạy thử trên UI: tạo ngôn ngữ mới → sửa tên → tải lại còn dữ liệu → xóa ngôn ngữ không được tham chiếu; thử trùng code và chặn người không phải Admin. Nếu đã được course/account tham chiếu, giữ lỗi FK thân thiện. Ngôn ngữ chưa có trigger nghiệp vụ trong bốn migration nên slice này không cần chờ DROP trigger. Quản lý Khóa học làm sau; chưa cần gộp cả curriculum vào tính năng số 1.

Đây là đề xuất; chưa cài framework hay bắt đầu code tính năng.

## Kiểm tra cuối

- `node --check lingora-admin/prisma/product/seed.mjs`: exit 0.
- Parse JSON hai package và kiểm tra command/pre/post hook: hợp lệ; migrate/seed không gắn preflight/catalog/smoke.
- Import seed module không chạy preflight hoặc truy cập DB: thành công; hàm seed vẫn export.
- `npm run db:product:seed -w lingora-admin -- --help`: exit 0, gọi Prisma CLI help; không thực thi seed. Prisma 6.19.3 có cảnh báo deprecation cho `package.json#prisma` khi nâng lên Prisma 7; chưa nâng phiên bản trong tác vụ này.
- So sánh bytes bốn migration và schema: không đổi; chỉ còn bốn thư mục product migration.
- Chưa chạy migration/seed ghi dữ liệu, replay sạch, legacy audit suite hoặc kiểm thử UI vì chưa có app. Chưa tạo migration DROP trigger hoặc xóa hàng loạt các ứng viên trên.

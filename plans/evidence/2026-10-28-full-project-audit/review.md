# Audit toàn dự án Lingora — 2026-10-28

**What this repo does:** Lingora hiện có nền tảng database cho Admin, Teacher và Learner: schema Prisma 34 model, bốn migration, seed cấu hình/dữ liệu DEV và module truy cập database. Repository còn chứa đặc tả sản phẩm, sơ đồ, báo cáo học thuật và test harness lịch sử. Chưa có web framework, API, UI hay ứng dụng đăng nhập của thiết kế mới; đây là phạm vi chưa triển khai đã được công khai, không phải lỗi phát hiện trong audit.

**Tải giả định:** một người vận hành generate/migrate/seed tại môi trường phát triển; dữ liệu thử nghiệm nhỏ. Chưa có lưu lượng ứng dụng thực tế hoặc mục tiêu tải được phê duyệt để đánh giá p95, số kết nối hay throughput. Không suy diễn khả năng phục vụ production từ các kiểm tra nguồn dưới đây.

**VERDICT: FAIL** — còn ba lỗi bảo toàn/tương ứng dữ liệu trong SQL hiện có, một khoảng trống kiểm thử và một mâu thuẫn tài liệu hiện hành. Ba lỗi SQL đã được công khai trước audit này; không có bằng chứng chúng phát sinh trong đợt dọn tài liệu. Kết quả này không khôi phục preapply, Stage A/B, DATABASE READY hoặc gói đã hủy, và không chặn bắt đầu slice Quản lý Ngôn ngữ độc lập với các luồng nội dung/assessment bị ảnh hưởng.

**Ưu tiên theo hiện trạng:** FA-01–03 là P2 vì hiện chỉ có đường ghi DB của người phát triển, chưa có endpoint để người dùng khai thác. Mục Must fix xác định điều cần sửa trước khi phát hành đúng luồng bị ảnh hưởng; chưa có sự cố dữ liệu live được xác minh trong audit này.

## Phạm vi và căn cứ

- Đối tượng là **toàn bộ working tree hiện tại**, gồm cả file chưa track; không chỉ diff so với HEAD `c39806cb45c908135f240c93d68546b6ac5d7784`.
- Đã đọc `AGENTS.md`, README, `plans/current-task.md`, HANDOFF, hướng dẫn môi trường/product database; đối chiếu addendum đang có hiệu lực trong requirements, UC, ADR-030–036/041–044 và chỉ mục modeling.
- Đã đọc schema product, toàn bộ seed/module DB; lần theo các FK, CHECK, index, quyền và định nghĩa trigger cuối cùng qua bốn migration. Đã xem cấu trúc test, A3, các công cụ product cũ và bằng chứng remediation liên quan trực tiếp.
- Các ví dụ SQL trong finding là **phân tích tĩnh từ guard cuối cùng và ràng buộc liên quan**, không phải tuyên bố vừa tái hiện trên database thật. Reviewer không chạy test, không kết nối DB, không đọc/in credentials, không sửa source hoặc Git state.
- Không lấy nhãn CURRENT trong năm sơ đồ snapshot cũ làm hiện trạng triển khai: chỉ mục đã phân loại chúng là snapshot trước khi xóa code ngày 2026-10-22. Logical model và physical model cũng không bắt buộc có số entity bằng nhau.

## Must fix — trước khi triển khai luồng nội dung/assessment tương ứng

### 1. FA-01 — Sửa được lịch sử của Lesson revision đã nộp

**Mức:** P2 · **Owner:** `lingora-admin`, luồng nội dung · **Căn cứ:** lỗi correctness; ADR-035/036 về revision và lịch sử bất biến. **Đã biết:** FDB-05 trong HANDOFF/báo cáo cleanup.

**Vị trí:** [migration remediation, dòng 294](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027030000_product_remediation/migration.sql:294), đoạn 294–314. Guard quan hệ predecessor ở [baseline, dòng 1566](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027000000_product_baseline/migration.sql:1566).

- **Đây là gì:** Revision đã nộp cần giữ nguyên nội dung và nguồn gốc; thay đổi nội dung phải tạo revision kế tiếp.
- **Vấn đề:** Nhánh `v_has_submit` bỏ qua `created_at` và `prior_revision_id`. Với revision số 3 đã submit và có predecessor số 1, một UPDATE chỉ đổi timestamp tạo hoặc đổi predecessor sang revision số 2 cùng Lesson vẫn thỏa guard hiện có; guard predecessor chỉ kiểm tra cùng Lesson và số nhỏ hơn.
- **Sửa nhỏ nhất:** Khi làm service nội dung, giới hạn trường UPDATE theo trạng thái bằng Backend JS/TS và giữ nguyên hai trường này; kiểm tra trạng thái và ghi trong cùng transaction. Nếu giữ cam kết bất biến ở tầng DB với nhiều đường ghi, dùng migration mới sửa đúng hai phép so sánh của guard hiện hữu; không sửa migration đã áp dụng, không tạo hệ thống trigger mới.
- **Nếu bỏ qua:** Mốc tạo và chuỗi kế thừa của bằng chứng đã nộp có thể bị viết lại dù các trường nội dung vẫn nguyên vẹn. Cần một regression test với revision đã submit: đổi riêng từng trường phải bị từ chối, chuyển trạng thái hợp lệ vẫn thành công.

### 2. FA-02 — Review nhận generation và scope không thuộc episode đã trỏ tới

**Mức:** P2 · **Owner:** `lingora-admin`, luồng review · **Căn cứ:** lỗi correctness; ADR-035/043 về nguồn gốc contribution/review. **Đã biết:** FDB-06 trong HANDOFF/báo cáo cleanup.

**Vị trí:** [migration remediation, dòng 347](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027030000_product_remediation/migration.sql:347), đoạn 347–375; shape CHECK ở [baseline, dòng 1400](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027000000_product_baseline/migration.sql:1400).

- **Đây là gì:** Mỗi review lưu episode phân công, generation và bản chụp scope để biết ai chịu trách nhiệm cho phiên bản được duyệt.
- **Vấn đề:** Trigger đọc generation/snapshot của episode nhưng so chúng với trường của Lesson revision, không so với `NEW.assignment_generation` và `NEW.assignment_scope_snapshot` của chính review. Với episode generation 1 và scope hợp lệ, có thể INSERT review trỏ đúng episode nhưng lưu generation 999 và scope `{}`; CHECK chỉ đòi số dương và JSON object. Review append-only sau đó giữ nguyên thông tin sai này; membership assessment còn có thể từ chối contribution vì đọc generation sai từ review.
- **Sửa nhỏ nhất:** Service review đọc episode tin cậy và tự gán generation/snapshot trong transaction; không nhận hai giá trị này làm dữ liệu có thẩm quyền từ client. Nếu tiếp tục bảo vệ nhiều đường ghi bằng DB, bổ sung đúng hai phép đối chiếu vào guard sẵn có qua migration mới.
- **Nếu bỏ qua:** Bản ghi review có episode hợp lệ nhưng bằng chứng phân công sai, làm hỏng truy vết và khả năng assembly sau đó. Test cần dùng đúng các parent hợp lệ, chỉ làm sai generation hoặc scope, rồi xác nhận bị từ chối tại boundary dự kiến.

### 3. FA-03 — Assessment snapshot đóng băng cấu hình sai hoặc rỗng

**Mức:** P2 · **Owner:** `lingora-admin`, assessment assembly · **Căn cứ:** lỗi correctness; ADR-036/043 về version gắn với blueprint/configuration. **Đã biết:** phần snapshot của FDB-06 trong báo cáo cleanup.

**Vị trí:** [migration remediation, dòng 409](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027030000_product_remediation/migration.sql:409), đoạn 409–453; [assembly pin guard, dòng 544](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/migrations/20261027010000_product_finalize/migration.sql:544).

- **Đây là gì:** Assessment version lưu bản chụp blueprint để các lần làm bài tiếp tục dùng cùng cấu hình dù blueprint thay đổi.
- **Vấn đề:** Snapshot đúng các ID/purpose/generation vẫn qua kiểm tra khi chứa `config: null`, `coverage_catalog_generation: null` và `schema_version: "anything"`. Trigger chỉ kiểm tra có key/text; không đối chiếu config/catalog với blueprint, còn guard assembly cấm sửa snapshot sau khi tạo.
- **Sửa nhỏ nhất:** Backend assembly tạo snapshot từ blueprint đã đọc trong transaction; dùng Zod kiểm tra version, kiểu dữ liệu và các giá trị cần khớp trước INSERT. Không thêm parser/trigger phức tạp; chỉ duy trì guard DB tối thiểu nếu vẫn cho phép đường ghi khác.
- **Nếu bỏ qua:** Có thể lưu một version bất biến thiếu cấu hình cần để tái hiện/chấm bài, phải tạo version khác hoặc sửa dữ liệu thủ công. Test cần blueprint hợp lệ với config/catalog đã biết và snapshot chỉ sai một trường; kết quả phải bị từ chối trước khi lưu.

## Should fix

### 4. FA-04 — Chưa có kiểm thử hồi quy dùng được cho đường product seed hiện hành

**Mức:** P2 · **Owner:** `lingora-admin`, kiểm thử product · **Căn cứ:** khoảng trống kiểm thử cho thao tác ghi dữ liệu; không phải yêu cầu khôi phục bộ nghiệm thu lịch sử.

**Vị trí:** [transaction seed, dòng 279](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/prisma/product/seed.mjs:279), [package scripts, dòng 8](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/package.json:8), [smoke lịch sử, dòng 138](/home/tung/workspace/school/project1/lingora-workspace/lingora-admin/scripts/product-database-smoke.mjs:138).

- **Đây là gì:** Seed đang được README hướng dẫn chạy trực tiếp; nó phải giữ dữ liệu đang có, chạy lại không đổi ngữ nghĩa và rollback khi gặp xung đột.
- **Vấn đề:** Các test `test:db:*` đi vào harness parked/A3 với schema khác; kiểm tra seed nằm trong smoke lịch sử còn bắt buộc migration thứ 5 đã bị hủy. Vì vậy các unit test harness PASS không phát hiện một thay đổi tương lai vô tình ghi đè seed hoặc làm mất transaction; đây là thiếu bằng chứng hồi quy, không phải kết luận seed hiện hỏng.
- **Sửa nhỏ nhất:** Khi chỉnh đường seed, thêm một bộ test nhỏ gọi trực tiếp `seed`: chạy hai lần, tạo xung đột ở bước muộn và xác nhận dữ liệu trước đó nguyên vẹn. Dùng fixture/DB thử nghiệm riêng phù hợp sẵn có, không chạy smoke cũ lên DB DEV và không dựng lại bộ gate/hash/catalog.
- **Nếu bỏ qua:** Một lệnh ghi đang được sử dụng sẽ chỉ được kiểm tra cú pháp, còn lỗi rollback/idempotency dễ lọt qua. Reviewer cần kết quả gắn với chính product source; bằng chứng harness schema khác không thay thế được.

### 5. FA-05 — Tài liệu đang có hiệu lực vẫn mô tả checkout đã bị thay thế

**Mức:** P2 · **Owner:** tài liệu sản phẩm · **Căn cứ:** tính nhất quán nguồn hướng dẫn hiện hành; đối chiếu README/current-task và source product.

**Vị trí:** [requirements, dòng 6](/home/tung/workspace/school/project1/lingora-workspace/docs/02-requirements.md:6) và [current traceability, dòng 52](/home/tung/workspace/school/project1/lingora-workspace/docs/05-traceability-matrix.md:52), đoạn 48–59.

- **Đây là gì:** `docs/README.md` dẫn requirements và traceability như nguồn hiện hành để xác định quy tắc và bằng chứng triển khai.
- **Vấn đề:** Header requirements vẫn nói checkout design-only, không có executable database baseline. Bảng tự gọi là current traceability lại nói `lingora-web` có auth UI, Prisma có sáu role/`ContentStatus`, và không có assignment persistence; thực tế không có `lingora-web`, còn product schema có Account ba role và `ContentAssignment`/`LessonRevision`. Ngày cũ chưa đủ phân biệt khi đoạn vẫn nói “current” và không được gắn nhãn lịch sử tại chỗ.
- **Sửa nhỏ nhất:** Đổi trạng thái của phần repository evidence này thành snapshot ngày 2026-10-10/22, thêm một câu dẫn tới README/product schema/current-task cho hiện trạng. Giữ nguyên quy tắc nghiệp vụ và nội dung lịch sử; không cập nhật lại toàn bộ báo cáo hoặc sơ đồ.
- **Nếu bỏ qua:** Người triển khai đọc đúng chuỗi tài liệu được chỉ dẫn vẫn có thể kết luận auth đã tồn tại hoặc database chưa tồn tại, chọn sai điểm bắt đầu. Đối chiếu lại các câu hiện trạng sau sửa; không cần test runtime.

## Phần nguồn đang hợp lý

- Entry README/HANDOFF/current-task mô tả trung thực nền tảng 34 model, bốn migration và ứng dụng chưa triển khai. Đề xuất Languages có auth/session và kiểm tra `ACTIVE ADMIN` ở Backend; không có bằng chứng cần thêm một bộ gate trước slice này.
- Seed dùng `update: {}` khi upsert, kiểm tra xung đột ngữ nghĩa, có transaction bao trùm cho PrismaClient; không thấy nguồn chủ động reset hay overwrite dữ liệu hiện có. Đây là kết luận đọc source, chưa phải chứng minh thực thi.
- FK/composite key, UNIQUE, CHECK cơ bản, số nửa điểm N/K, ràng buộc cùng learner/card và phân biệt PRACTICE/ASSESSMENT đã có cấu trúc bảo vệ. SQL thu hồi quyền của PUBLIC/anon/authenticated trên schema/bảng/hàm; grading secrets nằm trong `app_private`. Không suy ra đây là kiểm toán quyền live hoặc auth application đã hoàn chỉnh.
- Module DB nhỏ, không có query từ input ghép SQL, không có dấu hiệu cần thêm repository/factory/abstraction. Các index cho due SRS, lịch sử attempt và hàng đợi review đã được khai báo; chưa có số đo để báo lỗi hiệu năng.
- Không đề xuất xóa hàng loạt harness, sơ đồ, evidence hoặc dependency chỉ vì không dùng trong web runtime hiện chưa tồn tại. Các nhóm công cụ lịch sử đã được tài liệu hóa; xóa/chuyển thư mục cần scope và xác nhận riêng theo AGENTS.

## Bằng chứng kiểm tra

Đã đối chiếu [hồ sơ worker đã hiệu chỉnh](/home/tung/workspace/school/project1/lingora-workspace/plans/evidence/2026-10-28-full-project-audit/verification.md) với raw log, cwd và source được nêu. Đây là kiểm tra local không kết nối database; riêng npm audit có truy vấn registry qua mạng. Hồ sơ cuối đã sửa mô tả offline và bổ sung test công cụ sơ đồ sau một lượt correction bằng chứng.

| Kiểm tra | Bằng chứng đã đọc | Kết quả và giới hạn |
|---|---|---|
| Product Prisma validate với cả hai URL dummy | [prisma-validate.log](/home/tung/workspace/school/project1/lingora-workspace/plans/evidence/2026-10-28-full-project-audit/prisma-validate.log) | Exit 0, schema hợp lệ. Không chứng minh migration replay, kết nối DB hoặc nghiệp vụ. |
| `node -c` | [syntax-check.log](/home/tung/workspace/school/project1/lingora-workspace/plans/evidence/2026-10-28-full-project-audit/syntax-check.log) | Exit 0, 50/50 file; gồm product, harness, công cụ sơ đồ và generated client. Chỉ kiểm tra cú pháp, không phải 50 test hành vi. |
| `npm audit --package-lock-only` | [npm-audit.log](/home/tung/workspace/school/project1/lingora-workspace/plans/evidence/2026-10-28-full-project-audit/npm-audit.log) | Exit 1, ba package bị đánh dấu high do cùng một advisory; không sửa dependency. |
| `node scripts/test_drawio_from_puml.js` | [drawio-test.log](/home/tung/workspace/school/project1/lingora-workspace/plans/evidence/2026-10-28-full-project-audit/drawio-test.log) | Exit 0, 7/7 test resolver/converter PASS; dùng fixture tạm và chặn tác dụng phụ build. Không chứng minh semantic/layout của toàn bộ sơ đồ. |
| Test DB/harness | Source test và hồ sơ worker | Không chạy. Không tính skipped thành PASS và không suy ra product đã được regression test. |

**Dependency advisory:** Lockfile chứa `deepmerge-ts@7.1.5` qua `prisma@6.19.3 → @prisma/config@6.19.3`; ba kết quả high là cùng [GHSA-ggr8-5vv4-36mx / CVE-2026-40345](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). Advisory mô tả tràn stack khi merge hai đồ thị JS tự tham chiếu; JSON thông thường không tạo điều kiện này, bản vá là 8.0.0. Đã xem cách `@prisma/config` nạp merger và tìm tham chiếu trong source: chưa tìm thấy `prisma.config.*` hoặc product handler đưa dữ liệu người dùng vào deepmerge. Đây là khoản bảo trì dev tooling có advisory, chưa đủ căn cứ kết luận runtime hiện khai thác được; không tự chạy `audit fix --force` để đổi major Prisma.

## Kết luận và giới hạn

**Verdict:** ưu tiên giữ FA-01–03 trong backlog của đúng slice nội dung/review/assessment, bổ sung test product nhỏ khi chạm đường ghi và sửa nhãn hiện trạng FA-05. Có thể bắt đầu slice Quản lý Ngôn ngữ theo quy tắc Backend-first hiện hành; audit không tự cấp phép triển khai feature hay thay đổi DB.

**Not checked:** chưa kết nối/migrate/seed DB thật hoặc DB sạch, chưa kiểm kê ACL live, không chạy Auth/Storage/PostgREST, không replay migration, không đo tải hoặc thử race bằng nhiều process. Chưa kiểm tra UI/E2E vì app chưa tồn tại; không render/đọc toàn bộ layout Word/PPT/PDF/ảnh, không tái nghiệm thu toàn bộ lịch sử modeling/evidence hay native stack parked. Chưa chạy bộ parity Python/aggregate modeling verifier hoặc mọi công cụ lịch sử; 7 test converter trên là phạm vi thực thi công cụ sơ đồ của đợt này. Không thực hiện quét bí mật toàn bộ lịch sử Git hoặc khẳng định mọi liên kết ngoài đều hoạt động.

Báo cáo không liệt kê thiếu feature đã được dự kiến, lỗi style hoặc nguy cơ không có trường hợp cụ thể. Không có finding bị bỏ chỉ để đạt giới hạn 20.

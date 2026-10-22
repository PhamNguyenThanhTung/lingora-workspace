# Lingora — Sửa thiết kế, dọn code cũ và kết nối Supabase

**Ngày:** 2026-10-22. **Nguồn yêu cầu:** PO xác nhận code hiện có là code cũ, dự án mới đang design; yêu cầu xóa code cũ, lập kế hoạch sửa thiết kế và hướng dẫn kết nối Supabase.
**Phân chia công việc:** Thực hiện dọn code local trong yêu cầu này; RDR-01–03 mới lập kế hoạch, chưa sửa thiết kế. Không gọi Antigravity vì PO không yêu cầu delegation.
**Entry:** HEAD `84baa85` (prefix; xem Git để lấy SHA đầy đủ), working tree sạch. Phạm vi xóa được đối chiếu với tracked inventory trước khi thực hiện.
**Trạng thái:** Cleanup và lập kế hoạch COMPLETE; RDR-01–03 còn OPEN, chưa thực hiện sửa thiết kế. Xem [closeout](archive/2026-10-22-design-corrections-and-legacy-cleanup-DONE.md) và logs. Không coi việc lập kế hoạch là đóng RDR.

## 1. Nguồn và giới hạn

- [Review 2026-10-21](../docs/design/full-design-review-2026-10-21.md): ba P2 RDR-01–03 OPEN. FDR-01–07 vẫn CLOSED trong phạm vi đã review.
- [Authority map](../docs/README.md), ADR-030–036/041–043 trong [decision log](../logs/decision-log.md), UC/requirements hiện hành và baseline modeling điều khiển nghiệp vụ.
- Tiến độ của thiết kế mới không bao gồm auth/locale/schema/migrations cũ. Repo sau cleanup phục vụ thiết kế và tài liệu, chưa có runtime ứng dụng của thiết kế mới.
- Supabase là dịch vụ PO đã xác nhận. Hướng dẫn kết nối không phải phê duyệt schema, SQL triển khai hoặc xóa dữ liệu online.

## 2. Thứ tự và acceptance

### A — Dọn code cũ trong checkout (thực hiện ngay)

**Phạm vi chính xác:** 54 tracked files: toàn bộ `lingora-web/` (41), `lingora-admin/` (12) và root `package.json` (1). Bao gồm code, tests, cấu hình, lockfiles, `.env.example`, Prisma schema, seed, ba SQL migrations và harness cũ. Không giữ một bản app trùng trong thư mục archive; bản cũ có thể đọc lại tại entry commit bằng `git show <entry>:<path>`.

**Giữ lại:** thiết kế/PUML/Draw.io/PNG/SVG, proposed physical catalog và ERD, ADR, reports, khảo sát, logs và bằng chứng lịch sử; `scripts/`, công cụ tài liệu trong `.agents/` và `scratch/`. Không xóa chúng chỉ vì chúng cũng là file code. Không xóa repository riêng, cache, secrets hoặc dữ liệu remote.

**Phụ thuộc:** inventory + working tree sạch; kiểm tra file untracked/ignored và nested Git trước khi xóa. Có file ngoài allowlist thì giữ lại và báo rõ.

**Acceptance / verification:**

- [x] Chỉ 54 tracked files thuộc allowlist bị xóa; app packages và root npm startup aliases không còn.
- [x] README, QUICK-REF, ENVIRONMENT, authority/modeling indexes và handoff nói đúng trạng thái design-only. Năm view DATA-01/02, DEP-01, SYS-01/03 trở thành snapshot lịch sử của code đã xóa; nhãn CURRENT cũ trong payload/manifest được giữ như metadata của snapshot, không còn là bằng chứng code đang tồn tại. Chuyển 17 legacy source links trong data-model/rebuild-plan thành permalink tại entry Git; các hướng dẫn giữ/mở rộng app cũ trong inventory được đánh dấu superseded.
- [x] Kiểm exact deletion scope, protected hashes, log prefixes, local links và whitespace; xem observed results trong logs. Không chạy build/tests của app đã bỏ hoặc gọi chúng là acceptance của thiết kế mới.

**Giới hạn kiểm tra phát hiện khi cleanup:** `verify_current.py` thực tế exit 1 với `stale style`, tái hiện cùng lỗi từ entry HEAD trước mọi thay đổi. Manifest lưu hash CRLF từ Windows; checkout Linux dùng LF. Cả 36 nguồn và style khớp manifest khi chuẩn hóa sang CRLF; 72 source renders và 28 native exports khớp raw hashes. Không sửa nguồn/manifest hay checker để tạo PASS trong task cleanup. Bảo toàn byte-identical và exact-deletion checks là acceptance của cleanup; aggregate integrity chưa PASS trên môi trường này. Trước B cần xử lý khả năng kiểm tra khác newline trong một thay đổi tooling có phạm vi/evidence riêng, giữ nguyên lịch sử và không che substantive drift; đây không phải RDR-04 hoặc lỗi mới của thiết kế.

### B — RDR-01: Sửa actor của audit trong mô hình logic (chưa thực hiện)

**Files:** `docs/modeling/current-target/src/DOM-01-core-domain-model.puml`, `DATA-03-target-logical-erd.puml`; hai bộ PNG/SVG, đúng hai native pages và manifest records; ghi trace trong một correction report mới. Đối chiếu SEQ-03 và proposed security, không sửa chúng nếu đã nhất quán.

**Cách sửa:** phân biệt account action, system action và denial có verified identity nhưng chưa có application account; account reference có điều kiện, không giả tài khoản hệ thống. Account action vẫn bắt buộc actor hợp lệ. Không thêm business role hoặc bảng chỉ để chữa cardinality.

**Acceptance / verification:**

- [ ] Ba loại event trên đều biểu diễn được; account-required action thiếu account bị mô hình coi là invalid. Trace trực tiếp với ADR-035 và accepted assembly rule.
- [ ] Source/render/native thể hiện cùng actor/cardinality/conditional rule; review toàn trang và crop quan hệ audit. Giữ nguyên lịch sử Class acceptance.
- [ ] Chụp entry hashes + edited-page allowlist, render đúng hai nguồn, bảo toàn 42 native fragments khác; integrity PASS và review actual diff/ảnh. Không chạy full-bundle builder.

**Phụ thuộc:** A để có baseline checkout rõ ràng; không cần runtime/database online.

### C — RDR-02: Định nghĩa bỏ assessment contribution khỏi draft (chưa thực hiện)

**Files:** `docs/design/physical/README.md`, `security-and-rls.md`, `database-reconciliation-2026-10-20.md`, `rebuild-plan.md`; chỉ sửa `physical-erd.puml`/view exports nếu mapping trường hoặc association thực sự đổi. Không thêm module implementation.

**Cách sửa:** chọn một cơ chế bounded cho omission khỏi Lesson draft chưa frozen; so sánh explicit inclusion marker với supported successor-with-omission rồi ghi lựa chọn và lý do. Map đủ field, checked command, principal/grants, row-version, assignment và locks, readiness/assembly filtering. Không dùng generic DELETE để sửa thiếu thao tác. Attribution, source đã submit và published version membership giữ bất biến.

**Acceptance / verification:**

- [ ] Teacher hiện được giao thêm A/B, bỏ B, submit và assemble chỉ dùng A; omission không xóa A hoặc lịch sử trước đó.
- [ ] Stale version, former assignee, frozen/submitted source không được thao tác như editable draft; exact behavior/retry được ghi rõ và không lùi về source cũ bị bỏ.
- [ ] Reviewer đi qua scenario và command→field→grant→lock→assembly map; catalog/security/reconciliation/ERD khớp. SQL acceptance chỉ ghi là future NOT EXECUTED.

**Phụ thuộc:** B theo thứ tự thực hiện để dùng actor semantics đã nhất quán; core finding này không cần database deployment. Nếu lựa chọn làm phát sinh behavior mới chưa có nguồn, ghi câu hỏi PO và dừng phần phụ thuộc.

### D — RDR-03: Hoàn chỉnh quyền kiểm tra fingerprint xuyên phạm vi (chưa thực hiện)

**Files:** physical `README.md`, `security-and-rls.md`, `rebuild-plan.md`; correction report dùng chung với B/C. Có thể đối chiếu C nhưng không đồng thời chỉnh chung file trong hai luồng.

**Cách sửa:** định nghĩa internal existence-only check, exact columns/scope cần đọc, function owner, FORCE RLS policies và EXECUTE/caller chain. Authorized wrapper nhận bounded result; Teacher không được đọc/enumerate foreign item bodies/keys. Chung fingerprint lock ordering cho assessment publication và practice exposure, gồm absent-row race.

**Acceptance / verification:**

- [ ] Khác item ID nhưng cùng fingerprint xuyên assignment/course bị chặn ở cả hai hướng theo declared collision rule; case không collision đi tiếp.
- [ ] Mọi read/EXECUTE có named principal + policy; ordinary Teacher/runtime không gọi trực tiếp để dò foreign content hoặc lấy private keys.
- [ ] Trace hai transaction cạnh tranh cho thấy lock/check/commit order dự kiến ngăn bypass; reviewer kiểm privilege chain thực tế trong proposal. Chưa có SQL/RLS/concurrency execution thì không tuyên bố đã chứng minh enforcement.

**Phụ thuộc:** C vì cùng catalog/security và assembly filtering. Thực hiện tuần tự để tránh thiết kế quyền dựa trên mapping đang đổi.

### E — Chốt correction thiết kế và chuẩn bị triển khai sau đó

- [ ] Ledger RDR-01/02/03 ghi source rule, diff, scenario, observed evidence và OPEN/CLOSED; chỉ đóng lỗi khi review xác nhận. Review lịch sử không bị ghi đè.
- [ ] Modeling source/render/native parity, physical inventory/render parity và untouched hashes PASS. Chỉ render changed views; kiểm tra ảnh thật, không thay semantic review bằng grep.
- [ ] Review actual diff và evidence; một bounded correction round nếu cần, còn blocker sau re-review thì báo REVIEW. Nếu chỉ một agent thực hiện thì ghi rõ self-review, không gọi là independent acceptance; cần một review riêng trước khi tuyên bố independent closure.
- [ ] Logs/pointers/indexes được cập nhật rồi mới commit; không nâng trạng thái physical lên APPROVED bằng kiểm tra tài liệu. Không triển khai app hoặc migrate database trong task correction.

Sau đó mới lập task riêng cho physical approval và lát cắt triển khai được PO chọn; cần core API, cấu hình, UI và NFR liên quan. Không tái sử dụng nguyên schema/migration cũ làm thiết kế mới.

## 3. Supabase: mở database online và kết nối

**Đã xác nhận:** PO chọn Supabase. Tham chiếu chính thức kiểm tra ngày 2026-10-22: [Database overview](https://supabase.com/docs/guides/database/overview), [Connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres), [PSQL + SSL](https://supabase.com/docs/guides/database/psql). Chưa đăng nhập hoặc kiểm tra project của PO.

1. Mở [Supabase Dashboard](https://supabase.com/dashboard), đăng nhập. Chọn project sẵn có; nếu muốn môi trường trống tách khỏi bản cũ thì tạo project development riêng, chọn organization, đặt tên, database password và region. Không reset project cũ để chuẩn bị một bản thiết kế.
2. Mỗi project đã có PostgreSQL online. Mở **SQL Editor**, chạy câu chỉ đọc `select current_database(), current_user, now();` để thử truy cập; dùng **Table Editor** để xem bảng hiện có. Kết nối thành công không có nghĩa 34 bảng thiết kế mới đã được tạo.
3. Để kết nối từ máy cá nhân/GUI: ở project bấm **Connect → Session pooler**, lấy Host, Port, Database, User đúng từ hộp thoại. Session pooler dùng port **5432**, database thường là **postgres**, user có dạng **postgres.<PROJECT_REF>**; không lấy host/user của môi trường cũ trong ENVIRONMENT.
4. Bật SSL ở client. Với `psql`, dùng host/user lấy từ dashboard và nhập password ở prompt; với verified TLS thêm CA lấy từ database settings:

   ```bash
   psql "host=<SESSION_POOLER_HOST> port=5432 dbname=postgres user=postgres.<PROJECT_REF> sslmode=verify-full sslrootcert=/absolute/path/prod-supabase.cer" -W
   ```

   Đây là mẫu, phải thay placeholders và certificate path. Không dán password/connection URI chứa password vào chat hoặc commit. Nếu dùng connection URI, percent-encode reserved characters trong password.
5. Sau khi kết nối, chạy lại câu SELECT ở bước 2; không chạy migration/seed/reset cũ. Direct connection phù hợp migration/backup khi mạng hỗ trợ endpoint đó; transaction pooler **6543** phù hợp app serverless và không thay session mode cho mọi thao tác.

**Đưa thiết kế mới lên online về sau:** chốt design → tạo/review SQL migrations mới → chạy thử trên database development trống → kiểm constraint/RLS/grants/idempotency/concurrency theo acceptance → review kết quả rồi mới áp dụng vào target được xác định. File PUML/Draw.io không tự chuyển thành database qua việc Connect. Repo hiện chưa có migration mới được duyệt để chạy.

Supabase host database/Auth/Storage; public website cần có app được triển khai ở bước sau. Hướng dẫn này chỉ chuẩn bị khả năng truy cập PostgreSQL, không công bố website hoặc tạo bảng thay PO.

## 4. Đo tiến độ

Tách ba kết quả: cleanup local, 0–3 RDR có evidence đóng, và kết nối/triển khai online. Một mục hoàn tất không làm các mục kia tự hoàn tất. Không đặt phần trăm dự án theo số file đã sửa hoặc tính app cũ là tính năng mới.

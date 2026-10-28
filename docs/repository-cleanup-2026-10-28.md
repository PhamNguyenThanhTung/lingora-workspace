# Báo cáo Dọn dẹp Tài liệu & Kế hoạch Repository — 2026-10-28

> **Gói thực hiện:** `DOC-CLEAN-01`
> **Thời điểm hoàn tất:** 2026-10-28
> **Cơ sở thực hiện:** `plans/2026-10-28-documentation-cleanup.md`, [AGENTS.md](../AGENTS.md) và ủy quyền xóa trực tiếp từ chủ dự án.
>
> **Theo dõi sau review:** Hai báo cáo review FAIL của đợt trước được giữ nguyên. Chủ dự án đã yêu cầu Codex tự hoàn tất hai điểm còn lại theo [spec closeout](../plans/2026-10-28-documentation-closeout-spec.md); kết quả mới được ghi riêng tại mục 6.

---

## 1. Mục tiêu và Nguyên tắc Bảo toàn

Gói `DOC-CLEAN-01` thực hiện dọn dẹp dứt điểm các kế hoạch lỗi thời, bản chụp phê duyệt trùng lặp, scaffolding archive dư thừa và file log rỗng nhằm đưa repository về trạng thái tinh gọn, trung thực với hiện trạng mã nguồn.

### Các nguyên tắc bảo toàn đã tuân thủ nghiêm ngặt:
- **Bảo toàn mã nguồn & cấu hình:** Toàn bộ `lingora-admin/**` (schema 34 bảng, 4 migration, seed, `src/server/db/index.js`), `supabase/**`, `scripts/**`, `.agents/**` và `docs/scratch/**` được bảo toàn nguyên vẹn 100% từng byte.
- **Bảo toàn dữ liệu nghiên cứu gốc:** File khảo sát gốc `Khảo sát Nhu cầu & Thói quen Học Ngoại ngữ (Câu trả lời).xlsx` được giữ nguyên vẹn.
- **Bảo toàn chỉ mục Git:** Không thực hiện `git add`, `git rm`, `git commit`, `git reset` hay `git stash`. Trạng thái staged renames của `docs/scratch` và các thay đổi dirty đang có của người dùng được giữ nguyên.
- **Không xâm lấn môi trường/hệ thống:** Không kết nối cơ sở dữ liệu, không chạy Prisma migrate/generate/seed, không chạy test harness/smoke, không gọi dịch vụ mạng hay lệnh npm.

---

## 2. Số liệu Kiểm kê Thực tế

### 2.1. Trước khi dọn dẹp (Planning Inspection Baseline)
- `plans/` (gốc): 23 files — 445.020 bytes (bao gồm spec dọn dẹp)
- `plans/approved/`: 103 files — 1.681.385 bytes
- `plans/archive/`: 81 files — 822.079 bytes
- `plans/research/`: 1 file — 19.161 bytes
- `logs/`: 4 files — 1.056.239 bytes

### 2.2. Đã xóa (DELETE) — Tổng cộng: 196 files, 2.393.874 bytes (~2,39 MB)
1. **`plans/` (gốc) — Đã xóa 18 files (350.825 bytes):**
   - Các kế hoạch sửa đổi/thiết kế cũ: `2026-10-20-design-correction-plan.md`, `2026-10-20-next-design-plan.md`, `2026-10-22-design-corrections-and-legacy-cleanup-plan.md`.
   - Các kế hoạch thực thi giai đoạn trước: `2026-10-22-p0-p1-execution-plan.md`, `2026-10-22-rdr-correction-spec.md`, `2026-10-25-p1-a1-a2-a3-execution-plan.md`.
   - Các gói WP-00/G0 đã nghiệm thu: `2026-10-25-wp00-g0-d1-d2-spec.md`, `2026-10-25-wp00-g0-final-repair-spec.md`, `2026-10-25-wp00-g0-minimal-execution-spec.md`, `2026-10-25-wp00-g0-repair-spec.md`.
   - Các gói repair/continuation: `2026-10-26-p1-03a-repair-spec.md`, `2026-10-26-p1-continuation-spec.md`, `2026-10-26-repository-cleanup-spec.md`.
   - Các spec database cũ & gói đã hủy: `2026-10-27-product-database-finalize-spec.md`, `2026-10-27-product-database-spec.md`, `2026-10-28-database-remaining-repair-spec.md`.
   - Các spec an toàn runtime cũ: `plans/runtime-safety-follow-up-spec.md`, `plans/runtime-safety-single-anti-spec.md`.
2. **`plans/approved/` — Đã xóa 97 files (1.226.812 bytes):**
   - Xóa các bản chụp spec APPROVED trùng lặp, các wrapper ủy quyền đã hoàn thành, request dump dư thừa và 9 snapshot baseline cũ.
3. **`plans/archive/` — Đã xóa 80 files (816.087 bytes):**
   - Xóa các file `*-DONE.md`, `*-REVIEW.md`, `*-CAPTURE.md`, bản nháp mojibake cũ đã được ghi nhận đầy đủ trong log hoặc báo cáo phân tích.
4. **`logs/` — Đã xóa 1 file (150 bytes):**
   - `logs/model-registry.csv`: File placeholder rỗng chỉ có header, không chứa bất kỳ dữ liệu huấn luyện hay đánh giá mô hình nào.

### 2.3. Giữ lại (KEEP) và Lý do cụ thể
- **`plans/current-task.md`:** Điểm định hướng tác vụ duy nhất của repository.
- **`plans/2026-10-27-next-app-slice.md`:** Đề xuất vertical slice đầu tiên (Quản lý Ngôn ngữ cho Admin).
- **`plans/2026-10-22-database-runtime-implementation-spec.md`:** Hợp đồng kỹ thuật gốc, được tham chiếu bởi `lingora-admin/prisma/bootstrap/manifest.json` và ADR-044; thêm thông báo lịch sử.
- **`plans/2026-10-26-a3-r1-r3-r5-r6-execution-spec.md`:** Phục vụ trực tiếp consumer kiểm thử `lingora-admin/tests/database/a3/a3-database.test.mjs:82` (`EXERCISED_FILES`); thêm thông báo parked.
- **`plans/2026-10-28-documentation-cleanup.md`:** Đặc tả kiểm soát của gói dọn dẹp này.
- **`plans/research/2026-08-14-m1.2-database-schema-benchmark.md`:** Kết quả nghiên cứu benchmark 5 dự án thực tế; thêm thông báo lịch sử (baseline 17 model cũ).
- **`plans/approved/` (6 files):**
  - `README.md`: Mục lục nguồn gốc lịch sử.
  - `2026-10-12-report-functional-usecase-views-REQUEST.txt` và `2026-10-12-study-focus-personalization-f01-f02-REQUEST.txt`: Văn bản làm rõ gốc của PO cho ADR-041/042.
  - `2026-10-11-drawio-native-render-parity-BASELINE.json`, `2026-10-11-final-physical-runtime-review-BASELINE.json`, `2026-10-12-study-focus-personalization-f01-f02-BASELINE.json`: Dữ liệu đầu vào cần thiết cho các công cụ kiểm tra parity và physical review.
- **`plans/archive/README.md`:** Thông báo định hướng lịch sử.
- **`logs/` (3 files):**
  - `logs/decision-log.md`: Toàn bộ các quyết định ADR (bỏ template trống `ADR-XXX`).
  - `logs/development-log.md`: Toàn bộ nhật ký phát triển, sửa lỗi và survey (bảo toàn nguyên vẹn byte phi UTF-8).
  - `logs/test-log.md`: Toàn bộ nhật ký kiểm thử (bỏ dòng placeholder `[T-XXX]`).

---

## 3. Bảng Ánh xạ Kế thừa cho Tài liệu Bị xóa

Để không làm đứt gãy thông tin lịch sử trong các báo cáo cũ, bảng ánh xạ sau xác định tài liệu kế thừa chính thức cho từng nhóm kế hoạch đã dọn:

| Nhóm tài liệu đã xóa | Bản chất & lý do xóa | Nguồn kế thừa / Thẩm quyền chính thức hiện hành |
|---|---|---|
| **FDR Plans** (`2026-10-20-design-correction-plan.md`, `next-design-plan.md`) | Kế hoạch sửa đổi thiết kế FDR-01–07; 7 finding đã được giải quyết xong. | [Báo cáo sửa đổi thiết kế](design/design-correction-2026-10-20.md) xác nhận cả 7 điểm đã CLOSED. |
| **RDR Plans** (`2026-10-22-rdr-correction-spec.md`, `legacy-cleanup-plan.md`) | Kế hoạch sửa đổi RDR-01–03 và dọn dẹp code cũ ngày 2026-10-22. | [Báo cáo sửa lỗi RDR](design/rdr-correction-2026-10-22.md), [FTR Disposition](design/physical/ftr-disposition-2026-10-22.md) và spec triển khai 2026-10-22. |
| **WP-00 / G0 Execution & Repair** (`2026-10-25-wp00-g0-*`) | Các spec thực thi và sửa lỗi harness disposable đã nghiệm thu (G0 ACCEPTED). | Báo cáo kết quả [wp00-g0-final-repair-result](design/physical/wp00-g0-final-repair-result-2026-10-25.md) và review độc lập. |
| **P1 / A3 Plans** (`2026-10-25-p1-*`, `2026-10-26-p1-*`) | Kế hoạch thực thi P1/A1/A2/A3 cũ; đã bị dừng/parked. | Spec A3 [plans/2026-10-26-a3-r1-r3-r5-r6-execution-spec.md](../plans/2026-10-26-a3-r1-r3-r5-r6-execution-spec.md) (được giữ) và báo cáo kiểm tra harness. |
| **Product Database Finalize & Repair** (`2026-10-27-*`, `2026-10-28-*`) | Spec finalize và repair database cũ; gói `WP-DB-REMAIN-01` đã bị hủy bỏ. | [Báo cáo đánh giá remediation](design/physical/evidence/2026-10-27-product-database-finalize/remediation-review.md) và [Báo cáo reset thực dụng](pragmatic-reset-2026-10-28.md). |
| **Approved Snapshots & Archive Dumps** (`plans/approved/*`, `plans/archive/*`) | Bản sao lưu trùng lặp spec và bản ghi đóng tác vụ cũ. | Các quyết định nghiệp vụ nằm trong [Decision Log](../logs/decision-log.md) (ADR-030–036, 041–044); request PO gốc được giữ trong `plans/approved/`. |
| **Placeholder Model Registry** (`logs/model-registry.csv`) | Bảng trống 150 bytes, chưa từng có dữ liệu huấn luyện ML/NLP. | Ghi nhận trong [Traceability Matrix](05-traceability-matrix.md): Chưa có kết quả huấn luyện mô hình; bằng chứng tương lai. |

---

## 4. Bảo toàn Các Vấn đề Kỹ thuật Chưa Giải quyết (Không Mở Lại Quy trình Cũ)

Dọn dẹp tài liệu không đồng nghĩa với việc che giấu các rủi ro kỹ thuật còn tồn tại. Các điểm sau được bảo toàn minh bạch dưới dạng các giới hạn nguồn/bằng chứng lịch sử (qualified dated source/evidence gaps) trích dẫn từ [Remediation Review](design/physical/evidence/2026-10-27-product-database-finalize/remediation-review.md), không tự mở lại quy trình audit chặn toàn cục hay lập gói sửa lỗi mới:

1. **Đề xuất tính năng ứng dụng thực tế:**
   - Đề xuất vertical slice đầu tiên: Quản lý Ngôn ngữ cho Admin ([plans/2026-10-27-next-app-slice.md](../plans/2026-10-27-next-app-slice.md)), bao gồm nền tảng web tối thiểu, kiểm tra session đăng nhập và quyền Admin (`ACTIVE`) tại Backend, xử lý lỗi duplicate/FK an toàn.
   - Các chức năng Learner, Teacher, chấm điểm, SRS, điều phối thi cử chưa bắt đầu.
2. **Rủi ro tính đúng đắn của dữ liệu lưu trữ (từ Remediation Review 2026-10-27):**
   - **FDB-05 (Bảo vệ bất biến bài học đã freeze):** Trigger `guard_lesson_revision_submitted_payload` (`20261027030000_product_remediation/migration.sql:294–319`): Nhánh `ELSE` (DRAFT) có kiểm tra `created_at`, nhưng khi đã submit (`v_has_submit`), trường `created_at` bị bỏ qua khỏi danh sách so sánh (cho phép sửa timestamp tạo). Đặc biệt, cả hai nhánh đều không so sánh `prior_revision_id`, khiến revision trước đó có thể bị hoán đổi sang revision hợp lệ khác của cùng bài học.
   - **FDB-06 (Correspondence phân công review và snapshot envelope):** Trigger `check_revision_review_provenance` (`:329–382`) chỉ kiểm tra có điều kiện các pin trên Lesson, bỏ qua việc kiểm tra tính tương ứng giữa `NEW.assignment_generation` của chính dòng review với `scope_generation` của episode, và không kiểm tra `NEW.assignment_scope_snapshot` với snapshot của episode/source. Đồng thời, trigger `check_assessment_version_snapshot` (`:393–463`) chỉ kiểm tra sự tồn tại của các key trong snapshot envelope mà chưa xác thực typed/catalog correspondence (ví dụ `schema_version` chỉ cần text khác null, `coverage_catalog_generation` và `config` chỉ cần tồn tại nhưng chấp nhận null hoặc giá trị xung đột cấu hình).
   - **FDB-09 (Bằng chứng tính idempotent toàn phần của Seed):** Công cụ smoke kiểm tra seed lịch sử chỉ kiểm tra `id/updated_at/row_version` trên một số bảng và bỏ qua bảng `levels`, chưa so sánh `snapBefore1` hay đối chiếu byte-level toàn bộ bản ghi. Đây là một khoảng trống bằng chứng nghiệm thu lịch sử (dated acceptance evidence gap), không phải lỗi seed hỏng (bản thân seed đã có cơ chế upsert `update: {}` và đối chiếu ngữ nghĩa).
   - **FDB-10 (Kiểm kê quyền mặc định Global / Per-Schema):** Chưa có bảng kiểm kê quyền mặc định `pg_default_acl` cấp creator/schema (bao gồm quyền thừa kế). Đây là giới hạn về bằng chứng tài liệu/catalog (documentary/catalog evidence limit), không phải lỗ hổng rò rỉ quyền truy cập trong thực tế (các lệnh thu hồi quyền mặc định của creator và schema vẫn được duy trì trong migration).
   - *Tham chiếu:* [Remediation Review](design/physical/evidence/2026-10-27-product-database-finalize/remediation-review.md). Các vấn đề này được ghi nhận như những khoảng trống tài liệu/nguồn lịch sử; các ràng buộc nghiệp vụ cần thiết sẽ được triển khai bằng kiểm tra TypeScript/Zod tại Backend khi xây dựng từng vertical slice theo [AGENTS.md](../AGENTS.md).
3. **An toàn và chất lượng các công cụ smoke cũ:**
   - Các công cụ `product-database-smoke.mjs`, `product-preflight.mjs`, `product-catalog-contract.mjs` còn trên đĩa chứa các khiếm khuyết đã ghi nhận: mutation dữ liệu A1, upsert identity thiếu dọn dẹp triệt để (FDB-04/11), bẫy lỗi 23514 quá rộng gây false-positive (FDB-08), thiếu bằng chứng replay sạch (FDB-02/03/12).
   - Các công cụ này **không được chạy tùy tiện** như kiểm tra chỉ đọc.
4. **Trạng thái Harness đang Parked:**
   - Package A3 chưa được nghiệm thu chính thức; A1/A2 chưa từng được dispatch; tích hợp native chưa chứng minh; tài nguyên tiến trình `UNKNOWN` (pending-stop) chưa được giải phóng hoàn toàn. Giữ nguyên trạng thái này; việc xử lý tài nguyên harness thuộc scope an toàn riêng.
5. **Nghiên cứu học thuật:**
   - Khảo sát thực tế N=15 được bảo toàn nguyên bản trong file Excel. Các tuyên bố sơ bộ N=35 và N=3 trong tài liệu học thuật cũ giữ nguyên giá trị lịch sử. Xóa file registry rỗng khẳng định rõ ràng chưa có kết quả training model.

---

## 5. Kết quả Kiểm tra Không Đột biến (Non-Mutating Verification)

Các mục 1–4 là kết quả được ghi nhận trong đợt dọn trước, không phải kiểm tra mới của lượt closeout. Log thực thi tạm của đợt đó hiện không còn; không thể tái đối chiếu toàn bộ stdout từ báo cáo này. Phạm vi và kết quả kiểm tra mới nằm ở mục 6.

1. **Bảo toàn byte của 191 file được bảo vệ:** So sánh in-memory toàn bộ nội dung byte và permissions của 191 file (`lingora-admin/**`, `supabase/**`, `scripts/**`, `.agents/**`, `docs/scratch/**`, `package.json`, `package-lock.json`, file khảo sát) trước và sau khi dọn dẹp: **100% KHỚP HOÀN TOÀN (Zero Drift)**.
2. **Bảo toàn chỉ mục Git:** Lệnh `git ls-files --stage` trước và sau thao tác: **100% KHỚP TỪNG KÝ TỰ**. Trạng thái 47 file staged renames của `docs/scratch` và các sửa đổi dirty nguyên bản được giữ nguyên tuyệt đối. Lệnh `diff -u /tmp/lingora-doc-cleanup-baseline-20261028-staged.numstat <(git diff --cached --numstat)` trả về mã thoát 0.
3. **Kiểm tra cú pháp cấu hình Package:** Parse JSON thành công `package.json` và `lingora-admin/package.json` mà không thực thi npm hay thay đổi node_modules.
4. **Kiểm tra định dạng Text/Whitespace (`git diff --check`):**
   - Lệnh `git diff --check -- logs/development-log.md` trả về mã thoát **2** do 2 dòng trailing whitespace tại `logs/development-log.md:3468,3470`. Đây là 2 dòng ngắt dòng (2 dấu cách cuối dòng) thuộc lịch sử sửa đổi từ phiên làm việc trước (2026-10-26). Theo yêu cầu của spec và nguyên tắc bảo toàn byte lịch sử, các byte này được giữ nguyên, không chuẩn hóa gượng ép để lấy PASS.
   - Lệnh `git diff --check` trên các file văn bản tracked đã chỉnh sửa khác (`README.md`, `HANDOFF.md`, `ENVIRONMENT.md`, `DESIGN.md`, `docs/README.md`, `docs/QUICK-REF.md`, `docs/04-data-model.md`, `docs/05-traceability-matrix.md`, `docs/design/physical/README.md`, `docs/design/physical/rebuild-plan.md`, `docs/design/physical/ftr-disposition-2026-10-22.md`, `docs/design/physical/review-and-verification.md`, `plans/current-task.md`, `plans/research/2026-08-14-m1.2-database-schema-benchmark.md`, `plans/approved/README.md`, `plans/archive/README.md`, `logs/decision-log.md`, `logs/test-log.md`): **Mã thoát 0 (PASS)** được ghi nhận ở đợt trước.
   - Kiểm tra trailing whitespace trên file báo cáo mới `docs/repository-cleanup-2026-10-28.md` và các spec retained plans: **Mã thoát 0 (PASS)**.
5. **Kiểm tra liên kết của đợt trước — chưa xác minh lại được:** Các tổng số cũ mâu thuẫn giữa báo cáo và phần tóm tắt thực thi, nên đã bỏ thay vì sử dụng làm bằng chứng PASS. Khi log tạm đã mất, không xác nhận được chính xác số liên kết, cách kiểm tra fragment hay trạng thái file gắn với từng lần chạy. Các trích dẫn lịch sử tới plan đã xóa, đường dẫn Windows và thiết kế PlantUML cũ vẫn có thể tồn tại trong nhật ký/tài liệu đóng băng; bảng ánh xạ ở mục 3 giải thích nguồn kế thừa. Không có kết luận toàn repo không còn liên kết gãy.

## 6. Closeout 2026-10-28

- **Thực hiện:** Codex tự sửa theo yêu cầu mới của chủ dự án, không gọi Anti hoặc agent khác. Đây là lượt tự kiểm tra; hai review FAIL trước vẫn là kết quả lịch sử của bản cũ.
- **DC-R1:** Đã thay đoạn trạng thái vật lý lỗi thời và yêu cầu duyệt tiếp theo trong `docs/README.md` bằng hiện trạng schema/4 migration, phạm vi tính năng chưa viết và các liên kết lịch sử có ngày cụ thể. Bảng thẩm quyền không còn tuyên bố toàn bộ phần vật lý chưa được triển khai hoặc phải chờ một vòng duyệt cũ.
- **DC-R3:** Đã bỏ các tổng số liên kết cũ không thể chứng minh và kiểm tra mới trên đúng 12 file trong spec closeout. Các kết quả bảo toàn/kiểm thử của đợt trước không được coi là kết quả chạy mới.
- **Kết quả mới:** Python chuẩn, chỉ đọc file, cwd là workspace root; exit **0**. Đếm từng lần xuất hiện của liên kết Markdown nội bộ dạng inline/reference, bỏ code block, inline code, ảnh và URL có scheme/host. Đối chiếu file/thư mục, giải mã URL và kiểm tra fragment Markdown bằng heading/id: **185 liên kết kiểm tra = 185 hợp lệ + 0 chưa giải quyết**, trong đó có **3 fragment**; **22 URL ngoài được bỏ qua**.

| File trong phạm vi | Liên kết nội bộ kiểm tra |
|---|---:|
| `README.md` | 11 |
| `HANDOFF.md` | 3 |
| `ENVIRONMENT.md` | 1 |
| `DESIGN.md` | 8 |
| `docs/README.md` | 60 |
| `docs/QUICK-REF.md` | 36 |
| `docs/design/physical/README.md` | 32 |
| `docs/design/physical/rebuild-plan.md` | 11 |
| `docs/design/physical/ftr-disposition-2026-10-22.md` | 4 |
| `docs/repository-cleanup-2026-10-28.md` | 15 |
| `plans/current-task.md` | 4 |
| `plans/2026-10-28-documentation-closeout-spec.md` | 0 |
| **Tổng** | **185** |

- **Kiểm tra hoàn tất:** `git diff --check -- docs/README.md plans/current-task.md` đạt (exit 0); kiểm tra whitespace trên báo cáo và spec mới đạt. Đối chiếu đầy đủ `git ls-files --stage -z` với `git ls-tree -r -z HEAD` cộng 47 lần chuyển `scratch/` → `docs/scratch/` đã stage từ trước: **1.175 entry khớp object ID/mode/stage**, không thêm thay đổi vào chỉ mục (exit 0). Tự đọc lại các đoạn từng bị DC-R1 nêu ra; không còn yêu cầu duyệt thiết kế cũ trước khi lập kế hoạch tính năng.
- **Giới hạn:** Đây là tự kiểm tra tài liệu, không phải review độc lập, kiểm tra toàn repo, kiểm tra URL mạng hoặc kiểm thử DB/app. Không sửa các báo cáo lịch sử hay chạy lại các script/harness cũ. Hai điểm DC-R1 và DC-R3 của bản trước đã được xử lý trong phạm vi closeout này.

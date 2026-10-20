# Kế hoạch tiếp theo sau baseline Class/Activity

**Ngày:** 2026-10-20. **Loại:** DESIGN MODE — đề xuất thứ tự công việc.
**Yêu cầu:** “len plan tiep”, tiếp tục hoàn thiện kế hoạch khi người dùng hỏi tiến độ.
**Trạng thái tài liệu:** Đã lập kế hoạch; các bước thực hiện bên dưới CHƯA BẮT ĐẦU.
Yêu cầu lập kế hoạch không phê duyệt thiết kế vật lý, chính sách mới hay triển khai ứng dụng.

## Điểm xuất phát

- Baseline Use Case, tám Activity và Class đã hoàn tất; Class có 22 lớp + một enum, 28 quan hệ.
- Commit `04da119` lưu phần Class đã được duyệt, tám trang Activity đã chỉnh và xử lý 17 hash nguồn lệch. Bộ native có 44 trang; 36 source / 72 PNG-SVG được kiểm tra integrity.
- Sequence, dữ liệu logic, state, security và architecture/deployment cần đối chiếu với baseline mới. Integrity PASS chỉ xác nhận artifact, không xác nhận các góc nhìn này nhất quán về nghiệp vụ.
- Package physical cũ là đề xuất chưa được duyệt; con số 34 bảng không phải ràng buộc cho thiết kế sắp tới. Live DB chưa xác minh.
- Runtime mới có nền auth/locale; chưa có bằng chứng triển khai các luồng học cốt lõi, Admin web hoặc AI runtime. Kế hoạch này không đặt lịch code dựa trên schema hay roadmap lịch sử.

Nguồn điều khiển: [authority map](../docs/README.md), [quick reference](../docs/QUICK-REF.md), ADR-030–036/041/042 trong [decision log](../logs/decision-log.md), [UC catalog](../docs/use-case-specifications.md), [Class review](../docs/modeling/current-target/class-review-2026-10-16.md), [Activity closeout](../docs/modeling/current-target/modeling-closeout-2026-10-16.md).
[Master plan Phase 0](../docs/00-master-plan.md) chỉ được kiểm tra để nhận diện roadmap lịch sử; không tái kích hoạt priority/AI/role cũ.

## Thứ tự đề xuất

| Bước | Việc cần làm | Đầu ra và điều kiện kết thúc |
|---|---|---|
| 1 — làm tiếp trước | Rà soát chín Sequence với UC, Activity, Class và ADR hiện hành | Bảng trace cho từng SEQ; danh sách sai khác; sửa trong phạm vi nguồn đã duyệt; source/ảnh/native đồng bộ; review độc lập PASS hoặc ghi rõ blocker |
| 2 | Đối chiếu DATA-03 với Class và các luồng đã xác nhận | Mapping concept → dữ liệu logic, ownership, version/history, cardinality; phân biệt dữ liệu dẫn xuất và cần lưu; không suy ra một class = một bảng |
| 3 | Kiểm tra các state và góc nhìn bảo mật/kiến trúc mục tiêu | STA-01–03, SEC-01, SYS-02/04, DEP-02 nhất quán về ba role, lifecycle, trusted identity, dữ liệu chấm kín và các ranh giới logic; không khẳng định deployed state |
| 4 — sau khi logical nhất quán | Đối chiếu lại đề xuất physical và thực hiện review thiết kế vật lý | Delta so với baseline mới; quyết định kỹ thuật còn mở được ghi rõ; chỉ có thể gọi physical APPROVED khi có bản ghi phê duyệt riêng |
| 5 — mốc sau, chưa lập chi tiết | Khi physical/design liên quan được duyệt và người dùng yêu cầu triển khai: inspect code thực tế rồi lập Implementation Spec cho lát cắt đầu tiên | Chọn lát cắt và acceptance từ thiết kế được duyệt; kiểm tra dependency/API/schema; lúc đó mới chia work package và test triển khai |

Làm tuần tự theo các phụ thuộc trên. Bước 1–3 là các đợt đối chiếu thiết kế, không tổ chức implementation workers/work packages. Không đổi tier P0/P1/P2, không ấn định deadline khi chưa biết số sai khác và các quyết định còn mở.

## Task đề xuất mở đầu: Sequence reconciliation

**Mục tiêu:** Chín Sequence thể hiện đúng hành vi đã duyệt và dùng nhất quán các khái niệm trong Class; không thiết kế API/SQL mới.

**Phạm vi file:** `docs/modeling/current-target/src/SEQ-01` đến `SEQ-09` (giữ tên file hiện có); các PNG/SVG tương ứng, chín page native tương ứng, những manifest record liên quan và báo cáo/evidence/log/pointer của task. Chỉ sửa chỗ có sai khác có căn cứ.

**Thứ tự đọc và kiểm tra:**

1. SEQ-01/02/03/04/05/09: identity/role/status, Teacher được phân công, authoring/review/publish, thay phiên bản và hỗ trợ tài khoản. Đối chiếu quyền tác giả với quyền duyệt; bảo toàn attribution, lịch sử và feedback.
2. SEQ-06/07/08: lesson attempt, Placement/Level-up và SRS. Đối chiếu version pinning, response provenance, completion tách performance, cấu hình gate, review idempotency, scope của Study Focus và củng cố không lập lịch hai lần.
3. Tổng hợp cross-check với DATA-03 và state: ghi đầu mối cần xử lý ở bước 2/3, không âm thầm mở rộng task để sửa tất cả sơ đồ.

**Cách thực hiện:**

- Chụp hash/inventory ở entry, giữ nguyên 35 trang native ngoài chín Sequence; không dùng builder toàn bộ bundle.
- Lập một bảng trace gồm: SEQ → UC/ACT liên quan → class/concept → ADR/rule → finding → xử lý/kết quả. Có thể ghi “không cần sửa” nếu kiểm tra đạt.
- Phân biệt lỗi mô tả của diagram với quyết định nghiệp vụ chưa có. Lỗi mô tả có nguồn rõ được sửa trực tiếp; điểm chưa được nguồn điều khiển giải quyết phải ghi `CONFLICT`/câu hỏi cho owner trong báo cáo task và dừng phần phụ thuộc.
- Render chỉ các source thay đổi, đồng bộ đúng page native, kiểm tra toàn trang và vùng nhánh/nhãn quan trọng.
- Reviewer độc lập đọc source/diff/trace và ảnh; một vòng sửa bounded nếu có finding. Còn blocker sau re-review thì báo REVIEW, không giả PASS.

**Acceptance:**

- Đủ chín SEQ trong trace; không tạo thêm UC, role, feature hoặc policy.
- Những hành vi có liên quan đến version, permission, completion/scoring và SRS đều có nguồn đối chiếu cụ thể; không rò đáp án/chấm điểm vào client trong mô tả.
- Các bản source/PNG/SVG/native được thay đổi khớp nhau và có provenance; 35 native pages ngoài scope giữ nguyên.
- Không đổi Use Case/Activity/Class, physical schema, API contract, code ứng dụng hoặc lịch sử evidence để làm cho check PASS.
- `py -3.11 docs/modeling/current-target/verify_current.py` PASS; kiểm tra scope/trace của task và review trực quan/độc lập PASS; log đủ trước commit và DONE.
- Không tái dùng `verify_closeout.py` của đợt Activity như gate cho task mới: script đó cố định các điều kiện bảo toàn của đợt cũ. Tạo bằng chứng phạm vi riêng vừa đủ, giữ nguyên lịch sử.

## Các điểm cần xem ở các bước sau

- DATA-03 hiện có `LessonVocabularyLink` với tham chiếu lesson; cần kiểm tra mapping với vocabulary theo revision trong Class đã duyệt. Đây là hạng mục review, chưa phải kết luận thay đổi schema.
- Đề xuất physical cũ phải được đối chiếu lại về revision pinning, assessment blueprint/version, dữ liệu kết quả bất biến, security và ownership; không dùng verdict READY cũ thay cho review mới.
- UX chi tiết và report không bị coi là đã hoàn tất bởi modeling. Nếu lát cắt triển khai cần UI chưa chốt, phải đối chiếu `DESIGN.md` trong task thiết kế liên quan trước khi code.
- Truy cập live DB, migration/rebuild, lựa chọn phá hủy dữ liệu và triển khai production nằm ngoài kế hoạch thực hiện hiện tại.

**Bước tiếp theo đề xuất:** Mở task “Review and reconcile the nine Sequence Diagrams” khi người dùng yêu cầu bắt đầu; cập nhật `plans/current-task.md` với phạm vi đó. Hiện chỉ việc lập kế hoạch được hoàn tất, chưa thực thi bước 1.

# Lingora — Full design review, 2026-10-20

**Yêu cầu:** “review full phần thiết kế”. **Mode:** DESIGN, review và ghi nhận; không sửa thiết kế hoặc phê duyệt hành vi mới.

**Kết luận: NEEDS DESIGN RECONCILIATION — chưa đủ cơ sở kết luận toàn bộ thiết kế sẵn sàng triển khai.** Có 7 findings: 3 P1 và 4 P2. P1 là lỗi mô tả có thể dẫn triển khai sai nghiệp vụ; P2 là thiếu sót mapping/contract cần hoàn thiện trước khi triển khai phần liên quan. Không tìm thấy P0 trong phạm vi đã kiểm tra; đây không phải bảo đảm runtime an toàn.

Baseline Use Case/Activity/Class có giá trị trong phạm vi đã chấp nhận. ADR-043 mới hơn cần được đưa vào các luồng authoring/assessment cũ. Đề xuất database ngày 2026-10-20 đã xử lý nhiều vấn đề này tốt hơn bộ logical diagrams, nhưng còn các khoảng trống bên dưới. Integrity PASS không đồng nghĩa semantic acceptance hoặc physical approval.

## Phạm vi và nguồn

- Entry: current-task → QUICK-REF → HANDOFF → docs/README; entry HEAD `0cde607c857255971976aca293891b49ef6ffeb0`, working tree sạch trước khi ghi task review.
- Authority: ADR-030–036/041–043 trong [decision log](../../logs/decision-log.md); [UC catalog](../use-case-specifications.md); các addendum hiện hành của [requirements](../02-requirements.md) và [traceability](../05-traceability-matrix.md); [Class baseline](../modeling/current-target/class-review-2026-10-16.md).
- Đọc semantic toàn bộ 36 canonical PUML và 9 report-usecase PUML; gồm UC, Activity, Class, Sequence, DATA, state, security, component/context và deployment. Phân biệt 5 CURRENT repository views, 30 TARGET và 1 DEFERRED.
- Đối chiếu [DESIGN.md](../../DESIGN.md), [architecture routing](../01-architecture.md), phần tương thích của M2.4, M2.3 API/service-boundary register, [legacy AI contract](../03-api-contract.md), [data-model routing](../04-data-model.md), proposed physical catalog/security/rebuild/four-view ERD và [database reconciliation](physical/database-reconciliation-2026-10-20.md).
- Hai reviewer độc lập đọc nguồn: một cho logical models/behavior, một cho proposed database/security. Coordinator kiểm tra lại evidence và tổng hợp; không tổ chức implementation work packages.
- Visual sampling trực tiếp: current DOM-01 PNG, ACT-03 PNG và physical assessment ERD PNG. Không chứng nhận lại layout từng trang native hoặc toàn bộ ảnh. Không mở/chỉnh deck, report lịch sử hoặc live DB.

## Findings

### FDR-01 — P1: UI/UX entry-point canonical vẫn chỉ dẫn nghiệp vụ đã bị thay thế

**Evidence:** `DESIGN.md:6–12,25,45,59,70–78,105`. File tự nhận `ACTIVE INDEX / CANONICAL DESIGN ENTRY-POINT`, nhưng screen index còn sáu vai trò, Moderator/Organizational Manager, Unit 4/4, role assignment và support ticket flow. Learner flow vẫn dùng retry `max(1,floor(N*0.10))`, 70% credit và Skip → U1. `UC-05` tại dòng 59 là identity catalog cũ. Hai controlling links tại dòng 9–10 không tồn tại.

**Tác động:** Làm UI theo entry-point này có thể tạo quyền duyệt/xuất bản sai role, sai cách tính lesson performance và ép default entry về Unit 1. Các rule điều khiển hiện tại là ba role (ADR-034/035), mỗi câu sai được retry đúng một lần với đóng góp 0.5 và mẫu số N+K (ADR-036), ba đường entry cùng available-level resolution (ADR-032). Context lifecycle/Study Focus và system assessment assembly cũng chưa được index này phản ánh đầy đủ.

**Khuyến nghị tối thiểu:** Reconcile screen inventory với current UC/ADR, sửa source pointers và đánh dấu phần cũ là historical. Giữ các token/UI guideline còn tương thích; không cần thiết kế lại thương hiệu. Không suy từ index rằng Admin app đã tồn tại.

**Loại:** lỗi entry-point hiện hành; chưa sửa trong task review. **Owner:** UI/UX/documentation maintainer; PO chỉ cần tham gia nếu xuất hiện lựa chọn hành vi mới.

### FDR-02 — P1: Luồng biên soạn/duyệt chưa mô tả system assembly theo ADR-043

**Evidence:** `ACT-08-content-governance.puml:34–38,56`; `SEQ-03-assignment-authoring-submit.puml:49`; `SEQ-04-review-approve-publish.puml:41`; generic `STA-03-content-revision-lifecycle.puml:16–18`, tất cả dưới `docs/modeling/current-target/src/`. Đối chiếu `logs/decision-log.md:2149–2151` và `docs/use-case-specifications.md:218`.

**Tác động:** Với đề thi có contributions từ Teacher A và B, hình hiện tại đi từ Teacher submit đến Admin review/publish mà không chỉ rõ hệ thống ghép các package đã submit, review một assembled version bất biến, rồi trả feedback về Teacher hiện phụ trách từng source Lesson. Vòng sửa dễ bị hiểu thành mở lại/sửa trực tiếp cả version hoặc giao toàn đề cho một Teacher.

**Khuyến nghị tối thiểu:** Tách Lesson submission khỏi system assembly; thể hiện Admin review và source-targeted feedback, correction bằng successor contributions/version. Phân biệt Lesson draft lifecycle với assembled assessment version lifecycle, không áp chung Teacher-submit state machine cho cả hai. Đồng bộ source/render/native chỉ ở các trang cần sửa.

**Loại:** reconciliation gap đã được ADR-043/QUICK-REF công khai; review này xác nhận kịch bản ảnh hưởng. Không phủ nhận acceptance lịch sử trước ADR-043. **Owner:** modeling maintainer.

### FDR-03 — P1: DATA-03 đặt vocabulary membership ở Lesson thay vì revision

**Evidence:** `docs/modeling/current-target/src/DATA-03-target-logical-erd.puml:79–82,88`: khóa `lessonRef + vocabularyRef` và quan hệ từ Lesson. Accepted Class invariant tại `docs/modeling/current-target/class-review-2026-10-16.md:92` yêu cầu enroll core members của đúng revision đã hoàn tất. Physical proposal đã dùng revision-scoped links tại `docs/design/physical/README.md:83`.

**Tác động:** R1 có core A, R2 có core B; mapping DATA hiện tại không biểu diễn độc lập hai tập membership. Một implementation dựa trên mapping này có thể đọc current Lesson vocabulary khi xử lý evidence của R1 và enroll nhầm B. Đây là rủi ro do biểu diễn thiết kế, không phải lỗi runtime đã quan sát. Cụm “core vocabulary của lesson” trong `SEQ-08-srs-review.puml:18` cũng cần rõ revision; tự nó chưa chứng minh thuật toán sai.

**Khuyến nghị tối thiểu:** Membership tham chiếu revision; Lesson–Vocabulary chỉ là structural union/view. Completion/enrollment phải dùng pinned completed revision và giữ membership lịch sử. Không cần đổi Class hoặc thêm subsystem.

**Loại:** known Class → DATA reconciliation item trong next-design plan, nay có evidence cụ thể. **Owner:** logical-data/modeling maintainer.

### FDR-04 — P2: DATA-03 chưa thể hiện exact attribution/source submission

**Evidence:** `DATA-03-target-logical-erd.puml:64–67,113–117,132–141` chỉ có attribution/reviewHistory tổng quát, version-item snapshot và currentTeacher/previousTeacher/nextTeacher. Accepted Class dictionary `class-review-2026-10-16.md:93–94` yêu cầu creation Assignment episode; ADR-043 tại `logs/decision-log.md:2151` thêm source submission provenance.

**Tác động:** A tạo item, sau reassignment B submit và C nhận feedback: logical view chưa chỉ ra cách phân biệt creator, submitter và current assignee, hoặc item của version đến từ lần submit nào. `blueprintRef` trong AssignmentRecord cũng phải được diễn giải lại theo Lesson-only assignment, không ngầm tạo standalone whole-assessment assignment.

**Khuyến nghị tối thiểu:** Bổ sung bounded logical references cho creation episode, exact submitted source và contribution provenance; tách immutable attribution khỏi current responsibility. Proposed physical design đã có hướng mapping, không bắt buộc một class/reference thành một bảng.

**Loại:** known downstream reconciliation debt; không phải phát hiện physical proposal đang xóa attribution. **Owner:** logical-data/modeling maintainer.

### FDR-05 — P2: Hai composite FK chưa có target UNIQUE được khai báo

**Evidence:** `docs/design/physical/README.md:97` yêu cầu response→attempt/revision composite FK; dòng 98 yêu cầu `(first_attempt_id,context_id,lesson_id)` FK. Definition `lesson_attempts` tại dòng 96 không khai báo `UNIQUE(id,lesson_revision_id)` hoặc `UNIQUE(id,context_id,lesson_id)` tương ứng. UUID PK riêng không thay thế khai báo referenced composite key.

**Tác động:** Chuyển catalog thành PostgreSQL DDL đúng như viết sẽ thiếu điều kiện tạo hai FK. Bỏ FK để chạy được sẽ làm yếu integrity giữa response/revision và completion/context/Lesson.

**Khuyến nghị tối thiểu:** Ghi đủ supporting composite UNIQUE constraints vào proposal và kiểm tra tạo FK trong migration acceptance sau này. Không thêm bảng. Đây là thiếu sót catalog, không có migration failure đã chạy.

**Loại:** gap mới trong proposed physical specification. **Owner:** physical-design maintainer.

### FDR-06 — P2: Review idempotency không có đủ receipt command identities

**Evidence:** `docs/design/physical/README.md:92` giao idempotency cho receipts, nhưng command CHECK tại dòng 111 thiếu REQUEST_CHANGES, APPROVE, ARCHIVE và WITHDRAW; revision_reviews tại dòng 92 không có operation key thay thế. `security-and-rls.md:97–98` mô tả Admin request/approve nhưng không định nghĩa replay store khác.

**Tác động:** Admin approve đã commit nhưng mất HTTP response; retry cùng operation không thể dùng receipt được hứa trong catalog, dễ thành stale-state conflict. Tự cho phép ghi lại để xử lý retry lại có nguy cơ duplicate review/history. Optimistic concurrency đơn thuần không cung cấp committed-result replay.

**Khuyến nghị tối thiểu:** Thêm finite review command identities vào receipt hiện có; sau authorization, replay operation/hash đã commit trước stale-state/version validation. Thêm acceptance cho mất response và changed payload cùng key.

**Loại:** gap mới của proposed command contract; không kết luận runtime đang ghi trùng. **Owner:** physical/security design maintainer.

### FDR-07 — P2: LearningPurpose chưa được mapping và cấp capability đầy đủ

**Evidence:** `DOM-01-core-domain-model.puml:108` có `Lesson.purposeTags`. `docs/design/physical/README.md:76,81` nêu topic/skill metadata nhưng không chỉ ra nơi lưu purpose tags hoặc mapping JSON cụ thể. Context `purpose` có ở dòng 77; explicit context UPDATE allowlist trong `security-and-rls.md:177` lại thiếu `purpose`. ADR-031 tại `logs/decision-log.md:1641` cho phép đổi purpose mà không reset evidence; ADR-032 dòng 1699 nối preferences/content metadata với deterministic planning.

**Tác động:** Implement đúng allowlist sẽ thiếu quyền cho purpose-change command; schema/payload contract hiện tại chưa cho biết planner lấy purpose tags từ đâu. Không khẳng định JSON content_blocks không thể lưu chúng; vấn đề là mapping chưa được đặc tả trong tuyên bố domain coverage.

**Khuyến nghị tối thiểu:** Chỉ rõ bounded purpose-tag mapping trong existing field/payload, validation và narrow purpose update capability; thêm purpose-change/no-reset acceptance. Không cần bảng hay preference engine.

**Loại:** gap mới trong Class → physical coverage/security grants. **Owner:** physical/domain design maintainer.

## Coverage, phần đạt và những việc còn mở

| Mảng | Kết quả review |
|---|---|
| Product/domain, UC/report views | Không thấy thêm blocker trong ba business role, catalog identities, entry choices, context ownership/capacity và deferred reminder/Reassessment. |
| Lesson/Placement/Level-up/SRS | N/K, completion tách correctness, secure assessment pinning/aggregate-only feedback, Policy B và Study Focus boundaries nhất quán ở nguồn hiện hành đã kiểm tra. FDR-03 là mapping downstream cần sửa. |
| Class | Baseline 22 classes + một enum/28 relations được bảo toàn; không đề xuất thiết kế lại. Mapping downstream còn FDR-03/04/07. |
| Governance logical views | FDR-02/04; phải reconcile trước khi dùng làm implementation authority. |
| Physical database/security | FDR-05/06/07. System assembly, Lesson-only assignments, immutable source episodes, latest submitted source/no older fallback và rejection exclusions đã được mô tả. Không mở lại F01/F02 cũ như thể chưa được sửa. |
| Architecture/security/deployment | Hai Next.js application boundaries, in-process domain modules và trusted server filtering phù hợp logical target. DEP-02 là logical allocation, không phải production topology. Consolidated connection/principal/secret design phải phản ánh proposed physical boundary sau approval. M2.4 giữ phần lịch sử/superseded theo authority map. |
| Core API/service contracts | Chưa có bộ core transport contracts được reconcile/finalize với baseline mới. `03` là legacy AI-only; M2.3 có logical boundary/error/idempotency register nhưng còn Jump, SkillProfile và lịch sử SRS signatures. Đây là prerequisite đã khai báo, không phải yêu cầu tạo API subsystem mới. |
| UI/UX | FDR-01. Cần current screen/state inventory cho lát cắt triển khai; typography/brand hardening pending không tự nó là blocker. |
| Traceability/test design | Current addenda trace ADR-036/041/042/043 và future DB43/PERS cases; inherited PASS không phải test evidence hiện tại. Cần acceptance cập nhật cho các finding và core API/UI sau khi reconcile. |
| Deployment/NFR | Live DB/security UNVERIFIED; retention/anonymization, concrete runtime limits và operational acceptance phải được chọn trong scope phù hợp. Không tự chọn numeric policy hoặc gọi chúng là lỗi sản phẩm đã được PO giải quyết. |

**Ghi chú mức thấp hơn:** DATA-03 dòng 85 dùng Lesson→Revision 1..*, trong khi accepted Class cho phép 0..* ở giai đoạn chuẩn bị. Cần reconcile khi làm DATA; không tách thêm finding blocking. Version→Item 1..* không bị đánh lỗi chỉ vì Class cho phép draft rỗng: ADR-043/system assembly hiện tạo version hoàn chỉnh, nên cardinality chặt hơn có thể hợp lệ cho scope đó.

Signed-session transport cần đảm bảo ordered references không lộ trước cho learner; một token chỉ ký mà đọc được toàn danh sách không đáp ứng ADR-041. Chưa có token/DTO cụ thể để kết luận có leak. Đây là contract clarification, không phải confirmed vulnerability.

`DESIGN.md` có hai broken controlling links. M2.4 có ba link diagram legacy không resolve theo đường dẫn Markdown hiện tại; `docs/04-data-model.md` có một missing historical ERD link đã được báo trước. Không dùng số link lỗi lịch sử để phủ nhận semantic baseline hay âm thầm viết lại lịch sử.

## Verification và giới hạn

Environment: Windows PowerShell, Python 3.11/Pillow, local repository; không network research, SQL, migration, credential read hoặc application test.

1. `py -3.11 docs/modeling/current-target/verify_current.py`: exit 0; **PASS** 36 source/PNG/SVG records, visible source parity, 44 native pages/payloads và native export provenance. Chỉ artifact integrity.
2. `py -3.11 docs/design/physical/evidence/2026-10-20-database-design/verify_design.py`, chạy trước khi thêm report ngoài allowlist lịch sử của task DB: exit 0; **PASS** 18 legacy models/3 migrations preserved, 34 catalog/detail/ERD definitions, four views/eight renders/PNG parity và 214 local links; một inherited unresolved ERD link. Không dùng script có scope task cũ làm final gate cho task review mới.
3. Inline local-link inventory trên DESIGN/architecture/M2.3/M2.4: exit 0; phát hiện đúng hai broken links DESIGN và ba links M2.4 nêu trên. Đây là observed documentation defects, không phải assertion toàn bộ link repository PASS.
4. Independent semantic reviews: đọc nguồn độc lập, coordinator kiểm chứng findings. Root loại phần assessment cardinality có thể hợp lệ theo ADR-043; không thêm speculative security finding. Hai reviewer đọc lại report: report-accuracy PASS cho logical/UI/API và physical/security; sửa một từ ngữ về context lifecycle. PASS này không phải approval toàn bộ thiết kế. Verdict thiết kế tổng thể vẫn NEEDS DESIGN RECONCILIATION.
5. Visual sample đã nêu không thấy renderer error hoặc clipping rõ ở các hình đã xem; không có full native visual reacceptance.

DB43/PERS và các case concurrency/security mới là **NOT EXECUTED**. Không có runtime/production PASS; không suy design approval từ static checks. Không sửa canonical diagrams, proposed schema/security hoặc application code trong review này.

## Review backlog và thứ tự xử lý đề xuất

| Việc | Owner | Điều kiện đóng |
|---|---|---|
| FDR-01 | UI/UX maintainer | Current role/entry/retry/screen-state inventory và source links nhất quán UC/ADR; reviewed |
| FDR-02/03/04 | Modeling maintainer | Trace từng diagram tới current authority; source/render/native đồng bộ; ngoài scope được bảo toàn; independent semantic/visual checks |
| FDR-05/06/07 | Physical/security maintainer | Catalog/key/grant/command mapping đủ; future acceptance thêm đúng failure cases; independent review |
| Core transport/UI/config/NFR còn mở | Technical owner; PO cho human product choices | Chọn trong task/lát cắt tương ứng; phân biệt approved policy, configurable values và runtime evidence |
| Physical approval/implementation | Design approval owner và user | Bản ghi approval đúng scope; implementation request/spec riêng; live preservation/cutover gates trước destructive execution |

Đây là backlog của review hiện tại, không tự kích hoạt các task sửa. Findings đủ nguồn được sửa bằng reconciliation trong task được giao sau; chỉ route PO khi thật sự cần quyết định mới. Task review có thể DONE dù reviewed design còn findings; không gọi toàn bộ thiết kế APPROVED hoặc implementation-ready.

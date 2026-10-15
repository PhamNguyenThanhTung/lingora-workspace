# Kiểm tra chi tiết mức đầy đủ của sơ đồ lớp Lingora

**Kết luận:** DOM-01 là **sơ đồ lớp miền tổng quát với thuộc tính tối thiểu**, chưa đủ chi tiết để trình bày như một thiết kế lớp phần mềm đầy đủ. Bản sửa trước chỉ xử lý native layout và giữ nội dung; không phải cuộc kiểm tra độ bao phủ thuộc tính/phương thức. Không thay đổi bản sơ đồ trong cuộc review này.

**Đếm từ source và native hiện tại:** 22 class + 1 enum, 30 dòng thuộc tính class + 5 enum values, 24 relations, 0 method. Năm class không có member: Course, LogicalUnit, Vocabulary, Assignment, AssessmentItem. Tất cả member source/native khớp: chỗ trống này có trong source, không do chữ bị che sau lần sửa layout. [Inventory quan sát](evidence/2026-10-12-class-completeness/inventory.json).

**Mức abstraction:** [README](README.md) và [final-review](final-review.md:38) xác định DOM là conceptual domain, không phải logical ERD/physical schema hay class thiết kế runtime. Đánh giá conceptual trước đây giữ nguyên phạm vi; nó không chứng minh mọi lớp đã đầy đủ thuộc tính/phương thức để triển khai. Không dùng số lớp/nét vẽ hoặc PASS layout để kết luận completeness.

## Vì sao Assignment cần tồn tại, và thiếu gì

Assignment là ranh giới giao việc: một Teacher đang chịu trách nhiệm cho gói nội dung; Admin giao/đổi người phụ trách, Teacher chỉ biên soạn trong phạm vi được giao. Nó tách trách nhiệm công việc khỏi vòng đời ContentRevision. Xóa Assignment sẽ làm mất khái niệm ownership/authorization; chỉ vẽ tên + hai relations lại không diễn đạt đủ nội dung để người xem hiểu gói việc đó.

Nghiệp vụ có căn cứ: **requirements, scope, checklist, một current Teacher, Admin giao việc, attribution/history khi reassignment**. [ADR-034/035](../../../logs/decision-log.md:1789), [UC-09](../../use-case-specifications.md:216), [DATA-03](src/DATA-03-target-logical-erd.puml). Những ý này nên được thể hiện trong bản domain chi tiết hoặc view phân công riêng. Không nhất thiết phải lặp currentTeacher/lesson bằng cả FK-like attribute và association.

Không thêm Assignment.status = CLOSED/COMPLETED/DRAFT/APPROVED hay deadline/priority/collaboration workflow theo suy đoán. [STA-02](src/STA-02-assignment-lifecycle.puml) chỉ mô tả trách nhiệm ASSIGNED và reassignment, **không quy định thuộc tính status lưu trữ**; content lifecycle nằm ở ContentRevision. Hạn chế này được [final-review](final-review.md:37) ghi rõ.

Lưu ý phạm vi target: nguồn logical nói một Lesson/content package và related assessment items; bản physical PROPOSED chọn XOR lesson/blueprint targets. Không tự thay association Assignment–Lesson bằng XOR target chỉ vì đọc thấy cột physical. Cần giữ khác biệt này và hỏi trước nếu muốn chọn/đổi representation.

## LogicalUnit có vai trò gì, và thiếu gì

LogicalUnit nhóm Lessons trong Course và gắn Level. Ba quan hệ này đã có trên DOM; tên LogicalUnit dùng để giữ abstraction miền, không có nghĩa phải là bảng vật lý. Vấn đề là ô trống không cho thấy cách nhận diện/thứ tự của nhóm bài.

Curriculum ordering được DATA-03 và hành vi điều hướng/curriculum hiện tại hỗ trợ. Có thể **đề xuất** order/orderIndex ở Unit như một thuộc tính miền; tên cụ thể là lựa chọn biểu diễn. title/displayName cũng hữu ích khi trình bày nhưng tên thuộc tính này chưa được nguồn current chốt riêng cho LogicalUnit; đánh dấu đề xuất, không khẳng định đã được duyệt. Tài liệu M2.1 có Unit.orderIndex(1..6) là historical target-schema; không dùng để ép số Unit=6, Lesson=4, UUID/FK hoặc trạng thái published cho Unit. [ADR-030](../../../logs/decision-log.md:1587), [ADR-035](../../../logs/decision-log.md:1848), [DATA-03](src/DATA-03-target-logical-erd.puml).

## Kiểm tra toàn bộ 23 classifier

Số dòng ở cột Members gồm enum literals; công thức Progress đang là một dòng mô tả. Đánh giá dưới đây xét nhu cầu **view miền chi tiết cho báo cáo**, không coi mỗi dữ liệu vắng mặt trên overview là một lỗi nghiệp vụ/thiếu bảng.

| Classifier hiện có | Members | Đánh giá | Nội dung cần xem xét và nguồn |
|---|---:|---|---|
| [User](src/DOM-01-core-domain-model.puml:15) | 2 | Đủ nhận biết role/status; tối giản | Thiếu biểu diễn định danh/tên hiển thị/email nếu yêu cầu một view chi tiết; không thêm password/passwordHash vào class nghiệp vụ theo thói quen. UC-01 và ADR-035 §1. |
| [Profile](src/DOM-01-core-domain-model.puml:20) | 2 | Chưa đủ chi tiết | Đang chỉ có timezone/streak; ADR-031 §3 còn có UI locale, native language, account preferences. Tên hiển thị được UC-01 mô tả; nơi gắn từng thuộc tính cần thống nhất, không tự nhân đôi. |
| [LearningContext](src/DOM-01-core-domain-model.puml:24) | 4 | Chưa đủ chi tiết | Đang có status/startingPoint/purpose/studyFocus; chưa hiển thị provenance, self-report, simple study preferences. ADR-031 §3–6; ContextRecord của DATA-03. |
| [LearningPlan](src/DOM-01-core-domain-model.puml:30) | 1 | Đủ mức đầu ra dẫn xuất | orderedLessons đã có ý nghĩa; tham chiếu Lesson qua kiểu danh sách, không bắt buộc vẽ thêm association trùng. Không tự thêm persisted plan/Enrollment hay phương thức generatePlan(). ADR-030 §9, ADR-031 §10. |
| [Progress](src/DOM-01-core-domain-model.puml:33) | 1 | Cần làm rõ biểu diễn thuộc tính | Một dòng completedEligible / eligibleRequired là công thức mô tả, chưa phải danh sách thuộc tính có tên/kiểu rõ. Nên tách hai số đếm và derived ratio, chỉ rõ theo Level; không biến progress thành proficiency/gate. ADR-033; UC-08. |
| [Language](src/DOM-01-core-domain-model.puml:40) | 1 | Đủ liên kết chính; tối giản | name, liên kết Course và LearningContext có; code/isLearnable là lựa chọn biểu diễn cần kiểm tra authority, không copy cột physical chỉ để làm đầy. |
| [ProficiencyFramework](src/DOM-01-core-domain-model.puml:43) | 2 | Đủ cho view miền hiện tại | name/version và quan hệ Level đã thể hiện framework-aware level. Không thêm bảng mapping/CEFR enum mặc định. ADR-030 §5. |
| [Level](src/DOM-01-core-domain-model.puml:47) | 1 | Đủ khái niệm chính; tối giản | label, Framework và nhóm Unit có. Rank/order/transition config có thể làm rõ ở view curriculum riêng; không áp A1/A2 hay 100% gate toàn nền tảng. ADR-030/033. |
| [StudyFocus](src/DOM-01-core-domain-model.puml:50) | 5 | Đủ bộ giá trị đã chốt | Enum đúng năm giá trị; LearningContext có default BALANCED. Không bổ sung Speaking/Writing hay coi BALANCED là area tag. ADR-042/addendum. |
| [Course](src/DOM-01-core-domain-model.puml:57) | 0 | Lớp trống; thiếu cho view chi tiết | Quan hệ Language và thành phần Unit tồn tại, nên không vô dụng; chưa có tên/thứ tự/metadata curriculum. Chọn thuộc tính hiển thị theo curriculum đã cấu hình, không thêm publisher/status của revision lên Course. ADR-030; DATA-03 CurriculumReference. |
| [LogicalUnit](src/DOM-01-core-domain-model.puml:58) | 0 | Lớp trống; thiếu cho view chi tiết | Có composition Course–LogicalUnit–Lesson và association Level: vai trò là nhóm bài trong curriculum. Chưa hiển thị thứ tự/nhãn nhận diện nhóm. DATA-03 có ordering nhưng gộp curriculum; order trên Unit là đề xuất biểu diễn, title chưa có tên thuộc tính đã chốt riêng. Không hard-code 6 Units/4 Lessons. |
| [Lesson](src/DOM-01-core-domain-model.puml:59) | 2 | Chưa đủ chi tiết | Chỉ required/availability; chưa hiện lesson ordering và controlled topic/skill/purpose metadata; revision tách đúng. ADR-030 §3, ADR-036; DATA-03 Curriculum/LessonRecord. |
| [Exercise](src/DOM-01-core-domain-model.puml:63) | 4 | Chưa đủ chi tiết | Có type/core/practiceSkillRefs/knowledgeArea; chưa hiện learner-facing content, protected grading data, ordering. Skill là kiểu tham chiếu chưa định nghĩa trong view; có thể giải thích bounded catalog, không dựng taxonomy mới. ADR-036/042; DATA-03 ExerciseRecord. |
| [Vocabulary](src/DOM-01-core-domain-model.puml:69) | 0 | Lớp trống; thiếu cho view chi tiết | Có Lesson/SrsCard nhưng không có nội dung từ/nghĩa hay ngôn ngữ của vocabulary. UC-07 cần nội dung để học/ôn. Identity/sense/normalization chi tiết trong physical vẫn PROPOSED; không tự chốt theo bản đó. |
| [LessonAttempt](src/DOM-01-core-domain-model.puml:75) | 2 | Chưa đủ chi tiết | performance/completed có; tham chiếu hiện đến Lesson, chưa hiện revision provenance, thời điểm hoàn tất và cơ sở contributions/responseCount. DATA-03 Attempt/Response, ADR-036 §1. Ghi nhận completion độc lập và bất biến lịch sử; không tự thêm bảng/classes. |
| [SrsCard](src/DOM-01-core-domain-model.puml:79) | 2 | Chưa đủ chi tiết | stage/dueAt và User/Vocabulary có; chưa hiện enrollment source/review history logically. Schedule là internal, account-wide; không chuyển vào Context hay thêm due-list UC. ADR-035/036/041; DATA-03 Card/Review. |
| [AssessmentBlueprint](src/DOM-01-core-domain-model.puml:83) | 1 | Thiếu nhiều nội dung cốt lõi | Chỉ purpose; chưa có curriculum/topic/skill coverage, item requirements/distribution, language/framework/level/transition/config. Đây là nghiệp vụ đã chốt trong ADR-036 §4 và UC-09, không phải tính năng mới. |
| [AssessmentVersion](src/DOM-01-core-domain-model.puml:86) | 1 | Chưa đủ chi tiết | Chỉ published:Boolean; không thể hiện submitted/review/approved lifecycle và immutable content/rubric snapshot ở view chi tiết. ADR-035/036; DATA-03 VersionRecord. Không tự áp số phiên bản/cột vật lý. |
| [AssessmentResult](src/DOM-01-core-domain-model.puml:89) | 1 | Chưa đủ chi tiết | recommendationOrOutcome quá gộp; chưa rõ Placement recommendation khác Level-up outcome, purpose/version provenance/completedAt. Context/Version associations có. ADR-032/036; DATA-03 ResultRecord. |
| [Assignment](src/DOM-01-core-domain-model.puml:99) | 0 | Lớp trống; thiếu trọng yếu cho báo cáo | Chỉ Teacher/User và Lesson associations; chưa hiện requirement/scope/checklist, Admin giao việc và lịch sử reassignment. Role label cho Teacher có nhưng User chung không tự mô tả rule active/current assignment. ADR-034 §3–6, ADR-035 §2, UC-09–11. |
| [ContentRevision](src/DOM-01-core-domain-model.puml:100) | 1 | Chưa đủ chi tiết | Chỉ status; thiếu attribution, previous revision/history và concurrency/version provenance trong view chi tiết. ADR-035 §3; DATA-03 RevisionRecord. Không dùng assignment state thay content status. |
| [AssessmentItem](src/DOM-01-core-domain-model.puml:103) | 0 | Lớp trống; thiếu cho view chi tiết | Chỉ membership trong AssessmentVersion; chưa hiện question/content snapshot, type, protected grading data/exposure eligibility. ADR-036 §4; DATA-03 VersionItemRecord. Không copy answer secret sang learner-facing payload. |
| [SecurityAuditEvent](src/DOM-01-core-domain-model.puml:104) | 2 | Chưa đủ chi tiết | action/outcome và actor association có; thiếu target/version, server timestamp, conditional reason. ADR-035 §6 nêu các thành phần này; DATA-03 AuditRecord. Không log password/token/answer secrets. |

## Quan hệ và kiểu tham chiếu: không chỉ điền các ô trống

1. **Bảo toàn đúng các quan hệ chính:** Course chứa LogicalUnit, LogicalUnit chứa Lesson; User/Profile, Lesson/ContentRevision, ContentRevision/Exercise, AssessmentVersion/AssessmentItem composition đã có. Assignment tách revision; SRS vẫn User+Vocabulary; assessment evidence gắn Context/Version; Plan/Progress dẫn xuất. Không có căn cứ xóa Assignment/Unit vì thiếu members.
2. **Độ bao phủ còn yếu cho bản chi tiết:** Admin tạo requirement/phân công, attribution/history của assignment/revision, binding lesson attempt→revision và blueprint scope/config chưa rõ trong DOM. DATA-03 biểu diễn sâu hơn, một số bằng reference field không có đường join; không tự nhân mọi record thành class domain hoặc vẽ mọi reference gây rối.
3. **Progress:** dòng công thức không giúp người đọc phân biệt hai số đếm, derived percentage và Level scope. Khi sửa nên dùng named/typed members hoặc derived property; semantics vẫn completed eligible required / eligible required, không accuracy gate.
4. **Các type ngoài view:** AccountStatus, LearningPurpose, CurriculumAvailability, ExerciseType, ContentStatus, Skill, Result, TimeZone, Text/DateTime/Percentage chưa được định nghĩa đầy đủ ngay trong DOM. Không tự mở rộng diagram bằng toàn bộ enums/value objects. Nếu làm bản thiết kế lớp chi tiết phải có legend/type dictionary hoặc định nghĩa phù hợp có căn cứ. `knowledgeArea` không đồng nghĩa exercise format hay StudyFocus.BALANCED.
5. **Methods:** hiện không có method. Điều này phù hợp phạm vi conceptual đã chọn; không tự suy luận runtime đã thiếu class/service, cũng không thêm get/set/create/update/delete/submit/approve vào mọi entity. Bản software-design class có operations cần xác định responsibility/service boundary và contracts riêng; UC/Sequence business action không tự quyết định method thuộc lớp nào.

## Đề xuất sửa cụ thể để duyệt ở bước sau

**Khuyến nghị:** nâng thành bản **domain class chi tiết**, vẫn bám mô hình đã chốt; chia presentation thành tổng quan + view chi tiết curriculum/content, assignment/revision, learning/SRS và assessment nếu một trang quá dày. Không thêm hệ thống, product behavior, role hay canonical UC.

| Ưu tiên | Bổ sung vào diagram chi tiết | Căn cứ / trạng thái |
|---|---|---|
| P1 | Assignment: requirements, scope, checklist; làm rõ Admin/current Teacher/retained reassignment attribution | Semantics đã có ADR-034/035 và UC-09–11. Tên/kiểu member, thể hiện association/history là lựa chọn diagram phải review trước khi sửa. Không thêm trạng thái/project fields. |
| P1 | LogicalUnit: thứ tự trong Course; nhãn nhận diện nhóm bài | Ordering có căn cứ; tên order/orderIndex và title/displayName là proposed representation, title chưa được nguồn current chốt riêng. Không cố định 6/4 hay PK/FK. |
| P1 | Blueprint: curriculum/language/framework/level-transition, coverage, requirements/config; Version/Item: lifecycle và immutable content/grading snapshots | ADR-036/UC-09–12/DATA-03 đã có semantics. Không nâng XOR target/cột physical thành approved domain. |
| P1 | Audit: target/version, server timestamp, conditional reason; Revision: attribution/history/concurrency | ADR-035/DATA-03, semantics đã chốt. Naming/types không phải quyết định physical. |
| P2 | Vocabulary: nội dung từ/nghĩa/ngôn ngữ; Course/Lesson: curriculum/display metadata; Context/Profile: các preference/provenance còn thiếu | Chọn từng member với trace tới UC/ADR; không copy identity/sense/normalization schema PROPOSED. |
| P2 | Attempt/Result/SRS: completion/provenance/review semantics; Progress: derived ratio với hai số đếm/Level rõ | ADR-031/033/036/041; không thêm score gate/mastery/Enrollment/plan tables. |

Đây là proposal review, **chưa áp dụng thuộc tính/quan hệ mới** vào PUML hoặc Draw.io. Những tên/types/operations không có nguồn chốt phải hỏi trước. [Physical README](../../design/physical/README.md) vẫn PROPOSED; không lấy thuộc tính của 34 bảng làm class model đã được duyệt. Historical M2.1, Prisma/migration cũng không thay authority current.

**Verdict:** ĐỦ làm conceptual overview có chú giải; **CHƯA ĐỦ làm class diagram chi tiết hoàn chỉnh** cho báo cáo/thiết kế phần mềm. Không đo độ đầy đủ bằng việc mọi ô có nhiều chữ. Bổ sung nội dung có trace mới là sửa đúng.

## Evidence và giới hạn kiểm tra

[Inventory](evidence/2026-10-12-class-completeness/inventory.json), [audit/scope](evidence/2026-10-12-class-completeness/verification.json), [entry hashes](evidence/2026-10-12-class-completeness/baseline.json), [entry pointer capture](evidence/2026-10-12-class-completeness/entry-pointer.zip), [diff stat](evidence/2026-10-12-class-completeness/diff-stat.txt), [line counts](evidence/2026-10-12-class-completeness/line-counts.txt). Review đối chiếu tài liệu/repository, không runtime/DB validation, không formal proof toàn bộ domain. Không thay canonical diagram/authority/spec/code/schema/API/test/runtime hay lịch sử.

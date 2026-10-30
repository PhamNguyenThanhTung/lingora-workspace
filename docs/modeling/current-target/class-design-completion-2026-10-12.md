# Hoàn thiện sơ đồ lớp thiết kế miền Lingora

**Phạm vi:** chỉ hoàn thiện model/diagram, không implementation schema. Yêu cầu mới của PO là authority cho các tên/version/history/display tối thiểu; ADR-030–036/041/042 vẫn giữ nguyên. Phê duyệt, yêu cầu nguyên văn.

## Bảng phân loại TRƯỚC khi sửa diagram

Đã đối chiếu23 classifier source/native. Các dòng RENAME cũng được complete members; DEFER của LearningPlan chỉ áp dụng persistence/operations, classifier derived vẫn giữ. KEEP cho Framework/Level chuẩn hóa Text→String, không đổi semantics. Không MERGE/REMOVE vì không có hai classifier domain hiện hành cùng meaning; LogicalUnit là rename chính instance hiện có, không tạo class thứ hai.

| Class | Current status | Problem | Classification | Proposed change | Decision source |
|---|---|---|---|---|---|
| User | 2 members | Đang chỉ có role/status | COMPLETE | Thêm logical identity/email, giữ role server-controlled | UC-01; ADR-034/035 |
| Profile | 2 members | Thiếu thông tin account-global | COMPLETE | Bổ sung displayName/locale/nativeLanguage; streak vẫn account-global | ADR-031; UC-01 |
| LearningContext | 4 members | Thiếu preference/provenance | COMPLETE | Giữ User+Language, tối đa 2 ACTIVE là rule; bổ sung simple preferences/source/self-report | ADR-031/042; yêu cầu §15 |
| LearningPlan | 1 members | Đầu ra derived; không có requirement persistence | DEFER | Giữ <<derived>>, DEFER persistence/method/version/history | ADR-030/031; yêu cầu §16 |
| Progress | 1 members | Một dòng công thức; thiếu Level scope | COMPLETE | Tách named derived properties và quan hệ Level; không chọn cột lưu trữ | ADR-033/036; yêu cầu §14 |
| Language | 1 members | Chỉ name | COMPLETE | Bổ sung code logical để nhận diện ngôn ngữ; không SQL type | Yêu cầu Course/Vocabulary; SAFE DESIGN DECISION |
| ProficiencyFramework | 2 members | Đã đủ meaning framework/version | KEEP | Giữ semantics, chuẩn hóa Text thành String | ADR-030 |
| Level | 1 members | Đã có Framework/Unit liên kết | KEEP | Giữ label và associations; không universal CEFR scalar | ADR-030/033 |
| StudyFocus | 5 members | Enum đủ 5 giá trị | KEEP | Giữ nguyên bộ giá trị | ADR-042 |
| Course | 0 members | Lớp trống; liên kết Language/Unit có | COMPLETE | Thêm identity/title; Language và Units bằng association, visibility derived không thêm ContentStatus | ADR-030/035; yêu cầu §7 |
| LogicalUnit | 0 members | Không có semantics riêng ngoài Unit | RENAME | Đổi tên cùng classifier ID thành Unit, không tạo Unit song song; giữ Course/Level/Lesson | Yêu cầu §2/6; Prisma có Unit; D4 hierarchy |
| Lesson | 2 members | Chỉ required/availability | COMPLETE | Bổ sung identity/display/order/controlled metadata, không learner copy | ADR-030/036/042 |
| Exercise | 4 members | Thiếu learner payload/grading/order | COMPLETE | Phân biệt nội dung hiển thị và grading server-only; metadata finite | ADR-035/036/042; DATA-03 |
| Vocabulary | 0 members | Lớp trống | COMPLETE | Thêm lexical content + Language relation; tách SrsCard user state | Yêu cầu §8; UC-07; ADR-036 |
| LessonAttempt | 2 members | Thiếu provenance/completion time | COMPLETE | Bổ sung immutable revision binding + contribution counts; score không gate completion | ADR-036; DATA-03 |
| SrsCard | 2 members | Thiếu enrollment/history | COMPLETE | Giữ learner-global và uniqueness theo User+Vocabulary; không tạo UserVocabSrs thứ hai | ADR-035/036/041; yêu cầu §8/19 |
| AssessmentBlueprint | 1 members | Chỉ purpose | COMPLETE | Bổ sung explicit scope/coverage/requirements; cấu hình cụ thể nằm snapshot version | ADR-036; yêu cầu §2/10 |
| AssessmentVersion | 1 members | published:Boolean chưa diễn đạt snapshot | RENAME | Rename cùng ID; typed config snapshot, content/items/rubric immutable sau publish/use, Result trace version | Yêu cầu §2/10; ADR-035/036 |
| AssessmentResult | 1 members | Recommendation/outcome bị gộp | COMPLETE | Tách outcome/recommendation, ghi time/provenance; Context/Version owners bằng associations | ADR-032/036; yêu cầu §11 |
| Assignment | 0 members | Trống; thiếu Admin/time/history | COMPLETE | Mỗi instance là một lượt giao Teacher cho cùng Lesson/package; reassign kết thúc lượt cũ/tạo lượt mới, retained chain; thêm Admin association | Yêu cầu §2/5; ADR-034/035; SAFE DESIGN DECISION |
| ContentRevision | 1 members | Chỉ status | COMPLETE | Bổ sung version/author/time/previous revision; không event sourcing | ADR-035; yêu cầu §12 |
| AssessmentItem | 0 members | Lớp trống | COMPLETE | Learner-facing fields tách grading; Version chứa immutable item snapshots; item lifecycle theo parent, không engine/pool mới | ADR-035/036; yêu cầu §9 |
| SecurityAuditEvent | 2 members | Thiếu target/time/reason | COMPLETE | Giữ event classifier hiện có, bổ sung audit semantics; actor bằng User association, không thêm AuditLog duplicate | ADR-035; yêu cầu §13 |

## USER DECISIONS STILL REQUIRED

**Không còn user decision bắt buộc cho vòng hoàn thiện sơ đồ này.** Yêu cầu PO đã cho phép tự quyết detail tối thiểu. Các lựa chọn bên dưới được ghi SAFE DESIGN DECISION, không làm phát sinh product feature.

## Các SAFE DESIGN DECISION và nguồn

1. **Assignment là lượt giao trách nhiệm**, không content revision/workflow. Mỗi lượt có id, Teacher qua association, Admin qua association, assignedAt, endedAt optional và active derived. Reassign tại thời điểm T: đóng lượt A ở T, tạo lượt B ở T, previousAssignment tham chiếu lượt A; cả hai giữ identity/teacher/time. History của content là các lượt đã giữ lại, tối đa1 lượt chưa ended tại một thời điểm; không overwrite Teacher trên record cũ, không multi-assignee, không bảng/class history mới. Đây là representation logical theo PO§5, không chốt schema; physical PROPOSED stable-assignment/history implementation không bị thay.
2. **LogicalUnit→Unit:** repository Prisma đã có Unit/orderIndex, D4 xác nhận Course→Unit→Lesson nhưng D4 còn proposed/historical CEFR/sixstate/fixed6Unit/24Lesson. DOM LogicalUnit chỉ nhóm Lesson và gắn Level; không tìm thấy meaning riêng. PO§2/6 cho phép rename; giữ identity/Course/Level associations và file/source, thêm code/title/orderIndex logical, không copy PK/FK hay numeric platform limits.
3. **AssessmentVersion→AssessmentBlueprintVersion:** cùng class hiện có, cùng binding với Blueprint/Item/Result. Bao hàm immutable config/content/item/rubric snapshot; không thêm versioning framework hay class AssessmentVersion song song. Scalar config có itemCount/timeLimitMinutes/passThreshold; scope/coverage/policy dùng bounded typed references, không một JSON config blob.
4. **Draft multiplicity:** Lesson→ContentRevision và Version→Item dùng0..* để mô tả gói/version đang chuẩn bị. Publish/use chỉ được sau validation đáp ứng blueprint/config, có content/item hợp lệ; không dùng0..* để cho phép published empty assessment. Published item count do config, không hằng số. Blueprint0..* versions và Course/Unit0..* members giữ khả năng cấu hình/draft.
5. **References không phải FK/JSON:** native associations thể hiện User/Language/Course/Unit/Level/Version ownership. Các trường Reference còn lại có target/meaning được mô tả trong từ điển dưới; không chốt nullable SQL/index/storage. Không lặp cả foreign key attribute và association chỉ để tăng chi tiết.
6. **Course/Unit visibility:** derived từ curriculum/active published lesson policy; không thêm stored ContentStatus cho Course/Unit hay learner enrollment/purpose-as-course. Framework scope qua Unit→Level→Framework; không đoán thêm permanent single-framework invariant cho Course.
7. **Security:** prompt/options là learner-facing; gradingData/gradingPolicySnapshot server-only, không DTO public. BlueprintVersion/Item snapshots immutable sau publish/use; Result trace đúng version qua association. Audit chỉ actor/action/target/version/serverTime/outcome/reason, không snapshots/secret dump.
8. **Progress/Plan:** tất cả count/ratio Progress derived trong Level scope; khi denominator=0 không tạo tỷ lệ giả, trường ratio optional về mặt logical, UI display DEFER. LearningPlan orderedLessons deterministic output, không mặc định persisted/history/versions. Performance độc lập completion; context2 ACTIVE và SRS/streak global là rules, không multiplicity2 tổng số contexts.

## Từ điển type/reference tối thiểu

| Trường/type | Meaning và ranh giới |
|---|---|
| Identifier, String, Integer, Boolean, DateTime, Number, Percentage | Logical types; Number chứa contribution/ratio, Percentage performance/result; không SQL/PK/FK. |
| AccountStatus, LearningPurpose, CurriculumAvailability, ExerciseType, ContentStatus | Named logical domain types đã có; không thêm enum classifier cho đẹp. ContentStatus theo lifecycle ADR-035; ExerciseType tách knowledge area. |
| knowledgeArea | Controlled4 codes VOCABULARY/GRAMMAR/READING/LISTENING; BALANCED chỉ là StudyFocus. Không taxonomy subsystem. |
| nativeLanguage/selfReportedLevel/startingPointSource | Tham chiếu ngôn ngữ/cấp tự khai báo và provenance Placement/SelfReport/Default; không verified proficiency scalar. |
| studyPreferences | Simple per-context preferences đã chốt; representation chi tiết/preferences engine DEFER. |
| topicRefs/skillRefs/practiceSkillRefs/purposeTags | Finite shared course metadata; không learner-owned copies hay new taxonomy. |
| coverage/itemRequirements; topicCoverageSnapshot/skillCoverageSnapshot | Bounded curriculum/topic/skill coverage và item distribution/requirements, có stable references; scalar config có trường riêng. |
| resultPolicySnapshot/gradingPolicySnapshot | Bounded configured mapping/pass/rubric; grading reference server-only; không executable/plugin engine. |
| previousAssignment/previousRevision | Reference tới retained lượt giao/bản sửa trước cùng target; không generic event sourcing. |
| author | User(role=Teacher) tác giả bản sửa; reassignment không đổi attribution. |
| reviewHistory | Retained SRS operations theo logical DATA-03 (rating/server time/schedule outcome/idempotency), không duplicate learner state class. |
| gradingData | Trusted grading/correct-answer data, tách prompt/options; không biểu diễn key được trả cho learner. |
| provenance | Trusted assessment/attempt evidence source; scope Context/Version rõ trên association, không chứa token/secret. |

## Những phần DEFER

Persistence của LearningPlan/Progress; exact SQL schema/RLS/table/key/index/API/DTO; runtime methods/service contracts; standalone assessment-assignment XOR realization; generic item pool/versioning/collaboration; Course/Unit stored lifecycle; comprehensive certification/mastery/SkillProfile/Enrollment; empty-eligible-progress UI; unneeded snapshot fields/extra types. Không DEFER các field/associations tối thiểu đã đủ căn cứ ở bảng trên.

## A–K. Kết quả sau hoàn thiện

Được ghi sau khi render, kiểm tra semantics/geometry và merge an toàn. Chưa thay diagram trước bảng phân loại này.

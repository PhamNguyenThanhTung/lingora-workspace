# Lingora — Independent Final Modeling Review

**Ngày đánh giá:** 2026-10-11  
**Trạng thái:** HOÀN TẤT ĐỘC LẬP (COMPLETE)  
**Phạm vi rà soát:** Toàn bộ 36 canonical PlantUML sources + 36 rendered SVGs + 36 rendered PNGs tại `docs/modeling/current-target/` (30 TARGET + 5 CURRENT + 1 DEFERRED) sau vòng FULL DIAGRAM CORRECTION PASS.  
**Cơ sở thẩm quyền (Controlling Authority):**  
- Quyết định mới nhất của Product Owner (PO decisions);
- Quyết định kiến trúc & nghiệp vụ [ADR-030 đến ADR-036](../../../logs/decision-log.md);
- Yêu cầu kỹ thuật hiện hành tại [docs/02-requirements.md](../../02-requirements.md) (đặc biệt là MVP Product Baseline Addendum — ADR-036);
- Danh mục Use Case chuẩn 14 mục tại [docs/use-case-specifications.md](../../use-case-specifications.md);
- Ma trận truy vết yêu cầu tại [docs/05-traceability-matrix.md](../../05-traceability-matrix.md).

---

## 1. Kết luận phê duyệt (Final Verdict)

### **MODELING APPROVED**

### Xác nhận chuyển tiếp giai đoạn:
### **READY FOR PHYSICAL DESIGN**
*(Nghiêm ngặt tuân thủ quy tắc: Không bắt đầu physical design hoặc implementation trong task này).*

---

## 2. Kiểm tra 15 tiêu chí bắt buộc (Mandatory Audit)

| STT | Tiêu chí bắt buộc | Bằng chứng đối chiếu trên mô hình | Đánh giá |
|:---:|:---|:---|:---:|
| 1 | **3 roles: Admin, Teacher, Learner** | • Tất cả sơ đồ Use Case (`UC-01` đến `UC-04`), Activity, Sequence, System, Security chỉ sử dụng đúng 3 vai trò: Quản trị viên (Admin), Giáo viên (Teacher), Học viên (Learner).<br>• Không tồn tại bất kỳ role cũ nào (`Creator`, `Moderator`, `Manager`, `SuperAdmin`, `assignedRoles`) trong TARGET.<br>• Mỗi tài khoản có đúng 1 vai trò; không có UI chuyển đổi vai trò; tài khoản staff không dùng để học. | **ĐẠT** |
| 2 | **Login supporting UC & `<<include>>` không làm thay đổi UC catalog** | • Danh mục UC chuẩn trong `docs/use-case-specifications.md` giữ nguyên 14 mục (13 active + 1 reminder UC-03 deferred); không bị biến thành 15 UC.<br>• Trong `UC-01-target-overall.puml`, use case `Đăng nhập / Xác thực` (`Login`) chỉ là presentation-level supporting use case biểu diễn phụ thuộc phiên xác thực.<br>• Đúng 13 use case được bảo vệ có quan hệ `..> Login : <<include>>`. Các luồng công khai (`Đăng ký`, `Kích hoạt tài khoản`, `Khôi phục mật khẩu`) hoàn toàn không include Login. | **ĐẠT** |
| 3 | **Lesson retry/scoring N + K, đóng góp 1 / 0.5 / 0, completion độc lập score** | • `ACT-03` và `SEQ-06`: Bài học gồm `N` bài tập cốt lõi được cấu hình (không hardcode số câu toàn nền tảng).<br>• Lần đầu đúng: đóng góp `1.0`. Lần đầu sai: nhận feedback hỗ trợ, chuyển xuống cuối hàng đợi để retry đúng 1 lần.<br>• Lượt retry: đúng đóng góp `0.5`, sai đóng góp `0`.<br>• Điểm hoàn tất: $\frac{\sum \text{đóng góp}}{N + K}$ với $K$ là số bài sai lần đầu; mọi câu trả lời thực tế đều nằm trong mẫu số.<br>• Hoàn thành (completion) được ghi nhận độc lập với điểm số/tính đúng sai khi đã xử lý hợp lệ toàn bộ bài tập và retry. Bỏ dở không tạo completion hay fake score.<br>• Lượt làm lại (redo) tạo attempt mới, không tăng số bài hoàn thành; điểm lượt mới nhất là primary display, điểm cao nhất là secondary. | **ĐẠT** |
| 4 | **SRS enrollment, 1→3→7→14→30, sau đó 30 ngày/lần** | • `ACT-06` và `SEQ-08`: Hoàn thành bài học tự động enroll từ vựng cốt lõi; từ vựng tùy chọn chỉ enroll khi học viên chủ động chọn.<br>• Mỗi cặp `(Học viên, Từ vựng)` có duy nhất một thẻ logic; gặp lại từ vựng cũ thì tái sử dụng thẻ và giữ nguyên giai đoạn/ngày đến hạn.<br>• Thẻ mới bắt đầu giai đoạn 1, đến hạn sau 1 ngày.<br>• Đánh giá "Đã nhớ": tiến theo chu kỳ Policy B $1 \rightarrow 3 \rightarrow 7 \rightarrow 14 \rightarrow 30$ ngày; sau giai đoạn cuối tiếp tục lặp mỗi 30 ngày và thẻ duy trì hoạt động.<br>• Đánh giá "Chưa nhớ": reset về giai đoạn 1 (đến hạn sau 1 ngày) và đưa vào hàng củng cố cuối phiên tối đa 1 lần.<br>• Lượt củng cố trong phiên KHÔNG tạo thao tác lập lịch thứ hai và không làm thay đổi lịch dài hạn đã tính.<br>• Retry cùng operation là idempotent; ghi nhận ôn tập SRS hợp lệ đủ điều kiện tính chuỗi ngày học (streak). | **ĐẠT** |
| 5 | **Curriculum availability, progression lock, withdrawal/replacement** | • `ACT-01`, `ACT-04`, `ACT-09`, `UC-04`, `SEQ-05`, `STA-03`: Nội dung chưa publish/không khả dụng và lesson withdrawn chưa hoàn thành bị loại khỏi eligible denominator.<br>• Lesson required đã publish, còn thuộc active curriculum, vẫn eligible khi learner chưa mở được vì progression thông thường; icon khóa không làm thay đổi mẫu số.<br>• Thu hồi/ngừng cung cấp bảo toàn completion, result, performance và history; replacement chuyển nguyên tử sang phiên bản mới. Learner đã hoàn thành phiên bản cũ không bị ép học lại; learner chưa hoàn thành theo active replacement. Không hard-delete nội dung đang được evidence tham chiếu. | **ĐẠT** |
| 6 | **Placement and configured Level-up gates; Reassessment deferred** | • `ACT-02`, `ACT-04`, `SEQ-07`, UC-05 và ADR-033: Placement khuyến nghị điểm bắt đầu; Level-up chỉ phục vụ progression, không cấp chứng nhận proficiency/mastery.<br>• Curriculum-readiness gate và Level-up assessment pass rule là cấu hình khóa học/assessment. Không có ngưỡng `100% required lessons` được hard-code ở cấp platform.<br>• `ACT-05` ghi `DEFERRED — NOT IN MVP`; không thuộc hành trình learner active. | **ĐẠT** |
| 7 | **Admin blueprint → Teacher item authoring → Admin review/publish** | • `ACT-08`, `SEQ-03`, `SEQ-04`, `UC-03`, `UC-04`: Ranh giới phân nhiệm (Separation of Duties) chặt chẽ:<br>  - Admin xác định yêu cầu, ma trận đề thi/đề cương (blueprint), phạm vi chủ đề, kỹ năng, phân bố câu hỏi và cấu hình; phân công công việc cho một Giáo viên.<br>  - Giáo viên chỉ biên soạn bài học, bài tập và câu hỏi đánh giá trong phạm vi công việc được phân công.<br>  - Hệ thống kiểm tra điều kiện sẵn sàng: độ bao phủ blueprint, dữ liệu chấm điểm, phương tiện bắt buộc, và cấm dùng lại nguyên xi câu hỏi luyện tập đã lộ đáp án.<br>  - Giáo viên nộp bài; Admin thẩm định, yêu cầu chỉnh sửa hoặc phê duyệt; chỉ nội dung đã được phê duyệt mới được Admin xuất bản thành phiên bản bất biến.<br>  - Admin tuyệt đối không tự viết nội dung câu hỏi và không có quyền tự phê duyệt (no self-approval). | **ĐẠT** |
| 8 | **Admin learner support không sửa learning evidence** | • `SEQ-09`, `UC-04`, `SEC-01`: Nghiệp vụ hỗ trợ tài khoản Học viên của Admin được phân tách ranh giới an toàn:<br>  - Admin chỉ được tra cứu thông tin định danh, vai trò, trạng thái tài khoản tối thiểu và tóm tắt ngữ cảnh học tập.<br>  - Admin có quyền vô hiệu hóa (disable) hoặc kích hoạt lại tài khoản với lý do hợp lệ và được ghi nhật ký bảo mật.<br>  - Tuyệt đối từ chối và ngăn chặn mọi thao tác sửa đổi dữ liệu bằng chứng học tập (hoàn thành bài học, điểm số, kết quả đánh giá, lịch sử SRS, cấp độ, tiến độ).<br>  - Khôi phục mật khẩu là luồng tự phục vụ của người dùng; Admin không xem và không can thiệp mật khẩu hiện tại. | **ĐẠT** |
| 9 | **Assignment lifecycle tách Content Revision lifecycle** | • `STA-02` mô hình hóa vòng đời trách nhiệm công việc (`ASSIGNED` với chuyển giao người phụ trách giữ lịch sử tác giả), không bị gán ép trạng thái kết thúc hay hệ thống quản lý dự án phức tạp.<br>• `STA-03` mô hình hóa vòng đời phiên bản nội dung độc lập: `DRAFT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `CHANGES_REQUESTED` / `APPROVED` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ARCHIVED` / `WITHDRAWN`.<br>• `DOM-01` và `DATA-03` thể hiện thực thể `Assignment` / `AssignmentRecord` tách biệt với `ContentRevision` / `RevisionRecord`. | **ĐẠT** |
| 10 | **Domain/Class Diagram khác bản chất với Logical ERD** | • `DOM-01` là UML Conceptual Model thuần túy: 22 lớp miền nghiệp vụ, quan hệ association/multiplicity (`1..2`, `0..*`), composition, thuộc tính logic tối thiểu, thể hiện `LearningPlan` và `Progress` dưới dạng `<<derived>>` outputs.<br>• `DATA-03` là Logical ERD: 21 thực thể quan hệ logic, ký hiệu crow's-foot, định danh logic, tham chiếu dữ liệu, cấu trúc lưu trữ bằng chứng riêng biệt (`ExerciseResponseRecord`, `LessonVocabularyLink`, `AssignmentHistoryRecord`, `SrsOperationRecord`).<br>• Hai sơ đồ có tập thực thể, thuộc tính và ký hiệu khác nhau hoàn toàn về bản chất abstraction, không phải là một sơ đồ đổi tên. | **ĐẠT** |
| 11 | **Logical concept không bị biến thành physical table** | • Không có bất kỳ kiểu dữ liệu SQL (VARCHAR, UUID, INT, TIMESTAMP), khóa chính/khóa ngoại vật lý (PK/FK constraint), hay chỉ mục nào trong TARGET.<br>• Các khái niệm dẫn xuất (`LearningPlan`, `Progress`) trong domain không bị ép buộc thành bảng cơ sở dữ liệu vật lý.<br>• Nhóm hiển thị `AccountRecord` và `CurriculumReference` trong ERD được chú thích rõ là trừu tượng hóa logic, không áp đặt denormalization hay cấu trúc bảng vật lý. | **ĐẠT** |
| 12 | **Sequence ở business interaction level, không API/SQL contract** | • Cả 9 sơ đồ trình tự (`SEQ-01` đến `SEQ-09`) sử dụng 100% thông điệp nghiệp vụ tiếng Việt trong sáng (ví dụ: `Gửi thông tin đăng nhập`, `Yêu cầu cấp tài khoản`, `Lập yêu cầu; phân công một Giáo viên`, `Xuất bản bản sửa mới đã phê duyệt`).<br>• Không rò rỉ bất kỳ đường dẫn API endpoint (`/api/...`, `/v1/...`) hay câu lệnh truy vấn SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). | **ĐẠT** |
| 13 | **Activity dùng swimlane và đúng flow nghiệp vụ** | • Toàn bộ 9 sơ đồ hoạt động (`ACT-01` đến `ACT-09`) đều phân làn trách nhiệm rõ ràng (`|Học viên|`, `|Hệ thống|`, `|Giáo viên|`, `|Quản trị viên|`).<br>• Luồng xử lý có điểm bắt đầu (`start`), kết thúc (`stop`), rẽ nhánh điều kiện và nhập luồng chuẩn cú pháp UML, thể hiện chính xác quy trình nghiệp vụ. | **ĐẠT** |
| 14 | **CURRENT chỉ là repository/config evidence, không giả live deployment** | • Cả 5 sơ đồ CURRENT (`SYS-01`, `SYS-03`, `DEP-01`, `DATA-01`, `DATA-02`) ghi rõ tiêu đề và chú thích là bằng chứng mã nguồn/cấu hình trong repository hiện hữu.<br>• Nêu rõ mâu thuẫn giữa Prisma (18 model, 6 role) và migration SQL (17 bảng, 2 role enum).<br>• Không giả định đã triển khai đám mây hoặc có cơ sở dữ liệu production đang hoạt động; không vẽ đường kết nối ảo từ web sang CSDL sản phẩm chưa có code runtime. | **ĐẠT** |
| 15 | **Không AI runtime, old roles, mastery engine, Jump hoặc generic workflow** | • Đã quét tự động và thủ công: Hoàn toàn không có thành phần AI/LLM runtime, BKT, SM-2, FSRS (như một engine runtime), Jump assessment, Mastery Engine, hay generic Workflow Engine/QuestionBank trong TARGET.<br>• `ACT-05` (Reassessment) được cô lập với trạng thái `DEFERRED — NOT IN MVP`. | **ĐẠT** |

---

## 3. Đánh giá tính nhất quán liên sơ đồ (Cross-Diagram Consistency Review)

Đã đối chiếu và kiểm chứng chéo 11 nhóm nghiệp vụ trọng yếu trên toàn bộ các góc nhìn mô hình hóa:

1. **Authentication (Xác thực & Phiên làm việc):**
   - *Phù hợp hoàn toàn giữa:* `UC-01`, `UC-02..04` $\leftrightarrow$ `ACT-01`, `ACT-07` $\leftrightarrow$ `SEQ-01`, `SEQ-02`, `SEQ-09` $\leftrightarrow$ `STA-01` $\leftrightarrow$ `DOM-01` (`User`, `Profile`) $\leftrightarrow$ `DATA-03` (`AccountRecord`) $\leftrightarrow$ `SEC-01` (`Guard/Auth`).
   - *Tính nhất quán:* Chủ thể tin cậy duy nhất là `auth.uid()`; vai trò và trạng thái kiểm soát từ server; chặn tài khoản vô hiệu hóa ngay từ request tiếp theo; các luồng đăng ký/khôi phục công khai tách biệt với phiên đăng nhập.

2. **Lesson Execution & Completion (Học bài & Hoàn thành):**
   - *Phù hợp hoàn toàn giữa:* `UC-06`, `UC-08` $\leftrightarrow$ `ACT-03` $\leftrightarrow$ `SEQ-06` $\leftrightarrow$ `DOM-01` (`LessonAttempt`, `Progress`) $\leftrightarrow$ `DATA-03` (`LessonAttemptRecord`, `ExerciseResponseRecord`, `CompletionRecord`) $\leftrightarrow$ `SEC-01`.
   - *Tính nhất quán:* Quy tắc $N + K$, đóng góp $1.0 / 0.5 / 0$, mẫu số $N+K$; hoàn thành ghi nhận độc lập với điểm số; bài làm dở dang không tạo hoàn thành hay điểm số giả.

3. **Spaced Repetition System (Ôn tập ngắt quãng SRS):**
   - *Phù hợp hoàn toàn giữa:* `UC-07`, `UC-08` $\leftrightarrow$ `ACT-06` $\leftrightarrow$ `SEQ-08` $\leftrightarrow$ `DOM-01` (`SrsCard`, `Vocabulary`) $\leftrightarrow$ `DATA-03` (`SrsCardRecord`, `SrsOperationRecord`, `LessonVocabularyLink`) $\leftrightarrow$ `SEC-01`.
   - *Tính nhất quán:* Tự động enroll từ vựng cốt lõi; mỗi cặp `(User, Vocab)` có duy nhất 1 thẻ; chu kỳ Policy B $1 \rightarrow 3 \rightarrow 7 \rightarrow 14 \rightarrow 30$ ngày và lặp lại mỗi 30 ngày ở giai đoạn cuối; lượt củng cố trong phiên không tạo lập lịch thứ hai; retry cùng operation là idempotent; context tạm dừng vẫn ôn tập được SRS toàn cục.

4. **Placement Assessment (Kiểm tra xếp lớp):**
   - *Phù hợp hoàn toàn giữa:* `UC-02` $\leftrightarrow$ `ACT-01`, `ACT-02` $\leftrightarrow$ `SEQ-07` $\leftrightarrow$ `DOM-01` (`AssessmentResult`, `LearningContext`) $\leftrightarrow$ `DATA-03` (`AssessmentAttemptRecord`, `AssessmentResultRecord`) $\leftrightarrow$ `SEC-01`.
   - *Tính nhất quán:* Kết quả là đề xuất điểm bắt đầu (`recommended starting level`), không chứng nhận năng lực; lưu bằng chứng hoàn tất, bài bỏ dở không tạo kết quả; bảo vệ tuyệt đối bí mật đáp án.

5. **Level-up Assessment (Kiểm tra lên cấp):**
   - *Phù hợp hoàn toàn giữa:* `UC-05`, `UC-04` $\leftrightarrow$ `ACT-04` $\leftrightarrow$ `SEQ-07` $\leftrightarrow$ `DOM-01` (`AssessmentVersion`, `AssessmentResult`) $\leftrightarrow$ `DATA-03` $\leftrightarrow$ `SEC-01`.
   - *Tính nhất quán:* Cả configured curriculum-readiness gate và configured assessment pass rule phải đạt; 100% required lessons không phải platform invariant. Trượt không xóa tiến độ hay giáng cấp; khi đỗ mà nội dung level tiếp theo chưa publish/không khả dụng, giữ bằng chứng và hiển thị “Đang phát triển”.

6. **Curriculum & Availability (Chương trình & Tính khả dụng):**
   - *Phù hợp hoàn toàn giữa:* `UC-04`, `UC-06`, `UC-08` $\leftrightarrow$ `ACT-01`, `ACT-04`, `ACT-09` $\leftrightarrow$ `SEQ-05`, `SEQ-06`, `SEQ-07` $\leftrightarrow$ `STA-03` $\leftrightarrow$ `DOM-01` (`Course`, `LogicalUnit`, `Lesson`) $\leftrightarrow$ `DATA-03` (`CurriculumReference`, `LessonRecord`, `RevisionRecord`) $\leftrightarrow$ `SEC-01`.
   - *Tính nhất quán:* Unpublished/unavailable và withdrawn-incomplete bị loại khỏi denominator; published required lessons trong active curriculum vẫn eligible khi chỉ progression-locked. Withdrawal/replacement bảo toàn history; learner đã hoàn thành không bị ép học lại.

7. **Teacher Assignment (Phân công giáo viên):**
   - *Phù hợp hoàn toàn giữa:* `UC-09`, `UC-10`, `UC-11` $\leftrightarrow$ `ACT-08`, `ACT-09` $\leftrightarrow$ `SEQ-03` $\leftrightarrow$ `STA-02` $\leftrightarrow$ `DOM-01` (`Assignment`, `User`, `Lesson`) $\leftrightarrow$ `DATA-03` (`AssignmentRecord`, `AssignmentHistoryRecord`) $\leftrightarrow$ `SEC-01`.
   - *Tính nhất quán:* Đúng 1 giáo viên phụ trách một gói nội dung tại một thời điểm; đổi người phụ trách giữ nguyên nguồn gốc tác giả và lịch sử.

8. **Content Review & Publication (Thẩm định & Xuất bản):**
   - *Phù hợp hoàn toàn giữa:* `UC-12` $\leftrightarrow$ `ACT-08`, `ACT-09` $\leftrightarrow$ `SEQ-04`, `SEQ-05` $\leftrightarrow$ `STA-03` $\leftrightarrow$ `DOM-01` (`ContentRevision`) $\leftrightarrow$ `DATA-03` (`RevisionRecord`) $\leftrightarrow$ `SEC-01`.
   - *Tính nhất quán:* Phê duyệt trước khi xuất bản; nội dung đã xuất bản là bất biến, muốn sửa phải tạo revision mới; chuyển đổi phiên bản hoạt động nguyên tử khi xuất bản thành công, thất bại giữ nguyên bản cũ.

9. **Assessment Package & Integrity (Đặc tả gói đánh giá & Bảo mật đề thi):**
   - *Phù hợp hoàn toàn giữa:* `UC-02`, `UC-05`, `UC-09..12` $\leftrightarrow$ `ACT-02`, `ACT-04`, `ACT-08` $\leftrightarrow$ `SEQ-03`, `SEQ-04`, `SEQ-07` $\leftrightarrow$ `STA-03` $\leftrightarrow$ `DOM-01` (`AssessmentBlueprint`, `AssessmentVersion`, `AssessmentItem`) $\leftrightarrow$ `DATA-03` (`BlueprintRecord`, `AssessmentVersionRecord`, `VersionItemRecord`) $\leftrightarrow$ `SEC-01`.
   - *Tính nhất quán:* Admin lập blueprint; Giáo viên soạn câu hỏi; kiểm tra độ sẵn sàng trước khi nộp; cấm dùng lại câu hỏi luyện tập đã lộ đáp án; xuất bản phiên bản đánh giá bất biến; bài làm ghim chặt vào một phiên bản cố định.

10. **Account Support (Hỗ trợ tài khoản người học):**
    - *Phù hợp hoàn toàn giữa:* `UC-13`, `UC-14` $\leftrightarrow$ `ACT-07` $\leftrightarrow$ `SEQ-02`, `SEQ-09` $\leftrightarrow$ `STA-01` $\leftrightarrow$ `DOM-01` (`SecurityAuditEvent`) $\leftrightarrow$ `DATA-03` (`SecurityAuditRecord`) $\leftrightarrow$ `SEC-01`.
    - *Tính nhất quán:* Quyền đọc tối thiểu định danh/vai trò/tóm tắt ngữ cảnh; tuyệt đối không chỉnh sửa bằng chứng học tập; mọi hành động nhạy cảm đều được ghi nhật ký bảo mật chỉ ghi thêm (append-only).

11. **Account Disable Enforcement (Thực thi khóa tài khoản):**
    - *Phù hợp hoàn toàn giữa:* `UC-01`, `UC-13` $\leftrightarrow$ `SEQ-01`, `SEQ-09` $\leftrightarrow$ `STA-01` $\leftrightarrow$ `DOM-01` $\leftrightarrow$ `DATA-03` $\leftrightarrow$ `SEC-01`.
    - *Tính nhất quán:* Khi bị vô hiệu hóa, tài khoản bị từ chối ngay lập tức ở request kế tiếp dù phiên/token phía client chưa hết hạn.

---

## 4. Đánh giá thị giác thủ công (Manual Visual Review)

Toàn bộ 36 tệp PNG và 36 tệp SVG kết xuất đã được kiểm tra trực tiếp:

1. **Khả năng đọc và kích thước phông chữ (Readability & Font size):**
   - Toàn bộ sơ đồ sử dụng phông chữ Arial quy chuẩn (tiêu đề 18pt, nội dung 14pt). Chữ hiển thị sắc nét, không bị nhòe, không bị cắt xén (no clipping).
   - Bản vẽ vector SVG có độ tương thích cao, khi phóng to thu nhỏ không vỡ nét.
2. **Giao cắt đường nối (Line crossings):**
   - Các sơ đồ phức tạp như `DATA-03` (1930×922), `DOM-01` (1338×1167), `SEC-01` (1536×756) đã được bố trí layout tối ưu, hạn chế tối đa giao cắt giữa các đường quan hệ và hoàn toàn không có đường nối đè lên hộp thực thể/lớp.
3. **Bố trí Actor (Actor placement):**
   - Trong các sơ đồ Use Case (`UC-01` đến `UC-04`), các actor người dùng (`Học viên`, `Giáo viên`, `Quản trị viên`) được đặt ngay ngắn ở bên trái ngoài ranh giới hệ thống, liên kết bằng nét liền không mũi tên theo chuẩn UML.
4. **Chuẩn hóa màu sắc & Loại bỏ rác kỹ thuật (Styling & Hygiene):**
   - 100% sơ đồ tuân thủ bảng màu đơn sắc/thang xám chuẩn học thuật (nền trắng `#FFFFFF`, viền và chữ đen `#000000`, đường viền phụ xám `#555555`).
   - Tuyệt đối không còn mũi tên xanh (blue arrows), ghi chú vàng (yellow notes), thanh gỡ lỗi chân trang (debug footers), hay thông báo cảnh báo/lỗi (syntax errors/warnings).
5. **Khả năng sử dụng trong báo cáo khóa luận (Report Usability):**
   - Các sơ đồ quy trình dài như `ACT-08` (1193×2256) và `SEQ-08` (1064×1812) phù hợp để dàn trang khổ dọc (portrait) nguyên trang.
   - Sơ đồ cấu trúc rộng như `DATA-03` (1930×922), `ACT-09` (2058×1270), `SEC-01` (1536×756) phù hợp để dàn trang khổ ngang (landscape) riêng biệt.

---

## 5. Các ghi chú không cản trở (Non-Blocking Notes)

1. **Định dạng trang báo cáo cho các sơ đồ lớn:** Khi đưa vào tài liệu báo cáo tốt nghiệp hoặc slide thuyết minh, khuyến nghị sử dụng tệp SVG hoặc dàn trang khổ ngang riêng (landscape) cho `DATA-03`, `DOM-01`, `ACT-09` và khổ dọc trọn trang cho `ACT-08`, `SEQ-08` để đảm bảo kích thước chữ đạt chuẩn thẩm mỹ cao nhất.
2. **Tham số cấu hình đánh giá (Assessment Configuration):** Các con số cụ thể trong tài liệu cũ (như 30 câu hỏi, thời gian 25 phút, ngưỡng đạt 80%, phân bố câu hỏi theo Unit) là cấu hình riêng của từng môn học/khóa học (English A1 MVP configuration candidate), không phải là hằng số kiến trúc của nền tảng. Khi triển khai cấu hình khóa học, các giá trị này sẽ được nạp qua cấu hình blueprint được duyệt.
3. **Ranh giới thiết kế vật lý (Physical Design Boundary):** Toàn bộ các định danh logic, bảng quan hệ trong `DATA-03` và các lớp trong `DOM-01` là mô hình hóa mức phân tích và thiết kế logic. Việc ánh xạ sang bảng vật lý cụ thể, trường khóa ngoại, kiểu dữ liệu SQL, migration script, RLS policies và RPC sẽ được thực hiện độc lập trong giai đoạn **Physical Design** sau khi đối chiếu cơ sở dữ liệu thực tế ở chế độ chỉ đọc.

---

## 6. Xác nhận chuyển giao

Sau Final Modeling Review, PO yêu cầu recheck ba điểm hẹp về assignment, Level-up configuration và progress denominator. Recheck xác nhận assignment/reassignment và configured Level-up đã đúng; các câu về progression-lock được làm rõ trong diagram, UC, requirements và báo cáo này.

Mô hình hóa chính thức được phê duyệt:
**MODELING APPROVED**
**READY FOR PHYSICAL DESIGN**

Final three-point correction: reassignment là self-transition đổi responsible Teacher, giữ attribution/history và không có terminal `CLOSED`; Level-up dùng hai configured gates, không hard-code 100%; unavailable và progression-locked được phân biệt để chỉ unavailable/withdrawn-incomplete content bị loại khỏi denominator. Xem [evidence recheck](evidence/final-three-point-correction.md).
*(Dừng công việc theo quy tắc đóng task; không bắt đầu Physical Design hay Implementation trong nhiệm vụ này).*

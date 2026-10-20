# Lingora — Kế hoạch sửa từng lỗi thiết kế

**Ngày:** 2026-10-20. **Yêu cầu:** “ok vậy lên plan chi tiết fix tuungwf lỗi”.
**Mode:** DESIGN — lập kế hoạch, không triển khai sửa trong task này.
**Trạng thái kế hoạch:** COMPLETE — independent plan-accuracy PASS sau một vòng chỉnh classification/wording. Các bước sửa dưới đây CHƯA THỰC HIỆN; FDR-01–07 vẫn OPEN. Đây không phải product/physical approval.

## 1. Mục tiêu, authority và giới hạn

Đóng đúng 7 findings trong [full design review](../docs/design/full-design-review-2026-10-20.md), có trace nguồn → thay đổi → acceptance → evidence. Các mức P1/P2 là severity của review, không thay đổi priority tier/roadmap dự án. Đây là kế hoạch sửa tài liệu/mô hình; không phải Implementation Spec và không chia implementation work packages.

Nguồn điều khiển: [authority map](../docs/README.md), ADR-030–036/041–043 trong [decision log](../logs/decision-log.md), [current UC](../docs/use-case-specifications.md), current addenda của [requirements](../docs/02-requirements.md) và [traceability](../docs/05-traceability-matrix.md), [accepted Class](../docs/modeling/current-target/class-review-2026-10-16.md). [Database reconciliation](../docs/design/physical/database-reconciliation-2026-10-20.md) là proposed physical mapping, không được dùng để phê duyệt thêm product behavior.

**Giữ nguyên:** 14 UC identities (13 active, reminder deferred), ba business role, baseline Class, core scoring/completion, SRS/Study Focus boundaries, chính sách pin/history và các acceptance lịch sử. Không tạo UC/role/QuestionBank/preference engine/table mới để sửa lỗi tài liệu.

**Ngoài scope sửa:** runtime/app code, Prisma/SQL/migrations/seed, live DB/credentials, deployment, dependency upgrades, brand redesign, core API transport specification đầy đủ, lựa chọn numeric assessment config/retention/NFR. Các prerequisite này vẫn còn sau khi đóng 7 lỗi; không hứa “implementation-ready” chỉ vì kết thúc kế hoạch này.

**Không sửa báo cáo review cũ để biến OPEN thành PASS.** Kết quả mới được ghi trong correction report/finding ledger riêng và current pointers. Approved/archive/evidence trước đó giữ nguyên.

## 2. Thứ tự và phụ thuộc

| Đợt | Công việc | Phụ thuộc và đầu ra |
|---|---|---|
| 0 — Entry | Inventory/hash và khóa phạm vi | Entry HEAD, git status, source/render/native/page hashes, findings ledger; chưa sửa semantic |
| 1 — UI | FDR-01 | Dựa trực tiếp current ADR/UC; current screen/role/state index; ghi assembly UI theo ADR-043, kiểm tra lại sau đợt 2 |
| 2 — Logical | FDR-02 → FDR-03 + FDR-04 | Chốt cách biểu diễn assembly/correction trước; sửa DATA-03 một lượt chung cho revision/provenance; SEQ-08 rõ completed revision; source/render/native khớp |
| 3 — Physical | FDR-05 → FDR-06 → FDR-07 | Kiểm tra với logical đã reconcile; catalog/key/receipt/grant/purpose mapping và future acceptance thống nhất; vẫn PROPOSED |
| 4 — Tổng nghiệm thu | Cross-check 7 lỗi, các view liên quan, review độc lập, log/commit | Chỉ đóng finding khi đúng criteria; unresolved scope còn ghi rõ, không giả overall approval |

Thực hiện tuần tự là mặc định. FDR-03/04 cùng DATA-03; FDR-05/06/07 cùng physical README/security/ERD nên không giao đồng thời cho nhiều người sửa. Reviewer đọc độc lập sau mỗi đợt; không tổ chức implementation workers. Có thể gom một commit cho mỗi đợt sau verification/log gates, mỗi commit phải giữ artifacts nhất quán.

## 3. FDR-01 — Sửa UI/UX entry-point đang dùng baseline cũ (P1)

**Phạm vi chính:** [DESIGN.md](../DESIGN.md). Nguồn đối chiếu: current UC-01/02/04–14 và ADR-031–036/041–043. Không chỉnh lại M2.2/M2.3 lịch sử để làm chúng thành current authority.

**Các bước sửa:**

1. Thay hai controlling link hỏng và source routing cũ bằng current-task/authority/UC/Class/current modeling index. Các Phase 1 cũ chỉ còn historical/supporting khi phù hợp. Không dẫn tới plan đã bị xóa.
2. Viết lại active role/screen matrix: Learner dùng learner web; Teacher soạn/nộp assigned Lesson packages; Admin giao việc, review/approve/publish, quản lý account và xem audit. Bỏ six-role split, Unit 4/4, role-conversion, ticket/emergency-publish như active MVP flow khi không có current authority.
3. Giữ screen IDs đã được tham chiếu; đánh dấu các ID cũ không còn active là historical/deferred, không tái sử dụng để chỉ chức năng khác. Kiểm kê lại số screen entries thực tế, không ép đủ 14/11 theo câu văn cũ.
4. Entry flow thể hiện Placement / self-report / default available starting level; label recommendation không phải verified proficiency. Context ACTIVE/PAUSED, tối đa hai ACTIVE, resume giữ lịch sử; khi không có available content hiển thị coming-soon.
5. Thay retry quota/70% bằng N core exercises, K first-wrong, mỗi câu sai retry đúng một lần ở cuối hàng đợi; đóng góp 1/0.5/0, performance = tổng đóng góp/(N+K), completion tách correctness. Dùng UC-06 hiện hành, không UC-05/BF cũ cho lesson.
6. Bổ sung context purpose/preferences/Study Focus, optional supplementary block và SRS không có due-list browsing; không inject vào scored Placement/Level-up. Thêm Admin assembled-version review/feedback và Teacher own-Lesson correction theo ADR-043.
7. Với mỗi active flow ghi role, current UC/ADR, entry/exit và loading/empty/error/denied/success/coming-soon phù hợp. Giữ compatible visual tokens; bỏ runtime claims về Admin UI chưa tồn tại. Không dựng màn hình/CSS trong đợt này.

**Acceptance thiết kế:**

- `DC01-A`: Active matrix đúng ba role, Teacher không approve/publish, Admin không author lesson/item hoặc sửa evidence.
- `DC01-B`: N=3, first correct/wrong/wrong, retry correct/wrong → contribution 1.5, N+K=5, performance 30%; completion vẫn thành công. Không còn 70%/10%-retry như active rule.
- `DC01-C`: Self-report không tạo Result; default entry không ép U1/A1; không có content thì coming-soon; paused/resume không reset.
- `DC01-D`: Focus chỉ ảnh hưởng next supplementary session; không lộ queue/stage/due; Admin review assembled version và feedback đúng nguồn Lesson.
- `DC01-E`: Mọi active screen có authority/role/state mapping; toàn bộ links DESIGN resolve; historical rows không bị hiểu là active requirement.

**Đóng lỗi:** Reviewer kiểm tra current inventory với UC/ADR và text assertions; sau đợt 2 kiểm tra UI/governance terms cùng semantics. Đây là documentation acceptance, không phải UI E2E PASS.

## 4. FDR-02 — Bổ sung system assembly và correction loop (P1)

**Phạm vi chắc chắn:** `docs/modeling/current-target/src/ACT-08-content-governance.puml`, `SEQ-03-assignment-authoring-submit.puml`, `SEQ-04-review-approve-publish.puml`, `STA-03-content-revision-lifecycle.puml`; PNG/SVG của chúng, bốn native page tương ứng và đúng manifest records.

**Đối chiếu có giới hạn:** SEQ-05, ACT-09, SEQ-07, SEC-01, SYS-04, UC/report views. ACT-09/SEQ-05 hiện chủ yếu nói Lesson replacement, không mở rộng thành toàn assessment flow khi chỉ cần làm rõ scope. Chỉ sửa view phụ khi có semantic mismatch có evidence; ghi vào ledger trước khi mở rộng edited-page set.

**Các bước sửa:**

1. Teacher submit đối tượng là assigned Lesson/content package và question contributions; không toàn bộ exam, không standalone blueprint assignment.
2. Thêm system assembly từ eligible submitted sources theo blueprint; thiếu coverage/key/media/scope/generation thì không tạo partial reviewable version. Logical diagram giữ nguyên abstraction, không chép toàn bộ physical locks/DDL vào hình.
3. Admin review assembled immutable version; approve/publish đúng version/readiness. Admin không tự ghép hoặc sửa content; Teacher không chỉnh version membership.
4. Request-changes tới item/source Lesson; hệ thống resolve Teacher hiện phụ trách. Nguồn được sửa/nộp lại, system assembly tạo successor version; version cũ và attempt pins bất biến. Tách creation author, submitter và current assignee.
5. STA-03 dùng hai scope/subgraphs trong cùng diagram/page: Lesson revision lifecycle và system-assembled assessment lifecycle. Assessment bắt đầu IN_REVIEW sau assembly, không đi qua Teacher-created whole-version DRAFT; correction không mở lại composition cũ. Không thêm diagram ID/page mới chỉ để tách scope.
6. Giữ logical policy riêng với proposed storage: frozen-on-first-submit của physical proposal không tự trở thành product rule mới cho mọi Lesson state. Biểu diễn retention/history và successor assessment rõ; mapping nguồn Lesson theo proposal phải ghi đúng classification.

**Acceptance thiết kế:**

- `DC02-A`: Hai Teacher/hai Lessons/một blueprint → system lắp complete version → Admin review; trace được hai contributions, không có whole-exam Teacher assignment (DB43-01/03).
- `DC02-B`: Thiếu input → không có version reviewable/partial publication (DB43-02).
- `DC02-C`: A tạo, reassignment B, C nhận trách nhiệm sau submit → attribution A/B giữ; feedback tới current C, chỉ dữ liệu thuộc công việc C (DB43-06/07/08).
- `DC02-D`: Request one item hoặc toàn version → route đúng source Lessons; new submission tạo successor, rejected/omitted old inputs không fallback (DB43-08).
- `DC02-E`: Attempt pin V1, publish V2 → result vẫn V1; failed publication giữ active version (DB43-09/10). Source/render/native cùng flow; scope Lesson/assessment không lẫn.

DB43 chỉ là scenario reference/future runtime tests, NOT EXECUTED. Đóng lỗi bằng semantic trace + visual/source/native verification của sửa đổi.

## 5. FDR-03 — Revision-scoped vocabulary membership (P1)

**Phạm vi:** DATA-03 và SEQ-08 sources; đúng renders/native pages/manifest. Đối chiếu SEQ-06, ACT-03 và physical revision links; không sửa các flow đã nói đúng chỉ để đồng loạt thay tên.

**Các bước sửa:**

1. `LessonVocabularyLink` có logical identity `revisionRef + vocabularyRef`, core/optional theo revision; association từ Revision. Lesson–Vocabulary chỉ structural union/view.
2. Completion/attempt giữ exact revision reference; enrollment chỉ đọc core membership của valid completed revision. Optional Add to Review phải chỉ rõ eligible source membership/authorization, không biến optional thành auto-enrollment.
3. SEQ-08 nêu rõ completed revision; unique learner+Vocabulary card vẫn global. Existing card giữ stage/due; một membership mới không reset lịch.
4. Xử lý cùng lượt DATA-03 với FDR-04. Reconcile ghi chú Lesson→Revision 0..* cho planned/empty preparation; không máy móc đổi assembled Version→Item thành 0..* khi version phải complete.

**Acceptance thiết kế:**

- `DC03-A`: R1 có core A/optional X; R2 có core B/optional Y. Lịch sử completion R1 truy được R1+A, R2 membership không ghi đè. Optional chỉ enroll qua explicit action.
- `DC03-B`: Replay completion R1 đã commit trước replacement → trả committed result, không enroll B hoặc viết lịch lần nữa. First completion attempt stale sau R2 publication phải theo existing eligibility/finalization guards; không dùng test này để tự cho phép hoàn tất R1 stale.
- `DC03-C`: Cùng Vocabulary xuất hiện ở hai revisions/Lessons → một card, schedule giữ nguyên; replacement không buộc học lại hoặc sửa completion history.
- `DC03-D`: Planned Lesson có thể chưa có revision; publication readiness vẫn yêu cầu đủ payload. Tất cả joins/references/labels và ảnh khớp accepted Class dictionary.

**Đóng lỗi:** Inspect exact reference/cardinality tuples, semantic scenarios và current integrity + native visual review; không tuyên bố SRS runtime đã test.

## 6. FDR-04 — Exact creation/submission/contribution provenance (P2)

**Phạm vi:** DATA-03 trong cùng edit session với FDR-03; source/render/native/manifest và logical reference dictionary/trace trong correction report. Không thêm một bảng cho mỗi reference.

**Các bước sửa:**

1. AssignmentRecord chỉ Lesson package + current Teacher/current scope; bỏ blueprintRef nếu nó ngầm tạo assignment target thứ hai. Blueprint scope của assessment contribution đi qua authored item/source reference, không whole-assessment assignment.
2. AssignmentHistoryRecord thể hiện identity của từng episode, assignee/scope snapshot và order/boundary; current responsibility không thay thế episode.
3. Revision/AssessmentItem giữ immutable creation-author/creation-episode reference. Submission/review history có exact actor, episode, target revision/version, time/feedback; khác security audit.
4. VersionItemRecord tham chiếu exact source Lesson revision, source submission và contribution episode; giữ source identity bên cạnh immutable snapshot. Không suy authorship từ currentTeacherRef hoặc latest submission.
5. Map logical refs sang existing proposed `assignment_history`, `revision_reviews`, `assessment_version_items`, chỉ để chứng minh coverage; đây không phải physical approval.

**Acceptance thiết kế:**

- `DC04-A`: A tạo item → B submit sau reassignment → C phụ trách hiện tại: ba identity không lẫn; old episode/submit record vẫn queryable từ version item.
- `DC04-B`: Version V1 dùng submit S1; S2/successor không thay source S1 của V1. Feedback tới current assignee không rewrite historical creator/submitter.
- `DC04-C`: Mismatched source revision/submission/episode không biểu diễn là valid membership; ledger map logical guard → proposed constraint/future DB43-12.
- `DC04-D`: Không có standalone exam assignment, new actor/UC, generic history engine hoặc requirement one-reference-one-table.

## 7. FDR-05 — Khai báo đủ composite target keys (P2)

**Phạm vi:** `docs/design/physical/README.md`, `physical-erd.puml` phần learning view, `rebuild-plan.md` future acceptance; correction mapping/evidence. Không sửa Prisma hay SQL.

**Các bước sửa:**

1. Thêm vào proposed `lesson_attempts`: `UNIQUE(id,lesson_revision_id)` và `UNIQUE(id,context_id,lesson_id)`.
2. Viết rõ child→parent column tuples: response `(attempt_id,lesson_revision_id)` → attempt `(id,lesson_revision_id)`; completion `(first_attempt_id,context_id,lesson_id)` → attempt `(id,context_id,lesson_id)`.
3. Rà supporting keys khác của hai paths để không chữa thiếu key này bằng cách bỏ composite FK. Giữ NOT NULL/nullable rules, no evidence cascade và completed-attempt guard.
4. ERD learning ghi hai supporting UQ; future test registry ghi migration-create acceptance và mismatch rejection. Các view khác chỉ đổi nếu field mapping thật sự bị tác động.

**Acceptance thiết kế:** `DC05-A` lập bảng FK tuples→declared exact UNIQUE/PK; hai target keys hiện đủ. `DC05-B` same UUID với foreign revision/context/Lesson bị rejection theo constraint design. `DC05-C` completion chỉ completed attempt, redo giữ first provenance. `DC05-D` 34 tables giữ nguyên, catalog/detail/ERD consistent.

**Future runtime, NOT EXECUTED:** Disposable approved implementation environment tạo DDL/FKs thành công; cố insert mismatched child phải fail; valid child pass. Không gọi static text assertions là PostgreSQL execution PASS.

## 8. FDR-06 — Hoàn chỉnh review command receipts (P2)

**Phạm vi:** physical README `revision_reviews`/`command_receipts`, `security-and-rls.md` command matrix và trust/replay rules, `rebuild-plan.md` future tests; ERD learning chỉ nếu đang liệt kê command capabilities cần đồng bộ.

**Các bước sửa:**

1. Bổ sung finite command identities `REQUEST_CHANGES`, `APPROVE`, `ARCHIVE`, `WITHDRAW` vào receipt proposal; các publish/submit identities có sẵn giữ nguyên.
2. Mỗi command typed target Lesson revision hoặc assessment version. Canonical input hash bao gồm target kind/ID, expected version và semantic input (comment/reason/feedback IDs theo command); operation key không cấp quyền.
3. Thứ tự rõ: verify current identity/role/status/target access → lookup committed actor+command+operation receipt → same input trả safe result; changed input conflict → chỉ với operation mới mới check expected version/state/readiness và thực hiện transition. Authorization trước replay không bao gồm việc áp lại transition-state/expected-version guards của operation đã commit.
4. Transition + review/history + required audit + receipt commit atomically; rollback không để success receipt. Concurrent same operation phải một transition; security denial/failure audit vẫn theo existing policy, không biến thành successful replay.
5. Safe result chỉ stable permitted IDs/status, không keys/full-exam details cho actor không có quyền. Disabled actor hoặc actor khác không lấy receipt bypass current authorization.

**Acceptance thiết kế:**

- `DC06-A`: Approve commit nhưng response mất → same key/hash trả same result; không duplicate approval/audit/receipt, dù target state/row_version đã chuyển.
- `DC06-B`: Same key đổi target kind/ID/payload/reason/expected-version → conflict; không thêm transition.
- `DC06-C`: Hai concurrent same-operation requests → một committed effect. Failure trước commit → no success receipt; retry có thể commit một lần.
- `DC06-D`: Actor khác/role sai/account disabled → deny trước đọc safe result; REQUEST_CHANGES/APPROVE/ARCHIVE/WITHDRAW có owner/state policies tương ứng Lesson và assessment.

**Đóng lỗi:** Capability table command→principal→policy→receipt→atomic effects→replay order và future failure cases đủ; reviewer đọc actual catalog/matrix. Runtime integration/concurrency remains NOT EXECUTED.

## 9. FDR-07 — Hoàn thiện LearningPurpose mapping/capability (P2)

**Phạm vi:** physical README context/revision/derived plan mapping, security context grant/command matrix, rebuild future acceptance, ERD content/identity nơi có thuộc tính liên quan. Class và product values giữ nguyên.

**Định hướng kỹ thuật đề xuất:** Ghi rõ `purpose_tags text[]` bounded metadata tại proposed `lesson_revisions`; `Lesson.purposeTags` logical là projection của active revision, historical revision giữ tags riêng. Đây là correction trên proposal, không migration và không thêm table. Không để planner phải đoán nội dung một JSON blob chưa có schema.

**Các bước sửa:**

1. Map LearningPurpose theo nguồn hiện có: ADR-030 cho ví dụ Work/Study/Travel/General communication, không ban hành physical code enum. Code representation/empty-tag semantics và nullable/omitted context purpose (hiện chỉ xuất hiện ở proposed `purpose text?`) phải gắn nhãn PROPOSED physical/config mapping, không tuyên bố đã được PO chấp nhận. Validate mapping/scope/authoring permission; không tự thêm category hoặc yêu cầu bắt learner chọn purpose. Nếu optional/required trở thành human product choice cần quyết định, ghi câu hỏi riêng và dừng phần phụ thuộc.
2. Tags được Teacher soạn trong assigned editable revision, validate trước submit/publication, snapshot/freeze cùng revision theo proposed mapping; active-plan query đọc đúng active eligible content. Không biến purpose thành Course/Track riêng hoặc thay scoring/proficiency.
3. Thêm `purpose` vào narrow context UPDATE grant của existing learner_writer và checked preferences command: ACTIVE Learner, owned context, version check, bounded validation. Không cấp UPDATE all columns hoặc generic direct client write.
4. Nêu purpose/preference change không reset start/working level, completion, attempt/result, SRS/streak/history và purpose là input cho lần derive plan sau. Giữ assessment/core evidence đã pin; supplementary signed snapshot hiện có là PROPOSED transport behavior, không suy thành product timing rule mới cho mọi purpose change. Purpose khác Study Focus; quy tắc approved focus next-supplementary-only và core access/gates giữ nguyên.
5. Derived LearningPlan mapping nêu input context purpose + eligible content metadata; không đặt trọng số/thuật toán routing mới, không persist plan/history engine để sửa mapping thiếu.

**Acceptance thiết kế:**

- `DC07-A`: Purpose create/update theo mapping được ghi rõ; foreign context/forged role và code ngoài mapping bị deny; allowlist đủ nhưng không rộng hơn. Null/omitted-purpose case chỉ là acceptance của proposed nullable mapping cho tới khi có controlling approval; không dùng case này để suy product optionality đã approved.
- `DC07-B`: Đổi purpose khi có evidence/open attempt → lần derive sau dùng purpose mới, existing evidence/schedule và assessment/core pins giữ nguyên. Existing proposed supplementary signed snapshot được kiểm tra theo đúng classification của nó; không biến thành universal purpose-session-freeze policy. Không nhầm với timing rule đã approved của Study Focus.
- `DC07-C`: R1/R2 có tags khác → old revision metadata retained, current eligible planning đọc đúng source; không lấy draft/withdrawn/foreign-scope content chỉ vì match purpose.
- `DC07-D`: Class attribute→physical mapping→read/write principal→validation→future acceptance đầy đủ; không table/role/subsystem mới, không chọn numeric routing policy chưa được duyệt.

## 10. Artifact và verification protocol cho đợt sửa

**Entry và ledger:** Trong task sửa, tạo `docs/design/evidence/2026-10-20-design-correction/` với entry HEAD/status, hashes, changed-page allowlist và ledger `FDR ID → controlling rule → affected files/pages → DC acceptance → observed evidence → OPEN/CLOSED`. Tạo correction report mới `docs/design/design-correction-2026-10-20.md`; đây là kết quả thực hiện, khác plan này và historical review. Không tạo sẵn PASS/correction evidence ở task planning.

**Giữ nguồn và delivery đồng bộ:**

1. Canonical diagram minimum edited set ban đầu: ACT-08, SEQ-03/04/08, STA-03, DATA-03 — sáu diagram IDs. Trong 44 pages, giữ nguyên 38 page fragments khác nếu set không mở rộng; mọi mở rộng có evidence/allowlist trước edit. Class, 9 report pages và CURRENT views không đổi khi không có finding tương ứng.
2. Render chỉ changed PUML thành PNG/SVG bằng Java/PlantUML command trên exact source file. `current-target/render.py` hiện render toàn source directory và rewrite full manifest: không chạy để sửa sáu trang. Không dùng full-bundle Draw.io builder.
3. Chỉnh/merge đúng native page IDs, giữ editable shapes/connectors; payload source phải khớp. Chỉ cập nhật manifest records liên quan và native export hashes/provenance thật. Snapshot ngoài edited set phải byte-identical, không chỉ cùng tên.
4. Physical ERD có bốn views trong một PUML: dự kiến learning (FDR-05/06), content (FDR-07), identity chỉ khi annotation cần rõ purpose. Render changed view blocks bằng staging tạm; kiểm tra PNG embedded-source parity rồi chỉ thay corresponding outputs. Không rewrite historical physical evidence.
5. Visual review từng changed source/native/physical view toàn trang và crop vùng decision, loop, state, labels/cardinality; sửa overlap/clipping trước acceptance. Giữ số source/page IDs nếu không có lý do riêng để đổi.

**Các check sau sửa:**

| Check | Evidence bắt buộc |
|---|---|
| Semantic DC01–DC07 | Reviewer đi từng scenario/invariant; source/diagram trace có expected/observed; không dùng grep-only làm semantic PASS |
| Canonical integrity | `$env:PYTHONUTF8='1'; py -3.11 docs/modeling/current-target/verify_current.py` exit 0, 36 sources/72 outputs/44 native pages; đây chỉ integrity |
| Native structure | `py -3.11 scripts/validate_drawio.py` và task-specific edited-page payload/parity + preservation checks; đối chiếu actual XML count, không dựa success message legacy |
| Physical consistency | 34 catalog/detail/ERD tables, exact FK target tuples, receipt capability/grant matrix, purpose mapping; valid four-view/eight-render set và changed PNG/source parity |
| Preservation | Unchanged source/outputs/manifest records/native fragments, Class baseline, app/Prisma/migrations/history hashes bằng entry; log historical prefixes unchanged |
| Documentation | New/changed current links resolve; không stale authority/runtime claim; `git diff --check`, rồi staged check PASS |
| Review | Independent reviewer kiểm actual diff + rendered/native images + matrix; worker self-test không thay independent acceptance |

`verify_class.py`, `verify_closeout.py`, DB `evidence/2026-10-20-database-design/verify_design.py` chứa historical task scopes/hash assertions. Không chỉnh chúng hoặc rerun như acceptance cho correction task mới; reuse read-only helper logic hợp lệ nếu cần, dùng check scope mới vừa đủ, có assertion phát hiện intentional bad tuple/key/payload để check không chỉ mirror text.

Không chạy runtime mutation harness để “verify design”. DC/DB43/PERS runtime expectations được ghi future NOT EXECUTED; actual design checks được ghi Environment / Command / observed Output / PASS hoặc FAIL trong logs/test-log.md. Không tạo unit tests giả cho đổi prose.

## 11. Review, stop conditions và đóng task

- Sau mỗi đợt: self-check → independent review. Findings từ reviewer có một bounded correction round rồi re-review; blocker còn lại thì STOP/REVIEW và báo cụ thể, không lặp đến khi gọi PASS.
- Conflict giữa current authorities, policy mới (ví dụ bắt buộc chọn purpose, đổi curriculum progression) hoặc scope ngoài 7 findings: ghi owner/CONFLICT và dừng phần phụ thuộc. Các lỗi mô tả đã có accepted rule không cần thêm một vòng product approval tự tạo.
- Mỗi finding CLOSED cần actual diff, mapped DC criteria PASS và independent evidence. Ledger giữ cả initial failure/correction; không sửa review lịch sử hoặc coi static check là runtime pass.
- Chỉ khi cả 7 findings đóng mới gọi “FDR-01–07 design corrections COMPLETE”. Overall physical approval, core API/UI slice implementation readiness và live/deployment acceptance vẫn separate; còn prerequisite phải liệt kê.
- Cuối task sửa: append test/development logs; decision-log chỉ khi có genuine ADR; update modeling/physical current indexes và QUICK-REF bằng kết quả thật; archive closeout, current-task DONE, HANDOFF current state; Conventional Commit sau TEST/LOG gates, không push/history rewrite.

## 12. Trạng thái planning và bước bắt đầu

Task hiện tại chỉ hoàn tất kế hoạch. Khi người dùng yêu cầu thực hiện, ghi active correction task ở current-task và bắt đầu đợt 0 → 1 → 2 → 3 → 4. Không yêu cầu duyệt lại mechanical spec cho các correction đủ nguồn; chỉ hỏi nếu xuất hiện unresolved human decision thật.

Không ước lượng số ngày khi chưa thực hiện native edits/visual correction. Thứ tự, ownership file, deliverable và acceptance đã rõ; tiến độ sau này đo bằng số finding có evidence CLOSED, không đo bằng số file được sửa.

**Planning verification:** T-DESIGN-CORRECTION-PLAN-001 trong [test log](../logs/test-log.md) ghi local-link/coverage/source-page/preservation checks và independent plan review. Không render lại diagram hoặc chạy runtime tests trong task lập kế hoạch.

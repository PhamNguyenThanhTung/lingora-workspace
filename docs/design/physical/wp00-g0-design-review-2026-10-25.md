# Lingora — Independent WP-00/G0 design review

2026-10-25 · DESIGN REVIEW ONLY · **G0 NOT ACCEPTED; runtime của phương án mới chưa được kiểm chứng.** Hai execution package trước giữ nguyên STOP. Không dispatch Anti, sửa code, chạy harness/tests, kết nối database hoặc thay DB architecture/product/security/A2 transport trong lượt này.

## 1. Kết luận và nguyên nhân gốc

**Cần chỉnh cấu trúc hẹp của ownership/lifecycle trong harness; không cần viết lại harness hoặc đổi stack.** Thêm guard riêng lẻ vào năm hàm hiện tại không còn là minimum repair đúng: nó giữ các đường bypass và recovery khác nhau. Giữ Node test runner, `pg`, pinned local Supabase CLI và các file hiện có; gộp orchestration/validation trùng lặp trước khi sửa từng command.

Đối chiếu [spec nền](../../../plans/2026-10-22-database-runtime-implementation-spec.md), [repair spec](../../../plans/2026-10-25-wp00-g0-repair-spec.md), [final review 22/10](evidence/2026-10-22-p0-p1-execution/wp00/codex-review-round-2.md), [final review 25/10](evidence/2026-10-25-wp00-g0-repair/codex-review-round-2.md) với code hiện tại:

| Nguyên nhân | Bằng chứng hiện tại | Hệ quả thiết kế |
|---|---|---|
| Ownership bị đồng nhất với state mô tả endpoint | [guard:349](../../../lingora-admin/tests/database/env/env-guard.mjs#L349) chấp nhận taskId bất kỳ; :395–420 chỉ so root tự khai và workspace containment | Một file có ID hợp lệ và URL local không chứng minh task đã cấp phát instance đó |
| Ownership được ghi sau side effect; boolean `bound` che giai đoạn chưa có ID | [manager:388](../../../lingora-admin/tests/database/env/stack-manager.mjs#L388) prepare trước owner write :459 | Lost response/crash tạo allocation không có intent bền vững; retry random name mới |
| Validation không chi phối toàn bộ call graph | [first-start:488](../../../lingora-admin/tests/database/env/stack-manager.mjs#L488) probe trực tiếp; [data helper:242](../../../lingora-admin/tests/database/env/stack-manager.mjs#L242) đọc credentials đã redact | First-start bypass guard; positive test chứng minh nhánh khác với helper mới |
| Command success, observed state và cleanup bị gộp | [destroy:802](../../../lingora-admin/tests/database/env/stack-manager.mjs#L802) bỏ qua list failure/parse error; [stop:721](../../../lingora-admin/tests/database/env/stack-manager.mjs#L721) chỉ tin exit 0 | Chưa biết postcondition nhưng vẫn báo thành công/xóa recovery |
| Redaction theo tên key bị coi là data boundary | [status:643](../../../lingora-admin/tests/database/env/stack-manager.mjs#L643) copy giá trị provider chưa validate; error nội suy giá trị provider | Secret ở field/value khác vẫn có thể lọt ra stdout/stderr |
| Acceptance mô tả mục tiêu, chưa ánh xạ assertion/side effect | [test:375](../../../lingora-admin/tests/database/env/test-env-guard.mjs#L375) thiếu start dù tên ghi all paths; :366 không await; :654 không inject canary | Test count/hash đúng vẫn không chứng minh claim đầy đủ |

**Điểm bổ sung trong cùng data boundary:** [validateDatabaseUrl:229](../../../lingora-admin/tests/database/env/env-guard.mjs#L229) không từ chối query parameters, nhưng `pg` nhận nguyên URI. Parser đang cài ghi query parameters vào config trước host/port; `pg` merge config đó đè connection options. URI có hostname local nhưng `?host=...&port=...` vì vậy không có cùng ngữ nghĩa với guard. Đây là kết luận static từ `node_modules/pg-connection-string/index.js:39–64` và `pg/lib/connection-parameters.js:53–67`, **không phải kết quả thử kết nối**. Cần chặn cùng nhóm URI override; không phải architecture blocker mới.

Hai spec cũ nêu đúng hướng nhưng chưa chốt creation/recovery states, precedence của context, postcondition evidence, và observation budget cho từng entry point. Lượt sửa đã thêm nhánh thay vì loại bỏ đường thực thi cạnh tranh. Đây là thiếu contract thực thi và coverage, không chỉ lỗi cơ học của worker.

## 2. Phản biện phương án

| Phương án | Đánh giá |
|---|---|
| Thêm ID checks/regex/catch vào từng hàm hiện tại | Loại: vẫn có hai data paths, owner write muộn và cleanup không thống nhất |
| Một owner record, một operation flow, một data path trong module hiện có | **Chọn:** sửa đúng nguyên nhân; thay đổi có giới hạn, không thêm framework/dependency/service |
| HMAC cho binding hoặc hai file chứa cùng ID | Không chọn: không chứng minh allocation; cùng UID có thể sửa cả key/file. Private filesystem + recorded creation intent + provider reconciliation mới là bằng chứng phù hợp |
| Dùng email/project_id/port/HTTP 200 thay native identity | Loại: không phân biệt task/instance; readiness không phải ownership |
| Đổi runtime, viết supervisor hoặc bỏ native để né lỗi | Chưa có lý do: provider health đã quan sát được; lỗi hiện tại nằm ở harness |

Threat boundary: host và source cùng UID được tin cậy, có thể có file stale/corrupt và thao tác concurrent/crash. Không tuyên bố chống một tiến trình độc hại cùng UID sửa cả code/owner/native registry. Không process framework nào cần thêm để giải quyết scope này.

## 3. Ownership contract thống nhất

**Một run = một creation intent bền vững = tối đa một native instance được bind.** Một record là authority của harness; native record là bằng chứng độc lập về provider. Public readiness snapshot là output dẫn xuất, không được dùng để authorize.

- Caller chọn run qua vị trí control đã biết của task, không lấy expected identity/root từ chính binding đang kiểm tra. First-start phải chọn tạo run mới rõ ràng; start bình thường không âm thầm tạo instance nếu mất record. Chi tiết flag/alias có thể chốt trong spec tiếp theo, không cần PO.
- Tạo run directory mới độc quyền trong namespace task đã allowlist, mode 0700. Trong đó có owner record mode 0600, private provider home và workdir chứa **chỉ config fixture đã duyệt**. Không copy `.env`, linked-project metadata, credential, migrations/data cũ. Không dùng lại `.local-stack`, `.supabase-home`, `.wp00-state`, `.wp00-home` của hai package trước.
- Existing root/home có record hợp lệ của **đúng task/run**: resume cùng intent; chỉ thiếu record, corrupt, foreign, symlink/ancestor escape, wrong UID/unsafe permissions hoặc orphan child home: reject. Existing empty directory cũng không tự trở thành owned. Không xóa/adopt unknown root để lấy chỗ.
- Immutable fields: format version, task/run ID, repo/run/control/home/workdir realpaths, config digest, exact branch context, stack name tạo **một lần**, runtime `native`, pinned CLI version, endpoint policy. `instance_id` ban đầu null, sau bind là full ID; không đổi sang ID khác. Không tự tính native ID bằng công thức chưa được provider xác nhận.
- Record được ghi atomically và bền vững **trước CLI allocation**; ghi intent trước mutation, ghi observation sau validation. Tối thiểu ba phase file-local: `RESERVED` (chưa bind ID), `BOUND` (ID đã xác minh), `DESTROYED` (tombstone); thêm `pending_operation` nullable để phân biệt effect chưa rõ. Đây là metadata harness, không phải state/table sản phẩm. Running/stopped/readiness là observation của provider, không thêm state machine trùng lặp.
- Native identity đối chiếu đủ full ID + project root + branch + name + runtime trong cùng private home; đối chiếu endpoint/config khi command cần chúng. Không default selection, prefix ID, wildcard/all-stack action hoặc hardcoded DB URL fallback. Native identity/selection là hành vi được [Supabase mô tả](https://supabase.com/docs/guides/local-development/running-multiple-local-projects); exact output của CLI 2.121.0 vẫn phải pin bằng fixture/runtime evidence.

**First allocation/recovery:** persist RESERVED + pending prepare → verify fresh home/tuple absence → prepare đúng workdir/name → inspect registry → đúng một matching tuple thì bind full ID atomically. Timeout/nonzero/malformed output giữ pending và record; lệnh gốc trả nonzero. Lần retry chỉ reconcile **cùng intent**: một match hợp lệ thì recover cùng ID; foreign/duplicate/mismatch thì stop. Không có match nhưng effect vẫn có thể đang chạy là **unknown**, không phải bằng chứng để prepare lại. Chỉ retry prepare cùng tên/intent khi chứng minh lần trước chưa dispatch hoặc đã kết thúc không tạo registration; nếu provider không cung cấp bằng chứng đủ, trả `RECOVERY_REQUIRED`, giữ record, không tạo ID/name mới.

Known BOUND ID biến mất ngoài một pending destroy hợp lệ: stale/inconsistent, không tạo lại hoặc thay ID. Pending start/stop chỉ reconcile cùng ID rồi hoàn tất/retry cùng operation khi không còn call đang chạy. Pending destroy có thể được recovery xác nhận đã xong bằng authoritative absence/quiescence; không cần phát minh instance mới để có thứ mà destroy.

Không mặc định `stack list` chỉ chứa task hiện tại hoặc `SUPABASE_HOME` tự tạo một registry riêng. D0 phải xác định scope thực tế của home/registry và target selection. Nếu registry metadata được chia sẻ theo hành vi provider, chỉ inspect/filter đúng tuple đã reserve; foreign entries không trở thành owned. Không thêm yêu cầu “toàn máy không có stack khác” hay coi shared registry là bằng chứng shared database.

## 4. Mandatory validation boundary

Mọi entry point dùng cùng thứ tự; first-start chỉ thêm local reservation trước bước inspect:

`validate expected local context → exclusive run lock → reread/validate record → resolve pinned CLI → inspect/reconcile → persist operation intent → effect → validate postcondition → persist safe observation → finally release own lock`.

- Local ownership/config/selection invalid: **0 provider CLI, 0 HTTP, 0 SQL**, kể cả `--version`. Local file/Git metadata reads không phải provider adapters. Native mismatch sau local validation: chỉ version + safe inspection đã khai báo, không action/data. Không giữ claim CLI=1 khi thực tế có version + list.
- Lock dùng cùng run cho start/status/stop/destroy/data; giữ tới khi hết provider call/SQL/HTTP và commit observation. First-start gọi private data path bên trong lock, không gọi lại public entry rồi tự deadlock. Không trả một object “validated” để caller dùng sau khi đã nhả lock.
- Có thể giữ atomic lock-file hiện tại với token của owner và `finally` chỉ release đúng token. **Không tự phá lock vì TTL/PID đơn lẻ.** Crash có orphan lock thì fail closed; recovery chỉ sau khi xác minh exact owning process/child operation đã quiescent và không có operator cạnh tranh. Automatic orphan-lock recovery không phải điều kiện MVP; quy trình recovery kỹ thuật phải được test bằng disposable processes. Trade-off là có thể cần một bước recovery rõ ràng sau hard crash, thay vì retry mù.
- Offline lock recovery chỉ được làm khi đã loại trừ harness đang chạy, owner record/lock token đúng run, process identity (PID kèm start identity, không chỉ PID) đã kết thúc và pending provider action đã quiescent. Chỉ gỡ lock của run đó; không kill/steal unknown process. Không chứng minh được thì giữ lock/intent và báo blocker. Đây là procedure kỹ thuật có evidence, không phải env flag bypass trong command thường.
- Resolve version, prepare/list/status/action đều qua cùng CLI transport đo được; absolute local binary, no shell/global fallback, clean environment kể cả version check. Không provider/PG/profile/NODE_OPTIONS inheritance hoặc load old env files. Workdir config digest/branch mismatch không có cleanup bypass; phải khôi phục đúng context rồi mới tiếp tục.
- Guard module làm local/shape validation; manager sở hữu orchestration và transports. Duy nhất một data helper nhận context đã được manager reconcile bên trong lock. Không giữ duplicated probes trong first-start, không dùng env flags để bỏ guard trong scaffold.
- Production CLI là wrapper mỏng cho dispatcher chung; dispatcher trả kết quả/exit code sau cleanup, module không `process.exit`. Tests gọi cùng dispatcher bằng test bootstrap và transport injection bằng tham số nội bộ, không thêm runtime `BYPASS`/`NODE_ENV` authorization path.

## 5. Preconditions, postconditions và recovery

| Entry | Preconditions sau local ownership | Postcondition được phép báo success | Failure/retry |
|---|---|---|---|
| First start | RESERVED hợp lệ, không prepare còn in flight; registry/home selection đã kiểm chứng | Bind đúng tuple/ID; fresh start/status identity/runtime/config/endpoints khớp; cùng data path đạt readiness | Giữ record từ trước prepare; pending chưa rõ không bị ghi đè, không tự tạo run khác |
| Existing start | BOUND; đúng ID/tuple; owned process state có thể start/resume | Verify response và fresh state như first-start; chạy lại data readiness, không trả readiness cũ | Nonzero/pending; reconcile cùng ID; missing ID không allocate thay |
| Status | RESERVED chỉ cho inspect/recovery; BOUND mới được báo instance | Fresh validated tuple/runtime/endpoints/config; provider enums hợp lệ; chỉ report health thực quan sát | Chưa bind/không ready là trạng thái có mã rõ; malformed/mismatch nonzero, không mutation |
| Stop | BOUND cùng tuple; pending call đã quiescent | Fresh provider evidence instance còn registered, exact ID và services đã stopped | Failed/timeout/malformed/postcheck failed: nonzero, giữ identity/credentials; retry same ID. Already stopped phải được xác nhận |
| Destroy | BOUND hoặc pending destroy có authority; không target unknown ID | Structured authoritative absence trong **đúng registry/home**, exact resource/operation quiescence; normal command outcome hợp lệ | Bất kỳ list/parse/schema/exit/timeout ambiguity nào giữ record/secret files; retry/recovery cùng ID |
| SQL/data | BOUND, fresh live identity/config/endpoints hợp lệ, private credentials đúng run/ID; local destination valid | Query đúng target + expected schema/DB/user/version, HTTP readiness đúng status; no secret output | Close owned client in finally; nonzero, giữ ownership; không fallback target/credentials |

**Xóa recovery files:** chỉ sau destroy được xác minh mới persist tombstone DESTROYED atomically rồi xóa private credentials/derived runtime snapshots. Giữ owner tombstone không chứa secret để lần destroy lặp/crash giữa cleanup không bị hiểu là run mới. Cleanup lỗi trả nonzero `CLEANUP_INCOMPLETE`, retry cleanup trên tombstone; không mất destruction receipt. Lệnh gốc malformed/nonzero không được đổi thành PASS vì sau đó có vẻ absent; recovery là kết quả riêng. RESERVED chưa từng dispatch CLI có thể hủy local reservation; sau dispatch chưa rõ thì không được xóa.

DESTROYED không được resume bằng start; muốn tạo instance khác phải tạo run mới rõ ràng. Status của tombstone phân biệt destruction receipt lịch sử với fresh provider observation. Destroy lặp chỉ cleanup idempotent trên receipt; nếu claim provider hiện vẫn absent thì phải inspect lại, không phát mutation mới hoặc auto-adopt một ID xuất hiện trở lại.

Không dùng global `ps` rỗng hoặc port đóng làm bằng chứng duy nhất về target destruction. Native child termination/quiescence cần bằng chứng gắn exact run/ID. Storage uploads có thể còn lại sau provider destroy: công khai residual path trong vùng owned; không claim “all data erased”, không xóa cả shared home/cache. [Supabase ghi rõ dữ liệu destroy còn giữ](https://supabase.com/docs/guides/local-development/running-multiple-local-projects).

Machine-output schema thực tế của prepare/list/start/status/stop/destroy phải được xác định ở gate đầu, không đoán `destroyed=true` hoặc coi `{}`/text bất kỳ là ack hợp lệ. JSON mà contract tiêu thụ bị malformed/truncated/sai schema luôn nonzero. Nếu pinned CLI không cung cấp observation cần thiết để chứng minh postcondition, dừng slice và ghi technical incompatibility; không lặng lẽ bỏ check.

## 6. SQL/HTTP và credential contract

- Private credential record tối thiểu mode 0600 gắn task/run/full ID và generation; không dùng public `sanitizedEnv` làm input runtime. Secret thiếu/hỏng có thể chặn data/start-readiness nhưng không tước quyền inspect/stop/destroy của owner đã hợp lệ. Refresh/recovery chỉ từ exact provider ID đã reconcile; không email, env, mặc định `postgres:postgres` hoặc credential cũ.
- URI là input để parse, không truyền nguyên vào `pg`. Từ chối query/hash/duplicate connection keys, socket/multihost/encoded host override; validate protocol, literal loopback, exact port/database/user và nonempty provider credential; tạo explicit bounded client config. Không cho raw `connectionString` ghi đè typed target sau guard. Kiểm soát PG environment fallback trong actual SQL adapter; [node-postgres hỗ trợ cả env và programmatic config](https://node-postgres.com/features/connecting).
- HTTP kiểm tra origin/port/path cố định cho Auth/Storage/mail; không userinfo/query/hash hoặc arbitrary base path. `redirect: error`, timeout/retry hữu hạn, status kỳ vọng 200; credential header chỉ được gắn sau validate. Toàn bộ start/status/data dùng cùng endpoint validator. Không log response body/headers.
- Inject transport thấp nhất thực sự gọi: CLI spawn; fetch trả response để **production helper** kiểm tra status/redirect; pg client/connect/query factory để cùng SQL helper chạy. Không inject cả readiness result rồi gọi đó là coverage của transport.
- G0 chỉ SQL/provider health. A2 vẫn phải dùng selected **session pooler** với Prisma 6.19.3 khi được phép bắt đầu; không đổi bằng direct PostgreSQL.

## 7. Error/output contract

Cho phép output finite record: command enum, stage enum, internal error code, validated run/ID, integer exit/status/count và retry disposition (`same-intent`, `recovery-required`, `no-retry`). Provider-derived tên/path/URL/version/service state phải so với expected value hoặc finite grammar trước khi dùng; không chỉ allowlist tên field. Không nội suy raw ID/runtime/error.message/cause/stack/parser snippet.

Raw provider stdout/stderr, malformed JSON, SQL exceptions, credentials/headers/tokens/action links/OTP và unknown fields không bao giờ forward hoặc persist vào shared evidence. Capture streams private/in-memory có giới hạn; map failure sang code nội bộ, bỏ raw payload. Regex sanitizer chỉ defense-in-depth, không phải ranh giới chính. Child spawn dùng argv tách, pipes thay `inherit`, có timeout/buffer bounds và cleanup; Node [child_process v24](https://nodejs.org/docs/latest-v24.x/api/child_process.html) là cơ chế có sẵn, không cần logging framework.

Evidence lưu **đầy đủ stdout/stderr của harness/check** sau contract projection, actual command/cwd/exit/signal/timeout, tested hashes và side-effect/state observations. Đánh dấu provider streams withheld; không gọi structured projection là “full raw provider transcript”. Không publish raw-payload hash thay cho redaction. Nếu cần raw debug riêng thì chưa được mặc định cấp quyền trong package tiếp theo. Cleanup/finally lỗi cũng dùng cùng contract; preserve primary error cùng finite cleanup code, không success vì catch đã chạy.

## 8. Acceptance matrix bắt buộc

`C` = provider CLI transport, gồm version; `I` = safe inspection subset; `M` = provider mutation; `H` = HTTP transport; `Q` = SQL connect/query. Mỗi row ghi actual dispatcher args, output/exit, before/after owner/provider state và ordered adapter trace. Các biến thể nêu trong một row phải là case riêng, không gộp thành một nhãn PASS.

| ID / loại | Entry point và injection | Assertions bắt buộc |
|---|---|---|
| P01 positive | First-start trên run/home/workdir mới | Owner intent persist trước prepare; đúng một allocation; exact tuple/ID; SQL + 3 HTTP probes; no legacy/env use |
| P02 positive | Existing start running / stopped | Same ID/name/home; 0 prepare; fresh readiness qua cùng data path |
| P03 positive | Status / stop / already-stopped / destroy / repeated destroy | Identity + postconditions thật; expected exit; repeated operation không tạo instance; tombstone hỗ trợ retry |
| N01 negative matrix | Existing start/status/stop/destroy/data × missing/corrupt owner, wrong task/run/version, unexpected root/home/workdir/config/branch/name, symlink/ancestor escape | Local-invalid: C=H=Q=0, no owner overwrite/delete; expected nonzero. Explicit new-run creation là P01, không lẫn missing owner |
| N02 negative matrix | Cả năm entry × stale/swapped full ID, native tuple mismatch, duplicate matches, unreachable owner | Chỉ declared C(version)+I; M=H=Q=0; retain receipt; không allocate/adopt |
| N03 negative | Initial/existing start/status/data: returned ID/runtime/config/endpoints đổi hoặc thiếu | Reject trước data; sau control start đã xảy ra vẫn phải H=Q=0, retain pending; không report stale readiness |
| N04 negative | Data URI query host/port/user/SSL overrides, foreign host, missing credential, credential file swapped/redacted, HTTP userinfo/path/query/fragment | Q=H=0; assert actual pg config/fetch destination không thể khác validated target; no fallback |
| F01 injection | Owner reservation write/fsync/rename/lock acquisition failure | C=H=Q=0; no unrecorded provider allocation |
| F02 injection | Prepare dispatch failure / timeout after registration / malformed or lost response / post-prepare list failure | Durable same intent; original exit nonzero; retry one-match→same ID, zero-match uncertain→RECOVERY_REQUIRED, duplicate/foreign→stop; no second prepare while unknown |
| F03 injection | Kill task-owned process sau intent write, prepare register, ID bind hoặc start effect | Restart không sinh ID/name mới; orphan lock fail closed; documented verified lock recovery rồi same-intent reconciliation |
| F04 injection | Start exit 0 nhưng malformed/sai response; SQL fail, HTTP not-200/redirect/timeout | Nonzero; no unsafe downstream calls; close client; retained owner/pending. Chạy cho first và existing start |
| F05 injection | Stop ack success nhưng provider còn running; stop timeout/nonzero/malformed/postcheck fail | Nonzero; no claimed stopped; identity/secret retained, own lock released on handled errors |
| F06 injection | Destroy success-looking response nhưng list nonzero/malformed/missing stacks/wrong home/still present/quiescence unknown | Nonzero; **0 recovery-file deletion**; same-ID retry; không default missing stacks thành [] |
| F07 injection | Crash sau confirmed destroy trước tombstone, sau tombstone trước secret unlink; unlink failure | Recovery xác minh pending destruction; cleanup lặp an toàn; không allocate; tombstone/receipt không mất |
| E01 secret matrix | Cả năm dispatcher paths × valid/malformed/truncated provider stdout/stderr; secret ở known/unknown field, identity/name/runtime/service/error/cause, JSON parser snippet | Capture cả stdout/stderr và artifacts; password/JWT/S3/key/OTP/action-link canary đều vắng. Assert chỉ bool/case ID, không in canary khi assertion fail |
| E02 secret failure | Failed stop/destroy/postcheck/emergency teardown/SQL connect exception chứa canary | Nonzero + finite primary/cleanup codes; retained recovery; no raw output even on finally/error |
| L01 concurrency | Hai process start/start, data/destroy, status/destroy trên cùng run | Một lock owner; loser không C/H/Q; data lock giữ qua connect/query/close; no stale context use; không kill foreign processes |
| S01 scaffold | Absent suite, deliberately failing fixture, forged binding và forged test env flags | Absent→NOT EXECUTED nonzero; test failure propagated; forged runtime flags không bỏ reconciliation; canonical state untouched |
| R01 independent real | Disposable native provider qua final production transports | Fresh ownership, real guard + data helper + SQL/catalog/HTTP, stop/destroy postconditions, relevant failure/recovery cùng ID; fake-only matrix không thay real provider proof |
| V01 provenance | Clean install/parity carry-forward decision + changed-source/output/proof/input cases | Exact hashes/behavior scope; missing proof→not carried; unchanged byte inventory không tự thành parity |

Tests phải await mọi async assertion; canary thực sự đi vào dispatcher trước khi assert không leak. Test bootstrap được inject **transport**, không bỏ owner/lock/parser/guard/error/output flow. Fixture native records lấy từ pinned real observations; không đoán shape. Safety matrix có thể dùng fake child CLI/SQL/HTTP transports; real-provider lifecycle/recovery evidence là lớp riêng. Một lần thay điều kiện sai ở guard/postcheck phải khiến case liên quan fail trong package triển khai, không thực hiện mutation test ở lượt review này.

**G0 acceptance:** mọi row applicable có assertion/evidence và reviewer disposition; không outstanding required defect; no missing/skipped suite counted pass; final tested hashes khớp source. P01/R01 còn phải chứng minh initial và existing start gọi cùng guarded data path. Tổng test count, CLI exit 0 hay worker PASS không thay điều kiện này.

## 9. Evidence được carry-forward

Ngày review, so byte hiện tại với final tested maps 25/10 **không có mismatch**; xem [review inputs](evidence/2026-10-25-wp00-g0-design-review/review-inputs.json). Điều đó xác nhận code đang review là code có log cũ, không xác nhận design mới đã chạy.

| Evidence | Được giữ làm gì / điều kiện |
|---|---|
| [Clean install 25/10](evidence/2026-10-25-wp00-g0-repair/worker/correction-1/02-clean-install-and-dependencies.json) | Carry observation npm ci thật/pins/binary outputs nếu manifests/lock, verifier, Node/npm bootstrap/platform và isolation contract không đổi; bind exact proof/log hashes và ghi rõ là run lịch sử. Source-only manager changes không buộc cài lại chỉ vì muốn mới; không chứng minh manager mới chạy trong clean tree. Bootstrap chưa có hash trong proof cũ phải xác minh/version-bind bổ sung trước khi claim bootstrap byte equivalence |
| [Parity 25/10](evidence/2026-10-25-wp00-g0-repair/worker/correction-1/01-provenance-and-parity.json) | Carry đúng PNG title-dash parity / SVG historical preservation / 34 PUML entities khi proof + verifier + prior/current input records + mọi claimed source/render byte vẫn khớp; không carry current README catalog/set equality hoặc deployed schema |
| Provider readiness 22/10 và [25/10](evidence/2026-10-25-wp00-g0-repair/worker/correction-1/05-native-lifecycle-and-readiness.log) | Historical evidence native route từng chạy được trên host/version/config đó. Ownership/lifecycle/data/error behavior sắp đổi nên **không carry làm acceptance của run mới**; phải chạy R01 trên instance mới |
| 10/16 guard/helper + 3 scaffold tests cũ | Giữ fixtures/regression intent nếu source/behavior tương ứng còn đúng; không carry các claim all-paths/canary/postcondition chưa có assertions. Changed flow phải chạy lại cases chịu tác động |
| Hai final review/STOP | Giữ immutable làm finding provenance. Không snapshot/hash/PASS nào đảo ngược hai STOP hoặc mở A1/A2/A3 |

Mỗi carry-forward record cần old command/cwd/exit/log hash, tested inputs so với current hashes, claim được giữ và phần loại trừ; không chỉ đính hash inventory. Khi artifact/behavior đổi, invalidates đúng dependent claim, không ép re-review toàn bộ thiết kế.

## 10. Quyết định, giả định và plan tiếp theo

**Chốt khuyến nghị kỹ thuật trong review:** một authority record có reservation trước effect; một shared operation/data flow; exact native identity và context; uncertainty không phải absence; verified postconditions trước tombstone/secret cleanup; finite output thay regex làm boundary; matrix theo entry points và side effects. Không cần PO chọn flag/helper/lock primitive. Không có thay đổi product hoặc DB architecture; A2 pooler requirement giữ nguyên.

**Còn phải chứng minh, không coi là runtime fact:** scope/selection thực tế của private home và registry trong CLI 2.121.0; prepare tuple correlation khi lost response; exact machine-output schemas và stop/destroy quiescence; real credential refresh của cùng ID; lock/crash recovery trên host. Native commands là experimental nên docs hiện tại không thay pinned-version evidence. Ba high-severity advisories từ npm chưa triage; sáu stale manifest hashes vẫn disclosed. Unknown allocation hoặc lock có thể yêu cầu explicit technical recovery; không tự hạ security để tăng availability.

High-level plan **đề xuất, chưa dispatch/implementation**:

1. **D0 — characterize pinned provider behavior trên disposable:** xác định tuple/home/registry scope và selection, registry/status/ack shapes, prepare lost-response correlation và termination postconditions. Không đụng code sản phẩm; gate không đạt thì báo exact technical assumption sai, chưa sửa rộng.
2. **D1 — ownership + lifecycle skeleton:** một owner implement record/atomic persistence/lock/context/recovery và shared dispatcher; hoàn thành P/N/F owner/control cases trước probes. Không hai worker sửa manager/guard.
3. **D2 — shared data + output boundary:** cùng owner tích hợp private credentials, pg/fetch transports, safe schemas/error mapping và canary matrix; xóa duplicate first-start probes/test bypass. Phụ thuộc D1, không chạy song song với nó.
4. **D3 — independent evidence integration/review:** real R01 + relevant recovery/concurrency, final hash/command/output map, carry-forward có giới hạn. Evidence/provenance-only preparation có thể song song D1/D2 khi file ownership tách biệt, nhưng không chạy hai native suites trên fixed ports. Verifier/lock/config không đổi thì reuse install/parity proof theo mục 9.

Sau khi owner cho phép package tiếp theo mới phát hành execution spec bám các contract này và review/correction budget đã thỏa thuận; review này không cấp budget/dispatch mới. Design đủ rõ để lập spec và bắt đầu bằng gate D0 khi được yêu cầu; không đủ bằng chứng để tuyên bố G0 PASS hoặc cho A1/A2/A3/P2 chạy.

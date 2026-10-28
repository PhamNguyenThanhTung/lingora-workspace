# Lingora — WP-00/G0 minimal execution result

2026-10-25 · **STOP sau correction 1/1 — G0 NOT ACCEPTED.** D0 characterization PASS và scope-reduction authority giữ nguyên. Không quay lại acceptance matrix D1/D2 cũ, không dispatch correction thứ hai hoặc Codex takeover.

[Execution spec](../../../plans/2026-10-25-wp00-g0-minimal-execution-spec.md), [scope-reduction / 10 criteria](wp00-g0-scope-reduction-review-2026-10-25.md), [review delivery](evidence/2026-10-25-wp00-g0-minimal/codex-review-1.md), [final review](evidence/2026-10-25-wp00-g0-minimal/codex-review-2.md), [final diff](evidence/2026-10-25-wp00-g0-minimal/final.diff), [worker commands/hashes/logs](evidence/2026-10-25-wp00-g0-minimal/worker/correction-1/checks.json).

Một Antigravity worker cùng conversation, pinned `gemini-3.8-flash-high`/high, đã implement/test/self-fix và nhận đúng một correction. Codex chờ delivery, không polling progress hoặc đòi interim artifacts; review trực tiếp source/diff/assertions/saved output và hashes. Codex không sửa implementation, chạy lại tests hoặc gọi provider CLI.

| Gate | Final verdict | Kết quả chính |
|---|---|---|
| M01 Isolation | **OPEN** | Đã bỏ ambient env selection, nhưng production CLI thêm `--runs-dir` tùy ý, biến caller input thành trusted namespace. |
| M02 Intent | **PASS** | Persistence errors propagate; intent được assert tại actual prepare adapter trước effect; required-persistence failure không dispatch prepare. |
| M03 Exact target | **OPEN** | Existing incarnation/missing-anchor checks cải thiện; initial binding còn có thể bỏ qua candidate cùng ID nhưng mâu thuẫn tuple khi đếm matching entries. |
| M04 Denial | **OPEN** | Basic invalid cases deny, nhưng unknown namespace và pending scaffold context còn đường thực thi. |
| M05 Serialization | **OPEN** | Bỏ unsafe orphan recovery, normal close được await. Test “paused client” chỉ tự giữ lock, chưa chứng minh production client bị pause qua close. |
| M06 Ambiguity | **OPEN** | Start/stop/public-data deny pending; destroy và scaffold chưa áp dụng đầy đủ, vẫn có thể mutation/data khi outcome trước chưa rõ. |
| M07 Termination | **OPEN** | Native-file EACCES đã UNKNOWN và retention; required known-PID observation vẫn có thể bị existsSync false diễn giải thành ABSENT→DEAD. |
| M08 Data | **OPEN** | Shared live-data path/fresh credentials/typed targets đã có; scaffold vẫn đi vào path đó với pending operation chưa rõ outcome. |
| M09 Safe output | **OPEN** | Bỏ raw scaffold forwarding; PG/fetch injection đã reachable. Library errors còn nội suy provider-derived service strings; representative public stream/failed-teardown proof còn thiếu. |
| M10 Native proof | **PASS** | Một final-source production-transport lifecycle/readiness/restart/stop/destroy thực có log và matching source hashes; positive path này không đóng failure-path defects. |

Đã quan sát saved output cuối: guard **32 passed**, scaffold **4 passed**, native **1 passed**, tất cả recorded exit0. Native run khoảng190.8s; SQL và Auth/Storage/mail readiness, member continuity qua restart và normal termination có assertions. Sáu final source/test hashes và CLI/Node hashes khớp bytes hiện tại. Test count/worker PASS không thay verdict trên.

Blockers là các đường executable làm mất independent context/pending denial/required observation/public finite boundary và focused assertion còn thiếu. Không dùng exhaustive recovery, toàn-host/socket forensics, canary/concurrency cross-product hoặc mutation testing để từ chối package. Không phát hiện incompatibility cần đổi DB architecture/product; không có PO decision mới.

Actual corrected run `.wp00-runs/pkg-g0-minimal/run-63ad4dd983d690e1`, stack `lingora-wp00-90152fc4`, ID `4fb9b8342bc1bac18712bbaa17db0d5ee4b397fb2a62baa413fba1888e7f5c95`. Worker report ghi nhầm run suffix; tên/ID trong native log khớp receipt thực. Read-only post-state của run này và initial `run-554f9aa2348e317e`: DESTROYED receipts còn, credential/native state/owner files absent. Private caches/fixtures giữ lại. Không claim mọi failure path đã quiescent hoặc mọi dữ liệu đã bị xóa; không adopt/dọn root cũ.

Historical fresh-install và limited PNG/SVG/34-entity parity proofs được carry-forward đúng scope: manifest/lock/config/verifier inputs không đổi. Không chạy lại chỉ để đổi timestamp. Chỉ sáu harness/test files thay đổi trong captured executable inputs; không schema/migration/dependency/config/pin/product implementation.

**Kết thúc package tại STOP.** Không A1/A2/A3/P2, không production/live/unknown database hoặc dữ liệu thật. A2 session-pooler requirement giữ nguyên; native pooler disabled là downstream dependency, không được đổi sang direct PostgreSQL và không được đưa thành G0 blocker mới. Không commit/push.

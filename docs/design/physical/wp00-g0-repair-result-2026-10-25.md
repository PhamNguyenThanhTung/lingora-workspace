# WP-00/G0 repair — kết quả execution 2026-10-25

**G0 NOT ACCEPTED / STOP sau correction 1/1 của package mới.** Không tiếp tục A1/A2/A3 hoặc P2. Kết quả STOP ngày 22/10 và evidence cũ được giữ nguyên.

Codex đã kiểm tra repository thực tế, phản biện minimum repair trong review 2, phát hành [implementation spec](../../../plans/2026-10-25-wp00-g0-repair-spec.md), lưu snapshot đầu vào và giao một Antigravity worker implement/test. R1 sở hữu guard/manager/scaffold; R2 clean install và R3 provenance tách file, có thể song song nhưng dùng một worker tuần tự vì không cần thêm agent. Integration readiness chạy riêng. Sau review đầu không đạt, đã dùng đúng một correction rồi review cuối.

Codex đọc diff thực tế, code, assertions, command/cwd/exit/output và source hashes; không tự implement hoặc chạy lại worker tests. Hai claim PASS của worker không được dùng làm quyết định nghiệm thu.

| Phần | Kết quả có bằng chứng |
|---|---|
| Clean install | npm ci thật trong thư mục mới, HOME/cache/npm config riêng; 69 packages, exit 0; Node 24.22.1/npm 10.8.2, local Supabase 2.121.0/Prisma 6.19.3 và năm dependency pins có output/hash/realpath |
| Parity | Carry-forward gắn hash của proof cũ + input records + byte source/render hiện tại; 7 mutation checks; 34 PUML entities; giữ rõ giới hạn PNG title-dash normalization và SVG artifact preservation |
| Positive readiness riêng | Native instance mới, PostgreSQL 17.11, provider schemas, Auth/Storage/mail HTTP 200, status và stop/destroy quan sát được |
| Boundary/failure safety | **Chưa đạt** dù worker ghi 16 boundary/helper + 3 scaffold + 1 readiness tests pass |

Blocker còn lại trong [Codex final review](evidence/2026-10-25-wp00-g0-repair/codex-review-round-2.md):

1. Chưa chứng minh exact task ownership khi root/home có sẵn hoặc prepare thất bại trước khi ghi owner record; retry có thể tạo allocation mới.
2. First-start dùng output provider để probe trực tiếp, chưa validate binding/endpoints qua guarded data path. Helper mới lại đọc credentials đã redact; positive runtime test chưa kiểm chứng helper đó.
3. Destroy bỏ qua một số lỗi CLI/parse khi xác minh postcondition rồi vẫn xóa recovery files; stop chưa có postcondition như worker claim.
4. Status/error còn phát ra giá trị provider chưa kiểm tra; canary tests chưa đi đủ qua manager/command paths và hai output streams.
5. Matrix test chưa bao phủ đủ start/data và các trường hợp stale/swapped/config/root/home mismatch; một số acceptance claims vượt quá assertions thật.

Đây là lỗi implementation/evidence của harness. Hướng sửa tối thiểu đã ghi trong review; không cần PO quyết định product hoặc thay database architecture. Correction budget đã hết: không dispatch vòng ba, không Codex takeover. Code được giữ để review, chưa accepted, chưa commit/push.

Evidence: [final command/hash inspection](evidence/2026-10-25-wp00-g0-repair/codex-final-evidence-inspection.json), [correction metadata](evidence/2026-10-25-wp00-g0-repair/worker/correction-1/acceptance-summary.json) là claim của worker, [local inventory](evidence/2026-10-25-wp00-g0-repair/codex-final-local-inventory.json). Các hash code đã test khớp file cuối; unrelated input được giữ nguyên. Không có postgres/supabase process trong inventory cuối; cache/home metadata local vẫn còn.

Session pooler vẫn disabled/unproven, chỉ là dependency khi A2 được phép chạy; direct PostgreSQL không thay contract của A2. npm ghi nhận 3 high-severity advisories, chưa triage affected chains, không đổi pins. Sáu historical manifest output hashes stale vẫn được công khai, không sửa lịch sử để lấy PASS. Không triển khai schema/migration, không kết nối/reset/deploy live database hoặc dùng dữ liệu/credential thật.

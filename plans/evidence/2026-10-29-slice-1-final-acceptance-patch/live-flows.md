# Codex live DEV flows — 2026-10-29

Production runtime: npm run start -w lingora-admin -- --hostname 127.0.0.1 --port 3012, built after final source and independent checks. Owner-authenticated IAB session reused successfully; no password or hidden cookie/token inspected. All operations through visible UI only. Code/test review gate PASS preceded any fixture creation. No DB harness/SQL/account mutation.

A/B: previously observed owner login and anonymous boundary remain preserved in stabilization historical evidence. New task re-observed guarded actual catalogue with existing Admin session.
C PASS: initial actual catalogue contained only en/vi. Created owned valid code zzf129a, Vietnamese/English names, both flags false. Saw modal close, server-result row and success announcement.
D PASS: opened zzf129a edit; code disabled. Changed Vietnamese name to Kiểm thử Slice1 đã sửa and Learnable true; saved, success announcement and updated row/flag. Later reload confirmed persistence, code unchanged.
F PASS: attempted create using owned existing code zzf129a, got actual server duplicate-code field error; modal/input retained and focus returned to code. Corrected only code to zzf129b and resubmitted; success and second owned row. Reload confirmed both fixtures persisted. Never attempted duplicate through canonical en/vi mutation.
E PASS / cleanup PASS: opened delete confirmation for zzf129a, initial Cancel focus, confirmed owned deletion, saw success/row absent. Repeated for zzf129b. Reloaded actual production catalogue; exactly en/vi remained with same visible names/flags as initial catalogue. Both owned fixtures absent; no DEV test data left.
Console after final reload: no warn/error entries returned. No screenshot/raw log staged. IAB final catalogue view shown to user. Existing canonical vi Learnable false and en Learnable true remained unchanged; both UI locale flags true. No Slice2.

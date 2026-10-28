# WP-00 reviewer criteria

Codex review checklist, not worker output or acceptance evidence. All items remain pending until actual artifacts are reviewed.

- New task-owned local Supabase full-stack identity and actual PostgreSQL/Auth/Storage/mail readiness; no inherited project or credential. Exact state root, ports, process/container IDs, versions/digests and disposal scope documented without secrets.
- Environment guard denies unbound, malformed, foreign and mismatched targets before network/SQL/cleanup. A loopback address alone is insufficient evidence of task ownership.
- Required versions pinned and reproducible dependency install recorded. Minimal manifests/scripts only; no P1 DDL, P2 features or restored legacy migrations.
- A1/A2/A3 command scaffolds explicitly fail with missing prerequisites; no skip/fake PASS. G0 runtime health and guard checks have exact command/cwd/tested-state/exit-code and full sanitized output.
- Current source/render provenance is explicitly dated; historical hashes/evidence remain unchanged. Static provenance is not provider proof.
- No passwords/JWTs/keys/invite URLs or private local state in tracked/unignored outputs; task secrets/state ignored. No unexpected preexisting-file change, system service change, existing-container/project access, commit or push.
- Environment unavailable is ENVIRONMENT BLOCKED, not evidence that the FTR-02/03 contract is infeasible. G0 remains unpassed until all required setup criteria are met; P1 cannot begin.

Correction budget: zero requested rounds used initially; maximum one after first review.

# PUML and learner presentation review — bounded documentation authorization

Date: 2026-10-12 (Asia/Saigon).

Direct user instruction: “review toàn bộ file puml và kiểm tra kịch bản thuyết trình tôi cần thuyết trình tất cả uc trừ mấy uc phân hệ ng dùng giáo viên admin và 1 số ad nổi bật nữa”. This authorizes a documentation-only review and a concrete companion speaking script; it approves no product decision or modeling correction.

Scope: inspect all extant repository PUML files including shared style and historical evidence copies; check syntax, current render freshness, UC/AD consistency and the existing presentation. Use current UC catalog and ADR-030–036/041/042. Presentation assumption pending optional clarification: omit account/common UC-01 and Teacher/Admin UC-09–14; cover active learner UC-02/04/05/06/07/08; mention deferred UC-03 and Reassessment as scope exclusions. Retain existing ten-minute budget as a draft assumption.

Permitted changes: this snapshot; plans/current-task.md; matching plans/archive/2026-10-12-puml-presentation-review-DONE.md; docs/presentation/puml-review-2026-10-12.md; docs/presentation/learner-usecase-activity-script.md; finite evidence files within docs/presentation/puml-review-evidence-2026-10-12/; append-only logs/test-log.md and logs/development-log.md; current-state HANDOFF.md.

No PUML/render/manifest/code/schema/database/old approval/verifier modifications. Preserve the existing presentation, unrelated changes, HEAD and index. No staging or commit: preexisting untracked modeling and mixed task logs cannot be cleanly attributed to this task, and this is a review delivery.

Acceptance: every extant PUML accounted for by path/classification/hash; syntax tested; existing verifier failures reported from output, not suppressed; findings have specific references and actionable recommendations; companion script covers all six active learner UCs and explicitly selected ADs within a timed ten-minute outline. Explain TARGET design versus CURRENT implementation. Do not claim runtime acceptance or a full physical approval.

Verification: PlantUML --check-syntax on all extant PUML; current canonical/physical verifiers; independent manifest/source/output checks; targeted diagram visual inspection; Markdown links, script scope/coverage/timeline, diff check/stat and new-file line counts; compare preserved PUML/script hashes, HEAD and index at close. Record actual evidence and distinguish PASS/FAIL/N/A.

Review: docs authority/current catalog and report-view mappings checked. Old scope verifiers depend on a previous task baseline; keep their failures as findings rather than editing historical evidence. Physical ERD is PROPOSED and historical copies remain historical. No dependent product decisions are resolved.

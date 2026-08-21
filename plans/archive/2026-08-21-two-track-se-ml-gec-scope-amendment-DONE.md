# Task

two-track-se-ml-gec-scope-amendment

## Status

DONE

Allowed values: `DRAFT / REVIEW / APPROVED / IMPLEMENTING / TESTING / DONE / BLOCKED`

## Plan Boundary

Đây là task sửa đổi phạm vi, kiến trúc và tài liệu chuẩn để hợp nhất LINGORA từ ba hướng đánh giá thành hai hướng:

1. **Project 1 / Software Engineering:** nền tảng học tiếng Anh trên Web, gồm bài học, bài tập, quản trị nội dung, tiến độ, mục tiêu ngày, nhắc nhở trong ứng dụng, luyện viết theo tình huống và SRS xác định dựa trên luật.
2. **Machine Learning:** một năng lực AI duy nhất: Transformer Seq2Seq `t5-small` fine-tuned cho Grammatical Error Correction (GEC).

Task này chỉ sửa kế hoạch và tài liệu trong allowlist. Không triển khai endpoint, Web UI, pipeline huấn luyện, model checkpoint, dependency, schema, migration, RLS, RPC, Storage hoặc xóa code cũ. Mỗi hạng mục implementation sau đó phải có task được phê duyệt riêng.

Agent không được tự chuyển `REVIEW` sang `APPROVED`. Human phải trực tiếp hoàn tất approval trước khi implementation.

## Objective

- GEC bằng `t5-small` là model học máy duy nhất.
- Dialogue generation MultiWOZ và DKT-LSTM/HLR/DQN được đánh dấu `SUPERSEDED`, không xóa lịch sử.
- Roleplay trở thành luyện viết theo tình huống với prompt/state machine xác định; model chỉ sửa câu.
- SRS giữ `UserVocabSrs`, `ReviewLog`, `record_review`; chỉ gọi là SM-2 sau khi audit chứng minh tương thích.
- Giữ nguyên toàn bộ 17 Prisma model, migration, RLS, RPC và Storage trong MVP.
- Thiết kế `POST /v1/gec/correct` theo migration tương thích; chưa xóa endpoint cũ.
- Vẫn trace đủ sáu năng lực Project 1: từ vựng, ngữ pháp, nghe, kiểm tra, lịch học/SRS và nhắc nhở.

## Human Decision Required

Human xác nhận:

1. Transformer-based GEC được chấp nhận là track Machine Learning/Deep Learning.
2. Báo cáo NLP chatbot độc lập không còn bắt buộc; GEC được trình bày trong báo cáo ML.

Nếu chưa xác nhận, giữ trạng thái `REVIEW`.

## Locked Architecture

### Software Engineering

- `lingora-web`: Next.js 15 App Router, server-side Supabase session bằng `httpOnly` cookie, Route Handler proxy.
- `lingora-admin`: Next.js + Prisma, quản trị nội dung và media.
- Supabase giữ Auth, PostgreSQL, PostgREST/RPC, RLS và Storage.
- Không lưu access token trong `localStorage`/ `sessionStorage`.
- Không tự thêm authenticated browser client hoặc quyền mới.

### GEC Service

Luồng bắt buộc:

```text
Browser -> Next.js Route Handler /api/ai/gec
        -> FastAPI POST /v1/gec/correct
        -> T5-small inference
        -> validated response
```

FastAPI stateless, không đọc/ghi Supabase, xác minh JWT bằng boundary ES256/JWKS và HS256 compatibility đã khóa bởi ADR-009. `AI_API_BASE_URL` là server-side fixed value.

### Model Responsibility

- `corrected_text`: output bắt buộc do T5-small sinh.
- `corrections`: alignment/diff xác định.
- `error_type`: ERRANT-compatible tooling hoặc bounded rule mapping; unsupported dùng `UNKNOWN`.
- `suggested_text`, `explanation`: optional/template-based, không tuyên bố model tự giải thích nếu chưa có pipeline/evidence.
- Input và model output phải validate, giới hạn kích thước và render an toàn dưới dạng text.

### Performance

- Warm CPU inference p95 mục tiêu <= 2,000 ms theo benchmark được khóa.
- Cold start/model download báo cáo riêng.
- Next.js hard timeout giữ 8,000 ms.
- `MOCK_MODE` giữ cùng response schema và deterministic output.
- Không ghi PASS nếu chưa có output benchmark quan sát được.

## Proposed API Contract

Endpoint dự kiến:

```text
POST /v1/gec/correct
```

Request:

```json
{
  "text": "I want book a room.",
  "scenario_code": "hotel_booking",
  "lang": "en",
  "client": "web/1.0.0"
}
```

Response:

```json
{
  "original_text": "I want book a room.",
  "corrected_text": "I want to book a room.",
  "corrections": [
    {
      "original_start": 2,
      "original_end": 3,
      "corrected_start": 2,
      "corrected_end": 4,
      "original": "book",
      "replacement": "to book",
      "error_type": "VERB_FORM"
    }
  ],
  "suggested_text": null,
  "explanation": null,
  "model_version": "t5-small-gec-v1",
  "is_mock": false,
  "latency_ms": 380
}
```

Offset phải được khóa rõ là token index hoặc character/code-point index trong contract review. `corrected_text`, `model_version`, `is_mock`, `latency_ms` bắt buộc khi inference thành công; các field mở rộng có thể optional. Error envelope giữ chuẩn hiện tại và bao phủ `INVALID_INPUT`, `TEXT_TOO_LONG`, `LANG_NOT_SUPPORTED`, `SCENARIO_NOT_FOUND`, `UNAUTHORIZED`, `RATE_LIMITED`, `MODEL_UNAVAILABLE`.

## Compatibility Strategy

Không xóa ngay `/v1/chat/roleplay` và `/v1/srs/schedule`.

1. Thêm GEC endpoint, schema, mock và contract tests.
2. Thêm fixed Web Route Handler `/api/ai/gec` và typed client.
3. Migrate UI/tests.
4. Audit `record_review`; chuyển SRS sang deterministic nếu được phê duyệt.
5. Reference scan và regression tests.
6. Đánh dấu endpoint cũ deprecated trong task tương thích riêng.
7. Xóa endpoint/code/dependency cũ chỉ trong cleanup task được phê duyệt riêng.

## Data and SRS

Giữ 17 model hiện có, bao gồm `Exercise.payload`, `UserVocabSrs`, `ReviewLog`, `ChatScenario`, `ChatSession`, `ChatMessage`. MVP không tạo `writing_submissions`, `exercise_options`, notebook/favorites hoặc entity mới. GEC transient; semantics dùng ChatSession/ChatMessage cho writing history phải được audit riêng.

SRS giữ ownership derived from `auth.uid()`, `record_review`, RLS và due-card query `nextReviewAt <= now`. Audit RPC/migration thật trước khi gọi policy là SM-2. Nếu cần đổi RPC/schema/security boundary, quay lại `REVIEW` trong task riêng.

## ML Dataset and Evaluation

Task này chỉ khóa yêu cầu, chưa tải dataset hoặc train model. Task ML sau phải ghi evidence cho:

- dataset và license;
- leakage-safe train/validation/test split;
- identity/no-change và rule/pretrained baseline;
- Precision, Recall, F0.5, ERRANT-compatible score và qualitative analysis;
- warm/cold latency;
- seed, dataset hash/version, commit, config, hardware, checkpoint và registry metadata.

## Files Expected To Change

- `plans/current-task.md`
- approved plan snapshot
- `docs/00-master-plan.md`
- `docs/01-architecture.md`
- `docs/02-requirements.md`
- `docs/03-api-contract.md`
- `docs/04-data-model.md` (status/cross-reference only)
- `docs/05-traceability-matrix.md`
- `docs/06-system-analysis.md`
- `docs/07-data-dictionary.md` (status clarification only)
- `docs/QUICK-REF.md`
- `docs/project-1/README.md`
- `logs/decision-log.md`, `logs/test-log.md`, `logs/development-log.md`
- `HANDOFF.md` only at `DONE` or `BLOCKED`

## Frozen Paths

`lingora-web/**`, `lingora-ai/**`, `lingora-admin/**`, Prisma schema/migrations, SQL/RLS/RPC/Storage, dependencies/lockfiles, model/training artifacts, report binaries, historical plans/ADRs/logs, and visual decisions in `DESIGN.md`.

## Ordered Work After Approval

1. Snapshot approved plan and enter `IMPLEMENTING`.
2. Record ADR for two-track consolidation, superseded scope and compatibility.
3. Build evidence register.
4. Update master plan, requirements, architecture, API proposal, data/status docs, traceability and roadmap.
5. Create separate follow-up plans for GEC API, SRS audit, lesson flow, scenario UI, ML training/evaluation and legacy cleanup.
6. Enter `TESTING`; run documentation, link, terminology, security-boundary and frozen-path checks.
7. Record observed logs; only then mark `DONE`.

## Acceptance Criteria

1. Current canonical docs describe only SE and ML/GEC; history is preserved as `SUPERSEDED`.
2. Six Project 1 capabilities remain traceable.
3. No active target claims DKT/HLR/DQN or MultiWOZ generation.
4. T5-small responsibility is limited to `corrected_text`; derived outputs have explicit owners.
5. Browser -> Route Handler -> FastAPI, httpOnly, JWT and RLS boundaries agree everywhere.
6. GEC contract defines request, response, errors, metadata, offsets, optional fields and compatibility.
7. No schema/migration/RLS/RPC/Storage change and no new GEC persistence.
8. SM-2 is used only with RPC evidence.
9. Dataset/metric/latency claims have no fabricated PASS or metrics.
10. Old endpoints are not removed in this task.
11. Implementation is split into independently approved tasks.
12. Frozen-path diff is empty.

## Test / Validation Plan

| ID | Validation | Evidence |
|---|---|---|
| SCOPE2-T-001 | inventory/Git/frozen paths | SHA, status, file inventory, frozen diff |
| SCOPE2-T-002 | two-track terminology scan | no active three-track/DKT/HLR/DQN/MultiWOZ target |
| SCOPE2-T-003 | six-capability trace | requirement -> UC -> component/data/API -> test/report |
| SCOPE2-T-004 | architecture/security consistency | proxy, httpOnly, JWT, stateless AI, RLS |
| SCOPE2-T-005 | GEC contract review | request/response/error/offset/optional/versioning |
| SCOPE2-T-006 | schema/persistence freeze | 17-model mapping and no DB diff |
| SCOPE2-T-007 | SRS audit | deterministic policy and SM-2 wording |
| SCOPE2-T-008 | ML evaluation completeness | license, split, baseline, metrics, latency, registry |
| SCOPE2-T-009 | links/IDs/whitespace/secrets | observed scan output |
| SCOPE2-T-010 | quality/security review | findings and residual risks |

Logs must use Environment, Command, Output and Verdict. Documentation-only checks still require diff-stat and line-count evidence.

## Stop Conditions

Return to `REVIEW` with categorized decision-log entry if academic acceptance is unconfirmed, six-capability coverage breaks, breaking API removal is required, a frozen path must change, semantics/RLS/security need alteration, evidence is missing, or an acceptance criterion conflicts with implementation.

## Follow-up Implementation Tasks

1. `gec-fastapi-contract-and-mock-foundation`
2. `deterministic-srs-rpc-policy-audit`
3. `m2-web-core-lesson-flow`
4. `scenario-writing-practice-ui`
5. `t5-small-gec-training-and-evaluation`
6. `legacy-ai-endpoint-deprecation`
7. `legacy-ai-code-and-dependency-cleanup`

## Approval

- Status: **APPROVED**
- Requested by: Pham Nguyen Thanh Tung
- Request: `ok fix and approve plan`
- Human action: Pham Nguyen Thanh Tung explicitly approved this plan in the conversation.
- Required human approval text:

  `APPROVE two-track-se-ml-gec-scope-amendment. I confirm that Transformer-based GEC is accepted as the Machine Learning/Deep Learning track and that a separate NLP chatbot deliverable is superseded. I approve the documentation-only allowlist, frozen implementation boundaries, retained 17-model schema, deterministic SRS audit requirement, proposed /v1/gec/correct compatibility strategy, and the follow-up task split. No Web/FastAPI/model/schema/migration/RLS/RPC/Storage/dependency implementation or legacy endpoint removal is authorized by this task.`

- Approval date: 2026-08-21


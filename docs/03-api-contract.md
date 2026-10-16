# 03 - Lingora AI API Contract (Legacy AI Supporting Service)

> **CLASSIFICATION: LEGACY SUPPORTING SERVICE REFERENCE — NOT CURRENT CORE PRODUCT API CONTRACT.**
> This document defines the HTTP boundary for the supporting stateless AI service (`lingora-ai/api`), retained for backward compatibility.
> - **NOT core product API:** This is NOT a general application or domain API contract for Lingora web/admin.
> - **Core learning independence:** Core learning, exercises, progress, and deterministic SRS are 100% independent of this AI service (ADR-014).
> - **AI feature scope:** AI / GEC is currently OUT OF ACTIVE SCOPE for Phase 2 implementation, testing, and demo.
> - **Domain/API sequencing:** Core product domain design is currently at Class Diagram (IN PROGRESS); core backend API contracts depend on domain structure and are not yet finalized.
>
> **Phase 0 Canonical Baseline (aligned 2026-09-14 & ADR-014):**
> This document defines the HTTP boundary for the supporting stateless AI service (`lingora-ai/api`).
> Direct browser-to-FastAPI calls are forbidden; all calls must flow through the Next.js server-side Route Handler proxy in `lingora-web` with an 8-second timeout.
>
> ### Endpoint Tiers & Lifecycle
>
> | Tier | Method & Path | Purpose | Implementation Status |
> |---|---|---|---|
> | **CURRENT** | `GET /health/live` | Liveness check (process alive) | ✅ IMPLEMENTED |
> | **CURRENT** | `GET /health/ready` | Readiness check (components loaded) | ✅ IMPLEMENTED |
> | **CURRENT** | `GET /health` | Health alias check | ✅ IMPLEMENTED |
> | **CURRENT** | `GET /v1/model/info` | Model metadata, registry & reports | ✅ IMPLEMENTED |
> | **COMPATIBILITY** | `POST /v1/srs/schedule` | SRS schedule calculation (DKT/HLR fallback) | ✅ IMPLEMENTED (Retained for backward compat) |
> | **COMPATIBILITY** | `POST /v1/chat/roleplay` | Scenario chat roleplay response | ✅ IMPLEMENTED (Retained for backward compat) |
> | **TARGET** | `POST /v1/gec/correct` | Transformer T5-small English GEC | ⏳ TARGET (Specified, implementation pending) |
>
> *Rule:* Do not remove or deprecate compatibility endpoints while consumers or test suites rely on them. Do not claim GEC is implemented until its implementation task is approved and executed.

## `POST /v1/gec/correct` — Proposed Canonical Target

Request:

```json
{
  "text": "I want book a room.",
  "scenario_code": "hotel_booking",
  "lang": "en",
  "client": "web/1.0.0"
}
```

Successful response:

```json
{
  "original_text": "I want book a room.",
  "corrected_text": "I want to book a room.",
  "corrections": [],
  "suggested_text": null,
  "explanation": null,
  "model_version": "t5-small-gec-v1",
  "is_mock": false,
  "latency_ms": 380
}
```

Normative rules: T5-small owns only `corrected_text`; alignment owns edits and offsets; the classifier owns `error_type` and unsupported classifications use `UNKNOWN`. Offset units must be locked before implementation. `corrected_text`, `model_version`, `is_mock` and `latency_ms` are required on success; extended fields are optional. Input is non-empty, bounded and English-only. Errors use the existing envelope and include `INVALID_INPUT`, `TEXT_TOO_LONG`, `LANG_NOT_SUPPORTED`, `SCENARIO_NOT_FOUND`, `UNAUTHORIZED`, `RATE_LIMITED` and `MODEL_UNAVAILABLE`. Browser calls use a fixed Next.js Route Handler; direct browser-to-FastAPI is not approved. Warm CPU p95 target is 2,000 ms and cold start is reported separately; the Web hard timeout remains 8 seconds.

## Compatibility sequence

1. Implement and test GEC without removing existing endpoints.
2. Migrate the Web proxy, typed client and scenario-writing consumer.
3. Audit deterministic SRS and remove its AI dependency only if separately approved.
4. Run repository-wide reference and regression checks.
5. Deprecation and removal occur in later approved tasks.

---

## [SUPERSEDED / HISTORICAL REFERENCE] Migrated source: legacy AI contracts

### 1.6. API Contract của AI Server (bản v2)

> Chốt file canonical này ở **M0**: `docs/03-api-contract.md`. Nếu cần bản sao trong 3 repo, chỉ đồng bộ từ file này và không sửa trực tiếp bản sao.

#### `POST /v1/srs/schedule`

Mục đích: nhận lịch sử ôn tập của (một phần) thẻ từ vựng của user, trả về xác suất nhớ hiện tại + độ ưu tiên ôn tập. AI Server **không** tự đọc Supabase — client chịu trách nhiệm lấy `review_logs` của mình (RLS bảo vệ) rồi gửi kèm trong request. Điều này giữ đúng nguyên tắc "AI Server không lưu dữ liệu chính".

Request:
```json
{
  "now": "2026-08-13T09:00:00Z",
  "items": [
    {
      "vocabulary_id": "3f2e...-uuid",
      "ease_factor": 2.5,
      "history": [
        { "is_correct": true,  "interval_days": 1.0, "reviewed_at": "2026-08-01T10:00:00Z" },
        { "is_correct": false, "interval_days": 3.0, "reviewed_at": "2026-08-05T10:00:00Z" }
      ]
    }
  ],
  "client": "web/1.0.0"
}
```

Response `200`:
```json
{
  "predictions": [
    {
      "vocabulary_id": "3f2e...-uuid",
      "recall_probability": 0.42,
      "priority": "REVIEW_NOW",
      "recommended_interval_days": 1.5
    }
  ],
  "model_version": "dkt-lstm-v1.0.0",
  "scheduler_version": "rule-v1",
  "is_mock": false,
  "latency_ms": 85
}
```

`recall_probability` là output **duy nhất** của model DKT/HLR. `priority` và `recommended_interval_days` do module **Scheduler** (rule-based, không phải ML — xem mục 1.3b) suy ra từ `recall_probability`; vì vậy response tách riêng `model_version` (của DKT/HLR) và `scheduler_version` (của policy) để báo cáo/kiểm thử không nhầm hai thứ là một. `priority` ∈ `{REVIEW_NOW, REVIEW_TODAY, REVIEW_LATER}`.

Sau khi Web Learner nhận response này và user trả lời xong 1 thẻ, gọi tiếp `POST /rest/v1/rpc/record_review` (mục 1.3c) để ghi log + cập nhật lịch — **AI Server không tự ghi Supabase**.

#### `POST /v1/chat/roleplay`

Request:
```json
{
  "scenario_code": "hotel_booking",
  "lang": "en",
  "history": [
    { "role": "ai",   "content": "Hello! Welcome to Sunrise Hotel. How can I help you today?" },
    { "role": "user", "content": "I want book a room for two night." }
  ],
  "user_message": "I want book a room for two night.",
  "client": "web/1.0.0"
}
```

Response `200`:
```json
{
  "ai_reply": "Sure! For which dates would you like to book the room?",
  "grammatical_acceptability_score": 0.63,
  "feedback": [
    { "span": "I want book", "suggestion": "I want to book", "note": "thiếu 'to' trước động từ" }
  ],
  "model_version": "chat-t5small-v1.0.0",
  "is_mock": false,
  "latency_ms": 240
}
```

> `feedback` là **tuỳ chọn** (P2, có thể bỏ nếu thiếu thời gian — xem `00` mục 0.3), tối đa 1–2 gợi ý. Field đổi tên từ `naturalness_score` → **`grammatical_acceptability_score`** vì bộ chấm dùng CoLA (Corpus of Linguistic Acceptability) đo *độ chấp nhận được về ngữ pháp*, không phải "độ tự nhiên" theo nghĩa rộng (ngữ điệu, phong cách...) — tránh bị hội đồng bắt bẻ tên gọi sai bản chất. UI Web có thể hiển thị nhãn thân thiện "Grammar score" cho người dùng cuối, nhưng báo cáo NLP phải dùng đúng thuật ngữ này. Mục tiêu chính vẫn là `ai_reply` (giữ hội thoại trôi chảy).

#### Envelope lỗi (dùng chung mọi endpoint)
```json
{ "error": { "code": "TEXT_TOO_LONG", "message": "Tối đa 500 ký tự.", "detail": { "max_chars": 500 } } }
```

| Mã lỗi | HTTP | Khi nào |
|---|---|---|
| `INVALID_INPUT` | 400 | text rỗng / `items` rỗng |
| `TEXT_TOO_LONG` | 413 | `user_message` > 500 ký tự |
| `LANG_NOT_SUPPORTED` | 422 | `lang != "en"` |
| `SCENARIO_NOT_FOUND` | 404 | `scenario_code` không tồn tại/chưa publish |
| `UNAUTHORIZED` | 401 | JWT sai/hết hạn |
| `RATE_LIMITED` | 429 | > 20 req/phút/user |
| `MODEL_UNAVAILABLE` | 503 | model chưa load xong |

#### Các endpoint còn lại

| Method | Path | Mục đích |
|---|---|---|
| `GET`  | `/v1/model/info` | Tên/version/dataset/metric của cả 2 model — chụp vào báo cáo |
| `GET`  | `/v1/chat/scenarios` | Danh sách kịch bản đang publish (đồng bộ với bảng `chat_scenarios`) |
| `POST` | `/v1/srs/feedback` | *(tuỳ chọn)* `{vocabulary_id, was_prediction_useful}` — thu thập feedback cải thiện model |

Quy ước bất biến: `snake_case` cho mọi field JSON; version nằm trong path (`/v1/`); mọi response đều có `model_version` và `is_mock`.

---

---

### 5.2. Chiến lược Mock API (bắt buộc, không phải tuỳ chọn)

Cả 2 endpoint AI đều phải hỗ trợ `MOCK_MODE`, bật qua biến môi trường `MOCK_MODE=true` trên FastAPI:

```python
## services/mock.py
import hashlib


def stable_mock_recall(vocabulary_id: str) -> float:
    digest = hashlib.sha256(vocabulary_id.encode("utf-8")).digest()
    ratio = int.from_bytes(digest[:4], "big") / 0xFFFFFFFF
    return round(0.3 + ratio * 0.6, 2)


def mock_srs_predictions(items: list[dict]) -> list[dict]:
    return [
        {
            "vocabulary_id": it["vocabulary_id"],
            "recall_probability": stable_mock_recall(str(it["vocabulary_id"])),
            "priority": "REVIEW_TODAY",
            "recommended_interval_days": 2.0,
        }
        for it in items
    ]

def mock_chat_reply(scenario_code: str, user_message: str) -> dict:
    return {
        "ai_reply": "Sure! Could you tell me the check-in date you'd like?",
        "grammatical_acceptability_score": 0.7,
        "feedback": [],
    }
```

Response khi mock **vẫn giữ đúng schema** như model thật, chỉ khác `"is_mock": true` — đảm bảo client không cần biết đang chạy mock hay thật. Giá trị SRS phải deterministic theo `vocabulary_id` để screenshot, test case và demo lặp lại được.

### 5.3. Chuẩn hoá API Contract

Đã chốt ở file `01`, mục 1.6. Nguyên tắc bổ sung:
- Mọi thay đổi contract sau `M0` phải bump version path (`/v1/` → `/v2/`) hoặc thêm field optional, **không sửa field cũ** (tránh vỡ client đang chạy).
- `docs/03-api-contract.md` là nguồn chân lý duy nhất và là bản duy nhất được sửa trực tiếp. Nếu tạo bản sao trong các repository Lingora, chạy script đồng bộ và kiểm tra checksum trước mỗi mốc `M*`; không copy hoặc sửa tay các bản phụ.

## M0.5 approved contract overrides

This section is normative and supersedes conflicting migrated examples under `ADR-002`.

### Optional grammar acceptability

- Canonical field: `grammatical_acceptability_score`.
- The field is optional P2, numeric in `[0,1]`, and included only when the optional scorer evaluated the user message.
- When the scorer is disabled, unavailable or not invoked, the field is omitted rather than returned as `null`.
- The score is not persisted in `ChatMessage`; `naturalnessScore` and `naturalness_score` are not supported aliases.
- Failure of this optional scorer does not fail an otherwise successful roleplay response.
- A mock may include a deterministic score only when simulating the scorer-enabled contract; otherwise it omits the field.

### Response metadata

- Successful `/v1/srs/schedule` and `/v1/chat/roleplay` inference responses require `model_version` and `is_mock`.
- `is_mock` describes the inference that produced that response, not the whole server.
- Health responses, validation/auth/rate-limit errors, Supabase/RPC responses and non-inference acknowledgements do not require model metadata.
- Errors use the common error envelope and must not fabricate `model_version` or `is_mock`. Diagnostic model metadata may be included only when known and relevant.
- `/v1/model/info` has a per-model metadata shape appropriate to its purpose.

### Health endpoints

| Method | Path | Semantics |
|---|---|---|
| `GET` | `/health/live` | Public liveness. Return `200` when the process can answer requests. Does not depend on model readiness. |
| `GET` | `/health/ready` | Public readiness with separate SRS and NLP loaded/usable and real/mock state. Return `200` when every required configured capability is usable; otherwise `503`. |

`/health` is not required and may exist only as a future documented compatibility alias. Health endpoints must not be used as a keep-warm dependency.

### Compatibility convention

JSON remains `snake_case` and inference paths remain versioned under `/v1/`. Adding an optional field is compatible; removing or renaming an established required field requires an approved versioning decision.

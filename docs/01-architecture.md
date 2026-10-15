# 01 - Lingora System Architecture

> **Classification:** Phase 0 architecture below is `HISTORICAL`/reference. The accepted M2.4 design in [`phase-1-m2-4-architecture-security.md`](phase-1-m2-4-architecture-security.md) is the architecture `TARGET` (ADR-027), not proof of implementation. ADR-030/031/032/033/034/035 record the accepted curriculum, learner-state, assessment/progression, three-role business, and logical security policies only. ADR-034 controls business roles and responsibilities; ADR-035 controls trusted identity, server-side role/status authorization, account-disable enforcement, assessment/SRS trust boundaries, content lifecycle invariants, and logical audit policy. Physical role mapping/RLS, database reconciliation, and all physical realization remain deferred under P0-D07. For `CURRENT`, inspect repository code and perform read-only live-database reconciliation before asserting deployed state. These ADRs do not authorize implementation or change physical schema.

> **Phase 0 Canonical Baseline (aligned 2026-09-14 & ADR-014):**
> LINGORA is structured as a **Software Engineering CORE** platform with a lightweight **AI SUPPORTING CAPABILITY** (GEC), adhering to [`docs/plantuml/system-architecture-mvp.puml`](plantuml/system-architecture-mvp.puml):
> - **Human Actors:** 6 canonical roles — `Learner`, `Lesson Creator`, `Moderator`, `Administrator`, `Operations Staff`, and `Organizational Manager`.
> - **Client Applications:** `Learner Web` (`lingora-web`) for learners; `Admin Web` (`lingora-admin`) for content creators, moderators, operations staff, and administrators.
> - **Application Services:** `Learner API`, `Admin API`, and `Auth & RBAC` (Supabase GoTrue, SSR session handling, and database-level RLS).
> - **Backend Services (Supabase):** PostgreSQL 15 with RLS + RPC, and Supabase Storage (`lingora-avatars`, `lingora-media`).
> - **Supporting AI Service:** Stateless FastAPI service (`lingora-ai/api`) providing GEC (`/v1/gec/correct`) via pretrained model or external API provider; `/v1/srs/schedule` and `/v1/chat/roleplay` remain compatibility surfaces.


## Phase 0 Target Architecture

```text
Learner (Web) ──(HTTPS/UI)──► Next.js App Router (lingora-web) ──(SSR Auth)──► Supabase (GoTrue)
Staff/Admin   ──(HTTPS/UI)──► Next.js App Router (lingora-admin) ──(Prisma TCP)──► Supabase (Postgres 15 + RLS)
Learner Web   ──(Route Handler Proxy /api/ai/gec)──► FastAPI /v1/gec/correct (Internal T5-small GEC)
FastAPI       ──(Verify ES256 JWKS / HS256)──► Supabase GoTrue Public Keys
```

| Component | Responsibility | Non-Responsibility |
|---|---|---|
| **Learner Web** (`lingora-web`) | Course/lesson navigation, interactive exercises (MCQ, FILL_BLANK, REORDER), deterministic SRS review, scenario writing UI, streak/goal tracking, student profile | No service-role key, no direct DB TCP, no client-side secret storage, no direct browser-to-FastAPI calls |
| **Admin Web** (`lingora-admin`) | Content management (Course/Lesson/Vocabulary/Exercise drafts), moderation queue (Review, Approve, Changes Requested), user/role management, operations support, Prisma migrations | No learner-facing runtime, no client-side bypass of authorization rules |
| **Supabase (BaaS)** | Persistent storage (PostgreSQL 15), GoTrue Auth, Row Level Security (RLS) enforcement, atomic RPC (`record_review`), Storage buckets (`lingora-avatars`, `lingora-media`) | No AI model inference |
| **FastAPI (Internal AI)** | Stateless inference, JWT verification (ES256 JWKS + HS256 fallback), target GEC (`/v1/gec/correct`), compatibility endpoints (`/v1/srs/schedule`, `/v1/chat/roleplay`) | No primary data persistence, no direct database read/write |

> **Canonical status:** Phase 0 reconciled architecture baseline. The sections below preserve legacy architecture documentation as historical engineering evidence.

---

## [SUPERSEDED / HISTORICAL REFERENCE] Migrated source: system architecture

### 1.1. Sơ đồ tổng thể (Historical Context)

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  Web Learner (Next.js)  │        │  Web Admin (Next.js)     │
│  TS · Tailwind · shadcn │        │  TS · Tailwind · Prisma  │
│  Người dùng cuối        │        │  Quản trị & Soạn thảo    │
└────────┬───────┬────────┘        └───────┬──────────┬───────┘
         │       │                         │          │
    (1) Auth  (2) Data              (2') Data    (3) Storage
    JWT       PostgREST/RPC         Prisma+TCP   upload audio/media
         │       │                         │          │
         ▼       ▼                         ▼          ▼
┌───────────────────────────────────────────────────────────────┐
│                      SUPABASE (BaaS)                          │
│  Auth (GoTrue) · PostgreSQL 15 + RLS · Storage · REST         │
│  Lưu: profiles, courses, lessons, vocabularies, srs, progress │
└───────────────────────────────────────────────────────────────┘
         ▲                                        ▲
    (4) verify JWT (ES256 JWKS / HS256) (5) ghi log request
         │                                        │
┌────────┴────────────────────────────────────────┴─────────────┐
│                 AI Server (FastAPI · Python)                  │
│  TARGET: POST /v1/gec/correct → T5-small grammatical error    │
│  COMPATIBILITY: /v1/srs/schedule, /v1/chat/roleplay           │
│  MOCK_MODE=true → deterministic fallback                      │
└───────────────────────────────────────────────────────────────┘
         ▲
    (6) HTTPS + Bearer JWT (qua Next.js Route Handler Proxy, timeout 8s)
         │
   Web Learner (màn "Luyện viết tình huống" / "Ôn tập SRS")
```

**Điểm bất biến:** Web Learner **không** đi qua AI Server để lấy dữ liệu bài học/từ vựng gốc — dữ liệu đó luôn lấy trực tiếp từ Supabase. AI Server chỉ xử lý logic suy luận không trạng thái qua proxy. Nếu AI Server tạm thời gián đoạn, luồng học cốt lõi (Lesson, Exercise, deterministic SRS) vẫn hoạt động hoàn toàn bình thường.

### 1.2. Phân chia trách nhiệm

| Thành phần | Chịu trách nhiệm | KHÔNG chịu trách nhiệm |
|---|---|---|
| Web Learner (`lingora-web`) | UI học tập, cache phía client, chấm bài tập phía client, gọi API qua route handler, ghi nhận tiến độ | Không giữ `service_role` key, không kết nối DB trực tiếp |
| Web Admin (`lingora-admin`) | Dashboard quản trị 6 vai trò, quy trình duyệt nội dung (Draft → Review → Publish), quản lý media | Không phục vụ trực tiếp luồng học sinh viên |
| Supabase | Lưu trữ dữ liệu chuẩn, GoTrue Auth, RLS database-level, RPC nguyên tử `record_review`, Storage | Không chạy suy luận AI nặng |
| AI Server (`lingora-ai/api`) | Suy luận T5-small GEC, compatibility endpoints, xác thực JWT (ES256 JWKS / HS256) | Không lưu trữ state chính, không đọc/ghi trực tiếp DB |

---

### 1.5. Luồng xác thực (Auth)

```
Web Learner                Supabase GoTrue              FastAPI
   │  POST /auth/v1/token?grant_type=password
   ├──────────────────────────►│
   │  {access_token(JWT,1h), refresh_token}
   │◄──────────────────────────┤
   │  lưu trong httpOnly cookie do @supabase/ssr quản lý (SDK tự refresh)
   │
   │  GET /rest/v1/...               Authorization: Bearer <JWT>
   ├──────────────────────────►│  (RLS đọc auth.uid() từ JWT)
   │
   │  POST /api/ai/gec (Route Handler proxy, timeout 8s)
   │  ────────────────────────►│  Authorization: Bearer <JWT>
   │                           │  POST /v1/gec/correct
   │                           ├────────────────────────►│
   │                           │                         │ verify ES256 (JWKS)
   │                           │                         │ fallback HS256
   │                           │◄────────────────────────┤
   │◄──────────────────────────┤
   │
   │  401 → @supabase/ssr tự refresh session → retry 1 lần
```

---

---

### 1.7. Cấu trúc repository

```
lingora-web/
├─ src/app/            (auth)/login|register · (learner)/home|lesson|exercise|srs|chat|profile
│                      api/ai/{srs,chat}/route.ts  # Route Handler proxy tới AI Server (timeout 8s)
├─ src/components/ui/  shadcn/ui
├─ src/lib/            supabase/{client,server,middleware}.ts (@supabase/ssr) · api/ (typed client)
│                      query/ (TanStack Query + persisted cache)
├─ src/i18n/           vi/ · en/   (vi là fallback)
└─ middleware.ts       bảo vệ route cần đăng nhập

lingora-admin/
├─ src/app/            (auth)/login · (dashboard)/courses|lessons|vocab|exercises|scenarios|users|analytics
├─ src/components/ui/  shadcn/ui
├─ src/lib/            prisma.ts · supabase.ts · validators/ (zod cho payload Exercise & Scenario)
└─ prisma/             schema.prisma · migrations/ · seed.ts

lingora-ai/
├─ app/                main.py · routers/{srs.py,chat.py} · deps/auth.py
│                      services/{srs_inference,chat_inference,mock}.py · schemas/
├─ ml/
│  ├─ srs/             data/ · model/{dkt_lstm.py, hlr.py} · train.py · evaluate.py · configs/*.yaml
│  └─ chatbot/         data/ · tokenizer/ · model/transformer.py · train.py · evaluate.py · configs/*.yaml
├─ notebooks/          01_eda_srs · 02_eda_dialog · 03_train_dkt · 04_train_hlr ·
│                      05_train_seq2seq · 06_finetune_pretrained · 07_evaluate
└─ docs/03-api-contract.md  # bản sao chỉ được đồng bộ từ canonical root
```

### 1.8. Bàn về khả năng mở rộng (để trả lời hội đồng KNPM)

| Câu hỏi | Trả lời dựa trên thiết kế nào |
|---|---|
| "Thêm tiếng Nhật thì sao?" | Chỉ `INSERT` vào `languages` + `*_translations`, thêm 1 bộ message catalog `ja` cho i18n. Không sửa schema, không sửa code. |
| "1000 user cùng lúc?" | Supabase connection pooling (pgBouncer 6543); client cache bằng TanStack Query persisted cache; AI Server stateless (không giữ session) → scale ngang; đã có index trên `(user_id, next_review_at)`. |
| "AI Server sập?" | Client timeout 8s → **SRS** rơi về `get_due_srs_cards` (lịch mặc định kiểu SM-2 dựa trên `ease_factor`); **Chatbot** hiển thị "thử lại sau". Có `MOCK_MODE`. |
| "Thêm kịch bản roleplay mới?" | Chỉ thêm 1 dòng `chat_scenarios` + bản dịch qua Admin, không cần deploy lại AI Server (prompt/scenario nạp động). |
| "Thêm loại bài tập mới?" | `Exercise.payload` là JSONB + enum `ExerciseType` → thêm 1 giá trị enum + 1 component render, không migrate bảng. |
| "Bảo mật dữ liệu user?" | RLS ở tầng DB (không tin client), JWT hết hạn 1h, session giữ trong httpOnly cookie do `@supabase/ssr` quản lý, `service_role` key chỉ nằm ở server (Admin), AI Server không cần `service_role` vì nhận history qua request body. |
| "Vì sao AI Server không tự đọc DB để tính SRS?" | Giữ AI Server **stateless & không có quyền ghi dữ liệu người dùng** → giảm bề mặt tấn công, dễ scale ngang, dễ demo local (không cần kết nối Supabase khi test model). |

## Migrated source: technology stack

## 03 — Tech Stack chi tiết (bản v3 — đã siết scope Chatbot theo review)

> **Cập nhật so với v2:** bỏ nhánh `DialoGPT-small` (chỉ giữ `t5-small` làm model production duy nhất); Chatbot chỉ train domain `hotel` trước (MultiWOZ), DailyDialog chuyển thành tuỳ chọn; requirements gọn hơn theo đó.

### 3.1. Bảng tổng hợp

| Tầng | Công nghệ | Phiên bản đề xuất | Vì sao chọn |
|---|---|---|---|
| Web Learner | **Next.js** App Router + TypeScript | Next 15, TS 5.x | Cùng stack với Admin → không thêm công nghệ mới; deploy Vercel 1 click |
| Web Learner arch | React Server/Client Components + TanStack Query | TanStack Query 5.x | Tách rõ data layer, có Class/Component Diagram cho báo cáo KNPM |
| Web Admin | **Next.js** App Router + TypeScript | Next 15, TS 5.x | Deploy Vercel 1 click, có server-side để giữ secret |
| CSS | **Tailwind CSS** + shadcn/ui | Tailwind 4 | Dựng bảng/form quản trị rất nhanh |
| Backend/DB | **Supabase** | Postgres 15 + GoTrue + Storage | Có sẵn Auth + REST + RLS → tiết kiệm ~2 tuần viết backend |
| ORM/Migration | **Prisma** | 6.x | Schema-as-code, sinh ERD tự động, migration có version |
| AI core | **Python + PyTorch** | Python 3.11, PyTorch 2.4+ | Chuẩn nghiên cứu; tự viết được kiến trúc mạng (DKT-LSTM, Transformer) |
| AI API | **FastAPI** | 0.115+, Pydantic v2, Uvicorn | Tự sinh Swagger `/docs`, validate schema chặt |
| Hosting | Vercel (web learner + web admin) · Render/HF Spaces (AI) | free tier | Miễn phí, đủ demo |

Không đổi so với bản v1 — điểm khác biệt duy nhất nằm ở mục **3.4 (AI Server & ML)**.

### 3.2. Web Learner — 9 boundary và thư viện (theo `M1.7-D12`)

The approved M1.6W implementation proves the foundation slice of these boundaries: Server Action/server-only
Supabase Auth with an explicit `httpOnly` cookie policy, middleware refresh/route protection, fixed AI Route
Handlers with an 8-second timeout, typed repository contracts, and the neutral vi/en responsive UI. No
authenticated browser Supabase client or browser token store is permitted. `AI_API_BASE_URL` remains a
server-only fixed deployment value and cannot be supplied by a request.

Learner client gồm đúng 9 boundary sau; không có boundary nào khác được thêm mà không có ADR mới:

| # | Boundary | Nội dung |
|---|---|---|
| 1 | Web application | Next.js 15 App Router dưới `lingora-web/`, TypeScript 5 |
| 2 | Authentication / session | `@supabase/ssr`, session trong httpOnly cookie, `middleware.ts` bảo vệ route |
| 3 | API client | typed `fetch` client + Route Handler proxy tới AI Server, timeout 8s, map error envelope của `docs/03` |
| 4 | Repositories / services | lớp truy cập dữ liệu theo feature (course, lesson, vocabulary, progress, profile) |
| 5 | SRS connectivity | gọi `POST /v1/srs/schedule` + ghi review qua RPC `record_review` |
| 6 | Roleplay connectivity | gọi `POST /v1/chat/roleplay` |
| 7 | UI foundation | shadcn/ui + Tailwind 4, layout learner, trạng thái loading/rỗng/lỗi |
| 8 | i18n | `vi` / `en`, `vi` là fallback; `ja` là tuỳ chọn |
| 9 | Responsive / accessibility | breakpoint mobile→desktop, đáp ứng `P1-NFR-002`…`P1-NFR-004` |

```jsonc
// package.json (dependency chính, phiên bản pin tại task triển khai)
"next", "react", "react-dom", "typescript",
"@supabase/supabase-js", "@supabase/ssr",   // auth + session cookie
"@tanstack/react-query",                     // data layer + persisted cache
"tailwindcss",                               // + shadcn/ui components (copy-in, không phải dependency)
// Test
"vitest", "@testing-library/react", "@playwright/test"
```

**Lưu ý quan trọng:** learner client chỉ nhận `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nó **không** được giữ `SUPABASE_SERVICE_ROLE_KEY`, **không** import Prisma, và **không** mở kết nối TCP trực tiếp tới database. Truy cập dữ liệu đi qua PostgREST/RPC với RLS:
- Auth: `POST {SUPABASE_URL}/auth/v1/token?grant_type=password`, header `apikey: <anon_key>`
- Data: `POST {SUPABASE_URL}/rest/v1/rpc/get_lessons`, header `apikey` + `Authorization: Bearer <jwt>`
- Storage: tải file qua URL public

Màn hình AI cần thêm: route `srs/` (gọi `/v1/srs/schedule` qua Route Handler proxy `api/ai/srs`), route `chat/` (UI dạng bong bóng chat, gọi `/v1/chat/roleplay` qua `api/ai/chat`).

### 3.3. Web Admin — thư viện

```bash
npx create-next-app@latest lingora-admin --ts --tailwind --app --eslint
npm i @prisma/client @supabase/supabase-js @supabase/ssr zod react-hook-form
npm i @tanstack/react-table recharts lucide-react sonner
npm i -D prisma prisma-erd-generator @mermaid-js/mermaid-cli tsx
npx shadcn@latest init
```

| Thư viện | Dùng để |
|---|---|
| `zod` + `react-hook-form` | Validate `Exercise.payload` theo `type`; validate `ChatScenario.systemPrompt` không rỗng |
| `@tanstack/react-table` | Bảng user / vocabulary / **chat scenario** có sort, filter, phân trang |
| `recharts` | Biểu đồ thống kê (user mới theo ngày, số request `/v1/srs/schedule`, `/v1/chat/roleplay`, điểm `grammatical_acceptability_score` trung bình) |
| `prisma-erd-generator` | Sinh ERD tự động từ schema → đưa thẳng vào báo cáo KNPM |

Biến môi trường: giữ nguyên bản gốc (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

### 3.4. AI Server & ML — môi trường

`requirements.txt`
```
## API
fastapi==0.115.*
uvicorn[standard]==0.32.*
pydantic==2.9.*
pydantic-settings==2.6.*
python-jose[cryptography]==3.3.*      # verify JWT Supabase
slowapi==0.1.9                         # rate limit
httpx==0.27.*

## ML / NLP chung
torch==2.4.*
transformers==4.46.*
tokenizers==0.20.*
sentencepiece==0.2.*
datasets==3.1.*
numpy pandas matplotlib scikit-learn
tensorboard==2.18.*
tqdm pyyaml

## Riêng nhánh SRS (Knowledge Tracing)
## (không cần thư viện đặc thù ngoài torch/sklearn ở trên;
##  HLR cài đặt bằng numpy/scipy thuần cho dễ giải thích)

## Riêng nhánh Chatbot / NLP
sacrebleu==2.4.*                       # BLEU cho hội thoại (tham khảo, không phải metric chính)
evaluate==0.4.*                        # chuẩn hoá tính Perplexity/Distinct-n

## spacy==3.7.*   # CHỈ cài nếu thực sự cần POS tagging/phân tích lỗi câu — không bắt buộc
##                # cho pipeline chính (đã dùng SentencePiece cho tokenize), giữ environment gọn
```

> Đã bỏ `seaborn` (không dùng — `matplotlib` đủ cho mọi biểu đồ cần vẽ) và chuyển `spacy` thành tuỳ chọn, chỉ bật khi thực sự làm thêm phần POS/phân tích lỗi câu (P2). Mục tiêu: environment càng gọn càng tốt, giảm rủi ro xung đột phiên bản.

#### Chiến lược mô hình

> **Chốt thuật ngữ (dùng thống nhất trong mọi tài liệu/báo cáo):**
> - **DKT-LSTM = model nghiên cứu chính** của ML — nơi trình bày kiến trúc mạng, loss, optimizer, hyperparameter search.
> - **HLR = baseline so sánh, đồng thời là phương án production fallback** (nếu DKT-LSTM không đạt Model Acceptance Criteria — xem `04` — thì HLR trở thành model chạy production, nhưng **không đổi vai trò học thuật**: HLR vẫn được trình bày như baseline, không phải "đề tài chính").
> - **Scheduler = tầng rule-based**, không phải model học máy — chỉ nhận `recall_probability` (từ DKT **hoặc** HLR, tuỳ model nào đang production) rồi suy ra lịch ôn.
>
> Nếu hội đồng hỏi "đề tài của em là DKT hay HLR?", câu trả lời chuẩn: *"Đề tài nghiên cứu chính là DKT-LSTM; HLR là baseline cổ điển dùng để so sánh và làm phương án production dự phòng khi cần."*

##### A. Nhánh SRS — Knowledge Tracing / Spaced Repetition

| Nhánh | Model | Cấu hình | Mục đích |
|---|---|---|---|
| **A1 — Tự viết** | Deep Knowledge Tracing (`nn.LSTM` tự ráp pipeline) | `embedding_dim=64, hidden_size=128, num_layers=2, dropout=0.2` (~0.3–0.5M tham số — nhẹ, chạy được cả CPU) | Nội dung chính báo cáo ML |
| **A2 — Cổ điển/production** | Half-Life Regression (`numpy`/`scipy`, log-linear) | features: lịch sử đúng/sai, độ khó từ, thời gian trôi qua | Model nhẹ nhất, dễ giải thích hệ số, dùng làm fallback nếu DKT không kịp train/không load nổi trên free hosting |

##### B. Nhánh Chatbot — Sinh hội thoại + chấm điểm

| Nhánh | Model | Cấu hình | Mục đích |
|---|---|---|---|
| **B1 — Tự viết** | Transformer encoder–decoder (`nn.MultiheadAttention` hoặc viết attention tay) | Cấu hình chính: `d_model=256, n_heads=4, n_layers=3+3, d_ff=1024, dropout=0.1, vocab=16k` (~15–20M tham số). **Cấu hình fallback** (nếu 256/3+3 overfit trên tập hotel chỉ ~3.4k hội thoại — model capacity > dataset capacity): `d_model=128, n_heads=4, n_layers=2+2, d_ff=512` (~4–6M tham số). Quyết định dùng cấu hình nào dựa trên khoảng cách train/val loss ở tuần 4. | Nội dung chính báo cáo NLP (attention, embedding, seq2seq) |
| **B2 — Fine-tune (production, duy nhất)** | `t5-small` (60M) | `lr=3e-5..1e-4, batch 16–32, 3–5 epoch` **chỉ trên MultiWOZ domain `hotel`** | Model chạy thật trong app. **Không** làm thêm `DialoGPT-small` — bỏ để tránh nhân đôi công train không cần thiết (đã bám sát 1 model production duy nhất theo góp ý review). |
| **B3 — Bộ chấm phụ [Nice]** | `distilbert-base-uncased` fine-tune trên **CoLA** | classification head nhị phân (acceptable/unacceptable) | Sinh `grammatical_acceptability_score` cho câu của user — module phụ, **cắt đầu tiên** nếu thiếu thời gian (xem `00` mục 0.3). Đặt tên đúng "grammatical acceptability" thay vì "naturalness" vì đó chính xác là những gì CoLA đo được. |

Nhánh A1/B1 nên viết code inference **kèm giải thích công thức toán** (sigmoid cho DKT; softmax attention cho Transformer) — vừa chắc kiến thức vừa có cái để trình bày trước hội đồng.

#### Dataset

| Dataset | Quy mô | Dùng cho | Lưu ý |
|---|---|---|---|
| **ASSISTments 2009–2010 "skill-builder"** | ~525k tương tác, ~4.2k học sinh | Train/eval DKT-LSTM (chuẩn benchmark của paper Deep Knowledge Tracing) | Public, tải qua trang ASSISTments hoặc bản mirror trên Kaggle |
| **Duolingo Spaced Repetition (HLR) dataset** | ~13M dòng (có thể lấy mẫu 200k–1M) | Train/eval Half-Life Regression | Public (Settles & Meeder, 2016), đúng domain học từ vựng |
| Log nội bộ Lingora (`review_logs`) | 0 lúc bắt đầu, tăng dần theo thời gian dùng thử | Fine-tune/cá nhân hoá về sau | Ghi rõ trong báo cáo đây là hướng phát triển, không phải nguồn train chính ở giai đoạn nộp bài |
| **MultiWOZ 2.2** | ~10k hội thoại đa domain, **chỉ lọc domain `hotel`** (~3.4k hội thoại) | Train chính Chatbot | Public, có nhãn dialogue state → dùng tính Inform/Success rate |
| **DailyDialog** *(optional — [Nice])* | ~13k hội thoại đời thường | Train bổ sung nếu còn thời gian sau khi domain hotel đã ổn định | Public, có nhãn topic/emotion |
| **CoLA** *(optional — [Nice])* | ~10.6k câu gán nhãn acceptable/unacceptable | Fine-tune bộ chấm `grammatical_acceptability_score` | Public (thuộc bộ GLUE benchmark) |

Nguyên tắc: **val/test của Chatbot chia theo `dialogue_id`** (không theo turn) để tránh rò rỉ dữ liệu. Ghi rõ license từng dataset trong `model_card_srs.md` / `model_card_chatbot.md`.

#### Phần cứng & thời gian train (ước lượng)

| Model | GPU | Ước lượng |
|---|---|---|
| DKT-LSTM (A1) | CPU đủ dùng, hoặc T4 free | ~20–40 phút / lần train đầy đủ (model nhỏ) |
| Half-Life Regression (A2) | CPU | vài phút (log-linear, không cần GPU) |
| Transformer tự viết (B1) | T4 16GB (Colab free) | ~1.5–3h cho vài epoch trên tập MultiWOZ domain hotel (~3.4k hội thoại — nhỏ hơn hẳn khi chưa gộp DailyDialog/domain khác) |
| Fine-tune t5-small (B2) | T4 16GB | ~45–90 phút (3–5 epoch, chỉ domain hotel) |
| Fine-tune DistilBERT/CoLA (B3, Nice) | T4 16GB hoặc CPU | ~15–30 phút (dataset nhỏ, làm sau cùng nếu còn thời gian) |

Bắt buộc: `save_checkpoint(epoch)` + `resume_from_checkpoint` ngay từ đầu cho B1 (Colab ngắt session giữa chừng), dù các model khác nhẹ hơn nên rủi ro thấp hơn nhiều so với bản GEC trước.

### 3.5. Công cụ phụ trợ

Giữ nguyên bản gốc: Git + GitHub, Postman/Bruno, TensorBoard, DBeaver/Supabase Studio, ngrok, Figma, draw.io/PlantUML/Mermaid.

### 3.6. Phương án thay thế (khi công nghệ chính gặp vấn đề)

| Nếu... | Thay bằng | Chi phí đổi |
|---|---|---|
| Supabase free hết quota / project bị pause | Neon (Postgres) + tự viết auth JWT trong FastAPI | Cao — mất ~1 tuần, tránh |
| Render free ngủ 15 phút, load model chậm | Hugging Face Spaces (free) hoặc ngrok + localhost | Thấp |
| Model chatbot quá lớn để host free | Giảm `n_layers` Transformer tự viết xuống 2+2, hoặc chỉ deploy `t5-small` (đã là lựa chọn nhẹ nhất, không cần đổi sang model khác) | Thấp |
| Không đủ dữ liệu ASSISTments/MultiWOZ đúng license để nộp kèm | Chỉ nộp script tải + checksum, không nộp raw data trong repo | Thấp |
| Prisma trục trặc với pooler Supabase | Viết migration SQL tay, dùng `@supabase/supabase-js` ở Admin | Trung bình |
| Không kịp train xong 1 trong 2 nhánh AI | `MOCK_MODE=true` cho nhánh đó, nhánh còn lại vẫn chạy thật (xem `05`) | Rất thấp — đã dự phòng sẵn |
| DKT-LSTM không hội tụ tốt trên thời gian ngắn | HLR trở thành model **production** (đúng vai trò "baseline + fallback" đã chốt); DKT-LSTM vẫn là nội dung nghiên cứu chính, trình bày như thử nghiệm/ablation kèm giải thích vì sao chưa đạt | Thấp — vẫn còn nội dung để báo cáo ML |

### 3.7. Lệnh khởi tạo (chạy trong tuần 1)

```bash
## --- AI Server ---
mkdir lingora-ai && cd lingora-ai
python -m venv .venv && source .venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt
uvicorn app.main:app --reload            # → http://127.0.0.1:8000/docs

## --- Web Admin ---
npx create-next-app@latest lingora-admin --ts --tailwind --app --eslint
cd lingora-admin && npx prisma init
## dán schema.prisma từ file 01 vào, rồi:
npx prisma migrate dev --name init
npx prisma db seed

## --- Web Learner ---
npx create-next-app@latest lingora-web --ts --tailwind --app --eslint
cd lingora-web && npm i @supabase/supabase-js @supabase/ssr @tanstack/react-query
## npx shadcn@latest init

## --- Tải dataset (tuần 1, chạy trong notebook/Colab) ---
## ASSISTments: tải file skill_builder_data.csv (đăng ký trên trang ASSISTments hoặc mirror Kaggle)
## Duolingo HLR: tải settles.acl16.learning_traces.13m.csv.gz
## MultiWOZ 2.2 (bắt buộc, sẽ lọc domain "hotel" ngay sau khi tải) qua thư viện `datasets` của HuggingFace
python -c "from datasets import load_dataset; load_dataset('multi_woz_v22')"
## DailyDialog & CoLA: CHỈ tải khi đã xong domain hotel và còn thời gian (P2 — xem file 00 mục 0.3)
## python -c "from datasets import load_dataset; load_dataset('daily_dialog')"
## python -c "from datasets import load_dataset; load_dataset('glue', 'cola')"
```


## Approved repository-boundary normalization

The following M0 decision overrides only the legacy repository/directory naming block; it does not alter component responsibilities:

```text
lingora-web/
lingora-admin/
lingora-ai/
└── api/
```

No repository is scaffolded by M0.

## M0.5 approved architecture baseline

This section supersedes conflicting or incomplete migrated wording under `ADR-002`.

### Academic ownership and integration

- Product: **Lingora**.
- Project 1: originally titled **Xây dựng ứng dụng học ngoại ngữ trên nền tảng di động**; `ADR-008` (2026-08-17) supersedes that platform clause and Project 1 now owns **Web** learner flows, authentication, content consumption, exercises, progress, approved streak behavior, AI integration/fallback, web testing and Vercel deployment.
- ML owns DKT-LSTM, HLR, Scheduler, datasets, training, evaluation and SRS model selection.
- NLP owns preprocessing, tokenization/embedding, Transformer, T5-small, `hotel_booking`, evaluation and qualitative examples.
- A feature may trace across namespaces without transferring ownership. Web smart review calls the ML API; Web roleplay calls the NLP API.
- The AI Server remains stateless for primary learner data and must not directly own/write course, progress, review, chat-history, locale, gamification or exercise-result data.

### Locale boundary

- UI locale, content locale, learned language and native language are separate concepts.
- UI Must: `vi`, `en`; UI P2: `ja`.
- Initial learned language: `en`.
- UI fallback: requested supported locale, otherwise `vi`.
- Content fallback: requested locale → supported learner native locale → `vi` → `en` → explicit unavailable state.
- Web UI strings remain in i18n message catalogs (`vi`/`en`); translated learning content remains in `*_translations` tables.

### Security and Storage boundary

- Learners read published content and only their own learner records.
- Admin manages content, translations, scenarios and media.
- The AI Server has no direct primary-data write authority.
- Storage media is system/Admin-managed content. Learners may read media only through approved delivery for visible published content. Bucket names and path conventions are deferred to an approved implementation task.
- `record_review` is a security-definer transaction boundary and must derive caller identity from `auth.uid()`, verify ownership of the requested SRS card and reject non-owned/missing cards before any write.

### Runtime health boundary

- `/health/live` reports process liveness independently of model readiness.
- `/health/ready` reports per-capability SRS/NLP readiness and real/mock mode.
- Health checks support deployment diagnostics/restart behavior and are never a required keep-warm dependency.
- `/health` is not canonical unless retained later as a documented compatibility alias.

### Repository boundary

```text
lingora-web/
lingora-admin/
lingora-ai/
└── api/
```

Legacy `app + ml/srs + ml/chatbot` and `values-ja`-as-Must wording is superseded.

---

## 3. Assessment, Remediation & Readiness Architecture

> **Phân định kiến trúc cốt lõi (Core Architecture Addition — M-11):**
> Phần kiến trúc này chuẩn hóa tầng đánh giá chẩn đoán (Diagnostic Assessment), thích ứng năng lực (Adaptive Proficiency), bổ khuyết khái niệm (Remedial Learning) và đánh giá chuyển cấp (Level Readiness) dựa trên kết quả nghiên cứu chuyên gia ngôn ngữ (`E-EXP-01`..`E-EXP-07`), phục vụ đặc tả kỹ thuật cho `P1-FR-016`, `MVP-03`, `MVP-04`, `MVP-08`, `MVP-11` và `UC-03`, `UC-04`, `UC-07`. Chi tiết thiết kế logic và đặc tả quy tắc xem tại [`docs/phase-1-m2-1-domain-and-logical-data-foundation.md`](phase-1-m2-1-domain-and-logical-data-foundation.md) và [`docs/09-placement-and-jump-specification.md`](09-placement-and-jump-specification.md).

### 3.1. Stage-Adaptive Diagnostic Assessment Engine (FROZEN Architecture)
1. **Kiến trúc thích ứng 2 giai đoạn (Two-Stage Adaptive):**
   - **Giai đoạn 1 (Routing Stage):** Nhóm câu hỏi định tuyến ban đầu với độ khó trung bình nhằm ước lượng sơ bộ phân dải năng lực của học viên.
   - **Giai đoạn 2 (Targeted Stage):** Hệ thống phân nhánh học viên vào nhóm câu hỏi chuyên biệt theo độ khó mục tiêu, đo lường chi tiết 4 chiều năng lực cốt lõi.
   - **Quy mô & Thời lượng:** Dự kiến ~25–30 câu hỏi, thời gian hoàn thành $\le 15$ phút nhằm tránh mệt mỏi nhận thức (`E-EXP-07`).
2. **Bốn chiều năng lực cốt lõi (Core Dimensions):**
   - Đánh giá bao phủ 4 chiều độc lập: **Từ vựng (Vocabulary)**, **Ngữ pháp (Grammar)**, **Đọc hiểu (Reading)**, **Nghe hiểu (Listening)**.
   - Xuất kết quả dạng **Skill Profile đa chiều** (Spider/Radar Chart), tuyệt đối không gộp thành 1 điểm số trung bình phẳng duy nhất (`E-EXP-02`).
3. **Kiến trúc Đánh giá Đa ngôn ngữ 4 Tầng (Multi-Language Assessment Chain):**
   Hệ thống thiết lập chuỗi đánh giá tách lớp độc lập, tuyệt đối không hard-code các rẽ nhánh ngôn ngữ trong mã nguồn nghiệp vụ:
   $$\text{Common Assessment Engine} \longrightarrow \text{Language Config} \longrightarrow \text{Item Bank} \longrightarrow \text{Rubric}$$
   - **Tầng 1 — Common Assessment Engine (Động cơ Đánh giá Dùng chung):**
     Điều phối toàn bộ vòng đời phiên đánh giá (khởi tạo, định tuyến 2 giai đoạn Routing Stage $\rightarrow$ Targeted Stage, ghi nhận phản hồi, tính toán vector năng lực, xuất báo cáo đa chiều Spider/Radar chart). Engine này hoàn toàn bất biến theo ngôn ngữ.
     - **3 Mục đích Đánh giá Sư phạm Canonical (`AssessmentType`):**
       1. `DIAGNOSTIC`: Đánh giá chẩn đoán đầu vào để xác định hồ sơ năng lực ban đầu (`SkillProfile`) và gợi ý Starting Unit.
       2. `EXIT`: Đánh giá đầu ra cuối Unit / Khóa học nhằm thẩm định năng lực thực tế trước khi xác nhận chuyển cấp (`LevelReadiness`).
       3. `RE_EVALUATION`: Đánh giá kiểm tra lại định kỳ hoặc theo nhu cầu để làm mới `SkillProfile`.
      - **Chế độ Thực thi / Phân lớp (`DeliveryMode`):** `PLACEMENT` (chế độ phân lớp đầu vào đề cương), `JUMP` (chế độ kiểm tra vượt cấp bài học) và `STANDARD` (chế độ thực hiện đánh giá tiêu chuẩn) là các chế độ thực thi, không phải mục đích đánh giá độc lập.
   - **Tầng 2 — Language Config (Cấu hình Chuyên biệt Ngôn ngữ):**
     Lớp cấu hình định dạng JSON/tham số hóa cho từng ngôn ngữ mục tiêu:
      - **Tiếng Anh:** Khung tham chiếu CEFR A1–B2, dải kỹ năng ngữ pháp/từ vựng/đọc/nghe; config có room cho `contextual vocabulary`, `collocation`, `word family`, `connected speech` (`E-EXP-07`).
     - **Tiếng Trung:** Khung chuẩn HSK có hỗ trợ đa phiên bản (HSK 2.0 / HSK 3.0); cờ `hidePinyin: true` bắt buộc cho bài thi đọc hiểu để loại bỏ việc "đọc vẹt chữ cái Latinh" thay vì nhận diện Hán tự (`E-EXP-04`).
   - **Tầng 3 — Item Bank (Ngân hàng Học liệu Đánh giá):**
     Tập hợp câu hỏi/bài tập chuẩn hóa được phân loại theo `Concept` và độ khó, liên kết với từng ngôn ngữ cụ thể.
   - **Tầng 4 — Rubric (Thang đo & Tiêu chí Đánh giá Chuyên biệt):**
     Bộ quy tắc chấm điểm, phân loại lỗi sai và xác định trọng số năng lực riêng cho từng ngôn ngữ:
      - **Tiếng Anh:** Đánh giá trật tự từ, thì động từ, sự hòa hợp chủ-vị, giới từ, mạo từ, ngữ điệu câu; room cho `collocation`, `word family`, `connected speech`, `contextual vocabulary`.
      - **Tiếng Trung:** Đánh giá độ chính xác nét/bộ thủ Hán tự, thanh điệu, trật tự từ/lượng từ và hư từ, phân biệt cặp từ đồng âm, nghe hiểu tiếng Trung theo cấu hình ngôn ngữ.
   > **Lưu ý kiến trúc:** 4 tầng trên là **các lớp kiến trúc logic & cấu hình hệ thống**, KHÔNG yêu cầu tách thành 4 bảng vật lý riêng biệt trong cơ sở dữ liệu nếu mô hình quan hệ hiện tại đã hỗ trợ thông qua schema cấu hình và thực thể `Exercise`/`Concept`.
4. **Luồng khởi đầu linh hoạt (Flexible Entry Flow - Decision D4):**
   - Tách biệt rạch ròi giữa `selfReportedLevel` (cấp độ tự khai báo / Skip, trạng thái `UNVERIFIED`) và `verifiedProficiency` (đã qua kiểm tra chẩn đoán) để tránh sai lệch thích ứng (`E-EXP-01`).
   - Cập nhật hồ sơ trực tiếp; hộp thoại xác nhận chỉ là optional UX recommendation.

### 3.2. Remediation & Knowledge Gap Architecture
1. **Phát hiện lỗ hổng kiến thức (Knowledge Gap Detection):**
   - Mỗi câu hỏi bài tập liên kết với một điểm kiến thức chuẩn hóa (`Concept`).
   - Lỗi sai liên tiếp hoặc lặp lại kích hoạt tạo `KnowledgeGap` và hạ chỉ số `ConceptMastery`.
2. **Bổ khuyết theo khái niệm (Concept-Level Remediation):**
   - Khi kết thúc Unit, hệ thống đánh giá chuyển tiếp theo 3 trạng thái:
     - `ADVANCE`: Đạt chuẩn tiến bộ và thuần thục, mở khóa Unit kế tiếp.
     - `ADVANCE_WITH_SUPPORT`: Mở khóa Unit kế tiếp kèm bài tập bổ trợ nhẹ.
     - `REMEDIATE`: Kích hoạt mô-đun bổ khuyết `RemedialModule` để lấp lỗ hổng kiến thức trước khi tiếp tục.
   - **Nguyên tắc Remedial Learning (`E-EXP-06`):** Giao micro-lesson bổ khuyết nhắm trúng `KnowledgeGap` với ngữ cảnh mới, từ vựng mới, bài tập mới. **Tuyệt đối không hạ cấp độ tổng thể của học viên** và **không bắt học lại bài cũ đã hoàn thành**.
3. **Quản trị nội dung bổ khuyết (Content Governance):**
   - `RemedialModule` tuân thủ quy trình kiểm duyệt nội dung độc lập: có `creatorId`, `unitId`, `conceptId`, `status: ContentStatus`, `reviewerId`, `publishedAt`, `version`.

### 3.3. Progression, Mastery & Readiness Boundary Rules
Hệ thống Lingora tách biệt tuyệt đối 4 khái niệm tiến trình sư phạm độc lập (`E-EXP-03`):
1. **Learning Progress:** Tiến độ hoàn thành bài học tuyến tính theo đề cương (`UserProgress = COMPLETED`, `LearningProgress.completedContentRatio`).
2. **Skill Proficiency:** Năng lực ngôn ngữ đa chiều được kiểm chứng qua đánh giá chuẩn hóa (`SkillProfile`, `verifiedProficiency`).
3. **Concept Mastery:** Mức độ làm chủ từng điểm kiến thức cụ thể dựa trên bằng chứng bài tập thực tế (`ConceptMastery`).
4. **Level Readiness:** Đánh giá tổng hợp xem học viên đã sẵn sàng chuyển tiếp sang cấp độ / Unit tiếp theo hay chưa (`LevelReadiness`).

**Các bất biến kiến trúc (Architectural Invariants):**
- **Progress $\ne$ Proficiency:** Hoàn thành 100% đề cương bài học không tự động nâng cấp độ năng lực. Học viên cần làm bài Exit Assessment hoặc Re-evaluation Assessment để cập nhật `verifiedProficiency` mới.
- **Completed B1 $\ne$ B2:** Hoàn thành khóa học A1/B1 chỉ chứng minh học viên đã học hết nội dung A1/B1, không đồng nghĩa người học đã đạt năng lực đầu ra của cấp độ tiếp theo.
- **Proficiency $\ne$ Mastery:** Skill Profile 4 chiều không suy ra mastery từng concept.
- **Mastery $\ne$ LevelReadiness:** Mastery là input bằng chứng; readiness là quyết định tổng hợp (`ADVANCE` / `ADVANCE_WITH_SUPPORT` / `REMEDIATE`).
- **Completed B1 $\ne$ certification:** Hoàn thành nội dung B1 không phải chứng chỉ năng lực B1 khi chưa qua EXIT thẩm định.
- **Weak skill $\ne$ whole-level downgrade:** Kỹ năng yếu kích hoạt remediation/scaffolding có mục tiêu, không hạ toàn bộ level.
- **Remediation $\ne$ replay old lesson:** Micro-lesson dùng vocab/context/exercise mới củng cố concept cũ.
- **Jump $\ne$ learning completion:** `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` (`by_jump=true`), never `COMPLETED_BY_LEARNING`.
- **Self-reported $\ne$ verified:** `selfReportedLevel` luôn `UNVERIFIED` cho tới diagnostic.
- **Diagnostic $\ne$ Exit:** Entry xác định điểm vào; exit thẩm định chuyển cấp; cả hai đều sinh `AssessmentResult` bất biến.
- **Jump Provenance:** Khi người học vượt qua bài kiểm tra nhảy cấp (Jump Assessment $\ge 95\%$), các Unit bị bỏ qua được gán nhãn `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` (`by_jump = true`). Tuyệt đối không tương đương với `COMPLETED_BY_LEARNING`.

### 3.4. D3 Assessment & Learning Engine — Concise Cross-Reference (Design-Only)

> Canonical D3 detail: [`docs/phase-1-d3-assessment-learning-engine-design.md`](phase-1-d3-assessment-learning-engine-design.md) (sections A–Q). This section is a cross-reference and semantic alignment only; it changes no D2 structure, policy, or boundary.

- **Flow:** `Assessment → Skill Profile → Learning → Mastery/Knowledge Gap → Readiness → Recommendation/Remediation` (D3 §A). Every transition is evidenced (`AssessmentResult`, `SkillProfile` + provenance, mastery/gap evidence, typed `LevelReadiness` evidence, `Recommendation` input snapshot). Completion alone never advances level.
- **Axes:** `assessmentType` = `DIAGNOSTIC` / `EXIT` / `RE_EVALUATION` (purpose) is independent from `deliveryMode` = `PLACEMENT` / `JUMP` / `STANDARD` (execution). D2 field naming preserved; no merged enum; no `AssessmentSession`.
- **Separation:** `LearningProgress ≠ Proficiency ≠ Mastery ≠ LevelReadiness`; `Diagnostic ≠ Exit`; `selfReportedLevel (UNVERIFIED) ≠ verifiedProficiency`; `Completed B1 ≠ certification`; `Completed B1 ≠ Automatic B2`.
- **Remediation:** concept-targeted micro-lessons with fresh context/vocabulary/exercises; no whole-level downgrade; no forced replay of completed lessons (D3 §G).
- **Values:** diagnostic scale (~25–30 items, ≤15 min), scoring, adaptive/stopping/mastery/readiness/remediation policies, Anchor aggregation, CEFR→Unit mapping beyond D2 Mapping A, and HSK mapping/version remain `PROPOSED / PENDING VALIDATION / CONFIGURABLE`. English A1 Mapping A stays a D2 curriculum placement compatibility rule, not a D3 scoring policy.
- **Diagrams:** six D3 sources under `docs/plantuml/` (`assessment-lifecycle-d3`, `diagnostic-flow-d3`, `learning-progression-d3`, `mastery-knowledge-gap-d3`, `level-readiness-d3`, `recommendation-remediation-d3`) mirror D3 prose; no automatic completion-to-advance edge exists.

### 3.5. D4 Content & Curriculum Architecture — Concise Cross-Reference (Logical Design)

> Canonical D4 detail: [`docs/phase-1-d4-content-curriculum-design.md`](phase-1-d4-content-curriculum-design.md) (sections A–T). This section is an architectural cross-reference only; it introduces zero runtime code, zero schema/migration changes, and zero scoring algorithms.

- **Hierarchy vs Semantic Network:** Strict containment `Course → Unit → Lesson → Exercise`. Semantic reuse: `Concept` is an independent, reusable domain entity referenced across Lessons, Exercises, Assessment Items, `ConceptMastery`, and `KnowledgeGap`. `Concept` is NEVER a child entity of `Exercise` (D4 §D).
- **Unit Publication Visibility:** A `Unit` is visible in the published catalog if and only if 4/4 child Lessons hold status `PUBLISHED`. Individual progression remains governed by Placement/Jump/Prerequisites. Invariant: `Catalog Publication Status ≠ Learner Unlock Status ≠ Learning Completion ≠ Proficiency ≠ Mastery`.
- **5 Canonical Logical Content Types:** `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR` (D4 §H). Explicitly categorized as D4 logical/target authoring models (Applied DB currently supports `MCQ`, `FILL_BLANK`, `REORDER`; `LISTENING` and `GRAMMAR` are Target Schema specifications). Zero `MATCHING` canonical; no `AssessmentSession`, `Exam`, or `QuestionBank` ghost entities. `GRAMMAR` exercise payload ≠ transient GEC AI service.
- **Reading Semantic Boundary:** `Reading` = D3 skill/dimension in assessment engine and `SkillProfile`. `READING` compound exercise payload = logical/design candidate (`PROPOSED / DESIGN GAP` per D2 §6.11). Physical database enum/schema is NOT DECIDED / OUT OF SCOPE.
- **Remedial Content Model:** `RemedialModule` is governed micro-content (published-only delivery) targeting specific `Concept` deficits identified by `KnowledgeGap`. Delivers fresh context, fresh vocabulary, and fresh exercises. Invariants: no whole-level downgrade, no forced replay of completed lessons, no reuse of old exercise payloads, no separate runtime `Remediation` entity (D4 §K).
- **Multi-Language 4-Tier Chain:** `Common Content Model → Language Config → Content/Item Bank → Language-specific Rules`. Zero hardcoded language branching in engine. English config includes room for collocations, word families, connected speech; Chinese config enforces `hidePinyin: true` default for Hanzi reading assessment (`E-EXP-04`); HSK framework versioning remains `OPEN / PENDING` (D4 §M).
- **Diagrams:** Six D4 visual specifications in `docs/plantuml/` (`curriculum-architecture-d4`, `lesson-blueprint-d4`, `concept-content-evidence-d4`, `item-bank-authoring-d4`, `remedial-content-d4`, `multilanguage-content-d4`).

### 3.6. M2.2 System Behavior, Use Cases & State Machines — Concise Cross-Reference (Logical Design)

> Canonical M2.2 detail: [`docs/phase-1-m2-2-behavior-uc-activity-state.md`](phase-1-m2-2-behavior-uc-activity-state.md) (sections 1–16). This section is an architectural cross-reference only; it introduces zero runtime code, zero schema/migration changes, and zero scoring algorithms.

- **15 Canonical Use Cases:** `UC-01` through `UC-15` covering Core Learning (`UC-01` Auth/Session, `UC-02` Goals & Time, `UC-03` Placement Test / Diagnostic Assessment, `UC-04` Curriculum Browse & Jump, `UC-05` Lesson Exercise & Retry, `UC-06` SRS Review, `UC-07` Progress & Streak), Content Governance (`UC-08` Draft Authoring, `UC-09` Moderation, `UC-10` Publishing & Archival), Administration (`UC-11` Accounts/Roles, `UC-12` Analytics/Reports, `UC-13` Audit Logs, `UC-14` Support Tickets), and Optional/Future Module (`UC-15` Cohorts & Groups). Zero `UC-16/17/18`.
- **15 Behavioral Families:** `BF-01` through `BF-15` aligned with `docs/06-system-analysis.md` §5. `BF-08` covers Placement Test; `BF-11` covers Conditional Jump; `BF-14` encapsulates P1-FR-007 scenario writing/GEC. Zero `BF-16`.
- **Content Lifecycle & SoD:** 6 states (`DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`). Separation of Duties strictly enforced: Creator authors/submits; Moderator reviews/approves or requests changes; Organizational Manager publishes approved batches; Administrator emergency publish permitted ONLY on `APPROVED` content with reason and `AuditLog`. `ARCHIVED` is terminal in Core; mutations require Clone-to-Draft v2 (`supersedesId`).
- **Learner Progression & Jump Invariants:** 4 progression states (`LOCKED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED_BY_JUMP`). Successful Jump Assessment ($\ge 95\%$) marks bypassed units/lessons as `SKIPPED_BY_JUMP` (`by_jump=true`). Zero `COMPLETED_BY_JUMP`. Zero CEFR certification. Failed Jump triggers a 24-hour cooldown lock.
- **Dual Assessment Entry Pathways:** Branch A (Self-Report / Skip) records `selfReportedLevel` as `UNVERIFIED` with default/provisional starting point; explicitly produces NO `AssessmentResult`, NO `SkillProfile`, and NO `verifiedProficiency`. Branch B (Diagnostic Assessment) administers adaptive test (`~25–30 items, PROPOSED / PENDING VALIDATION`), persists immutable `AssessmentResult`, generates `SkillProfile`, assigns `verifiedProficiency = verified`, and routes via English A1 Mapping A raw score bands (0–30 range: 0–7: U1, 8–12: U2, 13–17: U3, 18–22: U4, 23–26: U5, 27–30: U6).
- **Exercise Execution & Controlled Retry:** Policy D7: `allowance = max(1, floor(N * 0.10))`, 70% credit score on correct retry attempt. Zero 80% retry floor. Lesson completion is owned by `UC-05` / `BF-10`.
- **SRS Review & Daily Streak Engine:** Policy B review intervals `[1, 3, 7, 14, 30]` days; failure resets interval strictly to Stage 1 (1 day). Atomic execution via `record_review` RPC. Daily streak evaluated lazily upon qualifying activity across calendar date boundaries in `Asia/Ho_Chi_Minh` timezone (`lastQualifyingActivityDate`); missed day resets streak strictly to 1 (never 0; Streak Freeze and Recovery Power-Up are DEFERRED; no freeze behavior exists in Core).
- **Remediation & Scaffolding:** Concept-targeted micro-lessons (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`). No whole-level downgrade; no forced replay of completed lessons.
- **Logical Screen-Flow Inventory:** 14 Learner screen flows (`SCR-L-01` to `SCR-L-14`) and 11 Authoring/Ops screen flows (`SCR-A-01` to `SCR-A-11`).
- **Diagrams:** Seven M2.2 visual specifications under `docs/plantuml/` (`uc-overview-m22.puml`, `activity-learner-flow-m22.puml`, `activity-authoring-flow-m22.puml`, `state-progression-readiness-m22.puml`, `placement-jump-m22.puml`, `srs-flow-m22.puml`, `screen-flow-inventory-m22.puml`).

### 3.7. M2.3 Sequence Interactions, API Contracts & Service Boundaries — Concise Cross-Reference (Logical Design)

> Canonical M2.3 detail: [`docs/phase-1-m2-3-sequence-api-service-boundary.md`](phase-1-m2-3-sequence-api-service-boundary.md) (sections 1–11). This section is an architectural cross-reference only; it introduces zero runtime code, zero schema/migration changes, and zero scoring algorithms.

- **Sequence Interaction Suite (Artifact #11):** 10 canonical sequence specifications (`SEQ-01` to `SEQ-10`) covering Auth & Session (`SEQ-01`), Learner Onboarding & Entry Choice (`SEQ-02`), Diagnostic Placement (`SEQ-03`), Conditional Jump (`SEQ-04`), Lesson Exercise & Controlled Retry (`SEQ-05`), SRS Review (`SEQ-06`), Progress & Daily Streak (`SEQ-07`), Content Lifecycle & SoD (`SEQ-08`), Admin & Security Audit (`SEQ-09`), and Scenario Free-Writing with GEC (`SEQ-10`).
- **Surface & API Boundary Classification (Artifact #12):** 10 surfaces classified into `CURRENT` (GoTrue Auth, PostgREST reads, RPC `record_review`, Storage, AI Health), `TARGET` (GEC `POST /v1/gec/correct`, Route Handler Proxy, Admin/Prisma, Application Services), `COMPATIBILITY GAP` (AI legacy `/v1/srs/schedule`, `/v1/chat/*`), and `FUTURE` (B2B Cohorts). `docs/03-api-contract.md` preserved 100% byte-identical; gaps recorded in M2.3 API Gap Register.
- **Service Interaction & 4-Layer Responsibility Model (Artifact #15):** Presentation Layer (Next.js Client Components), Application/BFF Layer (Route Handlers, session validation, 8.0s hard timeout, circuit breaker fallback), Domain Services Layer (`PlacementService`, `JumpAssessmentService`, `LessonExecutionService`, `SrsScheduler`, `StreakEvaluatorService`, `ContentLifecycleService`), and Persistence/External Layer (PostgreSQL with RLS, atomic RPC, GoTrue, Storage, stateless FastAPI AI Server, append-only `AuditLog`).
- **Stateless AI Non-Ownership Invariant (ADR-014):** Supporting AI service (`lingora-ai`) is strictly stateless and invoked exclusively via Next.js Route Handler Proxy (`/api/ai/gec`) with 8.0s timeout and graceful fallback. AI Server owns solely transient `corrected_text` and derived edit spans; AI owns ZERO learner progression, mastery, proficiency, streak, or completion.
- **Single State Ownership Matrix:** Authoritative write owners strictly enforced: Lesson completion (`LessonExecutionService` under `UC-05`/`BF-10`), `LearningProgress` (`LearnerProfileService`), `SkillProfile` (owned by Learner domain, derived by `PlacementService`), Streak (`StreakEvaluatorService` on `Profile.streak_count`), Starting Unit (candidate `starting_unit` on `Profile` [DD-06 / OPEN DESIGN]), Jump provenance (`JumpAssessmentService`), `AssessmentResult` (`PlacementService`/`JumpAssessmentService` as immutable evidence without persisted score column), SRS review history (`review_logs` via atomic RPC `record_review`), Audit events (emitting boundaries into append-only `AuditLog`).
- **Conceptual Idempotency & Atomicity:** Strict atomicity required for RPC `record_review(p_srs_card_id, p_is_correct, p_recall_probability, p_recommended_interval_days)`, content publishing (with SoD verification `auth.uid() != Lesson.creatorId`), and clone-to-draft v2 creation. Anti-double-submit protection required for lesson retry attempts (transient session data, zero `ExerciseAttempt` table) and diagnostic/jump submissions.
- **Diagrams:** 12 M2.3 visual specifications under `docs/plantuml/`: 10 sequence diagrams (`sequence-auth-session-m23.puml` through `sequence-gec-interaction-m23.puml`), service boundary model (`service-boundary-m23.puml`), and layer responsibility model (`layer-responsibility-m23.puml`).

### 3.8. M2.4 Component Architecture & Security Responsibility — Concise Cross-Reference (Logical Design)

> Canonical M2.4 detail: [`docs/phase-1-m2-4-architecture-security.md`](phase-1-m2-4-architecture-security.md) (sections 1–15). This section is an architectural cross-reference only; it introduces zero runtime code, zero schema/migration changes, zero RLS SQL, and zero live infrastructure provisioning.

- **Component Architecture & 5-Layer Hierarchy (Artifact #13):** Strict top-down one-way dependency (`Presentation → Application/BFF → Domain Services → Persistence/Infrastructure → External Providers`) without cycles. Component inventory covers 19 logical components: Learner/Admin Presentation (`COMP-PRES-01/02`), Learner/Admin BFF Orchestrators (`COMP-APP-01/02`), 8 Domain Services (`COMP-DOM-01..08`), 5 Persistence/Infrastructure engines (`COMP-INFRA-01..05`), and 2 External Providers (`COMP-EXT-01/02`).
- **Deployment & Logical Security Zones (Artifact #14):** 5 logical runtime/security zones modeled without infrastructure lock-in: Zone 1 (Untrusted Public Client Zone), Zone 2 (Trusted Application Server Zone / Vercel), Zone 3 (Managed Database & Storage Zone / Supabase), Zone 4 (Isolated AI Compute Zone / FastAPI on Render/HF Spaces), and Zone 5 (Privileged Infrastructure Operations Zone / CLI tooling). Strict status labeling: `CURRENT_APPLIED` vs `TARGET_DESIGN` vs `FUTURE_EXTENSION`. Explicit invariant: target runtime is NOT claimed ready or deployed.
- **Secret Boundary & Credential Isolation:** Learner Web runtime (`lingora-web`) is 100% isolated from `SUPABASE_SERVICE_ROLE_KEY`; clients never receive private keys or raw tokens; sessions managed exclusively via `httpOnly`, `SameSite=Lax` cookies; AI Server receives forwarded user JWT via Next.js proxy and verifies via public JWKS (ES256) with zero database connection strings.
- **Security Responsibility Matrix (Artifact #16):** Single authoritative 6-boundary matrix (`Learner Web`, `Admin Web`, `Supabase RLS`, `Privileged Service Role`, `AI Server`, `Audit`) governing 15 sensitive operations (`OP-01`..`15`). Application authorization checks and Database RLS policies are both mandatory; app checks do not replace RLS; privileged service role scoped strictly to maintenance/seed/migrations (`N/A — privileged service-role path`).
- **Separation of Duties (SoD) & Negative Denial Paths:** Creator self-approval denied (`403 SOD_VIOLATION_SELF_REVIEW`), Moderator publishing denied (`403 SOD_VIOLATION_MODERATOR_PUBLISH`), learner cross-tenant data access denied by RLS, direct transition `IN_REVIEW → PUBLISHED` strictly forbidden; Administrator emergency publish permitted ONLY on already `APPROVED` content with mandatory justification and `AuditLog` emission (ADR-020).
- **Decision DD-03 (Audit Architecture):** 3-tier verdict: Locked behavior (immutable, append-only, 4 core fields), Design specification closed in M2.4 (event catalog of 11 sensitive event codes, actor/target typing, UTC ISO 8601 timestamps), and Open physical representation (metadata JSONB shape, trigger vs app emission, IP/device fields, retention values stay `OPEN`).
- **Decision DD-10 (Role Enforcement Split):** 3-tier verdict: Locked behavior (6 canonical roles, DB-level RLS mandatory, app never replaces RLS), Design specification closed in M2.4 (CURRENT 2-role vs TARGET 6-role mapping, app check vs RLS split, backward compatibility guarantee), and Open physical representation (migration DDL and SQL scripts stay `OPEN`).
- **Diagrams:** Three M2.4 visual specifications under `docs/plantuml/`: Component Architecture (`component-architecture-m24.puml`), Deployment & Security Boundary (`deployment-boundary-m24.puml`), and Security Responsibility Matrix (`security-matrix-m24.puml`).

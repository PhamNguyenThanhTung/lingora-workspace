# 01 - Lingora System Architecture

> **Canonical status:** M0 migration baseline. Source wording is preserved; product/repository naming and Markdown nesting were normalized only where explicitly approved.
>
> **Source coverage:** legacy architecture sections 1.1â€“1.2, 1.5, 1.7â€“1.8 and legacy tech stack 3.1â€“3.7. Data-model sections are in 4-data-model.md; API section is in 3-api-contract.md.

## Migrated source: system architecture

### 1.1. Sơ đồ tổng thể

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  Mobile App (Android)   │        │  Web Admin (Next.js)     │
│  Java · MVVM · Retrofit │        │  TS · Tailwind · Prisma  │
│  Người dùng cuối        │        │  Quản trị nội dung       │
└────────┬───────┬────────┘        └───────┬──────────┬───────┘
         │       │                         │          │
    (1) Auth  (2) Data              (2') Data    (3) Storage
    JWT       PostgREST/RPC         Prisma+TCP   upload audio
         │       │                         │          │
         ▼       ▼                         ▼          ▼
┌───────────────────────────────────────────────────────────────┐
│                      SUPABASE (BaaS)                          │
│  Auth (GoTrue) · PostgreSQL 15 + RLS · Storage · REST         │
│  Lưu: review_logs, user_vocab_srs, chat_sessions/messages     │
└───────────────────────────────────────────────────────────────┘
         ▲                                        ▲
    (4) verify JWT (HS256)              (5) ghi log request
         │                                        │
┌────────┴────────────────────────────────────────┴─────────────┐
│                   AI Server (FastAPI · Python)                │
│  POST /v1/srs/schedule   → DKT-LSTM / Half-Life Regression    │
│  POST /v1/chat/roleplay  → Transformer seq2seq / T5-small     │
│  MOCK_MODE=true  →  trả kết quả hardcode (phương án dự phòng) │
└───────────────────────────────────────────────────────────────┘
         ▲
    (6) HTTPS + Bearer JWT
         │
   Mobile App (màn "Ôn tập thông minh" · màn "Luyện hội thoại")
```

**Điểm cần nhớ:** Android **không** đi qua AI Server để lấy dữ liệu bài học/từ vựng gốc — dữ liệu đó luôn lấy trực tiếp từ Supabase. AI Server chỉ được gọi cho 2 việc: (a) tính lịch ôn tập gợi ý, (b) sinh phản hồi + chấm điểm hội thoại. Nhờ vậy AI Server chết cũng không làm sập luồng học chính, chỉ mất phần "gợi ý" (SRS rơi về lịch mặc định kiểu SM-2, chatbot báo lỗi tạm thời).

### 1.2. Trách nhiệm từng thành phần

| Thành phần | Chịu trách nhiệm | KHÔNG chịu trách nhiệm |
|---|---|---|
| Android App | Hiển thị, cache offline, chấm bài tập phía client, gọi API, gửi review log lên Supabase | Không chứa business rule quan trọng, không giữ `service_role` key |
| Web Admin | CRUD nội dung (Course/Lesson/Vocabulary/Exercise/Chat Scenario), xem thống kê, quản lý user, migrate DB (Prisma) | Không phục vụ user cuối |
| Supabase | Lưu dữ liệu (kể cả `review_logs`, `chat_messages`), xác thực, phân quyền (RLS), lưu file audio/ảnh | Không chạy suy luận AI |
| AI Server | Suy luận DKT/HLR (SRS), suy luận seq2seq (Chatbot), log request, chế độ mock | Không phải nơi lưu dữ liệu chính (chỉ nhận history trong request, không cần đọc/ghi DB Supabase trực tiếp) |

---

---

### 1.5. Luồng xác thực (Auth)

Giữ nguyên bản gốc:

```
Android                    Supabase GoTrue              FastAPI
   │  POST /auth/v1/token?grant_type=password
   ├──────────────────────────►│
   │  {access_token(JWT,1h), refresh_token}
   │◄──────────────────────────┤
   │  lưu vào EncryptedSharedPreferences
   │
   │  GET /rest/v1/rpc/get_lessons   Authorization: Bearer <JWT>
   ├──────────────────────────►│  (RLS đọc auth.uid() từ JWT)
   │
   │  POST /v1/srs/schedule | /v1/chat/roleplay   Authorization: Bearer <JWT>
   ├───────────────────────────────────────────────────►│
   │                                 verify HS256 bằng SUPABASE_JWT_SECRET
   │◄───────────────────────────────────────────────────┤
   │
   │  401 → POST /auth/v1/token?grant_type=refresh_token → retry 1 lần
```

---

---

### 1.7. Cấu trúc 3 repository

```
lingora-android/
├─ app/src/main/java/com/pnttung/lingora/
│  ├─ data/            remote/ (Retrofit service, DTO) · local/ (Room) · repository/
│  ├─ domain/model/     entity thuần Java
│  ├─ ui/               auth/ · home/ · lesson/ · exercise/ · srs/ · chat/ · profile/
│  ├─ util/             AuthInterceptor, TokenAuthenticator
│  └─ LingoraApp.java
└─ app/src/main/res/values{,-vi,-ja}/strings.xml

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
| "Thêm tiếng Nhật thì sao?" | Chỉ `INSERT` vào `languages` + `*_translations`, thêm `values-ja/strings.xml`. Không sửa schema, không sửa code. |
| "1000 user cùng lúc?" | Supabase connection pooling (pgBouncer 6543); Android cache Room; AI Server stateless (không giữ session) → scale ngang; đã có index trên `(user_id, next_review_at)`. |
| "AI Server sập?" | Client timeout 8s → **SRS** rơi về `get_due_srs_cards` (lịch mặc định kiểu SM-2 dựa trên `ease_factor`); **Chatbot** hiển thị "thử lại sau". Có `MOCK_MODE`. |
| "Thêm kịch bản roleplay mới?" | Chỉ thêm 1 dòng `chat_scenarios` + bản dịch qua Admin, không cần deploy lại AI Server (prompt/scenario nạp động). |
| "Thêm loại bài tập mới?" | `Exercise.payload` là JSONB + enum `ExerciseType` → thêm 1 giá trị enum + 1 Fragment, không migrate bảng. |
| "Bảo mật dữ liệu user?" | RLS ở tầng DB (không tin client), JWT hết hạn 1h, token mã hoá trên máy, `service_role` key chỉ nằm ở server (Admin), AI Server không cần `service_role` vì nhận history qua request body. |
| "Vì sao AI Server không tự đọc DB để tính SRS?" | Giữ AI Server **stateless & không có quyền ghi dữ liệu người dùng** → giảm bề mặt tấn công, dễ scale ngang, dễ demo local (không cần kết nối Supabase khi test model). |

## Migrated source: technology stack

## 03 — Tech Stack chi tiết (bản v3 — đã siết scope Chatbot theo review)

> **Cập nhật so với v2:** bỏ nhánh `DialoGPT-small` (chỉ giữ `t5-small` làm model production duy nhất); Chatbot chỉ train domain `hotel` trước (MultiWOZ), DailyDialog chuyển thành tuỳ chọn; requirements gọn hơn theo đó.

### 3.1. Bảng tổng hợp

| Tầng | Công nghệ | Phiên bản đề xuất | Vì sao chọn |
|---|---|---|---|
| Mobile | Android Studio + **Java 17** | AGP 8.7, Gradle 8.9, `minSdk 24`, `targetSdk 35` | Đúng yêu cầu môn học; `minSdk 24` phủ ~97% máy |
| Mobile arch | MVVM (ViewModel + LiveData) | androidx.lifecycle 2.8.x | Có Class Diagram đẹp cho báo cáo KNPM |
| Web Admin | **Next.js** App Router + TypeScript | Next 15, TS 5.x | Deploy Vercel 1 click, có server-side để giữ secret |
| CSS | **Tailwind CSS** + shadcn/ui | Tailwind 4 | Dựng bảng/form quản trị rất nhanh |
| Backend/DB | **Supabase** | Postgres 15 + GoTrue + Storage | Có sẵn Auth + REST + RLS → tiết kiệm ~2 tuần viết backend |
| ORM/Migration | **Prisma** | 6.x | Schema-as-code, sinh ERD tự động, migration có version |
| AI core | **Python + PyTorch** | Python 3.11, PyTorch 2.4+ | Chuẩn nghiên cứu; tự viết được kiến trúc mạng (DKT-LSTM, Transformer) |
| AI API | **FastAPI** | 0.115+, Pydantic v2, Uvicorn | Tự sinh Swagger `/docs`, validate schema chặt |
| Hosting | Vercel (web) · Render/HF Spaces (AI) · APK (mobile) | free tier | Miễn phí, đủ demo |

Không đổi so với bản v1 — điểm khác biệt duy nhất nằm ở mục **3.4 (AI Server & ML)**.

### 3.2. Android — thư viện & lý do

```gradle
// Networking
implementation 'com.squareup.retrofit2:retrofit:2.11.0'
implementation 'com.squareup.retrofit2:converter-gson:2.11.0'
implementation 'com.squareup.okhttp3:logging-interceptor:4.12.0'

// Kiến trúc
implementation 'androidx.lifecycle:lifecycle-viewmodel:2.8.7'
implementation 'androidx.lifecycle:lifecycle-livedata:2.8.7'
implementation 'androidx.navigation:navigation-fragment:2.8.5'

// Cache offline
implementation 'androidx.room:room-runtime:2.6.1'
annotationProcessor 'androidx.room:room-compiler:2.6.1'

// UI / media
implementation 'com.google.android.material:material:1.12.0'
implementation 'com.github.bumptech.glide:glide:4.16.0'
implementation 'androidx.media3:media3-exoplayer:1.4.1'   // phát audio từ vựng

// Bảo mật token
implementation 'androidx.security:security-crypto:1.1.0-alpha06'

// Test
testImplementation 'junit:junit:4.13.2'
testImplementation 'org.mockito:mockito-core:5.14.2'
androidTestImplementation 'androidx.test.espresso:espresso-core:3.6.1'
```

**Lưu ý quan trọng (giữ nguyên bản gốc):** Supabase **không có SDK Java chính thức** — dùng Retrofit gọi thẳng REST API:
- Auth: `POST {SUPABASE_URL}/auth/v1/token?grant_type=password`, header `apikey: <anon_key>`
- Data: `POST {SUPABASE_URL}/rest/v1/rpc/get_lessons`, header `apikey` + `Authorization: Bearer <jwt>`
- Storage: tải file qua URL public

Màn hình mới cần thêm Fragment/ViewModel: `SrsReviewFragment` (gọi `/v1/srs/schedule` qua `AiService` Retrofit riêng), `RoleplayChatFragment` (UI dạng bong bóng chat, gọi `/v1/chat/roleplay`).

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

## --- Android ---
## Android Studio → New Project → Empty Views Activity (Java)
## package: com.pnttung.lingora · minSdk 24

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

`	ext
lingora-android/
lingora-admin/
lingora-ai/
â”œâ”€â”€ api/
â”œâ”€â”€ ml_srs/
â””â”€â”€ nlp_chatbot/
`

No repository is scaffolded by M0.

## M0.5 approved architecture baseline

This section supersedes conflicting or incomplete migrated wording under `ADR-002`.

### Academic ownership and integration

- Product: **Lingora**.
- Project 1: **Xây dựng ứng dụng học ngoại ngữ trên nền tảng di động**. It owns Android learner flows, authentication, content consumption, exercises, progress, approved streak behavior, AI integration/fallback, mobile testing and APK deployment.
- ML owns DKT-LSTM, HLR, Scheduler, datasets, training, evaluation and SRS model selection.
- NLP owns preprocessing, tokenization/embedding, Transformer, T5-small, `hotel_booking`, evaluation and qualitative examples.
- A feature may trace across namespaces without transferring ownership. Android smart review calls the ML API; Android roleplay calls the NLP API.
- The AI Server remains stateless for primary learner data and must not directly own/write course, progress, review, chat-history, locale, gamification or exercise-result data.

### Locale boundary

- UI locale, content locale, learned language and native language are separate concepts.
- UI Must: `vi`, `en`; UI P2: `ja`.
- Initial learned language: `en`.
- UI fallback: requested supported locale, otherwise `vi`.
- Content fallback: requested locale → supported learner native locale → `vi` → `en` → explicit unavailable state.
- Android UI strings remain in resources; translated learning content remains in `*_translations` tables.

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
lingora-android/
lingora-admin/
lingora-ai/
├── api/
├── ml_srs/
└── nlp_chatbot/
```

Legacy `app + ml/srs + ml/chatbot` and `values-ja`-as-Must wording is superseded.

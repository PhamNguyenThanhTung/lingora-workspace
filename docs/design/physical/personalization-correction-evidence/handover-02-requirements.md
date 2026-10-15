# 02 - Lingora Requirements and Report Scope

> **Classification: MIXED HISTORICAL REQUIREMENTS AND PROPOSED ENGINEERING REQUIREMENTS; NOT A GLOBAL APPROVAL RECORD.** Validate each requirement against its controlling ADR and current use case before implementation; implementation is not authorized by this document.
> **Current business/security authority:** ADR-034 approves exactly three business roles (`Admin`, `Teacher`, `Learner`), one role per account, and role responsibilities. ADR-035 approves logical identity/authorization, content lifecycle, assessment secrecy, SRS trust, and audit policies only. Six-role content below is historical and superseded only where it conflicts with current business/logical policy.
> **Current behavioral authority:** `docs/use-case-specifications.md`, controlled by ADR-030 through ADR-036 and the SRS interaction clarification in ADR-041, each within its explicit scope. ADR-036 is the MVP addendum for lesson attempts, SRS enrollment, curriculum availability, assessment packages/purposes, and Admin Learner support; ADR-041 controls learner-visible SRS interaction and assessment-session boundaries. P0-D07 is resolved only as a logical product/security target; physical mapping and live state remain deferred. `plans/master-implementation-and-report-plan.md` is a TARGET roadmap, not implementation authority.
> **Platform evidence:** Web (`lingora-web`) learner-auth foundation and Admin Prisma/migration artifacts exist; this document does not establish that other behaviors are implemented.
> **Legacy Phase 2 scope values:** Mapping A, fixed assessment values, Jump, and physical role/RLS details are not approved by this header; apply ADR-032/033/035. Logical content states and security behavior follow ADR-035; physical status/schema representation remains deferred.
> **AI Scope Status in Phase 2:** AI / ML / GEC is retained strictly for historical context and canonical traceability (`ML-GEC-*`, `P1-FR-007`); it is **OUT OF CURRENT PHASE 2 IMPLEMENTATION, TESTING, DEMO, AND ACCEPTANCE**.
> **Sections below marked `[SUPERSEDED / HISTORICAL REFERENCE]` are preserved solely for academic report evolution and traceability.**

---

## Current MVP Product Baseline Addendum — ADR-036 (2026-10-10)

This addendum controls current MVP product behavior where older requirement prose conflicts. It records PO-approved product rules only; it does not authorize application implementation or physical database design. Historical sections below remain unchanged evidence.

### Lesson attempts and performance

A lesson has `N` required core exercises as configured for that lesson. Never treat a sample question count as a platform invariant. Each core exercise is answered once; a first correct response contributes `1.0`. A first incorrect response gets formative feedback and is queued at the end for exactly one retry. A correct retry contributes `0.5`; an incorrect retry contributes `0`. For `K` first-incorrect exercises, a completed attempt's performance is the sum of contributions divided by `N + K`, counting every actual response. Completion requires validly processing every core exercise and any required retry, then successfully recording the attempt; correctness and score do not gate completion. An unfinished attempt has no completion or completed performance. Redo creates a new attempt without increasing completed-lesson count. Latest completed performance is primary; best may be secondary. Progress is based on completion, never score.

### Vocabulary enrollment and SRS

Completing a lesson enrolls its core vocabulary. Optional vocabulary is enrolled only when the learner chooses “Add to review.” One learner has one logical card per Vocabulary identity; later appearances reuse its stage and due date. New cards begin at Policy B stage 1 and are first due after one day. Remembered cards advance through `1 → 3 → 7 → 14 → 30` days and recur every 30 days at the final stage. A forgotten card resets to stage 1/one day and can return to the end of its current session once. That reinforcement does not create a second scheduling operation or change the long-term schedule again. The server remains the scheduling authority under ADR-035.

### SRS interaction and session boundary — ADR-041 (2026-10-12)

The learner does not browse or preview a due/overdue vocabulary list, review stages, or the exact cards that will appear. `due_at` and due/overdue detection are internal scheduling state. During an ordinary learning/practice session, the system may select due/overdue cards and append or interleave review questions after or alongside core work; the learner sees only the selected question/prompt and answer interaction. A dedicated review session is optional; if offered, the system selects eligible items after the learner starts it. A due/overdue card remains eligible for a later suitable session until a valid review is recorded. Learners provide a valid answer/recall outcome and may optionally use “Add to Review” for eligible optional vocabulary; they do not select cards from the due queue or control stage, interval, or due date.

SRS questions may appear in ordinary practice/checkpoints, but must not be dynamically inserted into a scored immutable Placement or Level-up Assessment Version. A separate review block, if presented near an assessment, remains outside the Assessment Version, score, and pass/fail decision. ADR-041 changes only learner-facing interaction/session presentation; Policy B (`1 → 3 → 7 → 14 → 30` days, then every 30 days), core-vocabulary auto-enrollment after valid lesson completion, optional enrollment, one logical Learner+Vocabulary card, server-authoritative scheduling, operation idempotency, and at-most-once same-session reinforcement remain unchanged.

Physical-design synchronization note: Physical design must consume the updated SRS interaction semantics; due_at remains persisted/internal, but learner-facing due-list browsing is not an MVP capability. The physical-design package was not modified here.

### Curriculum availability and history

The learner follows the active curriculum. Unpublished or otherwise unavailable future content may appear as `LOCKED / COMING SOON` and is excluded from the eligible required-lesson progress denominator. A required lesson that is published and remains in the active curriculum stays eligible in that denominator even when normal sequential progression has not unlocked it for this learner. A lock icon can describe either unavailable content or current access; the UI and model distinguish those meanings. A withdrawn, uncompleted lesson is unavailable and is not counted as an uncompleted requirement in current eligible progress. Valid completion, performance, assessment result, and history are preserved through withdrawal, replacement, or curriculum update. Learners who completed a prior revision are not forced to repeat the replacement; learners who have not completed it follow the active revision. A future relearning/migration rule requires separate approval. A next level without available content is shown as locked/coming soon with an explanation that all currently available content is complete.

### Assessment package and version

Admin defines the assessment blueprint and requirement: language, framework, level/transition, purpose, curriculum/topic coverage, skill or knowledge coverage, item requirements/distribution, and necessary configuration. Teacher authors actual items within assigned work. Before submit/publication, the system checks coverage, required items/configuration, grading data, required media, and item completeness. Teacher submits; Admin reviews, approves, and publishes an immutable logical Assessment Version. An attempt stays bound to one version for its duration. An item exposed in ordinary lesson practice with its answer, correctness, or answer-revealing explanation cannot be reused exactly in an assessment; a different item or variant may test the same concept. This is a bounded workflow, not a generic workflow engine or QuestionBank platform.

### MVP assessment scope

MVP includes Placement for a starting-point recommendation and Level-up for progression only. Neither is a comprehensive language proficiency certificate. Reassessment, periodic rechecking, and verified-proficiency reassessment are deferred and are not active MVP use cases or learner-journey steps. Historical references remain historical/deferred.

### Admin learner-account operations

Admin may search Learner accounts, view necessary identity/status/role fields and a minimal LearningContext summary for support, disable/re-enable accounts, enter a reason where appropriate, and have the action audited. Admin may not edit completion, performance, assessment results, SRS review history, activity, level, progress, or other learner evidence. Password recovery remains a learner account flow; Admin does not need or learn the learner's current password.

---

## [SUPERSEDED / HISTORICAL REFERENCE] Migrated source: three-faculty breakdown (v3)

> **Historical Context Note:** The section below reflects the earlier academic division into 3 independent tracks before ADR-010 consolidated the scope into Software Engineering + Transformer GEC, and Phase 2 established the deterministic 6-role core. This section is NOT current implementation guidance.


### 2.1. Đồ án Kỹ nghệ Phần mềm

#### Phạm vi công việc
1. Web Learner App: Auth, danh sách khoá/bài học, học từ vựng, 3+ loại bài tập, màn **"Ôn tập thông minh"**, màn **"Luyện hội thoại"**, profile, tiến độ.
2. Web Admin: Auth phân quyền, CRUD Course/Lesson/Vocabulary/Exercise/**Chat Scenario**, upload media, xem thống kê.
3. Database: schema đa ngôn ngữ, RLS, migration bằng Prisma, seed data.
4. Tích hợp: Supabase Auth + PostgREST + Storage; API contract với AI Server (2 endpoint AI).

#### Sản phẩm tài liệu phải làm

| # | Sản phẩm | Ghi chú làm cho đúng |
|---|---|---|
| 1 | **SRS** *(Software Requirements Specification — không nhầm với "Spaced Repetition System")* | Tách rõ Functional (FR-01…) và Non-functional. Đánh mã để truy vết được sang test case. |
| 2 | **Use Case Diagram** | Actor ngoài hệ thống: `Học viên`, `Quản trị viên`. GEC/T5-small là xử lý nội bộ trong boundary; có `<<include>>` cho "Đăng nhập". |
| 3 | **Đặc tả Use Case** (bảng) | Làm chi tiết 4 UC quan trọng: Đăng nhập, Học 1 bài, **Ôn tập từ vựng theo gợi ý AI**, **Luyện hội thoại (Roleplay)**. Có luồng chính + luồng ngoại lệ (AI Server không phản hồi). |
| 4 | **Activity Diagram** | 3 cái: đăng ký/đăng nhập, hoàn thành 1 bài học, luồng ôn tập thông minh (có nhánh AI lỗi → dùng lịch mặc định). |
| 5 | **Sequence Diagram** | 3 cái: `Login`, `SRS Recommendation` (Web Learner → PostgREST đọc log → FastAPI `/v1/srs/schedule` → **RPC `record_review`** ghi lại Supabase trong 1 transaction), `Roleplay Chat` (Web Learner → FastAPI `/v1/chat/roleplay` → Model → lưu `chat_messages`). Đây là 3 sơ đồ "ăn điểm" nhất vì thể hiện tích hợp nhiều hệ thống. |
| 6 | **ERD** | Xuất từ `schema.prisma` bằng `prisma-erd-generator` → có thật, khớp code, gồm cả khối `user_vocab_srs/review_logs/chat_*`. |
| 7 | **Class Diagram** | Tầng data/domain của Web Learner (Repository, Model, service/hook) — thể hiện tách lớp presentation / data. |
| 8 | **Kiến trúc & UI/UX** | Sơ đồ mục 1.1, wireframe Figma (đặc biệt màn "Ôn tập thông minh" và màn chat), bảng màu, design decision. |
| 9 | **Test case + kết quả** | Bảng ≥ 25 test case, gồm cả trường hợp AI Server timeout / trả `MOCK_MODE`. Kèm ảnh chụp. |
| 10 | **Chương Scalability** | Dùng nguyên bảng 1.8 trong [01-kien-truc-he-thong.md](01-architecture.md#18-bàn-về-khả-năng-mở-rộng-để-trả-lời-hội-đồng-knpm). |

#### Dàn ý báo cáo KNPM
```
Ch1. Tổng quan       — bối cảnh, bài toán, mục tiêu, phạm vi, so sánh app tương tự (Duolingo, Memrise)
Ch2. Cơ sở lý thuyết — Web/Next.js App Router, kiến trúc component + data layer, BaaS & Supabase, REST, ORM, RLS
Ch3. Phân tích       — SRS (đặc tả yêu cầu), Use Case + đặc tả, Activity Diagram
Ch4. Thiết kế        — kiến trúc 3 tầng, ERD, Class Diagram, Sequence Diagram, thiết kế UI/UX
Ch5. Cài đặt         — tech stack, cấu trúc project, giải thích module chính (kèm đoạn code tiêu biểu)
Ch6. Kiểm thử        — chiến lược test, bảng test case, kết quả
Ch7. Kết luận        — đã làm được / hạn chế / hướng phát triển (offline mode, speaking, thêm kịch bản chat)
```

---

### 2.2. Học máy (ML) — Knowledge Tracing / Spaced Repetition

#### Phạm vi công việc
1. Xây dựng **Deep Knowledge Tracing (LSTM) tự viết** bằng PyTorch — **model nghiên cứu chính** của ML, dự đoán xác suất trả lời đúng ở lần tương tác tiếp theo dựa trên chuỗi lịch sử tương tác (định nghĩa gốc của bài toán Knowledge Tracing).
2. Xây dựng thêm **Half-Life Regression (HLR)** — mô hình cổ điển (Duolingo, Settles & Meeder 2016) làm **baseline so sánh**, đồng thời là **phương án production fallback** nếu DKT-LSTM không đạt Model Acceptance Criteria (xem `04`). HLR không thay thế vai trò "đề tài nghiên cứu chính" của DKT dù có được chọn chạy production.
3. Tối ưu siêu tham số có hệ thống.
4. Đánh giá, phân tích lỗi, ablation.

> **Cách diễn đạt chuẩn cho báo cáo (tránh bị bắt bẻ domain mismatch ASSISTments ↔ từ vựng):** không nói "DKT dự đoán xác suất user nhớ đúng 1 từ vựng" một cách trực tiếp, vì ASSISTments là dữ liệu đánh giá kỹ năng toán học (educational assessment), không phải dữ liệu học từ vựng của Lingora. Diễn đạt đúng: *"DKT-LSTM dự đoán xác suất trả lời đúng ở lần tương tác tiếp theo, dựa trên chuỗi lịch sử tương tác (skill, đúng/sai) — đây là bài toán Knowledge Tracing tổng quát, được kiểm chứng trên benchmark ASSISTments. Trong hệ thống Lingora, xác suất này được diễn giải (interpret) thành `recall_probability` cho bài toán ôn tập từ vựng, và được Scheduler dùng làm tín hiệu đầu vào để suy ra lịch ôn — việc adaptation sang đúng domain từ vựng sẽ thực hiện khi có `review_logs` thật."* Tách rõ 2 vế: (a) DKT là gì / được huấn luyện & kiểm chứng trên gì; (b) Lingora dùng output đó như thế nào.

> **Vì sao phải tự viết model?** Nếu chỉ dùng công thức SM-2 cứng (Anki-style) thì không có gì để "học máy" cả — không có tham số học từ dữ liệu. DKT-LSTM tự viết là chỗ để trình bày kiến trúc mạng, loss, optimizer — đúng những gì hội đồng ML chấm. HLR là để có model nhẹ, dễ diễn giải, chạy được trên free-tier hosting làm phương án production/dự phòng. Báo cáo cả hai và **so sánh** thì càng mạnh.

> **Vì sao dùng dataset public (ASSISTments, Duolingo HLR) thay vì dữ liệu app thật?** App Lingora là app mới, chưa có lịch sử tương tác thật của user để train. Chiến lược: (1) pretrain/validate phương pháp trên dataset học thuật chuẩn (để có con số đáng tin cậy, so sánh được với paper gốc); (2) khi app có dữ liệu thật tích luỹ qua `review_logs`, có thể fine-tune lại — nêu rõ hướng phát triển này trong chương Kết luận.

#### Số liệu / hình vẽ bắt buộc phải có

| # | Sản phẩm | Cách lấy |
|---|---|---|
| 1 | **[Must]** Sơ đồ kiến trúc DKT-LSTM | Khối: Embedding(skill, correct) → LSTM (n_layers, hidden_size) → Linear → Sigmoid (xác suất đúng cho mỗi skill ở bước tiếp theo). Ghi rõ `input_dim`, `hidden_size`, `num_layers`, `dropout`. |
| 2 | **[Must]** Công thức Half-Life Regression | `p = 2^(-Δt/h)`, `h = 2^(θ·x)` với `x` là feature vector (số lần đúng, số lần sai, độ khó từ...). Giải thích ý nghĩa "half-life". |
| 2b | **[Must]** Sơ đồ Scheduler (tách khỏi model) | Khối `recall_probability (từ DKT/HLR) → Scheduler (rule-based) → priority + recommended_interval_days`. Nhấn mạnh đây **không phải** phần học máy — xem [01](04-data-model.md#13b-tách-rõ-dkthlr-khỏi-scheduler). |
| 3 | **[Must]** Bảng số tham số | `sum(p.numel() for p in model.parameters())` của DKT-LSTM, tách theo từng khối (embedding/LSTM/output). |
| 4 | **[Must]** Biểu đồ Loss (train + val) theo epoch | TensorBoard/matplotlib cho DKT-LSTM. Dùng để giải thích Early Stopping. |
| 5 | **[Must]** Biểu đồ AUC-ROC theo epoch | Trên tập validation ASSISTments |
| 6 | **[Nice]** Biểu đồ Calibration (reliability diagram) | So sánh xác suất dự đoán với tần suất thực tế — làm nếu còn thời gian |
| 7 | **[Must]** Bảng hyperparameter search | ≥ 8 lần chạy: `hidden_size`, `num_layers`, `lr`, `dropout`, `sequence_window` → val AUC. Đánh dấu cấu hình thắng. |
| 8 | **[Must]** Bảng so sánh model | Baseline ngẫu nhiên / SM-2 cố định / Half-Life Regression / DKT-LSTM → AUC, Brier score, Accuracy, latency, số tham số |
| 9 | **[Must]** Ablation study | Bỏ time-decay feature / bỏ embedding riêng cho skill / giảm sequence window → xem AUC tụt bao nhiêu |
| 10 | **[Nice]** Phân tích lỗi sâu | Các trường hợp model dự đoán sai nhiều nhất + giả thuyết nguyên nhân — làm nếu còn thời gian |

#### Các quyết định kỹ thuật cần giải thích được (hội đồng sẽ hỏi)

| Quyết định | Chọn gì | Lý do phải nói được |
|---|---|---|
| Bài toán | Binary sequence prediction (đúng/sai lần ôn tiếp theo) | Đây chính là định nghĩa gốc của Knowledge Tracing (Piech et al., 2015 — Deep Knowledge Tracing) |
| Loss function | `BCELoss` (có mask cho vị trí padding) | Vì sao cần mask — chuỗi tương tác của mỗi user dài khác nhau, không được tính loss trên phần pad |
| Optimizer | `Adam(lr=1e-3)` | Đơn giản, hội tụ nhanh với LSTM cỡ nhỏ, không cần warmup phức tạp như Transformer |
| Regularization | dropout trên LSTM, early stopping (patience 3) | Chống overfit vì dữ liệu theo user có thể lệch phân bố |
| Feature hoá thời gian | Đưa Δt (khoảng cách ngày) vào input dưới dạng log-scale | Trực tiếp mô hình hoá "quên theo thời gian" — đúng bản chất bài toán SRS, khác với Knowledge Tracing thuần (vốn không có yếu tố thời gian) |
| Batching | Pad theo user, `pack_padded_sequence` | Chuẩn xử lý chuỗi độ dài khác nhau trong PyTorch |
| Baseline HLR | Log-linear thay vì neural | Diễn giải được hệ số (feature nào làm tăng/giảm half-life), chạy CPU, dùng làm phương án fallback khi server yếu |
| Model acceptance | Model mới chỉ được thay model production khi `AUC_new ≥ AUC_old` và `Brier_new ≤ Brier_old` và `latency_new ≤ ngưỡng` | Tránh deploy model "mới hơn nhưng tệ hơn" chỉ vì mới train xong (xem `04`) |

#### Dàn ý báo cáo ML
```
Ch1. Bài toán Knowledge Tracing / SRS — định nghĩa, ứng dụng trong Lingora (1 trang), khảo sát công trình
                                          liên quan (DKT — Piech 2015, Half-Life Regression — Settles 2016)
Ch2. Dữ liệu             — ASSISTments 2009-2010, Duolingo HLR dataset: nguồn, số lượng, chia train/val/test
Ch3. Kiến trúc mô hình   — DKT-LSTM (embedding, LSTM, output layer, số tham số) + công thức HLR
                           + 1 mục ngắn "Scheduler là gì, vì sao tách khỏi model" (không đào sâu, đây là rule-based)
Ch4. Huấn luyện          — loss, optimizer, regularization, epoch, early stopping, cấu hình phần cứng, thời gian train
Ch5. Tối ưu siêu tham số — phương pháp (grid/random), bảng kết quả, cấu hình tốt nhất
Ch6. Đánh giá            — AUC/Brier[/Calibration nếu kịp], bảng so sánh model, ablation, model acceptance criteria
Ch7. Triển khai          — export, latency p50/p95, tích hợp FastAPI, chiến lược cold-start (user/từ mới)
Ch8. Kết luận            — hạn chế (chưa có dữ liệu user thật), hướng phát triển (fine-tune online theo review_logs)
```

---

### 2.3. Xử lý Ngôn ngữ Tự nhiên (NLP) — Chatbot Roleplay

#### Phạm vi công việc
Toàn bộ đường đi của **dữ liệu hội thoại**: thu thập → làm sạch → tokenize → vector hoá → mô hình hoá sequence-to-sequence sinh phản hồi → đánh giá bằng metric ngôn ngữ/hội thoại. Bộ chấm độ chấp nhận ngữ pháp (`grammatical_acceptability_score`) là **module phụ [Nice]**, không phải trọng tâm.

> **Siết scope (theo review):** domain chính và **duy nhất bắt buộc** là `hotel_booking` (từ MultiWOZ 2.2). DailyDialog + các domain khác của MultiWOZ (`restaurant`, `taxi`...) là **[Nice]**, chỉ làm nếu còn thời gian sau khi domain hotel đã chạy ổn định end-to-end. Model production **chỉ dùng `t5-small`** (bỏ phương án DialoGPT để giảm 1 nhánh train không cần thiết).

#### Pipeline tiền xử lý (mô tả từng bước + số liệu trước/sau)

```
Raw corpus (MultiWOZ 2.2, chỉ domain "hotel"  —  [Nice] mở rộng thêm DailyDialog nếu còn thời gian)
 → 1. Chuẩn hoá Unicode NFKC, đồng nhất dấu nháy
 → 2. Chuẩn hoá khoảng trắng, bỏ ký tự điều khiển, bỏ token đặc biệt rác của dataset gốc
 → 3. Cắt hội thoại thành cặp (context, response): context = k lượt gần nhất (k≤4), response = lượt kế tiếp
 → 4. Lọc: bỏ response < 2 hoặc > 40 token, chỉ giữ hội thoại có domain = "hotel"
 → 5. Khử trùng lặp (hash)
 → 6. Train SentencePiece BPE (vocab 16k) trên toàn bộ context+response
 → 7. Encode → thêm <bos> <eos> <sep> (phân tách các lượt trong context), pad theo batch
 → 8. Chia train/val/test theo dialogue_id (không theo turn) để tránh rò rỉ dữ liệu giữa các tập
```

Với mỗi bước, ghi lại: số hội thoại/cặp vào → số cặp ra → tỉ lệ loại bỏ.

#### Nội dung NLP bắt buộc phải có

| # | Chủ đề | Sản phẩm cụ thể |
|---|---|---|
| 1 | **[Must]** Tokenization | So sánh word-level vs subword (BPE): kích thước vocab, tỉ lệ `<unk>`, độ dài chuỗi trung bình. Ví dụ: `"booking" → ["book","ing"]`. |
| 2 | **[Nice]** Word Embeddings + t-SNE/PCA | Embedding học từ đầu (`nn.Embedding`, d=256), weight tying. Trực quan hoá t-SNE/PCA của 300 token phổ biến — làm nếu còn thời gian, không phải điều kiện để hiểu attention. |
| 3 | **[Nice]** Positional Encoding heatmap | Sinusoidal; vẽ heatmap ma trận PE — có thể chỉ mô tả công thức + 1 hình nhỏ, không cần phân tích sâu |
| 4 | **[Must]** Cơ chế Attention | Công thức `softmax(QKᵀ/√d_k)V`; phân biệt self-attention, masked self-attention (decoder), cross-attention. **Heatmap attention** cho 1 lượt hội thoại (domain hotel) → hình quan trọng nhất của báo cáo NLP, bắt buộc phải có. |
| 5 | **[Must]** Seq2Seq hội thoại | Teacher forcing khi train vs autoregressive khi infer; exposure bias; beam search (mô tả ngắn, không cần vẽ cây minh hoạ nếu thiếu thời gian) |
| 6 | **[Nice]** Bộ chấm độ chấp nhận ngữ pháp | Fine-tune `distilbert-base` trên **CoLA** → phân loại câu của user "chấp nhận được"/"không" → field API `grammatical_acceptability_score` (đổi tên từ `naturalness_score` — xem [01](03-api-contract.md)). Module phụ, cắt đầu tiên nếu thiếu thời gian (xem `00` mục 0.3). |
| 7 | **[Must]** Metric đánh giá hội thoại (đã rút gọn, tách riêng theo từng model — không gộp thành 1 điểm số duy nhất) | **Transformer tự viết:** Train Loss, Val Loss, Perplexity, Distinct-1, Distinct-2. **T5-small (production, task-oriented):** Loss, Perplexity, BLEU (tham khảo), Distinct-1, Distinct-2, Inform rate, Success rate. **Bộ chấm CoLA [Nice]:** Accuracy, F1. Không dùng `Combined Score` gộp nhiều metric có trọng số tuỳ ý (vd `0.2×BLEU + 0.4×Inform...`) — mỗi metric báo cáo riêng, kèm 1 câu giải thích ý nghĩa, tránh bị hỏi "tại sao trọng số này". |

#### Dàn ý báo cáo NLP
```
Ch1. Tổng quan NLP & bài toán Task-oriented Dialogue / Chatbot luyện tập (domain: đặt phòng khách sạn)
Ch2. Dữ liệu ngôn ngữ         — MultiWOZ 2.2 (domain hotel) [+ DailyDialog nếu kịp]: đặc điểm, phân bố
Ch3. Tiền xử lý văn bản       — pipeline 8 bước, bảng số liệu trước/sau
Ch4. Tokenization & Embedding — BPE, so sánh, vocab [+ trực quan hoá embedding nếu kịp]
Ch5. Mô hình Seq2Seq          — encoder-decoder tự viết, attention (bắt buộc có heatmap), positional
                                 encoding, decoding, so sánh với bản fine-tune t5-small
Ch6. Đánh giá hội thoại       — từng model báo cáo metric riêng (không gộp Combined Score): Transformer
                                 tự viết (Loss/Perplexity/Distinct-n), T5-small (Loss/Perplexity/BLEU tham
                                 khảo/Distinct-n/Inform/Success), ví dụ đúng-sai
Ch7. [Nice] Bộ chấm độ chấp nhận ngữ pháp — fine-tune DistilBERT trên CoLA, chỉ đưa vào nếu còn thời gian
Ch8. Kết luận
```

---

### 2.4. Ma trận tổng hợp: 1 công việc → dùng cho báo cáo nào

| Công việc thực tế | KNPM | ML | NLP |
|---|:---:|:---:|:---:|
| `schema.prisma` + ERD | ✅ chính | – | – |
| Use Case / Activity / Sequence | ✅ chính | – | – |
| UI Web Learner + Admin | ✅ chính | – | – |
| API contract & tích hợp | ✅ chính | ▫ nhắc qua | ▫ nhắc qua |
| Script làm sạch dữ liệu hội thoại | – | – | ✅ chính |
| Train tokenizer (dialogue) | – | – | ✅ chính |
| Code `dkt_lstm.py`, `hlr.py` | – | ✅ chính | – |
| Code `scheduler.py` (rule-based) | ▫ nhắc qua | ▫ nhắc qua | – |
| `train_dkt.py`, biểu đồ AUC/loss | – | ✅ chính | – |
| Hyperparameter search (SRS) | – | ✅ chính | – |
| RPC `record_review` | ✅ chính | ▫ | – |
| Code `transformer.py` (chatbot, domain hotel) | – | – | ✅ chính (giải thích attention) |
| `train_seq2seq.py`, biểu đồ loss/perplexity | – | ▫ | ✅ chính |
| Fine-tune T5-small (domain hotel) | – | ▫ | ✅ chính |
| Fine-tune DistilBERT (CoLA) — [Nice] | – | – | ▫ (nếu kịp) |
| Loss/Perplexity/Distinct-n/Inform-Success | – | – | ✅ chính (giải thích) |
| Attention heatmap | – | – | ✅ chính |
| Model acceptance criteria | ✅ chính (risk mgmt) | ✅ chính | ▫ |
| Deploy + latency (2 model) | ✅ ▫ | ✅ ▫ | ✅ ▫ |
| Mock API dự phòng | ✅ chính (risk mgmt) | – | – |

✅ chính = trình bày sâu · ▫ = nhắc 1–2 đoạn cho liền mạch · – = không đưa vào




## Phase 0 Canonical Functional Baseline (MVP-01 to MVP-19)

*Source: [`docs/phase-0-roles-and-mvp-final.md`](phase-0-roles-and-mvp-final.md)*

| ID | Chức năng MVP | Owner chính | Tiêu chí nghiệm thu tối thiểu (Acceptance Criteria) | Liên kết Use Case |
|---|---|---|---|---|
| **MVP-01** | Đăng ký, đăng nhập, đăng xuất và khôi phục phiên | Administrator | Learner tạo phiên hợp lệ; lỗi xác thực rõ ràng; logout kết thúc phiên | `UC-01` |
| **MVP-02** | Onboarding mục tiêu học | Learner | Chọn ngôn ngữ, cấp độ, mục tiêu, kỹ năng ưu tiên và thời lượng; có thể sửa sau | `UC-02` |
| **MVP-03** | Đánh giá chẩn đoán (Diagnostic) hoặc chọn cấp độ | Learner | Có thể làm bài đánh giá chẩn đoán thích ứng 2 giai đoạn (Routing → Targeted) đa chiều (Từ vựng, Ngữ pháp, Đọc, Nghe) hoặc bỏ qua/chọn cấp độ tự khai báo (Initial Self-Reported Level - phân biệt rõ với verified proficiency); kết quả trả về Skill Profile đa chiều và khuyến nghị điểm xuất phát (Starting Unit/Level) có giải thích; hỗ trợ retake | `UC-03` |
| **MVP-04** | Lộ trình học | Lesson Creator | Hiển thị Course → Unit → Lesson, trạng thái khóa/mở và lesson tiếp theo | `UC-04` |
| **MVP-05** | Lesson ngắn | Lesson Creator | Lesson có mục tiêu, thời lượng 5–10 phút, nội dung và điều kiện hoàn thành | `UC-05`, `UC-08` |
| **MVP-06** | Năm dạng exercise đề cương | Lesson Creator | MCQ, FILL_BLANK, REORDER, LISTENING, GRAMMAR chấm đúng/sai ổn định và không ghi tiến độ lặp (phân biệt rõ 5 dạng bài tập đề cương với công cụ sửa lỗi GEC) | `UC-05`, `UC-08` |
| **MVP-07** | Phản hồi tức thời | Moderator | Mỗi câu có kết quả, đáp án đúng và giải thích ngắn đã được duyệt | `UC-05`, `UC-09` |
| **MVP-08** | Tiến độ học (Tách biệt Progress vs Mastery/Proficiency) | Learner | Lưu lesson đang học, hoàn thành, điểm và lần hoạt động gần nhất; tuân thủ bất biến Progress ≠ Proficiency (hoàn thành 100% bài học không tự động nâng cấp độ năng lực; cần Exit Assessment hoặc Re-evaluation để cập nhật verifiedProficiency mới) | `UC-07` |
| **MVP-09** | Ôn tập nội dung yếu (SRS) | Learner | Nội dung sai hoặc đến hạn xuất hiện trong review; hoàn thành review cập nhật lịch | `UC-06` |
| **MVP-10** | Daily goal và streak | Learner | Goal chỉnh được; một ngày chỉ tăng streak tối đa một lần; bỏ ngày xử lý theo quy tắc công bố | `UC-02`, `UC-07` |
| **MVP-11** | Báo cáo cá nhân | Learner | Xem lesson hoàn thành, độ chính xác, thời gian học, streak và nội dung cần ôn | `UC-07` |
| **MVP-12** | Quản lý nội dung | Lesson Creator | Tạo/sửa/preview draft, thêm exercise/media và gửi duyệt | `UC-08` |
| **MVP-13** | Kiểm duyệt nội dung | Moderator | Review, yêu cầu sửa, phê duyệt/từ chối và lưu lý do | `UC-09`, `UC-10` |
| **MVP-14** | Quản trị tài khoản và quyền | Administrator | Tạo/khóa tài khoản, gán/thu hồi role và lưu audit | `UC-11` |
| **MVP-15** | Báo cáo vận hành | Administrator | Lọc theo thời gian/ngôn ngữ/course; xem active users, completion, retention và content errors | `UC-12` |
| **MVP-16** | Hỗ trợ người dùng | Operations Staff | Tạo, phân công, cập nhật và đóng ticket; truy cập dữ liệu tối thiểu | `UC-14` |
| **MVP-17** | Quản lý cohort tùy chọn | Organizational Manager | Khi module bật: tạo nhóm, thêm thành viên, gán course và xem báo cáo tổng hợp | `UC-15` |
| **MVP-18** | Trạng thái trải nghiệm chuẩn | Mọi owner | Các màn chính có loading, empty, error và success; dùng được trên mobile và desktop | Cross-cutting UI |
| **MVP-19** | Quyền riêng tư và audit | Administrator | Kiểm tra quyền ở server/data layer; hành động nhạy cảm có actor, thời gian và đối tượng | `UC-11`, `UC-13` |

---

## Detailed Software Engineering & ML Requirements

This section contains the detailed technical engineering requirements (`P1-FR-*`, `P1-NFR-*`, `ML-GEC-*`) mapped to the MVP functions above. No application, schema, API, or model implementation is implied by this section.

### M0.5 semantic decisions

- Project 1 client ownership (amended by ADR-008, 2026-08-17): the Web learner client owns presentation, local validation/cache, and API orchestration; Supabase owns persistent data, RLS, and transactional review writes. AI Server remains stateless and does not own primary learner data.
- Core model: the required entity inventory is `Language`, `Profile`, `Course`, `CourseTranslation`, `Lesson`, `LessonTranslation`, `Vocabulary`, `VocabularyTranslation`, `LessonVocabulary`, `Exercise`, `UserProgress`, `UserVocabSrs`, `ReviewLog`, `ChatScenario`, `ChatScenarioTranslation`, `ChatSession`, and `ChatMessage`. Field-level definitions absent from the migrated source remain explicitly `PROPOSED` in the traceability matrix and require schema review before migration.
- RLS and review ownership: learner operations are restricted to owned records; admin operations cover content/media management. `record_review` must verify `auth.uid() = user_vocab_srs.user_id` before its transaction proceeds and must not trust a client-supplied user id.
- Locale: learned language is English (`en`). UI `vi` and `en` are Must/P1, default UI locale is `vi`, unsupported UI locales fall back to `vi`, and `ja` remains Nice/P2. Content translation lookup uses requested locale → supported learner native locale → `vi` → `en` → explicit unavailable state.
- Gamification: only daily streak is Must. Points/rewards are Nice/P2; leaderboard is P3/out of scope. A qualifying lesson-exercise session or vocabulary review increments at most once per learner-local calendar day; a missed day resets the next qualifying streak to 1. Profile stores an IANA timezone defaulting to `Asia/Ho_Chi_Minh` and `lastQualifyingActivityDate`; full streak history is not persisted in this scope.
- Grammar scoring: `grammatical_acceptability_score` is an optional P2/Nice output. If the scorer is disabled or unavailable, the chat response remains valid and omits the optional score; no persistence field is required in M0.5. The API terminology remains snake_case and must not revert to `naturalnessScore`.
- API metadata: `model_version` and `is_mock` are required on successful inference responses (`/v1/srs/schedule`, `/v1/chat/roleplay`). Supporting, health, and error responses do not inherit that invariant unless their contract explicitly defines those fields. `/health/live` and `/health/ready` are public operational checks, never a keep-warm dependency; `/health` is not canonical unless a compatibility alias is later approved.
- Exercise scope: MCQ and FILL_BLANK remain Must. `REORDER` is the approved third exercise for the “3+ types” requirement. A REORDER answer is correct only when the submitted index permutation exactly equals `correctOrder`; duplicate, missing, out-of-range, or repeated indices are invalid, and duplicate token text is disambiguated by index. ADR-006 (2026-08-15) extends the approved set to five values: `MCQ`, `FILL_BLANK`, `REORDER`, `GRAMMAR`, and word-level `LISTENING`. `MATCHING` and `WRITING` remain superseded and unapproved. All five are rows on the existing `Exercise` table with a JSONB payload; no new exercise entity is introduced.
- Scope Gap Review resolution: the current Project 1 Vocabulary scope is published Course/Lesson vocabulary browsing, vocabulary audio playback, the approved exercise types, and integration with the SRS review flow. Search/favorite lists, pronunciation scoring, a separate mastery model, and an additional standalone flashcard mode are not implied by the word “Vocabulary” and require a later approved requirement if desired.
- Grammar scope (amended by ADR-006, 2026-08-15): grammar is delivered as `Exercise` rows with `type = 'GRAMMAR'` attached to existing published lessons, and learner progress continues to flow through lesson-level `UserProgress` under `P1-FR-004`. Grammar does not become a subsystem: no `GrammarLesson`, no `UserGrammarProgress`, and no separate Grammar schema is approved. The optional NLP-owned P2 `grammatical_acceptability_score` is unchanged, remains API-only, and is not persisted.
- Listening scope (amended by ADR-006, 2026-08-15): word-level scored `LISTENING` is approved. A `LISTENING` exercise plays the audio of a referenced vocabulary item and grades the learner's answer. Audio reuses the existing approved Storage path `vocabulary/{vocabularyId}/{filename}`, and the payload references `vocabularyId` rather than embedding a free-form URL, so read authorization stays with the existing RLS policy. Sentence-level listening audio not tied to a vocabulary row is rejected; it would require a new Storage path and a SEC-D8 amendment.
- “Quiz” may be used only as a user-facing/report label for the existing lesson exercise sequence. It does not introduce a separate Quiz entity, attempt/session history, timer, pass threshold, or result model; those semantics remain unapproved/deferred.
- Study scheduling scope (amended by ADR-006, 2026-08-15): the learner can view and set a daily study goal backed by the existing `Profile.dailyGoalMin` field. This requires no schema, grant, or policy change, because the M1.3 write path already grants and validates it. It is a daily minute goal, not a calendar or timetable feature; no lesson-scheduling entity is approved.
- Reminder scope (amended by ADR-006, 2026-08-15; mechanism amended by ADR-008, 2026-08-17): a client-local daily study reminder is approved, derived in the client from `dailyGoalMin` and `lastQualifyingActivityDate`, with the reminder window stored client-side. There is no server-side delivery, no device token, no push subscription, no FCM/Web Push, no scheduler, and no notification-preference or reminder-schedule entity. The approved mechanism is an **in-app reminder** (`6d`): it is surfaced inside the web application when the learner opens it during the chosen window. Three limitations are explicit: the setting is per-browser and lost when site data is cleared; the reminder is **not** delivered while the application is closed, because no background delivery mechanism is approved; and it is presented within the chosen window, never as an exact time. Options `6a` (PWA/service worker notification) and `6b` (Web Push + scheduler) are deferred, not rejected — see `ADR-008`. SRS due state and reminder delivery remain separate concerns; `nextReviewAt` is still not a delivery record.
- Learning Design & Four-Concept Separation (expert-informed): four core pedagogical concepts are strictly separated:
  1. `Learning Progress`: percentage of curriculum content completed (course/unit/lesson tracking).
  2. `Proficiency`: language competence mapped to standard frameworks (CEFR A1–B2 for English, configurable versioned HSK for Chinese).
  3. `Mastery`: demonstrated competence on fine-grained concepts and skill dimensions derived from performance evidence.
  4. `Level Readiness`: synthetic evaluation determining whether a learner is prepared to advance to the next level based on progress, mastery, skill profile, and assessment.
- Stage-Adaptive Diagnostic Assessment: The assessment engine uses a 2-stage adaptive architecture (Routing Stage → Targeted Stage, ~25–30 items, ≤ 15 min) evaluating 4 core dimensions (Vocabulary, Grammar, Reading, Listening). Routing and branch demotion/promotion thresholds, item distribution ratios, and composite scoring formulas are `PROPOSED / PENDING VALIDATION`.
- Common Assessment Engine Architecture: Shared adaptive assessment core configured per language via JSON schema (English: CEFR A1–B2; Chinese: versioned HSK). Chinese reading items default to `hidePinyin: true` to evaluate character recognition competence.
- Learning Path Transition & Remediation: Path transitions produce 3 logical states (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`). Remediation operates at the `Concept-level / Skill-level` via targeted micro-lessons with fresh context, never downgrading the learner's overall level and never repeating entire completed lessons.

### Project 1 — Software Engineering requirements

| ID | Priority | Requirement | Acceptance criteria | Evidence |
|---|---|---|---|---|
| P1-FR-001 | Must | Learner can register, log in, recover password (reset flow [PENDING / DESIGN SPEC ONLY]), refresh an expired access token, and log out through Supabase Auth. | Valid credentials create an authenticated session; invalid credentials show an error; one expired-token refresh retries once; logout clears the local session. Password recovery design flow: user requests password reset via registered email -> system issues recovery verification token/link -> user validates token and establishes new password -> system updates credentials and invalidates prior recovery state/sessions [Status: PENDING / DESIGN SPEC ONLY — runtime implementation scheduled]. | Auth use case, Web E2E |
| P1-FR-002 | Must | Learner can browse published curriculum and view lesson content (Lesson Content Viewer) prior to starting exercises. | Only published content (fulfilling Unit 4/4 Published rule) is accessible; learner views learning content (vocabulary, transcription, Vietnamese meaning, contextual examples, standard static audio playback, grammar summary) before starting practice; unavailable content/audio produces a recoverable empty/error state without crashing. This does not imply CMS/entity proliferation or dynamic AI content generation. | Supabase query test, Web E2E |
| P1-FR-003 | Must | Learner can complete MCQ, FILL_BLANK, REORDER, GRAMMAR, and word-level LISTENING exercises following lesson content viewing. | Each type validates its approved payload; exercises test content introduced in the Lesson Content Viewer; correct/incorrect result is shown; progress is updated once per submission. A “Quiz” label, if used, refers to this sequence and does not imply separate Quiz/Attempt persistence. GRAMMAR and LISTENING detail is specified in `P1-FR-012` and `P1-FR-013`. | Exercise unit/E2E tests |

| P1-FR-004 | Must | Learner can view and update lesson progress. | Status transitions are `NOT_STARTED → IN_PROGRESS → COMPLETED`; repeated completion is idempotent; progress is scoped to the authenticated learner. | Data/RLS tests |
| P1-FR-005 | Must | Learner can review vocabulary using the approved deterministic SRS Policy B. | Due cards are selected from learner-owned state using `nextReviewAt <= now`; client submits card identity and valid self-rating only; trusted server/RPC computes stage, interval, and due date; same-operation retry is idempotent. Policy B is not SM-2/FSRS. | SRS/RPC integration and policy tests; physical reconciliation deferred under ADR-035 |
| P1-FR-006 | Must | Review submission is recorded atomically and securely. | `record_review` rejects a card not owned by `auth.uid()`; a valid review operation updates one SRS card and one review-history record atomically. Client-provided probability/interval are not authoritative. Retrying the same operation does not duplicate history; deliberate re-review creates a new operation. | RPC/RLS integration test; inspect live RPC before implementation per ADR-035 |
| P1-FR-007 | Must | Learner can complete scenario-based English writing practice and receive GEC feedback. | The application presents an ordered scenario prompt; valid English input returns `corrected_text`; unavailable optional suggestions/explanations do not fail correction; scenario-not-found, invalid-input, unauthorized and model-unavailable cases use documented errors. Dialogue generation is not implied. | GEC API and scenario-writing E2E |
| P1-FR-008 | Must | Admin can provision/manage Teacher accounts, manage curriculum requirements and assignments, and review, approve, and publish Teacher-authored learning content. | Learner may self-register; Teacher/Admin accounts are not publicly self-registered; each account has one server-controlled business role and no role-conversion UI; `auth.uid()` is the trusted subject; disabled accounts are denied on the next request; Teachers author only assigned Lesson packages; Admin does not author lesson/exercise/assessment content; only approved revisions can publish. Ambiguous legacy role values require deliberate review, not auto-conversion. Physical role/RLS, lifecycle persistence, and audit emission remain deferred under ADR-035. Chat-scenario administration is not active scope without a separate approved requirement. | Current UCs 1, 9–13; ADR-034/035; physical conformance pending Modeling Review |

| P1-FR-009 | Must | Admin can upload approved media through Supabase Storage. | Only ADMIN can write media; stored paths are associated with the owning content record; invalid type/size is rejected. | Storage policy test |
| P1-FR-010 | Must | The product supports approved UI/content locale behavior. | UI supports `vi` and `en`, defaults/falls back to `vi`; `ja` is P2; content follows requested locale → supported native locale → `vi` → `en` → explicit unavailable state. | Locale checklist |
| P1-FR-011 | Must | Product provides daily streak gamification. | A lesson-exercise session or vocabulary review qualifies; increment occurs at most once per local day using stored IANA timezone and `lastQualifyingActivityDate`; missed days reset the next qualifying streak to 1. | Profile/gamification tests |
| P1-FR-012 | Must | Learner can complete `GRAMMAR` exercises inside an existing published lesson. | The payload validates against the approved `GRAMMAR` shape and satisfies `payloadVersion = '1'`; a correct/incorrect result is shown together with a rule explanation; progress is updated once per submission through lesson-level `UserProgress`. No grammar entity, grammar-progress record, or separate Grammar schema is created. | Exercise unit/E2E tests |
| P1-FR-013 | Must | Learner can complete word-level `LISTENING` exercises. | Audio for the referenced vocabulary plays and the submitted answer is graded; the payload references `vocabularyId` and never a free-form URL, so read authorization remains with the existing Storage RLS policy; unavailable or unauthorized audio produces a recoverable empty/error state without a crash. | Exercise unit/E2E tests, Storage policy test |
| P1-FR-014 | Must | Learner can view and set a daily study goal. | `Profile.dailyGoalMin` is readable and writable from the profile screen and scoped to the authenticated learner; a negative value is rejected by existing server-side validation; no schema, grant, or policy change is required because the M1.3 write path already grants and validates this field. | Profile E2E, Data/RLS tests |
| P1-FR-015 | Must | Learner can enable a local daily study reminder. | When the current local day has no qualifying activity, an in-app reminder is presented within the learner-chosen window — never claimed as an exact time — derived client-side from `dailyGoalMin` and `lastQualifyingActivityDate`; the reminder appears when the learner opens the application inside that window and is not delivered while the application is closed; no server-side delivery, push subscription, device token, or reminder entity exists. | Web unit test, manual verification |
| P1-FR-016 | Must | Learner can complete a Stage-Adaptive Diagnostic Assessment or select an initial self-reported level to receive a Starting Unit recommendation, or skip/retake. | The system supports a flexible entry flow (Initial Self-Reported Level fallback vs Stage-Adaptive Diagnostic Assessment [Routing Stage → Targeted Stage, ~25–30 items, ≤ 15 min; exact parameters/thresholds are PROPOSED / PENDING VALIDATION]); covers 4 core dimensions (Vocab, Grammar, Reading, Listening); applies Language-Specific Config (English CEFR A1–B2, Chinese HSK versioned with Reading hidePinyin: true); maps score to Starting Unit via approved curriculum placement rule (OD-PLACEMENT-MAPPING: APPROVED MAPPING A for initial English A1 scope); outputs a multidimensional Skill Profile (Spider/Radar chart, no single overall score; anchor level calculation pending validation); strictly distinguishes self-reported level from verified proficiency; does not claim international CEFR certification; prevents learner from directly editing verified diagnostic result; supports Retake from Profile. | Placement policy unit tests, data/RLS tests, Web E2E |
| P1-FR-017 | Nice / P2 | [OPTIONAL / DEFERRED FROM MUST] Learner can view private achievements and badges earned from qualifying learning milestones. | The system evaluates a documented badge catalog and deterministic award rules, grants each qualifying badge idempotently, exposes awards only to their owner and authorized Admin operations, provides no public leaderboard, and never blocks the core learning flow when award evaluation fails. Deferred from Core MVP (retained for future gamification expansion). | Badge rule unit tests, data/RLS tests, Web E2E |
| P1-NFR-001 | Must | API and data access preserve the documented security boundary. | Learners can access only own learner data; AI Server receives history but does not directly own/write primary Supabase data; ADMIN-only operations are enforced server-side. | RLS/security checklist |
| P1-NFR-002 | Must | The primary learning flow and deterministic SRS remain usable when GEC is unavailable. | Course, lesson, progress and vocabulary review remain available; scenario writing shows a recoverable model-unavailable state; no crash or indefinite spinner occurs. | Failure-mode E2E |
| P1-NFR-003 | Must | AI contract migration is explicit and backward-compatible until consumers move. | JSON remains snake_case; successful GEC responses include `model_version` and `is_mock`; legacy endpoints remain compatibility surfaces until reference scans and regression tests prove no consumer remains. | Contract and compatibility tests |
| P1-NFR-004 | Must | Web Learner and Admin provide approved responsive/loading/empty/error states. | Each Must screen has loading, empty, error, and success behavior documented and manually verified, and remains usable from mobile to desktop breakpoints. | UI checklist |

### ML/GEC — Transformer grammatical error correction requirements

| ID | Priority | Requirement | Acceptance criteria | Evidence |
|---|---|---|---|---|
| ML-GEC-FR-001 | Must | Build a reproducible English GEC dataset pipeline. | Dataset source/license, version/hash, cleaning, deduplication and leakage-safe train/validation/test split are recorded; raw data is not redistributed when license forbids it. | Dataset card, preprocessing tests |
| ML-GEC-FR-002 | Must | Fine-tune T5-small to generate corrected English text. | Given bounded English input, the model returns `corrected_text`; checkpoint, seed, configuration, commit, hardware and runtime are recorded. | Training run, model card, registry |
| ML-GEC-FR-003 | Must | Derive structured corrections outside the model. | Deterministic alignment produces bounded edit spans; ERRANT-compatible or rule mapping assigns a known type or `UNKNOWN`; malformed model output fails safely. | Diff/classifier unit tests |
| ML-GEC-FR-004 | Must | Evaluate GEC against approved baselines and metrics. | Identity/no-change and an approved baseline are compared using Precision, Recall, F0.5, ERRANT-compatible scores and qualitative error analysis. | Evaluation tables |
| ML-GEC-FR-005 | Should | Provide optional natural phrasing and template explanations. | These fields are omitted when unavailable; they never replace required corrected text and are evaluated separately from core GEC. | Optional module tests/evaluation |
| ML-GEC-NFR-001 | Must | Preserve stateless, authenticated and bounded inference. | FastAPI performs no primary DB access; JWT verification fails closed; input/output lengths are bounded; successful responses include model metadata. | Security and contract tests |
| ML-GEC-NFR-002 | Must | Measure deployable CPU latency. | Warm p95 is measured against the 2,000 ms target; cold start/model download is reported separately; the Web hard timeout remains 8 seconds. | Benchmark log and registry |

### Superseded research requirements

`ML-FR-001`..`ML-NFR-001` (DKT/HLR/SRS) and `NLP-FR-001`..`NLP-NFR-001` (MultiWOZ roleplay/chatbot) remain historical requirement IDs and evidence references, but are SUPERSEDED by ADR-010 and are not future delivery targets.

Requirement-to-architecture/data/API/test traceability is maintained in [05-traceability-matrix.md](05-traceability-matrix.md).

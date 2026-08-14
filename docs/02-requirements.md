# 02 - Lingora Requirements and Report Scope

> **Canonical status:** M0 migration baseline. The legacy requirements/report document is reproduced below with only approved product-name and Markdown nesting normalization.

## 02 — Phân tách Yêu cầu & Trọng tâm Báo cáo (bản v3 — đã siết scope theo review)

> **Cập nhật so với v2:** đánh dấu rõ **[Must]** (bắt buộc, ăn điểm trực tiếp) vs **[Nice]** (làm nếu còn thời gian, cắt trước tiên) cho từng hình/bảng của ML và NLP; ML thêm phần Scheduler tách khỏi DKT/HLR; NLP thu hẹp domain còn `hotel_booking`, bỏ DialoGPT, giảm số metric, đổi tên `naturalness_score` → `grammatical_acceptability_score`.

### 2.0. Nguyên tắc bóc tách

Cùng 1 source code, nhưng **3 hội đồng hỏi 3 thứ khác nhau**.

| Hội đồng | Câu hỏi ngầm của họ | "Nhân vật chính" trong báo cáo |
|---|---|---|
| Đồ án KNPM | *"Em có biết làm phần mềm đúng quy trình không?"* | Sơ đồ, tài liệu, database, UI/UX |
| Học máy | *"Em có hiểu mô hình mình train không?"* | Kiến trúc mạng (DKT-LSTM), loss, optimizer, biểu đồ, siêu tham số, so sánh với HLR |
| NLP | *"Em có hiểu dữ liệu ngôn ngữ không?"* | Tokenization, embedding, attention, seq2seq hội thoại, metric ngôn ngữ |

Quy tắc chống trùng lặp:
- Báo cáo KNPM: cả 2 model AI chỉ được nhắc như **service bên ngoài** (hộp đen có API contract). Không giải thích kiến trúc mạng.
- Báo cáo ML: chỉ dùng 1 trang mô tả app (bối cảnh "vì sao Lingora cần gợi ý ôn tập cá nhân hoá"). Không vẽ Use Case, không nói về hội thoại (đó là phần NLP).
- Báo cáo NLP: tập trung từ **văn bản hội thoại thô → tensor → phản hồi + điểm số**. Không nói về training loop chi tiết (đó là phần ML) — nhưng NLP **vẫn có phần huấn luyện riêng cho model seq2seq của chính mình**, chỉ là trình bày ở góc độ "dữ liệu ngôn ngữ" chứ không đào sâu optimizer/scheduler.

---

### 2.1. Đồ án Kỹ nghệ Phần mềm

#### Phạm vi công việc
1. Mobile App: Auth, danh sách khoá/bài học, học từ vựng, 3+ loại bài tập, màn **"Ôn tập thông minh"**, màn **"Luyện hội thoại"**, profile, tiến độ.
2. Web Admin: Auth phân quyền, CRUD Course/Lesson/Vocabulary/Exercise/**Chat Scenario**, upload media, xem thống kê.
3. Database: schema đa ngôn ngữ, RLS, migration bằng Prisma, seed data.
4. Tích hợp: Supabase Auth + PostgREST + Storage; API contract với AI Server (2 endpoint AI).

#### Sản phẩm tài liệu phải làm

| # | Sản phẩm | Ghi chú làm cho đúng |
|---|---|---|
| 1 | **SRS** *(Software Requirements Specification — không nhầm với "Spaced Repetition System")* | Tách rõ Functional (FR-01…) và Non-functional. Đánh mã để truy vết được sang test case. |
| 2 | **Use Case Diagram** | Actor: `Học viên`, `Quản trị viên`, `AI Service` (actor phụ). 12–15 use case, có `<<include>>` cho "Đăng nhập". |
| 3 | **Đặc tả Use Case** (bảng) | Làm chi tiết 4 UC quan trọng: Đăng nhập, Học 1 bài, **Ôn tập từ vựng theo gợi ý AI**, **Luyện hội thoại (Roleplay)**. Có luồng chính + luồng ngoại lệ (AI Server không phản hồi). |
| 4 | **Activity Diagram** | 3 cái: đăng ký/đăng nhập, hoàn thành 1 bài học, luồng ôn tập thông minh (có nhánh AI lỗi → dùng lịch mặc định). |
| 5 | **Sequence Diagram** | 3 cái: `Login`, `SRS Recommendation` (Android → PostgREST đọc log → FastAPI `/v1/srs/schedule` → **RPC `record_review`** ghi lại Supabase trong 1 transaction), `Roleplay Chat` (Android → FastAPI `/v1/chat/roleplay` → Model → lưu `chat_messages`). Đây là 3 sơ đồ "ăn điểm" nhất vì thể hiện tích hợp nhiều hệ thống. |
| 6 | **ERD** | Xuất từ `schema.prisma` bằng `prisma-erd-generator` → có thật, khớp code, gồm cả khối `user_vocab_srs/review_logs/chat_*`. |
| 7 | **Class Diagram** | Tầng data/domain của Android (Repository, Model, ViewModel) — thể hiện MVVM. |
| 8 | **Kiến trúc & UI/UX** | Sơ đồ mục 1.1, wireframe Figma (đặc biệt màn "Ôn tập thông minh" và màn chat), bảng màu, design decision. |
| 9 | **Test case + kết quả** | Bảng ≥ 25 test case, gồm cả trường hợp AI Server timeout / trả `MOCK_MODE`. Kèm ảnh chụp. |
| 10 | **Chương Scalability** | Dùng nguyên bảng 1.8 trong [01-kien-truc-he-thong.md](01-architecture.md#18-bàn-về-khả-năng-mở-rộng-để-trả-lời-hội-đồng-knpm). |

#### Dàn ý báo cáo KNPM
```
Ch1. Tổng quan       — bối cảnh, bài toán, mục tiêu, phạm vi, so sánh app tương tự (Duolingo, Memrise)
Ch2. Cơ sở lý thuyết — Android/MVVM, BaaS & Supabase, REST, ORM, RLS
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
| UI Android + Admin | ✅ chính | – | – |
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




## M0.5 canonical requirements baseline (approved)

This section is the approved M0.5 normalization layer. The migrated material above is preserved as historical source context; the IDs and acceptance criteria below are the canonical requirements used for traceability. No application, schema, API, or model implementation is implied by this section.

### M0.5 semantic decisions

- Project 1 mobile ownership: Android owns presentation, local validation/cache, and API orchestration; Supabase owns persistent data, RLS, and transactional review writes. AI Server remains stateless and does not own primary learner data.
- Core model: the required entity inventory is `Language`, `Profile`, `Course`, `CourseTranslation`, `Lesson`, `LessonTranslation`, `Vocabulary`, `VocabularyTranslation`, `LessonVocabulary`, `Exercise`, `UserProgress`, `UserVocabSrs`, `ReviewLog`, `ChatScenario`, `ChatScenarioTranslation`, `ChatSession`, and `ChatMessage`. Field-level definitions absent from the migrated source remain explicitly `PROPOSED` in the traceability matrix and require schema review before migration.
- RLS and review ownership: learner operations are restricted to owned records; admin operations cover content/media management. `record_review` must verify `auth.uid() = user_vocab_srs.user_id` before its transaction proceeds and must not trust a client-supplied user id.
- Locale: learned language is English (`en`). UI `vi` and `en` are Must/P1, default UI locale is `vi`, unsupported UI locales fall back to `vi`, and `ja` remains Nice/P2. Content translation lookup uses requested locale → supported learner native locale → `vi` → `en` → explicit unavailable state.
- Gamification: only daily streak is Must. Points/rewards are Nice/P2; leaderboard is P3/out of scope. A qualifying lesson-exercise session or vocabulary review increments at most once per learner-local calendar day; a missed day resets the next qualifying streak to 1. Profile stores an IANA timezone defaulting to `Asia/Ho_Chi_Minh` and `lastQualifyingActivityDate`; full streak history is not persisted in this scope.
- Grammar scoring: `grammatical_acceptability_score` is an optional P2/Nice output. If the scorer is disabled or unavailable, the chat response remains valid and omits the optional score; no persistence field is required in M0.5. The API terminology remains snake_case and must not revert to `naturalnessScore`.
- API metadata: `model_version` and `is_mock` are required on successful inference responses (`/v1/srs/schedule`, `/v1/chat/roleplay`). Supporting, health, and error responses do not inherit that invariant unless their contract explicitly defines those fields. `/health/live` and `/health/ready` are public operational checks, never a keep-warm dependency; `/health` is not canonical unless a compatibility alias is later approved.
- Exercise scope: MCQ and FILL_BLANK remain Must. `REORDER` is the approved third exercise for the “3+ types” requirement. A REORDER answer is correct only when the submitted index permutation exactly equals `correctOrder`; duplicate, missing, out-of-range, or repeated indices are invalid, and duplicate token text is disambiguated by index.
- Scope Gap Review resolution: the current Project 1 Vocabulary scope is published Course/Lesson vocabulary browsing, vocabulary audio playback, the three approved exercise types, and integration with the SRS review flow. Search/favorite lists, pronunciation scoring, a separate mastery model, and an additional standalone flashcard mode are not implied by the word “Vocabulary” and require a later approved requirement if desired.
- Grammar curriculum is not part of the current Project 1 scope. The only Grammar-related capability is the optional NLP-owned P2 `grammatical_acceptability_score`; Project 1 may display that field when available but does not own grammar lessons, grammar progress, or a separate Grammar schema.
- Vocabulary audio playback is part of the current learning flow, but it is not a scored `LISTENING` exercise. A scored `LISTENING` exercise remains deferred/P2 and is not one of the approved exercise types.
- “Quiz” may be used only as a user-facing/report label for the existing lesson exercise sequence. It does not introduce a separate Quiz entity, attempt/session history, timer, pass threshold, or result model; those semantics remain unapproved/deferred.
- SRS due state and Notification/Reminder delivery are separate concerns. The current Must SRS scope does not include notification delivery. Notification/Reminder remains deferred with no canonical priority unless a later human-approved requirement defines it.

### Project 1 — Software Engineering requirements

| ID | Priority | Requirement | Acceptance criteria | Evidence |
|---|---|---|---|---|
| P1-FR-001 | Must | Learner can register, log in, refresh an expired access token, and log out through Supabase Auth. | Valid credentials create an authenticated session; invalid credentials show an error; one expired-token refresh retries once; logout clears the local session. | Auth use case, Android E2E |
| P1-FR-002 | Must | Learner can browse published courses, lessons, and vocabulary and play available vocabulary audio. | Only published content is shown; lesson/vocabulary ordering is stable; available audio can be played; unavailable content/audio produces a recoverable empty/error state without a crash. This does not imply search, favorites, pronunciation scoring, separate mastery state, or an additional standalone flashcard mode. | Supabase query test, Android E2E |
| P1-FR-003 | Must | Learner can complete MCQ, FILL_BLANK, and REORDER exercises. | Each type validates its approved payload; correct/incorrect result is shown; progress is updated once per submission. A “Quiz” label, if used, refers to this sequence and does not imply separate Quiz/Attempt persistence. | Exercise unit/E2E tests |
| P1-FR-004 | Must | Learner can view and update lesson progress. | Status transitions are `NOT_STARTED → IN_PROGRESS → COMPLETED`; repeated completion is idempotent; progress is scoped to the authenticated learner. | Data/RLS tests |
| P1-FR-005 | Must | Learner can use intelligent review with AI and the documented fallback. | A successful schedule response renders priority and interval; an AI timeout/error within 8 seconds falls back to the due-card/default schedule path. Reminder/notification delivery is not part of this requirement. | SRS integration/E2E |
| P1-FR-006 | Must | Review submission is recorded atomically. | `record_review` rejects a card not owned by `auth.uid()`; valid calls insert one review log and update one SRS card in one transaction. | RPC/RLS integration test |
| P1-FR-007 | Must | Learner can run `hotel_booking` roleplay. | A valid turn returns `ai_reply`; unavailable optional grammar scoring does not fail the turn; scenario-not-found and unauthorized cases map to the documented errors. | Chat API/E2E |
| P1-FR-008 | Must | Admin can authenticate with ADMIN role and manage published learning content and chat scenarios. | STUDENT cannot write content; ADMIN can create/update/publish/unpublish approved entities; unauthorized writes are rejected. | Admin checklist, RLS tests |
| P1-FR-009 | Must | Admin can upload approved media through Supabase Storage. | Only ADMIN can write media; stored paths are associated with the owning content record; invalid type/size is rejected. | Storage policy test |
| P1-FR-010 | Must | The product supports approved UI/content locale behavior. | UI supports `vi` and `en`, defaults/falls back to `vi`; `ja` is P2; content follows requested locale → supported native locale → `vi` → `en` → explicit unavailable state. | Locale checklist |
| P1-FR-011 | Must | Product provides daily streak gamification. | A lesson-exercise session or vocabulary review qualifies; increment occurs at most once per local day using stored IANA timezone and `lastQualifyingActivityDate`; missed days reset the next qualifying streak to 1. | Profile/gamification tests |
| P1-NFR-001 | Must | API and data access preserve the documented security boundary. | Learners can access only own learner data; AI Server receives history but does not directly own/write primary Supabase data; ADMIN-only operations are enforced server-side. | RLS/security checklist |
| P1-NFR-002 | Must | The primary learning flow remains usable when AI is unavailable. | Course/lesson/progress flows remain available; SRS uses fallback; chatbot shows a recoverable error; no crash or indefinite spinner occurs. | Failure-mode E2E |
| P1-NFR-003 | Must | The contract remains backward-compatible after M0.5. | JSON fields remain snake_case; inference success responses include `model_version` and `is_mock`; optional grammar score may be omitted; no required field is silently renamed. | Contract test |
| P1-NFR-004 | Must | Android and Admin provide approved responsive/loading/empty/error states. | Each Must screen has loading, empty, error, and success behavior documented and manually verified. | UI checklist |

### ML — Personalized Vocabulary SRS requirements

| ID | Priority | Requirement | Acceptance criteria | Evidence |
|---|---|---|---|---|
| ML-FR-001 | Must | Train and evaluate DKT-LSTM as the research model. | The model produces next-interaction probability; training/evaluation runs reproduce recorded configuration and metrics. | Model report, registry |
| ML-FR-002 | Must | Implement HLR as baseline and production fallback. | HLR is evaluated independently; it can serve production fallback only after its own acceptance criteria pass. | Comparison table, registry |
| ML-FR-003 | Must | Keep Scheduler separate from DKT/HLR. | DKT/HLR output only `recall_probability`; Scheduler alone derives priority and interval. | Architecture diagram, API test |
| ML-FR-004 | Must | Evaluate SRS models against approved metrics and baselines. | AUC, Brier, latency and random/HLR baselines are recorded; CPU p50/p95 protocol is followed. | Evaluation tables |
| ML-NFR-001 | Must | Apply model acceptance criteria before production replacement. | A candidate is not production unless the approved AUC, Brier and latency conditions pass for its model family. | Model registry |

### NLP — English roleplay requirements

| ID | Priority | Requirement | Acceptance criteria | Evidence |
|---|---|---|---|---|
| NLP-FR-001 | Must | Support the `hotel_booking` domain. | The required scenario completes a multi-turn roleplay using the approved domain data. | Qualitative examples, E2E |
| NLP-FR-002 | Must | Implement and explain tokenization, attention, and seq2seq behavior. | The report includes tokenization evidence, attention explanation/heatmap, teacher-forcing versus autoregressive inference, and a working self-written Transformer path. | NLP report |
| NLP-FR-003 | Must | Use T5-small as the production chatbot model. | Production metadata identifies T5-small; its evaluation follows the approved protocol. | Model registry, API `/v1/model/info` |
| NLP-FR-004 | Must | Evaluate chatbot quality with approved separate metrics. | Loss/perplexity/Distinct-n and Inform/Success are reported without an invented combined score; qualitative examples are included. | NLP evaluation |
| NLP-FR-005 | Nice | Provide optional grammar acceptability scoring. | When available, API returns a score in `[0,1]` using `grammatical_acceptability_score`; when unavailable, the field is omitted and chat still succeeds. | Optional API tests |
| NLP-NFR-001 | Must | Preserve API/domain isolation and latency policy. | Chat requests use `snake_case`, `lang=en`, approved error envelope, and production-like CPU latency measurement. | Contract/latency tests |

Requirement-to-architecture/data/API/test traceability is maintained in [05-traceability-matrix.md](05-traceability-matrix.md).

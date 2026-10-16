# 00 - Lingora Master Plan (Phase 0 Historical Baseline)

> **CLASSIFICATION: HISTORICAL / SUPERSEDED REFERENCE ONLY — NOT CURRENT PRODUCT OR MILESTONE AUTHORITY.**
> This document records the historical Phase 0 baseline (2026-09-14) and ADR-014. It is retained strictly for academic auditability, background rationale, and roadmap evolution history.
> - **Role model:** The 6-role model below was formally superseded on 2026-10-10 by ADR-034 (exactly 3 business roles: `Admin`, `Teacher`, `Learner`). Do NOT use the 6-role model for current design or implementation.
> - **AI scope:** AI / GEC is a supporting capability, currently OUT OF SCOPE for active Phase 2 implementation, testing, demo, and acceptance.
> - **Current roadmap & tasks:** Phase 0 priority tiers (P0/P1/P2) and forward roadmap below are historical records; current task authority lives only in `plans/current-task.md`, and current domain design is at Class Diagram (IN PROGRESS).
>
> **Phase 0 Canonical Baseline (aligned 2026-09-14 & ADR-014 — Historical Context):**
> LINGORA was structured as a **Software Engineering CORE** language learning system with an **AI SUPPORTING CAPABILITY** (Grammatical Error Correction - GEC).
> Canonical Phase 0 reference documents:
> - [`docs/archive/phase-0/phase-0-roles-and-mvp-final.md`](archive/phase-0/phase-0-roles-and-mvp-final.md) (historical 6 roles, 19 MVP functions).
> - [`docs/phase-0-survey-requirements.md`](phase-0-survey-requirements.md) & [`docs/phase-0-mock-survey-report.md`](phase-0-mock-survey-report.md) (Requirements & survey findings).
> - Canonical Phase 0 PlantUML diagrams in [`docs/plantuml/`](plantuml/) (`use-case-mvp-overview`, `role-permission-matrix`, `system-architecture-mvp`, etc.).
> ADR-014 formally supersedes ADR-010's "two equal academic tracks": Software Engineering is the primary system core, and GEC is a supporting capability via pretrained model or external API without requiring local training pipelines. DKT-LSTM, HLR, DQN, and generative MultiWOZ dialogue are **SUPERSEDED** historical targets.

## Phase 0 & ADR-014 Target Scope and Roadmap

| Area | Current Target |
|---|---|
| Product | Web language-learning platform covering 6 roles and 19 MVP functions across 5 target languages (English first) |
| System Core | Software Engineering: Web (`lingora-web`), Admin (`lingora-admin`), Supabase DB + RLS, Auth, Content lifecycle |
| Roles | 6 canonical roles: Administrator, Lesson Creator, Moderator, Operations Staff, Learner, Organizational Manager |
| Workflow | Content workflow: Draft → In Review → Changes Requested → Approved → Published → Archived |
| Supporting AI | GEC via pretrained model or external API (stateless internal processing, pluggable provider) |
| SRS | Deterministic rule-based scheduling; exact SM-2 naming requires RPC audit |
| Practice | Structured lesson exercises (MCQ, FILL_BLANK, REORDER) + Scenario writing with GEC feedback |
| Data | Phase 0 Target Schema (6 roles, 6-state content lifecycle, Unit hierarchy, clean learning models); migration history preserved |
| Reports | Software Engineering core report and academic presentation |

### Current Priority Tiers (Phase 0 MVP)

| Tier | Contents |
|---|---|
| P0 | Core Web Learner (Auth, Course/Lesson/Vocab, 3 core exercise types, progress, deterministic SRS, profile/streak), Content Draft & Approval workflow, Admin basic management, GEC API mock/proxy, SE and ML/GEC reports |
| P1 | Real T5-small checkpoint, ERRANT evaluation, accessible diff UI, multi-language rollout (Vietnamese, French, Chinese, Japanese A1/HSK1/N5), operations support, production deployment |
| P2 | Organizational cohort module, speech input/playback UI, quantization/ONNX, advanced operational analytics |

### Forward Roadmap

| Order | Milestone/task | Outcome |
|---|---|---|
| 1 | Phase 0 Reconciliation | Single source of truth across 11 layers, 6 roles, 19 MVP functions, Superpowers workflow |
| 2 | M2 Web core lesson flow | One lesson end-to-end and approved exercise engine (MCQ, FILL_BLANK, REORDER) |
| 3 | Deterministic SRS audit | Lock RPC policy and due-card query behavior |
| 4 | GEC API foundation | New GEC endpoint (`/v1/gec/correct`), mock, typed proxy and contract tests |
| 5 | Scenario writing UI | Ordered prompts and safe original/corrected diff display |
| 6 | Content & Review UI (M3) | Draft, review, approve, and publish workflow for Creator, Moderator, Admin |
| 7 | ML training/evaluation | Licensed dataset, T5-small, F0.5/ERRANT and latency evidence |
| 8 | Compatibility cleanup | Deprecate, then later remove unused legacy AI endpoints |
| 9 | Final delivery | Production deployment, SE report, ML/GEC report and presentation |

Current delivery rules: preserve the fixed Next.js proxy and stateless FastAPI boundary; T5-small produces corrected text only; keep the current SRS data/RPC boundary; preserve all historical evidence; migrate consumers before endpoint deprecation; and report cold start separately from the warm CPU p95 target of 2,000 ms.

> **Canonical status:** Phase 0 reconciled baseline. The sections below preserve legacy v1-v5 planning text as historical context.

---

## [SUPERSEDED / HISTORICAL REFERENCE] Migrated source: overview and roadmap (v5)

> **Historical Context Note:** Sections 0.1–0.5 below represent the earlier v1–v5 planning drafts prior to the Phase 0 baseline reset and ADR-010 consolidation. In particular:
> - **G3 (ML/NLP):** Originally planned DKT-LSTM and MultiWOZ dialogue. Superseded by Deterministic SRS + T5-small GEC.
> - **Actors/Roles:** Originally simplified to Learner/Admin. Superseded by Phase 0 canonical 6 roles (`Administrator`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`, `Organizational Manager`).
> - **Target Languages:** Originally English only. Phase 0 expands the roadmap to 5 languages with English as the initial pilot.

### 0.1. Giả định lịch sử & Cập nhật Phase 0

| # | Giả định gốc | Trạng thái hiện tại (Phase 0 & ADR-010) |
|---|---|---|
| G1 | Thời gian còn lại ~12 tuần (từ 13/08/2026) | Tiến độ theo từng milestone có gate kiểm soát |
| G2 | Ngôn ngữ học: English; UI: `vi`, `en`, `ja` | Mở rộng MVP sang 5 ngôn ngữ (English, Vietnamese, French, Chinese, Japanese) với English pilot đầu tiên |
| G3 | ML = DKT-LSTM / HLR; NLP = Chatbot Roleplay | **SUPERSEDED by ADR-010:** SRS dùng deterministic rule-based; AI model duy nhất là T5-small GEC cho tiếng Anh |
| G4 | Làm việc cá nhân / AI Pair-programming | AI workflow chuẩn hóa trên **Superpowers** với 2 agents: Codex (plan/review) và Antigravity (implement/test) |
| G5 | GPU: Google Colab / Kaggle miễn phí (T4/P100) | Giữ nguyên cho việc fine-tune và benchmark T5-small GEC |
| G6 | Chưa có dữ liệu tương tác thật của user | Bắt buộc dùng dataset công khai có bản quyền rõ ràng cho GEC; không ngụy tạo số liệu |

### 0.2. Nguyên tắc xuyên suốt

1. **Mỗi tuần phải có một trạng thái hệ thống chạy được** (chạy trên môi trường dev/preview là đủ) — **không bắt buộc deploy production mỗi tuần**. Bản production build chỉ cần công bố tại các mốc chính (`M0…M5`, bản final).
2. **Mock trước, thật sau.** Mọi màn hình Web đều phải chạy được với dữ liệu giả trước khi cắm API thật.
3. **AI là tính năng cộng thêm, không phải điểm chặn.** App phải demo trọn vẹn kể cả khi 1 trong 2 model AI chết (xem `05`).
4. **Viết báo cáo song song, không dồn cuối.** Mỗi khi làm xong 1 thứ → chụp hình / lưu số liệu ngay vào `docs/`.
5. **Hai tính năng AI độc lập nhau.** SRS (ôn tập) và Chatbot (roleplay) không phụ thuộc lẫn nhau về code lẫn lịch trình — nếu 1 cái trễ, cái kia vẫn demo được.
6. **NLP không được phép làm chậm SE.** Nếu Transformer/Chatbot chưa train xong, Web/Admin vẫn phải tiếp tục tiến độ bình thường bằng `MOCK_MODE` — tuyệt đối không dồn tích hợp client vào tuần 11.
7. **Không nâng version thư viện/tool giữa chừng** nếu không bắt buộc (xem `03`) — tránh vỡ project vì update.

---

### 0.3. Thứ tự ưu tiên (khi cần cắt giảm nhanh)

| Mức | Nội dung |
|---|---|
| **P0 — bắt buộc** | Database, Auth, Lesson, Vocabulary, MCQ, Fill-blank, Admin cơ bản, API contract, **SRS** (DKT hoặc HLR — ít nhất 1 model thật), **Roleplay** (ít nhất 1 kịch bản), Web production build, 3 báo cáo |
| **P1 — rất nên có** | DKT-LSTM *và* HLR (cả 2, không chỉ 1), T5-small production, RLS đầy đủ, cache dữ liệu phía client (TanStack Query persisted cache), UI đa ngôn ngữ (`vi`/`en`), Testing, Deployment production |
| **P2 — chỉ làm khi còn thời gian** | Bộ chấm `grammatical_acceptability_score` (CoLA), attention visualization đầy đủ, DailyDialog, UI `ja`, ONNX/quantize, thống kê nâng cao ở Admin |

#### Phương án rút gọn nếu deadline chỉ còn ~8 tuần
Cắt toàn bộ P2 + phần domain phụ của P1: bỏ `ja`, `LISTENING`/`MATCHING`, DailyDialog, chỉ giữ 1 kịch bản `hotel_booking`, chỉ 1 model SRS (ưu tiên HLR vì nhẹ, DKT nếu còn dư thời gian), chỉ T5-small (bỏ nhánh Transformer tự viết nếu thực sự không kịp — nhưng đây là lựa chọn cuối cùng vì mất điểm "hiểu kiến trúc" của cả ML lẫn NLP).

### 0.4. Lộ trình 12 tuần (Dual-Track)

Mốc `M*` là **cửa chặn (gate)**: chưa xong mốc thì không được nhảy sang việc tuần sau.

| Tuần | Track 1 — Phần mềm (SE) | Track 2 — AI (ML: SRS · NLP: Chatbot) | Mốc |
|---|---|---|---|
| **1** | Chốt scope & wireframe (Figma). Vẽ ERD v1. Viết `schema.prisma`. Tạo Supabase project. Tạo các repo Git. | Thu thập dataset: **ASSISTments 2009-2010** (Knowledge Tracing), **Duolingo HLR dataset** (spaced repetition), **MultiWOZ 2.2** + **DailyDialog** (hội thoại). Đọc paper DKT, Half-Life Regression, MultiWOZ. Dựng notebook EDA cho cả 2 nhánh. | **M0**: chốt xong `docs/03-api-contract.md` v1 + ERD |
| **2** | `prisma migrate` lên Supabase. Viết SQL cho RLS + trigger tạo profile. Seed 1 course / 5 lesson / 50 từ + 1 chat scenario. Test PostgREST bằng Postman. | **SRS:** mã hoá chuỗi tương tác (skill_id, correct, Δt) từ ASSISTments; chuẩn hoá theo user. **Chatbot:** chuẩn hoá Unicode, cắt lượt hội thoại (turns), train tokenizer SentencePiece chung. Thống kê phân bố. | |
| **3** | FastAPI skeleton + `MOCK_MODE=true` → deploy Render. Web skeleton: Next.js App Router + API client + Login/Register (Supabase Auth). | **SRS:** viết **DKT-LSTM tự viết** (PyTorch), test overfit trên 50 chuỗi (sanity check). **Chatbot:** viết **Transformer encoder–decoder tự viết**, test overfit trên 100 hội thoại. | **M1**: login thật + gọi được API mock (cả 2 endpoint) |
| **4** | Web: danh sách Course → Lesson (đọc từ Supabase RPC). Đa ngôn ngữ UI (i18n `vi`/`en`, `ja` optional). Cache dữ liệu phía client (TanStack Query persisted cache). | **SRS:** train DKT-LSTM trên ASSISTments đầy đủ, log TensorBoard (AUC/loss theo epoch). **Chatbot:** train Transformer tự viết trên **MultiWOZ domain `hotel` (subset nhỏ)** — mục tiêu là chứng minh hiểu kiến trúc, không cần chất lượng cao. | |
| **5** | Web: chi tiết bài học, học từ vựng (audio), bài tập MCQ + Fill-blank, chấm điểm, lưu `user_progress`. Thêm RPC `record_review` (server-side transaction). | **SRS:** train baseline **Half-Life Regression** so sánh với DKT-LSTM; viết **Scheduler** (module riêng, nhận `recall_probability` từ DKT/HLR → suy ra `recommended_interval_days` bằng chính sách rõ ràng, ví dụ biến thể SM-2 có trọng số). **Chatbot:** fine-tune **T5-small** (chỉ 1 model pretrained, không làm DialoGPT) trên MultiWOZ domain hotel làm nhánh production. | **M2**: học trọn 1 bài end-to-end |
| **6** | Web Admin: Next.js + Supabase Auth (chặn role ADMIN), CRUD Course / Lesson / Vocabulary, CRUD Chat Scenario. | **SRS:** hyperparameter search (hidden size, lr, dropout, window length) → bảng AUC; chốt **Model acceptance criteria** (xem `04`). **Chatbot:** hyperparameter search (lr, batch, warmup, beam size) → bảng loss/perplexity. | |
| **7** | Web Admin: CRUD Exercise, upload audio/ảnh, bảng danh sách user. | **SRS:** đánh giá AUC / Brier score / calibration trên tập test ASSISTments + mô phỏng lịch ôn thực tế. **Chatbot:** đánh giá **Loss/Perplexity/Distinct-n** (nhánh tự viết) + **Inform/Success** (nhánh T5-small trên MultiWOZ); BLEU chỉ ghi tham khảo. Nếu còn thời gian: thêm DailyDialog + bộ chấm `grammatical_acceptability_score` (CoLA) — coi là P2. | **M3**: Admin đủ dùng để nhập liệu |
| **8** | Web: màn **"Ôn tập thông minh"** → gọi `/v1/srs/schedule` + ghi review qua `record_review`. Màn **"Luyện hội thoại"** → gọi `/v1/chat/roleplay`. **Chỉ cần 1 trong 2 API chạy model thật ở cuối tuần này**, API còn lại chạy `MOCK_MODE` tạm. | Hoàn thiện model production cho nhánh đang dẫn trước; nhánh còn lại tiếp tục train song song. Đo p50/p95 latency cho API đã chạy thật. Quantize/ONNX chuyển thành P2 (không bắt buộc). | **M4**: ≥1 API AI chạy thật, API còn lại mock ổn định |
| **9** | Màn Profile, biểu đồ tiến độ. Lưu review log thật từ user vào `review_logs` qua `record_review`. | Chốt nốt model production của nhánh AI còn lại (đạt **M4.5**: cả 2 AI chạy thật). Viết chương ML: kiến trúc DKT/HLR/Scheduler, loss, optimizer, biểu đồ huấn luyện. | **M4.5**: cả 2 tính năng AI đã cắm thật vào app |
| **10** | Unit test + UI test, sửa bug, polish UI/UX, dark mode, xử lý trạng thái lỗi/rỗng/loading. | Viết chương NLP: tokenization, embedding, attention (must-have), đánh giá hội thoại. | **M5**: Feature freeze — cấm thêm tính năng |
| **11** | Deploy production bản final: Web learner + Admin trên Vercel, AI Server trên Render. Viết tài liệu SE: Use Case, Activity, Sequence, ERD, test case. | Ablation study (cả 2 nhánh) + phụ lục kết quả. | |
| **12** | Tập demo 3 lần (có bản offline dự phòng). Làm 3 bộ slide. Rà soát trích dẫn. | | **Nộp** |

#### Nếu bị chậm — thứ tự cắt tính năng (cắt từ trên xuống, khớp với bảng ưu tiên 0.3)
1. Bộ chấm `grammatical_acceptability_score` (CoLA) → bỏ, chatbot chỉ trả lời, không chấm điểm
2. DailyDialog + domain phụ (`restaurant`, `taxi`) → chỉ giữ `hotel_booking`
3. Ngôn ngữ UI `ja` → chỉ giữ `vi` + `en`
4. Bài tập `MATCHING` (giữ MCQ + Fill-blank + REORDER + `GRAMMAR` + `LISTENING`) — **`LISTENING` đã được đưa ra khỏi danh sách cắt**: ADR-006 (2026-08-15) duyệt `LISTENING` mức từ vựng thành phạm vi bắt buộc, nên không còn là mục được phép cắt
5. Cache dữ liệu phía client (TanStack Query persisted cache) → chỉ cần loading spinner
6. **DKT-LSTM tự viết** → chỉ dùng Half-Life Regression làm model production (**cảnh báo**: mất điểm phần "kiến trúc mạng neural" của môn ML, cắt gần cuối)

**Tuyệt đối không cắt**: luồng Auth, luồng học 1 bài, **ít nhất 1 trong 2 API AI phải chạy model thật** (API còn lại được phép chạy `MOCK_MODE`), 3 bộ tài liệu báo cáo, và **4 hạng mục phạm vi đề bài đã duyệt ở ADR-006** (`GRAMMAR`, `LISTENING` mức từ vựng, daily study goal, local reminder).

---

### 0.5. Checklist sản phẩm bàn giao cuối kỳ

**Phần mềm**
- [ ] Web learner live trên Vercel (production URL, có account demo learner) + báo cáo Lighthouse
- [ ] Web Admin live trên Vercel (có account demo admin)
- [ ] AI Server live (Render/HF Spaces) + link `/docs` (Swagger), có cả 2 endpoint `/v1/srs/schedule` và `/v1/chat/roleplay`
- [ ] Các repo Git có README, `.env.example`, ảnh chụp màn hình

**Tài liệu**
- [ ] Báo cáo Đồ án KNPM + phụ lục sơ đồ
- [ ] Báo cáo ML (Knowledge Tracing/SRS + Scheduler) + notebook `train_dkt.ipynb`, `train_hlr.ipynb` chạy lại được
- [ ] Báo cáo NLP (Chatbot, domain hotel) + notebook `preprocess_dialog.ipynb`, `train_seq2seq.ipynb`, `finetune_t5small.ipynb`, `analysis.ipynb`
- [ ] `docs/03-api-contract.md` (bản chốt cuối, gồm 2 tính năng AI)
- [ ] 3 bộ slide

**Dữ liệu / mô hình**
- [ ] Checkpoint model DKT-LSTM + HLR + `model_card_srs.md`
- [ ] Checkpoint model Chatbot (Transformer tự viết + bản fine-tune) + `model_card_chatbot.md`
- [ ] File CSV kết quả hyperparameter search (2 bộ)
- [ ] Ảnh biểu đồ loss/AUC/perplexity độ phân giải cao (PNG/SVG)


## Migrated source: implementation method

## 04 — Phương pháp Triển khai (bản v3 — khóa baseline triển khai)

> **Cập nhật theo review ngoài:** hoàn thiện mục 4.6 "Model Acceptance Criteria" — tách DKT/HLR, giới hạn cách so sánh perplexity, chuẩn hóa phép đo latency và bổ sung thông tin tái lập trong Model Registry.

### 4.1. API-First Approach — thứ tự làm từng bước

Tránh bẫy kinh điển "vẽ UI xong không có dữ liệu thật để nối". Thứ tự bắt buộc cho **mỗi tính năng**:

```
1. Thiết kế bảng liên quan trong schema.prisma
2. Viết/khoá `docs/03-api-contract.md` cho endpoint liên quan (nếu có gọi AI Server)
3. `prisma migrate dev` → có bảng thật trên Supabase
4. Viết RPC / policy RLS cần thiết → test bằng Postman
5. (Nếu có AI) Dựng endpoint FastAPI, chạy MOCK_MODE=true trả dữ liệu giả đúng shape response
6. Web: viết typed API client + type khớp 100% với contract → build UI cuối cùng
7. Khi model AI train xong → đổi MOCK_MODE=false, không cần sửa gì phía Web
```

Áp dụng cụ thể cho 2 tính năng AI:
- **SRS**: bảng `user_vocab_srs`/`review_logs` → contract `/v1/srs/schedule` → mock trả `recall_probability` ngẫu nhiên hợp lý → Web màn "Ôn tập thông minh" chạy được từ tuần 3 → cắm model thật tuần 8.
- **Chatbot**: bảng `chat_scenarios`/`chat_sessions`/`chat_messages` → contract `/v1/chat/roleplay` → mock trả câu trả lời cố định theo kịch bản → Web màn "Luyện hội thoại" chạy được từ tuần 3 → cắm model thật tuần 8.

### 4.2. Dual-Track Agile (đường đua song song)

Vì làm 1 mình 3 vai, "Track" ở đây là **2 loại công việc chạy xen kẽ trong cùng 1 tuần**, không phải 2 người làm song song:

- **Track 1 (Phần mềm)**: việc có tính "chạy nước rút" — mỗi buổi làm xong là thấy ngay kết quả trên UI/DB.
- **Track 2 (AI/Nghiên cứu)**: việc có tính "chạy ngầm" — train model có thể mất hàng giờ chạy nền (Colab) trong khi vẫn làm Track 1 ở máy chính.

Quy tắc phân bổ thời gian trong tuần (gợi ý, điều chỉnh theo lịch cá nhân):
- Đầu tuần: khởi động job train (Colab/Kaggle) cho Track 2, để chạy nền.
- Giữa tuần: tập trung Track 1 trong lúc chờ; kiểm tra TensorBoard định kỳ (checkpoint mỗi epoch).
- Cuối tuần: đánh giá kết quả Track 2, quyết định train tiếp hay chuyển hyperparameter khác cho tuần sau.

### 4.3. Git Flow

4 boundary code riêng biệt (`lingora-web`, `lingora-admin`, `lingora-ai`, và `docs/` + `plans/` + `logs/` của workspace), mỗi repo dùng nhánh đơn giản phù hợp làm việc 1 mình:

```
main        — luôn build được, là bản dùng để demo
feature/*   — mỗi tính năng 1 nhánh (vd feature/srs-schedule, feature/chat-roleplay)
```

- Commit message dạng `feat(srs): thêm endpoint /v1/srs/schedule` / `fix(web): sửa crash màn chat khi mất mạng` (Conventional Commits) — giúp về sau viết changelog cho báo cáo dễ hơn.
- Tag version mỗi khi qua 1 Mốc (`M1`, `M2`...) → dùng để chứng minh tiến độ thật với hội đồng nếu cần.
- `docs/03-api-contract.md` là **bản canonical duy nhất được phép chỉnh sửa trực tiếp**. Nếu sau này cần bản sao trong `lingora-web`, `lingora-admin`, hoặc `lingora-ai`, script đồng bộ phải lấy từ file canonical này và kiểm tra checksum; không sửa trực tiếp các bản sao.

### 4.4. Definition of Done (DoD) — cho từng loại công việc

| Loại việc | DoD |
|---|---|
| 1 màn hình Web | Chạy được với dữ liệu mock, xử lý được 3 trạng thái: loading / rỗng / lỗi, không vỡ layout ở breakpoint mobile và desktop |
| 1 endpoint FastAPI | Có trong Swagger `/docs`, có test bằng Postman với cả input hợp lệ và input lỗi, trả đúng envelope lỗi |
| 1 lần train model | Có checkpoint lưu lại, có log TensorBoard, có ghi số liệu (loss/AUC/perplexity cuối) vào bảng kết quả trong `docs/` |
| 1 API CRUD Admin | Có validate (zod), có xử lý lỗi hiển thị cho người dùng, test thêm/sửa/xoá thành công |
| 1 Mốc (`M*`) | Tất cả DoD ở trên đạt cho toàn bộ tính năng thuộc mốc đó + đã chụp ảnh/lưu bằng chứng vào `docs/` |

### 4.5. Chiến lược Test

| Tầng | Loại test | Công cụ |
|---|---|---|
| Web learner | Unit test (component, hook, API client — mock `fetch`) | Vitest + Testing Library |
| Web learner E2E | Chạy app thật qua API client tới backend cho 2–3 luồng quan trọng (Login, Học 1 bài, Ôn tập thông minh); bổ sung kiểm thử thủ công cho luồng Chatbot | Playwright + checklist thủ công |
| Web Admin | Test thủ công theo checklist CRUD (không bắt buộc viết test tự động do thời gian hạn chế) | Checklist tay |
| AI Server | Unit test cho từng service (`srs_inference`, `chat_inference`) với input giả lập; test endpoint bằng `TestClient` của FastAPI | pytest |
| Model ML/NLP | "Test" = overfit trên tập nhỏ trước khi train full (sanity check bắt buộc, xem lộ trình tuần 3) | script riêng, không phải unit test cổ điển |
| Tích hợp API | Test API client → Supabase/FastAPI, gồm auth, contract, lỗi và fallback; không coi đây là kiểm thử Web client | Postman/Bruno |

Bảng ≥ 25 test case (yêu cầu ở file `02`) nên phủ đều: Auth (5), Học bài + bài tập (6), SRS (5, gồm cả case AI Server timeout), Chatbot (5, gồm case scenario không tồn tại), Admin CRUD (4+).

### 4.6. Model Acceptance Criteria (bắt buộc, áp dụng cho cả DKT-LSTM/HLR và Chatbot)

**Vấn đề cần tránh:** sau mỗi lần train lại (đổi hyperparameter, thêm dữ liệu...), rất dễ mắc sai lầm "model mới train xong nên chắc tốt hơn, deploy luôn". Cần một ngưỡng chấp nhận rõ ràng trước khi thay model production:

| Model / trường hợp | Điều kiện để được thay model production hiện tại |
|---|---|
| DKT-LSTM | So với **DKT production hiện tại**: `AUC_new ≥ AUC_current`, `Brier_new ≤ Brier_current`, `p95_latency_new ≤ 300ms` |
| HLR | So với **HLR production hiện tại**: `AUC_new ≥ AUC_current`, `Brier_new ≤ Brier_current`, `p95_latency_new ≤ 300ms` |
| DKT → HLR fallback | HLR phải đạt acceptance riêng của HLR trước khi được đánh dấu là production fallback. Random baseline `AUC = 0.5` chỉ là sanity check; HLR là baseline thực nghiệm chính để đánh giá DKT. |
| Transformer / T5-small | Trong **cùng model family và cùng evaluation protocol**: `Perplexity_new ≤ Perplexity_current`, nếu có nhãn thì `Success_new ≥ Success_current`, và `p95_latency_new ≤ 500ms`. Không so perplexity trực tiếp giữa Transformer tự viết và T5-small nếu tokenizer/cách tính khác nhau. |

Khi so sánh **Transformer tự viết với T5-small**, báo cáo riêng `Inform`, `Success`, BLEU tham khảo, `Distinct-n` và một tập ví dụ định tính do người đánh giá xem xét; không tạo "combined score" tùy ý.

**Protocol đo latency:** chạy trên môi trường CPU gần production, `batch_size=1`; warm-up 10 request, sau đó đo ít nhất 100 request và báo cáo cả p50/p95. Ghi rõ cấu hình CPU, model version và môi trường chạy trong kết quả. Không dùng số đo local GPU để quyết định acceptance cho bản deploy CPU.

Quy trình thực hành đơn giản (không cần CI/CD phức tạp, phù hợp làm 1 mình):
1. Sau mỗi lần train, chạy script `evaluate.py` → ghi kết quả vào `logs/model-registry.csv` (tối thiểu: `version`, `date`, `model_type`, `dataset`, `dataset_version`, các metric chính, p50/p95 latency, `git_commit`, `config_hash`, `is_production`).
2. So sánh dòng mới nhất với dòng đang đánh dấu `is_production=true`.
3. Nếu đạt tiêu chí ở trên → đổi cờ `is_production`, cập nhật checkpoint AI Server dùng.
4. Nếu không đạt → giữ nguyên model cũ, dòng mới chỉ lưu lại làm dữ liệu cho phần "hyperparameter search"/"ablation" trong báo cáo — **không** phải là thất bại, vẫn là nội dung hợp lệ để trình bày.

File `logs/model-registry.csv` này cũng là bằng chứng tốt để chụp vào báo cáo ML/NLP, chứng minh quá trình chọn model có hệ thống chứ không phải chọn tuỳ tiện.


## Migrated source: risks

## 05 — Rủi ro & Triển khai (bản v3 — khóa baseline triển khai)

> **Cập nhật theo review ngoài:** hoàn thiện cấu trúc Primary/Fallback/Emergency, mock deterministic, contract một nguồn và cách diễn đạt baseline DKT/HLR trước khi khóa kế hoạch.

### 5.1. Bảng rủi ro + phương án giảm thiểu

| # | Rủi ro | Xác suất | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|---|
| R1 | DKT-LSTM không hội tụ, không vượt random baseline (`AUC = 0.5`) hoặc không vượt HLR baseline sau tuning | Trung bình | Mất nội dung chính báo cáo ML | Sanity check overfit tập nhỏ ở tuần 3 (bắt buộc). Random chỉ là sanity baseline; **HLR là baseline thực nghiệm chính**. Nếu DKT không vượt random hoặc không vượt HLR sau tuning, HLR được dùng làm production fallback sau khi đạt acceptance riêng; DKT-LSTM vẫn là đề tài nghiên cứu chính và được trình bày như thử nghiệm/ablation. |
| R2 | Không đủ thời gian train Transformer chatbot tự viết | Trung bình | Thiếu nội dung attention/embedding cho NLP | Ưu tiên train trên tập đã lọc nhỏ (chỉ domain hotel), giảm `n_layers` xuống 2+2 nếu cần |
| R3 | Render/HF Spaces free tier ngủ, latency demo cao | Cao | Demo bị đứng hình, mất điểm phần trải nghiệm | Xem cấu trúc **Primary/Fallback/Emergency** ở mục 5.1b — **không** dựa vào việc ping giữ ấm làm chiến lược chính |
| R4 | Chưa có dữ liệu user thật cho SRS → model "ảo", không phản ánh đúng học viên Lingora | Cao (biết trước) | Hội đồng ML hỏi "vậy áp dụng thực tế thế nào?" | Trả lời sẵn: dùng dataset chuẩn để **kiểm chứng phương pháp** (so được với paper gốc, ví dụ AUC~0.75-0.85 như paper DKT gốc), **không** khẳng định model đã "cá nhân hoá chính xác việc học từ vựng của Lingora"; nêu rõ hướng fine-tune/adaptation bằng `review_logs` khi có user thật — đây là câu trả lời chặt, không phải điểm yếu nếu trình bày đúng cách |
| R5 | MultiWOZ/ASSISTments dataset có license hạn chế việc nộp kèm | Thấp | Không nộp được raw data trong repo | Chỉ nộp script tải (`download_data.py`) + checksum, ghi rõ nguồn trong `model_card.md`, không commit raw data vào Git |
| R6 | 1 trong 2 tính năng AI trễ tiến độ so với 1 tính năng còn lại | Trung bình | Nguy cơ thiếu 1 phần báo cáo NLP hoặc ML | 2 nhánh AI độc lập hoàn toàn — nhánh trễ chạy `MOCK_MODE=true` khi demo, nhánh kịp thì chạy thật. Milestone phản ánh đúng việc này: `M4` chỉ yêu cầu ≥1 nhánh chạy thật, `M4.5` mới yêu cầu cả 2 (xem `00`) |
| R7 | Quên viết báo cáo, dồn hết vào 2 tuần cuối | Cao (thói quen phổ biến) | Báo cáo sơ sài, thiếu ảnh minh hoạ thật | Nguyên tắc 0.2 mục 4: mỗi khi xong 1 mốc → chụp ảnh/lưu số liệu ngay; tuần 9–10 dành riêng cho viết báo cáo. Ưu tiên làm đủ nội dung **[Must]** trước, **[Nice]** chỉ làm nếu còn dư (xem `02`) |
| R8 | Google Colab ngắt session giữa lúc train | Trung bình | Mất công train lại từ đầu | `save_checkpoint(epoch)` mỗi epoch lên Google Drive + script `resume_from_checkpoint`, bắt buộc từ lần train đầu tiên |
| R9 | Supabase free tier tạm dừng project do không hoạt động lâu | Thấp | Mất dữ liệu demo | Đăng nhập/truy vấn Supabase định kỳ (ít nhất 1 lần/tuần) trong suốt 12 tuần; có `seed.ts` để khôi phục nhanh nếu cần |
| R10 | Deploy nhầm 1 model mới tệ hơn model cũ (do quên so sánh) | Thấp | Chất lượng gợi ý/chatbot tụt trước ngày demo mà không hay biết | Tuân thủ **Model Acceptance Criteria** (xem `04` mục 4.6) trước mọi lần đổi checkpoint production |
| R11 | Client tự tính và ghi `nextReviewAt`/`intervalDays` bị lệch với server (ví dụ do mất mạng giữa 2 lệnh ghi) | Trung bình | Lịch ôn tập sai, khó debug | Bắt buộc đi qua RPC `record_review` (transaction 1 lần, xem `01` mục 1.3c) thay vì client tự ghi rời rạc |
| R12 | Tên đề bài gốc ghi "nền tảng di động" nhưng learner client là Web (ADR-008) | Đã xảy ra (rủi ro được chấp nhận có ý thức) | Có thể bị trừ điểm khi đối chiếu với tên đề bài | `ADR-008` (2026-08-17) ghi rõ ngày, lý do và việc rủi ro được chấp nhận có ý thức — đó là căn cứ bảo vệ nếu bị chất vấn. Xác nhận lại với giảng viên là việc của con người, không phải việc của agent |

### 5.1b. Chiến lược chống "Render ngủ" — Primary / Fallback / Emergency

Không nên coi việc ping `/health` định kỳ để giữ server "ấm" là chỗ dựa chính (không đáng tin cậy về lâu dài, và không phải bài học kiến trúc đáng trình bày). Thay vào đó, thiết kế 3 lớp rõ ràng — đúng tinh thần Risk Management đã có sẵn trong tài liệu:

| Lớp | Là gì | Khi dùng |
|---|---|---|
| **Primary** | AI Server thật trên Render/HF Spaces | Trường hợp bình thường |
| **Fallback** | `MOCK_MODE=true` (SRS) hoặc `get_due_srs_cards` RPC (mục 01.3) | AI Server timeout (>8s) hoặc trả lỗi `MODEL_UNAVAILABLE` |
| **Emergency** | `ngrok` trỏ vào AI Server chạy localhost trên laptop cá nhân | Chỉ dùng trong buổi demo trực tiếp nếu Primary sập đột ngột, chuẩn bị sẵn trước giờ demo (không phải giải pháp vận hành lâu dài) |

Web implement: timeout 8s cho mọi call tới AI Server (đặt tại Route Handler proxy của `lingora-web`) → tự động rơi xuống Fallback, hiển thị nhãn nhỏ "đang dùng chế độ rút gọn" thay vì để màn hình treo hoặc lỗi trắng.

Quy tắc trước buổi demo: **Primary phải được kiểm thử**, **Fallback phải được kiểm thử và đủ sức hoàn thành toàn bộ flow**, còn Emergency chỉ được chuẩn bị như phương án bổ sung để chứng minh AI thật. Demo không được phụ thuộc vào `ngrok` để hoàn thành luồng chính.

## Migrated source: deployment, secrets, demo and citations

### 5.4. Runbook Deploy (bản final, tuần 11)

#### AI Server (Render / Hugging Face Spaces)
1. Đóng gói `Dockerfile` (base `python:3.11-slim`), cài `requirements.txt`.
2. Copy checkpoint model đã export (DKT-LSTM `.pt`, HLR `.json` hệ số, Chatbot `.pt`/`safetensors`) vào image hoặc tải từ Drive lúc start (nếu image quá nặng cho free tier).
3. Set biến môi trường: `SUPABASE_JWT_SECRET`, `MOCK_MODE=false`, `MODEL_DIR`.
4. Health-check endpoint `/health` cấu hình trong Render để tự khởi động lại nếu crash.
5. Test bằng Postman collection đã chuẩn bị trước khi coi là "final".

#### Web Admin (Vercel)
1. Kết nối repo GitHub → Vercel tự build khi push `main`.
2. Set env `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only) trong Vercel dashboard.
3. Chạy `npx prisma migrate deploy` (không dùng `migrate dev` ở production).

#### Web learner (Vercel)
1. Kết nối repo GitHub `lingora-web` → Vercel tự build khi push `main`.
2. Set env chỉ gồm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` và URL AI Server production. **Không** set `SUPABASE_SERVICE_ROLE_KEY` hay `DATABASE_URL` ở boundary này.
3. Kiểm tra production URL: đăng nhập thật, gọi được cả 2 endpoint AI, và chạy Lighthouse (performance + accessibility) lưu lại làm bằng chứng bàn giao.

### 5.5. Quản lý Secret

| Secret | Nơi lưu | Tuyệt đối không |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (server-only), Admin boundary | Không đưa vào `lingora-web` hoặc bất kỳ code chạy phía client, không commit `.env` |
| `SUPABASE_JWT_SECRET` | Render/HF Spaces env | Không log ra console |
| `anon_key` | Có thể public (Web) vì RLS đã chặn ở tầng DB | — |

Mỗi repo có `.env.example` liệt kê tên biến (không có giá trị thật) để chấm bài dễ dựng lại môi trường.

### 5.6. Kịch bản Demo (tuần 12)

Chuẩn bị **1 kịch bản chính + 1 bản offline dự phòng**:

**Kịch bản chính (online, ~8 phút):**
1. Đăng ký/đăng nhập (30s).
2. Học 1 bài, làm 2 loại bài tập (2 phút).
3. Vào màn "Ôn tập thông minh" → chỉ ra từ được model xếp ưu tiên cao (recall probability thấp) + giải thích ngắn gọn vì sao (2 phút).
4. Vào màn "Luyện hội thoại" → roleplay 3–4 lượt với kịch bản đặt phòng khách sạn (domain duy nhất đã train kỹ), nếu module chấm điểm [Nice] kịp làm thì chỉ thêm điểm `grammatical_acceptability_score` thay đổi theo câu đúng/sai ngữ pháp; nếu chưa kịp thì bỏ qua bước này, chỉ demo hội thoại trôi chảy (2 phút).
5. (Nếu còn thời gian) xem nhanh Web Admin: sửa 1 câu trong `chat_scenarios`, quay lại app thấy thay đổi ngay (1 phút).

**Bản dự phòng offline:** quay video màn hình sẵn luồng trên (đề phòng wifi hội trường yếu / Render ngủ không kịp đánh thức). Nếu cần bấm thử trực tiếp, chạy `lingora-web` ở chế độ local production build trỏ tới **AI Server chạy local với `MOCK_MODE=true`** qua mạng nội bộ/hotspot đã kiểm thử trước; `MOCK_MODE` là biến môi trường của FastAPI, không phải setting nằm trong web client. Luồng chính vẫn phải hoàn thành bằng Fallback mà không phụ thuộc `ngrok`.

### 5.7. Rà soát trích dẫn (tuần 12)

Danh sách nguồn cần trích dẫn đầy đủ trong báo cáo:
- Piech et al. (2015), *Deep Knowledge Tracing*
- Settles & Meeder (2016), *A Trainable Spaced Repetition Model for Language Learning* (Half-Life Regression)
- Vaswani et al. (2017), *Attention Is All You Need*
- Budzianowski et al. (2018) / Zang et al. (2020), *MultiWOZ*
- Li et al. (2017), *DailyDialog*
- Warstadt et al. (2019), *CoLA*
- ASSISTments dataset — trang chủ + điều khoản sử dụng dữ liệu

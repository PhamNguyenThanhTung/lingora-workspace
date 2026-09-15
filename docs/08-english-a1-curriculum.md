# 08 — English A1 Curriculum (MVP Internal Curriculum)

> **Mã tài liệu:** `docs/08-english-a1-curriculum.md`
> **Loại:** CURRICULUM DESIGN (documentation only — không code, không schema, không migration)
> **Trạng thái:** `READY FOR REQUIREMENTS FREEZE` (Approved by Product Owner)
> **Căn cứ:** Product Policy D1–D9 (`docs/phase-0-final-product-owner-decision-sheet.md`, immutable);
> Quyết định phê duyệt chính thức của Product Owner; audit blocker B1 (`docs/phase-0-final-requirements-audit.md` §11).
> **Ranh giới:** Curriculum nội bộ của Lingora (`INTERNAL CURRICULUM`). Không claim tương đương bất kỳ chuẩn
> bên ngoài nào. Mọi con số/threshold không chứng minh khoa học được gắn `[ASSUMPTION]`;
> mọi điểm cần Product Owner chốt gắn `[OPEN DECISION]`.

---

## 1. Course Overview

| Mục | Nội dung |
|---|---|
| **Course name** | `English A1 — Foundation English for Everyday Communication` (internal name; `Course.cefr = A1` chỉ là nhãn phân cấp nội bộ, không phải chứng chỉ) |
| **Scope** | 1 khóa duy nhất của MVP pilot: **6 Units → 24 Lessons → ~120 exercises → ~200 vocabulary items**. Chỉ tiếng Anh; UI `vi`/`en` |
| **Intended learner** | Người Việt bắt đầu học tiếng Anh từ số 0 hoặc mất gốc; biết bảng chữ cái Latinh và có thể đọc phiên âm/hướng dẫn tiếng Việt. Không yêu cầu kiến thức đầu vào |
| **Entry assumptions** | Không kiểm tra đầu vào bắt buộc. Learner mới được mời làm Placement (~30 câu) hoặc Skip → Unit 1 (D6) |
| **Exit assumptions** | Sau Unit 6, learner: chào hỏi/giới thiệu/mua sắm/hỏi đường/kể routine-ngắn/nói kế hoạch đơn giản bằng câu ngắn, hiện tại đơn + quá khứ đơn + `going to` cơ bản; vốn ~200 từ core; đọc hiểu biển báo/thực đơn/lịch trình đơn giản |
| **MVP boundary** | TRONG: 6 Units tuyến tính, 5 dạng exercise đã duyệt (MCQ/FILL_BLANK/REORDER + GRAMMAR/LISTENING), audio từ vựng, SRS vocab, streak, GEC scenario-writing. NGOÀI: kỹ năng viết đoạn văn, nghe hội thoại dài, phát âm scoring, thi chứng chỉ, multi-level (A2+) |

**Rationale (tại sao 6 Units, tuyến tính, nhỏ):** đủ bao phủ các tình huống survival-core mà không phình MVP;
tuyến tính giúp định nghĩa Previous/Cumulative/Comprehensive cho Jump (D5) không mơ hồ; mỗi Unit là một
"knowledge block" độc lập để Placement sampling theo block (D6). `[ASSUMPTION]` Phạm vi "đủ dùng cho A1 nội bộ"
là quyết định sản phẩm, không suy ra từ chuẩn bên ngoài nào.

---

## 2. Unit Map

Progression: **U1 → U2 → U3 → U4 → U5 → U6** (tuyến tính tuyệt đối, không branch — xem §4).

| Unit ID | Unit Name | Learning Goal | Prerequisites | Main Vocabulary Themes | Grammar / Language Functions | Lessons | Assessment Scope |
|---|---|---|---|---|---|---|---|
| U1 | Greetings & Introductions | Chào hỏi, giới thiệu bản thân, hỏi tên/quốc tịch, số 1–20 | Không (entry) | Greetings, names, countries, numbers 1–20 | `be` (am/is/are), câu hỏi `What/Where`, đại từ I/you/he/she | 4 | U1 block: be-verb + greetings vocab |
| U2 | People & Daily Life | Mô tả người/vật quen thuộc, gia đình, số–giờ–ngày | U1 completed (hoặc Placement/Jump) | Family, jobs, colors, numbers 20–100, days/time | Hiện tại đơn `have/live/like` (I/you/we/they), tính từ sở hữu my/your, số nhiều -s | 4 | U1–U2 cumulative: be + have/live + family vocab |
| U3 | Food, Shopping & Money | Gọi món, mua sắm, hỏi giá, số lượng | U2 | Food/drinks, shops, prices, quantities | `How much…?`, want/need/like, this/that/these/those, a/an/some | 4 | U1–U3 cumulative: shopping functions + quantifiers |
| U4 | Places, Directions & Travel | Hỏi–chỉ đường, phương tiện, đặt phòng cơ bản | U3 | Places in town, transport, directions, hotel words | Mệnh lệnh (Turn left…), `Where is…?`, giới từ in/on/at/under/near, can (khả năng/yêu cầu) | 4 | U1–U4 cumulative: directions + prepositions + can |
| U5 | Time, Routines & Past Events | Kể routine, nói hoạt động đã qua (cuối tuần/kỳ nghỉ) | U4 | Daily routines, frequency, past-time markers (yesterday/last…) | Trạng từ tần suất, quá khứ đơn động từ có quy tắc + 10 bất quy tắc core (go/went, eat/ate…), `There is/are` | 4 | U1–U5 cumulative: present routine + regular/selected irregular past |
| U6 | Plans, Future & Everyday Talk | Hẹn gặp, mời–nhận lời, nói kế hoạch, small talk | U5 | Invitations, appointments, weather, phone/social phrases | `going to` (kế hoạch), `Would you like…?`, `Let's…`, liên từ and/but/because ở mức câu ghép đơn | 4 | Comprehensive: toàn U1–U6 (diagnostic) |

**Rationale progression:** mỗi Unit chỉ dùng lại ngữ pháp Unit trước + thêm đúng 1 cụm mới (spiral nhẹ);
từ vựng theo chủ đề tình huống, không nhảy chủ đề trừu tượng (công việc học thuật, idioms) — phù hợp
"học để dùng ngay" và giữ Unit assessment độc lập được.

---

## 3. Lesson Map

Quy ước chung (áp dụng mọi lesson trừ khi ghi khác):

- Thời lượng 5–10 phút; **5 exercises/lesson** `[ASSUMPTION]` (đủ để D7 tính `allowance = max(1, floor(5*0.10)) = 1` — retry luôn khả thi).
- Exercise mix chuẩn: 2 MCQ + 1 FILL_BLANK + 1 REORDER + 1 luân phiên (LISTENING khi lesson có audio vocab mới; GRAMMAR khi lesson dạy điểm ngữ pháp mới; từ U2 trở đi).
- Mỗi lesson dạy **8–10 từ mới** `[ASSUMPTION]`; tổng ~200 từ (trừ trùng lặp giữa lessons).
- Từ ví dụ dưới đây là **illustrative, không normative** — Creator được thay từ tương đương cùng theme khi biên soạn (D1).

### U1 — Greetings & Introductions

| Lesson | Name | Objective | Vocabulary (focus + count) | Grammar / Function | Exercise types | Prerequisite | Assessment contribution |
|---|---|---|---|---|---|---|---|
| U1-L1 | Say Hello | Chào + hỏi tên, giới thiệu tên mình | Greetings (hello/hi/good morning…), 8 từ. Vd: hello, goodbye, name | `I am… / My name is…` | MCQ×2, FILL_BLANK, REORDER, LISTENING | Không | U1 block: greetings |
| U1-L2 | Where Are You From? | Hỏi–đáp quốc tịch/nơi ở | Countries + be-forms, 8 từ. Vd: Vietnam, from, live | `Where are you from? / I am from…` | MCQ×2, FILL_BLANK, REORDER, GRAMMAR | U1-L1 | U1 block: be + countries |
| U1-L3 | Numbers & Age | Đếm 1–20, hỏi–đáp tuổi/số điện thoại | Numbers 1–20, 10 từ. Vd: twelve, phone, old | `How old…? / It is…` (số) | MCQ, FILL_BLANK×2, REORDER, LISTENING | U1-L2 | U1 block: numbers |
| U1-L4 | First Conversations | Ghép chào–hỏi–đáp thành hội thoại 3–4 lượt | Ôn tập 8 từ chọn từ L1–L3 (không từ mới) | Ôn `be` + câu hỏi What/Where | MCQ, FILL_BLANK, REORDER×2, GRAMMAR | U1-L3 | U1 review gate (điều kiện mở U2) |

### U2 — People & Daily Life

| Lesson | Name | Objective | Vocabulary | Grammar / Function | Exercise types | Prerequisite | Assessment contribution |
|---|---|---|---|---|---|---|---|
| U2-L1 | My Family | Giới thiệu thành viên gia đình | Family (mother/father/sister…), 9 từ | Sở hữu my/your/his/her | MCQ×2, FILL_BLANK, REORDER, LISTENING | U1-L4 | U2 block: family + possessives |
| U2-L2 | Jobs & Colors | Nói nghề nghiệp, mô tả màu sắc | Jobs (teacher/driver…), colors, 9 từ | `He/She is a…`, số nhiều -s | MCQ×2, FILL_BLANK, REORDER, GRAMMAR | U2-L1 | U2 block: jobs/plurals |
| U2-L3 | Time & Days | Nói giờ, ngày, lịch hẹn đơn giản | Numbers 20–100, days, time words, 10 từ | `What time…? / On Monday…` | MCQ, FILL_BLANK×2, REORDER, LISTENING | U2-L2 | U2 block: time expressions |
| U2-L4 | My Daily World | Mô tả người/quanh mình bằng have/live/like | Ôn 8 từ L1–L3 | `I have… / We live… / They like…` | MCQ, FILL_BLANK, REORDER×2, GRAMMAR | U2-L3 | U2 review gate |

### U3 — Food, Shopping & Money

| Lesson | Name | Objective | Vocabulary | Grammar / Function | Exercise types | Prerequisite | Assessment contribution |
|---|---|---|---|---|---|---|---|
| U3-L1 | Food & Drinks | Gọi tên món ăn/uống quen thuộc | Food/drinks, 10 từ. Vd: rice, noodle, milk | `I like… / I want…` | MCQ×2, FILL_BLANK, REORDER, LISTENING | U2-L4 | U3 block: food vocab |
| U3-L2 | At the Market | Hỏi giá, mặc cả đơn giản | Shops, prices, money words, 9 từ | `How much is…?` | MCQ×2, FILL_BLANK, REORDER, GRAMMAR | U3-L1 | U3 block: prices |
| U3-L3 | How Many? | Nói số lượng, dùng a/an/some | Quantities (a/an/some, numbers), 8 từ | a/an/some + danh từ đếm được | MCQ, FILL_BLANK×2, REORDER, GRAMMAR | U3-L2 | U3 block: quantifiers |
| U3-L4 | Shopping Trip | Ghép gọi món–hỏi giá–trả tiền thành tình huống | Ôn 8 từ L1–L3 | Ôn want/need/like + How much | MCQ, FILL_BLANK, REORDER×2, LISTENING | U3-L3 | U3 review gate |

### U4 — Places, Directions & Travel

| Lesson | Name | Objective | Vocabulary | Grammar / Function | Exercise types | Prerequisite | Assessment contribution |
|---|---|---|---|---|---|---|---|
| U4-L1 | Places in Town | Kể tên địa điểm quanh mình | Places (bank/park/school…), 9 từ | `There is/are…` (nhắc lại, dùng cho địa điểm) | MCQ×2, FILL_BLANK, REORDER, LISTENING | U3-L4 | U4 block: places |
| U4-L2 | Ask for Directions | Hỏi–hiểu chỉ đường cơ bản | Direction words (left/right/straight…), 8 từ | `Where is…? / Go straight…` | MCQ×2, FILL_BLANK, REORDER, GRAMMAR | U4-L1 | U4 block: directions |
| U4-L3 | Transport & Travel | Nói phương tiện, đặt phòng đơn giản | Transport, hotel words, 9 từ | `can` (khả năng/yêu cầu: Can I…?) | MCQ, FILL_BLANK×2, REORDER, LISTENING | U4-L2 | U4 block: can + transport |
| U4-L4 | Find Your Way | Ghép hỏi đường–đi–đến nơi thành tình huống | Ôn 8 từ L1–L3 | Ôn mệnh lệnh + in/on/at/near | MCQ, FILL_BLANK, REORDER×2, GRAMMAR | U4-L3 | U4 review gate |

### U5 — Time, Routines & Past Events

| Lesson | Name | Objective | Vocabulary | Grammar / Function | Exercise types | Prerequisite | Assessment contribution |
|---|---|---|---|---|---|---|---|
| U5-L1 | Every Day | Kể routine bằng hiện tại đơn he/she | Routine verbs (wake/get/go…), 9 từ | Hiện tại đơn ngôi 3 số ít (goes/watches) | MCQ×2, FILL_BLANK, REORDER, GRAMMAR | U4-L4 | U5 block: present routine |
| U5-L2 | How Often? | Nói tần suất thói quen | Frequency (always/usually/…), 8 từ | Trạng từ tần suất + vị trí | MCQ, FILL_BLANK×2, REORDER, LISTENING | U5-L1 | U5 block: frequency |
| U5-L3 | Last Weekend | Kể việc đã qua (động từ có quy tắc) | Past markers (yesterday/last…), 8 từ | Quá khứ đơn -ed | MCQ×2, FILL_BLANK, REORDER, GRAMMAR | U5-L2 | U5 block: regular past |
| U5-L4 | My Last Trip | Kể chuyến đi ngắn (10 bất quy tắc core) | Ôn + went/ate/saw/bought…, 8 từ | Ôn past: regular + selected irregular | MCQ, FILL_BLANK, REORDER×2, GRAMMAR | U5-L3 | U5 review gate |

### U6 — Plans, Future & Everyday Talk

| Lesson | Name | Objective | Vocabulary | Grammar / Function | Exercise types | Prerequisite | Assessment contribution |
|---|---|---|---|---|---|---|---|
| U6-L1 | Invitations | Mời–nhận/trừ lời đơn giản | Invitation phrases, 8 từ | `Would you like…? / Let's…` | MCQ×2, FILL_BLANK, REORDER, LISTENING | U5-L4 | U6 block: invitations |
| U6-L2 | My Plans | Nói kế hoạch bằng going to | Plan words (tomorrow/next…), 8 từ | `going to` khẳng định/phủ định | MCQ×2, FILL_BLANK, REORDER, GRAMMAR | U6-L1 | U6 block: going to |
| U6-L3 | Weather & Small Talk | Nói thời tiết, chuyện phiếm, gọi điện | Weather, phone phrases, 8 từ | Câu ghép and/but/because (đơn) | MCQ, FILL_BLANK×2, REORDER, LISTENING | U6-L2 | U6 block: small talk |
| U6-L4 | Everyday English | Tổng ôn giao tiếp hàng ngày U1–U6 | Ôn 10 từ khó nhất (theo backlog SRS — gợi ý, không bắt buộc) | Ôn going to + invitations | MCQ, FILL_BLANK, REORDER×2, GRAMMAR | U6-L3 | Comprehensive review |

---

## 4. Vocabulary Coverage

| Theme | Category | Target count/range | SRS eligible? | Ghi chú |
|---|---|---|---|---|
| Greetings & politeness | Function words + phrases | 15–20 | Yes (từ đơn; cụm cố định đưa vào exercise, không SRS) | Cụm >2 từ học qua exercise, không tạo thẻ SRS `[ASSUMPTION]` |
| People: family, jobs, appearance | Nouns + possessives | 30–35 | Yes | Nhóm lớn nhất; rải U1–U2 |
| Numbers, time, days | Numbers + time expr. | 25–30 | Yes (số + từ; không SRS công thức giờ) | Nghe–đọc số là LISTENING material tốt |
| Food, shopping, money | Nouns + price expr. | 30–35 | Yes | Gắn audio bắt buộc (phát âm món/quán) |
| Places, transport, directions | Nouns + prepositions | 30–35 | Yes (nouns; giới từ học qua GRAMMAR) | Giới từ không tạo thẻ SRS riêng |
| Routines, frequency, past markers | Verbs + adverbs | 30–35 | Yes (verbs/adverbs; dạng quá khứ là biến thể cùng thẻ gốc `[ASSUMPTION]`) | went/go chung 1 thẻ gốc `go` để tránh phình pool |
| Plans, weather, social phrases | Mixed | 20–25 | Partial (từ đơn yes; cụm xã giao qua exercise) | — |
| **Tổng** | — | **~180–225 → chốt ~200 từ** `[ASSUMPTION]` | **Pool SRS ≈ 170–190 thẻ** (trừ cụm/function-only) | Đủ nhỏ cho MVP; đủ lớn để SRS backlog có ý nghĩa sau 2–3 tuần học |

Không claim tương đương danh mục chuẩn quốc tế nào. Counts là target range cho Creator (D1 assignment), Moderator duyệt lệch ±20% là chấp nhận được `[ASSUMPTION — đề xuất, chờ PO chốt ở decision table]`.

---

## 5. Unit Progression Graph (prerequisite)

```
U1 → U2 → U3 → U4 → U5 → U6   (tuyến tính tuyệt đối, không branch)
L1 → L2 → L3 → L4             (trong mỗi Unit; L4 = review gate mở Unit kế)
```

- Không branch: mọi learner đi một đường duy nhất; Placement/Jump chỉ chọn **điểm vào** (Starting Unit), không chọn nhánh.
- Mở Unit k (k>1) khi: hoàn thành U(k−1)-L4, hoặc Placement mapping → Unit k, hoặc Jump pass vào Unit k.
- Preview lesson khóa: read-only (đúng D5).

---

## 6. Curriculum Decision Table (cho §15 / reconciliation)

| Decision | Status | Rationale | Impacted requirements | Blocking Freeze? |
|---|---|---|---|---|
| 6 Units tuyến tính, 24 lessons, ~200 từ | APPROVED (PO Decision) | Đủ nhỏ cho MVP, đủ lớn cho SRS/placement sampling | MVP-04/05/06, UC-04/05/08 | RESOLVED |
| 5 exercises/lesson; mix 2 MCQ+1 FILL+1 REORDER+1 luân phiên | APPROVED (PO Decision) | Tương thích D7 (allowance luôn ≥1); GRAMMAR/LISTENING rải đều | P1-FR-003/012/013, UC-05 | RESOLVED |
| Vocab ranges/theme (§4); biến thể quá khứ chung thẻ gốc | APPROVED (PO Decision) | Giữ pool SRS ~180 thẻ, tránh phình | P1-FR-005, UC-06 | RESOLVED |
| Không branch; L4 review gate | APPROVED (PO Decision) | Jump/Placement định nghĩa không mơ hồ | D5, D6, UC-03/04 | RESOLVED |
| Illustrative word examples (non-normative) | APPROVED (PO Decision) | Creator linh hoạt trong assignment (D1) | UC-08, MVP-12 | RESOLVED |

> Placement mapping + jump scope chi tiết: xem `docs/09-placement-and-jump-specification.md`.

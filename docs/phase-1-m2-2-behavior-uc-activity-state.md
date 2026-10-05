> **SUPERSEDED NOTICE:** Danh sách 15 Use Cases trong tài liệu này (UC-01 đến UC-15) đã được thay thế bởi danh sách 14 Use Cases chuẩn hóa mới trong docs/use-case-specifications.md. Vui lòng tham chiếu docs/use-case-specifications.md cho định nghĩa nghiệp vụ hiện hành của Phase 2.

# LINGORA â€” PHASE 1 MILESTONE M2.2: BEHAVIORAL SPECIFICATION (USE CASES, ACTIVITIES, STATE MACHINES & DECISION FLOWS)

> **MÃ£ tÃ i liá»‡u:** `docs/phase-1-m2-2-behavior-uc-activity-state.md`  
> **Giai Ä‘oáº¡n:** Phase 1 â€” System Analysis & Design (Implementation-Independent)  
> **Má»‘c thá»±c thi:** Milestone M2.2 (Behavior, Use Cases, Activities, State Machines & Screen Flows) â€” Remediation Revision  
> **Tráº¡ng thÃ¡i:** `READY FOR INDEPENDENT RE-REVIEW` (Triá»ƒn khai kháº¯c phá»¥c toÃ n diá»‡n theo káº¿t luáº­n ÄÃ¡nh giÃ¡ Äá»™c láº­p; KHÃ”NG tuyÃªn bá»‘ Design Freeze; KHÃ”NG tá»± Ã½ coi lÃ  ACCEPTED).  
> **CÄƒn cá»© káº¿ hoáº¡ch:** `plans/m2-2-behavior-uc-activity-state-plan.md`, `docs/phase-1-system-design-plan.md` Â§7 (Artifacts #2, #3, #9, #10, #17, #18, #19; Cá»•ng D-G4, D-G7).  
> **Ranh giá»›i nghiÃªm ngáº·t:** KHÃ”NG mÃ£ nguá»“n runtime (`lingora-web`, `lingora-admin`, `lingora-ai`), KHÃ”NG Prisma schema/migration/DB execution, KHÃ”NG UI components/CSS/pixel design, KHÃ”NG tá»± cháº¿ thuáº­t toÃ¡n tÃ­nh Ä‘iá»ƒm/xáº¿p lá»›p/mastery/readiness, KHÃ”NG thay Ä‘á»•i Product Policies D1â€“D9 Ä‘Ã£ Ä‘Ã³ng bÄƒng, KHÃ”NG sá»­a Ä‘á»•i tÃ i liá»‡u nguá»“n D1â€“D4 vÃ  M2.1.

---

## 1. Executive Summary & Management Contract

Má»‘c M2.2 thiáº¿t láº­p toÃ n bá»™ **lá»›p hÃ nh vi (Behavior Layer)** cho há»‡ thá»‘ng Lingora trÃªn ná»n táº£ng mÃ´ hÃ¬nh miá»n vÃ  cáº¥u trÃºc dá»¯ liá»‡u logic M2.1 Ä‘Ã£ Ä‘Æ°á»£c nghiá»‡m thu Ä‘á»™c láº­p (`M2.1 ACCEPTED FOR M2.2`). TÃ i liá»‡u chuáº©n hÃ³a hÃ nh vi há»‡ thá»‘ng á»Ÿ má»©c Ä‘á»™c láº­p triá»ƒn khai, káº¿ thá»«a nguyÃªn vÄƒn cÃ¡c quyáº¿t Ä‘á»‹nh sáº£n pháº©m Ä‘Ã£ Ä‘Ã³ng bÄƒng (D1â€“D9, Khung 6 Units English A1, Placement Mapping A, Jump $\ge 95\%$, Controlled Retry D7, SRS Policy B D8, Streak D9).

### 1.1. Six-Field Contract for M2.2 Artifacts

Theo yÃªu cáº§u chuáº©n hÃ³a cá»§a `docs/phase-1-system-design-plan.md` Â§5, táº¥t cáº£ 7 artifacts thÃ nh pháº§n thuá»™c M2.2 tuÃ¢n thá»§ nghiÃªm ngáº·t há»£p Ä‘á»“ng 6 trÆ°á»ng:

| Artifact ID & TÃªn Artifact | 1. Purpose (Má»¥c Ä‘Ã­ch) | 2. Inputs (Äáº§u vÃ o) | 3. Outputs (Äáº§u ra) | 4. Dependencies (Phá»¥ thuá»™c) | 5. Trace (Truy váº¿t) | 6. Validation Gate (Cá»•ng kiá»ƒm Ä‘á»‹nh) |
|---|---|---|---|---|---|---|
| **#2 Content Lifecycle State Model** | Äá»‹nh nghÄ©a hÃ nh vi chuyá»ƒn tráº¡ng thÃ¡i ná»™i dung há»c liá»‡u vÃ  tháº©m quyá»n tÃ¡c nhÃ¢n (SoD) | M2.1 Â§5, ADR-002, `content-lifecycle-state.puml` | Quy táº¯c kÃ­ch hoáº¡t chuyá»ƒn tráº¡ng thÃ¡i, rÃ ng buá»™c Clone-to-Draft v2, quyá»n kháº©n cáº¥p Admin | M2.1 Â§5.2, SoD Baseline | `YC-CORE-04..06`, `MVP-12/13/19`, `P1-FR-008`, `UC-08/09/10` | **D-G1** (káº¿ thá»«a), **D-G4** |
| **#3 Learning Progression Model** | Äá»‹nh nghÄ©a hÃ nh vi tiáº¿n trÃ¬nh ngÆ°á»i há»c, phÃ¢n Ä‘á»‹nh 2 nhÃ¡nh nháº­p mÃ´n (Self-reported vs Diagnostic) | D3 Â§D/Â§F, M2.1 Â§6, `learning-progression-model.puml` | Quy táº¯c Ä‘Ã¡nh giÃ¡ 3 tráº¡ng thÃ¡i (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`), Invariants I1â€“I10 | M2.1 Â§6, D3 Engine | `YC-CORE-07/09/11`, `MVP-03/08/11`, `P1-FR-004/016`, `UC-03/04/05/07` | **D-G4**, **D-G7** |
| **#9 Use Case Diagram & Catalog** | Báº£n Ä‘á»“ tÆ°Æ¡ng tÃ¡c giá»¯a 6 vai trÃ² chuáº©n táº¯c vÃ  15 Use Cases chuáº©n táº¯c | `docs/06-system-analysis.md` Â§4, `docs/02-requirements.md` | Danh má»¥c 15 Use Cases hoÃ n chá»‰nh, ma tráº­n liÃªn káº¿t Actorâ€“UC, phÃ¢n Ä‘á»‹nh Core vs Extension | Canonical Roles, SoD Matrix | `YC-CORE-01..12`, `YC-EXT-01..08`, `MVP-01..19`, `UC-01..15` | **D-G4** |
| **#10 Activity / State Behavior Set** | Äáº·c táº£ luá»“ng hoáº¡t Ä‘á»™ng chi tiáº¿t cho 15 há» hÃ nh vi (BF-01..BF-15) vÃ  cÃ¡c mÃ¡y tráº¡ng thÃ¡i | `docs/06-system-analysis.md` Â§5, D1â€“D9 policies | 15 behavioral specifications, báº£ng quyáº¿t Ä‘á»‹nh ráº½ nhÃ¡nh, tráº¡ng thÃ¡i Ä‘á»‘i tÆ°á»£ng miá»n | 15 UC Specs, M2.1 Entities | `BF-01..15`, `P1-FR-001..016`, `UC-01..15` | **D-G4**, **D-G7** |
| **#17 Placement / Jump Decision Flows** | Luá»“ng quyáº¿t Ä‘á»‹nh cháº©n Ä‘oÃ¡n xáº¿p lá»›p vÃ  kiá»ƒm tra vÆ°á»£t cáº¥p nháº£y bÃ i | `docs/09-placement-and-jump-specification.md`, D5, D6 | CÃ¢y quyáº¿t Ä‘á»‹nh Mapping A (English A1), cÃ¢y quyáº¿t Ä‘á»‹nh Jump (20/25-30/40q, $\ge 95\%$, 24h cooldown) | Curriculum 08, D3 Engine | `YC-CORE-09`, `MVP-03`, `P1-FR-016`, `UC-03`, `UC-04` | **D-G7** |
| **#18 SRS Decision Flow** | Luá»“ng quyáº¿t Ä‘á»‹nh Ã´n táº­p ngáº¯t quÃ£ng tá»« vá»±ng theo chu ká»³ táº¥t Ä‘á»‹nh | ADR-002, D8, `docs/04-data-model.md` RPC `record_review` | CÃ¢y quyáº¿t Ä‘á»‹nh chu ká»³ $[1, 3, 7, 14, 30]$, hÃ ng Ä‘á»£i `nextReviewAt`, tÆ°Æ¡ng tÃ¡c chuá»—i Streak | UserVocabSrs, ReviewLog | `YC-CORE-08`, `MVP-09`, `P1-FR-005/006`, `UC-06` | **D-G7** |
| **#19 Screen-Flow Inventory** | Sá»• bá»™ kiá»ƒm kÃª luá»“ng mÃ n hÃ¬nh giao diá»‡n má»©c logic cho há»c viÃªn vÃ  khá»‘i quáº£n trá»‹ | `docs/06-system-analysis.md`, D4 Blueprint | Danh má»¥c luá»“ng mÃ n hÃ¬nh logic (Learner Chain, Authoring Chain), nhÃ£n tráº¡ng thÃ¡i vÃ  phÃ¢n quyá»n | 15 UCs, SoD Matrix | `MVP-01..19`, `UC-01..15` | **D-G4** |

---

## 2. Canonical 15 Use Cases Catalog & Full Specifications

Há»‡ thá»‘ng Lingora chuáº©n hÃ³a chÃ­nh xÃ¡c **15 Use Cases** (`UC-01` Ä‘áº¿n `UC-15`). Tuyá»‡t Ä‘á»‘i khÃ´ng tá»“n táº¡i cÃ¡c mÃ£ áº£o `UC-16`, `UC-17`, `UC-18`. KhÃ´ng dÃ¹ng nhÃ£n phÃ¢n rÃ£ sai quy cÃ¡ch `UC-06-viáº¿t`. TÃ­nh nÄƒng kiá»ƒm tra ngá»¯ phÃ¡p cÃ¢u viáº¿t tá»± do theo `P1-FR-007` thuá»™c vá» há» hÃ nh vi **`BF-14`** (há»— trá»£ bá»Ÿi dá»‹ch vá»¥ GEC stateless) vÃ  khÃ´ng chiáº¿m má»™t Use Case Ä‘á»™c láº­p. `UC-15` (Quáº£n lÃ½ lá»›p há»c & tiáº¿n Ä‘á»™ nhÃ³m) Ä‘Æ°á»£c phÃ¢n loáº¡i chÃ­nh thá»©c lÃ  **`OPTIONAL / FUTURE EXTENSION BOUNDARY`**.

```
+-------------------------------------------------------------------------------------------------------+
|                                      LINGORA USE CASE CATALOG                                         |
+----------------------------------+----------------------------------+---------------------------------+
| CORE LEARNER SUITE               | CONTENT & AUTHORING SUITE        | ADMINISTRATION & OPERATIONS     |
| - UC-01: Authenticate & Session  | - UC-08: Create/Edit Lesson Draft| - UC-11: Manage Accounts & Roles|
| - UC-02: Configure Goals & Time  | - UC-09: Review/Moderate Content | - UC-12: View System Reports    |
| - UC-03: Take Placement Test     | - UC-10: Publish Approved Content| - UC-13: View/Audit Security Log|
| - UC-04: Browse Path & Jump      |                                  | - UC-14: Handle Support Tickets |
| - UC-05: Complete Lesson Exercises|                                 |                                 |
| - UC-06: Spaced Repetition (SRS) |                                  | EXTENSION SUITE (OPTIONAL/FUTURE|
| - UC-07: Track Progress & Streak |                                  | - UC-15: Manage Cohorts / Groups|
+----------------------------------+----------------------------------+---------------------------------+
```

---

### UC-01: Authenticate & Manage Session

- **MÃ£ Ä‘á»‹nh danh:** `UC-01`
- **TÃªn Use Case:** ÄÄƒng kÃ½, ÄÄƒng nháº­p & Quáº£n lÃ½ PhiÃªn NgÆ°á»i dÃ¹ng (Authenticate & Manage Session)
- **TÃ¡c nhÃ¢n chÃ­nh (Primary Actor):** `Learner`, Táº¥t cáº£ cÃ¡c vai trÃ² há»‡ thá»‘ng (`Administrator`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`)
- **TÃ¡c nhÃ¢n há»— trá»£:** Há»‡ thá»‘ng xÃ¡c thá»±c Supabase GoTrue Auth
- **KÃ­ch hoáº¡t (Trigger):** NgÆ°á»i dÃ¹ng truy cáº­p trang xÃ¡c thá»±c, gá»­i thÃ´ng tin Ä‘Äƒng kÃ½/Ä‘Äƒng nháº­p, hoáº·c phiÃªn lÃ m viá»‡c háº¿t háº¡n/Ä‘Äƒng xuáº¥t.
- **Tiá»n Ä‘iá»u kiá»‡n (Preconditions):**
  1. NgÆ°á»i dÃ¹ng cÃ³ káº¿t ná»‘i máº¡ng tá»›i Lingora BFF/Web client.
  2. Äá»‹a chá»‰ email Ä‘Äƒng kÃ½ chÆ°a tá»“n táº¡i trong há»‡ thá»‘ng (Ä‘á»‘i vá»›i luá»“ng Sign Up).
- **Luá»“ng sá»± kiá»‡n chÃ­nh (Main Success Flow):**
  1. NgÆ°á»i dÃ¹ng chá»n phÆ°Æ¡ng thá»©c xÃ¡c thá»±c: Email/Máº­t kháº©u hoáº·c ÄÄƒng kÃ½ tÃ i khoáº£n má»›i.
  2. Há»‡ thá»‘ng kiá»ƒm tra tÃ­nh há»£p lá»‡ cÃº phÃ¡p (RFC 5322 email, máº­t kháº©u tá»‘i thiá»ƒu 8 kÃ½ tá»±).
  3. Client gá»­i yÃªu cáº§u xÃ¡c thá»±c qua Next.js Server Action / Route Handler proxy tá»›i Supabase GoTrue Auth.
  4. Supabase xÃ¡c thá»±c thÃ´ng tin Ä‘Äƒng nháº­p vÃ  phÃ¡t hÃ nh JWT token (chuáº©n kÃ½ ES256/HS256).
  5. Há»‡ thá»‘ng tra cá»©u báº£n ghi `Profile` liÃªn káº¿t vá»›i `auth.uid()` Ä‘á»ƒ xÃ¡c Ä‘á»‹nh vai trÃ² (`role`) vÃ  quyá»n háº¡n.
  6. Há»‡ thá»‘ng thiáº¿t láº­p phiÃªn an toÃ n qua `httpOnly`, `Secure`, `SameSite=Lax` cookie (Client khÃ´ng lÆ°u JWT thÃ´ trong `localStorage`).
  7. NgÆ°á»i dÃ¹ng Ä‘Æ°á»£c Ä‘iá»u hÆ°á»›ng vá» mÃ n hÃ¬nh tÆ°Æ¡ng á»©ng: `Learner` vá» Báº£ng Ä‘iá»u khiá»ƒn há»c táº­p (`/learn`), NhÃ¢n sá»± quáº£n trá»‹ vá» Cá»•ng tÃ¡c nghiá»‡p tÆ°Æ¡ng á»©ng theo vai trÃ².
- **Luá»“ng nhÃ¡nh / Luá»“ng thay tháº¿ (Alternate Flows):**
  - *AF-01 (ÄÄƒng kÃ½ tÃ i khoáº£n má»›i):* NgÆ°á»i há»c Ä‘iá»n email, máº­t kháº©u, há» tÃªn $\rightarrow$ Há»‡ thá»‘ng táº¡o tÃ i khoáº£n auth $\rightarrow$ Tá»± Ä‘á»™ng táº¡o báº£n ghi `Profile` máº·c Ä‘á»‹nh vai trÃ² `LEARNER` $\rightarrow$ Tá»± Ä‘á»™ng khá»Ÿi táº¡o `LearnerProfile` $\rightarrow$ Chuyá»ƒn tiáº¿p tá»›i mÃ n hÃ¬nh Thiáº¿t láº­p má»¥c tiÃªu ban Ä‘áº§u (`UC-02`).
  - *AF-02 (ÄÄƒng xuáº¥t an toÃ n):* NgÆ°á»i dÃ¹ng báº¥m ÄÄƒng xuáº¥t $\rightarrow$ Server Action thu há»“i refresh token táº¡i Supabase Auth $\rightarrow$ XÃ³a sáº¡ch phiÃªn cookie `httpOnly` $\rightarrow$ Äiá»u hÆ°á»›ng vá» trang Ä‘Äƒng nháº­p `/login`.
- **Luá»“ng ngoáº¡i lá»‡ (Exception Flows):**
  - *EF-01 (ThÃ´ng tin Ä‘Äƒng nháº­p khÃ´ng há»£p lá»‡):* Máº­t kháº©u sai hoáº·c email khÃ´ng tá»“n táº¡i $\rightarrow$ Há»‡ thá»‘ng tráº£ lá»—i chuáº©n `AUTH_INVALID_CREDENTIALS` $\rightarrow$ Giao diá»‡n hiá»ƒn thá»‹ thÃ´ng bÃ¡o song ngá»¯ (vi/en), khÃ´ng tiáº¿t lá»™ email cÃ³ tá»“n táº¡i hay khÃ´ng $\rightarrow$ Luá»“ng dá»«ng láº¡i.
  - *EF-02 (TÃ i khoáº£n bá»‹ khÃ³a):* Báº£n ghi `Profile` cÃ³ tráº¡ng thÃ¡i vÃ´ hiá»‡u hÃ³a $\rightarrow$ Há»‡ thá»‘ng há»§y phiÃªn vÃ  tráº£ lá»—i `AUTH_ACCOUNT_DISABLED` $\rightarrow$ Äiá»u hÆ°á»›ng tá»›i thÃ´ng bÃ¡o há»— trá»£ (`UC-14`).
- **Háº­u Ä‘iá»u kiá»‡n (Postconditions):**
  - PhiÃªn lÃ m viá»‡c há»£p lá»‡ Ä‘Æ°á»£c thiáº¿t láº­p qua cookie báº£o máº­t.
  - Báº£n ghi kiá»ƒm toÃ¡n phiÃªn Ä‘Äƒng nháº­p Ä‘Æ°á»£c ghi nháº­n náº¿u lÃ  tÃ i khoáº£n quáº£n trá»‹.
- **Quy táº¯c nghiá»‡p vá»¥ Ã¡p dá»¥ng (Business Rules):**
  - `BR-AUTH-01`: Client tuyá»‡t Ä‘á»‘i khÃ´ng lÆ°u JWT trong `localStorage` hay `sessionStorage`.
  - `BR-AUTH-02`: PhÃ¢n quyá»n dá»±a trÃªn vai trÃ² gÃ¡n (`Profile.role` / `Profile.assignedRoles`); ngÆ°á»i há»c chá»‰ truy cáº­p Ä‘Æ°á»£c dá»¯ liá»‡u thuá»™c quyá»n sá»Ÿ há»¯u cá»§a chÃ­nh mÃ¬nh (`auth.uid() = profile.id`).
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `Profile`, `LearnerProfile`.
- **Truy váº¿t:** `YC-CORE-01` $\rightarrow$ `MVP-01` $\rightarrow$ `P1-FR-001`, `P1-FR-010` $\rightarrow$ `BF-01`.

---

### UC-02: Configure Goals & Study Time

- **MÃ£ Ä‘á»‹nh danh:** `UC-02`
- **TÃªn Use Case:** Thiáº¿t láº­p Má»¥c tiÃªu Há»c táº­p & Thá»i gian HÃ ng ngÃ y (Configure Goals & Study Time)
- **TÃ¡c nhÃ¢n chÃ­nh:** `Learner`
- **KÃ­ch hoáº¡t:** NgÆ°á»i há»c láº§n Ä‘áº§u nháº­p mÃ´n sau khi Ä‘Äƒng kÃ½, hoáº·c chá»§ Ä‘á»™ng má»Ÿ trang CÃ i Ä‘áº·t há»c táº­p cÃ¡ nhÃ¢n.
- **Tiá»n Ä‘iá»u kiá»‡n:** NgÆ°á»i há»c Ä‘Ã£ xÃ¡c thá»±c thÃ nh cÃ´ng (`UC-01`) vÃ  sá»Ÿ há»¯u báº£n ghi `LearnerProfile`.
- **Luá»“ng sá»± kiá»‡n chÃ­nh:**
  1. NgÆ°á»i há»c truy cáº­p giao diá»‡n thiáº¿t láº­p má»¥c tiÃªu cÃ¡ nhÃ¢n (`SCR-L-02`).
  2. Há»‡ thá»‘ng hiá»ƒn thá»‹ cÃ¡c tÃ¹y chá»n má»¥c tiÃªu há»c táº­p (Giao tiáº¿p cÃ´ng viá»‡c, Du lá»‹ch, Há»c thuáº­t, Sá»Ÿ thÃ­ch) vÃ  thá»i lÆ°á»£ng cam káº¿t hÃ ng ngÃ y: 5 phÃºt, 15 phÃºt, 30 phÃºt, 60 phÃºt, hoáº·c 120 phÃºt (`P1-FR-014`).
  3. NgÆ°á»i há»c lá»±a chá»n má»¥c tiÃªu há»c táº­p vÃ  thiáº¿t láº­p chá»‰ sá»‘ `dailyGoalMin` (máº·c Ä‘á»‹nh 15 phÃºt).
  4. NgÆ°á»i há»c chá»n mÃºi giá» Ä‘á»‹a phÆ°Æ¡ng (`timezone`, máº·c Ä‘á»‹nh `Asia/Ho_Chi_Minh`).
  5. NgÆ°á»i há»c báº­t/táº¯t nháº¯c nhá»Ÿ há»c táº­p trong á»©ng dá»¥ng (`In-app Reminder`, `P1-FR-015`).
  6. NgÆ°á»i há»c nháº¥n LÆ°u cÃ i Ä‘áº·t.
  7. Há»‡ thá»‘ng cáº­p nháº­t cÃ¡c trÆ°á»ng cáº¥u hÃ¬nh trÃªn báº£n ghi `Profile` vÃ  `LearnerProfile`.
- **Luá»“ng nhÃ¡nh / Luá»“ng thay tháº¿:**
  - *AF-01 (Bá» qua thiáº¿t láº­p ban Ä‘áº§u):* NgÆ°á»i há»c báº¥m "Äá»ƒ sau" $\rightarrow$ Há»‡ thá»‘ng Ã¡p dá»¥ng giÃ¡ trá»‹ máº·c Ä‘á»‹nh (`dailyGoalMin = 15`, `timezone = "Asia/Ho_Chi_Minh"`) vÃ  chuyá»ƒn sang bÆ°á»›c tiáº¿p theo.
- **Luá»“ng ngoáº¡i lá»‡:**
  - *EF-01 (Thá»i gian cam káº¿t ngoÃ i pháº¡m vi):* GiÃ¡ trá»‹ gá»­i lÃªn $<5$ hoáº·c $>120$ phÃºt $\rightarrow$ Há»‡ thá»‘ng tá»« chá»‘i cáº­p nháº­t, hiá»ƒn thá»‹ thÃ´ng bÃ¡o lá»—i `GOAL_OUT_OF_RANGE`.
- **Háº­u Ä‘iá»u kiá»‡n:**
  - Báº£n ghi `Profile` Ä‘Æ°á»£c cáº­p nháº­t `dailyGoalMin`, `timezone`.
- **Quy táº¯c nghiá»‡p vá»¥ Ã¡p dá»¥ng:**
  - `BR-GOAL-01`: Thá»i lÆ°á»£ng cam káº¿t há»£p lá»‡ náº±m trong khoáº£ng $[5..120]$ phÃºt.
  - `BR-GOAL-02`: Nháº¯c nhá»Ÿ hoáº¡t Ä‘á»™ng theo cÆ¡ cháº¿ In-App trong phiÃªn (`ADR-008 Option 6d`); push notifications tá»« server bá»‹ hoÃ£n (DEFERRED).
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `Profile`, `LearnerProfile`.
- **Truy váº¿t:** `YC-CORE-02`, `YC-CORE-10` $\rightarrow$ `MVP-02`, `MVP-10` $\rightarrow$ `P1-FR-014`, `P1-FR-015`. *(LÆ°u Ã½: P1-FR-011 thuá»™c vá» UC-07; khÃ´ng gá»™p sai vÃ o UC-02)*.

---

### UC-03: Take Placement Test

- **MÃ£ Ä‘á»‹nh danh:** `UC-03`
- **TÃªn Use Case:** ÄÃ¡nh giÃ¡ Cháº©n Ä‘oÃ¡n Xáº¿p lá»›p Ban Ä‘áº§u (Take Placement Test / Diagnostic Assessment)
- **TÃ¡c nhÃ¢n chÃ­nh:** `Learner`
- **KÃ­ch hoáº¡t:** NgÆ°á»i há»c má»›i hoÃ n thÃ nh bÆ°á»›c thiáº¿t láº­p má»¥c tiÃªu trong Onboarding, hoáº·c há»c viÃªn cÅ© chá»§ Ä‘á»™ng chá»n "LÃ m láº¡i bÃ i kiá»ƒm tra xáº¿p lá»›p" tá»« trang Há»“ sÆ¡ cÃ¡ nhÃ¢n.
- **Tiá»n Ä‘iá»u kiá»‡n:** NgÆ°á»i há»c Ä‘Ã£ Ä‘Äƒng nháº­p (`UC-01`).
- **Luá»“ng sá»± kiá»‡n chÃ­nh (LÃ m bÃ i ÄÃ¡nh giÃ¡ Cháº©n Ä‘oÃ¡n ThÃ­ch á»©ng):**
  1. NgÆ°á»i há»c chá»n lÃ m bÃ i ÄÃ¡nh giÃ¡ Cháº©n Ä‘oÃ¡n (Diagnostic Assessment) trÃªn mÃ n hÃ¬nh lá»±a chá»n (`SCR-L-03`).
  2. Há»‡ thá»‘ng khá»Ÿi táº¡o Ä‘á» thi thÃ­ch á»©ng 2 giai Ä‘oáº¡n (Routing Stage $\rightarrow$ Targeted Stage, quy mÃ´ Æ°á»›c tÃ­nh `~25â€“30 cÃ¢u, PROPOSED / PENDING VALIDATION`).
  3. NgÆ°á»i há»c láº§n lÆ°á»£t tráº£ lá»i cÃ¡c cÃ¢u há»i Ä‘Ã¡nh giÃ¡ 4 chiá»u nÄƒng lá»±c: Tá»« vá»±ng (Vocab), Ngá»¯ phÃ¡p (Grammar), Äá»c hiá»ƒu (Reading), Nghe hiá»ƒu (Listening).
  4. NgÆ°á»i há»c hoÃ n thÃ nh cÃ¢u há»i cuá»‘i cÃ¹ng vÃ  ná»™p bÃ i.
  5. Há»‡ thá»‘ng tÃ­nh toÃ¡n Ä‘iá»ƒm sá»‘ thÃ´ theo thang Ä‘iá»ƒm chuáº©n táº¯c (thang Ä‘iá»ƒm Mapping A: 0â€“30 Ä‘iá»ƒm).
  6. Há»‡ thá»‘ng táº¡o báº£n ghi káº¿t quáº£ Ä‘Ã¡nh giÃ¡ báº¥t biáº¿n:
     - `assessmentType = DIAGNOSTIC`
     - `deliveryMode = PLACEMENT`
     - Tráº¡ng thÃ¡i: hoÃ n táº¥t, ghi nháº­n báº±ng chá»©ng báº¥t biáº¿n (`created â†’ completed â†’ immutable evidence`).
  7. Há»‡ thá»‘ng táº¡o/cáº­p nháº­t `SkillProfile` pháº£n Ã¡nh nÄƒng lá»±c 4 chiá»u Ä‘á»™c láº­p (Spider/Radar chart; thuáº­t toÃ¡n gá»™p Anchor Level giá»¯ tráº¡ng thÃ¡i `PENDING VALIDATION`).
  8. Há»‡ thá»‘ng gÃ¡n tráº¡ng thÃ¡i nÄƒng lá»±c kiá»ƒm chá»©ng: `verifiedProficiency = verified`.
  9. Há»‡ thá»‘ng Ã¡p dá»¥ng quy táº¯c Ä‘á» cÆ°Æ¡ng **English A1 Placement Mapping A** Ä‘á»ƒ xÃ¡c Ä‘á»‹nh Äiá»ƒm xuáº¥t phÃ¡t (`curriculumStartingPoint`):
     - `0 â€“ 7 Ä‘iá»ƒm`: GÃ¡n xuáº¥t phÃ¡t táº¡i **Unit 1**
     - `8 â€“ 12 Ä‘iá»ƒm`: GÃ¡n xuáº¥t phÃ¡t táº¡i **Unit 2**
     - `13 â€“ 17 Ä‘iá»ƒm`: GÃ¡n xuáº¥t phÃ¡t táº¡i **Unit 3**
     - `18 â€“ 22 Ä‘iá»ƒm`: GÃ¡n xuáº¥t phÃ¡t táº¡i **Unit 4**
     - `23 â€“ 26 Ä‘iá»ƒm`: GÃ¡n xuáº¥t phÃ¡t táº¡i **Unit 5**
     - `27 â€“ 30 Ä‘iá»ƒm`: GÃ¡n xuáº¥t phÃ¡t táº¡i **Unit 6**
  10. Há»‡ thá»‘ng hiá»ƒn thá»‹ mÃ n hÃ¬nh tÃ³m táº¯t káº¿t quáº£ xáº¿p lá»›p (`SCR-L-05`), sau Ä‘Ã³ Ä‘iá»u hÆ°á»›ng ngÆ°á»i há»c vÃ o tháº³ng bÃ i há»c Ä‘áº§u tiÃªn cá»§a Unit Ä‘Æ°á»£c má»Ÿ khÃ³a (`UC-04`). Há»™p thoáº¡i xÃ¡c nháº­n náº¿u cÃ³ chá»‰ lÃ  tÃ¹y chá»n tráº£i nghiá»‡m ngÆ°á»i dÃ¹ng (`[FUTURE UX OPTION]`), khÃ´ng pháº£i chá»‘t cháº·n báº¯t buá»™c.
- **Luá»“ng nhÃ¡nh / Luá»“ng thay tháº¿:**
  - *AF-01 (Tá»± khai bÃ¡o cáº¥p Ä‘á»™ / Bá» qua - Self-reported / Skip):* NgÆ°á»i há»c chá»n khÃ´ng lÃ m bÃ i kiá»ƒm tra vÃ  báº¥m "Báº¯t Ä‘áº§u tá»« Ä‘áº§u" hoáº·c chá»n cáº¥p Ä‘á»™ tá»± nháº­n $\rightarrow$ Há»‡ thá»‘ng ghi nháº­n `LearnerProfile.selfReportedLevel` vá»›i tráº¡ng thÃ¡i `UNVERIFIED` $\rightarrow$ GÃ¡n xuáº¥t phÃ¡t Ä‘iá»ƒm táº¡m thá»i táº¡i Unit 1 $\rightarrow$ **TUYá»†T Äá»I KHÃ”NG Táº O Báº¢N GHI `AssessmentResult`**, **KHÃ”NG Táº O `SkillProfile`**, vÃ  **KHÃ”NG GHI NHáº¬N `verifiedProficiency`** $\rightarrow$ Äiá»u hÆ°á»›ng vÃ o há»c.
  - *AF-02 (LÃ m láº¡i bÃ i thi xáº¿p lá»›p - Retake):* NgÆ°á»i há»c lÃ m láº¡i bÃ i tá»« trang cÃ¡ nhÃ¢n $\rightarrow$ Há»‡ thá»‘ng táº¡o má»™t báº£n ghi `AssessmentResult` **hoÃ n toÃ n má»›i**, giá»¯ nguyÃªn báº£n ghi cÅ© $\rightarrow$ Cáº­p nháº­t láº¡i `SkillProfile` vÃ  Starting Unit má»›i tÆ°Æ¡ng á»©ng.
- **Luá»“ng ngoáº¡i lá»‡:**
  - *EF-01 (GiÃ¡n Ä‘oáº¡n bÃ i lÃ m):* Máº¥t káº¿t ná»‘i trong khi lÃ m bÃ i $\rightarrow$ CÃ¡c cÃ¢u Ä‘Ã£ ná»™p Ä‘Æ°á»£c lÆ°u táº¡m thá»i; khi káº¿t ná»‘i láº¡i ngÆ°á»i há»c cÃ³ thá»ƒ lÃ m tiáº¿p cÃ¡c cÃ¢u cÃ²n láº¡i.
- **Háº­u Ä‘iá»u kiá»‡n:**
  - Báº£n ghi `AssessmentResult` báº¥t biáº¿n Ä‘Æ°á»£c lÆ°u trá»¯ (náº¿u lÃ m bÃ i cháº©n Ä‘oÃ¡n).
  - `SkillProfile` vÃ  `curriculumStartingPoint` Ä‘Æ°á»£c xÃ¡c láº­p.
- **Quy táº¯c nghiá»‡p vá»¥ Ã¡p dá»¥ng:**
  - `BR-PLC-01`: TÃ¡ch biá»‡t tuyá»‡t Ä‘á»‘i giá»¯a Tá»± khai bÃ¡o (`selfReportedLevel = UNVERIFIED`) vÃ  NÄƒng lá»±c kiá»ƒm chá»©ng (`verifiedProficiency`).
  - `BR-PLC-02`: Quy mÃ´ Ä‘á» thi cháº©n Ä‘oÃ¡n mang tráº¡ng thÃ¡i `~25â€“30 items, PROPOSED / PENDING VALIDATION`. Mapping A quy Ä‘á»‹nh thang Ä‘iá»ƒm thÃ´ 0â€“30, khÃ´ng báº¯t buá»™c sá»‘ lÆ°á»£ng item pháº£i báº±ng 30.
  - `BR-PLC-03`: Káº¿t quáº£ xáº¿p lá»›p chá»‰ Ä‘á»‹nh vá»‹ vá»‹ trÃ­ xuáº¥t phÃ¡t trÃªn Ä‘á» cÆ°Æ¡ng English A1; tuyá»‡t Ä‘á»‘i KHÃ”NG cáº¥p chá»©ng chá»‰ nÄƒng lá»±c quá»‘c táº¿ CEFR.
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `LearnerProfile`, `AssessmentResult`, `SkillProfile`, `Concept`.
- **Truy váº¿t:** `YC-CORE-09` $\rightarrow$ `MVP-03` $\rightarrow$ `P1-FR-016` $\rightarrow$ `BF-08`. *(LÆ°u Ã½: CÆ¡ cháº¿ Jump thuá»™c vá» UC-04 / BF-11; khÃ´ng gá»™p Jump vÃ o UC-03)*.

---

### UC-04: Browse Learning Path & Conditional Jump

- **Mã d?nh danh:** UC-04
- **Tên Use Case:** Khám phá L? trình H?c t?p & Nh?y c?p (Browse Learning Path & Conditional Jump)
- **Tác nhân chính:** Learner
- **Kích ho?t:** Ngu?i h?c m? màn hình L? trình h?c t?p (/learn), ho?c ch?n yêu c?u nh?y cóc qua Unit k? ti?p.
- **Ti?n di?u ki?n:** Ngu?i h?c dã xác th?c (UC-01) và dã có xu?t phát di?m d? cuong (UC-03).
- **Lu?ng s? ki?n chính (Khám phá L? trình):**
  1. Ngu?i h?c truy c?p B?ng di?u khi?n L? trình h?c t?p (SCR-L-06).
  2. H? th?ng t?i cây d? cuong khóa h?c v?i các bài h?c mang tr?ng thái PUBLISHED.
  3. H? th?ng hi?n th? tr?c quan tr?ng thái t?ng bài: LOCKED, IN_PROGRESS, COMPLETED, SKIPPED_BY_JUMP.
  4. Ngu?i h?c nh?n ch?n bài h?c dang m? d? kích ho?t Trình phát bài h?c (UC-05).
- **Lu?ng nhánh (Nh?y c?p Ðon v? - Conditional Jump):**
  - *AF-01 (Yêu c?u Nh?y c?p):* Ngu?i h?c b?m vào bi?u tu?ng "Jump" t?i m?t Unit dang b? khóa d? xin vu?t c?p $\rightarrow$ H? th?ng kích ho?t quy trình ki?m tra Jump:
    1. Không có th?i gian ch? ph?t (No cooldown). Ngu?i h?c có th? thi Jump b?t c? lúc nào.
    2. Ð? thi Jump du?c t?o linh ho?t d?a trên ngân hàng câu h?i.
    3. Ngu?i h?c hoàn thành bài ki?m tra Jump.
    4. H? th?ng ch?m di?m: N?u d?t ngu?ng yêu c?u (ví d? $\ge 80\%$), Unit hi?n t?i và các Unit tru?c dó du?c dánh d?u là SKIPPED_BY_JUMP. Ngu?i h?c du?c m? khóa Unit ti?p theo.
- **H?u di?u ki?n:** Ngu?i h?c c?p nh?t du?c l? trình h?c và m? khóa Unit m?i (n?u Jump thành công).

---

### UC-05: Complete Lesson Exercises

- **Mã d?nh danh:** UC-05
- **Tên Use Case:** Hoàn thành Bài t?p Bài h?c (Complete Lesson Exercises)
- **Tác nhân chính:** Learner
- **Kích ho?t:** Ngu?i h?c ch?n m?t bài h?c kh? d?ng trên l? trình h?c t?p (UC-04).
- **Ti?n di?u ki?n:** Bài h?c dang ? tr?ng thái PUBLISHED và dã du?c m? khóa.
- **Lu?ng s? ki?n chính:**
  1. Ngu?i h?c vào Trình phát bài h?c (SCR-L-07).
  2. H? th?ng n?p danh m?c các bài t?p tuong tác thu?c bài h?c này.
  3. Ð?i v?i m?i bài t?p, ngu?i h?c thao tác tr? l?i và nh?n "Ki?m tra":
     - N?u tr? l?i ÐÚNG: H? th?ng phát ph?n h?i thành công và chuy?n sang câu ti?p theo.
     - N?u tr? l?i SAI: H? th?ng hi?n th? dáp án dúng (tùy c?u hình) và dua câu h?i vào danh sách c?n làm l?i (Retry Queue).
  4. **Quy trình Làm l?i (Unlimited Retry):**
     - Ngu?i h?c du?c làm l?i các câu sai mà không b? gi?i h?n s? l?n (không có công th?c allowance ph?t).
     - Ði?m s? không b? tr? khi làm l?i (Không áp d?ng credit 70%).
     - Quá trình làm l?i ti?p t?c cho d?n khi ngu?i h?c vu?t qua toàn b? bài t?p.
  5. Khi hoàn thành t?t c? câu h?i: H? th?ng dánh d?u bài h?c là COMPLETED.
- **H?u di?u ki?n:** Bài h?c chuy?n tr?ng thái COMPLETED trong h? so ti?n d? c?a ngu?i h?c (UserProgress).

---

### UC-06: Spaced Repetition Review (SRS)

- **MÃ£ Ä‘á»‹nh danh:** `UC-06`
- **TÃªn Use Case:** Ã”n táº­p Láº·p láº¡i Ngáº¯t quÃ£ng Tháº» Tá»« vá»±ng (Spaced Repetition Review - SRS)
- **TÃ¡c nhÃ¢n chÃ­nh:** `Learner`
- **KÃ­ch hoáº¡t:** NgÆ°á»i há»c má»Ÿ tab Ã”n táº­p trÃªn á»©ng dá»¥ng, hoáº·c chá»n phiÃªn Ã´n khi cÃ³ thÃ´ng bÃ¡o tháº» tá»« vá»±ng Ä‘áº¿n háº¡n.
- **Tiá»n Ä‘iá»u kiá»‡n:** NgÆ°á»i há»c Ä‘Ã£ cÃ³ cÃ¡c tá»« vá»±ng Ä‘Æ°á»£c náº¡p vÃ o hÃ ng Ä‘á»£i `UserVocabSrs` tá»« cÃ¡c bÃ i há»c Ä‘Ã£ hoÃ n thÃ nh (`UC-05`).
- **Luá»“ng sá»± kiá»‡n chÃ­nh:**
  1. NgÆ°á»i há»c truy cáº­p TrÃ¬nh Ã´n táº­p SRS (`SCR-L-10`).
  2. Há»‡ thá»‘ng truy váº¥n cÃ¡c tháº» tá»« vá»±ng Ä‘áº¿n háº¡n Ã´n táº­p:
     $$\text{nextReviewAt} \le \text{currentDate} \quad (\text{theo mÃºi giá» } \text{Asia/Ho\_Chi\_Minh})$$
  3. Há»‡ thá»‘ng hiá»ƒn thá»‹ láº§n lÆ°á»£t tá»«ng tháº» tá»« vá»±ng (tháº» láº­t gá»£i nhá»›, nghe phÃ¡t Ã¢m, hoáº·c prompt Ä‘iá»n nghÄ©a).
  4. NgÆ°á»i há»c nháº­p cÃ¢u tráº£ lá»i hoáº·c tá»± Ä‘Ã¡nh giÃ¡ má»©c Ä‘á»™ nhá»›.
  5. **Thá»±c thi Thuáº­t toÃ¡n Chu ká»³ Táº¥t Ä‘á»‹nh (Deterministic Policy B - Decision D8):**
     - Ãp dá»¥ng thang khoáº£ng cÃ¡ch ngÃ y cá»‘ Ä‘á»‹nh: $I = [1, 3, 7, 14, 30]$ ngÃ y.
     - **Náº¿u Tráº£ lá»i ÄÃºng:**
       - TÄƒng báº­c chu ká»³: $\text{stage} = \min(5, \text{stage} + 1)$.
       - GÃ¡n khoáº£ng cÃ¡ch má»›i tÆ°Æ¡ng á»©ng: $1 \rightarrow 3 \rightarrow 7 \rightarrow 14 \rightarrow 30$ ngÃ y.
       - Cáº­p nháº­t thá»i Ä‘iá»ƒm Ã´n tiáº¿p theo: $\text{nextReviewAt} = \text{currentDate} + I[\text{stage}]$.
     - **Náº¿u Tráº£ lá»i Sai:**
       - Äáº·t láº¡i báº­c chu ká»³ vá» má»‘c Ä‘áº§u tiÃªn: $\text{stage} = 1$.
       - GÃ¡n khoáº£ng cÃ¡ch: $\text{interval\_days} = 1$ ngÃ y.
       - Cáº­p nháº­t thá»i Ä‘iá»ƒm Ã´n tiáº¿p theo: $\text{nextReviewAt} = \text{currentDate} + 1 \text{ ngÃ y}$.
  6. Há»‡ thá»‘ng thá»±c thi hÃ m cáº­p nháº­t nguyÃªn tá»­ trÃªn cÆ¡ sá»Ÿ dá»¯ liá»‡u:
     $$\text{record\_review}(\text{card\_id}, \text{is\_correct}, \text{recall\_prob}, \text{interval\_days})$$
     *(Ghi chÃº: KÃ½ hiá»‡u hÃ m mang tÃ­nh quy Æ°á»›c logic; phÃ­a DB kiá»ƒm tra cháº·t quyá»n sá»Ÿ há»¯u `auth.uid()`)*.
  7. Báº£n ghi lá»‹ch sá»­ Ã´n táº­p `ReviewLog` Ä‘Æ°á»£c lÆ°u trá»¯ phá»¥c vá»¥ thá»‘ng kÃª.
  8. Há»‡ thá»‘ng ghi nháº­n viá»‡c hoÃ n thÃ nh phiÃªn Ã´n táº­p lÃ  má»™t hoáº¡t Ä‘á»™ng há»£p lá»‡ (Qualifying Activity) phá»¥c vá»¥ tÃ­nh Streak (`UC-07`).
- **Luá»“ng ngoáº¡i lá»‡:**
  - *EF-01 (KhÃ´ng cÃ³ tháº» Ä‘áº¿n háº¡n):* KhÃ´ng cÃ³ tháº» nÃ o cÃ³ `nextReviewAt <= currentDate` $\rightarrow$ Há»‡ thá»‘ng hiá»ƒn thá»‹ thÃ´ng bÃ¡o chÃºc má»«ng "Báº¡n Ä‘Ã£ hoÃ n thÃ nh háº¿t má»¥c tiÃªu Ã´n táº­p hÃ´m nay!" vÃ  gá»£i Ã½ há»c bÃ i má»›i.
- **Háº­u Ä‘iá»u kiá»‡n:**
  - Tráº¡ng thÃ¡i cÃ¡c tháº» trong `UserVocabSrs` Ä‘Æ°á»£c cáº­p nháº­t chu ká»³ vÃ  thá»i Ä‘iá»ƒm Ã´n má»›i.
  - Lá»‹ch sá»­ Ã´n táº­p Ä‘Æ°á»£c lÆ°u vÃ o `ReviewLog`.
- **Quy táº¯c nghiá»‡p vá»¥ Ã¡p dá»¥ng:**
  - `BR-SRS-01`: Chu ká»³ Ã´n táº­p cá»‘ Ä‘á»‹nh theo Policy B: $[1, 3, 7, 14, 30]$ ngÃ y.
  - `BR-SRS-02`: Tráº£ lá»i sai láº­p tá»©c reset chu ká»³ vá» má»‘c 1 ngÃ y.
  - `BR-SRS-03`: Dá»‹ch vá»¥ AI khÃ´ng sá»Ÿ há»¯u quyá»n ghi lá»‹ch Ã´n; thuáº­t toÃ¡n Policy B cháº¡y hoÃ n toÃ n deterministic Ä‘á»™c láº­p vá»›i AI.
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `UserVocabSrs`, `ReviewLog`, `Vocabulary`.
- **Truy váº¿t:** `YC-CORE-08` $\rightarrow$ `MVP-09` $\rightarrow$ `P1-FR-005`, `P1-FR-006` $\rightarrow$ `BF-12`.

---

### UC-07: Track Progress & Streak

- **MÃ£ Ä‘á»‹nh danh:** `UC-07`
- **TÃªn Use Case:** Theo dÃµi Tiáº¿n Ä‘á»™ Há»c táº­p, NÄƒng lá»±c & Chuá»—i NgÃ y Há»c (Track Progress, Mastery & Streak)
- **TÃ¡c nhÃ¢n chÃ­nh:** `Learner`
- **KÃ­ch hoáº¡t:** NgÆ°á»i há»c hoÃ n thÃ nh má»™t hoáº¡t Ä‘á»™ng há»c táº­p há»£p lá»‡, hoáº·c má»Ÿ Báº£ng Ä‘iá»u khiá»ƒn cÃ¡ nhÃ¢n (`/dashboard`).
- **Tiá»n Ä‘iá»u kiá»‡n:** NgÆ°á»i há»c Ä‘Ã£ Ä‘Äƒng nháº­p (`UC-01`).
- **Luá»“ng sá»± kiá»‡n chÃ­nh:**
  1. NgÆ°á»i há»c truy cáº­p Báº£ng Ä‘iá»u khiá»ƒn cÃ¡ nhÃ¢n (`SCR-L-14`).
  2. Há»‡ thá»‘ng tá»•ng há»£p vÃ  hiá»ƒn thá»‹ cÃ¡c chá»‰ sá»‘ theo 4 chiá»u Ä‘á»™c láº­p:
     - **Learning Progress (`P1-FR-004`):** Tá»· lá»‡ pháº§n trÄƒm hoÃ n thÃ nh bÃ i há»c trÃªn cÃ¢y khÃ³a há»c English A1 (`UserProgress = COMPLETED`).
     - **Skill Profile (`P1-FR-016`):** NÄƒng lá»±c 4 chiá»u Ä‘á»™c láº­p (Tá»« vá»±ng, Ngá»¯ phÃ¡p, Äá»c, Nghe) trÃ­ch xuáº¥t tá»« `AssessmentResult` gáº§n nháº¥t (káº¿ thá»«a tá»« `P1-FR-016`), hiá»ƒn thá»‹ trong BÃ¡o cÃ¡o cÃ¡ nhÃ¢n (`MVP-11`).
     - **Concept Mastery:** Tá»•ng sá»‘ khÃ¡i niá»‡m á»Ÿ cÃ¡c tráº¡ng thÃ¡i `MASTERED`, `DEVELOPING`, `NOVICE`.
     - **Level Readiness:** Tráº¡ng thÃ¡i sáºµn sÃ ng chuyá»ƒn cáº¥p (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`).
  3. **Xá»­ lÃ½ chuá»—i ngÃ y há»c liÃªn tá»¥c (Streak Processing - Decision D9, `P1-FR-011`):**
     - Khi ngÆ°á»i há»c hoÃ n thÃ nh Ã­t nháº¥t 1 bÃ i há»c (`UC-05`) hoáº·c 1 phiÃªn Ã´n táº­p tá»« vá»±ng (`UC-06`) trong ngÃ y, há»‡ thá»‘ng ghi nháº­n má»™t **hoáº¡t Ä‘á»™ng há»£p lá»‡ (Qualifying Activity)**.
     - Há»‡ thá»‘ng xÃ¡c Ä‘á»‹nh ngÃ y Ä‘á»‹a phÆ°Æ¡ng hiá»‡n táº¡i theo mÃºi giá» IANA Ä‘Ã£ cáº¥u hÃ¬nh (`Profile.timezone`, máº·c Ä‘á»‹nh `Asia/Ho_Chi_Minh`):
       $$\text{currentDate} = \text{GetLocalDate}(\text{now}(), \text{Profile.timezone})$$
     - So sÃ¡nh vá»›i ngÃ y hoáº¡t Ä‘á»™ng há»£p lá»‡ gáº§n nháº¥t `lastQualifyingActivityDate`:
       - Náº¿u $\text{currentDate} = \text{lastQualifyingActivityDate}$: ÄÃ£ tÃ­ch lÅ©y streak trong ngÃ y hÃ´m nay $\rightarrow$ Giá»¯ nguyÃªn `streakCount`.
       - Náº¿u $\text{currentDate} = \text{lastQualifyingActivityDate} + 1 \text{ ngÃ y}$: NgÆ°á»i há»c duy trÃ¬ há»c liÃªn tá»¥c ngÃ y tiáº¿p theo $\rightarrow$ TÄƒng `streakCount = streakCount + 1`.
       - Náº¿u $\text{currentDate} > \text{lastQualifyingActivityDate} + 1 \text{ ngÃ y}$: Bá»‹ giÃ¡n Ä‘oáº¡n Ã­t nháº¥t má»™t ngÃ y $\rightarrow$ **Äáº·t láº¡i chuá»—i `streakCount = 1`** (Decision D9).
     - Cáº­p nháº­t `lastQualifyingActivityDate = currentDate`.
  4. Há»‡ thá»‘ng cáº­p nháº­t biá»ƒu Ä‘á»“ lá»‹ch sá»­ chuá»—i ngÃ y há»c trÃªn mÃ n hÃ¬nh dashboard.
- **Háº­u Ä‘iá»u kiá»‡n:** `Profile.streakCount` vÃ  `Profile.lastQualifyingActivityDate` Ä‘Æ°á»£c cáº­p nháº­t chÃ­nh xÃ¡c.
- **Quy táº¯c nghiá»‡p vá»¥ Ã¡p dá»¥ng:**
  - `BR-STREAK-01`: Chá»‰ hoÃ n thÃ nh bÃ i há»c hoáº·c hoÃ n thÃ nh phiÃªn SRS má»›i tÃ­nh lÃ  Qualifying Activity; chá»‰ má»Ÿ app khÃ´ng tÃ­nh.
  - `BR-STREAK-02`: Bá»‹ giÃ¡n Ä‘oáº¡n ngÃ y há»c (missed day) Ä‘áº·t láº¡i chuá»—i vá» **1**, TUYá»†T Äá»I KHÃ”NG reset vá» 0 (Decision D9).
  - `BR-STREAK-03`: Má»i phÃ©p tÃ­nh chu ká»³ ngÃ y cÄƒn cá»© theo ngÃ y Ä‘á»‹a phÆ°Æ¡ng trong mÃºi giá» `Asia/Ho_Chi_Minh`, khÃ´ng phá»¥ thuá»™c Ä‘á»“ng há»“ client.
  - `BR-STREAK-04`: TÃ­nh nÄƒng ÄÃ³ng bÄƒng chuá»—i (Streak Freeze) vÃ  Mua láº¡i chuá»—i (Recovery Power-up) bá»‹ hoÃ£n (DEFERRED ngoÃ i pháº¡m vi MVP).
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `Profile`, `LearnerProfile`, `LearningProgress`, `SkillProfile`, `ConceptMastery`, `LevelReadiness`.
- **Truy váº¿t:** `YC-CORE-10`, `YC-CORE-11` $\rightarrow$ `MVP-08`, `MVP-10`, `MVP-11` $\rightarrow$ `P1-FR-004`, `P1-FR-011` (Skill Profile káº¿ thá»«a `P1-FR-016`) $\rightarrow$ `BF-13`. *(LÆ°u Ã½: P1-FR-017 lÃ  yÃªu cáº§u Nice/P2 Achievements & Badges, bá»‹ hoÃ£n DEFERRED ngoÃ i pháº¡m vi MVP Core vÃ  khÃ´ng thuá»™c quyá»n sá»Ÿ há»¯u cá»§a UC-07)*.

---

### UC-08: Create & Edit Lesson Draft

- **Mã d?nh danh:** UC-08
- **Tên Use Case:** T?o & So?n th?o B?n nháp Bài h?c (Create & Edit Lesson Draft)
- **Tác nhân chính:** Lesson Creator, Organizational Manager, Administrator
- **Kích ho?t:** Ngu?i dùng (có quy?n so?n th?o) dang nh?p c?ng tác nghi?p và m? danh sách bài h?c.
- **Ti?n di?u ki?n:** 
  1. Ngu?i dùng có vai trò LESSON_CREATOR, ORGANIZATIONAL_MANAGER ho?c ADMINISTRATOR.
- **Lu?ng s? ki?n chính:**
  1. Ngu?i dùng m? màn hình so?n th?o.
  2. H? th?ng cho phép t?o bài h?c m?i ho?c s?a bài h?c dang ? tr?ng thái DRAFT / CHANGES_REQUESTED.
  3. Ngu?i dùng nh?p li?u thông tin su ph?m: Tiêu d? bài h?c, tóm t?t ng? li?u, di?m ki?n th?c m?c tiêu.
  4. Ngu?i dùng c?u hình danh m?c bài t?p tuong tác (s? lu?ng $ câu h?i linh ho?t, không gi?i h?n c?ng 5 d?ng logic).
  5. Ð?i v?i m?i bài t?p, ngu?i dùng di?n d?y d? Payload theo schema.
  6. Ngu?i dùng luu b?n nháp t?m th?i (tr?ng thái DRAFT).
- **H?u di?u ki?n:** Bài h?c du?c luu ? tr?ng thái DRAFT.
- **Quy t?c nghi?p v? áp d?ng:**
  - BR-CONTENT-01: M?t bài h?c có th? ch?a s? lu?ng bài t?p (Exercises) tùy ý ( \ge 1$).

---

### UC-09: Review & Moderate Content

- **Mã d?nh danh:** UC-09
- **Tên Use Case:** Ki?m duy?t & Th?m d?nh Ch?t lu?ng (Review & Moderate Content)
- **Tác nhân chính:** Moderator, Organizational Manager, Administrator
- **Kích ho?t:** Ngu?i dùng m? Hàng d?i duy?t n?i dung.
- **Ti?n di?u ki?n:** 
  1. Ngu?i dùng có vai trò h?p l?.
  2. Có các bài h?c dang ? tr?ng thái IN_REVIEW.
- **Lu?ng s? ki?n chính:**
  1. Ngu?i dùng m? hàng d?i ki?m duy?t và ch?n m?t bài h?c dang IN_REVIEW.
  2. H? th?ng hi?n th? toàn b? n?i dung bài h?c.
  3. Ngu?i dùng th?c hi?n th?m d?nh.
  4. **Quy?t d?nh phê duy?t (Approval):**
     - Nh?n "Phê duy?t" (Approve) $\rightarrow$ H? th?ng chuy?n tr?ng thái bài h?c thành APPROVED.
- **Lu?ng nhánh (Yêu c?u ch?nh s?a):**
  - Nh?n "Yêu c?u ch?nh s?a" (Request Changes) $\rightarrow$ H? th?ng chuy?n tr?ng thái thành CHANGES_REQUESTED.
- **Lu?ng ngo?i l?:**
  - *Luu ý (Agile MVP):* Quy t?c SoD (Separation of Duties) dã du?c n?i l?ng. Manager và Admin CÓ TH? t? duy?t bài h?c c?a mình d? tang t?c d? phát tri?n.
- **H?u di?u ki?n:** Bài h?c chuy?n tr?ng thái thành APPROVED ho?c CHANGES_REQUESTED.

---

### UC-10: Publish Approved Content

- **Mã d?nh danh:** UC-10
- **Tên Use Case:** Xu?t b?n N?i dung (Publish Content)
- **Tác nhân chính (Authoritative Publisher):** Organizational Manager, Administrator
- **Kích ho?t:** Manager/Admin nh?n nút Xu?t b?n.
- **Ti?n di?u ki?n:** 
  1. Ngu?i th?c hi?n có vai trò ORGANIZATIONAL_MANAGER ho?c ADMINISTRATOR.
  2. Bài h?c dang ? tr?ng thái DRAFT ho?c APPROVED.
- **Lu?ng s? ki?n chính (One-Click Publish):**
  1. Ngu?i dùng ch?n bài h?c và nh?n **"Xu?t b?n" (Publish)**.
  2. H? th?ng chuy?n tr?ng thái bài h?c th?ng sang PUBLISHED (b? qua khâu duy?t n?u c?n).
  3. H? th?ng ghi nh?n publishedAt = now().
  4. H? th?ng ki?m tra Unit ch?a bài h?c: N?u có **ít nh?t 1 bài h?c** du?c PUBLISHED, Unit t? d?ng chuy?n tr?ng thái hi?n th? công khai trên ?ng d?ng ngu?i h?c.
- **H?u di?u ki?n:** Bài h?c mang tr?ng thái PUBLISHED và kh? d?ng d?i v?i ngu?i h?c.
- **Quy t?c nghi?p v? áp d?ng:**
  - BR-UNIT-VIS: Unit hi?n th? trên danh m?c công khai khi có ít nh?t 1 bài h?c mang tr?ng thái PUBLISHED.
  - BR-AGILE-PUB: Manager và Admin có quy?n b? qua lu?ng duy?t kh?t khe d? xu?t b?n tr?c ti?p.

---

### UC-11: Manage Accounts & Roles

- **MÃ£ Ä‘á»‹nh danh:** `UC-11`
- **TÃªn Use Case:** Quáº£n trá»‹ TÃ i khoáº£n & PhÃ¢n quyá»n NgÆ°á»i dÃ¹ng (Manage Accounts & Roles)
- **TÃ¡c nhÃ¢n chÃ­nh:** `Administrator`
- **TÃ¡c nhÃ¢n há»— trá»£:** Supabase GoTrue Auth
- **KÃ­ch hoáº¡t:** Administrator truy cáº­p Trung tÃ¢m Ä‘iá»u hÃ nh ngÆ°á»i dÃ¹ng (`SCR-A-07`).
- **Tiá»n Ä‘iá»u kiá»‡n:** Administrator Ä‘Ã£ Ä‘Äƒng nháº­p vá»›i vai trÃ² `ADMINISTRATOR`.
- **Luá»“ng sá»± kiá»‡n chÃ­nh (Main Success Flow):**
  1. Administrator má»Ÿ danh sÃ¡ch tÃ i khoáº£n ngÆ°á»i dÃ¹ng trong há»‡ thá»‘ng.
  2. Há»‡ thá»‘ng hiá»ƒn thá»‹ danh sÃ¡ch kÃ¨m email, há» tÃªn, vai trÃ² hiá»‡n táº¡i (`role`), tráº¡ng thÃ¡i kÃ­ch hoáº¡t, vÃ  ngÃ y táº¡o.
  3. Administrator chá»n má»™t ngÆ°á»i dÃ¹ng cá»¥ thá»ƒ Ä‘á»ƒ chá»‰nh sá»­a vai trÃ² hoáº·c thÃªm vai trÃ² bá»• trá»£ (`assignedRoles`).
  4. Administrator chá»n vai trÃ² má»›i (vÃ­ dá»¥: gÃ¡n quyá»n `MODERATOR` cho má»™t giáº£ng viÃªn) vÃ  nháº­p lÃ½ do thay Ä‘á»•i.
  5. Administrator nháº¥n "LÆ°u thay Ä‘á»•i".
  6. Há»‡ thá»‘ng kiá»ƒm tra cÃ¡c rÃ ng buá»™c an toÃ n vÃ  cáº­p nháº­t báº£n ghi `Profile`.
  7. Há»‡ thá»‘ng tá»± Ä‘á»™ng ghi nháº­n má»™t báº£n ghi kiá»ƒm toÃ¡n báº¥t biáº¿n `AuditLog` chi tiáº¿t (`action = ROLE_CHANGE`, `adminId`, `targetUserId`, `oldRole`, `newRole`, `reason`).
  8. MÃ n hÃ¬nh hiá»ƒn thá»‹ thÃ´ng bÃ¡o cáº­p nháº­t thÃ nh cÃ´ng.
- **Luá»“ng nhÃ¡nh / Luá»“ng thay tháº¿ (Alternate Flows):**
  - *AF-01 (Táº¡o tÃ i khoáº£n nhÃ¢n sá»± má»›i):* Administrator nháº­p thÃ´ng tin email, há» tÃªn vÃ  vai trÃ² nhÃ¢n sá»± ban Ä‘áº§u $\rightarrow$ Há»‡ thá»‘ng gá»­i thÆ° má»i kÃ­ch hoáº¡t tÃ i khoáº£n kÃ¨m máº­t kháº©u táº¡m thá»i.
  - *AF-02 (Táº¡m khÃ³a / KÃ­ch hoáº¡t láº¡i tÃ i khoáº£n):* Administrator chá»n táº¡m dá»«ng quyá»n truy cáº­p cá»§a má»™t tÃ i khoáº£n nghi váº¥n $\rightarrow$ Há»‡ thá»‘ng cáº­p nháº­t tráº¡ng thÃ¡i `Profile.isActive = false` $\rightarrow$ Há»§y má»i phiÃªn Ä‘Äƒng nháº­p hiá»‡n táº¡i cá»§a ngÆ°á»i dÃ¹ng Ä‘Ã³.
- **Luá»“ng ngoáº¡i lá»‡ (Exception Flows):**
  - *EF-01 (NgÆ°á»i thá»±c hiá»‡n khÃ´ng cÃ³ quyá»n Admin):* NgÆ°á»i dÃ¹ng khÃ´ng cÃ³ vai trÃ² `ADMINISTRATOR` cá»‘ tÃ¬nh gá»i API cáº­p nháº­t quyá»n $\rightarrow$ Há»‡ thá»‘ng cháº·n vá»›i lá»—i `AUTH_FORBIDDEN_ADMIN_ONLY`.
  - *EF-02 (Tá»± tÆ°á»›c quyá»n Administrator duy nháº¥t):* Administrator cá»‘ tÃ¬nh háº¡ quyá»n tÃ i khoáº£n cá»§a chÃ­nh mÃ¬nh trong khi há»‡ thá»‘ng khÃ´ng cÃ²n Admin nÃ o khÃ¡c $\rightarrow$ Há»‡ thá»‘ng tá»« chá»‘i hÃ nh Ä‘á»™ng vá»›i lá»—i `SECURITY_LAST_ADMIN_PROTECTED`.
  - *EF-03 (NgÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i):* MÃ£ Ä‘á»‹nh danh ngÆ°á»i dÃ¹ng khÃ´ng tá»“n táº¡i trong há»‡ thá»‘ng $\rightarrow$ Tráº£ mÃ£ lá»—i `USER_NOT_FOUND`.
- **Háº­u Ä‘iá»u kiá»‡n:** Quyá»n háº¡n tÃ i khoáº£n Ä‘Æ°á»£c cáº­p nháº­t vÃ  ghi nháº­n kiá»ƒm toÃ¡n an ninh báº¥t biáº¿n.
- **Quy táº¯c nghiá»‡p vá»¥ Ã¡p dá»¥ng:**
  - `BR-SEC-01`: Chá»‰ Administrator má»›i cÃ³ quyá»n Ä‘iá»u chá»‰nh vai trÃ² nhÃ¢n sá»± vÃ  phÃ¢n bá»• quyá»n SoD.
  - `BR-SEC-02`: Má»i thay Ä‘á»•i vá» phÃ¢n quyá»n báº¯t buá»™c táº¡o báº£n ghi `AuditLog` báº¥t biáº¿n.
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `Profile`, `AuditLog`.
- **Truy váº¿t:** `YC-CORE-12` $\rightarrow$ `MVP-14`, `MVP-19` $\rightarrow$ `P1-FR-008`, `P1-NFR-001`.

---

### UC-12: View System Reports

- **MÃ£ Ä‘á»‹nh danh:** `UC-12`
- **TÃªn Use Case:** Xem BÃ¡o cÃ¡o & Thá»‘ng kÃª Váº­n hÃ nh Há»‡ thá»‘ng (View System Reports)
- **TÃ¡c nhÃ¢n chÃ­nh:** `Administrator`, `Organizational Manager`
- **KÃ­ch hoáº¡t:** Quáº£n trá»‹ viÃªn truy cáº­p cá»•ng BÃ¡o cÃ¡o thá»‘ng kÃª (`SCR-A-08`).
- **Tiá»n Ä‘iá»u kiá»‡n:** NgÆ°á»i dÃ¹ng cÃ³ vai trÃ² `ADMINISTRATOR` hoáº·c `ORGANIZATIONAL_MANAGER`.
- **Luá»“ng sá»± kiá»‡n chÃ­nh (Main Success Flow):**
  1. Quáº£n trá»‹ viÃªn truy cáº­p mÃ n hÃ¬nh bÃ¡o cÃ¡o tá»•ng há»£p.
  2. Há»‡ thá»‘ng tá»•ng há»£p vÃ  trá»±c quan hÃ³a cÃ¡c nhÃ³m chá»‰ sá»‘ váº­n hÃ nh:
     - Sá»‘ lÆ°á»£ng ngÆ°á»i há»c Ä‘Äƒng kÃ½ má»›i vÃ  hoáº¡t Ä‘á»™ng hÃ ng ngÃ y (DAU/MAU).
     - Tá»· lá»‡ hoÃ n thÃ nh bÃ i há»c vÃ  phÃ¢n bá»• tiáº¿n Ä‘á»™ há»c táº­p.
     - Tá»· lá»‡ vÆ°á»£t qua vÃ  tháº¥t báº¡i trong cÃ¡c bÃ i kiá»ƒm tra Jump / Placement.
     - Hiá»‡u suáº¥t phÃª duyá»‡t há»c liá»‡u cá»§a Ä‘á»™i ngÅ© Creator/Moderator.
  3. Quáº£n trá»‹ viÃªn lá»c dá»¯ liá»‡u theo khoáº£ng thá»i gian, khÃ³a há»c, hoáº·c cáº¥p Ä‘á»™.
  4. Há»‡ thá»‘ng táº£i dá»¯ liá»‡u thá»‘ng kÃª tá»•ng há»£p vÃ  hiá»ƒn thá»‹ biá»ƒu Ä‘á»“ trá»±c quan.
- **Luá»“ng nhÃ¡nh / Luá»“ng thay tháº¿ (Alternate Flows):**
  - *AF-01 (Xuáº¥t bÃ¡o cÃ¡o Ä‘á»‹nh dáº¡ng báº£ng):* Quáº£n trá»‹ viÃªn nháº¥n nÃºt "Xuáº¥t dá»¯ liá»‡u" $\rightarrow$ Há»‡ thá»‘ng káº¿t xuáº¥t dá»¯ liá»‡u bÃ¡o cÃ¡o ra Ä‘á»‹nh dáº¡ng CSV/Excel tá»•ng há»£p (`YC-EXT-08` baseline).
- **Luá»“ng ngoáº¡i lá»‡ (Exception Flows):**
  - *EF-01 (KhÃ´ng cÃ³ quyá»n truy cáº­p bÃ¡o cÃ¡o):* NgÆ°á»i dÃ¹ng mang vai trÃ² `LEARNER`, `LESSON_CREATOR` hoáº·c `MODERATOR` cá»‘ truy cáº­p $\rightarrow$ Há»‡ thá»‘ng cháº·n truy cáº­p vá»›i lá»—i `AUTH_FORBIDDEN_REPORT`.
  - *EF-02 (Táº­p dá»¯ liá»‡u rá»—ng):* Khoáº£ng thá»i gian lá»c khÃ´ng cÃ³ dá»¯ liá»‡u hoáº¡t Ä‘á»™ng $\rightarrow$ Há»‡ thá»‘ng hiá»ƒn thá»‹ tráº¡ng thÃ¡i rá»—ng thÃ¢n thiá»‡n (`EmptyState`: "KhÃ´ng cÃ³ dá»¯ liá»‡u trong khoáº£ng thá»i gian Ä‘Ã£ chá»n").
  - *EF-03 (Khoáº£ng thá»i gian khÃ´ng há»£p lá»‡):* NgÃ y báº¯t Ä‘áº§u lá»›n hÆ¡n ngÃ y káº¿t thÃºc $\rightarrow$ Há»‡ thá»‘ng thÃ´ng bÃ¡o lá»—i `DATE_RANGE_INVALID`.
- **Háº­u Ä‘iá»u kiá»‡n:** BÃ¡o cÃ¡o Ä‘Æ°á»£c hiá»ƒn thá»‹ vÃ  trÃ­ch xuáº¥t an toÃ n.
- **Quy táº¯c nghiá»‡p vá»¥ Ã¡p dá»¥ng:**
  - `BR-REP-01`: Dá»¯ liá»‡u bÃ¡o cÃ¡o tuÃ¢n thá»§ nguyÃªn táº¯c áº©n danh, khÃ´ng lÃ m lá»™ thÃ´ng tin cÃ¡ nhÃ¢n nháº¡y cáº£m cá»§a ngÆ°á»i há»c.
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `Profile`, `Course`, `UserProgress`, `AssessmentResult`.
- **Truy váº¿t:** `YC-CORE-12` $\rightarrow$ `MVP-15` $\rightarrow$ `P1-FR-008`.

---

### UC-13: View & Audit Security Logs

- **MÃ£ Ä‘á»‹nh danh:** `UC-13`
- **TÃªn Use Case:** Tra cá»©u & Kiá»ƒm toÃ¡n Nháº­t kÃ½ An ninh (View & Audit Security Logs)
- **TÃ¡c nhÃ¢n chÃ­nh:** `Administrator`
- **KÃ­ch hoáº¡t:** Administrator má»Ÿ Cá»•ng tra cá»©u kiá»ƒm toÃ¡n an ninh (`SCR-A-09`).
- **Tiá»n Ä‘iá»u kiá»‡n:** Administrator Ä‘Ã£ Ä‘Äƒng nháº­p vá»›i vai trÃ² `ADMINISTRATOR`.
- **Luá»“ng sá»± kiá»‡n chÃ­nh (Main Success Flow):**
  1. Administrator má»Ÿ mÃ n hÃ¬nh nháº­t kÃ½ kiá»ƒm toÃ¡n an ninh.
  2. Há»‡ thá»‘ng truy váº¥n báº£ng `AuditLog` vÃ  hiá»ƒn thá»‹ danh sÃ¡ch sá»± kiá»‡n báº¥t biáº¿n theo thá»© tá»± thá»i gian giáº£m dáº§n:
     - Thá»i Ä‘iá»ƒm sá»± kiá»‡n (`createdAt`).
     - TÃ¡c nhÃ¢n thá»±c hiá»‡n (`userId`, email, vai trÃ²).
     - HÃ nh Ä‘á»™ng thá»±c hiá»‡n (`action`: LOGIN, ROLE_CHANGE, PUBLISH, EMERGENCY_PUBLISH, ARCHIVE, etc.).
     - Äá»‘i tÆ°á»£ng má»¥c tiÃªu (`targetEntity`, `targetId`).
     - Chi tiáº¿t dá»¯ liá»‡u thay Ä‘á»•i (`payload` JSONB: old value vs new value).
     - Äá»‹a chá»‰ IP vÃ  User-Agent.
  3. Administrator cÃ³ thá»ƒ tÃ¬m kiáº¿m theo tÃ¡c nhÃ¢n, lá»c theo loáº¡i hÃ nh Ä‘á»™ng hoáº·c khoáº£ng thá»i gian.
  4. Há»‡ thá»‘ng hiá»ƒn thá»‹ chi tiáº¿t payload kiá»ƒm toÃ¡n tÆ°Æ¡ng á»©ng vá»›i sá»± kiá»‡n Ä‘Æ°á»£c chá»n.
- **Luá»“ng nhÃ¡nh / Luá»“ng thay tháº¿ (Alternate Flows):**
  - *AF-01 (Lá»c sá»± kiá»‡n kháº©n cáº¥p):* Administrator chá»n bá»™ lá»c `isEmergency = true` $\rightarrow$ Há»‡ thá»‘ng lá»c ra toÃ n bá»™ cÃ¡c hÃ nh Ä‘á»™ng xuáº¥t báº£n/gá»¡ bÃ i kháº©n cáº¥p kÃ¨m vÄƒn báº£n giáº£i trÃ¬nh lÃ½ do báº¯t buá»™c.
- **Luá»“ng ngoáº¡i lá»‡ (Exception Flows):**
  - *EF-01 (Truy cáº­p trÃ¡i phÃ©p):* NgÆ°á»i dÃ¹ng khÃ´ng pháº£i `ADMINISTRATOR` cá»‘ truy cáº­p trang log $\rightarrow$ Cháº·n vá»›i lá»—i `AUTH_FORBIDDEN_AUDIT_LOG`.
  - *EF-02 (Cá»‘ tÃ¬nh chá»‰nh sá»­a hoáº·c xÃ³a log):* Báº¥t ká»³ yÃªu cáº§u `UPDATE` hoáº·c `DELETE` nÃ o gá»­i tá»›i báº£ng `AuditLog` $\rightarrow$ RLS vÃ  trigger cÆ¡ sá»Ÿ dá»¯ liá»‡u cháº·n cá»©ng vá»›i lá»—i `AUDIT_LOG_IMMUTABLE`.
  - *EF-03 (Bá»™ lá»c khÃ´ng khá»›p káº¿t quáº£):* TÃ¬m kiáº¿m khÃ´ng tháº¥y báº£n ghi nÃ o $\rightarrow$ Hiá»ƒn thá»‹ thÃ´ng bÃ¡o "KhÃ´ng tÃ¬m tháº¥y sá»± kiá»‡n kiá»ƒm toÃ¡n phÃ¹ há»£p".
- **Háº­u Ä‘iá»u kiá»‡n:** Nháº­t kÃ½ kiá»ƒm toÃ¡n Ä‘Æ°á»£c hiá»ƒn thá»‹ an toÃ n; há»‡ thá»‘ng ghi nháº­n chÃ­nh hÃ nh Ä‘á»™ng tra cá»©u nÃ y vÃ o nháº­t kÃ½ kiá»ƒm toÃ¡n truy cáº­p.
- **Quy táº¯c nghiá»‡p vá»¥ Ã¡p dá»¥ng:**
  - `BR-AUDIT-01`: Báº£ng `AuditLog` lÃ  dá»¯ liá»‡u báº¥t biáº¿n (Append-only); cáº¥m tuyá»‡t Ä‘á»‘i má»i thao tÃ¡c `UPDATE` hay `DELETE` trÃªn báº£ng nÃ y ká»ƒ cáº£ quyá»n Administrator.
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `AuditLog`.
- **Truy váº¿t:** `YC-CORE-12`, `YC-EXT-05` $\rightarrow$ `MVP-15`, `MVP-19` $\rightarrow$ `P1-FR-008`, `P1-NFR-001`.

---

### UC-14: Handle Support Tickets

- **MÃ£ Ä‘á»‹nh danh:** `UC-14`
- **TÃªn Use Case:** Tiáº¿p nháº­n & Xá»­ lÃ½ Phiáº¿u YÃªu cáº§u Há»— trá»£ (Handle Support Tickets)
- **TÃ¡c nhÃ¢n chÃ­nh:** `Operations Staff`
- **TÃ¡c nhÃ¢n há»— trá»£:** `Learner` (ngÆ°á»i gá»­i yÃªu cáº§u), `Moderator` / `Administrator` (tuyáº¿n tiáº¿p nháº­n leo thang)
- **KÃ­ch hoáº¡t:** NgÆ°á»i há»c gá»­i pháº£n Ã¡nh sá»± cá»‘ tá»« á»©ng dá»¥ng, hoáº·c Operations Staff má»Ÿ HÃ ng Ä‘á»£i há»— trá»£ (`SCR-A-10`).
- **Tiá»n Ä‘iá»u kiá»‡n:** NgÆ°á»i dÃ¹ng cÃ³ vai trÃ² `OPERATIONS_STAFF` (hoáº·c `ADMINISTRATOR`).
- **Luá»“ng sá»± kiá»‡n chÃ­nh (Main Success Flow):**
  1. NgÆ°á»i há»c gá»­i phiáº¿u há»— trá»£ (bÃ¡o lá»—i bÃ i táº­p, lá»—i phÃ¡t thanh, sá»± cá»‘ tÃ i khoáº£n). Há»‡ thá»‘ng táº¡o báº£n ghi `SupportTicket` vá»›i tráº¡ng thÃ¡i `OPEN`.
  2. Operations Staff má»Ÿ danh sÃ¡ch phiáº¿u há»— trá»£, tiáº¿p nháº­n phiáº¿u vÃ  chuyá»ƒn tráº¡ng thÃ¡i sang `IN_PROGRESS`.
  3. Operations Staff tra cá»©u thÃ´ng tin há»c viÃªn tá»‘i thiá»ƒu (khÃ´ng lá»™ máº­t kháº©u, khÃ´ng xem dá»¯ liá»‡u riÃªng tÆ° nháº¡y cáº£m).
  4. **PhÃ¢n loáº¡i xá»­ lÃ½:**
     - Sá»± cá»‘ hÆ°á»›ng dáº«n nghiá»‡p vá»¥ thÃ´ng thÆ°á»ng $\rightarrow$ Tráº£ lá»i giáº£i Ä‘Ã¡p cho ngÆ°á»i há»c $\rightarrow$ Chuyá»ƒn tráº¡ng thÃ¡i sang `RESOLVED`.
     - Lá»—i ná»™i dung há»c liá»‡u $\rightarrow$ Chuyá»ƒn tiáº¿p (escalate) phiáº¿u tá»›i `Moderator` phá»¥ trÃ¡ch Ä‘á»ƒ táº¡o vÃ²ng pháº£n há»“i chá»‰nh sá»­a.
     - Lá»—i an ninh hoáº·c sá»± cá»‘ tÃ i khoáº£n $\rightarrow$ Chuyá»ƒn tiáº¿p tá»›i `Administrator`.
  5. Khi phiáº¿u Ä‘Æ°á»£c giáº£i quyáº¿t, há»‡ thá»‘ng gá»­i pháº£n há»“i tá»›i ngÆ°á»i há»c vÃ  Ä‘Ã³ng phiáº¿u (`CLOSED`).
- **Luá»“ng nhÃ¡nh / Luá»“ng thay tháº¿ (Alternate Flows):**
  - *AF-01 (YÃªu cáº§u thÃªm thÃ´ng tin tá»« ngÆ°á»i há»c):* NhÃ¢n viÃªn váº­n hÃ nh gá»­i tin nháº¯n yÃªu cáº§u ngÆ°á»i há»c bá»• sung áº£nh chá»¥p mÃ n hÃ¬nh hoáº·c chi tiáº¿t lá»—i $\rightarrow$ Phiáº¿u chuyá»ƒn tráº¡ng thÃ¡i `WAITING_USER_INPUT`.
- **Luá»“ng ngoáº¡i lá»‡ (Exception Flows):**
  - *EF-01 (Truy cáº­p trÃ¡i phÃ©p):* NgÆ°á»i dÃ¹ng khÃ´ng cÃ³ vai trÃ² `OPERATIONS_STAFF` hoáº·c `ADMINISTRATOR` truy cáº­p hÃ ng Ä‘á»£i há»— trá»£ $\rightarrow$ Cháº·n vá»›i lá»—i `AUTH_FORBIDDEN_SUPPORT`.
  - *EF-02 (Phiáº¿u há»— trá»£ khÃ´ng tá»“n táº¡i):* MÃ£ Ä‘á»‹nh danh ticket sai $\rightarrow$ Tráº£ lá»—i `TICKET_NOT_FOUND`.
  - *EF-03 (NhÃ¢n viÃªn váº­n hÃ nh cá»‘ tÃ¬nh can thiá»‡p Ä‘iá»ƒm sá»‘):* NhÃ¢n viÃªn váº­n hÃ nh cá»‘ gá»i API sá»­a tiáº¿n Ä‘á»™ bÃ i há»c $\rightarrow$ Há»‡ thá»‘ng cháº·n vá»›i lá»—i `SOD_OPS_CANNOT_MODIFY_PROGRESS`.
- **Háº­u Ä‘iá»u kiá»‡n:** `SupportTicket` Ä‘Æ°á»£c giáº£i quyáº¿t hoáº·c chuyá»ƒn tuyáº¿n chÃ­nh xÃ¡c.
- **Quy táº¯c nghiá»‡p vá»¥ Ã¡p dá»¥ng:**
  - `BR-SUP-01`: NhÃ¢n viÃªn Operations Staff chá»‰ cÃ³ quyá»n tra cá»©u tá»‘i thiá»ƒu; tuyá»‡t Ä‘á»‘i khÃ´ng cÃ³ quyá»n can thiá»‡p sá»­a Ä‘á»•i ná»™i dung há»c liá»‡u, khÃ´ng cÃ³ quyá»n duyá»‡t bÃ i hay sá»­a Ä‘iá»ƒm sá»‘ cá»§a há»c viÃªn.
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `SupportTicket`, `Profile`.
- **Truy váº¿t:** `YC-EXT-04` $\rightarrow$ `MVP-16` $\rightarrow$ `BF-15`.

---

### UC-15: Manage Cohorts & Group Progress (Optional / Future Extension)

- **MÃ£ Ä‘á»‹nh danh:** `UC-15`
- **TÃªn Use Case:** Quáº£n lÃ½ NhÃ³m Há»c viÃªn & Tiáº¿n Ä‘á»™ Lá»›p há»c (Manage Cohorts & Group Progress)
- **TÃ¡c nhÃ¢n chÃ­nh:** `Organizational Manager`
- **PhÃ¢n loáº¡i ranh giá»›i:** **`OPTIONAL / FUTURE EXTENSION BOUNDARY`** (NgoÃ i pháº¡m vi triá»ƒn khai MVP Core)
- **KÃ­ch hoáº¡t:** Manager má»Ÿ Cá»•ng quáº£n lÃ½ nhÃ³m tá»• chá»©c (`SCR-A-11`).
- **Tiá»n Ä‘iá»u kiá»‡n:** Tá»• chá»©c giÃ¡o dá»¥c hoáº·c doanh nghiá»‡p cÃ³ gÃ³i Ä‘Ã o táº¡o theo nhÃ³m Ä‘Æ°á»£c kÃ­ch hoáº¡t.
- **Äáº·c táº£ tÃ³m táº¯t ranh giá»›i (Lightweight Boundary Specification):**
  1. Use Case nÃ y Ä‘áº¡i diá»‡n cho phÃ¢n há»‡ má»Ÿ rá»™ng quáº£n lÃ½ tá»• chá»©c B2B, tÃ¡ch biá»‡t hoÃ n toÃ n vá»›i tráº£i nghiá»‡m há»c táº­p cÃ¡ nhÃ¢n cá»‘t lÃµi (`UC-01`..`UC-07`).
  2. Manager cÃ³ thá»ƒ táº¡o nhÃ³m há»c viÃªn (`Cohort`), gÃ¡n chÆ°Æ¡ng trÃ¬nh há»c, vÃ  xem báº£ng tá»•ng há»£p tiáº¿n Ä‘á»™ chung cá»§a cÃ¡c thÃ nh viÃªn trong nhÃ³m.
  3. Sá»± hiá»‡n diá»‡n hay váº¯ng máº·t cá»§a phÃ¢n há»‡ nÃ y khÃ´ng gÃ¢y áº£nh hÆ°á»Ÿng tá»›i báº¥t ká»³ quy táº¯c sÆ° pháº¡m, tiáº¿n trÃ¬nh hay cÆ¡ cháº¿ nÃ o cá»§a há»‡ thá»‘ng há»c viÃªn cÃ¡ nhÃ¢n.
- **Háº­u Ä‘iá»u kiá»‡n:** NhÃ³m há»c viÃªn Ä‘Æ°á»£c liÃªn káº¿t logic á»Ÿ táº§ng má»Ÿ rá»™ng.
- **Thá»±c thá»ƒ miá»n tham chiáº¿u:** `Cohort`, `CohortMember` (MÃ´ hÃ¬nh má»Ÿ rá»™ng / Target Schema tÆ°Æ¡ng lai).
- **Truy váº¿t:** `YC-EXT-08` tÆ°Æ¡ng Ä‘Æ°Æ¡ng $\rightarrow$ `MVP-17` $\rightarrow$ `UC-15 (Extension Boundary)`.

---

## 3. Activity Behavioral Families (BF-01 through BF-15)

Lá»›p hÃ nh vi M2.2 chuáº©n hÃ³a chÃ­nh xÃ¡c **15 há» hÃ nh vi chuáº©n táº¯c** (`BF-01` Ä‘áº¿n `BF-15`) theo nguá»“n tháº©m quyá»n chuáº©n cá»§a `docs/06-system-analysis.md` Â§5. Tuyá»‡t Ä‘á»‘i khÃ´ng tá»± cháº¿ `BF-16` vÃ  khÃ´ng gÃ¡n ghÃ©p sai lá»‡ch thá»© tá»±:

```
+----------------------------------------------------------------------------------------------------+
|                                    15 BEHAVIORAL FAMILIES (BF-01..BF-15)                           |
+------------------------------------+----------------------------------+----------------------------+
| QUáº¢N TRá»Š Äá»€ CÆ¯Æ NG & Há»ŒC LIá»†U       | TIáº¾N TRÃŒNH Há»ŒC VIÃŠN Cá»T LÃ•I      | Há»† THá»NG, GEC & Há»– TRá»¢     |
| - BF-02: Curriculum Planning       | - BF-01: Authentication & Session| - BF-14: Scenario Writing  |
| - BF-03: Content Assignment        | - BF-08: Placement Test          |          & GEC (P1-FR-007) |
| - BF-04: Lesson Authoring          | - BF-09: Learning Lesson Flow    | - BF-15: Operations &      |
| - BF-05: Content Review            | - BF-10: Controlled Retry        |          Ticket Flow       |
| - BF-06: Content Revision (v2)     | - BF-11: Conditional Jump        |                            |
| - BF-07: Content Publication       | - BF-12: SRS Review Flow         |                            |
|                                    | - BF-13: Progress & Streak Track |                            |
+------------------------------------+----------------------------------+----------------------------+
```

### Báº£ng Äáº·c táº£ Ma tráº­n HÃ nh vi 15 Há» BF Chuáº©n táº¯c:

| Há» HÃ nh vi | TÃ¡c nhÃ¢n chÃ­nh | KÃ­ch hoáº¡t (Trigger) | Äáº§u vÃ o (Inputs) | CÃ¡c bÆ°á»›c thá»±c thi chÃ­nh | Ráº½ nhÃ¡nh & Quyáº¿t Ä‘á»‹nh | Äáº§u ra & Thay Ä‘á»•i tráº¡ng thÃ¡i |
|---|---|---|---|---|---|---|
| **BF-01** Authentication Flow | All Roles | NgÆ°á»i dÃ¹ng má»Ÿ app / login | Email, Password, Session Cookie | 1. Gá»­i thÃ´ng tin $\rightarrow$ 2. XÃ¡c thá»±c Supabase $\rightarrow$ 3. Tra cá»©u Profile $\rightarrow$ 4. Set httpOnly cookie | Email Ä‘Ãºng/sai; TÃ i khoáº£n active/locked | Cookie phiÃªn an toÃ n; Profile context náº¡p vÃ o á»©ng dá»¥ng |
| **BF-02** Curriculum Planning Flow | Org Manager | Láº­p káº¿ hoáº¡ch há»c ká»³ | Khung 6 Units English A1, má»¥c tiÃªu bÃ i há»c | 1. Táº¡o cáº¥u trÃºc Course/Unit skeleton $\rightarrow$ 2. XÃ¡c Ä‘á»‹nh danh má»¥c 4 bÃ i há»c/Unit | Khung há»£p lá»‡ $\rightarrow$ Táº¡o cáº¥u trÃºc bÃ i | Course, Unit skeleton táº¡o láº­p á»Ÿ má»©c DRAFT |
| **BF-03** Content Assignment Flow | Org Manager | PhÃ¢n cÃ´ng biÃªn soáº¡n | `Lesson`, danh sÃ¡ch Creator | 1. Manager chá»n bÃ i há»c $\rightarrow$ 2. Nháº­p `assignmentBrief` $\rightarrow$ 3. GÃ¡n `creatorId` | Creator há»£p lá»‡ $\rightarrow$ GÃ¡n bÃ i | BÃ i há»c gÃ¡n quyá»n tÃ¡c giáº£, sáºµn sÃ ng cho Creator soáº¡n |
| **BF-04** Lesson Authoring Flow | Creator | Má»Ÿ bÃ i Ä‘Æ°á»£c phÃ¢n cÃ´ng | Ngá»¯ liá»‡u bÃ i há»c, 5 bÃ i táº­p payload | 1. Soáº¡n tiÃªu Ä‘á» $\rightarrow$ 2. Nháº­p 5 bÃ i táº­p chuáº©n $\rightarrow$ 3. GÃ¡n Concept $\rightarrow$ 4. Báº¥m Gá»­i duyá»‡t | Kiá»ƒm tra Ä‘á»§ 5 bÃ i táº­p; Kiá»ƒm tra Ä‘á»§ Ä‘Ã¡p Ã¡n Ä‘Ãºng | BÃ i há»c chuyá»ƒn tráº¡ng thÃ¡i: `DRAFT â†’ IN_REVIEW` |
| **BF-05** Content Review Flow | Moderator | HÃ ng Ä‘á»£i kiá»ƒm duyá»‡t | BÃ i há»c `IN_REVIEW` | 1. Tháº©m Ä‘á»‹nh ngá»¯ liá»‡u English A1 $\rightarrow$ 2. Kiá»ƒm tra Ä‘Ã¡p Ã¡n $\rightarrow$ 3. ÄÃ¡nh giÃ¡ sÆ° pháº¡m | Äáº¡t chuáº©n $\rightarrow$ PhÃª duyá»‡t; ChÆ°a Ä‘áº¡t $\rightarrow$ YÃªu cáº§u sá»­a | Äáº¡t: `IN_REVIEW â†’ APPROVED`; ChÆ°a Ä‘áº¡t: Chuyá»ƒn sang BF-06 |
| **BF-06** Content Revision Flow | Moderator, Creator | YÃªu cáº§u sá»­a / Sá»­a bÃ i phÃ¡t hÃ nh | Ghi chÃº nháº­n xÃ©t hoáº·c Clone v2 | 1. Moderator gá»­i ghi chÃº $\rightarrow$ 2. BÃ i chuyá»ƒn `CHANGES_REQUESTED` $\rightarrow$ 3. Creator sá»­a $\rightarrow$ 4. Gá»­i láº¡i | Sá»­a bÃ i nhÃ¡p vs Clone bÃ i Ä‘Ã£ xuáº¥t báº£n (v2) | `CHANGES_REQUESTED â†’ DRAFT â†’ IN_REVIEW` (hoáº·c Clone v2 `supersedesId`) |
| **BF-07** Publication Flow | Org Manager | HÃ ng Ä‘á»£i xuáº¥t báº£n | BÃ i há»c `APPROVED` | 1. Manager kiá»ƒm tra $\rightarrow$ 2. Nháº¥n Xuáº¥t báº£n $\rightarrow$ 3. Kiá»ƒm tra Ä‘iá»u kiá»‡n Ä‘á»§ 4/4 bÃ i cá»§a Unit | Äá»§ 4/4 bÃ i $\rightarrow$ Hiá»ƒn thá»‹ Unit; ChÆ°a Ä‘á»§ $\rightarrow$ áº¨n Unit | BÃ i há»c: `APPROVED â†’ PUBLISHED`; Unit hiá»ƒn thá»‹ cÃ´ng khai |
| **BF-08** Placement Test Flow | Learner | Chá»n kiá»ƒm tra trÃ¬nh Ä‘á»™ | CÃ¢u tráº£ lá»i cháº©n Ä‘oÃ¡n thÃ­ch á»©ng | 1. LÃ m Routing Stage $\rightarrow$ 2. LÃ m Targeted Stage $\rightarrow$ 3. TÃ­nh Ä‘iá»ƒm thÃ´ $\rightarrow$ 4. Ãp dá»¥ng Mapping A | Äiá»ƒm rÆ¡i vÃ o 6 dáº£i: 0â€“7 (U1), 8â€“12 (U2), ..., 27â€“30 (U6) | `AssessmentResult` báº¥t biáº¿n; `SkillProfile` 4 chiá»u; Starting Unit má»Ÿ khÃ³a |
| **BF-09** Learning Lesson Flow | Learner | Chá»n bÃ i trÃªn lá»™ trÃ¬nh | Thao tÃ¡c tráº£ lá»i 5 bÃ i táº­p | 1. Hiá»ƒn thá»‹ Ä‘á» bÃ i $\rightarrow$ 2. Nháº­n cÃ¢u tráº£ lá»i $\rightarrow$ 3. Tráº£ vá» pháº£n há»“i tá»©c thÃ¬ + giáº£i thÃ­ch | ÄÃºng $\rightarrow$ Tiáº¿p tá»¥c; Sai $\rightarrow$ ÄÆ°a vÃ o danh sÃ¡ch retry | Cáº­p nháº­t báº±ng chá»©ng Concept; chuyá»ƒn tiáº¿p sang BF-10 |
| **BF-10** Controlled Retry Flow | Learner | Káº¿t thÃºc lÆ°á»£t first-pass | CÃ¡c cÃ¢u tráº£ lá»i sai | 1. TÃ­nh allowance $= \max(1, \lfloor N \cdot 0.1 \rfloor) = 1 \rightarrow$ 2. LÃ m láº¡i cÃ¢u sai | LÃ m láº¡i Ä‘Ãºng $\rightarrow$ Nháº­n 70% credit; Sai $\rightarrow$ KhÃ´ng cÃ³ Ä‘iá»ƒm | HoÃ n thÃ nh bÃ i: `UserProgress = COMPLETED`; 0 Ä‘iá»ƒm sÃ n 80% |
| **BF-11** Conditional Jump Flow | Learner | Chá»n Jump táº¡i Unit khÃ³a | BÃ i lÃ m 20/25-30/40 cÃ¢u Jump | 1. Check cooldown 24h $\rightarrow$ 2. LÃ m bÃ i Jump $\rightarrow$ 3. ÄÃ¡nh giÃ¡ tá»· lá»‡ Ä‘Ãºng | $\ge 95\% \rightarrow$ PASS; $< 95\% \rightarrow$ FAIL (kÃ­ch hoáº¡t 24h cooldown) | PASS: `SKIPPED_BY_JUMP` (`by_jump = true`); FAIL: 24h cooldown |
| **BF-12** SRS Review Flow | Learner | Má»Ÿ tab Ã”n táº­p | HÃ ng Ä‘á»£i tháº» Ä‘áº¿n háº¡n | 1. QuÃ©t tháº» Ä‘áº¿n háº¡n $\rightarrow$ 2. LÃ m bÃ i gá»£i nhá»› $\rightarrow$ 3. Ãp dá»¥ng Policy B $[1,3,7,14,30]$ | ÄÃºng $\rightarrow$ TÄƒng má»‘c ngÃ y; Sai $\rightarrow$ Reset vá» má»‘c 1 ngÃ y | Cháº¡y RPC `record_review` cáº­p nháº­t `nextReviewAt` + `ReviewLog` |
| **BF-13** Progress & Streak Tracking Flow | Learner | HoÃ n thÃ nh bÃ i / SRS | Hoáº¡t Ä‘á»™ng há»£p lá»‡, Timezone | 1. XÃ¡c Ä‘á»‹nh ngÃ y há»c $\rightarrow$ 2. So sÃ¡nh ngÃ y trÆ°á»›c Ä‘Ã³ $\rightarrow$ 3. Cáº­p nháº­t chuá»—i Streak | LiÃªn tá»¥c $\rightarrow +1$; GiÃ¡n Ä‘oáº¡n $\ge 1$ ngÃ y $\rightarrow$ **Reset vá» 1** | Cáº­p nháº­t `Profile.streakCount`, `lastQualifyingActivityDate` |
| **BF-14** Scenario Writing with GEC Flow | Learner | Viáº¿t cÃ¢u tá»± do tÃ¬nh huá»‘ng | CÃ¢u vÄƒn tiáº¿ng Anh cá»§a ngÆ°á»i há»c | 1. Nháº­p cÃ¢u $\rightarrow$ 2. BFF proxy gá»i FastAPI `/v1/gec/correct` $\rightarrow$ 3. Hiá»ƒn thá»‹ diff lá»—i | CÃ³ lá»—i $\rightarrow$ Hiá»ƒn thá»‹ gá»£i Ã½ sá»­a; KhÃ´ng lá»—i $\rightarrow$ Khen ngá»£i | Káº¿t quáº£ hiá»ƒn thá»‹ tá»©c thá»i; **KHÃ”NG lÆ°u lá»—i vÃ o DB**, khÃ´ng tÃ­nh Ä‘iá»ƒm |
| **BF-15** Operations & Ticket Flow | Operations Staff | NgÆ°á»i há»c gá»­i pháº£n Ã¡nh | Ná»™i dung pháº£n Ã¡nh sá»± cá»‘ | 1. Má»Ÿ ticket $\rightarrow$ 2. Tra cá»©u há»c viÃªn tá»‘i thiá»ƒu $\rightarrow$ 3. Xá»­ lÃ½ hoáº·c chuyá»ƒn tuyáº¿n | Nghiá»‡p vá»¥ $\rightarrow$ Giáº£i quyáº¿t; Ná»™i dung $\rightarrow$ BÃ¡o Moderator | `SupportTicket` chuyá»ƒn tráº¡ng thÃ¡i: `OPEN â†’ IN_PROGRESS â†’ RESOLVED` |

---

## 4. State Machine Specifications

### 4.1. Content Lifecycle State Machine

TÃ¡i sá»­ dá»¥ng nguyÃªn vÄƒn mÃ´ hÃ¬nh 6 tráº¡ng thÃ¡i Ä‘Ã£ Ä‘Æ°á»£c nghiá»‡m thu táº¡i M2.1 Â§5 vÃ  biá»ƒu Ä‘á»“ `docs/plantuml/content-lifecycle-state.puml`. M2.2 Ä‘Ã³ng vai trÃ² rÃ ng buá»™c hÃ nh vi vÃ o cÃ¡c Use Cases tÃ¡c nghiá»‡p:

```
                  [ Creator Drafts ]
                          |
                          v
    +-----------------------------------------------+
    |                     DRAFT                     |<-------------------+
    +-----------------------------------------------+                    |
                          |                                              |
                          | Submit for Review (UC-08)                    |
                          v                                              |
    +-----------------------------------------------+                    |
    |                   IN_REVIEW                   |                    |
    +-----------------------------------------------+                    |
         |                                     |                         |
         | Approve (UC-09)                     | Request Changes (UC-09) |
         v                                     v                         |
    +-------------------+    +------------------------------------+      |
    |     APPROVED      |    |          CHANGES_REQUESTED         |------+
    +-------------------+    +------------------------------------+
         |         |
         |         | Emergency Publish (Admin only, reason + AuditLog)
         |         +-----------------------+
         | Normal Publish (Org Manager, UC-10)
         v                                 v
    +-----------------------------------------------+
    |                   PUBLISHED                   |
    +-----------------------------------------------+
                          |
                          | Archive (Org Manager normal / Admin emergency)
                          v
    +-----------------------------------------------+
    |                   ARCHIVED                    |  (Terminal in Core)
    +-----------------------------------------------+
```

**CÃ¡c quy táº¯c hÃ nh vi vÃ²ng Ä‘á»i ná»™i dung:**
1. `Tráº¡ng thÃ¡i khá»Ÿi Ä‘áº§u`: Má»i bÃ i há»c báº¯t Ä‘áº§u á»Ÿ `DRAFT`.
2. `Tháº©m quyá»n duyá»‡t`: Chá»‰ `MODERATOR` má»›i cÃ³ quyá»n chuyá»ƒn `IN_REVIEW â†’ APPROVED` hoáº·c `IN_REVIEW â†’ CHANGES_REQUESTED`. Tuyá»‡t Ä‘á»‘i khÃ´ng dÃ¹ng tÃªn tráº¡ng thÃ¡i `REJECTED`.
3. `Tháº©m quyá»n xuáº¥t báº£n chuáº©n táº¯c`: Äá»™c quyá»n thuá»™c vá» `ORGANIZATIONAL_MANAGER` thá»±c hiá»‡n trÃªn bÃ i há»c Ä‘ang mang tráº¡ng thÃ¡i `APPROVED`.
4. `Tháº©m quyá»n xuáº¥t báº£n kháº©n cáº¥p`: `ADMINISTRATOR` chá»‰ Ä‘Æ°á»£c xuáº¥t báº£n kháº©n cáº¥p cho bÃ i há»c **ÄÃƒ MANG TRáº NG THÃI `APPROVED`**, báº¯t buá»™c kÃ¨m lÃ½ do giáº£i trÃ¬nh vÃ  ghi nháº­n `AuditLog`. Tuyá»‡t Ä‘á»‘i cáº¥m Administrator xuáº¥t báº£n bÃ i há»c Ä‘ang `IN_REVIEW` hay `DRAFT`.
5. `TÃ­nh káº¿t thÃºc cá»§a ARCHIVED`: Tráº¡ng thÃ¡i `ARCHIVED` lÃ  Ä‘iá»ƒm dá»«ng cuá»‘i cÃ¹ng (terminal) trong pháº¡m vi Core. Cáº¥m chuyá»ƒn trá»±c tiáº¿p `ARCHIVED â†’ DRAFT`. Khi cáº§n sá»­a bÃ i Ä‘Ã£ xuáº¥t báº£n/lÆ°u trá»¯, báº¯t buá»™c dÃ¹ng cÆ¡ cháº¿ **Clone-to-Draft v2** táº¡o bÃ i há»c má»›i vá»›i `supersedesId`.

---

### 4.2. Learning Progression State Machine

Tiáº¿n trÃ¬nh chuyá»ƒn cáº¥p cá»§a há»c viÃªn Ä‘Æ°á»£c Ä‘iá»u chá»‰nh bá»Ÿi mÃ´ hÃ¬nh 3 tráº¡ng thÃ¡i Ä‘áº§u ra chuáº©n táº¯c káº¿ thá»«a tá»« D3 Â§F:

```
                    [ HoÃ n thÃ nh Unit / ÄÃ¡nh giÃ¡ Chuyá»ƒn tiáº¿p ]
                                       |
                                       v
                    +------------------------------------+
                    |        EVALUATE READINESS          |  (NgÆ°á»¡ng Ä‘Ã¡nh giÃ¡ CONFIGURABLE)
                    +------------------------------------+
                                       |
            +--------------------------+--------------------------+
            |                          |                          |
       TiÃªu chÃ­ Äáº¡t               TiÃªu chÃ­ Äáº¡t cÃ³ Há»— trá»£     TiÃªu chÃ­ Cáº§n Bá»• khuyáº¿t
            |                          |                          |
            v                          v                          v
    +---------------+      +-----------------------+      +---------------+
    |    ADVANCE    |      | ADVANCE_WITH_SUPPORT  |      |   REMEDIATE   |
    +---------------+      +-----------------------+      +---------------+
            |                          |                          |
   Má»Ÿ khÃ³a Unit sau       Má»Ÿ khÃ³a Unit sau kÃ¨m bÃ i     KÃ­ch hoáº¡t RemedialModule
    ngay láº­p tá»©c            luyá»‡n táº­p bá»• trá»£ nháº¹          há»c bÃ¹ concept há»•ng
```

**CÃ¡c báº¥t biáº¿n hÃ nh vi tiáº¿n trÃ¬nh:**
- `KhÃ´ng tá»± Ä‘á»™ng chuyá»ƒn cáº¥p (No Automatic Advance)`: HoÃ n thÃ nh 100% bÃ i há»c khÃ´ng Ä‘á»“ng nghÄ©a vá»›i tá»± Ä‘á»™ng nÃ¢ng cáº¥p Ä‘á»™ nÄƒng lá»±c hay tá»± Ä‘á»™ng má»Ÿ khÃ³a náº¿u chÆ°a Ä‘áº¡t tiÃªu chÃ­ Readiness.
- `KhÃ´ng háº¡ cáº¥p toÃ n bá»™ (No Whole-level Downgrade)`: Ká»¹ nÄƒng yáº¿u chá»‰ kÃ­ch hoáº¡t há»— trá»£ hoáº·c mÃ´-Ä‘un bá»• khuyáº¿t cho khÃ¡i niá»‡m há»•ng; tuyá»‡t Ä‘á»‘i khÃ´ng háº¡ cáº¥p Ä‘á»™ tá»•ng thá»ƒ cá»§a há»c viÃªn.
- `KhÃ´ng báº¯t há»c láº¡i bÃ i cÅ© (No Forced Replay)`: MÃ´-Ä‘un bá»• khuyáº¿t `RemedialModule` báº¯t buá»™c phÃ¢n phá»‘i ngá»¯ cáº£nh má»›i, tá»« vá»±ng má»›i, bÃ i táº­p má»›i Ä‘á»ƒ cá»§ng cá»‘ concept cÅ©.
- `Tráº¡ng thÃ¡i trung gian`: Loáº¡i bá» hoÃ n toÃ n cÃ¡c nhÃ£n khÃ´ng chuáº©n táº¯c nhÆ° `NOT_READY` hay `EVALUATING` khá»i táº­p tráº¡ng thÃ¡i káº¿t quáº£; 3 tráº¡ng thÃ¡i há»£p lá»‡ duy nháº¥t lÃ  `ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`. Má»i ngÆ°á»¡ng sá»‘ há»c giá»¯ nguyÃªn tráº¡ng thÃ¡i `CONFIGURABLE / OPEN`.

---

### 4.3. KnowledgeGap State Machine

VÃ²ng Ä‘á»i cá»§a má»™t lá»— há»•ng kiáº¿n thá»©c Ä‘Æ°á»£c phÃ¡t hiá»‡n:

$$\text{OPEN} \xrightarrow{\text{Giao RemedialModule}} \text{IN\_REMEDIATION} \xrightarrow{\text{VÆ°á»£t qua bÃ i kiá»ƒm tra bá»• trá»£}} \text{RESOLVED}$$

- `OPEN`: ÄÆ°á»£c táº¡o tá»± Ä‘á»™ng khi há»c viÃªn máº¯c lá»—i sai liÃªn tiáº¿p/láº·p láº¡i trÃªn cÃ¹ng má»™t Concept vÆ°á»£t ngÆ°á»¡ng cho phÃ©p (thay tháº¿ nhÃ£n cÅ© `DETECTED`; ngÆ°á»¡ng sá»‘ lá»—i cá»¥ thá»ƒ giá»¯ `CONFIGURABLE`).
- `IN_REMEDIATION`: Chuyá»ƒn sang tráº¡ng thÃ¡i nÃ y khi há»c viÃªn báº¯t Ä‘áº§u há»c mÃ´-Ä‘un bá»• khuyáº¿t Ä‘Æ°á»£c giao.
- `RESOLVED`: KhÃ©p láº¡i khi há»c viÃªn vÆ°á»£t qua bÃ i kiá»ƒm tra cá»§ng cá»‘ cá»§a mÃ´-Ä‘un bá»• khuyáº¿t.
- `ChÃ­nh sÃ¡ch lÆ°u trá»¯ (Archival Policy)`: Giá»¯ nguyÃªn tráº¡ng thÃ¡i `OPEN / PENDING` káº¿ thá»«a tá»« D3 Â§N.

---

### 4.4. ConceptMastery State Machine

Má»©c Ä‘á»™ thuáº§n thá»¥c cá»§a há»c viÃªn Ä‘á»‘i vá»›i má»™t Ä‘iá»ƒm kiáº¿n thá»©c tuÃ¢n thá»§ 3 tráº¡ng thÃ¡i chuáº©n táº¯c:

$$\text{NOVICE} \xrightarrow{\text{Báº±ng chá»©ng Ä‘Ãºng ban Ä‘áº§u}} \text{DEVELOPING} \xrightarrow{\text{Báº±ng chá»©ng Ä‘Ãºng nháº¥t quÃ¡n vÃ  duy trÃ¬}} \text{MASTERED}$$

- Thay tháº¿ hoÃ n toÃ n cÃ¡c nhÃ£n cÅ© `INTRODUCED` vÃ  `PRACTICING` báº±ng `NOVICE` vÃ  `DEVELOPING`.
- Khi há»c viÃªn máº¯c lá»—i nghiÃªm trá»ng hoáº·c quÃªn tá»« vá»±ng lÃ¢u ngÃ y, tráº¡ng thÃ¡i cÃ³ thá»ƒ bá»‹ Ä‘iá»u chá»‰nh ngÆ°á»£c tá»« `MASTERED â†’ DEVELOPING` hoáº·c `DEVELOPING â†’ NOVICE`.
- Má»i ngÆ°á»¡ng sá»‘ cÃ¢u Ä‘Ãºng/sai cá»¥ thá»ƒ Ä‘á»ƒ chuyá»ƒn tráº¡ng thÃ¡i giá»¯ nguyÃªn lÃ  `CONFIGURABLE / PENDING VALIDATION`. KhÃ´ng tá»± cháº¿ cÆ¡ cháº¿ phÃ¢n rÃ£ (decay mechanics) hay Ä‘Ã¡nh sá»‘ stage cá»©ng.

---

### 4.5. Assessment Entry & Result Behavior (TÃ¡ch biá»‡t Tuyá»‡t Ä‘á»‘i 2 NhÃ¡nh)

Há»‡ thá»‘ng thiáº¿t láº­p ranh giá»›i tÃ¡ch báº¡ch tuyá»‡t Ä‘á»‘i giá»¯a hai luá»“ng nháº­p mÃ´n cá»§a há»c viÃªn:

#### NhÃ¡nh 1: Tá»± khai bÃ¡o cáº¥p Ä‘á»™ / Bá» qua (Self-reported Entry / Skip)
```text
NgÆ°á»i há»c tá»± chá»n trÃ¬nh Ä‘á»™ (A1) hoáº·c báº¥m Bá» qua (Skip)
  â”‚
  â–¼
Cáº­p nháº­t Profile: selfReportedLevel = "A1", status = UNVERIFIED
  â”‚
  â–¼
Thiáº¿t láº­p xuáº¥t phÃ¡t Ä‘iá»ƒm táº¡m thá»i: curriculumStartingPoint = Unit 1 (provisional)
  â”‚
  â”œâ”€â”€â–º TUYá»†T Äá»I KHÃ”NG Táº O Báº¢N GHI AssessmentResult
  â”œâ”€â”€â–º TUYá»†T Äá»I KHÃ”NG Táº O Báº¢N GHI SkillProfile
  â””â”€â”€â–º TUYá»†T Äá»I KHÃ”NG GHI NHáº¬N verifiedProficiency
```

#### NhÃ¡nh 2: LÃ m bÃ i ÄÃ¡nh giÃ¡ Cháº©n Ä‘oÃ¡n Xáº¿p lá»›p (Diagnostic Assessment Entry)
```text
NgÆ°á»i há»c thá»±c hiá»‡n bÃ i kiá»ƒm tra cháº©n Ä‘oÃ¡n thÃ­ch á»©ng (~25â€“30 cÃ¢u, PROPOSED)
  â”‚
  â–¼
HoÃ n thÃ nh bÃ i thi
  â”‚
  â–¼
Táº¡o báº£n ghi AssessmentResult báº¥t biáº¿n (assessmentType=DIAGNOSTIC, deliveryMode=PLACEMENT)
  â”‚
  â–¼
Khá»Ÿi táº¡o / Cáº­p nháº­t SkillProfile 4 chiá»u (Vocab, Grammar, Reading, Listening)
  â”‚
  â–¼
XÃ¡c nháº­n nÄƒng lá»±c kiá»ƒm chá»©ng: verifiedProficiency = verified
  â”‚
  â–¼
Ãnh xáº¡ Mapping A: Thiáº¿t láº­p curriculumStartingPoint = Unit X (X âˆˆ [1..6])
```

#### CÃ¡c Báº¥t biáº¿n HÃ nh vi Cá»‘t lÃµi:
$$\text{Self-reported} \ne \text{Verified}$$
$$\text{Starting Point} \ne \text{Proficiency}$$
$$\text{Learning Completion} \ne \text{Proficiency}$$

#### Quy táº¯c Báº¥t biáº¿n cá»§a Thá»±c thá»ƒ AssessmentResult:
- **KhÃ´ng pháº£i mÃ¡y tráº¡ng thÃ¡i nghiá»‡p vá»¥ biáº¿n thiÃªn**: `AssessmentResult` khÃ´ng bao giá» chuyá»ƒn qua cÃ¡c tráº¡ng thÃ¡i nhÆ° `in_review`, `approved`, hay `published`.
- **HÃ nh trÃ¬nh duy nháº¥t**:
  $$\text{Assessment Execution} \longrightarrow \text{AssessmentResult Created} \longrightarrow \text{Completed} \longrightarrow \text{Immutable Persisted Evidence}$$
- **NguyÃªn táº¯c LÃ m láº¡i (Retake)**: Má»i lÆ°á»£t thi láº¡i (Retake hoáº·c Re-evaluation) **báº¯t buá»™c táº¡o má»™t báº£n ghi `AssessmentResult` hoÃ n toÃ n má»›i**, giá»¯ nguyÃªn váº¹n báº£n ghi cÅ© trong cÆ¡ sá»Ÿ dá»¯ liá»‡u Ä‘á»ƒ phá»¥c vá»¥ kiá»ƒm toÃ¡n vÃ  theo dÃµi tiáº¿n bá»™ lá»‹ch sá»­.

---

## 5. Progression, Placement & Jump Decision Behavior

### 5.1. Curriculum Progression Behavior
- Äá» cÆ°Æ¡ng khÃ³a há»c English A1 gá»“m **6 Units**, má»—i Unit gá»“m **4 Lessons**, tá»•ng cá»™ng 24 Lessons.
- BÃ i há»c thá»© 4 cá»§a má»—i Unit (vÃ­ dá»¥ `U1-L4`) lÃ  bÃ i Ã´n táº­p vÃ  cá»§ng cá»‘ tÃ­ch há»£p (*Review Gate*). HoÃ n thÃ nh bÃ i nÃ y cho phÃ©p há»‡ thá»‘ng Ä‘Ã¡nh giÃ¡ Readiness trÆ°á»›c khi má»Ÿ Unit káº¿ tiáº¿p.
- `Quy táº¯c hiá»ƒn thá»‹ Unit (Catalog Visibility)`: Má»™t Unit chá»‰ xuáº¥t hiá»‡n trÃªn danh má»¥c bÃ i há»c khi vÃ  chá»‰ khi cáº£ 4/4 bÃ i há»c con Ä‘á»u mang tráº¡ng thÃ¡i `PUBLISHED` (D4 Â§D).

---

### 5.2. Placement Decision Behavior (English A1 Mapping A)

DÃ nh riÃªng cho chÆ°Æ¡ng trÃ¬nh **English A1 Pilot**. Tuyá»‡t Ä‘á»‘i khÃ´ng Ã¡p dá»¥ng Ä‘á»ƒ cáº¥p chá»©ng chá»‰ hay quy Ä‘á»•i quá»‘c táº¿ CEFR:

```
                            [ Thang Ä‘iá»ƒm ThÃ´: Raw Score Range (0 - 30) ]
                                               â”‚
         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
         â”‚               â”‚                â”‚                â”‚                â”‚               â”‚
     0 - 7 Ä‘iá»ƒm      8 - 12 Ä‘iá»ƒm     13 - 17 Ä‘iá»ƒm     18 - 22 Ä‘iá»ƒm     23 - 26 Ä‘iá»ƒm    27 - 30 Ä‘iá»ƒm
         â”‚               â”‚                â”‚                â”‚                â”‚               â”‚
         â–¼               â–¼                â–¼                â–¼                â–¼               â–¼
      Unit 1          Unit 2           Unit 3           Unit 4           Unit 5          Unit 6
```

- **Quy mÃ´ Ä‘á» thi**: `~25â€“30 items, PROPOSED / PENDING VALIDATION`. Thang Ä‘iá»ƒm 0â€“30 lÃ  dáº£i Ä‘iá»ƒm thÃ´ quy Æ°á»›c cá»§a Mapping A, khÃ´ng Ä‘á»“ng nháº¥t vá»›i viá»‡c báº¯t buá»™c náº¡p Ä‘Ãºng 30 cÃ¢u há»i.
- **Thao tÃ¡c Bá» qua (Skip)**: Tá»± Ä‘á»™ng gÃ¡n xuáº¥t phÃ¡t táº¡m thá»i Unit 1 (`provisional`), khÃ´ng ghi nháº­n Ä‘iá»ƒm sá»‘, khÃ´ng táº¡o `AssessmentResult`.
- **LÃ m láº¡i bÃ i thi (Retake)**: Táº¡o `AssessmentResult` má»›i, cáº­p nháº­t `SkillProfile` má»›i vÃ  Ä‘iá»u chá»‰nh láº¡i Starting Unit tÆ°Æ¡ng á»©ng.

---

### 5.3. Jump Assessment Decision Behavior

Náº±m trong pháº¡m vi nÄƒng lá»±c cá»§a **`UC-04` (KhÃ¡m phÃ¡ Lá»™ trÃ¬nh & Nháº£y cáº¥p)** vÃ  há» hÃ nh vi **`BF-11` (Conditional Jump Flow)**. Cho phÃ©p ngÆ°á»i há»c giá»i bá» qua cÃ¡c Unit ná»™i dung Ä‘Ã£ náº¯m vá»¯ng Ä‘á»ƒ tá»‘i Æ°u hÃ³a thá»i gian:

```
                          [ NgÆ°á»i há»c yÃªu cáº§u Jump tá»›i Unit ÄÃ­ch (UC-04) ]
                                              â”‚
                                              â–¼
                              Kiá»ƒm tra Cooldown: CÃ³ trong 24h trÆ°á»£t trÆ°á»›c?
                                              â”‚
                           â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                          CÃ³                                    KhÃ´ng
                           â”‚                                     â”‚
                           â–¼                                     â–¼
                 Tá»« chá»‘i lÃ m bÃ i                         XÃ¡c Ä‘á»‹nh quy mÃ´ Ä‘á» thi:
              Hiá»ƒn thá»‹ Ä‘á»“ng há»“ Ä‘áº¿m                     - Nháº£y 1 Unit: 20 cÃ¢u
                                                       - Nháº£y 2â€“3 Units: 25â€“30 cÃ¢u
                                                       - Nháº£y >3 Units: 40 cÃ¢u
                                                                 â”‚
                                                                 â–¼
                                                         NgÆ°á»i há»c ná»™p bÃ i
                                                                 â”‚
                                               â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                               â–¼                                   â–¼
                                        Tá»· lá»‡ Ä‘Ãºng â‰¥ 95%                    Tá»· lá»‡ Ä‘Ãºng < 95%
                                               â”‚                                   â”‚
                                               â–¼                                   â–¼
                                         [ JUMP PASS ]                       [ JUMP FAIL ]
                                - Táº¡o AssessmentResult (PASS)        - Táº¡o AssessmentResult (FAIL)
                                - GÃ¡n SKIPPED_BY_JUMP /              - KÃ­ch hoáº¡t Cooldown 24 giá»
                                  UNLOCKED_BY_JUMP (by_jump=true)    - ThÃ´ng bÃ¡o thá»­ láº¡i sau 24h
                                - Má»Ÿ khÃ³a Unit Ä‘Ã­ch ngay láº­p tá»©c
                                - TUYá»†T Äá»I Cáº¤M COMPLETED_BY_JUMP
```

**Báº£ng RÃ ng buá»™c Ká»¹ thuáº­t BÃ i thi Jump:**
| Tham sá»‘ | GiÃ¡ trá»‹ chuáº©n táº¯c Ä‘Ã£ Ä‘Ã³ng bÄƒng | Ã nghÄ©a nghiá»‡p vá»¥ |
|---|---|---|
| **NgÆ°á»¡ng Ä‘áº¡t (Pass Threshold)** | $\ge 95.0\%$ | Äáº£m báº£o há»c viÃªn thá»±c sá»± xuáº¥t sáº¯c má»›i Ä‘Æ°á»£c nháº£y qua bÃ i há»c |
| **Thá»i gian pháº¡t (Cooldown)** | ÄÃºng **24 giá»** | NgÄƒn cháº·n hÃ nh vi Ä‘oÃ¡n mÃ² hoáº·c spam bÃ i kiá»ƒm tra nháº£y cáº¥p |
| **Quy mÃ´ Ä‘á» 1 Unit** | **20 cÃ¢u há»i** | Kiá»ƒm tra cÃ´ Ä‘á»ng kiáº¿n thá»©c trá»ng tÃ¢m cá»§a 1 Unit |
| **Quy mÃ´ Ä‘á» 2â€“3 Units** | **25 â€“ 30 cÃ¢u há»i** | ÄÃ¡nh giÃ¡ tá»•ng há»£p kiáº¿n thá»©c liÃªn Unit |
| **Quy mÃ´ Ä‘á» $>3$ Units** | **40 cÃ¢u há»i** | ÄÃ¡nh giÃ¡ bao quÃ¡t toÃ n diá»‡n trÆ°á»›c khi cho phÃ©p nháº£y xa |
| **NhÃ£n xuáº¥t xá»© Unit** | `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` | Ghi nháº­n cá» `by_jump = true`; cáº¥m gÃ¡n nhÃ£n Ä‘Ã£ há»c xong |

---

## 6. Exercise & Controlled Retry Behavior

### 6.1. Quy trÃ¬nh Thá»±c hiá»‡n BÃ i táº­p & Pháº£n há»“i Tá»©c thÃ¬
1. NgÆ°á»i há»c nháº­n Ä‘á» bÃ i tÆ°Æ¡ng tÃ¡c tá»« 1 trong 5 dáº¡ng chuáº©n táº¯c: `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`.
2. NgÆ°á»i há»c chá»n/nháº­p Ä‘Ã¡p Ã¡n vÃ  báº¥m "Kiá»ƒm tra".
3. Táº§ng á»©ng dá»¥ng Ä‘á»‘i chiáº¿u vá»›i `correct_answer` hoáº·c máº£ng cáº¥u trÃºc trong Payload:
   - Náº¿u Ä‘Ãºng: Hiá»ƒn thá»‹ tráº¡ng thÃ¡i thÃ nh cÃ´ng, phÃ¡t Ã¢m thanh chÃºc má»«ng, hiá»ƒn thá»‹ `rule_explanation`.
   - Náº¿u sai: Hiá»ƒn thá»‹ Ä‘Ã¡p Ã¡n Ä‘Ãºng, highlight pháº§n sai, hiá»ƒn thá»‹ chi tiáº¿t `rule_explanation` giáº£i thÃ­ch táº¡i sao sai.
4. Ghi nháº­n báº±ng chá»©ng cÃ¢u tráº£ lá»i liÃªn káº¿t vá»›i thá»±c thá»ƒ `Concept`.

---

### 6.2. Thuáº­t toÃ¡n LÃ m láº¡i cÃ³ Kiá»ƒm soÃ¡t (Controlled Retry - Decision D7) & HoÃ n thÃ nh BÃ i há»c

```
                             [ Káº¿t thÃºc LÆ°á»£t lÃ m Äáº§u tiÃªn (N = 5 cÃ¢u) ]
                                                 â”‚
                                                 â–¼
                                     CÃ³ cÃ¢u tráº£ lá»i sai khÃ´ng?
                                                 â”‚
                              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                            KhÃ´ng                                   CÃ³
                              â”‚                                     â”‚
                              â–¼                                     â–¼
                      HoÃ n thÃ nh 100%                   TÃ­nh toÃ¡n sá»‘ cÃ¢u Ä‘Æ°á»£c Retry:
                      á»Ÿ lÆ°á»£t Ä‘áº§u tiÃªn                 allowance = max(1, floor(N Ã— 0.10))
                                                      Vá»›i N=5: allowance = max(1, 0) = 1 cÃ¢u
                                                                    â”‚
                                                                    â–¼
                                                      NgÆ°á»i há»c lÃ m láº¡i cÃ¢u há»i sai
                                                                    â”‚
                                               â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                               â–¼                                         â–¼
                                        LÃ m láº¡i ÄÃšNG                              LÃ m láº¡i SAI
                                               â”‚                                         â”‚
                                               â–¼                                         â–¼
                                     Nháº­n chÃ­nh xÃ¡c 70%                      KhÃ´ng cÃ³ Ä‘iá»ƒm
                                    giÃ¡ trá»‹ Ä‘iá»ƒm tá»‘i Ä‘a                     Ghi nháº­n lá»—i tá»›i Concept
                                     (Credit = 70.0%)                       Táº¡o KnowledgeGap náº¿u láº·p láº¡i
                                               â”‚                                         â”‚
                                               â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                                    â”‚
                                                                    â–¼
                                                    ÄÃNH GIÃ HOÃ€N THÃ€NH BÃ€I Há»ŒC (UC-05):
                                          - ÄÃ£ xá»­ lÃ½ háº¿t lÆ°á»£t Ä‘áº§u vÃ  cÃ¢u retry báº¯t buá»™c
                                          - TUYá»†T Äá»I KHÃ”NG ÃP Dá»¤NG ÄIá»‚M SÃ€N 80%
                                          - Cáº­p nháº­t UserProgress = COMPLETED
```

---

## 7. Spaced Repetition Review (SRS) & Streak Behavior

### 7.1. Chu ká»³ Ã”n táº­p Táº¥t Ä‘á»‹nh (Deterministic Policy B - Decision D8)
Há»‡ thá»‘ng Ã¡p dá»¥ng chuá»—i khoáº£ng thá»i gian ngáº¯t quÃ£ng cá»‘ Ä‘á»‹nh:

$$I = [1, 3, 7, 14, 30] \text{ ngÃ y}$$

- **TrÆ°á»ng há»£p Tráº£ lá»i ÄÃºng**:
  $$I_{k+1} = \begin{cases} 3 & \text{náº¿u } I_k = 1 \\ 7 & \text{náº¿u } I_k = 3 \\ 14 & \text{náº¿u } I_k = 7 \\ 30 & \text{náº¿u } I_k = 14 \\ 30 & \text{náº¿u } I_k = 30 \end{cases}$$
- **TrÆ°á»ng há»£p Tráº£ lá»i Sai**:
  $$I_{\text{next}} = 1 \text{ ngÃ y (Reset vá» má»‘c ban Ä‘áº§u)}$$
- **Thá»i Ä‘iá»ƒm Ã´n táº­p káº¿ tiáº¿p**:
  $$\text{nextReviewAt} = \text{currentDate} + I_{\text{next}} \times 24 \text{ giá»}$$

Má»i thao tÃ¡c cáº­p nháº­t tráº¡ng thÃ¡i tháº» Ä‘Æ°á»£c Ä‘Ã³ng gÃ³i trong lá»i gá»i thá»§ tá»¥c logic:
$$\text{record\_review}(\text{card\_id}, \text{is\_correct}, \text{recall\_prob}, \text{interval\_days})$$
*(NON-NORMATIVE CONCEPTUAL LABEL: KÃ½ hiá»‡u hÃ m mang tÃ­nh quy Æ°á»›c logic; cÆ¡ sá»Ÿ dá»¯ liá»‡u kiá»ƒm tra cháº·t quyá»n sá»Ÿ há»¯u `auth.uid()`)*.

---

### 7.2. TÆ°Æ¡ng tÃ¡c Chuá»—i NgÃ y Há»c LiÃªn tá»¥c (Streak Processing - Decision D9)

```
                             [ NgÆ°á»i há»c hoÃ n thÃ nh Hoáº¡t Ä‘á»™ng Há»£p lá»‡ ]
                                  (HoÃ n thÃ nh bÃ i há»c HOáº¶C phiÃªn SRS)
                                                 â”‚
                                                 â–¼
                          XÃ¡c Ä‘á»‹nh ngÃ y Ä‘á»‹a phÆ°Æ¡ng hiá»‡n táº¡i theo mÃºi giá»:
                            currentDate = ToLocalDate(now(), "Asia/Ho_Chi_Minh")
                                                 â”‚
                                                 â–¼
                              So sÃ¡nh vá»›i lastQualifyingActivityDate:
                                                 â”‚
          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
          â”‚                                      â”‚                                      â”‚
currentDate = lastDate            currentDate = lastDate + 1 ngÃ y        currentDate > lastDate + 1 ngÃ y
          â”‚                                      â”‚                                      â”‚
          â–¼                                      â–¼                                      â–¼
ÄÃ£ tÃ­ch lÅ©y hÃ´m nay                  Duy trÃ¬ chuá»—i liÃªn tá»¥c                     Bá»‹ giÃ¡n Ä‘oáº¡n â‰¥ 1 ngÃ y
  Giá»¯ nguyÃªn streak                    streakCount = streakCount + 1              streakCount = 1 (RESET)
                                                 â”‚                                      â”‚
                                                 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                                     â”‚
                                                                     â–¼
                                                   Cáº­p nháº­t lastQualifyingActivityDate
```

*(Ghi chÃº ká»¹ thuáº­t: Má»i phÃ©p so sÃ¡nh ngÃ y Ä‘á»u sá»­ dá»¥ng chuáº©n mÃºi giá» IANA `Asia/Ho_Chi_Minh`. HÃ nh vi reset vá» 1 khi Ä‘á»©t chuá»—i tuÃ¢n thá»§ nghiÃªm ngáº·t Decision D9 Ä‘Ã£ Ä‘Ã³ng bÄƒng. CÃ¡c cÆ¡ cháº¿ Streak Freeze vÃ  Recovery Power-Up bá»‹ hoÃ£n DEFERRED ngoÃ i pháº¡m vi MVP).*

---

## 8. Logical Screen-Flow Inventory (Artifact #19)

Báº£n kiá»ƒm kÃª luá»“ng mÃ n hÃ¬nh á»Ÿ má»©c **thiáº¿t káº¿ logic (Logical Screen Flow)**, hoÃ n toÃ n Ä‘á»“ng nháº¥t 100% vá»›i biá»ƒu Ä‘á»“ `docs/plantuml/screen-flow-inventory-m22.puml`:

### 8.1. Chuá»—i MÃ n hÃ¬nh Há»c viÃªn (Learner Navigation Chain: SCR-L-01 .. SCR-L-14)

| MÃ£ MÃ n hÃ¬nh | TÃªn MÃ n hÃ¬nh Logic | Vai trÃ² & Tháº©m quyá»n | Use Case & Há» BF LiÃªn káº¿t | PhÃ¢n loáº¡i Pháº¡m vi | MÃ´ táº£ TrÃ¡ch nhiá»‡m Giao diá»‡n Logic |
|---|---|---|---|:---:|---|
| **SCR-L-01** | Auth & Welcome Screen | KhÃ¡ch / NgÆ°á»i há»c | `UC-01` / `BF-01` | `CORE` | ÄÄƒng nháº­p email/máº­t kháº©u, Ä‘Äƒng kÃ½ tÃ i khoáº£n má»›i, Ä‘iá»u hÆ°á»›ng khÃ´i phá»¥c máº­t kháº©u. |
| **SCR-L-02** | Onboarding & Goal Setting | `Learner` | `UC-02` / `P1-FR-014` | `CORE` | Thiáº¿t láº­p má»¥c tiÃªu há»c táº­p, cam káº¿t thá»i gian hÃ ng ngÃ y ($[5..120]$ phÃºt), mÃºi giá» `Asia/Ho_Chi_Minh`. |
| **SCR-L-03** | Assessment Pathway Choice | `Learner` | `UC-03` / `BF-08` | `CORE` | Lá»±a chá»n giá»¯a: (A) LÃ m bÃ i Ä‘Ã¡nh giÃ¡ cháº©n Ä‘oÃ¡n thÃ­ch á»©ng, hoáº·c (B) Tá»± khai bÃ¡o cáº¥p Ä‘á»™ / Bá» qua. |
| **SCR-L-04** | Diagnostic Assessment Runner | `Learner` | `UC-03` / `BF-08` | `CORE` | TrÃ¬nh lÃ m bÃ i kiá»ƒm tra thÃ­ch á»©ng 2 giai Ä‘oáº¡n (`~25â€“30 items, PROPOSED`), Ä‘Ã¡nh giÃ¡ 4 chiá»u nÄƒng lá»±c. |
| **SCR-L-05** | Placement Summary Screen | `Learner` | `UC-03` / `BF-08` | `CORE` | Hiá»ƒn thá»‹ tÃ³m táº¯t Starting Unit Ä‘á» xuáº¥t theo Mapping A; há»™p thoáº¡i xÃ¡c nháº­n lÃ  `[FUTURE UX OPTION]`. |
| **SCR-L-06** | Curriculum Dashboard & Path | `Learner` | `UC-04` / `BF-09` | `CORE` | Báº£n Ä‘á»“ toÃ n cáº£nh 6 Units / 24 Lessons; tráº¡ng thÃ¡i má»Ÿ khÃ³a; nÃºt kÃ­ch hoáº¡t bÃ i há»c vÃ  Jump. |
| **SCR-L-07** | Lesson Player & Exercise Runner | `Learner` | `UC-05` / `BF-09` | `CORE` | TrÃ¬nh cháº¡y 5 bÃ i táº­p tÆ°Æ¡ng tÃ¡c (`MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`), Ã¢m thanh & diff giáº£i thÃ­ch. |
| **SCR-L-08** | Controlled Retry Modal | `Learner` | `UC-05` / `BF-10` | `CORE` | Giao diá»‡n lÃ m láº¡i cÃ¢u sai trong háº¡n má»©c allowance ($\max(1, \lfloor N \cdot 0.1 \rfloor)$); tÃ­nh Ä‘iá»ƒm 70% credit. |
| **SCR-L-09** | Lesson Completion Summary | `Learner` | `UC-05` | `CORE` | MÃ n hÃ¬nh hoÃ n thÃ nh bÃ i há»c, cáº­p nháº­t `UserProgress = COMPLETED`; (chá»‰ sá»‘ XP lÃ  `[FUTURE GAMIFICATION]`). |
| **SCR-L-10** | SRS Review Session Player | `Learner` | `UC-06` / `BF-12` | `CORE` | TrÃ¬nh Ã´n táº­p láº·p láº¡i ngáº¯t quÃ£ng tháº» tá»« vá»±ng Ä‘áº¿n háº¡n theo chu ká»³ Policy B $[1, 3, 7, 14, 30]$ ngÃ y. |
| **SCR-L-11** | Jump Assessment Runner | `Learner` | `UC-04` / `BF-11` | `CORE` | TrÃ¬nh lÃ m bÃ i kiá»ƒm tra vÆ°á»£t cáº¥p nháº£y bÃ i (20/25-30/40 cÃ¢u, $\ge 95\%$, cooldown 24h, cá» `by_jump = true`). |
| **SCR-L-12** | Remedial Micro-Lesson Hub | `Learner` | `UC-04` / `BF-09` | `CORE` | Khu vá»±c há»c bÃ i bá»• khuyáº¿t vi mÃ´ cá»§ng cá»‘ khÃ¡i niá»‡m há»•ng vá»›i ngá»¯ cáº£nh má»›i (khÃ´ng háº¡ level, khÃ´ng há»c láº¡i bÃ i cÅ©). |
| **SCR-L-13** | Scenario Writing & GEC | `Learner` | Supporting AI / `BF-14` | `SUPPORTING` | MÃ´i trÆ°á»ng luyá»‡n viáº¿t cÃ¢u theo tÃ¬nh huá»‘ng; hiá»ƒn thá»‹ gá»£i Ã½ sá»­a lá»—i ngá»¯ phÃ¡p tá»©c thá»i tá»« model GEC. |
| **SCR-L-14** | Learner Profile & Streak View | `Learner` | `UC-07` / `BF-13` | `CORE` | Há»“ sÆ¡ cÃ¡ nhÃ¢n, biá»ƒu Ä‘á»“ máº¡ng nhá»‡n Skill Profile 4 chiá»u, chuá»—i Streak liÃªn tá»¥c, lá»‹ch sá»­ hoáº¡t Ä‘á»™ng. |

### 8.2. Chuá»—i MÃ n hÃ¬nh TÃ¡c nghiá»‡p & Quáº£n trá»‹ (Authoring & Operations Chain: SCR-A-01 .. SCR-A-11)

| MÃ£ MÃ n hÃ¬nh | TÃªn MÃ n hÃ¬nh Logic | Vai trÃ² & Tháº©m quyá»n | Use Case & Há» BF LiÃªn káº¿t | PhÃ¢n loáº¡i Pháº¡m vi | MÃ´ táº£ TrÃ¡ch nhiá»‡m Giao diá»‡n Logic |
|---|---|---|---|:---:|---|
| **SCR-A-01** | Staff Auth & Dispatch | All Staff Roles | `UC-01` / `BF-01` | `CORE` | XÃ¡c thá»±c Ä‘Äƒng nháº­p nhÃ¢n sá»± quáº£n trá»‹; phÃ¢n luá»“ng vá» Ä‘Ãºng giao diá»‡n vai trÃ² (MFA lÃ  `[FUTURE SECURITY OPTION]`). |
| **SCR-A-02** | Staff Operations Dashboard | Staff Roles | `UC-08`..`UC-14` | `CORE` | Báº£ng Ä‘iá»u khiá»ƒn tÃ¡c nghiá»‡p tá»•ng quan, hiá»ƒn thá»‹ viá»‡c cáº§n lÃ m theo tá»«ng vai trÃ² nhÃ¢n sá»±. |
| **SCR-A-03** | Curriculum & Lesson Editor | `Lesson Creator` | `UC-08` / `BF-04` | `CORE` | Soáº¡n tháº£o metadata bÃ i há»c, cáº¥u trÃºc blueprint sÆ° pháº¡m, phÃ¢n phá»‘i 5 dáº¡ng bÃ i táº­p theo assignment. |
| **SCR-A-04** | Item Bank Authoring | `Lesson Creator` | `UC-08` / `BF-04` | `CORE` | Soáº¡n chi tiáº¿t payload 5 dáº¡ng bÃ i táº­p, gáº¯n nhÃ£n `conceptId` tá»« Tá»« Ä‘iá»ƒn KhÃ¡i niá»‡m, lÆ°u nhÃ¡p vÃ  gá»­i duyá»‡t. |
| **SCR-A-05** | Content Moderation Queue | `Moderator` | `UC-09` / `BF-05, BF-06`| `CORE` | HÃ ng Ä‘á»£i kiá»ƒm duyá»‡t há»c liá»‡u `IN_REVIEW`; kiá»ƒm tra cháº¥t lÆ°á»£ng; duyá»‡t `APPROVED` hoáº·c yÃªu cáº§u sá»­a `CHANGES_REQUESTED`. |
| **SCR-A-06** | Publishing & Operations | `Org Manager`, `Admin` | `UC-10` / `BF-07` | `CORE` | PhÃ¡t hÃ nh bÃ i há»c `APPROVED â†’ PUBLISHED` (Manager chuáº©n táº¯c, Admin kháº©n cáº¥p kÃ¨m lÃ½ do), lÆ°u trá»¯ `ARCHIVED`. |
| **SCR-A-07** | Account Administration | `Administrator` | `UC-11` / Admin | `CORE` | Quáº£n lÃ½ danh má»¥c tÃ i khoáº£n ngÆ°á»i dÃ¹ng, phÃ¢n bá»• quyá»n SoD, kÃ­ch hoáº¡t / vÃ´ hiá»‡u hÃ³a tÃ i khoáº£n. |
| **SCR-A-08** | System Operations Reports | `Admin`, `Org Manager` | `UC-12` / Admin | `CORE` | Xem bÃ¡o cÃ¡o tá»•ng há»£p DAU/MAU, tiáº¿n Ä‘á»™ há»c viÃªn, tá»· lá»‡ Ä‘á»—/trÆ°á»£t Jump vÃ  hiá»‡u suáº¥t duyá»‡t bÃ i. |
| **SCR-A-09** | Security Audit Log Viewer | `Administrator` | `UC-13` / Admin | `CORE` | Tra cá»©u nháº­t kÃ½ kiá»ƒm toÃ¡n há»‡ thá»‘ng báº¥t biáº¿n (Append-only `AuditLog`), lá»c sá»± kiá»‡n kháº©n cáº¥p `isEmergency`. |
| **SCR-A-10** | Support Ticket Queue | `Operations Staff` | `UC-14` / `BF-15` | `CORE` | Tiáº¿p nháº­n pháº£n Ã¡nh sá»± cá»‘ cá»§a há»c viÃªn, phÃ¢n loáº¡i xá»­ lÃ½ hoáº·c chuyá»ƒn tiáº¿p leo thang tá»›i Moderator/Admin. |
| **SCR-A-11** | Cohort Management Portal | `Org Manager` | `UC-15` / Extension | `EXTENSION` | Quáº£n lÃ½ lá»›p há»c liÃªn káº¿t B2B vÃ  bÃ¡o cÃ¡o nhÃ³m (`OPTIONAL / FUTURE EXTENSION BOUNDARY`). |

---

## 9. Design Decision (DD) Behavioral Closure

M2.2 chÃ­nh thá»©c khÃ©p láº¡i cÃ¡c khÃ­a cáº¡nh **ngá»¯ nghÄ©a hÃ nh vi (Behavioral Semantics)** cá»§a cÃ¡c quyáº¿t Ä‘á»‹nh thiáº¿t káº¿ má»Ÿ, trong khi tiáº¿p tá»¥c giá»¯ nguyÃªn tÃ­nh linh hoáº¡t cho viá»‡c biá»ƒu diá»…n váº­t lÃ½ (Physical Modeling) á»Ÿ cÃ¡c má»‘c sau:

| MÃ£ Quyáº¿t Ä‘á»‹nh | KhÃ­a cáº¡nh Ngá»¯ nghÄ©a HÃ nh vi Ä‘Ã£ ÄÃ³ng (M2.2 Closes) | KhÃ­a cáº¡nh Biá»ƒu diá»…n Váº­t lÃ½ chÆ°a ÄÃ³ng (M2.3+ / M2.6) |
|---|---|---|
| **DD-01 Unit** | HÃ nh vi phÃ¢n cáº¥p cháº·t cháº½: `Course â†’ Unit â†’ Lesson â†’ Exercise`. Äiá»u hÆ°á»›ng tuyáº¿n tÃ­nh vÃ  kiá»ƒm tra Jump thá»±c hiá»‡n theo Ä‘Æ¡n vá»‹ Unit. Quy táº¯c hiá»ƒn thá»‹ Unit Ä‘Ã²i há»i 4/4 bÃ i con `PUBLISHED`. | Cáº¥u trÃºc quan há»‡ báº£ng váº­t lÃ½ `Unit` vÃ  ká»‹ch báº£n di trÃº dá»¯ liá»‡u (`schema.prisma` mapping). |
| **DD-02 Revision** | HÃ nh vi Clone-to-Draft v2: Khi sá»­a bÃ i Ä‘Ã£ phÃ¡t hÃ nh, táº¡o báº£n sao má»›i á»Ÿ tráº¡ng thÃ¡i `DRAFT`; bÃ i cÅ© tiáº¿p tá»¥c phá»¥c vá»¥ bÃ¬nh thÆ°á»ng cho Ä‘áº¿n khi bÃ i má»›i Ä‘Æ°á»£c xuáº¥t báº£n. | LÆ°u váº¿t qua trÆ°á»ng `supersedesId` hay tÃ¡ch báº£ng lá»‹ch sá»­ phiÃªn báº£n riÃªng (`lesson_revisions`). |
| **DD-04 Assignment** | HÃ nh vi phÃ¢n cÃ´ng SoD: Manager láº­p káº¿ hoáº¡ch vÃ  gÃ¡n bÃ i cho Creator; Creator chá»‰ Ä‘Æ°á»£c soáº¡n bÃ i Ä‘Æ°á»£c gÃ¡n; cáº¥m Creator tá»± phÃª duyá»‡t hay tá»± Ã½ xuáº¥t báº£n chÃ©o. | TÃªn trÆ°á»ng lÆ°u trá»¯ váº­t lÃ½ (`creatorId`, `assignmentBrief`, `assignedTo`). |
| **DD-05 Assessment Context** | TÃ¡ch báº¡ch hoÃ n toÃ n hai trá»¥c: Má»¥c Ä‘Ã­ch (`assessmentType`: DIAGNOSTIC, EXIT, RE_EVALUATION) vs HÃ¬nh thá»©c (`deliveryMode`: PLACEMENT, JUMP, STANDARD). BÃ i kiá»ƒm tra lÃ  má»™t ngá»¯ cáº£nh cá»§a Exercise; (no AssessmentSession entity exists); khÃ´ng tá»“n táº¡i entity ma (`Exam`, `QuestionBank`, `AssessmentSession`). | Biá»ƒu diá»…n cá» váº­t lÃ½ `isAssessmentMode` hay lÆ°u trá»¯ trÆ°á»ng phÃ¢n loáº¡i `lesson_type`. |
| **DD-06 Placement** | HÃ nh vi xáº¿p lá»›p theo Mapping A (English A1): Äiá»ƒm sá»‘ chá»‘t ra Starting Unit duy nháº¥t; Skip gÃ¡n U1 khÃ´ng Ä‘iá»ƒm; Retake táº¡o báº£n ghi káº¿t quáº£ má»›i; báº±ng chá»©ng káº¿t quáº£ lÃ  báº¥t biáº¿n. | TÃ¹y chá»n lÆ°u trá»¯ `placement_history JSONB` trÃªn `LearnerProfile` hay truy váº¥n Ä‘á»™ng tá»« `AssessmentResult`. |

*(LÆ°u Ã½: CÃ¡c quyáº¿t Ä‘á»‹nh DD-03 vá» AuditLog RLS vÃ  DD-10 vá» Storage RLS thuá»™c pháº¡m vi Má»‘c M2.4 Kiáº¿n trÃºc & An ninh, khÃ´ng xá»­ lÃ½ táº¡i M2.2).*

---

## 10. Traceability Matrix (Requirements $\rightarrow$ M2.2 Behavior)

Báº£ng truy váº¿t ná»‘i liá»n tá»« YÃªu cáº§u nghiá»‡p vá»¥ Ä‘áº¿n Lá»›p HÃ nh vi M2.2 tuÃ¢n thá»§ nghiÃªm ngáº·t mÃ£ há» hÃ nh vi chuáº©n táº¯c tá»« `docs/06-system-analysis.md`:

| MÃ£ YÃªu cáº§u | MVP ID | MÃ£ Chuáº©n táº¯c | Use Case | Há» HÃ nh vi BF | MÃ´ hÃ¬nh / MÃ¡y Tráº¡ng thÃ¡i M2.2 | Ranh giá»›i Pháº¡m vi |
|---|---|---|---|---|---|:---:|
| `YC-CORE-01` | `MVP-01` | `P1-FR-001`, `P1-FR-010` | `UC-01` | `BF-01` | Session Lifecycle, Cookie httpOnly Auth | `CORE` |
| `YC-CORE-02` | `MVP-02` | `P1-FR-014`, `P1-FR-015` | `UC-02` | â€” | Daily Goal Min $[5..120]$, In-app Reminder Setup | `CORE` |
| `YC-CORE-03` | `MVP-04` | `P1-FR-002` | `UC-04` | `BF-09` | Curriculum Navigation (Courseâ†’Unitâ†’Lesson) | `CORE` |
| `YC-CORE-04` | `MVP-12` | `P1-FR-008` | `UC-08` | `BF-03`, `BF-04` | Content Lifecycle (`DRAFT â†’ IN_REVIEW`) | `CORE` |
| `YC-CORE-05` | `MVP-13` | `P1-FR-008` | `UC-09` | `BF-05` | Moderation (`IN_REVIEW â†’ APPROVED / CHANGES_REQUESTED`) | `CORE` |
| `YC-CORE-06` | `MVP-13` | `P1-FR-008` | `UC-10` | `BF-07` | Publishing (`APPROVED â†’ PUBLISHED`), Admin Emergency | `CORE` |
| `YC-CORE-07` | `MVP-05..07`| `P1-FR-003,012,013` | `UC-05` | `BF-09`, `BF-10` | 5 Exercise Payloads, Controlled Retry D7 | `CORE` |
| `YC-CORE-08` | `MVP-09` | `P1-FR-005,006` | `UC-06` | `BF-12` | SRS Policy B $[1,3,7,14,30]$, RPC `record_review` | `CORE` |
| `YC-CORE-09` | `MVP-03` | `P1-FR-016` | `UC-03` | `BF-08` | Placement Mapping A (Score Range 0â€“30) | `CORE` |
| `YC-CORE-09` | `MVP-03` | `P1-FR-016` | `UC-04` | `BF-11` | Conditional Jump Assessment $\ge 95\%$ | `CORE` |
| `YC-CORE-10` | `MVP-10` | `P1-FR-011` | `UC-07` | `BF-13` | Streak Tracking, Qualifying Activity, Reset to 1 | `CORE` |
| `YC-CORE-11` | `MVP-08,11` | `P1-FR-004`, `P1-FR-016` (Skill Profile ref) | `UC-07` | `BF-13` | 4-Concept Separation, Skill Profile Dashboard | `CORE` |
| `YC-CORE-12` | `MVP-14,19`| `P1-FR-008,NFR-001`| `UC-11..13`| `BF-01` / Admin | Account/Role Admin, Reports, Immutable AuditLog | `CORE` |
| `YC-EXT-01` | `MVP-18` | `P1-FR-007` | â€” | `BF-14` | Transient Scenario Writing & GEC `/v1/gec/correct` | `SUPPORTING` |
| `YC-EXT-04` | `MVP-16` | Operational | `UC-14` | `BF-15` | Support Ticket Handling (`OPEN â†’ IN_PROGRESS â†’ RESOLVED`) | `CORE` |
| `YC-EXT-08` | `MVP-17` | Organizational | `UC-15` | â€” | Cohort Management & Group Analytics | `EXTENSION` |

---

## 11. Verification & Validation Evidence (D-G4 & D-G7)

### 11.1. Cá»•ng Kiá»ƒm tra D-G4: Use Case, Activity & Behavior Completeness

- **Äáº§u vÃ o kiá»ƒm tra:** Danh má»¥c 15 Use Cases, Danh má»¥c 15 Há» hÃ nh vi BF, Ma tráº­n phÃ¢n quyá»n SoD, Artifacts #9, #10, #19.
- **PhÆ°Æ¡ng phÃ¡p kiá»ƒm tra:** Äá»‘i soÃ¡t chÃ©o tá»«ng Use Case, tá»«ng Activity Family, tháº©m quyá»n tÃ¡c nhÃ¢n, cÃ¡c nhÃ¡nh ráº½ vÃ  ngoáº¡i lá»‡, khÃ´ng cÃ³ Use Case má»“ cÃ´i hay tÃ¡c nhÃ¢n sai lá»‡ch.
- **TiÃªu chÃ­ Äáº¡t chuáº©n (PASS Conditions):**
  1. Bao phá»§ Ä‘áº§y Ä‘á»§ 15 Use Cases chuáº©n táº¯c (`UC-01`..`UC-15`), khÃ´ng cÃ³ `UC-16/17/18`.
  2. Bao phá»§ Ä‘áº§y Ä‘á»§ 15 há» hÃ nh vi (`BF-01`..`BF-15`), khÃ´ng cÃ³ `BF-16`.
  3. Tháº©m quyá»n tÃ¡c nhÃ¢n tuÃ¢n thá»§ SoD: `Organizational Manager` xuáº¥t báº£n (`UC-10`), Moderator dá»«ng á»Ÿ `APPROVED` (`UC-09`), Admin chá»‰ xuáº¥t báº£n kháº©n cáº¥p bÃ i `APPROVED`.
  4. PhÃ¢n Ä‘á»‹nh rÃµ rÃ ng `UC-15` lÃ  `OPTIONAL / FUTURE EXTENSION BOUNDARY`.
  5. Tuyá»‡t Ä‘á»‘i (no AssessmentSession entity exists); khÃ´ng tá»“n táº¡i entity ma (`Exam`, `QuestionBank`, `AssessmentSession`).
- **Káº¿t luáº­n Cá»•ng D-G4:** **`PASS`** (Báº±ng chá»©ng Ä‘Æ°á»£c xÃ¡c láº­p Ä‘áº§y Ä‘á»§ táº¡i Má»¥c 2, 3 vÃ  10 cá»§a tÃ i liá»‡u nÃ y).

---

### 11.2. Cá»•ng Kiá»ƒm tra D-G7: Educational Policy & Business Rule Verification

- **Äáº§u vÃ o kiá»ƒm tra:** Äá» cÆ°Æ¡ng English A1 (`08`), Äáº·c táº£ Placement & Jump (`09`), CÃ¡c quyáº¿t Ä‘á»‹nh sáº£n pháº©m D1â€“D9, Artifacts #3, #10, #17, #18.
- **PhÆ°Æ¡ng phÃ¡p kiá»ƒm tra:** QuÃ©t Ä‘á»‘i chiáº¿u tá»«ng giÃ¡ trá»‹ sá»‘ há»c vÃ  quy táº¯c nghiá»‡p vá»¥ Ä‘Ã£ Ä‘Ã³ng bÄƒng xem cÃ³ xuáº¥t hiá»‡n chÃ­nh xÃ¡c 100% khÃ´ng.
- **Báº£ng Äá»‘i soÃ¡t GiÃ¡ trá»‹ Sá»‘ há»c Chuáº©n táº¯c:**

| Quy táº¯c Nghiá»‡p vá»¥ / Tham sá»‘ | GiÃ¡ trá»‹ ÄÃ³ng bÄƒng Báº¯t buá»™c | GiÃ¡ trá»‹ Ghi nháº­n trong M2.2 | Káº¿t luáº­n Äá»‘i soÃ¡t |
|---|:---:|:---:|:---:|
| **Placement Bands (0â€“7)** | Má»Ÿ khÃ³a **Unit 1** | Unit 1 (Â§5.2) | **PASS** |
| **Placement Bands (8â€“12)** | Má»Ÿ khÃ³a **Unit 2** | Unit 2 (Â§5.2) | **PASS** |
| **Placement Bands (13â€“17)** | Má»Ÿ khÃ³a **Unit 3** | Unit 3 (Â§5.2) | **PASS** |
| **Placement Bands (18â€“22)** | Má»Ÿ khÃ³a **Unit 4** | Unit 4 (Â§5.2) | **PASS** |
| **Placement Bands (23â€“26)** | Má»Ÿ khÃ³a **Unit 5** | Unit 5 (Â§5.2) | **PASS** |
| **Placement Bands (27â€“30)** | Má»Ÿ khÃ³a **Unit 6** | Unit 6 (Â§5.2) | **PASS** |
| **Placement Skip** | GÃ¡n **Unit 1 táº¡m thá»i, 0 Ä‘iá»ƒm, 0 AssessmentResult** | Unit 1, no result (Â§4.5, Â§5.2) | **PASS** |
| **Jump Quy mÃ´ 1 Unit** | **20 cÃ¢u há»i** | 20 cÃ¢u há»i (Â§5.3) | **PASS** |
| **Jump Quy mÃ´ 2â€“3 Units** | **25 â€“ 30 cÃ¢u há»i** | 25 â€“ 30 cÃ¢u há»i (Â§5.3) | **PASS** |
| **Jump Quy mÃ´ $>3$ Units** | **40 cÃ¢u há»i** | 40 cÃ¢u há»i (Â§5.3) | **PASS** |
| **Jump NgÆ°á»¡ng Ä‘áº¡t** | $\mathbf{\ge 95.0\%}$ | $\ge 95.0\%$ (Â§5.3) | **PASS** |
| **Jump Cooldown** | ÄÃºng **24 giá»** | ÄÃºng 24 giá» (Â§5.3) | **PASS** |
| **Jump Xuáº¥t xá»©** | `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` | `by_jump = true` (Â§5.3) | **PASS** |
| **Cáº¥m nhÃ£n Jump** | **Tuyá»‡t Ä‘á»‘i cáº¥m COMPLETED_BY_JUMP** | Cáº¥m COMPLETED_BY_JUMP (Â§5.3) | **PASS** |
| **Controlled Retry Allowance** | $\mathbf{\max(1, \lfloor N \cdot 0.10 \rfloor)}$ | $\max(1, \lfloor N \cdot 0.10 \rfloor)$ (Â§6.2) | **PASS** |
| **Controlled Retry Credit** | ÄÃºng $\mathbf{70.0\%}$ | ÄÃºng 70.0% (Â§6.2) | **PASS** |
| **HoÃ n thÃ nh bÃ i há»c** | **Xá»­ lÃ½ háº¿t cÃ¢u há»i, KHÃ”NG sÃ n 80%** | Xá»­ lÃ½ háº¿t, khÃ´ng sÃ n 80% (Â§6.2) | **PASS** |
| **SRS Chu ká»³ Policy B** | $[\mathbf{1, 3, 7, 14, 30}]$ ngÃ y | $[1, 3, 7, 14, 30]$ ngÃ y (Â§7.1) | **PASS** |
| **Streak Reset khi giÃ¡n Ä‘oáº¡n** | **Reset vá» 1** | Reset vá» 1 (Â§7.2) | **PASS** |
| **Streak MÃºi giá»** | $\mathbf{Asia/Ho\_Chi\_Minh}$ | `Asia/Ho_Chi_Minh` (Â§7.2) | **PASS** |
| **TÃ¡ch biá»‡t Nháº­p mÃ´n** | $\mathbf{Self-reported \ne Verified}$ | TÃ¡ch 2 nhÃ¡nh tuyá»‡t Ä‘á»‘i (Â§4.5) | **PASS** |
| **Chá»©ng chá»‰ CEFR** | **KHÃ”NG cáº¥p chá»©ng chá»‰, KHÃ”NG universal** | KhÃ´ng cáº¥p chá»©ng chá»‰ (Â§5.2) | **PASS** |

- **Káº¿t luáº­n Cá»•ng D-G7:** **`PASS`** (100% cÃ¡c giÃ¡ trá»‹ tham sá»‘ Ä‘Ã³ng bÄƒng khá»›p tuyá»‡t Ä‘á»‘i vá»›i baseline).

---

## 12. Open Decisions Register (D3 Â§N / D4 Â§Q Preserved)

Táº¥t cáº£ 13 nhÃ³m quyáº¿t Ä‘á»‹nh má»Ÿ káº¿ thá»«a tá»« D3 Â§N vÃ  D4 Â§Q tiáº¿p tá»¥c Ä‘Æ°á»£c giá»¯ nguyÃªn tráº¡ng thÃ¡i `OPEN / CONFIGURABLE / PENDING VALIDATION`. M2.2 khÃ´ng tá»± Ã½ chá»‘t sá»‘ hay hardcode vÃ o cÃ¡c luá»“ng hoáº¡t Ä‘á»™ng:

1. **Diagnostic Item Count & Skill Distribution:** Quy mÃ´ cÃ¢u há»i (`~25â€“30 items, PROPOSED / PENDING VALIDATION`) vÃ  tá»· lá»‡ phÃ¢n bá»• giá»¯a 4 ká»¹ nÄƒng giá»¯ `PROPOSED / PENDING VALIDATION`.
2. **Scoring Function & Weights:** CÃ´ng thá»©c cháº¥m Ä‘iá»ƒm thÃ nh pháº§n vÃ  trá»ng sá»‘ cÃ¢u há»i giá»¯ `OPEN / CONFIGURABLE`.
3. **Adaptive Branching Thresholds:** NgÆ°á»¡ng ráº½ nhÃ¡nh tá»« Routing Stage sang Targeted Stage giá»¯ `PROPOSED / PENDING VALIDATION`.
4. **Stopping Rules:** NgÆ°á»¡ng khoáº£ng tin cáº­y dá»«ng sá»›m bÃ i cháº©n Ä‘oÃ¡n giá»¯ `PROPOSED / PENDING VALIDATION`.
5. **Mastery Thresholds:** Sá»‘ cÃ¢u Ä‘Ãºng/sai Ä‘á»ƒ chuyá»ƒn `NOVICE â†’ DEVELOPING â†’ MASTERED` giá»¯ `CONFIGURABLE`.
6. **Readiness Gate Cutoffs:** NgÆ°á»¡ng Ä‘Ã¡nh giÃ¡ `ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE` giá»¯ `CONFIGURABLE`.
7. **Remediation Trigger Thresholds:** Sá»‘ lá»—i sai liÃªn tiáº¿p Ä‘á»ƒ táº¡o `KnowledgeGap` giá»¯ `CONFIGURABLE`.
8. **Anchor Level Aggregation Formula:** CÃ´ng thá»©c gá»™p 4 chiá»u SkillProfile thÃ nh 1 báº­c Anchor duy nháº¥t giá»¯ `PENDING VALIDATION`.
9. **CEFR Mapping Beyond English A1:** Ãnh xáº¡ chÆ°Æ¡ng trÃ¬nh ngoÃ i English A1 Mapping A giá»¯ `OPEN / PENDING`.
10. **HSK Framework Version:** TÃ¹y chá»n chuyá»ƒn Ä‘á»•i HSK 2.0 vs 3.0 giá»¯ `OPEN / CONFIGURABLE`.
11. **KnowledgeGap Archival Policy:** ChÃ­nh sÃ¡ch lÆ°u trá»¯/Ä‘Ã³ng vÄ©nh viá»…n cÃ¡c lá»— há»•ng kiáº¿n thá»©c cÅ© giá»¯ `OPEN / PENDING`.
12. **Recommendation Policy & Versioning:** Quy táº¯c tÃ­nh toÃ¡n phiÃªn báº£n vÃ  cáº­p nháº­t gá»£i Ã½ há»c táº­p giá»¯ `OPEN / PENDING`.
13. **Reading Physical Database Representation:** Dáº¡ng bÃ i Äá»c hiá»ƒu dáº¡ng phá»©c há»£p giá»¯ `PROPOSED / DESIGN GAP`.

---

## 13. Design Risks & Mitigations

1. **R-M22-01: Nguy cÆ¡ TrÃ´i ngÆ°á»¡ng (Threshold Drift):**
   - *Rá»§i ro:* TÃ i liá»‡u hÃ nh vi vÃ´ tÃ¬nh chá»‘t cá»©ng má»™t con sá»‘ chÆ°a Ä‘Æ°á»£c phÃª duyá»‡t thÃ nh quy táº¯c nghiá»‡p vá»¥.
   - *Giáº£m thiá»ƒu:* Gáº¯n nhÃ£n tÆ°á»ng minh `CONFIGURABLE / PENDING VALIDATION` cho má»i ngÆ°á»¡ng quyáº¿t Ä‘á»‹nh thÃ­ch á»©ng vÃ  mastery; Cá»•ng D-G7 kiá»ƒm soÃ¡t danh má»¥c literal values.
2. **R-M22-02: Nguy cÆ¡ Gá»™p Ä‘iá»ƒm pháº³ng (Flat-score Temptation):**
   - *Rá»§i ro:* TÃ­nh Ä‘iá»ƒm trung bÃ¬nh cá»™ng 4 chiá»u ká»¹ nÄƒng lÃ m máº¥t Ä‘i tÃ­nh Ä‘a chiá»u cá»§a Skill Profile.
   - *Giáº£m thiá»ƒu:* Báº¯t buá»™c thá»ƒ hiá»‡n 4 ká»¹ nÄƒng Ä‘á»™c láº­p trong má»i luá»“ng dá»¯ liá»‡u Ä‘Ã¡nh giÃ¡ vÃ  dashboard theo Báº¥t biáº¿n I2.
3. **R-M22-03: Nguy cÆ¡ TÃ¡i xuáº¥t hiá»‡n Thá»±c thá»ƒ Ma (Ghost Entities):**
   - *Rá»§i ro:* TÃ¡i Ä‘Æ°a `Exam`, `QuestionBank`, hoáº·c `AssessmentSession` (khÃ´ng pháº£i persisted entity) vÃ o cÃ¡c biá»ƒu Ä‘á»“ Use Case hoáº·c Activity.
   - *Giáº£m thiá»ƒu:* Kiá»ƒm tra phá»§ Ä‘á»‹nh tá»± Ä‘á»™ng; kháº³ng Ä‘á»‹nh khÃ´ng tá»“n táº¡i entity `AssessmentSession` hay `Exam`/`QuestionBank`.
4. **R-M22-04: Nguy cÆ¡ Nháº§m láº«n Tháº©m quyá»n Xuáº¥t báº£n (UC-10 SoD Conflict):**
   - *Rá»§i ro:* Nháº§m láº«n vai trÃ² Moderator lÃ  ngÆ°á»i xuáº¥t báº£n nhÆ° báº£ng cÅ© trong má»™t sá»‘ bÃ¡o cÃ¡o lá»‹ch sá»­.
   - *Giáº£m thiá»ƒu:* Kháº³ng Ä‘á»‹nh Ä‘á»™c quyá»n xuáº¥t báº£n thuá»™c vá» `Organizational Manager`; Moderator dá»«ng láº¡i á»Ÿ `APPROVED`; Administrator xuáº¥t báº£n kháº©n cáº¥p chá»‰ khi bÃ i Ä‘Ã£ `APPROVED`.

---

## 14. Explicit Out-of-Scope Confirmations

Äá»ƒ báº£o vá»‡ ranh giá»›i phÃ¡t triá»ƒn vÃ  chá»‘ng phÃ¬nh pháº¡m vi (Scope Creep):
- **KHÃ”NG MÃ£ nguá»“n Runtime:** 0 dÃ²ng code TypeScript, Python, hoáº·c SQL Ä‘Æ°á»£c táº¡o má»›i hay sá»­a Ä‘á»•i.
- **KHÃ”NG Di trÃº CÆ¡ sá»Ÿ dá»¯ liá»‡u:** KhÃ´ng táº¡o hay thá»±c thi báº¥t ká»³ Prisma migration nÃ o.
- **KHÃ”NG Thiáº¿t káº¿ UI/CSS:** KhÃ´ng cÃ³ mÃ£ giao diá»‡n, CSS, hay thiáº¿t káº¿ pixel Ä‘Æ°á»£c sinh ra.
- **KHÃ”NG Thá»±c thi Thuáº­t toÃ¡n:** CÃ¡c cÃ´ng thá»©c cháº¥m Ä‘iá»ƒm, xáº¿p háº¡ng gá»£i Ã½ tiáº¿p tá»¥c giá»¯ tráº¡ng thÃ¡i má»Ÿ cho giai Ä‘oáº¡n sau.
- **KHÃ”NG Tá»± cháº¿ UC/BF:** KhÃ´ng sinh mÃ£ `UC-16..18`, khÃ´ng sinh `BF-16`.

---

## 15. Negative Checks Verification Report

Káº¿t quáº£ quÃ©t tá»± Ä‘á»™ng cÃ¡c tá»« khÃ³a vÃ  khÃ¡i niá»‡m bá»‹ cáº¥m trÃªn toÃ n bá»™ tÃ i liá»‡u M2.2:

| KhÃ¡i niá»‡m Bá»‹ cáº¥m / Nháº¡y cáº£m | Sá»‘ lÆ°á»£ng Xuáº¥t hiá»‡n Vi pháº¡m | Tráº¡ng thÃ¡i Kiá»ƒm tra |
|---|:---:|:---:|
| `UC-16`, `UC-17`, `UC-18` | **0** | **PASS** |
| `BF-16` | **0** | **PASS** |
| `UC-06-viáº¿t` | **0** | **PASS** |
| `COMPLETED_BY_JUMP` | **0** (Chá»‰ xuáº¥t hiá»‡n trong cÃ¢u lá»‡nh cáº¥m) | **PASS** |
| `Exam`, `QuestionBank` | **0** (Chá»‰ xuáº¥t hiá»‡n trong cÃ¢u lá»‡nh cáº¥m) | **PASS** |
| `AssessmentSession` | **0** (khÃ´ng tá»“n táº¡i entity, chá»‰ xuáº¥t hiá»‡n trong cÃ¢u lá»‡nh phá»§ Ä‘á»‹nh) | **PASS** |
| `Self-reported â†’ AssessmentResult` | **0** (TÃ¡ch biá»‡t hoÃ n toÃ n) | **PASS** |
| Äiá»ƒm sÃ n hoÃ n thÃ nh bÃ i há»c 80% | **0** (ÄÃ£ bÃ£i bá» theo D7) | **PASS** |
| Reset streak vá» 0 | **0** (Chuáº©n hÃ³a reset vá» 1 theo D9) | **PASS** |
| Tá»± Ä‘á»™ng nÃ¢ng cáº¥p Ä‘á»™ sau bÃ i há»c | **0** (Cáº¥m automatic advance) | **PASS** |
| Háº¡ toÃ n bá»™ cáº¥p Ä‘á»™ (Whole-level downgrade) | **0** (Cáº¥m háº¡ level) | **PASS** |
| Báº¯t há»c láº¡i bÃ i cÅ© (Forced replay) | **0** (Remediation dÃ¹ng bÃ i má»›i) | **PASS** |
| Cáº¥p chá»©ng chá»‰ nÄƒng lá»±c CEFR | **0** (Chá»‰ Ä‘á»‹nh vá»‹ trÃ­ trÃªn Ä‘á» cÆ°Æ¡ng) | **PASS** |
| `REJECTED` nhÆ° má»™t tráº¡ng thÃ¡i chuáº©n táº¯c | **0** (Thay báº±ng `CHANGES_REQUESTED`) | **PASS** |
| `Content Manager` nhÆ° má»™t vai trÃ² con ngÆ°á»i | **0** (Thay báº±ng `Organizational Manager`) | **PASS** |
| `NOT_READY`, `EVALUATING` nhÆ° tráº¡ng thÃ¡i Readiness | **0** (Chá»‰ 3 tráº¡ng thÃ¡i `ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`) | **PASS** |
| `DETECTED` nhÆ° tráº¡ng thÃ¡i KnowledgeGap | **0** (Thay báº±ng `OPEN`) | **PASS** |
| `INTRODUCED`, `PRACTICING` nhÆ° tráº¡ng thÃ¡i ConceptMastery | **0** (Thay báº±ng `NOVICE`, `DEVELOPING`) | **PASS** |
| `longest_streak` hoáº¡t Ä‘á»™ng | **0** (ÄÃ£ loáº¡i bá» khá»i luá»“ng tÃ­nh toÃ¡n) | **PASS** |
| Hoáº¡t Ä‘á»™ng `Streak Freeze` / `Power-Up` | **0** (ÄÃ£ loáº¡i bá» khá»i luá»“ng tÃ­nh toÃ¡n, Ä‘Ã¡nh dáº¥u DEFERRED) | **PASS** |

---

## 16. Final Status & Sign-off

```text
STATUS: READY FOR INDEPENDENT RE-REVIEW
DESIGN COMPLETE: NOT CLAIMED
ACCEPTED: NOT CLAIMED
COMPLETION DATE: 2026-09-26
```

TÃ i liá»‡u nÃ y cung cáº¥p Ä‘áº§y Ä‘á»§ Ä‘áº·c táº£ hÃ nh vi há»‡ thá»‘ng Ä‘Ã£ Ä‘Æ°á»£c kháº¯c phá»¥c toÃ n diá»‡n theo káº¿t luáº­n Ä‘Ã¡nh giÃ¡ Ä‘á»™c láº­p cho Má»‘c M2.2 cá»§a dá»± Ã¡n Lingora, sáºµn sÃ ng cho cÃ´ng tÃ¡c tÃ¡i kiá»ƒm Ä‘á»‹nh Ä‘á»™c láº­p (Independent Re-Review).




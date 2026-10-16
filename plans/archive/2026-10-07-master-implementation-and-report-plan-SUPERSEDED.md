# [SUPERSEDED] MASTER IMPLEMENTATION, TEST, DEMO & REPORT PLAN (PHASE 2)

> **STATUS: SUPERSEDED / HISTORICAL PLANNING DRAFT — NOT EXECUTABLE.**
> **Classification:** `HISTORICAL / SUPERSEDED`. This document is an unapproved, superseded Phase 2 implementation roadmap draft from 2026-10-07.
> - **DO NOT EXECUTE:** It does not authorize any implementation, testing, or database migration.
> - **Superseded roles & policies:** Its 6-role model was superseded by ADR-034 (3 business roles: `Admin`, `Teacher`, `Learner`); its placement, progression, lesson retry/scoring, Jump, and reassessment assumptions were superseded by ADR-030 through ADR-036.
> - **Current authority:** Current redesign progress is at Class Diagram (IN PROGRESS). Active task authority lives solely in `plans/current-task.md`.
> - **Retained historical record:** Prior contents and evolution are preserved for auditability only. Retained references require reconciliation with current UC/Activity and scoped ADRs. See [current task](../current-task.md) and [repository audit](../../docs/repository-audit-2026-10-16.md).

> **MÃ£ tÃ i liá»‡u:** `plans/master-implementation-and-report-plan.md`  
> **Giai Ä‘oáº¡n:** Phase 2 â€” System Implementation, Verification, Demonstration & Academic Reporting  
> **Tráº¡ng thÃ¡i:** `READY FOR HUMAN REVIEW` (Draft completed post M2.6 Acceptance; Implementation NOT STARTED)  
> **CÄƒn cá»© gá»‘c:**  
> - `HANDOFF.md` (M2.6 Accepted, Checkpoint `4c8a7dbd48c8c1a90c8a3e194b267916700bad2b`)  
> - `docs/phase-1-m2-6-design-handoff.md` (Design-to-Implementation Handoff Specification)  
> - `docs/phase-1-m2-5-design-validation.md` (Artifact #20 Design Validation Report)  
> - `docs/phase-1-m2-4-architecture-security.md` (19 Components, 5 Zones, 6 Boundaries, 11 Audit Events)  
> - `docs/phase-1-m2-3-sequence-api-service-boundary.md` (Sequences SEQ-01..10, API Surfaces)  
> - `docs/phase-1-m2-2-behavior-uc-activity-state.md` (15 UCs, 15 BFs, D1â€“D9 Rules, State Machines)  
> - `docs/phase-1-m2-1-domain-and-logical-data-foundation.md` (Artifacts #1..#5)  
> - `docs/03-api-contract.md` (Read-only Canonical AI Service Contract)  
> - `ADR-014` & `ADR-029` (SE Core + AI Supporting Capability; M2.6 Formal Acceptance)  
> **Ranh giá»›i nghiÃªm ngáº·t:**  
> 1. **Káº¾ HOáº CH DUY NHáº¤T (SINGLE MASTER PLAN):** TÃ i liá»‡u nÃ y lÃ  káº¿ hoáº¡ch tá»•ng thá»ƒ chá»‰ Ä‘áº¡o toÃ n bá»™ quÃ¡ trÃ¬nh láº­p trÃ¬nh (Implementation), kiá»ƒm thá»­ (Testing), chuáº©n bá»‹ dá»¯ liá»‡u & ká»‹ch báº£n trÃ¬nh diá»…n (Demo), vÃ  thu tháº­p báº±ng chá»©ng bÃ¡o cÃ¡o há»c thuáº­t (Report Evidence) cho Giai Ä‘oáº¡n 2.  
> 2. **PHáº M VI Äá»’ ÃN VÃ€ QUY CÃCH PHI-AI (PHASE 2 SCOPE NOTE):** Lingora lÃ  Ä‘á»“ Ã¡n phÃ¡t triá»ƒn ná»n táº£ng há»c ngoáº¡i ngá»¯ trá»±c tuyáº¿n theo chuáº©n ká»¹ nghá»‡ pháº§n má»m, khÃ´ng pháº£i Ä‘á»“ Ã¡n AI. Phase 2 chá»‰ táº­p trung triá»ƒn khai cÃ¡c chá»©c nÄƒng nghiá»‡p vá»¥ cá»‘t lÃµi vÃ  thuáº­t toÃ¡n táº¥t Ä‘á»‹nh (Placement/Mapping A, Learning Progress, Controlled Retry, Spaced Repetition SRS, Conditional Jump, Streak, Content Governance, RBAC/RLS/SoD, Lesson/Exercise Player). AI/ML/GEC khÃ´ng thuá»™c pháº¡m vi implementation, testing, demo hoáº·c acceptance cá»§a Phase 2. CÃ¡c tÃ i liá»‡u M2 cÃ³ Ä‘á» cáº­p AI Ä‘Æ°á»£c giá»¯ lÃ m historical/supporting architecture reference vÃ  khÃ´ng Ä‘Æ°á»£c hiá»ƒu lÃ  workstream cáº§n triá»ƒn khai.
> 3. **ZERO IMPLEMENTATION IN THIS TASK:** Tuyá»‡t Ä‘á»‘i KHÃ”NG viáº¿t mÃ£ nguá»“n á»©ng dá»¥ng, KHÃ”NG cháº¡y migration, KHÃ”NG thay Ä‘á»•i schema thá»±c táº¿, KHÃ”NG triá»ƒn khai RLS, KHÃ”NG sá»­a há»£p Ä‘á»“ng `docs/03-api-contract.md`, KHÃ”NG táº¡o commit code trong task nÃ y.
> 4. **PHÃ‚N Äá»ŠNH TRáº NG THÃI CHUáº¨N Táº®C:** PhÃ¢n biá»‡t tuyá»‡t Ä‘á»‘i giá»¯a `CURRENT` (há»‡ thá»‘ng/code/db Ä‘ang tá»“n táº¡i thá»±c táº¿), `TARGET` (thiáº¿t káº¿ Ä‘Ã£ chá»‘t táº¡i M2.2â€“M2.6), `FUTURE` (má»Ÿ rá»™ng chÆ°a thuá»™c MVP), vÃ  `PROPOSED` (má»¥c tiÃªu cáº§n triá»ƒn khai trong Phase 2). Tuyá»‡t Ä‘á»‘i khÃ´ng mÃ´ táº£ target design nhÆ° há»‡ thá»‘ng Ä‘Ã£ cháº¡y trÃªn production.

---

## Má»¤C Lá»¤C Tá»”NG THá»‚

1. [AUDIT HIá»†N TRáº NG KHO LÆ¯U TRá»® (CURRENT VS TARGET VS GAP)](#1-audit-hiá»‡n-tráº¡ng-kho-lÆ°u-trá»¯-current-vs-target-vs-gap)
2. [CÄ‚N Cá»¨ THIáº¾T Káº¾ CHUáº¨N Táº®C & NGUYÃŠN Táº®C GIáº¢I QUYáº¾T XUNG Äá»˜T](#2-cÄƒn-cá»©-thiáº¿t-káº¿-chuáº©n-táº¯c--nguyÃªn-táº¯c-giáº£i-quyáº¿t-xung-Ä‘á»™t)
3. [PHÃ‚N RÃƒ Há»† THá»NG Má»¤C TIÃŠU THEO THÃ€NH PHáº¦N KIáº¾N TRÃšC](#3-phÃ¢n-rÃ£-há»‡-thá»‘ng-má»¥c-tiÃªu-theo-thÃ nh-pháº§n-kiáº¿n-trÃºc)
4. [THá»¨ Tá»° THá»°C THI & KIáº¾N TRÃšC PHá»¤ THUá»˜C TRIá»‚N KHAI](#4-thá»©-tá»±-thá»±c-thi--kiáº¿n-trÃºc-phá»¥-thuá»™c-triá»ƒn-khai)
5. [Káº¾ HOáº CH TRIá»‚N KHAI CÆ  Sá»ž Dá»® LIá»†U & Lá»˜ TRÃŒNH MIGRATION](#5-káº¿-hoáº¡ch-triá»ƒn-khai-cÆ¡-sá»Ÿ-dá»¯-liá»‡u--lá»™-trÃ¬nh-migration)
6. [Káº¾ HOáº CH TRIá»‚N KHAI AUTH, RBAC, RLS & PHÃ‚N TÃCH NHIá»†M Vá»¤ (SOD)](#6-káº¿-hoáº¡ch-triá»ƒn-khai-auth-rbac-rls--phÃ¢n-tÃ¡ch-nhiá»‡m-vá»¥-sod)
7. [Káº¾ HOáº CH TRIá»‚N KHAI VÃ’NG Äá»œI Há»ŒC VIÃŠN (LEARNER CORE ENGINE)](#7-káº¿-hoáº¡ch-triá»ƒn-khai-vÃ²ng-Ä‘á»i-há»c-viÃªn-learner-core-engine)
8. [Káº¾ HOáº CH TRIá»‚N KHAI ÄÃNH GIÃ NÄ‚NG Lá»°C & ÄIá»‚M XUáº¤T PHÃT (ASSESSMENT)](#8-káº¿-hoáº¡ch-triá»ƒn-khai-Ä‘Ã¡nh-giÃ¡-nÄƒng-lá»±c--Ä‘iá»ƒm-xuáº¥t-phÃ¡t-assessment)
9. [Káº¾ HOáº CH TRIá»‚N KHAI THá»¬ THÃCH NHáº¢Y CÃ“C, LÃ€M Láº I, SRS & CHUá»–I Há»ŒC (INTELLIGENCE)](#9-káº¿-hoáº¡ch-triá»ƒn-khai-thá»­-thÃ¡ch-nháº£y-cÃ³c-lÃ m-láº¡i-srs--chuá»—i-há»c-intelligence)
10. [Káº¾ HOáº CH TRIá»‚N KHAI QUáº¢N TRá»Š Ná»˜I DUNG & DUYá»†T BÃ€I Há»ŒC (CONTENT GOVERNANCE)](#10-káº¿-hoáº¡ch-triá»ƒn-khai-quáº£n-trá»‹-ná»™i-dung--duyá»‡t-bÃ i-há»c-content-governance)
11. [QUY CHUáº¨N GIAO DIá»†N Láº¬P TRÃŒNH API & Lá»šP ÄIá»€U PHá»I BFF](#11-quy-chuáº©n-giao-diá»‡n-láº­p-trÃ¬nh-api--lá»›p-Ä‘iá»u-phá»‘i-bff)
12. [CHIáº¾N LÆ¯á»¢C KIá»‚M THá»¬ Tá»° Äá»˜NG & Bá»˜ KHUNG KIá»‚M THá»¬ KHáº¢ THI](#12-chiáº¿n-lÆ°á»£c-kiá»ƒm-thá»­-tá»±-Ä‘á»™ng--bá»™-khung-kiá»ƒm-thá»­-kháº£-thi)
13. [Bá»˜ Dá»® LIá»†U KIá»‚M THá»¬ & Dá»® LIá»†U MáºªU TRÃŒNH DIá»„N (SEED DATA)](#13-bá»™-dá»¯-liá»‡u-kiá»ƒm-thá»­--dá»¯-liá»‡u-máº«u-trÃ¬nh-diá»…n-seed-data)
14. [Ká»ŠCH Báº¢N TRÃŒNH DIá»„N Há»† THá»NG LIÃŠN Tá»¤C (DEMO PLAN)](#14-ká»‹ch-báº£n-trÃ¬nh-diá»…n-há»‡-thá»‘ng-liÃªn-tá»¥c-demo-plan)
15. [MA TRáº¬N Báº°NG CHá»¨NG BÃO CÃO Há»ŒC THUáº¬T (REPORT EVIDENCE MATRIX)](#15-ma-tráº­n-báº±ng-chá»©ng-bÃ¡o-cÃ¡o-há»c-thuáº­t-report-evidence-matrix)
16. [KHUNG KIá»‚M Äá»ŠNH HIá»†U NÄ‚NG & TIÃŠU CHÃ PHI CHá»¨C NÄ‚NG (NFR VALIDATION)](#16-khung-kiá»ƒm-Ä‘á»‹nh-hiá»‡u-nÄƒng--tiÃªu-chÃ­-phi-chá»©c-nÄƒng-nfr-validation)
17. [MÃ” HÃŒNH QUáº¢N TRá»Š Má»C & Cá»”NG NGHIá»†M THU (GATED MILESTONE MODEL)](#17-mÃ´-hÃ¬nh-quáº£n-trá»‹-má»‘c--cá»•ng-nghiá»‡m-thu-gated-milestone-model)
18. [ÃNH Xáº  TRIá»‚N KHAI VÃ€O Cáº¤U TRÃšC BÃO CÃO Há»ŒC THUáº¬T](#18-Ã¡nh-xáº¡-triá»ƒn-khai-vÃ o-cáº¥u-trÃºc-bÃ¡o-cÃ¡o-há»c-thuáº­t)
19. [Sá»” ÄÄ‚NG KÃ Rá»¦I RO & KHOáº¢NG TRá»NG Ká»¸ THUáº¬T (RISK REGISTER)](#19-sá»•-Ä‘Äƒng-kÃ½-rá»§i-ro--khoáº£ng-trá»‘ng-ká»¹-thuáº­t-risk-register)
20. [Lá»˜ TRÃŒNH Tá»”NG THá»‚ GIAI ÄOáº N 2 (MASTER ROADMAP M3.1..M3.10)](#20-lá»™-trÃ¬nh-tá»•ng-thá»ƒ-giai-Ä‘oáº¡n-2-master-roadmap-m31m310)
21. [RÃ€NG BUá»˜C Cá»¨NG VÃ€ Ká»¶ LUáº¬T THá»°C THI (HARD CONSTRAINTS)](#21-rÃ ng-buá»™c-cá»©ng-vÃ -ká»·-luáº­t-thá»±c-thi-hard-constraints)

---

## 1. AUDIT HIá»†N TRáº NG KHO LÆ¯U TRá»® (CURRENT VS TARGET VS GAP)

Äá»ƒ Ä‘áº£m báº£o tÃ­nh trung thá»±c tuyá»‡t Ä‘á»‘i, báº£ng audit nÃ y Ä‘á»‘i soÃ¡t chi tiáº¿t giá»¯a **mÃ£ nguá»“n/háº¡ táº§ng thá»±c táº¿ Ä‘ang cháº¡y (CURRENT)** vÃ  **thiáº¿t káº¿ Ä‘Ã£ Ä‘Æ°á»£c cháº¥p thuáº­n táº¡i M2.2â€“M2.6 (TARGET)**.

### 1.1. Hiá»‡n Tráº¡ng Thá»±c Táº¿ (CURRENT)
- **á»¨ng dá»¥ng Web Há»c viÃªn (`lingora-web`):**
  - Khung cÃ´ng nghá»‡: Next.js 15.1.0, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui.
  - MÃ£ nguá»“n hiá»‡n cÃ³: Vá» á»©ng dá»¥ng cÆ¡ báº£n (`src/app/page.tsx`), trang xÃ¡c thá»±c Ä‘Äƒng nháº­p/Ä‘Äƒng kÃ½ (`src/app/(auth)/login`, `(auth)/register`), proxy Ä‘á»‹nh tuyáº¿n AI (`src/app/api/ai/chat/route.ts`, `api/ai/srs/route.ts`), gÃ³i ngÃ´n ngá»¯ i18n (`vi`, `en`), tiá»‡n Ã­ch Supabase client/server (`src/lib/supabase/`).
  - Kiá»ƒm thá»­ hiá»‡n cÃ³: 14/14 bÃ i test Vitest cháº¡y Ä‘áº¡t (`tests/unit/`).
  - **Thá»±c táº¿ váº¯ng máº·t:** HoÃ n toÃ n chÆ°a cÃ³ giao diá»‡n há»c bÃ i (Lesson Player), chÆ°a cÃ³ trÃ¬nh lÃ m bÃ i táº­p tÆ°Æ¡ng tÃ¡c (Exercise Engine), chÆ°a cÃ³ mÃ n hÃ¬nh cháº©n Ä‘oÃ¡n (Diagnostic Placement), chÆ°a cÃ³ giao diá»‡n nháº£y cÃ³c (Jump), chÆ°a cÃ³ mÃ n hÃ¬nh Ã´n táº­p ngáº¯t quÃ£ng (SRS Review), chÆ°a cÃ³ báº£ng theo dÃµi chuá»—i há»c táº­p (Streak View), chÆ°a cÃ³ há»“ sÆ¡ nÄƒng lá»±c (Skill Profile).
- **á»¨ng dá»¥ng Quáº£n trá»‹ & CÆ¡ sá»Ÿ dá»¯ liá»‡u (`lingora-admin`):**
  - Khung cÃ´ng nghá»‡: Prisma ORM 6.2.1 káº¿t ná»‘i PostgreSQL trÃªn Supabase.
  - LÆ°á»£c Ä‘á»“ hiá»‡n táº¡i (`prisma/schema.prisma`): Chá»©a 18 mÃ´ hÃ¬nh dá»¯ liá»‡u tá»« Phase 0 (`Language`, `Profile`, `Course`, `CourseTranslation`, `Unit`, `UnitTranslation`, `Lesson`, `LessonTranslation`, `Vocabulary`, `VocabularyTranslation`, `LessonVocabulary`, `Exercise`, `UserProgress`, `UserVocabSrs`, `ReviewLog`, `ChatScenario`, `ChatScenarioTranslation`, `AuditLog`).
  - Enum hiá»‡n táº¡i: `Role` (6 giÃ¡ trá»‹), `ContentStatus` (6 giÃ¡ trá»‹), `Cefr` (6 giÃ¡ trá»‹), `ExerciseType` (chá»‰ cÃ³ 3 giÃ¡ trá»‹: `MCQ`, `FILL_BLANK`, `REORDER`), `ProgressStatus` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).
  - Dá»¯ liá»‡u di chuyá»ƒn: ThÆ° má»¥c `prisma/migrations` chá»©a 3 file migration lá»‹ch sá»­ M1 (`init`, `profile_triggers`, `security_policies`).
  - **Thá»±c táº¿ váº¯ng máº·t:** HoÃ n toÃ n chÆ°a cÃ³ báº£ng phiÃªn báº£n bÃ i há»c `lesson_revisions` (DD-02), chÆ°a cÃ³ báº£ng káº¿t quáº£ cháº©n Ä‘oÃ¡n `assessment_results` (DD-06), chÆ°a cÃ³ báº£ng há»“ sÆ¡ ká»¹ nÄƒng `skill_profiles` (DD-06), chÆ°a cÃ³ báº£ng quáº£n lÃ½ phÃ¢n cÃ´ng bÃ i há»c, thiáº¿u 2 loáº¡i bÃ i táº­p má»¥c tiÃªu (`LISTENING`, `GRAMMAR`) trong enum `ExerciseType`, thiáº¿u tráº¡ng thÃ¡i `LOCKED` vÃ  `SKIPPED_BY_JUMP` trong `ProgressStatus`. ChÆ°a cÃ³ báº¥t ká»³ giao diá»‡n biÃªn soáº¡n hay kiá»ƒm duyá»‡t nÃ o trong `lingora-admin`.
- **CÃ¡c thÃ nh pháº§n kho lÆ°u trá»¯ liÃªn quan AI (`lingora-ai`):**
  - **Quy cháº¿ hiá»‡n tráº¡ng & pháº¡m vi (Current & Scope Note):** CÃ¡c thÃ nh pháº§n kho lÆ°u trá»¯ liÃªn quan AI, khi xuáº¥t hiá»‡n, chá»‰ Ä‘Æ°á»£c lÆ°u giá»¯ dÆ°á»›i dáº¡ng bá» máº·t tÆ°Æ¡ng thÃ­ch vÃ  tham chiáº¿u lá»‹ch sá»­ (AI-related repository artifacts, when present, are retained only as historical/compatibility surfaces and are outside Phase 2 implementation, testing, demo, and acceptance).
  - Endpoint má»¥c tiÃªu `/v1/gec/correct` (Ä‘Æ°á»£c nháº¯c táº¡i `docs/03-api-contract.md` nhÆ° má»™t há»£p Ä‘á»“ng tham chiáº¿u) hoÃ n toÃ n khÃ´ng thuá»™c pháº¡m vi triá»ƒn khai, kiá»ƒm thá»­ hay nghiá»‡m thu cá»§a Phase 2.
- **Háº¡ táº§ng Dá»¯ liá»‡u & An ninh Supabase:**
  - CÆ¡ sá»Ÿ dá»¯ liá»‡u Postgres 15 táº¡i vÃ¹ng `ap-southeast-1`. ÄÃ£ thiáº¿t láº­p 2 storage bucket (`lingora-avatars`, `lingora-media`).
  - ChÃ­nh sÃ¡ch RLS hiá»‡n cÃ³ trÃªn database chá»‰ lÃ  phiÃªn báº£n sÆ¡ khai M1 (kiá»ƒm tra 2 vai trÃ² nhá»‹ phÃ¢n `USER`/`ADMIN`), chÆ°a triá»ƒn khai ma tráº­n RLS cho 6 vai trÃ² vÃ  chÆ°a cÃ i Ä‘áº·t cÃ¡c hÃ m cháº·n vi pháº¡m phÃ¢n tÃ¡ch nhiá»‡m vá»¥ (SoD).

### 1.2. Thiáº¿t Káº¿ Má»¥c TiÃªu (TARGET M2.2â€“M2.6)
- **Há»‡ thá»‘ng 6 vai trÃ² chuáº©n táº¯c:** `Learner`, `Lesson Creator`, `Moderator`, `Organizational Manager`, `Operations Staff`, `Administrator`.
- **19 thÃ nh pháº§n kiáº¿n trÃºc chuáº©n táº¯c:** PhÃ¢n rÃ£ 5 táº§ng (`COMP-PRES-01/02`, `COMP-APP-01/02`, `COMP-DOM-01..08`, `COMP-INFRA-01..05`, `COMP-EXT-01/02`).
- **5 vÃ¹ng an ninh logic:** Zone 1 Client, Zone 2 Trusted BFF, Zone 3 Supabase Core, Zone 4 Isolated AI, Zone 5 Privileged Ops.
- **VÃ²ng Ä‘á»i ná»™i dung 6 tráº¡ng thÃ¡i báº¥t biáº¿n:** `Draft â†’ In Review â†’ Changes Requested â†’ Draft â†’ In Review â†’ Approved â†’ Published â†’ Archived`, cÆ¡ cháº¿ nhÃ¢n báº£n báº£n tháº£o (Clone-to-Draft v2 qua `supersedes_id`), Ä‘iá»u kiá»‡n Ä‘Æ¡n vá»‹ hiá»ƒn thá»‹ (Unit 4/4 Published).
- **Quy táº¯c phÃ¢n tÃ¡ch nhiá»‡m vá»¥ (SoD):** Creator khÃ´ng tá»± duyá»‡t, Moderator khÃ´ng xuáº¥t báº£n, Manager xuáº¥t báº£n thÃ´ng thÆ°á»ng, Administrator xuáº¥t báº£n kháº©n cáº¥p kÃ¨m lÃ½ do báº¯t buá»™c vÃ  ghi log kiá»ƒm toÃ¡n `CONTENT_EMERGENCY_PUB`.
- **Äá»™ng cÆ¡ há»c táº­p & bÃ i táº­p há»£p nháº¥t (Unified Exercise):** 5 dáº¡ng bÃ i táº­p (`MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`), háº¡n má»©c lÃ m láº¡i cÃ³ kiá»ƒm soÃ¡t `max(1, floor(N * 0.10))` theo tá»«ng lÆ°á»£t lÃ m bÃ i, báº£o lÆ°u Ä‘iá»ƒm tráº§n 70%.
- **Äá»™ng cÆ¡ Ä‘Ã¡nh giÃ¡ nÄƒng lá»±c & xuáº¥t phÃ¡t Ä‘iá»ƒm:** BÃ i cháº©n Ä‘oÃ¡n 30 cÃ¢u há»i (Human-Selected Design Decision; canonical M2 docs still require formal status sync before/with next design update), má»—i cÃ¢u tráº£ lá»i Ä‘Ãºng nháº­n 1 Ä‘iá»ƒm thÃ´ (0â€“30 Ä‘iá»ƒm thÃ´), Mapping A táº¥t Ä‘á»‹nh (0â€“30 Ä‘iá»ƒm thÃ´ ra Unit 1â€“6), Skip chuyá»ƒn vá» Unit 1 `UNVERIFIED` (0 AssessmentResult, 0 SkillProfile), thi láº¡i táº¡o báº£n ghi `AssessmentResult` báº¥t biáº¿n má»›i. Thá»­ thÃ¡ch nháº£y cÃ³c (Jump) ngÆ°á»¡ng â‰¥95%, há»“i chiÃªu 24h, gÃ¡n cá» `by_jump = true` (`SKIPPED_BY_JUMP`), khÃ´ng tÃ­nh hoÃ n thÃ nh Unit.
- **Thuáº­t toÃ¡n Ã´n táº­p ngáº¯t quÃ£ng (SRS):** Chu ká»³ táº¥t Ä‘á»‹nh Policy B `[1, 3, 7, 14, 30]`, tráº£ lá»i sai Ä‘áº·t láº¡i vá» Stage 1 (+1 ngÃ y), cháº¡y Ä‘á»™c láº­p qua RPC cÆ¡ sá»Ÿ dá»¯ liá»‡u `record_review`.
- **Chuá»—i ngÃ y há»c liÃªn tá»¥c (Streak):** TÃ­nh toÃ¡n theo ngÃ y dÆ°Æ¡ng lá»‹ch cá»¥c bá»™ thuá»™c mÃºi giá» IANA cá»§a há»c viÃªn, bá» lá»¡ 1 ngÃ y Ä‘áº·t láº¡i vá» 1, khÃ´ng cÃ³ cÆ¡ cháº¿ Ä‘Ã³ng bÄƒng (freeze) trong Core MVP.
- **Dá»‹ch vá»¥ AI há»— trá»£ (Historical / Supporting Reference):** Thiáº¿t káº¿ M2 coi AI lÃ  nÄƒng lá»±c há»— trá»£ phi tráº¡ng thÃ¡i. Trong Phase 2, toÃ n bá»™ cÃ¡c chá»©c nÄƒng vÃ  endpoint AI Ä‘á»u náº±m ngoÃ i pháº¡m vi triá»ƒn khai vÃ  nghiá»‡m thu; há»‡ thá»‘ng váº­n hÃ nh 100% dá»±a trÃªn cÃ¡c thuáº­t toÃ¡n nghiá»‡p vá»¥ táº¥t Ä‘á»‹nh (deterministic business algorithms).
- **Kiá»ƒm toÃ¡n an ninh:** 11 sá»± kiá»‡n kiá»ƒm toÃ¡n chuáº©n táº¯c ghi vÃ o báº£ng append-only `audit_logs`.

### 1.3. Báº£ng TÃ¡i Thiáº¿t Hiá»‡n Tráº¡ng Kho LÆ°u Trá»¯ & Khoáº£ng Trá»‘ng Triá»ƒn Khai (Current Reality Reconstruct & Gap Matrix)

Báº£ng Ä‘á»‘i soÃ¡t 15 lÄ©nh vá»±c ká»¹ thuáº­t phÃ¢n Ä‘á»‹nh tuyá»‡t Ä‘á»‘i giá»¯a hiá»‡n tráº¡ng thá»±c táº¿ trong mÃ£ nguá»“n/database (`CURRENT`) vÃ  thiáº¿t káº¿ má»¥c tiÃªu Ä‘Ã£ duyá»‡t (`TARGET`), kÃ¨m báº±ng chá»©ng kiá»ƒm chá»©ng khÃ¡ch quan:

| LÄ©nh Vá»±c (Area) | Hiá»‡n Tráº¡ng Thá»±c Táº¿ (CURRENT) | Thiáº¿t Káº¿ Má»¥c TiÃªu (TARGET) | Báº±ng Chá»©ng Thá»±c Táº¿ (Evidence) | Xung Äá»™t / Khoáº£ng Trá»‘ng Triá»ƒn Khai (Conflict / Gap) |
|---|---|---|---|---|
| **1. DB Schema** | 18 models trong `schema.prisma`; Migration 1 táº¡o 18 báº£ng; thiáº¿u 3 báº£ng má»›i, thiáº¿u 2 enum values. | 18 models + 3 báº£ng má»›i (`lesson_revisions`, `assessment_results`, `skill_profiles`); 2 enum nÃ¢ng cáº¥p. | `lingora-admin/prisma/schema.prisma`; `prisma/migrations/202608140001_init/migration.sql`. | Cáº§n migration má»Ÿ rá»™ng (Expand Phase M3.1) táº¡o 3 báº£ng má»›i, sá»­a Ä‘á»•i 4 báº£ng hiá»‡n cÃ³, cáº­p nháº­t 2 enum. KhÃ´ng cÃ³ xung Ä‘á»™t cáº¥u trÃºc. |
| **2. Role Enum** | Enum `Role` trong DB Ä‘Ã£ náº¡p chá»‰ cÃ³ 2 giÃ¡ trá»‹ (`LEARNER`, `ADMIN`). `schema.prisma` khai bÃ¡o 6 giÃ¡ trá»‹. | 6 vai trÃ² chuáº©n táº¯c: `LEARNER`, `LESSON_CREATOR`, `MODERATOR`, `OPERATIONS_STAFF`, `ORGANIZATIONAL_MANAGER`, `ADMINISTRATOR`. | `202608140001_init/migration.sql` dÃ²ng 5: `CREATE TYPE "Role" AS ENUM ('LEARNER', 'ADMIN');`. | XUNG Äá»˜T THá»°C Táº¾: M3.2 báº¯t buá»™c thá»±c hiá»‡n migration má»Ÿ rá»™ng enum `Role` tá»« 2 lÃªn 6 giÃ¡ trá»‹ trong PostgreSQL trÆ°á»›c khi triá»ƒn khai RBAC. |
| **3. RLS Policies** | RLS sÆ¡ khai M1.3; kiá»ƒm tra nhá»‹ phÃ¢n `is_admin() = (role == 'ADMIN')`. Cá»™t `role` bá»‹ khÃ³a khÃ´ng cho learner tá»± sá»­a qua `GRANT UPDATE`. | Ma tráº­n RLS kÃ©p 6 vai trÃ² chuáº©n táº¯c; kiá»ƒm tra phÃ¢n tÃ¡ch nhiá»‡m vá»¥ SoD táº¡i database layer. | `202608140002_auth_rls_storage.../migration.sql` dÃ²ng 107â€“120, 316â€“317. | Cáº§n viáº¿t láº¡i toÃ n diá»‡n bá»™ chÃ­nh sÃ¡ch RLS cho 6 vai trÃ² vÃ  trigger kiá»ƒm soÃ¡t SoD táº¡i M3.2. Cá»™t `role` trong PostgreSQL migration 2 Ä‘Ã£ Ã¡p dá»¥ng `GRANT UPDATE` chá»‰ cho 6 cá»™t cÃ¡ nhÃ¢n, khÃ´ng cáº¥p cho learner. |
| **4. Profile** | CURRENT APPLIED trong DB Ä‘Ã£ cÃ³: `display_name`, `avatar_url`, `ui_locale`, `native_lang_code`, `daily_goal_min`, `timezone`, `streak_count`, `last_qualifying_activity_date`, `role`. | TARGET EXTENSION: Bá»• sung cá»™t `verified_starting_unit INT DEFAULT 1` lÆ°u xuáº¥t phÃ¡t Ä‘iá»ƒm Ä‘Ã£ kiá»ƒm Ä‘á»‹nh; báº£ng `skill_profiles`. | `schema.prisma` dÃ²ng 79â€“105; `migration.sql` dÃ²ng 31â€“48. | Cáº§n bá»• sung cá»™t `verified_starting_unit` trong M3.1. CÃ¡c trÆ°á»ng Ä‘áº·c quyá»n (`role`, `verified_starting_unit`, `streak_count`, `last_qualifying_activity_date`) báº¯t buá»™c do server/DB kiá»ƒm soÃ¡t, khÃ´ng cáº¥p quyá»n UPDATE cho role Learner. |
| **5. Exercise** | 3 loáº¡i bÃ i táº­p (`MCQ`, `FILL_BLANK`, `REORDER`); trÆ°á»ng `payload` chÆ°a chuáº©n hÃ³a; trá» tháº³ng vá» `lesson_id`. | 5 loáº¡i bÃ i táº­p (+`LISTENING`, +`GRAMMAR`); trá» vá» `lesson_revision_id UUID NULL`; cáº¥m lá»™ Ä‘Ã¡p Ã¡n Ä‘Ãºng á»Ÿ payload learner. | `schema.prisma` dÃ²ng 43, 252â€“270; `migration.sql` dÃ²ng 11. | Cáº§n thÃªm 2 enum values, thÃªm FK revision; tÃ¡ch biá»‡t tuyá»‡t Ä‘á»‘i giá»¯a payload lÃ m bÃ i vÃ  bÃ­ máº­t Ä‘Ã¡p Ã¡n cháº¥m Ä‘iá»ƒm táº¡i M3.1/M3.3 (`Learner payload != grading secret`). |
| **6. Content Lifecycle** | Báº£ng `lessons` pháº³ng cÃ³ trÆ°á»ng `status ContentStatus @default(DRAFT)`, `is_published`. ChÆ°a cÃ³ giao diá»‡n biÃªn soáº¡n. | VÃ²ng Ä‘á»i 6 tráº¡ng thÃ¡i qua `lesson_revisions`; Clone-to-Draft v2 (`supersedes_id`); Unit 4/4 Published rule. | `schema.prisma` dÃ²ng 175â€“203; thÆ° má»¥c `lingora-admin` chÆ°a cÃ³ UI biÃªn soáº¡n. | ToÃ n bá»™ phÃ¢n há»‡ quáº£n trá»‹ vÃ  kiá»ƒm duyá»‡t ná»™i dung cáº§n Ä‘Æ°á»£c láº­p trÃ¬nh má»›i trong `lingora-admin` táº¡i M3.6. |
| **7. Assessment** | ChÆ°a cÃ³ logic cháº©n Ä‘oÃ¡n Ä‘áº§u vÃ o, chÆ°a cÃ³ báº£ng lÆ°u lá»‹ch sá»­ thi hay há»“ sÆ¡ ká»¹ nÄƒng. | Äá»™ng cÆ¡ cháº©n Ä‘oÃ¡n 30 cÃ¢u (1 cÃ¢u = 1 Ä‘iá»ƒm thÃ´, raw score 0â€“30); Mapping A (0â€“30 ra Unit 1â€“6); lÆ°u báº¥t biáº¿n `assessment_results`, `skill_profiles`. | `docs/09-placement-and-jump-specification.md`; mÃ£ nguá»“n `lingora-web` chÆ°a cÃ³ assessment. | Cáº§n triá»ƒn khai má»›i domain assessment táº¡i M3.4 theo quyáº¿t Ä‘á»‹nh Ä‘Ã£ chá»‘t: Diagnostic 30 cÃ¢u, 0â€“30 Ä‘iá»ƒm thÃ´. (Canonical M2 docs váº«n ghi `~25â€“30 items / PROPOSED` vÃ  cáº§n Ä‘á»“ng bá»™ tráº¡ng thÃ¡i chÃ­nh thá»©c á»Ÿ láº§n cáº­p nháº­t thiáº¿t káº¿ káº¿ tiáº¿p). |
| **8. Retry (D7)** | ChÆ°a cÃ³ logic háº¡n má»©c lÃ m láº¡i cÃ³ kiá»ƒm soÃ¡t. | $\max(1, \lfloor N \times 0.10 \rfloor)$ tÃ­nh theo lÆ°á»£t lÃ m bÃ i; lÃ m láº¡i Ä‘Ãºng nháº­n tá»‘i Ä‘a 70% Ä‘iá»ƒm; kiá»ƒm soÃ¡t á»Ÿ server. | `docs/02-requirements.md` D7; `lingora-web` chÆ°a cÃ³ retry engine. | TARGET STATE REPRESENTATION: Persistent attempt/retry state representation must be finalized before M3.1 schema implementation. |
| **9. SRS (D8)** | RPC `record_review` nháº­n tham sá»‘ liÃªn tá»¥c `p_recall_probability`, `p_recommended_interval_days`. | Chu ká»³ táº¥t Ä‘á»‹nh Policy B `[1, 3, 7, 14, 30]` ngÃ y; `stage` quy Æ°á»›c 0 lÃ  máº§m, 1..5 tÆ°Æ¡ng á»©ng chu ká»³. | `202608140002_auth_rls_storage.../migration.sql` dÃ²ng 192â€“274. | Cáº§n cáº­p nháº­t RPC `record_review` Ä‘á»ƒ tá»± Ä‘á»™ng tÃ­nh chu ká»³ Policy B trá»±c tiáº¿p trong database, loáº¡i bá» tÃ­nh toÃ¡n mock táº¡i M3.5. |
| **10. Jump (D5)** | ChÆ°a cÃ³ logic nháº£y cÃ³c hay bÃ i táº­p kiá»ƒm tra vÆ°á»£t cáº¥p. | Äiá»ƒm $\ge 95\%$ má»Ÿ Unit liá»n ká», gÃ¡n cá» `by_jump = true` (`SKIPPED_BY_JUMP`); trÆ°á»£t kÃ­ch hoáº¡t há»“i chiÃªu 24 giá». | `docs/09-placement-and-jump-specification.md` Â§3; chÆ°a cÃ³ code Jump. | TARGET: Server-authoritative cooldown state. Biá»ƒu diá»…n váº­t lÃ½ cá»¥ thá»ƒ (Physical representation): TO BE FINALIZED DURING M3.1/M3.5. |
| **11. Streak (D9)**| ÄÃ£ cÃ³ logic cá»™ng streak trong RPC `record_review` theo ngÃ y lá»‹ch vÃ  mÃºi giá» IANA cá»§a profile. | TÃ­nh toÃ¡n chuá»—i liÃªn tá»¥c theo mÃºi giá» IANA há»c viÃªn; bá» lá»¡ 1 ngÃ y Ä‘áº·t láº¡i vá» 1; kÃ­ch hoáº¡t bá»Ÿi cáº£ bÃ i há»c vÃ  SRS. | `202608140002_auth_rls.../migration.sql` dÃ²ng 256â€“268. | Logic streak hiá»‡n chá»‰ gáº¯n vá»›i SRS; cáº§n tÃ­ch há»£p thÃªm sá»± kiá»‡n hoÃ n thÃ nh bÃ i há»c (Lesson completion) táº¡i M3.5. |
| **12. API Surface** | Chá»‰ cÃ³ Next.js auth basic (`/login`, `/register`) vÃ  proxy AI (`/api/ai/chat`, `/api/ai/srs`). | ToÃ n bá»™ BFF API route handlers cho há»c viÃªn vÃ  quáº£n trá»‹ viÃªn phá»§ Ä‘á»§ 15 Use Cases; gáº¯n nhÃ£n `[NOT LOCKED]`. | ThÆ° má»¥c `lingora-web/src/app/(auth)` vÃ  `src/app/api`. | Cáº§n xÃ¢y dá»±ng toÃ n bá»™ BFF handlers trong M3.2â€“M3.6; cÃ¡c route cá»¥ thá»ƒ mang tÃ­nh minh há»a, khÃ´ng khÃ³a há»£p Ä‘á»“ng. |
| **13. Test Suites** | 14 test unit Vitest táº¡i `lingora-web`; 1 seed test táº¡i `lingora-admin`; 37 test pytest táº¡i `lingora-ai/api`. | 18 khung kiá»ƒm thá»­ kháº£ thi M2.6; Frames 1â€“16 thá»±c thi trong Phase 2, Frames 17â€“18 lÆ°u váº¿t lá»‹ch sá»­. | `lingora-web/package.json`, `lingora-admin/package.json`. | Chuáº©n hÃ³a báº£ng runner kiá»ƒm thá»­ theo package: dÃ¹ng `npx vitest run` vÃ  `playwright test`; khÃ´ng gá»i lá»‡nh npm chÆ°a khai bÃ¡o. |
| **14. Seed Data** | Script `prisma/seed.js` táº¡o dá»¯ liá»‡u máº§m cÆ¡ báº£n cho M1. | PhÃ¢n Ä‘á»‹nh ráº¡ch rÃ²i 2 nhÃ³m: `Learning Demo Fixture` (Unit 3 4/4 Published) vÃ  `Content Governance Fixture`. | `lingora-admin/prisma/seed.js`; Má»¥c 13 káº¿ hoáº¡ch. | TARGET DESIGN: PhÃ¢n tÃ¡ch 2 fixture máº§m Ä‘á»™c láº­p (Learning Fixture & Content Governance Fixture) Ä‘á»ƒ báº£o Ä‘áº£m tÃ­nh nháº¥t quÃ¡n khi kiá»ƒm chá»©ng Ä‘iá»u kiá»‡n Unit 4/4. |
| **15. Live Demo** | ChÆ°a cÃ³ ká»‹ch báº£n cháº¡y thá»­ nghiá»‡m thá»±c táº¿. | 4 MÃ n trÃ¬nh diá»…n liÃªn tá»¥c (HÃ nh trÃ¬nh há»c viÃªn, Quáº£n trá»‹ ná»™i dung, PhÃ²ng thá»§ SoD, CÃ¡ nhÃ¢n hÃ³a quy táº¯c). | Má»¥c 14 káº¿ hoáº¡ch tá»•ng thá»ƒ. | Ká»‹ch báº£n demo Ã¡nh xáº¡ chÃ­nh xÃ¡c vÃ o 2 nhÃ³m fixture máº§m Ä‘Ã£ phÃ¢n tÃ¡ch, báº£o Ä‘áº£m cháº¡y thá»±c nghiá»‡m thÃ´ng suá»‘t 100%. |

---

## 2. CÄ‚N Cá»¨ THIáº¾T Káº¾ CHUáº¨N Táº®C & NGUYÃŠN Táº®C GIáº¢I QUYáº¾T XUNG Äá»˜T

Má»i hoáº¡t Ä‘á»™ng triá»ƒn khai trong Phase 2 báº¯t buá»™c pháº£i tuÃ¢n thá»§ nghiÃªm ngáº·t cÃ¡c quyáº¿t Ä‘á»‹nh chuáº©n táº¯c Ä‘Ã£ Ä‘Æ°á»£c Ä‘Ã³ng bÄƒng. Tuyá»‡t Ä‘á»‘i khÃ´ng tá»± Ã½ phÃ¡t minh hoáº·c tÃ¡i thiáº¿t káº¿.

### 2.1. Danh Má»¥c CÃ¡c Báº¥t Biáº¿n Thiáº¿t Káº¿ KhÃ´ng Thá»ƒ ThÆ°Æ¡ng LÆ°á»£ng
1. **6 Vai trÃ² Chuáº©n táº¯c:** `Administrator`, `Lesson Creator`, `Moderator`, `Operations Staff`, `Learner`, `Organizational Manager` (KhÃ´ng coi khÃ³a ká»¹ thuáº­t `service_role` lÃ  vai trÃ² thá»© 7).
2. **15 Ca Sá»­ Dá»¥ng & 15 Luá»“ng Nghiá»‡p Vá»¥:** `UC-01` Ä‘áº¿n `UC-15` vÃ  `BF-01` Ä‘áº¿n `BF-15`. Trong Ä‘Ã³, `UC-15` (Quáº£n lÃ½ NhÃ³m há»c & Cohort) lÃ  ranh giá»›i má»Ÿ rá»™ng tÆ°Æ¡ng lai (`FUTURE_EXTENSION`), khÃ´ng thuá»™c MVP.
3. **9 Quyáº¿t Äá»‹nh Sáº£n Pháº©m ÄÃ³ng BÄƒng (D1â€“D9):**
   - **D1:** Káº¿ hoáº¡ch bÃ i há»c do Quáº£n lÃ½ (Manager) chá»‰ Ä‘á»‹nh phÃ¢n cÃ´ng; Creator chá»‰ biÃªn soáº¡n bÃ i Ä‘Æ°á»£c giao.
   - **D2:** PhÃ¢n tÃ¡ch nhiá»‡m vá»¥ tuyá»‡t Ä‘á»‘i: Creator khÃ´ng tá»± duyá»‡t; Moderator khÃ´ng xuáº¥t báº£n; Manager xuáº¥t báº£n thÃ´ng thÆ°á»ng; Admin xuáº¥t báº£n kháº©n cáº¥p cÃ³ lÃ½ do.
   - **D3:** Cáº¥m sá»­a Ä‘Ã¨ ná»™i dung Ä‘Ã£ xuáº¥t báº£n; báº¯t buá»™c nhÃ¢n báº£n táº¡o báº£n tháº£o má»›i (Clone-to-Draft v2 qua `supersedes_id`).
   - **D4:** MÃ´ hÃ¬nh bÃ i táº­p há»£p nháº¥t (Unified Exercise); cáº¥m táº¡o báº£ng `Exam` hay `QuestionBank`.
   - **D5:** Thá»­ thÃ¡ch nháº£y cÃ³c (Jump) Ã¡p dá»¥ng cho Ä‘Æ¡n vá»‹ liá»n ká»; Ä‘áº¡t khi Ä‘iá»ƒm â‰¥95%; trÆ°á»£t bá»‹ khÃ³a há»“i chiÃªu 24 giá».
   - **D6:** ÄÃ¡nh giÃ¡ cháº©n Ä‘oÃ¡n (Diagnostic): 4 khÃ­a cáº¡nh cá»‘t lÃµi (Vocabulary, Grammar, Reading, Listening) vÃ  thuáº­t toÃ¡n Mapping A (0â€“30 Ä‘iá»ƒm thÃ´ ra Unit 1â€“6) lÃ  thiáº¿t káº¿ Ä‘Ã£ khÃ³a (CANONICAL LOCKED DECISION); khÃ´ng cáº¥p chá»©ng chá»‰ CEFR.
     - **Quyáº¿t Ä‘á»‹nh thiáº¿t káº¿ con ngÆ°á»i Ä‘Ã£ chá»‘t chÃ­nh thá»©c (HUMAN-SELECTED DESIGN DECISION):**
       - Sá»‘ lÆ°á»£ng cÃ¢u há»i bÃ i cháº©n Ä‘oÃ¡n: **chÃ­nh xÃ¡c 30 cÃ¢u há»i** (`Diagnostic item count = 30`).
       - Thang Ä‘iá»ƒm thÃ´: **0 Ä‘áº¿n 30 Ä‘iá»ƒm** (`Raw score = 0..30`).
       - Quy táº¯c tÃ­nh Ä‘iá»ƒm: **1 cÃ¢u tráº£ lá»i Ä‘Ãºng = 1 Ä‘iá»ƒm thÃ´** (`1 correct answer = 1 raw point`). KhÃ´ng sá»­ dá»¥ng cÃ´ng thá»©c chuáº©n hÃ³a Ä‘iá»ƒm.
       - Ãnh xáº¡ phÃ¢n lá»›p Mapping A chuáº©n táº¯c:
         - $0â€“7 \rightarrow \textbf{Unit 1}$
         - $8â€“12 \rightarrow \textbf{Unit 2}$
         - $13â€“17 \rightarrow \textbf{Unit 3}$
         - $18â€“22 \rightarrow \textbf{Unit 4}$
         - $23â€“26 \rightarrow \textbf{Unit 5}$
         - $27â€“30 \rightarrow \textbf{Unit 6}$
     - **LÆ°u Ã½ Ä‘á»“ng bá»™ tÃ i liá»‡u:** *MASTER PLAN: 30 questions = HUMAN-SELECTED DESIGN DECISION. CANONICAL M2 DOCUMENTS: still require formal status synchronization before/with the next approved design update.* KhÃ´ng giáº£ Ä‘á»‹nh canonical `docs/*` Ä‘Ã£ tá»± Ä‘á»™ng cáº­p nháº­t vÃ  khÃ´ng táº¡o ADR má»›i trong task nÃ y.
   - **D7:** Háº¡n má»©c lÃ m láº¡i cÃ³ kiá»ƒm soÃ¡t `max(1, floor(N * 0.10))` tÃ­nh theo tá»«ng lÆ°á»£t lÃ m bÃ i; lÃ m láº¡i Ä‘Ãºng nháº­n tá»‘i Ä‘a 70% Ä‘iá»ƒm; hoÃ n thÃ nh bÃ i há»c khÃ´ng phá»¥ thuá»™c tráº§n Ä‘iá»ƒm 80%.
   - **D8:** Ã”n táº­p ngáº¯t quÃ£ng (SRS) tuÃ¢n thá»§ Policy B táº¥t Ä‘á»‹nh `[1, 3, 7, 14, 30]` ngÃ y; Ä‘á»™c láº­p hoÃ n toÃ n vá»›i AI; cháº¡y qua RPC cÆ¡ sá»Ÿ dá»¯ liá»‡u `record_review`; quy Æ°á»›c `stage = 0` lÃ  tháº» má»›i, `stage = 1..5` á»©ng vá»›i cÃ¡c khoáº£ng cÃ¡ch ngÃ y.
   - **D9:** Chuá»—i ngÃ y há»c liÃªn tá»¥c (Streak) tÃ­nh theo ngÃ y lá»‹ch cá»¥c bá»™ thuá»™c mÃºi giá» IANA cá»§a há»c viÃªn; bá» lá»¡ 1 ngÃ y Ä‘áº·t láº¡i vá» 1; khÃ´ng cÃ³ tÃ­nh nÄƒng cá»©u chuá»—i (freeze) trong MVP.
4. **Báº¥t Biáº¿n NÄƒng Lá»±c & Tiáº¿n Äá»™:**
   $$\text{LearningProgress} \ne \text{Proficiency} \ne \text{Mastery} \ne \text{LevelReadiness}$$
   - Kháº£o sÃ¡t tá»± khai (Self-report) $\rightarrow$ tráº¡ng thÃ¡i `UNVERIFIED`.
   - Chuá»—i chuyá»ƒn hÃ³a nÄƒng lá»±c kiá»ƒm Ä‘á»‹nh: $\text{Diagnostic} \rightarrow \text{AssessmentResult (Báº¥t biáº¿n)} \rightarrow \text{SkillProfile} \rightarrow \text{verifiedProficiency} \rightarrow \text{curriculumStartingPoint}$.
5. **Äiá»u Kiá»‡n Hiá»ƒn Thá»‹ ÄÆ¡n Vá»‹ Há»c (Unit 4/4 Published Rule):** Má»™t Unit chá»‰ hiá»ƒn thá»‹ cho há»c viÃªn khi vÃ  chá»‰ khi toÃ n bá»™ 4 bÃ i há»c cáº¥u thÃ nh trong Unit Ä‘Ã³ Ä‘á»u Ä‘Ã£ á»Ÿ tráº¡ng thÃ¡i `PUBLISHED`.
   - **RÃ ng buá»™c an ninh má»¥c tiÃªu (TARGET SECURITY REQUIREMENT):** Há»‡ thá»‘ng báº¯t buá»™c pháº£i báº£o Ä‘áº£m há»c viÃªn truy cáº­p trá»±c tiáº¿p báº±ng ID bÃ i há»c khÃ´ng thá»ƒ vÆ°á»£t qua quy táº¯c xuáº¥t báº£n cá»§a Unit (`learner direct access cannot bypass Unit publication rule`). Äiá»u kiá»‡n nÃ y báº¯t buá»™c pháº£i Ä‘Æ°á»£c cÆ°á»¡ng cháº¿ táº¡i ranh giá»›i cÃ³ tháº©m quyá»n phÃ¢n quyá»n (authorization-capable boundary: RLS helper / database view / server-side domain authorization táº¡i BFF), tuyá»‡t Ä‘á»‘i khÃ´ng chá»‰ áº©n nÃºt trÃªn giao diá»‡n ngÆ°á»i dÃ¹ng (`UI hiding != authorization`).
   - **Tráº¡ng thÃ¡i triá»ƒn khai:** `TARGET SECURITY REQUIREMENT`; `Implementation + negative verification = M3.2 / M3.3`. KhÃ´ng kháº³ng Ä‘á»‹nh cÆ¡ sá»Ÿ dá»¯ liá»‡u hiá»‡n táº¡i Ä‘Ã£ cÆ°á»¡ng cháº¿ Ä‘iá»u kiá»‡n nÃ y.
6. **Ranh Giá»›i An Ninh & PhÃ¢n Äá»‹nh Tráº¡ng ThÃ¡i AI:**
   - 6 Ranh giá»›i (B1: Learner Web, B2: Admin Web, B3: Supabase RLS, B4: Privileged Service Role, B5: AI Server, B6: Audit Store).
   - Kiá»ƒm tra táº§ng á»©ng dá»¥ng (App AuthZ) khÃ´ng bao giá» thay tháº¿ RLS; RLS lÃ  báº¯t buá»™c táº¡i database.
   - CÃ¡c thÃ nh pháº§n vÃ  ranh giá»›i liÃªn quan AI (`COMP-DOM-08`, `COMP-EXT-02`, Zone 4, B5) lÃ  tham chiáº¿u kiáº¿n trÃºc lá»‹ch sá»­/nÄƒng lá»±c há»— trá»£ káº¿ thá»«a tá»« thiáº¿t káº¿ M2, **HOÃ€N TOÃ€N NGOÃ€I PHáº M VI TRIá»‚N KHAI Cá»¦A PHASE 2**. KhÃ´ng cÃ³ báº¥t ká»³ workstream, API endpoint hay kiá»ƒm thá»­ AI nÃ o Ä‘Æ°á»£c thá»±c thi trong Phase 2.
   - Há»£p Ä‘á»“ng `docs/03-api-contract.md` duy trÃ¬ nguyÃªn váº¹n tÃ­nh cháº¥t chá»‰ Ä‘á»c (read-only) vÃ  100% byte-identical.
7. **Ranh Giá»›i Nghiá»‡p Vá»¥ Viáº¿t TÃ¬nh Huá»‘ng (`P1-FR-007` / Scenario Writing with GEC):**
   - YÃªu cáº§u `P1-FR-007 / Scenario Writing with GEC` Ä‘Æ°á»£c báº£o toÃ n nhÆ° má»™t yÃªu cáº§u chuáº©n táº¯c vÃ  tham chiáº¿u thiáº¿t káº¿ phá»¥c vá»¥ truy váº¿t (CANONICAL REQUIREMENT RETAINED â€” OUT OF PHASE 2 IMPLEMENTATION SCOPE). Trong Phase 2, khÃ´ng cÃ³ káº¿ hoáº¡ch hay tiÃªu chÃ­ nghiá»‡m thu nÃ o liÃªn quan Ä‘áº¿n viá»‡c triá»ƒn khai AI/GEC. Tuyá»‡t Ä‘á»‘i khÃ´ng tá»± Ã½ phÃ¡t minh thuáº­t toÃ¡n sá»­a lá»—i ngá»¯ phÃ¡p báº±ng luáº­t (rule-based grammar correction) hoáº·c cháº¿ tÃ¡c giáº£i thuáº­t má»›i thay tháº¿ GEC khi chÆ°a cÃ³ quyáº¿t Ä‘á»‹nh thiáº¿t káº¿ Ä‘Æ°á»£c phÃª duyá»‡t.
8. **Bá»‘i Cáº£nh XÃ¡c Thá»±c & Lan Truyá»n Äá»‹nh Danh (Auth Context & Actor Identity Propagation):**
   - Äá»™t biáº¿n dá»¯ liá»‡u thÃ´ng thÆ°á»ng: Ä‘i qua BFF vÃ  sá»­ dá»¥ng JWT cá»§a ngÆ°á»i dÃ¹ng Ä‘á»ƒ `auth.uid()` pháº£n Ã¡nh chÃ­nh xÃ¡c danh tÃ­nh ngÆ°á»i thá»±c hiá»‡n.
   - TÃ¡c vá»¥ Ä‘áº·c quyá»n backend báº¯t buá»™c dÃ¹ng `service_role`: do `auth.uid()` khi Ä‘Ã³ mang giÃ¡ trá»‹ rá»—ng/service_role, lá»i gá»i database/RPC báº¯t buá»™c pháº£i truyá»n tÆ°á»ng minh Ä‘á»‹nh danh ngÆ°á»i thá»±c hiá»‡n (explicit actor identity: vÃ­ dá»¥ tham sá»‘ `p_actor_id UUID`) vÃ o trigger vÃ  sá»• cÃ¡i `audit_logs`. Tuyá»‡t Ä‘á»‘i khÃ´ng Ä‘Ã¡nh Ä‘á»“ng `service_role` vá»›i `auth.uid()`.
   - **PhÃ¢n loáº¡i tráº¡ng thÃ¡i:** ÄÃ¢y lÃ  `TARGET SECURITY DESIGN`. Káº¿ hoáº¡ch triá»ƒn khai mÃ£ nguá»“n táº¡i `M3.2`, báº±ng chá»©ng báº£o máº­t (`SECURITY PROOF`) sáº½ Ä‘Æ°á»£c xÃ¡c nháº­n thÃ´ng qua bá»™ kiá»ƒm thá»­ phá»§ Ä‘á»‹nh (`negative tests`). Tuyá»‡t Ä‘á»‘i khÃ´ng gá»i Ä‘Ã¢y lÃ  má»™t báº¥t biáº¿n báº£o máº­t Ä‘Ã£ Ä‘Æ°á»£c chá»©ng minh á»Ÿ runtime hiá»‡n táº¡i.
9. **MÃ´ HÃ¬nh Vai TrÃ² ÄÆ¡n (Single-Role Model) & Kiá»ƒm Äá»‹nh SoD Chuáº©n Táº¯c:**
   - Báº£ng `profiles` Ã¡p dá»¥ng mÃ´ hÃ¬nh vai trÃ² Ä‘Æ¡n (single role: `role Role` vá»›i 1 giÃ¡ trá»‹ duy nháº¥t trÃªn má»—i tÃ i khoáº£n). Do má»—i ngÆ°á»i dÃ¹ng chá»‰ cÃ³ má»™t vai trÃ² duy nháº¥t, Creator vÃ  Moderator lÃ  hai danh tÃ­nh hoÃ n toÃ n tÃ¡ch biá»‡t.
   - Kiá»ƒm thá»­ phÃ¢n tÃ¡ch nhiá»‡m vá»¥ (SoD) trong Phase 2 lÃ  kiá»ƒm thá»­ tá»« chá»‘i phÃ¢n quyá»n (authorization denial):
     - **Creator cáº¥m phÃª duyá»‡t bÃ i há»c:** Creator cá»‘ tÃ¬nh gá»i lá»‡nh phÃª duyá»‡t $\rightarrow$ Bá»‹ tá»« chá»‘i vá»›i lá»—i phÃ¢n quyá»n chuáº©n táº¯c `403 Forbidden` / `ROLE_UNAUTHORIZED` (khÃ´ng tá»“n táº¡i ca "self-review" vÃ¬ má»™t tÃ i khoáº£n khÃ´ng thá»ƒ vá»«a lÃ  Creator vá»«a lÃ  Moderator).
     - **Moderator cáº¥m xuáº¥t báº£n bÃ i há»c:** Moderator gá»i lá»‡nh xuáº¥t báº£n $\rightarrow$ Bá»‹ tá»« chá»‘i vá»›i lá»—i `403 Forbidden`.
     - **Manager cáº¥m phÃª duyá»‡t bÃ i há»c:** Manager gá»i lá»‡nh duyá»‡t bÃ i $\rightarrow$ Bá»‹ tá»« chá»‘i vá»›i lá»—i `403 Forbidden`.
     - **Admin xuáº¥t báº£n kháº©n cáº¥p cÃ³ Ä‘iá»u kiá»‡n:** Chá»‰ Ä‘Æ°á»£c xuáº¥t báº£n bÃ i Ä‘Ã£ `APPROVED` vÃ  báº¯t buá»™c cÃ³ lÃ½ do giáº£i trÃ¬nh ghi vÃ o `audit_logs`.
10. **Báº£o Vá»‡ Thuá»™c TÃ­nh Há»“ SÆ¡ Há»c ViÃªn (Profile Security & Privilege Guard):**
    - **CURRENT APPLIED (Migration 2):** Quyá»n UPDATE trÃªn báº£ng `profiles` Ä‘Æ°á»£c kiá»ƒm soÃ¡t nghiÃªm ngáº·t á»Ÿ cáº¥p Ä‘á»™ cá»™t (PostgreSQL Column-Level Grants): há»c viÃªn chá»‰ Ä‘Æ°á»£c phÃ©p sá»­a 6 trÆ°á»ng an toÃ n cÃ¡ nhÃ¢n (`display_name`, `avatar_url`, `ui_locale`, `native_lang_code`, `daily_goal_min`, `timezone`).
    - **TARGET EXTENSION:** Bá»• sung cá»™t `verified_starting_unit INT DEFAULT 1` vÃ  báº£ng `skill_profiles`.
    - CÃ¡c trÆ°á»ng Ä‘áº·c quyá»n gá»“m `role`, `streak_count`, `last_qualifying_activity_date` vÃ  trÆ°á»ng má»›i `verified_starting_unit` báº¯t buá»™c pháº£i do mÃ¡y chá»§ / database kiá»ƒm soÃ¡t, tuyá»‡t Ä‘á»‘i khÃ´ng cáº¥p quyá»n UPDATE trá»±c tiáº¿p cho role Learner/Authenticated, ngÄƒn cháº·n hoÃ n toÃ n gian láº­n cáº¥p Ä‘á»™ hoáº·c chuá»—i há»c táº­p. RiÃªng trÆ°á»ng `longestStreak` náº±m ngoÃ i pháº¡m vi MVP (`OUT OF CURRENT MVP SCOPE / UI-only persona`), khÃ´ng tá»± Ã½ thÃªm cá»™t váº­t lÃ½ vÃ o database.
11. **Báº£o Vá»‡ BÃ­ Máº­t Äá» BÃ i & ÄÃ¡p Ãn Cháº¥m Äiá»ƒm (Exercise Answer Security):**
    - NguyÃªn táº¯c: `Learner payload != grading secret`. Client chá»‰ nháº­n ná»™i dung Ä‘á» bÃ i vÃ  danh sÃ¡ch lá»±a chá»n; server/BFF náº¯m giá»¯ bÃ­ máº­t cháº¥m Ä‘iá»ƒm vÃ  logic so khá»›p Ä‘Ã¡p Ã¡n.
    - ÄÃ¡p Ã¡n Ä‘Ãºng (correct answers), regex kiá»ƒm tra, vÃ  bÃ­ máº­t cháº¥m Ä‘iá»ƒm tuyá»‡t Ä‘á»‘i khÃ´ng Ä‘Æ°á»£c gá»­i vá» trong payload cá»§a há»c viÃªn trÆ°á»›c khi ná»™p bÃ i.
    - **PhÃ¢n loáº¡i tráº¡ng thÃ¡i:** ÄÃ¢y lÃ  `TARGET DESIGN REQUIREMENT`. Hiá»‡n táº¡i mÃ£ nguá»“n chÆ°a triá»ƒn khai hoÃ n táº¥t (`NOT YET IMPLEMENTED`), sáº½ Ä‘Æ°á»£c láº­p trÃ¬nh vÃ  xÃ¡c minh táº¡i M3.1/M3.3.
12. **Äáº·c Táº£ VÃ²ng Äá»i NhÃ¢n Báº£n Báº£n Tháº£o (Clone-to-Draft Lifecycle Semantic):**
    - Quy trÃ¬nh chuáº©n táº¯c: `Published v1 â†’ Clone â†’ Draft v2 (supersedes_id = v1.id) â†’ In Review â†’ Approved â†’ Publish v2 â†’ v1 archived`.
    - *Quy táº¯c nguyÃªn tá»­:* Publish v2 and retire v1 must be handled consistently/atomically. Target implementation requires an atomic mechanism to publish v2 and retire v1 consistently. The exact DB/application mechanism is to be verified during M3.1/M3.6 implementation.
    - *RÃ ng buá»™c báº£n tháº£o duy nháº¥t:* Target design dá»± kiáº¿n quy Ä‘á»‹nh má»—i bÃ i há»c chá»‰ cÃ³ tá»‘i Ä‘a 1 báº£n tháº£o/báº£n duyá»‡t Ä‘ang hoáº¡t Ä‘á»™ng (Unique active revision constraint â€” Ä‘Ã¢y lÃ  `TARGET DESIGN`, hiá»‡n táº¡i DB thá»±c táº¿ chÆ°a cÃ³ rÃ ng buá»™c nÃ y).
13. **Ngá»¯ NghÄ©a Tráº¡ng ThÃ¡i ÄÃ¡nh GiÃ¡ & Äiá»ƒm Xuáº¥t PhÃ¡t (Placement / Skip Semantics):**
    - PhÃ¢n Ä‘á»‹nh rÃµ 3 tráº¡ng thÃ¡i ngá»¯ nghÄ©a trong há»‡ thá»‘ng:
      - `NOT_DECIDED`: Há»c viÃªn má»›i Ä‘Äƒng kÃ½, chÆ°a thá»±c hiá»‡n bÃ i kiá»ƒm tra cháº©n Ä‘oÃ¡n vÃ  chÆ°a chá»n bá» qua.
      - `SKIPPED / UNVERIFIED`: Há»c viÃªn chá»n Bá» qua (Skip), Ä‘Æ°á»£c gÃ¡n xuáº¥t phÃ¡t Ä‘iá»ƒm Unit 1, tráº¡ng thÃ¡i nÄƒng lá»±c chÆ°a kiá»ƒm Ä‘á»‹nh (`UNVERIFIED`), tuyá»‡t Ä‘á»‘i khÃ´ng táº¡o báº£n ghi `assessment_results` hay `skill_profiles`.
      - `DIAGNOSTIC / VERIFIED`: Há»c viÃªn hoÃ n thÃ nh bÃ i cháº©n Ä‘oÃ¡n 30 cÃ¢u, táº¡o báº£n ghi `AssessmentResult` báº¥t biáº¿n vÃ  cáº­p nháº­t `SkillProfile` cÃ¹ng xuáº¥t phÃ¡t Ä‘iá»ƒm Ä‘Ã£ kiá»ƒm Ä‘á»‹nh.
    - *Quy Ä‘á»‹nh triá»ƒn khai:* *The physical representation of placement status must be finalized before schema implementation in M3.1.*
    - *Quy trÃ¬nh thi láº¡i (Retake):* Táº¡o báº£n ghi `AssessmentResult` báº¥t biáº¿n má»›i, cáº­p nháº­t há»“ sÆ¡ nÄƒng lá»±c nhÆ°ng báº£o lÆ°u toÃ n bá»™ tiáº¿n Ä‘á»™ há»c táº­p cÃ¡c bÃ i há»c Ä‘Ã£ hoÃ n thÃ nh trÆ°á»›c Ä‘Ã³.
14. **Tráº¡ng ThÃ¡i PhiÃªn LÃ m Láº¡i (Retry State) & Há»“i ChiÃªu Nháº£y CÃ³c (Jump Cooldown):**
    - *Háº¡n má»©c lÃ m láº¡i cÃ³ kiá»ƒm soÃ¡t (D7):* *Persistent attempt/retry state is required for server-enforced D7 behavior. Its physical representation must be finalized in M3.1 before implementation.* M3.1 deliverable báº¯t buá»™c bao gá»“m quyáº¿t Ä‘á»‹nh biá»ƒu diá»…n tráº¡ng thÃ¡i attempt/retry state nÃ y (khÃ´ng tá»± Ã½ bá»‹a tÃªn báº£ng khi chÆ°a chá»‘t).
    - *Há»“i chiÃªu nháº£y cÃ³c (D5):* `TARGET DESIGN: server-authoritative cooldown state`. Biá»ƒu diá»…n váº­t lÃ½ cá»¥ thá»ƒ (*Physical state representation*) Ä‘Æ°á»£c chá»‘t trong M3.1 trÆ°á»›c khi báº¯t Ä‘áº§u láº­p trÃ¬nh M3.5.
15. **Quy Chuáº©n Ã‚m Thanh, Nháº¯c Nhá»Ÿ Há»c Táº­p & PhÃ¢n TrÃ¡ch Operations Staff:**
    - *ÄÆ°á»ng á»‘ng Ã¢m thanh (Audio Pipeline):* Lá»±a chá»n duy nháº¥t: Supabase Storage (bucket `lingora-media`). ToÃ n bá»™ bÃ i táº­p ká»¹ nÄƒng Listening sá»­ dá»¥ng cÃ¡c tá»‡p Ã¢m thanh MP3 do con ngÆ°á»i chuáº©n bá»‹ sáºµn (pre-produced MP3 assets) thÃ´ng qua quy trÃ¬nh: Creator táº£i lÃªn (`upload`) $\rightarrow$ Moderator kiá»ƒm duyá»‡t (`moderation`) $\rightarrow$ Há»c viÃªn nghe bÃ i táº­p (`learner playback`). Tuyá»‡t Ä‘á»‘i khÃ´ng sá»­ dá»¥ng Text-to-Speech (TTS) thá»i gian thá»±c vÃ  khÃ´ng sá»­ dá»¥ng AI trong Phase 2.
    - *Nháº¯c nhá»Ÿ há»c táº­p (Reminders per ADR-006 / ADR-007 Option 6d):* Duy trÃ¬ yÃªu cáº§u chuáº©n táº¯c `P1-FR-015` á»Ÿ cáº¥p Ä‘á»™ giao diá»‡n há»c viÃªn thÃ´ng qua **nháº¯c nhá»Ÿ ná»™i á»©ng dá»¥ng (In-app reminder)**: hiá»ƒn thá»‹ banner kiÃªn Ä‘á»‹nh vÃ  huy hiá»‡u (badge) thÃ´ng bÃ¡o khi há»c viÃªn truy cáº­p á»©ng dá»¥ng náº¿u chÆ°a hoÃ n thÃ nh má»¥c tiÃªu ngÃ y trong khung giá» Ä‘Ã£ chá»n; lÆ°u trá»¯ cá»¥c bá»™ phÃ­a client Ä‘i kÃ¨m `Profile.dailyGoalMin`, tuyá»‡t Ä‘á»‘i khÃ´ng táº¡o báº£ng má»›i, khÃ´ng dÃ¹ng scheduler ná»n hay background service worker. CÆ¡ cháº¿ gá»­i thÃ´ng bÃ¡o ná»n qua máº¡ng (Web Push / Email scheduler / background delivery) tiáº¿p tá»¥c á»Ÿ tráº¡ng thÃ¡i hoÃ£n láº¡i (**DEFERRED**) theo Ä‘Ãºng quyáº¿t Ä‘á»‹nh kiáº¿n trÃºc chuáº©n táº¯c `ADR-007` vÃ  khÃ´ng thuá»™c pháº¡m vi triá»ƒn khai cá»§a Phase 2.
    - *NhÃ¢n sá»± váº­n hÃ nh (Operations Staff):* PhÃ¢n Ä‘á»‹nh rÃµ `UC-14 business scope` (Ä‘iá»u phá»‘i vÃ  xá»­ lÃ½ há»— trá»£ ngÆ°á»i dÃ¹ng theo ca sá»­ dá»¥ng UC-14 qua giao diá»‡n vÃ  API route B2 $\rightarrow$ B3) thuá»™c pháº¡m vi triá»ƒn khai Phase 2; trong khi `ticket persistence implementation` (lÆ°á»£c Ä‘á»“ cÆ¡ sá»Ÿ dá»¯ liá»‡u quáº£n lÃ½ ticket Ä‘a táº§ng nÃ¢ng cao) lÃ  tÃ­nh nÄƒng má»Ÿ rá»™ng tÆ°Æ¡ng lai (`FUTURE_EXTENSION`). Operations Staff khÃ´ng cÃ³ quyá»n xem nháº­t kÃ½ kiá»ƒm toÃ¡n `audit_logs`.

### 2.2. NguyÃªn Táº¯c Giáº£i Quyáº¿t Xung Äá»™t TÃ i Liá»‡u (Conflict Resolution)
Khi phÃ¡t sinh sá»± khÃ´ng nháº¥t quÃ¡n giá»¯a cÃ¡c tÃ i liá»‡u cÅ© vÃ  tÃ i liá»‡u má»›i trong kho lÆ°u trá»¯, cÃ¡c ká»¹ sÆ° triá»ƒn khai báº¯t buá»™c pháº£i Ã¡p dá»¥ng quy táº¯c thá»© báº­c Æ°u tiÃªn sau:
1. **Æ¯u tiÃªn tá»‘i cao:** CÃ¡c biÃªn báº£n nghiá»‡m thu vÃ  quyáº¿t Ä‘á»‹nh quáº£n trá»‹ má»›i nháº¥t (`ADR-029`, `ADR-028`, `ADR-026`, `ADR-014`).
2. **Æ¯u tiÃªn thá»© hai:** Báº£n Ä‘áº·c táº£ bÃ n giao thiáº¿t káº¿ sang triá»ƒn khai `docs/phase-1-m2-6-design-handoff.md`.
3. **Æ¯u tiÃªn thá»© ba:** BÃ¡o cÃ¡o kiá»ƒm Ä‘á»‹nh thiáº¿t káº¿ tá»•ng thá»ƒ `docs/phase-1-m2-5-design-validation.md` (Artifact #20).
4. **Æ¯u tiÃªn thá»© tÆ°:** CÃ¡c tÃ i liá»‡u thiáº¿t káº¿ kiáº¿n trÃºc chuáº©n táº¯c M2.1â€“M2.4 (`docs/phase-1-m2-4-architecture-security.md`, `docs/phase-1-m2-3-sequence-api-service-boundary.md`, `docs/phase-1-m2-2-behavior-uc-activity-state.md`, `docs/phase-1-m2-1-domain-and-logical-data-foundation.md`).
5. **TÃ i liá»‡u tham chiáº¿u cÅ©:** Má»i thÃ´ng tin trong `docs/00` Ä‘áº¿n `docs/07` xung Ä‘á»™t vá»›i M2.6 Ä‘á»u bá»‹ coi lÃ  thÃ´ng tin lá»‹ch sá»­ Ä‘Ã£ bá»‹ ghi Ä‘Ã¨. Má»i mÃ¢u thuáº«n pháº£i Ä‘Æ°á»£c ghi nháº­n vÃ o `logs/decision-log.md` theo máº«u ADR trÆ°á»›c khi thá»±c hiá»‡n code.

---

## 3. PHÃ‚N RÃƒ Há»† THá»NG Má»¤C TIÃŠU THEO THÃ€NH PHáº¦N KIáº¾N TRÃšC

Há»‡ thá»‘ng triá»ƒn khai Phase 2 Ä‘Æ°á»£c phÃ¢n rÃ£ thÃ nh **9 nhÃ³m phÃ¢n há»‡ chá»©c nÄƒng**, Ã¡nh xáº¡ trá»±c tiáº¿p vÃ  Ä‘áº§y Ä‘á»§ vÃ o **19 thÃ nh pháº§n kiáº¿n trÃºc chuáº©n táº¯c (Canonical Components)** Ä‘Ã£ Ä‘Æ°á»£c phÃª chuáº©n táº¡i M2.4:

```
+----------------------------------------------------------------------------------------------------+
|                                    19 CANONICAL COMPONENTS IN PHASE 2                              |
+----------------------------------------------------------------------------------------------------+
| Táº¦NG TRÃŒNH DIá»„N (Presentation Layer):                                                              |
|   - COMP-PRES-01: Learner Web Client (Next.js 15 SPA/SSR Pages in lingora-web)                     |
|   - COMP-PRES-02: Admin & Moderation Web Client (Next.js 15 Admin Portal in lingora-admin)         |
+----------------------------------------------------------------------------------------------------+
| Táº¦NG ÄIá»€U PHá»I á»¨NG Dá»¤NG (Application / BFF Layer):                                                 |
|   - COMP-APP-01: Learner Application Coordinator & BFF API Handlers (Next.js Route Handlers)       |
|   - COMP-APP-02: Admin Application Coordinator & Server Actions (Next.js Server Actions)           |
+----------------------------------------------------------------------------------------------------+
| Táº¦NG NGHIá»†P Vá»¤ Cá»T LÃ•I (Core Domain Layer):                                                        |
|   - COMP-DOM-01: Auth & Identity Domain Service (Session, Roles & Profiles)                        |
|   - COMP-DOM-02: Curriculum & Progression Domain Service (Courses, Units, Lessons & Streak)        |
|   - COMP-DOM-03: Assessment & Diagnostic Domain Service (Placement Test, Mapping A, Jump)          |
|   - COMP-DOM-04: Spaced Repetition (SRS) Scheduling Domain Service (Policy B Intervals)            |
|   - COMP-DOM-05: Lesson Execution & Controlled Retry Domain Service (Unified Exercise, 70% Credit) |
|   - COMP-DOM-06: Content Lifecycle & Moderation Domain Service (6 States, SoD Rules, Clone-to-Draft)|
|   - COMP-DOM-07: Admin Governance & Security Audit Domain Service (Emergency Operations & Audit)   |
|   - COMP-DOM-08: AI Integration & Proxy Domain Service [OUT OF CURRENT PHASE 2 IMPLEMENTATION SCOPE]|
+----------------------------------------------------------------------------------------------------+
| Táº¦NG Háº  Táº¦NG Dá»® LIá»†U & AN NINH (Infrastructure Layer):                                             |
|   - COMP-INFRA-01: PostgreSQL Relational Database Engine (Supabase Hosted)                         |
|   - COMP-INFRA-02: Row Level Security (RLS) Policy Engine (PostgreSQL Security Core)               |
|   - COMP-INFRA-03: Stored Procedure / RPC Execution Engine (Deterministic Functions: record_review)|
|   - COMP-INFRA-04: Encrypted Object Media Storage Engine (Supabase Storage: Media & Avatars)       |
|   - COMP-INFRA-05: Immutable Security Audit Log Store (Append-Only audit_logs Table)               |
+----------------------------------------------------------------------------------------------------+
| Táº¦NG Dá»ŠCH Vá»¤ NGOáº I VI (External Services Layer):                                                   |
|   - COMP-EXT-01: Supabase GoTrue Authentication Provider (OAuth & JWT Issuer)                      |
|   - COMP-EXT-02: Stateless AI Compute Service [OUT OF CURRENT PHASE 2 IMPLEMENTATION SCOPE]       |
+----------------------------------------------------------------------------------------------------+
```

### 3.1. NhÃ³m Ná»n Táº£ng CÆ¡ Sá»Ÿ Dá»¯ Liá»‡u (Foundation)
- **ThÃ nh pháº§n sá»Ÿ há»¯u:** `COMP-INFRA-01` (Postgres DB), `COMP-INFRA-04` (Storage), `COMP-INFRA-05` (Audit Store).
- **Pháº¡m vi triá»ƒn khai:** Quáº£n lÃ½ vÃ²ng Ä‘á»i lÆ°á»£c Ä‘á»“ dá»¯ liá»‡u qua Prisma vÃ  Supabase CLI; triá»ƒn khai cÃ¡c báº£ng ná»n táº£ng, táº¡o storage buckets cÃ³ phÃ¢n quyá»n, náº¡p dá»¯ liá»‡u máº§m giÃ¡o trÃ¬nh chuáº©n táº¯c tiáº¿ng Anh A1.

### 3.2. NhÃ³m XÃ¡c Thá»±c & PhÃ¢n Quyá»n (Authentication & Authorization)
- **ThÃ nh pháº§n sá»Ÿ há»¯u:** `COMP-EXT-01` (GoTrue), `COMP-APP-01/02` (BFF Auth Middleware), `COMP-DOM-01` (Identity Service), `COMP-INFRA-02` (RLS Policy Engine).
- **Pháº¡m vi triá»ƒn khai:** XÃ¡c thá»±c phiÃªn lÃ m viá»‡c qua HttpOnly cookie; cáº¥p phÃ¡t vÃ  kiá»ƒm tra JWT; chuyá»ƒn Ä‘á»•i mÃ´ hÃ¬nh 2 vai trÃ² sang 6 vai trÃ² chuáº©n táº¯c; thiáº¿t láº­p chÃ­nh sÃ¡ch RLS kÃ©p Ä‘á»™c láº­p trÃªn toÃ n bá»™ cÃ¡c báº£ng; láº­p trÃ¬nh cÃ¡c trigger ngÄƒn cháº·n vi pháº¡m SoD.

### 3.3. NhÃ³m Há»c Táº­p Cá»‘t LÃµi (Learner Core Engine)
- **ThÃ nh pháº§n sá»Ÿ há»¯u:** `COMP-PRES-01` (Learner UI), `COMP-APP-01` (Learner BFF), `COMP-DOM-02` (Curriculum Service), `COMP-DOM-05` (Lesson Execution Service).
- **Pháº¡m vi triá»ƒn khai:** TrÃ¬nh diá»…n cÃ¢y giÃ¡o trÃ¬nh 6 Unit theo Ä‘iá»u kiá»‡n má»Ÿ khÃ³a; giao diá»‡n Ä‘á»c/xem ná»™i dung bÃ i há»c (Lesson Content Viewer) trÆ°á»›c khi lÃ m bÃ i táº­p (tá»« vá»±ng, phiÃªn Ã¢m, giáº£i nghÄ©a tiáº¿ng Viá»‡t, cÃ¢u vÃ­ dá»¥ ngá»¯ cáº£nh, audio chuáº©n tá»« Storage, tÃ³m táº¯t ngá»¯ phÃ¡p bÃ i há»c); trÃ¬nh phÃ¡t bÃ i táº­p tÆ°Æ¡ng tÃ¡c há»— trá»£ 5 dáº¡ng bÃ i táº­p (`MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`); thuáº­t toÃ¡n háº¡n má»©c lÃ m láº¡i cÃ³ kiá»ƒm soÃ¡t `max(1, floor(N * 0.10))` báº£o lÆ°u Ä‘iá»ƒm tráº§n 70%; cáº­p nháº­t tiáº¿n Ä‘á»™ há»c táº­p nguyÃªn tá»­ (`UserProgress`).


### 3.4. NhÃ³m ÄÃ¡nh GiÃ¡ NÄƒng Lá»±c (Assessment & Progression)
- **ThÃ nh pháº§n sá»Ÿ há»¯u:** `COMP-DOM-03` (Assessment Service), `COMP-APP-01` (Assessment BFF).
- **Pháº¡m vi triá»ƒn khai:** PhiÃªn thi cháº©n Ä‘oÃ¡n nÄƒng lá»±c Ä‘áº§u vÃ o (30 cÃ¢u há»i, 1 Ä‘iá»ƒm thÃ´/cÃ¢u, raw score 0â€“30); thuáº­t toÃ¡n Ã¡nh xáº¡ Ä‘iá»ƒm thÃ´ 0â€“30 ra Unit 1â€“6 theo Mapping A; nhÃ¡nh Skip (vÃ o tháº³ng Unit 1 vá»›i tráº¡ng thÃ¡i `UNVERIFIED`, 0 AssessmentResult, 0 SkillProfile); tÃ­nh nÄƒng thi láº¡i (Retake) táº¡o báº£n ghi `AssessmentResult` báº¥t biáº¿n má»›i vÃ  cáº­p nháº­t `SkillProfile`.

### 3.5. NhÃ³m TrÃ­ Tuá»‡ Há»c Táº­p (Learning Intelligence: Jump, Retry, SRS, Streak)
- **ThÃ nh pháº§n sá»Ÿ há»¯u:** `COMP-DOM-04` (SRS Service), `COMP-DOM-02` (Streak & Progression), `COMP-INFRA-03` (RPC Engine).
- **Pháº¡m vi triá»ƒn khai:** Thá»­ thÃ¡ch nháº£y cÃ³c (Jump) cho Ä‘Æ¡n vá»‹ liá»n ká» vá»›i ngÆ°á»¡ng Ä‘áº¡t â‰¥95%, khÃ³a há»“i chiÃªu 24h khi trÆ°á»£t, gÃ¡n nhÃ£n `SKIPPED_BY_JUMP` (`by_jump = true`) vÃ  khÃ´ng tÃ­nh hoÃ n thÃ nh Unit; thuáº­t toÃ¡n SRS táº¥t Ä‘á»‹nh Policy B `[1, 3, 7, 14, 30]` ngÃ y thá»±c thi qua RPC `record_review`; bá»™ tÃ­nh toÃ¡n Streak theo ngÃ y lá»‹ch cá»¥c bá»™ mÃºi giá» IANA (`Asia/Ho_Chi_Minh`), tá»± Ä‘á»™ng Ä‘áº·t láº¡i vá» 1 khi bá» lá»¡ ngÃ y há»c.

### 3.6. NhÃ³m Quáº£n Trá»‹ & Kiá»ƒm Duyá»‡t Ná»™i Dung (Content Management & Governance)
- **ThÃ nh pháº§n sá»Ÿ há»¯u:** `COMP-PRES-02` (Admin Portal), `COMP-APP-02` (Admin Server Actions), `COMP-DOM-06` (Content Lifecycle Service).
- **Pháº¡m vi triá»ƒn khai:** Giao diá»‡n phÃ¢n cÃ´ng biÃªn soáº¡n cá»§a Manager; khÃ´ng gian soáº¡n bÃ i cá»§a Creator; hÃ ng Ä‘á»£i kiá»ƒm duyá»‡t Ä‘á»™c láº­p cá»§a Moderator; quy trÃ¬nh xuáº¥t báº£n chÃ­nh thá»©c cá»§a Manager; cÆ¡ cháº¿ nhÃ¢n báº£n báº£n tháº£o báº¥t biáº¿n (Clone-to-Draft v2 qua `supersedes_id`); quy táº¯c hiá»ƒn thá»‹ Unit 4/4 Published; chá»©c nÄƒng xuáº¥t báº£n kháº©n cáº¥p cá»§a Admin kÃ¨m lÃ½ do giáº£i trÃ¬nh báº¯t buá»™c vÃ  phÃ¡t tháº£i sá»± kiá»‡n kiá»ƒm toÃ¡n `CONTENT_EMERGENCY_PUB`.

### 3.7. NhÃ³m Tiá»‡n Ãch DÃ¹ng Chung & Há»— Trá»£ á»¨ng Dá»¥ng (Cross-Cutting Supporting Infrastructure)
- **ThÃ nh pháº§n sá»Ÿ há»¯u:** `COMP-APP-01` (BFF Coordinator), `COMP-DOM-01` (Identity & Profile Helpers), `COMP-PRES-01/02` (UI Layout & Locales).
- **Pháº¡m vi triá»ƒn khai:**
  1. Triá»ƒn khai hÃ nh vi song ngá»¯ giao diá»‡n theo Ä‘Ãºng yÃªu cáº§u chuáº©n táº¯c `P1-FR-010` / `YC-EXT-06` (Next.js Locale Catalog `vi`/`en`, fallback an toÃ n `vi`).
  2. CÃ¡c tiá»‡n Ã­ch Ä‘iá»u phá»‘i dÃ¹ng chung táº§ng Client/BFF (chuáº©n hÃ³a Ä‘á»‹nh dáº¡ng pháº£n há»“i vÃ  mÃ£ lá»—i API framework-neutral) há»— trá»£ cho viá»‡c tÃ­ch há»£p há»‡ thá»‘ng M3.8.
  3. Má»i tiá»‡n Ã­ch ká»¹ thuáº­t chi tiáº¿t khÃ¡c (náº¿u phÃ¡t sinh tá»« phá»¥ thuá»™c thá»±c thi) sáº½ Ä‘Æ°á»£c xÃ¡c Ä‘á»‹nh cá»¥ thá»ƒ theo tráº¡ng thÃ¡i `TBD / TO BE DETERMINED FROM IMPLEMENTATION DEPENDENCIES` táº¡i káº¿ hoáº¡ch chi tiáº¿t cá»§a M3.7; tuyá»‡t Ä‘á»‘i khÃ´ng tá»± táº¡o requirement má»›i.
- **Ranh giá»›i kiáº¿n trÃºc:** `COMP-DOM-08` (AI Proxy) vÃ  `COMP-EXT-02` (FastAPI AI) lÃ  cÃ¡c thÃ nh pháº§n chuáº©n táº¯c káº¿ thá»«a tá»« thiáº¿t káº¿ M2 nhÆ°ng Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u chÃ­nh thá»©c: **`OUT OF CURRENT PHASE 2 IMPLEMENTATION SCOPE`**. Tuyá»‡t Ä‘á»‘i khÃ´ng láº­p trÃ¬nh mÃ£ nguá»“n, khÃ´ng dá»±ng proxy, khÃ´ng thiáº¿t láº­p circuit breaker vÃ  khÃ´ng triá»ƒn khai endpoint AI trong Phase 2.

### 3.8. NhÃ³m Quáº£n Trá»‹ Há»‡ Thá»‘ng & Kiá»ƒm ToÃ¡n (Administration & Audit)
- **ThÃ nh pháº§n sá»Ÿ há»¯u:** `COMP-DOM-07` (Admin Governance Service), `COMP-INFRA-05` (Audit Store).
- **Pháº¡m vi triá»ƒn khai:** Báº£ng Ä‘iá»u khiá»ƒn quáº£n trá»‹ tÃ i khoáº£n ngÆ°á»i dÃ¹ng; phÃ¢n bá»• vai trÃ²; mÃ n hÃ¬nh tra cá»©u nháº­t kÃ½ kiá»ƒm toÃ¡n há»‡ thá»‘ng an toÃ n há»— trá»£ lá»c theo 11 sá»± kiá»‡n kiá»ƒm toÃ¡n chuáº©n táº¯c; cÆ¡ cháº¿ ghi log báº¥t biáº¿n khÃ´ng thá»ƒ xÃ³a sá»­a.

### 3.9. Ranh Giá»›i Má»Ÿ Rá»™ng TÆ°Æ¡ng Lai (Optional / Future Boundary)
- **CÃ¡c thÃ nh pháº§n/tÃ­nh nÄƒng cÃ¡ch ly khá»i MVP:** Quáº£n lÃ½ nhÃ³m há»c viÃªn & Cohort (`UC-15`), Há»‡ thá»‘ng Ticket há»— trá»£ ngÆ°á»i dÃ¹ng nÃ¢ng cao (`UC-14` má»Ÿ rá»™ng), ThÃ´ng bÃ¡o Ä‘áº©y trÃ¬nh duyá»‡t Web Push (`6a/6b` deferred), ÄÃ³ng bÄƒng chuá»—i há»c táº­p (Streak Freeze), Cáº¥p chá»©ng chá»‰ ngoáº¡i ngá»¯ CEFR. ToÃ n bá»™ cÃ¡c thÃ nh pháº§n nÃ y Ä‘Æ°á»£c Ä‘Ã¡nh dáº¥u `FUTURE_EXTENSION`, tuyá»‡t Ä‘á»‘i khÃ´ng Ä‘Æ°a vÃ o pháº¡m vi nghiá»‡m thu cá»‘t lÃµi cá»§a Phase 2.

---

## 4. THá»¨ Tá»° THá»°C THI & KIáº¾N TRÃšC PHá»¤ THUá»˜C TRIá»‚N KHAI

Thá»© tá»± triá»ƒn khai trong Phase 2 Ä‘Æ°á»£c xÃ¢y dá»±ng dá»±a trÃªn **nguyÃªn táº¯c phá»¥ thuá»™c kiáº¿n trÃºc nghiÃªm ngáº·t (Dependency-Driven Implementation Order)**: Táº§ng dá»¯ liá»‡u vÃ  an ninh pháº£i Ä‘i trÆ°á»›c táº§ng dá»‹ch vá»¥; táº§ng dá»‹ch vá»¥ nghiá»‡p vá»¥ pháº£i Ä‘i trÆ°á»›c giao diá»‡n ngÆ°á»i dÃ¹ng; vÃ  cÃ¡c phÃ¢n há»‡ Ä‘á»™c láº­p Ä‘Æ°á»£c tÃ­ch há»£p theo luá»“ng tá»« dÆ°á»›i lÃªn.

```mermaid
flowchart TD
    M3_1["M3.1: Foundation & DB Migration"] --> M3_2["M3.2: Auth, RBAC, RLS & SoD"]
    M3_2 --> M3_3["M3.3: Learner Core (Lesson & Exercises)"]
    M3_3 --> M3_4["M3.4: Assessment & Progression (Placement)"]
    M3_3 --> M3_5["M3.5: Intelligence (Retry, SRS, Jump, Streak)"]
    M3_2 --> M3_6["M3.6: Content Governance & Moderation"]
    M3_3 --> M3_7["M3.7: Supporting Infrastructure & i18n"]
    M3_4 --> M3_8["M3.8: System Integration & E2E Journey"]
    M3_5 --> M3_8
    M3_6 --> M3_8
    M3_7 --> M3_8
    M3_8 --> M3_9["M3.9: System Hardening & Security Audit"]
    M3_9 --> M3_10["M3.10: Demo Readiness & Report Evidence"]

    style M3_1 fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    style M3_2 fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    style M3_8 fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style M3_10 fill:#dcfce7,stroke:#16a34a,stroke-width:2px
```

### PhÃ¢n TÃ­ch TÃ­nh Há»£p LÃ½ Cá»§a Chuá»—i Phá»¥ Thuá»™c Triá»ƒn Khai:
1. **Táº¡i sao M3.1 (Foundation) báº¯t buá»™c pháº£i lÃ  má»‘c Ä‘áº§u tiÃªn?**
   - KhÃ´ng thá»ƒ láº­p trÃ¬nh phÃ¢n quyá»n hay lÆ°u trá»¯ bÃ i há»c náº¿u lÆ°á»£c Ä‘á»“ báº£ng `units`, `lesson_revisions`, `assessment_results` vÃ  enum 6 vai trÃ² chÆ°a tá»“n táº¡i trong cÆ¡ sá»Ÿ dá»¯ liá»‡u.
2. **Táº¡i sao M3.2 (Auth/RBAC/RLS) pháº£i hoÃ n thÃ nh trÆ°á»›c khi viáº¿t tÃ­nh nÄƒng há»c táº­p?**
   - Theo nguyÃªn táº¯c phÃ²ng vá»‡ theo chiá»u sÃ¢u (Defense-in-depth), má»i báº£ng nghiá»‡p vá»¥ phÃ¡t sinh sau nÃ y báº¯t buá»™c pháº£i chá»‹u sá»± kiá»ƒm soÃ¡t cá»§a RLS ngay tá»« thá»i Ä‘iá»ƒm táº¡o ra. Tuyá»‡t Ä‘á»‘i khÃ´ng viáº¿t code á»©ng dá»¥ng trÃªn má»™t cÆ¡ sá»Ÿ dá»¯ liá»‡u má»Ÿ toang rá»“i má»›i vÃ¡ RLS sau cÃ¹ng.
3. **Táº¡i sao M3.3 (Learner Core) Ä‘i trÆ°á»›c M3.4 (Assessment) vÃ  M3.5 (Intelligence)?**
   - BÃ i kiá»ƒm tra cháº©n Ä‘oÃ¡n (Placement) vÃ  bÃ i kiá»ƒm tra nháº£y cÃ³c (Jump) thá»±c cháº¥t lÃ  cÃ¡c cháº¿ Ä‘á»™ Ä‘Ã¡nh giÃ¡ (`context.mode`) tÃ¡i sá»­ dá»¥ng trÃ¬nh phÃ¡t bÃ i táº­p há»£p nháº¥t (Unified Exercise Engine). Do Ä‘Ã³, bá»™ khung thá»±c thi bÃ i táº­p cá»‘t lÃµi cá»§a M3.3 pháº£i hoÃ n thÃ nh trÆ°á»›c Ä‘á»ƒ lÃ m ná»n táº£ng cho M3.4 vÃ  M3.5.
4. **Táº¡i sao M3.6 (Content Governance) cÃ³ thá»ƒ triá»ƒn khai song song hoáº·c ngay sau M3.2?**
   - PhÃ¢n há»‡ quáº£n trá»‹ ná»™i dung hoáº¡t Ä‘á»™ng Ä‘á»™c láº­p á»Ÿ á»©ng dá»¥ng `lingora-admin`, chá»‰ phá»¥ thuá»™c vÃ o háº¡ táº§ng DB vÃ  mÃ´ hÃ¬nh SoD cá»§a M3.2. Viá»‡c hoÃ n thÃ nh M3.6 giÃºp Ä‘á»™i ngÅ© sá»›m cÃ³ cÃ´ng cá»¥ biÃªn soáº¡n vÃ  xuáº¥t báº£n bÃ i há»c phá»¥c vá»¥ cho viá»‡c tÃ­ch há»£p há»‡ thá»‘ng.
5. **Táº¡i sao M3.7 (Cross-Cutting Supporting Infrastructure) triá»ƒn khai trÆ°á»›c M3.8?**
   - HÃ nh vi Ä‘a ngá»¯ giao diá»‡n theo chuáº©n `P1-FR-010` (`vi`/`en`) vÃ  cÃ¡c tiá»‡n Ã­ch Ä‘iá»u phá»‘i dÃ¹ng chung giá»¯a Client vÃ  BFF cáº§n Ä‘Æ°á»£c kiá»ƒm chá»©ng sáºµn sÃ ng trÆ°á»›c khi tiáº¿n hÃ nh láº¯p ghÃ©p toÃ n diá»‡n trong ká»‹ch báº£n E2E táº¡i M3.8.

---

## 5. Káº¾ HOáº CH TRIá»‚N KHAI CÆ  Sá»ž Dá»® LIá»†U & Lá»˜ TRÃŒNH MIGRATION

Lá»™ trÃ¬nh di chuyá»ƒn dá»¯ liá»‡u trong Phase 2 hiá»‡n thá»±c hÃ³a 8 giai Ä‘oáº¡n thiáº¿t káº¿ Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t táº¡i M2.6 Output 1, tuÃ¢n thá»§ chiáº¿n lÆ°á»£c **Má»Ÿ rá»™ng trÆ°á»›c, Thu háº¹p sau (Expand and Contract Pattern)** Ä‘á»ƒ Ä‘áº£m báº£o an toÃ n dá»¯ liá»‡u tuyá»‡t Ä‘á»‘i vÃ  kháº£ nÄƒng hoÃ n nguyÃªn (Rollback) tá»«ng bÆ°á»›c.

### 5.1. Báº£ng PhÃ¢n Loáº¡i MÃ´ HÃ¬nh Dá»¯ Liá»‡u Má»¥c TiÃªu

| TÃªn Báº£ng Váº­t LÃ½ | TÃ¬nh Tráº¡ng | Thao TÃ¡c LÆ°á»£c Äá»“ (Schema Operation) | Ghi ChÃº Ká»¹ Thuáº­t & Quyáº¿t Äá»‹nh LiÃªn Quan |
|---|---|---|---|
| `languages` | Giá»¯ nguyÃªn | KhÃ´ng thay Ä‘á»•i | LÆ°u trá»¯ mÃ£ ngÃ´n ngá»¯ chuáº©n ISO (`vi`, `en`, `zh`, `ja`, `fr`). |
| `profiles` | Chá»‰nh sá»­a | Bá»• sung cá»™t: `verified_starting_unit INT DEFAULT 1`, nÃ¢ng cáº¥p enum `role` thÃ nh 6 giÃ¡ trá»‹ chuáº©n táº¯c. | Chá»©a con trá» Ä‘á»‡m Ä‘iá»ƒm xuáº¥t phÃ¡t Ä‘Ã£ kiá»ƒm Ä‘á»‹nh (DD-06, DD-10). |
| `courses` | Chá»‰nh sá»­a | Bá»• sung chá»‰ má»¥c tá»‘i Æ°u tÃ¬m kiáº¿m theo ngÃ´n ngá»¯ vÃ  thá»© tá»±. | Giá»¯ nguyÃªn quan há»‡ phÃ¢n cáº¥p giÃ¡o trÃ¬nh. |
| `course_translations` | Giá»¯ nguyÃªn | KhÃ´ng thay Ä‘á»•i | Äa ngÃ´n ngá»¯ tiÃªu Ä‘á» vÃ  mÃ´ táº£ khÃ³a há»c. |
| `units` | Tiá»n kiá»ƒm / Táº¡o má»›i | Preflight DB check: náº¿u báº£ng Ä‘Ã£ tá»“n táº¡i (tá»« Prisma schema Phase 0), thá»±c hiá»‡n Ä‘á»‘i soÃ¡t/reconcile/alter; náº¿u chÆ°a tá»“n táº¡i, táº¡o báº£ng má»›i: `id UUID PK`, `course_id UUID FK`, `order_index INT`, `created_at`. | PhÃ¢n cáº¥p Course -> Unit -> Lesson báº¥t biáº¿n (DD-01). |
| `unit_translations` | Giá»¯ nguyÃªn | Cáº­p nháº­t khÃ³a ngoáº¡i trá» chÃ­nh xÃ¡c vá» báº£ng `units` má»›i. | Äa ngÃ´n ngá»¯ tiÃªu Ä‘á» vÃ  mÃ´ táº£ Ä‘Æ¡n vá»‹ há»c (DD-01). |
| `lessons` | Chá»‰nh sá»­a | ThÃªm cá»™t `unit_id UUID NULL FK(units.id)`. Chuyá»ƒn vai trÃ² thÃ nh thá»±c thá»ƒ quáº£n lÃ½ logic bÃ i há»c á»•n Ä‘á»‹nh. | TÃ¡ch biá»‡t Ä‘á»‹nh danh logic vÃ  phiÃªn báº£n ná»™i dung (DD-01, DD-02). |
| `lesson_translations` | Chá»‰nh sá»­a | Giá»¯ lÃ m báº£n dá»‹ch tiÃªu Ä‘á» bÃ i há»c logic hoáº·c chuyá»ƒn dáº§n sang phiÃªn báº£n. | Äáº£m báº£o tÆ°Æ¡ng thÃ­ch ngÆ°á»£c trong giai Ä‘oáº¡n chuyá»ƒn Ä‘á»•i. |
| `lesson_revisions` | Táº¡o má»›i | Táº¡o báº£ng má»›i: `id UUID PK`, `lesson_id UUID FK`, `version INT`, `supersedes_id UUID NULL FK`, `status VARCHAR(32)`, `content JSONB`, `assigned_creator_id UUID NULL`, `assigned_by_id UUID NULL`, `assignment_deadline TIMESTAMPTZ NULL`, `assignment_brief JSONB NULL`. | Quáº£n lÃ½ vÃ²ng Ä‘á»i 6 tráº¡ng thÃ¡i, phÃ¢n cÃ´ng biÃªn soáº¡n, nhÃ¢n báº£n báº¥t biáº¿n Clone-to-Draft v2 (DD-02, DD-04). |
| `vocabularies` | Giá»¯ nguyÃªn | Bá»• sung chá»‰ má»¥c tra cá»©u chuáº©n hÃ³a. | Kho tá»« vá»±ng trung tÃ¢m cá»§a há»‡ thá»‘ng. |
| `vocabulary_translations`| Giá»¯ nguyÃªn | KhÃ´ng thay Ä‘á»•i | NghÄ©a vÃ  vÃ­ dá»¥ tá»« vá»±ng Ä‘a ngá»¯. |
| `lesson_vocabulary` | Giá»¯ nguyÃªn | KhÃ³a ngoáº¡i cÃ³ thá»ƒ liÃªn káº¿t vá»›i bÃ i há»c logic hoáº·c phiÃªn báº£n. | Danh má»¥c tá»« vá»±ng trá»ng tÃ¢m bÃ i há»c. |
| `exercises` | Chá»‰nh sá»­a | ThÃªm cá»™t `lesson_revision_id UUID NULL FK`, nÃ¢ng cáº¥p enum `ExerciseType` (+`LISTENING`, +`GRAMMAR`), chuáº©n hÃ³a JSON schema `payload`. | MÃ´ hÃ¬nh bÃ i táº­p há»£p nháº¥t (Unified Exercise D4, DD-05). |
| `user_progress` | Chá»‰nh sá»­a | Bá»• sung cá» `by_jump BOOLEAN DEFAULT FALSE`, thÃªm tráº¡ng thÃ¡i `LOCKED`, `SKIPPED_BY_JUMP` vÃ o `status`. | Quáº£n lÃ½ tiáº¿n Ä‘á»™ há»c táº­p bÃ i há»c; phÃ¢n biá»‡t rÃµ bÃ i há»c hoÃ n thÃ nh tháº­t vá»›i bÃ i bá»‹ nháº£y cÃ³c (D5, M2.2). |
| `assessment_results` | Táº¡o má»›i | Táº¡o báº£ng má»›i: `id UUID PK`, `user_id UUID FK`, `assessment_type VARCHAR(32)`, `raw_score INT`, `starting_unit INT`, `answers JSONB`, `completed_at TIMESTAMPTZ`. RLS Append-Only. | LÆ°u lá»‹ch sá»­ kiá»ƒm tra cháº©n Ä‘oÃ¡n nÄƒng lá»±c báº¥t biáº¿n (DD-06). |
| `skill_profiles` | Táº¡o má»›i | Táº¡o báº£ng má»›i: `id UUID PK`, `user_id UUID UNIQUE FK`, `verified_proficiency JSONB`, `updated_at TIMESTAMPTZ`. | LÆ°u há»“ sÆ¡ nÄƒng lá»±c chi tiáº¿t cá»§a há»c viÃªn phá»¥c vá»¥ cÃ¡ nhÃ¢n hÃ³a (DD-06). |
| `user_vocab_srs` | Chá»‰nh sá»­a | Cáº­p nháº­t cáº¥u trÃºc há»— trá»£ Policy B: `stage INT DEFAULT 0`, `next_review_at TIMESTAMPTZ`. | Äá»™ng cÆ¡ Ã´n táº­p ngáº¯t quÃ£ng táº¥t Ä‘á»‹nh Policy B (D8). |
| `review_logs` | Giá»¯ nguyÃªn | Giá»¯ nguyÃªn báº£ng nháº­t kÃ½ Ã´n táº­p. | Phá»¥c vá»¥ truy váº¿t lá»‹ch sá»­ Ã´n táº­p tá»« vá»±ng. |
| `chat_scenarios` | Giá»¯ nguyÃªn | MÃ´ hÃ¬nh tÆ°Æ¡ng thÃ­ch káº¿ thá»«a tá»« Phase 0. | Báº£ng dá»¯ liá»‡u tÆ°Æ¡ng thÃ­ch; P1-FR-007 Ä‘Æ°á»£c báº£o toÃ n lÃ  yÃªu cáº§u chuáº©n táº¯c nhÆ°ng náº±m ngoÃ i pháº¡m vi triá»ƒn khai cá»§a Phase 2 (CANONICAL REQUIREMENT RETAINED â€” OUT OF PHASE 2 IMPLEMENTATION SCOPE). |
| `chat_scenario_translations`| Giá»¯ nguyÃªn | KhÃ´ng thay Ä‘á»•i | TiÃªu Ä‘á» vÃ  mÃ´ táº£ tÃ¬nh huá»‘ng viáº¿t tÆ°Æ¡ng thÃ­ch Phase 0; ngoÃ i pháº¡m vi Phase 2. |
| `audit_logs` | Chá»‰nh sá»­a | Cáº¥u trÃºc láº¡i theo chuáº©n DD-03: báº£o Ä‘áº£m 4 trÆ°á»ng báº¥t biáº¿n (`actor_id`, `action`, `target_id`, `timestamp`) + `metadata JSONB`; cÃ¡c trÆ°á»ng váº­t lÃ½ má»Ÿ rá»™ng (nhÆ° IP, user agent, retention) lÃ  Ä‘áº·c táº£ váº­t lÃ½ Má»ž (OPEN physical spec) do M3.1 hoÃ n thiá»‡n chi tiáº¿t DDL. RLS Append-Only. | Sá»• cÃ¡i kiá»ƒm toÃ¡n an ninh báº¥t biáº¿n, ghi nháº­n 11 sá»± kiá»‡n chuáº©n táº¯c (DD-03). |

### 5.2. Äáº·c Táº£ Chi Tiáº¿t 8 Giai Äoáº¡n Di Chuyá»ƒn Dá»¯ Liá»‡u (Migration Plan Phases)

> **LÆ°u Ã½ chuáº©n hÃ³a quy mÃ´ triá»ƒn khai Ä‘á»“ Ã¡n tá»‘t nghiá»‡p (Student Project Right-Sizing & Pedagogical Distinction):**
> Káº¿ hoáº¡ch di chuyá»ƒn dá»¯ liá»‡u 8 giai Ä‘oáº¡n chi tiáº¿t dÆ°á»›i Ä‘Ã¢y Ä‘Æ°á»£c thiáº¿t káº¿ theo chuáº©n kiáº¿n trÃºc doanh nghiá»‡p khÃ´ng giÃ¡n Ä‘oáº¡n (Enterprise Zero-Downtime Migration) Ã¡p dá»¥ng mÃ´ hÃ¬nh Expand/Contract káº¿t há»£p PITR Snapshot, Dual-write, Traffic Flip vÃ  thá»i gian theo dÃµi há»£p Ä‘á»“ng 14 ngÃ y.
> 1. **Má»¥c Ä‘Ã­ch há»c thuáº­t & báº£o vá»‡ luáº­n vÄƒn (Pedagogical Defense Specification):** ÄÃ³ng vai trÃ² lÃ  Ä‘áº·c táº£ kiáº¿n trÃºc di chuyá»ƒn dá»¯ liá»‡u chuáº©n má»±c phá»¥c vá»¥ trÃ¬nh bÃ y phÆ°Æ¡ng phÃ¡p luáº­n ká»¹ thuáº­t trong BÃ¡o cÃ¡o tá»‘t nghiá»‡p (ChÆ°Æ¡ng 3 & 4), chá»©ng minh kháº£ nÄƒng thiáº¿t káº¿ há»‡ thá»‘ng chá»‹u táº£i cao vÃ  an toÃ n dá»¯ liá»‡u cáº¥p doanh nghiá»‡p.
> 2. **Thá»±c thi váº­n hÃ nh trong mÃ´i trÆ°á»ng Local / Preview (M3.1 â€“ M3.2 Practical Execution):** Äá»‘i vá»›i mÃ´i trÆ°á»ng phÃ¡t triá»ƒn cá»¥c bá»™ vÃ  mÃ¡y chá»§ kiá»ƒm thá»­ Supabase (0 ngÆ°á»i dÃ¹ng trá»±c tiáº¿p trong quÃ¡ trÃ¬nh dev), quy trÃ¬nh di chuyá»ƒn Ä‘Æ°á»£c thá»±c thi tuáº§n tá»±, dá»©t Ä‘iá»ƒm báº±ng cÃ¡c migration script chuáº©n (`prisma migrate dev` / `supabase migration up`) kÃ¨m theo tiá»n kiá»ƒm (Preflight Check), UP script vÃ  háº­u kiá»ƒm (Postflight Verification). CÃ¡c bÆ°á»›c váº­n hÃ nh trá»±c tiáº¿p nhÆ° *thá»i gian theo dÃµi 14 ngÃ y (14-day bake period)* hoáº·c *chuyá»ƒn Ä‘á»•i lÆ°u lÆ°á»£ng zero-downtime trá»±c tiáº¿p trÃªn production (live traffic flip)* Ä‘Æ°á»£c Ä‘á»‹nh danh rÃµ lÃ  `[OPTIONAL / FUTURE PRODUCTION PRACTICE]` Ä‘á»ƒ lÃ m sÃ¡ng tá» lÃ½ thuyáº¿t luáº­n vÄƒn mÃ  khÃ´ng biáº¿n thÃ nh Ä‘iá»ƒm ngháº½n cáº£n trá»Ÿ viá»‡c nghiá»‡m thu cÃ¡c má»‘c M3.1â€“M3.2.

#### Giai Äoáº¡n 1: Kiá»ƒm Tra Tiá»n Äiá»u Kiá»‡n & Táº¡o Äiá»ƒm Sao LÆ°u (Pre-Migration Checks & Snapshot)
- **UP:** Kiá»ƒm tra káº¿t ná»‘i cÆ¡ sá»Ÿ dá»¯ liá»‡u Supabase, xÃ¡c nháº­n quyá»n Zone 5; táº¡o báº£n sao lÆ°u váº­t lÃ½ toÃ n bá»™ cÆ¡ sá»Ÿ dá»¯ liá»‡u vÃ  thiáº¿t láº­p Ä‘iá»ƒm khÃ´i phá»¥c thá»i gian thá»±c (PITR Snapshot).
- **DOWN / ROLLBACK:** KhÃ´ng Ã¡p dá»¥ng (khÃ´ng cÃ³ thay Ä‘á»•i lÆ°á»£c Ä‘á»“).
- **DATA SAFETY:** XÃ¡c nháº­n 100% dá»¯ liá»‡u hiá»‡n táº¡i Ä‘Æ°á»£c sao lÆ°u an toÃ n; kiá»ƒm tra dung lÆ°á»£ng á»• Ä‘Ä©a kháº£ dá»¥ng > 20%.
- **BACKFILL:** KhÃ´ng cÃ³.
- **TEST PLAN:** Cháº¡y script `scratch/check_db_health.py` kiá»ƒm tra toÃ n váº¹n báº£ng hiá»‡n táº¡i vÃ  xÃ¡c nháº­n snapshot há»£p lá»‡.

#### Giai Äoáº¡n 2: Má»Ÿ Rá»™ng LÆ°á»£c Äá»“ Dáº¡ng Cá»™ng Dá»“n (Compatibility / Expand Phase)
- **UP:** 
  1. Táº¡o enum má»›i hoáº·c thÃªm giÃ¡ trá»‹: `ExerciseType` bá»• sung `LISTENING`, `GRAMMAR`; `ProgressStatus` bá»• sung `LOCKED`, `SKIPPED_BY_JUMP`.
  2. Thá»±c hiá»‡n tiá»n kiá»ƒm tra (Preflight DB check) cho báº£ng `units`: náº¿u Ä‘Ã£ tá»“n táº¡i thÃ¬ Ä‘á»‘i soÃ¡t/reconcile, náº¿u chÆ°a tá»“n táº¡i thÃ¬ `CREATE TABLE units`. Táº¡o cÃ¡c báº£ng má»›i vá»›i cÃ¡c cá»™t nullable hoáº·c default: `lesson_revisions`, `assessment_results`, `skill_profiles`.
  3. ThÃªm cÃ¡c cá»™t má»›i dáº¡ng nullable vÃ o báº£ng hiá»‡n cÃ³: `lessons.unit_id`, `exercises.lesson_revision_id`, `profiles.verified_starting_unit`.
- **DOWN / ROLLBACK:** Cháº¡y script `.down.sql`: `DROP TABLE` cÃ¡c báº£ng má»›i táº¡o; `ALTER TABLE DROP COLUMN` cÃ¡c cá»™t má»›i thÃªm. **Chiáº¿n lÆ°á»£c an toÃ n di chuyá»ƒn enum:** *Rollback of enum removals is not assumed to be a simple DOWN migration. Rollback strategy must preserve backward compatibility and avoid destructive enum-value removal.* PhÆ°Æ¡ng Ã¡n thá»±c thi cá»¥ thá»ƒ do M3.1 quyáº¿t Ä‘á»‹nh sau khi kiá»ƒm tra hÃ nh vi migration thá»±c táº¿ cá»§a PostgreSQL.
- **DATA SAFETY:** Tuyá»‡t Ä‘á»‘i khÃ´ng thÃªm cá»™t `NOT NULL` thiáº¿u `DEFAULT`; khÃ´ng xÃ³a hoáº·c sá»­a Ä‘á»•i báº¥t ká»³ cá»™t hiá»‡n cÃ³ nÃ o Ä‘ang phá»¥c vá»¥ truy váº¥n.
- **BACKFILL:** KhÃ´ng cÃ³.
- **TEST PLAN:** Cháº¡y lá»‡nh `npx prisma validate`, kiá»ƒm tra catalog `pg_tables` xÃ¡c nháº­n báº£ng má»›i Ä‘Ã£ xuáº¥t hiá»‡n vÃ  cÃ¡c báº£ng cÅ© hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng.

#### Giai Äoáº¡n 3: Chuyá»ƒn Äá»•i Dá»¯ Liá»‡u & Náº¡p Dá»¯ Liá»‡u Máº§m (Data Transformation & Backfill Phase)
- **UP:**
  1. Cháº¡y script backfill táº¡o 6 Unit chuáº©n táº¯c cho khÃ³a há»c tiáº¿ng Anh A1 trong báº£ng `units`.
  2. Cáº­p nháº­t khÃ³a ngoáº¡i `lessons.unit_id` cho 24 bÃ i há»c hiá»‡n cÃ³ theo Ä‘Ãºng cáº¥u trÃºc 4 bÃ i há»c/Unit.
  3. TrÃ­ch xuáº¥t ná»™i dung tá»« báº£ng `lessons` hiá»‡n táº¡i Ä‘á»ƒ táº¡o báº£n ghi phiÃªn báº£n Ä‘áº§u tiÃªn trong `lesson_revisions` (`version = 1, status = 'PUBLISHED', supersedes_id = NULL`).
  4. Cáº­p nháº­t `exercises.lesson_revision_id` trá» vá» revision tÆ°Æ¡ng á»©ng; chuáº©n hÃ³a trÆ°á»ng `exercises.payload` sang JSON Schema má»›i.
- **DOWN / ROLLBACK:** `TRUNCATE TABLE lesson_revisions`; Ä‘áº·t giÃ¡ trá»‹ `lessons.unit_id = NULL`; khÃ´i phá»¥c dá»¯ liá»‡u payload cÅ© tá»« báº£ng sao lÆ°u.
- **DATA SAFETY:** Thá»±c hiá»‡n cáº­p nháº­t theo tá»«ng Ä‘á»£t (batching ~500 báº£n ghi/lÆ°á»£t) trong cÃ¡c giao dá»‹ch cÃ³ kiá»ƒm soÃ¡t thá»i gian chá» (lock_timeout = 5s).
- **BACKFILL:** Kiá»ƒm tra Ä‘á»‘i soÃ¡t sau khi cháº¡y: 100% bÃ i há»c cÃ³ `unit_id` há»£p lá»‡; 100% bÃ i há»c xuáº¥t báº£n cÃ³ báº£n ghi `lesson_revisions` tÆ°Æ¡ng á»©ng.
- **TEST PLAN:** Cháº¡y truy váº¥n SQL kiá»ƒm toÃ¡n Ä‘á»‘i chiáº¿u sá»‘ lÆ°á»£ng báº£n ghi giá»¯a báº£ng cÅ© vÃ  báº£ng má»›i (`COUNT(*)` khá»›p 100%).

#### Giai Äoáº¡n 4: Chuyá»ƒn Äá»•i Vai TrÃ² & Thiáº¿t Láº­p ChÃ­nh SÃ¡ch RLS (Role & RLS Transition Phase)
- **UP:**
  1. NÃ¢ng cáº¥p enum `Role` trong PostgreSQL tá»« 2 giÃ¡ trá»‹ hiá»‡n táº¡i (`LEARNER`, `ADMIN`) lÃªn 6 giÃ¡ trá»‹ chuáº©n táº¯c: bá»• sung `LESSON_CREATOR`, `MODERATOR`, `OPERATIONS_STAFF`, `ORGANIZATIONAL_MANAGER` vÃ  Ä‘á»“ng bá»™ `ADMIN` $\rightarrow$ `ADMINISTRATOR`.
  2. Triá»ƒn khai toÃ n bá»™ ma tráº­n chÃ­nh sÃ¡ch PostgreSQL Row Level Security (RLS) trÃªn táº¥t cáº£ cÃ¡c báº£ng nghiá»‡p vá»¥.
  3. CÃ i Ä‘áº·t cÃ¡c cÆ¡ cháº¿ phÃ¢n quyá»n báº£o Ä‘áº£m PhÃ¢n tÃ¡ch nhiá»‡m vá»¥ (SoD) vÃ  ghi log kiá»ƒm toÃ¡n báº¥t biáº¿n.
- **DOWN / ROLLBACK:** KhÃ´i phá»¥c láº¡i chÃ­nh sÃ¡ch RLS vÃ  enum 2 vai trÃ² ban Ä‘áº§u (`LEARNER`, `ADMIN`).
- **DATA SAFETY:** Ãp dá»¥ng cháº¿ Ä‘á»™ kiá»ƒm tra kÃ©p (dual-read check); Ä‘áº£m báº£o tÃ i khoáº£n quáº£n trá»‹ hiá»‡n táº¡i khÃ´ng bá»‹ máº¥t quyá»n truy cáº­p.
- **TEST PLAN:** Thá»±c thi bá»™ kiá»ƒm thá»­ tá»± Ä‘á»™ng trong `lingora-web`: `npx vitest run tests/security/rls_isolation.test.ts` vÃ  `npx vitest run tests/security/rbac_matrix.test.ts` vá»›i 6 token JWT giáº£ láº­p Ä‘áº¡i diá»‡n cho 6 vai trÃ² (Frames 12â€“16).

#### Giai Äoáº¡n 5: Chuyá»ƒn Äá»•i LÆ°u LÆ°á»£ng á»¨ng Dá»¥ng (Application Cutover Phase)
- **UP:** Triá»ƒn khai báº£n dá»±ng á»©ng dá»¥ng Phase 2 cho `lingora-web` vÃ  `lingora-admin`. Chuyá»ƒn hÆ°á»›ng toÃ n bá»™ cÃ¡c thao tÃ¡c Ä‘á»c/ghi sang cáº¥u trÃºc `units`, `lesson_revisions`, `assessment_results`.
- **DOWN / ROLLBACK:** Chuyá»ƒn Ä‘á»•i lÆ°u lÆ°á»£ng (traffic flip) quay trá»Ÿ láº¡i báº£n dá»±ng á»©ng dá»¥ng Phase 1 há»— trá»£ lÆ°á»£c Ä‘á»“ cÅ© trÃªn Vercel.
- **DATA SAFETY:** Theo dÃµi tá»· lá»‡ lá»—i API; náº¿u phÃ¡t hiá»‡n tá»· lá»‡ lá»—i > 1% trong 15 phÃºt Ä‘áº§u, kÃ­ch hoáº¡t hoÃ n nguyÃªn ngay láº­p tá»©c.
- **BACKFILL:** KhÃ´ng cÃ³.
- **TEST PLAN:** Thá»±c hiá»‡n kiá»ƒm tra sá»©c khá»e tá»± Ä‘á»™ng (health check) trÃªn 15 luá»“ng BF; xÃ¡c nháº­n giao dá»‹ch Ä‘Äƒng nháº­p, xem bÃ i vÃ  lÃ m bÃ i táº­p diá»…n ra trÆ¡n tru.

#### Giai Äoáº¡n 6: Kiá»ƒm Äá»‹nh Há»‡ Thá»‘ng Váº­n HÃ nh (System Audit & Validation Checkpoint)
- **UP:** Há»‡ thá»‘ng váº­n hÃ nh á»•n Ä‘á»‹nh trÃªn mÃ´i trÆ°á»ng má»›i; giÃ¡m sÃ¡t hiá»‡u nÄƒng truy váº¥n RLS vÃ  cÆ¡ cháº¿ ghi log kiá»ƒm toÃ¡n.
- **DOWN / ROLLBACK:** KÃ­ch hoáº¡t Giai Ä‘oáº¡n 7 náº¿u phÃ¡t hiá»‡n lá»—i báº£o máº­t nghiÃªm trá»ng (Sev-1).
- **DATA SAFETY:** ToÃ n bá»™ dá»¯ liá»‡u ngÆ°á»i dÃ¹ng phÃ¡t sinh má»›i trong giai Ä‘oáº¡n nÃ y Ä‘Æ°á»£c báº£o vá»‡ bá»Ÿi RLS vÃ  sao lÆ°u liÃªn tá»¥c.
- **BACKFILL:** KhÃ´ng cÃ³.
- **TEST PLAN:** Thá»±c thi trá»n váº¹n bá»™ 18 ká»‹ch báº£n Test Frames cá»§a M2.6; xÃ¡c nháº­n nháº­t kÃ½ kiá»ƒm toÃ¡n ghi nháº­n Ä‘áº§y Ä‘á»§ 11 loáº¡i sá»± kiá»‡n.

#### Giai Äoáº¡n 7: Káº¿ Hoáº¡ch á»¨ng PhÃ³ Kháº©n Cáº¥p (Rollback Strategy & Emergency Plan)
- **UP:** KÃ­ch hoáº¡t quy trÃ¬nh hoÃ n nguyÃªn cÃ³ kiá»ƒm soÃ¡t khi xáº£y ra lá»—i Sev-1 (máº¥t dá»¯ liá»‡u, rÃ² rá»‰ phÃ¢n quyá»n RLS, Ä‘á»©t gÃ£y toÃ n bá»™ API). KhÃ´i phá»¥c tráº¡ng thÃ¡i á»•n Ä‘á»‹nh gáº§n nháº¥t tá»« Ä‘iá»ƒm sao lÆ°u PITR.
- **DOWN / ROLLBACK:** KhÃ´ng Ã¡p dá»¥ng.
- **DATA SAFETY:** TrÃ­ch xuáº¥t pháº§n dá»¯ liá»‡u há»c táº­p má»›i phÃ¡t sinh trong thá»i gian cutover vÃ o báº£ng Ä‘á»‡m táº¡m trÆ°á»›c khi hoÃ n nguyÃªn PITR Ä‘á»ƒ náº¡p láº¡i sau.
- **BACKFILL:** Cháº¡y script bÃ¹ trá»« dá»¯ liá»‡u há»c viÃªn tá»« báº£ng Ä‘á»‡m táº¡m sau khi há»‡ thá»‘ng á»•n Ä‘á»‹nh.
- **TEST PLAN:** Thá»±c hÃ nh diá»…n táº­p ká»‹ch báº£n hoÃ n nguyÃªn dry-run trÃªn mÃ´i trÆ°á»ng staging trÆ°á»›c khi cháº¡y cutover tháº­t.

#### Giai Äoáº¡n 8: Thu Háº¹p LÆ°á»£c Äá»“ & Dá»n Dáº¹p Sau Chuyá»ƒn Äá»•i (Post-Migration Cleanup / Contract Phase)
- **UP:** Sau khi há»‡ thá»‘ng váº­n hÃ nh á»•n Ä‘á»‹nh tá»‘i thiá»ƒu 14 ngÃ y trÃªn mÃ´i trÆ°á»ng má»¥c tiÃªu: tiáº¿n hÃ nh gá»¡ bá» cÃ¡c cá»™t dá»¯ liá»‡u cÅ© khÃ´ng cÃ²n sá»­ dá»¥ng trÃªn báº£ng `lessons` vÃ  `exercises`.
- **DOWN / ROLLBACK:** KhÃ´ng hoÃ n nguyÃªn sau khi Ä‘Ã£ Ä‘Ã³ng há»£p Ä‘á»“ng (Contract Phase); dá»¯ liá»‡u cÅ© Ä‘Ã£ Ä‘Æ°á»£c lÆ°u trá»¯ trong báº£n sao lÆ°u vÄ©nh viá»…n.
- **DATA SAFETY:** XÃ¡c nháº­n tuyá»‡t Ä‘á»‘i khÃ´ng cÃ²n báº¥t ká»³ truy váº¥n nÃ o trong mÃ£ nguá»“n á»©ng dá»¥ng hay bÃ¡o cÃ¡o tham chiáº¿u Ä‘áº¿n cÃ¡c cá»™t cÅ© trong 14 ngÃ y liÃªn tá»¥c.
- **BACKFILL:** KhÃ´ng cÃ³.
### 5.3. TiÃªu ChÃ­ Äáº§u Ra & Cá»•ng Nghiá»‡m Thu Báº¯t Buá»™c Cá»§a Milestone M3.1 (M3.1 Mandatory Exit Criteria)

Äá»ƒ Ä‘áº£m báº£o an toÃ n tuyá»‡t Ä‘á»‘i trÆ°á»›c khi báº¯t tay vÃ o triá»ƒn khai mÃ£ nguá»“n cÃ¡c phÃ¢n há»‡ tiáº¿p theo (M3.2 Ä‘áº¿n M3.10), Milestone M3.1 báº¯t buá»™c pháº£i hoÃ n thÃ nh vÃ  khÃ³a nghiá»‡m thu cÃ¡c tiÃªu chÃ­ sau:

1. **Báº£o Máº­t Barem Cháº¥m Äiá»ƒm & PhÃ¢n TÃ¡ch Dá»¯ Liá»‡u BÃ i Táº­p (Exercise Answer Security):**
   - **NguyÃªn táº¯c kiáº¿n trÃºc:** `Learner-readable exercise payload != grading secret / correct answer`.
   - **Quyáº¿t Ä‘á»‹nh biá»ƒu diá»…n váº­t lÃ½ (Physical representation decision):** XÃ¡c Ä‘á»‹nh rÃµ phÆ°Æ¡ng Ã¡n tÃ¡ch biá»‡t giá»¯a ná»™i dung bÃ i táº­p gá»­i cho há»c viÃªn (khÃ´ng chá»©a Ä‘Ã¡p Ã¡n Ä‘Ãºng / regex cháº¥m Ä‘iá»ƒm) vÃ  barem cháº¥m Ä‘iá»ƒm mÃ¡y chá»§.
   - **Ranh giá»›i phÃ¢n quyá»n & cáº¥p phÃ©p (Permission / Grant boundary):** Thiáº¿t láº­p cÆ¡ cháº¿ phÃ¢n quyá»n (PostgreSQL Column-Level Grants, Views hoáº·c RLS projection) báº£o Ä‘áº£m tÃ i khoáº£n há»c viÃªn khÃ´ng thá»ƒ truy váº¥n barem Ä‘Ã¡p Ã¡n.
   - **Bá»™ kiá»ƒm thá»­ phá»§ Ä‘á»‹nh báº¯t buá»™c:**
     - *Learner negative test:* Kiá»ƒm chá»©ng API pháº£n há»“i payload bÃ i táº­p cho há»c viÃªn khÃ´ng bao giá» chá»©a trÆ°á»ng Ä‘Ã¡p Ã¡n Ä‘Ãºng hoáº·c bÃ­ máº­t cháº¥m Ä‘iá»ƒm.
     - *Direct data-access negative test:* Kiá»ƒm chá»©ng há»c viÃªn gá»­i truy váº¥n trá»±c tiáº¿p vÃ o cÆ¡ sá»Ÿ dá»¯ liá»‡u bá»‹ tá»« chá»‘i Ä‘á»c barem Ä‘Ã¡p Ã¡n.
2. **Kiá»ƒm SoÃ¡t Truy Cáº­p Trá»±c Tiáº¿p ÄÆ¡n Vá»‹ GiÃ¡o TrÃ¬nh (Unit 4/4 Direct Access & Visibility):**
   - **NguyÃªn táº¯c:** `UI hiding != Authorization`. Viá»‡c áº©n Unit chÆ°a Ä‘á»§ 4/4 bÃ i trÃªn giao diá»‡n danh má»¥c khÃ´ng thay tháº¿ cho viá»‡c kiá»ƒm soÃ¡t phÃ¢n quyá»n.
   - **Bá»™ kiá»ƒm thá»­ báº¯t buá»™c:**
     - Unit cÃ³ 3/4 bÃ i `PUBLISHED` vÃ  1 bÃ i `DRAFT` $\rightarrow$ Tá»± Ä‘á»™ng áº©n trÃªn danh má»¥c Unit cá»§a há»c viÃªn.
     - Kiá»ƒm thá»­ truy cáº­p trá»±c tiáº¿p bÃ i há»c/bÃ i táº­p thuá»™c Unit 3/4 Published: Gá»­i request trá»±c tiáº¿p Ä‘áº¿n API route bÃ i há»c $\rightarrow$ Bá»‹ cháº·n vá»›i lá»—i `403 Forbidden` hoáº·c `404 Not Found`.
     - Tuyá»‡t Ä‘á»‘i khÃ´ng táº¡o cÆ¡ cháº¿ tá»± Ä‘á»™ng chuyá»ƒn hÆ°á»›ng hoáº·c fallback sang Unit gáº§n nháº¥t.
3. **MÃ´ HÃ¬nh HÃ³a Dá»¯ Liá»‡u BÃ i Cháº©n ÄoÃ¡n & Thá»­ ThÃ¡ch Nháº£y CÃ³c (Placement & Jump Data Representation):**
   - **NguyÃªn táº¯c:** Chá»‘t biá»ƒu diá»…n váº­t lÃ½ cho 30 cÃ¢u há»i Placement Test vÃ  cÃ¢u há»i Jump Challenge trong khuÃ´n khá»• MÃ´ hÃ¬nh BÃ i táº­p Há»£p nháº¥t (Unified Exercise / Assessment model).
   - **Cáº¥m thá»±c thá»ƒ ma (Zero Ghost Entities):** Tuyá»‡t Ä‘á»‘i KHÃ”NG táº¡o cÃ¡c thá»±c thá»ƒ `Exam`, `QuestionBank`, `AssessmentSession`.
   - **ÄÃ¡nh dáº¥u thiáº¿t káº¿:** *M3.1 DESIGN DECISION REQUIRED: Physical representation of Placement and Jump items within Unified Exercise/Assessment model must be finalized during M3.1 schema design.*
4. **Biá»ƒu Diá»…n Váº­t LÃ½ Tráº¡ng ThÃ¡i PhiÃªn & Háº¡n Má»©c LÃ m Láº¡i (Attempt / Retry State Representation):**
   - Äáº£m báº£o cÆ°á»¡ng cháº¿ quy táº¯c D7 tá»« phÃ­a mÃ¡y chá»§: $\text{allowance} = \max(1, \lfloor N \times 0.10 \rfloor)$, báº£o lÆ°u Ä‘iá»ƒm tráº§n 70%.
   - **TiÃªu chÃ­:** *Physical attempt/retry state representation is defined and verified before M3.3/M3.5 implementation.* KhÃ´ng giáº£ Ä‘á»‹nh tráº¡ng thÃ¡i chá»‰ lÆ°u á»Ÿ client.
5. **Biá»ƒu Diá»…n Váº­t LÃ½ Thá»i Gian Há»“i ChiÃªu Nháº£y CÃ³c (Jump Cooldown Physical Representation):**
   - Äáº£m báº£o cÆ°á»¡ng cháº¿ ngÆ°á»¡ng $\ge 95\%$, cá» `by_jump = true` (`SKIPPED_BY_JUMP`), vÃ  khÃ³a há»“i chiÃªu 24 giá» cá»§a D5 tá»« server time.
   - **TiÃªu chÃ­:** *Physical state representation for 24h Jump cooldown lockout is finalized in M3.1 without premature column locking.*
6. **Biá»ƒu Diá»…n Váº­t LÃ½ Tráº¡ng ThÃ¡i ÄÃ¡nh GiÃ¡ & Bá» Qua (Skip / Placement Status Semantics):**
   - PhÃ¢n biá»‡t rÃµ rÃ ng 3 tráº¡ng thÃ¡i ngá»¯ nghÄ©a: `NOT_DECIDED` (má»›i Ä‘Äƒng kÃ½), `SKIPPED / UNVERIFIED` (bá» qua, xuáº¥t phÃ¡t Unit 1, chÆ°a kiá»ƒm Ä‘á»‹nh), `DIAGNOSTIC / VERIFIED` (hoÃ n thÃ nh 30 cÃ¢u, Ä‘iá»ƒm thÃ´ $0..30$, Mapping A).
   - **TiÃªu chÃ­:** *Physical representation of placement status is finalized before schema implementation.*

---

## 6. Káº¾ HOáº CH TRIá»‚N KHAI AUTH, RBAC, RLS & PHÃ‚N TÃCH NHIá»†M Vá»¤ (SOD)

Há»‡ thá»‘ng báº£o máº­t cá»§a Lingora tuÃ¢n thá»§ nguyÃªn táº¯c **PhÃ²ng vá»‡ kÃ©p (Dual-Presence Security Model)**: Kiá»ƒm soÃ¡t táº§ng á»©ng dá»¥ng (Application AuthZ) mang láº¡i tráº£i nghiá»‡m mÆ°á»£t mÃ  vÃ  tá»‘i Æ°u hÃ³a truy váº¥n; nhÆ°ng **chÃ­nh sÃ¡ch báº£o máº­t cáº¥p dÃ²ng (Database RLS) táº¡i PostgreSQL lÃ  chá»‘t cháº·n báº¯t buá»™c tá»‘i háº­u** báº£o vá»‡ dá»¯ liá»‡u chá»‘ng láº¡i má»i hÃ nh vi vÆ°á»£t quyá»n hay táº¥n cÃ´ng trá»±c tiáº¿p.

### 6.1. MÃ´ HÃ¬nh 6 Vai TrÃ² & PhÃ¢n Bá»• Quyá»n Háº¡n

```text
+------------------------+---------------------------------------------------------------------------+
| VAI TRÃ’ CHUáº¨N Táº®C      | PHáº M VI TRUY Cáº¬P VÃ€ QUYá»€N Háº N Há»† THá»NG                                    |
+------------------------+---------------------------------------------------------------------------+
| 1. Learner             | Chá»‰ Ä‘á»c/ghi tiáº¿n Ä‘á»™ cá»§a chÃ­nh mÃ¬nh (auth.uid() = user_id).                |
|                        | Chá»‰ Ä‘á»c cÃ¡c ná»™i dung Ä‘Ã£ xuáº¥t báº£n (status = 'PUBLISHED').                  |
+------------------------+---------------------------------------------------------------------------+
| 2. Lesson Creator      | Äá»c cÃ¡c bÃ i há»c Ä‘Æ°á»£c phÃ¢n cÃ´ng (assigned_creator_id = auth.uid()).        |
|                        | Táº¡o/sá»­a báº£n tháº£o (DRAFT, CHANGES_REQUESTED); ná»™p duyá»‡t (IN_REVIEW).       |
|                        | Cáº¤M: PhÃª duyá»‡t bÃ i há»c (bá»‹ tá»« chá»‘i phÃ¢n quyá»n 403 ROLE_UNAUTHORIZED); xuáº¥t báº£n bÃ i há»c ra há»c viÃªn. |
+------------------------+---------------------------------------------------------------------------+
| 3. Moderator           | Äá»c hÃ ng Ä‘á»£i kiá»ƒm duyá»‡t (status = 'IN_REVIEW').                           |
|                        | PhÃª duyá»‡t (APPROVED) hoáº·c YÃªu cáº§u sá»­a (CHANGES_REQUESTED).                |
|                        | Cáº¤M: Xuáº¥t báº£n bÃ i há»c ra há»c viÃªn (thuá»™c tháº©m quyá»n dÃ nh riÃªng cho Org Manager). |
+------------------------+---------------------------------------------------------------------------+
| 4. Org Manager         | Táº¡o káº¿ hoáº¡ch bÃ i há»c, phÃ¢n cÃ´ng biÃªn soáº¡n (gÃ¡n assigned_creator_id).       |
|                        | Xuáº¥t báº£n bÃ i há»c Ä‘Ã£ duyá»‡t (chuyá»ƒn APPROVED -> PUBLISHED).                 |
|                        | LÆ°u trá»¯ bÃ i há»c (PUBLISHED -> ARCHIVED).                                  |
+------------------------+---------------------------------------------------------------------------+
| 5. Administrator       | Quáº£n lÃ½ tÃ i khoáº£n, gÃ¡n vai trÃ² ngÆ°á»i dÃ¹ng (ROLE_ASSIGNED).                |
|                        | Tra cá»©u nháº­t kÃ½ kiá»ƒm toÃ¡n há»‡ thá»‘ng (AUDIT_LOG_INSPECTED).                  |
|                        | Xuáº¥t báº£n kháº©n cáº¥p bÃ i há»c Ä‘Ã£ APPROVED kÃ¨m lÃ½ do báº¯t buá»™c vÃ  ghi log kiá»ƒm toÃ¡n.|
| 6. Operations Staff    | Xá»­ lÃ½ / Ä‘iá»u phá»‘i support theo pháº¡m vi Ä‘Æ°á»£c cáº¥p (há»— trá»£ váº­n hÃ nh,         |
|                        | giáº£i Ä‘Ã¡p tháº¯c máº¯c há»c viÃªn, tiáº¿p nháº­n sá»± cá»‘ ká»¹ thuáº­t).                    |
|                        | Cáº¤M: Can thiá»‡p ná»™i dung giÃ¡o trÃ¬nh, phÃª duyá»‡t bÃ i há»c, hoáº·c tra cá»©u       |
|                        | nháº­t kÃ½ kiá»ƒm toÃ¡n há»‡ thá»‘ng (audit logs - tháº©m quyá»n dÃ nh riÃªng cho Admin).|
+------------------------+---------------------------------------------------------------------------+
```

### 6.2. Thiáº¿t Káº¿ Ma Tráº­n ChÃ­nh SÃ¡ch Supabase Row Level Security (RLS)

Má»i báº£ng trong cÆ¡ sá»Ÿ dá»¯ liá»‡u Ä‘á»u báº¯t buá»™c pháº£i kÃ­ch hoáº¡t RLS: `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`.

> **YÃªu cáº§u an ninh phÃ¢n quyá»n vai trÃ² táº¡i táº§ng RLS (RLS Role Authorization Requirement):**
> *Role authorization must be secure without recursive/self-referencing RLS dependency.*
> TÃ i liá»‡u Káº¿ hoáº¡ch Tá»•ng thá»ƒ khÃ´ng Ã¡p Ä‘áº·t trÆ°á»›c cÆ¡ cháº¿ ká»¹ thuáº­t cá»¥ thá»ƒ (khÃ´ng báº¯t buá»™c `SECURITY DEFINER` function hay `JWT claim`). Milestone M3.2 sáº½ Ä‘Ã¡nh giÃ¡ vÃ  lá»±a chá»n cÆ¡ cháº¿ thá»±c thi tá»‘i Æ°u nháº¥t trong quÃ¡ trÃ¬nh cÃ i Ä‘áº·t thá»±c táº¿.

```sql
-- VÃ­ dá»¥ minh há»a kiáº¿n trÃºc chÃ­nh sÃ¡ch RLS cho báº£ng tiáº¿n Ä‘á»™ há»c táº­p (user_progress)
-- Äáº£m báº£o cÃ¡ch ly tuyá»‡t Ä‘á»‘i giá»¯a cÃ¡c há»c viÃªn: NgÆ°á»i dÃ¹ng A khÃ´ng thá»ƒ Ä‘á»c/sá»­a NgÆ°á»i dÃ¹ng B
CREATE POLICY "learner_manage_own_progress"
ON user_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- VÃ­ dá»¥ minh há»a chÃ­nh sÃ¡ch RLS cho báº£ng phiÃªn báº£n bÃ i há»c (lesson_revisions)
-- Há»c viÃªn chá»‰ Ä‘á»c bÃ i Ä‘Ã£ xuáº¥t báº£n
CREATE POLICY "learner_read_published_revisions"
ON lesson_revisions
FOR SELECT
TO authenticated
USING (
  status = 'PUBLISHED' 
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'LEARNER')
);

-- Creator chá»‰ xem vÃ  sá»­a bÃ i tháº£o Ä‘Æ°á»£c phÃ¢n cÃ´ng cho chÃ­nh mÃ¬nh
CREATE POLICY "creator_manage_assigned_revisions"
ON lesson_revisions
FOR ALL
TO authenticated
USING (
  assigned_creator_id = auth.uid() 
  AND status IN ('DRAFT', 'CHANGES_REQUESTED')
  AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'LESSON_CREATOR')
)
WITH CHECK (
  assigned_creator_id = auth.uid() 
  AND status IN ('DRAFT', 'IN_REVIEW')
);
```

### 6.3. Quy Táº¯c Cháº·n Vi Pháº¡m PhÃ¢n TÃ¡ch Nhiá»‡m Vá»¥ (SoD Enforcement)
CÃ¡c quy táº¯c phÃ¢n tÃ¡ch nhiá»‡m vá»¥ Ä‘Æ°á»£c báº£o vá»‡ báº±ng nguyÃªn táº¯c phÃ²ng vá»‡ kÃ©p (Dual-Presence Security): Táº§ng á»©ng dá»¥ng (BFF) kiá»ƒm tra vai trÃ² ngÆ°á»i dÃ¹ng vÃ  tráº£ vá» mÃ£ lá»—i HTTP 403 ngá»¯ nghÄ©a; Ä‘á»“ng thá»i Táº§ng cÆ¡ sá»Ÿ dá»¯ liá»‡u (RLS / Triggers) Ä‘á»™c láº­p tá»« chá»‘i giao dá»‹ch trÃ¡i phÃ©p ngay cáº£ khi táº§ng á»©ng dá»¥ng bá»‹ vÆ°á»£t qua.

1. **Lesson Creator Cáº¥m PhÃª Duyá»‡t BÃ i Há»c (Creator Cannot Approve):**
   - **Táº§ng á»©ng dá»¥ng (BFF):** Do mÃ´ hÃ¬nh Ã¡p dá»¥ng 1 vai trÃ² duy nháº¥t trÃªn má»—i tÃ i khoáº£n (`profiles.role`), Creator vÃ  Moderator lÃ  2 danh tÃ­nh Ä‘á»™c láº­p. Náº¿u ngÆ°á»i dÃ¹ng cÃ³ vai trÃ² `LESSON_CREATOR` gá»­i yÃªu cáº§u duyá»‡t bÃ i há»c (`status = 'APPROVED'`) $\rightarrow$ Bá»‹ tá»« chá»‘i phÃ¢n quyá»n vá»›i mÃ£ lá»—i `403 Forbidden` / `ROLE_UNAUTHORIZED` (khÃ´ng tá»“n táº¡i ca "self-review" vÃ¬ tÃ i khoáº£n Creator khÃ´ng thá»ƒ mang vai trÃ² Moderator).
   - **MÃ´ hÃ¬nh tÃ¡c tá»­ Ä‘áº·c quyá»n (Conceptual Privileged Operation):**
     ```text
     privileged operation (e.g. approve / publish)
     â†’ explicit actor identity (p_actor_id UUID: TARGET DESIGN / PROPOSED IMPLEMENTATION DETAIL)
     â†’ role authorization check (SELECT role FROM profiles WHERE id = p_actor_id)
     â†’ state transition (reject if actor.role = 'LESSON_CREATOR')
     â†’ audit record (append-only log entry)
     ```
2. **Moderator Cáº¥m Xuáº¥t Báº£n BÃ i Há»c Ra Há»c ViÃªn (Moderator Cannot Publish):**
   - **Táº§ng á»©ng dá»¥ng (BFF):** Náº¿u ngÆ°á»i dÃ¹ng cÃ³ vai trÃ² `MODERATOR` gá»­i yÃªu cáº§u chuyá»ƒn tráº¡ng thÃ¡i sang `PUBLISHED` $\rightarrow$ Bá»‹ tá»« chá»‘i vá»›i mÃ£ lá»—i `403 Forbidden`.
   - **Táº§ng DB RLS:** ChÃ­nh sÃ¡ch RLS chá»‰ cho phÃ©p vai trÃ² `ORGANIZATIONAL_MANAGER` vÃ  `ADMINISTRATOR` thá»±c thi lá»‡nh chuyá»ƒn tráº¡ng thÃ¡i sang `PUBLISHED`.
3. **Organizational Manager Cáº¥m PhÃª Duyá»‡t BÃ i Há»c (Manager Cannot Approve):**
   - **Táº§ng á»©ng dá»¥ng (BFF):** Náº¿u ngÆ°á»i dÃ¹ng cÃ³ vai trÃ² `ORGANIZATIONAL_MANAGER` gá»­i yÃªu cáº§u duyá»‡t bÃ i $\rightarrow$ Bá»‹ tá»« chá»‘i vá»›i mÃ£ lá»—i `403 Forbidden` (tháº©m quyá»n phÃª duyá»‡t chuyÃªn mÃ´n dÃ nh riÃªng cho `MODERATOR`).
4. **RÃ ng Buá»™c NghiÃªm Ngáº·t Khi Admin Xuáº¥t Báº£n Kháº©n Cáº¥p:**
   - **Táº§ng á»©ng dá»¥ng (BFF):**
     - Ká»‹ch báº£n A: Náº¿u bÃ i há»c Ä‘ang á»Ÿ tráº¡ng thÃ¡i `IN_REVIEW` hoáº·c chÆ°a qua kiá»ƒm duyá»‡t $\rightarrow$ Tá»« chá»‘i vá»›i mÃ£ lá»—i `403 Forbidden` (`403 EMERGENCY_UNAPPROVED`).
     - Ká»‹ch báº£n B: Náº¿u bÃ i há»c Ä‘Ã£ `APPROVED` nhÆ°ng trÆ°á»ng lÃ½ do giáº£i trÃ¬nh `reason` rá»—ng hoáº·c null $\rightarrow$ Tá»« chá»‘i vá»›i mÃ£ lá»—i `403 Forbidden` (`403 MISSING_JUSTIFICATION`).
     - Ká»‹ch báº£n C: BÃ i há»c Ä‘Ã£ `APPROVED` kÃ¨m `reason` há»£p lá»‡ $\rightarrow$ Cháº¥p nháº­n chuyá»ƒn sang `PUBLISHED`, Ä‘á»“ng thá»i phÃ¡t tháº£i báº£n ghi kiá»ƒm toÃ¡n chuáº©n táº¯c `CONTENT_EMERGENCY_PUB` vÃ o báº£ng `audit_logs`.

---

## 7. Káº¾ HOáº CH TRIá»‚N KHAI VÃ’NG Äá»œI Há»ŒC VIÃŠN (LEARNER CORE ENGINE)

PhÃ¢n há»‡ há»c viÃªn hiá»‡n thá»±c hÃ³a trá»n váº¹n **VÃ²ng láº·p há»c táº­p khÃ©p kÃ­n 9 bÆ°á»›c (Closed-Loop Learner Cycle)**, Ä‘áº£m báº£o tÃ­nh liÃªn tá»¥c, tÃ­nh cÃ´ng báº±ng vÃ  sá»± báº£o vá»‡ dá»¯ liá»‡u toÃ n diá»‡n.

```text
+---------------------------------------------------------------------------------------------------+
|                                  CLOSED-LOOP LEARNER CYCLE (10 STEPS)                             |
+---------------------------------------------------------------------------------------------------+
| [1. SIGN IN]                                                                                      |
|       |                                                                                           |
|       v                                                                                           |
| [2. STARTING POINT CHECK] â”€â”€(Unverified)â”€â”€> [Placement Test / Skip] â”€â”€> [GÃ¡n Starting Unit 1..6] |
|       |                                                                          |                |
|       +â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€(ÄÃ£ xÃ¡c thá»±c)â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€+                |
|       v                                                                                           |
| [3. LEARN (Curriculum)] â”€â”€> [Chá»n Unit kháº£ dá»¥ng (4/4 Published)] â”€â”€> [Chá»n Lesson]                |
|       |                                                                                           |
|       v                                                                                           |
| [4. LESSON CONTENT VIEWER] â”€â”€> [Xem tá»« vá»±ng, audio phÃ¡t Ã¢m, vÃ­ dá»¥, tÃ³m táº¯t ngá»¯ phÃ¡p bÃ i há»c]     |
|       |                                                                                           |
|       v                                                                                           |
| [5. START EXERCISES] â”€â”€> [TÆ°Æ¡ng tÃ¡c 5 dáº¡ng: MCQ, FILL, REORDER, LISTENING, GRAMMAR]               |
|       |                                                                                           |
|       v                                                                                           |
| [6. FEEDBACK & SCORING] â”€â”€> [Pháº£n há»“i Ä‘Ãºng/sai, giáº£i thÃ­ch chi tiáº¿t, cháº¥m Ä‘iá»ƒm cÆ¡ sá»Ÿ]             |
|       |                                                                                           |
|       v                                                                                           |
| [7. CONTROLLED RETRY] â”€â”€(LÃ m sai & cÃ²n lÆ°á»£t)â”€â”€> [max(1, floor(N*0.10)) / Tá»‘i Ä‘a 70% Ä‘iá»ƒm]        |
|       |                                                                                           |
|       v                                                                                           |
| [8. PROGRESS PERSISTENCE] â”€â”€> [Cáº­p nháº­t UserProgress nguyÃªn tá»­: status, score, completedAt]       |
|       |                                                                                           |
|       v                                                                                           |
| [9. SRS PRACTICE QUEUE] â”€â”€> [Äáº©y tá»« vá»±ng vÃ o hÃ ng Ä‘á»£i Ã´n táº­p ngáº¯t quÃ£ng Policy B: 1,3,7,14,30]    |
|       |                                                                                           |
|       v                                                                                           |
| [10. STREAK EVALUATION] â”€â”€> [TÃ­nh toÃ¡n chuá»—i ngÃ y há»c theo mÃºi giá» IANA, cáº­p nháº­t ká»· lá»¥c]        |
+---------------------------------------------------------------------------------------------------+
```

### Chi Tiáº¿t Ká»¹ Thuáº­t Tá»«ng BÆ°á»›c Trong VÃ²ng Láº·p Há»c ViÃªn:

| BÆ°á»›c | TÃªn BÆ°á»›c | Nguá»“n ChÃ¢n LÃ½ (Source of Truth) | TrÃ¡ch Nhiá»‡m API / BFF | TrÃ¡ch Nhiá»‡m Táº§ng Nghiá»‡p Vá»¥ (Domain) | LÆ°u Trá»¯ CÆ¡ Sá»Ÿ Dá»¯ Liá»‡u | Ká»‹ch Báº£n Tháº¥t Báº¡i & PhÃ²ng Vá»‡ | Ká»‹ch Báº£n Kiá»ƒm Thá»­ |
|---|---|---|---|---|---|---|---|
| **1** | **Sign In** | Supabase GoTrue Auth | Xá»­ lÃ½ phiÃªn cookie HttpOnly, xÃ¡c thá»±c JWT | `COMP-DOM-01`: Äá»c há»“ sÆ¡ ngÆ°á»i dÃ¹ng, phÃ¢n loáº¡i vai trÃ² | Äá»c báº£ng `profiles`, `auth.users` | Token háº¿t háº¡n / sai máº­t kháº©u $\rightarrow$ Tráº£ vá» mÃ£ lá»—i 401 | `test_auth_signin` |
| **2** | **Starting Point** | `profiles.verified_starting_unit` | Äiá»u hÆ°á»›ng giao diá»‡n dá»±a trÃªn cá» tráº¡ng thÃ¡i kiá»ƒm Ä‘á»‹nh | `COMP-DOM-03`: Kiá»ƒm tra há»c viÃªn má»›i, kÃ­ch hoáº¡t cháº©n Ä‘oÃ¡n náº¿u chÆ°a lÃ m | Äá»c `profiles.verified_starting_unit`, `assessment_results` | Máº¥t káº¿t ná»‘i DB $\rightarrow$ Máº·c Ä‘á»‹nh gÃ¡n Unit 1 an toÃ n | `test_placement_routing` |
| **3** | **Learn (Curriculum)** | Báº£ng `units` & `lesson_revisions` | Láº¥y danh sÃ¡ch Unit vÃ  Lesson hiá»ƒn thá»‹ cho há»c viÃªn | `COMP-DOM-02`: Ãp dá»¥ng luáº­t Unit 4/4 Published; lá»c bÃ i khÃ³a | Truy váº¥n `units` JOIN `lesson_revisions` qua RLS | Cá»‘ tÃ¬nh truy cáº­p bÃ i chÆ°a xuáº¥t báº£n hoáº·c bÃ i thuá»™c Unit chÆ°a Ä‘á»§ 4/4 Published $\rightarrow$ Cháº·n 404/403 (`UI hiding != Authorization`) | `test_curriculum_visible`, `test_direct_lesson_access_denial` |
| **4** | **Lesson Content Viewer** | `lesson_revisions`, `vocabularies`, `lesson_vocabularies` | Táº£i ná»™i dung há»c liá»‡u bÃ i há»c (tá»« vá»±ng, phiÃªn Ã¢m, giáº£i nghÄ©a tiáº¿ng Viá»‡t, cÃ¢u vÃ­ dá»¥, audio MP3 chuáº©n qua Storage RLS, tÃ³m táº¯t ngá»¯ phÃ¡p) | `COMP-DOM-02` / `COMP-DOM-05`: Chuáº©n bá»‹ giao diá»‡n tiáº¿p thu kiáº¿n thá»©c trÆ°á»›c khi lÃ m bÃ i táº­p; khÃ´ng táº¡o ná»™i dung AI | Äá»c `lesson_revisions`, `vocabularies` qua RLS | Lá»—i táº£i audio $\rightarrow$ Váº«n hiá»ƒn thá»‹ text/nghÄ©a/phiÃªn Ã¢m an toÃ n; khÃ´ng cháº·n Ä‘á»c bÃ i | `test_lesson_content_view` |
| **5** | **Start Exercises** | Báº£ng `exercises` (Unified Model) | Táº£i ná»™i dung bÃ i táº­p theo thá»© tá»± `order_index` (giáº¥u barem Ä‘Ã¡p Ã¡n) | `COMP-DOM-05`: Khá»Ÿi táº¡o phiÃªn lÃ m bÃ i há»c, tÃ­nh sá»‘ bÃ i táº­p N | Äá»c báº£ng `exercises` theo `lesson_revision_id` (khÃ´ng tráº£ barem Ä‘Ã¡p Ã¡n) | BÃ i táº­p lá»—i cáº¥u trÃºc payload $\rightarrow$ Ghi log, bá» qua cÃ¢u | `test_exercise_render` |
| **6** | **Feedback** | Barem cháº¥m Ä‘iá»ƒm mÃ¡y chá»§ (`Learner payload != grading secret`) | Tiáº¿p nháº­n cÃ¢u tráº£ lá»i, so khá»›p Ä‘Ã¡p Ã¡n | `COMP-DOM-05`: So khá»›p chÃ­nh xÃ¡c trÃªn server; tÃ­nh Ä‘iá»ƒm thÃ´ bÃ i táº­p | LÆ°u tráº¡ng thÃ¡i phiÃªn lÃ m bÃ i cÃ³ tháº©m quyá»n tá»« mÃ¡y chá»§ (chá»‘t táº¡i M3.1) | Gian láº­n gá»­i Ä‘Ã¡p Ã¡n sai cáº¥u trÃºc $\rightarrow$ 400 Invalid | `test_exercise_eval` |
| **7** | **Controlled Retry** | Luáº­t D7: `max(1, floor(N*0.10))` | Tiáº¿p nháº­n yÃªu cáº§u lÃ m láº¡i cÃ¢u sai trong lÆ°á»£t há»c | `COMP-DOM-05`: Kiá»ƒm tra háº¡n má»©c lÆ°á»£t; Ã¡p tráº§n 70% Ä‘iá»ƒm | Quáº£n lÃ½ tráº¡ng thÃ¡i attempt/retry state kiÃªn Ä‘á»‹nh tá»« mÃ¡y chá»§ (chá»‘t táº¡i M3.1) | VÆ°á»£t quÃ¡ háº¡n má»©c lÃ m láº¡i $\rightarrow$ 403 RETRY_ALLOWANCE_EXCEEDED | `TEST-FRAME-RETRY-ALLOWANCE` |
| **8** | **Progress** | Báº£ng `user_progress` | Gá»­i gÃ³i tá»•ng káº¿t bÃ i há»c sau khi hoÃ n thÃ nh | `COMP-DOM-02`: ÄÃ¡nh giÃ¡ hoÃ n thÃ nh bÃ i há»c; tÃ­nh Ä‘iá»ƒm cuá»‘i | `user_progress`: `COMPLETED`, `score`, `completed_at` | Rá»›t máº¡ng khi ná»™p Ä‘iá»ƒm $\rightarrow$ Client tá»± Ä‘á»™ng thá»­ láº¡i cÃ³ idempotent key | `test_progress_atomic` |
| **9** | **SRS Review** | Báº£ng `user_vocab_srs`, Policy B | Láº¥y hÃ ng Ä‘á»£i tá»« vá»±ng Ä‘áº¿n háº¡n Ã´n táº­p trong ngÃ y | `COMP-DOM-04`: Gá»i RPC `record_review` cáº­p nháº­t khoáº£ng cÃ¡ch ngÃ y | Báº£ng `user_vocab_srs`, `review_logs` qua RPC | Lá»—i RPC $\rightarrow$ Giá»¯ nguyÃªn tráº¡ng thÃ¡i tháº», khÃ´ng lÃ m máº¥t dá»¯ liá»‡u | `TEST-FRAME-SRS-POLICY-B` |
| **10**| **Streak** | `profiles.last_qualifying_activity_date`| Äá»c vÃ  hiá»ƒn thá»‹ sá»‘ ngÃ y há»c liÃªn tá»¥c | `COMP-DOM-02`: Quy Ä‘á»•i giá» UTC sang mÃºi giá» IANA cá»§a user | Cáº­p nháº­t `profiles.streak_count`, `last_qualifying_activity_date`| Lá»‡ch mÃºi giá» client $\rightarrow$ LuÃ´n dÃ¹ng thÆ° viá»‡n IANA chuáº©n trÃªn server | `TEST-FRAME-STREAK-TIMEZONE` |


---

## 8. Káº¾ HOáº CH TRIá»‚N KHAI ÄÃNH GIÃ NÄ‚NG Lá»°C & ÄIá»‚M XUáº¤T PHÃT (ASSESSMENT)

PhÃ¢n há»‡ Ä‘Ã¡nh giÃ¡ nÄƒng lá»±c báº£o toÃ n tuyá»‡t Ä‘á»‘i báº¥t biáº¿n: **Tá»± khai khÃ´ng pháº£i lÃ  nÄƒng lá»±c kiá»ƒm Ä‘á»‹nh (`Self-report != verified proficiency`)** vÃ  **Äiá»ƒm xuáº¥t phÃ¡t giÃ¡o trÃ¬nh khÃ´ng pháº£i lÃ  chá»©ng chá»‰ nÄƒng lá»±c CEFR**.

### 8.1. Quy Chuáº©n BÃ i Kiá»ƒm Tra Cháº©n ÄoÃ¡n (Placement / Diagnostic Test)
- **Quy mÃ´ bá»™ cÃ¢u há»i & Thang Ä‘iá»ƒm (Human-Selected Design Decision):**
  - **Sá»‘ lÆ°á»£ng cÃ¢u há»i bÃ i cháº©n Ä‘oÃ¡n:** ChÃ­nh thá»©c chá»‘t **30 cÃ¢u há»i** (`Diagnostic item count = 30`), phÃ¢n bá»• qua 4 khÃ­a cáº¡nh cá»‘t lÃµi: Vocabulary, Grammar, Reading vÃ  Listening. KhÃ´ng sá»­ dá»¥ng dáº£i cÃ¢u há»i má»Ÿ `~25â€“30` cÃ¢u.
  - **Thang Ä‘iá»ƒm thÃ´ (Raw Score):** Ãp dá»¥ng nguyÃªn táº¯c **1 cÃ¢u tráº£ lá»i Ä‘Ãºng = 1 Ä‘iá»ƒm thÃ´** (`1 correct answer = 1 raw point`), dáº£i Ä‘iá»ƒm sá»‘ thÃ´ náº±m trong khoáº£ng $0 \le \text{Raw Score} \le 30$. Tuyá»‡t Ä‘á»‘i khÃ´ng Ä‘á» xuáº¥t cÃ´ng thá»©c chuáº©n hÃ³a Ä‘iá»ƒm sá»‘ tuyáº¿n tÃ­nh.
  - **LÆ°u Ã½ Ä‘á»“ng bá»™ tÃ i liá»‡u:** *MASTER PLAN: 30 questions = HUMAN-SELECTED DESIGN DECISION. CANONICAL M2 DOCUMENTS: still require formal status synchronization before/with the next approved design update.* KhÃ´ng giáº£ Ä‘á»‹nh canonical `docs/*` Ä‘Ã£ tá»± Ä‘á»™ng cáº­p nháº­t vÃ  khÃ´ng táº¡o ADR má»›i trong task nÃ y.
- **Thuáº­t toÃ¡n phÃ¢n lá»›p Mapping A:** Äiá»ƒm sá»‘ thÃ´ Ä‘Æ°á»£c Ã¡nh xáº¡ táº¥t Ä‘á»‹nh sang ÄÆ¡n vá»‹ xuáº¥t phÃ¡t giÃ¡o trÃ¬nh (Starting Unit 1..6) theo báº£ng quy chuáº©n Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t:
  - $\text{Score } 0 - 7 \rightarrow \textbf{Unit 1}$
  - $\text{Score } 8 - 12 \rightarrow \textbf{Unit 2}$
  - $\text{Score } 13 - 17 \rightarrow \textbf{Unit 3}$
  - $\text{Score } 18 - 22 \rightarrow \textbf{Unit 4}$
  - $\text{Score } 23 - 26 \rightarrow \textbf{Unit 5}$
  - $\text{Score } 27 - 30 \rightarrow \textbf{Unit 6}$

### 8.2. NhÃ¡nh Bá» Qua Cháº©n ÄoÃ¡n (Branch A: Skip Diagnostic)
- Khi há»c viÃªn chá»n "Bá» qua bÃ i kiá»ƒm tra cháº©n Ä‘oÃ¡n":
  - Há»‡ thá»‘ng tá»± Ä‘á»™ng gÃ¡n `startingUnit = 1` vÃ  tráº¡ng thÃ¡i nÄƒng lá»±c lÃ  `UNVERIFIED`.
  - **Báº¥t biáº¿n sá»‘ lÆ°á»£ng báº£n ghi:** Tuyá»‡t Ä‘á»‘i phÃ¡t sinh **Ä‘Ãºng 0 báº£n ghi `AssessmentResult`** vÃ  **Ä‘Ãºng 0 báº£n ghi `SkillProfile`**.
  - Há»“ sÆ¡ `profiles` chá»‰ cáº­p nháº­t trÆ°á»ng `verified_starting_unit = 1` vá»›i Ä‘Ã¡nh dáº¥u chÆ°a qua kiá»ƒm Ä‘á»‹nh.

### 8.3. TÃ­nh Báº¥t Biáº¿n Cá»§a Káº¿t Quáº£ & Quy TrÃ¬nh Thi Láº¡i (Retake Protocol)
- **TÃ­nh báº¥t biáº¿n (Immutability):** Báº£ng `assessment_results` Ä‘Æ°á»£c cÃ i Ä‘áº·t chÃ­nh sÃ¡ch RLS chá»‰ cho phÃ©p chÃ¨n má»›i (`INSERT`), nghiÃªm cáº¥m hoÃ n toÃ n cÃ¡c thao tÃ¡c chá»‰nh sá»­a (`UPDATE`) hoáº·c xÃ³a (`DELETE`) Ä‘á»‘i vá»›i má»i vai trÃ².
- **Quy trÃ¬nh thi láº¡i (Retake from Profile):** Há»c viÃªn cÃ³ thá»ƒ thá»±c hiá»‡n thi láº¡i tá»« mÃ n hÃ¬nh há»“ sÆ¡ cÃ¡ nhÃ¢n:
  1. Má»—i láº§n ná»™p bÃ i thi láº¡i sáº½ táº¡o ra má»™t báº£n ghi `AssessmentResult` má»›i Ä‘á»™c láº­p vá»›i UUID má»›i vÃ  thá»i gian `completed_at` thá»i gian thá»±c. Báº£n ghi cÅ© Ä‘Æ°á»£c giá»¯ nguyÃªn váº¹n Ä‘á»ƒ phá»¥c vá»¥ phÃ¢n tÃ­ch tiáº¿n bá»™ há»c táº­p.
  2. Dá»‹ch vá»¥ á»©ng dá»¥ng (`COMP-DOM-03`) thá»±c hiá»‡n giao dá»‹ch nguyÃªn tá»­ (atomic database transaction):
     $$\text{AssessmentResult (Má»›i)} \longrightarrow \text{SkillProfile (Cáº­p nháº­t)} \longrightarrow \text{verifiedProficiency} \longrightarrow \text{profiles.verified_starting_unit}$$
  3. Káº¿t quáº£ cháº©n Ä‘oÃ¡n má»›i nháº¥t luÃ´n Ä‘Æ°á»£c xÃ¡c Ä‘á»‹nh báº±ng truy váº¥n: `SELECT * FROM assessment_results WHERE user_id = :uid ORDER BY completed_at DESC LIMIT 1`.

---

## 9. Káº¾ HOáº CH TRIá»‚N KHAI THá»¬ THÃCH NHáº¢Y CÃ“C, LÃ€M Láº I, SRS & CHUá»–I Há»ŒC (INTELLIGENCE)

### 9.1. Thá»­ ThÃ¡ch Nháº£y CÃ³c ÄÆ¡n Vá»‹ Há»c (Jump Challenge â€” D5)
- **Pháº¡m vi Ã¡p dá»¥ng:** Chá»‰ cho phÃ©p thá»±c hiá»‡n bÃ i Jump Ä‘á»‘i vá»›i **ÄÆ¡n vá»‹ há»c liá»n ká» tiáº¿p theo** ($\text{Unit}_{\text{current}} + 1$). Cáº¥m tuyá»‡t Ä‘á»‘i nháº£y cÃ³c vÆ°á»£t cáº¥p xa.
- **NgÆ°á»¡ng Ä‘iá»ƒm Ä‘áº¡t (Pass Threshold):** Báº¯t buá»™c pháº£i Ä‘áº¡t chÃ­nh xÃ¡c tá»« **$95.0\%$ trá»Ÿ lÃªn** ($\text{score} \ge 0.9500$). KhÃ´ng lÃ m trÃ²n sá»‘ há»c tá»« $94.9\%$ lÃªn $95\%$.
- **CÆ¡ cháº¿ khÃ³a há»“i chiÃªu (Cooldown Lockout):** Náº¿u há»c viÃªn lÃ m bÃ i Jump khÃ´ng Ä‘áº¡t ($< 95\%$), há»‡ thá»‘ng kÃ­ch hoáº¡t khÃ³a há»“i chiÃªu **báº¯t buá»™c 24 giá»** tÃ­nh theo Ä‘á»“ng há»“ UTC cá»§a mÃ¡y chá»§ cÆ¡ sá»Ÿ dá»¯ liá»‡u. Má»i yÃªu cáº§u lÃ m bÃ i Jump má»›i trong khoáº£ng thá»i gian nÃ y bá»‹ tá»« chá»‘i vá»›i mÃ£ lá»—i `429 / 403 JUMP_COOLDOWN_ACTIVE`.
- **Há»‡ quáº£ tiáº¿n Ä‘á»™ (Non-Completion Invariant):** VÆ°á»£t qua bÃ i Jump chá»‰ má»Ÿ khÃ³a Ä‘Æ¡n vá»‹ tiáº¿p theo. ToÃ n bá»™ cÃ¡c bÃ i há»c trong Ä‘Æ¡n vá»‹ bá»‹ nháº£y qua Ä‘Æ°á»£c gÃ¡n cá» `by_jump = true` (hoáº·c tráº¡ng thÃ¡i `SKIPPED_BY_JUMP`), **TUYá»†T Äá»I KHÃ”NG Ä‘Ã¡nh dáº¥u lÃ  `COMPLETED`** vÃ  khÃ´ng lÃ m tÄƒng tá»•ng sá»‘ bÃ i há»c hoÃ n thÃ nh trong thá»‘ng kÃª.

### 9.2. Háº¡n Má»©c LÃ m Láº¡i CÃ³ Kiá»ƒm SoÃ¡t (Controlled Retry â€” D7)
- **CÃ´ng thá»©c tÃ­nh háº¡n má»©c:** TÃ­nh toÃ¡n trÃªn pháº¡m vi **tá»«ng lÆ°á»£t lÃ m bÃ i há»c cá»¥ thá»ƒ (Per Lesson Attempt/Context)**:
  $$\text{allowance} = \max(1, \lfloor N \times 0.10 \rfloor)$$
  *(Trong Ä‘Ã³ $N$ lÃ  tá»•ng sá»‘ lÆ°á»£ng bÃ i táº­p tÆ°Æ¡ng tÃ¡c trong bÃ i há»c Ä‘Ã³).*
- **KhÃ´ng cÃ³ háº¡n ngáº¡ch gá»™p ngÃ y (No Daily Global Pool):** Háº¡n má»©c lÃ m láº¡i gáº¯n cháº·t vá»›i phiÃªn lÃ m bÃ i há»c, **tuyá»‡t Ä‘á»‘i KHÃ”NG pháº£i lÃ  háº¡n ngáº¡ch gá»™p hÃ ng ngÃ y** vÃ  khÃ´ng bá»‹ Ä‘áº·t láº¡i theo ranh giá»›i ná»­a Ä‘Ãªm.
- **Báº£o lÆ°u Ä‘iá»ƒm tráº§n 70% (70% Score Credit Cap):** Náº¿u há»c viÃªn lÃ m sai á»Ÿ láº§n Ä‘áº§u (0 Ä‘iá»ƒm) vÃ  lÃ m láº¡i chÃ­nh xÃ¡c á»Ÿ láº§n thá»© hai, Ä‘iá»ƒm sá»‘ ghi nháº­n thá»±c táº¿ tá»‘i Ä‘a Ä‘áº¡t:
  $$\text{effectiveScore} = \text{rawScore} \times 0.70$$
- **Äiá»u kiá»‡n hoÃ n thÃ nh bÃ i há»c:** Há»c viÃªn hoÃ n thÃ nh bÃ i há»c khi Ä‘Ã£ duyá»‡t qua 100% cÃ¡c bÃ i táº­p lÆ°á»£t má»™t vÃ  xá»­ lÃ½ háº¿t háº¡n má»©c lÃ m láº¡i cho phÃ©p. HoÃ n thÃ nh bÃ i há»c khÃ´ng phá»¥ thuá»™c vÃ o má»™t tráº§n Ä‘iá»ƒm sá»‘ cá»‘ Ä‘á»‹nh (vÃ­ dá»¥: khÃ´ng báº¯t buá»™c pháº£i Ä‘áº¡t 80% Ä‘iá»ƒm má»›i Ä‘Æ°á»£c coi lÃ  hoÃ n thÃ nh).

### 9.3. Thuáº­t ToÃ¡n Ã”n Táº­p Ngáº¯t QuÃ£ng Táº¥t Äá»‹nh (SRS Policy B â€” D8)
- **Chu ká»³ giÃ£n cÃ¡ch chuáº©n táº¯c:** TuÃ¢n thá»§ máº£ng háº±ng sá»‘ nguyÃªn ngÃ y:
  $$\text{Intervals} = [1, 3, 7, 14, 30] \text{ ngÃ y}$$
- **Quy táº¯c chuyá»ƒn cáº¥p:**
  - Tráº£ lá»i Ä‘Ãºng: Chuyá»ƒn lÃªn giai Ä‘oáº¡n tiáº¿p theo ($\text{Stage } k \rightarrow k+1$).
  - Tráº£ lá»i sai á»Ÿ báº¥t ká»³ giai Ä‘oáº¡n nÃ o: **Äáº·t láº¡i ngay láº­p tá»©c vá» Stage 1 (+1 ngÃ y)**.
- **TÃ­nh Ä‘á»™c láº­p vá»›i AI:** Thuáº­t toÃ¡n SRS Ä‘Æ°á»£c cÃ i Ä‘áº·t thuáº§n tÃºy báº±ng hÃ m lÆ°u trá»¯ ná»™i bá»™ PostgreSQL (RPC `record_review`), Ä‘á»™c láº­p 100% vá»›i container AI vÃ  client.

### 9.4. Äá»™ng CÆ¡ TÃ­nh Chuá»—i NgÃ y Há»c LiÃªn Tá»¥c (Daily Streak â€” D9)
- **HÃ nh Ä‘á»™ng Ä‘á»§ Ä‘iá»u kiá»‡n (Qualifying Activity):** HoÃ n thÃ nh tá»‘i thiá»ƒu 1 bÃ i há»c má»›i hoáº·c hoÃ n thÃ nh tá»‘i thiá»ƒu 1 phiÃªn Ã´n táº­p tá»« vá»±ng SRS trong ngÃ y.
- **Ranh giá»›i mÃºi giá» ngÆ°á»i dÃ¹ng:** TÃ­nh toÃ¡n ngÃ y há»c dá»±a trÃªn **mÃºi giá» IANA Ä‘Ã£ Ä‘Äƒng kÃ½ cá»§a há»c viÃªn** (máº·c Ä‘á»‹nh `Asia/Ho_Chi_Minh` cho thá»‹ trÆ°á»ng Viá»‡t Nam). Server quy Ä‘á»•i thá»i Ä‘iá»ƒm hoÃ n thÃ nh UTC sang ngÃ y dÆ°Æ¡ng lá»‹ch cá»¥c bá»™ cá»§a ngÆ°á»i dÃ¹ng trÆ°á»›c khi so sÃ¡nh vá»›i `lastQualifyingActivityDate`.
- **Quy táº¯c Ä‘á»©t gÃ£y chuá»—i:** Náº¿u há»c viÃªn bá» lá»¡ khÃ´ng há»c trong 1 ngÃ y dÆ°Æ¡ng lá»‹ch cá»¥c bá»™, chuá»—i hiá»‡n táº¡i (`currentStreak`) bá»‹ **Ä‘áº·t láº¡i vá» 1** vÃ o láº§n há»c tiáº¿p theo. Chuá»—i ká»· lá»¥c (`longestStreak`) Ä‘Æ°á»£c báº£o lÆ°u nguyÃªn váº¹n. MVP khÃ´ng há»— trá»£ tÃ­nh nÄƒng Ä‘Ã³ng bÄƒng chuá»—i (Streak Freeze).

### 9.5. Ma Tráº­n Kiá»ƒm Thá»­ Nghiá»‡p Vá»¥ & PhÃ²ng Vá»‡ Láº¡m Dá»¥ng

| ChÃ­nh SÃ¡ch | Ká»‹ch Báº£n Chuáº©n (Happy Path) | Ká»‹ch Báº£n BiÃªn (Boundary Case) | Ká»‹ch Báº£n Láº¡m Dá»¥ng / Táº¥n CÃ´ng (Abuse / Negative Case) |
|---|---|---|---|
| **Jump Challenge** | Äáº¡t 96% Ä‘iá»ƒm $\rightarrow$ Má»Ÿ khÃ³a Unit káº¿ tiáº¿p, gÃ¡n `by_jump = true`. | Äáº¡t chÃ­nh xÃ¡c 95.0% $\rightarrow$ PASS; Ä‘áº¡t 94.9% $\rightarrow$ FAIL, khÃ³a 24h. | Gá»­i yÃªu cáº§u Jump khi Ä‘ang trong 24h há»“i chiÃªu $\rightarrow$ 403 Forbidden; sá»­a Ä‘á»“ng há»“ client $\rightarrow$ Bá»‹ cháº·n bá»Ÿi Ä‘á»“ng há»“ server. |
| **Controlled Retry**| BÃ i há»c 20 cÃ¢u ($N=20$) $\rightarrow$ CÃ³ 2 lÆ°á»£t lÃ m láº¡i; lÃ m láº¡i Ä‘Ãºng nháº­n 70% Ä‘iá»ƒm. | BÃ i há»c 5 cÃ¢u ($N=5$) $\rightarrow$ $\max(1, \lfloor 0.5 \rfloor) = 1$ lÆ°á»£t lÃ m láº¡i tá»‘i thiá»ƒu. | Gá»­i yÃªu cáº§u lÃ m láº¡i láº§n thá»© 3 khi háº¡n má»©c chá»‰ cÃ³ 2 $\rightarrow$ 403 RETRY_ALLOWANCE_EXCEEDED. |
| **SRS Policy B** | Tráº£ lá»i Ä‘Ãºng qua cÃ¡c má»‘c $\rightarrow$ Nháº­n chu ká»³ +1, +3, +7, +14, +30 ngÃ y. | Tráº£ lá»i Ä‘Ãºng á»Ÿ Stage 5 $\rightarrow$ Duy trÃ¬ má»‘c Ã´n táº­p tá»‘i Ä‘a 30 ngÃ y. | Tráº£ lá»i sai á»Ÿ Stage 4 $\rightarrow$ Báº¯t buá»™c reset vá» Stage 1 (+1 ngÃ y); client gá»­i interval tÃ¹y biáº¿n $\rightarrow$ Bá»‹ tá»« chá»‘i bá»Ÿi RPC. |
| **Daily Streak** | Há»c Ä‘á»u Ä‘áº·n má»—i ngÃ y lÃºc 23:00 $\rightarrow$ TÄƒng chuá»—i liÃªn tá»¥c. | Há»c lÃºc 23:59 ngÃ y D vÃ  00:05 ngÃ y D+1 (giá» VN) $\rightarrow$ Ghi nháº­n 2 ngÃ y liÃªn tiáº¿p thÃ nh cÃ´ng. | Há»c viÃªn bá» há»c ngÃ y D+1, há»c láº¡i ngÃ y D+2 $\rightarrow$ Reset currentStreak vá» 1; client gá»­i ngÃ y giáº£ máº¡o $\rightarrow$ Bá»‹ cháº·n. |

---

## 10. Káº¾ HOáº CH TRIá»‚N KHAI QUáº¢N TRá»Š Ná»˜I DUNG & DUYá»†T BÃ€I Há»ŒC (CONTENT GOVERNANCE)

Há»‡ thá»‘ng quáº£n trá»‹ ná»™i dung trong `lingora-admin` hiá»‡n thá»±c hÃ³a quy trÃ¬nh kiá»ƒm duyá»‡t khÃ©p kÃ­n 6 tráº¡ng thÃ¡i, loáº¡i bá» hoÃ n toÃ n cÃ¡c lá»— há»•ng tá»± phÃª duyá»‡t vÃ  tá»± xuáº¥t báº£n.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Manager táº¡o nhiá»‡m vá»¥ & Creator biÃªn soáº¡n
    DRAFT --> IN_REVIEW : Creator ná»™p duyá»‡t bÃ i
    IN_REVIEW --> CHANGES_REQUESTED : Moderator yÃªu cáº§u chá»‰nh sá»­a
    CHANGES_REQUESTED --> DRAFT : Creator tiáº¿p nháº­n & chá»‰nh sá»­a
    IN_REVIEW --> APPROVED : Moderator phÃª duyá»‡t (Creator cáº¥m duyá»‡t)
    APPROVED --> PUBLISHED : Manager xuáº¥t báº£n ra cÃ´ng chÃºng
    APPROVED --> PUBLISHED : Admin xuáº¥t báº£n kháº©n cáº¥p (KÃ¨m lÃ½ do + Audit)
    PUBLISHED --> ARCHIVED : Manager lÆ°u trá»¯
    PUBLISHED --> ARCHIVED : Admin gá»¡ kháº©n cáº¥p (KÃ¨m lÃ½ do + Audit)
    PUBLISHED --> DRAFT : Clone-to-Draft v2 (Táº¡o Revision má»›i, supersedesId)
    ARCHIVED --> [*]
```

### 10.1. Chi Tiáº¿t CÃ¡c Chuyá»ƒn Dá»‹ch Tráº¡ng ThÃ¡i & Tháº©m Quyá»n Thá»±c Hiá»‡n:
1. **Khá»Ÿi táº¡o báº£n tháº£o (`DRAFT`):** Organizational Manager táº¡o nhiá»‡m vá»¥ bÃ i há»c vÃ  gÃ¡n `assigned_creator_id`. Lesson Creator Ä‘Æ°á»£c phÃ¢n cÃ´ng tiáº¿n hÃ nh soáº¡n tháº£o má»¥c tiÃªu, tá»« vá»±ng vÃ  bÃ i táº­p.
2. **Ná»™p bÃ i kiá»ƒm duyá»‡t (`DRAFT â†’ IN_REVIEW`):** Creator ná»™p bÃ i khi Ä‘Ã£ hoÃ n thiá»‡n ná»™i dung. BÃ i há»c chuyá»ƒn vÃ o hÃ ng Ä‘á»£i kiá»ƒm duyá»‡t táº­p trung.
3. **YÃªu cáº§u chá»‰nh sá»­a (`IN_REVIEW â†’ CHANGES_REQUESTED`):** Moderator Ä‘Ã¡nh giÃ¡ bÃ i há»c, náº¿u chÆ°a Ä‘áº¡t chuáº©n cháº¥t lÆ°á»£ng sáº½ gá»­i kÃ¨m ghi chÃº yÃªu cáº§u chá»‰nh sá»­a (`review_notes`). Tráº¡ng thÃ¡i chuyá»ƒn vá» Ä‘á»ƒ Creator cáº­p nháº­t.
4. **PhÃª duyá»‡t bÃ i há»c (`IN_REVIEW â†’ APPROVED`):** Moderator Ä‘Ã¡nh giÃ¡ Ä‘áº¡t cháº¥t lÆ°á»£ng vÃ  nháº¥n phÃª duyá»‡t. **RÃ ng buá»™c SoD:** Tháº©m quyá»n phÃª duyá»‡t dÃ nh riÃªng cho `MODERATOR`. Náº¿u tÃ i khoáº£n mang vai trÃ² `LESSON_CREATOR` hoáº·c vai trÃ² khÃ´ng cÃ³ tháº©m quyá»n gá»­i yÃªu cáº§u duyá»‡t bÃ i, há»‡ thá»‘ng tá»« chá»‘i vá»›i lá»—i phÃ¢n quyá»n chuáº©n táº¯c `403 Forbidden` / `ROLE_UNAUTHORIZED`.
5. **Xuáº¥t báº£n bÃ i há»c (`APPROVED â†’ PUBLISHED`):**
   - **Luá»“ng thÃ´ng thÆ°á»ng:** Do Organizational Manager thá»±c hiá»‡n sau khi rÃ  soÃ¡t káº¿ hoáº¡ch giÃ¡o trÃ¬nh.
   - **Luá»“ng kháº©n cáº¥p cá»§a Quáº£n trá»‹ viÃªn (Admin Emergency):** Administrator chá»‰ Ä‘Æ°á»£c xuáº¥t báº£n kháº©n cáº¥p khi bÃ i há»c **Ä‘Ã£ á»Ÿ tráº¡ng thÃ¡i `APPROVED`**, báº¯t buá»™c pháº£i nháº­p lÃ½ do giáº£i trÃ¬nh trong form, vÃ  há»‡ thá»‘ng tá»± Ä‘á»™ng ghi nháº­t kÃ½ kiá»ƒm toÃ¡n `CONTENT_EMERGENCY_PUB`. Tuyá»‡t Ä‘á»‘i cáº¥m xuáº¥t báº£n kháº©n cáº¥p tá»« `IN_REVIEW`.
6. **NhÃ¢n báº£n táº¡o báº£n tháº£o má»›i (Clone-to-Draft v2 qua `supersedes_id` â€” D3):**
   - Tuyá»‡t Ä‘á»‘i cáº¥m sá»­a trá»±c tiáº¿p trÃªn báº£n ghi bÃ i há»c Ä‘Ã£ `PUBLISHED`.
   - Khi cáº§n nÃ¢ng cáº¥p bÃ i há»c, há»‡ thá»‘ng thá»±c hiá»‡n sao chÃ©p toÃ n bá»™ ná»™i dung cá»§a phiÃªn báº£n Ä‘ang xuáº¥t báº£n sang má»™t báº£n ghi má»›i trong báº£ng `lesson_revisions` vá»›i `version = version_cu + 1`, tráº¡ng thÃ¡i `DRAFT`, vÃ  trÆ°á»ng `supersedes_id` trá» vá» báº£n ghi Ä‘Ã£ xuáº¥t báº£n. Báº£n há»c cÅ© váº«n phá»¥c vá»¥ há»c viÃªn bÃ¬nh thÆ°á»ng cho Ä‘áº¿n khi báº£n má»›i Ä‘Æ°á»£c duyá»‡t vÃ  xuáº¥t báº£n thay tháº¿.

### 10.2. Äiá»u Kiá»‡n Hiá»ƒn Thá»‹ ÄÆ¡n Vá»‹ GiÃ¡o TrÃ¬nh (Unit 4/4 Published Rule)
Äá»ƒ Ä‘áº£m báº£o tráº£i nghiá»‡m há»c táº­p khÃ´ng bá»‹ Ä‘á»©t Ä‘oáº¡n, táº§ng á»©ng dá»¥ng (`COMP-DOM-02`) vÃ  chÃ­nh sÃ¡ch cÆ¡ sá»Ÿ dá»¯ liá»‡u thá»±c thi nghiÃªm ngáº·t:
$$\text{Unit Visible to Learner} \iff \sum \text{Published Lessons in Unit} = 4$$
- Náº¿u má»™t Unit chá»‰ má»›i cÃ³ 1, 2 hoáº·c 3 bÃ i há»c Ä‘áº¡t tráº¡ng thÃ¡i `PUBLISHED`, toÃ n bá»™ Unit Ä‘Ã³ váº«n á»Ÿ tráº¡ng thÃ¡i áº©n Ä‘á»‘i vá»›i há»c viÃªn.
- **Chá»‘t cháº·n phÃ¢n quyá»n trá»±c tiáº¿p (Direct Access Denial â€” `UI hiding != Authorization`):** Viá»‡c áº©n Unit trÃªn giao diá»‡n danh má»¥c khÃ´ng thay tháº¿ cho kiá»ƒm soÃ¡t phÃ¢n quyá»n. Má»i truy váº¥n trá»±c tiáº¿p (direct access) tá»« phÃ­a há»c viÃªn nháº¯m vÃ o bÃ i há»c hoáº·c bÃ i táº­p thuá»™c má»™t Unit chÆ°a Ä‘á»§ 4/4 bÃ i xuáº¥t báº£n Ä‘á»u bá»‹ táº§ng BFF vÃ  RLS tá»« chá»‘i vá»›i mÃ£ lá»—i `404 Not Found` hoáº·c `403 Forbidden`. Tuyá»‡t Ä‘á»‘i khÃ´ng táº¡o cÆ¡ cháº¿ tá»± Ä‘á»™ng chuyá»ƒn hÆ°á»›ng hoáº·c fallback sang Unit gáº§n nháº¥t.

---

## 11. QUY CHUáº¨N GIAO DIá»†N Láº¬P TRÃŒNH API & Lá»šP ÄIá»€U PHá»I BFF

### 11.1. CÄƒn Cá»© Há»£p Äá»“ng & Quy Æ¯á»›c Route Minh Há»a
- **Há»£p Ä‘á»“ng AI `docs/03-api-contract.md`:** LÃ  tÃ i liá»‡u chuáº©n táº¯c Ä‘Ã³ng bÄƒng, **100% byte-identical vÃ  chá»‰ Ä‘á»c**. Má»i thay Ä‘á»•i trÃªn tá»‡p nÃ y Ä‘á»u bá»‹ há»‡ thá»‘ng phÃ¡t hiá»‡n vÃ  coi lÃ  vi pháº¡m ká»· luáº­t kiáº¿n trÃºc.
- **CÃº phÃ¡p Route minh há»a:** ToÃ n bá»™ cÃ¡c Ä‘á»‹nh dáº¡ng URL cá»¥ thá»ƒ xuáº¥t hiá»‡n dÆ°á»›i Ä‘Ã¢y Ä‘á»u Ä‘Æ°á»£c gáº¯n nhÃ£n: **`[ILLUSTRATIVE ROUTE EXAMPLE â€” NOT LOCKED]`**. Äá»‹nh danh giao tiáº¿p chuáº©n táº¯c vÃ  cÃ³ tháº©m quyá»n duy nháº¥t giá»¯a cÃ¡c thÃ nh pháº§n kiáº¿n trÃºc lÃ  cÃ¡c mÃ£ Ä‘á»‹nh danh bá» máº·t API (`API-AUTH-*`, `API-LEARN-*`, `API-ASSESS-*`, `API-PRACT-*`, `API-AUTHZ-*`, `API-AI-*`, `API-AUDIT-*`).
- **ChÃ­nh sÃ¡ch ranh giá»›i Ä‘á»‘i vá»›i cÃ¡c route AI káº¿ thá»«a (Legacy AI Surface Policy):** CÃ¡c route liÃªn quan Ä‘áº¿n AI Ä‘ang tá»“n táº¡i trong repository (nhÆ° `/api/ai/chat`, `/api/ai/srs` trong `lingora-web`) lÃ  cÃ¡c bá» máº·t káº¿ thá»«a/tÆ°Æ¡ng thÃ­ch (*legacy/compatibility surfaces*). ChÃºng khÃ´ng Ä‘Æ°á»£c gá»i bá»Ÿi báº¥t ká»³ luá»“ng há»c viÃªn nÃ o trong Phase 2 vÃ  hoÃ n toÃ n bá»‹ loáº¡i trá»« khá»i pháº¡m vi nghiá»‡m thu cá»§a Phase 2 (*excluded from Phase 2 acceptance*). Viá»‡c gá»¡ bá» hoáº·c vÃ´ hiá»‡u hÃ³a cÃ¡c route nÃ y lÃ  má»™t quyáº¿t Ä‘á»‹nh ká»¹ thuáº­t Ä‘á»™c láº­p náº¿u Ä‘Æ°á»£c yÃªu cáº§u bá»Ÿi Ä‘á»£t rÃ  soÃ¡t an ninh mÃ£ nguá»“n.

### 11.2. Danh Má»¥c Bá» Máº·t API Chi Tiáº¿t (API Surface Register)

| MÃ£ Bá» Máº·t API | Route Minh Há»a [NOT LOCKED] | ThÃ nh Pháº§n Sá»Ÿ Há»¯u | Ranh Giá»›i An Ninh | YÃªu Cáº§u XÃ¡c Thá»±c & Quyá»n | RLS / DB Dependency | MÃ£ Lá»—i Chuáº©n Táº¯c | YÃªu Cáº§u PhÃ¡t Tháº£i Kiá»ƒm ToÃ¡n |
|---|---|---|---|---|---|---|---|
| **API-AUTH-01** | `POST /api/auth/register` | `COMP-DOM-01` | B1 / B3 | CÃ´ng khai (Public) | Táº¡o báº£n ghi `profiles` qua GoTrue | `INVALID_INPUT`, `USER_ALREADY_EXISTS` | KhÃ´ng cÃ³ |
| **API-AUTH-02** | `POST /api/auth/login` | `COMP-DOM-01` | B1 / B3 | CÃ´ng khai (Public) | Äá»c `profiles` | `INVALID_CREDENTIALS` | `AUTH_LOGIN_FAILED` (náº¿u sai) |
| **API-AUTH-03** | `POST /api/auth/recover-password` | `COMP-DOM-01` | B1 / B3 | CÃ´ng khai (Public) | Khá»Ÿi táº¡o Ä‘áº·t láº¡i máº­t kháº©u qua Supabase Auth (P1-FR-001) | `INVALID_EMAIL` | `AUTH_PASSWORD_RECOVERY_REQ` |
| **API-AUTH-04** | `GET /api/auth/session` | `COMP-DOM-01` | B1 / B3 | Bearer JWT (Authenticated) | Äá»c phiÃªn lÃ m viá»‡c vÃ  há»“ sÆ¡ vai trÃ² | `UNAUTHORIZED` | KhÃ´ng cÃ³ |
| **API-LEARN-01**| `GET /api/curriculum/units` | `COMP-DOM-02` | B1 / B3 | Bearer JWT (Learner) | Äá»c `units` thá»a mÃ£n luáº­t 4/4 Published | `UNAUTHORIZED` | KhÃ´ng cÃ³ |
| **API-LEARN-02**| `GET /api/curriculum/lessons/{id}` | `COMP-DOM-05` | B1 / B3 | Bearer JWT (Learner) | Äá»c `lesson_revisions` status `PUBLISHED` (giáº¥u Ä‘Ã¡p Ã¡n) | `LESSON_NOT_FOUND`, `LESSON_LOCKED` | KhÃ´ng cÃ³ |
| **API-LEARN-03**| `POST /api/learning/lesson/submit`| `COMP-DOM-05` | B1 / B3 | Bearer JWT (Learner) | Ghi nguyÃªn tá»­ `user_progress` (xÃ¡c thá»±c retry D7) | `RETRY_ALLOWANCE_EXCEEDED` | KhÃ´ng cÃ³ |
| **API-ASSESS-01**|`POST /api/assessment/placement/start`| `COMP-DOM-03` | B1 / B3 | Bearer JWT (Learner) | Kiá»ƒm tra `profiles.verified_starting_unit` | `ASSESSMENT_ALREADY_COMPLETED` | KhÃ´ng cÃ³ |
| **API-ASSESS-02**|`POST /api/assessment/placement/submit`| `COMP-DOM-03`| B1 / B3 | Bearer JWT (Learner) | Ghi `assessment_results`, cáº­p nháº­t `profiles` (Mapping A) | `INVALID_INPUT` (ngoÃ i dáº£i 0â€“30) | `DIAGNOSTIC_COMPLETED` |
| **API-ASSESS-03**|`POST /api/assessment/placement/skip`| `COMP-DOM-03` | B1 / B3 | Bearer JWT (Learner) | Cáº­p nháº­t `profiles.verified_starting_unit = 1` (UNVERIFIED) | `ALREADY_VERIFIED` | KhÃ´ng cÃ³ |
| **API-ASSESS-04**|`POST /api/assessment/jump/start` | `COMP-DOM-03` | B1 / B3 | Bearer JWT (Learner) | Kiá»ƒm tra thá»i gian há»“i chiÃªu 24h | `429 JUMP_COOLDOWN_ACTIVE` | `JUMP_LOCKOUT_TRIGGERED` (náº¿u trÆ°á»£t) |
| **API-ASSESS-05**|`POST /api/assessment/jump/submit`| `COMP-DOM-03` | B1 / B3 | Bearer JWT (Learner) | Ghi `by_jump = true` trong `user_progress` | `INVALID_INPUT` | KhÃ´ng cÃ³ |
| **API-ASSESS-06**|`POST /api/assessment/placement/retake`| `COMP-DOM-03` | B1 / B3 | Bearer JWT (Learner) | Táº¡o má»›i `assessment_results` báº¥t biáº¿n, cáº­p nháº­t starting unit | `ALREADY_IN_PROGRESS` | `DIAGNOSTIC_RETAKEN` |
| **API-PRACT-01**| `GET /api/practice/srs/queue` | `COMP-DOM-04` | B1 / B3 | Bearer JWT (Learner) | Äá»c `user_vocab_srs` Ä‘áº¿n háº¡n | `UNAUTHORIZED` | KhÃ´ng cÃ³ |
| **API-PRACT-02**| `POST /api/practice/srs/review` | `COMP-DOM-04` | B1 / B3 | Bearer JWT (Learner) | Thá»±c thi RPC `record_review` Policy B [1,3,7,14,30] | `INVALID_STAGE` | KhÃ´ng cÃ³ |
| **API-GOV-01** | `POST /api/admin/content/assign` | `COMP-DOM-06` | B2 / B3 | JWT (Manager) | Táº¡o báº£n ghi phÃ¢n cÃ´ng trong `lesson_revisions` | `CREATOR_NOT_FOUND` | `CONTENT_ASSIGNED` |
| **API-GOV-02** | `POST /api/admin/content/submit` | `COMP-DOM-06` | B2 / B3 | JWT (Creator) | Cáº­p nháº­t revision tá»« `DRAFT` sang `IN_REVIEW` | `NOT_ASSIGNED_CREATOR` | `CONTENT_SUBMITTED` |
| **API-AUTHZ-01**| `POST /api/admin/content/review`| `COMP-DOM-06` | B2 / B3 | JWT (Moderator) | Cáº­p nháº­t `status = APPROVED/CHANGES_REQ` | `403 ROLE_UNAUTHORIZED` | `CONTENT_APPROVED`, `CONTENT_CHANGES_REQ` |
| **API-AUTHZ-02**| `POST /api/admin/content/publish`| `COMP-DOM-06` | B2 / B3 | JWT (Manager) | Cáº­p nháº­t `status = PUBLISHED` | `403 FORBIDDEN` | `CONTENT_PUBLISHED` |
| **API-GOV-03** | `POST /api/admin/content/clone` | `COMP-DOM-06` | B2 / B3 | JWT (Creator/Manager)| NhÃ¢n báº£n bÃ i há»c published sang revision v2 (`supersedes_id`) | `LESSON_NOT_PUBLISHED` | `CONTENT_CLONED` |
| **API-GOV-04** | `POST /api/admin/content/archive` | `COMP-DOM-06` | B2 / B3 | JWT (Manager/Admin) | Chuyá»ƒn tráº¡ng thÃ¡i revision sang `ARCHIVED` | `CANNOT_ARCHIVE_ACTIVE` | `CONTENT_ARCHIVED` |
| **API-GOV-05** | `POST /api/admin/content/draft` | `COMP-DOM-06` | B2 / B3 | JWT (Creator) | LÆ°u báº£n tháº£o bÃ i há»c táº¡m thá»i (Draft Save) trÆ°á»›c khi ná»™p duyá»‡t | `FORBIDDEN` | `CONTENT_DRAFT_SAVED` |
| **API-GOV-06** | `GET /api/admin/content/review-queue` | `COMP-DOM-06` | B2 / B3 | JWT (Moderator) | Tra cá»©u danh sÃ¡ch bÃ i há»c Ä‘ang chá» duyá»‡t (`status = 'IN_REVIEW'`) | `FORBIDDEN` | KhÃ´ng cÃ³ |
| **API-USER-01** | `PATCH /api/user/profile` | `COMP-DOM-01` | B1 / B3 | Bearer JWT (Learner) | Cáº­p nháº­t thÃ´ng tin cho phÃ©p (mÃºi giá» IANA, uiLocale, nativeLangCode per SEC-D3) | `INVALID_TIMEZONE` | `USER_PROFILE_UPDATED` |
| **API-USER-02** | `GET /api/user/streak` | `COMP-DOM-02` | B1 / B3 | Bearer JWT (Learner) | Äá»c chuá»—i ngÃ y há»c hiá»‡n táº¡i (`currentStreak`) vÃ  ngÃ y Ä‘á»§ Ä‘iá»u kiá»‡n | `UNAUTHORIZED` | KhÃ´ng cÃ³ |
| **API-AUTHZ-03**| `POST /api/admin/content/emergency-publish`| `COMP-DOM-07` | B2 / B3 / B6 | JWT (Administrator)| Cáº­p nháº­t `status = PUBLISHED`, kÃ¨m reason báº¯t buá»™c | `403 EMERGENCY_UNAPPROVED`, `403 MISSING_JUSTIFICATION` | `CONTENT_EMERGENCY_PUB` |
| **API-ADMIN-ROLE-01**| `POST /api/admin/users/{id}/role` | `COMP-DOM-07` | B2 / B3 | JWT (Administrator)| Quáº£n trá»‹ vai trÃ² tÃ i khoáº£n ngÆ°á»i dÃ¹ng trong `profiles` | `FORBIDDEN` | `USER_ROLE_CHANGED` |
| **API-SUPPORT-01** | `GET /api/support/tickets` | `COMP-DOM-07` | B2 / B3 | JWT (Operations Staff / Admin)| Tra cá»©u vÃ  Ä‘iá»u phá»‘i há»— trá»£ ngÆ°á»i dÃ¹ng theo ca sá»­ dá»¥ng UC-14 | `FORBIDDEN` | `SUPPORT_TICKET_INSPECTED` |
| **API-AI-GEC-01** [OUT OF PHASE 2 SCOPE]| `POST /v1/gec/correct` (Ná»™i bá»™) | `COMP-EXT-02` [OUT OF SCOPE] | B1 $\rightarrow$ B5 | Tham chiáº¿u há»— trá»£ há»£p Ä‘á»“ng 03 | Stateless (KhÃ´ng gá»i trong Phase 2) | N/A (KhÃ´ng triá»ƒn khai Phase 2) | KhÃ´ng cÃ³ |
| **API-AUDIT-01**| `GET /api/admin/audit-logs` | `COMP-DOM-07` | B2 / B6 | JWT (Administrator)| Äá»c báº£ng `audit_logs` Append-Only (chá»‰ Admin) | `UNAUTHORIZED`, `FORBIDDEN` | `AUDIT_LOG_INSPECTED` |

---

## 12. CHIáº¾N LÆ¯á»¢C KIá»‚M THá»¬ Tá»° Äá»˜NG & Bá»˜ KHUNG KIá»‚M THá»¬ KHáº¢ THI

Chiáº¿n lÆ°á»£c kiá»ƒm thá»­ cá»§a Phase 2 Ä‘Æ°á»£c xÃ¢y dá»±ng theo mÃ´ hÃ¬nh **Kim Tá»± ThÃ¡p Kiá»ƒm Thá»­ (Test Pyramid)** hoÃ n chá»‰nh, báº£o Ä‘áº£m má»i báº¥t biáº¿n nghiá»‡p vá»¥ vÃ  ranh giá»›i an ninh Ä‘á»u cÃ³ kiá»ƒm thá»­ tá»± Ä‘á»™ng xÃ¡c thá»±c khÃ¡ch quan trÆ°á»›c khi Ä‘Æ°á»£c cháº¥p thuáº­n.

```text
               / \
              /   \
             / E2E \             -> Playwright Browser Tests (End-to-End User Journeys)
            /-------\
           / Security\           -> RLS Multi-Role Matrix, SoD Denial & Abuse Penetration
          /-----------\
         / Integration \         -> BFF API Route Handlers, Database RPC & Service Integration
        /---------------\
       / Domain & Logic  \       -> Mapping A, Retry Math, SRS Policy B, Streak Timezone
      /-------------------\
     /     Unit Tests      \     -> Individual utility functions, validators, Zod schemas
    /-----------------------\
```

### 12.1. Quy Chuáº©n CÃ´ng Cá»¥ Thá»±c Thi Kiá»ƒm Thá»­ Theo GÃ³i MÃ£ Nguá»“n (Test Runner Normalization)

| PhÃ¢n VÃ¹ng Kiá»ƒm Thá»­ (Area) | GÃ³i Sá»Ÿ Há»¯u (Package) | CÃ´ng Cá»¥ Cháº¡y (Runner) | Lá»‡nh Thá»±c Thi Thá»±c Táº¿ (Executable Command) | Pháº¡m Vi Kiá»ƒm Thá»­ (Covers) |
|---|---|---|---|---|
| **Learner Core & Domain Logic** | `lingora-web` | Vitest 4.x | `npx vitest run tests/unit/domain/<file>` | Mapping A, Retry math D7, SRS Policy B client logic, Streak timezone D9. |
| **BFF Handlers & Integration** | `lingora-web` | Vitest 4.x | `npx vitest run tests/integration/api/<file>` | BFF Route Handlers, Placement start/skip/submit, Jump cooldown, SRS review. |
| **Multi-Role Security & SoD** | `lingora-web` | Vitest 4.x | `npx vitest run tests/security/<file>` | 6-Role token auth, Cross-user RLS isolation, SoD Creator approval denial and Moderator publish denial. |
| **Database Schema & Prisma Migrations**| `lingora-admin` | Prisma CLI | `npx prisma validate --schema prisma/schema.prisma` | Kiá»ƒm tra tÃ­nh toÃ n váº¹n 18+ models, quan há»‡ khÃ³a ngoáº¡i vÃ  enum váº­t lÃ½. |
| **End-to-End User Journeys** | `lingora-web` | Playwright 1.x| `npx playwright test tests/e2e/<file>` | 14 Use Cases cá»‘t lÃµi (UC-1..UC-14), luá»“ng liÃªn káº¿t nhiá»u ngÆ°á»i dÃ¹ng, chuyá»ƒn trang. |
| **AI Service Stubs (Historical)** | `lingora-ai/api` | Pytest 8.x | `pytest tests/` | `[HISTORICAL / OUT OF PHASE 2 TEST EXECUTION SCOPE]` |

### 12.2. Chuyá»ƒn Äá»•i 18 Khung Ká»‹ch Báº£n M2.6 ThÃ nh Bá»™ Kiá»ƒm Thá»­ Kháº£ Thi (Executable Test Specs)

| Khung Test M2.6 | TÃªn Ká»‹ch Báº£n Kiá»ƒm Thá»­ | Tá»‡p MÃ£ Nguá»“n Kiá»ƒm Thá»­ Dá»± Kiáº¿n | Lá»‡nh Thá»±c Thi Kiá»ƒm Thá»­ TÆ°Æ¡ng á»¨ng | Äiá»u Kiá»‡n Äáº¡t KhÃ¡ch Quan (Pass Assertion) |
|---|---|---|---|---|
| **Frame 1** | `TEST-MAPPING-A` | `lingora-web/tests/unit/domain/mapping_a.test.ts` | `npx vitest run tests/unit/domain/mapping_a.test.ts` | 12 vector Ä‘iá»ƒm biÃªn (0..30) Ã¡nh xáº¡ chÃ­nh xÃ¡c 100% ra Unit 1..6; khÃ´ng táº¡o nhÃ£n CEFR. |
| **Frame 2** | `TEST-DIAG-SKIP` | `lingora-web/tests/integration/api/placement_skip.test.ts` | `npx vitest run tests/integration/api/placement_skip.test.ts` | Tráº£ vá» `startingUnit = 1`, `UNVERIFIED`; `COUNT(assessment_results) == 0`. |
| **Frame 3** | `TEST-DIAG-RETAKE` | `lingora-web/tests/integration/api/placement_retake.test.ts`| `npx vitest run tests/integration/api/placement_retake.test.ts` | Báº£n ghi cÅ© giá»¯ nguyÃªn; táº¡o báº£n ghi má»›i vá»›i UUID má»›i; `verified_starting_unit` cáº­p nháº­t. |
| **Frame 4** | `TEST-JUMP-PASS` | `lingora-web/tests/unit/domain/jump_threshold.test.ts` | `npx vitest run tests/unit/domain/jump_threshold.test.ts` | Äiá»ƒm 94.9% $\rightarrow$ FAIL (`isPassed = false`); Ä‘iá»ƒm 95.0% $\rightarrow$ PASS (`isPassed = true`). |
| **Frame 5** | `TEST-JUMP-COOLDOWN`| `lingora-web/tests/integration/api/jump_cooldown.test.ts` | `npx vitest run tests/integration/api/jump_cooldown.test.ts` | Gá»i Jump lÃºc $T_0 + 23h59m \rightarrow 403 / 429$; gá»i lÃºc $T_0 + 24h01m \rightarrow 200 OK$. |
| **Frame 6** | `TEST-JUMP-NON-COMP`| `lingora-web/tests/integration/domain/jump_progression.test.ts` | `npx vitest run tests/integration/domain/jump_progression.test.ts` | BÃ i há»c bá»‹ nháº£y cÃ³ `by_jump = true`, status `SKIPPED_BY_JUMP`; khÃ´ng tÃ­nh hoÃ n thÃ nh. |
| **Frame 7** | `TEST-RETRY-ALLOW` | `lingora-web/tests/unit/domain/retry_allowance.test.ts` | `npx vitest run tests/unit/domain/retry_allowance.test.ts` | BÃ i 15 cÃ¢u $\rightarrow$ 1 lÆ°á»£t; bÃ i 25 cÃ¢u $\rightarrow$ 2 lÆ°á»£t; vÆ°á»£t quÃ¡ lÆ°á»£t $\rightarrow 403 RETRY_EXCEEDED$. |
| **Frame 8** | `TEST-RETRY-CREDIT` | `lingora-web/tests/unit/domain/retry_credit.test.ts` | `npx vitest run tests/unit/domain/retry_credit.test.ts` | BÃ i 10 Ä‘iá»ƒm lÃ m láº¡i Ä‘Ãºng $\rightarrow$ Nháº­n chÃ­nh xÃ¡c $7.0$ Ä‘iá»ƒm ($70\%$); khÃ´ng bao giá» vÆ°á»£t 70%. |
| **Frame 9** | `TEST-SRS-POLICY-B` | `lingora-web/tests/integration/api/srs_policy_b.test.ts` | `npx vitest run tests/integration/api/srs_policy_b.test.ts` | RPC `record_review` tráº£ vá» khoáº£ng cÃ¡ch Ä‘Ãºng: 1, 3, 7, 14, 30; sai $\rightarrow$ reset vá» 1 ngÃ y. |
| **Frame 10**| `TEST-STREAK-TZ` | `lingora-web/tests/unit/domain/streak_timezone.test.ts` | `npx vitest run tests/unit/domain/streak_timezone.test.ts` | BÃ i hoÃ n thÃ nh 23:30 UTC ngÃ y 26 $\rightarrow$ Ghi nháº­n thuá»™c ngÃ y 27 theo giá» Viá»‡t Nam (UTC+7). |
| **Frame 11**| `TEST-STREAK-RESET` | `lingora-web/tests/unit/domain/streak_reset.test.ts` | `npx vitest run tests/unit/domain/streak_reset.test.ts` | Bá» há»c ngÃ y D+1, há»c ngÃ y D+2 $\rightarrow currentStreak = 1$, $longestStreak$ báº£o lÆ°u. |
| **Frame 12**| `TEST-RBAC-MATRIX` | `lingora-web/tests/security/rbac_matrix.test.ts` | `npx vitest run tests/security/rbac_matrix.test.ts` | QuÃ©t 15 thao tÃ¡c nghiá»‡p vá»¥ trÃªn 6 token vai trÃ²; 100% yÃªu cáº§u trÃ¡i phÃ©p tráº£ vá» 403. |
| **Frame 13**| `TEST-RLS-ISOLATE` | `lingora-web/tests/security/rls_isolation.test.ts` | `npx vitest run tests/security/rls_isolation.test.ts` | User A gá»­i truy váº¥n trá»±c tiáº¿p nháº¯m vÃ o User B $\rightarrow$ Káº¿t quáº£ tráº£ vá» rá»—ng (0 báº£n ghi). |
| **Frame 14**| `TEST-SOD-CREATOR-APP`| `lingora-web/tests/security/sod_creator_approve.test.ts`| `npx vitest run tests/security/sod_creator_approve.test.ts`| Creator cá»‘ tÃ¬nh gá»i lá»‡nh duyá»‡t bÃ i $\rightarrow$ Bá»‹ tá»« chá»‘i phÃ¢n quyá»n vá»›i lá»—i `403 Forbidden` / `ROLE_UNAUTHORIZED`. |
| **Frame 15**| `TEST-SOD-MOD-PUB` | `lingora-web/tests/security/sod_moderator_publish.test.ts`| `npx vitest run tests/security/sod_moderator_publish.test.ts` | Moderator cá»‘ tÃ¬nh xuáº¥t báº£n bÃ i há»c $\rightarrow$ Bá»‹ cháº·n vá»›i lá»—i `403 SOD_VIOLATION_MODERATOR_PUBLISH`. |
| **Frame 16**| `TEST-SOD-EMERGENCY-PUB`| `lingora-web/tests/security/sod_emergency_publish.test.ts`| `npx vitest run tests/security/sod_emergency_publish.test.ts`| Admin xuáº¥t báº£n bÃ i Approved thiáº¿u lÃ½ do $\rightarrow$ 403 MISSING_JUSTIFICATION; xuáº¥t báº£n bÃ i chÆ°a Approved $\rightarrow$ 403 EMERGENCY_UNAPPROVED. |
| **Frame 17** [Historical M2.6]| `TEST-GEC-TIMEOUT` | `lingora-web/tests/integration/ai/gec_timeout.test.ts` | `[OUT OF PHASE 2 SCOPE]` | Khung kiá»ƒm thá»­ AI M2.6; khÃ´ng thuá»™c pháº¡m vi thá»±c thi kiá»ƒm thá»­ Phase 2. |
| **Frame 18** [Historical M2.6]| `TEST-AI-ISOLATE` | `lingora-ai/api/tests/test_network_isolation.py` | `[OUT OF PHASE 2 SCOPE]` | Khung kiá»ƒm thá»­ AI M2.6; khÃ´ng thuá»™c pháº¡m vi thá»±c thi kiá»ƒm thá»­ Phase 2. |

> **PhÃ¢n bá»• khung kiá»ƒm thá»­ theo má»‘c triá»ƒn khai (Canonical Test Frame Mapping):**
> - **M3.2 (Security / Auth / RLS / SoD):** Bao trÃ¹m **Frames 12â€“16** (RBAC, RLS Isolation, Creator Approval Denial, Moderator Publish Denial, Admin Emergency Publish).
> - **M3.4 (Assessment & Placement Engine):** Bao trÃ¹m **Frames 1â€“3** (Mapping A 12 boundary points, Skip Diagnostic 0-record, Retake Immutability).
> - **M3.5 (Learning Intelligence Engine):** Bao trÃ¹m **Frames 4â€“11** (Jump Threshold, Jump Cooldown, Jump Non-Completing, Retry Allowance, Retry Credit Cap, SRS Policy B, Streak Timezone, Streak Reset).
> - **Frames 17â€“18:** Khung kiá»ƒm thá»­ AI M2.6 Ä‘Æ°á»£c lÆ°u váº¿t á»Ÿ má»©c tham chiáº¿u lá»‹ch sá»­, hoÃ n toÃ n khÃ´ng thuá»™c pháº¡m vi nghiá»‡m thu Phase 2.

### 12.3. Lá»™ TrÃ¬nh Kiá»ƒm Thá»­ KhÃ³i TÃ­ch Há»£p Sá»›m (Progressive Smoke Verification)

Nháº±m phÃ¡t hiá»‡n sá»›m lá»—i tÃ­ch há»£p giá»¯a cÃ¡c táº§ng trÆ°á»›c khi bÆ°á»›c vÃ o kiá»ƒm thá»­ E2E tá»•ng thá»ƒ táº¡i M3.8, cÃ¡c má»‘c ná»n táº£ng báº¯t buá»™c pháº£i vÆ°á»£t qua cÃ¡c bÃ i kiá»ƒm thá»­ khÃ³i (Smoke Tests):

| Má»‘c Triá»ƒn Khai | BÃ i Kiá»ƒm Thá»­ KhÃ³i (Smoke Journey) | Ká»‹ch Báº£n Kiá»ƒm Tra Tá»‘i Thiá»ƒu | Äiá»u Kiá»‡n VÆ°á»£t Cá»•ng (Gate Exit) |
|---|---|---|---|
| **M3.2** | Auth & 6-Role Token Smoke | ÄÄƒng nháº­p láº§n lÆ°á»£t 6 tÃ i khoáº£n máº«u, nháº­n JWT chá»©a Ä‘Ãºng role claim | 6/6 tokens há»£p lá»‡, giáº£i mÃ£ Ä‘Ãºng role |
| **M3.3** | Learner Lesson Player Smoke | Má»Ÿ bÃ i há»c thuá»™c Unit 3 Ä‘Ã£ Published, táº£i 5 cÃ¢u há»i, tráº£ lá»i 1 cÃ¢u | Render 5 dáº¡ng bÃ i táº­p, nháº­n pháº£n há»“i cháº¥m Ä‘iá»ƒm |
| **M3.4** | Placement & Starting Unit Smoke | Há»c viÃªn má»›i lÃ m 30 cÃ¢u placement, tÃ­nh Ä‘iá»ƒm Mapping A, gÃ¡n Unit xuáº¥t phÃ¡t | Cáº­p nháº­t `verified_starting_unit`, táº¡o `AssessmentResult` |
| **M3.5** | Intelligence & SRS Smoke | Tráº£ lá»i sai kÃ­ch hoáº¡t retry (tráº§n 70%), gá»i RPC `record_review` cáº­p nháº­t Policy B | Retry credit 70% PASS, SRS card nháº£y ngÃ y PASS |
| **M3.6** | Content Lifecycle Smoke | Manager phÃ¢n cÃ´ng $\rightarrow$ Creator soáº¡n Draft $\rightarrow$ ná»™p Review $\rightarrow$ Moderator Approve $\rightarrow$ Publish | Chu trÃ¬nh 6 tráº¡ng thÃ¡i vÃ  Clone-to-Draft v2 PASS |
| **M3.8** | Full End-to-End Learner Journey | ToÃ n bá»™ 14 Ca sá»­ dá»¥ng cá»‘t lÃµi (UC-01 Ä‘áº¿n UC-14) liÃªn káº¿t khÃ´ng Ä‘á»©t gÃ£y | 100% Playwright E2E suites PASS |
| **M3.9** | Security & Performance Hardening Smoke | Cháº¡y k6 API benchmark (P95 latency), quÃ©t an ninh JWT & RLS bypass | P95 < 500ms, 0 lá»—i Sev-1/Sev-2, secret scan clean |

> **NguyÃªn táº¯c liÃªm chÃ­nh trong kiá»ƒm thá»­ (Test Integrity Principle):**
> Tuyá»‡t Ä‘á»‘i khÃ´ng tuyÃªn bá»‘ cÃ¡c ká»‹ch báº£n kiá»ƒm thá»­ Ä‘Ã£ Ä‘áº¡t (`PASS`) chá»‰ vÃ¬ cÃ¢u lá»‡nh kiá»ƒm thá»­ Ä‘Ã£ Ä‘Æ°á»£c liá»‡t kÃª trong báº£ng Ä‘áº·c táº£. Má»—i bÃ i kiá»ƒm thá»­ chá»‰ Ä‘Æ°á»£c cÃ´ng nháº­n vÆ°á»£t qua cá»•ng nghiá»‡m thu khi cÃ³ **báº±ng chá»©ng thá»±c thi thá»±c táº¿ (Command output & exit code 0)** Ä‘Æ°á»£c ghi nháº­n trá»±c tiáº¿p vÃ o `logs/test-log.md` trong quÃ¡ trÃ¬nh thá»±c hiá»‡n má»‘c tÆ°Æ¡ng á»©ng. Má»i cÃ¢u lá»‡nh kiá»ƒm thá»­ trong tÃ i liá»‡u Ä‘á»u pháº£i thuá»™c vá» cÃ¡c gÃ³i mÃ£ nguá»“n thá»±c táº¿ vÃ  cÃ´ng cá»¥ runner Ä‘Ã£ Ä‘Æ°á»£c cÃ i Ä‘áº·t trong repository.

---

## 13. Bá»˜ Dá»® LIá»†U KIá»‚M THá»¬ & Dá»® LIá»†U MáºªU TRÃŒNH DIá»„N (SEED DATA)

Äá»ƒ Ä‘áº£m báº£o kháº£ nÄƒng tÃ¡i láº·p (reproducibility) trong kiá»ƒm thá»­, ghi hÃ¬nh trÃ¬nh diá»…n (demo) vÃ  thu tháº­p báº±ng chá»©ng bÃ¡o cÃ¡o, toÃ n bá»™ dá»¯ liá»‡u máº«u Ä‘Æ°á»£c chuáº©n hÃ³a táº¥t Ä‘á»‹nh thÃ´ng qua tá»‡p ká»‹ch báº£n náº¡p dá»¯ liá»‡u máº§m `prisma/seed.ts`.

### 13.1. Danh SÃ¡ch TÃ i Khoáº£n Máº«u Äáº¡i Diá»‡n 6 Vai TrÃ² Chuáº©n Táº¯c

> **NguyÃªn táº¯c an toÃ n máº­t thá»±c & quáº£n lÃ½ tÃ i khoáº£n máº«u (Security Hygiene):**
> *Demo account credentials are seed-only and must be injected through environment variables / local secret configuration. KhÃ´ng commit production credentials vÃ o repository.*
> ToÃ n bá»™ máº­t kháº©u tÃ i khoáº£n máº§m chá»‰ phá»¥c vá»¥ mÃ´i trÆ°á»ng kiá»ƒm thá»­/seed cá»¥c bá»™ vÃ  Ä‘Æ°á»£c náº¡p qua cáº¥u hÃ¬nh biáº¿n mÃ´i trÆ°á»ng cá»¥c bá»™ (vÃ­ dá»¥: `SEED_DEFAULT_PASSWORD`), tuyá»‡t Ä‘á»‘i khÃ´ng coi cÃ¡c thÃ´ng tin nÃ y lÃ  thÃ´ng tin Ä‘Äƒng nháº­p production.

| Vai TrÃ² Chuáº©n Táº¯c | Email Äáº¡i Diá»‡n (Demo Persona) | PhÆ°Æ¡ng Thá»©c XÃ¡c Thá»±c Máº§m | Má»¥c ÄÃ­ch Sá»­ Dá»¥ng |
|---|---|---|---|
| **Administrator** | `admin.demo@lingora.edu.vn` | Biáº¿n mÃ´i trÆ°á»ng / Secret cá»¥c bá»™ | TrÃ¬nh diá»…n quáº£n trá»‹ tÃ i khoáº£n, kiá»ƒm tra audit log, xuáº¥t báº£n kháº©n cáº¥p cÃ³ lÃ½ do. |
| **Organizational Manager** | `manager.demo@lingora.edu.vn` | Biáº¿n mÃ´i trÆ°á»ng / Secret cá»¥c bá»™ | TrÃ¬nh diá»…n láº­p káº¿ hoáº¡ch bÃ i há»c, phÃ¢n cÃ´ng biÃªn soáº¡n, xuáº¥t báº£n bÃ i há»c chÃ­nh thá»©c. |
| **Lesson Creator** | `creator.demo@lingora.edu.vn` | Biáº¿n mÃ´i trÆ°á»ng / Secret cá»¥c bá»™ | TrÃ¬nh diá»…n tiáº¿p nháº­n phÃ¢n cÃ´ng, soáº¡n tháº£o bÃ i há»c báº£n tháº£o (Draft), ná»™p bÃ i kiá»ƒm duyá»‡t. |
| **Moderator** | `moderator.demo@lingora.edu.vn` | Biáº¿n mÃ´i trÆ°á»ng / Secret cá»¥c bá»™ | TrÃ¬nh diá»…n hÃ ng Ä‘á»£i kiá»ƒm duyá»‡t, yÃªu cáº§u sá»­a bÃ i, phÃª duyá»‡t bÃ i há»c (Approved). |
| **Learner** (ÄÃ£ kiá»ƒm Ä‘á»‹nh)| `learner.demo@lingora.edu.vn` | Biáº¿n mÃ´i trÆ°á»ng / Secret cá»¥c bá»™ | TrÃ¬nh diá»…n luá»“ng há»c bÃ i, tÆ°Æ¡ng tÃ¡c bÃ i táº­p, lÃ m láº¡i, Ã´n táº­p SRS, chuá»—i ngÃ y há»c. |
| **Operations Staff** | `staff.demo@lingora.edu.vn` | Biáº¿n mÃ´i trÆ°á»ng / Secret cá»¥c bá»™ | TrÃ¬nh diá»…n xá»­ lÃ½ / Ä‘iá»u phá»‘i há»— trá»£ váº­n hÃ nh ngÆ°á»i dÃ¹ng theo tháº©m quyá»n Ä‘Æ°á»£c cáº¥p. |

### 13.2. Danh SÃ¡ch 7 Há»“ SÆ¡ Há»c ViÃªn Máº«u (Learner Personas for Test & Demo)
1. `learner.new@lingora.edu.vn`: Há»c viÃªn má»›i tinh, chÆ°a lÃ m bÃ i cháº©n Ä‘oÃ¡n (sáºµn sÃ ng demo luá»“ng Diagnostic vÃ  luá»“ng Skip).
2. `learner.skip@lingora.edu.vn`: Há»c viÃªn Ä‘Ã£ chá»n Skip cháº©n Ä‘oÃ¡n, xuáº¥t phÃ¡t Ä‘iá»ƒm Unit 1 vá»›i tráº¡ng thÃ¡i `UNVERIFIED` (0 AssessmentResult, 0 SkillProfile).
3. `learner.diagnosed@lingora.edu.vn`: Há»c viÃªn Ä‘Ã£ lÃ m bÃ i cháº©n Ä‘oÃ¡n Ä‘áº¡t 15 Ä‘iá»ƒm, xuáº¥t phÃ¡t Ä‘iá»ƒm Ä‘Æ°á»£c xáº¿p vÃ o Unit 3 theo Mapping A, cÃ³ báº£n ghi `AssessmentResult` vÃ  `SkillProfile` Ä‘áº§y Ä‘á»§.
4. `learner.srsdue@lingora.edu.vn`: Há»c viÃªn cÃ³ 10 tháº» tá»« vá»±ng Ä‘áº¿n háº¡n Ã´n táº­p trong ngÃ y hÃ´m nay (sáºµn sÃ ng demo luá»“ng SRS Review).
5. `learner.retry@lingora.edu.vn`: Há»c viÃªn Ä‘ang trong má»™t bÃ i há»c cÃ³ 20 bÃ i táº­p, Ä‘Ã£ sá»­ dá»¥ng 1 lÆ°á»£t lÃ m láº¡i vÃ  cÃ²n 1 lÆ°á»£t lÃ m láº¡i (sáºµn sÃ ng demo luá»“ng Controlled Retry vÃ  tráº§n Ä‘iá»ƒm 70%).
6. `learner.jump@lingora.edu.vn`: Há»c viÃªn Ä‘Ã£ hoÃ n thÃ nh Unit 1, Ä‘á»§ Ä‘iá»u kiá»‡n lÃ m bÃ i Jump sang Unit 2 (sáºµn sÃ ng demo luá»“ng Jump Ä‘áº¡t â‰¥95% vÃ  luá»“ng Jump trÆ°á»£t khÃ³a há»“i chiÃªu 24h).
7. `learner.streakreset@lingora.edu.vn`: Há»c viÃªn cÃ³ ká»· lá»¥c `longestStreak = 15`, ngÃ y há»c gáº§n nháº¥t lÃ  2 ngÃ y trÆ°á»›c (sáºµn sÃ ng demo viá»‡c Ä‘áº·t láº¡i `currentStreak = 1` do bá» lá»¡ 1 ngÃ y).

### 13.3. Dá»¯ Liá»‡u Máº«u GiÃ¡o TrÃ¬nh & Chiáº¿n LÆ°á»£c PhÃ¢n TÃ¡ch Fixture (Bifurcated Seed Strategy)

Äá»ƒ triá»‡t tiÃªu hoÃ n toÃ n xung Ä‘á»™t giá»¯a **Äiá»u kiá»‡n hiá»ƒn thá»‹ Ä‘Æ¡n vá»‹ há»c (Unit 4/4 Published Rule)** vÃ  **VÃ²ng Ä‘á»i ná»™i dung Ä‘a tráº¡ng thÃ¡i (Content Lifecycle)**, dá»¯ liá»‡u máº§m giÃ¡o trÃ¬nh tiáº¿ng Anh A1 Ä‘Æ°á»£c phÃ¢n tÃ¡ch thÃ nh 2 nhÃ³m fixture Ä‘á»™c láº­p:

#### NhÃ³m 1: Dá»¯ Liá»‡u Máº§m TrÃ¬nh Diá»…n Há»c ViÃªn (Learning Demo Fixture â€” Phá»¥c vá»¥ MÃ n 1 & MÃ n 4)
KhÃ³a há»c tiáº¿ng Anh A1 chuáº©n (`English A1 Foundation` â€” tham chiáº¿u chi tiáº¿t táº¡i `docs/08-english-a1-curriculum.md`):
- ToÃ n bá»™ **6 Units (24 bÃ i há»c)** thuá»™c giÃ¡o trÃ¬nh thá»­ nghiá»‡m tiáº¿ng Anh A1 Ä‘á»u Ä‘áº¡t chuáº©n **4/4 bÃ i há»c á»Ÿ tráº¡ng thÃ¡i `PUBLISHED`**:
  - `Unit 1`: 4/4 Published
  - `Unit 2`: 4/4 Published
  - `Unit 3`: 4/4 Published
  - `Unit 4`: 4/4 Published
  - `Unit 5`: 4/4 Published
  - `Unit 6`: 4/4 Published
- **TÃ­nh kháº£ dá»¥ng toÃ n diá»‡n:** Nhá» toÃ n bá»™ 6 Units Ä‘á»u thá»a mÃ£n Ä‘iá»u kiá»‡n hiá»ƒn thá»‹ Unit 4/4 Published, má»i Ä‘iá»ƒm sá»‘ cháº©n Ä‘oÃ¡n Ä‘áº§u vÃ o tá»« $0$ Ä‘áº¿n $30$ Ä‘iá»ƒm thÃ´ Ä‘á»u xáº¿p há»c viÃªn vÃ o Ä‘Ãºng xuáº¥t phÃ¡t Ä‘iá»ƒm giÃ¡o trÃ¬nh tÆ°Æ¡ng á»©ng (U1 Ä‘áº¿n U6 theo Mapping A) mÃ  khÃ´ng bao giá» gáº·p tÃ¬nh tráº¡ng Unit bá»‹ áº©n hay cáº§n báº¥t ká»³ cÆ¡ cháº¿ fallback nÃ o.

#### NhÃ³m 2: Dá»¯ Liá»‡u Máº§m Quáº£n Trá»‹ & Kiá»ƒm Thá»­ Kiá»ƒm Duyá»‡t (Governance & Negative Test Fixture â€” Phá»¥c vá»¥ MÃ n 2 & MÃ n 3)
ÄÆ°á»£c cáº¥u hÃ¬nh trÃªn má»™t khÃ³a há»c / Ä‘Æ¡n vá»‹ kiá»ƒm thá»­ riÃªng biá»‡t Ä‘á»ƒ phá»¥c vá»¥ kiá»ƒm thá»­ vÃ²ng Ä‘á»i vÃ  kiá»ƒm Ä‘á»‹nh phá»§ Ä‘á»‹nh (negative testing):
- **Bá»™ dá»¯ liá»‡u vÃ²ng Ä‘á»i ná»™i dung (Content Lifecycle Fixture):** Bao gá»“m cÃ¡c bÃ i há»c Ä‘áº¡i diá»‡n cho Ä‘áº§y Ä‘á»§ cÃ¡c tráº¡ng thÃ¡i biÃªn soáº¡n vÃ  kiá»ƒm duyá»‡t:
  - Báº£n tháº£o má»›i phÃ¢n cÃ´ng: tráº¡ng thÃ¡i `DRAFT` do Manager gÃ¡n cho Creator (`creator.demo`).
  - BÃ i há»c Ä‘ang trong hÃ ng Ä‘á»£i kiá»ƒm duyá»‡t: tráº¡ng thÃ¡i `IN_REVIEW` chá» Moderator tháº©m Ä‘á»‹nh.
  - BÃ i há»c yÃªu cáº§u chá»‰nh sá»­a: tráº¡ng thÃ¡i `CHANGES_REQUESTED` kÃ¨m ghi chÃº nháº­n xÃ©t.
  - BÃ i há»c Ä‘Ã£ duyá»‡t: tráº¡ng thÃ¡i `APPROVED`, sáºµn sÃ ng xuáº¥t báº£n thÃ´ng thÆ°á»ng hoáº·c xuáº¥t báº£n kháº©n cáº¥p cÃ³ lÃ½ do.
  - Báº£n tháº£o nÃ¢ng cáº¥p nhÃ¢n báº£n (Clone-to-Draft v2): báº£n ghi phiÃªn báº£n má»›i káº¿ thá»«a ná»™i dung báº£n cÅ© thÃ´ng qua trÆ°á»ng `supersedes_id`.
- **Ká»‹ch báº£n kiá»ƒm thá»­ phá»§ Ä‘á»‹nh hiá»ƒn thá»‹ Unit (Negative Unit Visibility Case):** Má»™t Unit thá»­ nghiá»‡m chá»‰ cÃ³ 3/4 bÃ i há»c `PUBLISHED` vÃ  1 bÃ i há»c `DRAFT` $\rightarrow$ Tá»± Ä‘á»™ng áº©n Ä‘á»‘i vá»›i há»c viÃªn Ä‘á»ƒ kiá»ƒm chá»©ng Ä‘iá»u kiá»‡n cÆ°á»¡ng cháº¿ Unit 4/4 Published.

---

## 14. Ká»ŠCH Báº¢N TRÃŒNH DIá»„N Há»† THá»NG LIÃŠN Tá»¤C (DEMO PLAN)

Ká»‹ch báº£n trÃ¬nh diá»…n Ä‘Æ°á»£c thiáº¿t káº¿ thÃ nh **má»™t cÃ¢u chuyá»‡n liá»n máº¡ch (Continuous Storyline)** chia lÃ m 4 mÃ n (Acts), phÃ´ diá»…n trá»n váº¹n sá»©c máº¡nh cá»§a ná»n táº£ng, tÃ­nh thÃ¢n thiá»‡n cá»§a giao diá»‡n vÃ  tÃ­nh cháº·t cháº½ cá»§a cÃ¡c cÆ¡ cháº¿ quáº£n trá»‹.

```text
+----------------------------------------------------------------------------------------------------+
|                                    LINGORA LIVE DEMONSTRATION WORKFLOW                             |
+----------------------------------------------------------------------------------------------------+
| MÃ€N 1: HÃ€NH TRÃŒNH Há»ŒC VIÃŠN TOÃ€N DIá»†N (LEARNER JOURNEY)                                             |
|   1. ÄÄƒng nháº­p tÃ i khoáº£n há»c viÃªn má»›i (learner.new) -> Hiá»ƒn thá»‹ lá»i nháº¯c cháº©n Ä‘oÃ¡n nÄƒng lá»±c.       |
|   2. LÃ m bÃ i Placement Test (30 cÃ¢u) -> Äáº¡t 15/30 Ä‘iá»ƒm thÃ´ -> Mapping A tá»± Ä‘á»™ng xáº¿p vÃ o Unit 3.    |
|   3. VÃ o Unit 3 -> VÃ o BÃ i há»c L9 -> TrÃ¬nh phÃ¡t bÃ i táº­p tÆ°Æ¡ng tÃ¡c (MCQ, Fill, Reorder, Listening). |
|   4. Cá»‘ tÃ¬nh lÃ m sai 1 cÃ¢u -> Há»‡ thá»‘ng giáº£i thÃ­ch ngá»¯ phÃ¡p -> KÃ­ch hoáº¡t Controlled Retry.          |
|   5. LÃ m láº¡i chÃ­nh xÃ¡c cÃ¢u sai -> Äiá»ƒm sá»‘ cá»™ng tá»‘i Ä‘a 70% -> HoÃ n thÃ nh bÃ i há»c nguyÃªn tá»­.         |
|   6. Chuyá»ƒn sang mÃ n hÃ¬nh SRS -> Ã”n táº­p 5 tháº» tá»« vá»±ng Ä‘áº¿n háº¡n -> Chu ká»³ Policy B nháº£y bÆ°á»›c.        |
|   7. Kiá»ƒm tra Streak -> Chuá»—i ngÃ y há»c tÄƒng 1 ngÃ y theo Ä‘Ãºng mÃºi giá» Viá»‡t Nam.                     |
+----------------------------------------------------------------------------------------------------+
| MÃ€N 2: HÃ€NH TRÃŒNH QUáº¢N TRá»Š VÃ€ KIá»‚M DUYá»†T Ná»˜I DUNG (CONTENT GOVERNANCE)                             |
|   1. Manager Ä‘Äƒng nháº­p -> Táº¡o nhiá»‡m vá»¥ biÃªn soáº¡n BÃ i há»c má»›i, phÃ¢n cÃ´ng cho Creator (creator.demo). |
|   2. Creator Ä‘Äƒng nháº­p -> Nháº­n thÃ´ng bÃ¡o nhiá»‡m vá»¥ -> VÃ o soáº¡n ná»™i dung vÃ  bÃ i táº­p -> Ná»™p duyá»‡t bÃ i.|
|   3. Moderator Ä‘Äƒng nháº­p -> Tháº¥y bÃ i trong hÃ ng Ä‘á»£i -> YÃªu cáº§u sá»­a Ä‘á»•i kÃ¨m lÃ½ do.                  |
|   4. Creator nháº­n pháº£n há»“i -> Chá»‰nh sá»­a vÃ  ná»™p duyá»‡t láº¡i.                                          |
|   5. Moderator kiá»ƒm tra -> PhÃª duyá»‡t bÃ i há»c (Approved).                                           |
|   6. Manager Ä‘Äƒng nháº­p -> NhÃ¬n tháº¥y bÃ i há»c Ä‘Ã£ Approved -> Báº¥m Xuáº¥t báº£n (Published).               |
+----------------------------------------------------------------------------------------------------+
| MÃ€N 3: KIá»‚M CHá»¨NG Báº¢O Máº¬T & PHÃ‚N TÃCH NHIá»†M Vá»¤ (SECURITY & SOD DEFENSE)                           |
|   1. Creator cá»‘ tÃ¬nh gá»i lá»‡nh duyá»‡t bÃ i -> Bá»‹ tá»« chá»‘i phÃ¢n quyá»n (403 Forbidden / ROLE_UNAUTHORIZED)|
|   2. Moderator cá»‘ tÃ¬nh xuáº¥t báº£n bÃ i há»c ra há»c viÃªn -> Há»‡ thá»‘ng cháº·n, bÃ¡o lá»—i 403 Forbidden.       |
|   3. Admin cá»‘ tÃ¬nh xuáº¥t báº£n bÃ i chÆ°a duyá»‡t -> Bá»‹ cháº·n (403 EMERGENCY_UNAPPROVED).                  |
|   4. Admin xuáº¥t báº£n bÃ i Ä‘Ã£ Approved nhÆ°ng khÃ´ng nháº­p lÃ½ do -> Bá»‹ cháº·n (403 MISSING_JUSTIFICATION). |
|   5. Admin xuáº¥t báº£n kháº©n cáº¥p bÃ i Approved cÃ³ nháº­p lÃ½ do -> ThÃ nh cÃ´ng.                             |
|   6. Má»Ÿ mÃ n hÃ¬nh Audit Log -> Hiá»ƒn thá»‹ báº£n ghi CONTENT_EMERGENCY_PUB kÃ¨m lÃ½ do giáº£i trÃ¬nh.         |
+----------------------------------------------------------------------------------------------------+
| MÃ€N 4: Tá»”NG Há»¢P TIáº¾N Äá»˜ Há»ŒC VIÃŠN & CÃ NHÃ‚N HÃ“A THEO QUY Táº®C (LEARNER STATE & RULE PERSONALIZATION)  |
|   1. ÄÄƒng nháº­p há»c viÃªn cÃ³ lá»‹ch sá»­ há»c táº­p (learner.diagnosed) -> Báº£ng Ä‘iá»u khiá»ƒn cÃ¡ nhÃ¢n hiá»ƒn thá»‹ |
|      trÃ¬nh Ä‘á»™ Ä‘Ã£ kiá»ƒm Ä‘á»‹nh (verifiedProficiency), Ä‘iá»ƒm xuáº¥t phÃ¡t Unit 3, vÃ  chuá»—i ngÃ y há»c Streak.  |
|   2. Má»Ÿ hÃ ng Ä‘á»£i Ã´n táº­p ngáº¯t quÃ£ng (SRS Review Queue) -> Hiá»ƒn thá»‹ tá»« vá»±ng Ä‘áº¿n háº¡n theo Policy B.   |
|   3. HoÃ n thÃ nh 1 bÃ i há»c há»£p lá»‡ trong Unit -> Há»‡ thá»‘ng tá»± Ä‘á»™ng cáº­p nháº­t chuá»—i Streak theo mÃºi giá». |
|   4. Kiá»ƒm tra Ä‘iá»u kiá»‡n Ä‘Æ¡n vá»‹ giÃ¡o trÃ¬nh: Unit Ä‘á»§ 4/4 Published má»Ÿ; Unit 3/4 Published khÃ³a áº©n.   |
+----------------------------------------------------------------------------------------------------+
```

### Danh Má»¥c Báº±ng Chá»©ng Ghi HÃ¬nh TrÃ¬nh Diá»…n (Demo Evidence Capture Register)

| MÃ£ Báº±ng Chá»©ng | TÃªn PhÃ¢n Äoáº¡n Demo | Tráº¡ng ThÃ¡i Dá»¯ Liá»‡u Cáº§n Seed | Káº¿t Quáº£ Äáº§u Ra Ká»³ Vá»ng | Äá»‹nh Dáº¡ng Thu Tháº­p |
|---|---|---|---|---|
| `DEMO-ACT1-01` | Cháº©n Ä‘oÃ¡n nÄƒng lá»±c & Mapping A | `learner.new` | Báº£ng káº¿t quáº£ Mapping A Unit 3; Profile cáº­p nháº­t | Video MP4 / áº¢nh chá»¥p mÃ n hÃ¬nh |
| `DEMO-ACT1-02` | TrÃ¬nh phÃ¡t bÃ i táº­p & LÃ m láº¡i 70% | KhÃ³a há»c A1 Unit 3 | CÃ¢u sai lÃ m láº¡i nháº­n 7.0/10 Ä‘iá»ƒm; thanh tiáº¿n Ä‘á»™ tÄƒng | Video MP4 / áº¢nh chá»¥p mÃ n hÃ¬nh |
| `DEMO-ACT1-03` | Ã”n táº­p ngáº¯t quÃ£ng SRS Policy B | `learner.srsdue` | Tháº» Ä‘Ãºng nháº£y chu ká»³ +1 ngÃ y; RPC tráº£ vá» thÃ nh cÃ´ng | Video MP4 / áº¢nh chá»¥p mÃ n hÃ¬nh |
| `DEMO-ACT2-01` | VÃ²ng Ä‘á»i biÃªn soáº¡n & Kiá»ƒm duyá»‡t | BÃ i há»c phÃ¢n cÃ´ng má»›i | Chuyá»ƒn dá»‹ch DRAFT $\rightarrow$ IN_REVIEW $\rightarrow$ APPROVED $\rightarrow$ PUBLISHED | Video MP4 / áº¢nh chá»¥p mÃ n hÃ¬nh |
| `DEMO-ACT3-01` | Cháº·n Creator duyá»‡t bÃ i há»c | `creator.demo` | ThÃ´ng bÃ¡o lá»—i Ä‘á» `403 Forbidden` / `ROLE_UNAUTHORIZED` | Video MP4 / áº¢nh chá»¥p mÃ n hÃ¬nh |
| `DEMO-ACT3-02` | Xuáº¥t báº£n kháº©n cáº¥p & Nháº­t kÃ½ Audit| `admin.demo` | Modal nháº­p lÃ½ do; Báº£ng audit hiá»ƒn thá»‹ sá»± kiá»‡n | Video MP4 / áº¢nh chá»¥p mÃ n hÃ¬nh |
| `DEMO-ACT4-01` | Tá»•ng há»£p tiáº¿n Ä‘á»™ & cÃ¡ nhÃ¢n hÃ³a quy táº¯c | `learner.diagnosed` | Báº£ng Ä‘iá»u khiá»ƒn hiá»ƒn thá»‹ Streak, SRS due cards, tráº¡ng thÃ¡i Unit theo quy táº¯c chuáº©n táº¯c | Video MP4 / áº¢nh chá»¥p mÃ n hÃ¬nh |

---

## 15. MA TRáº¬N Báº°NG CHá»¨NG BÃO CÃO Há»ŒC THUáº¬T (REPORT EVIDENCE MATRIX)

Nháº±m phá»¥c vá»¥ trá»±c tiáº¿p cho BÃ¡o cÃ¡o Há»c thuáº­t Tá»‘t nghiá»‡p, má»i tuyÃªn bá»‘ khoa há»c vÃ  ká»¹ thuáº­t trong bÃ¡o cÃ¡o Ä‘á»u pháº£i Ä‘Æ°á»£c gáº¯n kÃ¨m báº±ng chá»©ng thá»±c nghiá»‡m khÃ¡ch quan theo báº£ng ma tráº­n chuáº©n 5 cá»™t dÆ°á»›i Ä‘Ã¢y:

| (1) TuyÃªn Bá»‘ BÃ¡o CÃ¡o (Report Claim) | (2) Báº±ng Chá»©ng KhÃ¡ch Quan (Evidence Artifact) | (3) Nguá»“n Báº±ng Chá»©ng (Source of Truth) | (4) PhÆ°Æ¡ng Thá»©c Thu Tháº­p (How Captured) | (5) Má»‘c HoÃ n ThÃ nh (Milestone) |
|---|---|---|---|---|
| **RC-01:** Há»‡ thá»‘ng há»— trá»£ Ä‘áº§y Ä‘á»§ 6 vai trÃ² chuáº©n táº¯c vá»›i phÃ¢n quyá»n RLS Ä‘á»™c láº­p | Káº¿t quáº£ test phÃ¢n quyá»n 6 vai trÃ²; Log RLS PostgreSQL | `lingora-web/tests/security/rbac_matrix.test.ts` | Cháº¡y lá»‡nh `npx vitest run tests/security/rbac_matrix.test.ts`, trÃ­ch xuáº¥t stdout exit code 0 | M3.2 |
| **RC-02:** Thuáº­t toÃ¡n Mapping A Ã¡nh xáº¡ Ä‘iá»ƒm thÃ´ 0â€“30 ra Unit 1â€“6 táº¥t Ä‘á»‹nh | Báº£ng káº¿t quáº£ cháº¡y 12 vector Ä‘iá»ƒm biÃªn; Unit test log | `lingora-web/tests/unit/domain/mapping_a.test.ts` | Cháº¡y lá»‡nh `npx vitest run tests/unit/domain/mapping_a.test.ts`, xuáº¥t log kiá»ƒm thá»­ | M3.4 |
| **RC-03:** NhÃ¡nh Skip cháº©n Ä‘oÃ¡n khÃ´ng phÃ¡t sinh káº¿t quáº£ Ä‘Ã¡nh giÃ¡ giáº£ máº¡o | Truy váº¥n SQL kiá»ƒm toÃ¡n Ä‘á»‘i soÃ¡t: sá»‘ lÆ°á»£ng báº£n ghi = 0 | CÆ¡ sá»Ÿ dá»¯ liá»‡u Supabase Postgres | Cháº¡y script kiá»ƒm tra DB sau khi nháº¥n Skip: `COUNT(*) == 0` | M3.4 |
| **RC-04:** Thá»­ thÃ¡ch nháº£y cÃ³c Ä‘áº¡t ngÆ°á»¡ng â‰¥95% vÃ  Ã¡p dá»¥ng há»“i chiÃªu 24h | Káº¿t quáº£ cháº¡y test biÃªn 94.9% vs 95.0% vÃ  test há»“i chiÃªu | `lingora-web/tests/unit/domain/jump_threshold.test.ts` | Cháº¡y Vitest kiá»ƒm thá»­ logic ngÆ°á»¡ng vÃ  mock Ä‘á»“ng há»“ server | M3.5 |
| **RC-05:** Háº¡n má»©c lÃ m láº¡i `max(1, floor(N*0.10))` Ã¡p dá»¥ng tráº§n Ä‘iá»ƒm 70% | Káº¿t quáº£ kiá»ƒm thá»­ tÃ­nh Ä‘iá»ƒm lÃ m láº¡i vÃ  cháº·n lÆ°á»£t thá»© N+1 | `lingora-web/tests/unit/domain/retry_allowance.test.ts` | Cháº¡y Vitest kiá»ƒm thá»­ logic lÃ m láº¡i cÃ³ kiá»ƒm soÃ¡t | M3.5 |
| **RC-06:** Thuáº­t toÃ¡n SRS Policy B tuÃ¢n thá»§ nghiÃªm ngáº·t máº£ng `[1,3,7,14,30]` | Log thá»±c thi hÃ m RPC PostgreSQL `record_review` | `lingora-web/tests/integration/api/srs_policy_b.test.ts` | Thá»±c thi test gá»i trá»±c tiáº¿p RPC trÃªn cÆ¡ sá»Ÿ dá»¯ liá»‡u test qua Vitest | M3.5 |
| **RC-07:** Chuá»—i ngÃ y há»c Streak tÃ­nh chÃ­nh xÃ¡c theo mÃºi giá» IANA cá»§a há»c viÃªn | Káº¿t quáº£ kiá»ƒm thá»­ chuyá»ƒn Ä‘á»•i mÃºi giá» qua cÃ¡c thá»i Ä‘iá»ƒm biÃªn | `lingora-web/tests/unit/domain/streak_timezone.test.ts` | Cháº¡y Vitest vá»›i cÃ¡c trÆ°á»ng há»£p lá»‡ch giá» giá»¯a UTC vÃ  UTC+7 | M3.5 |
| **RC-08:** PhÃ¢n tÃ¡ch nhiá»‡m vá»¥ SoD ngÄƒn cháº·n Creator phÃª duyá»‡t bÃ i há»c | Báº£n ghi pháº£n há»“i HTTP 403 Forbidden / ROLE_UNAUTHORIZED | `lingora-web/tests/security/sod_creator_approve.test.ts` | Cháº¡y test giáº£ láº­p Creator gá»­i request duyá»‡t bÃ i | M3.2 |
| **RC-09:** CÆ¡ cháº¿ Clone-to-Draft v2 báº£o tá»“n nguyÃªn váº¹n bÃ i há»c Ä‘Ã£ xuáº¥t báº£n | Báº£n ghi cÆ¡ sá»Ÿ dá»¯ liá»‡u báº£ng `lesson_revisions` liÃªn káº¿t cha con | CÆ¡ sá»Ÿ dá»¯ liá»‡u Supabase Postgres | Truy váº¥n cÃ¢y pháº£ há»‡ qua trÆ°á»ng `supersedes_id` | M3.6 |
| **RC-10:** ÄÆ¡n vá»‹ há»c chá»‰ hiá»ƒn thá»‹ khi cÃ³ Ä‘á»§ 4/4 bÃ i há»c xuáº¥t báº£n | Káº¿t quáº£ test truy váº¥n danh sÃ¡ch Unit vá»›i cÃ¡c tráº¡ng thÃ¡i bÃ i | `lingora-web/tests/integration/api/curriculum.test.ts` | Test API láº¥y curriculum: Unit chÆ°a Ä‘á»§ 4/4 bÃ i published bá»‹ áº©n | M3.3 |
| **RC-11:** Admin xuáº¥t báº£n kháº©n cáº¥p báº¯t buá»™c cÃ³ lÃ½ do vÃ  phÃ¡t sinh log kiá»ƒm toÃ¡n | Báº£n ghi nháº­t kÃ½ kiá»ƒm toÃ¡n cÃ³ action `CONTENT_EMERGENCY_PUB` | Báº£ng `audit_logs` trong Supabase | Truy váº¥n báº£n ghi log sau khi Admin thá»±c hiá»‡n xuáº¥t báº£n kháº©n cáº¥p | M3.6 |
| **RC-12:** CÆ¡ cháº¿ chuyá»ƒn Ä‘á»•i ngÃ´n ngá»¯ i18n lÆ°u trá»¯ tráº¡ng thÃ¡i ngÆ°á»i dÃ¹ng Ä‘á»“ng bá»™ | Káº¿t quáº£ kiá»ƒm thá»­ chuyá»ƒn Ä‘á»•i locale `vi`/`en`; Unit test log | `lingora-web/tests/unit/infrastructure/i18n_locale.test.ts` | Cháº¡y Vitest kiá»ƒm thá»­ chuyá»ƒn Ä‘á»•i ngÃ´n ngá»¯ vÃ  Ä‘á»c cookie/profile | M3.7 |
| **RC-13:** CÃ¡ch ly truy cáº­p dá»¯ liá»‡u chÃ©o há»c viÃªn táº¡i táº§ng lÆ°u trá»¯ vÃ  RLS | Káº¿t quáº£ kiá»ƒm thá»­ truy váº¥n chÃ©o ngÆ°á»i dÃ¹ng tráº£ vá» 0 báº£n ghi | `lingora-web/tests/security/rls_isolation.test.ts` | Thá»±c thi test kiá»ƒm thá»­ táº¥n cÃ´ng dá»¯ liá»‡u chÃ©o ngÆ°á»i dÃ¹ng qua PostgREST | M3.2 |
| **RC-14:** ToÃ n bá»™ há»‡ thá»‘ng vÆ°á»£t qua bá»™ kiá»ƒm thá»­ há»“i quy vÃ  an ninh | BÃ¡o cÃ¡o tá»•ng há»£p kiá»ƒm thá»­ toÃ n há»‡ thá»‘ng (Test Summary) | ToÃ n bá»™ cÃ¡c thÆ° má»¥c kiá»ƒm thá»­ | Script cháº¡y toÃ n bá»™ test suites vÃ  xuáº¥t bÃ¡o cÃ¡o tá»· lá»‡ Ä‘áº¡t 100% | M3.9 |

---

## 16. KHUNG KIá»‚M Äá»ŠNH HIá»†U NÄ‚NG & TIÃŠU CHÃ PHI CHá»¨C NÄ‚NG (NFR VALIDATION)

Äá»ƒ Ä‘áº£m báº£o tÃ­nh nghiÃªm ngáº·t vá» phÆ°Æ¡ng phÃ¡p luáº­n khoa há»c, toÃ n bá»™ cÃ¡c chá»‰ sá»‘ phi chá»©c nÄƒng pháº£i Ä‘Æ°á»£c **phÃ¢n Ä‘á»‹nh tuyá»‡t Ä‘á»‘i giá»¯a Má»¥c tiÃªu thiáº¿t káº¿ (TARGET) vÃ  Káº¿t quáº£ Ä‘o lÆ°á»ng thá»±c táº¿ (MEASURED)**. Tuyá»‡t Ä‘á»‘i khÃ´ng sá»­ dá»¥ng con sá»‘ má»¥c tiÃªu thiáº¿t káº¿ Ä‘á»ƒ tuyÃªn bá»‘ há»‡ thá»‘ng Ä‘Ã£ Ä‘áº¡t hiá»‡u nÄƒng khi chÆ°a tiáº¿n hÃ nh Ä‘o Ä‘áº¡c thá»±c táº¿.

### 16.1. Báº£ng Äá»‘i SoÃ¡t TiÃªu ChÃ­ Phi Chá»©c NÄƒng (NFR Target vs Measured Framework)

| MÃ£ Chá»‰ Sá»‘ | TiÃªu ChÃ­ Phi Chá»©c NÄƒng | Má»¥c TiÃªu Thiáº¿t Káº¿ (TARGET) | PhÆ°Æ¡ng PhÃ¡p Äo LÆ°á»ng Thá»±c Nghiá»‡m (Methodology) | MÃ´i TrÆ°á»ng Äo Äáº¡c (Environment) | Káº¿t Quáº£ Thá»±c Äo (MEASURED) | NgÆ°á»¡ng Cháº¥p Thuáº­n (Acceptance Threshold) |
|---|---|---|---|---|---|---|
| **VAL-NFR-01** | Thá»i gian pháº£n há»“i API BFF | $< 200 \text{ ms}$ (p95 cho cÃ¡c truy váº¥n Ä‘á»c) | Ká»‹ch báº£n k6 Ä‘o lÆ°á»ng 50 ngÆ°á»i dÃ¹ng Ä‘á»“ng thá»i trong 5 phÃºt | Local / Staging Server (Node.js 20) | `CHá»œ ÄO Äáº C Táº I M3.9` | p95 $< 300 \text{ ms}$ |
| **VAL-NFR-02** | Thá»i gian táº£i trang ban Ä‘áº§u (FCP)| $< 1.5 \text{ giÃ¢y}$ trÃªn Ä‘Æ°á»ng truyá»n máº¡ng 4G | Google Lighthouse Audit trÃªn trÃ¬nh duyá»‡t Chrome | Headless Chrome, Network Throttling | `CHá»œ ÄO Äáº C Táº I M3.9` | FCP $< 2.0 \text{ s}$, LCP $< 2.5 \text{ s}$ |
| **VAL-NFR-03** | Hiá»‡u nÄƒng Ä‘Ã¡nh giÃ¡ RLS Database | $< 50 \text{ ms}$ (p95 trÃªn táº­p dá»¯ liá»‡u 10,000 báº£n ghi) | EXPLAIN ANALYZE trÃªn cÃ¡c cÃ¢u lá»‡nh SELECT cÃ³ RLS | PostgreSQL 15 Supabase Instance | `CHá»œ ÄO Äáº C Táº I M3.9` | Execution Time $< 80 \text{ ms}$ |
| **VAL-NFR-04** | Kháº£ nÄƒng chá»‹u táº£i Ä‘á»“ng thá»i | 50 phiÃªn há»c viÃªn tÆ°Æ¡ng tÃ¡c Ä‘á»“ng thá»i | k6 Virtual Users cháº¡y ká»‹ch báº£n lÃ m bÃ i táº­p liÃªn tá»¥c | Staging Environment | `CHá»œ ÄO Äáº C Táº I M3.9` | Tá»· lá»‡ lá»—i $< 0.1\%$, CPU $< 80\%$ |

> **Ghi chÃº vá» mÃ£ hÃ³a chá»‰ sá»‘:** CÃ¡c mÃ£ `VAL-NFR-01` Ä‘áº¿n `VAL-NFR-04` lÃ  cÃ¡c má»¥c tiÃªu kiá»ƒm Ä‘á»‹nh ná»™i bá»™ cá»§a Káº¿ hoáº¡ch Tá»•ng thá»ƒ (Master-Plan Validation Targets), phá»¥c vá»¥ trá»±c tiáº¿p cho viá»‡c Ä‘Ã¡nh giÃ¡ thá»±c nghiá»‡m táº¡i M3.9 vÃ  Ä‘á»‘i soÃ¡t trong ChÆ°Æ¡ng 5 BÃ¡o cÃ¡o tá»‘t nghiá»‡p; khÃ´ng tá»± tiá»‡n Ä‘á»‹nh nghÄ©a láº¡i hay gÃ¢y xung Ä‘á»™t vá»›i há»‡ thá»‘ng mÃ£ yÃªu cáº§u chuáº©n táº¯c `P1-NFR` trong tÃ i liá»‡u kiáº¿n trÃºc M2.

---

## 17. MÃ” HÃŒNH QUáº¢N TRá»Š Má»C & Cá»”NG NGHIá»†M THU (GATED MILESTONE MODEL)

ToÃ n bá»™ quÃ¡ trÃ¬nh thá»±c thi Phase 2 báº¯t buá»™c pháº£i tuÃ¢n thá»§ nghiÃªm ngáº·t **Quy trÃ¬nh Quáº£n trá»‹ ÄÃ³ng Cá»•ng 10 BÆ°á»›c (10-Step Gated Workflow)** Ä‘Æ°á»£c quy Ä‘á»‹nh trong `AGENTS.md`. Tuyá»‡t Ä‘á»‘i khÃ´ng cho phÃ©p AI coding agent tá»± Ä‘á»™ng phÃª duyá»‡t káº¿ hoáº¡ch, tá»± Ä‘á»™ng nghiá»‡m thu hoáº·c tá»± Ã½ commit mÃ£ nguá»“n trÆ°á»›c khi vÆ°á»£t qua cá»•ng kiá»ƒm Ä‘á»‹nh.

```text
+---------------------------------------------------------------------------------------------------+
|                                  10-STEP MANDATORY GATED WORKFLOW                                 |
+---------------------------------------------------------------------------------------------------+
| 1. PLAN: Soáº¡n tháº£o hoáº·c cáº­p nháº­t káº¿ hoáº¡ch chi tiáº¿t cho má»‘c thá»±c thi trong plans/current-task.md   |
|     |                                                                                             |
|     v                                                                                             |
| 2. PLAN REVIEW: Kiá»ƒm tra káº¿ hoáº¡ch Ä‘á»‘i chiáº¿u vá»›i kiáº¿n trÃºc, an ninh, schema vÃ  ranh giá»›i há»‡ thá»‘ng  |
|     |                                                                                             |
|     v                                                                                             |
| 3. HUMAN APPROVAL: Con ngÆ°á»i (Human Operator) kiá»ƒm tra vÃ  Ä‘á»•i tráº¡ng thÃ¡i thÃ nh APPROVED           |
|     |               (Ká»¸ SÆ¯ AI TUYá»†T Äá»I KHÃ”NG Tá»° CHUYá»‚N TRáº NG THÃI SANG APPROVED)                 |
|     v                                                                                             |
| 4. IMPLEMENT: Tiáº¿n hÃ nh láº­p trÃ¬nh chÃ­nh xÃ¡c theo pháº¡m vi Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t trong káº¿ hoáº¡ch          |
|     |                                                                                             |
|     v                                                                                             |
| 5. TEST: Thá»±c thi 100% cÃ¡c bÃ i kiá»ƒm thá»­ tá»± Ä‘á»™ng trong káº¿ hoáº¡ch vÃ  ghi nháº­n báº±ng chá»©ng khÃ¡ch quan  |
|     |                                                                                             |
|     v                                                                                             |
| 6. INDEPENDENT REVIEW: Kiá»ƒm Ä‘á»‹nh viÃªn Ä‘á»™c láº­p (Codex/Human) thá»±c hiá»‡n rÃ  soÃ¡t cháº¥t lÆ°á»£ng mÃ£ nguá»“n |
|     |                                                                                             |
|     v                                                                                             |
| 7. REMEDIATION (náº¿u cÃ³): Kháº¯c phá»¥c toÃ n bá»™ cÃ¡c lá»—i P0, P1 vÃ  P2 Ä‘Æ°á»£c phÃ¡t hiá»‡n trong quÃ¡ trÃ¬nh review|
|     |                                                                                             |
|     v                                                                                             |
| 8. RE-REVIEW: Kiá»ƒm Ä‘á»‹nh láº¡i Ä‘á»™c láº­p xÃ¡c nháº­n 100% cÃ¡c phÃ¡t hiá»‡n Ä‘Ã£ Ä‘Æ°á»£c kháº¯c phá»¥c hoÃ n toÃ n       |
|     |                                                                                             |
|     v                                                                                             |
| 9. ACCEPTANCE: Con ngÆ°á»i ghi nháº­n quyáº¿t Ä‘á»‹nh cháº¥p thuáº­n nghiá»‡m thu chÃ­nh thá»©c vÃ o ADR              |
|     |                                                                                             |
|     v                                                                                             |
| 10. CHECKPOINT COMMIT: Táº¡o commit git ghi nháº­n má»‘c hoÃ n thÃ nh kÃ¨m Ä‘áº§y Ä‘á»§ log kiá»ƒm thá»­ vÃ  quyáº¿t Ä‘á»‹nh|
+---------------------------------------------------------------------------------------------------+
```

---

## 18. ÃNH Xáº  TRIá»‚N KHAI VÃ€O Cáº¤U TRÃšC BÃO CÃO Há»ŒC THUáº¬T

Äá»ƒ tá»‘i Æ°u hÃ³a nÄƒng suáº¥t vÃ  báº£o Ä‘áº£m sá»± Ä‘á»“ng bá»™ tuyá»‡t Ä‘á»‘i giá»¯a sáº£n pháº©m pháº§n má»m vÃ  luáº­n vÄƒn tá»‘t nghiá»‡p, toÃ n bá»™ cÃ¡c má»‘c triá»ƒn khai Phase 2 Ä‘Æ°á»£c Ã¡nh xáº¡ trá»±c tiáº¿p vÃ o 5 chÆ°Æ¡ng chÃ­nh cá»§a BÃ¡o cÃ¡o Há»c thuáº­t theo nguyÃªn táº¯c: **Láº­p trÃ¬nh má»™t láº§n $\rightarrow$ Kiá»ƒm thá»­ má»™t láº§n $\rightarrow$ Thu tháº­p báº±ng chá»©ng má»™t láº§n $\rightarrow$ Sá»­ dá»¥ng Ä‘á»“ng thá»i cho cáº£ Demo vÃ  BÃ¡o cÃ¡o**.

```text
+----------------------------------------------------------------------------------------------------+
|                         ACADEMIC REPORT CHAPTER-TO-MILESTONE MAPPING MATRIX                        |
+----------------------------------------------------------------------------------------------------+
| CHÆ¯Æ NG 1: GIá»šI THIá»†U & NGHIÃŠN Cá»¨U NHU Cáº¦U NGÆ¯á»œI DÃ™NG                                               |
|   - Ná»™i dung bÃ¡o cÃ¡o: Káº¿t quáº£ nghiÃªn cá»©u thá»±c nghiá»‡m: N=15 (baseline learner research),             |
|                       N=35 (supplementary design survey), N=3 (phá»ng váº¥n sÃ¢u Ä‘á»‹nh tÃ­nh),           |
|                       1 bÃ i há»c (thá»­ nghiá»‡m ná»™i dung ná»™i bá»™), 8 Ä‘iá»ƒm Ä‘au, phÃ¢n tÃ­ch Ä‘á»‘i thá»§.       |
|   - Báº±ng chá»©ng thu tháº­p: Biá»ƒu Ä‘á»“ kháº£o sÃ¡t thá»±c táº¿ (N=15 baseline & N=35 survey), biÃªn báº£n phá»ng váº¥n |
|                          N=3, ma tráº­n Pain Points, tÃ i liá»‡u thá»­ nghiá»‡m bÃ i há»c, cÄƒn cá»© D1â€“D9.      |
|   - Má»‘c cung cáº¥p báº±ng chá»©ng: Káº¿ thá»«a tá»« Phase 0 & Milestone M2.1.                                  |
+----------------------------------------------------------------------------------------------------+
| CHÆ¯Æ NG 2: PHÃ‚N TÃCH YÃŠU Cáº¦U & MÃ” HÃŒNH HÃ“A NGHIá»†P Vá»¤                                                |
|   - Ná»™i dung bÃ¡o cÃ¡o: 15 Ca sá»­ dá»¥ng (UC), 15 Luá»“ng nghiá»‡p vá»¥ (BF), 6 vai trÃ², quy táº¯c SoD.         |
|   - Báº±ng chá»©ng thu tháº­p: SÆ¡ Ä‘á»“ Use Case, Activity Diagrams, ma tráº­n phÃ¢n quyá»n RBAC.               |
|   - Má»‘c cung cáº¥p báº±ng chá»©ng: Káº¿ thá»«a tá»« Milestone M2.2 & M3.2.                                     |
+----------------------------------------------------------------------------------------------------+
| CHÆ¯Æ NG 3: PHÃ‚N TÃCH & THIáº¾T Káº¾ KIáº¾N TRÃšC Há»† THá»NG                                                  |
|   - Ná»™i dung bÃ¡o cÃ¡o: 19 ThÃ nh pháº§n kiáº¿n trÃºc, 5 VÃ¹ng an ninh, 6 Ranh giá»›i, SÆ¡ Ä‘á»“ tuáº§n tá»± SEQ-01..10|
|   - Báº±ng chá»©ng thu tháº­p: SÆ¡ Ä‘á»“ Component, Deployment Boundary, Sequence Diagrams, DFD Context/L0/L1.|
|   - Má»‘c cung cáº¥p báº±ng chá»©ng: Káº¿ thá»«a tá»« Milestone M2.3, M2.4 & M3.8.                               |
+----------------------------------------------------------------------------------------------------+
| CHÆ¯Æ NG 4: THIáº¾T Káº¾ & TRIá»‚N KHAI CÆ  Sá»ž Dá»® LIá»†U                                                      |
|   - Ná»™i dung bÃ¡o cÃ¡o: LÆ°á»£c Ä‘á»“ quan há»‡ thá»±c thá»ƒ ERD, Tá»« Ä‘iá»ƒn dá»¯ liá»‡u, ChÃ­nh sÃ¡ch RLS, 8 pha Migration|
|   - Báº±ng chá»©ng thu tháº­p: Prisma Schema, DDL Migration files, MÃ£ nguá»“n chÃ­nh sÃ¡ch RLS, Test logs RLS|
|   - Má»‘c cung cáº¥p báº±ng chá»©ng: HÃ¬nh thÃ nh trá»±c tiáº¿p tá»« Milestone M3.1 & M3.2.                         |
+----------------------------------------------------------------------------------------------------+
| CHÆ¯Æ NG 5: CÃ€I Äáº¶T Há»† THá»NG, KIá»‚M THá»¬ & THá»°C NGHIá»†M ÄÃNH GIÃ                                        |
|   - Ná»™i dung bÃ¡o cÃ¡o: TrÃ¬nh bÃ y giao diá»‡n Web Learner & Admin, Bá»™ kiá»ƒm thá»­ tá»± Ä‘á»™ng, Äo lÆ°á»ng NFR.   |
|   - Báº±ng chá»©ng thu tháº­p: áº¢nh chá»¥p giao diá»‡n thá»±c táº¿, Káº¿t quáº£ kiá»ƒm thá»­ Vitest/Pytest/Playwright,    |
|                          Biá»ƒu Ä‘á»“ hiá»‡u nÄƒng k6 benchmark, Báº£ng Ä‘á»‘i soÃ¡t NFR Target vs Measured.     |
|   - Má»‘c cung cáº¥p báº±ng chá»©ng: HÃ¬nh thÃ nh trá»±c tiáº¿p tá»« Milestone M3.3 Ä‘áº¿n M3.10.                      |
+----------------------------------------------------------------------------------------------------+
| PHá»¤ Lá»¤C Há»ŒC THUáº¬T: Há»’ SÆ  KIá»‚M Äá»ŠNH THIáº¾T Káº¾ & NHáº¬T KÃ QUáº¢N TRá»Š                                     |
|   - Ná»™i dung bÃ¡o cÃ¡o: BÃ¡o cÃ¡o kiá»ƒm Ä‘á»‹nh 10 cá»•ng D-G1..D-G10, Sá»• Ä‘Äƒng kÃ½ quyáº¿t Ä‘á»‹nh kiáº¿n trÃºc ADR.  |
|   - Báº±ng chá»©ng thu tháº­p: ToÃ n bá»™ lá»‹ch sá»­ logs/decision-log.md, logs/test-log.md, ADR-001..029.     |
|   - Má»‘c cung cáº¥p báº±ng chá»©ng: Káº¿ thá»«a tá»« M2.5, M2.6 vÃ  hoÃ n thiá»‡n táº¡i M3.10.                         |
+----------------------------------------------------------------------------------------------------+
```

> **Ghi chÃº há»c thuáº­t vá» pháº¡m vi Ä‘á»“ Ã¡n:** Äá»“ Ã¡n Lingora Ä‘Æ°á»£c Ä‘á»‹nh vá»‹ chuáº©n má»±c lÃ  Ä‘á» tÃ i Ká»¹ nghá»‡ Pháº§n má»m xÃ¢y dá»±ng ná»n táº£ng há»c trá»±c tuyáº¿n hoÃ n chá»‰nh. CÃ¡c thÃ nh pháº§n AI xuáº¥t hiá»‡n trong má»™t sá»‘ tÃ i liá»‡u thiáº¿t káº¿ M2 Ä‘Æ°á»£c giá»¯ á»Ÿ má»©c tham chiáº¿u kiáº¿n trÃºc/kháº£ nÄƒng há»— trá»£ vÃ  hoÃ n toÃ n khÃ´ng thuá»™c pháº¡m vi triá»ƒn khai cá»§a Phase 2 hay ná»™i dung Ä‘Ã¡nh giÃ¡ chÃ­nh cá»§a ChÆ°Æ¡ng 5.

---

## 19. Sá»” ÄÄ‚NG KÃ Rá»¦I RO & KHOáº¢NG TRá»NG Ká»¸ THUáº¬T (RISK REGISTER)

| ID | TÃªn Rá»§i Ro / Khoáº£ng Trá»‘ng | Má»©c Äá»™ áº¢nh HÆ°á»Ÿng | Phá»¥ Thuá»™c LiÃªn Quan | Giáº£i PhÃ¡p Giáº£m Thiá»ƒu (Mitigation Strategy) | ThÃ nh Pháº§n Sá»Ÿ Há»¯u | Cá»•ng Kiá»ƒm SoÃ¡t |
|---|---|---|---|---|---|---|
| **RSK-01** | Xung Ä‘á»™t khÃ³a báº£ng PostgreSQL khi thá»±c hiá»‡n di chuyá»ƒn dá»¯ liá»‡u lá»›n | `CAO` (GÃ¢y táº¯c ngháº½n truy váº¥n) | `DEP-TECH-01`, `DEP-TECH-02` | Ãp dá»¥ng chiáº¿n lÆ°á»£c chia nhá» Ä‘á»£t (batching ~500 báº£n ghi), Ä‘áº·t `lock_timeout = 5s`, táº¡o chá»‰ má»¥c báº±ng `CONCURRENTLY`. | `COMP-INFRA-01` | Cá»•ng M3.1 |
| **RSK-02** | Lá»— há»•ng rÃ² rá»‰ dá»¯ liá»‡u chÃ©o há»c viÃªn do cáº¥u hÃ¬nh RLS sai sÃ³t | `NGHIÃŠM TRá»ŒNG` (Vi pháº¡m báº£o máº­t) | `DEP-TECH-09` | Báº¯t buá»™c cháº¡y bá»™ test tá»± Ä‘á»™ng PostgREST giáº£ láº­p táº¥n cÃ´ng chÃ©o ngÆ°á»i dÃ¹ng trÆ°á»›c khi má»Ÿ lÆ°u lÆ°á»£ng; cáº¥m bypass RLS. | `COMP-INFRA-02` | Cá»•ng M3.2 |
| **RSK-03** | Suy giáº£m hiá»‡u nÄƒng truy váº¥n bÃ i há»c do Ä‘á»‡ quy kiá»ƒm tra tráº¡ng thÃ¡i Unit | `TRUNG BÃŒNH` (TÄƒng Ä‘á»™ trá»… API) | `COMP-DOM-02` | Thiáº¿t láº­p chá»‰ má»¥c phá»©c há»£p trÃªn cáº·p `(course_id, order_index)` vÃ  chá»‰ má»¥c trÃªn trÆ°á»ng `status`; táº¡o view Ä‘á»‡m náº¿u cáº§n. | `COMP-DOM-02` | Cá»•ng M3.3 |
| **RSK-04** | Táº¯c ngháº½n hiá»‡u nÄƒng truy váº¥n tiáº¿n Ä‘á»™ há»c táº­p vÃ  bÃ i táº­p khi táº£i Ä‘á»“ng thá»i tÄƒng | `TRUNG BÃŒNH` (TÄƒng Ä‘á»™ trá»… API bÃ i há»c) | `DEP-TECH-02` | Tá»‘i Æ°u chá»‰ má»¥c truy váº¥n trÃªn `user_progress` vÃ  tráº¡ng thÃ¡i bÃ i há»c, thá»±c thi truy váº¥n tá»‘i Æ°u táº¡i `COMP-DOM-05` | `COMP-DOM-05` | Cá»•ng M3.3 |
| **RSK-05** | Gian láº­n Ä‘iá»ƒm chuá»—i há»c táº­p (Streak) báº±ng cÃ¡ch thao tÃºng Ä‘á»“ng há»“ client | `TRUNG BÃŒNH` (áº¢nh hÆ°á»Ÿng gamification)| `COMP-DOM-02` | Tuyá»‡t Ä‘á»‘i sá»­ dá»¥ng Ä‘á»“ng há»“ mÃ¡y chá»§ UTC lÃ m gá»‘c, chá»‰ dÃ¹ng mÃºi giá» IANA cá»§a há»c viÃªn trÃªn server Ä‘á»ƒ quy Ä‘á»•i ngÃ y lá»‹ch. | `COMP-DOM-02` | Cá»•ng M3.5 |
| **RSK-06** | Creator tá»± phÃª duyá»‡t bÃ i há»c thÃ´ng qua gá»i trá»±c tiáº¿p API bá» qua UI | `CAO` (Vi pháº¡m phÃ¢n tÃ¡ch nhiá»‡m vá»¥) | `COMP-DOM-06` | CÃ i Ä‘áº·t trigger cÆ¡ sá»Ÿ dá»¯ liá»‡u Ä‘á»™c láº­p á»Ÿ táº§ng PostgreSQL tá»« chá»‘i giao dá»‹ch; khÃ´ng phá»¥ thuá»™c vÃ o kiá»ƒm tra UI. | `COMP-INFRA-02` | Cá»•ng M3.6 |
| **RSK-07** | Thiáº¿u dá»¯ liá»‡u thá»±c nghiá»‡m phá»¥c vá»¥ viáº¿t ChÆ°Æ¡ng 5 cá»§a Luáº­n vÄƒn | `TRUNG BÃŒNH` (Cháº­m tiáº¿n Ä‘á»™ bÃ¡o cÃ¡o) | `DEP-GOV-04` | Thu tháº­p báº±ng chá»©ng liÃªn tá»¥c táº¡i tá»«ng má»‘c (Code Ä‘áº¿n Ä‘Ã¢u thu test log, benchmark vÃ  áº£nh chá»¥p Ä‘áº¿n Ä‘Ã³). | ToÃ n bá»™ há»‡ thá»‘ng | Cá»•ng M3.10 |

---

### 19.1 P0 Decision Queue — Status by Approved Scope

This is the existing owner for Phase 2 entry blockers. Rows marked `CONFLICT` or `OPEN` are unresolved. A `RESOLVED` row records only the decision scope explicitly accepted in `logs/decision-log.md`; it does not independently authorize implementation. Record an approved outcome before dependent implementation. A roadmap row, task status, test frame, or historical log does not decide these questions.

| ID | Status | Decision required | Blocks |
|---|---|---|---|
| P0-D01 | `RESOLVED` | Replaced the former task-state conflict: the reconciliation task is explicitly authorized and snapshotted; the master roadmap remains a non-authorizing draft; the prior active task is preserved in the archive. | None |
| P0-D02 | `RESOLVED — domain/documentation only` | ADR-034 approves exactly three business roles (Admin, Teacher, Learner), one role/account, controlled staff provisioning, no role-conversion UI, separate Learner account for staff who learn, Admin-owned curriculum requirements/assignments/reassignment/review/approval/publish-only-after-approval, Teacher authoring only assigned work, no Admin author/self-approval path, and versioned UC crosswalk. No physical role mapping or implementation is approved. | Physical role enum/claims/RLS, auth enforcement, assignment persistence and database mapping remain P0-D07 |
| P0-D03 | `RESOLVED` | ADR-031 accepts domain ownership: one context per user+learned Language, at most two `ACTIVE`, lifecycle `ACTIVE`/`PAUSED`; global account state on `Profile`; language-specific state and logical progress ownership on `LearningContext`; context-scoped assessment evidence; global User+Vocabulary SRS and account streak; no required persisted `SkillProfile`, LearningPlan, or Enrollment by default. Domain decision only; no physical schema or implementation authorization. | Physical realization/FK target remains P0-D07; placement policy is resolved by P0-D05/ADR-032; MVP progression/activity policy is resolved by P0-D06/ADR-033 |
| P0-D04 | `RESOLVED` | Accepted shared curriculum/content domain decision (ADR-030): one shared/core Course per learnable Language in MVP by convention; learner purpose personalizes a deterministic plan; framework-aware levels; context-scoped placement evidence; no Track now. This is a domain target only, not a physical schema decision or implementation authorization. | Physical schema work requires a separate approved task and remains subject to P0-D07 |
| P0-D05 | `RESOLVED` | ADR-032 accepts MVP Placement as context-scoped onboarding/diagnostic for a recommended starting level; self-report/default entry remain distinct and unverified; no permanent lock or lifetime quota; completed evidence is retained; assessment parameters are configuration; stage-adaptive Placement is deferred for MVP. English values and Mapping A require separate configuration review. Domain decision only; no implementation authorization. | Physical evidence/session/submission representation and runtime configuration remain P0-D07; level-up policy is resolved by P0-D06/ADR-033 |
| P0-D06 | `RESOLVED` | ADR-033 accepts MVP domain rules for lesson completion separate from performance; retry/redo semantics; unweighted required-lesson progress; mostly-sequential core; course-defined completion gate plus level-up assessment; Jump deferred; distinct retake/reassessment; deterministic LearningPlan recalculation; simple weak-skill review; and account-global qualifying streak activity. English-specific values remain unselected configuration, and no physical or implementation choice is authorized. | Physical progress/performance/attempt representation and runtime reconciliation remain P0-D07 |
| P0-D07 | `RESOLVED — LOGICAL PRODUCT/SECURITY TARGET ONLY` | ADR-035 approves trusted-subject identity (`auth.uid()`), server-controlled role/status and immediate disable enforcement; no auto-mapping ambiguous legacy roles; assignment-to-Lesson/content-package semantics, one responsible Teacher, attribution/history and minimal optimistic concurrency; separate assignment/content lifecycles, immutable approved/published revisions, atomic publication replacement, no hard delete after learner references, Lesson/revision publication unit and derived Unit/Course visibility; server grading, answer secrecy, incomplete-attempt/no-result, idempotent same-submission retry and aggregate-only Placement/Level-up/Reassessment outcomes; Policy B with server/RPC scheduling and idempotency; and minimum append-only logical security-audit events/admin read access. AI compatibility is outside this decision. No physical schema or implementation is approved. | Full CURRENT + TARGET Modeling Review; live DB read-only reconciliation and separately approved physical/implementation design before dependent diagrams that assert deployment facts or any implementation/migration. Physical role mapping/enforcement, assignment/revision/result/SRS/audit persistence, context FK, `Profile.dailyGoalMin`, `UserProgress.score`, migration state, grants/RLS/RPC remain deferred/unverified. |

**Exit rule:** Each P0 row resolves only the scope recorded in its ADR. P0-D07's logical target is resolved by ADR-035; the required next task is **Full CURRENT + TARGET Modeling Review**, including read-only live-database reconciliation before making current deployment claims. Do not start implementation or migration before that modeling review and a separately approved bounded implementation task.

**Catalog scope note (2026-10-10):** Remaining roadmap statements that presume fourteen implemented/in-scope core use cases, including blanket M3.8 E2E coverage, are draft targets only. The current catalog has fourteen numbered entries and UC-03 reminders are deferred; the actual deliverable/test set must be selected in a separately approved milestone task.
## 20. Lá»˜ TRÃŒNH Tá»”NG THá»‚ GIAI ÄOáº N 2 (MASTER ROADMAP M3.1..M3.10)

Lá»™ trÃ¬nh tá»•ng thá»ƒ Giai Ä‘oáº¡n 2 bao gá»“m **10 má»‘c triá»ƒn khai chuáº©n táº¯c (M3.1 Ä‘áº¿n M3.10)**, Ä‘Æ°á»£c thiáº¿t káº¿ ná»‘i tiáº¿p nhau theo thá»© báº­c phá»¥ thuá»™c kiáº¿n trÃºc, káº¿ thá»«a trá»n váº¹n tá»« M2.6 vÃ  dáº«n dáº¯t toÃ n bá»™ dá»± Ã¡n Ä‘áº¿n Ä‘Ã­ch sáºµn sÃ ng trÃ¬nh diá»…n vÃ  hoÃ n thiá»‡n há»“ sÆ¡ bÃ¡o cÃ¡o/báº£o vá»‡:

```text
====================================================================================================
                        LINGORA PHASE 2 MASTER IMPLEMENTATION ROADMAP
====================================================================================================

[PHASE 1: SYSTEM DESIGN] â”€â”€(M2.6 Accepted @ 4c8a7db)â”€â”€â”
                                                      â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚
â”œâ”€â”€ M3.1: Foundation (Database & Schema Migration Strategy)
â”‚   â”œâ”€â”€ Má»¥c tiÃªu: Triá»ƒn khai lÆ°á»£c Ä‘á»“ váº­t lÃ½, báº£ng units, lesson_revisions, assessment_results, seed A1 qua WP-CONTENT.
â”‚   â””â”€â”€ Cá»•ng nghiá»‡m thu: Schema validation PASS, Migration UP/DOWN verified, Seed 6 Units A1 complete.
â”‚
â”œâ”€â”€ M3.2: Authentication, RBAC, RLS & SoD Engine
â”‚   â”œâ”€â”€ Má»¥c tiÃªu: NÃ¢ng cáº¥p 6 vai trÃ², ma tráº­n chÃ­nh sÃ¡ch RLS kÃ©p, triggers cháº·n vi pháº¡m SoD, audit logs.
â”‚   â””â”€â”€ Cá»•ng nghiá»‡m thu: 6-Role JWT auth PASS, Cross-user RLS isolation PASS, SoD denial tests PASS (Frames 12â€“16).
â”‚
â”œâ”€â”€ M3.3: Learner Core (Lesson & Exercise Execution Engine)
â”‚   â”œâ”€â”€ Má»¥c tiÃªu: TrÃ¬nh phÃ¡t bÃ i há»c, 5 dáº¡ng tÆ°Æ¡ng tÃ¡c bÃ i táº­p (MCQ, Fill, Reorder, Listening, Grammar), ná»n táº£ng locale i18n sÆ¡ bá»™.
â”‚   â””â”€â”€ Cá»•ng nghiá»‡m thu: 5 Exercise types interactive PASS, Unit 4/4 Published condition verified, i18n locale foundation PASS.
â”‚
â”œâ”€â”€ M3.4: Assessment & Progression Engine (Placement, Starting Point, Skip, Retake)
â”‚   â”œâ”€â”€ Má»¥c tiÃªu: Äá»™ng cÆ¡ cháº©n Ä‘oÃ¡n 30 cÃ¢u (1 Ä‘iá»ƒm thÃ´/cÃ¢u, raw score 0â€“30), Mapping A (0â€“30 ra Unit 1â€“6), Skip Branch A, Retake báº¥t biáº¿n.
â”‚   â””â”€â”€ Cá»•ng nghiá»‡m thu: Mapping A 12 boundary vectors PASS (Frames 1â€“3), Skip 0-record PASS, Retake immutable PASS.
â”‚
â”œâ”€â”€ M3.5: Learning Intelligence (Controlled Retry, SRS Policy B, Jump Challenge, Streak)
â”‚   â”œâ”€â”€ Má»¥c tiÃªu: Háº¡n má»©c retry max(1, floor(N*0.10)) tráº§n 70%, SRS Policy B [1,3,7,14,30], Jump >=95%, Streak IANA.
â”‚   â””â”€â”€ Cá»•ng nghiá»‡m thu: Retry credit 70% PASS, SRS RPC determinism PASS, Jump 24h lockout PASS, Streak PASS (Frames 4â€“11).
â”‚
â”œâ”€â”€ M3.6: Content Governance & Moderation (Authoring, Review, Publish, Emergency, Clone-to-Draft)
â”‚   â”œâ”€â”€ Má»¥c tiÃªu: PhÃ¢n cÃ´ng Manager, soáº¡n tháº£o Creator, duyá»‡t bÃ i Moderator, xuáº¥t báº£n, Admin kháº©n cáº¥p kÃ¨m lÃ½ do.
â”‚   â””â”€â”€ Cá»•ng nghiá»‡m thu: VÃ²ng Ä‘á»i 6 tráº¡ng thÃ¡i PASS, Creator no self-approve PASS, Clone-to-Draft v2 PASS.
â”‚
â”œâ”€â”€ M3.7: Cross-Cutting Supporting Infrastructure (i18n Completion & Shared BFF Utilities)
â”‚   â”œâ”€â”€ Má»¥c tiÃªu: HoÃ n thiá»‡n há»— trá»£ song ngá»¯ giao diá»‡n i18n (vi/en) theo P1-FR-010/YC-EXT-06, bilingual sync toÃ n diá»‡n vÃ  tiá»‡n Ã­ch BFF dÃ¹ng chung phá»¥c vá»¥ M3.8.
â”‚   â””â”€â”€ Cá»•ng nghiá»‡m thu: i18n locale switching PASS, UI catalog fallback PASS, Shared BFF helpers PASS.
â”‚
â”œâ”€â”€ M3.8: System Integration & End-to-End Learner Journey
â”‚   â”œâ”€â”€ Má»¥c tiÃªu: Láº¯p ghÃ©p toÃ n bá»™ cÃ¡c phÃ¢n há»‡ thÃ nh luá»“ng há»c táº­p vÃ  quáº£n trá»‹ hoÃ n chá»‰nh; kiá»ƒm thá»­ E2E Playwright cho 14 Core Use Cases (loáº¡i trá»« UC-15 lÃ  Future Extension).
â”‚   â””â”€â”€ Cá»•ng nghiá»‡m thu: 14 Core Use Cases (UC-1..UC-14) E2E pass , Zero broken routes.
â”‚
â”œâ”€â”€ M3.9: System Hardening, Performance & Security Verification
â”‚   â”œâ”€â”€ Má»¥c tiÃªu: RÃ  soÃ¡t an ninh toÃ n diá»‡n, Ä‘o lÆ°á»ng tiÃªu chÃ­ phi chá»©c nÄƒng NFR (k6 benchmark, Lighthouse).
â”‚   â””â”€â”€ Cá»•ng nghiá»‡m thu: NFR Measured recorded, Security audit clean, Zero P0/P1 issues.
â”‚
â””â”€â”€ M3.10: Academic Closure & Academic Report Evidence Consolidation
    â”œâ”€â”€ Má»¥c tiÃªu: Thu tháº­p toÃ n bá»™ báº±ng chá»©ng cho 5 chÆ°Æ¡ng bÃ¡o cÃ¡o há»c thuáº­t, Ä‘Ã³ng gÃ³i ká»‹ch báº£n demo 4 Acts.
    â””â”€â”€ Cá»•ng nghiá»‡m thu: BÃ¡o cÃ¡o Word/Markdown Ä‘á»“ng bá»™ 100%, 4 Acts demo hoÃ n chá»‰nh, sáºµn sÃ ng trÃ¬nh diá»…n vÃ  hoÃ n thiá»‡n há»“ sÆ¡ bÃ¡o cÃ¡o/báº£o vá»‡.
```

### 20.1. GÃ³i CÃ´ng Viá»‡c Chuáº©n Bá»‹ Ná»™i Dung & Dá»¯ Liá»‡u Máº§m (WP-CONTENT: Content Preparation & Data Seeding Work Package)

Äá»ƒ Ä‘áº£m báº£o tÃ­nh liÃªn tá»¥c vÃ  loáº¡i bá» rá»§i ro thiáº¿u dá»¯ liá»‡u kiá»ƒm thá»­ giá»¯a cÃ¡c má»‘c triá»ƒn khai Ä‘á»™c láº­p, toÃ n bá»™ tÃ i nguyÃªn há»c liá»‡u vÃ  dá»¯ liá»‡u máº§m Ä‘Æ°á»£c quáº£n lÃ½ thÃ nh má»™t **GÃ³i CÃ´ng Viá»‡c Chuáº©n Bá»‹ Ná»™i Dung XuyÃªn Suá»‘t (WP-CONTENT)** phá»¥c vá»¥ tá»« M3.1 tá»›i M3.10:

1. **24 BÃ i há»c Chuáº©n táº¯c CEFR A1 (6 Units $\times$ 4 Lessons):** Dá»¯ liá»‡u giÃ¡o trÃ¬nh hoÃ n chá»‰nh tuÃ¢n thá»§ `docs/08-english-a1-curriculum.md`, bao gá»“m tiÃªu Ä‘á», mÃ´ táº£, ná»™i dung bÃ i há»c ngá»¯ cáº£nh theo chá»§ Ä‘á» Ä‘á»i sá»‘ng vÃ  giao tiáº¿p hÃ ng ngÃ y.
2. **Bá»™ Tá»« Ä‘iá»ƒn Song ngá»¯ (Bilingual Vocabulary Catalog):** Danh má»¥c tá»« vá»±ng tiáº¿ng Anh kÃ¨m phiÃªn Ã¢m, nghÄ©a tiáº¿ng Viá»‡t, cÃ¢u vÃ­ dá»¥ song ngá»¯ gáº¯n liá»n vá»›i tá»«ng bÃ i há»c vÃ  bÃ i kiá»ƒm tra cháº©n Ä‘oÃ¡n.
3. **Tá»‡p Ã‚m thanh TÄ©nh Chuáº©n (Static Audio MP3 Assets):** ToÃ n bá»™ tá»‡p Ã¢m thanh tÄ©nh phá»¥c vá»¥ bÃ i táº­p dáº¡ng Listening vÃ  phÃ¡t Ã¢m tá»« vá»±ng (Ä‘áº·t trong thÆ° má»¥c tÄ©nh/public/CDN media, phá»¥c vá»¥ trá»±c tiáº¿p khÃ´ng qua dá»‹ch vá»¥ TTS Ä‘á»™ng thá»i gian thá»±c).
4. **Bá»™ Dá»¯ liá»‡u 5 Dáº¡ng BÃ i táº­p TÆ°Æ¡ng tÃ¡c (Interactive Exercise Fixtures):** Bá»™ cÃ¢u há»i vÃ  Ä‘Ã¡p Ã¡n cho 5 dáº¡ng bÃ i táº­p cá»‘t lÃµi (Multiple Choice, Fill-in-the-Blank, Word Reordering, Listening Comprehension, Grammar Selection) tÃ­ch há»£p trong tá»«ng bÃ i há»c.
5. **Bá»™ 30 CÃ¢u há»i ÄÃ¡nh giÃ¡ NÄƒng lá»±c (Diagnostic Placement Items):** 30 cÃ¢u há»i chuáº©n hÃ³a raw score 0..30 bao quÃ¡t 4 ká»¹ nÄƒng cá»‘t lÃµi (Vocabulary, Grammar, Reading, Listening), Ä‘i kÃ¨m barem Ä‘Ã¡p Ã¡n mÃ¡y chá»§ Ä‘á»ƒ phÃ¢n lá»›p Mapping A ra Units 1â€“6.
6. **Bá»™ Äá» Kiá»ƒm tra VÆ°á»£t cáº¥p (Jump Challenge Content Fixtures):** NgÃ¢n hÃ ng Ä‘á» kiá»ƒm tra vÆ°á»£t cáº¥p toÃ n diá»‡n cho tá»«ng Unit, phá»¥c vá»¥ xÃ¡c thá»±c ngÆ°á»¡ng Ä‘iá»ƒm $\ge 95\%$ cá»§a tÃ­nh nÄƒng Jump Challenge.
7. **Dá»¯ liá»‡u Máº§m PhÃ¢n tÃ¡ch Tháº©m quyá»n Ná»™i dung (Governance Lifecycle & SoD Fixtures):** CÃ¡c báº£n ghi bÃ i há»c báº£n tháº£o (Draft), chá» duyá»‡t (In Review), yÃªu cáº§u chá»‰nh sá»­a (Changes Requested), Ä‘Ã£ duyá»‡t (Approved), Ä‘Ã£ xuáº¥t báº£n (Published), báº£n ghi nhÃ¢n báº£n v2 (Clone-to-Draft v2 vá»›i con trá» `supersedes_id`), vÃ  ká»‹ch báº£n Unit Ã¢m tÃ­nh (3/4 bÃ i Published) phá»¥c vá»¥ kiá»ƒm thá»­ phÃ¢n quyá»n vÃ  demo Admin.

---

### 20.2. Ma Tráº­n Káº¿ Hoáº¡ch, Ná»— Lá»±c, PhÃ¢n TrÃ¡ch & Cá»•ng Nghiá»‡m Thu Tá»«ng Má»‘c (Milestone Schedule & Exit Criteria)

| Má»‘c | TÃªn PhÃ¢n Há»‡ & Trá»ng TÃ¢m Triá»ƒn Khai | Äiá»ƒm Story (SP) | Ná»— Lá»±c (person-days) | NgÆ°á»i Phá»¥ TrÃ¡ch (Owner) | Háº¡n Äá»‹nh (Deadline) | PhÃ¢n Há»‡ Sá»Ÿ Há»¯u | Äiá»u Kiá»‡n Tiá»n Äá» (Inbound Deps) | Sáº£n Pháº©m Chuyá»ƒn Giao ChÃ­nh (Primary Deliverables) | TiÃªu ChÃ­ Äáº§u Ra & Cá»•ng Nghiá»‡m Thu Cá»¥ Thá»ƒ (Concrete Exit Criteria) |
|---|---|---|---|---|---|---|---|---|---|
| **M3.1** | **Foundation: CÆ¡ Sá»Ÿ Dá»¯ Liá»‡u & LÆ°á»£c Äá»“ Váº­t LÃ½** | 3 SP | 2.5 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | `lingora-admin` (Prisma DDL), PostgreSQL | M2.6 Design Sign-off (`commit 4c8a7db`), `schema.prisma`, `WP-CONTENT` | â€¢ Báº£ng `units`, `lesson_revisions`, `assessment_results`, `skill_profiles`<br>â€¢ NÃ¢ng cáº¥p enum Role lÃªn 6 giÃ¡ trá»‹ váº­t lÃ½<br>â€¢ Script seed 6 Units A1 (Learning & Governance fixtures qua `WP-CONTENT`)<br>â€¢ Quyáº¿t Ä‘á»‹nh biá»ƒu diá»…n váº­t lÃ½ (Â§5.3): Barem Ä‘Ã¡p Ã¡n (Answer Security), Placement/Jump (Unified Model), Attempt/Retry (D7), Cooldown 24h, Skip status | â€¢ `npx prisma validate` PASS<br>â€¢ Script migration UP/DOWN kiá»ƒm chá»©ng thÃ nh cÃ´ng<br>â€¢ Catalog DB xÃ¡c nháº­n 6 Units & 24 bÃ i há»c Ä‘Ãºng cáº¥u trÃºc<br>â€¢ Cá»•ng nghiá»‡m thu Â§5.3 Ä‘áº¡t: Quyáº¿t Ä‘á»‹nh phÃ¢n tÃ¡ch bÃ­ máº­t cháº¥m Ä‘iá»ƒm & test phá»§ Ä‘á»‹nh; Chá»‘t cháº·n trá»±c tiáº¿p Unit 4/4; KhÃ³a biá»ƒu diá»…n Placement 30 cÃ¢u & Jump (khÃ´ng entity ma); KhÃ³a biá»ƒu diá»…n Retry & Cooldown & Skip |
| **M3.2** | **Security: XÃ¡c Thá»±c, RBAC, RLS & PhÃ¢n TÃ¡ch Nhiá»‡m Vá»¥ (SoD)** | 5 SP | 3.5 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | PostgreSQL (RLS/Triggers), Supabase Auth, BFF Layer | M3.1 (LÆ°á»£c Ä‘á»“ DB) | â€¢ 6-Role JWT helper & Context propagation<br>â€¢ PostgreSQL Column-Level Grant trÃªn `profiles`<br>â€¢ Ma tráº­n RLS kÃ©p trÃªn toÃ n bá»™ cÃ¡c báº£ng nghiá»‡p vá»¥ (khÃ´ng Ä‘á»‡ quy)<br>â€¢ Triggers cháº·n vi pháº¡m SoD & Audit Log Append-Only | â€¢ Vitest Security Suite PASS (Frames 12â€“16)<br>â€¢ Kiá»ƒm thá»­ cÃ´ láº­p dá»¯ liá»‡u chÃ©o (Cross-tenant/Cross-user) PASS<br>â€¢ Thao tÃ¡c phÃª duyá»‡t tá»« tÃ i khoáº£n Creator bá»‹ tá»« chá»‘i `403 Forbidden` / `ROLE_UNAUTHORIZED` |
| **M3.3** | **Learner Core: Giao Diá»‡n Ná»™i Dung BÃ i Há»c, TrÃ¬nh PhÃ¡t & Äá»™ng CÆ¡ 5 Dáº¡ng BÃ i Táº­p** | 5 SP | 4.5 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | `lingora-web` (App Router), `lingora-media` | M3.1 (Cáº¥u trÃºc Unit/Lesson), M3.2 (RLS Learner read), `WP-CONTENT` | â€¢ Giao diá»‡n xem ná»™i dung bÃ i há»c (Lesson Content Viewer): hiá»ƒn thá»‹ tá»« vá»±ng, phiÃªn Ã¢m, giáº£i nghÄ©a tiáº¿ng Viá»‡t, cÃ¢u vÃ­ dá»¥, audio phÃ¡t Ã¢m chuáº©n tá»« Storage, tÃ³m táº¯t ngá»¯ phÃ¡p trÆ°á»›c khi vÃ o bÃ i táº­p<br>â€¢ Giao diá»‡n trÃ¬nh phÃ¡t bÃ i há»c tÆ°Æ¡ng tÃ¡c<br>â€¢ Bá»™ 5 components bÃ i táº­p: MCQ, Fill-in-Blank, Reorder, Listening (MP3 tÄ©nh), Grammar Selection<br>â€¢ Chá»‘t cháº·n Ä‘iá»u kiá»‡n Unit 4/4 Published táº¡i táº§ng BFF/DB (Direct Access Denial: `UI hiding != Authorization`)<br>â€¢ Ná»n táº£ng cáº¥u trÃºc Ä‘a ngá»¯ i18n sÆ¡ bá»™ (vi/en locale foundation) | â€¢ Vitest Component & Runner Suite PASS (Lesson Content Viewer render Ä‘Ãºng há»c liá»‡u trÆ°á»›c bÃ i táº­p; 5 Exercise Types tÆ°Æ¡ng tÃ¡c khÃ´ng lá»—i; Unit 4/4 Rule: Unit 3/4 Published tá»± Ä‘á»™ng áº©n vÃ  cháº·n truy cáº­p trá»±c tiáº¿p 403/404; i18n locale foundation)<br>â€¢ Flow há»c viÃªn xÃ¡c nháº­n: Open Lesson $\rightarrow$ Lesson Content Viewer $\rightarrow$ Start Exercises $\rightarrow$ Exercise Sequence $\rightarrow$ Lesson Result / Progress<br>â€¢ Tráº£ vá» payload khÃ´ng chá»©a barem Ä‘Ã¡p Ã¡n mÃ¡y chá»§ PASS |

| **M3.4** | **Assessment: ÄÃ¡nh GiÃ¡ NÄƒng Lá»±c, XÃ¡c Äá»‹nh Äiá»ƒm Báº¯t Äáº§u & NhÃ¡nh Ráº½** | 5 SP | 3.5 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | `lingora-web` (BFF & UI), PostgreSQL (`assessment_results`) | M3.1 (LÆ°á»£c Ä‘á»“ kháº£o sÃ¡t), M3.3 (Cáº¥u trÃºc bÃ i há»c), `WP-CONTENT` (30 items) | â€¢ BÃ i kiá»ƒm tra cháº©n Ä‘oÃ¡n 30 cÃ¢u (1 cÃ¢u = 1 Ä‘iá»ƒm thÃ´, raw score 0â€“30) phá»§ 4 ká»¹ nÄƒng (Vocab, Grammar, Reading, Listening)<br>â€¢ Äá»™ng cÆ¡ phÃ¢n lá»›p Mapping A (0â€“30 Ä‘iá»ƒm thÃ´ $\rightarrow$ Units 1â€“6)<br>â€¢ Luá»“ng Skip (báº¯t Ä‘áº§u Unit 1, UNVERIFIED, 0 báº£n ghi káº¿t quáº£)<br>â€¢ Luá»“ng Retake (lÆ°u lá»‹ch sá»­ báº¥t biáº¿n, báº£o lÆ°u má»‘c xuáº¥t phÃ¡t) | â€¢ Vitest Assessment Suite PASS (Frames 1â€“3)<br>â€¢ 12 Test Vectors biÃªn cá»§a Mapping A PASS 100%<br>â€¢ Kiá»ƒm thá»­ Skip khÃ´ng táº¡o báº£n ghi rÃ¡c PASS<br>â€¢ Kiá»ƒm thá»­ Retake ghi nháº­n Ä‘Ãºng báº£n ghi má»›i PASS |
| **M3.5** | **Intelligence: Controlled Retry, SRS Policy B, Jump & Streak** | 5 SP | 4.5 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | PostgreSQL (RPCs), `lingora-web` (BFF & Client) | M3.3 (Lesson Engine), M3.4 (Tiáº¿n Ä‘á»™ há»c), `WP-CONTENT` (Jump sets) | â€¢ Äá»™ng cÆ¡ Controlled Retry: $\max(1, \lfloor N \times 0.10 \rfloor)$, tráº§n Ä‘iá»ƒm 70%<br>â€¢ PostgreSQL RPC `record_review`: SRS Policy B $[1, 3, 7, 14, 30]$ ngÃ y táº¥t Ä‘á»‹nh<br>â€¢ Äá»™ng cÆ¡ Jump Challenge: ngÆ°á»¡ng $\ge 95\%$, khÃ³a 24h, gÃ¡n `by_jump = true`<br>â€¢ Äá»™ng cÆ¡ Daily Streak: tÃ­nh theo mÃºi giá» IANA, reset vá» 1 khi Ä‘á»©t chuá»—i | â€¢ Vitest / RPC Test Suite PASS (Frames 4â€“11)<br>â€¢ Háº¡n má»©c retry vÆ°á»£t ngÆ°á»¡ng bá»‹ cháº·n 403 Forbidden<br>â€¢ RPC SRS tráº£ Ä‘Ãºng chu ká»³ táº¥t Ä‘á»‹nh khi Ä‘Ãºng/sai<br>â€¢ Jump khÃ³a 24h hoáº¡t Ä‘á»™ng chÃ­nh xÃ¡c theo server time |
| **M3.6** | **Governance: Quáº£n Trá»‹ Ná»™i Dung, Duyá»‡t BÃ i & Xuáº¥t Báº£n Kháº©n Cáº¥p** | 5 SP | 4.0 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | `lingora-admin` (Next.js Dashboard & API routes), PostgreSQL | M3.1 (LÆ°á»£c Ä‘á»“ Revisions), M3.2 (RBAC / SoD), `WP-CONTENT` | â€¢ Giao diá»‡n soáº¡n tháº£o & ná»™p duyá»‡t bÃ i há»c (Creator)<br>â€¢ HÃ ng Ä‘á»£i kiá»ƒm duyá»‡t & phÃª duyá»‡t (Moderator)<br>â€¢ HÃ nh Ä‘á»™ng xuáº¥t báº£n & lÆ°u trá»¯ (Org Manager)<br>â€¢ Luá»“ng Admin xuáº¥t báº£n kháº©n cáº¥p (kÃ¨m lÃ½ do báº¯t buá»™c & ghi log kiá»ƒm toÃ¡n)<br>â€¢ Quy trÃ¬nh Clone-to-Draft v2 vá»›i con trá» `supersedes_id` | â€¢ Admin Governance Test Suite PASS (Frames 13, 14, 15, 16 SoD / Governance)<br>â€¢ Kiá»ƒm thá»­ chuyá»ƒn tráº¡ng thÃ¡i 6 bÆ°á»›c chuáº©n xÃ¡c<br>â€¢ Admin xuáº¥t báº£n kháº©n cáº¥p ghi nháº­n Ä‘Ãºng sá»± kiá»‡n vÃ o `audit_logs`<br>â€¢ Clone-to-Draft v2 táº¡o báº£n ghi má»›i káº¿ thá»«a ná»™i dung v1 |
| **M3.7** | **Cross-Cutting: HoÃ n Thiá»‡n Äa Ngá»¯ (i18n) & Tiá»‡n Ãch BFF DÃ¹ng Chung** | 3 SP | 2.5 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | `lingora-web` & `lingora-admin` (Shared Layer) | M3.3 (i18n locale foundation), M3.5, M3.6, `WP-CONTENT` | â€¢ HoÃ n thiá»‡n bá»™ tá»« Ä‘iá»ƒn song ngá»¯ giao diá»‡n (vi/en) theo P1-FR-010 / YC-EXT-06 vÃ  Ä‘á»“ng bá»™ catalog song ngá»¯<br>â€¢ Component chuyá»ƒn Ä‘á»•i ngÃ´n ngá»¯ hiá»ƒn thá»‹ giao diá»‡n tá»©c thÃ¬ vÃ  lÆ°u trá»¯ tÃ¹y chá»n ngÃ´n ngá»¯ ngÆ°á»i dÃ¹ng<br>â€¢ CÃ¡c hÃ m tiá»‡n Ã­ch dÃ¹ng chung táº§ng BFF (chuáº©n hÃ³a lá»—i, phong bÃ¬ API, xá»­ lÃ½ retry máº¡ng phÃ­a client) phá»¥c vá»¥ M3.8 | â€¢ Kiá»ƒm thá»­ chuyá»ƒn Ä‘á»•i ngÃ´n ngá»¯ UI khÃ´ng lÃ m vá»¡ layout PASS<br>â€¢ KhÃ´ng cÃ²n chuá»—i vÄƒn báº£n cá»©ng thiáº¿u khÃ³a Ä‘a ngá»¯ trong luá»“ng há»c viÃªn<br>â€¢ Bá»™ hÃ m tiá»‡n Ã­ch BFF vÆ°á»£t qua unit test Ä‘á»™c láº­p |
| **M3.8** | **Integration: TÃ­ch Há»£p Há»‡ Thá»‘ng ToÃ n Diá»‡n & Luá»“ng NgÆ°á»i DÃ¹ng E2E** | 5 SP | 4.5 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | Full-stack (`lingora-web`, `lingora-admin`, Supabase) | M3.1 Ä‘áº¿n M3.7 | â€¢ TÃ­ch há»£p liÃªn thÃ´ng toÃ n bá»™ 14 Core Use Cases (UC-01 Ä‘áº¿n UC-14; UC-15 ngoáº¡i lá»‡ Extension)<br>â€¢ Bá»™ ká»‹ch báº£n kiá»ƒm thá»­ tá»± Ä‘á»™ng Playwright E2E cháº¡y trÃªn dá»¯ liá»‡u máº§m tháº­t | â€¢ Playwright E2E Suite PASS trÃªn 14 Use Cases cá»‘t lÃµi<br>â€¢ KhÃ´ng cÃ³ trang nÃ o bá»‹ lá»—i 404/500 trÃªn Ä‘Æ°á»ng Ä‘i cá»§a ngÆ°á»i dÃ¹ng<br>â€¢ Chuyá»ƒn tiáº¿p mÆ°á»£t mÃ  tá»« ÄÄƒng kÃ½ $\rightarrow$ Placement $\rightarrow$ BÃ i há»c $\rightarrow$ Ã”n táº­p SRS $\rightarrow$ Admin duyá»‡t bÃ i |
| **M3.9** | **Hardening: Tá»‘i Æ¯u Hiá»‡u NÄƒng, Äo LÆ°á»ng NFR & RÃ  SoÃ¡t An Ninh** | 3 SP | 2.5 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | Háº¡ táº§ng, Báº£o máº­t & Kiá»ƒm thá»­ táº£i | M3.8 (Há»‡ thá»‘ng Ä‘Ã£ tÃ­ch há»£p) | â€¢ Ká»‹ch báº£n kiá»ƒm thá»­ táº£i k6 Ä‘o lÆ°á»ng thÃ´ng lÆ°á»£ng & Ä‘á»™ trá»… API<br>â€¢ ÄÃ¡nh giÃ¡ hiá»‡u nÄƒng giao diá»‡n Lighthouse<br>â€¢ QuÃ©t an ninh tÄ©nh (Secret scan) & kiá»ƒm thá»­ thÃ¢m nháº­p OWASP cÆ¡ báº£n | â€¢ Chá»‰ sá»‘ NFR Ä‘áº¡t chuáº©n ghi nháº­n vÃ o test log (P95 latency < 500ms, Lighthouse > 80)<br>â€¢ KhÃ´ng cÃ³ lá»— há»•ng báº£o máº­t cáº¥p nghiÃªm trá»ng (Sev-1/Sev-2)<br>â€¢ KhÃ´ng rÃ² rá»‰ mÃ£ bÃ­ máº­t hoáº·c thÃ´ng tin nháº¡y cáº£m trong mÃ£ nguá»“n vÃ  log |
| **M3.10** | **Academic Closure: ÄÃ³ng GÃ³i Ká»‹ch Báº£n Demo & Äá»“ng Bá»™ BÃ¡o CÃ¡o Luáº­n VÄƒn** | 3 SP | 2.5 person-days | TBD â€” Human Assignment | TBD â€” Human Deadline | Quáº£n lÃ½ dá»± Ã¡n, TÃ i liá»‡u há»c thuáº­t & Thuyáº¿t trÃ¬nh | M3.8, M3.9 | â€¢ BÃ¡o cÃ¡o há»c thuáº­t 5 chÆ°Æ¡ng (Word & Markdown) Ä‘á»“ng bá»™ 100% vá»›i thá»±c táº¿ há»‡ thá»‘ng Ä‘Ã£ cÃ i Ä‘áº·t<br>â€¢ Ká»‹ch báº£n trÃ¬nh diá»…n 4 Acts kÃ¨m script reset dá»¯ liá»‡u demo phÃ¡t láº¡i Ä‘Æ°á»£c<br>â€¢ Slide thuyáº¿t trÃ¬nh báº£o vá»‡ Ä‘á»“ Ã¡n kÃ¨m cÃ¡c báº±ng chá»©ng trÃ­ch xuáº¥t trá»±c tiáº¿p | â€¢ BÃ¡o cÃ¡o luáº­n vÄƒn hoÃ n chá»‰nh, sá»‘ liá»‡u kiá»ƒm thá»­ vÃ  kiáº¿n trÃºc Äƒn khá»›p 100%<br>â€¢ 4 Acts Demo diá»…n táº­p trÆ¡n tru trong thá»i lÆ°á»£ng 12â€“15 phÃºt khÃ´ng phÃ¡t sinh lá»—i<br>â€¢ Äá»§ Ä‘iá»u kiá»‡n xuáº¥t xÆ°á»Ÿng vÃ  báº£o vá»‡ trÆ°á»›c Há»™i Ä‘á»“ng cháº¥m luáº­n vÄƒn |
| **Tá»”NG** | **TOÃ€N Bá»˜ GIAI ÄOáº N 2 (PHASE 2 MASTER PLAN)** | **42 SP** | **34.5 person-days** | **TBD â€” Human Assignment** | **TBD â€” Human Deadline** | **ToÃ n bá»™ Subsystems** | **M2.6 Acceptance** | **Há»‡ thá»‘ng hoÃ n chá»‰nh + BÃ¡o cÃ¡o há»c thuáº­t 5 chÆ°Æ¡ng sáºµn sÃ ng báº£o vá»‡** | **100% Cá»•ng kiá»ƒm soÃ¡t tá»« M3.1 Ä‘áº¿n M3.10 Ä‘áº¡t PASS** |


---

## 21. RÃ€NG BUá»˜C Cá»¨NG VÃ€ Ká»¶ LUáº¬T THá»°C THI (HARD CONSTRAINTS)

Äá»ƒ báº£o Ä‘áº£m tÃ­nh toÃ n váº¹n vÃ  tuÃ¢n thá»§ tuyá»‡t Ä‘á»‘i quy táº¯c phÃ¡t triá»ƒn pháº§n má»m trong dá»± Ã¡n Lingora, toÃ n bá»™ cÃ¡c bÃªn tham gia báº¯t buá»™c pháº£i tuÃ¢n thá»§ nghiÃªm ngáº·t cÃ¡c Ä‘iá»u khoáº£n sau:

1. **KHÃ”NG THá»°C THI CODE TRONG TASK NÃ€Y:** Nhiá»‡m vá»¥ cá»§a task nÃ y thuáº§n tÃºy lÃ  xÃ¢y dá»±ng báº£n Káº¿ hoáº¡ch Tá»•ng thá»ƒ (Master Planning). Tuyá»‡t Ä‘á»‘i khÃ´ng chá»‰nh sá»­a mÃ£ nguá»“n á»©ng dá»¥ng, khÃ´ng sá»­a `schema.prisma`, khÃ´ng cháº¡y lá»‡nh migration, khÃ´ng sá»­a RLS, vÃ  khÃ´ng can thiá»‡p vÃ o cÃ¡c tá»‡p tin ngoÃ i danh má»¥c cho phÃ©p.
2. **Báº¢O Tá»’N TÃNH Báº¤T BIáº¾N Cá»¦A Há»¢P Äá»’NG API:** Tá»‡p `docs/03-api-contract.md` lÃ  há»£p Ä‘á»“ng giao tiáº¿p chuáº©n táº¯c Ä‘Ã£ Ä‘Ã³ng bÄƒng, giá»¯ nguyÃªn 100% byte-identical.
3. **Báº¢O Tá»’N CÃC THAY Äá»”I TRÃŠN WORKTREE HIá»†N Táº I:** ToÃ n bá»™ cÃ¡c thay Ä‘á»•i chÆ°a commit trÃªn nhÃ¡nh lÃ m viá»‡c hiá»‡n táº¡i (cÃ¡c tá»‡p bÃ¡o cÃ¡o há»c thuáº­t, slide thuyáº¿t trÃ¬nh, tÃ i liá»‡u phÃ¢n tÃ­ch yÃªu cáº§u) thuá»™c vá» tiáº¿n trÃ¬nh song song vÃ  pháº£i Ä‘Æ°á»£c báº£o lÆ°u nguyÃªn váº¹n, khÃ´ng Ä‘Æ°á»£c phÃ©p hoÃ n nguyÃªn hay xÃ³a bá».
4. **KHÃ”NG Tá»° Ã CHUYá»‚N TRáº NG THÃI APPROVED:** Káº¿ hoáº¡ch nÃ y Ä‘Æ°á»£c táº¡o ra á»Ÿ tráº¡ng thÃ¡i `READY FOR HUMAN REVIEW`. Chá»‰ cÃ³ ngÆ°á»i dÃ¹ng (Human Partner) má»›i cÃ³ tháº©m quyá»n chuyá»ƒn tráº¡ng thÃ¡i sang `APPROVED`. MÃ£ nguá»“n triá»ƒn khai chá»‰ Ä‘Æ°á»£c phÃ©p báº¯t Ä‘áº§u khi káº¿ hoáº¡ch Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t chÃ­nh thá»©c.
5. **Ká»¶ LUáº¬T CHUYá»‚N TIáº¾P Má»C TRIá»‚N KHAI:** Khi bÆ°á»›c vÃ o Giai Ä‘oáº¡n 2, má»—i má»‘c tá»« M3.1 Ä‘áº¿n M3.10 báº¯t buá»™c pháº£i cÃ³ má»™t káº¿ hoáº¡ch chi tiáº¿t Ä‘á»™c láº­p (`plans/current-task.md`), Ä‘Æ°á»£c tháº©m Ä‘á»‹nh Ä‘á»™c láº­p vÃ  kiá»ƒm tra Ä‘áº¡t 100% cÃ¡c cá»•ng kiá»ƒm soÃ¡t trÆ°á»›c khi chuyá»ƒn sang má»‘c tiáº¿p theo.

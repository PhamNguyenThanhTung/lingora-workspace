# Phase 1 — D4 Content & Curriculum Design (Logical Design Specification)

> **Document:** `docs/phase-1-d4-content-curriculum-design.md`  
> **Phase:** Phase 1 — System Analysis & Design (Implementation-Independent)  
> **Baseline:** D1/D2 COMPLETE (`docs/phase-1-m2-1-domain-and-logical-data-foundation.md`), D3 ACCEPTED FOR D4 (`docs/phase-1-d3-assessment-learning-engine-design.md`), English A1 Curriculum (`docs/08-english-a1-curriculum.md`), Placement & Jump Spec (`docs/09-placement-and-jump-specification.md`), Architecture (`docs/01-architecture.md`)  
> **Status:** `READY FOR INDEPENDENT REVIEW`  
> **Boundary:** Logical design and authoring specification only. Zero runtime code, zero Prisma/Supabase schema migrations, zero scoring/adaptive/recommendation algorithms, zero UI implementation. Design Freeze NOT claimed. No `AssessmentSession`, `Exam`, or `QuestionBank` ghost entities.

---

## A. Objective

This document defines the comprehensive logical content and curriculum design specification (D4) for the Lingora Language Learning Platform, inheriting and expanding upon the approved D1, D2, and D3 foundations.

The primary objectives are:
1. **Curriculum Architecture:** Formalize the structural hierarchy `Course → Unit → Lesson`, decoupling structural progression from reusable knowledge/skill semantics (`Concept`).
2. **English A1 Baseline Inventory:** Formalize the 6 Units and 24 Lessons of the foundational English A1 curriculum baseline, preserving strict linear prerequisite chaining and Unit publication visibility rules.
3. **Reusable Lesson Blueprint:** Provide an extensible, structured lesson template defining identity, pedagogy, multi-skill content payloads, 5-exercise composition, completion boundaries, and D3 evidence linkages.
4. **Concept Taxonomy:** Establish an authoritative, typed concept catalog with standardized coding conventions, domain categorization, prerequisite relationships, and lifecycle semantics, strictly eliminating free-text `conceptTag` usage.
5. **Exercise & Item Authoring:** Specify the logical authoring envelopes for the 5 canonical content types (`MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`), explicitly identifying their design-level status without implying physical database mutation.
6. **Reading Representation:** Specify the logical representation for reading comprehension (passage + multi-question payload) as an authoring candidate (`PROPOSED / DESIGN GAP`), maintaining the distinction between Reading as a skill dimension and its future storage model.
7. **Multi-Skill Content Structures:** Define structured metadata models for Vocabulary (collocations, word families, audio, SRS eligibility), Grammar (form/function, context, common errors), and Listening (word-level audio MVP vs sentence/dialogue extension boundary).
8. **Remedial Content Architecture:** Formalize the `RemedialModule` content model for concept-targeted remediation, guaranteeing fresh contexts/exercises without whole-level downgrade or forced replay of completed lessons.
9. **Assessment Item Bank Linkage:** Specify the classification and metadata requirements for assessment items, preserving independent purpose (`assessmentType`) and delivery mode (`deliveryMode`) axes.
10. **Multi-Language Configuration:** Ground the common 4-tier content model (`Common Content Model → Language Config → Content/Item Bank → Language-specific Rules`) for English and Chinese, enforcing `hidePinyin: true` for Hanzi reading assessment while keeping HSK mapping open.

---

## B. Scope

### In Scope (D4 Logical Design)
- **Curriculum Structure:** Formal hierarchy, publication lifecycle, Segregation of Duties (SoD), and catalog visibility rules.
- **English A1 Curriculum Inventory:** 6 Units, 24 Lessons, ~200 core vocabulary items, 5 exercises per lesson.
- **Lesson Blueprint:** Standardized logical template encompassing pedagogical metadata, multi-skill payloads, controlled retry allowance, and D3 evidence linkage.
- **Concept Taxonomy:** Authoritative schema for `Concept` entity, naming conventions, prerequisite DAG, and baseline English A1 concept mapping.
- **Exercise Authoring Specifications:** Logical payload envelopes for `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`.
- **Reading Logical Model:** Compound passage and question structure defined at the logical design tier.
- **Remedial Content Model:** `RemedialModule` schema, fresh context requirements, publication-only delivery rule.
- **Assessment Item Bank Specification:** Metadata taxonomy linking items to Concepts, difficulty bands, and D3 assessment results.
- **Multi-Language Content Configuration:** Parameterization schemas for English (collocations, word families) and Chinese (Hanzi, Pinyin suppression).
- **Traceability & Diagrams:** Traceability matrix updates and 6 PlantUML diagrams under `docs/plantuml/`.

### Explicit Out of Scope
- **Runtime Application Code:** Zero implementation in `lingora-web`, `lingora-admin`, or `lingora-ai`.
- **Database Schema Changes:** Zero modifications to `prisma/schema.prisma` or Supabase SQL migrations.
- **Scoring & Adaptive Algorithms:** No hardcoding of diagnostic formulas, stopping thresholds, CAT logic, or Anchor aggregation rules.
- **UI & Presentation Implementation:** No React/Next.js components, CSS styles, or client-side form controls.
- **Automated Level Progression:** No automatic promotion from completion of Unit 6 to CEFR A2/B1.
- **Ghost Entities:** Strictly no `AssessmentSession`, `Exam`, or `QuestionBank` ghost entities.

---

## C. Baseline Dependencies & Invariant Preservation

### 1. Architectural & Milestone Precedence
- **D1 Baseline:** Role-permission matrix, 6-state content review workflow (`Draft → In Review → Changes Requested → Approved → Published → Archived`), SoD enforcement, and elimination of unapproved ghost entities.
- **D2 Baseline:** Entity models for `Concept`, `ConceptMastery`, `KnowledgeGap`, `LevelReadiness`, `RemedialModule`, and `Recommendation`; 2-axis entity status model; 10 Logical Invariants (§4.5).
- **D3 Baseline:** Assessment architecture separating purpose (`assessmentType`: `DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`) from delivery mode (`deliveryMode`: `PLACEMENT`, `JUMP`, `STANDARD`); stage-adaptive 2-stage blueprint; immutable `AssessmentResult`; multi-dimensional `SkillProfile`; Reading semantic boundary note (§B3).
- **Curriculum Baseline (`docs/08-english-a1-curriculum.md`):** 6 Units, 24 Lessons, linear prerequisite chain, PO-approved curriculum decisions.
- **Placement & Jump Baseline (`docs/09-placement-and-jump-specification.md`):** Placement Mapping A (0–30 score bands to Starting Units U1–U6); Jump rules (≥95% threshold, 24h cooldown, `SKIPPED_BY_JUMP` label).

### 2. Preservation of Ten D3 Quality Invariants
D4 strictly adheres to and operationalizes all 10 core invariants:
- **(I1) `LearningProgress ≠ Proficiency`:** Content completion in a Lesson or Unit records progress only; it never asserts verified proficiency.
- **(I2) `Proficiency ≠ Mastery`:** A 4-dimension `SkillProfile` reflects aggregate skill bands, whereas `ConceptMastery` tracks granular grasp of specific knowledge nodes.
- **(I3) `Mastery ≠ LevelReadiness`:** Mastery of isolated concepts serves as evidence input; `LevelReadiness` represents the aggregate gatekeeping decision (`ADVANCE`, `ADVANCE_WITH_SUPPORT`, `REMEDIATE`).
- **(I4) `Completed B1 ≠ B1 certification`:** Finishing curriculum content without standardized EXIT evaluation is not formal certification.
- **(I5) `Completed B1 ≠ Automatic B2`:** Completion never automatically unlocks subsequent CEFR tiers.
- **(I6) `Weak skill ≠ whole-level downgrade`:** Remediation isolates specific concept deficiencies; learners are never demoted across whole Units or courses.
- **(I7) `Remediation ≠ replay old lesson`:** Remedial learning must deliver fresh context, fresh vocabulary examples, and fresh exercise payloads for the target concept.
- **(I8) `Jump ≠ learning completion`:** Content bypassed via Jump assessment is marked `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` (`by_jump = true`), never `COMPLETED_BY_LEARNING`.
- **(I9) `Self-reported level ≠ verified proficiency`:** Initial self-assessment remains `UNVERIFIED` until validated through diagnostic evaluation.
- **(I10) `Diagnostic ≠ Exit Assessment`:** Diagnostic evaluation determines initial placement; Exit evaluation appraises readiness for level transition.

---

## D. Curriculum Architecture

### 1. Structural Containment vs Semantic Reuse
The curriculum model enforces a strict separation between physical structural containment and semantic knowledge reuse:

```text
Structural Containment Hierarchy:
Course (Language, Target CEFR, 6-state lifecycle)
  └── Unit (Theme, Prerequisites, OrderIndex, 6-state lifecycle)
       └── Lesson (Pedagogical Unit, OrderIndex, 6-state lifecycle)
            └── Exercise (Assessment/Practice Unit, OrderIndex)

Semantic Knowledge & Evidence Network:
Lesson ───────────────(introduces / reinforces)──────────────► Concept
Exercise ─────────────(evaluates / targets)──────────────────► Concept
AssessmentItem ───────(evaluates / measures)─────────────────► Concept
Concept ──────────────(tracks mastery state)─────────────────► ConceptMastery
Concept ──────────────(identifies specific deficit)──────────► KnowledgeGap
KnowledgeGap ─────────(triggers targeted micro-content)──────► RemedialModule
```

> **CRITICAL ARCHITECTURAL RULE:**  
> `Concept` is an independent, reusable domain entity. It is **NEVER** a child entity or subordinate field of `Exercise` or `Lesson`. Multiple Exercises across different Lessons and Units reference the exact same `Concept` identifier to measure longitudinal learner mastery.

### 2. Unit Catalog Visibility vs Learner Progression
The platform strictly decouples authoring publication visibility from individual learner progression:
1. **Catalog Publication Visibility:**
   - A `Unit` attains visible status in the public curriculum catalog if and only if **4 out of 4 child Lessons** hold `status = PUBLISHED`.
   - If any lesson is in `DRAFT`, `IN_REVIEW`, or `CHANGES_REQUESTED`, the Unit remains hidden or labeled as in-preparation for learners.
2. **Learner Progression & Unlock Policy:**
   - Progression through published Units is governed strictly by the learner's individual learning path:
     - Linear completion: Completing `U(k-1)-L4` unlocks `Unit k`.
     - Diagnostic Placement: Diagnostic evaluation maps to a Starting Unit ($U1..U6$) via approved Mapping A.
     - Jump Assessment: Scoring $\ge 95\%$ on a cumulative Jump test unlocks the target Unit with skipped units tagged `SKIPPED_BY_JUMP`.
3. **Boundary Invariant:**
   $$\text{Catalog Publication Status} \neq \text{Learner Unlock Status} \neq \text{LearningProgress} \neq \text{Proficiency} \neq \text{Mastery} \neq \text{LevelReadiness}$$
   and strictly for learner progression:
   $$\text{LearningProgress} \neq \text{Proficiency} \neq \text{Mastery} \neq \text{LevelReadiness}$$

### 3. Content Lifecycle & Segregation of Duties (SoD)
Every content entity (`Course`, `Unit`, `Lesson`, `RemedialModule`) is governed by the canonical 6-state lifecycle:
$$\text{Draft} \longrightarrow \text{In Review} \longrightarrow \text{Changes Requested} \longrightarrow \text{Approved} \longrightarrow \text{Published} \longrightarrow \text{Archived}$$

- **Lesson Creator:** Authors content in `DRAFT`; submits to `IN_REVIEW`. Strictly prohibited from approving or publishing own work.
- **Moderator:** Reviews content in `IN_REVIEW`; transitions to `APPROVED` or `CHANGES_REQUESTED`. Prohibited from publishing.
- **Organizational Manager:** Reviews `APPROVED` content; transitions to `PUBLISHED` or `ARCHIVED`.
- **Administrator:** Emergency authority to publish or archive directly, requiring mandatory justification and audit logging (`AuditLog`).
- **Clone-to-Draft v2:** Published lessons cannot be edited in place. Any revision requires cloning to a new draft with `supersedesId` pointing to the active published lesson.

---

## E. English A1 Curriculum Baseline Inventory

The foundational pilot course is `English A1 — Foundation English for Everyday Communication` (`Course.cefr = 'A1'`), comprising exactly 6 Units and 24 Lessons.

| Unit | Title & Goal | Lesson ID | Lesson Title | Target Focus | Exercise Composition | Prerequisite |
|---|---|---|---|---|---|---|
| **U1** | **Greetings & Introductions**<br>Basic greetings, introductions, nationalities, numbers 1–20. | U1-L1 | Say Hello | Greetings & Names | 2 MCQ, 1 FILL, 1 REORDER, 1 LISTENING | None (Entry) |
| | | U1-L2 | Where Are You From? | Countries & `be` verb | 2 MCQ, 1 FILL, 1 REORDER, 1 GRAMMAR | U1-L1 |
| | | U1-L3 | Numbers & Age | Numbers 1–20 & Age | 1 MCQ, 2 FILL, 1 REORDER, 1 LISTENING | U1-L2 |
| | | U1-L4 | First Conversations | Integrated Dialogue (Review Gate*) | 1 MCQ, 1 FILL, 2 REORDER, 1 GRAMMAR | U1-L3 |
| **U2** | **People & Daily Life**<br>Describing people, family members, jobs, colors, telling time. | U2-L1 | My Family | Family & Possessives | 2 MCQ, 1 FILL, 1 REORDER, 1 LISTENING | U1-L4 |
| | | U2-L2 | Jobs & Colors | Occupations & Plural -s | 2 MCQ, 1 FILL, 1 REORDER, 1 GRAMMAR | U2-L1 |
| | | U2-L3 | Time & Days | Hours, Days, Appointments | 1 MCQ, 2 FILL, 1 REORDER, 1 LISTENING | U2-L2 |
| | | U2-L4 | My Daily World | Present Simple `have/live/like` | 1 MCQ, 1 FILL, 2 REORDER, 1 GRAMMAR | U2-L3 |
| **U3** | **Food, Shopping & Money**<br>Ordering meals, asking prices, shopping quantities. | U3-L1 | Food & Drinks | Food items & Preferences | 2 MCQ, 1 FILL, 1 REORDER, 1 LISTENING | U2-L4 |
| | | U3-L2 | At the Market | Prices & `How much is...?` | 2 MCQ, 1 FILL, 1 REORDER, 1 GRAMMAR | U3-L1 |
| | | U3-L3 | How Many? | Quantifiers `a/an/some` | 1 MCQ, 2 FILL, 1 REORDER, 1 GRAMMAR | U3-L2 |
| | | U3-L4 | Shopping Trip | Integrated Shopping Dialogue | 1 MCQ, 1 FILL, 2 REORDER, 1 LISTENING | U3-L3 |
| **U4** | **Places, Directions & Travel**<br>Town landmarks, asking/giving directions, modal `can`. | U4-L1 | Places in Town | City places & `There is/are` | 2 MCQ, 1 FILL, 1 REORDER, 1 LISTENING | U3-L4 |
| | | U4-L2 | Ask for Directions | Directions & Prepositions | 2 MCQ, 1 FILL, 1 REORDER, 1 GRAMMAR | U4-L1 |
| | | U4-L3 | Transport & Travel | Transport & Modal `can` | 1 MCQ, 2 FILL, 1 REORDER, 1 LISTENING | U4-L2 |
| | | U4-L4 | Find Your Way | Integrated Wayfinding Dialogue | 1 MCQ, 1 FILL, 2 REORDER, 1 GRAMMAR | U4-L3 |
| **U5** | **Time, Routines & Past Events**<br>Daily routines, frequency adverbs, past simple introduction. | U5-L1 | Every Day | 3rd person singular present | 2 MCQ, 1 FILL, 1 REORDER, 1 GRAMMAR | U4-L4 |
| | | U5-L2 | How Often? | Adverbs of frequency | 1 MCQ, 2 FILL, 1 REORDER, 1 LISTENING | U5-L1 |
| | | U5-L3 | Last Weekend | Regular past simple `-ed` | 2 MCQ, 1 FILL, 1 REORDER, 1 GRAMMAR | U5-L2 |
| | | U5-L4 | My Last Trip | Core irregular past verbs | 1 MCQ, 1 FILL, 2 REORDER, 1 GRAMMAR | U5-L3 |
| **U6** | **Plans, Future & Everyday Talk**<br>Making invitations, future plans with `going to`, weather. | U6-L1 | Invitations | `Would you like...? / Let's...` | 2 MCQ, 1 FILL, 1 REORDER, 1 LISTENING | U5-L4 |
| | | U6-L2 | My Plans | Future intentions with `going to` | 2 MCQ, 1 FILL, 1 REORDER, 1 GRAMMAR | U6-L1 |
| | | U6-L3 | Weather & Small Talk | Weather vocabulary & Conjunctions | 1 MCQ, 2 FILL, 1 REORDER, 1 LISTENING | U6-L2 |
| | | U6-L4 | Everyday English | Comprehensive Synthesis Review | 1 MCQ, 1 FILL, 2 REORDER, 1 GRAMMAR | U6-L3 |

> **QUALIFICATION OF "REVIEW GATE":**  
> "Review Gate" here denotes Lesson-4 review/reinforcement content structure inherited from the approved curriculum baseline (`docs/08-english-a1-curriculum.md`); learner progression remains governed by the existing publication + Placement/Jump/LearningProgress policy and no new assessment threshold is introduced.

---

## F. Lesson Blueprint (Reusable Logical Template)

Every lesson across all courses adheres to a standardized logical authoring specification:

```json
{
  "$schema": "https://lingora.edu.vn/schemas/lesson-blueprint-v1.json",
  "metadata": {
    "lessonId": "UUID",
    "courseId": "UUID",
    "unitId": "UUID",
    "orderIndex": 1,
    "title": "Say Hello",
    "version": 1,
    "status": "PUBLISHED",
    "creatorId": "UUID",
    "reviewerId": "UUID",
    "supersedesId": null
  },
  "pedagogy": {
    "canDoStatement": "Can introduce oneself, greet others, and exchange basic names.",
    "targetLanguage": "en",
    "cefrBand": "A1",
    "estimatedDurationMinutes": 8,
    "targetConcepts": [
      { "conceptId": "UUID", "code": "EN-A1-VOC-GREET-01", "role": "INTRODUCED" },
      { "conceptId": "UUID", "code": "EN-A1-GRM-BE-PRES-01", "role": "INTRODUCED" }
    ]
  },
  "contentPayload": {
    "vocabulary": [
      {
        "lemma": "hello",
        "surface": "Hello",
        "partOfSpeech": "interjection",
        "meaningVi": "Xin chào (trang trọng)",
        "audioUrl": "https://storage.lingora.internal/media/audio/en/vocab/hello.mp3",
        "collocations": ["Say hello to", "Hello everyone"],
        "exampleSentence": "Hello, my name is Nam."
      }
    ],
    "grammar": {
      "focusPattern": "I am [Name] / My name is [Name]",
      "function": "Self-introduction using the present tense of 'be'",
      "explanationVi": "Dùng 'I am' hoặc 'My name is' để giới thiệu tên bản thân.",
      "commonErrors": ["My name are Nam", "I is Nam"]
    },
    "readingSnippet": {
      "passageTitle": "Meeting at the Reception",
      "text": "Hello, I am Anna. Welcome to Lingora.",
      "readingDimensionTarget": "READING_COMPREHENSION_L1"
    },
    "listeningSnippet": {
      "audioUrl": "https://storage.lingora.internal/media/audio/en/snippets/u1-l1-dialogue.mp3",
      "transcript": "Hi, I am David. Nice to meet you.",
      "level": "WORD_AND_PHRASE"
    }
  },
  "pedagogicalFlow": {
    "stage1_guidedPractice": {
      "description": "Scaffolded vocabulary and form presentation with explicit audio hints.",
      "exerciseIds": ["UUID-EX-01", "UUID-EX-02"]
    },
    "stage2_independentPractice": {
      "description": "Unprompted fill-in-the-blank and syntax reordering exercises.",
      "exerciseIds": ["UUID-EX-03", "UUID-EX-04"]
    },
    "stage3_reinforcementReview": {
      "description": "Synthesis item testing integrated communicative concept.",
      "exerciseIds": ["UUID-EX-05"]
    }
  },
  "executionPolicy": {
    "exerciseCount": 5,
    "exerciseTypeMix": ["MCQ", "MCQ", "FILL_BLANK", "REORDER", "LISTENING"],
    "controlledRetryAllowance": 1,
    "evidenceGeneration": {
      "updatesLearningProgress": true,
      "updatesConceptMastery": true,
      "triggersKnowledgeGapOnRepeatedError": true,
      "generatesExitReadinessEvidence": false
    }
  }
}
```

### Pedagogical Evidence Invariants
- **Practice Evidence:** Recorded during normal lesson execution (`UserProgress.score`, `ConceptMastery.evidenceCount`).
- **Assessment Evidence:** Produced strictly through formal assessment modes (`AssessmentResult`, `SkillProfile`).
- **Completion Boundary:** Lesson is marked complete when all 5 exercises are attempted within the retry allowance (`allowance = max(1, floor(5 * 0.10)) = 1`).
- **Proficiency Evidence:** Under no circumstance does completing lesson practice alter `verifiedProficiency`.

---

## G. Concept Taxonomy

### 1. Concept Entity Specification
Every concept in Lingora is a governed, language-scoped knowledge entity:

| Attribute | Type | Description | Invariant / Constraint |
|---|---|---|---|
| `conceptId` | UUID (PK) | Globally unique identifier | Immutable |
| `code` | String | Standardized hierarchical code | Unique, strictly adheres to naming schema |
| `languageScope` | String | Target language (`en`, `zh`, `vi`, `fr`, `ja`) | Normalized ISO-639-1 |
| `domain` | ConceptDomain | Knowledge/Skill domain | `VOCABULARY`, `GRAMMAR`, `READING`, `LISTENING` |
| `name` | String | Human-readable title | Descriptive |
| `description` | String | Pedagogical definition & scope | Clear learning boundaries |
| `prerequisiteConceptId` | UUID (FK) | Direct parent concept in learning DAG | Nullable for root concepts; acyclic |
| `provenance` | String | Source standard or expert baseline | e.g. `CEFR-A1-CORE`, `EXPERT-QUAN-01` |
| `status` | ConceptStatus | Lifecycle state | `ACTIVE`, `DEPRECATED`, `ARCHIVED` |
| `version` | Integer | Incremental revision number | Increments on pedagogical update |

> **PROHIBITION:** The field `conceptTag` (untyped free text) is strictly forbidden. All concept references must resolve to a valid `conceptId`.

### 2. Standardized Naming Convention
Concept codes must strictly follow the canonical format:
$$\text{[LANG]}-\text{[LEVEL]}-\text{[DOMAIN]}-\text{[TOPIC]}-\text{[SEQ]}$$
- `[LANG]`: `EN`, `ZH`, `VI`, `FR`, `JA`
- `[LEVEL]`: `A1`, `A2`, `B1`, `B2`, `C1`, `C2` (or `HSK1`..`HSK6` for Chinese)
- `[DOMAIN]`: `VOC` (Vocabulary), `GRM` (Grammar), `RDG` (Reading), `LIS` (Listening)
- `[TOPIC]`: Abbreviated semantic category (e.g., `GREET`, `BEPRES`, `NUMBERS`, `FAMILY`)
- `[SEQ]`: Two-digit sequence number (`01`, `02`, ...)

### 3. Initial English A1 Concept Inventory (`PROPOSED`)

| Concept Code | Domain | Concept Name | Pedagogical Description | Prerequisite |
|---|---|---|---|---|
| `EN-A1-VOC-GREET-01` | VOCABULARY | Formulaic Greetings | Hello, Hi, Good morning/afternoon/night, Goodbye | None |
| `EN-A1-GRM-BE-PRES-01` | GRAMMAR | Present Simple `be` (Affirmative) | Conjugation of `am/is/are` with subject pronouns | None |
| `EN-A1-VOC-NATION-01` | VOCABULARY | Countries & Nationalities | Common country names and origin prepositions (`from`) | None |
| `EN-A1-GRM-WH-BE-01` | GRAMMAR | Wh-questions with `be` | Information questions: `What is...?`, `Where are you from?` | `EN-A1-GRM-BE-PRES-01` |
| `EN-A1-VOC-NUM-01` | VOCABULARY | Cardinal Numbers 1–20 | Counting, age expressions, and basic telephone numbers | None |
| `EN-A1-GRM-HOWOLD-01` | GRAMMAR | Age Questions & Answers | Formulating `How old are you?` and `I am [X] years old` | `EN-A1-VOC-NUM-01` |
| `EN-A1-VOC-FAMILY-01` | VOCABULARY | Immediate Family Members | Mother, father, sister, brother, parents, son, daughter | None |
| `EN-A1-GRM-POSS-ADJ-01`| GRAMMAR | Possessive Adjectives | Usage of `my, your, his, her, our, their` | `EN-A1-GRM-BE-PRES-01` |
| `EN-A1-VOC-JOBS-01` | VOCABULARY | Common Professions | Teacher, doctor, engineer, driver, student | None |
| `EN-A1-GRM-ART-INDEF-01`| GRAMMAR | Indefinite Articles `a/an` | Phonological selection of `a` vs `an` before singular nouns | None |
| `EN-A1-VOC-TIME-01` | VOCABULARY | Days of Week & Time Telling | Days Monday–Sunday, hours, `o'clock`, `half past` | `EN-A1-VOC-NUM-01` |
| `EN-A1-GRM-TIME-PREP-01`| GRAMMAR | Time Prepositions `at/on/in` | Collocation rules: `at 5:00`, `on Monday`, `in the morning`| `EN-A1-VOC-TIME-01` |
| `EN-A1-GRM-PRES-HAVE-01`| GRAMMAR | Present Simple `have/live/like` | Base verbs for habit and possession (`I have`, `We live`) | `EN-A1-GRM-BE-PRES-01` |
| `EN-A1-VOC-FOOD-01` | VOCABULARY | Everyday Food & Beverages | Rice, bread, meat, vegetable, water, coffee, tea | None |
| `EN-A1-GRM-WANT-LIKE-01`| GRAMMAR | Expressing Wants & Needs | Form: `want/need/like + noun / to verb` | `EN-A1-GRM-PRES-HAVE-01`|
| `EN-A1-VOC-MONEY-01` | VOCABULARY | Prices, Currency & Quantities | Dollar, Dong, price expressions, numbers 20–100 | `EN-A1-VOC-NUM-01` |
| `EN-A1-GRM-HOWMUCH-01` | GRAMMAR | Inquiring About Prices | Asking `How much is/are...?` with singular and plural | `EN-A1-VOC-MONEY-01` |
| `EN-A1-GRM-QUANT-SOME-01`| GRAMMAR | Quantifiers `some/any` | Countable vs uncountable food items in affirmative/questions | `EN-A1-GRM-ART-INDEF-01`|
| `EN-A1-VOC-PLACES-01` | VOCABULARY | Public Places in Town | Bank, park, school, hospital, supermarket, restaurant | None |
| `EN-A1-GRM-THEREIS-01` | GRAMMAR | Existential `There is / There are`| Stating existence of landmarks in singular and plural | `EN-A1-VOC-PLACES-01` |
| `EN-A1-VOC-DIR-01` | VOCABULARY | Spatial & Directional Terms | Left, right, straight ahead, near, next to, opposite | None |
| `EN-A1-GRM-IMPERAT-01` | GRAMMAR | Imperatives for Directions | Action directives: `Turn left`, `Go straight`, `Stop` | `EN-A1-VOC-DIR-01` |
| `EN-A1-GRM-MODAL-CAN-01`| GRAMMAR | Modal `can` (Ability & Request)| Polite inquiries: `Can I have...?`, `Can you help...?` | None |
| `EN-A1-GRM-PRES-3RD-01` | GRAMMAR | 3rd Person Singular `-s/-es` | Verb morphology for `he/she/it` in Present Simple | `EN-A1-GRM-PRES-HAVE-01`|
| `EN-A1-VOC-FREQ-01` | VOCABULARY | Adverbs of Frequency | Always, usually, often, sometimes, never | None |
| `EN-A1-GRM-FREQ-POS-01` | GRAMMAR | Placement of Frequency Adverbs | Syntactic positioning before main verbs and after `be` | `EN-A1-VOC-FREQ-01` |
| `EN-A1-GRM-PAST-REG-01` | GRAMMAR | Past Simple Regular Verbs (`-ed`)| Expressing completed events: `walked, watched, visited` | `EN-A1-GRM-PRES-HAVE-01`|
| `EN-A1-GRM-PAST-IRR-01` | GRAMMAR | Core Irregular Past Verbs | High-frequency irregulars: `went, ate, saw, had, bought` | `EN-A1-GRM-PAST-REG-01` |
| `EN-A1-VOC-INVITE-01` | VOCABULARY | Social Invitation Phrases | Would you like to, Let's, How about, Sounds good | None |
| `EN-A1-GRM-GOINGTO-01` | GRAMMAR | Future Plans with `going to` | Form: `be + going to + verb` for pre-planned actions | `EN-A1-GRM-BE-PRES-01` |
| `EN-A1-VOC-WEATHER-01` | VOCABULARY | Basic Weather Adjectives | Sunny, rainy, cold, hot, windy, cloudy | None |
| `EN-A1-GRM-CONJ-BASIC-01`| GRAMMAR | Coordinating Conjunctions | Clause combining with `and, but, because` | None |

---

## H. Exercise & Item Authoring

### 1. Canonical Logical Content Types
Lingora establishes 5 canonical logical/target content types:
1. `MCQ` (Multiple Choice Question)
2. `FILL_BLANK` (Fill in the Blank / Gap Completion)
3. `REORDER` (Syntactic Sentence / Phrase Reordering)
4. `LISTENING` (Audio Comprehension / Phonetic Recognition)
5. `GRAMMAR` (Structured Syntax / Morphological Transformation)

> **FORMAL STATUS DISCLAIMER:**  
> These 5 content types represent the **D4 logical/target authoring models**. In the currently applied database schema (`prisma/schema.prisma`), the enum `ExerciseType` physically supports `MCQ`, `FILL_BLANK`, and `REORDER`. The types `LISTENING` and `GRAMMAR` are **TARGET SCHEMA SPECIFICATIONS** for future migration. Authoring these formats in D4 does NOT claim current runtime execution.  
> Furthermore, `MATCHING` is strictly **EXCLUDED** from the canonical scope. No ghost entities (`Exam`, `QuestionBank`, `AssessmentSession`) shall be introduced.

### 2. Logical Authoring Envelopes (JSON Schemas)

#### Type 1: `MCQ` (Multiple Choice Question)
```json
{
  "type": "MCQ",
  "conceptId": "UUID",
  "prompt": "Where ______ you from?",
  "options": [
    { "id": "opt_1", "text": "is", "isCorrect": false },
    { "id": "opt_2", "text": "are", "isCorrect": true },
    { "id": "opt_3", "text": "am", "isCorrect": false },
    { "id": "opt_4", "text": "be", "isCorrect": false }
  ],
  "explanation": "With subject pronoun 'you', the present tense form of 'be' is 'are'."
}
```

#### Type 2: `FILL_BLANK` (Fill in the Blank)
```json
{
  "type": "FILL_BLANK",
  "conceptId": "UUID",
  "prompt": "Complete the sentence with the correct possessive adjective:",
  "sentence": "This is Nam. ______ sister is a doctor.",
  "acceptedAnswers": ["His", "his"],
  "caseSensitive": false,
  "explanation": "Nam is male, so the corresponding possessive adjective is 'His'."
}
```

#### Type 3: `REORDER` (Sentence Reordering)
```json
{
  "type": "REORDER",
  "conceptId": "UUID",
  "prompt": "Arrange the words to form a correct question:",
  "tokens": ["are", "Where", "from", "you", "?"],
  "correctSequence": ["Where", "are", "you", "from", "?"],
  "explanation": "Standard wh-question order with 'be': Wh-word + be + subject + preposition."
}
```

#### Type 4: `LISTENING` (Audio Comprehension)
```json
{
  "type": "LISTENING",
  "conceptId": "UUID",
  "audioUrl": "https://storage.lingora.internal/media/audio/en/items/num_12.mp3",
  "playbackLimit": 3,
  "prompt": "Listen to the audio and select the correct number spoken:",
  "options": [
    { "id": "opt_1", "text": "20", "isCorrect": false },
    { "id": "opt_2", "text": "12", "isCorrect": true },
    { "id": "opt_3", "text": "2", "isCorrect": false }
  ],
  "transcript": "Twelve",
  "explanation": "The speaker clearly pronounces /twelv/ (12), not /'twenti/ (20)."
}
```

#### Type 5: `GRAMMAR` (Structured Syntax Transformation)
```json
{
  "type": "GRAMMAR",
  "conceptId": "UUID",
  "prompt": "Transform the sentence into the past simple tense:",
  "sourceSentence": "She visits her grandmother every weekend.",
  "targetPattern": "Past simple completed action with 'yesterday'",
  "acceptedAnswers": [
    "She visited her grandmother yesterday.",
    "She visited her grandmother yesterday"
  ],
  "distractors": [
    { "pattern": "She visit her grandmother yesterday.", "feedback": "Remember to add -ed to regular verbs in past simple." },
    { "pattern": "She visits her grandmother yesterday.", "feedback": "Do not use present 3rd person -s for past events." }
  ],
  "explanation": "Regular past simple verbs form by adding '-ed' to the base form (visit -> visited)."
}
```

> **BOUNDARY NOTE ON `GRAMMAR`:**  
> The `GRAMMAR` exercise type is a rule-based, deterministic exercise authored by curriculum specialists. It is completely independent of the stateless AI Grammar Error Correction (`GEC`) service (`/v1/gec/correct`), which operates transiently for free-form scenario writing. Furthermore, "deterministic" refers only to authored expected-form/feedback content; it does not define a scoring algorithm, correctness-count policy, normalization rule, or mastery policy, all of which remain OPEN under D3.

---

## I. Reading Logical Representation

### 1. Conceptual vs Storage Distinction
In accordance with D2 (§6.11, §8.19.6) and D3 (§B3), the system maintains a strict semantic boundary:
- **`Reading` (Skill Dimension):** An authoritative pedagogical dimension in the assessment engine, `SkillProfile`, and `AssessmentResult`.
- **`READING` (Exercise / Item Bank Candidate):** A compound authoring payload representing passages linked to multiple comprehension items.
- **Physical Schema Status:** `READING` is categorized as `PROPOSED / DESIGN GAP`. The physical database enum `ExerciseType` does NOT currently contain `READING`. Physical schema alterations are strictly deferred to future milestones.

### 2. Logical Reading Envelope Specification
```json
{
  "$schema": "https://lingora.edu.vn/schemas/reading-representation-v1.json",
  "readingModuleId": "UUID",
  "status": "PROPOSED_LOGICAL_DESIGN",
  "metadata": {
    "title": "A Day in Hanoi",
    "language": "en",
    "cefrBand": "A1",
    "wordCount": 65,
    "provenance": "CURRICULUM_U2_SUPPLEMENT"
  },
  "passage": {
    "text": "My name is Linh. I live in Hanoi with my parents and my brother. My father is a teacher and my mother is a nurse. Every morning, I wake up at six o'clock and eat breakfast with my family. We love our small house near West Lake.",
    "glossary": [
      { "word": "nurse", "meaningVi": "y tá" },
      { "word": "West Lake", "meaningVi": "Hồ Tây" }
    ]
  },
  "comprehensionQuestions": [
    {
      "questionId": "Q-01",
      "conceptId": "UUID-EN-A1-VOC-FAMILY-01",
      "prompt": "How many people are there in Linh's family?",
      "options": [
        { "id": "opt_1", "text": "Three", "isCorrect": false },
        { "id": "opt_2", "text": "Four", "isCorrect": true },
        { "id": "opt_3", "text": "Five", "isCorrect": false }
      ],
      "explanation": "Linh lives with her parents (2) and her brother (1), plus Linh herself = 4 people."
    },
    {
      "questionId": "Q-02",
      "conceptId": "UUID-EN-A1-VOC-JOBS-01",
      "prompt": "What is Linh's father's job?",
      "options": [
        { "id": "opt_1", "text": "Doctor", "isCorrect": false },
        { "id": "opt_2", "text": "Nurse", "isCorrect": false },
        { "id": "opt_3", "text": "Teacher", "isCorrect": true }
      ],
      "explanation": "The text states: 'My father is a teacher'."
    }
  ],
  "languageConfigOverrides": {
    "hidePinyin": false
  }
}
```

---

## J. Multi-Skill Content Structures

### 1. Vocabulary Content Model
Vocabulary is structured for lexical mastery, audio grounding, and Spaced Repetition System (SRS) integration:
- **Lemma & Surface Form:** Dictionary base form (`lemma`) vs inflected surface text (`surface`).
- **Contextual Meaning:** Culturally accurate definition aligned with lesson theme.
- **Audio Asset:** Direct URL pointing to the `lingora-media` storage bucket (`audio/en/vocab/*.mp3`).
- **Lexical Relationships:** Multi-word collocations and morphological word families.
- **SRS Scheduling:** Inherits Spaced Repetition Policy B (fixed intervals: 1, 3, 7, 14, 30 days) via `UserVocabSrs` and RPC `record_review`. Multi-word phrases (>2 words) are learned in exercises and do NOT create SRS cards to prevent backlog explosion.

### 2. Grammar Content Model
Grammar structures are authored as contextualized functional items:
- **Concept Linkage:** Strict reference to an active `conceptId`.
- **Form / Function Distinction:** Explicit syntax formula paired with practical communicative utility.
- **Common Error Catalog:** Preserved inventory of native Vietnamese learner interference patterns (e.g. omission of `be`, plural `-s` neglect, preposition confusion).
- **Subsystem Boundary:** Prohibits separate grammar subsystems (`GrammarLesson`, `UserGrammarProgress`). Grammar is delivered through standard `Exercise` and `RemedialModule` flows.

### 3. Listening Content Model
Listening pedagogy enforces rigorous boundary constraints:
- **Approved MVP Boundary:** Word-level listening and vocabulary pronunciation audio linked to storage URLs.
- **Sentence & Dialogue Extension:** Multi-speaker conversation listening is classified as `PROPOSED / EXTENSION`. It shall not be described as an active MVP capability.
- **Audio Persistence Boundary:** Audio files are stored strictly as static assets in `lingora-media`. No dedicated audio database persistence entity is created.

---

## K. Remedial Content Architecture

### 1. Remediation Pipeline & Principles
Remediation operationalizes Expert Finding `E-EXP-06`: learners who demonstrate knowledge deficits must be provided targeted scaffolding without whole-level demotion or mechanical lesson replay.

```text
Deficit Identified (Diagnostic Exit / Continuous Lesson Errors)
  ↓
KnowledgeGap Record Created (Concept ID, Severity, Detected At)
  ↓
Recommendation Generated (Type = REMEDIAL, Target = RemedialModule ID)
  ↓
Learner Dispatches RemedialModule (Published-only micro-content)
  ↓
Fresh Context / Fresh Vocabulary / Fresh Exercises Attempted
  ↓
New Practice Evidence Generated (ConceptMastery update)
  ↓
Re-assessment & Readiness Gate Evaluation (ADVANCE / ADVANCE_WITH_SUPPORT)
```

### 2. RemedialModule Schema Specification
```json
{
  "$schema": "https://lingora.edu.vn/schemas/remedial-module-v1.json",
  "remedialModuleId": "UUID",
  "metadata": {
    "conceptId": "UUID",
    "unitId": "UUID",
    "creatorId": "UUID",
    "reviewerId": "UUID",
    "version": 1,
    "status": "PUBLISHED",
    "publishedAt": "2026-09-24T12:00:00Z"
  },
  "scaffoldingContent": {
    "focusConceptCode": "EN-A1-GRM-BE-PRES-01",
    "remedialObjective": "Master subject-verb agreement for 'be' in affirmative sentences.",
    "freshContext": {
      "narrative": "At an International Student Club meeting, students introduce their friends.",
      "freshExamples": [
        "Nam is from Vietnam.",
        "They are my new classmates.",
        "I am happy to meet you."
      ]
    },
    "freshVocabulary": [
      { "lemma": "classmate", "meaningVi": "bạn cùng lớp" },
      { "lemma": "happy", "meaningVi": "vui vẻ, hạnh phúc" }
    ],
    "targetedExercises": [
      {
        "type": "FILL_BLANK",
        "prompt": "Fill in 'am', 'is', or 'are':",
        "sentence": "Nam and Peter ______ classmates.",
        "acceptedAnswers": ["are"],
        "explanation": "'Nam and Peter' is a plural subject (they), requiring 'are'."
      },
      {
        "type": "REORDER",
        "prompt": "Arrange into a correct sentence:",
        "tokens": ["is", "She", "my", "friend", "."],
        "correctSequence": ["She", "is", "my", "friend", "."],
        "explanation": "Subject (She) + verb (is) + complement (my friend)."
      }
    ]
  },
  "governanceRules": {
    "deliveryEligibility": "PUBLISHED_ONLY",
    "forbidReplayOfOriginalLesson": true,
    "forbidWholeLevelDowngrade": true
  }
}
```

### 3. Remedial Boundary Invariants
1. **Fresh Payload Invariant:** A remedial module must never reuse the identical question text or option payload from the lesson where the error occurred.
2. **Published-Only Delivery:** A `RemedialModule` can only be recommended and served to learners when its lifecycle status is `PUBLISHED`.
3. **No Demotion:** Failing to master a remedial module triggers further scaffolding (`ADVANCE_WITH_SUPPORT`); it never resets completed Units or demotes CEFR levels.

---

## L. Assessment Content & Item Bank

### 1. Item Metadata Taxonomy
Every assessment item in Lingora belongs to a structured logical bank, strictly decoupling its purpose from its execution mode:

| Metadata Attribute | Type | Description | Invariant |
|---|---|---|---|
| `itemId` | UUID (PK) | Globally stable item identifier | Unique & Immutable |
| `language` | String | Target language (`en`, `zh`, etc.) | ISO-639-1 |
| `skillDimension` | SkillDimension | Evaluated dimension | `VOCABULARY`, `GRAMMAR`, `READING`, `LISTENING` |
| `conceptId` | UUID (FK) | Evaluated knowledge node | Must exist in `Concept` catalog |
| `curriculumProvenance`| String | Source unit or benchmark | e.g. `EN-A1-U1-CORE` |
| `descriptiveDifficulty`| ItemDifficulty | Qualitative difficulty band | `ENTRY`, `MID`, `UPPER` |
| `exerciseType` | ExerciseType | Presentation format | `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR` |
| `itemVersion` | Integer | Revision of the item payload | Increments on edit |
| `itemBankVersion` | String | Release version of the bank | Semantic versioning |
| `languageConfigVersion`| String | Parameter configuration version | Matches active config |
| `rubricReference` | String | Grading/scoring rubric key | Language-specific rubric |
| `authorId` | UUID (FK) | Lesson Creator author | SoD enforced |
| `reviewerId` | UUID (FK) | Moderator reviewer | SoD enforced |
| `publicationState` | ContentStatus | Lifecycle state | Must be `PUBLISHED` for delivery |
| `assessmentEligibility`| Eligibility[] | Supported assessment contexts | `PLACEMENT`, `JUMP`, `EXIT`, `RE_EVALUATION` |

### 2. Purpose vs Mode Decoupling (D3 Alignment)
The Common Assessment Engine preserves the strict decoupling established in D3:
- **`assessmentType` (Pedagogical Purpose):**
  - `DIAGNOSTIC`: Initial ability estimation and starting point recommendation.
  - `EXIT`: Post-instructional gatekeeping appraisal before level transition.
  - `RE_EVALUATION`: Periodic profile refresh.
- **`deliveryMode` (Execution Mode):**
  - `PLACEMENT`: Onboarding flow execution.
  - `JUMP`: High-stakes accelerated unit skipping.
  - `STANDARD`: Standard formal assessment delivery.

> **NEGATIVE CONSTRAINT:**  
> Strictly no `AssessmentSession` entity; neither D3 nor D4 introduces an `AssessmentSession` database model. Assessment execution remains a conceptual mode of exercise delivery; assessment evidence is persisted solely via `AssessmentResult`.

---

## M. Multi-Language Content Configuration

### 1. The Common 4-Tier Model
Lingora establishes a clean, extensible architectural separation for multi-language learning:
$$\text{Common Content Model} \longrightarrow \text{Language Config} \longrightarrow \text{Content / Item Bank} \longrightarrow \text{Language-Specific Rules}$$
Under this design, the core platform code contains zero language-specific conditional branches (`if (lang == 'zh') ...`). All language-specific behavior is governed by declarative configuration schemas.

### 2. English Configuration Blueprint
```json
{
  "languageCode": "en",
  "name": "English",
  "referenceFramework": "CEFR",
  "activeBands": ["A1", "A2", "B1", "B2"],
  "dimensions": {
    "VOCABULARY": {
      "supportsCollocations": true,
      "supportsWordFamilies": true,
      "srsEligibleWordLengthMax": 2
    },
    "GRAMMAR": {
      "focusAreas": ["word_order", "tense_aspect", "subject_verb_agreement", "prepositions", "articles"],
      "supportsConnectedSpeech": false
    },
    "READING": {
      "passageWordCountLimits": { "A1": 80, "A2": 150, "B1": 250, "B2": 400 }
    },
    "LISTENING": {
      "mvpAudioScope": "WORD_AND_PHRASE",
      "dialogueAudioScope": "PROPOSED_EXTENSION"
    }
  }
}
```

### 3. Chinese Configuration Blueprint
```json
{
  "languageCode": "zh",
  "name": "Chinese",
  "referenceFramework": "HSK",
  "hskFrameworkVersion": "PENDING_VALIDATION",
  "dimensions": {
    "VOCABULARY": {
      "supportsPinyin": true,
      "supportsTones": true,
      "supportsCharacterStrokeDecomposition": false
    },
    "GRAMMAR": {
      "focusAreas": ["measure_words", "word_order", "aspect_particles_le_zhe_guo", "structural_particles_de"]
    },
    "READING": {
      "hidePinyinDefault": true,
      "characterCountLimits": { "HSK1": 60, "HSK2": 120, "HSK3": 200 }
    },
    "LISTENING": {
      "toneDistinctionTest": true,
      "homophoneDisambiguation": true
    }
  }
}
```

> **CHINESE READING ASSESSMENT INVARIANT (`E-EXP-04`):**  
> When evaluating Chinese Hanzi reading ability, the property `hidePinyin` must default to `true`. This prevents learners from relying on Latin alphabet phonetic crutches and ensures accurate measurement of Chinese character recognition.

---

## N. Traceability

### 1. Requirements & Research Traceability Matrix
This matrix establishes complete forward and backward traceability connecting empirical research, business requirements, engineering specifications, and D4 content rules.

| Source Evidence / Finding | Requirement ID | MVP ID | Canonical UC | D3 Baseline Rule | D4 Content Design Rule | Status |
|---|---|---|---|---|---|---|
| `E-EXP-01` (Thầy Quân) | `P1-FR-016` | `MVP-03` | `UC-03` | Entry separation (`selfReportedLevel` vs `verifiedProficiency`) | D4 Lesson Blueprint (§F) and Item Bank (§L) isolate unverified starting points from diagnostic items | `FROZEN` |
| `E-EXP-02` (Thầy Quân) | `P1-FR-016` | `MVP-03`, `MVP-11` | `UC-03`, `UC-07` | 4-dimension Skill Profile; no flat single score | Exercise & Item authoring (§H, §L) tags items with 1 of 4 discrete skill dimensions | `FROZEN` |
| `E-EXP-03` (Thầy Quân) | `P1-FR-004` | `MVP-08`, `MVP-11` | `UC-07` | Four-concept separation: Progress ≠ Proficiency ≠ Mastery ≠ Readiness | Curriculum Architecture (§D) and Blueprint (§F) enforce strict separation between practice and assessment | `FROZEN` |
| `E-EXP-04` (Cô Mai) | `P1-FR-016`, `NFR-LOC` | `MVP-03` | `UC-03` | Common Assessment Engine + `hidePinyin: true` | Multi-language Content Config (§M) parameterizes Chinese reading with `hidePinyinDefault: true` | `FROZEN` |
| `E-EXP-05` (Cô Mai) | `P1-FR-003`, `P1-FR-012` | `MVP-05`, `MVP-06` | `UC-05` | Typed concept errors link to KnowledgeGap | Concept Taxonomy (§G) defines typed `Concept` schema; 0 free-text `conceptTag` allowed | `FROZEN` |
| `E-EXP-06` (Cô Mai & Quân) | `P1-FR-016`, `YC-EXT-03` | `MVP-04`, `MVP-07` | `UC-04` | Concept remediation without downgrade or lesson replay | Remedial Content Model (§K) specifies `RemedialModule` delivering fresh context/exercises | `FROZEN` |
| `E-EXP-07` (Quân & Mai) | `P1-FR-016` | `MVP-03` | `UC-03` | Two-stage adaptive blueprint (~25–30 items, ≤15 min) | Item Bank (§L) classifies items by difficulty bands (Entry/Mid/Upper) for 2-stage routing | `PROPOSED / PENDING` |
| ADR-002 / PO Decision | `P1-FR-008` | `MVP-12`, `MVP-13` | `UC-08`, `UC-10` | 6-state content lifecycle & Clone-to-Draft v2 | Curriculum Architecture (§D) enforces SoD and `supersedesId` for post-publish revision | `FROZEN` |
| ADR-006 / PO Decision | `P1-FR-012`, `P1-FR-013` | `MVP-05` | `UC-05` | Canonical 5 exercise types; 0 Matching | Exercise Authoring (§H) provides JSON schemas for MCQ, FILL, REORDER, LISTENING, GRAMMAR | `FROZEN (Logical)` |
| PO Policy D5 / D6 | `P1-FR-016` | `MVP-03` | `UC-03` | Placement Mapping A & Jump $\ge 95\%$ | English A1 Curriculum Inventory (§E) provides 6-Unit/24-Lesson baseline mapping | `FROZEN (Mapping A)` |
| PO Policy D8 / SRS Baseline | `P1-FR-005`, `P1-FR-006` | `MVP-09` | `UC-06` | SRS scheduling policy inherited from D8 | MVP-09 is inherited from D8; D4 defines only vocabulary/content linkage (§J1) and does not redefine SRS scheduling policy | `FROZEN (D8)` |

---

## O. Artifacts & Generated Files

### 1. Primary Master Specification
- `docs/phase-1-d4-content-curriculum-design.md` (This document)

### 2. PlantUML Visual Design Diagrams
All diagrams are authored under `docs/plantuml/` with strict syntax balance (`@startuml` / `@enduml`), matching prose terminology, zero ghost entities, and zero hidden thresholds:
1. `docs/plantuml/curriculum-architecture-d4.puml`: Visualizes `Course → Unit → Lesson → Exercise` hierarchy, SoD roles, 6-state lifecycle, and `Concept` semantic reuse network.
2. `docs/plantuml/lesson-blueprint-d4.puml`: Visualizes the structured lesson components, multi-skill payloads, 3-stage practice flow, and controlled retry boundary.
3. `docs/plantuml/concept-content-evidence-d4.puml`: Illustrates the flow from `Exercise` interaction to `Concept` evidence, `ConceptMastery` state updates, `KnowledgeGap` creation, and `LevelReadiness` input.
4. `docs/plantuml/item-bank-authoring-d4.puml`: Details the authoring envelope for the 5 logical exercise types and assessment items, decoupling purpose from delivery mode.
5. `docs/plantuml/remedial-content-d4.puml`: Models the remediation lifecycle from gap detection to `RemedialModule` authoring, fresh payload delivery, and re-evaluation.
6. `docs/plantuml/multilanguage-content-d4.puml`: Details the 4-tier multi-language architecture separating the Common Content Model, Language Configs (EN/ZH), Item Bank, and Rubrics.

### 3. Synchronized Supporting Documentation
- `docs/08-english-a1-curriculum.md`: Cross-referenced with D4 lesson blueprints and concept models.
- `docs/01-architecture.md`: Section §3.5 added cross-referencing D4 content & curriculum architecture.
- `docs/05-traceability-matrix.md`: Section 7 added establishing D4 content rule traceability.
- `docs/QUICK-REF.md`: Summary updated with D4 milestones.

---

## P. Verification & Validation Results

### Automated Consistency Verification
- **Command 1:** `py scratch/verify_consistency_guards.py`
  - Output: Exit Code `0` — **ALL 18 CONSISTENCY GUARDS PASSED CLEANLY**.
  - Verified: Q13 distribution, expert identities, NFR qualifiers, YC-CORE-01 trace, decoupled assessment types, jump semantics, CEFR placement historical qualification, N=35/3 labeling, LearnerProfile ownership, 5 exercise types, multi-language 4-tier chain, no AssessmentSession ghost entity, and absence of bare stale wording.
- **Command 2:** `git diff --check`
  - Output: Exit Code `0` — Zero whitespace errors, zero conflict markers.
- **Static PlantUML Syntax Validation:**
  - 6/6 D4 diagrams verified: exactly one `@startuml` and one `@enduml` per file.
  - Terminology verified 100% congruent with master document prose.
  - No `AssessmentSession`, `Exam`, or `QuestionBank` ghost entities present.
  - Zero physical database mutations or schema claims.

---

## Q. Open Decisions & Candidate Status

All D3 §N open decisions not explicitly tabulated in this section remain OPEN / PENDING / CONFIGURABLE and are not decided by D4.

Specifically, the following decision groups remain strictly open across the system:
- **Diagnostic Item Count:** Total number of items (~25–30 estimate) remains `PROPOSED / PENDING VALIDATION`.
- **Diagnostic Distribution:** Allocation across the 4 core dimensions remains `PROPOSED / PENDING VALIDATION`.
- **Scoring Function:** Item scoring formulas and weights remain `OPEN / CONFIGURABLE`.
- **Adaptive Thresholds:** Branching criteria from Routing Stage to Targeted Stage remain `PROPOSED / PENDING VALIDATION`.
- **Stopping Rule:** Early-termination confidence thresholds remain `PROPOSED / PENDING VALIDATION`.
- **Mastery Thresholds:** Promotion rules (`NOVICE → DEVELOPING → MASTERED`) remain `CONFIGURABLE / PENDING VALIDATION`.
- **Readiness Thresholds:** Gatekeeping cutoffs for `ADVANCE`, `ADVANCE_WITH_SUPPORT`, and `REMEDIATE` remain `CONFIGURABLE`.
- **Remediation Thresholds:** Error count triggers for `KnowledgeGap` creation remain `CONFIGURABLE`.
- **Anchor Aggregation:** Formula for deriving scalar Anchor Level from 4-dimension `SkillProfile` remains `PENDING VALIDATION`.
- **CEFR → Unit Mapping beyond Mapping A:** Internal curriculum mapping beyond approved English A1 Mapping A remains `OPEN / PENDING`.
- **HSK Mapping / Version:** Detailed Chinese HSK 2.0 vs 3.0 level mapping remains `OPEN / CONFIGURABLE`.
- **KnowledgeGap Archival Policy:** Archive and resolution retirement criteria remain `CONFIGURABLE`.
- **Recommendation Policy / Version:** Ranking heuristics and model versioning policy remain `OPEN / PENDING`.

| Topic | Current Status | Recommended Resolution / Next Steps |
|---|---|---|
| Chinese HSK Framework Version | `OPEN / PENDING` | Support configurable version switch between HSK 2.0 (6 levels) and HSK 3.0 (9 levels / 3 stages) via `LanguageConfig`. |
| Reading Physical Database Model | `PROPOSED / DESIGN GAP` | Evaluate whether to extend `ExerciseType` enum or represent Reading as a composite parent entity in M2.2/M3. |
| Diagnostic Item Distribution | `PROPOSED / PENDING VALIDATION` | Retain 25–30 item estimate; calibrate exact per-dimension item counts upon empirical testing with learner cohorts. |
| Remediation Trigger Thresholds | `CONFIGURABLE` | Expose consecutive error counts (e.g. 2 vs 3 errors) as configurable parameters rather than hardcoding in runtime logic. |
| Anchor Level Aggregation Formula | `PENDING VALIDATION` | Retain 4-dimension Skill Profile as primary output; defer single scalar level aggregation until psychometric validation. |

---

## R. Design Risks & Mitigations

1. **Risk R-D4-01: Cognitive Overload in Diagnostic Assessment**
   - *Description:* Stage-adaptive assessment exceeding 15 minutes causes learner fatigue, leading to arbitrary clicking (`E-EXP-07`).
   - *Mitigation:* Cap total assessment length at 25–30 items; enforce strict 15-minute time bound; allow early termination when proficiency confidence bounds are satisfied.
2. **Risk R-D4-02: Remedial Content Fatigue (Loop Trap)**
   - *Description:* Learners failing remediation repeatedly become trapped in demotivating loops.
   - *Mitigation:* Limit remedial loops to 1 iteration per concept; transition to `ADVANCE_WITH_SUPPORT` with inline scaffolding rather than blocking forward progress.
3. **Risk R-D4-03: Pinyin Crutch in Chinese Character Reading**
   - *Description:* Presenting Pinyin alongside Chinese characters measures Latin pronunciation reading rather than Hanzi recognition (`E-EXP-04`).
   - *Mitigation:* System-wide enforcement of `hidePinyin: true` for all Chinese reading assessment items.

---

## S. Explicit Out-of-Scope Confirmations

To maintain absolute architectural integrity and prevent scope creep:
- **NO Runtime Code:** Zero lines of TypeScript, Python, or SQL runtime code were added or altered.
- **NO Database Migrations:** No Prisma migrations generated; database schema untouched.
- **NO Scoring Algorithms:** No hardcoded scoring logic or cut-off algorithms implemented.
- **NO Automatic Promotion:** Course completion does not certify CEFR advancement.
- **NO Whole-Level Demotion:** Under no circumstance is a learner demoted to an earlier level.

---

## T. Final Status & Sign-off

```text
STATUS: READY FOR INDEPENDENT REVIEW
DESIGN FREEZE: NOT CLAIMED
COMPLETION DATE: 2026-09-24
```

This specification provides the authoritative logical design for Lingora's content and curriculum architecture. It is fully ready for formal human review and independent verification before advancing to runtime implementation planning.

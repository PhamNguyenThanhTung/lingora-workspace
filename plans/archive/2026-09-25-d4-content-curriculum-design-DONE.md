# D4 Content & Curriculum Design

## Status

`DONE` (D4 ACCEPTED — Post-Review Hygiene Complete; Design-only, no runtime/code/schema/migrations; Design Freeze NOT CLAIMED)

## Objective

Create the complete logical content and curriculum design artifacts for Lingora inheriting D1/D2/D3 baselines.
Design documentation and logical authoring models only; no runtime application code, no database migrations, no scoring/adaptive/recommendation algorithms, and no UI implementation. Do not claim Design Freeze.

## Category Tag

`category: scope-ambiguity`

## Canonical Constraints

1. **Curriculum Hierarchy vs Concept Semantics:**
   - Hierarchy is strictly `Course → Unit → Lesson`.
   - `Exercise` belongs to `Lesson`.
   - `Concept` is a reusable knowledge/skill domain entity reused across Lessons, Exercises, Assessment Items, ConceptMastery, and KnowledgeGap.
   - `Concept` is NEVER a child entity of `Exercise`.
2. **Unit Visibility vs Learner Progression:**
   - Publication visibility: 4/4 Lessons Published -> Unit is visible in published catalog.
   - Learner progression / unlock: Governed by existing Placement / Jump / LearningProgress policy.
   - `Publication Status ≠ Learning Completion ≠ Proficiency ≠ Mastery ≠ Readiness`.
3. **Canonical Logical Content Types (D4):**
   - 5 canonical logical/target types: `MCQ`, `FILL_BLANK`, `REORDER`, `LISTENING`, `GRAMMAR`.
   - Explicitly note: These are D4 logical/target content types, NOT claimed to be physical DB types in current runtime.
   - Zero re-introduction of `MATCHING` to canonical scope.
   - Zero ghost entities (`Exam`, `QuestionBank`, `AssessmentSession`).
   - `GRAMMAR` exercise ≠ transient GEC AI service.
4. **Reading Semantic Boundary:**
   - `Reading` = D3 skill/dimension in assessment engine and SkillProfile.
   - `READING` = logical/design candidate (`PROPOSED / DESIGN GAP` per D2 §6.11). Physical enum/schema is NOT DECIDED / OUT OF SCOPE.
5. **Listening Semantic Boundary:**
   - Word-level listening + vocabulary audio = current approved MVP boundary.
   - Sentence/conversation listening = `PROPOSED / EXTENSION` if exceeding baseline boundary.
6. **Remedial Content Boundary:**
   - `RemedialModule` is governed content (published-only delivery), targets `Concept`, uses fresh context/vocabulary/exercises.
   - No whole-level downgrade, no forced replay of completed lessons, no reuse of identical old exercise payloads.
7. **Assessment Item Bank Linkage:**
   - Decouple purpose (`assessmentType`: `DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`) from delivery mode (`deliveryMode`: `PLACEMENT`, `JUMP`, `STANDARD`).
   - No hardcoded scoring formulas or adaptive stopping thresholds.
8. **Multi-Language Content Configuration:**
   - Common Engine -> Language Config -> Item Bank -> Rubric.
   - English room for collocations, word families, connected speech.
   - Chinese preserves `hidePinyin: true` default for Hanzi reading assessment; HSK mapping/version remains OPEN/PENDING.

## Files Expected To Change

### Create
- `docs/phase-1-d4-content-curriculum-design.md` (new master D4 design spec, sections A through T).
- `docs/plantuml/curriculum-architecture-d4.puml`
- `docs/plantuml/lesson-blueprint-d4.puml`
- `docs/plantuml/concept-content-evidence-d4.puml`
- `docs/plantuml/item-bank-authoring-d4.puml`
- `docs/plantuml/remedial-content-d4.puml`
- `docs/plantuml/multilanguage-content-d4.puml`

### Modify Only When Required
- `docs/08-english-a1-curriculum.md` (cross-references & alignment notes)
- `docs/01-architecture.md` (concise §3.5 cross-reference)
- `docs/05-traceability-matrix.md` (add Section 7 for D4 content rules)
- `docs/QUICK-REF.md` (concise D4 status summary)
- `scratch/verify_consistency_guards.py` (consistency guards)
- `logs/test-log.md`
- `logs/development-log.md`
- `logs/decision-log.md`
- `plans/current-task.md`
- `HANDOFF.md`

## Verification Plan

- `py scratch/verify_consistency_guards.py` (all consistency guards must pass).
- `git diff --check` (exit 0).
- Static PlantUML syntax balance (`@startuml` / `@enduml`).
- D4 focused verification scan:
  - 6 Units, 24 Lessons, 4 Lessons/Unit.
  - Unit visibility 4/4 Published.
  - Lifecycle, SoD, Clone-to-Draft intact.
  - 5 canonical logical/target content types, 0 MATCHING canonical.
  - 0 AssessmentSession / Exam / QuestionBank ghost entities.
  - 0 conceptTag free text; Concept not child of Exercise.
  - Reading ≠ physical enum.
  - 0 hidden thresholds/formulas.
  - No automatic Completed B1 → B2, no whole-level downgrade, no forced replay.
  - D3 invariants preserved; Mapping A boundary preserved.
  - HSK remains open; Chinese `hidePinyin: true` preserved.

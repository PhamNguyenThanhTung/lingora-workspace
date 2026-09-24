# Phase 1 — D3 Assessment & Learning Engine Design (Design-Only)

> **Document:** `docs/phase-1-d3-assessment-learning-engine-design.md`
> **Phase:** Phase 1 — System Analysis & Design (Implementation-Independent)
> **Baseline:** D1/D2 COMPLETE (`docs/phase-1-m2-1-domain-and-logical-data-foundation.md` §4–§8, §13; `docs/01-architecture.md` §3; `docs/09-placement-and-jump-specification.md`)
> **Status:** `READY FOR D4 CONTENT/CURRICULUM DESIGN`
> **Boundary:** Design-only. No runtime, no application code, no Prisma/Supabase schema change, no migration, no scoring / recommendation / remediation algorithm implementation, no UI implementation. No Design Freeze claim. No `AssessmentSession` entity.

## 0. Design Contract & Negative Invariants

This D3 design preserves all D2 decisions and all `FROZEN / PROPOSED / PENDING` boundaries.

Negative invariants (must hold for every section A–Q):

1. Zero runtime or UI implementation; zero Prisma/Supabase schema or migration changes.
2. Zero scoring, recommendation, or remediation algorithm implementation.
3. No `AssessmentSession` entity. `AssessmentResult` is the sole persisted assessment evidence entity; `Assessment` remains a conceptual mode of `Exercise` (D4).
4. No self-report promoted to verified proficiency.
5. No content completion used as certification or automatic level advancement.
6. No numerical thresholds or aggregation policies beyond explicitly approved D2 Mapping A (referenced as D2 compatibility only); all unresolved values remain pending/configurable.
7. No whole-level downgrade and no forced replay of completed lessons.
8. No claim of Design Freeze.
9. `assessmentType` (purpose) and `deliveryMode` (execution mode) remain independent axes with D2 field naming preserved.
10. English A1 Mapping A remains a separately approved D2 curriculum placement rule; it is not generalized into a D3 proficiency or scoring rule.

Ten D3 quality invariants (identical to D2.11, preserved verbatim in meaning):

- (I1) `LearningProgress ≠ Proficiency` — content completion is not verified capability.
- (I2) `Proficiency ≠ Mastery` — four-dimension SkillProfile does not entail per-concept mastery.
- (I3) `Mastery ≠ LevelReadiness` — mastery is evidence input; readiness is an aggregate decision.
- (I4) `Completed B1 ≠ B1 proficiency certification` — completion without EXIT appraisal is not certification.
- (I5) `Completed B1 ≠ Automatic B2` — no automatic level promotion from completion.
- (I6) `Weak skill ≠ whole-level downgrade` — weak skill triggers targeted remediation/scaffolding only.
- (I7) `Remediation ≠ replay old lesson` — remediation uses fresh context/vocabulary/exercises for an old concept.
- (I8) `Jump ≠ learning completion` — jumped content is `SKIPPED_BY_JUMP / UNLOCKED_BY_JUMP` (`by_jump = true`), never `COMPLETED_BY_LEARNING`.
- (I9) `Self-reported level ≠ verified proficiency` — self-report stays `UNVERIFIED` until diagnostic evidence.
- (I10) `Diagnostic ≠ Exit Assessment` — entry determines starting point; exit appraises transition; both emit immutable `AssessmentResult`.

Conventions used below: `FROZEN` = locked D1/D2 structure or policy referenced as compatibility; `PROPOSED / PENDING VALIDATION` = D3 value not yet validated; `CONFIGURABLE` = runtime-tunable parameter whose value is explicitly not chosen in D3.

---

## A. D3 Assessment Architecture

A1. Logical flow (design-only, no runtime):

```text
Language selection → Entry (self-report OR diagnostic evidence) → AssessmentResult
  → SkillProfile → curriculum starting point → Learning (Lesson → Exercise → Concept evidence)
  → ConceptMastery / KnowledgeGap → LevelReadiness → Recommendation / Remediation
  → (EXIT / RE_EVALUATION) → AssessmentResult → updated SkillProfile
```

A2. Separation of concerns (FROZEN architecture):

- **Common Assessment Engine** (language-invariant): coordinates assessment lifecycle, routing between stages, evidence capture, and emission of `AssessmentResult` and `SkillProfile` updates. No language branch logic is hard-coded in the engine.
- **Language Config** (per language): parameterizes dimensions, bands, item selection policy, and rubric references.
- **Item Bank** (per language): classified items linked to `Concept` and difficulty band.
- **Rubric** (per language): error classification and dimension-reporting policy.
- Four layers are logical/configuration layers per `docs/01-architecture.md` §3.1 and M2.1 §6.9; D3 does not require four physical tables.

A3. Independent axes (FROZEN):

- Purpose axis `assessmentType`: `DIAGNOSTIC`, `EXIT`, `RE_EVALUATION`.
- Execution axis `deliveryMode`: `PLACEMENT`, `JUMP`, `STANDARD`.
- The two axes are independent. A `DIAGNOSTIC` purpose may be delivered via `PLACEMENT` onboarding or `STANDARD` administration; an `EXIT` purpose is post-learning appraisal; a `RE_EVALUATION` purpose refreshes `SkillProfile` on demand or periodically. No flat five-value enum is introduced; the historical flat enum remains `[HISTORICAL / SUPERSEDED IN DRAFT]`.

A4. Evidence chain: every transition in A1 is evidenced by a persisted or versioned artifact (`AssessmentResult`, `SkillProfile` with provenance, `ConceptMastery`/`KnowledgeGap` evidence, `LevelReadiness` typed evidence, `Recommendation` with input snapshot). No transition is inferred from completion alone.

---

## B. Diagnostic Blueprint

B1. Stage-adaptive structure (FROZEN architecture; parameters PROPOSED / PENDING VALIDATION):

- **Routing Stage:** initial routing items at mid-range difficulty to estimate the learner's working band.
- **Targeted Stage:** branched items at the targeted difficulty band to measure each of the four core dimensions in depth.
- Scale and duration remain `PROPOSED / PENDING VALIDATION`: approximately 25–30 items and at most 15 minutes (cognitive-fatigue bound per `E-EXP-07`). D3 does not choose exact item count, per-dimension distribution, difficulty-band cut points, branching policy, or stopping rule.

B2. Abstract routing model (no algorithm):

- **Inputs:** learner identity (`LearnerProfile` ref), target language, purpose (`assessmentType`), delivery mode (`deliveryMode`), language config version, item-bank snapshot reference.
- **State:** current stage (`ROUTING` / `TARGETED`), per-dimension working band (abstract, no numeric threshold), answered-item evidence set, remaining-budget state (abstract, no numeric budget chosen).
- **Transitions:** `START → ROUTING → TARGETED → COMPLETE`; `ROUTING → TARGETED` follows an abstract branching policy (CONFIGURABLE / PENDING VALIDATION); early-stop is a conceptual stopping condition (CONFIGURABLE / PENDING VALIDATION) — no concrete stopping predicate is specified.
- **Outputs:** per-item responses, per-dimension observations, `AssessmentResult`, `SkillProfile` update.

B3. Coverage (FROZEN structure):

- Four core dimensions: Vocabulary, Grammar, Reading, Listening. Writing/Speaking remain optional extensions and are out of D3 diagnostic scope.
- **Reading semantic boundary (FROZEN distinction):** `Reading` is a skill / diagnostic dimension in the assessment engine and `SkillProfile`. In the representation of Exercise/Item Bank, `READING` (passage + questions payload) is a design candidate / logical representation categorized as `PROPOSED / DESIGN GAP` per D2 (§6.11, §8.19.6). It must not be inferred that `READING` is or must become a physical database enum. Detailed representation and authoring structure of Reading exercises are deferred to D4 Content/Curriculum Design.
- Difficulty bands are abstract bands (e.g. entry / mid / upper within the target curriculum range). D3 does not bind bands to CEFR sub-level numbers or to item counts.
- Each item carries metadata: stable item identifier, owning `Concept` (`conceptId` FK semantics), dimension tag, difficulty-band tag, language code, item/bank version. Concept linkage uses the D2 `Concept` registry; no free-text `conceptTag` is used.

B4. Language configuration: routing uses only the active `LanguageConfig` + `ItemBank` + `Rubric` snapshot for the target language (see J). No language-specific branch is hard-coded in the engine.

B5. What D3 does not decide: exact item count/distribution, scoring function, adaptive/branching thresholds, stopping thresholds, per-dimension weights, Anchor aggregation. All stay `PROPOSED / PENDING VALIDATION / CONFIGURABLE` (see M, N).

---

## C. AssessmentResult

C1. Role (FROZEN structure): `AssessmentResult` is the sole persisted, immutable, versioned, attributable assessment evidence entity. There is no `AssessmentSession` entity. Transient session state (if any) is not persisted and is not part of this design.

C2. Logical fields (design-only; no physical schema change):

- Identity: `id`, `learnerProfileId`/`userId` (learner ref), target language (`targetLanguage` / `languageCode`).
- Classification: `assessmentType` (`DIAGNOSTIC` / `EXIT` / `RE_EVALUATION`), `deliveryMode` (`PLACEMENT` / `JUMP` / `STANDARD`).
- Time: `startedAt`, `completedAt`.
- Versions/provenance: `assessmentBlueprintVersion`, `languageConfigVersion`, `itemBankVersion`, `rubricVersion`, administered-by / source reference.
- Evidence: `responses` (per-item response records with item id, concept ref, dimension, observed outcome — typed, no score formula), `skillOutputs` (per-dimension observations), `stageData` (routing → targeted trace).
- Purpose-specific evidence:
  - For `DIAGNOSTIC`: curriculum starting-point evidence (starting-point reference + rationale ref; value itself is produced by the approved D2 placement rule where applicable — see O).
  - For `EXIT` / `RE_EVALUATION`: readiness-input evidence (reference usable by `LevelReadiness`; no readiness decision is embedded here).

C3. Integrity rules (FROZEN):

- Immutable after `completedAt`; learner cannot edit; corrections require a new `AssessmentResult` (new evaluation), never in-place mutation.
- `DIAGNOSTIC` determines entry; `EXIT` appraises transition; `RE_EVALUATION` refreshes `SkillProfile`. Purpose is never inferred from delivery mode.
- No scoring formula, no threshold, and no readiness decision are embedded in `AssessmentResult`.

---

## D. SkillProfile

D1. Role (FROZEN structure): `SkillProfile` is the multidimensional proficiency record owned by `LearnerProfile` (1 → 0..1; null until first diagnostic evidence).

D2. Logical fields (design-only):

- Four dimensions, each with `level` (curriculum-referenced band label) and `status` (e.g. observed / provisional semantics as configured; no numeric cut chosen in D3): `vocabularyLevel` + `vocabularyStatus`, `grammarLevel` + `grammarStatus`, `readingLevel` + `readingStatus`, `listeningLevel` + `listeningStatus`.
- Provenance: `sourceAssessmentResultId` (the `AssessmentResult` that produced this snapshot; nullable), `languageConfigVersion`, `updatedAt`.
- Anchor Level: present only as a label slot with status `PENDING VALIDATION`. D3 specifies no Anchor computation, no aggregation function, and no authoritative flat score or weighted average. Any single-number roll-up is explicitly out of D3 scope.

D3. Update semantics:

- Created/updated only from `AssessmentResult` (`DIAGNOSTIC`, `EXIT`, or `RE_EVALUATION`).
- Self-reported level never writes `SkillProfile`; it writes only `LearnerProfile.selfReportedLevel` (see entry flow in I).
- History is preserved via the immutable `AssessmentResult` chain; `SkillProfile` holds the current snapshot plus its provenance link.

D4. Presentation: multidimensional (radar/spider-compatible) data is available from the four dimension slots; D3 defines no chart implementation and no UI.

---

## E. Mastery / KnowledgeGap

E1. `ConceptMastery` lifecycle (FROZEN structure; thresholds CONFIGURABLE / PENDING VALIDATION):

- Key: (`LearnerProfile`, `Concept`) — one record per learner per concept; `conceptId` FK semantics per D2 M-04.
- States: `NOVICE → DEVELOPING → MASTERED` (forward progression through evidence; regression policy, if any, is CONFIGURABLE / PENDING VALIDATION and is not specified in D3).
- Evidence: typed concept-level practice evidence (exercise outcome refs, review outcome refs, timestamps). D3 defines evidence types, not counts.
- Transition policy: state changes only on qualifying evidence; the qualifying-evidence policy (counts, windows, weights) is `CONFIGURABLE / PENDING VALIDATION`. D3 does not hard-code any production rule and in particular does not hard-code any consecutive-correct count as a promotion rule.
- Lifecycle: records persist per learner; when `Concept.isActive` becomes false, related mastery records are retained as history and excluded from new readiness inputs from that point. No hard delete is specified in D3.

E2. Typed concept-level error evidence (design-only):

- Error signal types: `WRONG_OPTION` (choice error with selected vs expected option refs), `FILL_MISMATCH` (normalized-response mismatch), `ORDER_ERROR` (sequence deviation descriptor), `LISTENING_MISRECOGNITION` (target vocabulary ref + response ref), `GRAMMAR_RULE_ERROR` (rule/concept ref + response ref), `READING_COMPREHENSION_ERROR` (passage/question ref + response ref).
- Each error record carries: learner ref, `conceptId`, source exercise/item ref, `AssessmentResult` ref when arising in assessment, timestamp, and attempt context. No severity number is assigned at the error level in D3.

E3. `KnowledgeGap` lifecycle (FROZEN structure; thresholds CONFIGURABLE / PENDING VALIDATION):

- Key: (`LearnerProfile`, `Concept`); fields: `gapSeverity` (`LOW` / `MEDIUM` / `HIGH` — labels only, no numeric cut), `gapState` (`OPEN` / `IN_REMEDIATION` / `RESOLVED`), `detectedAt`, `resolvedAt` (nullable), evidence/provenance refs (triggering error evidence ids + producing `AssessmentResult` id where applicable).
- Opening policy: a gap opens on a qualifying repeated-error pattern; the pattern definition is `CONFIGURABLE / PENDING VALIDATION` and is not specified in D3.
- Resolution: a gap moves to `RESOLVED` (with `resolvedAt`) when the linked `ConceptMastery` reaches the qualifying state under the configured policy; D3 does not choose the qualifying state threshold beyond the D2-constrained state set (`DEVELOPING` or `MASTERED` per configured policy — CONFIGURABLE / PENDING VALIDATION).
- Archive: resolved gaps are retained as provenance; any time-based archival policy is `PENDING` and is not specified in D3. No hard delete is specified.

---

## F. LevelReadiness

F1. Role (FROZEN structure): `LevelReadiness` is the aggregate transition appraisal for a (`LearnerProfile`, current level/unit, target level/unit) triple. It is not proficiency, not mastery, and not progress.

F2. Typed evidence (design-only; no thresholds chosen):

- `evidenceVersion` (schema version of this evidence struct; e.g. `v1` label).
- `progressInput` (ref to `LearningProgress` snapshot: completed-content ratio and scope refs — value observed, no pass cut).
- `masteryInput` (ref to relevant `ConceptMastery` snapshot set — states observed, no ratio cut).
- `gapsInput` (refs to open `KnowledgeGap` set with severity/state labels — counts observed, no severity-count cut).
- `sourceAssessmentResultIds` (list of `AssessmentResult` ids consumed; may be empty when appraisal uses only progress/mastery/gap inputs).
- `evaluatedAt` (appraisal time).

F3. Decision outputs (FROZEN — exactly three):

- `ADVANCE` — open the next Unit/level.
- `ADVANCE_WITH_SUPPORT` — open the next Unit/level with attached lightweight support (scaffolded practice refs).
- `REMEDIATE` — hold transition and prescribe concept-targeted remediation (see G).

F4. Boundary rules (FROZEN):

- Content completion is never certification and never readiness by itself.
- No single score and no hard-coded threshold determines the output. Any future decision table or policy version is explicitly out of D3 scope and would require its own approved design.
- `Completed B1` (or completed curriculum scope) without `EXIT` appraisal never yields an automatic advance; the appraisal in F2–F3 is still required.

---

## G. Remediation

G1. Scope (FROZEN principle): remediation targets concepts, never the whole learner level. No whole-level downgrade exists in D3. No forced replay of a completed lesson exists in D3.

G2. Selection (design-only; no algorithm):

- Inputs: open `KnowledgeGap` set (with severity/state), linked `ConceptMastery` states, `SkillProfile` dimension context, `LevelReadiness` output (`REMEDIATE` with evidence refs), learner goal/history refs where available.
- Output: a set of prescribed `RemedialModule` references (published modules only), each bound to exactly one target `Concept`, with a stated reason ref back to the gap evidence.
- Selection policy (which gap first, how many modules, sequencing) is `CONFIGURABLE / PENDING VALIDATION` and is not specified in D3.

G3. Module properties (FROZEN structure per D2 M-03):

- Each `RemedialModule` is governed content following the six-state content lifecycle (`Draft → In Review → Changes Requested → Approved → Published → Archived`) via Moderator review; only `PUBLISHED` modules are prescribable.
- Each module carries fresh context, fresh vocabulary, and fresh exercises for the old concept. Reuse of the completed lesson's identical payload as remediation is prohibited by invariant I7.

G4. Re-assessment flow (design-only):

```text
REMEDIATE → prescribed RemedialModule(s) → learner completes fresh-concept practice
  → new concept evidence → ConceptMastery update → KnowledgeGap state update
  → (optional EXIT / RE_EVALUATION) → AssessmentResult → SkillProfile refresh
  → LevelReadiness re-appraisal → ADVANCE / ADVANCE_WITH_SUPPORT / REMEDIATE
```

- Re-assessment uses fresh items (same concept, new surface form); it is never a forced replay of the completed lesson.
- Gap closure follows E3; level demotion never occurs on this path.

---

## H. Recommendation

H1. Scope (FROZEN architecture): Recommendation is Level 3 (adaptive, explainable) and covers next-content / next-module / practice suggestions. D3 specifies the contract only; no recommendation algorithm is designed or implied.

H2. Input contract (design-only; observed refs, no weights):

- Verified proficiency ref + `SkillProfile` snapshot (four dimensions + provenance).
- Learner goal (`learningGoal`).
- Learning history refs (`LearningProgress` snapshots).
- Error history refs (typed error evidence per E2).
- Mastery/gap refs (`ConceptMastery` states + open `KnowledgeGap` set).
- `LevelReadiness` latest output with evidence refs.

H3. Output contract (design-only):

- `recommendationType` (`NEXT_UNIT` / `REMEDIAL_MODULE` / `PRACTICE` semantics).
- Target refs: `targetUnitId` (nullable), `remedialModuleId` (nullable).
- `rationale` (human-readable reason answering "Why was this recommended?" — references the input evidence, states no score formula).
- Provenance: `inputSnapshot` (the six input refs + their versions at generation time), `ruleVersion`/`modelVersion` (generating policy version label), `generatedAt` (generation time).

H4. Rules: recommendation never certifies proficiency, never auto-advances level, and never downgrades level. Every recommendation is explainable from its `inputSnapshot` + `rationale` + version without appealing to an undisclosed score.

---

## I. State Machines

I1. Assessment lifecycle (purpose/mode/result; entry vs post-learning):

- States: `NO_EVIDENCE` → `SELF_REPORTED` (via self-report path) or `ASSESSED` (via diagnostic path) → `IN_LEARNING` → `APPRAISED` (via EXIT/RE_EVALUATION) → `IN_LEARNING` (continued).
- Purpose transitions:
  - `DIAGNOSTIC` : `NO_EVIDENCE`/`SELF_REPORTED` → `ASSESSED` (emits `AssessmentResult` + `SkillProfile` + starting-point evidence).
  - `EXIT` : `IN_LEARNING` → `APPRAISED` (emits `AssessmentResult` usable by `LevelReadiness`).
  - `RE_EVALUATION` : `IN_LEARNING`/`APPRAISED` → `APPRAISED` (refreshes `SkillProfile`).
- Delivery mode is orthogonal state on each assessment attempt: `PLACEMENT`, `JUMP`, or `STANDARD`. Purpose and mode are shown as separate labels on every transition; no merged enum appears.
- Entry/post-learning distinction: entry assessments (`DIAGNOSTIC`) produce starting-point evidence; post-learning assessments (`EXIT`/`RE_EVALUATION`) produce readiness-input evidence. A `DIAGNOSTIC` result is never reused as an `EXIT` appraisal.

I2. Entry flow (four concepts kept distinct):

- `selfReportedLevel`: learner-chosen band or skip; status `UNVERIFIED`; writes `LearnerProfile.selfReportedLevel` only.
- `assessedLevel`: raw per-dimension observations from a `DIAGNOSTIC` `AssessmentResult`; not a persisted proficiency claim by itself.
- `verifiedProficiency`: proficiency standing derived from assessed evidence and recorded on `LearnerProfile`; null/`UNVERIFIED` until diagnostic evidence exists.
- `curriculumStartingPoint`: the Unit/level entry reference assigned from verified evidence (via the approved D2 placement rule where applicable) or from self-report as a provisional entry; it is a curriculum pointer, not a proficiency certificate.
- Flow: language selection → (A) diagnostic → `AssessmentResult` → `SkillProfile` → `verifiedProficiency` + `curriculumStartingPoint`; or (B) self-report/skip → `selfReportedLevel` (`UNVERIFIED`) + provisional `curriculumStartingPoint` without `SkillProfile`.

I3. Learning progression (no automatic level transition):

- `IN_LEARNING` cycles Lesson → Exercise → error/concept evidence → `ConceptMastery`/`KnowledgeGap` → `LearningProgress` update. `LearningProgress` completion of a scope never emits a level advance; it only records content traversal.
- Unit boundary triggers `LevelReadiness` appraisal (F2–F3). Only an `ADVANCE` / `ADVANCE_WITH_SUPPORT` appraisal opens the next scope. There is no edge from "scope completed" directly to "next scope unlocked" and no edge from "completed terminal scope" to "next-level proficiency granted".

I4. Mastery/gap lifecycle states: `ConceptMastery`: `NOVICE → DEVELOPING → MASTERED`; `KnowledgeGap`: `OPEN → IN_REMEDIATION → RESOLVED` (see E). Transitions are evidence-driven; no count or threshold is labeled on any edge.

I5. Readiness machine: three-state decision node (`ADVANCE` / `ADVANCE_WITH_SUPPORT` / `REMEDIATE`) fed by the typed evidence in F2. No numeric guard is labeled on any edge.

I6. Recommendation/remediation relation: `LevelReadiness = REMEDIATE` enables remediation prescription (G); any recommendation (H) references the same evidence chain. Neither path contains a whole-level downgrade edge or a forced-replay edge.

---

## J. Language-Specific Assessment

J1. Invariant: the Common Assessment Engine is language-invariant; all language variation lives in `LanguageConfig` + `ItemBank` + `Rubric` snapshots referenced by `AssessmentResult.languageConfig` (with versions).

J2. English configuration room (FROZEN room; no new rule):

- Reference frame: CEFR A1–B2 for MVP scope (curriculum placement use is governed by the D2 Mapping A compatibility note in O; D3 adds no CEFR rule).
- Config room includes: contextual vocabulary, collocation, word family, connected speech, plus grammar/reading/listening dimension policy per D2/D1.5. D3 adds no item counts, weights, or thresholds.

J3. Chinese configuration room (FROZEN room; mapping/version open):

- Reference frame: HSK with explicit version label (HSK 2.0 / HSK 3.0); the active version is recorded per `AssessmentResult` via `languageConfigVersion`. Detailed HSK mapping and the canonical HSK version choice remain open (`PENDING` — see N).
- Mandatory config: reading items default to `hidePinyin: true` (measure character recognition, not Latin-letter reading).
- Config room includes: Chinese grammar/word-order and classifier policy, character/stroke-component error taxonomy room, tone-listening policy. D3 adds no item counts, weights, or thresholds.

J4. Extension: additional languages reuse the same four-layer pattern with their own versioned config/bank/rubric snapshots. No engine change is implied by adding a language.

---

## K. Traceability

K1. Requirement → UC → domain → D3 rule (extends `docs/05-traceability-matrix.md` §5; 15-UC catalog unchanged):

| Requirement / Evidence | UC | Domain entities | D3 section |
|---|---|---|---|
| YC-CORE-09 + `P1-FR-016` + E-EXP-01 (self-report vs verified) | UC-03, UC-02 | `LearnerProfile`, `AssessmentResult`, `SkillProfile`, starting-point ref | B, C, D, I2 |
| YC-CORE-09 + `P1-FR-016` + E-EXP-02 (spiky profile, no flat average) | UC-03, UC-07 | `SkillProfile` (4 dims + anchor PENDING), `AssessmentResult.dimensions` | D, B |
| YC-CORE-09 + `P1-FR-016` + E-EXP-07 (two-stage, fatigue bound) | UC-03 | Engine stages, `AssessmentResult.stageData` | B, C |
| YC-CORE-07 + `P1-FR-003/004` + E-EXP-05 (concept-tagged errors → gaps) | UC-05, UC-07 | `Concept`, `ConceptMastery`, `KnowledgeGap`, typed error evidence | E |
| YC-CORE-11 + `P1-FR-004` + E-EXP-03 (four-concept separation) | UC-07 | `LearningProgress`, `SkillProfile`, `ConceptMastery`, `LevelReadiness` | D, E, F, I3 |
| YC-EXT-03 + E-EXP-06 (concept remediation, 3-state transition) | UC-04, UC-07 | `LevelReadiness`, `RemedialModule`, `Recommendation` | F, G, H |
| YC-CORE-09 + E-EXP-04 (multi-lang chain, hidePinyin) | UC-03 | Engine → Config → Bank → Rubric; `AssessmentResult.languageConfig` | J, A2 |
| YC-CORE-07/08 progression compat (D5/D7/D8 referenced, not redefined) | UC-04, UC-05, UC-06 | `LearningProgress`, `UserProgress` compat, SRS refs | O, I3 |

K2. Evidence identifiers reused (no new evidence invented): `E-EXP-01`..`E-EXP-07`, `P1-FR-003/004/016`, `MVP-03/04/08/11`, `UC-03/04/05/07`. The 15-UC catalog is unchanged.

K3. D2 Mapping A is traced as D2 compatibility (see O), not as a D3 rule row.

---

## L. Diagrams Updated

Six new design-only diagrams (PlantUML sources; static balance checked; renderer availability is environment-dependent):

1. `docs/plantuml/assessment-lifecycle-d3.puml` — purpose/mode/result lifecycle with entry vs post-learning distinction (prose: C, I1).
2. `docs/plantuml/diagnostic-flow-d3.puml` — entry flow + Routing → Targeted adaptive flow (prose: B, I2).
3. `docs/plantuml/learning-progression-d3.puml` — progress/mastery/readiness separation with no automatic level transition (prose: F, I3).
4. `docs/plantuml/mastery-knowledge-gap-d3.puml` — exercise/error signal → gap → remediation → re-assessment lifecycle (prose: E, G).
5. `docs/plantuml/level-readiness-d3.puml` — three-state readiness machine with typed evidence (prose: F, I5).
6. `docs/plantuml/recommendation-remediation-d3.puml` — explainable recommendation and concept-remediation relation (prose: G, H, I6).

Each diagram shows `assessmentType` (`DIAGNOSTIC` / `EXIT` / `RE_EVALUATION`) separately from `deliveryMode` (`PLACEMENT` / `JUMP` / `STANDARD`); each carries its status tags (`FROZEN` structure vs `PROPOSED / PENDING VALIDATION / CONFIGURABLE` values); none contains a whole-level downgrade edge, a forced-replay edge, or a completion-to-advance automatic edge.

---

## M. FROZEN / PROPOSED / PENDING

M1. FROZEN (structure/architecture preserved from D2; D3 adds no alternative):

- Four core diagnostic dimensions; Writing/Speaking as optional extensions.
- CEFR A1–C2 canonical; MVP A1–B2 (reference frames only; no D3 mapping rule).
- Entry via self-report OR diagnostic; self-report never verified proficiency.
- `LearningProgress` / Proficiency (`SkillProfile` + `verifiedProficiency`) / `ConceptMastery` / `LevelReadiness` as four distinct concepts with distinct owners and evidence.
- Transition outputs exactly `ADVANCE` / `ADVANCE_WITH_SUPPORT` / `REMEDIATE`.
- Concept-level remediation; no whole-level downgrade; no forced replay.
- Level 3 explainable recommendation contract (inputs → outputs + rationale + provenance).
- `assessmentType` (3 purposes) independent from `deliveryMode` (3 modes); D2 field naming preserved; `AssessmentResult` sole persisted evidence; no `AssessmentSession`.
- Ten invariants I1–I10.
- Common Engine → Language Config → Item Bank → Rubric layering (logical/config, not four physical tables).
- English A1 Mapping A as approved D2 curriculum placement rule (compatibility only — see O).

M2. PROPOSED / PENDING VALIDATION (values D3 explicitly does not choose):

- Exact diagnostic item count and per-dimension/per-band distribution.
- Diagnostic duration bound value (the approx-25–30-item / at-most-15-minute shape stays proposed).
- Scoring function (any function mapping responses to dimension observations).
- Adaptive/branching policy and stopping conditions.
- Anchor Level computation (slot exists; computation pending).
- `ConceptMastery` promotion/regression policy values.
- `KnowledgeGap` open/resolve pattern values.
- `LevelReadiness` decision policy values.
- Remediation selection/sequencing policy values.
- CEFR→Unit mapping beyond the D2 Mapping A compatibility note.
- Detailed HSK mapping and canonical HSK version choice.

M3. CONFIGURABLE (tunable at runtime; value out of D3 scope): every threshold, count, window, weight, or budget referenced in B–H as configurable. D3 defines the slot and the evidence type, never the value.

---

## N. Open Design Decisions

All items below remain open; D3 proposes no value and implements no policy:

1. Exact diagnostic item count.
2. Exact item distribution (per dimension, per band, per stage).
3. Scoring function (responses → dimension observations; no flat average is assumed).
4. Adaptive thresholds (routing → targeted branching).
5. Stopping thresholds (budget/exhaustion conditions).
6. Mastery thresholds (promotion/regression evidence policy).
7. Readiness thresholds (appraisal decision policy).
8. Remediation thresholds (selection/sequencing policy).
9. Anchor aggregation (how, or whether, an anchor label is derived; slot stays pending).
10. CEFR→Unit mapping beyond approved D2 Mapping A.
11. Detailed HSK mapping and HSK version selection.
12. Gap archival time policy.
13. Recommendation policy version content (any future rule/model version payload).

---

## O. Compatibility Impact on D2

O1. Verdict: **compatible — no D2 change required.** D3 is a logical extension of the D2 §4.1/§4.4/§4.5/§6.8–§6.14/§8.20/§13 structures. Field naming (`assessmentType`, `deliveryMode`), entity ownership (`LearnerProfile` sole owner of progress/skill/assessment/mastery/gap/readiness/recommendation views), relationship cardinalities (§4.4 matrix), and the ten invariants are preserved without alteration.

O2. English A1 Mapping A (D2 compatibility decision):

- The approved `OD-PLACEMENT-MAPPING: APPROVED MAPPING A` in `docs/09-placement-and-jump-specification.md` §2 remains the sole curriculum placement rule for the English A1 onboarding instance.
- D3 references it only as D2 compatibility for the `DIAGNOSTIC` + `PLACEMENT` onboarding path. D3 does not restate its bands as a proficiency rule, does not generalize it to other languages or levels, and does not derive any scoring, Anchor, readiness, or remediation policy from it.

O3. Other D2 policies referenced without redefinition: D5 conditional-jump governance, D7 controlled-retry behavior, D8 SRS Policy B, D1–D3 content lifecycle, and the M2.1 §8.19 payload shapes. D3 consumes their evidence/outputs where the flow requires (e.g. `LearningProgress` inputs to readiness) but changes none of their rules and chooses no new numeric values.

O4. Stop-rule outcome: no file outside Files Expected To Change required modification during D3 design; no dependency, schema, API-path, or architecture change was implied; no RLS/security-boundary change was required. Had any been required, D3 would have stopped and returned to REVIEW per the plan's stop rules.

---

## P. Design Risks

1. **Threshold drift:** future implementers may hard-code a count or cut that D3 left configurable. Mitigation: M/N tags plus §0 negative invariants; any value choice requires its own approved design task with validation evidence.
2. **Flat-score temptation:** consumers may average four dimensions for convenience. Mitigation: D2/D4 explicitly prohibit flat authoritative scores; `SkillProfile` contract carries no roll-up slot.
3. **Mapping A generalization:** teams may treat the English A1 onboarding bands as a general proficiency scale. Mitigation: O2 compatibility note; HSK/CEFR mappings beyond Mapping A stay pending.
4. **Completion-as-readiness regression:** UI copy may imply finishing content equals leveling up. Mitigation: invariants I1/I4/I5 plus I3's no-automatic-edge rule; readiness always requires appraisal evidence.
5. **Remediation scope creep:** pressure to replay old lessons or demote levels for simplicity. Mitigation: invariants I6/I7; module governance (fresh payload) in G3.
6. **Purpose/mode conflation:** logging or analytics may merge the two axes into one enum. Mitigation: separate fields on every diagram and in C2; historical flat enum stays superseded.
7. **Ghost-entity reintroduction:** a transient session object may be persisted as a de-facto entity. Mitigation: C1 prohibition; evidence chain uses `AssessmentResult` only.
8. **Premature freeze:** readers may treat this design as frozen. Mitigation: §0 boundary + Q status wording; no freeze is claimed.

---

## Q. Final Status

`READY FOR D4 CONTENT/CURRICULUM DESIGN`

# Lingora — RDR-01–03 correction report (2026-10-22)

**Author:** Antigravity (Executor).  
**Reviewer:** Codex (Coordinator / Acceptance Authority).  
**Specification:** [plans/2026-10-22-rdr-correction-spec.md](../../plans/2026-10-22-rdr-correction-spec.md).  
**Review Input:** [docs/design/evidence/2026-10-22-rdr-correction/codex-review-round-1.md](evidence/2026-10-22-rdr-correction/codex-review-round-1.md).  
**Status: REVIEW.** Bounded corrections completed across canonical PUML, native Draw.io XML pages, genuine scoped renders and native exports, physical design catalogs and security specifications, portable test suites, and strict preservation verification. No commit or independent acceptance claimed.

---

## 1. Executive Summary & Verification Ledger

| Item | Topic | Status | Summary of Action & Evidence |
|---|---|---|---|
| **Portability** | Checker portability for LF/CRLF | **PASS** | Updated [verify_current.py](../modeling/current-target/verify_current.py) with symmetric CRLF/LF hash compatibility. Added [test_portability.py](evidence/2026-10-22-rdr-correction/test_portability.py) covering 5 test cases including symmetric LF/CRLF matching, non-newline rejection, strict whitespace preservation, and corrupt input rejection. All 36 canonical models verified (exit 0). |
| **RDR-01** | Logical Audit Actor Cardinality & Scoped Native Rendering | **PASS** | Applied source edits: `User "0..1" -- "0..*"` in [DOM-01-core-domain-model.puml](../modeling/current-target/src/DOM-01-core-domain-model.puml) and `Account \|o--o{ Audit` in [DATA-03-target-logical-erd.puml](../modeling/current-target/src/DATA-03-target-logical-erd.puml). Updated native Draw.io page 29 and page 32 in [lingora-all-diagrams.drawio](../modeling/current-target/lingora-all-diagrams.drawio). Toolchain provisioned in `/tmp/lingora-diagram-tools` (`plantuml-1.2026.8.jar` and official Draw.io desktop binary); generated genuine PlantUML PNG/SVG renders and genuine native Draw.io PNG/SVG exports. Updated exact 2 records in [render-manifest.json](../modeling/current-target/render-manifest.json); exactly 34 records and 42 native pages remain byte-for-byte preserved. |
| **RDR-02** | Assessment Contribution Omission Physical Specification | **PASS** | Reconciled physical docs: declared `is_draft_omitted boolean NOT NULL DEFAULT false` on `item_revisions` in [README.md](physical/README.md), specified `omit_draft_assessment_contribution` command and RBAC grants in [security-and-rls.md](physical/security-and-rls.md), added assembly query filtering in [database-reconciliation-2026-10-20.md](physical/database-reconciliation-2026-10-20.md), and added future test case `PD-RDR02-OMIT` in [rebuild-plan.md](physical/rebuild-plan.md). |
| **RDR-03** | Cross-Scope Fingerprint Collision Privilege Chain & Concurrency | **PASS** | Reconciled physical docs: defined `app_private.check_fingerprint_collision` function owned by `lingora_authz_reader` with `SECURITY DEFINER` under FORCE RLS, strict boolean projection, explicit direction checks, revoked public execution, and advisory lock `hashtext(p_fingerprint)` ordering in [physical/README.md](physical/README.md) and [physical/security-and-rls.md](physical/security-and-rls.md). Documented two-transaction race trace closing absent-row concurrency gaps. Added future test case `PD-RDR03-COLLISION` in [physical/rebuild-plan.md](physical/rebuild-plan.md). |

---

## 2. Portability Fix Verification

### Problem
On Linux checkout, canonical sources and native Draw.io XML page fragments use LF line endings, whereas historical Windows commits stored CRLF sha256 hashes in `render-manifest.json`. Raw sha comparison failed on clean checkouts.

### Implementation
In [docs/modeling/current-target/verify_current.py](../modeling/current-target/verify_current.py):
- Added `text_bytes_matches(raw_bytes, expected_sha)`: tests raw binary sha, CRLF-normalized binary sha, and LF-normalized binary sha symmetrically.
- Applied symmetrically to text sources (`style.puml`, `src/*.puml`) and native XML `<diagram>` page fragments.
- Binary outputs (`.png`, `.svg`) remain strictly checked via raw binary `sha(path)`. Whitespace stripping or character modification is strictly prohibited.

### Regression Test Suite ([test_portability.py](evidence/2026-10-22-rdr-correction/test_portability.py))
- `test_symmetric_lf_crlf_matching`: Symmetrically matches LF and CRLF normalized hashes.
- `test_non_newline_change_fails`: Any character mutation fails.
- `test_whitespace_change_fails`: Any leading, trailing, or internal whitespace change fails.
- `test_binary_mismatch_fails_in_checker`: Binary corrupted files fail via raw sha comparison.
- `test_corrupted_source_fails_in_checker`: Corrupted sources fail verification in the actual checker function.
- Result: 5/5 tests PASS (0.001s).

---

## 3. RDR-01: Logical Audit Actor Changes & Genuine Scoped Rendering

### Semantic Specification
- Audit events encompass three categories:
  1. `ACCOUNT`: Standard user action; requires verified account identity (`actorRef`).
  2. `SYSTEM`: Internal system assembly; records no user account attribution (`actorRef` NULL, actor_kind `SYSTEM`).
  3. `VERIFIED_AUTH_SUBJECT`: Denial prior to application account provisioning; records verified Auth UUID with no account FK.
- In [DOM-01-core-domain-model.puml](../modeling/current-target/src/DOM-01-core-domain-model.puml): Multiplicity updated from `User "1" -- "0..*"` to `User "0..1" -- "0..*"` with conditional annotation.
- In [DATA-03-target-logical-erd.puml](../modeling/current-target/src/DATA-03-target-logical-erd.puml): Relationship updated from `Account ||--o{ Audit` to `Account |o--o{ Audit` with conditional annotation.
- In Native Draw.io ([lingora-all-diagrams.drawio](../modeling/current-target/lingora-all-diagrams.drawio)):
  - Page 29 (`page-DOM-01`): `rel_111-source-card` label changed to `0..1`; embedded PUML payload updated.
  - Page 32 (`page-DATA-03`): `rel_154` style changed to `startArrow=ERzeroToOne`; embedded PUML payload updated.
  - Exact preservation: 42 pages untouched, exactly 2 pages modified.

### Toolchain Provisioning & Genuine Native Rendering
- Downloaded official `plantuml-1.2026.8.jar` to `/tmp/lingora-diagram-tools/` and verified with local Java 21 and graphviz dot.
- Extracted official Draw.io desktop v24.7.17 to `/tmp/lingora-diagram-tools/drawio-extracted/` and executed headless rendering via `--no-sandbox`.
- Rendered canonical PUML outputs:
  - [rendered/DOM-01-core-domain-model.png](../modeling/current-target/rendered/DOM-01-core-domain-model.png)
  - [rendered/DOM-01-core-domain-model.svg](../modeling/current-target/rendered/DOM-01-core-domain-model.svg)
  - [rendered/DATA-03-target-logical-erd.png](../modeling/current-target/rendered/DATA-03-target-logical-erd.png)
  - [rendered/DATA-03-target-logical-erd.svg](../modeling/current-target/rendered/DATA-03-target-logical-erd.svg)
- Exported genuine native Draw.io outputs:
  - [evidence/2026-10-16-class-review/native-DOM-01.png](../modeling/current-target/evidence/2026-10-16-class-review/native-DOM-01.png)
  - [evidence/2026-10-16-class-review/native-DOM-01.svg](../modeling/current-target/evidence/2026-10-16-class-review/native-DOM-01.svg)
  - [evidence/2026-10-20-design-correction/native/DATA-03.png](evidence/2026-10-20-design-correction/native/DATA-03.png)
  - [evidence/2026-10-20-design-correction/native/DATA-03.svg](evidence/2026-10-20-design-correction/native/DATA-03.svg)
  - Mirrored native exports preserved in [evidence/2026-10-22-rdr-correction/native/](evidence/2026-10-22-rdr-correction/native/).
- Updated [render-manifest.json](../modeling/current-target/render-manifest.json): exact new hashes for DOM-01 and DATA-03 (source, png, svg, native page fragment, native png, native svg). Remaining 34 manifest records strictly preserved.

---

## 4. RDR-02: Assessment Contribution Omission Physical Specification

### Reconciled Physical Schema & Semantics
- In [physical/README.md](physical/README.md):
  - Declared `is_draft_omitted boolean NOT NULL DEFAULT false` column on `item_revisions`.
  - Defined `omit_draft_assessment_contribution(p_lesson_revision_id uuid, p_item_id uuid, p_expected_row_version integer)` command.
- In [physical/security-and-rls.md](physical/security-and-rls.md):
  - Added EXECUTE grant on `omit_draft_assessment_contribution` for `lingora_content_writer`.
  - Defined permission guards: parent `lesson_revisions` must be unfrozen in status (`DRAFT`, `CHANGES_REQUESTED`), caller must be verified assigned author, and target item must belong to that draft.
  - Creator attribution and immutable authoring history are preserved.
- In [physical/database-reconciliation-2026-10-20.md](physical/database-reconciliation-2026-10-20.md):
  - Documented assembly selection query: `SELECT ir.* FROM item_revisions ir WHERE ir.lesson_revision_id = $1 AND ir.is_draft_omitted = false`.
- In [physical/rebuild-plan.md](physical/rebuild-plan.md):
  - Added future verification test case `PD-RDR02-OMIT` verifying draft omission, stale/frozen rejection, and blueprint assembly exclusion.

---

## 5. RDR-03: Cross-Scope Fingerprint Collision Privilege Chain & Concurrency

### Reconciled Physical Function & Security
- In [physical/README.md](physical/README.md) and [physical/security-and-rls.md](physical/security-and-rls.md):
  - Defined `app_private.check_fingerprint_collision(p_fingerprint text, p_check_direction text) RETURNS boolean`.
  - Owned by `lingora_authz_reader` (non-login role) with `SECURITY DEFINER` and `SET search_path = app, app_private` under FORCE RLS.
  - Public execution revoked; EXECUTE granted strictly to `lingora_transition_writer` (assessment publication) and `lingora_content_writer` (practice preparation).
  - Strict boolean projection only (`SELECT EXISTS(...)`); no prompts, options, keys, or metadata exposed.
  - Direction checks:
    - `'PRACTICE'`: checks for published lesson exercises and practice-exposed identities.
    - `'ASSESSMENT'`: checks for active published assessment version items.
  - Concurrency & locking:
    - Consistent hierarchy: `course -> sorted blueprints -> sorted assignments -> sorted item_identities (by fingerprint hash)`.
    - Advisory lock `hashtext(p_fingerprint)` serializes concurrent transactions inserting identical fingerprints, closing the absent-row race.
  - Documented two-transaction race trace showing serial lock acquisition and safe collision rollback.
- In [physical/rebuild-plan.md](physical/rebuild-plan.md):
  - Added future verification test case `PD-RDR03-COLLISION` testing collision detection, privilege revoking from ordinary writers, and concurrent transaction serialization.

---

## 6. Verification Summary & Artifact State

- **Entry Baseline:** Saved in [entry-baseline.json](evidence/2026-10-22-rdr-correction/entry-baseline.json).
- **Initial Review 1 Snapshot:** Preserved in [initial-snapshot/](evidence/2026-10-22-rdr-correction/initial-snapshot/).
- **Tested State Hashes:** Saved in [tested-state-hashes.json](evidence/2026-10-22-rdr-correction/tested-state-hashes.json).
- **Command Transcript:** Saved in [command-transcript.json](evidence/2026-10-22-rdr-correction/command-transcript.json).
- **Checks Passed:**
  - `python3 docs/modeling/current-target/verify_current.py`: **PASS (exit 0)** (36 source/PNG/SVG records, visible source parity, 44 native pages/payloads, native export provenance)
  - `python3 -m unittest docs/design/evidence/2026-10-22-rdr-correction/test_portability.py`: **PASS (exit 0)** (5 tests)
  - `python3 docs/design/evidence/2026-10-22-rdr-correction/verify_task.py`: **PASS (exit 0)** (4 tests: manifest partition 34/2, native page partition 42/2, physical catalog 34 tables / 4 views / 8 exports, semantic text assertions)
  - `git diff --check`: **PASS (exit 0)** (clean diff)
- **Status Assertion:** Physical design remains **PROPOSED / NOT IMPLEMENTED**; runtime SQL/RLS/concurrency remains **NOT EXECUTED**; live database remains **UNVERIFIED**.

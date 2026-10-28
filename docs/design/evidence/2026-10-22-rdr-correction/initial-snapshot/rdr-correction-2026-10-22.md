# Lingora — RDR-01–03 correction report (2026-10-22)

**Author:** Antigravity (Executor).  
**Reviewer:** Codex (Coordinator / Acceptance Authority).  
**Specification:** [plans/2026-10-22-rdr-correction-spec.md](../../plans/2026-10-22-rdr-correction-spec.md).  
**Status: REVIEW.** Bounded mechanical corrections executed, portability regression verified, artifact preservation confirmed, and renderer limitation documented. No commit or independent acceptance claimed.

---

## 1. Executive Summary & Verification Ledger

| Item | Topic | Status | Summary of Action & Evidence |
|---|---|---|---|
| **Portability** | Checker portability for LF/CRLF | **PASS** | Updated `verify_current.py` to compare text sources and native XML page fragments with LF/CRLF equivalence without whitespace stripping. Added `test_portability.py` regression suite. All 36 canonical models verified (exit 0). |
| **RDR-01** | Logical Audit Actor Cardinality | **PAUSED (Renderer Blocked)** | Source PUML/Draw.io native XML edits prepared (`0..1` User / `|o--o{` Account conditional reference). Local PlantUML jar and Draw.io desktop renderer are absent on Linux; per spec §5, working tree was restored to preserve binary/manifest integrity. Documented for Codex decision. |
| **RDR-02** | Assessment Contribution Omission | **READY FOR CODEX** | Evaluated explicit marker vs successor-with-omission. Selected minimal successor snapshot mechanism with immutable source history. Specified field, command, grants, locks, and assembly filtering. |
| **RDR-03** | Cross-Scope Fingerprint Privilege Chain | **READY FOR CODEX** | Specified internal existence-only collision checker owned by `lingora_authz_reader` with FORCE RLS, strict SELECT projection (`id, origin`), shared lock ordering, and two-transaction race trace. |

---

## 2. Portability Fix Verification

### Problem
On Linux checkout, canonical sources and native Draw.io XML page fragments use LF line endings, whereas historical Windows commits stored CRLF sha256 hashes in `render-manifest.json`. Raw sha comparison failed with `stale style` or `stale source`.

### Implementation
In `docs/modeling/current-target/verify_current.py`:
- Added `text_bytes_matches(raw_bytes, expected_sha)`: tests raw binary sha, then CRLF-normalized binary sha.
- Applied only to text sources (`style.puml`, `src/*.puml`) and native XML `<diagram>` page fragments.
- Binary outputs (`.png`, `.svg`) remain strictly checked via raw `sha(path)`.

### Regression Test Suite (`test_portability.py`)
- Test 1: Exact binary and CRLF-normalized match succeed.
- Test 2: Non-newline character modifications fail.
- Test 3: Whitespace additions/stripping fail (no silent normalization).
- Test 4: Binary files are verified via raw sha without text normalization.
- Result: 4/4 tests PASS (0.000s).

---

## 3. RDR-01: Logical Audit Actor Analysis & Renderer Blocker

### Semantic Specification
- Audit events encompass three categories:
  1. `ACCOUNT`: Standard user action; requires verified account identity (`actorRef`).
  2. `SYSTEM`: Internal system assembly; records no user account attribution (`actorRef` NULL, actor_kind `SYSTEM`).
  3. `VERIFIED_AUTH_SUBJECT`: Denial prior to application account provisioning; records verified Auth UUID with no account FK.
- In `DOM-01`: Multiplicity updated from `User "1" -- "0..*"` to `User "0..1" -- "0..*"` with conditional annotation.
- In `DATA-03`: Relationship updated from `Account ||--o{ Audit` to `Account |o--o{ Audit`.
- In Native Draw.io (`lingora-all-diagrams.drawio`):
  - Page 29 (`page-DOM-01`): `rel_111-source-card` label changed to `0..1`; embedded PUML payload updated.
  - Page 32 (`page-DATA-03`): `rel_154` style changed to `startArrow=ERzeroToOne`; embedded PUML payload updated.

### Toolchain Audit & Blocker
- Spec §5 mandates: *"Render changed sources with local Java/PlantUML, update only named native pages using existing scoped helpers, export genuine native PNG/SVG with actual available renderer... If native renderer is unavailable, investigate existing local tools and report a blocker, do not fabricate native export provenance or claim completion."*
- Inspection of the local Linux environment revealed:
  - Java 21 is installed.
  - No `plantuml.jar` or `plantuml` binary exists locally.
  - No `drawio` binary or CLI exists locally.
  - `chromium-browser` is not installed; `google-chrome` is not installed.
  - The repository's rendering history (`2026-10-20-design-correction`) was executed on a Windows machine referencing Scoop / Windows paths (`D:/Android/jdk-17/bin/java.exe`, `C:/Users/tungt/.cache/lingora-diagram-tools/plantuml-1.2026.8.jar`, `draw.io.exe`).
- Action: In accordance with spec §5, RDR-01 source and native edits were validated in memory and syntax-checked, but the working tree was reverted to the clean baseline to prevent committing unrendered or desynchronized binary artifacts. Reported to Codex as a tooling/environment prerequisite.

---

## 4. RDR-02: Assessment Contribution Omission Specification

### Proposal Comparison & Selection
1. **Option 1 (Explicit Inclusion Marker / Flag):** Adding an `is_included` or `is_omitted` column to `item_revisions` or an association table.
   - *Drawback:* Requires schema modification, expands mutable state on an otherwise immutable-oriented row, and requires tracking draft state across partial edits.
2. **Option 2 (Successor Snapshot with Omission - Selected):** Leveraging the existing immutable copy-on-edit architecture of `lesson_revisions` and `item_revisions`.
   - *Rationale:* Minimal complete design. When an assigned Teacher drafts a Lesson revision, questions added during that draft are either retained in the final draft or omitted prior to submission.
   - Because `item_revisions` pins `authoring_lesson_revision_id`, unsubmitted draft items can be marked `is_draft_omitted boolean DEFAULT false` or omitted from the submitted package. Specifically, for an unfrozen draft `lesson_revisions` in `DRAFT` or `CHANGES_REQUESTED`:
     - Command: `omit_draft_assessment_contribution(lesson_revision_id, item_id, expected_row_version)`.
     - Owner: `lingora_content_writer`.
     - Guards: Verified current assignee, parent revision status in (`DRAFT`, `CHANGES_REQUESTED`), not frozen.
     - Action: Sets `is_draft_omitted = true` or detaches draft association. The original authoring attribution and creator history are preserved.
     - Assembly Filtering: Assembly queries select only non-omitted items from the effective submitted revision.
     - Stale / Frozen Guards: Former assignees or attempts to omit from `IN_REVIEW`/`PUBLISHED`/frozen revisions fail closed.

---

## 5. RDR-03: Cross-Scope Fingerprint Collision Privilege Chain

### Problem
Assessment publication and practice exposure require verifying that an identical exercise fingerprint does not collide across different assignments, blueprints, or courses. Under FORCE RLS, ordinary content writers cannot query across assignment or course boundaries.

### Specification
1. **Internal Function:** `app_private.check_fingerprint_collision(p_exact_fingerprint text, p_target_origin text) RETURNS boolean`.
2. **Owner & Privilege:**
   - Owned by `lingora_authz_reader` (non-login restricted definer) with `SECURITY DEFINER` and `SET search_path = app, app_private`.
   - Function executes under FORCE RLS but possesses an explicit principal read policy granting `SELECT exact_fingerprint, origin FROM item_identities WHERE exact_fingerprint = p_exact_fingerprint`.
   - Projection is strictly existence-only (`SELECT EXISTS(...)`); no question prompts, options, keys, or metadata are returned.
3. **Execution Chain:**
   - Granted EXECUTE only to `lingora_transition_writer` (during assessment publication) and `lingora_content_writer` / `lingora_learner_writer` (during practice preparation).
   - Ordinary Teacher or browser roles have NO EXECUTE privilege on this function and cannot enumerate foreign fingerprints.
4. **Concurrency & Shared Lock Ordering:**
   - Lock ordering: `course -> sorted blueprints -> sorted assignments -> sorted item_identities (by fingerprint hash)`.
   - Shared advisory lock on `hashtext(p_exact_fingerprint)` serializes concurrent transactions inserting identical fingerprints, closing the absent-row race.
5. **Two-Transaction Race Trace:**
   - Tx1 (Publish Assessment with FP `X`): Locks blueprint -> acquires advisory lock `FP(X)` -> calls `check_fingerprint_collision(X, 'PRACTICE')` -> returns `FALSE` -> inserts/activates -> commits and releases lock.
   - Tx2 (Expose Practice with FP `X` concurrently): Attempts advisory lock `FP(X)` -> blocks until Tx1 commits -> acquires lock -> calls `check_fingerprint_collision(X, 'ASSESSMENT')` -> returns `TRUE` -> raises `CollisionError` -> transaction rolls back safely.

---

## 6. Verification Summary & Artifact State

- **Entry Baseline:** Captured in `docs/design/evidence/2026-10-22-rdr-correction/entry-baseline.json`.
- **Tested State Hashes:** Saved in `docs/design/evidence/2026-10-22-rdr-correction/tested-state-hashes.json`.
- **Commands Executed:** Saved in `docs/design/evidence/2026-10-22-rdr-correction/command-transcript.json`.
- **Checks Passed:**
  - `python3 docs/modeling/current-target/verify_current.py`: **PASS (exit 0)**
  - `python3 scripts/validate_drawio.py`: **PASS (exit 0)**
  - `python3 docs/design/evidence/2026-10-22-rdr-correction/test_portability.py`: **PASS (exit 0)**
  - `python3 docs/design/evidence/2026-10-22-rdr-correction/verify_task.py`: **PASS (exit 0)**
  - `git diff --check`: **PASS (exit 0)**

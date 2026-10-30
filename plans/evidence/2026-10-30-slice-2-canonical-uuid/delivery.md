# Delivery Record: Slice 2 Canonical UUID (Package U1-U2)

- **Package**: `U1-U2`
- **Status**: `DELIVERED`
- **Date**: 2026-10-30
- **Correction Budget**: 0/1 (0 consumed)
- **External Log Directory**: `/home/tung/.codex/task-logs/slice-2-canonical-uuid/`
- **Blocker**: `None`

---

## 1. Summary of Package U1-U2 Implementation

### Shared Validator Repair (`lingora-admin/src/server/frameworks/index.ts`)
- Replaced version/variant nibble restrictions (`[1-5]` and `[89ab]`) with case-insensitive 32 hex digits standard 8-4-4-4-12 UUID representation:
  ```ts
  export function isValidUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }
  ```
- Complies with PostgreSQL 128-bit stored UUID representation (`@db.Uuid`).
- Canonical CEFR framework ID (`00000000-0000-0000-0000-000000000010`), deterministic Level IDs (`00000000-0000-0000-0000-000000000021`..`24`), nil UUID, max UUID, uppercase/mixed-case, and non-v1–5 UUID values are accepted.
- Rejects whitespace (leading, trailing, newline, embedded), short/long strings, non-hex characters, braces, and malformed hyphen formatting.
- Preserved shared import/re-export contract across detail page, Framework routes, Level routes, and service helpers without new frameworks or dependencies.

### Focused Canonical & Regression Coverage (`lingora-admin/tests/feature/frameworks-crud.test.mjs`)
- **Unit Boundary Tests**:
  - `isValidUuid accepts canonical CEFR, deterministic child levels, nil, max, non-version1-5 and rejects malformed strings (U1)`: verifies standard v4, seed CEFR ID, deterministic level IDs, nil UUID, max UUID, uppercase/mixed-case, non-v1–5 UUIDs, and strict rejection of malformed/whitespace strings.
- **Service Layer Operations**:
  - `canonical CEFR parent framework ID and deterministic child level IDs operate correctly across all Framework and Level service helpers (U1)`: exercises `getFramework`, `updateFramework`, `deleteFramework`, `listLevels`, `getLevel`, `createLevel`, `updateLevel`, and `deleteLevel` with exact canonical IDs and query assertions. Verifies malformed ID rejection with zero database queries.
- **HTTP Route Handlers**:
  - `canonical CEFR parent framework ID and child level ID succeed across all HTTP route handlers with zero errors (U1)`: verifies `GET /api/frameworks/[frameworkId]`, `PATCH /api/frameworks/[frameworkId]`, `DELETE /api/frameworks/[frameworkId]`, `GET /api/frameworks/[frameworkId]/levels`, `POST /api/frameworks/[frameworkId]/levels`, `PATCH /api/frameworks/[frameworkId]/levels/[levelId]`, and `DELETE /api/frameworks/[frameworkId]/levels/[levelId]`. Verifies malformed route parameters reject with status 400 and zero database writes.
- **Production Detail TSX Execution (Acceptance 1)**:
  - `frameworks/[frameworkId] page actual execution with canonical CEFR framework ID renders correct parent and levels (Acceptance 1)`: loaded via `compileAndLoadPage`; executes real server component logic with canonical CEFR ID, queries Prisma mock with exact ID, and renders `LevelsCatalog` wrapped in `AppShell` with correct parent and 4 child levels without triggering `notFound()`.
- **Production Catalogue Href-to-Detail Regression (Acceptance 1)**:
  - `Production catalogue renders canonical CEFR and its actual generated href leads to production detail success, rejecting malformed IDs with zero DB access (Acceptance 1)`:
    - Renders production `FrameworksPage` with canonical CEFR record.
    - Mounts actual production `FrameworksCatalog` component through standard React server renderer seam.
    - Inspects the rendered table and proves the generated link href strictly equals `/frameworks/00000000-0000-0000-0000-000000000010`.
    - Resolves route parameter from that exact href and executes `FrameworkDetailPage`.
    - Proves successful rendering of `LevelsCatalog` with exact parent framework and levels without `notFound()`.
    - Proves malformed IDs passed to `FrameworkDetailPage` trigger `notFound()` with 0 catalogue database reads.

---

## 2. Gate Verification & Exit Codes

All local gates executed cleanly with exit code 0:

| Gate | Scope | Command | Tests / Results | Exit Code |
|---|---|---|---|---|
| **Gate 1: Targeted Canonical Pattern** | Canonical feature tests | `node --experimental-strip-types --experimental-test-module-mocks --test-name-pattern=canonical tests/feature/frameworks-crud.test.mjs` | **5 / 5 pass**, 0 fail | **0** |
| **Gate 2: Targeted Frameworks Suite** | Complete frameworks feature suite | `node --experimental-strip-types --experimental-test-module-mocks tests/feature/frameworks-crud.test.mjs` | **81 / 81 pass**, 0 fail | **0** |
| **Gate 3: Full Feature Suite** | auth + languages-crud + frameworks-crud | `npm run test:feature` | **155 / 155 pass** (baseline 150 + 5), 0 fail | **0** |
| **Gate 4: Full Components Suite** | isolated-components + isolated-components-frameworks | `npm run test:components` | **31 / 31 pass** (baseline 31), 0 fail | **0** |
| **Gate 5: Typecheck** | Next / TypeScript compiler | `npm run typecheck` | No errors | **0** |
| **Gate 6: Production Build** | Production Next.js Turbopack build | `npm run build` | Compiled successfully | **0** |

---

## 3. Five Mutation Controls Verification (`review-mutations.py`)

All five independent reviewer mutations verified via `/home/tung/.codex/task-logs/slice-2-canonical-uuid/review-mutations.py`:

```json
[
  {
    "mutation": "production-page-wiring",
    "baseline_exit": 0,
    "mutant_exit": 1,
    "restored_byte_exact": true,
    "restore_exit": 0,
    "verdict": "KILLED"
  },
  {
    "mutation": "actual-404-handling",
    "baseline_exit": 0,
    "mutant_exit": 1,
    "restored_byte_exact": true,
    "restore_exit": 0,
    "verdict": "KILLED"
  },
  {
    "mutation": "level-post-admin-guard",
    "baseline_exit": 0,
    "mutant_exit": 1,
    "restored_byte_exact": true,
    "restore_exit": 0,
    "verdict": "KILLED"
  },
  {
    "mutation": "logout-draft-cleanup",
    "baseline_exit": 0,
    "mutant_exit": 1,
    "restored_byte_exact": true,
    "restore_exit": 0,
    "verdict": "KILLED"
  },
  {
    "mutation": "canonical-uuid",
    "baseline_exit": 0,
    "mutant_exit": 1,
    "restored_byte_exact": true,
    "restore_exit": 0,
    "verdict": "KILLED"
  }
]
```

---

## 4. Changed Files

### Modified
- `lingora-admin/src/server/frameworks/index.ts` (shared validator repair removing version/variant restrictions)
- `lingora-admin/tests/feature/frameworks-crud.test.mjs` (added `renderToStaticMarkup` import, canonical unit tests, service tests, route tests, production page detail test, and catalogue href-to-detail regression test)

### Created
- `plans/evidence/2026-10-30-slice-2-canonical-uuid/delivery.md` (this delivery record)

### Preserved Untouched
- All unrelated uncommitted changes in `lingora-admin` and `plans/`
- `plans/current-task.md` (untouched; Codex owns final acceptance)
- All prior evidence records and migrations
- Protected log `docs/design/physical/evidence/2026-10-22-p0-p1-execution/wp00/05-provider-stack-lifecycle.log` untouched and unread

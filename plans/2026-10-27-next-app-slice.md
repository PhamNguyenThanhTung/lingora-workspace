# Proposal: Vertical Slice 1 — Language Management (Admin)

- **Date:** 2026-10-28 (updated from 2026-10-27 outline)
- **Status:** PROPOSED — NOT STARTED. No framework choice or installation is performed in this task.
- **Workflow Authority:** [AGENTS.md](../AGENTS.md) (KISS, Backend-First Validation, Vertical Slice Development).

## 1. Context and Objective

Following the pragmatic reset and documentation cleanup (`DOC-CLEAN-01`), feature development proceeds in complete vertical slices (Database Query → API Route → UI Component).

The proposed first vertical slice is **Language Management** for the Admin persona, providing:
1. Minimal web application and Admin authentication foundation.
2. Verified provider auth session → fresh account read / role and status check (`ACTIVE` Admin required) at backend boundary.
3. Safe Language CRUD operations via `lingora-admin/src/server/db/index.js` (generated product Prisma Client).
4. Graceful handling of duplicates, unique constraint violations, and foreign key errors at the backend.
5. Minimal UI acceptance verifying list, creation, edit, and deletion/deactivation of languages.

## 2. Prerequisites & Scope Boundaries

### In Scope (Inside Slice)
- Authenticated Subject Verification: Resolve provider Auth subject (`auth.users.id`), verify `app.accounts` record, role (`ADMIN`), and status (`ACTIVE`). These checks are internal prerequisites inside the slice, not a separate external audit gate.
- Language CRUD queries, server-side validation with Zod/TypeScript, and API endpoints.
- Error handling: duplicate code/name, FK constraints on dependent courses.
- Basic Admin UI component to test and exercise the functionality end-to-end.

### Out of Scope (Deferred to Later Slices)
- Curriculum authoring, Lesson/Exercise creation, or revision workflows.
- Learner learning contexts, placement, attempts, or SRS engines.
- Assessment blueprint and version assembly.
- Multi-role switching or public learner self-registration.

## 3. Controlling Documents
- Architecture & Policy: [AGENTS.md](../AGENTS.md)
- Product Schema: `lingora-admin/prisma/product/schema.prisma`
- UI Design Reference: [DESIGN.md](../DESIGN.md)
- Cleanup & Foundation Status: [Báo cáo dọn dẹp](../docs/repository-cleanup-2026-10-28.md)

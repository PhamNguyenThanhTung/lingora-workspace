# Lingora Learner

Learner application and trusted server boundary. Staff management remains in `lingora-admin`.

- Configure the three variables in `.env.example` using ignored `.env.local` locally or Vercel project settings. No Supabase Admin/service key is needed by this app.
- Public entry: `/` introduces Lingora; `/home` is the learner workspace after login. Staff management remains in `lingora-admin`.
- From the repository root: `npm run dev -w lingora-web -- --port 3001`, `npm run build -w lingora-web`, `npm run test:feature -w lingora-web`, and `npm run test:components -w lingora-web`. `npm run test:all -w lingora-web` builds once, then runs feature, component, and landing browser tests sequentially.
- PostgreSQL integration suites: run from repo root via `npm run test:integration:lessons` and `npm run test:integration:practice` (backed by loopback runner `scripts/local-test-db.mjs`).
- `/login` supports existing email-confirmed ACTIVE LEARNER Accounts. Self-registration and Teacher activation are separate flows.
- `/home` and `/api/learner/context` resolve the verified session's context list. An empty list is valid.
- `/learn/[contextId]` and `/learn/[contextId]/[lessonId]` provide course catalogue navigation, lesson reading consumption, and interactive practice attempts with server-side grading.
- Progress and roadmap status: see [roadmap](../plans/roadmap.md).

The shared product Prisma schema/migration owner remains in `lingora-admin`; the learner build generates that existing client without applying migrations. On Vercel use a separate project rooted at `lingora-web` with source files outside that directory included in the build.

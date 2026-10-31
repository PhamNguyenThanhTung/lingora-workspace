# Lingora Learner

Learner application and trusted server boundary. Staff management remains in `lingora-admin`.

- Configure the three variables in `.env.example` using ignored `.env.local` locally or Vercel project settings. No Supabase Admin/service key is needed by this app.
- From the repository root: `npm run dev -w lingora-web -- --port 3001`, `npm run build -w lingora-web`, `npm run test:feature -w lingora-web`, and `npm run test:components -w lingora-web`.
- `/login` supports existing email-confirmed ACTIVE LEARNER Accounts. Self-registration and Teacher activation are separate flows.
- `/home` and `/api/learner/context` resolve the verified session's context list. An empty list is valid. No lesson/progress runtime is included.

The shared product Prisma schema/migration owner remains in `lingora-admin`; the learner build generates that existing client without applying migrations. On Vercel use a separate project rooted at `lingora-web` with source files outside that directory included in the build.

# Lingora Web learner foundation

Checked 2026-10-16: this package implements Supabase SSR registration/login/logout, protected session handling and Vietnamese/English UI messages. Routes are `/`, `/login` and `/register`; the authenticated home is a foundation shell. The former M1.5 mock AI routes/proxy are absent. Course, lesson, Placement, progress and SRS flows are not implemented. See the [repository audit](../docs/repository-audit-2026-10-16.md).

## Local run

1. Copy `.env.example` to `.env.local` and supply local values.
2. Run `npm ci`, then `npm run dev`.

Auth runs through server actions and server-side session checks. Sessions use server-set httpOnly
cookies; browser JavaScript cannot read those cookies.

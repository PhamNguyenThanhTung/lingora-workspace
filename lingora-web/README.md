# Lingora Web learner foundation

M1.6W proves server-side Supabase Auth and protected connectivity to the two M1.5 mock endpoints.

## Local run

1. Copy `.env.example` to `.env.local` and supply local values.
2. Start `lingora-ai/api` with `MOCK_MODE=true`.
3. Run `npm ci`, then `npm run dev`.

The browser never stores Supabase access or refresh tokens. Auth runs through server actions, cookies are
httpOnly, and AI requests go only through the fixed `/api/ai/srs` and `/api/ai/chat` handlers.

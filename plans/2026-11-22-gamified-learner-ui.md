# Gamified Learner UI — plan

Date: 2026-11-22 · Status: DRAFT (waiting for owner approval) · Area: `lingora-web` (learner app)

## Why

The 2026-11-22 acceptance run on `lingora-learner-dev.vercel.app` showed that the learning loop works
(XP, streak, quests, badges, unlock, SRS) but the screens feel like forms: one long scrolling page, small
default inputs, plain text feedback ("✓ Chính xác!"), and rewards shown as a static table. The goal is a
game-like, smooth learning experience in the style of modern language-learning apps — with **our own**
visual identity (indigo/blue palette from PR #4, our own illustrations/mascot if any). We copy mechanics
and feel, never another product's art, mascot, sounds, or exact layouts.

## Guardrails

- UI-only first. Phases 1–3 use the existing APIs and DTOs; no schema change. Anything that needs new
  data (hearts, gems, leagues) is Phase 5 and needs its own approval + new migration.
- Keep every `id` / accessible name the component tests rely on, or update those tests in the same commit.
- `prefers-reduced-motion`: every animation has a no-motion path. Sound is **off by default**, toggle in header.
- Mobile first (375 px) — most learners are on phones. Touch targets ≥ 44 px.
- Keyboard: answer options selectable with 1–9, Enter = Kiểm tra / Tiếp tục.
- Libraries: CSS keyframes for most motion; add at most `canvas-confetti` (~6 kB). No heavy animation
  framework unless Phase 3 proves CSS is not enough.

## Phase 1 — Fix what breaks the game (correctness, ~0.5 day)

Must ship before polish, because a game you can win without thinking is not a game.

1. Shuffle REORDER tokens and MCQ options per attempt (seeded by attempt id so reload is stable).
   Server must still grade by value, not position — add a test that a shuffled order is graded correctly.
2. Hide the "Bài tập đọc hiểu" answer preview: show only the prompts (or remove the block) while practice
   is not completed.
3. Daily quest "Ôn tập 10 từ vựng" is impossible on day 1 → swap for a reachable quest when `reviewDue = 0`
   (e.g. "Đạt 100% một bài luyện tập").
4. Empty review page: "Chưa có từ nào đến hạn — quay lại vào <ngày giờ>" instead of "Hoàn thành ôn tập!".
5. Strip the "Bài N:" prefix from demo seed titles (`scripts/seed-demo-course.mjs`) — new seed revision,
   no data delete.

## Phase 2 — Lesson player becomes a "session" screen (core, ~2 days)

`PracticeSection.tsx` (833 lines) is split into a focused full-screen session:

- **Layout:** full-screen route state (`/learn/.../practice` or a full-viewport overlay), header with ✕
  (confirm-to-quit), a thick animated **progress bar**, one question per screen, sticky bottom action bar.
- **Answer UI per type:**
  - MCQ → large tappable cards with keyboard number hint, selected state with lift + border.
  - REORDER → word chips that animate (FLIP) from the bank into the answer line; tap to send back.
  - FILL_BLANK / GRAMMAR → large styled input inline in the sentence, autofocus, Enter submits.
- **Check → feedback sheet:** bottom sheet slides up, blue for correct / amber-red for wrong, with the
  correct answer + explanation (already in the result DTO) and a "Tiếp tục" button. Shake on wrong,
  small pop on correct.
- **Combo counter:** 3+ correct in a row shows "🔥 x3" chip (client-only, from attempt answers).
- **Retry round:** wrong questions come back with a "Làm lại câu sai" interstitial card.
- Optional sound pack (original/royalty-free short SFX) behind the header toggle.

## Phase 3 — Celebration & reward screens (~1 day)

Replace the static "PHẦN THƯỞNG & THÀNH TÍCH" table with a sequenced end screen:

1. "Hoàn thành!" with confetti burst.
2. Three stat tiles counting up: XP (+40), accuracy (83%), time spent.
3. Streak screen when the streak changed today: flame animates, week strip fills today's dot.
4. Badge unlock card flips in when `newBadges` is non-empty.
5. Quest progress bars animate to their new value; "Tiếp tục" returns to Home and scrolls to the next node.

## Phase 4 — Home as a learning path map (~2 days)

`HomeView.tsx` (1550 lines) — extract `PathMap`, `StatsBar`, `QuestCard` components first.

- **Top stats bar** (sticky): 🔥 streak, ⚡ XP, daily goal ring.
- **Path map:** vertical zig-zag of round lesson nodes grouped by chapter banners; states
  done (filled + ✓ + score), current (pulsing ring + "Bắt đầu" popover), locked (grey + lock).
  Tap a node → popover with title, score, "Học" / "Ôn lại".
- **Chapter banner** with the chapter title and progress (2/3).
- **Quests panel:** cards with progress bars and chest/reward icon; done state animates once.
- **Streak calendar:** keep the 28-day calendar but restyle as a heat strip.
- Move "Thêm ngôn ngữ / Cập nhật mục tiêu / Tạm dừng" into a settings sheet so the path is the hero.

## Phase 5 — New game mechanics (needs data model approval; not started)

Each item needs a spec + new migration + server tests before UI:

- Hearts/energy (recommend **not** punitive for A1 learners — maybe "practice to refill" only).
- Gems / currency + streak freeze.
- Weekly league / leaderboard among learners on the same course.
- Mascot with reactions (original character; commission or generate, never borrow).

## Verification per phase

- `npm run typecheck`, `npm run test:feature`, `npm run test:components` green (CI already runs them).
- New Playwright component test per phase: practice session flow (correct, wrong → retry, finish),
  reward sequence, path map node states; mobile 375 px + desktop screenshots in the test artifacts dir.
- Reduced-motion run: same tests with `reducedMotion: 'reduce'`.
- Manual acceptance on the Vercel preview of each PR with a fresh learner account.

## Order & PRs

One PR per phase: P1 → P2 → P3 → P4. Phase 5 only after the owner picks which mechanics to add.

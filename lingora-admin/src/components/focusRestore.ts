/**
 * Focus restoration after a modal closes.
 *
 * The catalogues mark `#appContainer` with `inert` while a modal is open and clear it
 * from a React effect, i.e. only once the closing render has been committed. Focus
 * restoration, on the other hand, used to run from a bare `setTimeout(..., 50)`. When the
 * machine is slow (a 2-core CI runner under load) React can commit later than that timer,
 * so `focus()` lands on a still-inert subtree, is silently dropped, and `document.activeElement`
 * stays on `<body>` for good — the keyboard user loses their place, and tests that wait for
 * focus to leave `<body>` hang until their timeout.
 *
 * `restoreFocusAfterClose` keeps the same 50ms first attempt, but when the target is still
 * inside an inert subtree it waits for that to clear instead of throwing the focus away.
 */

const FIRST_ATTEMPT_MS = 50;
const RETRY_MS = 50;
const MAX_RETRIES = 40; // ~2s, then give up rather than poll forever

export function restoreFocusAfterClose(getTarget: () => HTMLElement | null | undefined): void {
  let retries = 0;

  const attempt = () => {
    const target = getTarget();
    if (!target || typeof target.focus !== 'function') return;

    if (target.closest('[inert]') && retries < MAX_RETRIES) {
      retries += 1;
      setTimeout(attempt, RETRY_MS);
      return;
    }

    target.focus();
  };

  setTimeout(attempt, FIRST_ATTEMPT_MS);
}

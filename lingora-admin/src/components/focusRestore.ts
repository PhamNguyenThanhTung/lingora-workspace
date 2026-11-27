'use client';

import { useCallback, useEffect, useRef } from 'react';

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
 * `restoreFocusAfterClose` keeps the same 50ms first attempt, observes `inert` clearance
 * instead of focusing into an inert subtree, aborts if the target is missing/disabled or
 * another modal has opened, and returns a cleanup function so callers never leak timers or
 * observers across unmounts or rapid close/reopen cycles.
 */

const FIRST_ATTEMPT_MS = 50;
const RETRY_MS = 50;
const MAX_RETRIES = 40; // ~2s, then abort rather than focusing into inert or polling forever

function isTargetFocusable(target: HTMLElement | null | undefined): target is HTMLElement {
  if (!target || typeof target.focus !== 'function' || !target.isConnected) {
    return false;
  }
  if (
    (target as HTMLButtonElement).disabled ||
    target.hasAttribute('disabled') ||
    target.getAttribute('aria-disabled') === 'true'
  ) {
    return false;
  }
  if (target.closest('[inert]')) {
    return false;
  }
  if (typeof document !== 'undefined' && document.querySelector('[role="dialog"][aria-modal="true"]')) {
    return false;
  }
  return true;
}

export function restoreFocusAfterClose(getTarget: () => HTMLElement | null | undefined): () => void {
  let cancelled = false;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let observer: MutationObserver | null = null;
  let retries = 0;

  const cleanup = () => {
    cancelled = true;
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  const tryFocusNow = (): boolean => {
    if (cancelled) return true;
    const target = getTarget();
    if (!target || typeof target.focus !== 'function' || !target.isConnected) {
      cleanup();
      return true;
    }
    if (typeof document !== 'undefined' && document.querySelector('[role="dialog"][aria-modal="true"]')) {
      cleanup();
      return true;
    }
    if (!target.closest('[inert]')) {
      if (isTargetFocusable(target)) {
        target.focus();
      }
      cleanup();
      return true;
    }
    return false;
  };

  const scheduleFallbackPoll = () => {
    if (cancelled || retries >= MAX_RETRIES) {
      cleanup();
      return;
    }
    retries += 1;
    timerId = setTimeout(() => {
      timerId = null;
      if (!tryFocusNow()) {
        scheduleFallbackPoll();
      }
    }, RETRY_MS);
  };

  const attempt = () => {
    timerId = null;
    if (tryFocusNow()) return;

    const target = getTarget();
    const inertAncestor = target?.closest('[inert]') ?? null;
    if (inertAncestor && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        tryFocusNow();
      });
      observer.observe(inertAncestor, { attributes: true, attributeFilter: ['inert'] });
      timerId = setTimeout(() => {
        timerId = null;
        if (!tryFocusNow()) {
          cleanup();
        }
      }, RETRY_MS * MAX_RETRIES);
      return;
    }

    scheduleFallbackPoll();
  };

  timerId = setTimeout(attempt, FIRST_ATTEMPT_MS);
  return cleanup;
}

/**
 * Shared modal-background `inert` lifecycle and safe post-close focus restoration.
 * Cancels any pending focus restoration immediately when a modal opens or on unmount.
 */
export function useModalInertAndFocusRestore(
  anyModalOpen: boolean
): (getTarget: () => HTMLElement | null | undefined) => void {
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = document.getElementById('appContainer');
    if (anyModalOpen) {
      cancelRef.current?.();
      cancelRef.current = null;
      container?.setAttribute('inert', '');
    } else {
      container?.removeAttribute('inert');
    }
    return () => {
      container?.removeAttribute('inert');
    };
  }, [anyModalOpen]);

  useEffect(() => {
    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
    };
  }, []);

  return useCallback((getTarget: () => HTMLElement | null | undefined) => {
    cancelRef.current?.();
    cancelRef.current = restoreFocusAfterClose(getTarget);
  }, []);
}

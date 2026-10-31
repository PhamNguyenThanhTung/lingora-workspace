let notFoundCalled = false;
let lastRedirectUrl: string | null = null;

export function getNotFoundCalled() {
  return notFoundCalled;
}

export function resetNotFoundCalled() {
  notFoundCalled = false;
}

export function getLastRedirectUrl() {
  return lastRedirectUrl;
}

export function resetLastRedirectUrl() {
  lastRedirectUrl = null;
}

export function notFound(): never {
  notFoundCalled = true;
  const err = new Error('NEXT_NOT_FOUND');
  (err as any).digest = 'NEXT_NOT_FOUND';
  throw err;
}

export function redirect(url: string): never {
  lastRedirectUrl = url;
  const err = new Error(`NEXT_REDIRECT:${url}`);
  (err as any).digest = `NEXT_REDIRECT;${url}`;
  throw err;
}

export function useRouter() {
  return {
    push: (url: string) => {
      if (typeof window !== 'undefined') {
        (window as any).__lastNavigatedUrl = url;
        if (document.getElementById('production-page')) {
          (window as any).__navigating = true;
          window.location.assign(url);
        }
      }
    },
    replace: (url: string) => {
      if (typeof window !== 'undefined') {
        (window as any).__lastNavigatedUrl = url;
      }
    },
    refresh: () => {
      if (typeof window !== 'undefined') {
        (window as any).__refreshCalled = true;
        if (document.getElementById('production-page') && !(window as any).__navigating) window.location.reload();
      }
    },
    back: () => {},
    forward: () => {},
    prefetch: () => {},
  };
}

export function usePathname() {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
}

export function useSearchParams() {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
}

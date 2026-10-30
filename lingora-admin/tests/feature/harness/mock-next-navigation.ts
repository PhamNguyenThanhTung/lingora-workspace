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
      }
      console.log('[Router] push:', url);
    },
    replace: (url: string) => {
      if (typeof window !== 'undefined') {
        (window as any).__lastNavigatedUrl = url;
      }
      console.log('[Router] replace:', url);
    },
    refresh: () => {
      console.log('[Router] refresh');
    },
    back: () => {},
    forward: () => {},
  };
}

export function useSearchParams() {
  return new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
}

export function usePathname() {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

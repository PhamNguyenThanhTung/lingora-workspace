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

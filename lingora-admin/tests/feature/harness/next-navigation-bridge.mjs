export function notFound() {
  const err = new Error('NEXT_NOT_FOUND');
  err.digest = 'NEXT_NOT_FOUND';
  throw err;
}

export function redirect(url) {
  const err = new Error(`NEXT_REDIRECT:${url}`);
  err.digest = `NEXT_REDIRECT;${url}`;
  throw err;
}

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
  };
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function usePathname() {
  return '/frameworks';
}

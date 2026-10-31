import { AsyncLocalStorage } from 'node:async_hooks';
export const requests = new AsyncLocalStorage();
export async function cookies() { return requests.getStore(); }
export function redirect(url) { const error=new Error('Test framework redirect');error.destination=url;throw error; }
export function useRouter() { return { push(){}, refresh(){} }; }

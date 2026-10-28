import { setAccessToken } from './api/client';

const TOKEN_KEY = 'techit_access_token';

export function persistAccessToken(token: string | null) {
  setAccessToken(token);
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // The in-memory token remains available when storage is unavailable.
  }
}

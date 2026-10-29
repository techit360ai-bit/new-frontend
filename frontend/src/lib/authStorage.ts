import { setAccessToken } from './api/client';

const LEGACY_TOKEN_KEY = 'techit_access_token';

/**
 * Keeps the access token in memory for the current tab only.
 *
 * Web storage is readable from DevTools and by any injected script, so a token
 * written there is a persistent session-theft primitive. Browser sessions are
 * carried by the HttpOnly `techit_access` cookie; this only mirrors the token
 * in memory for the tab that signed in.
 */
export function persistAccessToken(token: string | null) {
  setAccessToken(token ?? null);
  try {
    // Purge a token left behind by an earlier build that mirrored it to storage.
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // The in-memory token remains available when storage is unavailable.
  }
}

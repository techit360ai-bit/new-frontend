import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getAuthToken, setAccessToken } from '@/lib/api/client';
import { persistAccessToken } from '@/lib/authStorage';

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  });
  sessionStorage.clear();
  setAccessToken(null);
});

afterEach(() => {
  setAccessToken(null);
  vi.unstubAllGlobals();
});

test('keeps the signed-in access token available for onboarding mutations', () => {
  persistAccessToken('access-token');

  expect(sessionStorage.getItem('techit_access_token')).toBe('access-token');
  expect(getAuthToken()).toBe('access-token');
});

test('clears the access token on sign out', () => {
  persistAccessToken('access-token');
  persistAccessToken(null);

  expect(sessionStorage.getItem('techit_access_token')).toBeNull();
  expect(getAuthToken()).toBeNull();
});

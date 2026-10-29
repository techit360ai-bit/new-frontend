import { afterEach, expect, test, vi } from 'vitest';
import { domainGet, domainPost } from './domainApi';
import { setAccessToken, setAuthTokenGetter } from './api/client';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setAccessToken(null);
  setAuthTokenGetter(() => null);
});

test('cookie sessions carry CSRF on domain mutations without a stored bearer', async () => {
  setAccessToken(null);
  setAuthTokenGetter(() => null);
  vi.stubGlobal('document', { cookie: 'techit_csrf=csrf%2Btoken' });
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ saved: true })));
  vi.stubGlobal('fetch', fetch);
  await domainPost('/notifications/preferences', { scope: 'explorer', preferences: { email: false } });
  const [url, init] = fetch.mock.calls[0];
  expect(url).toContain('/api/domain/notifications/preferences');
  expect(init.credentials).toBe('include');
  expect(init.headers['X-CSRF-Token']).toBe('csrf+token');
  expect(init.headers.Authorization).toBeUndefined();
  expect(JSON.parse(init.body).scope).toBe('explorer');
});

test('permission errors retain their HTTP status for scoped panels', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'scope_forbidden' }), { status: 403 })));
  await expect(domainGet('/execution-intelligence?role=investor')).rejects.toMatchObject({ status: 403, body: { error: 'scope_forbidden' } });
});

test('scope requests forward cancellation to prevent obsolete readings', async () => {
  const controller = new AbortController();
  const fetch = vi.fn().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', fetch);
  await domainGet('/execution-intelligence?projectId=venture-2', { signal: controller.signal });
  const requestSignal = fetch.mock.calls[0][1].signal as AbortSignal;
  expect(requestSignal.aborted).toBe(false);
  controller.abort();
  expect(requestSignal.aborted).toBe(true);
});

test('cancellable scope requests retain the API deadline', async () => {
  const scope = new AbortController();
  const deadline = new AbortController();
  vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
  const fetch = vi.fn().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', fetch);
  await domainGet('/execution-intelligence?projectId=venture-2', { signal: scope.signal });
  const requestSignal = fetch.mock.calls[0][1].signal as AbortSignal;
  deadline.abort();
  expect(requestSignal.aborted).toBe(true);
  expect(scope.signal.aborted).toBe(false);
});

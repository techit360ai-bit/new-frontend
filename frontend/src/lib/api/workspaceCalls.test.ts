import { expect, test } from 'vitest';
import { setAuthTokenGetter } from './client';
import { fetchWorkspaceCallToken } from './workspaceCalls';

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

test('requests a workspace call token from the authenticated domain endpoint', async () => {
  setAuthTokenGetter(() => 'jwt-founder');
  const original = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return response({ available: true, token: 'lk-token', url: 'wss://livekit.example', room: 'workspace-ws_1', identity: 'user_1', canPublish: true });
  }) as typeof fetch;
  try {
    const result = await fetchWorkspaceCallToken('ws_1');
    expect(calls[0]?.[0]).toBe('http://localhost:3000/api/domain/workspaces/ws_1/call-token');
    expect(calls[0]?.[1]?.method).toBe('POST');
    expect((calls[0]?.[1]?.headers as Record<string, string>)?.Authorization).toBe('Bearer jwt-founder');
    expect(result).toMatchObject({ available: true, token: 'lk-token', room: 'workspace-ws_1' });
  } finally {
    globalThis.fetch = original;
    setAuthTokenGetter(() => null);
  }
});

test('surfaces the explicit not-configured state', async () => {
  setAuthTokenGetter(() => 'jwt-founder');
  const original = globalThis.fetch;
  globalThis.fetch = (async () => response({ available: false, reason: 'live_calls_not_configured', workspaceId: 'ws_1' })) as typeof fetch;
  try {
    const result = await fetchWorkspaceCallToken('ws_1');
    expect(result.available).toBe(false);
    expect(result.reason).toBe('live_calls_not_configured');
  } finally {
    globalThis.fetch = original;
    setAuthTokenGetter(() => null);
  }
});

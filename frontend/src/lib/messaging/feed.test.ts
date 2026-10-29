import { expect, test } from 'vitest';
import { fetchPostsPage } from './feed';

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

test('propagates a real messaging failure instead of returning an empty feed', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => jsonResponse({ error: 'missing bearer token' }, 401)) as typeof fetch;
  try {
    await expect(fetchPostsPage({ zone: 'global', category: 'for-you' })).rejects.toThrow('missing bearer token');
  } finally {
    globalThis.fetch = original;
  }
});

test('returns persisted posts on success', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => jsonResponse({ posts: [{ id: 'p1' }], hasMore: false }, 200)) as typeof fetch;
  try {
    const page = await fetchPostsPage({ zone: 'global', category: 'for-you' });
    expect(page.posts?.[0]?.id).toBe('p1');
  } finally {
    globalThis.fetch = original;
  }
});

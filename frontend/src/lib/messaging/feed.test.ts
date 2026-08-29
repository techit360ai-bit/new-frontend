import { expect, test } from 'vitest';
import { createComment, fetchComments, fetchPost, fetchPosts } from './feed';

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  const original = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return handler(String(url), init);
  }) as typeof fetch;
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

test('feed accepts an empty live post response without demo records', async () => {
  const fetchMock = stubFetch(async () => response({ posts: [] }));
  try {
    await expect(fetchPosts('global')).resolves.toEqual([]);
    expect(fetchMock.calls[0][0]).toBe('http://localhost:8080/api/v1/posts?zone=global');
  } finally {
    fetchMock.restore();
  }
});

test('feed resolves post detail from persisted posts', async () => {
  const post = {
    id: 'post_1',
    authorId: 'user_1',
    authorRole: 'founder',
    audience: ['all'],
    kind: 'milestone',
    body: 'Shipped live',
    ts: '2026-07-14T12:00:00Z',
  };
  const fetchMock = stubFetch(async () => response({ posts: [post] }));
  try {
    await expect(fetchPost('post_1')).resolves.toEqual(post);
    await expect(fetchPost('missing')).resolves.toBeNull();
  } finally {
    fetchMock.restore();
  }
});

test('feed comments use persisted messaging endpoints', async () => {
  const comment = {
    id: 'comment_1',
    postId: 'post_1',
    authorId: 'user_2',
    body: 'Live comment',
    ts: '2026-07-14T12:05:00Z',
  };
  const fetchMock = stubFetch(async (url, init) => (
    init?.method === 'POST' ? response(comment) : response({ comments: [comment] })
  ));
  try {
    await expect(fetchComments('post_1')).resolves.toEqual([comment]);
    await expect(createComment('post_1', 'Live comment')).resolves.toEqual(comment);
    expect(fetchMock.calls[0][0]).toBe('http://localhost:8080/api/v1/posts/post_1/comments');
    expect(fetchMock.calls[1][0]).toBe('http://localhost:8080/api/v1/posts/post_1/comments');
    expect(fetchMock.calls[1][1]?.method).toBe('POST');
    expect(fetchMock.calls[1][1]?.body).toBe(JSON.stringify({ body: 'Live comment' }));
  } finally {
    fetchMock.restore();
  }
});

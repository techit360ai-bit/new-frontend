import { expect, test } from 'vitest';
import { setAuthTokenGetter } from './client';
import {
  listFeedNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeFeedNotification,
  normalizeNotification,
} from './notifications';

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

test('workspace notifications read canonical BACKEND endpoint with auth', async () => {
  setAuthTokenGetter(() => 'jwt-notifications');
  const fetchMock = stubFetch(async () => response({
    notifications: [
      {
        id: 'notif_1',
        type: 'comment',
        content: 'PR #42 needs review',
        author: 'TechIT Platform',
        read: false,
        timeAgo: '5 minutes ago',
      },
    ],
  }));

  try {
    const rows = await listNotifications();
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];

    expect(url).toBe('http://localhost:3000/api/notifications');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-notifications');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'notif_1',
      type: 'pr',
      title: 'TechIT Platform',
      message: 'PR #42 needs review',
      read: false,
    });
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test('workspace notifications return empty live state without bundled records', async () => {
  const fetchMock = stubFetch(async () => response({ notifications: [] }));

  try {
    await expect(listNotifications()).resolves.toEqual([]);
  } finally {
    fetchMock.restore();
  }
});

test('workspace notifications write read mutations to BACKEND', async () => {
  const fetchMock = stubFetch(async () => response({
    id: 'notif_read',
    type: 'mention',
    content: 'Mentioned in workspace',
    author: 'Workspace',
    read: true,
  }));

  try {
    const row = await markNotificationRead('notif_read');
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];

    expect(url).toBe('http://localhost:3000/api/notifications/notif_read/read');
    expect(init.method).toBe('PATCH');
    expect(row).toMatchObject({ id: 'notif_read', type: 'mention', read: true });
  } finally {
    fetchMock.restore();
  }
});

test('workspace notifications mark all through persisted endpoint', async () => {
  const fetchMock = stubFetch(async () => response({ ok: true }));

  try {
    await markAllNotificationsRead();
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];

    expect(url).toBe('http://localhost:3000/api/notifications/read-all');
    expect(init.method).toBe('POST');
  } finally {
    fetchMock.restore();
  }
});

test('workspace notification normalizer tolerates partial live rows', () => {
  expect(normalizeNotification({ content: 'Deployment completed', createdAt: '2026-07-14T10:00:00Z' })).toMatchObject({
    id: 'Deployment completed',
    type: 'build',
    title: 'TechIT Platform',
    message: 'Deployment completed',
    timestamp: '2026-07-14T10:00:00Z',
    read: false,
  });
});

test('feed notifications preserve persisted notification categories and links', async () => {
  const fetchMock = stubFetch(async () => response({
    notifications: [{
      id: 'feed_notif_1',
      type: 'answer',
      content: 'answered your question',
      author: 'Live User',
      avatar: 'from-score-green to-score-amber',
      timeAgo: '2m ago',
      linkTo: '/feed/post/post_1',
      read: false,
    }],
  }));

  try {
    await expect(listFeedNotifications()).resolves.toEqual([
      expect.objectContaining({
        id: 'feed_notif_1',
        type: 'answer',
        linkTo: '/feed/post/post_1',
        read: false,
      }),
    ]);
  } finally {
    fetchMock.restore();
  }
});

test('feed notification normalizer tolerates partial live rows', () => {
  expect(normalizeFeedNotification({ content: 'Live update' })).toMatchObject({
    id: 'Live update',
    type: 'milestone',
    author: 'TechIT Platform',
    linkTo: '/feed',
    read: false,
  });
  expect(normalizeFeedNotification({ content: 'Legacy link', linkTo: '/post/post_2' }).linkTo)
    .toBe('/feed/post/post_2');
});

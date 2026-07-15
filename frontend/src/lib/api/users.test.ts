import { expect, test } from 'vitest';
import { setAuthTokenGetter } from './client';
import { connectWithUser, fetchCollaboratorDirectory, fetchPublicUserProfile } from './users';

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

test('public profile reads the authenticated BACKEND user endpoint', async () => {
  setAuthTokenGetter(() => 'jwt-users');
  const fetchMock = stubFetch(async () => response({
    id: 'user_1',
    name: 'Live User',
    role: 'founder',
    category: 'SaaS',
    stage: 'MVP',
    gsis: 72,
    location: 'Nigeria',
    joinedDate: '2026-01-01T00:00:00Z',
    email: null,
    bio: '',
    website: '',
    avatar: 'from-score-green to-score-amber',
    isOwnProfile: false,
    stats: { decay: 1, stageProgress: 100, posts: 2, answers: 1, connections: 0 },
    skills: [],
    recentActivity: [],
  }));

  try {
    const profile = await fetchPublicUserProfile('user_1');
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/users/user_1');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-users');
    expect(profile.name).toBe('Live User');
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test('connect action writes through the persisted BACKEND endpoint', async () => {
  const fetchMock = stubFetch(async () => response({ ok: true }));
  try {
    await connectWithUser('user_2');
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/users/user_2/connect');
    expect(init.method).toBe('POST');
  } finally {
    fetchMock.restore();
  }
});

test('collaborator directory reads safe authenticated user records without fallback rows', async () => {
  setAuthTokenGetter(() => 'jwt-directory');
  const fetchMock = stubFetch(async () => response({
    users: [{
      id: 'user_2',
      name: 'Live Builder',
      role: 'collaborator',
      title: 'Backend Engineer',
      headline: '',
      skills: ['Node.js'],
      weeklyHours: 20,
      timezone: 'UTC+1',
      location: 'Nigeria',
      avatarUrl: '',
      credibilityScore: 80,
      isVerified: true,
    }],
  }));
  try {
    const users = await fetchCollaboratorDirectory();
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/users?role=collaborator');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-directory');
    expect(users.map((user) => user.id)).toEqual(['user_2']);
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

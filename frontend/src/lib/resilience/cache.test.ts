import { beforeEach, expect, test } from 'vitest';
import { cacheSnapshot, readSnapshot } from './cache';
import { clearMemoryForTests } from './store';

beforeEach(() => clearMemoryForTests());

test('returns cached values with stale metadata', async () => {
  await cacheSnapshot('feed:test', { posts: ['one'] }, new Date(Date.now() - 1000).toISOString());
  await expect(readSnapshot<{ posts: string[] }>('feed:test')).resolves.toMatchObject({ value: { posts: ['one'] }, stale: true });
});

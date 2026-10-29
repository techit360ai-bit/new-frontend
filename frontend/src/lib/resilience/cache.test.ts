import { beforeEach, expect, test } from 'vitest';
import { cacheSnapshot, readSnapshot, setCacheScope } from './cache';
import { clearMemoryForTests } from './store';

beforeEach(() => { clearMemoryForTests(); setCacheScope(null); });

test('returns cached values with stale metadata', async () => {
  await cacheSnapshot('feed:test', { posts: ['one'] }, new Date(Date.now() - 1000).toISOString());
  await expect(readSnapshot<{ posts: string[] }>('feed:test')).resolves.toMatchObject({ value: { posts: ['one'] }, stale: true });
});

test('a second account cannot read the first account snapshot', async () => {
  setCacheScope('user-a');
  await cacheSnapshot('messaging:conversations', [{ id: 'c1' }]);
  await expect(readSnapshot('messaging:conversations')).resolves.toMatchObject({ value: [{ id: 'c1' }] });

  setCacheScope('user-b');
  await expect(readSnapshot('messaging:conversations')).resolves.toBeNull();
});

test('changing account purges the previous account snapshots', async () => {
  setCacheScope('user-a');
  await cacheSnapshot('feed:z', { posts: ['private'] });
  setCacheScope('user-b');
  await new Promise(resolve => setTimeout(resolve, 0));
  setCacheScope('user-a');
  await expect(readSnapshot('feed:z')).resolves.toBeNull();
});

import { afterEach, expect, test, vi } from 'vitest';
import { getRemoteRepositoryState, isCodeSyncPathSafe, pullRemoteFiles, pushToDestination } from './codeSync';

afterEach(() => vi.restoreAllMocks());

test('uses the existing MCP GitHub tools for state, pull, and push', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    const body = JSON.parse(String(init?.body || '{}'));
    const data = body.tool === 'get_repository_state'
      ? { repo: 'acme/app', branch: 'main', headSha: 'head-1', treeSha: 'tree-1', files: [] }
      : body.tool === 'read_file' ? 'file content'
        : { commitSha: 'head-2' };
    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  expect((await getRemoteRepositoryState('p1', 'acme/app', 'main')).headSha).toBe('head-1');
  expect((await pullRemoteFiles('p1', 'acme/app', 'main', ['src/a.ts'])).files[0].content).toBe('file content');
  expect((await pushToDestination({ projectId: 'p1', repo: 'acme/app', branch: 'main', expectedHeadSha: 'head-1', message: 'sync', files: [{ path: 'src/a.ts', content: 'x' }] })).ok).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

test('blocks secret-like paths from entering the editor synchronization flow', () => {
  expect(isCodeSyncPathSafe('src/app.ts')).toBe(true);
  expect(isCodeSyncPathSafe('.env.production')).toBe(false);
  expect(isCodeSyncPathSafe('config/service-credentials.json')).toBe(false);
  expect(isCodeSyncPathSafe('../outside.ts')).toBe(false);
});

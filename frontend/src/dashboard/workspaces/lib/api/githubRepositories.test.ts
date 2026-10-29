import { afterEach, expect, test, vi } from 'vitest';
import { techitApi } from '@/lib/techitApi';
import { discoverGithubRepositories } from './githubRepositories';

afterEach(() => vi.restoreAllMocks());

test('discovers real MCP repositories without a client-selected actor role', async () => {
  const invoke = vi.spyOn(techitApi, 'invoke').mockResolvedValue({ ok: true, data: [{ fullName: 'team/product' }, { fullName: 'team/product' }, { fullName: 'team/docs' }] });
  await expect(discoverGithubRepositories()).resolves.toEqual(['team/docs', 'team/product']);
  expect(invoke).toHaveBeenCalledWith('github', 'list_repositories', {});
});

test('distinguishes provider failure from a genuinely empty repository list', async () => {
  vi.spyOn(techitApi, 'invoke').mockResolvedValue({ ok: true, data: [] });
  await expect(discoverGithubRepositories()).resolves.toEqual([]);
  vi.mocked(techitApi.invoke).mockResolvedValue({ ok: false, error: { code: 'unavailable', error: 'Reconnect GitHub' } });
  await expect(discoverGithubRepositories()).rejects.toThrow('Reconnect GitHub');
});

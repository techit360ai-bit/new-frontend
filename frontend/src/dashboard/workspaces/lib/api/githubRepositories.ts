import { techitApi } from '@/lib/techitApi';

/** Read the connected account through the canonical GitHub MCP tool. */
export async function discoverGithubRepositories(): Promise<string[]> {
  const result = await techitApi.invoke('github', 'list_repositories', {});
  if (!result.ok) throw new Error(result.error.detail || result.error.error || 'Repository discovery is unavailable.');
  if (!Array.isArray(result.data)) throw new Error('Repository discovery returned an invalid response.');
  return [...new Set(result.data.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return [];
    const name = (entry as { fullName?: unknown }).fullName;
    return typeof name === 'string' && name.trim() ? [name.trim()] : [];
  }))].sort();
}

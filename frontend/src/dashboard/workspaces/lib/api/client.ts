import { domainGet, domainPost } from '@/lib/domainApi';
import { fetchWorkspaces } from '@/lib/api/workspaces';

let activeWorkspaceId: string | null | undefined;

export async function resolveWorkspaceId(): Promise<string | null> {
  if (activeWorkspaceId !== undefined) return activeWorkspaceId;
  const workspaces = await fetchWorkspaces();
  activeWorkspaceId = workspaces[0]?.id ?? null;
  return activeWorkspaceId;
}

export async function workspaceGet<T>(path: string): Promise<T | null> {
  const workspaceId = await resolveWorkspaceId();
  if (!workspaceId) return null;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return domainGet<T>(`/workspaces/${workspaceId}${clean}`);
}

export async function workspacePost<T>(path: string, body: unknown): Promise<T | null> {
  const workspaceId = await resolveWorkspaceId();
  if (!workspaceId) return null;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return domainPost<T>(`/workspaces/${workspaceId}${clean}`, body);
}

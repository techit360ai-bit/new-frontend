import { domainDelete, domainGet, domainPatch, domainPost } from '@/lib/domainApi';
import { fetchWorkspaces } from '@/lib/api/workspaces';

let activeWorkspaceId: string | null | undefined;

export function setActiveWorkspaceId(workspaceId: string | null) {
  activeWorkspaceId = workspaceId;
}

export async function resolveWorkspaceId(): Promise<string | null> {
  if (activeWorkspaceId !== undefined) return activeWorkspaceId;
  if (typeof window !== 'undefined') {
    const query = new URLSearchParams(window.location.search);
    const explicit = query.get('workspace');
    if (explicit) { activeWorkspaceId = explicit; return explicit; }
  }
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

export async function workspacePatch<T>(path: string, body: unknown): Promise<T | null> {
  const workspaceId = await resolveWorkspaceId();
  if (!workspaceId) return null;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return domainPatch<T>(`/workspaces/${workspaceId}${clean}`, body);
}

export async function workspaceDelete<T>(path: string, init?: RequestInit): Promise<T | null> {
  const workspaceId = await resolveWorkspaceId();
  if (!workspaceId) return null;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return domainDelete<T>(`/workspaces/${workspaceId}${clean}`, init);
}

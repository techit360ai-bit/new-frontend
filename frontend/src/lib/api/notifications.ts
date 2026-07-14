import { ApiError, getAuthToken } from './client';

const env =
  typeof import.meta !== 'undefined'
    ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {})
    : {};

const DEFAULT_TIMEOUT_MS = Number(env.VITE_API_TIMEOUT_MS ?? '30000') || 30_000;

const BACKEND_API_BASE_URL =
  (env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export type WorkspaceNotificationType = 'message' | 'mention' | 'pr' | 'build' | 'meeting' | 'system';

export interface WorkspaceNotification {
  id: string;
  type: WorkspaceNotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  linkTo?: string;
  createdAt?: string;
}

interface BackendNotification {
  id?: string;
  type?: string;
  read?: boolean;
  content?: string;
  author?: string;
  avatar?: string;
  timeAgo?: string;
  linkTo?: string;
  createdAt?: string;
}

function timeoutSignal(init?: RequestInit): AbortSignal {
  return init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
}

function notificationUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_API_BASE_URL}/notifications${clean === '/' ? '' : clean}`;
}

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return { ...h, ...(extra as Record<string, string>) };
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, data);
  }
  return data as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(notificationUrl(path), {
    method: 'GET',
    ...init,
    headers: headers(init?.headers),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

function classifyNotification(row: BackendNotification): WorkspaceNotificationType {
  const content = `${row.type ?? ''} ${row.content ?? ''}`.toLowerCase();
  if (/\bpr\b|pull request/.test(content)) return 'pr';
  if (/build|deploy|deployment/.test(content)) return 'build';
  if (/meeting|standup|sprint planning/.test(content)) return 'meeting';
  if (row.type === 'mention' || row.type === 'collab') return 'mention';
  if (row.type === 'comment' || row.type === 'answer') return 'message';
  return 'system';
}

export function normalizeNotification(row: BackendNotification): WorkspaceNotification {
  const message = String(row.content ?? '');
  return {
    id: String(row.id ?? (message || 'notification')),
    type: classifyNotification(row),
    title: String(row.author ?? 'TechIT Platform'),
    message,
    timestamp: String(row.timeAgo ?? row.createdAt ?? ''),
    read: Boolean(row.read),
    avatar: typeof row.avatar === 'string' ? row.avatar : undefined,
    linkTo: typeof row.linkTo === 'string' ? row.linkTo : undefined,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : undefined,
  };
}

export async function listNotifications(): Promise<WorkspaceNotification[]> {
  const data = await request<{ notifications?: BackendNotification[] }>('/');
  return (data.notifications ?? []).map(normalizeNotification);
}

export async function markNotificationRead(id: string): Promise<WorkspaceNotification> {
  const data = await request<BackendNotification>(`/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
  });
  return normalizeNotification(data);
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<{ ok: boolean }>('/read-all', {
    method: 'POST',
  });
}

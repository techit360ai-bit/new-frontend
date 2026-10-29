import { ApiError, getAuthToken } from './api/client';

const env =
  typeof import.meta !== 'undefined'
    ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {})
    : {};

const BASE = (env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const TIMEOUT_MS = Number(env.VITE_API_TIMEOUT_MS || '30000') || 30_000;

function url(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function request<T>(path: string, method: string, body?: unknown, timeoutMs = TIMEOUT_MS): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(url(path), {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new ApiError(response.status, `${response.status} ${response.statusText}`, data);
  return data as T;
}

export const platformGet = <T>(path: string) => request<T>(path, 'GET');
export const platformPost = <T>(path: string, body?: unknown, timeoutMs?: number) => request<T>(path, 'POST', body, timeoutMs);
export const platformPatch = <T>(path: string, body?: unknown) => request<T>(path, 'PATCH', body);
export const platformDelete = <T>(path: string, body?: unknown) => request<T>(path, 'DELETE', body);
export const platformApiOrigin = () => BASE.replace(/\/api$/, '');

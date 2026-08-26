import { ApiError, getAuthToken } from './client';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } });
  const text = await response.text(); const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new ApiError(response.status, `${response.status} ${response.statusText}`, body);
  return body as T;
}

export type MomentMetric = { key: string; label: string; value: number; source: string };
export type TechitMoment = {
  id: string; role: string; kind: string; title: string; subtitle: string; body: string;
  metrics: MomentMetric[]; publicSlug: string; publicUrl: string; status: 'pending' | 'published' | 'dismissed'; createdAt: string; generatedAt: string; shareCount: number;
};

export function getPendingMoment() { return request<{ ok: boolean; moment: TechitMoment | null }>('/moments/prompt'); }
export function dismissMoment(momentId: string) { return request<{ ok: boolean }>(`/moments/${encodeURIComponent(momentId)}/dismiss`, { method: 'POST', body: '{}' }); }
export function shareMoment(momentId: string, channel: string) {
  return request<{ ok: boolean; shareId: string; channel: string; publicUrl: string; shareText: string; channelUrl: string | null; workflow: 'native_share_or_copy' | 'direct_or_copy' }>(`/moments/${encodeURIComponent(momentId)}/share`, { method: 'POST', body: JSON.stringify({ channel }) });
}
export function getPublicMoment(slug: string) { return request<{ ok: boolean; moment: TechitMoment }>(`/moments/public/${encodeURIComponent(slug)}`); }
export function recordMomentVisit(slug: string, ref?: string | null, source?: string) {
  return request<{ ok: boolean; referralId: string }>(`/moments/public/${encodeURIComponent(slug)}/visit`, { method: 'POST', body: JSON.stringify({ ref, source }) });
}

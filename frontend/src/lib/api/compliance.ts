import { getAuthToken } from './client';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API}/compliance${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (!response.ok) throw new Error(`Compliance request failed (${response.status})`);
  return response.json() as Promise<T>;
}
export const exportMyData = () => request<Record<string, unknown>>('/export');
export const eraseMyData = () => request<Record<string, unknown>>('/erase', { method: 'DELETE' });
export const recordConsent = (body: Record<string, unknown>) => request('/consents', { method: 'POST', body: JSON.stringify(body) });
export const createDataRequest = (body: Record<string, unknown>) => request('/requests', { method: 'POST', body: JSON.stringify(body) });
export const fetchResidency = () => request<{ residency: { region?: string; internationalTransfers?: boolean } | null }>('/residency');
export const saveResidency = (body: Record<string, unknown>) => request('/residency', { method: 'PUT', body: JSON.stringify(body) });

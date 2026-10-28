import { ApiError, getAuthToken } from './client';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new ApiError(response.status, `${response.status} ${response.statusText}`, body);
  return body as T;
}

export type SupportCaseStatus = 'received' | 'triaging' | 'processing' | 'waiting_for_user' | 'escalated' | 'resolved' | 'closed' | 'reopened';
export interface SupportCase {
  id: string;
  caseNumber: string;
  category: string;
  subcategory?: string | null;
  subject: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: SupportCaseStatus;
  firstResponseDueAt: string;
  resolutionDueAt: string;
  createdAt: string;
  updatedAt: string;
}

export const listSupportCases = async () => (await request<{ cases: SupportCase[] }>('/support/cases')).cases;
export const createSupportCase = async (input: { category: string; subcategory?: string; subject: string; description: string }) =>
  (await request<{ case: SupportCase }>('/support/cases', { method: 'POST', body: JSON.stringify(input) })).case;
export const getSupportCase = (caseId: string) => request<{ case: SupportCase; messages: Array<{ id: string; senderType: string; message: string; createdAt: string }>; events: Array<Record<string, unknown>> }>(`/support/cases/${encodeURIComponent(caseId)}`);
export const replyToSupportCase = (caseId: string, message: string) => request(`/support/cases/${encodeURIComponent(caseId)}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
export const reopenSupportCase = (caseId: string) => request<{ case: SupportCase }>(`/support/cases/${encodeURIComponent(caseId)}/reopen`, { method: 'POST' });
export const submitSupportFeedback = (caseId: string, input: { rating: number; resolutionStatus?: string; comment?: string }) => request(`/support/cases/${encodeURIComponent(caseId)}/feedback`, { method: 'POST', body: JSON.stringify(input) });

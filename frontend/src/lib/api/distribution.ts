import { ApiError, getAuthToken } from './client'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const response = await fetch(`${API}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } })
  const text = await response.text(); const body = text ? JSON.parse(text) : null
  if (!response.ok) throw new ApiError(response.status, `${response.status} ${response.statusText}`, body)
  return body as T
}

export type DistributionObject = { id: string; sourceType: string; sourceId: string | null; title: string; description: string; preview: string; cta: string; destinationRoute: string; visibility: string; expiresAt: string | null; attributionId: string; campaignId: string | null; createdAt: string; metadata: Record<string, unknown> }
export type DistributionMetrics = { objects: number; publicObjects: number; shares: number; visits: number; signups: number; activated: number; converted: number; shareRate: number; activationRate: number; viralCoefficient: number; organicAcquisitionRate: number }

export const createDistribution = (input: Record<string, unknown>) => request<{ ok: boolean; object: DistributionObject }>('/distribution/create', { method: 'POST', body: JSON.stringify(input) })
export const getDistribution = (id: string) => request<{ ok: boolean; object: DistributionObject }>(`/distribution/public/${encodeURIComponent(id)}`)
export const clickDistribution = (id: string, source?: string) => request<{ ok: boolean; referralId: string; attributionId: string }>(`/distribution/public/${encodeURIComponent(id)}/click`, { method: 'POST', body: JSON.stringify({ source }) })
export const shareDistribution = (id: string, channel: string) => request<{ ok: boolean; shareId: string; attributionId: string }>(`/distribution/${encodeURIComponent(id)}/share`, { method: 'POST', body: JSON.stringify({ channel }) })
export const activateReferral = (referralId: string, activationAction = 'account_created') => request<{ ok: boolean; status: string }>(`/distribution/referrals/${encodeURIComponent(referralId)}/activate`, { method: 'POST', body: JSON.stringify({ activationAction }) })

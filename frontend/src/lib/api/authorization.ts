import { getAuthToken } from './client'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
// Read the tab-scoped in-memory token. The previous sessionStorage lookup
// returned null after WS-01 stopped writing `techit_access_token`, which left
// every capability/verification/MFA call unauthenticated.
const token = () => getAuthToken()
// Cookie-authenticated requests need the double-submit token (BACKEND csrf.js).
const csrf = () => { try { const part = document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith('techit_csrf=')); return part ? decodeURIComponent(part.slice('techit_csrf='.length)) : null } catch { return null } }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}/authorization${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(csrf() ? { 'X-CSRF-Token': csrf() as string } : {}), ...(options.headers || {}) } })
  const data = await response.json(); if (!response.ok) throw Object.assign(new Error(data.error || 'Authorization request failed'), { data }); return data
}
export type CapabilityDecision = { allowed: boolean; code: string; capability: string; assurance?: string; availableCredits?: number; funding?: string; metering?: string; policy?: { assurance?: string; mfaRequired?: boolean } }
export const checkCapability = (capability: string, role?: string) => request<CapabilityDecision>('/capabilities/check', { method: 'POST', body: JSON.stringify({ capability, context: { role } }), headers: typeof sessionStorage !== 'undefined' && sessionStorage.getItem('techit_mfa_assertion') ? { 'x-mfa-assertion': sessionStorage.getItem('techit_mfa_assertion')! } : {} })
export const getVerification = (role: string) => request<{ profile: Record<string, unknown> | null; evidence: Array<Record<string, unknown>>; requests: Array<Record<string, unknown>> }>(`/verification/status?role=${encodeURIComponent(role)}`)
export const requestVerification = (role: string, requestedCapability?: string) => request<{ request: { id: string } }>('/verification/request', { method: 'POST', body: JSON.stringify({ role, requestedCapability }) })
export const submitEvidence = (requestId: string, input: Record<string, unknown>) => request(`/verification/requests/${requestId}/evidence`, { method: 'POST', body: JSON.stringify(input) })
export const createEvidenceUpload = (requestId: string, input: { contentType: string; sizeBytes: number }) => request<{ object: { id: string }; uploadUrl: string; requiredHeaders: Record<string, string> }>(`/verification/requests/${requestId}/evidence/upload-url`, { method: 'POST', body: JSON.stringify(input) })
export const finalizeEvidenceUpload = (objectId: string) => request(`/verification/evidence/${objectId}/finalize`, { method: 'POST' })
export const enrollMfa = () => request<{ secret: string; otpauthUrl: string }>('/mfa/enroll', { method: 'POST' })
export const verifyMfa = async (code: string) => { const result = await request<{ assertion: string }>('/mfa/verify', { method: 'POST', body: JSON.stringify({ code, enable: true }) }); if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('techit_mfa_assertion', result.assertion); return result }

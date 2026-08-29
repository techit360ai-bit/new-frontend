import { apiGet, apiPost } from './client'
export type AuthSession = { sessions: Array<{ id: string; sessionIdentifier: string; deviceName?: string | null; platform?: string; browser?: string; ipAddress?: string; createdAt: string; lastActiveAt: string; expiresAt: string; current: boolean }> }
export const getActiveSessions = () => apiGet<AuthSession>('/auth/sessions')
export const revokeSession = (sessionId: string) => fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${sessionStorage.getItem('techit_access_token') || ''}` } })
export const revokeOtherSessions = () => apiPost('/auth/sessions/revoke-others')
export const revokeAllSessions = () => apiPost('/auth/sessions/revoke-all')

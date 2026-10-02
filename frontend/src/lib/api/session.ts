import { apiDelete, apiGet, apiPost } from './client'
export type AuthSession = { sessions: Array<{ id: string; sessionIdentifier: string; deviceName?: string | null; platform?: string; browser?: string; ipAddress?: string; createdAt: string; lastActiveAt: string; expiresAt: string; current: boolean }> }
export const getActiveSessions = () => apiGet<AuthSession>('/auth/sessions')
// Routed through the shared client so the request carries the in-memory bearer,
// the CSRF double-submit header and refresh-on-401. It also stops reading the
// `techit_access_token` sessionStorage key, which WS-01 removed as a writer.
// Errors resolve (not reject) so the caller's refetch behaves as before.
export const revokeSession = (sessionId: string) => apiDelete(`/auth/sessions/${encodeURIComponent(sessionId)}`).catch(() => undefined)
export const revokeOtherSessions = () => apiPost('/auth/sessions/revoke-others')
export const revokeAllSessions = () => apiPost('/auth/sessions/revoke-all')

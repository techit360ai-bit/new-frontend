import {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, type ReactNode,
} from 'react'
import { getAuthToken, refreshAccessToken } from '../lib/api/client'
import { persistAccessToken } from '../lib/authStorage'
import { setCacheScope } from '../lib/resilience/cache'

// ── Types ─────────────────────────────────────────────────────
export type Role = 'explorer' | 'founder' | 'collaborator' | 'investor' | 'organisation'

export interface RoleAssignment {
  role: Role
  roleAssignmentId: string
  status: string
  assurance?: string
  isPrimary?: boolean
}

export interface ActiveContext {
  id: string | null
  userId: string
  role: Role
  roleAssignmentId?: string | null
  organizationId?: string | null
  workspaceId?: string | null
  resourceType?: string | null
  resourceId?: string | null
  status?: string
  startedAt?: string | null
  lastActiveAt?: string | null
  updatedAt?: string | null
}

export interface Profile {
  id: string
  email: string
  firstName: string
  lastName: string
  username: string | null
  phone: string
  country: string
  countryCode: string
  avatarUrl: string | null
  bio: string | null
  role: Role
  activeRole?: Role
  secondaryRoles: Role[]
  roleProfiles?: Record<string, Record<string, unknown>>
  creditBalance: number
  credibilityScore: number
  isVerified: boolean
  isOnboarded: boolean
  startupStage: string | null
  industries: string[]
  experience: string | null
  skills: string[]
  weeklyHours: number | null
  riskTolerance: string | null
  investmentFocus: string[]
  ticketSize: string | null
  orgName: string | null
  orgType: string | null
  website: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  timezone: string | null
  title?: string | null
  twitterUrl?: string | null
  yearsBuilding?: number
  founderType?: string
  oneLiner?: string
  foundingYear?: number
  logoEmoji?: string
  currentTeamSize?: number
  openRoles?: string[]
  compensationOffered?: string
  equityRangeMin?: number
  equityRangeMax?: number
  launchStatus?: string
  users?: number
  revenueMonthly?: number
  fundingRaised?: number
  leadInvestor?: string
  nextMilestone?: string
  whyBuilding?: string
  winningIn3Years?: string
  unfairAdvantage?: string
  ownershipPhilosophy?: string
  yearsExperience?: number
  discipline?: string
  subSkills?: string[]
  techStack?: string[]
  earliestStart?: string
  commitmentStyle?: string
  equityPreference?: number
  minCashFloor?: number
  vestingComfort?: string
  certifications: Array<{
    id: string; name: string; issuer: string; verified: boolean; issued_at: string
  }>
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  country: string
  countryCode: string
  role: Role
  emailVerificationToken: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  roleAssignments: RoleAssignment[]
  activeContext: ActiveContext | null
  contextLoading: boolean
  refreshContext: () => Promise<void>
  switchContext: (input: { role: Role; organizationId?: string; workspaceId?: string; resourceType?: string; resourceId?: string }) => Promise<{ error: Error | null }>
  activateRole: (role: Role, profile?: Record<string, unknown>) => Promise<{ error: Error | null }>
}

// ── Storage helpers ───────────────────────────────────────────
const TOKEN_KEY = 'techit_access_token'
const USER_KEY  = 'techit_user'
const getStored = () => ({
  token: getAuthToken(),
  user: (() => { try { const u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : null } catch { return null } })(),
})
try { localStorage.removeItem('techit_token') } catch {}
// The access token is held in memory by the API client for the current tab and
// carried on the wire by the HttpOnly session cookie. It is never persisted to
// web storage, where DevTools or an injected script could read it.
const saveToken = persistAccessToken
const saveUser  = (u: User | null)   => u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY)

// Double-submit CSRF header (BACKEND src/middlewares/csrf.js). Every
// state-changing request must echo the non-HttpOnly techit_csrf cookie, even
// the pre-session auth calls: a lingering techit_access cookie from an earlier
// session otherwise makes the backend reject signup/signin with
// `csrf_token_invalid`.
function csrfHeader(): Record<string, string> {
  try {
    const cookie = document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith('techit_csrf='))
    if (cookie) return { 'X-CSRF-Token': decodeURIComponent(cookie.slice('techit_csrf='.length)) }
  } catch {}
  return {}
}

// ── API base URL ──────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const normalizeContextRole = (value: unknown): Role => String(value || '').toLowerCase() === 'organization' ? 'organisation' : (String(value || 'explorer') as Role)

async function apiFetch(path: string, opts: RequestInit = {}) {
  const { token } = getStored() 
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  try { const csrf = document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith('techit_csrf=')); if (csrf) headers['X-CSRF-Token'] = decodeURIComponent(csrf.slice('techit_csrf='.length)) } catch {}
  const request = async (token: string | null) => fetch(`${API}${path}`, { ...opts, credentials: 'include', headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers as Record<string, string> || {}) } })
  let res = await request(getAuthToken())
  // On a 401, rotate the session once and retry. The hardened cookie flow
  // returns no body token, so retry with whatever the client now holds (which
  // may be nothing when the HttpOnly cookie carries the session).
  if (res.status === 401 && path !== '/auth/refresh') { const token = await refreshAccessToken(); res = await request(token ?? getAuthToken()) }
  return res
}

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([])
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null)
  const [contextLoading, setContextLoading] = useState(false)
  const fetchingRef = useRef<string | null>(null)

  // ── fetchProfile ─────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchingRef.current === userId) return
    fetchingRef.current = userId
    try {
      const res = await apiFetch('/users/me')
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      setProfile(data as Profile)
    } catch (err) {
      console.warn('[Auth] fetchProfile failed:', (err as Error).message)
      setProfile(null)
    } finally {
      fetchingRef.current = null
      setLoading(false)
    }
  }, [])

  const fetchContext = useCallback(async () => {
    setContextLoading(true)
    try {
      const res = await apiFetch('/context/available')
      if (!res.ok) throw new Error('Failed to fetch contexts')
      const data = await res.json()
      setRoleAssignments(Array.isArray(data.contexts) ? data.contexts.map((item: RoleAssignment) => ({ ...item, role: normalizeContextRole(item.role) })) : [])
      setActiveContext(data.activeContext ? { ...data.activeContext, role: normalizeContextRole(data.activeContext.role) } : null)
    } catch {
      setRoleAssignments([])
      setActiveContext(null)
    } finally {
      setContextLoading(false)
    }
  }, [])

  // ── Bootstrap on mount ────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    const bootstrap = async () => {
      const { token, user: storedUser } = getStored()
      if (!mounted) return
      try {
        if (storedUser) setUser(storedUser)
        let res = await apiFetch('/auth/session')
        if (res.status === 401) { const refreshed = await refreshAccessToken(); if (refreshed) res = await apiFetch('/auth/session') }
        if (!res.ok) throw new Error('Session invalid')
        const { user: freshUser } = await res.json()
        setUser(freshUser)
        setCacheScope(freshUser.id)
        await fetchProfile(freshUser.id)
        await fetchContext()
      } catch {
        saveToken(null); saveUser(null)
        setCacheScope(null)
        setUser(null); setProfile(null); setRoleAssignments([]); setActiveContext(null)
        setLoading(false)
      }
    }
    bootstrap()

    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY || e.key === 'techit_auth_event') {
        const { token, user: u } = getStored()
        setUser(u)
        if (e.key === 'techit_auth_event' && !token) { setCacheScope(null); setProfile(null); setRoleAssignments([]); setActiveContext(null); setLoading(false); return }
        if (token && u) fetchProfile(u.id)
        else { setProfile(null); setLoading(false) }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => { mounted = false; window.removeEventListener('storage', onStorage) }
  }, [fetchContext, fetchProfile])

  // ── signUp ────────────────────────────────────────────────────
  const signUp = async (data: SignUpData): Promise<{ error: Error | null }> => {
    try {
      const referralId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('referralId') : null
      const res = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-TechIT-Client': 'web', ...csrfHeader() },
        body: JSON.stringify(referralId ? { ...data, referralId } : data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Signup failed')
      return await signIn(data.email, data.password)
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Signup failed') }
    }
  }

  // ── signIn ────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const res = await fetch(`${API}/auth/signin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-TechIT-Client': 'web', ...csrfHeader() },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Sign in failed')

      const { token, user: u, profile: p } = json
      saveToken(token ?? null)
      saveUser(u)
      setCacheScope(u?.id ?? null)
      setUser(u)
      setProfile(p)
      await fetchContext()
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Sign in failed') }
    }
  }

  // ── signOut ───────────────────────────────────────────────────
  const signOut = async () => {
    try { await apiFetch('/auth/signout', { method: 'POST' }) } catch {}
    saveToken(null); saveUser(null); localStorage.setItem('techit_auth_event', JSON.stringify({ type: 'logout', at: Date.now() }))
    setCacheScope(null)
    setUser(null); setProfile(null); setRoleAssignments([]); setActiveContext(null)
  }

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ error: Error | null }> => {
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Password update failed')
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Password update failed') }
    }
  }

  // ── updateProfile ─────────────────────────────────────────────
  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') }
    try {
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Update failed')
      setProfile(prev => prev ? { ...prev, ...json } : json)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Update failed') }
    }
  }

  // ── refreshProfile ────────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!user) return
    fetchingRef.current = null
    await fetchProfile(user.id)
  }, [user, fetchProfile])

  const refreshContext = useCallback(async () => {
    if (user) await fetchContext()
  }, [user, fetchContext])

  const switchContext = useCallback(async (input: { role: Role; organizationId?: string; workspaceId?: string; resourceType?: string; resourceId?: string }) => {
    try {
      const res = await apiFetch('/context/switch', { method: 'POST', body: JSON.stringify(input) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Context switch failed')
      setActiveContext(data.activeContext ? { ...data.activeContext, role: normalizeContextRole(data.activeContext.role) } : null)
      if (Array.isArray(data.availableContexts)) setRoleAssignments(data.availableContexts.map((item: RoleAssignment) => ({ ...item, role: normalizeContextRole(item.role) })))
      setProfile(prev => prev ? { ...prev, activeRole: input.role } : prev)
      const refreshed = await refreshAccessToken()
      if (refreshed) saveToken(refreshed)
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Context switch failed') }
    }
  }, [])

  const activateRole = useCallback(async (role: Role, roleProfile: Record<string, unknown> = {}) => {
    try {
      const res = await apiFetch('/authorization/roles/activate', { method: 'POST', body: JSON.stringify({ role, profile: roleProfile }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Role activation failed')
      await fetchContext()
      return { error: null }
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Role activation failed') }
    }
  }, [fetchContext])

  useEffect(() => {
    const role = activeContext?.role || profile?.activeRole || profile?.role || 'explorer'
    document.documentElement.dataset.techitRole = role
  }, [activeContext?.role, profile?.activeRole, profile?.role])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, changePassword, updateProfile, refreshProfile, roleAssignments, activeContext, contextLoading, refreshContext, switchContext, activateRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

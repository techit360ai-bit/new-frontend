import { getAuthToken } from './client'

const CORE_API = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')

export type RecommendationEntityType = 'person' | 'startup' | 'project' | 'opportunity' | 'idea' | 'organization' | 'content' | 'notification'

export interface RecommendationAction {
  id: string
  label: string
  href: string
}

export interface RecommendationEntity {
  entityId: string
  type: RecommendationEntityType
  role?: string
  title: string
  subtitle?: string
  description?: string
  skills?: string[]
  industries?: string[]
  geography?: string
  stage?: string
  gsis?: number
  url: string
  actions: RecommendationAction[]
}

export interface DiscoveryRecommendation {
  id: string
  entityType: RecommendationEntityType
  entityId: string
  score: number
  rank?: number
  reasonType: string
  reasonText: string
  entity: RecommendationEntity
  importance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category?: string
  seen?: boolean
}

export interface RecommendationResponse {
  recommendations: DiscoveryRecommendation[]
  meta: {
    role?: string
    surface?: string
    totalCandidates?: number
    returned?: number
    configVersion?: string
    coldStart?: boolean
  }
}

export interface ReturnSummary {
  available: boolean
  state: string
  headline?: string
  message?: string
  anchor?: string
  hoursAway?: number
  categories: Array<{ name: string; count: number }>
  items: DiscoveryRecommendation[]
  completed?: boolean
}

export interface DiscoverySearchResult extends RecommendationEntity {
  lexicalScore: number
  personalizedScore: number
  semanticScore?: number
  score: number
}

function token() {
  return getAuthToken()
}

async function coreRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const authToken = token()
  const response = await fetch(`${CORE_API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || `Discovery request failed (${response.status})`)
  return body as T
}

export function listRecommendations(options: { surface?: string; type?: string; limit?: number } = {}) {
  const params = new URLSearchParams()
  if (options.surface) params.set('surface', options.surface)
  if (options.type) params.set('type', options.type)
  if (options.limit) params.set('limit', String(options.limit))
  return coreRequest<RecommendationResponse>(`/discovery/recommendations?${params.toString()}`)
}

export function getReturnSummary() {
  return coreRequest<ReturnSummary>('/discovery/return-summary')
}

export function searchDiscovery(query: string, options: { type?: string; limit?: number; personalized?: boolean } = {}) {
  const params = new URLSearchParams({ q: query })
  if (options.type) params.set('type', options.type)
  if (options.limit) params.set('limit', String(options.limit))
  if (options.personalized !== undefined) params.set('personalized', String(options.personalized))
  return coreRequest<{ results: DiscoverySearchResult[]; meta: { query: string; total: number; personalized: boolean; completeDatasetAvailable: boolean } }>(`/discovery/search?${params.toString()}`)
}

export function syncRecommendationProfile(profile: Record<string, unknown>) {
  return coreRequest<{ profile: Record<string, unknown> }>('/discovery/profile', { method: 'PUT', body: JSON.stringify(profile) })
}

export function recordDiscoveryActivity(eventType: string, surface: string) {
  return coreRequest<{ state: Record<string, unknown> }>('/discovery/activity', { method: 'POST', body: JSON.stringify({ eventType, surface }) })
}

export function recordRecommendationExposure(id: string, exposureType = 'impression', surface = 'feed') {
  return coreRequest(`/discovery/recommendations/${encodeURIComponent(id)}/exposure`, { method: 'POST', body: JSON.stringify({ exposureType, surface }) })
}

export function sendRecommendationFeedback(id: string, type: 'not_interested' | 'hide' | 'dismiss' | 'dont_recommend_type' | 'mute' | 'report' | 'undo') {
  return coreRequest(`/discovery/recommendations/${encodeURIComponent(id)}/feedback`, { method: 'POST', body: JSON.stringify({ type }) })
}

export function markCatchUpItem(id: string, action: 'seen' | 'dismissed' = 'seen') {
  return coreRequest(`/discovery/catch-up/${encodeURIComponent(id)}/seen`, { method: 'POST', body: JSON.stringify({ action }) })
}

export function completeCatchUp() {
  return coreRequest<{ completed: boolean; completedAt: string }>('/discovery/catch-up/complete', { method: 'POST', body: '{}' })
}

import { apiGet } from './client'

export interface RecommendationRow { rank: number; score: number; reasons: string[]; [key: string]: unknown }
export interface CollaboratorRecommendationResponse { recommendations: RecommendationRow[]; context?: Record<string, unknown> }
export interface OrganizationTalentRecommendationResponse { organizationId: string; needs: Record<string, unknown>; recommendations: RecommendationRow[] }
export interface MentorRecommendationResponse { mentorId: string; capacity: Record<string, unknown>; recommendations: RecommendationRow[] }
export interface InvestorThesisRecommendationResponse { investorId: string; thesis: Record<string, unknown>; recommendations: RecommendationRow[] }

export function fetchCollaboratorRecommendations(params: Record<string, string | number | undefined> = {}) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return apiGet<CollaboratorRecommendationResponse>(`/recommendation-intelligence/collaborators?${query}`) }
export function fetchFounderCollaboratorRecommendations(projectId: string, params: Record<string, string | number | undefined> = {}) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return apiGet<CollaboratorRecommendationResponse>(`/recommendation-intelligence/founders/${encodeURIComponent(projectId)}/collaborators?${query}`) }
export function fetchOrganizationTalentRecommendations(params: Record<string, string | number | undefined> = {}) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return apiGet<OrganizationTalentRecommendationResponse>(`/recommendation-intelligence/organization/talent?${query}`) }
export function fetchMentorRecommendations(params: Record<string, string | number | undefined> = {}) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return apiGet<MentorRecommendationResponse>(`/recommendation-intelligence/mentors?${query}`) }
export function fetchInvestorThesisRecommendations(params: Record<string, string | number | undefined> = {}) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return apiGet<InvestorThesisRecommendationResponse>(`/recommendation-intelligence/investors/thesis?${query}`) }

export interface DailyIntelligence { ok: boolean; intelligence: { role: string; date: string; asOf: string; cadence: string; stage: string | null; progress: unknown; risks: unknown[]; opportunities: unknown[]; recommendations: unknown[]; deterministic: boolean } }
export function fetchDailyIntelligence(params: Record<string, string | undefined> = {}) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return apiGet<DailyIntelligence>(`/intelligence/daily?${query}`) }

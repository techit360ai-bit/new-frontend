import { apiGet, apiPatch, apiPost, apiPut } from './client'
import type {
  CofounderActivity,
  CofounderCapabilities,
  CofounderDecision,
  CofounderEvidence,
  CofounderHealth,
  CofounderModeResponse,
  CofounderObjective,
  CofounderRecommendationsResponse,
  CofounderRelationship,
  CofounderRequirement,
  CofounderResponsibility,
} from '@/dashboard/_shared/cofounder/types'

const BASE = '/cofounder'

const env = typeof import.meta !== 'undefined'
  ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {})
  : {}

export function cofounderFrontendEnabled(): boolean {
  return String(env.VITE_COFOUNDER_MODE_ENABLED ?? 'false').toLowerCase() === 'true'
}

function query(params: Record<string, string | number | boolean | undefined> = {}): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export function fetchCofounderCapabilities(): Promise<CofounderCapabilities> {
  return apiGet(`${BASE}/capabilities`)
}

export function fetchCofounderMode(ventureId: string): Promise<CofounderModeResponse> {
  return apiGet(`${BASE}/ventures/${encodeURIComponent(ventureId)}/mode`)
}

export function fetchCofounderRequirements(ventureId: string): Promise<{ ok: boolean; requirement: CofounderRequirement | null }> {
  return apiGet(`${BASE}/ventures/${encodeURIComponent(ventureId)}/requirements`)
}

export function saveCofounderRequirements(ventureId: string, body: Record<string, unknown>): Promise<{ ok: boolean; requirement: CofounderRequirement }> {
  return apiPut(`${BASE}/ventures/${encodeURIComponent(ventureId)}/requirements`, body)
}

export function fetchCofounderRecommendations(
  projectId: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<CofounderRecommendationsResponse> {
  return apiGet(
    `/recommendation-intelligence/founders/${encodeURIComponent(projectId)}/collaborators${query({
      relationshipType: 'co_founder',
      ...params,
    })}`,
  )
}

export function createCofounderInvitation(body: Record<string, unknown>): Promise<{ ok: boolean; relationship: CofounderRelationship; idempotent?: boolean }> {
  return apiPost(`${BASE}/invitations`, body)
}

export function fetchCofounderInvitations(params: Record<string, string | number | boolean | undefined> = {}): Promise<{ ok: boolean; invitations: CofounderRelationship[] }> {
  return apiGet(`${BASE}/invitations${query(params)}`)
}

export function fetchCofounderInvitation(relationshipId: string): Promise<{ ok: boolean; invitation: CofounderRelationship }> {
  return apiGet(`${BASE}/invitations/${encodeURIComponent(relationshipId)}`)
}

export function acceptCofounderDiscussion(relationshipId: string): Promise<{ ok: boolean; relationship: CofounderRelationship }> {
  return apiPost(`${BASE}/invitations/${encodeURIComponent(relationshipId)}/accept-discussion`)
}

export function requestCofounderChanges(relationshipId: string, requestedChanges: string): Promise<{ ok: boolean; relationship: CofounderRelationship }> {
  return apiPost(`${BASE}/invitations/${encodeURIComponent(relationshipId)}/request-changes`, { requestedChanges })
}

export function declineCofounderInvitation(relationshipId: string, reason?: string): Promise<{ ok: boolean; relationship: CofounderRelationship }> {
  return apiPost(`${BASE}/invitations/${encodeURIComponent(relationshipId)}/decline`, { reason })
}

export function withdrawCofounderInvitation(relationshipId: string, reason?: string): Promise<{ ok: boolean; relationship: CofounderRelationship }> {
  return apiPost(`${BASE}/invitations/${encodeURIComponent(relationshipId)}/withdraw`, { reason })
}

export function advanceCofounderRelationship(relationshipId: string, body: Record<string, unknown>): Promise<{ ok: boolean; relationship: CofounderRelationship }> {
  return apiPost(`${BASE}/invitations/${encodeURIComponent(relationshipId)}/advance`, body)
}

export function acceptCofounderProposal(relationshipId: string, body: Record<string, unknown> = {}): Promise<{ ok: boolean; relationship: CofounderRelationship; idempotent?: boolean }> {
  return apiPost(`${BASE}/invitations/${encodeURIComponent(relationshipId)}/accept-proposal`, body, {
    headers: { 'Idempotency-Key': String(body.idempotencyKey ?? `cofounder-accept-${relationshipId}`) },
  })
}

export function fetchCofounderRelationships(params: Record<string, string | number | boolean | undefined> = {}): Promise<{ ok: boolean; relationships: CofounderRelationship[] }> {
  return apiGet(`${BASE}/relationships${query(params)}`)
}

export function fetchCofounderRelationship(relationshipId: string): Promise<{ ok: boolean; relationship: CofounderRelationship }> {
  return apiGet(`${BASE}/relationships/${encodeURIComponent(relationshipId)}`)
}

export function fetchCofounderWorkspace(relationshipId: string): Promise<{ ok: boolean; relationship: CofounderRelationship; workspace: Record<string, unknown> }> {
  return apiGet(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/workspace`)
}

export function pauseCofounderRelationship(relationshipId: string): Promise<{ ok: boolean; relationship: CofounderRelationship }> {
  return apiPost(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/pause`)
}

export function resumeCofounderRelationship(relationshipId: string): Promise<{ ok: boolean; relationship: CofounderRelationship }> {
  return apiPost(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/resume`)
}

export function endCofounderRelationship(relationshipId: string, reason?: string): Promise<{ ok: boolean; relationship: CofounderRelationship }> {
  return apiPost(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/end`, { reason })
}

export function fetchCofounderResponsibilities(relationshipId: string): Promise<{ ok: boolean; responsibilities: CofounderResponsibility[] }> {
  return apiGet(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/responsibilities`)
}

export function createCofounderResponsibility(relationshipId: string, body: Record<string, unknown>): Promise<{ ok: boolean; responsibility: CofounderResponsibility }> {
  return apiPost(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/responsibilities`, body)
}

export function patchCofounderResponsibility(responsibilityId: string, body: Record<string, unknown>): Promise<{ ok: boolean; responsibility: CofounderResponsibility }> {
  return apiPatch(`${BASE}/responsibilities/${encodeURIComponent(responsibilityId)}`, body)
}

export function fetchCofounderObjectives(relationshipId: string): Promise<{ ok: boolean; objectives: CofounderObjective[] }> {
  return apiGet(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/objectives`)
}

export function createCofounderObjective(relationshipId: string, body: Record<string, unknown>): Promise<{ ok: boolean; objective: CofounderObjective }> {
  return apiPost(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/objectives`, body)
}

export function patchCofounderObjective(objectiveId: string, body: Record<string, unknown>): Promise<{ ok: boolean; objective: CofounderObjective }> {
  return apiPatch(`${BASE}/objectives/${encodeURIComponent(objectiveId)}`, body)
}

export function fetchCofounderDecisions(relationshipId: string): Promise<{ ok: boolean; decisions: CofounderDecision[] }> {
  return apiGet(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/decisions`)
}

export function createCofounderDecision(relationshipId: string, body: Record<string, unknown>): Promise<{ ok: boolean; decision: CofounderDecision }> {
  return apiPost(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/decisions`, body)
}

export function respondToCofounderDecision(decisionId: string, response: string, reason?: string): Promise<{ ok: boolean; decision: CofounderDecision }> {
  return apiPost(`${BASE}/decisions/${encodeURIComponent(decisionId)}/respond`, { response, reason })
}

export function fetchCofounderActivity(relationshipId: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<{ ok: boolean; activity: CofounderActivity[] }> {
  return apiGet(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/activity${query(params)}`)
}

export function fetchCofounderHealth(relationshipId: string): Promise<{ ok: boolean; health: CofounderHealth }> {
  return apiGet(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/health`)
}

export function fetchCofounderEvidence(relationshipId: string): Promise<CofounderEvidence> {
  return apiGet(`${BASE}/relationships/${encodeURIComponent(relationshipId)}/evidence`)
}

export function publishCofounderInvestorSummary(ventureId: string, payload: Record<string, unknown>): Promise<{ ok: boolean; summary: Record<string, unknown> }> {
  return apiPut(`${BASE}/ventures/${encodeURIComponent(ventureId)}/investor-team-summary`, { payload })
}

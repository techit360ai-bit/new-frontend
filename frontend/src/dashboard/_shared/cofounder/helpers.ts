import type {
  CofounderRecommendation,
  CofounderRelationship,
  CofounderStatus,
} from './types'

export const PRE_ACTIVE_COFOUNDER_STATUSES: CofounderStatus[] = [
  'INVITED',
  'DISCUSSION',
  'MUTUAL_INTEREST',
  'DUE_DILIGENCE',
  'COFOUNDER_PROPOSAL',
  'ACCEPTED',
]

export const CLOSED_COFOUNDER_STATUSES: CofounderStatus[] = [
  'DECLINED',
  'WITHDRAWN',
  'ENDED',
]

const STATUS_LABELS: Record<CofounderStatus, string> = {
  INVITED: 'Invitation sent',
  DISCUSSION: 'In discussion',
  MUTUAL_INTEREST: 'Mutual interest',
  DUE_DILIGENCE: 'Due diligence',
  COFOUNDER_PROPOSAL: 'Proposal ready',
  ACCEPTED: 'Proposal accepted',
  ACTIVE: 'Active',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn',
  PAUSED: 'Paused',
  ENDED: 'Ended',
}

const STATUS_STYLES: Record<CofounderStatus, string> = {
  INVITED: 'border-status-info bg-status-info-soft text-brand-accent',
  DISCUSSION: 'border-status-info bg-status-info-soft text-brand-accent',
  MUTUAL_INTEREST: 'border-violet-300 bg-violet-50 text-violet-700',
  DUE_DILIGENCE: 'border-amber-300 bg-amber-50 text-amber-700',
  COFOUNDER_PROPOSAL: 'border-violet-300 bg-violet-50 text-violet-700',
  ACCEPTED: 'border-status-success bg-status-success-soft text-status-success',
  ACTIVE: 'border-status-success bg-status-success-soft text-status-success',
  DECLINED: 'border-border-default bg-surface-secondary text-text-muted',
  WITHDRAWN: 'border-border-default bg-surface-secondary text-text-muted',
  PAUSED: 'border-status-warning bg-status-warning-soft text-status-warning',
  ENDED: 'border-status-error bg-status-error-soft text-status-error',
}

const DIMENSION_LABELS: Record<string, string> = {
  capabilityFit: 'Capability fit',
  skillComplementarity: 'Skill complementarity',
  ventureStageFit: 'Venture-stage fit',
  commitmentCompatibility: 'Commitment compatibility',
  experience: 'Experience',
  visionAlignment: 'Vision alignment',
  workingStyleCompatibility: 'Working-style compatibility',
  riskCompatibility: 'Risk compatibility',
  geographicTimeCompatibility: 'Geographic / time compatibility',
  executionReputation: 'Execution reputation',
  trustVerification: 'Trust and verification',
  industryDomainFit: 'Industry / domain fit',
}

export function cofounderStatusLabel(status: CofounderStatus | string): string {
  return STATUS_LABELS[status as CofounderStatus] || String(status || 'Unknown').replaceAll('_', ' ')
}

export function cofounderStatusStyle(status: CofounderStatus | string): string {
  return STATUS_STYLES[status as CofounderStatus] || STATUS_STYLES.INVITED
}

export function isPreActiveCofounder(status: CofounderStatus | string): boolean {
  return PRE_ACTIVE_COFOUNDER_STATUSES.includes(status as CofounderStatus)
}

export function isClosedCofounder(status: CofounderStatus | string): boolean {
  return CLOSED_COFOUNDER_STATUSES.includes(status as CofounderStatus)
}

export function cofounderRelationshipLink(relationship: CofounderRelationship): string {
  if (relationship.status === 'ACTIVE') return `/workspaces/cofounder/${relationship.id}`
  return `/cofounder-invitations/${relationship.id}`
}

export function cofounderModeVisible(enabled: boolean, mode: { active?: boolean } | null): boolean {
  return Boolean(enabled && mode?.active)
}

export function cofounderRelationshipSurface(relationship: CofounderRelationship | null): 'hidden' | 'invitation' | 'workspace' | 'paused' | 'closed' {
  if (!relationship) return 'hidden'
  if (relationship.status === 'ACTIVE') return 'workspace'
  if (relationship.status === 'PAUSED') return 'paused'
  if (isClosedCofounder(relationship.status)) return 'closed'
  if (isPreActiveCofounder(relationship.status)) return 'invitation'
  return 'hidden'
}

export function dimensionLabel(dimension: string): string {
  return DIMENSION_LABELS[dimension] || dimension.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
}

export interface CofounderComparisonCell {
  value: number | null
  confidence: number
  missingEvidence?: string
}

export interface CofounderComparisonRow {
  dimension: string
  label: string
  weight: number
  values: Record<string, CofounderComparisonCell>
}

export function buildCofounderComparison(
  recommendations: CofounderRecommendation[],
  candidateIds: string[] = [],
): CofounderComparisonRow[] {
  const selected = candidateIds.length
    ? recommendations.filter((row) => candidateIds.includes(row.candidate.id))
    : recommendations
  const dimensions = new Map<string, CofounderComparisonRow>()
  for (const recommendation of selected) {
    for (const [dimension, value] of Object.entries(recommendation.breakdown || {})) {
      const row = dimensions.get(dimension) || {
        dimension,
        label: dimensionLabel(dimension),
        weight: value.weight,
        values: {},
      }
      row.weight = value.weight
      row.values[recommendation.candidate.id] = {
        value: value.value,
        confidence: value.confidence,
        ...(value.missingEvidence ? { missingEvidence: value.missingEvidence } : {}),
      }
      dimensions.set(dimension, row)
    }
  }
  return [...dimensions.values()].sort((left, right) => right.weight - left.weight)
}

export function formatCommitment(commitment: Record<string, unknown>): string {
  const type = String(commitment.type || '').replaceAll('_', ' ')
  const hours = Number(commitment.hoursPerWeek)
  if (type && Number.isFinite(hours) && hours > 0) return `${type} · ${hours}h/week`
  if (type) return type
  if (Number.isFinite(hours) && hours > 0) return `${hours}h/week`
  return 'Not specified'
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

export function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function readableValue(value: unknown): string {
  if (value == null || value === '') return 'Not recorded'
  if (Array.isArray(value)) return value.length ? value.map(readableValue).join(', ') : 'None'
  if (typeof value === 'object') {
    const record = recordValue(value)
    const entries = Object.entries(record).filter(([, item]) => item != null && item !== '')
    return entries.length ? entries.map(([key, item]) => `${key.replaceAll('_', ' ')}: ${readableValue(item)}`).join(' · ') : 'None'
  }
  return String(value)
}

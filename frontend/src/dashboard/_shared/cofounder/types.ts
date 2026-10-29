export type CofounderStatus =
  | 'INVITED'
  | 'DISCUSSION'
  | 'MUTUAL_INTEREST'
  | 'DUE_DILIGENCE'
  | 'COFOUNDER_PROPOSAL'
  | 'ACCEPTED'
  | 'ACTIVE'
  | 'DECLINED'
  | 'WITHDRAWN'
  | 'PAUSED'
  | 'ENDED'

export type CofounderVisibility = 'SHARED' | 'PERSONAL' | 'RESTRICTED'

export interface CofounderParty {
  id: string
  name: string
  title: string
  avatarUrl: string
  role: 'founder' | 'cofounder' | string
}

export interface CofounderRelationship {
  id: string
  status: CofounderStatus
  role: 'founder' | 'cofounder'
  ventureId: string
  roleTitle: string
  responsibilities: string
  commitment: Record<string, unknown>
  initialPeriodMonths: number | null
  equityDiscussionStatus: string
  workspaceId: string | null
  otherParty: CofounderParty
  invitedAt: string | null
  discussionAcceptedAt: string | null
  acceptedAt: string | null
  activatedAt: string | null
  pausedAt: string | null
  endedAt: string | null
  endReason: string | null
  version: number
  permissions: string[]
  proposedTerms?: Record<string, unknown> | null
  revisions?: number
  requestedChanges?: Array<{ requestedBy: string; changes: string; createdAt: string }>
  mutualInterest?: Record<string, unknown>
  summary?: {
    responsibilityCompletion: { completed: number; total: number } | null
    sharedObjectives: { active: number; progress: number | null }
    openDecisions: number
    recentActivity: CofounderActivity[]
  }
}

export interface CofounderModeResponse {
  ok: boolean
  projectId: string
  active: boolean
  relationships: CofounderRelationship[]
  team: Array<{
    relationshipId: string
    userId: string
    name: string
    title: string
    role: string
    avatarUrl: string
  }>
}

export interface CofounderCapabilities {
  ok: boolean
  enabled: boolean
  permissions: string[]
  visibilityLayers: CofounderVisibility[]
  healthPolicyVersion: string
}

export interface CofounderRequirement {
  id: string
  projectId: string
  ventureId: string
  founderId: string
  relationshipType: 'co_founder'
  roleType: string
  roleTitle: string
  responsibilities: string
  requiredSkills: string[]
  experience: Record<string, unknown>
  commitment: { type: string | null; hoursPerWeek: number | null }
  ventureStage: string | null
  compatibility: Record<string, unknown>
  status: string
  policyVersion: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface CofounderDimension {
  value: number | null
  weight: number
  confidence: number
  evidence: Record<string, unknown>
  missingEvidence?: string
}

export interface CofounderRecommendation {
  rank: number
  candidate: {
    id: string
    name: string
    title: string
    avatarUrl: string
    country: string
    timezone: string
  }
  collaborator: {
    id: string
    name: string
    title: string
    skills: string[]
    country: string
  }
  score: number
  cofounderFit: number | null
  confidence: number
  label: string
  breakdown: Record<string, CofounderDimension>
  strengths: Array<{ dimension: string; label: string; score: number }>
  concerns: Array<{ dimension: string; label: string; score: number; reason: string }>
  missingEvidence: Array<{ dimension: string; label: string; reason: string }>
  claimed: {
    title: string
    skills: string[]
    industries: string[]
    experienceYears: number | null
    availabilityHours: number | null
  }
  verified: {
    trustScore: number | null
    tier: string | null
    verifiedSkills: Array<Record<string, unknown>>
    proofs: Array<Record<string, unknown>>
  }
  observed: {
    executionScore: number | null
    deliveryReliability: number | null
    completedTasks: number
  }
  reasons: string[]
  deterministic: boolean
  policyVersion: string
}

export interface CofounderRecommendationsResponse {
  ok: boolean
  type: 'cofounder'
  relationshipType: 'co_founder'
  projectId: string
  requirementId: string
  requirementVersion: number
  context: Record<string, unknown>
  policy: { version: string; weights: Record<string, number> }
  recommendations: CofounderRecommendation[]
  recommendedCandidate: {
    id: string
    name: string
    score: number | null
    confidence: number
    explanation: string
    missingEvidence: Array<{ dimension: string; label: string; reason: string }>
  } | null
  meta: Record<string, unknown>
}

export interface CofounderResponsibility {
  id: string
  relationshipId: string
  ventureId: string
  ownerId: string
  ownerRole: string | null
  title: string
  description: string
  areas: string[]
  status: string
  visibilityLayer: CofounderVisibility
  linkedObjectiveIds: string[]
  linkedTaskIds: string[]
  evidenceIds: string[]
  version: number
  createdAt: string
  updatedAt: string
}

export interface CofounderObjective {
  id: string
  relationshipId: string
  ventureId: string
  title: string
  description: string
  kind: string
  ownerId: string | null
  coOwnerIds: string[]
  responsibilityId: string | null
  dueDate: string | null
  progress: number
  progressSource: string
  progressEvidenceCount: number
  status: string
  visibilityLayer: CofounderVisibility
  linkedTaskIds: string[]
  milestoneIds: string[]
  evidenceIds: string[]
  publishedMilestoneId: string | null
  completedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CofounderDecision {
  id: string
  relationshipId: string
  ventureId: string
  title: string
  description: string
  proposedBy: string
  status: 'open' | 'discussion_requested' | 'approved' | 'rejected' | 'withdrawn' | string
  responses: Array<{ userId: string; response: string; reason: string; respondedAt: string }>
  deadline: string | null
  resolvedAt: string | null
  resolutionReason: string
  visibilityLayer: CofounderVisibility
  version: number
  createdAt: string
  updatedAt: string
}

export interface CofounderActivity {
  id: string
  relationshipId: string
  ventureId: string
  actorId: string
  actorRole: string | null
  visibilityLayer: CofounderVisibility
  type: string
  summary: string
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface CofounderHealthMetric {
  value: number | null
  confidence: number
  evidence: Record<string, unknown>
}

export interface CofounderHealth {
  overall: number | null
  confidence: number
  band: 'healthy' | 'watch' | 'attention' | 'insufficient_evidence' | string
  metrics: Record<string, CofounderHealthMetric>
  observations: string[]
  policyVersion: string
}

export interface CofounderEvidenceParty {
  userId: string
  role: string
  claimed: Record<string, unknown>
  verified: Record<string, unknown>
  observed: Record<string, unknown>
}

export interface CofounderEvidence {
  ok: boolean
  relationshipId: string
  policyVersion: string
  parties: CofounderEvidenceParty[]
  separation: Record<string, string>
}

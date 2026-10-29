import { describe, expect, it } from 'vitest'
import {
  buildCofounderComparison,
  cofounderModeVisible,
  cofounderRelationshipSurface,
  dimensionLabel,
} from './helpers'
import type {
  CofounderDimension,
  CofounderRecommendation,
  CofounderRelationship,
  CofounderStatus,
} from './types'

function relationship(status: CofounderStatus): CofounderRelationship {
  return {
    id: 'relationship-1',
    status,
    role: 'founder',
    ventureId: 'venture-1',
    roleTitle: 'Technical co-founder',
    responsibilities: 'Own engineering delivery.',
    commitment: { type: 'full_time', hoursPerWeek: 40 },
    initialPeriodMonths: 3,
    equityDiscussionStatus: 'to_be_discussed',
    workspaceId: status === 'ACTIVE' ? 'workspace-1' : null,
    otherParty: {
      id: 'candidate-a',
      name: 'Ada Member',
      title: 'Engineer',
      avatarUrl: '',
      role: 'cofounder',
    },
    invitedAt: '2026-10-01T00:00:00.000Z',
    discussionAcceptedAt: null,
    acceptedAt: null,
    activatedAt: null,
    pausedAt: null,
    endedAt: null,
    endReason: null,
    version: 1,
    permissions: [],
  }
}

function dimension(overrides: Partial<CofounderDimension> = {}): CofounderDimension {
  return {
    value: 70,
    weight: 0.1,
    confidence: 0.5,
    evidence: {},
    ...overrides,
  }
}

function recommendation(
  id: string,
  breakdown: Record<string, CofounderDimension>,
): CofounderRecommendation {
  return {
    rank: 1,
    candidate: {
      id,
      name: id.toUpperCase(),
      title: 'Engineer',
      avatarUrl: '',
      country: 'Hungary',
      timezone: 'Europe/Budapest',
    },
    collaborator: {
      id,
      name: id.toUpperCase(),
      title: 'Engineer',
      skills: ['typescript'],
      country: 'Hungary',
    },
    score: 80,
    cofounderFit: 80,
    confidence: 0.75,
    label: 'Strong match',
    breakdown,
    strengths: [],
    concerns: [],
    missingEvidence: [],
    claimed: {
      title: 'Engineer',
      skills: ['typescript'],
      industries: ['saas'],
      experienceYears: 6,
      availabilityHours: 40,
    },
    verified: {
      trustScore: 84,
      tier: 'Verified',
      verifiedSkills: [],
      proofs: [],
    },
    observed: {
      executionScore: 76,
      deliveryReliability: 91,
      completedTasks: 12,
    },
    reasons: [],
    deterministic: true,
    policyVersion: 'cofounder-fit-v1',
  }
}

describe('co-founder visibility helpers', () => {
  it('exposes operational mode only when the frontend flag and active backend state agree', () => {
    expect(cofounderModeVisible(false, { active: true })).toBe(false)
    expect(cofounderModeVisible(true, null)).toBe(false)
    expect(cofounderModeVisible(true, { active: false })).toBe(false)
    expect(cofounderModeVisible(true, { active: true })).toBe(true)
  })

  it('maps relationship states to the correct surface and keeps closed history non-operational', () => {
    expect(cofounderRelationshipSurface(null)).toBe('hidden')
    expect(cofounderRelationshipSurface(relationship('INVITED'))).toBe('invitation')
    expect(cofounderRelationshipSurface(relationship('COFOUNDER_PROPOSAL'))).toBe('invitation')
    expect(cofounderRelationshipSurface(relationship('ACTIVE'))).toBe('workspace')
    expect(cofounderRelationshipSurface(relationship('PAUSED'))).toBe('paused')
    expect(cofounderRelationshipSurface(relationship('DECLINED'))).toBe('closed')
    expect(cofounderRelationshipSurface(relationship('WITHDRAWN'))).toBe('closed')
    expect(cofounderRelationshipSurface(relationship('ENDED'))).toBe('closed')
    expect(cofounderRelationshipSurface(relationship('UNKNOWN' as CofounderStatus))).toBe('hidden')
  })
})

describe('co-founder comparison helpers', () => {
  it('preserves exact API values, confidence, weights, and missing evidence without scoring', () => {
    const capability = dimension({ value: 88.4, weight: 0.22, confidence: 0.9 })
    const execution = dimension({
      value: null,
      weight: 0.07,
      confidence: 0,
      missingEvidence: 'No TechIT execution signal is available.',
    })
    const rows = buildCofounderComparison([
      recommendation('candidate-a', { executionReputation: execution, capabilityFit: capability }),
    ])

    expect(rows.map((row) => row.dimension)).toEqual(['capabilityFit', 'executionReputation'])
    expect(rows[0]).toMatchObject({
      label: 'Capability fit',
      weight: 0.22,
      values: {
        'candidate-a': { value: 88.4, confidence: 0.9 },
      },
    })
    expect(rows[0].values['candidate-a'].value).toBe(capability.value)
    expect(rows[1].values['candidate-a']).toEqual({
      value: null,
      confidence: 0,
      missingEvidence: 'No TechIT execution signal is available.',
    })
  })

  it('filters selected candidates while preserving deterministic API dimension order', () => {
    const first = recommendation('candidate-b', {
      trustVerification: dimension({ value: 71, weight: 0.05, confidence: 0.8 }),
      commitmentCompatibility: dimension({ value: 64.2, weight: 0.12, confidence: 0.6 }),
      capabilityFit: dimension({ value: 52.5, weight: 0.22, confidence: 0.4 }),
    })
    const second = recommendation('candidate-a', {
      capabilityFit: dimension({ value: 91, weight: 0.22, confidence: 0.95 }),
      trustVerification: dimension({ value: 84, weight: 0.05, confidence: 0.9 }),
    })

    const selected = buildCofounderComparison([first, second], ['candidate-a'])
    expect(selected.map((row) => [row.dimension, row.weight])).toEqual([
      ['capabilityFit', 0.22],
      ['trustVerification', 0.05],
    ])
    expect(Object.keys(selected[0].values)).toEqual(['candidate-a'])
    expect(selected[0].values['candidate-a'].value).toBe(91)

    const all = buildCofounderComparison([first, second])
    expect(all.map((row) => row.dimension)).toEqual([
      'capabilityFit',
      'commitmentCompatibility',
      'trustVerification',
    ])
    expect(all[0].values).toEqual({
      'candidate-b': { value: 52.5, confidence: 0.4 },
      'candidate-a': { value: 91, confidence: 0.95 },
    })
    expect(dimensionLabel('workingStyleCompatibility')).toBe('Working-style compatibility')
  })
})

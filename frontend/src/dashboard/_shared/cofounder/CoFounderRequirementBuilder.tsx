import { useEffect, useState } from 'react'
import { CheckCircle2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchCofounderRequirements,
  saveCofounderRequirements,
} from '@/lib/api/cofounder'
import type { CofounderRequirement } from './types'

interface RequirementForm {
  roleType: string
  roleTitle: string
  responsibilities: string
  requiredSkills: string
  experienceYears: string
  commitmentType: string
  hoursPerWeek: string
  ventureStage: string
  visionAnswers: string
  riskTolerance: string
  workingStyle: string
  communicationPreference: string
  decisionMakingStyle: string
  longTermAmbition: string
  timezoneCompatibility: string
  contributionExpectations: string
  equityDiscussionPreference: string
}

const EMPTY_FORM: RequirementForm = {
  roleType: 'technical',
  roleTitle: 'Co-founder',
  responsibilities: '',
  requiredSkills: '',
  experienceYears: '',
  commitmentType: 'full_time',
  hoursPerWeek: '40',
  ventureStage: 'idea',
  visionAnswers: '',
  riskTolerance: '',
  workingStyle: '',
  communicationPreference: '',
  decisionMakingStyle: '',
  longTermAmbition: '',
  timezoneCompatibility: '',
  contributionExpectations: '',
  equityDiscussionPreference: 'to_be_discussed',
}

const FIELD_CLASS = 'mt-1 w-full rounded-lg border border-border-default bg-surface-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-accent'
const LABEL_CLASS = 'text-xs font-semibold text-text-secondary'

function formFromRequirement(requirement: CofounderRequirement): RequirementForm {
  const compatibility = requirement.compatibility || {}
  return {
    roleType: requirement.roleType || 'technical',
    roleTitle: requirement.roleTitle || '',
    responsibilities: requirement.responsibilities || '',
    requiredSkills: (requirement.requiredSkills || []).join(', '),
    experienceYears: requirement.experience?.years == null ? '' : String(requirement.experience.years),
    commitmentType: requirement.commitment?.type || '',
    hoursPerWeek: requirement.commitment?.hoursPerWeek == null ? '' : String(requirement.commitment.hoursPerWeek),
    ventureStage: requirement.ventureStage || '',
    visionAnswers: String(compatibility.visionAnswers || ''),
    riskTolerance: String(compatibility.riskTolerance || ''),
    workingStyle: String(compatibility.workingStyle || ''),
    communicationPreference: String(compatibility.communicationPreference || ''),
    decisionMakingStyle: String(compatibility.decisionMakingStyle || ''),
    longTermAmbition: String(compatibility.longTermAmbition || ''),
    timezoneCompatibility: String(compatibility.timezoneCompatibility || ''),
    contributionExpectations: String(compatibility.contributionExpectations || ''),
    equityDiscussionPreference: String(compatibility.equityDiscussionPreference || 'to_be_discussed'),
  }
}

interface CoFounderRequirementBuilderProps {
  ventureId: string
  onSaved?: (requirement: CofounderRequirement) => void
  compact?: boolean
}

export function CoFounderRequirementBuilder({
  ventureId,
  onSaved,
  compact = false,
}: CoFounderRequirementBuilderProps) {
  const [requirement, setRequirement] = useState<CofounderRequirement | null>(null)
  const [form, setForm] = useState<RequirementForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchCofounderRequirements(ventureId)
      .then((result) => {
        if (!alive) return
        setRequirement(result.requirement)
        setForm(result.requirement ? formFromRequirement(result.requirement) : EMPTY_FORM)
        setError(null)
      })
      .catch((loadError) => {
        if (!alive) return
        setError(loadError instanceof Error ? loadError.message : 'Co-founder requirements are unavailable.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [ventureId])

  const update = (key: keyof RequirementForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const result = await saveCofounderRequirements(ventureId, {
        ...(requirement ? { version: requirement.version } : {}),
        roleType: form.roleType,
        roleTitle: form.roleTitle,
        responsibilities: form.responsibilities,
        requiredSkills: form.requiredSkills.split(',').map((value) => value.trim()).filter(Boolean),
        experience: {
          years: form.experienceYears === '' ? null : Number(form.experienceYears),
        },
        commitment: {
          type: form.commitmentType || null,
          hoursPerWeek: form.hoursPerWeek === '' ? null : Number(form.hoursPerWeek),
        },
        ventureStage: form.ventureStage || null,
        compatibility: {
          visionAnswers: form.visionAnswers,
          riskTolerance: form.riskTolerance,
          workingStyle: form.workingStyle,
          communicationPreference: form.communicationPreference,
          decisionMakingStyle: form.decisionMakingStyle,
          longTermAmbition: form.longTermAmbition,
          timezoneCompatibility: form.timezoneCompatibility,
          contributionExpectations: form.contributionExpectations,
          equityDiscussionPreference: form.equityDiscussionPreference,
        },
      })
      setRequirement(result.requirement)
      setForm(formFromRequirement(result.requirement))
      toast.success('Co-founder requirements saved.')
      onSaved?.(result.requirement)
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Co-founder requirements could not be saved.'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-border-default bg-surface-primary p-5 text-sm text-text-muted">Loading co-founder requirements…</div>
  }

  return (
    <form onSubmit={submit} className={`rounded-xl border border-border-default bg-surface-primary ${compact ? 'p-4' : 'p-5 lg:p-6'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand-accent" />
            <h2 className="text-sm font-semibold text-text-primary">Co-founder requirements</h2>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Explicit inputs are used by the deterministic <span className="font-mono">cofounder-fit-v1</span> policy. Missing answers remain missing evidence.
          </p>
        </div>
        {requirement && (
          <span className="inline-flex items-center gap-1 rounded-full border border-status-success bg-status-success-soft px-2.5 py-1 text-[11px] font-medium text-status-success">
            <CheckCircle2 className="h-3 w-3" />
            Version {requirement.version}
          </span>
        )}
      </div>

      {error && <p className="mt-3 rounded-lg border border-status-error bg-status-error-soft px-3 py-2 text-xs text-status-error">{error}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={LABEL_CLASS}>
          Role type
          <select className={FIELD_CLASS} value={form.roleType} onChange={(event) => update('roleType', event.target.value)}>
            {['technical', 'product', 'growth', 'marketing', 'operations', 'finance', 'ai_data', 'industry_domain', 'other'].map((value) => (
              <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className={LABEL_CLASS}>
          Role title
          <input className={FIELD_CLASS} value={form.roleTitle} onChange={(event) => update('roleTitle', event.target.value)} placeholder="Technical co-founder" />
        </label>
        <label className={LABEL_CLASS}>
          Venture stage
          <select className={FIELD_CLASS} value={form.ventureStage} onChange={(event) => update('ventureStage', event.target.value)}>
            {['idea', 'validation', 'mvp', 'early_revenue', 'growth'].map((value) => (
              <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className={LABEL_CLASS}>
          Commitment
          <select className={FIELD_CLASS} value={form.commitmentType} onChange={(event) => update('commitmentType', event.target.value)}>
            {['full_time', 'part_time', 'transitioning_to_full_time', 'flexible'].map((value) => (
              <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className={LABEL_CLASS}>
          Hours per week
          <input className={FIELD_CLASS} type="number" min="0" max="168" value={form.hoursPerWeek} onChange={(event) => update('hoursPerWeek', event.target.value)} />
        </label>
        <label className={LABEL_CLASS}>
          Minimum experience (years)
          <input className={FIELD_CLASS} type="number" min="0" max="80" value={form.experienceYears} onChange={(event) => update('experienceYears', event.target.value)} />
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className={LABEL_CLASS}>
          Required skills
          <input className={FIELD_CLASS} value={form.requiredSkills} onChange={(event) => update('requiredSkills', event.target.value)} placeholder="TypeScript, product discovery, fundraising" />
        </label>
        <label className={LABEL_CLASS}>
          Ownership responsibilities
          <input className={FIELD_CLASS} value={form.responsibilities} onChange={(event) => update('responsibilities', event.target.value)} placeholder="Own product and engineering execution" />
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className={LABEL_CLASS}>
          Vision answers
          <textarea className={`${FIELD_CLASS} min-h-20`} value={form.visionAnswers} onChange={(event) => update('visionAnswers', event.target.value)} placeholder="What should this venture become, and why?" />
        </label>
        <label className={LABEL_CLASS}>
          Working style
          <textarea className={`${FIELD_CLASS} min-h-20`} value={form.workingStyle} onChange={(event) => update('workingStyle', event.target.value)} placeholder="How do you prefer to plan, communicate, and decide?" />
        </label>
        <label className={LABEL_CLASS}>
          Risk tolerance
          <input className={FIELD_CLASS} value={form.riskTolerance} onChange={(event) => update('riskTolerance', event.target.value)} placeholder="Explicit preference, not inferred" />
        </label>
        <label className={LABEL_CLASS}>
          Communication preference
          <input className={FIELD_CLASS} value={form.communicationPreference} onChange={(event) => update('communicationPreference', event.target.value)} />
        </label>
        <label className={LABEL_CLASS}>
          Decision-making style
          <input className={FIELD_CLASS} value={form.decisionMakingStyle} onChange={(event) => update('decisionMakingStyle', event.target.value)} />
        </label>
        <label className={LABEL_CLASS}>
          Long-term ambition
          <input className={FIELD_CLASS} value={form.longTermAmbition} onChange={(event) => update('longTermAmbition', event.target.value)} />
        </label>
        <label className={LABEL_CLASS}>
          Timezone compatibility
          <input className={FIELD_CLASS} value={form.timezoneCompatibility} onChange={(event) => update('timezoneCompatibility', event.target.value)} />
        </label>
        <label className={LABEL_CLASS}>
          Contribution expectations
          <input className={FIELD_CLASS} value={form.contributionExpectations} onChange={(event) => update('contributionExpectations', event.target.value)} />
        </label>
        <label className={LABEL_CLASS}>
          Equity discussion
          <select className={FIELD_CLASS} value={form.equityDiscussionPreference} onChange={(event) => update('equityDiscussionPreference', event.target.value)}>
            <option value="to_be_discussed">To be discussed</option>
            <option value="open_now">Open to discussing now</option>
            <option value="after_due_diligence">After due diligence</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-text-muted">Equity percentages are intentionally not required at this stage.</p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary disabled:opacity-60"
        >
          {saving ? 'Saving…' : requirement ? 'Update requirements' : 'Save requirements'}
        </button>
      </div>
    </form>
  )
}

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth, type Profile } from '@/contexts/AuthContext'
import { cofounderFrontendEnabled } from '@/lib/api/cofounder'

type Preferences = NonNullable<Profile['cofounderPreferences']>
type Experience = NonNullable<Profile['cofounderExperience']>

const COMMITMENTS = [
  ['full_time', 'Full-time'],
  ['part_time', 'Part-time'],
  ['transitioning_to_full_time', 'Transitioning to full-time'],
  ['flexible', 'Flexible'],
] as const

const RISK_LEVELS = [
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
] as const

const WORKING_STYLES = [
  ['deep work', 'Deep work'],
  ['collaborative', 'Collaborative'],
  ['async-first', 'Async-first'],
  ['structured', 'Structured'],
] as const

const COMMUNICATION_PREFERENCES = [
  ['daily sync', 'Daily sync'],
  ['weekly sync', 'Weekly sync'],
  ['async written', 'Async written'],
  ['flexible', 'Flexible'],
] as const

const TIMEZONE_PREFERENCES = [
  ['same_timezone', 'Same timezone'],
  ['overlapping_hours', 'Overlapping hours'],
  ['async_flexible', 'Async / flexible'],
] as const

const EQUITY_PREFERENCES = [
  ['to_be_discussed', 'To be discussed'],
  ['equal_split', 'Equal split'],
  ['role_based', 'Role-based'],
  ['custom', 'Custom'],
] as const

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<readonly [string, string]>
}) {
  return (
    <label className="block text-xs font-semibold text-text-secondary">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
      >
        <option value="">Not specified</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  )
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  const className = 'mt-1.5 w-full rounded-lg border border-border-strong bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30'
  return (
    <label className="block text-xs font-semibold text-text-secondary">
      {label}
      {multiline ? (
        <textarea rows={3} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={className} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={className} />
      )}
    </label>
  )
}

export function CofounderProfileSettings() {
  const { profile, updateProfile } = useAuth()
  const enabled = cofounderFrontendEnabled()
  const preferences = profile?.cofounderPreferences || {}
  const experience = profile?.cofounderExperience || {}

  const [commitment, setCommitment] = useState(preferences.commitment || '')
  const [visionAnswers, setVisionAnswers] = useState(preferences.visionAnswers || '')
  const [workingStyle, setWorkingStyle] = useState(preferences.workingStyle || '')
  const [riskTolerance, setRiskTolerance] = useState(preferences.riskTolerance || '')
  const [communicationPreference, setCommunicationPreference] = useState(preferences.communicationPreference || '')
  const [timezoneCompatibility, setTimezoneCompatibility] = useState(preferences.timezoneCompatibility || '')
  const [decisionStyle, setDecisionStyle] = useState(preferences.decisionStyle || '')
  const [longTermAmbition, setLongTermAmbition] = useState(preferences.longTermAmbition || '')
  const [contributionExpectations, setContributionExpectations] = useState(preferences.contributionExpectations || '')
  const [equityDiscussionPreference, setEquityDiscussionPreference] = useState(preferences.equityDiscussionPreference || '')
  const [currentlyCofounder, setCurrentlyCofounder] = useState(Boolean(experience.currentlyCofounder))
  const [currentVentureCount, setCurrentVentureCount] = useState(String(experience.currentVentureCount ?? 0))
  const [previousCofounderCount, setPreviousCofounderCount] = useState(String(experience.previousCofounderCount ?? 0))
  const [previousVentures, setPreviousVentures] = useState((experience.previousVentures || []).join(', '))
  const [summary, setSummary] = useState(experience.summary || '')
  const [saving, setSaving] = useState(false)
  const fingerprint = JSON.stringify([commitment, visionAnswers, workingStyle, riskTolerance, communicationPreference, timezoneCompatibility, decisionStyle, longTermAmbition, contributionExpectations, equityDiscussionPreference, currentlyCofounder, currentVentureCount, previousCofounderCount, previousVentures, summary])
  const [savedFingerprint, setSavedFingerprint] = useState(fingerprint)
  const dirty = fingerprint !== savedFingerprint


  useEffect(() => {
    if (!profile?.id) return
    setCommitment(profile.cofounderPreferences?.commitment || '')
    setVisionAnswers(profile.cofounderPreferences?.visionAnswers || '')
    setWorkingStyle(profile.cofounderPreferences?.workingStyle || '')
    setRiskTolerance(profile.cofounderPreferences?.riskTolerance || '')
    setCommunicationPreference(profile.cofounderPreferences?.communicationPreference || '')
    setTimezoneCompatibility(profile.cofounderPreferences?.timezoneCompatibility || '')
    setDecisionStyle(profile.cofounderPreferences?.decisionStyle || '')
    setLongTermAmbition(profile.cofounderPreferences?.longTermAmbition || '')
    setContributionExpectations(profile.cofounderPreferences?.contributionExpectations || '')
    setEquityDiscussionPreference(profile.cofounderPreferences?.equityDiscussionPreference || '')
    setCurrentlyCofounder(Boolean(profile.cofounderExperience?.currentlyCofounder))
    setCurrentVentureCount(String(profile.cofounderExperience?.currentVentureCount ?? 0))
    setPreviousCofounderCount(String(profile.cofounderExperience?.previousCofounderCount ?? 0))
    setPreviousVentures((profile.cofounderExperience?.previousVentures || []).join(', '))
    setSummary(profile.cofounderExperience?.summary || '')
  }, [profile?.id])

  if (!enabled) return <section id="cofounder" className="rounded-2xl border border-border-default bg-surface-primary p-6"><h2 className="text-lg font-semibold text-text-primary">Co-founder Matching</h2><p className="mt-2 text-sm text-text-muted">Co-founder matching is not available in this environment yet.</p></section>

  const save = async () => {
    setSaving(true)
    const nextPreferences: Preferences = {
      commitment: commitment || null,
      visionAnswers: visionAnswers.trim(),
      workingStyle: workingStyle.trim(),
      riskTolerance: riskTolerance.trim(),
      communicationPreference: communicationPreference.trim(),
      timezoneCompatibility: timezoneCompatibility.trim(),
      decisionStyle: decisionStyle.trim(),
      longTermAmbition: longTermAmbition.trim(),
      contributionExpectations: contributionExpectations.trim(),
      equityDiscussionPreference: equityDiscussionPreference.trim(),
    }
    const nextExperience: Experience = {
      currentlyCofounder,
      currentVentureCount: Math.max(0, Number(currentVentureCount) || 0),
      previousCofounderCount: Math.max(0, Number(previousCofounderCount) || 0),
      previousVentures: previousVentures.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 20),
      summary: summary.trim(),
    }
    const result = await updateProfile({ cofounderPreferences: nextPreferences, cofounderExperience: nextExperience })
    setSaving(false)
    if (result.error) toast.error(result.error.message)
    else { setSavedFingerprint(fingerprint); toast.success('Co-founder matching preferences saved.') }
  }

  return (
    <section id="cofounder" className="border border-border-default bg-surface-primary rounded-2xl p-6 scroll-mt-6 shadow-sm">
      <h2 className="text-lg font-semibold text-text-primary mb-1">Co-founder Matching</h2>
      <p className="text-sm text-text-muted mb-6">
        Explicit answers improve deterministic fit. Blank fields remain missing evidence and are never inferred.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField label="Commitment" value={commitment} onChange={setCommitment} options={COMMITMENTS} />
        <SelectField label="Risk tolerance" value={riskTolerance} onChange={setRiskTolerance} options={RISK_LEVELS} />
        <SelectField label="Working style" value={workingStyle} onChange={setWorkingStyle} options={WORKING_STYLES} />
        <SelectField label="Communication preference" value={communicationPreference} onChange={setCommunicationPreference} options={COMMUNICATION_PREFERENCES} />
        <SelectField label="Timezone compatibility" value={timezoneCompatibility} onChange={setTimezoneCompatibility} options={TIMEZONE_PREFERENCES} />
        <SelectField label="Equity discussion preference" value={equityDiscussionPreference} onChange={setEquityDiscussionPreference} options={EQUITY_PREFERENCES} />
        <TextField label="Decision style" value={decisionStyle} onChange={setDecisionStyle} placeholder="Consensus, founder-led, written proposals…" />
        <TextField label="Long-term ambition" value={longTermAmbition} onChange={setLongTermAmbition} placeholder="What you want to build over the next decade" />
        <div className="md:col-span-2">
          <TextField label="Vision answers" value={visionAnswers} onChange={setVisionAnswers} multiline placeholder="Describe the problem, customer, and durable outcome you want to build." />
        </div>
        <div className="md:col-span-2">
          <TextField label="Contribution expectations" value={contributionExpectations} onChange={setContributionExpectations} multiline placeholder="What each co-founder should own and contribute." />
        </div>
      </div>

      <hr className="my-6 border-border-subtle" />
      <h3 className="text-sm font-semibold text-text-primary">Co-founder experience</h3>
      <p className="mt-1 text-xs text-text-muted">Only structured experience is shown. This does not change your platform role.</p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={currentlyCofounder} onChange={(event) => setCurrentlyCofounder(event.target.checked)} className="accent-brand-primary" />
          I am currently a co-founder
        </label>
        <TextField label="Current venture count" value={currentVentureCount} onChange={setCurrentVentureCount} />
        <TextField label="Previous co-founder relationships" value={previousCofounderCount} onChange={setPreviousCofounderCount} />
        <TextField label="Previous ventures" value={previousVentures} onChange={setPreviousVentures} placeholder="Comma-separated" />
        <div className="md:col-span-2">
          <TextField label="Experience summary" value={summary} onChange={setSummary} multiline placeholder="What you built, your role, and verified outcomes." />
        </div>
      </div>

      <p role="status" className="mt-4 text-xs text-text-muted">{dirty ? 'You have unsaved changes.' : 'No unsaved changes.'}</p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={() => void save()}
          className="min-h-11 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save co-founder preferences'}
        </button>
      </div>
    </section>
  )
}

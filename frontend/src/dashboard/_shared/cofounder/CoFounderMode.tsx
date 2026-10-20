import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Handshake, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useFounderProfile } from '@/contexts/UserContext'
import {
  cofounderFrontendEnabled,
  fetchCofounderMode,
  publishCofounderInvestorSummary,
} from '@/lib/api/cofounder'
import { cofounderModeVisible, formatDate } from './helpers'
import type { CofounderModeResponse } from './types'

interface CoFounderModeProps {
  ventureId: string | null
}

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-background-primary px-3 py-2">
      <p className="text-lg font-semibold tabular-nums text-text-primary">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
    </div>
  )
}

export function CoFounderMode({ ventureId }: CoFounderModeProps) {
  const enabled = cofounderFrontendEnabled()
  const { founderProfile } = useFounderProfile()
  const [mode, setMode] = useState<CofounderModeResponse | null>(null)
  const [investorOpen, setInvestorOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [teamStrength, setTeamStrength] = useState('')
  const [strengths, setStrengths] = useState('')
  const [completedMilestones, setCompletedMilestones] = useState('')
  const [verifiedContributors, setVerifiedContributors] = useState('')
  const [executionConsistency, setExecutionConsistency] = useState('')
  const [publishedAt, setPublishedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !ventureId) {
      setMode(null)
      return
    }
    let alive = true
    fetchCofounderMode(ventureId)
      .then((result) => { if (alive) setMode(result) })
      .catch(() => { if (alive) setMode(null) })
    return () => { alive = false }
  }, [enabled, ventureId])

  const team = useMemo(() => {
    const founder = {
      name: founderProfile.name || 'Founder',
      title: founderProfile.title || 'Founder',
      role: 'Founder',
    }
    const partners = (mode?.relationships || []).map((relationship) => ({
      name: relationship.otherParty.name,
      title: relationship.otherParty.title || relationship.roleTitle || 'Co-founder',
      role: relationship.role === 'founder' ? 'Co-founder' : 'Founder',
    }))
    return [founder, ...partners]
  }, [founderProfile.name, founderProfile.title, mode?.relationships])

  if (!cofounderModeVisible(enabled, mode) || !mode || !ventureId) return null

  const publish = async (event: React.FormEvent) => {
    event.preventDefault()
    setPublishing(true)
    try {
      const result = await publishCofounderInvestorSummary(ventureId, {
        team,
        teamStrength: teamStrength === '' ? null : Number(teamStrength),
        strengths: strengths.split(',').map((value) => value.trim()).filter(Boolean),
        verifiedEvidence: {
          completedMilestones: completedMilestones === '' ? null : Number(completedMilestones),
          verifiedContributors: verifiedContributors === '' ? null : Number(verifiedContributors),
          executionConsistency: executionConsistency === '' ? null : Number(executionConsistency),
        },
      })
      setPublishedAt(result.summary?.approvedAt ? String(result.summary.approvedAt) : new Date().toISOString())
      toast.success('Investor team summary published to authorized deal rooms.')
      setInvestorOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The investor summary could not be published.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <section className="rounded-xl border border-violet-300 bg-linear-to-br from-violet-50 via-surface-primary to-cyan-50 p-5 shadow-sm dark:from-violet-950/30 dark:via-surface-primary dark:to-cyan-950/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-600 p-2.5 text-white">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-text-primary">Co-founder Mode</h2>
              <span className="rounded-full border border-status-success bg-status-success-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-status-success">
                Active
              </span>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Relationship-scoped execution, decisions, and evidence. This mode is visible only while a formal relationship is active.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border-default bg-surface-primary/80 px-3 py-1.5 text-xs text-text-secondary">
          <Users className="h-4 w-4 text-violet-600" />
          {mode.team.length + 1} relationship {mode.team.length === 0 ? 'party' : 'parties'}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {mode.relationships.map((relationship) => (
          <article key={relationship.id} className="rounded-xl border border-border-default bg-surface-primary p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">{relationship.roleTitle || 'Co-founder'}</p>
                <h3 className="mt-1 text-base font-semibold text-text-primary">{relationship.otherParty.name}</h3>
                <p className="text-xs text-text-muted">{relationship.otherParty.title || 'Relationship partner'}</p>
              </div>
              <span className="rounded-full border border-status-success bg-status-success-soft px-2 py-0.5 text-[10px] font-medium text-status-success">ACTIVE</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <SummaryMetric
                label="Objectives"
                value={relationship.summary?.sharedObjectives.active ?? 0}
              />
              <SummaryMetric
                label="Progress"
                value={relationship.summary?.sharedObjectives.progress == null ? '—' : `${relationship.summary.sharedObjectives.progress}%`}
              />
              <SummaryMetric label="Open decisions" value={relationship.summary?.openDecisions ?? 0} />
            </div>
            <div className="mt-3 rounded-lg border border-border-subtle px-3 py-2 text-xs text-text-secondary">
              Responsibilities: {relationship.summary?.responsibilityCompletion
                ? `${relationship.summary.responsibilityCompletion.completed}/${relationship.summary.responsibilityCompletion.total} complete`
                : 'No responsibilities recorded'}
            </div>
            <Link
              to={`/workspaces/cofounder/${relationship.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900 dark:text-violet-300"
            >
              Open co-founder workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-violet-200 pt-4 dark:border-violet-900/50">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck className="h-4 w-4 text-status-success" />
          Private activity stays relationship-scoped. Investor visibility requires explicit approval.
        </div>
        <button
          type="button"
          onClick={() => setInvestorOpen((current) => !current)}
          className="rounded-lg border border-violet-300 bg-surface-primary px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50 dark:text-violet-300"
        >
          {publishedAt ? `Summary published ${formatDate(publishedAt)}` : 'Publish investor team summary'}
        </button>
      </div>

      {investorOpen && (
        <form onSubmit={publish} className="mt-4 rounded-xl border border-violet-200 bg-surface-primary p-4">
          <h3 className="text-sm font-semibold text-text-primary">Curated investor team summary</h3>
          <p className="mt-1 text-xs text-text-muted">Only this approved summary is exposed through existing deal-room authorization. Private notes and equity discussions are excluded.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-semibold text-text-secondary">
              Team strength (0–100)
              <input type="number" min="0" max="100" value={teamStrength} onChange={(event) => setTeamStrength(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-text-secondary">
              Completed milestones
              <input type="number" min="0" value={completedMilestones} onChange={(event) => setCompletedMilestones(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-text-secondary">
              Verified contributors
              <input type="number" min="0" value={verifiedContributors} onChange={(event) => setVerifiedContributors(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-text-secondary">
              Execution consistency (0–100)
              <input type="number" min="0" max="100" value={executionConsistency} onChange={(event) => setExecutionConsistency(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-text-secondary sm:col-span-2">
              Approved strengths
              <input value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder="shipping cadence, technical depth" className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setInvestorOpen(false)} className="rounded-lg border border-border-default px-3 py-2 text-xs text-text-secondary">Cancel</button>
            <button type="submit" disabled={publishing || team.length === 0} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60">
              {publishing ? 'Publishing…' : 'Publish approved summary'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

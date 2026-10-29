import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Handshake,
  Pause,
  Play,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  acceptCofounderDiscussion,
  acceptCofounderProposal,
  advanceCofounderRelationship,
  cofounderFrontendEnabled,
  declineCofounderInvitation,
  endCofounderRelationship,
  fetchCofounderInvitation,
  pauseCofounderRelationship,
  requestCofounderChanges,
  resumeCofounderRelationship,
  withdrawCofounderInvitation,
} from '@/lib/api/cofounder'
import {
  cofounderStatusLabel,
  cofounderStatusStyle,
  formatCommitment,
  formatDate,
  isClosedCofounder,
  isPreActiveCofounder,
} from './helpers'
import type { CofounderRelationship } from './types'

const TIMELINE = ['INVITED', 'DISCUSSION', 'MUTUAL_INTEREST', 'DUE_DILIGENCE', 'COFOUNDER_PROPOSAL', 'ACTIVE']

function apiMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'body' in error) {
    const body = (error as { body?: { error?: string } }).body
    if (body?.error) return body.error.replaceAll('_', ' ')
  }
  return error instanceof Error ? error.message : 'The relationship action could not be completed.'
}

export function CoFounderInvitationPage() {
  const { relationshipId = '' } = useParams()
  const { profile } = useAuth()
  const enabled = cofounderFrontendEnabled()
  const [relationship, setRelationship] = useState<CofounderRelationship | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [changesOpen, setChangesOpen] = useState(false)
  const [changes, setChanges] = useState('')
  const [endReason, setEndReason] = useState('')

  useEffect(() => {
    if (!enabled || !relationshipId) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    fetchCofounderInvitation(relationshipId)
      .then((result) => {
        if (!alive) return
        setRelationship(result.invitation)
        setError(null)
      })
      .catch((loadError) => {
        if (alive) setError(apiMessage(loadError))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [enabled, relationshipId])

  const run = async (label: string, action: () => Promise<{ ok: boolean; relationship: CofounderRelationship }>) => {
    setBusy(label)
    try {
      const result = await action()
      setRelationship(result.relationship)
      toast.success(`${label} completed.`)
      setChangesOpen(false)
      setChanges('')
    } catch (actionError) {
      toast.error(apiMessage(actionError))
    } finally {
      setBusy(null)
    }
  }

  if (!enabled) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-text-primary">Co-founder Mode is not enabled</h1>
        <p className="mt-2 text-sm text-text-muted">Enable the frontend and backend feature flag to use co-founder invitations.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="mx-auto max-w-4xl px-6 py-16 text-sm text-text-muted">Loading co-founder invitation…</div>
  }

  if (error || !relationship) {
    const fallbackDashboard = profile?.role === 'founder' ? '/founder/dashboard' : '/collaborator/dashboard'
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <XCircle className="mx-auto h-8 w-8 text-status-error" />
        <h1 className="mt-3 text-xl font-semibold text-text-primary">Invitation unavailable</h1>
        <p className="mt-2 text-sm text-text-muted">{error || 'This invitation is unavailable or you do not have access to it.'}</p>
        <Link to={fallbackDashboard} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-accent">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    )
  }

  const candidate = relationship.role === 'cofounder'
  const activeStep = Math.max(0, TIMELINE.indexOf(relationship.status === 'PAUSED' ? 'ACTIVE' : relationship.status))
  const closed = isClosedCofounder(relationship.status)
  const proposedTerms: Record<string, unknown> = relationship.proposedTerms || {}

  const advance = (status: string) => run(
    status === 'MUTUAL_INTEREST' ? 'Mutual interest confirmation' : status === 'DUE_DILIGENCE' ? 'Due diligence start' : 'Proposal send',
    () => advanceCofounderRelationship(relationship.id, {
      status,
      version: relationship.version,
      ...(status === 'COFOUNDER_PROPOSAL' ? {
        proposedTerms: {
          roleTitle: proposedTerms.roleTitle || relationship.roleTitle,
          responsibilities: proposedTerms.responsibilities || relationship.responsibilities,
          commitment: proposedTerms.commitment || relationship.commitment,
          initialPeriodMonths: proposedTerms.initialPeriodMonths || relationship.initialPeriodMonths,
          equityDiscussionStatus: proposedTerms.equityDiscussionStatus || relationship.equityDiscussionStatus,
        },
      } : {}),
    }),
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <Link to={relationship.role === 'founder' ? '/founder/dashboard' : '/collaborator/dashboard'} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <section className="mt-5 overflow-hidden rounded-2xl border border-border-default bg-surface-primary shadow-sm">
        <div className="border-b border-border-default bg-linear-to-r from-brand-primary/5 to-cyan-50 p-6 dark:from-violet-950/30 dark:to-cyan-950/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-brand-primary p-3 text-white"><Handshake className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary dark:text-brand-primary">Co-founder relationship</p>
                <h1 className="mt-1 text-2xl font-bold text-text-primary">{relationship.roleTitle || 'Co-founder discussion'}</h1>
                <p className="mt-1 text-sm text-text-secondary">
                  {relationship.otherParty.name}{relationship.otherParty.title ? ` · ${relationship.otherParty.title}` : ''}
                </p>
              </div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${cofounderStatusStyle(relationship.status)}`}>
              {cofounderStatusLabel(relationship.status)}
            </span>
          </div>
        </div>

        {!closed && (
          <div className="border-b border-border-default px-6 py-5">
            <div className="flex flex-wrap gap-2">
              {TIMELINE.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    index < activeStep
                      ? 'border-status-success bg-status-success text-white'
                      : index === activeStep
                        ? 'border-violet-600 bg-brand-primary text-white'
                        : 'border-border-default bg-surface-secondary text-text-muted'
                  }`}>
                    {index < activeStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                  </div>
                  <span className={`text-xs ${index <= activeStep ? 'font-medium text-text-primary' : 'text-text-muted'}`}>{cofounderStatusLabel(step)}</span>
                  {index < TIMELINE.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-text-disabled" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Proposed role and responsibilities</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {String(proposedTerms.responsibilities || relationship.responsibilities || 'Responsibilities will be agreed together before activation.')}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border-default p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted">Commitment</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{formatCommitment((proposedTerms.commitment as Record<string, unknown>) || relationship.commitment)}</p>
              </div>
              <div className="rounded-xl border border-border-default p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted">Initial working period</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{relationship.initialPeriodMonths ? `${relationship.initialPeriodMonths} months` : 'Not specified'}</p>
              </div>
              <div className="rounded-xl border border-border-default p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted">Equity discussion</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{relationship.equityDiscussionStatus.replaceAll('_', ' ')}</p>
              </div>
              <div className="rounded-xl border border-border-default p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted">Invitation sent</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{formatDate(relationship.invitedAt)}</p>
              </div>
            </div>

            {!!relationship.requestedChanges?.length && (
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Requested changes</h2>
                <div className="mt-2 space-y-2">
                  {relationship.requestedChanges.map((change, index) => (
                    <div key={`${change.createdAt}-${index}`} className="rounded-lg border border-status-warning bg-status-warning-soft px-3 py-2 text-sm text-status-warning">
                      {change.changes}
                      <p className="mt-1 text-[10px] opacity-80">{formatDate(change.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-3">
            <div className="rounded-xl border border-border-default bg-background-primary p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><ShieldCheck className="h-4 w-4 text-status-success" /> Controlled activation</div>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                Accepting a discussion does not activate Co-founder Mode. The workspace is created only after the invited candidate accepts the final proposal.
              </p>
            </div>

            {relationship.status === 'ACTIVE' && (
              <Link to={`/workspaces/cofounder/${relationship.id}`} className="flex items-center justify-center gap-2 min-h-11 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white">
                Open co-founder workspace <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {candidate && relationship.status === 'INVITED' && (
              <div className="space-y-2">
                <button type="button" disabled={Boolean(busy)} onClick={() => void run('Accept discussion', () => acceptCofounderDiscussion(relationship.id, relationship.version))} className="w-full min-h-11 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                  {busy === 'Accept discussion' ? 'Accepting…' : 'Accept Discussion'}
                </button>
                <button type="button" onClick={() => setChangesOpen((current) => !current)} className="w-full rounded-lg border border-border-default px-4 py-2.5 text-sm font-medium text-text-secondary">
                  Request Changes
                </button>
                <button type="button" disabled={Boolean(busy)} onClick={() => void run('Decline invitation', () => declineCofounderInvitation(relationship.id, undefined, relationship.version))} className="w-full rounded-lg border border-status-error bg-status-error-soft px-4 py-2.5 text-sm font-medium text-status-error disabled:opacity-60">
                  Decline
                </button>
              </div>
            )}

            {changesOpen && !closed && (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!changes.trim()) return
                  void run('Request changes', () => requestCofounderChanges(relationship.id, changes.trim(), relationship.version))
                }}
                className="rounded-xl border border-border-default p-4"
              >
                <label className="text-xs font-semibold text-text-secondary">
                  What should change?
                  <textarea value={changes} onChange={(event) => setChanges(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-border-default px-3 py-2 text-sm" />
                </label>
                <button type="submit" disabled={!changes.trim() || Boolean(busy)} className="mt-2 w-full rounded-lg bg-status-warning px-3 py-2 text-xs font-medium text-white disabled:opacity-60">
                  Send requested changes
                </button>
              </form>
            )}

            {candidate && relationship.status === 'DISCUSSION' && (
              <button type="button" disabled={Boolean(busy)} onClick={() => void advance('MUTUAL_INTEREST')} className="w-full min-h-11 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                Confirm mutual interest
              </button>
            )}

            {['DISCUSSION', 'MUTUAL_INTEREST'].includes(relationship.status) && (
              <button type="button" disabled={Boolean(busy)} onClick={() => void advance('DUE_DILIGENCE')} className="w-full rounded-lg border border-brand-primary/20 bg-brand-primary/5 px-4 py-2.5 text-sm font-medium text-brand-primary disabled:opacity-60">
                Start due diligence
              </button>
            )}

            {!candidate && relationship.status === 'DUE_DILIGENCE' && (
              <button type="button" disabled={Boolean(busy)} onClick={() => void advance('COFOUNDER_PROPOSAL')} className="w-full min-h-11 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                Send co-founder proposal
              </button>
            )}

            {candidate && relationship.status === 'COFOUNDER_PROPOSAL' && (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void run('Activate relationship', () => acceptCofounderProposal(relationship.id, {
                  version: relationship.version,
                  idempotencyKey: `cofounder-accept-${relationship.id}-${relationship.version}`,
                  acceptedTerms: proposedTerms,
                }))}
                className="w-full rounded-lg bg-status-success px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {busy === 'Activate relationship' ? 'Activating…' : 'Accept proposal and activate'}
              </button>
            )}

            {!candidate && isPreActiveCofounder(relationship.status) && (
              <button type="button" disabled={Boolean(busy)} onClick={() => void run('Withdraw invitation', () => withdrawCofounderInvitation(relationship.id, undefined, relationship.version))} className="w-full rounded-lg border border-border-default px-4 py-2.5 text-sm font-medium text-text-secondary disabled:opacity-60">
                Withdraw invitation
              </button>
            )}

            {relationship.status === 'ACTIVE' && (
              <button type="button" disabled={Boolean(busy)} onClick={() => void run('Pause relationship', () => pauseCofounderRelationship(relationship.id, relationship.version))} className="flex w-full items-center justify-center gap-2 rounded-lg border border-status-warning bg-status-warning-soft px-4 py-2.5 text-sm font-medium text-status-warning disabled:opacity-60">
                <Pause className="h-4 w-4" /> Pause relationship
              </button>
            )}

            {relationship.status === 'PAUSED' && (
              <button type="button" disabled={Boolean(busy)} onClick={() => void run('Resume relationship', () => resumeCofounderRelationship(relationship.id, relationship.version))} className="flex w-full items-center justify-center gap-2 rounded-lg bg-status-success px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                <Play className="h-4 w-4" /> Resume relationship
              </button>
            )}

            {['ACTIVE', 'PAUSED'].includes(relationship.status) && (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void run('End relationship', () => endCofounderRelationship(relationship.id, endReason.trim(), relationship.version))
                }}
                className="rounded-xl border border-status-error bg-status-error-soft p-3"
              >
                <label className="text-xs font-semibold text-status-error">
                  End reason
                  <input value={endReason} onChange={(event) => setEndReason(event.target.value)} className="mt-1 w-full rounded-lg border border-status-error/40 bg-surface-primary px-3 py-2 text-sm" />
                </label>
                <button type="submit" disabled={Boolean(busy)} className="mt-2 w-full rounded-lg border border-status-error px-3 py-2 text-xs font-medium text-status-error disabled:opacity-60">
                  End and preserve evidence
                </button>
              </form>
            )}

            {closed && (
              <div className="rounded-xl border border-border-default bg-background-primary p-4 text-sm text-text-secondary">
                This relationship is {cofounderStatusLabel(relationship.status).toLowerCase()}. Historical evidence remains preserved, but operational access is closed.
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  )
}

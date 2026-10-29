import { useEffect, useState } from 'react'
import { Check, MessageSquare, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  createCofounderDecision,
  fetchCofounderDecisions,
  respondToCofounderDecision,
} from '@/lib/api/cofounder'
import { formatDate } from './helpers'
import type { CofounderDecision } from './types'

interface DecisionCenterProps {
  relationshipId: string
}

function decisionTone(status: string): string {
  if (status === 'approved') return 'border-status-success bg-status-success-soft text-status-success'
  if (status === 'rejected') return 'border-status-error bg-status-error-soft text-status-error'
  if (status === 'discussion_requested') return 'border-status-warning bg-status-warning-soft text-status-warning'
  return 'border-status-info bg-status-info-soft text-brand-accent'
}

export function DecisionCenter({ relationshipId }: DecisionCenterProps) {
  const [decisions, setDecisions] = useState<CofounderDecision[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [visibility, setVisibility] = useState('SHARED')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchCofounderDecisions(relationshipId)
      .then((result) => { if (alive) setDecisions(result.decisions || []) })
      .catch(() => { if (alive) setDecisions([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [relationshipId])

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setBusy('create')
    try {
      const result = await createCofounderDecision(relationshipId, {
        title: title.trim(),
        description: description.trim(),
        deadline: deadline || null,
        visibilityLayer: visibility,
      })
      setDecisions((current) => [result.decision, ...current])
      setTitle('')
      setDescription('')
      setDeadline('')
      setOpen(false)
      toast.success('Decision opened.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The decision could not be created.')
    } finally {
      setBusy(null)
    }
  }

  const respond = async (decision: CofounderDecision, response: string) => {
    setBusy(decision.id)
    try {
      const result = await respondToCofounderDecision(decision.id, response)
      setDecisions((current) => current.map((row) => row.id === decision.id ? result.decision : row))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The response could not be recorded.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-2xl border border-border-default bg-surface-primary p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Decision center</h2>
          <p className="mt-1 text-xs text-text-muted">Decision history stays available to authorized relationship parties.</p>
        </div>
        <button type="button" onClick={() => setOpen((current) => !current)} className="inline-flex items-center gap-1.5 min-h-11 rounded-xl bg-brand-primary px-3 py-2 text-xs font-medium text-white">
          <Plus className="h-3.5 w-3.5" /> New decision
        </button>
      </div>

      {open && (
        <form onSubmit={create} className="mt-4 rounded-xl border border-border-default bg-background-primary p-4">
          <label className="text-xs font-semibold text-text-secondary">
            Decision
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" placeholder="Choose the next milestone" />
          </label>
          <label className="mt-3 block text-xs font-semibold text-text-secondary">
            Context
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-border-default px-3 py-2 text-sm" />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-text-secondary">
              Deadline
              <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-text-secondary">
              Visibility
              <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm">
                <option value="SHARED">Shared with both parties</option>
                <option value="PERSONAL">Personal only</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border-default px-3 py-2 text-xs">Cancel</button>
            <button type="submit" disabled={!title.trim() || busy === 'create'} className="min-h-11 rounded-xl bg-brand-primary px-3 py-2 text-xs font-medium text-white disabled:opacity-60">
              {busy === 'create' ? 'Opening…' : 'Open decision'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {loading ? <p className="text-sm text-text-muted">Loading decisions…</p> : decisions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-default p-4 text-sm text-text-muted">No decisions recorded yet.</p>
        ) : decisions.map((decision) => {
          const resolved = ['approved', 'rejected', 'withdrawn'].includes(decision.status)
          return (
            <article key={decision.id} className="rounded-xl border border-border-default p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{decision.title}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{decision.description || 'No context recorded.'}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${decisionTone(decision.status)}`}>{decision.status.replaceAll('_', ' ')}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-text-muted">
                <span>Opened {formatDate(decision.createdAt)}</span>
                <span>Deadline {formatDate(decision.deadline)}</span>
                <span>{decision.visibilityLayer.toLowerCase()} visibility</span>
              </div>
              {!!decision.responses.length && (
                <div className="mt-3 space-y-1.5">
                  {decision.responses.map((response) => (
                    <div key={`${response.userId}-${response.respondedAt}`} className="rounded-lg bg-background-primary px-3 py-2 text-xs text-text-secondary">
                      <span className="font-medium text-text-primary">{response.response.replaceAll('_', ' ')}</span>
                      {response.reason ? ` · ${response.reason}` : ''}
                    </div>
                  ))}
                </div>
              )}
              {!resolved && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy === decision.id} onClick={() => void respond(decision, 'approve')} className="inline-flex items-center gap-1 rounded-lg border border-status-success bg-status-success-soft px-3 py-1.5 text-xs font-medium text-status-success">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button type="button" disabled={busy === decision.id} onClick={() => void respond(decision, 'request_discussion')} className="inline-flex items-center gap-1 rounded-lg border border-status-warning bg-status-warning-soft px-3 py-1.5 text-xs font-medium text-status-warning">
                    <MessageSquare className="h-3.5 w-3.5" /> Discuss
                  </button>
                  <button type="button" disabled={busy === decision.id} onClick={() => void respond(decision, 'reject')} className="inline-flex items-center gap-1 rounded-lg border border-status-error bg-status-error-soft px-3 py-1.5 text-xs font-medium text-status-error">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

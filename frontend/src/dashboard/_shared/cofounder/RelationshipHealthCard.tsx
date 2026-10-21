import { useEffect, useState } from 'react'
import { Activity, ShieldQuestion } from 'lucide-react'
import { fetchCofounderHealth } from '@/lib/api/cofounder'
import { dimensionLabel } from './helpers'
import type { CofounderHealth } from './types'

interface RelationshipHealthCardProps {
  relationshipId: string
}

function healthTone(band: string): string {
  if (band === 'healthy') return 'text-status-success'
  if (band === 'watch') return 'text-status-warning'
  if (band === 'attention') return 'text-status-error'
  return 'text-text-muted'
}

export function RelationshipHealthCard({ relationshipId }: RelationshipHealthCardProps) {
  const [health, setHealth] = useState<CofounderHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchCofounderHealth(relationshipId)
      .then((result) => { if (alive) setHealth(result.health) })
      .catch(() => { if (alive) setHealth(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [relationshipId])

  if (loading) return <div className="rounded-xl border border-border-default bg-surface-primary p-5 text-sm text-text-muted">Calculating relationship health…</div>

  if (!health) {
    return (
      <div className="rounded-xl border border-border-default bg-surface-primary p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><ShieldQuestion className="h-4 w-4" /> Insufficient evidence</div>
        <p className="mt-2 text-xs text-text-muted">Relationship health is unavailable until observable collaboration evidence exists.</p>
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-border-default bg-surface-primary p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Activity className="h-4 w-4" /> Relationship health</div>
          <p className="mt-1 text-xs text-text-muted">Deterministic projection from observable execution evidence. Policy {health.policyVersion}.</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold tabular-nums ${healthTone(health.band)}`}>{health.overall == null ? '—' : health.overall}</p>
          <p className={`text-xs font-semibold ${healthTone(health.band)}`}>{health.band.replaceAll('_', ' ')}</p>
          <p className="text-[10px] text-text-muted">{Math.round(health.confidence * 100)}% confidence</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {Object.entries(health.metrics).map(([key, metric]) => (
          <div key={key}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-text-secondary">{dimensionLabel(key)}</span>
              <span className="tabular-nums text-text-primary">{metric.value == null ? 'Missing' : `${Math.round(metric.value)}%`}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${metric.value == null ? 0 : Math.max(0, Math.min(100, metric.value))}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-text-muted">{Math.round(metric.confidence * 100)}% confidence · {Object.keys(metric.evidence).length ? 'evidence attached' : 'no evidence references'}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1.5">
        {health.observations.map((observation) => (
          <p key={observation} className="rounded-lg bg-background-primary px-3 py-2 text-xs text-text-secondary">{observation}</p>
        ))}
      </div>
    </section>
  )
}

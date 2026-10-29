import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock3, Handshake } from 'lucide-react'
import {
  cofounderFrontendEnabled,
  fetchCofounderRelationships,
} from '@/lib/api/cofounder'
import {
  cofounderRelationshipLink,
  cofounderStatusLabel,
  cofounderStatusStyle,
  formatCommitment,
  isClosedCofounder,
} from './helpers'
import type { CofounderRelationship } from './types'

interface CoFounderRelationshipCardProps {
  compact?: boolean
}

export function CoFounderRelationshipCard({ compact = false }: CoFounderRelationshipCardProps) {
  const enabled = cofounderFrontendEnabled()
  const [relationships, setRelationships] = useState<CofounderRelationship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    setLoading(true)
    setError(false)
    fetchCofounderRelationships()
      .then((result) => {
        if (!alive) return
        setRelationships((result.relationships || []).filter((relationship) => !isClosedCofounder(relationship.status)))
      })
      .catch(() => { if (alive) { setRelationships([]); setError(true) } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [enabled, revision])

  if (!enabled) return null

  return (
    <section aria-busy={loading} className={`rounded-2xl border border-border-default bg-surface-primary shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center gap-2">
        <Handshake className="h-4 w-4 text-brand-primary" />
        <h2 className="text-sm font-semibold text-text-primary">Co-founder relationship</h2>
      </div>
      <div className="mt-3 space-y-3">
        {loading && <p role="status" className="text-sm text-text-muted">Loading co-founder relationships...</p>}
        {!loading && error && <div role="status" className="text-sm text-text-muted">Relationships could not be loaded. <button type="button" onClick={() => setRevision(value => value + 1)} className="min-h-11 rounded-lg border border-border-default px-3 text-text-primary">Try again</button></div>}
        {!loading && !error && relationships.length === 0 && <div className="space-y-3 text-sm text-text-muted"><p>No co-founder relationship yet. Set your preferences and availability to prepare for matching.</p><Link to="/collaborator/settings#cofounder" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-default px-4 text-text-primary">Set matching preferences<ArrowRight className="h-4 w-4" /></Link></div>}
        {relationships.map((relationship) => (
          <article key={relationship.id} className="rounded-lg border border-border-default bg-surface-primary p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{relationship.otherParty.name}</h3>
                <p className="text-xs text-text-muted">{relationship.roleTitle || 'Co-founder discussion'}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cofounderStatusStyle(relationship.status)}`}>
                {cofounderStatusLabel(relationship.status)}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-text-secondary">{relationship.responsibilities || 'Responsibilities will be agreed in the relationship workspace.'}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
                <Clock3 className="h-3.5 w-3.5" />
                {formatCommitment(relationship.commitment)}
              </span>
              <Link to={cofounderRelationshipLink(relationship)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary-hover dark:text-brand-primary">
                {relationship.status === 'ACTIVE' ? 'Open workspace' : relationship.status === 'PAUSED' ? 'Review paused relationship' : 'Review invitation'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

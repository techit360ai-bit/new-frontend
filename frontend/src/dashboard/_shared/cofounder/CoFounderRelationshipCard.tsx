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

  useEffect(() => {
    if (!enabled) return
    let alive = true
    fetchCofounderRelationships()
      .then((result) => {
        if (!alive) return
        setRelationships((result.relationships || []).filter((relationship) => !isClosedCofounder(relationship.status)))
      })
      .catch(() => { if (alive) setRelationships([]) })
    return () => { alive = false }
  }, [enabled])

  if (!enabled || relationships.length === 0) return null

  return (
    <section className={`rounded-xl border border-violet-300 bg-linear-to-br from-violet-50 to-surface-primary ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center gap-2">
        <Handshake className="h-4 w-4 text-violet-600" />
        <h2 className="text-sm font-semibold text-text-primary">Co-founder relationship</h2>
      </div>
      <div className="mt-3 space-y-3">
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
              <Link to={cofounderRelationshipLink(relationship)} className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-900 dark:text-violet-300">
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

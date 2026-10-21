import { useEffect, useState } from 'react'
import { BadgeCheck, Binoculars, FileCheck2 } from 'lucide-react'
import { fetchCofounderEvidence } from '@/lib/api/cofounder'
import { readableValue, recordValue, stringList } from './helpers'
import type { CofounderEvidence } from './types'

interface ExecutionEvidencePanelProps {
  relationshipId: string
}

export function ExecutionEvidencePanel({ relationshipId }: ExecutionEvidencePanelProps) {
  const [evidence, setEvidence] = useState<CofounderEvidence | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchCofounderEvidence(relationshipId)
      .then((result) => { if (alive) setEvidence(result) })
      .catch(() => { if (alive) setEvidence(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [relationshipId])

  if (loading) return <div className="rounded-xl border border-border-default bg-surface-primary p-5 text-sm text-text-muted">Loading execution evidence…</div>

  if (!evidence) {
    return <div className="rounded-xl border border-border-default bg-surface-primary p-5 text-sm text-text-muted">Execution evidence is unavailable for this relationship.</div>
  }

  return (
    <section className="rounded-xl border border-border-default bg-surface-primary p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><BadgeCheck className="h-4 w-4 text-status-success" /> Execution evidence</div>
      <p className="mt-1 text-xs text-text-muted">Claimed, verified, and observed evidence remain separate. Missing values are shown explicitly.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {evidence.parties.map((party) => {
          const verified = recordValue(party.verified)
          const observed = recordValue(party.observed)
          const verifiedSkills = Array.isArray(verified.verifiedSkills)
            ? verified.verifiedSkills.map((item) => String(recordValue(item).skill || item)).filter(Boolean)
            : []
          return (
            <article key={party.userId} className="rounded-xl border border-border-default p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold capitalize text-text-primary">{party.role}</h3>
                <span className="rounded-full border border-border-default px-2 py-0.5 text-[10px] text-text-muted">{party.userId}</span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-lg bg-background-primary p-3">
                  <p className="flex items-center gap-1.5 font-semibold text-text-secondary"><FileCheck2 className="h-3.5 w-3.5" /> Claimed</p>
                  <p className="mt-1 text-text-primary">{readableValue(party.claimed)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {stringList(recordValue(party.claimed).skills).map((skill) => <span key={skill} className="rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] text-text-secondary">{skill}</span>)}
                  </div>
                </div>

                <div className="rounded-lg bg-background-primary p-3">
                  <p className="flex items-center gap-1.5 font-semibold text-text-secondary"><BadgeCheck className="h-3.5 w-3.5" /> Verified</p>
                  <p className="mt-1 text-text-primary">Trust score: {readableValue(verified.trustScore)} · Tier: {readableValue(verified.tier)}</p>
                  <p className="mt-1 text-text-muted">Status: {readableValue(verified.verificationStatus)}</p>
                  <p className="mt-1 text-text-muted">Verified skills: {verifiedSkills.length ? verifiedSkills.join(', ') : 'None recorded'}</p>
                </div>

                <div className="rounded-lg bg-background-primary p-3">
                  <p className="flex items-center gap-1.5 font-semibold text-text-secondary"><Binoculars className="h-3.5 w-3.5" /> Observed</p>
                  <p className="mt-1 text-text-primary">{readableValue({ ...observed, execution: observed.execution ? recordValue(observed.execution) : null })}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <div className="mt-4 grid gap-2 text-[11px] text-text-muted sm:grid-cols-3">
        {Object.entries(evidence.separation).map(([key, value]) => <p key={key} className="rounded-lg border border-border-subtle px-3 py-2"><span className="font-semibold text-text-secondary">{key}:</span> {value}</p>)}
      </div>
    </section>
  )
}

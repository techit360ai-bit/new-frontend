import { Link } from 'react-router-dom'
import { BarChart3, Mail, X } from 'lucide-react'
import { buildCofounderComparison } from './helpers'
import type { CofounderRecommendation } from './types'

interface CoFounderComparisonProps {
  recommendations: CofounderRecommendation[]
  candidateIds: string[]
  onClose: () => void
  onInvite: (recommendation: CofounderRecommendation) => void
  invitationDisabled?: boolean
}

export function CoFounderComparison({
  recommendations,
  candidateIds,
  onClose,
  onInvite,
  invitationDisabled = false,
}: CoFounderComparisonProps) {
  const selected = candidateIds.length ? recommendations.filter((row) => candidateIds.includes(row.candidate.id)) : recommendations
  const rows = buildCofounderComparison(recommendations, candidateIds)

  if (selected.length === 0) return null

  return (
    <section className="rounded-xl border border-brand-primary/20 bg-surface-primary p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><BarChart3 className="h-4 w-4 text-brand-primary" /> Deterministic comparison</div>
          <p className="mt-1 text-xs text-text-muted">Values are exactly the API-provided <span className="font-mono">cofounder-fit-v1</span> breakdown. Nothing is recalculated in the browser.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close comparison" className="rounded-lg border border-border-default p-1.5 text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-border-default">
              <th className="sticky left-0 bg-surface-primary px-3 py-2 text-left font-semibold text-text-secondary">Dimension</th>
              {selected.map((recommendation) => (
                <th key={recommendation.candidate.id} className="px-3 py-2 text-left font-semibold text-text-primary">
                  <Link to={`/feed/profile/${recommendation.candidate.id}`} className="hover:text-brand-primary">{recommendation.candidate.name}</Link>
                  <p className="font-normal text-text-muted">{recommendation.cofounderFit == null ? 'Insufficient evidence' : `${recommendation.cofounderFit}% fit`} · {Math.round(recommendation.confidence * 100)}% confidence</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dimension} className="border-b border-border-subtle">
                <td className="sticky left-0 bg-surface-primary px-3 py-2">
                  <span className="font-medium text-text-primary">{row.label}</span>
                  <p className="text-[10px] text-text-muted">Weight {Math.round(row.weight * 1000) / 10}%</p>
                </td>
                {selected.map((recommendation) => {
                  const cell = row.values[recommendation.candidate.id]
                  return (
                    <td key={recommendation.candidate.id} className="px-3 py-2 align-top text-text-secondary">
                      <span className="font-semibold tabular-nums text-text-primary">{cell?.value == null ? 'Missing evidence' : `${Math.round(cell.value)}%`}</span>
                      {cell?.value != null && <p className="text-[10px] text-text-muted">{Math.round(cell.confidence * 100)}% confidence</p>}
                      {cell?.missingEvidence && <p className="mt-1 max-w-56 text-[10px] text-text-muted">{cell.missingEvidence}</p>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {selected.map((recommendation) => (
          <div key={recommendation.candidate.id} className="rounded-lg border border-border-default p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-text-primary">{recommendation.candidate.name}</p>
              <button type="button" disabled={invitationDisabled} onClick={() => onInvite(recommendation)} className="inline-flex items-center gap-1 min-h-11 rounded-xl bg-brand-primary px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60">
                <Mail className="h-3.5 w-3.5" /> Invite
              </button>
            </div>
            {!!recommendation.strengths.length && <p className="mt-2 text-[11px] text-status-success">Strengths: {recommendation.strengths.map((item) => item.label).join(', ')}</p>}
            {!!recommendation.concerns.length && <p className="mt-1 text-[11px] text-status-warning">Concerns: {recommendation.concerns.map((item) => item.label).join(', ')}</p>}
            {!!recommendation.missingEvidence.length && <p className="mt-1 text-[11px] text-text-muted">Missing: {recommendation.missingEvidence.map((item) => item.label).join(', ')}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

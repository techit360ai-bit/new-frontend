import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import { fetchDailyIntelligence, type DailyIntelligence } from '@/lib/api/recommendationIntelligence'

export function ContinuousIntelligencePanel({ role, organizationId }: { role: 'founder' | 'collaborator' | 'investor' | 'organisation'; organizationId?: string }) {
  const [data, setData] = useState<DailyIntelligence['intelligence'] | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    const load = () => fetchDailyIntelligence({ role, organizationId }).then(result => { if (active) setData(result.intelligence) }).catch(() => { if (active) setData(null) }).finally(() => { if (active) setLoading(false) })
    void load()
    const timer = window.setInterval(load, 300_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [role, organizationId])
  if (loading && !data) return <div className="mx-4 mt-3 rounded-lg border border-border-default bg-surface-primary px-4 py-3 text-xs text-text-muted lg:mx-6">Loading continuous intelligence...</div>
  if (!data) return null
  const risks = Array.isArray(data.risks) ? data.risks : []
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
  return <section className="mx-4 mt-3 rounded-lg border border-border-default bg-surface-primary px-4 py-3 lg:mx-6" aria-label="Continuous intelligence">
    <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-accent-primary" /><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Daily intelligence · {data.date}</p><RefreshCw className="ml-auto h-3.5 w-3.5 text-text-disabled" /></div>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      <div className="flex gap-2 text-sm text-text-secondary"><AlertTriangle className="mt-0.5 h-4 w-4 text-status-warning" /><span>{risks.length ? `${risks.length} risk signal${risks.length === 1 ? '' : 's'} need attention.` : 'No active risk signals detected.'}</span></div>
      <div className="text-sm text-text-secondary">{recommendations.length ? String((recommendations[0] as Record<string, unknown>).action || 'Review your next recommended action.') : 'No new action recommendation.'}</div>
    </div>
  </section>
}

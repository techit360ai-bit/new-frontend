import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { fetchDailyIntelligence, fetchMatchingAccess, type DailyIntelligence, type MatchingAccess } from '@/lib/api/recommendationIntelligence'

export function ContinuousIntelligencePanel({ role, organizationId }: { role: 'founder' | 'collaborator' | 'investor' | 'organisation'; organizationId?: string }) {
  const [data, setData] = useState<DailyIntelligence['intelligence'] | null>(null)
  const [access, setAccess] = useState<MatchingAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteDismissed, setNoteDismissed] = useState(false)
  useEffect(() => {
    try { setNoteDismissed(sessionStorage.getItem(`techit:matching-access-note:${role}`) === '1') } catch { setNoteDismissed(false) }
    let active = true
    const load = () => Promise.allSettled([fetchDailyIntelligence({ role, organizationId }), fetchMatchingAccess(role)])
      .then(([daily, entitlement]) => {
        if (!active) return
        setData(daily.status === 'fulfilled' ? daily.value.intelligence : null)
        setAccess(entitlement.status === 'fulfilled' ? entitlement.value : null)
      }).finally(() => { if (active) setLoading(false) })
    void load()
    const timer = window.setInterval(load, 300_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [role, organizationId])
  if (loading && !data) return <div className="mx-4 mt-3 rounded-lg border border-border-default bg-surface-primary px-4 py-3 text-xs text-text-muted lg:mx-6">Loading continuous intelligence...</div>
  if (!data) return null
  const risks = Array.isArray(data.risks) ? data.risks : []
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
  const dismissNote = () => { setNoteDismissed(true); try { sessionStorage.setItem(`techit:matching-access-note:${role}`, '1') } catch { /* storage unavailable */ } }
  return <section className="mx-4 mt-3 rounded-lg border border-border-default bg-surface-primary px-4 py-3 lg:mx-6" aria-label="Continuous intelligence">
    <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-accent-primary" /><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Daily intelligence · {data.date}</p><RefreshCw className="ml-auto h-3.5 w-3.5 text-text-disabled" /></div>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      <div className="flex gap-2 text-sm text-text-secondary"><AlertTriangle className="mt-0.5 h-4 w-4 text-status-warning" /><span>{risks.length ? `${risks.length} risk signal${risks.length === 1 ? '' : 's'} need attention.` : 'No active risk signals detected.'}</span></div>
      <div className="text-sm text-text-secondary">{recommendations.length ? String((recommendations[0] as Record<string, unknown>).action || 'Review your next recommended action.') : 'No new action recommendation.'}</div>
      </div>
    {access && !noteDismissed && <div className="mt-3 flex items-start gap-2 rounded-md border border-status-info/20 bg-status-info/5 px-3 py-2 text-xs text-text-secondary" role="note">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-info" aria-hidden="true" />
      <p className="min-w-0 flex-1">{access.message} Visibility: {access.visibility} ({access.verification.tier}). {access.funding.subscriptionActive ? `Subscription active${access.funding.plan ? ` · ${access.funding.plan}` : ''}.` : 'No active subscription.'} Credits: {access.funding.credits}. Current matching breadth: up to {access.matchLimit} results.</p>
      <button type="button" onClick={dismissNote} className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-secondary hover:text-text-primary" aria-label="Dismiss matching access note" title="Dismiss note"><X className="h-3.5 w-3.5" /></button>
    </div>}
  </section>
}

import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { fetchDailyIntelligence, fetchMatchingAccess, type DailyIntelligence, type MatchingAccess } from '@/lib/api/recommendationIntelligence'

export function ContinuousIntelligencePanel({ role, organizationId, className }: { role: 'founder' | 'collaborator' | 'investor' | 'organisation'; organizationId?: string; className?: string }) {
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
  if (loading && !data) return <div className={className || "mx-4 mt-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-5 py-4 text-xs text-slate-400 lg:mx-6"}>Loading continuous intelligence...</div>
  if (!data) return null
  const risks = Array.isArray(data.risks) ? data.risks : []
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : []
  const dismissNote = () => { setNoteDismissed(true); try { sessionStorage.setItem(`techit:matching-access-note:${role}`, '1') } catch { /* storage unavailable */ } }
  return <section className={className || "mx-4 mt-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-5 py-4 shadow-xl lg:mx-6"} aria-label="Continuous intelligence">

    <div className="flex items-center gap-2.5"><div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400 ring-1 ring-emerald-500/20"><Activity className="h-4 w-4" /></div><p className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-bricolage">Daily intelligence · {data.date}</p><RefreshCw className="ml-auto h-3.5 w-3.5 text-slate-500" /></div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-800/60 bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-200"><AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" /><span>{risks.length ? `${risks.length} risk signal${risks.length === 1 ? '' : 's'} need attention.` : 'No active risk signals detected.'}</span></div>
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-800/60 bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-200"><span>{recommendations.length ? String((recommendations[0] as Record<string, unknown>).action || 'Review your next recommended action.') : 'No new action recommendation.'}</span></div>
    </div>
    {access && !noteDismissed && <div className="mt-3 flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-950/30 px-4 py-3 text-xs text-slate-300" role="note">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
      <p className="min-w-0 flex-1">{access.message} Visibility: <span className="font-semibold text-slate-100">{access.visibility} ({access.verification.tier})</span>. {access.funding.subscriptionActive ? `Subscription active${access.funding.plan ? ` · ${access.funding.plan}` : ''}.` : 'No active subscription.'} Credits: {access.funding.credits}. Matching limit: up to {access.matchLimit} results.</p>
      <button type="button" onClick={dismissNote} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors" aria-label="Dismiss matching access note" title="Dismiss note"><X className="h-3.5 w-3.5" /></button>
    </div>}
  </section>
}

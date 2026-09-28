import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowRight, CreditCard, Sparkles, X } from 'lucide-react'
import type { TvceDecision } from '@/lib/api/tvce'

export function ValueUnlockModal({ decision, onClose }: { decision: TvceDecision; onClose?: () => void }) {
  useEffect(() => {
    if (!onClose) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  const outcomes = decision.value?.outcomes || []
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}>
    <section className="relative w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-slate-900/90 backdrop-blur-xl p-6 text-white shadow-2xl ring-1 ring-emerald-500/20" role="dialog" aria-modal="true" aria-labelledby="tvce-value-unlock-title" aria-live="polite">
    {onClose && <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors" aria-label="Close value unlock dialog"><X className="h-5 w-5" /></button>}
    <div className="flex items-start gap-3.5 pr-8"><div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 ring-1 ring-emerald-500/20 shrink-0"><Sparkles className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-bricolage">Value unlock</p><h2 id="tvce-value-unlock-title" className="mt-1 font-bricolage text-xl font-bold text-slate-100">{decision.value?.title || 'Continue your TechIT workflow'}</h2></div></div>
    <p className="mt-3.5 text-sm text-slate-300 leading-relaxed">{decision.code === 'role_required' ? 'Activate the relevant role context to continue this capability.' : decision.code === 'account_purchase_required' ? 'One successful credit purchase or subscription activates paid access across your account roles.' : decision.code === 'role_funding_required' ? 'This role requires a higher funding level than a basic account purchase.' : 'Your work is preserved. Choose the smallest option that fits this next step.'}</p>
    {outcomes.length > 0 && <ul className="mt-4 space-y-2 text-sm text-slate-200">{outcomes.map(outcome => <li key={outcome} className="flex items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">✓</span><span>{outcome}</span></li>)}</ul>}
    <div className="mt-6 flex flex-wrap items-center gap-3"><Link className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20" to="/wallet"><CreditCard className="h-4 w-4" />Continue with usage credits</Link><Link className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors" to="/wallet?view=plans">View plans <ArrowRight className="h-4 w-4" /></Link>{onClose && <button type="button" onClick={onClose} className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">Not now</button>}</div>
    {decision.availableCredits !== undefined && <p className="mt-4 text-xs text-slate-400">Available usage credits: <span className="font-semibold text-emerald-400">{decision.availableCredits}</span>{decision.usageEstimateRequired ? ' · runtime usage is estimated when the operation starts' : ''}</p>}
    </section>
  </div>
}

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
  const credits = decision.requiredCredits || decision.minimumRoleCredits || 0
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.() }}>
    <section className="relative w-full max-w-xl rounded-xl border border-slate-700 bg-slate-950 p-6 text-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="tvce-value-unlock-title" aria-live="polite">
    {onClose && <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close value unlock dialog"><X className="h-5 w-5" /></button>}
    <div className="flex items-start gap-3 pr-8"><Sparkles className="mt-1 h-5 w-5 shrink-0 text-emerald-400" /><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Value unlock</p><h2 id="tvce-value-unlock-title" className="mt-1 text-xl font-semibold">{decision.value?.title || 'Continue your TechIT workflow'}</h2></div></div>
    <p className="mt-3 text-sm text-slate-300">{decision.code === 'role_required' ? 'Activate the relevant role context to continue this capability.' : decision.code === 'account_purchase_required' ? 'One successful credit purchase or subscription activates paid access across your account roles.' : decision.code === 'role_funding_required' ? 'This role requires a higher funding level than a basic account purchase.' : 'Your work is preserved. Choose the smallest option that fits this next step.'}</p>
    {outcomes.length > 0 && <ul className="mt-4 space-y-2 text-sm text-slate-200">{outcomes.map(outcome => <li key={outcome} className="flex gap-2"><span className="text-emerald-400">✓</span><span>{outcome}</span></li>)}</ul>}
    <div className="mt-5 flex flex-wrap gap-3"><Link className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black" to="/wallet"><CreditCard className="h-4 w-4" />{credits > 0 ? `Continue with ${credits} credits` : 'View access options'}</Link><Link className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-white" to="/wallet?view=plans">View plans <ArrowRight className="h-4 w-4" /></Link>{onClose && <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300">Not now</button>}</div>
    {decision.availableCredits !== undefined && <p className="mt-4 text-xs text-slate-400">Available: {decision.availableCredits} credits{decision.estimatedAdditionalCredits ? ` · estimated shortfall: ${decision.estimatedAdditionalCredits}` : ''}</p>}
    </section>
  </div>
}

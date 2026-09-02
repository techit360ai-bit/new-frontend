import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { checkCapability, type CapabilityDecision } from '@/lib/api/authorization'
import { evaluatePaywall, type TvceDecision } from '@/lib/api/tvce'
import { ValueUnlockModal } from './ValueUnlockModal'

export function CapabilityGate({ capability, role, children }: { capability: string; role?: string; children: ReactNode }) {
  const [decision, setDecision] = useState<CapabilityDecision | null>(null)
  const [tvce, setTvce] = useState<TvceDecision | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => { let active = true; Promise.all([checkCapability(capability, role), evaluatePaywall({ capability, role })]).then(([value, paywall]) => { if (!active) return; setDecision(value); setTvce(paywall) }).catch(() => active && setError(true)); return () => { active = false } }, [capability, role])
  if (!decision && !error) return <div className="min-h-48 animate-pulse rounded-xl bg-slate-900/60" />
  if (decision?.allowed) return <>{children}</>
  const verification = decision?.code === 'verification_required'; const mfa = decision?.code === 'mfa_required'; const funding = ['credits_required', 'subscription_or_credits_required', 'active_subscription_required', 'plan_capability_not_included', 'account_purchase_required', 'role_funding_required', 'insufficient_credits'].includes(decision?.code || '')
  if (tvce && !tvce.allowed) return <ValueUnlockModal decision={tvce} />
  return <div className="mx-auto my-8 max-w-xl rounded-2xl border border-slate-700 bg-slate-950 p-6 text-center shadow-xl">
    <ShieldCheck className="mx-auto h-10 w-10 text-emerald-400" /><h2 className="mt-4 text-xl font-semibold text-white">Unlock this capability</h2>
    <p className="mt-2 text-sm text-slate-300">{verification ? `This capability requires ${decision?.policy?.assurance || 'additional'} verification.` : mfa ? 'Confirm your identity with multi-factor authentication.' : funding ? 'Your current plan or credit balance does not include this capability.' : 'This capability is not available in the current role context.'}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-3">
      {verification && <Link className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black" to={`/verification/${role || 'investor'}?capability=${encodeURIComponent(capability)}`}>Verify profile</Link>}
      {mfa && <Link className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-black" to="/security/mfa">Set up MFA</Link>}
      {funding && <Link className="rounded-lg border border-slate-600 px-4 py-2 text-white" to="/wallet">View plans and credits</Link>}
    </div>
  </div>
}

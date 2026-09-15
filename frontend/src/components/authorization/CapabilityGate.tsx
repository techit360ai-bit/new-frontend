import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { checkCapability, type CapabilityDecision } from '@/lib/api/authorization'

export function CapabilityGate({ capability, role, children }: { capability: string; role?: string; children: ReactNode }) {
  const [decision, setDecision] = useState<CapabilityDecision | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => { let active = true; checkCapability(capability, role).then(value => active && setDecision(value)).catch(() => active && setError(true)); return () => { active = false } }, [capability, role])
  if (!decision && !error) return <div className="min-h-48 animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.04]" />
  if (decision?.allowed) return <>{children}</>
  const verification = decision?.code === 'verification_required'; const mfa = decision?.code === 'mfa_required'; const funding = ['credits_required', 'subscription_or_credits_required', 'active_subscription_required', 'plan_capability_not_included'].includes(decision?.code || '')
  return <div className="mx-auto my-8 max-w-xl rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 text-center shadow-sm">
    <ShieldCheck className="mx-auto h-10 w-10 text-[#20C997]" /><h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Unlock this capability</h2>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{verification ? `This capability requires ${decision?.policy?.assurance || 'additional'} verification.` : mfa ? 'Confirm your identity with multi-factor authentication.' : funding ? 'Your current plan or credit balance does not include this capability.' : 'This capability is not available in the current role context.'}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-3">
      {verification && <Link className="rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 py-2 font-bold text-slate-950 shadow-sm transition-all text-sm" to={`/verification/${role || 'investor'}?capability=${encodeURIComponent(capability)}`}>Verify profile</Link>}
      {mfa && <Link className="rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 py-2 font-bold text-slate-950 shadow-sm transition-all text-sm" to="/security/mfa">Set up MFA</Link>}
      {funding && <Link className="rounded-xl border border-black/[0.08] dark:border-white/10 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all" to="/wallet">View plans and credits</Link>}
    </div>
  </div>
}

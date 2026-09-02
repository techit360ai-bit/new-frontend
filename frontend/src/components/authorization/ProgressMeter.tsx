import { useEffect, useState } from 'react'
import { ArrowUpRight, Gauge } from 'lucide-react'
import { fetchNextBestAction, fetchProgress, type TvceProgress } from '@/lib/api/tvce'

export function ProgressMeter() {
  const [progress, setProgress] = useState<TvceProgress | null>(null)
  const [next, setNext] = useState<{ action: string; reason: string; expectedValue: string; creditCost: number } | null>(null)
  useEffect(() => { let active = true; Promise.all([fetchProgress(), fetchNextBestAction()]).then(([meter, action]) => { if (!active) return; setProgress(meter); setNext(action) }).catch(() => undefined); return () => { active = false } }, [])
  if (!progress) return null
  const rows = [['Idea clarity', progress.meter.ideaClarity], ['Validation', progress.meter.validation], ['Execution readiness', progress.meter.executionReadiness], ['Investor readiness', progress.meter.investorReadiness]] as const
  return <section className="rounded-xl border bg-card p-5"><div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-primary" /><h2 className="font-semibold">TechIT progress</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label}><div className="mb-1 flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} /></div></div>)}</div>{next && <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Next best action</p><p className="mt-1 font-medium">{next.action.replaceAll('_', ' ')}</p><p className="mt-1 text-sm text-muted-foreground">{next.reason}</p></div><ArrowUpRight className="h-4 w-4 text-primary" /></div><p className="mt-2 text-xs text-muted-foreground">{next.expectedValue}{next.creditCost ? ` · estimated ${next.creditCost} credits` : ''}</p></div>}</section>
}

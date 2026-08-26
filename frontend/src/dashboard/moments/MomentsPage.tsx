import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { listMoments, type TechitMoment } from '@/lib/api/moments';
import { TechitMomentCard } from '@/components/moments/TechitMomentCard';

export default function MomentsPage() {
  const [moments, setMoments] = useState<TechitMoment[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; listMoments().then(result => { if (active) setMoments(result.moments || []); }).finally(() => active && setLoading(false)); return () => { active = false; }; }, []);
  return <main className="min-h-screen bg-background px-5 py-12 text-text-primary"><div className="mx-auto max-w-5xl"><div className="flex items-center gap-3"><Sparkles className="h-6 w-6 text-accent-primary" /><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-primary">No idea should be lost</p><h1 className="mt-1 text-3xl font-semibold">TechIT Moments</h1></div></div><p className="mt-4 max-w-2xl text-text-muted">Automatically generated cards for meaningful progress across your TechIT journey. Metrics come from your persisted platform activity.</p>{loading ? <div className="mt-10 h-40 animate-pulse rounded-xl bg-card" /> : moments.length ? <div className="mt-10 grid gap-6">{moments.map(moment => <TechitMomentCard key={moment.id} moment={moment} />)}</div> : <div className="mt-10 rounded-xl border border-dashed border-border-default p-10 text-center text-text-muted">Complete a project, contribution, opportunity, or venture milestone to generate your first Moment.</div>}</div></main>;
}

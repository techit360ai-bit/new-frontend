import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getPublicMoment, recordMomentVisit, type TechitMoment } from '@/lib/api/moments';
import { TechitMomentCard } from '@/components/moments/TechitMomentCard';

export default function PublicMomentPage() {
  const { slug = '' } = useParams(); const [search] = useSearchParams(); const [moment, setMoment] = useState<TechitMoment | null>(null); const [missing, setMissing] = useState(false);
  useEffect(() => { let active = true; getPublicMoment(slug).then(result => { if (active) { setMoment(result.moment); void recordMomentVisit(slug, search.get('ref'), search.get('source') || 'direct'); } }).catch(() => active && setMissing(true)); return () => { active = false; }; }, [slug, search]);
  if (missing) return <main className="min-h-screen bg-background px-5 py-20 text-center text-text-primary"><h1 className="text-2xl font-semibold">This Moment is unavailable</h1><Link className="mt-4 inline-block text-accent-primary" to="/">Return to TechIT Network</Link></main>;
  if (!moment) return <main className="min-h-screen bg-background px-5 py-20 text-center text-text-muted">Loading Moment...</main>;
  return <main className="min-h-screen bg-background px-5 py-12 text-text-primary"><div className="mx-auto max-w-2xl"><TechitMomentCard moment={moment} publicView /><div className="mt-6 text-center"><Link to="/" className="text-sm font-medium text-accent-primary">Built and shared on TechIT Network</Link></div></div></main>;
}

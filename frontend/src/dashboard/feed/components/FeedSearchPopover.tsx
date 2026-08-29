import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchDiscovery, type DiscoverySearchResult, type RecommendationEntityType } from '@/lib/api/discovery';

const FILTERS: Array<{ label: string; type?: RecommendationEntityType }> = [
  { label: 'All' },
  { label: 'People', type: 'person' },
  { label: 'Startups', type: 'startup' },
  { label: 'Projects', type: 'project' },
  { label: 'Ideas', type: 'idea' },
  { label: 'Opportunities', type: 'opportunity' },
];

const ICONS: Record<string, string> = {
  person: 'People', startup: 'Startup', project: 'Project', idea: 'Idea', opportunity: 'Opportunity', organization: 'Organization', content: 'Post',
};

export function FeedSearchPopover({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<RecommendationEntityType | undefined>();
  const [results, setResults] = useState<DiscoverySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => { if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose(); };
    document.addEventListener('pointerdown', handlePointer);
    return () => document.removeEventListener('pointerdown', handlePointer);
  }, [onClose]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) { setResults([]); setSearched(false); setError(null); return; }
    const timer = window.setTimeout(() => {
      setLoading(true); setSearched(true); setError(null);
      searchDiscovery(value, { type: activeType, limit: 12, personalized: true })
        .then(response => setResults(response.results))
        .catch(err => { setResults([]); setError(err instanceof Error ? err.message : 'Feed search is unavailable.'); })
        .finally(() => setLoading(false));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [activeType, query]);

  return (
    <div ref={panelRef} className="absolute right-4 top-14 z-50 min-w-0 max-w-lg rounded-lg border border-border-default bg-bg-surface p-3 shadow-xl sm:right-6" style={{ width: 'min(94vw, 34rem)' }}>
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 shrink-0 text-text-muted" />
        <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search people, startups, projects, ideas..." className="h-9 min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted" />
        <button type="button" onClick={onClose} aria-label="Close feed search" className="rounded p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map(filter => <button key={filter.label} type="button" onClick={() => setActiveType(filter.type)} className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${activeType === filter.type ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-default text-text-secondary hover:text-text-primary'}`}>{filter.label}</button>)}
      </div>
      <div className="mt-2 max-h-[min(60vh,26rem)] overflow-y-auto">
        {loading && <p className="px-2 py-5 text-center text-sm text-text-muted">Searching TechIT...</p>}
        {!loading && error && <p className="px-2 py-5 text-center text-sm text-score-red">{error}</p>}
        {!loading && !error && searched && results.length === 0 && <p className="px-2 py-5 text-center text-sm text-text-muted">No matching TechIT records found.</p>}
        {!loading && !error && results.map(result => {
          const action = result.actions?.[0];
          return <div key={`${result.type}:${result.entityId}`} className="flex items-center gap-3 border-b border-border-default px-2 py-3 last:border-b-0"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-elevated text-[10px] font-semibold uppercase text-accent-primary">{(ICONS[result.type] || result.type).slice(0, 3)}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase text-text-muted">{ICONS[result.type] || result.type}</p><p className="truncate text-sm font-medium text-text-primary">{result.title}</p>{result.subtitle && <p className="truncate text-xs text-text-secondary">{result.subtitle}</p>}</div>{action && <Link to={action.href} onClick={onClose} aria-label={`${action.label}: ${result.title}`} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border-default px-2.5 py-1.5 text-xs font-semibold text-text-primary hover:border-accent-primary hover:text-accent-primary">{action.label}<ArrowUpRight className="h-3 w-3" /></Link>}</div>;
        })}
        {!loading && !searched && <p className="px-2 py-4 text-xs text-text-muted">Search the TechIT network from your feed.</p>}
      </div>
      <div className="mt-2 border-t border-border-default pt-2 text-right"><Link to="/feed/discover" onClick={onClose} className="text-xs font-medium text-accent-primary hover:underline">Open full Discover search</Link></div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { listRecommendations, type DiscoveryRecommendation } from '@/lib/api/discovery';

export function useExplorerRecommendations(type?: string) {
  const [rows, setRows] = useState<DiscoveryRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setRows([]);
    setError(null);
    listRecommendations({ surface: 'explorer', type, limit: 100 })
      .then(result => { if (alive) setRows(result.recommendations ?? []); })
      .catch((error: unknown) => { if (alive) setError(error instanceof Error ? error.message : 'Discovery could not be loaded.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [type, revision]);
  return { rows, loading, error, retry };
}

export function ExplorerDataState({ loading, error, empty, retry }: { loading: boolean; error: string | null; empty: boolean; retry: () => void }) {
  if (!loading && !error && !empty) return null;
  return <div role="status" className="rounded-2xl border border-black/10 bg-white/80 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
    {loading ? 'Loading live discovery...' : error ? `Discovery is unavailable: ${error}` : 'No results match these filters yet. Try another search or return when more entries are published.'}
    {error && <button type="button" onClick={retry} className="ml-3 min-h-11 rounded-xl border border-current px-4 font-semibold">Try again</button>}
  </div>;
}

/** Discovery destinations are internal app routes, never executable URLs. */
export function explorerDestination(value: string | undefined): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/feed/discover';
}

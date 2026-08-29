import { useCallback, useEffect, useState } from 'react'
import { Compass, RefreshCw, Search } from 'lucide-react'
import { RecommendationCard } from '../components/RecommendationCard'
import { PageEmptyState, PageErrorState, PageLoadingState } from '@/components/ui/page-state'
import {
  listRecommendations,
  recordRecommendationExposure,
  searchDiscovery,
  sendRecommendationFeedback,
  type DiscoveryRecommendation,
} from '@/lib/api/discovery'

const TABS = [
  { label: 'For You', type: '' },
  { label: 'People', type: 'person' },
  { label: 'Startups', type: 'startup' },
  { label: 'Projects', type: 'project' },
  { label: 'Ideas', type: 'idea' },
  { label: 'Opportunities', type: 'opportunity' },
  { label: 'Organizations', type: 'organization' },
]

export function DiscoveryPage() {
  const [activeType, setActiveType] = useState('')
  const [recommendations, setRecommendations] = useState<DiscoveryRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [personalized, setPersonalized] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    listRecommendations({ surface: 'discovery', type: activeType || undefined, limit: 30 })
      .then(result => {
        setRecommendations(result.recommendations)
        result.recommendations.forEach(item => { void recordRecommendationExposure(item.id, 'impression', 'discovery').catch(() => undefined) })
      })
      .catch(err => { setRecommendations([]); setError(err instanceof Error ? err.message : 'Discovery is unavailable.') })
      .finally(() => setLoading(false))
  }, [activeType])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const value = query.trim()
    if (!value) { load(); return }
    const timer = window.setTimeout(() => {
      setLoading(true)
      searchDiscovery(value, { type: activeType || undefined, limit: 50, personalized })
        .then(result => setRecommendations(result.results.map((entity, index) => ({
          id: `search:${entity.type}:${entity.entityId}`,
          entityType: entity.type,
          entityId: entity.entityId,
          score: entity.score,
          rank: index + 1,
          reasonType: personalized ? 'PERSONALIZED_SEARCH' : 'SEARCH_MATCH',
          reasonText: personalized ? 'Ranked using your role and interests. Complete results remain available.' : 'Matches your search terms without personalization.',
          entity,
        }))))
        .catch(err => { setRecommendations([]); setError(err instanceof Error ? err.message : 'Search is unavailable.') })
        .finally(() => setLoading(false))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [activeType, load, personalized, query])

  const dismiss = (recommendation: DiscoveryRecommendation) => {
    setRecommendations(current => current.filter(item => item.id !== recommendation.id))
    void sendRecommendationFeedback(recommendation.id, 'not_interested').catch(() => load())
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Discover</h1>
          <p className="mt-1 text-sm text-text-secondary">People and opportunities where you can create value next.</p>
        </div>
        <button type="button" onClick={load} className="rounded-md border border-border-default p-2 text-text-secondary hover:bg-bg-elevated" aria-label="Refresh recommendations" title="Refresh recommendations">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-border-default pb-px">
        {TABS.map(tab => (
          <button key={tab.label} type="button" onClick={() => setActiveType(tab.type)} className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${activeType === tab.type ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search people, startups, projects, ideas, and opportunities" className="h-10 w-full rounded-md border border-border-default bg-bg-surface pl-9 pr-3 text-sm text-text-primary outline-none focus:border-accent-primary" />
        </label>
        <label className="flex h-10 items-center gap-2 text-xs text-text-secondary">
          <input type="checkbox" checked={personalized} onChange={event => setPersonalized(event.target.checked)} className="h-4 w-4 accent-accent-primary" />
          Personalized ranking
        </label>
      </div>

      {loading && <PageLoadingState label="Loading recommendations" />}
      {!loading && error && <PageErrorState title="Recommendations unavailable" description={error} action={<button type="button" onClick={load} className="min-h-11 rounded-md border border-border-default px-4 text-sm font-medium text-text-primary hover:bg-bg-elevated">Try again</button>} />}
      {!loading && !error && recommendations.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map(item => <RecommendationCard key={item.id} recommendation={item} onDismiss={query ? undefined : dismiss} onAction={(rec, action) => { if (!rec.id.startsWith('search:')) void recordRecommendationExposure(rec.id, action, 'discovery').catch(() => undefined) }} />)}
        </div>
      )}
      {!loading && !error && recommendations.length === 0 && (
        <PageEmptyState title="No persisted matches yet" description="Recommendations will appear as relevant TechIT members and opportunities become available." action={<Compass className="h-5 w-5 text-text-muted" aria-hidden="true" />} />
      )}
    </div>
  )
}

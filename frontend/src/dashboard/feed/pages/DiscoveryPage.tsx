import { useCallback, useEffect, useState } from 'react'
import { Compass, RefreshCw } from 'lucide-react'
import { RecommendationCard } from '../components/RecommendationCard'
import {
  listRecommendations,
  recordRecommendationExposure,
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

      {loading && <div className="py-16 text-center text-sm text-text-secondary">Loading recommendations...</div>}
      {!loading && error && <div className="py-16 text-center text-sm text-score-red">{error}</div>}
      {!loading && !error && recommendations.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map(item => <RecommendationCard key={item.id} recommendation={item} onDismiss={dismiss} onAction={(rec, action) => void recordRecommendationExposure(rec.id, action, 'discovery').catch(() => undefined)} />)}
        </div>
      )}
      {!loading && !error && recommendations.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Compass className="h-8 w-8 text-text-muted" />
          <p className="mt-3 text-sm font-medium text-text-primary">No persisted matches yet</p>
          <p className="mt-1 max-w-md text-sm text-text-secondary">Recommendations will appear as relevant TechIT members and opportunities become available.</p>
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from "react";
import { Compass, RefreshCw, Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { RecommendationCard } from "../components/RecommendationCard";
import { PageEmptyState, PageErrorState, PageLoadingState } from "@/components/ui/page-state";
import {
  listRecommendations,
  recordRecommendationExposure,
  searchDiscovery,
  sendRecommendationFeedback,
  type DiscoveryRecommendation,
} from "@/lib/api/discovery";

const TABS = [
  { label: "For You", type: "" },
  { label: "People", type: "person" },
  { label: "Startups", type: "startup" },
  { label: "Projects", type: "project" },
  { label: "Ideas", type: "idea" },
  { label: "Opportunities", type: "opportunity" },
  { label: "Organizations", type: "organization" },
];

export function DiscoveryPage() {
  const [activeType, setActiveType] = useState("");
  const [recommendations, setRecommendations] = useState<DiscoveryRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [personalized, setPersonalized] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listRecommendations({ surface: "discovery", type: activeType || undefined, limit: 30 })
      .then((result) => {
        setRecommendations(result.recommendations);
        result.recommendations.forEach((item) => {
          void recordRecommendationExposure(item.id, "impression", "discovery").catch(() => undefined);
        });
      })
      .catch((err) => {
        setRecommendations([]);
        setError(err instanceof Error ? err.message : "Discovery is unavailable.");
      })
      .finally(() => setLoading(false));
  }, [activeType]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      load();
      return;
    }
    const timer = window.setTimeout(() => {
      setLoading(true);
      searchDiscovery(value, { type: activeType || undefined, limit: 50, personalized })
        .then((result) =>
          setRecommendations(
            result.results.map((entity, index) => ({
              id: `search:${entity.type}:${entity.entityId}`,
              entityType: entity.type,
              entityId: entity.entityId,
              score: entity.score,
              rank: index + 1,
              reasonType: personalized ? "PERSONALIZED_SEARCH" : "SEARCH_MATCH",
              reasonText: personalized
                ? "Ranked using your role and interests. Complete results remain available."
                : "Matches your search terms without personalization.",
              entity,
            }))
          )
        )
        .catch((err) => {
          setRecommendations([]);
          setError(err instanceof Error ? err.message : "Search is unavailable.");
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activeType, load, personalized, query]);

  const dismiss = (recommendation: DiscoveryRecommendation) => {
    setRecommendations((current) => current.filter((item) => item.id !== recommendation.id));
    void sendRecommendationFeedback(recommendation.id, "not_interested").catch(() => load());
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6 font-bricolage">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ecosystem Discovery</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Discover founders, startups, projects, and opportunities across TechIT.</p>
        </div>

        <button
          type="button"
          onClick={load}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-white/[0.05] p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 transition-colors shadow-sm self-start sm:self-auto"
          aria-label="Refresh recommendations"
          title="Refresh recommendations"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#0066ff]" : ""}`} />
        </button>
      </div>

      {/* Filter Control Surface */}
      <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-4 backdrop-blur-xl space-y-4 shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeType === tab.type;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveType(tab.type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#0066ff] text-white shadow-md shadow-[#0066ff]/25"
                    : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, startups, projects, ideas, and opportunities..."
              className="h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#58a6ff] dark:focus:bg-white/10"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer shrink-0 self-start sm:self-auto">
            <input
              type="checkbox"
              checked={personalized}
              onChange={(e) => setPersonalized(e.target.checked)}
              className="h-4 w-4 rounded accent-[#0066ff]"
            />
            <span>Personalized AI ranking</span>
          </label>
        </div>
      </div>

      {/* Content Stream */}
      {loading && <PageLoadingState label="Loading recommendations" />}

      {!loading && error && (
        <PageErrorState
          title="Recommendations unavailable"
          description={error}
          action={
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-95"
            >
              Try again
            </button>
          }
        />
      )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((item) => (
            <RecommendationCard
              key={item.id}
              recommendation={item}
              onDismiss={query ? undefined : dismiss}
              onAction={(rec, action) => {
                if (!rec.id.startsWith("search:")) {
                  void recordRecommendationExposure(rec.id, action, "discovery").catch(() => undefined);
                }
              }}
            />
          ))}
        </div>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <PageEmptyState
          title="No persisted matches found"
          description="Recommendations will appear as relevant members and opportunities become available."
          action={<Compass className="h-6 w-6 text-slate-400 dark:text-slate-500" aria-hidden="true" />}
        />
      )}
    </div>
  );
}

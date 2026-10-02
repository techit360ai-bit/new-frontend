import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, RefreshCw, Send, Users, X } from "lucide-react";
import {
  fetchDemoDayPipeline,
  fetchInvestorMatches,
  pushToDealFlow,
  type DemoDayEntry,
  type DemoDayPipelineData,
  type InvestorMatch,
} from "@/lib/api/organization";

function EmptyPanel({ children }: { children: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border-default bg-background-primary px-6 text-center text-sm text-text-muted">
      {children}
    </div>
  );
}

export function DemoDayPipeline() {
  const [threshold, setThreshold] = useState(70);
  const [data, setData] = useState<DemoDayPipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [matchesFor, setMatchesFor] = useState<string | null>(null);
  const [matches, setMatches] = useState<InvestorMatch[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDemoDayPipeline(threshold));
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Demo Day pipeline is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePublish(entry: DemoDayEntry) {
    setPublishing(entry.id);
    try {
      await pushToDealFlow(entry.id);
      await load();
    } catch {
      // keep prior state; error surfaces on refresh
    } finally {
      setPublishing(null);
    }
  }

  async function handleMatches(entry: DemoDayEntry) {
    if (matchesFor === entry.id) {
      setMatchesFor(null);
      return;
    }
    setMatchesFor(entry.id);
    setMatches([]);
    try {
      setMatches(await fetchInvestorMatches(entry.id));
    } catch {
      setMatches([]);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3 text-sm text-text-secondary">
          Readiness threshold (GSIS ≥ {threshold})
          <input
            type="range"
            min={40}
            max={90}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="w-48"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-primary px-3 py-2 text-sm font-medium text-text-secondary hover:bg-background-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-status-error bg-status-error-soft px-4 py-3 text-sm text-status-error">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-lg border border-border-default bg-surface-primary px-6 py-12 text-center text-sm text-text-muted">
          Loading pipeline...
        </div>
      ) : data && data.pipeline.length > 0 ? (
        <div className="space-y-4">
          {data.pipeline.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">{entry.title}</p>
                    {entry.investorReady && (
                      <span className="rounded-full bg-status-success-soft px-2 py-0.5 text-xs font-medium text-status-success">
                        Investor-ready
                      </span>
                    )}
                    {entry.published && (
                      <span className="rounded-full bg-status-info-soft px-2 py-0.5 text-xs font-medium text-brand-accent">
                        In deal flow
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {entry.industry || "—"} · {entry.stage} · GSIS {entry.gsisScore} · {entry.readyPct}% ready
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleMatches(entry)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface-primary px-3 py-2 text-sm font-medium text-text-secondary hover:bg-background-primary"
                  >
                    <Users className="h-4 w-4" /> Investors
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePublish(entry)}
                    disabled={entry.published || publishing === entry.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-2 text-sm font-medium text-white hover:bg-brand-accent disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {entry.published ? "Published" : publishing === entry.id ? "Pushing..." : "Push to Deal Flow"}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {entry.checklist.map((item) => (
                  <span
                    key={item.key}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.met ? "bg-status-success-soft text-status-success" : "bg-surface-secondary text-text-muted"
                    }`}
                  >
                    {item.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {item.label}
                  </span>
                ))}
              </div>

              {matchesFor === entry.id && (
                <div className="mt-4 border-t border-border-subtle pt-4">
                  {matches.length > 0 ? (
                    <div className="space-y-2">
                      {matches.map((match) => (
                        <div key={match.investorId} className="flex items-center justify-between text-sm">
                          <span className="text-text-primary">{match.name}</span>
                          <span className="text-text-muted">
                            {match.reasons.join(", ") || "Match"} · {match.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">No platform investors match yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyPanel>No projects yet. Create organization projects to build a demo-day pipeline.</EmptyPanel>
      )}
    </div>
  );
}

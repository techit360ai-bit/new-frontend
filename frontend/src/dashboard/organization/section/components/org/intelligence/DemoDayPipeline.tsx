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
    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 text-center text-sm text-gray-500">
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
        <label className="flex items-center gap-3 text-sm text-gray-700">
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
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Loading pipeline...
        </div>
      ) : data && data.pipeline.length > 0 ? (
        <div className="space-y-4">
          {data.pipeline.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{entry.title}</p>
                    {entry.investorReady && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Investor-ready
                      </span>
                    )}
                    {entry.published && (
                      <span className="rounded-full bg-[#20C997]/10 px-2 py-0.5 text-xs font-medium text-[#20C997]">
                        In deal flow
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {entry.industry || "—"} · {entry.stage} · GSIS {entry.gsisScore} · {entry.readyPct}% ready
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleMatches(entry)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Users className="h-4 w-4" /> Investors
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePublish(entry)}
                    disabled={entry.published || publishing === entry.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#20C997] px-3 py-2 text-sm font-medium text-white hover:bg-[#1ab386] disabled:opacity-50"
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
                      item.met ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {item.label}
                  </span>
                ))}
              </div>

              {matchesFor === entry.id && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {matches.length > 0 ? (
                    <div className="space-y-2">
                      {matches.map((match) => (
                        <div key={match.investorId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-900">{match.name}</span>
                          <span className="text-gray-500">
                            {match.reasons.join(", ") || "Match"} · {match.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No platform investors match yet.</p>
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

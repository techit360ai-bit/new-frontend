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
    <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
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
      // keep prior state
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
    <div className="space-y-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
          Readiness threshold (GSIS ≥ {threshold})
          <input
            type="range"
            min={40}
            max={90}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            className="w-48 accent-[#20C997]"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#20C997] hover:border-[#20C997]/30 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 text-[#20C997] ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-6 py-16 text-center text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm">
          Loading pipeline...
        </div>
      ) : data && data.pipeline.length > 0 ? (
        <div className="space-y-4">
          {data.pipeline.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{entry.title}</p>
                    {entry.investorReady && (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Investor-ready
                      </span>
                    )}
                    {entry.published && (
                      <span className="rounded-full bg-[#20C997]/10 border border-[#20C997]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#20C997]">
                        In deal flow
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {entry.industry || "—"} · {entry.stage} · GSIS {entry.gsisScore} · {entry.readyPct}% ready
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleMatches(entry)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#20C997] hover:border-[#20C997]/30 transition-all"
                  >
                    <Users className="h-4 w-4" /> Investors
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePublish(entry)}
                    disabled={entry.published || publishing === entry.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-3.5 py-2 text-xs font-bold text-slate-950 disabled:opacity-50 transition-all shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {entry.published ? "Published" : publishing === entry.id ? "Pushing..." : "Push to Deal Flow"}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {entry.checklist.map((item) => (
                  <span
                    key={item.key}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      item.met
                        ? "bg-[#20C997]/10 text-[#20C997] border-[#20C997]/20"
                        : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {item.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {item.label}
                  </span>
                ))}
              </div>

              {matchesFor === entry.id && (
                <div className="mt-4 border-t border-black/[0.05] dark:border-white/10 pt-4">
                  {matches.length > 0 ? (
                    <div className="space-y-2">
                      {matches.map((match) => (
                        <div key={match.investorId} className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-900 dark:text-white">{match.name}</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {match.reasons.join(", ") || "Match"} · {match.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">No platform investors match yet.</p>
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

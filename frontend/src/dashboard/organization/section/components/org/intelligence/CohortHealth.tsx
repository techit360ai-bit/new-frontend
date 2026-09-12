import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Clock, RefreshCw, Sparkles, TrendingDown } from "lucide-react";
import {
  fetchCohortHealth,
  fetchInterventions,
  type CohortHealthData,
  type HealthBand,
  type InterventionsData,
} from "@/lib/api/organization";

const BAND_STYLES: Record<HealthBand, { dot: string; text: string; label: string }> = {
  green: { dot: "bg-[#20C997]", text: "text-[#20C997]", label: "Healthy" },
  amber: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: "At risk" },
  red: { dot: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", label: "Critical" },
};

function EmptyPanel({ children }: { children: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
      {children}
    </div>
  );
}

export function CohortHealth() {
  const [data, setData] = useState<CohortHealthData | null>(null);
  const [interventions, setInterventions] = useState<InterventionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [interventionsLoading, setInterventionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<HealthBand | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await fetchCohortHealth({
          stage: stage || undefined,
          riskLevel: riskLevel || undefined,
        }),
      );
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Cohort health is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [stage, riskLevel]);

  const loadInterventions = useCallback(async () => {
    setInterventionsLoading(true);
    try {
      setInterventions(await fetchInterventions());
    } catch {
      setInterventions(null);
    } finally {
      setInterventionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadInterventions();
  }, [loadInterventions]);

  const summaryCards = data
    ? [
        { label: "Startups", value: data.summary.total, tone: "text-slate-900 dark:text-white" },
        { label: "Healthy", value: data.summary.green, tone: "text-[#20C997]" },
        { label: "At risk", value: data.summary.amber, tone: "text-amber-500 dark:text-amber-400" },
        { label: "Critical", value: data.summary.red, tone: "text-rose-500 dark:text-rose-400" },
        { label: "Avg GSIS", value: data.summary.avgGsis, tone: "text-[#20C997]" },
      ]
    : [];

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111111] px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
          >
            <option value="">All stages</option>
            {(data?.stages ?? []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={riskLevel}
            onChange={(event) => setRiskLevel(event.target.value as HealthBand | "")}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111111] px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
          >
            <option value="">All health</option>
            <option value="green">Healthy</option>
            <option value="amber">At risk</option>
            <option value="red">Critical</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            void load();
            void loadInterventions();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#20C997] hover:border-[#20C997]/30 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 text-[#20C997] ${loading ? "animate-spin" : ""}`} />
          Refresh
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
          Loading cohort health...
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className={`mt-2 text-3xl font-black font-mono ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Ranked cohort grid */}
            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm lg:col-span-2">
              <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Portfolio ranked by GSIS</h2>
              {data.cohort.length > 0 ? (
                <div className="space-y-3">
                  {data.cohort.map((row) => {
                    const band = BAND_STYLES[row.band];
                    return (
                      <div
                        key={row.id}
                        className="flex items-center gap-4 rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4"
                      >
                        <span className={`h-3 w-3 flex-shrink-0 rounded-full ${band.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{row.title}</p>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            {row.industry || "—"} · {row.stage} · {row.daysInactive}d inactive
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black font-mono text-slate-900 dark:text-white">{row.gsisScore}</p>
                          <p className={`text-[10px] font-bold ${band.text}`}>{band.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyPanel>
                  No cohort startups yet. Create organization projects to see health.
                </EmptyPanel>
              )}
            </section>

            {/* Alerts + AI interventions */}
            <div className="space-y-6">
              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <TrendingDown className="h-5 w-5 text-amber-500 dark:text-amber-400" /> Alerts
                </h2>
                {data.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {data.alerts.map((alert, index) => (
                      <div key={`${alert.projectId}-${index}`} className="flex items-start gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
                        <p>{alert.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyPanel>No active alerts.</EmptyPanel>
                )}
              </section>

              <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
                <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <Sparkles className="h-5 w-5 text-[#20C997]" /> Interventions
                </h2>
                {interventions && !interventions.aiAvailable && (
                  <p className="mb-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    AI recommendations unavailable — showing rule-based guidance.
                  </p>
                )}
                {interventionsLoading ? (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Analysing portfolio...</p>
                ) : interventions && interventions.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {interventions.recommendations.map((rec) => (
                      <div key={rec.projectId} className="rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{rec.title}</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{rec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyPanel>No interventions needed.</EmptyPanel>
                )}
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

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
  green: { dot: "bg-status-success", text: "text-status-success", label: "Healthy" },
  amber: { dot: "bg-status-warning", text: "text-status-warning", label: "At risk" },
  red: { dot: "bg-rose-500", text: "text-rose-700", label: "Critical" },
};

function EmptyPanel({ children }: { children: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border-default bg-background-primary px-6 text-center text-sm text-text-muted">
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
        { label: "Startups", value: data.summary.total, tone: "text-text-primary" },
        { label: "Healthy", value: data.summary.green, tone: "text-status-success" },
        { label: "At risk", value: data.summary.amber, tone: "text-status-warning" },
        { label: "Critical", value: data.summary.red, tone: "text-rose-600" },
        { label: "Avg GSIS", value: data.summary.avgGsis, tone: "text-brand-accent" },
      ]
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="rounded-lg border border-border-strong bg-surface-primary px-3 py-2 text-sm text-text-secondary"
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
            className="rounded-lg border border-border-strong bg-surface-primary px-3 py-2 text-sm text-text-secondary"
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
          className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-primary px-3 py-2 text-sm font-medium text-text-secondary hover:bg-background-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
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
          Loading cohort health...
        </div>
      ) : data ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {summaryCards.map((card) => (
              <div key={card.label} className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-sm">
                <p className="text-sm text-text-muted">{card.label}</p>
                <p className={`mt-2 text-3xl font-bold ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Ranked cohort grid */}
            <section className="rounded-lg border border-border-default bg-surface-primary p-6 shadow-sm lg:col-span-2">
              <h2 className="mb-4 text-lg font-bold text-text-primary">Portfolio ranked by GSIS</h2>
              {data.cohort.length > 0 ? (
                <div className="space-y-3">
                  {data.cohort.map((row) => {
                    const band = BAND_STYLES[row.band];
                    return (
                      <div
                        key={row.id}
                        className="flex items-center gap-4 rounded-lg border border-border-subtle p-4"
                      >
                        <span className={`h-3 w-3 flex-shrink-0 rounded-full ${band.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-text-primary">{row.title}</p>
                          <p className="text-xs text-text-muted">
                            {row.industry || "—"} · {row.stage} · {row.daysInactive}d inactive
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-text-primary">{row.gsisScore}</p>
                          <p className={`text-xs font-medium ${band.text}`}>{band.label}</p>
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
              <section className="rounded-lg border border-border-default bg-surface-primary p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text-primary">
                  <TrendingDown className="h-5 w-5 text-status-warning" /> Alerts
                </h2>
                {data.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {data.alerts.map((alert, index) => (
                      <div key={`${alert.projectId}-${index}`} className="flex items-start gap-2 text-sm">
                        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-warning" />
                        <p className="text-text-secondary">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyPanel>No active alerts.</EmptyPanel>
                )}
              </section>

              <section className="rounded-lg border border-border-default bg-surface-primary p-6 shadow-sm">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-text-primary">
                  <Sparkles className="h-5 w-5 text-brand-accent" /> Interventions
                </h2>
                {interventions && !interventions.aiAvailable && (
                  <p className="mb-3 text-xs text-text-muted">
                    AI recommendations unavailable — showing rule-based guidance.
                  </p>
                )}
                {interventionsLoading ? (
                  <p className="text-sm text-text-muted">Analysing portfolio...</p>
                ) : interventions && interventions.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {interventions.recommendations.map((rec) => (
                      <div key={rec.projectId} className="rounded-lg border border-border-subtle p-3">
                        <p className="text-sm font-medium text-text-primary">{rec.title}</p>
                        <p className="mt-1 text-sm text-text-muted">{rec.recommendation}</p>
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

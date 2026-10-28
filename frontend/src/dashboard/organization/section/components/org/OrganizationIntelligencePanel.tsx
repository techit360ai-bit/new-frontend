import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, HeartPulse, RefreshCw, Target } from "lucide-react";
import {
  fetchOrganizationActions,
  fetchOrganizationIntelligenceOverview,
  fetchOrganizationKpis,
  fetchOrganizationPulse,
  fetchOrganizationRisks,
  type OrganizationAction,
  type OrganizationHealth,
  type OrganizationKpi,
  type OrganizationPulse,
  type OrganizationRisk,
} from "@/lib/api/organizationIntelligence";

const DIMENSION_LABELS: Record<string, string> = {
  programPerformance: "Programs",
  startupPerformance: "Startups",
  memberEngagement: "Engagement",
  mentorship: "Mentorship",
  execution: "Execution",
  risk: "Risk posture",
};

function formatDate(value?: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function severityClass(value: string) {
  if (value === "critical") return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400";
  if (value === "high") return "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400";
  if (value === "low") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
}

function HealthPanel({ health }: { health: OrganizationHealth }) {
  return (
    <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm transition-all hover:border-[#20C997]/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Organization Health</p>
          <p className="mt-1 text-3xl font-black font-mono text-slate-900 dark:text-white">{health.score === null ? "—" : `${health.score}/100`}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#20C997]/10 flex items-center justify-center border border-[#20C997]/20">
          <HeartPulse className="h-5 w-5 text-[#20C997]" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
        {Object.entries(health.dimensions).map(([key, value]) => (
          <div key={key}>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">{DIMENSION_LABELS[key] || key}</span>
              <span className="font-bold text-slate-900 dark:text-white">{value === null ? "—" : value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-[#20C997]" style={{ width: `${value === null ? 0 : value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PulsePanel({ pulse }: { pulse: OrganizationPulse }) {
  const changes = [
    ["Startups updated", pulse.changes.startupsUpdated],
    ["Programs updated", pulse.changes.programsUpdated],
    ["Risks detected", pulse.changes.risksDetected],
    ["Actions created", pulse.changes.actionsCreated],
    ["Activities", pulse.changes.activities],
  ];
  return (
    <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm transition-all hover:border-[#20C997]/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Organization Pulse</p>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">What changed in the last 7 days</h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#20C997]/10 flex items-center justify-center border border-[#20C997]/20">
          <Activity className="h-5 w-5 text-[#20C997]" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {changes.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3 text-center">
            <p className="text-xl font-black font-mono text-slate-900 dark:text-white">{value}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">{label}</p>
          </div>
        ))}
      </div>
      {pulse.activity.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-black/[0.05] dark:border-white/10 pt-4">
          {pulse.activity.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-start gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              <Activity className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#20C997]" aria-hidden="true" />
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RiskPanel({ risks }: { risks: OrganizationRisk[] }) {
  return (
    <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Risks</h2>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{risks.length} open</span>
      </div>
      {risks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-4 py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          No open organization risks.
        </div>
      ) : (
        <div className="space-y-3">
          {risks.slice(0, 5).map((risk) => (
            <div key={risk.id} className="rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{risk.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${severityClass(risk.severity)}`}>{risk.severity}</span>
              </div>
              {risk.reason && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{risk.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ActionPanel({ actions }: { actions: OrganizationAction[] }) {
  return (
    <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-[#20C997]" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Actions</h2>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{actions.length} active</span>
      </div>
      {actions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-4 py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          No active organization actions.
        </div>
      ) : (
        <div className="space-y-3">
          {actions.slice(0, 5).map((action) => (
            <div key={action.id} className="flex items-start gap-3 rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{action.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{action.status.replaceAll("_", " ")} · {formatDate(action.dueDate)}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${severityClass(action.priority === "normal" ? "medium" : action.priority)}`}>{action.priority}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function KpiPanel({ kpis }: { kpis: OrganizationKpi[] }) {
  return (
    <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-[#20C997]" aria-hidden="true" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Defined KPIs</h2>
      </div>
      {kpis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-4 py-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          No organization KPIs have been defined.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {kpis.slice(0, 4).map((kpi) => {
            const latest = kpi.values[0]?.value;
            return (
              <div key={kpi.id} className="rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{kpi.name}</p>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{kpi.unit || "value"}</span>
                </div>
                <p className="mt-2 text-2xl font-black font-mono text-slate-900 dark:text-white">{latest === undefined ? "—" : latest}</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Target: {kpi.target === null || kpi.target === undefined ? "not set" : kpi.target}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function OrganizationIntelligencePanel() {
  const [overview, setOverview] = useState<OrganizationHealth | null>(null);
  const [pulse, setPulse] = useState<OrganizationPulse | null>(null);
  const [risks, setRisks] = useState<OrganizationRisk[]>([]);
  const [actions, setActions] = useState<OrganizationAction[]>([]);
  const [kpis, setKpis] = useState<OrganizationKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, pulseData, riskData, actionData, kpiData] = await Promise.all([
        fetchOrganizationIntelligenceOverview(),
        fetchOrganizationPulse(),
        fetchOrganizationRisks(),
        fetchOrganizationActions(),
        fetchOrganizationKpis(),
      ]);
      setOverview(summary.health);
      setPulse(pulseData);
      setRisks(riskData);
      setActions(actionData);
      setKpis(kpiData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Organization intelligence is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading && !overview) return (
    <div className="mb-6 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-5 py-8 text-center text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm">
      Loading organization intelligence...
    </div>
  );
  if (error && !overview) return (
    <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-xs font-medium text-amber-600 dark:text-amber-400">
      Live organization intelligence is unavailable. Existing organization data remains available above.
    </div>
  );
  if (!overview || !pulse) return null;

  return (
    <div className="mb-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#20C997]">Intelligence Layer</p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Backend-calculated signals for this organization.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh organization intelligence"
          title="Refresh organization intelligence"
          className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-2 text-slate-600 dark:text-slate-400 hover:text-[#20C997] hover:border-[#20C997]/30 disabled:opacity-50 transition-all shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 text-[#20C997] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <HealthPanel health={overview} />
        <PulsePanel pulse={pulse} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <RiskPanel risks={risks} />
        <ActionPanel actions={actions} />
      </div>
      <KpiPanel kpis={kpis} />
    </div>
  );
}

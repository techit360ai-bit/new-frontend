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
  if (value === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (value === "high") return "border-status-warning bg-status-warning-soft text-status-warning";
  if (value === "low") return "border-status-success bg-status-success-soft text-status-success";
  return "border-status-warning bg-status-warning-soft text-status-warning";
}

function HealthPanel({ health }: { health: OrganizationHealth }) {
  return (
    <section className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Organization health</p>
          <p className="mt-1 text-3xl font-bold text-text-primary">{health.score === null ? "—" : `${health.score}/100`}</p>
        </div>
        <HeartPulse className="h-5 w-5 text-brand-accent" aria-hidden="true" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">
        {Object.entries(health.dimensions).map(([key, value]) => (
          <div key={key}>
            <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
              <span>{DIMENSION_LABELS[key] || key}</span>
              <span className="font-semibold text-text-primary">{value === null ? "—" : value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
              <div className="h-full rounded-full bg-status-info-soft" style={{ width: `${value === null ? 0 : value}%` }} />
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
    <section className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Organization pulse</p>
          <h2 className="mt-1 text-lg font-bold text-text-primary">What changed in the last 7 days</h2>
        </div>
        <Activity className="h-5 w-5 text-brand-accent" aria-hidden="true" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {changes.map(([label, value]) => (
          <div key={label} className="rounded-md bg-background-primary px-3 py-3">
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="mt-1 text-xs leading-4 text-text-muted">{label}</p>
          </div>
        ))}
      </div>
      {pulse.activity.length > 0 && (
        <div className="mt-5 space-y-3 border-t border-border-subtle pt-4">
          {pulse.activity.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm text-text-secondary">
              <Activity className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-accent" aria-hidden="true" />
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
    <section className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-status-warning" aria-hidden="true" />
          <h2 className="text-lg font-bold text-text-primary">Risks</h2>
        </div>
        <span className="text-sm text-text-muted">{risks.length} open</span>
      </div>
      {risks.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-border-default bg-background-primary px-4 py-6 text-center text-sm text-text-muted">No open organization risks.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {risks.slice(0, 5).map((risk) => (
            <div key={risk.id} className="rounded-md border border-border-subtle p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-text-primary">{risk.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${severityClass(risk.severity)}`}>{risk.severity}</span>
              </div>
              {risk.reason && <p className="mt-1 text-xs leading-5 text-text-muted">{risk.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ActionPanel({ actions }: { actions: OrganizationAction[] }) {
  return (
    <section className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-brand-accent" aria-hidden="true" />
          <h2 className="text-lg font-bold text-text-primary">Actions</h2>
        </div>
        <span className="text-sm text-text-muted">{actions.length} active</span>
      </div>
      {actions.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-border-default bg-background-primary px-4 py-6 text-center text-sm text-text-muted">No active organization actions.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {actions.slice(0, 5).map((action) => (
            <div key={action.id} className="flex items-start gap-3 rounded-md border border-border-subtle p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-disabled" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">{action.title}</p>
                <p className="mt-1 text-xs text-text-muted">{action.status.replaceAll("_", " ")} · {formatDate(action.dueDate)}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${severityClass(action.priority === "normal" ? "medium" : action.priority)}`}>{action.priority}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function KpiPanel({ kpis }: { kpis: OrganizationKpi[] }) {
  return (
    <section className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-status-success" aria-hidden="true" />
        <h2 className="text-lg font-bold text-text-primary">Defined KPIs</h2>
      </div>
      {kpis.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed border-border-default bg-background-primary px-4 py-6 text-center text-sm text-text-muted">No organization KPIs have been defined.</div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {kpis.slice(0, 4).map((kpi) => {
            const latest = kpi.values[0]?.value;
            return <div key={kpi.id} className="rounded-md border border-border-subtle p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-text-primary">{kpi.name}</p><span className="text-xs text-text-muted">{kpi.unit || "value"}</span></div><p className="mt-2 text-2xl font-bold text-text-primary">{latest === undefined ? "—" : latest}</p><p className="mt-1 text-xs text-text-muted">Target: {kpi.target === null || kpi.target === undefined ? "not set" : kpi.target}</p></div>;
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

  if (loading && !overview) return <div className="mb-8 rounded-lg border border-border-default bg-surface-primary px-5 py-8 text-center text-sm text-text-muted">Loading organization intelligence...</div>;
  if (error && !overview) return <div className="mb-8 rounded-lg border border-status-warning bg-status-warning-soft px-5 py-4 text-sm text-status-warning">Live organization intelligence is unavailable. Existing organization data remains available above.</div>;
  if (!overview || !pulse) return null;

  return <div className="mb-8 space-y-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Intelligence layer</p><p className="mt-1 text-sm text-text-muted">Backend-calculated signals for this organization.</p></div><button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh organization intelligence" title="Refresh organization intelligence" className="rounded-lg border border-border-strong bg-surface-primary p-2 text-text-muted hover:bg-background-primary disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div><div className="grid gap-5 lg:grid-cols-2"><HealthPanel health={overview} /><PulsePanel pulse={pulse} /></div><div className="grid gap-5 lg:grid-cols-2"><RiskPanel risks={risks} /><ActionPanel actions={actions} /></div><KpiPanel kpis={kpis} /></div>;
}

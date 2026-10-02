// frontend/src/dashboard/founders/section/components/founder/Dashboard.tsx
import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, CheckCircle, TrendingUp, Plus, Building2 } from "lucide-react";
import { useFounderProfile, type FounderStage } from "@/contexts/UserContext";
import {
  computeGsisV2,
  fetchDashboardIntelligence,
  type DashboardIntelligence,
  type GsisMetricInput,
  type GsisV2Scorecard,
} from "@/lib/api/gsis";
import { fetchAudioBriefing } from "@/lib/api/audio";
import { runAnomalyScan, type RiskFlag } from "@/lib/api/alerts";
import { fetchCollaboratorTasks, patchCollaboratorTask, type CollaboratorTask } from "@/lib/api/collaboratorTasks";
import { fetchCustomerValidationSessions, type CustomerValidationSession } from "@/lib/api/incubation";
import { fetchFounderCapTable, type FounderCapTable } from "@/lib/api/founderEquity";
import type { Hackathon } from "@/dashboard/_shared/opportunities/types";
import { fetchFounderOpportunityCatalog } from "@/lib/api/opportunities";
import { computeMomentum, momentumColor } from "@/dashboard/_shared/hackathon/momentum";
import { WelcomeBack } from "@/components/WelcomeBack";
import {
  deriveFounderSignals,
  deriveJourney,
  deriveRecentActivity,
  toFounderTask,
  validationTotals as computeValidationTotals,
  type FounderSignal as Signal,
  type FounderTask,
  type JourneyStage,
} from "@/lib/dashboard/founderIntelligence";

interface Build {
  id: string;
  name: string;
  logoEmoji: string;
  stage: FounderStage;
  oneLiner: string;
  progress: number;
  isPrimary: boolean;
}

// Captured at module load — stable reference, satisfies react-hooks/purity
const NOW_MS = Date.now();

const stageStyles: Record<string, string> = {
  Idea:    "bg-surface-secondary text-text-secondary",
  MVP:     "bg-violet-50 text-violet-700",
  Beta:    "bg-status-warning-soft text-status-warning",
  Launch:  "bg-status-success-soft text-status-success",
  Growth:  "bg-status-success-soft text-status-success",
};

const priorityStyles: Record<string, string> = {
  overdue:    "bg-status-error-soft text-status-error",
  "due-soon": "bg-status-warning-soft text-status-warning",
  "this-week": "bg-surface-secondary text-text-secondary",
};

function normalizedStage(stage: string | undefined): FounderStage {
  const lower = String(stage ?? "").toLowerCase();
  if (lower === "mvp") return "MVP";
  if (lower === "beta") return "Beta";
  if (lower === "launch") return "Launch";
  if (lower === "growth") return "Growth";
  return "Idea";
}

function displayScore(value: number | null | undefined) {
  return value == null ? "Unknown" : Math.round(value).toString();
}

function metricLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function IntelligenceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-lg font-semibold text-text-primary tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { founderProfile: p } = useFounderProfile();
  const [tasks, setTasks] = useState<FounderTask[]>([]);
  const [workspaceTasks, setWorkspaceTasks] = useState<CollaboratorTask[]>([]);
  const [validationSessions, setValidationSessions] = useState<CustomerValidationSession[]>([]);
  const [capTable, setCapTable] = useState<FounderCapTable | null>(null);
  const [openStage, setOpenStage] = useState<string | null>(null);

  // GSIS master score + alerts from ai-router (surfaced for the first time).
  const [intel, setIntel] = useState<DashboardIntelligence | null>(null);
  useEffect(() => {
    let alive = true;
    fetchDashboardIntelligence().then((d) => { if (alive) setIntel(d); });
    return () => { alive = false; };
  }, []);

  // B4 — anomaly risk flags from the engine over this founder's execution signals.
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  useEffect(() => {
    let alive = true;
    runAnomalyScan([{ kind: "founder_execution", source: "dashboard" }])
      .then((r) => { if (alive) setRiskFlags(r.risk_flags ?? []); });
    return () => { alive = false; };
  }, []);

  // Live workspace tasks for this founder → "Today's focus" (persisted on toggle).
  useEffect(() => {
    let alive = true;
    fetchCollaboratorTasks()
      .then((snapshot) => {
        if (!alive) return;
        setWorkspaceTasks(snapshot.tasks);
        setTasks(snapshot.tasks.filter((task) => task.status !== "completed").slice(0, 5).map(toFounderTask));
      })
      .catch(() => { if (alive) { setWorkspaceTasks([]); setTasks([]); } });
    return () => { alive = false; };
  }, []);

  // Live customer-validation sessions → evidence metric + dashboard card.
  useEffect(() => {
    let alive = true;
    fetchCustomerValidationSessions(5)
      .then((result) => { if (alive) setValidationSessions(Array.isArray(result.sessions) ? result.sessions : []); })
      .catch(() => { if (alive) setValidationSessions([]); });
    return () => { alive = false; };
  }, []);

  // Committed collaborator equity per venture → cap table (derived, never invented).
  useEffect(() => {
    let alive = true;
    fetchFounderCapTable()
      .then((result) => { if (alive) setCapTable(result); })
      .catch(() => { if (alive) setCapTable(null); });
    return () => { alive = false; };
  }, []);

  // B5 — momentum audio briefing (TTS) on demand.
  const [briefingUrl, setBriefingUrl] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const playBriefing = async () => {
    setBriefingLoading(true);
    const b = await fetchAudioBriefing(`Momentum briefing for ${firstName}: keep your build moving.`);
    setBriefingLoading(false);
    if (b?.audio_url) {
      setBriefingUrl(b.audio_url);
      try { void new Audio(b.audio_url).play(); } catch { /* autoplay may be blocked */ }
    } else {
      toast("Audio briefing unavailable right now.");
    }
  };

  useEffect(() => {
    let alive = true;
    fetchFounderOpportunityCatalog()
      .then((rows) => {
        if (alive) setHackathons(rows.filter((row): row is Hackathon => row.type === "hackathon"));
      })
      .catch(() => {
        if (alive) setHackathons([]);
      });
    return () => { alive = false; };
  }, []);

  // S7 — founder venture portfolio (multiple separate startups), from context.
  const ventures = p.founderProjects;
  const builds: Build[] = useMemo(
    () => ventures.map((v) => ({
      id: v.id,
      name: v.title,
      logoEmoji: p.logoEmoji || "",
      stage: normalizedStage(v.stage),
      oneLiner: v.tagline,
      progress: Math.max(0, Math.min(100, Math.round(v.gsisScore || 0))),
      isPrimary: v.isPrimary,
    })),
    [ventures, p.logoEmoji],
  );
  const [activeVentureId, setActiveVentureId] = useState<string | null>(null);
  useEffect(() => {
    setActiveVentureId((cur) => cur ?? (ventures.find((v) => v.isPrimary) ?? ventures[0])?.id ?? null);
  }, [ventures]);
  const activeVenture = ventures.find((v) => v.id === activeVentureId) ?? ventures[0] ?? null;

  const [scorecard, setScorecard] = useState<GsisV2Scorecard | null>(null);
  useEffect(() => {
    if (!activeVenture && !p.startupName) {
      setScorecard(null);
      return;
    }
    let alive = true;
    const observedAt = activeVenture?.updatedAt ?? new Date().toISOString();
    const users = activeVenture?.users ?? p.users;
    const revenue = activeVenture?.revenueMonthly ?? p.revenueMonthly;
    const metrics: Record<string, GsisMetricInput> = {
      team_size: { value: p.currentTeamSize, status: "observed", evidence_level: 2, source: "founder_profile", observed_at: observedAt },
      product_available: {
        value: p.launchStatus !== "pre-launch" || ["launch", "growth"].includes(String(activeVenture?.stage ?? p.stage).toLowerCase()),
        status: "derived",
        evidence_level: 2,
        source: "founder_profile",
        observed_at: observedAt,
      },
    };
    if (users > 0) metrics.active_users = { value: users, status: "observed", evidence_level: 3, source: "founder_profile", observed_at: observedAt };
    if (revenue > 0) metrics.revenue = { value: revenue, status: "observed", evidence_level: 4, source: "founder_profile", observed_at: observedAt };
    if ((activeVenture?.progress ?? 0) > 0) {
      metrics.product = { score: activeVenture?.progress, status: "derived", evidence_level: 2, source: "project_progress", observed_at: observedAt };
    }
    const totalResponses = validationSessions.reduce((sum, session) => sum + Number(session.totalResponseCount || 0), 0);
    const qualifiedResponses = validationSessions.reduce((sum, session) => sum + Number(session.qualifiedResponseCount || 0), 0);
    if (totalResponses > 0) {
      // Observed share of validation responses that qualified (0–1 → 0–100).
      metrics.customer_validation = { value: Math.min(1, qualifiedResponses / totalResponses), status: "observed", evidence_level: 3, source: "customer_validation", observed_at: observedAt };
    }
    if (workspaceTasks.length > 0) {
      const completedTasks = workspaceTasks.filter((task) => task.status === "completed").length;
      metrics.execution = { value: completedTasks / workspaceTasks.length, status: "derived", evidence_level: 2, source: "workspace_tasks", observed_at: observedAt };
    }
    computeGsisV2({
      startup_id: activeVenture?.id,
      declared_stage: activeVenture?.stage ?? p.stage,
      geography: p.location,
      last_activity_at: activeVenture?.updatedAt,
      legacy_gsis: activeVenture?.gsisScore,
      metrics,
    }).then((result) => { if (alive) setScorecard(result); });
    return () => { alive = false; };
  }, [activeVenture, p.currentTeamSize, p.launchStatus, p.location, p.revenueMonthly, p.stage, p.startupName, p.users, validationSessions, workspaceTasks]);

  const signals = useMemo<Signal[]>(
    () => deriveFounderSignals({ riskFlags, validationSessions, tasks }),
    [riskFlags, validationSessions, tasks],
  );

  const journey = useMemo<JourneyStage[]>(
    () => deriveJourney(activeVenture?.stage ?? p.stage, activeVenture?.progress),
    [activeVenture, p.stage],
  );

  const evidenceSources = useMemo(
    () => [...new Set(Object.values(scorecard?.components ?? {}).map((component) => component.source).filter(Boolean))],
    [scorecard],
  );
  const evidencePlan = useMemo(() => [
    { label: "Team size", available: p.currentTeamSize > 0, source: "founder profile" },
    { label: "Product progress", available: (activeVenture?.progress ?? 0) > 0, source: "project" },
    { label: "Active users", available: (activeVenture?.users ?? p.users) > 0, source: "venture" },
    { label: "Monthly revenue", available: (activeVenture?.revenueMonthly ?? p.revenueMonthly) > 0, source: "venture" },
    { label: "Customer validation", available: validationSessions.some((session) => Number(session.totalResponseCount || 0) > 0), source: "validation sessions" },
    { label: "Execution evidence", available: workspaceTasks.length > 0, source: "workspace tasks" },
  ], [p.currentTeamSize, p.users, p.revenueMonthly, activeVenture, validationSessions, workspaceTasks]);

  const validationTotals = useMemo(() => computeValidationTotals(validationSessions), [validationSessions]);

  const recentActivity = useMemo(
    () => deriveRecentActivity({ workspaceTasks, validationSessions }),
    [workspaceTasks, validationSessions],
  );

  const firstName = (p.name || "Founder").split(" ")[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const weeksBuilding = useMemo(
    () => Math.max(1, Math.floor((NOW_MS - new Date(`${p.foundingYear}-01-01`).getTime()) / (7 * 86_400_000))),
    [p.foundingYear],
  );

  const toggleTask = async (id: string) => {
    const task = tasks.find((row) => row.id === id);
    if (!task) return;
    const nextStatus = task.done ? "pending" : "completed";
    setTasks((cur) => cur.map((row) => row.id === id ? { ...row, done: !row.done } : row));
    try {
      await patchCollaboratorTask(
        { id: task.id, workspaceId: task.workspaceId, projectId: task.projectId, projectName: task.projectName },
        { status: nextStatus },
      );
      toast(nextStatus === "completed" ? "Task marked complete" : "Task reopened");
    } catch {
      setTasks((cur) => cur.map((row) => row.id === id ? { ...row, done: task.done } : row));
      toast.error("Could not update the task.");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Good morning, {firstName}.</h1>
        <p className="text-sm text-text-muted mt-0.5">{today} · Week {weeksBuilding} of building</p>
      </div>

      {/* Welcome Back — contextual intelligence surface */}
      <WelcomeBack />

      {/* Your ventures — multi-project portfolio (S7) */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary">Your ventures</h2>
          <button
            type="button"
            onClick={() => navigate("/incubation-hub")}
            className="text-xs text-violet-600 hover:underline"
          >
            + Analyze a new idea
          </button>
        </div>
        {ventures.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {ventures.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveVentureId(v.id)}
                className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                  activeVentureId === v.id
                    ? "border-violet-400 bg-violet-50"
                    : "border-border-default hover:bg-background-primary"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{v.title}</span>
                  {v.isPrimary && <span className="text-[10px] uppercase tracking-wide text-violet-600">Primary</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-text-muted capitalize">{v.stage || "idea"}</span>
                  <span className="text-xs text-text-disabled">GSIS {Math.round(v.gsisScore || 0)}</span>
                  <span className={`text-xs ${v.hasWorkspace ? "text-status-success" : "text-text-disabled"}`}>
                    {v.hasWorkspace ? "workspace" : "no workspace"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No persisted ventures yet. Analyze an idea or promote an intake to create your first project.</p>
        )}
      </div>

      {/* Startup hero */}
      {p.startupName || activeVenture ? (
      <Link to="/incubation-hub" className="block group border border-border-default bg-surface-primary rounded-xl p-6 hover:border-violet-300 transition-colors">
        <div className="flex items-start gap-4">
                          <Building2 className="h-9 w-9 text-text-muted" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-text-primary">{activeVenture?.title ?? p.startupName}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${stageStyles[activeVenture ? normalizedStage(activeVenture.stage) : p.stage] ?? "bg-surface-secondary text-text-secondary"}`}>
                {activeVenture ? normalizedStage(activeVenture.stage) : p.stage}
              </span>
            </div>
            <p className="text-sm text-text-muted mb-3">{activeVenture?.tagline ?? p.oneLiner}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-2xl font-bold text-text-primary tabular-nums">{p.users.toLocaleString()}</p>
                <p className="text-xs text-text-muted uppercase tracking-wider">Active users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary tabular-nums">${p.revenueMonthly.toLocaleString()}/mo</p>
                <p className="text-xs text-text-muted uppercase tracking-wider">Revenue</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary tabular-nums">{p.openRoles.length} of 5</p>
                <p className="text-xs text-text-muted uppercase tracking-wider">Open roles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary tabular-nums">—</p>
                <p className="text-xs text-text-muted uppercase tracking-wider">Top investor fit</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-subtle text-sm">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); navigate("/founder/settings#startup"); }}
            className="text-violet-600 hover:underline"
          >
            Edit startup details →
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); navigate("/founder/profile"); }}
            className="text-violet-600 hover:underline"
          >
            View public profile →
          </button>
        </div>
      </Link>
      ) : null}

      {/* GSIS v2 — focused operating intelligence in the existing dashboard card language. */}
      {scorecard ? (
        <div className="border border-border-default bg-surface-primary rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-text-secondary">Startup intelligence</h2>
                <span className="rounded bg-surface-secondary px-2 py-0.5 text-[10px] font-medium text-text-muted">{scorecard.model.version}</span>
              </div>
              <p className="text-xs text-text-muted mt-1">{scorecard.stage.reason}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-violet-700 tabular-nums leading-none">
                {displayScore(scorecard.gsis)}
              </p>
              <p className="text-xs text-text-disabled mt-1">GSIS / 100</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-border-subtle pt-4 sm:grid-cols-3 lg:grid-cols-6">
            <IntelligenceMetric label="Stage" value={scorecard.stage.detected_stage} />
            <IntelligenceMetric label="Stage health" value={displayScore(scorecard.stage_health)} />
            <IntelligenceMetric label="Momentum" value={`${scorecard.momentum.score > 0 ? "+" : ""}${scorecard.momentum.score}`} />
            <IntelligenceMetric label="PMF" value={scorecard.pmf.score == null ? "N/A" : displayScore(scorecard.pmf.score)} />
            <IntelligenceMetric label="Risk" value={scorecard.risk.level} />
            <IntelligenceMetric label={`${metricLabel(scorecard.readiness.next_stage)} readiness`} value={displayScore(scorecard.readiness.score)} />
          </div>
          <div className="mt-5 grid gap-5 border-t border-border-subtle pt-5 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase text-text-muted">Primary bottleneck</p>
              <p className="mt-1 text-base font-semibold text-text-primary">{metricLabel(scorecard.bottleneck.category)}</p>
              <p className="mt-1 text-xs text-text-muted">
                {scorecard.bottleneck.score == null ? "More evidence is required to quantify this constraint." : `Current component score: ${Math.round(scorecard.bottleneck.score)}/100.`}
              </p>
            </div>
            {scorecard.recommendation && (
              <div className="border-l-2 border-violet-500 pl-4">
                <p className="text-[11px] font-semibold uppercase text-violet-700">Next best action</p>
                <p className="mt-1 text-sm font-medium text-text-primary">{scorecard.recommendation.action}</p>
                <p className="mt-1 text-xs text-text-muted">{scorecard.recommendation.next_milestone}</p>
              </div>
            )}
          </div>
          <div className="mt-5 border-t border-border-subtle pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-text-secondary">
                {metricLabel(scorecard.readiness.next_stage)} gate: {metricLabel(scorecard.readiness.status)}
              </p>
              <p className="text-xs text-text-muted">
                {Math.round(scorecard.data_coverage * 100)}% coverage · {Math.round(scorecard.confidence * 100)}% confidence
              </p>
            </div>
            {scorecard.readiness.blocking_requirements.length > 0 && (
              <p className="mt-2 text-xs text-status-warning">
                Missing: {scorecard.readiness.blocking_requirements.map((gate) => metricLabel(gate.metric)).join(" · ")}
              </p>
            )}
          </div>
          <div className="mt-5 border-t border-border-subtle pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase text-text-muted">Evidence sources</p>
              {evidenceSources.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {evidenceSources.map((source) => <span key={source} className="rounded bg-surface-secondary px-2 py-0.5 text-[10px] text-text-muted">{source}</span>)}
                </div>
              ) : <span className="text-[11px] text-text-muted">None observed yet.</span>}
            </div>
            {Object.keys(scorecard.components ?? {}).length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-text-muted">
                    <tr>
                      <th className="py-1 pr-3 font-medium">Component</th>
                      <th className="py-1 pr-3 font-medium">Score</th>
                      <th className="py-1 pr-3 font-medium">Confidence</th>
                      <th className="py-1 pr-3 font-medium">Status</th>
                      <th className="py-1 font-medium">Freshness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(scorecard.components ?? {}).map((component) => (
                      <tr key={component.key} className="border-t border-border-subtle">
                        <td className="py-1 pr-3 text-text-secondary">{metricLabel(component.key)} <span className="text-text-disabled">· {component.source}</span></td>
                        <td className="py-1 pr-3 tabular-nums text-text-primary">{Math.round(component.score)}</td>
                        <td className="py-1 pr-3 tabular-nums text-text-muted">{Math.round(component.confidence * 100)}%</td>
                        <td className="py-1 pr-3 text-text-muted">{component.status}</td>
                        <td className="py-1 text-text-muted">{component.freshness}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {evidencePlan.map((entry) => (
                <p key={entry.label} className={`text-xs ${entry.available ? "text-status-success" : "text-text-muted"}`}>
                  {entry.available ? "✓" : "○"} {entry.label} <span className="text-text-disabled">· {entry.source}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : intel?.gsis ? (
        <div className="border border-border-default bg-surface-primary rounded-xl p-6 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-secondary">Global Startup Intelligence Score</h2>
            <p className="text-xs text-text-muted mt-0.5">Legacy scorecard · v2 evidence is not available</p>
          </div>
          <p className="text-3xl font-bold text-violet-700 tabular-nums">{Math.round(intel.gsis.gsis)}</p>
        </div>
      ) : null}

      {/* Momentum briefing (B5) + risk alerts (B4) from the AI engine */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={playBriefing}
          disabled={briefingLoading}
          className="text-sm px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:bg-slate-300"
        >
          {briefingLoading ? "Preparing…" : "▶ Play momentum briefing"}
        </button>
        {briefingUrl && <span className="text-xs text-text-disabled">Audio ready</span>}
        {riskFlags.length > 0 && (
          <div className="flex-1 min-w-[12rem]">
            <p className="text-xs font-semibold text-status-warning mb-1">Engine risk alerts</p>
            <ul className="space-y-0.5">
              {riskFlags.slice(0, 3).map((f, i) => (
                <li key={i} className="text-xs text-status-warning flex items-start gap-1.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{f.message ?? f.type ?? "Risk flag"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Customer evidence — composed from real validation sessions (T2.4) */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary">Customer evidence</h2>
          <Link to="/incubation-hub" className="text-xs text-violet-600 hover:underline">Run validation →</Link>
        </div>
        {validationSessions.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <IntelligenceMetric label="Sessions" value={String(validationSessions.length)} />
              <IntelligenceMetric label="Responses" value={validationTotals.responses.toLocaleString()} />
              <IntelligenceMetric label="Qualified" value={validationTotals.qualified.toLocaleString()} />
            </div>
            <ul className="space-y-1.5 text-sm">
              {validationSessions.slice(0, 3).map((session) => (
                <li key={session.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-text-secondary">{session.title}</span>
                  <span className="shrink-0 text-xs text-text-muted">{session.qualifiedResponseCount}/{session.totalResponseCount} qualified · {session.confidenceLevel}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No customer-validation sessions yet. Start one to turn customer evidence into a GSIS signal.</p>
        )}
      </div>

      {/* Cap table — committed collaborator equity (derived, never invented) */}
      {capTable && (
        <div className="border border-border-default bg-surface-primary rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-semibold text-text-secondary">Equity &amp; cap table</h2>
            <span className="text-[10px] uppercase tracking-wide text-text-muted">Derived from committed equity</span>
          </div>
          {capTable.totals.ventures > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <IntelligenceMetric label="Ventures" value={String(capTable.totals.ventures)} />
                <IntelligenceMetric label="Committed grants" value={String(capTable.totals.committedGrants)} />
                <IntelligenceMetric label="Pending proposals" value={String(capTable.totals.pendingProposals)} />
              </div>
              <ul className="space-y-3">
                {capTable.ventures.map((venture) => (
                  <li key={venture.workspaceId} className="rounded-lg border border-border-subtle p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary truncate">{venture.name}</p>
                      <span className="text-xs text-text-muted tabular-nums">
                        {venture.committedPercent}% committed · {venture.retainedPercent}% retained{venture.retainedDerived ? " (derived)" : ""}
                      </span>
                    </div>
                    {venture.grants.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                        {venture.grants.map((grant) => (
                          <li key={grant.collaboratorId} className="flex items-center justify-between gap-3">
                            <span className="truncate">{grant.collaboratorName} · {grant.role}</span>
                            <span className="shrink-0 tabular-nums text-status-success">{grant.equityPercent}%</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-text-muted">No committed collaborator equity recorded for this venture.</p>
                    )}
                    {venture.pending.length > 0 && (
                      <p className="mt-2 text-xs text-text-muted">
                        Pending (not yet committed): {venture.pending.map((proposal) => `${proposal.collaboratorName} ${proposal.equityPercent}%`).join(" · ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-text-disabled">{capTable.basis}</p>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              No ventures yet. Equity you commit to collaborators through workspace invitations will appear here.
            </p>
          )}
        </div>
      )}

      {/* Journey strip */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {journey.map((s) => {
            const isOpen = openStage === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setOpenStage(isOpen ? null : s.id)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  s.status === "complete" ? "border-violet-200 bg-surface-primary" :
                  s.status === "active"   ? "border-violet-200 bg-violet-50" :
                                            "border-border-default bg-background-primary"
                }`}
              >
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{s.label}</p>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      s.status === "complete" ? "bg-violet-200" :
                      s.status === "active"   ? "bg-violet-600" :
                                                "bg-slate-200"
                    }`}
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1.5 tabular-nums">{s.progress}%</p>
              </button>
            );
          })}
        </div>
        {openStage && (
          <div className="mt-4 p-3 rounded-lg bg-background-primary border border-border-default text-sm text-text-secondary">
            {journey.find((j) => j.id === openStage)?.detail}
          </div>
        )}
      </div>

      {/* Today's focus + Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border-default bg-surface-primary rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary">Today's focus</h2>
            <Link to="/incubation-hub" className="text-xs text-violet-600 hover:underline">View all tasks →</Link>
          </div>
          {tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => { void toggleTask(t.id); }}
                  className="w-4 h-4 accent-violet-600 cursor-pointer"
                />
                <Link to={t.href} className={`flex-1 min-w-0 ${t.done ? "opacity-50 line-through" : ""}`}>
                  <p className="text-sm font-medium text-text-primary truncate">{t.title}</p>
                  <p className="text-xs text-text-muted">{t.detail}</p>
                </Link>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${priorityStyles[t.priority]}`}>{t.priority}</span>
              </li>
            ))}
          </ul>
          ) : (
            <p className="text-sm text-text-muted">No live focus tasks yet. Workspace tasks will appear here when they are assigned.</p>
          )}
        </div>
        <div className="border border-border-default bg-surface-primary rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">Signals</h2>
          {signals.length > 0 ? (
          <ul className="space-y-3">
            {signals.map((s) => (
              <li key={s.id}>
                <Link to={s.href} className="flex items-start gap-2 text-sm text-text-secondary hover:text-violet-600 group">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-text-disabled group-hover:text-violet-600 shrink-0" />
                  <span className="flex-1">{s.message}</span>
                  <ArrowRight className="w-4 h-4 mt-0.5 text-text-on-inverse-secondary group-hover:text-violet-600 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
          ) : (
            <p className="text-sm text-text-muted">No live signals yet.</p>
          )}
        </div>
      </div>

      {/* Active builds */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Active builds</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {builds.map((b) => (
            <div key={b.id} className="border border-border-default bg-surface-primary rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <Building2 className="h-6 w-6 text-text-muted" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{b.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${stageStyles[b.stage] ?? "bg-surface-secondary text-text-secondary"}`}>{b.stage}</span>
                </div>
              </div>
              {b.oneLiner && <p className="text-xs text-text-muted mb-3">{b.oneLiner}</p>}
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-violet-600" style={{ width: `${b.progress}%` }} />
              </div>
              <button
                type="button"
                onClick={() => navigate(`/workspaces/build?startup=${b.id}`)}
                className="text-xs text-violet-600 hover:underline"
              >
                Open workspace →
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate("/incubation-hub")}
            className="border border-dashed border-border-strong rounded-xl p-4 text-sm text-text-muted hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Analyze a new idea
          </button>
        </div>
      </div>

      {/* Recent activity */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Recent activity</h2>
        {recentActivity.length > 0 ? (
          <ul className="space-y-2">
            {recentActivity.map((item) => (
              <li key={item.id}>
                <Link to={item.href} className="flex items-center gap-3 text-sm text-text-secondary hover:text-violet-600">
                  <CheckCircle className="w-4 h-4 text-text-disabled shrink-0" />
                  <span className="flex-1">{item.message}</span>
                  <ArrowRight className="w-4 h-4 text-text-disabled shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">No persisted activity yet. Completed workspace tasks and validation updates will appear here.</p>
        )}
      </div>

      {/* Hackathon Momentum */}
      {(() => {
        const regs = p.hackathonRegistrations;
        if (regs.length === 0) {
          return (
            <div className="border border-border-default bg-surface-primary rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-sm font-semibold text-text-secondary">Hackathon Momentum</h2>
                    <TrendingUp className="w-4 h-4 text-text-disabled" />
                  </div>
                  <p className="text-sm text-text-muted">
                    No active hackathons. Join a hackathon from the Opportunity Hub to see your team's momentum
                    tracker here — 4-hour check-ins, build velocity, blockers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/opportunity-hub")}
                  className="text-xs font-medium text-violet-700 px-3 py-1.5 rounded-lg border border-violet-200 hover:bg-violet-50 flex items-center gap-2 shrink-0"
                >
                  Browse opportunities →
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="border border-border-default bg-surface-primary rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold text-text-secondary">Hackathon Momentum</h2>
              <TrendingUp className="w-4 h-4 text-text-disabled" />
            </div>
            <ul className="space-y-3">
              {regs.map((r) => {
                const h = hackathons.find((o) => o.id === r.hackathonId);
                if (!h) return null;
                const memberCount = r.members.length + 1;
                const teamSize = r.teamSize;
                const startMs = new Date(h.startDate).getTime() - Date.now();
                const days = Math.max(0, Math.ceil(startMs / (1000 * 60 * 60 * 24)));
                const startsLabel = Number.isNaN(startMs)
                  ? "Start date unavailable"
                  : days <= 7
                    ? `Starts in ${days} days`
                    : `Starts ${h.startDate}`;
                const momentum = computeMomentum(r, Date.now());
                const momColor = momentumColor(momentum.score);
                const ctaLabel =
                  momentum.nextAction === "submit-brief" ? "Submit brief →"
                  : momentum.nextAction === "log-check-in" ? "Log check-in →"
                  : "Open team";
                const ctaStage = momentum.nextAction === "submit-brief" ? "brief" : "build";
                return (
                  <li key={r.teamId} className="flex items-start gap-3 border border-border-subtle rounded-lg p-3">
                    <span className="text-xl shrink-0" aria-hidden="true">{h.poster}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{h.title}</p>
                      <p className="text-xs text-text-muted">
                        {r.teamName} · {memberCount} of {teamSize} members · {startsLabel}
                      </p>
                      <p className="text-xs text-text-muted mt-1 font-medium">{momentum.nextActionLabel}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-2xl font-bold leading-none ${momColor.text}`}>{momentum.score}</p>
                      <div className="h-1.5 w-16 rounded-full bg-surface-secondary mt-1 ml-auto">
                        <div className={`h-1.5 rounded-full ${momColor.bar}`} style={{ width: `${momentum.score}%` }} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/incubation-hub?panel=hackathon&stage=${ctaStage}`)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border-strong text-text-secondary hover:bg-background-primary shrink-0 self-center"
                    >
                      {ctaLabel}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => navigate("/opportunity-hub")}
              className="mt-4 text-xs font-medium text-violet-700 hover:underline"
            >
              Browse more opportunities →
            </button>
          </div>
        );
      })()}
    </div>
  );
}

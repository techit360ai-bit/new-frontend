// frontend/src/dashboard/collaborators/section/components/collab/Dashboard.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { TrendingUp, ArrowRight, CheckCircle, GraduationCap, Headphones, Award, Target } from "lucide-react";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { EMPTY_EQUITY, fetchCollaboratorEquity, type CollaboratorEquity } from "@/lib/api/equity";
import { EMPTY_EARNINGS, fetchCollaboratorEarnings, type CollaboratorEarnings } from "@/lib/api/earnings";
import { fetchCollaboratorScores, type CollaboratorScores } from "@/lib/api/collaboratorScores";
import { WelcomeBack } from "@/components/WelcomeBack";

interface BuildSummary {
  id: string;
  name: string;
  logo: string;
  role: string;
  progress: number;
  deadline: string;
  status: "healthy" | "risk" | "critical";
  sprintGoal: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { collaboratorProfile } = useCollaboratorProfile();
  const [equity, setEquity] = useState<CollaboratorEquity>(EMPTY_EQUITY);
  const [earnings, setEarnings] = useState<CollaboratorEarnings>(EMPTY_EARNINGS);
  const [scores, setScores] = useState<CollaboratorScores>({ cbs: 0, tss: {}, crs: 0 });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchCollaboratorEquity(), fetchCollaboratorEarnings(), fetchCollaboratorScores()])
      .then(([equityData, earningsData, scoresData]) => {
        if (!alive) return;
        setEquity(equityData);
        setEarnings(earningsData);
        setScores(scoresData);
        setLoadError(null);
      })
      .catch((error) => {
        if (!alive) return;
        setEquity(EMPTY_EQUITY);
        setEarnings(EMPTY_EARNINGS);
        setScores({ cbs: 0, tss: {}, crs: 0 });
        setLoadError(error instanceof Error ? error.message : "Live collaborator data is unavailable.");
      });
    return () => { alive = false; };
  }, []);

  const firstName = (collaboratorProfile.name || "Collaborator").split(" ")[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const builds = useMemo<BuildSummary[]>(() => {
    const byProject = new Map<string, BuildSummary>();
    for (const h of equity.holdings) {
      byProject.set(h.projectId, {
        id: h.projectId,
        name: h.projectName,
        logo: h.projectLogo || "",
        role: "Equity contributor",
        progress: Math.max(0, Math.min(100, Math.round(h.vestedPercent || 0))),
        deadline: h.nextVest?.date ?? "—",
        status: "healthy",
        sprintGoal: h.nextVest ? `Next vest +${h.nextVest.deltaPercent}%` : "No upcoming vest recorded",
      });
    }
    for (const e of earnings.cashEarnings) {
      if (!byProject.has(e.projectId)) {
        byProject.set(e.projectId, {
          id: e.projectId,
          name: e.projectName,
          logo: "",
          role: "Cash contributor",
          progress: e.pending > 0 ? 50 : 100,
          deadline: "—",
          status: e.pending > 0 ? "risk" : "healthy",
          sprintGoal: e.contributionNote || "No contribution note recorded",
        });
      }
    }
    return [...byProject.values()];
  }, [equity.holdings, earnings.cashEarnings]);

  const signals = useMemo(() => {
    const items: Array<{ id: string; message: string; href: string }> = [];
    if (equity.totals.nextVest) {
      items.push({
        id: "next-vest",
        message: `${equity.totals.nextVest.startup} vests on ${equity.totals.nextVest.date} · +${equity.totals.nextVest.deltaPercent}%`,
        href: "/collaborator/equity",
      });
    }
    if (earnings.totals.pendingUSD > 0) {
      items.push({
        id: "pending-payout",
        message: `$${earnings.totals.pendingUSD.toLocaleString()} pending payout`,
        href: "/collaborator/earnings",
      });
    }
    return items;
  }, [equity.totals.nextVest, earnings.totals.pendingUSD]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Good morning, {firstName}.</h1>
        <p className="text-sm text-text-muted mt-0.5">{today} · {builds.length} active builds</p>
      </div>

      {/* Welcome Back — contextual intelligence surface */}
      <WelcomeBack />

      {loadError && (
        <div className="border border-status-error bg-status-error-soft text-status-error rounded-xl px-4 py-3 text-sm">
          Live collaborator records could not be loaded: {loadError}
        </div>
      )}

      {/* Equity hero + Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity hero — 2 cols */}
        <Link to="/collaborator/equity" className="lg:col-span-2 group border border-border-default bg-surface-primary rounded-xl p-6 hover:border-status-warning transition-colors">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">Building for Equity</p>
            <span className="text-status-warning text-sm group-hover:translate-x-0.5 transition-transform">View full equity →</span>
          </div>
          <div className="flex items-baseline gap-6 mt-2">
            <div>
              <p className="text-3xl font-bold text-text-primary tabular-nums">${(equity.totals.totalValueUSD / 1000).toFixed(1)}K</p>
              <p className="text-xs text-text-muted mt-0.5">Total ownership value</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-text-primary tabular-nums">{equity.totals.blendedEquityPercent}%</p>
              <p className="text-xs text-text-muted mt-0.5">Blended equity across {equity.holdings.length} startups</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {equity.holdings.length > 0 ? equity.holdings.map((h) => (
              <div key={h.projectId} className="flex items-center text-sm">
                <span className="text-lg mr-2">{h.projectLogo || ""}</span>
                <span className="flex-1 text-text-secondary">{h.projectName}</span>
                <span className="w-16 text-right tabular-nums text-text-primary">{h.equityPercent}%</span>
                <span className="w-20 text-right tabular-nums text-text-secondary">${(h.valueUSD / 1000).toFixed(1)}K</span>
                <span className="w-24 text-right text-xs text-text-muted">vested {h.vestedPercent}%</span>
              </div>
            )) : (
              <p className="text-sm text-text-muted">No equity grants recorded yet.</p>
            )}
          </div>

          {equity.totals.nextVest && (
            <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-status-warning" />
              <span className="text-text-secondary">
                Next vest <span className="font-semibold">{equity.totals.nextVest.date}</span> · +{equity.totals.nextVest.deltaPercent}% {equity.totals.nextVest.startup}
              </span>
            </div>
          )}
        </Link>

        {/* Earnings — 1 col */}
        <Link to="/collaborator/earnings" className="group border border-border-default bg-surface-primary rounded-xl p-6 hover:border-status-warning transition-colors">
          <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-2">Cash earned</p>
          <p className="text-3xl font-bold text-text-primary tabular-nums">${(earnings.totals.lifetimeUSD / 1000).toFixed(0)}K</p>
          <p className="text-xs text-text-muted">Lifetime</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Pending payout</span><span className="font-semibold tabular-nums text-text-primary">${earnings.totals.pendingUSD.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Revenue share (TTM)</span><span className="font-semibold tabular-nums text-text-primary">${earnings.totals.revenueShareTTMUsd.toLocaleString()}</span></div>
          </div>
          <p className="text-status-warning text-sm mt-4 group-hover:translate-x-0.5 transition-transform">View earnings →</p>
        </Link>
      </div>

      {/* Collaborator Scores — CBS/TSS/CRS */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-brand-accent" />
          <h2 className="text-sm font-semibold text-text-secondary">Collaborator Scores</h2>
        </div>

        {scores.cbs === 0 && scores.crs === 0 && Object.keys(scores.tss).length === 0 ? (
          <p className="text-sm text-text-muted">Complete projects to build your scores</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CBS */}
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-2">Build Score</p>
              <div className="relative inline-flex">
                <svg className="w-20 h-20">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-text-on-inverse-secondary" />
                  <circle
                    cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent"
                    className="text-brand-accent transition-all"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - scores.cbs / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-text-primary">{scores.cbs}</span>
              </div>
              <p className="text-xs text-text-muted mt-1">Collaborator Build Score</p>
            </div>

            {/* TSS */}
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-2">Specialisation</p>
              {Object.keys(scores.tss).length === 0 ? (
                <p className="text-sm text-text-muted">No skills tracked yet</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(scores.tss)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([skill, score]) => (
                      <div key={skill}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-text-secondary font-medium">{skill}</span>
                          <span className="text-text-primary font-semibold tabular-nums">{score}</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-brand-accent" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <p className="text-xs text-text-muted mt-2">Technical Specialisation</p>
            </div>

            {/* CRS */}
            <div>
              <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-2">Reliability</p>
              <div className="relative inline-flex">
                <svg className="w-20 h-20">
                  <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-text-on-inverse-secondary" />
                  <circle
                    cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent"
                    className="text-cyan-600 transition-all"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - scores.crs / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-text-primary">{scores.crs}</span>
              </div>
              <p className="text-xs text-text-muted mt-1">Collaboration Reliability</p>
            </div>
          </div>
        )}
      </div>

      {/* Active Builds */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Active Builds</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {builds.length > 0 ? builds.map((p) => {
            const statusStyles = p.status === "critical"
              ? "bg-status-error-soft text-status-error"
              : p.status === "risk"
              ? "bg-status-warning-soft text-status-warning"
              : "bg-status-success-soft text-status-success";
            return (
              <div key={p.id} className="border border-border-default bg-surface-primary rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.logo}</span>
                    <div>
                      <h3 className="font-semibold text-text-primary text-sm">{p.name}</h3>
                      <p className="text-xs text-text-muted">{p.role}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles}`}>{p.status}</span>
                </div>
                <div className="text-xs text-text-muted mb-2">{p.sprintGoal}</div>
                <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-status-warning" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-text-muted mb-3">
                  <span>{p.progress}%</span><span>Due {p.deadline}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/workspaces/build?startup=${p.id}`)}
                    className="flex-1 px-3 py-1.5 text-xs bg-background-inverse text-white rounded-lg hover:bg-surface-inverse-muted transition-colors">Open workspace</button>
                </div>
              </div>
            );
          }) : (
            <div className="border border-dashed border-border-strong rounded-xl p-6 text-sm text-text-muted md:col-span-3">
              No active builds are recorded yet. Equity grants, earnings, or workspace assignments will appear here once persisted.
            </div>
          )}
        </div>
      </div>

      {/* Today's focus + Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-border-default bg-surface-primary rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary">Today's focus</h2>
            <Link to="/collaborator/tasks" className="text-xs text-status-warning hover:underline">View all tasks</Link>
          </div>
          <p className="text-sm text-text-muted">No live task assignments yet. Workspace tasks will appear here when assigned.</p>
        </div>

        <div className="border border-border-default bg-surface-primary rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">Signals</h2>
          {signals.length > 0 ? (
          <ul className="space-y-2">
            {signals.map((s) => (
              <li key={s.id}>
                <Link to={s.href} className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-background-primary transition-colors text-sm">
                  <CheckCircle className="w-4 h-4 text-text-disabled" />
                  <span className="flex-1 text-text-secondary">{s.message}</span>
                  <ArrowRight className="w-4 h-4 text-text-disabled" />
                </Link>
              </li>
            ))}
          </ul>
          ) : (
            <p className="text-sm text-text-muted">No live collaborator signals yet.</p>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Recent activity</h2>
        <p className="text-sm text-text-muted">No persisted collaborator activity yet.</p>
      </div>

      {/* TechIT Academy — Collaborator Learning */}
      <Link
        to="/collaborator/academy"
        className="group block border border-border-default bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-xl p-6 hover:border-brand-accent transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-accent text-white shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">TechIT Academy</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-status-info-soft text-brand-accent px-2 py-0.5 rounded-full">
                Collaborator Track
              </span>
            </div>
            <p className="text-sm text-text-muted mt-0.5">
              Learn while you build — lessons, audio, and badges tailored to collaborators.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
              <span className="flex items-center gap-1"><Headphones className="w-3.5 h-3.5" /> Audio lessons</span>
              <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Earn badges</span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-brand-accent group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>
      </Link>
    </div>
  );
}

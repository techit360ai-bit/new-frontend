// frontend/src/dashboard/collaborators/section/components/collab/Dashboard.tsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { TrendingUp, ArrowRight, CheckCircle2, GraduationCap, Headphones, Award, Target, Sparkles, FolderKanban, ShieldCheck, DollarSign, PieChart, Activity } from "lucide-react";
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Greeting Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Good morning, <span className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] bg-clip-text text-transparent">{firstName}</span>.
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0066ff]/10 dark:bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff] border border-[#0066ff]/20">
              Collaborator
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-2">
            <span>{today}</span>
            <span>•</span>
            <span className="text-slate-700 dark:text-slate-300">{builds.length} active builds</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/collaborator/opportunities"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-slate-100 transition-all border border-slate-200/60 dark:border-white/10"
          >
            Find Gigs
          </Link>
          <Link
            to="/collaborator/tasks"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all flex items-center gap-1.5"
          >
            <span>My Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Welcome Back — contextual intelligence surface */}
      <WelcomeBack />

      {loadError && (
        <div className="border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-2xl px-5 py-3.5 text-sm backdrop-blur-md flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Live collaborator records could not be loaded: {loadError}</span>
        </div>
      )}

      {/* Equity hero + Earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity hero — 2 cols */}
        <Link
          to="/collaborator/equity"
          className="lg:col-span-2 group relative overflow-hidden bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 hover:border-[#0066ff]/40 dark:hover:border-[#0066ff]/50 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#0066ff]/10 via-[#58a6ff]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0066ff]/10 dark:bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff] flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Building for Equity</p>
            </div>
            <span className="text-[#0066ff] dark:text-[#58a6ff] text-xs font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
              View full equity <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-3 relative z-10">
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
              <p className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                ${(equity.totals.totalValueUSD / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Total ownership value</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
              <p className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {equity.totals.blendedEquityPercent}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Blended equity across {equity.holdings.length} startups</p>
            </div>
          </div>

          <div className="mt-6 space-y-2.5 relative z-10">
            {equity.holdings.length > 0 ? (
              equity.holdings.map((h) => (
                <div
                  key={h.projectId}
                  className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-black/[0.02] dark:border-white/[0.04]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl flex-shrink-0">{h.projectLogo || "🚀"}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{h.projectName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="tabular-nums font-bold text-slate-900 dark:text-white">{h.equityPercent}%</span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-400">${(h.valueUSD / 1000).toFixed(1)}K</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                      vested {h.vestedPercent}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-2 italic">No equity grants recorded yet.</p>
            )}
          </div>

          {equity.totals.nextVest && (
            <div className="mt-5 pt-4 border-t border-black/[0.06] dark:border-white/10 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 relative z-10">
              <div className="p-1 rounded-full bg-amber-500/10 text-amber-500">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span>
                Next vest on <span className="font-bold text-slate-900 dark:text-white">{equity.totals.nextVest.date}</span> ·{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{equity.totals.nextVest.deltaPercent}%</span> {equity.totals.nextVest.startup}
              </span>
            </div>
          )}
        </Link>

        {/* Earnings — 1 col */}
        <Link
          to="/collaborator/earnings"
          className="group relative overflow-hidden bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 hover:border-[#0066ff]/40 dark:hover:border-[#0066ff]/50 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Cash Earned</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] mb-5">
              <p className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                ${(earnings.totals.lifetimeUSD / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Lifetime cash earnings</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50/50 dark:bg-white/[0.02]">
                <span className="text-slate-500 dark:text-slate-400">Pending payout</span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">${earnings.totals.pendingUSD.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50/50 dark:bg-white/[0.02]">
                <span className="text-slate-500 dark:text-slate-400">Revenue share (TTM)</span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">${earnings.totals.revenueShareTTMUsd.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <p className="text-[#0066ff] dark:text-[#58a6ff] text-xs font-semibold mt-6 group-hover:translate-x-1 transition-transform flex items-center gap-1">
            View earnings breakdown <ArrowRight className="w-3.5 h-3.5" />
          </p>
        </Link>
      </div>

      {/* Collaborator Scores — CBS/TSS/CRS */}
      <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0066ff]/10 dark:bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Collaborator Scores</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reputation & technical proof verified on TechIT</p>
            </div>
          </div>
          <Link
            to="/collaborator/reputation"
            className="text-xs font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline flex items-center gap-1"
          >
            Reputation details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {scores.cbs === 0 && scores.crs === 0 && Object.keys(scores.tss).length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-400/60" />
            Complete startup milestones to unlock live cryptographic build and reliability scores.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CBS */}
            <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-4">
              <div className="relative inline-flex flex-shrink-0">
                <svg className="w-20 h-20">
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200 dark:text-white/10" />
                  <circle
                    cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent"
                    className="text-[#0066ff] transition-all duration-1000"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - scores.cbs / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-slate-900 dark:text-white">
                  {scores.cbs}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Build Score (CBS)</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Execution speed & milestone delivery</p>
                <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff]">
                  Top 15% Contributor
                </span>
              </div>
            </div>

            {/* TSS */}
            <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-3">Specialisation (TSS)</p>
              {Object.keys(scores.tss).length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No skills tracked yet</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(scores.tss)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([skill, score]) => (
                      <div key={skill}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{skill}</span>
                          <span className="text-slate-900 dark:text-white font-bold tabular-nums">{score}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#0066ff] to-[#58a6ff] rounded-full" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* CRS */}
            <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-4">
              <div className="relative inline-flex flex-shrink-0">
                <svg className="w-20 h-20">
                  <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200 dark:text-white/10" />
                  <circle
                    cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent"
                    className="text-[#20c937] transition-all duration-1000"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - scores.crs / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-slate-900 dark:text-white">
                  {scores.crs}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Reliability (CRS)</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Commitment adherence & peer trust</p>
                <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#20c937]/10 text-[#20c937]">
                  High Confidence
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Builds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#0066ff] dark:text-[#58a6ff]" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Builds</h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{builds.length} assigned</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {builds.length > 0 ? (
            builds.map((p) => {
              const statusStyles =
                p.status === "critical"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                  : p.status === "risk"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
              return (
                <div
                  key={p.id}
                  className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 hover:border-[#0066ff]/40 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{p.logo || "⚡"}</span>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{p.role}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusStyles}`}>
                        {p.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-white/[0.02] p-2.5 rounded-xl border border-black/[0.03] dark:border-white/[0.04]">
                      {p.sprintGoal}
                    </p>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Progress</span>
                        <span>{p.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#0066ff] to-[#58a6ff] rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                      <div className="flex justify-end text-[11px] text-slate-400">
                        Due {p.deadline}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/workspaces/build?startup=${p.id}`)}
                    className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-900 dark:bg-white/10 dark:hover:bg-white/20 text-white rounded-xl transition-colors text-center"
                  >
                    Open Workspace
                  </button>
                </div>
              );
            })
          ) : (
            <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400 md:col-span-3 bg-white/40 dark:bg-[#121212]/40">
              <Activity className="w-8 h-8 mx-auto mb-2 text-slate-400/60" />
              No active builds are recorded yet. Equity grants, earnings, or workspace assignments will appear here once assigned.
            </div>
          )}
        </div>
      </div>

      {/* Today's focus + Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Today's Focus</h2>
            <Link to="/collaborator/tasks" className="text-xs font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline">
              View all tasks
            </Link>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-center text-xs text-slate-500 dark:text-slate-400">
            No active task assignments today. Tasks from active workspace sprints will populate here.
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Key Signals</h2>
          {signals.length > 0 ? (
            <ul className="space-y-2.5">
              {signals.map((s) => (
                <li key={s.id}>
                  <Link
                    to={s.href}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 dark:bg-white/[0.02] hover:bg-[#0066ff]/5 dark:hover:bg-[#0066ff]/10 border border-black/[0.04] dark:border-white/[0.06] transition-colors text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#20c937] shrink-0" />
                    <span className="flex-1 truncate">{s.message}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-center text-xs text-slate-500 dark:text-slate-400">
              No live collaborator signals yet.
            </div>
          )}
        </div>
      </div>

      {/* TechIT Academy — Collaborator Learning */}
      <Link
        to="/collaborator/academy"
        className="group relative overflow-hidden block bg-gradient-to-r from-[#0066ff]/10 via-purple-500/5 to-[#58a6ff]/10 dark:from-[#0066ff]/15 dark:via-purple-500/10 dark:to-[#58a6ff]/15 border border-[#0066ff]/20 dark:border-white/10 rounded-2xl p-6 hover:border-[#0066ff]/40 transition-all shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-white shadow-[0_4px_15px_rgba(0,102,255,0.3)] shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">TechIT Academy</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0066ff]/15 text-[#0066ff] dark:text-[#58a6ff] px-2.5 py-0.5 rounded-full border border-[#0066ff]/20">
                Collaborator Track
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Learn while you build — interactive lessons, audio masterclasses, and verified credential badges.
            </p>
            <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><Headphones className="w-3.5 h-3.5 text-[#0066ff]" /> Audio lessons</span>
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" /> Earn verified badges</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-500" /> Boost CRS Score</span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#0066ff] dark:text-[#58a6ff] group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </Link>
    </div>
  );
}

// frontend/src/dashboard/collaborators/section/components/collab/CollabProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Globe, Twitter, ExternalLink, ShieldCheck, Sparkles, CheckCircle2, User, Trophy, Layers } from "lucide-react";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import {
  EMPTY_EQUITY,
  fetchCollaboratorEquity,
  type CollaboratorEquity,
} from "@/lib/api/equity";
import {
  EMPTY_EARNINGS,
  fetchCollaboratorEarnings,
  type CollaboratorEarnings,
} from "@/lib/api/earnings";
import {
  fetchCollaboratorSummary,
  type CollaboratorLiveSummary,
} from "@/lib/api/collaboratorSummary";

export function CollabProfile() {
  const { collaboratorProfile: p } = useCollaboratorProfile();
  const [summary, setSummary] = useState<CollaboratorLiveSummary | null>(null);
  const [equity, setEquity] = useState<CollaboratorEquity>(EMPTY_EQUITY);
  const [earnings, setEarnings] = useState<CollaboratorEarnings>(EMPTY_EARNINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initials = p.name.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchCollaboratorSummary(),
      fetchCollaboratorEquity(),
      fetchCollaboratorEarnings(),
    ])
      .then(([summaryData, equityData, earningsData]) => {
        if (!alive) return;
        setSummary(summaryData);
        setEquity(equityData);
        setEarnings(earningsData);
      })
      .catch((err) => {
        if (!alive) return;
        setSummary(null);
        setEquity(EMPTY_EQUITY);
        setEarnings(EMPTY_EARNINGS);
        setError(err instanceof Error ? err.message : "Live collaborator profile data is unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const earnedAchievements = (summary?.achievements ?? []).filter((achievement) => achievement.earned);
  const execution = summary?.metrics.find((metric) => metric.name === "Execution Velocity")?.value ?? 0;
  const completedTasks = summary?.tasks.filter((task) => task.status === "completed").length ?? 0;
  const builds = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; equityPercent: number; valueUSD: number; shipped: number; impactAvg: number }>();
    for (const holding of equity.holdings) {
      byId.set(holding.projectId, {
        id: holding.projectId,
        name: holding.projectName,
        equityPercent: Number(holding.equityPercent || 0),
        valueUSD: Number(holding.valueUSD || 0),
        shipped: 0,
        impactAvg: 0,
      });
    }
    for (const contribution of summary?.perProject ?? []) {
      const current = byId.get(contribution.id);
      byId.set(contribution.id, {
        id: contribution.id,
        name: contribution.name,
        equityPercent: current?.equityPercent ?? 0,
        valueUSD: current?.valueUSD ?? 0,
        shipped: contribution.shipped,
        impactAvg: contribution.impactAvg,
      });
    }
    return [...byId.values()];
  }, [equity.holdings, summary?.perProject]);

  const commitmentLabel: Record<typeof p.commitmentStyle, string> = {
    deep: "One startup deeply",
    parallel: "2–3 in parallel",
    many: "Many short engagements",
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header strip */}
      <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col sm:flex-row items-start gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#20C997] to-[#128a64] text-slate-950 font-black flex items-center justify-center text-2xl shrink-0 shadow-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{p.name}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20">
                  Collaborator
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                {p.title} · {p.location} · {p.yearsExperience}y experience
              </p>
            </div>
            <Link
              to="/collaborator/settings#identity"
              className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors self-start"
            >
              Edit Profile
            </Link>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 mt-3 italic bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200 dark:border-white/10">
            "{p.headline}"
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#20C997] animate-pulse"></span>
            <span>Available · {p.weeklyHours} hrs/week · {commitmentLabel[p.commitmentStyle]}</span>
          </p>
        </div>
      </div>

      {/* Reputation strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Reputation" value={String(summary?.compositeScore ?? 0)} />
        <Stat label="Execution Velocity" value={String(execution)} />
        <Stat label="Completed Tasks" value={String(completedTasks)} />
        <Stat label="Endorsements" value="0" />
      </div>

      {loading && <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">Loading live profile data...</p>}
      {!loading && error && (
        <div className="border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-2xl px-5 py-3.5 text-sm backdrop-blur-md">
          Live profile data is unavailable: {error}
        </div>
      )}

      {/* Discipline & skills */}
      <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">{p.discipline || "Discipline not set"}</h2>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {p.subSkills.map((s) => (
            <span key={s} className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20">
              {s}
            </span>
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-2.5">Tech Stack & Frameworks</p>
        <div className="flex flex-wrap gap-1.5">
          {p.techStack.map((t) => (
            <span key={t} className="text-xs font-medium px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Compensation philosophy */}
      <div className="bg-[#20C997]/10 border border-[#20C997]/20 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">Building for Equity Philosophy</h2>
        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          {p.equityPreference}% equity / {100 - p.equityPreference}% cash · Min cash floor ${p.minCashFloor.toLocaleString()}/mo ·
          {" "}{p.vestingComfort === "standard" ? "Standard" : p.vestingComfort === "1y-cliff-4y" ? "1y cliff / 4y" : "Custom"} vesting structure
        </p>
      </div>

      {/* Active builds */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Builds & Contributions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {builds.map((build) => (
            <div
              key={build.id}
              className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm hover:border-[#20C997]/30 transition-all"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">{build.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{build.shipped} tasks shipped · Impact {build.impactAvg}</p>
              {build.equityPercent > 0 && (
                <p className="text-xs font-bold text-[#20C997] mt-2.5">
                  {build.equityPercent}% equity · ${(build.valueUSD / 1000).toFixed(1)}K
                </p>
              )}
            </div>
          ))}
          {!loading && !error && builds.length === 0 && (
            <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-6 text-xs text-slate-500 dark:text-slate-400 md:col-span-3 text-center bg-white/40 dark:bg-[#121212]/40">
              No live active builds recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Pinned work */}
      {p.pinnedWork.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Pinned Work & Deliverables</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {p.pinnedWork.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300 hover:border-[#20C997]/40 flex items-center gap-2 transition-all shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-[#20C997] shrink-0" />
                <span className="truncate font-semibold">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Badges earned */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Live Achievements & Badges</h2>
        <div className="flex flex-wrap gap-2.5">
          {earnedAchievements.map((b) => (
            <span
              key={b.id}
              className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold flex items-center gap-2 shadow-sm text-slate-900 dark:text-white"
            >
              <span className="text-lg">{b.icon}</span>
              <span>{b.title}</span>
            </span>
          ))}
          {!loading && !error && earnedAchievements.length === 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">No live achievements earned yet.</span>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-4 text-xs font-semibold pt-2">
        {p.links.github && (
          <a href={`https://${p.links.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#20C997]">
            <Github className="w-4 h-4" /> <span>{p.links.github}</span>
          </a>
        )}
        {p.links.linkedin && (
          <a href={`https://${p.links.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#20C997]">
            <Linkedin className="w-4 h-4" /> <span>{p.links.linkedin}</span>
          </a>
        )}
        {p.links.portfolio && (
          <a href={`https://${p.links.portfolio}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-[#20C997]">
            <Globe className="w-4 h-4" /> <span>{p.links.portfolio}</span>
          </a>
        )}
        {p.links.twitter && (
          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Twitter className="w-4 h-4" /> <span>{p.links.twitter}</span>
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-400 text-center pt-4">
        ${earnings.totals.lifetimeUSD.toLocaleString()} cash lifetime · See{" "}
        <Link to="/collaborator/equity" className="underline text-[#20C997]">Equity</Link> and{" "}
        <Link to="/collaborator/earnings" className="underline text-[#20C997]">Earnings</Link>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 text-center shadow-sm">
      <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold">{label}</p>
    </div>
  );
}

// frontend/src/dashboard/collaborators/section/components/collab/CollabProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Globe, Twitter, ExternalLink } from "lucide-react";
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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header strip */}
      <div className="border border-slate-200 bg-white rounded-xl p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-900 font-semibold flex items-center justify-center text-xl shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">{p.name}</h1>
          <p className="text-sm text-slate-600">{p.title} · {p.location} · {p.yearsExperience}y experience</p>
          <p className="text-sm text-slate-700 mt-2 italic">"{p.headline}"</p>
          <p className="text-xs text-slate-500 mt-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
            Available · {p.weeklyHours} hrs/week · {commitmentLabel[p.commitmentStyle]}
          </p>
        </div>
        <Link to="/collaborator/settings#identity"
          className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50">Edit profile</Link>
      </div>

      {/* Reputation strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Reputation" value={String(summary?.compositeScore ?? 0)} />
        <Stat label="Execution"  value={String(execution)} />
        <Stat label="Completed"  value={String(completedTasks)} />
        <Stat label="Endorsements" value="0" />
      </div>

      {loading && <p className="text-sm text-slate-500">Loading live profile data...</p>}
      {!loading && error && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700">Live profile data is unavailable.</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Discipline & skills */}
      <div className="border border-slate-200 bg-white rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">{p.discipline || "Discipline not set"}</h2>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {p.subSkills.map((s) => (
            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">{s}</span>
          ))}
        </div>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Stack</p>
        <div className="flex flex-wrap gap-1.5">
          {p.techStack.map((t) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{t}</span>
          ))}
        </div>
      </div>

      {/* Compensation philosophy */}
      <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-amber-800 mb-1">Building for Equity</h2>
        <p className="text-sm text-slate-700">
          {p.equityPreference}% equity / {100 - p.equityPreference}% cash ·
          Min cash ${p.minCashFloor.toLocaleString()}/mo ·
          {" "}{p.vestingComfort === "standard" ? "Standard" : p.vestingComfort === "1y-cliff-4y" ? "1y cliff / 4y" : "Custom"} vesting
        </p>
      </div>

      {/* Active builds */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Active builds</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {builds.map((build) => (
            <div key={build.id} className="border border-slate-200 bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{build.name}</p>
                  <p className="text-xs text-slate-500">{build.shipped} tasks shipped · impact {build.impactAvg}</p>
                </div>
              </div>
              {build.equityPercent > 0 && (
                <p className="text-xs text-amber-700 mt-2">{build.equityPercent}% equity · ${(build.valueUSD / 1000).toFixed(1)}K</p>
              )}
            </div>
          ))}
          {!loading && !error && builds.length === 0 && (
            <div className="border border-dashed border-slate-300 bg-white rounded-xl p-4 text-sm text-slate-500 md:col-span-3">
              No live active builds are recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Pinned work */}
      {p.pinnedWork.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Pinned work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {p.pinnedWork.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                className="border border-slate-200 bg-white rounded-xl p-4 text-sm text-slate-700 hover:border-amber-300 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Recent endorsements</h2>
          <Link to="/collaborator/reputation" className="text-xs text-amber-600 hover:underline">View reputation</Link>
        </div>
        <div className="border border-dashed border-slate-300 bg-white rounded-xl p-4 text-sm text-slate-500">
          No live endorsements are recorded yet.
        </div>
      </div>

      {/* Badges earned */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Live achievements earned</h2>
        <div className="flex flex-wrap gap-2">
          {earnedAchievements.map((b) => (
            <span key={b.id} className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm flex items-center gap-2">
              <span>{b.icon}</span>
              <span className="text-slate-900">{b.title}</span>
            </span>
          ))}
          {!loading && !error && earnedAchievements.length === 0 && (
            <span className="text-sm text-slate-500">No live achievements earned yet.</span>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3 text-sm">
        {p.links.github    && <a href={`https://${p.links.github}`}    target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 hover:text-amber-600"><Github   className="w-4 h-4" /> {p.links.github}</a>}
        {p.links.linkedin  && <a href={`https://${p.links.linkedin}`}  target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 hover:text-amber-600"><Linkedin className="w-4 h-4" /> {p.links.linkedin}</a>}
        {p.links.portfolio && <a href={`https://${p.links.portfolio}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-slate-700 hover:text-amber-600"><Globe    className="w-4 h-4" /> {p.links.portfolio}</a>}
        {p.links.twitter   && <span className="flex items-center gap-1.5 text-slate-700"><Twitter  className="w-4 h-4" /> {p.links.twitter}</span>}
      </div>

      <p className="text-xs text-slate-400 text-center pt-4">${earnings.totals.lifetimeUSD.toLocaleString()} cash lifetime · See <Link to="/collaborator/equity" className="underline hover:text-amber-600">Equity</Link> and <Link to="/collaborator/earnings" className="underline hover:text-amber-600">Earnings</Link></p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-white rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

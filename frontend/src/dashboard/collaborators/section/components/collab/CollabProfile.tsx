// frontend/src/dashboard/collaborators/section/components/collab/CollabProfile.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Globe, Twitter, ExternalLink, BadgeCheck } from "lucide-react";
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
import { RoleAdditionPanel } from "@/components/profile/RoleAdditionPanel";
import { fetchTrustProfile, type TrustProfile } from "@/lib/api/trust";

export function CollabProfile() {
  const { collaboratorProfile: p } = useCollaboratorProfile();
  const [summary, setSummary] = useState<CollaboratorLiveSummary | null>(null);
  const [equity, setEquity] = useState<CollaboratorEquity>(EMPTY_EQUITY);
  const [earnings, setEarnings] = useState<CollaboratorEarnings>(EMPTY_EARNINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trust, setTrust] = useState<TrustProfile | null>(null);

  const initials = p.name.split(" ").map((x) => x[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchCollaboratorSummary(),
      fetchCollaboratorEquity(),
      fetchCollaboratorEarnings(),
      fetchTrustProfile(),
    ])
      .then(([summaryData, equityData, earningsData, trustData]) => {
        if (!alive) return;
        setSummary(summaryData);
        setEquity(equityData);
        setEarnings(earningsData);
        setTrust(trustData);
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
      <RoleAdditionPanel />
      {/* Header strip */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-status-warning text-text-primary font-semibold flex items-center justify-center text-xl shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-text-primary">{p.name}</h1>
          <p className="text-sm text-text-muted">{p.title} · {p.location} · {p.yearsExperience}y experience</p>
          <p className="text-sm text-text-secondary mt-2 italic">"{p.headline}"</p>
          <p className="text-xs text-text-muted mt-3">
            <span className="inline-block w-2 h-2 rounded-full bg-status-success mr-1.5"></span>
            Available · {p.weeklyHours} hrs/week · {commitmentLabel[p.commitmentStyle]}
          </p>
        </div>
        <Link to="/collaborator/settings#identity"
          className="text-xs px-3 py-1.5 border border-border-strong rounded-lg hover:bg-background-primary">Edit profile</Link>
      </div>

      {/* Reputation strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Reputation" value={String(summary?.compositeScore ?? 0)} />
        <Stat label="Execution"  value={String(execution)} />
        <Stat label="Completed"  value={String(completedTasks)} />
        <Stat label="Endorsements" value="0" />
      </div>

      {loading && <p className="text-sm text-text-muted">Loading live profile data...</p>}
      {!loading && error && (
        <div className="border border-status-error bg-status-error-soft rounded-xl p-4">
          <p className="text-sm font-semibold text-status-error">Live profile data is unavailable.</p>
          <p className="text-sm text-status-error mt-1">{error}</p>
        </div>
      )}

      {/* Discipline & skills */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">{p.discipline || "Discipline not set"}</h2>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {p.subSkills.map((s) => (
            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-status-warning-soft text-status-warning">{s}</span>
          ))}
        </div>
        <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-2">Stack</p>
        <div className="flex flex-wrap gap-1.5">
          {p.techStack.map((t) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-surface-secondary text-text-muted">{t}</span>
          ))}
        </div>
        {Array.isArray(trust?.verifiedSkills) && trust.verifiedSkills.length > 0 && <div className="mt-5 border-t border-border-default pt-4"><p className="mb-2 text-xs font-semibold uppercase text-text-muted">Externally verified skills</p><div className="flex flex-wrap gap-2">{trust.verifiedSkills.map((item) => <span key={`${item.skill}-${item.source}`} className="inline-flex items-center gap-1 rounded-full border border-status-success bg-status-success-soft px-2.5 py-1 text-xs text-status-success"><BadgeCheck className="h-3.5 w-3.5" />{item.skill}</span>)}</div></div>}
      </div>

      {/* Compensation philosophy */}
      <div className="border border-status-warning bg-status-warning-soft/30 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-status-warning mb-1">Building for Equity</h2>
        <p className="text-sm text-text-secondary">
          {p.equityPreference}% equity / {100 - p.equityPreference}% cash ·
          Min cash ${p.minCashFloor.toLocaleString()}/mo ·
          {" "}{p.vestingComfort === "standard" ? "Standard" : p.vestingComfort === "1y-cliff-4y" ? "1y cliff / 4y" : "Custom"} vesting
        </p>
      </div>

      {/* Active builds */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Active builds</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {builds.map((build) => (
            <div key={build.id} className="border border-border-default bg-surface-primary rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{build.name}</p>
                  <p className="text-xs text-text-muted">{build.shipped} tasks shipped · impact {build.impactAvg}</p>
                </div>
              </div>
              {build.equityPercent > 0 && (
                <p className="text-xs text-status-warning mt-2">{build.equityPercent}% equity · ${(build.valueUSD / 1000).toFixed(1)}K</p>
              )}
            </div>
          ))}
          {!loading && !error && builds.length === 0 && (
            <div className="border border-dashed border-border-strong bg-surface-primary rounded-xl p-4 text-sm text-text-muted md:col-span-3">
              No live active builds are recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Pinned work */}
      {p.pinnedWork.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3">Pinned work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {p.pinnedWork.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer"
                className="border border-border-default bg-surface-primary rounded-xl p-4 text-sm text-text-secondary hover:border-status-warning flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-text-disabled" />
                <span className="truncate">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary">Recent endorsements</h2>
          <Link to="/collaborator/reputation" className="text-xs text-status-warning hover:underline">View reputation</Link>
        </div>
        <div className="border border-dashed border-border-strong bg-surface-primary rounded-xl p-4 text-sm text-text-muted">
          No live endorsements are recorded yet.
        </div>
      </div>

      {/* Badges earned */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Live achievements earned</h2>
        <div className="flex flex-wrap gap-2">
          {earnedAchievements.map((b) => (
            <span key={b.id} className="border border-border-default bg-surface-primary rounded-xl px-3 py-2 text-sm flex items-center gap-2">
              <span>{b.icon}</span>
              <span className="text-text-primary">{b.title}</span>
            </span>
          ))}
          {!loading && !error && earnedAchievements.length === 0 && (
            <span className="text-sm text-text-muted">No live achievements earned yet.</span>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3 text-sm">
        {p.links.github    && <a href={`https://${p.links.github}`}    target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-text-secondary hover:text-status-warning"><Github   className="w-4 h-4" /> {p.links.github}</a>}
        {p.links.linkedin  && <a href={`https://${p.links.linkedin}`}  target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-text-secondary hover:text-status-warning"><Linkedin className="w-4 h-4" /> {p.links.linkedin}</a>}
        {p.links.portfolio && <a href={`https://${p.links.portfolio}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-text-secondary hover:text-status-warning"><Globe    className="w-4 h-4" /> {p.links.portfolio}</a>}
        {p.links.twitter   && <span className="flex items-center gap-1.5 text-text-secondary"><Twitter  className="w-4 h-4" /> {p.links.twitter}</span>}
      </div>

      <p className="text-xs text-text-disabled text-center pt-4">${earnings.totals.lifetimeUSD.toLocaleString()} cash lifetime · See <Link to="/collaborator/equity" className="underline hover:text-status-warning">Equity</Link> and <Link to="/collaborator/earnings" className="underline hover:text-status-warning">Earnings</Link></p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border-default bg-surface-primary rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
      <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}

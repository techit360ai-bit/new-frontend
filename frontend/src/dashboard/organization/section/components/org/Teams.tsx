import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Clock,
  FolderKanban,
  Gauge,
  RefreshCw,
  Rocket,
  Search,
  UserMinus,
  Users,
} from "lucide-react";
import {
  fetchOrganizationProjects,
  type OrganizationProject,
} from "@/lib/api/organization";
import { deriveOrganizationTeams } from "@/lib/api/organizationTeams";

type TeamSort = "projects" | "progress" | "name";

function timestampLabel(value: string): string {
  if (!value) return "No persisted update";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function labelFor(value: string, fallback: string): string {
  if (!value.trim()) return fallback;
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(value: string): string {
  const status = value.toLowerCase();
  if (status.includes("risk") || status.includes("blocked")) {
    return "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400";
  }
  if (status.includes("complete") || status.includes("done")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }
  if (status.includes("track") || status.includes("active")) {
    return "border-[#20C997]/30 bg-[#20C997]/10 text-[#20C997]";
  }
  return "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300";
}

export function Teams() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<OrganizationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TeamSort>("projects");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await fetchOrganizationProjects());
    } catch (loadError) {
      setProjects([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Organization team assignments are unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const teamData = useMemo(() => deriveOrganizationTeams(projects), [projects]);
  const visibleTeams = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teamData.teams
      .filter((team) =>
        !query ||
        team.name.toLowerCase().includes(query) ||
        team.industries.some((industry) => industry.toLowerCase().includes(query)))
      .sort((left, right) => {
        if (sort === "name") return left.name.localeCompare(right.name);
        if (sort === "progress") {
          return right.averageProgress - left.averageProgress || left.name.localeCompare(right.name);
        }
        return right.projectCount - left.projectCount || left.name.localeCompare(right.name);
      });
  }, [search, sort, teamData.teams]);

  const metricCards = [
    {
      label: "Assigned Teams",
      value: teamData.teams.length,
      detail: "Distinct persisted team names",
      icon: Users,
      tone: "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20",
    },
    {
      label: "Assigned Projects",
      value: teamData.assignedProjects,
      detail: `${projects.length} total projects`,
      icon: FolderKanban,
      tone: "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20",
    },
    {
      label: "Recorded Project Seats",
      value: teamData.recordedSeats,
      detail: "Sum of persisted member counts",
      icon: Briefcase,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    },
    {
      label: "Unassigned Projects",
      value: teamData.unassignedProjects.length,
      detail: "Projects without a team name",
      icon: UserMinus,
      tone: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-6 transition-colors">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Team Assignments</h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Persisted project ownership, capacity, progress, and risk by assigned team
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadTeams()}
            disabled={loading}
            title="Refresh team assignments"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#20C997] hover:border-[#20C997]/30 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 text-[#20C997] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate("/org/projects")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 text-xs font-bold text-slate-950 transition-all shadow-sm"
          >
            Manage Assignments
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-16 text-center text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm">
          Loading persisted team assignments...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-7 w-7 text-red-500" />
          <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => void loadTeams()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-all shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">No persisted team assignments</h2>
          <p className="mx-auto mt-1 max-w-lg text-xs font-medium text-slate-500 dark:text-slate-400">
            Teams on this screen are derived from organization project assignments. Create a
            project and record its team name to populate this view.
          </p>
          <button
            type="button"
            onClick={() => navigate("/org/projects")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-sm"
          >
            Open Projects
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30">
                  <span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">{metric.value}</p>
                  <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">{metric.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{metric.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-4 sm:flex-row shadow-sm">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams or industries..."
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] pl-9 pr-4 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
              />
            </div>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as TeamSort)}
              aria-label="Sort teams"
              className="h-10 min-w-48 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] px-3 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#20C997] focus:ring-1 focus:ring-[#20C997]"
            >
              <option value="projects">Most projects</option>
              <option value="progress">Highest progress</option>
              <option value="name">Team name</option>
            </select>
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Assigned Teams</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Aggregated from persisted project team names
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {visibleTeams.length} visible
              </span>
            </div>

            {teamData.teams.length === 0 ? (
              <EmptyPanel
                icon={Users}
                title="No projects have team assignments"
                detail="Use Projects to record a team name on persisted organization projects."
              />
            ) : visibleTeams.length === 0 ? (
              <EmptyPanel
                icon={Search}
                title="No teams match this search"
                detail="Adjust the team or industry search to see other assignments."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {visibleTeams.map((team) => (
                  <article key={team.key} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">{team.name}</h3>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {team.industries.length > 0
                            ? team.industries.join(" | ")
                            : "No persisted industry labels"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#20C997]/10 border border-[#20C997]/20 px-2.5 py-0.5 text-xs font-bold text-[#20C997]">
                        {team.projectCount} project{team.projectCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mb-5 grid grid-cols-3 gap-3">
                      <TeamStat label="Project seats" value={team.recordedSeats} />
                      <TeamStat label="Market ready" value={team.marketReadyCount} />
                      <TeamStat label="At risk" value={team.atRiskCount} />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">Average progress</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{team.averageProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#20C997]"
                          style={{ width: `${team.averageProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/[0.05] dark:border-white/10 pt-4">
                      <p className="min-w-0 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        Updated {timestampLabel(team.latestUpdatedAt)}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/org/projects")}
                        className="flex-shrink-0 text-xs font-bold text-[#20C997] hover:underline"
                      >
                        View projects
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Unassigned Projects</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Persisted projects without a team name</p>
                </div>
                <UserMinus className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              </div>
              {teamData.unassignedProjects.length > 0 ? (
                <div className="divide-y divide-black/[0.05] dark:divide-white/10">
                  {teamData.unassignedProjects.slice(0, 8).map((project) => (
                    <div key={project.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{project.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {labelFor(project.stage, "No stage")} | {project.progress}% progress
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/org/projects")}
                        className="flex-shrink-0 text-xs font-bold text-[#20C997] hover:underline"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={Rocket}
                  title="Every project has a team"
                  detail="No persisted organization project is currently unassigned."
                />
              )}
            </section>

            <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Project Updates</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Latest persisted team-linked project records</p>
                </div>
                <Clock className="h-5 w-5 text-[#20C997]" />
              </div>
              {teamData.activity.length > 0 ? (
                <div className="divide-y divide-black/[0.05] dark:divide-white/10">
                  {teamData.activity.slice(0, 8).map((item) => (
                    <div key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{item.projectTitle}</p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {item.teamName} | {item.progress}% progress
                          </p>
                        </div>
                        <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusTone(item.status)}`}>
                          {labelFor(item.status, "Unknown")}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{timestampLabel(item.updatedAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={Clock}
                  title="No project updates"
                  detail="Update timestamps will appear after persisted projects change."
                />
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function TeamStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/[0.05] dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3 py-2.5 text-center">
      <p className="text-base font-black font-mono text-slate-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Gauge;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 py-8 text-center">
      <Icon className="mb-3 h-7 w-7 text-slate-400 dark:text-slate-500" />
      <p className="text-xs font-bold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

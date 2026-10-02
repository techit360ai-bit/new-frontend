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
    return "border-status-warning bg-status-warning-soft text-status-warning";
  }
  if (status.includes("complete") || status.includes("done")) {
    return "border-status-success bg-status-success-soft text-status-success";
  }
  if (status.includes("track") || status.includes("active")) {
    return "border-status-info bg-status-info-soft text-status-info";
  }
  return "border-border-default bg-background-primary text-text-secondary";
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
      tone: "bg-status-info-soft text-brand-accent",
    },
    {
      label: "Assigned Projects",
      value: teamData.assignedProjects,
      detail: `${projects.length} total projects`,
      icon: FolderKanban,
      tone: "bg-status-info-soft text-status-info",
    },
    {
      label: "Recorded Project Seats",
      value: teamData.recordedSeats,
      detail: "Sum of persisted member counts",
      icon: Briefcase,
      tone: "bg-status-success-soft text-status-success",
    },
    {
      label: "Unassigned Projects",
      value: teamData.unassignedProjects.length,
      detail: "Projects without a team name",
      icon: UserMinus,
      tone: "bg-status-warning-soft text-status-warning",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Team Assignments</h1>
          <p className="mt-2 text-text-muted">
            Persisted project ownership, capacity, progress, and risk by assigned team
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadTeams()}
            disabled={loading}
            title="Refresh team assignments"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface-primary px-4 text-sm font-semibold text-text-secondary hover:bg-background-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate("/org/projects")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 text-sm font-semibold text-white hover:bg-brand-accent"
          >
            Manage Assignments
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-border-default bg-surface-primary p-12 text-center text-sm text-text-muted">
          Loading persisted team assignments...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-status-error bg-status-error-soft p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-7 w-7 text-status-error" />
          <p className="text-sm text-status-error">{error}</p>
          <button
            type="button"
            onClick={() => void loadTeams()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-status-error px-4 py-2 text-sm font-semibold text-white hover:bg-status-error"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface-primary p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-text-disabled" />
          <h2 className="font-semibold text-text-primary">No persisted team assignments</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted">
            Teams on this screen are derived from organization project assignments. Create a
            project and record its team name to populate this view.
          </p>
          <button
            type="button"
            onClick={() => navigate("/org/projects")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent"
          >
            Open Projects
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-lg border border-border-default bg-surface-primary p-5">
                  <span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${metric.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-3xl font-bold text-text-primary">{metric.value}</p>
                  <p className="mt-1 text-sm font-medium text-text-secondary">{metric.label}</p>
                  <p className="mt-1 text-xs text-text-muted">{metric.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mb-6 flex flex-col gap-3 border-y border-border-default bg-surface-primary py-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams or industries"
                className="h-10 w-full rounded-lg border border-border-strong pl-9 pr-4 text-sm outline-none focus:border-brand-accent focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as TeamSort)}
              aria-label="Sort teams"
              className="h-10 min-w-48 rounded-lg border border-border-strong bg-surface-primary px-3 text-sm text-text-secondary outline-none focus:border-brand-accent focus:ring-2 focus:ring-indigo-100"
            >
              <option value="projects">Most projects</option>
              <option value="progress">Highest progress</option>
              <option value="name">Team name</option>
            </select>
          </div>

          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Assigned Teams</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Aggregated from persisted project team names
                </p>
              </div>
              <span className="text-xs font-medium text-text-muted">
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
                  <article key={team.key} className="rounded-lg border border-border-default bg-surface-primary p-5">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-text-primary">{team.name}</h3>
                        <p className="mt-1 truncate text-sm text-text-muted">
                          {team.industries.length > 0
                            ? team.industries.join(" | ")
                            : "No persisted industry labels"}
                        </p>
                      </div>
                      <span className="rounded-lg bg-status-info-soft px-2.5 py-1 text-xs font-semibold text-brand-accent">
                        {team.projectCount} project{team.projectCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mb-5 grid grid-cols-3 gap-3">
                      <TeamStat label="Project seats" value={team.recordedSeats} />
                      <TeamStat label="Market ready" value={team.marketReadyCount} />
                      <TeamStat label="At risk" value={team.atRiskCount} />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-text-muted">Average progress</span>
                        <span className="font-semibold text-text-primary">{team.averageProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                        <div
                          className="h-full rounded-full bg-brand-accent"
                          style={{ width: `${team.averageProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
                      <p className="min-w-0 truncate text-xs text-text-muted">
                        Updated {timestampLabel(team.latestUpdatedAt)}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/org/projects")}
                        className="flex-shrink-0 text-sm font-semibold text-brand-accent hover:text-brand-accent"
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
            <section className="rounded-lg border border-border-default bg-surface-primary p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Unassigned Projects</h2>
                  <p className="mt-1 text-sm text-text-muted">Persisted projects without a team name</p>
                </div>
                <UserMinus className="h-5 w-5 text-status-warning" />
              </div>
              {teamData.unassignedProjects.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {teamData.unassignedProjects.slice(0, 8).map((project) => (
                    <div key={project.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{project.title}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {labelFor(project.stage, "No stage")} | {project.progress}% progress
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/org/projects")}
                        className="flex-shrink-0 text-sm font-semibold text-brand-accent hover:text-brand-accent"
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

            <section className="rounded-lg border border-border-default bg-surface-primary p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Recent Project Updates</h2>
                  <p className="mt-1 text-sm text-text-muted">Latest persisted team-linked project records</p>
                </div>
                <Clock className="h-5 w-5 text-status-info" />
              </div>
              {teamData.activity.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {teamData.activity.slice(0, 8).map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text-primary">{item.projectTitle}</p>
                          <p className="mt-1 truncate text-xs text-text-muted">
                            {item.teamName} | {item.progress}% progress
                          </p>
                        </div>
                        <span className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(item.status)}`}>
                          {labelFor(item.status, "Unknown")}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-text-disabled">{timestampLabel(item.updatedAt)}</p>
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
    <div className="rounded-lg bg-background-primary px-3 py-3 text-center">
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
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
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong px-6 py-8 text-center">
      <Icon className="mb-3 h-7 w-7 text-text-disabled" />
      <p className="font-medium text-text-primary">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-text-muted">{detail}</p>
    </div>
  );
}

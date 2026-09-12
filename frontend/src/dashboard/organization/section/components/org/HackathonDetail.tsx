import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flame,
  Gavel,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  fetchHackathonLeaderboard,
  fetchHackathonOverview,
  fetchHackathonPipeline,
  fetchHackathonVelocity,
  fetchOrganizerHackathon,
  type HackathonOverview,
  type LeaderboardEntry,
  type OrganizerHackathon,
  type PipelineBuckets,
  type VelocityCell,
} from "@/lib/api/hackathon";

type TabId = "overview" | "registration" | "live" | "judging" | "report";

interface DetailData {
  event: OrganizerHackathon;
  overview: HackathonOverview;
  velocity: VelocityCell[];
  leaderboard: LeaderboardEntry[];
  pipeline: PipelineBuckets;
}

interface TeamRow {
  id: string;
  name: string;
  activity: number;
  composite: number;
  crsBand: string;
}

const tabs: Array<{ id: TabId; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: ClipboardList },
  { id: "registration", label: "Registration & Teams", icon: Users },
  { id: "live", label: "Live Command Centre", icon: Activity },
  { id: "judging", label: "Judging", icon: Gavel },
  { id: "report", label: "Intelligence Report", icon: FileText },
];

const statusStyles: Record<OrganizerHackathon["hackathonStatus"], string> = {
  upcoming: "bg-[#20C997]/10 text-[#20C997]",
  live: "bg-emerald-50 text-emerald-700",
  judging: "bg-amber-50 text-amber-700",
  completed: "bg-gray-100 text-gray-700",
};

function dateLabel(value: string): string {
  if (!value) return "Not set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function titleLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildTeamRows(velocity: VelocityCell[], leaderboard: LeaderboardEntry[]): TeamRow[] {
  const rows = new Map<string, TeamRow>();
  for (const team of velocity) {
    if (!team.teamId) continue;
    rows.set(team.teamId, {
      id: team.teamId,
      name: team.name || "Untitled team",
      activity: team.activity,
      composite: 0,
      crsBand: "unscored",
    });
  }
  for (const team of leaderboard) {
    if (!team.teamId) continue;
    const current = rows.get(team.teamId);
    rows.set(team.teamId, {
      id: team.teamId,
      name: team.name || current?.name || "Untitled team",
      activity: current?.activity ?? 0,
      composite: team.composite,
      crsBand: team.crsBand || "unscored",
    });
  }
  return [...rows.values()].sort((left, right) => right.composite - left.composite);
}

export function HackathonDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabId>("overview");
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError("Hackathon ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [event, overview, velocity, leaderboard, pipeline] = await Promise.all([
        fetchOrganizerHackathon(id),
        fetchHackathonOverview(id),
        fetchHackathonVelocity(id),
        fetchHackathonLeaderboard(id),
        fetchHackathonPipeline(id),
      ]);
      if (!event) throw new Error("Hackathon not found.");
      setData({ event, overview, velocity, leaderboard, pipeline });
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Hackathon data is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const teams = useMemo(
    () => buildTeamRows(data?.velocity ?? [], data?.leaderboard ?? []),
    [data],
  );

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          to="/org/hackathons"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#20C997]"
        >
          <ArrowLeft className="h-4 w-4" />
          All hackathons
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Live hackathon data could not be loaded.</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          Loading persisted hackathon data...
        </div>
      ) : data ? (
        <>
          <EventHeader event={data.event} overview={data.overview} />

          <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${
                    active
                      ? "border-[#20C997] text-[#20C997]"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {tab === "overview" && <OverviewTab event={data.event} />}
          {tab === "registration" && <RegistrationTab overview={data.overview} teams={teams} />}
          {tab === "live" && <LiveTab overview={data.overview} velocity={data.velocity} />}
          {tab === "judging" && <JudgingTab event={data.event} leaderboard={data.leaderboard} />}
          {tab === "report" && (
            <ReportTab
              event={data.event}
              overview={data.overview}
              leaderboard={data.leaderboard}
              pipeline={data.pipeline}
            />
          )}
        </>
      ) : null}
    </div>
  );
}

function EventHeader({
  event,
  overview,
}: {
  event: OrganizerHackathon;
  overview: HackathonOverview;
}) {
  return (
    <section className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-[#20C997]/10 p-2">
              <Trophy className="h-6 w-6 text-[#20C997]" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[event.hackathonStatus]}`}>
              {titleLabel(event.hackathonStatus)}
            </span>
          </div>
          <p className="text-sm text-gray-600">{event.theme || "No theme has been persisted."}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {dateLabel(event.startDate)} to {dateLabel(event.endDate)}
              {event.durationHours > 0 ? ` (${event.durationHours}h)` : ""}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {overview.registrants} registrants
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {overview.totalTeams} teams
            </span>
          </div>
        </div>
        <div className="max-w-md">
          <p className="mb-2 text-xs font-medium text-gray-500">Partners</p>
          {event.partners.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {event.partners.map((partner) => (
                <span key={partner} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {partner}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No partners are attached.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function OverviewTab({ event }: { event: OrganizerHackathon }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card title="Event configuration" icon={Calendar}>
        <Definition label="Eligibility" value={event.eligibility || "Not configured"} />
        <Definition label="Build window" value={event.durationHours > 0 ? `${event.durationHours} hours` : "Not configured"} />
        <Definition label="Mentor pool" value={event.mentorPool > 0 ? String(event.mentorPool) : "Not configured"} />
        <Definition label="Prize pool" value={event.prizePool || "Not configured"} />
      </Card>

      <Card title="Prize structure" icon={Award}>
        {event.prizes.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {event.prizes.map((prize, index) => (
              <div key={`${prize.rank}-${index}`} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span className="text-sm font-medium text-gray-700">{prize.rank || "Prize tier"}</span>
                <span className="text-sm font-bold text-gray-900">{prize.amount || "Amount not set"}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No prize tiers have been persisted.</EmptyState>
        )}
      </Card>

      <Card title="Judging dimensions" icon={Gavel}>
        {event.judgingDimensions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {event.judgingDimensions.map((dimension) => (
              <span key={dimension} className="rounded-full bg-[#20C997]/10 px-3 py-1.5 text-xs font-medium text-[#20C997]">
                {titleLabel(dimension)}
              </span>
            ))}
          </div>
        ) : (
          <EmptyState>No judging dimensions have been persisted.</EmptyState>
        )}
      </Card>

      <Card title="Event summary" icon={ClipboardList}>
        <p className="text-sm leading-6 text-gray-700">
          {event.summary || event.theme || "No event summary has been persisted."}
        </p>
      </Card>
    </div>
  );
}

function RegistrationTab({
  overview,
  teams,
}: {
  overview: HackathonOverview;
  teams: TeamRow[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registrants" value={overview.registrants} />
        <Stat label="Registered teams" value={overview.totalTeams} />
        <Stat label="Still solo" value={overview.stillSolo} tone={overview.stillSolo > 0 ? "warn" : "neutral"} />
        <Stat label="Idea submissions" value={overview.ideaSubmissions} />
      </div>

      <Card title="Persisted teams" icon={Users}>
        {teams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Build velocity</th>
                  <th className="px-3 py-2">Composite score</th>
                  <th className="px-3 py-2">CRS band</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-3 font-semibold text-gray-900">{team.name}</td>
                    <td className="px-3 py-3 tabular-nums text-gray-700">{team.activity}</td>
                    <td className="px-3 py-3 tabular-nums text-gray-700">{team.composite}</td>
                    <td className="px-3 py-3 text-gray-700">{titleLabel(team.crsBand)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No teams are registered for this hackathon yet.</EmptyState>
        )}
      </Card>
    </div>
  );
}

function LiveTab({
  overview,
  velocity,
}: {
  overview: HackathonOverview;
  velocity: VelocityCell[];
}) {
  const stalled = velocity.filter((team) => team.activity <= 33).length;
  const pendingIdeas = Math.max(overview.totalTeams - overview.ideaSubmissions, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Average build velocity" value={Math.round(overview.avgBuildVelocity)} />
        <Stat label="Idea submissions" value={`${overview.ideaSubmissions} / ${overview.totalTeams}`} />
        <Stat label="Teams reporting" value={velocity.length} />
        <Stat label="Stalled teams" value={stalled} tone={stalled > 0 ? "warn" : "neutral"} />
      </div>

      <Card title="Build velocity" icon={Flame}>
        {velocity.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {velocity.map((team) => {
                const color = team.activity > 66
                  ? "bg-emerald-500"
                  : team.activity > 33
                    ? "bg-amber-400"
                    : "bg-red-500";
                return (
                  <div
                    key={team.teamId}
                    className={`flex min-h-20 flex-col items-center justify-center rounded-lg px-2 text-center text-white ${color}`}
                    title={`${team.name}: ${team.activity}`}
                  >
                    <span className="line-clamp-2 text-xs font-semibold">{team.name || "Untitled team"}</span>
                    <span className="mt-1 text-sm font-bold tabular-nums">{team.activity}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
              <Legend color="bg-emerald-500" label="High" />
              <Legend color="bg-amber-400" label="Medium" />
              <Legend color="bg-red-500" label="Stalled" />
            </div>
          </>
        ) : (
          <EmptyState>No persisted check-in velocity is available.</EmptyState>
        )}
      </Card>

      <Card title="Idea submission progress" icon={ClipboardList}>
        <Progress label="Submitted" value={overview.ideaSubmissions} total={overview.totalTeams} color="bg-emerald-500" />
        <div className="mt-4">
          <Progress label="Not submitted" value={pendingIdeas} total={overview.totalTeams} color="bg-amber-400" />
        </div>
      </Card>

      <UnavailablePanel>
        Mentor utilisation and problem-sector clustering are unavailable because those records are not attached to the persisted hackathon contract.
      </UnavailablePanel>
    </div>
  );
}

function JudgingTab({
  event,
  leaderboard,
}: {
  event: OrganizerHackathon;
  leaderboard: LeaderboardEntry[];
}) {
  return (
    <div className="space-y-6">
      <Card title="Configured judging dimensions" icon={Gavel}>
        {event.judgingDimensions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {event.judgingDimensions.map((dimension) => (
              <span key={dimension} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                {titleLabel(dimension)}
              </span>
            ))}
          </div>
        ) : (
          <EmptyState>No judging framework is configured.</EmptyState>
        )}
      </Card>

      <Card title="Persisted leaderboard" icon={Award}>
        {leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Composite</th>
                  <th className="px-3 py-2">CRS band</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((team, index) => (
                  <tr key={team.teamId} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-3 font-bold text-gray-900">{index + 1}</td>
                    <td className="px-3 py-3 font-semibold text-gray-900">{team.name || "Untitled team"}</td>
                    <td className="px-3 py-3 font-bold tabular-nums text-[#20C997]">{team.composite}</td>
                    <td className="px-3 py-3 text-gray-700">{titleLabel(team.crsBand)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No persisted scores are available yet.</EmptyState>
        )}
      </Card>
    </div>
  );
}

function ReportTab({
  event,
  overview,
  leaderboard,
  pipeline,
}: {
  event: OrganizerHackathon;
  overview: HackathonOverview;
  leaderboard: LeaderboardEntry[];
  pipeline: PipelineBuckets;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registrants" value={overview.registrants} />
        <Stat label="Teams" value={overview.totalTeams} />
        <Stat label="Submissions" value={overview.ideaSubmissions} />
        <Stat label="Average velocity" value={Math.round(overview.avgBuildVelocity)} />
      </div>

      <Card title="Conversion pipeline" icon={Activity}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PipelineMetric label="Incubation invites" value={pipeline.incubationInvites} />
          <PipelineMetric label="Prototype track" value={pipeline.prototypeTrack} />
          <PipelineMetric label="Back to learning" value={pipeline.backToLearning} />
        </div>
      </Card>

      <Card title="Scored teams" icon={CheckCircle2}>
        {leaderboard.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {leaderboard.slice(0, 10).map((team, index) => (
              <div key={team.teamId} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{index + 1}. {team.name || "Untitled team"}</p>
                  <p className="text-xs text-gray-500">{titleLabel(team.crsBand)}</p>
                </div>
                <span className="text-lg font-bold tabular-nums text-[#20C997]">{team.composite}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>No scored teams are available for this report.</EmptyState>
        )}
      </Card>

      <Card title="Partners" icon={Award}>
        {event.partners.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {event.partners.map((partner) => (
              <span key={partner} className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
                {partner}
              </span>
            ))}
          </div>
        ) : (
          <EmptyState>No partner records are attached to this event.</EmptyState>
        )}
        <p className="mt-4 text-xs text-gray-500">
          Sponsor-specific attribution is not recorded, so this report does not assign event-wide outcomes to individual partners.
        </p>
      </Card>

      <UnavailablePanel>
        Cohort trajectory and sector-level impact analytics are unavailable until persisted tracking records are linked to this hackathon.
      </UnavailablePanel>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
        <Icon className="h-5 w-5 text-[#20C997]" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "warn" | "neutral";
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone === "warn" ? "text-amber-700" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 first:pt-0 last:border-0 last:pb-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

function UnavailablePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
      <p>{children}</p>
    </div>
  );
}

function Progress({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between gap-4 text-xs text-gray-600">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{value} / {total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded ${color}`} />
      {label}
    </span>
  );
}

function PipelineMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-l-2 border-[#20C997]/30 pl-4">
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
    </div>
  );
}

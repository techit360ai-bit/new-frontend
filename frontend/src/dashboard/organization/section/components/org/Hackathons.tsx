import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import {
  fetchOrganizerHackathons,
  type OrganizerHackathon,
} from "@/lib/api/hackathon";

type HackathonStatus = OrganizerHackathon["hackathonStatus"];

const statusStyles: Record<HackathonStatus, { bg: string; text: string; dot: string; label: string }> = {
  upcoming: {
    bg: "bg-status-info-soft",
    text: "text-status-info",
    dot: "bg-status-info",
    label: "Upcoming",
  },
  live: {
    bg: "bg-status-success-soft",
    text: "text-status-success",
    dot: "bg-status-success animate-pulse",
    label: "Live",
  },
  judging: {
    bg: "bg-status-warning-soft",
    text: "text-status-warning",
    dot: "bg-status-warning",
    label: "Judging",
  },
  completed: {
    bg: "bg-surface-secondary",
    text: "text-text-secondary",
    dot: "bg-gray-400",
    label: "Completed",
  },
};

function dateLabel(value: string): string {
  if (!value) return "Date not set";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export function Hackathons() {
  const [hackathons, setHackathons] = useState<OrganizerHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHackathons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHackathons(await fetchOrganizerHackathons());
    } catch (loadError) {
      setHackathons([]);
      setError(loadError instanceof Error ? loadError.message : "Hackathons are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHackathons();
  }, [loadHackathons]);

  const totals = useMemo(() => ({
    registrants: hackathons.reduce((sum, hackathon) => sum + hackathon.registrants, 0),
    teams: hackathons.reduce((sum, hackathon) => sum + hackathon.teamsFormed, 0),
    live: hackathons.filter((hackathon) => hackathon.hackathonStatus === "live").length,
  }), [hackathons]);

  return (
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-text-primary">
            <span className="rounded-lg bg-status-info-soft p-2">
              <Trophy className="h-7 w-7 text-brand-accent" />
            </span>
            Hackathons
          </h1>
          <p className="mt-2 text-text-muted">
            Persisted organizer events, registration totals, and team formation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadHackathons()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-primary px-3 py-2 text-sm font-medium text-text-secondary hover:bg-background-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/org/hackathons/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent"
          >
            <Plus className="h-4 w-4" />
            Create hackathon
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-status-error bg-status-error-soft px-4 py-3 text-sm text-status-error">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Live hackathons could not be loaded.</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && hackathons.length === 0 ? (
        <div className="rounded-lg border border-border-default bg-surface-primary px-6 py-12 text-center text-sm text-text-muted">
          Loading persisted hackathons...
        </div>
      ) : error ? null : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard icon={Trophy} label="Events" value={hackathons.length} accent="text-brand-accent bg-status-info-soft" />
            <SummaryCard icon={Users} label="Registrants" value={totals.registrants} accent="text-status-info bg-status-info-soft" />
            <SummaryCard icon={Sparkles} label="Registered teams" value={totals.teams} accent="text-status-success bg-status-success-soft" />
            <SummaryCard icon={Calendar} label="Live now" value={totals.live} accent="text-status-warning bg-status-warning-soft" />
          </div>

          {hackathons.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong bg-surface-primary px-6 py-12 text-center">
              <p className="font-medium text-text-primary">No persisted hackathons yet.</p>
              <p className="mt-1 text-sm text-text-muted">Create an event to publish it to authenticated opportunity surfaces.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hackathons.map((hackathon) => {
                const status = statusStyles[hackathon.hackathonStatus];
                return (
                  <Link
                    key={hackathon.id}
                    to={`/org/hackathons/${hackathon.id}`}
                    className="block rounded-lg border border-border-default bg-surface-primary p-6 shadow-sm transition-all hover:border-brand-accent hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-text-primary">{hackathon.title}</h3>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>
                        <p className="mb-3 text-sm text-text-muted">
                          {hackathon.theme || "No theme has been persisted."}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {dateLabel(hackathon.startDate)} to {dateLabel(hackathon.endDate)}
                            {hackathon.durationHours > 0 ? ` (${hackathon.durationHours}h)` : ""}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {hackathon.registrants} registrants
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            {hackathon.teamsFormed} teams
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            {hackathon.prizePool || "No prize configured"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-3">
                        <div className="hidden max-w-[220px] text-right lg:block">
                          <p className="text-xs text-text-disabled">Partners</p>
                          <p className="truncate text-sm font-medium text-text-secondary">
                            {hackathon.partners.length > 0 ? hackathon.partners.join(", ") : "No partners"}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-text-disabled" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Trophy;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-sm">
      <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-2xl font-bold tabular-nums text-text-primary">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase text-text-muted">{label}</p>
    </div>
  );
}

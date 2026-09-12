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
    bg: "bg-[#20C997]/10 border border-[#20C997]/20",
    text: "text-[#20C997]",
    dot: "bg-[#20C997]",
    label: "Upcoming",
  },
  live: {
    bg: "bg-emerald-500/10 border border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500 animate-pulse",
    label: "Live",
  },
  judging: {
    bg: "bg-amber-500/10 border border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Judging",
  },
  completed: {
    bg: "bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400 dark:bg-slate-500",
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
    <div className="mx-auto max-w-[1600px] p-6 lg:p-8 space-y-6 transition-colors">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            <span className="rounded-xl bg-[#20C997]/10 border border-[#20C997]/20 p-2">
              <Trophy className="h-7 w-7 text-[#20C997]" />
            </span>
            Hackathons
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Persisted organizer events, registration totals, and team formation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadHackathons()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#20C997] hover:border-[#20C997]/30 transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 text-[#20C997] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/org/hackathons/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create hackathon
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-bold">Live hackathons could not be loaded.</p>
            <p className="mt-0.5 text-slate-600 dark:text-slate-400">{error}</p>
          </div>
        </div>
      )}

      {loading && hackathons.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-6 py-16 text-center text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm">
          Loading persisted hackathons...
        </div>
      ) : error ? null : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard icon={Trophy} label="Events" value={hackathons.length} accent="text-[#20C997] bg-[#20C997]/10 border border-[#20C997]/20" />
            <SummaryCard icon={Users} label="Registrants" value={totals.registrants} accent="text-[#20C997] bg-[#20C997]/10 border border-[#20C997]/20" />
            <SummaryCard icon={Sparkles} label="Registered teams" value={totals.teams} accent="text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" />
            <SummaryCard icon={Calendar} label="Live now" value={totals.live} accent="text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20" />
          </div>

          {hackathons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-sm font-bold text-slate-900 dark:text-white">No persisted hackathons yet.</p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Create an event to publish it to authenticated opportunity surfaces.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hackathons.map((hackathon) => {
                const status = statusStyles[hackathon.hackathonStatus];
                return (
                  <Link
                    key={hackathon.id}
                    to={`/org/hackathons/${hackathon.id}`}
                    className="block rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm transition-all hover:border-[#20C997]/40 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{hackathon.title}</h3>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${status.bg} ${status.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>
                        <p className="mb-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                          {hackathon.theme || "No theme has been persisted."}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#20C997]" />
                            {dateLabel(hackathon.startDate)} to {dateLabel(hackathon.endDate)}
                            {hackathon.durationHours > 0 ? ` (${hackathon.durationHours}h)` : ""}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-[#20C997]" />
                            {hackathon.registrants} registrants
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-[#20C997]" />
                            {hackathon.teamsFormed} teams
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-[#20C997]" />
                            {hackathon.prizePool || "No prize configured"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-3">
                        <div className="hidden max-w-[220px] text-right lg:block">
                          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Partners</p>
                          <p className="truncate text-xs font-bold text-slate-700 dark:text-slate-300">
                            {hackathon.partners.length > 0 ? hackathon.partners.join(", ") : "No partners"}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 dark:text-slate-500" />
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
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30">
      <span className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

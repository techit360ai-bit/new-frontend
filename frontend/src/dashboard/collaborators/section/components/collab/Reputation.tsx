import { useEffect, useState } from "react";
import {
  fetchCollaboratorSummary,
  type CollaboratorAchievement,
  type CollaboratorLiveSummary,
} from "@/lib/api/collaboratorSummary";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Award, CheckCircle2, Layers3, Rocket, Wrench, ShieldCheck, Trophy, Sparkles, Star } from "lucide-react";

type Range = "month" | "quarter" | "all";
const RANGES: { value: Range; label: string }[] = [
  { value: "month",   label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "all",     label: "All time" },
];

const ACHIEVEMENT_ICONS = {
  shipper: Rocket,
  impact: Award,
  critical: Wrench,
  "multi-workspace": Layers3,
} as const;

export function Reputation() {
  const [openBadge, setOpenBadge] = useState<CollaboratorAchievement | null>(null);
  const [range, setRange] = useState<Range>("all");
  const [summary, setSummary] = useState<CollaboratorLiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchCollaboratorSummary()
      .then((snapshot) => {
        if (alive) setSummary(snapshot);
      })
      .catch((err) => {
        if (!alive) return;
        setSummary(null);
        setError(err instanceof Error ? err.message : "Live reputation data is unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const metrics = summary?.metrics ?? [];
  const achievements = summary?.achievements ?? [];
  const compositeScore = summary?.compositeScore ?? 0;
  const highest = [...metrics].sort((a, b) => b.value - a.value)[0];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Reputation & Proof</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Cryptographically verified proof of work earned through shipping milestones.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff] border border-[#0066ff]/20 text-xs font-bold self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Live Proof Score</span>
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-4">
          <div className="w-4 h-4 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin" />
          <span>Loading live reputation proof...</span>
        </div>
      )}

      {!loading && error && (
        <div className="border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 rounded-2xl p-5 backdrop-blur-md">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">Live reputation data is unavailable.</p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Score breakdown */}
      <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Reputation Score Breakdown</h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="text-center p-6 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] w-full md:w-56 shrink-0">
            <p className="text-6xl font-black bg-gradient-to-r from-[#0066ff] to-[#58a6ff] bg-clip-text text-transparent tabular-nums">
              {compositeScore}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2">Composite Score</p>
            <span className="inline-block mt-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#20c937]/10 text-[#20c937] border border-[#20c937]/20">
              Verified Contributor
            </span>
          </div>

          <div className="flex-1 w-full space-y-3.5">
            {metrics.map((m) => (
              <div key={m.name} className="p-3 rounded-xl bg-slate-50/40 dark:bg-white/[0.02]">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{m.name}</span>
                  <span className="tabular-nums font-bold text-slate-900 dark:text-white">{m.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      m.name === highest?.name
                        ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff]"
                        : "bg-slate-400 dark:bg-slate-600"
                    }`}
                    style={{ width: `${m.value}%` }}
                  />
                </div>
              </div>
            ))}
            {!loading && !error && metrics.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">No live reputation metrics recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <div className="flex items-center gap-2 mb-3.5">
          <Trophy className="w-4 h-4 text-[#0066ff] dark:text-[#58a6ff]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Live Achievements & Badges</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {achievements.map((b) => (
            <button
              key={b.id}
              onClick={() => setOpenBadge(b)}
              className={`border rounded-2xl p-4 text-center transition-all backdrop-blur-xl ${
                b.earned
                  ? "border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 hover:border-[#0066ff]/40 shadow-sm"
                  : "border-black/[0.04] dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.02] opacity-40 hover:opacity-70"
              }`}
            >
              <div className="text-3xl mb-2">{b.icon}</div>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{b.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Endorsements */}
      <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between bg-slate-50/40 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#0066ff] dark:text-[#58a6ff]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Founder Endorsements (0)</h2>
          </div>
        </div>
        <p className="p-6 text-xs text-slate-500 dark:text-slate-400 italic text-center">
          Endorsements from founders on completed milestones will display here.
        </p>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between bg-slate-50/40 dark:bg-white/[0.02]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Community Leaderboard</h2>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="h-8 border border-black/[0.08] dark:border-white/10 rounded-lg px-2 text-xs bg-white dark:bg-[#181818] text-slate-800 dark:text-slate-200"
          >
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <p className="p-6 text-xs text-slate-500 dark:text-slate-400 italic text-center">
          No live leaderboard entries recorded yet.
        </p>
      </div>

      <Dialog open={openBadge !== null} onOpenChange={(o) => !o && setOpenBadge(null)}>
        <DialogContent className="max-w-sm bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/10 rounded-2xl p-6 shadow-2xl">
          {openBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center font-bold text-slate-900 dark:text-white">{openBadge.title}</DialogTitle>
              </DialogHeader>
              <div className="text-center py-4">
                {(() => {
                  const AchievementIcon = ACHIEVEMENT_ICONS[openBadge.id as keyof typeof ACHIEVEMENT_ICONS] ?? Award;
                  return (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-white flex items-center justify-center mx-auto mb-4 shadow-[0_4px_15px_rgba(0,102,255,0.3)]">
                      <AchievementIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  );
                })()}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{openBadge.description}</p>
                <div className={`mt-5 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
                  openBadge.earned
                    ? "bg-[#20c937]/10 text-[#20c937] border border-[#20c937]/20"
                    : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                }`}>
                  {openBadge.earned ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Verified & Earned</span>
                    </>
                  ) : (
                    <span>Not Yet Earned</span>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

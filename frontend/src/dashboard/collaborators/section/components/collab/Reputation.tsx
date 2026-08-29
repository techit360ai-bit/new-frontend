import { useEffect, useState } from "react";
import {
  fetchCollaboratorSummary,
  type CollaboratorAchievement,
  type CollaboratorLiveSummary,
} from "@/lib/api/collaboratorSummary";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Award, CheckCircle2, Layers3, Rocket, Wrench } from "lucide-react";

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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reputation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Earned through shipping, not claimed.</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">Live score</span>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading live reputation data...</p>}
      {!loading && error && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700">Live reputation data is unavailable.</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Score breakdown */}
      <div className="border border-slate-200 bg-white rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Reputation score breakdown</h2>
        <div className="flex items-start gap-8">
          <div className="text-center">
            <p className="text-5xl font-bold text-slate-900 tabular-nums">{compositeScore}</p>
            <p className="text-xs text-slate-500 mt-1">Composite</p>
          </div>
          <div className="flex-1 space-y-3">
            {metrics.map((m) => (
              <div key={m.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">{m.name}</span>
                  <span className="tabular-nums text-slate-900 font-semibold">{m.value}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${m.name === highest?.name ? "bg-amber-500" : "bg-slate-300"}`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
            {!loading && !error && metrics.length === 0 && (
              <p className="text-sm text-slate-500">No live reputation metrics yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Endorsements */}
      <div className="border border-slate-200 bg-white rounded-xl">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Endorsements (0)</h2>
        </div>
        <p className="p-5 text-sm text-slate-500">No live endorsements are recorded yet.</p>
      </div>

      {/* Badges */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Live achievements</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {achievements.map((b) => (
            <button key={b.id} onClick={() => setOpenBadge(b)}
              className={`border rounded-xl p-4 text-center transition-all ${
                b.earned
                  ? "border-slate-200 bg-white hover:border-amber-300"
                  : "border-slate-200 bg-slate-50 opacity-60"}`}>
              <div className="text-3xl mb-2">{b.icon}</div>
              <p className="text-xs font-semibold text-slate-900">{b.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="border border-slate-200 bg-white rounded-xl">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Leaderboard</h2>
          <select value={range} onChange={(e) => setRange(e.target.value as Range)}
            className="h-8 border border-slate-300 rounded-lg px-2 text-xs bg-white">
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <p className="p-5 text-sm text-slate-500">No live leaderboard entries are recorded yet.</p>
      </div>

      <Dialog open={openBadge !== null} onOpenChange={(o) => !o && setOpenBadge(null)}>
        <DialogContent className="max-w-sm">
          {openBadge && (
            <>
              <DialogHeader>
                <DialogTitle>{openBadge.title}</DialogTitle>
              </DialogHeader>
              <div className="text-center py-4">
                {(() => { const AchievementIcon = ACHIEVEMENT_ICONS[openBadge.id as keyof typeof ACHIEVEMENT_ICONS] ?? Award; return <AchievementIcon className="mx-auto mb-3 h-10 w-10 text-amber-500" aria-hidden="true" />; })()}
                <p className="text-sm text-slate-600">{openBadge.description}</p>
                <p className={`mt-4 text-xs font-semibold ${openBadge.earned ? "text-emerald-700" : "text-slate-500"}`}>
                  {openBadge.earned ? <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />Earned</span> : "Not yet earned"}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

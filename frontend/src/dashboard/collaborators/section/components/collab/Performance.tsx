// frontend/src/dashboard/collaborators/section/components/collab/Performance.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, Activity, ArrowUpRight, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  fetchCollaboratorSummary,
  type CollaboratorLiveSummary,
} from "@/lib/api/collaboratorSummary";

type Range = "30" | "90" | "365";

export function Performance() {
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>("90");
  const [summary, setSummary] = useState<CollaboratorLiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchCollaboratorSummary()
      .then((snapshot) => {
        if (!alive) return;
        setSummary(snapshot);
      })
      .catch((err) => {
        if (!alive) return;
        setSummary(null);
        setError(err instanceof Error ? err.message : "Live performance data is unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const metrics = summary?.metrics ?? [];
  const weeklyVelocity = summary?.weeklyVelocity ?? [];
  const perProject = summary?.perProject ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Performance Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Tracking delivery cadence and output quality across startup builds.</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as Range)}
          className="h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs font-semibold bg-white/80 dark:bg-[#111111] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997] shadow-sm"
        >
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last 365 days</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-4">
          <div className="w-4 h-4 border-2 border-[#20C997] border-t-transparent rounded-full animate-spin" />
          <span>Loading live performance metrics...</span>
        </div>
      )}

      {!loading && error && (
        <div className="border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 rounded-2xl p-5 backdrop-blur-md">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">Live performance data is unavailable.</p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Five core metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {metrics.map((m) => {
          const Arrow = m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
          const arrowColor = m.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : m.trend === "down" ? "text-red-600 dark:text-red-400" : "text-slate-400";
          return (
            <div
              key={m.name}
              className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-4 shadow-sm"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">{m.name}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{m.value}</p>
                <span className={`text-[11px] font-bold flex items-center gap-0.5 ${arrowColor}`}>
                  <Arrow className="w-3 h-3" />
                  {m.change > 0 ? `+${m.change}` : m.change}
                </span>
              </div>
            </div>
          );
        })}
        {!loading && !error && metrics.length === 0 && (
          <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400 col-span-full">
            No live task activity is available yet.
          </div>
        )}
      </div>

      {/* Velocity chart */}
      <div className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-[#20C997]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Velocity Over Time</h2>
        </div>
        <div className="h-64">
          {weeklyVelocity.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              No dated live tasks recorded in this timeframe.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyVelocity}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#888888" }} stroke="#88888820" />
                <YAxis tick={{ fontSize: 11, fill: "#888888" }} stroke="#88888820" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(18, 18, 18, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#20C997"
                  strokeWidth={2.5}
                  dot={{ fill: "#20C997", r: 4 }}
                  activeDot={{ r: 6, fill: "#1db587" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-project contribution */}
      <div className="bg-white dark:bg-[#111111] backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-black/[0.06] dark:border-white/10 flex items-center gap-2 bg-slate-50/40 dark:bg-white/[0.02]">
          <Activity className="w-4 h-4 text-[#20C997]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Per-Project Contribution</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-black/[0.06] dark:border-white/10">
                <th className="text-left px-6 py-3 font-bold">Project</th>
                <th className="text-right px-6 py-3 font-bold">Tasks Shipped</th>
                <th className="text-right px-6 py-3 font-bold">Impact Avg</th>
                <th className="text-right px-6 py-3 font-bold">Last Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {perProject.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/workspaces/build?startup=${p.id}`)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{p.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </td>
                  <td className="px-6 py-3.5 text-right tabular-nums font-bold text-slate-900 dark:text-white">{p.shipped}</td>
                  <td className="px-6 py-3.5 text-right tabular-nums text-[#20C997] font-bold">{p.impactAvg}</td>
                  <td className="px-6 py-3.5 text-right text-slate-500 dark:text-slate-400">{p.lastContribution}</td>
                </tr>
              ))}
              {!loading && !error && perProject.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-center text-xs text-slate-500 dark:text-slate-400 italic" colSpan={4}>
                    No live workspace contributions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

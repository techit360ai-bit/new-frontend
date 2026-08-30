// frontend/src/dashboard/collaborators/section/components/collab/Performance.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Performance</h1>
          <p className="text-sm text-text-muted mt-0.5">How you're tracking across builds.</p>
        </div>
        <select value={range} onChange={(e) => setRange(e.target.value as Range)}
          className="h-9 border border-border-strong rounded-lg px-3 text-sm bg-surface-primary">
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last 365 days</option>
        </select>
      </div>

      {loading && <p className="text-sm text-text-muted">Loading live performance data...</p>}
      {!loading && error && (
        <div className="border border-status-error bg-status-error-soft rounded-xl p-4">
          <p className="text-sm font-semibold text-status-error">Live performance data is unavailable.</p>
          <p className="text-sm text-status-error mt-1">{error}</p>
        </div>
      )}

      {/* Five core metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metrics.map((m) => {
          const Arrow = m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
          const arrowColor = m.trend === "up" ? "text-status-success" : m.trend === "down" ? "text-status-error" : "text-text-disabled";
          return (
            <div key={m.name} className="border border-border-default bg-surface-primary rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">{m.name}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold text-text-primary tabular-nums">{m.value}</p>
                <span className={`text-xs flex items-center gap-0.5 ${arrowColor}`}>
                  <Arrow className="w-3 h-3" />
                  {m.change > 0 ? `+${m.change}` : m.change}
                </span>
              </div>
            </div>
          );
        })}
        {!loading && !error && metrics.length === 0 && (
          <p className="text-sm text-text-muted col-span-full">No live task activity is available yet.</p>
        )}
      </div>

      {/* Velocity chart */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Velocity over time</h2>
        <div className="h-64">
          {weeklyVelocity.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-text-muted">No dated live tasks yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyVelocity}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip />
                <Line type="monotone" dataKey="tasks" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Per-project contribution */}
      <div className="border border-border-default bg-surface-primary rounded-xl">
        <div className="px-5 py-3 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-text-secondary">Per-project contribution</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-text-muted border-b border-border-subtle">
              <th className="text-left px-5 py-3 font-semibold">Project</th>
              <th className="text-right px-5 py-3 font-semibold">Tasks shipped</th>
              <th className="text-right px-5 py-3 font-semibold">Impact avg</th>
              <th className="text-right px-5 py-3 font-semibold">Last contribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {perProject.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/workspaces/build?startup=${p.id}`)}
                className="cursor-pointer hover:bg-background-primary">
                <td className="px-5 py-3">{p.name}</td>
                <td className="px-5 py-3 text-right tabular-nums">{p.shipped}</td>
                <td className="px-5 py-3 text-right tabular-nums">{p.impactAvg}</td>
                <td className="px-5 py-3 text-right text-text-muted">{p.lastContribution}</td>
              </tr>
            ))}
            {!loading && !error && perProject.length === 0 && (
              <tr><td className="px-5 py-4 text-sm text-text-muted" colSpan={4}>No live workspace contributions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

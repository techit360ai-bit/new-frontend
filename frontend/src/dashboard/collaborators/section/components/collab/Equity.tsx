// frontend/src/dashboard/collaborators/section/components/collab/Equity.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TrendingUp, X, PieChart, ShieldCheck, FileText, ArrowUpRight, Award, Lock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { EMPTY_EQUITY, fetchCollaboratorEquity, type EquityHolding } from "@/lib/api/equity";

export function Equity() {
  const [capHolding, setCapHolding] = useState<EquityHolding | null>(null);

  const [holdings, setHoldings] = useState(EMPTY_EQUITY.holdings);
  const [totals, setTotals] = useState(EMPTY_EQUITY.totals);
  const [timeline, setTimeline] = useState(EMPTY_EQUITY.vestingTimeline);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCollaboratorEquity()
      .then((data) => {
        if (!alive) return;
        setHoldings(data.holdings);
        setTotals(data.totals);
        setTimeline(data.vestingTimeline);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setHoldings(EMPTY_EQUITY.holdings);
        setTotals(EMPTY_EQUITY.totals);
        setTimeline(EMPTY_EQUITY.vestingTimeline);
        setError(err instanceof Error ? err.message : "Live equity records are unavailable.");
      });
    return () => { alive = false; };
  }, []);

  const chartData = (() => {
    const months = timeline[0]?.points.map((p) => p.monthIso) ?? [];
    return months.map((m, i) => {
      const row: Record<string, number | string> = { month: m };
      timeline.forEach((s) => { row[s.projectName] = s.points[i]?.vestedPercent ?? 0; });
      return row;
    });
  })();
  const seriesColors = ["#20C997", "#128a64", "#38bdf8", "#f59e0b"];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Equity & Grants</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Ownership grants and vesting schedules across {holdings.length} startups.</p>
        </div>
        <a
          href="#equity-philosophy"
          className="text-xs font-semibold text-[#20C997] hover:underline flex items-center gap-1"
        >
          <span>Equity Philosophy</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {error && (
        <div className="border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-2xl px-5 py-3.5 text-sm backdrop-blur-md">
          Live equity records could not be loaded: {error}
        </div>
      )}

      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Value" value={`$${(totals.totalValueUSD / 1000).toFixed(1)}K`} />
        <Stat label="Blended Equity" value={`${totals.blendedEquityPercent}%`} />
        <Stat label="Vested This Quarter" value={`$${(totals.vestedThisQuarterUSD / 1000).toFixed(1)}K`} />
        <Stat
          label="Next Vest"
          value={totals.nextVest?.date ?? "—"}
          sub={totals.nextVest ? `+${totals.nextVest.deltaPercent}% ${totals.nextVest.startup}` : undefined}
        />
      </div>

      {/* Vesting timeline */}
      <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 lg:p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#20C997]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Vesting Timeline (%)</h2>
        </div>

        {timeline.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 italic">No vesting schedule has been recorded yet.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#888888" }} stroke="#88888820" tickFormatter={(m) => String(m).slice(2)} />
                <YAxis tick={{ fontSize: 11, fill: "#888888" }} stroke="#88888820" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(18, 18, 18, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                {timeline.map((s, i) => (
                  <Line
                    key={s.projectId}
                    type="monotone"
                    dataKey={s.projectName}
                    stroke={seriesColors[i % seriesColors.length]}
                    strokeWidth={2.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Per-startup cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {holdings.length > 0 ? holdings.map((h) => (
          <div
            key={h.projectId}
            id={`startup-${h.projectId}`}
            className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-[#20C997]/30 transition-all"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-2xl">{h.projectLogo || "🚀"}</span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{h.projectName}</h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Granted {h.grantDate ?? "—"}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-3 mb-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.04]">
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{h.equityPercent}%</p>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Grant</p>
                </div>
                <div className="border-l border-slate-200 dark:border-white/10 pl-3">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">${(h.valueUSD / 1000).toFixed(1)}K</p>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Est. Valuation</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Vested Percentage</span>
                  <span className="font-bold text-[#20C997]">{h.vestedPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#20C997] rounded-full" style={{ width: `${h.vestedPercent}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  Schedule: {h.vestingSchedule?.years ?? 0}y with {h.vestingSchedule?.cliffMonths ?? 0}m cliff
                </p>
              </div>

              {h.nextVest && (
                <div className="p-2.5 rounded-xl bg-[#20C997]/10 border border-[#20C997]/20 text-xs text-[#20C997] mb-4 flex items-center gap-1.5 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>Next vest {h.nextVest.date} · +{h.nextVest.deltaPercent}%</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-black/[0.06] dark:border-white/10">
              <button
                onClick={() => setCapHolding(h)}
                className="flex-1 text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cap Table
              </button>
              <button
                onClick={() => toast("No grant document is attached to this record yet.")}
                className="flex-1 text-xs font-semibold px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1"
              >
                <span>Grant Doc</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )) : (
          <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-8 text-center text-xs text-slate-500 dark:text-slate-400 lg:col-span-3 bg-white/40 dark:bg-[#121212]/40">
            No equity grants are recorded yet.
          </div>
        )}
      </div>

      {/* Philosophy explainer */}
      <details id="equity-philosophy" className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm group">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>How Equity Works on TechIT</span>
          <span className="text-[#20C997] group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <ul className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
          <li>Every grant follows your chosen vesting schedule. We track it on your behalf and surface upcoming events here.</li>
          <li>Dilution protection: equity already vested cannot be diluted without your consent. Future grants are protected up to a threshold defined at signing.</li>
          <li>TechIT acts as the cap-table custodian. You get a copy of every grant document; we keep the canonical ledger so founders and collaborators have a single source of truth.</li>
        </ul>
      </details>

      {/* Cap table dialog */}
      {capHolding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setCapHolding(null)}>
          <div className="bg-white dark:bg-[#141414] border border-black/[0.08] dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{capHolding.projectName} · Cap Table</h3>
              <button onClick={() => setCapHolding(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 text-xs">
              {(capHolding.capTable ?? []).map((row) => (
                <li
                  key={row.label}
                  className={`flex justify-between p-2.5 rounded-xl border ${
                    row.highlighted
                      ? "bg-[#20C997]/10 border-[#20C997]/30 text-[#20C997] font-bold"
                      : "border-black/[0.04] dark:border-white/[0.06] text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{row.label}</span>
                  <span className="tabular-nums font-bold">{row.percent}%</span>
                </li>
              ))}
              {(capHolding.capTable ?? []).length === 0 && (
                <li className="text-xs text-slate-500 dark:text-slate-400 italic py-2">No cap table rows are attached to this grant yet.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">{label}</p>
      <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tabular-nums mt-1">{value}</p>
      {sub && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{sub}</p>}
    </div>
  );
}

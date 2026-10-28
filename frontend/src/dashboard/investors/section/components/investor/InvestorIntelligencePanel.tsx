import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, Brain, CheckCircle2, Clock3, ShieldAlert, type LucideIcon } from "lucide-react";
import { fetchInvestorAlerts, fetchInvestorIntelligenceAdvisory, fetchInvestorIntelligenceOverview, type InvestorAdvisoryResponse, type InvestorAlert, type InvestorIntelligenceOverview } from "@/lib/api/investorIntelligence";
import { Link } from "react-router-dom";

export function InvestorIntelligencePanel() {
  const [data, setData] = useState<InvestorIntelligenceOverview | null>(null);
  const [alerts, setAlerts] = useState<InvestorAlert[]>([]);
  const [advisory, setAdvisory] = useState<InvestorAdvisoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => Promise.all([fetchInvestorIntelligenceOverview(), fetchInvestorAlerts()]).then(([overview, alertData]) => { if (!alive) return; setData(overview); setAlerts(alertData.alerts); setLastUpdated(new Date().toISOString()); }).catch(() => alive && setData(null)).finally(() => alive && setLoading(false));
    void load();
    const timer = window.setInterval(load, 30_000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  const ask = () => { setAdvisoryLoading(true); fetchInvestorIntelligenceAdvisory().then(setAdvisory).catch(() => setAdvisory(null)).finally(() => setAdvisoryLoading(false)); };

  if (loading) return <div className="mb-6 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 text-xs text-slate-500 dark:text-slate-400 shadow-sm">Loading authorized mentorship intelligence...</div>;
  if (!data) return <div className="mb-6 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 text-xs text-slate-500 dark:text-slate-400 shadow-sm">Investor intelligence is unavailable for this account.</div>;

  const attention = data.startups.filter((startup) => startup.riskLevel === "high" || startup.riskLevel === "moderate").slice(0, 4);
  const summaryCards: Array<[string, number, LucideIcon]> = [["Authorized Startups", data.portfolio.total, ShieldAlert], ["Healthy", data.portfolio.healthy, CheckCircle2], ["On Track", data.portfolio.onTrack, ArrowUpRight], ["Needs Attention", data.portfolio.highRisk, AlertTriangle]];

  return (
    <section className="mb-6 space-y-4" aria-label="Investor intelligence">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mentorship Intelligence</h2>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Authorized startup-development signals from Mentorship Hub telemetry.</p>
          <p className="mt-1 text-[10px] text-slate-400 font-mono">{lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : "Connecting..."}</p>
        </div>
        <button
          onClick={ask}
          disabled={advisoryLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#20C997]/20 bg-[#20C997]/10 px-3.5 py-2 text-xs font-semibold text-[#20C997] hover:bg-[#20C997]/20 transition-all disabled:opacity-60"
        >
          <Brain className="h-4 w-4" />
          {advisoryLoading ? "Reviewing..." : "Explain Portfolio Changes"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {summaryCards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
              <Icon className="h-4 w-4 text-[#20C997]" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900 dark:text-white text-sm">What Changed</h3>
          {data.changes.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No meaningful changes since the last intelligence snapshot.</p>
          ) : (
            <div className="space-y-3">
              {data.changes.slice(0, 5).map((change, index) => (
                <div key={`${change.startupId}-${index}`} className="flex gap-3 border-b border-black/[0.04] dark:border-white/5 pb-3 last:border-0">
                  <Clock3 className="mt-0.5 h-4 w-4 text-[#20C997] shrink-0" />
                  <div>
                    <Link to={`/investor/intelligence/startups/${change.startupId}`} className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#20C997] transition-colors">
                      {change.name}
                    </Link>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{change.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900 dark:text-white text-sm">Attention Required</h3>
          {attention.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No current risk signals in your authorized scope.</p>
          ) : (
            <div className="space-y-3">
              {attention.map((startup) => (
                <div key={startup.startupId} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5">
                  <div className="flex items-center justify-between">
                    <Link to={`/investor/intelligence/startups/${startup.startupId}`} className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-[#20C997] transition-colors">
                      {startup.name}
                    </Link>
                    <span className={startup.riskLevel === "high" ? "text-red-600 dark:text-red-400 font-bold text-xs capitalize" : "text-amber-600 dark:text-amber-400 font-bold text-xs capitalize"}>
                      {startup.riskLevel}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    {startup.milestones.overdue} overdue milestone(s) · {startup.mentorship.completedTasks}/{startup.mentorship.tasks} mentorship tasks complete
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {advisory && (
        <div className="rounded-2xl border border-[#20C997]/20 bg-[#20C997]/10 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#20C997]">
            <Brain className="h-4 w-4" /> AI Advisory Insights
          </div>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {typeof advisory.advisory === "string" ? advisory.advisory : "The AI Router returned an advisory analysis for the authorized evidence."}
          </p>
          <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">Canonical metrics and access decisions remain backend-controlled.</p>
        </div>
      )}
    </section>
  );
}

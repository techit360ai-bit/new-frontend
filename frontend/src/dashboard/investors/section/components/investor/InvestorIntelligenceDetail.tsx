import { useEffect, useState } from "react";
import { AlertTriangle, FileText, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchInvestorAlerts, fetchInvestorReports, fetchInvestorStartupIntelligence, type InvestorAlert, type InvestorIntelligenceStartup, type InvestorReport } from "@/lib/api/investorIntelligence";

function State({ children }: { children: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-6 py-10 text-sm text-slate-500 dark:text-slate-400 shadow-sm text-center">
      {children}
    </div>
  );
}

export function InvestorIntelligenceDetail() {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const [startup, setStartup] = useState<InvestorIntelligenceStartup | null>(null);
  const [alerts, setAlerts] = useState<InvestorAlert[]>([]);
  const [reports, setReports] = useState<InvestorReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startupId) return;
    Promise.all([fetchInvestorStartupIntelligence(startupId), fetchInvestorAlerts(), fetchInvestorReports()])
      .then(([detail, alertData, reportData]) => {
        setStartup(detail.startup);
        setAlerts(alertData.alerts);
        setReports(reportData.reports);
      })
      .catch(() => setStartup(null))
      .finally(() => setLoading(false));
  }, [startupId]);

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] p-4 sm:p-8"><State>Loading authorized startup intelligence...</State></div>;
  if (!startup) return <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] p-4 sm:p-8"><State>Startup intelligence is unavailable or outside your authorized scope.</State></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#20C997] transition-colors"
            >
              ← Back to Overview
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{startup.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Investor Telemetry
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs sm:text-sm">
              Investor-safe intelligence profile · {startup.sector || "Sector unavailable"}
            </p>
          </div>
          <div className="p-2.5 bg-[#20C997]/10 rounded-xl self-start sm:self-auto">
            <RefreshCw className="h-5 w-5 text-[#20C997]" />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Metric label="Health Score" value={startup.health} />
          <Metric label="Execution Velocity" value={startup.executionVelocity} />
          <Metric label="Milestone Progress" value={startup.milestoneProgress} />
          <Metric label="Market Readiness" value={startup.readiness} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
              <ShieldCheck className="h-4 w-4 text-[#20C997]" /> Mentorship to Execution Telemetry
            </h2>
            <div className="mt-4 space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p>{startup.mentorship.rooms} mentorship room(s) · {startup.mentorship.activeMentees} active mentee(s)</p>
              <p>{startup.mentorship.completedTasks}/{startup.mentorship.tasks} mentorship tasks completed</p>
              <p className="font-mono text-xs text-slate-500">Last meaningful progress: {startup.lastMeaningfulAt || "Unavailable"}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Risk &amp; Evidence Signals
            </h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Risk Level: <span className="font-bold text-slate-900 dark:text-white capitalize">{startup.riskLevel}</span>
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {startup.evidence.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#20C997] font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Active Alerts
            </h2>
            {alerts.filter((alert) => alert.startupId === startup.startupId).length === 0 ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No alerts for this startup.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {alerts.filter((alert) => alert.startupId === startup.startupId).map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{alert.title}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{alert.recommendedAction}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
              <FileText className="h-4 w-4 text-[#20C997]" /> Latest Intelligence Report
            </h2>
            {reports.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No report is available.</p>
            ) : (
              <p className="mt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {reports[0].type.replaceAll("_", " ")} generated {new Date(reports[0].generatedAt).toLocaleString()}.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">{label}</p>
      <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-[#20C997]">
        {value === null ? "—" : value}
      </p>
    </div>
  );
}

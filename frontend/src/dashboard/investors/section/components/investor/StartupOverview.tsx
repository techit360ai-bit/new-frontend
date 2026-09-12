import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Radar,
  ShieldCheck,
  FileText,
  Handshake,
  TrendingUp,
  Users,
  Eye,
  BarChart3,
  Target,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { fetchDealFlow, toGsisV2Input, type InvestorStartup } from "@/lib/api/dealFlow";
import { computeGsisV2, type GsisV2Scorecard } from "@/lib/api/gsis";

export function StartupOverview() {
  const { startupId } = useParams();
  const [startup, setStartup] = useState<InvestorStartup | null>(null);
  const [scorecard, setScorecard] = useState<GsisV2Scorecard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!startupId) {
      setLoading(false);
      return;
    }
    let alive = true;
    fetchDealFlow()
      .then((data) => {
        const selected = data.ranking.find((s) => s.id === startupId) ?? null;
        if (!alive) return;
        setStartup(selected);
        if (selected) {
          computeGsisV2(toGsisV2Input(selected)).then((result) => {
            if (alive) setScorecard(result);
          });
        }
      })
      .catch(() => { if (alive) setStartup(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [startupId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading startup profile...</div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-center px-4">
        <Building2 className="w-12 h-12 text-slate-400 mb-4" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Startup not found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This startup may not be in the current deal flow.</p>
        <Link to="/investor/deal-intelligence" className="mt-4 text-xs font-bold text-[#20C997] hover:underline">
          ← Back to Deal Flow
        </Link>
      </div>
    );
  }

  const riskColor =
    startup.riskLevel === "low"
      ? "text-[#20C997] bg-[#20C997]/15 border-[#20C997]/20"
      : startup.riskLevel === "moderate"
        ? "text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/20"
        : startup.riskLevel === "high"
          ? "text-red-600 dark:text-red-400 bg-red-500/15 border-red-500/20"
          : "text-slate-500 bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Back nav */}
      <div className="bg-white dark:bg-[#111111] border-b border-black/[0.06] dark:border-white/10 px-4 py-4 sm:px-8">
        <Link
          to="/investor/deal-intelligence"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#20C997] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deal Flow
        </Link>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero / Intro */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 sm:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#20C997] to-teal-600 flex items-center justify-center text-slate-950 text-xl font-extrabold shadow-sm">
                {startup.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{startup.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#20C997]" /> {startup.sector}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {startup.region}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskColor}`}>
                {startup.riskLevel} risk
              </span>
              {startup.investorsWatching > 0 && (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-[#20C997]/30 bg-[#20C997]/10 text-[#20C997]">
                  <span className="flex -space-x-1.5">
                    {Array.from({ length: Math.min(startup.investorsWatching, 4) }).map((_, i) => (
                      <span
                        key={i}
                        className="inline-block w-4 h-4 rounded-full border border-slate-900 bg-[#20C997]"
                      />
                    ))}
                  </span>
                  {startup.investorsWatching > 4 && `+${startup.investorsWatching - 4}`} {startup.investorsWatching} watching
                </span>
              )}
            </div>
          </div>

          {/* About */}
          {startup.about?.summary && (
            <div className="mt-6 border-t border-black/[0.04] dark:border-white/5 pt-6 space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">About</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{startup.about.summary}</p>
              {startup.about.useCase && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Use Case:</span> {startup.about.useCase}
                </p>
              )}
              {startup.about.marketSize && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">Market Opportunity:</span> {startup.about.marketSize}
                </p>
              )}
            </div>
          )}

          {/* Hackathon History */}
          {startup.passport && startup.passport.hackathonsEntered > 0 && (
            <div className="mt-6 border-t border-black/[0.04] dark:border-white/5 pt-6">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Build & Track Record</h3>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                <span>{startup.passport.hackathonsEntered} hackathons entered</span>
                <span>{startup.passport.demosShipped} demos shipped</span>
                {startup.passport.bestPlacement && (
                  <span className="text-[#20C997] font-bold">Best placement: #{startup.passport.bestPlacement}</span>
                )}
                {startup.passport.avgBriefScore && (
                  <span>Avg brief score: {startup.passport.avgBriefScore}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard label="Readiness Score" value={startup.readinessScore} icon={Target} />
          <MetricCard label="Execution Velocity" value={startup.executionVelocity} icon={TrendingUp} />
          <MetricCard
            label="MRR"
            value={startup.mrr > 0 ? `$${startup.mrr.toLocaleString()}` : "Pre-revenue"}
            icon={BarChart3}
            isText
          />
          <MetricCard label="Founder Reliability" value={startup.founderReliability} icon={Users} />
        </div>

        {scorecard && (
          <section className="bg-white dark:bg-[#111111] rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/[0.04] dark:border-white/5 pb-5">
              <div>
                <p className="text-xs font-bold text-[#20C997] uppercase tracking-wider">GSIS v2 INVESTMENT INTELLIGENCE</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Evidence-Backed Stage Analysis</h2>
                <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-600 dark:text-slate-400">{scorecard.stage.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold font-mono text-[#20C997]">{scorecard.gsis == null ? "—" : Math.round(scorecard.gsis)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">GSIS / 100</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-5 sm:grid-cols-3 lg:grid-cols-6">
              <IntelligenceValue label="Detected stage" value={scorecard.stage.detected_stage} />
              <IntelligenceValue label="Stage health" value={scorecard.stage_health == null ? "—" : String(Math.round(scorecard.stage_health))} />
              <IntelligenceValue label="Momentum" value={(scorecard.momentum.score > 0 ? "+" : "") + scorecard.momentum.score} />
              <IntelligenceValue label="PMF" value={scorecard.pmf.score == null ? "N/A" : String(Math.round(scorecard.pmf.score))} />
              <IntelligenceValue label="Risk" value={scorecard.risk.level} />
              <IntelligenceValue label={scorecard.readiness.next_stage + " readiness"} value={scorecard.readiness.score == null ? "—" : String(Math.round(scorecard.readiness.score))} />
            </div>

            <div className="grid gap-6 border-t border-black/[0.04] dark:border-white/5 pt-5 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Score Decomposition</h3>
                  <span className="text-xs text-slate-500 font-mono">{Math.round(scorecard.confidence * 100)}% confidence</span>
                </div>
                <div className="mt-3 space-y-3">
                  {Object.values(scorecard.components ?? {}).sort((a, b) => b.score - a.score).slice(0, 8).map((component) => (
                    <div key={component.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize text-slate-600 dark:text-slate-400">{component.key.replaceAll("_", " ")}</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{Math.round(component.score)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded bg-slate-200 dark:bg-white/10">
                        <div className="h-full bg-[#20C997]" style={{ width: component.score + "%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Stage Transition</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {scorecard.readiness.status.replaceAll("_", " ")} · {scorecard.readiness.satisfied_gates.length} gates satisfied
                </p>
                <div className="mt-3 space-y-2">
                  {scorecard.readiness.satisfied_gates.map((gate) => (
                    <GateRow key={gate.metric} label={gate.metric} met />
                  ))}
                  {scorecard.readiness.blocking_requirements.map((gate) => (
                    <GateRow key={gate.metric} label={gate.metric} met={false} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Verification Badges */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Verification Status</h3>
          <div className="flex flex-wrap gap-2.5">
            {startup.complianceVerified && (
              <Badge label="Compliance Verified" color="green" />
            )}
            {startup.aiGovernanceVerified && (
              <Badge label="AI Governance Verified" color="green" />
            )}
            {startup.founderReliability >= 70 && (
              <Badge label="Reliable Founder" color="blue" />
            )}
            {startup.executionVelocity >= 70 && (
              <Badge label="Active Development" color="purple" />
            )}
            {startup.mrr > 0 && (
              <Badge label="Revenue Validated" color="amber" />
            )}
            {!startup.complianceVerified && !startup.aiGovernanceVerified && startup.founderReliability < 70 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">No verifications yet</span>
            )}
          </div>
        </div>

        {/* Milestones */}
        {startup.milestones.length > 0 && (
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Recent Milestones</h3>
            <div className="space-y-3">
              {startup.milestones.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{m.title}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">{m.date}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      m.status === "completed"
                        ? "bg-[#20C997]/15 text-[#20C997]"
                        : m.status === "in-progress"
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explore — Action Grid */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Explore Diligence Modules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ExploreCard
              to={`/investor/risk-radar/${startupId}`}
              icon={Radar}
              title="Risk Radar"
              desc="Risk heatmap, execution timeline, and AI-generated risk commentary."
              color="red"
            />
            <ExploreCard
              to={`/investor/trust/${startupId}`}
              icon={ShieldCheck}
              title="Trust & Verification"
              desc="Founder verification, product proof, evidence timeline, and trust score."
              color="green"
            />
            <ExploreCard
              to={`/investor/data-room/${startupId}`}
              icon={FileText}
              title="Data Room"
              desc="Metrics, financials, compliance documents, and diligence materials."
              color="blue"
            />
            <ExploreCard
              to={`/investor/deal-room/${startupId}`}
              icon={Handshake}
              title="Deal Room"
              desc="Term sheet, cap table, negotiation log, and deal documents."
              color="purple"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          <Link
            to={`/investor/risk-radar/${startupId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#20C997] hover:bg-[#1cb084] text-slate-950 text-xs font-bold transition-all shadow-sm"
          >
            <Eye className="w-4 h-4" /> Full Analysis
          </Link>
          <Link
            to={`/investor/trust/${startupId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-[#20C997]" /> Verify Founder
          </Link>
          <Link
            to={`/investor/data-room/${startupId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            <Briefcase className="w-4 h-4 text-[#20C997]" /> Open Data Room
          </Link>
          <Link
            to={`/investor/deals?projectId=${encodeURIComponent(startupId || "")}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold transition-all"
          >
            <Handshake className="w-4 h-4" /> Open Deal Room
          </Link>
        </div>
      </div>
    </div>
  );
}

function IntelligenceValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-base font-bold font-mono text-slate-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function GateRow({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/5 pb-2 text-xs">
      <span className="capitalize text-slate-600 dark:text-slate-400">{label.replaceAll("_", " ").toLowerCase()}</span>
      <span className={met ? "text-[#20C997] font-semibold" : "text-amber-600 dark:text-amber-400 font-medium"}>{met ? "Satisfied" : "Missing"}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  isText,
}: {
  label: string;
  value: number | string;
  icon: typeof Target;
  isText?: boolean;
}) {
  const numVal = typeof value === "number" ? value : 0;
  const color = isText
    ? "text-slate-900 dark:text-white"
    : numVal >= 70
      ? "text-[#20C997]"
      : numVal >= 40
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="bg-white dark:bg-[#111111] rounded-2xl border border-black/[0.06] dark:border-white/10 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4 text-[#20C997]" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold font-mono ${color}`}>
        {typeof value === "number" ? Math.round(value) : value}
      </p>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-[#20C997]/15 text-[#20C997] border-[#20C997]/20",
    blue: "bg-[#20C997]/15 text-[#20C997] border-[#20C997]/20",
    purple: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[color] || colors.blue}`}>
      {label}
    </span>
  );
}

function ExploreCard({
  to,
  icon: Icon,
  title,
  desc,
  color,
}: {
  to: string;
  icon: typeof Radar;
  title: string;
  desc: string;
  color: string;
}) {
  const iconColors: Record<string, string> = {
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    green: "bg-[#20C997]/15 text-[#20C997]",
    blue: "bg-[#20C997]/15 text-[#20C997]",
    purple: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  };
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 hover:border-[#20C997]/40 transition-all shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-[#20C997] transition-colors text-sm">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

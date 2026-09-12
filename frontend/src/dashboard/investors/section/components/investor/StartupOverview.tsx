import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Globe,
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading startup profile...</div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Building2 className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Startup not found</h2>
        <p className="text-sm text-gray-500 mt-1">This startup may not be in the current deal flow.</p>
        <Link to="/investor/deal-intelligence" className="mt-4 text-sm text-blue-600 hover:underline">
          ← Back to Deal Flow
        </Link>
      </div>
    );
  }

  const riskColor =
    startup.riskLevel === "low"
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : startup.riskLevel === "moderate"
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : startup.riskLevel === "high"
          ? "text-red-600 bg-red-50 border-red-200"
          : "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <div className="min-h-full bg-gray-50">
      {/* Back nav */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <Link
          to="/investor/deal-intelligence"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deal Flow
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero / Intro */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#20C997] to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                {startup.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{startup.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> {startup.sector}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {startup.region}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskColor}`}>
                {startup.riskLevel} risk
              </span>
              {startup.investorsWatching > 0 && (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-[#20C997]/30 bg-[#20C997]/10 text-[#20C997]">
                  <span className="flex -space-x-1.5">
                    {Array.from({ length: Math.min(startup.investorsWatching, 4) }).map((_, i) => (
                      <span
                        key={i}
                        className="inline-block w-5 h-5 rounded-full border-2 border-emerald-50 bg-gradient-to-br from-[#20C997] to-teal-500"
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
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{startup.about.summary}</p>
              {startup.about.useCase && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-medium">Use Case:</span> {startup.about.useCase}
                </p>
              )}
              {startup.about.marketSize && (
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Market Opportunity:</span> {startup.about.marketSize}
                </p>
              )}
            </div>
          )}

          {/* Hackathon History */}
          {startup.passport && startup.passport.hackathonsEntered > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Build History</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>{startup.passport.hackathonsEntered} hackathons entered</span>
                <span>{startup.passport.demosShipped} demos shipped</span>
                {startup.passport.bestPlacement && (
                  <span>Best placement: #{startup.passport.bestPlacement}</span>
                )}
                {startup.passport.avgBriefScore && (
                  <span>Avg brief score: {startup.passport.avgBriefScore}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
          <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <p className="text-xs font-semibold text-emerald-700">GSIS v2 INVESTMENT INTELLIGENCE</p>
                <h2 className="mt-1 text-xl font-bold text-gray-900">Evidence-backed stage analysis</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">{scorecard.stage.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-emerald-600">{scorecard.gsis == null ? "—" : Math.round(scorecard.gsis)}</p>
                <p className="text-xs text-gray-500">GSIS / 100</p>
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

            <div className="grid gap-6 border-t border-gray-100 pt-5 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">Score decomposition</h3>
                  <span className="text-xs text-gray-500">{Math.round(scorecard.confidence * 100)}% confidence</span>
                </div>
                <div className="mt-3 space-y-3">
                  {Object.values(scorecard.components ?? {}).sort((a, b) => b.score - a.score).slice(0, 8).map((component) => (
                    <div key={component.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize text-gray-600">{component.key.replaceAll("_", " ")}</span>
                        <span className="font-medium text-gray-900">{Math.round(component.score)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded bg-gray-100">
                        <div className="h-full bg-emerald-500" style={{ width: component.score + "%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Stage transition</h3>
                <p className="mt-1 text-sm text-gray-600">
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
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500">PRIMARY CONSTRAINT</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-gray-900">{scorecard.bottleneck.category.replaceAll("_", " ").toLowerCase()}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Data coverage {Math.round(scorecard.data_coverage * 100)}%. Unknown metrics are excluded from the score rather than treated as zero.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Verification Badges */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Verification Status</h3>
          <div className="flex flex-wrap gap-3">
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
              <span className="text-sm text-gray-400">No verifications yet</span>
            )}
          </div>
        </div>

        {/* Milestones */}
        {startup.milestones.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Milestones</h3>
            <div className="space-y-3">
              {startup.milestones.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{m.title}</span>
                    <span className="text-xs text-gray-400 ml-2">{m.date}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      m.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : m.status === "in-progress"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-50 text-gray-500"
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
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Explore Analysis</h3>
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
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/investor/risk-radar/${startupId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Eye className="w-4 h-4" /> Full Analysis
          </Link>
          <Link
            to={`/investor/trust/${startupId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> Verify Founder
          </Link>
          <Link
            to={`/investor/data-room/${startupId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Briefcase className="w-4 h-4" /> Open Data Room
          </Link>
          <Link
            to={`/investor/deals?projectId=${encodeURIComponent(startupId || "")}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-purple-300 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-colors"
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
      <p className="truncate text-lg font-semibold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function GateRow({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm">
      <span className="capitalize text-gray-600">{label.replaceAll("_", " ").toLowerCase()}</span>
      <span className={met ? "text-emerald-600" : "text-amber-600"}>{met ? "Satisfied" : "Missing"}</span>
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
    ? "text-gray-900"
    : numVal >= 70
      ? "text-emerald-600"
      : numVal >= 40
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {typeof value === "number" ? Math.round(value) : value}
      </p>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-[#20C997]/10 text-[#20C997] border-[#20C997]/30",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[color] || colors.blue}`}>
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
    red: "bg-red-50 text-red-600",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-[#20C997]/10 text-[#20C997]",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <Link
      to={to}
      className="group rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md hover:border-gray-300 transition-all"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${iconColors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="font-semibold text-gray-900 group-hover:text-[#20C997] transition-colors">{title}</h4>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
    </Link>
  );
}

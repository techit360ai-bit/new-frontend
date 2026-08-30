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
        <div className="animate-pulse text-text-on-inverse-muted">Loading startup profile...</div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Building2 className="w-12 h-12 text-text-on-inverse-secondary mb-4" />
        <h2 className="text-lg font-semibold text-text-secondary">Startup not found</h2>
        <p className="text-sm text-text-on-inverse-disabled mt-1">This startup may not be in the current deal flow.</p>
        <Link to="/investor/deal-intelligence" className="mt-4 text-sm text-status-info hover:underline">
          ← Back to Deal Flow
        </Link>
      </div>
    );
  }

  const riskColor =
    startup.riskLevel === "low"
      ? "text-status-success bg-status-success-soft border-status-success"
      : startup.riskLevel === "moderate"
        ? "text-status-warning bg-status-warning-soft border-status-warning"
        : startup.riskLevel === "high"
          ? "text-status-error bg-status-error-soft border-status-error"
          : "text-text-muted bg-background-primary border-border-default";

  return (
    <div className="min-h-full bg-background-primary">
      {/* Back nav */}
      <div className="bg-surface-primary border-b border-border-default px-6 py-3">
        <Link
          to="/investor/deal-intelligence"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deal Flow
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero / Intro */}
        <div className="bg-surface-primary rounded-xl border border-border-default p-8 mb-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-xl font-bold">
                {startup.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{startup.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-text-on-inverse-disabled">
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
                <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-status-info bg-status-info-soft text-status-info">
                  <span className="flex -space-x-1.5">
                    {Array.from({ length: Math.min(startup.investorsWatching, 4) }).map((_, i) => (
                      <span
                        key={i}
                        className="inline-block w-5 h-5 rounded-full border-2 border-blue-50 bg-gradient-to-br from-brand-primary to-brand-accent"
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
            <div className="mt-6 border-t border-border-subtle pt-6">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">About</h3>
              <p className="text-sm text-text-muted leading-relaxed">{startup.about.summary}</p>
              {startup.about.useCase && (
                <p className="text-sm text-text-on-inverse-disabled mt-2">
                  <span className="font-medium">Use Case:</span> {startup.about.useCase}
                </p>
              )}
              {startup.about.marketSize && (
                <p className="text-sm text-text-on-inverse-disabled mt-1">
                  <span className="font-medium">Market Opportunity:</span> {startup.about.marketSize}
                </p>
              )}
            </div>
          )}

          {/* Hackathon History */}
          {startup.passport && startup.passport.hackathonsEntered > 0 && (
            <div className="mt-6 border-t border-border-subtle pt-6">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">Build History</h3>
              <div className="flex flex-wrap gap-4 text-sm text-text-muted">
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
          <section className="bg-surface-primary rounded-xl border border-border-default p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-5">
              <div>
                <p className="text-xs font-semibold text-status-success">GSIS v2 INVESTMENT INTELLIGENCE</p>
                <h2 className="mt-1 text-xl font-bold text-text-primary">Evidence-backed stage analysis</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-on-inverse-disabled">{scorecard.stage.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-status-success">{scorecard.gsis == null ? "—" : Math.round(scorecard.gsis)}</p>
                <p className="text-xs text-text-on-inverse-disabled">GSIS / 100</p>
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

            <div className="grid gap-6 border-t border-border-subtle pt-5 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Score decomposition</h3>
                  <span className="text-xs text-text-on-inverse-disabled">{Math.round(scorecard.confidence * 100)}% confidence</span>
                </div>
                <div className="mt-3 space-y-3">
                  {Object.values(scorecard.components ?? {}).sort((a, b) => b.score - a.score).slice(0, 8).map((component) => (
                    <div key={component.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="capitalize text-text-muted">{component.key.replaceAll("_", " ")}</span>
                        <span className="font-medium text-text-primary">{Math.round(component.score)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded bg-surface-secondary">
                        <div className="h-full bg-status-success" style={{ width: component.score + "%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Stage transition</h3>
                <p className="mt-1 text-sm text-text-muted">
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
                <div className="mt-5 border-t border-border-subtle pt-4">
                  <p className="text-xs font-semibold text-text-on-inverse-disabled">PRIMARY CONSTRAINT</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-text-primary">{scorecard.bottleneck.category.replaceAll("_", " ").toLowerCase()}</p>
                  <p className="mt-1 text-xs text-text-on-inverse-disabled">
                    Data coverage {Math.round(scorecard.data_coverage * 100)}%. Unknown metrics are excluded from the score rather than treated as zero.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Verification Badges */}
        <div className="bg-surface-primary rounded-xl border border-border-default p-6 mb-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">Verification Status</h3>
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
              <span className="text-sm text-text-on-inverse-muted">No verifications yet</span>
            )}
          </div>
        </div>

        {/* Milestones */}
        {startup.milestones.length > 0 && (
          <div className="bg-surface-primary rounded-xl border border-border-default p-6 mb-8">
            <h3 className="text-sm font-semibold text-text-secondary mb-4">Recent Milestones</h3>
            <div className="space-y-3">
              {startup.milestones.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-text-on-inverse-muted shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text-secondary">{m.title}</span>
                    <span className="text-xs text-text-on-inverse-muted ml-2">{m.date}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      m.status === "completed"
                        ? "bg-status-success-soft text-status-success"
                        : m.status === "in-progress"
                          ? "bg-status-info-soft text-status-info"
                          : "bg-background-primary text-text-on-inverse-disabled"
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
          <h3 className="text-lg font-bold text-text-primary mb-4">Explore Analysis</h3>
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-background-inverse text-white text-sm font-medium hover:bg-surface-inverse-muted transition-colors"
          >
            <Eye className="w-4 h-4" /> Full Analysis
          </Link>
          <Link
            to={`/investor/trust/${startupId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-strong text-text-secondary text-sm font-medium hover:bg-background-primary transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> Verify Founder
          </Link>
          <Link
            to={`/investor/data-room/${startupId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-strong text-text-secondary text-sm font-medium hover:bg-background-primary transition-colors"
          >
            <Briefcase className="w-4 h-4" /> Open Data Room
          </Link>
          <Link
            to={`/investor/deals?projectId=${encodeURIComponent(startupId || "")}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-status-pending text-status-pending text-sm font-medium hover:bg-status-pending-soft transition-colors"
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
      <p className="truncate text-lg font-semibold text-text-primary">{value}</p>
      <p className="mt-0.5 text-xs text-text-on-inverse-disabled">{label}</p>
    </div>
  );
}

function GateRow({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle pb-2 text-sm">
      <span className="capitalize text-text-muted">{label.replaceAll("_", " ").toLowerCase()}</span>
      <span className={met ? "text-status-success" : "text-status-warning"}>{met ? "Satisfied" : "Missing"}</span>
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
    ? "text-text-primary"
    : numVal >= 70
      ? "text-status-success"
      : numVal >= 40
        ? "text-status-warning"
        : "text-status-error";

  return (
    <div className="bg-surface-primary rounded-xl border border-border-default p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-text-on-inverse-muted" />
        <span className="text-xs text-text-on-inverse-disabled">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {typeof value === "number" ? Math.round(value) : value}
      </p>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-status-success-soft text-status-success border-status-success",
    blue: "bg-status-info-soft text-status-info border-status-info",
    purple: "bg-status-pending-soft text-status-pending border-status-pending",
    amber: "bg-status-warning-soft text-status-warning border-status-warning",
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
    red: "bg-status-error-soft text-status-error",
    green: "bg-status-success-soft text-status-success",
    blue: "bg-status-info-soft text-status-info",
    purple: "bg-status-pending-soft text-status-pending",
  };
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border-default bg-surface-primary p-5 hover:shadow-md hover:border-border-strong transition-all"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${iconColors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="font-semibold text-text-primary group-hover:text-status-info transition-colors">{title}</h4>
      <p className="text-xs text-text-on-inverse-disabled mt-1 leading-relaxed">{desc}</p>
    </Link>
  );
}

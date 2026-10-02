import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { Radar as RadarIcon, AlertCircle, CheckCircle, TrendingUp, Calendar, FileText, Eye, PieChart } from 'lucide-react';
import { addToWatchlist, fetchDealFlow, type InvestorStartup } from '@/lib/api/dealFlow';

function metricColor(value: number) {
  if (value >= 85) return 'text-status-success';
  if (value >= 70) return 'text-status-warning';
  return 'text-status-error';
}

function metricBarColor(value: number) {
  if (value >= 85) return 'bg-status-success';
  if (value >= 70) return 'bg-status-warning';
  return 'bg-status-error';
}

function formatMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function RiskRadar() {
  const { startupId } = useParams();
  const [startup, setStartup] = useState<InvestorStartup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startupId) {
      setIsLoading(false);
      return;
    }
    let alive = true;
    fetchDealFlow()
      .then((data) => {
        if (!alive) return;
        setStartup(data.ranking.find((item) => item.id === startupId) ?? null);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live risk radar.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, [startupId]);

  const handleWatch = () => {
    if (!startup) return;
    addToWatchlist(startup.id)
      .then(() => setStartup({ ...startup, watchlisted: true }))
      .catch(() => setError('Unable to persist watchlist item.'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-inverse flex items-center justify-center text-text-on-inverse-muted">
        Loading live risk radar...
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-background-inverse flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Live startup not found</h2>
          <p className="text-sm text-text-on-inverse-muted mb-4">
            This deal-flow record is not available for the current investor account.
          </p>
          <Link to="/investor/deal-intelligence" className="text-status-success hover:text-status-success">
            Return to Deal Intelligence
          </Link>
        </div>
      </div>
    );
  }

  const radarData = [
    { category: 'Product', value: startup.riskMetrics.product },
    { category: 'Market', value: startup.riskMetrics.market },
    { category: 'Team', value: startup.riskMetrics.team },
    { category: 'Compliance', value: startup.riskMetrics.compliance },
    { category: 'Financial', value: startup.riskMetrics.financial },
    { category: 'Execution', value: startup.riskMetrics.execution },
  ];

  const avgRisk = radarData.reduce((sum, item) => sum + item.value, 0) / radarData.length;
  const overallRiskLevel =
    avgRisk >= 85 ? 'Low Risk' : avgRisk >= 70 ? 'Moderate Risk' : 'High Risk';
  const overallRiskColor = metricColor(avgRisk);
  const weakest = [...radarData].sort((a, b) => a.value - b.value)[0];

  return (
    <div className="min-h-screen bg-background-inverse">
      <div className="border-b border-border-inverse bg-surface-inverse px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{startup.name}</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-2 py-1 bg-status-pending/20 text-status-pending rounded font-mono">
                {startup.sector}
              </span>
              <span className="text-text-on-inverse-muted">{startup.region}</span>
              <span className={`font-medium ${overallRiskColor}`}>{overallRiskLevel}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleWatch}
              disabled={startup.watchlisted}
              className="px-4 py-2 bg-status-info/10 hover:bg-status-info/20 disabled:hover:bg-status-info/10 text-status-info disabled:text-status-info font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {startup.watchlisted ? 'Watching' : 'Add to Watchlist'}
            </button>
            <Link
              to={`/investor/data-room/${startup.id}`}
              className="px-4 py-2 bg-status-success/10 hover:bg-status-success/20 text-status-success font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Data Room
            </Link>
            <Link
              to="/investor/allocation"
              className="px-4 py-2 bg-status-pending/10 hover:bg-status-pending/20 text-status-pending font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <PieChart className="w-4 h-4" />
              Simulate Allocation
            </Link>
          </div>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <RadarIcon className="w-5 h-5 text-status-success" />
              Risk Heatmap
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="category" stroke="#666" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#666" />
                  <Radar name="Risk Score" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2">
              {radarData.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <span className="text-text-on-inverse-muted">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-surface-inverse-muted rounded-full overflow-hidden">
                      <div className={`h-full ${metricBarColor(item.value)}`} style={{ width: `${item.value}%` }} />
                    </div>
                    <span className="font-mono text-white w-8">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border-inverse">
              <div className="flex items-center justify-between">
                <span className="text-text-on-inverse-muted">Overall Risk Score</span>
                <span className={`text-2xl font-bold font-mono ${overallRiskColor}`}>
                  {avgRisk.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-status-pending" />
              Execution Timeline
            </h3>
            {startup.milestones.length === 0 ? (
              <p className="text-sm text-text-on-inverse-muted">No live milestones are attached to this deal-flow snapshot yet.</p>
            ) : (
              <div className="space-y-4">
                {startup.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="relative pl-6">
                    {index < startup.milestones.length - 1 && (
                      <div className="absolute left-2 top-6 w-0.5 h-full bg-surface-inverse-muted" />
                    )}
                    <div className="absolute left-0 top-1">
                      <CheckCircle className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{milestone.title}</p>
                      <p className="text-sm text-text-on-inverse-muted">{milestone.date || 'Date unavailable'}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-mono bg-status-info/20 text-status-info">
                        {milestone.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border-inverse space-y-3">
              <MetricItem label="Market Readiness" value={startup.readinessScore} />
              <MetricItem label="Execution Velocity" value={startup.executionVelocity} />
              <MetricItem label="Beta Retention" value={`${startup.betaRetention}%`} />
              <MetricItem label="Revenue Growth" value={`${startup.revenueGrowth}%`} />
              <MetricItem label="MRR" value={formatMoney(startup.mrr)} />
              <MetricItem label="Burn Efficiency" value={startup.burnEfficiency.toFixed(1)} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-brand-primary/10 to-status-pending/10 border border-status-info/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI Risk Commentary</h3>
              <div className="space-y-4">
                {startup.riskMetrics.execution >= 85 && (
                  <InsightCard type="positive" text="Execution risk is low based on the persisted execution score." />
                )}
                {weakest && weakest.value > 0 && weakest.value < 75 && (
                  <InsightCard type="warning" text={`${weakest.category} is currently the weakest persisted risk dimension.`} />
                )}
                {startup.complianceVerified && (
                  <InsightCard type="positive" text="Compliance verification is present in the live deal-flow record." />
                )}
                {startup.founderReliability >= 90 && (
                  <InsightCard type="positive" text="Founder reliability is above 90 in the persisted investor signal." />
                )}
                {radarData.every((item) => item.value === 0) && (
                  <InsightCard type="neutral" text="Risk commentary will become more specific once risk metrics are persisted for this project." />
                )}
              </div>
            </div>

            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Comparative Analysis</h3>
              <div className="space-y-3 text-sm">
                <p className="text-text-on-inverse-secondary">
                  Live rank:{' '}
                  <span className="text-status-success font-semibold">
                    {startup.rank ? `#${startup.rank}` : 'Unranked'}
                  </span>
                </p>
                <p className="text-text-on-inverse-secondary">
                  Rank score: <span className="text-status-info font-semibold">{startup.rankScore.toFixed(0)}</span>
                </p>
                <p className="text-text-on-inverse-secondary">
                  Investors watching: <span className="text-status-info font-semibold">{startup.investorsWatching}</span>
                </p>
                <p className="text-text-on-inverse-secondary">
                  Pivot frequency: <span className="text-status-pending font-semibold">{startup.pivotFrequency}</span>
                </p>
                <p className="text-text-on-inverse-secondary">
                  Experiment velocity: <span className="text-status-pending font-semibold">{startup.experimentVelocity}/week</span>
                </p>
              </div>
            </div>

            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Investment Thesis</h3>
              <p className="text-text-on-inverse-secondary text-sm leading-relaxed">
                {startup.name} has a live readiness score of {startup.readinessScore} and an execution velocity of{' '}
                {startup.executionVelocity}. The persisted risk record currently classifies the opportunity as{' '}
                <span className={overallRiskColor}>{overallRiskLevel.toLowerCase()}</span>, with {formatMoney(startup.mrr)} MRR and {startup.revenueGrowth}% revenue growth.
              </p>
              <button className="mt-4 w-full py-2 bg-status-success/10 hover:bg-status-success/20 text-status-success font-medium rounded-lg transition-all">
                Generate Full Investment Memo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: string | number;
}

function MetricItem({ label, value }: MetricItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-on-inverse-muted">{label}</span>
      <span className="text-sm font-mono font-medium text-white">{value}</span>
    </div>
  );
}

interface InsightCardProps {
  type: 'positive' | 'warning' | 'neutral';
  text: string;
}

function InsightCard({ type, text }: InsightCardProps) {
  const colors = {
    positive: {
      icon: CheckCircle,
      iconColor: 'text-status-success',
      bgColor: 'bg-status-success/10',
      borderColor: 'border-status-success/20',
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-status-warning',
      bgColor: 'bg-status-warning/10',
      borderColor: 'border-status-warning/20',
    },
    neutral: {
      icon: TrendingUp,
      iconColor: 'text-status-info',
      bgColor: 'bg-status-info/10',
      borderColor: 'border-status-info/20',
    },
  };

  const config = colors[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 flex gap-3`}>
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <p className="text-sm text-text-on-inverse-secondary leading-relaxed">{text}</p>
    </div>
  );
}

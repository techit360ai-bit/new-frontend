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
import { Radar as RadarIcon, AlertCircle, CheckCircle, TrendingUp, Calendar, FileText, Eye, PieChart, Sparkles } from 'lucide-react';
import { addToWatchlist, fetchDealFlow, type InvestorStartup } from '@/lib/api/dealFlow';

function metricColor(value: number) {
  if (value >= 85) return 'text-[#20C997]';
  if (value >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function metricBarColor(value: number) {
  if (value >= 85) return 'bg-[#20C997]';
  if (value >= 70) return 'bg-amber-500';
  return 'bg-red-500';
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center text-slate-500 dark:text-slate-400">
        Loading live risk radar...
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-[#111111] p-8 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm max-w-md">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Live startup not found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            This deal-flow record is not available for the current investor account.
          </p>
          <Link to="/investor/deal-intelligence" className="inline-flex items-center justify-center px-4 py-2.5 bg-[#20C997] text-slate-950 font-bold rounded-xl text-xs">
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">{startup.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Risk Radar
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm mt-1">
              <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 rounded-full font-mono font-semibold">
                {startup.sector}
              </span>
              <span className="text-slate-500 dark:text-slate-400">{startup.region}</span>
              <span className={`font-bold ${overallRiskColor}`}>{overallRiskLevel}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleWatch}
              disabled={startup.watchlisted}
              className="px-3.5 py-2 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-60 font-semibold text-slate-800 dark:text-slate-200 text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-[#20C997]" />
              {startup.watchlisted ? 'Watching' : 'Watch'}
            </button>
            <Link
              to={`/investor/data-room/${startup.id}`}
              className="px-3.5 py-2 bg-[#20C997]/10 hover:bg-[#20C997]/20 text-[#20C997] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              Data Room
            </Link>
            <Link
              to="/investor/allocation"
              className="px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
            >
              <PieChart className="w-4 h-4" />
              Simulate
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <RadarIcon className="w-5 h-5 text-[#20C997]" />
              Risk Heatmap & Radar
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
                  <PolarAngleAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" tick={false} />
                  <Radar name="Risk Score" dataKey="value" stroke="#20C997" fill="#20C997" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-2.5">
              {radarData.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${metricBarColor(item.value)}`} style={{ width: `${item.value}%` }} />
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white w-6 text-right">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Overall Risk Score</span>
                <span className={`text-2xl font-bold font-mono ${overallRiskColor}`}>
                  {avgRisk.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Execution Timeline
            </h3>
            {startup.milestones.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No live milestones are attached to this deal-flow snapshot yet.</p>
            ) : (
              <div className="space-y-4">
                {startup.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="relative pl-6">
                    {index < startup.milestones.length - 1 && (
                      <div className="absolute left-2 top-6 w-0.5 h-full bg-slate-200 dark:bg-white/10" />
                    )}
                    <div className="absolute left-0 top-0.5">
                      <CheckCircle className="w-4 h-4 text-[#20C997]" />
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">{milestone.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{milestone.date || 'Date unavailable'}</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#20C997]/15 text-[#20C997]">
                        {milestone.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/10 space-y-2.5">
              <MetricItem label="Market Readiness" value={startup.readinessScore} />
              <MetricItem label="Execution Velocity" value={startup.executionVelocity} />
              <MetricItem label="Beta Retention" value={`${startup.betaRetention}%`} />
              <MetricItem label="Revenue Growth" value={`${startup.revenueGrowth}%`} />
              <MetricItem label="MRR" value={formatMoney(startup.mrr)} />
              <MetricItem label="Burn Efficiency" value={startup.burnEfficiency.toFixed(1)} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#20C997]/10 to-teal-500/5 border border-[#20C997]/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">AI Risk Commentary</h3>
              <div className="space-y-3">
                {startup.riskMetrics.execution >= 85 && (
                  <InsightCard type="positive" text="Execution risk is low based on high operational velocity score." />
                )}
                {weakest && weakest.value > 0 && weakest.value < 75 && (
                  <InsightCard type="warning" text={`${weakest.category} is currently the weakest persisted risk dimension.`} />
                )}
                {startup.complianceVerified && (
                  <InsightCard type="positive" text="Compliance verification is active in the live deal-flow record." />
                )}
                {startup.founderReliability >= 90 && (
                  <InsightCard type="positive" text="Founder reliability score exceeds 90%." />
                )}
                {radarData.every((item) => item.value === 0) && (
                  <InsightCard type="neutral" text="Risk commentary will refine as new telemetry is recorded." />
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Comparative Analysis</h3>
              <div className="space-y-2.5 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Live rank:{' '}
                  <span className="text-[#20C997] font-bold">
                    {startup.rank ? `#${startup.rank}` : 'Unranked'}
                  </span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Rank score: <span className="text-[#20C997] font-bold font-mono">{startup.rankScore.toFixed(0)}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Investors watching: <span className="text-[#20C997] font-bold font-mono">{startup.investorsWatching}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Pivot frequency: <span className="text-purple-600 dark:text-purple-400 font-bold font-mono">{startup.pivotFrequency}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Experiment velocity: <span className="text-purple-600 dark:text-purple-400 font-bold font-mono">{startup.experimentVelocity}/week</span>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Investment Thesis</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                {startup.name} has a live readiness score of {startup.readinessScore} and execution velocity of{' '}
                {startup.executionVelocity}. Classified as{' '}
                <span className={`font-bold ${overallRiskColor}`}>{overallRiskLevel.toLowerCase()}</span>, with {formatMoney(startup.mrr)} MRR.
              </p>
              <button className="mt-4 w-full py-2.5 bg-[#20C997]/10 hover:bg-[#20C997]/20 text-[#20C997] text-xs font-semibold rounded-xl transition-all">
                Generate Investment Memo
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
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-mono font-bold text-slate-900 dark:text-white">{value}</span>
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
      iconColor: 'text-[#20C997]',
      bgColor: 'bg-[#20C997]/10',
      borderColor: 'border-[#20C997]/20',
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    neutral: {
      icon: TrendingUp,
      iconColor: 'text-[#20C997]',
      bgColor: 'bg-[#20C997]/10',
      borderColor: 'border-[#20C997]/20',
    },
  };

  const config = colors[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-3.5 flex gap-3`}>
      <Icon className={`w-4 h-4 ${config.iconColor} shrink-0 mt-0.5`} />
      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{text}</p>
    </div>
  );
}

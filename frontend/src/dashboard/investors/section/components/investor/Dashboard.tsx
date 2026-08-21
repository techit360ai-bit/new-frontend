import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Shield, DollarSign, Activity, Zap, ArrowRight, Sparkles, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useInvestorProfile } from '@/contexts/UserContext';
import { fetchDealFlow, type InvestorStartup } from '@/lib/api/dealFlow';
import { WelcomeBack } from '@/components/WelcomeBack';
import { InvestorIntelligencePanel } from './InvestorIntelligencePanel';

export function Dashboard() {
  const { investorProfile } = useInvestorProfile();
  const onboardingIncomplete =
    investorProfile.industries.length === 0 || !investorProfile.stage;
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [startups, setStartups] = useState<InvestorStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchDealFlow()
      .then((data) => {
        if (!alive) return;
        setStartups(data.ranking);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live investor deal flow.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const metrics = useMemo(() => ({
    totalStartups: startups.length,
    watchlistedStartups: startups.filter((s) => s.watchlisted).length,
    highReadiness: startups.filter((s) => s.readinessScore >= 80).length,
    highExecution: startups.filter((s) => s.executionVelocity >= 75).length,
    revenueValidated: startups.filter((s) => s.mrr > 0 || s.revenueGrowth > 0).length,
    aiGovernanceVerified: startups.filter((s) => s.aiGovernanceVerified).length,
  }), [startups]);

  const highMomentumStartups = startups
    .filter((s) => s.velocityDelta > 0 || s.readinessDelta > 0)
    .sort((a, b) => Math.max(b.velocityDelta, b.readinessDelta) - Math.max(a.velocityDelta, a.readinessDelta))
    .slice(0, 5);

  const portfolioData = startups.slice(0, 8).map((startup, index) => ({
    rank: startup.rank ? `#${startup.rank}` : `${index + 1}`,
    readiness: startup.readinessScore,
    execution: startup.executionVelocity,
  }));

  const riskDistribution = {
    low: startups.filter((s) => s.riskLevel === 'low').length,
    moderate: startups.filter((s) => s.riskLevel === 'moderate').length,
    high: startups.filter((s) => s.riskLevel === 'high').length,
  };

  const totalStartups = metrics.totalStartups;
  const percent = (count: number) => totalStartups > 0 ? Math.round((count / totalStartups) * 100) : 0;
  const momentumNames = highMomentumStartups.slice(0, 2).map((startup) => startup.name).join(' and ');

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#111111] px-8 py-6">
        <h1 className="text-3xl font-bold text-white">Investor Dashboard</h1>
        <p className="text-gray-400 mt-1">Live startup execution intelligence</p>
      </div>

      <div className="p-8">
        {/* Welcome Back — contextual intelligence surface */}
        <div className="mb-6">
          <WelcomeBack />
        </div>

        <InvestorIntelligencePanel />

        {/* Onboarding banner — appears when profile is incomplete */}
        {onboardingIncomplete && !bannerDismissed && (
          <div className="mb-6 flex items-center gap-4 rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                Complete your investor profile
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Set your sectors, stage and check size so the dashboard prioritises
                the deals you actually want to see.
              </p>
            </div>
            <Link
              to="/investor/onboarding/step-1"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-colors flex-shrink-0"
            >
              Start onboarding
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Top Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <MetricCard
            label="Watchlisted Startups"
            value={metrics.watchlistedStartups}
            icon={Activity}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
            borderColor="border-blue-500/20"
          />
          <MetricCard
            label="80+ Readiness"
            value={metrics.highReadiness}
            icon={TrendingUp}
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
            borderColor="border-emerald-500/20"
          />
          <MetricCard
            label="75+ Execution Velocity"
            value={metrics.highExecution}
            icon={Zap}
            color="text-purple-400"
            bgColor="bg-purple-500/10"
            borderColor="border-purple-500/20"
          />
          <MetricCard
            label="Revenue Validated"
            value={metrics.revenueValidated}
            icon={DollarSign}
            color="text-amber-400"
            bgColor="bg-amber-500/10"
            borderColor="border-amber-500/20"
          />
          <MetricCard
            label="AI Governance Verified"
            value={metrics.aiGovernanceVerified}
            icon={Shield}
            color="text-cyan-400"
            bgColor="bg-cyan-500/10"
            borderColor="border-cyan-500/20"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Center Panel - Execution Momentum */}
          <div className="lg:col-span-2 space-y-6">
            {/* Execution Momentum Graph */}
            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Execution Momentum</h3>
              {isLoading ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-gray-800 bg-gray-800/30 text-sm text-gray-400">
                  Loading live deal-flow signals...
                </div>
              ) : portfolioData.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-lg border border-gray-800 bg-gray-800/30 text-center text-sm text-gray-400">
                  Live execution momentum will appear after deal-flow snapshots are persisted.
                </div>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={portfolioData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="rank" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="readiness"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Readiness"
                        />
                        <Line
                          type="monotone"
                          dataKey="execution"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Execution Velocity"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                      <span className="text-gray-400">Readiness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-gray-400">Execution Velocity</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Risk Distribution */}
            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Portfolio Risk Distribution</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {totalStartups === 0 ? (
                    <div className="flex h-12 items-center justify-center rounded-lg bg-gray-800/50 text-sm text-gray-400">
                      No live risk distribution yet
                    </div>
                  ) : (
                    <div className="flex gap-2 h-12 rounded-lg overflow-hidden">
                    <div
                      className="bg-emerald-500/80 flex items-center justify-center text-white font-mono text-sm font-medium"
                      style={{ width: `${percent(riskDistribution.low)}%` }}
                    >
                      {percent(riskDistribution.low)}%
                    </div>
                    <div
                      className="bg-amber-500/80 flex items-center justify-center text-white font-mono text-sm font-medium"
                      style={{ width: `${percent(riskDistribution.moderate)}%` }}
                    >
                      {percent(riskDistribution.moderate)}%
                    </div>
                    <div
                      className="bg-red-500/80 flex items-center justify-center text-white font-mono text-sm font-medium"
                      style={{ width: `${percent(riskDistribution.high)}%` }}
                    >
                      {percent(riskDistribution.high)}%
                    </div>
                    </div>
                  )}
                  <div className="flex gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                      <span className="text-gray-400">Low Risk ({riskDistribution.low})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded"></div>
                      <span className="text-gray-400">Moderate ({riskDistribution.moderate})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-gray-400">High ({riskDistribution.high})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insight Box */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">AI INSIGHTS</h4>
                  {highMomentumStartups.length > 0 ? (
                    <>
                      <p className="text-white mb-2">
                        {highMomentumStartups.length} live startup{highMomentumStartups.length === 1 ? '' : 's'} show positive execution momentum.
                      </p>
                      <p className="text-gray-300">
                        {momentumNames || 'The leading records'} currently have the strongest persisted velocity signals in your deal flow.
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-300">
                      No live momentum insight is available yet. New persisted deal-flow snapshots will populate this panel.
                    </p>
                  )}
                  <button className="mt-3 text-blue-400 text-sm font-medium hover:text-blue-300 flex items-center gap-1">
                    View detailed analysis <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - High Momentum */}
          <div className="space-y-6">
            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">High Momentum This Week</h3>
              {isLoading ? (
                <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 text-sm text-gray-400">
                  Loading live momentum...
                </div>
              ) : highMomentumStartups.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-4 text-sm text-gray-400">
                  No positive momentum signals are persisted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {highMomentumStartups.map((startup) => (
                  <Link
                    key={startup.id}
                    to={`/investor/startup/${startup.id}`}
                    className="block p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {startup.name}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded font-mono">
                        {startup.sector}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Velocity Spike</span>
                        <span className="text-emerald-400 font-mono font-medium">
                          +{Math.max(startup.velocityDelta, startup.readinessDelta)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level</span>
                        <span
                          className={`font-medium capitalize ${
                            startup.riskLevel === 'low'
                              ? 'text-emerald-400'
                              : startup.riskLevel === 'moderate'
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {startup.riskLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Investors Watching</span>
                        <span className="text-blue-400 font-mono">{startup.investorsWatching}</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded transition-all flex items-center justify-center gap-2">
                      Analyze <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

function MetricCard({ label, value, icon: Icon, color, bgColor, borderColor }: MetricCardProps) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className={`text-3xl font-bold font-mono ${color}`}>{value}</span>
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

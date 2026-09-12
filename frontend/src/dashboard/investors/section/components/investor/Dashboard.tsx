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
    revenueSignals: startups.filter((s) => s.mrr > 0 || s.revenueGrowth > 0).length,
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
    <div className="space-y-6 pb-12 transition-colors">
      {/* Welcome Back — contextual intelligence surface */}
      <div className="mb-6">
        <WelcomeBack />
      </div>

      <InvestorIntelligencePanel />

      {/* Onboarding banner — appears when profile is incomplete */}
      {onboardingIncomplete && !bannerDismissed && (
        <div className="flex items-center gap-4 rounded-2xl border border-[#20C997]/30 bg-gradient-to-r from-[#20C997]/15 via-emerald-500/5 to-transparent px-5 py-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#20C997]/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#20C997]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Complete your investor profile
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Set your sectors, stage and check size so the dashboard prioritises
              the deals you actually want to see.
            </p>
          </div>
          <Link
            to="/investor/onboarding/step-1"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#20C997] hover:bg-[#1bb587] text-slate-950 text-sm font-bold shadow-md shadow-[#20C997]/20 transition-all flex-shrink-0"
          >
            Start onboarding
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setBannerDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Top Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Watchlisted Startups"
          value={metrics.watchlistedStartups}
          icon={Activity}
          color="text-[#20C997]"
          bgColor="bg-white dark:bg-[#121212]"
          borderColor="border-black/[0.06] dark:border-white/10"
        />
        <MetricCard
          label="80+ Readiness"
          value={metrics.highReadiness}
          icon={TrendingUp}
          color="text-emerald-500 dark:text-emerald-400"
          bgColor="bg-white dark:bg-[#121212]"
          borderColor="border-black/[0.06] dark:border-white/10"
        />
        <MetricCard
          label="75+ Execution Velocity"
          value={metrics.highExecution}
          icon={Zap}
          color="text-purple-600 dark:text-purple-400"
          bgColor="bg-white dark:bg-[#121212]"
          borderColor="border-black/[0.06] dark:border-white/10"
        />
        <MetricCard
          label="Revenue Signals"
          value={metrics.revenueSignals}
          icon={DollarSign}
          color="text-amber-500 dark:text-amber-400"
          bgColor="bg-white dark:bg-[#121212]"
          borderColor="border-black/[0.06] dark:border-white/10"
        />
        <MetricCard
          label="AI Governance Verified"
          value={metrics.aiGovernanceVerified}
          icon={Shield}
          color="text-teal-600 dark:text-teal-400"
          bgColor="bg-white dark:bg-[#121212]"
          borderColor="border-black/[0.06] dark:border-white/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Center Panel - Execution Momentum */}
        <div className="lg:col-span-2 space-y-6">
          {/* Execution Momentum Graph */}
          <div className="bg-white dark:bg-[#121212] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Execution Momentum</h3>
            {isLoading ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-sm text-slate-500 dark:text-slate-400">
                Loading live deal-flow signals...
              </div>
            ) : portfolioData.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-center text-sm text-slate-500 dark:text-slate-400">
                Live execution momentum will appear after deal-flow snapshots are persisted.
              </div>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={portfolioData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.15)" />
                      <XAxis dataKey="rank" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(18, 18, 18, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="readiness"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        name="Readiness"
                      />
                      <Line
                        type="monotone"
                        dataKey="execution"
                        stroke="#20C997"
                        strokeWidth={2.5}
                        name="Execution Velocity"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-6 mt-4 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">Readiness</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#20C997] rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">Execution Velocity</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Risk Distribution */}
          <div className="bg-white dark:bg-[#121212] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Portfolio Risk Distribution</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                {totalStartups === 0 ? (
                  <div className="flex h-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-white/[0.03] text-sm text-slate-500 dark:text-slate-400">
                    No live risk distribution yet
                  </div>
                ) : (
                  <div className="flex gap-2 h-12 rounded-xl overflow-hidden shadow-inner p-1 bg-slate-100 dark:bg-white/[0.04]">
                    <div
                      className="bg-emerald-500 flex items-center justify-center text-white font-mono text-xs font-bold rounded-lg"
                      style={{ width: `${percent(riskDistribution.low)}%` }}
                    >
                      {percent(riskDistribution.low)}%
                    </div>
                    <div
                      className="bg-amber-500 flex items-center justify-center text-white font-mono text-xs font-bold rounded-lg"
                      style={{ width: `${percent(riskDistribution.moderate)}%` }}
                    >
                      {percent(riskDistribution.moderate)}%
                    </div>
                    <div
                      className="bg-red-500 flex items-center justify-center text-white font-mono text-xs font-bold rounded-lg"
                      style={{ width: `${percent(riskDistribution.high)}%` }}
                    >
                      {percent(riskDistribution.high)}%
                    </div>
                  </div>
                )}
                <div className="flex gap-6 mt-4 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">Low Risk ({riskDistribution.low})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">Moderate ({riskDistribution.moderate})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">High ({riskDistribution.high})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insight Box */}
          <div className="bg-gradient-to-br from-[#20C997]/15 via-emerald-500/5 to-transparent border border-[#20C997]/30 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#20C997]/20 rounded-xl text-[#20C997]">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#20C997] mb-1">AI INSIGHTS</h4>
                {highMomentumStartups.length > 0 ? (
                  <>
                    <p className="text-slate-900 dark:text-white font-semibold text-base mb-1">
                      {highMomentumStartups.length} live startup{highMomentumStartups.length === 1 ? '' : 's'} show positive execution momentum.
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      {momentumNames || 'The leading records'} currently have the strongest persisted velocity signals in your deal flow.
                    </p>
                  </>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    No live momentum insight is available yet. New persisted deal-flow snapshots will populate this panel.
                  </p>
                )}
                <button className="mt-3 text-[#20C997] text-sm font-bold hover:underline flex items-center gap-1.5">
                  View detailed analysis <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - High Momentum */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#121212] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">High Momentum This Week</h3>
            {isLoading ? (
              <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 text-sm text-slate-500 dark:text-slate-400">
                Loading live momentum...
              </div>
            ) : highMomentumStartups.length === 0 ? (
              <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-4 text-sm text-slate-500 dark:text-slate-400">
                No positive momentum signals are persisted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {highMomentumStartups.map((startup) => (
                <Link
                  key={startup.id}
                  to={`/investor/startup/${startup.id}`}
                  className="block p-4 bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border border-black/[0.05] dark:border-white/10 rounded-xl transition-all group shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-[#20C997] transition-colors">
                      {startup.name}
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 rounded-md font-mono">
                      {startup.sector}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Velocity Spike</span>
                      <span className="text-[#20C997] font-mono font-bold">
                        +{Math.max(startup.velocityDelta, startup.readinessDelta)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Risk Level</span>
                      <span
                        className={`font-bold capitalize ${
                          startup.riskLevel === 'low'
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : startup.riskLevel === 'moderate'
                            ? 'text-amber-500 dark:text-amber-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        {startup.riskLevel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Investors Watching</span>
                      <span className="text-[#20C997] font-mono font-bold">{startup.investorsWatching}</span>
                    </div>
                  </div>
                  <div className="mt-3 w-full py-2 bg-[#20C997]/10 group-hover:bg-[#20C997]/20 text-[#20C997] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5">
                    Analyze <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
                ))}
              </div>
            )}
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
    <div className={`${bgColor} border ${borderColor} rounded-2xl p-4 shadow-sm transition-all hover:border-[#20C997]/30`}>
      <div className="flex items-start justify-between mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className={`text-2xl font-black font-mono ${color}`}>{value}</span>
      </div>
      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
}

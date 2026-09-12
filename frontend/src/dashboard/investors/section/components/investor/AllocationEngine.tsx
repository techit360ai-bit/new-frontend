import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, ChartBar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { fetchDealFlow, type InvestorStartup, type RiskLevel } from '@/lib/api/dealFlow';

const COLORS = ['#20C997', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899', '#06b6d4'];
const BASE_REGIONS = ['North America', 'Europe', 'Asia', 'Africa', 'West Africa', 'East Africa', 'Southern Africa', 'North Africa', 'Latin America', 'Middle East', 'South Asia', 'South-East Asia'];

function riskAllowed(maxRisk: string, riskLevel: RiskLevel) {
  if (maxRisk === 'high') return true;
  if (maxRisk === 'moderate') return riskLevel === 'low' || riskLevel === 'moderate';
  return riskLevel === 'low';
}

function riskColor(riskLevel: RiskLevel) {
  if (riskLevel === 'low') return 'text-[#20C997]';
  if (riskLevel === 'moderate') return 'text-amber-600 dark:text-amber-400';
  if (riskLevel === 'high') return 'text-red-600 dark:text-red-400';
  return 'text-slate-500 dark:text-slate-400';
}

export function AllocationEngine() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [totalCapital, setTotalCapital] = useState(1000000);
  const [minReadiness, setMinReadiness] = useState(80);
  const [maxRisk, setMaxRisk] = useState('moderate');
  const [region, setRegion] = useState('all');
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
        if (alive) setError('Unable to load live allocation universe.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const regions = useMemo(
    () => ['all', ...Array.from(new Set([...BASE_REGIONS, ...startups.map((startup) => startup.region).filter(Boolean)]))],
    [startups],
  );

  const eligibleStartups = startups.filter((startup) => {
    if (startup.readinessScore < minReadiness) return false;
    if (!riskAllowed(maxRisk, startup.riskLevel)) return false;
    if (region !== 'all' && startup.region !== region) return false;
    return true;
  });

  const allocationPerStartup = eligibleStartups.length > 0 ? totalCapital / eligibleStartups.length : 0;
  const avgReadiness = eligibleStartups.length
    ? eligibleStartups.reduce((sum, startup) => sum + startup.readinessScore, 0) / eligibleStartups.length
    : minReadiness;
  const avgExecution = eligibleStartups.length
    ? eligibleStartups.reduce((sum, startup) => sum + startup.executionVelocity, 0) / eligibleStartups.length
    : 0;

  const expectedIRR = {
    min: Math.max(0, 8 + (avgReadiness - 60) * 0.35 + avgExecution * 0.08),
    max: Math.max(0, 18 + (avgReadiness - 60) * 0.55 + avgExecution * 0.15),
  };
  const survivalLikelihood = Math.min(95, Math.max(0, 40 + avgReadiness * 0.45));
  const exitProbability = {
    min: Math.max(0, 8 + (avgReadiness - 60) * 0.25),
    max: Math.max(0, 18 + (avgReadiness - 60) * 0.4 + avgExecution * 0.06),
  };

  const projectionData = [1, 2, 3, 4, 5].map((year) => {
    const expected = 1 + (expectedIRR.min + expectedIRR.max) / 200 * year;
    return {
      year: `Y${year}`,
      portfolio: Number(expected.toFixed(2)),
      best: Number((1 + expectedIRR.max / 100 * year).toFixed(2)),
      worst: Number(Math.max(0.6, 1 + expectedIRR.min / 100 * year - 0.2).toFixed(2)),
    };
  });

  const sectorDistribution = eligibleStartups.reduce((acc, startup) => {
    acc[startup.sector] = (acc[startup.sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sectorData = Object.entries(sectorDistribution).map(([name, value]) => ({
    name,
    value,
    allocation: eligibleStartups.length ? (value / eligibleStartups.length) * totalCapital : 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Capital Allocation Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Predictive Modeling
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Algorithmic portfolio deployment, risk balancing, and IRR forecasting
            </p>
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
          {/* Controls sidebar */}
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-6 self-start">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ChartBar className="w-5 h-5 text-[#20C997]" />
              Allocation Parameters
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Total Capital to Deploy</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={totalCapital}
                    onChange={(e) => setTotalCapital(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                    step="100000"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Minimum Readiness Score</label>
                  <span className="text-xs font-mono font-bold text-[#20C997]">{minReadiness}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  value={minReadiness}
                  onChange={(e) => setMinReadiness(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#20C997]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Maximum Risk Level</label>
                <select
                  value={maxRisk}
                  onChange={(e) => setMaxRisk(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                >
                  <option value="low">Low Risk Only</option>
                  <option value="moderate">Moderate or Lower</option>
                  <option value="high">All Risk Levels</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Region Preference</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                >
                  {regions.map((item) => (
                    <option key={item} value={item}>
                      {item === 'all' ? 'All Regions' : item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-black/[0.06] dark:border-white/10 space-y-2.5">
                <SummaryRow label="Live Universe" value={startups.length} />
                <SummaryRow label="Eligible Startups" value={eligibleStartups.length} />
                <SummaryRow label="Per Startup" value={`$${(allocationPerStartup / 1000).toFixed(0)}K`} accent />
              </div>

              <button
                onClick={() => {
                  toast.success(`Simulation complete: ${eligibleStartups.length} startups match criteria`);
                  resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3 bg-[#20C997] hover:bg-[#1cb084] text-slate-950 font-bold rounded-xl transition-all shadow-sm"
              >
                Run Allocation Simulation
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
                Loading live allocation universe...
              </div>
            ) : (
              <>
                <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Expected Portfolio Performance</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <MetricCard label="Expected IRR Range" value={`${expectedIRR.min.toFixed(0)}-${expectedIRR.max.toFixed(0)}%`} color="text-[#20C997]" />
                    <MetricCard label="Survival Likelihood" value={`${survivalLikelihood.toFixed(0)}%`} color="text-[#20C997]" />
                    <MetricCard label="Exit Probability" value={`${exitProbability.min.toFixed(0)}-${exitProbability.max.toFixed(0)}%`} color="text-purple-600 dark:text-purple-400" />
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="year" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                        <Line type="monotone" dataKey="best" stroke="#20C997" strokeWidth={2} name="Best Case" />
                        <Line type="monotone" dataKey="portfolio" stroke="#8b5cf6" strokeWidth={3} name="Expected" />
                        <Line type="monotone" dataKey="worst" stroke="#ef4444" strokeWidth={2} name="Worst Case" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Sector Distribution</h3>
                    {sectorData.length === 0 ? (
                      <EmptyChart message="No eligible live startups match the current allocation parameters." />
                    ) : (
                      <>
                        <div className="h-56 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={sectorData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                                {sectorData.map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <SectorLegend sectorData={sectorData} total={eligibleStartups.length} />
                      </>
                    )}
                  </div>

                  <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Capital Allocation by Sector</h3>
                    {sectorData.length === 0 ? (
                      <EmptyChart message="Adjust filters to produce a live allocation set." />
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sectorData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                            <XAxis dataKey="name" stroke="#94a3b8" angle={-35} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                              formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
                            />
                            <Bar dataKey="allocation" fill="#20C997" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#20C997]/10 to-teal-500/5 border border-[#20C997]/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-[#20C997]/20 rounded-xl shrink-0">
                      <TrendingUp className="w-5 h-5 text-[#20C997]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-[#20C997] uppercase tracking-wider mb-1">AI ALLOCATION INSIGHTS</h4>
                      {eligibleStartups.length > 0 ? (
                        <>
                          <p className="text-slate-900 dark:text-white font-medium text-sm mb-1">
                            This simulation allocates across {eligibleStartups.length} live startup{eligibleStartups.length === 1 ? '' : 's'} meeting your readiness criteria.
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                            Diversification currently spans {Object.keys(sectorDistribution).length} sector{Object.keys(sectorDistribution).length === 1 ? '' : 's'} based on live deal-flow metrics.
                          </p>
                        </>
                      ) : (
                        <p className="text-slate-600 dark:text-slate-400 text-xs">
                          No live startups match the current allocation parameters. Lower readiness or broaden risk settings.
                        </p>
                      )}
                      {eligibleStartups.length > 0 && eligibleStartups.length < 5 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Concentration alert: consider broadening the eligible allocation scope.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div ref={resultsRef} className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Eligible Startups ({eligibleStartups.length})
                  </h3>
                  <div className="space-y-3">
                    {eligibleStartups.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No live startups match the current allocation model.</p>
                    ) : (
                      eligibleStartups.map((startup) => (
                        <div key={startup.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors gap-3">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{startup.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{startup.sector} · {startup.region}</p>
                          </div>
                          <div className="flex items-center gap-6 text-xs self-end sm:self-auto">
                            <SmallMetric label="Readiness" value={startup.readinessScore} color="text-[#20C997]" />
                            <SmallMetric label="Allocation" value={`$${(allocationPerStartup / 1000).toFixed(0)}K`} color="text-purple-600 dark:text-purple-400" />
                            <SmallMetric label="Risk" value={startup.riskLevel} color={riskColor(startup.riskLevel)} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

function SummaryRow({ label, value, accent }: SummaryRowProps) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-mono font-bold ${accent ? 'text-[#20C997]' : 'text-slate-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  color: string;
}

function MetricCard({ label, value, color }: MetricCardProps) {
  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 rounded-xl p-4 shadow-sm">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-6 text-center text-xs text-slate-500 dark:text-slate-400">
      {message}
    </div>
  );
}

function SectorLegend({ sectorData, total }: { sectorData: Array<{ name: string; value: number }>; total: number }) {
  return (
    <div className="space-y-2 mt-4 pt-4 border-t border-black/[0.04] dark:border-white/5">
      {sectorData.map((sector, index) => (
        <div key={sector.name} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="text-slate-700 dark:text-slate-300 font-medium">{sector.name}</span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-mono font-bold">{total ? ((sector.value / total) * 100).toFixed(0) : 0}%</span>
        </div>
      ))}
    </div>
  );
}

function SmallMetric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="text-center">
      <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold mb-0.5">{label}</p>
      <p className={`font-mono font-bold capitalize text-sm ${color}`}>{value}</p>
    </div>
  );
}

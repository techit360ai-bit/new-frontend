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
import { DollarSign, TrendingUp, AlertCircle, ChartBar } from 'lucide-react';
import { toast } from 'sonner';
import { fetchDealFlow, type InvestorStartup, type RiskLevel } from '@/lib/api/dealFlow';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
const BASE_REGIONS = ['North America', 'Europe', 'Asia', 'Africa', 'West Africa', 'East Africa', 'Southern Africa', 'North Africa', 'Latin America', 'Middle East', 'South Asia', 'South-East Asia'];

function riskAllowed(maxRisk: string, riskLevel: RiskLevel) {
  if (maxRisk === 'high') return true;
  if (maxRisk === 'moderate') return riskLevel === 'low' || riskLevel === 'moderate';
  return riskLevel === 'low';
}

function riskColor(riskLevel: RiskLevel) {
  if (riskLevel === 'low') return 'text-emerald-400';
  if (riskLevel === 'moderate') return 'text-amber-400';
  if (riskLevel === 'high') return 'text-red-400';
  return 'text-gray-400';
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-gray-800 bg-[#111111] px-8 py-6">
        <h1 className="text-3xl font-bold text-white">Smart Capital Allocation Engine</h1>
        <p className="text-gray-400 mt-1">Predictive modeling for optimal portfolio construction</p>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <ChartBar className="w-5 h-5 text-purple-400" />
              Allocation Parameters
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Total Capital to Deploy</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={totalCapital}
                    onChange={(e) => setTotalCapital(Number(e.target.value))}
                    className="w-full pl-9 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    step="100000"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-400">Minimum Readiness Score</label>
                  <span className="text-sm font-mono text-purple-400">{minReadiness}</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  value={minReadiness}
                  onChange={(e) => setMinReadiness(Number(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Maximum Risk Level</label>
                <select
                  value={maxRisk}
                  onChange={(e) => setMaxRisk(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">Low Risk Only</option>
                  <option value="moderate">Moderate or Lower</option>
                  <option value="high">All Risk Levels</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Region Preference</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {regions.map((item) => (
                    <option key={item} value={item}>
                      {item === 'all' ? 'All Regions' : item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-6 border-t border-gray-800">
                <div className="space-y-3">
                  <SummaryRow label="Live Universe" value={startups.length} />
                  <SummaryRow label="Eligible Startups" value={eligibleStartups.length} />
                  <SummaryRow label="Per Startup" value={`$${(allocationPerStartup / 1000).toFixed(0)}K`} accent />
                </div>
              </div>

              <button
                onClick={() => {
                  toast.success(`Simulation complete: ${eligibleStartups.length} startups match your criteria`);
                  resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors"
              >
                Run Simulation
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {isLoading ? (
              <div className="rounded-lg border border-gray-800 bg-[#111111] p-10 text-center text-gray-400">
                Loading live allocation universe...
              </div>
            ) : (
              <>
                <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Expected Portfolio Performance</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <MetricCard label="Expected IRR Range" value={`${expectedIRR.min.toFixed(0)}-${expectedIRR.max.toFixed(0)}%`} color="text-emerald-400" />
                    <MetricCard label="Survival Likelihood" value={`${survivalLikelihood.toFixed(0)}%`} color="text-[#20C997]" />
                    <MetricCard label="Exit Probability" value={`${exitProbability.min.toFixed(0)}-${exitProbability.max.toFixed(0)}%`} color="text-purple-400" />
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="year" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="best" stroke="#10b981" strokeWidth={2} name="Best Case" />
                        <Line type="monotone" dataKey="portfolio" stroke="#20C997" strokeWidth={3} name="Expected" />
                        <Line type="monotone" dataKey="worst" stroke="#ef4444" strokeWidth={2} name="Worst Case" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Sector Distribution</h3>
                    {sectorData.length === 0 ? (
                      <EmptyChart message="No eligible live startups match the current allocation parameters." />
                    ) : (
                      <>
                        <div className="h-64 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={sectorData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                                {sectorData.map((_entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <SectorLegend sectorData={sectorData} total={eligibleStartups.length} />
                      </>
                    )}
                  </div>

                  <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Capital Allocation by Sector</h3>
                    {sectorData.length === 0 ? (
                      <EmptyChart message="Adjust filters to produce a live allocation set." />
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sectorData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={80} />
                            <YAxis stroke="#666" />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                              formatter={(value: number) => `$${(value / 1000).toFixed(0)}K`}
                            />
                            <Bar dataKey="allocation" fill="#8b5cf6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#20C997]/10 to-emerald-500/10 border border-[#20C997]/20 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-purple-300 mb-2">AI ALLOCATION INSIGHTS</h4>
                      {eligibleStartups.length > 0 ? (
                        <>
                          <p className="text-white mb-2">
                            This simulation allocates across {eligibleStartups.length} live startup{eligibleStartups.length === 1 ? '' : 's'} above the selected readiness and risk thresholds.
                          </p>
                          <p className="text-gray-300 text-sm">
                            Diversification currently spans {Object.keys(sectorDistribution).length} sector{Object.keys(sectorDistribution).length === 1 ? '' : 's'} from persisted investor deal-flow projections.
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-300 text-sm">
                          No live startups match the current allocation parameters. Lower readiness or broaden risk/region settings.
                        </p>
                      )}
                      {eligibleStartups.length > 0 && eligibleStartups.length < 5 && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-amber-300">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>Portfolio concentration risk: consider broadening the eligible live universe.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div ref={resultsRef} className="bg-[#111111] border border-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Eligible Startups ({eligibleStartups.length})
                  </h3>
                  <div className="space-y-2">
                    {eligibleStartups.length === 0 ? (
                      <p className="text-sm text-gray-400">No live startups match the current allocation model.</p>
                    ) : (
                      eligibleStartups.map((startup) => (
                        <div key={startup.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                          <div>
                            <p className="font-medium text-white">{startup.name}</p>
                            <p className="text-sm text-gray-400">{startup.sector}</p>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <SmallMetric label="Readiness" value={startup.readinessScore} color="text-emerald-400" />
                            <SmallMetric label="Allocation" value={`$${(allocationPerStartup / 1000).toFixed(0)}K`} color="text-purple-400" />
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
    <div className="flex justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-mono font-medium ${accent ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
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
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <p className="text-sm text-gray-400 mb-2">{label}</p>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-gray-800 bg-gray-800/30 p-6 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}

function SectorLegend({ sectorData, total }: { sectorData: Array<{ name: string; value: number }>; total: number }) {
  return (
    <div className="space-y-2 mt-4">
      {sectorData.map((sector, index) => (
        <div key={sector.name} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span className="text-gray-300">{sector.name}</span>
          </div>
          <span className="text-gray-400 font-mono">{total ? ((sector.value / total) * 100).toFixed(0) : 0}%</span>
        </div>
      ))}
    </div>
  );
}

function SmallMetric({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="text-center">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`font-mono font-medium capitalize ${color}`}>{value}</p>
    </div>
  );
}

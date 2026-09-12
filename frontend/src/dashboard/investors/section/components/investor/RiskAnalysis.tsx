import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  SortAsc,
  SortDesc,
  ArrowRight,
  ShieldAlert,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { fetchDealFlow, type InvestorStartup, type RiskLevel } from '@/lib/api/dealFlow';

type SortField = 'readinessScore' | 'avgRisk' | 'riskLevel';
type SortDir = 'asc' | 'desc';
type FilterRisk = 'all' | 'low' | 'moderate' | 'high';

function avgRiskScore(startup: InvestorStartup) {
  const m = startup.riskMetrics;
  return (m.product + m.market + m.team + m.compliance + m.financial + m.execution) / 6;
}

function riskOrder(riskLevel: RiskLevel) {
  return { low: 0, moderate: 1, high: 2, unknown: 3 }[riskLevel];
}

function riskTextColor(riskLevel: RiskLevel) {
  if (riskLevel === 'low') return 'text-emerald-400';
  if (riskLevel === 'moderate') return 'text-amber-400';
  if (riskLevel === 'high') return 'text-red-400';
  return 'text-gray-400';
}

function riskBadgeColor(riskLevel: RiskLevel) {
  if (riskLevel === 'low') return 'bg-emerald-500/20 text-emerald-400';
  if (riskLevel === 'moderate') return 'bg-amber-500/20 text-amber-400';
  if (riskLevel === 'high') return 'bg-red-500/20 text-red-400';
  return 'bg-gray-700 text-gray-300';
}

function metricColor(value: number) {
  if (value >= 85) return 'text-emerald-400';
  if (value >= 70) return 'text-amber-400';
  return 'text-red-400';
}

function metricBarColor(value: number) {
  if (value >= 85) return 'bg-emerald-500';
  if (value >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

export function RiskAnalysis() {
  const [filterRisk, setFilterRisk] = useState<FilterRisk>('all');
  const [sortField, setSortField] = useState<SortField>('avgRisk');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [startups, setStartups] = useState<InvestorStartup[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchDealFlow()
      .then((data) => {
        if (!alive) return;
        setStartups(data.ranking);
        setSelectedId((current) => current ?? data.ranking[0]?.id ?? null);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live risk analysis.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    return startups
      .filter((s) => filterRisk === 'all' || s.riskLevel === filterRisk)
      .sort((a, b) => {
        let aVal: number;
        let bVal: number;
        if (sortField === 'avgRisk') {
          aVal = avgRiskScore(a);
          bVal = avgRiskScore(b);
        } else if (sortField === 'readinessScore') {
          aVal = a.readinessScore;
          bVal = b.readinessScore;
        } else {
          aVal = riskOrder(a.riskLevel);
          bVal = riskOrder(b.riskLevel);
        }
        return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
      });
  }, [filterRisk, sortDir, sortField, startups]);

  const selectedStartup =
    startups.find((startup) => startup.id === selectedId) ?? filtered[0] ?? startups[0] ?? null;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const radarData = selectedStartup
    ? [
        { category: 'Product', value: selectedStartup.riskMetrics.product },
        { category: 'Market', value: selectedStartup.riskMetrics.market },
        { category: 'Team', value: selectedStartup.riskMetrics.team },
        { category: 'Compliance', value: selectedStartup.riskMetrics.compliance },
        { category: 'Financial', value: selectedStartup.riskMetrics.financial },
        { category: 'Execution', value: selectedStartup.riskMetrics.execution },
      ]
    : [];

  const portfolioAvg = startups.length
    ? startups.reduce((sum, s) => sum + avgRiskScore(s), 0) / startups.length
    : 0;
  const lowCount = startups.filter((s) => s.riskLevel === 'low').length;
  const modCount = startups.filter((s) => s.riskLevel === 'moderate').length;
  const highCount = startups.filter((s) => s.riskLevel === 'high').length;

  const SortIcon = sortDir === 'desc' ? SortDesc : SortAsc;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-gray-800 bg-[#111111] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Risk Analysis</h1>
            <p className="text-gray-400 mt-1">
              Multi-dimensional risk assessment across your live deal pipeline
            </p>
          </div>
          {selectedStartup && (
            <Link
              to={`/investor/risk-radar/${selectedStartup.id}`}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium rounded-lg transition-all flex items-center gap-2"
            >
              Full Radar: {selectedStartup.name}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Portfolio Avg Risk" value={portfolioAvg.toFixed(0)} sublabel="out of 100" />
          <SummaryCard label="Low Risk" value={lowCount} color="emerald" icon={CheckCircle} />
          <SummaryCard label="Moderate Risk" value={modCount} color="amber" icon={AlertTriangle} />
          <SummaryCard label="High Risk" value={highCount} color="red" icon={ShieldAlert} />
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-gray-800 bg-[#111111] p-10 text-center text-gray-400">
            Loading live risk analysis...
          </div>
        ) : startups.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#111111] p-10 text-center">
            <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">No live risk signals yet</h3>
            <p className="text-sm text-gray-400">
              Risk analysis will populate after investor deal-flow snapshots are persisted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-gray-400" />
                {(['all', 'low', 'moderate', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFilterRisk(level)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                      filterRisk === level
                        ? level === 'low'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : level === 'moderate'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : level === 'high'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-gray-700 text-white border border-gray-600'
                        : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:bg-gray-800'
                    }`}
                  >
                    {level === 'all' ? 'All' : level}
                  </button>
                ))}
                <div className="ml-auto flex gap-2">
                  <SortButton active={sortField === 'avgRisk'} onClick={() => toggleSort('avgRisk')} icon={SortIcon}>
                    Risk Score
                  </SortButton>
                  <SortButton active={sortField === 'readinessScore'} onClick={() => toggleSort('readinessScore')} icon={SortIcon}>
                    Readiness
                  </SortButton>
                </div>
              </div>

              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="rounded-lg border border-gray-800 bg-[#111111] p-8 text-center text-gray-400">
                    No live startups match the selected risk filter.
                  </div>
                ) : (
                  filtered.map((startup) => {
                    const avg = avgRiskScore(startup);
                    const isSelected = selectedStartup?.id === startup.id;
                    const weakest = Object.entries(startup.riskMetrics).sort(([, a], [, b]) => a - b)[0] ?? ['none', 0];

                    return (
                      <button
                        key={startup.id}
                        onClick={() => setSelectedId(startup.id)}
                        className={`w-full text-left p-5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : 'bg-[#111111] border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">{startup.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded font-mono ${riskBadgeColor(startup.riskLevel)}`}>
                                {startup.riskLevel}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5">
                              {startup.sector} · {startup.region}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold font-mono ${metricColor(avg)}`}>{avg.toFixed(0)}</p>
                            <p className="text-xs text-gray-500">avg risk score</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                          {Object.entries(startup.riskMetrics).map(([dim, val]) => (
                            <div key={dim}>
                              <p className="text-xs text-gray-500 mb-1 capitalize truncate">{dim}</p>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full ${metricBarColor(val)}`} style={{ width: `${val}%` }} />
                              </div>
                              <p className="text-xs font-mono text-gray-400 mt-0.5">{val}</p>
                            </div>
                          ))}
                        </div>

                        {weakest[1] < 75 && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>
                              Weakest dimension: <span className="font-semibold capitalize">{weakest[0]}</span> ({weakest[1]})
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {selectedStartup && (
              <div className="space-y-4">
                <div className="bg-[#111111] border border-gray-800 rounded-lg p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{selectedStartup.name}</h3>
                      <p className="text-sm text-gray-400">{selectedStartup.sector}</p>
                    </div>
                    <Link
                      to={`/investor/risk-radar/${selectedStartup.id}`}
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#333" />
                        <PolarAngleAxis dataKey="category" stroke="#555" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#444" tick={false} />
                        <Radar name="Risk" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 mt-4">
                    {radarData.map((item) => (
                      <div key={item.category} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${metricBarColor(item.value)}`} style={{ width: `${item.value}%` }} />
                          </div>
                          <span className="font-mono text-white w-6 text-right">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-800 grid grid-cols-2 gap-3 text-sm">
                    <DetailMetric icon={Activity} label="Readiness" value={selectedStartup.readinessScore} color="text-[#20C997]" />
                    <DetailMetric icon={TrendingUp} label="Velocity" value={selectedStartup.executionVelocity} color="text-emerald-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: 'emerald' | 'amber' | 'red';
  icon?: React.ComponentType<{ className?: string }>;
}

function SummaryCard({ label, value, sublabel = 'startups', color, icon: Icon }: SummaryCardProps) {
  const colorClass = color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : color === 'red' ? 'text-red-400' : 'text-white';
  const borderClass = color === 'emerald' ? 'border-emerald-500/20' : color === 'amber' ? 'border-amber-500/20' : color === 'red' ? 'border-red-500/20' : 'border-gray-800';
  return (
    <div className={`bg-[#111111] border ${borderClass} rounded-lg p-5`}>
      <p className={`text-xs uppercase tracking-wider mb-2 flex items-center gap-1 ${color ? colorClass : 'text-gray-400'}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </p>
      <p className={`text-3xl font-bold font-mono ${colorClass}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{sublabel}</p>
    </div>
  );
}

interface SortButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function SortButton({ active, onClick, icon: Icon, children }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
        active
          ? 'bg-[#20C997]/20 text-[#20C997] border border-[#20C997]/30'
          : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:bg-gray-800'
      }`}
    >
      {active && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

interface DetailMetricProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}

function DetailMetric({ icon: Icon, label, value, color }: DetailMetricProps) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <div className="flex items-center gap-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="font-mono font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

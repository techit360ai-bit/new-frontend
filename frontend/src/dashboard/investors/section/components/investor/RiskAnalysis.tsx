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
  ShieldCheck,
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

function riskBadgeColor(riskLevel: RiskLevel) {
  if (riskLevel === 'low') return 'bg-[#20C997]/15 text-[#20C997] border-[#20C997]/20';
  if (riskLevel === 'moderate') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
  if (riskLevel === 'high') return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20';
  return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
}

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Risk Analysis & Diagnostics
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Multi-Dimensional
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Assess product, compliance, market, and execution risk scores across deal flow
            </p>
          </div>
          {selectedStartup && (
            <Link
              to={`/investor/risk-radar/${selectedStartup.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#20C997]/10 px-4 py-2.5 font-semibold text-[#20C997] border border-[#20C997]/20 transition-all hover:bg-[#20C997]/20 text-sm"
            >
              Full Radar: {selectedStartup.name}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Portfolio Avg Risk" value={portfolioAvg.toFixed(0)} sublabel="out of 100" />
          <SummaryCard label="Low Risk" value={lowCount} color="mint" icon={CheckCircle} />
          <SummaryCard label="Moderate Risk" value={modCount} color="amber" icon={AlertTriangle} />
          <SummaryCard label="High Risk" value={highCount} color="red" icon={ShieldAlert} />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            Loading live risk analysis...
          </div>
        ) : startups.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center shadow-sm">
            <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No live risk signals yet</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Risk analysis will populate after investor deal-flow snapshots are persisted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#111111] p-4 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm">
                <Filter className="w-4 h-4 text-slate-400" />
                {(['all', 'low', 'moderate', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFilterRisk(level)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${
                      filterRisk === level
                        ? level === 'low'
                          ? 'bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/30'
                          : level === 'moderate'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : level === 'high'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                          : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {level === 'all' ? 'All Risks' : level}
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

              <div className="space-y-4">
                {filtered.length === 0 ? (
                  <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-8 text-center text-slate-500 dark:text-slate-400 shadow-sm">
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
                        className={`w-full text-left p-5 rounded-2xl border transition-all shadow-sm ${
                          isSelected
                            ? 'bg-[#20C997]/5 dark:bg-[#20C997]/10 border-[#20C997]/40 ring-1 ring-[#20C997]/30'
                            : 'bg-white dark:bg-[#111111] border-black/[0.06] dark:border-white/10 hover:border-[#20C997]/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">{startup.name}</h3>
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono border ${riskBadgeColor(startup.riskLevel)}`}>
                                {startup.riskLevel}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                              {startup.sector} · {startup.region}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold font-mono ${metricColor(avg)}`}>{avg.toFixed(0)}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">avg risk score</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {Object.entries(startup.riskMetrics).map(([dim, val]) => (
                            <div key={dim} className="bg-slate-50 dark:bg-white/[0.03] p-2 rounded-xl border border-black/[0.04] dark:border-white/5">
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 capitalize truncate font-medium">{dim}</p>
                              <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full ${metricBarColor(val)}`} style={{ width: `${val}%` }} />
                              </div>
                              <p className="text-[10px] font-mono text-slate-700 dark:text-slate-300 mt-1 font-semibold">{val}</p>
                            </div>
                          ))}
                        </div>

                        {weakest[1] < 75 && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
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
                <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{selectedStartup.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{selectedStartup.sector} · Risk Radar Map</p>
                    </div>
                    <Link
                      to={`/investor/risk-radar/${selectedStartup.id}`}
                      className="p-2 bg-[#20C997]/10 hover:bg-[#20C997]/20 text-[#20C997] rounded-xl transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
                        <PolarAngleAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" tick={false} />
                        <Radar name="Risk" dataKey="value" stroke="#20C997" fill="#20C997" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 mt-4">
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

                  <div className="mt-5 pt-5 border-t border-black/[0.06] dark:border-white/10 grid grid-cols-2 gap-3 text-xs">
                    <DetailMetric icon={Activity} label="Readiness" value={selectedStartup.readinessScore} color="text-[#20C997]" />
                    <DetailMetric icon={TrendingUp} label="Velocity" value={selectedStartup.executionVelocity} color="text-[#20C997]" />
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
  color?: 'mint' | 'amber' | 'red';
  icon?: React.ComponentType<{ className?: string }>;
}

function SummaryCard({ label, value, sublabel = 'startups', color, icon: Icon }: SummaryCardProps) {
  const colorClass = color === 'mint' ? 'text-[#20C997]' : color === 'amber' ? 'text-amber-600 dark:text-amber-400' : color === 'red' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white';
  const borderClass = color === 'mint' ? 'border-[#20C997]/20' : color === 'amber' ? 'border-amber-500/20' : color === 'red' ? 'border-red-500/20' : 'border-black/[0.06] dark:border-white/10';
  return (
    <div className={`bg-white dark:bg-[#111111] border ${borderClass} rounded-2xl p-5 shadow-sm`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${color ? colorClass : 'text-slate-500 dark:text-slate-400'}`}>
        {Icon && <Icon className="w-4 h-4" />} {label}
      </p>
      <p className={`text-3xl font-bold font-mono ${colorClass}`}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sublabel}</p>
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
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
        active
          ? 'bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/30'
          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-transparent hover:bg-slate-200 dark:hover:bg-white/10'
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
    <div className="bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl p-3">
      <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-semibold mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="font-mono font-bold text-slate-900 dark:text-white text-base">{value}</span>
      </div>
    </div>
  );
}

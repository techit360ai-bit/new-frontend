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
  if (riskLevel === 'low') return 'text-status-success';
  if (riskLevel === 'moderate') return 'text-status-warning';
  if (riskLevel === 'high') return 'text-status-error';
  return 'text-text-on-inverse-muted';
}

function riskBadgeColor(riskLevel: RiskLevel) {
  if (riskLevel === 'low') return 'bg-status-success/20 text-status-success';
  if (riskLevel === 'moderate') return 'bg-status-warning/20 text-status-warning';
  if (riskLevel === 'high') return 'bg-status-error/20 text-status-error';
  return 'bg-gray-700 text-text-on-inverse-secondary';
}

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
    <div className="min-h-screen bg-background-inverse">
      <div className="border-b border-border-inverse bg-surface-inverse px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Risk Analysis</h1>
            <p className="text-text-on-inverse-muted mt-1">
              Multi-dimensional risk assessment across your live deal pipeline
            </p>
          </div>
          {selectedStartup && (
            <Link
              to={`/investor/risk-radar/${selectedStartup.id}`}
              className="px-4 py-2 bg-status-success/10 hover:bg-status-success/20 text-status-success font-medium rounded-lg transition-all flex items-center gap-2"
            >
              Full Radar: {selectedStartup.name}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
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
          <div className="rounded-lg border border-border-inverse bg-surface-inverse p-10 text-center text-text-on-inverse-muted">
            Loading live risk analysis...
          </div>
        ) : startups.length === 0 ? (
          <div className="rounded-lg border border-border-inverse bg-surface-inverse p-10 text-center">
            <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-text-on-inverse-disabled" />
            <h3 className="text-xl font-semibold text-white mb-2">No live risk signals yet</h3>
            <p className="text-sm text-text-on-inverse-muted">
              Risk analysis will populate after investor deal-flow snapshots are persisted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-text-on-inverse-muted" />
                {(['all', 'low', 'moderate', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFilterRisk(level)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                      filterRisk === level
                        ? level === 'low'
                          ? 'bg-status-success/20 text-status-success border border-status-success/30'
                          : level === 'moderate'
                          ? 'bg-status-warning/20 text-status-warning border border-status-warning/30'
                          : level === 'high'
                          ? 'bg-status-error/20 text-status-error border border-status-error/30'
                          : 'bg-gray-700 text-white border border-gray-600'
                        : 'bg-surface-inverse-muted/50 text-text-on-inverse-muted border border-border-inverse hover:bg-surface-inverse-muted'
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
                  <div className="rounded-lg border border-border-inverse bg-surface-inverse p-8 text-center text-text-on-inverse-muted">
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
                            ? 'bg-status-success/5 border-status-success/30'
                            : 'bg-surface-inverse border-border-inverse hover:border-border-inverse-strong'
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
                            <p className="text-sm text-text-on-inverse-muted mt-0.5">
                              {startup.sector} · {startup.region}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold font-mono ${metricColor(avg)}`}>{avg.toFixed(0)}</p>
                            <p className="text-xs text-text-on-inverse-disabled">avg risk score</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                          {Object.entries(startup.riskMetrics).map(([dim, val]) => (
                            <div key={dim}>
                              <p className="text-xs text-text-on-inverse-disabled mb-1 capitalize truncate">{dim}</p>
                              <div className="h-1.5 bg-surface-inverse-muted rounded-full overflow-hidden">
                                <div className={`h-full ${metricBarColor(val)}`} style={{ width: `${val}%` }} />
                              </div>
                              <p className="text-xs font-mono text-text-on-inverse-muted mt-0.5">{val}</p>
                            </div>
                          ))}
                        </div>

                        {weakest[1] < 75 && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-status-warning">
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
                <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{selectedStartup.name}</h3>
                      <p className="text-sm text-text-on-inverse-muted">{selectedStartup.sector}</p>
                    </div>
                    <Link
                      to={`/investor/risk-radar/${selectedStartup.id}`}
                      className="p-2 bg-status-success/10 hover:bg-status-success/20 text-status-success rounded-lg transition-all"
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
                        <span className="text-text-on-inverse-muted">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-surface-inverse-muted rounded-full overflow-hidden">
                            <div className={`h-full ${metricBarColor(item.value)}`} style={{ width: `${item.value}%` }} />
                          </div>
                          <span className="font-mono text-white w-6 text-right">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-5 border-t border-border-inverse grid grid-cols-2 gap-3 text-sm">
                    <DetailMetric icon={Activity} label="Readiness" value={selectedStartup.readinessScore} color="text-status-info" />
                    <DetailMetric icon={TrendingUp} label="Velocity" value={selectedStartup.executionVelocity} color="text-status-success" />
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
  const colorClass = color === 'emerald' ? 'text-status-success' : color === 'amber' ? 'text-status-warning' : color === 'red' ? 'text-status-error' : 'text-white';
  const borderClass = color === 'emerald' ? 'border-status-success/20' : color === 'amber' ? 'border-status-warning/20' : color === 'red' ? 'border-status-error/20' : 'border-border-inverse';
  return (
    <div className={`bg-surface-inverse border ${borderClass} rounded-lg p-5`}>
      <p className={`text-xs uppercase tracking-wider mb-2 flex items-center gap-1 ${color ? colorClass : 'text-text-on-inverse-muted'}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </p>
      <p className={`text-3xl font-bold font-mono ${colorClass}`}>{value}</p>
      <p className="text-sm text-text-on-inverse-disabled mt-1">{sublabel}</p>
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
          ? 'bg-status-info/20 text-status-info border border-status-info/30'
          : 'bg-surface-inverse-muted/50 text-text-on-inverse-muted border border-border-inverse hover:bg-surface-inverse-muted'
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
    <div className="bg-surface-inverse-muted/50 rounded-lg p-3">
      <p className="text-text-on-inverse-muted text-xs mb-1">{label}</p>
      <div className="flex items-center gap-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="font-mono font-bold text-white">{value}</span>
      </div>
    </div>
  );
}

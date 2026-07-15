import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  addToWatchlist,
  fetchDealFlow,
  type InvestorStartup,
  type RiskLevel,
} from '@/lib/api/dealFlow';
import {
  Filter,
  Grid3x3,
  List,
  Eye,
  MapPin,
  ChevronDown,
  Trophy,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

const DEFAULT_FILTERS = {
  minReadiness: 0,
  minExecutionVelocity: 0,
  minBetaRetention: 0,
  minRevenueGrowth: 0,
  complianceVerified: false,
  minFounderReliability: 0,
  region: 'all',
  sector: 'all',
  maxBurnEfficiency: 10,
  hasTrackRecord: false,
  minBestPlacement: 0,
};

function riskColor(riskLevel: RiskLevel) {
  if (riskLevel === 'low') return 'text-emerald-400';
  if (riskLevel === 'moderate') return 'text-amber-400';
  if (riskLevel === 'high') return 'text-red-400';
  return 'text-gray-400';
}

function formatMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function DealIntelligence() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [expandedFilters, setExpandedFilters] = useState({
    execution: true,
    risk: false,
    behavioral: false,
    trackRecord: false,
  });
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
        if (alive) setError('Unable to load live deal intelligence.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const regions = useMemo(
    () => ['all', ...Array.from(new Set(startups.map((startup) => startup.region).filter(Boolean)))],
    [startups],
  );
  const sectors = useMemo(
    () => ['all', ...Array.from(new Set(startups.map((startup) => startup.sector).filter(Boolean)))],
    [startups],
  );

  const filteredStartups = startups.filter((startup) => {
    if (startup.readinessScore < filters.minReadiness) return false;
    if (startup.executionVelocity < filters.minExecutionVelocity) return false;
    if (startup.betaRetention < filters.minBetaRetention) return false;
    if (startup.revenueGrowth < filters.minRevenueGrowth) return false;
    if (filters.complianceVerified && !startup.complianceVerified) return false;
    if (startup.founderReliability < filters.minFounderReliability) return false;
    if (filters.region !== 'all' && startup.region !== filters.region) return false;
    if (filters.sector !== 'all' && startup.sector !== filters.sector) return false;
    if (startup.burnEfficiency > filters.maxBurnEfficiency) return false;
    if (filters.hasTrackRecord && !(startup.passport && startup.passport.hackathonsEntered > 0)) return false;
    if (
      filters.minBestPlacement > 0 &&
      !(startup.passport?.bestPlacement != null && startup.passport.bestPlacement <= filters.minBestPlacement)
    ) return false;
    return true;
  });

  const sortedStartups = [...filteredStartups].sort(
    (a, b) => (a.rank ?? 9999) - (b.rank ?? 9999) || b.rankScore - a.rankScore,
  );

  const toggleFilterSection = (section: keyof typeof expandedFilters) => {
    setExpandedFilters((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleWatch = (projectId: string) => {
    addToWatchlist(projectId)
      .then(() => {
        setStartups((current) =>
          current.map((startup) =>
            startup.id === projectId ? { ...startup, watchlisted: true } : startup,
          ),
        );
      })
      .catch(() => {
        setError('Unable to persist watchlist item.');
      });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#111111] px-8 py-6">
        <h1 className="text-3xl font-bold text-white">Deal Intelligence Engine</h1>
        <p className="text-gray-400 mt-1">
          Bloomberg Terminal for startup execution · Signal &gt; Noise
        </p>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Filter Sidebar */}
        <aside className="w-80 bg-[#111111] border-r border-gray-800 overflow-y-auto p-6">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Advanced Filters</h2>
          </div>

          <div className="space-y-4">
            <FilterSection
              title="Execution Metrics"
              isExpanded={expandedFilters.execution}
              onToggle={() => toggleFilterSection('execution')}
            >
              <SliderFilter
                label="Market Readiness"
                value={filters.minReadiness}
                onChange={(value) => setFilters({ ...filters, minReadiness: value })}
                min={0}
                max={100}
              />
              <SliderFilter
                label="Execution Velocity"
                value={filters.minExecutionVelocity}
                onChange={(value) => setFilters({ ...filters, minExecutionVelocity: value })}
                min={0}
                max={100}
              />
              <SliderFilter
                label="Beta Retention %"
                value={filters.minBetaRetention}
                onChange={(value) => setFilters({ ...filters, minBetaRetention: value })}
                min={0}
                max={100}
              />
              <SliderFilter
                label="Revenue Growth %"
                value={filters.minRevenueGrowth}
                onChange={(value) => setFilters({ ...filters, minRevenueGrowth: value })}
                min={0}
                max={100}
              />
            </FilterSection>

            <FilterSection
              title="Risk Controls"
              isExpanded={expandedFilters.risk}
              onToggle={() => toggleFilterSection('risk')}
            >
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.complianceVerified}
                    onChange={(e) =>
                      setFilters({ ...filters, complianceVerified: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-300">Compliance Verified Only</span>
                </label>
                <SliderFilter
                  label="Founder Reliability"
                  value={filters.minFounderReliability}
                  onChange={(value) => setFilters({ ...filters, minFounderReliability: value })}
                  min={0}
                  max={100}
                />
                <SliderFilter
                  label="Max Burn Efficiency"
                  value={filters.maxBurnEfficiency}
                  onChange={(value) => setFilters({ ...filters, maxBurnEfficiency: value })}
                  min={1}
                  max={10}
                />
              </div>
            </FilterSection>

            <FilterSection
              title="Behavioral Patterns"
              isExpanded={expandedFilters.behavioral}
              onToggle={() => toggleFilterSection('behavioral')}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Region</label>
                  <select
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region === 'all' ? 'All Regions' : region}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Sector</label>
                  <select
                    value={filters.sector}
                    onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {sectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector === 'all' ? 'All Sectors' : sector}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </FilterSection>

            <FilterSection
              title="Hackathon Track Record"
              isExpanded={expandedFilters.trackRecord}
              onToggle={() => toggleFilterSection('trackRecord')}
            >
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasTrackRecord}
                    onChange={(e) => setFilters({ ...filters, hasTrackRecord: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-sm text-gray-300">Has hackathon track record</span>
                </label>
                <SliderFilter
                  label="Top placement (≤)"
                  value={filters.minBestPlacement}
                  onChange={(value) => setFilters({ ...filters, minBestPlacement: value })}
                  min={0}
                  max={12}
                />
              </div>
            </FilterSection>

            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Results Panel */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-400 text-sm">
                Showing <span className="text-white font-mono">{filteredStartups.length}</span> of{' '}
                <span className="text-white font-mono">{startups.length}</span> startups
              </p>
              {startups.length > 0 && (
                <p className="text-xs text-emerald-400 mt-0.5">
                  ● Ranked by live EVI-I / WCRS domain projections
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-gray-800 bg-[#111111] p-10 text-center text-gray-400">
              Loading live deal intelligence...
            </div>
          ) : sortedStartups.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedStartups.map((startup) => (
                  <StartupCard key={startup.id} startup={startup} onWatch={handleWatch} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStartups.map((startup) => (
                  <StartupListItem key={startup.id} startup={startup} onWatch={handleWatch} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <Filter className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {startups.length === 0 ? 'No live deal-flow records yet' : 'No startups match your filters'}
              </h3>
              <p className="text-gray-400">
                {startups.length === 0
                  ? 'Persisted deal-flow snapshots will appear here once the backend has live investor projections.'
                  : 'Try adjusting your filter criteria.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function FilterSection({ title, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-800/50 flex items-center justify-between text-white hover:bg-gray-800 transition-colors"
      >
        <span className="font-medium text-sm">{title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      {isExpanded && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

interface SliderFilterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

function SliderFilter({ label, value, onChange, min, max }: SliderFilterProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm text-gray-400">{label}</label>
        <span className="text-sm font-mono text-emerald-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );
}

interface StartupCardProps {
  startup: InvestorStartup;
  onWatch: (projectId: string) => void;
}

function StartupCard({ startup, onWatch }: StartupCardProps) {
  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg mb-1">{startup.name}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono text-xs">
              {startup.sector}
            </span>
            <span className="text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {startup.region}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <MetricRow label="Readiness" value={startup.readinessScore} isScore />
        <MetricRow label="EVI" value={startup.executionVelocity} isScore />
        <MetricRow
          label="Revenue"
          value={`${formatMoney(startup.mrr)} MRR`}
          valueColor="text-emerald-400"
        />
        <MetricRow
          label="Risk Level"
          value={startup.riskLevel}
          valueColor={riskColor(startup.riskLevel)}
        />
        <MetricRow label="Founder" value={startup.founderReliability} isScore />
      </div>

      {startup.passport && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-3 font-mono">
          <Trophy className="w-3.5 h-3.5" />
          <span>
            {startup.passport.bestPlacement != null
              ? `Best #${startup.passport.bestPlacement} of ${startup.passport.cohortSize}`
              : 'No placement yet'}
            {' · '}{startup.passport.hackathonsEntered} hackathon{startup.passport.hackathonsEntered === 1 ? '' : 's'}
            {' · '}{startup.passport.demosShipped} demo{startup.passport.demosShipped === 1 ? '' : 's'}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          to={`/investor/risk-radar/${startup.id}`}
          className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded transition-all text-center"
        >
          Analyze
        </Link>
        <button
          onClick={() => onWatch(startup.id)}
          disabled={startup.watchlisted}
          className="flex-1 py-2 bg-blue-500/10 hover:bg-blue-500/20 disabled:hover:bg-blue-500/10 text-blue-400 disabled:text-blue-300 text-sm font-medium rounded transition-all flex items-center justify-center gap-1"
        >
          <Eye className="w-4 h-4" />
          {startup.watchlisted ? 'Watching' : 'Watch'}
        </button>
        <Link
          to="/investor/allocation"
          className="flex-1 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm font-medium rounded transition-all text-center"
        >
          Simulate
        </Link>
      </div>
    </div>
  );
}

function StartupListItem({ startup, onWatch }: StartupCardProps) {
  return (
    <div className="bg-[#111111] border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          <div className="min-w-48">
            <h3 className="font-semibold text-white mb-1">{startup.name}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono text-xs">
                {startup.sector}
              </span>
              <span className="text-gray-400">{startup.region}</span>
            </div>
          </div>

          <div className="flex gap-8 flex-1">
            <SignalValue label="Readiness" value={startup.readinessScore} color="text-emerald-400" />
            <SignalValue label="EVI" value={startup.executionVelocity} color="text-purple-400" />
            <SignalValue label="Revenue" value={formatMoney(startup.mrr)} color="text-emerald-400" />
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Risk</p>
              <p className={`text-sm font-medium capitalize ${riskColor(startup.riskLevel)}`}>
                {startup.riskLevel}
              </p>
            </div>
            {startup.passport && (
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Hackathon</p>
                <p className="text-sm font-bold font-mono text-amber-400">
                  {startup.passport.bestPlacement != null ? `#${startup.passport.bestPlacement}` : '—'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/investor/risk-radar/${startup.id}`}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded transition-all"
          >
            Analyze
          </Link>
          <button
            onClick={() => onWatch(startup.id)}
            disabled={startup.watchlisted}
            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 disabled:hover:bg-blue-500/10 text-blue-400 disabled:text-blue-300 text-sm font-medium rounded transition-all flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            {startup.watchlisted ? 'Watching' : 'Watch'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SignalValueProps {
  label: string;
  value: string | number;
  color: string;
}

function SignalValue({ label, value, color }: SignalValueProps) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string | number;
  isScore?: boolean;
  valueColor?: string;
}

function MetricRow({ label, value, isScore, valueColor }: MetricRowProps) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={`font-mono font-medium ${isScore ? 'text-white' : valueColor || 'text-white'} capitalize`}>
        {value}
      </span>
    </div>
  );
}

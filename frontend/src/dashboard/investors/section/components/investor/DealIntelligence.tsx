import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  addToWatchlist,
  fetchDealFlow,
  toGsisV2Input,
  type InvestorStartup,
  type RiskLevel,
} from '@/lib/api/dealFlow';
import { computeGsisV2Batch, type GsisV2Scorecard } from '@/lib/api/gsis';
import {
  Filter,
  Grid3x3,
  List,
  Eye,
  MapPin,
  ChevronDown,
  Trophy,
  Sparkles,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
const BASE_REGIONS = ['North America', 'Europe', 'Asia', 'Africa', 'West Africa', 'East Africa', 'Southern Africa', 'North Africa', 'Latin America', 'Middle East', 'South Asia', 'South-East Asia'];

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
  minGsis: 0,
  stage: 'all',
  minPmf: 0,
  minConfidence: 0,
};

function riskColor(riskLevel: RiskLevel) {
  if (riskLevel === 'low') return 'text-[#20C997] dark:text-[#20C997]';
  if (riskLevel === 'moderate') return 'text-amber-600 dark:text-amber-400';
  if (riskLevel === 'high') return 'text-red-600 dark:text-red-400';
  return 'text-slate-500 dark:text-slate-400';
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
  const [scorecards, setScorecards] = useState<Record<string, GsisV2Scorecard>>({});

  useEffect(() => {
    let alive = true;
    fetchDealFlow()
      .then((data) => {
        if (!alive) return;
        setStartups(data.ranking);
        setError(null);
        const inputs = data.ranking.map(toGsisV2Input);
        computeGsisV2Batch(inputs).then((rows) => {
          if (!alive) return;
          setScorecards(Object.fromEntries(
            rows.filter((row) => row.startup_id).map((row) => [row.startup_id as string, row]),
          ));
        });
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
    () => ['all', ...Array.from(new Set([...BASE_REGIONS, ...startups.map((startup) => startup.region).filter(Boolean)]))],
    [startups],
  );
  const sectors = useMemo(
    () => ['all', ...Array.from(new Set(startups.map((startup) => startup.sector).filter(Boolean)))],
    [startups],
  );

  const filteredStartups = startups.filter((startup) => {
    const scorecard = scorecards[startup.id];
    if (filters.minGsis > 0 && (scorecard?.gsis == null || scorecard.gsis < filters.minGsis)) return false;
    if (filters.stage !== 'all' && scorecard?.stage.detected_stage !== filters.stage) return false;
    if (filters.minPmf > 0 && (scorecard?.pmf.score == null || scorecard.pmf.score < filters.minPmf)) return false;
    if (filters.minConfidence > 0 && (!scorecard || scorecard.confidence * 100 < filters.minConfidence)) return false;
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Deal Intelligence Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Signal &gt; Noise
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Real-time startup execution scoring, stage analysis, and algorithmically projected deal flow
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8">
        {/* Filter Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-6 self-start">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#20C997]" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Advanced Filters</h2>
            </div>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs font-medium text-[#20C997] hover:underline"
            >
              Reset All
            </button>
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
              <SliderFilter
                label="Minimum GSIS v2"
                value={filters.minGsis}
                onChange={(value) => setFilters({ ...filters, minGsis: value })}
                min={0}
                max={100}
              />
              <SliderFilter
                label="Minimum PMF"
                value={filters.minPmf}
                onChange={(value) => setFilters({ ...filters, minPmf: value })}
                min={0}
                max={100}
              />
              <SliderFilter
                label="Minimum confidence %"
                value={filters.minConfidence}
                onChange={(value) => setFilters({ ...filters, minConfidence: value })}
                min={0}
                max={100}
              />
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Detected Stage</label>
                <select
                  value={filters.stage}
                  onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                >
                  <option value="all">All stages</option>
                  <option value="BUILD">Build</option>
                  <option value="LAUNCH">Launch</option>
                  <option value="GROWTH">Growth</option>
                </select>
              </div>
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
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-[#20C997] focus:ring-[#20C997]"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Compliance Verified Only</span>
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
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Region</label>
                  <select
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                  >
                    {regions.map((region) => (
                      <option key={region} value={region}>
                        {region === 'all' ? 'All Regions' : region}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">Sector</label>
                  <select
                    value={filters.sector}
                    onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#20C997]"
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
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-[#20C997] focus:ring-[#20C997]"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Has hackathon track record</span>
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
          </div>
        </aside>

        {/* Results Panel */}
        <main className="flex-1 space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111111] p-4 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm">
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Showing <span className="font-semibold text-slate-900 dark:text-white font-mono">{filteredStartups.length}</span> of{' '}
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{startups.length}</span> startups
              </p>
              {startups.length > 0 && (
                <p className="text-xs text-[#20C997] font-medium mt-0.5">
                  ● Ranked by live EVI-I / WCRS domain projections
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#20C997]/15 text-[#20C997] font-semibold'
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#20C997]/15 text-[#20C997] font-semibold'
                    : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-label="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
              Loading live deal intelligence...
            </div>
          ) : sortedStartups.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedStartups.map((startup) => (
                  <StartupCard key={startup.id} startup={startup} scorecard={scorecards[startup.id]} onWatch={handleWatch} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedStartups.map((startup) => (
                  <StartupListItem key={startup.id} startup={startup} scorecard={scorecards[startup.id]} onWatch={handleWatch} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16 bg-white dark:bg-[#111111] rounded-2xl border border-black/[0.06] dark:border-white/10 p-8 shadow-sm">
              <Filter className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {startups.length === 0 ? 'No live deal-flow records yet' : 'No startups match your filters'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
                {startups.length === 0
                  ? 'Persisted deal-flow snapshots will appear here once the backend has live investor projections.'
                  : 'Try adjusting your filter criteria.'}
              </p>
            </div>
          )}
        </main>
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
    <div className="border border-black/[0.06] dark:border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] flex items-center justify-between text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
      >
        <span className="font-semibold text-sm">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      {isExpanded && <div className="p-4 space-y-4 bg-white dark:bg-[#111111]">{children}</div>}
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
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
        <span className="text-xs font-mono font-bold text-[#20C997]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#20C997]"
      />
    </div>
  );
}

interface StartupCardProps {
  startup: InvestorStartup;
  scorecard?: GsisV2Scorecard;
  onWatch: (projectId: string) => void;
}

function StartupCard({ startup, scorecard, onWatch }: StartupCardProps) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 hover:border-[#20C997]/50 transition-all shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{startup.name}</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 rounded-full font-mono font-semibold">
                {startup.sector}
              </span>
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {startup.region}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 mb-4">
          {scorecard && <V2SignalStrip scorecard={scorecard} />}
          <MetricRow label="Readiness" value={startup.readinessScore} isScore />
          <MetricRow label="EVI" value={startup.executionVelocity} isScore />
          <MetricRow
            label="Revenue"
            value={`${formatMoney(startup.mrr)} MRR`}
            valueColor="text-[#20C997] dark:text-[#20C997]"
          />
          <MetricRow
            label="Risk Level"
            value={startup.riskLevel}
            valueColor={riskColor(startup.riskLevel)}
          />
          <MetricRow label="Founder" value={startup.founderReliability} isScore />
        </div>

        {startup.passport && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-4 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <Trophy className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {startup.passport.bestPlacement != null
                ? `Best #${startup.passport.bestPlacement} of ${startup.passport.cohortSize}`
                : 'No placement yet'}
              {' · '}{startup.passport.hackathonsEntered} hackathon{startup.passport.hackathonsEntered === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-black/[0.04] dark:border-white/5">
        <Link
          to={`/investor/startup/${startup.id}`}
          className="flex-1 py-2.5 bg-[#20C997]/10 hover:bg-[#20C997]/20 text-[#20C997] text-xs font-semibold rounded-xl transition-all text-center"
        >
          Analyze
        </Link>
        <button
          onClick={() => onWatch(startup.id)}
          disabled={startup.watchlisted}
          className="flex-1 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-60 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          {startup.watchlisted ? 'Watching' : 'Watch'}
        </button>
        <Link
          to="/investor/allocation"
          className="flex-1 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-xl transition-all text-center"
        >
          Simulate
        </Link>
      </div>
    </div>
  );
}

function StartupListItem({ startup, scorecard, onWatch }: StartupCardProps) {
  return (
    <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 hover:border-[#20C997]/50 transition-all shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
          <div className="min-w-48">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{startup.name}</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 rounded-full font-mono font-semibold">
                {startup.sector}
              </span>
              <span className="text-slate-500 dark:text-slate-400">{startup.region}</span>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-6 flex-1 items-center">
            {scorecard && <V2SignalStrip scorecard={scorecard} compact />}
            <SignalValue label="Readiness" value={startup.readinessScore} color="text-[#20C997]" />
            <SignalValue label="EVI" value={startup.executionVelocity} color="text-purple-600 dark:text-purple-400" />
            <SignalValue label="Revenue" value={formatMoney(startup.mrr)} color="text-[#20C997]" />
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Risk</p>
              <p className={`text-sm font-semibold capitalize ${riskColor(startup.riskLevel)}`}>
                {startup.riskLevel}
              </p>
            </div>
            {startup.passport && (
              <div className="text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hackathon</p>
                <p className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                  {startup.passport.bestPlacement != null ? `#${startup.passport.bestPlacement}` : '—'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 self-end lg:self-auto">
          <Link
            to={`/investor/startup/${startup.id}`}
            className="px-4 py-2.5 bg-[#20C997]/10 hover:bg-[#20C997]/20 text-[#20C997] text-xs font-semibold rounded-xl transition-all"
          >
            Analyze
          </Link>
          <button
            onClick={() => onWatch(startup.id)}
            disabled={startup.watchlisted}
            className="px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-60 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
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

function V2SignalStrip({ scorecard, compact = false }: { scorecard: GsisV2Scorecard; compact?: boolean }) {
  const momentum = (scorecard.momentum.score > 0 ? '+' : '') + scorecard.momentum.score;
  return (
    <div className={compact
      ? 'grid min-w-[20rem] grid-cols-4 gap-2 border-x md:border-y border-black/[0.06] dark:border-white/10 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.02]'
      : 'grid grid-cols-3 gap-2 border border-black/[0.06] dark:border-white/10 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.02]'}
    >
      <SignalValue label="GSIS v2" value={scorecard.gsis == null ? '—' : Math.round(scorecard.gsis)} color="text-[#20C997]" />
      <SignalValue label="Stage" value={scorecard.stage.detected_stage} color="text-slate-900 dark:text-white" />
      <SignalValue label="PMF" value={scorecard.pmf.score == null ? 'N/A' : Math.round(scorecard.pmf.score)} color="text-purple-600 dark:text-purple-300" />
      {compact && <SignalValue label="Momentum" value={momentum} color="text-amber-600 dark:text-amber-300" />}
    </div>
  );
}

function SignalValue({ label, value, color }: SignalValueProps) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">{label}</p>
      <p className={`text-sm sm:text-base font-bold font-mono ${color}`}>{value}</p>
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
    <div className="flex justify-between items-center text-xs sm:text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-mono font-semibold ${isScore ? 'text-slate-900 dark:text-white' : valueColor || 'text-slate-900 dark:text-white'} capitalize`}>
        {value}
      </span>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Globe, Filter, MapPin, TrendingUp, Sparkles } from 'lucide-react';
import { EMPTY_HEATMAP, fetchHeatmap, type RegionSignal, type SectorSignal } from '@/lib/api/heatmap';

const REGION_COLORS: Record<string, string> = {
  'North America': 'text-[#20C997]',
  'Latin America': 'text-lime-600 dark:text-lime-400',
  Europe: 'text-[#20C997]',
  Asia: 'text-purple-600 dark:text-purple-400',
  'South Asia': 'text-teal-600 dark:text-teal-400',
  'South-East Asia': 'text-fuchsia-600 dark:text-fuchsia-400',
  'Middle East': 'text-amber-600 dark:text-amber-400',
  Africa: 'text-orange-600 dark:text-orange-400',
  'West Africa': 'text-orange-600 dark:text-orange-400',
  'East Africa': 'text-yellow-600 dark:text-yellow-400',
  'Southern Africa': 'text-teal-600 dark:text-teal-400',
  'North Africa': 'text-rose-600 dark:text-rose-400',
  Oceania: 'text-cyan-600 dark:text-cyan-400',
};

export function GlobalHeatmap() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [regionSignal, setRegionSignal] = useState<RegionSignal[]>(EMPTY_HEATMAP.regions);
  const [sectorSignal, setSectorSignal] = useState<SectorSignal[]>(EMPTY_HEATMAP.sectors);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchHeatmap()
      .then((data) => {
        if (!alive) return;
        setRegionSignal(data.regions ?? []);
        setSectorSignal(data.sectors ?? []);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live heatmap signals.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const regions = regionSignal.map((region) => ({
    ...region,
    color: region.color || REGION_COLORS[region.name] || 'text-[#20C997]',
  }));
  const sectors = ['all', ...sectorSignal.map((signal) => signal.sector)];
  const visibleSectors = selectedSector === 'all'
    ? sectorSignal
    : sectorSignal.filter((signal) => signal.sector === selectedSector);
  const visibleRegions = selectedRegion
    ? regions.filter((region) => region.name === selectedRegion)
    : regions;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Global Startup Heatmap
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Geo Acceleration
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Track regional execution intensity, sector growth velocity, and compliance rates
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4 bg-white dark:bg-[#111111] p-4 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
            <Filter className="w-4 h-4 text-[#20C997]" />
            <span>Sector Filter:</span>
          </div>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-2 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#20C997]"
          >
            {sectors.map(sector => (
              <option key={sector} value={sector}>
                {sector === 'all' ? 'All Sectors' : sector}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Heatmap Visual */}
        <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-[#20C997]" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Regional Distribution & Readiness</h3>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-12 text-center text-slate-500 dark:text-slate-400">
              Loading live heatmap signals...
            </div>
          ) : regions.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-12 text-center">
              <Globe className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No regional signals yet</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Regional readiness and compliance data will appear after live deal-flow snapshots are persisted.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {regions.map((region) => (
                <button
                  key={region.name}
                  onClick={() => setSelectedRegion(selectedRegion === region.name ? null : region.name)}
                  className={`p-5 rounded-2xl border-2 transition-all text-left shadow-sm ${
                    selectedRegion === region.name
                      ? 'border-[#20C997] bg-[#20C997]/10 dark:bg-[#20C997]/10'
                      : 'border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-[#20C997]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{region.name}</h4>
                    <MapPin className={`w-5 h-5 ${region.color}`} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Readiness</span>
                      <span className={`text-xl font-bold font-mono ${region.color}`}>{region.avgReadiness}</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#20C997]"
                        style={{ width: `${region.avgReadiness}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Compliance Rate</span>
                      <span className="text-xl font-bold font-mono text-[#20C997]">{region.complianceRate}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sector Growth Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Sector Growth Patterns</h3>
            {visibleSectors.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sector growth signals will appear after live heatmap snapshots are recorded.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleSectors.map((signal) => (
                  <div key={signal.sector} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-[#20C997] rounded-full"></div>
                      <span className="text-slate-900 dark:text-white font-semibold text-sm">{signal.sector}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#20C997]">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-mono font-bold text-sm">
                        {signal.avgGrowth >= 0 ? '+' : ''}{signal.avgGrowth.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Compliance Readiness by Region</h3>
            {visibleRegions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Regional compliance rates are not available yet.
              </p>
            ) : (
              <div className="space-y-4">
                {visibleRegions.map((region) => (
                  <div key={region.name}>
                    <div className="flex justify-between items-center mb-1.5 text-xs">
                      <span className="text-slate-900 dark:text-white font-semibold">{region.name}</span>
                      <span className="font-mono font-bold text-[#20C997]">{region.complianceRate.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#20C997]"
                        style={{ width: `${region.complianceRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Signal Summary */}
        <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            {selectedRegion ? `Signals in ${selectedRegion}` : 'All Regional Signals'}
            {selectedSector !== 'all' && ` - ${selectedSector}`}
            <span className="ml-2 text-slate-500 dark:text-slate-400 font-normal text-sm">({visibleRegions.length})</span>
          </h3>
          {visibleRegions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No live heatmap records match the selected filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleRegions.map((region) => (
                <div
                  key={region.name}
                  className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{region.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Live regional aggregate</p>
                    </div>
                    <MapPin className="w-4 h-4 text-[#20C997]" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Readiness</span>
                      <span className="font-mono font-bold text-[#20C997]">{region.avgReadiness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Compliance</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{region.complianceRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

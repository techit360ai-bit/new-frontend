import { useEffect, useState } from 'react';
import { Globe, Filter, MapPin, TrendingUp } from 'lucide-react';
import { EMPTY_HEATMAP, fetchHeatmap, type RegionSignal, type SectorSignal } from '@/lib/api/heatmap';

const REGION_COLORS: Record<string, string> = {
  'North America': 'text-emerald-400',
  'Latin America': 'text-lime-400',
  Europe: 'text-blue-400',
  Asia: 'text-purple-400',
  'South Asia': 'text-indigo-400',
  'South-East Asia': 'text-fuchsia-400',
  'Middle East': 'text-amber-400',
  Africa: 'text-orange-400',
  'West Africa': 'text-orange-400',
  'East Africa': 'text-yellow-400',
  'Southern Africa': 'text-teal-400',
  'North Africa': 'text-rose-400',
  Oceania: 'text-cyan-400',
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
    color: region.color || REGION_COLORS[region.name] || 'text-emerald-400',
  }));
  const sectors = ['all', ...sectorSignal.map((signal) => signal.sector)];
  const visibleSectors = selectedSector === 'all'
    ? sectorSignal
    : sectorSignal.filter((signal) => signal.sector === selectedSector);
  const visibleRegions = selectedRegion
    ? regions.filter((region) => region.name === selectedRegion)
    : regions;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#111111] px-8 py-6">
        <h1 className="text-3xl font-bold text-white">Global Startup Heatmap</h1>
        <p className="text-gray-400 mt-1">
          Track innovation acceleration across regions and sectors
        </p>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter by:</span>
          </div>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {sectors.map(sector => (
              <option key={sector} value={sector}>
                {sector === 'all' ? 'All Sectors' : sector}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Heatmap Visual */}
        <div className="bg-[#111111] border border-gray-800 rounded-lg p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Regional Distribution</h3>
          </div>

          {isLoading ? (
            <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-8 text-center text-gray-400">
              Loading live heatmap signals...
            </div>
          ) : regions.length === 0 ? (
            <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-8 text-center">
              <Globe className="mx-auto mb-3 h-8 w-8 text-gray-500" />
              <h3 className="text-lg font-semibold text-white mb-1">No regional signals yet</h3>
              <p className="text-sm text-gray-400">
                Regional readiness and compliance data will appear after live deal-flow snapshots are persisted.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {regions.map((region) => (
              <button
                key={region.name}
                onClick={() => setSelectedRegion(selectedRegion === region.name ? null : region.name)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedRegion === region.name
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-gray-800 bg-gray-800/30 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-white">{region.name}</h4>
                  <MapPin className={`w-6 h-6 ${region.color}`} />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Avg Readiness</span>
                    <span className={`text-2xl font-bold font-mono ${region.color}`}>{region.avgReadiness}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                      style={{ width: `${region.avgReadiness}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Compliance</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">{region.complianceRate}%</span>
                  </div>
                </div>
              </button>
              ))}
            </div>
          )}
        </div>

        {/* Sector Growth Patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Sector Growth Patterns</h3>
            {visibleSectors.length === 0 ? (
              <p className="text-sm text-gray-400">
                Sector growth signals will appear after live heatmap snapshots are recorded.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleSectors.map((signal) => (
                  <div key={signal.sector} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-white font-medium">{signal.sector}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-mono text-sm">
                          {signal.avgGrowth >= 0 ? '+' : ''}{signal.avgGrowth.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Compliance Readiness by Region</h3>
            {visibleRegions.length === 0 ? (
              <p className="text-sm text-gray-400">
                Regional compliance rates are not available yet.
              </p>
            ) : (
              <div className="space-y-4">
                {visibleRegions.map((region) => (
                  <div key={region.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white">{region.name}</span>
                      <span className="text-sm font-mono text-emerald-400">{region.complianceRate.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
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
        <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedRegion ? `Signals in ${selectedRegion}` : 'All Regional Signals'}
            {selectedSector !== 'all' && ` - ${selectedSector}`}
            <span className="ml-2 text-gray-400 font-normal">({visibleRegions.length})</span>
          </h3>
          {visibleRegions.length === 0 ? (
            <p className="text-sm text-gray-400">
              No live heatmap records match the selected filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleRegions.map((region) => (
              <div
                key={region.name}
                className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{region.name}</h4>
                    <p className="text-sm text-gray-400">Live regional aggregate</p>
                  </div>
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Readiness</span>
                    <span className="font-mono text-emerald-400">{region.avgReadiness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compliance</span>
                    <span className="font-mono text-white">{region.complianceRate}%</span>
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

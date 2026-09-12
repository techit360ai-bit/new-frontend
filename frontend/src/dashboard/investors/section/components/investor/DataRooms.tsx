import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDataRooms, SECTION_LABELS, type DataRoomMeta } from '@/lib/api/dataRooms';
import {
  Database,
  FileText,
  BarChart3,
  DollarSign,
  Shield,
  Zap,
  Search,
  Clock,
  CheckCircle,
  Lock,
  ArrowRight,
  Download,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { MobileBottomSheet } from '@/components/mobile/MobilePageTemplates';

const SECTION_STYLE = [
  { icon: BarChart3, label: 'Metrics Dashboard', color: 'text-[#20C997]', bgColor: 'bg-[#20C997]/10 border-[#20C997]/20' },
  { icon: DollarSign, label: 'Financials', color: 'text-[#20C997]', bgColor: 'bg-[#20C997]/10 border-[#20C997]/20' },
  { icon: Zap, label: 'Testing Reports', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  { icon: Shield, label: 'Compliance', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  { icon: FileText, label: 'Governance', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/20' },
  { icon: FileText, label: 'Execution History', color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-500/10 border-pink-500/20' },
];

const SECTION_STYLE_BY_LABEL = Object.fromEntries(SECTION_STYLE.map((section) => [section.label, section]));

function sectionStyle(label: string) {
  return SECTION_STYLE_BY_LABEL[label] ?? { icon: FileText, label, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-white/[0.05] border-black/[0.04] dark:border-white/10' };
}

export function DataRooms() {
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [rooms, setRooms] = useState<DataRoomMeta[]>([]);
  const [sections, setSections] = useState<string[]>(SECTION_LABELS);
  const [totals, setTotals] = useState({
    activeRooms: 0,
    totalDocs: 0,
    complianceVerified: 0,
    aiSummaries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sectors = ['all', ...Array.from(new Set(rooms.map((room) => room.sector).filter(Boolean) as string[]))];

  const filtered = rooms.filter((room) => {
    const matchSearch =
      (room.startupName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (room.sector ?? '').toLowerCase().includes(search.toLowerCase());
    const matchSector = filterSector === 'all' || room.sector === filterSector;
    return matchSearch && matchSector;
  });

  useEffect(() => {
    let alive = true;
    fetchDataRooms()
      .then((data) => {
        if (!alive) return;
        setRooms(data.rooms);
        setSections(data.sections);
        setTotals(data.totals);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live data rooms.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Data Rooms
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-Structured
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Real-time due diligence repositories for every startup in your pipeline
            </p>
          </div>
          <button className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#20C997]/10 px-4 py-2.5 font-semibold text-[#20C997] border border-[#20C997]/20 transition-all hover:bg-[#20C997]/20 text-sm">
            <Download className="w-4 h-4" />
            Bulk Export Data Rooms
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-semibold">Active Data Rooms</p>
            <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{totals.activeRooms}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-semibold">Total Documents</p>
            <p className="text-3xl font-bold font-mono text-[#20C997]">{totals.totalDocs}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-semibold">Compliance Verified</p>
            <p className="text-3xl font-bold font-mono text-[#20C997]">{totals.complianceVerified}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-semibold">AI Summaries</p>
            <p className="text-3xl font-bold font-mono text-purple-600 dark:text-purple-400">{totals.aiSummaries}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between bg-white dark:bg-[#111111] p-4 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search data rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#20C997]"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white sm:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              aria-label="Filter data rooms by sector"
              className="hidden px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#20C997] sm:block"
            >
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All Sectors' : s}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{filtered.length} rooms</span>
          </div>
        </div>

        <MobileBottomSheet open={filterOpen} title="Filter data rooms" onClose={() => setFilterOpen(false)}>
          <label className="block text-sm font-semibold text-slate-900 dark:text-white" htmlFor="mobile-sector-filter">Sector</label>
          <select
            id="mobile-sector-filter"
            value={filterSector}
            onChange={(event) => { setFilterSector(event.target.value); setFilterOpen(false); }}
            className="mt-2 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] p-3 text-slate-900 dark:text-white"
          >
            {sectors.map((sector) => (
              <option key={sector} value={sector}>{sector === 'all' ? 'All Sectors' : sector}</option>
            ))}
          </select>
        </MobileBottomSheet>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Data Room Grid */}
        {isLoading ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            Loading live data rooms...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.06]">
              <Database className="h-6 w-6 text-[#20C997]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No live data rooms found</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
              Persisted investor data rooms will appear here when founders grant access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((room) => {
              const roomSections = room.sections.length ? room.sections : sections;
              return (
                <div
                  key={room.projectId}
                  className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 hover:border-[#20C997]/40 rounded-2xl p-6 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{room.startupName ?? 'Untitled data room'}</h3>
                          {room.complianceVerified && (
                            <CheckCircle className="w-4 h-4 text-[#20C997]" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {room.sector ?? 'Uncategorized'}
                        </p>
                      </div>
                      <div className="p-2.5 bg-[#20C997]/15 rounded-xl">
                        <Database className="w-5 h-5 text-[#20C997]" />
                      </div>
                    </div>

                    {/* Document sections */}
                    <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-3">
                      {roomSections.map((label) => {
                        const section = sectionStyle(label);
                        const Icon = section.icon;
                        return (
                          <div
                            key={label}
                            className={`${section.bgColor} border rounded-xl p-2.5 flex items-center gap-2`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${section.color} shrink-0`} />
                            <span className={`text-xs font-semibold ${section.color} truncate`}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Metrics row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs mb-4 pb-4 border-b border-black/[0.04] dark:border-white/5">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                        <FileText className="w-3.5 h-3.5 text-[#20C997]" />
                        <span>{room.docCount || roomSections.length} documents</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{room.updatedLabel}</span>
                      </div>
                      {room.aiGovernanceVerified ? (
                        <div className="flex items-center gap-1.5 text-[#20C997] font-semibold">
                          <Shield className="w-3.5 h-3.5" />
                          <span>AI Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <Link
                      to={`/investor/data-room/${room.projectId}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#20C997]/10 py-2.5 text-xs font-semibold text-[#20C997] transition-all hover:bg-[#20C997]/20"
                    >
                      Open Data Room
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/investor/risk-radar/${room.projectId}`}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                    >
                      Risk
                    </Link>
                    <Link
                      to={`/investor/deal-room/${room.projectId}`}
                      className="inline-flex items-center justify-center rounded-xl bg-purple-500/10 px-3.5 py-2.5 text-xs font-semibold text-purple-600 dark:text-purple-400 transition-all hover:bg-purple-500/20"
                    >
                      Deal
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info banner */}
        <div className="bg-gradient-to-br from-[#20C997]/10 to-teal-500/5 border border-[#20C997]/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-[#20C997]/20 rounded-xl shrink-0">
              <Database className="w-5 h-5 text-[#20C997]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#20C997] uppercase tracking-wider mb-1">AUTO-GENERATED DATA ROOMS</h4>
              <p className="text-slate-900 dark:text-white font-medium text-sm mb-1">
                Every startup on TechIT automatically generates a structured data room from live execution telemetry.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                Metrics, financials, testing reports, compliance documents, and AI summaries update in real time without manual upload delays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

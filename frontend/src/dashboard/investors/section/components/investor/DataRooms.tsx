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
} from 'lucide-react';

const SECTION_STYLE = [
  { icon: BarChart3, label: 'Metrics Dashboard', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { icon: DollarSign, label: 'Financials', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  { icon: Zap, label: 'Testing Reports', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { icon: Shield, label: 'Compliance', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  { icon: FileText, label: 'Governance', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
  { icon: FileText, label: 'Execution History', color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
];

const SECTION_STYLE_BY_LABEL = Object.fromEntries(SECTION_STYLE.map((section) => [section.label, section]));

function sectionStyle(label: string) {
  return SECTION_STYLE_BY_LABEL[label] ?? { icon: FileText, label, color: 'text-gray-300', bgColor: 'bg-gray-800/70' };
}

export function DataRooms() {
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState('all');
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#111111] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Data Rooms</h1>
            <p className="text-gray-400 mt-1">
              Auto-generated structured repositories for every startup in your pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium rounded-lg transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Bulk Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Active Data Rooms</p>
            <p className="text-3xl font-bold font-mono text-white">{totals.activeRooms}</p>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Documents</p>
            <p className="text-3xl font-bold font-mono text-blue-400">{totals.totalDocs}</p>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Compliance Verified</p>
            <p className="text-3xl font-bold font-mono text-emerald-400">{totals.complianceVerified}</p>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">AI Summaries</p>
            <p className="text-3xl font-bold font-mono text-purple-400">{totals.aiSummaries}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search data rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Sectors' : s}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-400 ml-auto">{filtered.length} rooms</span>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Data Room Grid */}
        {isLoading ? (
          <div className="rounded-lg border border-gray-800 bg-[#111111] p-8 text-center text-gray-400">
            Loading live data rooms...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#111111] p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
              <Database className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No live data rooms found</h3>
            <p className="text-gray-400 text-sm">
              Persisted investor data rooms will appear here when founders grant access.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((room) => {
              const roomSections = room.sections.length ? room.sections : sections;
              return (
            <div
              key={room.projectId}
              className="bg-[#111111] border border-gray-800 hover:border-gray-700 rounded-lg p-6 transition-all"
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-lg">{room.startupName ?? 'Untitled data room'}</h3>
                    {room.complianceVerified && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {room.sector ?? 'Uncategorized'}
                  </p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
              </div>

              {/* Document sections */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {roomSections.map((label) => {
                  const section = sectionStyle(label);
                  const Icon = section.icon;
                  return (
                    <div
                      key={label}
                      className={`${section.bgColor} rounded-lg p-2.5 flex items-center gap-2`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${section.color} flex-shrink-0`} />
                      <span className={`text-xs font-medium ${section.color} truncate`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Metrics row */}
              <div className="flex items-center gap-4 text-sm mb-4 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{room.docCount || roomSections.length} documents</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{room.updatedLabel}</span>
                </div>
                {room.aiGovernanceVerified ? (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>AI Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  to={`/investor/data-room/${room.projectId}`}
                  className="flex-1 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  Open Data Room
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to={`/investor/risk-radar/${room.projectId}`}
                  className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-all"
                >
                  Risk
                </Link>
                <Link
                  to={`/investor/deal-room/${room.projectId}`}
                  className="px-3 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm font-medium rounded-lg transition-all"
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
        <div className="mt-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-300 mb-2">AUTO-GENERATED DATA ROOMS</h4>
              <p className="text-white mb-1">
                Every startup on TechIT automatically gets a structured data room populated from their
                live execution data.
              </p>
              <p className="text-gray-300 text-sm">
                Metrics, financials, compliance documents, and AI summaries are updated in real-time —
                no manual uploads required. Investors can perform due diligence in minutes, not weeks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

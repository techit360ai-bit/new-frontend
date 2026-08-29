import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchDealRooms,
  stageOrder,
  type DealMeta,
  type DealRoomRecord,
  type DealStatus,
} from '@/lib/api/dealRooms';
import {
  Shield,
  MessageSquare,
  FileSignature,
  Users,
  Lock,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  ArrowRight,
  Send,
  PenLine,
  Eye,
} from 'lucide-react';

const statusConfig = {
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: Clock },
  closed: { label: 'Closed', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', icon: Lock },
};

function asString(value: unknown, fallback = '—') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function roomKey(room: DealRoomRecord) {
  return asString(room.projectId ?? room.startupId ?? room.id, room.id);
}

function roomName(room: DealRoomRecord) {
  return asString(room.startupName ?? room.name ?? room.projectName, 'Untitled deal room');
}

function metaForRoom(room: DealRoomRecord, metaById: Record<string, DealMeta>): DealMeta {
  return metaById[roomKey(room)] ?? {
    status: room.status ?? 'pending',
    stage: room.stage ?? 'Intro Call',
    daysOpen: asNumber(room.daysOpen),
    messages: asNumber(room.messages),
    docs: asNumber(room.docs),
    lastActivity: room.lastActivity ?? room.updatedAt ?? '—',
  };
}

function StageProgress({ stage }: { stage: string }) {
  const idx = stageOrder.indexOf(stage);
  return (
    <div className="flex items-center gap-1 mt-2">
      {stageOrder.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            title={s}
            className={`h-1.5 w-6 rounded-full transition-all ${
              i < idx ? 'bg-emerald-500' : i === idx ? 'bg-blue-400' : 'bg-gray-700'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export function DealRooms() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | DealStatus>('all');
  const [rooms, setRooms] = useState<DealRoomRecord[]>([]);
  const [dealMeta, setDealMeta] = useState<Record<string, DealMeta>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchDealRooms()
      .then((data) => {
        if (!alive) return;
        setRooms(data.rooms);
        setDealMeta(data.dealMeta);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live deal rooms.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const filtered = rooms.filter((room) => {
    const meta = metaForRoom(room, dealMeta);
    const searchable = `${roomName(room)} ${asString(room.sector, '')} ${asString(room.region, '')}`.toLowerCase();
    const matchSearch = searchable.includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (meta && meta.status === filterStatus);
    return matchSearch && matchStatus;
  });

  const activeCount = Object.values(dealMeta).filter((d) => d.status === 'active').length;
  const pendingCount = Object.values(dealMeta).filter((d) => d.status === 'pending').length;
  const closedCount = Object.values(dealMeta).filter((d) => d.status === 'closed').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#111111] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Deal Rooms</h1>
            <p className="text-gray-400 mt-1">
              Encrypted, investor-founder deal spaces with document signing and messaging
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">E2E Encrypted</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Rooms</p>
            <p className="text-3xl font-bold font-mono text-white">{rooms.length}</p>
          </div>
          <div className="bg-[#111111] border border-emerald-500/20 rounded-lg p-5">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Active Deals
            </p>
            <p className="text-3xl font-bold font-mono text-emerald-400">{activeCount}</p>
          </div>
          <div className="bg-[#111111] border border-amber-500/20 rounded-lg p-5">
            <p className="text-xs text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending
            </p>
            <p className="text-3xl font-bold font-mono text-amber-400">{pendingCount}</p>
          </div>
          <div className="bg-[#111111] border border-blue-500/20 rounded-lg p-5">
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Closed
            </p>
            <p className="text-3xl font-bold font-mono text-blue-400">{closedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search deal rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {(['all', 'active', 'pending', 'closed'] as const).map((status) => {
            const cfg = status !== 'all' ? statusConfig[status] : null;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  filterStatus === status
                    ? cfg
                      ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                      : 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:bg-gray-800'
                }`}
              >
                {status === 'all' ? 'All Rooms' : status}
              </button>
            );
          })}
          <span className="text-sm text-gray-400 ml-auto">{filtered.length} rooms</span>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Deal Room Cards */}
        {isLoading ? (
          <div className="rounded-lg border border-gray-800 bg-[#111111] p-8 text-center text-gray-400">
            Loading live deal rooms...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-[#111111] p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
              <Shield className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No live deal rooms found</h3>
            <p className="text-gray-400 text-sm">
              Deal rooms will appear after persisted investor-founder deal spaces are created.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((room) => {
            const meta = metaForRoom(room, dealMeta);
            const cfg = statusConfig[meta.status];
            const StatusIcon = cfg.icon;
            const id = roomKey(room);
            const readinessScore = asNumber(room.readinessScore);
            const riskLevel = asString(room.riskLevel, 'not scored');
            const riskColor =
              riskLevel === 'low'
                ? 'text-emerald-400'
                : riskLevel === 'moderate'
                ? 'text-amber-400'
                : riskLevel === 'high'
                ? 'text-red-400'
                : 'text-gray-400';

            return (
              <div
                key={id}
                className={`bg-[#111111] border rounded-lg p-6 transition-all hover:border-gray-700 ${
                  meta.status === 'active' ? 'border-gray-700' : 'border-gray-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-lg">{roomName(room)}</h3>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {asString(room.sector, 'Uncategorized')} · {asString(room.region, 'Region unavailable')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-blue-400 font-semibold">
                        {meta.stage}
                      </span>
                      <StageProgress stage={meta.stage} />
                    </div>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-lg ml-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                </div>

                {/* Activity row */}
                <div className="flex items-center gap-5 text-sm text-gray-400 mb-4 pb-4 border-b border-gray-800">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{meta.messages} messages</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>{meta.docs} documents</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{asNumber(room.investorsWatching)} watching</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{meta.lastActivity}</span>
                  </div>
                </div>

                {/* Risk & readiness quick stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-gray-500 mb-1">Readiness</p>
                    <p className="font-mono font-bold text-white">{readinessScore > 0 ? readinessScore : '—'}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-gray-500 mb-1">Risk</p>
                    <p className={`font-mono font-bold capitalize ${riskColor}`}>
                      {riskLevel}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-gray-500 mb-1">Days Open</p>
                    <p className="font-mono font-bold text-white">{meta.daysOpen}d</p>
                  </div>
                </div>

                {/* Alerts for stale deals */}
                {meta.status === 'pending' && meta.daysOpen > 2 && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 mb-3 p-2 bg-amber-500/10 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Awaiting founder response · {meta.daysOpen}d since last update
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/investor/deal-room/${id}`}
                    className="flex-1 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    Enter Deal Room
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    Message
                  </button>
                  <button className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5" />
                    Sign
                  </button>
                  <Link
                    to={`/investor/data-room/${id}`}
                    className="px-3 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Docs
                  </Link>
                </div>
              </div>
            );
            })}
          </div>
        )}

        {/* Security banner */}
        <div className="mt-8 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">INSTITUTIONAL-GRADE DEAL SECURITY</h4>
              <p className="text-white mb-1">
                All deal rooms are end-to-end encrypted with AES-256 and access logs maintained for
                full audit trails.
              </p>
              <p className="text-gray-300 text-sm">
                NDA signing, term sheet negotiation, and document execution happen entirely within the
                secure deal room — every action timestamped and cryptographically verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  Sparkles,
} from 'lucide-react';

const statusConfig = {
  active: { label: 'Active', color: 'text-[#20C997]', bg: 'bg-[#20C997]/15', border: 'border-[#20C997]/30', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', icon: Clock },
  closed: { label: 'Closed', color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-200 dark:bg-white/10', border: 'border-slate-300 dark:border-white/15', icon: Lock },
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
    <div className="flex items-center gap-1 mt-1.5">
      {stageOrder.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            title={s}
            className={`h-1.5 w-5 sm:w-6 rounded-full transition-all ${
              i < idx ? 'bg-[#20C997]' : i === idx ? 'bg-[#20C997]' : 'bg-slate-200 dark:bg-white/10'
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Deal Rooms
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> E2E Encrypted
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Secure investor-founder negotiation, document signing, and term sheet execution
            </p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#20C997]/10 border border-[#20C997]/20 rounded-xl self-start sm:self-auto">
            <Lock className="w-4 h-4 text-[#20C997]" />
            <span className="text-xs font-bold text-[#20C997]">AES-256 Encrypted</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-semibold">Total Deal Rooms</p>
            <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{rooms.length}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#20C997]/30 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-[#20C997] uppercase tracking-wider mb-2 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Active Deals
            </p>
            <p className="text-3xl font-bold font-mono text-[#20C997]">{activeCount}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-amber-500/30 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending
            </p>
            <p className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">{pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-semibold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Closed
            </p>
            <p className="text-3xl font-bold font-mono text-slate-700 dark:text-slate-300">{closedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111111] p-4 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deal rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#20C997]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'active', 'pending', 'closed'] as const).map((status) => {
              const cfg = status !== 'all' ? statusConfig[status] : null;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                    filterStatus === status
                      ? cfg
                        ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                        : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {status === 'all' ? 'All Rooms' : status}
                </button>
              );
            })}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono ml-auto">{filtered.length} rooms</span>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Deal Room Cards */}
        {isLoading ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            Loading live deal rooms...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.06]">
              <Shield className="h-6 w-6 text-[#20C997]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No live deal rooms found</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
              Deal rooms will appear after persisted investor-founder deal spaces are created.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((room) => {
              const meta = metaForRoom(room, dealMeta);
              const cfg = statusConfig[meta.status];
              const StatusIcon = cfg.icon;
              const id = roomKey(room);
              const readinessScore = asNumber(room.readinessScore);
              const riskLevel = asString(room.riskLevel, 'not scored');
              const riskColorClass =
                riskLevel === 'low'
                  ? 'text-[#20C997]'
                  : riskLevel === 'moderate'
                  ? 'text-amber-600 dark:text-amber-400'
                  : riskLevel === 'high'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400';

              return (
                <div
                  key={id}
                  className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 hover:border-[#20C997]/40 rounded-2xl p-6 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{roomName(room)}</h3>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {asString(room.sector, 'Uncategorized')} · {asString(room.region, 'Region unavailable')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-mono text-[#20C997] font-bold">
                            {meta.stage}
                          </span>
                          <StageProgress stage={meta.stage} />
                        </div>
                      </div>
                      <div className="p-2.5 bg-purple-500/10 rounded-xl ml-2">
                        <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>

                    {/* Activity row */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-black/[0.04] dark:border-white/5">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#20C997]" />
                        <span>{meta.messages} messages</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileSignature className="w-3.5 h-3.5 text-purple-500" />
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
                      <div className="bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mb-0.5">Readiness</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{readinessScore > 0 ? readinessScore : '—'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mb-0.5">Risk</p>
                        <p className={`font-mono font-bold capitalize text-sm ${riskColorClass}`}>
                          {riskLevel}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold mb-0.5">Days Open</p>
                        <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{meta.daysOpen}d</p>
                      </div>
                    </div>

                    {/* Alerts for stale deals */}
                    {meta.status === 'pending' && meta.daysOpen > 2 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Awaiting founder response · {meta.daysOpen}d since last update
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-black/[0.04] dark:border-white/5">
                    <Link
                      to={`/investor/deal-room/${id}`}
                      className="flex-1 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[120px]"
                    >
                      Enter Deal Room
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button className="px-3.5 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      Message
                    </button>
                    <button className="px-3.5 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
                      <PenLine className="w-3.5 h-3.5" />
                      Sign
                    </button>
                    <Link
                      to={`/investor/data-room/${id}`}
                      className="px-3.5 py-2.5 bg-[#20C997]/10 hover:bg-[#20C997]/20 text-[#20C997] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
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
        <div className="bg-gradient-to-br from-[#20C997]/10 to-teal-500/5 border border-[#20C997]/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-purple-500/20 rounded-xl shrink-0">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">INSTITUTIONAL-GRADE DEAL SECURITY</h4>
              <p className="text-slate-900 dark:text-white font-medium text-sm mb-1">
                All deal rooms are end-to-end encrypted with AES-256 and full cryptographic audit trails.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                NDA signing, term sheet negotiation, and milestone releases occur within secure deal rooms — every step cryptographically verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

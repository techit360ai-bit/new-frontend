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
  active: { label: 'Active', color: 'text-status-success', bg: 'bg-status-success/15', border: 'border-status-success/30', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-status-warning', bg: 'bg-status-warning/15', border: 'border-status-warning/30', icon: Clock },
  closed: { label: 'Closed', color: 'text-status-info', bg: 'bg-status-info/15', border: 'border-status-info/30', icon: Lock },
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
              i < idx ? 'bg-status-success' : i === idx ? 'bg-blue-400' : 'bg-gray-700'
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
    <div className="min-h-screen bg-background-inverse">
      {/* Header */}
      <div className="border-b border-border-inverse bg-surface-inverse px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Deal Rooms</h1>
            <p className="text-text-on-inverse-muted mt-1">
              Encrypted, investor-founder deal spaces with document signing and messaging
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-status-success/10 border border-status-success/20 rounded-lg">
            <Lock className="w-4 h-4 text-status-success" />
            <span className="text-sm text-status-success font-medium">E2E Encrypted</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-inverse border border-border-inverse rounded-lg p-5">
            <p className="text-xs text-text-on-inverse-muted uppercase tracking-wider mb-2">Total Rooms</p>
            <p className="text-3xl font-bold font-mono text-white">{rooms.length}</p>
          </div>
          <div className="bg-surface-inverse border border-status-success/20 rounded-lg p-5">
            <p className="text-xs text-status-success uppercase tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Active Deals
            </p>
            <p className="text-3xl font-bold font-mono text-status-success">{activeCount}</p>
          </div>
          <div className="bg-surface-inverse border border-status-warning/20 rounded-lg p-5">
            <p className="text-xs text-status-warning uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending
            </p>
            <p className="text-3xl font-bold font-mono text-status-warning">{pendingCount}</p>
          </div>
          <div className="bg-surface-inverse border border-status-info/20 rounded-lg p-5">
            <p className="text-xs text-status-info uppercase tracking-wider mb-2 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Closed
            </p>
            <p className="text-3xl font-bold font-mono text-status-info">{closedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-on-inverse-muted" />
            <input
              type="text"
              placeholder="Search deal rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-inverse border border-border-inverse rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                    : 'bg-surface-inverse-muted/50 text-text-on-inverse-muted border border-border-inverse hover:bg-surface-inverse-muted'
                }`}
              >
                {status === 'all' ? 'All Rooms' : status}
              </button>
            );
          })}
          <span className="text-sm text-text-on-inverse-muted ml-auto">{filtered.length} rooms</span>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        {/* Deal Room Cards */}
        {isLoading ? (
          <div className="rounded-lg border border-border-inverse bg-surface-inverse p-8 text-center text-text-on-inverse-muted">
            Loading live deal rooms...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-border-inverse bg-surface-inverse p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-inverse-muted">
              <Shield className="h-6 w-6 text-text-on-inverse-muted" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No live deal rooms found</h3>
            <p className="text-text-on-inverse-muted text-sm">
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
                ? 'text-status-success'
                : riskLevel === 'moderate'
                ? 'text-status-warning'
                : riskLevel === 'high'
                ? 'text-status-error'
                : 'text-text-on-inverse-muted';

            return (
              <div
                key={id}
                className={`bg-surface-inverse border rounded-lg p-6 transition-all hover:border-border-inverse-strong ${
                  meta.status === 'active' ? 'border-border-inverse-strong' : 'border-border-inverse'
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
                    <p className="text-sm text-text-on-inverse-muted">
                      {asString(room.sector, 'Uncategorized')} · {asString(room.region, 'Region unavailable')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-status-info font-semibold">
                        {meta.stage}
                      </span>
                      <StageProgress stage={meta.stage} />
                    </div>
                  </div>
                  <div className="p-2 bg-status-pending/10 rounded-lg ml-2">
                    <Shield className="w-5 h-5 text-status-pending" />
                  </div>
                </div>

                {/* Activity row */}
                <div className="flex items-center gap-5 text-sm text-text-on-inverse-muted mb-4 pb-4 border-b border-border-inverse">
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
                  <div className="bg-surface-inverse-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-text-on-inverse-disabled mb-1">Readiness</p>
                    <p className="font-mono font-bold text-white">{readinessScore > 0 ? readinessScore : '—'}</p>
                  </div>
                  <div className="bg-surface-inverse-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-text-on-inverse-disabled mb-1">Risk</p>
                    <p className={`font-mono font-bold capitalize ${riskColor}`}>
                      {riskLevel}
                    </p>
                  </div>
                  <div className="bg-surface-inverse-muted/50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-text-on-inverse-disabled mb-1">Days Open</p>
                    <p className="font-mono font-bold text-white">{meta.daysOpen}d</p>
                  </div>
                </div>

                {/* Alerts for stale deals */}
                {meta.status === 'pending' && meta.daysOpen > 2 && (
                  <div className="flex items-center gap-2 text-xs text-status-warning mb-3 p-2 bg-status-warning/10 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Awaiting founder response · {meta.daysOpen}d since last update
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/investor/deal-room/${id}`}
                    className="flex-1 py-2.5 bg-status-pending/10 hover:bg-status-pending/20 text-status-pending text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    Enter Deal Room
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button className="px-3 py-2.5 bg-surface-inverse-muted hover:bg-gray-700 text-text-on-inverse-secondary text-sm font-medium rounded-lg transition-all flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    Message
                  </button>
                  <button className="px-3 py-2.5 bg-surface-inverse-muted hover:bg-gray-700 text-text-on-inverse-secondary text-sm font-medium rounded-lg transition-all flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5" />
                    Sign
                  </button>
                  <Link
                    to={`/investor/data-room/${id}`}
                    className="px-3 py-2.5 bg-status-info/10 hover:bg-status-info/20 text-status-info text-sm font-medium rounded-lg transition-all flex items-center gap-1.5"
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
        <div className="mt-8 bg-gradient-to-br from-status-pending/10 to-brand-primary/10 border border-status-pending/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-status-pending/20 rounded-lg">
              <Shield className="w-5 h-5 text-status-pending" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-status-pending mb-2">INSTITUTIONAL-GRADE DEAL SECURITY</h4>
              <p className="text-white mb-1">
                All deal rooms are end-to-end encrypted with AES-256 and access logs maintained for
                full audit trails.
              </p>
              <p className="text-text-on-inverse-secondary text-sm">
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Flame,
  MessageCircle,
  Users,
  ArrowUp,
  Zap,
  CheckCheck,
  AtSign,
  Star,
} from 'lucide-react';
import {
  listFeedNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type FeedNotification,
  type FeedNotificationType,
} from '@/lib/api/notifications';
import { BackButton } from '../components/BackButton';
import { FeedErrorState, FeedLoadingState } from '../components/FeedStates';
import { VirtualizedList } from '@/components/mobile/VirtualizedList';

const TYPE_CONFIG: Record<FeedNotificationType, { icon: React.ReactNode; label: string }> = {
  fire: { icon: <Flame className="h-3.5 w-3.5" />, label: 'Reactions' },
  comment: { icon: <MessageCircle className="h-3.5 w-3.5" />, label: 'Comments' },
  collab: { icon: <Users className="h-3.5 w-3.5" />, label: 'Collab' },
  gsis: { icon: <ArrowUp className="h-3.5 w-3.5" />, label: 'GSIS' },
  milestone: { icon: <Zap className="h-3.5 w-3.5" />, label: 'Milestones' },
  mention: { icon: <AtSign className="h-3.5 w-3.5" />, label: 'Mentions' },
  answer: { icon: <Star className="h-3.5 w-3.5" />, label: 'Answers' },
};

type FilterTab = 'all' | FeedNotificationType;

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listFeedNotifications()
      .then((rows) => { if (alive) setNotifications(rows); })
      .catch((err) => {
        if (!alive) return;
        setNotifications([]);
        setError(err instanceof Error ? err.message : 'Live notifications are unavailable.');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const markRead = (id: string) => {
    const row = notifications.find((notification) => notification.id === id);
    if (!row || row.read) return;
    markNotificationRead(id)
      .then(() => setNotifications((current) => current.map((notification) => (
        notification.id === id ? { ...notification, read: true } : notification
      ))))
      .catch((err) => setError(err instanceof Error ? err.message : 'Notification update failed.'));
  };

  const markAllRead = () => {
    markAllNotificationsRead()
      .then(() => setNotifications((current) => current.map((notification) => ({ ...notification, read: true }))))
      .catch((err) => setError(err instanceof Error ? err.message : 'Notification update failed.'));
  };

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'comment', label: 'Comments' },
    { id: 'fire', label: 'Reactions' },
    { id: 'collab', label: 'Collab' },
    { id: 'mention', label: 'Mentions' },
    { id: 'gsis', label: 'GSIS' },
  ];
  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter((notification) => notification.type === activeFilter);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20 lg:pb-6 space-y-6 font-bricolage">
      <BackButton className="mb-2" />
      
      {/* Header Glass Card */}
      <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            <Bell className="h-6 w-6 text-[#0066ff] dark:text-[#58a6ff]" />
            Notifications
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {unreadCount} unread live notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-sm self-start sm:self-auto"
          >
            <CheckCheck className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const count = notifications.filter((notification) => (
            !notification.read && (tab.id === 'all' || notification.type === tab.id)
          )).length;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#0066ff] text-white shadow-md shadow-[#0066ff]/25'
                  : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#0066ff]/10 text-[#0066ff] dark:bg-[#58a6ff]/20 dark:text-[#58a6ff]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && <FeedLoadingState label="Loading live notifications..." />}
      {!loading && error && <FeedErrorState message={error} />}
      {!loading && !error && (
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-sm overflow-hidden">
          <VirtualizedList
            items={filtered}
            className="h-[min(70dvh,680px)]"
            itemContent={(_, notification) => (
              <NotificationRow key={notification.id} notification={notification} onRead={markRead} />
            )}
          />
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No live notifications in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: FeedNotification;
  onRead: (id: string) => void;
}) {
  const config = TYPE_CONFIG[notification.type];
  return (
    <Link
      to={notification.linkTo}
      onClick={() => onRead(notification.id)}
      className="flex items-start gap-3 border-b border-black/[0.06] dark:border-white/10 px-5 py-4 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors"
      style={{ backgroundColor: !notification.read ? 'rgba(0,102,255,0.04)' : undefined }}
    >
      <div className="relative shrink-0">
        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${notification.avatar}`} />
        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-[#121212] bg-[#0066ff] text-white">
          {config.icon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed text-slate-900 dark:text-white">
          <span className="font-bold">{notification.author}</span>{' '}
          <span className="text-slate-600 dark:text-slate-300 font-normal">{notification.content}</span>
        </p>
        <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {notification.timeAgo} · {config.label}
        </p>
      </div>
      {!notification.read && (
        <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0066ff] dark:bg-[#58a6ff] shadow-sm shadow-[#0066ff]/50" />
      )}
    </Link>
  );
}

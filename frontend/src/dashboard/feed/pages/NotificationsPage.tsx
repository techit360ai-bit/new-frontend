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
    <div className="mx-auto max-w-2xl px-4 py-6 pb-20 lg:pb-6">
      <BackButton className="mb-6" />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-text-primary">
            <Bell className="h-5 w-5 text-accent-primary" />
            Notifications
          </h1>
          <p className="mt-1 text-xs text-text-muted">{unreadCount} unread live notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:border-accent-primary hover:text-accent-primary"
          >
            <CheckCheck className="h-3.5 w-3.5" />Mark all read
          </button>
        )}
      </div>

      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const count = notifications.filter((notification) => (
            !notification.read && (tab.id === 'all' || notification.type === tab.id)
          )).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${
                activeFilter === tab.id
                  ? 'border-accent-primary bg-accent-primary/15 text-accent-primary'
                  : 'border-border-default bg-surface-secondary text-text-secondary'
              }`}
            >
              {tab.label}{count > 0 ? ` ${count}` : ''}
            </button>
          );
        })}
      </div>

      {loading && <FeedLoadingState label="Loading live notifications..." />}
      {!loading && error && <FeedErrorState message={error} />}
      {!loading && !error && (
        <div className="overflow-hidden border-y border-border-default bg-surface-primary sm:rounded-lg sm:border">
          <VirtualizedList items={filtered} className="h-[min(70dvh,680px)]" itemContent={(_, notification) => <NotificationRow key={notification.id} notification={notification} onRead={markRead} />} />
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Bell className="h-7 w-7 text-text-muted" />
              <p className="text-sm text-text-secondary">No live notifications in this category.</p>
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
      className="flex items-start gap-3 border-b border-border-default px-4 py-4 last:border-b-0 hover:bg-surface-secondary"
      style={{ backgroundColor: !notification.read ? 'rgba(79,110,247,0.03)' : undefined }}
    >
      <div className="relative shrink-0">
        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${notification.avatar}`} />
        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-border-default bg-accent-primary/15 text-accent-primary">
          {config.icon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-text-primary">
          <span className="font-medium">{notification.author}</span>{' '}
          <span className="text-text-secondary">{notification.content}</span>
        </p>
        <p className="mt-1 text-[11px] text-text-muted">{notification.timeAgo} · {config.label}</p>
      </div>
      {!notification.read && <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-primary" />}
    </Link>
  );
}

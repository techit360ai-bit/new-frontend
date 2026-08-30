import { X, Bell, CheckCheck, Flame, MessageCircle, Users, ArrowUp, Zap, AtSign, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import type { FeedNotification, FeedNotificationType } from '@/lib/api/notifications';

function NotificationIcon({ type }: { type: FeedNotificationType }) {
  const icons: Record<FeedNotificationType, React.ReactNode> = {
    fire: <Flame className="h-3 w-3" />,
    comment: <MessageCircle className="h-3 w-3" />,
    collab: <Users className="h-3 w-3" />,
    gsis: <ArrowUp className="h-3 w-3" />,
    milestone: <Zap className="h-3 w-3" />,
    mention: <AtSign className="h-3 w-3" />,
    answer: <Star className="h-3 w-3" />,
  };
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-primary/15 text-accent-primary">
      {icons[type]}
    </div>
  );
}

function NotificationItem({
  notification,
  onRead,
  onClose,
}: {
  notification: FeedNotification;
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Link
      to={notification.linkTo}
      onClick={() => {
        onRead(notification.id);
        onClose();
      }}
      className="flex items-start gap-3 border-b border-border-default/40 px-4 py-3 transition-colors hover:bg-surface-secondary"
      style={{ backgroundColor: !notification.read ? 'rgba(79,110,247,0.04)' : undefined }}
    >
      <div className="relative mt-0.5 shrink-0">
        <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${notification.avatar}`} />
        <div className="absolute -bottom-1 -right-1"><NotificationIcon type={notification.type} /></div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug text-text-primary">
          <span className="font-medium">{notification.author}</span>{' '}
          <span className="text-text-secondary">{notification.content}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-text-muted">{notification.timeAgo}</p>
      </div>
      {!notification.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-primary" />}
    </Link>
  );
}

export function NotificationsPanel({
  open,
  onClose,
  notifications,
  loading,
  error,
  onRead,
  onMarkAllRead,
}: {
  open: boolean;
  onClose: () => void;
  notifications: FeedNotification[];
  loading: boolean;
  error: string | null;
  onRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  if (!open) return null;
  const unread = notifications.filter((notification) => !notification.read);
  const read = notifications.filter((notification) => notification.read);

  return createPortal(
    <div className="fixed inset-0 z-[150] flex">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close notifications" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[380px] flex-col border-l border-border-default bg-surface-primary shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border-default px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
            {unread.length > 0 && (
              <span className="rounded-full bg-accent-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unread.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unread.length > 0 && (
              <button type="button" onClick={onMarkAllRead} className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-accent-primary">
                <CheckCheck className="h-3.5 w-3.5" />Mark all read
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="px-4 py-8 text-center text-sm text-text-muted">Loading live notifications...</p>}
          {!loading && error && <p className="px-4 py-8 text-center text-sm text-status-error">{error}</p>}
          {!loading && !error && unread.length > 0 && (
            <>
              <p className="px-4 pb-1.5 pt-3 text-[10px] font-medium uppercase text-text-muted">New · {unread.length}</p>
              {unread.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onRead={onRead} onClose={onClose} />
              ))}
            </>
          )}
          {!loading && !error && read.length > 0 && (
            <>
              <p className="px-4 pb-1.5 pt-4 text-[10px] font-medium uppercase text-text-muted">Earlier</p>
              {read.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} onRead={onRead} onClose={onClose} />
              ))}
            </>
          )}
          {!loading && !error && notifications.length === 0 && (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <Bell className="h-8 w-8 text-text-muted" />
              <p className="text-sm text-text-muted">No live notifications yet</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border-default px-5 py-3 text-right">
          <Link to="/feed/notifications" onClick={onClose} className="text-[11px] font-medium text-accent-primary">
            View all
          </Link>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

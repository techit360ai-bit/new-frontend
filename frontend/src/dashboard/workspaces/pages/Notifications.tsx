import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bell, Check, Code, Filter, GitPullRequest, MessageSquare, Trash2, Users, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  deleteNotification as deleteNotificationApi,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type WorkspaceNotification,
  type WorkspaceNotificationType,
} from '@/lib/api/notifications';

function getIcon(type: WorkspaceNotificationType) {
  switch (type) {
    case 'message':
      return <MessageSquare className="w-5 h-5" />;
    case 'mention':
      return <Users className="w-5 h-5" />;
    case 'pr':
      return <GitPullRequest className="w-5 h-5" />;
    case 'build':
      return <Code className="w-5 h-5" />;
    case 'meeting':
      return <Video className="w-5 h-5" />;
    case 'system':
      return <AlertCircle className="w-5 h-5" />;
  }
}

function getIconColor(type: WorkspaceNotificationType): string {
  switch (type) {
    case 'message':
      return 'bg-blue-500/10 text-blue-500';
    case 'mention':
      return 'bg-purple-500/10 text-purple-500';
    case 'pr':
      return 'bg-green-500/10 text-green-500';
    case 'build':
      return 'bg-orange-500/10 text-orange-500';
    case 'meeting':
      return 'bg-pink-500/10 text-pink-500';
    case 'system':
      return 'bg-gray-500/10 text-gray-500';
  }
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-8 text-center text-slate-900 dark:text-white">
      <Bell className="w-8 h-8 text-slate-400 mx-auto mb-3" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>
    </div>
  );
}

function NotificationCard({
  notification,
  onRead,
  onDelete,
  compact = false,
}: {
  notification: WorkspaceNotification;
  onRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-white dark:bg-[#111111] backdrop-blur-xl border rounded-2xl p-4 transition-all hover:shadow-md text-slate-900 dark:text-white ${
        !notification.read ? 'border-[#20C997]/40 bg-[#20C997]/5 dark:bg-[#20C997]/10' : 'border-black/[0.06] dark:border-white/10'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl ${getIconColor(notification.type)}`}>
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">{notification.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{notification.message}</p>
              <span className="text-xs text-slate-400 dark:text-slate-500">{notification.timestamp}</span>
            </div>
            {!notification.read && !compact && (
              <Badge className="bg-[#20C997] text-slate-950 shrink-0 font-bold">New</Badge>
            )}
          </div>
        </div>
        {!compact && (
          <div className="flex gap-1">
            {!notification.read && onRead && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
                onClick={() => onRead(notification.id)}
                aria-label="Mark notification read"
              >
                <Check className="w-4 h-4 text-[#20C997]" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/10"
                onClick={() => onDelete(notification.id)}
                aria-label="Delete notification"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Notifications() {
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listNotifications()
      .then(setNotifications)
      .catch((err) => {
        setNotifications([]);
        setError(err instanceof Error ? err.message : 'Live notifications are unavailable.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markAsRead = (id: string) => {
    markNotificationRead(id)
      .then((updated) => {
        setNotifications((prev) => prev.map((row) => (row.id === id ? updated : row)));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Notification update failed.'));
  };

  const markEveryNotificationRead = () => {
    markAllNotificationsRead()
      .then(() => setNotifications((prev) => prev.map((row) => ({ ...row, read: true }))))
      .catch((err) => setError(err instanceof Error ? err.message : 'Notification update failed.'));
  };

  const deleteNotification = (id: string) => {
    deleteNotificationApi(id)
      .then(() => {
        setNotifications((prev) => prev.filter((row) => row.id !== id));
        toast.success('Notification deleted');
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Delete failed'));
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications],
  );
  const mentionNotifications = useMemo(
    () => notifications.filter((notification) => notification.type === 'mention'),
    [notifications],
  );
  const pullRequestNotifications = useMemo(
    () => notifications.filter((notification) => notification.type === 'pr'),
    [notifications],
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors">
      <div className="bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#20C997]/10 rounded-xl border border-[#20C997]/20">
              <Bell className="w-6 h-6 text-[#20C997]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Notifications
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markEveryNotificationRead} disabled={loading || notifications.length === 0} className="rounded-xl border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200">
              <Check className="w-4 h-4 mr-2 text-[#20C997]" />
              Mark all as read
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast('Notification filters require persisted preferences.')} className="rounded-xl border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200">
              <Filter className="w-4 h-4 mr-2 text-[#20C997]" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        {loading && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Loading live notifications...</p>}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-4">
            Notifications could not be loaded: {error}
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 bg-slate-100 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 rounded-xl p-1">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="mentions" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">Mentions</TabsTrigger>
            <TabsTrigger value="prs" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">Pull Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
            {!loading && notifications.length === 0 && (
              <EmptyState>No live notifications are recorded yet.</EmptyState>
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-3">
            {unreadNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} onRead={markAsRead} compact />
            ))}
            {!loading && unreadNotifications.length === 0 && (
              <EmptyState>No unread notifications.</EmptyState>
            )}
          </TabsContent>

          <TabsContent value="mentions" className="space-y-3">
            {mentionNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} compact />
            ))}
            {!loading && mentionNotifications.length === 0 && (
              <EmptyState>No live mention notifications are recorded yet.</EmptyState>
            )}
          </TabsContent>

          <TabsContent value="prs" className="space-y-3">
            {pullRequestNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} compact />
            ))}
            {!loading && pullRequestNotifications.length === 0 && (
              <EmptyState>No live pull request notifications are recorded yet.</EmptyState>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

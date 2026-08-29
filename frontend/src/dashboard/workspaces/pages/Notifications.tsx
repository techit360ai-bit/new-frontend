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
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      <Bell className="w-8 h-8 text-gray-400 mx-auto mb-3" />
      <p className="text-sm text-gray-600">{children}</p>
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
      className={`bg-white border rounded-lg p-4 transition-all hover:shadow-md ${
        !notification.read ? 'border-[#2196F3] bg-[#2196F3]/5' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${getIconColor(notification.type)}`}>
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">{notification.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
              <span className="text-xs text-gray-400">{notification.timestamp}</span>
            </div>
            {!notification.read && !compact && (
              <Badge className="bg-[#2196F3] text-white shrink-0">New</Badge>
            )}
          </div>
        </div>
        {!compact && (
          <div className="flex gap-1">
            {!notification.read && onRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRead(notification.id)}
                aria-label="Mark notification read"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
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
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2196F3]/10 rounded-lg">
              <Bell className="w-6 h-6 text-[#2196F3]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Notifications
              </h1>
              <p className="text-sm text-gray-500">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={markEveryNotificationRead} disabled={loading || notifications.length === 0}>
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast('Notification filters require persisted preferences.')}>
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        {loading && <p className="text-sm text-gray-500 mb-4">Loading live notifications...</p>}
        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
            Notifications could not be loaded: {error}
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
            <TabsTrigger value="prs">Pull Requests</TabsTrigger>
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

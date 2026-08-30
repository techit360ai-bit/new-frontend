import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Globe, Users, FileText, HelpCircle, Compass, Ticket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { roleSafeReturnPath } from '@/lib/roleRoutes';
import {
  listFeedNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type FeedNotification,
} from '@/lib/api/notifications';
import { NotificationsPanel } from './NotificationsPanel';
import { useMobileChromeVisibility } from '@/components/mobile/useMobileChromeVisibility';

export function Layout({ children }: { children: ReactNode }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
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
    const notification = notifications.find((row) => row.id === id);
    if (!notification || notification.read) return;
    markNotificationRead(id)
      .then(() => setNotifications((current) => current.map((row) => (
        row.id === id ? { ...row, read: true } : row
      ))))
      .catch((err) => setError(err instanceof Error ? err.message : 'Notification update failed.'));
  };

  const markAllRead = () => {
    markAllNotificationsRead()
      .then(() => setNotifications((current) => current.map((row) => ({ ...row, read: true }))))
      .catch((err) => setError(err instanceof Error ? err.message : 'Notification update failed.'));
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <GlobalNav
        unreadCount={notifications.filter((notification) => !notification.read).length}
        onNotifClick={() => setNotifOpen(true)}
      />
      {children}
      <MobileTabBar />
      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        loading={loading}
        error={error}
        onRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </div>
  );
}

function GlobalNav({ unreadCount, onNotifClick }: { unreadCount: number; onNotifClick: () => void }) {
  const location = useLocation();
  const chromeVisible = useMobileChromeVisibility();
  const { profile } = useAuth();
  const dashboardPath = roleSafeReturnPath({
    currentPath: location.pathname,
    profileRole: profile?.role ?? null,
    secondaryRoles: profile?.secondaryRoles ?? null,
  });
  const name = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
    || profile?.username
    || profile?.email
    || 'User';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

  return (
    <nav className={`sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border-default bg-surface-primary px-4 sm:px-8 transition-transform duration-200 ${chromeVisible ? '' : '-translate-y-full pointer-events-none'}`}>
      <div className="flex items-center gap-8">
        <Link to="/feed" className="text-[16px] font-bold text-text-primary">
          TECH<span className="text-accent-primary">•</span>IT
        </Link>
        <div className="hidden items-center gap-6 text-[14px] font-medium lg:flex">
          <NavLink to={dashboardPath} label="Dashboard" />
          <NavLink to="/feed" label="Hangout" active={location.pathname === '/feed'} />
          <NavLink to="/feed/discover" label="Discover" />
          <NavLink to="/workspaces" label="Workspace" />
          <NavLink to="/wallet" label="Wallet" />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <Link to="/support" className="rounded-lg p-1.5 hover:bg-surface-secondary" aria-label="Open support tickets"><Ticket className="h-5 w-5 text-text-secondary hover:text-text-primary" /></Link>
        <button type="button" onClick={onNotifClick} className="group relative rounded-lg p-1.5 hover:bg-surface-secondary" aria-label="Open notifications">
          <Bell className="h-5 w-5 text-text-secondary group-hover:text-text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-primary px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <Link to="/feed/profile/me" aria-label="Open profile" className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent-primary text-xs font-semibold text-white">
          {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
        </Link>
      </div>
    </nav>
  );
}

function NavLink({ to, label, active }: { to: string; label: string; active?: boolean }) {
  const location = useLocation();
  const isActive = active ?? location.pathname === to;
  return (
    <Link to={to} className={`relative pb-1 ${isActive ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}>
      {label}
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary" />}
    </Link>
  );
}

function MobileTabBar() {
  const location = useLocation();
  const chromeVisible = useMobileChromeVisibility();
  const tabs = [
    { id: 'feed', path: '/feed', icon: Globe, label: 'Feed' },
    { id: 'tribe', path: '/feed/tribe', icon: Users, label: 'Tribe' },
    { id: 'builds', path: '/feed/build-log', icon: FileText, label: 'Builds' },
    { id: 'qa', path: '/feed/questions', icon: HelpCircle, label: 'Q&A' },
    { id: 'discover', path: '/feed/discover', icon: Compass, label: 'Discover' },
  ];
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-border-default bg-surface-primary transition-transform duration-200 lg:hidden ${chromeVisible ? '' : 'translate-y-full pointer-events-none'}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <Link key={tab.id} to={tab.path} className="flex h-full flex-1 flex-col items-center justify-center gap-0.5">
            <Icon className={`h-5 w-5 ${isActive ? 'text-accent-primary' : 'text-text-muted'}`} />
            {isActive && <span className="text-[10px] font-medium text-accent-primary">{tab.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}

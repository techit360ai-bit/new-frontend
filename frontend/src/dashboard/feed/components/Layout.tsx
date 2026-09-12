import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Globe, Users, FileText, HelpCircle, Compass, Ticket, Sun, Moon, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { roleSafeReturnPath } from "@/lib/roleRoutes";
import {
  listFeedNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type FeedNotification,
} from "@/lib/api/notifications";
import { NotificationsPanel } from "./NotificationsPanel";
import { useMobileChromeVisibility } from "@/components/mobile/useMobileChromeVisibility";
import TechITLogo from "@/components/ui/TechITLogo";
import { Havi } from "@/dashboard/_shared/havi/Havi";

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [haviOpen, setHaviOpen] = useState(false);
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("techit-theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("techit-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("techit-theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    let alive = true;
    listFeedNotifications()
      .then((rows) => { if (alive) setNotifications(rows); })
      .catch((err) => {
        if (!alive) return;
        setNotifications([]);
        setError(err instanceof Error ? err.message : "Live notifications are unavailable.");
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
      .catch((err) => setError(err instanceof Error ? err.message : "Notification update failed."));
  };

  const markAllRead = () => {
    markAllNotificationsRead()
      .then(() => setNotifications((current) => current.map((row) => ({ ...row, read: true }))))
      .catch((err) => setError(err instanceof Error ? err.message : "Notification update failed."));
  };

  return (
    <div className={`min-h-screen font-bricolage transition-colors duration-300 ${isDark ? "dark bg-[#121212] text-white" : "bg-slate-50 text-slate-900"}`}>
      <GlobalNav
        isDark={isDark}
        onToggleTheme={() => setIsDark((v) => !v)}
        unreadCount={notifications.filter((notification) => !notification.read).length}
        onNotifClick={() => setNotifOpen(true)}
        onOpenHavi={() => setHaviOpen(true)}
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
      <Havi
        role="founder"
        route={location.pathname}
      />
    </div>
  );
}

function GlobalNav({
  isDark,
  onToggleTheme,
  unreadCount,
  onNotifClick,
  onOpenHavi,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  unreadCount: number;
  onNotifClick: () => void;
  onOpenHavi: () => void;
}) {
  const location = useLocation();
  const chromeVisible = useMobileChromeVisibility();
  const { profile } = useAuth();

  const dashboardPath = roleSafeReturnPath({
    currentPath: location.pathname,
    profileRole: profile?.role ?? null,
    secondaryRoles: profile?.secondaryRoles ?? null,
  });

  const name = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
    || profile?.username
    || profile?.email
    || "User";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return (
    <nav className={`sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 px-4 sm:px-8 backdrop-blur-xl transition-all duration-200 ${chromeVisible ? "" : "-translate-y-full pointer-events-none"}`}>
      <div className="flex items-center gap-8">
        <Link to="/feed" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-transparent">
            <TechITLogo />
          </div>
          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
            TECH<span className="text-[#0066ff] dark:text-[#58a6ff]">•</span>IT <span className="text-xs font-semibold text-slate-400 font-sans ml-1">Hangout</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 text-xs font-bold lg:flex">
          <NavLink to={dashboardPath} label="Dashboard" />
          <NavLink to="/feed" label="Hangout" active={location.pathname === "/feed"} />
          <NavLink to="/feed/discover" label="Discover" />
          <NavLink to="/workspaces" label="Workspace" />
          <NavLink to="/wallet" label="Wallet" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        <Link
          to="/support"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
          title="Customer Support & Tickets"
        >
          <Ticket className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={onNotifClick}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0066ff] px-1 text-[9px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <Link
          to="/feed/profile/me"
          title="View profile"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-xs font-black text-white shadow-md border border-transparent hover:border-white/20 transition-all"
        >
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
    <Link
      to={to}
      className={`relative py-1 transition-colors ${
        isActive ? "text-[#0066ff] dark:text-[#58a6ff] font-bold" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {label}
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#0066ff] dark:bg-[#58a6ff]" />}
    </Link>
  );
}

function MobileTabBar() {
  const location = useLocation();
  const chromeVisible = useMobileChromeVisibility();
  const tabs = [
    { id: "feed", path: "/feed", icon: Globe, label: "Feed" },
    { id: "tribe", path: "/feed/tribe", icon: Users, label: "Tribe" },
    { id: "builds", path: "/feed/build-log", icon: FileText, label: "Builds" },
    { id: "qa", path: "/feed/questions", icon: HelpCircle, label: "Q&A" },
    { id: "discover", path: "/feed/discover", icon: Compass, label: "Discover" },
  ];
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 flex h-14 items-center justify-around border-t border-black/[0.06] dark:border-white/10 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-xl transition-transform duration-200 lg:hidden ${chromeVisible ? "" : "translate-y-full pointer-events-none"}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <Link key={tab.id} to={tab.path} className="flex h-full flex-1 flex-col items-center justify-center gap-0.5">
            <Icon className={`h-4 w-4 ${isActive ? "text-[#0066ff] dark:text-[#58a6ff]" : "text-slate-400 dark:text-white/40"}`} />
            {isActive && <span className="text-[10px] font-bold text-[#0066ff] dark:text-[#58a6ff]">{tab.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}

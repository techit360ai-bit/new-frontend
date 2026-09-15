import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass, Search, Building2, FolderKanban, Sparkles, CalendarDays, Rss,
  Bot, UserCircle, Settings as SettingsIcon, Ticket, ChevronDown, PanelLeftClose, PanelLeftOpen,
  Menu, X
} from "lucide-react";
import TechITLogo from "@/components/ui/TechITLogo";
import { Toaster } from "@/components/ui/sonner";
import { Havi } from "@/dashboard/_shared/havi/Havi";
import { ExplorerTopBar } from "./ExplorerTopBar";

type NavItem = {
  label: string;
  path: string;
  icon: any;
  kind?: "link" | "external";
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Explore Hub",
    items: [
      { label: "Dashboard", path: "/explore", icon: Compass },
      { label: "Discover", path: "/explore/discover", icon: Search },
      { label: "Startups", path: "/explore/startups", icon: Building2 },
      { label: "Build Projects", path: "/explore/projects", icon: FolderKanban },
    ]
  },
  {
    label: "Opportunities & Ecosystem",
    items: [
      { label: "Opportunities", path: "/explore/opportunities", icon: Sparkles },
      { label: "Events & Hackathons", path: "/explore/events", icon: CalendarDays },
      { label: "Ecosystem Feed", path: "/feed", icon: Rss, kind: "external" },
      { label: "AI Ecosystem Guide", path: "/explore/ai-guide", icon: Bot },
    ]
  },
  {
    label: "Account & Support",
    items: [
      { label: "My Profile", path: "/explore/profile", icon: UserCircle },
      { label: "Settings", path: "/explore/settings", icon: SettingsIcon },
      { label: "Support & Care", path: "/support", icon: Ticket, kind: "external" },
    ]
  }
];

interface ExplorerLayoutProps {
  children?: React.ReactNode;
}

export function ExplorerLayout({ children }: ExplorerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [haviOpen, setHaviOpen] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Explore Hub": true,
    "Opportunities & Ecosystem": true,
    "Account & Support": true,
  });

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

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path: string) => {
    if (path === "/explore") {
      return location.pathname === "/explore" || location.pathname === "/explore/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`min-h-screen font-bricolage transition-colors duration-300 ${isDark ? "dark bg-[#0a0a0a] text-white" : "bg-slate-50 text-slate-900"}`}>
      <Toaster position="top-right" theme={isDark ? "dark" : "light"} />

      {/* Main Shell Layout */}
      <div className="flex min-h-screen">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden lg:flex flex-col border-r border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-xl transition-all duration-300 z-20 sticky top-0 h-screen ${
            sidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Sidebar Header / Brand */}
          <div className={`flex items-center border-b border-black/[0.06] dark:border-white/10 transition-all duration-300 ${
            sidebarCollapsed ? "flex-col justify-center py-3 gap-2 px-2" : "h-16 justify-between px-4"
          }`}>
            <Link to="/explore" className="flex items-center gap-3 overflow-hidden group">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl p-1.5 backdrop-blur-md border transition-all shrink-0 ${
                isDark
                  ? "bg-white/[0.05] border-white/10 shadow-[0_0_12px_rgba(32,201,151,0.15)] group-hover:border-[#20C997]/40"
                  : "bg-white/80 border-black/[0.08] shadow-sm group-hover:border-[#20C997]/40"
              }`}>
                <TechITLogo />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">TechIT</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#20C997]">Explorer</span>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-white/40 transition-colors shrink-0"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
            {NAV_GROUPS.map((group, groupIdx) => (
              <div key={group.label} className="space-y-1">
                {!sidebarCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.label)}
                    className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60"
                  >
                    <span>{group.label}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${expandedGroups[group.label] ? "" : "-rotate-90"}`} />
                  </button>
                ) : groupIdx > 0 ? (
                  <div className="py-1 flex justify-center">
                    <div className="w-5 h-[1px] bg-slate-200 dark:bg-white/10" />
                  </div>
                ) : null}

                {(sidebarCollapsed || expandedGroups[group.label]) &&
                  group.items.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all group ${
                          sidebarCollapsed ? "justify-center px-0" : ""
                        } ${
                          active
                            ? "bg-[#20C997]/10 text-[#20C997] font-bold"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                        }`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        {/* Active Indicator Bar */}
                        {active && !sidebarCollapsed && (
                          <motion.div
                            layoutId="activeSideBarBar"
                            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#20C997]"
                          />
                        )}

                        <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-[#20C997]" : "text-slate-400 group-hover:text-slate-700 dark:text-white/40 dark:group-hover:text-white"}`} />

                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer Card */}
          <div className="p-3 border-t border-black/[0.06] dark:border-white/10">
            {!sidebarCollapsed ? (
              <div className="rounded-xl border border-black/[0.06] bg-slate-100/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white">Ready to Build?</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Activate Founder or Collaborator mode to post projects or accept gigs.</p>
                <button
                  type="button"
                  onClick={() => navigate("/explore/settings")}
                  className="mt-2.5 w-full rounded-lg bg-[#20C997] hover:bg-[#1db587] py-1.5 text-center text-[10px] font-bold text-slate-950 shadow-sm transition-all"
                >
                  Explore Modes
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/explore/settings")}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] bg-slate-100/70 text-slate-600 hover:bg-[#20C997]/10 hover:text-[#20C997] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/10 transition-colors mx-auto"
                title="Explore Modes & Settings"
              >
                <Sparkles className="h-4 w-4 text-[#20C997]" />
              </button>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <ExplorerTopBar
            isDark={isDark}
            onToggleTheme={() => setIsDark((v) => !v)}
            onOpenHavi={() => setHaviOpen(true)}
          />

          {/* Main Content Page Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* Embedded Havi Side Popup */}
      <Havi
        role="explorer"
        userName="Explorer"
        route={location.pathname}
      />
    </div>
  );
}

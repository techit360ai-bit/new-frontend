import { useEffect, useMemo, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, CheckSquare, TrendingUp, DollarSign, PieChart,
  Sparkles, Award, MessageSquare, Wrench, Rss, GraduationCap,
  UserCircle, Settings as SettingsIcon, ShieldCheck, Ticket,
  ChevronDown, PanelLeftClose, PanelLeftOpen, LogOut,
  Menu, Search, Bell, Sun, Moon, X,
} from "lucide-react";
import TechITLogo from "@/components/ui/TechITLogo";
import { Toaster } from "@/components/ui/sonner";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { Havi } from "@/dashboard/_shared/havi/Havi";
import { writeStoredActiveRole } from "@/lib/roleRoutes";
import { TopBarRoleMenu } from "./TopBarRoleMenu";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";

type NavItem = {
  label: string;
  path?: string;
  icon?: any;
  kind?: "link" | "external" | "placeholder";
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", path: "/collaborator/dashboard", icon: LayoutDashboard },
      { label: "Tasks", path: "/collaborator/tasks", icon: CheckSquare },
      { label: "Performance", path: "/collaborator/performance", icon: TrendingUp },
      { label: "Earnings", path: "/collaborator/earnings", icon: DollarSign },
      { label: "Equity Ledger", path: "/collaborator/equity", icon: PieChart },
      { label: "Opportunities", path: "/collaborator/opportunities", icon: Sparkles },
    ]
  },
  {
    label: "Network & Growth",
    items: [
      { label: "Messages", path: "/collaborator/messages", icon: MessageSquare },
      { label: "Reputation", path: "/collaborator/reputation", icon: Award },
      { label: "Feed", path: "/feed", icon: Rss, kind: "external" },
      { label: "Academy", path: "/collaborator/academy", icon: GraduationCap },
      { label: "Tools", path: "/collaborator/tools", icon: Wrench },
    ]
  },
  {
    label: "Account",
    items: [
      { label: "Profile", path: "/collaborator/profile", icon: UserCircle },
      { label: "Settings", path: "/collaborator/settings", icon: SettingsIcon },
      { label: "Privacy & Compliance", path: "/compliance", icon: ShieldCheck },
      { label: "Support", path: "/support", icon: Ticket, kind: "external" },
    ]
  }
];

export function CollabLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collaboratorProfile } = useCollaboratorProfile();
  const { profile, signOut } = useAuth();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Workspace": true,
    "Network & Growth": true,
    "Account": true,
  });

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("techit-theme");
      if (saved) return saved === "dark";
      return document.documentElement.classList.contains("dark");
    }
    return false;
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
    writeStoredActiveRole("collaborator");
  }, []);

  const isActive = (path?: string) => path ? location.pathname === path : false;
  const displayName = collaboratorProfile.name || "Collaborator";
  const initials = displayName.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  const disciplineLabel = collaboratorProfile.discipline || "Contributor";
  const activeLabel = NAV_GROUPS.flatMap(g => g.items).find(n => isActive(n.path))?.label ?? "Dashboard";

  const toggleGroup = (groupLabel: string) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setExpandedGroups(prev => ({ ...prev, [groupLabel]: true }));
      return;
    }
    setExpandedGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  const haviContext = useMemo(() => ({
    discipline: collaboratorProfile.discipline,
    subSkills: collaboratorProfile.subSkills,
    techStack: collaboratorProfile.techStack,
    weeklyHours: collaboratorProfile.weeklyHours,
    timezone: collaboratorProfile.timezone,
    earliestStart: collaboratorProfile.earliestStart,
    commitmentStyle: collaboratorProfile.commitmentStyle,
    equityPreference: collaboratorProfile.equityPreference,
    minCashFloor: collaboratorProfile.minCashFloor,
    goals: collaboratorProfile.whyHere,
    pinnedWorkCount: collaboratorProfile.pinnedWork.length,
  }), [collaboratorProfile]);

  return (
    <div className={`flex h-screen w-full p-[5px] overflow-hidden font-bricolage transition-colors duration-300 ${isDark ? "bg-[#0a0a0a] dark" : "bg-[#f5f8ff]"}`}>
      <div className={`flex w-full h-full rounded-xl p-[5px] relative overflow-hidden transition-all duration-300 ${
        isDark 
          ? "bg-[#121212] border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]" 
          : "bg-white border border-black/[0.06] shadow-sm"
      }`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: isDark ? [0.25, 0.45, 0.25] : [0.4, 0.7, 0.4], x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full blur-[120px] ${isDark ? "bg-[#0066ff]/20" : "bg-[#0066ff]/[0.04]"}`}
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: isDark ? [0.2, 0.4, 0.2] : [0.3, 0.6, 0.3], x: [0, -50, 0], y: [0, 60, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className={`absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-[120px] ${isDark ? "bg-[#58a6ff]/20" : "bg-[#58a6ff]/[0.04]"}`}
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: isDark ? [0.15, 0.35, 0.15] : [0.3, 0.5, 0.3], x: [0, 40, 0], y: [0, -40, 0] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 10 }}
            className={`absolute top-1/4 left-1/3 w-[50%] h-[50%] rounded-full blur-[120px] ${isDark ? "bg-[#20c937]/15" : "bg-[#20c937]/[0.03]"}`}
          />
        </div>

        <aside
          onMouseLeave={() => setProfileMenuOpen(false)}
          className={`relative flex flex-col h-full rounded-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-visible shrink-0 z-10 ${
            isDark 
              ? "bg-[#121212] border border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,102,255,0.06)]" 
              : "bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(23,19,48,0.08)]"
          } ${
            sidebarCollapsed ? "w-[76px]" : "w-64"
          } hidden lg:flex`}
        >
          <div className={`flex items-center p-4 mb-2 ${sidebarCollapsed ? "flex-col justify-center gap-4" : "justify-between"}`}>
            {!sidebarCollapsed && (
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1.5 shadow-sm border transition-colors ${
                    isDark ? "bg-[#1a1a1a] border-white/10 shadow-[0_0_12px_rgba(0,102,255,0.15)]" : "bg-white border-black/[0.06]"
                  }`}>
                    <TechITLogo />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className={`font-black tracking-tight leading-none text-[15px] transition-colors ${
                    isDark ? "text-white group-hover:text-[#58a6ff]" : "text-[#171330] group-hover:text-[#0066ff]"
                  }`}>TechIT Network</span>
                  <span className={`font-bold text-[10px] tracking-wider uppercase mt-1 ${
                    isDark ? "text-[#58a6ff]/70" : "text-[#171330]/40"
                  }`}>Collaborator</span>
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#0066ff] to-[#58a6ff] relative shadow-[0_4px_12px_rgba(0,102,255,0.35)] shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1.5 shadow-sm border transition-colors ${
                  isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/[0.06]"
                }`}>
                  <TechITLogo />
                </div>
              </Link>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-9 h-9 shrink-0 rounded-lg border transition-colors flex justify-center items-center ${
                isDark 
                  ? "bg-white/[0.05] border-white/10 text-white/70 hover:bg-[#0066ff]/20 hover:text-[#58a6ff] hover:border-[#0066ff]/30 shadow-[0_0_10px_rgba(0,102,255,0.1)]" 
                  : "bg-[#f5f8ff] border-black/[0.06] text-[#171330]/40 hover:bg-[#0066ff]/10 hover:text-[#0066ff] hover:border-[#0066ff]/20"
              }`}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                {!sidebarCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-2 mb-1.5 group/btn"
                  >
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                      isDark ? "text-white/40 group-hover/btn:text-white/80" : "text-[#171330]/35 group-hover/btn:text-[#171330]/70"
                    }`}>
                      {group.label}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${
                        isDark ? "text-white/30" : "text-[#171330]/25"
                      } ${
                        expandedGroups[group.label] ? (isDark ? "rotate-180 text-[#58a6ff]" : "rotate-180 text-[#0066ff]") : ""
                      }`}
                    />
                  </button>
                ) : (
                  <button onClick={() => toggleGroup(group.label)} className="w-full flex justify-center mb-3">
                    <span className={`w-4 h-[1px] ${isDark ? "bg-white/10" : "bg-[#171330]/10"}`} />
                  </button>
                )}

                <AnimatePresence initial={false}>
                  {(expandedGroups[group.label] || sidebarCollapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="space-y-1 overflow-hidden"
                    >
                      {group.items.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.label}
                            to={item.path ?? "#"}
                            title={sidebarCollapsed ? item.label : undefined}
                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group/nav ${
                              active
                                ? (isDark ? "text-[#58a6ff]" : "text-[#0066ff]")
                                : (isDark ? "text-white/60 hover:bg-white/[0.05] hover:text-white" : "text-[#171330]/55 hover:bg-black/[0.03] hover:text-[#171330]")
                            } ${sidebarCollapsed ? "justify-center" : ""}`}
                          >
                            {active && (
                              <motion.div
                                layoutId="activeNavBgCollab"
                                className={`absolute inset-0 rounded-xl ${
                                  isDark 
                                    ? "bg-gradient-to-r from-[#0066ff]/25 to-[#58a6ff]/[0.06] border border-[#0066ff]/40 shadow-[0_0_15px_rgba(0,102,255,0.2)]" 
                                    : "bg-gradient-to-r from-[#0066ff]/[0.08] to-transparent border border-[#0066ff]/20"
                                }`}
                                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                              />
                            )}
                            {active && !sidebarCollapsed && (
                              <motion.div
                                layoutId="activeNavIndicatorCollab"
                                className={`absolute left-[-4px] top-2 bottom-2 w-[3px] rounded-r-full ${
                                  isDark 
                                    ? "bg-[#58a6ff] shadow-[0_0_12px_rgba(88,166,255,0.7)]" 
                                    : "bg-[#0066ff] shadow-[0_0_10px_rgba(0,102,255,0.4)]"
                                }`}
                                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                              />
                            )}
                            <item.icon className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-colors ${
                              active 
                                ? (isDark ? "text-[#58a6ff]" : "text-[#0066ff]") 
                                : (isDark ? "text-white/50 group-hover/nav:text-[#58a6ff]" : "text-[#171330]/40 group-hover/nav:text-[#0066ff]")
                            }`} />
                            {!sidebarCollapsed && (
                              <span className={`relative z-10 font-bold text-sm truncate ${
                                active ? (isDark ? "text-[#58a6ff]" : "text-[#0066ff]") : ""
                              }`}>
                                {item.label}
                              </span>
                            )}
                            {active && !sidebarCollapsed && (
                              <span className={`relative z-10 ml-auto w-1.5 h-1.5 rounded-full ${
                                isDark ? "bg-[#58a6ff] shadow-[0_0_8px_rgba(88,166,255,0.8)]" : "bg-[#0066ff]"
                              }`} />
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          <div className={`p-3 mt-auto border-t relative ${isDark ? "border-white/[0.08]" : "border-black/[0.05]"}`}>
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                isDark 
                  ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5)]" 
                  : "bg-[#f5f8ff] hover:bg-[#eef3ff] border-black/[0.04]"
              } ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(0,102,255,0.35)]">
                {initials}
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#20c937] border-2 ${isDark ? "border-[#121212]" : "border-[#f5f8ff]"}`} />
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className={`text-[13px] font-bold truncate leading-tight ${isDark ? "text-white" : "text-[#171330]"}`}>{displayName}</p>
                    <p className={`text-[11px] truncate font-medium ${isDark ? "text-white/50" : "text-[#171330]/45"}`}>{disciplineLabel}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isDark ? "text-white/40" : "text-[#171330]/30"} ${profileMenuOpen ? "rotate-180" : ""}`} />
                </>
              )}
            </button>

            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute bottom-full mb-2 ${sidebarCollapsed ? "left-full ml-2 w-56" : "left-3 right-3"} rounded-xl border p-1.5 z-30 ${
                    isDark 
                      ? "bg-[#181818] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_15px_rgba(0,102,255,0.1)]" 
                      : "bg-white border-black/[0.06] shadow-[0_20px_50px_-10px_rgba(23,19,48,0.25)]"
                  }`}
                >
                  <Link
                    to="/collaborator/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isDark ? "text-white/80 hover:bg-white/[0.06] hover:text-[#58a6ff]" : "text-[#171330]/75 hover:bg-[#f5f8ff] hover:text-[#0066ff]"
                    }`}
                  >
                    <UserCircle className="w-4 h-4" /> View profile
                  </Link>
                  <Link
                    to="/collaborator/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isDark ? "text-white/80 hover:bg-white/[0.06] hover:text-[#58a6ff]" : "text-[#171330]/75 hover:bg-[#f5f8ff] hover:text-[#0066ff]"
                    }`}
                  >
                    <SettingsIcon className="w-4 h-4" /> Settings
                  </Link>
                  <div className={`h-px my-1 ${isDark ? "bg-white/[0.08]" : "bg-black/[0.05]"}`} />
                  <button
                    onClick={() => { setProfileMenuOpen(false); signOut(); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 transition-colors ${
                      isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
                    }`}
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        <div className="hidden lg:block w-[5px] shrink-0 rounded-md bg-gradient-to-b from-[#0066ff]/80 via-[#58a6ff]/40 to-[#20c937]/60 shadow-[0_0_15px_rgba(0,102,255,0.3)] z-10 my-[2px] mx-[2px]" />

        <main className={`flex-1 rounded-md overflow-hidden flex flex-col relative z-20 transition-all duration-300 ${
          isDark 
            ? "bg-[#0d0d0d] shadow-[0_25px_70px_rgba(0,0,0,0.95)]" 
            : "bg-[#f5f8ff] shadow-2xl"
        }`}>
          <header className={`flex min-h-[64px] items-center justify-between gap-4 border-b px-4 lg:px-6 z-20 sticky top-0 rounded-t-md transition-all duration-300 ${
            isDark 
              ? "bg-[#121212] border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.6)]" 
              : "bg-white border-black/[0.06]"
          }`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-300 shrink-0 overflow-hidden group ${
                  isDark 
                    ? "bg-[#0066ff]/15 border-[#0066ff]/30 text-[#58a6ff] shadow-[0_0_15px_rgba(0,102,255,0.2)]" 
                    : "bg-gradient-to-br from-[#0066ff]/5 to-[#58a6ff]/10 border-[#0066ff]/10 text-[#0066ff] shadow-[0_4px_16px_rgba(0,102,255,0.08)]"
                }`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDark ? "bg-[#0066ff]/20" : "bg-white/40"}`} />
                <PanelLeftOpen className="w-[18px] h-[18px] relative z-10" />
              </button>

              <h2 className={`text-base font-bold hidden lg:block shrink-0 mr-2 ${isDark ? "text-[#58a6ff]" : "text-[#0066ff]"}`}>
                {activeLabel}
              </h2>

              <div className={`hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border w-full max-w-xs transition-all ${
                isDark 
                  ? "bg-white/[0.05] border-white/10 text-white hover:border-[#58a6ff]/30 focus-within:border-[#58a6ff]/50 focus-within:ring-4 focus-within:ring-[#58a6ff]/15" 
                  : "bg-[#f5f8ff] border-black/[0.05] text-[#171330]/40 hover:border-[#0066ff]/25 focus-within:border-[#0066ff]/40 focus-within:ring-4 focus-within:ring-[#0066ff]/10"
              }`}>
                <Search className={`w-4 h-4 shrink-0 ${isDark ? "text-white/40" : "text-[#171330]/40"}`} />
                <input
                  type="text"
                  placeholder="Search tasks, equity, tools..."
                  className={`bg-transparent outline-none text-sm w-full ${
                    isDark ? "placeholder:text-white/35 text-white" : "placeholder:text-[#171330]/35 text-[#171330]"
                  }`}
                />
                <kbd className={`hidden md:inline text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0 border ${
                  isDark ? "bg-white/10 text-white/50 border-white/10" : "bg-white text-[#171330]/35 border-black/[0.06]"
                }`}>
                  ⌘K
                </kbd>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsDark((v) => !v)}
                className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors overflow-hidden ${
                  isDark 
                    ? "bg-white/[0.05] border-white/10 text-[#58a6ff] hover:bg-[#0066ff]/20 hover:border-[#0066ff]/40 shadow-[0_0_12px_rgba(0,102,255,0.2)]" 
                    : "bg-[#f5f8ff] border-black/[0.05] text-[#171330]/60 hover:text-[#0066ff] hover:border-[#0066ff]/25"
                }`}
                title="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isDark ? "moon" : "sun"}
                    initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </motion.span>
                </AnimatePresence>
              </button>

              <div className="relative">
                <button
                  onClick={() => { setNotifOpen((v) => !v); setProfileMenuOpen(false); }}
                  className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                    isDark 
                      ? "bg-white/[0.05] border-white/10 text-white/70 hover:bg-white/[0.08]" 
                      : "bg-[#f5f8ff] border-black/[0.05] text-[#171330]/60 hover:bg-[#eef3ff]"
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0066ff] ring-2 ring-white dark:ring-[#121212]" />
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className={`absolute right-0 mt-2 w-80 rounded-2xl border p-4 z-50 ${
                        isDark 
                          ? "bg-[#181818] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-white" 
                          : "bg-white border-black/[0.06] shadow-[0_20px_50px_-10px_rgba(23,19,48,0.25)] text-[#171330]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/[0.05] dark:border-white/[0.08]">
                        <h4 className="font-bold text-sm">Notifications</h4>
                        <span className="text-[10px] font-bold text-[#0066ff] dark:text-[#58a6ff] bg-[#0066ff]/10 dark:bg-[#0066ff]/20 px-2 py-0.5 rounded-full">
                          2 new
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className={`p-2.5 rounded-xl border transition-colors ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-[#f5f8ff] border-black/[0.04]"}`}>
                          <p className="font-bold">New task assigned in sprint</p>
                          <p className={`text-[11px] mt-0.5 ${isDark ? "text-white/50" : "text-[#171330]/50"}`}>AI connector integration task is now open.</p>
                        </div>
                        <div className={`p-2.5 rounded-xl border transition-colors ${isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-[#f5f8ff] border-black/[0.04]"}`}>
                          <p className="font-bold">Equity grant scheduled</p>
                          <p className={`text-[11px] mt-0.5 ${isDark ? "text-white/50" : "text-[#171330]/50"}`}>Next vesting milestone arrives this month.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <TopBarRoleMenu isDark={isDark} />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ProfileCompletionBanner role="collaborator" profilePath="/collaborator/profile" />
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className={`fixed top-0 left-0 bottom-0 w-[280px] z-[100] flex flex-col border-r transition-colors ${
                isDark 
                  ? "bg-[#121212] border-white/10 shadow-[25px_0_60px_rgba(0,0,0,0.9)] text-white" 
                  : "bg-white border-black/[0.06] text-[#171330]"
              }`}
            >
              <div className={`flex items-center justify-between p-4 border-b ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-black/[0.06] bg-gradient-to-r from-transparent to-[#0066ff]/[0.02]"
              }`}>
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1.5 shadow-sm shrink-0 border ${
                    isDark ? "bg-[#1a1a1a] border-white/10 shadow-[0_0_10px_rgba(0,102,255,0.2)]" : "bg-white border-[#0066ff]/10"
                  }`}>
                    <TechITLogo />
                  </div>
                  <span className={`font-medium text-sm tracking-tight whitespace-nowrap truncate ${
                    isDark ? "text-[#58a6ff]" : "text-[#0066ff]"
                  }`}>TechIT Network</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className={`w-8 h-8 flex items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-300 shrink-0 ${
                    isDark 
                      ? "bg-[#0066ff]/15 border-[#0066ff]/30 text-[#58a6ff] shadow-[0_0_15px_rgba(0,102,255,0.2)] hover:bg-[#0066ff]/25" 
                      : "bg-gradient-to-br from-[#0066ff]/5 to-[#58a6ff]/10 border-[#0066ff]/10 shadow-[0_2px_10px_rgba(0,102,255,0.05)] text-[#0066ff] hover:from-[#0066ff]/10 hover:to-[#58a6ff]/20"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 px-2 ${
                      isDark ? "text-white/40" : "text-[#171330]/35"
                    }`}>
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.label}
                            to={item.path ?? "#"}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                              active
                                ? (isDark 
                                    ? "bg-[#0066ff]/20 border border-[#0066ff]/40 text-[#58a6ff] shadow-[0_0_15px_rgba(0,102,255,0.2)]" 
                                    : "bg-gradient-to-r from-[#0066ff]/[0.08] to-transparent border border-[#0066ff]/20 text-[#0066ff]")
                                : (isDark 
                                    ? "text-white/60 hover:bg-white/[0.06] hover:text-white" 
                                    : "text-[#171330]/60 hover:bg-[#f5f8ff] hover:text-[#171330]")
                            }`}
                          >
                            {item.icon && <item.icon className="w-[18px] h-[18px]" />}
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-4 border-t ${isDark ? "border-white/10" : "border-black/[0.06]"}`}>
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut(); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 transition-colors ${
                    isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
                  }`}
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Havi
        role="collaborator"
        userName={collaboratorProfile.name?.split(" ")[0] || "Collaborator"}
        route={location.pathname}
        profileContext={haviContext}
      />
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Users, FolderKanban, GraduationCap, UserSearch, Brain,
  BarChart3, ShoppingBag, Rocket, MessageSquare, Plug, CreditCard,
  Settings as SettingsIcon, Trophy, Gauge, Rss, UserCircle, LogOut,
  ChevronDown, PanelLeftClose, PanelLeftOpen, Scale, Ticket, Bell, Sun, Moon,
  Search, Check
} from "lucide-react";
import TechITLogo from "@/components/ui/TechITLogo";
import { useOrgProfile, useActiveRoles, type Role } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath, roleOnboardingPath, writeStoredActiveRole } from "@/lib/roleRoutes";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";
import { RoleMobileMenu } from "@/components/RoleMobileMenu";

type NavItem = {
  label: string;
  path: string;
  icon: any;
  external?: boolean;
  comingSoon?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Management & Intelligence",
    items: [
      { label: "Dashboard", path: "/org/dashboard", icon: LayoutDashboard },
      { label: "Intelligence", path: "/org/intelligence", icon: Gauge },
      { label: "Analytics", path: "/org/analytics", icon: BarChart3 },
      { label: "Teams", path: "/org/teams", icon: Users },
      { label: "Projects", path: "/org/projects", icon: FolderKanban },
    ],
  },
  {
    label: "Programs & Talent",
    items: [
      { label: "Incubator Programs", path: "/org/incubator", icon: GraduationCap },
      { label: "Hackathons", path: "/org/hackathons", icon: Trophy },
      { label: "Talent Pool", path: "/org/talent", icon: UserSearch },
      { label: "AI Operations", path: "/org/ai-ops", icon: Brain },
      { label: "Market Ready", path: "/org/market-ready", icon: Rocket },
      { label: "Marketplace", path: "/org/marketplace", icon: ShoppingBag },
    ],
  },
  {
    label: "Account & Operations",
    items: [
      { label: "Hangout", path: "/org/hangout", icon: MessageSquare },
      { label: "Feed", path: "/feed", icon: Rss, external: true },
      { label: "Integrations", path: "/org/integrations", icon: Plug },
      { label: "Plugins", path: "/plugins", icon: Plug },
      { label: "Billing & Usage", path: "/org/billing", icon: CreditCard },
      { label: "Profile", path: "/org/profile", icon: UserCircle },
      { label: "Settings", path: "/org/settings", icon: SettingsIcon },
      { label: "Privacy & Compliance", path: "/compliance", icon: Scale },
      { label: "Support", path: "/support", icon: Ticket, external: true },
    ],
  },
];

const roleLabels: Record<Role, string> = {
  founder: "Founder",
  collaborator: "Collaborator",
  investor: "Investor",
  org: "Organization",
};

export function OrgLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orgProfile } = useOrgProfile();
  const { profile, signOut } = useAuth();
  const { activeRoles, currentRole } = useActiveRoles();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Management & Intelligence": true,
    "Programs & Talent": true,
    "Account & Operations": true,
  });

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [headerRoleMenuOpen, setHeaderRoleMenuOpen] = useState(false);
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
    writeStoredActiveRole("org");
  }, []);

  const isActive = (path: string) => {
    if (path === "/org/hackathons") return location.pathname.startsWith("/org/hackathons");
    if (path === "/org/intelligence") return location.pathname.startsWith("/org/intelligence");
    if (path === "#" || path === "/feed") return false;
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const userFullName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '';
  const displayName = orgProfile.orgName || userFullName || "Organization Hub";
  const initials = displayName.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2) || "OG";
  const planLabel =
    orgProfile.plan === "enterprise"
      ? "Enterprise Plan"
      : orgProfile.plan === "growth"
      ? "Growth Plan"
      : "Free Plan";

  const activeNavItem = NAV_GROUPS.flatMap((g) => g.items).find((n) => isActive(n.path));
  const activeLabel = activeNavItem?.label ?? "Dashboard";

  const toggleGroup = (groupLabel: string) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setExpandedGroups((prev) => ({ ...prev, [groupLabel]: true }));
      return;
    }
    setExpandedGroups((prev) => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  };

  const handleRoleClick = (role: Role) => {
    setHeaderRoleMenuOpen(false);
    if (activeRoles.has(role)) navigate(roleDashboardPath[role]);
    else navigate(roleOnboardingPath[role]);
  };

  const allFlatItems = NAV_GROUPS.flatMap((g) => g.items);

  return (
    <div className={`flex h-screen w-full p-[5px] overflow-hidden font-bricolage transition-colors duration-300 ${isDark ? "bg-[#0a0a0a] dark" : "bg-[#f4fbf7]"}`}>
      
      {/* Outer Card Container */}
      <div className={`flex w-full h-full rounded-xl p-[5px] relative overflow-hidden transition-all duration-300 ${
        isDark 
          ? "bg-[#121212] border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]" 
          : "bg-white border border-black/[0.06] shadow-sm"
      }`}>
        
        {/* Background Orbs with #20C997 styling */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: isDark ? [0.2, 0.4, 0.2] : [0.35, 0.6, 0.35], x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full blur-[120px] ${isDark ? "bg-[#20C997]/20" : "bg-[#20C997]/[0.05]"}`}
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: isDark ? [0.15, 0.35, 0.15] : [0.25, 0.5, 0.25], x: [0, -50, 0], y: [0, 60, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className={`absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-[120px] ${isDark ? "bg-[#10b981]/20" : "bg-[#10b981]/[0.04]"}`}
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: isDark ? [0.12, 0.3, 0.12] : [0.2, 0.4, 0.2], x: [0, 40, 0], y: [0, -40, 0] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 10 }}
            className={`absolute top-1/4 left-1/3 w-[50%] h-[50%] rounded-full blur-[120px] ${isDark ? "bg-[#059669]/15" : "bg-[#059669]/[0.03]"}`}
          />
        </div>

        {/* ==================== SIDENAV ==================== */}
        <aside
          onMouseLeave={() => setProfileMenuOpen(false)}
          className={`relative flex flex-col h-full rounded-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-visible shrink-0 z-10 ${
            isDark 
              ? "bg-[#121212] border border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(32,201,151,0.06)]" 
              : "bg-white border border-black/[0.06] shadow-[0_8px_30px_rgba(23,19,48,0.08)]"
          } ${
            sidebarCollapsed ? "w-[76px]" : "w-64"
          } hidden lg:flex`}
        >
          {/* Sidenav Header */}
          <div className={`flex items-center p-4 mb-2 ${sidebarCollapsed ? "flex-col justify-center gap-4" : "justify-between"}`}>
            {!sidebarCollapsed && (
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-1.5 shadow-sm border transition-colors ${
                  isDark ? "bg-[#1a1a1a] border-white/10 shadow-[0_0_12px_rgba(32,201,151,0.15)]" : "bg-white border-black/[0.06]"
                }`}>
                  <TechITLogo />
                </div>
                <div className="flex flex-col">
                  <span className={`font-black tracking-tight leading-none text-[15px] transition-colors ${
                    isDark ? "text-white group-hover:text-[#20C997]" : "text-[#171330] group-hover:text-[#20C997]"
                  }`}>TechIT Network</span>
                  <span className="font-bold text-[10px] tracking-wider uppercase mt-1 text-[#20C997]">Organization</span>
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#20C997] to-[#10b981] relative shadow-[0_4px_12px_rgba(32,201,151,0.35)] shrink-0">
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
                  ? "bg-white/[0.05] border-white/10 text-white/70 hover:bg-[#20C997]/20 hover:text-[#20C997] hover:border-[#20C997]/30 shadow-[0_0_10px_rgba(32,201,151,0.1)]" 
                  : "bg-[#f4fbf7] border-black/[0.06] text-[#171330]/40 hover:bg-[#20C997]/10 hover:text-[#20C997] hover:border-[#20C997]/20"
              }`}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
            </button>
          </div>

          {/* Grouped Links */}
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
                        expandedGroups[group.label] ? "rotate-180 text-[#20C997]" : ""
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
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.label}
                            to={item.path}
                            title={sidebarCollapsed ? item.label : undefined}
                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group/nav ${
                              active
                                ? "text-[#20C997]"
                                : isDark
                                ? "text-white/60 hover:bg-white/[0.05] hover:text-white"
                                : "text-[#171330]/55 hover:bg-black/[0.03] hover:text-[#171330]"
                            } ${sidebarCollapsed ? "justify-center" : ""}`}
                          >
                            {active && (
                              <motion.div
                                layoutId="activeNavBgOrg"
                                className={`absolute inset-0 rounded-xl ${
                                  isDark 
                                    ? "bg-gradient-to-r from-[#20C997]/25 to-emerald-400/[0.06] border border-[#20C997]/40 shadow-[0_0_15px_rgba(32,201,151,0.2)]" 
                                    : "bg-gradient-to-r from-[#20C997]/[0.1] to-transparent border border-[#20C997]/20"
                                }`}
                                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                              />
                            )}
                            {active && !sidebarCollapsed && (
                              <motion.div
                                layoutId="activeNavIndicatorOrg"
                                className="absolute left-[-4px] top-2 bottom-2 w-[3px] rounded-r-full bg-[#20C997] shadow-[0_0_12px_rgba(32,201,151,0.7)]"
                                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                              />
                            )}
                            <Icon className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-colors ${
                              active 
                                ? "text-[#20C997]" 
                                : isDark ? "text-white/50 group-hover/nav:text-[#20C997]" : "text-[#171330]/40 group-hover/nav:text-[#20C997]"
                            }`} />
                            {!sidebarCollapsed && (
                              <span className={`relative z-10 font-bold text-sm truncate ${active ? "text-[#20C997]" : ""}`}>
                                {item.label}
                              </span>
                            )}
                            {active && !sidebarCollapsed && (
                              <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-[#20C997] shadow-[0_0_8px_rgba(32,201,151,0.8)]" />
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

          {/* Profile Card at bottom of sidebar */}
          <div className={`p-3 mt-auto border-t relative ${isDark ? "border-white/[0.08]" : "border-black/[0.05]"}`}>
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                isDark 
                  ? "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.5)]" 
                  : "bg-[#f4fbf7] hover:bg-[#e8f8f2] border-black/[0.04]"
              } ${sidebarCollapsed ? "justify-center" : ""}`}
            >
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#20C997] to-[#10b981] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(32,201,151,0.35)]">
                {initials}
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#20C997] border-2 ${isDark ? "border-[#121212]" : "border-[#f4fbf7]"}`} />
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className={`text-[13px] font-bold truncate leading-tight ${isDark ? "text-white" : "text-[#171330]"}`}>{displayName}</p>
                    <p className="text-[11px] truncate font-medium text-[#20C997]">{planLabel}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isDark ? "text-white/40" : "text-[#171330]/30"} ${profileMenuOpen ? "rotate-180" : ""}`} />
                </>
              )}
            </button>

            {/* Profile Popover */}
            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute bottom-full mb-2 ${sidebarCollapsed ? "left-full ml-2 w-56" : "left-3 right-3"} rounded-xl border p-1.5 z-30 ${
                    isDark 
                      ? "bg-[#181818] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_15px_rgba(32,201,151,0.1)]" 
                      : "bg-white border-black/[0.06] shadow-[0_20px_50px_-10px_rgba(23,19,48,0.25)]"
                  }`}
                >
                  <Link
                    to="/org/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isDark ? "text-white/80 hover:bg-white/[0.06] hover:text-[#20C997]" : "text-[#171330]/75 hover:bg-[#f4fbf7] hover:text-[#20C997]"
                    }`}
                  >
                    <UserCircle className="w-4 h-4" /> View profile
                  </Link>
                  <Link
                    to="/org/billing"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isDark ? "text-white/80 hover:bg-white/[0.06] hover:text-[#20C997]" : "text-[#171330]/75 hover:bg-[#f4fbf7] hover:text-[#20C997]"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Billing & Plan
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

        {/* 5PX VERTICAL SEPARATOR LINE */}
        <div className="hidden lg:block w-[5px] shrink-0 rounded-md bg-gradient-to-b from-[#20C997]/80 via-emerald-400/40 to-teal-500/60 shadow-[0_0_15px_rgba(32,201,151,0.3)] z-10 my-[2px] mx-[2px]" />

        {/* ==================== MAIN CONTENT AREA ==================== */}
        <main className={`flex-1 rounded-md overflow-hidden flex flex-col relative z-20 transition-all duration-300 ${
          isDark 
            ? "bg-[#0d0d0d] shadow-[0_25px_70px_rgba(0,0,0,0.95)]" 
            : "bg-[#f4fbf7] shadow-2xl"
        }`}>
          {/* Header Bar */}
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
                    ? "bg-[#20C997]/15 border-[#20C997]/30 text-[#20C997] shadow-[0_0_15px_rgba(32,201,151,0.2)]" 
                    : "bg-gradient-to-br from-[#20C997]/10 to-emerald-400/10 border-[#20C997]/20 text-[#20C997]"
                }`}
              >
                <PanelLeftOpen className="w-[18px] h-[18px] relative z-10" />
              </button>

              <h2 className="text-base font-bold hidden lg:block shrink-0 mr-2 text-[#20C997]">
                {activeLabel}
              </h2>

              {/* Search input */}
              <div className={`hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border w-full max-w-xs transition-all ${
                isDark 
                  ? "bg-white/[0.05] border-white/10 text-white hover:border-[#20C997]/40 focus-within:border-[#20C997]/60 focus-within:ring-4 focus-within:ring-[#20C997]/15" 
                  : "bg-[#f4fbf7] border-black/[0.05] text-[#171330]/40 hover:border-[#20C997]/30 focus-within:border-[#20C997]/50 focus-within:ring-4 focus-within:ring-[#20C997]/10"
              }`}>
                <Search className={`w-4 h-4 shrink-0 ${isDark ? "text-white/40" : "text-[#171330]/40"}`} />
                <input
                  type="text"
                  placeholder="Search projects, teams, talent..."
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
              {/* Theme toggle */}
              <button
                onClick={() => setIsDark((v) => !v)}
                className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors overflow-hidden ${
                  isDark 
                    ? "bg-white/[0.05] border-white/10 text-[#20C997] hover:bg-[#20C997]/20 hover:border-[#20C997]/40 shadow-[0_0_12px_rgba(32,201,151,0.2)]" 
                    : "bg-[#f4fbf7] border-black/[0.05] text-[#171330]/60 hover:text-[#20C997] hover:border-[#20C997]/25"
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

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen((v) => !v); setHeaderRoleMenuOpen(false); }}
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors relative ${
                    isDark 
                      ? "bg-white/[0.05] border-white/10 text-white/70 hover:text-[#20C997] hover:bg-[#20C997]/15" 
                      : "bg-[#f4fbf7] border-black/[0.05] text-[#171330]/60 hover:text-[#20C997] hover:bg-[#20C997]/10"
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#20C997] shadow-[0_0_8px_rgba(32,201,151,0.8)]" />
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-80 rounded-2xl border p-4 z-50 shadow-2xl ${
                        isDark ? "bg-[#181818] border-white/10 text-white" : "bg-white border-black/[0.06] text-[#171330]"
                      }`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <span className="font-bold text-sm">Organization Alerts</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#20C997]/20 text-[#20C997]">1 New</span>
                      </div>
                      <div className="py-3 space-y-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#20C997]/10 border border-[#20C997]/20">
                          <p className="font-bold text-[#20C997]">Incubator Milestone</p>
                          <p className="text-muted-foreground mt-0.5">3 teams submitted final hackathon deliverables.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Role Dropdown Menu */}
              <div className="relative font-bricolage">
                <button
                  type="button"
                  onClick={() => { setHeaderRoleMenuOpen((v) => !v); setNotifOpen(false); }}
                  className={`flex items-center gap-3 px-2.5 py-1.5 rounded-xl transition-all duration-300 border border-transparent group ${
                    isDark ? "hover:bg-white/[0.06] hover:border-white/10" : "hover:bg-[#f4fbf7] hover:border-[#20C997]/15"
                  }`}
                >
                  <div className="text-right hidden md:block">
                    <div className={`text-sm font-bold leading-tight transition-colors ${
                      isDark ? "text-white group-hover:text-[#20C997]" : "text-[#171330] group-hover:text-[#20C997]"
                    }`}>{displayName}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#20C997]">{planLabel}</div>
                  </div>
                  
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#20C997] to-[#10b981] text-white font-black flex items-center justify-center text-sm shadow-[0_4px_12px_rgba(32,201,151,0.35)] group-hover:shadow-[0_4px_16px_rgba(32,201,151,0.5)] transition-all duration-300">
                    {initials}
                  </div>
                  
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                    headerRoleMenuOpen ? "rotate-180 text-[#20C997]" : isDark ? "text-white/30" : "text-[#171330]/30"
                  }`} />
                </button>

                <AnimatePresence>
                  {headerRoleMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setHeaderRoleMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className={`absolute right-0 mt-3 w-72 backdrop-blur-3xl rounded-2xl z-50 overflow-hidden transform origin-top-right ${
                          isDark 
                            ? "bg-[#181818]/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_20px_rgba(32,201,151,0.15)] text-white" 
                            : "bg-white/95 border border-[#20C997]/20 shadow-[0_20px_60px_-15px_rgba(32,201,151,0.2)] text-[#171330]"
                        }`}
                      >
                        <div className={`px-5 py-4 border-b ${
                          isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.04] bg-gradient-to-b from-[#f4fbf7] to-transparent"
                        }`}>
                          <div className={`font-black text-base ${isDark ? "text-white" : "text-[#171330]"}`}>{displayName}</div>
                          <div className="text-[10px] font-bold text-[#20C997] uppercase tracking-widest mt-1">Organization &middot; {planLabel}</div>
                        </div>

                        <div className="p-2 space-y-0.5">
                          <button type="button" onClick={() => { setHeaderRoleMenuOpen(false); navigate("/org/profile"); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                              isDark ? "text-white/80 hover:bg-white/[0.06] hover:text-[#20C997]" : "text-[#171330]/70 hover:bg-[#20C997]/10 hover:text-[#20C997]"
                            }`}>
                            <UserCircle className="w-4 h-4 text-[#20C997]" /> View profile
                          </button>
                          <button type="button" onClick={() => { setHeaderRoleMenuOpen(false); navigate("/org/billing"); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                              isDark ? "text-white/80 hover:bg-white/[0.06] hover:text-[#20C997]" : "text-[#171330]/70 hover:bg-[#20C997]/10 hover:text-[#20C997]"
                            }`}>
                            <CreditCard className="w-4 h-4 text-[#20C997]" /> Billing & Plan
                          </button>
                        </div>

                        <div className={`border-t px-5 py-2.5 ${
                          isDark ? "border-white/[0.08] bg-white/[0.02] text-white/40" : "border-black/[0.04] bg-[#f4fbf7] text-[#171330]/40"
                        }`}>
                          <div className="text-[10px] uppercase tracking-widest font-bold">Switch workspace role</div>
                        </div>

                        <div className="p-2 space-y-0.5">
                          {(["founder", "collaborator", "investor", "org"] as Role[]).map((r) => {
                            const isCurrent = currentRole === r;
                            const isAvailable = activeRoles.has(r);
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => handleRoleClick(r)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                  isCurrent
                                    ? "bg-[#20C997]/15 text-[#20C997] font-bold"
                                    : isDark
                                    ? "text-white/70 hover:bg-white/[0.06] hover:text-white"
                                    : "text-[#171330]/70 hover:bg-black/[0.04]"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {roleLabels[r]}
                                  {!isAvailable && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono">Unlock</span>
                                  )}
                                </span>
                                {isCurrent && <Check className="w-3.5 h-3.5 text-[#20C997]" />}
                              </button>
                            );
                          })}
                        </div>

                        <div className={`border-t p-2 ${isDark ? "border-white/[0.08]" : "border-black/[0.04]"}`}>
                          <button
                            type="button"
                            onClick={() => { setHeaderRoleMenuOpen(false); signOut(); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Log out
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <RoleMobileMenu
            brand="TechIT Network"
            title="Organization Portal"
            open={mobileMenuOpen}
            onToggle={() => setMobileMenuOpen((v) => !v)}
            onNavigate={() => setMobileMenuOpen(false)}
            backPath={roleDashboardPath.org}
            items={allFlatItems.map((item) => ({
              label: item.label,
              path: item.path,
              icon: item.icon,
              active: !item.external && isActive(item.path),
            }))}
            primaryItems={allFlatItems.slice(0, 5).map((item) => ({
              label: item.label,
              path: item.path,
              icon: item.icon,
              active: !item.external && isActive(item.path),
            }))}
          />

          {/* Viewport content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
            <ProfileCompletionBanner role="organisation" profilePath="/org/profile" />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, FlaskConical, PanelsTopLeft, Rss, Compass,
  MessageSquare, Wallet, UserCircle, Settings as SettingsIcon,
  ShieldCheck, Plug, Ticket, ChevronDown, PanelLeftClose, PanelLeftOpen,
  ArrowLeft, LogOut, ChevronRight, Menu, X, Search, Bell, Sun, Moon, Sparkles
} from "lucide-react";
import TechITLogo from "@/components/ui/TechITLogo";
import { Toaster } from "@/components/ui/sonner";
import { useFounderProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { Havi } from "@/dashboard/_shared/havi/Havi";
import { roleDashboardPath, writeStoredActiveRole } from "@/lib/roleRoutes";
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
      { label: "Dashboard", path: roleDashboardPath.founder, icon: LayoutDashboard },
      { label: "Workspaces", path: "/workspaces", icon: PanelsTopLeft },
      { label: "Incubation Hub", path: "/incubation-hub", icon: FlaskConical },
      { label: "Opportunity Hub", path: "/opportunity-hub", icon: Compass },
    ]
  },
  {
    label: "Network",
    items: [
      { label: "Messages", path: "/founder/messages", icon: MessageSquare },
      { label: "Feed", path: "/feed", icon: Rss, kind: "external" },
      { label: "Trust Center", path: "/founder/trust", icon: ShieldCheck },
    ]
  },
  {
    label: "Account",
    items: [
      { label: "Profile", path: "/founder/profile", icon: UserCircle },
      { label: "Wallet", path: "/wallet", icon: Wallet, kind: "external" },
      { label: "Plugins", path: "/plugins", icon: Plug },
      { label: "Settings", path: "/founder/settings", icon: SettingsIcon },
      { label: "Support", path: "/support", icon: Ticket, kind: "external" },
    ]
  }
];

export function FounderLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { founderProfile } = useFounderProfile();
  const { profile, signOut } = useAuth();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Workspace": true,
    "Network": true,
    "Account": true,
  });

  // ---- New: purely local UI state for header/profile UI additions ----
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    writeStoredActiveRole("founder");
  }, []);

  useEffect(() => {
    // TEMPORARILY DISABLED FOR UI UPGRADE
    // const onboarded = profile?.isOnboarded ?? founderProfile.onboardingComplete;
    // if (!onboarded && !location.pathname.startsWith("/founder/onboarding")) {
    //   navigate("/founder/onboarding/step-1", { replace: true });
    // }
  }, [profile?.isOnboarded, founderProfile.onboardingComplete, location.pathname, navigate]);

  const isActive = (path?: string) => path ? location.pathname === path : false;
  const displayName = founderProfile.name || "Founder";
  const initials = displayName.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  const startupLabel = founderProfile.startupName || "No venture yet";
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
    startupName: founderProfile.startupName,
    stage: founderProfile.stage,
    industries: founderProfile.industries,
    currentTeamSize: founderProfile.currentTeamSize,
    openRoles: founderProfile.openRoles,
    users: founderProfile.users,
    revenueMonthly: founderProfile.revenueMonthly,
    nextMilestone: founderProfile.nextMilestone,
    hackathonTeams: founderProfile.hackathonRegistrations.map((registration) => ({
      teamName: registration.teamName,
      stage: registration.stage,
      teamSize: registration.teamSize,
      memberCount: registration.members.length + 1,
      openRoles: registration.openRoles,
      checkIns: registration.checkIns.length,
      hasWorkspace: Boolean(registration.workspaceId),
    })),
    teamWorkspaces: founderProfile.teamWorkspaces.map((workspace) => ({
      teamName: workspace.teamName,
      memberCount: workspace.team.length,
      hasArtifacts: Boolean(workspace.artifacts),
      projectId: workspace.projectId,
    })),
  }), [founderProfile]);

  return (
    <div className="flex h-screen w-full bg-[#f5f8ff] p-[5px] overflow-hidden font-bricolage">
      
      {/* Overlay Div covering the entire layout area */}
      <div className="flex w-full h-full bg-white rounded-xl border border-black/[0.06] p-[5px] relative overflow-hidden shadow-sm">
        
        {/* Subtle background glow */}
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0066ff]/5 via-transparent to-transparent opacity-60 pointer-events-none blur-[100px]" />

        {/* ======================================================== */}
        {/* PREMIUM WHITE SIDENAV */}
        {/* ======================================================== */}
        <aside
          onMouseLeave={() => setProfileMenuOpen(false)}
          className={`relative flex flex-col h-full bg-white rounded-md transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-visible shrink-0 z-10 border border-black/[0.06] shadow-[0_8px_30px_rgba(23,19,48,0.08)] ${
            sidebarCollapsed ? "w-[76px]" : "w-64"
          } hidden lg:flex`}
        >
          {/* Header / TechIT Network Logo */}
          <div className={`flex items-center p-4 mb-2 ${sidebarCollapsed ? "flex-col justify-center gap-4" : "justify-between"}`}>
            {!sidebarCollapsed && (
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-black/[0.06]">
                    <TechITLogo />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#171330] font-black tracking-tight leading-none text-[15px] group-hover:text-[#0066ff] transition-colors">TechIT Network</span>
                  <span className="text-[#171330]/40 font-bold text-[10px] tracking-wider uppercase mt-1">Founder</span>
                </div>
              </Link>
            )}
            {sidebarCollapsed && (
              <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#0066ff] to-[#58a6ff] relative shadow-[0_4px_12px_rgba(0,102,255,0.35)] shrink-0">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-black/[0.06]">
                    <TechITLogo />
                  </div>
              </Link>
            )}

            {/* Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-9 h-9 shrink-0 rounded-lg bg-[#f5f8ff] border border-black/[0.06] text-[#171330]/40 hover:bg-[#0066ff]/10 hover:text-[#0066ff] hover:border-[#0066ff]/20 transition-colors flex justify-center items-center"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
            </button>
          </div>

          {/* Sidenav Grouped Links */}
          <nav className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                {!sidebarCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-2 mb-1.5 group/btn"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#171330]/35 group-hover/btn:text-[#171330]/70 transition-colors">
                      {group.label}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#171330]/25 transition-transform duration-300 ${
                        expandedGroups[group.label] ? "rotate-180 text-[#0066ff]" : ""
                      }`}
                    />
                  </button>
                ) : (
                  <button onClick={() => toggleGroup(group.label)} className="w-full flex justify-center mb-3">
                     <span className="w-4 h-[1px] bg-[#171330]/10" />
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
                                ? "text-[#0066ff]"
                                : "text-[#171330]/55 hover:bg-black/[0.03] hover:text-[#171330]"
                            } ${sidebarCollapsed ? "justify-center" : ""}`}
                          >
                            {/* Premium sliding active background */}
                            {active && (
                              <motion.div
                                layoutId="activeNavBg"
                                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0066ff]/[0.08] to-transparent border border-[#0066ff]/20"
                                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                              />
                            )}
                            {active && !sidebarCollapsed && (
                              <motion.div
                                layoutId="activeNavIndicator"
                                className="absolute left-[-4px] top-2 bottom-2 w-[3px] rounded-r-full bg-[#0066ff] shadow-[0_0_10px_rgba(0,102,255,0.4)]"
                                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                              />
                            )}
                            <item.icon className={`relative z-10 w-[18px] h-[18px] shrink-0 transition-colors ${active ? "text-[#0066ff]" : "text-[#171330]/40 group-hover/nav:text-[#0066ff]"}`} />
                            {!sidebarCollapsed && (
                              <span className={`relative z-10 font-bold text-sm truncate ${active ? "text-[#0066ff]" : ""}`}>
                                {item.label}
                              </span>
                            )}
                            {active && !sidebarCollapsed && (
                              <span className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
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

          {/* ==================== Premium Profile Card ==================== */}
          <div className="p-3 mt-auto border-t border-black/[0.05] relative">
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl bg-[#f5f8ff] hover:bg-[#eef3ff] border border-black/[0.04] transition-colors ${
                sidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(0,102,255,0.35)]">
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#20c937] border-2 border-[#f5f8ff]" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[13px] font-bold text-[#171330] truncate leading-tight">{displayName}</p>
                    <p className="text-[11px] text-[#171330]/45 truncate font-medium">{startupLabel}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#171330]/30 shrink-0 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
                </>
              )}
            </button>

            {/* Popover menu */}
            <AnimatePresence>
              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={`absolute bottom-full mb-2 ${sidebarCollapsed ? "left-full ml-2 w-56" : "left-3 right-3"} rounded-xl border border-black/[0.06] bg-white shadow-[0_20px_50px_-10px_rgba(23,19,48,0.25)] p-1.5 z-30`}
                >
                  <Link
                    to="/founder/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#171330]/75 hover:bg-[#f5f8ff] hover:text-[#0066ff] transition-colors"
                  >
                    <UserCircle className="w-4 h-4" /> View profile
                  </Link>
                  <Link
                    to="/founder/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#171330]/75 hover:bg-[#f5f8ff] hover:text-[#0066ff] transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" /> Settings
                  </Link>
                  <div className="h-px bg-black/[0.05] my-1" />
                  <button
                    onClick={() => { setProfileMenuOpen(false); signOut(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>


        {/* ======================================================== */}
        {/* VISIBLE 5PX THICK SEPARATOR DIV */}
        {/* ======================================================== */}
        <div className="hidden lg:block w-[5px] shrink-0 rounded-md bg-gradient-to-b from-[#0066ff]/80 via-[#58a6ff]/40 to-[#20c937]/60 shadow-[0_0_15px_rgba(0,102,255,0.3)] z-10 my-[2px] mx-[2px]" />


        {/* ======================================================== */}
        {/* MAIN FOUNDER DISPLAY DASHBOARD */}
        {/* ======================================================== */}
        <main className="flex-1 bg-[#f5f8ff] rounded-md overflow-hidden shadow-2xl flex flex-col relative z-20">
          
          {/* ==================== Premium White Header ==================== */}
          <header className="flex min-h-[64px] items-center justify-between gap-4 border-b border-black/[0.06] bg-white px-4 lg:px-6 z-20 sticky top-0 rounded-t-md">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066ff]/5 to-[#58a6ff]/10 backdrop-blur-md border border-[#0066ff]/10 shadow-[0_4px_16px_rgba(0,102,255,0.08)] text-[#0066ff] hover:from-[#0066ff]/10 hover:to-[#58a6ff]/20 hover:border-[#0066ff]/20 hover:shadow-[0_4px_20px_rgba(0,102,255,0.15)] transition-all duration-300 shrink-0 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <PanelLeftOpen className="w-[18px] h-[18px] relative z-10" />
              </button>

              <h2 className="text-base font-bold text-[#171330] hidden lg:block shrink-0 mr-2">
                {activeLabel}
              </h2>

              {/* Search bar */}
              <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg bg-[#f5f8ff] border border-black/[0.05] w-full max-w-xs text-[#171330]/40 hover:border-[#0066ff]/25 focus-within:border-[#0066ff]/40 focus-within:ring-4 focus-within:ring-[#0066ff]/10 transition-all">
                <Search className="w-4 h-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="bg-transparent outline-none text-sm w-full placeholder:text-[#171330]/35 text-[#171330]"
                />
                <kbd className="hidden md:inline text-[10px] font-bold text-[#171330]/35 bg-white border border-black/[0.06] rounded px-1.5 py-0.5 shrink-0">
                  ⌘K
                </kbd>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">

              {/* Light / dark switcher */}
              <button
                onClick={() => setIsDark((v) => !v)}
                className="relative w-9 h-9 rounded-lg bg-[#f5f8ff] border border-black/[0.05] flex items-center justify-center text-[#171330]/60 hover:text-[#0066ff] hover:border-[#0066ff]/25 transition-colors overflow-hidden"
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
                  onClick={() => { setNotifOpen((v) => !v); setProfileMenuOpen(false); }}
                  className="relative w-9 h-9 rounded-lg bg-[#f5f8ff] border border-black/[0.05] flex items-center justify-center text-[#171330]/60 hover:text-[#0066ff] hover:border-[#0066ff]/25 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#0066ff]" />
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-2 w-72 rounded-xl border border-black/[0.06] bg-white shadow-[0_20px_50px_-10px_rgba(23,19,48,0.25)] p-3 z-30"
                    >
                      <p className="text-xs font-black uppercase tracking-widest text-[#171330]/35 mb-2 px-1">Notifications</p>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-[#f5f8ff]">
                        <Sparkles className="w-4 h-4 text-[#0066ff] mt-0.5 shrink-0" />
                        <p className="text-sm text-[#171330]/70">You're all caught up — no new notifications.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile dropdown */}
              <TopBarRoleMenu />
            </div>
          </header>

          <div className="app-role-content flex-1 relative flex flex-col bg-white overflow-hidden rounded-b-md">
            
            {/* 1) Animated Background (Peeks through the 3px gap) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6], x: [0, 40, 0], y: [0, 30, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#0066ff]/20 blur-[80px]"
              />
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5], x: [0, -50, 0], y: [0, -60, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-[#58a6ff]/20 blur-[80px]"
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5], x: [0, 30, 0], y: [0, -40, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
                className="absolute top-[30%] right-[10%] w-[50%] h-[50%] rounded-full bg-[#20c937]/15 blur-[80px]"
              />
            </div>

            {/* 2) Inner Overlay Div (creates the 3px border on lg) */}
            <div className="relative z-10 flex-1 flex flex-col lg:m-[3px] rounded-b-md lg:rounded-[10px] overflow-hidden bg-white shadow-sm border border-black/[0.04]">
              <div className="flex-1 overflow-y-auto custom-scrollbar w-full h-full relative">
                
                {/* Subtle orbs for the light mode inner background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/40 to-transparent" />
                </div>
                
                <div className="relative z-10">
                  <ProfileCompletionBanner role="founder" profilePath="/founder/profile" />
                  <div className="w-full min-h-full">
                    <Outlet />
                  </div>
                </div>
              </div>
            </div>
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
              className="fixed inset-0 bg-[#171330]/40 backdrop-blur-sm z-[99]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white border-r border-black/[0.06] z-[100] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm">
                    <TechITLogo />
                  </div>
                </div>
                  <span className="text-[#0066ff] font-black">TechIT Network</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-[#171330]/40 hover:text-[#171330]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#171330]/35 mb-3 px-2">
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
                                ? "bg-gradient-to-r from-[#0066ff]/[0.08] to-transparent border border-[#0066ff]/20 text-[#0066ff]"
                                : "text-[#171330]/60 hover:bg-[#f5f8ff] hover:text-[#171330]"
                            }`}
                          >
                            <item.icon className="w-[18px] h-[18px]" />
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-black/[0.06]">
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toaster richColors position="bottom-right" />

      <Havi
        role="founder"
        userName={displayName.split(" ")[0]}
        stage={founderProfile.stage}
        route={location.pathname}
        profileContext={haviContext}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
}
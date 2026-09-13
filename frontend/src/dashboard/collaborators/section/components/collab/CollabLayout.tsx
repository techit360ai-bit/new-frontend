import { useEffect, useMemo, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, TrendingUp, DollarSign, PieChart,
  Sparkles, Award, MessageSquare, Wrench, Rss, UserCircle,
  Settings as SettingsIcon, ArrowLeft, PanelLeftClose, PanelLeftOpen, Scale, Ticket,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";
import { useCollaboratorProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { Havi } from "@/dashboard/_shared/havi/Havi";
import { roleDashboardPath, writeStoredActiveRole } from "@/lib/roleRoutes";
import { TopBarRoleMenu } from "./TopBarRoleMenu";
import { RoleMobileMenu } from "@/components/RoleMobileMenu";
import { NextBestActionNote } from "@/components/authorization/NextBestActionNote";

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  external?: boolean;
}

const primaryNav: NavItem[] = [
  { name: "Dashboard",     path: "/collaborator/dashboard",     icon: LayoutDashboard },
  { name: "Tasks",         path: "/collaborator/tasks",         icon: CheckSquare },
  { name: "Performance",   path: "/collaborator/performance",   icon: TrendingUp },
  { name: "Earnings",      path: "/collaborator/earnings",      icon: DollarSign },
  { name: "Equity",        path: "/collaborator/equity",        icon: PieChart },
  { name: "Opportunities", path: "/collaborator/opportunities", icon: Sparkles },
  { name: "Reputation",    path: "/collaborator/reputation",    icon: Award },
  { name: "Messages",      path: "/collaborator/messages",      icon: MessageSquare },
  { name: "Support",       path: "/support",                    icon: Ticket, external: true },
  { name: "Tools",         path: "/collaborator/tools",         icon: Wrench },
  { name: "Feed",          path: "/feed",                       icon: Rss, external: true },
];

const accountNav: NavItem[] = [
  { name: "Profile",  path: "/collaborator/profile",  icon: UserCircle },
  { name: "Settings", path: "/collaborator/settings", icon: SettingsIcon },
  { name: "Privacy", path: "/compliance", icon: Scale },
];

export function CollabLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collaboratorProfile } = useCollaboratorProfile();
  const { profile } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    writeStoredActiveRole("collaborator");
  }, []);

  // Defensive redirect: un-onboarded users go to step 1
  useEffect(() => {
    const onboarded = profile?.isOnboarded ?? collaboratorProfile.onboardingComplete;
    if (!onboarded && !location.pathname.startsWith("/collaborator/onboarding")) {
      navigate("/collaborator/onboarding/step-1", { replace: true });
    }
  }, [profile?.isOnboarded, collaboratorProfile.onboardingComplete, location.pathname, navigate]);

  const isActive = (path: string) => location.pathname === path;
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

  const displayName = collaboratorProfile.name || "Collaborator";

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link key={item.path} to={item.path}
        className={`app-nav-link flex items-center gap-3 px-4 transition-colors text-sm ${
          active
            ? "bg-role-collaborator/10 text-role-collaborator border-l-2 border-role-collaborator"
            : "text-text-on-inverse-secondary hover:bg-surface-inverse-muted hover:text-white"
        }`}>
        <Icon className="w-4 h-4" />
        <span className="flex-1 font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-background-primary">
      <aside className={`hidden lg:flex lg:flex-col bg-background-inverse border-r border-border-inverse transition-[width] duration-200 ${sidebarCollapsed ? "w-20 [&_nav_span]:hidden" : "w-64"}`}>
        <div className="p-5 border-b border-border-inverse">
          <button onClick={() => setSidebarCollapsed((value) => !value)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="mb-3 rounded-lg p-2 text-text-disabled hover:bg-surface-inverse-muted hover:text-role-collaborator">
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          {!sidebarCollapsed && <>
          <Link to={roleDashboardPath.collaborator} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-role-collaborator transition-colors mb-3">
            <ArrowLeft className="w-3 h-3" />
            Back to TechIT
          </Link>
          <h1 className="text-xl font-bold text-role-collaborator tracking-wide">TECHIT</h1>
          <p className="text-xs text-text-disabled mt-0.5">Collaborator Portal</p>
          </>}
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {primaryNav.map(renderNavItem)}
          <div className="h-px bg-surface-inverse-muted my-3" />
          {accountNav.map(renderNavItem)}
        </nav>

        {!sidebarCollapsed && <Link to="/collaborator/equity" className="m-3 p-3 rounded-lg bg-surface-inverse-muted hover:bg-surface-inverse-muted/70 transition-colors border border-border-inverse-strong">
          <p className="text-xs text-text-disabled uppercase tracking-wider font-semibold">Building for Equity</p>
          <p className="text-sm text-white mt-1">View your persisted ownership ledger</p>
          <p className="text-xs text-role-collaborator mt-1">View equity →</p>
        </Link>}
      </aside>

      <RoleMobileMenu
        brand="TECHIT"
        title="Collaborator Portal"
        open={mobileMenuOpen}
        onToggle={() => setMobileMenuOpen((value) => !value)}
        onNavigate={() => setMobileMenuOpen(false)}
        backPath={roleDashboardPath.collaborator}
        items={[...primaryNav, ...accountNav].map((item) => ({
          label: item.name,
          path: item.path,
          icon: item.icon,
          active: isActive(item.path),
        }))}
  primaryItems={[primaryNav[0], primaryNav[1], primaryNav[9], primaryNav[5], primaryNav[3]].map((item) => ({ label: item.name, path: item.path, icon: item.icon, active: isActive(item.path) }))}
        headerActions={<>
          <Link to="/collaborator/messages" className="app-touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open messages"><MessageSquare className="h-5 w-5" /></Link>
          <Link to="/support" className="app-touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open support tickets"><Ticket className="h-5 w-5" /></Link>
          <Link to="/collaborator/profile" className="app-touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open profile"><UserCircle className="h-5 w-5" /></Link>
        </>}
      />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 lg:pt-0">
        <header className="hidden min-h-14 items-center justify-between border-b border-border-default bg-surface-primary px-4 lg:flex lg:px-6">
          <div className="text-sm text-text-muted">
            {primaryNav.find((n) => isActive(n.path))?.name ?? accountNav.find((n) => isActive(n.path))?.name ?? ""}
          </div>
          <TopBarRoleMenu />
        </header>

        <div className="app-role-content flex-1 overflow-y-auto">
          <ProfileCompletionBanner role="collaborator" profilePath="/collaborator/profile" />
          <NextBestActionNote role="collaborator" />
          <Outlet />
        </div>
      </main>

      <Toaster richColors position="bottom-right" />

      {/* Havi — AI build companion (founders & collaborators only) */}
      <Havi
        role="collaborator"
        userName={displayName.split(" ")[0]}
        route={location.pathname}
        profileContext={haviContext}
      />
    </div>
  );
}

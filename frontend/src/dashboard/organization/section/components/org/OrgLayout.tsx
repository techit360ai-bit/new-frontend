import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  GraduationCap,
  UserSearch,
  Brain,
  BarChart3,
  ShoppingBag,
  Rocket,
  MessageSquare,
  Plug,
  CreditCard,
  Settings as SettingsIcon,
  Trophy,
  Gauge,
  Rss,
  UserCircle,
  ArrowLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  Ticket,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useOrgProfile } from "@/contexts/UserContext";
import { roleDashboardPath, writeStoredActiveRole } from "@/lib/roleRoutes";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";
import { RoleMobileMenu } from "@/components/RoleMobileMenu";
import { NextBestActionNote } from "@/components/authorization/NextBestActionNote";

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  external?: boolean;
  group?: "main" | "extra";
}

const navigation: NavItem[] = [
  { name: "Dashboard", path: "/org/dashboard", icon: LayoutDashboard },
  { name: "Intelligence", path: "/org/intelligence", icon: Gauge },
  { name: "Teams", path: "/org/teams", icon: Users },
  { name: "Projects", path: "/org/projects", icon: FolderKanban },
  { name: "Incubator Programs", path: "/org/incubator", icon: GraduationCap },
  { name: "Hackathons", path: "/org/hackathons", icon: Trophy },
  { name: "Talent Pool", path: "/org/talent", icon: UserSearch },
  { name: "AI Operations", path: "/org/ai-ops", icon: Brain },
  { name: "Analytics", path: "/org/analytics", icon: BarChart3 },
  { name: "Marketplace", path: "/org/marketplace", icon: ShoppingBag },
  { name: "Market Ready", path: "/org/market-ready", icon: Rocket },
  { name: "Hangout", path: "/org/hangout", icon: MessageSquare },
  { name: "Feed", path: "/feed", icon: Rss, external: true },
  { name: "Integrations", path: "/org/integrations", icon: Plug },
  { name: "Plugins", path: "/plugins", icon: Plug },
  { name: "Billing & Usage", path: "/org/billing", icon: CreditCard },
  { name: "Settings", path: "/org/settings", icon: SettingsIcon },
  { name: "Privacy & Compliance", path: "/compliance", icon: Scale },
  { name: "Support", path: "/support", icon: Ticket, external: true },
];

export function OrgLayout() {
  const location = useLocation();
  const { orgProfile } = useOrgProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    writeStoredActiveRole("org");
  }, []);

  const isActive = (path: string) =>
    path === "/org/hackathons"
      ? location.pathname.startsWith("/org/hackathons")
      : path === "/org/intelligence"
        ? location.pathname.startsWith("/org/intelligence")
        : location.pathname === path;

  const planLabel =
    orgProfile.plan === "enterprise"
      ? "Enterprise Plan"
      : orgProfile.plan === "growth"
        ? "Growth Plan"
        : "Free Plan";

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          active
            ? "bg-role-organization-soft text-role-organization"
            : "text-text-secondary hover:bg-background-primary"
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium flex-1">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-background-primary">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex lg:flex-col bg-surface-primary border-r border-border-default transition-[width] duration-200 ${sidebarCollapsed ? "w-20 [&_nav_span]:hidden" : "w-64"}`}>
        <div className="p-6 border-b border-border-default">
          <button onClick={() => setSidebarCollapsed((value) => !value)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="mb-3 rounded-lg p-2 text-text-muted hover:bg-surface-secondary hover:text-role-organization">
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          {!sidebarCollapsed && <>
          <Link
            to={roleDashboardPath.org}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-role-organization transition-colors mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to TechIT
          </Link>
          <h1 className="text-2xl font-bold text-role-organization">TECHIT</h1>
          <p className="text-sm text-text-muted mt-1">Organization Portal</p>
          </>}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigation.map(renderNavItem)}
          <Link
            to="/org/profile"
            onClick={() => setMobileMenuOpen(false)}
        className={`app-nav-link flex items-center gap-3 px-4 transition-colors ${
              location.pathname === "/org/profile"
                ? "bg-role-organization-soft text-role-organization"
                : "text-text-secondary hover:bg-background-primary"
            }`}
          >
            <UserCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Profile</span>
          </Link>
        </nav>

        {!sidebarCollapsed && <div className="p-4 border-t border-border-default">
          <Link
            to="/org/billing"
            className="block bg-role-organization-soft hover:bg-role-organization-muted rounded-lg p-4 group transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-role-organization-strong truncate">
                  {orgProfile.orgName}
                </p>
                <p className="text-xs text-role-organization mt-1">{planLabel}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-role-organization group-hover:text-role-organization-hover transition-colors flex-shrink-0 ml-2" />
            </div>
          </Link>
        </div>}
      </aside>

      <RoleMobileMenu
        brand="TECHIT"
        title="Organization Portal"
        open={mobileMenuOpen}
        onToggle={() => setMobileMenuOpen((value) => !value)}
        onNavigate={() => setMobileMenuOpen(false)}
        backPath={roleDashboardPath.org}
        items={[...navigation, { name: "Profile", path: "/org/profile", icon: UserCircle }].map((item) => ({
          label: item.name,
          path: item.path,
          icon: item.icon,
          active: item.path === "/org/profile" ? location.pathname === item.path : isActive(item.path),
        }))}
        primaryItems={[navigation[0], navigation[1], navigation[12], navigation[2], navigation[3]].map((item) => ({ label: item.name, path: item.path, icon: item.icon, active: isActive(item.path) }))}
        headerActions={<><Link to="/support" className="app-touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open support tickets"><Ticket className="h-5 w-5" /></Link><Link to="/org/profile" className="app-touch-target inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open profile"><UserCircle className="h-5 w-5" /></Link></>}
      />

      {/* Main Content */}
      <main className="app-role-content flex-1 overflow-y-auto pt-14 lg:pt-0">
        <ProfileCompletionBanner role="organisation" profilePath="/org/profile" />
        <NextBestActionNote role="organisation" />
        <Outlet />
      </main>
    </div>
  );
}

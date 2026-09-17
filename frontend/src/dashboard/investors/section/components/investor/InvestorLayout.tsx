import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Radar,
  LineChart,
  Eye,
  Wallet,
  Globe,
  Database,
  Shield,
  ShieldCheck,
  Award,
  Rss,
  GraduationCap,
  ArrowLeft,
  UserCircle,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  MessageSquare,
  Ticket,
} from 'lucide-react';
import { useInvestorProfile } from '@/contexts/UserContext';
import { roleDashboardPath, writeStoredActiveRole } from '@/lib/roleRoutes';
import { ProfileCompletionBanner } from '@/components/ProfileCompletionBanner';
import { RoleMobileMenu } from '@/components/RoleMobileMenu';
import { NextBestActionNote } from '@/components/authorization/NextBestActionNote';
import { ContinuousIntelligencePanel } from '@/components/intelligence/ContinuousIntelligencePanel';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  external?: boolean;
  comingSoon?: boolean;
}

export function InvestorLayout() {
  const location = useLocation();
  const { investorProfile } = useInvestorProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    writeStoredActiveRole('investor');
  }, []);

  const navItems: NavItem[] = [
    { path: '/investor', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/investor/deal-intelligence', label: 'Deal Intelligence', icon: Search },
    { path: '/investor/risk-analysis', label: 'Risk Analysis', icon: Radar },
    { path: '/investor/allocation', label: 'Allocation Engine', icon: LineChart },
    { path: '/investor/watchlist', label: 'Watchlist', icon: Eye },
    { path: '/investor/capital-pools', label: 'Capital Pools', icon: Wallet },
    { path: '/investor/heatmap', label: 'Global Heatmap', icon: Globe },
    { path: '/investor/data-rooms', label: 'Data Rooms', icon: Database },
    { path: '/investor/deal-rooms', label: 'Deal Rooms', icon: Shield },
    { path: '/investor/reputation', label: 'Reputation', icon: Award },
    { path: '/investor/profile', label: 'Profile', icon: UserCircle },
    { path: '/investor/trust', label: 'Trust Dashboard', icon: ShieldCheck },
    { path: '/investor/mentorship', label: 'Mentorship Hub', icon: GraduationCap },
    { path: '/workspaces/chat', label: 'Messages', icon: MessageSquare },
    { path: '/support', label: 'Support', icon: Ticket, external: true },
    { path: '/compliance', label: 'Privacy & Compliance', icon: Scale },
    // Cross-section
    { path: '/feed', label: 'Feed', icon: Rss, external: true },
  ];

  const isActive = (path: string) => {
    if (path === '/investor') {
      return location.pathname === '/investor' || location.pathname === '/investor/dashboard';
    }
    if (path === '#' || path === '/feed') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-background-inverse text-text-on-inverse">
      {/* Sidebar */}
      <aside className={`hidden lg:flex bg-surface-inverse border-r border-border-inverse flex-col transition-[width] duration-200 ${sidebarCollapsed ? "w-20 [&_nav_span]:hidden" : "w-64"}`}>
        <div className="p-6 border-b border-border-inverse">
          <button onClick={() => setSidebarCollapsed((value) => !value)} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="mb-3 rounded-lg p-2 text-text-on-inverse-muted hover:bg-surface-inverse-muted hover:text-role-investor">
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
          {!sidebarCollapsed && <>
          <h1 className="text-2xl font-bold text-white">
            TECH<span className="text-role-investor">IT</span>
          </h1>
          <p className="text-xs text-text-on-inverse-muted mt-1 font-mono">INVESTOR INTELLIGENCE</p>
          </>}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const baseClass = `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              active
                ? 'bg-role-investor/10 text-role-investor border border-role-investor/20'
                : 'text-text-on-inverse-muted hover:text-text-on-inverse-secondary hover:bg-surface-inverse-muted/50'
            }`;

            if (item.comingSoon) {
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  title="Coming soon"
                  className={`${baseClass} w-full text-left opacity-70 cursor-not-allowed`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-inverse-muted text-text-on-inverse-muted font-mono uppercase tracking-wider">
                    Soon
                  </span>
                </button>
              );
            }

            return (
              <Link key={item.path} to={item.path} className={baseClass}>
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {!sidebarCollapsed && <div className="p-4 border-t border-border-inverse space-y-3">
          <Link
            to={roleDashboardPath.investor}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-text-on-inverse-muted hover:text-text-on-inverse-secondary hover:bg-surface-inverse-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to TechIT
          </Link>
          <Link
            to="/investor/profile"
            className="block group px-4 py-3 bg-surface-inverse-muted/50 hover:bg-surface-inverse-muted rounded-lg transition-colors"
            title="Open investor profile"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-text-on-inverse-muted">
                  {investorProfile.investorType || 'Investor'}
                </p>
                <p className="text-sm font-medium text-white mt-0.5 truncate">
                  {investorProfile.location || 'Capital Partners LP'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-on-inverse-disabled group-hover:text-role-investor transition-colors flex-shrink-0 ml-2" />
            </div>
          </Link>
        </div>}
      </aside>

      <RoleMobileMenu
        brand="TECHIT"
        title="Investor Intelligence"
        open={mobileMenuOpen}
        onToggle={() => setMobileMenuOpen((value) => !value)}
        onNavigate={() => setMobileMenuOpen(false)}
        backPath={roleDashboardPath.investor}
        items={navItems.map((item) => ({
          label: item.label,
          path: item.path,
          icon: item.icon,
          active: !item.external && isActive(item.path),
          disabled: item.comingSoon,
          badge: item.comingSoon ? 'Soon' : undefined,
        }))}
        primaryItems={[navItems[0], navItems[1], navItems[15], navItems[12], navItems[4]].map((item) => ({
          label: item.label,
          path: item.path,
          icon: item.icon,
          active: !item.external && isActive(item.path),
        }))}
        headerActions={<>
          <Link to="/workspaces/chat" className="app-touch-target inline-flex items-center justify-center rounded-lg text-text-on-inverse-muted hover:bg-surface-inverse-muted hover:text-white" aria-label="Open messages"><MessageSquare className="h-5 w-5" /></Link>
          <Link to="/support" className="app-touch-target inline-flex items-center justify-center rounded-lg text-text-on-inverse-muted hover:bg-surface-inverse-muted hover:text-white" aria-label="Open support tickets"><Ticket className="h-5 w-5" /></Link>
          <Link to="/investor/profile" className="app-touch-target inline-flex items-center justify-center rounded-lg text-text-on-inverse-muted hover:bg-surface-inverse-muted hover:text-white" aria-label="Open profile"><UserCircle className="h-5 w-5" /></Link>
        </>}
      />

      {/* Main Content */}
      <main className="app-role-content flex-1 overflow-auto pt-14 lg:pt-0">
        <ProfileCompletionBanner role="investor" profilePath="/investor/profile" />
        <NextBestActionNote role="investor" />
        <ContinuousIntelligencePanel role="investor" />
        <Outlet />
      </main>
    </div>
  );
}

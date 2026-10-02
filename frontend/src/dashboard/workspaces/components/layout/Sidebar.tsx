import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Hammer,
  Bot,
  BrainCircuit,
  MessageCircle,
  FolderOpen,
  BarChart3,
  ChevronLeft,
  Github,
  ArrowLeft,
  Plug,
  Code2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { roleSafeReturnPath } from '@/lib/roleRoutes';
import { useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  glow?: boolean;
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  const returnPath = roleSafeReturnPath({
    currentPath: location.pathname,
    profileRole: profile?.role ?? null,
    secondaryRoles: profile?.secondaryRoles ?? null,
  });

  const navItems: NavItem[] = [
    { path: '/workspaces/build', label: 'Build', icon: <Hammer className="w-5 h-5" /> },
    { path: `/workspaces/code${location.search}`, label: 'Code', icon: <Code2 className="w-5 h-5" />, glow: true },
    { path: '/workspaces/connectors', label: 'Connectors', icon: <Plug className="w-5 h-5" /> },
    { path: '/workspaces/agents', label: 'Agents', icon: <Bot className="w-5 h-5" />, glow: true },
    { path: `/workspaces/copilot${location.search}`, label: 'AI Copilot', icon: <BrainCircuit className="w-5 h-5" />, glow: true },
    { path: '/workspaces/chat', label: 'Team Chat', icon: <MessageCircle className="w-5 h-5" /> },
    { path: '/workspaces/files', label: 'Files', icon: <FolderOpen className="w-5 h-5" /> },
    { path: '/workspaces/github', label: 'GitHub', icon: <Github className="w-5 h-5" /> },
    { path: '/workspaces/reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <aside 
      className={`${isCollapsed ? 'w-[72px]' : 'w-[240px]'} bg-brand-secondary text-white flex flex-col transition-all duration-300 max-md:w-full max-md:h-auto max-md:flex-row max-md:overflow-x-auto md:h-[calc(100vh-60px)]`}
    >
      {/* Logo/Branding */}
      <div className="p-6 flex items-center justify-between max-md:hidden">
        {!isCollapsed && (
          <div>
            <div className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              TechIT
            </div>
            <div className="text-xs text-text-disabled">Workspace</div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-surface-primary/10 rounded-lg transition-colors ml-auto"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 max-md:flex max-md:min-w-max max-md:gap-1 max-md:py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group ${
                isActive
                  ? 'bg-surface-primary/10 border-l-4 border-brand-primary'
                  : 'hover:bg-surface-primary/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`${item.glow ? 'relative' : ''}`}>
                  {item.icon}
                  {item.glow && (
                    <div className="absolute inset-0 blur-md bg-brand-primary opacity-50 animate-pulse" />
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge className="bg-status-warning text-white text-xs px-1.5 min-w-[20px] h-5 flex items-center justify-center">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-status-warning rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <Link
          to={returnPath}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-on-inverse-secondary hover:text-white hover:bg-surface-primary/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {!isCollapsed && <span>Back to TechIT</span>}
        </Link>
        {!isCollapsed && (
          <div className="bg-gradient-to-r from-brand-primary/20 to-status-pending/20 p-4 rounded-lg border border-brand-primary/30">
            <div className="text-sm font-semibold mb-1">Human-controlled AI</div>
            <div className="text-xs text-text-on-inverse-secondary">
              Agents may draft and recommend. You approve consequential actions.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

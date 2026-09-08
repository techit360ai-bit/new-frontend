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
  Sparkles,
  ShieldCheck,
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
  ai?: boolean;
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
    { path: '/workspaces/build', label: 'Build', icon: <Hammer className="w-4 h-4" /> },
    { path: `/workspaces/code${location.search}`, label: 'Code', icon: <Code2 className="w-4 h-4" />, ai: true },
    { path: '/workspaces/connectors', label: 'Connectors', icon: <Plug className="w-4 h-4" /> },
    { path: '/workspaces/agents', label: 'Agents', icon: <Bot className="w-4 h-4" />, ai: true },
    { path: `/workspaces/copilot${location.search}`, label: 'AI Copilot', icon: <BrainCircuit className="w-4 h-4" />, ai: true },
    { path: '/workspaces/chat', label: 'Team Chat', icon: <MessageCircle className="w-4 h-4" /> },
    { path: '/workspaces/files', label: 'Files', icon: <FolderOpen className="w-4 h-4" /> },
    { path: '/workspaces/github', label: 'GitHub', icon: <Github className="w-4 h-4" /> },
    { path: '/workspaces/reports', label: 'Reports', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-[72px]' : 'w-[250px]'
      } sticky top-0 md:sticky md:top-[60px] self-start bg-white/90 dark:bg-[#121212]/95 backdrop-blur-xl text-slate-800 dark:text-white flex flex-col transition-all duration-300 max-md:w-full max-md:h-auto max-md:flex-row max-md:overflow-x-auto md:h-[calc(100vh-60px)] border-r border-black/[0.08] dark:border-white/10 shadow-sm z-20 shrink-0`}
    >
      {/* Header Branding & Collapse Toggle */}
      <div className="p-4 flex items-center justify-between border-b border-black/[0.04] dark:border-white/5 max-md:hidden">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20c937] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#20c937]"></span>
            </div>
            <div>
              <div className="text-base font-bold bg-gradient-to-r from-[#0066ff] to-[#58a6ff] bg-clip-text text-transparent leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                TechIT
              </div>
              <div className="text-[11px] font-medium tracking-wide uppercase text-slate-400 dark:text-slate-500">Workspace</div>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="p-1.5 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl transition-all ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-white"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2.5 space-y-1.5 max-md:flex max-md:min-w-max max-md:gap-1 max-md:py-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative group select-none ${
                isActive
                  ? 'bg-gradient-to-r from-[#0066ff]/15 via-[#0066ff]/10 to-transparent text-[#0066ff] dark:text-[#58a6ff] font-semibold border border-[#0066ff]/25 shadow-[0_2px_12px_rgba(0,102,255,0.12)]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active Bar Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-gradient-to-b from-[#0066ff] to-[#58a6ff] rounded-r-full shadow-[0_0_10px_#0066ff]" />
                )}

                {/* Icon Container */}
                <div
                  className={`p-1.5 rounded-lg transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff] shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white'
                  }`}
                >
                  {item.icon}
                </div>

                {/* Label & AI Indicator */}
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.ai && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff] border border-[#0066ff]/20">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI
                      </span>
                    )}
                    {item.badge && (
                      <Badge className="bg-[#20c937] text-white text-xs px-1.5 min-w-[20px] h-5 flex items-center justify-center font-bold">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Collapsed Mode Badges / Dots */}
                {isCollapsed && (
                  <>
                    {isActive && (
                      <div className="absolute right-2 w-1.5 h-1.5 bg-[#0066ff] rounded-full shadow-[0_0_6px_#0066ff]" />
                    )}
                    {item.badge && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#20c937] border-2 border-white dark:border-[#121212] rounded-full" />
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/10 space-y-2.5">
        <Link
          to={returnPath}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Back to Main Hub</span>}
        </Link>
        {!isCollapsed && (
          <div className="bg-gradient-to-br from-[#0066ff]/10 via-[#0066ff]/5 to-transparent p-3 rounded-xl border border-[#0066ff]/20 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#20c937]" />
              Human-Controlled AI
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Agents recommend actions. Consequential changes require your explicit approval.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

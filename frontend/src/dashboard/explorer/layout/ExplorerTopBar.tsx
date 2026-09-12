import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, Sun, Moon, ChevronDown, UserCircle, Settings as SettingsIcon, LogOut, Compass, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveRoles, type Role } from "@/contexts/UserContext";
import { roleDashboardPath, roleOnboardingPath } from "@/lib/roleRoutes";

const roleLabel: Record<Role, string> = {
  founder: "Founder",
  collaborator: "Collaborator",
  investor: "Investor",
  org: "Organization",
};

interface ExplorerTopBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenHavi?: () => void;
}

export function ExplorerTopBar({ isDark, onToggleTheme, onOpenHavi }: ExplorerTopBarProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { activeRoles } = useActiveRoles();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const displayName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}` : "Explorer User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleRoleClick = (role: Role) => {
    setProfileOpen(false);
    if (activeRoles.has(role)) {
      navigate(roleDashboardPath[role]);
    } else {
      navigate(roleOnboardingPath[role]);
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await signOut();
  };

  const notifications = [
    { id: 1, title: "Welcome to TechIT Network!", time: "Just now", read: false },
    { id: 2, title: "3 new startups match your interests", time: "1h ago", read: false },
    { id: 3, title: "Hackathon 'AI Innovators 2026' starts tomorrow", time: "5h ago", read: true },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#121212]/90 sm:px-6">
      {/* Search Input */}
      <div className="flex flex-1 items-center gap-3 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search startups, projects, skills, events..."
            className="h-10 w-full rounded-xl border border-black/[0.08] bg-slate-50 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#58a6ff] dark:focus:bg-white/10"
          />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Havi Assistant Trigger Button */}
        {onOpenHavi && (
          <button
            type="button"
            onClick={onOpenHavi}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 px-3 py-1.5 text-xs font-bold text-purple-600 transition-all hover:from-purple-500/20 hover:to-indigo-500/20 dark:border-purple-400/30 dark:text-purple-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-500 animate-pulse" />
            <span className="hidden sm:inline">Ask Havi</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.06] text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#0066ff] dark:bg-[#58a6ff]" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-black/[0.08] bg-white/95 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#18181b]/95">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/10">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h3>
                  <span className="text-[10px] font-semibold text-[#0066ff] dark:text-[#58a6ff]">2 New</span>
                </div>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl text-xs transition-colors ${
                        n.read ? "bg-transparent text-slate-500 dark:text-slate-400" : "bg-blue-50/50 dark:bg-blue-950/20 text-slate-900 dark:text-white font-medium"
                      }`}
                    >
                      <p>{n.title}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Avatar & Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl border border-transparent p-1 transition-colors hover:border-black/[0.06] hover:bg-slate-100 dark:hover:border-white/10 dark:hover:bg-white/10"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-xs font-black text-white shadow-md">
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{displayName}</div>
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">Explorer</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-white/40" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-black/[0.08] bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#18181b]/95">
                <div className="px-3 py-2 border-b border-black/[0.06] dark:border-white/10">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Explorer Mode Active</p>
                </div>

                <div className="py-2 border-b border-black/[0.06] dark:border-white/10">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Switch Mode</p>
                  {(["founder", "collaborator", "investor", "org"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleClick(r)}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg"
                    >
                      <span>{roleLabel[r]}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {activeRoles.has(r) ? "Active" : "Activate"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); navigate("/explore/profile"); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg"
                  >
                    <UserCircle className="h-4 w-4" />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); navigate("/explore/settings"); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-lg mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

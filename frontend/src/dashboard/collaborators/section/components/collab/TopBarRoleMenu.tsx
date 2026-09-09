import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, UserCircle, Settings as SettingsIcon, LogOut, Check } from "lucide-react";
import { useUser, useActiveRoles, type Role } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { roleDashboardPath, roleOnboardingPath } from "@/lib/roleRoutes";

const roleLabel: Record<Role, string> = {
  founder: "Founder",
  collaborator: "Collaborator",
  investor: "Investor",
  org: "Organization",
};

export function TopBarRoleMenu({ isDark = false }: { isDark?: boolean }) {
  const navigate = useNavigate();
  const { collaboratorProfile } = useUser();
  const { signOut } = useAuth();
  const { activeRoles, currentRole } = useActiveRoles();
  const [open, setOpen] = useState(false);

  const displayName = collaboratorProfile.name || "Collaborator";
  const disciplineLabel = collaboratorProfile.discipline || "Contributor";
  const initials = displayName.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

  const handleRoleClick = (role: Role) => {
    setOpen(false);
    if (activeRoles.has(role)) navigate(roleDashboardPath[role]);
    else                       navigate(roleOnboardingPath[role]);
  };

  const handleLogout = async () => { setOpen(false); await signOut(); };

  return (
    <div className="relative font-bricolage">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all duration-300 border border-transparent group ${
          isDark ? "hover:bg-white/[0.06] hover:border-white/10" : "hover:bg-[#f5f8ff] hover:border-[#0066ff]/10"
        }`}>
        
        <div className="text-right hidden md:block">
          <div className={`text-sm font-bold leading-tight transition-colors ${
            isDark ? "text-white group-hover:text-[#58a6ff]" : "text-[#171330] group-hover:text-[#0066ff]"
          }`}>{displayName}</div>
          <div className={`text-[10px] font-bold uppercase tracking-widest ${
            isDark ? "text-white/40" : "text-[#171330]/40"
          }`}>{disciplineLabel}</div>
        </div>
        
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-white font-black flex items-center justify-center text-sm shadow-[0_4px_12px_rgba(0,102,255,0.3)] group-hover:shadow-[0_4px_16px_rgba(0,102,255,0.4)] transition-all duration-300">
          {initials}
        </div>
        
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
          open ? (isDark ? 'rotate-180 text-[#58a6ff]' : 'rotate-180 text-[#0066ff]') : (isDark ? 'text-white/30' : 'text-[#171330]/30')
        }`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 mt-3 w-72 backdrop-blur-3xl rounded-2xl z-50 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200 ${
            isDark 
              ? "bg-[#181818]/95 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_20px_rgba(0,102,255,0.15)] text-white" 
              : "bg-white/80 border border-[#0066ff]/10 shadow-[0_20px_60px_-15px_rgba(0,102,255,0.2)]"
          }`}>
            
            <div className={`px-5 py-4 border-b ${
              isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.04] bg-gradient-to-b from-[#f5f8ff]/50 to-transparent"
            }`}>
              <div className={`font-black text-base ${isDark ? "text-white" : "text-[#171330]"}`}>{displayName}</div>
              <div className="text-[10px] font-bold text-[#58a6ff] uppercase tracking-widest mt-1">Collaborator &middot; {disciplineLabel}</div>
            </div>

            <div className="p-2 space-y-0.5">
              <button type="button" onClick={() => { setOpen(false); navigate("/collaborator/profile"); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isDark 
                    ? "text-white/80 hover:bg-white/[0.06] hover:text-[#58a6ff]" 
                    : "text-[#171330]/70 hover:bg-[#0066ff]/[0.06] hover:text-[#0066ff]"
                }`}>
                <UserCircle className={`w-4 h-4 ${isDark ? "text-[#58a6ff]" : "text-[#0066ff]"}`} /> View profile
              </button>
              <button type="button" onClick={() => { setOpen(false); navigate("/collaborator/settings"); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isDark 
                    ? "text-white/80 hover:bg-white/[0.06] hover:text-[#58a6ff]" 
                    : "text-[#171330]/70 hover:bg-[#0066ff]/[0.06] hover:text-[#0066ff]"
                }`}>
                <SettingsIcon className={`w-4 h-4 ${isDark ? "text-[#58a6ff]" : "text-[#0066ff]"}`} /> Settings
              </button>
            </div>

            <div className={`border-t px-5 py-2.5 ${
              isDark ? "border-white/[0.08] bg-white/[0.02] text-white/40" : "border-black/[0.04] bg-[#f5f8ff]/30 text-[#171330]/40"
            }`}>
              <div className="text-[10px] uppercase tracking-widest font-bold">Switch role</div>
            </div>

            <div className="p-2 space-y-0.5">
              {(["founder", "collaborator", "investor", "org"] as Role[]).map((role) => {
                const active = activeRoles.has(role);
                const isCurrent = role === currentRole;
                return (
                  <button key={role} type="button" onClick={() => handleRoleClick(role)} disabled={isCurrent}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:cursor-default ${
                      isCurrent 
                        ? (isDark ? "bg-[#0066ff]/20 text-[#58a6ff]" : "bg-[#0066ff]/[0.06] text-[#0066ff]") 
                        : (isDark ? "hover:bg-white/[0.04] text-white/70" : "hover:bg-black/[0.03] text-[#171330]/70")
                    }`}
                  >
                    <span className={isCurrent ? (isDark ? "text-[#58a6ff]" : "text-[#0066ff]") : (isDark ? "text-white/80" : "text-[#171330]/70")}>{roleLabel[role]}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      {isCurrent ? <span className="text-[#58a6ff] flex items-center gap-1"><Check className="w-3 h-3" /> current</span> 
                                 : active ? <span className="text-[#20c937] flex items-center gap-1"><Check className="w-3 h-3" /> active</span> 
                                 : <span className={isDark ? "text-white/30" : "text-[#171330]/30"}>Activate</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`p-2 border-t ${
              isDark ? "border-white/[0.08] bg-white/[0.02]" : "border-black/[0.04] bg-[#f5f8ff]/30"
            }`}>
              <button type="button" onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 transition-colors ${
                  isDark ? "hover:bg-red-500/10 hover:text-red-400" : "hover:bg-red-50 hover:text-red-600"
                }`}>
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


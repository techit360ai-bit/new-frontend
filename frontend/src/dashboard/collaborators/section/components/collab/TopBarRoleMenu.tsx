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
          isDark ? "hover:bg-white/[0.06] hover:border-white/10" : "hover:bg-slate-100 hover:border-slate-200"
        }`}>
        
        <div className="text-right hidden md:block">
          <div className={`text-sm font-bold leading-tight transition-colors ${
            isDark ? "text-white group-hover:text-[#20C997]" : "text-slate-900 group-hover:text-[#20C997]"
          }`}>{displayName}</div>
          <div className={`text-[10px] font-bold uppercase tracking-widest ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}>{disciplineLabel}</div>
        </div>
        
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#20C997] to-[#128a64] text-slate-950 font-black flex items-center justify-center text-sm shadow-sm transition-all duration-300">
          {initials}
        </div>
        
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${
          open ? "rotate-180 text-[#20C997]" : (isDark ? "text-slate-400" : "text-slate-500")
        }`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 mt-3 w-72 backdrop-blur-3xl rounded-2xl z-50 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200 ${
            isDark 
              ? "bg-[#141414]/95 border border-white/10 shadow-xl text-white" 
              : "bg-white/95 border border-slate-200 shadow-xl text-slate-900"
          }`}>
            
            <div className={`px-5 py-4 border-b ${
              isDark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"
            }`}>
              <div className={`font-black text-base ${isDark ? "text-white" : "text-slate-900"}`}>{displayName}</div>
              <div className="text-[10px] font-bold text-[#20C997] uppercase tracking-widest mt-1">Collaborator &middot; {disciplineLabel}</div>
            </div>

            <div className="p-2 space-y-0.5">
              <button type="button" onClick={() => { setOpen(false); navigate("/collaborator/profile"); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isDark 
                    ? "text-slate-300 hover:bg-white/[0.06] hover:text-[#20C997]" 
                    : "text-slate-700 hover:bg-slate-100 hover:text-[#20C997]"
                }`}>
                <UserCircle className="w-4 h-4 text-[#20C997]" /> View profile
              </button>
              <button type="button" onClick={() => { setOpen(false); navigate("/collaborator/settings"); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isDark 
                    ? "text-slate-300 hover:bg-white/[0.06] hover:text-[#20C997]" 
                    : "text-slate-700 hover:bg-slate-100 hover:text-[#20C997]"
                }`}>
                <SettingsIcon className="w-4 h-4 text-[#20C997]" /> Settings
              </button>
            </div>

            <div className={`border-t px-5 py-2.5 ${
              isDark ? "border-white/10 bg-white/[0.02] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"
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
                        ? (isDark ? "bg-[#20C997]/20 text-[#20C997]" : "bg-[#20C997]/10 text-[#20C997]") 
                        : (isDark ? "hover:bg-white/[0.04] text-slate-300" : "hover:bg-slate-100 text-slate-700")
                    }`}
                  >
                    <span className={isCurrent ? "text-[#20C997]" : (isDark ? "text-slate-300" : "text-slate-700")}>{roleLabel[role]}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      {isCurrent ? <span className="text-[#20C997] flex items-center gap-1"><Check className="w-3 h-3" /> current</span> 
                                 : active ? <span className="text-[#20C997] flex items-center gap-1"><Check className="w-3 h-3" /> active</span> 
                                 : <span className={isDark ? "text-slate-500" : "text-slate-400"}>Activate</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`p-2 border-t ${
              isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50"
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


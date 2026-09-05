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

export function TopBarRoleMenu() {
  const navigate = useNavigate();
  const { founderProfile } = useUser();
  const { signOut } = useAuth();
  const { activeRoles, currentRole } = useActiveRoles();
  const [open, setOpen] = useState(false);

  const displayName = founderProfile.name || "Founder";
  const startupLabel = founderProfile.startupName || "No venture yet";
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
        className="flex items-center gap-3 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/10 group">
        
        <div className="text-right hidden md:block">
          <div className="text-sm font-bold text-white leading-tight">{displayName}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{startupLabel}</div>
        </div>
        
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-white font-black flex items-center justify-center text-sm shadow-[0_0_15px_rgba(0,102,255,0.4)] group-hover:scale-105 transition-transform duration-300">
          {initials}
        </div>
        
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-3 w-72 bg-[#171330]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-50 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-white/10 bg-white/5">
              <div className="font-black text-white text-base">{displayName}</div>
              <div className="text-[10px] font-bold text-[#0066ff] uppercase tracking-widest mt-1">Founder &middot; {startupLabel}</div>
            </div>

            <div className="p-2">
              <button type="button" onClick={() => { setOpen(false); navigate("/founder/profile"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                <UserCircle className="w-4 h-4 text-[#58a6ff]" /> View profile
              </button>
              <button type="button" onClick={() => { setOpen(false); navigate("/founder/settings"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                <SettingsIcon className="w-4 h-4 text-[#58a6ff]" /> Settings
              </button>
            </div>

            <div className="border-t border-white/10 px-5 py-2.5 bg-black/20">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Switch role</div>
            </div>

            <div className="p-2">
              {(["founder", "collaborator", "investor", "org"] as Role[]).map((role) => {
                const active = activeRoles.has(role);
                const isCurrent = role === currentRole;
                return (
                  <button key={role} type="button" onClick={() => handleRoleClick(role)} disabled={isCurrent}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-default hover:bg-white/5">
                    <span className={isCurrent ? "text-white font-bold" : "text-slate-300"}>{roleLabel[role]}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      {isCurrent ? <span className="text-[#20c937] flex items-center gap-1"><Check className="w-3 h-3" /> current</span> 
                                 : active ? <span className="text-[#58a6ff] flex items-center gap-1"><Check className="w-3 h-3" /> active</span> 
                                 : <span className="text-slate-500">Activate</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-white/10 bg-black/20">
              <button type="button" onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

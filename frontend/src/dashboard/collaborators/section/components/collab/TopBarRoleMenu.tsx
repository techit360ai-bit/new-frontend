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
  const { collaboratorProfile } = useUser();
  const { signOut } = useAuth();
  const { activeRoles, currentRole } = useActiveRoles();
  const [open, setOpen] = useState(false);

  const displayName = collaboratorProfile.name || "Collaborator";
  const disciplineLabel = collaboratorProfile.discipline || "Profile incomplete";
  const initials = displayName.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

  const handleRoleClick = (role: Role) => {
    setOpen(false);
    if (activeRoles.has(role)) navigate(roleDashboardPath[role]);
    else                       navigate(roleOnboardingPath[role]);
  };

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-status-warning text-text-primary font-semibold flex items-center justify-center text-sm tabular-nums">
          {initials}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-sm font-medium text-text-primary">{displayName}</div>
          <div className="text-xs text-text-muted">{roleLabel[currentRole]} · {disciplineLabel}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-surface-primary border border-border-default rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle">
              <div className="font-semibold text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted mt-0.5">
                {[roleLabel[currentRole], disciplineLabel, ...collaboratorProfile.subSkills.slice(0, 2)].filter(Boolean).join(" · ")}
              </div>
            </div>

            <button type="button" onClick={() => { setOpen(false); navigate("/collaborator/profile"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-background-primary">
              <UserCircle className="w-4 h-4" /> View profile
            </button>
            <button type="button" onClick={() => { setOpen(false); navigate("/collaborator/settings"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-background-primary">
              <SettingsIcon className="w-4 h-4" /> Settings
            </button>

            <div className="border-t border-border-subtle px-4 py-2">
              <div className="text-xs uppercase tracking-wider text-text-disabled font-semibold">Switch role</div>
            </div>

            {(["founder", "collaborator", "investor", "org"] as Role[]).map((role) => {
              const active = activeRoles.has(role);
              const isCurrent = role === currentRole;
              return (
                <button key={role} type="button" onClick={() => handleRoleClick(role)}
                  disabled={isCurrent}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-background-primary disabled:opacity-50 disabled:cursor-default">
                  <span className="text-text-secondary">{roleLabel[role]}</span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    {isCurrent ? <><Check className="w-3 h-3" /> current</> : active ? <><Check className="w-3 h-3" /> active</> : <>Activate</>}
                  </span>
                </button>
              );
            })}

            <button type="button" onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-status-error hover:bg-status-error-soft border-t border-border-subtle">
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

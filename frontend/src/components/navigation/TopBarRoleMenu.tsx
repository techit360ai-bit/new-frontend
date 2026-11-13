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

const profilePath: Record<Role, string> = {
  founder: "/founder/profile",
  collaborator: "/collaborator/profile",
  investor: "/investor/profile",
  org: "/org/profile",
};

const settingsPath: Record<Role, string> = {
  founder: "/founder/settings",
  collaborator: "/collaborator/settings",
  investor: "/investor/settings",
  org: "/org/settings",
};

export function TopBarRoleMenu() {
  const navigate = useNavigate();
  const { founderProfile, collaboratorProfile, investorProfile, orgProfile } = useUser();
  const { signOut, switchContext, profile } = useAuth();
  const { activeRoles, currentRole } = useActiveRoles();
  const [open, setOpen] = useState(false);

  const profileName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : "";

  // Intelligently compute display name, subtitle, and avatar initials based on active role
  let displayName = "TechIT Member";
  let subtitle = roleLabel[currentRole] || "Member";
  let badgeColor = "bg-primary text-primary-foreground";

  if (currentRole === "founder") {
    displayName = founderProfile?.name || profileName || "Founder";
    subtitle = `Founder · ${founderProfile?.startupName || "No venture yet"}`;
    badgeColor = "bg-role-founder text-white";
  } else if (currentRole === "collaborator") {
    displayName = collaboratorProfile?.name || profileName || "Collaborator";
    subtitle = `Collaborator · ${collaboratorProfile?.discipline || "Contributor"}`;
    badgeColor = "bg-status-warning text-text-primary";
  } else if (currentRole === "investor") {
    displayName = investorProfile?.investorType || profileName || "Investor";
    subtitle = `Investor · ${investorProfile?.location || "Capital Partner"}`;
    badgeColor = "bg-role-investor text-white";
  } else if (currentRole === "org") {
    displayName = orgProfile?.orgName || profileName || "Organization";
    subtitle = `Organization · ${orgProfile?.orgType || "Enterprise"}`;
    badgeColor = "bg-role-organization text-white";
  }

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "TI";

  const handleRoleClick = (role: Role) => {
    setOpen(false);
    const authRole = role === "org" ? "organisation" : role;
    if (activeRoles.has(role)) {
      if (switchContext) {
        void switchContext({ role: authRole as "founder" | "collaborator" | "investor" | "organisation" }).catch(() => {});
      }
      navigate(roleDashboardPath[role]);
    } else {
      navigate(roleOnboardingPath[role]);
    }
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-secondary/70 transition-colors"
        aria-label="User profile and role menu"
      >
        <div className={`w-8 h-8 rounded-full ${badgeColor} font-semibold flex items-center justify-center text-sm tabular-nums`}>
          {initials}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-sm font-medium text-text-primary">{displayName}</div>
          <div className="text-xs text-text-muted">{subtitle}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-surface-primary border border-border-default rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle">
              <div className="font-semibold text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted mt-0.5">{subtitle}</div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(profilePath[currentRole] || "/profile");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-background-primary transition-colors text-left"
            >
              <UserCircle className="w-4 h-4" /> View profile
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(settingsPath[currentRole] || "/settings");
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-background-primary transition-colors text-left"
            >
              <SettingsIcon className="w-4 h-4" /> Settings
            </button>

            <div className="border-t border-border-subtle px-4 py-2">
              <div className="text-xs uppercase tracking-wider text-text-disabled font-semibold">Switch role</div>
            </div>

            {(["founder", "collaborator", "investor", "org"] as Role[]).map((role) => {
              const active = activeRoles.has(role);
              const isCurrent = role === currentRole;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleClick(role)}
                  disabled={isCurrent}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-left ${
                    isCurrent
                      ? "text-primary font-semibold bg-surface-secondary/50 cursor-default"
                      : "text-text-secondary hover:bg-background-primary"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {roleLabel[role]}
                    {!active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted uppercase">
                        Setup
                      </span>
                    )}
                  </span>
                  {isCurrent && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}

            <div className="border-t border-border-subtle mt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-status-error hover:bg-status-error-soft/30 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

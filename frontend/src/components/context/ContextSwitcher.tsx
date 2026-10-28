import { useState } from "react";
import { Check, ChevronDown, Compass, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth, type Role } from "@/contexts/AuthContext";

const labels: Record<Role, string> = {
  explorer: "Explorer",
  founder: "Founder",
  collaborator: "Collaborator",
  investor: "Investor",
  organisation: "Organization",
};

const roleForBackend = (role: Role) => role === "organisation" ? "organization" : role;
const onboardingPath: Partial<Record<Role, string>> = { founder: "/founder/onboarding/step-1", collaborator: "/collaborator/onboarding/step-1", investor: "/investor/onboarding/step-1", organisation: "/org/onboarding/step-1" };

export function ContextSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user, profile, activeContext, roleAssignments, contextLoading, switchContext, activateRole } = useAuth();
  if (!user) return null;

  // Context authorization is server-owned. These fallbacks are display-only so
  // the shell never labels a registered founder/investor as Explorer while the
  // context request is still resolving or when an older session has no context.
  const routeRole: Role | null = location.pathname.startsWith("/founder") || location.pathname === "/dashboard"
    ? "founder"
    : location.pathname.startsWith("/collaborator")
      ? "collaborator"
      : location.pathname.startsWith("/investor")
        ? "investor"
        : location.pathname.startsWith("/org")
          ? "organisation"
          : null;
  const current = activeContext?.role || profile?.role || routeRole || "explorer";
  const activeRoles = roleAssignments.filter((assignment) => assignment.status === "active");
  const hasMultipleContexts = activeRoles.length > 1;

  if (contextLoading) {
    return (
      <div className="rounded-lg border border-border-default bg-card px-3 py-2 text-sm text-text-muted" aria-live="polite">
        Loading context...
      </div>
    );
  }

  if (!hasMultipleContexts) return null;

  const choose = async (role: Role, active: boolean) => {
    if (!active) {
      if (role === "explorer") return;
      const activated = await activateRole(roleForBackend(role) as Role);
      if (activated.error) return;
    }
    const switched = await switchContext({ role: roleForBackend(role) as Role });
    setOpen(false);
    if (!switched.error) {
      if (role === "explorer") navigate("/explore");
      else navigate(onboardingPath[role] || "/explore");
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-border-default bg-card px-3 py-2 text-left text-sm text-text-primary hover:border-accent-primary">
        <Compass className="h-4 w-4 text-accent-primary" />
        <span>{labels[current] || "Explorer"}</span>
        <ChevronDown className="h-4 w-4 text-text-muted" />
      </button>
      {open && <>
        <button type="button" aria-label="Close context menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
        <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-border-default bg-card shadow-xl">
          <div className="border-b border-border-default px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Operating context</p>
            <p className="mt-1 text-sm text-text-primary">{labels[current] || "Explorer"}</p>
          </div>
          {(["explorer", "founder", "collaborator", "investor", "organisation"] as Role[]).map((role) => {
            const assignment = roleAssignments.find((item) => item.role === role);
            const active = assignment?.status === "active" || role === "explorer";
            const isCurrent = current === role;
            return <button key={role} type="button" disabled={contextLoading || isCurrent} onClick={() => void choose(role, active)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm text-text-primary hover:bg-muted disabled:cursor-default disabled:opacity-60">
              <span className="flex items-center gap-2">{!active && <Plus className="h-4 w-4 text-text-muted" />}{labels[role]}</span>
              <span className="flex items-center gap-1 text-xs text-text-muted">{isCurrent ? <><Check className="h-3 w-3" /> current</> : active ? "Switch" : "Activate"}</span>
            </button>;
          })}
        </div>
      </>}
    </div>
  );
}

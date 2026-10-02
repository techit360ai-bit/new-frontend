import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Building2, Plus, Rocket, Users, X } from "lucide-react";
import { useAuth, type Role } from "@/contexts/AuthContext";

const roleOptions: Array<{ role: Exclude<Role, "explorer">; label: string; description: string; path: string; icon: typeof Rocket }> = [
  { role: "founder", label: "Founder", description: "Build and operate a venture", path: "/founder/onboarding/step-1", icon: Rocket },
  { role: "collaborator", label: "Collaborator", description: "Contribute skills to teams", path: "/collaborator/onboarding/step-1", icon: Users },
  { role: "investor", label: "Investor", description: "Discover and evaluate ventures", path: "/investor/onboarding/step-1", icon: BriefcaseBusiness },
  { role: "organisation", label: "Organization", description: "Represent an organization", path: "/org/onboarding/step-1", icon: Building2 },
];

export function RoleAdditionPanel() {
  const navigate = useNavigate();
  const { profile, roleAssignments, activateRole, switchContext } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeRoles = useMemo(() => new Set<Role>([
    ...(profile?.role ? [profile.role] : []),
    ...(profile?.secondaryRoles ?? []),
    ...roleAssignments.filter((item) => item.status === "active").map((item) => item.role),
  ]), [profile?.role, profile?.secondaryRoles, roleAssignments]);
  const available = roleOptions.filter((item) => !activeRoles.has(item.role));

  const addRole = async (role: Exclude<Role, "explorer">, path: string) => {
    setBusy(role);
    setError(null);
    const activated = await activateRole(role);
    if (activated.error) {
      setError(activated.error.message);
      setBusy(null);
      return;
    }
    const switched = await switchContext({ role });
    if (switched.error) {
      setError(switched.error.message);
      setBusy(null);
      return;
    }
    setOpen(false);
    setBusy(null);
    navigate(path);
  };

  if (!available.length) return null;

  return (
    <section className="border border-border-default bg-surface-primary rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-text-muted">Your TechIT roles</p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">One account, more ways to participate</h2>
          <p className="mt-1 text-sm text-text-muted">Add another role without creating a second account. The short setup captures only the essentials; complete the rest in that profile.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border-strong px-3 py-2 text-sm font-semibold text-text-primary hover:border-accent-primary">
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {open ? "Close" : "Add role"}
        </button>
      </div>
      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {available.map(({ role, label, description, path, icon: Icon }) => (
            <button key={role} type="button" disabled={busy !== null} onClick={() => void addRole(role, path)} className="flex items-center gap-3 rounded-lg border border-border-default p-3 text-left hover:border-accent-primary hover:bg-background-primary disabled:opacity-60">
              <Icon className="h-5 w-5 shrink-0 text-accent-primary" />
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-text-primary">{label}</span><span className="block text-xs text-text-muted">{description}</span></span>
              <span className="text-xs text-text-muted">{busy === role ? "Opening…" : "Add"}</span>
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-status-error">{error}</p>}
    </section>
  );
}

export type RouteGuardRole = "founder" | "collaborator" | "investor" | "organisation";

const ROLE_HOME: Record<RouteGuardRole, string> = {
  founder: "/dashboard",
  collaborator: "/collaborator/dashboard",
  investor: "/investor/dashboard",
  organisation: "/org/dashboard",
};

export function setupPathFor(role: RouteGuardRole) {
  if (role === "organisation") return "/org/setup";
  return `/${role}/setup`;
}

export function homePathFor(role: RouteGuardRole) {
  return ROLE_HOME[role];
}

export function authRedirectPath({
  loading,
  hasUser,
  currentPath,
}: {
  loading: boolean;
  hasUser: boolean;
  currentPath: string;
}) {
  if (loading || hasUser) return null;
  return { to: "/signin", state: { from: currentPath } };
}

export function roleRedirectPath({
  loading,
  hasUser,
  profileRole,
  allowed,
  currentPath,
}: {
  loading: boolean;
  hasUser: boolean;
  profileRole: RouteGuardRole | null;
  allowed: RouteGuardRole[];
  currentPath: string;
}) {
  if (loading) return null;
  if (!hasUser) return { to: "/signin", state: { from: currentPath } };
  if (!profileRole) return { to: "/" };
  if (!allowed.includes(profileRole)) return { to: ROLE_HOME[profileRole] };
  return null;
}

export function authenticatedRedirectPath({
  loading,
  hasUser,
  profileRole,
  isOnboarded,
}: {
  loading: boolean;
  hasUser: boolean;
  profileRole: RouteGuardRole | null;
  isOnboarded: boolean;
}) {
  if (loading || !hasUser || !profileRole) return null;
  return isOnboarded ? ROLE_HOME[profileRole] : setupPathFor(profileRole);
}

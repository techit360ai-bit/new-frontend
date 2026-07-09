import { authRoleDashboardPath, authRoleOnboardingPath } from "@/lib/roleRoutes";

export type RouteGuardRole = "founder" | "collaborator" | "investor" | "organisation";

export function setupPathFor(role: RouteGuardRole) {
  return authRoleOnboardingPath(role);
}

export function homePathFor(role: RouteGuardRole) {
  return authRoleDashboardPath(role);
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
  if (!allowed.includes(profileRole)) return { to: homePathFor(profileRole) };
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
  return isOnboarded ? homePathFor(profileRole) : setupPathFor(profileRole);
}

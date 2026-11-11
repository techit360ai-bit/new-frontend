import { authRoleDashboardPath, authRoleOnboardingPath } from "@/lib/roleRoutes";

export type RouteGuardRole = "explorer" | "founder" | "collaborator" | "investor" | "organisation";

export function setupPathFor(role: RouteGuardRole) {
  if (role === "explorer") return "/explore";
  return authRoleOnboardingPath(role);
}

export function homePathFor(role: RouteGuardRole) {
  if (role === "explorer") return "/explore";
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
  availableRoles,
  isOnboarded = false,
  allowed,
  currentPath,
}: {
  loading: boolean;
  hasUser: boolean;
  profileRole: RouteGuardRole | null;
  availableRoles?: RouteGuardRole[];
  isOnboarded?: boolean;
  allowed: RouteGuardRole[];
  currentPath: string;
}) {
  if (loading) return null;
  if (!hasUser) return { to: "/signin", state: { from: currentPath } };

  const effectiveRoles = availableRoles && availableRoles.length > 0
    ? availableRoles
    : profileRole ? [profileRole] : [];

  if (effectiveRoles.length === 0) return { to: "/" };

  // If the active role matches the allowed route roles, use it;
  // otherwise check if any assigned/secondary role matches.
  const matchedRole = (profileRole && allowed.includes(profileRole))
    ? profileRole
    : allowed.find((r) => effectiveRoles.includes(r));

  if (!matchedRole) {
    const fallbackRole = profileRole || effectiveRoles[0];
    return { to: homePathFor(fallbackRole) };
  }

  const onboardingRoot = setupPathFor(matchedRole).replace(/\/step-1$/, "");
  if (isOnboarded && currentPath.startsWith(onboardingRoot)) {
    return { to: homePathFor(matchedRole) };
  }
  return null;
}

export function authenticatedRedirectPath({
  loading,
  hasUser,
  profileRole,
  isOnboarded,
  lastRoute,
}: {
  loading: boolean;
  hasUser: boolean;
  profileRole: RouteGuardRole | null;
  isOnboarded: boolean;
  lastRoute?: string | null;
}) {
  if (loading || !hasUser || !profileRole) return null;
  if (isSafeRoleRoute(lastRoute, profileRole)) return lastRoute;
  return isOnboarded ? homePathFor(profileRole) : setupPathFor(profileRole);
}

function isSafeRoleRoute(route: string | null | undefined, role: RouteGuardRole) {
  if (!route || !route.startsWith('/') || route.startsWith('//')) return false;
  if (route.startsWith('/admin') || route.startsWith('/login') || route.startsWith('/signin')) return false;
  const roleRoot = role === 'organisation' ? '/organization' : `/${role}`;
  return route.startsWith(roleRoot) || route.startsWith('/feed') || route.startsWith('/workspace');
}

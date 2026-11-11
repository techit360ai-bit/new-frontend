import { useMemo, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { type Role, useAuth } from "@/contexts/AuthContext";
import {
  authenticatedRedirectPath,
  authRedirectPath,
  homePathFor,
  roleRedirectPath,
  setupPathFor,
  type RouteGuardRole,
} from "./routeGuardPaths";

function AuthLoading() {
  return (
    <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center px-6">
      <div className="h-10 w-10 rounded-full border-2 border-[color:var(--primary)] border-t-transparent animate-spin" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const redirect = authRedirectPath({
    loading,
    hasUser: Boolean(user),
    currentPath: location.pathname,
  });

  if (loading) return <AuthLoading />;
  if (redirect) {
    return <Navigate to={redirect.to} replace state={redirect.state} />;
  }

  return <>{children}</>;
}

export function RequireRole({
  allowed,
  children,
}: {
  allowed: Role[];
  children: ReactNode;
}) {
  const { user, profile, activeContext, roleAssignments, loading } = useAuth();
  const location = useLocation();

  const activeRole = (activeContext?.role || profile?.activeRole || profile?.role || null) as RouteGuardRole | null;

  const availableRoles = useMemo(() => {
    const roles = new Set<RouteGuardRole>();
    if (activeRole) roles.add(activeRole);
    if (profile?.role) roles.add(profile.role as RouteGuardRole);
    if (profile?.activeRole) roles.add(profile.activeRole as RouteGuardRole);
    if (activeContext?.role) roles.add(activeContext.role as RouteGuardRole);
    if (Array.isArray(profile?.secondaryRoles)) {
      for (const r of profile.secondaryRoles) {
        if (r) roles.add(r as RouteGuardRole);
      }
    }
    if (Array.isArray(roleAssignments)) {
      for (const a of roleAssignments) {
        if (a.status === "active" && a.role) {
          roles.add(a.role as RouteGuardRole);
        }
      }
    }
    return Array.from(roles);
  }, [activeRole, profile?.role, profile?.activeRole, activeContext?.role, profile?.secondaryRoles, roleAssignments]);

  const redirect = roleRedirectPath({
    loading,
    hasUser: Boolean(user),
    profileRole: activeRole,
    availableRoles,
    isOnboarded: Boolean(profile?.isOnboarded),
    allowed: allowed as RouteGuardRole[],
    currentPath: location.pathname,
  });

  if (loading) return <AuthLoading />;
  if (redirect) {
    return <Navigate to={redirect.to} replace state={redirect.state} />;
  }

  return <>{children}</>;
}

export function RedirectAuthenticated({ children }: { children: ReactNode }) {
  const { user, profile, activeContext, loading } = useAuth();
  const activeRole = (activeContext?.role || profile?.activeRole || profile?.role || null) as RouteGuardRole | null;
  const redirect = authenticatedRedirectPath({
    loading,
    hasUser: Boolean(user),
    profileRole: activeRole,
    isOnboarded: Boolean(profile?.isOnboarded),
    lastRoute: sessionStorage.getItem('techit_last_route'),
  });

  if (loading) return <AuthLoading />;
  if (redirect) {
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}

export {
  authenticatedRedirectPath,
  authRedirectPath,
  homePathFor,
  roleRedirectPath,
  setupPathFor,
};

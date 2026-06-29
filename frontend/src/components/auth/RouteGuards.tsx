import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { type Role, useAuth } from "@/contexts/AuthContext";
import {
  authenticatedRedirectPath,
  authRedirectPath,
  homePathFor,
  roleRedirectPath,
  setupPathFor,
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
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const redirect = roleRedirectPath({
    loading,
    hasUser: Boolean(user),
    profileRole: profile?.role ?? null,
    allowed,
    currentPath: location.pathname,
  });

  if (loading) return <AuthLoading />;
  if (redirect) {
    return <Navigate to={redirect.to} replace state={redirect.state} />;
  }

  return <>{children}</>;
}

export function RedirectAuthenticated({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const redirect = authenticatedRedirectPath({
    loading,
    hasUser: Boolean(user),
    profileRole: profile?.role ?? null,
    isOnboarded: Boolean(profile?.isOnboarded),
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

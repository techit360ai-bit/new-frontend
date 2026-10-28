import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { type Role, useAuth } from "@/contexts/AuthContext";
import Preloader from "@/components/landing-page/Preloader";
import {
  authenticatedRedirectPath,
  authRedirectPath,
  homePathFor,
  roleRedirectPath,
  setupPathFor,
} from "./routeGuardPaths";

function AuthLoading() {
  return <Preloader />;
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
    isOnboarded: Boolean(profile?.isOnboarded),
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

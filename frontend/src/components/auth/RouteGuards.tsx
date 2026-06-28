import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { type Role, useAuth } from "@/contexts/AuthContext";

const ROLE_HOME: Record<Role, string> = {
  founder: "/dashboard",
  collaborator: "/collaborator/dashboard",
  investor: "/investor/dashboard",
  organisation: "/org/dashboard",
};

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

  if (loading) return <AuthLoading />;
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
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

  if (loading) return <AuthLoading />;
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  if (!profile || !allowed.includes(profile.role)) {
    return <Navigate to={profile ? ROLE_HOME[profile.role] : "/"} replace />;
  }

  return <>{children}</>;
}

export function RedirectAuthenticated({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (user && profile) {
    return <Navigate to={profile.isOnboarded ? ROLE_HOME[profile.role] : setupPathFor(profile.role)} replace />;
  }

  return <>{children}</>;
}

export function setupPathFor(role: Role) {
  if (role === "organisation") return "/org/setup";
  return `/${role}/setup`;
}

export function homePathFor(role: Role) {
  return ROLE_HOME[role];
}

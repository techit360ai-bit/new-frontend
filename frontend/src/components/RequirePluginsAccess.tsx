import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Route guard for the Plugins & MCP control panel.
 *
 * The page can invoke tools and approve actions, so it is restricted to the
 * workspace-owner roles that the backend mints into the platform JWT today.
 */
export function RequirePluginsAccess({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center px-6">
        <div className="h-10 w-10 rounded-full border-2 border-[color:var(--primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: "/plugins" }} />;
  }

  const allowed = profile?.role === "founder" || profile?.role === "organisation";

  if (!allowed) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

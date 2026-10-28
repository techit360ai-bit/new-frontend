export const VIEWER_ROLES = ["founder", "collaborator", "investor", "organisation", "community"] as const;
export type ViewerRole = (typeof VIEWER_ROLES)[number];

export function normalizeRole(role: string | null | undefined): ViewerRole {
  const r = (role ?? "").toLowerCase().trim();
  return (VIEWER_ROLES as readonly string[]).includes(r) ? (r as ViewerRole) : "community";
}

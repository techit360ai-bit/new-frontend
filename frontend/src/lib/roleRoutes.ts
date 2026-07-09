// frontend/src/lib/roleRoutes.ts
import type { Role } from "@/contexts/UserContext";

export type AuthRole = Role | "organisation";

export const roleDashboardPath: Record<Role, string> = {
  founder: "/founder/dashboard",
  collaborator: "/collaborator/dashboard",
  investor: "/investor/dashboard",
  org: "/org/dashboard",
};

export const roleOnboardingPath: Record<Role, string> = {
  founder: "/founder/onboarding/step-1",
  collaborator: "/collaborator/onboarding/step-1",
  investor: "/investor/onboarding/step-1",
  org: "/org/onboarding/step-1",
};

const ROLE_PREFIXES: Array<[Role, string]> = [
  ["collaborator", "/collaborator"],
  ["investor", "/investor"],
  ["org", "/org"],
  ["founder", "/founder"],
];

const ROLE_STORAGE_KEY = "techit_active_role";

export function normalizeRole(role: AuthRole | string | null | undefined): Role | null {
  if (role === "founder" || role === "collaborator" || role === "investor" || role === "org") return role;
  if (role === "organisation") return "org";
  return null;
}

export function authRoleDashboardPath(role: AuthRole | string | null | undefined) {
  const normalized = normalizeRole(role);
  return normalized ? roleDashboardPath[normalized] : roleDashboardPath.founder;
}

export function authRoleOnboardingPath(role: AuthRole | string | null | undefined) {
  const normalized = normalizeRole(role);
  return normalized ? roleOnboardingPath[normalized] : roleOnboardingPath.founder;
}

export function roleForPath(pathname: string): Role | null {
  if (pathname === "/dashboard") return "founder";
  if (pathname === "/incubation-hub" || pathname.startsWith("/incubation-hub/")) return "founder";
  if (pathname === "/opportunity-hub" || pathname.startsWith("/opportunity-hub/")) return "founder";
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return "founder";
  if (pathname === "/matches" || pathname.startsWith("/matches/")) return "founder";
  if (pathname.startsWith("/team-workspace/")) return "founder";
  if (pathname.startsWith("/h/")) return "founder";

  for (const [role, prefix] of ROLE_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return role;
  }

  return null;
}

export function readStoredActiveRole(storage: Pick<Storage, "getItem"> | null | undefined = safeLocalStorage()) {
  try {
    return normalizeRole(storage?.getItem(ROLE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredActiveRole(
  role: AuthRole | null | undefined,
  storage: Pick<Storage, "setItem"> | null | undefined = safeLocalStorage(),
) {
  const normalized = normalizeRole(role);
  if (!normalized) return;
  try {
    storage?.setItem(ROLE_STORAGE_KEY, normalized);
  } catch {
    // Ignore storage failures; route guards still provide a deterministic fallback.
  }
}

export function roleSafeHomePath({
  currentPath = "",
  profileRole,
  secondaryRoles,
  activeRole,
}: {
  currentPath?: string;
  profileRole?: AuthRole | string | null;
  secondaryRoles?: readonly (AuthRole | string)[] | null;
  activeRole?: AuthRole | string | null;
} = {}) {
  const allowedRoles = allowedRolesForProfile(profileRole, secondaryRoles);
  const role =
    firstAllowedRole([activeRole, roleForPath(currentPath), profileRole], allowedRoles) ??
    firstRole(allowedRoles) ??
    "founder";
  return roleDashboardPath[role];
}

export function roleSafeReturnPath({
  fallbackRole,
  currentPath = "",
  profileRole,
  secondaryRoles,
}: {
  fallbackRole?: AuthRole | string | null;
  currentPath?: string;
  profileRole?: AuthRole | string | null;
  secondaryRoles?: readonly (AuthRole | string)[] | null;
} = {}) {
  return roleSafeHomePath({
    activeRole: fallbackRole ?? readStoredActiveRole(),
    currentPath,
    profileRole,
    secondaryRoles,
  });
}

function allowedRolesForProfile(
  profileRole: AuthRole | string | null | undefined,
  secondaryRoles: readonly (AuthRole | string)[] | null | undefined,
) {
  const roles = [profileRole, ...(secondaryRoles ?? [])]
    .map(normalizeRole)
    .filter((role): role is Role => Boolean(role));
  return roles.length > 0 ? new Set(roles) : null;
}

function firstAllowedRole(
  candidates: Array<AuthRole | string | null | undefined>,
  allowedRoles: Set<Role> | null,
) {
  for (const candidate of candidates) {
    const role = normalizeRole(candidate);
    if (role && (!allowedRoles || allowedRoles.has(role))) return role;
  }
  return null;
}

function firstRole(roles: Set<Role> | null) {
  return roles?.values().next().value ?? null;
}

function safeLocalStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

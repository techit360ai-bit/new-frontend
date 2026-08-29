import { expect, test } from "vitest";
import {
  authRoleDashboardPath,
  authRoleOnboardingPath,
  normalizeRole,
  readStoredActiveRole,
  roleForPath,
  roleSafeReturnPath,
  writeStoredActiveRole,
} from "./roleRoutes";

test("normalizes auth and UI role names", () => {
  expect(normalizeRole("organisation")).toBe("org");
  expect(normalizeRole("org")).toBe("org");
  expect(normalizeRole("founder")).toBe("founder");
  expect(normalizeRole("unknown")).toBeNull();
});

test("role dashboard and onboarding paths use canonical role routes", () => {
  expect(authRoleDashboardPath("founder")).toBe("/founder/dashboard");
  expect(authRoleDashboardPath("organisation")).toBe("/org/dashboard");
  expect(authRoleOnboardingPath("organisation")).toBe("/org/onboarding/step-1");
});

test("detects role ownership from route paths", () => {
  expect(roleForPath("/dashboard")).toBe("founder");
  expect(roleForPath("/founder/dashboard")).toBe("founder");
  expect(roleForPath("/collaborator/tasks")).toBe("collaborator");
  expect(roleForPath("/investor/deal-rooms")).toBe("investor");
  expect(roleForPath("/org/settings")).toBe("org");
  expect(roleForPath("/feed")).toBeNull();
});

test("stored active roles are validated and normalized", () => {
  expect(readStoredActiveRole({ getItem: () => "organisation" })).toBe("org");
  expect(readStoredActiveRole({ getItem: () => "invalid-role" })).toBeNull();

  let storedValue: string | null = null;
  writeStoredActiveRole("organisation", {
    setItem: (_key, value) => {
      storedValue = value;
    },
  });
  expect(storedValue).toBe("org");
});

test("role-safe return ignores cross-role fallbacks for authenticated profiles", () => {
  expect(roleSafeReturnPath({ fallbackRole: "investor", profileRole: "collaborator" })).toBe(
    "/collaborator/dashboard",
  );
  expect(
    roleSafeReturnPath({
      fallbackRole: "investor",
      profileRole: "founder",
      secondaryRoles: ["investor"],
    }),
  ).toBe("/investor/dashboard");
});

test("role-safe return falls back to path role only when no profile role is available", () => {
  expect(roleSafeReturnPath({ currentPath: "/org/settings" })).toBe("/org/dashboard");
  expect(roleSafeReturnPath({ currentPath: "/org/settings", profileRole: "founder" })).toBe(
    "/founder/dashboard",
  );
});

import { expect, test } from "vitest";
import {
  authenticatedRedirectPath,
  authRedirectPath,
  homePathFor,
  roleRedirectPath,
  setupPathFor,
} from "./routeGuardPaths";

test("role home and setup paths stay aligned with role dashboards", () => {
  expect(homePathFor("founder")).toBe("/founder/dashboard");
  expect(homePathFor("collaborator")).toBe("/collaborator/dashboard");
  expect(homePathFor("investor")).toBe("/investor/dashboard");
  expect(homePathFor("organisation")).toBe("/org/dashboard");

  expect(setupPathFor("founder")).toBe("/founder/onboarding/step-1");
  expect(setupPathFor("collaborator")).toBe("/collaborator/onboarding/step-1");
  expect(setupPathFor("investor")).toBe("/investor/onboarding/step-1");
  expect(setupPathFor("organisation")).toBe("/org/onboarding/step-1");
});

test("RequireAuth redirects anonymous users back to signin with return path", () => {
  expect(authRedirectPath({ loading: true, hasUser: false, currentPath: "/dashboard" })).toBeNull();
  expect(authRedirectPath({ loading: false, hasUser: true, currentPath: "/dashboard" })).toBeNull();
  expect(authRedirectPath({ loading: false, hasUser: false, currentPath: "/investor/dashboard" })).toEqual({
    to: "/signin",
    state: { from: "/investor/dashboard" },
  });
});

test("RequireRole sends anonymous users to signin and wrong roles to their own dashboard", () => {
  expect(roleRedirectPath({
    loading: false,
    hasUser: false,
    profileRole: null,
    allowed: ["investor"],
    currentPath: "/investor/dashboard",
  })).toEqual({ to: "/signin", state: { from: "/investor/dashboard" } });

  expect(roleRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "founder",
    allowed: ["investor"],
    currentPath: "/investor/dashboard",
  })).toEqual({ to: "/founder/dashboard" });

  expect(roleRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "investor",
    allowed: ["investor"],
    currentPath: "/investor/dashboard",
  })).toBeNull();
});

test("RequireRole keeps completed users out of onboarding history", () => {
  expect(roleRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "organisation",
    isOnboarded: true,
    allowed: ["organisation"],
    currentPath: "/org/onboarding/step-5",
  })).toEqual({ to: "/org/dashboard" });

  expect(roleRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "organisation",
    isOnboarded: true,
    allowed: ["organisation"],
    currentPath: "/org/dashboard",
  })).toBeNull();
});

test("RedirectAuthenticated sends users to setup until onboarding is complete", () => {
  expect(authenticatedRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "organisation",
    isOnboarded: false,
  })).toBe("/org/onboarding/step-1");

  expect(authenticatedRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "organisation",
    isOnboarded: true,
  })).toBe("/org/dashboard");

  expect(authenticatedRedirectPath({
    loading: false,
    hasUser: false,
    profileRole: null,
    isOnboarded: false,
  })).toBeNull();
});

test("RequireRole supports role switching and multi-role assignments", () => {
  // A founder who activated and switched to the investor context can access investor dashboard
  expect(roleRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "investor",
    availableRoles: ["investor", "founder"],
    allowed: ["investor"],
    currentPath: "/investor/dashboard",
  })).toBeNull();

  // A user whose active role is investor can also access founder dashboard if founder is in availableRoles
  expect(roleRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "investor",
    availableRoles: ["investor", "founder"],
    allowed: ["founder"],
    currentPath: "/founder/dashboard",
  })).toBeNull();

  // A user with founder and investor roles is rejected when accessing collaborator dashboard
  expect(roleRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "investor",
    availableRoles: ["investor", "founder"],
    allowed: ["collaborator"],
    currentPath: "/collaborator/dashboard",
  })).toEqual({ to: "/investor/dashboard" });

  // A founder who switched to collaborator gets redirected away from collaborator onboarding if onboarded
  expect(roleRedirectPath({
    loading: false,
    hasUser: true,
    profileRole: "collaborator",
    availableRoles: ["collaborator", "founder"],
    isOnboarded: true,
    allowed: ["collaborator"],
    currentPath: "/collaborator/onboarding/step-2",
  })).toEqual({ to: "/collaborator/dashboard" });
});

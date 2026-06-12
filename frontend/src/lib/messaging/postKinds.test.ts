import { test, expect } from "vitest";
import { kindsForRole, KIND_META, GENERIC_KINDS } from "./postKinds";

test("founder and community get generic kinds only", () => {
  expect(kindsForRole("founder")).toEqual(GENERIC_KINDS);
  expect(kindsForRole("community")).toEqual(GENERIC_KINDS);
});

test("collaborator gets generic + collaborator kinds, not other roles'", () => {
  const ks = kindsForRole("collaborator");
  expect(ks).toContain("milestone");
  expect(ks).toContain("role-available");
  expect(ks).not.toContain("investment-signal");
});

test("investor and organisation get their own kinds", () => {
  expect(kindsForRole("investor")).toContain("investment-signal");
  expect(kindsForRole("organisation")).toContain("opportunity-post");
});

test("unknown role falls back to generic only", () => {
  expect(kindsForRole("wizard")).toEqual(GENERIC_KINDS);
});

test("every offered kind has KIND_META", () => {
  const all = [
    ...kindsForRole("collaborator"),
    ...kindsForRole("investor"),
    ...kindsForRole("organisation"),
  ];
  for (const k of all) {
    expect(KIND_META[k]).toBeTruthy();
  }
});

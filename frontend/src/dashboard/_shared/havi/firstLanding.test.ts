import { expect, test } from "vitest";
import { FIRST_LANDING_KEY, claimFirstLanding } from "./firstLanding";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test("claimFirstLanding opens Havi once per role", () => {
  const storage = memoryStorage();
  const now = new Date("2026-07-01T10:00:00Z");

  expect(claimFirstLanding("founder", storage, now)).toBe(true);
  expect(claimFirstLanding("founder", storage, now)).toBe(false);
  expect(claimFirstLanding("collaborator", storage, now)).toBe(true);
  expect(storage.getItem(FIRST_LANDING_KEY("founder"))).toBe(now.toISOString());
});

test("claimFirstLanding fails closed when storage is unavailable", () => {
  expect(claimFirstLanding("founder", null)).toBe(false);
});

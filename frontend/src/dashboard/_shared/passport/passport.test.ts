import { test, expect } from "vitest";
import { deriveBadges } from "./passportBadges";

// deriveBadges input: per-record flags + two rollups.
function rec(o: Partial<{ placement: number; completed: boolean; briefOverall: number; demoShipped: boolean; checkInCount: number }> = {}) {
  return { completed: false, demoShipped: false, checkInCount: 0, ...o };
}

test("champion + podium co-occur for a 1st-place finish", () => {
  const badges = deriveBadges({ records: [rec({ completed: true, placement: 1 })], hackathonsEntered: 1, demosShipped: 0 });
  const ids = badges.map((b) => b.id);
  expect(ids.includes("champion")).toBe(true);
  expect(ids.includes("podium")).toBe(true);
});

test("podium without champion for a 3rd-place finish", () => {
  const ids = deriveBadges({ records: [rec({ completed: true, placement: 3 })], hackathonsEntered: 1, demosShipped: 0 }).map((b) => b.id);
  expect(ids.includes("podium")).toBe(true);
  expect(ids.includes("champion")).toBe(false);
});

test("demo-shipper, serial-builder, strong-brief, consistent fire on their thresholds", () => {
  const ids = deriveBadges({
    records: [rec({ briefOverall: 80, checkInCount: 5 })],
    hackathonsEntered: 3,
    demosShipped: 1,
  }).map((b) => b.id);
  expect(ids.includes("demo-shipper")).toBe(true);
  expect(ids.includes("serial-builder")).toBe(true);
  expect(ids.includes("strong-brief")).toBe(true);
  expect(ids.includes("consistent")).toBe(true);
});

test("no badges for an empty / below-threshold passport", () => {
  const badges = deriveBadges({ records: [rec({ briefOverall: 79, checkInCount: 4 })], hackathonsEntered: 2, demosShipped: 0 });
  expect(badges).toHaveLength(0);
});

test("badge order is stable (catalog order)", () => {
  const ids = deriveBadges({
    records: [rec({ completed: true, placement: 1, briefOverall: 90, checkInCount: 6 })],
    hackathonsEntered: 3,
    demosShipped: 1,
  }).map((b) => b.id);
  expect(ids).toEqual(["champion", "podium", "demo-shipper", "serial-builder", "strong-brief", "consistent"]);
});
